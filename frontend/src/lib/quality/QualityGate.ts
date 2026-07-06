import type {
  ConcreteTheatreContract,
  InterpretationContract,
  QualityGateContract,
  QualityIssue,
  ResonanceTraceContract,
  ResourceServiceContract,
  ScoringContract,
  WritingContract,
} from '../contracts'
import { buildResourceRegimeSignals, countRegimeSignalsUsed, discriminantTermsFrom } from '../resources/regimeSignals'
import { containsForbiddenPublicPhrase } from '../writing/diamondRules'

export type QualityGateInput = {
  interpretation: InterpretationContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  writing: WritingContract
  resources?: ResourceServiceContract
  resonance: ResonanceTraceContract
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function arrayValue<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function publicText(writing: WritingContract): string {
  return [
    textValue(writing.situation_card?.title_fr),
    textValue(writing.situation_card?.submitted_situation_fr),
    textValue(writing.situation_card?.insight_fr),
    textValue(writing.situation_card?.main_vulnerability_fr),
    textValue(writing.situation_card?.asymmetry_fr),
    textValue(writing.situation_card?.key_signal_fr),
    textValue(writing.lecture?.text_fr),
    textValue(writing.approfondir?.analysis_fr),
    ...arrayValue(writing.approfondir?.sections_fr).map((section) => `${textValue(section.title)} ${textValue(section.body)}`),
  ].join(' ')
}

function lectureAndApprofondirText(writing: WritingContract): string {
  return [
    textValue(writing.lecture?.text_fr),
    textValue(writing.approfondir?.analysis_fr),
    ...arrayValue(writing.approfondir?.sections_fr).map((section) => `${textValue(section.title)} ${textValue(section.body)}`),
  ].join(' ')
}

function diamondNarrativeText(writing: WritingContract): string {
  return [
    textValue(writing.situation_card?.insight_fr),
    textValue(writing.situation_card?.main_vulnerability_fr),
    textValue(writing.situation_card?.asymmetry_fr),
    textValue(writing.situation_card?.key_signal_fr),
    textValue(writing.lecture?.text_fr),
    textValue(writing.approfondir?.analysis_fr),
    ...arrayValue(writing.approfondir?.sections_fr)
      .filter((section) => section.id !== 'resources' && section.id !== 'ressources')
      .map((section) => textValue(section.body)),
  ].join(' ')
}

function canonicalQuestionText(interpretation: InterpretationContract): string {
  return [
    textValue(interpretation.raw_input),
    textValue(interpretation.situation_soumise),
    textValue(interpretation.object_of_analysis),
    textValue(interpretation.header_subject),
    textValue(interpretation.angle),
    textValue(interpretation.user_need),
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
  /la situation ne se reduit pas a l.?evenement visible/i,
  /distribution de leviers/i,
  /ce qui garde encore la face/i,
  /un acteur qui change de rythme/i,
  /qui peut agir,\s*bloquer,\s*legitimer/i,
  /ne se tranche pas par une formule generale/i,
  /acteurs et passages obliges/i,
  /levier reel qui n.?est pas encore protege ou clarifie/i,
  /tant que ce point n.?est pas relie a une trace verifiable/i,
  /passer d.?une impression generale a une lecture partageable/i,
  /un fait, une decision, un document ou un changement de calendrier verifiable/i,
  /qui decide, qui porte la charge/i,
  /mandat officiel/i,
  /role reel/i,
  /hierarchie et arbitrage/i,
  /charge collective/i,
  /choose_action/i,
  /contestation trouve un relais capable de ralentir ou delegitimer la procedure/i,
  /fait opposable/i,
  /la lecture utile consiste a situer/i,
  /point aveugle\s+(?:le|la|les|l\s)/i,
  /tant qu.?il n.?est pas relie a un acte,\s*une preuve ou un seuil observable/i,
]

const CAUSAL_FRAME_PUBLIC_PATTERNS = [
  /qui manipule qui/i,
  /chaine d.?entrainement/i,
  /\binfluence et decision\b/i,
  /preuve d.?entrainement/i,
  /a-t-il convaincu/i,
  /decideur n.?est pas seulement ["“”']?entraine/i,
  /manipulated another/i,
  /political entrainment/i,
  /dragged by an ally/i,
  /causal proof/i,
]

const TARGET_CHOICE_GENERIC_PATTERNS = [
  /segment tres qualifie/i,
  /communaute plus large/i,
  /relais prescripteur/i,
  /une communaute donne de la surface/i,
  /startup a besoin d.?un signal plus dur que l.?attention/i,
]

const TARGET_CHOICE_RAW_AUDIENCE_PATTERNS = [
  /particuliers?,\s*professionnels?,\s*analystes?/i,
  /professionnels?,\s*analystes?,\s*consultants?/i,
  /organisations?\s+et\s+institutions?\s*;\s*particuliers?/i,
]

const PUBLIC_RESOURCE_NOISE_PATTERNS = [
  /\b(?:Fiche site|Synth[èe]se crawl site)\s[-–]\s[^\s,.!?;:]+/i,
  /!\[[^\]]*]\(https?:\/\//i,
  /\[[^\]]+]\(https?:\/\//i,
  /(?:^|\s)(?:image|img)\s*\d{1,4}\b/i,
  /\.(?:avif|png|jpe?g|gif|webp|svg)(?:\)|\s|$)/i,
  /\s[-–]\s(?:reuters|politico|associated press|ap news|apnews|bbc|cnn|nyt|new york times|washington post|haaretz|times of israel|bloomberg|financial times|ft\.com|axios|the guardian|le monde|afp|france 24)\b/i,
]

const PUBLIC_INTERNAL_WRITING_PATTERNS = [
  /preuve ou ancre manquante/i,
  /ce qui ferait changer le statut/i,
  /\bhypothese\b/i,
  /\bportee doit rester qualifiee\b/i,
  /\bpreuve decisive encore a confronter\b/i,
  /sources?\s+mobilis[ée]es?\s*:/i,
  /acteur absent,\s*contrainte cach[ée]e,\s*preuve manquante/i,
  /signal observable reliant acteur,\s*decision et consequence/i,
  /institutions? concern[ée]es?/i,
  /acteurs? influents?,\s*acteurs? capables? de bloquer/i,
]

const WEAK_VULNERABILITY_PATTERNS = [
  /\bvuln[ée]rabilit[ée]\s+centrale\s+est\s+(?:chronologie|d[ée]clarations?|dirigeants?)\b/i,
  /\ble point fragile est\s+(?:chronologie|d[ée]clarations?|dirigeants?)\b/i,
  /\b(?:chronologie|d[ée]clarations?)\s*:\s*tant que ce point\b/i,
  /acteur absent,\s*contrainte cach[ée]e,\s*preuve manquante/i,
]

const GLUED_TRAJECTORY_PATTERNS = [
  /Signal\s*:\s*[^.?!\n]{20,}\s+Escalade\s*:/i,
  /Signal\s*:\s*[^.?!\n]{20,}\s+Bascule\s*:/i,
]

const DEFENSIVE_PUBLIC_OPENING_PATTERNS = [
  /\bne demande pas de\b/i,
  /\bla question utile est\b/i,
  /\bil ne s['’]agit pas de\b/i,
  /\bla bonne sortie est\b/i,
  /\bne doit pas être remplacé par\b/i,
]

const PRESS_SUMMARY_OPENING_PATTERNS = [
  /\bla situation actuelle est marqu[ée]e par\b/i,
  /\bla situation est marqu[ée]e par\b/i,
  /\b(?:l['’]?)?[A-ZÉÈÀÂÎÏÔÛÇ][A-Za-zÀ-ÿ'’ -]{2,80}\s+est\s+[àa]\s+un point critique\b/i,
  /\bles tensions? (?:sont|restent) (?:fortes?|vives?|croissantes?)\b/i,
  /\bun signal cl[ée] [aà] surveiller est\b/i,
  /\bser(?:a|ont|aient)?\s+crucial(?:e|es|s)?\s+pour\s+d[ée]terminer\b/i,
]

const PROBABILITY_STATUS_SECTION_TITLES = [
  'ce qui est etabli',
  'ce qui est etablie',
  'ce qui est probable',
  'ce qui est plausible',
  'ce qui est hypothetique',
  'ce qui est inconnu',
]

const ABSTRACT_UNDERSTANDING_FALLBACK_PATTERNS = [
  /la tension peut etre largement commentee/i,
  /passage entre crainte,\s*intention,\s*capacite reelle et acte verifiable/i,
  /un acte verifiable\s*:\s*decision,\s*refus,\s*procedure,\s*pression organisee,\s*changement de calendrier/i,
]

const RAW_EXTERNAL_EXCERPT_PATTERNS = [
  /\bThe\s+[A-Z][a-z]+[^.?!]{30,}\b(?:after|between|over|war|ceasefire|reported|launched|strikes?)\b/i,
  /\bFor\s+days,\s+[^.?!]{30,}\b(?:negotiations?|ceasefire|fighting|stalled)\b/i,
  /\bAn\s+[a-z]+[^.?!]{30,}\b(?:official warnings?|military thresholds?|ceasefire|strikes?)\b/i,
]

function countPublicUrls(value: string): number {
  return value.match(/https?:\/\//gi)?.length ?? 0
}

function normalizedSentenceKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, 'url')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hasRepeatedSubmittedSentence(value: string): boolean {
  const parts = value
    .split(/(?<=[.?!])\s+/)
    .map((part) => normalizedSentenceKey(part))
    .filter((part) => part.length >= 18)
  return parts.some((part, index) => parts.indexOf(part) !== index)
}

function hasSharpDiamond(writing: WritingContract): boolean {
  return arrayValue(writing.diamond_sentences).some((sentence) => sentence.style === 'diamant_tranchant' && sentence.must_be_public)
}

function diamondText(writing: WritingContract): string {
  return arrayValue(writing.diamond_sentences)
    .filter((sentence) => sentence.must_be_public)
    .map((sentence) => textValue(sentence.text_fr))
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

function isTargetChoiceWithMaterial(input: QualityGateInput): boolean {
  const plan = input.interpretation.treatment_plan
  return plan?.mode === 'direct_sc' &&
    plan.source_status === 'provided' &&
    (plan.trace_notes ?? []).some((note) => note === 'target_choice_with_material')
}

function hasRankableExtractedOptions(input: QualityGateInput): boolean {
  return (input.resources?.extracted_options ?? []).filter((option) =>
    option.kind === 'audience_family' ||
    option.kind === 'user_segment' ||
    option.kind === 'strategic_option' ||
    option.kind === 'offer' ||
    option.kind === 'use_case',
  ).length >= 2
}

function hasExplicitTargetRanking(normalizedPublicText: string): boolean {
  const hasPriority =
    normalizedPublicText.includes('cible prioritaire') ||
    normalizedPublicText.includes('prioritaire probable') ||
    normalizedPublicText.includes('classement provisoire')
  const hasSecond =
    normalizedPublicText.includes('cible secondaire') ||
    normalizedPublicText.includes('secondaire') ||
    normalizedPublicText.includes('canal d apprentissage')
  const hasDeferred =
    normalizedPublicText.includes('cible a differer') ||
    normalizedPublicText.includes('a differer') ||
    normalizedPublicText.includes('preuve longue')
  return hasPriority && hasSecond && hasDeferred
}

function normalize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function bodyRepeatsTitle(title: string, body: string): boolean {
  const titleKey = normalize(title).replace(/[^a-z0-9]+/g, ' ').trim()
  const bodyStart = normalize(body).replace(/[^a-z0-9]+/g, ' ').trim().slice(0, titleKey.length + 8)
  return Boolean(titleKey && bodyStart.startsWith(titleKey))
}

function wordCount(value: string): number {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 0)
    .length
}

function bodyWithoutTitle(title: string, body: string): string {
  const normalizedTitle = normalize(title).replace(/[^a-z0-9]+/g, ' ').trim()
  const normalizedBody = normalize(body).replace(/[^a-z0-9]+/g, ' ').trim()
  if (!normalizedTitle) return body.trim()
  if (!normalizedBody.startsWith(normalizedTitle)) return body.trim()
  return normalizedBody.slice(normalizedTitle.length).trim()
}

function thinApprofondirSection(title: string, body: string): boolean {
  const cleanBody = body.trim()
  const remaining = bodyWithoutTitle(title, body)
  return (
    cleanBody.length < 80 ||
    wordCount(remaining || cleanBody) < 12 ||
    bodyRepeatsTitle(title, body)
  )
}

function sourceTitleLeak(resources: ResourceServiceContract | undefined, writing: WritingContract, baseline: string): string | null {
  if (!resources) return null

  const narrative = normalize(diamondNarrativeText(writing)).replace(/[^a-z0-9]+/g, ' ')
  const baselineTokens = new Set(normalize(baseline).split(/[^a-z0-9]+/).filter(Boolean))
  for (const source of resources.public_sources) {
    const titleTokens = normalize(source.title)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 5 && !baselineTokens.has(token))
    for (let index = 0; index <= titleTokens.length - 3; index += 1) {
      const phrase = titleTokens.slice(index, index + 3).join(' ')
      if (narrative.includes(phrase)) {
        return source.title
      }
    }
  }

  return null
}

function repeatedSignalPhrase(normalizedText: string): string | null {
  const tokens = normalizedText
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const phraseCounts = new Map<string, number>()
  const signalWords = new Set([
    'acte',
    'preuve',
    'seuil',
    'observable',
    'decision',
    'trace',
    'marges',
    'hypothese',
    'opposable',
    'verifiable',
  ])

  for (let index = 0; index <= tokens.length - 8; index += 1) {
    const window = tokens.slice(index, index + 8)
    if (!window.some((token) => signalWords.has(token))) continue
    const phrase = window.join(' ')
    phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1)
  }

  for (const [phrase, count] of phraseCounts.entries()) {
    if (count >= 3) return phrase
  }

  return null
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

function meaningfulResonanceAnchors(resonance: ResonanceTraceContract): string[] {
  return Array.from(new Set([
    ...resonance.real_actors,
    ...resonance.institutions,
    resonance.structural_gap_fr,
    resonance.structural_contradiction_fr,
    resonance.structural_vulnerability_fr,
    resonance.diamond_thesis_fr,
    resonance.transition_signal_fr,
    ...resonance.source_signals.map((signal) => signal.signal_fr),
  ].map((item) => item.trim()).filter((item) => item.length >= 4)))
    .filter((item) => !/^(acteurs?|institutions?|contraintes?|preuves?|sources?|trace verifiable|fait observable)$/i.test(normalize(item)))
    .slice(0, 20)
}

function countAnchorsUsed(anchors: string[], normalizedText: string): number {
  return anchors.filter((anchor) => normalize(anchor).split(/\s+/).some((part) =>
    part.length >= 5 && normalizedText.includes(part),
  )).length
}

function qualifiedRegimeSignalsForGate(resonance: ResonanceTraceContract): Array<{ signal_fr: string; source_title: string }> {
  return resonance.source_signals.map((signal) => ({
    signal_fr: signal.public_signal_fr || signal.signal_fr,
    source_title: '',
  }))
}

function publicEvidenceVisible(resonance: ResonanceTraceContract, normalizedNarrativeText: string, baseline = ''): boolean {
  if (countRegimeSignalsUsed(qualifiedRegimeSignalsForGate(resonance), normalizedNarrativeText, baseline) > 0) return true

  const baselineTokens = new Set(normalize(baseline).split(/[^a-z0-9]+/).filter(Boolean))
  const genericEvidenceTokens = new Set([
    'source',
    'sources',
    'rapides',
    'disponibles',
    'preuve',
    'preuves',
    'factuel',
    'factuelle',
    'factuels',
    'lecture',
    'situation',
    'acteurs',
    'decision',
    'officielle',
    'contradiction',
    'documentee',
    'observable',
    'verifiable',
    'threshold',
    'military',
    'public',
    'published',
    'available',
  ])
  return resonance.qualified_evidence
    .filter((evidence) => evidence.can_drive_probability)
    .some((evidence) => {
      const tokens = normalize(evidence.public_label_fr)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 6 && !baselineTokens.has(token) && !genericEvidenceTokens.has(token))
      const uniqueTokens = Array.from(new Set(tokens))
      const tokenHits = uniqueTokens.filter((token) => normalizedNarrativeText.includes(token)).length
      if (tokenHits >= 3) return true

      for (let index = 0; index <= uniqueTokens.length - 2; index += 1) {
        const phrase = uniqueTokens.slice(index, index + 2).join(' ')
        if (normalizedNarrativeText.includes(phrase)) return true
      }

      return false
    })
}

function trajectoryVisibilityCount(input: QualityGateInput, normalizedPublicText: string): number {
  const trajectories = arrayValue(input.writing.trajectories)
  if (trajectories.length === 0) return 0
  const byType = [
    normalizedPublicText.includes('stabilisation') || normalizedPublicText.includes('clarification'),
    normalizedPublicText.includes('escalade') || normalizedPublicText.includes('tension accrue'),
    normalizedPublicText.includes('bascule') || normalizedPublicText.includes('regime shift') || normalizedPublicText.includes('rupture'),
  ].filter(Boolean).length
  const byTitle = trajectories.filter((trajectory) => {
    const title = normalize(trajectory.title_fr)
    return title && normalizedPublicText.includes(title)
  }).length
  return Math.max(byType, byTitle)
}

function probabilityVisible(input: QualityGateInput, normalizedPublicText: string): boolean {
  const probability = arrayValue(input.writing.probability_assessments)[0]
  if (!probability) return false
  const label = normalize(probability.probability_label_fr)
  return Boolean(
    (label && normalizedPublicText.includes(label)) ||
      normalizedPublicText.includes('probable') ||
      normalizedPublicText.includes('plausible') ||
      normalizedPublicText.includes('hypothese') ||
      normalizedPublicText.includes('hypothèse') ||
      normalizedPublicText.includes('etabli') ||
      normalizedPublicText.includes('établi')
  )
}

function probabilityStatusSectionTitles(writing: WritingContract): string[] {
  return arrayValue(writing.approfondir?.sections_fr)
    .map((section) => textValue(section.title))
    .filter((title) => {
      const normalizedTitle = normalize(title).replace(/[^a-z0-9]+/g, ' ').trim()
      return PROBABILITY_STATUS_SECTION_TITLES.includes(normalizedTitle)
    })
}

function isCausalAttributionFrame(input: QualityGateInput): boolean {
  return (
    input.interpretation.question_type === 'causal_attribution' ||
    input.interpretation.signals.some((signal) => signal === 'causal_attribution') ||
    normalize(input.interpretation.expected_answer_shape).includes('causal')
  )
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
  const narrativeText = lectureAndApprofondirText(input.writing)
  const normalizedNarrativeText = normalize(narrativeText)
  const publicDiamond = diamondText(input.writing)
  const normalizedDiamond = publicDiamond
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const resonance = input.resonance
  const theatreAnchors = meaningfulTheatreAnchors(input.theatre)
  const resonanceAnchors = meaningfulResonanceAnchors(resonance)
  const publicAnchorContract = resonanceAnchors.length > 0 ? resonanceAnchors : theatreAnchors
  const theatreAnchorsUsed = countAnchorsUsed(publicAnchorContract, normalizedText)
  const noisyResourcePattern = PUBLIC_RESOURCE_NOISE_PATTERNS.find((pattern) => pattern.test(text))
  const leakedSourceTitle = sourceTitleLeak(input.resources, input.writing, canonicalQuestionText(input.interpretation))
  const internalWritingPattern = PUBLIC_INTERNAL_WRITING_PATTERNS.find((pattern) => pattern.test(text))
  const gluedTrajectoryPattern = GLUED_TRAJECTORY_PATTERNS.find((pattern) => pattern.test(text))
  const repeatedSignal = repeatedSignalPhrase(normalizedNarrativeText)
  const defensiveOpeningPattern = DEFENSIVE_PUBLIC_OPENING_PATTERNS.find((pattern) =>
    pattern.test(textValue(input.writing.lecture?.text_fr).slice(0, 320)) ||
    pattern.test(textValue(input.writing.situation_card?.insight_fr).slice(0, 320)),
  )
  const pressSummaryOpeningPattern = PRESS_SUMMARY_OPENING_PATTERNS.find((pattern) =>
    pattern.test(textValue(input.writing.lecture?.text_fr).slice(0, 360)) ||
    pattern.test(textValue(input.writing.situation_card?.insight_fr).slice(0, 360)),
  )
  const probabilityStatusTitles = probabilityStatusSectionTitles(input.writing)
  const abstractUnderstandingFallbackPattern = ABSTRACT_UNDERSTANDING_FALLBACK_PATTERNS.find((pattern) =>
    pattern.test(normalizedText),
  )
  const rawExternalExcerptPattern = RAW_EXTERNAL_EXCERPT_PATTERNS.find((pattern) =>
    pattern.test(text),
  )
  const approfondirSections = arrayValue(input.writing.approfondir?.sections_fr)
  const repeatedSection = approfondirSections.find((section) =>
    bodyRepeatsTitle(textValue(section.title), textValue(section.body)),
  )
  const thinSections = approfondirSections.filter((section) =>
    thinApprofondirSection(textValue(section.title), textValue(section.body)),
  )
  const leakedCausalFrame = !isCausalAttributionFrame(input)
    ? CAUSAL_FRAME_PUBLIC_PATTERNS.find((pattern) => pattern.test(normalizedText))
    : undefined

  if (hasRepeatedSubmittedSentence(textValue(input.writing.situation_card?.submitted_situation_fr))) {
    issues.push(issue(
      'error',
      'REPEATED_SUBMITTED_SITUATION',
      'Submitted situation repeats the same question; canonical dialogue must produce one clean public situation.',
      'writing.situation_card.submitted_situation_fr',
    ))
  }

  if (noisyResourcePattern) {
    issues.push(issue(
      'error',
      'PUBLIC_PROBATIVE_EVIDENCE_NOISE',
      `Public writing contains raw resource noise instead of qualified evidence: ${noisyResourcePattern.source}.`,
      'writing',
    ))
  }

  if (leakedSourceTitle) {
    issues.push(issue(
      'error',
      'PUBLIC_SOURCE_TITLE_IN_DIAMOND',
      `Diamond narrative copied a source title instead of translating it into a structural signal: ${leakedSourceTitle}.`,
      'writing',
    ))
  }

  if (internalWritingPattern) {
    issues.push(issue(
      'error',
      'PUBLIC_INTERNAL_WRITING_LEAK',
      `Public writing still exposes internal proof/status wording: ${internalWritingPattern.source}.`,
      'writing',
    ))
  }

  if (gluedTrajectoryPattern) {
    issues.push(issue(
      'warning',
      'PUBLIC_TRAJECTORIES_GLUED',
      `Trajectory signals are glued together in public narrative: ${gluedTrajectoryPattern.source}.`,
      'writing.trajectories',
    ))
  }

  if (repeatedSignal) {
    issues.push(issue(
      'warning',
      'PUBLIC_SIGNAL_PHRASE_REPEATED',
      `Public narrative repeats the same signal phrase across Lecture/Approfondir: ${repeatedSignal}.`,
      'writing.approfondir.sections_fr',
    ))
  }

  if (defensiveOpeningPattern) {
    issues.push(issue(
      'warning',
      'DEFENSIVE_PUBLIC_OPENING',
      `Public writing starts by explaining what it is not doing instead of entering the situation: ${defensiveOpeningPattern.source}.`,
      'writing.lecture',
    ))
  }

  if (pressSummaryOpeningPattern) {
    issues.push(issue(
      'error',
      'PRESS_SUMMARY_INSTEAD_OF_DIAMOND',
      `Public writing opens as a press summary instead of a diamond contradiction: ${pressSummaryOpeningPattern.source}.`,
      'writing.lecture',
    ))
  }

  if (probabilityStatusTitles.length >= 3) {
    issues.push(issue(
      'error',
      'PROBABILITY_STATUSES_AS_PUBLIC_SECTIONS',
      `Approfondir uses proof statuses as public section titles instead of structural diamond sections: ${probabilityStatusTitles.join(', ')}.`,
      'writing.approfondir.sections_fr',
    ))
  }

  if (abstractUnderstandingFallbackPattern) {
    issues.push(issue(
      'error',
      'ABSTRACT_UNDERSTANDING_FALLBACK_IN_PUBLIC_WRITING',
      `Public writing reused the abstract understand fallback instead of a situated diamond reading: ${abstractUnderstandingFallbackPattern.source}.`,
      'writing',
    ))
  }

  if (rawExternalExcerptPattern) {
    issues.push(issue(
      'error',
      'RAW_EXTERNAL_EXCERPT_IN_PUBLIC_WRITING',
      `Public writing leaked a raw external excerpt instead of translating it into a qualified public signal: ${rawExternalExcerptPattern.source}.`,
      'writing',
    ))
  }

  if (repeatedSection) {
    issues.push(issue(
      'error',
      'APPROFONDIR_SECTION_REPEATS_TITLE',
      `Approfondir section body repeats its title: ${repeatedSection.title}.`,
      'writing.approfondir.sections_fr',
    ))
  }

  if (thinSections.length >= 2) {
    issues.push(issue(
      'error',
      'APPROFONDIR_SECTIONS_TOO_THIN',
      `Approfondir has ${thinSections.length} sections that are empty, title-only or too thin to demonstrate the situation.`,
      'writing.approfondir.sections_fr',
    ))
  }

  if (leakedCausalFrame) {
    issues.push(issue(
      'error',
      'CAUSAL_FRAME_LEAKED_INTO_NON_CAUSAL_CARD',
      `Public writing imports a causal-attribution frame although the interpreted question is not causal: ${leakedCausalFrame.source}.`,
      'writing',
    ))
  }

  if (countPublicUrls(text) > 1) {
    issues.push(issue(
      'error',
      'PUBLIC_URL_AVALANCHE',
      'Public writing contains too many raw URLs; resources must be condensed into qualified evidence labels.',
      'writing',
    ))
  }

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

  if (isTargetChoiceWithMaterial(input)) {
    if (hasRankableExtractedOptions(input) && !hasExplicitTargetRanking(normalizedText)) {
      issues.push(issue(
        'error',
        'TARGET_CHOICE_OPTIONS_NOT_RANKED',
        'Target-choice writing has extracted options but does not rank them as priority, secondary and deferred.',
        'writing',
      ))
    }

    const genericTargetChoice = TARGET_CHOICE_GENERIC_PATTERNS.find((pattern) => pattern.test(normalizedText))
    if (genericTargetChoice) {
      issues.push(issue(
        'error',
        'TARGET_CHOICE_RESOURCE_BYPASSED',
        `Target-choice writing fell back to a generic formula despite provided material: ${genericTargetChoice.source}.`,
        'writing',
      ))
    }

    const rawAudienceList = TARGET_CHOICE_RAW_AUDIENCE_PATTERNS.find((pattern) => pattern.test(text))
    const hasFunctionalFamilies =
      normalizedText.includes('usage individuel') &&
      normalizedText.includes('usage professionnel') &&
      normalizedText.includes('usage organisationnel')
    if (rawAudienceList && !hasFunctionalFamilies) {
      issues.push(issue(
        'error',
        'TARGET_CHOICE_RAW_AUDIENCE_LIST',
        `Target-choice writing copied raw resource audiences instead of normalizing functional families: ${rawAudienceList.source}.`,
        'writing',
      ))
    }

    const driftPhrase = RESOURCE_AS_OBJECT_PHRASES.find((phrase) => normalizedText.includes(phrase))
    if (driftPhrase) {
      issues.push(issue(
        'error',
        'TARGET_CHOICE_RESOURCE_AS_OBJECT',
        `Provided material replaced the target-choice question as an object of analysis: ${driftPhrase}.`,
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

  if (arrayValue(input.writing.diamond_sentences).length === 0) {
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

  if (arrayValue(input.writing.probability_assessments).length === 0) {
    issues.push(issue('warning', 'MISSING_PROBABILITY', 'Writing should state assertion status when evidence is incomplete.', 'writing.probability_assessments'))
  }

  if (arrayValue(input.writing.trajectories).length >= 3) {
    const visibleTrajectories = trajectoryVisibilityCount(input, normalizedNarrativeText)
    if (visibleTrajectories < 3) {
      issues.push(issue(
        'warning',
        'TRAJECTORIES_UNDERUSED_IN_NARRATIVE',
        'Trajectories exist in the contract but are not sufficiently visible in Lecture/Approfondir.',
        'writing.trajectories',
      ))
    }
  }

  if (arrayValue(input.writing.probability_assessments).length > 0 && !probabilityVisible(input, normalizedNarrativeText)) {
    issues.push(issue(
      'warning',
      'PROBABILITY_UNDERUSED_IN_NARRATIVE',
      'Probability assessment exists in the contract but is not visible enough in Lecture/Approfondir.',
      'writing.probability_assessments',
    ))
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
    const regimeSignals = qualifiedRegimeSignalsForGate(input.resonance)
    const hasPublicEvidence = input.resonance.qualified_evidence
      .some((evidence) => evidence.can_drive_probability)
    const regimeSignalsUsed = countRegimeSignalsUsed(
      regimeSignals,
      lectureAndApprofondirText(input.writing),
      canonicalQuestionText(input.interpretation),
    )

    if (!hasReliableSource) {
      issues.push(issue(
        'warning',
        'FAST_SOURCES_LOW_RELIABILITY',
        'Fast sources are attached but none is marked primary or secondary.',
        'resources.public_sources',
      ))
    }

    const contextualResource = hasResourceRoleSignal(input, 'context_for_question')
    if (!contextualResource && input.resources.public_sources.length >= 2 && sourceHosts.length < 2) {
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

    if (regimeSignals.length >= 2 && regimeSignalsUsed === 0) {
      issues.push(issue(
        'error',
        'RESOURCE_REGIME_SIGNALS_UNDERUSED',
        'The resonance trace qualified regime signals, but public writing stays abstract instead of using them.',
        'writing.lecture',
      ))
    } else if (regimeSignals.length >= 3 && regimeSignalsUsed < 2) {
      issues.push(issue(
        'warning',
        'RESOURCE_REGIME_SIGNALS_TOO_WEAK',
        'The resonance trace qualified several regime signals, but public writing uses too few of them.',
        'writing.lecture',
      ))
    }

    if (hasPublicEvidence && !publicEvidenceVisible(input.resonance, normalizedNarrativeText, canonicalQuestionText(input.interpretation))) {
      issues.push(issue(
        'error',
        'SOURCE_PUBLIC_EVIDENCE_UNDERUSED',
        'The resonance trace qualified public evidence, but public writing only names sources or remains abstract instead of using the fact or its direct consequence.',
        'writing.approfondir',
      ))
    }

    const qualifiedSourceIds = new Set([
      ...input.resonance.source_signals.map((signal) => signal.source_id).filter(Boolean),
      ...input.resonance.qualified_evidence.map((evidence) => evidence.source_id).filter(Boolean),
    ])
    const questionBaseline = canonicalQuestionText(input.interpretation)
    const rejectedSourceLeak = buildResourceRegimeSignals(input.resources, 8)
      .filter((signal) => !signal.source_id || !qualifiedSourceIds.has(signal.source_id))
      .find((signal) => {
        const terms = discriminantTermsFrom(`${signal.signal_fr} ${signal.source_title}`, questionBaseline)
        const hits = terms.filter((term) => normalizedNarrativeText.includes(term))
        return hits.length >= 2
      })
    if (rejectedSourceLeak) {
      issues.push(issue(
        'error',
        'REJECTED_SOURCE_SIGNAL_IN_PUBLIC_WRITING',
        `Public writing carries vocabulary from a source the resonance trace did not qualify: ${rejectedSourceLeak.source_title || rejectedSourceLeak.source_name}.`,
        'writing.lecture',
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

  if (textValue(input.writing.situation_card?.main_vulnerability_fr).length < 30) {
    issues.push(issue('warning', 'WEAK_MAIN_VULNERABILITY', 'Main vulnerability looks too short or generic.', 'writing.situation_card.main_vulnerability_fr'))
  }

  const weakVulnerabilityPattern = WEAK_VULNERABILITY_PATTERNS.find((pattern) =>
    pattern.test(textValue(input.writing.situation_card?.main_vulnerability_fr)) ||
    pattern.test(arrayValue(input.writing.approfondir?.sections_fr).map((section) => textValue(section.body)).join(' ')),
  )
  if (weakVulnerabilityPattern) {
    issues.push(issue(
      'warning',
      'DOCUMENTARY_GAP_AS_VULNERABILITY',
      `A documentary gap is being exposed as the structural vulnerability: ${weakVulnerabilityPattern.source}.`,
      'writing.situation_card.main_vulnerability_fr',
    ))
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
