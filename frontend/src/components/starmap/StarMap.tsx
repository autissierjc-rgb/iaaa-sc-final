'use client'

/**
 * IAAA · StarMap
 *
 * Pure SVG star map. 8 fixed branches. No D3. No external library.
 * One active branch at a time — clicking another replaces the selection.
 *
 * Layout:
 *   <StarMap />      ← this component (SVG)
 *   ↓ (scroll)
 *   <StarMapExploration /> ← rendered by parent, below this component
 *
 * Props:
 *   card           — SituationCard (used for center label + passing to explore API)
 *   onBranchSelect — called with dimension when a branch is clicked
 *   activeDimension — controlled from parent (null = no branch selected)
 *
 * This component has no async logic. API calls are in the parent page.
 */

import { STAR_MAP_DIMENSIONS } from '@/types/index'
import type { StarMapDimension } from '@/types/index'
import type { SituationCard }    from '@/types/index'
import StarBranch, { STAR_CONFIG } from './StarBranch'

const { cx, cy, R_GUIDE, R_INNER } = STAR_CONFIG

// 8 branches at 45° intervals, starting from top (0°)
const BRANCH_ANGLES: Record<StarMapDimension, number> = {
  risk:         0,
  opportunity:  45,
  time:         90,
  power:        135,
  constraints:  180,
  change:       225,
  stability:    270,
  uncertainty:  315,
}

interface StarMapProps {
  card:             SituationCard
  activeDimension:  StarMapDimension | null
  onBranchSelect:   (dim: StarMapDimension) => void
}

export default function StarMap({
  card,
  activeDimension,
  onBranchSelect,
}: StarMapProps) {
  // Truncate main_vulnerability for center display
  const centerLabel = card.main_vulnerability.length > 48
    ? card.main_vulnerability.slice(0, 45) + '…'
    : card.main_vulnerability

  return (
    <div className="flex flex-col items-center">
      {/* Eyebrow */}
      <p className="label-eyebrow mb-4" style={{ opacity: 0.5 }}>
        Star Map — select a branch to explore
      </p>

      {/* SVG */}
      <svg
        viewBox="0 0 400 400"
        width="100%"
        style={{ maxWidth: '420px', display: 'block' }}
        aria-label="Star Map — 8 exploration dimensions"
        role="img"
      >
        {/* ── Guide circle ─────────────────────────────────── */}
        <circle
          cx={cx} cy={cy} r={R_GUIDE}
          fill="none"
          stroke="rgba(196,168,130,0.18)"
          strokeWidth={0.6}
        />

        {/* ── Inner circle ─────────────────────────────────── */}
        <circle
          cx={cx} cy={cy} r={R_INNER}
          fill="var(--bg-elevated)"
          stroke="rgba(196,168,130,0.30)"
          strokeWidth={0.8}
        />

        {/* ── 8 Branches ───────────────────────────────────── */}
        {(STAR_MAP_DIMENSIONS as StarMapDimension[]).map((dim) => (
          <StarBranch
            key={dim}
            dimension={dim}
            angleDeg={BRANCH_ANGLES[dim]}
            isActive={activeDimension === dim}
            onClick={onBranchSelect}
          />
        ))}

        {/* ── Center: main_vulnerability label ─────────────── */}
        {/* Outer ring label */}
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          fontSize={5}
          fontFamily="var(--font-dm-sans), system-ui, sans-serif"
          fill="rgba(196,168,130,0.4)"
          letterSpacing="0.12em"
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          main vulnerability
        </text>

        {/* Wrap center text manually — SVG has no text-wrap */}
        <CenteredText
          text={centerLabel}
          cx={cx}
          cy={cy}
          maxWidth={R_INNER * 1.7}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="rgba(196,106,106,0.6)" />
      </svg>

      {/* Active branch hint */}
      {activeDimension && (
        <p
          className="mt-3 text-xs font-sans tracking-[0.06em] uppercase"
          style={{ color: 'var(--gold)', opacity: 0.7 }}
        >
          {activeDimension} — exploring below ↓
        </p>
      )}
    </div>
  )
}

// ── Helper: multi-line center text ────────────────────────────────────────────
// SVG foreignObject or manual line-splitting — using manual split for compatibility
function CenteredText({
  text,
  cx,
  cy,
  maxWidth,
}: {
  text: string
  cx: number
  cy: number
  maxWidth: number
}) {
  // Split into ~22-char chunks
  const words  = text.split(' ')
  const lines: string[] = []
  let   current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length > 22 && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const lineH   = 8     // px between lines
  const startY  = cy + 2 - ((lines.length - 1) * lineH) / 2

  return (
    <>
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={startY + i * lineH}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={6}
          fontFamily="var(--font-cormorant), Georgia, serif"
          fontStyle="italic"
          fill="rgba(196,106,106,0.65)"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {line}
        </text>
      ))}
    </>
  )
}
