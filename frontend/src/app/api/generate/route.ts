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
const PERSONAL_MARKERS = [
  ' je ', " j'", ' mon ', ' ma ', ' mes ', ' moi ',
  ' my ', " i'm ", " i'd ", " i've ",
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
  if (STATUS_MARKERS.some(m => t.includes(m))) return 'FLASH'
  if (PERSONAL_MARKERS.some(m => t.includes(m))) return 'CLARIFY'
  return 'GENERATE'
}

// ── PROMPTS ───────────────────────────────────────────────────────────────────

const FLASH_PROMPT = `You are IAAA — a structural intelligence system.
The user asked a public status question.
Return ONLY raw JSON. No markdown. No backticks.
Schema:
{
  "etat_actuel": "one factual sentence (FR)",
  "etat_actuel_en": "same in EN",
  "lecture": "one structural sentence (FR)",
  "lecture_en": "same in EN"
}
Rules: 2 sentences max. No jargon. No preamble. Structurally honest if data lacking.`

const CLARIFY_PROMPT = `You are IAAA — a structural intelligence system.
Return ONLY raw JSON. No markdown.
Schema: { "questions": ["q1", "q2"] }
Rules: max 2 questions, short and direct, same language as input.`

// Appel 1 — Astrolabe uniquement (~800 tokens)
const ASTROLABE_PROMPT = `You are IAAA SIS — structural analysis engine.
Return ONLY valid JSON. No markdown. No text outside JSON.

CALIBRAGE:
Astrolabe 8 branches 0-3.
TENSIONS=3 ONLY if explicit conflict between NAMED actors AND structural impact. Friction → max 2.
INTERESTS=3 ONLY if divergent incentives explicitly named. Personal stake → max 2.
UNCERTAINTY=3 ONLY if systemic, unpredictable even for informed observer. Decisional → max 2.
SPACE=3 ONLY if geographic constraints are primary driver.
TIME=3 ONLY if irreversible deadline is central constraint.
RULE: Maximum 3 branches at score 3. If more would score 3, downgrade least decisive to 2.
Maximum 1 primary branch (2 if truly equal, never 3).
Labels: 0=Absent 1=Faible 2=Modéré 3=Dominant

astrolabe_base = (sum/24)x100
radar_pressure = (Impact-1)/2x0.30 + (Urgence-1)/2x0.25 + (Incertitude-1)/2x0.25 + (Réversibilité-1)/2x0.20
state_index_raw = astrolabe_base x 0.65 + (radar_pressure x 100) x 0.35
Adjustment -5 to +5 max.
States: 0-39=Stable/Clear | 40-54=Contrôlable/Navigable | 55-69=Vigilance/Watch | 70-89=Critique/Critical | 90-100=Hors contrôle/Loss of Control

PATTERN DETECTION (silent):
Systemic: Escalation spiral / Dependency trap / Principal-agent conflict / Power asymmetry / Coordination failure / Strategic lag / Trust breakdown / Replacement lag / Institutional absorption limit
Human: Identity Split / Loyalty Conflict / Dependency Loop / Recognition Asymmetry / Shame-Avoidance Loop / Fear-of-Loss Paralysis / Self-Worth Role Fusion / Chronic Over-Adaptation / Emotional Load Asymmetry / Unspoken Contract Breakdown / Hidden Resentment Accumulation / Boundary Erosion / Meaning Collapse Under Constraint / Care Burden Imbalance / Validation Trap / Deferred Conflict Saturation / Projection Misalignment / Attachment-Security Conflict / Invisible Standards Pressure / Role Container Failure

CONTEXT (silent): detect territory, domain, emotional state, socio-cultural level, temporal context. Adjust formulation not diagnosis.
HUMAN UNCERTAINTY: what is submitted is never complete. The contradiction is one layer below.

Return ONLY this JSON:
{
  "title": "(FR)", "title_en": "(EN)",
  "category": "Professionnel|Personnel|Gouvernance|Social|Géopolitique",
  "category_en": "Professional|Personal|Governance|Social|Geopolitical",
  "submitted_situation": "restate exactly, correct spelling (FR)",
  "submitted_situation_en": "same in EN",
  "state_index_final": <0-100>,
  "state_label": "<fr>", "state_label_en": "<en>",
  "confidence": "faible|moyenne|élevée", "confidence_en": "low|medium|high",
  "astrolabe_scores": [
    { "branch": "I",    "name": "Acteurs",    "name_en": "Actors",      "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "II",   "name": "Intérêts",   "name_en": "Interests",   "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "III",  "name": "Forces",     "name_en": "Forces",      "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "IV",   "name": "Tensions",   "name_en": "Tensions",    "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "V",    "name": "Contraintes","name_en": "Constraints", "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "VI",   "name": "Incertitude","name_en": "Uncertainty", "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "VII",  "name": "Temps",      "name_en": "Time",        "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> },
    { "branch": "VIII", "name": "Espace",     "name_en": "Space",       "display_score": <0-3>, "label": "", "label_en": "", "justification": "(FR)", "justification_en": "(EN)", "is_primary": <bool> }
  ]
}`

