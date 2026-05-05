'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

const CATEGORIES = [
  { key: 'all', label: 'Toutes' },
  { key: 'geopolitique', label: 'Géopolitique' },
  { key: 'humanitaire', label: 'Humanitaire' },
  { key: 'entreprise', label: 'Entreprise' },
  { key: 'gouvernance', label: 'Gouvernance' },
  { key: 'societe', label: 'Société' },
  { key: 'sciences', label: 'Sciences' },
  { key: 'personnel', label: 'Personnel public' },
]

const DEMO_CARDS = [
  {
    slug: 'iran-j19',
    title: 'Guerre Iran — Opération Epic Fury · Jour 19',
    subtitle: 'Escalade militaire régionale après frappes israéliennes',
    category: 'geopolitique',
    state: 'Hors contrôle',
    stateColor: '#9B1515',
    index: 91,
    certified: true,
    validatedBy: 'JCA · IAAA+',
    date: '22 mars 2026',
    reads: 1247,
    geography: 'Moyen-Orient',
  },
  {
    slug: 'sequestration-v2',
    title: 'Séquestration de journaliers — Réhabilitation route',
    subtitle: 'Employé ONG retenu par des journaliers impayés',
    category: 'humanitaire',
    state: 'Critique',
    stateColor: '#E24B4A',
    index: 85,
    certified: true,
    validatedBy: 'Maël · Chef de base ONG Congo',
    date: '19 mars 2026',
    reads: 834,
    geography: 'Nord-Kivu, RDC',
  },
  {
    slug: 'ong-rdc',
    title: 'Chef de projet ONG — Nord-Kivu',
    subtitle: 'Dysfonctionnement de rôle protégé par loyauté institutionnelle',
    category: 'humanitaire',
    state: 'Contrôlable',
    stateColor: '#3B82F6',
    index: 54,
    certified: true,
    validatedBy: 'Maël · Chef de base ONG Congo',
    date: '18 mars 2026',
    reads: 612,
    geography: 'Nord-Kivu, RDC',
  },
]

const LABELS: Record<string, Record<string, string>> = {
  FR: {
    tagline: 'Les situations du monde, structurées et partagées.',
    sub: 'Situations complexes analysées, rendues publiques pour être comprises.',
    search: 'Rechercher une situation, un pays, un thème...',
    mostRead: 'LES PLUS LUES',
    latest: 'DERNIÈRES AJOUTÉES',
    results: 'RÉSULTATS',
    noResults: 'Aucune carte ne correspond à cette recherche.',
    certifyTitle: 'Faire certifier votre SC',
    certifyDesc: 'Une SC publique peut obtenir le badge SC Certified après validation par un analyste IAAA+. Elle apparaîtra en priorité dans l\'ATLAS.',
    back: '← Accueil',
    reads: 'lectures',
  },
  EN: {
    tagline: 'World situations, structured and shared.',
    sub: 'Complex situations analysed and made public to be understood.',
    search: 'Search a situation, country, theme...',
    mostRead: 'MOST READ',
    latest: 'LATEST',
    results: 'RESULTS',
    noResults: 'No cards match this search.',
    certifyTitle: 'Get your SC certified',
    certifyDesc: 'A public SC can receive the SC Certified badge after validation by an IAAA+ analyst. It will appear first in the ATLAS.',
    back: '← Home',
    reads: 'reads',
  }
}

function CertifiedBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `rgba(184,154,106,0.12)`, border: `1px solid ${BDR_G}`, borderRadius: 20, padding: '2px 8px' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={GOLD} stroke={GOLD} strokeWidth="1"/>
      </svg>
      <span style={{ fontSize: 9, color: GOLD, fontWeight: 500, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>SC CERTIFIED</span>
    </div>
  )
}

function ScCard({ card, lang }: { card: typeof DEMO_CARDS[0]; lang: 'FR' | 'EN' }) {
  const L = LABELS[lang]
  return (
    <Link href={`/sc/${card.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: BG_P, border: `1px solid ${BDR}`, borderRadius: 10,
        padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'border-color .2s, transform .2s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BDR; (e.currentTarget as HTMLElement).style.transform = 'none' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.stateColor, borderRadius: '10px 10px 0 0' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {card.certified && <div style={{ marginBottom: 6 }}><CertifiedBadge /></div>}
            <div style={{ fontSize: 13, fontStyle: 'italic', color: TXT, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.4, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.5, marginBottom: 8 }}>{card.subtitle}</div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: card.stateColor, fontFamily: "'Cinzel', serif", lineHeight: 1 }}>{card.index}</div>
            <div style={{ fontSize: 8, color: TXT3, marginTop: 2 }}>INDEX</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${BDR}`, paddingTop: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: card.stateColor, fontFamily: "'Cinzel', serif" }}>{card.state}</span>
            <span style={{ fontSize: 9, color: TXT3 }}>· {card.geography}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: TXT3 }}>{card.reads} {L.reads}</span>
            <span style={{ fontSize: 9, color: TXT3 }}>· {card.date}</span>
          </div>
        </div>
        {card.certified && (
          <div style={{ fontSize: 9, color: GOLD, marginTop: 6 }}>{card.validatedBy}</div>
        )}
      </div>
    </Link>
  )
}

