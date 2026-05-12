import type { GenerationPrivacyMode } from './generationArchive'

export type UserMaterialKind =
  | 'text'
  | 'url'
  | 'document'
  | 'image'
  | 'spreadsheet'
  | 'dataset'
  | 'audio'
  | 'private_plug'
  | 'other'

export type UserMaterialSourceType =
  | 'manual_text'
  | 'url'
  | 'file_upload'
  | 'private_plug'

export type PrivatePlugConnectorType =
  | 'private_url'
  | 'drive'
  | 'sharepoint'
  | 'notion'
  | 'api'
  | 'local_agent'
  | 'enterprise_server'

export type PrivatePlugAccessMode =
  | 'read_metadata'
  | 'read_excerpt'
  | 'read_full'
  | 'query_only'

export type UserMaterialExtractionLocation =
  | 'sc_server'
  | 'user_server'
  | 'local_device'
  | 'enterprise_connector'

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

export type UserMaterialRetentionChoice =
  | 'discard_after_processing'
  | 'keep_private'
  | 'keep_with_private_card'

export type UserMaterialPolicyContract = {
  kind: UserMaterialKind
  source_type: UserMaterialSourceType
  sensitivity: UserMaterialSensitivity
  allowed_purposes: UserMaterialProcessingPurpose[]
  retention_choice: UserMaterialRetentionChoice
  extraction_rule:
    | 'extract_minimum_relevant_content'
    | 'extract_public_page_only'
    | 'metadata_only'
    | 'blocked_until_user_confirms_rights'
  storage_rule: GenerationPrivacyMode
  may_be_sent_to_llm: boolean
  may_be_sent_to_search_provider: boolean
  may_be_included_in_public_snapshot: boolean
  exploitable_by_iaaa: false
  requires_separate_reuse_consent: boolean
  public_output_rule:
    | 'summaries_only'
    | 'public_sources_only'
    | 'never_include_raw_content'
    | 'blocked'
  required_user_warning_fr?: string
  required_user_warning_en?: string
  deletion_rule_fr: string
  non_exploitation_rule_fr: string
  non_exploitation_rule_en: string
}

export type PrivatePlugContract = {
  connector_type: PrivatePlugConnectorType
  access_mode: PrivatePlugAccessMode
  extraction_location: UserMaterialExtractionLocation
  retention_choice: UserMaterialRetentionChoice
  raw_document_leaves_user_environment: boolean
  allowed_payload:
    | 'metadata_only'
    | 'authorized_excerpts'
    | 'structured_summary'
    | 'query_result'
  requires_enterprise_security_review: boolean
  user_promise_fr: string
  user_promise_en: string
}

export const DEFAULT_USER_MATERIAL_POLICY: UserMaterialPolicyContract = {
  kind: 'document',
  source_type: 'file_upload',
  sensitivity: 'unknown',
  allowed_purposes: ['interpretation', 'theatre_building', 'writing_context'],
  retention_choice: 'discard_after_processing',
  extraction_rule: 'extract_minimum_relevant_content',
  storage_rule: 'metadata_only',
  may_be_sent_to_llm: true,
  may_be_sent_to_search_provider: false,
  may_be_included_in_public_snapshot: false,
  exploitable_by_iaaa: false,
  requires_separate_reuse_consent: true,
  public_output_rule: 'summaries_only',
  required_user_warning_fr:
    'Ne partagez que des documents ou donnees que vous avez le droit de transmettre. Les contenus sensibles doivent etre evites ou anonymises.',
  required_user_warning_en:
    'Only share documents or data you are allowed to transmit. Sensitive content should be avoided or anonymized.',
  deletion_rule_fr:
    'Les documents et donnees fournis doivent pouvoir etre exclus du snapshot public et supprimes sur demande lorsqu ils sont rattaches a un compte ou a une session identifiable.',
  non_exploitation_rule_fr:
    'Les documents prives conserves par l utilisateur ne sont pas exploitables par IAAA+ pour entrainer, enrichir, benchmarker, vendre, profiler ou ameliorer le service sans consentement separe, explicite et revocable.',
  non_exploitation_rule_en:
    'Private documents kept by the user are not exploitable by IAAA+ to train, enrich, benchmark, sell, profile or improve the service without separate, explicit and revocable consent.',
}

export const DEFAULT_PRIVATE_PLUG_CONTRACT: PrivatePlugContract = {
  connector_type: 'enterprise_server',
  access_mode: 'query_only',
  extraction_location: 'user_server',
  retention_choice: 'discard_after_processing',
  raw_document_leaves_user_environment: false,
  allowed_payload: 'structured_summary',
  requires_enterprise_security_review: true,
  user_promise_fr:
    'Les documents peuvent rester dans votre environnement. Situation Card ne recoit que les extraits, metadonnees ou resultats autorises.',
  user_promise_en:
    'Documents can remain in your environment. Situation Card only receives authorized excerpts, metadata, or query results.',
}

function sourceTypeFor(kind: UserMaterialKind): UserMaterialSourceType {
  if (kind === 'url') return 'url'
  if (kind === 'private_plug') return 'private_plug'
  if (kind === 'text') return 'manual_text'
  return 'file_upload'
}

export function buildUserMaterialPolicy(params: {
  kind: UserMaterialKind
  sensitivity?: UserMaterialSensitivity
  public_source?: boolean
  user_confirmed_rights?: boolean
  retention_choice?: UserMaterialRetentionChoice
}): UserMaterialPolicyContract {
  const sensitivity = params.sensitivity ?? 'unknown'
  const isPublicSource = Boolean(params.public_source)
  const highSensitivity = sensitivity === 'sensitive' || sensitivity === 'regulated'

  if (!params.user_confirmed_rights && !isPublicSource && params.kind !== 'text') {
    return {
      ...DEFAULT_USER_MATERIAL_POLICY,
      kind: params.kind,
      source_type: sourceTypeFor(params.kind),
      sensitivity,
      retention_choice: params.retention_choice ?? 'discard_after_processing',
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
      source_type: sourceTypeFor(params.kind),
      sensitivity,
      retention_choice: params.retention_choice ?? 'discard_after_processing',
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
      source_type: sourceTypeFor(params.kind),
      sensitivity,
      retention_choice: params.retention_choice ?? 'discard_after_processing',
      storage_rule: 'do_not_store',
      may_be_sent_to_search_provider: false,
      may_be_included_in_public_snapshot: false,
      public_output_rule: 'never_include_raw_content',
    }
  }

  return {
    ...DEFAULT_USER_MATERIAL_POLICY,
    kind: params.kind,
    source_type: sourceTypeFor(params.kind),
    sensitivity,
    retention_choice: params.retention_choice ?? 'discard_after_processing',
  }
}
