/**
 * IAAA · Bloc 5 · Star Map explore API client
 *
 * Calls POST /api/explore — FastAPI placeholder endpoint.
 * Same pattern as lib/generateApi.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Always use /api/explore (relative URL).
 * Never use http://localhost:8000. Nginx proxies /api/* in all environments.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Bloc 6+ contract:
 *   This file stays unchanged. Only the backend handler body changes.
 *   Response shape (StarMapExploration) is frozen.
 */

import type { StarMapDimension } from '@/types/index'
import type { SituationCard }    from '@/types/index'
import type { StarMapExploration } from '@/types/index'

export interface ExploreRequest {
  dimension: StarMapDimension
  card:      SituationCard
}

export async function exploreStarMapBranch(
  req: ExploreRequest
): Promise<StarMapExploration> {
  const res = await fetch('/api/explore', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(req),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unknown error')
    throw new Error(`Explore failed (${res.status}): ${detail}`)
  }

  const data: StarMapExploration = await res.json()

  if (!data.dimension || !data.questions || !data.insight) {
    throw new Error('Invalid response shape from /api/explore')
  }

  return data
}
