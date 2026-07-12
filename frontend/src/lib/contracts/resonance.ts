import type { TraceMeta } from './common'

export type ResonanceContextFrame = 'security_crisis' | 'political_institutional' | 'general'

export type ResonanceSourceSignal = {
  source_id?: string
  signal_fr: string
  public_signal_fr: string
  source_title: string
  source_name: string
  discriminant_terms: string[]
  published_at?: string
}

export type ResonanceQualifiedEvidence = {
  source_id?: string
  public_label_fr: string
  public_signal_fr: string
  status: 'usable' | 'weak' | 'rejected'
  can_drive_probability: boolean
  published_at?: string
}

export type ResonanceTraceContract = {
  context_frame: ResonanceContextFrame
  source_signals: ResonanceSourceSignal[]
  qualified_evidence: ResonanceQualifiedEvidence[]
  source_hosts: string[]
  real_actors: string[]
  institutions: string[]
  structural_gap_fr: string
  structural_gap_source: 'theatre' | 'default'
  structural_contradiction_fr: string
  structural_vulnerability_fr: string
  diamond_thesis_fr: string
  regime_hypothesis_fr: string
  transition_signal_fr: string
  transition_signal_source: 'sources' | 'theatre' | 'default'
  forbidden_public_confusions: string[]
  trace: TraceMeta
}
