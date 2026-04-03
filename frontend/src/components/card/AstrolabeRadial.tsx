'use client'

/**
 * IAAA · AstrolabeRadial — version finale validée
 *
 * 8 branches fixes : I Actors · II Interests · III Forces · IV Tensions
 *                    V Constraints · VI Uncertainty · VII Time · VIII Space
 *
 * Losanges centrés sur chaque anneau, proportionnels au rayon.
 * 3 niveaux de force :
 *   Niveau 1 (intérieur)  — Bleu    — Actif
 *   Niveau 2 (milieu)     — Jaune   — Modéré
 *   Niveau 3 (extérieur)  — Carmin  — Dominant
 *
 * Roue laiton statique au centre.
 * Chiffres romains cerclés sur l'anneau extérieur.
 * Fond parchemin, police Cinzel.
 *
 * Design gelé — ne pas modifier sans validation.
 */

'use client'

import React from 'react'

import { useEffect, useRef } from 'react'

export interface AstrolabeScores {
  actors:      number  // 0–3
  interests:   number
  forces:      number
  tensions:    number
  constraints: number
  uncertainty: number
  time:        number
  space:       number
}

interface Props {
  scores:   AstrolabeScores
  primary?: string   // e.g. "VI · Uncertainty"
  size?:    number   // SVG size in px, default 360
}

const BRANCHES = [
  'actors', 'interests', 'forces', 'tensions',
  'constraints', 'uncertainty', 'time', 'space',
] as const

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const ANGLES = [-90, -45, 0, 45, 90, 135, 180, 225]
const RINGS  = [40, 80, 120]

// Bleu=level1, Jaune=level2, Carmin=level3
const FILL_COLORS   = ['#1848A0', '#D4B800', '#A01850']
const STROKE_COLORS = ['#0A3080', '#A89000', '#801038']
const LEGEND_LABELS = ['Actif', 'Modéré', 'Dominant']

