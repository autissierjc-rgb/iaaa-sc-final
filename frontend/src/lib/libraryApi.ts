/**
 * IAAA · Bloc 8 · Library API client
 *
 * GET /api/library — public cards, newest first, cursor pagination.
 * Client-side call — relative URL via Nginx, no credentials needed.
 *
 * view_count is NOT incremented by this call.
 * It increments on /sc/[slug] only.
 */

export interface LibraryCardPreview {
  slug:               string
  title:              string
  main_vulnerability: string
  view_count:         number
  created_at:         string
}

export interface LibraryResponse {
  cards:       LibraryCardPreview[]
  next_cursor: string | null
}

export async function getLibrary(cursor?: string): Promise<LibraryResponse> {
  const url = cursor ? `/api/library?cursor=${encodeURIComponent(cursor)}` : '/api/library'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Library fetch failed (${res.status})`)
  return res.json() as Promise<LibraryResponse>
}
