'use client'

import { useState } from 'react'
import type { GenerationEvent } from '@/lib/contracts/generationArchive'
import type { CtoWatchMetricInput, CtoWatchSeverity } from '@/lib/contracts/ctoWatch'

type CtoWatchResponse = {
  ok?: boolean
  mode?: string
  metrics?: CtoWatchMetricInput[]
  report?: {
    status?: CtoWatchSeverity
    should_alert?: boolean
    alert_channels?: string[]
    evaluations?: Array<{
      id?: string
      label_fr?: string
      value?: number
      unit?: string
      severity?: CtoWatchSeverity
      message_fr?: string
    }>
    recommended_actions?: string[]
    guardrails?: string[]
  }
  error?: string
}

const SCENARIOS: Record<string, CtoWatchMetricInput[]> = {
  normal: [
    { id: 'public_fast_p95_ms', value: 4200 },
    { id: 'generation_error_rate', value: 0.008 },
    { id: 'missing_required_sources_rate', value: 0.01 },
    { id: 'fallback_rate', value: 0.04 },
    { id: 'provider_error_rate', value: 0.006 },
    { id: 'security_block_rate', value: 0.004 },
    { id: 'estimated_hourly_cost_eur', value: 18 },
    { id: 'shared_card_cache_hit_rate', value: 0.97 },
  ],
  tension: [
    { id: 'public_fast_p95_ms', value: 5600 },
    { id: 'generation_error_rate', value: 0.018 },
    { id: 'missing_required_sources_rate', value: 0.035 },
    { id: 'fallback_rate', value: 0.12 },
    { id: 'provider_error_rate', value: 0.025 },
    { id: 'security_block_rate', value: 0.018 },
    { id: 'estimated_hourly_cost_eur', value: 62 },
    { id: 'shared_card_cache_hit_rate', value: 0.88 },
  ],
  critique: [
    { id: 'public_fast_p95_ms', value: 7200 },
    { id: 'generation_error_rate', value: 0.041 },
    { id: 'missing_required_sources_rate', value: 0.07 },
    { id: 'fallback_rate', value: 0.3 },
    { id: 'provider_error_rate', value: 0.065 },
    { id: 'security_block_rate', value: 0.06 },
    { id: 'estimated_hourly_cost_eur', value: 135 },
    { id: 'shared_card_cache_hit_rate', value: 0.71 },
  ],
}

const SAMPLE_EVENTS: GenerationEvent[] = [
  {
    id: 'gen_watch_1',
    created_at: new Date('2026-05-10T00:00:00.000Z').toISOString(),
    language: 'fr',
    surface: 'situation_card',
    privacy_mode: 'metadata_only',
    input_chars: 72,
    resources_status: 'ok',
    resources_count: 3,
    quality_status: 'ok',
    generation_status: 'ok',
    latency_ms: 4200,
    trace: [{ service: 'interpretation', version: 'v2', duration_ms: 900, status: 'ok' }],
  },
  {
    id: 'gen_watch_2',
    created_at: new Date('2026-05-10T00:01:00.000Z').toISOString(),
    language: 'fr',
    surface: 'situation_card',
    privacy_mode: 'metadata_only',
    input_chars: 93,
    resources_status: 'partial',
    resources_count: 0,
    quality_status: 'partial',
    generation_status: 'ok',
    latency_ms: 7100,
    trace: [{ service: 'resources', version: 'v2', duration_ms: 1300, status: 'partial', notes: ['required sources missing'] }],
  },
  {
    id: 'gen_watch_3',
    created_at: new Date('2026-05-10T00:02:00.000Z').toISOString(),
    language: 'fr',
    surface: 'situation_card',
    privacy_mode: 'metadata_only',
    input_chars: 65,
    resources_status: 'ok',
    resources_count: 2,
    quality_status: 'partial',
    generation_status: 'partial',
    latency_ms: 6800,
    error_kind: 'provider_fallback',
    trace: [{ service: 'writing', version: 'v2', duration_ms: 3900, status: 'partial', notes: ['fallback local contract'] }],
  },
  {
    id: 'gen_watch_4',
    created_at: new Date('2026-05-10T00:03:00.000Z').toISOString(),
    language: 'fr',
    surface: 'situation_card',
    privacy_mode: 'metadata_only',
    input_chars: 4000,
    resources_status: 'ok',
    resources_count: 0,
    quality_status: 'error',
    generation_status: 'error',
    latency_ms: 120,
    error_kind: 'security:prompt_injection',
    trace: [{ service: 'security', version: 'v2', duration_ms: 12, status: 'error', notes: ['security_abuse_guard block'] }],
  },
]

function colorFor(status?: CtoWatchSeverity) {
  if (status === 'critical') return '#B23A3A'
  if (status === 'watch') return '#C8951A'
  return '#1D9E75'
}

export default function CtoWatchTester() {
  const [result, setResult] = useState<CtoWatchResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(scenario: keyof typeof SCENARIOS) {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/cto-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: SCENARIOS[scenario] }),
      })
      setResult(await response.json())
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' })
    } finally {
      setBusy(false)
    }
  }

  async function runFromEvents() {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/cto-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: SAMPLE_EVENTS,
          estimated_hourly_cost_eur: 72,
          shared_card_cache_hit_rate: 0.86,
        }),
      })
      setResult(await response.json())
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' })
    } finally {
      setBusy(false)
    }
  }

  const report = result?.report

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>CTO Watch</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Veille passive des seuils critiques : latence, cout, erreurs, fallback, sources et cache. Une alerte critique
            doit proteger SIS avant que le trafic ne brule le moteur.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {Object.keys(SCENARIOS).map((scenario) => (
            <button
              key={scenario}
              type="button"
              onClick={() => run(scenario)}
              disabled={busy}
              style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
            >
              {scenario}
            </button>
          ))}
          <button
            type="button"
            onClick={runFromEvents}
            disabled={busy}
            style={{ border: '1px solid #1A2E5A', background: '#F5F8FF', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            depuis events
          </button>
        </div>
      </div>

      {busy ? (
        <p style={{ color: '#8B8174', fontSize: 12, marginTop: 14 }}>Evaluation CTO Watch...</p>
      ) : null}

      {result ? (
        <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
          <p style={{ margin: 0, color: colorFor(report?.status), fontWeight: 700 }}>
            {result.ok ? `Statut : ${report?.status} · alerte : ${report?.should_alert ? 'oui' : 'non'}` : `Erreur : ${result.error}`}
          </p>
          {report ? (
            <>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Mode : {result.mode} · Canaux : {report.alert_channels?.join(', ')}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Metriques : {result.metrics?.map((metric) => `${metric.id}=${metric.value}`).join(' · ')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 10 }}>
                {report.evaluations?.map((evaluation) => (
                  <div key={evaluation.id} style={{ border: '1px solid #E1D6C2', borderRadius: 8, padding: 10, background: '#fff' }}>
                    <p style={{ margin: 0, color: colorFor(evaluation.severity), fontSize: 12, fontWeight: 700 }}>
                      {evaluation.label_fr} · {evaluation.severity}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.4 }}>{evaluation.message_fr}</p>
                  </div>
                ))}
              </div>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '10px 0 0' }}>
                Actions : {report.recommended_actions?.length ? report.recommended_actions.join(' | ') : 'aucune'}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Gardes : {report.guardrails?.join(' · ')}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
