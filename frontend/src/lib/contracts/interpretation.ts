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

export type TreatmentMode =
  | 'direct_sc'
  | 'exploratory_sc'
  | 'collaborative_clarification'
  | 'resource_first'
  | 'safety_first'

export type TreatmentSourceStatus =
  | 'not_needed'
  | 'missing'
  | 'provided'
  | 'insufficient'
  | 'private_plug_required'

export type TreatmentInstruction = {
  layer:
    | 'dialogue'
    | 'safety'
    | 'resources'
    | 'expertisesMetiers'
    | 'theatre'
    | 'scoring'
    | 'writing'
    | 'quality'
    | 'share'
  instruction_fr: string
}

export type TreatmentPlanContract = {
  mode: TreatmentMode
  source_status: TreatmentSourceStatus
  can_generate: boolean
  can_generate_exploratory: boolean
  missing_material_fr: string[]
  must_not_reinterpret_fr: string[]
  instructions: TreatmentInstruction[]
  public_clarification_fr?: string
  trace_notes: string[]
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
  treatment_plan?: TreatmentPlanContract
  confidence: number
  signals: string[]
  trace: TraceMeta
}