export default function AstrolabeRadial({ scores, primary, size = 360 }: Props) {
  // Responsive: cap size at container width on mobile
  const [responsiveSize, setResponsiveSize] = React.useState(size)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        setResponsiveSize(Math.min(size, Math.max(260, w - 32)))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [size])

  // Use responsiveSize for all calculations
  const effectiveSize = responsiveSize
  const svgRef = useRef<SVGSVGElement>(null)
  const cx = effectiveSize / 2
  const cy = effectiveSize / 2
  const maxR = effectiveSize * 0.333  // outer measurement ring radius
  const labelR = effectiveSize * 0.467 // roman circle radius
  const tickR1 = effectiveSize * 0.447
  const tickR2maj = effectiveSize * 0.430
  const tickR2min = effectiveSize * 0.438

  const scoreValues = BRANCHES.map(b => scores[b])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const g = svg.getElementById('dmds') as SVGGElement
    const rc = svg.getElementById('rmc')  as SVGGElement
    const tm = svg.getElementById('tks')  as SVGGElement
    if (!g || !rc || !tm) return

    g.innerHTML = ''
    rc.innerHTML = ''
    tm.innerHTML = ''

    // Tick marks
    for (let t = 0; t < 72; t++) {
      const ta = (t * 5 - 90) * Math.PI / 180
      const isMaj = t % 9 === 0
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      tick.setAttribute('x1', String(cx + tickR1 * Math.cos(ta)))
      tick.setAttribute('y1', String(cy + tickR1 * Math.sin(ta)))
      tick.setAttribute('x2', String(cx + (isMaj ? tickR2maj : tickR2min) * Math.cos(ta)))
      tick.setAttribute('y2', String(cy + (isMaj ? tickR2maj : tickR2min) * Math.sin(ta)))
      tick.setAttribute('stroke', '#C8B880')
      tick.setAttribute('stroke-width', isMaj ? '1.2' : '0.5')
      tm.appendChild(tick)
    }

    // Diamonds
    scoreValues.forEach((score, i) => {
      const a = ANGLES[i] * Math.PI / 180
      const perpA = a + Math.PI / 2

      RINGS.forEach((r, lvl) => {
        const rScaled = r / 120 * maxR
        const px = cx + rScaled * Math.cos(a)
        const py = cy + rScaled * Math.sin(a)
        const hl = rScaled * 0.30
        const hw = rScaled * 0.13
        const filled = score >= (lvl + 1)

        const pts = [
          `${px + hl * Math.cos(a)},${py + hl * Math.sin(a)}`,
          `${px + hw * Math.cos(perpA)},${py + hw * Math.sin(perpA)}`,
          `${px - hl * Math.cos(a)},${py - hl * Math.sin(a)}`,
          `${px - hw * Math.cos(perpA)},${py - hw * Math.sin(perpA)}`,
        ].join(' ')

        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        poly.setAttribute('points', pts)
        poly.setAttribute('fill', filled ? FILL_COLORS[lvl] : 'rgba(200,184,128,0.10)')
        poly.setAttribute('stroke', filled ? STROKE_COLORS[lvl] : 'rgba(180,164,108,0.20)')
        poly.setAttribute('stroke-width', filled ? '1.1' : '0.5')
        poly.setAttribute('stroke-linejoin', 'miter')
        if (filled) {
          poly.style.animation = `unfold 0.35s ease-out ${i * 0.06 + lvl * 0.04}s both`
        }
        g.appendChild(poly)
      })
    })

    // Roman circles
    ROMANS.forEach((roman, i) => {
      const a = ANGLES[i] * Math.PI / 180
      const lx = cx + labelR * Math.cos(a)
      const ly = cy + labelR * Math.sin(a)
      const score = scoreValues[i]
      const dotColor = score === 3 ? STROKE_COLORS[2] : score === 2 ? STROKE_COLORS[1] : STROKE_COLORS[0]
      const circR = size * 0.036

      const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circ.setAttribute('cx', String(lx))
      circ.setAttribute('cy', String(ly))
      circ.setAttribute('r', String(circR))
      circ.setAttribute('fill', '#F8F3E8')
      circ.setAttribute('stroke', '#C8B880')
      circ.setAttribute('stroke-width', '1')
      rc.appendChild(circ)

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('cx', String(lx))
      dot.setAttribute('cy', String(ly - circR * 0.5))
      dot.setAttribute('r', String(effectiveSize * 0.006))
      dot.setAttribute('fill', dotColor)
      dot.setAttribute('opacity', '0.9')
      rc.appendChild(dot)

      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      txt.setAttribute('x', String(lx))
      txt.setAttribute('y', String(ly + circR * 0.3))
      txt.setAttribute('text-anchor', 'middle')
      txt.setAttribute('font-size', String(effectiveSize * 0.025))
      txt.setAttribute('font-family', 'Cinzel,Georgia,serif')
      txt.setAttribute('fill', '#6A5A38')
      txt.textContent = roman
      rc.appendChild(txt)
    })
  }, [scores, effectiveSize])

  const r1 = 40 / 120 * maxR
  const r2 = 80 / 120 * maxR
  const r3 = maxR
  const rOuter1 = effectiveSize * 0.486
  const rOuter2 = labelR
  const rOuter3 = effectiveSize * 0.450

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>

      {/* Header */}
      {primary && (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Cinzel,Georgia,serif', fontSize: '13px', color: '#3A2E10', letterSpacing: '0.14em' }}>
            ASTROLABE
          </span>
          <span style={{ fontFamily: 'Crimson Pro,Georgia,serif', fontSize: '11px', color: '#9A8860', fontStyle: 'italic' }}>
            primaire : {primary}
          </span>
        </div>
      )}

      {/* SVG */}
      <svg
        ref={svgRef}
        width={effectiveSize}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        <style>{`@keyframes unfold{from{opacity:0;transform:scale(0.2)}to{opacity:1;transform:scale(1)}}`}</style>
        <defs>
          <filter id="dsp">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="rgba(80,50,10,0.10)" />
          </filter>
        </defs>

        {/* Outer rings */}
        <circle cx={cx} cy={cy} r={rOuter1} fill="none" stroke="#C8B880" strokeWidth="0.5" opacity="0.3" />
        <circle cx={cx} cy={cy} r={rOuter2} fill="none" stroke="#C8B880" strokeWidth="1" opacity="0.5" />
        <circle cx={cx} cy={cy} r={rOuter3} fill="none" stroke="#C8B880" strokeWidth="0.3" strokeDasharray="2,5" opacity="0.2" />

        {/* Ticks */}
        <g id="tks" opacity="0.3" />

        {/* Measurement rings */}
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#C8B880" strokeWidth="0.9" opacity="0.5" />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#C8B880" strokeWidth="0.9" opacity="0.5" />
        <circle cx={cx} cy={cy} r={r3} fill="none" stroke="#C8B880" strokeWidth="0.9" opacity="0.5" />

        {/* Axis lines */}
        <g stroke="#C8B880" strokeWidth="0.7" opacity="0.35">
          <line x1={cx} y1={cy - maxR * 1.35} x2={cx} y2={cy + maxR * 1.35} />
          <line x1={cx - maxR * 1.35} y1={cy} x2={cx + maxR * 1.35} y2={cy} />
          <line x1={cx - maxR * 0.955} y1={cy - maxR * 0.955} x2={cx + maxR * 0.955} y2={cy + maxR * 0.955} />
          <line x1={cx + maxR * 0.955} y1={cy - maxR * 0.955} x2={cx - maxR * 0.955} y2={cy + maxR * 0.955} />
        </g>

        {/* Diamonds */}
        <g id="dmds" filter="url(#dsp)" />

        {/* Roman circles */}
        <g id="rmc" />

        {/* Wheel static */}
        <circle cx={cx} cy={cy} r={size * 0.061} fill="none" stroke="#C8A840" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={size * 0.044} fill="none" stroke="#C8A840" strokeWidth="0.5" opacity="0.4" />
        {[[-90, 2.4], [-45, 1.8], [0, 2.4], [45, 1.8], [90, 2.4], [135, 1.8], [180, 2.4], [225, 1.8]].map(([deg, sw], k) => {
          const a = (deg - 90) * Math.PI / 180
          const spokeR = size * 0.061
          return (
            <line
              key={k}
              x1={cx + spokeR * Math.cos(a)} y1={cy + spokeR * Math.sin(a)}
              x2={cx} y2={cy}
              stroke="#C8A840" strokeWidth={sw} strokeLinecap="round"
            />
          )
        })}
        <circle cx={cx} cy={cy} r={size * 0.017} fill="#D4BC78" stroke="#A89050" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r={size * 0.008} fill="#8A6830" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
        {LEGEND_LABELS.map((label, lvl) => (
          <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Crimson Pro,Georgia,serif', fontSize: '12px', color: '#6A5A38', fontStyle: 'italic' }}>
            <div style={{
              width: '10px', height: '10px',
              transform: 'rotate(45deg)',
              background: FILL_COLORS[lvl],
              border: `1px solid ${STROKE_COLORS[lvl]}`,
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
