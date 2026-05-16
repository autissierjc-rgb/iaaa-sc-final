import { NextResponse, type NextRequest } from 'next/server'
import { DIAMOND_REGRESSION_CASES } from '@/lib/governance/diamondRegressionCases'
import { validateRegressionCase } from '@/lib/governance/diamondRegressionRunner'
import type { SituationCard } from '@/lib/resources/resourceContract'

export const dynamic = 'force-dynamic'

const CASE_TIMEOUT_MS = 15000

type GenerateV2Payload = {
  ok?: boolean
  error?: string
  message?: string
  interpretation?: {
    header_domain?: string
    header_subject?: string
    situation_soumise?: string
  }
  writing?: {
    situation_card?: Record<string, unknown>
    lecture?: {
      text_fr?: string
      text_en?: string
    }
    approfondir?: {
      analysis_fr?: string
    }
    trajectories?: unknown[]
  }
  scoring?: {
    astrolabe?: Array<{
      branch?: string
      name_fr?: string
      score?: number
      is_primary?: boolean
    }>
    state_index_final?: number
    state_label?: string
  }
  expertises?: {
    domain_playbook?: {
      id?: string
    }
  }
  total_duration_ms?: number
}

async function fetchWithTimeout(url: URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function cardFromGenerateV2(payload: GenerateV2Payload): SituationCard {
  const writingCard = payload.writing?.situation_card ?? {}
  const astrolabe = payload.scoring?.astrolabe ?? []

  return {
    ...writingCard,
    title_fr: String(writingCard.title_fr ?? payload.interpretation?.header_subject ?? ''),
    submitted_situation_fr: String(
      writingCard.submitted_situation_fr ??
      payload.interpretation?.situation_soumise ??
      ''
    ),
    lecture_systeme_fr: payload.writing?.lecture?.text_fr ?? '',
    approfondir_fr: payload.writing?.approfondir?.analysis_fr ?? '',
    trajectories: payload.writing?.trajectories ?? [],
    state_index_final: payload.scoring?.state_index_final ?? 0,
    state_label: payload.scoring?.state_label ?? '',
    astrolabe_scores: astrolabe.map((branch) => ({
      branch: branch.branch,
      name: branch.name_fr,
      display_score: branch.score,
      is_primary: branch.is_primary,
    })),
  } as SituationCard
}

export async function POST(request: NextRequest) {
  const started = Date.now()
  const origin = request.nextUrl.origin
  const results = []

  for (const testCase of DIAMOND_REGRESSION_CASES) {
    try {
      const response = await fetchWithTimeout(new URL('/api/generate-v2', origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: testCase.input,
          mode: 'public_fast',
        }),
      }, CASE_TIMEOUT_MS)
      const payload = await response.json() as GenerateV2Payload

      if (!response.ok || !payload.ok) {
        results.push({
          case_id: testCase.id,
          ok: false,
          domain: testCase.domain,
          playbook: payload.expertises?.domain_playbook?.id ?? 'not_generated',
          duration_ms: payload.total_duration_ms ?? 0,
          issues: [{
            level: 'error',
            code: payload.error ?? 'generate_v2_failed',
            message: payload.message ?? 'generate-v2 did not produce a valid response.',
          }],
        })
        continue
      }

      const check = validateRegressionCase(cardFromGenerateV2(payload), testCase)
      results.push({
        case_id: testCase.id,
        ok: check.ok,
        domain: testCase.domain,
        playbook: payload.expertises?.domain_playbook?.id ?? 'unknown',
        duration_ms: payload.total_duration_ms ?? 0,
        issues: check.issues,
      })
    } catch (error) {
      results.push({
        case_id: testCase.id,
        ok: false,
        domain: testCase.domain,
        playbook: 'route_error',
        duration_ms: CASE_TIMEOUT_MS,
        issues: [{
          level: 'error',
          code: error instanceof Error && error.name === 'AbortError'
            ? 'diamond_regression_timeout'
            : 'diamond_regression_route_error',
          message: error instanceof Error && error.name === 'AbortError'
            ? `Regression case exceeded ${CASE_TIMEOUT_MS} ms.`
            : error instanceof Error ? error.message : 'Unknown regression route error.',
        }],
      })
    }
  }

  const failed = results.filter((result) => !result.ok)
  const warnings = results.reduce(
    (total, result) => total + result.issues.filter((issue) => issue.level === 'warning').length,
    0
  )

  return NextResponse.json({
    ok: failed.length === 0,
    status: failed.length > 0 ? 'failed' : warnings > 0 ? 'warning' : 'ok',
    total_cases: results.length,
    failed_cases: failed.length,
    warning_count: warnings,
    duration_ms: Date.now() - started,
    results,
  })
}
