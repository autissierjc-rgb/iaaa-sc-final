import type { InterpretationContract, ResourceServiceContract } from '@/lib/contracts'
import { buildFastResourceSearchPlansForDiagnostics } from '@/lib/resources/FastResourceRunner'

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

  return [{
    id: 'current-question-uses-raw-source-query',
    ok: issues.length === 0,
    query,
    subject: plans.subject,
    issues,
  }]
}
