import { NextRequest, NextResponse } from 'next/server'



type BranchCode = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'
type Score = 0 | 1 | 2 | 3

type AstrolabeBranch = { b: BranchCode; s: Score; p: boolean }
type AstrolabeResponse = { state: number; branches: AstrolabeBranch[] }

const SYSTEM_PROMPT = `You are the IAAA Astrolabe fast inference engine.
Given a situation, return ONLY this compact JSON:

{"state":62,"branches":[{"b":"I","s":2,"p":false},{"b":"II","s":1,"p":false},{"b":"III","s":3,"p":true},{"b":"IV","s":2,"p":false},{"b":"V","s":1,"p":false},{"b":"VI","s":2,"p":false},{"b":"VII","s":2,"p":false},{"b":"VIII","s":1,"p":false}]}

BRANCH MAPPING: I=Actors II=Interests III=Forces IV=Tensions V=Constraints VI=Uncertainties VII=Time VIII=Perception

SCORING RULES:
- scores 0-3 integers only
- max 2 branches at score 3
- max 3 branches at score 2
- exactly 1 primary branch p=true (highest score)
- state 0-100 integer (structural pressure)
- TENSIONS=3 only if explicit conflict between NAMED actors + structural impact
- INTERESTS=3 only if divergent incentives explicitly named
- UNCERTAINTIES=3 only if missing context, hidden relations, legal/institutional conditions, money, work, state power, networks, or implicit assumptions could reverse the reading

OUTPUT: ONLY raw JSON. No markdown. No text. No extra fields.`

void SYSTEM_PROMPT

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

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function localAstrolabe(situation: string): AstrolabeResponse {
  const text = situation.toLowerCase()
  const geopolitical = hasAny(text, [/\b(iran|ukraine|gaza|israel|otan|russie|chine|guerre|frappe|cessez|ormuz|hormuz|sanction)\b/i])
  const market = hasAny(text, [/\b(startup|vc|invest|march[eé]|revenu|traction|client|produit|mvp|site|http|\.com|\.org|\.fr)\b/i])
  const personal = hasAny(text, [/\b(fils|fille|enfant|ex|couple|parent|ado|famille|relation|travail|équipe|equipe)\b/i])
  const decision = hasAny(text, [/\b(dois|faut|accepter|refuser|choisir|décider|decider|que faire|où cela|ou cela|va nous mener)\b/i])
  const uncertainty = hasAny(text, [/\b(pourquoi|comment|que penses|incertain|risque|peur|pas clair|comprendre)\b/i])
  const blindSpot = hasAny(text, [/\b(relation|personnel|historique|r[eé]seau|lobby|donateur|conseiller|droit|l[eé]gal|loi|r[eé]glement|social|salarial|travail|[eé]tat|public|subvention|fiscal|norme|infrastructure|co[uû]t cach[eé]|angle mort)\b/i])
  const time = hasAny(text, [/\b(aujourd|demain|jours?|semaines?|mois|urgence|bient[oô]t|lance|launch|2026)\b/i])
  const perception = hasAny(text, [/\b(r[eé]cit|narratif|perception|image|r[eé]putation|confiance|cr[eé]dibilit[eé]|l[eé]gitimit[eé]|opinion|signal|marque|promesse|site|positionnement|avis|penser)\b/i])

  const branches: AstrolabeBranch[] = [
    { b: 'I', s: geopolitical || market || personal ? 2 : 1, p: false },
    { b: 'II', s: decision || market ? 2 : 1, p: false },
    { b: 'III', s: geopolitical || market ? 2 : 1, p: false },
    { b: 'IV', s: geopolitical || personal || decision ? 2 : 1, p: false },
    { b: 'V', s: market || geopolitical ? 2 : 1, p: false },
    { b: 'VI', s: uncertainty || blindSpot || personal || geopolitical || market ? 2 : 1, p: false },
    { b: 'VII', s: time ? 2 : 1, p: false },
    { b: 'VIII', s: perception ? 2 : 1, p: false },
  ]

  const primaryCode: BranchCode =
    geopolitical ? 'IV' :
    market ? 'III' :
    personal ? 'I' :
    decision ? 'II' :
    uncertainty ? 'VI' :
    'III'
  const primary = branches.map((branch) => ({
    ...branch,
    p: branch.b === primaryCode,
    s: branch.b === primaryCode ? Math.max(branch.s, 2) as Score : branch.s,
  }))
  const pressure = primary.reduce((sum, branch) => sum + branch.s, 0)
  const state = Math.max(18, Math.min(78, Math.round(pressure * 5.8 + (geopolitical ? 12 : decision ? 6 : 0))))
  return enforce({ state, branches: primary })
}

export async function POST(req: NextRequest) {
  try {
    const { situation } = await req.json()
    if (!situation?.trim()) return NextResponse.json(defaultAstrolabe())
    return NextResponse.json(localAstrolabe(situation.trim()), { headers: { 'Cache-Control': 'no-store' } })

  } catch (err) {
    console.error('astrolabe error:', err)
    return NextResponse.json(defaultAstrolabe())
  }
}
