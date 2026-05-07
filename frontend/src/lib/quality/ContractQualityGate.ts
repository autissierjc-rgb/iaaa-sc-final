import type {
  ConcreteTheatreContract,
  InquiryContract,
  InterpretationContract,
  QualityGateContract,
  QualityIssue,
  ScoringContract,
} from '@/lib/contracts'

export type ContractQualityGateInput = {
  interpretation: InterpretationContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  inquiry: InquiryContract
}

const HEADER_STOP_WORDS = new Set([
  'a',
  'au',
  'aux',
  'de',
  'des',
  'du',
  'en',
  'et',
  'la',
  'le',
  'les',
  'pour',
  'que',
  'qui',
  'sur',
  'un',
  'une',
])

const GENERIC_NOTICE_PATTERNS = [
  /une reponse situee qui nomme/i,
  /ce point est relie a des acteurs/i,
  /objet visible/i,
  /mecanisme concret/i,
  /canal concret/i,
  /general_analysis/i,
  /understand_situation/i,
]

function issue(level: QualityIssue['level'], code: string, message: string, field?: string): QualityIssue {
  return { level, code, message, field }
}

function significantWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, '').toLowerCase())
    .filter((word) => word.length > 1 && !HEADER_STOP_WORDS.has(word))
}

function containsGenericNotice(value: string) {
  return GENERIC_NOTICE_PATTERNS.some((pattern) => pattern.test(value))
}

export function runContractQualityGate(input: ContractQualityGateInput): QualityGateContract {
  const started = Date.now()
  const issues: QualityIssue[] = []

  if (significantWords(input.interpretation.header_subject).length < 3) {
    issues.push(
      issue(
        'warning',
        'WEAK_HEADER_SUBJECT',
        'Header subject should contain at least 3 significant words.',
        'interpretation.header_subject',
      ),
    )
  }

  if (input.interpretation.situation_soumise.trim().length < 18) {
    issues.push(
      issue(
        'warning',
        'WEAK_SITUATION_SOUMISE',
        'Situation soumise looks too short to preserve the user intention.',
        'interpretation.situation_soumise',
      ),
    )
  }

  if (input.theatre.actors.length === 0) {
    issues.push(issue('warning', 'NO_ACTORS', 'Concrete theatre should name at least one actor.', 'theatre.actors'))
  }

  if (input.theatre.actors.length + input.theatre.institutions.length + input.theatre.procedures.length < 3) {
    issues.push(
      issue(
        'warning',
        'WEAK_CONCRETE_THEATRE',
        'Concrete theatre needs actors, institutions or procedures before writing.',
        'theatre',
      ),
    )
  }

  if (input.inquiry.blind_spots.length === 0) {
    issues.push(
      issue(
        'warning',
        'NO_BLIND_SPOT_PREPARATION',
        'Angles morts preparation is empty; Approfondir would miss what to verify.',
        'inquiry',
      ),
    )
  }

  for (const blindSpot of input.inquiry.blind_spots) {
    if (containsGenericNotice(blindSpot.decisive_evidence) || containsGenericNotice(blindSpot.observable_signal)) {
      issues.push(
        issue(
          'error',
          'GENERIC_INQUIRY_NOTICE',
          `Blind spot "${blindSpot.blind_spot}" still uses generic notice wording.`,
          'inquiry.blind_spots',
        ),
      )
    }
  }

  if (input.scoring.state_index_final > 70 && !input.scoring.astrolabe.some((branch) => branch.score === 3)) {
    issues.push(
      issue(
        'error',
        'SCORING_DOMINANT_MISSING',
        'State above 70 requires at least one dominant Astrolabe branch.',
        'scoring.astrolabe',
      ),
    )
  }

  const sectionsToRegenerate = Array.from(
    new Set(issues.filter((item) => item.level === 'error').map((item) => item.field?.split('.')[0] ?? 'contract')),
  )

  return {
    ok: !issues.some((item) => item.level === 'error'),
    issues,
    requires_section_regeneration: sectionsToRegenerate.length > 0,
    sections_to_regenerate: sectionsToRegenerate,
    trace: {
      service: 'ContractQualityGate',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: issues.some((item) => item.level === 'error') ? 'error' : issues.length > 0 ? 'partial' : 'ok',
      notes: [`issues=${issues.length}`],
    },
  }
}
