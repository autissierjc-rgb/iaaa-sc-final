'use client'

/**
 * IAAA · InvestigationPanel
 *
 * Displayed on /generate when investigation_mode = true.
 * Shows causal scenarios and verification matrix.
 * Ephemeral — never shown on /sc/[slug].
 *
 * Visual language: amber/warning — signals elevated scrutiny needed.
 */

import type { CausalScenario, VerificationItem } from '@/types/generate'

interface Props {
  causalScenarios:    CausalScenario[]   | null
  verificationMatrix: VerificationItem[] | null
  contextSources?:    string[]           | null
}

const PLAUSIBILITY_COLOR: Record<string, string> = {
  high:   'rgba(196,130,90,0.9)',
  medium: 'rgba(196,168,130,0.7)',
  low:    'rgba(130,130,130,0.6)',
}

export default function InvestigationPanel({
  causalScenarios,
  verificationMatrix,
  contextSources,
}: Props) {
  if (!causalScenarios?.length && !verificationMatrix?.length) return null

  return (
    <div
      className="rounded-[2px] overflow-hidden"
      style={{
        border:     '1px solid rgba(196,130,90,0.3)',
        background: 'rgba(196,130,90,0.04)',
        marginTop:  '1rem',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{
          borderBottom: '1px solid rgba(196,130,90,0.15)',
          background:   'rgba(196,130,90,0.06)',
        }}
      >
        <span style={{ fontSize: '0.8rem' }}>⚑</span>
        <div>
          <p
            className="label-eyebrow"
            style={{ fontSize: '0.56rem', color: 'rgba(196,130,90,0.9)', letterSpacing: '0.14em' }}
          >
            Investigation Mode
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)', fontWeight: 300, marginTop: '0.1rem' }}
          >
            Contested facts or hidden actors detected — multiple readings required
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">

        {/* Context sources */}
        {contextSources && contextSources.length > 0 && (
          <div>
            <p
              className="label-eyebrow mb-2"
              style={{ fontSize: '0.52rem', opacity: 0.5 }}
            >
              Sources consulted
            </p>
            <div className="flex flex-col gap-1">
              {contextSources.slice(0, 5).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs truncate"
                  style={{
                    color:       'rgba(196,168,130,0.6)',
                    fontFamily:  'var(--font-geist-mono, monospace)',
                    fontSize:    '0.58rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {url.replace(/^https?:\/\//, '')}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Causal scenarios */}
        {causalScenarios && causalScenarios.length > 0 && (
          <div>
            <p
              className="label-eyebrow mb-3"
              style={{ fontSize: '0.52rem', opacity: 0.5 }}
            >
              Causal scenarios
            </p>
            <div className="flex flex-col gap-3">
              {causalScenarios.map((s) => (
                <div
                  key={s.scenario_id}
                  className="px-4 py-3 rounded-[2px]"
                  style={{
                    background: 'rgba(196,130,90,0.04)',
                    border:     '1px solid rgba(196,130,90,0.12)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {s.scenario_id} — {s.title}
                    </p>
                    <span
                      className="text-xs"
                      style={{
                        color:      PLAUSIBILITY_COLOR[s.plausibility] ?? 'var(--text-muted)',
                        fontSize:   '0.56rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.plausibility}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed mb-2"
                    style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
                  >
                    {s.description}
                  </p>
                  {s.causal_logic && (
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 300 }}
                    >
                      {s.causal_logic}
                    </p>
                  )}
                  {s.actors_involved?.length > 0 && (
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}
                    >
                      Actors: {s.actors_involved.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification matrix */}
        {verificationMatrix && verificationMatrix.length > 0 && (
          <div>
            <p
              className="label-eyebrow mb-3"
              style={{ fontSize: '0.52rem', opacity: 0.5 }}
            >
              Verification required
            </p>
            <div className="flex flex-col gap-3">
              {verificationMatrix.map((v, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-[2px]"
                  style={{
                    background: 'rgba(106,130,196,0.04)',
                    border:     '1px solid rgba(106,130,196,0.12)',
                  }}
                >
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {v.question}
                  </p>
                  <p
                    className="text-xs leading-relaxed mb-1.5"
                    style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
                  >
                    {v.why_it_matters}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}
                  >
                    Verify via: {v.who_can_verify}
                  </p>
                  {v.compromised_sources?.length > 0 && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'rgba(196,106,106,0.7)', fontSize: '0.56rem' }}
                    >
                      ⚠ Compromised: {v.compromised_sources.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
