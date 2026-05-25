import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  ProbabilityAssessment,
  ResonanceTraceContract,
  ResourceServiceContract,
  RiskAdviceGuardContract,
  ScoringContract,
  WritingContract,
} from '../contracts'
import type { HumanCollectivePatternContext } from '../patterns/humanCollective'
import { cleanModelText, parseModelJSON } from '../ai/json'
import { extractTargetAudienceFamiliesFromResources } from '../resources/functionalResourceQualification'
import { publicProbativeEvidence } from '../resources/probativeEvidenceSanitizer'
import { buildResourceRegimeSignals } from '../resources/regimeSignals'
import { buildResonanceTrace } from '../resonance'
import { ASSERTION_LABELS_FR, compactSentence, containsForbiddenPublicPhrase, countWords } from './diamondRules'

export type WritingEngineInput = {
  interpretation: InterpretationContract
  safety: RiskAdviceGuardContract
  expertises_metiers: ExpertisesMetiersContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  resources?: ResourceServiceContract
  patterns?: HumanCollectivePatternContext
  resonance?: ResonanceTraceContract
}

export type WritingEngineMode = 'local_contract' | 'referent_llm'

const APPROFONDIR_CANONICAL_TITLES_FR = {
  really: 'Ce que la situation est réellement',
  holds: 'Ce qui tient le système',
  weakens: 'Ce qui l’affaiblit',
  escalates: 'Ce qui pourrait déclencher une escalade',
  shifts: 'Ce qui pourrait produire une bascule',
  watch: 'Ce qu’il faut surveiller maintenant',
} as const

function joinVisible(items: string[], fallback: string): string {
  return items.length > 0 ? items.slice(0, 4).join(', ') : fallback
}

function normalizeAnchor(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function isPublicPlaceholder(item: string): boolean {
  const normalized = normalizeAnchor(item)
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(item.trim())) return true

  if ([
    'acteurs directs',
    'acteurs visibles',
    'acteurs impliques',
    'personnes impliquees',
    'dirigeant ou candidat nomme',
    'contraintes materielles',
    'regles et institutions',
    'recit dominant',
    'sources externes',
    'general analysis',
    'general_analysis',
    'understand situation',
    'understand_situation',
    'acteurs influents',
    'acteurs capables de bloquer',
    'acteurs capables d accelerer',
    'acteurs capables d accélérer',
    'institutions concernees',
    'institutions concernées',
    'acteur absent',
    'contrainte cachee',
    'contrainte cachée',
    'preuve manquante',
    'dirigeants',
  ].includes(normalized)) return true

  if (/^acteur absent,\s*contrainte cach[ée]e,\s*preuve manquante/i.test(item)) return true
  return /^(acteurs?|institutions?|contraintes?|preuves?|sources?|signal|fait observable|trace verifiable|une trace verifiable|preuve publique)$/i.test(normalized)
}

function publicAnchors(items: string[], fallback: string, max = 4): string {
  const cleaned = unique(items).filter((item) => !isPublicPlaceholder(item))
  return (cleaned.length > 0 ? cleaned : [fallback]).slice(0, max).join(', ')
}

function theatreEvidenceLabels(theatre: ConcreteTheatreContract): string[] {
  return theatre.evidence.map((item) => item.label)
}

function theatreActionAnchors(theatre: ConcreteTheatreContract): string[] {
  return unique([
    ...theatre.visible_actions,
    ...theatre.procedures,
    ...theatre.constraints,
  ]).filter((item) => !isPublicPlaceholder(item))
}

function theatreProofAnchors(
  theatre: ConcreteTheatreContract,
  expertises: ExpertisesMetiersContract,
): string[] {
  return unique([
    ...theatreEvidenceLabels(theatre),
    ...theatre.visible_actions,
    ...theatre.constraints,
    ...expertises.evidence_to_seek,
  ]).filter((item) => !isPublicPlaceholder(item))
}

function theatreFragilityAnchors(
  theatre: ConcreteTheatreContract,
  expertises: ExpertisesMetiersContract,
): string[] {
  return unique([
    ...theatre.unknowns,
    ...theatre.missing_anchors,
    ...expertises.blind_spots_to_test,
  ]).filter((item) => !isPublicPlaceholder(item))
}

function namedAction(items: string[], fallback: string): string {
  return items.length > 0 ? items[0] : fallback
}

function tensionLabel(input: WritingEngineInput): string {
  const haystack = [
    input.interpretation.header_subject,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.domain,
  ].join(' ').toLowerCase()

  if (haystack.includes('election') || haystack.includes('certification') || haystack.includes('contester')) {
    return 'la contestation elle-meme'
  }

  if (haystack.includes('startup') || haystack.includes('compagnie') || haystack.includes('site') || haystack.includes('url')) {
    return 'la promesse affichee'
  }

  if (haystack.includes('amie') || haystack.includes('fils') || haystack.includes('famille') || haystack.includes('couple')) {
    return 'le signe affectif'
  }

  return 'l hypothese elle-meme'
}

function probabilityFromTheatre(theatre: ConcreteTheatreContract): ProbabilityAssessment {
  const hasEvidence = theatre.evidence.length > 0
  const hasMissing = theatre.missing_anchors.length > 0
  const status = hasEvidence && !hasMissing ? 'probable' : hasEvidence ? 'plausible' : 'hypothesis'

  return {
    claim_fr: hasEvidence
      ? 'La lecture dispose de premiers appuis, mais leur portée doit rester qualifiée.'
      : 'La lecture reste une hypothèse de travail tant que les preuves centrales manquent.',
    status,
    probability_label_fr: ASSERTION_LABELS_FR[status],
    confidence: hasEvidence ? 0.62 : 0.42,
    examples: theatre.evidence.slice(0, 3).map((item) => ({
      text_fr: item.label,
      status: item.level === 'established' ? 'established' : 'plausible',
      source_ids: item.source_ids,
    })),
    missing_proof_fr: hasMissing
      ? theatre.missing_anchors.slice(0, 3).join(', ')
      : undefined,
  }
}

function resourceWarning(resources?: ResourceServiceContract): string | undefined {
  if (!resources?.needs_web) return undefined
  if (resources.public_sources.length > 0) return undefined
  if (resources.policy === 'url_extract_required') {
    return 'Un site ou une URL est present : l analyse doit rester provisoire tant que son contenu, sa promesse et ses preuves visibles n ont pas ete extraits ou verifies.'
  }
  return 'Des sources rapides sont requises pour ce domaine : l analyse doit distinguer ce qui est structurellement lisible de ce qui reste a verifier.'
}

function resourceEvidenceSection(resources?: ResourceServiceContract): { id: string; title: string; body: string } | null {
  if (!resources || resources.public_sources.length === 0) return null

  const sourceLine = resources.public_sources.slice(0, 3).map((source) => {
    const reliability = source.reliability ? `, ${source.reliability}` : ''
    return `${source.title} (${source.source}${reliability})`
  }).join(' ; ')

  return {
    id: 'sources-rapides',
    title: 'Sources rapides',
    body:
      `Sources attachees : ${sourceLine}. Elles cadrent la lecture et reduisent le hors-sol, mais ne remplacent pas Recherche+ : il faut encore verifier la source primaire, la date, la contradiction possible et la preuve decisive.`,
  }
}

function probabilityFromResources(resources?: ResourceServiceContract): ProbabilityAssessment | null {
  if (!resources || resources.public_sources.length === 0) return null

  const proof = resourceProofLabel(resources)
  const publicEvidence = publicProbativeEvidence(resources)
  return {
    claim_fr: 'Les sources rapides donnent un premier appui factuel, mais leur portée doit rester qualifiée tant qu’elles ne sont pas confrontées par Recherche+.',
    status: 'plausible',
    probability_label_fr: ASSERTION_LABELS_FR.plausible,
    confidence: resources.public_sources.length >= 2 ? 0.66 : 0.58,
    examples: publicEvidence.map((evidence) => ({
      text_fr: evidence.public_label_fr,
      status: evidence.status === 'usable' ? 'plausible' : 'hypothesis',
      source_ids: evidence.source_id ? [evidence.source_id] : [],
    })),
    missing_proof_fr: proof
      ? `preuve décisive encore à confronter : ${proof}.`
      : 'preuve décisive encore à confronter par Recherche+.',
  }
}

