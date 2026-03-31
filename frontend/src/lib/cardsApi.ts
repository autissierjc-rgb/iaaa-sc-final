/**
 * IAAA · Bloc 6B · Cards API client
 *
 * Thin wrappers around /api/cards.
 * credentials: 'include' required for httpOnly cookie auth.
 *
 * Save behavior:
 *   - reframe NOT sent — not persisted per architecture decision
 *   - card must match frozen SituationCard contract
 *   - is_public defaults to false (overridden by tier at backend)
 */

import type { SituationCard } from '@/types/index'

export interface SavedCard {
  id:         string
  slug:       string
  title:      string
  content:    SituationCard
  is_public:  boolean
  view_count: number
  created_at: string
}

export interface CardListResponse {
  cards: SavedCard[]
  total: number
}

async function apiCall<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function saveCard(
  card:           SituationCard,
  isPublic:       boolean = false,
  situationInput: string | null = null,
  intentionRaw:   string | null = null
): Promise<SavedCard> {
  // reframe intentionally not included — not persisted per architecture decision
  // situation_input = original user question — persisted for Atlas display
  return apiCall<SavedCard>('/api/cards', {
    method: 'POST',
    body:   JSON.stringify({
      card,
      is_public:       isPublic,
      situation_input: situationInput || null,
      intention_raw:   intentionRaw || null,
    }),
  })
}

export async function listMyCards(): Promise<CardListResponse> {
  return apiCall<CardListResponse>('/api/cards', { method: 'GET' })
}

export async function getCardBySlug(slug: string): Promise<SavedCard> {
  return apiCall<SavedCard>(`/api/cards/${slug}`, { method: 'GET' })
}

export async function setCardVisibility(
  slug:     string,
  isPublic: boolean
): Promise<SavedCard> {
  return apiCall<SavedCard>(`/api/cards/${slug}/visibility`, {
    method: 'PATCH',
    body:   JSON.stringify({ is_public: isPublic }),
  })
}
