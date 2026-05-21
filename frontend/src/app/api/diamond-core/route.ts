import { NextResponse, type NextRequest } from 'next/server'
import {
  buildDiamondDossier,
  buildSCGrammarPrompt,
  runLLMDiamondWriter,
  type DiamondDossierInput,
} from '@/lib/diamond-core'
import type { DialogueEvent } from '@/lib/intent/dialogueCanonicalizer'

export const dynamic = 'force-dynamic'

type DiamondCoreRequestBody = {
  input?: string
  raw_input?: string
  original_input?: string
  dialogue_events?: DialogueEvent[]
  language?: DiamondDossierInput['language']
  interpretation_mode?: DiamondDossierInput['interpretation_mode']
  canonicalize_with_model?: boolean
  fetch_fast_resources?: boolean
  fast_resource_timeout_ms?: number
  max_fast_sources?: number
  run_writer?: boolean
  writer_model?: string
  writer_timeout_ms?: number
  writer_temperature?: number
}

async function readBody(request: NextRequest): Promise<DiamondCoreRequestBody> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function diagnosticsFromDossier(result: Awaited<ReturnType<typeof buildDiamondDossier>>) {
  const { dossier } = result
  return {
    status: dossier.status,
    canonical_situation: dossier.canonical_situation,
    header: dossier.header,
    interpretation: {
      intent: dossier.interpretation.intent,
      domain: dossier.interpretation.domain,
      question_type: dossier.interpretation.question_type,
      treatment_plan: dossier.treatment_plan,
      reference_model: dossier.interpretation.reference_model,
    },
    dialogue: {
      status: dossier.dialogue.gate.status,
      can_generate: dossier.dialogue.gate.can_generate,
      next_question_fr: dossier.dialogue.next_question_fr,
      canonicalizer_used: dossier.dialogue.canonicalizer_used,
    },
    resources: {
      role: dossier.resources.user_material.role,
      requested_urls: dossier.resources.requested_urls,
      status: dossier.resources.plan.status,
      policy: dossier.resources.plan.policy,
      fast_run: {
        status: dossier.resources.fast_run.status,
        provider: dossier.resources.fast_run.provider,
        sources: dossier.resources.fast_run.resources.length,
        duration_ms: dossier.resources.fast_run.duration_ms,
      },
      target_audience_families: dossier.resources.target_audience_families.map((family) => ({
        id: family.id,
        label_fr: family.label_fr,
        offer_hint_fr: family.offer_hint_fr,
      })),
      public_evidence: dossier.resources.public_evidence,
    },
    theatre: {
      actors: dossier.theatre.actors,
      constraints: dossier.theatre.constraints,
      unknowns: dossier.theatre.unknowns,
      missing_anchors: dossier.theatre.missing_anchors,
    },
    scoring: {
      state_index_final: dossier.scoring.state_index_final,
      state_label: dossier.scoring.state_label,
      primary_branches: dossier.scoring.astrolabe.filter((branch) => branch.is_primary).map((branch) => branch.branch),
    },
    inquiry: {
      blind_spots: dossier.inquiry.blind_spots.slice(0, 5),
      should_offer_inquiry: dossier.inquiry.should_offer_inquiry,
    },
    quality_precheck: {
      ok: dossier.quality_precheck.ok,
      issues: dossier.quality_precheck.issues,
    },
    trace: dossier.trace,
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)
  const rawInput = (body.input ?? body.raw_input ?? '').trim()

  if (!rawInput) {
    return NextResponse.json({
      ok: false,
      error: 'missing_input',
      message: 'Provide input or raw_input.',
    }, { status: 400 })
  }

  const started = Date.now()
  const dossierResult = await buildDiamondDossier({
    raw_input: rawInput,
    original_input: body.original_input,
    dialogue_events: body.dialogue_events,
    language: body.language,
    interpretation_mode: body.interpretation_mode,
    canonicalize_with_model: body.canonicalize_with_model,
    fetch_fast_resources: body.fetch_fast_resources ?? false,
    fast_resource_timeout_ms: body.fast_resource_timeout_ms,
    max_fast_sources: body.max_fast_sources,
  })
  const prompt = buildSCGrammarPrompt(dossierResult.dossier)
  const shouldRunWriter = body.run_writer !== false
  const writer = shouldRunWriter
    ? await runLLMDiamondWriter({
        dossier: dossierResult.dossier,
        model: body.writer_model,
        timeout_ms: body.writer_timeout_ms,
        temperature: body.writer_temperature,
      })
    : null

  return NextResponse.json({
    ok: !writer || writer.status === 'ok',
    mode: 'diamond_core_test',
    total_duration_ms: Date.now() - started,
    diagnostics: diagnosticsFromDossier(dossierResult),
    prompt_preview: {
      model_role: prompt.model_role,
      response_contract: prompt.response_contract,
      quality_targets_fr: prompt.quality_targets_fr,
      message_chars: prompt.messages.reduce((total, message) => total + message.content.length, 0),
    },
    writer: writer
      ? {
          status: writer.status,
          model: writer.model,
          duration_ms: writer.duration_ms,
          errors: writer.errors,
          quality: writer.quality
            ? {
                ok: writer.quality.ok,
                issues: writer.quality.issues,
                sections_to_regenerate: writer.quality.sections_to_regenerate,
              }
            : null,
          writing: writer.writing,
        }
      : {
          status: 'skipped',
          reason: 'run_writer=false',
        },
    dossier: dossierResult.dossier,
  })
}
