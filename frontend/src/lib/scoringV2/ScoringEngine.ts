import type { ScoringContract } from '../contracts'
import { computeAstrolabeBaseV2, astrolabeScoringWarnings } from './astrolabeScoring'
import { computeRadarPressureV2, radarScoringWarnings } from './radarScoring'
import { clampStateIndex, getStateLabelV2 } from './stateLabels'

export type ScoringEngineInput = Pick<ScoringContract, 'astrolabe' | 'radar'> & {
  trace_notes?: string[]
}

export function computeStateV2(input: ScoringEngineInput): ScoringContract {
  const started = Date.now()
  const astrolabeBase = computeAstrolabeBaseV2(input.astrolabe)
  const radarPressure = computeRadarPressureV2(input.radar)
  let state = astrolabeBase * 0.65 + radarPressure * 0.35
  const warnings = [
    ...astrolabeScoringWarnings(input.astrolabe),
    ...radarScoringWarnings(input.radar),
  ]

  const uncertainty = input.radar.find((axis) => axis.axis === 'uncertainty')?.score ?? 0
  const reversibility = input.radar.find((axis) => axis.axis === 'reversibility')?.score ?? 100

  if (uncertainty > 80 && reversibility < 30) {
    state = Math.max(state, 70)
    warnings.push('Guardrail applied: high uncertainty and low reversibility imply state >= 70.')
  }

  if (state > 70 && !input.astrolabe.some((branch) => branch.score === 3)) {
    state = Math.min(state, 70)
    warnings.push('Guardrail applied: state > 70 requires at least one dominant Astrolabe branch.')
  }

  const stateIndex = clampStateIndex(state)

  return {
    astrolabe: input.astrolabe,
    radar: input.radar,
    state_index_final: stateIndex,
    state_label: getStateLabelV2(stateIndex),
    scoring_warnings: warnings,
    trace: {
      service: 'ScoringEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: warnings.length > 0 ? 'partial' : 'ok',
      notes: [
        `astrolabe_base=${Math.round(astrolabeBase * 10) / 10}`,
        `radar_pressure=${Math.round(radarPressure * 10) / 10}`,
        ...(input.trace_notes ?? []),
      ],
    },
  }
}
