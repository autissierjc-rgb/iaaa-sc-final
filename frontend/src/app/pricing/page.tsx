/**
 * IAAA · /pricing
 * Staging : Coming soon — prix masqués.
 * Production : remplacer par la grille tarifaire complète.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Offres — Situation Card',
  description: 'Une plateforme. Trois niveaux de lecture, de la clarté personnelle à la gouvernance collective.',
}

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    back: '← Retour',
    eyebrow: 'Offres',
    title: 'Une plateforme. Trois niveaux.',
    intro: 'De la clarté personnelle à l’analyse professionnelle, puis à la gouvernance collective.',
    forLabel: 'Pour :',
    soon: 'BIENTÔT DISPONIBLE',
    atlas:
      'L’Atlas — notre collection publique de Situation Cards sur des situations géopolitiques, sociales et organisationnelles — est librement accessible.',
    atlasLink: 'Explorer l’Atlas →',
    contactQuestion: 'Une question sur les offres ou un besoin spécifique ?',
    contactLink: 'Nous contacter',
  },
  EN: {
    back: '← Back',
    eyebrow: 'Plans',
    title: 'One platform. Three layers.',
    intro: 'From personal clarity to professional analysis, then collective governance.',
    forLabel: 'For:',
    soon: 'COMING SOON',
    atlas:
      'The Atlas — our public collection of Situation Cards on geopolitical, social, and organisational situations — is open to everyone.',
    atlasLink: 'Explore the Atlas →',
    contactQuestion: 'Questions about plans or a custom need?',
    contactLink: 'Contact us',
  },
} as const

const TIERS = [
  {
    name: 'Clarity',
    tagline: {
      FR: 'Clarté personnelle',
      EN: 'Personal clarity',
    },
    description: {
      FR: 'Pour clarifier une situation personnelle, relationnelle ou professionnelle difficile. Une carte, une lecture, un prochain mouvement plus lisible.',
      EN: 'For clarifying a difficult personal, relational, or professional situation. One card, one reading, one clearer next move.',
    },
    forWho: {
      FR: 'Particuliers',
      EN: 'Individuals',
    },
    color: '#185FA5',
  },
  {
    name: 'SIS',
    tagline: {
      FR: 'Collectif Pro · Situation Intelligence System',
      EN: 'Pro Collective · Situation Intelligence System',
    },
    description: {
      FR: 'Pour les professionnels, analystes, consultants, journalistes, chercheurs et équipes qui doivent structurer vite une situation, partager une lecture et suivre son évolution.',
      EN: 'For professionals, analysts, consultants, journalists, researchers, and teams who need to structure a situation quickly, share a reading, and track how it evolves.',
    },
    forWho: {
      FR: 'Collectif Pro',
      EN: 'Professionals and teams',
    },
    color: '#C8951A',
  },
  {
    name: 'IAAA+',
    tagline: {
      FR: 'Couche de gouvernance',
      EN: 'Governance layer',
    },
    description: {
      FR: 'Pour les organisations, institutions et instances de gouvernance qui ont besoin d’une lecture partagée, de délibérations structurées et d’un suivi dans le temps.',
      EN: 'For organisations, institutions, and governance bodies that need shared reading, structured deliberation, and long-term tracking.',
    },
    forWho: {
      FR: 'Organisations et institutions',
      EN: 'Organisations and institutions',
    },
    color: '#1A2E5A',
  },
] as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function PricingPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = readLang(searchParams?.lang)
  const copy = COPY[lang]

  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href={`/?lang=${lang.toLowerCase()}`} style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/pricing?lang=fr" style={{ fontSize: '12px', color: lang === 'FR' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'FR' ? 600 : 400 }}>FR</Link>
          <Link href="/pricing?lang=en" style={{ fontSize: '12px', color: lang === 'EN' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'EN' ? 600 : 400 }}>EN</Link>
          <Link href={`/?lang=${lang.toLowerCase()}`} style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>{copy.back}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 28px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {copy.eyebrow}
          </p>
          <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '12px' }}>
            {copy.title}
          </h1>
          <p style={{ fontSize: '14px', color: '#7A6A5A', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            {copy.intro}
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {TIERS.map((tier) => (
            <div key={tier.name} style={{
              background: '#fff',
              border: '1px solid #E1D6C2',
              borderTop: `3px solid ${tier.color}`,
              borderRadius: '10px',
              padding: '28px 24px',
              position: 'relative',
              boxShadow: '0 12px 30px rgba(26,46,90,0.06)',
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <p style={{
                fontFamily: 'var(--font-cinzel, serif)',
                fontSize: '20px',
                color: tier.color,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                fontWeight: 700,
                lineHeight: 1,
              }}>
                {tier.name}
              </p>
              <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '19px', color: '#1A2E5A', fontStyle: 'italic', marginBottom: '16px', minHeight: '46px', lineHeight: 1.2 }}>
                {tier.tagline[lang]}
              </p>
              <p style={{ fontSize: '13px', color: '#6F6255', lineHeight: 1.7, marginBottom: '20px', minHeight: '116px' }}>
                {tier.description[lang]}
              </p>
              <p style={{ fontSize: '11px', color: '#9A8860', marginBottom: '20px', minHeight: '28px' }}>
                {copy.forLabel} {tier.forWho[lang]}
              </p>

              {/* Coming soon badge */}
              <div style={{
                background: '#F5F0E8',
                border: '1px solid #E1D6C2',
                borderRadius: '6px',
                padding: '10px 14px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#9A8860',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-cinzel, serif)',
                marginTop: 'auto',
              }}>
                {copy.soon}
              </div>
            </div>
          ))}
        </div>

        {/* Atlas mention */}
        <div style={{ background: '#fff', border: '1px solid #E8E0D0', borderRadius: '10px', padding: '24px 28px', textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#C8951A', letterSpacing: '0.15em', marginBottom: '8px' }}>ATLAS</p>
          <p style={{ fontSize: '13px', color: '#7A6A5A', lineHeight: 1.7 }}>
            {copy.atlas}
          </p>
          <Link href={`/library?lang=${lang.toLowerCase()}`} style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', color: '#185FA5', textDecoration: 'none' }}>
            {copy.atlasLink}
          </Link>
        </div>

        {/* Contact */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9A8860', marginBottom: '8px' }}>
            {copy.contactQuestion}
          </p>
          <Link href={`/contact?lang=${lang.toLowerCase()}`} style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>
            {copy.contactLink}
          </Link>
        </div>

      </div>
    </main>
  )
}
