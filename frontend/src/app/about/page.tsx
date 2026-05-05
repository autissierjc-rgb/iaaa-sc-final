import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — IAAA+',
  description: 'IAAA+ builds AI architectures for human and artificial intelligence alliance.',
}

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    back: 'Retour',
    eyebrow: 'À propos',
    agency: 'Agence d’Intelligence Artificielle d’Alliance',
    quote: 'IAAA+ est une société à mission dédiée à l’éducation et à la conception d’architectures pour l’alliance entre humains et intelligences artificielles.',
    p1: 'L’intelligence artificielle ne remplace pas le jugement humain. Elle peut l’éclairer, à condition d’être conçue pour cela.',
    p2: 'Situation Card est la première expression publique de cette question. Un système d’analyse structurée de situations complexes, conçu pour que la décision reste toujours celle de la personne qui fait face à la situation.',
    p3: 'Ce n’est pas un outil de réponse. C’est un instrument de clarté.',
    offers: 'Voir les offres',
    atlas: 'Explorer l’Atlas',
    contact: 'Contact',
  },
  EN: {
    back: 'Back',
    eyebrow: 'About',
    agency: 'Alliance Artificial Intelligence Agency',
    quote: 'IAAA+ is a mission-driven company dedicated to education and to designing architectures for the alliance between humans and artificial intelligences.',
    p1: 'Artificial intelligence does not replace human judgment. It can illuminate it, provided it is designed for that purpose.',
    p2: 'Situation Card is the first public expression of this question: a structured analysis system for complex situations, designed so that the decision always remains with the person facing the situation.',
    p3: 'It is not an answer machine. It is an instrument of clarity.',
    offers: 'See plans',
    atlas: 'Explore the Atlas',
    contact: 'Contact',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function AboutPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = readLang(searchParams?.lang)
  const copy = COPY[lang]
  const suffix = `?lang=${lang.toLowerCase()}`

  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/sis${suffix}`} style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/about?lang=fr" style={{ fontSize: '12px', color: lang === 'FR' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'FR' ? 600 : 400 }}>FR</Link>
          <Link href="/about?lang=en" style={{ fontSize: '12px', color: lang === 'EN' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'EN' ? 600 : 400 }}>EN</Link>
          <Link href={`/sis${suffix}`} style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>{copy.back}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 28px' }}>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
          {copy.eyebrow}
        </p>

        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '6px', lineHeight: 1.3 }}>
          IAAA+
        </h1>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#9A8860', letterSpacing: '0.08em', marginBottom: '48px' }}>
          {copy.agency}
        </p>

        <div style={{ fontSize: '15px', color: '#5A6A7A', lineHeight: 1.9 }}>
          <div style={{ borderLeft: '3px solid #C8951A', paddingLeft: '20px', marginBottom: '40px' }}>
            <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '21px', fontStyle: 'italic', color: '#1A2E5A', lineHeight: 1.6 }}>
              {copy.quote}
            </p>
          </div>

          <p style={{ marginBottom: '24px' }}>{copy.p1}</p>
          <p style={{ marginBottom: '24px' }}>{copy.p2}</p>
          <p style={{ marginBottom: '48px' }}>{copy.p3}</p>
        </div>

        <div style={{ borderTop: '1px solid #E8E0D0', paddingTop: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href={`/pricing${suffix}`} style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '2px' }}>{copy.offers}</Link>
          <Link href={`/library${suffix}`} style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '2px' }}>{copy.atlas}</Link>
          <Link href={`/contact${suffix}`} style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '2px' }}>{copy.contact}</Link>
        </div>
      </div>
    </main>
  )
}
