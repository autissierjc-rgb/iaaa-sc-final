/**
 * IAAA · LibraryPreview
 *
 * Shows 3 static public card previews from landingData.
 * In Bloc 6, these will be replaced with real public cards from the API.
 * The ISR-powered /library page will cursor-paginate over 24 cards.
 *
 * No API calls here. Static data only.
 */

import Link from 'next/link'
import type { LibraryCardData } from '@/types/landing'

interface LibraryPreviewProps {
  cards: LibraryCardData[]
}

function LibraryCardThumb({ card }: { card: LibraryCardData }) {
  return (
    <Link
      href={`/sc/${card.slug}`}
      className="group block rounded-[2px] p-5 transition-all duration-200"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-gold-subtle)',
      }}
      aria-label={`Read card: ${card.title}`}
    >
      {/* Title */}
      <h3
        className="mb-2 group-hover:text-gold transition-colors duration-150"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.05rem',
          color: 'var(--text-primary)',
          fontWeight: 400,
          lineHeight: 1.25,
        }}
      >
        {card.title}
      </h3>

      {/* Objective */}
      <p
        className="text-xs font-sans leading-relaxed mb-4"
        style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
      >
        {card.objective}
      </p>

      {/* Footer: tags + view count */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.6rem] font-sans px-1.5 py-0.5 rounded-[1px] tracking-[0.06em] uppercase"
              style={{
                background: 'rgba(196,168,130,0.07)',
                color: 'var(--parchment-dim)',
                border: '1px solid rgba(196,168,130,0.12)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <span
          className="text-[0.62rem] font-mono shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {card.view_count.toLocaleString()} views
        </span>
      </div>
    </Link>
  )
}

export default function LibraryPreview({ cards }: LibraryPreviewProps) {
  return (
    <section className="py-20 px-5" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-content mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="label-eyebrow mb-3">Public Library</p>
            <h2
              className="heading-display"
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                color: 'var(--text-primary)',
                fontWeight: 400,
              }}
            >
              Recent Situation Cards
            </h2>
          </div>
          <Link
            href="/library"
            className="btn-ghost px-4 py-2 shrink-0 text-xs"
          >
            View all →
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <LibraryCardThumb key={card.slug} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
