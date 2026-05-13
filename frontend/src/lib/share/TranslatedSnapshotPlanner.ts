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

export type TranslatedSnapshotResult = {
  plan: TranslatedSnapshotPlan
  snapshot?: GeneratedCardSnapshot
}

function translatedSnapshotId(snapshotId: string, targetLanguage: LanguageCode): string | undefined {
  if (!snapshotId) return undefined
  return `${snapshotId}-${targetLanguage}`
}

function cloneSnapshot(snapshot: GeneratedCardSnapshot): GeneratedCardSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GeneratedCardSnapshot
}

function asPayload(payload: unknown): Record<string, any> {
  return payload && typeof payload === 'object' ? payload as Record<string, any> : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function contentKey(targetLanguage: LanguageCode): 'fr' | 'en' {
  return targetLanguage === 'fr' ? 'fr' : 'en'
}

function pickCardText(card: Record<string, any>, targetLanguage: LanguageCode, baseKey: string): string {
  const content = contentKey(targetLanguage)
  if (content === 'fr') return text(card[`${baseKey}_fr`] ?? card[baseKey] ?? card[`${baseKey}_en`])
  return text(card[`${baseKey}_en`] ?? card[`${baseKey}_fr`] ?? card[baseKey])
}

export function createTranslatedSnapshot(params: {
  snapshot: GeneratedCardSnapshot
  target_language: LanguageCode
  provider_preference?: LanguageProviderId[]
}): TranslatedSnapshotResult {
  const plan = planTranslatedSnapshot(params)
  if (plan.status === 'blocked') return { plan }

  const target = cloneSnapshot(params.snapshot)
  const payload = asPayload(target.payload)
  const writing = asPayload(payload.writing)
  const card = asPayload(writing.situation_card)
  const targetId = plan.target_snapshot_id ?? params.snapshot.id
  const targetLanguage = params.target_language

  target.id = targetId
  target.language = targetLanguage
  target.canonical_question = pickCardText(card, targetLanguage, 'submitted_situation') || target.canonical_question
  target.header_subject = pickCardText(card, targetLanguage, 'title') || target.header_subject
  target.situation_soumise = target.canonical_question || target.situation_soumise
  target.card_version = `${params.snapshot.card_version}-snapshot-${targetLanguage}`

  payload.language = targetLanguage
  payload.translation = {
    status: plan.status === 'reuse_source_snapshot' ? 'source_reused' : 'planned_pending_provider',
    source_snapshot_id: params.snapshot.id,
    target_snapshot_id: targetId,
    source_language: plan.source_language,
    target_language: targetLanguage,
    provider_selected: plan.provider_selected,
    rule: plan.translation_rule,
    warnings: plan.warnings,
  }

  if (Object.keys(card).length > 0) {
    if (targetLanguage !== 'fr' && !card.title_en && card.title_fr) card.title_en = card.title_fr
    if (targetLanguage !== 'fr' && !card.submitted_situation_en && card.submitted_situation_fr) card.submitted_situation_en = card.submitted_situation_fr
    if (targetLanguage !== 'fr' && !card.lecture_systeme_en && card.lecture_systeme_fr) card.lecture_systeme_en = card.lecture_systeme_fr
    if (targetLanguage !== 'fr' && !card.approfondir_en && card.approfondir_fr) card.approfondir_en = card.approfondir_fr
  }

  target.payload = payload
  return { plan, snapshot: target }
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
