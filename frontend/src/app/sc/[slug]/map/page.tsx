'use client'

/**
 * IAAA · /sc/[slug]/map — Star Map page
 *
 * Bloc 5. Replaces the stub.
 *
 * State:
 *   activeDimension  — which branch is selected (null = none)
 *   exploration      — StarMapExploration result from /api/explore
 *   isLoading        — API call in flight
 *   error            — error message
 *
 * Flow:
 *   user clicks branch
 *   → POST /api/explore { dimension, card }
 *   → exploration panel replaces previous (one at a time)
 *
 * Bloc 6+: replace getCardBySlug() with real DB fetch.
 *          Replace _mock_explore in backend only.
 *          This page does not change.
 */

'use client'

import { useState }    from 'react'
import Link            from 'next/link'
import { useParams }   from 'next/navigation'
import type { StarMapDimension, StarMapExploration, SituationCard } from '@/types/index'
import StarMap               from '@/components/starmap/StarMap'
import StarMapExplorationPanel from '@/components/starmap/StarMapExploration'
import { exploreStarMapBranch } from '@/lib/exploreApi'

// ── Static mock card — Bloc 6 replaces with DB fetch ─────────────────────────
const MOCK_CARD: SituationCard = {
  title:           'Career Crossroads: Security vs. Alignment',
  objective:       'Decide whether to leave a stable role for a more meaningful direction.',
  overview:        'A professional with strong credentials faces growing misalignment between daily work and sense of purpose.',
  forces:          ['Financial stability', 'Established reputation', 'Genuine interest in new direction'],
  tensions:        ['Security vs. meaning', 'Fear of regret either way'],
  vulnerabilities: ['No financial runway if transition takes longer than expected', 'Decision made under fatigue'],
  main_vulnerability: 'Decision being made under emotional fatigue, not clarity.',
  trajectories:    ['Stay and build in parallel', 'Phased reduction', 'Leave fully with 18-month horizon'],
  constraints:     ['Financial floor obligation', 'Time is not neutral'],
  uncertainty:     ['Whether new direction has market demand', 'How long transition takes'],
  reflection:      'The question is not whether to leave — it is whether you have clarity about what you are moving toward.',
}

export default function StarMapPage() {
  const params = useParams()
  const slug   = typeof params.slug === 'string' ? params.slug : ''

  const [activeDimension, setActiveDimension] = useState<StarMapDimension | null>(null)
  const [exploration,     setExploration]     = useState<StarMapExploration | null>(null)
  const [isLoading,       setIsLoading]       = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  async function handleBranchSelect(dim: StarMapDimension) {
    // Same branch clicked again → deselect
    if (dim === activeDimension) {
      setActiveDimension(null)
      setExploration(null)
      setError(null)
      return
    }

    setActiveDimension(dim)
    setExploration(null)
    setError(null)
    setIsLoading(true)

    try {
      const result = await exploreStarMapBranch({ dimension: dim, card: MOCK_CARD })
      setExploration(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Exploration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    setActiveDimension(null)
    setExploration(null)
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Nav */}
      <nav
        className="flex items-center justify-between px-5 md:px-10 py-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-gold-subtle)' }}
      >
        <Link
          href="/"
          className="font-display text-base tracking-[0.22em] uppercase"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--text-muted)', fontWeight: 400 }}
        >
          IAAA
        </Link>
        <Link
          href={`/sc/${slug}`}
          className="text-xs font-sans tracking-[0.08em] uppercase transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Situation Card
        </Link>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-5 py-10 md:py-14 gap-8">
        <div className="w-full max-w-card">

          {/* Card title reference */}
          <div className="text-center mb-8">
            <p className="label-eyebrow mb-2" style={{ opacity: 0.4 }}>Exploring</p>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize:   'clamp(1rem, 2.5vw, 1.4rem)',
                color:      'var(--text-primary)',
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              {MOCK_CARD.title}
            </p>
          </div>

          {/* Star Map SVG */}
          <StarMap
            card={MOCK_CARD}
            activeDimension={activeDimension}
            onBranchSelect={handleBranchSelect}
          />

          {/* Exploration panel — below, scroll natural */}
          {(activeDimension || isLoading) && (
            <div className="mt-8">
              <StarMapExplorationPanel
                exploration={exploration}
                isLoading={isLoading}
                error={error}
                onClose={handleClose}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
