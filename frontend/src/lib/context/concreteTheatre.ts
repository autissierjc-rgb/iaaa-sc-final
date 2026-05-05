import { cleanModelText } from '../ai/json'
import type {
  ArbreACamesAnalysis,
  ConcreteTheatre,
  IntentContext,
  ResourceItem,
  SituationDomain,
} from '../resources/resourceContract'

function compact(value: unknown): string {
  return cleanModelText(String(value ?? '')).replace(/\s+/g, ' ').trim()
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isInternalAnchor(value: string): boolean {
  const normalized = normalizeKey(value)
  if (/^(que|quoi|qui|comment|pourquoi|où|ou)$/.test(normalized)) return true
  if (/\b(que\s+fait|que\s+propose|qu['’]en\s+penser|est[-\s]?ce\s+int[ée]ressant|comment\s+r[ée]agir)\b/i.test(value)) return true
  return [
    /\bclarify_[a-z_]+\b/i,
    /\bunderstand_situation\b/i,
    /\bacteurs?\s+(directs?|influents?|capables?|engag[ée]s?|impliqu[ée]s?|concern[ée]s?)\b/i,
    /\bmanager,\s*[ée]quipe,\s*d[ée]cideur r[ée]el\b/i,
    /\bpersonne qui porte la charge\b/i,
    /\btiers de m[ée]diation\b/i,
    /\bpersonnes impliqu[ée]es\b/i,
    /\bacteurs visibles\b/i,
    /\bcontraintes mat[ée]rielles\b/i,
    /\bcontraintes de temps,\s*ressources,\s*d[ée]pendances\b/i,
    /\bmarges d[’']action limit[ée]es\b/i,
    /\bmandat r[ée]el,\s*pouvoir de d[ée]cision\b/i,
    /\bmandat officiel\b/i,
    /\br[ôo]le r[ée]el\b/i,
    /\bhi[ée]rarchie et arbitrage\b/i,
    /\breconnaissance\b/i,
    /\bcharge collective\b/i,
    /\btension\b/i,
    /\bm[ée]canismes concrets\b/i,
    /\bseuils observables\b/i,
    /\bpoints capables de bloquer\b/i,
    /\bproc[ée]dures,\s*gestes ou d[ée]cisions observables\b/i,
    /\binstitutions ou r[èe]gles capables de transformer\b/i,
    /\br[èe]gles et institutions\b/i,
    /\br[ée]cit dominant\b/i,
    /\bobjet interpr[ée]t[ée]\b/i,
    /\btension interpr[ée]t[ée]\b/i,
    /\bpersonal_relationship\b/i,
    /\bsite_analysis\b/i,
    /\bstartup_investment\b/i,
  ].some((pattern) => pattern.test(value))
}

function unique(items: string[], max = 8): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items.map(compact).filter(Boolean)) {
    const cleaned = item.replace(/[.;:]+$/g, '').trim()
    if (cleaned.length < 3 || cleaned.length > 120) continue
    if (isInternalAnchor(cleaned)) continue
    const key = normalizeKey(cleaned)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(cleaned)
    if (result.length >= max) break
  }
  return result
}

function splitItems(values: unknown[], max = 12): string[] {
  return unique(
    values
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .flatMap((value) => compact(value).split(/\s*(?:[;•]|\s\/\s)\s*/))
      .map((value) => value.replace(/^puissances en présence\s*:\s*/i, '').trim()),
    max
  )
}

function properNames(situation: string): string[] {
  return unique(
    situation.match(/\b[A-ZÉÈÀÂÎÔÛÇ][A-Za-zÀ-ÿ0-9'’-]{2,}(?:\s+[A-ZÉÈÀÂÎÔÛÇ][A-Za-zÀ-ÿ0-9'’-]{2,}){0,3}\b/g) ?? [],
    10
  ).filter((item) => !/^(Comment|Pourquoi|Quelle|Quel|Quels|Quelles|Après|Apres|Pour|Dans|Que|Qui|Quoi|Ou|Où)$/i.test(item))
}

function datesAndNumbers(situation: string, resources: ResourceItem[]): string[] {
  return unique([
    ...(situation.match(/\b(?:\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4}|\d{4}|[0-9]+(?:\s?jours?|\s?ans?)?)\b/gi) ?? []),
    ...resources.map((resource) => resource.date ?? ''),
  ], 8)
}

function resourceAnchors(resources: ResourceItem[]): string[] {
  return unique(
    resources.flatMap((resource) => [
      resource.title,
      resource.source,
      resource.type === 'site-brief' ? resource.excerpt ?? '' : '',
    ]),
    8
  )
}

function hasElectionFrame(text: string): boolean {
  return /\b([ée]lections?|[ée]lectoral|mi[-\s]?mandat|r[eé]sultats?|certification|fraude|vote|scrutin|congr[eè]s|cour supr[eê]me)\b/i.test(text)
}

function hasPersonalFrame(text: string): boolean {
  return /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|p[eê]re|m[eè]re|famille|ami|amie|couple|affectif|aime|aimait|honte|reproche|silence|voiture|trajet|coeur|cœur|rendez[-\s]?vous|retrouv|message)\b/i.test(text)
}

