'use client'
export const dynamic = 'force-dynamic'

/**
 * IAAA · /generate — Generation Page
 *
 * Bloc 2 — Frontend generation flow.
 *
 * State machine:
 *   idle     → input visible (+ reframe from previous run if any)
 *   loading  → API call to POST /api/generate + phase animation
 *   success  → reframe shown in input zone + GenerateCardView below
 *   error    → GenerationError with retry
 *
 * Reframe placement (per architecture decision):
 *   1. Above the card (in result view)
 *   2. In the input area after a result — shown above the example prompts
 *      as a "What's really going on" insight that persists when user
 *      wants to refine their situation.
 *
 * Bloc 3 contract:
 *   generateSituationCard() in lib/generateApi.ts calls /api/generate.
 *   The backend handler body changes in Bloc 3. This page does not change.
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { GeneratePageState, LoadingPhase } from '@/types/generate'
import GenerationInput from '@/components/generate/GenerationInput'
import GenerationLoader from '@/components/generate/GenerationLoader'
import GenerationError from '@/components/generate/GenerationError'
import SituationCard from '@/components/card/SituationCard'
import { GenerateActions } from '@/components/card/CardActions'
import GenerateCardView from '@/components/card/GenerateCardView'
import PromptChip from '@/components/ui/PromptChip'
import { generateSituationCard } from '@/lib/generateApi'
import DecisionLayer            from '@/components/generate/DecisionLayer'
import { getMe }               from '@/lib/authApi'
import { EXAMPLE_PROMPTS } from '@/data/landingData'

const INITIAL_STATE: GeneratePageState = {
  situation: '',
  status: 'idle',
  phase: null,
  result: null,
  error: null,
}

function GeneratePageInner() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<GeneratePageState>(() => ({
    ...INITIAL_STATE,
    situation: searchParams.get('q') ?? '',
  }))
  const [loadingLabel,     setLoadingLabel]     = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userTier,        setUserTier]        = useState<string>('free')
  const [savedSlug,       setSavedSlug]       = useState<string | null>(null)
  const [anonCount,       setAnonCount]       = useState(0)
  const [showSignupNudge, setShowSignupNudge] = useState(false)

  const ANON_LIMIT = 3

  // Phase lancement : limite fixe 10 000 chars (~5 pages copier-coller) pour tous
  const MAX_CHARS = 6000

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && state.status === 'idle' && !state.situation) {
      setState((prev) => ({ ...prev, situation: q }))
    }
  }, [searchParams])

  useEffect(() => {
    getMe().then((me: any) => {
      setIsAuthenticated(true)
      if (me?.tier) setUserTier(me.tier)
    }).catch(() => {})
    // Load anon count from localStorage
    const stored = parseInt(localStorage.getItem('sc_anon_count') ?? '0', 10)
    setAnonCount(stored)
  }, [])

  async function handleSubmit() {
    if (!state.situation.trim() || state.status === 'loading') return

    // Anonymous limit — 3 SC without account
    if (!isAuthenticated && anonCount >= ANON_LIMIT) {
      setShowSignupNudge(true)
      return
    }

    setState((prev) => ({
      ...prev,
      status: 'loading',
      phase: null,
      result: null,
      error: null,
    }))

    try {
      const result = await generateSituationCard(
        state.situation,
        (phase: LoadingPhase, label: string) => {
          setState((prev) => ({ ...prev, phase }))
          setLoadingLabel(label)
        }
      )
      setState((prev) => ({ ...prev, status: 'success', result, phase: null }))
      // Increment anon count if not authenticated
      if (!isAuthenticated) {
        const next = anonCount + 1
        setAnonCount(next)
        localStorage.setItem('sc_anon_count', String(next))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Generation failed.',
        phase: null,
      }))
    }
  }

  function handleNewSituation() {
    setState(INITIAL_STATE)
    setLoadingLabel('')
    setSavedSlug(null)
  }

  function handleRetry() {
    setState((prev) => ({ ...prev, status: 'idle', error: null, phase: null }))
  }

  function handlePromptSelect(text: string) {
    setState((prev) => ({ ...prev, situation: text }))
  }

  // After success: show the input zone again so user can refine — reframe visible
  const showInputZone = state.status === 'idle' || state.status === 'success'
  const showResult = state.status === 'success' && state.result !== null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* ── Signup nudge modal — anonymous limit reached ── */}
      {showSignupNudge && (
        <div
          onClick={() => setShowSignupNudge(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,46,90,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '12px', padding: '32px 28px', maxWidth: '400px', width: '100%', textAlign: 'center', fontFamily: 'var(--font-dm-sans, system-ui)' }}
          >
            <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>Clarity</p>
            <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '22px', color: '#1A2E5A', marginBottom: '10px', lineHeight: 1.3 }}>
              Vous avez utilisé vos 3 cartes gratuites.
            </p>
            <p style={{ fontSize: '13px', color: '#7A6A5A', lineHeight: 1.7, marginBottom: '24px' }}>
              Créez un compte gratuit pour continuer sans limite.
            </p>
            <a href="/register?tier=clarity" style={{ display: 'block', background: '#1A2E5A', color: '#fff', padding: '11px 20px', borderRadius: '7px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', marginBottom: '10px' }}>
              Créer un compte gratuit
            </a>
            <button onClick={() => setShowSignupNudge(false)} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#9A8860', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Anon counter bar ── */}
      {!isAuthenticated && anonCount > 0 && anonCount < ANON_LIMIT && (
        <div style={{ background: '#F5F0E8', borderBottom: '1px solid #E8E0D0', padding: '7px 20px', textAlign: 'center', fontSize: '12px', color: '#9A8860' }}>
          {ANON_LIMIT - anonCount} carte{ANON_LIMIT - anonCount > 1 ? 's' : ''} gratuite{ANON_LIMIT - anonCount > 1 ? 's' : ''} restante{ANON_LIMIT - anonCount > 1 ? 's' : ''} sans compte.{' '}
          <a href="/register?tier=clarity" style={{ color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>Créer un compte gratuit →</a>
        </div>
      )}

      {/* ── Nav V2 ──────────────────────────────────────────────── */}
      <nav
        className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 shrink-0"
        style={{ background: 'linear-gradient(135deg,#1A2E5A,#2A4A88)', borderBottom: '1px solid rgba(200,184,128,0.15)' }}
      >
        {/* Logo + name */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 48 48" style={{ animation: 'wheelDrift 26s ease-in-out infinite', transformOrigin: '50% 50%' }}>
            <defs><radialGradient id="ng-nav" cx="50%" cy="38%" r="62%"><stop offset="0%" stopColor="#2A4A88"/><stop offset="100%" stopColor="#1A2E5A"/></radialGradient></defs>
            <circle cx="24" cy="24" r="22.5" fill="none" stroke="#B8911A" strokeWidth="1.2" strokeDasharray="1.9,1.5"/>
            <circle cx="24" cy="24" r="21.5" fill="url(#ng-nav)"/>
            <line x1="24" y1="4.5" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="40" y1="8" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
            <line x1="43.5" y1="24" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="40" y1="40" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
            <line x1="24" y1="43.5" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="8" y1="40" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
            <line x1="4.5" y1="24" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="8" y1="8" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="3.5" fill="#D4A860" stroke="#A87830" strokeWidth="0.8"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <span style={{ fontFamily: 'var(--font-cinzel,serif)', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              powered by IAAA+
            </span>
            <span style={{ fontFamily: 'var(--font-cinzel,serif)', fontSize: '1rem', color: '#E8C84A', letterSpacing: '0.12em', fontWeight: 500 }}>
              SITUATION CARD
            </span>
          </div>
        </Link>
        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/dashboard"
            style={{ fontFamily: 'var(--font-cinzel,serif)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
            className="nav-label-hide"
          >
            Mes cartes
          </Link>
          <Link
            href="/login"
            style={{ fontFamily: 'var(--font-cinzel,serif)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            Connexion
          </Link>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-3 sm:px-5 py-8 sm:py-10 md:py-14 gap-6 sm:gap-8">

        {/* ── Input zone (idle + after success for refinement) ── */}
        {showInputZone && (
          <div className="w-full max-w-xl">

            {/* Page heading — only when no result yet */}
            {state.status === 'idle' && (
              <div className="mb-8 text-center">
                <p className="label-eyebrow mb-3" style={{ opacity: 0.5 }}>
                  New Situation
                </p>
                <h1
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                    color: 'var(--text-primary)',
                    fontWeight: 400,
                    lineHeight: 1.1,
                  }}
                >
                  What is your situation?
                </h1>
              </div>
            )}

            {/*
             * ── Reframe in input zone ──────────────────────────
             * Shown after a result, above the example prompts.
             * "What's really going on" — UI field, not in contract.
             * Helps user decide if they want to refine the situation.
             */}
            {state.status === 'success' && state.result?.reframe && (
              <div
                className="mb-5 px-4 py-3 rounded-[2px]"
                style={{
                  background: 'rgba(196,168,130,0.04)',
                  border: '1px solid var(--border-gold-subtle)',
                  borderLeft: '2px solid var(--gold)',
                }}
              >
                <p className="label-eyebrow mb-1.5" style={{ opacity: 0.45, fontSize: '0.58rem' }}>
                  What&rsquo;s really going on
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                  }}
                >
                  {state.result.reframe}
                </p>
              </div>
            )}

            {/* Input field */}
            <GenerationInput
              value={state.situation}
              onChange={(value) => setState((prev) => ({ ...prev, situation: value.slice(0, MAX_CHARS) }))}
                            onSubmit={handleSubmit}
              isLoading={false}
              label={state.status === 'success' ? 'Refine your situation' : undefined}
            />

            {/* Char counter */}
            <div style={{ textAlign: 'right', fontSize: '11px', marginTop: '4px',
              color: state.situation.length > MAX_CHARS * 0.9 ? '#C8951A' : 'var(--text-muted)' }}>
{state.situation.length}/{MAX_CHARS.toLocaleString()}
            </div>

            {/* Message copier-coller */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
              Copier-coller : 3 pages maximum — au-delà le signal se dilue.
            </p>

            {/* Example prompts — shown on idle only */}
            {state.status === 'idle' && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <PromptChip key={prompt} text={prompt} onSelect={handlePromptSelect} />
                ))}
              </div>
            )}

          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {state.status === 'loading' && (
          <div className="w-full max-w-xl">
            <GenerationLoader currentPhase={state.phase} currentLabel={loadingLabel} />
          </div>
        )}

        {/* ── Result ───────────────────────────────────────────── */}
        {showResult && state.result && (
          <div className="w-full max-w-card px-0">
            <GenerateCardView
              result={state.result}
              savedSlug={savedSlug}
              isAuthenticated={isAuthenticated}
              onSaved={setSavedSlug}
              onNewSituation={handleNewSituation}
            />
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {state.status === 'error' && (
          <div className="w-full max-w-xl">
            <GenerationError message={state.error ?? ''} onRetry={handleRetry} />
          </div>
        )}

      </main>
    </div>
  )
}


export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GeneratePageInner />
    </Suspense>
  )
}
