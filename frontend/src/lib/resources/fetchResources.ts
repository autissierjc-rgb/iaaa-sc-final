import 'server-only'

import { sanitizeResources } from './sanitizeResources'
import type { ResourceItem } from './resourceContract'

type TavilySearchPlan = {
  query: string
  include_domains?: string[]
  topic?: 'general' | 'news'
  label: string
}

function isGeopoliticalQuery(query: string): boolean {
  return /\b(iran|ormuz|hormuz|teheran|téhéran|israel|israël|gaza|ukraine|russie|chine|otan|guerre|cessez-le-feu|sanction|militaire|trump|netanyahu|netanyahou|netanayou)\b/i.test(query)
}

function isCausalInfluenceQuery(query: string): boolean {
  const text = normalizeSearchText(query)
  return isGeopoliticalQuery(query) &&
    /\b(entraine|entrain[eé]|pousse|force|manipule|provoque|cause|declenche|amene|dragged|pushed|led|influence)\b/i.test(text)
}

type CrawledPage = {
  title: string
  url: string
  text: string
  links: string[]
}

const SITE_CRAWL_MAX_PAGES = 18
const SITE_CRAWL_MAX_MS = 12000
const SITE_CRAWL_MAX_CHARS = 28000

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeDuckUrl(value: string): string {
  try {
    const parsed = new URL(value, 'https://duckduckgo.com')
    const uddg = parsed.searchParams.get('uddg')
    return uddg ? decodeURIComponent(uddg) : value
  } catch {
    return value
  }
}

function parseDuckDuckGo(html: string): ResourceItem[] {
  const results: ResourceItem[] = []
  const re = /<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = re.exec(html)) && results.length < 6) {
    const url = decodeDuckUrl(match[1] ?? '')
    const title = stripHtml(match[2] ?? '')
    const excerpt = stripHtml(match[3] ?? '')
    if (!title || !url) continue

    results.push({
      title,
      url,
      type: 'web',
      source: '',
      excerpt,
      reliability: 'web-search',
    })
  }

  return sanitizeResources(results)
}

function extractRequestedUrls(value: string): string[] {
  const matches = value.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? []
  const seen = new Set<string>()
  return matches
    .map((match) => match.replace(/[),.;:!?]+$/g, ''))
    .map((match) => /^https?:\/\//i.test(match) ? match : `https://${match}`)
    .filter((url) => {
      try {
        const parsed = new URL(url)
        const key = `${parsed.hostname}${parsed.pathname}`.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      } catch {
        return false
      }
    })
}

function htmlTitle(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return stripHtml(title ?? '').replace(/\s+/g, ' ').trim()
}

function htmlDescription(html: string): string {
  const meta =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const body = stripHtml(html).replace(/\s+/g, ' ').trim()
  const text = stripHtml(meta ?? body)
  return text.length > 900 ? `${text.slice(0, 897).trim()}...` : text
}

