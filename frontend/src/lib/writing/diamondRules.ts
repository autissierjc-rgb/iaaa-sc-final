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
  'la situation ne se réduit pas à l’événement visible',
  'la situation ne se reduit pas a l evenement visible',
  'distribution de leviers',
  'ce qui garde encore la face',
  'un acteur qui change de rythme',
  'qui peut agir, bloquer, légitimer',
  'qui peut agir, bloquer, legitimer',
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
  if (sentenceBoundary >= Math.floor(maxLength * 0.35)) {
    const bounded = clipped.slice(0, sentenceBoundary + 1).trim()
    return /[:;]$/.test(bounded) ? `${bounded.replace(/[:;]+$/g, '').trim()}.` : bounded
  }

  const commaBoundary = clipped.lastIndexOf(', ')
  const wordBoundary = clipped.lastIndexOf(' ')
  const safe = commaBoundary >= Math.floor(maxLength * 0.55)
    ? clipped.slice(0, commaBoundary).trim()
    : wordBoundary >= Math.floor(maxLength * 0.55)
      ? clipped.slice(0, wordBoundary).trim()
      : clipped
  const cleanEnd = safe
    .replace(/[,:;–—-]+$/g, '')
    .replace(/(?:\s+(?:et|ou|un|une|le|la|les|de|des|du|au|aux|à|que|qui|dans|sur|par|pour|en|d|l|qu))+$/i, '')
    .replace(/[,:;–—-]+$/g, '')
    .trim()
  return cleanEnd.endsWith('.') ? cleanEnd : `${cleanEnd}.`
}
