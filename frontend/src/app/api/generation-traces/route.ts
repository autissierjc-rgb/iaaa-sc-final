import { NextResponse } from 'next/server'
import { listGenerationTraces, summarizeGenerationTraces } from '@/lib/admin/generationTelemetry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const traces = listGenerationTraces()

  return NextResponse.json({
    ok: true,
    mode: 'metadata_only_in_process_buffer',
    summary: summarizeGenerationTraces(traces),
    traces,
  })
}
