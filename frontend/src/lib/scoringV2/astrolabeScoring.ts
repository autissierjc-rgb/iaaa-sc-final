import type { AstrolabeBranchV2 } from '../contracts'

export function computeAstrolabeBaseV2(branches: AstrolabeBranchV2[]): number {
  if (branches.length === 0) return 0

  const primary = branches.find((branch) => branch.is_primary)

  if (!primary) {
    const max = branches.length * 3
    const sum = branches.reduce((total, branch) => total + branch.score, 0)
    return max > 0 ? (sum / max) * 100 : 0
  }

  const others = branches.filter((branch) => !branch.is_primary)
  const averageOthers = others.length > 0
    ? others.reduce((total, branch) => total + branch.score, 0) / others.length
    : 0

  const weighted = primary.score * 0.35 + averageOthers * 0.65
  return Math.round((weighted / 3) * 1000) / 10
}

export function astrolabeScoringWarnings(branches: AstrolabeBranchV2[]): string[] {
  const warnings: string[] = []
  const primaryCount = branches.filter((branch) => branch.is_primary).length
  const dominantCount = branches.filter((branch) => branch.score === 3).length
  const moderateCount = branches.filter((branch) => branch.score === 2).length

  if (branches.length !== 8) {
    warnings.push('Astrolabe V2 expects the 8 public branches.')
  }

  if (primaryCount === 0) {
    warnings.push('No primary Astrolabe branch selected.')
  }

  if (primaryCount > 1) {
    warnings.push('More than one primary Astrolabe branch selected.')
  }

  if (dominantCount > 3) {
    warnings.push('More than 3 dominant branches: verify whether scoring is inflated.')
  }

  if (moderateCount > 3) {
    warnings.push('More than 3 moderate branches: verify whether scoring is too flat.')
  }

  return warnings
}
