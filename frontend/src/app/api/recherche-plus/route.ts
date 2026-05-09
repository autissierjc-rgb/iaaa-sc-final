import { NextRequest, NextResponse } from 'next/server'
import { runRecherchePlus } from '@/lib/recherchePlus'
import type { RecherchePlusContract } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

type RecherchePlusBody = {
  contract?: RecherchePlusContract
  mode?: 'simulated'
}

async function readBody(request: NextRequest): Promise<RecherchePlusBody> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)

  if (!body.contract || !Array.isArray(body.contract.radar_tasks)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_recherche_plus_contract',
        message: 'Provide a prepared RecherchePlusContract.',
      },
      { status: 400 },
    )
  }

  const result = runRecherchePlus({
    contract: body.contract,
    mode: body.mode ?? 'simulated',
  })

  return NextResponse.json({
    ok: true,
    mode: 'recherche_plus_simulated',
    recherche_plus: result,
  })
}
