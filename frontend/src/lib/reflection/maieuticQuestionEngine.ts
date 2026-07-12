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

function shorten(value: string, max = 90): string {
  const compactValue = clean(value)
  if (compactValue.length <= max) return compactValue
  const clipped = compactValue.slice(0, max)
  const boundary = clipped.lastIndexOf(' ')
  return `${clipped.slice(0, boundary > max * 0.6 ? boundary : max)}…`
}

function lowerFirst(value: string): string {
  const compactValue = clean(value)
  if (!compactValue) return compactValue
  if (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(compactValue) && !/^[A-ZÀ-Ý]{2}/.test(compactValue)) {
    return compactValue.charAt(0).toLowerCase() + compactValue.slice(1)
  }
  return compactValue
}

// Grille canonique des dynamiques ternaires (humanCollectivePatterns.md) :
// une relance qui clarifie, une qui suit ce qui agite, une qui sonde ce qui
// fige — chacune ancrée dans la matière de la carte, jamais générique quand
// la matière existe, jamais le nom de la grille en public.
export function buildMaieuticQuestions(
  input: ReflectivePromptInput,
  emotionSignals: EmotionStructureSignal[],
): ReflectiveQuestion[] {
  // La matière par défaut de la trace (gap ou transition de repli) est une
  // formule mécanique : la citer produit une relance incompréhensible. Seule
  // la matière qualifiée (théâtre, sources) est citable ; sinon la relance
  // retombe sur sa forme générique lisible.
  const gapQuotable = input.structure_gap_source !== 'default'
  const signalQuotable = input.transition_signal_source !== 'default'
  const gap = gapQuotable ? clean(input.structure_gap) : ''
  const rawVulnerability = clean(input.main_vulnerability)
    .replace(/^le point fragile est\s+/i, '')
  const vulnerability = !gapQuotable && input.structure_gap && rawVulnerability.includes(clean(input.structure_gap))
    ? ''
    : rawVulnerability
  const signal = signalQuotable ? clean(input.transition_signal) : ''
  const uncertainty = clean(input.uncertainty)
  const actors = (input.actors ?? []).map(clean).filter(Boolean).slice(0, 3)

  const clarifier: ReflectiveQuestion = {
    type: 'structure_gap',
    question_fr: gap
      ? `De votre côté, que savez-vous déjà sur « ${lowerFirst(shorten(gap, 110))} » ?`
      : uncertainty
        ? `Quelle information rendrait « ${shorten(uncertainty, 80)} » moins décisive ?`
        : 'Quel fait, document ou décision rendrait cette situation vérifiable ?',
    question_en: 'What do you already know about the missing piece the card names?',
    rationale_internal: 'Dynamique clarifiante : le manque précis nommé par la carte.',
  }

  const mobilisante: ReflectiveQuestion = {
    type: 'tension',
    question_fr: signal
      ? `Si ${lowerFirst(shorten(signal, 110))} survient, qu'est-ce que cela changerait pour vous en premier ?`
      : actors.length >= 2
        ? `Parmi ${actors.join(', ')}, qui a le plus intérêt à faire bouger la situation maintenant ?`
        : actors.length === 1
          ? `Qu'est-ce qui donnerait à ${actors[0]} une raison de faire bouger la situation maintenant ?`
          : 'Qu’est-ce qui pourrait précipiter la situation dans les prochains jours ?',
    question_en: 'If the watched signal appears, what would it change for you first?',
    rationale_internal: 'Dynamique mobilisante : le signal de bascule surveillé par la carte.',
  }

  const emotionQuestion = emotionSignals.length > 0
    ? questionFromEmotion(emotionSignals[0], input)
    : null
  const degel: ReflectiveQuestion = vulnerability
    ? {
        type: 'decision',
        question_fr: `Sur le point fragile — ${lowerFirst(shorten(vulnerability, 100))} — qu'observez-vous concrètement aujourd'hui ?`,
        question_en: 'On the fragile point the card names, what do you concretely observe today?',
        rationale_internal: 'Dynamique de dégel : le point que la carte désigne comme figé ou fragile.',
      }
    : emotionQuestion ?? genericQuestion('decision', input)

  const questions = [clarifier, mobilisante, degel]
  const seen = new Set<string>()
  return questions.filter((question) => {
    const key = question.question_fr.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)
}
