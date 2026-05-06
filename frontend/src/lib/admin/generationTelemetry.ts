type GenerationTraceStatus = 'ok' | 'partial' | 'error'

export interface GenerationTraceInput {
  status: GenerationTraceStatus
  gate: 'GENERATE' | 'CLARIFY' | 'REFINE_OPTIONAL' | 'ERROR'
  route: string
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

export function recordGenerationTrace(event: GenerationTraceInput): void {
  try {
    const payload = {
      event: 'sc_generation_trace',
      at: new Date().toISOString(),
      ...event,
    }
    console.info(JSON.stringify(payload))
  } catch {
    // Telemetry must never affect generation.
  }
}
