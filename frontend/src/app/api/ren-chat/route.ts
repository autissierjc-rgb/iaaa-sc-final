import { NextRequest, NextResponse } from 'next/server'
import type { RenChatRequest } from '@/lib/contracts'
import { interpretSituation } from '@/lib/interpretation'
import { runRenChatOrchestrator } from '@/lib/ren'

export const dynamic = 'force-dynamic'

async function readBody(request: NextRequest): Promise<Partial<RenChatRequest>> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function buildInterpretationInput(message: string, body: Partial<RenChatRequest>): string {
  return [
    body.working_context?.situation_hint ? `Situation en cours : ${body.working_context.situation_hint}` : '',
    body.working_context?.pending_questions?.length
      ? `Questions ouvertes : ${body.working_context.pending_questions.join(' | ')}`
      : '',
    `Message utilisateur : ${message}`,
  ].filter(Boolean).join('\n')
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

  const interpretationInput = buildInterpretationInput(message, body)
  const interpretation = await interpretSituation({
    raw_input: interpretationInput,
  }).catch(() => interpretSituation({
    raw_input: interpretationInput,
    mode: 'local_contract',
  }))

  const ren = runRenChatOrchestrator({
    message,
    language: body.language ?? 'fr',
    treatment_plan: body.treatment_plan ?? interpretation.treatment_plan,
    working_context: body.working_context,
    material_sources: body.material_sources,
  })

  return NextResponse.json({
    ok: true,
    mode: 'ren_chat_passive',
    ren,
  })
}
