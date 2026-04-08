'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import GlobeInteractif from '@/components/ui/globe-interactif'

// ── Palette ───────────────────────────────────────────────────────────────────
const NAVY  = '#1B3A6B'
const GOLD  = '#B89A6A'
const GOLD_L = '#CCA364'
const BG    = '#F5F3EE'
const BG_P  = '#FAFAF7'
const BG_PR = '#F7F5F0'
const TXT   = '#1a2a3a'
const TXT2  = '#5a6a7a'
const TXT3  = '#9aabb8'
const BDR   = 'rgba(26,42,58,0.1)'
const BDR_G = 'rgba(184,154,106,0.25)'

// ── Traductions ───────────────────────────────────────────────────────────────
const TX = {
  FR: {
    describe: 'Décrivez votre situation en texte libre.',
    hints: [
      "Un conflit d'équipe autour d'une réorganisation",
      "Une décision stratégique avec plusieurs options",
      "Une crise géopolitique en développement",
      "Mon partenaire s'est éloigné, je ne sais pas comment aborder le sujet",
    ],
    generate: 'Générer',
    analysing: 'Analyse en cours...',
    waiting: 'Décrivez une situation et cliquez la boussole',
    clarify_title: 'Quelques précisions',
    clarify_sub: 'Pour analyser votre situation, j\'ai besoin de comprendre :',
    clarify_btn: 'Répondre et analyser',
    block_title: 'Situation non analysable',
    tab_situation: 'Situation',
    tab_cap: 'Cap',
    tab_analyse: 'Analyse',
    see_full: 'Voir la carte complète',
    partager: 'Partager',
    restreint: 'Restreint',
    public: 'Public',
    historique: 'Historique',
    saved: 'Enregistrées',
    tagline: 'Voir la structure pour pouvoir décider',
    offres: 'Offres',
    connexion: 'Connexion',
  },
  EN: {
    describe: 'Describe your situation in free text.',
    hints: [
      "A team conflict around a restructuring",
      "A strategic decision with multiple options",
      "A developing geopolitical crisis",
      "My partner has grown distant, I don't know how to approach it",
    ],
    generate: 'Generate',
    analysing: 'Analysing...',
    waiting: 'Describe a situation and click the compass',
    clarify_title: 'A few clarifications',
    clarify_sub: 'To analyse your situation, I need to understand:',
    clarify_btn: 'Answer and analyse',
    block_title: 'Situation cannot be analysed',
    tab_situation: 'Situation',
    tab_cap: 'Cap',
    tab_analyse: 'Analysis',
    see_full: 'See full card',
    partager: 'Share',
    restreint: 'Private',
    public: 'Public',
    historique: 'History',
    saved: 'Saved',
    tagline: 'See the structure to decide',
    offres: 'Plans',
    connexion: 'Sign in',
  },
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const colors = ['#E0DCD4', '#B8D4F0', '#F0CA70', '#E87C7C']
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 14, height: 6, borderRadius: 2,
          background: score >= i ? colors[i] : '#E0DCD4',
        }} />
      ))}
    </div>
  )
}

