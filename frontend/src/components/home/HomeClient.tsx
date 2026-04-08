'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const NAVY = '#1B3A6B'
const NAVY_L = '#2a4f8a'
const GOLD = '#B89A6A'
const GOLD_L = '#CCA364'
const BG = '#F5F3EE'
const BG_P = '#FAFAF7'
const BG_PR = '#F7F5F0'
const TXT = '#1a2a3a'
const TXT2 = '#5a6a7a'
const TXT3 = '#9aabb8'
const BDR = 'rgba(26,42,58,0.1)'
const BDR_G = 'rgba(184,154,106,0.25)'

const HINTS_FR = [
  "Un conflit d'équipe autour d'une réorganisation",
  "Une décision stratégique avec plusieurs options",
  "Une crise géopolitique en développement",
  "Mon partenaire s'est éloigné, je ne sais pas quoi faire",
]
const HINTS_EN = [
  "A team conflict around a restructuring",
  "A strategic decision with multiple options",
  "A developing geopolitical crisis",
  "My partner has grown distant, I don't know what to do",
]

const MODULES = [
  { key: 'clarity', tag: 'Clarity', sub: 'Individuel', href: '/clarity' },
  { key: 'sis', tag: 'SIS', sub: 'Collectif Pro', href: '/sis' },
  { key: 'iaaa', tag: 'IAAA+', sub: 'Gouvernance', href: '/enterprise' },
  { key: 'atlas', tag: 'ATLAS', sub: 'Cartes publiques', href: '/library' },
]

// Astrolabe SVG animé
function AstrolabeAnimated({ pulse }: { pulse: boolean }) {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" style={{ display: 'block' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Anneau extérieur fixe */}
      <circle cx="120" cy="120" r="108" fill="none" stroke={BDR_G} strokeWidth="1" />
      <circle cx="120" cy="120" r="88" fill="none" stroke={BDR_G} strokeWidth="0.5" />
      {/* Graduations */}
      {Array.from({ length: 32 }).map((_, i) => {
        const a = (i * 360) / 32
        const r1 = i % 4 === 0 ? 96 : 100
        const r2 = 108
        const rad = (a * Math.PI) / 180
        return (
          <line
            key={i}
            x1={120 + r1 * Math.cos(rad)}
            y1={120 + r1 * Math.sin(rad)}
            x2={120 + r2 * Math.cos(rad)}
            y2={120 + r2 * Math.sin(rad)}
            stroke={GOLD}
            strokeWidth={i % 4 === 0 ? 1.2 : 0.6}
            opacity={0.5}
          />
        )
      })}
      {/* Anneau 1 — rotation lente */}
      <g style={{ animation: 'rot1 18s linear infinite', transformOrigin: '120px 120px' }} filter={pulse ? 'url(#glow)' : undefined}>
        <circle cx="120" cy="120" r="72" fill="none" stroke={GOLD} strokeWidth="0.8" strokeDasharray="4 8" opacity="0.6" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <circle key={i} cx={120 + 72 * Math.cos(rad)} cy={120 + 72 * Math.sin(rad)} r="2.5" fill={GOLD} opacity="0.7" />
        })}
      </g>
      {/* Anneau 2 — rotation inverse */}
      <g style={{ animation: 'rot2 28s linear infinite reverse', transformOrigin: '120px 120px' }} filter={pulse ? 'url(#glow)' : undefined}>
        <ellipse cx="120" cy="120" rx="52" ry="32" fill="none" stroke={GOLD_L} strokeWidth="0.8" opacity="0.5" transform="rotate(20 120 120)" />
        <ellipse cx="120" cy="120" rx="52" ry="32" fill="none" stroke={GOLD_L} strokeWidth="0.8" opacity="0.3" transform="rotate(70 120 120)" />
      </g>
      {/* Anneau 3 — rotation lente */}
      <g style={{ animation: 'rot3 42s linear infinite', transformOrigin: '120px 120px' }} filter={pulse ? 'url(#glow)' : undefined}>
        <ellipse cx="120" cy="120" rx="38" ry="22" fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.4" />
      </g>
      {/* Centre */}
      <circle cx="120" cy="120" r="8" fill={GOLD_L} opacity="0.9" style={{ animation: 'dotp 3s ease-in-out infinite' }} />
      <circle cx="120" cy="120" r="4" fill={GOLD} />
      <style>{`
        @keyframes rot1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot2{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot3{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes dotp{0%,100%{r:7;opacity:.8}50%{r:9;opacity:1}}
      `}</style>
    </svg>
  )
}

