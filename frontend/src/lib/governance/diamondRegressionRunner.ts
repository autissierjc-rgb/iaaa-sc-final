import type { SituationCard } from '../resources/resourceContract'
import type { DiamondRegressionCase } from './diamondRegressionCases'
import { validateDiamondContract, type DiamondValidationIssue } from './diamondValidation'

export type DiamondRegressionCheck = {
  caseId: string
  ok: boolean
  issues: DiamondValidationIssue[]
}

function cardText(sc: SituationCard): string {
  const parts: string[] = []
  for (const value of Object.values(sc)) {
    if (typeof value === 'string') parts.push(value)
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') parts.push(item)
        else if (item && typeof item === 'object') {
          for (const nested of Object.values(item as Record<string, unknown>)) {
            if (typeof nested === 'string') parts.push(nested)
          }
        }
      }
    }
  }
  return parts.join('\n')
}

function includesLoose(haystack: string, needle: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  return normalize(haystack).includes(normalize(needle))
}

function countBranches(sc: SituationCard, score: number): number {
  const list = Array.isArray(sc.astrolabe_scores) ? sc.astrolabe_scores : []
  return list.filter((item) => Number((item as Record<string, unknown>).display_score) === score).length
}

function hasAxisVIVisibleLabel(sc: SituationCard): boolean {
  const list = Array.isArray(sc.astrolabe_scores) ? sc.astrolabe_scores : []
  return list.some((item) => {
    const entry = item as Record<string, unknown>
    return String(entry.branch ?? '') === 'VI' && String(entry.name ?? '') === 'Incertitudes'
  })
}

export function validateRegressionCase(sc: SituationCard, testCase: DiamondRegressionCase): DiamondRegressionCheck {
  const issues = [...validateDiamondContract(sc, testCase.domain).issues]
  const text = cardText(sc)

  for (const term of testCase.expectations.forbiddenTerms) {
    if (includesLoose(text, term)) {
      issues.push({
        level: 'warning',
        code: 'forbidden_term_present',
        message: `Forbidden term for regression case "${testCase.id}" detected: ${term}`,
      })
    }
  }

  for (const term of testCase.expectations.requiredTerms) {
    if (!includesLoose(text, term)) {
      issues.push({
        level: 'warning',
        code: 'required_term_missing',
        message: `Required term for regression case "${testCase.id}" missing: ${term}`,
      })
    }
  }

  const dominant = countBranches(sc, 3)
  const moderate = countBranches(sc, 2)
  const { maxDominantBranches, minDominantBranches, maxModerateBranches } = testCase.expectations

  if (typeof maxDominantBranches === 'number' && dominant > maxDominantBranches) {
    issues.push({
      level: 'warning',
      code: 'regression_too_many_dominants',
      message: `Dominant branches: ${dominant}; expected max ${maxDominantBranches}.`,
      field: 'astrolabe_scores',
    })
  }

  if (typeof minDominantBranches === 'number' && dominant < minDominantBranches) {
    issues.push({
      level: 'warning',
      code: 'regression_missing_dominant',
      message: `Dominant branches: ${dominant}; expected at least ${minDominantBranches}.`,
      field: 'astrolabe_scores',
    })
  }

  if (typeof maxModerateBranches === 'number' && moderate > maxModerateBranches) {
    issues.push({
      level: 'warning',
      code: 'regression_too_many_moderates',
      message: `Moderate branches: ${moderate}; expected max ${maxModerateBranches}.`,
      field: 'astrolabe_scores',
    })
  }

  if (!hasAxisVIVisibleLabel(sc)) {
    issues.push({
      level: 'warning',
      code: 'axis_vi_label_regression',
      message: 'Axis VI visible label should be Incertitudes.',
      field: 'astrolabe_scores',
    })
  }

  return {
    caseId: testCase.id,
    ok: !issues.some((issue) => issue.level === 'error'),
    issues,
  }
}

export function validateRegressionSuite(
  cardsByCaseId: Record<string, SituationCard>,
  cases: DiamondRegressionCase[]
): DiamondRegressionCheck[] {
  return cases.map((testCase) => {
    const sc = cardsByCaseId[testCase.id]
    if (!sc) {
      return {
        caseId: testCase.id,
        ok: false,
        issues: [{
          level: 'error',
          code: 'missing_regression_card',
          message: `No Situation Card provided for regression case "${testCase.id}".`,
        }],
      }
    }
    return validateRegressionCase(sc, testCase)
  })
}

