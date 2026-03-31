/**
 * IAAA · Bloc 2 · API generate client
 *
 * Calls POST /api/generate — FastAPI placeholder endpoint.
 * Returns GenerationResult matching the frozen contract.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT: always use /api/generate (relative URL).
 * Never use http://localhost:8000/api/generate.
 * Nginx proxies /api/* → backend in all environments.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Bloc 3 contract:
 *   This file stays. Only the backend handler changes.
 *   The response shape (reframe + card + generated_at) must not change.
 *
 * Loading phases are simulated on the frontend during the real fetch
 * to give perceived progress. In Bloc 3, these can be replaced with
 * real SSE progress events from the backend if desired.
 */

import type { GenerationResult, LoadingPhase } from '@/types/generate'
import type { GenerateApiResponse } from '@/types/index'

export const LOADING_PHASES: { phase: LoadingPhase; label: string; duration: number }[] = [
  { phase: 'searching',      label: 'Searching for context…',           duration: 700  },
  { phase: 'reading',        label: 'Reading sources…',                  duration: 600  },
  { phase: 'contextualizing',label: 'Building situation context…',       duration: 600  },
  { phase: 'structuring',    label: 'Identifying structure…',            duration: 500  },
  { phase: 'analyzing',      label: 'Analyzing forces and tensions…',    duration: 600  },
  { phase: 'composing',      label: 'Composing Situation Card…',         duration: 500  },
]

export async function generateSituationCard(
  situation: string,
  onPhaseChange: (phase: LoadingPhase, label: string) => void
): Promise<GenerationResult> {
  // Start phase animation concurrently with the API call
  const phaseAnimation = runPhaseAnimation(onPhaseChange)

  const [result] = await Promise.all([
    callGenerateAPI(situation),
    phaseAnimation,
  ])

  return result
}

async function callGenerateAPI(situation: string): Promise<GenerationResult> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ situation }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unknown error')
    throw new Error(`Generation failed (${res.status}): ${detail}`)
  }

  const data: GenerateApiResponse = await res.json()

  // Validate against frozen contract — full Pydantic validation in Bloc 3
  if (!data.card || !data.reframe) {
    throw new Error('Invalid response shape from /api/generate')
  }

  return {
    card:                  data.card,
    reframe:               data.reframe,
    vulnerability_index:   data.vulnerability_index  ?? 0,
    vulnerability_status:  data.vulnerability_status ?? 'Tension',
    vulnerability_for:     data.vulnerability_for    ?? '',
    decision_type:         data.decision_type        ?? 'structural',
    decision_dimensions:   data.decision_dimensions  ?? {
      reversibility: 'medium', systemic_impact: 'medium',
      urgency: 'medium', uncertainty: 'medium',
    },
    investigation_mode:      data.investigation_mode      ?? false,
    causal_scenarios:        data.causal_scenarios        ?? null,
    verification_matrix:     data.verification_matrix     ?? null,
    context_sources:         data.context_sources         ?? null,
    contextualization_level: data.contextualization_level ?? null,
    lecture:                 data.lecture                 ?? null,
    generated_at: data.generated_at ?? new Date().toISOString(),
  }
}

async function runPhaseAnimation(
  onPhaseChange: (phase: LoadingPhase, label: string) => void
): Promise<void> {
  for (const { phase, label, duration } of LOADING_PHASES) {
    onPhaseChange(phase, label)
    await sleep(duration)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
