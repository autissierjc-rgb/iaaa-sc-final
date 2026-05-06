export type LanguageCode = 'fr' | 'en'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type ServiceStatus = 'ok' | 'partial' | 'blocked' | 'error'

export type TraceMeta = {
  service: string
  version: string
  duration_ms?: number
  model?: string
  confidence?: number
  status?: ServiceStatus
  notes?: string[]
}

export type EvidenceLevel = 'established' | 'plausible' | 'uncertain' | 'missing'

export type LocalizedText = {
  fr: string
  en?: string
}
