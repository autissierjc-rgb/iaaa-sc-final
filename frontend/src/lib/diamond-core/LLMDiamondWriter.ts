import 'server-only'

import { parseModelJSON } from '../ai/json'
import type {
  DiamondSentence,
  QualityGateContract,
  SubstanceFormContract,
  TraceMeta,
  WritingContract,
} from '../contracts'
import { runQualityGate } from '../quality'
import type { DiamondDossier } from './DiamondDossier'
import { buildSCGrammarPrompt, type SCGrammarPrompt } from './SCGrammarPrompt'

export type LLMDiamondWriterStatus =
  | 'ok'
  | 'quality_failed'
  | 'model_unavailable'
  | 'request_failed'
  | 'parse_failed'

export type LLMDiamondWriterInput = {
  dossier: DiamondDossier
  model?: string
  temperature?: number
  timeout_ms?: number
  max_tokens?: number
}

export type LLMDiamondWriterResult = {
  status: LLMDiamondWriterStatus
  prompt: SCGrammarPrompt
  writing: WritingContract | null
  quality: QualityGateContract | null
  raw_text?: string
  model: string
  duration_ms: number
  errors: string[]
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const candidate = asString(value)
    if (candidate) return candidate
  }
  return ''
}

function normalizeDiamondSentence(value: unknown, fallbackText: string, fallbackRole: DiamondSentence['role']): DiamondSentence {
  const record = asRecord(value)
  const role = asString(record.role)
  const allowedRoles: DiamondSentence['role'][] = ['thesis', 'vulnerability', 'tipping_point', 'key_signal']
  return {
    text_fr: firstString(record.text_fr, record.text, record.sentence_fr, fallbackText),
    role: allowedRoles.includes(role as DiamondSentence['role']) ? role as DiamondSentence['role'] : fallbackRole,
    style: record.style === 'diamant_tranchant' ? 'diamant_tranchant' : 'diamond',
    must_be_public: typeof record.must_be_public === 'boolean' ? record.must_be_public : true,
  }
}

function normalizeDiamondSentences(value: unknown, situationCard: Record<string, unknown>, substanceForm: Record<string, unknown>): DiamondSentence[] {
  const rawItems = Array.isArray(value)
    ? value
    : isRecord(value)
      ? Object.values(value)
      : []
  const fromItems = rawItems
    .map((item, index) => normalizeDiamondSentence(
      item,
      '',
      index === 1 ? 'vulnerability' : index === 2 ? 'tipping_point' : index === 3 ? 'key_signal' : 'thesis',
    ))
    .filter((item) => item.text_fr)

  if (fromItems.length > 0) return fromItems

  const fromSubstance = normalizeDiamondSentence(
    substanceForm.diamond_sentence,
    '',
    'thesis',
  )
  if (fromSubstance.text_fr) return [fromSubstance]

  return [
    normalizeDiamondSentence({}, firstString(situationCard.insight_fr), 'thesis'),
    normalizeDiamondSentence({}, firstString(situationCard.main_vulnerability_fr), 'vulnerability'),
    normalizeDiamondSentence({}, firstString(situationCard.key_signal_fr), 'key_signal'),
  ].filter((item) => item.text_fr)
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean)
  }
  const single = asString(value)
  return single ? [single] : fallback
}

function normalizeSubstanceForm(
  value: unknown,
  diamondSentences: DiamondSentence[],
  situationCard: Record<string, unknown>,
): SubstanceFormContract {
  const record = asRecord(value)
  const diamondSentence = normalizeDiamondSentence(
    record.diamond_sentence,
    diamondSentences[0]?.text_fr || firstString(situationCard.insight_fr),
    diamondSentences[0]?.role || 'thesis',
  )
  return {
    substance_fr: normalizeStringArray(record.substance_fr, [
      firstString(situationCard.insight_fr),
      firstString(situationCard.main_vulnerability_fr),
    ].filter(Boolean)),
    form_fr: normalizeStringArray(record.form_fr, [
      'Lecture courte, située et orientée vers le signal observable.',
    ]),
    diamond_sentence: diamondSentence,
  }
}

function coerceWritingContractShape(value: Record<string, unknown>): Record<string, unknown> {
  const situationCard = asRecord(value.situation_card)
  const substanceForm = asRecord(value.substance_form)
  const diamondSentences = normalizeDiamondSentences(value.diamond_sentences, situationCard, substanceForm)
  const normalizedSubstanceForm = normalizeSubstanceForm(value.substance_form, diamondSentences, situationCard)

  return {
    ...value,
    substance_form: normalizedSubstanceForm,
    diamond_sentences: diamondSentences,
  }
}

