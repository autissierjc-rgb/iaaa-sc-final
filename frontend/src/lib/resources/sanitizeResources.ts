import type { ResourceItem } from './resourceContract'

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function normalizeUrl(value: unknown): string {
  const url = clean(value)
  if (!url) return ''

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return ''
  }
}

function sourceFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function sanitizeResources(input: unknown, max = 8): ResourceItem[] {
  if (!Array.isArray(input)) return []

  const seen = new Set<string>()
  const resources: ResourceItem[] = []

  for (const item of input) {
    if (!item || typeof item !== 'object') continue

    const raw = item as Record<string, unknown>
    const url = normalizeUrl(raw.url)
    const title = clean(raw.title)
    if (!url || !title) continue

    const key = url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const source = clean(raw.source) || sourceFromUrl(url)
    resources.push({
      title,
      url,
      type: clean(raw.type) || 'reference',
      source,
      date: clean(raw.date) || undefined,
      excerpt: clean(raw.excerpt) || undefined,
      reliability: clean(raw.reliability) || undefined,
    })
  }

  return resources.slice(0, max)
}
