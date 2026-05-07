import type {
  EntityExplanation,
  InterpretationContract,
  ReferenceModelProvider,
  SituationDomainV2,
  SituationIntent,
  SituationQuestionType,
} from '../contracts'
import { interpretRequestWithModel } from '../intent/modelIntentInterpreter'
import type { InterpretedRequest, SituationDomain } from '../resources/resourceContract'

export type InterpretationServiceInput = {
  raw_input: string
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
  'au',
  'aux',
  'avec',
  'ce',
  'ces',
  'cette',
  'de',
  'des',
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
    startup_market: 'Startup marche',
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
    .map((word) => word.trim())
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
  const interpreted = await interpretRequestWithModel(rawInput)
  const domain = mapDomain(interpreted.domain)

  return {
    raw_input: rawInput,
    reference_model: input.reference_model ?? DEFAULT_REFERENCE_MODEL,
    intent: interpreted.intent_type as SituationIntent,
    domain,
    question_type: questionType(interpreted.question_type),
    situation_soumise: interpreted.user_question || rawInput,
    header_domain: headerDomainFor(domain),
    header_subject: ensureHeaderSubject(interpreted),
    angle: interpreted.implicit_tension || interpreted.expected_answer_shape || '',
    user_need: interpreted.expected_answer_shape || interpreted.intent_type,
    object_of_analysis: interpreted.object_of_analysis || rawInput,
    primary_hypothesis: interpreted.primary_hypothesis || undefined,
    expected_answer_shape: interpreted.expected_answer_shape || '',
    must_answer_first: Boolean(interpreted.must_answer_first),
    needs_clarification: shouldClarify(interpreted, rawInput),
    clarification_question: interpreted.confirmation_hypothesis || undefined,
    entity_explanations: toEntityExplanations(interpreted.entity_explanations),
    confidence: interpreted.confidence,
    signals: interpreted.signals,
    trace: {
      service: 'InterpretationService',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      model: input.reference_model?.model ?? DEFAULT_REFERENCE_MODEL.model,
      confidence: interpreted.confidence,
      status: 'ok',
      notes: ['LLM referent or legacy interpreter adapter produced canonical interpretation'],
    },
  }
}
