import { cleanModelText } from '../ai/json'
import type {
  ArbreACamesAnalysis,
  DeepReading,
  ResourceItem,
  ScopeContext,
  SituationCard,
} from '../resources/resourceContract'
import { buildCausalMatter } from '../text/diamondConcrete'
import { theatreAnchorText } from '../context/concreteTheatre'

export const DIAMOND_DEEP_HEADINGS_FR = [
  'Ce que la situation est réellement',
  'Ce qui tient le système',
  'Ce qui l’affaiblit',
  'Ce qui pourrait déclencher une escalade',
  'Ce qui pourrait produire une bascule',
  'Ce qu’il faut surveiller maintenant',
] as const

export const DIAMOND_DEEP_HEADINGS_EN = [
  'What the situation really is',
  'What holds the system together',
  'What weakens it',
  'What could trigger escalation',
  'What could produce a shift',
  'What to watch now',
] as const

export function polishDiamondText(text: string): string {
  const polished = cleanModelText(text)
    .replace(/\b(?:general_analysis|understand_situation|site_analysis|startup_investment|personal_relationship)\b/gi, '')
    .replace(/\bLa question décisive est simple\s*:\s*quel acteur, quel geste, quelle règle ou quelle preuve peut transformer l[’']hypothèse en fait observable\s*\??/gi, '')
    .replace(/\bDes éléments visibles existent, mais leur portée reste à établir par des preuves concrètes\.?/gi, '')
    .replace(/\bUn objet visible garde un rôle parce qu[’']il condense des rapports de confiance, de preuve et de pouvoir\.?/gi, '')
    .replace(/\s*\((?:peuvent?|transforme|rendent?|réduit|ouvrent?|donnent?|gardent?|portent?|cadre|condense)[^)]{8,}\)/gi, '')
    .replace(/\bDirigeants et partis,\s*Institutions,\s*Opinion publique,\s*Médias et récits publics,\s*Calendrier politique\b/gi, '')
    .replace(/\bLa situation tient encore par\s+et\s+/gi, 'La situation tient encore par ')
    .replace(/\bque un\b/gi, 'qu’un')
    .replace(/\bde le\b/gi, 'du')
    .replace(/\ba le\b/gi, 'au')
    .replace(/([.!?])\s*\./g, '$1')
    .replace(/\s+([,.])/g, '$1')
    .replace(/\s*([;:!?])\s*/g, ' $1 ')
    .replace(/([,.;:!?])(?=\S)/g, '$1 ')
    .replace(/\b([a-z0-9-]+)\.\s+(com|fr|org|net|io|ai|co)\b/gi, '$1.$2')
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .trim()
  const withHeadings = [...DIAMOND_DEEP_HEADINGS_FR, ...DIAMOND_DEEP_HEADINGS_EN].reduce(
    (value, heading) => value.replace(new RegExp(`\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), `\n\n${heading}\n\n`),
    polished
  )

  return withHeadings
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .map((paragraph, index, paragraphs) => {
      const previous = paragraphs[index - 1]?.replace(/\s+/g, ' ').trim()
      const isHeading = [...DIAMOND_DEEP_HEADINGS_FR, ...DIAMOND_DEEP_HEADINGS_EN].includes(previous as any)
      return isHeading ? paragraph.replace(/^[,;:]\s*/, '') : paragraph
    })
    .filter(Boolean)
    .join('\n\n')
}

export function hasDiamondDeepSections(value: string): boolean {
  const text = polishDiamondText(value)
  return DIAMOND_DEEP_HEADINGS_FR.every((heading) => text.includes(heading)) &&
    text.indexOf(DIAMOND_DEEP_HEADINGS_FR[0]) < text.indexOf(DIAMOND_DEEP_HEADINGS_FR[1])
}

function compact(value: unknown): string {
  return cleanModelText(String(value ?? '')).replace(/[.;:]+$/g, '').trim()
}

function firstArrayItem(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : undefined
}

function firstUseful(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = compact(value)
    if (text && text.length > 8) return text
  }
  return fallback
}

function listSentence(values: unknown[], fallback: string): string {
  const items = values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(compact)
    .filter(Boolean)
    .slice(0, 3)

  return items.length > 0 ? items.join('. ') : fallback
}

function splitItems(values: unknown[], max = 5): string[] {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .flatMap((value) => compact(value).split(/\s*[;•]\s*/))
    .map((value) => value.replace(/^puissances en présence\s*:\s*/i, '').trim())
    .filter((value) => value.length > 4)
    .slice(0, max)
}

function concreteAnchors(situation: string, arbre?: ArbreACamesAnalysis): string[] {
  const fromArbre = splitItems([
    arbre?.acteurs,
    arbre?.forces,
    arbre?.contraintes,
    arbre?.temps,
    arbre?.temporalites,
    arbre?.perceptions,
    arbre?.sens_perceptions,
  ], 8)

  const properNames = Array.from(
    new Set(
      situation.match(/\b[A-ZÉÈÀÂÎÔÛÇ][A-Za-zÀ-ÿ0-9'’-]{2,}(?:\s+[A-ZÉÈÀÂÎÔÛÇ][A-Za-zÀ-ÿ0-9'’-]{2,}){0,2}\b/g) ?? []
    )
  ).filter((name) => !/^(Deux|Après|Apres|Où|Ou|Quel|Quelle|Pourquoi|Comment)$/i.test(name))

  return [...properNames, ...fromArbre]
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((item) => item.length < 80)
    .filter((item) => !/[,:;]{2,}|[,;].*[,;]/.test(item))
    .filter((item, index, all) => all.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 8)
}

function readableList(items: string[], fallback: string): string {
  if (items.length === 0) return fallback
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} et ${items[1]}`
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

function hasConcreteItems(items?: string[]): boolean {
  return Array.isArray(items) && items.some((item) => compact(item).length > 3)
}

function hasDemonstrableTheatre(theatre: SituationCard['concrete_theatre'] | undefined): boolean {
  if (!theatre || !hasConcreteItems(theatre.anchors)) return false
  if (
    (theatre.domain === 'startup_vc' || theatre.domain === 'general') &&
    (theatre.missing_anchors ?? []).some((item) => /source|contenu exploitable/i.test(item))
  ) {
    return false
  }
  return [
    theatre.institutions,
    theatre.procedures,
    theatre.places,
    theatre.dates,
    theatre.precedents,
    theatre.relays,
    theatre.blockers,
    theatre.mechanisms,
    theatre.thresholds,
    theatre.evidence_to_watch,
  ].some(hasConcreteItems)
}

function concreteList(items: string[] | undefined, fallback: string, max = 4): string {
  const cleaned = (items ?? []).map(compact).filter(Boolean).slice(0, max)
  return readableList(cleaned, fallback)
}

function publicHoldingSentence(theatre: SituationCard['concrete_theatre'] | undefined, tension: string): string {
  if (!theatre || theatre.anchors.length === 0) {
    return `${capitalizeFirst(tension)}. La situation reste ouverte tant qu’aucun fait précis ne la transforme en décision, coût ou rupture observable.`
  }

  if (theatre.domain === 'governance') {
    const institutions = concreteList(theatre.institutions, 'les institutions chargées d’arbitrer')
    const procedures = concreteList(theatre.procedures, 'les procédures qui donnent forme à la contestation')
    return `Le système tient tant que ${institutions} gardent ${procedures} dans un cadre vérifiable. La tension devient sérieuse lorsque ces procédures ne servent plus seulement à compter ou arbitrer, mais à retarder, contester ou bloquer.`
  }

  if (theatre.domain === 'personal') {
    const actors = concreteList(theatre.actors, 'les personnes concernées')
    const mechanisms = concreteList(theatre.mechanisms, 'les gestes et silences de la scène')
    return `Le lien tient encore par ${actors} et par ${mechanisms}. Ce qui compte n’est pas une explication générale, mais la suite des gestes : parole reprise, retrait répété, rendez-vous proposé ou clarification évitée.`
  }

  const actors = concreteList(theatre.actors, 'les acteurs nommés')
  if (hasConcreteItems(theatre.mechanisms)) {
    const mechanisms = concreteList(theatre.mechanisms, 'les faits à vérifier')
    return `${capitalizeFirst(tension)}. La situation tient encore par ${actors} et ${mechanisms}, tant qu’aucune trace située ne permet de conclure.`
  }
  return `${capitalizeFirst(tension)}. La situation tient encore par ${actors}, mais il manque les faits concrets qui permettraient de dire ce que ces acteurs font réellement.`
}

function publicWeakeningSentence(theatre: SituationCard['concrete_theatre'] | undefined): string {
  if (!theatre || theatre.anchors.length === 0) {
    return 'Ce qui l’affaiblit, c’est l’écart entre une hypothèse plausible et les traces capables de la vérifier.'
  }

  if (theatre.domain === 'governance') {
    const relays = concreteList(theatre.relays, 'les relais partisans ou institutionnels')
    const blockers = concreteList(theatre.blockers, 'les acteurs capables de bloquer')
    return `Ce qui l’affaiblit, c’est le passage possible de la contestation vers ${relays} et ${blockers}. À ce stade, la question n’est plus seulement ce qui est dit publiquement, mais qui peut donner une forme institutionnelle au refus.`
  }

  if (theatre.domain === 'personal') {
    const blockers = concreteList(theatre.blockers, 'les freins du lien')
    const evidence = concreteList(theatre.evidence_to_watch, 'les signes à observer')
    return `Ce qui l’affaiblit, c’est ce que ${blockers} peuvent rendre muet ou indirect. La lecture doit alors s’appuyer sur ${evidence}, pas sur une certitude fabriquée trop vite.`
  }

  if (hasConcreteItems(theatre.blockers) || hasConcreteItems(theatre.evidence_to_watch)) {
    const blockers = concreteList(theatre.blockers, 'les points capables de bloquer')
    const evidence = concreteList(theatre.evidence_to_watch, 'les preuves à surveiller')
    return `Ce qui l’affaiblit, c’est ce que ${blockers} peuvent empêcher de voir. La lecture reste solide seulement si ${evidence} permettent de vérifier l’hypothèse.`
  }
  return 'Ce qui l’affaiblit, c’est l’absence de preuves situées : activité réelle, source fiable, acteurs identifiés, décision concrète ou trace vérifiable.'
}

function publicEscalationSentence(theatre: SituationCard['concrete_theatre'] | undefined): string {
  if (!theatre || theatre.anchors.length === 0) {
    return 'L’escalade commence lorsqu’un fait vérifiable oblige les acteurs à sortir du flou : décision, refus, coût visible ou changement de rythme.'
  }

  const procedures = concreteList(theatre.procedures, 'une procédure ou un geste observable')
  const mechanisms = concreteList(theatre.mechanisms, 'un mécanisme concret')
  return `L’escalade commence si ${procedures} ou ${mechanisms} change de fonction : ce qui était un signe devient alors une action, un blocage ou une contrainte visible.`
}

function publicShiftSentence(theatre: SituationCard['concrete_theatre'] | undefined): string {
  if (!theatre || theatre.anchors.length === 0) {
    return 'La bascule se produit quand une preuve relie clairement l’hypothèse à une conséquence observable.'
  }

  const thresholds = concreteList(theatre.thresholds, 'un seuil observable')
  const evidence = concreteList(theatre.evidence_to_watch, 'une trace vérifiable')
  return `La bascule se produit si ${thresholds} devient visible et si ${evidence} relie ce seuil à un acteur, une décision ou une conséquence précise.`
}

function trajectoryText(sc: SituationCard | undefined, type: string, fallback: string): string {
  const trajectories = Array.isArray(sc?.trajectories) ? sc.trajectories : []
  const item = trajectories.find((entry) => {
    if (!entry || typeof entry !== 'object') return false
    return (entry as Record<string, unknown>).type === type
  }) as Record<string, unknown> | undefined

  return firstUseful([item?.description_fr, item?.signal_fr], fallback)
}

function scopeChannels(scope?: ScopeContext): string {
  const channels = scope?.global_channels?.map(compact).filter(Boolean).slice(0, 5) ?? []
  if (channels.length > 0) return channels.join(', ')
  return 'décision, coût, récit public, temporalité et capacité d’action'
}

function realTheatre(situation: string, scope?: ScopeContext): string {
  if (scope?.scope === 'global') {
    return 'Le théâtre immédiat n’est que le point d’entrée ; l’enjeu est ce qu’il déplace autour de lui.'
  }

  if (scope?.scope === 'personal') {
    return 'Le fait visible ouvre sur ce qui se joue dans le lien, le rôle, le corps, la peur ou l’autonomie.'
  }

  if (scope?.scope === 'market') {
    return 'Le point décisif est ce qui peut être prouvé : marché, usage, budget, distribution et décision d’achat.'
  }

  if (scope?.scope === 'organizational') {
    return 'Le point décisif est la réalité des rôles : qui décide, qui porte la charge, qui bloque, qui rend possible.'
  }

  return 'Le point décisif est ce que la situation met concrètement en mouvement.'
}

function capitalizeFirst(value: string): string {
  if (!value) return value
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function understoodObject(sc?: SituationCard): string {
  return compact(sc?.intent_context?.interpreted_request?.object_of_analysis)
    || compact(sc?.submitted_situation_fr)
    || 'l’objet de la question'
}

function understoodTension(sc?: SituationCard): string {
  return compact(sc?.intent_context?.interpreted_request?.implicit_tension)
    || 'un format visible continue à organiser la confiance, la preuve et la décision'
}

function isUnderstandingRequest(sc?: SituationCard): boolean {
  const intent = sc?.intent_context?.interpreted_request?.intent_type
  const frame = sc?.intent_context?.dominant_frame
  const decision = sc?.intent_context?.decision_type
  return intent === 'understand' &&
    frame !== 'geopolitical_crisis' &&
    frame !== 'site_analysis' &&
    frame !== 'startup_investment' &&
    decision !== 'analyze_site' &&
    decision !== 'evaluate_investment'
}

function isGeopoliticalReading(sc?: SituationCard): boolean {
  const frame = sc?.intent_context?.dominant_frame ?? sc?.coverage_check?.intent_context?.dominant_frame
  const domain =
    sc?.intent_context?.surface_domain ??
    sc?.intent_context?.interpreted_request?.domain ??
    sc?.coverage_check?.domain
  return frame === 'geopolitical_crisis' || domain === 'geopolitics' || domain === 'war'
}

function isCausalAttributionReading(sc?: SituationCard): boolean {
  return sc?.intent_context?.interpreted_request?.question_type === 'causal_attribution' ||
    sc?.coverage_check?.intent_context?.interpreted_request?.question_type === 'causal_attribution' ||
    sc?.intent_context?.dominant_frame === 'causal_attribution' ||
    sc?.coverage_check?.intent_context?.dominant_frame === 'causal_attribution'
}

function isPersonalReading(sc?: SituationCard): boolean {
  const frame = sc?.intent_context?.dominant_frame ?? sc?.coverage_check?.intent_context?.dominant_frame
  const domain =
    sc?.intent_context?.interpreted_request?.domain ??
    sc?.intent_context?.surface_domain ??
    sc?.coverage_check?.domain
  return frame === 'personal_relationship' || domain === 'personal' || sc?.conversation_contract?.domain === 'personal'
}

function buildPersonalDeepFallback({
  situation,
  sc,
  resources,
}: {
  situation: string
  sc?: SituationCard
  resources: ResourceItem[]
}): DeepReading {
  const matter = sc?.conversation_contract?.required_matter_fr?.length
    ? sc.conversation_contract.required_matter_fr.join(', ')
    : compact(situation)
  const anchors = theatreAnchorText(sc?.concrete_theatre ?? sc?.coverage_check?.concrete_theatre, 8)
  const signal = compact(sc?.key_signal_fr) || 'le moment où le lien redevient dicible sans accusation ni défense'
  const watchSignal = signal
    .replace(/^le signal cl[eé]\s+(?:est|serait)\s*:?\s*/i, '')
    .replace(/^un signal cl[eé]\s+(?:est|serait)\s*:?\s*/i, '')
    .replace(/^[.:;,\s]+/g, '')
    .replace(/^([A-ZÉÈÀÂÊÎÔÛÇ])/, (match) => match.toLowerCase())
  const vulnerability = compact(sc?.main_vulnerability_fr) || 'le risque de laisser le silence devenir une interprétation de rejet'
  const familyScene = /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|p[eê]re|m[eè]re|p[eê]che|carpe)\b/i.test(`${matter} ${situation}`)

  if (!familyScene) {
    return {
      approfondir_fr: polishDiamondText(
        `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
        `La situation doit rester lue comme une scène relationnelle concrète : ${anchors || matter}. Elle ne parle pas d’un objet à évaluer, mais d’un lien qui revient dans le présent à travers un message, une distance, une histoire passée, une rencontre possible ou un signe affectif. Le point important n’est pas seulement ce que le signe veut dire, mais ce que les actes suivants permettront de vérifier.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
        `Ce qui tient encore, c’est qu’un passage reste ouvert. Un message chaleureux, une venue annoncée, une proposition ou un cœur peuvent réactiver le lien sans obliger à conclure trop vite. La bonne posture n’est pas de figer l’intention, mais de laisser le réel préciser : disponibilité, initiative, rythme des échanges, envie de se voir et manière de parler de l’ambiguïté.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
        `Ce qui l’affaiblit, c’est ${vulnerability}. La distance, le temps écoulé, le souvenir et le désir de comprendre peuvent transformer un signe en scénario intérieur. À l’inverse, refuser de voir le signe peut aussi fermer trop vite une possibilité. Le point délicat est donc de rester accueillant sans devenir captif de l’interprétation.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
        `L’escalade ne serait pas spectaculaire. Elle commencerait si l’attente monte plus vite que les échanges : chaque silence devient preuve, chaque mot devient promesse, et la rencontre possible se charge d’un poids qu’elle ne peut pas encore porter. Le risque est de répondre à une histoire imaginée plutôt qu’à la personne réelle.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
        `La bascule positive vient d’un acte simple : un rendez-vous proposé, une parole plus claire, un rythme de messages qui se stabilise, ou une rencontre où chacun peut sentir ce qui est encore vivant sans devoir le définir immédiatement. Le lien change de statut quand le signe devient une expérience partagée.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
        `Il faut surveiller ${watchSignal}, mais aussi les angles morts propres à cette scène : projection, nostalgie, peur de se tromper, attente non dite, disponibilité réelle, mots exacts et cohérence entre message et actes. VI doit chercher ce qui manque dans le lien concret, pas remplacer l’ambiguïté par un récit.`
      ),
      approfondir_en: polishDiamondText(
        `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
        `The situation must be read as a concrete relational scene: ${anchors || matter}. It is about a bond returning to the present through a message, distance, past history, a possible meeting, or an affectionate sign.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
        `What still holds is that a passage remains open. A warm message, an announced visit, a proposal, or a heart can reactivate the bond without forcing an immediate conclusion.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
        `What weakens it is the risk of turning a sign into an inner scenario before actions clarify the intention.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
        `Escalation begins if expectation rises faster than the exchange: every silence becomes proof and every word becomes a promise.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
        `The positive shift comes through a simple act: a proposed meeting, clearer words, a steadier message rhythm, or a real encounter.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
        `Watch projection, nostalgia, fear of being wrong, unstated expectation, real availability, exact words, and consistency between message and actions.`
      ),
      sources: [],
    }
  }

  return {
    approfondir_fr: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
      `La situation doit rester lue comme une scène relationnelle concrète : ${matter}. Elle ne parle pas d’un objet à évaluer, mais d’un lien qui a traversé frustration, retrait, silence, trajet et tentative de reprise affective. Le point important n’est pas seulement ce qui s’est passé, mais ce que chacun a pu croire que l’autre ressentait.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
      `Ce qui tient encore, c’est que le lien n’a pas rompu malgré la déception. Le retrait, l’accusation ou le silence peuvent protéger de la honte, de la fatigue ou du sentiment d’échec ; mais une parole affective, même tardive, montre qu’un passage reste ouvert. La bonne posture n’est pas de juger l’émotion, mais de rouvrir un espace simple où chacun peut retrouver sa place.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
      `Ce qui l’affaiblit, c’est ${vulnerability}. Si l’adulte répond trop vite par explication, reproche ou réparation forcée, l’adolescent peut entendre qu’il doit justifier son émotion. Si l’adulte ne revient jamais sur la scène, le silence peut rester comme une petite dette affective.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
      `L’escalade ne serait pas spectaculaire. Elle commencerait si la frustration devient un scénario répété : l’échec appelle un coupable, le parent se défend, l’adolescent se ferme, puis chacun évite le vrai sujet. À ce moment-là, la pêche, la voiture ou le trajet ne sont plus le centre ; ils deviennent le théâtre d’une difficulté à supporter ensemble la déception.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
      `La bascule positive vient d’une parole brève et juste : reconnaître le moment, dire ce qui a touché, et laisser à l’adolescent une sortie honorable. Une phrase du type “j’ai été surpris quand tu m’as dit que tu m’aimais, ça m’a touché, je n’ai pas su répondre sur le moment” peut réparer sans dramatiser.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
      `Il faut surveiller ${watchSignal}, mais aussi les angles morts propres à cette scène : honte de ne pas avoir réussi, fatigue après plusieurs jours, besoin adolescent de sauver la face, peur d’avoir déçu, manière indirecte de demander que le lien tienne encore. VI doit rester contextualisé au lien, pas partir vers des catégories hors-sol.`
    ),
    approfondir_en: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
      `The situation must be read as a concrete relational scene: ${matter}. It is about a bond moving through frustration, withdrawal, silence, and an affective repair attempt.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
      `What still holds is that the bond did not break. Withdrawal or blame may protect shame or fatigue, while an affectionate sentence shows that a passage remains open.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
      `What weakens it is the risk that silence becomes interpreted as rejection, or that explanation replaces recognition.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
      `Escalation begins if frustration becomes a repeated script: failure calls for blame, the parent defends, the teenager closes down, and the real feeling remains untouched.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
      `The positive shift comes through a short, accurate sentence that acknowledges the moment without dramatizing it.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
      `Watch shame, fatigue, face-saving, fear of disappointing, and indirect attempts to check whether the bond still holds.`
    ),
    sources: [],
  }
}

function buildCausalAttributionDeepFallback({
  situation,
  arbre,
  sc,
  resources,
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  sc?: SituationCard
  resources: ResourceItem[]
}): DeepReading {
  const matter = buildCausalMatter({ situation, arbre, sc, resources })
  const anchors = matter.namedAnchors.slice(0, 5).join(', ')

  return {
    approfondir_fr: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
      `La situation se joue dans une hypothèse précise : ${matter.hypothesis}. Les matières concrètes sont ${anchors || `${matter.sourceActor}, ${matter.targetActor} et ${matter.event}`}. La question n’est pas seulement de savoir si ${matter.sourceActor} et ${matter.targetActor} sont proches, alignés ou hostiles ; elle est de savoir si un canal réel a transformé une influence en décision sur ${matter.event}.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
      `Ce qui tient encore, c’est la séparation entre influence et décision. ${matter.causalChannels[0]}. ${matter.causalChannels[2]}. Tant que ces canaux ne sont pas reliés à un arbitrage observable de ${matter.targetActor}, l’influence peut être forte sans devenir une preuve d’entraînement.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
      `Ce qui affaiblit la lecture, c’est la confusion entre vraisemblance narrative et preuve causale. ${matter.counterChannels[1]}. ${matter.counterChannels[0]}. Il faut donc regarder aussi les contre-hypothèses : décision déjà voulue, contrainte interne, coût anticipé, calendrier, institution, réputation ou intérêt propre.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
      `L’escalade interprétative commence quand le récit “${matter.sourceActor} a entraîné ${matter.targetActor}” devient plus fort que les traces. À ce moment-là, chaque déclaration, rencontre ou intérêt commun peut être lu comme preuve alors qu’il peut aussi n’être qu’un indice. Le risque est de fabriquer une histoire cohérente avec ${matter.event}, mais insuffisamment démontrée.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
      `La bascule se produit avec une preuve vérifiable reliant ${matter.sourceActor}, ${matter.targetActor} et l’arbitrage contesté : ${matter.proofSignals.join(', ')}. Une telle preuve ne montrerait pas seulement une proximité ou une pression ; elle montrerait que la marge de choix de ${matter.targetActor} a été déplacée.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
      `Il faut surveiller les preuves qui relient les acteurs plutôt que les seuls événements visibles : qui parle à qui, quand, par quel canal, avec quel intérêt, sous quelle contrainte et avec quelle capacité réelle d’imposer une décision. La fonction VI devient centrale : relations longues, réseaux, conseillers, droit, argent, institutions et coûts cachés doivent devenir des pistes d’enquête, pas des cases abstraites.`
    ),
    approfondir_en: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
      `The situation is a concrete causal hypothesis: ${matter.hypothesis}. The issue is whether an actual channel turned influence into a decision.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
      `What still holds is the distinction between influence and decision. ${matter.sourceActor} may pressure, frame, advise, or align with ${matter.targetActor}; that does not yet prove causality.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
      `What weakens the reading is confusion between narrative plausibility and causal proof. Aligned interests can make the hypothesis plausible without proving it.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
      `Interpretive escalation begins when the accusation becomes stronger than the traces connecting the actors.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
      `The shift comes with verifiable evidence linking ${matter.sourceActor}, ${matter.targetActor}, and the contested decision: ${matter.proofSignals.join(', ')}.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
      `Watch evidence linking actors, not only visible events: who speaks to whom, when, through what channel, with what interest, and with what capacity to constrain the decision.`
    ),
    sources: [],
  }
}

function conciseSignal(value: string, fallback: string): string {
  const text = compact(value)
  if (!text || text.length > 140) return fallback
  return text
}

function looksLikeMarketProofFrame(value: string): boolean {
  return /\b(format|rituel|preuve directe|usage|adoption|revenus?|r[ée]tention|d[ée]cision client|traction|distribution|march[ée]\s*,?\s*traction|mvp|pitch deck|investissable)\b/i.test(compact(value))
}

function geopoliticalText(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = compact(value)
    if (text && text.length > 8 && !looksLikeMarketProofFrame(text)) return text
  }
  return fallback
}

function geopoliticalListSentence(values: unknown[], fallback: string): string {
  const items = values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(compact)
    .filter((item) => item && !looksLikeMarketProofFrame(item))
    .slice(0, 3)

  return items.length > 0 ? items.join('. ') : fallback
}

function geopoliticalQuestion(situation: string, sc?: SituationCard): string {
  const object = understoodObject(sc)
  if (!object || /trajectoire de la crise|crise [ée]voqu[ée]e|objet de la question/i.test(object)) {
    return compact(sc?.submitted_situation_fr) || compact(situation) || 'la question géopolitique posée'
  }
  return object
}

function siteBrief(resources: ResourceItem[]): ResourceItem | undefined {
  return resources.find((resource) => resource.type === 'site-brief')
}

function isSiteReading(sc: SituationCard | undefined, resources: ResourceItem[]): boolean {
  const frame = sc?.intent_context?.dominant_frame ?? sc?.coverage_check?.intent_context?.dominant_frame
  const decision = sc?.intent_context?.decision_type ?? sc?.coverage_check?.intent_context?.decision_type
  return frame === 'site_analysis' ||
    frame === 'startup_investment' ||
    decision === 'analyze_site' ||
    decision === 'evaluate_investment' ||
    Boolean(siteBrief(resources))
}

function lineAfterPrefix(value: string, prefix: string): string {
  const stopLabels = [
    'Utilisateurs ou clients visés',
    'Workflow produit',
    'Modèle économique',
    'Tarification',
    'Preuves ou signaux visibles',
    'Cas d’usage visibles',
    'Différenciation visible',
    'Preuves manquantes',
    'Angle d’évaluation',
    'Faits extraits du site',
    'Résumé crawl utile',
    'Règle d’analyse',
  ]
  const stopPattern = stopLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  if (/^Ce que le site permet/i.test(prefix)) {
    const match = value.match(new RegExp(`Ce que le site permet d[’']?[ée]tablir\\s*:?\\s*([\\s\\S]*?)(?:\\s+(?:${stopPattern})\\s*:|$)`, 'i'))
    if (match?.[1]) return compact(match[1])
  }
  if (/^Ce que fait l’entreprise/i.test(prefix)) {
    const match = value.match(new RegExp(`Ce que fait l[^:]{0,12}entreprise\\s*:?\\s*([\\s\\S]*?)(?:\\s+(?:${stopPattern})\\s*:|$)`, 'i'))
    if (match?.[1]) return compact(match[1])
  }
  if (/^Preuves ou signaux visibles/i.test(prefix)) {
    const match = value.match(new RegExp(`Preuves ou signaux visibles\\s*:?\\s*([\\s\\S]*?)(?:\\s+(?:${stopPattern})\\s*:|$)`, 'i'))
    if (match?.[1]) return compact(match[1])
  }
  if (/^Cas d’usage visibles/i.test(prefix)) {
    const match = value.match(new RegExp(`Cas d[’']usage visibles\\s*:?\\s*([\\s\\S]*?)(?:\\s+(?:${stopPattern})\\s*:|$)`, 'i'))
    if (match?.[1]) return compact(match[1])
  }
  if (/^Différenciation visible/i.test(prefix)) {
    const match = value.match(new RegExp(`Diff[ée]renciation visible\\s*:?\\s*([\\s\\S]*?)(?:\\s+(?:${stopPattern})\\s*:|$)`, 'i'))
    if (match?.[1]) return compact(match[1])
  }
  const key = prefix
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .toLowerCase()
  const line = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) =>
      item
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, "'")
        .toLowerCase()
        .startsWith(key)
    )
  if (!line) return ''
  const colonIndex = line.indexOf(':')
  return compact(colonIndex >= 0 ? line.slice(colonIndex + 1) : line.slice(prefix.length))
}

function establishedField(value: string): string {
  const text = compact(value)
    .split(/\s+(?:Utilisateurs ou clients vis|Workflow produit|Mod[eè]le|Tarification|Preuves ou signaux|Cas d|Diff[ée]renciation|Preuves manquantes|Angle d|Faits extraits|R[ée]sum[ée] crawl|R.gle d)/i)[0]
    .trim()
  return /^non\b/i.test(text) ? '' : text
}

function sentence(value: string): string {
  const text = compact(value)
  if (!text) return ''
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function siteNameFromBrief(brief: ResourceItem | undefined, fallback: string): string {
  const titleName = compact(brief?.title.replace(/^Fiche site\s*-\s*/i, '') ?? '')
  if (titleName) return titleName
  try {
    return new URL(brief?.url ?? '').hostname.replace(/^www\./, '') || fallback
  } catch {
    return fallback
  }
}

function frenchSiteProduct(company: string, product: string): string {
  if (/platform that helps you start,\s*grow,\s*and manage your business/i.test(product)) {
    return `${company} se présente comme une plateforme qui aide à créer, développer et gérer une entreprise, avec une promesse de simplicité, d’équité et de transparence.`
  }
  return product
}

function buildSiteDeepFallback({
  situation,
  sc,
  resources,
}: {
  situation: string
  sc?: SituationCard
  resources: ResourceItem[]
}): DeepReading {
  const brief = siteBrief(resources)
  const company = siteNameFromBrief(brief, compact(sc?.intent_context?.interpreted_request?.object_of_analysis) || 'ce site')
  if (!brief) {
    return {
      approfondir_fr: polishDiamondText(
        `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
        `${company} est le point à vérifier, mais aucune source exploitable ne permet encore de dire précisément ce que l’entreprise fait. La situation réelle n’est donc pas une évaluation de marché déjà disponible ; c’est une décision professionnelle à préparer sans inventer l’offre.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
        `Ce qui tient encore, c’est la demande claire : comprendre l’activité, la cible, les usages, les conditions de collaboration et les preuves avant d’envisager de rejoindre ${company} avec une startup. Cette prudence protège la décision au lieu de combler le vide.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
        `Ce qui l’affaiblit, c’est l’absence de matière vérifiable : URL officielle, pages produit, démonstration, clients, partenaires, prix, cadre juridique, statut social ou conditions d’entrée. Sans ces éléments, le risque est de produire un avis fluide mais non situé.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
        `L’escalade serait de décider trop vite : juger ${company} attractive ou risquée sans savoir ce qu’elle propose réellement, comment elle travaille avec d’autres startups, et quelles obligations elle crée.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
        `La bascule viendra d’une preuve simple : site officiel, contenu produit, démonstration, échange direct, client identifiable, conditions contractuelles ou retour d’utilisateur. À partir de là, la carte pourra distinguer intérêt, risque et conditions de décision.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
        `Surveiller maintenant la source, la promesse exacte, les clients ou partenaires vérifiables, le modèle économique, les règles juridiques et sociales, et ce que rejoindre ${company} changerait concrètement pour votre startup.`
      ),
      approfondir_en: polishDiamondText(
        `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
        `${company} is the point to verify, but no usable source yet allows the card to state precisely what the company does.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
        `What still holds is the clear decision need: understand the activity, target, use cases, collaboration terms, and proof before considering joining ${company} with a startup.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
        `What weakens it is the lack of verifiable material: official URL, product pages, demo, customers, partners, pricing, legal frame, social status, or entry terms.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
        `Escalation would mean deciding too quickly without knowing what ${company} actually offers and what obligations it creates.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
        `The shift will come from simple proof: official site, product content, demo, direct exchange, identifiable customer, contractual terms, or user feedback.\n\n` +
        `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
        `Watch the source, exact promise, verifiable customers or partners, business model, legal and social rules, and what joining ${company} would concretely change for the startup.`
      ),
      sources: [],
    }
  }
  const excerpt = brief?.excerpt ?? ''
  const product = establishedField(lineAfterPrefix(excerpt, 'Ce que fait l’entreprise')) ||
    establishedField(lineAfterPrefix(excerpt, 'Ce que le site permet d’établir')) ||
    `${company} est une offre à qualifier à partir des pages consultées : produit, cible, usage, modèle et preuves visibles.`
  const productFr = frenchSiteProduct(company, product)
  const proof = establishedField(lineAfterPrefix(excerpt, 'Preuves ou signaux visibles')) ||
    'Les preuves visibles restent à qualifier : clients, usages répétés, revenus, partenariats, rétention ou décisions d’achat.'
  const useCases = establishedField(lineAfterPrefix(excerpt, 'Cas d’usage visibles'))
  const differentiation = establishedField(lineAfterPrefix(excerpt, 'Différenciation visible'))
  const criticalBlindSpots =
    'cadre légal ou réglementaire, statut social et salarial, fiscalité, responsabilité, financement public, normes sociales, infrastructures et dépendance éventuelle à l’État'
  const market = /march[eé]\s+europ|europe|europ[eé]en/i.test(situation)
    ? 'le marché européen'
    : 'le marché visé'
  const proofDetails = [
    proof,
    useCases ? `Cas d’usage visibles : ${useCases}` : '',
    differentiation ? `Différenciation visible : ${differentiation}` : '',
  ].filter(Boolean)

  return {
    approfondir_fr: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
      `${sentence(productFr)} Le premier travail consiste donc à établir simplement ce que l’entreprise dit faire, pour qui, avec quelle promesse, puis à séparer ce qui est visible de ce qui reste à prouver.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
      `Ce qui tient encore, c’est la lisibilité de la promesse. Si un visiteur comprend rapidement le problème traité, la cible et l’usage attendu, ${company} dispose d’un début de surface commerciale. Mais cette lisibilité ne suffit pas : elle doit être reliée à une preuve externe, sinon elle reste une bonne formulation plutôt qu’un signal de marché.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
      `Ce qui l’affaiblit, c’est l’écart entre le récit du site, les preuves observables et les angles morts critiques. Pour ${market}, il ne suffit pas que la promesse soit claire ; il faut savoir si un segment précis rencontre ce problème, accepte la solution, l’utilise vraiment et peut payer. Il faut aussi vérifier ce que le site ne force pas toujours à voir : ${criticalBlindSpots}. Sans cela, l’analyse doit rester prudente.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
      `L’escalade n’est pas un conflit spectaculaire ; c’est une perte de crédibilité progressive. Elle commence si la question “que fait exactement ${company} ?” reste floue après lecture du site, ou si la promesse paraît plus large que les preuves disponibles. Dans ce cas, le risque n’est pas seulement commercial : c’est un risque de compréhension.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
      `La bascule positive viendrait d’une preuve simple et vérifiable : un client identifiable, un usage répété, une métrique, un partenariat européen, un revenu, ou une démonstration qui montre pourquoi la solution est meilleure qu’une alternative. ${sentence(proofDetails.join(' '))} À ce moment-là, l’analyse peut passer de la prudence à l’évaluation du potentiel.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
      `Il faut maintenant surveiller la cible réelle, le problème concret, la preuve d’usage, la différenciation et les angles morts décisifs : ${criticalBlindSpots}. La bonne question n’est pas seulement “est-ce une bonne startup ?”, mais “quelle preuve ou quelle contrainte ferait changer d’avis un client, un partenaire, un régulateur ou un investisseur ?”.`
    ),
    approfondir_en: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
      `${sentence(product)} The first task is to state simply what the company says it does, for whom, with what promise, then separate what is visible from what remains to be proven.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
      `What still holds is the legibility of the promise. If a visitor quickly understands the problem, target user, and expected use case, ${company} has an initial commercial surface. But clarity is not enough; it must connect to external proof.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
      `What weakens it is the gap between website narrative and observable proof. For ${market}, the promise must be tested against a precise segment, real usage, willingness to pay, and alternatives.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
      `Escalation is not a spectacular conflict; it is a progressive credibility loss. It begins if the question "what does ${company} exactly do?" remains unclear after reading the site, or if the promise is broader than the available proof.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
      `The positive shift would come from simple verifiable proof: an identifiable customer, repeated use, a metric, a European partnership, revenue, or a demonstration showing why the solution is better than an alternative. ${sentence(proofDetails.join(' '))}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
      `Watch four points now: real target, concrete problem, usage proof, and differentiation. The right question is not only whether it is a good startup, but what proof would change the mind of a European customer, partner, or investor.`
    ),
    sources: [],
  }
}

function buildUnderstandingDeepFallback(sc?: SituationCard): DeepReading {
  const object = understoodObject(sc)
  const objectSentence = capitalizeFirst(object)
  const tension = understoodTension(sc)
  const theatre = sc?.concrete_theatre ?? sc?.coverage_check?.concrete_theatre
  const anchors = theatreAnchorText(theatre, 10)
  const evidence = concreteList(theatre?.evidence_to_watch, 'les traces concrètes qui permettraient de trancher', 5)
  const hasRealTheatre = hasDemonstrableTheatre(theatre)

  return {
    approfondir_fr: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
      (hasRealTheatre
        ? `${objectSentence} se comprend par les éléments déjà situés${anchors ? ` : ${anchors}` : ''}. L’enjeu est de montrer comment ces éléments peuvent modifier une décision, un blocage, un usage, une relation ou une preuve disponible.\n\n`
        : `${objectSentence} reste insuffisamment sourcé pour être démontré. Le point solide, à ce stade, est la demande elle-même : comprendre l’objet, son activité réelle, les acteurs concernés et les preuves disponibles avant de conclure.\n\n`) +
      `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
      `${hasRealTheatre ? publicHoldingSentence(theatre, tension) : `${capitalizeFirst(tension)}. Ce qui tient encore, c’est la possibilité de clarifier l’objet sans inventer les faits manquants.`}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
      `${hasRealTheatre ? publicWeakeningSentence(theatre) : 'Ce qui l’affaiblit, c’est l’absence d’éléments vérifiables : source officielle, description produit, cible, preuves d’usage, clients, partenaires ou conditions concrètes.'}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
      `${hasRealTheatre ? publicEscalationSentence(theatre) : 'L’escalade serait une conclusion trop rapide : juger l’intérêt du projet avant d’avoir vérifié ce qu’il fait réellement et ce qui est prouvé.'}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
      `${hasRealTheatre ? publicShiftSentence(theatre) : 'La bascule viendrait d’un élément simple et contrôlable : URL officielle, contenu du site, démonstration, client identifiable, métrique d’usage, revenu ou condition de partenariat.'}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
      `${hasRealTheatre ? `Le point à surveiller maintenant est ${evidence}.` : 'Le point à surveiller maintenant est la source qui permettra de lire le réel au lieu de combler le vide.'} La vérification utile tient en trois questions : ce qui manque, qui peut le confirmer, et quelle trace ferait changer la conclusion.`
    ),
    approfondir_en: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
      `${objectSentence} names a tension that must become verifiable. What matters is not only what is feared or narrated, but the chain linking perception, actors able to act, real constraints, and observable consequences.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
      `What still holds is the gap between concern and action. ${tension}. As long as the channels, procedures, interests, or actors able to transform that tension are not clearly identified, the situation remains an alert rather than an established shift.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
      `What weakens the reading is confusion between plausibility and proof. A concern can be rational, shared, or politically useful without yet showing who can act, through which channel, with what legitimacy, and under which constraint. The danger is not only uncertainty; it is a narrative becoming stronger than the traces.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
      `Escalation begins when an actor or channel turns the tension into public action: decision, refusal, procedure, organized pressure, narrative campaign, changed calendar, or institutional blockage. At that point, concern stops being only a perception and becomes capacity to harm, protect, or break.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
      `The shift occurs with proof linking the risk to a mechanism. That proof may be chronology, instruction, document, decision, funding, institutional channel, exploited rule, or an actor openly changing role. Without that link, the reading remains cautious: real tension, capacity still to establish.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
      `Watch what is missing from view: actors who can truly block or legitimize, available rules, hidden dependencies, influence networks, money, calendar, unassumed costs, and thresholds where concern becomes decision. The main blind spot is the concrete channel that would turn suspicion into action.`
    ),
    sources: [],
  }
}

