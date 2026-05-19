import type {
  EntityExplanation,
  InterpretationContract,
  ReferenceModelProvider,
  SituationDomainV2,
  SituationIntent,
  SituationQuestionType,
} from '../contracts'
import { interpretRequestWithModel } from '../intent/modelIntentInterpreter'
import { interpretRequest } from '../intent/interpretRequest'
import type { InterpretedRequest, SituationDomain } from '../resources/resourceContract'
import { buildTreatmentPlan } from './TreatmentPlan'

export type InterpretationServiceInput = {
  raw_input: string
  mode?: 'referent_llm' | 'local_contract'
  preinterpreted?: InterpretedRequest
  reference_model?: {
    provider: ReferenceModelProvider
    model: string
  }
}

const DEFAULT_REFERENCE_MODEL = {
  provider: 'openai' as const,
  model: process.env.OPENAI_INTENT_MODEL || 'gpt-4o-mini',
}

const SIGNIFICANT_WORD_MINIMUM = 3

const STOP_WORDS = new Set([
  'a',
  'autour',
  'au',
  'aux',
  'avec',
  'ce',
  'ces',
  'cette',
  'de',
  'des',
  'dans',
  'du',
  'en',
  'et',
  'est',
  'il',
  'la',
  'le',
  'les',
  'mon',
  'ma',
  'mes',
  'ne',
  'pas',
  'par',
  'peut',
  'peuvent',
  'pour',
  'pourquoi',
  'que',
  'qui',
  'quoi',
  'quand',
  'sur',
  't',
  'un',
  'une',
])

function mapDomain(domain: SituationDomain): SituationDomainV2 {
  const domains: Record<SituationDomain, SituationDomainV2> = {
    geopolitics: 'geopolitics',
    war: 'war_security',
    management: 'management',
    personal: 'family',
    professional: 'professional',
    governance: 'public_governance',
    startup_vc: 'startup_market',
    economy: 'finance_macro',
    humanitarian: 'humanitarian',
    general: 'general',
  }
  return domains[domain] ?? 'general'
}

function headerDomainFor(domain: SituationDomainV2): string {
  const labels: Record<SituationDomainV2, string> = {
    academic_research: 'Recherche',
    business_strategy: 'Strategie',
    climate_energy: 'Climat energie',
    community_association: 'Collectif',
    couple: 'Couple',
    culture_media: 'Culture medias',
    cybersecurity: 'Cybersecurite',
    education: 'Education',
    family: 'Personnel',
    finance_macro: 'Economie',
    general: 'General',
    geopolitics: 'Geopolitique',
    health_body: 'Sante',
    humanitarian: 'Humanitaire',
    institutional_crisis: 'Institutions',
    law_justice: 'Droit',
    management: 'Management',
    ngo_field: 'ONG terrain',
    product_platform: 'Produit',
    professional: 'Professionnel',
    public_governance: 'Gouvernance',
    religion_spirituality: 'Spiritualite',
    school_adolescence: 'Ecole adolescence',
    science_research: 'Sciences',
    sport_performance: 'Sport',
    startup_market: 'Entreprise marche',
    supply_chain: 'Supply chain',
    technology_ai: 'Technologie IA',
    territory_urbanism: 'Territoire',
    war_security: 'Guerre securite',
  }
  return labels[domain]
}

function meaningfulWords(text: string): string[] {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim().replace(/^(?:d|l|qu|n|s|m|t|c)[’']/i, ''))
    .filter((word) => word.length > 1)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()))
}

function ensureHeaderSubject(interpreted: InterpretedRequest): string {
  const source = interpreted.object_of_analysis || interpreted.user_question
  const words = meaningfulWords(source)

  if (words.length >= SIGNIFICANT_WORD_MINIMUM) {
    return words.slice(0, 5).join(' ')
  }

  const fallbackWords = meaningfulWords(interpreted.user_question)
  const combined = [...words, ...fallbackWords].filter(Boolean)
  const unique = Array.from(new Set(combined))

  if (unique.length >= SIGNIFICANT_WORD_MINIMUM) {
    return unique.slice(0, 5).join(' ')
  }

  return unique.join(' ') || 'Situation a clarifier'
}

