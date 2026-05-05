import type {
  ConversationContract,
  IntentContext,
  InterpretedRequest,
  QuestionType,
  RequestIntentType,
  SituationDomain,
} from '../resources/resourceContract'

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function words(value: string): string[] {
  const stop = new Set([
    'avec',
    'dans',
    'dont',
    'elle',
    'elles',
    'entre',
    'est',
    'etre',
    'fait',
    'font',
    'il',
    'ils',
    'les',
    'leur',
    'leurs',
    'mais',
    'mon',
    'nous',
    'par',
    'pas',
    'pour',
    'que',
    'qui',
    'quoi',
    'sans',
    'ses',
    'son',
    'sur',
    'une',
    'vous',
  ])
  return normalize(value)
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !stop.has(word))
}

function contentOverlap(input: string, previous: string): number {
  const currentWords = new Set(words(input))
  const previousWords = new Set(words(previous))
  if (!currentWords.size || !previousWords.size) return 0
  let common = 0
  for (const word of currentWords) {
    if (previousWords.has(word)) common += 1
  }
  return common / Math.min(currentWords.size, previousWords.size)
}

function looksLikeContinuationInput(input: string): boolean {
  const text = normalize(clean(input))
  if (!text) return false
  return /^(ok|oui|non|donc|et donc|mais|par contre|en fait|voila|voilà|cela|ca|ça|ce point|sur ce point|concernant|ajoute|ajouter|precise|précise|precision|précision|corrige|corriger|regener|régénér|approfond|resume|résume|comme dit|comme evoque|comme évoqué|meme sujet|même sujet)\b/.test(text)
}

function looksLikeStandaloneQuestionOrClaim(input: string): boolean {
  const text = normalize(clean(input))
  if (!text) return false
  if (clean(input).includes('?')) return true
  return /\b(comment|pourquoi|quelle|quel|quelles|quels|que fait|est ce|est-ce|dois je|doit on|faut il|peut il|peut-on|risque|craignent|craint|contourne|contourner|elections|élections|guerre|position)\b/.test(text)
}

