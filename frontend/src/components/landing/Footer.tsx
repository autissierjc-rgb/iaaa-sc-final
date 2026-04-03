'use client'

/**
 * IAAA Â· Footer V2
 * Liens complets : produit + lÃ©gal + situationcard.com
 */

import Link from 'next/link'

const PRODUCT_LINKS = [
  { label: 'Atlas',       href: '/library'    },
  { label: 'Pricing',     href: '/pricing'    },
  { label: 'IAAA+',       href: '/enterprise' },
  { label: 'About',       href: '/about'      },
  { label: 'Contact',     href: '/contact'    },
]

const LEGAL_LINKS = [
  { label: 'Privacy',           href: '/privacy'    },
  { label: 'Terms',             href: '/terms'      },
  { label: 'Mentions lÃ©gales',  href: '/legal'      },
]

const linkStyle: React.CSSProperties = {
  fontSize:      '11px',
  color:         '#9A8860',
  textDecoration:'none',
  letterSpacing: '0.04em',
  transition:    'color 0.15s',
}

export default function Footer() {
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
          {PRODUCT_LINKS.map(({ label, href }) => (
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
          {LEGAL_LINKS.map(({ label, href }) => (
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

