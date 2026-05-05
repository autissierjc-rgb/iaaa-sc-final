import { cleanModelText, parseModelJSON } from '../ai/json'
import type { IntentContext, ResourceItem } from './resourceContract'

type CanonicalSiteUnderstanding = {
  company_name: string
  what_it_does_fr: string
  target_users_fr: string
  product_workflow_fr: string
  business_model_fr: string
  pricing_fr: string
  visible_proofs_fr: string[]
  use_cases_fr: string[]
  differentiation_fr: string
  missing_proofs_fr: string[]
  critical_blind_spots_fr: string[]
  evaluation_angle_fr: string
  confidence: number
}

const SITE_UNDERSTANDING_PROMPT = `You are the site understanding layer for Situation Card.

Read the crawled or consulted website/page content and produce a canonical business/site brief.
Do not answer the user's strategic question. First understand the site.

Return ONLY valid JSON:
{
  "company_name": "",
  "what_it_does_fr": "",
  "target_users_fr": "",
  "product_workflow_fr": "",
  "business_model_fr": "",
  "pricing_fr": "",
  "visible_proofs_fr": [],
  "use_cases_fr": [],
  "differentiation_fr": "",
  "missing_proofs_fr": [],
  "critical_blind_spots_fr": [],
  "evaluation_angle_fr": "",
  "confidence": 0.0
}

Rules:
- Write in French.
- Use only facts visible in the crawled or consulted pages.
- If a fact is not visible, say "Non établi par les pages consultées".
- Do not invent traction, customers, revenue, funding, regulation, team, or partnerships.
- Separate what the site says from what remains unproven.
- Always identify critical blind spots to verify when relevant: legal/regulatory frame, labor or social status, tax/accounting, liability, state/public funding, procurement, norms, infrastructures, hidden costs, and implicit assumptions.
- If a blind spot is not visible in the pages, list it as a verification point, not as a fact.
- Prefer precise, plain business language over marketing copy.
- The brief must be useful before any SC analysis.`

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function requestedDomains(value: string): string[] {
  const matches = value.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? []
  const seen = new Set<string>()
  return matches
    .map((match) =>
      match
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '')
        .replace(/[),.;:!?]+$/g, '')
        .toLowerCase()
    )
    .filter((domain) => {
      if (!domain || seen.has(domain)) return false
      seen.add(domain)
      return true
    })
}

function rootLabel(host: string): string {
  return host.replace(/^www\./i, '').split('.')[0] ?? host
}

function companyName(domain: string): string {
  const root = rootLabel(domain)
  return root ? `${root.charAt(0).toUpperCase()}${root.slice(1)}` : domain
}

function brandName(resources: ResourceItem[], fallback: string): string {
  const candidate = resources
    .filter((resource) => resource.type !== 'site-crawl-summary' && !/^Synthèse crawl/i.test(clean(resource.title)))
    .map((resource) => clean(resource.title).match(/^([A-Z][A-Za-z0-9]+)\b/)?.[1])
    .find(Boolean)
  return candidate ?? fallback
}

function resourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

const SITE_TARGET_STOPWORDS = new Set([
  'avec', 'avis', 'cela', 'cette', 'comme', 'comment', 'dans', 'dire', 'donc', 'fait', 'faire',
  'penser', 'pour', 'quoi', 'quel', 'quelle', 'quels', 'quelles', 'site', 'page', 'url',
  'what', 'does', 'about', 'with', 'from', 'this', 'that', 'site', 'page',
])

const NON_TARGET_RESOURCE_TYPES = new Set([
  'institutional',
  'local-regional',
  'major-media',
  'medical-institutional',
  'research',
])

const GENERIC_BUSINESS_HOSTS = [
  'a16z.com',
  'bessemer.com',
  'cbinsights.com',
  'crunchbase.com',
  'dealroom.co',
  'firstround.com',
  'nfx.com',
  'pitchbook.com',
  'sequoiacap.com',
  'statista.com',
  'ycombinator.com',
]

