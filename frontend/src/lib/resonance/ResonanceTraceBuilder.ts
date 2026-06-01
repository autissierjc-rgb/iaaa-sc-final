import type {
  ConcreteTheatreContract,
  InterpretationContract,
  ResonanceTraceContract,
  ResourceServiceContract,
} from '../contracts'
import { looksLikeProbativeEvidenceNoise } from '../resources/probativeEvidenceSanitizer'
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

function words(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
}

const RELEVANCE_STOPWORDS = new Set([
  'avec',
  'apres',
  'après',
  'dans',
  'entre',
  'pour',
  'quelle',
  'quels',
  'guerre',
  'situation',
  'actuelle',
  'sources',
  'rapides',
  'lecture',
])

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

const VERIFICATION_GAP_PATTERNS = [
  /^chronologie$/i,
  /^d[ée]clarations?$/i,
  /^dirigeants?$/i,
  /^institutions?$/i,
  /^preuves?$/i,
  /^sources?$/i,
  /^fait observable$/i,
  /^trace v[ée]rifiable$/i,
  /^preuve attendue\s*:/i,
]

function publicAnchor(value: string, sourceHosts: string[]): boolean {
  const item = value.trim()
  const normalized = normalize(item)
  if (!item) return false
  if (domainLike(item)) return false
  if (sourceHosts.some((sourceHost) => normalize(sourceHost) === normalized)) return false
  if (looksLikeProbativeEvidenceNoise(item)) return false
  if (PUBLIC_CONTROL_WORDS.has(normalized)) return false
  if (PUBLIC_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(item))) return false
  if (/^(acteurs?|institutions?|sources?|preuves?|trace verifiable|fait observable)$/i.test(normalized)) return false
  return true
}

function structuralGapAnchor(value: string, sourceHosts: string[]): boolean {
  return publicAnchor(value, sourceHosts) &&
    !VERIFICATION_GAP_PATTERNS.some((pattern) => pattern.test(value.trim()))
}

function firstUseful(items: string[], fallback: string): string {
  return items.find((item) => item.trim().length > 0) ?? fallback
}

function visibleList(items: string[], fallback: string): string {
  return items.length > 0 ? items.slice(0, 4).join(', ') : fallback
}

function relevantSourceSignal(signal: { signal_fr: string; source_title: string; source_name: string }, corpus: string): boolean {
  const corpusWords = new Set(words(corpus).filter((word) => !RELEVANCE_STOPWORDS.has(word)))
  if (corpusWords.size === 0) return true

  const sourceText = `${signal.signal_fr} ${signal.source_title} ${signal.source_name}`
  const signalWords = words(sourceText)
  const overlap = signalWords.filter((word) => corpusWords.has(word))

  if (overlap.length >= 2) return true
  if (/\biran|iranien|isra[ëe]l|[ée]tats[-\s]?unis|usa|u\.s\.|trump|washington|teheran|t[ée]h[ée]ran\b/i.test(corpus)) {
    return /\biran|iranien|isra[ëe]l|[ée]tats[-\s]?unis|usa|u\.s\.|trump|washington|teheran|t[ée]h[ée]ran\b/i.test(sourceText)
  }

  return overlap.length >= 1
}

function buildStructuralContradiction(actors: string[], institutions: string[]): string {
  const actorLine = visibleList(actors, 'les acteurs directement concernés')
  const institutionLine = visibleList(institutions, 'les instances capables de cadrer ou bloquer la suite')
  return `${actorLine} rendent la situation visible, mais ${institutionLine} décident si cette tension devient une contrainte, un arbitrage ou un changement de régime.`
}

function defaultStructuralGap(input: ResonanceTraceInput): string {
  const corpus = corpusText(input)
  if (/\b(guerre|frappe|cessez[-\s]?le[-\s]?feu|ceasefire|iran|isra[ëe]l|[ée]tats[-\s]?unis|usa|u\.s\.)\b/i.test(corpus)) {
    return 'le mécanisme qui transforme la frappe, la riposte ou la négociation en seuil officiel'
  }

  if (/\b(startup|march[ée]|cible|client|utilisateur|traction|produit)\b/i.test(corpus)) {
    return 'le passage entre intérêt exprimé et usage répété'
  }

  return 'le mécanisme qui transforme la tension visible en contrainte effective'
}

