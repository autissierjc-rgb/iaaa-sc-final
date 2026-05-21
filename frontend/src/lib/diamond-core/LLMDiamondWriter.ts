import 'server-only'

import { parseModelJSON } from '../ai/json'
import type { QualityGateContract, TraceMeta, WritingContract } from '../contracts'
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

function hasRequiredWritingShape(value: Record<string, unknown>): boolean {
  const situationCard = asRecord(value.situation_card)
  const lecture = asRecord(value.lecture)
  const approfondir = asRecord(value.approfondir)
  return Boolean(
    isRecord(value.substance_form) &&
      asArray(value.diamond_sentences).length > 0 &&
      isRecord(value.situation_card) &&
      asString(situationCard.insight_fr) &&
      asString(situationCard.main_vulnerability_fr) &&
      asString(situationCard.key_signal_fr) &&
      asArray(value.trajectories).length >= 3 &&
      isRecord(value.lecture) &&
      asString(lecture.text_fr) &&
      isRecord(value.approfondir) &&
      asArray(approfondir.sections_fr).length > 0
  )
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

  if (!hasRequiredWritingShape(parsed)) {
    return {
      status: 'parse_failed',
      prompt,
      writing: null,
      quality: null,
      raw_text: rawText,
      model,
      duration_ms: Date.now() - started,
      errors: ['Model JSON does not match required WritingContract shape.'],
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
