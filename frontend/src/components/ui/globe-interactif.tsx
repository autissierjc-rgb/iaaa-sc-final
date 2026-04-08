'use client'
import { useState } from 'react'

type Props = {
  size?: number
  lineColor?: string
  lineOpacity?: number
  backgroundBlueA?: string
  backgroundBlueB?: string
  goldGlow?: number
  hoverScale?: number
  interactive?: boolean
}

export default function GlobeInteractif({
  size = 400,
  lineColor = '#CCA364',
  lineOpacity = 0.24,
  backgroundBlueA = '#163A70',
  backgroundBlueB = '#6F8FB8',
  goldGlow = 16,
  hoverScale = 1.015,
  interactive = true,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPointer({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    })
  }

  const c = 600
  const r = 520

  const ellipsePath = (cx: number, cy: number, rx: number, ry: number, rot: number) =>
    `M ${cx - rx},${cy} a ${rx},${ry} ${rot} 1,0 ${rx * 2},0 a ${rx},${ry} ${rot} 1,0 ${-rx * 2},0`

  const circlePath = (cx: number, cy: number, rad: number) =>
    `M ${cx - rad},${cy} a ${rad},${rad} 0 1,0 ${rad * 2},0 a ${rad},${rad} 0 1,0 ${-rad * 2},0`

  const arcs: React.ReactNode[] = []
  for (let i = 0; i < 8; i++) {
    const rr = r - i * 35
    arcs.push(
      <path key={`lat-${i}`} d={ellipsePath(c, c, r, rr, 0)} fill="none"
        stroke={lineColor} strokeOpacity={lineOpacity} strokeWidth="1.4" />
    )
  }
  for (let i = 0; i < 9; i++) {
    const rx = r - i * 35
    arcs.push(
      <path key={`lon-a-${i}`} d={ellipsePath(c, c, rx, r, 28)} fill="none"
        stroke={lineColor} strokeOpacity={lineOpacity} strokeWidth="1.4" />
    )
    arcs.push(
      <path key={`lon-b-${i}`} d={ellipsePath(c, c, rx, r, -28)} fill="none"
        stroke={lineColor} strokeOpacity={lineOpacity} strokeWidth="1.4" />
    )
  }

  const rays: React.ReactNode[] = []
  const poles = [
    { x: 810, y: 340, radii: [36, 82, 140] },
    { x: 430, y: 820, radii: [36, 82, 140] },
  ]
  poles.forEach((p, pi) => {
    p.radii.forEach((rad, ri) =>
      rays.push(
        <path key={`pole-${pi}-${ri}`} d={circlePath(p.x, p.y, rad)} fill="none"
          stroke={lineColor} strokeOpacity={lineOpacity} strokeWidth="1.25" />
      )
    )
    for (let k = 0; k < 12; k++) {
      const a = (Math.PI * 2 * k) / 12
      rays.push(
        <line key={`ray-${pi}-${k}`} x1={p.x} y1={p.y}
          x2={p.x + Math.cos(a) * 520} y2={p.y + Math.sin(a) * 520}
          stroke={lineColor} strokeOpacity={lineOpacity} strokeWidth="1.1" />
      )
    }
  })

  const sweepAngle = Math.PI / 6
  const sweepX = c + r * Math.sin(sweepAngle)
  const sweepY = c - r * Math.cos(sweepAngle)

  return (
    <div
      style={{ width: size, height: size, position: 'relative', borderRadius: '50%', perspective: 1200 }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPointer({ x: 0, y: 0 }) }}
    >
      <style>{`
        @keyframes globe-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes globe-sweep-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>

      <div style={{
        width: '100%', height: '100%', transformStyle: 'preserve-3d',
        transform: `rotateX(${interactive ? -pointer.y * 8 : 0}deg) rotateY(${interactive ? pointer.x * 8 : 0}deg) scale(${hovered ? hoverScale : 1})`,
        transition: 'transform 220ms ease-out, filter 220ms ease-out',
        filter: hovered ? `drop-shadow(0 0 ${goldGlow}px rgba(204,163,100,0.28))` : 'none',
      }}>
        <svg viewBox="0 0 1200 1200" width="100%" height="100%"
          style={{
            display: 'block',
            transform: `translate(${interactive ? pointer.x * 14 : 0}px, ${interactive ? pointer.y * 14 : 0}px)`,
            transition: 'transform 220ms ease-out',
          }}>
          <defs>
            <radialGradient id="bg-globe" cx="42%" cy="32%" r="72%">
              <stop offset="0%" stopColor={backgroundBlueB} />
              <stop offset="58%" stopColor={backgroundBlueA} />
              <stop offset="100%" stopColor="#0B2246" />
            </radialGradient>
            <radialGradient id="shine-globe" cx="35%" cy="28%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.30)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="sweep-grad" cx="0%" cy="50%" r="100%" gradientUnits="userSpaceOnUse"
              x1={c} y1={c} x2={c} y2={c - r}>
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </radialGradient>
            <filter id="softGlow-globe">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="dot-glow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id="clipSphere-globe"><circle cx={c} cy={c} r={r} /></clipPath>
          </defs>

          <circle cx={c} cy={c} r={r} fill="url(#bg-globe)" />
          <circle cx={c} cy={c} r={r} fill="url(#shine-globe)" opacity="0.85" />

          <g clipPath="url(#clipSphere-globe)" filter="url(#softGlow-globe)">
            {arcs}
            {rays}
          </g>

          {/* Ligne balayante principale */}
          <g clipPath="url(#clipSphere-globe)">
            <g style={{ transformOrigin: `${c}px ${c}px`, animation: 'globe-sweep 9s linear infinite' }}>
              <path
                d={`M ${c} ${c} L ${c} ${c - r} A ${r} ${r} 0 0 1 ${sweepX} ${sweepY} Z`}
                fill={lineColor} fillOpacity="0.12"
              />
              <line x1={c} y1={c} x2={c} y2={c - r}
                stroke={lineColor} strokeOpacity="0.6" strokeWidth="2.5" />
            </g>
            {/* Ligne balayante secondaire en sens inverse */}
            <g style={{ transformOrigin: `${c}px ${c}px`, animation: 'globe-sweep-rev 16s linear infinite' }}>
              <line x1={c} y1={c} x2={c + r} y2={c}
                stroke={lineColor} strokeOpacity="0.2" strokeWidth="1.5" />
            </g>
          </g>

          <circle cx={c} cy={c} r={r} fill="none"
            stroke={lineColor} strokeOpacity={lineOpacity + 0.08} strokeWidth="1.6" />

          {/* Point central pulsant */}
          <g filter="url(#dot-glow)">
            <circle cx={c} cy={c} fill={lineColor}>
              <animate attributeName="r" values="16;28;16" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.35;0.9" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={c} cy={c} fill="none" stroke={lineColor} strokeWidth="2.5">
              <animate attributeName="r" values="16;72;16" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={c} cy={c} r="10" fill="#fff" opacity="0.9" />
          </g>
        </svg>

        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 48%)',
          mixBlendMode: 'screen', pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
