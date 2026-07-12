export type ReflectiveQuestionType =
  | 'structure_gap'
  | 'tension'
  | 'boundary'
  | 'meaning'
  | 'decision'

export type EmotionSignal =
  | 'anger'
  | 'fear'
  | 'sadness'
  | 'surprise'
  | 'disgust'
  | 'joy'
  | 'fatigue'
  | 'confusion'

export type ReflectivePromptInput = {
  situation_input: string
  sc_output?: unknown
  dominant_regime?: string
  structure_gap?: string
  structure_gap_source?: 'theatre' | 'default'
  main_vulnerability?: string
  transition_signal?: string
  transition_signal_source?: 'sources' | 'theatre' | 'default'
  actors?: string[]
  tensions?: string[]
  uncertainty?: string
  context_type?: string
}

export type ReflectiveQuestion = {
  type: ReflectiveQuestionType
  question_fr: string
  question_en: string
  rationale_internal: string
}

export type ReflectivePromptOutput = {
  reflective_questions: ReflectiveQuestion[]
}
