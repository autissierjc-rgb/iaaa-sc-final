'use client'

import { useState } from 'react'
import type { CtoWatchMetricInput, CtoWatchSeverity } from '@/lib/contracts/ctoWatch'

type CtoWatchResponse = {
  ok?: boolean
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
    { id: 'estimated_hourly_cost_eur', value: 18 },
    { id: 'shared_card_cache_hit_rate', value: 0.97 },
  ],
  tension: [
    { id: 'public_fast_p95_ms', value: 5600 },
    { id: 'generation_error_rate', value: 0.018 },
    { id: 'missing_required_sources_rate', value: 0.035 },
    { id: 'fallback_rate', value: 0.12 },
    { id: 'provider_error_rate', value: 0.025 },
    { id: 'estimated_hourly_cost_eur', value: 62 },
    { id: 'shared_card_cache_hit_rate', value: 0.88 },
  ],
  critique: [
    { id: 'public_fast_p95_ms', value: 7200 },
    { id: 'generation_error_rate', value: 0.041 },
    { id: 'missing_required_sources_rate', value: 0.07 },
    { id: 'fallback_rate', value: 0.3 },
    { id: 'provider_error_rate', value: 0.065 },
    { id: 'estimated_hourly_cost_eur', value: 135 },
    { id: 'shared_card_cache_hit_rate', value: 0.71 },
  ],
}

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
                Canaux : {report.alert_channels?.join(', ')}
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