function htmlBodyText(html: string, maxLength = 1800): string {
  const body = stripHtml(html)
    .replace(/\b(Se rendre au contenu|Accueil|A propos|Ev[eè]nements|Blog|Tous les articles|Annonces|T[eé]moignages|Workshops|Demander une demo|Contact)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return body.length > maxLength ? `${body.slice(0, maxLength - 3).trim()}...` : body
}

function linkLabel(html: string, href: string): string {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = html.match(new RegExp(`<a[^>]+href=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i'))
  return stripHtml(match?.[1] ?? '')
}

function isNoisePath(pathname: string): boolean {
  return /(?:^|\/)(privacy|legal|mentions-legales|terms|conditions|cookies?|login|signin|signup|account|admin|wp-|cdn-cgi|tag|category|author|feed|press|presse)(?:\/|$)/i.test(pathname)
}

function normalizeInternalUrl(url: URL): string {
  return `${url.origin}${url.pathname.replace(/\/$/, '') || '/'}`
}

function linkScore(url: URL, label: string, base: URL): number {
  const haystack = normalizeSearchText(`${url.pathname} ${label}`)
  let score = 1
  if (/\b(modele|model|business|economic|application|app|case|cas|etudes|study|pricing|tarif|faq|question|about|pour-vous|services|conseil|solution|offre|platform|plateforme|talent|freelance|client|contact)\b/i.test(haystack)) score += 8
  if (url.pathname.includes('/fr')) score += 3
  if (url.pathname === base.pathname.replace(/\/$/, '')) score -= 10
  if (isNoisePath(url.pathname)) score -= 20
  return score
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  let base: URL
  try {
    base = new URL(baseUrl)
  } catch {
    return []
  }

  const candidates: Array<{ url: string; score: number }> = []
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const href = match[1]
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    let parsed: URL
    try {
      parsed = new URL(href, base)
    } catch {
      continue
    }
    if (parsed.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) continue
    if (/\.(pdf|png|jpe?g|webp|gif|svg|zip|docx?|xlsx?)$/i.test(parsed.pathname)) continue

    const score = linkScore(parsed, linkLabel(html, href), base)
    if (score > 0) candidates.push({ url: normalizeInternalUrl(parsed), score })
  }

  const seen = new Set<string>()
  return candidates
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.url)
    .filter((url) => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })
}

async function fetchHtmlPage(url: string, timeoutMs = 3000): Promise<{ html: string; url: string } | null> {
  const response = await fetchWithTimeout(
    url,
    { headers: { 'User-Agent': 'IAAA-SituationCard/1.0' } },
    timeoutMs
  )
  if (!response?.ok) return null
  const contentType = response.headers.get('content-type') ?? ''
  if (!/text\/html|application\/xhtml/i.test(contentType)) return null
  const html = await response.text()
  return { html, url: response.url || url }
}

function summarizeCrawl(pages: CrawledPage[], requestedUrl: string): ResourceItem | null {
  if (pages.length === 0) return null
  const domain = hostname(requestedUrl) || hostname(pages[0].url)
  const sections = pages
    .map((page, index) => {
      const text = page.text.length > 1400 ? `${page.text.slice(0, 1397).trim()}...` : page.text
      return `[${index + 1}] ${page.title}\nURL: ${page.url}\n${text}`
    })
    .join('\n\n')

  return {
    title: `Synthèse crawl site - ${domain}`,
    url: requestedUrl,
    type: 'site-crawl-summary',
    source: 'Direct website crawl',
    excerpt: [
      `Pages utiles lues: ${pages.length}.`,
      `Budget: max ${SITE_CRAWL_MAX_PAGES} pages, ${SITE_CRAWL_MAX_CHARS} caractères utiles, ${SITE_CRAWL_MAX_MS} ms.`,
      sections,
    ].join('\n\n'),
    reliability: 'direct-site:crawl-summary',
  }
}

async function crawlRequestedSite(startUrl: string): Promise<ResourceItem[]> {
  const start = Date.now()
  const queue = [startUrl]
  const seen = new Set<string>()
  const pages: CrawledPage[] = []
  let charBudget = 0

  while (
    queue.length > 0 &&
    pages.length < SITE_CRAWL_MAX_PAGES &&
    charBudget < SITE_CRAWL_MAX_CHARS &&
    Date.now() - start < SITE_CRAWL_MAX_MS
  ) {
    const url = queue.shift()!
    let normalized = url
    try {
      normalized = normalizeInternalUrl(new URL(url))
    } catch {}
    if (seen.has(normalized)) continue
    seen.add(normalized)

    const page = await fetchHtmlPage(url, pages.length === 0 ? 3500 : 2500)
    if (!page) continue
    const html = page.html
    const text = htmlBodyText(html, 2200)
    if (!text || text.length < 80) continue
    const title = htmlTitle(html) || normalized
    const links = extractInternalLinks(html, page.url)
    pages.push({ title, url: normalized, text, links })
    charBudget += text.length

    for (const link of links) {
      if (!seen.has(link) && queue.length < SITE_CRAWL_MAX_PAGES * 2) queue.push(link)
    }

    queue.sort((a, b) => {
      try {
        const base = new URL(startUrl)
        return linkScore(new URL(b), '', base) - linkScore(new URL(a), '', base)
      } catch {
        return 0
      }
    })
  }

  const pageResources = pages.map((page, index) => ({
    title: page.title,
    url: page.url,
    type: 'requested-site',
    source: index === 0 ? 'Direct website fetch' : 'Direct website crawl',
    excerpt: page.text,
    reliability: index === 0 ? 'direct-site:homepage+crawl' : 'direct-site:crawled',
  } satisfies ResourceItem))
  const summary = summarizeCrawl(pages, startUrl)
  return sanitizeResources(summary ? [summary, ...pageResources] : pageResources)
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 2200) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchRequestedUrlResources(query: string): Promise<ResourceItem[]> {
  const urls = extractRequestedUrls(query).slice(0, 2)
  const results = await Promise.all(urls.map((url) => crawlRequestedSite(url)))

  return sanitizeResources(results.flat().filter(Boolean) as ResourceItem[])
}

function hostname(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function resourceKey(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname.replace(/^www\./, '').toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function detectSourceType(url: string): string {
  const host = hostname(url)
  if (!host) return 'web'
  if (/\.(gov|gouv|go|mil)$/.test(host) || /(un\.org|iaea\.org|worldbank\.org|imf\.org|ecb\.europa\.eu|europa\.eu|opec\.org|eia\.gov)/i.test(host)) {
    return 'institutional'
  }
  if (/(irna\.ir|mehrnews\.com|tasnimnews\.com|tehrantimes\.com|presstv\.ir|timesofisrael\.com|jpost\.com|haaretz\.com|al-monitor\.com|thenationalnews\.com|arabnews\.com|aljazeera\.com)/i.test(host)) {
    return 'local-regional'
  }
  if (/(reuters\.com|apnews\.com|afp\.com|bbc\.com|ft\.com|wsj\.com|nytimes\.com|washingtonpost\.com|lemonde\.fr|lefigaro\.fr|leparisien\.fr|humanite\.fr|ouest-france\.fr|theguardian\.com|politico\.com|axios\.com|euronews\.com|france24\.com|rfi\.fr)/i.test(host)) {
    return 'major-media'
  }
  if (/(rand\.org|csis\.org|cfr\.org|iiss\.org|brookings\.edu|chathamhouse\.org|ifri\.org|orfonline\.org|mei\.edu)/i.test(host)) {
    return 'research'
  }
  return 'web'
}

const SEARCH_STOPWORDS = new Set([
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

const COUNTRY_MEDIA_BASKETS: Array<{
  id: string
  patterns: RegExp[]
  domains: string[]
  labels: string
}> = [
  {
    id: 'israel',
    patterns: [/\bisrael\b/i, /\bisra[eë]l\b/i, /\bnet[a-z]{3,12}y[a-z]{0,4}ou\b/i, /\bnetanyahu\b/i],
    domains: ['haaretz.com', 'timesofisrael.com', 'jpost.com', 'ynetnews.com'],
    labels: 'Israeli media Haaretz Times of Israel Jerusalem Post Ynet',
  },
  {
    id: 'iran',
    patterns: [/\biran\b/i, /\bt[eé]h[eé]ran\b/i, /\btehran\b/i, /\birgc\b/i, /\bcgri\b/i],
    domains: ['irna.ir', 'mehrnews.com', 'tasnimnews.com', 'tehrantimes.com', 'presstv.ir'],
    labels: 'Iranian media IRNA Mehr Tasnim Tehran Times Press TV',
  },
  {
    id: 'united-states',
    patterns: [/\busa\b/i, /\b[eé]tats-unis\b/i, /\bunited states\b/i, /\btrump\b/i, /\bwashington\b/i],
    domains: ['whitehouse.gov', 'state.gov', 'defense.gov', 'congress.gov', 'apnews.com', 'politico.com', 'axios.com', 'washingtonpost.com'],
    labels: 'US sources White House State Department Congress AP Politico Axios Washington Post',
  },
  {
    id: 'ukraine',
    patterns: [/\bukraine\b/i, /\bkyiv\b/i, /\bkiev\b/i],
    domains: ['kyivindependent.com', 'pravda.com.ua', 'ukrinform.net'],
    labels: 'Ukrainian media Kyiv Independent Ukrainska Pravda Ukrinform',
  },
  {
    id: 'russia',
    patterns: [/\brussie\b/i, /\brussia\b/i, /\bmoscou\b/i, /\bmoscow\b/i, /\bkremlin\b/i],
    domains: ['tass.com', 'interfax.com', 'kommersant.ru', 'themoscowtimes.com'],
    labels: 'Russian media TASS Interfax Kommersant Moscow Times',
  },
  {
    id: 'china',
    patterns: [/\bchine\b/i, /\bchina\b/i, /\bbeijing\b/i, /\bp[eé]kin\b/i],
    domains: ['scmp.com', 'globaltimes.cn', 'xinhuanet.com', 'chinadaily.com.cn'],
    labels: 'China media SCMP Global Times Xinhua China Daily',
  },
  {
    id: 'palestine',
    patterns: [/\bpalestine\b/i, /\bpalestinien/i, /\bgaza\b/i, /\bhamas\b/i],
    domains: ['wafa.ps', 'maannews.net', 'aljazeera.com', 'middleeasteye.net'],
    labels: 'Palestinian and regional media WAFA Maan Al Jazeera Middle East Eye',
  },
]

function countryMediaPlans(query: string): TavilySearchPlan[] {
  const plans: TavilySearchPlan[] = []
  const seen = new Set<string>()
  for (const basket of COUNTRY_MEDIA_BASKETS) {
    if (!basket.patterns.some((pattern) => pattern.test(query))) continue
    if (seen.has(basket.id)) continue
    seen.add(basket.id)
    plans.push({
      query: `${query} ${basket.labels} local perspective official reactions`,
      include_domains: basket.domains,
      topic: 'news',
      label: `country-perspective:${basket.id}`,
    })
  }
  return plans.slice(0, 4)
}

function matchedCountryMediaDomains(query: string): Set<string> {
  const domains = new Set<string>()
  for (const basket of COUNTRY_MEDIA_BASKETS) {
    if (!basket.patterns.some((pattern) => pattern.test(query))) continue
    for (const domain of basket.domains) domains.add(domain)
  }
  return domains
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function searchKeywords(value: string): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(/[^a-z0-9]+/i)
        .map((word) => word.trim())
        .filter((word) => word.length >= 4 && !SEARCH_STOPWORDS.has(word))
    )
  ).slice(0, 12)
}

function namedSiteSearchQuery(value: string): string | null {
  const text = normalizeSearchText(value)
  const patterns = [
    /\bque\s+fait\s+(?:le\s+|la\s+)?(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d\s+)?([a-z0-9-]{3,})\b/i,
    /\b(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d\s+)?([a-z0-9-]{3,})\b/i,
    /\b([a-z0-9-]{3,})\s+(?:site|page|plateforme|application|app|service|outil)\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const name = match?.[1]?.trim()
    if (name && !SEARCH_STOPWORDS.has(name)) return `${name} site officiel`
  }
  return null
}

function resourceSearchText(resource: ResourceItem): string {
  return normalizeSearchText(`${resource.title ?? ''} ${resource.excerpt ?? ''} ${resource.url ?? ''}`)
}

function isRelevantResource(resource: ResourceItem, query: string): boolean {
  const haystack = resourceSearchText(resource)
  if (!haystack) return false

  const queryText = normalizeSearchText(query)
  const queryKeywords = searchKeywords(query)
  const geopoliticalQuery = GEOPOLITICAL_TERMS.some((term) => queryText.includes(normalizeSearchText(term)))
  const causalQuery = isCausalInfluenceQuery(query)

  if (geopoliticalQuery) {
    const geopoliticalHit = GEOPOLITICAL_TERMS.some((term) => haystack.includes(normalizeSearchText(term)))
    if (!geopoliticalHit) return false
  }

  if (queryKeywords.length === 0) return true
  const overlap = queryKeywords.filter((keyword) => haystack.includes(keyword)).length
  const minimumOverlap = causalQuery ? 2 : queryKeywords.length <= 3 ? 1 : 2
  return overlap >= minimumOverlap
}

function bestRelevantExcerpt(resource: ResourceItem, query: string): string {
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

function isDirectSiteResource(resource: ResourceItem): boolean {
  return resource.type === 'requested-site' ||
    resource.type === 'site-crawl-summary' ||
    /direct-site/i.test(resource.reliability ?? resource.source ?? '')
}

function extractRequestedDomains(value: string): string[] {
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

function inferSearchPlans(query: string): TavilySearchPlan[] {
  const text = query.toLowerCase()
  const requestedDomains = extractRequestedDomains(query)
  const siteQuery = namedSiteSearchQuery(query)
  const plans: TavilySearchPlan[] = requestedDomains.length > 0 ? [] : [
    { query: siteQuery ?? query, label: siteQuery ? 'official-site-search' : 'general' },
  ]

  if (requestedDomains.length > 0) {
    plans.push({
      query: `${query} product market customers pricing traction team Europe`,
      include_domains: requestedDomains,
      label: 'requested-site',
    })
    return plans
  }

  if (isGeopoliticalQuery(query)) {
    const causalQuery = isCausalInfluenceQuery(query)
    const geopoliticalQuery = causalQuery
      ? `${query} Netanyahu Trump dragged United States into Iran war influence decision`
      : /\b(iran|ormuz|hormuz)\b/i.test(text)
        ? `${query} Iran war Trump ceasefire Strait of Hormuz escalation Tehran IRGC oil markets`
        : query
    plans.push(
      ...(causalQuery
        ? [
            {
              query: `${query} Reuters AP BBC Guardian Financial Times Netanyahu Trump Iran war dragged United States`,
              include_domains: ['reuters.com', 'apnews.com', 'bbc.com', 'theguardian.com', 'ft.com', 'nytimes.com', 'washingtonpost.com', 'politico.com', 'axios.com'],
              topic: 'news' as const,
              label: 'causal-major-media',
            },
            {
              query: `${query} White House State Department Congress Israel Netanyahu Trump Iran`,
              include_domains: ['whitehouse.gov', 'state.gov', 'congress.gov', 'senate.gov', 'house.gov', 'defense.gov'],
              label: 'causal-institutional',
            },
            ...countryMediaPlans(query),
          ]
        : countryMediaPlans(query)),
      {
        query: `${geopoliticalQuery} United Nations IAEA US State Department White House EIA OPEC`,
        include_domains: ['un.org', 'iaea.org', 'state.gov', 'whitehouse.gov', 'eia.gov', 'opec.org'],
        label: 'institutional',
      },
      {
        query: `${geopoliticalQuery} local and regional media Al Jazeera Al Monitor The National Arab News`,
        include_domains: ['aljazeera.com', 'al-monitor.com', 'thenationalnews.com', 'arabnews.com', 'middleeasteye.net'],
        topic: 'news',
        label: 'local-regional',
      },
      {
        query: `${geopoliticalQuery} Reuters AP Financial Times BBC Guardian Le Monde Euronews analysis`,
        include_domains: ['reuters.com', 'apnews.com', 'ft.com', 'bbc.com', 'theguardian.com', 'lemonde.fr', 'lefigaro.fr', 'euronews.com', 'france24.com'],
        topic: 'news',
        label: 'major-media',
      }
    )
  } else if (siteQuery) {
    plans.push({
      query: `${siteQuery} produit utilisateurs tarifs clients`,
      label: 'site-product-search',
    })
  } else if (/\b(startup|vc|investisseur|investissement|march[eé]|bourse|prix|taux|revenus|traction|cac|moat)\b/i.test(text)) {
    plans.push(
      {
        query: `${query} venture capital startup selection criteria market traction`,
        include_domains: ['a16z.com', 'ycombinator.com', 'bessemer.com', 'sequoiacap.com', 'nfx.com', 'firstround.com'],
        label: 'sector',
      },
      {
        query: `${query} market research data startup venture capital`,
        include_domains: ['cbinsights.com', 'pitchbook.com', 'crunchbase.com', 'dealroom.co', 'statista.com'],
        label: 'market-data',
      }
    )
  } else if (/\b(sant[eé]|medical|médical|diagnostic|traitement|sympt[oô]me|medicament|médicament)\b/i.test(text)) {
    plans.push({
      query: `${query} official medical guidance`,
      include_domains: ['who.int', 'has-sante.fr', 'sante.gouv.fr', 'cdc.gov', 'nih.gov', 'nhs.uk', 'ema.europa.eu'],
      label: 'medical-institutional',
    })
  }

  return plans.slice(0, 5)
}

function rankDiverseResources(resources: ResourceItem[], query: string): ResourceItem[] {
  const typeRank: Record<string, number> = {
    'institutional': 0,
    'major-media': 1,
    'local-regional': 2,
    'research': 3,
    'web': 4,
  }

  const seenKeys = new Set<string>()
  const sanitized = sanitizeResources(resources, 40).filter((resource) => isRelevantResource(resource, query)).filter((resource) => {
    const key = resourceKey(resource.url)
    if (seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  }).map((resource) => {
    const directSite = isDirectSiteResource(resource)
    const detectedType = detectSourceType(resource.url)
    return {
      ...resource,
      type: directSite ? resource.type : detectedType || resource.type,
      excerpt: directSite ? resource.excerpt : bestRelevantExcerpt(resource, query) || resource.excerpt,
      reliability: resource.reliability || detectedType,
    }
  })

  const geopolitical = isGeopoliticalQuery(query)
  const countryDomains = matchedCountryMediaDomains(query)
  const trustedCount = sanitized.filter((resource) =>
    ['institutional', 'major-media', 'research', 'local-regional'].includes(resource.type)
  ).length
  const byHost = new Map<string, number>()
  const byType = new Map<string, number>()
  return sanitized
    .sort((a, b) => {
      const aType = typeRank[a.type] ?? 9
      const bType = typeRank[b.type] ?? 9
      const aCountry = countryDomains.has(hostname(a.url)) ? -1 : 0
      const bCountry = countryDomains.has(hostname(b.url)) ? -1 : 0
      return (aCountry - bCountry) || (aType - bType)
    })
    .filter((resource) => {
      const host = hostname(resource.url)
      const count = byHost.get(host) ?? 0
      const directSite = isDirectSiteResource(resource)
      const maxByHost = directSite ? SITE_CRAWL_MAX_PAGES + 1 : 2
      if (count >= maxByHost) return false
      byHost.set(host, count + 1)

      const type = resource.type || 'web'
      if (geopolitical && type === 'web' && trustedCount >= 4) return false
      const typeCount = byType.get(type) ?? 0
      const maxByType = directSite
        ? SITE_CRAWL_MAX_PAGES + 1
        : type === 'institutional'
          ? 2
          : type === 'web'
            ? 2
            : 3
      if (typeCount >= maxByType) return false
      byType.set(type, typeCount + 1)

      return true
    })
    .slice(0, resources.some(isDirectSiteResource) ? SITE_CRAWL_MAX_PAGES + 6 : 8)
}

async function fetchTavilyPlan(plan: TavilySearchPlan): Promise<ResourceItem[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  const response = await fetchWithTimeout(
    'https://api.tavily.com/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: plan.query,
        max_results: 6,
        search_depth: 'basic',
        topic: plan.topic ?? 'general',
        include_domains: plan.include_domains,
      }),
    },
    4500
  )

  if (!response?.ok) return []
  const data = await response.json()
  return sanitizeResources(
    Array.isArray(data.results)
      ? data.results.map((item: Record<string, unknown>) => {
          const url = String(item.url ?? '')
          const type = detectSourceType(url)
          return {
          title: item.title,
          url,
          type,
          source: item.source,
          excerpt: item.content,
          date: item.published_date,
          reliability: `tavily:${type}`,
        }
        })
      : []
  )
}

async function fetchTavily(query: string): Promise<ResourceItem[]> {
  const plans = inferSearchPlans(query)
  const results = await Promise.all(plans.map((plan) => fetchTavilyPlan(plan)))
  return rankDiverseResources(results.flat(), query)
}

function sourcesFromOpenAIResponse(data: Record<string, unknown>): ResourceItem[] {
  const output = Array.isArray(data.output) ? data.output : []
  const sources: ResourceItem[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>

    if (record.type === 'web_search_call') {
      const action = record.action
      if (action && typeof action === 'object') {
        const actionSources = (action as Record<string, unknown>).sources
        if (Array.isArray(actionSources)) {
          for (const source of actionSources) {
            if (!source || typeof source !== 'object') continue
            const s = source as Record<string, unknown>
            sources.push({
              title: typeof s.title === 'string' ? s.title : String(s.url ?? ''),
              url: String(s.url ?? ''),
              type: 'web',
              source: 'OpenAI web search',
              reliability: 'openai-web-search',
            })
          }
        }
      }
    }

    const content = Array.isArray(record.content) ? record.content : []
    for (const block of content) {
      if (!block || typeof block !== 'object') continue
      const annotations = (block as Record<string, unknown>).annotations
      if (!Array.isArray(annotations)) continue

      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== 'object') continue
        const a = annotation as Record<string, unknown>
        if (a.type !== 'url_citation') continue
        sources.push({
          title: String(a.title ?? a.url ?? ''),
          url: String(a.url ?? ''),
          type: 'web',
          source: 'OpenAI citation',
          reliability: 'openai-web-search',
        })
      }
    }
  }

  return sanitizeResources(sources)
}

async function fetchOpenAIWeb(query: string): Promise<ResourceItem[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return []

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/responses',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        tools: [{ type: 'web_search_preview' }],
        include: ['web_search_call.action.sources'],
        input: `Find up to 5 reliable sources directly useful for this situation. Return concise citations only: ${query}`,
      }),
    },
    2500
  )

  if (!response?.ok) return []
  return sourcesFromOpenAIResponse(await response.json())
}

async function fetchBrave(query: string): Promise<ResourceItem[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return []

  const response = await fetchWithTimeout(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
    },
    2500
  )

  if (!response?.ok) return []
  const data = await response.json()
  return sanitizeResources(
    Array.isArray(data.web?.results)
      ? data.web.results.map((item: Record<string, unknown>) => ({
          title: item.title,
          url: item.url,
          type: 'web',
          source: item.profile && typeof item.profile === 'object'
            ? (item.profile as Record<string, unknown>).name
            : '',
          excerpt: item.description,
          reliability: 'brave',
        }))
      : []
  )
}

async function fetchDuckDuckGo(query: string): Promise<ResourceItem[]> {
  const response = await fetchWithTimeout(
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'User-Agent': 'IAAA-SituationCard/1.0',
      },
    }
  )

  if (!response?.ok) return []
  return parseDuckDuckGo(await response.text())
}

export async function fetchResources(situation: string): Promise<ResourceItem[]> {
  const query = situation.trim().slice(0, 180)
  if (!query) return []

  const useBroadWeb = isGeopoliticalQuery(query)
  const [directResources, tavilyResources, openAIResources, braveResources] = await Promise.all([
    fetchRequestedUrlResources(query),
    fetchTavily(query),
    useBroadWeb ? fetchOpenAIWeb(query) : Promise.resolve([]),
    useBroadWeb ? fetchBrave(query) : Promise.resolve([]),
  ])
  const ranked = rankDiverseResources([...directResources, ...tavilyResources, ...openAIResources, ...braveResources], query)
  if (ranked.length > 0) return ranked

  const fallbackQuery = namedSiteSearchQuery(query) ?? query
  try {
    const duckResources = await fetchDuckDuckGo(fallbackQuery)
    return rankDiverseResources(duckResources, fallbackQuery)
  } catch {
    return []
  }
}
