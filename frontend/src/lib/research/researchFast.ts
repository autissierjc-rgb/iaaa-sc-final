import { fetchResources } from '../resources/fetchResources'
import type { ResourceItem } from '../resources/resourceContract'
import {
  detectResearchTopic,
  type ResearchFastResult,
  type ResearchInput,
} from './researchContract'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(fallback), timeoutMs)
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timeout))
  })
}

function buildSnapshot(situation: string, sources: ResourceItem[]) {
  if (sources.length === 0) return ''
  const titles = sources.slice(0, 5).map((source) => source.title).join(' | ')
  return `Sources rapides disponibles pour cadrer la situation: ${titles}. Situation: ${situation}`
}

export async function runResearchFast(input: ResearchInput): Promise<ResearchFastResult> {
  const situation = input.situation.trim()
  const topic_type = input.topic_type ?? detectResearchTopic(situation)

  if (!situation || topic_type === 'interne' || topic_type === 'general') {
    return {
      facts_snapshot: '',
      internal_sources: [],
      research_status: 'skipped',
      topic_type,
    }
  }

  const sources = await withTimeout(fetchResources(situation), 8000, [])
  const internal_sources = sources.slice(0, input.max_sources ?? 5)

  return {
    facts_snapshot: buildSnapshot(situation, internal_sources),
    internal_sources,
    research_status: internal_sources.length > 0 ? 'ok' : 'empty',
    topic_type,
  }
}
