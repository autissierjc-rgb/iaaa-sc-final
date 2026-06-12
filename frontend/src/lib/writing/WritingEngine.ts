import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  GroundingContract,
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
import { looksLikeProbativeEvidenceNoise, publicProbativeEvidence } from '../resources/probativeEvidenceSanitizer'
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
  grounding?: GroundingContract
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

function isGenericPublicSubject(value?: string): boolean {
  const normalized = normalizeAnchor(String(value ?? ''))
  if (!normalized) return true
  return [
    'la trajectoire de la crise evoquee',
    'la trajectoire de la crise évoquée',
    'trajectoire crise evoquee',
    'trajectoire crise évoquée',
    'la situation evoquee',
    'la situation évoquée',
    'le contexte evoque',
    'le contexte évoqué',
  ].some((placeholder) => normalized.includes(normalizeAnchor(placeholder)))
}

function publicSubject(input: WritingEngineInput): string {
  const object = input.interpretation.object_of_analysis
  if (object && !isGenericPublicSubject(object)) return object
  return input.interpretation.situation_soumise || input.interpretation.raw_input || object || 'la situation'
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function writingRelevanceQuery(input: WritingEngineInput): string {
  return unique([
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.header_subject,
    input.interpretation.angle,
    input.interpretation.user_need,
    input.interpretation.primary_hypothesis ?? '',
  ]).join(' ')
}

function isPublicPlaceholder(item: string): boolean {
  const normalized = normalizeAnchor(item)
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(item.trim())) return true
  if (looksLikeProbativeEvidenceNoise(item)) return true

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
    'acteurs nommes',
    'acteurs nommés',
    'preuve usage',
    'preuves observables',
    'acteur absent',
    'contrainte cachee',
    'contrainte cachée',
    'preuve manquante',
    'dirigeants',
    'chronologie',
    'declarations',
    'déclarations',
  ].includes(normalized)) return true

  if (/^preuve attendue\s*:/i.test(item.trim())) return true
  if (/^acteur absent,\s*contrainte cach[ée]e,\s*preuve manquante/i.test(item)) return true
  return /^(acteurs?|institutions?|contraintes?|preuves?|sources?|signal|fait observable|trace verifiable|une trace verifiable|preuve publique)$/i.test(normalized)
}

