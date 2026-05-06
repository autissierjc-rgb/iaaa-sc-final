import type { EvidenceLevel, TraceMeta } from './common'

export type BlindSpotLevel = 'declarative' | 'documentary' | 'structural'

export type BlindSpotInquiry = {
  blind_spot: string
  level: BlindSpotLevel
  evidence_level: EvidenceLevel
  why_it_matters: string
  where_to_look: string[]
  who_can_confirm: string[]
  observable_signal: string
  decisive_evidence: string
  counter_hypothesis: string
}

export type InquiryContract = {
  blind_spots: BlindSpotInquiry[]
  should_offer_inquiry: boolean
  inquiry_button_label_fr: string
  inquiry_button_label_en: string
  trace: TraceMeta
}
