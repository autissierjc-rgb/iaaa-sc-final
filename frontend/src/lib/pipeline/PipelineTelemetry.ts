import type {
  V2PipelineBlueprint,
  V2PipelineRunTrace,
  V2PipelineStepOutcome,
  V2PipelineStepTrace,
} from '@/lib/contracts/pipeline'

export type PipelineStepMeasurement = {
  stage_id: string
  duration_ms: number
  outcome?: V2PipelineStepOutcome
  warnings?: string[]
  error_kind?: string
}

export function buildPipelineRunTrace(params: {
  id: string
  route: string
  blueprint: V2PipelineBlueprint
  measurements: PipelineStepMeasurement[]
  created_at?: string
}): V2PipelineRunTrace {
  const measuredByStage = new Map(params.measurements.map((measurement) => [measurement.stage_id, measurement]))

  const steps: V2PipelineStepTrace[] = params.blueprint.stages.map((stage) => {
    const measurement = measuredByStage.get(stage.id)
    const duration_ms = measurement?.duration_ms ?? 0
    const outcome: V2PipelineStepOutcome = measurement?.outcome ?? 'skipped'

    return {
      stage_id: stage.id,
      outcome,
      duration_ms,
      budget_ms: stage.latency_budget_ms,
      over_budget: duration_ms > stage.latency_budget_ms,
      warnings: measurement?.warnings ?? [],
      error_kind: measurement?.error_kind,
    }
  })

  const total_duration_ms = steps.reduce((total, step) => total + step.duration_ms, 0)
  const total_budget_ms = params.blueprint.stages.reduce((total, stage) => total + stage.latency_budget_ms, 0)
  const blocking_failure = steps.some((step) => {
    const stage = params.blueprint.stages.find((candidate) => candidate.id === step.stage_id)
    return stage?.blocks_generation && step.outcome === 'failed'
  })

  return {
    id: params.id,
    created_at: params.created_at ?? new Date().toISOString(),
    pipeline_id: params.blueprint.id,
    route: params.route,
    total_duration_ms,
    total_budget_ms,
    blocking_failure,
    steps,
  }
}

export function summarizePipelineRun(trace: V2PipelineRunTrace) {
  const failed = trace.steps.filter((step) => step.outcome === 'failed').length
  const warnings = trace.steps.reduce((total, step) => total + step.warnings.length, 0)
  const over_budget = trace.steps.filter((step) => step.over_budget).length

  return {
    failed,
    warnings,
    over_budget,
    budget_ratio: trace.total_budget_ms > 0 ? trace.total_duration_ms / trace.total_budget_ms : 0,
  }
}
