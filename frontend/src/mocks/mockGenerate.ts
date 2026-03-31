/**
 * ⚠️  DEPRECATED — Bloc 2 correction
 *
 * This mock is no longer used.
 * The frontend now calls POST /api/generate via lib/generateApi.ts.
 *
 * Kept for reference. Safe to delete.
 */

/**
 * IAAA · Bloc 2 · Mock generation
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS A MOCK. It returns static data after a simulated delay.
 * It will be replaced in Bloc 3 by a real call to POST /api/generate.
 *
 * Contract: the mock output must match the frozen SituationCard JSON contract
 * exactly — so that swapping it for the real backend in Bloc 3 requires
 * zero changes to the result rendering layer.
 *
 * The reframe field is a UI-layer field, returned alongside the card
 * but NOT part of the SituationCard contract.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { GenerationResult, LoadingPhase } from '@/types/generate'

// ── Phase sequence timing ─────────────────────────────────────────────────────
// Total simulated duration: ~2.5s
export const LOADING_PHASES: { phase: LoadingPhase; label: string; duration: number }[] = [
  { phase: 'reading',      label: 'Reading your situation…',         duration: 600 },
  { phase: 'structuring',  label: 'Identifying structure…',          duration: 600 },
  { phase: 'analyzing',    label: 'Analyzing forces and tensions…',   duration: 700 },
  { phase: 'composing',    label: 'Composing Situation Card…',        duration: 700 },
]

// ── Static mock payload ───────────────────────────────────────────────────────
// Frozen to match SituationCard contract exactly.
// The reframe is separate.
const MOCK_RESULT = {
  reframe:
    'The surface question is about a job. The real question is about identity — whether what you have built professionally still reflects who you are becoming.',

  card: {
    title: 'Career Crossroads: Security vs. Alignment',
    objective:
      'Decide whether to leave a stable, well-paying role for a direction that feels more meaningful but carries significant risk.',
    overview:
      'A professional with strong credentials and financial stability faces growing misalignment between their daily work and their deeper sense of purpose. External pressure to stay is high; internal pressure to leave is growing.',
    forces: [
      'Financial stability and known compensation',
      'Established reputation and seniority in current role',
      'Clear demand and growth path if staying',
      'Genuine interest and early traction in the new direction',
    ],
    tensions: [
      'Security vs. meaning — two legitimate but competing needs',
      'Market perception of a "lateral" or risky move',
      'Family or dependant financial obligations',
      'Fear of regret from leaving vs. fear of regret from staying',
    ],
    vulnerabilities: [
      'No clear financial runway if the new path takes longer than expected',
      'Identity too anchored in current title — removal triggers disorientation',
      'Decision being made under emotional fatigue, not clarity',
    ],
    main_vulnerability:
      'Decision being made under emotional fatigue, not clarity — the real risk is choosing too fast or too late.',
    trajectories: [
      'Stay and invest 12 months building the new direction in parallel, with a hard exit date',
      'Negotiate a phased reduction in current role while transitioning',
      'Leave fully and give the new direction 18 months with a defined evaluation point',
    ],
    constraints: [
      'Financial obligations set a minimum monthly threshold',
      'Professional reputation limits how the exit is framed publicly',
      'Time is not neutral — indecision has its own cost',
    ],
    uncertainty: [
      'Whether the new direction has real market demand at the level needed',
      'How long the transition would realistically take',
      'Whether the current role can be returned to if needed',
    ],
    reflection:
      'The real question is not whether to leave. It is whether you have built enough clarity — about what you are moving toward — to make the departure meaningful rather than reactive.',
  },

  lecture: `Logique centrale — La séquestration instrumentalise la pression humanitaire pour court-circuiter le contrôle financier.

Séquence fondatrice — (1) L'employé inscrit 5 journaliers fictifs. (2) Il crée une pression collective pour forcer le paiement avant audit. (3) Les autorités locales rassurent l'ONG — ce qui peut refléter leur neutralité ou leur complicité. (4) Le système pousse l'ONG vers un précédent : payer sans vérifier.

Boucle de renforcement — Plus l'ONG cède rapidement, plus le schéma se reproduit. Chaque paiement sans audit valide le mécanisme et encourage sa répétition sur d'autres sites.

Tension structurelle — La sécurité de l'employé est réelle ou fabriquée, mais dans les deux cas elle court-circuite l'audit. L'ONG ne peut pas distinguer urgence légitime et urgence construite sans source indépendante.

Formule de synthèse — Urgence fabriquée + autorités ambiguës = contrôle impossible. La séquestration n'est pas le problème central — c'est le levier.`,
  investigation_mode:      false,
  causal_scenarios:        null,
  verification_matrix:     null,
  context_sources:         null,
  contextualization_level: null,
  generated_at: new Date().toISOString(),
}

// ── Mock generate function ────────────────────────────────────────────────────
// Accepts a situation string, ignores it (mock), returns static payload.
// In Bloc 3: replace this with fetch('/api/generate', { method: 'POST', body: ... })

export async function mockGenerate(
  _situation: string,
  onPhaseChange: (phase: LoadingPhase, label: string) => void
): Promise<any> {
  for (const { phase, label, duration } of LOADING_PHASES) {
    onPhaseChange(phase, label)
    await sleep(duration)
  }

  // Refresh the timestamp so it looks real
  return {
    ...MOCK_RESULT,
    generated_at: new Date().toISOString(),
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
