'use client'

/**
 * IAAA · LibraryClientShell
 *
 * Client-side shell for /library.
 * Receives the first page from the server (ISR) — no client fetch on first load.
 * Handles Load more via client-side fetch with cursor.
 *
 * This separation keeps the library page SEO-friendly (first page server-rendered)
 * while Load more is purely client-side (no new ISR pages to manage).
 */

import { useState } from 'react'
import LibraryCard  from './LibraryCard'
import { getLibrary, type LibraryResponse, type LibraryCardPreview } from '@/lib/libraryApi'

interface LibraryClientShellProps {
  initial: LibraryResponse
}

export default function LibraryClientShell({ initial }: LibraryClientShellProps) {
  const [cards,      setCards]      = useState<LibraryCardPreview[]>(initial.cards)
  const [nextCursor, setNextCursor] = useState<string | null>(initial.next_cursor)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleLoadMore() {
    if (!nextCursor || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await getLibrary(nextCursor)
      setCards((prev) => [...prev, ...res.cards])
      setNextCursor(res.next_cursor)
    } catch (err) {
      setError('Could not load more cards. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="label-eyebrow" style={{ opacity: 0.3 }}>No public cards yet</p>
        <p className="text-sm font-sans text-center"
          style={{ color: 'var(--text-muted)', fontWeight: 300, maxWidth: '280px' }}>
          Be the first to generate and share a Situation Card.
        </p>
        <a
          href="/generate"
          className="mt-3 px-5 py-2.5 text-xs font-sans tracking-[0.06em] uppercase rounded-[1px]"
          style={{ background: 'var(--gold)', color: 'var(--bg-base)', fontWeight: 500 }}
        >
          Analyse a situation →
        </a>
      </div>
    )
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <LibraryCard key={card.slug} card={card} />
        ))}
      </div>

      {/* Load more */}
      <div className="mt-10 flex flex-col items-center gap-3">
        {error && (
          <p className="text-xs font-sans" style={{ color: 'rgba(196,106,106,0.8)' }}>
            {error}
          </p>
        )}

        {nextCursor ? (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2.5 text-xs font-sans tracking-[0.08em] uppercase rounded-[1px]
              transition-opacity duration-150 disabled:opacity-40"
            style={{ color: 'var(--gold)', border: '1px solid var(--border-gold-subtle)' }}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          cards.length > 0 && (
            <p className="text-[0.65rem] font-mono" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
              {cards.length} card{cards.length !== 1 ? 's' : ''} · end of library
            </p>
          )
        )}
      </div>
    </>
  )
}
