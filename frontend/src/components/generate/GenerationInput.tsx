'use client'

/**
 * IAAA · GenerationInput
 *
 * The main situation input on /generate.
 * Controlled — value + onChange passed from parent.
 * No state of its own. No API calls.
 *
 * Shows:
 * - Textarea with auto-grow feel
 * - Character hint
 * - Submit button (disabled while empty or loading)
 * - Keyboard hint (Cmd/Ctrl + Enter)
 */

interface GenerationInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export default function GenerationInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  label,
}: GenerationInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (value.trim() && !isLoading) onSubmit()
    }
  }

  const canSubmit = value.trim().length > 0 && !isLoading

  return (
    <div className="w-full">
      {/* Label */}
      <label
        htmlFor="situation-input"
        className="label-eyebrow block mb-3"
        style={{ opacity: 0.6 }}
      >
        {label ?? 'Your situation'}
      </label>

      {/* Textarea wrapper */}
      <div
        className="relative rounded-[2px] overflow-hidden"
        style={{
          border: `1px solid ${isLoading ? 'var(--border-gold-subtle)' : 'var(--border-gold-medium)'}`,
          background: 'var(--bg-surface)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <textarea
          id="situation-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your situation in a few sentences or more…"
          rows={6}
          disabled={isLoading}
          className="
            w-full resize-none bg-transparent
            px-4 pt-4 pb-14
            text-sm font-sans leading-relaxed
            text-parchment
            placeholder:text-parchment-muted
            focus:outline-none
            disabled:opacity-40
          "
          aria-label="Describe your situation"
        />

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid var(--border-gold-subtle)', background: 'var(--bg-elevated)' }}
        >
          {/* Keyboard hint */}
          <span className="text-[0.62rem] font-mono" style={{ color: 'var(--text-muted)' }}>
            {isLoading ? 'Processing…' : '⌘ + Enter'}
          </span>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="btn-primary px-4 py-2 text-xs disabled:opacity-25 disabled:cursor-not-allowed focus-ring"
            aria-label="Generate Situation Card"
          >
            {isLoading ? 'Generating…' : 'Generate Situation Card →'}
          </button>
        </div>
      </div>

      {/* Char hint */}
      {value.length > 0 && (
        <p className="text-right mt-1.5 text-[0.62rem] font-mono"
          style={{ color: 'var(--text-muted)' }}>
          {value.length} chars
        </p>
      )}
    </div>
  )
}
