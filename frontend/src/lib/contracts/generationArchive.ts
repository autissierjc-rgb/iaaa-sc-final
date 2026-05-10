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
  language: LanguageCode
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

export type UserReactionLayer =
  | 'interpretation'
  | 'dialogue'
  | 'safety'
  | 'resources'
  | 'expertisesMetiers'
  | 'theatre'
  | 'scoring'
  | 'writing'
  | 'quality'
  | 'archive'
  | 'share'
  | 'UI/mobile'
  | 'admin/cockpit'
  | 'recherchePlus'
  | 'performance'

export type UserReactionKind =
  | 'confusion'
  | 'correction'
  | 'approval'
  | 'frustration'
  | 'surprise_positive'
  | 'request_deeper'
  | 'request_action'
  | 'bug_report'

export type UserReactionEvent = {
  id: string
  created_at: string
  generation_event_id?: string
  session_id?: string
  user_id?: string
  message_hash: string
  message_chars: number
  probable_layers: UserReactionLayer[]
  reaction_kind: UserReactionKind
  intensity: 1 | 2 | 3
  evidence_terms: string[]
  privacy_mode: 'metadata_only' | 'private_learning_snapshot'
}

export type GenerationArchiveDecision = {
  store_event: boolean
  store_snapshot: boolean
  privacy_mode: GenerationPrivacyMode
  reason: string
}
