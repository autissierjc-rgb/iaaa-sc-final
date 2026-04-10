import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

type BranchCode = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'
type Score = 0 | 1 | 2 | 3

type AstrolabeBranch = { b: BranchCode; s: Score; p: boolean }
type AstrolabeResponse = { state: number; branches: AstrolabeBranch[] }

const SYSTEM_PROMPT = `You are the IAAA Astrolabe fast inference engine.
Given a situation, return ONLY this compact JSON:

{"state":62,"branches":[{"b":"I","s":2,"p":false},{"b":"II","s":1,"p":false},{"b":"III","s":3,"p":true},{"b":"IV","s":2,"p":false},{"b":"V","s":1,"p":false},{"b":"VI","s":2,"p":false},{"b":"VII","s":2,"p":false},{"b":"VIII","s":1,"p":false}]}

BRANCH MAPPING: I=Actors II=Interests III=Forces IV=Tensions V=Constraints VI=Uncertainty VII=Time VIII=Space

SCORING RULES:
- scores 0-3 integers only
- max 2 branches at score 3
- max 3 branches at score 2
- exactly 1 primary branch p=true (highest score)
- state 0-100 integer (structural pressure)
- TENSIONS=3 only if explicit conflict between NAMED actors + structural impact
- INTERESTS=3 only if divergent incentives explicitly named
- UNCERTAINTY=3 only if systemic, unpredictable for informed observer

OUTPUT: ONLY raw JSON. No markdown. No text. No extra fields.`

function defaultAstrolabe(): AstrolabeResponse {
  return {
    state: 52,
    branches: [
      { b: 'I', s: 1, p: false },
      { b: 'II', s: 1, p: false },
      { b: 'III', s: 2, p: true },
      { b: 'IV', s: 2, p: false },
      { b: 'V', s: 1, p: false },
      { b: 'VI', s: 1, p: false },
      { b: 'VII', s: 1, p: false },
      { b: 'VIII', s: 1, p: false },
    ],
  }
}

function clampScore(v: unknown): Score {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(3, Math.round(n))) as Score
}

function enforce(payload: AstrolabeResponse): AstrolabeResponse {
  const codes: BranchCode[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
  const map = new Map<BranchCode, AstrolabeBranch>()
  for (const c of codes) map.set(c, { b: c, s: 0, p: false })
  for (const item of payload.branches ?? []) {
    const code = item?.b as BranchCode
    if (codes.includes(code)) map.set(code, { b: code, s: clampScore(item?.s), p: !!item?.p })
  }
  let branches = codes.map(c => map.get(c)!)

  // Max 2 at score 3
  let cnt3 = 0
  branches = branches.map(x => {
    if (x.s !== 3) return x
    if (cnt3 < 2) { cnt3++; return x }
    return { ...x, s: 2 as Score }
  })

  // Max 3 at score 2
  let cnt2 = 0
  branches = branches.map(x => {
    if (x.s !== 2) return x
    if (cnt2 < 3) { cnt2++; return x }
    return { ...x, s: 1 as Score }
  })

  // Exactly 1 primary
  const primaries = branches.filter(x => x.p)
  if (primaries.length !== 1) {
    const strongest = branches.reduce((a, b) => b.s > a.s ? b : a)
    branches = branches.map(x => ({ ...x, p: x.b === strongest.b }))
  }

  return { state: Math.max(0, Math.min(100, Math.round(Number(payload.state) || 52))), branches }
}

function parse(text: string): AstrolabeResponse {
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s === -1 || e <= s) return defaultAstrolabe()
  try {
    return enforce(JSON.parse(text.slice(s, e + 1)) as AstrolabeResponse)
  } catch {
    return defaultAstrolabe()
  }
}

export async function POST(req: NextRequest) {
  try {
    const { situation } = await req.json()
    if (!situation?.trim()) return NextResponse.json(defaultAstrolabe())

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: situation.trim() }],
    })

    const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
    return NextResponse.json(parse(text), { headers: { 'Cache-Control': 'no-store' } })

  } catch (err) {
    console.error('astrolabe error:', err)
    return NextResponse.json(defaultAstrolabe())
  }
}