function siteTargetTokens(situation: string, intentContext?: IntentContext): string[] {
  const interpreted = intentContext?.interpreted_request
  const text = normalize([
    interpreted?.object_of_analysis,
    interpreted?.user_question,
    situation,
  ].filter(Boolean).join(' '))
  const tokens = text
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !SITE_TARGET_STOPWORDS.has(word))
  return [...new Set(tokens)].slice(0, 10)
}

function canInferConsultedSite(situation: string, intentContext?: IntentContext): boolean {
  if (requestedDomains(situation).length > 0) return true
  const intent = intentContext?.interpreted_request?.intent_type
  const frame = intentContext?.dominant_frame
  if (frame === 'site_analysis') return true
  return (
    (intent === 'evaluate' || intent === 'understand' || intent === 'compare') &&
    (frame === 'startup_investment' || frame === 'general_analysis')
  )
}

function isGenericBusinessHost(host: string): boolean {
  return GENERIC_BUSINESS_HOSTS.some((generic) => host === generic || host.endsWith(`.${generic}`))
}

function sourceText(resource: ResourceItem): string {
  return normalize(`${resource.title ?? ''} ${resource.excerpt ?? ''} ${resource.url ?? ''}`)
}

function consultedDomainCandidates({
  situation,
  resources,
  intentContext,
}: {
  situation: string
  resources: ResourceItem[]
  intentContext?: IntentContext
}): string[] {
  const explicit = requestedDomains(situation)
  if (explicit.length > 0) return explicit

  if (!canInferConsultedSite(situation, intentContext)) return []

  const tokens = siteTargetTokens(situation, intentContext)
  if (tokens.length === 0) return []

  const byHost = new Map<string, { host: string; score: number; count: number }>()
  for (const resource of resources) {
    const host = resourceHost(resource.url)
    if (!host) continue

    const label = normalize(rootLabel(host))
    const text = sourceText(resource)
    const directLabelHit = tokens.some((token) => label === token || label.includes(token) || token.includes(label))
    const tokenHits = tokens.filter((token) => text.includes(token)).length
    if (!directLabelHit && tokenHits === 0) continue

    let score = 0
    if (directLabelHit) score += 12
    score += tokenHits * 2
    if (resource.type === 'requested-site') score += 7
    if (resource.type === 'site-crawl-summary') score += 9
    if (/direct-site/i.test(resource.reliability ?? '')) score += 6
    if (/openai|tavily|brave|web-search/i.test(resource.reliability ?? resource.source ?? '')) score += 1
    if (NON_TARGET_RESOURCE_TYPES.has(resource.type) && !directLabelHit) score -= 10
    if (isGenericBusinessHost(host) && !directLabelHit) score -= 8

    const current = byHost.get(host) ?? { host, score: 0, count: 0 }
    current.score += score
    current.count += 1
    byHost.set(host, current)
  }

  return [...byHost.values()]
    .map((item) => ({ ...item, score: item.score + Math.min(3, item.count) }))
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.host)
}

function clean(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim()
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => cleanModelText(item))
    .filter(Boolean)
    .slice(0, 8)
}

function cleanField(value: unknown, fallback: string): string {
  return cleanModelText(value) || fallback
}

function confidence(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0.55
  return Math.max(0, Math.min(1, numeric))
}

function sentences(value: string): string[] {
  return clean(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 32)
}