// ── Boussole SVG interactive ──────────────────────────────────────────────────
function Boussole({
  active, loading, onClick,
}: { active: boolean; loading: boolean; onClick: () => void }) {
  const angle = useRef(0)
  const [needle, setNeedle] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (loading) {
      const spin = () => {
        angle.current = (angle.current + 4) % 360
        setNeedle(angle.current)
        raf.current = requestAnimationFrame(spin)
      }
      raf.current = requestAnimationFrame(spin)
    } else {
      if (raf.current) cancelAnimationFrame(raf.current)
      setNeedle(0)
    }
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [loading])

  const pulseStyle = active && !loading
    ? { filter: `drop-shadow(0 0 8px rgba(184,154,106,0.7))` }
    : {}

  return (
    <button
      onClick={onClick}
      disabled={!active || loading}
      title={active ? 'Générer la Situation Card' : 'Décrivez une situation'}
      style={{
        width: 52, height: 52, borderRadius: '50%', border: 'none',
        background: 'none', cursor: active ? 'pointer' : 'not-allowed',
        padding: 0, transition: 'filter 0.3s',
        ...pulseStyle,
      }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52">
        {/* Anneau extérieur */}
        <circle cx="26" cy="26" r="25" fill="none"
          stroke={active ? GOLD : '#C8C4BC'} strokeWidth="1.5"
          strokeDasharray={active ? '3 2' : '2 2'}
          opacity={active ? 1 : 0.4}
        />
        {/* Face */}
        <circle cx="26" cy="26" r="22" fill={active ? NAVY : '#B0BAC8'} opacity={active ? 1 : 0.5} />
        {/* Graduation */}
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i * 360 / 32) * Math.PI / 180
          const r1 = i % 4 === 0 ? 16 : 18
          return (
            <line key={i}
              x1={26 + r1 * Math.sin(a)} y1={26 - r1 * Math.cos(a)}
              x2={26 + 20 * Math.sin(a)} y2={26 - 20 * Math.cos(a)}
              stroke={GOLD} strokeWidth={i % 4 === 0 ? 1 : 0.5}
              opacity={active ? 0.6 : 0.2}
            />
          )
        })}
        {/* Aiguille */}
        <g transform={`rotate(${needle} 26 26)`}>
          {/* Nord — blanc */}
          <polygon points="26,9 24,26 28,26" fill="#fff" opacity={active ? 0.95 : 0.4} />
          {/* Sud — gold */}
          <polygon points="26,43 24,26 28,26" fill={GOLD_L} opacity={active ? 0.9 : 0.3} />
        </g>
        {/* Centre */}
        <circle cx="26" cy="26" r="3" fill={active ? GOLD : '#9AABB8'} />
        <circle cx="26" cy="26" r="1.5" fill="#fff" />
        {/* Pulse ring — animé en CSS */}
        {active && !loading && (
          <circle cx="26" cy="26" r="22" fill="none"
            stroke={GOLD} strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="22;26;22" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </button>
  )
}

