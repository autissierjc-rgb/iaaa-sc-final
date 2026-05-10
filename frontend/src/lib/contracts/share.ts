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

export type PdfExportContract = {
  export_id: string
  source_snapshot_id: string
  language: LanguageCode
  format: 'pdf'
  layout: 'situation_card' | 'lecture' | 'approfondir' | 'complete'
  generation_rule: 'from_snapshot_only'
  authority_status: 'analytical_note_not_official_report'
  distribution: 'private' | 'restricted' | 'public'
  includes: {
    situation_card: boolean
    lecture: boolean
    approfondir: boolean
    public_sources: boolean
    caveats: boolean
    generated_at: boolean
    provenance: boolean
    non_authority_notice: boolean
    evidence_level: boolean
  }
  cache_policy: {
    immutable: boolean
    public_cache: boolean
  }
  prohibited_claims: string[]
  safety_rule_fr: string
}

export const DEFAULT_PDF_EXPORT_CONTRACT: Omit<
  PdfExportContract,
  'export_id' | 'source_snapshot_id' | 'language'
> = {
  format: 'pdf',
  layout: 'complete',
  generation_rule: 'from_snapshot_only',
  authority_status: 'analytical_note_not_official_report',
  distribution: 'restricted',
  includes: {
    situation_card: true,
    lecture: true,
    approfondir: true,
    public_sources: true,
    caveats: true,
    generated_at: true,
    provenance: true,
    non_authority_notice: true,
    evidence_level: true,
  },
  cache_policy: {
    immutable: true,
    public_cache: true,
  },
  prohibited_claims: [
    'official_report',
    'legal_opinion',
    'medical_advice',
    'financial_advice',
    'administrative_decision',
    'verified_evidence',
  ],
  safety_rule_fr:
    'Le PDF exporte une note analytique issue d un snapshot valide. Il ne regenere jamais la carte, ne relance pas le LLM, conserve la langue choisie et ne doit jamais etre presente comme rapport officiel, avis professionnel ou preuve etablie.',
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
