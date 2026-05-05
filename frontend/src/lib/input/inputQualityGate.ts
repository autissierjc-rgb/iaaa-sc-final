import { detectDomain } from '../coverage/detectDomain'
import { situationIntentRouter } from '../intent/situationIntentRouter'
import type { SituationDomain } from '../resources/resourceContract'

export type InputQualityStatus =
  | 'ready_for_analysis'
  | 'multi_question'
  | 'missing_context'
  | 'needs_url_content'
  | 'too_vague'
  | 'ambiguous_domain'
  | 'biased_question'
  | 'incomprehensible'

export type InputQualityGate = {
  status: InputQualityStatus
  domain: SituationDomain
  questions: string[]
  signals: string[]
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasClarification(input: string): boolean {
  return /\bpr[eé]cisions?\b/i.test(input) || /\n.+\n/.test(input)
}

function looksIncomprehensible(input: string): boolean {
  const compact = input.replace(/\s+/g, '')
  if (compact.length < 4) return true
  const letters = input.match(/[a-zA-ZÀ-ÿ]/g)?.length ?? 0
  return letters / Math.max(input.length, 1) < 0.45
}

function isMultiQuestion(input: string): boolean {
  const text = normalize(input)
  const questionMarks = (input.match(/\?/g) ?? []).length
  const starters = text.match(/\b(comment|pourquoi|quel|quelle|quels|quelles|que|quoi|qui|quand|ou)\b/g) ?? []
  return questionMarks > 1 || starters.length > 1 || /\b(et pourquoi|et comment|mais pourquoi|ou pourquoi)\b/.test(text)
}

function isBiasedQuestion(input: string): boolean {
  const text = normalize(input)
  return /\b(pourquoi .+ peut|pourquoi .+ devrait|prouve que|montre que|justifie que|selectionne|selectionnable)\b/.test(text)
}

function hasActionableInterpretation(intent: ReturnType<typeof situationIntentRouter>): boolean {
  const interpreted = intent.interpreted_request
  if (!interpreted || interpreted.needs_clarification) return false
  const object = interpreted.object_of_analysis?.trim() ?? ''
  const question = interpreted.user_question?.trim() ?? ''
  if (object.length < 4 || question.length < 20) return false
  return Boolean(interpreted.expected_answer_shape?.trim()) || interpreted.confidence >= 0.55
}

function genericQuestions(domain: SituationDomain): string[] {
  if (domain === 'geopolitics' || domain === 'war') {
    return [
      'Depuis quel point de vue voulez-vous lire cette situation : général, politique, économique, militaire, psychologique ou mixte ?',
    ]
  }

  if (domain === 'personal') {
    return [
      'Qui est impliqué et quel est le lien entre vous ?',
      'Quelle décision ou limite voulez-vous éclairer maintenant ?',
    ]
  }

  if (domain === 'management' || domain === 'professional') {
    return [
      'Qui sont les acteurs impliqués et quel est votre rôle exact ?',
      'Quelle décision ou clarification doit être obtenue maintenant ?',
    ]
  }

  return [
    'Quelle est la situation concrète à analyser ?',
    'Quels acteurs, faits ou données doivent absolument être pris en compte ?',
  ]
}

function limitQuestions(questions: string[]): string[] {
  return questions.map((question) => question.trim()).filter(Boolean).slice(0, 2)
}

export function inputQualityGate(input: string): InputQualityGate {
  const text = input.trim()
  const normalized = normalize(text)
  const intent = situationIntentRouter(text)
  const domain = intent.surface_domain || detectDomain(text)
  const interpreted = intent.interpreted_request
  const signals: string[] = []
  const isGeopoliticalQuestion = domain === 'geopolitics' || domain === 'war'

  if (looksIncomprehensible(text)) {
    return {
      status: 'incomprehensible',
      domain,
      signals: ['input illisible ou trop court'],
      questions: ['Je n’arrive pas à lire clairement la situation. Pouvez-vous la reformuler en une ou deux phrases concrètes ?'],
    }
  }

  if (intent.needs_clarification && intent.questions.length > 0) {
    const status: InputQualityStatus =
      intent.dominant_frame === 'site_analysis'
        ? 'needs_url_content'
        : text.length < 30
          ? 'too_vague'
          : 'missing_context'
    return {
      status,
      domain,
      signals: intent.signals,
      questions: limitQuestions(intent.questions),
    }
  }

  if (
    isMultiQuestion(text) &&
    !hasClarification(text) &&
    !hasActionableInterpretation(intent)
  ) {
    return {
      status: 'multi_question',
      domain,
      signals: ['plusieurs questions détectées'],
      questions: [
        'Votre demande contient plusieurs axes. Voulez-vous les traiter ensemble ou prioriser un seul angle ?',
        'Quel est l’objet principal : comprendre le mécanisme général, analyser un cas précis, ou décider quoi faire ?',
      ],
    }
  }

  if (isBiasedQuestion(text) && !hasClarification(text)) {
    signals.push('question orientée')
  }

  if (text.length < 30 && !hasClarification(text)) {
    return {
      status: 'too_vague',
      domain,
      signals,
      questions: limitQuestions(genericQuestions(domain)),
    }
  }

  if (!isGeopoliticalQuestion && /\b(ca|ça|truc|probleme|situation|conflit)\b/.test(normalized) && text.length < 60 && !hasClarification(text)) {
    return {
      status: 'missing_context',
      domain,
      signals,
      questions: limitQuestions(genericQuestions(domain)),
    }
  }

  return {
    status: signals.length > 0 ? 'biased_question' : 'ready_for_analysis',
    domain,
    signals,
    questions: [],
  }
}