// ── AstrolabeRadial (onglet Analyse) ─────────────────────────────────────────
function AstrolabeRadial({ scores }: { scores: Array<{ display_score: number; name: string; branch: string }> }) {
  const cx = 110, cy = 110, r = 90
  const SCORE_COLORS: Record<number, { fill: string; stroke: string }> = {
    0: { fill: '#E0DCD4', stroke: '#C8C4BC' },
    1: { fill: '#B8D4F0', stroke: '#7AAEDC' },
    2: { fill: '#F0CA70', stroke: '#D4A830' },
    3: { fill: '#E87C7C', stroke: '#C84040' },
  }
  return (
    <svg viewBox="0 0 220 220" width="200" height="200">
      {/* Cercles guide */}
      {[30, 60, 90].map(rr => (
        <circle key={rr} cx={cx} cy={cy} r={rr} fill="none"
          stroke={BDR_G} strokeWidth="0.8" strokeDasharray="3 3" />
      ))}
      {/* 8 branches */}
      {scores.map((s, i) => {
        const angleRad = (i * 45 - 90) * Math.PI / 180
        const xEnd = cx + r * Math.cos(angleRad)
        const yEnd = cy + r * Math.sin(angleRad)
        const scoreR = s.display_score * 30
        const xScore = cx + scoreR * Math.cos(angleRad)
        const yScore = cy + scoreR * Math.sin(angleRad)
        const col = SCORE_COLORS[s.display_score] ?? SCORE_COLORS[0]
        const xLabel = cx + (r + 14) * Math.cos(angleRad)
        const yLabel = cy + (r + 14) * Math.sin(angleRad)
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={xEnd} y2={yEnd}
              stroke={BDR_G} strokeWidth="0.8" />
            {s.display_score > 0 && (
              <line x1={cx} y1={cy} x2={xScore} y2={yScore}
                stroke={col.stroke} strokeWidth="2" opacity="0.6" />
            )}
            <polygon
              points={`${cx},${cy - 5} ${xScore - 4},${yScore} ${cx},${cy + 5} ${xScore + 4},${yScore}`}
              fill={col.fill} stroke={col.stroke} strokeWidth="0.8" opacity="0.85"
            />
            <text x={xLabel} y={yLabel}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill={TXT3} fontFamily="'Cinzel', serif">
              {s.branch}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="5" fill={GOLD_L} />
    </svg>
  )
}

// ── Panneau SC avec 3 onglets ─────────────────────────────────────────────────
function SituationCardPanel({
  sc, lang, onExpand,
}: { sc: Record<string, any>; lang: 'FR' | 'EN'; onExpand: () => void }) {
  const [tab, setTab] = useState<'situation' | 'cap' | 'analyse'>('situation')
  const t = TX[lang]

  const tabs: Array<{ key: 'situation' | 'cap' | 'analyse'; label: string }> = [
    { key: 'situation', label: t.tab_situation },
    { key: 'cap',       label: t.tab_cap       },
    { key: 'analyse',   label: t.tab_analyse   },
  ]

  const insight       = lang === 'FR' ? sc.insight       : (sc.insight_en       ?? sc.insight)
  const vulnerability = lang === 'FR' ? sc.vulnerability : (sc.vulnerability_en ?? sc.vulnerability)
  const asymmetry     = lang === 'FR' ? sc.asymmetry     : (sc.asymmetry_en     ?? sc.asymmetry)
  const signal        = lang === 'FR' ? sc.signal        : (sc.signal_en        ?? sc.signal)
  const cap           = sc.cap_summary ?? {}
  const hook          = lang === 'FR' ? cap.hook    : (cap.hook_en    ?? cap.hook)
  const capInsight    = lang === 'FR' ? cap.insight : (cap.insight_en ?? cap.insight)
  const watch         = lang === 'FR' ? cap.watch   : (cap.watch_en   ?? cap.watch)
  const stateLabel    = lang === 'FR' ? sc.state_label : (sc.state_label_en ?? sc.state_label)
  const trajectories  = sc.trajectories ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header SC */}
      <div style={{
        padding: '10px 14px 8px',
        background: `linear-gradient(to right, ${NAVY}, #2A4A80)`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', fontFamily: "'Cinzel', serif", marginBottom: 2 }}>
            SITUATION CARD
          </div>
          <div style={{ fontSize: 13, color: '#fff', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.3 }}>
            {lang === 'FR' ? sc.title : (sc.title_en ?? sc.title)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(200,168,64,0.5)',
            borderRadius: 20, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8D080', fontFamily: "'Cinzel', serif" }}>
              {sc.state_index_final}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(232,208,128,0.7)' }}>· {stateLabel}</span>
          </div>
          <button onClick={onExpand} style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4, padding: '4px 6px',
            cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BDR_G}`, background: BG_P }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            flex: 1, padding: '8px 4px', fontSize: 11,
            color: tab === tb.key ? NAVY : TXT3,
            background: 'none', border: 'none',
            borderBottom: tab === tb.key ? `2px solid ${GOLD}` : '2px solid transparent',
            fontFamily: "'Cinzel', serif",
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {/* ── ONGLET SITUATION ─────────────────────────────────────── */}
        {tab === 'situation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              background: 'rgba(184,154,106,0.08)',
              border: `1px solid ${BDR_G}`,
              borderRadius: 6, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>
                LECTURE
              </div>
              <div style={{ fontSize: 12, color: TXT, fontStyle: 'italic', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif" }}>
                {insight}
              </div>
            </div>

            <div style={{
              background: 'rgba(224,107,74,0.06)',
              border: '1px solid rgba(224,107,74,0.2)',
              borderRadius: 6, padding: '6px 10px',
            }}>
              <div style={{ fontSize: 9, color: '#E06B4A', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 3 }}>
                {lang === 'FR' ? 'VULNÉRABILITÉ' : 'VULNERABILITY'}
              </div>
              <div style={{ fontSize: 11, color: TXT, fontWeight: 500, lineHeight: 1.5 }}>{vulnerability}</div>
            </div>

            {asymmetry && (
              <div style={{
                background: 'rgba(55,138,221,0.06)',
                border: '1px solid rgba(55,138,221,0.2)',
                borderRadius: 6, padding: '6px 10px',
              }}>
                <div style={{ fontSize: 9, color: '#378ADD', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 3 }}>
                  {lang === 'FR' ? 'ASYMÉTRIE' : 'ASYMMETRY'}
                </div>
                <div style={{ fontSize: 11, color: TXT, lineHeight: 1.5 }}>{asymmetry}</div>
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET CAP ───────────────────────────────────────────── */}
        {tab === 'cap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hook && (
              <div style={{
                background: `linear-gradient(135deg, ${NAVY}08, ${GOLD}08)`,
                border: `1px solid ${BDR_G}`,
                borderRadius: 6, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>CAP</div>
                <div style={{ fontSize: 13, color: TXT, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5, fontWeight: 500 }}>
                  {hook}
                </div>
                {capInsight && (
                  <div style={{ fontSize: 11, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>{capInsight}</div>
                )}
              </div>
            )}

            {watch && (
              <div style={{
                background: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.25)',
                borderRadius: 6, padding: '6px 10px',
              }}>
                <div style={{ fontSize: 9, color: '#A16207', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 3 }}>
                  {lang === 'FR' ? 'SIGNAL À SURVEILLER' : 'WATCH'}
                </div>
                <div style={{ fontSize: 11, color: TXT, lineHeight: 1.5 }}>{watch}</div>
              </div>
            )}

            {trajectories.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                  {lang === 'FR' ? 'TRAJECTOIRES' : 'TRAJECTORIES'}
                </div>
                {trajectories.map((tr: any, i: number) => {
                  const label  = lang === 'FR' ? tr.type  : (tr.type_en  ?? tr.type)
                  const title  = lang === 'FR' ? tr.title : (tr.title_en ?? tr.title)
                  const desc   = lang === 'FR' ? tr.description : (tr.description_en ?? tr.description)
                  const prob   = lang === 'FR' ? tr.probability : (tr.probability_en ?? tr.probability)
                  const signal = lang === 'FR' ? tr.signal_precurseur : (tr.signal_precurseur_en ?? tr.signal_precurseur)
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8,
                      background: `${tr.color}08`,
                      border: `1px solid ${tr.color}30`,
                      borderLeft: `3px solid ${tr.color}`,
                      borderRadius: 5, padding: '6px 10px',
                    }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: tr.color, marginBottom: 2 }}>
                          {label} — {title}
                        </div>
                        <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.5, marginBottom: 3 }}>{desc}</div>
                        {prob && <div style={{ fontSize: 9, color: TXT3, fontStyle: 'italic' }}>{prob}</div>}
                        {signal && (
                          <div style={{ fontSize: 9, color: TXT3, marginTop: 3 }}>
                            → {signal}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET ANALYSE ───────────────────────────────────────── */}
        {tab === 'analyse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sc.astrolabe_scores?.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                  ASTROLABE
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <AstrolabeRadial scores={sc.astrolabe_scores} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                  {sc.astrolabe_scores.map((a: any) => {
                    const name = lang === 'FR' ? a.name : (a.name_en ?? a.name)
                    const lbl  = lang === 'FR' ? a.label : (a.label_en ?? a.label)
                    return (
                      <div key={a.branch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: TXT3, fontStyle: 'italic', minWidth: 28 }}>{a.branch}</span>
                        <span style={{ fontSize: 9, color: TXT2, minWidth: 60 }}>{name}</span>
                        <ScoreBar score={a.display_score} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {sc.radar_scores?.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                  {lang === 'FR' ? 'RADAR DE PRESSION' : 'PRESSURE RADAR'}
                </div>
                {sc.radar_scores.map((r: any, i: number) => {
                  const dim  = lang === 'FR' ? r.dimension : (r.dimension_en ?? r.dimension)
                  const note = lang === 'FR' ? r.note      : (r.note_en      ?? r.note)
                  return (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 9, color: TXT2, minWidth: 72 }}>{dim}</span>
                        <div style={{ flex: 1, height: 4, background: BDR, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${(r.score / 3) * 100}%`, height: '100%', background: GOLD_L, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 9, color: TXT3 }}>{r.score}/3</span>
                      </div>
                      {note && <div style={{ fontSize: 9, color: TXT3, lineHeight: 1.4, paddingLeft: 78 }}>{note}</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {signal && (
              <div style={{
                background: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.25)',
                borderRadius: 6, padding: '6px 10px',
              }}>
                <div style={{ fontSize: 9, color: '#A16207', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 3 }}>
                  {lang === 'FR' ? 'SIGNAL CLÉ' : 'KEY SIGNAL'}
                </div>
                <div style={{ fontSize: 11, color: TXT, lineHeight: 1.5 }}>{signal}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bas SC : 3 boutons */}
      <div style={{
        borderTop: `1px solid ${BDR}`,
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: NAVY, color: '#fff', border: 'none',
          borderRadius: 6, padding: '6px 8px', fontSize: 10,
          fontFamily: "'Cinzel', serif", letterSpacing: '0.06em',
          cursor: 'pointer',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {lang === 'FR' ? 'Partager' : 'Share'}
        </button>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: 'transparent', color: TXT2,
          border: `1px solid ${BDR}`, borderRadius: 6, padding: '6px 8px', fontSize: 10,
          fontFamily: "'Cinzel', serif", letterSpacing: '0.06em',
          cursor: 'pointer',
        }}>
          <Image src="/pictos/cartes.jpeg" alt="" width={12} height={12} style={{ objectFit: 'cover', borderRadius: 2 }} unoptimized />
          {lang === 'FR' ? 'Lectures' : 'Readings'}
        </button>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: 'transparent', color: TXT2,
          border: `1px solid ${BDR}`, borderRadius: 6, padding: '6px 8px', fontSize: 10,
          fontFamily: "'Cinzel', serif", letterSpacing: '0.06em',
          cursor: 'pointer',
        }}>
          <Image src="/pictos/Tracabilité.png" alt="" width={12} height={12} style={{ objectFit: 'contain' }} unoptimized />
          {lang === 'FR' ? 'Collaboration' : 'Collaborate'}
        </button>
      </div>
    </div>
  )
}

