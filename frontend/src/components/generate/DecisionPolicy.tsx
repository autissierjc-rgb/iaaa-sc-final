/**
 * IAAA · DecisionPolicy
 *
 * Displays the governance posture associated with a decision_type.
 * Input: decisionType only — label and description resolved locally.
 * No API call. No backend. No persistence.
 *
 * Visible only on /generate — not on /sc/[slug], /dashboard, or /library.
 *
 * Policy mapping:
 *   trivial      → Automation possible
 *   experimental → Controlled test recommended
 *   structural   → Human validation recommended
 *   regime_shift → Executive decision required
 */

import type { DecisionType } from '@/types/index'

interface DecisionPolicyProps {
  decisionType: DecisionType
}

const POLICIES: Record<DecisionType, { label: string; description: string }> = {
  trivial: {
    label:       'Automation possible',
    description: 'Low-impact decision. Fast execution is acceptable.',
  },
  experimental: {
    label:       'Controlled test recommended',
    description: 'The situation is uncertain but reversible. Limited experimentation is appropriate.',
  },
  structural: {
    label:       'Human validation recommended',
    description: 'This decision affects the structure of the system. Human review is required.',
  },
  regime_shift: {
    label:       'Executive decision required',
    description: 'This situation may alter the regime of the system. Escalation is recommended.',
  },
}

// Visual weight scales with decision severity
const ACCENT: Record<DecisionType, string> = {
  trivial:      'rgba(130,196,130,0.55)',   // muted green
  experimental: 'rgba(130,165,196,0.65)',   // muted blue
  structural:   'rgba(196,168,130,0.75)',   // gold — IAAA default
  regime_shift: 'rgba(196,106,106,0.75)',   // red — maximum weight
}

const ACCENT_BG: Record<DecisionType, string> = {
  trivial:      'rgba(130,196,130,0.04)',
  experimental: 'rgba(130,165,196,0.04)',
  structural:   'rgba(196,168,130,0.04)',
  regime_shift: 'rgba(196,106,106,0.04)',
}

export default function DecisionPolicy({ decisionType }: DecisionPolicyProps) {
  const policy = POLICIES[decisionType]
  const accent = ACCENT[decisionType]
  const bg     = ACCENT_BG[decisionType]

  return (
    <div
      className="w-full rounded-[2px] px-5 py-4 mb-5"
      style={{
        background:  bg,
        borderLeft:  `2px solid ${accent}`,
        border:      `1px solid rgba(196,168,130,0.1)`,
      }}
    >
      <p className="label-eyebrow mb-1.5" style={{ opacity: 0.4 }}>
        Decision policy
      </p>
      <p
        className="mb-1"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize:   'clamp(0.95rem, 2vw, 1.1rem)',
          color:      accent,
          fontWeight: 400,
          lineHeight: 1.25,
        }}
      >
        {policy.label}
      </p>
      <p
        className="text-xs font-sans"
        style={{ color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.6 }}
      >
        {policy.description}
      </p>
    </div>
  )
}
