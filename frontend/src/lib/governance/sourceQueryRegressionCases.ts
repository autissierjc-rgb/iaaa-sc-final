import type { ConcreteTheatreContract, InterpretationContract, ResourceServiceContract } from '@/lib/contracts'
import {
  buildFastResourceSearchPlansForDiagnostics,
} from '@/lib/resources/FastResourceRunner'
import type { ResourceItem } from '@/lib/resources/resourceContract'
import { filterRelevantResources } from '@/lib/resources/resourceRelevance'
import { buildResonanceTrace } from '@/lib/resonance'

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
  }]
}
