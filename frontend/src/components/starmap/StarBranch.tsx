'use client'

/**
 * IAAA · StarBranch
 *
 * A single clickable branch of the Star Map SVG.
 * Rendered inside the StarMap SVG context — uses SVG elements only.
 *
 * Geometry:
 *   - Line from center to outer tip
 *   - Diamond marker at outer tip
 *   - Label rotated along the branch axis
 *   - Small tick at the guide circle radius
 *
 * Props:
 *   dimension  — branch name (displayed as label)
 *   angle      — degrees from top (0 = up, clockwise)
 *   isActive   — true when this branch is selected
 *   onClick    — called with dimension when clicked
 *
 * All geometry is passed as computed props from StarMap.
 * This component does not compute its own position.
 */

import type { StarMapDimension } from '@/types/index'

// Geometry constants — must match StarMap
export const STAR_CONFIG = {
  cx:          200,   // center x in SVG viewBox (400×400)
  cy:          200,   // center y
  R_OUTER:     155,   // outer tip radius
  R_GUIDE:     90,    // guide circle radius (tick marks)
  R_INNER:     36,    // inner circle radius
  DIAMOND_SIZE: 3.5,  // outer tip diamond half-size
  LABEL_R:     172,   // label placement radius
} as const

interface StarBranchProps {
  dimension:  StarMapDimension
  angleDeg:   number         // 0 = top, clockwise
  isActive:   boolean
  onClick:    (dim: StarMapDimension) => void
}

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180  // -90 = start from top
}

function diamond(cx: number, cy: number, s: number) {
  return `M ${cx},${cy - s} L ${cx + s},${cy} L ${cx},${cy + s} L ${cx - s},${cy} Z`
}

export default function StarBranch({
  dimension,
  angleDeg,
  isActive,
  onClick,
}: StarBranchProps) {
  const { cx, cy, R_OUTER, R_GUIDE, DIAMOND_SIZE, LABEL_R } = STAR_CONFIG
  const rad    = toRad(angleDeg)
  const tipX   = cx + R_OUTER * Math.cos(rad)
  const tipY   = cy + R_OUTER * Math.sin(rad)
  const tickX  = cx + R_GUIDE  * Math.cos(rad)
  const tickY  = cy + R_GUIDE  * Math.sin(rad)
  const labelX = cx + LABEL_R  * Math.cos(rad)
  const labelY = cy + LABEL_R  * Math.sin(rad)

  // Rotate label to follow branch — flip if on left half to stay readable
  const onLeft    = labelX < cx - 5
  const labelRot  = onLeft ? angleDeg + 180 : angleDeg

  const gold        = 'rgba(196,168,130,1)'
  const goldActive  = 'rgba(212,188,150,1)'
  const goldDim     = 'rgba(196,168,130,0.35)'
  const goldGuide   = 'rgba(196,168,130,0.55)'

  const lineColor   = isActive ? goldActive  : goldDim
  const tipColor    = isActive ? goldActive  : goldGuide
  const labelColor  = isActive ? goldActive  : 'rgba(160,155,147,0.7)'
  const labelWeight = isActive ? 500 : 400

  return (
    <g
      onClick={() => onClick(dimension)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Explore ${dimension}`}
      aria-pressed={isActive}
    >
      {/* Hit area — invisible wide line for easier tap */}
      <line
        x1={cx} y1={cy} x2={tipX} y2={tipY}
        stroke="transparent" strokeWidth={20}
      />

      {/* Branch line */}
      <line
        x1={cx} y1={cy} x2={tipX} y2={tipY}
        stroke={lineColor}
        strokeWidth={isActive ? 0.9 : 0.55}
        style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
      />

      {/* Tick at guide circle */}
      <line
        x1={tickX} y1={tickY}
        x2={cx + (R_GUIDE + 5) * Math.cos(rad)}
        y2={cy + (R_GUIDE + 5) * Math.sin(rad)}
        stroke={isActive ? gold : goldDim}
        strokeWidth={isActive ? 1 : 0.6}
      />

      {/* Diamond at outer tip */}
      <path
        d={diamond(tipX, tipY, isActive ? DIAMOND_SIZE + 1 : DIAMOND_SIZE)}
        fill={tipColor}
        style={{ transition: 'fill 0.2s ease' }}
      />

      {/* Branch label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isActive ? 7.5 : 7}
        fontFamily="var(--font-dm-sans), system-ui, sans-serif"
        fontWeight={labelWeight}
        fill={labelColor}
        letterSpacing="0.06em"
        transform={`rotate(${labelRot}, ${labelX}, ${labelY})`}
        style={{
          textTransform: 'uppercase',
          transition: 'fill 0.2s ease, font-size 0.2s ease',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {dimension}
      </text>
    </g>
  )
}
