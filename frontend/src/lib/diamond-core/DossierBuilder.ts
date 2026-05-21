import 'server-only'

import type {
  AstrolabeBranchV2,
  InterpretationContract,
  LanguageCode,
  QualityGateContract,
  RadarScoreV2,
  ResourceContract,
} from '../contracts'
import { runDialogueGate } from '../dialogue'
import { routeExpertisesMetiers } from '../expertisesMetiers'
import { buildBlindSpotInquiry } from '../inquiry'
import { buildCanonicalSituationFromDialogue, buildLocalCanonicalSituationFromDialogue, type DialogueEvent } from '../intent/dialogueCanonicalizer'
import { interpretSituation } from '../interpretation'
import { runContractQualityGate } from '../quality'
import { planResources } from '../resources'
import { runFastResourceRunner, type FastResourceRunnerResult } from '../resources/FastResourceRunner'
import { extractTargetAudienceFamiliesFromResources } from '../resources/functionalResourceQualification'
import { publicProbativeEvidence } from '../resources/probativeEvidenceSanitizer'
import { runRiskAdviceGuard } from '../safety'
import { computeStateV2 } from '../scoringV2'
import { runSecurityAbuseGuard } from '../security/SecurityAbuseGuard'
import { buildConcreteTheatre } from '../theatre'
import { classifyUserMaterialResourceRole } from '../contracts/userMaterial'
import { selectHumanCollectivePatterns } from '../patterns/humanCollective'
import type {
  DiamondDossier,
  DiamondDossierBuildResult,
  DiamondDossierGrammar,
  DiamondDossierInput,
  DiamondDossierStatus,
} from './DiamondDossier'

const ASTROLABE_TEMPLATE: Array<Omit<AstrolabeBranchV2, 'score' | 'is_primary' | 'rationale_fr'>> = [
  { branch: 'I', name_fr: 'Acteurs', name_en: 'Actors' },
  { branch: 'II', name_fr: 'Interets', name_en: 'Interests' },
  { branch: 'III', name_fr: 'Forces', name_en: 'Forces' },
  { branch: 'IV', name_fr: 'Tensions', name_en: 'Tensions' },
  { branch: 'V', name_fr: 'Contraintes', name_en: 'Constraints' },
  { branch: 'VI', name_fr: 'Incertitudes', name_en: 'Uncertainties' },
  { branch: 'VII', name_fr: 'Temps', name_en: 'Time' },
  { branch: 'VIII', name_fr: 'Perception', name_en: 'Perception' },
]

function normalizeLanguage(value?: LanguageCode): LanguageCode {
  return value ?? 'fr'
}

function dialogueText(events?: DialogueEvent[]): string {
  return (events ?? []).map((event) => `${event.type}: ${event.text}`).join('\n')
}