// ── SidePanel ─────────────────────────────────────────────────────────────────
function SidePanel({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 200 }} />}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 'min(340px, 90vw)', background: BG_P,
        borderRight: `1px solid ${BDR}`, zIndex: 201,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.26s ease',
        boxShadow: open ? '4px 0 20px rgba(26,42,58,0.1)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BDR}` }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: NAVY, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TXT3, fontSize: 20 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>{children}</div>
      </div>
    </>
  )
}

// ── MODULES ───────────────────────────────────────────────────────────────────
const MODULES = [
  { key: 'clarity', tag: 'Clarity', sub: { FR: 'Individuel', EN: 'Individual' }, href: '/clarity' },
  { key: 'sis',     tag: 'SIS',     sub: { FR: 'Collectif Pro', EN: 'Pro Collective' }, href: '/sis' },
  { key: 'iaaa',    tag: 'IAAA+',   sub: { FR: 'Gouvernance', EN: 'Governance' }, href: '/enterprise' },
  { key: 'atlas',   tag: 'ATLAS',   sub: { FR: 'Cartes publiques', EN: 'Public cards' }, href: '/library' },
]

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
export default function HomeClient() {
  const [lang, setLang]             = useState<'FR' | 'EN'>('FR')
  const [activeTab, setActiveTab]   = useState(0)
  const [situation, setSituation]   = useState('')
  const [scVisible, setScVisible]   = useState(false)
  const [scData, setScData]         = useState<Record<string, any> | null>(null)
  const [scLoading, setScLoading]   = useState(false)
  const [scExpanded, setScExpanded] = useState(false)
  const [gateMode, setGateMode]     = useState<'idle' | 'clarify' | 'block'>('idle')
  const [questions, setQuestions]   = useState<string[]>([])
  const [blockReason, setBlockReason] = useState('')
  const [answers, setAnswers]       = useState<string[]>([])
  const [panelHistory, setPanelHistory] = useState(false)
  const [panelSaved, setPanelSaved] = useState(false)

  const t = TX[lang]
  const isTyping = situation.trim().length > 10
  const canGenerate = isTyping && !scLoading && gateMode !== 'block'

  // Délai de frappe → appel Response Gate silencieux
  useEffect(() => {
    if (!isTyping) { setGateMode('idle'); setQuestions([]); setBlockReason(''); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation: situation.trim(), lang }),
        })
        const data = await res.json()
        if (data.gate === 'CLARIFY') {
          setGateMode('clarify')
          setQuestions(data.questions ?? [])
          setAnswers(new Array(data.questions?.length ?? 0).fill(''))
        } else if (data.gate === 'BLOCK') {
          setGateMode('block')
          setBlockReason(data.reason ?? '')
        } else {
          setGateMode('idle')
        }
      } catch { /* silencieux */ }
    }, 2000)
    return () => clearTimeout(timer)
  }, [situation, lang])

  async function handleGenerate() {
    if (!canGenerate) return
    setScLoading(true)
    setScVisible(true)
    setGateMode('idle')

    // Construit la situation enrichie avec les réponses si CLARIFY
    let fullSituation = situation.trim()
    if (questions.length > 0 && answers.some(a => a.trim())) {
      const qa = questions.map((q, i) => `${q}\n${answers[i] ?? ''}`).join('\n\n')
      fullSituation = `${fullSituation}\n\nPrécisions :\n${qa}`
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: fullSituation, lang }),
      })
      const data = await res.json()
      if (data.gate === 'GENERATE' && data.sc) {
        setScData(data.sc)
      } else if (data.gate === 'CLARIFY') {
        setGateMode('clarify')
        setQuestions(data.questions ?? [])
        setAnswers(new Array(data.questions?.length ?? 0).fill(''))
        setScVisible(false)
      } else if (data.gate === 'BLOCK') {
        setGateMode('block')
        setBlockReason(data.reason ?? '')
        setScVisible(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setScLoading(false)
    }
  }

  const HISTORY_ITEMS = [
    { title: 'Séquestration — ONG RDC', date: '19 mars', index: 85, state: 'Critique' },
    { title: 'Guerre Iran — Jour 19',   date: '22 mars', index: 91, state: 'Hors contrôle' },
    { title: "Conflit d'équipe",         date: '30 mars', index: 54, state: 'Contrôlable' },
  ]
  const SAVED_ITEMS = [
    { title: 'Iran / Israël — tensions régionales', date: '23 mars', index: 72 },
    { title: 'Gouvernance — vote bloqué',           date: '19 mars', index: 55 },
  ]

  return (
    <>
      {/* Panels latéraux */}
      <SidePanel open={panelHistory} title={t.historique} onClose={() => setPanelHistory(false)}>
        {HISTORY_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '9px 0', borderBottom: `1px solid ${BDR}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: TXT, fontStyle: 'italic', marginBottom: 3 }}>{item.title}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, color: TXT3 }}>{item.date}</span>
              <span style={{ fontSize: 10, color: GOLD }}>Index {item.index}</span>
              <span style={{ fontSize: 10, color: TXT2 }}>— {item.state}</span>
            </div>
          </div>
        ))}
      </SidePanel>

      <SidePanel open={panelSaved} title={t.saved} onClose={() => setPanelSaved(false)}>
        {SAVED_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '9px 0', borderBottom: `1px solid ${BDR}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: TXT, fontStyle: 'italic', marginBottom: 3 }}>{item.title}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, color: TXT3 }}>{item.date}</span>
              <span style={{ fontSize: 10, color: GOLD }}>Index {item.index}</span>
            </div>
          </div>
        ))}
      </SidePanel>

      {/* SC plein écran */}
      {scExpanded && scData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: BG_P, borderRadius: 12, width: '100%', maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: `1px solid ${BDR_G}` }}>
            <SituationCardPanel sc={scData} lang={lang} onExpand={() => setScExpanded(false)} />
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: BG }}>

        {/* HEADER */}
        <header style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', padding: '16px 36px',
          background: BG, borderBottom: `1px solid ${BDR}`,
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${BDR_G}` }}>
              <Image src="/pictos/LOOGO IAAA+.jpg" alt="IAAA+" width={46} height={46} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: NAVY, fontFamily: "'Cinzel', serif", letterSpacing: '0.02em' }}>Situation Card</div>
              <div style={{ fontSize: 10, color: TXT3, letterSpacing: '.04em' }}>powered by IAAA+</div>
            </div>
          </Link>

          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: GOLD, textAlign: 'center', lineHeight: 1.25, fontStyle: 'italic' }}>
            {lang === 'FR' ? <>Comprendre les situations complexes<br />par une carte.</> : <>Understanding complex situations<br />through a card.</>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
            <Link href="/pricing" style={{ fontSize: 12.5, color: TXT2, textDecoration: 'none' }}>{t.offres}</Link>
            <Link href="/login" style={{ fontSize: 12.5, color: TXT2, textDecoration: 'none' }}>{t.connexion}</Link>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 12, borderLeft: `1px solid ${BDR}` }}>
              {(['FR', 'EN'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: 'none', background: 'none',
                  color: lang === l ? NAVY : TXT2,
                }}>{l}</button>
              ))}
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <main style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 28px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 460 }}>

            {/* BLOC GAUCHE */}
            <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${BDR}`, padding: '0 16px', gap: 2 }}>
                {[lang === 'FR' ? 'Texte' : 'Text', 'Documents', 'Images'].map((tb, i) => (
                  <button key={tb} onClick={() => setActiveTab(i)} style={{
                    padding: '10px 9px', fontSize: 12,
                    color: activeTab === i ? TXT2 : TXT3,
                    cursor: 'pointer', border: 'none', background: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: activeTab === i ? `2px solid ${GOLD_L}` : '2px solid transparent',
                  }}>{tb}</button>
                ))}
              </div>

              {/* Zone de saisie / questions / blocage */}
              <div style={{ flex: 1, position: 'relative', padding: 16 }}>

                {/* Mode CLARIFY */}
                {gateMode === 'clarify' && questions.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, color: NAVY, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', marginBottom: 8 }}>
                      {t.clarify_sub}
                    </div>
                    {questions.map((q, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: TXT2, marginBottom: 4 }}>{q}</div>
                        <textarea
                          value={answers[i] ?? ''}
                          onChange={e => {
                            const a = [...answers]
                            a[i] = e.target.value
                            setAnswers(a)
                          }}
                          rows={2}
                          style={{
                            width: '100%', border: `1px solid ${BDR}`, borderRadius: 6,
                            padding: '6px 8px', fontSize: 11,
                            fontFamily: "'DM Sans', sans-serif", resize: 'none',
                            background: BG, color: TXT, outline: 'none',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <textarea
                      value={situation}
                      onChange={e => { setSituation(e.target.value); setGateMode('idle') }}
                      style={{
                        width: '100%', height: '100%', minHeight: 270,
                        border: 'none', background: 'transparent', resize: 'none',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                        color: TXT, outline: 'none', lineHeight: 1.7,
                        position: 'relative', zIndex: 2,
                      }}
                    />
                    {!situation && (
                      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, pointerEvents: 'none', zIndex: 1 }}>
                        <span style={{ fontSize: 14, color: TXT3, display: 'block', marginBottom: 10 }}>{t.describe}</span>
                        {t.hints.map((h, i) => (
                          <span key={i}
                            style={{ display: 'block', fontSize: 12.5, color: TXT3, opacity: i === 3 ? 0.38 : 0.55, marginBottom: 6, fontStyle: i === 3 ? 'italic' : 'normal', pointerEvents: 'auto', cursor: 'pointer' }}
                            onClick={() => setSituation(h)}>{h}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Message BLOCK */}
                {gateMode === 'block' && blockReason && (
                  <div style={{
                    marginTop: 8, padding: '8px 10px',
                    background: 'rgba(224,107,74,0.06)',
                    border: '1px solid rgba(224,107,74,0.3)',
                    borderRadius: 6, fontSize: 11, color: '#A32D2D',
                  }}>
                    {blockReason}
                  </div>
                )}
              </div>

              {/* Barre bas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderTop: `1px solid ${BDR}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TXT2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                  <button style={{ width: 30, height: 30, border: `1px solid ${BDR}`, background: BG_P, cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TXT2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="2" width="6" height="11" rx="3" />
                      <path d="M19 10a7 7 0 01-14 0" /><line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </button>
                </div>

                {/* BOUSSOLE — déclencheur SC */}
                <Boussole active={canGenerate} loading={scLoading} onClick={handleGenerate} />
              </div>
            </div>

            {/* BLOC DROIT */}
            <div style={{ background: BG_PR, border: `1px solid ${BDR_G}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Chips visibilité — toujours visibles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: `1px solid ${BDR_G}` }}>
                {[t.restreint, t.public].map(l => (
                  <button key={l} style={{ padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid #dde3e8`, color: '#b0bcc8', background: 'transparent', fontFamily: "'DM Sans', sans-serif" }}>{l}</button>
                ))}
                <button style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${BDR}`, background: 'none', cursor: 'pointer', fontSize: 11, color: TXT3, marginRight: 'auto' }}>?</button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: NAVY, color: 'white', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  {t.partager}
                </button>
              </div>

              {/* Contenu droit */}
              {!scVisible ? (
                /* Attente — Globe + Index + Cap + Trajectoires */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                  <GlobeInteractif size={260} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 16, marginBottom: 6 }}>
                    <span style={{ color: GOLD, fontWeight: 600, fontSize: 14 }}>Index —</span>
                    <span style={{ color: TXT3 }}>·</span>
                    <span style={{ color: TXT2, fontStyle: 'italic' }}>{t.waiting}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TXT2, marginBottom: 6 }}>
                    <Image src="/pictos/LighthouseSweepAmbient.tsx" alt="cap" width={16} height={16} style={{ objectFit: 'contain' }} unoptimized onError={() => {}} />
                    <span>Cap</span>
                    <span style={{ color: TXT3 }}>· 3 {lang === 'FR' ? 'trajectoires possibles' : 'possible trajectories'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                    {[
                      { c: '#1D9E75', l: lang === 'FR' ? 'Stabilisation' : 'Stabilization' },
                      { c: '#E06B4A', l: lang === 'FR' ? 'Escalade' : 'Escalation' },
                      { c: '#378ADD', l: lang === 'FR' ? 'Rupture' : 'Regime Shift' },
                    ].map(tr => (
                      <div key={tr.l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: TXT3 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: tr.c }} />{tr.l}
                      </div>
                    ))}
                  </div>
                </div>
              ) : scLoading ? (
                /* Chargement */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <GlobeInteractif size={180} />
                  <div style={{ fontSize: 12, color: TXT3, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif" }}>
                    {t.analysing}
                  </div>
                </div>
              ) : scData ? (
                /* SC générée */
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <SituationCardPanel sc={scData} lang={lang} onExpand={() => setScExpanded(true)} />
                </div>
              ) : null}
            </div>
          </div>

          {/* SOUS-BARRE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0 14px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <button onClick={() => setPanelHistory(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${BDR}` }}>
                  <Image src="/pictos/horloge.jpg" alt={t.historique} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
                </div>
                <span style={{ fontSize: 9, color: TXT3 }}>{t.historique}</span>
              </button>
              <button onClick={() => setPanelSaved(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${BDR}` }}>
                  <Image src="/pictos/Enregistrer_nobg.jpg" alt={t.saved} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
                </div>
                <span style={{ fontSize: 9, color: TXT3 }}>{t.saved}</span>
              </button>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: GOLD_L, textAlign: 'center' }}>
              {t.tagline}
            </div>
          </div>
        </main>

        {/* MODULES */}
        <section style={{ background: '#EFEDE7', padding: '24px 28px', borderTop: `1px solid ${BDR}` }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {MODULES.map(m => (
              <Link key={m.key} href={m.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 10, padding: '16px 14px', cursor: 'pointer' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 500, color: NAVY, marginBottom: 3 }}>{m.tag}</div>
                  <div style={{ fontSize: 11, color: TXT3, marginBottom: 10 }}>{m.sub[lang]}</div>
                  <div style={{ width: 20, height: 1, background: BDR_G, marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: TXT3 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: BG_P, borderTop: `1px solid ${BDR}`, padding: '12px 36px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {[
                { l: lang === 'FR' ? 'Mode Low carbone' : 'Low carbon mode', h: '#' },
                { l: lang === 'FR' ? 'À propos' : 'About', h: '/about' },
                { l: 'Contact', h: '/contact' },
                { l: lang === 'FR' ? 'Confidentialité' : 'Privacy', h: '/privacy' },
                { l: lang === 'FR' ? 'Conditions' : 'Terms', h: '/terms' },
                { l: lang === 'FR' ? 'Mentions légales' : 'Legal', h: '/legal' },
              ].map(item => (
                <Link key={item.l} href={item.h} style={{ fontSize: 11, color: TXT3, textDecoration: 'none' }}>{item.l}</Link>
              ))}
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: TXT3 }}>situationcard.com</div>
          </div>
        </footer>
      </div>
    </>
  )
}
