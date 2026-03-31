/**
 * IAAA · CardSection
 *
 * Atomic primitive for rendering a labeled list field on a SituationCard.
 * Used by SituationCard for: forces, tensions, trajectories, constraints, uncertainty.
 *
 * Props: purely presentational — label, items, optional accent color.
 * No state. No API calls.
 */

interface CardSectionProps {
  label: string
  items: string[]
  accentColor?: string
  className?: string
}

export default function CardSection({
  label,
  items,
  accentColor,
  className = '',
}: CardSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <div className={className}>
      <p
        className="label-eyebrow mb-2.5"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-1.5" role="list">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs font-sans leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: '0.48rem',
                color: accentColor || 'var(--gold)',
                marginTop: '0.3rem',
                flexShrink: 0,
                opacity: 0.55,
              }}
            >
              ◆
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
