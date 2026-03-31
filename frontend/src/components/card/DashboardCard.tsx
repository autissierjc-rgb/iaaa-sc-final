'use client'

/**
 * IAAA · DashboardCard
 *
 * Card item in /dashboard — My Situations list.
 *
 * Shows:
 *   - card title + objective
 *   - created_at date
 *   - public/private badge
 *   - Copy link (public cards only)
 *   - visibility toggle (sis/plus tier only)
 */

import { useState }            from 'react'
import Link                    from 'next/link'
import CopyLinkButton          from '@/components/card/CopyLinkButton'
import { setCardVisibility, type SavedCard } from '@/lib/cardsApi'

const PRIVATE_TIERS = ['sis', 'plus']

interface DashboardCardProps {
  card:               SavedCard
  tier:               string
  onVisibilityChange: (slug: string, isPublic: boolean) => void
}

export default function DashboardCard({
  card,
  tier,
  onVisibilityChange,
}: DashboardCardProps) {
  const [toggling, setToggling] = useState(false)
  const canSetPrivate = PRIVATE_TIERS.includes(tier)

  async function handleToggleVisibility() {
    if (toggling) return
    setToggling(true)
    try {
      await setCardVisibility(card.slug, !card.is_public)
      onVisibilityChange(card.slug, !card.is_public)
    } catch (err) {
      // Silent fail — card state stays unchanged
      console.error('Visibility toggle failed:', err)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      className="rounded-[2px] px-5 py-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-gold-subtle)' }}
    >
      {/* Title + badge */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/sc/${card.slug}`}
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem',
            color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.2 }}
        >
          {card.content.title}
        </Link>
        <span
          className="label-eyebrow shrink-0"
          style={{
            opacity: 0.35, fontSize: '0.52rem',
            color: card.is_public ? 'var(--gold)' : 'var(--text-muted)',
          }}
        >
          {card.is_public ? 'public' : 'private'}
        </span>
      </div>

      {/* Objective */}
      <p
        className="text-xs font-sans leading-relaxed line-clamp-2"
        style={{ color: 'var(--text-muted)', fontWeight: 300 }}
      >
        {card.content.objective}
      </p>

      {/* Footer — date + actions */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-[0.62rem] font-mono" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          {new Date(card.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>

        <div className="flex items-center gap-2">
          {/* Copy link — public only */}
          <CopyLinkButton slug={card.slug} isPublic={card.is_public} />

          {/* Visibility toggle — sis/plus only */}
          {canSetPrivate && (
            <button
              onClick={handleToggleVisibility}
              disabled={toggling}
              className="text-[0.62rem] font-sans px-2 py-1 rounded-[1px] transition-opacity duration-150 disabled:opacity-40"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-gold-subtle)' }}
              title={card.is_public ? 'Make private' : 'Make public'}
            >
              {toggling ? '…' : card.is_public ? 'Make private' : 'Make public'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
