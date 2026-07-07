import { NextRequest, NextResponse } from 'next/server'
import { POST as generatePublicCard } from '@/app/api/generate/route'
import { DIAMOND_REGRESSION_CASES } from '@/lib/governance/diamondRegressionCases'
import { validateRegressionCase } from '@/lib/governance/diamondRegressionRunner'
import { runReadinessRegressionCases } from '@/lib/governance/readinessRegressionCases'
import { runSourceQueryRegressionCases } from '@/lib/governance/sourceQueryRegressionCases'
import type { SituationCard } from '@/lib/resources/resourceContract'
import { shouldUseWeb } from '@/lib/resources/shouldUseWeb'

export const dynamic = 'force-dynamic'

type PublicGeneratePayload = {
  gate?: string
  sc?: SituationCard
  error?: string
  questions?: string[]
  quality_issues?: unknown[]
}

type PublicRegressionIssue = {
  level: 'info' | 'warning' | 'error'
  code: string
  message: string
  field?: string
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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function includesLoose(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle))
}

function resourcesCount(sc: SituationCard): number {
  return Array.isArray(sc.resources) ? sc.resources.length : 0
}

function writingContractText(sc: SituationCard): string {
  const writing = sc.writing_contract as Record<string, unknown> | undefined
  const situationCard = writing?.situation_card && typeof writing.situation_card === 'object'
    ? Object.values(writing.situation_card as Record<string, unknown>)
    : []
  const lecture = writing?.lecture && typeof writing.lecture === 'object'
    ? Object.values(writing.lecture as Record<string, unknown>)
    : []
  const approfondir = writing?.approfondir && typeof writing.approfondir === 'object'
    ? writing.approfondir as Record<string, unknown>
    : {}
  const sections = Array.isArray(approfondir.sections_fr)
    ? approfondir.sections_fr.flatMap((section) =>
        section && typeof section === 'object'
          ? Object.values(section as Record<string, unknown>)
          : [],
      )
    : []

  return [
    ...situationCard,
    ...lecture,
    approfondir.analysis_fr,
    ...sections,
  ].filter((value): value is string => typeof value === 'string').join('\n')
}

function publicWritingText(sc: SituationCard): string {
  return [
    sc.title_fr,
    sc.submitted_situation_fr,
    sc.insight_fr,
    sc.main_vulnerability_fr,
    sc.asymmetry_fr,
    sc.key_signal_fr,
    sc.lecture_systeme_fr,
    sc.approfondir_fr,
    writingContractText(sc),
  ].filter(Boolean).join('\n')
}

const APPROFONDIR_SHELL_LINES = [
  'ce que la situation est reellement',
  'ce qui tient',
  'ce qui tient le systeme',
  'ce qui s affaiblit',
  'ce qui l affaiblit',
  'ce qui pourrait escalader',
  'ce qui pourrait declencher une escalade',
  'ce qui pourrait changer',
  'ce qui pourrait changer de regime',
  'ce qui pourrait produire une bascule',
  'ce qu il faut surveiller',
]

function hasSubstantialApprofondir(sc: SituationCard): boolean {
  const text = normalizeText([
    sc.approfondir_fr,
    writingContractText(sc),
  ].filter(Boolean).join('\n'))
  const withoutShell = APPROFONDIR_SHELL_LINES.reduce(
    (current, shell) => current.replaceAll(shell, ' '),
    text,
  )
  const wordCount = withoutShell.split(/[^a-z0-9]+/).filter((word) => word.length > 2).length
  return wordCount >= 60
}

function caseRequiresPublicSources(testCase: { domain: string; input: string }): boolean {
  const input = testCase.input
  const hasUrl = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(input)
  const strategicSiteDecision = testCase.domain === 'startup_vc' &&
    /\.(?:fr|com|org|net)\b/i.test(input)
  const currentPublicSituation = testCase.domain === 'geopolitics' && shouldUseWeb(input)
  return hasUrl || strategicSiteDecision || currentPublicSituation
}

