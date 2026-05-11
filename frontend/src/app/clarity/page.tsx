/**
 * IAAA · /clarity
 * Page de présentation Clarity.
 */

import Link from 'next/link'

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    home: 'Accueil',
    login: 'Se connecter',
    intro: 'Clarté est la porte d’entrée de Situation Card : transformer une question, une URL ou un document en carte lisible, partageable et traçable.',
    useCases: [
      'Question personnelle ou professionnelle',
      'Compréhension du monde',
      'URL ou ressource à analyser',
      'Tension relationnelle ou collective',
      'Choix stratégique',
      'Document à rendre lisible',
    ],
    line1: 'Clarté ne remplace pas votre jugement.',
    line2: 'Clarté met la situation en forme pour mieux penser.',
    benefits: [
      'Une Situation Card structurée',
      'Une lecture courte pour voir le système',
      'La vulnérabilité centrale',
      'Trois évolutions possibles',
      'Un signal concret à surveiller',
      'Des pistes d’approfondissement et de ressources',
    ],
    free: 'Commencez gratuitement. Aucune carte bancaire requise.',
    start: 'Lancez votre première Situation Card depuis l’interface de création.',
    cta: 'Créer une Situation Card',
    footer: 'Une question devient une carte. Une carte devient une lecture.',
    atlas: 'Explorer Atlas →',
    enterprise: 'IAAA+ →',
  },
  EN: {
    home: 'Home',
    login: 'Sign in',
    intro: 'Clarity is the entry point to Situation Card: turn a question, URL, or document into a readable, shareable, and traceable card.',
    useCases: [
      'Personal or professional question',
      'Understanding the world',
      'URL or resource to analyze',
      'Relational or collective tension',
      'Strategic choice',
      'Document to make readable',
    ],
    line1: 'Clarity does not replace your judgment.',
    line2: 'Clarity gives the situation a form you can think with.',
    benefits: [
      'A structured Situation Card',
      'A short reading to see the system',
      'The central vulnerability',
      'Three possible trajectories',
      'One concrete signal to watch',
      'Deepening paths and resources',
    ],
    free: 'Start for free. No credit card required.',
    start: 'Launch your first Situation Card from the creation interface.',
    cta: 'Create a Situation Card',
    footer: 'A question becomes a card. A card becomes a reading.',
    atlas: 'Explore Atlas →',
    enterprise: 'IAAA+ →',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function ClarityPage({
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
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#9A8860' }}>
          <Link href={`/${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.home}</Link>
          <Link href={`/enterprise${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>IAAA+</Link>
          <Link href="/login" style={{ color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>{copy.login}</Link>
        </div>
      </nav>

      <section style={{ padding: '64px 36px 56px', maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 700, color: '#185FA5', letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1.08, marginBottom: '22px' }}>
          {lang === 'FR' ? 'Clarté' : 'Clarity'}
        </h1>
        <p style={{ fontSize: '15px', color: '#6F6255', lineHeight: 1.8, maxWidth: '620px', margin: '0 auto 34px' }}>
          {copy.intro}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '42px' }}>
          {copy.useCases.map((item) => (
            <div key={item} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: '8px', padding: '16px 18px', boxShadow: '0 10px 24px rgba(26,46,90,0.05)' }}>
              <p style={{ fontSize: '13px', color: item === copy.useCases[2] ? '#C8951A' : '#1A2E5A', lineHeight: 1.5 }}>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#fff', padding: '44px 36px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '36px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#1A2E5A', lineHeight: 1.55, marginBottom: '7px' }}>{copy.line1}</p>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#C8951A', lineHeight: 1.55 }}>{copy.line2}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {copy.benefits.map((item) => (
            <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#5A6A7A', lineHeight: 1.6 }}>
              <span style={{ color: '#C8951A', fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>◆</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#F5F0E8', borderTop: '1px solid #E8E0D0', padding: '36px 36px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: '#EEF4FF', color: '#185FA5', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px', marginBottom: '14px' }}>
            Freemium
          </span>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#1A2E5A', marginBottom: '8px', lineHeight: 1.5 }}>
            {copy.free}
          </p>
          <p style={{ fontSize: '13px', color: '#9A8860', marginBottom: '20px', lineHeight: 1.7 }}>
            {copy.start}
          </p>
          <Link href={`/${suffix}`} style={{ display: 'inline-block', background: '#1A2E5A', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '11px 28px', borderRadius: '7px', textDecoration: 'none' }}>
            {copy.cta}
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #E8E0D0', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F0E8' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '14px', fontStyle: 'italic', color: '#9A8860' }}>{copy.footer}</p>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9A8860' }}>
          <Link href={`/library${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.atlas}</Link>
          <Link href={`/enterprise${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.enterprise}</Link>
        </div>
      </footer>

    </main>
  )
}
