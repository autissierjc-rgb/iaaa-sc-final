import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { LanguageProviderId } from '@/lib/contracts/language'
import { planLanguageSnapshot, type LanguageSnapshotPlan } from './LanguageSnapshotPlanner'

export type TranslatedSnapshotPlanStatus = 'ready_to_create' | 'reuse_source_snapshot' | 'blocked'

export type TranslatedSnapshotPlan = {
  status: TranslatedSnapshotPlanStatus
  source_snapshot_id: string
  target_snapshot_id?: string
  source_language: LanguageCode
  target_language: LanguageCode
  language_plan: LanguageSnapshotPlan
  provider_selected: LanguageProviderId
  translation_rule: 'no_translation_needed' | 'create_snapshot_before_share'
  translation_scope: Array<
    | 'canonical_question'
    | 'header_domain'
    | 'header_subject'
    | 'situation_soumise'
    | 'payload_writing'
    | 'payload_resources_summaries'
    | 'payload_caveats'
  >
  preserves: string[]
  warnings: string[]
  blockers: string[]
}

function translatedSnapshotId(snapshotId: string, targetLanguage: LanguageCode): string | undefined {
  if (!snapshotId) return undefined
  return `${snapshotId}-${targetLanguage}`
}

export function planTranslatedSnapshot(params: {
  snapshot: GeneratedCardSnapshot
  target_language: LanguageCode
  provider_preference?: LanguageProviderId[]
}): TranslatedSnapshotPlan {
  const languagePlan = planLanguageSnapshot({
    snapshot: params.snapshot,
    target_language: params.target_language,
    provider_preference: params.provider_preference,
  })
  const blockers: string[] = []
  const warnings = [...languagePlan.warnings]

  if (languagePlan.status === 'blocked') {
    blockers.push(...languagePlan.missing)
  }

  const sameLanguage = languagePlan.status === 'same_language'
  const status: TranslatedSnapshotPlanStatus =
    blockers.length > 0 ? 'blocked' : sameLanguage ? 'reuse_source_snapshot' : 'ready_to_create'

  return {
    status,
    source_snapshot_id: params.snapshot.id,
    target_snapshot_id: sameLanguage
      ? params.snapshot.id
      : translatedSnapshotId(params.snapshot.id, params.target_language),
    source_language: languagePlan.source_language,
    target_language: params.target_language,
    language_plan: languagePlan,
    provider_selected: languagePlan.provider_selected,
    translation_rule: sameLanguage ? 'no_translation_needed' : 'create_snapshot_before_share',
    translation_scope: [
      'canonical_question',
      'header_domain',
      'header_subject',
      'situation_soumise',
      'payload_writing',
      'payload_resources_summaries',
      'payload_caveats',
    ],
    preserves: [
      'source_snapshot_id',
      'generation_event_id',
      'score',
      'state_label',
      'public_sources_urls',
      'evidence_level',
      'non_authority_notice',
      'privacy_mode',
      'share_visibility',
      'product_terms',
    ],
    warnings,
    blockers,
  }
}
