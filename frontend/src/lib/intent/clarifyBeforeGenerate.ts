import type { InputQualityGate } from '../input/inputQualityGate'
import type { IntentContext } from '../resources/resourceContract'
import { detectQuestionShape, type QuestionShape } from './detectQuestionShape'

export type ClarifyBeforeGenerateResult = {
  shouldClarify: boolean
  status: 'ready' | 'clarify_intent'
  shape: QuestionShape
  questions: string[]
  signals: string[]
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasClarification(value: string): boolean {
  return /\bpr[eé]cisions?\b/i.test(value) || /\n.+\n/.test(value)
}

function includesNormalized(haystack: string | undefined, needle: string): boolean {
  if (!haystack) return false
  return normalize(haystack).includes(normalize(needle))
}

function hasNamedObjectClass(situation: string, label: string): boolean {
  const text = normalize(situation)
  const name = normalize(label)
  if (!name) return false
  const classBefore = new RegExp(`\\b(compagnie|entreprise|societe|société|startup|start up|start-up|site|plateforme|application|app|outil|service)\\s+(?:de\\s+|du\\s+|d\\s+)?${name}\\b`)
  const classAfter = new RegExp(`\\b${name}\\s+(compagnie|entreprise|societe|société|startup|start up|start-up|site|plateforme|application|app|outil|service)\\b`)
  return classBefore.test(text) || classAfter.test(text)
}

function centralUncertainEntity(
  situation: string,
  interpreted: IntentContext['interpreted_request'],
): { label: string; suggestion?: string } | null {
  if (!interpreted?.entity_explanations?.length) return null

  const coreTexts = [
    situation,
    interpreted.user_question,
    interpreted.object_of_analysis,
    interpreted.primary_hypothesis,
  ]

  for (const entity of interpreted.entity_explanations) {
    const label = entity.label?.trim()
    if (!label) continue

    const explanation = `${entity.explanation || ''} ${entity.certainty || ''}`
    const isUncertain =
      entity.certainty === 'unknown' ||
      /\b(a|à)\s+(identifier|expliciter)\b/i.test(explanation) ||
      /\b(unknown|uncertain|incertain|non\s+identifi[eé])\b/i.test(explanation)

    if (!isUncertain) continue
    if (hasNamedObjectClass(situation, label)) continue
    if (coreTexts.some((text) => includesNormalized(text, label))) {
      const suggestion =
        /correction possible\s*:\s*([^.;,\n]+)/i.exec(explanation)?.[1]?.trim()
      return suggestion ? { label, suggestion } : { label }
    }
  }

  return null
}

function lowerFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value
}

function confirmationQuestion(hypothesis: string): string {
  const cleaned = hypothesis
    .trim()
    .replace(/^il est possible que\s+/i, '')
    .replace(/^je comprends que\s+/i, '')
    .replace(/[.?!]+$/g, '')
    .trim()
  return `Je comprends que ${lowerFirst(cleaned)}. C’est bien cela ?`
}

function contextualQuestions(input: string, intent: IntentContext): string[] {
  const text = normalize(input)

  if (intent.dominant_frame === 'site_analysis') {
    const siteSignal = intent.signals.find((signal) => signal.includes('site mentionné'))
    const site = siteSignal?.split(':').pop()?.trim() || 'le site mentionné'
    if (siteSignal) {
      return [
        `Pour ${site}, vous pouvez préciser l’angle si nécessaire : évaluation, investissement, positionnement, risque ou prochaine preuve à produire.`,
      ]
    }
    return [
      `Pour analyser ${site}, pouvez-vous donner un lien accessible, une capture ou le texte principal utile ?`,
      'Voulez-vous surtout évaluer le produit, le potentiel investisseur, le positionnement ou la prochaine preuve à produire ?',
    ]
  }

  if (/\b(pitch|jury|pairs?|presentation|anglais|lancement|lancer|entrain|entraine)\b/.test(text)) {
    return [
      'Que voulez-vous éclairer en priorité : contenu du pitch, stress du regard, plan d’entraînement ou message en anglais ?',
      'Quel résultat attendez-vous du jury : convaincre, obtenir des retours, être sélectionné ou trouver des soutiens ?',
    ]
  }

  if (intent.dominant_frame === 'founder_governance') {
    return [
      'Quelle décision voulez-vous éclairer : accepter, refuser, différer ou poser des conditions ?',
      'Quel risque voulez-vous éviter en priorité : conflit personnel, gouvernance, parts, pouvoir ou crédibilité du projet ?',
    ]
  }

  if (intent.dominant_frame === 'startup_investment') {
    return [
      'Voulez-vous comprendre les critères VC en général, évaluer un projet précis, ou préparer un pitch investisseur ?',
      'Quelle preuve doit être jugée en priorité : produit, marché, traction, équipe, distribution ou volonté de payer ?',
    ]
  }

  if (intent.dominant_frame === 'personal_relationship') {
    return [
      'Voulez-vous surtout comprendre ce qui se joue, décider quoi faire, ou préparer une conversation ?',
      'Quel point doit rester prioritaire : lien, limite, autonomie, conflit, sécurité ou décision concrète ?',
    ]
  }

  if (intent.dominant_frame === 'team_management') {
    return [
      'Voulez-vous éclairer le rôle des acteurs, la décision à prendre, ou le risque si rien ne change ?',
      'Quel arbitrage doit devenir explicite maintenant ?',
    ]
  }

  if (intent.dominant_frame === 'geopolitical_crisis') {
    return [
      'Depuis quel point de vue voulez-vous lire cette situation : général, politique, économique, militaire, psychologique ou mixte ?',
    ]
  }

  return [
    'Quelle question voulez-vous vraiment éclairer avec cette carte ?',
    'Faut-il traiter cette situation comme une décision, un risque, un conflit, une opportunité ou une demande de compréhension ?',
  ]
}