function resourceEvidenceSentence(resources?: ResourceServiceContract): string | undefined {
  if (!resources || resources.public_sources.length === 0) return undefined

  const sources = resources.public_sources.slice(0, 3).map((source) => {
    const reliability = source.reliability && source.reliability !== 'unknown'
      ? `, ${source.reliability}`
      : ''
    return `${source.title} (${source.source}${reliability})`
  }).join(' ; ')

  return `Les sources rapides attachées (${sources}) cadrent la lecture : elles donnent un premier appui vérifiable, mais ne remplacent pas Recherche+ ni une vérification de contradiction.`
}

function resourceRegimeSignalSentence(
  resources?: ResourceServiceContract,
  resonance?: ResonanceTraceContract,
): string | undefined {
  const signals = (resonance?.source_signals ?? buildResourceRegimeSignals(resources, 3))
    .filter((signal) => signal.discriminant_terms.length > 0)
    .map((signal) => compactSentence(signal.signal_fr, 190))
    .filter(Boolean)

  if (signals.length < 2) return undefined

  return `Les signaux sourcés disponibles déplacent le point de départ : ${signals.join(' ; ')}.`
}

function resourceProofLabel(resources?: ResourceServiceContract): string | undefined {
  return publicProbativeEvidence(resources, 1)[0]?.public_label_fr
}

function isTargetChoiceWithMaterial(input: WritingEngineInput): boolean {
  const notes = input.interpretation.treatment_plan?.trace_notes ?? []
  return input.interpretation.treatment_plan?.mode === 'direct_sc' &&
    input.interpretation.treatment_plan.source_status === 'provided' &&
    notes.some((note) => note === 'target_choice_with_material')
}

function cleanAudienceCandidate(value: string): string {
  return cleanModelText(value)
    .replace(/^(?:utilisateurs?|clients?|publics?|cibles?|segments?)\s*(?:vis[ée]s?)?\s*:\s*/i, '')
    .replace(/\b(non [ée]tabli|non disponible|indisponible|à qualifier|a qualifier)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.;:,/|–—-]+\s*$/g, '')
    .trim()
}

function normalizedAudience(value: string): string {
  return cleanAudienceCandidate(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isNavigationAudienceCandidate(value: string): boolean {
  const text = normalizedAudience(value)
  if (!text) return true
  if (/^[a-z0-9-]+\.(?:com|fr|io|ai|org|net)$/.test(text)) return true
  if (/^(?:iaaa|iaaa\+|about|offres?|offers?|pricing|accueil|home|contact|connexion|login|langue|language|menu|dashboard|privacy|mentions|legal|terms)$/.test(text)) {
    return true
  }
  return /\b(?:synthese|summary|crawl|fiche site|site understanding|navigation|navbar|footer)\b/.test(text)
}

function splitAudienceLine(value: string): string[] {
  return value
    .split(/\s+(?:\/|;|\||•)\s+|,(?=\s+(?:[A-ZÉÈÀÂÊÎÔÛÇ]|[a-z]{3,}\s+(?:et|ou)\s+))/)
    .map(cleanAudienceCandidate)
    .filter((item) => item && !isNavigationAudienceCandidate(item))
}

function lineAfterAnyLabel(text: string, labels: string[]): string[] {
  const found: string[] = []
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = text.match(new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, 'i'))
    if (match?.[1]) found.push(...splitAudienceLine(match[1]))
  }
  return found
}

function inferAudienceFromResourceText(value: string): string[] {
  const text = normalizedAudience(value)
  const audiences: string[] = []

  if (/\b(personnel|personnelle|relationnel|relationnelle|particulier|individuel|individuelle|clarifier pour soi)\b/.test(text)) {
    audiences.push('particuliers qui veulent clarifier une situation personnelle ou professionnelle')
  }
  if (/\b(professionnel|professionnels|manager|managers|management|rh|equipe|equipes|consultant|consultants|analyse|analystes|journaliste|journalistes|chercheur|chercheurs|brief|decision strategique|decisions strategiques)\b/.test(text)) {
    audiences.push('professionnels qui doivent structurer, partager ou expliquer une situation complexe')
  }
  if (/\b(organisation|organisations|institution|institutions|gouvernance|direction|comite|comité|collectif|equipe dirigeante|roles et permissions|traçabilite|tracabilite|api|connecteur|connecteurs)\b/.test(text)) {
    audiences.push('organisations qui ont besoin de gouvernance, traçabilité et suivi collectif')
  }
  if (/\b(document|documents|source|sources|rapport|article|pdf|note|briefing|veille)\b/.test(text)) {
    audiences.push('équipes qui transforment documents et sources en lecture partageable')
  }

  return audiences
}

