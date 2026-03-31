'use client'

/**
 * IAAA · /dashboard — Bloc 6B
 *
 * Shows authenticated user + their saved Situation Cards.
 * Calls GET /api/auth/me + GET /api/cards on mount.
 */

import { useState, useEffect }  from 'react'
import { useRouter }             from 'next/navigation'
import Link                      from 'next/link'
import { getMe, logoutUser, type UserData } from '@/lib/authApi'
import { listMyCards, setCardVisibility, type SavedCard } from '@/lib/cardsApi'
import CopyLinkButton  from '@/components/card/CopyLinkButton'
import DashboardCard   from '@/components/card/DashboardCard'

export default function DashboardPage() {
  const router = useRouter()
  const [user,    setUser]    = useState<UserData | null>(null)
  const [cards,   setCards]   = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMe(), listMyCards()])
      .then(([u, list]) => { setUser(u); setCards(list.cards) })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    try { await logoutUser() } catch {}
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      <nav className="flex items-center justify-between px-5 md:px-10 py-5"
        style={{ borderBottom: '1px solid var(--border-gold-subtle)' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem',
          letterSpacing: '0.22em', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase' }}>
          IAAA
        </Link>
        <div className="flex items-center gap-5">
          <span className="text-xs font-sans hidden sm:block" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
            {user?.email}
          </span>
          <Link href="/generate" className="text-xs font-sans tracking-[0.06em] uppercase"
            style={{ color: 'var(--gold)' }}>
            New situation
          </Link>
          <button onClick={handleLogout} className="text-xs font-sans tracking-[0.06em] uppercase"
            style={{ color: 'var(--text-muted)' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col px-5 md:px-10 py-10 max-w-5xl w-full mx-auto">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="label-eyebrow mb-2" style={{ opacity: 0.4 }}>Dashboard</p>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              color: 'var(--text-primary)', fontWeight: 400 }}>
              My Situations
            </h1>
          </div>
          <p className="text-xs font-sans" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
            Tier: <span style={{ color: 'var(--gold)', textTransform: 'uppercase',
              fontSize: '0.65rem', letterSpacing: '0.1em' }}>{user?.tier}</span>
            {' · '}
            {cards.length} saved
          </p>
        </div>

        {cards.length === 0 ? (
          /* Empty state */
          <div className="rounded-[2px] px-6 py-12 flex flex-col items-center justify-center gap-4"
            style={{ border: '1px dashed var(--border-gold-subtle)', background: 'var(--bg-surface)' }}>
            <p className="label-eyebrow" style={{ opacity: 0.3 }}>No saved cards yet</p>
            <p className="text-sm font-sans text-center" style={{ color: 'var(--text-muted)', fontWeight: 300, maxWidth: '300px' }}>
              Analyse a situation and save the card to keep it here.
            </p>
            <Link href="/generate"
              className="mt-3 px-5 py-2.5 text-xs font-sans tracking-[0.06em] uppercase rounded-[1px]"
              style={{ background: 'var(--gold)', color: 'var(--bg-base)', fontWeight: 500 }}>
              Analyse a situation →
            </Link>
          </div>
        ) : (
          /* Card grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <DashboardCard
                key={card.id}
                card={card}
                tier={user?.tier ?? 'free'}
                onVisibilityChange={(slug, isPublic) => {
                  setCards(prev => prev.map(c => c.slug === slug ? { ...c, is_public: isPublic } : c))
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