function tantQue(signal: string): string {
  const value = signal.trim()
  if (/^(?:un|une|aucun|aucune)\b/i.test(value) || /^[aeiouyàâéèêëîïôùûü]/i.test(value)) {
    return `tant qu’${value}`
  }
  return `tant que ${value}`
}

function buildStructuralVulnerability(structuralGap: string, transitionSignal: string): string {
  if (/\b(volont[ée]\s+de\s+payer|usage|traction|paiement|r[ée]tention|client|cible)\b/i.test(structuralGap)) {
    return `Le point fragile est ${structuralGap} : tant qu’il ne se traduit pas par un usage répété, une demande explicite ou un paiement, la cible reste une hypothèse.`
  }

  return `Le point fragile est ${structuralGap} : ${tantQue(transitionSignal)} ne le rend pas opposable, la situation peut rester lisible sans devenir décidable.`
}

function buildDiamondThesis(actors: string[], structuralGap: string, transitionSignal: string): string {
  const actorLine = visibleList(actors, 'les acteurs concernés')
  if (/frappe|riposte|n[ée]gociation|militaire|diplomatique/i.test(structuralGap)) {
    return `La situation tient tant que ${actorLine} peuvent absorber l’écart entre récit, coût et décision ; elle bascule quand ${transitionSignal} transforme la riposte ou la négociation en seuil public.`
  }

  return `La situation tient tant que ${actorLine} peuvent absorber l’écart entre récit, coût et décision ; elle bascule quand ${transitionSignal} rend ${structuralGap} impossible à contourner.`
}

function corpusText(input: ResonanceTraceInput): string {
  return [
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.header_subject,
    input.interpretation.angle,
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
  addIf(/\bonu|united nations\b/i, 'ONU')
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
  addIf(/\bonu|united nations|security council|conseil de s[ée]curit[ée]\b/i, 'Conseil de sécurité de l’ONU')
  addIf(/\bcessez[-\s]?le[-\s]?feu|ceasefire|truce|m[ée]diation|mediator|qatar|oman\b/i, 'canaux de médiation')
  addIf(/\bp[ée]trole|oil|energy|[ée]nergie|hormuz\b/i, 'marchés de l’énergie')
  return unique(institutions)
}

function institutionSupportedByQuestion(institution: string, corpus: string): boolean {
  if (/onu|nations unies|conseil de s[ée]curit[ée]|security council/i.test(institution)) {
    return /\bonu\b|united nations|nations unies|security council|conseil de s[ée]curit[ée]/i.test(corpus)
  }
  return true
}

export function buildResonanceTrace(input: ResonanceTraceInput): ResonanceTraceContract {
  const started = Date.now()
  const corpus = corpusText(input)
  const sourceHosts = unique((input.resources?.public_sources ?? []).flatMap((source) => [
    source.source,
    host(source.url),
  ]))
  const sourceSignals = buildResourceRegimeSignals(input.resources, 4)
    .filter((signal) => relevantSourceSignal(signal, corpus))
    .map((signal) => ({
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
    .filter((institution) => institutionSupportedByQuestion(institution, corpus))
    .slice(0, 8)
  const structuralGap = firstUseful(
    unique([
      ...input.theatre.missing_anchors,
      ...input.theatre.unknowns,
    ]).filter((item) => structuralGapAnchor(item, sourceHosts)),
    defaultStructuralGap(input),
  )
  const transitionSignal = firstUseful(
    unique([
      ...input.theatre.evidence.map((item) => item.label),
      ...input.theatre.visible_actions,
    ]).filter((item) => publicAnchor(item, sourceHosts)),
    'un acte, une preuve ou un seuil observable qui modifie les marges d’action',
  )
  const structuralContradiction = buildStructuralContradiction(realActors, institutions)
  const structuralVulnerability = buildStructuralVulnerability(structuralGap, transitionSignal)
  const diamondThesis = buildDiamondThesis(realActors, structuralGap, transitionSignal)
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
    structural_contradiction_fr: structuralContradiction,
    structural_vulnerability_fr: structuralVulnerability,
    diamond_thesis_fr: diamondThesis,
    regime_hypothesis_fr: sourceSignals.length >= 2
      ? 'Les sources rapides doivent précéder la lecture de régime : elles fixent ce qui est observable avant l’interprétation.'
      : 'Le régime reste une hypothèse structurelle tant que les signaux observables sont incomplets.',
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