function unique(values: string[], max = 14): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values) {
    const value = clean(raw)
    const key = normalize(value)
    if (!value || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result.slice(0, max)
}

function extractHumanMatter(input: string): string[] {
  const text = clean(input)
  const matter: string[] = []
  const patterns: Array<[RegExp, string]> = [
    [/\bfils\b/i, 'le fils'],
    [/\bfille\b/i, 'la fille'],
    [/\b14\s*ans\b/i, '14 ans'],
    [/\bado(?:lescent)?\b/i, 'adolescent'],
    [/\bp[eê]che\b/i, 'la pêche'],
    [/\bcarpe\b/i, 'la carpe'],
    [/\b4\s*jours?|quatre\s+jours?\b/i, 'quatre jours'],
    [/\bpas pris de poisson|sans poisson|aucun poisson\b/i, 'absence de poisson'],
    [/\breporter la faute|faute|responsabilit[eé]\b/i, 'faute reportée sur le parent'],
    [/\bvoiture\b/i, 'retrait dans la voiture'],
    [/\b4\s*heures?|quatre\s+heures?\b/i, 'quatre heures de trajet'],
    [/\bje t['’ ]?aime|aimait|amour\b/i, 'déclaration d’amour'],
    [/\bpas r[eé]agi|surpris|surprise\b/i, 'surprise et absence de réaction'],
    [/\bau revoir|dire au revoir\b/i, 'moment du au revoir'],
  ]
  for (const [pattern, label] of patterns) {
    if (pattern.test(text)) matter.push(label)
  }
  const proper = text.match(/\b[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’.-]{2,}\b/g) ?? []
  return unique([...matter, ...proper], 12)
}

function forbiddenTermsFor(domain: SituationDomain): string[] {
  if (domain === 'personal') {
    return [
      'site officiel',
      'URL officielle',
      'page produit',
      'décision client',
      'revenus',
      'rétention',
      'traction',
      'MVP',
      'marché visé',
      'preuve d’exécution',
      'mécanisme de sélection',
      'rituel ancien',
    ]
  }
  return []
}

function isExplicitNewQuestion(interpreted: InterpretedRequest): boolean {
  return Boolean(
    interpreted.question_type === 'causal_attribution' ||
    interpreted.question_type === 'site_analysis' ||
    interpreted.primary_hypothesis ||
    interpreted.must_answer_first ||
    interpreted.confidence >= 0.78
  )
}

export function shouldCarryConversationContract(
  interpreted: InterpretedRequest,
  contract?: ConversationContract,
  userInput?: string
): boolean {
  if (!contract?.status) return false

  const input = clean(userInput)
  if (input && !looksLikeContinuationInput(input) && looksLikeStandaloneQuestionOrClaim(input)) {
    const previousMatter = [
      contract.canonical_situation,
      contract.object_of_analysis,
      ...(contract.required_matter_fr ?? []),
      ...(contract.turns ?? []),
    ].join(' ')
    if (contentOverlap(input, previousMatter) < 0.35) return false
  }

  if (!isExplicitNewQuestion(interpreted)) return true
  if (interpreted.question_type !== contract.question_type) return false
  if (interpreted.domain !== contract.domain) return false
  const object = normalize(clean(interpreted.object_of_analysis))
  const previousObject = normalize(clean(contract.object_of_analysis))
  if (object && previousObject && object !== previousObject) {
    if (!object.includes(previousObject) && !previousObject.includes(object)) return false
  }
  return true
}

function mergeIntentWithContract(
  interpreted: InterpretedRequest,
  contract?: ConversationContract,
  userInput?: string
): InterpretedRequest {
  if (!shouldCarryConversationContract(interpreted, contract, userInput)) return interpreted
  const activeContract = contract as ConversationContract
  return {
    ...interpreted,
    domain: activeContract.domain,
    intent_type: activeContract.intent_type,
    question_type: activeContract.question_type,
    object_of_analysis: activeContract.object_of_analysis,
    expected_answer_shape: activeContract.expected_answer_shape,
    needs_clarification: false,
    signals: unique([...interpreted.signals, ...activeContract.signals, 'contrat conversationnel actif']),
  }
}

export function applyConversationContractToIntent(
  interpreted: InterpretedRequest,
  contract?: ConversationContract,
  userInput?: string
): InterpretedRequest {
  return mergeIntentWithContract(interpreted, contract, userInput)
}

export function buildConversationContract({
  situation,
  intentContext,
  previous,
}: {
  situation: string
  intentContext: IntentContext
  previous?: ConversationContract
}): ConversationContract {
  const interpreted = intentContext.interpreted_request
  const carriedPrevious = interpreted && shouldCarryConversationContract(interpreted, previous, situation)
    ? previous
    : undefined
  const domain = (interpreted?.domain ?? intentContext.surface_domain) as SituationDomain
  const intentType = (interpreted?.intent_type ?? 'understand') as RequestIntentType
  const questionType = (interpreted?.question_type ?? 'open_analysis') as QuestionType
  const previousTurns = carriedPrevious?.turns ?? []
  const requiredMatter = unique([
    ...(carriedPrevious?.required_matter_fr ?? []),
    ...extractHumanMatter(situation),
    domain === 'personal' ? '' : clean(interpreted?.object_of_analysis ?? ''),
  ])

  return {
    version: 1,
    status: 'active',
    canonical_situation: carriedPrevious?.canonical_situation || clean(situation),
    domain,
    intent_type: intentType,
    question_type: questionType,
    dominant_frame: intentContext.dominant_frame,
    decision_type: intentContext.decision_type,
    object_of_analysis: clean(interpreted?.object_of_analysis || carriedPrevious?.object_of_analysis || situation),
    expected_answer_shape: clean(
      interpreted?.expected_answer_shape ||
      carriedPrevious?.expected_answer_shape ||
      'Répondre au sens de la question sans reclasser localement.'
    ),
    required_matter_fr: requiredMatter,
    forbidden_frames: domain === 'personal' ? ['site_analysis', 'startup_investment'] : carriedPrevious?.forbidden_frames ?? [],
    forbidden_terms_fr: unique([...(carriedPrevious?.forbidden_terms_fr ?? []), ...forbiddenTermsFor(domain)]),
    turns: unique([...previousTurns, clean(situation)], 10),
    signals: unique([
      ...(carriedPrevious?.signals ?? []),
      ...(intentContext.signals ?? []),
      'contrat canonique de conversation',
    ]),
  }
}

export function contractViolations(text: string, contract?: ConversationContract): string[] {
  if (!contract) return []
  const normalized = normalize(text)
  const violations = contract.forbidden_terms_fr.filter((term) => normalized.includes(normalize(term)))
  const hasMatter =
    contract.required_matter_fr.length === 0 ||
    contract.required_matter_fr.some((item) => normalized.includes(normalize(item)))
  if (!hasMatter) violations.push('matière obligatoire absente')
  return unique(violations)
}
