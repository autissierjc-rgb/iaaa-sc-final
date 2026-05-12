'use client'

import { useMemo, useState } from 'react'
import { inquiryLevelLabel, publicInquiryQuestion } from './inquiryDisplay'

type GenerateV2Response = {
  ok?: boolean
  mode?: string
  generation_mode?: {
    id?: string
    label_fr?: string
    interpretation_mode?: string
    writing_mode?: string
    allows_recherche_plus?: boolean
    latency_target_ms?: number
    rule_fr?: string
  }
  total_duration_ms?: number
  runtime_summary?: {
    target_ms?: number
    total_ms?: number
    over_target?: boolean
    status?: string
    rule_fr?: string
    interpretation?: {
      mode?: string
      provider?: string
      model?: string
      fallback_used?: boolean
      duration_ms?: number
    }
    writing?: {
      mode?: string
      model?: string
      fallback_used?: boolean
      duration_ms?: number
      llm_called?: boolean
    }
    resources?: {
      needed?: boolean
      status?: string
      sources?: number
      runner_status?: string
      runner_provider?: string
      duration_ms?: number
    }
  }
  dialogue?: {
    status?: string
    can_generate?: boolean
    question?: string
  }
  interpretation?: {
    domain?: string
    header_domain?: string
    header_subject?: string
    situation_soumise?: string
    confidence?: number
    reference_model?: {
      provider?: string
      model?: string
    }
    trace?: {
      duration_ms?: number
      notes?: string[]
    }
  }
  scoring?: {
    state_index_final?: number
    state_label?: string
  }
  resources?: {
    status?: string
    policy?: string
    policy_reason_fr?: string
    functional_needs?: Array<{
      family: string
      label_fr: string
      question_fr: string
      channels: string[]
      suggested_queries: string[]
      expected_evidence_fr: string[]
      priority: string
    }>
    resources?: unknown[]
    public_sources?: unknown[]
    needs_web?: boolean
    fallback_searches?: string[]
    requested_urls?: string[]
  }
  fast_resource_run?: {
    status?: string
    provider?: string
    duration_ms?: number
    timeout_ms?: number
    query?: string
    include_domains?: string[]
    note_fr?: string
    resources?: unknown[]
  }
  expertises?: {
    domain_playbook?: {
      id?: string
      label_fr?: string
    }
    metier_lenses?: Array<{
      id?: string
      label_fr?: string
    }>
  }
  patterns?: {
    selected_patterns?: Array<{
      id: string
      label_fr: string
      confidence: number
      hypothesis: string
      observable_signal: string
      inquiry_question: string
    }>
    dumezil_balance?: {
      legitimize?: number
      protect_fight?: number
      produce_reproduce?: number
    }
    trace?: {
      rule?: string
      matched_patterns?: number
      total_patterns?: number
    }
  }
  triad_astrolabe?: Array<{
    function_id: string
    label_fr: string
    active: boolean
    suggested_branches: string[]
    rationale_fr: string
  }>
  theatre?: {
    actors?: string[]
    institutions?: string[]
    procedures?: string[]
    unknowns?: string[]
  }
  inquiry?: {
    blind_spots?: Array<{
      blind_spot: string
      level: string
      decisive_evidence: string
      observable_signal?: string
    }>
  }
  recherche_plus?: {
    mode?: string
    access_tier?: string
    product_boundary_fr?: string
    introduction_fr?: string
    public_disclaimer_fr?: string
    radar_tasks?: Array<{
      family: string
      label_fr: string
      radar_question_fr: string
      channels: string[]
      suggested_queries: string[]
      expected_evidence_fr: string[]
      signal_classes: string[]
      linked_blind_spots: string[]
      caution_fr: string
    }>
    targets?: Array<{
      blind_spot: string
      question: string
      expected_evidence: string
      allowed_channels: string[]
      safety_note?: string
    }>
  }
  quality?: {
    ok?: boolean
    requires_section_regeneration?: boolean
    sections_to_regenerate?: string[]
    issues?: Array<{
      level: string
      code: string
      message: string
      field?: string
    }>
  }
  generation_archive?: {
    event?: {
      privacy_mode?: string
      raw_input_hash?: string
      input_chars?: number
      resources_count?: number
      generation_status?: string
      latency_ms?: number
      domain?: string
      intent?: string
    }
    archive_decision?: {
      store_event?: boolean
      store_snapshot?: boolean
      privacy_mode?: string
      reason?: string
    }
  }
  writing?: {
    situation_card?: {
      title_fr?: string
      insight_fr?: string
      main_vulnerability_fr?: string
      asymmetry_fr?: string
      key_signal_fr?: string
    }
    trajectories?: Array<{
      type: string
      title_fr: string
      description_fr: string
      signal_fr: string
    }>
    lecture?: {
      text_fr?: string
      word_count_fr?: number
    }
    approfondir?: {
      analysis_fr?: string
      sections_fr?: Array<{
        id: string
        title: string
        body: string
      }>
    }
    diamond_sentences?: Array<{
      text_fr: string
      role: string
      style?: string
    }>
    probability_assessments?: Array<{
      probability_label_fr?: string
      claim_fr?: string
      confidence?: number
    }>
    public_warnings?: string[]
  }
  writing_benchmark?: {
    passed?: number
    total?: number
    verdict?: string
    checks?: Array<{
      id: string
      label_fr: string
      passed: boolean
      detail_fr: string
    }>
  }
  pipeline_trace?: {
    total_duration_ms?: number
    blocking_failure?: boolean
    steps?: Array<{
      stage_id: string
      outcome: string
      duration_ms: number
      budget_ms: number
      over_budget: boolean
      warnings?: string[]
      error_kind?: string
    }>
  }
  error?: string
  message?: string
}

type RecherchePlusResult = NonNullable<GenerateV2Response['recherche_plus']> & {
  findings?: Array<{
    target_blind_spot: string
    status: string
    channel: string
    source_title: string
    retrieved_at: string
    what_it_suggests: string
    what_it_does_not_prove: string
    next_verification_step: string
  }>
}

type ResourcePreview = {
  title?: string
  url?: string
  source?: string
  channel?: string
  reliability?: string
  excerpt?: string
  published_at?: string
}

type BenchmarkCase = {
  id: string
  label: string
  input: string
  expectedPlaybook: string
  expectedSources: 'available' | 'not_needed'
}

type BenchmarkResult = {
  id: string
  label: string
  ok: boolean
  qualityOk: boolean
  verdict: string
  duration: number
  budget: number
  runtime: string
  usedFallback: boolean
  resources: string
  sourceCount: number
  expectedSources: 'available' | 'not_needed'
  header: string
  playbook: string
  expectedPlaybook: string
  issues: string[]
  error?: string
}

type CtoWatchStatus = 'OK' | 'WATCH' | 'CRITICAL'

type CtoWatchResult = {
  status: CtoWatchStatus
  tone: string
  cause: string
  action: string
  layer: string
}

const EXAMPLES = [
  'Trump peut-il contester les resultats des elections de mi-mandat ?',
  "Que fait la compagnie FlexUp et qu'en penser pour eventuellement la rejoindre avec ma startup ?",
  "Mon fils de 14 ans est passionne par la peche a la carpe, comment reagir apres son retrait dans la voiture ?",
]

