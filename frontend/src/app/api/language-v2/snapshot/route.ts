import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import { planTranslatedSnapshot } from '@/lib/share'

export const dynamic = 'force-dynamic'

type SnapshotBody = {
  snapshot?: GeneratedCardSnapshot
  target_language?: LanguageCode
}

async function readBody(request: NextRequest): Promise<SnapshotBody> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)

  if (!body.snapshot || typeof body.snapshot !== 'object') {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_snapshot',
        message: 'Provide a generated card snapshot to plan a translated snapshot.',
      },
      { status: 400 },
    )
  }

  if (!body.target_language) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_target_language',
        message: 'Provide the target snapshot language.',
      },
      { status: 400 },
    )
  }

  const plan = planTranslatedSnapshot({
    snapshot: body.snapshot,
    target_language: body.target_language,
  })

  return NextResponse.json({
    ok: true,
    mode: 'translated_snapshot_plan',
    plan,
  })
}
