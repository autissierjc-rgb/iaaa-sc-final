'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COLORS = {
  score: {
    0: { solid: '#E0DCD4', stroke: '#C8C4BC' },
    1: { solid: '#B8D4F0', stroke: '#7AAEDC' },
    2: { solid: '#F0CA70', stroke: '#D4A040' },
    3: { solid: '#E87C7C', stroke: '#C85858' },
  } as Record<number, { solid: string; stroke: string }>,
  brass: { light: '#D4C8A8', mid: '#C4B078', dark: '#A89050', ring: '#B8A880' },
  trajectory: {
    'Stabilisation':  { border: '#378ADD', bg: '#E6F1FB', text: '#185FA5' },
    'Escalation':     { border: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
    'Solution tiers': { border: '#EAB308', bg: '#FEF9C3', text: '#A16207' },
  } as Record<string, { border: string; bg: string; text: string }>,
  state: {
    'Stable':        { border: '#378ADD', text: '#185FA5', solid: '#378ADD' },
    'Contrôlable':   { border: '#3B82F6', text: '#1D4ED8', solid: '#3B82F6' },
    'Vigilance':     { border: '#EAB308', text: '#A16207', solid: '#EAB308' },
    'Critique':      { border: '#E24B4A', text: '#A32D2D', solid: '#E24B4A' },
    'Hors contrôle': { border: '#9B1515', text: '#7B0F0F', solid: '#9B1515' },
  } as Record<string, { border: string; text: string; solid: string }>,
}

const META: Record<string, { certified_by: string; date: string }> = {
  'ong-rdc':          { certified_by: 'Maël · Chef de base ONG Congo', date: '18 mars 2026' },
  'sequestration-v2': { certified_by: 'Maël · Chef de base ONG Congo', date: '19 mars 2026' },
  'iran-j19':         { certified_by: 'JCA · IAAA+',                   date: '22 mars 2026' },
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const NAVY = '#1B3A6B'
const GOLD = '#B89A6A'
const GOLD_L = '#CCA364'
const BG = '#F5F3EE'
const BG_P = '#FAFAF7'
const TXT = '#1a2a3a'
const TXT2 = '#5a6a7a'
const TXT3 = '#9aabb8'
const BDR = 'rgba(26,42,58,0.1)'
const BDR_G = 'rgba(184,154,106,0.25)'

const SEGS: [number, number, number][] = [[9, 40, 7], [43, 76, 10], [79, 112, 13]]

function lozD(a: number, r1: number, r2: number, w: number, cx: number, cy: number) {
  const co = Math.cos(a), si = Math.sin(a)
  const pp = a + Math.PI / 2, pc = Math.cos(pp), ps = Math.sin(pp)
  const rm = (r1 + r2) / 2
  const f = (n: number) => n.toFixed(2)
  return `M${f(cx+r1*co)},${f(cy+r1*si)}L${f(cx+rm*co+w*pc)},${f(cy+rm*si+w*ps)}L${f(cx+r2*co)},${f(cy+r2*si)}L${f(cx+rm*co-w*pc)},${f(cy+rm*si-w*ps)}Z`
}

function AstrolabeRadial({ scores, size = 280 }: { scores: any[]; size?: number }) {
  const cx = 140, cy = 140
  return (
    <svg viewBox="0 0 280 280" width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={133} fill="none" stroke="#C8B890" strokeWidth={0.6} opacity={0.45}/>
      <circle cx={cx} cy={cy} r={128} fill="none" stroke="#C8B890" strokeWidth={1} opacity={0.3}/>
      {[40, 76, 112].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#C8C0B0" strokeWidth={0.4} strokeDasharray="1.5 3" opacity={r===40?0.55:r===76?0.5:0.4}/>
      ))}
      {Array.from({ length: 32 }, (_, i) => {
        const a = (i / 32) * 2 * Math.PI - Math.PI / 2
        const major = i % 4 === 0
        const r1 = major ? 117 : 121, r2 = major ? 126 : 124
        return <line key={i} x1={(cx+r1*Math.cos(a)).toFixed(1)} y1={(cy+r1*Math.sin(a)).toFixed(1)} x2={(cx+r2*Math.cos(a)).toFixed(1)} y2={(cy+r2*Math.sin(a)).toFixed(1)} stroke="#C0B090" strokeWidth={major?0.8:0.4} opacity={major?0.65:0.38}/>
      })}
      {scores.map((sc: any, i: number) => {
        const a = (i * 45 - 90) * Math.PI / 180
        const ds = sc.display_score ?? sc.score ?? 0
        return (
          <g key={sc.branch ?? i}>
            {SEGS.map(([r1, r2, w], si) => {
              const minScore = si + 1
              const active = ds >= minScore
              const c = COLORS.score[active ? minScore : 0]
              return <path key={si} d={lozD(a, r1, r2, w, cx, cy)} fill={c.solid} stroke={c.stroke} strokeWidth={si===2&&ds===3?0.7:0.5} opacity={active?1:0.6}/>
            })}
            <text x={(cx+150*Math.cos(a)).toFixed(1)} y={(cy+150*Math.sin(a)).toFixed(1)} textAnchor="middle" dominantBaseline="central" fontFamily="Georgia,serif" fontSize={10.5} fontWeight={900} fontStyle="italic" fill={ds>0?COLORS.score[ds].stroke:'#AAAAAA'} opacity={ds>0?1:0.5}>
              {ROMAN[i]}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={9} fill={COLORS.brass.light} stroke={COLORS.brass.ring} strokeWidth={0.8}/>
      <circle cx={cx} cy={cy} r={5.5} fill={COLORS.brass.mid} opacity={0.9}/>
      <circle cx={cx} cy={cy} r={2.5} fill={COLORS.brass.dark}/>
    </svg>
  )
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ width: 18, height: 7, borderRadius: 2, background: score >= i ? COLORS.score[i].solid : COLORS.score[0].solid, border: `1px solid ${score >= i ? COLORS.score[i].stroke : COLORS.score[0].stroke}` }}/>
      ))}
    </div>
  )
}

