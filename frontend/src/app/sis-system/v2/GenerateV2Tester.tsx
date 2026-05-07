'use client'

import { useMemo, useState } from 'react'

type GenerateV2Response = {
  ok?: boolean
  mode?: string
  total_duration_ms?: number
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
  }
  scoring?: {
    state_index_final?: number
    state_label?: string
  }
  inquiry?: {
    blind_spots?: Array<{
      blind_spot: string
      level: string
      decisive_evidence: string
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
    }>
  }
  error?: string
  message?: string
}

const EXAMPLES = [
  'Trump peut-il contester les resultats des elections de mi-mandat ?',
  "Que fait la compagnie FlexUp et qu'en penser pour eventuellement la rejoindre avec ma startup ?",
  "Mon fils de 14 ans est passionne par la peche a la carpe, comment reagir apres son retrait dans la voiture ?",
]

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

export default function GenerateV2Tester() {
  const [input, setInput] = useState(EXAMPLES[0])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<GenerateV2Response | null>(null)
  const [error, setError] = useState<string | null>(null)

  const firstBlindSpots = useMemo(
    () => response?.inquiry?.blind_spots?.slice(0, 3) ?? [],
    [response],
  )

  async function runTest() {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await fetch('/api/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const payload = await result.json()
      setResponse(payload)
      if (!result.ok) setError(payload?.message ?? payload?.error ?? 'Erreur generate-v2')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={panelStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Banc d essai generate-v2</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Teste la route V2 separee. Elle retourne les contrats, pas encore une Situation Card finale.
          </p>
        </div>
        <button
          type="button"
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
          {loading ? 'Test en cours' : 'Tester generate-v2'}
        </button>
      </div>

      <textarea
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

      {error && (
        <p style={{ color: '#B23A3A', fontSize: 13, marginTop: 12 }}>
          {error}
        </p>
      )}

      {response?.ok && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 16 }}>
          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>interpretation</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.interpretation?.header_domain}</h3>
            <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>{response.interpretation?.header_subject}</p>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>{response.interpretation?.domain}</p>
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

      {firstBlindSpots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
          {firstBlindSpots.map((blindSpot) => (
            <div key={blindSpot.blind_spot} style={miniCardStyle()}>
              <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>{blindSpot.level}</p>
              <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{blindSpot.blind_spot}</h3>
              <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>{blindSpot.decisive_evidence}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
