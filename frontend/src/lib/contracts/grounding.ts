import type { EvidenceLevel, TraceMeta } from './common'

export type GroundingSource = 'resources' | 'material' | 'theatre' | 'resonance'

export type GroundingSourceStatus = 'not_needed' | 'available' | 'partial' | 'missing'

export type GroundingPermission = {
  can_write_current_state: boolean
  can_write_strategy: boolean
  can_write_options: boolean
  can_write_source_backed_claims: boolean
  must_mark_provisional: boolean
}

export type GroundedOption = {
  label_fr: string
  source: GroundingSource
  evidence_level: EvidenceLevel
  source_ids: string[]
  evidence_fr: string[]
}

export type GroundedFact = {
  label_fr: string
  source: GroundingSource
  evidence_level: EvidenceLevel
  source_ids: string[]
}

export type GroundingContract = {
  understood_question_fr: string
  object_fr: string
  source_status: GroundingSourceStatus
  current_facts: GroundedFact[]
  options: GroundedOption[]
  actors: string[]
  institutions: string[]
  constraints: string[]
  missing_evidence_fr: string[]
  permissions: GroundingPermission
  trace: TraceMeta
}
