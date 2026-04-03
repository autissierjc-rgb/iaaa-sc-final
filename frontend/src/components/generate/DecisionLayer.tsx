'use client'

/**
 * IAAA · DecisionLayer
 *
 * Displays the analytical layer on /generate:
 *   - decision_type    (structural label)
 *   - decision_dimensions (4 axes with visual levels)
 *
 * Shown between reframe and SituationCard.
 * Ephemeral — not displayed on /sc/[slug].
 *
 * Layout:
 *   Decision type label (prominent)
 *   ─────────────────────────────
 *   Reversibility  ●●○
 *   Systemic impact ●●●
 *   Urgency         ●○○
 *   Uncertainty     ●●○
 */

'use client'

import type { DecisionType, DecisionDimensions } from '@/types/index'
import DecisionPolicy from './DecisionPolicy'

interface DecisionLayerProps {
  decisionType:       DecisionType
  decisionDimensions: DecisionDimensions
}

const DECISION_TYPE_LABELS: Record<DecisionType, { label: string; description: string }> = {
  trivial:      { label: 'Trivial decision',      description: 'Low stakes, easily reversible.' },
  experimental: { label: 'Experimental decision', description: 'Uncertain but recoverable. Test before committing.' },
  structural:   { label: 'Structural decision',   description: 'High impact, difficult to reverse. Requires full commitment.' },
  regime_shift: { label: 'Regime shift',          description: 'Systemic, irreversible, deeply uncertain. Proceed with extreme care.' },
}

const DIMENSION_LABELS: Record<keyof DecisionDimensions, string> = {
  reversibility:   'Reversibility',
  systemic_impact: 'Systemic impact',
  urgency:         'Urgency',
  uncertainty:     'Uncertainty',
}

function LevelDots({ level }: { level: 'low' | 'medium' | 'high' }) {
  const filled = level === 'low' ? 1 : level === 'medium' ? 2 : 3
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className="inline-block rounded-full"
          style={{
            width:      '5px',
            height:     '5px',
            background: n <= filled ? 'var(--gold)' : 'rgba(196,168,130,0.2)',
          }}
        />
      ))}
    </span>
  )
}

export default function DecisionLayer({
  decisionType,
  decisionDimensions,
}: DecisionLayerProps) {
  const typeInfo = DECISION_TYPE_LABELS[decisionType]

  return (
    <div
      className="w-full rounded-[2px] px-5 py-5 mb-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-gold-subtle)' }}
    >
      {/* Decision type */}
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-gold-subtle)' }}>
        <p className="label-eyebrow mb-1.5" style={{ opacity: 0.4 }}>Decision type</p>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize:   'clamp(1rem, 2.5vw, 1.25rem)',
            color:      'var(--gold)',
            fontWeight: 400,
          }}
        >
          {typeInfo.label}
        </p>
        <p className="mt-1 text-xs font-sans" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
          {typeInfo.description}
        </p>
      </div>

      {/* Decision policy — governance posture */}
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-gold-subtle)' }}>
        <DecisionPolicy decisionType={decisionType} />
      </div>

      {/* Decision dimensions */}
      <div>
        <p className="label-eyebrow mb-3" style={{ opacity: 0.4 }}>Decision posture</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
          {(Object.keys(DIMENSION_LABELS) as (keyof DecisionDimensions)[]).map((key) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-xs font-sans" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
                {DIMENSION_LABELS[key]}
              </span>
              <LevelDots level={decisionDimensions[key]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
