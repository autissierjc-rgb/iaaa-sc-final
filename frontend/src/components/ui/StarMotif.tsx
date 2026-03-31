/**
 * IAAA · StarMotif
 *
 * 8-branch astrolabe star — used as background motif on landing hero.
 * Pure SVG, no interaction, no logic.
 *
 * The 8 branches correspond to the 8 Star Map dimensions:
 * risk · opportunity · time · power · constraints · change · stability · uncertainty
 *
 * IMPORTANT: This is a presentation primitive. It must never display
 * the 8 dimension names in UI. Those are internal architecture labels.
 */

interface StarMotifProps {
  size?: number
  opacity?: number
  className?: string
}

export default function StarMotif({
  size = 600,
  opacity = 0.055,
  className = '',
}: StarMotifProps) {
  // Center at (200, 200), viewBox 400x400
  // Outer radius: 168 · Inner guide: 80 · Inner circle: 36

  const cx = 200
  const cy = 200
  const R = 168  // outer radius
  const r1 = 96  // middle guide circle
  const r2 = 38  // inner circle

  // 8 branch endpoints at 0°, 45°, 90° … 315°
  const branches = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180
    return {
      x: cx + R * Math.cos(angle - Math.PI / 2),
      y: cy + R * Math.sin(angle - Math.PI / 2),
      mx: cx + r1 * Math.cos(angle - Math.PI / 2),
      my: cy + r1 * Math.sin(angle - Math.PI / 2),
    }
  })

  // Small diamond at each outer tip (cardinal + diagonal)
  const diamond = (px: number, py: number, s: number) =>
    `M ${px},${py - s} L ${px + s},${py} L ${px},${py + s} L ${px - s},${py} Z`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="star-fade" cx="50%" cy="50%" r="50%">
          <stop offset="20%" stopColor="#C4A882" stopOpacity="1" />
          <stop offset="100%" stopColor="#C4A882" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 8 branch lines from center to outer */}
      {branches.map((b, i) => (
        <line
          key={`ray-${i}`}
          x1={cx}
          y1={cy}
          x2={b.x}
          y2={b.y}
          stroke="url(#star-fade)"
          strokeWidth="0.6"
        />
      ))}

      {/* Outer guide circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r1}
        stroke="#C4A882"
        strokeWidth="0.5"
      />

      {/* Inner circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r2}
        stroke="#C4A882"
        strokeWidth="0.5"
      />

      {/* Small tick marks on outer guide circle at each branch */}
      {branches.map((b, i) => {
        const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2
        const tickLen = 5
        const mx = cx + r1 * Math.cos(angle)
        const my = cy + r1 * Math.sin(angle)
        const tx = cx + (r1 + tickLen) * Math.cos(angle)
        const ty = cy + (r1 + tickLen) * Math.sin(angle)
        return (
          <line
            key={`tick-${i}`}
            x1={mx}
            y1={my}
            x2={tx}
            y2={ty}
            stroke="#C4A882"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Small diamonds at each outer branch tip */}
      {branches.map((b, i) => (
        <path
          key={`diamond-${i}`}
          d={diamond(b.x, b.y, 3.5)}
          fill="#C4A882"
        />
      ))}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#C4A882" />

      {/* Inner ring dot accents */}
      {branches.map((b, i) => (
        <circle
          key={`inner-dot-${i}`}
          cx={cx + r2 * Math.cos((i * 45 * Math.PI) / 180 - Math.PI / 2)}
          cy={cy + r2 * Math.sin((i * 45 * Math.PI) / 180 - Math.PI / 2)}
          r={1}
          fill="#C4A882"
        />
      ))}
    </svg>
  )
}
