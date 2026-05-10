import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { ShareSurface } from '@/lib/contracts/share'
import { resolveSharedSnapshot } from '@/lib/share'

export const dynamic = 'force-dynamic'

type ResolveBody = {
  slug?: string
  route_language?: LanguageCode
  surface?: ShareSurface
  snapshot?: GeneratedCardSnapshot
}

async function readBody(request: NextRequest): Promise<ResolveBody> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)

  if (!body.slug) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_slug',
        message: 'Provide a shared snapshot slug to resolve.',
      },
      { status: 400 },
    )
  }

  if (!body.route_language) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_route_language',
        message: 'Provide the localized route language.',
      },
      { status: 400 },
    )
  }

  const plan = resolveSharedSnapshot({
    slug: body.slug,
    route_language: body.route_language,
    surface: body.surface,
    snapshot: body.snapshot,
  })

  return NextResponse.json({
    ok: true,
    mode: 'shared_snapshot_resolve_plan',
    plan,
  })
}