function hasSiteFrame(text: string, intentContext?: IntentContext): boolean {
  return intentContext?.dominant_frame === 'site_analysis' ||
    intentContext?.decision_type === 'analyze_site' ||
    /\bhttps?:\/\/|site\b/i.test(text)
}

function hasStartupFrame(text: string, intentContext?: IntentContext): boolean {
  return intentContext?.dominant_frame === 'startup_investment' ||
    intentContext?.decision_type === 'evaluate_investment' ||
    intentContext?.interpreted_request?.domain === 'startup_vc' ||
    intentContext?.surface_domain === 'startup_vc' ||
    /\b(startup|start-up|compagnie|entreprise|soci[ée]t[ée]|scale[-\s]?up|plateforme|produit|solution|service|rejoindre|collaborer|partenariat|investir)\b/i.test(text)
}

function inferDomain(situation: string, intentContext?: IntentContext): SituationDomain {
  if (intentContext?.interpreted_request?.domain) return intentContext.interpreted_request.domain
  if (intentContext?.surface_domain) return intentContext.surface_domain
  if (hasPersonalFrame(situation)) return 'personal'
  if (hasElectionFrame(situation)) return 'governance'
  if (/\b(guerre|frappe|missile|attaque|cessez-le-feu|militaire|armée|otan|iran|isra[eë]l|ukraine)\b/i.test(situation)) return 'war'
  if (hasStartupFrame(situation, intentContext)) return 'startup_vc'
  if (hasSiteFrame(situation, intentContext)) return 'startup_vc'
  return 'general'
}

function electionProfile(situation: string): Partial<ConcreteTheatre> {
  const trumpLike = /\b(trump|donald trump|rump)\b/i.test(situation)
  const usLike = trumpLike || /\b([ée]tats[-\s]?unis|usa|am[ée]ricain|midterms?|congr[eè]s)\b/i.test(situation)
  return {
    institutions: usLike
      ? ['Congrès', 'États fédérés', 'autorités électorales locales', 'gouverneurs', 'secrétaires d’État des États', 'tribunaux', 'Cour suprême']
      : ['autorités électorales', 'tribunaux', 'partis politiques', 'organes de certification', 'gouvernement'],
    procedures: ['certification des résultats', 'contentieux électoral', 'recours judiciaires', 'calendrier électoral', 'contestation des résultats'],
    precedents: usLike ? ['6 janvier 2021', 'rhétorique de fraude électorale'] : ['précédents de contestation électorale'],
    relays: ['parti politique', 'médias alliés', 'responsables locaux', 'réseaux militants'],
    blockers: ['tribunaux', 'autorités de certification', 'responsables électoraux', 'opposition politique'],
    mechanisms: ['refus de certification', 'pression sur les résultats', 'contentieux coordonné', 'mobilisation de rue', 'consigne publique'],
    thresholds: ['retard de certification', 'refus d’accepter un résultat', 'décision judiciaire structurante', 'blocage institutionnel'],
    evidence_to_watch: ['déclarations officielles', 'recours déposés', 'positions des responsables électoraux', 'décisions de justice', 'appels à mobilisation'],
  }
}

