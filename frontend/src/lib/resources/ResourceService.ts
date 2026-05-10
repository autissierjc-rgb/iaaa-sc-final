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

export type ResourceServiceInput = {
  interpretation: InterpretationContract
  patterns?: HumanCollectivePatternContext
  supplied_resources?: ResourceContract[]
  now?: Date
}

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/gi

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
  if (urls.length > 0) {
    return {
      policy: 'url_extract_required',
      needs_web: true,
      reason_fr: 'Une URL fournie doit etre exploitee par extraction ou recherche de domaine avant de conclure.',
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

  if (domainRequiresSources || termRequiresSources) {
    return {
      policy: 'fast_sources_required',
      needs_web: true,
      reason_fr: 'Le domaine ou la demande depend de faits externes verifiables ; des ressources rapides doivent nourrir Lecture et Approfondir sans bloquer SIS.',
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
  const subject = input.interpretation.object_of_analysis || input.interpretation.situation_soumise
  const balance = input.patterns?.dumezil_balance

  const query = (suffix: string) => subject ? `${subject} ${suffix}` : suffix

  const needs: FunctionalResourceNeed[] = [
    {
      family: 'legitimation',
      label_fr: 'Legitimation',
      question_fr: 'Quelles sources disent le droit, la regle, la certification, la parole officielle ou la reputation ?',
      channels: route.channels.filter((channel) => ['official', 'legal', 'news_agency', 'research', 'company'].includes(channel)),
      suggested_queries: [
        query('official statement'),
        query('legal framework'),
        query('certification decision'),
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
        query('controversy'),
        query('legal challenge'),
        query('opposition conflict'),
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
        query('customers usage'),
        query('jobs pricing revenue'),
        query('infrastructure dependency'),
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
  const extractedUrls = suppliedResources
    .map((resource) => resource.url)
    .filter((url) => urls.includes(url))
  const fallbackSearches = urls.length > extractedUrls.length || decision.needs_web
    ? route.suggested_queries.slice(0, 4)
    : []

  return {
    status: statusFor(urls, suppliedResources, decision),
    policy: decision.policy,
    needs_web: decision.needs_web,
    policy_reason_fr: decision.reason_fr,
    functional_needs: buildFunctionalNeeds(input),
    requested_urls: urls,
    extracted_urls: extractedUrls,
    fallback_searches: fallbackSearches,
    resources: suppliedResources,
    public_sources: suppliedResources.filter((resource) => resource.reliability !== 'unknown'),
    internal_notes: [
      ...route.notes,
      urls.length > 0
        ? 'URL present: generation should not be blocked by clarification; server extraction/search must run.'
        : decision.needs_web
          ? 'Fast sources required: route lightweight resources for Lecture/Approfondir without blocking SIS.'
          : 'No URL detected: internal context is acceptable for fast SC.',
      `resource_policy=${decision.policy}`,
      `source_channels=${route.channels.join(',')}`,
    ],
    trace: {
      service: 'ResourceService',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: suppliedResources.length > 0 ? 'ok' : decision.needs_web ? 'partial' : 'ok',
      notes: [
        `requested_urls=${urls.length}`,
        `resources=${suppliedResources.length}`,
        `fallback_searches=${fallbackSearches.length}`,
        `needs_web=${decision.needs_web}`,
      ],
    },
  }
}
