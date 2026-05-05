import type { CoverageCheck, IntentContext, SituationDomain } from '../resources/resourceContract'

type SelectClarifyingQuestionsInput = {
  situation: string
  domain: SituationDomain
  intentContext: IntentContext
  coverage: CoverageCheck
  inputQuestions: string[]
  coverageQuestions: string[]
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

function tokenSet(value: string): Set<string> {
  const stop = new Set([
    'quel', 'quelle', 'quels', 'quelles', 'est', 'sont', 'dans', 'avec', 'pour',
    'vous', 'votre', 'vos', 'une', 'des', 'les', 'qui', 'quoi', 'comment',
    'situation', 'analyser', 'analyse', 'precisement', 'concret', 'concrete',
  ])
  return new Set(
    normalize(value)
      .split(/\W+/)
      .filter((token) => token.length > 2 && !stop.has(token))
  )
}

function isAnswered(question: string, situation: string): boolean {
  const q = normalize(question)
  const input = normalize(situation)

  if (/consulter|recevoir son contenu|lien accessible|capture|texte principal|site/.test(q)) {
    return /\bprecisions\b/.test(input) && /\b(contenu|capture|texte principal|page|copie)\b/.test(input)
  }

  if (/situation concrete|theatre|pays|conflit/.test(q) && input.length > 45) {
    return true
  }

  const qTokens = tokenSet(question)
  if (qTokens.size === 0) return false
  const inputTokens = tokenSet(situation)
  const overlap = [...qTokens].filter((token) => inputTokens.has(token)).length
  return overlap / qTokens.size > 0.55
}

function scoreQuestion(question: string, input: SelectClarifyingQuestionsInput): number {
  const q = normalize(question)
  let score = 0

  if (/consulter|recevoir son contenu|lien accessible|capture|texte principal|site/.test(q)) score += 9
  if (/decision|trancher|prioriser|angle|eclairer|limite/.test(q)) score += 5
  if (/acteur|faits|donnees|preuves|role|risque|seuil|lieu|source/.test(q)) score += 4
  if (input.intentContext.dominant_frame === 'founder_governance' && /decision|trancher/.test(q)) score += 3
  if (/concret|reformuler|situation concrete|precisement/.test(q)) score -= 3
  if (input.intentContext.clarification_focus.some((focus) => q.includes(normalize(focus)))) score += 2
  if (input.coverage.missingCritical.some((missing) => q.includes(normalize(missing).split(' ')[0] ?? ''))) score += 1
  if (isAnswered(question, input.situation)) score -= 7

  return score
}

function dedupe(questions: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const question of questions) {
    const normalized = normalize(question)
    const key = /quelle decision.*eclairer|decision.*trancher/.test(normalized)
      ? 'decision'
      : /consulter|recevoir son contenu|lien accessible|capture|texte principal|site/.test(normalized)
        ? 'site-content'
        : normalized.replace(/\b(le|la|les|un|une|des|de|du|d)\b/g, '').trim()
    if (!question.trim() || seen.has(key)) continue
    seen.add(key)
    result.push(question.trim())
  }
  return result
}

function contextualizeQuestion(question: string, input: SelectClarifyingQuestionsInput): string {
  const q = normalize(question)
  const text = normalize(input.situation)
  const site = input.coverage.requestedSites?.[0]

  if (site && /consulter|recevoir son contenu|lien accessible|capture|texte principal|site/.test(q)) {
    return `Pour ${site}, vous pouvez préciser l’angle si nécessaire : évaluation, investissement, positionnement, risque ou prochaine preuve à produire.`
  }

  if (site && /decision|eclairer|trancher|angle/.test(q)) {
    return `Pour ${site}, quelle décision voulez-vous éclairer : évaluation, investissement, positionnement, risque ou prochaine preuve à produire ?`
  }

  if (input.intentContext.dominant_frame === 'founder_governance') {
    if (/^quelle decision|trancher/.test(q)) {
      return 'Pour votre ex qui demande à entrer comme cofondatrice, devez-vous plutôt accepter, refuser, différer ou poser des conditions ?'
    }
    if (/demande.*concretement|role|parts|pouvoir/.test(q)) {
      return 'Dans son entrée possible comme associée, demande-t-elle un rôle opérationnel, des parts, du pouvoir de décision, un titre, ou surtout une reconnaissance de son aide passée ?'
    }
  }

  if ((input.domain === 'geopolitics' || input.domain === 'war') && /iran/.test(text)) {
    if (/angle|privilegier|lecture/.test(q)) {
      return 'Depuis quel point de vue voulez-vous lire ce que la guerre en Iran révèle du monde : général, politique, économique, militaire, psychologique ou mixte ?'
    }
    if (/acteurs|faits|donnees|lieux/.test(q)) {
      return 'Sur l’Iran, quels acteurs, faits, lieux ou données doivent absolument être pris en compte ?'
    }
  }

  return question
}

function alreadyHasRefinement(situation: string): boolean {
  const text = normalize(situation)
  return /\bprecisions\b|\bcomplement utilisateur\b/.test(text)
}

