export type QuestionShapeKind =
  | 'clear_question'
  | 'situation_without_question'
  | 'multi_question'
  | 'drawer_question'
  | 'too_vague'

export type QuestionShape = {
  kind: QuestionShapeKind
  has_explicit_question: boolean
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

export function detectQuestionShape(input: string): QuestionShape {
  const raw = input.trim()
  const text = normalize(raw)
  const questionMarks = (raw.match(/\?/g) ?? []).length
  const starters = text.match(/\b(comment|pourquoi|quel|quelle|quels|quelles|que|quoi|qui|quand|ou|où|faut il|dois je|devrais je)\b/g) ?? []
  const hasExplicitQuestion =
    questionMarks > 0 ||
    /^(comment|pourquoi|quel|quelle|quels|quelles|que|quoi|qui|quand|ou|où|faut il|dois je|devrais je)\b/.test(text) ||
    /\b(que faire|quoi faire|comment faire|dois je|devrais je|faut il)\b/.test(text)
  const signals: string[] = []

  if (raw.length < 20) {
    return {
      kind: 'too_vague',
      has_explicit_question: hasExplicitQuestion,
      signals: ['demande trop courte'],
    }
  }

  if (questionMarks > 1 || starters.length > 1 || /\b(et pourquoi|et comment|mais pourquoi|ou pourquoi|et que faire|et quoi faire)\b/.test(text)) {
    return {
      kind: 'multi_question',
      has_explicit_question: true,
      signals: ['plusieurs questions ou angles détectés'],
    }
  }

  if (
    hasExplicitQuestion &&
    /\b(et|mais|aussi|en meme temps|en même temps|d autre part)\b/.test(text) &&
    /\b(decision|choix|risque|peur|stress|preuve|investissement|pitch|jury|relation|strategie|stratégie)\b/.test(text)
  ) {
    return {
      kind: 'drawer_question',
      has_explicit_question: true,
      signals: ['question à tiroirs détectée'],
    }
  }

  if (!hasExplicitQuestion && !hasClarification(raw)) {
    signals.push('situation sans question explicite')
    return {
      kind: 'situation_without_question',
      has_explicit_question: false,
      signals,
    }
  }

  return {
    kind: 'clear_question',
    has_explicit_question: hasExplicitQuestion,
    signals,
  }
}
