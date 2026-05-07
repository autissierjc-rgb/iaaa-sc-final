import type {
  CalibrationCriterionId,
  CalibrationCriterionResult,
  CalibrationEvidenceContract,
  CalibrationScore,
  HumanValidationCheck,
} from '@/lib/contracts/quality'

export type CalibrationEvidenceInput = {
  insight: string
  main_vulnerability: string
  trajectories: string[]
  key_signal: string
  global_usefulness: string
  concrete_anchor_count: number
  has_diamond_sentence: boolean
  has_observable_signal: boolean
}

const LABELS: Record<CalibrationCriterionId, string> = {
  insight: 'Insight',
  main_vulnerability: 'Main Vulnerability',
  trajectories: 'Trajectories',
  key_signal: 'Key Signal',
  global_usefulness: 'Global Usefulness',
}

function clampScore(value: number): CalibrationScore {
  return Math.max(1, Math.min(5, Math.round(value))) as CalibrationScore
}

function criterion(
  id: CalibrationCriterionId,
  score: number,
  evidence: string,
  improvement?: string,
): CalibrationCriterionResult {
  return {
    id,
    label: LABELS[id],
    score: clampScore(score),
    evidence,
    improvement,
  }
}

function lengthScore(text: string, short: number, solid: number): number {
  const length = text.trim().length
  if (length >= solid) return 4
  if (length >= short) return 3
  return 2
}

export function buildCalibrationEvidence(input: CalibrationEvidenceInput): CalibrationEvidenceContract {
  const criteria: CalibrationCriterionResult[] = [
    criterion(
      'insight',
      lengthScore(input.insight, 90, 180) + (input.concrete_anchor_count >= 2 ? 1 : 0),
      input.concrete_anchor_count > 0
        ? `Insight appuye par ${input.concrete_anchor_count} ancre(s) concrete(s).`
        : 'Insight encore peu ancre dans le theatre reel.',
      input.concrete_anchor_count === 0 ? 'Ajouter acteurs, gestes, dates, lieux ou preuves.' : undefined,
    ),
    criterion(
      'main_vulnerability',
      lengthScore(input.main_vulnerability, 70, 150) + (input.has_diamond_sentence ? 1 : 0),
      input.has_diamond_sentence
        ? 'Vulnerabilite reliee a une phrase diamant.'
        : 'Vulnerabilite presente mais pas encore reliee a une phrase diamant.',
      input.has_diamond_sentence ? undefined : 'Nommer le point fragile en une phrase decisive.',
    ),
    criterion(
      'trajectories',
      input.trajectories.length >= 3 ? 4 : input.trajectories.length >= 2 ? 3 : 2,
      `${input.trajectories.length} trajectoire(s) disponible(s).`,
      input.trajectories.length < 3 ? 'Distinguer stabilisation, escalade et bascule.' : undefined,
    ),
    criterion(
      'key_signal',
      lengthScore(input.key_signal, 50, 120) + (input.has_observable_signal ? 1 : 0),
      input.has_observable_signal
        ? 'Signal cle formule comme element observable.'
        : 'Signal cle encore trop abstrait.',
      input.has_observable_signal ? undefined : 'Preciser ce qui peut etre observe ou verifie.',
    ),
    criterion(
      'global_usefulness',
      lengthScore(input.global_usefulness, 90, 180) + (input.concrete_anchor_count >= 2 ? 1 : 0),
      'Utilite estimee par la clarte de lecture, le point fragile et le signal a suivre.',
    ),
  ]

  const total = criteria.reduce((sum, item) => sum + item.score, 0)
  const average = Number((total / criteria.length).toFixed(2))
  const verdict = average >= 4 ? 'pass' : average >= 3.5 ? 'review' : 'rework'

  const human_checks: HumanValidationCheck[] = [
    {
      id: 'see_system_better',
      label: 'Je vois mieux le systeme.',
      answer: criteria[0].score >= 4 ? 'yes' : criteria[0].score >= 3 ? 'medium' : 'no',
      evidence: criteria[0].evidence,
    },
    {
      id: 'vulnerability_feels_right',
      label: 'La vulnerabilite centrale semble juste.',
      answer: criteria[1].score >= 4 ? 'yes' : criteria[1].score >= 3 ? 'medium' : 'no',
      evidence: criteria[1].evidence,
    },
    {
      id: 'know_what_to_watch',
      label: 'Je sais quoi surveiller.',
      answer: criteria[3].score >= 4 ? 'yes' : criteria[3].score >= 3 ? 'medium' : 'no',
      evidence: criteria[3].evidence,
    },
  ]

  return {
    criteria,
    total,
    average,
    verdict,
    human_checks,
  }
}
