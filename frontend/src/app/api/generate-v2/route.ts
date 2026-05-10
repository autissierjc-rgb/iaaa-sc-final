import { NextResponse, type NextRequest } from 'next/server'
import { runDialogueGate } from '@/lib/dialogue'
import { buildBlindSpotInquiry } from '@/lib/inquiry'
import { interpretSituation } from '@/lib/interpretation'
import { buildPipelineRunTrace } from '@/lib/pipeline/PipelineTelemetry'
import { SITUATION_CARD_V2_PIPELINE } from '@/lib/pipeline/V2PipelineBlueprint'
import { planResources } from '@/lib/resources'
import { runFastResourceRunner } from '@/lib/resources/FastResourceRunner'
import { runRiskAdviceGuard } from '@/lib/safety'
import { computeStateV2 } from '@/lib/scoringV2'
import { buildConcreteTheatre } from '@/lib/theatre'
import { routeExpertisesMetiers } from '@/lib/expertisesMetiers'
import { runContractQualityGate } from '@/lib/quality'
import { buildGenerationEvent } from '@/lib/archive'
import { composeDiamondWritingWithMode } from '@/lib/writing'
import { runQualityGate } from '@/lib/quality'
import { benchmarkWritingQuality } from '@/lib/quality/WritingQualityBenchmark'
import { selectHumanCollectivePatterns } from '@/lib/patterns/humanCollective'
import { triadAstrolabeInfluence } from '@/lib/scoringV2'
import { prepareRecherchePlus } from '@/lib/recherchePlus'
import { resolveGenerationMode } from '@/lib/contracts/generationMode'
import type { AstrolabeBranchV2, GenerationModeId, RadarScoreV2 } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

type GenerateV2Body = {
  input?: string
  raw_input?: string
  mode?: GenerationModeId
  interpretation_mode?: 'referent_llm' | 'local_contract'
  writing_mode?: 'referent_llm' | 'local_contract'
}

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

function branchScore(branch: AstrolabeBranchV2['branch'], counts: { actors: number; unknowns: number; constraints: number }) {
  if (branch === 'I') return counts.actors > 2 ? 2 : counts.actors > 0 ? 1 : 0
  if (branch === 'VI') return counts.unknowns > 3 ? 3 : counts.unknowns > 0 ? 2 : 1
  if (branch === 'V') return counts.constraints > 2 ? 2 : counts.constraints > 0 ? 1 : 0
  if (branch === 'IV') return counts.unknowns > 2 && counts.actors > 1 ? 2 : 1
  if (branch === 'VII') return 1
  return 1
}

function buildDraftAstrolabe(counts: { actors: number; unknowns: number; constraints: number }): AstrolabeBranchV2[] {
  return ASTROLABE_TEMPLATE.map((branch) => {
    const score = branchScore(branch.branch, counts)
    return {
      ...branch,
      score: score as AstrolabeBranchV2['score'],
      is_primary: branch.branch === 'VI',
      rationale_fr:
        branch.branch === 'VI'
          ? 'VI reste central tant que les angles morts doivent devenir enquete.'
          : 'Score provisoire calcule depuis le theatre reel V2.',
    }
  })
}

function buildDraftRadar(counts: { actors: number; unknowns: number; constraints: number }): RadarScoreV2[] {
  const uncertainty = Math.min(90, 35 + counts.unknowns * 12)
  const impact = Math.min(80, 35 + counts.actors * 8)
  const urgency = Math.min(70, 30 + counts.constraints * 8)
  const reversibility = Math.max(25, 75 - counts.constraints * 10)

  return [
    { axis: 'impact', score: impact, explanation_fr: 'Impact provisoire estime depuis les acteurs et la portee du theatre reel.' },
    { axis: 'urgency', score: urgency, explanation_fr: 'Urgence provisoire estimee depuis contraintes, temps et decision a venir.' },
    { axis: 'uncertainty', score: uncertainty, explanation_fr: 'Incertitude provisoire estimee depuis les angles morts et preuves manquantes.' },
    { axis: 'reversibility', score: reversibility, explanation_fr: 'Reversibilite provisoire estimee depuis les contraintes identifiees.' },
  ]
}