function targetAudiencesFromResourceContract(resources?: ResourceServiceContract): string[] {
  if (!resources) return []
  const seen = new Set<string>()
  const candidates: string[] = []
  const sourceItems = [...resources.public_sources, ...resources.resources]

  for (const source of sourceItems) {
    const body = `${source.title ?? ''}\n${source.excerpt ?? ''}`
    candidates.push(...lineAfterAnyLabel(body, [
      'Utilisateurs ou clients visés',
      'Utilisateurs ou clients vises',
      'Publics visés',
      'Publics vises',
      'Cibles visibles',
      'Segments visibles',
    ]))
    const useCases = lineAfterAnyLabel(body, [
      'Cas d’usage visibles',
      'Cas d usage visibles',
      'Faits extraits du site',
    ])
    for (const useCase of useCases) candidates.push(...inferAudienceFromResourceText(useCase))
    if (candidates.length < 2) candidates.push(...inferAudienceFromResourceText(body))
  }

  return candidates
    .map(cleanAudienceCandidate)
    .filter((item) => item && !isNavigationAudienceCandidate(item))
    .filter((item) => {
      const key = normalizedAudience(item)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 4)
}

function targetAudienceFamiliesFromResourceContract(resources?: ResourceServiceContract): {
  label: string
  compact: string
  detail: string
}[] {
  if (!resources) return []
  return extractTargetAudienceFamiliesFromResources([...resources.public_sources, ...resources.resources])
    .map((family) => ({
      label: `${family.label_fr} / ${family.offer_hint_fr}`,
      compact: family.label_fr,
      detail: `${family.label_fr} / ${family.offer_hint_fr} : ${family.audience_fr}`,
    }))
}

function targetOptionsFromResourceContract(resources?: ResourceServiceContract): {
  label: string
  compact: string
  detail: string
}[] {
  if (!resources) return []
  return (resources.extracted_options ?? [])
    .filter((option) =>
      option.kind === 'audience_family' ||
      option.kind === 'user_segment' ||
      option.kind === 'strategic_option' ||
      option.kind === 'offer' ||
      option.kind === 'use_case',
    )
    .map((option) => {
      const prefix = option.status === 'established'
        ? ''
        : option.status === 'plausible'
          ? 'à qualifier - '
          : 'hypothèse - '
      return {
        label: option.label_fr,
        compact: option.label_fr.split(':')[0]?.trim() || option.label_fr,
        detail: `${prefix}${option.label_fr}`,
      }
    })
    .filter((option) => option.label && !isNavigationAudienceCandidate(option.label))
    .slice(0, 6)
}

type RankedTargetOption = {
  rank: number
  label: string
  detail: string
  role_fr: string
  reason_fr: string
  test_fr: string
}

function targetOptionScore(option: { label: string; detail: string }, index: number): number {
  const text = normalizeAnchor(`${option.label} ${option.detail}`)
  let score = 70 - index
  if (/\b(sis|professionnel|professionnels|manager|managers|consultant|consultants|analyste|analystes|journaliste|journalistes|chercheur|chercheurs|equipe|equipes|decision|brief|veille)\b/.test(text)) {
    score += 32
  }
  if (/\b(clarity|usage individuel|individuel|particulier|particuliers|personnel|personnelle|relationnel|relationnelle)\b/.test(text)) {
    score += 18
  }
  if (/\b(governance|gouvernance|organisation|organisations|institution|institutions|direction|comite|comite|api|integration|tracabilite|traçabilite)\b/.test(text)) {
    score -= 24
  }
  if (/\b(paiement|abonnement|usage repete|usage repetee|retention|workflow|processus)\b/.test(text)) {
    score += 10
  }
  return score
}

function roleForRank(rank: number): string {
  if (rank === 1) return 'cible prioritaire'
  if (rank === 2) return 'cible secondaire / laboratoire d’activation'
  return 'cible à différer jusqu’à preuve de confiance'
}

function reasonForRank(option: { label: string; detail: string }, rank: number): string {
  const text = normalizeAnchor(`${option.label} ${option.detail}`)
  if (rank === 1 && /\b(sis|professionnel|professionnels|manager|managers|consultant|consultants|analyste|analystes|journaliste|journalistes|chercheur|chercheurs|equipe|equipes)\b/.test(text)) {
    return 'meilleur compromis entre besoin répété, contexte de décision, partage naturel et disposition à payer'
  }
  if (/\b(clarity|usage individuel|individuel|particulier|particuliers|personnel|personnelle)\b/.test(text)) {
    return 'bon terrain d’activation, de volume et de langage utilisateur, mais moins décisif tant que l’usage reste ponctuel'
  }
  if (/\b(governance|gouvernance|organisation|organisations|institution|institutions|direction|comite|api|integration|tracabilite|traçabilite)\b/.test(text)) {
    return 'valeur potentielle élevée, mais cycle de vente, intégration et preuve de confiance trop longs pour ouvrir seul le marché'
  }
  return rank === 1
    ? 'meilleur signal initial si l’usage devient régulier et partageable'
    : 'utile comme comparaison, mais moins décisif tant que la preuve d’usage reste indirecte'
}

function testForRank(option: { label: string; detail: string }, rank: number): string {
  const text = normalizeAnchor(`${option.label} ${option.detail}`)
  if (rank === 1) return '10 à 20 utilisateurs du segment doivent refaire une carte sans relance, la partager ou demander une suite concrète'
  if (/\b(governance|gouvernance|organisation|organisations|institution|institutions|direction|comite|api|integration)\b/.test(text)) {
    return 'obtenir une demande pilote, un cas d’intégration ou une réunion avec décideur identifié'
  }
  return 'mesurer activation, retour qualifié et réutilisation avant d’en faire le moteur commercial'
}

function rankTargetOptions(options: Array<{ label: string; compact: string; detail: string }>): RankedTargetOption[] {
  return options
    .map((option, index) => ({
      option,
      score: targetOptionScore(option, index),
    }))
    .sort((left, right) => right.score - left.score)
    .map(({ option }, index) => ({
      rank: index + 1,
      label: option.compact || option.label,
      detail: option.detail,
      role_fr: roleForRank(index + 1),
      reason_fr: reasonForRank(option, index + 1),
      test_fr: testForRank(option, index + 1),
    }))
}

function rankingSentence(ranked: RankedTargetOption[]): string {
  return ranked
    .slice(0, 3)
    .map((item) => `${item.rank}. ${item.label} — ${item.role_fr} : ${item.reason_fr}`)
    .join(' ; ')
}

function trajectorySpine(trajectories: WritingContract['trajectories']): string {
  const stabilization = trajectories.find((trajectory) => trajectory.type === 'stabilization')
  const escalation = trajectories.find((trajectory) => trajectory.type === 'escalation')
  const regimeShift = trajectories.find((trajectory) => trajectory.type === 'regime_shift')
  const sentence = (value: string): string => /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`

  return [
    stabilization ? sentence(`Stabilisation : ${stabilization.description_fr} Signal : ${stabilization.signal_fr}`) : '',
    escalation ? sentence(`Escalade : ${escalation.description_fr} Signal : ${escalation.signal_fr}`) : '',
    regimeShift ? sentence(`Bascule : ${regimeShift.description_fr} Signal : ${regimeShift.signal_fr}`) : '',
  ].filter(Boolean).join('\n')
}

function probabilitySpine(probability: ProbabilityAssessment): string {
  const label = probabilityLabelFr(probability)
  return `${label} : ${polishPublicProofText(probability.claim_fr)} ${probabilityChangeSentence(probability)}`
}

function probabilityLabelFr(probability: ProbabilityAssessment): string {
  const labelByStatus: Record<ProbabilityAssessment['status'], string> = {
    established: 'Établi',
    probable: 'Probable',
    plausible: 'Plausible',
    hypothesis: 'Hypothèse à tester',
    unknown: 'Inconnu',
  }
  return labelByStatus[probability.status] ?? probability.probability_label_fr
}

function probabilityChangeSentence(probability: ProbabilityAssessment): string {
  return probability.missing_proof_fr
    ? `La lecture changerait si l’on observe ${formatMissingProofForPublic(probability.missing_proof_fr)}.`
    : 'Ce statut doit rester révisable si une preuve directe ou une contre-preuve apparaît.'
}

function probabilityDemonstrationSentence(probability: ProbabilityAssessment): string {
  return `Statut de preuve : ${probabilityLabelFr(probability).toLowerCase()}. ${polishPublicProofText(probability.claim_fr)} ${probabilityChangeSentence(probability)}`
}

function formatMissingProofForPublic(value: string): string {
  return polishPublicProofText(value)
    .replace(/^preuve ou ancre manquante\s*:\s*/i, '')
    .replace(/^preuve décisive encore à confronter\s*:\s*/i, '')
    .replace(/^preuve decisive encore a confronter\s*:\s*/i, '')
    .replace(/^preuve décisive encore à confronter par Recherche\+\.$/i, 'une vérification Recherche+ ou une source contradictoire')
    .replace(/^preuve decisive encore a confronter par Recherche\+\.$/i, 'une vérification Recherche+ ou une source contradictoire')
    .replace(/\.$/, '')
    .trim()
}

function polishPublicProofText(value: string): string {
  return value
    .replace(/\bHypothese\b/g, 'Hypothèse')
    .replace(/\bhypothese\b/g, 'hypothèse')
    .replace(/\bportee\b/g, 'portée')
    .replace(/\bqualifiee\b/g, 'qualifiée')
    .replace(/\bdecisive\b/g, 'décisive')
    .replace(/\ba confronter\b/g, 'à confronter')
    .replace(/\btant qu elles\b/g, 'tant qu’elles')
    .replace(/\betabli\b/g, 'établi')
    .replace(/\bvolonte\b/g, 'volonté')
    .replace(/\bdependance\b/g, 'dépendance')
    .replace(/\bmodele\b/g, 'modèle')
    .replace(/\bstrategie\b/g, 'stratégie')
}

function trajectorySections(trajectories: WritingContract['trajectories']): Array<{ id: string; title: string; body: string }> {
  const labels: Record<WritingContract['trajectories'][number]['type'], { id: string; title: string }> = {
    stabilization: { id: 'trajectoire-stabilisation', title: 'Trajectoire de stabilisation' },
    escalation: { id: 'trajectoire-escalade', title: 'Trajectoire d’escalade' },
    regime_shift: { id: 'trajectoire-bascule', title: 'Trajectoire de bascule' },
  }

  return trajectories.map((trajectory) => ({
    id: labels[trajectory.type].id,
    title: labels[trajectory.type].title,
    body: `${trajectory.title_fr} : ${trajectory.description_fr} Signal à surveiller : ${trajectory.signal_fr}`,
  }))
}

function canonicalApprofondirSections(input: {
  really: string
  holds: string
  weakens: string
  escalates: string
  shifts: string
  watch: string
}): WritingContract['approfondir']['sections_fr'] {
  const section = (id: string, title: string, body: string) => ({
    id,
    title,
    body: stripRepeatedSectionTitle(title, body),
  })
  return [
    section('situation-reelle', APPROFONDIR_CANONICAL_TITLES_FR.really, input.really),
    section('systeme-tient', APPROFONDIR_CANONICAL_TITLES_FR.holds, input.holds),
    section('systeme-affaiblit', APPROFONDIR_CANONICAL_TITLES_FR.weakens, input.weakens),
    section('escalade', APPROFONDIR_CANONICAL_TITLES_FR.escalates, input.escalates),
    section('bascule', APPROFONDIR_CANONICAL_TITLES_FR.shifts, input.shifts),
    section('surveiller', APPROFONDIR_CANONICAL_TITLES_FR.watch, input.watch),
  ]
}

function stripRepeatedSectionTitle(title: string, body: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return body
    .replace(new RegExp(`^\\s*${escaped}\\s*[:\\-.–—]?\\s*`, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim()
}

function composeTargetChoiceWriting(input: WritingEngineInput, started: number): WritingContract {
  const subject = input.interpretation.situation_soumise || input.interpretation.object_of_analysis || 'le choix de cible utilisateur'
  const audienceFamilies = targetAudienceFamiliesFromResourceContract(input.resources)
  const extractedOptions = targetOptionsFromResourceContract(input.resources)
  const rawSegments = targetAudiencesFromResourceContract(input.resources)
  const segments = audienceFamilies.length >= 2
    ? audienceFamilies.map((family) => family.detail)
    : extractedOptions.length >= 2
      ? extractedOptions.map((option) => option.detail)
    : rawSegments
  const rankableOptions = audienceFamilies.length >= 2
    ? audienceFamilies
    : extractedOptions.length >= 2
      ? extractedOptions
      : rawSegments.map((segment) => ({ label: segment, compact: segment, detail: segment }))
  const rankedOptions = rankTargetOptions(rankableOptions)
  const priority = rankedOptions[0] ?? {
    rank: 1,
    label: 'le premier public vérifiable',
    detail: 'le premier public vérifiable',
    role_fr: 'cible prioritaire',
    reason_fr: 'meilleur signal initial si l’usage devient régulier et partageable',
    test_fr: 'un public formule le cas d’usage avec ses mots et revient sans relance',
  }
  const secondary = rankedOptions[1]
  const deferred = rankedOptions[2]
  const hasSegments = segments.length >= 2
  const segmentList = segments.join(' ; ')
  const compactSegmentList = audienceFamilies.length >= 2
    ? audienceFamilies.map((family) => family.label).join(' ; ')
    : extractedOptions.length >= 2
      ? extractedOptions.map((option) => option.compact).join(' ; ')
    : segmentList
  const decisionProof = 'usage répété, retour qualifié, recommandation, partage, demande d’intégration ou paiement'
  const title = input.interpretation.header_subject || 'choix de première cible'
  const diamond = hasSegments
    ? `La bonne première cible n’est pas le plus grand public ; c’est celui pour qui la promesse devient un geste répété, partageable et monétisable.`
    : 'Une cible non nommée ne se choisit pas : elle se fait d’abord apparaître par les usages, les offres et les preuves disponibles.'
  const insight = hasSegments
    ? `${diamond} À ce stade, la cible prioritaire probable est ${priority.label} : ${priority.reason_fr}.`
    : `${subject} doit rester une carte provisoire : les éléments fournis indiquent une décision de cible, mais ne nomment pas encore assez de segments exploitables pour trancher proprement.`
  const vulnerability = hasSegments
    ? `Le point fragile est la séquence de lancement : choisir le public qui comprend le mieux la promesse peut retarder celui qui prouve qu’elle devient un workflow.`
    : 'Le point fragile est le manque de segments vérifiables dans les éléments exploités : sans publics nommés, la décision risque de redevenir une intuition générale.'
  const asymmetry = hasSegments
    ? `Tous les segments peuvent comprendre la promesse, mais ils ne rendent pas la même preuve : ${secondary?.label ?? 'un segment d’activation'} peut donner du langage et du volume, ${priority.label} peut donner une habitude de travail, et ${deferred?.label ?? 'un segment organisationnel'} peut donner de la crédibilité au prix d’un cycle plus long.`
    : 'La ressource peut donner une promesse lisible, mais la carte ne doit pas inventer les publics qui ne sont pas encore établis.'
  const keySignal = hasSegments
    ? `Signal clé : vérifier si ${priority.label} passe en moins de quelques cycles de l’intérêt à ${decisionProof}.`
    : 'Signal clé : obtenir une liste explicite de publics, d’usages ou d’offres, puis observer lequel produit un premier usage répété.'
  const lecture = hasSegments
    ? `Le vrai arbitrage n’est pas entre trois publics, mais entre trois types de preuve : ${compactSegmentList}. ${priority.label} ressort comme cible prioritaire probable, parce qu’elle peut tester plus vite si la promesse devient un usage répété.\n\nLa séquence recommandée est claire : commencer par ${priority.label}, utiliser ${secondary?.label ?? 'la cible secondaire'} comme laboratoire d’activation et différer ${deferred?.label ?? 'la cible la plus lourde'} tant que la confiance, l’intégration ou le paiement ne sont pas prouvés.\n\nLe test décisif est simple : ${priority.test_fr}. Si ce signal n’apparaît pas, le classement doit être révisé.`
    : `Le choix de cible reste à ouvrir comme une décision de lancement : les informations disponibles indiquent qu’il faut comparer des publics, mais elles ne donnent pas encore assez de segments exploitables pour établir un rang robuste.\n\nLa prochaine preuve utile tient en quatre éléments : publics visés, cas d’usage, offre associée et signal attendu pour chaque public. Dès que ces éléments apparaissent dans la ressource, SC peut classer les options sans les inventer.`
  const approfondir = hasSegments
    ? `Le fond de la situation tient au choix du premier terrain d’apprentissage. ${compactSegmentList} ne donnent pas la même preuve : ${priority.label} doit prouver l’usage et la valeur, ${secondary?.label ?? 'la cible suivante'} peut élargir l’apprentissage, et ${deferred?.label ?? 'la dernière cible'} ne doit monter que si le coût de vente ou d’intégration devient justifié. Le pari implicite est clair : mieux vaut une petite preuve de workflow qu’une grande preuve d’intérêt.`
    : 'Le fond de la situation tient à une absence d’informations qualifiées. La ressource doit être relue non comme une vitrine, mais comme un inventaire de publics, usages, offres et preuves. Tant que ces éléments restent implicites, la carte doit afficher sa prudence plutôt que trancher par formule.'
  const probability = probabilityFromResources(input.resources) ?? probabilityFromTheatre(input.theatre)
  const trajectories: WritingContract['trajectories'] = [
    {
      type: 'stabilization',
      title_fr: 'Cible qualifiée',
      description_fr: hasSegments
        ? `La situation se clarifie si ${priority.label} confirme son rang par un usage répété et des retours précis.`
        : 'La situation se clarifie si la ressource nomme les publics, usages et offres à comparer.',
      signal_fr: hasSegments ? priority.test_fr : 'Un public formule le cas d’usage avec ses mots et revient sans relance.',
    },
    {
      type: 'escalation',
      title_fr: 'Audience sans traction',
      description_fr: 'La visibilité augmente, mais le signal reste faible si les retours ne deviennent pas usage, partage ou demande concrète.',
      signal_fr: 'Beaucoup d’intérêt poli, peu de réutilisation ou de demande d’intégration.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Preuve de marché',
      description_fr: 'La logique change si un public transforme la promesse en comportement mesurable.',
      signal_fr: `Un segment accepte ${decisionProof}.`,
    },
  ]
  const ranking = rankingSentence(rankedOptions)
  const publicProofChange = probability.missing_proof_fr
    ? `Le classement doit bouger si ${formatMissingProofForPublic(probability.missing_proof_fr)} apparaît.`
    : 'Le classement doit rester révisable dès qu’une preuve directe ou une contre-preuve apparaît.'

  return {
    substance_form: {
      substance_fr: ['segments visibles', 'preuve d usage', 'arbitrage de lancement', 'limites de la ressource'],
      form_fr: ['carte courte', 'comparaison', 'prudence explicite', 'signal observable'],
      diamond_sentence: {
        text_fr: diamond,
        role: 'thesis',
        style: 'diamant_tranchant',
        must_be_public: true,
      },
    },
    diamond_sentences: [
      {
        text_fr: diamond,
        role: 'thesis',
        style: 'diamant_tranchant',
        must_be_public: true,
      },
      {
        text_fr: vulnerability,
        role: 'vulnerability',
        style: 'diamond',
        must_be_public: true,
      },
    ],
    probability_assessments: [probability],
    situation_card: {
      title_fr: title,
      submitted_situation_fr: input.interpretation.situation_soumise,
      insight_fr: insight,
      main_vulnerability_fr: vulnerability,
      asymmetry_fr: asymmetry,
      key_signal_fr: keySignal,
    },
    trajectories,
    lecture: {
      text_fr: lecture,
      word_count_fr: countWords(lecture),
    },
    approfondir: {
      analysis_fr: '',
      sections_fr: canonicalApprofondirSections({
        really: hasSegments
          ? `${approfondir} Le classement de départ est : ${ranking}. Statut de preuve : ${probabilityLabelFr(probability).toLowerCase()}. ${polishPublicProofText(probability.claim_fr)} Ce classement donne un ordre d’action, pas une vérité de marché.`
          : `${approfondir} La décision reste utile, mais elle doit d’abord faire apparaître des publics, des usages et des preuves vérifiables.`,
        holds: hasSegments
          ? `La même promesse peut être testée à trois vitesses. ${priority.label} sert à vérifier la répétition d’usage et la valeur de travail ; ${secondary?.label ?? 'la seconde cible'} sert à apprendre le langage, l’activation et la distribution ; ${deferred?.label ?? 'la troisième'} sert plutôt à construire la crédibilité quand la preuve d’usage existe déjà.`
          : 'Ce qui tient encore, c’est la possibilité de transformer la vitrine produit en hypothèses de marché testables : public visé, cas d’usage, offre associée et signal attendu.',
        weakens: hasSegments
          ? `La fragilité vient d’une mauvaise séquence. Si ${deferred?.label ?? 'la cible la plus lourde'} arrive trop tôt, le cycle de vente et la confiance absorbent l’énergie. Si ${secondary?.label ?? 'une cible d’apprentissage'} devient le seul terrain, l’équipe peut confondre intérêt et traction. Si ${priority.label} n’est pas testé vite, la preuve commerciale reste abstraite.`
          : 'Ce qui l’affaiblit, c’est l’absence de segments suffisamment établis : sans public nommé et sans preuve attendue, le choix risque de redevenir une préférence intuitive.',
        escalates: `Le mauvais scénario n’est pas l’absence d’intérêt, mais l’intérêt sans comportement. La visibilité peut monter pendant que la preuve reste faible : ${trajectories[1].signal_fr} Dans ce cas, la carte doit rétrograder la cible prioritaire au rang d’hypothèse non validée.`,
        shifts: `La bascule commence quand un public transforme la promesse en routine observable. Elle devient crédible si ${trajectories[2].signal_fr} À ce moment-là, SC ne lit plus seulement une préférence de lancement, mais un début de preuve de marché.`,
        watch: `${keySignal} ${publicProofChange}`,
      }),
    },
    public_warnings: hasSegments ? [] : ['Carte provisoire : les segments de cible ne sont pas encore assez établis dans les éléments fournis.'],
    trace: {
      service: 'WritingEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: hasSegments ? 'ok' : 'partial',
      notes: [
        'target_choice_with_material',
        hasSegments ? 'resource_segments_used' : 'resource_segments_insufficient',
        audienceFamilies.length >= 2
          ? 'resource_audiences_normalized_as_functional_families'
          : extractedOptions.length >= 2
            ? 'resource_extracted_options_used'
            : 'resource_audiences_raw_fallback',
        `extracted_options=${input.resources?.extracted_options?.length ?? 0}`,
      ],
    },
  }
}

function extractOpenAIText(data: Record<string, unknown>): string {
  const output = Array.isArray(data.output) ? data.output : []
  return output
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const content = (item as Record<string, unknown>).content
      if (!Array.isArray(content)) return []
      return content.map((block) => {
        if (!block || typeof block !== 'object') return ''
        const record = block as Record<string, unknown>
        if (typeof record.text === 'string') return record.text
        if (typeof record.output_text === 'string') return record.output_text
        return ''
      })
    })
    .join('')
    .trim()
}

function stringField(value: unknown, fallback: string): string {
  const clean = cleanModelText(value)
  return clean || fallback
}

function publicWritingText(writing: WritingContract): string {
  return [
    writing.situation_card.insight_fr,
    writing.situation_card.main_vulnerability_fr,
    writing.situation_card.asymmetry_fr,
    writing.situation_card.key_signal_fr,
    writing.lecture.text_fr,
    writing.approfondir.analysis_fr,
    ...writing.approfondir.sections_fr.map((section) => `${section.title} ${section.body}`),
  ].join(' ')
}

function withTraceNote(writing: WritingContract, note: string): WritingContract {
  return {
    ...writing,
    trace: {
      ...writing.trace,
      notes: [...(writing.trace.notes ?? []), note],
    },
  }
}

function patternWritingContext(patterns?: HumanCollectivePatternContext) {
  if (!patterns || patterns.selected_patterns.length === 0) {
    return {
      selected_lenses: [],
      dumezil_balance: patterns?.dumezil_balance,
      rule: patterns?.trace.rule ?? 'patterns_are_lenses_not_conclusions',
      public_use:
        'Aucune lentille humaine ou collective dominante. Ne pas forcer une grille theorique.',
    }
  }

  return {
    selected_lenses: patterns.selected_patterns.slice(0, 4).map((pattern) => ({
      hypothesis: pattern.hypothesis,
      observable_signal: pattern.observable_signal,
      inquiry_question: pattern.inquiry_question,
      confidence: pattern.confidence,
    })),
    dumezil_balance: patterns.dumezil_balance,
    rule: patterns.trace.rule,
    public_use:
      'Utiliser ces lentilles pour affiner roles, vulnerabilite, asymetrie, signal et phrase diamant. Ne jamais exposer les labels ni les auteurs.',
  }
}

function isBusinessWritingDomain(domain: string) {
  return ['startup_market', 'business_strategy', 'product_platform', 'professional'].includes(domain)
}

function isGeopoliticalWritingDomain(domain: string) {
  return ['geopolitics', 'geopolitique', 'war_security', 'security', 'guerre_securite', 'crisis_institutional'].includes(domain)
}

function writingGrammar(input: WritingEngineInput) {
  if (input.expertises_metiers.domain_playbook.domain === 'management') {
    return {
      actorsFallback: 'les personnes directement concernees',
      institutionsFallback: 'l organisation interne, la direction ou les ressources humaines',
      actionFallback: 'une clarification de roles, de charge ou de decision',
      evidenceFallback: 'un fait de travail observable',
      tensionNoun: 'la reorganisation elle-meme',
      diamond: (tension: string, institutions: string, action: string) =>
        `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} laissent ${action} sans cadre partage.`,
      insight: (subject: string, tension: string, action: string, institutions: string) =>
        `${subject} ne se comprend pas par les positions affichees seules. Le point decisif est le passage entre ${tension}, ${action} et les marges detenues par ${institutions}.`,
      lectureEntry: (subject: string, institutions: string) =>
        `${subject} se joue comme une epreuve d organisation : la tension devient serieuse quand elle touche ${institutions}.`,
      approfondirEntry:
        'Le fond de la situation tient a la repartition concrete des roles, de la charge, de la decision et des limites acceptables.',
      supportSentence: (actors: string, institutions: string) =>
        `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
      vulnerability: (blindSpot: string) =>
        `La vulnerabilite centrale est ${blindSpot} : tant que ce point reste implicite, le conflit se deplace au lieu d etre traite.`,
      asymmetry: (actors: string, institutions: string) =>
        `${actors} vivent la tension au quotidien, mais ${institutions} peuvent clarifier, arbitrer ou laisser la charge se concentrer au mauvais endroit.`,
      keySignal: (evidence: string) =>
        `Signal cle : ${evidence} qui montre si la reorganisation clarifie les responsabilites ou deplace la charge vers un point deja fragile.`,
    }
  }

  if (isBusinessWritingDomain(input.expertises_metiers.domain_playbook.domain)) {
    return {
      actorsFallback: 'les acteurs economiques concernes',
      institutionsFallback: 'les clients, partenaires, decideurs ou regulateurs concernes',
      actionFallback: 'un engagement verifiable',
      evidenceFallback: 'une preuve d usage, de paiement ou de contrainte contractuelle',
      tensionNoun: 'la promesse affichee',
      diamond: (tension: string, institutions: string, action: string) =>
        `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} transforment ${action} en engagement, dependance ou contrainte mesurable.`,
      insight: (subject: string, tension: string, action: string, institutions: string) =>
        `${subject} ne se juge pas a sa promesse seule. Le point decisif est le passage entre ${tension}, ${action} et les leviers detenus par ${institutions}.`,
      lectureEntry: (subject: string, institutions: string) =>
        `${subject} se joue comme un test de traction et d alignement : une opportunite devient serieuse seulement si elle rencontre ${institutions}.`,
      approfondirEntry:
        'Le fond de la situation tient a la transformation possible d une promesse en usage, revenu, partenariat ou contrainte assumee.',
      supportSentence: (actors: string, institutions: string) =>
        `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
      vulnerability: (blindSpot: string) =>
        `La vulnerabilite centrale est ${blindSpot} : sans preuve d usage, de role ou de conditions d engagement, l opportunite reste une promesse ; avec elle, elle devient une decision testable.`,
      asymmetry: (actors: string, institutions: string) =>
        `${actors} rendent l opportunite visible, mais ${institutions} decident si elle devient adoption, dependance ou levier reel.`,
      keySignal: (evidence: string) =>
        `Signal cle : ${evidence} reliant offre, utilisateur, decision d achat et consequence observable.`,
    }
  }

  if (isGeopoliticalWritingDomain(input.expertises_metiers.domain_playbook.domain)) {
    return {
      actorsFallback: 'les Etats et forces engagees',
      institutionsFallback: 'les gouvernements, canaux diplomatiques et commandements militaires concernes',
      actionFallback: 'une decision militaire, diplomatique ou economique verifiable',
      evidenceFallback: 'une annonce officielle, une violation documentee, une sanction, une frappe ou un cessez-le-feu confirme',
      tensionNoun: 'la sequence militaire et diplomatique',
      diamond: (tension: string, institutions: string, action: string) =>
        `Le risque ne tient pas seulement a ${tension} ; il commence quand ${institutions} transforment ${action} en seuil public difficile a reprendre.`,
      insight: (subject: string, tension: string, action: string, institutions: string) =>
        `${subject} se lit dans le passage entre ${tension}, ${action} et la capacite de ${institutions} a contenir ou formaliser l escalade.`,
      lectureEntry: (subject: string, institutions: string) =>
        `${subject} se joue dans l ecart entre pression militaire, cout politique et capacite de ${institutions} a maintenir un cadre de sortie.`,
      approfondirEntry:
        'Le fond de la situation tient a la transformation possible d une pression militaire ou diplomatique en seuil public, cout durable ou obligation de riposte.',
      supportSentence: (actors: string, institutions: string) =>
        `Les acteurs visibles sont ${actors}, mais la dynamique depend de ${institutions}.`,
      vulnerability: (blindSpot: string) =>
        `La vulnerabilite centrale est ${blindSpot} : tant que ce point reste non verifie, la crise peut paraitre contenue alors que ses seuils reels se deplacent.`,
      asymmetry: (actors: string, institutions: string) =>
        `${actors} exposent la tension, mais ${institutions} decident si elle reste contenue, negociee ou convertie en nouveau seuil de conflit.`,
      keySignal: (evidence: string) =>
        `Signal cle : ${evidence} qui modifie les marges militaires, diplomatiques ou economiques des acteurs engages.`,
    }
  }

  return {
    actorsFallback: 'les acteurs habilites',
    institutionsFallback: 'les institutions concernees',
    actionFallback: 'une procedure verifiable',
    evidenceFallback: 'une preuve publique',
    tensionNoun: undefined,
    diamond: (tension: string, institutions: string, action: string) =>
      `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} donnent une forme procedurale a ${action}.`,
    insight: (subject: string, tension: string, action: string, institutions: string) =>
      `${subject} ne se tranche pas par une declaration seule. Le point decisif est le passage entre ${tension}, ${action} et les leviers detenus par ${institutions}.`,
    lectureEntry: (subject: string, institutions: string) =>
      `${subject} se joue comme un test de passage : une inquietude ou une hypothese devient serieuse seulement si elle rencontre ${institutions}.`,
    approfondirEntry: 'Le fond de la situation tient a la transformation possible d un recit en procedure.',
    supportSentence: (actors: string, institutions: string) =>
      `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
    vulnerability: (blindSpot: string) =>
      `La vulnerabilite centrale est ${blindSpot} : sans ce relais, la situation reste une crainte ; avec lui, elle peut devenir un acte opposable.`,
    asymmetry: (actors: string, institutions: string) =>
      `${actors} rendent la tension visible, mais ${institutions} peuvent lui donner, ou lui refuser, une forme effective.`,
    keySignal: (evidence: string) =>
      `Signal cle : ${evidence} reliant un acteur habilite, une regle et une consequence observable.`,
  }
}

