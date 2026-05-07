import type {
  ConcreteTheatreContract,
  InterpretationContract,
  QualityGateContract,
  QualityIssue,
  ScoringContract,
  WritingContract,
} from '../contracts'
import { containsForbiddenPublicPhrase } from '../writing/diamondRules'

export type QualityGateInput = {
  interpretation: InterpretationContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  writing: WritingContract
}

function publicText(writing: WritingContract): string {
  return [
    writing.situation_card.title_fr,
    writing.situation_card.submitted_situation_fr,
    writing.situation_card.insight_fr,
    writing.situation_card.main_vulnerability_fr,
    writing.situation_card.asymmetry_fr,
    writing.situation_card.key_signal_fr,
    writing.lecture.text_fr,
    writing.approfondir.analysis_fr,
    ...writing.approfondir.sections_fr.map((section) => `${section.title} ${section.body}`),
  ].join(' ')
}

function issue(level: QualityIssue['level'], code: string, message: string, field?: string): QualityIssue {
  return { level, code, message, field }
}

export function runQualityGate(input: QualityGateInput): QualityGateContract {
  const started = Date.now()
  const issues: QualityIssue[] = []
  const text = publicText(input.writing)
  const forbidden = containsForbiddenPublicPhrase(text)

  for (const phrase of forbidden) {
    issues.push(issue('error', 'FORBIDDEN_PUBLIC_PHRASE', `Forbidden public phrase detected: ${phrase}.`, 'writing'))
  }

  if (input.interpretation.header_subject.trim().split(/\s+/).length < 3) {
    issues.push(issue('warning', 'WEAK_HEADER_SUBJECT', 'Header subject should contain at least 3 significant words.', 'interpretation.header_subject'))
  }

  if (input.theatre.actors.length === 0 && input.theatre.evidence.length === 0) {
    issues.push(issue('warning', 'WEAK_THEATRE', 'Concrete theatre has no actors and no evidence anchors.', 'theatre'))
  }

  if (input.writing.diamond_sentences.length === 0) {
    issues.push(issue('error', 'MISSING_DIAMOND_SENTENCE', 'Writing must include at least one diamond sentence.', 'writing.diamond_sentences'))
  }

  if (input.writing.probability_assessments.length === 0) {
    issues.push(issue('warning', 'MISSING_PROBABILITY', 'Writing should state assertion status when evidence is incomplete.', 'writing.probability_assessments'))
  }

  if (input.writing.situation_card.main_vulnerability_fr.length < 30) {
    issues.push(issue('warning', 'WEAK_MAIN_VULNERABILITY', 'Main vulnerability looks too short or generic.', 'writing.situation_card.main_vulnerability_fr'))
  }

  if (input.scoring.state_index_final > 70 && !input.scoring.astrolabe.some((branch) => branch.score === 3)) {
    issues.push(issue('error', 'SCORING_DOMINANT_MISSING', 'State above 70 requires at least one dominant Astrolabe branch.', 'scoring'))
  }

  const sectionsToRegenerate = Array.from(new Set(
    issues
      .filter((item) => item.level === 'error')
      .map((item) => item.field?.split('.')[0] ?? 'writing'),
  ))

  return {
    ok: !issues.some((item) => item.level === 'error'),
    issues,
    requires_section_regeneration: sectionsToRegenerate.length > 0,
    sections_to_regenerate: sectionsToRegenerate,
    trace: {
      service: 'QualityGate',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: issues.some((item) => item.level === 'error') ? 'error' : issues.length > 0 ? 'partial' : 'ok',
      notes: [`issues=${issues.length}`],
    },
  }
}
