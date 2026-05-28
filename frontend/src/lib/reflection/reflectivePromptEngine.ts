import { mapEmotionSignals } from './emotionSignalMapper'
import { buildMaieuticQuestions } from './maieuticQuestionEngine'
import type { ReflectivePromptInput, ReflectivePromptOutput } from './types'

export function buildReflectivePrompts(input: ReflectivePromptInput): ReflectivePromptOutput {
  const emotionSignals = mapEmotionSignals(input.situation_input)
  return {
    reflective_questions: buildMaieuticQuestions(input, emotionSignals),
  }
}
