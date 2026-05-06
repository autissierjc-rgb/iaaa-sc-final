import type { DialogueGateContract, DialogueGateStatus, InterpretationContract } from '../contracts'

export type DialogueGateInput = {
  interpretation: InterpretationContract
}

function hasUsableObject(interpretation: InterpretationContract): boolean {
  return Boolean(
    interpretation.object_of_analysis.trim() ||
    interpretation.situation_soumise.trim() ||
    interpretation.raw_input.trim(),
  )
}

function hasUrl(input: string): boolean {
  return /\bhttps?:\/\/\S+|\bwww\.[^\s]+/i.test(input)
}

function statusFor(interpretation: InterpretationContract): DialogueGateStatus {
  if (hasUrl(interpretation.raw_input)) return 'READY_TO_GENERATE'

  if (!hasUsableObject(interpretation)) return 'BLOCKING_CLARIFICATION'

  if (interpretation.needs_clarification && interpretation.confidence < 0.45) {
    return 'BLOCKING_CLARIFICATION'
  }

  if (interpretation.needs_clarification || interpretation.clarification_question) {
    return 'OPTIONAL_REFINEMENT'
  }

  return 'READY_TO_GENERATE'
}

function fallbackQuestion(interpretation: InterpretationContract): string {
  if (interpretation.clarification_question?.trim()) {
    return interpretation.clarification_question.trim()
  }

  return 'Quelle precision changerait vraiment la lecture de cette situation ?'
}

export function runDialogueGate(input: DialogueGateInput): DialogueGateContract {
  const status = statusFor(input.interpretation)
  const canGenerate = status !== 'BLOCKING_CLARIFICATION'

  return {
    status,
    question: status === 'READY_TO_GENERATE' ? undefined : fallbackQuestion(input.interpretation),
    reason:
      status === 'BLOCKING_CLARIFICATION'
        ? "L'objet, le referent, la source ou une condition de securite manque vraiment."
        : status === 'OPTIONAL_REFINEMENT'
          ? 'La carte peut etre generee, mais une precision utilisateur peut l affuter.'
          : 'La situation est suffisamment identifiable pour generer.',
    can_generate: canGenerate,
    interpretation: input.interpretation,
    user_can_ignore_question: status === 'OPTIONAL_REFINEMENT',
  }
}