function pickSentence(resources: ResourceItem[], patterns: RegExp[], fallback: string): string {
  const candidates = resources.flatMap((resource) =>
    sentences(`${resource.title ?? ''}. ${resource.excerpt ?? ''}`)
  )
  const scored = candidates
    .map((sentence) => {
      const normalized = normalize(sentence)
      const patternScore = patterns.filter((pattern) => pattern.test(normalized)).length
      const productScore = /\b(platform|helps|aide|permet|solution|service|outil|application|logiciel)\b/i.test(sentence) ? 4 : 0
      const titlePenalty = /[|]/.test(sentence) && sentence.length < 90 ? -3 : 0
      return { sentence, score: patternScore + productScore + titlePenalty }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored[0]?.sentence ?? fallback
}

function crawlSummary(resources: ResourceItem[]): ResourceItem | undefined {
  return resources.find((resource) => resource.type === 'site-crawl-summary')
}

function crawlPageCount(resource?: ResourceItem): number {
  const match = String(resource?.excerpt ?? '').match(/Pages utiles lues:\s*(\d+)/i)
  return match ? Number(match[1]) : 0
}

async function buildCanonicalSiteUnderstanding({
  situation,
  domain,
  resources,
  intentContext,
}: {
  situation: string
  domain: string
  resources: ResourceItem[]
  intentContext?: IntentContext
}): Promise<CanonicalSiteUnderstanding | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const crawl = crawlSummary(resources)
  const crawlText = clean(crawl?.excerpt ?? resources.map((resource) =>
    `${resource.title}\nURL: ${resource.url}\n${resource.excerpt ?? ''}`
  ).join('\n\n')).slice(0, 24000)
  if (!crawlText) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_SITE_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SITE_UNDERSTANDING_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              domain,
              user_question: intentContext?.interpreted_request?.user_question || situation,
              requested_angle: intentContext?.interpreted_request,
              crawl_text: crawlText,
            }),
          },
        ],
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    const raw = data?.choices?.[0]?.message?.content
    if (typeof raw !== 'string') return null
    const parsed = parseModelJSON(raw)
    return {
      company_name: cleanField(parsed.company_name, companyName(domain)),
      what_it_does_fr: cleanField(parsed.what_it_does_fr, 'Non établi par les pages consultées'),
      target_users_fr: cleanField(parsed.target_users_fr, 'Non établi par les pages consultées'),
      product_workflow_fr: cleanField(parsed.product_workflow_fr, 'Non établi par les pages consultées'),
      business_model_fr: cleanField(parsed.business_model_fr, 'Non établi par les pages consultées'),
      pricing_fr: cleanField(parsed.pricing_fr, 'Non établi par les pages consultées'),
      visible_proofs_fr: cleanList(parsed.visible_proofs_fr),
      use_cases_fr: cleanList(parsed.use_cases_fr),
      differentiation_fr: cleanField(parsed.differentiation_fr, 'Non établi par les pages consultées'),
      missing_proofs_fr: cleanList(parsed.missing_proofs_fr),
      critical_blind_spots_fr: cleanList(parsed.critical_blind_spots_fr),
      evaluation_angle_fr: cleanField(parsed.evaluation_angle_fr, 'Evaluer le positionnement et les preuves visibles'),
      confidence: confidence(parsed.confidence),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>()
  return items
    .map(clean)
    .filter(Boolean)
    .filter((item) => {
      const key = normalize(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export async function buildSiteUnderstandingResource({
  situation,
  resources,
  intentContext,
}: {
  situation: string
  resources: ResourceItem[]
  intentContext?: IntentContext
}): Promise<ResourceItem | null> {
  const domains = consultedDomainCandidates({ situation, resources, intentContext })
  const domain = domains[0]
  if (!domain) return null

  const ownResources = resources.filter((resource) => resourceHost(resource.url) === domain)
  if (ownResources.length === 0) return null

  const summary = crawlSummary(ownResources)
  const pagesRead = crawlPageCount(summary)
  const hasExplicitDomain = requestedDomains(situation).length > 0
  const canonical = await buildCanonicalSiteUnderstanding({
    situation,
    domain,
    resources: ownResources,
    intentContext,
  })
  const name = canonical?.company_name || brandName(ownResources, companyName(domain))
  const visibleFacts = uniq(
    ownResources
      .flatMap((resource) => sentences(`${resource.title ?? ''}. ${resource.excerpt ?? ''}`))
      .filter((sentence) => !/\b(cookie|privacy|login|newsletter|copyright|menu|navigation)\b/i.test(sentence))
      .slice(0, 10)
  )

  const product = pickSentence(
    ownResources.filter((resource) => resource.type !== 'site-crawl-summary'),
    [/business|work|platform|solution|service|outil|produit|clients?|market|march[eé]|talent|freelance|consult/i],
    `${name} doit d’abord être compris par son produit, sa cible, son usage, ses preuves visibles et ses angles morts.`
  )
  let proof = pickSentence(
    ownResources.filter((resource) => resource.type !== 'site-crawl-summary'),
    [/client|customer|case|use|usage|revenue|traction|partner|atelier|workshop|station f|network|preuve|adoption/i],
    'Les preuves visibles restent à qualifier : clients, usages répétés, revenus, partenariats, rétention ou décisions d’achat.'
  )
  if (normalize(proof) === normalize(product)) {
    proof = 'Les preuves visibles restent à qualifier : clients, usages répétés, revenus, partenariats, rétention ou décisions d’achat.'
  }
  const market = /\b(europe|europeen|europ[eé]en|march[eé]\s+europ)/i.test(situation)
    ? 'Angle demandé par l’utilisateur : potentiel et crédibilité sur le marché européen.'
    : 'Angle demandé par l’utilisateur : évaluation du positionnement et de la preuve disponible.'
  const criticalBlindSpots = canonical?.critical_blind_spots_fr?.length
    ? canonical.critical_blind_spots_fr.join(' / ')
    : 'Cadre légal ou réglementaire, statut social/salarial ou contractuel, fiscalité, responsabilité, financement public, normes sociales, infrastructures et coûts cachés à vérifier selon le modèle.'

  const excerpt = [
    `FICHE SITE INTERNE - ${name}`,
    `Domaine consulte : ${domain}.`,
    `Origine : ${hasExplicitDomain ? 'URL utilisateur' : 'pages consultées par recherche'}.`,
    pagesRead > 0 ? `Pages utiles lues : ${pagesRead}.` : `Pages consultées : ${ownResources.length}.`,
    canonical ? `Compréhension ChatGPT du site : oui (confiance ${canonical.confidence}).` : 'Compréhension ChatGPT du site : indisponible, fiche heuristique utilisée.',
    `Question utilisateur : ${clean(intentContext?.interpreted_request?.user_question || situation)}.`,
    market,
    canonical
      ? `Ce que fait l’entreprise : ${canonical.what_it_does_fr}`
      : `Ce que le site permet d’établir : ${product}`,
    canonical ? `Utilisateurs ou clients visés : ${canonical.target_users_fr}` : '',
    canonical ? `Workflow produit : ${canonical.product_workflow_fr}` : '',
    canonical ? `Modèle économique : ${canonical.business_model_fr}` : '',
    canonical ? `Tarification : ${canonical.pricing_fr}` : '',
    canonical
      ? `Preuves ou signaux visibles : ${canonical.visible_proofs_fr.join(' / ') || 'Non établi par les pages consultées'}`
      : `Preuves ou signaux visibles : ${proof}`,
    canonical ? `Cas d’usage visibles : ${canonical.use_cases_fr.join(' / ') || 'Non établi par les pages consultées'}` : '',
    canonical ? `Différenciation visible : ${canonical.differentiation_fr}` : '',
    canonical ? `Preuves manquantes : ${canonical.missing_proofs_fr.join(' / ') || 'Non établi par les pages consultées'}` : '',
    `Angles morts critiques à vérifier : ${criticalBlindSpots}`,
    canonical ? `Angle d’évaluation : ${canonical.evaluation_angle_fr}` : '',
    visibleFacts.length > 0 ? `Faits extraits du site : ${visibleFacts.join(' / ')}` : '',
    summary?.excerpt ? `Résumé crawl utile : ${clean(summary.excerpt).slice(0, 1800)}` : '',
    'Règle d’analyse : commencer par expliquer simplement ce que fait l’entreprise, pour qui et avec quelle promesse. Ne pas extrapoler un modèle économique, une traction, une régulation ou une levée de fonds non observés dans les ressources. Les angles morts critiques doivent être signalés comme questions de vérification.',
  ].filter(Boolean).join('\n')

  return {
    title: `Fiche site - ${name}`,
    url: `https://${domain}`,
    type: 'site-brief',
    source: 'IAAA site understanding',
    excerpt,
    reliability: 'internal-site-brief',
  }
}

export async function enrichResourcesWithSiteUnderstanding({
  situation,
  resources,
  intentContext,
}: {
  situation: string
  resources: ResourceItem[]
  intentContext?: IntentContext
}): Promise<ResourceItem[]> {
  const siteBrief = await buildSiteUnderstandingResource({ situation, resources, intentContext })
  if (!siteBrief) return resources
  return [siteBrief, ...resources]
}
