'use client'

import { useState } from 'react'
import type { RenChatResponseContract } from '@/lib/contracts'

type RenChatApiResponse = {
  ok?: boolean
  mode?: string
  ren?: RenChatResponseContract
  error?: string
  message?: string
}

const REN_EXAMPLES = [
  'Mon associe devient distant et je sens qu il prepare quelque chose.',
  'Challenge REN : est-ce que cette crise est vraiment institutionnelle ou seulement mediatique ?',
  'Mon fils de 14 ans se replie dans la voiture apres une sortie peche.',
  'Que fait FlexUp et que dois-je verifier avant de rejoindre avec ma startup ?',
]

function cardStyle(): React.CSSProperties {
  return {
    border: '1px solid #F0EBE0',
    borderRadius: 8,
    padding: 12,
    background: '#FCFAF6',
  }
}

export default function RenChatTester() {
  const [message, setMessage] = useState(REN_EXAMPLES[0])
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<RenChatApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runRenChat() {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await fetch('/api/ren-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: 'fr' }),
      })
      const payload = (await result.json()) as RenChatApiResponse
      setResponse(payload)
      if (!result.ok || !payload.ok) {
        setError(payload.message ?? payload.error ?? 'Erreur ren-chat')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const ren = response?.ren

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>REN chat orchestrator</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Teste <span style={{ fontFamily: 'monospace' }}>/api/ren-chat</span> : le chat explore, la fleche envoie,
            la boussole genere la carte. REN peut inviter a cliquer la boussole, sans generer automatiquement.
          </p>
        </div>
        <button
          type="button"
          onClick={runRenChat}
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
          {loading ? 'REN...' : 'Tester REN'}
        </button>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
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
        {REN_EXAMPLES.map((example) => (
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

      {error && <p style={{ color: '#B23A3A', fontSize: 13, marginTop: 12 }}>{error}</p>}

      {ren && (
        <>
          <div style={{ border: '1px solid #D8CBB5', borderRadius: 8, padding: 14, background: '#fff', marginTop: 14 }}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
              {ren.ren_mode} · {ren.suggested_next_action}
            </p>
            <p style={{ margin: '8px 0 0', color: '#1A2E5A', lineHeight: 1.55, fontSize: 13 }}>{ren.answer}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 14 }}>
            {[
              ['acteurs', ren.working_context.actors.join(', ') || 'a preciser'],
              ['contraintes', ren.working_context.constraints.join(', ') || 'a preciser'],
              ['manques', ren.missing_context.join(', ') || 'aucun'],
              ['ready_for_card', ren.working_context.ready_for_card ? 'oui' : 'non'],
              ['safety', ren.safety?.domain_risk ?? 'none'],
              ['security', ren.security?.risk_level ?? 'none'],
              ['latence', `${ren.trace.duration_ms ?? 0} ms`],
            ].map(([label, value]) => (
              <div key={label} style={cardStyle()}>
                <p style={{ margin: 0, color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>{label}</p>
                <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.45 }}>{value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
