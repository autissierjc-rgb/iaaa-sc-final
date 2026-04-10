import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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
Rules: 2 sentences max. No jargon. No preamble.`

const CLARIFY_PROMPT = `You are IAAA — structural intelligence.
Return ONLY: {"questions":["q1","q2"]}
Max 2 questions. Short. Same language as input.`

// Fast Card — compact, no justifications, bilingue courts uniquement
const FAST_CARD_PROMPT = `You are IAAA SIS — structural analysis engine.
Return ONLY valid JSON. No markdown. No text outside JSON.

CONTEXT (silent): detect territory, domain, emotional register, temporal context.
HUMAN UNCERTAINTY: the load-bearing contradiction is one layer below the surface.

CALIBRAGE:
State index 0-100 from structural pressure.
States: 0-39=Stable/Clear | 40-54=Contrôlable/Navigable | 55-69=Vigilance/Watch | 70-89=Critique/Critical | 90-100=Hors contrôle/Loss of Control

PATTERNS (silent, never display):
Systemic: Escalation spiral / Dependency trap / Principal-agent conflict / Power asymmetry / Coordination failure / Strategic lag / Trust breakdown
Human: Identity Split / Loyalty Conflict / Dependency Loop / Recognition Asymmetry / Shame-Avoidance Loop / Fear-of-Loss Paralysis / Emotional Load Asymmetry / Unspoken Contract Breakdown / Boundary Erosion / Meaning Collapse / Validation Trap

Return ONLY this JSON (compact, no extras):
{
  "title": "(FR 6 words max)", "title_en": "(EN)",
  "submitted_situation": "restate, correct spelling (FR)", "submitted_situation_en": "(EN)",
  "state_index_final": <0-100>,
  "state_label": "<fr>", "state_label_en": "<en>",
  "insight": "(FR 2 sentences)", "insight_en": "(EN)",
  "vulnerability": "(FR short)", "vulnerability_en": "(EN)",
  "asymmetry": "(FR short)", "asymmetry_en": "(EN)",
  "radar_scores": [
    {"dimension":"Impact","dimension_en":"Impact","score":<1-3>,"note":"(FR short)","note_en":"(EN)"},
    {"dimension":"Urgence","dimension_en":"Urgency","score":<1-3>,"note":"(FR short)","note_en":"(EN)"},
    {"dimension":"Incertitude","dimension_en":"Uncertainty","score":<1-3>,"note":"(FR short)","note_en":"(EN)"},
    {"dimension":"Réversibilité","dimension_en":"Reversibility","score":<1-3>,"note":"(FR short)","note_en":"(EN)"}
  ],
  "cap_summary": {
    "hook": "(FR)", "hook_en": "(EN)",
    "insight": "(FR)", "insight_en": "(EN)",
    "watch": "(FR)", "watch_en": "(EN)"
  },
  "trajectories": [
    {"type":"Stabilisation","type_en":"Stabilization","color":"#1D9E75","title":"(FR)","title_en":"(EN)","description":"(FR 1 sentence)","description_en":"(EN)","signal_precurseur":"(FR)","signal_precurseur_en":"(EN)"},
    {"type":"Escalade","type_en":"Escalation","color":"#E06B4A","title":"(FR)","title_en":"(EN)","description":"(FR 1 sentence)","description_en":"(EN)","signal_precurseur":"(FR)","signal_precurseur_en":"(EN)"},
    {"type":"Rupture","type_en":"Regime Shift","color":"#378ADD","title":"(FR)","title_en":"(EN)","description":"(FR 1 sentence)","description_en":"(EN)","signal_precurseur":"(FR)","signal_precurseur_en":"(EN)"}
  ],
  "signal": "(FR 1 observable sentence)", "signal_en": "(EN)",
  "analysis": {
    "avertissement": "(FR what NOT to do)", "avertissement_en": "(EN)",
    "mouvements_recommandes": ["(FR)","(FR)","(FR)"],
    "mouvements_recommandes_en": ["(EN)","(EN)","(EN)"],
    "synthese": "(FR 1 sentence)", "synthese_en": "(EN)"
  }
}

SELF-CHECK: signal=observable? trajectories=different regimes? vulnerability=concrete? avertissement=what NOT to do?`

function parseJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()
  try { return JSON.parse(clean) } catch {
    return JSON.parse(clean.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\r?\n/g, ' '))
  }
}

async function generateFastCard(situation: string) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: `${FAST_CARD_PROMPT}\n\nSituation:\n${situation}` }],
  })
  const raw = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('').replace(/```json|```/g, '').trim()
  return parseJSON(raw)
}

export async function POST(req: NextRequest) {
  try {
    const { situation, mode, lang = 'fr' } = await req.json()
    if (!situation?.trim()) return NextResponse.json({ error: 'No situation' }, { status: 400 })
    const text = situation.trim()

    // Mode forcé (depuis FLASH expand ou astrolabe first)
    if (mode === 'generate' || mode === 'generate_full') {
      const sc = await generateFastCard(text)
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

    // GENERATE
    const sc = await generateFastCard(text)
    return NextResponse.json({ gate: 'GENERATE', sc })

  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
