import { NextRequest, NextResponse } from 'next/server'
import type { RenChatRequest } from '@/lib/contracts'
import { runRenChatOrchestrator } from '@/lib/ren'

export const dynamic = 'force-dynamic'

async function readBody(request: NextRequest): Promise<Partial<RenChatRequest>> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_ren_message',
        message: 'Provide a message for REN.',
      },
      { status: 400 },
    )
  }

  const ren = runRenChatOrchestrator({
    message,
    language: body.language ?? 'fr',
    working_context: body.working_context,
    material_sources: body.material_sources,
  })

  return NextResponse.json({
    ok: true,
    mode: 'ren_chat_passive',
    ren,
  })
}
