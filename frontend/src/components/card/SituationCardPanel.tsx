'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AstrolabeRadial from '@/components/card/AstrolabeRadial'
import ForceLines from '@/components/card/ForceLines'
import { NAVY, GOLD, GOLD_L, BG_P, TXT, TXT2, TXT3, BDR, BDR_G, TX, TRAJECTORY_COLORS } from '@/lib/constants'
import type { Lang } from '@/lib/constants'

// ── Helpers ───────────────────────────────────────────────────────────────────
// Lecture d'un champ SC — supporte ancien format (insight) et nouveau (insight_fr)
function useField(sc: Record<string, any>, lang: Lang) {
  return (fr: string, en: string): string => {
    const frVal = sc[fr] ?? sc[fr.replace('_fr', '')] ?? ''
    const enVal = sc[en] ?? sc[en.replace('_en', '')] ?? frVal
    return lang === 'FR' ? frVal : enVal
  }
}

function Picto({ src, size = 14 }: { src: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <Image src={src} alt="" width={size} height={size}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }} unoptimized />
    </div>
  )
}

function SectionLabel({ label, color = GOLD, picto }: { label: string; color?: string; picto?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {picto && <Picto src={picto} />}
      <div style={{ fontSize: 8, color, letterSpacing: '.1em', fontFamily: "'Cinzel',serif" }}>
        {label}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function SituationCardPanel({ sc, lang, onExpand }: {
  sc: Record<string, any>
  lang: Lang
  onExpand: () => void
}) {
  const [tab, setTab] = useState<'situation' | 'cap' | 'analyse'>('situation')
  const t = TX[lang]
  const g = useField(sc, lang)

  // Champs principaux — supporte ancien et nouveau format
  const title         = g('title_fr',            'title_en')
  const submitted     = g('submitted_situation_fr', 'submitted_situation_en')
  const insight       = g('insight_fr',           'insight_en')
  const vulnerability = g('main_vulnerability_fr', 'main_vulnerability_en')
  const asymmetry     = g('asymmetry_fr',          'asymmetry_en')
  const signal        = g('key_signal_fr',          'key_signal_en')
  const stateLabel    = g('state_label',            'state_label_en')
  const avertissement = g('avertissement_fr',       'avertissement_en')

  // Cap — supporte cap_summary (ancien) et cap (nouveau)
  const capObj    = sc.cap_summary ?? sc.cap ?? {}
  const hook      = lang === 'FR' ? (capObj.hook_fr ?? capObj.hook ?? '') : (capObj.hook_en ?? capObj.hook ?? '')
  const capInsight = lang === 'FR' ? (capObj.insight_fr ?? capObj.insight ?? '') : (capObj.insight_en ?? capObj.insight ?? '')
  const watch     = lang === 'FR' ? (capObj.watch_fr ?? capObj.watch ?? '') : (capObj.watch_en ?? capObj.watch ?? '')

  // Mouvements — supporte ancien (mouvements_recommandes) et nouveau (movements_fr)
  const mouvements = lang === 'FR'
    ? (sc.movements_fr ?? sc.analysis?.mouvements_recommandes ?? [])
    : (sc.movements_en ?? sc.analysis?.mouvements_recommandes_en ?? sc.movements_fr ?? sc.analysis?.mouvements_recommandes ?? [])

  // Trajectoires — supporte ancien et nouveau format
  const trajectories: any[] = sc.trajectories ?? []

  // Radar — supporte ancien (radar_scores[]) et nouveau (radar{})
  const radarScores: any[] = sc.radar_scores ?? (sc.radar ? [
    { dimension: 'Impact',       dimension_en: 'Impact',       score: Math.round(sc.radar.impact / 33), note: '' },
    { dimension: 'Urgence',      dimension_en: 'Urgency',      score: Math.round(sc.radar.urgency / 33), note: '' },
    { dimension: 'Incertitudes', dimension_en: 'Uncertainties', score: Math.round(sc.radar.uncertainty / 33), note: '' },
    { dimension: 'Réversibilité', dimension_en: 'Reversibility', score: Math.round((100 - sc.radar.reversibility) / 33), note: '' },
  ] : [])

  const TABS = [
    { key: 'situation' as const, label: t.tab_situation },
    { key: 'cap'       as const, label: t.tab_cap },
    { key: 'analyse'   as const, label: t.tab_analyse },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px 8px',
        background: `linear-gradient(to right, ${NAVY}, #2A4A80)`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(200,168,64,0.4)' }}>
            <Image src="/pictos/LOOGO-IAAA.jpg" alt="IAAA+" width={26} height={26}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: '.12em', fontFamily: "'Cinzel',serif", marginBottom: 2 }}>
            POWERED BY IAAA+ · SITUATION CARD
          </div>
          <div style={{ fontSize: 13, color: '#fff', fontStyle: 'italic', fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.3 }}>
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(200,168,64,0.5)',
            borderRadius: 20, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#E8D080', fontFamily: "'Cinzel',serif" }}>
              {sc.state_index_final}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(232,208,128,0.7)' }}>/ 100 · {stateLabel}</span>
          </div>
          <button onClick={onExpand} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4, padding: '4px 6px', cursor: 'pointer',
            color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BDR_G}`, background: BG_P }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            flex: 1, padding: '8px 4px', fontSize: 11,
            color: tab === tb.key ? NAVY : TXT3, background: 'none', border: 'none',
            borderBottom: tab === tb.key ? `2px solid ${GOLD}` : '2px solid transparent',
            fontFamily: "'Cinzel',serif", letterSpacing: '.06em', cursor: 'pointer',
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {/* SITUATION */}
        {tab === 'situation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Situation soumise */}
            {submitted && (
              <div style={{ background: 'rgba(26,42,107,0.04)', border: `1px solid ${BDR}`, borderRadius: 6, padding: '7px 10px' }}>
                <SectionLabel label={lang === 'FR' ? 'SITUATION SOUMISE' : 'SUBMITTED SITUATION'} color={TXT3} />
                <div style={{ fontSize: 11, color: TXT2, fontStyle: 'italic', fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.6 }}>
                  {submitted}
                </div>
              </div>
            )}

            {/* Astrolabe + Force Lines */}
            {sc.astrolabe_scores?.length > 0 && (
              <div>
                <SectionLabel label="ASTROLABE" />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <AstrolabeRadial scores={sc.astrolabe_scores} />
                </div>
                <SectionLabel label="FORCE LINES" />
                <ForceLines scores={sc.astrolabe_scores} lang={lang} />
              </div>
            )}

            {/* Séparateur */}
            <div style={{ height: 1, background: BDR_G, margin: '4px 0' }} />

            {/* Lecture */}
            <div style={{ background: 'rgba(184,154,106,0.08)', border: `1px solid ${BDR_G}`, borderRadius: 6, padding: '8px 10px' }}>
              <SectionLabel label={lang === 'FR' ? 'LECTURE' : 'READING'} />
              <div style={{ fontSize: 12, color: TXT, fontStyle: 'italic', fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.6 }}>
                {insight}
              </div>
            </div>

            {/* Vulnérabilité */}
            <div style={{ background: 'rgba(224,107,74,0.06)', border: '1px solid rgba(224,107,74,0.22)', borderRadius: 6, padding: '6px 10px' }}>
              <SectionLabel label={lang === 'FR' ? 'VULNÉRABILITÉ PRINCIPALE' : 'MAIN VULNERABILITY'} color="#E06B4A" />
              <div style={{ fontSize: 11, color: TXT, fontWeight: 500, lineHeight: 1.5 }}>{vulnerability}</div>
            </div>

            {/* Asymétrie */}
            {asymmetry && (
              <div style={{ background: 'rgba(55,138,221,0.05)', border: '1px solid rgba(55,138,221,0.18)', borderRadius: 6, padding: '6px 10px' }}>
                <SectionLabel label={lang === 'FR' ? 'ASYMÉTRIE' : 'ASYMMETRY'} color="#378ADD" />
                <div style={{ fontSize: 11, color: TXT, fontStyle: 'italic', lineHeight: 1.5 }}>{asymmetry}</div>
              </div>
            )}
          </div>
        )}

        {/* CAP */}
        {tab === 'cap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Anchor */}
            {hook && (
              <div style={{ background: `linear-gradient(135deg,${NAVY}08,${GOLD}08)`, border: `1px solid ${BDR_G}`, borderRadius: 6, padding: '8px 10px' }}>
                <SectionLabel label="ANCHOR" picto="/pictos/cap.png" />
                <div style={{ fontSize: 14, color: TXT, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.5, fontWeight: 500 }}>
                  {hook}
                </div>
                {capInsight && <div style={{ fontSize: 11, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>{capInsight}</div>}
              </div>
            )}

            {/* Watch */}
            {watch && (
              <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 6, padding: '6px 10px' }}>
                <SectionLabel label="WATCH" color="#A16207" picto="/pictos/jumelle.jpg" />
                <div style={{ fontSize: 11, color: TXT, fontStyle: 'italic', lineHeight: 1.5 }}>{watch}</div>
              </div>
            )}

            {/* Trajectoires */}
            {trajectories.length > 0 && (
              <div>
                <SectionLabel label={lang === 'FR' ? 'TRAJECTOIRES' : 'TRAJECTORIES'} picto="/pictos/boussole.png" />
                {trajectories.map((tr: any, i: number) => {
                  const trType  = tr.type ?? ''
                  const color   = tr.color ?? TRAJECTORY_COLORS[trType] ?? '#9AABB8'
                  const lbl     = lang === 'FR' ? (tr.type_fr ?? tr.type ?? trType) : (tr.type_en ?? trType)
                  const ttl     = lang === 'FR' ? (tr.title_fr ?? tr.title ?? '') : (tr.title_en ?? tr.title ?? '')
                  const desc    = lang === 'FR' ? (tr.description_fr ?? tr.description ?? '') : (tr.description_en ?? tr.description ?? '')
                  const sig     = lang === 'FR' ? (tr.signal_fr ?? tr.signal_precurseur ?? '') : (tr.signal_en ?? tr.signal_precurseur_en ?? tr.signal_precurseur ?? '')
                  return (
                    <div key={i} style={{ borderLeft: `3px solid ${color}`, background: `${color}08`, border: `1px solid ${color}30`, borderRadius: 5, padding: '6px 10px', marginBottom: 7 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 2 }}>{lbl}{ttl ? ` — ${ttl}` : ''}</div>
                      <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.5, marginBottom: 3 }}>{desc}</div>
                      {sig && <div style={{ fontSize: 9, color: TXT3 }}>→ {sig}</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Key Signal */}
            {signal && (
              <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 6, padding: '7px 10px' }}>
                <SectionLabel label="KEY SIGNAL" color="#A16207" />
                <div style={{ fontSize: 11, color: TXT, lineHeight: 1.5 }}>{signal}</div>
              </div>
            )}
          </div>
        )}

        {/* ANALYSE */}
        {tab === 'analyse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Decision Radar */}
            {radarScores.length > 0 && (
              <div>
                <SectionLabel label="DECISION RADAR" picto="/pictos/radar.png" />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: TXT, fontFamily: "'Cinzel',serif", lineHeight: 1 }}>
                    {sc.state_index_final}
                  </span>
                  <span style={{ fontSize: 12, color: TXT3 }}>/ 100 · {stateLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {radarScores.map((r: any, i: number) => {
                    const axis = String(r.axis ?? r.dimension_en ?? r.dimension ?? '').toLowerCase()
                    const dim = axis === 'uncertainty' || axis === 'blind spots' || axis === 'angles morts'
                      ? (lang === 'FR' ? 'Incertitudes' : 'Uncertainties')
                      : (lang === 'FR' ? r.dimension : (r.dimension_en ?? r.dimension))
                    return (
                      <div key={i} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: `1px solid ${BDR}`, background: BG_P, color: TXT2 }}>
                        · {dim} {r.score === 3 ? '↑' : r.score === 1 ? '↓' : '→'}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Avertissement */}
            {avertissement && (
              <div style={{ fontSize: 11, color: TXT3, fontStyle: 'italic', lineHeight: 1.6, borderLeft: `2px solid ${GOLD}`, paddingLeft: 10 }}>
                ↓ {avertissement}
              </div>
            )}

            {/* Mouvements */}
            {mouvements.length > 0 && (
              <div>
                <SectionLabel label={lang === 'FR' ? 'MOUVEMENTS' : 'RECOMMENDED ACTIONS'} />
                {mouvements.map((m: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: NAVY, color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Cinzel',serif" }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.5, paddingTop: 2 }}>{m}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Synthèse */}
            {(sc.analysis?.synthese || sc.synthese_fr) && (
              <div style={{ background: 'rgba(184,154,106,0.08)', border: `1px solid ${BDR_G}`, borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 12, color: TXT, fontStyle: 'italic', fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.6 }}>
                  {lang === 'FR'
                    ? (sc.synthese_fr ?? sc.analysis?.synthese ?? '')
                    : (sc.synthese_en ?? sc.analysis?.synthese_en ?? sc.synthese_fr ?? sc.analysis?.synthese ?? '')}
                </div>
              </div>
            )}

            {/* Tracabilité */}
            <div style={{ borderTop: `1px solid ${BDR_G}`, paddingTop: 10, marginTop: 4 }}>
              <SectionLabel label={lang === 'FR' ? 'TRACABILITÉ' : 'TRACEABILITY'} picto="/pictos/Tracabilité.png" />
              <div style={{ fontSize: 10, color: TXT3, lineHeight: 1.7 }}>
                <div>{TX[lang].generated_by} · {TX[lang].on_lbl} {new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>Version 1.0 · {lang === 'FR' ? 'Lecture structurelle' : 'Structural reading'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Boutons bas ── */}
      <div style={{ borderTop: `1px solid ${BDR}`, padding: '8px 14px', display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: NAVY, color: '#fff', border: 'none', borderRadius: 7,
          padding: '7px 8px', fontSize: 11, fontFamily: "'Cinzel',serif",
          letterSpacing: '.06em', cursor: 'pointer',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {TX[lang].partager}
        </button>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: 'transparent', color: TXT2, border: `1px solid ${BDR}`,
          borderRadius: 7, padding: '7px 8px', fontSize: 11,
          fontFamily: "'Cinzel',serif", letterSpacing: '.04em', cursor: 'pointer',
        }}>
          <Picto src="/pictos/carte.jpg" />
          {TX[lang].lectures}
        </button>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: 'transparent', color: TXT2, border: `1px solid ${BDR}`,
          borderRadius: 7, padding: '7px 8px', fontSize: 11,
          fontFamily: "'Cinzel',serif", letterSpacing: '.04em', cursor: 'pointer',
        }}>
          <Picto src="/pictos/Tracabilité.png" />
          {TX[lang].collaboration}
        </button>
      </div>
    </div>
  )
}