function isPublicSpineNoise(item: string): boolean {
  const value = item.trim()
  if (!value) return true
  if (value.length > 180) return true
  if (countWords(value) > 18) return true
  if (/\s\/\s/.test(value)) return true
  if (/^(?:non [ée]tabli|commencer par|ne pas extrapoler|v[ée]rification des|[ée]valuation des|analyse des co[ûu]ts)/i.test(value)) return true
  if (/^(?:ce que fait|ce que le site permet|workflow produit|cas d[’']usage visibles?|preuves? ou signaux visibles?|preuves? manquantes?|angles morts critiques)/i.test(value)) return true
  return false
}

function publicAnchors(items: string[], fallback: string, max = 4): string {
  const cleaned = unique(items).filter((item) => !isPublicPlaceholder(item) && !isPublicSpineNoise(item))
  return (cleaned.length > 0 ? cleaned : [fallback]).slice(0, max).join(', ')
}

function sourceSignalAnchors(resonance: ResonanceTraceContract): string[] {
  return unique(resonance.source_signals.map((signal) => signal.signal_fr))
    .filter((item) => !isPublicPlaceholder(item) && !isPublicSpineNoise(item))
    .slice(0, 3)
}

function sourceGroundedDiamondText({
  resonance,
  actors,
  institutions,
}: {
  resonance: ResonanceTraceContract
  actors: string
  institutions: string
}): string {
  const signals = sourceSignalAnchors(resonance)
  if (signals.length === 0) return ''

  const signalLine = publicAnchors(signals, resonance.transition_signal_fr, 2)
  return `Les faits publics retenus déplacent la lecture : ${signalLine}. ${actors} portent la tension visible, mais le point décisif est désormais la capacité de ${institutions} à convertir ces signaux en décision, refus, médiation ou seuil assumé.`
}

function sourceGroundedVulnerabilityText({
  resonance,
  institutions,
}: {
  resonance: ResonanceTraceContract
  institutions: string
}): string {
  const signals = sourceSignalAnchors(resonance)
  if (signals.length === 0) return ''

  return `La vulnérabilité centrale est le passage entre signaux publics et décision assumée : tant que ${institutions} ne fixent pas le seuil, les faits restent interprétables sans devenir pleinement opposables.`
}

function sourceGroundedContradictionText({
  resonance,
  actors,
  institutions,
}: {
  resonance: ResonanceTraceContract
  actors: string
  institutions: string
}): string {
  const signals = sourceSignalAnchors(resonance)
  if (signals.length === 0) return ''

  const signalLine = publicAnchors(signals, resonance.transition_signal_fr, 2)
  return `${actors} exposent la tension ; ${institutions} gardent la main sur le cadrage public des signaux déjà visibles : ${signalLine}.`
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

function needsExternalEvidenceWithoutSources(resources?: ResourceServiceContract): boolean {
  return Boolean(resources?.needs_web && resources.public_sources.length === 0)
}

function probabilityFromMissingResources(resources?: ResourceServiceContract): ProbabilityAssessment | null {
  if (!needsExternalEvidenceWithoutSources(resources)) return null

  return {
    claim_fr:
      'Aucune source publique exploitable n’a été attachée dans le budget court : la carte peut structurer la situation, mais elle ne confirme pas l’état factuel du jour.',
    status: 'hypothesis',
    probability_label_fr: 'Lecture structurelle provisoire',
    confidence: 0.34,
    examples: [],
    missing_proof_fr: 'une source primaire, une décision officielle ou une contradiction documentée',
  }
}

function resourceWarning(resources?: ResourceServiceContract): string | undefined {
  if (!resources?.needs_web) return undefined
  const missingCompleteCoverage = resources.internal_notes.find((note) => note.startsWith('complete_source_coverage_missing='))
  if (missingCompleteCoverage) {
    const missing = missingCompleteCoverage
      .replace('complete_source_coverage_missing=', '')
      .split(',')
      .filter(Boolean)
      .join(', ')
    return missing
      ? `Socle probatoire incomplet pour la SC complète factuelle : manque ${missing}.`
      : 'Socle probatoire incomplet pour la SC complète factuelle.'
  }
  if (resources.public_sources.length > 0) return undefined
  if (resources.policy === 'url_extract_required') {
    return 'Un site ou une URL est présent : l’analyse doit rester provisoire tant que son contenu, sa promesse et ses preuves visibles n’ont pas été extraits ou vérifiés.'
  }
  return 'Des sources publiques sont requises pour ce domaine : l’analyse doit distinguer ce qui est structurellement lisible de ce qui reste à vérifier.'
}

function hasProductOptionEvidence(resources?: ResourceServiceContract): boolean {
  if (!resources) return false
  const comparableKinds = new Set(['audience_family', 'user_segment', 'strategic_option', 'offer', 'use_case'])
  const productSourceTypes = new Set(['url', 'document', 'private_plug', 'manual_text', 'resource'])
  return resources.extracted_options.filter((option) =>
    comparableKinds.has(option.kind) &&
    productSourceTypes.has(option.source_type),
  ).length >= 2
}

function probabilityFromResources(
  resources?: ResourceServiceContract,
  relevanceQuery?: string,
): ProbabilityAssessment | null {
  if (!resources || resources.public_sources.length === 0) return null

  if (hasProductOptionEvidence(resources)) {
    const examples = resources.extracted_options
      .filter((option) => ['audience_family', 'user_segment', 'strategic_option', 'offer', 'use_case'].includes(option.kind))
      .slice(0, 3)
      .map((option) => ({
        text_fr: option.label_fr,
        status: option.status,
        source_ids: option.source_id ? [option.source_id] : [],
      }))

    return {
      claim_fr: 'Les ressources produit structurent une hypothèse exploitable : elles permettent de comparer les options, mais ne prouvent pas encore la traction de marché.',
      status: 'hypothesis',
      probability_label_fr: 'Hypothèse produit structurée',
      confidence: resources.extracted_options.length >= 3 ? 0.6 : 0.52,
      examples,
      missing_proof_fr: 'usage répété, rétention, recommandation, intégration ou paiement sur un segment précis.',
    }
  }

  const proof = resourceProofLabel(resources)
  const publicEvidence = publicProbativeEvidence(resources, 3, relevanceQuery)
  const usableEvidence = publicEvidence.filter((evidence) => evidence.can_drive_probability)
  if (usableEvidence.length === 0) {
    return {
      claim_fr: 'Des sources rapides sont attachées, mais elles ne fournissent pas encore de fait public suffisamment propre pour durcir la lecture.',
      status: 'hypothesis',
      probability_label_fr: 'Hypothèse à vérifier',
      confidence: 0.44,
      examples: publicEvidence.map((evidence) => ({
        text_fr: evidence.public_label_fr,
        status: 'hypothesis',
        source_ids: evidence.source_id ? [evidence.source_id] : [],
      })),
      missing_proof_fr: proof
        ? `preuve décisive encore à confronter : ${proof}.`
        : 'preuve décisive encore à confronter par Recherche+.',
    }
  }

  return {
    claim_fr: 'Le statut de preuve reste plausible : les faits attachés donnent un premier appui, mais leur portée doit rester qualifiée tant qu’ils ne sont pas confrontés par vérification contradictoire.',
    status: 'plausible',
    probability_label_fr: ASSERTION_LABELS_FR.plausible,
    confidence: resources.public_sources.length >= 2 ? 0.66 : 0.58,
    examples: usableEvidence.map((evidence) => ({
      text_fr: evidence.public_label_fr,
      status: 'plausible',
      source_ids: evidence.source_id ? [evidence.source_id] : [],
    })),
    missing_proof_fr: proof
      ? `preuve décisive encore à confronter : ${proof}.`
      : 'preuve décisive encore à confronter par Recherche+.',
  }
}

function publicEvidenceAnchors(resources?: ResourceServiceContract, relevanceQuery?: string): string[] {
  return publicEvidenceFactAnchors(resources, relevanceQuery)
}

function publicEvidenceFactAnchors(resources?: ResourceServiceContract, relevanceQuery?: string): string[] {
  return publicProbativeEvidence(resources, 3, relevanceQuery)
    .filter((evidence) => evidence.can_drive_probability)
    .map((evidence) => publicEvidenceAnchorForWriting(evidence.public_label_fr))
    .filter((evidence) => evidence.length > 0 && !looksLikeProbativeEvidenceNoise(evidence))
}

function publicEvidenceSignalAnchors(resources?: ResourceServiceContract, relevanceQuery?: string): string[] {
  return publicProbativeEvidence(resources, 3, relevanceQuery)
    .filter((evidence) => evidence.can_drive_probability)
    .map((evidence) => publicFactSignal(evidence.public_label_fr))
    .filter((signal) => signal.length > 0)
}

function publicRegimeSignalsForWriting(resources?: ResourceServiceContract): string[] {
  return unique(buildResourceRegimeSignals(resources, 3)
    .map((signal) => publicFactSignal(signal.signal_fr))
    .filter((signal) => signal.length > 0 && signal !== 'un fait public qualifié'))
}

function publicFactSignal(value: string): string {
  const text = normalizeAnchor(value)
  const hasNegotiation = /\b(agreement|deal|ceasefire|halt|talks?|negotiat|accord|cessez|negociation)\b/i.test(text)
  const hasStalled = /\b(stall|stalled|blocked|bloqu|paralyse|fragile)\b/i.test(text)
  const hasHostility = /\b(attack|attacks|strike|strikes|hostilit|flare|damag|injur|missile|crossfire|frappe|attaque|hostilite)\b/i.test(text)
  const hasOfficial = /\b(official|warning|statement|decision|reported|confirmed|source|declaration|communique|decision|avertissement)\b/i.test(text)
  const hasThreshold = /\b(threshold|thresholds|seuil|seuils|military|militaire)\b/i.test(text)
  const hasInfrastructure = /\b(blockade|port|ports|shipping|merchant|vessel|energy|oil|airport|infrastructure)\b/i.test(text)

  if (hasHostility && hasNegotiation) return 'un enchaînement hostilités/cessez-le-feu documenté'
  if (hasNegotiation && hasStalled) return 'un blocage de négociation devenu public'
  if (hasOfficial && hasThreshold) return 'un avertissement officiel sur un seuil militaire'
  if (hasHostility && hasInfrastructure) return 'une atteinte à une infrastructure stratégique'
  if (hasNegotiation) return 'une piste d’accord ou de cessez-le-feu rendue publique'
  if (hasHostility) return 'un signal d’hostilités documenté'
  if (hasOfficial) return 'une prise de position officielle vérifiable'
  return 'un fait public qualifié'
}

function looksLikeRawExternalExcerpt(value: string): boolean {
  const normalized = normalizeAnchor(value)
  if (countWords(value) > 16) return true
  return /\b(?:the|after|before|between|over|war|ceasefire|reported|launched|strikes?|talks?|negotiations?|officials?|according|warnings?|thresholds?)\b/i.test(normalized)
}

function publicEvidenceAnchorForWriting(value: string): string {
  const polished = compactSentence(polishPublicProofText(value), 180)
  if (!polished) return ''
  return looksLikeRawExternalExcerpt(polished)
    ? publicFactSignal(polished)
    : polished
}

function groundedFactOpeningSentence(
  grounding?: GroundingContract,
  resources?: ResourceServiceContract,
): string | undefined {
  const facts = (grounding?.current_facts ?? [])
    .filter((fact) => fact.source === 'resources')
    .map((fact) => publicEvidenceAnchorForWriting(fact.label_fr))
    .filter((fact) => fact.length > 0 && !looksLikeProbativeEvidenceNoise(fact))
    .slice(0, 2)

  const signals = facts.length > 0 ? facts : publicRegimeSignalsForWriting(resources).slice(0, 2)

  if (signals.length === 0) return undefined

  return `Les premiers signaux publics pointent vers ${signals.join(' ; ')}. Ce socle reste à confronter à la chronologie et aux sources primaires.`
}

function resourceProofLabel(resources?: ResourceServiceContract): string | undefined {
  if (!resources || resources.public_sources.length === 0) return undefined
  return 'une source primaire, une décision officielle ou une contradiction documentée'
}

function isTargetChoiceWithMaterial(input: WritingEngineInput): boolean {
  const notes = input.interpretation.treatment_plan?.trace_notes ?? []
  return input.interpretation.treatment_plan?.mode === 'direct_sc' &&
    input.interpretation.treatment_plan.source_status === 'provided' &&
    notes.some((note) => note === 'target_choice_with_material')
}

function isStrategicOptionsWriting(input: WritingEngineInput): boolean {
  const text = normalizeAnchor([
    input.interpretation.raw_input,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.expected_answer_shape,
    input.interpretation.intent,
    input.interpretation.question_type,
  ].filter(Boolean).join(' '))
  const decisionIntent =
    input.interpretation.intent === 'decide' ||
    input.interpretation.intent === 'compare' ||
    input.interpretation.question_type === 'decision' ||
    input.interpretation.question_type === 'comparison' ||
    /\b(decision|arbitrage|choisir|prioriser|options?|strategique|vendre|exploiter)\b/.test(text)
  const optionObject = /\b(options?|choix|arbitrage|prioriser|vendre|exploiter|produits?|services?|offres?)\b/.test(text)
  return decisionIntent && optionObject
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
  if (probability.probability_label_fr && probability.probability_label_fr !== ASSERTION_LABELS_FR[probability.status]) {
    return polishPublicProofText(probability.probability_label_fr)
  }

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

function signalSentence(base: string, suffix: string): string {
  const polishedBase = polishPublicProofText(base).replace(/[.;:]+$/g, '').trim()
  const polishedSuffix = polishPublicProofText(suffix).replace(/^\s*qui\s+/i, '')
  if (!polishedBase) return `Signal clé : ${polishedSuffix}.`
  if (normalizeAnchor(polishedBase).includes(normalizeAnchor(polishedSuffix).slice(0, 28))) {
    return `Signal clé : ${polishedBase}.`
  }
  if (/modifie\s+les\s+marges/i.test(polishedBase) && /modifie\s+les\s+marges/i.test(polishedSuffix)) {
    return `Signal clé : ${polishedBase}.`
  }
  const connector = polishedSuffix
    .replace(/^relie\b/i, 'reliant')
    .replace(/^modifie\b/i, 'modifiant')
  return `Signal clé : ${polishedBase} ${connector}.`
}

function formatMissingProofForPublic(value: string): string {
  const polished = polishPublicProofText(value)
  if (/acteur absent,\s*contrainte cach[ée]e,\s*preuve manquante/i.test(polished)) {
    return 'une source primaire, une décision officielle ou une contradiction documentée'
  }

  return polished
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
    .replace(/\bA verifier\b/g, 'À vérifier')
    .replace(/\ba verifier\b/g, 'à vérifier')
    .replace(/\bdecision\b/g, 'décision')
    .replace(/\bdecisions\b/g, 'décisions')
    .replace(/\bdecide\b/g, 'décide')
    .replace(/\bdecident\b/g, 'décident')
    .replace(/\bdecidable\b/g, 'décidable')
    .replace(/\brecit\b/g, 'récit')
    .replace(/\bcout\b/g, 'coût')
    .replace(/\bcouts\b/g, 'coûts')
    .replace(/\becart\b/g, 'écart')
    .replace(/\betablir\b/g, 'établir')
    .replace(/\bregle\b/g, 'règle')
    .replace(/\bregles\b/g, 'règles')
    .replace(/\bregime\b/g, 'régime')
    .replace(/\brole\b/g, 'rôle')
    .replace(/\bhabilite\b/g, 'habilité')
    .replace(/\belement\b/g, 'élément')
    .replace(/\bapparait\b/g, 'apparaît')
    .replace(/\bdelegitimer\b/g, 'délégitimer')
    .replace(/\bprocedure\b/g, 'procédure')
    .replace(/\breversible\b/g, 'réversible')
    .replace(/\beconomiques\b/g, 'économiques')
    .replace(/\bcapacite\b/g, 'capacité')
    .replace(/\bcapacité de administration\b/g, 'capacité de l’administration')
    .replace(/\bcapacité de gouvernement\b/g, 'capacité du gouvernement')
    .replace(/\bcapacité de autorités\b/g, 'capacité des autorités')
    .replace(/\ba maintenir\b/g, 'à maintenir')
    .replace(/\bsequence\b/g, 'séquence')
    .replace(/\bescalade\b/g, 'escalade')
    .replace(/\banalyse\b/g, 'analyse')
    .replace(/\brelie\b/g, 'relié')
    .replace(/\bverifiable\b/g, 'vérifiable')
    .replace(/\bengages\b/g, 'engagés')
    .replace(/\bnegociee\b/g, 'négociée')
    .replace(/\bconcernees\b/g, 'concernées')
    .replace(/\bdeclarations\b/g, 'déclarations')
    .replace(/\bprecedents\b/g, 'précédents')
    .replace(/\bcachee\b/g, 'cachée')
    .replace(/\bvulnerabilite\b/g, 'vulnérabilité')
    .replace(/\bportee\b/g, 'portée')
    .replace(/\bqualifiee\b/g, 'qualifiée')
    .replace(/\bdecisive\b/g, 'décisive')
    .replace(/\ba confronter\b/g, 'à confronter')
    .replace(/\btant qu elles\b/g, 'tant qu’elles')
    .replace(/\btant qu aucun\b/g, 'tant qu’aucun')
    .replace(/\bl hypothese\b/g, 'l’hypothèse')
    .replace(/\bl hypothèse\b/g, 'l’hypothèse')
    .replace(/\bl ecart\b/g, 'l’écart')
    .replace(/\bl analyse\b/g, 'l’analyse')
    .replace(/\bl intention\b/g, 'l’intention')
    .replace(/\btient a\b/g, 'tient à')
    .replace(/\bd une\b/g, 'd’une')
    .replace(/\bd un\b/g, 'd’un')
    .replace(/\bd action\b/g, 'd’action')
    .replace(/\bd arbitrage\b/g, 'd’arbitrage')
    .replace(/\bd appui\b/g, 'd’appui')
    .replace(/\bd usage\b/g, 'd’usage')
    .replace(/\bn est\b/g, 'n’est')
    .replace(/\bn ont\b/g, 'n’ont')
    .replace(/\bqu elles\b/g, 'qu’elles')
    .replace(/\bqu il\b/g, 'qu’il')
    .replace(/\betabli\b/g, 'établi')
    .replace(/\bvolonte\b/g, 'volonté')
    .replace(/\bdependance\b/g, 'dépendance')
    .replace(/\bmodele\b/g, 'modèle')
    .replace(/\bstrategie\b/g, 'stratégie')
    .replace(/\ba situer\b/g, 'à situer')
    .replace(/\ba distinguer\b/g, 'à distinguer')
    .replace(/\s*Signal clé\s*:\s*$/i, '')
}

function conciseWatchSignal(evidence: string): string {
  if (/acte,\s*une preuve ou un seuil observable/i.test(evidence)) {
    return 'Signal clé : chercher la première trace vérifiable qui transforme la tension en seuil public.'
  }

  return `Signal clé : ${evidence}.`
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
    body: polishPublicProofText(`${trajectory.title_fr} : ${trajectory.description_fr} Signal à surveiller : ${trajectory.signal_fr}`),
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
    body: polishPublicProofText(stripRepeatedSectionTitle(title, body)),
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
  const relevanceQuery = writingRelevanceQuery(input)
  const lecture = hasSegments
    ? `Le vrai arbitrage n’est pas entre trois publics, mais entre trois types de preuve : ${compactSegmentList}. ${priority.label} ressort comme cible prioritaire probable, parce qu’elle peut tester plus vite si la promesse devient un usage répété.\n\nLa séquence recommandée est claire : commencer par ${priority.label}, utiliser ${secondary?.label ?? 'la cible secondaire'} comme laboratoire d’activation et différer ${deferred?.label ?? 'la cible la plus lourde'} tant que la confiance, l’intégration ou le paiement ne sont pas prouvés.\n\nLe test décisif est simple : ${priority.test_fr}. Si ce signal n’apparaît pas, le classement doit être révisé.`
    : `Le choix de cible reste à ouvrir comme une décision de lancement : les informations disponibles indiquent qu’il faut comparer des publics, mais elles ne donnent pas encore assez de segments exploitables pour établir un rang robuste.\n\nLa prochaine preuve utile tient en quatre éléments : publics visés, cas d’usage, offre associée et signal attendu pour chaque public. Dès que ces éléments apparaissent dans la ressource, SC peut classer les options sans les inventer.`
  const approfondir = hasSegments
    ? `Le fond de la situation tient au choix du premier terrain d’apprentissage. ${compactSegmentList} ne donnent pas la même preuve : ${priority.label} doit prouver l’usage et la valeur, ${secondary?.label ?? 'la cible suivante'} peut élargir l’apprentissage, et ${deferred?.label ?? 'la dernière cible'} ne doit monter que si le coût de vente ou d’intégration devient justifié. Le pari implicite est clair : mieux vaut une petite preuve de workflow qu’une grande preuve d’intérêt.`
    : 'Le fond de la situation tient à une absence d’informations qualifiées. La ressource doit être relue non comme une vitrine, mais comme un inventaire de publics, usages, offres et preuves. Tant que ces éléments restent implicites, la carte doit afficher sa prudence plutôt que trancher par formule.'
  const missingExternalEvidence = needsExternalEvidenceWithoutSources(input.resources)
  const probability = probabilityFromResources(input.resources, relevanceQuery) ?? probabilityFromMissingResources(input.resources) ?? probabilityFromTheatre(input.theatre)
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

function strategicOptionsFromResources(input: WritingEngineInput): string[] {
  const groundedOptions = unique(
    (input.grounding?.options ?? [])
      .map((option) => cleanAudienceCandidate(option.label_fr))
      .filter(Boolean)
  )
  if (groundedOptions.length >= 2) return groundedOptions.slice(0, 4)

  return unique(
    (input.resources?.extracted_options ?? [])
      .filter((option) =>
        ['strategic_option', 'offer', 'use_case', 'proof_signal'].includes(option.kind) &&
        !isNavigationAudienceCandidate(option.label_fr)
      )
      .map((option) => cleanAudienceCandidate(option.label_fr))
      .filter(Boolean)
  ).slice(0, 4)
}

function strategicOptionsFromSituation(input: WritingEngineInput): string[] {
  const resourceOptions = strategicOptionsFromResources(input)
  if (resourceOptions.length >= 2) return resourceOptions
  if (input.grounding && !input.grounding.permissions.can_write_options) return []

  const text = `${input.interpretation.raw_input} ${input.interpretation.situation_soumise} ${input.interpretation.object_of_analysis}`
  const sellExploit = /\b(vendre|cession|c[ée]der)\b/i.test(text) && /\b(exploiter|exploitation|licence|licensing)\b/i.test(text)
  if (sellExploit) return ['vendre ou céder l’actif', 'l’exploiter directement', 'chercher une licence ou un partenariat']

  const publicFrame = /\b(gouvernement|gouvernemental|public|administration|directions?|r[ée]glement|dispositions?|normes?|subventions?)\b/i.test(text)
  if (publicFrame) return ['aligner l’offre sur le cadre public', 'tester un pilote avec décideur identifié', 'différer les services non vérifiés par le terrain']

  const productPriority = /\b(produits?|services?|offres?)\b/i.test(text) && /\b(prioriser|prioritaire|choisir|options?)\b/i.test(text)
  if (productPriority) return ['prioriser l’offre la plus testable', 'adapter l’offre au segment le plus contraint', 'différer les offres sans preuve d’usage']

  return []
}

function composeStrategicOptionsWriting(input: WritingEngineInput, started: number): WritingContract {
  const subject = input.interpretation.situation_soumise || input.interpretation.object_of_analysis || 'la décision stratégique'
  const options = strategicOptionsFromSituation(input)
  const hasGroundedOptions = options.length >= 2
  const optionList = hasGroundedOptions ? options.join(' ; ') : 'options réelles non encore établies par les ressources lues'
  const priority = options[0] ?? 'l’option que la matière rendra prioritaire'
  const secondary = options[1] ?? 'une piste concurrente'
  const deferred = options[2] ?? 'une piste à différer'
  const proof = 'usage répété, accord pilote, paiement, décision publique, coût évité ou refus explicite'
  const title = input.interpretation.header_subject || 'arbitrage stratégique'
  const diamond = `La bonne option n’est pas celle qui décrit le mieux la situation ; c’est celle qui produit le signal de décision le plus vite sans fermer les autres pistes.`
  const insight = hasGroundedOptions
    ? `${subject} doit être lu comme un arbitrage prospectif entre options : ${optionList}. La carte doit aider à choisir l’hypothèse la plus testable, pas seulement décrire ce qui manque.`
    : `${subject} doit être lu comme un arbitrage prospectif, mais les options réelles ne sont pas encore assez établies par la matière lue. La carte peut cadrer les critères de choix ; elle ne doit pas choisir à la place des faits.`
  const vulnerability = 'Le point fragile est le passage entre option séduisante, contrainte réelle et preuve de priorité.'
  const asymmetry = hasGroundedOptions
    ? `Plusieurs options peuvent rester rationnelles, mais elles ne produisent pas le même signal : ${priority} peut ouvrir un test court, ${secondary} peut servir de comparaison, et ${deferred} ne doit monter que si les preuves changent.`
    : 'Plusieurs options peuvent être possibles, mais SC ne doit pas les nommer tant que la matière comprise ne les a pas établies.'
  const keySignal = `Signal clé : chercher le premier fait qui rend une option plus défendable que les autres : ${proof}.`
  const relevanceQuery = writingRelevanceQuery(input)
  const lecture =
    (hasGroundedOptions
      ? `${subject} appelle un choix prospectif entre ${optionList}. Le bon premier mouvement est celui qui produit le signal le plus rapide sans fermer les autres pistes.\n\n`
      : `${subject} appelle un arbitrage prospectif. Tant que les options réelles ne sont pas établies par la matière comprise, SC doit cadrer les critères de priorité sans inventer les pistes métier. Le bon premier mouvement consiste à identifier les options depuis la matière, puis seulement à les classer.\n\n`) +
    `La contradiction centrale tient à ceci : plusieurs options peuvent sembler défendables, mais elles n’exigent pas les mêmes preuves. L’arbitrage doit donc comparer réversibilité, coût d’essai, accès au décideur, preuve d’usage et dépendance externe.\n\n` +
    `Le point de bascule sera concret : accord pilote, retour qualifié, paiement, refus explicite, décision publique, coût évité ou preuve que l’une des options ouvre un chemin que les autres ne peuvent pas ouvrir à court terme.`
  const probability = probabilityFromResources(input.resources, relevanceQuery) ?? probabilityFromMissingResources(input.resources) ?? probabilityFromTheatre(input.theatre)
  const trajectories: WritingContract['trajectories'] = [
    {
      type: 'stabilization',
      title_fr: 'Option testée',
      description_fr: `La situation se clarifie si ${priority} devient une hypothèse d’action courte, mesurable et réversible.`,
      signal_fr: 'Un décideur, un segment ou un terrain accepte un test avec critère de succès explicite.',
    },
    {
      type: 'escalation',
      title_fr: 'Arbitrage diffus',
      description_fr: 'La pression augmente si les options restent discutées sans test, responsable, contrainte ou signal de choix.',
      signal_fr: 'Les ressources se dispersent entre plusieurs pistes sans preuve de priorité.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Choix défendable',
      description_fr: 'La logique change quand une option produit une preuve que les autres ne produisent pas encore.',
      signal_fr: `Un signal dur apparaît : ${proof}.`,
    },
  ]

  return {
    substance_form: {
      substance_fr: ['options stratégiques', 'preuve de priorité', 'réversibilité', 'signal de choix'],
      form_fr: ['arbitrage prospectif', 'comparaison courte', 'test concret', 'condition de révision'],
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
        really: hasGroundedOptions
          ? `Le fond de la situation tient à un choix d’action, pas à une simple photographie. Les options à comparer sont : ${optionList}. Statut de preuve : ${probabilityLabelFr(probability).toLowerCase()}. ${polishPublicProofText(probability.claim_fr)} Ce classement donne un ordre d’essai, pas une vérité définitive.`
          : `Le fond de la situation tient à un choix d’action, pas à une simple photographie. Les options réelles ne sont pas encore établies par les ressources ou la matière comprise : SC doit donc expliciter les critères de priorité avant de classer.`,
        holds: hasGroundedOptions
          ? `La tenue du système vient de la possibilité de garder les options ouvertes tout en testant ${priority} sur un périmètre court. ${secondary} reste utile comme comparaison, et ${deferred} doit rester disponible si le signal attendu ne vient pas.`
          : 'La tenue du système vient de la séparation entre deux moments : comprendre les options réelles, puis seulement les hiérarchiser.',
        weakens: 'La fragilité vient de l’arbitrage sans test : discuter plusieurs pistes sans critère de succès peut donner une impression de stratégie tout en retardant la preuve utile.',
        escalates: `${trajectories[1].title_fr} : ${trajectories[1].description_fr} Signal à surveiller : ${trajectories[1].signal_fr}`,
        shifts: `${trajectories[2].title_fr} : ${trajectories[2].description_fr} Signal à surveiller : ${trajectories[2].signal_fr}`,
        watch: hasGroundedOptions
          ? `${keySignal} Si ce signal ne vient pas, il faut rejouer la carte avec ${secondary} ou ${deferred} plutôt que durcir la conclusion.`
          : `${keySignal} Si les options réelles restent absentes, la carte doit revenir à la matière ou aux sources avant de recommander.`,
      }),
    },
    public_warnings: hasGroundedOptions ? [] : ['Options réelles non établies par la matière lue.'],
    trace: {
      service: 'WritingEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: [
        'strategic_options_writing',
        `options=${options.length}`,
        (input.grounding?.options ?? []).length >= 2
          ? 'grounding_options_used'
          : (input.resources?.extracted_options ?? []).length >= 2
            ? 'resource_extracted_options_used'
            : input.grounding
              ? 'grounding_options_missing'
              : 'situation_option_fallback_used',
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
        signalSentence(evidence, 'relie offre, utilisateur, décision d’achat et conséquence observable'),
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
        signalSentence(evidence, 'modifie les marges militaires, diplomatiques ou économiques des acteurs engagés'),
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
      signalSentence(evidence, 'relie un acteur habilité, une règle et une conséquence observable'),
  }
}

export function composeDiamondWriting(input: WritingEngineInput): WritingContract {
  const started = Date.now()
  if (isTargetChoiceWithMaterial(input)) {
    return composeTargetChoiceWriting(input, started)
  }
  if (isStrategicOptionsWriting(input)) {
    return composeStrategicOptionsWriting(input, started)
  }

  const resonance = input.resonance ?? buildResonanceTrace({
    interpretation: input.interpretation,
    theatre: input.theatre,
    resources: input.resources,
  })
  const subject = publicSubject(input)
  const rawTitle = input.interpretation.header_subject
  const grammar = writingGrammar(input)
  const actors = publicAnchors(resonance.real_actors, grammar.actorsFallback)
  const title = isGenericPublicSubject(rawTitle) ? `situation ${actors}` : rawTitle
  const institutions = publicAnchors(resonance.institutions, grammar.institutionsFallback)
  const actionAnchors = theatreActionAnchors(input.theatre)
  const relevanceQuery = writingRelevanceQuery(input)
  const proofAnchors = unique([
    ...publicEvidenceAnchors(input.resources, relevanceQuery),
    ...publicEvidenceSignalAnchors(input.resources, relevanceQuery),
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
  const missingExternalEvidence = needsExternalEvidenceWithoutSources(input.resources)
  const probability = probabilityFromResources(input.resources, relevanceQuery) ?? probabilityFromMissingResources(input.resources) ?? probabilityFromTheatre(input.theatre)
  const resourcesWarning = resourceWarning(input.resources)
  const groundedFactOpening = groundedFactOpeningSentence(input.grounding, input.resources)
  const sourcedDiamondText = sourceGroundedDiamondText({ resonance, actors, institutions })
  const sourcedVulnerabilityText = sourceGroundedVulnerabilityText({ resonance, institutions })
  const sourcedContradictionText = sourceGroundedContradictionText({ resonance, actors, institutions })
  const diamondText = polishPublicProofText(compactSentence(
    sourcedDiamondText || resonance.diamond_thesis_fr || grammar.diamond(tension, institutions, firstProcedure),
    320,
  ))

  const publicWarnings = [
    input.safety.required_disclaimer_fr,
    resourcesWarning,
    ...input.scoring.scoring_warnings,
  ].filter((item): item is string => Boolean(item))

  const scInsight = polishPublicProofText(compactSentence(
    missingExternalEvidence
      ? `Lecture structurelle provisoire : ${grammar.insight(subject, tension, firstProcedure, institutions)}`
      : grammar.insight(subject, tension, firstProcedure, institutions),
    360,
  ))
  const vulnerability = polishPublicProofText(compactSentence(
    sourcedVulnerabilityText || resonance.structural_vulnerability_fr || grammar.vulnerability(blindSpot),
    320,
  ))
  const asymmetry = polishPublicProofText(compactSentence(grammar.asymmetry(actors, institutions)))
  const keySignal = polishPublicProofText(compactSentence(grammar.keySignal(firstEvidence)))
  const rawTrajectories: WritingContract['trajectories'] = [
    {
      type: 'stabilization',
      title_fr: 'Clarification',
      description_fr: 'La situation se clarifie si un acteur habilite confirme publiquement son role ou ses limites.',
      signal_fr: `Un element verifiable apparait : ${firstEvidence}.`,
    },
    {
      type: 'escalation',
      title_fr: 'Tension accrue',
      description_fr: 'La pression augmente si un acteur jusque-la secondaire obtient un levier public, juridique, militaire ou narratif.',
      signal_fr: `Le manque critique reste : ${blindSpot}.`,
    },
    {
      type: 'regime_shift',
      title_fr: 'Bascule',
      description_fr: 'La logique change quand une preuve, une règle ou un acteur rend la lecture difficile à maintenir dans le flou.',
      signal_fr: 'Une decision, un document, une action ou un seuil rend la lecture non reversible.',
    },
  ]
  const trajectories = rawTrajectories.map((trajectory) => ({
    ...trajectory,
    description_fr: polishPublicProofText(trajectory.description_fr),
    signal_fr: polishPublicProofText(trajectory.signal_fr),
  }))
  const trajectoryText = trajectorySpine(trajectories)
  const probabilityText = probabilitySpine(probability)
  const probabilityDemonstration = probabilityDemonstrationSentence(probability)
  const probabilityChange = probabilityChangeSentence(probability)
  const evidenceGapOpening = missingExternalEvidence
    ? `Lecture provisoire : la carte situe les seuils à vérifier, pas l’état factuel du jour.`
    : ''
  const lecture = [
    evidenceGapOpening,
    groundedFactOpening,
    diamondText,
    sourcedContradictionText || resonance.structural_contradiction_fr || `La scene utile n est donc pas le bruit public, mais la chaine qui relie ${actors}, ${firstProcedure} et ${evidence}.`,
    vulnerability,
  ].filter(Boolean).join(' ')
  const lectureFr = polishPublicProofText(compactSentence(lecture, 820))
  const approfondirAnalysis = [
    groundedFactOpening,
    diamondText,
    grammar.approfondirEntry,
    sourcedContradictionText || resonance.structural_contradiction_fr || grammar.supportSentence(actors, institutions),
    `Ce qu il faut etablir n est pas seulement l intention, mais le lien entre ${firstProcedure}, ${evidence} et ${blindSpot}.`,
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
      text_fr: lectureFr,
      word_count_fr: countWords(lectureFr),
    },
    approfondir: {
      analysis_fr: polishPublicProofText(approfondirAnalysis),
      sections_fr: canonicalApprofondirSections({
        really: `${missingExternalEvidence ? 'Lecture structurelle provisoire : aucun signal public n’a été retenu comme preuve suffisante. ' : ''}${diamondText} La lecture utile consiste à distinguer trois choses : qui porte le coût, qui garde la marge d’arbitrage, et quel fait rendrait la situation opposable. ${probabilityDemonstration}`,
        holds: sourcedContradictionText || resonance.structural_contradiction_fr || grammar.supportSentence(actors, institutions),
        weakens: `La fragilité tient au point suivant : ${blindSpot}. Tant que ce mécanisme n’est pas relié à ${evidence}, la lecture reste une hypothèse structurée plutôt qu’un constat vérifiable.`,
        escalates: `${trajectories[1].title_fr} : ${trajectories[1].description_fr} Signal à surveiller : ${trajectories[1].signal_fr} Le statut reste ${probabilityLabelFr(probability).toLowerCase()} tant que ce relais n’est pas observable.`,
        shifts: `${trajectories[2].title_fr} : ${trajectories[2].description_fr} Signal à surveiller : ${trajectories[2].signal_fr} ${probabilityChange}`,
        watch: `${conciseWatchSignal(firstEvidence)} ${probabilityChange} À vérifier : ${blindSpot}.`,
      }),
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
    '- si des public_sources existent, elles restent attachees au contrat ressources et au panneau Ressources dedie ; Approfondir peut qualifier le statut de preuve, mais ne doit pas lister les sources ;',
    '- ne jamais écrire "sources mobilisées", ne jamais lister les domaines ou médias dans la phrase diamant, l asymetrie, Lecture ou Approfondir ; transformer les sources en faits publics datés ou en signaux structurants.',
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
          clean_public_evidence: publicProbativeEvidence(input.resources, 3, writingRelevanceQuery(input)).map((evidence) => ({
            fact_fr: evidence.public_label_fr,
            status: evidence.status,
            can_drive_probability: evidence.can_drive_probability,
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