function validateEndToEndInvariants(
  sc: SituationCard,
  testCase: { id: string; domain: string; input: string },
): PublicRegressionIssue[] {
  const issues: PublicRegressionIssue[] = []
  const writingText = publicWritingText(sc)
  const count = resourcesCount(sc)
  const resourcesStatus = String(sc.resources_status ?? '')

  if (caseRequiresPublicSources(testCase)) {
    if (count === 0 || resourcesStatus === 'unavailable') {
      issues.push({
        level: 'error',
        code: 'e2e_required_sources_missing',
        message: `Case "${testCase.id}" requires public resources but generated ${count} source(s), status=${resourcesStatus || 'unknown'}.`,
        field: 'resources',
      })
    }
  }

  if (!hasSubstantialApprofondir(sc)) {
    issues.push({
      level: 'error',
      code: 'e2e_approfondir_shell_only',
      message: `Case "${testCase.id}" generated an empty or heading-only Approfondir.`,
      field: 'approfondir_fr',
    })
  }

  for (const forbidden of [
    'un acte, une preuve ou un seuil observable qui modifie les marges d action',
    'le passage entre signaux publics, decision assumee et seuil opposable',
    'lecture provisoire : la carte situe les seuils a verifier',
    'la situation tient tant que',
  ]) {
    if (includesLoose(writingText, forbidden)) {
      issues.push({
        level: 'error',
        code: 'e2e_generic_diamond_formula',
        message: `Case "${testCase.id}" still uses a generic diamond formula: ${forbidden}.`,
        field: 'writing',
      })
    }
  }

  if (includesLoose(writingText, 'Aucune source affichable')) {
    issues.push({
      level: 'error',
      code: 'e2e_no_displayable_source_leaked',
      message: `Case "${testCase.id}" leaked the no-source UI state into public writing.`,
      field: 'writing',
    })
  }

  return issues
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
  const requiredToken = process.env.SC_REGRESSIONS_TOKEN
  if (requiredToken && req.headers.get('x-sc-regressions-token') !== requiredToken) {
    return NextResponse.json(
      { ok: false, error: 'regressions_token_required' },
      { status: 401 },
    )
  }
  const input = await req.json().catch(() => ({})) as PublicRegressionInput
  const results = []

  for (const testCase of requestedCases(input)) {
    const caseStarted = Date.now()
    try {
      const generated = await runPublicGenerate(testCase.input)
      const payload = generated.payload

      if (generated.status >= 400 || payload.gate !== 'GENERATE' || !payload.sc) {
        const qualityIssues: PublicRegressionIssue[] = Array.isArray(payload.quality_issues)
          ? payload.quality_issues.filter((issue): issue is PublicRegressionIssue =>
              Boolean(issue) &&
              typeof issue === 'object' &&
              ['info', 'warning', 'error'].includes(String((issue as Record<string, unknown>).level)) &&
              typeof (issue as Record<string, unknown>).code === 'string' &&
              typeof (issue as Record<string, unknown>).message === 'string',
            )
          : []
        results.push({
          case_id: testCase.id,
          ok: false,
          domain: testCase.domain,
          gate: payload.gate ?? 'ERROR',
          duration_ms: Date.now() - caseStarted,
          issues: qualityIssues.length > 0
            ? qualityIssues
            : [{
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
      const invariantIssues = validateEndToEndInvariants(payload.sc, testCase)
      const issues = [...check.issues, ...invariantIssues]
      results.push({
        case_id: testCase.id,
        ok: !issues.some((issue) => issue.level === 'error'),
        domain: testCase.domain,
        gate: payload.gate,
        duration_ms: Date.now() - caseStarted,
        title_fr: payload.sc.title_fr,
        header_domain: payload.sc.coverage_check?.domain,
        resources_status: payload.sc.resources_status,
        resources_count: resourcesCount(payload.sc),
        issues,
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
  const readinessResults = runReadinessRegressionCases()
  const readinessFailed = readinessResults.filter((result) => !result.ok)
  const sourceQueryResults = runSourceQueryRegressionCases()
  const sourceQueryFailed = sourceQueryResults.filter((result) => !result.ok)
  const warnings = results.reduce(
    (total, result) => total + result.issues.filter((issue) => issue.level === 'warning').length,
    0,
  )

  return NextResponse.json({
    ok: failed.length === 0 && readinessFailed.length === 0 && sourceQueryFailed.length === 0,
    status: failed.length > 0 || readinessFailed.length > 0 || sourceQueryFailed.length > 0
      ? 'failed'
      : warnings > 0
      ? 'warning'
      : 'ok',
    total_cases: results.length,
    failed_cases: failed.length,
    readiness_total_cases: readinessResults.length,
    readiness_failed_cases: readinessFailed.length,
    source_query_total_cases: sourceQueryResults.length,
    source_query_failed_cases: sourceQueryFailed.length,
    warning_count: warnings,
    duration_ms: Date.now() - started,
    route_under_test: '/api/generate',
    readiness_results: readinessResults,
    source_query_results: sourceQueryResults,
    results,
  })
}
