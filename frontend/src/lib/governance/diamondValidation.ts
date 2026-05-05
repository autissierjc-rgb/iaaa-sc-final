import type { SituationCard, SituationDomain } from '../resources/resourceContract'

// Boundary rule:
// These validators do not interpret any user text from the chat.
// ChatGPT/model interpretation is the sole authority for intent, domain, angle,
// follow-up meaning, and the faithful formalization of Situation soumise.
// Validators only report incoherence against that already interpreted contract.

export type DiamondValidationLevel = 'info' | 'warning' | 'error'

export type DiamondValidationIssue = {
  level: DiamondValidationLevel
  code: string
  message: string
  field?: string
}

export type DiamondValidationResult = {
  ok: boolean
  issues: DiamondValidationIssue[]
}

const DOMAIN_FORBIDDEN_TERMS: Record<SituationDomain, RegExp[]> = {
  geopolitics: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\bpipeline commercial\b/i,
    /\bdistribution produit\b/i,
    /\benfant int[eé]rieur\b/i,
  ],
  war: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\bpipeline commercial\b/i,
    /\bdistribution produit\b/i,
    /\bblessure relationnelle\b/i,
  ],
  management: [
    /\bdissuasion nucl[eé]aire\b/i,
    /\bd[eé]troit\b/i,
    /\bCGRI\b/i,
    /\bIRGC\b/i,
  ],
  professional: [
    /\bdissuasion nucl[eé]aire\b/i,
    /\bd[eé]troit\b/i,
    /\bCGRI\b/i,
    /\bIRGC\b/i,
  ],
  governance: [
    /\bdissuasion nucl[eé]aire\b/i,
    /\bd[eé]troit\b/i,
    /\benfant int[eé]rieur\b/i,
  ],
  startup_vc: [
    /\bCGRI\b/i,
    /\bIRGC\b/i,
    /\bdissuasion nucl[eé]aire\b/i,
    /\bconflit de loyaut[eé] familial\b/i,
  ],
  economy: [
    /\benfant int[eé]rieur\b/i,
    /\bblessure relationnelle\b/i,
    /\bCGRI\b/i,
  ],
  humanitarian: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\benfant int[eé]rieur\b/i,
  ],
  personal: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\bpipeline commercial\b/i,
    /\bCGRI\b/i,
    /\bIRGC\b/i,
    /\bd[eé]troit d['’ ]?Ormuz\b/i,
    /\binfrastructure critique\b/i,
  ],
  general: [],
}

const GENERIC_PHRASES = [
  /lecture centr[eé]e sur la dynamique interne de la situation/i,
  /syst[eè]me sous contrainte/i,
  /le c[œo]ur concret de la situation se concentre autour de/i,
  /lecture syst[eè]me indisponible pour cette carte/i,
  /structural reading from available signals/i,
]

const CONCRETE_SIGNAL = /\b[A-ZÉÈÀÂÎÏÔÛÇ][A-Za-zÀ-ÿ'’-]{2,}\b|\b\d{4}\b|\b\d{1,2}\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\b|https?:\/\//i

function collectCardText(sc: SituationCard): string {
  const parts: string[] = []
  for (const value of Object.values(sc)) {
    if (typeof value === 'string') parts.push(value)
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') parts.push(item)
        else if (item && typeof item === 'object') {
          for (const nested of Object.values(item as Record<string, unknown>)) {
            if (typeof nested === 'string') parts.push(nested)
          }
        }
      }
    }
  }
  return parts.join('\n')
}

function issue(level: DiamondValidationLevel, code: string, message: string, field?: string): DiamondValidationIssue {
  return { level, code, message, field }
}

export function validateDomainCoherence(sc: SituationCard, domain: SituationDomain): DiamondValidationResult {
  const text = collectCardText(sc)
  const issues = (DOMAIN_FORBIDDEN_TERMS[domain] ?? [])
    .filter((pattern) => pattern.test(text))
    .map((pattern) => issue(
      'warning',
      'domain_contamination',
      `Potential vocabulary contamination for domain "${domain}": ${pattern.source}`,
    ))

  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function validateAntiHorsSol(sc: SituationCard): DiamondValidationResult {
  const text = collectCardText(sc)
  const issues: DiamondValidationIssue[] = []

  for (const pattern of GENERIC_PHRASES) {
    if (pattern.test(text)) {
      issues.push(issue('warning', 'generic_phrase', `Generic or fallback phrase detected: ${pattern.source}`))
    }
  }

  const hasConcreteSignal = CONCRETE_SIGNAL.test(text)
  if (!hasConcreteSignal) {
    issues.push(issue(
      'warning',
      'missing_concrete_anchor',
      'No obvious concrete anchor detected: actor, named place, date, URL, or proper noun.',
    ))
  }

  const hasBlindSpot =
    /\bangle mort\b|\bangles morts\b|\binvisible\b|\bnon[- ]dit\b|\bimplicite\b|\bce qui manque\b/i.test(text)
  if (!hasBlindSpot) {
    issues.push(issue(
      'info',
      'blind_spot_not_explicit',
      'No explicit blind spot wording detected. This may be acceptable, but axis VI should still search missing angles.',
    ))
  }

  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function validateScoringCoherence(sc: SituationCard): DiamondValidationResult {
  const state = Number(sc.state_index_final)
  const scores = Array.isArray(sc.astrolabe_scores) ? sc.astrolabe_scores : []
  const dominant = scores.filter((entry) => Number((entry as Record<string, unknown>).display_score) === 3).length
  const moderate = scores.filter((entry) => Number((entry as Record<string, unknown>).display_score) === 2).length
  const issues: DiamondValidationIssue[] = []

  if (Number.isFinite(state) && state < 40 && moderate > 2) {
    issues.push(issue(
      'warning',
      'stable_with_many_moderates',
      'Stable state should not display many moderate astrolabe branches.',
      'astrolabe_scores',
    ))
  }

  if (dominant > 2) {
    issues.push(issue(
      'warning',
      'too_many_dominants',
      'More than two dominant branches weakens astrolabe hierarchy.',
      'astrolabe_scores',
    ))
  }

  if (moderate > 3) {
    issues.push(issue(
      'warning',
      'too_many_moderates',
      'More than three moderate branches can flatten the astrolabe.',
      'astrolabe_scores',
    ))
  }

  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function validateDiamondContract(sc: SituationCard, domain: SituationDomain): DiamondValidationResult {
  const results = [
    validateDomainCoherence(sc, domain),
    validateAntiHorsSol(sc),
    validateScoringCoherence(sc),
  ]
  const issues = results.flatMap((result) => result.issues)
  return { ok: !issues.some((item) => item.level === 'error'), issues }
}
