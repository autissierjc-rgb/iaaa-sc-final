export type GenerationTraceStatus = 'ok' | 'partial' | 'error'
export type CanonicalTelemetryLayer =
  | 'interpretation'
  | 'dialogue'
  | 'safety'
  | 'security'
  | 'resources'
  | 'expertisesMetiers'
  | 'theatre'
  | 'inquiry'
  | 'scoring'
  | 'writing'
  | 'quality'
  | 'archive'
  | 'share'
  | 'UI/mobile'
  | 'admin/cockpit'

export interface GenerationTraceInput {
  status: GenerationTraceStatus
  gate: 'GENERATE' | 'CLARIFY' | 'REFINE_OPTIONAL' | 'ERROR'
  route: string
  canonicalLayer?: CanonicalTelemetryLayer
  pipelineStep?: string
  diagnostic?: string
  durationMs: number
  inputChars: number
  domain?: string
  intentType?: string
  questionType?: string
  resourcesStatus?: string
  resourcesCount?: number
  modelPath?: 'openai' | 'fallback' | 'local'
  errorKind?: string
}

export type RecordedGenerationTrace = GenerationTraceInput & {
  event: 'sc_generation_trace'
  id: string
  at: string
}

const MAX_GENERATION_TRACES = 80

const generationTraceStore = globalThis as typeof globalThis & {
  __scGenerationTraces?: RecordedGenerationTrace[]
}

function traces(): RecordedGenerationTrace[] {
  generationTraceStore.__scGenerationTraces ??= []
  return generationTraceStore.__scGenerationTraces
}

export function recordGenerationTrace(event: GenerationTraceInput): void {
  try {
    const payload: RecordedGenerationTrace = {
      event: 'sc_generation_trace',
      id: `trace_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      at: new Date().toISOString(),
      ...event,
    }
    traces().unshift(payload)
    if (traces().length > MAX_GENERATION_TRACES) {
      traces().splice(MAX_GENERATION_TRACES)
    }
    console.info(JSON.stringify(payload))
  } catch {
    // Telemetry must never affect generation.
  }
}

export function listGenerationTraces(limit = 40): RecordedGenerationTrace[] {
  return traces().slice(0, Math.max(1, Math.min(limit, MAX_GENERATION_TRACES)))
}

export function summarizeGenerationTraces(input = listGenerationTraces()) {
  const byLayer = input.reduce<Record<string, number>>((acc, trace) => {
    const layer = trace.canonicalLayer ?? 'unknown'
    acc[layer] = (acc[layer] ?? 0) + 1
    return acc
  }, {})
  const byGate = input.reduce<Record<string, number>>((acc, trace) => {
    acc[trace.gate] = (acc[trace.gate] ?? 0) + 1
    return acc
  }, {})

  return {
    total: input.length,
    byLayer,
    byGate,
    latest_at: input[0]?.at,
  }
}
