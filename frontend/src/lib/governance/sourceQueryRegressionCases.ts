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
  legacyFallbackPlanQueriesForDiagnostics,
} from '@/lib/resources/FastResourceRunner'
import { assessCompleteFactualSourceCoverage } from '@/lib/resources/completeSourceCoverage'
import type { ResourceItem } from '@/lib/resources/resourceContract'
import { buildGeneralDiamondDeepFallback } from '@/lib/editorial/diamond'
import { publicProbativeEvidence } from '@/lib/resources/probativeEvidenceSanitizer'
import { filterRelevantResources } from '@/lib/resources/resourceRelevance'
import type { SituationCard } from '@/lib/resources/resourceContract'
import { buildResonanceTrace } from '@/lib/resonance'
import { buildConcreteTheatre } from '@/lib/theatre'
import { composeDiamondWriting } from '@/lib/writing'
import { runQualityGate } from '@/lib/quality'
import { buildDiamondClarificationQuestions, validateDiamondContract } from './diamondValidation'

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

function resourcePlanWithDatelineEvidence(): ResourceServiceContract {
  const source: ResourceContract = {
    id: 'dateline-evidence-regression',
    title: 'Iran reviewing proposed agreement with the United States - Reuters',
    url: 'https://www.reuters.com/world/middle-east/iran-reviewing-us-agreement-example/',
    source: 'reuters.com',
    channel: 'news_agency',
    domain_relevance: ['geopolitics'],
    excerpt: "DUBAI, June 5 (Reuters) - Iran is reviewing a proposed agreement with the United States while Israel keeps military pressure visible.",
    retrieved_at: '2026-06-05T00:00:00.000Z',
    reliability: 'secondary',
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

function underusedPublicFactGroundingContract(): GroundingContract {
  return {
    ...notReadyGroundingContract(),
    source_status: 'available',
    current_facts: [{
      label_fr: 'une réunion publique datée confirme le seuil diplomatique entre les acteurs',
      source: 'resources',
      evidence_level: 'plausible',
      source_ids: ['underused-public-fact'],
    }],
    permissions: {
      ...notReadyGroundingContract().permissions,
      can_write_current_state: true,
      can_write_source_backed_claims: true,
      must_mark_provisional: false,
    },
  }
}

function interpretationForCurrentQuestionVariant(input: {
  raw: string
  submitted: string
  subject: string
  actors: string[]
  date?: string
}): InterpretationContract {
  return {
    ...interpretationForCurrentQuestion(),
    raw_input: input.raw,
    situation_soumise: input.submitted,
    header_subject: input.subject,
    object_of_analysis: input.subject,
    signals: ['current_status', 'external_facts'],
    entity_explanations: input.actors.map((actor) => ({
      label: actor,
      explanation: `Acteur public explicitement compris par le référent pour la question${input.date ? ` du ${input.date}` : ''}.`,
      certainty: 'known',
    })),
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
  const crowdedPlans = buildFastResourceSearchPlansForDiagnostics({
    interpretation: interpretationForCurrentQuestion(),
    resource_plan: {
      ...baseResourcePlan(),
      functional_needs: [
        {
          family: 'legitimation',
          label_fr: 'Legitimation',
          question_fr: 'Official frame',
          channels: ['official', 'news_agency', 'research'],
          suggested_queries: ['generic official statement', 'generic legal framework'],
          expected_evidence_fr: ['official statement'],
          priority: 'high',
        },
        {
          family: 'protection_conflict',
          label_fr: 'Conflict',
          question_fr: 'Conflict frame',
          channels: ['news_agency', 'local_media', 'official'],
          suggested_queries: ['generic controversy'],
          expected_evidence_fr: ['conflict signal'],
          priority: 'high',
        },
        {
          family: 'production_reproduction',
          label_fr: 'Infrastructure',
          question_fr: 'Infrastructure frame',
          channels: ['local_media', 'official', 'research'],
          suggested_queries: ['generic infrastructure dependency'],
          expected_evidence_fr: ['dependency'],
          priority: 'medium',
        },
      ],
    },
  })

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

  if (crowdedPlans.execution[0]?.label !== 'targeted' || !includesLoose(crowdedPlans.execution[0]?.query ?? '', 'Iran')) {
    issues.push({
      level: 'error',
      code: 'targeted_plan_crowded_out_by_functional_needs',
      message: 'FastResourceRunner must execute the current-question targeted plan before functional enrichment plans.',
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
    {
      title: 'WHO chief wraps up visit to Ebola-hit Congo, briefs president on response - Reuters',
      url: 'https://www.reuters.com/business/healthcare-pharmaceuticals/who-chief-meet-congo-president-group-warns-ebola-likely-spread-undetected-months-2026-06-01/',
      source: 'reuters.com',
      type: 'fast-source',
      excerpt: 'The head of the World Health Organization briefed the president of Democratic Republic of Congo on the Ebola outbreak response.',
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
  const abstractFallbackQuality = runQualityGate({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: baseResourcePlan(),
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: baseResourcePlan(),
    }),
    scoring: scoringForRegression(),
    writing: {
      ...noSourceWriting,
      situation_card: {
        ...noSourceWriting.situation_card,
        main_vulnerability_fr: 'Le point fragile est le passage entre crainte, intention, capacité réelle et acte vérifiable.',
        asymmetry_fr: 'La tension peut être largement commentée, mais elle ne devient lisible qu’en identifiant qui peut réellement agir, bloquer ou légitimer.',
        key_signal_fr: 'Le signal clé serait un acte vérifiable : décision, refus, procédure, pression organisée, changement de calendrier ou prise de position qui modifie les marges d’action.',
      },
      lecture: {
        ...noSourceWriting.lecture,
        text_fr: 'La tension peut être largement commentée, mais elle ne devient lisible qu’en identifiant qui peut réellement agir, bloquer ou légitimer. Le point fragile est le passage entre crainte, intention, capacité réelle et acte vérifiable. Le signal clé serait un acte vérifiable : décision, refus, procédure, pression organisée, changement de calendrier ou prise de position qui modifie les marges d’action.',
      },
    },
  })
  const abstractFallbackIssues: SourceQueryRegressionResult['issues'] = []
  if (!abstractFallbackQuality.issues.some((issue) => issue.code === 'ABSTRACT_UNDERSTANDING_FALLBACK_IN_PUBLIC_WRITING')) {
    abstractFallbackIssues.push({
      level: 'error',
      code: 'abstract_understanding_fallback_not_rejected',
      message: 'QualityGate must reject the abstract understand fallback when it reaches public writing.',
    })
  }
  const sourceMobilizedQuality = runQualityGate({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: baseResourcePlan(),
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: baseResourcePlan(),
    }),
    scoring: scoringForRegression(),
    writing: {
      ...noSourceWriting,
      situation_card: {
        ...noSourceWriting.situation_card,
        insight_fr: 'La crise reste contenue ; sources mobilisées: apnews.com, aljazeera.com, politico.com.',
        asymmetry_fr: 'La crise reste contenue ; sources mobilisées: apnews.com, aljazeera.com, politico.com.',
      },
      lecture: {
        ...noSourceWriting.lecture,
        text_fr: 'La crise reste contenue ; sources mobilisées: apnews.com, aljazeera.com, politico.com. La lecture doit partir des faits publics, pas des noms de domaines.',
      },
    },
  })
  const sourceMobilizedIssues: SourceQueryRegressionResult['issues'] = []
  if (!sourceMobilizedQuality.issues.some((issue) => issue.code === 'PUBLIC_INTERNAL_WRITING_LEAK')) {
    sourceMobilizedIssues.push({
      level: 'error',
      code: 'source_domains_not_rejected',
      message: 'QualityGate must reject source-domain lists such as "sources mobilisées" in public writing.',
    })
  }
  const rawExternalExcerptQuality = runQualityGate({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: baseResourcePlan(),
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: baseResourcePlan(),
    }),
    scoring: scoringForRegression(),
    writing: {
      ...noSourceWriting,
      situation_card: {
        ...noSourceWriting.situation_card,
        insight_fr: 'Le premier appui public disponible indique : The Iranian fire comes after Israel launched strikes on Iran early Monday in the most-serious crossfire since an April 8 ceasefire was reached in the Iran war.',
      },
      lecture: {
        ...noSourceWriting.lecture,
        text_fr: 'For days, negotiations between Iran and the United States over the fragile ceasefire in the war had been stalled by the fighting between Israel and the region.',
      },
    },
  })
  const rawExternalExcerptIssues: SourceQueryRegressionResult['issues'] = []
  if (!rawExternalExcerptQuality.issues.some((issue) => issue.code === 'RAW_EXTERNAL_EXCERPT_IN_PUBLIC_WRITING')) {
    rawExternalExcerptIssues.push({
      level: 'error',
      code: 'raw_external_excerpt_not_rejected',
      message: 'QualityGate must reject raw English source excerpts in public writing.',
    })
  }
  const pressSummaryQuality = runQualityGate({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: baseResourcePlan(),
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: baseResourcePlan(),
    }),
    scoring: scoringForRegression(),
    writing: {
      ...noSourceWriting,
      situation_card: {
        ...noSourceWriting.situation_card,
        insight_fr: "Le dispositif est à un point critique où ses actions pourraient redéfinir son influence. Les décisions prises seront cruciales pour déterminer si la situation se stabilise.",
      },
      lecture: {
        ...noSourceWriting.lecture,
        text_fr: "Le dispositif est à un point critique où ses actions pourraient redéfinir son influence. Les décisions prises seront cruciales pour déterminer si la situation se stabilise.",
      },
    },
  })
  const pressSummaryIssues: SourceQueryRegressionResult['issues'] = []
  if (!pressSummaryQuality.issues.some((issue) => issue.code === 'PRESS_SUMMARY_INSTEAD_OF_DIAMOND')) {
    pressSummaryIssues.push({
      level: 'error',
      code: 'press_summary_opening_not_rejected',
      message: 'QualityGate must reject generic press-summary openings instead of treating them as diamond writing.',
    })
  }
  const thinApprofondirQuality = runQualityGate({
    interpretation: input.interpretation,
    theatre: theatreForCurrentQuestion(),
    resources: baseResourcePlan(),
    resonance: buildResonanceTrace({
      interpretation: input.interpretation,
      theatre: theatreForCurrentQuestion(),
      resources: baseResourcePlan(),
    }),
    scoring: scoringForRegression(),
    writing: {
      ...noSourceWriting,
      approfondir: {
        ...noSourceWriting.approfondir,
        sections_fr: [
          { id: 'reel', title: 'Ce que la situation est réellement', body: 'Ce qui tient' },
          { id: 'holds', title: 'Ce qui tient le système', body: 'Ce qui faiblit' },
          { id: 'weakens', title: 'Ce qui l’affaiblit', body: 'Ce qui pourrait escalader' },
          { id: 'escalates', title: 'Ce qui pourrait déclencher une escalade', body: 'Ce qui pourrait changer' },
          { id: 'shifts', title: 'Ce qui pourrait produire une bascule', body: 'Ce qu il faut surveiller' },
        ],
      },
    },
  })
  const thinApprofondirIssues: SourceQueryRegressionResult['issues'] = []
  if (!thinApprofondirQuality.issues.some((issue) => issue.code === 'APPROFONDIR_SECTIONS_TOO_THIN')) {
    thinApprofondirIssues.push({
      level: 'error',
      code: 'thin_approfondir_not_rejected',
      message: 'QualityGate must reject title-only or empty Approfondir sections before public display.',
    })
  }
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
  const datelineEvidence = publicProbativeEvidence(
    resourcePlanWithDatelineEvidence(),
    2,
    'Ou en est la guerre Iran usa israel au 05/06',
  )
  const datelineEvidenceIssues: SourceQueryRegressionResult['issues'] = []
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
  const underusedPublicFactValidation = validateDiamondContract(
    genericCurrentCardForValidation(),
    'geopolitics',
    {
      grounding: underusedPublicFactGroundingContract(),
      resources: {
        ...resourcePlanWithCleanPublicEvidence(),
        public_sources: [{
          id: 'underused-public-fact',
          title: 'Official warning follows emergency session',
          url: 'https://official.example/emergency-session',
          source: 'official.example',
          channel: 'official',
          domain_relevance: ['geopolitics'],
          excerpt: 'A dated public meeting confirmed the diplomatic threshold between the actors.',
          retrieved_at: '2026-06-08T00:00:00.000Z',
          reliability: 'primary',
        }],
      },
    },
  )
  const underusedPublicFactClarifications = buildDiamondClarificationQuestions(underusedPublicFactValidation.issues)
  const mechanicalFinalResources = resourcePlanWithSourceTitle(
    'Live Updates: Majority see public memorandum as security loss; ceasefire prompts doctrine rethink',
  )
  const mechanicalFinalCardValidation = validateDiamondContract(
    {
      ...genericCurrentCardForValidation(),
      insight_fr:
        'Dispositif exposent la tension, mais autorités compétentes décident si elle reste contenue, négociée ou convertie en nouveau seuil.',
      main_vulnerability_fr:
        'Le point fragile est La vulnérabilité centrale est le passage entre signaux publics et décision assumée.',
      asymmetry_fr:
        'Dispositif exposent la tension, mais autorités compétentes décident si elle reste contenue, négociée ou convertie.',
      lecture_systeme_fr:
        'Les faits publics retenus déplacent la lecture : Live Updates: Majority see public memorandum as security loss; ceasefire prompts doctrine rethink.',
      approfondir_fr:
        'Ce que la situation est réellement\nLes faits publics retenus déplacent la lecture : Live Updates: Majority see public memorandum as security loss; ceasefire prompts doctrine rethink.',
    },
    'geopolitics',
    {
      resources: mechanicalFinalResources,
    },
  )
  const mechanicalFinalCardQuestions = buildDiamondClarificationQuestions(mechanicalFinalCardValidation.issues)
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
  const uppercaseRawResonance = buildResonanceTrace({
    interpretation: uppercaseRawInterpretation,
    theatre: uppercaseRawTheatre,
    resources: baseResourcePlan(),
  })
  const releaseCurrentPlanIssues: SourceQueryRegressionResult['issues'] = []
  const releaseCurrentInterpretations = [
    interpretationForCurrentQuestionVariant({
      raw: 'Ou en sommes nous sur la guerre usa Iran au 02/06',
      submitted: 'Quelle est la situation actuelle de la guerre entre les États-Unis et l’Iran au 2 juin ?',
      subject: 'guerre États-Unis Iran',
      actors: ['Iran', 'États-Unis'],
      date: '2 juin',
    }),
    interpretationForCurrentQuestionVariant({
      raw: 'Où en sommes nous avec la guerre en entre Iran us israel 04/06',
      submitted: 'Quelle est la situation actuelle du conflit entre l’Iran, les États-Unis et Israël au 4 juin ?',
      subject: 'conflit Iran États-Unis Israël',
      actors: ['Iran', 'États-Unis', 'Israël'],
      date: '4 juin',
    }),
    interpretationForCurrentQuestionVariant({
      raw: 'Une crise géopolitique en développement ou en est la guerre entre Iran et usa au 08/06',
      submitted: 'Quelle est la situation actuelle de la guerre entre l’Iran et les États-Unis au 8 juin ?',
      subject: 'guerre Iran États-Unis',
      actors: ['Iran', 'États-Unis'],
      date: '8 juin',
    }),
  ]
  const releasePlans = releaseCurrentInterpretations.map((interpretation) =>
    buildFastResourceSearchPlansForDiagnostics({
      interpretation,
      resource_plan: baseResourcePlan(),
    }),
  )

  if (relevance.some((item) =>
    includesLoose(item.title ?? '', 'Bolivia') ||
    includesLoose(item.title ?? '', 'clean energy') ||
    includesLoose(item.title ?? '', 'Treasuries') ||
    includesLoose(item.title ?? '', 'Ebola-hit Congo')
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
    noisySourceWriting.situation_card.key_signal_fr,
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
  if (!includesLoose(cleanEvidencePublicText, 'avertissement officiel') ||
    !includesLoose(cleanEvidencePublicText, 'seuils militaires')) {
    cleanEvidenceIssues.push({
      level: 'error',
      code: 'clean_public_evidence_underused',
      message: 'A clean public evidence excerpt must become a qualified French public signal instead of leaking raw source wording.',
    })
  }
  if (includesLoose(cleanEvidencePublicText, 'An emergency session') ||
    includesLoose(cleanEvidencePublicText, 'official warnings between')) {
    cleanEvidenceIssues.push({
      level: 'error',
      code: 'clean_public_evidence_raw_english_leaked',
      message: 'Public writing must not leak raw English evidence excerpts.',
    })
  }
  if (!includesLoose(cleanEvidenceWriting.probability_assessments[0]?.probability_label_fr ?? '', 'Plausible')) {
    cleanEvidenceIssues.push({
      level: 'error',
      code: 'clean_public_evidence_not_plausible',
      message: 'A clean public evidence excerpt can support a plausible status while remaining revisable.',
    })
  }
  if (datelineEvidence.some((evidence) => includesLoose(evidence.public_label_fr, 'DUBAI') || includesLoose(evidence.public_label_fr, 'Reuters'))) {
    datelineEvidenceIssues.push({
      level: 'error',
      code: 'news_dateline_not_sanitized',
      message: 'Probative evidence must remove news-agency datelines before public writing.',
    })
  }
  if (!datelineEvidence.some((evidence) => includesLoose(evidence.public_label_fr, 'Iran is reviewing'))) {
    datelineEvidenceIssues.push({
      level: 'error',
      code: 'news_dateline_removed_public_fact',
      message: 'Dateline cleaning must preserve the underlying public fact.',
    })
  }
  if (!notReadyDiamondValidation.ok ||
    !notReadyDiamondValidation.issues.some((issue) =>
      issue.code === 'grounded_anti_hors_sol_current_facts_missing' && issue.level === 'warning'
    )) {
    diamondReadinessIssues.push({
      level: 'error',
      code: 'grounded_anti_hors_sol_missing_fact_blocks_generation',
      message: 'DiamondValidation must warn, not block, when a clear current/source-dependent card has no public current facts.',
    })
  }
  if (!nonProbativeDiamondValidation.ok ||
    !nonProbativeDiamondValidation.issues.some((issue) =>
      issue.code === 'grounded_anti_hors_sol_public_fact_missing' && issue.level === 'warning'
    )) {
    diamondReadinessIssues.push({
      level: 'error',
      code: 'grounded_anti_hors_sol_non_probative_sources_block_generation',
      message: 'DiamondValidation must warn, not block, when attached public sources do not become clean public facts.',
    })
  }
  if (!underusedPublicFactValidation.ok ||
    !underusedPublicFactValidation.issues.some((issue) =>
      issue.code === 'grounded_anti_hors_sol_public_fact_underused' && issue.level === 'warning'
    )) {
    diamondReadinessIssues.push({
      level: 'error',
      code: 'grounded_anti_hors_sol_underused_fact_blocks_generation',
      message: 'DiamondValidation may warn when a public fact is underused, but it must not block generation or ask the user to provide the spine.',
    })
  }
  if (underusedPublicFactClarifications.some((question) => includesLoose(question, 'colonne vertebrale'))) {
    diamondReadinessIssues.push({
      level: 'error',
      code: 'underused_fact_builds_blocking_clarification',
      message: 'Underused public facts are an internal writing/quality issue, not a user clarification about the card spine.',
    })
  }

  const mechanicalFinalCardIssues: SourceQueryRegressionResult['issues'] = []
  if (!mechanicalFinalCardValidation.issues.some((issue) => issue.code === 'mechanical_public_spine')) {
    mechanicalFinalCardIssues.push({
      level: 'error',
      code: 'mechanical_final_card_not_rejected',
      message: 'DiamondValidation must reject a final public card that exposes the mechanical spine after assembly.',
    })
  }
  if (!mechanicalFinalCardValidation.issues.some((issue) => issue.code === 'source_title_copied_into_public_card')) {
    mechanicalFinalCardIssues.push({
      level: 'error',
      code: 'copied_source_title_not_rejected',
      message: 'DiamondValidation must reject a final public card that copies a source title as the public fact.',
    })
  }
  if (mechanicalFinalCardQuestions.some((question) => includesLoose(question, 'sources rapides'))) {
    mechanicalFinalCardIssues.push({
      level: 'error',
      code: 'mechanical_error_returns_source_clarification',
      message: 'A mechanical final-card quality error must not be presented as a missing fast-source clarification.',
    })
  }
  if (!mechanicalFinalCardQuestions.some((question) => includesLoose(question, 'controle diamant') || includesLoose(question, 'contrôle diamant'))) {
    mechanicalFinalCardIssues.push({
      level: 'error',
      code: 'mechanical_error_missing_quality_block_message',
      message: 'A mechanical final-card quality error must be identified as a diamond quality block.',
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
    if (!uppercaseRawResonance.real_actors.some((actor) => includesLoose(actor, required))) {
      canonicalTheatreIssues.push({
        level: 'error',
        code: 'canonical_actor_lost_in_resonance',
        message: `ResonanceTrace must preserve canonical interpreted actors after normalized extraction: ${required}.`,
      })
    }
  }
  for (const forbidden of ['Iran États-Unis Israël', 'États-Unis Israël Iran']) {
    if (
      uppercaseRawTheatre.actors.some((actor) => includesLoose(actor, forbidden)) ||
      (uppercaseRawTheatre.named_actors ?? []).some((actor) => includesLoose(actor, forbidden))
    ) {
      canonicalTheatreIssues.push({
        level: 'error',
        code: 'canonical_actor_composite_kept',
        message: `ConcreteTheatreBuilder must not keep a composite actor when the component actors are already present: ${forbidden}.`,
      })
    }
  }

  releasePlans.forEach((plan, index) => {
    const interpretation = releaseCurrentInterpretations[index]
    const publicQuery = `${plan.subject} ${plan.targeted.query} ${plan.broad.query}`
    for (const requiredActor of interpretation.entity_explanations.map((entity) => entity.label)) {
      if (!includesLoose(publicQuery, requiredActor) &&
        !(includesLoose(requiredActor, 'États-Unis') && (includesLoose(publicQuery, 'usa') || includesLoose(publicQuery, 'us')))) {
        releaseCurrentPlanIssues.push({
          level: 'error',
          code: 'release_current_plan_lost_actor',
          message: `Fast source plan lost actor "${requiredActor}" for current release case "${interpretation.raw_input}".`,
        })
      }
    }
    if (includesLoose(publicQuery, 'trajectoire de la crise évoquée') ||
      includesLoose(publicQuery, 'situation évoquée') ||
      includesLoose(publicQuery, 'contexte évoqué')) {
      releaseCurrentPlanIssues.push({
        level: 'error',
        code: 'release_current_plan_uses_generic_subject',
        message: `Fast source plan used a generic subject for current release case "${interpretation.raw_input}".`,
      })
    }
    if (plan.execution[0]?.label !== 'targeted') {
      releaseCurrentPlanIssues.push({
        level: 'error',
        code: 'release_current_targeted_plan_not_first',
        message: `Fast source runner must execute the current-question targeted plan first for "${interpretation.raw_input}".`,
      })
    }
    const domains = plan.targeted.include_domains ?? []
    for (const expectedDomain of ['reuters.com', 'aljazeera.com', 'state.gov']) {
      if (!domains.includes(expectedDomain)) {
        releaseCurrentPlanIssues.push({
          level: 'error',
          code: 'release_current_missing_domain_channel',
          message: `Geopolitical fast source plan should keep ${expectedDomain} in the routed source channels.`,
        })
      }
    }
  })

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
  const legacyFallbackPlanQueries = legacyFallbackPlanQueriesForDiagnostics({
    interpretation: input.interpretation,
    resource_plan: {
      ...baseResourcePlan(),
      functional_needs: [{
        family: 'protection_conflict',
        label_fr: 'Conflict',
        question_fr: 'Conflict frame',
        channels: ['news_agency', 'local_media', 'official'],
        suggested_queries: ['Iran Israel United States latest military diplomatic warnings'],
        expected_evidence_fr: ['conflict signal'],
        priority: 'high',
      }],
    },
  })
  const legacyFallbackPlanIssues: SourceQueryRegressionResult['issues'] = []
  if (legacyFallbackPlanQueries.length < 2) {
    legacyFallbackPlanIssues.push({
      level: 'error',
      code: 'legacy_fallback_single_plan_only',
      message: 'Legacy resource fallback must use the existing execution plans, not only the first targeted query.',
    })
  }
  if (!legacyFallbackPlanQueries.some((candidate) => includesLoose(candidate, 'latest reliable sources'))) {
    legacyFallbackPlanIssues.push({
      level: 'error',
      code: 'legacy_fallback_missing_broad_plan',
      message: 'Legacy resource fallback must keep the broad current-source plan when fast sources are needed.',
    })
  }
  if (!legacyFallbackPlanQueries.some((candidate) => includesLoose(candidate, 'military diplomatic warnings'))) {
    legacyFallbackPlanIssues.push({
      level: 'error',
      code: 'legacy_fallback_missing_functional_plan',
      message: 'Legacy resource fallback must keep functional source plans after the targeted current-source plan.',
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

  const deepAnchorNoiseIssues: SourceQueryRegressionResult['issues'] = []
  const noisyDeepReading = buildGeneralDiamondDeepFallback({
    situation: 'Ou en est la guerre usa Iran au 05/06',
    sc: {
      ...genericCurrentCardForValidation(),
      submitted_situation_fr: 'Quelle est la situation actuelle du conflit entre les États-Unis et l’Iran au 5 juin ?',
      intent_context: {
        dominant_frame: 'geopolitical_crisis',
        surface_domain: 'geopolitics',
        interpreted_request: {
          intent_type: 'understand',
          domain: 'geopolitics',
          object_of_analysis: 'conflit États-Unis Iran',
        },
      },
      concrete_theatre: {
        anchors: [
          'Unis',
          'Iran',
          'la situation actuelle du conflit entre les États-Unis et l’Iran',
          'Sat, 30 May 2026 15:29:03 GMT',
          'Tue, 02 Jun 2026 11:25:51 GMT',
        ],
        actors: ['États-Unis', 'Iran'],
        institutions: ['administration américaine', 'autorités iraniennes'],
        procedures: [],
        places: [],
        dates: [],
        precedents: [],
        relays: [],
        blockers: [],
        mechanisms: ['canaux diplomatiques'],
        thresholds: ['déclaration officielle'],
        evidence_to_watch: ['déclaration officielle datée'],
        missing_anchors: [],
        domain: 'geopolitics',
      },
    } as unknown as SituationCard,
    resources: [],
  })
  for (const forbidden of ['Unis', 'Sat, 30 May', 'Tue, 02 Jun', 'la situation actuelle du conflit']) {
    if (includesLoose(noisyDeepReading.approfondir_fr, forbidden)) {
      deepAnchorNoiseIssues.push({
        level: 'error',
        code: 'deep_reading_anchor_noise_leaked',
        message: `Deep reading must not render raw anchor noise as concrete matter: ${forbidden}.`,
      })
    }
  }

  const deepCausalFrameLeakIssues: SourceQueryRegressionResult['issues'] = []
  const nonCausalCurrentDeepReading = buildGeneralDiamondDeepFallback({
    situation: 'Ou en est la guerre entre Iran et israel et usa le 09/06',
    sc: {
      ...genericCurrentCardForValidation(),
      submitted_situation_fr: 'Quelle est la situation actuelle du conflit entre l’Iran, Israël et les États-Unis au 9 juin ?',
      intent_context: {
        dominant_frame: 'geopolitical_crisis',
        surface_domain: 'geopolitics',
        interpreted_request: {
          intent_type: 'understand',
          domain: 'geopolitics',
          question_type: 'open_analysis',
          object_of_analysis: 'conflit Iran Israël États-Unis',
        },
      },
      concrete_theatre: {
        anchors: ['Iran', 'Israël', 'États-Unis', '9 juin'],
        actors: ['Iran', 'Israël', 'États-Unis'],
        institutions: ['administration américaine', 'gouvernement israélien', 'autorités iraniennes'],
        procedures: [],
        places: [],
        dates: ['9 juin'],
        precedents: [],
        relays: [],
        blockers: [],
        mechanisms: ['canaux diplomatiques', 'dispositifs militaires'],
        thresholds: ['déclaration officielle', 'frappe revendiquée'],
        evidence_to_watch: ['déclaration officielle datée', 'mouvement militaire vérifié'],
        missing_anchors: [],
        domain: 'geopolitics',
      },
    } as unknown as SituationCard,
    resources: [],
  })
  const nonCausalDeepText = `${nonCausalCurrentDeepReading.approfondir_fr} ${nonCausalCurrentDeepReading.approfondir_en}`
  for (const forbidden of [
    'qui manipule qui',
    'chaîne d’entraînement',
    'influence et décision',
    'a-t-il convaincu',
    'entraîné',
    'manipulated another',
    'political entrainment',
    'dragged by an ally',
  ]) {
    if (includesLoose(nonCausalDeepText, forbidden)) {
      deepCausalFrameLeakIssues.push({
        level: 'error',
        code: 'deep_reading_causal_frame_leaked',
        message: `A non-causal current-status deep reading must not import causal attribution wording: ${forbidden}.`,
      })
    }
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
    id: 'quality-gate-rejects-abstract-understand-fallback',
    ok: abstractFallbackIssues.length === 0,
    query: abstractFallbackQuality.issues.map((issue) => issue.code).join(' | '),
    subject: 'writing/quality situated lecture',
    issues: abstractFallbackIssues,
  }, {
    id: 'quality-gate-rejects-source-domain-list-writing',
    ok: sourceMobilizedIssues.length === 0,
    query: sourceMobilizedQuality.issues.map((issue) => issue.code).join(' | '),
    subject: 'writing/quality source facts not source domains',
    issues: sourceMobilizedIssues,
  }, {
    id: 'quality-gate-rejects-raw-external-excerpt-writing',
    ok: rawExternalExcerptIssues.length === 0,
    query: rawExternalExcerptQuality.issues.map((issue) => issue.code).join(' | '),
    subject: 'writing/quality source facts not raw excerpts',
    issues: rawExternalExcerptIssues,
  }, {
    id: 'quality-gate-rejects-press-summary-opening',
    ok: pressSummaryIssues.length === 0,
    query: pressSummaryQuality.issues.map((issue) => issue.code).join(' | '),
    subject: 'writing/quality diamond opening',
    issues: pressSummaryIssues,
  }, {
    id: 'quality-gate-rejects-thin-approfondir',
    ok: thinApprofondirIssues.length === 0,
    query: thinApprofondirQuality.issues.map((issue) => issue.code).join(' | '),
    subject: 'writing/quality approfondir completeness',
    issues: thinApprofondirIssues,
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
    id: 'news-dateline-evidence-is-sanitized',
    ok: datelineEvidenceIssues.length === 0,
    query: datelineEvidence.map((evidence) => evidence.public_label_fr).join(' | '),
    subject: 'probative evidence sanitizer',
    issues: datelineEvidenceIssues,
  }, {
    id: 'diamond-validation-grounded-anti-hors-sol',
    ok: diamondReadinessIssues.length === 0,
    query: notReadyDiamondValidation.issues.map((issue) => issue.code).join(' | '),
    subject: 'DiamondValidation + GroundingContract',
    issues: diamondReadinessIssues,
  }, {
    id: 'diamond-validation-rejects-mechanical-final-card',
    ok: mechanicalFinalCardIssues.length === 0,
    query: mechanicalFinalCardValidation.issues.map((issue) => issue.code).join(' | '),
    subject: 'DiamondValidation final public card',
    issues: mechanicalFinalCardIssues,
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
    id: 'release-current-questions-keep-routed-source-plans',
    ok: releaseCurrentPlanIssues.length === 0,
    query: releasePlans.map((plan) => plan.targeted.query).join(' | '),
    subject: releasePlans.map((plan) => plan.targeted.include_domains?.join(',') ?? '').join(' | '),
    issues: releaseCurrentPlanIssues,
  }, {
    id: 'fast-runner-keeps-plan-specific-results',
    ok: planSpecificIssues.length === 0,
    query: planSpecificResults.map((item) => item.title).join(' | '),
    subject: 'plan-specific filtering',
    issues: planSpecificIssues,
  }, {
    id: 'fast-runner-legacy-fallback-uses-execution-plans',
    ok: legacyFallbackPlanIssues.length === 0,
    query: legacyFallbackPlanQueries.join(' | '),
    subject: 'resources fallback plan coverage',
    issues: legacyFallbackPlanIssues,
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
  }, {
    id: 'deep-reading-filters-non-material-anchors',
    ok: deepAnchorNoiseIssues.length === 0,
    query: noisyDeepReading.approfondir_fr.slice(0, 240),
    subject: 'writing/approfondir anchor hygiene',
    issues: deepAnchorNoiseIssues,
  }, {
    id: 'deep-reading-does-not-import-causal-frame',
    ok: deepCausalFrameLeakIssues.length === 0,
    query: nonCausalCurrentDeepReading.approfondir_fr.slice(0, 240),
    subject: 'writing/quality context isolation',
    issues: deepCausalFrameLeakIssues,
  }]
}
