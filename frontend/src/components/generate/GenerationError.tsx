'use client'

/**
 * IAAA · GenerationError
 *
 * Shown when generation fails.
 * Calls onRetry to reset to idle state.
 */

interface GenerationErrorProps {
  message: string
  onRetry: () => void
}

export default function GenerationError({ message, onRetry }: GenerationErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-5 text-center"
      role="alert"
    >
      <div
        className="w-8 h-px mb-8 mx-auto"
        style={{ background: 'rgba(196,106,106,0.5)' }}
      />
      <p
        className="text-sm font-sans mb-2"
        style={{ color: 'rgba(196,106,106,0.9)', fontWeight: 300 }}
      >
        Generation failed
      </p>
      <p
        className="text-xs font-sans mb-8 max-w-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        {message || 'Something went wrong. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="btn-ghost px-5 py-2 text-xs focus-ring"
      >
        Try again
      </button>
    </div>
  )
}
