import type { TraceMeta } from './common'

export type DomainRiskLevel = 'normal' | 'regulated' | 'high_stakes' | 'blocked'

export type AdviceMode =
  | 'analysis_only'
  | 'professional_referral'
  | 'emergency_referral'
  | 'refuse'

export type SensitiveDomain =
  | 'medical'
  | 'legal'
  | 'financial'
  | 'insurance'
  | 'employment'
  | 'education_access'
  | 'housing'
  | 'public_benefits'
  | 'fundamental_rights'
  | 'minors'
  | 'safety_violence'
  | 'none'

export type RiskAdviceGuardContract = {
  domain_risk: DomainRiskLevel
  sensitive_domains: SensitiveDomain[]
  advice_mode: AdviceMode
  allowed_outputs: string[]
  forbidden_outputs: string[]
  required_disclaimer_fr?: string
  required_disclaimer_en?: string
  human_review_required: boolean
  emergency: boolean
  trace: TraceMeta
}
