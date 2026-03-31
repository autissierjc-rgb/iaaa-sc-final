/**
 * IAAA · /sc/[slug] — Public Situation Card Page
 *
 * Server component — fetches card at request time.
 * Passes metadata (created_at, updated_at, is_public, view_count) to ScPageActions.
 * ScPageActions is a client component handling all interactive features.
 *
 * ISR: revalidate = 60s.
 * Ephemeral fields (insight, radar, analysis) are not displayed here — not persisted.
 */

import type { Metadata } from 'next'
import { notFound }       from 'next/navigation'
import SituationCard      from '@/components/card/SituationCard'
import ScPageActions      from '@/components/card/ScPageActions'
import SituationBlock    from '@/components/card/SituationBlock'
import Link               from 'next/link'
import { serverFetch }    from '@/lib/serverApi'

export const revalidate = 60

interface PageProps {
  params: { slug: string }
}

async function getPublicCard(slug: string) {
  try {
    const res = await serverFetch(`/api/cards/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Open Graph metadata ───────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = await getPublicCard(params.slug)
  if (!card) return { title: 'Card not found · IAAA' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://iaaa.app'
  const url    = `${appUrl}/sc/${card.slug}`
  const desc   = card.content.main_vulnerability
    ? `${card.content.objective} — ${card.content.main_vulnerability}`
    : card.content.objective

  return {
    title:      `${card.content.title} · IAAA`,
    description: desc,
    alternates: { canonical: url },
    robots:     { index: true, follow: true },
    openGraph:  { type: 'article', url, title: card.content.title, description: desc, siteName: 'IAAA — Situation Intelligence' },
    twitter:    { card: 'summary', title: card.content.title, description: desc },
  }
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────
function CardJsonLd({ card }: { card: any }) {
  if (!card) return null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://iaaa.app'
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context':    'https://schema.org',
          '@type':       'Article',
          headline:      card.content.title,
          description:   card.content.objective,
          datePublished: card.created_at,
          dateModified:  card.updated_at ?? card.created_at,
          url:           `${appUrl}/sc/${card.slug}`,
          publisher:     { '@type': 'Organization', name: 'IAAA', url: appUrl },
        }),
      }}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function SituationCardPage({ params }: PageProps) {
  const card = await getPublicCard(params.slug)
  if (!card || !card.is_public) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://iaaa.app'

  return (
    <>
      <CardJsonLd card={card} />
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

        {/* Nav */}
        <nav
          className="flex items-center justify-between px-5 md:px-10 py-5"
          style={{ borderBottom: '1px solid var(--border-gold-subtle)' }}
        >
          <Link
            href="/"
            style={{
              fontFamily:    'var(--font-cormorant)',
              fontSize:      '1rem',
              letterSpacing: '0.22em',
              color:         'var(--text-muted)',
              fontWeight:    400,
              textTransform: 'uppercase',
            }}
          >
            IAAA
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/generate"
              className="text-xs font-sans tracking-[0.08em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              New situation
            </Link>
            <Link
              href="/login"
              className="text-xs font-sans tracking-[0.08em] uppercase"
              style={{ color: 'var(--gold)' }}
            >
              Sign in
            </Link>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center px-3 sm:px-5 py-8 sm:py-10 md:py-14">
          <div className="w-full max-w-card flex flex-col gap-3">
            {/* Vraie question — visible dès l'entrée sur l'Atlas */}
            {card.situation_input && (
              <SituationBlock
                situationInput={card.situation_input}
                intentionRaw={card.intention_raw ?? null}
              />
            )}
            <SituationCard
              card={card.content}
              actions={
                <ScPageActions
                  slug={card.slug}
                  card={card.content}
                  isPublic={card.is_public}
                  isOwner={false}          // server component — auth check client-side in ScPageActions
                  createdAt={card.created_at}
                  updatedAt={card.updated_at ?? null}
                  viewCount={card.view_count}
                />
              }
            />
          </div>
        </main>
      </div>
    </>
  )
}
