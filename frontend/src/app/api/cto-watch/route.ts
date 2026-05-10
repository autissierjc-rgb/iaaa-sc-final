import { NextRequest, NextResponse } from 'next/server'
import type { CtoWatchMetricInput } from '@/lib/contracts/ctoWatch'
import type { GenerationEvent } from '@/lib/contracts/generationArchive'
import { buildCtoWatchMetricsFromEvents, buildCtoWatchReport } from '@/lib/archive'

export const dynamic = 'force-dynamic'

type CtoWatchBody = {
  metrics?: CtoWatchMetricInput[]
  events?: GenerationEvent[]
  estimated_hourly_cost_eur?: number
  shared_card_cache_hit_rate?: number
}

async function readBody(request: NextRequest): Promise<CtoWatchBody> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)
  const metrics = Array.isArray(body.metrics)
    ? body.metrics
    : Array.isArray(body.events)
      ? buildCtoWatchMetricsFromEvents({
          events: body.events,
          estimated_hourly_cost_eur: body.estimated_hourly_cost_eur,
          shared_card_cache_hit_rate: body.shared_card_cache_hit_rate,
        })
      : []

  const report = buildCtoWatchReport({
    metrics,
  })

  return NextResponse.json({
    ok: true,
    mode: Array.isArray(body.events) ? 'cto_watch_from_generation_events' : 'cto_watch_passive_contract',
    metrics,
    report,
  })
}
