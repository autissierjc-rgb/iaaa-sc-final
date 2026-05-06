import type { InterpretationContract } from './interpretation'

export type DialogueGateStatus =
  | 'READY_TO_GENERATE'
  | 'OPTIONAL_REFINEMENT'
  | 'BLOCKING_CLARIFICATION'

export type DialogueGateContract = {
  status: DialogueGateStatus
  question?: string
  reason?: string
  can_generate: boolean
  interpretation: InterpretationContract
  user_can_ignore_question: boolean
}
