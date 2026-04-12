import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// ── GATE DÉTERMINISTE (TypeScript pur, zéro LLM) ─────────────────────────────

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
const PERSONAL_MARKERS = [
  ' je ', " j'", ' mon ', ' ma ', ' mes ', ' moi ', ' nous ', ' notre ', ' nos ',
  ' my ', " i'm ", ' we ', ' our ', " i'd ", " i've ",
]
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
  if (PERSONAL_MARKERS.some(m => t.includes(m))) return 'CLARIFY'
  if (STATUS_MARKERS.some(m => t.includes(m))) return 'FLASH'
  return 'GENERATE'
}

// ── PROMPTS ───────────────────────────────────────────────────────────────────

const FLASH_PROMPT = `You are IAAA — a structural intelligence system.
The user asked a public status question.
Return ONLY raw JSON. No markdown. No backticks.

Schema:
{
  "etat_actuel": "one factual sentence about current state (FR)",
  "etat_actuel_en": "same in EN",
  "lecture": "one structural sentence naming the deeper dynamic (FR)",
  "lecture_en": "same in EN"
}

Rules:
- 2 sentences maximum total
- No jargon, no preamble, no questions, no lists
- If you lack recent data, be structurally honest: name the dynamics, not invented facts
- Never say "je vais analyser" or start with "Pour analyser"
- Write in French for etat_actuel/lecture, English for _en fields`

const CLARIFY_PROMPT = `You are IAAA — a structural intelligence system.
The situation is personal or professional but lacks key structural elements.
Return ONLY raw JSON. No markdown. No backticks.

Schema:
{ "questions": ["question 1", "question 2"] }

Rules:
- Maximum 2 questions
- Each targets one missing element: actors, scope, core issue, or timeframe
- Short, direct, not therapeutic
- Write in the same language as the input`

const SC_PROMPT = `You are IAAA SIS — structural analysis engine.
Return ONLY valid JSON. No markdown. No text outside JSON.

CONTEXT PRE-LOADING (silent):
Axis 1 Territory: geographic constraints shape vulnerability profiles.
Axis 2 Domain: load sector standards silently (humanitarian, legal, medical, financial).
Axis 3 Emotional state: detect register (distress/fatigue/resignation/clarity). Adjust formulation not diagnosis.
Axis 4 Socio-cultural: calibrate vocabulary and realism from language/framing.
Axis 5 Temporal: integrate recent dynamics for dated situations only.

HUMAN UNCERTAINTY PRINCIPLE: what is submitted is never complete. The load-bearing contradiction is one layer below the surface.

PATTERN DETECTION (silent, never display):
Systemic: Escalation spiral / Dependency trap / Principal-agent conflict / Power asymmetry / Coordination failure / Strategic lag / Trust breakdown / Replacement lag / Institutional absorption limit
Human: Identity Split / Loyalty Conflict / Dependency Loop / Recognition Asymmetry / Shame-Avoidance Loop / Fear-of-Loss Paralysis / Self-Worth Role Fusion / Chronic Over-Adaptation / Emotional Load Asymmetry / Unspoken Contract Breakdown / Hidden Resentment Accumulation / Boundary Erosion / Meaning Collapse Under Constraint / Care Burden Imbalance / Validation Trap / Deferred Conflict Saturation / Projection Misalignment / Attachment-Security Conflict / Invisible Standards Pressure / Role Container Failure

CALIBRAGE (figé):
Astrolabe 8 branches 0-3. TENSIONS=3 only if explicit conflict NAMED actors + structural impact. PRIMARY=one branch max.
Radar 4 dimensions 1-3: Impact/Urgence/Incertitude/Réversibilité.
astrolabe_base = (sum/24)x100
radar_pressure = (Impact-1)/2x0.30 + (Urgence-1)/2x0.25 + (Incertitude-1)/2x0.25 + (Réversibilité-1)/2x0.20
state_index_raw = astrolabe_base x 0.65 + (radar_pressure x 100) x 0.35
Adjustment -5 to +5 max.
States: 0-39=Stable/Clear | 40-54=Contrôlable/Navigable | 55-69=Vigilance/Watch | 70-89=Critique/Critical | 90-100=Hors contrôle/Loss of Control

OUTPUT SCHEMA (all fields required, no extras):
{
  "title": "(FR)", "title_en": "(EN)",
  "category": "Professionnel|Personnel|Gouvernance|Social|Géopolitique",
  "category_en": "Professional|Personal|Governance|Social|Geopolitical",
  "submitted_situation": "restate submitted situation, correct spelling only (FR)",
  "submitted_situation_en": "same in EN",
  "state_index_final": <0-100>,
  "state_label": "<fr>", "state_label_en": "<en>",
  "confidence": "faible|moyenne|élevée", "confidence_en": "low|medium|high",
  "insight": "(FR)", "insight_en": "(EN)",
  "vulnerability": "concrete structural failure point (FR)", "vulnerability_en": "(EN)",
  "asymmetry": "what everyone manages vs what no one protects (FR)", "asymmetry_en": "(EN)",
  "astrolabe_scores": [
    { "branch": "I",    "name": "Acteurs",    "name_en": "Actors",       "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "II",   "name": "Intérêts",   "name_en": "Interests",    "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "III",  "name": "Forces",     "name_en": "Forces",       "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "IV",   "name": "Tensions",   "name_en": "Tensions",     "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "V",    "name": "Contraintes","name_en": "Constraints",  "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "VI",   "name": "Incertitude","name_en": "Uncertainty",  "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "VII",  "name": "Temps",      "name_en": "Time",         "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "VIII", "name": "Espace",     "name_en": "Space",        "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> }
  ],
  "radar_scores": [
    { "dimension": "Impact",        "dimension_en": "Impact",        "score": <1-3>, "note": "(FR)", "note_en": "(EN)" },
    { "dimension": "Urgence",       "dimension_en": "Urgency",       "score": <1-3>, "note": "(FR)", "note_en": "(EN)" },
    { "dimension": "Incertitude",   "dimension_en": "Uncertainty",   "score": <1-3>, "note": "(FR)", "note_en": "(EN)" },
    { "dimension": "Réversibilité", "dimension_en": "Reversibility", "score": <1-3>, "note": "(FR)", "note_en": "(EN)" }
  ],
  "cap_summary": {
    "hook": "(FR)", "hook_en": "(EN)",
    "insight": "(FR)", "insight_en": "(EN)",
    "vulnerability": "(FR)", "vulnerability_en": "(EN)",
    "asymmetry": "(FR)", "asymmetry_en": "(EN)",
    "watch": "(FR)", "watch_en": "(EN)"
  },
  "trajectories": [
    { "type": "Stabilisation", "type_en": "Stabilization", "color": "#1D9E75", "title": "(FR)", "title_en": "(EN)", "description": "(FR)", "description_en": "(EN)", "signal_precurseur": "(FR)", "signal_precurseur_en": "(EN)" },
    { "type": "Escalade",      "type_en": "Escalation",    "color": "#E06B4A", "title": "(FR)", "title_en": "(EN)", "description": "(FR)", "description_en": "(EN)", "signal_precurseur": "(FR)", "signal_precurseur_en": "(EN)" },
    { "type": "Rupture",       "type_en": "Regime Shift",  "color": "#378ADD", "title": "(FR)", "title_en": "(EN)", "description": "system changes NATURE not intensity (FR)", "description_en": "(EN)", "signal_precurseur": "(FR)", "signal_precurseur_en": "(EN)" }
  ],
  "signal": "(FR)", "signal_en": "(EN)",
  "analysis": {
    "lecture_systeme": "(FR)", "lecture_systeme_en": "(EN)",
    "avertissement": "what must NOT be done (FR)", "avertissement_en": "(EN)",
    "mouvements_recommandes": ["(FR)","(FR)","(FR)"],
    "mouvements_recommandes_en": ["(EN)","(EN)","(EN)"],
    "synthese": "(FR)", "synthese_en": "(EN)"
  }
}

SELF-CHECK before output:
signal=observable? trajectories=different regimes? vulnerability=concrete? primary=dominant? asymmetry=named? avertissement=what NOT to do?`

