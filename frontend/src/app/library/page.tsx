/**
 * IAAA · /library — Public Card Library
 *
 * Bloc 8.
 *
 * Strategy: hybrid RSC + client-side Load more.
 *   - First page fetched server-side (ISR, revalidate 60s) → fast first paint, SEO
 *   - Load more fetched client-side → no new pages to revalidate
 *
 * view_count NOT incremented here.
 * Cards link to /sc/[slug] where view_count increments.
 *
 * Sort: newest first (chronological).
 * No algorithmic ranking in V1.
 */

import type { Metadata } from 'next'
import LibraryClientShell from '@/components/library/LibraryClientShell'
import { serverFetch }    from '@/lib/serverApi'
import type { LibraryResponse } from '@/lib/libraryApi'
import Link from 'next/link'

export const revalidate = 60

export const metadata: Metadata = {
  title:       'Library · IAAA',
  description: 'Browse public Situation Cards — structured analyses of real decisions and tensions.',
  alternates:  { canonical: 'https://iaaa.app/library' },
  robots:      { index: true, follow: true },
  openGraph: {
    type:        'website',
    url:         'https://iaaa.app/library',
    title:       'Library · IAAA',
    description: 'Structured situation analyses — discover how others are thinking through their decisions.',
    siteName:    'IAAA',
  },
}

// ── Server-side first page ────────────────────────────────────────────────────
async function getFirstPage(): Promise<LibraryResponse> {
  try {
    const res = await serverFetch('/api/library', { next: { revalidate: 60 } })
    if (!res.ok) return { cards: [], next_cursor: null }
    return res.json()
  } catch {
    return { cards: [], next_cursor: null }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LibraryPage() {
  const initial = await getFirstPage()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Nav */}
      <nav
        className="flex items-center justify-between px-5 md:px-10 py-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-gold-subtle)' }}
      >
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem',
          letterSpacing: '0.22em', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase' }}>
          IAAA
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/generate"
            className="text-xs font-sans tracking-[0.08em] uppercase"
            style={{ color: 'var(--gold)' }}>
            New situation
          </Link>
          <Link href="/login"
            className="text-xs font-sans tracking-[0.08em] uppercase"
            style={{ color: 'var(--text-muted)' }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="px-5 md:px-10 py-10 max-w-5xl w-full mx-auto">
        <p className="label-eyebrow mb-3" style={{ opacity: 0.4 }}>Public Library</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.1 }}>
          Situation Cards
        </h1>
        <p className="mt-3 text-sm font-sans" style={{ color: 'var(--text-muted)', fontWeight: 300, maxWidth: '460px' }}>
          Structured analyses of real decisions and tensions. Public cards shared by IAAA users.
        </p>
      </header>

      {/* Card grid — client shell handles Load more */}
      <main className="flex-1 px-5 md:px-10 pb-16 max-w-5xl w-full mx-auto">
        <LibraryClientShell initial={initial} />
      </main>

    </div>
  )
}
