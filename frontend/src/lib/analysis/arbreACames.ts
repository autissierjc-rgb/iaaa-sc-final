import type { ArbreACamesAnalysis, IntentContext, PowersContext, ResourceItem } from '../resources/resourceContract'
import { analyzePowersInPresence, powersAxisLine } from './powersInPresence'

const AXES = [
  'acteurs',
  'intentions',
  'interets',
  'contraintes',
  'rapports_de_force',
  'forces',
  'vulnerabilites',
  'tensions',
  'temporalites',
  'trajectoires',
  'incertitudes',
  'temps',
  'sens_perceptions',
  'perceptions',
] as const

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitSignals(situation: string): string[] {
  return compact(situation)
    .split(/(?<=[.!?;:])\s+|\s+-\s+|\n+/)
    .map((part) => compact(part))
    .filter(Boolean)
    .slice(0, 8)
}

function resourceSignals(resources: ResourceItem[]): string[] {
  return resources
    .map((resource) => compact([resource.source, resource.title].filter(Boolean).join(' - ')))
    .filter((signal) => !/^https?:\/\//i.test(signal))
    .filter(Boolean)
    .slice(0, 4)
}

function intentSignals(intentContext?: IntentContext): string[] {
  const interpreted = intentContext?.interpreted_request
  return [
    interpreted?.user_question,
    interpreted?.object_of_analysis,
    interpreted?.implicit_tension,
    intentContext?.dominant_frame,
    intentContext?.decision_type,
    ...(intentContext?.signals ?? []),
  ]
    .map((value) => compact(String(value ?? '')))
    .filter(Boolean)
    .slice(0, 8)
}

function pick(signals: string[], index: number, fallback: string): string[] {
  return [signals[index % Math.max(signals.length, 1)] || fallback]
}

const POWER_LENS =
  'Puissances en présence : qui peut agir, bloquer, financer, légitimer, user, imposer un récit, accélérer, ralentir ou faire basculer la situation'

const BLIND_SPOT_LENS =
  'Chercher ce qui pourrait renverser la lecture : relations longues, réseaux, règles, argent, travail, État, normes, infrastructures, coûts cachés ou hypothèses implicites non vérifiées.'

const PERSONAL_BLIND_SPOT_LENS =
  'Chercher dans le lien ce qui n’est pas dit : honte, fatigue, besoin de sauver la face, peur de décevoir, attente non formulée, tentative de réparation ou sens donné au silence.'

function withPowerLens(list: string[]): string[] {
  const hasLens = list.some((item) => item.toLowerCase().includes('puissances en présence'))
  return hasLens ? list : [POWER_LENS, ...list]
}

function isQuestionOnly(text: string): boolean {
  const t = compact(text).toLowerCase()
  return /^(quel|quelle|quels|quelles|que|quoi|comment|pourquoi|where|what|how|why)\b/.test(t)
}

function isGlobalQuestion(text: string): boolean {
  return /\b(monde|mondial|mondiale|global|globale|international|internationale|ordre mondial|2026|alliances?|march[eé]s?|p[eé]trole|[eé]nergie)\b/i.test(text)
}

function isConflictOrGeopolitics(text: string): boolean {
  return /\b(iran|israel|gaza|ukraine|russie|chine|usa|etats-unis|guerre|bombard|frappe|cessez-le-feu|sanction|regime|militaire|frontiere|otage|missile|nucleaire)\b/i.test(text)
}

function isWarSecurityText(text: string): boolean {
  return /\b(guerre|militaire|frappe|bombard|missile|cessez|cessez-le-feu|sanction|nucleaire|nucl[eé]aire|frontiere|frontière|otan|civils?|otage|attaque|riposte|escalade|dissuasion|iran|israel|gaza|ukraine|russie|chine|taiwan|syrie|liban|yemen|d[eé]troit|ormuz)\b/i.test(text)
}

function isGeopoliticalIntent(intentContext?: IntentContext): boolean {
  const domain = intentContext?.surface_domain ?? intentContext?.interpreted_request?.domain
  return intentContext?.dominant_frame === 'geopolitical_crisis' || domain === 'war'
}

function blindSpotLensFor(intentContext?: IntentContext): string {
  const domain = intentContext?.interpreted_request?.domain ?? intentContext?.surface_domain
  if (intentContext?.dominant_frame === 'personal_relationship' || domain === 'personal') {
    return PERSONAL_BLIND_SPOT_LENS
  }
  return BLIND_SPOT_LENS
}

function cleanIntentSignals(signals: string[]): string[] {
  return signals.filter((signal) =>
    !/^demande de /i.test(signal) &&
    !/^contrat canonique/i.test(signal) &&
    !/interpr[ée]tation LLM/i.test(signal)
  )
}

function analysisSubject(situation: string, intentContext?: IntentContext): string {
  return compact(intentContext?.interpreted_request?.object_of_analysis ?? '') ||
    compact(intentContext?.interpreted_request?.user_question ?? '') ||
    compact(situation)
}

function withPowersContext(analysis: ArbreACamesAnalysis, powers: PowersContext): ArbreACamesAnalysis {
  return {
    ...analysis,
    rapports_de_force: withPowerLens([powersAxisLine(powers), ...analysis.rapports_de_force]),
    forces: [powers.primary.map((item) => item.name).join(', '), ...analysis.forces].filter(Boolean),
    powers_in_presence: powers,
  }
}

function geopoliticalFrame(situation: string, resources: ResourceItem[], powers: PowersContext): ArbreACamesAnalysis {
  const sourceHint = resources.length > 0
    ? `sources mobilisées: ${resources.slice(0, 3).map((resource) => resource.source || resource.title).join(', ')}`
    : 'acteurs et séquences disponibles dans la situation fournie'
  const base = compact(situation)
  const questionOnly = isQuestionOnly(situation)
  const globalQuestion = isGlobalQuestion(situation)
  const subject = globalQuestion
    ? 'La crise décrite sert de révélateur de l’équilibre mondial'
    : questionOnly
      ? 'La crise décrite'
      : base

  return {
    acteurs: [
      'Dirigeants politiques, institutions militaires ou sécuritaires, acteurs tiers, médiateurs éventuels, population exposée et acteurs capables de bloquer ou d’élargir la crise',
    ],
    intentions: [
      'Préserver la marge politique, réduire le coût visible, maintenir une position de négociation ou de dissuasion et éviter une perte de crédibilité',
    ],
    interets: [
      'Limiter le coût civil, militaire, économique ou diplomatique tout en conservant une capacité d’influence sur la suite',
    ],
    contraintes: [
      'Temps politique, contraintes militaires, infrastructures critiques, opinion publique, exposition économique, canaux diplomatiques et risque d’escalade',
    ],
    rapports_de_force: [
      powersAxisLine(powers),
    ],
    forces: [
      'Capacités de frappe, sanctions, alliances, ressources critiques, discipline institutionnelle, fatigue sociale, puissance narrative et dépendance aux signaux diplomatiques',
    ],
    vulnerabilites: [
      'Dissociation entre contrôle politique affiché et capacité concrète à absorber pertes, déplacements et dégradation économique',
    ],
    tensions: [
      'Le récit de résistance doit tenir alors que les dommages matériels, sociaux et économiques réduisent les marges réelles du système',
    ],
    temporalites: [
      'Après plusieurs semaines de frappes, la situation passe de la sidération initiale à une phase d’usure cumulative',
    ],
    trajectoires: [
      'Stabilisation par cessez-le-feu fragile, escalade par incident mal absorbé, changement de régime par rupture de légitimité ou d’infrastructure',
    ],
    incertitudes: [
      'Amplitude exacte des dommages, cohésion des centres de pouvoir, contrôle des acteurs armés, solidité des médiations, rôle des infrastructures critiques, réseaux d’influence, relations longues entre décideurs et réactions de la population',
      BLIND_SPOT_LENS,
    ],
    temps: [
      'Après plusieurs semaines de frappes, la situation passe de la sidération initiale à une phase d’usure où les effets cumulatifs deviennent décisifs',
    ],
    perceptions: [
      'Chaque acteur cherche à imposer son récit : résilience, victoire, punition, survie, catastrophe civile ou retour progressif à la normale',
    ],
    sens_perceptions: [
      'Chaque acteur cherche à imposer son récit : résilience, victoire, punition, survie, catastrophe civile ou retour progressif à la normale',
    ],
    main_vulnerability_candidate:
      'La dissociation entre contrôle politique affiché et capacité concrète à absorber les pertes, les déplacements et la dégradation économique',
    load_bearing_contradiction:
      `${subject || 'La situation'} : elle peut encore afficher de la tenue, mais dépend d’infrastructures, de perceptions publiques et de canaux diplomatiques fragilisés ; ${sourceHint}`,
  }
}

function genericFrame(situation: string, resources: ResourceItem[], powers: PowersContext): ArbreACamesAnalysis {
  const base = compact(situation)
  const sourceHint = resources.length > 0
    ? `Les ressources disponibles servent de contexte factuel sans remplacer l’analyse structurelle.`
    : `Les éléments fournis par l’utilisateur structurent l’analyse.`

  return {
    acteurs: ['Acteurs directs, acteurs influents, acteurs capables de bloquer ou d’accélérer la situation'],
    intentions: ['Intentions officielles, intentions réelles et comportements que chaque partie cherche à rendre acceptables'],
    interets: ['Intérêts explicites, intérêts cachés et coûts que chaque partie cherche à éviter'],
    contraintes: ['Contraintes de temps, ressources, dépendances, réputation, règles et capacité d’action'],
    rapports_de_force: [powersAxisLine(powers)],
    forces: [powers.primary.map((item) => item.name).join(', ')],
    vulnerabilites: ['Point fragile, dépendance cachée, rupture possible ou maillon sensible'],
    tensions: ['Tension entre ce qui est géré publiquement et ce qui reste fragile ou non protégé'],
    temporalites: ['Urgences, rythmes, fenêtres d’action et retards dangereux'],
    trajectoires: ['Stabilisation, escalade ou changement de régime selon le traitement des contraintes'],
    incertitudes: [
      'Chercher quelles intentions, informations manquantes, seuils de rupture ou effets secondaires pourraient changer la lecture.',
      BLIND_SPOT_LENS,
    ],
    temps: ['Rythmes, délais, fenêtres d’action et risque de retard dans la décision'],
    perceptions: ['Récits concurrents, légitimations, malentendus et perceptions qui orientent les comportements'],
    sens_perceptions: ['Récits concurrents, légitimations, malentendus et perceptions qui orientent les comportements'],
    main_vulnerability_candidate:
      'La vulnérabilité centrale se situe dans ce que le système ne protège plus pendant qu’il gère l’urgence visible',
    load_bearing_contradiction:
      `${base || 'La situation'} oppose la stabilité recherchée aux contraintes qui rendent cette stabilité de moins en moins évidente. ${sourceHint}`,
  }
}

export async function analyzeWithArbreACames(
  situation: string,
  resources: ResourceItem[] = [],
  intentContext?: IntentContext
): Promise<ArbreACamesAnalysis> {
  const subject = analysisSubject(situation, intentContext)
  const interpreted = intentContext?.interpreted_request
  const analysisInput = [
    situation,
    interpreted?.object_of_analysis,
    interpreted?.implicit_tension,
    intentContext?.dominant_frame,
    intentContext?.decision_type,
  ].filter(Boolean).join('\n')
  const powers = analyzePowersInPresence(analysisInput || situation, resources)

  if (isGeopoliticalIntent(intentContext) || isWarSecurityText(situation) || isConflictOrGeopolitics(situation)) {
    return withPowersContext(geopoliticalFrame(subject || situation, resources, powers), powers)
  }

  if (isQuestionOnly(situation)) {
    return withPowersContext(genericFrame(subject || situation, resources, powers), powers)
  }

  const signals = [
    ...cleanIntentSignals(intentSignals(intentContext)),
    ...splitSignals(situation),
    ...resourceSignals(resources),
  ]
  const base = subject || compact(situation)
  const fallback = base || 'Situation insuffisamment spécifiée'

  const analysis: ArbreACamesAnalysis = {
    acteurs: pick(signals, 0, 'Acteurs à identifier dans la situation'),
    intentions: pick(signals, 1, 'Intentions officielles et réelles à clarifier'),
    interets: pick(signals, 1, 'Intérêts explicites et implicites à clarifier'),
    contraintes: pick(signals, 4, 'Contraintes de temps, ressources, règles ou dépendances'),
    rapports_de_force: pick(signals, 2, powersAxisLine(powers)),
    forces: pick(signals, 2, powers.primary.map((item) => item.name).join(', ')),
    vulnerabilites: pick(signals, 3, 'Point fragile, rupture possible ou dépendance cachée'),
    tensions: pick(signals, 3, 'Tensions qui fragilisent l’équilibre'),
    temporalites: pick(signals, 6, 'Temporalités, urgences et fenêtres d’action'),
    trajectoires: pick(signals, 7, 'Trajectoires possibles de stabilisation, escalade ou bascule'),
    incertitudes: [
      ...pick(signals, 5, 'Chercher quelles intentions, capacités ou seuils restent invisibles.'),
      blindSpotLensFor(intentContext),
    ],
    temps: pick(signals, 6, 'Rythmes, délais et fenêtres d’action'),
    perceptions: pick(signals, 7, 'Récits, légitimations et perceptions des parties'),
    sens_perceptions: pick(signals, 7, 'Sens, récits et perceptions des parties'),
    main_vulnerability_candidate:
      signals.find((signal) => /fragil|risque|rupture|bloc|depend|delay|retard|contrainte/i.test(signal)) ??
      fallback,
    load_bearing_contradiction:
      signals.find((signal) => /mais|cependant|alors que|while|but|contradiction|tension/i.test(signal)) ??
      fallback,
  }

  const enriched = withPowersContext(analysis, powers)

  for (const axis of AXES) {
    enriched[axis] = enriched[axis].map(compact).filter(Boolean)
  }

  return enriched
}
