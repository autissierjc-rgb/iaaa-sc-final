import type {
  ConcreteTheatreContract,
  InterpretationContract,
  ResonanceTraceContract,
  ResourceServiceContract,
} from '../contracts'
import { buildResourceRegimeSignals } from '../resources/regimeSignals'

export type ResonanceTraceInput = {
  interpretation: InterpretationContract
  theatre: ConcreteTheatreContract
  resources?: ResourceServiceContract
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function host(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

function domainLike(value: string): boolean {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(value.trim())
}

const PUBLIC_CONTROL_WORDS = new Set([
  'analyse',
  'analyser',
  'cap',
  'carte',
  'chat',
  'cliquez',
  'force',
  'generer',
  'générer',
  'partager',
  'plug',
  'repondez',
  'répondez',
  'repondre',
  'répondre',
  'restreint',
  'situation',
  'telecharger',
  'télécharger',
])

function publicAnchor(value: string, sourceHosts: string[]): boolean {
  const item = value.trim()
  const normalized = normalize(item)
  if (!item) return false
  if (domainLike(item)) return false
  if (sourceHosts.some((sourceHost) => normalize(sourceHost) === normalized)) return false
  if (PUBLIC_CONTROL_WORDS.has(normalized)) return false
  if (/^(acteurs?|institutions?|sources?|preuves?|trace verifiable|fait observable)$/i.test(normalized)) return false
  return true
}

function firstUseful(items: string[], fallback: string): string {
  return items.find((item) => item.trim().length > 0) ?? fallback
}

export function buildResonanceTrace(input: ResonanceTraceInput): ResonanceTraceContract {
  const started = Date.now()
  const sourceHosts = unique((input.resources?.public_sources ?? []).flatMap((source) => [
    source.source,
    host(source.url),
  ]))
  const sourceSignals = buildResourceRegimeSignals(input.resources, 4).map((signal) => ({
    source_id: signal.source_id,
    signal_fr: signal.signal_fr,
    source_title: signal.source_title,
    source_name: signal.source_name,
    discriminant_terms: signal.discriminant_terms,
  }))
  const realActors = unique([
    ...input.interpretation.entity_explanations.map((entity) => entity.label),
    ...(input.theatre.named_actors ?? []),
    ...input.theatre.actors,
  ])
    .filter((actor) => publicAnchor(actor, sourceHosts))
    .slice(0, 8)
  const institutions = unique(input.theatre.institutions)
    .filter((institution) => publicAnchor(institution, sourceHosts))
    .slice(0, 8)
  const structuralGap = firstUseful(
    unique([
      ...input.theatre.missing_anchors,
      ...input.theatre.unknowns,
    ]).filter((item) => publicAnchor(item, sourceHosts)),
    'la preuve ou le seuil qui ferait changer la lecture',
  )
  const transitionSignal = firstUseful(
    unique([
      ...input.theatre.evidence.map((item) => item.label),
      ...input.theatre.visible_actions,
      ...sourceSignals.map((signal) => signal.signal_fr),
    ]).filter((item) => publicAnchor(item, sourceHosts)),
    'un signal observable reliant acteur, decision et consequence',
  )
  const forbidden = unique([
    ...sourceHosts.filter((sourceHost) =>
      input.theatre.actors.includes(sourceHost) || input.theatre.institutions.includes(sourceHost),
    ).map((sourceHost) => `source_host_as_actor:${sourceHost}`),
    ...input.theatre.actors.filter((actor) => !publicAnchor(actor, sourceHosts)).map((actor) => `invalid_actor:${actor}`),
  ])

  return {
    source_signals: sourceSignals,
    source_hosts: sourceHosts,
    real_actors: realActors,
    institutions,
    structural_gap_fr: structuralGap,
    regime_hypothesis_fr: sourceSignals.length >= 2
      ? 'Les sources rapides doivent preceder la lecture de regime : elles fixent ce qui est observable avant l interpretation.'
      : 'Le regime reste une hypothese structurelle tant que les signaux observables sont incomplets.',
    transition_signal_fr: transitionSignal,
    forbidden_public_confusions: forbidden,
    trace: {
      service: 'ResonanceTraceBuilder',
      version: 'v0-minimal',
      duration_ms: Date.now() - started,
      status: forbidden.length > 0 ? 'partial' : 'ok',
      notes: [
        `source_signals=${sourceSignals.length}`,
        `real_actors=${realActors.length}`,
        `institutions=${institutions.length}`,
        `forbidden_public_confusions=${forbidden.length}`,
      ],
    },
  }
}
