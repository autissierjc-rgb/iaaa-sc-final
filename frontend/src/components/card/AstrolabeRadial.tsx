'use client'
// ── AstrolabeRadial ───────────────────────────────────────────────────────────
// Design figé — ne pas modifier sans validation JCA
// 3 losanges par branche : bleu #B8D4F0 / ambre #F0CA70 / corail #E87C7C
// Inactif : parchemin #E0DCD4
// LABEL_R = 125, anneau laiton, chiffres romains cerclés, légende Calme/Modéré/Agité

import { TXT3 } from '@/lib/constants'

interface AstrolabeScore {
  display_score: number
  name: string
  branch: string
}

export default function AstrolabeRadial({ scores }: { scores: AstrolabeScore[] }) {
  const cx = 120, cy = 120
  const RINGS  = [32, 62, 92]
  const LABEL_R = 125
  const FILLS  = ['#B8D4F0', '#F0CA70', '#E87C7C']
  const STROKES = ['#7AAEDC', '#D4A830', '#C84040']
  const EMPTY  = '#E0DCD4'
  const EMPTY_S = '#C8C4BC'

  return (
    <svg viewBox="0 0 240 240" width="210" height="210" style={{ overflow: 'visible' }}>
      {/* Anneau laiton extérieur */}
      <circle cx={cx} cy={cy} r={108} fill="none" stroke="#C8B880" strokeWidth="1.2" />
      {/* 32 graduations */}
      {Array.from({ length: 32 }).map((_, t) => {
        const ta = (t * 360 / 32 - 90) * Math.PI / 180
        const isMaj = t % 4 === 0
        return (
          <line key={t}
            x1={cx + 100 * Math.cos(ta)} y1={cy + 100 * Math.sin(ta)}
            x2={cx + (isMaj ? 94 : 97) * Math.cos(ta)} y2={cy + (isMaj ? 94 : 97) * Math.sin(ta)}
            stroke="#C8B880" strokeWidth={isMaj ? 1 : 0.5} />
        )
      })}
      {/* Cercles guide */}
      {RINGS.map(r => (
        <circle key={r} cx={cx} cy={cy} r={r}
          fill="none" stroke="#DDD8CC" strokeWidth="0.6" strokeDasharray="3 3" />
      ))}
      {/* 8 branches */}
      {scores.map((s, i) => {
        const a = (i * 45 - 90) * Math.PI / 180
        const perpA = a + Math.PI / 2
        const lx = cx + LABEL_R * Math.cos(a)
        const ly = cy + LABEL_R * Math.sin(a)
        const dotColor = s.display_score === 3 ? '#801050' : s.display_score === 2 ? '#888000' : '#004858'
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + 95 * Math.cos(a)} y2={cy + 95 * Math.sin(a)}
              stroke="#E0DCD4" strokeWidth="0.8" />
            {RINGS.map((r, lvl) => {
              const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
              const hl = r * 0.28, hw = r * 0.12
              const filled = s.display_score >= (lvl + 1)
              const t1x = px + hl * Math.cos(a), t1y = py + hl * Math.sin(a)
              const t2x = px - hl * Math.cos(a), t2y = py - hl * Math.sin(a)
              const s1x = px + hw * Math.cos(perpA), s1y = py + hw * Math.sin(perpA)
              const s2x = px - hw * Math.cos(perpA), s2y = py - hw * Math.sin(perpA)
              return (
                <polygon key={lvl}
                  points={`${t1x},${t1y} ${s1x},${s1y} ${t2x},${t2y} ${s2x},${s2y}`}
                  fill={filled ? FILLS[lvl] : EMPTY}
                  stroke={filled ? STROKES[lvl] : EMPTY_S}
                  strokeWidth={filled ? '1' : '0.5'}
                  strokeLinejoin="miter"
                  opacity={filled ? 0.92 : 0.5}
                />
              )
            })}
            <circle cx={lx} cy={ly} r="11" fill="#F8F3E8" stroke="#C8B880" strokeWidth="0.9" />
            <circle cx={lx} cy={ly - 5} r="2" fill={dotColor} opacity="0.85" />
            <text x={lx} y={ly + 3.5} textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fontFamily="'Cinzel',Georgia,serif" fill="#6A5A38">
              {s.branch}
            </text>
          </g>
        )
      })}
      {/* Centre laiton */}
      <circle cx={cx} cy={cy} r="7" fill="#D4BC78" stroke="#A89050" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="3" fill="#8A6830" />
      {/* Légende */}
      {[
        { c: '#B8D4F0', l: 'Calme' },
        { c: '#F0CA70', l: 'Modéré' },
        { c: '#E87C7C', l: 'Agité' },
      ].map((item, i) => (
        <g key={i} transform={`translate(${28 + i * 64}, 228)`}>
          <polygon points="8,0 4,8 8,16 12,8" fill={item.c} stroke="none" opacity="0.9" />
          <text x="18" y="11" fontSize="8" fill={TXT3} fontFamily="'Cinzel',Georgia,serif">
            {item.l}
          </text>
        </g>
      ))}
    </svg>
  )
}
