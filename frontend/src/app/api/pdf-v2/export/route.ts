import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import { planPdfExport } from '@/lib/share/PdfExportPlanner'
import { renderSnapshotPdf } from '@/lib/share/PdfSnapshotRenderer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PdfExportBody = {
  snapshot?: GeneratedCardSnapshot
  language?: LanguageCode
  target_language?: LanguageCode
}

async function readBody(request: NextRequest): Promise<PdfExportBody> {
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
        message: 'Provide a generated card snapshot to export a PDF.',
      },
      { status: 400 },
    )
  }

  const plan = planPdfExport(body.snapshot, {
    target_language: body.target_language ?? body.language,
  })
  if (plan.status === 'blocked') {
    return NextResponse.json(
      {
        ok: false,
        error: 'pdf_snapshot_not_ready',
        message: 'The snapshot is not complete enough for a protected PDF export.',
        plan,
      },
      { status: 422 },
    )
  }

  const { buffer, filename } = renderSnapshotPdf(body.snapshot)
  const pdfBlob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })

  return new NextResponse(pdfBlob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
