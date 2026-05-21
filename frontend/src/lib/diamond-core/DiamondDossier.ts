import type {
  ConcreteTheatreContract,
  DialogueGateContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  InquiryContract,
  LanguageCode,
  QualityGateContract,
  RadarScoreV2,
  ResourceServiceContract,
  RiskAdviceGuardContract,
  ScoringContract,
  SecurityAbuseGuardContract,
  TraceMeta,
  TreatmentPlanContract,
} from '../contracts'
import type { DialogueEvent } from '../intent/dialogueCanonicalizer'
import type { HumanCollectivePatternContext } from '../patterns/humanCollective'
import type { FastResourceRunnerResult } from '../resources/FastResourceRunner'
import type { ProbativeEvidence } from '../resources/probativeEvidenceSanitizer'
import type { TargetAudienceFamily } from '../resources/functionalResourceQualification'
import type { UserMaterialResourceRoleAssessment } from '../contracts/userMaterial'

export type DiamondDossierStatus =
  | 'ready'
  | 'needs_clarification'
  | 'blocked'
  | 'partial'

export type DiamondDossierInput = {
  raw_input: string
  original_input?: string
  dialogue_events?: DialogueEvent[]
  language?: LanguageCode
  interpretation_mode?: 'referent_llm' | 'local_contract'
  canonicalize_with_model?: boolean
  fetch_fast_resources?: boolean
  fast_resource_timeout_ms?: number
  max_fast_sources?: number
}

export type DiamondDossierResourceView = {
  plan: ResourceServiceContract
  fast_run: FastResourceRunnerResult
  user_material: UserMaterialResourceRoleAssessment
  target_audience_families: TargetAudienceFamily[]
  public_evidence: ProbativeEvidence[]
  requested_urls: string[]
  resource_input_text: string
}

export type DiamondDossierGrammar = {
  required_public_moves_fr: string[]
  forbidden_drifts_fr: string[]
  calibration_questions_fr: string[]
  expected_answer_shape_fr: string
}

export type DiamondDossier = {
  id: string
  status: DiamondDossierStatus
  language: LanguageCode
  canonical_situation: string
  header: {
    domain_fr: string
    subject_fr: string
  }
  interpretation: InterpretationContract
  treatment_plan?: TreatmentPlanContract
  dialogue: {
    events: DialogueEvent[]
    gate: DialogueGateContract
    canonicalizer_used: 'referent_llm' | 'local_contract' | 'none'
    next_question_fr?: string
  }
  security: SecurityAbuseGuardContract
  safety: RiskAdviceGuardContract
  expertises_metiers: ExpertisesMetiersContract
  patterns: HumanCollectivePatternContext
  resources: DiamondDossierResourceView
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  inquiry: InquiryContract
  quality_precheck: QualityGateContract
  grammar: DiamondDossierGrammar
  trace: TraceMeta
}

export type DiamondDossierBuildResult = {
  dossier: DiamondDossier
  radar: RadarScoreV2[]
}