function buildGeopoliticalDeepFallback({
  situation,
  arbre,
  sc,
  scopeContext,
  resources,
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  sc?: SituationCard
  scopeContext?: ScopeContext
  resources: ResourceItem[]
}): DeepReading {
  const anchors = concreteAnchors(situation, arbre)
  const actors = readableList(
    anchors.slice(0, 6),
    firstUseful(
      [arbre?.acteurs?.[0], sc?.submitted_situation_fr, situation],
      'les dirigeants, appareils militaires, opinions publiques, alliés et adversaires impliqués'
    )
  )
  const question = geopoliticalQuestion(situation, sc)
  const tension = capitalizeFirst(geopoliticalText(
    [sc?.intent_context?.interpreted_request?.implicit_tension, arbre?.load_bearing_contradiction, sc?.asymmetry_fr],
    'un dirigeant peut pousser un allié vers une option militaire, mais l’allié conserve ses propres seuils, coûts et chaînes de décision'
  ))
  const keySignal = conciseSignal(
    geopoliticalText(
      [sc?.key_signal_fr, arbre?.temps?.[0], arbre?.temporalites?.[0]],
      ''
    ),
    'un changement de langage officiel, de déploiement militaire, de renseignement publié ou de calendrier diplomatique'
  )
  const vulnerability = geopoliticalText(
    [sc?.main_vulnerability_fr, arbre?.main_vulnerability_candidate, arbre?.vulnerabilites?.[0]],
    'le point fragile est la frontière entre influence politique, solidarité stratégique et décision militaire assumée'
  )
  const constraints = geopoliticalListSentence(
    [sc?.constraints_fr, arbre?.contraintes],
    'le renseignement disponible, le coût militaire, la réaction adverse, les alliés, le droit interne, les marchés stratégiques et l’opinion publique limitent les marges'
  )
  const uncertainties = geopoliticalListSentence(
    [sc?.uncertainties_fr, arbre?.incertitudes],
    'le degré réel de coordination, les relations longues entre décideurs, les réseaux de conseillers, donateurs ou relais politiques, les garanties données en privé, la réponse adverse, la position des appareils militaires, les institutions politiques et les alliés restent à vérifier'
  )
  const channels =
    'langage officiel, déploiements militaires, renseignement publié, calendrier diplomatique, vote interne, réaction de l’acteur visé, positions des alliés, marchés stratégiques et justification juridique'

  return {
    approfondir_fr: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
      `La question “${question}” ne se réduit pas à savoir qui manipule qui. Elle porte sur une chaîne d’entraînement politique : comment ${actors} peuvent transformer une menace, une frappe, une promesse d’alliance ou une pression médiatique en décision militaire. Le cœur de la situation est donc la différence entre influence et décision. ${tension}.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
      `Ce qui tient encore le système, c’est que plusieurs verrous restent séparés. Un dirigeant peut cadrer le récit, dramatiser le danger ou demander un appui, mais une entrée en guerre dépend aussi du renseignement, du commandement militaire, des coûts anticipés, des alliés, du droit interne, de l’opinion et du risque de riposte. Les contraintes concrètes sont les suivantes : ${constraints}. Tant que ces verrous ne s’alignent pas, l’influence ne suffit pas à prouver l’entraînement.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
      `Ce qui affaiblit la situation, c’est la personnalisation du lien politique. Si l’analyse se limite à deux dirigeants, elle manque les appareils qui rendent la décision possible ou impossible : renseignement, commandement militaire, diplomaties régionales, institutions politiques, opinion publique, alliés, marchés stratégiques et capacités de riposte. ${vulnerability}. C’est là que la lecture devient sérieuse : non pas “a-t-il convaincu ?”, mais “quels mécanismes ont réduit ou augmenté la liberté de choix de l’acteur qui décide ?”.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
      `L’escalade commence quand un signal oblige l’acteur décisif à passer d’un soutien politique à une logique d’engagement. Ce signal peut être ${keySignal}, mais aussi une attaque contre ses forces, une menace sur une infrastructure critique, une preuve stratégique nouvelle, une pression électorale ou une demande explicite de couverture militaire. À ce moment-là, le récit de l’allié devient un élément parmi d’autres dans une architecture de décision plus large.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
      `La bascule se produit si la question de l’influence devient une contrainte d’action. Autrement dit : si refuser d’intervenir coûte soudain plus cher politiquement, stratégiquement ou symboliquement que participer. Dans ce scénario, le décideur n’est pas seulement “entraîné” par un allié ; il est pris dans une configuration où alliance, crédibilité, dissuasion, opinion et calendrier rendent l’option militaire plus probable.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
      `Il faut surveiller des signaux observables : ${channels}. Il faut surtout vérifier ${uncertainties}. C’est la fonction enquête de VI : transformer les angles morts en questions vérifiables. La réponse solide ne sera donc pas un oui ou non immédiat ; elle dépendra des traces de coordination, des relations anciennes, des déclarations officielles, des mouvements militaires, des justifications juridiques, des réactions adverses et du moment où le coût de ne pas suivre devient plus élevé que le coût de suivre.`
    ),
    approfondir_en: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
      `The question is not only whether one leader manipulated another. It concerns a chain of political entrainment: how leaders, military institutions, allies, adversaries, public narratives, and threat assessments can turn pressure into military decision.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
      `What still holds the system together is the separation of decision locks. An ally can frame the danger and request support, but war still depends on intelligence, command structures, expected costs, allies, domestic law, public opinion, and retaliation risks.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
      `What weakens the reading is personalization. If the analysis stops at two leaders, it misses the machinery that makes a decision possible or impossible: intelligence services, military command, political institutions, regional diplomacy, strategic markets, allies, and adversary capabilities.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
      `Escalation begins when the decisive actor is forced to move from political support to operational commitment. The signal may be an attack on its forces, a threat to critical infrastructure, published intelligence, electoral pressure, or an explicit demand for military cover.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
      `The shift occurs when influence becomes a constraint on action: when refusing to intervene becomes more costly politically, strategically, or symbolically than joining. In that case, the decision-maker would not simply be dragged by an ally; they would be caught in a configuration where alliance, credibility, deterrence, opinion, and timing make military action more likely.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
      `Watch observable signals: official language, deployments, legal justification, intelligence claims, adversary responses, allied statements, and stress on strategic markets. The robust answer is not an immediate yes or no; it depends on evidence of coordination and on the point where the cost of not following becomes higher than the cost of following.`
    ),
    sources: [],
  }
}

