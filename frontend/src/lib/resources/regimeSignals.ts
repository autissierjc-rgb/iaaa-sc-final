import type { ResourceServiceContract } from '../contracts/resources'
import { sanitizeResourceAsProbativeEvidence } from './probativeEvidenceSanitizer'

export type ResourceRegimeSignal = {
  id: string
  signal_fr: string
  source_title: string
  source_name: string
  reliability: string
  source_id?: string
}

function compact(value: string, max = 320): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function signalFromSource(source: ResourceServiceContract['public_sources'][number]): ResourceRegimeSignal | null {
  const evidence = sanitizeResourceAsProbativeEvidence(source)
  if (!evidence.can_be_public) return null

  const signal = compact(evidence.public_label_fr)
  const sourceTitle = compact(source.title, 180)
  const sourceName = compact(source.source || source.url, 80)
  if (!signal && !sourceTitle) return null

  return {
    id: source.id || source.url || sourceTitle,
    signal_fr: signal || sourceTitle,
    source_title: sourceTitle,
    source_name: sourceName,
    reliability: source.reliability ?? 'unknown',
    source_id: source.id,
  }
}

export function buildResourceRegimeSignals(
  resources?: ResourceServiceContract,
  max = 4,
): ResourceRegimeSignal[] {
  if (!resources) return []

  const seen = new Set<string>()
  return resources.public_sources
    .map(signalFromSource)
    .filter((signal): signal is ResourceRegimeSignal => Boolean(signal))
    .filter((signal) => {
      const key = normalize(`${signal.signal_fr} ${signal.source_name}`)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, max)
}

export function countRegimeSignalsUsed(signals: ResourceRegimeSignal[], publicText: string): number {
  const normalizedText = normalize(publicText)
  return signals.filter((signal) => {
    const candidates = [
      signal.source_title,
      signal.source_name,
      signal.signal_fr,
    ]
      .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
      .filter((part) => part.length >= 6)

    return candidates.some((part) => normalizedText.includes(part))
  }).length
}
