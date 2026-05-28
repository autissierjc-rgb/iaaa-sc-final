import type { EmotionStructureSignal } from './emotionSignalMapper'
import type { ReflectivePromptInput, ReflectiveQuestion, ReflectiveQuestionType } from './types'

function clean(value?: string): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function genericQuestion(type: ReflectiveQuestionType, input: ReflectivePromptInput): ReflectiveQuestion {
  const gap = clean(input.structure_gap)
  const vulnerability = clean(input.main_vulnerability)
  const uncertainty = clean(input.uncertainty)

  if (type === 'boundary') {
    return {
      type,
      question_fr: 'Quelle frontière paraît avoir été déplacée sans être clairement nommée ?',
      question_en: 'Which boundary seems to have shifted without being clearly named?',
      rationale_internal: 'Boundary-oriented reflective prompt.',
    }
  }
  if (type === 'tension') {
    return {
      type,
      question_fr: 'Quelle tension faudrait-il nommer pour qu’elle cesse de se déplacer ailleurs ?',
      question_en: 'Which tension would need to be named so it stops moving elsewhere?',
      rationale_internal: 'Tension-oriented reflective prompt.',
    }
  }
  if (type === 'decision') {
    return {
      type,
      question_fr: 'Quel choix deviendrait plus simple si le vrai seuil était nommé ?',
      question_en: 'Which choice would become simpler if the real threshold were named?',
      rationale_internal: 'Decision-oriented reflective prompt.',
    }
  }
  if (type === 'meaning') {
    return {
      type,
      question_fr: 'Quelle cohérence le système essaie-t-il encore de préserver ?',
      question_en: 'What coherence is the system still trying to preserve?',
      rationale_internal: 'Meaning-oriented reflective prompt.',
    }
  }

  return {
    type: 'structure_gap',
    question_fr: gap
      ? `Qu’est-ce qui manque pour rendre ce point lisible par tous les acteurs ?`
      : uncertainty
        ? `Quelle information rendrait ${uncertainty} moins décisive ?`
        : vulnerability
          ? `Qu’est-ce qui rendrait ${vulnerability} plus vérifiable ?`
          : 'Qu’est-ce qui manque pour que cette situation devienne lisible par tous les acteurs ?',
    question_en: 'What is missing for this situation to become readable by all actors?',
    rationale_internal: 'Structure-gap reflective prompt.',
  }
}

function questionFromEmotion(signal: EmotionStructureSignal, input: ReflectivePromptInput): ReflectiveQuestion {
  if (signal.emotion === 'anger') {
    return {
      type: 'boundary',
      question_fr: 'Quelle limite semble avoir été franchie ou déplacée ?',
      question_en: 'Which limit seems to have been crossed or moved?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }
  if (signal.emotion === 'fear') {
    return {
      type: 'structure_gap',
      question_fr: 'Quelle dépendance ou incertitude rend la situation difficile à stabiliser ?',
      question_en: 'Which dependency or uncertainty makes the situation hard to stabilize?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }
  if (signal.emotion === 'fatigue') {
    return {
      type: 'tension',
      question_fr: 'Quelle charge invisible le système continue-t-il de faire porter aux mêmes acteurs ?',
      question_en: 'Which invisible load does the system keep placing on the same actors?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }
  if (signal.emotion === 'confusion') {
    return {
      type: 'structure_gap',
      question_fr: 'Quelle règle manque pour rendre la situation lisible ?',
      question_en: 'Which rule is missing for the situation to become readable?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }
  if (signal.emotion === 'sadness') {
    return {
      type: 'meaning',
      question_fr: 'Quel cycle est peut-être en train de se fermer ?',
      question_en: 'Which cycle may be coming to an end?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }
  if (signal.emotion === 'disgust') {
    return {
      type: 'boundary',
      question_fr: 'Quel contrat implicite paraît ne plus tenir ?',
      question_en: 'Which implicit contract no longer seems to hold?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }
  if (signal.emotion === 'joy') {
    return {
      type: 'meaning',
      question_fr: 'Quelle cohérence temporaire mérite d’être testée avant de la généraliser ?',
      question_en: 'Which temporary coherence should be tested before being generalized?',
      rationale_internal: `Emotion signal mapped internally to ${signal.structural_hint_fr}.`,
    }
  }

  return genericQuestion(signal.type, input)
}

export function buildMaieuticQuestions(
  input: ReflectivePromptInput,
  emotionSignals: EmotionStructureSignal[],
): ReflectiveQuestion[] {
  const questions = [
    ...emotionSignals.map((signal) => questionFromEmotion(signal, input)),
    genericQuestion(input.structure_gap ? 'structure_gap' : 'tension', input),
    genericQuestion('decision', input),
  ]
  const seen = new Set<string>()
  return questions.filter((question) => {
    const key = question.question_fr.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)
}
