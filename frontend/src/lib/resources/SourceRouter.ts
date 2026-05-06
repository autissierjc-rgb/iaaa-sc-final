import type { SituationDomainV2, SourceChannel } from '../contracts'

export type SourceRoute = {
  domain: SituationDomainV2
  channels: SourceChannel[]
  suggested_queries: string[]
  notes: string[]
}

const DOMAIN_CHANNELS: Record<SituationDomainV2, SourceChannel[]> = {
  academic_research: ['research', 'official'],
  business_strategy: ['company', 'market', 'news_agency'],
  climate_energy: ['official', 'research', 'news_agency', 'local_media'],
  community_association: ['official', 'local_media', 'social_public'],
  couple: ['other'],
  culture_media: ['news_agency', 'local_media', 'social_public'],
  cybersecurity: ['technical', 'official', 'news_agency'],
  education: ['official', 'research', 'local_media'],
  family: ['other'],
  finance_macro: ['news_agency', 'official', 'market'],
  general: ['news_agency', 'official', 'other'],
  geopolitics: ['news_agency', 'local_media', 'official', 'research'],
  health_body: ['health_authority', 'research', 'official'],
  humanitarian: ['official', 'local_media', 'news_agency'],
  institutional_crisis: ['official', 'news_agency', 'local_media', 'legal'],
  law_justice: ['legal', 'official', 'news_agency'],
  management: ['company', 'market', 'other'],
  ngo_field: ['official', 'local_media', 'news_agency'],
  product_platform: ['company', 'technical', 'market', 'social_public'],
  professional: ['company', 'market', 'other'],
  public_governance: ['official', 'local_media', 'legal'],
  religion_spirituality: ['local_media', 'research', 'official'],
  school_adolescence: ['official', 'research', 'local_media'],
  science_research: ['research', 'official', 'news_agency'],
  sport_performance: ['official', 'local_media', 'social_public'],
  startup_market: ['company', 'market', 'technical', 'social_public'],
  supply_chain: ['market', 'news_agency', 'company'],
  technology_ai: ['technical', 'research', 'company', 'news_agency'],
  territory_urbanism: ['official', 'local_media', 'legal'],
  war_security: ['news_agency', 'local_media', 'official', 'research'],
}

export function routeSourcesForDomain(domain: SituationDomainV2, objectOfAnalysis: string): SourceRoute {
  const subject = objectOfAnalysis.trim()
  const channels = DOMAIN_CHANNELS[domain] ?? DOMAIN_CHANNELS.general
  const suggestedQueries = subject
    ? channels.map((channel) => `${subject} ${channel.replace('_', ' ')}`)
    : []

  return {
    domain,
    channels,
    suggested_queries: suggestedQueries,
    notes: [
      'Route sources by domain before broad web search.',
      'Use deep or social channels only when domain or user request justifies it.',
    ],
  }
}
