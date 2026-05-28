import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  ResourceServiceContract,
  RiskAdviceGuardContract,
  ScoringContract,
} from '@/lib/contracts'
import {
  buildFastResourceSearchPlansForDiagnostics,
} from '@/lib/resources/FastResourceRunner'
import type { ResourceItem } from '@/lib/resources/resourceContract'
import { filterRelevantResources } from '@/lib/resources/resourceRelevance'
import { buildResonanceTrace } from '@/lib/resonance'
import { composeDiamondWriting } from '@/lib/writing'

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

  if (includesLoose(resonance.transition_signal_fr, 'Morning Bid') || includesLoose(resonance.diamond_thesis_fr, 'Morning Bid')) {
    resonanceIssues.push({
      level: 'error',
      code: 'source_title_used_as_transition_signal',
      message: 'Resonance must not turn a source title into the transition signal or diamond thesis.',
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
  }]
}
