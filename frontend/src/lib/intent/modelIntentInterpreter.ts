import { parseModelJSON } from '../ai/json'
import { detectDomain } from '../coverage/detectDomain'
import type { InterpretedRequest, QuestionType, RequestIntentType, SituationDomain } from '../resources/resourceContract'
import { interpretRequest } from './interpretRequest'

const INTENT_TYPES: RequestIntentType[] = [
  'understand',
  'decide',
  'evaluate',
  'prepare',
  'diagnose',
  'predict',
  'compare',
]

const DOMAINS: SituationDomain[] = [
  'geopolitics',
  'war',
  'management',
  'personal',
  'professional',
  'governance',
  'startup_vc',
  'economy',
  'humanitarian',
  'general',
]

const QUESTION_TYPES: QuestionType[] = [
  'open_analysis',
  'causal_attribution',
  'site_analysis',
  'evaluation',
  'decision',
  'inquiry',
  'comparison',
]

const SYSTEM_PROMPT = `You are the intent interpreter for Situation Card.

Your job is not to answer the user. Your job is to understand what the user is really asking before any analysis is generated.

Return ONLY valid JSON with this shape:
{
  "intent_type": "understand | decide | evaluate | prepare | diagnose | predict | compare",
  "question_type": "open_analysis | causal_attribution | site_analysis | evaluation | decision | inquiry | comparison",
  "object_of_analysis": "the precise object the user wants analyzed",
  "user_question": "faithful formalized user question in the user's language",
  "implicit_tension": "the hidden tension that makes the question useful",
  "expected_answer_shape": "how the Situation Card must answer",
  "primary_hypothesis": "if the question tests a hypothesis, state it; otherwise empty",
  "confirmation_hypothesis": "if you probably understand the user's intended meaning but a central element remains ambiguous, state one concise hypothesis to ask the user to confirm in their language; otherwise empty",
  "must_answer_first": false,
  "missing_evidence_policy": "what to do if proof is missing",
  "entity_explanations": [{"label":"proper noun or acronym from the user question","explanation":"short contextual explanation in French, or 'à expliciter' if uncertain","certainty":"known | inferred | unknown"}],
  "domain": "geopolitics | war | management | personal | professional | governance | startup_vc | economy | humanitarian | general",
  "needs_clarification": false,
  "confidence": 0.0,
  "signals": ["short evidence for the interpretation"]
}

Rules:
- Interpret like a high-quality assistant: infer intent from wording, context, object, and requested action.
- user_question must be the canonical Situation soumise candidate: correct spelling, punctuation, accents, and obvious high-confidence proper-name typos from context, while preserving the user's actors, facts, relations, intention, and requested action. If a name is uncertain, keep it and mark it uncertain in entity_explanations.
- If the intended meaning is probable but not safe enough to generate from, do not leave the clarification generic. Fill confirmation_hypothesis with a natural one-sentence hypothesis the user can confirm. This can concern a referent, a typo, an implicit intention, a causal hypothesis, a desired angle, or the meaning of a follow-up.
- Use world knowledge and the surrounding context to propose likely referents when a central word appears misspelled, abbreviated, implicit, or incomplete. Do not silently correct it in user_question when confidence is not high enough; keep the original there, mark the entity unknown, and put the likely interpretation in confirmation_hypothesis.
- Avoid blind questions such as "who or what do you mean?" when you can propose a plausible reading. Prefer "Vous voulez dire/parler de ... ?" or "Vous cherchez à comprendre si ... ?" in the user's language.
- Never let domain vocabulary override intent. A startup question can be "understand"; a personal question can be "decide"; a website question can be "evaluate".
- If the user asks "comment faire", classify as prepare unless they are asking how a mechanism works, then classify as understand.
- If the user asks how to react/respond in a family, personal, team, or conflict situation, classify as prepare and keep the relevant human domain.
- If the user asks "qu'en penses-tu", "potentiel", "vaut-il", or "avis", classify as evaluate.
- If the user asks "pourquoi", "à quoi sert", "quel rôle", "comprendre", classify as understand.
- If the user asks whether A caused, pushed, dragged, trained, manipulated, triggered, or led B into X, set question_type to "causal_attribution", intent_type to "diagnose", must_answer_first to true, and expected_answer_shape to "answer the causal hypothesis first, then separate established / plausible / not established / missing proof".
- For every important proper noun and acronym in the user question, add one entity_explanations item. Explain from context when safe. If uncertain, do not invent: use "nom propre à identifier" or "acronyme à expliciter". If the surrounding context strongly suggests a likely correction, keep the original label, set certainty to "unknown", and write the explanation as "correction possible: [suggestion]".
- Ask for clarification only if the object or desired action is genuinely missing.
- Keep object_of_analysis concrete and short.
- Never use generic placeholders such as "la trajectoire de la crise évoquée", "l'objet de la question", or "la situation". Name the actual object from the user text.
- Do not classify a political/electoral question as a military crisis unless the user mentions war, attack, armed conflict, strikes, sanctions, nuclear, army, borders, hostages, or a named war theatre.`

