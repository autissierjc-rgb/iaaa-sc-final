import { NextRequest, NextResponse } from 'next/server'
import type { CtoWatchMetricInput } from '@/lib/contracts/ctoWatch'
import { buildCtoWatchReport } from '@/lib/archive'

export const dynamic = 'force-dynamic'

type CtoWatchBody = {
  metrics?: CtoWatchMetricInput[]
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

  const report = buildCtoWatchReport({
    metrics: Array.isArray(body.metrics) ? body.metrics : [],
  })

  return NextResponse.json({
    ok: true,
    mode: 'cto_watch_passive_contract',
    report,
  })
}
