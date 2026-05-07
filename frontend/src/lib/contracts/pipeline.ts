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
