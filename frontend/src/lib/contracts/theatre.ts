import type { EvidenceLevel, TraceMeta } from './common'
import type { SituationDomainV2 } from './interpretation'

export type TheatreEvidence = {
  label: string
  level: EvidenceLevel
  source_ids: string[]
}

export type ConcreteTheatreContract = {
  domain: SituationDomainV2
  actors: string[]
  institutions: string[]
  dates: string[]
  places: string[]
  procedures: string[]
  visible_actions: string[]
  constraints: string[]
  evidence: TheatreEvidence[]
  unknowns: string[]
  missing_anchors: string[]
  trace: TraceMeta
}
