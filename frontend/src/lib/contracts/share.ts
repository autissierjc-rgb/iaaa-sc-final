import type { LanguageCode } from './common'

export type ShareVisibility = 'private' | 'restricted' | 'public' | 'anonymized_public'

export type ShareChannel =
  | 'copy_link'
  | 'email'
  | 'linkedin'
  | 'x'
  | 'whatsapp'
  | 'facebook'
  | 'other'

export type SharePolicyContract = {
  visibility: ShareVisibility
  is_shareable: boolean
  requires_snapshot: boolean
  requires_anonymization: boolean
  allowed_channels: ShareChannel[]
  reason: string
}

export type ShareMetadataContract = {
  slug?: string
  canonical_url?: string
  title: string
  description: string
  og_image_url?: string
  language: LanguageCode
}

export type SharedSituationCardContract = {
  snapshot_id: string
  policy: SharePolicyContract
  metadata: ShareMetadataContract
  view_count?: number
  created_at: string
}

export type BuzzReadinessLevel = 'not_ready' | 'watch' | 'ready'

export type BuzzReadinessContract = {
  level: BuzzReadinessLevel
  read_path_rule: 'snapshot_only'
  generate_path_rule: 'quota_required'
  inquiry_path_rule: 'async_or_paid'
  cache_policy: {
    public_snapshot_cache: boolean
    s_maxage_seconds: number
    stale_while_revalidate_seconds: number
  }
  critical_thresholds: {
    max_public_fast_p95_ms: number
    max_generation_error_rate: number
    max_missing_required_sources_rate: number
    max_hourly_estimated_cost_eur: number
  }
  required_guards: string[]
  watch_metrics: string[]
  reason_fr: string
}

export const DEFAULT_BUZZ_READINESS: BuzzReadinessContract = {
  level: 'watch',
  read_path_rule: 'snapshot_only',
  generate_path_rule: 'quota_required',
  inquiry_path_rule: 'async_or_paid',
  cache_policy: {
    public_snapshot_cache: true,
    s_maxage_seconds: 86400,
    stale_while_revalidate_seconds: 604800,
  },
  critical_thresholds: {
    max_public_fast_p95_ms: 6500,
    max_generation_error_rate: 0.03,
    max_missing_required_sources_rate: 0.05,
    max_hourly_estimated_cost_eur: 100,
  },
  required_guards: [
    'Shared cards must be immutable snapshots.',
    'Public reads must not call LLM or Tavily.',
    'Generation must be rate-limited by IP/account.',
    'Recherche+ must be separate, async, paid or quota-limited.',
    'CTO Watch must alert on cost, latency, source and provider thresholds.',
  ],
  watch_metrics: [
    'public_fast_p95_ms',
    'generation_error_rate',
    'missing_required_sources_rate',
    'fallback_rate',
    'provider_error_rate',
    'estimated_hourly_cost',
    'shared_card_cache_hit_rate',
  ],
  reason_fr:
    'Lire doit frapper le CDN, generer doit etre limite, enqueter doit etre separe. Le buzz ne doit jamais relancer le moteur IA sur chaque consultation.',
}
