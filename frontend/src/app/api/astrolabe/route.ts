import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

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

CONTEXT (silent): detect territory, domain, emotional state, socio-cultural level, temporal context.
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
    { "branch": "I",    "name": "Acteurs",    "name_en": "Actors",      "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "II",   "name": "Intérêts",   "name_en": "Interests",   "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "III",  "name": "Forces",     "name_en": "Forces",      "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "IV",   "name": "Tensions",   "name_en": "Tensions",    "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "V",    "name": "Contraintes","name_en": "Constraints", "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "VI",   "name": "Incertitude","name_en": "Uncertainty", "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "VII",  "name": "Temps",      "name_en": "Time",        "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> },
    { "branch": "VIII", "name": "Espace",     "name_en": "Space",       "display_score": <0-3>, "label": "", "label_en": "", "is_primary": <bool> }
  ]
}`

function parseJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const fixed = clean
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\r?\n/g, ' ')
    return JSON.parse(fixed)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { situation } = await req.json()
    if (!situation?.trim()) {
      return NextResponse.json({ error: 'No situation' }, { status: 400 })
    }

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: `${ASTROLABE_PROMPT}\n\nSituation:\n${situation.trim()}` }],
    })

    const raw = msg.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('').replace(/```json|```/g, '').trim()

    const partial = parseJSON(raw)
    return NextResponse.json({ ok: true, partial })

  } catch (err) {
    console.error('astrolabe error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
