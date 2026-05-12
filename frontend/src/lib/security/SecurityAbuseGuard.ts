import type {
  AbuseRiskLevel,
  SecurityAbuseGuardContract,
  SecurityAbuseSignal,
} from '../contracts'

export type SecurityAbuseGuardInput = {
  input_chars?: number
  file_bytes?: number
  mime_type?: string
  request_count_1m?: number
  estimated_cost_cents?: number
  text_sample?: string
  is_public_share?: boolean
}

const PROMPT_INJECTION_PATTERN = /\b(ignore|bypass|override|reveal|exfiltrate|system prompt|developer message|jailbreak)\b/i
const XSS_PATTERN = /<script|javascript:|onerror=|onload=/i
const MAX_INPUT_CHARS = 12000
const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_REQUESTS_PER_MINUTE = 12
const MAX_ESTIMATED_COST_CENTS = 80
const ALLOWED_MIME_PREFIXES = ['text/', 'application/pdf', 'application/json', 'image/']

function riskFromSignals(signals: SecurityAbuseSignal[]): AbuseRiskLevel {
  if (signals.includes('xss_payload') || signals.includes('mime_type')) return 'block'
  if (signals.includes('rate_limit') || signals.includes('cost_spike')) return 'throttle'
  if (signals.length > 0) return 'watch'
  return 'normal'
}

function isAllowedMime(mimeType?: string): boolean {
  if (!mimeType) return true
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
}

export function runSecurityAbuseGuard(input: SecurityAbuseGuardInput): SecurityAbuseGuardContract {
  const started = Date.now()
  const signals: SecurityAbuseSignal[] = []
  const text = input.text_sample ?? ''

  if ((input.input_chars ?? 0) > MAX_INPUT_CHARS) signals.push('input_size')
  if ((input.file_bytes ?? 0) > MAX_FILE_BYTES) signals.push('file_size')
  if (!isAllowedMime(input.mime_type)) signals.push('mime_type')
  if ((input.request_count_1m ?? 0) > MAX_REQUESTS_PER_MINUTE) signals.push('rate_limit')
  if ((input.estimated_cost_cents ?? 0) > MAX_ESTIMATED_COST_CENTS) signals.push('cost_spike')
  if (PROMPT_INJECTION_PATTERN.test(text)) signals.push('prompt_injection')
  if (XSS_PATTERN.test(text)) signals.push('xss_payload')

  const riskLevel = riskFromSignals(signals)

  return {
    risk_level: riskLevel,
    signals,
    allowed_actions: riskLevel === 'block'
      ? ['journaliser metadata-only', 'afficher une erreur controlee']
      : ['generer sous quota', 'sanitizer les sorties', 'mesurer la latence et le cout'],
    blocked_actions: riskLevel === 'normal'
      ? []
      : ['relancer une generation couteuse sans controle', 'publier un snapshot non sanitize', 'traiter un fichier non valide'],
    required_controls: [
      'rate limit par IP et utilisateur',
      'quota par endpoint',
      'limite de taille input et fichiers',
      'validation MIME',
      'sanitization HTML',
      'separation public/private/admin',
      'logs sans contenu sensible',
      'alerte CTO Watch si seuil critique',
    ],
    cto_watch_required: riskLevel !== 'normal',
    trace: {
      service: 'SecurityAbuseGuard',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: riskLevel === 'normal' ? 'ok' : riskLevel === 'watch' ? 'partial' : 'blocked',
      notes: [`risk=${riskLevel}`, `signals=${signals.join(',') || 'none'}`],
    },
  }
}
