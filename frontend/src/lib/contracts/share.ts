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
