import type {
  ConcreteTheatreContract,
  InterpretationContract,
  QualityGateContract,
  QualityIssue,
  ResourceServiceContract,
  ScoringContract,
  WritingContract,
} from '../contracts'
import { containsForbiddenPublicPhrase } from '../writing/diamondRules'

export type QualityGateInput = {
  interpretation: InterpretationContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  writing: WritingContract
  resources?: ResourceServiceContract
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

const FORBIDDEN_THEORY_LABELS = [
  'Goffman',
  'Douglas',
  'Crozier',
  'Friedberg',
  'Bourdieu',
  'Mauss',
  'Boltanski',
  'Thevenot',
  'Thévenot',
  'Schein',
  'Argyris',
  'Janis',
  'Turner',
  'Girard',
  'Marx',
  'Levi-Strauss',
  'Lévi-Strauss',
  'Dumezil',
  'Dumézil',
  'triade fonctionnelle',
  'patterns humains',
  'patterns collectifs',
]

const SOFT_DIAMOND_PHRASES = [
  'la situation est fragile',
  'il faut rester prudent',
  'il est important de',
  'cela peut poser question',
  'la situation est complexe',
  'il faut surveiller',
  'le manque de communication',
]

const RESOURCE_AS_OBJECT_PHRASES = [
  'ce que l entreprise fait',
  'ce que le site dit faire',
  'que l entreprise dit faire',
  'que le site dit faire',
  'comprendre l offre avant',
  'l objet a verifier',
  'objet a verifier',
]

const MECHANICAL_WRITING_PATTERNS = [
  /ne se tranche pas par une formule generale/i,
  /acteurs et passages obliges/i,
  /levier reel qui n.?est pas encore protege ou clarifie/i,
  /tant que ce point n.?est pas relie a une trace verifiable/i,
  /passer d.?une impression generale a une lecture partageable/i,
  /un fait, une decision, un document ou un changement de calendrier verifiable/i,
  /qui decide, qui porte la charge/i,
]

function hasSharpDiamond(writing: WritingContract): boolean {
  return writing.diamond_sentences.some((sentence) => sentence.style === 'diamant_tranchant' && sentence.must_be_public)
}

function diamondText(writing: WritingContract): string {
  return writing.diamond_sentences
    .filter((sentence) => sentence.must_be_public)
    .map((sentence) => sentence.text_fr)
    .join(' ')
}

function host(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function hasResourceRoleSignal(input: QualityGateInput, role: string): boolean {
  return input.interpretation.signals.some((signal) => signal === `resource_role:${role}`)
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function meaningfulTheatreAnchors(theatre: ConcreteTheatreContract): string[] {
  return Array.from(new Set([
    ...(theatre.named_actors ?? []),
    ...(theatre.actors ?? []),
    ...(theatre.institutions ?? []),
    ...(theatre.visible_actions ?? []),
    ...(theatre.constraints ?? []),
    ...theatre.evidence.map((item) => item.label),
  ].map((item) => item.trim()).filter((item) => item.length >= 4)))
    .filter((item) => !/^(acteurs?|institutions?|contraintes?|preuves?|sources?|trace verifiable|fait observable)$/i.test(normalize(item)))
    .slice(0, 20)
}

function countAnchorsUsed(anchors: string[], normalizedText: string): number {
  return anchors.filter((anchor) => normalize(anchor).split(/\s+/).some((part) =>
    part.length >= 5 && normalizedText.includes(part),
  )).length
}

export function runQualityGate(input: QualityGateInput): QualityGateContract {
  const started = Date.now()
  const issues: QualityIssue[] = []
  const text = publicText(input.writing)
  const normalizedText = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const forbidden = containsForbiddenPublicPhrase(text)
  const publicDiamond = diamondText(input.writing)
  const normalizedDiamond = publicDiamond
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const theatreAnchors = meaningfulTheatreAnchors(input.theatre)
  const theatreAnchorsUsed = countAnchorsUsed(theatreAnchors, normalizedText)

  if (hasResourceRoleSignal(input, 'context_for_question') && input.interpretation.question_type === 'site_analysis') {
    issues.push(issue(
      'error',
      'RESOURCE_CONTEXT_MISREAD_AS_OBJECT',
      'A contextual resource must not replace the user question as a site analysis object.',
      'interpretation.question_type',
    ))
  }

  if (hasResourceRoleSignal(input, 'context_for_question')) {
    const driftPhrase = RESOURCE_AS_OBJECT_PHRASES.find((phrase) => normalizedText.includes(phrase))
    if (driftPhrase) {
      issues.push(issue(
        'warning',
        'RESOURCE_CONTEXT_WRITING_DRIFT',
        `Writing sounds as if the contextual resource became the object of analysis: ${driftPhrase}.`,
        'writing',
      ))
    }
  }

  for (const phrase of forbidden) {
    issues.push(issue('error', 'FORBIDDEN_PUBLIC_PHRASE', `Forbidden public phrase detected: ${phrase}.`, 'writing'))
  }

  for (const label of FORBIDDEN_THEORY_LABELS) {
    if (text.includes(label)) {
      issues.push(issue('error', 'FORBIDDEN_THEORY_LABEL', `Forbidden public theory label detected: ${label}.`, 'writing'))
    }
  }

  if (input.interpretation.header_subject.trim().split(/\s+/).length < 3) {
    issues.push(issue('warning', 'WEAK_HEADER_SUBJECT', 'Header subject should contain at least 3 significant words.', 'interpretation.header_subject'))
  }

  if (input.theatre.actors.length === 0 && input.theatre.evidence.length === 0) {
    issues.push(issue('warning', 'WEAK_THEATRE', 'Concrete theatre has no actors and no evidence anchors.', 'theatre'))
  }

  if (theatreAnchors.length >= 3 && theatreAnchorsUsed < 2) {
    issues.push(issue(
      'warning',
      'THEATRE_ANCHORS_UNDERUSED',
      'Writing uses too few concrete theatre anchors despite available actors, constraints, actions or evidence.',
      'writing',
    ))
  }

  const mechanicalMatch = MECHANICAL_WRITING_PATTERNS.find((pattern) => pattern.test(normalizedText))
  if (theatreAnchors.length >= 3 && mechanicalMatch) {
    issues.push(issue(
      'warning',
      'MECHANICAL_WRITING_WITH_THEATRE',
      `Writing still contains a mechanical formula while concrete theatre anchors exist: ${mechanicalMatch.source}.`,
      'writing',
    ))
  }

  if (input.writing.diamond_sentences.length === 0) {
    issues.push(issue('error', 'MISSING_DIAMOND_SENTENCE', 'Writing must include at least one diamond sentence.', 'writing.diamond_sentences'))
  }

  if (!hasSharpDiamond(input.writing)) {
    issues.push(issue('warning', 'MISSING_SHARP_DIAMOND', 'Writing should include a public diamant_tranchant sentence.', 'writing.diamond_sentences'))
  }

  if (publicDiamond && publicDiamond.length < 70) {
    issues.push(issue('warning', 'WEAK_SHARP_DIAMOND', 'Diamond sentence looks too short to carry the central contradiction.', 'writing.diamond_sentences'))
  }

  for (const phrase of SOFT_DIAMOND_PHRASES) {
    if (normalizedDiamond.includes(phrase)) {
      issues.push(issue('warning', 'SOFT_SHARP_DIAMOND', `Diamond sentence sounds too soft or generic: ${phrase}.`, 'writing.diamond_sentences'))
      break
    }
  }

  if (input.writing.probability_assessments.length === 0) {
    issues.push(issue('warning', 'MISSING_PROBABILITY', 'Writing should state assertion status when evidence is incomplete.', 'writing.probability_assessments'))
  }

  if (input.resources?.needs_web && input.resources.public_sources.length === 0) {
    issues.push(issue(
      'warning',
      'FAST_SOURCES_REQUIRED_BUT_MISSING',
      input.resources.policy_reason_fr,
      'resources',
    ))
  }

  if (input.resources?.needs_web && input.resources.public_sources.length > 0) {
    const sourceHosts = Array.from(new Set(input.resources.public_sources.map((source) => host(source.url)).filter(Boolean)))
    const hasReliableSource = input.resources.public_sources.some((source) =>
      source.reliability === 'primary' || source.reliability === 'secondary',
    )
    const sourcesWithExcerpt = input.resources.public_sources.filter((source) => Boolean(source.excerpt)).length

    if (!hasReliableSource) {
      issues.push(issue(
        'warning',
        'FAST_SOURCES_LOW_RELIABILITY',
        'Fast sources are attached but none is marked primary or secondary.',
        'resources.public_sources',
      ))
    }

    if (input.resources.public_sources.length >= 2 && sourceHosts.length < 2) {
      issues.push(issue(
        'warning',
        'FAST_SOURCES_LOW_DIVERSITY',
        'Fast sources come from too few distinct domains.',
        'resources.public_sources',
      ))
    }

    if (sourcesWithExcerpt === 0) {
      issues.push(issue(
        'warning',
        'FAST_SOURCES_WITHOUT_EXCERPTS',
        'Fast sources have no excerpts, so their probative value remains weak.',
        'resources.public_sources',
      ))
    }
  }

  if (input.resources?.needs_web && input.resources.public_sources.length === 0 && input.writing.public_warnings.length === 0) {
    issues.push(issue(
      'warning',
      'MISSING_RESOURCE_WARNING',
      'Writing should publicly signal that fast sources are needed before factual conclusions harden.',
      'writing.public_warnings',
    ))
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
