import type { ResourceItem } from '../resources/resourceContract'

export type ResearchTopicType =
  | 'actualite'
  | 'marche'
  | 'geopolitique'
  | 'societal'
  | 'interne'
  | 'general'

export type ResearchStatus = 'ok' | 'empty' | 'timeout' | 'error' | 'skipped'

export type ResearchInput = {
  situation: string
  topic_type?: ResearchTopicType
  max_sources?: number
}

export type ResearchFastResult = {
  facts_snapshot: string
  internal_sources: ResourceItem[]
  research_status: ResearchStatus
  topic_type: ResearchTopicType
}

export type ResearchDeepResult = {
  facts_deep: string
  analysis_notes: string
  sources: ResourceItem[]
  research_status: ResearchStatus
  topic_type: ResearchTopicType
}

export function detectResearchTopic(situation: string): ResearchTopicType {
  const text = situation.toLowerCase()
  if (/\b(marche|marché|bourse|prix|taux|inflation|crypto|stock|nasdaq|cac|sp500)\b/.test(text)) {
    return 'marche'
  }
  if (/\b(iran|israel|gaza|ukraine|russie|chine|otan|guerre|bombard|cessez-le-feu|sanction|militaire)\b/.test(text)) {
    return 'geopolitique'
  }
  if (/\b(election|élection|societe|société|manifestation|opinion|immigration|ecole|sante|santé)\b/.test(text)) {
    return 'societal'
  }
  if (/\b(aujourd'hui|hier|demain|actuel|actualité|news|latest|current|202\d)\b/.test(text)) {
    return 'actualite'
  }
  if (/\b(equipe|équipe|client|projet|manager|organisation|entreprise|board|comex)\b/.test(text)) {
    return 'interne'
  }
  return 'general'
}