// Appel 2 — Reste de la SC (~4000 tokens)
const SC_REST_PROMPT = `You are IAAA SIS — structural analysis engine.
You have already computed the astrolabe scores and state index for this situation.
Now complete the Situation Card with all remaining fields.
Return ONLY valid JSON. No markdown. No text outside JSON.

CALIBRAGE RADAR:
Radar 4 dimensions 1-3: Impact/Urgence/Incertitude/Réversibilité.
radar_pressure = (Impact-1)/2x0.30 + (Urgence-1)/2x0.25 + (Incertitude-1)/2x0.25 + (Réversibilité-1)/2x0.20
Use the same structural diagnosis as the astrolabe. Be consistent.

Return ONLY this JSON:
{
  "insight": "(FR)", "insight_en": "(EN)",
  "vulnerability": "concrete structural failure point (FR)", "vulnerability_en": "(EN)",
  "asymmetry": "what everyone manages vs what no one protects (FR)", "asymmetry_en": "(EN)",
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

SELF-CHECK: signal=observable? trajectories=different regimes? vulnerability=concrete? avertissement=what NOT to do?`

// ── HANDLER ───────────────────────────────────────────────────────────────────

function parseJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
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
      return streamGenerate(text)
    }

    const gate = detectGate(text)

    if (gate === 'BLOCK') {
      const reason = lang === 'fr'
        ? "Cette formulation ne permet pas d'analyse structurelle. Une situation analysable décrit des acteurs, des forces en présence et des trajectoires possibles."
        : 'This formulation does not allow structural analysis. An analysable situation describes actors, forces at play, and possible trajectories.'
      return NextResponse.json({ gate: 'BLOCK', reason })
    }

    if (gate === 'FLASH') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: `${FLASH_PROMPT}\n\nQuestion: ${text}` }],
      })
      const raw = msg.content.filter(b => b.type === 'text').map(b => (b as {type:'text';text:string}).text).join('').replace(/```json|```/g, '').trim()
      try {
        const flash = JSON.parse(raw)
        return NextResponse.json({ gate: 'FLASH', flash })
      } catch {
        return streamGenerate(text)
      }
    }

    if (gate === 'CLARIFY') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: `${CLARIFY_PROMPT}\n\nSituation: ${text}` }],
      })
      const raw = msg.content.filter(b => b.type === 'text').map(b => (b as {type:'text';text:string}).text).join('').replace(/```json|```/g, '').trim()
      try {
        const clarify = JSON.parse(raw)
        return NextResponse.json({ gate: 'CLARIFY', questions: clarify.questions ?? [] })
      } catch {
        return NextResponse.json({ gate: 'CLARIFY', questions: [] })
      }
    }

    // GENERATE → streaming 2 appels
    return streamGenerate(text)

  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── STREAMING GENERATE ────────────────────────────────────────────────────────
function streamGenerate(situation: string): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // ── APPEL 1 : Astrolabe (~3-5s) ──────────────────────────────────────
        const msg1 = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: `${ASTROLABE_PROMPT}\n\nSituation:\n${situation}` }],
        })
        const raw1 = msg1.content.filter(b => b.type === 'text').map(b => (b as {type:'text';text:string}).text).join('').replace(/```json|```/g, '').trim()
        const partial = parseJSON(raw1)

        // Envoyer l'astrolabe immédiatement
        send({ type: 'partial', gate: 'GENERATE', partial })

        // ── APPEL 2 : Reste SC (~20-30s) ─────────────────────────────────────
        const msg2 = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 5000,
          messages: [{ role: 'user', content: `${SC_REST_PROMPT}\n\nSituation:\n${situation}\n\nAstrolabe already computed:\nstate_index_final: ${partial.state_index_final}\nstate_label: ${partial.state_label}\nprimary branch: ${(partial.astrolabe_scores as any[])?.find((s: any) => s.is_primary)?.name ?? 'unknown'}` }],
        })
        const raw2 = msg2.content.filter(b => b.type === 'text').map(b => (b as {type:'text';text:string}).text).join('').replace(/```json|```/g, '').trim()
        const rest = parseJSON(raw2)

        // Fusionner les deux JSONs
        const sc = { ...partial, ...rest }
        send({ type: 'complete', gate: 'GENERATE', sc })

      } catch (err) {
        console.error('stream error:', err)
        send({ type: 'error', error: String(err) })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
