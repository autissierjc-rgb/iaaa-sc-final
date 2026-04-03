'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const NAVY = '#1B3A6B'
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
  "Mon partenaire s'est éloigné, je ne sais pas comment aborder le sujet",
]
const HINTS_EN = [
  "A team conflict around a restructuring",
  "A strategic decision with multiple options",
  "A developing geopolitical crisis",
  "My partner has grown distant, I don't know how to approach it",
]

const DEMO_SC = {
  title: "Chef de projet ONG — Nord-Kivu",
  subtitle: "Dysfonctionnement de rôle protégé",
  state: "Contrôlable",
  index: 54,
  insight: "Ce n'est pas un problème de compétence — c'est un problème de rôle mal distribué protégé par une loyauté institutionnelle.",
  vulnerability: "Adjoint non reconnu · son départ = effondrement opérationnel immédiat",
  cap: "Le projet ne tient pas grâce au chef de projet — il tient malgré lui.",
  watch: "Surveiller le moral de l'adjoint — pas les performances du chef de projet.",
  astrolabe: [
    { branch: "I", name: "Acteurs", score: 2 },
    { branch: "II", name: "Intérêts", score: 3 },
    { branch: "III", name: "Forces", score: 2 },
    { branch: "IV", name: "Tensions", score: 2 },
    { branch: "V", name: "Contraintes", score: 3 },
    { branch: "VI", name: "Incertitude", score: 2 },
    { branch: "VII", name: "Temps", score: 1 },
    { branch: "VIII", name: "Espace", score: 1 },
  ],
  trajectories: [
    { type: "Stabilisation", color: "#1D9E75", title: "Binôme formalisé", desc: "Création officielle d'un poste adjoint avec délégation explicite." },
    { type: "Escalation", color: "#E06B4A", title: "Départ de l'adjoint", desc: "Le projet perd simultanément planification, budget et reporting." },
    { type: "Solution tiers", color: "#378ADD", title: "Promotion adjoint", desc: "Chef repositionné consultant interne. Solution validée terrain." },
  ],
}

const MODULES = [
  { key: 'clarity', tag: 'Clarity', sub: 'Individuel', href: '/clarity' },
  { key: 'sis', tag: 'SIS', sub: 'Collectif Pro', href: '/sis' },
  { key: 'iaaa', tag: 'IAAA+', sub: 'Gouvernance', href: '/enterprise' },
  { key: 'atlas', tag: 'ATLAS', sub: 'Cartes publiques', href: '/library' },
]

