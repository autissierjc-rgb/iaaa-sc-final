import { cleanModelText } from '../ai/json'
import type { ConcreteTheatre } from '../resources/resourceContract'

const HORS_SOL_PATTERNS = [
  /\bun objet visible\b/i,
  /\bune tension à rendre vérifiable\b/i,
  /\bce qui est craint ou raconté\b/i,
  /\bacteur ou relais\b/i,
  /\bcanal concret\b/i,
  /\bpreuve qui relie le risque à un mécanisme\b/i,
  /\ble récit devient plus fort que les traces\b/i,
]

function normalize(value: string): string {
  return cleanModelText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function anchorCandidates(theatre?: ConcreteTheatre): string[] {
  if (!theatre) return []
  return [
    ...theatre.actors,
    ...theatre.institutions,
    ...theatre.procedures,
    ...theatre.places,
    ...theatre.dates,
    ...theatre.precedents,
    ...theatre.relays,
    ...theatre.blockers,
    ...theatre.mechanisms,
    ...theatre.thresholds,
  ]
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && item.length < 120)
}

export function countConcreteAnchors(text: string, theatre?: ConcreteTheatre): number {
  const normalized = normalize(text)
  const seen = new Set<string>()
  for (const candidate of anchorCandidates(theatre)) {
    const key = normalize(candidate)
    if (key && normalized.includes(key)) seen.add(key)
  }
  return seen.size
}

export function hasUnanchoredHorsSolTerms(text: string, theatre?: ConcreteTheatre): boolean {
  const cleaned = cleanModelText(text)
  if (!HORS_SOL_PATTERNS.some((pattern) => pattern.test(cleaned))) return false
  return countConcreteAnchors(cleaned, theatre) < 3
}

export function isUnderSituatedText(
  text: string,
  theatre?: ConcreteTheatre,
  minimumAnchors = 2
): boolean {
  if (!theatre || theatre.anchors.length === 0) return false
  return countConcreteAnchors(text, theatre) < minimumAnchors || hasUnanchoredHorsSolTerms(text, theatre)
}