function hasActionableInterpretation(intent: IntentContext): boolean {
  const interpreted = intent.interpreted_request
  if (!interpreted || interpreted.needs_clarification) return false
  const object = interpreted.object_of_analysis?.trim() ?? ''
  const question = interpreted.user_question?.trim() ?? ''
  if (object.length < 4 || question.length < 20) return false
  return Boolean(interpreted.expected_answer_shape?.trim()) || interpreted.confidence >= 0.55
}

export function clarifyBeforeGenerate({
  situation,
  intentContext,
  inputQuality,
}: {
  situation: string
  intentContext: IntentContext
  inputQuality: InputQualityGate
}): ClarifyBeforeGenerateResult {
  const shape = detectQuestionShape(situation)
  const signals = [...shape.signals, ...inputQuality.signals]
  const interpreted = intentContext.interpreted_request
  const uncertainEntity = centralUncertainEntity(situation, interpreted)
  const lowConfidenceIncomplete =
    Boolean(interpreted) &&
    (interpreted?.confidence ?? 1) < 0.65 &&
    interpreted?.domain === 'general' &&
    shape.kind !== 'clear_question'
  const confirmationHypothesis = interpreted?.confirmation_hypothesis?.trim()

  if (hasClarification(situation)) {
    return {
      shouldClarify: false,
      status: 'ready',
      shape,
      questions: [],
      signals,
    }
  }

  if (uncertainEntity) {
    return {
      shouldClarify: true,
      status: 'clarify_intent',
      shape,
      questions: [
        confirmationHypothesis
          ? confirmationQuestion(confirmationHypothesis)
          : uncertainEntity.suggestion
          ? `Voulez-vous dire « ${uncertainEntity.suggestion} » par « ${uncertainEntity.label} » ?`
          : `Qui ou quoi désignez-vous par « ${uncertainEntity.label} » ?`,
      ],
      signals: [...signals, `entité centrale incertaine : ${uncertainEntity.label}`],
    }
  }

  if (lowConfidenceIncomplete) {
    return {
      shouldClarify: true,
      status: 'clarify_intent',
      shape,
      questions: confirmationHypothesis
        ? [confirmationQuestion(confirmationHypothesis)]
        : contextualQuestions(situation, intentContext).slice(0, 1),
      signals: [...signals, `compréhension insuffisante : confiance ${interpreted?.confidence}`],
    }
  }

  if (hasActionableInterpretation(intentContext)) {
    return {
      shouldClarify: false,
      status: 'ready',
      shape,
      questions: [],
      signals: [
        ...signals,
        'contrat exploitable : génération directe',
        `intention interprétée : ${interpreted?.intent_type}`,
        `objet interprété : ${interpreted?.object_of_analysis}`,
      ],
    }
  }

  if (
    intentContext.dominant_frame === 'site_analysis' &&
    intentContext.signals.some((signal) => signal.includes('site mentionné'))
  ) {
    return {
      shouldClarify: false,
      status: 'ready',
      shape,
      questions: [],
      signals: [...signals, 'site fourni : recherche web serveur requise'],
    }
  }

  if (
    interpreted &&
    !interpreted.needs_clarification &&
    ['understand', 'predict', 'compare', 'diagnose'].includes(interpreted.intent_type)
  ) {
    return {
      shouldClarify: false,
      status: 'ready',
      shape,
      questions: [],
      signals: [
        ...signals,
        `intention interprétée : ${interpreted.intent_type}`,
        `objet interprété : ${interpreted.object_of_analysis}`,
      ],
    }
  }

  if (shape.kind === 'situation_without_question' || shape.kind === 'multi_question' || shape.kind === 'drawer_question') {
    return {
      shouldClarify: true,
      status: 'clarify_intent',
      shape,
      questions: contextualQuestions(situation, intentContext).slice(0, 2),
      signals,
    }
  }

  return {
    shouldClarify: false,
    status: 'ready',
    shape,
    questions: [],
    signals,
  }
}
