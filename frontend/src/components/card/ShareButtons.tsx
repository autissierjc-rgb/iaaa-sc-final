'use client'

/**
 * IAAA · ShareButtons V2
 *
 * Partage d'une Situation Card sur :
 *   LinkedIn, X, WhatsApp, Telegram, Facebook, Copy link
 *
 * Pas d'SDK externe — URL schemes natifs uniquement.
 * S'active après sauvegarde de la carte (shareUrl non null).
 */

import { useState } from 'react'

interface Props {
  url:      string
  title:    string
  insight?: string
}

export default function ShareButtons({ url, title, insight }: Props) {
  const [copied, setCopied] = useState(false)

  const shareText = insight
    ? `${title} — ${insight}`
    : title

  const enc  = encodeURIComponent
  const NETWORKS = [
    {
      label: 'LinkedIn',
      href:  `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      color: '#0A66C2',
    },
    {
      label: 'X',
      href:  `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(shareText)}`,
      color: '#000',
    },
    {
      label: 'WhatsApp',
      href:  `https://wa.me/?text=${enc(shareText + ' — ' + url)}`,
      color: '#25D366',
    },
    {
      label: 'Telegram',
      href:  `https://t.me/share/url?url=${enc(url)}&text=${enc(shareText)}`,
      color: '#2AABEE',
    },
    {
      label: 'Facebook',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      color: '#1877F2',
    },
  ]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btnStyle: React.CSSProperties = {
    fontSize:       '0.62rem',
    letterSpacing:  '0.1em',
    color:          'var(--text-muted)',
    border:         '1px solid var(--border-gold-subtle)',
    borderRadius:   '2px',
    padding:        '0.35rem 0.75rem',
    background:     'transparent',
    cursor:         'pointer',
    transition:     'color 0.15s, border-color 0.15s',
    textDecoration: 'none',
    display:        'inline-flex',
    alignItems:     'center',
    fontFamily:     'var(--font-geist-mono, monospace)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        Partager
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>

        {/* Copy link */}
        <button
          onClick={handleCopy}
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-gold-medium)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)';   e.currentTarget.style.borderColor = 'var(--border-gold-subtle)' }}
        >
          {copied ? '✓ Copié' : '⬡ Lien'}
        </button>

        {/* Social networks */}
        {NETWORKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-gold-medium)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)';   e.currentTarget.style.borderColor = 'var(--border-gold-subtle)' }}
          >
            {label}
          </a>
        ))}

      </div>
    </div>
  )
}
