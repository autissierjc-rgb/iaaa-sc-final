import { NextRequest, NextResponse } from 'next/server'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import { renderSnapshotPdf } from '@/lib/share/PdfSnapshotRenderer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PdfExportBody = {
  snapshot?: GeneratedCardSnapshot
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
