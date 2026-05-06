import type { TraceMeta } from './common'
import type { SituationDomainV2 } from './interpretation'
import type { SourceChannel } from './resources'

export type ExpertiseMetierPlaybook = {
  id: string
  domain: SituationDomainV2
  label_fr: string
  typical_actors: string[]
  typical_institutions: string[]
  procedures_or_rules: string[]
  expected_evidence: string[]
  common_blind_spots: string[]
  source_channels: SourceChannel[]
  probability_markers: string[]
  tipping_points: string[]
  writing_anchors: string[]
}

export type MetierLens = {
  id: string
  label_fr: string
  domains: SituationDomainV2[]
  questions_they_ask: string[]
  evidence_they_expect: string[]
  blind_spots_they_watch: string[]
  source_preferences: SourceChannel[]
}

export type ExpertisesMetiersContract = {
  domain: SituationDomainV2
  domain_playbook: ExpertiseMetierPlaybook
  metier_lenses: MetierLens[]
  source_channels: SourceChannel[]
  evidence_to_seek: string[]
  blind_spots_to_test: string[]
  probability_markers: string[]
  writing_anchors: string[]
  trace: TraceMeta
}