export function composeDiamondWriting(input: WritingEngineInput): WritingContract {
  const started = Date.now()
  if (isTargetChoiceWithMaterial(input)) {
    return composeTargetChoiceWriting(input, started)
  }

  const resonance = input.resonance ?? buildResonanceTrace({
    interpretation: input.interpretation,
    theatre: input.theatre,
    resources: input.resources,
  })
  const subject = input.interpretation.object_of_analysis || input.interpretation.situation_soumise
  const title = input.interpretation.header_subject
  const grammar = writingGrammar(input)
  const actors = publicAnchors(resonance.real_actors, grammar.actorsFallback)
  const institutions = publicAnchors(resonance.institutions, grammar.institutionsFallback)
  const actionAnchors = theatreActionAnchors(input.theatre)
  const proofAnchors = unique([
    resonance.transition_signal_fr,
    ...theatreProofAnchors(input.theatre, input.expertises_metiers),
  ])
  const fragilityAnchors = unique([
    resonance.structural_gap_fr,
    ...theatreFragilityAnchors(input.theatre, input.expertises_metiers),
  ])
  const evidence = publicAnchors(proofAnchors, 'une trace verifiable')
  const blindSpot = publicAnchors(fragilityAnchors, 'le point qui ferait changer la lecture')
  const firstProcedure = namedAction(actionAnchors, grammar.actionFallback)
  const firstEvidence = namedAction(proofAnchors, grammar.evidenceFallback)
  const tension = grammar.tensionNoun ?? tensionLabel(input)
  const probability = probabilityFromResources(input.resources) ?? probabilityFromTheatre(input.theatre)
  const resourcesWarning = resourceWarning(input.resources)
  const resourcesSection = resourceEvidenceSection(input.resources)
  const resourcesSentence = resourceEvidenceSentence(input.resources)
  const resourceSignalOpening = resourceRegimeSignalSentence(input.resources, resonance)
  const diamondText = compactSentence(
    resonance.diamond_thesis_fr || grammar.diamond(tension, institutions, firstProcedure),
  )

  const publicWarnings = [
    input.safety.required_disclaimer_fr,
    resourcesWarning,
    ...input.scoring.scoring_warnings,
  ].filter((item): item is string => Boolean(item))

  const scInsight = compactSentence(
    grammar.insight(subject, tension, firstProcedure, institutions),
    360,
  )
  const vulnerability = compactSentence(
    resonance.structural_vulnerability_fr || grammar.vulnerability(blindSpot),
    320,
  )
  const asymmetry = compactSentence(grammar.asymmetry(actors, institutions))
  const keySignal = compactSentence(grammar.keySignal(firstEvidence))
  const trajectories: WritingContract['trajectories'] = [
    {
      type: 'stabilization',
      title_fr: 'Clarification',
      description_fr: 'La situation se clarifie si un acteur habilite confirme publiquement son role ou ses limites.',
      signal_fr: `Un element verifiable apparait : ${firstEvidence}.`,
    },
    {
      type: 'escalation',
      title_fr: 'Tension accrue',
      description_fr: 'La pression augmente si la contestation trouve un relais capable de ralentir ou delegitimer la procedure.',
      signal_fr: `Le manque critique reste : ${blindSpot}.`,
    },
    {
      type: 'regime_shift',
      title_fr: 'Bascule',
      description_fr: 'La logique change quand une preuve, une regle ou un acteur transforme l hypothese en fait opposable.',
      signal_fr: 'Une decision, un document, une action ou un seuil rend la lecture non reversible.',
    },
  ]
  const trajectoryText = trajectorySpine(trajectories)
  const probabilityText = probabilitySpine(probability)
  const probabilityDemonstration = probabilityDemonstrationSentence(probability)
  const probabilityChange = probabilityChangeSentence(probability)
  const lecture = [
    resourceSignalOpening,
    diamondText,
    grammar.lectureEntry(subject, institutions),
    resonance.structural_contradiction_fr || `La scene utile n est donc pas le bruit public, mais la chaine qui relie ${actors}, ${firstProcedure} et ${evidence}.`,
    resourcesSentence,
    vulnerability,
    keySignal,
    trajectoryText,
    probabilityText,
  ].filter(Boolean).join(' ')
  const approfondirAnalysis = [
    resourceSignalOpening,
    diamondText,
    grammar.approfondirEntry,
    resonance.structural_contradiction_fr || grammar.supportSentence(actors, institutions),
    `Ce qu il faut etablir n est pas seulement l intention, mais le lien entre ${firstProcedure}, ${evidence} et ${blindSpot}.`,
    resourcesSentence,
    resourcesWarning ? resourcesWarning : '',
    trajectoryText,
    probabilityText,
  ].filter(Boolean).join(' ')

  return {
    substance_form: {
      substance_fr: [
        'structure reelle',
        'vulnerabilite centrale',
        'preuves et seuils',
        'probabilites explicites',
      ],
      form_fr: [
        'essai court',
        'phrases nettes',
        'tension narrative',
        'phrase diamant memorisable',
      ],
      diamond_sentence: {
        text_fr: diamondText,
        role: 'thesis',
        style: 'diamant_tranchant',
        must_be_public: true,
      },
    },
    diamond_sentences: [
      {
        text_fr: diamondText,
        role: 'thesis',
        style: 'diamant_tranchant',
        must_be_public: true,
      },
      {
        text_fr: compactSentence(`Le point fragile est ${blindSpot}.`),
        role: 'vulnerability',
        style: 'diamond',
        must_be_public: true,
      },
    ],
    probability_assessments: [probability],
    situation_card: {
      title_fr: title,
      submitted_situation_fr: input.interpretation.situation_soumise,
      insight_fr: scInsight,
      main_vulnerability_fr: vulnerability,
      asymmetry_fr: asymmetry,
      key_signal_fr: keySignal,
    },
    trajectories,
    lecture: {
      text_fr: lecture,
      word_count_fr: countWords(lecture),
    },
    approfondir: {
      analysis_fr: approfondirAnalysis,
      sections_fr: [
        ...canonicalApprofondirSections({
          really: `${resourceSignalOpening ? `${resourceSignalOpening} ` : ''}${diamondText} La lecture utile consiste a situer qui porte le cout, qui garde la marge d arbitrage, et quelle preuve ferait changer le regime de la situation. ${probabilityDemonstration}`,
          holds: resonance.structural_contradiction_fr || grammar.supportSentence(actors, institutions),
          weakens: `Ce qui affaiblit la situation, c’est le point aveugle ${blindSpot} : tant qu’il n’est pas relié à ${evidence}, la lecture reste vulnérable.`,
          escalates: `${trajectories[1].title_fr} : ${trajectories[1].description_fr} Signal à surveiller : ${trajectories[1].signal_fr} Le statut reste ${probabilityLabelFr(probability).toLowerCase()} tant que ce relais n’est pas observable.`,
          shifts: `${trajectories[2].title_fr} : ${trajectories[2].description_fr} Signal à surveiller : ${trajectories[2].signal_fr} ${probabilityChange}`,
          watch: `${keySignal} ${probabilityChange} A verifier : ${blindSpot}.`,
        }),
        resourcesSection,
      ].filter((section): section is { id: string; title: string; body: string } => Boolean(section)),
    },
    public_warnings: publicWarnings,
    trace: {
      service: 'WritingEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: ['Deterministic writing contract; final prose remains LLM-backed later.'],
    },
  }
}

