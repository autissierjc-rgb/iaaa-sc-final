'use client'

/**
 * IAAA · RadarChart
 *
 * Naval radar aesthetic — 4 axes, SVG, no external deps.
 * Axes: Impact · Urgency · Uncertainty · Reversibility
 *
 * Input: decision_dimensions (low/medium/high per axis)
 * The Camshaft engine is internal — this component only receives computed values.
 */

interface RadarDimensions {
  systemic_impact: 'low' | 'medium' | 'high'
  urgency:         'low' | 'medium' | 'high'
  uncertainty:     'low' | 'medium' | 'high'
  reversibility:   'low' | 'medium' | 'high'
}

interface Props {
  dimensions: RadarDimensions
  index:      number   // 0–100
  status:     string
  vulnerableFor?: string
  size?: number
}

const LEVEL_NUM: Record<string, number> = { low: 0.28, medium: 0.58, high: 0.88 }
// Reversibility is inverted: high reversibility = low radar arm
const LEVEL_NUM_INV: Record<string, number> = { low: 0.88, medium: 0.58, high: 0.28 }

const STATUS_COLOR: Record<string, string> = {
  Routine:      '#6B9E78',
  Tension:      '#C4A882',
  Instability:  '#C4845A',
  'Regime Shift': '#B85C5C',
}

// Axis labels in clockwise order starting from top
const AXES = [
  { key: 'systemic_impact', label: 'Impact',        inv: false },
  { key: 'uncertainty',     label: 'Uncertainty',   inv: false },
  { key: 'urgency',         label: 'Urgency',       inv: false },
  { key: 'reversibility',   label: 'Reversibility', inv: true  },
]

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function RadarChart({ dimensions, index, status, vulnerableFor, size = 200 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.38
  const rings = [0.33, 0.66, 1.0]
  const accentColor = STATUS_COLOR[status] ?? '#C4A882'
  const n = AXES.length
  const angleStep = 360 / n

  // Compute polygon points
  const points = AXES.map((axis, i) => {
    const val = (axis.inv ? LEVEL_NUM_INV : LEVEL_NUM)[
      dimensions[axis.key as keyof RadarDimensions]
    ] ?? 0.5
    const angle = i * angleStep
    return polarToXY(angle, maxR * val, cx, cy)
  })

  const polygonStr = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Axis endpoints (full length)
  const axisEnds = AXES.map((_, i) => polarToXY(i * angleStep, maxR, cx, cy))

  // Label positions (slightly beyond axis end)
  const labelPositions = AXES.map((_, i) => polarToXY(i * angleStep, maxR * 1.28, cx, cy))

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG radar */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Decision radar — ${status}, index ${index}`}
        style={{ overflow: 'visible' }}
      >
        {/* Rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={cx} cy={cy}
            r={maxR * r}
            fill="none"
            stroke="rgba(196,168,130,0.10)"
            strokeWidth={0.8}
          />
        ))}

        {/* Axis lines */}
        {axisEnds.map((end, i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="rgba(196,168,130,0.15)"
            strokeWidth={0.8}
          />
        ))}

        {/* Data polygon — fill */}
        <polygon
          points={polygonStr}
          fill={accentColor}
          fillOpacity={0.08}
          stroke={accentColor}
          strokeWidth={1.2}
          strokeOpacity={0.7}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={2.5}
            fill={accentColor}
            fillOpacity={0.9}
          />
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="rgba(196,168,130,0.3)" />

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const lp = labelPositions[i]
          const isTop    = i === 0
          const isBottom = i === 2
          const isRight  = i === 1
          return (
            <text
              key={i}
              x={lp.x} y={lp.y}
              textAnchor={isRight ? 'start' : i === 3 ? 'end' : 'middle'}
              dominantBaseline={isBottom ? 'hanging' : isTop ? 'auto' : 'middle'}
              fontSize={size * 0.055}
              fill="rgba(160,155,147,0.7)"
              fontFamily="var(--font-geist-mono, monospace)"
              letterSpacing={0.3}
            >
              {axis.label.toUpperCase()}
            </text>
          )
        })}
      </svg>

      {/* Index + status */}
      <div className="text-center">
        <div className="flex items-baseline gap-1.5 justify-center">
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.6rem',
              fontWeight: 300,
              color: accentColor,
              lineHeight: 1,
            }}
          >
            {index}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            / 100
          </span>
        </div>
        <p
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            color: accentColor,
            textTransform: 'uppercase',
            marginTop: '0.15rem',
          }}
        >
          {status}
        </p>
        {vulnerableFor && (
          <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            for {vulnerableFor}
          </p>
        )}
      </div>
    </div>
  )
}
