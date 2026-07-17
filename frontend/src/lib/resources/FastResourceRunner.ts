import 'server-only'

import type {
  FunctionalResourceNeed,
  InterpretationContract,
  ResourceContract,
  ResourceServiceContract,
  SourceChannel,
} from '@/lib/contracts'
import { fetchResources } from './fetchResources'
import type { ResourceItem } from './resourceContract'
import { bestRelevantExcerpt, filterRelevantResources, relevanceAnchorsFromUnderstanding } from './resourceRelevance'
import { shouldUseWeb } from './shouldUseWeb'

export type FastResourceRunnerResult = {
  resources: ResourceContract[]
  duration_ms: number
  status: 'skipped' | 'ok' | 'empty' | 'timeout' | 'failed'
  note_fr: string
  provider: 'none' | 'tavily_fast' | 'legacy_fetch_resources'
  query?: string
  include_domains?: string[]
  timeout_ms: number
}

export type FastResourceRunnerInput = {
  interpretation: InterpretationContract
  resource_plan: ResourceServiceContract
  timeout_ms?: number
  max_sources?: number
}

export const MIN_FAST_RESOURCE_TIMEOUT_MS = 3000

type FastSearchPlan = {
  query: string
  include_domains?: string[]
  topic?: 'general' | 'news'
  label: string
}

const COMPANY_DOMAINS = new Set([
  'startup_market',
  'business_strategy',
  'professional',
  'management',
  'product_platform',
  'technology_ai',
])

const SOURCE_NEED_PREFIX = 'source_need:'

function sourceNeedsFromInterpretation(interpretation: InterpretationContract): string[] {
  return interpretation.signals
    .map((signal) => signal.trim())
    .filter((signal) => signal.toLowerCase().startsWith(SOURCE_NEED_PREFIX))
    .map((signal) => signal.slice(SOURCE_NEED_PREFIX.length).trim().toLowerCase())
    .filter(Boolean)
}

function needsOfficialOrLegalEvidence(input: FastResourceRunnerInput): boolean {
  return sourceNeedsFromInterpretation(input.interpretation)
    .some((need) => /official|government|public|regulation|regulatory|legal|law|text|policy/.test(need))
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | 'timeout'> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve('timeout'), timeoutMs)
    promise
      .then((value) => resolve(value))
      .catch(() => resolve([] as T))
      .finally(() => clearTimeout(timeout))
  })
}

