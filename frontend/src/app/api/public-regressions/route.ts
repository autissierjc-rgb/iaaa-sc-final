import { NextRequest, NextResponse } from 'next/server'
import { POST as generatePublicCard } from '@/app/api/generate/route'
import { DIAMOND_REGRESSION_CASES } from '@/lib/governance/diamondRegressionCases'
import { validateRegressionCase } from '@/lib/governance/diamondRegressionRunner'
import type { SituationCard } from '@/lib/resources/resourceContract'

export const dynamic = 'force-dynamic'

type PublicGeneratePayload = {
  gate?: string
  sc?: SituationCard
  error?: string
  questions?: string[]
  quality_issues?: unknown[]
}

type PublicRegressionInput = {
  case_ids?: string[]
  limit?: number
}

function requestedCases(input: PublicRegressionInput) {
  const requested = Array.isArray(input.case_ids) && input.case_ids.length > 0
    ? new Set(input.case_ids)
    : null
  const cases = requested
    ? DIAMOND_REGRESSION_CASES.filter((testCase) => requested.has(testCase.id))
    : DIAMOND_REGRESSION_CASES

  if (typeof input.limit === 'number' && input.limit > 0) {
    return cases.slice(0, input.limit)
  }
  return cases
}

async function runPublicGenerate(input: string): Promise<{
  status: number
  payload: PublicGeneratePayload
}> {
  const request = new NextRequest('http://public-regression.local/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      situation: input,
      original_situation: input,
      mode: 'public_fast',
      generate_prudently: true,
    }),
  })
  const response = await generatePublicCard(request)
  return {
    status: response.status,
    payload: await response.json(),
  }
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  const input = await req.json().catch(() => ({})) as PublicRegressionInput
  const results = []

  for (const testCase of requestedCases(input)) {
    const caseStarted = Date.now()
    try {
      const generated = await runPublicGenerate(testCase.input)
      const payload = generated.payload

      if (generated.status >= 400 || payload.gate !== 'GENERATE' || !payload.sc) {
        results.push({
          case_id: testCase.id,
          ok: false,
          domain: testCase.domain,
          gate: payload.gate ?? 'ERROR',
          duration_ms: Date.now() - caseStarted,
          issues: [{
            level: 'error',
            code: payload.error ?? 'public_generate_not_generated',
            message:
              payload.questions?.join(' | ') ||
              'The public /api/generate route did not produce a Situation Card.',
          }],
        })
        continue
      }

      const check = validateRegressionCase(payload.sc, testCase)
      results.push({
        case_id: testCase.id,
        ok: check.ok,
        domain: testCase.domain,
        gate: payload.gate,
        duration_ms: Date.now() - caseStarted,
        title_fr: payload.sc.title_fr,
        header_domain: payload.sc.coverage_check?.domain,
        issues: check.issues,
      })
    } catch (error) {
      results.push({
        case_id: testCase.id,
        ok: false,
        domain: testCase.domain,
        gate: 'ROUTE_ERROR',
        duration_ms: Date.now() - caseStarted,
        issues: [{
          level: 'error',
          code: 'public_regression_route_error',
          message: error instanceof Error ? error.message : 'Unknown public regression route error.',
        }],
      })
    }
  }

  const failed = results.filter((result) => !result.ok)
  const warnings = results.reduce(
    (total, result) => total + result.issues.filter((issue) => issue.level === 'warning').length,
    0,
  )

  return NextResponse.json({
    ok: failed.length === 0,
    status: failed.length > 0 ? 'failed' : warnings > 0 ? 'warning' : 'ok',
    total_cases: results.length,
    failed_cases: failed.length,
    warning_count: warnings,
    duration_ms: Date.now() - started,
    route_under_test: '/api/generate',
    results,
  })
}
