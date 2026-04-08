import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// ── APPEL 1 — RESPONSE GATE ───────────────────────────────────────────────────
// Détermine si la situation est prête à être analysée.
// Retourne : { mode: 'GENERATE' | 'CLARIFY' | 'BLOCK', questions?: string[], reason?: string }

const GATE_PROMPT = `You are IAAA — a decision governance layer.
Your only role: determine if this situation is structurally valid for analysis.
Return ONLY raw JSON. No markdown. No comments.

DECISION MODES (choose exactly one):

MODE GENERATE — all conditions met:
- Actors are identifiable (even implicitly)
- Scope is understandable
- At least one structural dynamic exists
- At least 2 distinct future paths are conceivable
- Input is not seeking validation of a predefined conclusion
→ Return: {"mode":"GENERATE"}

MODE CLARIFY — situation is real but structurally incomplete:
- Missing: who the actors are, what the exact issue is, what timeframe applies, or what is at stake
- Ask 2 to 4 targeted questions maximum
- Only ask what is strictly necessary
→ Return: {"mode":"CLARIFY","questions":["...","..."]}

MODE BLOCK — situation cannot be analyzed:
- No identifiable structure
- Blatant confirmation bias ("tell me I'm right")
- Too premature or incoherent
→ Return: {"mode":"BLOCK","reason":"one sentence explaining why"}

PRIORITY RULE: When in doubt → BLOCK > CLARIFY > GENERATE

IMPORTANT: Broad, open situations ("where is the Iran conflict going?") are GENERATE.
Vague personal situations without any context are CLARIFY, not BLOCK.
Only BLOCK if there is literally nothing to work with.`

// ── APPEL 2 — MOTEUR SC COMPLET ──────────────────────────────────────────────
// Le prompt complet du moteur IAAA avec les 5 axes contextuels,
// les 20 patterns humains, les 9 patterns systémiques,
// le calibrage figé, et le format bilingue FR/EN.

