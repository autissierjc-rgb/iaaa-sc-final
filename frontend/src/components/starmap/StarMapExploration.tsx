'use client'

/**
 * IAAA · StarMapExploration
 *
 * Exploration panel — appears below the Star Map when a branch is selected.
 * Consumes the frozen StarMapExploration contract exactly.
 *
 * Props:
 *   exploration  — StarMapExploration (frozen contract)
 *   isLoading    — true while API call is in flight
 *   error        — error message if the call failed
 *   onClose      — callback to deselect branch (clear panel)
 *
 * No state. No API calls. Pure presentation + callbacks.
 */

import type { StarMapExploration } from '@/types/index'

interface StarMapExplorationProps {
  exploration:  StarMapExploration | null
  isLoading:    boolean
  error:        string | null
  onClose:      () => void
}

export default function StarMapExplorationPanel({
  exploration,
  isLoading,
  error,
  onClose,
}: StarMapExplorationProps) {
  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="rounded-[2px] px-6 py-8 flex flex-col items-center gap-3"
        style={{
          background: 'var(--bg-surface)',
          border:     '1px solid var(--border-gold-subtle)',
          opacity:    0.8,
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: '1.5rem', height: '1px',
            background: 'var(--gold)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
        <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          Exploring…
        </p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="rounded-[2px] px-6 py-6"
        style={{
          background: 'var(--bg-surface)',
          border:     '1px solid rgba(196,106,106,0.15)',
        }}
        role="alert"
      >
        <p className="text-xs font-sans mb-4" style={{ color: 'rgba(196,106,106,0.7)' }}>
          {error}
        </p>
        <button onClick={onClose} className="btn-ghost px-3 py-1.5 text-xs">
          Close
        </button>
      </div>
    )
  }

  if (!exploration) return null

  // ── Exploration panel ────────────────────────────────────────────────────
  return (
    <div
      className="rounded-[2px] overflow-hidden"
      style={{
        background:  'var(--bg-surface)',
        border:      '1px solid var(--border-gold-medium)',
        borderTop:   '2px solid var(--gold)',
        animation:   'fadeIn 0.2s ease',
      }}
    >
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background:   'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-gold-subtle)',
        }}
      >
        <div>
          <p className="label-eyebrow" style={{ opacity: 0.5, fontSize: '0.56rem' }}>
            Exploring
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize:   '1.2rem',
              color:      'var(--text-primary)',
              fontWeight: 400,
              textTransform: 'capitalize',
              lineHeight: 1.2,
            }}
          >
            {exploration.dimension}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-sans transition-colors duration-150 focus-ring px-2 py-1"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close exploration panel"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-6">

        {/* Insight */}
        <div>
          <p className="label-eyebrow mb-2.5" style={{ opacity: 0.5 }}>
            Insight
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize:   'clamp(0.9rem, 2vw, 1.05rem)',
              color:      'var(--text-primary)',
              fontStyle:  'italic',
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            {exploration.insight}
          </p>
        </div>

        <div style={{ height: '1px', background: 'var(--border-gold-subtle)' }} />

        {/* Questions */}
        <div>
          <p className="label-eyebrow mb-3">Questions</p>
          <ol className="flex flex-col gap-3" role="list">
            {exploration.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="font-mono shrink-0"
                  style={{ fontSize: '0.62rem', color: 'var(--gold)', opacity: 0.5, marginTop: '0.2rem' }}
                >
                  0{i + 1}
                </span>
                <p
                  className="text-sm font-sans leading-relaxed"
                  style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
                >
                  {q}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Related trajectories */}
        {exploration.related_trajectories.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'var(--border-gold-subtle)' }} />
            <div>
              <p className="label-eyebrow mb-2.5" style={{ color: 'rgba(106,158,196,0.85)' }}>
                Related Trajectories
              </p>
              <ul className="flex flex-col gap-1.5">
                {exploration.related_trajectories.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-sans leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}>
                    <span aria-hidden="true"
                      style={{ fontSize: '0.48rem', color: 'rgba(106,158,196,0.6)', marginTop: '0.3rem', flexShrink: 0 }}>
                      ◆
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
