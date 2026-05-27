import type { AssertionStatus } from '../contracts'

export const FORBIDDEN_PUBLIC_PHRASES = [
  'objet visible',
  'mecanisme concret',
  'canal concret',
  'la situation est complexe',
  'le manque de communication',
  'l incertitude complique la decision',
  "l'incertitude complique la decision",
  'il faut surveiller l evolution',
  "il faut surveiller l'evolution",
  'doit etre lu par son theatre reel',
  'doit être lu par son théâtre réel',
  'le fond de la carte',
  'preuves attendues',
  'passive deterministic writing scaffold',
  'general_analysis',
  'understand_situation',
]

export const ASSERTION_LABELS_FR: Record<AssertionStatus, string> = {
  established: 'Etabli',
  probable: 'Probable',
  plausible: 'Plausible',
  hypothesis: 'Hypothese a tester',
  unknown: 'Inconnu',
}

export function containsForbiddenPublicPhrase(text: string): string[] {
  const lower = text.toLowerCase()
  return FORBIDDEN_PUBLIC_PHRASES.filter((phrase) => lower.includes(phrase.toLowerCase()))
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function compactSentence(text: string, maxLength = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean
  const clipped = clean.slice(0, maxLength - 1).trim()
  const sentenceBoundary = Math.max(
    clipped.lastIndexOf('. '),
    clipped.lastIndexOf('; '),
    clipped.lastIndexOf(': '),
  )
  if (sentenceBoundary >= Math.floor(maxLength * 0.55)) {
    return clipped.slice(0, sentenceBoundary + 1).trim()
  }

  const wordBoundary = clipped.lastIndexOf(' ')
  const safe = wordBoundary >= Math.floor(maxLength * 0.55)
    ? clipped.slice(0, wordBoundary).trim()
    : clipped
  const cleanEnd = safe.replace(/[,:;–—-]+$/g, '').trim()
  return cleanEnd.endsWith('.') ? cleanEnd : `${cleanEnd}.`
}
