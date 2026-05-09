import type { TraceMeta } from './common'
import type { SituationDomainV2 } from './interpretation'

export type SourceChannel =
  | 'official'
  | 'news_agency'
  | 'local_media'
  | 'research'
  | 'legal'
  | 'social_public'
  | 'company'
  | 'market'
  | 'health_authority'
  | 'technical'
  | 'other'

export type ResourceStatus = 'not_needed' | 'available' | 'partial' | 'failed' | 'timeout'

export type FunctionalResourceFamily =
  | 'legitimation'
  | 'protection_conflict'
  | 'production_reproduction'

export type FunctionalResourceNeed = {
  family: FunctionalResourceFamily
  label_fr: string
  question_fr: string
  channels: SourceChannel[]
  suggested_queries: string[]
  expected_evidence_fr: string[]
  priority: 'low' | 'medium' | 'high'
}

export type ResourceContract = {
  id: string
  title: string
  url: string
  source: string
  channel: SourceChannel
  domain_relevance: SituationDomainV2[]
  excerpt?: string
  published_at?: string
  retrieved_at: string
  reliability?: 'primary' | 'secondary' | 'signal' | 'unknown'
}

export type ResourceServiceContract = {
  status: ResourceStatus
  functional_needs: FunctionalResourceNeed[]
  requested_urls: string[]
  extracted_urls: string[]
  fallback_searches: string[]
  resources: ResourceContract[]
  public_sources: ResourceContract[]
  internal_notes: string[]
  trace: TraceMeta
}
