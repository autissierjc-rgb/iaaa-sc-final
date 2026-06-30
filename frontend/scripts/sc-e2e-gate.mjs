const DEFAULT_BASE_URL = 'http://localhost:3000'

function argValue(name) {
  const prefix = `--${name}=`
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix))
  return found ? found.slice(prefix.length) : undefined
}

function parseCaseIds() {
  const raw = argValue('case-ids') || process.env.SC_E2E_CASE_IDS || ''
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseLimit() {
  const raw = argValue('limit') || process.env.SC_E2E_LIMIT || ''
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function issuesFor(section) {
  if (!Array.isArray(section)) return []
  return section.filter((item) => item && item.ok === false)
}

function printFailureGroup(title, failures) {
  if (failures.length === 0) return
  console.error(`\n${title}`)
  for (const failure of failures) {
    const id = failure.case_id || failure.id || 'unknown'
    const issues = Array.isArray(failure.issues) ? failure.issues : []
    console.error(`- ${id}`)
    for (const issue of issues.slice(0, 6)) {
      console.error(`  [${issue.level || 'error'}] ${issue.code || 'issue'}: ${issue.message || ''}`)
    }
    if (issues.length > 6) console.error(`  ... ${issues.length - 6} more issue(s)`)
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(argValue('base-url') || process.env.SC_E2E_BASE_URL)
  const url = `${baseUrl}/api/public-regressions`
  const body = {}
  const caseIds = parseCaseIds()
  const limit = parseLimit()
  if (caseIds.length > 0) body.case_ids = caseIds
  if (limit) body.limit = limit

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.SC_E2E_TIMEOUT_MS || 600000))

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeout)
    console.error(`SC e2e gate could not reach ${url}`)
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  clearTimeout(timeout)

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload) {
    console.error(`SC e2e gate failed: HTTP ${response.status}`)
    process.exit(1)
  }

  const routeFailures = issuesFor(payload.results)
  const readinessFailures = issuesFor(payload.readiness_results)
  const sourceFailures = issuesFor(payload.source_query_results)

  console.log(`SC e2e gate: ${payload.status}`)
  console.log(`Public route: ${payload.total_cases || 0} case(s), ${payload.failed_cases || 0} failed`)
  console.log(`Readiness: ${payload.readiness_total_cases || 0} case(s), ${payload.readiness_failed_cases || 0} failed`)
  console.log(`Sources: ${payload.source_query_total_cases || 0} case(s), ${payload.source_query_failed_cases || 0} failed`)
  console.log(`Duration: ${payload.duration_ms || 0} ms`)

  printFailureGroup('Public route failures', routeFailures)
  printFailureGroup('Readiness failures', readinessFailures)
  printFailureGroup('Source query failures', sourceFailures)

  if (!payload.ok || routeFailures.length > 0 || readinessFailures.length > 0 || sourceFailures.length > 0) {
    process.exit(1)
  }
}

main()
