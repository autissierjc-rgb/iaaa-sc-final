import type {
  ArbreACamesAnalysis,
  DetectedPattern,
  PatternContext,
} from '../resources/resourceContract'
import { HUMAN_PATTERNS } from './human'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function scorePattern(text: string, pattern: (typeof HUMAN_PATTERNS)[number]) {
  const haystack = normalize(text)
  const matches = pattern.keywords.filter((keyword) =>
    haystack.includes(normalize(keyword))
  )

  return {
    matches,
    score: matches.length,
  }
}

function isHumanSituation(text: string): boolean {
  return /\b(equipe|équipe|manager|drh|collegue|collègue|associe|associé|relation|couple|famille|enfant|parent|client|sponsor|poste|role|rôle|reconnaissance|conflit|burn|fatigue|honte|loyaute|loyauté|limite|travail|mission|coach|therapeute|thérapeute)\b/i.test(text)
}

export function detectPatterns({
  situation,
  arbre,
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
}): PatternContext {
  const text = [
    situation,
    ...(arbre?.acteurs ?? []),
    ...(arbre?.intentions ?? []),
    ...(arbre?.interets ?? []),
    ...(arbre?.contraintes ?? []),
    ...(arbre?.tensions ?? []),
    ...(arbre?.vulnerabilites ?? []),
  ].join(' ')

  if (!isHumanSituation(text)) {
    return { secondary: [] }
  }

  const scored = HUMAN_PATTERNS
    .map((pattern) => {
      const result = scorePattern(text, pattern)
      return {
        pattern,
        matches: result.matches,
        score: result.score,
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const detected = scored.slice(0, 3).map<DetectedPattern>((item) => ({
    id: item.pattern.id,
    label: item.pattern.label,
    family: 'human',
    confidence: Math.min(0.95, 0.45 + item.score * 0.18),
    rationale: item.pattern.diagnosticBias,
  }))

  return {
    primary: detected[0],
    secondary: detected.slice(1),
  }
}

export function patternGuidance(patternContext?: PatternContext): string[] {
  const patterns = [
    patternContext?.primary,
    ...(patternContext?.secondary ?? []),
  ].filter(Boolean) as DetectedPattern[]

  return patterns
    .map((pattern) => pattern.rationale)
    .filter((item): item is string => Boolean(item))
}