const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    id: 'trump',
    label: 'Trump / institutionnel',
    input: EXAMPLES[0],
    expectedPlaybook: 'institutional_crisis',
    expectedSources: 'available',
  },
  {
    id: 'flexup',
    label: 'FlexUp / startup',
    input: EXAMPLES[1],
    expectedPlaybook: 'startup_market',
    expectedSources: 'available',
  },
  {
    id: 'fils-peche',
    label: 'Fils peche / humain',
    input: EXAMPLES[2],
    expectedPlaybook: 'family',
    expectedSources: 'not_needed',
  },
]

const GENERATE_V2_TIMEOUT_MS = 60000
const SLOW_REQUEST_NOTICE_MS = 12000

function panelStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #E1D6C2',
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
  }
}

function miniCardStyle(): React.CSSProperties {
  return {
    border: '1px solid #F0EBE0',
    borderRadius: 8,
    padding: 12,
    background: '#FCFAF6',
  }
}

function outcomeColor(outcome?: string) {
  if (outcome === 'failed') return '#B23A3A'
  if (outcome === 'warning') return '#A66B00'
  if (outcome === 'skipped') return '#8B8174'
  return '#1D9E75'
}

function layerLabel(stageId: string) {
  const labels: Record<string, string> = {
    interpretation: 'interpretation',
    'dialogue-gate': 'dialogue',
    'risk-advice': 'safety',
    'expertises-metiers': 'expertisesMetiers',
    resources: 'resources',
    patterns: 'patterns',
    'recherche-plus': 'recherchePlus',
    theatre: 'theatre',
    'blind-spots': 'inquiry',
    scoring: 'scoring',
    writing: 'writing',
    quality: 'quality',
  }

  return labels[stageId] ?? stageId
}

function resourcePreviewItems(response: GenerateV2Response): ResourcePreview[] {
  const items = response.resources?.public_sources ?? response.resources?.resources ?? []
  return items
    .map((item) => item && typeof item === 'object' ? item as ResourcePreview : null)
    .filter((item): item is ResourcePreview => Boolean(item))
    .slice(0, 3)
}

function interpretationRuntime(response: GenerateV2Response | null) {
  const model = response?.interpretation?.reference_model?.model
  const notes = response?.interpretation?.trace?.notes ?? []
  const usedFallback = model === 'local-contract-timeout-fallback' ||
    notes.some((note) => /timeout|fallback/i.test(note))

  if (!response?.interpretation) return null

  return {
    model: model ?? 'non renseigne',
    usedFallback,
    label: usedFallback ? 'Fallback local actif' : 'Referent utilise',
    detail: usedFallback
      ? 'public_fast a protege la latence : le LLM referent n a pas repondu dans le budget, interpretation locale utilisee.'
      : 'Interpretation fournie par le mode runtime attendu.',
    tone: usedFallback ? '#A66B00' : '#1D9E75',
  }
}

function speedTone(duration = 0, budget = 0) {
  if (budget <= 0) return '#1D9E75'
  if (duration <= budget) return '#1D9E75'
  if (duration <= budget * 1.4) return '#A66B00'
  return '#B23A3A'
}

function speedLabel(duration = 0, budget = 0) {
  if (budget <= 0) return 'hors budget'
  if (duration <= budget) return 'dans le budget'
  if (duration <= budget * 1.4) return 'limite'
  return 'trop lent'
}

function speedBudgetItems(response: GenerateV2Response | null) {
  const steps = response?.pipeline_trace?.steps ?? []
  const findStep = (id: string) => steps.find((step) => step.stage_id === id)
  const interpretation = findStep('interpretation')
  const resources = findStep('resources')
  const writing = findStep('writing')
  const totalDuration = response?.pipeline_trace?.total_duration_ms ?? response?.total_duration_ms ?? 0
  const totalBudget = response?.generation_mode?.latency_target_ms ?? 0

  return [
    {
      id: 'interpretation',
      label: 'Interpretation',
      duration: interpretation?.duration_ms ?? response?.interpretation?.trace?.duration_ms ?? 0,
      budget: interpretation?.budget_ms ?? 2000,
    },
    {
      id: 'resources',
      label: 'Sources rapides',
      duration: resources?.duration_ms ?? response?.fast_resource_run?.duration_ms ?? 0,
      budget: resources?.budget_ms ?? response?.fast_resource_run?.timeout_ms ?? 1200,
    },
    {
      id: 'writing',
      label: 'Redaction',
      duration: writing?.duration_ms ?? 0,
      budget: writing?.budget_ms ?? 2500,
    },
    {
      id: 'total',
      label: 'Total',
      duration: totalDuration,
      budget: totalBudget,
    },
  ]
}

function responseVerdict(response: GenerateV2Response) {
  const sourceWarnings = response.quality?.issues?.filter((item) =>
    item.code === 'FAST_SOURCES_REQUIRED_BUT_MISSING' ||
    item.code === 'MISSING_RESOURCE_WARNING' ||
    item.field === 'resources',
  ) ?? []
  const errors = response.quality?.issues?.filter((item) => item.level === 'error') ?? []

  if (errors.length > 0) return 'A corriger'
  if (sourceWarnings.length > 0 || (response.resources?.needs_web && (response.resources.public_sources?.length ?? 0) === 0)) {
    return 'Partiel'
  }
  if (response.quality?.issues && response.quality.issues.length > 0) return 'A verifier'
  return 'Solide'
}

function benchmarkResultFromResponse(testCase: BenchmarkCase, response: GenerateV2Response): BenchmarkResult {
  const runtime = interpretationRuntime(response)
  const playbook = response.expertises?.domain_playbook?.id ?? 'non renseigne'
  const resourceStatus = response.resources?.status ?? 'non renseigne'
  const sourceCount = response.resources?.public_sources?.length ?? response.resources?.resources?.length ?? 0
  const issues = response.quality?.issues?.map((item) => item.code) ?? []

  return {
    id: testCase.id,
    label: testCase.label,
    ok: Boolean(response.ok),
    qualityOk: Boolean(response.quality?.ok),
    verdict: responseVerdict(response),
    duration: response.pipeline_trace?.total_duration_ms ?? response.total_duration_ms ?? 0,
    budget: response.generation_mode?.latency_target_ms ?? 0,
    runtime: runtime?.model ?? 'non renseigne',
    usedFallback: Boolean(runtime?.usedFallback),
    resources: resourceStatus,
    sourceCount,
    expectedSources: testCase.expectedSources,
    header: response.writing?.situation_card?.title_fr ?? response.interpretation?.header_subject ?? 'non renseigne',
    playbook,
    expectedPlaybook: testCase.expectedPlaybook,
    issues,
  }
}

function benchmarkTone(result: BenchmarkResult) {
  if (!result.ok || !result.qualityOk || result.verdict === 'A corriger') return '#B23A3A'
  if (result.playbook !== result.expectedPlaybook) return '#A66B00'
  if (result.expectedSources === 'available' && result.sourceCount === 0) return '#A66B00'
  if (result.budget > 0 && result.duration > result.budget) return '#A66B00'
  return '#1D9E75'
}