function isGenericImportedInterpretation(value: string): boolean {
  return /trajectoire de la crise|crise [ée]voqu[ée]e|objet de la question|objet visible garde un r[oô]le|rapports de confiance, de preuve et de pouvoir|un [ée]v[ée]nement local peut d[ée]placer des seuils militaires/i.test(value)
}

function hasSiteSignal(input: string): boolean {
  return (
    /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(input) ||
    /\b(site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?[a-z0-9-]{3,}\b/i.test(input) ||
    /\b[a-z0-9-]{3,}\s+(?:site|page|plateforme|application|app|service|outil)\b/i.test(input)
  )
}

function asIntentType(value: unknown, fallback: RequestIntentType): RequestIntentType {
  return INTENT_TYPES.includes(value as RequestIntentType) ? value as RequestIntentType : fallback
}

function asDomain(value: unknown, fallback: SituationDomain): SituationDomain {
  return DOMAINS.includes(value as SituationDomain) ? value as SituationDomain : fallback
}

function asQuestionType(value: unknown, fallback: QuestionType | undefined): QuestionType {
  return QUESTION_TYPES.includes(value as QuestionType) ? value as QuestionType : fallback ?? 'open_analysis'
}

function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asConfidence(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(1, numeric))
}

function asSignals(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const signals = value
    .map((item) => typeof item === 'string' ? item.trim() : '')
    .filter(Boolean)
    .slice(0, 6)
  return signals.length > 0 ? signals : fallback
}

function asEntityExplanations(value: unknown, fallback: InterpretedRequest['entity_explanations']): InterpretedRequest['entity_explanations'] {
  if (!Array.isArray(value)) return fallback
  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const label = asText(record.label, '')
      const explanation = asText(record.explanation, '')
      if (!label || !explanation) return null
      const certainty = ['known', 'inferred', 'unknown'].includes(String(record.certainty))
        ? String(record.certainty) as 'known' | 'inferred' | 'unknown'
        : undefined
      return { label, explanation, certainty }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 10)
  return items.length > 0 ? items : fallback
}

function hasUnknownEntity(entities: InterpretedRequest['entity_explanations']): boolean {
  return Boolean(entities?.some((entity) => {
    const explanation = `${entity.explanation || ''} ${entity.certainty || ''}`
    return entity.certainty === 'unknown' || /\b(a|à)\s+(identifier|expliciter)\b/i.test(explanation)
  }))
}