// ── HANDLER ───────────────────────────────────────────────────────────────────

async function generateSC(situation: string) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    messages: [{ role: 'user', content: `${SC_PROMPT}\n\nSituation:\n${situation}` }],
  })
  const raw = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('').replace(/```json|```/g, '').trim()
  return JSON.parse(raw)
}

export async function POST(req: NextRequest) {
  try {
    const { situation, mode, lang = 'fr' } = await req.json()
    if (!situation?.trim()) {
      return NextResponse.json({ error: 'No situation provided' }, { status: 400 })
    }
    const text = situation.trim()

    // Mode forcé depuis bouton "Situation Card" sous FLASH
    if (mode === 'generate') {
      const sc = await generateSC(text)
      return NextResponse.json({ gate: 'GENERATE', sc })
    }

    const gate = detectGate(text)

    if (gate === 'BLOCK') {
      const reason = lang === 'fr'
        ? 'Cette formulation ne permet pas d\'analyse structurelle. Une situation analysable décrit des acteurs, des forces en présence et des trajectoires possibles.'
        : 'This formulation does not allow structural analysis. An analysable situation describes actors, forces at play, and possible trajectories.'
      return NextResponse.json({ gate: 'BLOCK', reason })
    }

    if (gate === 'FLASH') {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: `${FLASH_PROMPT}\n\nQuestion: ${text}` }],
      })
      const raw = msg.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('').replace(/```json|```/g, '').trim()
      try {
        const flash = JSON.parse(raw)
        return NextResponse.json({ gate: 'FLASH', flash })
      } catch {
        // fallback GENERATE si FLASH parse échoue
        const sc = await generateSC(text)
        return NextResponse.json({ gate: 'GENERATE', sc })
      }
    }

    if (gate === 'CLARIFY') {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: `${CLARIFY_PROMPT}\n\nSituation: ${text}` }],
      })
      const raw = msg.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('').replace(/```json|```/g, '').trim()
      try {
        const clarify = JSON.parse(raw)
        return NextResponse.json({ gate: 'CLARIFY', questions: clarify.questions ?? [] })
      } catch {
        return NextResponse.json({ gate: 'CLARIFY', questions: [] })
      }
    }

    // GENERATE
    const sc = await generateSC(text)
    return NextResponse.json({ gate: 'GENERATE', sc })

  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
