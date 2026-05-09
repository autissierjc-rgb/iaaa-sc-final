import { NextRequest, NextResponse } from 'next/server'
import { buildUserReactionEvent } from '@/lib/archive'

export const dynamic = 'force-dynamic'

type ReactionV2Body = {
  message?: string
  generation_event_id?: string
  session_id?: string
  user_id?: string
  allow_private_learning?: boolean
}

async function readBody(request: NextRequest): Promise<ReactionV2Body> {
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
        error: 'missing_reaction_message',
        message: 'Provide a reaction message.',
      },
      { status: 400 },
    )
  }

  const reaction = buildUserReactionEvent({
    message,
    generation_event_id: body.generation_event_id,
    session_id: body.session_id,
    user_id: body.user_id,
    allow_private_learning: body.allow_private_learning,
  })

  return NextResponse.json({
    ok: true,
    mode: reaction.privacy_mode,
    reaction,
  })
}
