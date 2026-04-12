import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { computeState, getStateLabel, AstrolabeBranch, RadarScores } from '@/lib/scoring'

const client = new Anthropic()

// ── GATE DÉTERMINISTE ─────────────────────────────────────────────────────────
const BLOCK_MARKERS = [
  "confirme que j'ai raison", "prouve que j'ai raison", "dis-moi que j'ai raison",
  "confirm i'm right", "prove i'm right", "tell me i'm right",
  'valide ma décision', 'valide mon choix',
]
const STATUS_MARKERS = [
  'où en est', 'ou en est', 'where are we', "what's happening", 'what is happening',
  'latest on', 'update on', 'que se passe-t-il', 'que se passe t-il',
  'status of', 'état de', 'etat de', 'how is the', 'comment va',
  'où en sommes', 'ou en sommes', 'how are things', 'news on',
]
const PERSONAL_MARKERS = [' je ', " j'", ' mon ', ' ma ', ' mes ', ' moi ', ' my ', " i'm ", " i'd ", " i've "]
const ORG_MARKERS = [
  'équipe', 'equipe', 'board', 'comex', 'ceo', 'cfo', 'dg ', 'pdg',
  'entreprise', 'client', 'projet', 'project', 'ong', 'ngo',
  'manager', 'associé', 'associe', 'fondateur', 'startup',
  'organisation', 'organization', 'institution', 'direction',
]
const ANALYSIS_MARKERS = [
  'analyse', 'analyze', 'structure', 'situation card', ' sc ', 'diagnostic',
  'trajectoire', 'trajectory', 'vulnérabilité', 'vulnerability',
  'fais une', 'génère', 'generate', 'create a card', 'make a card',
]

type GateMode = 'FLASH' | 'GENERATE' | 'CLARIFY' | 'BLOCK'

function detectGate(text: string): GateMode {
  const t = text.toLowerCase()
  if (BLOCK_MARKERS.some(m => t.includes(m))) return 'BLOCK'
  if (ANALYSIS_MARKERS.some(m => t.includes(m))) return 'GENERATE'
  if (ORG_MARKERS.some(m => t.includes(m))) return 'GENERATE'
  if (STATUS_MARKERS.some(m => t.includes(m))) return 'FLASH'
  if (PERSONAL_MARKERS.some(m => t.includes(m))) return 'CLARIFY'
  return 'GENERATE'
}

// ── PROMPTS ───────────────────────────────────────────────────────────────────
const FLASH_PROMPT = `You are IAAA — a structural intelligence system.
Return ONLY raw JSON. No markdown.
{"etat_actuel":"(FR)","etat_actuel_en":"(EN)","lecture":"(FR)","lecture_en":"(EN)"}
Rules: 2 sentences max. No jargon. No preamble. Structurally honest if data lacking.`

const CLARIFY_PROMPT = `You are IAAA — structural intelligence.
Return ONLY: {"questions":["q1","q2"]}
Max 2 questions. Short. Same language as input.`

const FAST_CARD_PROMPT = `You are the IAAA Situation Card engine.

Your role:
Produce a fast, structured, decision-grade Situation Card.

CONTEXT (silent):
- detect territory, domain, emotional register, temporal context
- the load-bearing contradiction is one layer below the surface

PATTERN DETECTION (silent, never display):
Systemic: Escalation spiral / Dependency trap / Principal-agent conflict / Power asymmetry / Coordination failure / Strategic lag / Trust breakdown
Human: Identity Split / Loyalty Conflict / Dependency Loop / Recognition Asymmetry / Shame-Avoidance / Fear-of-Loss Paralysis / Emotional Load Asymmetry / Unspoken Contract Breakdown / Boundary Erosion / Meaning Collapse / Validation Trap

OUTPUT:
Return ONLY valid JSON. No markdown. No text outside JSON.

{
  "title_fr": "max 6 words",
  "title_en": "max 6 words",
  "submitted_situation_fr": "restate submitted situation, correct spelling, no reformulation",
  "submitted_situation_en": "same in EN",
  "insight_fr": "2 sentences — reveal structure, not summarize",
  "insight_en": "same in EN",
  "main_vulnerability_fr": "structural failure point — precise and testable",
  "main_vulnerability_en": "same in EN",
  "asymmetry_fr": "what everyone manages vs what no one protects",
  "asymmetry_en": "same in EN",
  "radar": {
    "impact": <0-100>,
    "urgency": <0-100>,
    "uncertainty": <0-100>,
    "reversibility": <0-100>
  },
  "trajectories": [
    {
      "type": "stabilization",
      "title_fr": "",
      "title_en": "",
      "description_fr": "1 sentence — return to coherence",
      "description_en": "",
      "signal_fr": "observable signal",
      "signal_en": ""
    },
    {
      "type": "escalation",
      "title_fr": "",
      "title_en": "",
      "description_fr": "1 sentence — intensification without structural change",
      "description_en": "",
      "signal_fr": "",
      "signal_en": ""
    },
    {
      "type": "regime_shift",
      "title_fr": "",
      "title_en": "",
      "description_fr": "1 sentence — system changes NATURE not intensity",
      "description_en": "",
      "signal_fr": "",
      "signal_en": ""
    }
  ],
  "key_signal_fr": "1 observable, concrete, binary signal",
  "key_signal_en": "",
  "cap": {
    "hook_fr": "< 15 words, striking",
    "hook_en": "",
    "watch_fr": "observable signal to monitor",
    "watch_en": ""
  },
  "movements_fr": ["immediate action", "structural action", "observation / positioning"],
  "movements_en": ["", "", ""],
  "avertissement_fr": "what must NOT be done — 1 sentence",
  "avertissement_en": ""
}

RULES:
INSIGHT: must reveal structure, not summarize. No fluff.
MAIN VULNERABILITY: structural, precise, testable. No vague wording.
RADAR: reflects decision tension. Must be coherent with situation.
  - impact: structural consequence if nothing changes (0=none, 100=systemic)
  - urgency: time pressure on decisions (0=no pressure, 100=critical deadline)
  - uncertainty: unknowns that could change the reading (0=clear, 100=opaque)
  - reversibility: how reversible is the current trajectory (0=irreversible, 100=fully reversible)
TRAJECTORIES: exactly 3, structurally different regimes — not 3 intensity variations.
KEY SIGNAL: one only, observable and concrete.
MOVEMENTS: exactly 3 — immediate / structural / observation. No orders.
AVERTISSEMENT: what NOT to do. One sentence. No moralizing.
LANGUAGE: concise, factual, no drama, translations natural not literal.

IMPORTANT: JSON only. No markdown. No meta-commentary.`