function extractUrls(value: string): string[] {
  const seen = new Set<string>()
  return (value.match(/\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? [])
    .map((url) => url.replace(/[),.;:!?]+$/g, ''))
    .filter((url) => {
      const key = url.toLowerCase()
      if (!key.includes('.') || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url.replace(/^www\./i, '')}`
}

function noopFastRunner(timeoutMs: number): FastResourceRunnerResult {
  return {
    resources: [],
    duration_ms: 0,
    status: 'skipped',
    note_fr: 'Runner sources rapides non lance pour cette construction de dossier.',
    provider: 'none',
    timeout_ms: timeoutMs,
  }
}

function branchScore(branch: AstrolabeBranchV2['branch'], counts: { actors: number; unknowns: number; constraints: number; evidence: number }) {
  if (branch === 'I') return counts.actors > 3 ? 2 : counts.actors > 0 ? 1 : 0
  if (branch === 'VI') return counts.unknowns > 3 ? 3 : counts.unknowns > 0 ? 2 : 1
  if (branch === 'V') return counts.constraints > 2 ? 2 : counts.constraints > 0 ? 1 : 0
  if (branch === 'IV') return counts.unknowns > 2 && counts.actors > 1 ? 2 : 1
  if (branch === 'III') return counts.evidence > 1 ? 2 : 1
  if (branch === 'VII') return 1
  return 1
}

function buildDraftAstrolabe(counts: { actors: number; unknowns: number; constraints: number; evidence: number }): AstrolabeBranchV2[] {
  return ASTROLABE_TEMPLATE.map((branch) => {
    const score = branchScore(branch.branch, counts)
    return {
      ...branch,
      score: score as AstrolabeBranchV2['score'],
      is_primary: branch.branch === 'VI' || (branch.branch === 'I' && counts.actors > 3),
      rationale_fr:
        branch.branch === 'VI'
          ? 'VI reste central tant que les angles morts doivent devenir enquete.'
          : 'Score provisoire calcule depuis le dossier diamant.',
    }
  })
}

function buildDraftRadar(counts: { actors: number; unknowns: number; constraints: number; evidence: number }): RadarScoreV2[] {
  const uncertainty = Math.min(90, 35 + counts.unknowns * 12)
  const impact = Math.min(85, 35 + counts.actors * 8 + counts.evidence * 3)
  const urgency = Math.min(75, 30 + counts.constraints * 8)
  const reversibility = Math.max(20, 75 - counts.constraints * 10)

  return [
    { axis: 'impact', score: impact, explanation_fr: 'Impact provisoire estime depuis acteurs, preuves et portee du theatre reel.' },
    { axis: 'urgency', score: urgency, explanation_fr: 'Urgence provisoire estimee depuis contraintes, temporalite et decision a venir.' },
    { axis: 'uncertainty', score: uncertainty, explanation_fr: 'Incertitude provisoire estimee depuis les angles morts et preuves manquantes.' },
    { axis: 'reversibility', score: reversibility, explanation_fr: 'Reversibilite provisoire estimee depuis les contraintes et couts de retour arriere.' },
  ]
}

function statusFor(input: {
  securityRisk: string
  dialogueCanGenerate: boolean
  qualityOk: boolean
  qualityIssueCount: number
}): DiamondDossierStatus {
  if (input.securityRisk === 'block' || input.securityRisk === 'throttle') return 'blocked'
  if (!input.dialogueCanGenerate) return 'needs_clarification'
  if (!input.qualityOk || input.qualityIssueCount > 0) return 'partial'
  return 'ready'
}

function buildGrammar(input: {
  interpretation: InterpretationContract
  audienceFamilies: string[]
}): DiamondDossierGrammar {
  const treatmentPlan = input.interpretation.treatment_plan
  const targetChoice = treatmentPlan?.trace_notes?.includes('target_choice_with_material')
  const familyLine = input.audienceFamilies.length > 0
    ? `Comparer les familles visibles comme options reelles : ${input.audienceFamilies.join(' ; ')}.`
    : 'Si les options ne sont pas etablies, le dire sans inventer de segments.'

  return {
    required_public_moves_fr: [
      'Faire voir le systeme, pas seulement resumer la demande.',
      'Nommer la vulnerabilite principale comme point de rupture testable.',
      'Afficher trois trajectoires distinctes : stabilisation, escalade, changement de regime.',
      'Donner un signal cle observable et surveillable.',
      'Rendre visibles les probabilites ou statuts d assertion quand les preuves manquent.',
      targetChoice ? familyLine : 'Relier la lecture a l intention canonique plutot qu a une categorie generique.',
    ],
    forbidden_drifts_fr: [
      'Ne pas reinterpreter la demande apres InterpretationService.',
      'Ne pas transformer une URL de contexte en objet principal.',
      'Ne pas coller des ressources brutes, liens, images ou listes techniques dans le public.',
      'Ne pas afficher les grilles internes, auteurs, labels de pattern ou explications de methode.',
      'Ne pas produire une notice defensive a la place d une lecture diamant.',
      ...(treatmentPlan?.must_not_reinterpret_fr ?? []),
    ],
    calibration_questions_fr: [
      'Est-ce que je vois mieux le systeme ?',
      'La vulnerabilite centrale est-elle precise et testable ?',
      'Est-ce que je sais quoi surveiller maintenant ?',
    ],
    expected_answer_shape_fr: input.interpretation.expected_answer_shape || 'Carte, lecture, approfondir, trajectoires, signal cle.',
  }
}

function emptyQualityPrecheck(): QualityGateContract {
  return {
    ok: true,
    issues: [],
    requires_section_regeneration: false,
    sections_to_regenerate: [],
    trace: {
      service: 'DiamondDossierPrecheck',
      version: 'v1',
      duration_ms: 0,
      status: 'ok',
      notes: ['Writing QualityGate will run after LLMDiamondWriter.'],
    },
  }
}

export async function buildDiamondDossier(input: DiamondDossierInput): Promise<DiamondDossierBuildResult> {
  const started = Date.now()
  const rawInput = input.raw_input.trim()
  const originalInput = input.original_input?.trim()
  const events = input.dialogue_events ?? []
  const language = normalizeLanguage(input.language)
  const materialText = [rawInput, originalInput ?? '', dialogueText(events)].filter(Boolean).join('\n')
  const security = runSecurityAbuseGuard({
    input_chars: materialText.length,
    estimated_cost_cents: input.fetch_fast_resources ? 40 : 15,
    text_sample: materialText.slice(0, 4000),
  })

  const modelCanonical = input.canonicalize_with_model === false
    ? null
    : await buildCanonicalSituationFromDialogue({
        rawSituation: rawInput,
        originalSituation: originalInput,
        dialogueEvents: events,
      })
  const localCanonical = buildLocalCanonicalSituationFromDialogue({
    rawSituation: rawInput,
    originalSituation: originalInput,
    dialogueEvents: events,
  })
  const canonicalSituation = modelCanonical?.canonical_situation || localCanonical?.canonical_situation || rawInput
  const canonicalizerUsed = modelCanonical?.canonical_situation
    ? 'referent_llm'
    : localCanonical?.canonical_situation
      ? 'local_contract'
      : 'none'
  const userMaterial = classifyUserMaterialResourceRole(materialText)
  const urls = extractUrls(materialText).map(normalizeUrl)
  const interpretation = await interpretSituation({
    raw_input: canonicalSituation,
    mode: input.interpretation_mode ?? 'referent_llm',
  })
  const interpretationWithMaterialSignals: InterpretationContract = {
    ...interpretation,
    signals: Array.from(new Set([
      ...(interpretation.signals ?? []),
      `resource_role:${userMaterial.role}`,
      ...userMaterial.signals,
    ])),
  }
  const dialogueGate = runDialogueGate({ interpretation: interpretationWithMaterialSignals })
  const safety = runRiskAdviceGuard({ interpretation: interpretationWithMaterialSignals })
  const expertises = routeExpertisesMetiers({ interpretation: interpretationWithMaterialSignals })
  const patterns = selectHumanCollectivePatterns({
    text: [
      interpretationWithMaterialSignals.situation_soumise,
      interpretationWithMaterialSignals.object_of_analysis,
      interpretationWithMaterialSignals.angle,
      interpretationWithMaterialSignals.user_need,
      expertises.blind_spots_to_test.join(' '),
      expertises.writing_anchors.join(' '),
    ].join(' '),
  })
  const resourceInterpretation: InterpretationContract = {
    ...interpretationWithMaterialSignals,
    raw_input: [interpretationWithMaterialSignals.raw_input, ...urls].filter(Boolean).join('\n'),
  }
  let resources = planResources({ interpretation: resourceInterpretation, patterns })
  const fastRun = input.fetch_fast_resources
    ? await runFastResourceRunner({
        interpretation: resourceInterpretation,
        resource_plan: resources,
        timeout_ms: input.fast_resource_timeout_ms ?? 1800,
        max_sources: input.max_fast_sources ?? 4,
      })
    : noopFastRunner(input.fast_resource_timeout_ms ?? 0)
  if (fastRun.resources.length > 0) {
    resources = planResources({
      interpretation: resourceInterpretation,
      patterns,
      supplied_resources: fastRun.resources,
    })
  }
  resources = {
    ...resources,
    requested_urls: Array.from(new Set([...resources.requested_urls, ...urls])),
    trace: {
      ...resources.trace,
      duration_ms: (resources.trace.duration_ms ?? 0) + fastRun.duration_ms,
      notes: [
        ...(resources.trace.notes ?? []),
        `diamond_core_fast_run=${fastRun.status}:${fastRun.provider}:${fastRun.resources.length}`,
      ],
    },
    internal_notes: [
      ...resources.internal_notes,
      fastRun.note_fr,
      'DiamondDossier separates canonical question from resource material before writing.',
    ],
  }

  const audienceFamilies = extractTargetAudienceFamiliesFromResources(resources.public_sources)
  const publicEvidence = publicProbativeEvidence(resources, 4)
  const theatre = buildConcreteTheatre({
    interpretation: interpretationWithMaterialSignals,
    resources,
    expertises,
  })
  const inquiry = buildBlindSpotInquiry({
    interpretation: interpretationWithMaterialSignals,
    theatre,
  })
  const counts = {
    actors: theatre.actors.length,
    unknowns: theatre.unknowns.length,
    constraints: theatre.constraints.length,
    evidence: theatre.evidence.length,
  }
  const radar = buildDraftRadar(counts)
  const scoring = computeStateV2({
    astrolabe: buildDraftAstrolabe(counts),
    radar,
    trace_notes: ['diamond_dossier_scoring=draft_from_contracts'],
  })
  const qualityPrecheck = runContractQualityGate({
    interpretation: interpretationWithMaterialSignals,
    theatre,
    scoring,
    inquiry,
  })
  const grammar = buildGrammar({
    interpretation: interpretationWithMaterialSignals,
    audienceFamilies: audienceFamilies.map((family) => `${family.label_fr} / ${family.offer_hint_fr}`),
  })
  const status = statusFor({
    securityRisk: security.risk_level,
    dialogueCanGenerate: dialogueGate.can_generate,
    qualityOk: qualityPrecheck.ok,
    qualityIssueCount: qualityPrecheck.issues.length,
  })

  const dossier: DiamondDossier = {
    id: `diamond-dossier-${Date.now()}`,
    status,
    language,
    canonical_situation: canonicalSituation,
    header: {
      domain_fr: interpretationWithMaterialSignals.header_domain,
      subject_fr: modelCanonical?.header_subject || interpretationWithMaterialSignals.header_subject,
    },
    interpretation: interpretationWithMaterialSignals,
    treatment_plan: interpretationWithMaterialSignals.treatment_plan,
    dialogue: {
      events,
      gate: dialogueGate,
      canonicalizer_used: canonicalizerUsed,
      next_question_fr: modelCanonical?.next_question || dialogueGate.question,
    },
    security,
    safety,
    expertises_metiers: expertises,
    patterns,
    resources: {
      plan: resources,
      fast_run: fastRun,
      user_material: userMaterial,
      target_audience_families: audienceFamilies,
      public_evidence: publicEvidence,
      requested_urls: urls,
      resource_input_text: materialText,
    },
    theatre,
    scoring,
    inquiry,
    quality_precheck: qualityPrecheck ?? emptyQualityPrecheck(),
    grammar,
    trace: {
      service: 'DiamondDossierBuilder',
      version: 'v1',
      duration_ms: Date.now() - started,
      status: status === 'blocked' ? 'blocked' : status === 'ready' ? 'ok' : 'partial',
      notes: [
        `canonicalizer=${canonicalizerUsed}`,
        `resource_role=${userMaterial.role}`,
        `urls=${urls.length}`,
        `fast_resources=${fastRun.resources.length}`,
        `target_audience_families=${audienceFamilies.length}`,
      ],
    },
  }

  return { dossier, radar }
}