async function fetchWithAbort(url: string, init: RequestInit, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function host(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function channelFromItem(item: ResourceItem): SourceChannel {
  const source = `${item.source} ${item.url} ${item.reliability ?? ''}`.toLowerCase()
  if (/\b(gov|senate|congress|court|justice|europa|who|oms|has|sec|fed)\b/.test(source)) return 'official'
  if (/\b(reuters|apnews|associated press|afp|bbc|france24|lemonde|nytimes)\b/.test(source)) return 'news_agency'
  if (/\b(arxiv|pubmed|nature|science|journal|research|university)\b/.test(source)) return 'research'
  if (/\b(linkedin|crunchbase|producthunt|github|company|direct-site)\b/.test(source)) return 'company'
  if (/\b(legal|court|law|justice)\b/.test(source)) return 'legal'
  return 'other'
}

function reliabilityFromItem(item: ResourceItem): ResourceContract['reliability'] {
  const reliability = `${item.reliability ?? ''} ${item.source}`.toLowerCase()
  if (/direct-site|internal-site-brief|site understanding|official|tavily:extract/.test(reliability)) return 'primary'
  if (/reuters|ap|afp|brave|openai-web-search|tavily|web-search/.test(reliability)) return 'secondary'
  if (/social|forum|reddit|x\.com|twitter/.test(reliability)) return 'signal'
  return 'unknown'
}

function domainsForChannels(channels: SourceChannel[]): string[] {
  const domains = new Set<string>()
  for (const channel of channels) {
    if (channel === 'official') {
      [
        'legifrance.gouv.fr',
        'service-public.fr',
        'ecologie.gouv.fr',
        'agriculture.gouv.fr',
        'economie.gouv.fr',
        'europa.eu',
        'who.int',
        'has-sante.fr',
      ].forEach((domain) => domains.add(domain))
    }
    if (channel === 'legal') {
      ['legifrance.gouv.fr', 'conseil-constitutionnel.fr', 'courdecassation.fr', 'justice.gouv.fr'].forEach((domain) => domains.add(domain))
    }
    if (channel === 'health_authority') {
      ['has-sante.fr', 'sante.gouv.fr', 'who.int', 'ema.europa.eu', 'cdc.gov'].forEach((domain) => domains.add(domain))
    }
    if (channel === 'research') {
      ['pubmed.ncbi.nlm.nih.gov', 'arxiv.org', 'nature.com', 'science.org'].forEach((domain) => domains.add(domain))
    }
    if (channel === 'news_agency') {
      ['reuters.com', 'apnews.com', 'afp.com', 'bbc.com', 'lemonde.fr', 'france24.com'].forEach((domain) => domains.add(domain))
    }
    if (channel === 'market') {
      ['cbinsights.com', 'pitchbook.com', 'crunchbase.com', 'dealroom.co', 'statista.com'].forEach((domain) => domains.add(domain))
    }
    if (channel === 'company') {
      ['linkedin.com', 'crunchbase.com', 'producthunt.com', 'dealroom.co', 'businesswire.com'].forEach((domain) => domains.add(domain))
    }
  }
  return Array.from(domains).slice(0, 10)
}

function topicForChannels(channels: SourceChannel[]): FastSearchPlan['topic'] {
  return channels.some((channel) => channel === 'news_agency' || channel === 'local_media')
    ? 'news'
    : 'general'
}

function priorityRank(need: FunctionalResourceNeed): number {
  if (need.priority === 'high') return 0
  if (need.priority === 'medium') return 1
  return 2
}

function functionalNeedPlans(input: FastResourceRunnerInput): FastSearchPlan[] {
  return [...input.resource_plan.functional_needs]
    .sort((a, b) => priorityRank(a) - priorityRank(b))
    .flatMap((need) => {
      const queryCount = need.priority === 'high' ? 2 : 1
      const includeDomains = domainsForChannels(need.channels)
      return need.suggested_queries.slice(0, queryCount).map((query, index) => ({
        query: compactQuery(query, 200),
        include_domains: includeDomains.length > 0 ? includeDomains : undefined,
        topic: topicForChannels(need.channels),
        label: `functional:${need.family}:${need.priority}:${index + 1}`,
      } satisfies FastSearchPlan))
    })
    .filter((plan) => plan.query.length > 0)
    .slice(0, 4)
}

function uniquePlans(plans: FastSearchPlan[]): FastSearchPlan[] {
  const seen = new Set<string>()
  return plans.filter((plan) => {
    const key = `${plan.query}|${(plan.include_domains ?? []).join(',')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sourceDomainsFor(input: FastResourceRunnerInput): string[] {
  if (needsOfficialOrLegalEvidence(input)) {
    return [
      'legifrance.gouv.fr',
      'ecologie.gouv.fr',
      'agriculture.gouv.fr',
      'economie.gouv.fr',
      'service-public.fr',
      'ademe.fr',
      'cre.fr',
    ]
  }

  if (
    input.interpretation.domain === 'geopolitics' ||
    input.interpretation.domain === 'war_security' ||
    input.interpretation.domain === 'institutional_crisis'
  ) {
    return [
      'reuters.com',
      'apnews.com',
      'bbc.com',
      'ft.com',
      'france24.com',
      'lemonde.fr',
      'politico.com',
      'axios.com',
      'aljazeera.com',
      'iaea.org',
      'state.gov',
      'whitehouse.gov',
      'congress.gov',
    ]
  }

  if (COMPANY_DOMAINS.has(input.interpretation.domain)) {
    return [
      'linkedin.com',
      'crunchbase.com',
      'producthunt.com',
      'dealroom.co',
      'techcrunch.com',
      'businesswire.com',
      'github.com',
    ]
  }

  if (input.interpretation.domain === 'science_research' || input.interpretation.domain === 'academic_research') {
    return ['pubmed.ncbi.nlm.nih.gov', 'arxiv.org', 'nature.com', 'science.org', 'researchgate.net']
  }

  return []
}

const GENERIC_SOURCE_SUBJECTS = [
  'la trajectoire de la crise evoquee',
  'la trajectoire de la crise évoquée',
  'la situation evoquee',
  'la situation évoquée',
  'le contexte evoque',
  'le contexte évoqué',
]

function normalizeQueryText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function compactQuery(value: string, max = 180): string {
  return value
    .replace(/\b(je peux avancer|pour la prochaine carte|une phrase suffit|repondez librement|répondez librement)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[?!.;:,\s]+$/g, '')
    .trim()
    .slice(0, max)
}

function isGenericSourceSubject(value?: string): boolean {
  const normalized = normalizeQueryText(String(value ?? '').trim())
  if (!normalized) return true
  return GENERIC_SOURCE_SUBJECTS.some((subject) => normalized.includes(normalizeQueryText(subject)))
}

function isLiveSourceQuestion(input: FastResourceRunnerInput): boolean {
  return shouldUseWeb([
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.header_subject,
  ].filter(Boolean).join(' '))
}

function sourceSubject(input: FastResourceRunnerInput): string {
  if (COMPANY_DOMAINS.has(input.interpretation.domain)) return companySubject(input)

  const rawSituation = compactQuery(input.interpretation.raw_input || input.interpretation.situation_soumise)
  const submitted = compactQuery(input.interpretation.situation_soumise || input.interpretation.raw_input)
  const object = compactQuery(input.interpretation.object_of_analysis || '')
  const header = compactQuery(input.interpretation.header_subject || '')

  if (isLiveSourceQuestion(input) && rawSituation) return rawSituation
  if (!isGenericSourceSubject(object)) return object
  if (submitted) return submitted
  if (!isGenericSourceSubject(header)) return header
  return object || header || submitted || rawSituation
}

function companySubject(input: FastResourceRunnerInput): string {
  const raw = [
    input.interpretation.object_of_analysis,
    input.interpretation.header_subject,
    input.interpretation.situation_soumise,
  ].find((value) => value && value.trim()) ?? ''

  const stopwords = new Set([
    'Que',
    'Qu',
    'Quelle',
    'Quel',
    'Comment',
    'Pourquoi',
    'Faut',
    'Mon',
    'Ma',
    'The',
    'What',
    'Should',
  ])
  const directCompany = raw
    .match(/\b[A-Z][A-Za-z0-9.+-]{2,}(?:\s+[A-Z][A-Za-z0-9.+-]{2,}){0,2}\b/g)
    ?.map((candidate) => candidate.trim())
    .find((candidate) => !stopwords.has(candidate.split(/\s+/)[0]))
  if (directCompany) return directCompany

  return raw
    .replace(/\b(que|fait|compagnie|societe|startup|entreprise|rejoindre|penser|eventuellement|avec|ma|mon|the|company|startup|join|should|what|does)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function fastSearchPlan(input: FastResourceRunnerInput): FastSearchPlan {
  const subject = sourceSubject(input)
  if (needsOfficialOrLegalEvidence(input)) {
    const policyNeed = input.interpretation.missing_evidence_policy || 'sources officielles recentes reglementation cadre legal'
    return {
      query: `${subject} ${policyNeed}`.slice(0, 180),
      include_domains: sourceDomainsFor(input),
      topic: 'general',
      label: 'referent-official-evidence',
    }
  }

  return {
    query: COMPANY_DOMAINS.has(input.interpretation.domain)
      ? `${subject} official site company LinkedIn`.slice(0, 180)
      : subject.slice(0, 180),
    include_domains: sourceDomainsFor(input),
    topic: ['geopolitics', 'war_security', 'institutional_crisis'].includes(input.interpretation.domain)
      ? 'news'
      : 'general',
    label: 'targeted',
  }
}

function broadFastSearchPlan(input: FastResourceRunnerInput): FastSearchPlan {
  const subject = sourceSubject(input)
  if (needsOfficialOrLegalEvidence(input)) {
    return {
      query: [
        subject,
        input.resource_plan.fallback_searches[0] ?? '',
        'texte officiel gouvernement reglementation recente',
      ].filter(Boolean).join(' ').slice(0, 200),
      topic: 'general',
      label: 'referent-official-broad',
    }
  }

  const query = [
    subject,
    COMPANY_DOMAINS.has(input.interpretation.domain)
      ? 'official website customers pricing jobs docs'
      : input.interpretation.domain === 'geopolitics' ||
        input.interpretation.domain === 'war_security' ||
        input.interpretation.domain === 'institutional_crisis'
      ? 'latest reliable sources'
      : 'official sources evidence',
  ].join(' ').slice(0, 200)

  return {
    query,
    topic: ['geopolitics', 'war_security', 'institutional_crisis'].includes(input.interpretation.domain)
      ? 'news'
      : 'general',
    label: 'broad',
  }
}

// La langue du terrain fait partie du théâtre : quand le référent fournit
// des termes dans la langue publique du théâtre (ex. russe), une recherche
// dédiée part dans cette langue — les médias locaux racontent ce que les
// agences internationales résument.
function localLanguagePlan(input: FastResourceRunnerInput): FastSearchPlan | null {
  const terms = (input.interpretation.local_search_terms ?? []).filter(Boolean)
  if (terms.length === 0) return null
  return {
    query: terms.join(' ').slice(0, 200),
    // Index général, pas actualités : l'index news de Tavily est
    // anglophone même interrogé en cyrillique ; l'index général renvoie
    // les médias du pays (mesuré : kommersant.ru, 76.ru, finance.mail.ru).
    topic: 'general',
    label: 'local_language',
  }
}

function executionPlans(input: FastResourceRunnerInput): FastSearchPlan[] {
  const localPlan = localLanguagePlan(input)
  return uniquePlans([
    fastSearchPlan(input),
    ...(localPlan ? [localPlan] : []),
    broadFastSearchPlan(input),
    ...functionalNeedPlans(input),
  ]).slice(0, localPlan ? 5 : 4)
}

export function buildFastResourceSearchPlansForDiagnostics(input: FastResourceRunnerInput): {
  targeted: FastSearchPlan
  broad: FastSearchPlan
  functional: FastSearchPlan[]
  execution: FastSearchPlan[]
  subject: string
} {
  const targeted = fastSearchPlan(input)
  const broad = broadFastSearchPlan(input)
  const functional = functionalNeedPlans(input)
  return {
    targeted,
    broad,
    functional,
    execution: executionPlans(input),
    subject: sourceSubject(input),
  }
}

export function legacyFallbackPlanQueriesForDiagnostics(input: FastResourceRunnerInput): string[] {
  return executionPlans(input).map((plan) => plan.query)
}

async function fetchTavilyFastPlan(
  plan: FastSearchPlan,
  maxSources: number,
  timeoutMs: number,
): Promise<ResourceItem[] | 'transport_failed'> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  const response = await fetchWithAbort(
    'https://api.tavily.com/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: plan.query,
        max_results: maxSources,
        search_depth: 'basic',
        topic: plan.topic,
        include_domains: plan.include_domains,
      }),
    },
    timeoutMs,
  )

  if (!response?.ok) return 'transport_failed'
  const data = await response.json()
  const results = Array.isArray(data.results) ? data.results : []

  return results
    .map((item: Record<string, unknown>) => ({
      title: String(item.title ?? ''),
      url: String(item.url ?? ''),
      type: 'fast-source',
      source: host(String(item.url ?? '')) || 'Tavily',
      excerpt: typeof item.content === 'string' ? item.content : undefined,
      date: typeof item.published_date === 'string' ? item.published_date : undefined,
      reliability: 'tavily:fast',
    }))
    .filter((item: ResourceItem) => item.title && item.url)
}

function toResourceContract(
  item: ResourceItem,
  interpretation: InterpretationContract,
  index: number,
  query: string,
): ResourceContract | null {
  if (!item.title || !item.url) return null
  const excerpt = bestRelevantExcerpt(item, query) || item.excerpt

  return {
    id: `fast-${index + 1}-${host(item.url) || 'source'}`,
    title: item.title,
    url: item.url,
    source: item.source || host(item.url) || 'source publique',
    channel: channelFromItem(item),
    domain_relevance: [interpretation.domain],
    excerpt,
    published_at: item.date,
    retrieved_at: new Date().toISOString(),
    reliability: reliabilityFromItem(item),
  }
}

function uniqueResourceItems(items: ResourceItem[]): ResourceItem[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = item.url || item.title
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function legacyFastFallback(
  query: string,
  timeoutMs: number,
  maxSources: number,
  understandingAnchors?: string[],
): Promise<ResourceItem[] | 'timeout'> {
  const result = await withTimeout(fetchResources(query), Math.max(800, timeoutMs))
  if (result === 'timeout') return 'timeout'
  return uniqueResourceItems(filterRelevantResources(result, query, understandingAnchors)).slice(0, maxSources)
}

async function legacyFastFallbackForPlans(
  plans: FastSearchPlan[],
  timeoutMs: number,
  maxSources: number,
  understandingAnchors?: string[],
): Promise<{ resources: ResourceItem[]; firstHitPlan: FastSearchPlan } | 'timeout'> {
  const usablePlans = plans.filter((plan) => plan.query.trim().length > 0)
  const firstPlan = usablePlans[0] ?? { query: '', label: 'empty' }
  const planResults = await Promise.all(
    usablePlans.map(async (plan) => ({
      plan,
      result: await legacyFastFallback(plan.query, timeoutMs, maxSources, understandingAnchors),
    })),
  )
  const nonTimeoutResults = planResults.filter(
    (entry): entry is { plan: FastSearchPlan; result: ResourceItem[] } => entry.result !== 'timeout',
  )

  if (planResults.length > 0 && nonTimeoutResults.length === 0) return 'timeout'

  const firstHit = nonTimeoutResults.find((entry) => entry.result.length > 0)
  const fallbackQuery = usablePlans.map((plan) => plan.query).join(' ')

  return {
    resources: filterFastResourceResultsByPlanForDiagnostics(
      nonTimeoutResults.map((entry) => entry.result),
      nonTimeoutResults.map((entry) => entry.plan.query),
      fallbackQuery,
      maxSources,
      understandingAnchors,
    ),
    firstHitPlan: firstHit?.plan ?? firstPlan,
  }
}

export function filterFastResourceResultsByPlanForDiagnostics(
  planResults: ResourceItem[][],
  planQueries: string[],
  fallbackQuery: string,
  maxSources: number,
  understandingAnchors?: string[],
): ResourceItem[] {
  const merged = uniqueResourceItems(
    planResults.flatMap((items, index) => {
      const planQuery = planQueries[index] ?? fallbackQuery
      return filterRelevantResources(items, planQuery, understandingAnchors).map((item) => ({
        ...item,
        excerpt: bestRelevantExcerpt(item, planQuery) || item.excerpt,
      }))
    }),
  )
  // L'ancrage temporel exige des faits datés : à pertinence égale, une
  // source datée prime sur une source sans date (tri stable). Et la
  // pluralité des regards prime sur la répétition : un média déjà retenu ne
  // double pas tant que d'autres médias ont des articles pertinents.
  const ordered = [
    ...merged.filter((item) => Boolean(item.date)),
    ...merged.filter((item) => !item.date),
  ]
  const seenHosts = new Set<string>()
  const diverse: ResourceItem[] = []
  const duplicates: ResourceItem[] = []
  for (const item of ordered) {
    const itemHost = host(item.url) || item.source || ''
    if (itemHost && seenHosts.has(itemHost)) {
      duplicates.push(item)
    } else {
      if (itemHost) seenHosts.add(itemHost)
      diverse.push(item)
    }
  }
  return [...diverse, ...duplicates].slice(0, maxSources)
}

export async function runFastResourceRunner(input: FastResourceRunnerInput): Promise<FastResourceRunnerResult> {
  const started = Date.now()
  const timeoutMs = Math.max(input.timeout_ms ?? MIN_FAST_RESOURCE_TIMEOUT_MS, MIN_FAST_RESOURCE_TIMEOUT_MS)
  const maxSources = input.max_sources ?? 3

  if (!input.resource_plan.needs_web) {
    return {
      resources: [],
      duration_ms: Date.now() - started,
      status: 'skipped',
      note_fr: 'Sources rapides non obligatoires pour cette situation.',
      provider: 'none',
      timeout_ms: timeoutMs,
    }
  }

  const fallbackPlan = fastSearchPlan(input)
  const plans = executionPlans(input)
  const primaryPlan = plans[0] ?? fallbackPlan
  // La pertinence s'ancre dans la compréhension du référent (entités,
  // objet d'analyse), pas dans une relecture lexicale de la question.
  const understandingAnchors = relevanceAnchorsFromUnderstanding(input.interpretation)
  const query = [
    input.interpretation.situation_soumise,
    input.resource_plan.fallback_searches[0] ?? '',
    ...plans.map((plan) => plan.query),
  ].filter(Boolean).join(' ')

  if (!process.env.TAVILY_API_KEY) {
    const fallback = await legacyFastFallbackForPlans(plans, timeoutMs, maxSources, understandingAnchors)
    if (fallback === 'timeout') {
      return {
        resources: [],
        duration_ms: Date.now() - started,
        status: 'timeout',
        note_fr: 'Le fallback sources rapides a depasse son budget ; SIS continue avec une lecture prudente.',
        provider: 'legacy_fetch_resources',
        query: primaryPlan.query,
        include_domains: primaryPlan.include_domains,
        timeout_ms: timeoutMs,
      }
    }

    const resources = fallback.resources
      .map((item, index) => toResourceContract(item, input.interpretation, index, query))
      .filter((item): item is ResourceContract => Boolean(item))
      .slice(0, maxSources)

    return {
      resources,
      duration_ms: Date.now() - started,
      status: resources.length > 0 ? 'ok' : 'empty',
      note_fr: resources.length > 0
        ? `Sources rapides attachees via fallback : ${resources.length}.`
        : 'Aucune source rapide exploitable trouvee dans le budget court.',
      provider: 'legacy_fetch_resources',
      query: fallback.firstHitPlan.query,
      include_domains: fallback.firstHitPlan.include_domains,
      timeout_ms: timeoutMs,
    }
  }

  try {
    let planResults = await Promise.all(
      plans.map((plan) => fetchTavilyFastPlan(plan, maxSources, timeoutMs)),
    )
    const allTransportFailed = planResults.length > 0 &&
      planResults.every((result) => result === 'transport_failed')
    if (allTransportFailed) {
      const retry = await fetchTavilyFastPlan(primaryPlan, maxSources, Math.min(timeoutMs, 2500))
      planResults = [retry]
    }
    const resolvedResults = planResults.map((result) => (result === 'transport_failed' ? [] : result))
    const resolvedPlans = allTransportFailed ? [primaryPlan] : plans
    const firstHitIndex = resolvedResults.findIndex((items) => items.length > 0)
    const firstHitPlan = firstHitIndex >= 0 ? resolvedPlans[firstHitIndex] : primaryPlan
    let fast = filterFastResourceResultsByPlanForDiagnostics(
      resolvedResults,
      resolvedPlans.map((plan) => plan.query),
      query,
      maxSources,
      understandingAnchors,
    )
    // Le regard local a un siège garanti : si la recherche en langue du
    // théâtre a rapporté des articles pertinents et qu'aucun n'a survécu au
    // classement, le meilleur d'entre eux remplace la dernière place.
    const localPlanIndex = resolvedPlans.findIndex((plan) => plan.label === 'local_language')
    if (localPlanIndex >= 0 && fast.length > 0) {
      const localItems = filterRelevantResources(
        resolvedResults[localPlanIndex] ?? [],
        resolvedPlans[localPlanIndex].query,
        understandingAnchors,
      )
      const localUrls = new Set(localItems.map((item) => item.url))
      if (localItems.length > 0 && !fast.some((item) => localUrls.has(item.url))) {
        fast = [...fast.slice(0, Math.max(1, fast.length - 1)), localItems[0]]
      }
    }
    const usedLegacyFallback = fast.length === 0 && timeoutMs > 1500
    const result = fast.length > 0 || !usedLegacyFallback
      ? { resources: fast, firstHitPlan }
      : await legacyFastFallbackForPlans(plans, timeoutMs, maxSources, understandingAnchors)

    if (result === 'timeout') {
      return {
        resources: [],
        duration_ms: Date.now() - started,
        status: 'timeout',
        note_fr: 'Le runner sources rapides a depasse son budget ; SIS continue avec une lecture prudente.',
        provider: 'legacy_fetch_resources',
        query: primaryPlan.query,
        include_domains: primaryPlan.include_domains,
        timeout_ms: timeoutMs,
      }
    }

    const resources = result.resources
      .map((item, index) => toResourceContract(
        item,
        input.interpretation,
        index,
        usedLegacyFallback ? result.firstHitPlan.query : query,
      ))
      .filter((item): item is ResourceContract => Boolean(item))
      .slice(0, maxSources)

    return {
      resources,
      duration_ms: Date.now() - started,
      status: resources.length > 0 ? 'ok' : 'empty',
      note_fr: resources.length > 0
        ? `Sources rapides attachees : ${resources.length}.`
        : 'Aucune source rapide exploitable trouvee dans le budget court.',
      provider: usedLegacyFallback ? 'legacy_fetch_resources' : 'tavily_fast',
      query: result.firstHitPlan.query,
      include_domains: result.firstHitPlan.include_domains,
      timeout_ms: timeoutMs,
    }
  } catch {
    return {
      resources: [],
      duration_ms: Date.now() - started,
      status: 'failed',
      note_fr: 'Le runner sources rapides a echoue ; SIS continue avec une lecture prudente.',
      provider: 'tavily_fast',
      query: primaryPlan.query,
      include_domains: primaryPlan.include_domains,
      timeout_ms: timeoutMs,
    }
  }
}