// ── SCORING BACKEND ───────────────────────────────────────────────────────────
function parseJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()
  try { return JSON.parse(clean) }
  catch {
    return JSON.parse(
      clean.replace(/[\u2018\u2019]/g, "'")
           .replace(/[\u201C\u201D]/g, '"')
           .replace(/\r?\n/g, ' ')
    )
  }
}

function enrichWithScoring(
  sc: Record<string, unknown>,
  branches: AstrolabeBranch[]
): Record<string, unknown> {
  const radar = sc.radar as RadarScores | undefined
  if (!radar) return sc

  const state = branches.length > 0
    ? computeState(branches, radar)
    : Math.round(Math.max(0, Math.min(100, radar.impact * 0.30 + radar.urgency * 0.25 + radar.uncertainty * 0.25 + (100 - radar.reversibility) * 0.20)))
  return {
    ...sc,
    state_index_final: state,
    state_label: getStateLabel(state, 'fr'),
    state_label_en: getStateLabel(state, 'en'),
  }
}

async function generateFastCard(
  situation: string,
  branches: AstrolabeBranch[] = []
) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    messages: [{ role: 'user', content: `${FAST_CARD_PROMPT}\n\nSituation:\n${situation}` }],
  })
  const raw = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('').replace(/```json|```/g, '').trim()

  const sc = parseJSON(raw)
  return enrichWithScoring(sc, branches)
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { situation, mode, lang = 'fr', astrolabe_branches } = await req.json()
    if (!situation?.trim()) return NextResponse.json({ error: 'No situation' }, { status: 400 })
    const text = situation.trim()

    // Mode forcé
    if (mode === 'generate' || mode === 'generate_full') {
      const sc = await generateFastCard(text, astrolabe_branches ?? [])
      return NextResponse.json({ gate: 'GENERATE', sc })
    }

    const gate = detectGate(text)

    if (gate === 'BLOCK') {
      const reason = lang === 'fr'
        ? "Cette formulation ne permet pas d'analyse structurelle."
        : 'This formulation does not allow structural analysis.'
      return NextResponse.json({ gate: 'BLOCK', reason })
    }

    if (gate === 'FLASH') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: `${FLASH_PROMPT}\n\nQuestion: ${text}` }],
      })
      const raw = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('').replace(/```json|```/g, '').trim()
      try { return NextResponse.json({ gate: 'FLASH', flash: JSON.parse(raw) }) }
      catch { return NextResponse.json({ gate: 'GENERATE', sc: await generateFastCard(text) }) }
    }

    if (gate === 'CLARIFY') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: `${CLARIFY_PROMPT}\n\nSituation: ${text}` }],
      })
      const raw = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('').replace(/```json|```/g, '').trim()
      try { return NextResponse.json({ gate: 'CLARIFY', questions: JSON.parse(raw).questions ?? [] }) }
      catch { return NextResponse.json({ gate: 'CLARIFY', questions: [] }) }
    }

    // GENERATE — gate only, pas de génération SC
    return NextResponse.json({ gate: 'GENERATE' })

  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
