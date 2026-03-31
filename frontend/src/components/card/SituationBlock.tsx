'use client'

/**
 * IAAA · SituationBlock
 *
 * Displays the original user input ("vraie question") at the top of
 * a public Situation Card on /sc/[slug] and in the Atlas.
 *
 * Rules:
 *   - Always shown when situation_input is present
 *   - Short (<280 chars): shown in full, no toggle
 *   - Long (≥280 chars): first 280 chars shown, "Lire la situation complète" expands
 *   - Not shown at all if situation_input is null/empty
 *
 * This is the entry point for any visitor arriving from the Atlas —
 * they see the real question before any analysis.
 */

import { useState } from 'react'

interface Props {
  situationInput: string
  intentionRaw?:  string | null   // shown below situation, spelling-corrected only
}

const TRUNCATE_AT = 280

export default function SituationBlock({ situationInput, intentionRaw }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!situationInput?.trim()) return null

  const isLong = situationInput.length > TRUNCATE_AT
  const displayed = isLong && !expanded
    ? situationInput.slice(0, TRUNCATE_AT).trimEnd() + '…'
    : situationInput

  return (
    <div
      className="rounded-[2px]"
      style={{
        background:   'rgba(196,168,130,0.04)',
        border:       '1px solid var(--border-gold-subtle)',
        padding:      'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 18px)',
        marginBottom: '0',
      }}
    >
      {/* Eyebrow */}
      <p
        className="label-eyebrow"
        style={{
          fontSize:   '0.52rem',
          opacity:    0.4,
          marginBottom: '8px',
          letterSpacing: '0.16em',
        }}
      >
        Situation soumise
      </p>

      {/* Text */}
      <p
        style={{
          fontFamily:  'var(--font-cormorant)',
          fontSize:    'clamp(0.88rem, 2vw, 1rem)',
          color:       'var(--text-secondary)',
          fontWeight:  300,
          lineHeight:  1.65,
          fontStyle:   'italic',
          whiteSpace:  'pre-wrap',
        }}
      >
        {displayed}
      </p>

      {/* Toggle */}
      {/* Intention brute — si présente */}
      {intentionRaw && (
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '0.5px solid rgba(24,95,165,0.12)' }}>
          <p style={{
            fontFamily:    'var(--font-cinzel)',
            fontSize:      '0.52rem',
            opacity:       0.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom:  '4px',
            color:         '#185FA5',
          }}>
            Intention
          </p>
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize:   '0.78rem',
            color:      '#2A3E5A',
            fontWeight: 300,
            fontStyle:  'normal',
            lineHeight: 1.5,
          }}>
            {intentionRaw}
          </p>
        </div>
      )}

      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            marginTop:     '8px',
            background:    'none',
            border:        'none',
            cursor:        'pointer',
            padding:       0,
            fontFamily:    'var(--font-dm-sans)',
            fontSize:      '0.58rem',
            letterSpacing: '0.08em',
            color:         'var(--gold-dim)',
            opacity:       0.7,
            textTransform: 'uppercase',
          }}
        >
          {expanded ? 'Réduire ▲' : 'Lire la situation complète ▾'}
        </button>
      )}
    </div>
  )
}
