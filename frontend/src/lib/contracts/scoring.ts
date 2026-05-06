import type { TraceMeta } from './common'

export type AstrolabeBranchCode = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'

export type AstrolabeScore = 0 | 1 | 2 | 3

export type AstrolabeBranchV2 = {
  branch: AstrolabeBranchCode
  name_fr: string
  name_en: string
  score: AstrolabeScore
  is_primary: boolean
  rationale_fr: string
  rationale_en?: string
}

export type RadarAxis = 'impact' | 'urgency' | 'uncertainty' | 'reversibility'

export type RadarScoreV2 = {
  axis: RadarAxis
  score: number
  explanation_fr: string
  explanation_en?: string
}

export type StateLabelV2 =
  | 'routine_stable'
  | 'tension'
  | 'instability'
  | 'regime_shift'

export type ScoringContract = {
  astrolabe: AstrolabeBranchV2[]
  radar: RadarScoreV2[]
  state_index_final: number
  state_label: StateLabelV2
  scoring_warnings: string[]
  trace: TraceMeta
}
