import type { TraceMeta } from './common'

export type AbuseRiskLevel = 'normal' | 'watch' | 'throttle' | 'block'

export type SecurityAbuseSignal =
  | 'rate_limit'
  | 'quota'
  | 'input_size'
  | 'file_size'
  | 'mime_type'
  | 'prompt_injection'
  | 'xss_payload'
  | 'scraping'
  | 'cost_spike'
  | 'provider_error_spike'
  | 'suspicious_share'

export type SecurityAbuseGuardContract = {
  risk_level: AbuseRiskLevel
  signals: SecurityAbuseSignal[]
  allowed_actions: string[]
  blocked_actions: string[]
  required_controls: string[]
  cto_watch_required: boolean
  trace: TraceMeta
}
