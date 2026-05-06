import type { TraceMeta } from './common'

export type ReferenceModelProvider =
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'local'
  | 'other'

export type SituationIntent =
  | 'understand'
  | 'decide'
  | 'evaluate'
  | 'prepare'
  | 'diagnose'
  | 'predict'
  | 'compare'

export type SituationQuestionType =
  | 'open_analysis'
  | 'causal_attribution'
  | 'site_analysis'
  | 'evaluation'
  | 'decision'
  | 'inquiry'
  | 'comparison'

export type SituationDomainV2 =
  | 'geopolitics'
  | 'war_security'
  | 'institutional_crisis'
  | 'humanitarian'
  | 'startup_market'
  | 'business_strategy'
  | 'management'
  | 'professional'
  | 'law_justice'
  | 'family'
  | 'couple'
  | 'school_adolescence'
  | 'health_body'
  | 'science_research'
  | 'technology_ai'
  | 'climate_energy'
  | 'finance_macro'
  | 'culture_media'
  | 'religion_spirituality'
  | 'territory_urbanism'
  | 'sport_performance'
  | 'community_association'
  | 'product_platform'
  | 'public_governance'
  | 'ngo_field'
  | 'supply_chain'
  | 'cybersecurity'
  | 'education'
  | 'academic_research'
  | 'general'

export type EntityExplanation = {
  label: string
  explanation: string
  certainty: 'known' | 'inferred' | 'unknown'
}

export type InterpretationContract = {
  raw_input: string
  reference_model: {
    provider: ReferenceModelProvider
    model: string
  }
  intent: SituationIntent
  domain: SituationDomainV2
  question_type: SituationQuestionType
  situation_soumise: string
  header_domain: string
  header_subject: string
  angle: string
  user_need: string
  object_of_analysis: string
  primary_hypothesis?: string
  expected_answer_shape: string
  must_answer_first: boolean
  needs_clarification: boolean
  clarification_question?: string
  entity_explanations: EntityExplanation[]
  confidence: number
  signals: string[]
  trace: TraceMeta
}
