/**
 * IAAA · /pricing
 * Staging : Coming soon — prix masqués.
 * Production : remplacer par la grille tarifaire complète.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing — Situation Card',
  description: 'One platform. Three layers. From personal clarity to organisational governance.',
}

const TIERS = [
  {
    name: 'Clarity',
    tagline: 'Personal clarity',
    description:
      'For anyone navigating a complex situation — professional crossroads, relationship tension, difficult decisions. One card. One reading. One step forward.',
    forWho: 'Individuals',
    color: '#185FA5',
  },
  {
    name: 'SIS',
    tagline: 'Situation Intelligence',
    description:
      'For professionals, analysts, consultants, journalists and researchers who need to structure situations quickly, share readings with collaborators, and track how situations evolve over time.',
    forWho: 'Professionals & teams',
    color: '#C8951A',
    featured: true,
  },
  {
    name: 'IAAA+',
    tagline: 'Governance layer',
    description:
      'For organisations, institutions, and governance bodies that need a shared intelligence layer — collective readings, structured deliberation, and long-term situation tracking.',
    forWho: 'Organisations & institutions',
    color: '#1A2E5A',
  },
]

export default function PricingPage() {
  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <Link href="/" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 28px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Pricing
          </p>
          <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '12px' }}>
            One platform. Three layers.
          </h1>
          <p style={{ fontSize: '14px', color: '#7A6A5A', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            From personal reflection to professional analysis to organisational governance.
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {TIERS.map((tier) => (
            <div key={tier.name} style={{
              background: tier.featured ? '#1A2E5A' : '#fff',
              border: `1px solid ${tier.featured ? '#1A2E5A' : '#E8E0D0'}`,
              borderTop: `3px solid ${tier.color}`,
              borderRadius: '10px',
              padding: '28px 24px',
              position: 'relative',
            }}>
              {tier.featured && (
                <div style={{ position: 'absolute', top: '-1px', right: '20px', background: '#C8951A', color: '#fff', fontSize: '9px', letterSpacing: '0.12em', padding: '3px 10px', borderRadius: '0 0 5px 5px', fontFamily: 'var(--font-cinzel, serif)' }}>
                  MOST USED
                </div>
              )}
              <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: tier.featured ? '#E8C84A' : tier.color, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                {tier.name}
              </p>
              <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', color: tier.featured ? '#fff' : '#1A2E5A', fontStyle: 'italic', marginBottom: '16px' }}>
                {tier.tagline}
              </p>
              <p style={{ fontSize: '13px', color: tier.featured ? 'rgba(255,255,255,0.75)' : '#7A6A5A', lineHeight: 1.7, marginBottom: '20px' }}>
                {tier.description}
              </p>
              <p style={{ fontSize: '11px', color: tier.featured ? 'rgba(255,255,255,0.5)' : '#9A8860', marginBottom: '20px' }}>
                For: {tier.forWho}
              </p>

              {/* Coming soon badge */}
              <div style={{
                background: tier.featured ? 'rgba(255,255,255,0.1)' : '#F5F0E8',
                border: `1px solid ${tier.featured ? 'rgba(255,255,255,0.2)' : '#E8E0D0'}`,
                borderRadius: '6px',
                padding: '10px 14px',
                textAlign: 'center',
                fontSize: '11px',
                color: tier.featured ? 'rgba(255,255,255,0.6)' : '#9A8860',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-cinzel, serif)',
              }}>
                COMING SOON
              </div>
            </div>
          ))}
        </div>

        {/* Atlas mention */}
        <div style={{ background: '#fff', border: '1px solid #E8E0D0', borderRadius: '10px', padding: '24px 28px', textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#C8951A', letterSpacing: '0.15em', marginBottom: '8px' }}>ATLAS</p>
          <p style={{ fontSize: '13px', color: '#7A6A5A', lineHeight: 1.7 }}>
            The Atlas — our public collection of Situation Cards on geopolitical, social, and organisational situations — is free and open to all.
          </p>
          <Link href="/library" style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', color: '#185FA5', textDecoration: 'none' }}>
            Explore the Atlas →
          </Link>
        </div>

        {/* Contact */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9A8860', marginBottom: '8px' }}>
            Questions about pricing or custom plans?
          </p>
          <Link href="/contact" style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>
            Contact us
          </Link>
        </div>

      </div>
    </main>
  )
}
