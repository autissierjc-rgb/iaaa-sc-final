import { detectDomain } from '../coverage/detectDomain'
import { classifyUserMaterialResourceRole } from '../contracts/userMaterial'
import type { InterpretedRequest, QuestionType, RequestIntentType } from '../resources/resourceContract'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(text: string, patterns: Array<[RegExp, RequestIntentType, string]>): {
  intent: RequestIntentType
  signal: string
} | null {
  for (const [pattern, intent, signal] of patterns) {
    if (pattern.test(text)) return { intent, signal }
  }
  return null
}

function extractRequestedSite(input: string): string {
  const match = input.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i)?.[0]
  return match
    ? match
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/[),.;:!?]+$/g, '')
        .toLowerCase()
    : ''
}

function siteLabel(site: string): string {
  const root = site.split('/')[0]?.split('.')[0] ?? ''
  if (!root) return site
  return `${root.charAt(0).toUpperCase()}${root.slice(1)}`
}

function extractNamedSite(input: string): string {
  const text = normalize(input)
  const match =
    text.match(/\b(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d\s+)?([a-z0-9-]{3,})\b/i) ||
    text.match(/\b([a-z0-9-]{3,})\s+(?:site|page|plateforme|application|app|service|outil)\b/i)
  return match?.[1] ?? ''
}

function formalizePrefixedQuestion(input: string): string {
  const match = input.trim().match(/^([^:\n]{3,100})\s*:\s*(.{10,})$/)
  if (!match) return input

  const context = match[1]?.trim().replace(/[.;!?]+$/g, '')
  const question = match[2]?.trim()
  if (!context || !question || !/[?]\s*$/.test(question)) return input

  const normalizedContext = normalize(context)
  const normalizedQuestion = normalize(question)
  const contextRoot = normalizedContext.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[./\s]/)[0]
  if (contextRoot && normalizedQuestion.includes(contextRoot)) return question

  const stem = question.replace(/\s*\?\s*$/, '').trim()
  if (/\bd[eé]velopper\s+(?:la|une|sa|notre)\s+(?:communaut[eé]|audience)\b/i.test(stem)) {
    return `${stem} de ${context} ?`
  }

  return `${stem} pour ${context} ?`
}

function isSiteOrStartupEvaluation(input: string): boolean {
  const text = normalize(input)
  const hasSite = Boolean(extractRequestedSite(input) || extractNamedSite(input))
  if (!hasSite) return false
  const role = classifyUserMaterialResourceRole(input)
  if (role.role !== 'object_of_analysis') return false
  if (role.signals.includes('explicit object analysis request')) return true

  return /\b(startup|start-up|scaleup|scale-up|site|produit|saas|plateforme|marche|march[eé]|europe|europeen|europ[eé]en|potentiel|avis|penses tu|qu en penses tu|que penses tu|evaluation|evaluer|investissement|investir|positionnement|risque|traction)\b/.test(text)
}

function isExperienceExplanation(input: string): boolean {
  const text = normalize(input)
  return (
    /\b(comment|pourquoi)\s+(?:expliquer|comprendre|raconter|dire)\b.*\b(plaisir|attrait|fascination|gout|interet|sens|joie)\b/.test(text) ||
    /\b(plaisir|attrait|fascination|gout|interet|sens|joie)\s+(?:de|du|des|pour)\b/.test(text)
  )
}

function isCausalAttributionQuestion(input: string): boolean {
  const text = normalize(input)
    .replace(/\ba\s+a\s*t\s*il\b/g, 'a t il')
    .replace(/\ba\s+at\s*il\b/g, 'a t il')
    .replace(/\bat\s*il\b/g, 'a t il')
  return (
    /\b(a|ont|aurait|auraient|as|avons|avez)\s*(?:t\s*)?(?:il|elle|ils|elles|on)?\s*(entraine|entrainer|pousse|pousser|force|forcer|manipule|manipuler|provoque|provoquer|cause|causer|declenche|declencher|amene|amener)\b/.test(text) ||
    /\b(est ce que|est-ce que|es ce que|es-ce que).+\b(entraine|entrainer|pousse|pousser|force|forcer|manipule|manipuler|provoque|provoquer|cause|causer|declenche|declencher|amene|amener)\b/.test(text)
  )
}

function isWarSecurityQuestion(input: string): boolean {
  const text = normalize(input)
  return /\b(guerre|militaire|frappe|bombard|missile|cessez|cessez-le-feu|sanction|nucleaire|nucl[eé]aire|frontiere|frontière|otan|civils?|otage|attaque|riposte|escalade|dissuasion|iran|israel|gaza|ukraine|russie|chine|taiwan|syrie|liban|yemen|d[eé]troit|ormuz)\b/.test(text)
}

