/**
 * IAAA · /contact
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact — Situation Card',
}

export default function ContactPage() {
  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <Link href="/" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 28px' }}>

        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Contact
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '40px' }}>
          Get in touch
        </h1>

        {[
          { label: 'General', email: 'hello@situationcard.com' },
          { label: 'Privacy & data', email: 'privacy@situationcard.com' },
          { label: 'Legal', email: 'legal@situationcard.com' },
          { label: 'Enterprise & partnerships', email: 'enterprise@situationcard.com' },
        ].map(({ label, email }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #E8E0D0' }}>
            <span style={{ fontSize: '13px', color: '#9A8860' }}>{label}</span>
            <a href={`mailto:${email}`} style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>
              {email}
            </a>
          </div>
        ))}

        <p style={{ marginTop: '40px', fontSize: '13px', color: '#9A8860', lineHeight: 1.7 }}>
          We are a small team. We read every message and respond within a few days.
        </p>

      </div>
    </main>
  )
}