// Panneau latéral
function SidePanel({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 200 }}
        />
      )}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 'min(360px, 92vw)',
        background: BG_P,
        borderRight: `1px solid ${BDR}`,
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s ease',
        boxShadow: open ? '4px 0 24px rgba(26,42,58,0.12)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${BDR}` }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: NAVY, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TXT3, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>{children}</div>
      </div>
    </>
  )
}

export default function HomeClient() {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR')
  const [activeTab, setActiveTab] = useState(0)
  const [situation, setSituation] = useState('')
  const [vis, setVis] = useState<'restreint' | 'public'>('restreint')
  const [panelHistory, setPanelHistory] = useState(false)
  const [panelSaved, setPanelSaved] = useState(false)
  const hints = lang === 'FR' ? HINTS_FR : HINTS_EN
  const isTyping = situation.trim().length > 0

  const HISTORY_ITEMS = [
    { title: "Séquestration — ONG RDC", date: "19 mars", index: 85, state: "Critique" },
    { title: "Guerre Iran — Jour 19", date: "22 mars", index: 91, state: "Hors contrôle" },
    { title: "Conflit d'équipe — réorganisation", date: "30 mars", index: 54, state: "Contrôlable" },
  ]

  const SAVED_ITEMS = [
    { title: "Iran / Israël — tensions régionales", date: "23 mars", index: 72 },
    { title: "Gouvernance — vote bloqué", date: "19 mars", index: 55 },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Cinzel:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${BG}; color: ${TXT}; }
        .hover-gold:hover { border-color: ${GOLD} !important; background: white !important; }
        .tab-btn { border-bottom: 2px solid transparent; }
        .tab-btn.active { color: ${TXT2}; border-bottom-color: rgba(184,154,106,.5); }
        .tab-btn:not(.active):hover { color: ${NAVY}; }
        .hint-item:hover { color: ${NAVY} !important; opacity: 1 !important; }
        .tog:not(.on):hover { border-color: #8a9aaa !important; color: #4a5a6a !important; }
        .mod-card:hover { border-color: ${GOLD} !important; transform: translateY(-1px); }
        @keyframes rot1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot2{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot3{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes dotp{0%,100%{opacity:.8}50%{opacity:1}}
        @keyframes compassOsc{0%,100%{transform:rotate(0deg)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)}}
      `}</style>

      {/* Panneau Historique */}
      <SidePanel open={panelHistory} title={lang === 'FR' ? 'Historique' : 'History'} onClose={() => setPanelHistory(false)}>
        {HISTORY_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BDR}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: TXT, fontStyle: 'italic', marginBottom: 3 }}>{item.title}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: TXT3 }}>{item.date}</span>
              <span style={{ fontSize: 10, color: GOLD, fontWeight: 500 }}>Index {item.index}</span>
              <span style={{ fontSize: 10, color: TXT2 }}>— {item.state}</span>
            </div>
          </div>
        ))}
      </SidePanel>

      {/* Panneau Enregistrées */}
      <SidePanel open={panelSaved} title={lang === 'FR' ? 'Enregistrées' : 'Saved'} onClose={() => setPanelSaved(false)}>
        {SAVED_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BDR}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: TXT, fontStyle: 'italic', marginBottom: 3 }}>{item.title}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: TXT3 }}>{item.date}</span>
              <span style={{ fontSize: 10, color: GOLD, fontWeight: 500 }}>Index {item.index}</span>
            </div>
          </div>
        ))}
      </SidePanel>

      <div style={{ minHeight: '100vh', background: BG }}>

        {/* HEADER */}
        <header style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', padding: '18px 40px',
          background: BG, borderBottom: `1px solid ${BDR}`,
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${BDR_G}` }}>
              <Image src="/pictos/LOOGO_IAAA_.jpg" alt="IAAA+" width={46} height={46} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: NAVY, fontFamily: "'Cinzel', serif", letterSpacing: '0.02em' }}>
                Situation Card
              </div>
              <div style={{ fontSize: 10, color: TXT3, letterSpacing: '.04em' }}>powered by IAAA+</div>
            </div>
          </div>

          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: GOLD, textAlign: 'center', lineHeight: 1.3 }}>
            {lang === 'FR' ? 'Comprendre les situations complexes — par une carte.' : 'Understanding complex situations — through a card.'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 22 }}>
            <Link href="/pricing" style={{ fontSize: 12.5, color: TXT2, textDecoration: 'none', opacity: 0.7 }}>
              {lang === 'FR' ? 'Offres' : 'Plans'}
            </Link>
            <Link href="/login" style={{ fontSize: 12.5, color: TXT2, textDecoration: 'none', opacity: 0.7 }}>
              {lang === 'FR' ? 'Connexion' : 'Sign in'}
            </Link>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', paddingLeft: 14, borderLeft: `1px solid ${BDR}` }}>
              {(['FR', 'EN'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
                  color: lang === l ? NAVY : TXT2, transition: 'color .2s'
                }}>{l}</button>
              ))}
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, minHeight: 480 }}>

            {/* BLOC GAUCHE */}
            <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${BDR}`, padding: '0 18px', gap: 2 }}>
                {[lang === 'FR' ? 'Texte' : 'Text', lang === 'FR' ? 'Documents' : 'Documents', 'Images'].map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(i)}
                    className={`tab-btn${activeTab === i ? ' active' : ''}`}
                    style={{
                      padding: '11px 10px 10px', fontSize: 12, color: activeTab === i ? TXT2 : TXT3,
                      cursor: 'pointer', border: 'none', background: 'none',
                      fontFamily: "'DM Sans', sans-serif", transition: 'color .2s'
                    }}
                  >{t}</button>
                ))}
              </div>

              {/* Textarea */}
              <div style={{ flex: 1, position: 'relative', padding: 18 }}>
                <textarea
                  value={situation}
                  onChange={e => setSituation(e.target.value)}
                  placeholder=""
                  style={{
                    width: '100%', height: '100%', minHeight: 285, border: 'none',
                    background: 'transparent', resize: 'none',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                    color: TXT, outline: 'none', lineHeight: 1.7, position: 'relative', zIndex: 2
                  }}
                />
                {!situation && (
                  <div style={{ position: 'absolute', top: 18, left: 18, right: 18, pointerEvents: 'none', zIndex: 1 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', color: '#8fa0b0', display: 'block', marginBottom: 16, letterSpacing: '.02em', lineHeight: 1.3 }}>
                      {lang === 'FR' ? 'Que se passe-t-il vraiment ?' : 'What is really happening?'}
                    </span>
                    <span style={{ fontSize: 14, color: TXT3, display: 'block', marginBottom: 12 }}>
                      {lang === 'FR' ? 'Décrivez votre situation en texte libre.' : 'Describe your situation in free text.'}
                    </span>
                    {hints.map((h, i) => (
                      <span
                        key={i}
                        className="hint-item"
                        style={{
                          display: 'block', fontSize: 13, color: TXT3,
                          opacity: i === 3 ? 0.38 : 0.6,
                          marginBottom: 7, letterSpacing: '.01em',
                          fontStyle: i === 3 ? 'italic' : 'normal',
                          pointerEvents: 'auto', cursor: 'pointer', transition: 'color .2s, opacity .2s'
                        }}
                        onClick={() => setSituation(h)}
                      >
                        {lang === 'FR' ? 'e.g. — ' : 'e.g. — '}{h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Barre bas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 14px', borderTop: `1px solid ${BDR}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {/* Expand */}
                  <button style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TXT2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                  </button>
                  {/* Boussole / Logo */}
                  <button style={{
                    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    padding: 0, overflow: 'hidden', background: 'none',
                    boxShadow: isTyping ? `0 0 0 3px rgba(184,154,106,.35)` : 'none',
                    transition: 'box-shadow .3s',
                    animation: isTyping ? 'compassOsc 4s ease-in-out infinite' : 'none'
                  }}>
                    <Image src="/pictos/LOOGO_IAAA_.jpg" alt="analyser" width={40} height={40} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  {/* Mic */}
                  <button style={{ width: 32, height: 32, border: `1px solid ${BDR}`, background: BG_P, cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TXT2, transition: 'border-color .2s, color .2s' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 01-14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  </button>
                  {/* Send */}
                  <Link href="/generate">
                    <button style={{ width: 32, height: 32, border: 'none', background: '#2d4f7a', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.85)', transition: 'background .2s' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* BLOC DROIT */}
            <div style={{ background: BG_PR, border: `1px solid ${BDR_G}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderBottom: `1px solid ${BDR_G}` }}>
                {[
                  { label: lang === 'FR' ? 'Restreint' : 'Private', val: 'restreint' as const },
                  { label: lang === 'FR' ? 'Public' : 'Public', val: 'public' as const },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    onClick={() => setVis(val)}
                    className="tog"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                      border: `1px solid ${vis === val ? '#dde3e8' : '#eaeef1'}`,
                      color: vis === val ? '#b0bcc8' : '#c8d4dc',
                      background: 'transparent', fontFamily: "'DM Sans', sans-serif", transition: 'all .2s'
                    }}
                  >{label}</button>
                ))}
                <button style={{ width: 25, height: 25, borderRadius: '50%', border: `1px solid ${BDR}`, background: 'none', cursor: 'pointer', fontSize: 11, color: TXT3, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 'auto' }}>?</button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, background: NAVY, color: 'white', border: 'none', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  {lang === 'FR' ? 'Partager' : 'Share'}
                </button>
              </div>

              {/* Astrolabe */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <AstrolabeAnimated pulse={isTyping} />
              </div>

              {/* Feedback */}
              <div style={{ padding: '0 16px 14px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12, marginBottom: 5 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={GOLD} strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span style={{ color: GOLD, fontWeight: 500 }}>Index 54</span>
                  <span style={{ color: TXT2 }}>· {lang === 'FR' ? 'Contrôlable' : 'Manageable'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: TXT2, marginTop: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={GOLD} strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="15" r="1" fill={GOLD}/></svg>
                  Cap
                  <span style={{ color: TXT3 }}>· 3 {lang === 'FR' ? 'trajectoires' : 'trajectories'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SOUS-BARRE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0 16px' }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 2 }}>
              <button
                onClick={() => setPanelHistory(true)}
                className="hover-gold"
                style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${BDR}`, background: BG_P, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0, transition: 'border-color .2s, background .2s', overflow: 'hidden', position: 'relative' }}
              >
                <Image src="/pictos/horloge.jpg" alt={lang === 'FR' ? 'Historique' : 'History'} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }} />
              </button>
              <button
                onClick={() => setPanelSaved(true)}
                className="hover-gold"
                style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${BDR}`, background: BG_P, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0, transition: 'border-color .2s, background .2s', overflow: 'hidden' }}
              >
                <Image src="/pictos/Enregistrer_nobg.jpg" alt={lang === 'FR' ? 'Enregistrées' : 'Saved'} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: TXT3 }}>
              <span>{lang === 'FR' ? 'Historique' : 'History'}</span>
              <span>{lang === 'FR' ? 'Enregistrées' : 'Saved'}</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: '#4a6080', textAlign: 'center', letterSpacing: '.06em', marginTop: 4 }}>
              {lang === 'FR' ? 'Voir la structure pour pouvoir décider' : 'See the structure to decide'}
            </div>
          </div>
        </main>

        {/* MODULES */}
        <section style={{ background: '#EFEDE7', padding: '28px 32px', borderTop: `1px solid ${BDR}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {MODULES.map(m => (
              <Link key={m.key} href={m.href} style={{ textDecoration: 'none' }}>
                <div
                  className="mod-card"
                  style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 12, padding: '18px 16px', cursor: 'pointer', transition: 'border-color .2s, transform .2s', position: 'relative', overflow: 'hidden' }}
                >
                  {m.key === 'atlas' && (
                    <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.06 }}>
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="0.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                    </div>
                  )}
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 500, color: NAVY, marginBottom: 4 }}>{m.tag}</div>
                  <div style={{ fontSize: 11, color: TXT3, marginBottom: 10 }}>{lang === 'FR' ? m.sub : m.sub}</div>
                  <div style={{ width: 24, height: 1, background: BDR_G, marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: TXT2 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: BG_P, borderTop: `1px solid ${BDR}`, padding: '14px 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { l: lang === 'FR' ? 'Mode Low carbone' : 'Low carbon mode', h: '#' },
                { l: lang === 'FR' ? 'À propos' : 'About', h: '/about' },
                { l: 'Contact', h: '/contact' },
                { l: lang === 'FR' ? 'Confidentialité' : 'Privacy', h: '/privacy' },
                { l: lang === 'FR' ? 'Conditions' : 'Terms', h: '/terms' },
                { l: lang === 'FR' ? 'Mentions légales' : 'Legal', h: '/legal' },
              ].map(item => (
                <Link key={item.l} href={item.h} style={{ fontSize: 11, color: TXT3, textDecoration: 'none', transition: 'color .2s' }}>
                  {item.l}
                </Link>
              ))}
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: TXT3, letterSpacing: '.05em' }}>
              situationcard.com
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
