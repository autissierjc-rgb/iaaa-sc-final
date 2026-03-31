/**
 * IAAA · LibraryCard
 *
 * Preview card for the /library page.
 * Shows: title + main_vulnerability (the most distinctive IAAA field).
 * Links to /sc/[slug].
 *
 * view_count displayed as a secondary signal.
 * No Copy link here — user navigates to /sc/[slug] for that.
 */

import Link from 'next/link'
import type { LibraryCardPreview } from '@/lib/libraryApi'

interface LibraryCardProps {
  card: LibraryCardPreview
}

export default function LibraryCard({ card }: LibraryCardProps) {
  return (
    <Link
      href={`/sc/${card.slug}`}
      className="block rounded-[2px] px-5 py-5 transition-colors duration-150"
      style={{
        background: 'var(--bg-surface)',
        border:     '1px solid var(--border-gold-subtle)',
      }}
    >
      {/* Title */}
      <p
        className="mb-3 leading-snug"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize:   'clamp(0.95rem, 2vw, 1.1rem)',
          color:      'var(--text-primary)',
          fontWeight: 400,
          lineHeight: 1.25,
        }}
      >
        {card.title}
      </p>

      {/* Main vulnerability — the IAAA signature */}
      <div
        className="px-3 py-2.5 rounded-[1px] mb-4"
        style={{
          background:  'rgba(196,106,106,0.04)',
          borderLeft:  '1.5px solid rgba(196,106,106,0.3)',
        }}
      >
        <p
          className="text-[0.6rem] label-eyebrow mb-1"
          style={{ color: 'rgba(196,106,106,0.55)', fontSize: '0.55rem' }}
        >
          Main vulnerability
        </p>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize:   '0.88rem',
            color:      'rgba(196,106,106,0.75)',
            fontStyle:  'italic',
            fontWeight: 300,
            lineHeight: 1.45,
          }}
        >
          {card.main_vulnerability}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[0.62rem] font-mono" style={{ color: 'var(--text-muted)', opacity: 0.45 }}>
          {new Date(card.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
        {card.view_count > 0 && (
          <p className="text-[0.62rem] font-mono" style={{ color: 'var(--text-muted)', opacity: 0.35 }}>
            {card.view_count.toLocaleString()} views
          </p>
        )}
      </div>
    </Link>
  )
}
