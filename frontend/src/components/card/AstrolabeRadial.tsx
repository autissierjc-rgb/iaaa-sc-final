'use client'

import { AstrolabeScore } from '@/types/sis'
import { COLORS, ROMAN } from '@/lib/tokens'

interface Props {
  scores: AstrolabeScore[]
  size?: number
  onBranchClick?: (s: AstrolabeScore) => void
}

const SEGS: [number, number, number][] = [[9, 40, 7], [43, 76, 10], [79, 112, 13]]

function lozD(a: number, r1: number, r2: number, w: number, cx: number, cy: number) {
  const co = Math.cos(a), si = Math.sin(a)
  const pp = a + Math.PI / 2, pc = Math.cos(pp), ps = Math.sin(pp)
  const rm = (r1 + r2) / 2, f = (n: number) => n.toFixed(2)
  return `M${f(cx+r1*co)},${f(cy+r1*si)}L${f(cx+rm*co+w*pc)},${f(cy+rm*si+w*ps)}L${f(cx+r2*co)},${f(cy+r2*si)}L${f(cx+rm*co-w*pc)},${f(cy+rm*si-w*ps)}Z`
}

export default function AstrolabeRadial({ scores, size = 268, onBranchClick }: Props) {
  const cx = 140, cy = 140

  return (
    <svg viewBox="0 0 280 280" width={size} height={size} style={{ display: 'block' }}>
      {/* Anneaux laiton */}
      <circle cx={cx} cy={cy} r={133} fill="none" stroke="#C8B890" strokeWidth={0.6} opacity={0.45} />
      <circle cx={cx} cy={cy} r={128} fill="none" stroke="#C8B890" strokeWidth={1} opacity={0.3} />
      {/* Guides */}
      {[40, 76, 112].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#C8C0B0" strokeWidth={0.4} strokeDasharray="1.5 3" opacity={r===40?0.55:r===76?0.5:0.4} />
      ))}
      {/* Graduations */}
      {Array.from({ length: 32 }, (_, i) => {
        const a = (i / 32) * 2 * Math.PI - Math.PI / 2
        const major = i % 4 === 0
        const r1 = major ? 117 : 121, r2 = major ? 126 : 124
        return <line key={i} x1={(cx+r1*Math.cos(a)).toFixed(1)} y1={(cy+r1*Math.sin(a)).toFixed(1)} x2={(cx+r2*Math.cos(a)).toFixed(1)} y2={(cy+r2*Math.sin(a)).toFixed(1)} stroke="#C0B090" strokeWidth={major?0.8:0.4} opacity={major?0.65:0.38} />
      })}
      {/* 8 branches */}
      {scores.map((sc, i) => {
        const a = (i * 45 - 90) * Math.PI / 180
        const ds = sc.display_score
        return (
          <g key={sc.branch} onClick={() => onBranchClick?.(sc)} style={{ cursor: onBranchClick ? 'pointer' : 'default' }}>
            {SEGS.map(([r1, r2, w], si) => {
              const minScore = si + 1
              const active = ds >= minScore
              const c = active ? COLORS.score[minScore] : COLORS.score[0]
              return <path key={si} d={lozD(a, r1, r2, w, cx, cy)} fill={c.solid} stroke={c.stroke} strokeWidth={si===2&&ds===3?0.7:0.5} opacity={active?1:0.6} style={{ transition: 'fill .4s ease' }} />
            })}
            <text x={(cx+150*Math.cos(a)).toFixed(1)} y={(cy+150*Math.sin(a)).toFixed(1)} textAnchor="middle" dominantBaseline="central" fontFamily="Georgia,serif" fontSize={10.5} fontWeight={900} fontStyle="italic" fill={ds>0?COLORS.score[ds].stroke:'#AAAAAA'} opacity={ds>0?1:0.5}>
              {ROMAN[i]}
            </text>
          </g>
        )
      })}
      {/* Centre laiton */}
      <circle cx={cx} cy={cy} r={9} fill={COLORS.brass.light} stroke={COLORS.brass.ring} strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={5.5} fill={COLORS.brass.mid} opacity={0.9} />
      <circle cx={cx} cy={cy} r={2.5} fill={COLORS.brass.dark} />
    </svg>
  )
}
