/**
 * IAAA · /sis-system
 * Page de présentation SIS — Situation Intelligence System.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SIS — Situation Intelligence System',
  description: 'SIS structure les situations complexes pour les professionnels, équipes et collectifs.',
}

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    home: 'Accueil',
    eyebrow: 'Collectif Pro',
    intro: 'SIS est la version professionnelle de Clarity : une couche de lecture pour structurer les situations complexes, partager une analyse et rendre les décisions plus lisibles.',
    features: [
      { n: '01', title: 'Lecture collective', body: 'Une même situation peut être lue par plusieurs personnes sans forcer un consensus artificiel. SIS rend les accords et les désaccords lisibles.' },
      { n: '02', title: 'Documents et contexte', body: 'Le système peut intégrer textes, documents, ressources et précisions utilisateur pour produire une Situation Card plus ancrée.' },
      { n: '03', title: 'Traçabilité', body: 'Chaque lecture peut être conservée, reprise, partagée ou comparée dans le temps pour suivre l’évolution d’une situation.' },
    ],
    forWho: 'Pour qui',
    uses: ['Directions générales', 'Consultants et analystes', 'Équipes de crise', 'Collectifs professionnels', 'Investisseurs et comités', 'Organisations multi-acteurs'],
    footer: 'Le collectif professionnel, sans perdre la lisibilité.',
  },
  EN: {
    home: 'Home',
    eyebrow: 'Pro Collective',
    intro: 'SIS is the professional version of Clarity: a reading layer for structuring complex situations, sharing analysis, and making decisions more readable.',
    features: [
      { n: '01', title: 'Collective Reading', body: 'The same situation can be read by several people without forcing artificial consensus. SIS makes agreements and disagreements readable.' },
      { n: '02', title: 'Documents and Context', body: 'The system can integrate texts, documents, resources, and user clarifications to produce a more grounded Situation Card.' },
      { n: '03', title: 'Traceability', body: 'Each reading can be saved, resumed, shared, or compared over time to track how a situation evolves.' },
    ],
    forWho: 'For whom',
    uses: ['Executive teams', 'Consultants and analysts', 'Crisis teams', 'Professional collectives', 'Investors and committees', 'Multi-stakeholder organizations'],
    footer: 'Professional collective reading, without losing clarity.',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function SisSystemPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = readLang(searchParams?.lang)
  const copy = COPY[lang]
  const suffix = `?lang=${lang.toLowerCase()}`

  return (
    <main style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', color: '#1A2E5A' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '13px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={`/${suffix}`} style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.12em' }}>SITUATION CARD</Link>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          <Link href={`/clarity${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>Clarity</Link>
          <Link href={`/enterprise${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>IAAA+</Link>
          <Link href={`/${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.home}</Link>
        </div>
      </nav>

      <section style={{ padding: '64px 36px 50px', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#C8951A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>{copy.eyebrow}</p>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, color: '#C8951A', letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 16 }}>
          SIS
        </h1>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: '#1A2E5A', fontStyle: 'italic', lineHeight: 1.28, marginBottom: 18 }}>
          Situation Intelligence System
        </p>
        <p style={{ fontSize: 14, color: '#6F6255', lineHeight: 1.8, maxWidth: 680, margin: '0 auto 28px' }}>
          {copy.intro}
        </p>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #E8E0D0', borderBottom: '1px solid #E8E0D0', padding: '12px 36px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {copy.features.map((feature, i) => (
            <div key={feature.n} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 20, padding: '24px 0', borderBottom: i < copy.features.length - 1 ? '1px solid #F0EBE0' : 'none' }}>
              <p style={{ fontSize: 11, color: '#C8951A', fontFamily: 'var(--font-cormorant, serif)', paddingTop: 2 }}>{feature.n}</p>
              <div>
                <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 11, color: '#1A2E5A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{feature.title}</p>
                <p style={{ fontSize: 13, color: '#6F6255', lineHeight: 1.8 }}>{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '38px 36px', maxWidth: 980, margin: '0 auto' }}>
        <p style={{ fontSize: 10, color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{copy.forWho}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {copy.uses.map((item) => (
            <div key={item} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 7, padding: '13px 15px', fontSize: 12, color: '#6F6255' }}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #E8E0D0', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F0E8' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 14, fontStyle: 'italic', color: '#9A8860' }}>{copy.footer}</p>
        <div style={{ display: 'flex', gap: 18, fontSize: 12 }}>
          <Link href={`/clarity${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>← Clarity</Link>
          <Link href={`/enterprise${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>IAAA+ →</Link>
        </div>
      </footer>
    </main>
  )
}
