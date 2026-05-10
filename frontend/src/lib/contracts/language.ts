import type { LanguageCode, ServiceStatus } from './common'

export type LanguageProviderId =
  | 'reference_llm'
  | 'gemma'
  | 'kimi'
  | 'nvidia_nim'
  | 'local_model'
  | 'other'

export type LanguageSnapshotMode = 'source' | 'translated_snapshot'

export type LanguageServiceContract = {
  input_language: LanguageCode | 'unknown'
  output_language: LanguageCode
  snapshot_language: LanguageCode
  mode: LanguageSnapshotMode
  provider_preference: LanguageProviderId[]
  provider_selected?: LanguageProviderId
  must_preserve_terms: string[]
  translated_fields: Array<
    | 'header_domain'
    | 'header_subject'
    | 'situation_soumise'
    | 'situation_card'
    | 'lecture'
    | 'approfondir'
    | 'resources'
    | 'pdf'
  >
  quality_checks: {
    no_mixed_language: boolean
    preserves_meaning: boolean
    preserves_provenance: boolean
    preserves_safety_notices: boolean
  }
  status: ServiceStatus
  reason_fr: string
}

export const DEFAULT_LANGUAGE_SERVICE_CONTRACT: LanguageServiceContract = {
  input_language: 'unknown',
  output_language: 'fr',
  snapshot_language: 'fr',
  mode: 'source',
  provider_preference: ['reference_llm', 'gemma', 'kimi', 'nvidia_nim', 'local_model'],
  must_preserve_terms: ['Situation Card', 'IAAA+', 'Astrolabe', 'Recherche+'],
  translated_fields: [
    'header_domain',
    'header_subject',
    'situation_soumise',
    'situation_card',
    'lecture',
    'approfondir',
    'resources',
    'pdf',
  ],
  quality_checks: {
    no_mixed_language: true,
    preserves_meaning: true,
    preserves_provenance: true,
    preserves_safety_notices: true,
  },
  status: 'ok',
  reason_fr:
    'La langue est un contrat de snapshot. Gemma, Kimi, NVIDIA NIM ou un autre modele peuvent traduire, mais aucune couche ne doit melanger les langues ou changer le sens.',
}