function writingShapeIssues(value: Record<string, unknown>): string[] {
  const issues: string[] = []
  const situationCard = asRecord(value.situation_card)
  const lecture = asRecord(value.lecture)
  const approfondir = asRecord(value.approfondir)

  if (!isRecord(value.substance_form)) issues.push('substance_form')
  if (asArray(value.diamond_sentences).length === 0) issues.push('diamond_sentences')
  if (!isRecord(value.situation_card)) issues.push('situation_card')
  if (!asString(situationCard.insight_fr)) issues.push('situation_card.insight_fr')
  if (!asString(situationCard.main_vulnerability_fr)) issues.push('situation_card.main_vulnerability_fr')
  if (!asString(situationCard.key_signal_fr)) issues.push('situation_card.key_signal_fr')
  if (asArray(value.trajectories).length < 3) issues.push('trajectories')
  if (!isRecord(value.lecture)) issues.push('lecture')
  if (!asString(lecture.text_fr)) issues.push('lecture.text_fr')
  if (!isRecord(value.approfondir)) issues.push('approfondir')
  if (asArray(approfondir.sections_fr).length === 0) issues.push('approfondir.sections_fr')

  return issues
}

function traceFor({
  model,
  durationMs,
  status,
  notes,
}: {
  model: string
  durationMs: number
  status: TraceMeta['status']
  notes: string[]
}): TraceMeta {
  return {
    service: 'LLMDiamondWriter',
    version: 'v1',
    duration_ms: durationMs,
    model,
    status,
    notes,
  }
}

function normalizeWritingContract(value: Record<string, unknown>, model: string, durationMs: number): WritingContract {
  const writing = value as unknown as WritingContract
  return {
    ...writing,
    public_warnings: Array.isArray(writing.public_warnings) ? writing.public_warnings : [],
    trace: traceFor({
      model,
      durationMs,
      status: 'ok',
      notes: [
        ...(isRecord(value.trace) && Array.isArray(value.trace.notes) ? value.trace.notes.map(String) : []),
        'llm_diamond_writer=single_pass',
      ],
    }),
  }
}

function statusFromQuality(quality: QualityGateContract): LLMDiamondWriterStatus {
  return quality.ok ? 'ok' : 'quality_failed'
}

async function requestOpenAIWriting({
  prompt,
  model,
  temperature,
  timeoutMs,
  maxTokens,
}: {
  prompt: SCGrammarPrompt
  model: string
  temperature: number
  timeoutMs: number
  maxTokens: number
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: prompt.messages,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`OpenAI request failed: ${response.status} ${detail.slice(0, 160)}`)
    }

    const data = await response.json() as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI response did not contain message content')
    }
    return content
  } finally {
    clearTimeout(timeout)
  }
}

export async function runLLMDiamondWriter(input: LLMDiamondWriterInput): Promise<LLMDiamondWriterResult> {
  const started = Date.now()
  const prompt = buildSCGrammarPrompt(input.dossier)
  const model = input.model || process.env.OPENAI_DIAMOND_WRITER_MODEL || process.env.OPENAI_WRITING_MODEL || 'gpt-4o'
  const temperature = input.temperature ?? 0.25
  const timeoutMs = input.timeout_ms ?? 25000
  const maxTokens = input.max_tokens ?? 4500

  let rawText = ''
  try {
    rawText = await requestOpenAIWriting({
      prompt,
      model,
      temperature,
      timeoutMs,
      maxTokens,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      status: message.includes('OPENAI_API_KEY') ? 'model_unavailable' : 'request_failed',
      prompt,
      writing: null,
      quality: null,
      raw_text: rawText || undefined,
      model,
      duration_ms: Date.now() - started,
      errors: [message],
    }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = parseModelJSON(rawText)
  } catch (error) {
    return {
      status: 'parse_failed',
      prompt,
      writing: null,
      quality: null,
      raw_text: rawText,
      model,
      duration_ms: Date.now() - started,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }

  parsed = coerceWritingContractShape(parsed)
  const shapeIssues = writingShapeIssues(parsed)
  if (shapeIssues.length > 0) {
    return {
      status: 'parse_failed',
      prompt,
      writing: null,
      quality: null,
      raw_text: rawText,
      model,
      duration_ms: Date.now() - started,
      errors: [
        `Model JSON does not match required WritingContract shape: ${shapeIssues.join(', ')}`,
        `Top-level keys: ${Object.keys(parsed).join(', ') || 'none'}`,
      ],
    }
  }

  const writing = normalizeWritingContract(parsed, model, Date.now() - started)
  const quality = runQualityGate({
    interpretation: input.dossier.interpretation,
    theatre: input.dossier.theatre,
    scoring: input.dossier.scoring,
    writing,
    resources: input.dossier.resources.plan,
  })

  return {
    status: statusFromQuality(quality),
    prompt,
    writing,
    quality,
    raw_text: rawText,
    model,
    duration_ms: Date.now() - started,
    errors: quality.ok ? [] : quality.issues.filter((issue) => issue.level === 'error').map((issue) => issue.code),
  }
}
