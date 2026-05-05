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

export async function buildCanonicalSituationFromDialogue({
  rawSituation,
  originalSituation,
  dialogueEvents,
}: {
  rawSituation: string
  originalSituation?: string
  dialogueEvents: unknown
}): Promise<CanonicalDialogue | null> {
  const events = normalizeEvents(dialogueEvents)
  if (events.length === 0) return null

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_INTENT_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You canonicalize a Situation Card chat before any generation.

Return ONLY JSON:
{
  "canonical_situation": "faithful formalized user question in the user's language",
  "header_subject": "3+ meaningful words, no domain label",
  "can_generate": true,
  "next_question": ""
}

Rules:
- Use the dialogue events, not a concatenated raw prompt.
- If the user confirms a clarification hypothesis, apply the confirmed meaning.
- If the user corrects a referent, replace the ambiguous referent with the correction.
- canonical_situation must preserve the user's intention, actors, facts, relations, requested action and useful context.
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
    const canonical = normalizeSubmittedSituation(asText(parsed.canonical_situation))
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
