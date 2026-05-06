import type { TraceMeta } from './common'

export type QualityIssueLevel = 'info' | 'warning' | 'error'

export type QualityIssue = {
  level: QualityIssueLevel
  code: string
  message: string
  field?: string
}

export type QualityGateContract = {
  ok: boolean
  issues: QualityIssue[]
  requires_section_regeneration: boolean
  sections_to_regenerate: string[]
  trace: TraceMeta
}