function AstrolabeRight({ pulse }: { pulse: boolean }) {
  return (
    <div style={{ width: 220, height: 220, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="220" height="220" viewBox="0 0 220 220">
        <defs>
          <filter id="glow2">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="110" cy="110" r="100" fill="none" stroke={BDR_G} strokeWidth="1"/>
        <circle cx="110" cy="110" r="80" fill="none" stroke={BDR_G} strokeWidth="0.5"/>
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i * 360) / 32
          const r1 = i % 4 === 0 ? 88 : 93
          const rad = (a * Math.PI) / 180
          return (
            <line key={i}
              x1={110 + r1 * Math.cos(rad)} y1={110 + r1 * Math.sin(rad)}
              x2={110 + 100 * Math.cos(rad)} y2={110 + 100 * Math.sin(rad)}
              stroke={GOLD} strokeWidth={i % 4 === 0 ? 1 : 0.5} opacity={0.4}
            />
          )
        })}
        <g style={{ animation: 'rot1 18s linear infinite', transformOrigin: '110px 110px' }} filter={pulse ? 'url(#glow2)' : undefined}>
          <circle cx="110" cy="110" r="65" fill="none" stroke={GOLD} strokeWidth="0.8" strokeDasharray="4 8" opacity="0.5"/>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            return <circle key={i} cx={110 + 65 * Math.cos(rad)} cy={110 + 65 * Math.sin(rad)} r="2.2" fill={GOLD} opacity="0.7"/>
          })}
        </g>
        <g style={{ animation: 'rot2 28s linear infinite reverse', transformOrigin: '110px 110px' }} filter={pulse ? 'url(#glow2)' : undefined}>
          <ellipse cx="110" cy="110" rx="46" ry="28" fill="none" stroke={GOLD_L} strokeWidth="0.8" opacity="0.4" transform="rotate(20 110 110)"/>
          <ellipse cx="110" cy="110" rx="46" ry="28" fill="none" stroke={GOLD_L} strokeWidth="0.8" opacity="0.25" transform="rotate(70 110 110)"/>
        </g>
        <g style={{ animation: 'rot3 42s linear infinite', transformOrigin: '110px 110px' }}>
          <ellipse cx="110" cy="110" rx="32" ry="18" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.35"/>
        </g>
        <circle cx="110" cy="110" r="8" fill={GOLD_L} opacity="0.9"/>
        <circle cx="110" cy="110" r="4" fill={GOLD}/>
      </svg>
      <style>{`
        @keyframes rot1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot2{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot3{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const colors = ['#E0DCD4', '#B8D4F0', '#F0CA70', '#E87C7C']
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ width: 14, height: 6, borderRadius: 2, background: score >= i ? colors[i] : '#E0DCD4', transition: 'background .3s' }}/>
      ))}
    </div>
  )
}

function SituationCardPanel({ onExpand }: { onExpand: () => void }) {
  const sc = DEMO_SC
  const [chat, setChat] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header SC */}
      <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid ${BDR_G}`, background: `linear-gradient(to right, ${NAVY}, #2A4A80)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', fontFamily: "'Cinzel', serif", marginBottom: 2 }}>SITUATION CARD</div>
          <div style={{ fontSize: 13, color: '#fff', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.3 }}>{sc.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid rgba(200,168,64,0.5)`, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8D080', fontFamily: "'Cinzel', serif" }}>{sc.index}</span>
            <span style={{ fontSize: 10, color: 'rgba(232,208,128,0.7)' }}>· {sc.state}</span>
          </div>
          <button onClick={onExpand} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center' }} title="Agrandir">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
        </div>
      </div>

      {/* Corps SC scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {/* Insight */}
        <div style={{ background: 'rgba(184,154,106,0.08)', border: `1px solid ${BDR_G}`, borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>LECTURE</div>
          <div style={{ fontSize: 12, color: TXT, fontStyle: 'italic', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif" }}>{sc.insight}</div>
        </div>

        {/* Astrolabe mini */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>ASTROLABE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
            {sc.astrolabe.map(a => (
              <div key={a.branch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: TXT3, fontStyle: 'italic', minWidth: 28 }}>{a.branch}</span>
                <span style={{ fontSize: 9, color: TXT2, minWidth: 60 }}>{a.name}</span>
                <ScoreBar score={a.score}/>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnérabilité */}
        <div style={{ background: 'rgba(224,107,74,0.06)', border: '1px solid rgba(224,107,74,0.2)', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: '#E06B4A', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 3 }}>VULNÉRABILITÉ</div>
          <div style={{ fontSize: 11, color: TXT, fontWeight: 500 }}>{sc.vulnerability}</div>
        </div>

        {/* Cap */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>CAP</div>
          <div style={{ fontSize: 12, color: TXT, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>{sc.cap}</div>
        </div>

        {/* Trajectoires */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>TRAJECTOIRES</div>
          {sc.trajectories.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0, marginTop: 3 }}/>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, color: TXT, marginBottom: 1 }}>{t.type} — {t.title}</div>
                <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Signal */}
        <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 6, padding: '6px 10px' }}>
          <div style={{ fontSize: 9, color: '#A16207', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif", marginBottom: 3 }}>SIGNAL</div>
          <div style={{ fontSize: 11, color: TXT, lineHeight: 1.5 }}>{sc.watch}</div>
        </div>
      </div>

      {/* Boîte dialogue LLM */}
      <div style={{ borderTop: `1px solid ${BDR}`, padding: '8px 10px', display: 'flex', gap: 6 }}>
        <input
          value={chat}
          onChange={e => setChat(e.target.value)}
          placeholder="Affiner cette carte..."
          style={{ flex: 1, border: `1px solid ${BDR}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, fontFamily: "'DM Sans', sans-serif", background: BG, color: TXT, outline: 'none' }}
        />
        <button style={{ background: NAVY, border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#fff', fontSize: 11 }}>→</button>
      </div>
    </div>
  )
}

function SidePanel({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 200 }}/>}
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

export default function HomeClient() {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR')
  const [activeTab, setActiveTab] = useState(0)
  const [situation, setSituation] = useState('')
  const [scVisible, setScVisible] = useState(false)
  const [scExpanded, setScExpanded] = useState(false)
  const [panelHistory, setPanelHistory] = useState(false)
  const [panelSaved, setPanelSaved] = useState(false)
  const isTyping = situation.trim().length > 0
  const hints = lang === 'FR' ? HINTS_FR : HINTS_EN

  const HISTORY_ITEMS = [
    { title: "Séquestration — ONG RDC", date: "19 mars", index: 85, state: "Critique" },
    { title: "Guerre Iran — Jour 19", date: "22 mars", index: 91, state: "Hors contrôle" },
    { title: "Conflit d'équipe", date: "30 mars", index: 54, state: "Contrôlable" },
  ]
  const SAVED_ITEMS = [
    { title: "Iran / Israël — tensions régionales", date: "23 mars", index: 72 },
    { title: "Gouvernance — vote bloqué", date: "19 mars", index: 55 },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Cinzel:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:${BG};color:${TXT}}
        .tab-btn{border-bottom:2px solid transparent;transition:color .2s,border-color .2s}
        .tab-btn.active{color:${TXT2};border-bottom-color:rgba(184,154,106,.5)}
        .tab-btn:not(.active):hover{color:${NAVY}}
        .hint-item:hover{color:${NAVY}!important;opacity:1!important}
        .mod-card{transition:border-color .2s,transform .2s}
        .mod-card:hover{border-color:${GOLD}!important;transform:translateY(-1px)}
        .ic-btn{transition:background .2s,color .2s}
        .ic-btn:hover{background:rgba(26,58,107,.07)!important}
        @keyframes rot1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot2{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rot3{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes compassPulse{0%,100%{filter:drop-shadow(0 0 0px rgba(184,154,106,0))}50%{filter:drop-shadow(0 0 6px rgba(184,154,106,.6))}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${BDR_G};border-radius:2px}
      `}</style>

      <SidePanel open={panelHistory} title={lang === 'FR' ? 'Historique' : 'History'} onClose={() => setPanelHistory(false)}>
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

      <SidePanel open={panelSaved} title={lang === 'FR' ? 'Enregistrées' : 'Saved'} onClose={() => setPanelSaved(false)}>
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
      {scExpanded && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: BG_P, borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${BDR_G}` }}>
            <SituationCardPanel onExpand={() => setScExpanded(false)}/>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: BG }}>

        {/* HEADER */}
        <header style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '16px 36px', background: BG, borderBottom: `1px solid ${BDR}`, position: 'sticky', top: 0, zIndex: 100 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${BDR_G}` }}>
              <Image src="/pictos/LOOGO IAAA+.jpg" alt="IAAA+" width={46} height={46} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: NAVY, fontFamily: "'Cinzel', serif", letterSpacing: '0.02em' }}>Situation Card</div>
              <div style={{ fontSize: 10, color: TXT3, letterSpacing: '.04em' }}>powered by IAAA+</div>
            </div>
          </Link>

          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: GOLD, textAlign: 'center', lineHeight: 1.25, fontStyle: 'italic' }}>
            {lang === 'FR' ? <>Comprendre les situations complexes<br/>par une carte.</> : <>Understanding complex situations<br/>through a card.</>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
            <Link href="/pricing" style={{ fontSize: 12.5, color: TXT2, textDecoration: 'none' }}>{lang === 'FR' ? 'Offres' : 'Plans'}</Link>
            <Link href="/login" style={{ fontSize: 12.5, color: TXT2, textDecoration: 'none' }}>{lang === 'FR' ? 'Connexion' : 'Sign in'}</Link>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 12, borderLeft: `1px solid ${BDR}` }}>
              {(['FR', 'EN'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', color: lang === l ? NAVY : TXT2 }}>{l}</button>
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
                {[lang === 'FR' ? 'Texte' : 'Text', 'Documents', 'Images'].map((t, i) => (
                  <button key={t} onClick={() => setActiveTab(i)} className={`tab-btn${activeTab === i ? ' active' : ''}`}
                    style={{ padding: '10px 9px', fontSize: 12, color: activeTab === i ? TXT2 : TXT3, cursor: 'pointer', border: 'none', background: 'none', fontFamily: "'DM Sans',sans-serif" }}>
                    {t}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, position: 'relative', padding: 16 }}>
                <textarea
                  value={situation}
                  onChange={e => setSituation(e.target.value)}
                  style={{ width: '100%', height: '100%', minHeight: 270, border: 'none', background: 'transparent', resize: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: TXT, outline: 'none', lineHeight: 1.7, position: 'relative', zIndex: 2 }}
                />
                {!situation && (
                  <div style={{ position: 'absolute', top: 16, left: 16, right: 16, pointerEvents: 'none', zIndex: 1 }}>
                    <span style={{ fontSize: 14, color: TXT3, display: 'block', marginBottom: 10 }}>
                      {lang === 'FR' ? 'Décrivez votre situation en texte libre.' : 'Describe your situation in free text.'}
                    </span>
                    {hints.map((h, i) => (
                      <span key={i} className="hint-item"
                        style={{ display: 'block', fontSize: 12.5, color: TXT3, opacity: i === 3 ? 0.38 : 0.55, marginBottom: 6, fontStyle: i === 3 ? 'italic' : 'normal', pointerEvents: 'auto', cursor: 'pointer', transition: 'color .2s, opacity .2s' }}
                        onClick={() => setSituation(h)}>
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Barre bas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderTop: `1px solid ${BDR}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Agrandir */}
                  <button className="ic-btn" style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TXT2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                  </button>
                  {/* Micro */}
                  <button className="ic-btn" style={{ width: 30, height: 30, border: `1px solid ${BDR}`, background: BG_P, cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TXT2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 01-14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  </button>
                </div>
                {/* Boussole = déclencheur SC */}
                <button
                  onClick={() => { setScVisible(true) }}
                  style={{
                    width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    padding: 0, overflow: 'hidden', background: 'none',
                    animation: isTyping ? 'compassPulse 2s ease-in-out infinite' : 'none',
                    transform: 'scale(1)', transition: 'transform .2s',
                  }}
                  title={lang === 'FR' ? 'Générer la Situation Card' : 'Generate Situation Card'}
                >
                  <Image src="/pictos/LOOGO IAAA+.jpg" alt="Générer" width={44} height={44} style={{ objectFit: 'cover', borderRadius: '50%', width: '100%', height: '100%' }} unoptimized/>
                </button>
              </div>
            </div>

            {/* BLOC DROIT */}
            <div style={{ background: BG_PR, border: `1px solid ${BDR_G}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!scVisible ? (
                <>
                  {/* Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: `1px solid ${BDR_G}` }}>
                    {['Restreint', 'Public'].map(l => (
                      <button key={l} style={{ padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid #dde3e8`, color: '#b0bcc8', background: 'transparent', fontFamily: "'DM Sans',sans-serif" }}>{l}</button>
                    ))}
                    <button style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${BDR}`, background: 'none', cursor: 'pointer', fontSize: 11, color: TXT3, marginRight: 'auto' }}>?</button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: NAVY, color: 'white', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                      {lang === 'FR' ? 'Partager' : 'Share'}
                    </button>
                  </div>

                  {/* Roue marine */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ animation: 'rot1 22s linear infinite', width: 200, height: 200 }}>
                        <Image src="/pictos/roue_nobg.png" alt="roue" width={200} height={200} style={{ objectFit: 'contain', width: '100%', height: '100%' }} unoptimized/>
                      </div>
                    </div>
                  </div>

                  {/* Index + Cap + Trajectoires */}
                  <div style={{ padding: '0 14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: GOLD, fontWeight: 600, fontSize: 14 }}>Index 54</span>
                      <span style={{ color: TXT3 }}>·</span>
                      <span style={{ color: TXT2 }}>Contrôlable</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: TXT2, marginBottom: 6 }}>
                      <Image src="/pictos/cap.png" alt="cap" width={16} height={16} style={{ objectFit: 'contain' }} unoptimized/>
                      <span>Cap</span>
                      <span style={{ color: TXT3 }}>· 3 trajectoires possibles</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                      {[{ c: '#1D9E75', l: 'Stabilisation' }, { c: '#E06B4A', l: 'Escalade' }, { c: '#378ADD', l: 'Solution tiers' }].map(t => (
                        <div key={t.l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: TXT3 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.c }}/>
                          {t.l}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <SituationCardPanel onExpand={() => setScExpanded(true)}/>
              )}
            </div>
          </div>

          {/* SOUS-BARRE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0 14px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <button onClick={() => setPanelHistory(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${BDR}` }}>
                  <Image src="/pictos/horloge.jpg" alt="Historique" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized/>
                </div>
                <span style={{ fontSize: 9, color: TXT3 }}>{lang === 'FR' ? 'Historique' : 'History'}</span>
              </button>
              <button onClick={() => setPanelSaved(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${BDR}` }}>
                  <Image src="/pictos/Enregistrer_nobg.jpg" alt="Enregistrées" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized/>
                </div>
                <span style={{ fontSize: 9, color: TXT3 }}>{lang === 'FR' ? 'Enregistrées' : 'Saved'}</span>
              </button>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: GOLD_L, textAlign: 'center' }}>
              {lang === 'FR' ? 'Voir la structure pour pouvoir décider' : 'See the structure to decide'}
            </div>
          </div>
        </main>

        {/* MODULES */}
        <section style={{ background: '#EFEDE7', padding: '24px 28px', borderTop: `1px solid ${BDR}` }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {MODULES.map(m => (
              <Link key={m.key} href={m.href} style={{ textDecoration: 'none' }}>
                <div className="mod-card" style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 10, padding: '16px 14px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  {m.key === 'atlas' && (
                    <div style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.06 }}>
                      <Image src="/pictos/sphere atlas.svg" alt="" width={70} height={70} unoptimized/>
                    </div>
                  )}
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 500, color: NAVY, marginBottom: 3 }}>{m.tag}</div>
                  <div style={{ fontSize: 11, color: TXT3, marginBottom: 10 }}>{m.sub}</div>
                  <div style={{ width: 20, height: 1, background: BDR_G, marginBottom: 8 }}/>
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