function buildWritingPrompt(input: WritingEngineInput, local: WritingContract): string {
  return [
    'Tu es le moteur de redaction diamant Situation Card V2.',
    '',
    'Applique le contrat canonique existant, sans inventer de nouvelle regle :',
    '- ne pas reinterpreter la demande utilisateur ;',
    '- utiliser uniquement les contrats fournis : interpretation, theatre reel, expertises, scoring ;',
    '- produire un essai court, net, sans notice, sans logico visible, sans jargon interne ;',
    '- separer Situation Card courte, Lecture et Approfondir ;',
    '- Lecture repond a ce qu il faut retenir en 2 paragraphes courts ; Approfondir demontre les trajectoires, probabilites, limites et preuves ;',
    '- ne pas remplir Lecture avec le classement complet, toutes les trajectoires et le statut probabiliste detaille si Approfondir les porte deja ;',
    '- nommer la vulnerabilite centrale, le signal observable, les probabilites si la preuve manque ;',
    '- dans Approfondir, utiliser le statut probabiliste comme structure de demonstration : ce qui est etabli, probable, plausible, hypothese ou inconnu, puis la preuve qui ferait changer le statut ;',
    '- ne pas ajouter les probabilites comme appendice defensif : elles doivent modifier la lecture des trajectoires, de la bascule et du signal a surveiller ;',
    '- ne jamais transformer une hypothese en certitude.',
    '- ne pas recopier le brouillon local : il sert seulement de garde-fou contractuel, pas de style public.',
    '- pour les situations humaines, collectives et organisationnelles, utiliser les patterns comme lentilles, jamais comme conclusions ;',
    '- utiliser silencieusement la triade fonctionnelle : qui legitime, qui protege/combattre/bloque, qui produit/reproduit/porte la charge ;',
    '- chercher le desalignement critique : ce qui legitime ne protege plus, ce qui protege empeche de produire, ou ce qui produit n est plus reconnu ;',
    '- ne jamais afficher les noms d auteurs, les labels de patterns ou la grille theorique sauf demande explicite de lecture theorique.',
    '- si des public_sources existent, les utiliser comme preuves rapides dans Approfondir, en nommant leur portee et leur limite ;',
    '- ne jamais presenter les sources rapides comme une enquete Recherche+ complete.',
    '',
    'Longueurs indicatives :',
    '- insight_fr : 2 phrases maximum ;',
    '- lecture_fr : 2 paragraphes courts maximum, pas un mini-Approfondir ;',
    '- approfondir_analysis_fr : 4 a 6 phrases ;',
    '- diamond_sentence_fr : diamant tranchant, une phrase courte, dense et partageable qui nomme la contradiction centrale sans prudence molle ni accusation gratuite.',
    '',
    'Retourne uniquement un JSON avec ces cles :',
    '{',
    '  "insight_fr": "",',
    '  "main_vulnerability_fr": "",',
    '  "asymmetry_fr": "",',
    '  "key_signal_fr": "",',
    '  "lecture_fr": "",',
    '  "approfondir_analysis_fr": "",',
    '  "diamond_sentence_fr": "",',
    '  "fond_fr": "",',
    '  "forme_fr": "",',
    '  "probabilites_fr": "",',
    '  "angles_morts_fr": ""',
    '}',
    '',
    'Contrats disponibles :',
    JSON.stringify({
      interpretation: input.interpretation,
      theatre: input.theatre,
      expertises_metiers: input.expertises_metiers,
      resources: input.resources
        ? {
          status: input.resources.status,
          policy: input.resources.policy,
          needs_web: input.resources.needs_web,
          policy_reason_fr: input.resources.policy_reason_fr,
          fallback_searches: input.resources.fallback_searches,
          public_sources_count: input.resources.public_sources.length,
          public_sources: input.resources.public_sources.slice(0, 3).map((source) => ({
            title: source.title,
            source: source.source,
            channel: source.channel,
            reliability: source.reliability,
            excerpt: source.excerpt,
          })),
        }
        : undefined,
      patterns: patternWritingContext(input.patterns),
      scoring: input.scoring,
      required_output_shape: Object.keys(local.situation_card),
      existing_probability_assessment: local.probability_assessments[0],
      forbidden_public_phrases: [
        'objet visible',
        'mecanisme concret',
        'canal concret',
        'general_analysis',
        'understand_situation',
        'la situation est complexe',
        'le manque de communication',
      ],
    }),
  ].join('\n')
}