async function inferConfirmationHypothesis({
  input,
  interpreted,
  apiKey,
}: {
  input: string
  interpreted: InterpretedRequest
  apiKey: string
}): Promise<string> {
  if (!hasUnknownEntity(interpreted.entity_explanations)) return ''

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

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
            content:
              'You propose one intelligent clarification hypothesis for a Situation Card chat. Do not answer the situation. Unknown central entities may be typos, abbreviations, incomplete references, implicit referents, or unclear angles. First test whether each unknown entity likely points to a known public referent from the surrounding context. If yes, name that likely referent in the hypothesis. If not, propose the likely intended meaning or angle. Write a short direct clause, with no hedging and no explanation. In French, prefer starting with "vous..." such as "vous parlez de..." or "vous voulez comprendre si...". If no useful hypothesis is possible, return an empty string. Return only JSON: {"confirmation_hypothesis": ""}.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              user_input: input,
              interpreted_request: interpreted,
              unknown_entities: interpreted.entity_explanations?.filter((entity) => entity.certainty === 'unknown') ?? [],
            }),
          },
        ],
      }),
    })

    if (!response.ok) return ''
    const data = await response.json()
    const raw = data?.choices?.[0]?.message?.content
    if (typeof raw !== 'string') return ''
    const parsed = parseModelJSON(raw)
    return asText(parsed.confirmation_hypothesis, '').slice(0, 220)
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

export async function interpretRequestWithModel(input: string): Promise<InterpretedRequest> {
  const fallback = interpretRequest(input)
  if (fallback.question_type === 'causal_attribution' || fallback.must_answer_first) return fallback
  if (fallback.signals.includes('évaluation de site/startup') || hasSiteSignal(input)) return fallback

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return fallback

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

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
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              user_input: input,
              heuristic_hint: fallback,
              detected_domain_hint: detectDomain(input),
            }),
          },
        ],
      }),
    })

    if (!response.ok) return fallback

    const data = await response.json()
    const raw = data?.choices?.[0]?.message?.content
    if (typeof raw !== 'string') return fallback

    const parsed = parseModelJSON(raw)
    const intentType = asIntentType(parsed.intent_type, fallback.intent_type)
    const domain = asDomain(parsed.domain, fallback.domain)
    const userQuestion = asText(parsed.user_question, input.trim())

    const parsedObject = asText(parsed.object_of_analysis, fallback.object_of_analysis)
    const parsedTension = asText(parsed.implicit_tension, fallback.implicit_tension)

    const entityExplanations = asEntityExplanations(parsed.entity_explanations, fallback.entity_explanations)
    const interpreted: InterpretedRequest = {
      intent_type: intentType,
      question_type: asQuestionType(parsed.question_type, fallback.question_type),
      object_of_analysis: isGenericImportedInterpretation(parsedObject)
        ? fallback.object_of_analysis || userQuestion
        : parsedObject,
      user_question: userQuestion,
      implicit_tension: isGenericImportedInterpretation(parsedTension)
        ? fallback.implicit_tension
        : parsedTension,
      expected_answer_shape: asText(parsed.expected_answer_shape, fallback.expected_answer_shape ?? ''),
      primary_hypothesis: asText(parsed.primary_hypothesis, fallback.primary_hypothesis ?? ''),
      confirmation_hypothesis: asText(parsed.confirmation_hypothesis, fallback.confirmation_hypothesis ?? ''),
      must_answer_first: asBoolean(parsed.must_answer_first, Boolean(fallback.must_answer_first)),
      missing_evidence_policy: asText(parsed.missing_evidence_policy, fallback.missing_evidence_policy ?? ''),
      entity_explanations: entityExplanations,
      domain,
      needs_clarification: asBoolean(parsed.needs_clarification, fallback.needs_clarification),
      confidence: asConfidence(parsed.confidence, Math.max(fallback.confidence, 0.7)),
      signals: [
        ...asSignals(parsed.signals, fallback.signals),
        'interprétation LLM',
      ],
    }

    if (!interpreted.confirmation_hypothesis && hasUnknownEntity(interpreted.entity_explanations)) {
      const confirmation = await inferConfirmationHypothesis({ input, interpreted, apiKey })
      if (confirmation) {
        return {
          ...interpreted,
          confirmation_hypothesis: confirmation,
          signals: [...interpreted.signals, 'hypothèse de confirmation LLM'],
        }
      }
    }

    return interpreted
  } catch {
    return fallback
  } finally {
    clearTimeout(timeout)
  }
}
