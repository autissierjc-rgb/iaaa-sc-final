'use client'

/**
 * IAAA · Footer V2
 * Liens complets : produit + légal + situationcard.com
 */

import Link from 'next/link'

type FooterLang = 'FR' | 'EN'

const FOOTER_LINKS = {
  FR: {
    product: [
      { label: 'Atlas', href: '/library?lang=fr' },
      { label: 'Offres', href: '/pricing?lang=fr' },
      { label: 'IAAA+', href: '/enterprise?lang=fr' },
      { label: 'À propos', href: '/about?lang=fr' },
      { label: 'Contact', href: '/contact?lang=fr' },
    ],
    legal: [{ label: 'Confidentialité', href: '/privacy?lang=fr' }],
  },
  EN: {
    product: [
      { label: 'Atlas', href: '/library?lang=en' },
      { label: 'Plans', href: '/pricing?lang=en' },
      { label: 'IAAA+', href: '/enterprise?lang=en' },
      { label: 'About', href: '/about?lang=en' },
      { label: 'Contact', href: '/contact?lang=en' },
    ],
    legal: [{ label: 'Privacy', href: '/privacy?lang=en' }],
  },
} as const

const linkStyle: React.CSSProperties = {
  fontSize:      '11px',
  color:         '#9A8860',
  textDecoration:'none',
  letterSpacing: '0.04em',
  transition:    'color 0.15s',
}

export default function Footer({ lang = 'FR' }: { lang?: FooterLang }) {
  const links = FOOTER_LINKS[lang]

  return (
    <footer style={{
      background:   '#fff',
      borderTop:    '1px solid #E8E0D0',
      padding:      '28px 28px',
      fontFamily:   'var(--font-dm-sans, system-ui, sans-serif)',
    }}>
      <div style={{
        maxWidth:       '1100px',
        margin:         '0 auto',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            '16px',
      }}>

        {/* Brand */}
        <Link href="/" style={{
          fontFamily:    'var(--font-cinzel, serif)',
          fontSize:      '12px',
          color:         '#1A2E5A',
          textDecoration:'none',
          letterSpacing: '0.12em',
          flexShrink:    0,
        }}>
          SITUATION CARD
        </Link>

        {/* Product links */}
        <nav style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          {links.product.map(({ label, href }) => (
            <Link key={href} href={href} style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = '#5A6A8A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9A8860')}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Legal + domain */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {links.legal.map(({ label, href }) => (
            <Link key={href} href={href} style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = '#5A6A8A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9A8860')}
            >
              {label}
            </Link>
          ))}
          <span style={{ ...linkStyle, color: '#C8B880' }}>
            situationcard.com
          </span>
        </div>

      </div>
    </footer>
  )
}