function ctoWatchForResult(result: BenchmarkResult): CtoWatchResult {
  if (!result.ok || result.error) {
    return {
      status: 'CRITICAL',
      tone: '#B23A3A',
      cause: `${result.label} ne genere pas.`,
      action: 'Inspecter la route generate-v2 et les logs serveur.',
      layer: 'api/pipeline',
    }
  }

  if (!result.qualityOk || result.verdict === 'A corriger') {
    return {
      status: 'CRITICAL',
      tone: '#B23A3A',
      cause: `${result.label} echoue au QualityGate.`,
      action: `Reprendre les issues : ${result.issues.slice(0, 3).join(', ') || 'quality'}.`,
      layer: 'quality',
    }
  }

  if (result.playbook !== result.expectedPlaybook) {
    return {
      status: 'CRITICAL',
      tone: '#B23A3A',
      cause: `${result.label} route vers ${result.playbook} au lieu de ${result.expectedPlaybook}.`,
      action: 'Corriger interpretation ou expertisesMetiers avant de continuer.',
      layer: 'interpretation/expertisesMetiers',
    }
  }

  if (result.expectedSources === 'available' && result.sourceCount === 0) {
    return {
      status: 'CRITICAL',
      tone: '#B23A3A',
      cause: `${result.label} exige des sources rapides mais n en attache aucune.`,
      action: 'Verifier SourceRouter, FastResourceRunner ou cle Tavily.',
      layer: 'resources',
    }
  }

  if (result.budget > 0 && result.duration > result.budget * 1.4) {
    return {
      status: 'CRITICAL',
      tone: '#B23A3A',
      cause: `${result.label} depasse fortement le budget public_fast.`,
      action: 'Identifier la couche lente dans budget vitesse.',
      layer: 'performance',
    }
  }

  if (result.usedFallback) {
    return {
      status: 'WATCH',
      tone: '#A66B00',
      cause: `${result.label} utilise le fallback local.`,
      action: 'Surveiller la frequence ; acceptable si qualite, playbook et sources restent bons.',
      layer: 'interpretation',
    }
  }

  if (result.budget > 0 && result.duration > result.budget) {
    return {
      status: 'WATCH',
      tone: '#A66B00',
      cause: `${result.label} depasse legerement le budget.`,
      action: 'Surveiller la tendance sur plusieurs runs.',
      layer: 'performance',
    }
  }

  if (result.issues.length > 0 || result.verdict === 'A verifier' || result.verdict === 'Partiel') {
    return {
      status: 'WATCH',
      tone: '#A66B00',
      cause: `${result.label} genere avec warnings.`,
      action: `Lire les issues : ${result.issues.slice(0, 3).join(', ') || result.verdict}.`,
      layer: 'quality',
    }
  }

  return {
    status: 'OK',
    tone: '#1D9E75',
    cause: `${result.label} tient le contrat.`,
    action: 'Aucune action immediate.',
    layer: 'system',
  }
}

function ctoWatchSummary(results: BenchmarkResult[]): CtoWatchResult | null {
  if (results.length === 0) return null
  const watches = results.map(ctoWatchForResult)
  return watches.find((watch) => watch.status === 'CRITICAL')
    ?? watches.find((watch) => watch.status === 'WATCH')
    ?? {
      status: 'OK',
      tone: '#1D9E75',
      cause: 'Tous les cas benchmark tiennent le contrat V2.',
      action: 'Continuer le polish ou elargir le benchmark.',
      layer: 'system',
    }
}

