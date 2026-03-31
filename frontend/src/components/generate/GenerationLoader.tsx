/**
 * IAAA · GenerationLoader
 *
 * Shown during the API call to /api/generate.
 * Displays sequential phase labels and an animated progress bar.
 * Phase animation runs concurrently with the real fetch (see generateApi.ts).
 */

import type { LoadingPhase } from '@/types/generate'
import { LOADING_PHASES } from '@/lib/generateApi'

interface GenerationLoaderProps {
  currentPhase: LoadingPhase | null
  currentLabel: string
}

export default function GenerationLoader({
  currentPhase,
  currentLabel,
}: GenerationLoaderProps) {
  const totalPhases = LOADING_PHASES.length
  const currentIndex = currentPhase
    ? LOADING_PHASES.findIndex((p) => p.phase === currentPhase)
    : 0
  const progress = ((currentIndex + 1) / totalPhases) * 100

  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-5"
      role="status"
      aria-live="polite"
      aria-label="Generating Situation Card"
    >
      {/* Spinning star motif */}
      <div className="mb-10" aria-hidden="true">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'spin 8s linear infinite' }}
        >
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 45 * Math.PI) / 180
            return (
              <line
                key={i}
                x1={24} y1={24}
                x2={24 + 20 * Math.cos(angle - Math.PI / 2)}
                y2={24 + 20 * Math.sin(angle - Math.PI / 2)}
                stroke="#C4A882" strokeWidth="0.8" opacity={0.6}
              />
            )
          })}
          <circle cx={24} cy={24} r={3} fill="#C4A882" opacity={0.8} />
        </svg>
      </div>

      {/* Phase label */}
      <p
        className="text-sm font-sans mb-8 text-center"
        style={{ color: 'var(--text-secondary)', fontWeight: 300, minHeight: '1.5rem' }}
      >
        {currentLabel}
      </p>

      {/* Progress bar */}
      <div
        className="w-64 rounded-full overflow-hidden"
        style={{ height: '1px', background: 'var(--border-gold-subtle)' }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--gold)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <p className="mt-3 text-[0.62rem] font-mono" style={{ color: 'var(--text-muted)' }}>
        {currentIndex + 1} / {totalPhases}
      </p>
    </div>
  )
}
