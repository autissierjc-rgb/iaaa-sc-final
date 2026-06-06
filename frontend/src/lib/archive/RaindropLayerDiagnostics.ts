import type { FastResourceRunnerResult } from '@/lib/resources/FastResourceRunner'
import type { DiamondValidationResult } from '@/lib/governance/diamondValidation'
import type { SCMaterialUnderstanding } from '@/lib/material/scMaterialInterpreter'
import type {
  ConcreteTheatreContract,
  GroundedFact,
  GroundingContract,
  InterpretationContract,
  QualityGateContract,
  ResonanceTraceContract,
  ResourceContract,
  ResourceServiceContract,
  WritingContract,
} from '@/lib/contracts'

type PublicCardOutput = {
  insight_fr?: string
  lecture_systeme_fr?: string
  main_vulnerability_fr?: string
  asymmetry_fr?: string
  key_signal_fr?: string
}

export type RaindropLayerDiagnosticsInput = {
  interpretation: InterpretationContract
  initialResourcePlan?: ResourceServiceContract
  canonicalResourcePlan?: ResourceServiceContract
  diamondResourcePlan?: ResourceServiceContract
  fastRunnerResult?: FastResourceRunnerResult
  material?: SCMaterialUnderstanding
  theatre?: ConcreteTheatreContract
  resonance?: ResonanceTraceContract
  grounding?: GroundingContract
  writing?: WritingContract | null
  quality?: QualityGateContract | null
  diamondValidation?: DiamondValidationResult
  output?: PublicCardOutput
}

function clip(value: unknown, max = 180): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function labels(values: Array<string | undefined>, max = 4): string {
  return values
    .map((value) => clip(value, 80))
    .filter(Boolean)
    .slice(0, max)
    .join(' | ')
}

function sourceLabel(source?: ResourceContract): string {
  if (!source) return ''
  return clip([source.source, source.title].filter(Boolean).join(': '), 180)
}

function issueCodes(result?: DiamondValidationResult | QualityGateContract | null, max = 6): string {
  return labels((result?.issues ?? []).map((issue) => issue.code), max)
}

function publicFacts(grounding?: GroundingContract): GroundedFact[] {
  return (grounding?.current_facts ?? []).filter((fact) => fact.source === 'resources')
}

function outputText(output?: PublicCardOutput): string {
  return [
    output?.insight_fr,
    output?.lecture_systeme_fr,
    output?.main_vulnerability_fr,
    output?.asymmetry_fr,
    output?.key_signal_fr,
  ].filter(Boolean).join('\n')
}

function significantTokens(value: string): string[] {
  const generic = new Set([
    'source',
    'sources',
    'public',
    'publique',
    'preuve',
    'preuves',
    'situation',
    'acteurs',
    'decision',
    'officielle',
    'documentee',
    'observable',
    'verifiable',
  ])

  return Array.from(new Set(clip(value, 500)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 6 && !generic.has(token))))
    .slice(0, 8)
}

function factVisible(fact: GroundedFact, publicText: string): boolean {
  const normalizedText = publicText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const tokens = significantTokens(fact.label_fr)
  if (tokens.length === 0) return false
  return tokens.filter((token) => normalizedText.includes(token)).length >= Math.min(2, tokens.length)
}

function keySignalLooksLikeRawSource(keySignal?: string): boolean {
  const value = clip(keySignal, 500)
  return /\b(reuters|associated press|ap news|afp|bbc|axios|politico)\b/i.test(value) &&
    /(?:^|[.!?;])\s*[A-Z][A-Z\s.,-]{4,}\s+(?:,|-|--)/.test(value)
}

export function buildRaindropLayerDiagnostics(input: RaindropLayerDiagnosticsInput): Record<string, unknown> {
  const finalResourcePlan = input.diamondResourcePlan ?? input.canonicalResourcePlan ?? input.initialResourcePlan
  const facts = publicFacts(input.grounding)
  const text = outputText(input.output)
  const visiblePublicFacts = facts.filter((fact) => factVisible(fact, text)).length
  const diamondIssueCodes = issueCodes(input.diamondValidation)

  return {
    canonical_layer: 'archive',
    diagnostic_scope: 'sc_v2_pipeline_layers',

    layer_interpretation_status: input.interpretation.trace.status,
    layer_interpretation_domain: input.interpretation.domain,
    layer_interpretation_question_type: input.interpretation.question_type,
    layer_interpretation_treatment_mode: input.interpretation.treatment_plan?.mode ?? 'none',

    layer_resources_initial_status: input.initialResourcePlan?.status,
    layer_resources_initial_policy: input.initialResourcePlan?.policy,
    layer_resources_fast_status: input.fastRunnerResult?.status ?? 'not_run',
    layer_resources_fast_provider: input.fastRunnerResult?.provider ?? 'none',
    layer_resources_fast_query: clip(input.fastRunnerResult?.query),
    layer_resources_fast_count: input.fastRunnerResult?.resources.length ?? 0,
    layer_resources_final_status: finalResourcePlan?.status,
    layer_resources_final_policy: finalResourcePlan?.policy,
    layer_resources_final_sources: finalResourcePlan?.public_sources.length ?? 0,
    layer_resources_first_source: sourceLabel(finalResourcePlan?.public_sources[0]),

    layer_material_status: input.material?.site_understanding_status ?? 'not_available',
    layer_material_usable_for_diamond: input.material?.usable_for_diamond ?? false,

    layer_theatre_actors: input.theatre?.actors.length ?? 0,
    layer_theatre_named_actors: labels(input.theatre?.named_actors ?? input.theatre?.actors ?? []),
    layer_theatre_evidence: input.theatre?.evidence.length ?? 0,
    layer_theatre_first_evidence: clip(input.theatre?.evidence[0]?.label),

    layer_resonance_source_signals: input.resonance?.source_signals.length ?? 0,
    layer_resonance_first_signal: clip(input.resonance?.source_signals[0]?.signal_fr),
    layer_resonance_transition_signal: clip(input.resonance?.transition_signal_fr),
    layer_resonance_structural_gap: clip(input.resonance?.structural_gap_fr),

    layer_grounding_source_status: input.grounding?.source_status,
    layer_grounding_public_facts: facts.length,
    layer_grounding_visible_public_facts: visiblePublicFacts,
    layer_grounding_first_public_fact: clip(facts[0]?.label_fr),
    layer_grounding_can_write_current_state: input.grounding?.permissions.can_write_current_state ?? false,
    layer_grounding_must_mark_provisional: input.grounding?.permissions.must_mark_provisional ?? false,

    layer_writing_status: input.writing?.trace.status ?? 'not_available',
    layer_writing_notes: labels(input.writing?.trace.notes ?? [], 5),
    layer_writing_key_signal: clip(input.output?.key_signal_fr),
    layer_quality_status: input.quality?.trace.status ?? 'not_available',
    layer_quality_issue_codes: issueCodes(input.quality),
    layer_diamond_ok: input.diamondValidation?.ok ?? false,
    layer_diamond_issue_codes: diamondIssueCodes,

    diag_public_fact_missing: Boolean(finalResourcePlan?.needs_web && facts.length === 0),
    diag_public_fact_underused: facts.length > 0 && visiblePublicFacts === 0,
    diag_raw_source_in_key_signal: keySignalLooksLikeRawSource(input.output?.key_signal_fr),
    diag_diamond_blocked_public_output: Boolean(input.diamondValidation && !input.diamondValidation.ok),
    diag_diamond_public_fact_underused: diamondIssueCodes.includes('grounded_anti_hors_sol_public_fact_underused'),
  }
}