export default function AtlasPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [lang, setLang] = useState<'FR' | 'EN'>('FR')
  const L = LABELS[lang]

  const filtered = DEMO_CARDS.filter(c => {
    const matchCat = activeCategory === 'all' || c.category === activeCategory
    const matchSearch = search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      c.geography.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const mostRead = [...DEMO_CARDS].sort((a, b) => b.reads - a.reads)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Cinzel:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:${BG};color:${TXT}}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${BDR_G};border-radius:2px}
        .cat-pill{transition:all .2s}
        .cat-pill:hover{border-color:${NAVY}!important}
      `}</style>

      <header style={{ background: BG, borderBottom: `1px solid ${BDR}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${BDR_G}` }}>
            <Image src="/pictos/LOOGO IAAA+.jpg" alt="IAAA+" width={38} height={38} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: NAVY, fontFamily: "'Cinzel', serif" }}>Situation Card</div>
            <div style={{ fontSize: 9, color: TXT3 }}>powered by IAAA+</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, opacity: 0.2 }}>
            <Image src="/pictos/sphere atlas.svg" alt="" width={24} height={24} unoptimized/>
          </div>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 500, color: NAVY, letterSpacing: '0.1em' }}>ATLAS</span>
          <span style={{ fontSize: 11, color: TXT3 }}>— {lang === 'FR' ? 'Cartes publiques' : 'Public cards'}</span>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: TXT2, textDecoration: 'none' }}>{L.back}</Link>
          <div style={{ display: 'flex', gap: 6, paddingLeft: 12, borderLeft: `1px solid ${BDR}` }}>
            {(['FR', 'EN'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', color: lang === l ? NAVY : TXT3, transition: 'color .2s' }}>{l}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px 60px' }}>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 30, color: GOLD_L, marginBottom: 8 }}>
            {L.tagline}
          </div>
          <div style={{ fontSize: 13, color: TXT2, maxWidth: 480, margin: '0 auto' }}>{L.sub}</div>
        </div>

        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto 24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TXT3} strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L.search}
            style={{ width: '100%', padding: '10px 16px 10px 38px', border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: BG_P, color: TXT }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36, justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className="cat-pill"
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${activeCategory === cat.key ? NAVY : BDR}`, background: activeCategory === cat.key ? NAVY : 'transparent', color: activeCategory === cat.key ? '#fff' : TXT2, fontFamily: "'DM Sans', sans-serif" }}>
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory === 'all' && search === '' && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 24, height: 1, background: BDR_G }}/>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: GOLD, letterSpacing: '0.12em' }}>{L.mostRead}</span>
              <div style={{ flex: 1, height: 1, background: BDR_G }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {mostRead.map(card => <ScCard key={card.slug} card={card} lang={lang}/>)}
            </div>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: BDR_G }}/>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: GOLD, letterSpacing: '0.12em' }}>
              {search !== '' ? `${L.results} (${filtered.length})` : activeCategory === 'all' ? L.latest : CATEGORIES.find(c => c.key === activeCategory)?.label.toUpperCase()}
            </span>
            <div style={{ flex: 1, height: 1, background: BDR_G }}/>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: TXT3, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{L.noResults}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {filtered.map(card => <ScCard key={card.slug} card={card} lang={lang}/>)}
            </div>
          )}
        </div>

        <div style={{ marginTop: 48, background: BG_P, border: `1px solid ${BDR_G}`, borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <CertifiedBadge />
              <span style={{ fontSize: 13, fontWeight: 500, color: NAVY }}>{L.certifyTitle}</span>
            </div>
            <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.6 }}>{L.certifyDesc}</div>
          </div>
          <a href="mailto:contact@situationcard.com" style={{ flexShrink: 0, padding: '8px 18px', background: NAVY, color: '#fff', borderRadius: 8, fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
            contact@situationcard.com →
          </a>
        </div>
      </main>

      <footer style={{ background: BG_P, borderTop: `1px solid ${BDR}`, padding: '12px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ l: lang === 'FR' ? 'À propos' : 'About', h: `/about?lang=${lang.toLowerCase()}` }, { l: 'Contact', h: `/contact?lang=${lang.toLowerCase()}` }, { l: lang === 'FR' ? 'Confidentialité' : 'Privacy', h: `/privacy?lang=${lang.toLowerCase()}` }].map(item => (
              <Link key={item.l} href={item.h} style={{ fontSize: 11, color: TXT3, textDecoration: 'none' }}>{item.l}</Link>
            ))}
          </div>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: TXT3 }}>situationcard.com</span>
        </div>
      </footer>
    </>
  )
}