async function composeWithOpenAI(input: WritingEngineInput, local: WritingContract): Promise<WritingContract> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_WRITING_MODEL || 'gpt-4.1-mini',
        max_tokens: 1400,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: buildWritingPrompt(input, local),
          },
        ],
      }),
    })

    if (!response.ok) throw new Error(`OpenAI writing failed: ${response.status}`)

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    const parsed = parseModelJSON(typeof content === 'string' ? content : extractOpenAIText(data))
    const diamondText = compactSentence(stringField(parsed.diamond_sentence_fr, local.diamond_sentences[0]?.text_fr ?? ''))
    const lectureText = stringField(parsed.lecture_fr, local.lecture.text_fr)
    const approfondirText = stringField(parsed.approfondir_analysis_fr, local.approfondir.analysis_fr)
    const writing: WritingContract = {
      ...local,
      substance_form: {
        ...local.substance_form,
        diamond_sentence: {
          ...local.substance_form.diamond_sentence,
          text_fr: diamondText,
        },
      },
      diamond_sentences: [
        {
          text_fr: diamondText,
          role: 'thesis',
          style: 'diamant_tranchant',
          must_be_public: true,
        },
        ...local.diamond_sentences.slice(1),
      ],
      situation_card: {
        ...local.situation_card,
        insight_fr: compactSentence(stringField(parsed.insight_fr, local.situation_card.insight_fr), 420),
        main_vulnerability_fr: compactSentence(stringField(parsed.main_vulnerability_fr, local.situation_card.main_vulnerability_fr), 320),
        asymmetry_fr: compactSentence(stringField(parsed.asymmetry_fr, local.situation_card.asymmetry_fr), 260),
        key_signal_fr: compactSentence(stringField(parsed.key_signal_fr, local.situation_card.key_signal_fr), 240),
      },
      lecture: {
        text_fr: lectureText,
        word_count_fr: countWords(lectureText),
      },
      approfondir: {
        analysis_fr: approfondirText,
        sections_fr: [
          { id: 'situation-reelle', title: APPROFONDIR_CANONICAL_TITLES_FR.really, body: stripRepeatedSectionTitle(APPROFONDIR_CANONICAL_TITLES_FR.really, stringField(parsed.fond_fr, local.approfondir.sections_fr[0]?.body ?? '')) },
          { id: 'systeme-tient', title: APPROFONDIR_CANONICAL_TITLES_FR.holds, body: stripRepeatedSectionTitle(APPROFONDIR_CANONICAL_TITLES_FR.holds, local.approfondir.sections_fr[1]?.body ?? diamondText) },
          { id: 'systeme-affaiblit', title: APPROFONDIR_CANONICAL_TITLES_FR.weakens, body: stripRepeatedSectionTitle(APPROFONDIR_CANONICAL_TITLES_FR.weakens, stringField(parsed.angles_morts_fr, local.approfondir.sections_fr[2]?.body ?? '')) },
          { id: 'escalade', title: APPROFONDIR_CANONICAL_TITLES_FR.escalates, body: stripRepeatedSectionTitle(APPROFONDIR_CANONICAL_TITLES_FR.escalates, local.approfondir.sections_fr[3]?.body ?? '') },
          { id: 'bascule', title: APPROFONDIR_CANONICAL_TITLES_FR.shifts, body: stripRepeatedSectionTitle(APPROFONDIR_CANONICAL_TITLES_FR.shifts, local.approfondir.sections_fr[4]?.body ?? stringField(parsed.forme_fr, diamondText)) },
          { id: 'surveiller', title: APPROFONDIR_CANONICAL_TITLES_FR.watch, body: stripRepeatedSectionTitle(APPROFONDIR_CANONICAL_TITLES_FR.watch, stringField(parsed.probabilites_fr, local.approfondir.sections_fr[5]?.body ?? '')) },
          ...local.approfondir.sections_fr.filter((section) => section.id === 'sources-rapides'),
        ],
      },
      trace: {
        ...local.trace,
        model: process.env.OPENAI_WRITING_MODEL || 'gpt-4.1-mini',
        notes: ['Referent LLM writing applied to canonical contracts.'],
      },
    }

    const forbidden = containsForbiddenPublicPhrase(publicWritingText(writing))
    if (forbidden.length > 0) {
      throw new Error(`Forbidden public phrase from LLM writing: ${forbidden.join(', ')}`)
    }

    return writing
  } finally {
    clearTimeout(timeout)
  }
}

export async function composeDiamondWritingWithMode(
  input: WritingEngineInput,
  mode: WritingEngineMode = 'local_contract',
): Promise<WritingContract> {
  const started = Date.now()
  const local = composeDiamondWriting(input)

  if (mode !== 'referent_llm') {
    return local
  }

  try {
    const writing = await composeWithOpenAI(input, local)
    return {
      ...writing,
      trace: {
        ...writing.trace,
        duration_ms: Date.now() - started,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown writing error'
    return withTraceNote(local, `Referent LLM writing unavailable; local contract fallback used: ${message}`)
  }
}