function extractObject(input: string): string {
  const text = input.trim().replace(/\s+/g, ' ')
  const normalized = normalize(text)
  const domain = detectDomain(text)
  const requestedSite = extractRequestedSite(text)
  const namedSite = extractNamedSite(text)

  if (requestedSite && isSiteOrStartupEvaluation(text)) {
    const scope = /\b(europe|europeen|europ[eé]en|march[eé]\s+europ)/i.test(text)
      ? ' pour le marché européen'
      : ''
    return `${siteLabel(requestedSite)}${scope}`
  }

  if (namedSite) return namedSite

  if (/pitchs?\s+decks?|pitch\s+decks?/i.test(text)) return 'le rôle des pitch decks'
  if (isExperienceExplanation(text)) {
    const match =
      text.match(/\b(?:plaisir|attrait|fascination|go[uû]t|int[eé]r[eê]t|sens|joie)\s+(?:de|du|des|pour)\s+([^?.,;]+)/i) ||
      text.match(/\b(?:expliquer|comprendre|raconter|dire)\s+(?:le|la|l’|l')?\s*(?:plaisir|attrait|fascination|go[uû]t|int[eé]r[eê]t|sens|joie)?\s*(?:de|du|des|pour)?\s*([^?.,;]+)/i)
    const object = match?.[1]?.trim()
    if (object && object.length > 4) return object
    return 'l’expérience évoquée'
  }
  if (/\bvc\b|venture capital|capital-risque/i.test(text)) return 'la logique de sélection des investisseurs'
  if (domain === 'war' || isWarSecurityQuestion(text)) return 'la trajectoire de la crise évoquée'

  const objectPatterns = [
    /\b(?:l'?interet|l'?intérêt|le role|le rôle|la place|l'?utilite|l'?utilité|pourquoi|comment se fait)\s+(?:des?|du|de la|de l'|d'|les?|la|le)?\s*([^?.,;]+)/i,
    /\b(?:dois je|devrais je|faut il|peut on|peut-on)\s+([^?.,;]+)/i,
    /\b(?:où|ou)\s+cela\s+va\s+(?:nous\s+)?mener\b/i,
  ]

  for (const pattern of objectPatterns) {
    const match = text.match(pattern)
    const object = match?.[1]?.trim()
    if (object && object.length > 5) return object
  }

  return text.length > 120 ? `${text.slice(0, 117).trim()}...` : text
}

function inferTension(input: string, intent: RequestIntentType): string {
  const text = normalize(input)
  const domain = detectDomain(input)

  if (isCausalAttributionQuestion(input)) {
    return 'la question porte sur une hypothèse causale : distinguer influence, entraînement, décision propre et preuves manquantes'
  }

  if (isExperienceExplanation(input)) {
    return 'ce qui paraît contradictoire de l’extérieur peut correspondre de l’intérieur à une expérience faite d’attention, de maîtrise, d’attente, de rituel et de relation au milieu'
  }

  if (isSiteOrStartupEvaluation(input)) {
    return 'la promesse visible du site doit être confrontée aux preuves de marché, d’usage, de différenciation et de passage à l’échelle'
  }

  if (/\bpitchs?\b|\bpitch\s+decks?\b/.test(text) && /\b(mvp|ia|ai|v1)\b/.test(text)) {
    return 'l’IA accélère la fabrication de prototypes, mais les investisseurs continuent à chercher une preuve de confiance, de récit, de marché et d’exécution'
  }

  if (/\bsite|\.com|\.fr|\.io|\.ai\b/.test(text)) {
    return 'le site ou le produit visible doit être relié à une preuve d’usage, de valeur et de crédibilité'
  }

  if (/\bex\b/.test(text) && /\b(cofondateur|co fondateur|associe|associer|startup)\b/.test(text)) {
    return 'une relation passée, une dette implicite et une décision de gouvernance future risquent de se mélanger'
  }

  if (/\bfils|fille|ado|adolescent|sport|tennis\b/.test(text)) {
    return 'un ancien enthousiasme peut cacher aujourd’hui une question d’autonomie, de regard parental ou de désir perdu'
  }

  if (domain === 'personal' || /\b(ami|amie|couple|ex|message|coeur|cœur|aime|relation|retrouv|rendez vous|rendez-vous)\b/.test(text)) {
    return 'un signe affectif peut être réel sans suffire à prouver une intention ; la suite des actes doit clarifier le lien'
  }

  if (/\bpitch|jury|anglais|presentation|présentation\b/.test(text)) {
    return 'l’épreuve publique révèle l’écart entre la clarté du message, la préparation et la capacité à tenir le regard'
  }

  if (domain === 'war' || isWarSecurityQuestion(input)) {
    return 'un événement local peut déplacer des seuils militaires, économiques, diplomatiques ou narratifs'
  }

  if (intent === 'understand') return 'la question demande de distinguer ce qui est établi, plausible et encore à vérifier'
  if (intent === 'decide') return 'la décision doit comparer les options par le signal observable qu elles peuvent produire ensuite'
  if (intent === 'evaluate') return 'la valeur apparente doit être confrontée aux preuves disponibles et aux risques d’exécution'
  if (intent === 'prepare') return 'la réussite dépend moins de l’intention que de la traduction en gestes, preuves et séquence'
  if (intent === 'predict') return 'la suite dépend des signaux observables qui rendront un seuil irréversible'
  if (intent === 'compare') return 'la comparaison révèle ce que chaque option rend possible, coûteux ou impossible'
  return 'la situation contient une tension que la formulation initiale ne suffit pas encore à trancher'
}

export function interpretRequest(input: string): InterpretedRequest {
  const text = input.trim()
  const normalized = normalize(text)
  const domain = detectDomain(text)
  const signals: string[] = []
  const resourceRole = classifyUserMaterialResourceRole(text)
  const forcedSiteEvaluation = isSiteOrStartupEvaluation(text)
  const causalAttribution = isCausalAttributionQuestion(text)

  const detected = causalAttribution
    ? { intent: 'diagnose' as RequestIntentType, signal: 'question causale/imputative' }
    : forcedSiteEvaluation
    ? { intent: 'evaluate' as RequestIntentType, signal: 'évaluation de site/startup' }
    : firstMatch(normalized, [
    [/\b(dois je|devrais je|faut il|accepter|refuser|choisir|trancher|decision|décision)\b/, 'decide', 'demande de décision'],
    [/\b(evaluer|évaluer|avis|penses tu|qu en penses tu|que penses tu|selectionne|sélectionné|selectionner|investissement|investir|potentiel|vaut il|vaut-il)\b/, 'evaluate', 'demande d’évaluation'],
    [/\b(preparer|préparer|pitcher|entrainer|entraîner|presentation|présentation|plan|comment faire|comment reagir|comment réagir|comment repondre|comment répondre)\b/, 'prepare', 'demande de préparation'],
    [/\b(que se passe|diagnostic|diagnostiquer|probleme|problème|cloche|comprendre ce qui se joue)\b/, 'diagnose', 'demande de diagnostic'],
    [/\b(ou cela va|où cela va|avenir|suite|trajectoire|va t il|va-t-il|risque d arriver|probable)\b/, 'predict', 'demande de trajectoire'],
    [/\b(comparer|difference|différence|plutot que|plutôt que|versus| vs )\b/, 'compare', 'demande de comparaison'],
    [/\b(quel est l interet|quel est l intérêt|a quoi sert|pourquoi|comment se fait|comprendre|explique|expliquer|role|rôle|place|ascendance)\b/, 'understand', 'demande de compréhension'],
  ])

  const intent = detected?.intent ?? 'understand'
  if (detected) signals.push(detected.signal)
  if (resourceRole.urls.length > 0) signals.push(`resource_role:${resourceRole.role}`)

  const object = extractObject(text)
  const tension = inferTension(text, intent)
  const userQuestion = formalizePrefixedQuestion(text)
  const questionType: QuestionType = causalAttribution
    ? 'causal_attribution'
    : forcedSiteEvaluation
    ? 'site_analysis'
    : intent === 'evaluate'
    ? 'evaluation'
    : intent === 'decide'
    ? 'decision'
    : intent === 'compare'
    ? 'comparison'
    : 'open_analysis'
  const needsClarification =
    text.length < 25 ||
    (intent === 'evaluate' && !forcedSiteEvaluation && !/\b(produit|traction|revenu|utilisateur|marche|marché|equipe|équipe|preuve)\b/.test(normalized)) ||
    (intent === 'decide' && !/\b(accepter|refuser|choisir|trancher|entre|ou|où|dois je|devrais je)\b/.test(normalized))

  return {
    intent_type: intent,
    question_type: questionType,
    object_of_analysis: object,
    user_question: userQuestion,
    implicit_tension: tension,
    expected_answer_shape: causalAttribution
      ? 'Répondre d’abord à l’hypothèse causale, puis distinguer ce qui est établi, plausible, non établi et les preuves nécessaires.'
      : undefined,
    primary_hypothesis: causalAttribution ? text : undefined,
    must_answer_first: causalAttribution ? true : undefined,
    missing_evidence_policy: causalAttribution
      ? 'Si les preuves manquent, dire précisément ce qui manque au lieu de dériver vers une analyse générale.'
      : undefined,
    domain,
    needs_clarification: needsClarification,
    confidence: detected ? 0.82 : 0.58,
    signals,
  }
}
