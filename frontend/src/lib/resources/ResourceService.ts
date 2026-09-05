import type {
  FastResourcePolicy,
  FunctionalResourceNeed,
  InterpretationContract,
  ResourceContract,
  ResourceServiceContract,
  ResourceStatus,
  SituationDomainV2,
} from '../contracts'
import type { HumanCollectivePatternContext } from '../patterns/humanCollective'
import { routeSourcesForDomain } from './SourceRouter'
import { extractQualifiedOptionsFromResources } from './functionalResourceQualification'

export type ResourceServiceInput = {
  interpretation: InterpretationContract
  patterns?: HumanCollectivePatternContext
  supplied_resources?: ResourceContract[]
  now?: Date
}

const URL_PATTERN = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s<>"')]+)?/gi

export function detectUrls(input: string): string[] {
  const matches = input.match(URL_PATTERN) ?? []
  return Array.from(new Set(matches.map((url) => url.trim().replace(/[.,;:!?]+$/, ''))))
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

const FAST_SOURCE_DOMAINS = new Set<SituationDomainV2>([
  'academic_research',
  'business_strategy',
  'climate_energy',
  'cybersecurity',
  'finance_macro',
  'geopolitics',
  'health_body',
  'humanitarian',
  'institutional_crisis',
  'law_justice',
  'ngo_field',
  'product_platform',
  'public_governance',
  'science_research',
  'startup_market',
  'supply_chain',
  'technology_ai',
  'territory_urbanism',
  'war_security',
])

const FAST_SOURCE_TERMS = [
  'actualite',
  'actuel',
  'aujourd hui',
  'derniere',
  'dernier',
  'latest',
  'recent',
  'source',
  'ressource',
  'url',
  'site',
  'entreprise',
  'societe',
  'compagnie',
  'startup',
  'partenariat',
  'concurrent',
  'marche',
  'pricing',
  'offre',
  'produit',
  'revenu',
  'clients',
  'juridique',
  'droit',
  'sante',
  'science',
  'politique',
  'election',
  'guerre',
]

const INTERNAL_CONTEXT_DOMAINS = new Set<SituationDomainV2>([
  'couple',
  'family',
  'management',
  'professional',
  'school_adolescence',
])

const EXPLICIT_EXTERNAL_SOURCE_TERMS = [
  'actualite',
  'actuel',
  'aujourd hui',
  'derniere',
  'dernier',
  'latest',
  'recent',
  'source',
  'ressource',
  'url',
  'site',
  'article',
  'rapport',
  'preuve publique',
]

const SOURCE_NEED_PREFIX = 'source_need:'

function sourceNeedsFromInterpretation(interpretation: InterpretationContract): string[] {
  return interpretation.signals
    .map((signal) => signal.trim())
    .filter((signal) => signal.toLowerCase().startsWith(SOURCE_NEED_PREFIX))
    .map((signal) => signal.slice(SOURCE_NEED_PREFIX.length).trim().toLowerCase())
    .filter(Boolean)
}

function needsOfficialOrLegalEvidence(sourceNeeds: string[]): boolean {
  return sourceNeeds.some((need) => /official|government|public|regulation|regulatory|legal|law|text|policy/.test(need))
}

type FastResourceDecision = {
  policy: FastResourcePolicy
  needs_web: boolean
  reason_fr: string
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function decideFastResourcePolicy(interpretation: InterpretationContract, urls: string[]): FastResourceDecision {
  const sourceNeeds = sourceNeedsFromInterpretation(interpretation)
  if (urls.length > 0) {
    return {
      policy: 'url_extract_required',
      needs_web: true,
      reason_fr: sourceNeeds.length > 0
        ? `Une URL fournie et des besoins de sources explicites du referent doivent etre exploites avant de conclure: ${sourceNeeds.join(', ')}.`
        : 'Une URL fournie doit etre exploitee par extraction ou recherche de domaine avant de conclure.',
    }
  }

  const haystack = normalizeText([
    interpretation.raw_input,
    interpretation.situation_soumise,
    interpretation.object_of_analysis,
    interpretation.user_need,
    interpretation.angle,
  ].join(' '))
  const termRequiresSources = FAST_SOURCE_TERMS.some((term) => haystack.includes(normalizeText(term)))
  const domainRequiresSources = FAST_SOURCE_DOMAINS.has(interpretation.domain)
  const referentRequiresSources = sourceNeeds.length > 0
  const internalContext =
    INTERNAL_CONTEXT_DOMAINS.has(interpretation.domain) &&
    /\b(ma|mon|mes|notre|nos|dans ma|dans mon|dans notre|equipe|reorganisation|conflit interne)\b/.test(haystack) &&
    !EXPLICIT_EXTERNAL_SOURCE_TERMS.some((term) => haystack.includes(normalizeText(term)))

  if (internalContext && !domainRequiresSources) {
    return {
      policy: 'internal_context_ok',
      needs_web: false,
      reason_fr: 'La situation est un contexte interne ou relationnel : elle ne doit pas exiger de sources web sans URL, document ou demande explicite de verification externe.',
    }
  }

  if (domainRequiresSources || termRequiresSources || referentRequiresSources) {
    return {
      policy: 'fast_sources_required',
      needs_web: true,
      reason_fr: referentRequiresSources
        ? `Le referent demande des sources externes avant structuration: ${sourceNeeds.join(', ')}.`
        : 'Le domaine ou la demande depend de faits externes verifiables ; des ressources rapides doivent nourrir Lecture et Approfondir sans bloquer SIS.',
    }
  }

  return {
    policy: 'internal_context_ok',
    needs_web: false,
    reason_fr: 'La situation peut etre traitee par interpretation, theatre reel et patterns internes sans source externe obligatoire.',
  }
}

function statusFor(urls: string[], resources: ResourceContract[], decision: FastResourceDecision): ResourceStatus {
  if (resources.length > 0) {
    return urls.length > 0 && resources.length < urls.length ? 'partial' : 'available'
  }

  if (urls.length > 0) return 'partial'
  if (decision.needs_web) return 'partial'

  return 'not_needed'
}

function priorityFrom(value = 0): FunctionalResourceNeed['priority'] {
  if (value >= 3) return 'high'
  if (value >= 1) return 'medium'
  return 'low'
}

function buildFunctionalNeeds(input: ResourceServiceInput): FunctionalResourceNeed[] {
  const route = routeSourcesForDomain(
    input.interpretation.domain,
    input.interpretation.object_of_analysis,
  )
  // Le sujet de recherche est la question canonique entière : l'objet seul
  // ampute le facteur décisif (« la situation intérieure en Russie » perd
  // « pénurie d'essence ») et ramène des pages hors sujet.
  const subject = input.interpretation.situation_soumise || input.interpretation.object_of_analysis
  const balance = input.patterns?.dumezil_balance

  // Les suffixes anglais figés (legal framework, customers usage, pricing…)
  // sont du vocabulaire d'entreprise : plaqués sur une question publique ou
  // géopolitique, ils font dériver la recherche vers des documents de droit
  // ou de méthode sans rapport. Chaque famille reçoit donc un angle formulé
  // dans la langue de la question, et le domaine choisit la formulation.
  const query = (suffix: string) => (subject ? `${subject} ${suffix}` : suffix).trim().slice(0, 220)

  const needs: FunctionalResourceNeed[] = [
    {
      family: 'legitimation',
      label_fr: 'Legitimation',
      question_fr: 'Quelles sources disent le droit, la regle, la certification, la parole officielle ou la reputation ?',
      channels: route.channels.filter((channel) => ['official', 'legal', 'news_agency', 'research', 'company'].includes(channel)),
      suggested_queries: [
        query('déclaration officielle'),
        query('décision annoncée'),
      ],
      expected_evidence_fr: [
        'texte officiel',
        'decision publique',
        'declaration institutionnelle',
        'source de reputation ou certification',
      ],
      priority: priorityFrom(balance?.legitimize),
    },
    {
      family: 'protection_conflict',
      label_fr: 'Protection / conflit',
      question_fr: 'Quelles sources montrent qui bloque, conteste, protege, attaque ou deplace le rapport de force ?',
      channels: route.channels.filter((channel) => ['news_agency', 'local_media', 'legal', 'social_public', 'official'].includes(channel)),
      suggested_queries: [
        query('contestation'),
        query('blocage incident'),
      ],
      expected_evidence_fr: [
        'contentieux',
        'opposition publique',
        'signal social',
        'blocage ou incident',
      ],
      priority: priorityFrom(balance?.protect_fight),
    },
    {
      family: 'production_reproduction',
      label_fr: 'Production / reproduction',
      question_fr: 'Quelles sources montrent usage reel, travail, revenus, dependances, infrastructure ou charge portee ?',
      channels: route.channels.filter((channel) => ['company', 'market', 'technical', 'research', 'official', 'local_media'].includes(channel)),
      suggested_queries: [
        query('conséquences concrètes'),
        query('approvisionnement dépendance'),
      ],
      expected_evidence_fr: [
        'usage ou clients',
        'revenus ou financement',
        'offres d emploi',
        'infrastructure ou dependance',
      ],
      priority: priorityFrom(balance?.produce_reproduce),
    },
  ]

  const sourceNeeds = sourceNeedsFromInterpretation(input.interpretation)
  if (needsOfficialOrLegalEvidence(sourceNeeds)) {
    needs.unshift({
      family: 'legitimation',
      label_fr: 'Cadre public / reglementaire',
      question_fr: 'Quelles sources officielles ou juridiques disent la regle recente qui conditionne la decision ?',
      channels: ['official', 'legal'],
      suggested_queries: [
        query('sources officielles recentes reglementation'),
        query('texte officiel decret arrete loi'),
        query('cadre gouvernemental obligations aides'),
      ],
      expected_evidence_fr: [
        'texte officiel recent',
        'decret, arrete, loi ou doctrine administrative',
        'condition publique qui change la priorite des options',
      ],
      priority: 'high',
    })
  }

  return needs.map((need) => ({
    ...need,
    channels: need.channels.length > 0 ? need.channels : route.channels.slice(0, 2),
    suggested_queries: need.suggested_queries.slice(0, 3),
  }))
}

export function planResources(input: ResourceServiceInput): ResourceServiceContract {
  const started = Date.now()
  const urls = detectUrls(input.interpretation.raw_input).map(normalizeUrl)
  const route = routeSourcesForDomain(
    input.interpretation.domain,
    input.interpretation.object_of_analysis,
  )
  const suppliedResources = input.supplied_resources ?? []
  const decision = decideFastResourcePolicy(input.interpretation, urls)
  const sourceNeeds = sourceNeedsFromInterpretation(input.interpretation)
  const extractedUrls = suppliedResources
    .map((resource) => resource.url)
    .filter((url) => urls.includes(url))
  const functionalNeeds = buildFunctionalNeeds(input)
  const fallbackSearches = urls.length > extractedUrls.length || decision.needs_web
    ? [
        ...functionalNeeds.flatMap((need) => need.suggested_queries),
        ...route.suggested_queries,
      ].slice(0, 4)
    : []
  // Une source publique se définit POSITIVEMENT : un contenu publié par un
  // hôte externe. Nos propres artefacts internes (fiches de compréhension de
  // site, synthèses de crawl) sont produits par une brique, pas par un
  // éditeur : leur origine n'est pas un hôte. Cette règle les écarte par
  // construction, sans liste de libellés à maintenir.
  const isPublishedByExternalHost = (resource: ResourceContract): boolean => {
    const origin = String(resource.source ?? '').trim()
    return origin.length > 0 && /^[^\s]+\.[a-z]{2,}$/i.test(origin.replace(/^https?:\/\//i, '').split('/')[0])
  }

  // Fraîcheur : la condition n'est pas un signal que le référent peut
  // oublier d'émettre, mais la décision structurelle déjà prise — si le
  // système va chercher le web pour cette question, c'est que la matière
  // courante lui est nécessaire. Le repère n'est pas un seuil absolu mais la
  // source la plus fraîche du dossier : on ne mélange pas un papier d'il y a
  // cinq ans avec les dépêches du jour. Si tout le dossier est ancien
  // (question historique), la plus fraîche est ancienne elle aussi et rien
  // n'est écarté.
  const needsCurrentNews = decision.needs_web
  const publishedTime = (resource: ResourceContract): number | null => {
    if (!resource.published_at) return null
    const time = new Date(resource.published_at).getTime()
    return Number.isNaN(time) ? null : time
  }
  // Une seule définition de la source acceptable, appliquée à TOUS les
  // consommateurs (affichage, théâtre, résonance, rédacteur). Auparavant le
  // tri ne portait que sur public_sources : les intrus continuaient d'entrer
  // par `resources`, donc de s'afficher et de nourrir le théâtre.
  const externallyPublished = suppliedResources.filter(isPublishedByExternalHost)
  const freshestTime = externallyPublished
    .map(publishedTime)
    .filter((time): time is number => time !== null)
    .reduce((max, time) => (time > max ? time : max), 0)
  const sameNewsCycleMs = 365 * 24 * 60 * 60 * 1000
  const withinCurrentCycle = (resource: ResourceContract): boolean => {
    if (!needsCurrentNews || freshestTime === 0) return true
    const time = publishedTime(resource)
    if (time === null) return true
    return freshestTime - time <= sameNewsCycleMs
  }
  const qualifiedSources = externallyPublished.filter(withinCurrentCycle)
  // Si le tri ne laisse rien, on garde la matière brute plutôt que de rendre
  // une carte sans aucune source.
  const acceptedSources = qualifiedSources.length > 0 ? qualifiedSources : suppliedResources
  const publicSources = acceptedSources.filter((resource) => resource.reliability !== 'unknown')
  const optionSources = publicSources.length > 0 ? publicSources : acceptedSources
  const extractedOptions = extractQualifiedOptionsFromResources(optionSources)

  return {
    status: statusFor(urls, suppliedResources, decision),
    policy: decision.policy,
    needs_web: decision.needs_web,
    policy_reason_fr: decision.reason_fr,
    functional_needs: functionalNeeds,
    requested_urls: urls,
    extracted_urls: extractedUrls,
    fallback_searches: fallbackSearches,
    resources: acceptedSources,
    public_sources: publicSources,
    extracted_options: extractedOptions,
    internal_notes: [
      ...route.notes,
      urls.length > 0
        ? 'URL present: generation should not be blocked by clarification; server extraction/search must run.'
        : decision.needs_web
          ? 'Fast sources required: route lightweight resources for Lecture/Approfondir without blocking SIS.'
          : 'No URL detected: internal context is acceptable for fast SC.',
      `resource_policy=${decision.policy}`,
      `source_channels=${route.channels.join(',')}`,
      ...(sourceNeeds.length > 0 ? [`source_needs=${sourceNeeds.join(',')}`] : []),
      `extracted_options=${extractedOptions.length}`,
    ],
    trace: {
      service: 'ResourceService',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: suppliedResources.length > 0 ? 'ok' : decision.needs_web ? 'partial' : 'ok',
      notes: [
        `requested_urls=${urls.length}`,
        `resources=${suppliedResources.length}`,
        `extracted_options=${extractedOptions.length}`,
        `fallback_searches=${fallbackSearches.length}`,
        `needs_web=${decision.needs_web}`,
        ...(sourceNeeds.length > 0 ? [`source_needs=${sourceNeeds.join(',')}`] : []),
      ],
    },
  }
}
