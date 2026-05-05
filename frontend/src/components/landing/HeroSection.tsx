'use client'

/**
 * IAAA · HeroSection V2
 *
 * Design validé — fond clair #F5F0E8, deux colonnes :
 *   Gauche  : tabs Texte/Documents/Images + textarea + planisphère + toolbar
 *   Droite  : astrolabe orbital doré + index + Cap + trajectoires
 *
 * Nav : logo + "Situation Card powered by IAAA+" | Plans / Connexion | FR/EN
 * On submit → /generate?q=encoded
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import OfferModal from '@/components/ui/OfferModal'
import Link from 'next/link'

const EXAMPLE_PROMPTS_EN = [
  'A humanitarian worker is held hostage by daily workers he employed. Strong suspicions of fraud.',
  'Is the Iran conflict the beginning of a global escalation or a calculated power demonstration?',
  'My company must expand internationally. We have options but no clarity on the risks.',
  'My partner has been distant for months. I don\'t know whether to address it or wait.',
]

const EXAMPLE_PROMPTS_FR = [
  'Un travailleur humanitaire est retenu en otage par des ouvriers qu\'il employait. Fraude présumée.',
  'Le conflit en Iran est-il le début d\'une escalade mondiale ou une démonstration de force calculée ?',
  'Mon entreprise doit s\'internationaliser. Nous avons plusieurs options mais aucune clarté sur les risques.',
  'Mon partenaire est distant depuis des mois. Je ne sais pas s\'il faut en parler ou attendre.',
]

export default function HeroSection() {
  const [situation, setSituation]   = useState('')
  const [activeTab, setActiveTab]   = useState<'text' | 'docs' | 'images'>('text')
  const [lang, setLang]             = useState<'EN' | 'FR'>('FR')
  const [showOffers, setShowOffers] = useState(false)
  const router    = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const prompts = lang === 'EN' ? EXAMPLE_PROMPTS_EN : EXAMPLE_PROMPTS_FR

  function handleGenerate() {
    const trimmed = situation.trim()
    if (!trimmed) return
    router.push(`/generate?q=${encodeURIComponent(trimmed)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }

  function handlePromptSelect(text: string) {
    setSituation(text)
    textareaRef.current?.focus()
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const root: React.CSSProperties = {
    background:  '#F5F0E8',
    minHeight:   '100vh',
    fontFamily:  'var(--font-dm-sans, system-ui, sans-serif)',
    color:       '#1A2E5A',
  }

  return (
    <div style={root}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        background:    '#fff',
        borderBottom:  '1px solid #E8E0D0',
        padding:       '12px 28px',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        gap:           '16px',
      }}>

        {/* Brand */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
          <svg width="38" height="38" viewBox="0 0 48 48">
            <defs>
              <radialGradient id="lg" cx="50%" cy="38%" r="62%">
                <stop offset="0%"   stopColor="#2A4A88" />
                <stop offset="100%" stopColor="#1A2E5A" />
              </radialGradient>
            </defs>
            <circle cx="24" cy="24" r="22.5" fill="none" stroke="#B8911A" strokeWidth="1.2" strokeDasharray="1.9,1.5" />
            <circle cx="24" cy="24" r="21.5" fill="url(#lg)" />
            {[0,45,90,135,180,225,270,315].map((deg, i) => {
              const r = Math.PI * deg / 180
              const x = 24 + 19 * Math.sin(r)
              const y = 24 - 19 * Math.cos(r)
              return <line key={i} x1="24" y1="24" x2={x} y2={y} stroke="#E8C84A" strokeWidth={i % 2 === 0 ? 2.8 : 2.1} strokeLinecap="round" />
            })}
            <circle cx="24" cy="24" r="3.5" fill="#D4A860" stroke="#A87830" strokeWidth="0.8" />
          </svg>
          <div>
            <div style={{ fontSize:'14px', fontWeight:500, color:'#1A2E5A', lineHeight:1.2 }}>Situation Card</div>
            <div style={{ fontSize:'9px', color:'#9A8860', fontFamily:'var(--font-cinzel, serif)', letterSpacing:'0.08em' }}>powered by IAAA+</div>
          </div>
        </Link>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <button
            onClick={() => setShowOffers(true)}
            style={{ fontSize:'12px', color:'#5A6A8A', textDecoration:'none', background:'none', border:'none', cursor:'pointer', padding:0 }}
          >
            {lang === 'EN' ? 'Plans' : 'Offres'}
          </button>
          <Link href="/login" style={{ fontSize:'12px', color:'#5A6A8A', textDecoration:'none' }}>
            {lang === 'EN' ? 'Sign in' : 'Connexion'}
          </Link>
          <div style={{ width:'1px', height:'16px', background:'#DDD' }} />
          {(['FR','EN'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:'12px',
              color:      lang === l ? '#1A2E5A' : '#9A8860',
              fontWeight: lang === l ? 600 : 400,
            }}>{l}</button>
          ))}
        </div>
      </nav>

      {/* ── MAIN 2-COL ───────────────────────────────────────────────── */}
      <div style={{
        padding:             '24px 28px',
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 '20px',
        maxWidth:            '1100px',
        margin:              '0 auto',
      }}>

        {/* ── LEFT ─────────────────────────────────────────────────── */}
        <div style={{
          background:    '#fff',
          border:        '1px solid #E8E0D0',
          borderRadius:  '10px',
          overflow:      'hidden',
          display:       'flex',
          flexDirection: 'column',
        }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #E8E0D0' }}>
            {(['text','docs','images'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex:         1,
                padding:      '10px',
                fontSize:     '12px',
                color:        activeTab === tab ? '#1A2E5A' : '#9A8860',
                background:   'none',
                border:       'none',
                borderBottom: activeTab === tab ? '2px solid #C8951A' : '2px solid transparent',
                fontWeight:   activeTab === tab ? 500 : 400,
                cursor:       'pointer',
              }}>
                {tab === 'text' ? (lang === 'EN' ? '📄 Text' : '📄 Texte')
                 : tab === 'docs' ? (lang === 'EN' ? '📋 Documents' : '📋 Documents')
                 : (lang === 'EN' ? '🖼 Images' : '🖼 Images')}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div style={{ padding:'16px', flex:1 }}>
            <textarea
              ref={textareaRef}
              value={situation}
              onChange={e => setSituation(e.target.value.slice(0, 6000))}
              onKeyDown={handleKeyDown}
              placeholder={lang === 'EN' ? 'Describe your situation…' : 'Décrivez votre situation…'}
              rows={4}
              style={{
                width:      '100%',
                border:     'none',
                outline:    'none',
                resize:     'none',
                fontFamily: 'var(--font-dm-sans, system-ui)',
                fontSize:   '14px',
                color:      '#1A2E5A',
                background: 'transparent',
                lineHeight: 1.6,
              }}
            />

            {/* Example prompts */}
            <div style={{ marginTop:'10px', borderTop:'1px solid #F0EBE0', paddingTop:'10px' }}>
              {prompts.map((p, i) => (
                <div key={i} onClick={() => handlePromptSelect(p)} style={{
                  fontSize:   '11px',
                  color:      '#B8AD9A',
                  lineHeight: 2.2,
                  cursor:     'pointer',
                  transition: 'color 0.15s',
                  paddingLeft:'2px',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#7A6A5A')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#B8AD9A')}
                >
                  e.g. — {p}
                </div>
              ))}
            </div>
          </div>

          {/* Planisphere */}
          <div style={{ padding:'8px 16px 0', borderTop:'1px solid #F0EBE0' }}>
            <svg width="100%" viewBox="0 0 480 160" style={{ display:'block' }}>
              <defs>
                <radialGradient id="pg" cx="50%" cy="50%" r="60%">
                  <stop offset="0%"   stopColor="#E8F0F8" />
                  <stop offset="100%" stopColor="#F5F0E8" />
                </radialGradient>
              </defs>
              <ellipse cx="240" cy="80" rx="232" ry="74" fill="url(#pg)" stroke="#C8D8E8" strokeWidth="0.8" />
              {/* Graticule */}
              <line x1="8" y1="80" x2="472" y2="80" stroke="#C8B880" strokeWidth="0.4" opacity="0.35" />
              <line x1="240" y1="6" x2="240" y2="154" stroke="#C8B880" strokeWidth="0.4" opacity="0.35" />
              <ellipse cx="240" cy="80" rx="232" ry="36" fill="none" stroke="#C8B880" strokeWidth="0.3" opacity="0.25" />
              {/* Americas */}
              <path d="M72 30 L65 45 L60 62 L62 78 L57 95 L52 112 L57 130 L67 138 L77 135 L81 120 L78 102 L85 85 L97 72 L98 57 L90 44 L80 34 Z" fill="#D4C9A8" stroke="#C8B880" strokeWidth="0.6" opacity="0.8"/>
              {/* Europe */}
              <path d="M214 22 L228 17 L242 19 L250 29 L252 40 L243 47 L228 43 L218 38 Z" fill="#D4C9A8" stroke="#C8B880" strokeWidth="0.6" opacity="0.8"/>
              {/* Africa */}
              <path d="M218 53 L237 48 L256 51 L262 66 L265 88 L262 112 L253 134 L240 143 L226 136 L219 119 L213 94 L211 73 Z" fill="#D4C9A8" stroke="#C8B880" strokeWidth="0.6" opacity="0.8"/>
              {/* Middle East / Iran highlight */}
              <path d="M268 44 L288 40 L305 43 L310 53 L306 65 L290 70 L270 67 L260 57 Z" fill="#D4C9A8" stroke="#C8B880" strokeWidth="0.6" opacity="0.8"/>
              <path d="M274 42 L291 44 L296 54 L289 63 L274 65 L264 57 L265 47 Z" fill="#C8951A" opacity="0.25" stroke="#C8951A" strokeWidth="0.8"/>
              {/* Asia */}
              <path d="M305 22 L330 18 L358 20 L378 26 L392 34 L398 48 L394 62 L378 68 L356 63 L334 58 L312 53 L303 42 Z" fill="#D4C9A8" stroke="#C8B880" strokeWidth="0.6" opacity="0.8"/>
              {/* Congo dot */}
              <circle cx="237" cy="91" r="4"   fill="#185FA5" opacity="0.3"/>
              <circle cx="237" cy="91" r="2.5" fill="#185FA5" opacity="0.9"/>
              <line x1="237" y1="91" x2="237" y2="82" stroke="#185FA5" strokeWidth="1.2"/>
              <text x="237" y="79" textAnchor="middle" fontSize="6.5" fill="#185FA5" fontWeight="500" fontFamily="DM Sans,sans-serif">Congo</text>
              {/* Iran dot */}
              <circle cx="281" cy="52" r="3"   fill="#C8951A" opacity="0.9"/>
              <line x1="281" y1="52" x2="281" y2="43" stroke="#C8951A" strokeWidth="1.2"/>
              <text x="281" y="40" textAnchor="middle" fontSize="6.5" fill="#C8951A" fontWeight="500" fontFamily="DM Sans,sans-serif">Iran</text>
              <ellipse cx="240" cy="80" rx="232" ry="74" fill="none" stroke="#C8B880" strokeWidth="0.8"/>
            </svg>
          </div>

          {/* Toolbar */}
          <div style={{ padding:'10px 14px', borderTop:'1px solid #E8E0D0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:'12px', color:'#9A8860', fontSize:'16px' }}>
              <span style={{ cursor:'pointer' }} title="Expand">⤢</span>
              <span style={{ cursor:'pointer' }} title="Context map">🧭</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'11px', color:'#B8AD9A' }}>⌘↵</span>
              <span style={{ fontSize:'11px', color: situation.length > 5400 ? '#C8951A' : '#B8AD9A', marginLeft: '8px' }}>
                {situation.length > 0 ? `${situation.length}/6 000` : '3 pages max'}
              </span>
              <button
                onClick={handleGenerate}
                disabled={!situation.trim()}
                style={{
                  background:   situation.trim() ? '#1A2E5A' : 'transparent',
                  color:        situation.trim() ? '#fff'    : '#9A8860',
                  border:       `1px solid ${situation.trim() ? '#1A2E5A' : '#DDD'}`,
                  borderRadius: '6px',
                  padding:      '7px 18px',
                  fontSize:     '12px',
                  fontWeight:   500,
                  cursor:       situation.trim() ? 'pointer' : 'not-allowed',
                  transition:   'all 0.15s',
                }}
              >
                {lang === 'EN' ? 'Generate →' : 'Générer →'}
              </button>
              <span style={{ fontSize:'16px', cursor:'pointer' }}>🎤</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Astrolabe preview ─────────────────────────────── */}
        <div style={{
          background:    '#FBF7F0',
          border:        '1px solid #E8E0D0',
          borderRadius:  '10px',
          padding:       '16px',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
        }}>
          {/* Action row */}
          <div style={{ display:'flex', gap:'7px', alignSelf:'stretch', marginBottom:'14px', flexWrap:'wrap' }}>
            <button style={{ background:'#1A2E5A', color:'#fff', border:'none', borderRadius:'7px', padding:'7px 13px', fontSize:'12px', fontWeight:500, cursor:'pointer' }}>
              🔒 {lang === 'EN' ? 'Private' : 'Restreint'}
            </button>
            <button style={{ background:'transparent', color:'#5A6A8A', border:'1px solid #DDD', borderRadius:'7px', padding:'7px 11px', fontSize:'12px', cursor:'pointer' }}>
              🌍 {lang === 'EN' ? 'Public' : 'Public'}
            </button>
            <button style={{ background:'transparent', color:'#9A8860', border:'1px solid #DDD', borderRadius:'50%', width:'30px', height:'30px', fontSize:'12px', cursor:'pointer' }}>?</button>
            <button style={{ background:'#1A2E5A', color:'#fff', border:'none', borderRadius:'7px', padding:'7px 13px', fontSize:'12px', fontWeight:500, cursor:'pointer', marginLeft:'auto' }}>
              ↗ {lang === 'EN' ? 'Share' : 'Partager'}
            </button>
          </div>

          {/* Astrolabe orbital */}
          <svg width="180" height="180" viewBox="0 0 220 220">
            <defs>
              <radialGradient id="ag" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#F5E8C0" />
                <stop offset="100%" stopColor="#F5F0E8" />
              </radialGradient>
            </defs>
            <circle cx="110" cy="110" r="104" fill="url(#ag)" stroke="#E8C84A" strokeWidth="0.5" opacity="0.25"/>
            <ellipse cx="110" cy="110" rx="90" ry="55" fill="none" stroke="#C8A860" strokeWidth="1"   opacity="0.3"/>
            <ellipse cx="110" cy="110" rx="60" ry="36" fill="none" stroke="#C8A860" strokeWidth="1"   opacity="0.4"/>
            <ellipse cx="110" cy="110" rx="30" ry="18" fill="none" stroke="#C8A860" strokeWidth="1"   opacity="0.5"/>
            <path d="M 60 78 Q 110 48 160 78"  fill="none" stroke="#C8A860" strokeWidth="1.2" opacity="0.45"/>
            <path d="M 50 134 Q 110 164 170 134" fill="none" stroke="#C8A860" strokeWidth="1.2" opacity="0.45"/>
            {/* Planets */}
            {[
              { cx: 60,  cy: 104, r: 4   },
              { cx: 164, cy: 118, r: 3.5 },
              { cx: 110, cy: 64,  r: 3   },
              { cx: 84,  cy: 148, r: 2.5 },
            ].map(({ cx, cy, r }, i) => (
              <g key={i}>
                <line x1="110" y1="110" x2={cx} y2={cy} stroke="#C8A860" strokeWidth="0.7" opacity="0.35"/>
                <circle cx={cx} cy={cy} r={r} fill="#C8A860" opacity="0.65"/>
              </g>
            ))}
            <circle cx="110" cy="110" r="9"   fill="#E8C84A" opacity="0.85"/>
            <circle cx="110" cy="110" r="5.5" fill="#D4A860"/>
          </svg>

          {/* Index */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'16px', fontWeight:600, color:'#C8951A' }}>Index 54</span>
            <span style={{ fontSize:'13px', color:'#C8951A' }}>
              · {lang === 'EN' ? 'Manageable' : 'Contrôlable'}
            </span>
          </div>

          {/* Cap label */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
            <span style={{ fontSize:'18px' }}>🧭</span>
            <span style={{ fontSize:'14px', fontWeight:500, color:'#1A2E5A' }}>Cap</span>
          </div>
          <span style={{ fontSize:'12px', color:'#9A8860' }}>
            3 {lang === 'EN' ? 'trajectories' : 'trajectoires'}
          </span>

          {/* Trajectories preview */}
          <div style={{ marginTop:'14px', alignSelf:'stretch', display:'flex', flexDirection:'column', gap:'6px' }}>
            {[
              { label: lang === 'EN' ? 'Stabilisation' : 'Stabilisation', color: '#2A7A4A' },
              { label: lang === 'EN' ? 'Escalation'    : 'Escalade',      color: '#C8951A' },
              { label: lang === 'EN' ? 'Regime Shift'  : 'Rupture',       color: '#A83030' },
            ].map(({ label, color }) => (
              <div key={label} style={{
                background:   '#fff',
                border:       `1px solid #E8E0D0`,
                borderLeft:   `3px solid ${color}`,
                borderRadius: '5px',
                padding:      '6px 10px',
                fontSize:     '11px',
                color:        '#5A6A8A',
              }}>
                <span style={{ fontWeight:500, color }}>{label}</span>
                {' — '}
                <span style={{ color:'#9A8860' }}>{lang === 'EN' ? '…' : '…'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAGLINE ─────────────────────────────────────────────────── */}
      <div style={{ textAlign:'center', padding:'8px 28px 20px' }}>
        <p style={{
          fontFamily: 'var(--font-cormorant, serif)',
          fontSize:   '22px',
          color:      '#1A2E5A',
          fontStyle:  'italic',
        }}>
          {lang === 'EN' ? 'What is really happening?' : 'Que se passe-t-il vraiment ?'}
        </p>
      </div>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <div style={{ background:'#F0EBE0', padding:'20px 28px' }}>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap:                 '12px',
          maxWidth:            '1100px',
          margin:              '0 auto',
        }}>
          {([
            { name:'Clarity', desc: lang === 'EN' ? 'Individual'       : 'Individuel'       },
            { name:'SIS',     desc: lang === 'EN' ? 'Pro Collective'   : 'Collectif Pro'    },
            { name:'IAAA+',  desc: lang === 'EN' ? 'Governance'       : 'Gouvernance'      },
            { name:'ATLAS',  desc: lang === 'EN' ? 'Public cards'     : 'Cartes publiques' },
          ] as const).map(({ name, desc }) => (
            <div key={name} style={{
              background:   '#fff',
              border:       '1px solid #E8E0D0',
              borderRadius: '9px',
              padding:      '18px 14px',
              cursor:       'pointer',
            }}>
              <p style={{ fontSize:'15px', fontWeight:600, color:'#1A2E5A', marginBottom:'4px' }}>{name}</p>
              <p style={{ fontSize:'11px', color:'#9A8860' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ background:'#fff', borderTop:'1px solid #E8E0D0', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:'18px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'11px', color:'#9A8860' }}>{lang === 'EN' ? 'Low carbon mode' : 'Mode bas carbone'}</span>
          {[
            { label: lang === 'EN' ? 'About' : 'À propos', href: `/about?lang=${lang.toLowerCase()}` },
            { label: 'Contact', href: `/contact?lang=${lang.toLowerCase()}` },
            { label: lang === 'EN' ? 'Privacy' : 'Confidentialité', href: `/privacy?lang=${lang.toLowerCase()}` },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontSize:'11px', color:'#9A8860', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <span style={{ fontSize:'11px', color:'#9A8860' }}>situationcard.com</span>
      </footer>

      {showOffers && <OfferModal onClose={() => setShowOffers(false)} />}

    </div>
  )
}
