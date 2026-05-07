import type { TraceMeta } from './common'

export type QualityIssueLevel = 'info' | 'warning' | 'error'

export type QualityIssue = {
  level: QualityIssueLevel
  code: string
  message: string
  field?: string
}

export type CalibrationCriterionId =
  | 'insight'
  | 'main_vulnerability'
  | 'trajectories'
  | 'key_signal'
  | 'global_usefulness'

export type CalibrationScore = 1 | 2 | 3 | 4 | 5

export type CalibrationCriterionResult = {
  id: CalibrationCriterionId
  label: string
  score: CalibrationScore
  evidence: string
  improvement?: string
}

export type HumanValidationAnswer = 'yes' | 'medium' | 'no'

export type HumanValidationCheck = {
  id: 'see_system_better' | 'vulnerability_feels_right' | 'know_what_to_watch'
  label: string
  answer: HumanValidationAnswer
  evidence: string
}

export type CalibrationVerdict = 'pass' | 'review' | 'rework'

export type CalibrationEvidenceContract = {
  criteria: CalibrationCriterionResult[]
  total: number
  average: number
  verdict: CalibrationVerdict
  human_checks: HumanValidationCheck[]
}

export type QualityGateContract = {
  ok: boolean
  issues: QualityIssue[]
  calibration?: CalibrationEvidenceContract
  requires_section_regeneration: boolean
  sections_to_regenerate: string[]
  trace: TraceMeta
}
