import type { TraceMeta } from './common'

export type ResonanceSourceSignal = {
  source_id?: string
  signal_fr: string
  source_title: string
  source_name: string
  discriminant_terms: string[]
}

export type ResonanceTraceContract = {
  source_signals: ResonanceSourceSignal[]
  source_hosts: string[]
  real_actors: string[]
  institutions: string[]
  structural_gap_fr: string
  structural_contradiction_fr: string
  structural_vulnerability_fr: string
  diamond_thesis_fr: string
  regime_hypothesis_fr: string
  transition_signal_fr: string
  forbidden_public_confusions: string[]
  trace: TraceMeta
}
