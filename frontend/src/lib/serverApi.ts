/**
 * IAAA · Server-side API helper
 *
 * Centralizes the internal base URL for server-side fetches (Next.js RSC, ISR).
 * Never used client-side — client calls use relative /api/* paths via Nginx.
 *
 * Rule: no Docker service URL hardcoded in page code.
 *
 * INTERNAL_API_BASE_URL must be set in the environment:
 *   - Docker Compose: http://backend:8000  (service name)
 *   - Local dev without Docker: http://localhost:8000
 *   - Production: same as Docker Compose value (internal network)
 *
 * Usage in server components / ISR pages:
 *   const data = await serverFetch(`/api/cards/${slug}`)
 */

const INTERNAL_API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ?? 'http://backend:8000'

export async function serverFetch(
  path:    string,
  options: RequestInit & { next?: NextFetchRequestConfig } = {}
): Promise<Response> {
  const url = `${INTERNAL_API_BASE_URL}${path}`
  return fetch(url, options)
}

// Next.js ISR config type (available in Next 14)
interface NextFetchRequestConfig {
  revalidate?: number | false
  tags?:       string[]
}