function personalProfile(situation: string): Partial<ConcreteTheatre> {
  const familyScene = /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|p[eê]re|m[eè]re)\b/i.test(situation)
  const friendScene = /\b(ami|amie|ex|ancienne relation|ancien amour|amoureux|amoureuse|retrouv|rendez[-\s]?vous)\b/i.test(situation)
  const actors = unique([
    /\bfils\b/i.test(situation) ? 'le fils' : '',
    /\bfille\b/i.test(situation) ? 'la fille' : '',
    familyScene && /\b(parent|p[eè]re|m[eè]re|je)\b/i.test(situation) ? 'le parent' : '',
    friendScene && /\bje\b/i.test(situation) ? 'l’utilisateur' : '',
    /\bamie\b/i.test(situation) ? 'l’amie' : '',
    /\bami\b/i.test(situation) ? 'l’ami' : '',
    /\bamie\b/i.test(situation) && /\brusse\b/i.test(situation) ? 'l’amie russe' : '',
    ...properNames(situation),
  ], 8)
  const mechanisms = unique([
    /\breproch/i.test(situation) ? 'reproche' : '',
    /\bsilence|pas r[eé]agi|reagi\b/i.test(situation) ? 'silence' : '',
    /\bvoiture\b/i.test(situation) ? 'retrait dans la voiture' : '',
    /\baim/i.test(situation) ? 'parole affective' : '',
    /\bp[eê]che|carpe\b/i.test(situation) ? 'déception autour de la pêche' : '',
    /\bcoeur|cœur|❤|♥/i.test(situation) ? 'cœur dans le message' : '',
    /\bmessage|texto|sms|whatsapp\b/i.test(situation) ? 'message reçu' : '',
    /\b10\s*ans|dix\s+ans\b/i.test(situation) ? 'dix ans sans se voir' : '',
    /\bparis\b/i.test(situation) ? 'venue à Paris' : '',
    'réparation du lien',
  ], 8)
  return {
    actors,
    institutions: [],
    procedures: friendScene
      ? ['réponse au message', 'proposition de rendez-vous', 'rencontre réelle', 'clarification sans pression']
      : ['conversation de reprise', 'excuse ou reconnaissance', 'limite posée sans humiliation'],
    places: unique([
      /\bvoiture\b/i.test(situation) ? 'voiture' : '',
      /\bp[eê]che|carpe\b/i.test(situation) ? 'lieu de pêche' : '',
      /\btrajet\b/i.test(situation) ? 'trajet de retour' : '',
      /\bparis\b/i.test(situation) ? 'Paris' : '',
    ], 5),
    relays: friendScene
      ? ['attachement ancien', 'ambiguïté du cœur', 'souvenir du lien', 'attente créée par la venue']
      : ['regard parental', 'honte possible', 'besoin de sauver la face', 'attachement'],
    blockers: friendScene
      ? ['distance', 'temps écoulé', 'projection', 'peur de surinterpréter']
      : ['fatigue', 'orgueil adolescent', 'peur de décevoir', 'silence interprété comme rejet'],
    mechanisms,
    thresholds: friendScene
      ? ['proposition concrète de rendez-vous', 'ton des prochains messages', 'parole explicite sur l’intention', 'rencontre réelle à Paris']
      : ['retour au dialogue', 'retrait répété', 'reproche qui devient scénario', 'parole de réparation'],
    evidence_to_watch: friendScene
      ? ['mots exacts', 'rythme des messages', 'initiative de rendez-vous', 'cohérence entre message et actes']
      : ['mots exacts', 'moment de la parole', 'répétition du retrait', 'capacité à reparler sans accusation'],
  }
}

function siteProfile(situation: string, resources: ResourceItem[]): Partial<ConcreteTheatre> {
  const siteBrief = resources.find((resource) => resource.type === 'site-brief')
  if (!siteBrief) {
    return {
      actors: unique([
        ...properNames(situation),
        /\bma\s+startup|mon\s+entreprise|notre\s+startup|notre\s+entreprise\b/i.test(situation) ? 'votre startup' : '',
      ], 6),
      procedures: unique([
        /\brejoindre|collaborer|partenariat|investir\b/i.test(situation) ? 'décision éventuelle de rejoindre' : '',
      ], 3),
      evidence_to_watch: [
        'URL officielle',
        'description produit',
        'cible réelle',
        'cas d’usage',
        'preuves d’usage',
        'clients ou partenaires vérifiables',
        'conditions de collaboration',
      ],
      missing_anchors: ['source ou contenu exploitable'],
    }
  }
  return {
    actors: ['utilisateurs visés', 'équipe produit', 'clients ou partenaires visibles'],
    institutions: ['cadre légal', 'cadre fiscal', 'règles de travail ou de responsabilité'],
    procedures: ['parcours produit', 'décision d’achat', 'tarification', 'inscription', 'preuve d’usage'],
    mechanisms: ['promesse produit', 'cas d’usage', 'différenciation', 'preuve de marché'],
    thresholds: ['client identifiable', 'usage répété', 'revenu', 'partenariat vérifiable', 'rétention'],
    evidence_to_watch: ['pages produit', 'clients cités', 'prix', 'cas d’usage', 'preuves externes'],
    anchors: siteBrief ? [siteBrief.title, siteBrief.source] : [],
  }
}

