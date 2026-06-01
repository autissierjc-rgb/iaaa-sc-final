import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  ResourceServiceContract,
  TheatreEvidence,
} from '../contracts'
import { isCanonicalSiteUnderstandingResource } from '../material/scMaterialInterpreter'
import { sanitizeProbativeEvidenceText } from '../resources/probativeEvidenceSanitizer'

export type ConcreteTheatreBuilderInput = {
  interpretation: InterpretationContract
  resources?: ResourceServiceContract
  expertises?: ExpertisesMetiersContract
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
  management: ['manager', 'equipe', 'decisionnaire', 'decision ou regle contestee'],
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function extractDates(text: string): string[] {
  return unique(text.match(DATE_PATTERN) ?? [])
}

function extractNamedAnchors(text: string): string[] {
  const blocked = new Set([
    'Analyse',
    'Analyser',
    'Cap',
    'Carte',
    'Chat',
    'Cliquez',
    'Comment',
    'Force',
    'Générer',
    'Ou',
    'Où',
    'Partager',
    'Plug',
    'Pourquoi',
    'Quand',
    'Que',
    'Quel',
    'Quelle',
    'Quels',
    'Quelles',
    'Quoi',
    'Répondez',
    'Répondre',
    'Restreint',
    'Situation',
    'Télécharger',
    'Un',
    'Une',
    'Unis',
  ])
  return unique(text.match(CAPITALIZED_PATTERN) ?? [])
    .filter((item) => item.length > 2)
    .filter((item) => !blocked.has(item))
    .slice(0, 12)
}

function evidenceFromResources(resources?: ResourceServiceContract): TheatreEvidence[] {
  return (resources?.public_sources ?? [])
    .filter((resource) =>
      !(resource.title.toLowerCase().startsWith('fiche site') && isCanonicalSiteUnderstandingResource(resource))
    )
    .slice(0, 8)
    .map((resource) => {
      const evidence = sanitizeProbativeEvidenceText(
        resource.excerpt,
        'preuve publique à vérifier',
        resource.id,
      )
      return {
        label: evidence.status === 'usable' ? evidence.public_label_fr : 'preuve publique à vérifier',
        level: resource.reliability === 'primary' ? 'established' : 'plausible',
        source_ids: [resource.id],
      } satisfies TheatreEvidence
    })
    .filter((item) => item.label !== 'preuve publique à vérifier')
}

function lineAfterPrefix(value: string, prefix: string): string {
  const line = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()))
  return line?.slice(prefix.length).replace(/^[:\s]+/, '').trim().slice(0, 220) ?? ''
}

function resourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

function resourceTheatreAnchors(resources?: ResourceServiceContract) {
  const publicSources = resources?.public_sources ?? []
  const siteBriefs = publicSources.filter((resource) =>
    resource.title.toLowerCase().startsWith('fiche site') &&
    isCanonicalSiteUnderstandingResource(resource)
  )
  const siteNames = unique(siteBriefs.map((resource) =>
    resource.title.replace(/^Fiche site\s*-\s*/i, '').trim()
  ))
  const siteHosts = unique(siteBriefs
    .map((resource) => resourceHost(resource.url))
    .filter(Boolean))

  const visibleActions = unique(siteBriefs.flatMap((resource) => {
    const excerpt = resource.excerpt ?? ''
    return [
      lineAfterPrefix(excerpt, 'Ce que fait l’entreprise'),
      lineAfterPrefix(excerpt, 'Ce que le site permet d’établir'),
      lineAfterPrefix(excerpt, 'Workflow produit'),
      lineAfterPrefix(excerpt, 'Cas d’usage visibles'),
      lineAfterPrefix(excerpt, 'Preuves ou signaux visibles'),
    ]
  })).slice(0, 8)

  const constraints = unique(siteBriefs.flatMap((resource) => {
    const excerpt = resource.excerpt ?? ''
    return [
      lineAfterPrefix(excerpt, 'Preuves manquantes'),
      lineAfterPrefix(excerpt, 'Angles morts critiques à vérifier'),
      lineAfterPrefix(excerpt, 'Règle d’analyse'),
    ]
  })).slice(0, 8)

  return {
    actors: siteNames.slice(0, 10),
    institutions: siteHosts.slice(0, 10),
    visibleActions,
    constraints,
    unknowns: constraints,
  }
}

