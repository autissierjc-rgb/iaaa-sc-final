'use client'

import { useState } from 'react'

type ReactionV2Response = {
  ok?: boolean
  mode?: string
  reaction?: {
    message_hash: string
    message_chars: number
    probable_layers: string[]
    reaction_kind: string
    intensity: number
    evidence_terms: string[]
    privacy_mode: string
  }
  error?: string
  message?: string
}

const REACTION_EXAMPLES = [
  'Le header ne formalise pas la question.',
  'Waouh, le diamant tranchant touche juste.',
  'Les ressources sont trop pauvres pour ce sujet.',
  'Pourquoi le scoring met 49 alors que la crise est forte ?',
]

function miniCardStyle(): React.CSSProperties {
  return {
    border: '1px solid #F0EBE0',
    borderRadius: 8,
    padding: 12,
    background: '#FCFAF6',
  }
}

export default function ReactionV2Tester() {
  const [message, setMessage] = useState(REACTION_EXAMPLES[0])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ReactionV2Response | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runReactionTest() {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await fetch('/api/reactions-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const payload = await result.json()
      setResponse(payload)
      if (!result.ok || !payload?.ok) {
        setError(payload?.message ?? payload?.error ?? 'Erreur reactions-v2')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Test reaction utilisateur</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Appelle <span style={{ fontFamily: 'monospace' }}>/api/reactions-v2</span> et verifie quelle couche canonique
            semble provoquer la reaction. Le texte brut n est pas conserve.
          </p>
        </div>
        <button
          type="button"
          onClick={runReactionTest}
          disabled={loading || message.trim().length === 0}
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
          {loading ? 'Analyse...' : 'Analyser reaction'}
        </button>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={2}
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
        {REACTION_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setMessage(example)}
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

      {response?.reaction && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 14 }}>
          {[
            ['type', response.reaction.reaction_kind],
            ['intensite', String(response.reaction.intensity)],
            ['couches', response.reaction.probable_layers.join(', ')],
            ['termes', response.reaction.evidence_terms.length > 0 ? response.reaction.evidence_terms.join(', ') : 'aucun terme direct'],
            ['privacy', response.reaction.privacy_mode],
            ['hash', `${response.reaction.message_hash} · ${response.reaction.message_chars} chars`],
          ].map(([label, value]) => (
            <div key={label} style={miniCardStyle()}>
              <p style={{ margin: 0, color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>{label}</p>
              <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.45 }}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