export default function GenerateV2Tester() {
  const [input, setInput] = useState(EXAMPLES[0])
  const [generationMode, setGenerationMode] = useState<'public_fast' | 'diamond_llm' | 'research_plus' | 'admin_benchmark'>('public_fast')
  const [interpretationMode, setInterpretationMode] = useState<'local_contract' | 'referent_llm'>('local_contract')
  const [writingMode, setWritingMode] = useState<'local_contract' | 'referent_llm'>('local_contract')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<GenerateV2Response | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('Pret.')
  const [evidenceSearchRequested, setEvidenceSearchRequested] = useState(false)
  const [recherchePlusLoading, setRecherchePlusLoading] = useState(false)
  const [recherchePlusResult, setRecherchePlusResult] = useState<RecherchePlusResult | null>(null)
  const [recherchePlusError, setRecherchePlusError] = useState<string | null>(null)
  const [benchmarkLoading, setBenchmarkLoading] = useState(false)
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null)

  const firstBlindSpots = useMemo(
    () => response?.inquiry?.blind_spots?.slice(0, 3) ?? [],
    [response],
  )
  const sharpDiamond = useMemo(
    () => response?.writing?.diamond_sentences?.find((sentence) => sentence.style === 'diamant_tranchant')
      ?? response?.writing?.diamond_sentences?.[0],
    [response],
  )
  const sharpDiamondIssues = useMemo(
    () => response?.quality?.issues?.filter((item) => item.field === 'writing.diamond_sentences') ?? [],
    [response],
  )
  const cockpitVerdict = useMemo(() => {
    if (!response?.ok) return null

    const sourceWarnings = response.quality?.issues?.filter((item) =>
      item.code === 'FAST_SOURCES_REQUIRED_BUT_MISSING' ||
      item.code === 'MISSING_RESOURCE_WARNING' ||
      item.field === 'resources',
    ) ?? []
    const errors = response.quality?.issues?.filter((item) => item.level === 'error') ?? []

    if (errors.length > 0) {
      return {
        label: 'A corriger',
        tone: '#B23A3A',
        detail: 'Une couche contractuelle bloque la sortie publique.',
      }
    }

    if (sourceWarnings.length > 0 || (response.resources?.needs_web && (response.resources.public_sources?.length ?? 0) === 0)) {
      return {
        label: 'Partiel · sources rapides manquantes',
        tone: '#A66B00',
        detail: response.resources?.policy_reason_fr ?? 'La reponse reste utile, mais elle doit etre lue comme provisoire.',
      }
    }

    if (response.quality?.issues && response.quality.issues.length > 0) {
      return {
        label: 'A verifier',
        tone: '#A66B00',
        detail: 'La sortie est generable, avec warnings non bloquants.',
      }
    }

    return {
      label: 'Solide',
      tone: '#1D9E75',
      detail: 'Aucun warning qualite bloquant ou ressource manquante.',
    }
  }, [response])
  const runtime = useMemo(() => interpretationRuntime(response), [response])
  const speedItems = useMemo(() => speedBudgetItems(response), [response])
  const ctoWatch = useMemo(() => ctoWatchSummary(benchmarkResults), [benchmarkResults])
  const publicFastLight = useMemo(() => {
    if (!response?.runtime_summary) return null
    const summary = response.runtime_summary
    const qualityOk = Boolean(response.quality?.ok)
    const sourcesMissing = Boolean(response.resources?.needs_web && (response.resources.public_sources?.length ?? 0) === 0)
    const critical = !qualityOk || sourcesMissing || (summary.target_ms ? (summary.total_ms ?? 0) > summary.target_ms * 1.4 : false)
    const warning = !critical && Boolean(summary.over_target || (response.quality?.issues?.length ?? 0) > 0)
    return {
      label: critical ? 'Rouge' : warning ? 'Orange' : 'Vert',
      tone: critical ? '#B23A3A' : warning ? '#A66B00' : '#1D9E75',
      detail: `${summary.total_ms ?? 0}/${summary.target_ms ?? 0} ms · sources ${summary.resources?.sources ?? 0} · ${summary.writing?.llm_called ? 'LLM diamant appele' : 'LLM diamant non appele'}`,
    }
  }, [response])

  async function runTest() {
    setLoading(true)
    setError(null)
    setResponse(null)
    setEvidenceSearchRequested(false)
    setRecherchePlusResult(null)
    setRecherchePlusError(null)
    setStatusMessage('Appel de /api/generate-v2 en cours...')
    const controller = new AbortController()
    const slowNotice = window.setTimeout(() => {
      setStatusMessage('Appel toujours en cours : attente du LLM referent ou du serveur local...')
    }, SLOW_REQUEST_NOTICE_MS)
    const timeout = window.setTimeout(() => controller.abort(), GENERATE_V2_TIMEOUT_MS)

    try {
      const result = await fetch('/api/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          mode: generationMode,
          interpretation_mode: generationMode === 'admin_benchmark' ? interpretationMode : undefined,
          writing_mode: generationMode === 'admin_benchmark' ? writingMode : undefined,
        }),
        signal: controller.signal,
      })
      const payload = await result.json()
      setResponse(payload)
      if (!result.ok) {
        setError(payload?.message ?? payload?.error ?? 'Erreur generate-v2')
        setStatusMessage('Erreur recue.')
      } else {
        setStatusMessage('Reponse recue.')
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setError('Timeout generate-v2 : la route n a pas repondu en moins de 60 secondes.')
        setStatusMessage('Timeout.')
      } else {
        setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
        setStatusMessage('Erreur reseau ou JSON.')
      }
    } finally {
      window.clearTimeout(slowNotice)
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  async function runMiniBenchmark() {
    setBenchmarkLoading(true)
    setBenchmarkError(null)
    setBenchmarkResults([])

    const results: BenchmarkResult[] = []

    for (const testCase of BENCHMARK_CASES) {
      try {
        const result = await fetch('/api/generate-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: testCase.input,
            mode: 'public_fast',
          }),
        })
        const payload: GenerateV2Response = await result.json()

        if (!result.ok || !payload?.ok) {
          results.push({
            id: testCase.id,
            label: testCase.label,
            ok: false,
            qualityOk: false,
            verdict: 'Erreur',
            duration: 0,
            budget: 5000,
            runtime: 'non renseigne',
            usedFallback: false,
            resources: 'non renseigne',
            sourceCount: 0,
            expectedSources: testCase.expectedSources,
            header: 'non genere',
            playbook: 'non renseigne',
            expectedPlaybook: testCase.expectedPlaybook,
            issues: [],
            error: payload?.message ?? payload?.error ?? 'Erreur generate-v2',
          })
        } else {
          results.push(benchmarkResultFromResponse(testCase, payload))
        }
      } catch (caught) {
        results.push({
          id: testCase.id,
          label: testCase.label,
          ok: false,
          qualityOk: false,
          verdict: 'Erreur',
          duration: 0,
          budget: 5000,
          runtime: 'non renseigne',
          usedFallback: false,
          resources: 'non renseigne',
          sourceCount: 0,
          expectedSources: testCase.expectedSources,
          header: 'non genere',
          playbook: 'non renseigne',
          expectedPlaybook: testCase.expectedPlaybook,
          issues: [],
          error: caught instanceof Error ? caught.message : 'Erreur inconnue',
        })
      }

      setBenchmarkResults([...results])
    }

    setBenchmarkLoading(false)
  }

  async function runRecherchePlusPreview() {
    if (!response?.recherche_plus) return

    setEvidenceSearchRequested(true)
    setRecherchePlusLoading(true)
    setRecherchePlusError(null)

    try {
      const result = await fetch('/api/recherche-plus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: response.recherche_plus,
          mode: 'simulated',
        }),
      })
      const payload = await result.json()

      if (!result.ok || !payload?.ok) {
        setRecherchePlusError(payload?.message ?? payload?.error ?? 'Erreur Recherche+')
        return
      }

      setRecherchePlusResult(payload.recherche_plus)
    } catch (caught) {
      setRecherchePlusError(caught instanceof Error ? caught.message : 'Erreur Recherche+ inconnue')
    } finally {
      setRecherchePlusLoading(false)
    }
  }

  return (
    <section style={panelStyle()}>
      <style>{`
        @keyframes recherchePlusPulse {
          0% { transform: scale(0.62); opacity: 0.42; }
          70% { opacity: 0.12; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        @keyframes recherchePlusFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Banc d essai generate-v2</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Test public fast par defaut : mesure la V2 comme futur flux public, avec ressources rapides si necessaires et Recherche+ separee.
          </p>
        </div>
        <button
          type="button"
          data-testid="generate-v2-test-button"
          onClick={runTest}
          disabled={loading || input.trim().length === 0}
          style={{
            border: '1px solid #C8951A',
            color: '#1A2E5A',
            background: loading ? '#F0EBE0' : '#F8EFD8',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            height: 40,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Test en cours' : 'Tester public fast'}
        </button>
      </div>

      {publicFastLight && (
        <div style={{ marginTop: 14, border: `1px solid ${publicFastLight.tone}`, borderRadius: 10, padding: 12, background: publicFastLight.tone === '#1D9E75' ? '#F4FBF8' : publicFastLight.tone === '#A66B00' ? '#FFF8E8' : '#FFF4F4' }}>
          <p style={{ margin: 0, color: publicFastLight.tone, fontSize: 13, fontWeight: 800 }}>
            Feu {publicFastLight.label} · {publicFastLight.detail}
          </p>
          <p style={{ margin: '5px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
            Vert = solide et dans les 5s. Orange = partiel ou limite. Rouge = quality fail, sources obligatoires absentes ou trop lent.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
        <div>
          <p style={{ margin: '0 0 6px', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
            mode produit
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['admin_benchmark', 'Admin benchmark'],
              ['public_fast', 'Public fast'],
              ['diamond_llm', 'Diamant LLM'],
              ['research_plus', 'Recherche+'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGenerationMode(mode as typeof generationMode)}
                disabled={loading}
                style={{
                  border: `1px solid ${generationMode === mode ? '#C8951A' : '#E1D6C2'}`,
                  color: generationMode === mode ? '#1A2E5A' : '#8B8174',
                  background: generationMode === mode ? '#F8EFD8' : '#fff',
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontSize: 11,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 6px', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
            interpretation
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['local_contract', 'Contrat local rapide'],
              ['referent_llm', 'LLM referent'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInterpretationMode(mode as 'local_contract' | 'referent_llm')}
                disabled={loading}
                style={{
                  border: `1px solid ${interpretationMode === mode ? '#C8951A' : '#E1D6C2'}`,
                  color: interpretationMode === mode ? '#1A2E5A' : '#8B8174',
                  background: interpretationMode === mode ? '#F8EFD8' : '#fff',
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontSize: 11,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 6px', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
            redaction
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['local_contract', 'Locale rapide'],
              ['referent_llm', 'LLM diamant'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setWritingMode(mode as 'local_contract' | 'referent_llm')}
                disabled={loading}
                style={{
                  border: `1px solid ${writingMode === mode ? '#C8951A' : '#E1D6C2'}`,
                  color: writingMode === mode ? '#1A2E5A' : '#8B8174',
                  background: writingMode === mode ? '#F8EFD8' : '#fff',
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontSize: 11,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <textarea
        data-testid="generate-v2-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: 14,
          border: '1px solid #E1D6C2',
          borderRadius: 8,
          padding: 12,
          color: '#1A2E5A',
          background: '#FCFAF6',
          fontSize: 13,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />

      <p data-testid="generate-v2-status" style={{ color: '#8B8174', fontSize: 12, margin: '8px 0 0' }}>
        {statusMessage}
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setInput(example)}
            style={{
              border: '1px solid #E1D6C2',
              color: '#6F6255',
              background: '#fff',
              borderRadius: 999,
              padding: '6px 9px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            exemple
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14, ...miniCardStyle() }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>mini benchmark public_fast</p>
            <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.5 }}>
              Teste les trois familles de non-regression : institutionnel, startup, humain.
            </p>
          </div>
          <button
            type="button"
            onClick={runMiniBenchmark}
            disabled={benchmarkLoading || loading}
            style={{
              border: '1px solid #C8951A',
              color: '#1A2E5A',
              background: benchmarkLoading ? '#F0EBE0' : '#F8EFD8',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              cursor: benchmarkLoading ? 'wait' : 'pointer',
            }}
          >
            {benchmarkLoading ? 'Benchmark en cours' : 'Lancer benchmark'}
          </button>
        </div>
        {benchmarkError && (
          <p style={{ margin: '8px 0 0', color: '#B23A3A', fontSize: 12 }}>{benchmarkError}</p>
        )}
        {ctoWatch && (
          <div style={{ marginTop: 12, border: `1px solid ${ctoWatch.tone}`, borderRadius: 8, padding: 10, background: ctoWatch.status === 'OK' ? '#F4FBF8' : ctoWatch.status === 'WATCH' ? '#FFF8E8' : '#FFF4F4' }}>
            <p style={{ margin: 0, color: ctoWatch.tone, fontSize: 12, fontWeight: 800 }}>
              Veille CTO : {ctoWatch.status} · couche {ctoWatch.layer}
            </p>
            <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.45 }}>
              {ctoWatch.cause}
            </p>
            <p style={{ margin: '4px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
              Action : {ctoWatch.action}
            </p>
          </div>
        )}
        {benchmarkResults.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {benchmarkResults.map((result) => {
              const tone = benchmarkTone(result)
              const watch = ctoWatchForResult(result)
              return (
                <div key={result.id} style={{ border: `1px solid ${tone}`, borderRadius: 8, padding: 10, background: tone === '#1D9E75' ? '#F4FBF8' : tone === '#A66B00' ? '#FFF8E8' : '#FFF4F4' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.4fr) repeat(5, minmax(90px, 1fr))', gap: 8, alignItems: 'start' }}>
                    <div>
                      <p style={{ margin: 0, color: '#1A2E5A', fontSize: 12, fontWeight: 800 }}>{result.label}</p>
                      <p style={{ margin: '4px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.35 }}>{result.header}</p>
                    </div>
                    <p style={{ margin: 0, color: tone, fontSize: 11, fontWeight: 800 }}>{result.verdict}</p>
                    <p style={{ margin: 0, color: '#6F6255', fontSize: 11 }}>{result.duration}/{result.budget} ms</p>
                    <p style={{ margin: 0, color: result.usedFallback ? '#A66B00' : '#1D9E75', fontSize: 11 }}>
                      {result.usedFallback ? 'fallback' : 'referent'}
                    </p>
                    <p style={{ margin: 0, color: result.playbook === result.expectedPlaybook ? '#1D9E75' : '#A66B00', fontSize: 11 }}>
                      {result.playbook}
                    </p>
                    <p style={{ margin: 0, color: result.expectedSources === 'available' && result.sourceCount === 0 ? '#A66B00' : '#6F6255', fontSize: 11 }}>
                      {result.resources} · {result.sourceCount}
                    </p>
                  </div>
                  <p style={{ margin: '7px 0 0', color: watch.tone, fontSize: 11, fontWeight: 700 }}>
                    CTO {watch.status} · {watch.layer} · {watch.action}
                  </p>
                  {(result.issues.length > 0 || result.error) && (
                    <p style={{ margin: '7px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.4 }}>
                      {result.error ?? `issues: ${result.issues.slice(0, 3).join(', ')}`}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: '#B23A3A', fontSize: 13, marginTop: 12 }}>
          {error}
        </p>
      )}

      {response?.ok && (
        <div style={{ marginTop: 16, ...panelStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>apercu public v2</p>
          {response.generation_mode && (
            <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
              Mode : {response.generation_mode.label_fr} · interpretation {response.generation_mode.interpretation_mode} · redaction {response.generation_mode.writing_mode}
            </p>
          )}
          {response.runtime_summary && (
            <div style={{ marginTop: 10, border: `1px solid ${response.runtime_summary.over_target ? '#A66B00' : '#1D9E75'}`, borderRadius: 8, padding: 10, background: response.runtime_summary.over_target ? '#FFF8E8' : '#F4FBF8' }}>
              <p style={{ margin: 0, color: response.runtime_summary.over_target ? '#A66B00' : '#1D9E75', fontSize: 12, fontWeight: 700 }}>
                Runtime public fast : {response.runtime_summary.total_ms ?? 0}/{response.runtime_summary.target_ms ?? 0} ms · {response.runtime_summary.over_target ? 'hors cible' : 'dans la cible'}
              </p>
              <p style={{ margin: '5px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                Interpretation {response.runtime_summary.interpretation?.mode}
                {response.runtime_summary.interpretation?.fallback_used ? ' · fallback local' : ''}
                {' · '}redaction {response.runtime_summary.writing?.mode}
                {response.runtime_summary.writing?.llm_called ? ' · LLM diamant appele' : ' · pas de LLM diamant'}
                {' · '}sources {response.runtime_summary.resources?.sources ?? 0}
                {response.runtime_summary.resources?.needed ? ' requises' : ' non obligatoires'}.
              </p>
              <p style={{ margin: '5px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                {response.runtime_summary.rule_fr}
              </p>
            </div>
          )}
          {runtime && (
            <div style={{ marginTop: 10, border: `1px solid ${runtime.tone}`, borderRadius: 8, padding: 10, background: runtime.usedFallback ? '#FFF8E8' : '#F4FBF8' }}>
              <p style={{ margin: 0, color: runtime.tone, fontSize: 12, fontWeight: 700 }}>
                Runtime interpretation : {runtime.label}
              </p>
              <p style={{ margin: '5px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                {runtime.detail} Modele : {runtime.model}.
              </p>
            </div>
          )}
          {cockpitVerdict && (
            <div style={{ marginTop: 10, border: `1px solid ${cockpitVerdict.tone}`, borderRadius: 8, padding: 10, background: '#fff' }}>
              <p style={{ margin: 0, color: cockpitVerdict.tone, fontSize: 12, fontWeight: 700 }}>
                Verdict cockpit : {cockpitVerdict.label}
              </p>
              <p style={{ margin: '5px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                {cockpitVerdict.detail}
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...miniCardStyle(), borderColor: '#D8C79B' }}>
                <p style={{ margin: 0, color: '#8B8174', fontSize: 11 }}>
                  {response.interpretation?.header_domain}
                </p>
                <h3 style={{ margin: '5px 0 0', color: '#1A2E5A', fontSize: 18, lineHeight: 1.25 }}>
                  {response.writing?.situation_card?.title_fr ?? response.interpretation?.header_subject}
                </h3>
                <p style={{ margin: '10px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.6 }}>
                  {response.writing?.situation_card?.insight_fr}
                </p>
                {response.writing?.public_warnings && response.writing.public_warnings.length > 0 && (
                  <p style={{ margin: '10px 0 0', color: '#A66B00', fontSize: 12, lineHeight: 1.5 }}>
                    {response.writing.public_warnings[0]}
                  </p>
                )}
                {response.writing?.diamond_sentences?.[0]?.text_fr && (
                  <p style={{ margin: '12px 0 0', color: '#C8951A', fontSize: 14, lineHeight: 1.45, fontStyle: 'italic' }}>
                    {response.writing.diamond_sentences[0].text_fr}
                  </p>
                )}
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 12 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>lecture</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.65 }}>
                  {response.writing?.lecture?.text_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 12 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>approfondir enrichi</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.65 }}>
                  {response.writing?.approfondir?.analysis_fr}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                  {response.writing?.approfondir?.sections_fr?.map((section) => (
                    <div key={section.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                      <h4 style={{ margin: 0, color: '#1A2E5A', fontSize: 12 }}>{section.title}</h4>
                      <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.5 }}>{section.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside style={{ minWidth: 0 }}>
              <div style={miniCardStyle()}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>vulnerabilite</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  {response.writing?.situation_card?.main_vulnerability_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>asymetrie</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  {response.writing?.situation_card?.asymmetry_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>signal cle</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  {response.writing?.situation_card?.key_signal_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>trajectoires</p>
                {response.writing?.trajectories?.map((trajectory) => (
                  <div key={trajectory.type} style={{ marginTop: 10 }}>
                    <h4 style={{ margin: 0, color: '#1A2E5A', fontSize: 12 }}>{trajectory.title_fr}</h4>
                    <p style={{ margin: '4px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                      {trajectory.description_fr}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                      {trajectory.signal_fr}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>ressources</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  Statut : {response.resources?.status ?? 'non renseigne'} · sources publiques : {response.resources?.public_sources?.length ?? response.resources?.resources?.length ?? 0}
                </p>
                {response.resources?.policy && (
                  <p style={{ margin: '6px 0 0', color: response.resources.needs_web ? '#A66B00' : '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    Politique : {response.resources.policy} · {response.resources.policy_reason_fr}
                  </p>
                )}
                {response.resources?.functional_needs && response.resources.functional_needs.length > 0 && (
                  <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    Triade : {response.resources.functional_needs.map((need) => `${need.label_fr} (${need.priority})`).join(' · ')}
                  </p>
                )}
                {response.resources?.needs_web && (response.resources.public_sources?.length ?? 0) === 0 && (
                  <p style={{ margin: '8px 0 0', color: '#A66B00', fontSize: 11, lineHeight: 1.45 }}>
                    Lecture/Approfondir doivent rester prudents : aucune source rapide n est encore attachee.
                  </p>
                )}
                {response.resources?.fallback_searches && response.resources.fallback_searches.length > 0 && (
                  <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                    Recherches rapides prevues : {response.resources.fallback_searches.slice(0, 2).join(' · ')}
                  </p>
                )}
                {resourcePreviewItems(response).length > 0 && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    {resourcePreviewItems(response).map((source, index) => (
                      <div key={`${source.url ?? source.title ?? 'source'}-${index}`} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 9, background: '#fff' }}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#1A2E5A', fontSize: 11, fontWeight: 700, textDecoration: 'none', lineHeight: 1.35 }}
                        >
                          {source.title ?? source.url ?? 'Source publique'}
                        </a>
                        <p style={{ margin: '5px 0 0', color: '#8B8174', fontSize: 10, lineHeight: 1.35 }}>
                          {[source.source, source.channel, source.reliability].filter(Boolean).join(' · ')}
                        </p>
                        {source.excerpt && (
                          <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 10, lineHeight: 1.45 }}>
                            {source.excerpt.length > 180 ? `${source.excerpt.slice(0, 177).trim()}...` : source.excerpt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {response.fast_resource_run && (
                  <div style={{ marginTop: 10, border: '1px solid #F0EBE0', borderRadius: 8, padding: 9, background: '#fff' }}>
                    <p style={{ margin: 0, color: '#1A2E5A', fontSize: 11, fontWeight: 700 }}>
                      Runner rapide : {response.fast_resource_run.status} · {response.fast_resource_run.provider} · {response.fast_resource_run.duration_ms} ms / {response.fast_resource_run.timeout_ms} ms
                    </p>
                    {response.fast_resource_run.query && (
                      <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 10, lineHeight: 1.45 }}>
                        Requete : {response.fast_resource_run.query}
                      </p>
                    )}
                    {response.fast_resource_run.include_domains && response.fast_resource_run.include_domains.length > 0 && (
                      <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 10, lineHeight: 1.45 }}>
                        Domaines : {response.fast_resource_run.include_domains.slice(0, 6).join(', ')}
                      </p>
                    )}
                    {response.fast_resource_run.note_fr && (
                      <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 10, lineHeight: 1.45 }}>
                        {response.fast_resource_run.note_fr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {response?.ok && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 16 }}>
          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>interpretation</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.interpretation?.header_domain}</h3>
            <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>{response.interpretation?.header_subject}</p>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>{response.interpretation?.domain}</p>
            {runtime && (
              <p style={{ margin: '6px 0 0', color: runtime.tone, fontSize: 11, lineHeight: 1.45 }}>
                {runtime.label} · {runtime.model}
              </p>
            )}
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>dialogue</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.dialogue?.status}</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              can generate: {response.dialogue?.can_generate ? 'oui' : 'non'}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>scoring</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.scoring?.state_index_final} / 100</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>{response.scoring?.state_label}</p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>pipeline</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.pipeline_trace?.total_duration_ms} ms</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              blocking failure: {response.pipeline_trace?.blocking_failure ? 'oui' : 'non'}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>quality</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.quality?.ok ? 'ok' : 'a verifier'}</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              issues: {response.quality?.issues?.length ?? 0}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>theatre</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>
              {(response.theatre?.actors?.length ?? 0) + (response.theatre?.institutions?.length ?? 0)} ancres
            </h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              inconnus: {response.theatre?.unknowns?.length ?? 0}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>resources</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.resources?.status ?? 'non renseigne'}</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              sources: {response.resources?.public_sources?.length ?? response.resources?.resources?.length ?? 0}
            </p>
            {response.resources?.policy && (
              <p style={{ margin: '6px 0 0', color: response.resources.needs_web ? '#A66B00' : '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                {response.resources.policy}
              </p>
            )}
            {response.resources?.policy_reason_fr && (
              <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                {response.resources.policy_reason_fr}
              </p>
            )}
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>patterns</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>
              {response.patterns?.selected_patterns?.length ?? 0} lentille(s)
            </h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              {response.patterns?.trace?.rule === 'patterns_are_lenses_not_conclusions'
                ? 'lentilles, pas conclusions'
                : 'non renseigne'}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>archive</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>
              {response.generation_archive?.archive_decision?.privacy_mode ?? 'non renseigne'}
            </h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              snapshot: {response.generation_archive?.archive_decision?.store_snapshot ? 'oui' : 'non'}
            </p>
          </div>
        </div>
      )}

      {response?.ok && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>situation soumise</p>
          <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.55 }}>
            {response.interpretation?.situation_soumise}
          </p>
        </div>
      )}

      {response?.quality?.issues && response.quality.issues.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>quality gate</p>
          {response.quality.sections_to_regenerate && response.quality.sections_to_regenerate.length > 0 && (
            <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.5 }}>
              Couche a reprendre : {response.quality.sections_to_regenerate.join(', ')}
            </p>
          )}
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#6F6255', fontSize: 12, lineHeight: 1.6 }}>
            {response.quality.issues.slice(0, 4).map((item) => (
              <li key={`${item.code}-${item.field ?? 'contract'}`}>
                <strong style={{ color: item.level === 'error' ? '#B23A3A' : '#1A2E5A' }}>{item.code}</strong>
                {' '}· {item.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response?.patterns && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
            patterns humains et collectifs
          </p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Diagnostic interne seulement : les patterns sont des lentilles, pas des conclusions publiques.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
            {[
              ['legitimer', response.patterns.dumezil_balance?.legitimize ?? 0],
              ['proteger / combattre', response.patterns.dumezil_balance?.protect_fight ?? 0],
              ['produire / reproduire', response.patterns.dumezil_balance?.produce_reproduce ?? 0],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>{label}</p>
                <p style={{ margin: '5px 0 0', color: '#1A2E5A', fontSize: 14, fontWeight: 700 }}>{value}</p>
              </div>
            ))}
          </div>
          {response.patterns.selected_patterns && response.patterns.selected_patterns.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
              {response.patterns.selected_patterns.map((pattern) => (
                <div key={pattern.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                  <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                    confiance {Math.round(pattern.confidence * 100)}%
                  </p>
                  <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{pattern.label_fr}</h3>
                  <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                    {pattern.hypothesis}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    Signal : {pattern.observable_signal}
                  </p>
                </div>
              ))}
            </div>
          )}
          {response.triad_astrolabe && response.triad_astrolabe.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
              {response.triad_astrolabe.map((item) => (
                <div
                  key={item.function_id}
                  style={{
                    border: `1px solid ${item.active ? '#D8C79B' : '#F0EBE0'}`,
                    borderRadius: 8,
                    padding: 10,
                    background: item.active ? '#FCFAF6' : '#fff',
                  }}
                >
                  <p style={{ margin: 0, color: item.active ? '#C8951A' : '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
                    astrolabe · {item.active ? 'actif' : 'veille'}
                  </p>
                  <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{item.label_fr}</h3>
                  <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>
                    Branches : {item.suggested_branches.join(', ')}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                    {item.rationale_fr}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {response?.resources?.functional_needs && response.resources.functional_needs.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
            ressources · triade de preuves
          </p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Plan de recherche passif : quelles preuves chercher pour legitimer, proteger / contester, produire / maintenir.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 10 }}>
            {response.resources.functional_needs.map((need) => (
              <div key={need.family} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                  priorite {need.priority}
                </p>
                <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{need.label_fr}</h3>
                <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                  {need.question_fr}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Canaux : {need.channels.join(', ')}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Preuves : {need.expected_evidence_fr.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {response?.recherche_plus?.radar_tasks && response.recherche_plus.radar_tasks.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
            Recherche+ · radar prepare
          </p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            {response.recherche_plus.introduction_fr}
          </p>
          <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55, fontWeight: 700 }}>
            {response.recherche_plus.product_boundary_fr}
          </p>
          <p style={{ margin: '6px 0 0', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
            acces produit : {response.recherche_plus.access_tier ?? 'iaaa_plus'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 10 }}>
            {response.recherche_plus.radar_tasks.map((task) => (
              <div key={task.family} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                  {task.signal_classes.join(' · ')}
                </p>
                <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{task.label_fr}</h3>
                <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                  {task.radar_question_fr}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Canaux : {task.channels.join(', ')}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Requetes : {task.suggested_queries.slice(0, 2).join(' · ')}
                </p>
                {task.linked_blind_spots.length > 0 && (
                  <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    Angles relies : {task.linked_blind_spots.join(', ')}
                  </p>
                )}
                <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45, fontStyle: 'italic' }}>
                  {task.caution_fr}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
            {response.recherche_plus.public_disclaimer_fr}
          </p>
        </div>
      )}

      {response?.pipeline_trace?.steps && response.pipeline_trace.steps.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>budget vitesse</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Lecture rapide du temps public : vert dans le budget, orange limite, rouge trop lent.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
            {speedItems.map((item) => {
              const tone = speedTone(item.duration, item.budget)
              return (
                <div key={item.id} style={{ border: `1px solid ${tone}`, borderRadius: 8, padding: 10, background: tone === '#1D9E75' ? '#F4FBF8' : tone === '#A66B00' ? '#FFF8E8' : '#FFF4F4' }}>
                  <p style={{ margin: 0, color: '#1A2E5A', fontSize: 12, fontWeight: 700 }}>{item.label}</p>
                  <p style={{ margin: '6px 0 0', color: tone, fontSize: 14, fontWeight: 800 }}>
                    {item.duration} / {item.budget} ms
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#6F6255', fontSize: 11 }}>
                    {speedLabel(item.duration, item.budget)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {response?.pipeline_trace?.steps && response.pipeline_trace.steps.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>diagnostic par couche</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Ce tableau sert a eviter les patchs de cas : chaque symptome est rattache a la couche canonique qui le produit.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
            {response.pipeline_trace.steps.map((step) => (
              <div key={step.stage_id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#fff' }}>
                <p style={{ margin: 0, color: '#1A2E5A', fontFamily: 'monospace', fontSize: 11 }}>
                  {layerLabel(step.stage_id)}
                </p>
                <p style={{ margin: '6px 0 0', color: outcomeColor(step.outcome), fontSize: 12, fontWeight: 700 }}>
                  {step.outcome} · {step.duration_ms}/{step.budget_ms} ms
                </p>
                {step.over_budget && (
                  <p style={{ margin: '6px 0 0', color: '#B23A3A', fontSize: 11 }}>
                    Hors budget de latence.
                  </p>
                )}
                {step.warnings && step.warnings.length > 0 && (
                  <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    {step.warnings[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sharpDiamond?.text_fr && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
            diamant tranchant
          </p>
          <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 15, lineHeight: 1.45, fontStyle: 'italic' }}>
            {sharpDiamond.text_fr}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <span style={{ border: '1px solid #D8C79B', borderRadius: 999, padding: '5px 8px', color: '#1A2E5A', fontSize: 11 }}>
              style : {sharpDiamond.style ?? 'diamond'}
            </span>
            <span style={{ border: '1px solid #F0EBE0', borderRadius: 999, padding: '5px 8px', color: '#6F6255', fontSize: 11 }}>
              {sharpDiamond.text_fr.length} caracteres
            </span>
            <span style={{ border: '1px solid #F0EBE0', borderRadius: 999, padding: '5px 8px', color: '#6F6255', fontSize: 11 }}>
              role : {sharpDiamond.role}
            </span>
          </div>
          {sharpDiamondIssues.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {sharpDiamondIssues.map((item) => (
                <p key={item.code} style={{ margin: '5px 0 0', color: item.level === 'error' ? '#B23A3A' : '#A66B00', fontSize: 11, lineHeight: 1.45 }}>
                  {item.code} · {item.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {response?.writing?.situation_card && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>writing contract</p>
          <h3 style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 14 }}>
            {response.writing.situation_card.title_fr}
          </h3>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            {response.writing.situation_card.insight_fr}
          </p>
          <p style={{ margin: '10px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
            <strong>Vulnerabilite :</strong> {response.writing.situation_card.main_vulnerability_fr}
          </p>
          <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
            <strong>Signal :</strong> {response.writing.situation_card.key_signal_fr}
          </p>
          {response.writing.diamond_sentences?.[0]?.text_fr && (
            <p style={{ margin: '10px 0 0', color: '#C8951A', fontSize: 13, lineHeight: 1.45, fontStyle: 'italic' }}>
              {response.writing.diamond_sentences[0].text_fr}
            </p>
          )}
        </div>
      )}

      {response?.writing_benchmark?.checks && response.writing_benchmark.checks.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>benchmark writing</p>
          <p style={{ margin: '8px 0 0', color: response.writing_benchmark.verdict === 'pass' ? '#1D9E75' : '#A66B00', fontSize: 12, fontWeight: 700 }}>
            {response.writing_benchmark.passed}/{response.writing_benchmark.total} · {response.writing_benchmark.verdict}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
            {response.writing_benchmark.checks.map((check) => (
              <div key={check.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: check.passed ? '#1D9E75' : '#B23A3A', fontFamily: 'monospace', fontSize: 10 }}>
                  {check.passed ? 'PASS' : 'REVIEW'}
                </p>
                <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>{check.label_fr}</h3>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>{check.detail_fr}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {response?.writing?.lecture?.text_fr && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>lecture minimale</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.6 }}>
            {response.writing.lecture.text_fr}
          </p>
          <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11 }}>
            {response.writing.lecture.word_count_fr ?? 0} mots
          </p>
        </div>
      )}

      {response?.generation_archive?.event && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>generation event</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Trace mesurable sans contenu brut : hash input, taille, domaine, intention, ressources, qualite et latence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
            {[
              ['mode', response.generation_archive.event.privacy_mode],
              ['hash', response.generation_archive.event.raw_input_hash],
              ['input', `${response.generation_archive.event.input_chars ?? 0} chars`],
              ['sources', String(response.generation_archive.event.resources_count ?? 0)],
              ['status', response.generation_archive.event.generation_status],
              ['latence', `${response.generation_archive.event.latency_ms ?? 0} ms`],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>{label}</p>
                <p style={{ margin: '5px 0 0', color: '#1A2E5A', fontSize: 12 }}>{value}</p>
              </div>
            ))}
          </div>
          {response.generation_archive.archive_decision?.reason && (
            <p style={{ margin: '10px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
              {response.generation_archive.archive_decision.reason}
            </p>
          )}
        </div>
      )}

      {firstBlindSpots.length > 0 && (
        <>
          <div style={{ marginTop: 14, ...miniCardStyle() }}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
              angles morts integres a la reponse
            </p>
            <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
              Ces pistes ne sont pas une enquete externe. Elles sont la matiere que SC doit integrer dans Lecture
              et Approfondir : ce qui manque, ce qui ferait changer la conclusion, et quelle preuve chercher.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
            {firstBlindSpots.map((blindSpot) => (
              <div key={blindSpot.blind_spot} style={miniCardStyle()}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
                  contrat admin · {inquiryLevelLabel(blindSpot.level)}
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{blindSpot.blind_spot}</h3>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.45 }}>
                  {publicInquiryQuestion(blindSpot.blind_spot)}
                </p>
                <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Preuve attendue : {blindSpot.decisive_evidence}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              data-testid="generate-v2-evidence-search-button"
              onClick={runRecherchePlusPreview}
              disabled={!response?.recherche_plus || recherchePlusLoading}
              style={{
                border: '1px solid #C8951A',
                color: evidenceSearchRequested ? '#fff' : '#1A2E5A',
                background: recherchePlusLoading ? '#8B8174' : evidenceSearchRequested ? '#1A2E5A' : '#fff',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                cursor: recherchePlusLoading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: evidenceSearchRequested ? '0 0 0 3px rgba(200, 149, 26, 0.14)' : 'none',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `1px solid ${evidenceSearchRequested ? 'rgba(248,239,216,0.9)' : 'rgba(200,149,26,0.9)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  animation: 'recherchePlusFloat 2.8s ease-in-out infinite',
                  flex: '0 0 auto',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: `1px solid ${evidenceSearchRequested ? 'rgba(248,239,216,0.45)' : 'rgba(200,149,26,0.35)'}`,
                    animation: 'recherchePlusPulse 2.4s ease-out infinite',
                  }}
                />
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: evidenceSearchRequested ? '#F8EFD8' : '#C8951A',
                    boxShadow: `0 0 8px ${evidenceSearchRequested ? 'rgba(248,239,216,0.55)' : 'rgba(200,149,26,0.35)'}`,
                  }}
                />
              </span>
              {recherchePlusLoading ? 'Recherche+ en cours' : 'Lancer Recherche+'}
            </button>
            <span style={{ marginLeft: 10, color: '#8B8174', fontSize: 12 }}>
              {recherchePlusResult
                ? `${recherchePlusResult.findings?.length ?? 0} piste(s) simulee(s) retournee(s).`
                : evidenceSearchRequested
                  ? 'Radar ouvert : simulation sans appel web.'
                : 'future enquete web / sources, separee de SC, Lecture et Approfondir'}
            </span>
          </div>

          {recherchePlusError && (
            <p style={{ margin: '10px 0 0', color: '#B23A3A', fontSize: 12 }}>
              {recherchePlusError}
            </p>
          )}

          {evidenceSearchRequested && response?.recherche_plus?.targets && response.recherche_plus.targets.length > 0 && (
            <div style={{ marginTop: 12, ...miniCardStyle() }}>
              <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
                Recherche+ · preuves a chercher
              </p>
              <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
                Ce panneau simule le depart de l enquete : il liste les cibles probatoires, les canaux autorises
                et la preuve attendue. Aucun resultat externe n est encore integre.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 10 }}>
                {response.recherche_plus.targets.map((target) => (
                  <div key={target.blind_spot} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                    <h3 style={{ margin: 0, color: '#1A2E5A', fontSize: 13 }}>{target.blind_spot}</h3>
                    <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                      {target.question}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                      Preuve : {target.expected_evidence}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                      Canaux : {target.allowed_channels.join(', ')}
                    </p>
                    {target.safety_note && (
                      <p style={{ margin: '6px 0 0', color: '#A66B00', fontSize: 11, lineHeight: 1.45 }}>
                        {target.safety_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recherchePlusResult?.findings && recherchePlusResult.findings.length > 0 && (
            <div style={{ marginTop: 12, ...miniCardStyle() }}>
              <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
                Recherche+ · findings simules
              </p>
              <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
                Resultats typés pour tester le flux. Ils ne prouvent rien encore et restent separes de la reponse publique.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 10 }}>
                {recherchePlusResult.findings.map((finding) => (
                  <div key={`${finding.target_blind_spot}-${finding.status}`} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                    <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                      {finding.status} · {finding.channel}
                    </p>
                    <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{finding.source_title}</h3>
                    <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                      {finding.what_it_suggests}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                      Ne prouve pas : {finding.what_it_does_not_prove}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 11, lineHeight: 1.45 }}>
                      Suite : {finding.next_verification_step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
