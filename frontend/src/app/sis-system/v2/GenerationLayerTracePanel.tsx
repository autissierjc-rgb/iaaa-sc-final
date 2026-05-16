'use client'

import { useEffect, useMemo, useState } from 'react'

type TraceStatus = 'ok' | 'partial' | 'error'
type TraceGate = 'GENERATE' | 'CLARIFY' | 'REFINE_OPTIONAL' | 'ERROR'

type LayerTraceExample = {
  id: string
  status: TraceStatus
  gate: TraceGate
  canonicalLayer: string
  pipelineStep: string
  diagnostic: string
  durationMs: number
  route: string
  at?: string
}

type TraceResponse = {
  ok?: boolean
  mode?: string
  summary?: {
    total?: number
    byLayer?: Record<string, number>
    byGate?: Record<string, number>
    latest_at?: string
  }
  traces?: LayerTraceExample[]
  error?: string
}

const TRACE_EXAMPLES: LayerTraceExample[] = [
  {
    id: 'trace-security',
    status: 'error',
    gate: 'ERROR',
    canonicalLayer: 'security',
    pipelineStep: 'SecurityAbuseGuard',
    diagnostic: 'prompt_injection',
    durationMs: 18,
    route: '/api/generate',
  },
  {
    id: 'trace-dialogue',
    status: 'partial',
    gate: 'CLARIFY',
    canonicalLayer: 'dialogue',
    pipelineStep: 'SituationReadinessGate',
    diagnostic: 'strategic_options_missing',
    durationMs: 740,
    route: '/api/generate',
  },
  {
    id: 'trace-quality',
    status: 'partial',
    gate: 'CLARIFY',
    canonicalLayer: 'quality',
    pipelineStep: 'DiamondValidation',
    diagnostic: 'public_scaffolding | generic_phrase',
    durationMs: 5200,
    route: '/api/generate',
  },
  {
    id: 'trace-writing',
    status: 'partial',
    gate: 'GENERATE',
    canonicalLayer: 'writing',
    pipelineStep: 'modelCardFallback',
    diagnostic: 'model_generation_failed_local_contract_used',
    durationMs: 6100,
    route: '/api/generate',
  },
  {
    id: 'trace-ok',
    status: 'ok',
    gate: 'GENERATE',
    canonicalLayer: 'archive',
    pipelineStep: 'GenerationTelemetry',
    diagnostic: 'generated_card',
    durationMs: 4300,
    route: '/api/generate',
  },
]

function colorFor(status: TraceStatus) {
  if (status === 'error') return '#B23A3A'
  if (status === 'partial') return '#C8951A'
  return '#1D9E75'
}

export default function GenerationLayerTracePanel() {
  const [result, setResult] = useState<TraceResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setBusy(true)
    try {
      const response = await fetch('/api/generation-traces', { cache: 'no-store' })
      setResult(await response.json())
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const visibleTraces = useMemo(
    () => (result?.traces?.length ? result.traces : TRACE_EXAMPLES),
    [result],
  )

  const layerCounts = visibleTraces.reduce<Record<string, number>>((acc, trace) => {
    acc[trace.canonicalLayer] = (acc[trace.canonicalLayer] ?? 0) + 1
    return acc
  }, {})
  const isLive = Boolean(result?.traces?.length)

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Diagnostic par couche canonique</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            La route publique trace maintenant la couche qui parle : clarification, securite, qualite, fallback ou
            generation valide. Le cockpit peut donc identifier la brique responsable au lieu de corriger un cas a la main.
          </p>
        </div>
        <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8 }}>
          <div><strong style={{ color: '#1A2E5A' }}>{visibleTraces.length}</strong> traces {isLive ? 'reelles' : 'exemple'}</div>
          <div><strong style={{ color: '#1A2E5A' }}>{Object.keys(layerCounts).length}</strong> couches visibles</div>
          <div><strong style={{ color: '#C8951A' }}>metadata only</strong> sans texte brut</div>
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            style={{ marginTop: 8, border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}
          >
            {busy ? 'Lecture...' : 'Rafraichir'}
          </button>
        </div>
      </div>

      <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '12px 0 0' }}>
        Source : {isLive ? `/api/generation-traces · ${result?.mode}` : 'exemples cockpit en attente de generations reelles'}.
        {result?.summary?.latest_at ? ` Derniere trace : ${result.summary.latest_at}.` : ''}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 16 }}>
        {Object.entries(layerCounts).map(([layer, count]) => (
          <div key={layer} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#FCFAF6' }}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>canonicalLayer</p>
            <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{layer}</h3>
            <p style={{ margin: '7px 0 0', color: '#8B8174', fontSize: 11 }}>{count} trace(s) rattachee(s)</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, marginTop: 12 }}>
        {visibleTraces.map((trace) => (
          <article key={trace.id} style={{ border: '1px solid #E1D6C2', borderRadius: 8, padding: 12, background: '#fff' }}>
            <p style={{ margin: 0, color: colorFor(trace.status), fontFamily: 'monospace', fontSize: 10 }}>
              {trace.status} · {trace.gate} · {trace.durationMs} ms
            </p>
            <h3 style={{ margin: '7px 0 0', color: '#1A2E5A', fontSize: 13 }}>{trace.canonicalLayer}</h3>
            <p style={{ margin: '7px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.45 }}>
              {trace.pipelineStep}
            </p>
            <p style={{ margin: '7px 0 0', color: '#8B8174', fontFamily: 'monospace', fontSize: 10, lineHeight: 1.45 }}>
              diagnostic: {trace.diagnostic}
            </p>
            <p style={{ margin: '7px 0 0', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
              {trace.route}
            </p>
            {trace.at ? (
              <p style={{ margin: '7px 0 0', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
                {trace.at}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
