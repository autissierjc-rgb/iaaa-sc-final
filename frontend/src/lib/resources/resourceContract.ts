export type Lang = 'FR' | 'EN'

export type ResourceItem = {
  title: string
  url: string
  type: string
  source: string
  date?: string
  excerpt?: string
  reliability?: string
}

export type GenerationStatus = 'ok' | 'partial' | 'degraded' | 'blocked'
export type ResourcesStatus = 'not_needed' | 'available' | 'unavailable' | 'timeout'

export type ArbreACamesAnalysis = {
  acteurs: string[]
  intentions: string[]
  interets: string[]
  contraintes: string[]
  rapports_de_force: string[]
  forces: string[]
  vulnerabilites: string[]
  tensions: string[]
  temporalites: string[]
  trajectoires: string[]
  incertitudes: string[]
  temps: string[]
  sens_perceptions: string[]
  perceptions: string[]
  main_vulnerability_candidate: string
  load_bearing_contradiction: string
  powers_in_presence?: PowersContext
}

export type PowerInPresence = {
  name: string
  family:
    | 'actor'
    | 'material'
    | 'financial'
    | 'institutional'
    | 'symbolic'
    | 'affective'
    | 'narrative'
    | 'temporal'
    | 'bodily'
    | 'social'
    | 'blocking'
    | 'tipping'
  role: string
  visibility: 'visible' | 'hidden' | 'ambiguous'
}

export type PowersContext = {
  domain_hint: SituationDomain
  primary: PowerInPresence[]
  hidden: PowerInPresence[]
  blocking: PowerInPresence[]
  tipping: PowerInPresence[]
  synthesis_fr: string
  synthesis_en: string
}

export type DetectedPattern = {
  id: string
  label: string
  family: 'human' | 'systemic'
  confidence: number
  rationale?: string
}

export type PatternContext = {
  primary?: DetectedPattern
  secondary: DetectedPattern[]
}

export type MetierProfileContext = {
  id: string
  label: string
  signal: string
  patterns: string[]
  confidence: number
}

export type IntentContext = {
  surface_domain: SituationDomain
  dominant_frame: string
  decision_type: string
  interpreted_request?: InterpretedRequest
  needs_clarification: boolean
  clarification_focus: string[]
  questions: string[]
  signals: string[]
}

export type RequestIntentType =
  | 'understand'
  | 'decide'
  | 'evaluate'
  | 'prepare'
  | 'diagnose'
  | 'predict'
  | 'compare'

export type QuestionType =
  | 'open_analysis'
  | 'causal_attribution'
  | 'site_analysis'
  | 'evaluation'
  | 'decision'
  | 'inquiry'
  | 'comparison'

export type InterpretedRequest = {
  intent_type: RequestIntentType
  question_type?: QuestionType
  object_of_analysis: string
  user_question: string
  implicit_tension: string
  expected_answer_shape?: string
  primary_hypothesis?: string
  must_answer_first?: boolean
  missing_evidence_policy?: string
  confirmation_hypothesis?: string
  entity_explanations?: Array<{
    label: string
    explanation: string
    certainty?: 'known' | 'inferred' | 'unknown'
  }>
  domain: SituationDomain
  needs_clarification: boolean
  confidence: number
  signals: string[]
}

export type ConversationContract = {
  version: 1
  status: 'active'
  canonical_situation: string
  domain: SituationDomain
  intent_type: RequestIntentType
  question_type: QuestionType
  dominant_frame: string
  decision_type: string
  object_of_analysis: string
  expected_answer_shape: string
  required_matter_fr: string[]
  forbidden_frames: string[]
  forbidden_terms_fr: string[]
  turns: string[]
  signals: string[]
}

export type SituationScope =
  | 'personal'
  | 'organizational'
  | 'market'
  | 'local'
  | 'regional'
  | 'global'

export type ScopeContext = {
  scope: SituationScope
  requested_frame: string
  primary_theatre?: string
  secondary_theatres: string[]
  global_channels: string[]
  signals: string[]
}

export type ConcreteTheatre = {
  domain: SituationDomain
  anchors: string[]
  actors: string[]
  institutions: string[]
  procedures: string[]
  places: string[]
  dates: string[]
  precedents: string[]
  relays: string[]
  blockers: string[]
  mechanisms: string[]
  thresholds: string[]
  evidence_to_watch: string[]
  missing_anchors: string[]
  guidance_fr: string
  guidance_en: string
}

export type SituationDomain =
  | 'geopolitics'
  | 'war'
  | 'management'
  | 'personal'
  | 'professional'
  | 'governance'
  | 'startup_vc'
  | 'economy'
  | 'humanitarian'
  | 'general'

export type CoverageCheck = {
  domain: SituationDomain
  status: 'sufficient' | 'clarify'
  questions: string[]
  missingCritical: string[]
  requiredSignals: string[]
  requestedSites?: string[]
  input_quality?: {
    status: string
    questions: string[]
    signals: string[]
  }
  intent_context?: IntentContext
  conversation_contract?: ConversationContract
  scope_context?: ScopeContext
  concrete_theatre?: ConcreteTheatre
}

export type SituationInput = {
  situation: string
  lang?: Lang | 'fr' | 'en'
  mode?: string
  resources?: ResourceItem[]
}

export type SituationCard = {
  title_fr?: string
  title_en?: string
  submitted_situation_fr?: string
  submitted_situation_en?: string
  insight_fr?: string
  insight_en?: string
  main_vulnerability_fr?: string
  main_vulnerability_en?: string
  asymmetry_fr?: string
  asymmetry_en?: string
  key_signal_fr?: string
  key_signal_en?: string
  radar?: Record<string, number>
  radar_details?: Array<{
    axis: 'impact' | 'urgency' | 'uncertainty' | 'reversibility'
    label_fr: string
    label_en: string
    score: number
    explanation_fr: string
    explanation_en: string
  }>
  trajectories?: unknown[]
  cap?: Record<string, unknown>
  movements_fr?: string[]
  movements_en?: string[]
  avertissement_fr?: string
  avertissement_en?: string
  lecture_systeme_fr?: string
  lecture_systeme_en?: string
  resources?: ResourceItem[]
  arbre_a_cames?: ArbreACamesAnalysis
  powers_context?: PowersContext
  pattern_context?: PatternContext
  metier_profile?: MetierProfileContext
  concrete_theatre?: ConcreteTheatre
  coverage_check?: CoverageCheck
  intent_context?: IntentContext
  conversation_contract?: ConversationContract
  scope_context?: ScopeContext
  generation_status?: GenerationStatus
  generation_error?: string
  generation_error_public?: string
  generation_error_internal?: string
  resources_status?: ResourcesStatus
  [key: string]: unknown
}

export type DeepReading = {
  approfondir_fr: string
  approfondir_en: string
  sources: ResourceItem[]
}