function expectedMissingAnchors(input: ConcreteTheatreBuilderInput, present: string[]): string[] {
  const expected = DOMAIN_EXPECTED_ANCHORS[input.interpretation.domain] ?? [
    'acteurs réellement impliqués',
    'contraintes',
    'preuves vérifiables',
  ]
  const text = present.join(' ').toLowerCase()
  return expected.filter((anchor) => !text.includes(anchor.toLowerCase()))
}

function shortSubject(input: ConcreteTheatreBuilderInput): string {
  const value =
    input.interpretation.object_of_analysis ||
    input.interpretation.header_subject ||
    input.interpretation.situation_soumise ||
    'cette situation'

  return value
    .replace(/^une?\s+/i, '')
    .replace(/[?.!]+$/g, '')
    .trim()
    .slice(0, 90) || 'cette situation'
}

function firstUseful(items: string[], fallback: string): string {
  return items.find((item) => item.length > 0 && !/^acteurs?$/i.test(item)) ?? fallback
}

function hasExtractedComparisonOptions(resources?: ResourceServiceContract): boolean {
  const comparableKinds = new Set(['audience_family', 'user_segment', 'strategic_option', 'offer', 'use_case'])
  return (resources?.extracted_options ?? [])
    .filter((option) => comparableKinds.has(option.kind))
    .length >= 2
}

function asksComparisonOrTargetChoice(text: string): boolean {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const asksOptions =
    /\b(option|options|scenario|scenarios|strategie|strategies|choix|arbitrage|comparer|classer|prioriser)\b/.test(normalized)
  const asksTargets =
    /\b(cible|cibles|client|clients|utilisateur|utilisateurs|public|publics|segment|segments|audience|persona|icp)\b/.test(normalized)
  const asksDecision =
    /\b(decision|decider|choisir|developper|lancer|premier|premiere|meilleur|meilleure|prioritaire)\b/.test(normalized)

  return asksOptions || (asksTargets && asksDecision)
}

function collaborationQuestions(
  input: ConcreteTheatreBuilderInput,
  namedActors: string[],
  roleAnchors: string[],
  missing: string[],
): string[] {
  const domain = input.interpretation.domain
  const subject = shortSubject(input)
  const visibleActor = firstUseful(namedActors, firstUseful(roleAnchors, 'l’acteur principal'))
  const missingAnchor = firstUseful(missing, 'l’élément qui ferait changer la lecture')
  const text = [
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.angle,
    input.interpretation.user_need,
    input.interpretation.primary_hypothesis ?? '',
  ].join(' ')

  if (domain === 'management') {
    if (/\b(conflit|tension|desaccord|désaccord|reorganisation|réorganisation|equipe|équipe)\b/i.test(text)) {
      return [
        `Dans ${subject}, qui ne voit pas la même scène que les autres ?`,
        `Quel geste, règle ou annonce a rendu le désaccord impossible à ignorer ?`,
      ]
    }

    return [
      `Dans ${subject}, quel rôle reste assez flou pour entretenir le blocage ?`,
      `Qu’est-ce qui montrerait que ${visibleActor} accepte, ralentit ou conteste vraiment ?`,
    ]
  }

  if (domain === 'professional') {
    return [
      `Si la carte devait aider à trancher ${subject}, quelle décision devrait devenir plus nette ?`,
      `Qui peut rendre cette décision possible, coûteuse ou impossible ?`,
    ]
  }

  if (domain === 'startup_market' || domain === 'product_platform' || domain === 'business_strategy') {
    return [
      `Qui reviendrait sans qu’on le relance ?`,
      `Quel signe te ferait arrêter de parler d’intérêt poli ?`,
    ]
  }

  if (domain === 'family' || domain === 'couple' || domain === 'school_adolescence') {
    return [
      `Dans ${subject}, quel moment concret permettrait de voir la scène sans l’expliquer trop vite ?`,
      `Quel geste montrerait que la relation change vraiment, même un peu ?`,
    ]
  }

  if (domain === 'geopolitics' || domain === 'institutional_crisis') {
    return [
      `La tension devient décisive quand quelqu’un peut lui donner une forme officielle. Qui a ce pouvoir ici ?`,
      `Quelle trace rendrait la lecture vérifiable : décision, date, procédure ou déclaration ?`,
    ]
  }

  if (missing.length > 0) {
    return [`Dans ${subject}, qu’est-ce qui manque encore sur ${missingAnchor} pour éviter de conclure trop vite ?`]
  }

  return []
}

