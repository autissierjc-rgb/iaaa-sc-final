import { parseModelJSON } from '../ai/json'
import { normalizeSubmittedSituation } from '../text/normalizeSubmittedSituation'

export type DialogueEvent = {
  type:
    | 'user_initial_question'
    | 'system_clarification_question'
    | 'user_confirmation'
    | 'user_correction'
    | 'user_extra_context'
  text: string
}

export type CanonicalDialogue = {
  canonical_situation: string
  header_subject?: string
  can_generate?: boolean
  next_question?: string
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEvents(value: unknown): DialogueEvent[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const type = asText(record.type) as DialogueEvent['type']
      const text = asText(record.text)
      if (!type || !text) return null
      if (![
        'user_initial_question',
        'system_clarification_question',
        'user_confirmation',
        'user_correction',
        'user_extra_context',
      ].includes(type)) return null
      return { type, text }
    })
    .filter((item): item is DialogueEvent => Boolean(item))
    .slice(0, 12)
}

function stripDialogueScaffolding(value: string): string {
  return value
    .replace(/\bPr[eé]cisions?\s*:\s*/gi, ' ')
    .replace(/\bVous [eé]voquez plusieurs options, mais elles ne sont pas encore nomm[eé]es\.\s*Quelles sont les 2 ou 3 options [aà] comparer, ou dois-je d[’']abord proposer une carte exploratoire pour les faire [eé]merger\s*\?/gi, ' ')
    .replace(/\bQuelle question voulez-vous vraiment [eé]clairer avec cette carte\s*\?/gi, ' ')
    .replace(/\bFaut-il traiter cette situation comme une d[eé]cision, un risque, un conflit, une opportunit[eé] ou une demande de compr[eé]hension\s*\?/gi, ' ')
    .replace(/\bLe point le plus utile [aà] pr[eé]ciser maintenant est\s*:\s*[^.?!]+[.?!]?/gi, ' ')
    .replace(/\bR[eé]pondez librement,\s*ou g[eé]n[eé]rez une carte exploratoire\.?/gi, ' ')
    .replace(/\bG[eé]n[eé]rer une carte exploratoire\b/gi, ' ')
    .replace(/\bPour analyser votre situation\s*:\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function removeRepeatedBase(addition: string, base: string): string {
  const normalizedAddition = addition.trim()
  const normalizedBase = base.trim()
  if (!normalizedAddition || !normalizedBase) return normalizedAddition

  if (normalizedAddition.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
    return normalizedAddition.slice(normalizedBase.length).trim()
  }

  return normalizedAddition
}

function normalizeForIntent(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function pointsToExternalMaterial(value: string): boolean {
  const text = normalizeForIntent(value)
  const pointer =
    /\b(c est|elles|ils|tout|les options|les cibles|les infos|les details|la matiere|la source)\b.*\b(sur|dans|via)\b/.test(text) ||
    /\b(sur|dans|via)\b.*\b(le|la|les|mon|ma|mes|ce|cette)\b/.test(text) ||
    /\b(voir|regarde|consulte)\b/.test(text)
  const material =
    /\b(site|page|document|doc|pdf|fichier|dossier|source|url|lien|plug|presentation|drive|notion|serveur|carte|crte)\b/.test(text)

  return pointer && material
}

function looksLikeShortDialogueAnswer(value: string): boolean {
  const raw = value.trim()
  const text = normalizeForIntent(raw)
  if (!text) return false
  if (/[?]/.test(raw)) return false
  if (/^(oui|yes|ok|exact|exactement|non|no|plutot|plutôt)\b/.test(text)) return true

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length > 7) return false

  const hasQuestionShape =
    /\b(comment|pourquoi|quelle|quelles|quel|quels|dois|devons|faut|choisir|prioriser|analyser|comprendre|decider|developper)\b/.test(text)
  if (hasQuestionShape) return false

  return true
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shortDialogueAnswers(events: DialogueEvent[]): string[] {
  const hasDialogue = events.some((event) => event.type === 'system_clarification_question') || events.length > 1
  if (!hasDialogue) return []

  return events
    .filter((event) =>
      event.type === 'user_confirmation' ||
      event.type === 'user_correction' ||
      event.type === 'user_extra_context'
    )
    .map((event) => stripDialogueScaffolding(event.text))
    .map((item) => item.trim())
    .filter((item) => item && looksLikeShortDialogueAnswer(item))
}

function stripShortDialogueAnswersFromCanonical(canonical: string, events: DialogueEvent[]): string {
  let clean = canonical.trim()
  for (const answer of shortDialogueAnswers(events)) {
    const escaped = escapeRegExp(answer)
    clean = clean
      .replace(new RegExp(`\\s+(?:pour|avec|sur|selon|en|via)\\s+${escaped}\\s*([?.!]?)$`, 'i'), '$1')
      .replace(new RegExp(`\\s+${escaped}\\s*([?.!]?)$`, 'i'), '$1')
      .replace(/\s+([?.!])$/g, '$1')
      .trim()
  }
  return clean
}

export function buildLocalCanonicalSituationFromDialogue({
  rawSituation,
  originalSituation,
  dialogueEvents,
}: {
  rawSituation: string
  originalSituation?: string
  dialogueEvents: unknown
}): CanonicalDialogue | null {
  const events = normalizeEvents(dialogueEvents)
  const initial = events.find((event) => event.type === 'user_initial_question')?.text ||
    asText(originalSituation) ||
    asText(rawSituation)
  if (!initial) return null

  const userMaterial = events
    .filter((event) =>
      event.type === 'user_confirmation' ||
      event.type === 'user_correction' ||
      event.type === 'user_extra_context'
    )
    .map((event) => stripDialogueScaffolding(event.text))
    .filter(Boolean)

  const base = stripDialogueScaffolding(initial)
  const hasSystemDialogue = events.some((event) => event.type === 'system_clarification_question') || events.length > 1
  const additions = userMaterial
    .map((item) => removeRepeatedBase(item, base))
    .filter((item) => !pointsToExternalMaterial(item))
    .filter((item) => !(hasSystemDialogue && looksLikeShortDialogueAnswer(item)))
    .filter((item) => item && !base.toLowerCase().includes(item.toLowerCase()))
  const canonical = normalizeSubmittedSituation(stripShortDialogueAnswersFromCanonical(
    [base, ...additions].filter(Boolean).join(' '),
    events
  ))
  if (!canonical) return null

  return {
    canonical_situation: canonical,
    can_generate: true,
  }
}

export async function buildCanonicalSituationFromDialogue({
  rawSituation,
  originalSituation,
  dialogueEvents,
}: {
  rawSituation: string
  originalSituation?: string
  dialogueEvents: unknown
}): Promise<CanonicalDialogue | null> {
  let events = normalizeEvents(dialogueEvents)
  if (events.length === 0) {
    const firstText = asText(originalSituation) || asText(rawSituation)
    if (firstText) {
      events = [{ type: 'user_initial_question', text: firstText }]
    }
  }
  if (events.length === 0) return null

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_CANONICAL_MODEL || process.env.OPENAI_INTENT_MODEL || 'gpt-4o',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You canonicalize a Situation Card chat before any generation.

Return ONLY JSON:
{
  "canonical_situation": "faithful formalized user question in the user's language",
  "header_subject": "polished subject phrase, 3+ meaningful words, no domain label",
  "can_generate": true,
  "next_question": ""
}

Rules:
- Use the dialogue events, not a concatenated raw prompt.
- You are the only authority for understanding and formalizing the user's intended question before SC generation.
- If there is only one user_initial_question, still rewrite it as a clean, natural question in the user's language when the intended meaning is clear.
- canonical_situation must not preserve obvious spelling, agreement, conjugation or punctuation errors when the intended question is clear.
- If the user confirms a clarification hypothesis, apply the confirmed meaning.
- If the user corrects a referent, replace the ambiguous referent with the correction.
- If a user answer only points to material elsewhere, such as "it is on the site", "it is in the document", or "the targets are on the card", treat it as dialogue context or missing material, not as the canonical_situation itself.
- If a user answer to a clarification is a short criterion, constraint, signal or noun phrase such as "un abonnement", "DSI", "usage réel", "clients payants", or "la traction", use it as context for treatment, but do not append it to canonical_situation and do not add it at the end of canonical_situation.
- canonical_situation must preserve the user's intention, actors, facts, relations, requested action and useful context.
- header_subject must be only the subject, never the domain label, and must contain at least 3 meaningful words.
- header_subject must be a clean noun phrase, not a copied fragment of the user's rough spelling or grammar.
- For example, turn "trump peuvent ils conteste les resultat des election des midterm" into canonical_situation "Donald Trump peut-il contester les résultats des élections de mi-mandat ?" and header_subject "contestation résultats élections mi-mandat".
- If a URL is the explicit object to analyze or the evidence source, preserve it in canonical_situation.
- If a URL names the user's project context, keep the question clean and use the site as context rather than copying the URL into canonical_situation.
- A user-provided URL is usable context, not a reason to ask a clarification by itself.
- Do not keep clarification scaffolding such as "Précisions", "C'est bien cela", or the system question.
- Do not invent facts. If still unclear, set can_generate=false and give one next_question.`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              raw_situation: rawSituation,
              original_situation: originalSituation || '',
              dialogue_events: events,
            }),
          },
        ],
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    const raw = data?.choices?.[0]?.message?.content
    if (typeof raw !== 'string') return null

    const parsed = parseModelJSON(raw)
    const canonical = normalizeSubmittedSituation(stripShortDialogueAnswersFromCanonical(
      asText(parsed.canonical_situation),
      events
    ))
    if (!canonical) return null

    return {
      canonical_situation: canonical,
      header_subject: asText(parsed.header_subject),
      can_generate: typeof parsed.can_generate === 'boolean' ? parsed.can_generate : true,
      next_question: asText(parsed.next_question),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
