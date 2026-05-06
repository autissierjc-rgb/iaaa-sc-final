import type {
  InterpretationContract,
  ResourceContract,
  ResourceServiceContract,
  ResourceStatus,
} from '../contracts'
import { routeSourcesForDomain } from './SourceRouter'

export type ResourceServiceInput = {
  interpretation: InterpretationContract
  supplied_resources?: ResourceContract[]
  now?: Date
}

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/gi

export function detectUrls(input: string): string[] {
  const matches = input.match(URL_PATTERN) ?? []
  return Array.from(new Set(matches.map((url) => url.trim().replace(/[.,;:!?]+$/, ''))))
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function statusFor(urls: string[], resources: ResourceContract[]): ResourceStatus {
  if (resources.length > 0) {
    return urls.length > 0 && resources.length < urls.length ? 'partial' : 'available'
  }

  if (urls.length > 0) return 'partial'

  return 'not_needed'
}

export function planResources(input: ResourceServiceInput): ResourceServiceContract {
  const started = Date.now()
  const urls = detectUrls(input.interpretation.raw_input).map(normalizeUrl)
  const route = routeSourcesForDomain(
    input.interpretation.domain,
    input.interpretation.object_of_analysis,
  )
  const suppliedResources = input.supplied_resources ?? []
  const extractedUrls = suppliedResources
    .map((resource) => resource.url)
    .filter((url) => urls.includes(url))
  const fallbackSearches = urls.length > extractedUrls.length
    ? route.suggested_queries.slice(0, 4)
    : []

  return {
    status: statusFor(urls, suppliedResources),
    requested_urls: urls,
    extracted_urls: extractedUrls,
    fallback_searches: fallbackSearches,
    resources: suppliedResources,
    public_sources: suppliedResources.filter((resource) => resource.reliability !== 'unknown'),
    internal_notes: [
      ...route.notes,
      urls.length > 0
        ? 'URL present: generation should not be blocked by clarification; server extraction/search must run.'
        : 'No URL detected: resources are routed by domain and may stay optional for fast SC.',
      `source_channels=${route.channels.join(',')}`,
    ],
    trace: {
      service: 'ResourceService',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: suppliedResources.length > 0 ? 'ok' : urls.length > 0 ? 'partial' : 'ok',
      notes: [
        `requested_urls=${urls.length}`,
        `resources=${suppliedResources.length}`,
        `fallback_searches=${fallbackSearches.length}`,
      ],
    },
  }
}
