import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import {
  DEFAULT_LANGUAGE_SERVICE_CONTRACT,
  type LanguageProviderId,
  type LanguageServiceContract,
} from '@/lib/contracts/language'

export type LanguageSnapshotPlanStatus = 'ready' | 'same_language' | 'blocked'

export type LanguageSnapshotPlan = {
  status: LanguageSnapshotPlanStatus
  contract: LanguageServiceContract
  source_language: LanguageCode
  target_language: LanguageCode
  provider_selected: LanguageProviderId
  missing: string[]
  warnings: string[]
  snapshot_rule: 'create_translated_snapshot' | 'reuse_source_snapshot'
}

type SnapshotPayloadProbe = {
  language?: LanguageCode
  writing?: {
    situation_card?: unknown
    lecture?: unknown
    approfondir?: unknown
  }
  resources?: {
    public_sources?: unknown[]
    resources?: unknown[]
  }
  safety?: {
    disclaimer_fr?: string
  }
}

const LANGUAGE_PROVIDER_PRIORITY: LanguageProviderId[] = [
  'gemma',
  'kimi',
  'nvidia_nim',
  'reference_llm',
  'local_model',
]

function asPayloadProbe(payload: unknown): SnapshotPayloadProbe {
  if (!payload || typeof payload !== 'object') return {}
  return payload as SnapshotPayloadProbe
}

function chooseProvider(preferred?: LanguageProviderId[]): LanguageProviderId {
  const candidates = preferred?.length ? preferred : LANGUAGE_PROVIDER_PRIORITY
  return candidates[0] ?? 'reference_llm'
}

export function planLanguageSnapshot(params: {
  snapshot: GeneratedCardSnapshot
  source_language?: LanguageCode
  target_language: LanguageCode
  provider_preference?: LanguageProviderId[]
}): LanguageSnapshotPlan {
  const payload = asPayloadProbe(params.snapshot.payload)
  const sourceLanguage =
    params.source_language ?? payload.language ?? DEFAULT_LANGUAGE_SERVICE_CONTRACT.snapshot_language
  const missing: string[] = []
  const warnings: string[] = []

  if (!params.snapshot.id) missing.push('source_snapshot_id')
  if (!params.snapshot.header_subject) missing.push('header_subject')
  if (!params.snapshot.situation_soumise) missing.push('situation_soumise')
  if (!payload.writing?.situation_card) missing.push('situation_card')
  if (!payload.writing?.lecture) missing.push('lecture')
  if (!payload.writing?.approfondir) warnings.push('approfondir_missing')

  const sourceCount =
    params.snapshot.source_count ??
    payload.resources?.public_sources?.length ??
    payload.resources?.resources?.length ??
    0
  if (sourceCount === 0) warnings.push('public_sources_missing_or_partial')

  const sameLanguage = sourceLanguage === params.target_language
  const providerSelected = chooseProvider(params.provider_preference)
  const status: LanguageSnapshotPlanStatus =
    missing.length > 0 ? 'blocked' : sameLanguage ? 'same_language' : 'ready'

  return {
    status,
    contract: {
      ...DEFAULT_LANGUAGE_SERVICE_CONTRACT,
      input_language: sourceLanguage,
      output_language: params.target_language,
      snapshot_language: params.target_language,
      mode: sameLanguage ? 'source' : 'translated_snapshot',
      provider_preference: params.provider_preference?.length
        ? params.provider_preference
        : DEFAULT_LANGUAGE_SERVICE_CONTRACT.provider_preference,
      provider_selected: providerSelected,
      status: status === 'blocked' ? 'blocked' : warnings.length ? 'partial' : 'ok',
    },
    source_language: sourceLanguage,
    target_language: params.target_language,
    provider_selected: providerSelected,
    missing,
    warnings,
    snapshot_rule: sameLanguage ? 'reuse_source_snapshot' : 'create_translated_snapshot',
  }
}