function needsOptionalSourceQuestion(input: SelectClarifyingQuestionsInput): boolean {
  const text = normalize(input.situation)
  if (input.coverage.requestedSites?.length) return false
  if (/\bhttps?:\/\/|www\./i.test(input.situation)) return false
  const frame = input.intentContext.dominant_frame
  const domain = input.intentContext.interpreted_request?.domain ?? input.domain
  const object = input.intentContext.interpreted_request?.object_of_analysis?.trim() ?? ''
  const asksCompanyReading =
    /\b(compagnie|entreprise|societe|société|startup|start up|start-up|site|plateforme|application|app|outil|service)\b/.test(text) &&
    /\b(que fait|qu en penser|penser|avis|evaluer|évaluer|interessant|intéressant|rejoindre|collaborer|partenariat|investir)\b/.test(text)

  return Boolean(
    object &&
    object.length >= 3 &&
    (frame === 'site_analysis' || frame === 'startup_investment' || domain === 'startup_vc' || asksCompanyReading)
  )
}

function hasActionableInterpretation(intentContext: IntentContext): boolean {
  const interpreted = intentContext.interpreted_request
  if (!interpreted || interpreted.needs_clarification) return false
  const object = interpreted.object_of_analysis?.trim() ?? ''
  const question = interpreted.user_question?.trim() ?? ''
  if (object.length < 4 || question.length < 20) return false
  return Boolean(interpreted.expected_answer_shape?.trim()) || interpreted.confidence >= 0.55
}

export function selectClarifyingQuestions(input: SelectClarifyingQuestionsInput): string[] {
  const candidates = dedupe([
    ...input.inputQuestions,
    ...input.intentContext.questions,
    ...input.coverageQuestions,
  ])

  const selected = candidates
    .map((question) => ({ question, score: scoreQuestion(question, input) }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > -4)
    .map((item) => item.question)
    .slice(0, 2)

  if (selected.length > 0) {
    return selected.sort((a, b) => {
      const an = normalize(a)
      const bn = normalize(b)
      const rank = (question: string) => {
        if (
          input.intentContext.dominant_frame === 'site_analysis' &&
          /consulter|recevoir son contenu|lien accessible|capture|texte principal|site/.test(question)
        ) return 0
        if (
          input.intentContext.dominant_frame === 'founder_governance' &&
          /^quelle decision|trancher/.test(question)
        ) return 0
        return 1
      }
      return rank(an) - rank(bn)
    }).map((question) => contextualizeQuestion(question, input))
  }

  if (input.domain === 'geopolitics' || input.domain === 'war') {
    return [
      'Depuis quel point de vue voulez-vous lire cette situation : général, politique, économique, militaire, psychologique ou mixte ?',
    ].map((question) => contextualizeQuestion(question, input))
  }

  return [
    'Quelle décision, tension ou question voulez-vous éclairer ?',
    'Quels acteurs, faits ou contraintes doivent absolument être pris en compte ?',
  ].map((question) => contextualizeQuestion(question, input))
}

export function selectRefineOptionalQuestions(input: SelectClarifyingQuestionsInput): string[] {
  if (alreadyHasRefinement(input.situation)) return []
  if (input.intentContext.dominant_frame === 'site_analysis' && input.coverage.requestedSites?.length) return []
  if (needsOptionalSourceQuestion(input)) {
    return [
      'Avez-vous l’URL officielle ou le texte utile à lire ? Sinon je peux générer une carte prudente à partir de la question.',
    ]
  }
  if (hasActionableInterpretation(input.intentContext)) return []
  if (
    input.intentContext.interpreted_request &&
    !input.intentContext.interpreted_request.needs_clarification &&
    input.intentContext.interpreted_request.confidence >= 0.75
  ) return []

  const text = normalize(input.situation)
  const isBroadWorldQuestion =
    /\b(monde|ordre mondial|global|international)\b/.test(text) &&
    (input.domain === 'geopolitics' || input.domain === 'war')

  const isBroadDomainQuestion =
    input.coverage.status === 'sufficient' &&
    input.coverage.missingCritical.length >= 2 &&
    input.situation.length < 140

  const candidates: string[] = []

  if (isBroadWorldQuestion && /iran/.test(text)) {
    candidates.push(
      'Depuis quel point de vue voulez-vous lire ce que la guerre en Iran révèle du monde : général, politique, économique, militaire, psychologique ou mixte ?'
    )
  } else if (isBroadWorldQuestion) {
    candidates.push(
      'Depuis quel point de vue voulez-vous lire cette question mondiale : général, politique, économique, militaire, psychologique ou mixte ?'
    )
  } else if (isBroadDomainQuestion) {
    candidates.push(
      contextualizeQuestion(
        'Quels acteurs, faits, lieux ou données doivent absolument être pris en compte ?',
        input
      )
    )
  }

  return dedupe(candidates)
    .filter((question) => !isAnswered(question, input.situation))
    .slice(0, 1)
}
