import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { LanguageProviderId } from '@/lib/contracts/language'
import { planLanguageSnapshot } from '@/lib/share'

export const dynamic = 'force-dynamic'

type LanguagePlanBody = {
  snapshot?: GeneratedCardSnapshot
  source_language?: LanguageCode
  target_language?: LanguageCode
  provider_preference?: LanguageProviderId[]
}

async function readBody(request: NextRequest): Promise<LanguagePlanBody> {
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
        message: 'Provide a generated card snapshot to plan a language snapshot.',
      },
      { status: 400 },
    )
  }

  if (!body.target_language) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_target_language',
        message: 'Provide a target language.',
      },
      { status: 400 },
    )
  }

  const plan = planLanguageSnapshot({
    snapshot: body.snapshot,
    source_language: body.source_language,
    target_language: body.target_language,
    provider_preference: body.provider_preference,
  })

  return NextResponse.json({
    ok: true,
    mode: 'language_snapshot_plan',
    plan,
  })
}
