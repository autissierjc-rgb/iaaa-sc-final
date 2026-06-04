import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  GroundingContract,
  ResourceContract,
  ResourceServiceContract,
  RiskAdviceGuardContract,
  ScoringContract,
} from '@/lib/contracts'
import {
  buildFastResourceSearchPlansForDiagnostics,
  filterFastResourceResultsByPlanForDiagnostics,
} from '@/lib/resources/FastResourceRunner'
import { assessCompleteFactualSourceCoverage } from '@/lib/resources/completeSourceCoverage'
import type { ResourceItem } from '@/lib/resources/resourceContract'
import { filterRelevantResources } from '@/lib/resources/resourceRelevance'
import type { SituationCard } from '@/lib/resources/resourceContract'
import { buildResonanceTrace } from '@/lib/resonance'
import { buildConcreteTheatre } from '@/lib/theatre'
import { composeDiamondWriting } from '@/lib/writing'
import { validateDiamondContract } from './diamondValidation'

export type SourceQueryRegressionResult = {
  id: string
  ok: boolean
  query: string
  subject: string
  issues: Array<{
    level: 'error'
    code: string
    message: string
  }>
}

function baseResourcePlan(): ResourceServiceContract {
  return {
    status: 'partial',
    policy: 'fast_sources_required',
    needs_web: true,
    policy_reason_fr: 'Regression source query.',
    functional_needs: [],
    requested_urls: [],
    extracted_urls: [],
    fallback_searches: ['la trajectoire de la crise évoquée latest reliable sources'],
    resources: [],
    public_sources: [],
    extracted_options: [],
    internal_notes: [],
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function resourcePlanWithSourceTitle(title: string): ResourceServiceContract {
  return {
    ...baseResourcePlan(),
    status: 'available',
    resources: [{
      id: 'source-title-regression',
      title,
      url: 'https://www.reuters.com/world/middle-east/example',
      source: 'reuters.com',
      channel: 'news_agency',
      domain_relevance: ['geopolitics'],
      excerpt: 'Iran, Israel and the United States remain central to the diplomatic and military threshold.',
      retrieved_at: '2026-05-28T00:00:00.000Z',
      reliability: 'secondary',
    }],
    public_sources: [{
      id: 'source-title-regression',
      title,
      url: 'https://www.reuters.com/world/middle-east/example',
      source: 'reuters.com',
      channel: 'news_agency',
      domain_relevance: ['geopolitics'],
      excerpt: 'Iran, Israel and the United States remain central to the diplomatic and military threshold.',
      retrieved_at: '2026-05-28T00:00:00.000Z',
      reliability: 'secondary',
    }],
  }
}

function resourcePlanWithNoisyReutersExcerpt(): ResourceServiceContract {
  const source: ResourceContract = {
    id: 'noisy-reuters-excerpt-regression',
    title: 'Exclusive: US carries out new strikes in Iran against military site, official says - Reuters',
    url: 'https://www.reuters.com/world/middle-east/us-iran-strikes-example/',
    source: 'reuters.com',
    channel: 'news_agency',
    domain_relevance: ['geopolitics'],
    excerpt: '# Exclusive: US carries out new strikes in Iran against military site, official says. Exclusive news, data and analytics from Reuters. Iran and the United States remain central to the military threshold.',
    retrieved_at: '2026-06-02T00:00:00.000Z',
    reliability: 'secondary',
  }

  return {
    ...baseResourcePlan(),
    status: 'available',
    resources: [source],
    public_sources: [source],
  }
}

function resourcePlanWithCleanPublicEvidence(): ResourceServiceContract {
  const source: ResourceContract = {
    id: 'clean-public-evidence-regression',
    title: 'Official warning follows emergency session',
    url: 'https://official.example/emergency-session',
    source: 'official.example',
    channel: 'official',
    domain_relevance: ['geopolitics'],
    excerpt: 'An emergency session followed official warnings between Iran, Israel and the United States over military thresholds.',
    retrieved_at: '2026-06-04T00:00:00.000Z',
    reliability: 'primary',
  }

  return {
    ...baseResourcePlan(),
    status: 'available',
    resources: [source],
    public_sources: [source],
  }
}

function notReadyGroundingContract(): GroundingContract {
  return {
    understood_question_fr: 'Où en sommes-nous sur la guerre entre les États-Unis et l’Iran au 2 juin ?',
    object_fr: 'guerre États-Unis Iran',
    source_status: 'missing',
    current_facts: [],
    options: [],
    actors: ['Iran', 'États-Unis'],
    institutions: ['administration américaine', 'autorités iraniennes'],
    constraints: [],
    missing_evidence_fr: ['source publique datée'],
    permissions: {
      can_write_current_state: false,
      can_write_strategy: false,
      can_write_options: false,
      can_write_source_backed_claims: false,
      must_mark_provisional: true,
    },
    trace: {
      service: 'GroundingContractBuilder',
      version: 'regression',
      duration_ms: 0,
      status: 'partial',
    },
  }
}

function notProbativePublicSourcesGroundingContract(): GroundingContract {
  return {
    ...notReadyGroundingContract(),
    source_status: 'available',
    permissions: {
      ...notReadyGroundingContract().permissions,
      can_write_current_state: true,
      can_write_source_backed_claims: true,
      must_mark_provisional: false,
    },
  }
}

function genericCurrentCardForValidation(): SituationCard {
  return {
    title_fr: 'guerre États-Unis Iran',
    title_en: 'US Iran war',
    submitted_situation_fr: 'Où en sommes-nous sur la guerre entre les États-Unis et l’Iran au 2 juin ?',
    submitted_situation_en: 'Where are we on the war between the United States and Iran on June 2?',
    insight_fr: 'La situation tient tant que Iran, États-Unis peuvent absorber l’écart entre récit, coût et décision ; elle bascule quand un acte transforme la riposte en seuil public.',
    insight_en: '',
    main_vulnerability_fr: 'Le point fragile est le mécanisme qui transforme la frappe, la riposte ou la négociation en seuil officiel.',
    main_vulnerability_en: '',
    asymmetry_fr: 'Iran, États-Unis exposent la tension, mais administration américaine, autorités iraniennes décident si elle reste contenue.',
    asymmetry_en: '',
    state_index_final: 60,
    state_label_fr: 'Vigilance',
    state_label_en: 'Watch',
    radar: [],
    astrolabe_scores: [],
    axes: [],
    forces: [],
    tensions: [],
    constraints_fr: [],
    constraints_en: [],
    uncertainties_fr: [],
    uncertainties_en: [],
    movements_fr: [],
    movements_en: [],
    trajectories: [],
    lecture_systeme_fr: 'Lecture provisoire : la carte situe les seuils à vérifier, pas l’état factuel du jour.',
    lecture_systeme_en: '',
    approfondir_fr: '',
    approfondir_en: '',
  } as unknown as SituationCard
}

function theatreForCurrentQuestion(): ConcreteTheatreContract {
  return {
    domain: 'geopolitics',
    actors: ['Iran', 'Israël', 'États-Unis'],
    named_actors: ['Iran', 'Israël', 'États-Unis'],
    institutions: ['administration américaine', 'gouvernement israélien', 'autorités iraniennes'],
    dates: ['28 mai'],
    places: [],
    procedures: [],
    visible_actions: [],
    constraints: ['marges militaires et diplomatiques'],
    evidence: [],
    unknowns: [],
    missing_anchors: [],
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function safetyForRegression(): RiskAdviceGuardContract {
  return {
    domain_risk: 'normal',
    sensitive_domains: ['none'],
    advice_mode: 'analysis_only',
    allowed_outputs: ['analysis'],
    forbidden_outputs: [],
    human_review_required: false,
    emergency: false,
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function expertisesForCurrentQuestion(): ExpertisesMetiersContract {
  return {
    domain: 'geopolitics',
    domain_playbook: {
      id: 'geopolitics',
      domain: 'geopolitics',
      label_fr: 'Géopolitique',
      typical_actors: ['États-Unis', 'Iran', 'Israël'],
      typical_institutions: ['ONU', 'gouvernements concernés'],
      procedures_or_rules: ['déclaration officielle', 'Conseil de sécurité'],
      expected_evidence: ['source primaire', 'décision officielle', 'contradiction documentée'],
      common_blind_spots: ['source primaire manquante'],
      source_channels: ['official', 'news_agency'],
      probability_markers: ['hypothèse', 'plausible'],
      tipping_points: ['seuil public'],
      writing_anchors: ['preuve actualisée'],
    },
    metier_lenses: [],
    source_channels: ['official', 'news_agency'],
    evidence_to_seek: ['source primaire', 'décision officielle', 'contradiction documentée'],
    blind_spots_to_test: ['preuve actualisée manquante'],
    probability_markers: ['hypothèse'],
    writing_anchors: ['lecture structurelle provisoire'],
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function scoringForRegression(): ScoringContract {
  return {
    astrolabe: [],
    radar: [],
    state_index_final: 60,
    state_label: 'tension',
    scoring_warnings: [],
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function interpretationForCurrentQuestion(): InterpretationContract {
  const raw = 'Le 28/05 où en sommes nous avec la guerre usa Iran israel ?'
  return {
    raw_input: raw,
    reference_model: { provider: 'local', model: 'source-query-regression' },
    intent: 'understand',
    domain: 'geopolitics',
    question_type: 'open_analysis',
    situation_soumise: 'Quelle est la situation actuelle du conflit entre les États-Unis, l’Iran et Israël au 28 mai ?',
    header_domain: 'Géopolitique',
    header_subject: 'situation conflit États-Unis Iran Israël',
    angle: 'état actuel vérifiable',
    user_need: 'comprendre la situation actuelle',
    object_of_analysis: 'la trajectoire de la crise évoquée',
    expected_answer_shape: 'lecture prudente sourcée',
    must_answer_first: true,
    needs_clarification: false,
    entity_explanations: [],
    confidence: 0.72,
    signals: ['current_status', 'external_facts'],
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function interpretationForPatentChoice(): InterpretationContract {
  return {
    ...interpretationForCurrentQuestion(),
    raw_input: 'Une décision stratégique avec plusieurs options pour aerocalme.fr, vendre le brevet ou l’exploiter',
    domain: 'startup_market',
    situation_soumise: 'Quelle est la meilleure décision stratégique pour aerocalme.fr : vendre le brevet ou l’exploiter ?',
    header_domain: 'Entreprise',
    header_subject: 'décision stratégique brevet aerocalme.fr',
    angle: 'arbitrage brevet exploitation',
    user_need: 'comparer les options stratégiques',
    object_of_analysis: 'la décision de vendre ou exploiter le brevet',
    expected_answer_shape: 'comparaison structurée des options',
    signals: ['strategic_choice', 'external_context'],
  }
}

function patentChoiceTheatre(): ConcreteTheatreContract {
  return {
    domain: 'startup_market',
    actors: ['Une', 'AéroCalme'],
    named_actors: ['Une', 'AéroCalme'],
    institutions: ['institutions concernées'],
    dates: [],
    places: [],
    procedures: [],
    visible_actions: [],
    constraints: ['coût d’exploitation', 'protection du brevet', 'accès au marché'],
    evidence: [{
      label: 'Liberté d’exploitation d’un brevet : cadre juridique, FTO et rôle',
      level: 'plausible',
      source_ids: ['patent-title-regression'],
    }],
    unknowns: ['acteurs nommes'],
    missing_anchors: ['acteurs nommes'],
    trace: {
      service: 'SourceQueryRegression',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
    },
  }
}

function patentChoiceResources(): ResourceServiceContract {
  const siteBrief: ResourceContract = {
    id: 'aerocalme-site-brief',
    title: 'Fiche site - AéroCalme',
    url: 'https://aerocalme.fr/',
    source: 'aerocalme.fr',
    channel: 'company' as const,
    domain_relevance: ['startup_market'],
    excerpt: 'AéroCalme présente une innovation dont le modèle reste à arbitrer entre exploitation, licence ou cession.',
    retrieved_at: '2026-05-29T00:00:00.000Z',
    reliability: 'primary' as const,
  }
  const legalTitle: ResourceContract = {
    id: 'patent-title-regression',
    title: 'Liberté d’exploitation d’un brevet : cadre juridique, FTO et rôle',
    url: 'https://example.com/brevet-fto',
    source: 'example.com',
    channel: 'legal' as const,
    domain_relevance: ['law_justice', 'startup_market'],
    excerpt: 'La liberté d’exploitation doit être vérifiée avant de choisir entre licence, cession ou exploitation directe.',
    retrieved_at: '2026-05-29T00:00:00.000Z',
    reliability: 'secondary' as const,
  }
  return {
    ...baseResourcePlan(),
    status: 'available',
    resources: [siteBrief, legalTitle],
    public_sources: [siteBrief, legalTitle],
  }
}

function includesLoose(value: string, term: string): boolean {
  const normalize = (input: string) =>
    input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return normalize(value).includes(normalize(term))
}

export function runSourceQueryRegressionCases(): SourceQueryRegressionResult[] {
  const input = {
    interpretation: interpretationForCurrentQuestion(),
    resource_plan: baseResourcePlan(),
  }
  const plans = buildFastResourceSearchPlansForDiagnostics(input)
  const query = `${plans.targeted.query} ${plans.broad.query}`.trim()
  const issues: SourceQueryRegressionResult['issues'] = []

  for (const term of ['Iran', 'Israel', 'usa']) {
    if (!includesLoose(query, term)) {
      issues.push({
        level: 'error',
        code: 'source_query_missing_actor',
        message: `Current source query lost required actor: ${term}`,
      })
    }
  }

  if (includesLoose(query, 'trajectoire de la crise évoquée')) {
    issues.push({
      level: 'error',
      code: 'source_query_uses_generic_placeholder',
      message: 'Current source query must not use the generic interpreted object as search subject.',
    })
  }

  const offTopicItems: ResourceItem[] = [
    {
      title: 'Bolivia clears path to send troops onto streets to calm protests - Reuters',
      url: 'https://www.reuters.com/world/americas/bolivia-clears-path-send-troops-streets-calm-protests/',
      source: 'reuters.com',
      type: 'fast-source',
      excerpt: 'Bolivia authorized troop deployments after domestic protests.',
      reliability: 'tavily:fast',
    },
    {
      title: 'The clean energy backlash has reached North Carolina - Politico',
      url: 'https://www.politico.com/news/clean-energy-north-carolina',
      source: 'politico.com',
      type: 'fast-source',
      excerpt: 'A debate over clean energy projects in North Carolina.',
      reliability: 'tavily:fast',
    },
    {
      title: 'US Treasuries selloff exacerbated as mortgage investors hedge against rising yields - Reuters',
      url: 'https://www.reuters.com/markets/rates-bonds/us-treasuries-selloff-mortgage-investors/',
      source: 'reuters.com',
      type: 'fast-source',
      excerpt: 'Mortgage investors hedged against rising yields during a US rates selloff.',
      reliability: 'tavily:fast',
    },
  ]
  const relevantItems: ResourceItem[] = [
    {
      title: 'Iran says US and Israel crossed a red line as Security Council meets',
      url: 'https://www.reuters.com/world/middle-east/iran-us-israel-security-council/',
      source: 'reuters.com',
      type: 'fast-source',
      excerpt: 'Iran, the United States, Israel and the UN Security Council remain central to the crisis.',
      reliability: 'tavily:fast',
    },
  ]
  const relevance = filterRelevantResources([...offTopicItems, ...relevantItems], plans.targeted.query)
  const relevanceIssues: SourceQueryRegressionResult['issues'] = []
  const sourceTitle = 'Morning Bid: Three months, and counting - Reuters'
  const resonance = buildResonanceTrace({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: resourcePlanWithSourceTitle(sourceTitle),
  })
  const evidenceTitle = 'Global bonds take wild ride in May as Iran war shocks market - Reuters'
  const evidenceTitleResonance = buildResonanceTrace({
    interpretation: input.interpretation,
    theatre: {
      ...theatreForCurrentQuestion(),
      evidence: [{
        label: evidenceTitle,
        level: 'plausible',
        source_ids: ['source-title-regression'],
      }],
    },
    resources: resourcePlanWithSourceTitle(evidenceTitle),
  })
  const resonanceIssues: SourceQueryRegressionResult['issues'] = []
  const noSourceWriting = composeDiamondWriting({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: baseResourcePlan(),
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: baseResourcePlan(),
    }),
    safety: safetyForRegression(),
    expertises_metiers: expertisesForCurrentQuestion(),
    scoring: scoringForRegression(),
  })
  const noSourceIssues: SourceQueryRegressionResult['issues'] = []
  const noisySourceResources = resourcePlanWithNoisyReutersExcerpt()
  const noisySourceWriting = composeDiamondWriting({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: noisySourceResources,
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: noisySourceResources,
    }),
    safety: safetyForRegression(),
    expertises_metiers: expertisesForCurrentQuestion(),
    scoring: scoringForRegression(),
  })
  const noisySourceIssues: SourceQueryRegressionResult['issues'] = []
  const cleanEvidenceResources = resourcePlanWithCleanPublicEvidence()
  const cleanEvidenceWriting = composeDiamondWriting({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: cleanEvidenceResources,
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: cleanEvidenceResources,
    }),
    safety: safetyForRegression(),
    expertises_metiers: expertisesForCurrentQuestion(),
    scoring: scoringForRegression(),
  })
  const cleanEvidenceIssues: SourceQueryRegressionResult['issues'] = []
  const diamondReadinessIssues: SourceQueryRegressionResult['issues'] = []
  const notReadyDiamondValidation = validateDiamondContract(
    genericCurrentCardForValidation(),
    'geopolitics',
    {
      grounding: notReadyGroundingContract(),
      resources: baseResourcePlan(),
    },
  )
  const nonProbativeSourcePlan = resourcePlanWithNoisyReutersExcerpt()
  const nonProbativeDiamondValidation = validateDiamondContract(
    genericCurrentCardForValidation(),
    'geopolitics',
    {
      grounding: notProbativePublicSourcesGroundingContract(),
      resources: {
        ...nonProbativeSourcePlan,
        needs_web: false,
        policy: 'internal_context_ok',
      },
    },
  )
  const patentChoiceResonance = buildResonanceTrace({
    interpretation: interpretationForPatentChoice(),
    theatre: patentChoiceTheatre(),
    resources: patentChoiceResources(),
  })
  const patentChoicePublicText = [
    patentChoiceResonance.real_actors.join(' '),
    patentChoiceResonance.institutions.join(' '),
    patentChoiceResonance.structural_gap_fr,
    patentChoiceResonance.transition_signal_fr,
    patentChoiceResonance.structural_vulnerability_fr,
    patentChoiceResonance.diamond_thesis_fr,
  ].join(' ')
  const patentChoiceIssues: SourceQueryRegressionResult['issues'] = []
  const canonicalTheatreIssues: SourceQueryRegressionResult['issues'] = []
  const uppercaseRawInterpretation: InterpretationContract = {
    ...input.interpretation,
    raw_input: 'OU EN SOMMES NOUS AVEC LA GUERRE US ISRAEL Iran AU 03/06',
    situation_soumise: 'Quelle est la situation actuelle de la guerre entre les États-Unis, Israël et l’Iran au 3 juin ?',
    header_subject: 'situation guerre États-Unis Israël Iran',
    object_of_analysis: 'guerre États-Unis Israël Iran',
  }
  const uppercaseRawTheatre = buildConcreteTheatre({
    interpretation: uppercaseRawInterpretation,
    resources: baseResourcePlan(),
    expertises: expertisesForCurrentQuestion(),
  })

  if (relevance.some((item) =>
    includesLoose(item.title ?? '', 'Bolivia') ||
    includesLoose(item.title ?? '', 'clean energy') ||
    includesLoose(item.title ?? '', 'Treasuries')
  )) {
    relevanceIssues.push({
      level: 'error',
      code: 'off_topic_source_kept',
      message: 'Fast source relevance filter kept an off-topic major-media result.',
    })
  }

  if (!relevance.some((item) => includesLoose(item.title ?? '', 'Iran'))) {
    relevanceIssues.push({
      level: 'error',
      code: 'relevant_source_rejected',
      message: 'Fast source relevance filter rejected a source anchored in the requested actors.',
    })
  }

  const usaIranEquivalence = filterRelevantResources([{
    title: 'United States and Iran trade warnings as nuclear talks stall',
    url: 'https://www.reuters.com/world/middle-east/us-iran-nuclear-talks-warning/',
    source: 'reuters.com',
    type: 'fast-source',
    excerpt: 'The United States and Iran remain locked in a dispute over nuclear talks, sanctions and military thresholds.',
    reliability: 'tavily:fast',
  }], 'Où en sommes nous avec la guerre États-Unis Iran au 02/06 ?')
  if (usaIranEquivalence.length === 0) {
    relevanceIssues.push({
      level: 'error',
      code: 'usa_iran_equivalence_rejected',
      message: 'Fast source relevance must keep English US/United States sources for a French États-Unis/Iran query.',
    })
  }

  if (includesLoose(resonance.transition_signal_fr, 'Morning Bid') || includesLoose(resonance.diamond_thesis_fr, 'Morning Bid')) {
    resonanceIssues.push({
      level: 'error',
      code: 'source_title_used_as_transition_signal',
      message: 'Resonance must not turn a source title into the transition signal or diamond thesis.',
    })
  }

  if (
    includesLoose(evidenceTitleResonance.transition_signal_fr, 'Global bonds') ||
    includesLoose(evidenceTitleResonance.structural_vulnerability_fr, 'Global bonds') ||
    includesLoose(evidenceTitleResonance.diamond_thesis_fr, 'Global bonds')
  ) {
    resonanceIssues.push({
      level: 'error',
      code: 'theatre_evidence_source_title_used_as_spine',
      message: 'A theatre evidence label that is only a source title must not enter the resonance spine.',
    })
  }

  const navigationEvidence = 'Test Your News I.Q. 2026 Elections Election Results Election calendar White House Congress Supreme Court The latest AP-NORC polls Ground Game.'
  const navigationEvidenceResonance = buildResonanceTrace({
    interpretation: input.interpretation,
    theatre: {
      ...theatreForCurrentQuestion(),
      evidence: [{
        label: navigationEvidence,
        level: 'plausible',
        source_ids: ['navigation-noise-regression'],
      }],
    },
    resources: baseResourcePlan(),
  })
  if (
    includesLoose(navigationEvidenceResonance.transition_signal_fr, 'Test Your News') ||
    includesLoose(navigationEvidenceResonance.structural_vulnerability_fr, 'Election calendar') ||
    includesLoose(navigationEvidenceResonance.diamond_thesis_fr, 'AP-NORC')
  ) {
    resonanceIssues.push({
      level: 'error',
      code: 'navigation_noise_used_as_spine',
      message: 'Navigation boilerplate from a source must not enter the resonance spine.',
    })
  }

  const unsupportedInstitutionIssues: SourceQueryRegressionResult['issues'] = []
  const usaIranOnlyInterpretation: InterpretationContract = {
    ...input.interpretation,
    raw_input: 'Où en sommes nous avec la guerre usa Iran au 28/05 ?',
    situation_soumise: 'Quelle est la situation actuelle de la guerre entre les États-Unis et l’Iran au 28 mai ?',
    header_subject: 'situation actuelle guerre États-Unis Iran',
  }
  const usaIranOnlyResonance = buildResonanceTrace({
    interpretation: usaIranOnlyInterpretation,
    theatre: {
      ...theatreForCurrentQuestion(),
      actors: ['États-Unis', 'Iran'],
      named_actors: ['États-Unis', 'Iran'],
      institutions: ['administration américaine', 'autorités iraniennes', 'Conseil de sécurité de l’ONU'],
    },
    resources: baseResourcePlan(),
  })
  if (usaIranOnlyResonance.real_actors.some((actor) => includesLoose(actor, 'ONU')) ||
    usaIranOnlyResonance.institutions.some((institution) => includesLoose(institution, 'Conseil de sécurité'))) {
    unsupportedInstitutionIssues.push({
      level: 'error',
      code: 'unsupported_un_institution_injected',
      message: 'Resonance must not inject UN/Security Council into a USA/Iran question unless the question or sources mention it.',
    })
  }

  const noSourcePublicText = [
    noSourceWriting.situation_card.insight_fr,
    noSourceWriting.lecture.text_fr,
    noSourceWriting.approfondir.analysis_fr,
    ...noSourceWriting.approfondir.sections_fr.map((section) => section.body),
  ].join(' ')
  if (!includesLoose(noSourcePublicText, 'Lecture structurelle provisoire') && !includesLoose(noSourcePublicText, 'Sans source rapide exploitable')) {
    noSourceIssues.push({
      level: 'error',
      code: 'current_without_sources_not_qualified',
      message: 'A current/external question without usable fast sources must be visibly qualified as provisional structural reading.',
    })
  }
  if (includesLoose(noSourceWriting.probability_assessments[0]?.claim_fr ?? '', 'premiers appuis')) {
    noSourceIssues.push({
      level: 'error',
      code: 'current_without_sources_claims_evidence',
      message: 'A current/external question without usable fast sources must not claim first factual support.',
    })
  }

  const noisySourcePublicText = [
    noisySourceWriting.situation_card.insight_fr,
    noisySourceWriting.situation_card.main_vulnerability_fr,
    noisySourceWriting.lecture.text_fr,
    noisySourceWriting.approfondir.analysis_fr,
    ...noisySourceWriting.approfondir.sections_fr.map((section) => section.body),
  ].join(' ')
  for (const forbidden of [
    '# Exclusive',
    'Exclusive: US carries out',
    'Exclusive news, data and analytics',
    'Reuters transforme',
    'La lecture changerait si l’on observe Exclusive',
  ]) {
    if (includesLoose(noisySourcePublicText, forbidden)) {
      noisySourceIssues.push({
        level: 'error',
        code: 'raw_source_excerpt_leaked_into_public_writing',
        message: `Public writing must not turn source titles or scraped excerpts into the structural spine: ${forbidden}`,
      })
    }
  }
  if (!includesLoose(noisySourcePublicText, 'source primaire') || !includesLoose(noisySourcePublicText, 'contradiction documentée')) {
    noisySourceIssues.push({
      level: 'error',
      code: 'source_writing_missing_canonical_proof_gate',
      message: 'Sourced writing must keep the proof gate canonical instead of making a source title the missing proof.',
    })
  }

  const cleanEvidencePublicText = [
    cleanEvidenceWriting.situation_card.key_signal_fr,
    cleanEvidenceWriting.lecture.text_fr,
    cleanEvidenceWriting.approfondir.analysis_fr,
    ...cleanEvidenceWriting.approfondir.sections_fr.map((section) => section.body),
  ].join(' ')
  if (!includesLoose(cleanEvidencePublicText, 'emergency session') ||
    !includesLoose(cleanEvidencePublicText, 'official warnings')) {
    cleanEvidenceIssues.push({
      level: 'error',
      code: 'clean_public_evidence_underused',
      message: 'A clean public evidence excerpt must become a concrete writing anchor instead of falling back to generic proof wording.',
    })
  }
  if (!includesLoose(cleanEvidenceWriting.probability_assessments[0]?.probability_label_fr ?? '', 'Plausible')) {
    cleanEvidenceIssues.push({
      level: 'error',
      code: 'clean_public_evidence_not_plausible',
      message: 'A clean public evidence excerpt can support a plausible status while remaining revisable.',
    })
  }
  if (notReadyDiamondValidation.ok ||
    !notReadyDiamondValidation.issues.some((issue) => issue.code === 'grounded_anti_hors_sol_current_facts_missing')) {
    diamondReadinessIssues.push({
      level: 'error',
      code: 'grounded_anti_hors_sol_missing_fact_not_blocked',
      message: 'DiamondValidation must reject current/source-dependent cards when GroundingContract has no public current facts.',
    })
  }
  if (nonProbativeDiamondValidation.ok ||
    !nonProbativeDiamondValidation.issues.some((issue) => issue.code === 'grounded_anti_hors_sol_public_fact_missing')) {
    diamondReadinessIssues.push({
      level: 'error',
      code: 'grounded_anti_hors_sol_non_probative_sources_not_blocked',
      message: 'DiamondValidation must reject cards with attached public sources when none becomes a clean public fact, even if needs_web is false.',
    })
  }

  if (patentChoiceResonance.real_actors.some((actor) => actor === 'Une' || actor === 'Un')) {
    patentChoiceIssues.push({
      level: 'error',
      code: 'patent_choice_article_used_as_actor',
      message: 'Patent-choice resonance must not turn the French article "Une" into an actor.',
    })
  }
  for (const forbidden of ['Fiche site', 'Liberté d’exploitation', 'FTO', 'acteurs nommes', 'institutions concernées']) {
    if (includesLoose(patentChoicePublicText, forbidden)) {
      patentChoiceIssues.push({
        level: 'error',
        code: 'patent_choice_resource_label_used_as_spine',
        message: `Patent-choice resonance spine leaked a non-public anchor or resource title: ${forbidden}`,
      })
    }
  }
  if (!includesLoose(patentChoiceResonance.structural_gap_fr, 'valeur potentielle')) {
    patentChoiceIssues.push({
      level: 'error',
      code: 'strategic_choice_missing_domain_gap',
      message: 'Strategic-choice resonance must fall back to the asset/exploitation structural gap, not a generic missing actor placeholder.',
    })
  }

  for (const forbidden of ['SOMMES', 'NOUS', 'AVEC', 'SOMMES NOUS AVEC']) {
    if (
      uppercaseRawTheatre.actors.some((actor) => includesLoose(actor, forbidden)) ||
      (uppercaseRawTheatre.named_actors ?? []).some((actor) => includesLoose(actor, forbidden))
    ) {
      canonicalTheatreIssues.push({
        level: 'error',
        code: 'raw_question_fragment_used_as_actor',
        message: `ConcreteTheatreBuilder must not extract actors from raw question scaffolding: ${forbidden}.`,
      })
    }
  }
  for (const required of ['Iran', 'Israël', 'États-Unis']) {
    if (!uppercaseRawTheatre.actors.some((actor) => includesLoose(actor, required))) {
      canonicalTheatreIssues.push({
        level: 'error',
        code: 'canonical_actor_lost',
        message: `ConcreteTheatreBuilder must preserve canonical interpreted actors: ${required}.`,
      })
    }
  }

  const planSpecificResource: ResourceItem = {
    title: 'Official decision confirms public threshold',
    url: 'https://official.example/public-decision',
    source: 'official.example',
    type: 'web',
    excerpt: 'The official decision statement confirms the public threshold and its immediate procedural effect.',
    reliability: 'test',
  }
  const planSpecificResults = filterFastResourceResultsByPlanForDiagnostics(
    [[planSpecificResource]],
    ['official decision statement public threshold'],
    'customers pricing revenue adoption market product team pipeline competitors segmentation traction retention onboarding channel official decision statement public threshold',
    3,
  )
  const planSpecificIssues: SourceQueryRegressionResult['issues'] = []
  if (planSpecificResults.length === 0) {
    planSpecificIssues.push({
      level: 'error',
      code: 'plan_specific_resource_rejected',
      message: 'Fast resource runner must filter each plan result with its own plan query, not with the composite query from unrelated plans.',
    })
  }

  const longExcerptResource: ResourceItem = {
    title: 'Iran, Israel and United States trade warnings as talks stall',
    url: 'https://reuters.example/world/middle-east/current-threshold',
    source: 'reuters.example',
    type: 'web',
    excerpt: [
      'Markets moved sideways while unrelated policy debates continued in Europe and Asia without changing the requested crisis.',
      'Iran, Israel and the United States traded warnings after a dated official statement, making the military and diplomatic threshold the concrete fact to verify.',
      'Analysts also discussed commodities, elections, technology shares, energy prices, fiscal policy and other background signals that should not become the card spine.',
    ].join(' '),
    reliability: 'test',
  }
  const longExcerptResults = filterFastResourceResultsByPlanForDiagnostics(
    [[longExcerptResource]],
    ['Iran Israel United States warnings official statement military diplomatic threshold'],
    'Iran Israel United States current conflict',
    3,
  )
  const longExcerptIssues: SourceQueryRegressionResult['issues'] = []
  const longExcerpt = longExcerptResults[0]?.excerpt ?? ''
  if (!includesLoose(longExcerpt, 'traded warnings') || !includesLoose(longExcerpt, 'official statement')) {
    longExcerptIssues.push({
      level: 'error',
      code: 'fast_runner_did_not_extract_probative_sentence',
      message: 'FastResourceRunner must pass a relevant sentence, not the whole raw search blob, to the grounding contract.',
    })
  }
  if (longExcerpt.length > 220) {
    longExcerptIssues.push({
      level: 'error',
      code: 'fast_runner_probative_sentence_too_long',
      message: 'FastResourceRunner relevant excerpts must stay short enough to become probative public facts.',
    })
  }

  const approfondirSourceSectionIssues: SourceQueryRegressionResult['issues'] = []
  for (const section of noisySourceWriting.approfondir.sections_fr) {
    if (includesLoose(section.id, 'sources-rapides') ||
      includesLoose(section.id, 'ressources-produit') ||
      includesLoose(section.title, 'Sources rapides') ||
      includesLoose(section.title, 'Ressources produit')) {
      approfondirSourceSectionIssues.push({
        level: 'error',
        code: 'sources_rendered_inside_approfondir',
        message: 'Public sources must remain in the dedicated Resources surface, not as an Approfondir section.',
      })
    }
  }
  const approfondirPublicText = [
    noisySourceWriting.approfondir.analysis_fr,
    ...noisySourceWriting.approfondir.sections_fr.map((section) => `${section.title} ${section.body}`),
  ].join(' ')
  for (const forbidden of ['sources rapides disponibles', 'sources rapides attachées', 'reuters.com', 'aljazeera.com']) {
    if (includesLoose(approfondirPublicText, forbidden)) {
      approfondirSourceSectionIssues.push({
        level: 'error',
        code: 'source_listing_leaked_into_approfondir_text',
        message: `Approfondir may qualify proof status but must not list fast sources or source domains: ${forbidden}.`,
      })
    }
  }

  const completeCoverageIssues: SourceQueryRegressionResult['issues'] = []
  const agencySource: ResourceContract = {
    id: 'agency-source',
    title: 'Agency reference',
    url: 'https://reuters.example/current',
    source: 'reuters.example',
    channel: 'news_agency',
    domain_relevance: ['geopolitics'],
    retrieved_at: '2026-06-03T00:00:00.000Z',
    reliability: 'secondary',
  }
  const officialSource: ResourceContract = {
    id: 'official-source',
    title: 'Official statement',
    url: 'https://official.example/statement',
    source: 'official.example',
    channel: 'official',
    domain_relevance: ['geopolitics'],
    retrieved_at: '2026-06-03T00:00:00.000Z',
    reliability: 'primary',
  }
  const localSource: ResourceContract = {
    id: 'local-source',
    title: 'Local perspective',
    url: 'https://local.example/report',
    source: 'local.example',
    channel: 'local_media',
    domain_relevance: ['geopolitics'],
    retrieved_at: '2026-06-03T00:00:00.000Z',
    reliability: 'secondary',
  }
  const incompleteCompleteCoverage = assessCompleteFactualSourceCoverage([agencySource])
  const completeCoverage = assessCompleteFactualSourceCoverage([agencySource, officialSource, localSource])
  if (incompleteCompleteCoverage.ok || !incompleteCompleteCoverage.missing.includes('local_media') || !incompleteCompleteCoverage.missing.includes('official')) {
    completeCoverageIssues.push({
      level: 'error',
      code: 'complete_sc_accepts_single_agency_source',
      message: 'A complete factual SC must not treat one agency source as the full public evidence base.',
    })
  }
  if (!completeCoverage.ok) {
    completeCoverageIssues.push({
      level: 'error',
      code: 'complete_sc_rejects_channel_coverage',
      message: 'A complete factual SC should accept the canonical local/official/news-agency coverage base.',
    })
  }

  return [{
    id: 'current-question-uses-raw-source-query',
    ok: issues.length === 0,
    query,
    subject: plans.subject,
    issues,
  }, {
    id: 'current-question-rejects-off-topic-fast-sources',
    ok: relevanceIssues.length === 0,
    query: relevance.map((item) => item.title).join(' | '),
    subject: plans.subject,
    issues: relevanceIssues,
  }, {
    id: 'source-title-does-not-drive-resonance-transition',
    ok: resonanceIssues.length === 0,
    query: resonance.transition_signal_fr,
    subject: resonance.diamond_thesis_fr,
    issues: resonanceIssues,
  }, {
    id: 'usa-iran-question-does-not-inject-un',
    ok: unsupportedInstitutionIssues.length === 0,
    query: usaIranOnlyResonance.real_actors.join(', '),
    subject: usaIranOnlyResonance.institutions.join(', '),
    issues: unsupportedInstitutionIssues,
  }, {
    id: 'current-question-without-fast-sources-is-provisional',
    ok: noSourceIssues.length === 0,
    query: noSourceWriting.lecture.text_fr,
    subject: noSourceWriting.probability_assessments[0]?.probability_label_fr ?? '',
    issues: noSourceIssues,
  }, {
    id: 'raw-source-excerpts-do-not-drive-public-writing',
    ok: noisySourceIssues.length === 0,
    query: noisySourceWriting.approfondir.analysis_fr,
    subject: noisySourceWriting.probability_assessments[0]?.missing_proof_fr ?? '',
    issues: noisySourceIssues,
  }, {
    id: 'clean-public-evidence-drives-public-writing',
    ok: cleanEvidenceIssues.length === 0,
    query: cleanEvidenceWriting.situation_card.key_signal_fr,
    subject: cleanEvidenceWriting.probability_assessments[0]?.probability_label_fr ?? '',
    issues: cleanEvidenceIssues,
  }, {
    id: 'diamond-validation-grounded-anti-hors-sol',
    ok: diamondReadinessIssues.length === 0,
    query: notReadyDiamondValidation.issues.map((issue) => issue.code).join(' | '),
    subject: 'DiamondValidation + GroundingContract',
    issues: diamondReadinessIssues,
  }, {
    id: 'patent-choice-resource-labels-do-not-drive-spine',
    ok: patentChoiceIssues.length === 0,
    query: patentChoiceResonance.transition_signal_fr,
    subject: patentChoiceResonance.diamond_thesis_fr,
    issues: patentChoiceIssues,
  }, {
    id: 'concrete-theatre-respects-canonical-interpretation',
    ok: canonicalTheatreIssues.length === 0,
    query: uppercaseRawTheatre.actors.join(', '),
    subject: uppercaseRawInterpretation.situation_soumise,
    issues: canonicalTheatreIssues,
  }, {
    id: 'fast-runner-keeps-plan-specific-results',
    ok: planSpecificIssues.length === 0,
    query: planSpecificResults.map((item) => item.title).join(' | '),
    subject: 'plan-specific filtering',
    issues: planSpecificIssues,
  }, {
    id: 'fast-runner-extracts-probative-excerpt',
    ok: longExcerptIssues.length === 0,
    query: longExcerpt,
    subject: 'probative grounding excerpt',
    issues: longExcerptIssues,
  }, {
    id: 'approfondir-does-not-render-source-section',
    ok: approfondirSourceSectionIssues.length === 0,
    query: noisySourceWriting.approfondir.sections_fr.map((section) => `${section.id}:${section.title}`).join(' | '),
    subject: 'resources surface separation',
    issues: approfondirSourceSectionIssues,
  }, {
    id: 'complete-factual-sc-requires-source-channel-coverage',
    ok: completeCoverageIssues.length === 0,
    query: incompleteCompleteCoverage.note_fr,
    subject: completeCoverage.note_fr,
    issues: completeCoverageIssues,
  }]
}
