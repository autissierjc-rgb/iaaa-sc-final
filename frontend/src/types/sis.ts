export type StateLabel = 'Stable' | 'Contrôlable' | 'Vigilance' | 'Critique' | 'Hors contrôle'
export type ScType = 'professional' | 'geopolitique_active' | 'geopolitique_longue_duree'
export type ContextualizationLevel = 'explicit' | 'inferred' | 'partial' | 'insufficient'
export type Confidence = 'élevée' | 'modérée' | 'faible'
export type BranchLabel = 'Absent' | 'Actif' | 'Modéré' | 'Dominant'
export type TrajectoryType = 'Stabilisation' | 'Escalation' | 'Solution tiers'

export interface AstrolabeScore {
  branch: string
  name: string
  raw_score: number
  display_score: number
  label: BranchLabel
  justification: string
  is_primary: boolean
  compression_applied: boolean
  compression_reason: string
}

export interface RadarScore {
  dimension: string
  score: number
  note: string
}

export interface Trajectory {
  type: TrajectoryType
  title: string
  description: string
  signal_precurseur: string
  probability: string
}

export interface CapSummary {
  hook: string
  insight: string
  vulnerability: string
  asymmetry: string
  watch: string
}

export interface Actor {
  name: string
  role: string
  stated_position: string
  revealed_behavior: string
  watch_signal: string
}

export interface NewsItem {
  date: string
  text: string
  source: string
}

export interface CausalScenario {
  scenario_id: string
  title: string
  description: string
  actors_involved: string[]
  causal_logic: string
  plausibility: string
}

export interface VerificationItem {
  question: string
  why_it_matters: string
  who_can_verify: string
  compromised_sources: string[]
  independent_source_needed: boolean
}

export interface RadarPressureComponents {
  impact: number
  urgence: number
  incertitude: number
  reversibilite: number
}

export interface StateIndexFormulaCheck {
  astrolabe_base: number
  radar_pressure: number
  state_index_raw: number
}

export interface SituationCard {
  title: string
  category: string
  sc_type: ScType
  slug?: string
  contextualization_level: ContextualizationLevel
  context_frame: Record<string, any>
  required_context_missing: boolean
  missing_context_questions: string[]
  contextual_patterns_considered: string[]
  contextual_red_flags: string[]
  independent_verification_required: boolean
  investigation_mode: boolean
  state_index_raw: number
  state_index_adjustment: number
  state_index_adjustment_reason: string
  state_index_final: number
  state_label: StateLabel
  astrolabe_raw_sum: number
  astrolabe_base: number
  radar_pressure: number
  saturation_index: number
  radar_pressure_components: RadarPressureComponents
  state_index_formula_check: StateIndexFormulaCheck
  confidence: Confidence
  insight: string
  vulnerability: string
  signal: string
  asymmetry: string
  astrolabe_scores: AstrolabeScore[]
  radar_scores: RadarScore[]
  trajectories: Trajectory[]
  cap_summary: CapSummary
  actors: Actor[]
  news_items: NewsItem[]
  causal_scenarios: CausalScenario[]
  verification_matrix: VerificationItem[]
  analysis: Record<string, any>
}
