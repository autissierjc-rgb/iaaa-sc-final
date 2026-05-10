import 'server-only'

import type {
  InterpretationContract,
  ResourceContract,
  ResourceServiceContract,
  SourceChannel,
} from '@/lib/contracts'
import { fetchResources } from './fetchResources'
import type { ResourceItem } from './resourceContract'

export type FastResourceRunnerResult = {
  resources: ResourceContract[]
  duration_ms: number
  status: 'skipped' | 'ok' | 'empty' | 'timeout' | 'failed'
  note_fr: string
}

type FastResourceRunnerInput = {
  interpretation: InterpretationContract
  resource_plan: ResourceServiceContract
  timeout_ms?: number
  max_sources?: number
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | 'timeout'> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve('timeout'), timeoutMs)
    promise
      .then((value) => resolve(value))
      .catch(() => resolve([] as T))
      .finally(() => clearTimeout(timeout))
  })
}

function host(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function channelFromItem(item: ResourceItem): SourceChannel {
  const source = `${item.source} ${item.url} ${item.reliability ?? ''}`.toLowerCase()
  if (/\b(gov|senate|congress|court|justice|europa|who|oms|has|sec|fed)\b/.test(source)) return 'official'
  if (/\b(reuters|apnews|associated press|afp|bbc|france24|lemonde|nytimes)\b/.test(source)) return 'news_agency'
  if (/\b(arxiv|pubmed|nature|science|journal|research|university)\b/.test(source)) return 'research'
  if (/\b(linkedin|crunchbase|producthunt|github|company|direct-site)\b/.test(source)) return 'company'
  if (/\b(legal|court|law|justice)\b/.test(source)) return 'legal'
  return 'other'
}

function reliabilityFromItem(item: ResourceItem): ResourceContract['reliability'] {
  const reliability = `${item.reliability ?? ''} ${item.source}`.toLowerCase()
  if (/direct-site|official|tavily:extract/.test(reliability)) return 'primary'
  if (/reuters|ap|afp|brave|openai-web-search|tavily|web-search/.test(reliability)) return 'secondary'
  if (/social|forum|reddit|x\.com|twitter/.test(reliability)) return 'signal'
  return 'unknown'
}

function toResourceContract(
  item: ResourceItem,
  interpretation: InterpretationContract,
  index: number,
): ResourceContract | null {
  if (!item.title || !item.url) return null

  return {
    id: `fast-${index + 1}-${host(item.url) || 'source'}`,
    title: item.title,
    url: item.url,
    source: item.source || host(item.url) || 'source publique',
    channel: channelFromItem(item),
    domain_relevance: [interpretation.domain],
    excerpt: item.excerpt,
    published_at: item.date,
    retrieved_at: new Date().toISOString(),
    reliability: reliabilityFromItem(item),
  }
}

export async function runFastResourceRunner(input: FastResourceRunnerInput): Promise<FastResourceRunnerResult> {
  const started = Date.now()
  const timeoutMs = input.timeout_ms ?? 1200
  const maxSources = input.max_sources ?? 3

  if (!input.resource_plan.needs_web) {
    return {
      resources: [],
      duration_ms: Date.now() - started,
      status: 'skipped',
      note_fr: 'Sources rapides non obligatoires pour cette situation.',
    }
  }

  const query = [
    input.interpretation.situation_soumise,
    input.resource_plan.fallback_searches[0] ?? '',
  ].filter(Boolean).join(' ')

  try {
    const result = await withTimeout(fetchResources(query), timeoutMs)

    if (result === 'timeout') {
      return {
        resources: [],
        duration_ms: Date.now() - started,
        status: 'timeout',
        note_fr: 'Le runner sources rapides a depasse son budget ; SIS continue avec une lecture prudente.',
      }
    }

    const resources = result
      .map((item, index) => toResourceContract(item, input.interpretation, index))
      .filter((item): item is ResourceContract => Boolean(item))
      .slice(0, maxSources)

    return {
      resources,
      duration_ms: Date.now() - started,
      status: resources.length > 0 ? 'ok' : 'empty',
      note_fr: resources.length > 0
        ? `Sources rapides attachees : ${resources.length}.`
        : 'Aucune source rapide exploitable trouvee dans le budget court.',
    }
  } catch {
    return {
      resources: [],
      duration_ms: Date.now() - started,
      status: 'failed',
      note_fr: 'Le runner sources rapides a echoue ; SIS continue avec une lecture prudente.',
    }
  }
}
