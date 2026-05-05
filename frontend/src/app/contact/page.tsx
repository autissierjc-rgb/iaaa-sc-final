/**
 * IAAA · /contact
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact — Situation Card',
}

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    back: '← Retour',
    title: 'Contact',
    label: 'Adresse unique',
    note: 'Nous lisons chaque message et répondons sous quelques jours.',
  },
  EN: {
    back: '← Back',
    title: 'Contact',
    label: 'Single address',
    note: 'We read every message and reply within a few days.',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function ContactPage({
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
          <Link href="/contact?lang=fr" style={{ fontSize: '12px', color: lang === 'FR' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'FR' ? 600 : 400 }}>FR</Link>
          <Link href="/contact?lang=en" style={{ fontSize: '12px', color: lang === 'EN' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'EN' ? 600 : 400 }}>EN</Link>
          <Link href={`/sis${suffix}`} style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>{copy.back}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 28px' }}>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Contact
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '40px' }}>
          {copy.title}
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #E8E0D0' }}>
          <span style={{ fontSize: '13px', color: '#9A8860' }}>{copy.label}</span>
          <a href="mailto:contact@situationcard.com" style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>
            contact@situationcard.com
          </a>
        </div>

        <p style={{ marginTop: '40px', fontSize: '13px', color: '#9A8860', lineHeight: 1.7 }}>
          {copy.note}
        </p>
      </div>
    </main>
  )
}
