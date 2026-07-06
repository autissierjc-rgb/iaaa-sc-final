import type {
  ConcreteTheatreContract,
  EvidenceLevel,
  GroundedFact,
  GroundedOption,
  GroundingContract,
  GroundingSourceStatus,
  InquiryContract,
  InterpretationContract,
  ResonanceTraceContract,
  ResourceServiceContract,
} from '../contracts'
import type { SCMaterialUnderstanding } from '../material/scMaterialInterpreter'

function unique(items: string[], limit = 12): string[] {
  return Array.from(new Set(items.map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean))).slice(0, limit)
}

function optionEvidenceLevel(status?: string): EvidenceLevel {
  if (status === 'established') return 'established'
  if (status === 'plausible') return 'plausible'
  if (status === 'hypothesis') return 'uncertain'
  return 'plausible'
}

function sourceStatus(resources?: ResourceServiceContract, material?: SCMaterialUnderstanding): GroundingSourceStatus {
  if (!resources || resources.status === 'not_needed') return 'not_needed'
  if (resources.status === 'available' || resources.public_sources.length > 0 || resources.extracted_options.length > 0) {
    return material?.usable_for_diamond === false ? 'partial' : 'available'
  }
  if (resources.status === 'partial') return 'partial'
  return 'missing'
}

function factsFromResonance(resonance: ResonanceTraceContract): GroundedFact[] {
  return resonance.qualified_evidence
    .filter((evidence) => evidence.can_drive_probability)
    .map((evidence) => ({
      label_fr: evidence.public_label_fr,
      source: 'resources',
      evidence_level: evidence.status === 'usable' ? 'plausible' : 'uncertain',
      source_ids: evidence.source_id ? [evidence.source_id] : [],
    }))
}

function optionsFromResources(resources?: ResourceServiceContract): GroundedOption[] {
  return (resources?.extracted_options ?? [])
    .filter((option) => ['strategic_option', 'offer', 'use_case', 'proof_signal', 'user_segment', 'audience_family'].includes(option.kind))
    .map((option) => ({
      label_fr: option.label_fr,
      source: 'resources',
      evidence_level: optionEvidenceLevel(option.status),
      source_ids: option.source_id ? [option.source_id] : [],
      evidence_fr: option.evidence_fr,
    }))
}

function optionsFromMaterial(material?: SCMaterialUnderstanding): GroundedOption[] {
  if (!material?.usable_for_diamond) return []
  return material.options.map((label) => ({
    label_fr: label,
    source: 'material',
    evidence_level: material.site_understanding_status === 'understood' ? 'plausible' : 'uncertain',
    source_ids: [],
    evidence_fr: material.evidence,
  }))
}

export function buildGroundingContract(input: {
  interpretation: InterpretationContract
  resources?: ResourceServiceContract
  material?: SCMaterialUnderstanding
  theatre?: ConcreteTheatreContract
  resonance: ResonanceTraceContract
  inquiry?: InquiryContract
}): GroundingContract {
  const started = Date.now()
  const status = sourceStatus(input.resources, input.material)
  const hasSourceNeed =
    Boolean(input.resources?.needs_web) ||
    input.resources?.policy === 'fast_sources_required' ||
    input.resources?.policy === 'url_extract_required'
  const optionCandidates = [...optionsFromResources(input.resources), ...optionsFromMaterial(input.material)]
  const optionLabels = new Set<string>()
  const options = optionCandidates.filter((option) => {
    const key = option.label_fr.toLowerCase()
    if (optionLabels.has(key)) return false
    optionLabels.add(key)
    return true
  }).slice(0, 8)
  const facts = [
    ...factsFromResonance(input.resonance),
    ...(input.theatre?.evidence ?? []).map((evidence) => ({
      label_fr: evidence.label,
      source: 'theatre' as const,
      evidence_level: evidence.level,
      source_ids: evidence.source_ids,
    })),
  ].slice(0, 10)
  const hasPublicResourceFact = facts.some((fact) => fact.source === 'resources')
  const actors = unique([
    ...(input.theatre?.named_actors ?? []),
    ...(input.theatre?.actors ?? []),
    ...(input.material?.actors ?? []),
    ...input.resonance.real_actors,
  ])
  const institutions = unique([
    ...(input.theatre?.institutions ?? []),
    ...input.resonance.institutions,
  ])
  const constraints = unique([
    ...(input.theatre?.constraints ?? []),
    ...(input.material?.constraints ?? []),
  ])
  const missingEvidence = unique([
    ...(input.theatre?.missing_anchors ?? []),
    ...(input.theatre?.unknowns ?? []),
    ...(input.material?.uncertainties ?? []),
    ...(input.inquiry?.blind_spots ?? []).map((blindSpot) => blindSpot.decisive_evidence || blindSpot.observable_signal),
    ...(input.material?.warnings ?? []),
  ], 10)

  return {
    understood_question_fr: input.interpretation.situation_soumise || input.interpretation.raw_input,
    object_fr: input.interpretation.object_of_analysis || input.interpretation.header_subject || input.interpretation.situation_soumise,
    source_status: status,
    current_facts: facts,
    options,
    actors,
    institutions,
    constraints,
    missing_evidence_fr: missingEvidence,
    permissions: {
      can_write_current_state: !hasSourceNeed || hasPublicResourceFact,
      can_write_strategy: options.length >= 2 || !hasSourceNeed || hasPublicResourceFact,
      can_write_options: options.length >= 2,
      can_write_source_backed_claims: !hasSourceNeed || hasPublicResourceFact,
      must_mark_provisional: hasSourceNeed && !hasPublicResourceFact,
    },
    trace: {
      service: 'GroundingContractBuilder',
      version: 'v1',
      duration_ms: Date.now() - started,
      status: status === 'missing' ? 'partial' : 'ok',
      notes: [
        `source_status=${status}`,
        `options=${options.length}`,
        `facts=${facts.length}`,
        `actors=${actors.length}`,
        `missing_evidence=${missingEvidence.length}`,
      ],
    },
  }
}