export function buildConcreteTheatre({
  situation,
  arbre,
  resources = [],
  intentContext,
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  resources?: ResourceItem[]
  intentContext?: IntentContext
}): ConcreteTheatre {
  const domain = inferDomain(situation, intentContext)
  const baseActors = splitItems([arbre?.acteurs, intentContext?.interpreted_request?.object_of_analysis], 8)
  const baseInstitutions = splitItems([arbre?.contraintes], 6)
  const baseMechanisms = splitItems([arbre?.forces, arbre?.tensions, arbre?.rapports_de_force], 8)
  const baseThresholds = splitItems([arbre?.temps, arbre?.temporalites, arbre?.trajectoires], 8)
  const baseEvidence = splitItems([arbre?.incertitudes, arbre?.vulnerabilites], 8)
  const profile =
    hasElectionFrame(situation) && (domain === 'governance' || domain === 'geopolitics' || domain === 'general')
      ? electionProfile(situation)
      : hasPersonalFrame(situation) || domain === 'personal'
        ? personalProfile(situation)
        : hasSiteFrame(situation, intentContext) || hasStartupFrame(situation, intentContext) || domain === 'startup_vc'
          ? siteProfile(situation, resources)
          : {}

  const actors = unique([...(profile.actors ?? []), ...properNames(situation), ...(domain === 'personal' ? [] : baseActors)], 10)
  const institutions = unique([...(profile.institutions ?? []), ...(domain === 'personal' ? [] : baseInstitutions)], 10)
  const procedures = unique(profile.procedures ?? [], 8)
  const places = unique([...(profile.places ?? []), ...(situation.match(/\b(?:Iran|Isra[eë]l|Gaza|Ukraine|France|Europe|États-Unis|Etats-Unis|Washington|Paris)\b/gi) ?? [])], 8)
  const dates = datesAndNumbers(situation, resources)
  const precedents = unique(profile.precedents ?? [], 6)
  const relays = unique(profile.relays ?? [], 8)
  const blockers = unique(profile.blockers ?? [], 8)
  const mechanisms = unique([...(profile.mechanisms ?? []), ...baseMechanisms], 10)
  const thresholds = unique([...(profile.thresholds ?? []), ...baseThresholds], 10)
  const evidence = unique([...(profile.evidence_to_watch ?? []), ...baseEvidence], 10)
  const anchors = unique([
    ...(profile.anchors ?? []),
    ...actors,
    ...institutions,
    ...procedures,
    ...places,
    ...dates,
    ...precedents,
    ...mechanisms,
    ...resourceAnchors(resources),
  ], 18)

  const missing = unique([
    actors.length === 0 ? 'acteurs nommés' : '',
    mechanisms.length === 0 ? 'mécanismes concrets' : '',
    thresholds.length === 0 ? 'seuils observables' : '',
    domain !== 'personal' && institutions.length === 0 ? 'institutions ou règles' : '',
    ...(profile.missing_anchors ?? []),
  ], 6)

  return {
    domain,
    anchors,
    actors,
    institutions,
    procedures,
    places,
    dates,
    precedents,
    relays,
    blockers,
    mechanisms,
    thresholds,
    evidence_to_watch: evidence,
    missing_anchors: missing,
    guidance_fr:
      'Avant de conclure, ancrer la lecture dans ce théâtre réel : acteurs nommés, institutions ou liens, procédures ou gestes, précédents, seuils et preuves à surveiller. Les abstractions ne sont acceptables que si elles sont immédiatement reliées à ces éléments.',
    guidance_en:
      'Before concluding, anchor the reading in this real theatre: named actors, institutions or bonds, procedures or gestures, precedents, thresholds, and evidence to watch. Abstractions are acceptable only when immediately tied to those elements.',
  }
}

export function theatreAnchorText(theatre?: ConcreteTheatre, max = 10): string {
  if (!theatre) return ''
  return unique([
    ...theatre.actors,
    ...theatre.institutions,
    ...theatre.procedures,
    ...theatre.places,
    ...theatre.dates,
    ...theatre.precedents,
    ...theatre.mechanisms,
    ...theatre.thresholds,
  ], max).join(', ')
}
