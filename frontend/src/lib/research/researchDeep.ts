import { fetchResources } from '../resources/fetchResources'
import type { ResourceItem } from '../resources/resourceContract'
import {
  detectResearchTopic,
  type ResearchDeepResult,
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

function buildDeepFacts(situation: string, sources: ResourceItem[]) {
  if (sources.length === 0) return ''
  return `Recherche approfondie en cours/stabilisee pour: ${situation}. Sources retenues: ${sources
    .map((source) => source.title)
    .join(' | ')}`
}

export async function runResearchDeep(input: ResearchInput): Promise<ResearchDeepResult> {
  const situation = input.situation.trim()
  const topic_type = input.topic_type ?? detectResearchTopic(situation)

  if (!situation || topic_type === 'interne' || topic_type === 'general') {
    return {
      facts_deep: '',
      analysis_notes: '',
      sources: [],
      research_status: 'skipped',
      topic_type,
    }
  }

  const sources = await withTimeout(fetchResources(situation), 180000, [])
  const kept = sources.slice(0, input.max_sources ?? 12)

  return {
    facts_deep: buildDeepFacts(situation, kept),
    analysis_notes:
      kept.length > 0
        ? 'Sources deep disponibles pour Lecture enrichie, Approfondir et Ressources.'
        : 'Aucune source deep stabilisee. Demander des sources utilisateur si necessaire.',
    sources: kept,
    research_status: kept.length > 0 ? 'ok' : 'empty',
    topic_type,
  }
}
