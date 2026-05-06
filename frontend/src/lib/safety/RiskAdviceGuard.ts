import type {
  AdviceMode,
  DomainRiskLevel,
  InterpretationContract,
  RiskAdviceGuardContract,
  SensitiveDomain,
} from '../contracts'

export type RiskAdviceGuardInput = {
  interpretation: InterpretationContract
}

const SENSITIVE_PATTERNS: Array<{
  domain: SensitiveDomain
  risk: DomainRiskLevel
  mode: AdviceMode
  pattern: RegExp
}> = [
  { domain: 'medical', risk: 'high_stakes', mode: 'professional_referral', pattern: /\b(sympt[oô]me|maladie|diagnostic|traitement|m[eé]dicament|urgence|douleur|sant[eé]|cancer|suicide)\b/i },
  { domain: 'legal', risk: 'regulated', mode: 'professional_referral', pattern: /\b(avocat|proc[eè]s|plainte|contrat|licenciement|tribunal|juridique|l[eé]gal|droit|jurisprudence)\b/i },
  { domain: 'financial', risk: 'regulated', mode: 'professional_referral', pattern: /\b(investir|placement|cr[eé]dit|assurance vie|action|crypto|imp[oô]t|fiscal|patrimoine|financier)\b/i },
  { domain: 'insurance', risk: 'regulated', mode: 'professional_referral', pattern: /\b(assurance|sinistre|indemnisation|mutuelle|prime|courtier)\b/i },
  { domain: 'employment', risk: 'regulated', mode: 'analysis_only', pattern: /\b(recrutement|licenciement|discrimination|salaire|contrat de travail|rh|emploi)\b/i },
  { domain: 'education_access', risk: 'regulated', mode: 'analysis_only', pattern: /\b(admission|orientation|selection scolaire|bourse|parcoursup|universit[eé])\b/i },
  { domain: 'public_benefits', risk: 'regulated', mode: 'professional_referral', pattern: /\b(allocation|caf|rsa|aide sociale|titre de s[eé]jour|prestation)\b/i },
  { domain: 'fundamental_rights', risk: 'high_stakes', mode: 'professional_referral', pattern: /\b(droit fondamental|asile|expulsion|detention|liberte|discrimination)\b/i },
  { domain: 'minors', risk: 'regulated', mode: 'analysis_only', pattern: /\b(enfant|ado|adolescent|mineur|fils|fille|ecole|coll[eè]ge|lyc[eé]e)\b/i },
  { domain: 'safety_violence', risk: 'high_stakes', mode: 'emergency_referral', pattern: /\b(violence|menace|danger imminent|agression|arme|se tuer|suicide|abus)\b/i },
]

function strongestRisk(risks: DomainRiskLevel[]): DomainRiskLevel {
  if (risks.includes('blocked')) return 'blocked'
  if (risks.includes('high_stakes')) return 'high_stakes'
  if (risks.includes('regulated')) return 'regulated'
  return 'normal'
}

function strongestMode(modes: AdviceMode[]): AdviceMode {
  if (modes.includes('refuse')) return 'refuse'
  if (modes.includes('emergency_referral')) return 'emergency_referral'
  if (modes.includes('professional_referral')) return 'professional_referral'
  return 'analysis_only'
}

function disclaimerFr(mode: AdviceMode): string | undefined {
  if (mode === 'analysis_only') return undefined
  if (mode === 'emergency_referral') {
    return 'Cette carte ne remplace pas une aide urgente ou professionnelle. En cas de danger immediat, contactez les services d urgence ou une personne qualifiee.'
  }
  if (mode === 'professional_referral') {
    return 'Cette carte structure la situation mais ne constitue pas un conseil medical, juridique, financier ou professionnel personnalise.'
  }
  return 'Cette demande ne peut pas etre traitee sous forme de conseil operationnel personnalise.'
}

export function runRiskAdviceGuard(input: RiskAdviceGuardInput): RiskAdviceGuardContract {
  const started = Date.now()
  const text = [
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.angle,
  ].join(' ')

  const matches = SENSITIVE_PATTERNS.filter((item) => item.pattern.test(text))
  const sensitiveDomains = matches.length > 0
    ? Array.from(new Set(matches.map((item) => item.domain)))
    : ['none' as const]
  const domainRisk = strongestRisk(matches.map((item) => item.risk))
  const adviceMode = strongestMode(matches.map((item) => item.mode))

  return {
    domain_risk: domainRisk,
    sensitive_domains: sensitiveDomains,
    advice_mode: adviceMode,
    allowed_outputs: [
      'cartographier la situation',
      'identifier les questions a poser',
      'separer etabli, probable, plausible et inconnu',
      'indiquer les preuves ou sources a verifier',
    ],
    forbidden_outputs: adviceMode === 'analysis_only'
      ? []
      : [
          'donner une prescription personnalisee',
          'remplacer un professionnel qualifie',
          'presenter une decision reglementee comme automatique',
        ],
    required_disclaimer_fr: disclaimerFr(adviceMode),
    human_review_required: domainRisk === 'high_stakes' || domainRisk === 'blocked',
    emergency: adviceMode === 'emergency_referral',
    trace: {
      service: 'RiskAdviceGuard',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: domainRisk === 'normal' ? 'ok' : 'partial',
      notes: [`sensitive_domains=${sensitiveDomains.join(',')}`, `advice_mode=${adviceMode}`],
    },
  }
}