export default function SituationCardPage({ params }: { params: { slug: string } }) {
  const [card, setCard] = useState<any>(null)
  const [tab, setTab] = useState<'sc' | 'cap' | 'analyse'>('sc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/data/${params.slug}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setCard({ ...d, certified: true, ...META[params.slug] })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: TXT3, fontStyle: 'italic' }}>Chargement...</div>
    </div>
  )

  if (!card) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: TXT2, fontStyle: 'italic' }}>Carte introuvable</div>
      <Link href="/library" style={{ fontSize: 12, color: NAVY, textDecoration: 'none' }}>← Retour à l'ATLAS</Link>
    </div>
  )

  const stateC = COLORS.state[card.state_label] ?? { border: '#9aabb8', text: '#5a6a7a', solid: '#9aabb8' }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'DM Sans', sans-serif", color: TXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Cinzel:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${BDR_G};border-radius:2px}
      `}</style>

      <nav style={{ background: BG, borderBottom: `1px solid ${BDR}`, padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 500, color: NAVY }}>Situation Card</div>
          <div style={{ fontSize: 9, color: TXT3 }}>powered by IAAA+</div>
        </Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/library" style={{ fontSize: 12, color: TXT2, textDecoration: 'none' }}>← ATLAS</Link>
          <Link href="/" style={{ fontSize: 12, color: NAVY, textDecoration: 'none', padding: '5px 12px', border: `1px solid ${BDR_G}`, borderRadius: 6 }}>Analyser →</Link>
        </div>
      </nav>

      <div style={{ background: `linear-gradient(135deg, #1B3A6B 0%, #2A4F8A 60%, #1E3560 100%)`, padding: '20px 28px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(184,154,106,0.15)', border: `1px solid rgba(184,154,106,0.35)`, borderRadius: 20, padding: '2px 10px' }}>
              <span style={{ fontSize: 9, color: GOLD_L, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>★ SC CERTIFIED</span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', fontFamily: "'Cinzel', serif" }}>{card.category?.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{card.title}</h1>
              <div style={{ fontSize: 10, color: 'rgba(184,154,106,0.65)' }}>{card.certified_by} · {card.date}</div>
            </div>
            <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: `1px solid rgba(184,154,106,0.3)`, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: '#E8D080', fontFamily: "'Cinzel', serif", lineHeight: 1 }}>{card.state_index_final}</div>
              <div style={{ fontSize: 8, color: 'rgba(232,208,128,0.55)', letterSpacing: '0.1em', marginTop: 2 }}>INDEX</div>
              <div style={{ fontSize: 11, color: stateC.border, fontWeight: 600, marginTop: 4, fontFamily: "'Cinzel', serif" }}>{card.state_label}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {([{ key: 'sc', label: 'Situation' }, { key: 'cap', label: 'Cap' }, { key: 'analyse', label: 'Analyse' }] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 18px', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.08em', background: tab === t.key ? BG : 'transparent', color: tab === t.key ? NAVY : 'rgba(255,255,255,0.5)', borderRadius: '6px 6px 0 0', transition: 'all .2s' }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 60px' }}>

        {tab === 'sc' && (
          <div>
            {card.insight && (
              <div style={{ background: 'rgba(184,154,106,0.07)', border: `1px solid ${BDR_G}`, borderRadius: 8, padding: '16px 18px', marginBottom: 24 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 8 }}>LECTURE</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, color: TXT, lineHeight: 1.75 }}>{card.insight}</div>
              </div>
            )}
            {card.astrolabe_scores && (
              <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 10, padding: '20px', marginBottom: 20 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 16 }}>ASTROLABE</div>
                <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flexShrink: 0 }}><AstrolabeRadial scores={card.astrolabe_scores} size={260}/></div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {card.astrolabe_scores.map((a: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 10, color: TXT3, fontStyle: 'italic', minWidth: 28, fontFamily: 'Georgia, serif' }}>{ROMAN[i]}</span>
                          <span style={{ fontSize: 12, color: TXT2, flex: 1 }}>{a.name}</span>
                          <ScoreBar score={a.display_score ?? 0}/>
                          <span style={{ fontSize: 10, color: TXT3, minWidth: 58 }}>{a.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                      {[{score:1,label:'Actif'},{score:2,label:'Modéré'},{score:3,label:'Dominant'}].map(({score,label}) => (
                        <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS.score[score].solid, border: `1px solid ${COLORS.score[score].stroke}` }}/>
                          <span style={{ fontSize: 10, color: TXT3 }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {card.radar_scores && (
              <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 14 }}>RADAR DE PRESSION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {card.radar_scores.map((r: any, i: number) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: TXT2 }}>{r.dimension}</span>
                        <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>{r.score}/3</span>
                      </div>
                      <div style={{ height: 5, background: BDR, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${(r.score/3)*100}%`, background: COLORS.score[r.score]?.solid ?? GOLD, borderRadius: 3 }}/>
                      </div>
                      {r.note && <div style={{ fontSize: 10, color: TXT3, marginTop: 4, lineHeight: 1.5 }}>{r.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {card.vulnerability && (
              <div style={{ background: 'rgba(226,75,74,0.05)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#E24B4A', letterSpacing: '0.12em', marginBottom: 6 }}>VULNÉRABILITÉ</div>
                <div style={{ fontSize: 13, color: TXT, lineHeight: 1.6 }}>{card.vulnerability}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'cap' && (
          <div>
            {card.cap_summary && (
              <>
                <div style={{ background: `linear-gradient(to right, rgba(27,58,107,0.06), rgba(184,154,106,0.08))`, border: `1px solid ${BDR_G}`, borderRadius: 10, padding: '20px 22px', marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.14em', marginBottom: 10 }}>CAP</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 20, color: NAVY, lineHeight: 1.45, marginBottom: 12 }}>{card.cap_summary.hook}</div>
                  {card.cap_summary.insight && <div style={{ fontSize: 13, color: TXT2, lineHeight: 1.7 }}>{card.cap_summary.insight}</div>}
                </div>
                {card.asymmetry && (
                  <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 6 }}>ASYMÉTRIE</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: TXT, lineHeight: 1.65 }}>{card.asymmetry}</div>
                  </div>
                )}
                {card.cap_summary.watch && (
                  <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#A16207', letterSpacing: '0.12em', marginBottom: 6 }}>WATCH</div>
                    <div style={{ fontSize: 13, color: TXT, lineHeight: 1.6 }}>{card.cap_summary.watch}</div>
                  </div>
                )}
              </>
            )}
            {card.trajectories && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 14 }}>TRAJECTOIRES</div>
                {card.trajectories.map((t: any, i: number) => {
                  const tc = COLORS.trajectory[t.type] ?? { border: '#9aabb8', bg: '#F5F3EE', text: '#5a6a7a' }
                  return (
                    <div key={i} style={{ padding: '14px 16px', background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 8, borderLeft: `4px solid ${tc.border}`, marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: tc.text, fontFamily: "'Cinzel', serif", letterSpacing: '0.04em', marginBottom: 5 }}>{t.type} — {t.title}</div>
                      <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.65, marginBottom: t.probability ? 6 : 0 }}>{t.description}</div>
                      {t.probability && <div style={{ fontSize: 10, color: tc.text, fontStyle: 'italic' }}>{t.probability}</div>}
                    </div>
                  )
                })}
              </div>
            )}
            {card.signal && (
              <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#A16207', letterSpacing: '0.12em', marginBottom: 6 }}>SIGNAL CLÉ</div>
                <div style={{ fontSize: 13, color: TXT, lineHeight: 1.65, fontStyle: 'italic' }}>{card.signal}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'analyse' && card.analysis && (
          <div>
            {card.analysis.lecture_systeme && (
              <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 8 }}>LECTURE SYSTÈME</div>
                <div style={{ fontSize: 13, color: TXT, lineHeight: 1.75 }}>{card.analysis.lecture_systeme}</div>
              </div>
            )}
            {card.analysis.avertissement && (
              <div style={{ background: 'rgba(226,75,74,0.05)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#E24B4A', letterSpacing: '0.12em', marginBottom: 6 }}>AVERTISSEMENT</div>
                <div style={{ fontSize: 13, color: TXT, lineHeight: 1.65 }}>{card.analysis.avertissement}</div>
              </div>
            )}
            {card.analysis.mouvements_recommandes && (
              <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 12 }}>MOUVEMENTS RECOMMANDÉS</div>
                {card.analysis.mouvements_recommandes.map((m: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: BDR_G, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: GOLD, fontWeight: 600 }}>{i+1}</div>
                    <div style={{ fontSize: 13, color: TXT, lineHeight: 1.65, paddingTop: 1 }}>{m}</div>
                  </div>
                ))}
              </div>
            )}
            {card.analysis.synthese && (
              <div style={{ background: `rgba(27,58,107,0.04)`, border: `1px solid ${BDR_G}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 8 }}>SYNTHÈSE</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 15, color: TXT, lineHeight: 1.75 }}>{card.analysis.synthese}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 32 }}>
          <Link href="/library" style={{ padding: '8px 20px', border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 12, color: TXT2, textDecoration: 'none' }}>← ATLAS</Link>
          <button style={{ padding: '8px 20px', background: 'rgba(27,58,107,0.08)', border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 12, color: NAVY, cursor: 'pointer' }}>Partager</button>
          <Link href="/" style={{ padding: '8px 20px', background: NAVY, border: 'none', borderRadius: 8, fontSize: 12, color: '#fff', textDecoration: 'none' }}>Analyser ma situation →</Link>
        </div>
      </main>
    </div>
  )
}

