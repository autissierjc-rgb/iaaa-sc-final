import { NextRequest, NextResponse } from 'next/server'
import {
  buildUserMaterialPolicy,
  type UserMaterialKind,
  type UserMaterialRetentionChoice,
  type UserMaterialSensitivity,
} from '@/lib/contracts/userMaterial'

export const dynamic = 'force-dynamic'

type MaterialPolicyRequest = {
  kind?: UserMaterialKind
  sensitivity?: UserMaterialSensitivity
  public_source?: boolean
  user_confirmed_rights?: boolean
  retention_choice?: UserMaterialRetentionChoice
}

const MATERIAL_KINDS: UserMaterialKind[] = ['text', 'url', 'document', 'image', 'spreadsheet', 'dataset', 'audio', 'other']
const SENSITIVITIES: UserMaterialSensitivity[] = ['unknown', 'public', 'professional', 'personal', 'sensitive', 'regulated']
const RETENTION_CHOICES: UserMaterialRetentionChoice[] = ['discard_after_processing', 'keep_private', 'keep_with_private_card']

function isMaterialKind(value: unknown): value is UserMaterialKind {
  return typeof value === 'string' && MATERIAL_KINDS.includes(value as UserMaterialKind)
}

function isSensitivity(value: unknown): value is UserMaterialSensitivity {
  return typeof value === 'string' && SENSITIVITIES.includes(value as UserMaterialSensitivity)
}

function isRetentionChoice(value: unknown): value is UserMaterialRetentionChoice {
  return typeof value === 'string' && RETENTION_CHOICES.includes(value as UserMaterialRetentionChoice)
}

export async function POST(request: NextRequest) {
  let body: MaterialPolicyRequest

  try {
    body = (await request.json()) as MaterialPolicyRequest
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const kind = isMaterialKind(body.kind) ? body.kind : 'document'
  const sensitivity = isSensitivity(body.sensitivity) ? body.sensitivity : 'unknown'
  const retention_choice = isRetentionChoice(body.retention_choice)
    ? body.retention_choice
    : 'discard_after_processing'

  const policy = buildUserMaterialPolicy({
    kind,
    sensitivity,
    public_source: Boolean(body.public_source),
    user_confirmed_rights: Boolean(body.user_confirmed_rights),
    retention_choice,
  })

  return NextResponse.json({
    ok: true,
    mode: 'user_material_policy',
    policy,
  })
}
