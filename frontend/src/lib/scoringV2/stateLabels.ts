import type { StateLabelV2 } from '../contracts'

export function getStateLabelV2(stateIndex: number): StateLabelV2 {
  if (stateIndex <= 44) return 'routine_stable'
  if (stateIndex <= 59) return 'tension'
  if (stateIndex <= 74) return 'instability'
  return 'regime_shift'
}

export function clampStateIndex(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}
