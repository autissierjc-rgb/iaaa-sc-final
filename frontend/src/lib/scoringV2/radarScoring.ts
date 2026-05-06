import type { RadarAxis, RadarScoreV2 } from '../contracts'

const RADAR_WEIGHTS: Record<RadarAxis, number> = {
  impact: 0.3,
  urgency: 0.25,
  uncertainty: 0.25,
  reversibility: 0.2,
}

function scoreFor(radar: RadarScoreV2[], axis: RadarAxis): number {
  const value = radar.find((item) => item.axis === axis)?.score ?? 0
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function computeRadarPressureV2(radar: RadarScoreV2[]): number {
  const impact = scoreFor(radar, 'impact')
  const urgency = scoreFor(radar, 'urgency')
  const uncertainty = scoreFor(radar, 'uncertainty')
  const reversibility = scoreFor(radar, 'reversibility')

  return (
    impact * RADAR_WEIGHTS.impact +
    urgency * RADAR_WEIGHTS.urgency +
    uncertainty * RADAR_WEIGHTS.uncertainty +
    (100 - reversibility) * RADAR_WEIGHTS.reversibility
  )
}

export function radarScoringWarnings(radar: RadarScoreV2[]): string[] {
  const warnings: string[] = []
  const axes: RadarAxis[] = ['impact', 'urgency', 'uncertainty', 'reversibility']

  for (const axis of axes) {
    if (!radar.some((item) => item.axis === axis)) {
      warnings.push(`Missing radar axis: ${axis}.`)
    }
  }

  for (const item of radar) {
    if (item.score < 0 || item.score > 100) {
      warnings.push(`Radar axis ${item.axis} is outside the 0-100 range.`)
    }
  }

  return warnings
}
