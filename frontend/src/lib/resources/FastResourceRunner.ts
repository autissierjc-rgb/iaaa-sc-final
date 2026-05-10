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
  provider: 'none' | 'tavily_fast' | 'legacy_fetch_resources'
  query?: string
  include_domains?: string[]
  timeout_ms: number
}

type FastResourceRunnerInput = {
  interpretation: InterpretationContract
  resource_plan: ResourceServiceContract
  timeout_ms?: number
  max_sources?: number
}

type FastSearchPlan = {
  query: string
  include_domains?: string[]
  topic?: 'general' | 'news'
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

async function fetchWithAbort(url: string, init: RequestInit, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
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

function sourceDomainsFor(input: FastResourceRunnerInput): string[] {
  if (input.interpretation.domain === 'geopolitics' || input.interpretation.domain === 'institutional_crisis') {
    return [
      'reuters.com',
      'apnews.com',
      'politico.com',
      'axios.com',
      'congress.gov',
      'ncsl.org',
    ]
  }

  if (input.interpretation.domain === 'startup_market' || input.interpretation.domain === 'business_strategy') {
    return [
      'linkedin.com',
      'crunchbase.com',
      'producthunt.com',
      'dealroom.co',
      'techcrunch.com',
      'businesswire.com',
    ]
  }

  if (input.interpretation.domain === 'science_research' || input.interpretation.domain === 'academic_research') {
    return ['pubmed.ncbi.nlm.nih.gov', 'arxiv.org', 'nature.com', 'science.org', 'researchgate.net']
  }

  return []
}

function fastSearchPlan(input: FastResourceRunnerInput): FastSearchPlan {
  const subject = input.interpretation.object_of_analysis || input.interpretation.situation_soumise
  const fallback = input.resource_plan.fallback_searches[0] ?? ''
  const query = [subject, fallback].filter(Boolean).join(' ').slice(0, 220)

  return {
    query,
    include_domains: sourceDomainsFor(input),
    topic: ['geopolitics', 'war_security', 'institutional_crisis'].includes(input.interpretation.domain)
      ? 'news'
      : 'general',
  }
}

async function fetchTavilyFast(input: FastResourceRunnerInput, timeoutMs: number): Promise<ResourceItem[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  const plan = fastSearchPlan(input)
  const response = await fetchWithAbort(
    'https://api.tavily.com/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: plan.query,
        max_results: input.max_sources ?? 3,
        search_depth: 'basic',
        topic: plan.topic,
        include_domains: plan.include_domains,
      }),
    },
    timeoutMs,
  )

  if (!response?.ok) return []
  const data = await response.json()
  const results = Array.isArray(data.results) ? data.results : []

  return results
    .map((item: Record<string, unknown>) => ({
      title: String(item.title ?? ''),
      url: String(item.url ?? ''),
      type: 'fast-source',
      source: host(String(item.url ?? '')) || 'Tavily',
      excerpt: typeof item.content === 'string' ? item.content : undefined,
      date: typeof item.published_date === 'string' ? item.published_date : undefined,
      reliability: 'tavily:fast',
    }))
    .filter((item: ResourceItem) => item.title && item.url)
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
      provider: 'none',
      timeout_ms: timeoutMs,
    }
  }

  const plan = fastSearchPlan(input)
  const query = [
    input.interpretation.situation_soumise,
    input.resource_plan.fallback_searches[0] ?? '',
  ].filter(Boolean).join(' ')

  try {
    const fast = await fetchTavilyFast(input, timeoutMs)
    const result = fast.length > 0
      ? fast
      : await withTimeout(fetchResources(query), Math.max(800, timeoutMs))

    if (result === 'timeout') {
      return {
        resources: [],
        duration_ms: Date.now() - started,
        status: 'timeout',
        note_fr: 'Le runner sources rapides a depasse son budget ; SIS continue avec une lecture prudente.',
        provider: 'legacy_fetch_resources',
        query: plan.query,
        include_domains: plan.include_domains,
        timeout_ms: timeoutMs,
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
      provider: fast.length > 0 ? 'tavily_fast' : 'legacy_fetch_resources',
      query: plan.query,
      include_domains: plan.include_domains,
      timeout_ms: timeoutMs,
    }
  } catch {
    return {
      resources: [],
      duration_ms: Date.now() - started,
      status: 'failed',
      note_fr: 'Le runner sources rapides a echoue ; SIS continue avec une lecture prudente.',
      provider: 'tavily_fast',
      query: plan.query,
      include_domains: plan.include_domains,
      timeout_ms: timeoutMs,
    }
  }
}