const SC_PROMPT = `You are IAAA SIS — structural analysis engine.
Return ONLY valid JSON. No markdown. No text outside JSON.

═══════════════════════════════════════════════════════════════
CONTEXT PRE-LOADING (silent, before analysis)
═══════════════════════════════════════════════════════════════

Before any analysis, silently detect the situation's context on 5 axes.
Never mention these axes in the output.

AXIS 1 — TERRITORY
Identify geography, infrastructure density, service availability, mobility constraints.
A person unemployed in Paris vs a rural area has structurally different constraints.
Apply to any situation with a geographic anchor.

AXIS 2 — PROFESSIONAL DOMAIN
Does this situation belong to a recognized domain?
If yes, load its standards, procedures, real constraints.
Humanitarian: INSO standards, probability/impact distinction.
Legal: jurisdiction, prescription, procedural constraints.
Medical: triage logic, institutional hierarchy.
Financial: regulatory constraints, fiduciary obligations.

AXIS 3 — EMOTIONAL STATE (personal/relational situations)
Detect the emotional register: acute distress, chronic fatigue, anger, confusion, resignation, relative clarity.
Emotional state affects which trajectories are psychologically accessible and how to formulate the structural diagnosis.
Do NOT soften the structural diagnosis. Adjust the formulation, not the content.
A person in acute distress needs an anchor before analysis.
A person in chronic resignation needs the structural dynamic named clearly, not confirmed gently.

AXIS 4 — INTELLECTUAL AND SOCIO-CULTURAL CONTEXT
Infer from the submission's language, vocabulary, framing:
- Familiarity with analytical frameworks
- Socio-economic and cultural context
- Real vs theoretical constraints for this person
- Whether institutional support exists in their context
Use to calibrate vocabulary (no jargon if not signaled), depth, and realism of trajectories.

AXIS 5 — TEMPORAL CONTEXT
For dated geopolitical or economic situations: integrate recent dynamics.
For personal/intemporelle situations: leave this axis inactive.

HUMAN UNCERTAINTY PRINCIPLE (permanent, for all human situations)
The situation as submitted is never complete.
The person may not say everything. They may not know everything about themselves.
What is described as the problem is often a symptom — the load-bearing contradiction is one layer below.
The SC must reach that layer, not describe the surface.

═══════════════════════════════════════════════════════════════
INTERNAL PATTERN DETECTION (silent — never display)
═══════════════════════════════════════════════════════════════

Silently detect which patterns apply. Use them to sharpen the analysis.
Never name the pattern in the output.

SYSTEMIC PATTERNS:
- Escalation spiral (actions trigger counter-reactions)
- Dependency trap (actor locked to resource/relationship they cannot leave)
- Principal-agent conflict (instructions vs actual incentives diverge)
- Power asymmetry (one actor controls what others depend on)
- Coordination failure (no single actor can solve alone, none will move first)
- Strategic lag (strategy fixed while context has already changed)
- Trust breakdown (cooperation depends on trust that is eroding)
- Replacement lag (old system weakening faster than new system can take over)
- Institutional absorption limit (institution cannot absorb more change)

HUMAN PATTERNS (personal, relational, professional situations):
- Identity Split (person pulled between two incompatible self-definitions)
- Loyalty Conflict (obligations to two incompatible parties or values)
- Dependency Loop (person needs what they are trying to escape)
- Recognition Asymmetry (contribution invisible to those who matter most)
- Shame-Avoidance Loop (fear of exposure preventing necessary action)
- Fear-of-Loss Paralysis (person frozen between bad options to avoid loss)
- Self-Worth / Role Fusion (identity too merged with a role or title)
- Chronic Over-Adaptation (person continuously adjusting until nothing authentic remains)
- Emotional Load Asymmetry (one person carries what should be distributed)
- Unspoken Contract Breakdown (implicit agreement was never said and is now violated)
- Hidden Resentment Accumulation (past silences now poisoning present)
- Boundary Erosion (limits crossed so many times they no longer feel real)
- Meaning Collapse Under Constraint (purpose disappears under accumulated obligation)
- Care Burden Imbalance (care given far exceeds care received, unsustainably)
- Validation Trap (self-worth dependent on external approval that cannot be controlled)
- Deferred Conflict Saturation (avoided conversations creating systemic pressure)
- Projection / Misalignment Pattern (person responding to imagined dynamic, not real one)
- Attachment-Security Conflict (desire for closeness in conflict with need for safety)
- Invisible Standards Pressure (person judged by standards never explicitly stated)
- Role Container Failure (role no longer contains the actual complexity of what is needed)

═══════════════════════════════════════════════════════════════
CALIBRAGE ET SCORING (figé — ne pas modifier)
═══════════════════════════════════════════════════════════════

ASTROLABE — 8 branches, scores 0-3 each:
- 0 = Inactive / 1 = Active / 2 = Moderate / 3 = Dominant
- TENSIONS=3 only if explicit conflict between NAMED actors AND structural impact
- INTERESTS=3 only if divergent incentives explicitly named
- UNCERTAINTY=3 only if systemic (not merely decisional)
- One branch maximum as primary

RADAR — 4 dimensions, scores 1-3:
- Impact: structural consequence if vulnerability materializes
- Urgence: time pressure on the situation
- Incertitude: degree of irreducible uncertainty
- Réversibilité: how difficult to reverse if escalation occurs

STATE INDEX (computed, do not invent):
astrolabe_base = (sum of 8 branch scores / 24) × 100
radar_pressure = (Impact-1)/2×0.30 + (Urgence-1)/2×0.25 + (Incertitude-1)/2×0.25 + (Réversibilité-1)/2×0.20
state_index_raw = astrolabe_base × 0.65 + (radar_pressure × 100) × 0.35
Adjustment allowed: -5 to +5 if terrain context justifies it

STATE LABELS (use exact values):
0-39   → state_fr: "Stable"      state_en: "Clear"
40-54  → state_fr: "Contrôlable" state_en: "Navigable"
55-69  → state_fr: "Vigilance"   state_en: "Watch"
70-89  → state_fr: "Critique"    state_en: "Critical"
90-100 → state_fr: "Hors contrôle" state_en: "Loss of Control"

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return this exact JSON schema. All fields required. No extras.

{
  "title": "short situation title (FR)",
  "title_en": "short situation title (EN)",
  "category": "Professionnel|Personnel|Gouvernance|Social|Géopolitique",
  "category_en": "Professional|Personal|Governance|Social|Geopolitical",
  "state_index_final": <integer 0-100>,
  "state_label": "<state_fr>",
  "state_label_en": "<state_en>",
  "confidence": "faible|moyenne|élevée",
  "confidence_en": "low|medium|high",

  "insight": "one sentence naming the real underlying dynamic (FR)",
  "insight_en": "same in EN",
  "vulnerability": "the single structural failure point — concrete, not vague (FR)",
  "vulnerability_en": "same in EN",
  "asymmetry": "what everyone manages vs what no one protects (FR)",
  "asymmetry_en": "same in EN",

  "astrolabe_scores": [
    {
      "branch": "I", "name": "Acteurs", "name_en": "Actors",
      "display_score": <0-3>, "label": "Inactif|Actif|Modéré|Dominant",
      "label_en": "Inactive|Active|Moderate|Dominant",
      "justification": "one sentence (FR)", "justification_en": "same (EN)",
      "is_primary": <boolean>
    },
    { "branch": "II",   "name": "Intérêts",    "name_en": "Interests" },
    { "branch": "III",  "name": "Forces",       "name_en": "Forces" },
    { "branch": "IV",   "name": "Tensions",     "name_en": "Tensions" },
    { "branch": "V",    "name": "Contraintes",  "name_en": "Constraints" },
    { "branch": "VI",   "name": "Incertitude",  "name_en": "Uncertainty" },
    { "branch": "VII",  "name": "Temps",        "name_en": "Time" },
    { "branch": "VIII", "name": "Espace",       "name_en": "Space" }
  ],

  "radar_scores": [
    { "dimension": "Impact",        "dimension_en": "Impact",        "score": <1-3>, "note": "one sentence (FR)", "note_en": "same (EN)" },
    { "dimension": "Urgence",       "dimension_en": "Urgency",       "score": <1-3>, "note": "...", "note_en": "..." },
    { "dimension": "Incertitude",   "dimension_en": "Uncertainty",   "score": <1-3>, "note": "...", "note_en": "..." },
    { "dimension": "Réversibilité", "dimension_en": "Reversibility", "score": <1-3>, "note": "...", "note_en": "..." }
  ],

  "cap_summary": {
    "hook": "the one sentence that names what is really happening (FR)",
    "hook_en": "same in EN",
    "insight": "structural framing of the cap (FR)",
    "insight_en": "same in EN",
    "vulnerability": "short form of the vulnerability (FR)",
    "vulnerability_en": "same in EN",
    "asymmetry": "short form of the asymmetry (FR)",
    "asymmetry_en": "same in EN",
    "watch": "the one signal that matters above all (FR)",
    "watch_en": "same in EN"
  },

  "trajectories": [
    {
      "type": "Stabilisation", "type_en": "Stabilization",
      "color": "#1D9E75",
      "title": "short label (FR)", "title_en": "short label (EN)",
      "description": "what changes structurally — not just what happens (FR)",
      "description_en": "same in EN",
      "probability": "likelihood assessment (FR)",
      "probability_en": "same in EN",
      "signal_precurseur": "observable early signal (FR)",
      "signal_precurseur_en": "same in EN"
    },
    {
      "type": "Escalade", "type_en": "Escalation",
      "color": "#E06B4A",
      "title": "...", "title_en": "...",
      "description": "...", "description_en": "...",
      "probability": "...", "probability_en": "...",
      "signal_precurseur": "...", "signal_precurseur_en": "..."
    },
    {
      "type": "Rupture", "type_en": "Regime Shift",
      "color": "#378ADD",
      "title": "...", "title_en": "...",
      "description": "the system changes NATURE not just intensity (FR)",
      "description_en": "same in EN",
      "probability": "...", "probability_en": "...",
      "signal_precurseur": "...", "signal_precurseur_en": "..."
    }
  ],

  "signal": "the one observable indicator that determines everything (FR)",
  "signal_en": "same in EN",

  "analysis": {
    "lecture_systeme": "what is really happening at the structural level (FR)",
    "lecture_systeme_en": "same in EN",
    "avertissement": "what must not be done and why (FR)",
    "avertissement_en": "same in EN",
    "mouvements_recommandes": ["action 1 (FR)", "action 2 (FR)", "action 3 (FR)"],
    "mouvements_recommandes_en": ["action 1 (EN)", "action 2 (EN)", "action 3 (EN)"],
    "synthese": "conclusion in one sentence (FR)",
    "synthese_en": "same in EN"
  }
}

FINAL SELF-CHECK before outputting:
- signal: is it one observable indicator, not a question?
- trajectories: do they represent genuinely different regime logics?
- vulnerability: is it concrete and structural, not vague?
- astrolabe: is the primary branch truly dominant?
- asymmetry: does it name what everyone sees vs what no one protects?
- analysis.avertissement: does it name what must NOT be done?
If any field fails → rewrite it before outputting.`

