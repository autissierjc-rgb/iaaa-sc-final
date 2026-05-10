import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { ShareSurface } from '@/lib/contracts/share'
import { DEFAULT_BUZZ_READINESS } from '@/lib/contracts/share'

export type SharedSnapshotResolveStatus =
  | 'ready'
  | 'planned'
  | 'language_mismatch'
  | 'missing_snapshot'

export type SharedSnapshotResolvePlan = {
  status: SharedSnapshotResolveStatus
  read_rule: 'snapshot_only_no_generation'
  snapshot_id: string
  route_language: LanguageCode
  snapshot_language?: LanguageCode
  surface: ShareSurface
  localized_path: string
  data_endpoint: string
  source_snapshot_present: boolean
  cache_policy: typeof DEFAULT_BUZZ_READINESS.cache_policy
  allowed_runtime_calls: Array<'snapshot_store' | 'cdn_cache'>
  prohibited_runtime_calls: Array<'llm' | 'tavily' | 'generation' | 'translation'>
  missing: string[]
  warnings: string[]
}

function normalizedSnapshotId(slug: string): string {
  return slug.trim().replace(/^\/+/, '').replace(/\/+$/, '')
}

export function resolveSharedSnapshot(params: {
  slug: string
  route_language: LanguageCode
  surface?: ShareSurface
  snapshot?: GeneratedCardSnapshot
}): SharedSnapshotResolvePlan {
  const snapshotId = normalizedSnapshotId(params.slug)
  const surface = params.surface ?? 'situation_card'
  const missing: string[] = []
  const warnings: string[] = []

  if (!snapshotId) missing.push('snapshot_id')
  if (!params.snapshot) {
    warnings.push('snapshot_store_lookup_required')
  }
  if (params.snapshot && params.snapshot.language !== params.route_language) {
    warnings.push('snapshot_language_differs_from_route_language')
  }

  const status: SharedSnapshotResolveStatus =
    missing.length > 0
      ? 'missing_snapshot'
      : params.snapshot && params.snapshot.language !== params.route_language
        ? 'language_mismatch'
        : params.snapshot
          ? 'ready'
          : 'planned'

  return {
    status,
    read_rule: 'snapshot_only_no_generation',
    snapshot_id: snapshotId,
    route_language: params.route_language,
    snapshot_language: params.snapshot?.language,
    surface,
    localized_path: `/${params.route_language}/sc/${snapshotId}`,
    data_endpoint: `/api/sc-data/${snapshotId}`,
    source_snapshot_present: Boolean(params.snapshot),
    cache_policy: DEFAULT_BUZZ_READINESS.cache_policy,
    allowed_runtime_calls: ['snapshot_store', 'cdn_cache'],
    prohibited_runtime_calls: ['llm', 'tavily', 'generation', 'translation'],
    missing,
    warnings,
  }
}
