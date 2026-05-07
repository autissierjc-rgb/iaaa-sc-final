import type { LanguageCode, ServiceStatus, TraceMeta } from './common'

export type GenerationPrivacyMode =
  | 'metadata_only'
  | 'snapshot_allowed'
  | 'snapshot_private'
  | 'private_learning_snapshot'
  | 'do_not_store'

export type GenerationSurface =
  | 'situation_card'
  | 'lecture'
  | 'approfondir'
  | 'resources'
  | 'inquiry'

export type GenerationEvent = {
  id: string
  created_at: string
  session_id?: string
  user_id?: string
  language: LanguageCode
  surface: GenerationSurface
  privacy_mode: GenerationPrivacyMode
  raw_input_hash?: string
  input_chars: number
  interpretation_id?: string
  domain?: string
  tension_family?: string
  intent?: string
  gate_status?: 'READY_TO_GENERATE' | 'OPTIONAL_REFINEMENT' | 'BLOCKING_CLARIFICATION'
  resources_status?: ServiceStatus
  resources_count?: number
  quality_status?: ServiceStatus
  generation_status: ServiceStatus
  latency_ms: number
  error_kind?: string
  trace?: TraceMeta[]
}

export type GeneratedCardSnapshot = {
  id: string
  generation_event_id: string
  created_at: string
  privacy_mode: Exclude<GenerationPrivacyMode, 'metadata_only' | 'do_not_store'>
  admin_learning_only: boolean
  user_deletable: boolean
  card_version: string
  canonical_question: string
  header_domain: string
  header_subject: string
  situation_soumise: string
  payload: unknown
  source_count: number
  expires_at?: string
}

export type GenerationArchiveDecision = {
  store_event: boolean
  store_snapshot: boolean
  privacy_mode: GenerationPrivacyMode
  reason: string
}