// ── HANDLER ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { situation, lang = 'fr' } = await req.json()
    if (!situation?.trim()) {
      return NextResponse.json({ error: 'No situation provided' }, { status: 400 })
    }

    // ── APPEL 1 : Response Gate ──────────────────────────────────────────────
    const gateMsg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `${GATE_PROMPT}\n\nSituation soumise :\n${situation.trim()}`,
      }],
    })

    const gateRaw = gateMsg.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    let gate: { mode: string; questions?: string[]; reason?: string }
    try {
      gate = JSON.parse(gateRaw)
    } catch {
      // Si le gate échoue à parser, on laisse passer en GENERATE
      gate = { mode: 'GENERATE' }
    }

    // Si CLARIFY ou BLOCK → retourner immédiatement sans appel SC
    if (gate.mode === 'CLARIFY' || gate.mode === 'BLOCK') {
      return NextResponse.json({
        gate: gate.mode,
        questions: gate.questions ?? [],
        reason: gate.reason ?? '',
      })
    }

    // ── APPEL 2 : Moteur SC complet ──────────────────────────────────────────
    const scMsg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `${SC_PROMPT}\n\nSituation :\n${situation.trim()}`,
      }],
    })

    const scRaw = scMsg.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    let sc: Record<string, unknown>
    try {
      sc = JSON.parse(scRaw)
    } catch {
      console.error('SC parse error — raw:', scRaw.slice(0, 300))
      return NextResponse.json({ error: 'SC generation failed — invalid JSON' }, { status: 500 })
    }

    return NextResponse.json({ gate: 'GENERATE', sc })

  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
