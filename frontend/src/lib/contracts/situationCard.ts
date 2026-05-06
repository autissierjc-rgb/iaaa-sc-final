import type { DialogueGateContract } from './dialogue'
import type { InquiryContract } from './inquiry'
import type { InterpretationContract } from './interpretation'
import type { QualityGateContract } from './quality'
import type { ResourceServiceContract } from './resources'
import type { RiskAdviceGuardContract } from './safety'
import type { ScoringContract } from './scoring'
import type { SharePolicyContract } from './share'
import type { ConcreteTheatreContract } from './theatre'
import type { WritingContract } from './writing'

export type SituationCardV2Contract = {
  interpretation: InterpretationContract
  dialogue_gate: DialogueGateContract
  safety: RiskAdviceGuardContract
  resources: ResourceServiceContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  inquiry: InquiryContract
  writing: WritingContract
  quality: QualityGateContract
  share_policy?: SharePolicyContract
  generated_at: string
  contract_version: 'v2-draft'
}
