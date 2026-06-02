import type { ResourceItem } from './resourceContract'

export const SEARCH_STOPWORDS = new Set([
  'avec', 'dans', 'pour', 'plus', 'moins', 'cela', 'cette', 'ceux', 'dont', 'quoi', 'quel', 'quelle',
  'quels', 'quelles', 'apres', 'après', 'deux', 'mois', 'guerre', 'guerres', 'feu', 'nous', 'mener',
  'peut', 'etre', 'être', 'faire', 'fait', 'dire', 'dit', 'then', 'that', 'what', 'with', 'from',
  'this', 'will', 'have', 'about', 'after', 'before', 'over', 'into', 'where', 'when',
])

const GEOPOLITICAL_TERMS = [
  'iran', 'iranian', 'tehran', 'teheran', 'téhéran', 'hormuz', 'ormuz', 'strait', 'detroit',
  'détroit', 'trump', 'ceasefire', 'cessez', 'israel', 'israël', 'gulf', 'oil', 'petrole',
  'pétrole', 'irgc', 'cgri', 'sanction', 'nuclear', 'nucleaire', 'nucléaire',
]

const US_TERMS = ['usa', 'us', 'u.s.', 'united states', 'etats unis', 'états unis', 'washington', 'white house']

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function searchKeywords(value: string): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(/[^a-z0-9]+/i)
        .map((word) => word.trim())
        .filter((word) => word.length >= 4 && !SEARCH_STOPWORDS.has(word))
    )
  ).slice(0, 12)
}

export function resourceSearchText(resource: ResourceItem): string {
  return normalizeSearchText(`${resource.title ?? ''} ${resource.excerpt ?? ''} ${resource.url ?? ''}`)
}

export function extractRequestedDomains(value: string): string[] {
  const matches = value.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? []
  const seen = new Set<string>()
  return matches
    .map((match) =>
      match
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '')
        .replace(/[),.;:!?]+$/g, '')
        .toLowerCase()
    )
    .filter((domain) => {
      if (!domain || seen.has(domain)) return false
      seen.add(domain)
      return true
    })
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export function isDirectSiteResource(resource: ResourceItem): boolean {
  return resource.type === 'requested-site' ||
    resource.type === 'site-crawl-summary' ||
    /direct-site/i.test(resource.reliability ?? resource.source ?? '')
}

function isCausalInfluenceQuery(query: string): boolean {
  const text = normalizeSearchText(query)
  return /\b(iran|ormuz|hormuz|teheran|teheran|israel|gaza|ukraine|russie|chine|otan|guerre|cessez-le-feu|sanction|militaire|trump|netanyahu|netanyahou|netanayou)\b/i.test(text) &&
    /\b(entraine|entraine|pousse|force|manipule|provoque|cause|declenche|amene|dragged|pushed|led|influence)\b/i.test(text)
}

export function isRelevantResource(resource: ResourceItem, query: string): boolean {
  const haystack = resourceSearchText(resource)
  if (!haystack) return false
  if (isDirectSiteResource(resource)) {
    const requestedDomains = extractRequestedDomains(query)
    const host = hostname(resource.url)
    if (requestedDomains.length === 0 || requestedDomains.includes(host)) return true
  }

  const queryText = normalizeSearchText(query)
  const queryKeywords = searchKeywords(query)
  const geopoliticalQuery = GEOPOLITICAL_TERMS.some((term) => queryText.includes(normalizeSearchText(term)))
  const causalQuery = isCausalInfluenceQuery(query)

  if (geopoliticalQuery) {
    const geopoliticalHit = GEOPOLITICAL_TERMS.some((term) => haystack.includes(normalizeSearchText(term)))
    if (!geopoliticalHit) return false
    const queryAsksUs = US_TERMS.some((term) => queryText.includes(normalizeSearchText(term)))
    const resourceMentionsUs = US_TERMS.some((term) => haystack.includes(normalizeSearchText(term)))
    if (queryAsksUs && resourceMentionsUs) return true
  }

  if (queryKeywords.length === 0) return true
  const overlap = queryKeywords.filter((keyword) => haystack.includes(keyword)).length
  const minimumOverlap = geopoliticalQuery ? 1 : causalQuery ? 2 : queryKeywords.length <= 3 ? 1 : 2
  return overlap >= minimumOverlap
}

export function bestRelevantExcerpt(resource: ResourceItem, query: string): string {
  const excerpt = String(resource.excerpt ?? '')
    .replace(/#+\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!excerpt) return ''

  const queryText = normalizeSearchText(query)
  const queryKeywords = searchKeywords(query)
  const geopoliticalQuery = GEOPOLITICAL_TERMS.some((term) => queryText.includes(normalizeSearchText(term)))
  const sentences = excerpt
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)

  const scored = sentences.map((sentence) => {
    const text = normalizeSearchText(sentence)
    const keywordScore = queryKeywords.filter((keyword) => text.includes(keyword)).length
    const geopoliticalScore = geopoliticalQuery && GEOPOLITICAL_TERMS.some((term) => text.includes(normalizeSearchText(term))) ? 2 : 0
    return { sentence, score: keywordScore + geopoliticalScore }
  }).filter((item) => item.score > 0)

  const selected = scored.sort((a, b) => b.score - a.score)[0]?.sentence ?? ''
  const cleanSelected = selected.replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').trim()
  return cleanSelected.length > 260 ? `${cleanSelected.slice(0, 257).trim()}...` : cleanSelected
}

export function filterRelevantResources(resources: ResourceItem[], query: string): ResourceItem[] {
  return resources.filter((resource) => isRelevantResource(resource, query))
}