export function buildConcreteTheatre(input: ConcreteTheatreBuilderInput): ConcreteTheatreContract {
  const started = Date.now()
  const interpretation = input.interpretation
  const text = [
    interpretation.raw_input,
    interpretation.situation_soumise,
    interpretation.object_of_analysis,
    interpretation.angle,
    interpretation.user_need,
    interpretation.primary_hypothesis ?? '',
  ].join(' ')

  const namedAnchors = extractNamedAnchors(text)
  const dates = extractDates(text)
  const evidence = evidenceFromResources(input.resources)
  const sourceNames = unique((input.resources?.public_sources ?? []).map((resource) => resource.source))
  const resourceAnchors = resourceTheatreAnchors(input.resources)
  const playbook = input.expertises?.domain_playbook
  const namedActors = unique([
    ...interpretation.entity_explanations.map((entity) => entity.label),
    ...namedAnchors,
    ...resourceAnchors.actors,
  ]).slice(0, 12)
  const roleAnchors = unique(playbook?.typical_actors ?? []).slice(0, 12)
  const actors = unique([
    ...namedActors,
    ...roleAnchors,
  ]).slice(0, 12)

  const institutions = unique([
    ...(playbook?.typical_institutions ?? []),
    ...resourceAnchors.institutions,
    ...actors.filter((actor) =>
      /\b(cour|congres|congrès|etat|état|ministere|ministère|parti|onu|ue|commission|tribunal|entreprise|startup|ecole|école|hopital|hôpital)\b/i.test(actor),
    ),
  ]).slice(0, 12)

  const present = [
    ...actors,
    ...institutions,
    ...dates,
    interpretation.object_of_analysis,
    interpretation.expected_answer_shape,
    ...sourceNames,
    ...resourceAnchors.visibleActions,
    ...resourceAnchors.constraints,
  ]

  const missing = expectedMissingAnchors(input, present)
  const resourceOptionsAlreadyExtracted = hasExtractedComparisonOptions(input.resources) && asksComparisonOrTargetChoice(text)
  const questions = collaborationQuestions(input, namedActors, roleAnchors, missing)

  return {
    domain: interpretation.domain,
    actors,
    named_actors: namedActors,
    role_anchors: roleAnchors,
    institutions,
    dates,
    places: [],
    procedures: unique(playbook?.procedures_or_rules ?? []).slice(0, 10),
    visible_actions: interpretation.must_answer_first
      ? unique(['tester une hypothese avant elargissement', ...resourceAnchors.visibleActions]).slice(0, 10)
      : resourceAnchors.visibleActions.slice(0, 10),
    constraints: unique([
      ...(playbook?.procedures_or_rules ?? []),
      ...resourceAnchors.constraints,
      ...(input.expertises?.evidence_to_seek ?? []).map((item) => `preuve attendue: ${item}`),
    ]).slice(0, 10),
    evidence,
    unknowns: [
      ...(interpretation.needs_clarification ? [interpretation.clarification_question ?? 'precision utilisateur manquante'] : []),
      ...resourceAnchors.unknowns,
      ...(input.expertises?.blind_spots_to_test ?? []),
      ...missing,
    ].slice(0, 12),
    missing_anchors: unique([
      ...(input.expertises?.blind_spots_to_test ?? []),
      ...missing,
    ]).slice(0, 12),
    collaboration_questions: questions,
    trace: {
      service: 'ConcreteTheatreBuilder',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: missing.length > 0 ? 'partial' : 'ok',
      notes: [
        `actors=${actors.length}`,
        `named_actors=${namedActors.length}`,
        `role_anchors=${roleAnchors.length}`,
        `collaboration_questions=${questions.length}`,
        resourceOptionsAlreadyExtracted
          ? 'collaboration_questions_suppressed_by_extracted_options'
          : 'collaboration_questions_resource_options_not_settled',
        `evidence=${evidence.length}`,
        `resource_anchors=${resourceAnchors.actors.length + resourceAnchors.visibleActions.length + resourceAnchors.constraints.length}`,
        `missing_anchors=${missing.length}`,
        input.expertises ? `expertise_playbook=${input.expertises.domain_playbook.id}` : 'expertise_playbook=none',
      ],
    },
  }
}