function concreteMechanism(scope?: ScopeContext): string {
  if (scope?.scope === 'global') {
    return 'Il faut regarder les grandes puissances, les marchés, les alliances, les institutions, les opinions publiques et les infrastructures qui peuvent propager le choc au-delà du théâtre initial.'
  }

  if (scope?.scope === 'personal') {
    return 'Il faut regarder ce qui se joue concrètement dans le lien : autonomie, fatigue, reconnaissance, peur de décevoir, limite ou besoin de reprendre la main.'
  }

  if (scope?.scope === 'market') {
    return 'Il faut regarder les preuves concrètes : usage répété, budget, décision d’achat, distribution, différenciation et coût du problème pour le client.'
  }

  if (scope?.scope === 'organizational') {
    return 'Il faut regarder la mécanique réelle des rôles : qui décide, qui absorbe la charge, qui bloque, qui dépend de qui, et quelle règle manque.'
  }

  return 'Il faut regarder les acteurs, les contraintes, les ressources et les seuils qui rendent une action possible ou impossible.'
}

export function buildGeneralDiamondDeepFallback({
  situation,
  arbre,
  sc,
  scopeContext,
  resources = [],
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  sc?: SituationCard
  scopeContext?: ScopeContext
  resources?: ResourceItem[]
}): DeepReading {
  if (isCausalAttributionReading(sc)) {
    return buildCausalAttributionDeepFallback({ situation, arbre, sc, resources })
  }

  if (isSiteReading(sc, resources)) {
    return buildSiteDeepFallback({ situation, sc, resources })
  }

  if (isPersonalReading(sc)) {
    return buildPersonalDeepFallback({ situation, sc, resources })
  }

  if (isUnderstandingRequest(sc)) {
    return buildUnderstandingDeepFallback(sc)
  }

  const scope = scopeContext ?? sc?.scope_context
  const concreteTheatre = sc?.concrete_theatre ?? sc?.coverage_check?.concrete_theatre
  const anchors = concreteTheatre?.anchors?.length
    ? concreteTheatre.anchors.slice(0, 10)
    : concreteAnchors(situation, arbre)
  const anchorLine = readableList(
    anchors.slice(0, 5),
    firstUseful(
      [arbre?.acteurs?.[0], arbre?.forces?.[0], sc?.submitted_situation_fr, situation],
      'les acteurs et faits déjà identifiés dans la situation'
    )
  )
  const contradiction = firstUseful(
    [sc?.asymmetry_fr, arbre?.load_bearing_contradiction, sc?.insight_fr],
    'l’écart entre ce que la situation affiche et ce qu’elle ne parvient plus à protéger'
  )
  const vulnerability = firstUseful(
    [sc?.main_vulnerability_fr, arbre?.main_vulnerability_candidate, arbre?.vulnerabilites?.[0]],
    'le point fragile reste insuffisamment protégé par une décision, une règle ou une limite observable'
  )
  const constraints = listSentence(
    [sc?.constraints_fr, arbre?.contraintes],
    'le temps, les ressources, les dépendances et la réputation limitent les marges d’action'
  )
  const uncertainties = listSentence(
    [sc?.uncertainties_fr, arbre?.incertitudes],
    'les intentions réelles, les seuils de rupture, les relations longues, les réseaux d’influence, le cadre légal ou institutionnel, l’argent, le travail, le rôle de l’État, les normes sociales, les infrastructures et les conséquences secondaires restent à vérifier'
  )
  const keySignal = firstUseful(
    [sc?.key_signal_fr, arbre?.temps?.[0], arbre?.temporalites?.[0]],
    'un acteur change de rythme, rend un coût visible ou force une décision qui ne peut plus rester implicite'
  )
  const stabilization = trajectoryText(
    sc,
    'stabilization',
    'La stabilisation suppose qu’un cadre lisible transforme la tension en décision, calendrier ou règle partageable.'
  )
  const escalation = trajectoryText(
    sc,
    'escalation',
    'L’escalade commence quand un signal limité oblige un acteur à répondre publiquement.'
  )
  const shift = trajectoryText(
    sc,
    'regime_shift',
    'La bascule apparaît quand le point fragile cesse d’être absorbé par les arrangements existants.'
  )
  const channels = scopeChannels(scope)
  const mechanism = concreteMechanism(scope)

  return {
    approfondir_fr: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_FR[0]}\n\n` +
      `Le cœur concret de la situation se concentre autour de : ${anchorLine}. ${realTheatre(situation, scope)} ${mechanism} La question n’est donc pas seulement ce qui est annoncé, mais ce que cette configuration rend désormais possible, impossible ou coûteux.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[1]}\n\n` +
      `Ce qui tient encore, c’est la possibilité de contenir la tension dans un cadre lisible : une décision, une médiation, un rôle, un calendrier ou une limite acceptée. Les contraintes à traiter sont concrètes : ${constraints}. La stabilisation ne viendrait pas d’un retour magique au calme ; elle demanderait un mécanisme observable : ${stabilization}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[2]}\n\n` +
      `Ce qui l’affaiblit, c’est l’asymétrie entre l’image que la situation peut encore donner et le coût qu’elle commence à produire : ${contradiction}. Le danger apparaît quand cette tension cesse d’être seulement racontée et devient visible dans un acte, une perte, un retard, un refus ou une décision publique.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[3]}\n\n` +
      `L’escalade n’a pas besoin d’un événement spectaculaire. Elle commence quand un fait limité oblige quelqu’un à répondre publiquement : ${keySignal}. Dans ce scénario, ${escalation}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[4]}\n\n` +
      `La bascule se produit si la vulnérabilité cesse d’être contenue : ${vulnerability}. ${shift} À ce moment-là, la question n’est plus de savoir si la pression augmente ; elle est de savoir qui perd la capacité de tenir son rôle, son récit ou sa marge d’action.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_FR[5]}\n\n` +
      `Les signaux utiles doivent être observables : ${channels}. Il faut surtout surveiller ${uncertainties}. VI doit alors devenir une enquête : quelle absence peut renverser la lecture, et quelle preuve permettrait de la vérifier ? Le point clé reste simple : la situation bascule lorsque ce qui pouvait rester ambigu devient une décision, un coût ou un seuil que les acteurs ne peuvent plus éviter.`
    ),
    approfondir_en: polishDiamondText(
      `${DIAMOND_DEEP_HEADINGS_EN[0]}\n\n` +
      `The situation should be read through the forces that can act, block, legitimize, wear down, or tip it. The visible event matters because it reveals how these forces distribute real room for action.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[1]}\n\n` +
      `What still holds is not established stability but a temporary capacity to compartmentalize costs. The stabilizing path is this: ${stabilization}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[2]}\n\n` +
      `The central weakness lies in this asymmetry: ${contradiction}. The situation remains fragile as long as that contradiction is absorbed by narratives, delays, or implicit arrangements.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[3]}\n\n` +
      `Escalation does not require a spectacular event. It can come from a limited signal that forces a public response: ${keySignal}. In that scenario, ${escalation}\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[4]}\n\n` +
      `The shift occurs if the fragile point is no longer contained: ${vulnerability}. ${shift} At that point, the situation changes not only in intensity but in logic.\n\n` +
      `${DIAMOND_DEEP_HEADINGS_EN[5]}\n\n` +
      `The useful signals are those that show a channel crossing: ${channels}. The key point is simple: the situation tips when what could remain implicit becomes a decision, a cost, or a public threshold.`
    ),
    sources: [],
  }
}
