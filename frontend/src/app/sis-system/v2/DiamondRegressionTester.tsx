'use client'

import { useState } from 'react'

type RegressionIssue = {
  level: string
  code: string
  message: string
}

type RegressionResult = {
  case_id: string
  ok: boolean
  domain: string
  playbook: string
  duration_ms: number
  issues: RegressionIssue[]
}

type RegressionResponse = {
  ok: boolean
  status: string
  total_cases: number
  failed_cases: number
  warning_count: number
  duration_ms: number
  results: RegressionResult[]
}

function toneFor(status: string) {
  if (status === 'ok') return '#1D9E75'
  if (status === 'warning') return '#A66B00'
  return '#B23A3A'
}

export default function DiamondRegressionTester() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState<RegressionResponse | null>(null)

  async function runRegressions() {
    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const result = await fetch('/api/diamond-regressions', { method: 'POST' })
      const payload = await result.json()
      if (!result.ok) throw new Error(payload?.message ?? 'Regression route failed.')
      setResponse(payload)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const tone = toneFor(response?.status ?? 'ok')

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Runner non-regression</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Execute les cas canoniques via generate-v2, puis applique DiamondRegressionRunner sur les cartes produites. Chaque cas est borne : un timeout devient un echec visible du benchmark.
          </p>
        </div>
        <button
          type="button"
          onClick={runRegressions}
          disabled={loading}
          style={{
            border: '1px solid #C8951A',
            color: '#1A2E5A',
            background: loading ? '#F0EBE0' : '#F8EFD8',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Tests en cours' : 'Lancer non-regressions'}
        </button>
      </div>

      {error && <p style={{ color: '#B23A3A', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}

      {response && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8, marginBottom: 12 }}>
            <strong style={{ color: tone }}>{response.status}</strong> · {response.total_cases} cas · {response.failed_cases} echec(s) · {response.warning_count} warning(s) · {response.duration_ms} ms
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {response.results.map((result) => {
              const resultTone = result.ok ? '#1D9E75' : '#B23A3A'
              return (
                <div key={result.case_id} style={{ border: `1px solid ${resultTone}`, borderRadius: 8, padding: 10, background: result.ok ? '#F4FBF8' : '#FFF4F4' }}>
                  <p style={{ margin: 0, color: resultTone, fontSize: 12, fontWeight: 800 }}>
                    {result.ok ? 'OK' : 'A corriger'} · {result.case_id}
                  </p>
                  <p style={{ margin: '5px 0 0', color: '#6F6255', fontSize: 11 }}>
                    domaine {result.domain} · playbook {result.playbook} · {result.duration_ms} ms
                  </p>
                  {result.issues.length > 0 && (
                    <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                      {result.issues.slice(0, 3).map((issue) => issue.code).join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
