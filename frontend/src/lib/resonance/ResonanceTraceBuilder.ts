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

const PUBLIC_PLACEHOLDER_PATTERNS = [
  /^(?:acteurs?\s+)?influents?$/i,
  /^acteurs?\s+capables?\s+de\s+(?:bloquer|accelerer|accélérer)$/i,
  /^acteurs?\s+directs?$/i,
  /^acteurs?\s+visibles?$/i,
  /^institutions?\s+concern[ée]es?$/i,
  /^dirigeants?$/i,
  /^acteur\s+absent$/i,
  /^contrainte\s+cach[ée]e$/i,
  /^preuve\s+manquante$/i,
  /^acteur\s+absent,\s*contrainte\s+cach[ée]e,\s*preuve\s+manquante/i,
]

function publicAnchor(value: string, sourceHosts: string[]): boolean {
  const item = value.trim()
  const normalized = normalize(item)
  if (!item) return false
  if (domainLike(item)) return false
  if (sourceHosts.some((sourceHost) => normalize(sourceHost) === normalized)) return false
  if (PUBLIC_CONTROL_WORDS.has(normalized)) return false
  if (PUBLIC_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(item))) return false
  if (/^(acteurs?|institutions?|sources?|preuves?|trace verifiable|fait observable)$/i.test(normalized)) return false
  return true
}

function firstUseful(items: string[], fallback: string): string {
  return items.find((item) => item.trim().length > 0) ?? fallback
}

function corpusText(input: ResonanceTraceInput): string {
  return [
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.header_subject,
    input.interpretation.angle,
    ...(input.resources?.public_sources ?? []).flatMap((source) => [
      source.title,
      source.excerpt,
      source.source,
    ]),
  ].filter(Boolean).join(' ')
}

function lexicalActorsFromCorpus(text: string): string[] {
  const actors: string[] = []
  const addIf = (pattern: RegExp, label: string) => {
    if (pattern.test(text)) actors.push(label)
  }

  addIf(/\biran|iranien|iranienne|teheran|t[ée]h[ée]ran\b/i, 'Iran')
  addIf(/\bisra[ëe]l|israelien|isra[ée]lien|jerusalem|j[ée]rusalem\b/i, 'Israël')
  addIf(/\b(?:usa|u\.s\.|us\b|united states|[ée]tats[-\s]?unis|am[ée]ricain|washington|trump)\b/i, 'États-Unis')
  addIf(/\bhezbollah\b/i, 'Hezbollah')
  addIf(/\bhamas\b/i, 'Hamas')
  addIf(/\bhouthi|houthis|y[ée]men\b/i, 'Houthis')
  addIf(/\brussie|russia|moscou|moscow\b/i, 'Russie')
  addIf(/\bukraine|kyiv|kiev\b/i, 'Ukraine')
  addIf(/\bchine|china|p[ée]kin|beijing\b/i, 'Chine')
  addIf(/\bunion europ[ée]enne|\bue\b|european union|\beu\b/i, 'Union européenne')
  addIf(/\botan|nato\b/i, 'OTAN')
  addIf(/\bonu|united nations|\bun\b/i, 'ONU')
  return unique(actors)
}

function lexicalInstitutionsFromCorpus(text: string): string[] {
  const institutions: string[] = []
  const addIf = (pattern: RegExp, label: string) => {
    if (pattern.test(text)) institutions.push(label)
  }

  addIf(/\b(?:usa|u\.s\.|us\b|united states|[ée]tats[-\s]?unis|washington|trump|white house|maison[-\s]?blanche)\b/i, 'administration américaine')
  addIf(/\bcongress|congr[èe]s\b/i, 'Congrès américain')
  addIf(/\bisra[ëe]l|israelien|isra[ée]lien|netanyahu|jerusalem|j[ée]rusalem\b/i, 'gouvernement israélien')
  addIf(/\biran|iranien|iranienne|teheran|t[ée]h[ée]ran|irgc|gardiens de la r[ée]volution\b/i, 'autorités iraniennes')
  addIf(/\baiea|iaea|nucl[ée]aire|nuclear\b/i, 'AIEA')
  addIf(/\bonu|united nations|\bun\b|security council|conseil de s[ée]curit[ée]\b/i, 'Conseil de sécurité de l’ONU')
  addIf(/\bcessez[-\s]?le[-\s]?feu|ceasefire|truce|m[ée]diation|mediator|qatar|oman\b/i, 'canaux de médiation')
  addIf(/\bp[ée]trole|oil|energy|[ée]nergie|hormuz\b/i, 'marchés de l’énergie')
  return unique(institutions)
}

export function buildResonanceTrace(input: ResonanceTraceInput): ResonanceTraceContract {
  const started = Date.now()
  const corpus = corpusText(input)
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
    ...lexicalActorsFromCorpus(corpus),
    ...(input.theatre.named_actors ?? []),
    ...input.theatre.actors,
  ])
    .filter((actor) => publicAnchor(actor, sourceHosts))
    .slice(0, 8)
  const institutions = unique([
    ...lexicalInstitutionsFromCorpus(corpus),
    ...input.theatre.institutions,
  ])
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
