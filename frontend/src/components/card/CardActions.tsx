'use client'

/**
 * IAAA · CardActions — Bloc 6B
 *
 * GenerateActions — shown on /generate after generation.
 * Save behavior:
 *   - connected user  → POST /api/cards, redirect to /sc/[slug]
 *   - not connected   → invite to sign in (no redirect to login — non-blocking)
 *   - already saved   → show slug link
 *
 * PublicCardActions — shown on /sc/[slug].
 */

'use client'

import { useState }          from 'react'
import Link                  from 'next/link'
import type { SituationCard } from '@/types/index'
import { saveCard }          from '@/lib/cardsApi'
import CopyLinkButton        from './CopyLinkButton'
import { Star, Share2, PlusCircle } from 'lucide-react'

// ── Generate page actions ─────────────────────────────────────────────────────
interface GenerateActionsProps {
  card:             SituationCard
  onNewSituation:   () => void
  isAuthenticated?: boolean
  onSaved?:         (slug: string) => void
  situationInput?:  string | null   // original user question — passed to saveCard
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function GenerateActions({
  card,
  onNewSituation,
  isAuthenticated = false,
  onSaved,
  situationInput = null,
}: GenerateActionsProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'saved') return
    setSaveState('saving')
    setSaveError(null)

    try {
      const saved = await saveCard(card, false, situationInput)
      setSavedSlug(saved.slug)
      setSaveState('saved')
      onSaved?.(saved.slug)   // propagate slug to parent
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.')
      setSaveState('error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* New situation */}
        <button onClick={onNewSituation} className="btn-ghost px-4 py-2 text-xs focus-ring">
          New situation
        </button>

        {/* Save card */}
        {isAuthenticated ? (
          saveState === 'saved' && savedSlug ? (
            <Link
              href={`/sc/${savedSlug}`}
              className="text-xs font-sans px-4 py-2 rounded-[1px] transition-opacity duration-150"
              style={{ color: 'var(--bg-base)', background: 'var(--gold)', fontWeight: 500 }}
            >
              View saved card →
            </Link>
          ) : (
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="text-xs font-sans px-4 py-2 rounded-[1px] transition-opacity duration-150 disabled:opacity-40"
              style={{ color: 'var(--gold)', border: '1px solid var(--border-gold-subtle)' }}
            >
              {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Retry save' : 'Save card'}
            </button>
          )
        ) : (
          <Link
            href="/login"
            className="text-xs font-sans px-4 py-2 rounded-[1px] transition-opacity duration-150"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-gold-subtle)' }}
          >
            Sign in to save
          </Link>
        )}

        {/* Star Map — disabled until card is saved */}
        {saveState === 'saved' && savedSlug ? (
          <Link
            href={`/sc/${savedSlug}/map`}
            className="text-xs font-sans px-4 py-2 rounded-[1px]"
            style={{ color: 'var(--steel)', border: '1px solid rgba(74,127,165,0.2)' }}
          >
            Explore Star Map ✦
          </Link>
        ) : (
          <button
            disabled
            title="Save card first to explore Star Map"
            className="text-xs font-sans px-4 py-2 rounded-[1px] opacity-25 cursor-not-allowed"
            style={{ color: 'var(--steel)', border: '1px solid rgba(74,127,165,0.2)' }}
          >
            Explore Star Map ✦
          </button>
        )}
      </div>

      {/* Save error */}
      {saveState === 'error' && saveError && (
        <p className="text-xs font-sans" style={{ color: 'rgba(196,106,106,0.8)' }}>
          {saveError}
        </p>
      )}
    </div>
  )
}

// ── Public card page actions (/sc/[slug]) ─────────────────────────────────────
interface PublicCardActionsProps {
  slug: string
}

export function PublicCardActions({ slug }: PublicCardActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Link href="/generate" className="btn-ghost px-4 py-2 text-xs">
        Create your own →
      </Link>
      <CopyLinkButton slug={slug} isPublic={true} />
      <Link
        href={`/sc/${slug}/map`}
        className="text-xs font-sans px-4 py-2 rounded-[1px]"
        style={{ color: 'var(--steel)', border: '1px solid rgba(74,127,165,0.2)' }}
      >
        Explore Star Map ✦
      </Link>
    </div>
  )
}
