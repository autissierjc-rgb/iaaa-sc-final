import type { GenerationPrivacyMode } from './generationArchive'

export type UserMaterialKind =
  | 'text'
  | 'url'
  | 'document'
  | 'image'
  | 'spreadsheet'
  | 'dataset'
  | 'audio'
  | 'other'

export type UserMaterialSensitivity =
  | 'unknown'
  | 'public'
  | 'professional'
  | 'personal'
  | 'sensitive'
  | 'regulated'

export type UserMaterialProcessingPurpose =
  | 'interpretation'
  | 'resource_extraction'
  | 'theatre_building'
  | 'writing_context'
  | 'recherche_plus'
  | 'snapshot_provenance'

export type UserMaterialPolicyContract = {
  kind: UserMaterialKind
  sensitivity: UserMaterialSensitivity
  allowed_purposes: UserMaterialProcessingPurpose[]
  extraction_rule:
    | 'extract_minimum_relevant_content'
    | 'extract_public_page_only'
    | 'metadata_only'
    | 'blocked_until_user_confirms_rights'
  storage_rule: GenerationPrivacyMode
  may_be_sent_to_llm: boolean
  may_be_sent_to_search_provider: boolean
  may_be_included_in_public_snapshot: boolean
  public_output_rule:
    | 'summaries_only'
    | 'public_sources_only'
    | 'never_include_raw_content'
    | 'blocked'
  required_user_warning_fr?: string
  required_user_warning_en?: string
  deletion_rule_fr: string
}

export const DEFAULT_USER_MATERIAL_POLICY: UserMaterialPolicyContract = {
  kind: 'document',
  sensitivity: 'unknown',
  allowed_purposes: ['interpretation', 'theatre_building', 'writing_context'],
  extraction_rule: 'extract_minimum_relevant_content',
  storage_rule: 'metadata_only',
  may_be_sent_to_llm: true,
  may_be_sent_to_search_provider: false,
  may_be_included_in_public_snapshot: false,
  public_output_rule: 'summaries_only',
  required_user_warning_fr:
    'Ne partagez que des documents ou donnees que vous avez le droit de transmettre. Les contenus sensibles doivent etre evites ou anonymises.',
  required_user_warning_en:
    'Only share documents or data you are allowed to transmit. Sensitive content should be avoided or anonymized.',
  deletion_rule_fr:
    'Les documents et donnees fournis doivent pouvoir etre exclus du snapshot public et supprimes sur demande lorsqu ils sont rattaches a un compte ou a une session identifiable.',
}

export function buildUserMaterialPolicy(params: {
  kind: UserMaterialKind
  sensitivity?: UserMaterialSensitivity
  public_source?: boolean
  user_confirmed_rights?: boolean
}): UserMaterialPolicyContract {
  const sensitivity = params.sensitivity ?? 'unknown'
  const isPublicSource = Boolean(params.public_source)
  const highSensitivity = sensitivity === 'sensitive' || sensitivity === 'regulated'

  if (!params.user_confirmed_rights && !isPublicSource && params.kind !== 'text') {
    return {
      ...DEFAULT_USER_MATERIAL_POLICY,
      kind: params.kind,
      sensitivity,
      extraction_rule: 'blocked_until_user_confirms_rights',
      may_be_sent_to_llm: false,
      may_be_sent_to_search_provider: false,
      public_output_rule: 'blocked',
    }
  }

  if (isPublicSource || params.kind === 'url') {
    return {
      ...DEFAULT_USER_MATERIAL_POLICY,
      kind: params.kind,
      sensitivity,
      allowed_purposes: ['resource_extraction', 'theatre_building', 'snapshot_provenance'],
      extraction_rule: 'extract_public_page_only',
      may_be_sent_to_search_provider: true,
      may_be_included_in_public_snapshot: true,
      public_output_rule: 'public_sources_only',
    }
  }

  if (highSensitivity) {
    return {
      ...DEFAULT_USER_MATERIAL_POLICY,
      kind: params.kind,
      sensitivity,
      storage_rule: 'do_not_store',
      may_be_sent_to_search_provider: false,
      may_be_included_in_public_snapshot: false,
      public_output_rule: 'never_include_raw_content',
    }
  }

  return {
    ...DEFAULT_USER_MATERIAL_POLICY,
    kind: params.kind,
    sensitivity,
  }
}
