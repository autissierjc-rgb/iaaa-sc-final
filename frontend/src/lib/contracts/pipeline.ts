export type V2PipelineStageStatus = 'planned' | 'passive' | 'wired'

export type V2PipelineStage = {
  id: string
  order: number
  label: string
  owner_layer: string
  status: V2PipelineStageStatus
  input_contracts: string[]
  output_contracts: string[]
  latency_budget_ms: number
  blocks_generation: boolean
  purpose: string
  failure_policy: string
}

export type V2PipelineBlueprint = {
  id: string
  label: string
  principle: string
  stages: V2PipelineStage[]
}

export type V2PipelineStepOutcome = 'ok' | 'warning' | 'skipped' | 'failed'

export type V2PipelineStepTrace = {
  stage_id: string
  outcome: V2PipelineStepOutcome
  duration_ms: number
  budget_ms: number
  over_budget: boolean
  warnings: string[]
  error_kind?: string
}

export type V2PipelineRunTrace = {
  id: string
  created_at: string
  pipeline_id: string
  route: string
  total_duration_ms: number
  total_budget_ms: number
  blocking_failure: boolean
  steps: V2PipelineStepTrace[]
}
