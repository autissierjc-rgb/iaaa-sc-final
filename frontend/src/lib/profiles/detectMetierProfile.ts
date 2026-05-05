import type { MetierProfileContext } from '../resources/resourceContract'
import { METIER_PROFILES } from './metierProfiles'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function keywordMatches(text: string, keyword: string): boolean {
  const normalizedKeyword = normalize(keyword).trim()
  if (!normalizedKeyword) return false
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}([^a-z0-9]|$)`, 'i')
  return pattern.test(text)
}

export function detectMetierProfile(situation: string): MetierProfileContext | undefined {
  const text = normalize(situation)
  const scored = METIER_PROFILES
    .map((profile) => {
      const matches = profile.keywords.filter((keyword) =>
        keywordMatches(text, keyword)
      )
      return {
        profile,
        matches,
        score: matches.length,
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best) return undefined

  return {
    id: best.profile.id,
    label: best.profile.label,
    signal: best.profile.signal,
    patterns: best.profile.patterns,
    confidence: Math.min(0.95, 0.45 + best.score * 0.18),
  }
}
