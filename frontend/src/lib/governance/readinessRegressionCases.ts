import type { ResourceServiceContract } from '../contracts'
import { situationReadinessGate, type ReadinessStatus } from '../input/situationReadinessGate'
import type { IntentContext, ResourceItem, SituationDomain } from '../resources/resourceContract'

type ReadinessRegressionCase = {
  id: string
  situation: string
  domain: SituationDomain
  resourcePlan?: ResourceServiceContract
  resources?: ResourceItem[]
  resourceAttempted?: boolean
  expectedStatus: ReadinessStatus
  expectedReason?: string
  notes: string
}

type ReadinessRegressionResult = {
  case_id: string
  ok: boolean
  status: ReadinessStatus
  reason: string
  expected_status: ReadinessStatus
  expected_reason?: string
  notes: string
}

function intentContextFor(testCase: ReadinessRegressionCase): IntentContext {
  return {
    surface_domain: testCase.domain,
    dominant_frame: testCase.domain === 'startup_vc' ? 'startup_target_choice' : 'strategic_decision',
    decision_type: 'compare_options',
    needs_clarification: false,
    clarification_focus: [],
    questions: [],
    signals: ['readiness_regression'],
    interpreted_request: {
      intent_type: 'decide',
      question_type: 'comparison',
      object_of_analysis: testCase.situation,
      user_question: testCase.situation,
      implicit_tension: 'arbitrage stratégique entre options connues',
      domain: testCase.domain,
      needs_clarification: false,
      confidence: 0.82,
      signals: ['readiness_regression'],
    },
  }
}

function resourcePlanWithOptions(
  sourceType: 'document' | 'private_plug' | 'manual_text',
  labels: string[],
): ResourceServiceContract {
  return {
    status: 'available',
    policy: 'internal_context_ok',
    needs_web: false,
    policy_reason_fr: 'Options extraites depuis une ressource utilisateur qualifiée.',
    functional_needs: [],
    requested_urls: [],
    extracted_urls: [],
    fallback_searches: [],
    resources: [],
    public_sources: [],
    extracted_options: labels.map((label, index) => ({
      id: `known-option-${index + 1}`,
      label_fr: label,
      kind: 'strategic_option',
      status: 'established',
      source_type: sourceType,
      evidence_fr: [`Option fournie par ${sourceType}`],
    })),
    internal_notes: ['readiness_regression_resource_options'],
    trace: {
      service: 'ReadinessRegressionResourcePlan',
      version: 'v1',
      status: 'ok',
      notes: [`extracted_options=${labels.length}`],
    },
  }
}

function urlExtractPlan(url: string): ResourceServiceContract {
  return {
    status: 'partial',
    policy: 'url_extract_required',
    needs_web: true,
    policy_reason_fr: 'Une URL fournie doit etre exploitee par extraction ou recherche de domaine avant de conclure.',
    functional_needs: [],
    requested_urls: [`https://${url}`],
    extracted_urls: [],
    fallback_searches: [],
    resources: [],
    public_sources: [],
    extracted_options: [],
    internal_notes: ['readiness_regression_url_extract_required'],
    trace: {
      service: 'ReadinessRegressionResourcePlan',
      version: 'v1',
      status: 'partial',
      notes: ['requested_urls=1', 'resources=0'],
    },
  }
}

export const READINESS_REGRESSION_CASES: ReadinessRegressionCase[] = [
  {
    id: 'strategic-options-known-from-document',
    domain: 'governance',
    situation: 'Décision stratégique avec plusieurs options pour une organisation : quelle option prioriser ?',
    resourcePlan: resourcePlanWithOptions('document', [
      'centraliser la décision',
      'déléguer aux régions',
      'créer une cellule mixte',
    ]),
    expectedStatus: 'ready',
    notes:
      'Quand un document qualifie déjà les options, SituationReadinessGate ne doit pas redemander quelles options comparer.',
  },
  {
    id: 'target-options-known-from-plug',
    domain: 'startup_vc',
    situation: 'Quelle cible prioriser pour le lancement ?',
    resourcePlan: resourcePlanWithOptions('private_plug', [
      'PME industrielles',
      'directions risque',
      'cabinets de conseil',
    ]),
    expectedStatus: 'ready',
    notes:
      'Le comportement doit valoir pour Plug autant que pour URL : les options extraites remplacent la clarification bloquante.',
  },
  {
    id: 'target-choice-bare-domain-material',
    domain: 'startup_vc',
    situation: 'Décision stratégique avec plusieurs options pour ma start up situationcard.com, quelle est la meilleure cible premiers utilisateurs ?',
    expectedStatus: 'ready',
    notes:
      'Un domaine nu fourni dans la question compte comme matière produit ; la gate ne doit pas redemander une URL.',
  },
  {
    id: 'url-context-attempted-without-site-brief-stops-hors-sol',
    domain: 'startup_vc',
    situation: 'Une décision stratégique avec plusieurs options pour aerocalm.com vendre le brevet ou exploiter cette innovation',
    resourcePlan: urlExtractPlan('aerocalm.com'),
    resources: [],
    resourceAttempted: true,
    expectedStatus: 'ask_user',
    expectedReason: 'site_not_understood',
    notes:
      'Après tentative de lecture d’un domaine fourni comme matière, SC ne doit pas produire une carte hors-sol si aucun site-brief exploitable n’existe.',
  },
  {
    id: 'strategic-options-missing-without-resource',
    domain: 'governance',
    situation: 'Décision stratégique avec plusieurs options pour une organisation : quelle option prioriser ?',
    expectedStatus: 'ask_user',
    expectedReason: 'strategic_options_missing',
    notes:
      'Le garde-fou inverse reste nécessaire : sans options extraites ni matière fournie, la clarification peut encore bloquer.',
  },
]

export function runReadinessRegressionCases(): ReadinessRegressionResult[] {
  return READINESS_REGRESSION_CASES.map((testCase) => {
    const result = situationReadinessGate({
      situation: testCase.situation,
      intentContext: intentContextFor(testCase),
      resources: testCase.resources,
      resourcePlan: testCase.resourcePlan,
      resourceAttempted: testCase.resourceAttempted,
    })
    const ok =
      result.status === testCase.expectedStatus &&
      (!testCase.expectedReason || result.reason === testCase.expectedReason)

    return {
      case_id: testCase.id,
      ok,
      status: result.status,
      reason: result.reason,
      expected_status: testCase.expectedStatus,
      expected_reason: testCase.expectedReason,
      notes: testCase.notes,
    }
  })
}
