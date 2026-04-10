/**
 * IAAA · Scoring Engine
 * Formules validées — ne pas modifier sans validation JCA
 *
 * state = astrolabe_base × 0.65 + radar_pressure × 0.35
 * astrolabe_base = pondéré (primaire × 0.35 + moy_autres × 0.65) / 3 × 100
 * radar_pressure = impact×0.30 + urgency×0.25 + uncertainty×0.25 + (100-reversibility)×0.20
 */

export interface AstrolabeBranch {
  b: string
  s: number   // 0–3
  p: boolean  // primary
}

export interface RadarScores {
  impact:       number  // 0–100
  urgency:      number  // 0–100
  uncertainty:  number  // 0–100
  reversibility: number // 0–100 (high = more reversible = less pressure)
}

/**
 * Astrolabe base — version pondérée
 * Branche primaire pèse 35%, moyenne des autres pèse 65%
 * Fallback: sum/24×100 si pas de primaire
 */
export function computeAstrolabeBase(branches: AstrolabeBranch[]): number {
  const primary = branches.find(b => b.p)
  if (!primary) {
    const sum = branches.reduce((a, b) => a + b.s, 0)
    return (sum / 24) * 100
  }
  const others = branches.filter(b => !b.p)
  const avgOthers = others.length > 0
    ? others.reduce((a, b) => a + b.s, 0) / others.length
    : 0
  const weighted = primary.s * 0.35 + avgOthers * 0.65
  return Math.round((weighted / 3) * 100 * 10) / 10
}

/**
 * Radar pressure — réversibilité inversée
 * Une faible réversibilité = plus de pression
 */
export function computeRadarPressure(radar: RadarScores): number {
  return (
    radar.impact       * 0.30 +
    radar.urgency      * 0.25 +
    radar.uncertainty  * 0.25 +
    (100 - radar.reversibility) * 0.20
  )
}

/**
 * State final
 * Garde-fous : cohérence structure/radar
 */
export function computeState(
  branches: AstrolabeBranch[],
  radar: RadarScores
): number {
  const astrolabeBase = computeAstrolabeBase(branches)
  const radarPressure = computeRadarPressure(radar)
  let state = astrolabeBase * 0.65 + radarPressure * 0.35

  // Garde-fou A : incertitude très haute + faible réversibilité → state ≥ 70
  if (radar.uncertainty > 80 && radar.reversibility < 30) {
    state = Math.max(state, 70)
  }

  // Garde-fou B : state > 70 → au moins une branche doit être à 3
  if (state > 70) {
    const hasDominant = branches.some(b => b.s === 3)
    if (!hasDominant) {
      state = Math.min(state, 70)
    }
  }

  return Math.max(0, Math.min(100, Math.round(state)))
}

/**
 * State label — côté client uniquement, jamais dans le JSON LLM
 */
export function getStateLabel(state: number, lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    if (state < 40) return 'Clear'
    if (state < 55) return 'Navigable'
    if (state < 70) return 'Watch'
    if (state < 90) return 'Critical'
    return 'Loss of Control'
  }
  if (state < 40) return 'Stable'
  if (state < 55) return 'Contrôlable'
  if (state < 70) return 'Vigilance'
  if (state < 90) return 'Critique'
  return 'Hors contrôle'
}

/**
 * Trajectory colors — côté client uniquement, jamais dans le JSON LLM
 */
export const TRAJECTORY_COLORS: Record<string, string> = {
  stabilization: '#1D9E75',
  escalation:    '#E06B4A',
  regime_shift:  '#378ADD',
}