async function readBody(request: NextRequest): Promise<GenerateV2Body> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const started = Date.now()
  const body = await readBody(request)
  const rawInput = (body.input ?? body.raw_input ?? '').trim()

  if (!rawInput) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_input',
        message: 'Provide input or raw_input.',
      },
      { status: 400 },
    )
  }

  const requestedMode = body.mode ?? 'admin_benchmark'
  const generation_mode = resolveGenerationMode(
    requestedMode,
    requestedMode === 'admin_benchmark'
      ? {
          interpretation_mode: body.interpretation_mode,
          writing_mode: body.writing_mode,
        }
      : undefined,
  )
  const interpretation = await interpretSituation({
    raw_input: rawInput,
    mode: generation_mode.interpretation_mode,
  })
  const dialogue = runDialogueGate({ interpretation })
  const safety = runRiskAdviceGuard({ interpretation })
  const expertises = routeExpertisesMetiers({ interpretation })
  const patterns = selectHumanCollectivePatterns({
    text: [
      interpretation.situation_soumise,
      interpretation.object_of_analysis,
      interpretation.angle,
      interpretation.user_need,
      expertises.blind_spots_to_test.join(' '),
      expertises.writing_anchors.join(' '),
    ].join(' '),
  })
  let resources = planResources({ interpretation, patterns })
  const fastResourceRun = generation_mode.id === 'admin_benchmark'
    ? {
        resources: [],
        duration_ms: 0,
        status: 'skipped' as const,
        note_fr: 'Runner sources rapides desactive en mode admin_benchmark.',
        provider: 'none' as const,
        timeout_ms: 0,
      }
    : await runFastResourceRunner({
        interpretation,
        resource_plan: resources,
        timeout_ms: generation_mode.id === 'public_fast' ? 1200 : 2500,
        max_sources: 3,
      })
  if (fastResourceRun.resources.length > 0) {
    resources = planResources({
      interpretation,
      patterns,
      supplied_resources: fastResourceRun.resources,
    })
  }
  resources.trace.duration_ms = (resources.trace.duration_ms ?? 0) + fastResourceRun.duration_ms
  resources.trace.notes = [
    ...(resources.trace.notes ?? []),
    `fast_runner=${fastResourceRun.status}`,
    `fast_runner_sources=${fastResourceRun.resources.length}`,
  ]
  resources.internal_notes = [
    ...resources.internal_notes,
    fastResourceRun.note_fr,
  ]
  const triad_astrolabe = triadAstrolabeInfluence(patterns.dumezil_balance)
  const theatre = buildConcreteTheatre({ interpretation, resources, expertises })
  const inquiry = buildBlindSpotInquiry({ interpretation, theatre })
  const recherche_plus = prepareRecherchePlus({ resources, inquiry })

  const counts = {
    actors: theatre.actors.length,
    unknowns: theatre.unknowns.length,
    constraints: theatre.constraints.length,
  }
  const scoring = computeStateV2({
    astrolabe: buildDraftAstrolabe(counts),
    radar: buildDraftRadar(counts),
    trace_notes: ['dry_run_generate_v2=true'],
  })
  const writing = await composeDiamondWritingWithMode(
    {
      interpretation,
      safety,
      expertises_metiers: expertises,
      theatre,
      scoring,
      resources,
      patterns,
    },
    generation_mode.writing_mode,
  )
  const contractQuality = runContractQualityGate({ interpretation, theatre, scoring, inquiry })
  const writingQuality = runQualityGate({ interpretation, theatre, scoring, writing, resources })
  const writing_benchmark = benchmarkWritingQuality(writing, resources)
  const quality = {
    ...writingQuality,
    ok: contractQuality.ok && writingQuality.ok,
    issues: [...contractQuality.issues, ...writingQuality.issues],
    requires_section_regeneration:
      contractQuality.requires_section_regeneration || writingQuality.requires_section_regeneration,
    sections_to_regenerate: Array.from(new Set([
      ...contractQuality.sections_to_regenerate,
      ...writingQuality.sections_to_regenerate,
    ])),
    trace: {
      ...writingQuality.trace,
      status: (!contractQuality.ok || !writingQuality.ok)
        ? 'error' as const
        : (contractQuality.issues.length + writingQuality.issues.length > 0)
          ? 'partial' as const
          : 'ok' as const,
      notes: [
        ...(contractQuality.trace.notes ?? []),
        ...(writingQuality.trace.notes ?? []),
        `contract_issues=${contractQuality.issues.length}`,
        `writing_issues=${writingQuality.issues.length}`,
      ],
    },
  }
  const generation_archive = buildGenerationEvent({
    route: '/api/generate-v2',
    raw_input: rawInput,
    interpretation,
    dialogue,
    resources,
    quality,
    latency_ms: Date.now() - started,
    tension_family: expertises.domain_playbook.id,
  })

  const pipeline_trace = buildPipelineRunTrace({
    id: `generate-v2-${Date.now()}`,
    route: '/api/generate-v2',
    blueprint: SITUATION_CARD_V2_PIPELINE,
    measurements: [
      { stage_id: 'interpretation', duration_ms: interpretation.trace.duration_ms ?? 0, outcome: 'ok' },
      { stage_id: 'dialogue-gate', duration_ms: 1, outcome: dialogue.can_generate ? 'ok' : 'warning' },
      { stage_id: 'expertises-metiers', duration_ms: expertises.trace.duration_ms ?? 0, outcome: expertises.trace.status === 'ok' ? 'ok' : 'warning' },
      {
        stage_id: 'resources',
        duration_ms: resources.trace.duration_ms ?? 0,
        outcome: resources.status === 'failed'
          ? 'failed'
          : resources.status === 'partial' || resources.status === 'timeout'
            ? 'warning'
            : 'ok',
        warnings: resources.status === 'partial' ? [resources.policy_reason_fr] : [],
      },
      { stage_id: 'patterns', duration_ms: 1, outcome: 'ok' },
      { stage_id: 'theatre', duration_ms: theatre.trace.duration_ms ?? 0, outcome: theatre.trace.status === 'ok' ? 'ok' : 'warning' },
      { stage_id: 'blind-spots', duration_ms: inquiry.trace.duration_ms ?? 0, outcome: inquiry.trace.status === 'ok' ? 'ok' : 'warning' },
      { stage_id: 'scoring', duration_ms: scoring.trace.duration_ms ?? 0, outcome: scoring.trace.status === 'ok' ? 'ok' : 'warning' },
      { stage_id: 'writing', duration_ms: writing.trace.duration_ms ?? 0, outcome: writing.trace.status === 'ok' ? 'ok' : 'warning' },
      {
        stage_id: 'quality',
        duration_ms: quality.trace.duration_ms ?? 0,
        outcome: quality.trace.status === 'error' ? 'failed' : quality.trace.status === 'partial' ? 'warning' : 'ok',
        warnings: quality.issues.map((item) => `${item.code}: ${item.message}`),
      },
      { stage_id: 'recherche-plus', duration_ms: recherche_plus.trace.duration_ms ?? 0, outcome: 'ok' },
    ],
  })

  return NextResponse.json({
    ok: true,
    mode: 'v2_contract_dry_run',
    generation_mode,
    total_duration_ms: Date.now() - started,
    dialogue,
    interpretation,
    safety,
    resources,
    fast_resource_run: fastResourceRun,
    expertises,
    patterns,
    triad_astrolabe,
    theatre,
    scoring,
    inquiry,
    recherche_plus,
    writing,
    writing_benchmark,
    quality,
    generation_archive,
    pipeline_trace,
  })
}
