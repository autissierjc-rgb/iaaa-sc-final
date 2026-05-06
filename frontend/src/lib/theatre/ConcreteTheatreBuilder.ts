import type {
  ConcreteTheatreContract,
  InterpretationContract,
  ResourceServiceContract,
  TheatreEvidence,
} from '../contracts'

export type ConcreteTheatreBuilderInput = {
  interpretation: InterpretationContract
  resources?: ResourceServiceContract
}

const DATE_PATTERN = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}|janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\b/gi
const CAPITALIZED_PATTERN = /\b[A-ZÀ-Ý][\p{L}'-]{2,}(?:\s+[A-ZÀ-Ý][\p{L}'-]{2,}){0,3}\b/gu

const DOMAIN_EXPECTED_ANCHORS: Record<string, string[]> = {
  family: ['personnes impliquees', 'lien', 'temps', 'geste observable'],
  couple: ['personnes impliquees', 'lien', 'message exact', 'disponibilite reelle'],
  geopolitics: ['dirigeants', 'institutions', 'chronologie', 'declarations'],
  institutional_crisis: ['institutions', 'procedure', 'calendrier', 'precedent'],
  startup_market: ['entreprise', 'produit', 'clients', 'preuve usage'],
  product_platform: ['produit', 'utilisateurs', 'pricing', 'preuve usage'],
  health_body: ['symptomes', 'professionnel de sante', 'delai', 'source medicale'],
  science_research: ['question scientifique', 'publication', 'methode', 'niveau preuve'],
  law_justice: ['texte applicable', 'juridiction', 'procedure', 'preuve'],
  professional: ['role', 'decisionnaire', 'contrainte', 'prochaine decision'],
  management: ['manager', 'equipe', 'decisionnaire', 'charge reelle'],
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function extractDates(text: string): string[] {
  return unique(text.match(DATE_PATTERN) ?? [])
}

function extractNamedAnchors(text: string): string[] {
  return unique(text.match(CAPITALIZED_PATTERN) ?? [])
    .filter((item) => item.length > 2)
    .slice(0, 12)
}

function evidenceFromResources(resources?: ResourceServiceContract): TheatreEvidence[] {
  return (resources?.public_sources ?? []).slice(0, 8).map((resource) => ({
    label: resource.title,
    level: resource.reliability === 'primary' ? 'established' : 'plausible',
    source_ids: [resource.id],
  }))
}

function expectedMissingAnchors(input: ConcreteTheatreBuilderInput, present: string[]): string[] {
  const expected = DOMAIN_EXPECTED_ANCHORS[input.interpretation.domain] ?? [
    'acteurs nommes',
    'contraintes',
    'preuves observables',
  ]
  const text = present.join(' ').toLowerCase()
  return expected.filter((anchor) => !text.includes(anchor.toLowerCase()))
}

export function buildConcreteTheatre(input: ConcreteTheatreBuilderInput): ConcreteTheatreContract {
  const started = Date.now()
  const interpretation = input.interpretation
  const text = [
    interpretation.raw_input,
    interpretation.situation_soumise,
    interpretation.object_of_analysis,
    interpretation.angle,
    interpretation.primary_hypothesis ?? '',
  ].join(' ')

  const namedAnchors = extractNamedAnchors(text)
  const dates = extractDates(text)
  const evidence = evidenceFromResources(input.resources)
  const sourceNames = unique((input.resources?.public_sources ?? []).map((resource) => resource.source))
  const actors = unique([
    ...interpretation.entity_explanations.map((entity) => entity.label),
    ...namedAnchors,
  ]).slice(0, 12)

  const institutions = unique(
    actors.filter((actor) =>
      /\b(cour|congres|congrès|etat|état|ministere|ministère|parti|onu|ue|commission|tribunal|entreprise|startup|ecole|école|hopital|hôpital)\b/i.test(actor),
    ),
  )

  const present = [
    ...actors,
    ...institutions,
    ...dates,
    interpretation.object_of_analysis,
    interpretation.expected_answer_shape,
    ...sourceNames,
  ]

  const missing = expectedMissingAnchors(input, present)

  return {
    domain: interpretation.domain,
    actors,
    institutions,
    dates,
    places: [],
    procedures: [],
    visible_actions: interpretation.must_answer_first
      ? ['tester une hypothese avant elargissement']
      : [],
    constraints: [],
    evidence,
    unknowns: [
      ...(interpretation.needs_clarification ? [interpretation.clarification_question ?? 'precision utilisateur manquante'] : []),
      ...missing,
    ],
    missing_anchors: missing,
    trace: {
      service: 'ConcreteTheatreBuilder',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: missing.length > 0 ? 'partial' : 'ok',
      notes: [
        `actors=${actors.length}`,
        `evidence=${evidence.length}`,
        `missing_anchors=${missing.length}`,
      ],
    },
  }
}
