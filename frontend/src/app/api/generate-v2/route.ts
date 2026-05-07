import { NextResponse, type NextRequest } from 'next/server'
import { runDialogueGate } from '@/lib/dialogue'
import { buildBlindSpotInquiry } from '@/lib/inquiry'
import { interpretSituation } from '@/lib/interpretation'
import { buildPipelineRunTrace } from '@/lib/pipeline/PipelineTelemetry'
import { SITUATION_CARD_V2_PIPELINE } from '@/lib/pipeline/V2PipelineBlueprint'
import { planResources } from '@/lib/resources'
import { runRiskAdviceGuard } from '@/lib/safety'
import { computeStateV2 } from '@/lib/scoringV2'
import { buildConcreteTheatre } from '@/lib/theatre'
import { routeExpertisesMetiers } from '@/lib/expertisesMetiers'
import type { AstrolabeBranchV2, RadarScoreV2 } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

type GenerateV2Body = {
  input?: string
  raw_input?: string
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

  const interpretation = await interpretSituation({ raw_input: rawInput })
  const dialogue = runDialogueGate({ interpretation })
  const safety = runRiskAdviceGuard({ interpretation })
  const resources = planResources({ interpretation })
  const expertises = routeExpertisesMetiers({ interpretation })
  const theatre = buildConcreteTheatre({ interpretation, resources, expertises })
  const inquiry = buildBlindSpotInquiry({ interpretation, theatre })

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

  const pipeline_trace = buildPipelineRunTrace({
    id: `generate-v2-${Date.now()}`,
    route: '/api/generate-v2',
    blueprint: SITUATION_CARD_V2_PIPELINE,
    measurements: [
      { stage_id: 'interpretation', duration_ms: interpretation.trace.duration_ms ?? 0, outcome: 'ok' },
      { stage_id: 'dialogue-gate', duration_ms: 1, outcome: dialogue.can_generate ? 'ok' : 'warning' },
      { stage_id: 'resources', duration_ms: resources.trace.duration_ms ?? 0, outcome: resources.status === 'failed' ? 'failed' : 'ok' },
      { stage_id: 'theatre', duration_ms: theatre.trace.duration_ms ?? 0, outcome: theatre.trace.status === 'ok' ? 'ok' : 'warning' },
      { stage_id: 'scoring', duration_ms: scoring.trace.duration_ms ?? 0, outcome: scoring.trace.status === 'ok' ? 'ok' : 'warning' },
      { stage_id: 'quality', duration_ms: 0, outcome: 'skipped', warnings: ['WritingEngine not wired in dry-run route.'] },
    ],
  })

  return NextResponse.json({
    ok: true,
    mode: 'v2_contract_dry_run',
    total_duration_ms: Date.now() - started,
    dialogue,
    interpretation,
    safety,
    resources,
    expertises,
    theatre,
    scoring,
    inquiry,
    pipeline_trace,
  })
}