function extractBusinessSubject(rawInput: string): string | null {
  const cleaned = rawInput.replace(/https?:\/\/\S+/gi, ' ')
  const blocked = /^(Que|Quoi|Comment|Pourquoi|Quand|Mon|Ma|Mes|Le|La|Les|Un|Une)$/i
  const company = (cleaned.match(/\b[A-ZÀ-Ý][\p{L}\p{N}'-]{2,}(?:\s+[A-ZÀ-Ý][\p{L}\p{N}'-]{2,}){0,2}\b/gu) ?? [])
    .map((item) => item.trim())
    .find((item) => !blocked.test(item))
  if (!company) {
    return null
  }

  if (
    /\b(?:cible|segment|public|audience|utilisateurs?|clients?|client[eè]le)\b/i.test(cleaned) &&
    /\b(?:choisir|viser|prioriser|prioritaire|premiers?|premi[eè]re|options?|strat[eé]gique|lancement)\b/i.test(cleaned)
  ) {
    return `${company} cible utilisateur`
  }

  if (/\b(startup|start-up|rejoindre|partenariat|partner|associer|collaborer|investir)\b/i.test(cleaned)) {
    return `${company} partenariat startup`
  }

  if (/\b(go[- ]to[- ]market|lancement|pitch|pitchdeck|launchpad|vente|commercial)\b/i.test(cleaned)) {
    return `${company} go-to-market`
  }

  if (/\b(que fait|offre|produit|service|compagnie|entreprise|societe|société)\b/i.test(cleaned)) {
    return `${company} offre marche`
  }

  return null
}

function headerSubjectFor(rawInput: string, domain: SituationDomainV2, interpreted: InterpretedRequest): string {
  if (['startup_market', 'business_strategy', 'product_platform', 'professional'].includes(domain)) {
    const businessSubject = extractBusinessSubject(rawInput)
    if (businessSubject) return businessSubject
  }

  return ensureHeaderSubject(interpreted)
}

function toEntityExplanations(items: InterpretedRequest['entity_explanations']): EntityExplanation[] {
  return (items ?? []).map((item) => ({
    label: item.label,
    explanation: item.explanation,
    certainty: item.certainty ?? 'inferred',
  }))
}

function questionType(value: InterpretedRequest['question_type']): SituationQuestionType {
  return value ?? 'open_analysis'
}

function hasUrl(input: string): boolean {
  return /\bhttps?:\/\/\S+|\bwww\.[^\s]+/i.test(input)
}

function shouldClarify(interpreted: InterpretedRequest, rawInput: string): boolean {
  if (hasUrl(rawInput)) return false
  return Boolean(interpreted.needs_clarification)
}

export async function interpretSituation(
  input: InterpretationServiceInput,
): Promise<InterpretationContract> {
  const started = Date.now()
  const rawInput = input.raw_input.trim()
  const localMode = input.mode === 'local_contract'
  const interpreted = input.preinterpreted ?? (localMode ? interpretRequest(rawInput) : await interpretRequestWithModel(rawInput))
  const domain = mapDomain(interpreted.domain)
  const referenceModel = localMode
    ? { provider: 'local' as const, model: 'local-contract' }
    : input.reference_model ?? DEFAULT_REFERENCE_MODEL
  const treatmentPlan = buildTreatmentPlan({
    rawInput,
    interpreted,
    domain,
  })

  return {
    raw_input: rawInput,
    reference_model: referenceModel,
    intent: interpreted.intent_type as SituationIntent,
    domain,
    question_type: questionType(interpreted.question_type),
    situation_soumise: interpreted.user_question || rawInput,
    header_domain: headerDomainFor(domain),
    header_subject: headerSubjectFor(rawInput, domain, interpreted),
    angle: interpreted.implicit_tension || interpreted.expected_answer_shape || '',
    user_need: interpreted.expected_answer_shape || interpreted.intent_type,
    object_of_analysis: interpreted.object_of_analysis || rawInput,
    primary_hypothesis: interpreted.primary_hypothesis || undefined,
    expected_answer_shape: interpreted.expected_answer_shape || '',
    must_answer_first: Boolean(interpreted.must_answer_first),
    needs_clarification: shouldClarify(interpreted, rawInput),
    clarification_question: interpreted.confirmation_hypothesis || undefined,
    entity_explanations: toEntityExplanations(interpreted.entity_explanations),
    treatment_plan: treatmentPlan,
    confidence: interpreted.confidence,
    signals: interpreted.signals,
    trace: {
      service: 'InterpretationService',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      model: referenceModel.model,
      confidence: interpreted.confidence,
      status: 'ok',
      notes: [
        localMode
          ? 'Local contract interpreter used for cockpit dry-run.'
          : 'LLM referent or legacy interpreter adapter produced canonical interpretation',
        ...treatmentPlan.trace_notes,
      ],
    },
  }
}
