import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { ShareVisibility } from '@/lib/contracts/share'
import { planShare } from '@/lib/share'

export const dynamic = 'force-dynamic'

type SharePlanBody = {
  snapshot?: GeneratedCardSnapshot
  target_language?: LanguageCode
  visibility?: ShareVisibility
}

async function readBody(request: NextRequest): Promise<SharePlanBody> {
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
        message: 'Provide a generated card snapshot to plan sharing.',
      },
      { status: 400 },
    )
  }

  if (!body.target_language) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_target_language',
        message: 'Provide a target language for sharing.',
      },
      { status: 400 },
    )
  }

  const plan = planShare({
    snapshot: body.snapshot,
    target_language: body.target_language,
    visibility: body.visibility,
  })

  return NextResponse.json({
    ok: true,
    mode: 'share_plan',
    plan,
  })
}
