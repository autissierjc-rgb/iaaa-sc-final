import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import { planPdfExport } from '@/lib/share'

export const dynamic = 'force-dynamic'

type PdfPlanBody = {
  snapshot?: GeneratedCardSnapshot
  target_language?: LanguageCode
}

async function readBody(request: NextRequest): Promise<PdfPlanBody> {
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
        message: 'Provide a generated card snapshot to plan a protected PDF export.',
      },
      { status: 400 },
    )
  }

  const plan = planPdfExport(body.snapshot, {
    target_language: body.target_language,
  })

  return NextResponse.json({
    ok: true,
    mode: 'pdf_export_plan',
    plan,
  })
}
