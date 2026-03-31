'use client'

/**
 * IAAA · GenerateCardView
 *
 * Bridges GenerationResult (ephemeral) to SituationCard.
 * Manages the save → share flow:
 *
 *   before save: ShareButtons hidden
 *   after save:  ShareButtons visible with canonical /sc/[slug] URL
 *
 * Slug flow:
 *   GenerateActions.onSaved(slug)
 *   → GenerateCardView.onSaved(slug)  [forwarded]
 *   → generate/page.tsx setSavedSlug
 *   → GenerateCardView savedSlug prop
 *   → ShareButtons url
 *
 * Analysis fields (ephemeral — not in DB):
 *   insight, vulnerability_index, vulnerability_status,
 *   vulnerability_for, decision_dimensions.
 */

import { useState } from 'react'
import type { GenerationResult } from '@/types/generate'
import LecturePanel       from '@/components/card/LecturePanel'
import { BookOpen }       from 'lucide-react'
import SituationCard from './SituationCard'
import ShareButtons from './ShareButtons'
import { GenerateActions } from './CardActions'
import InvestigationPanel from '@/components/generate/InvestigationPanel'

interface Props {
  result:           GenerationResult
  savedSlug?:       string | null
  isAuthenticated?: boolean
  onSaved?:         (slug: string) => void
  onNewSituation:   () => void
  situationInput?:  string | null
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://iaaa.app'

export default function GenerateCardView({
result,
  savedSlug,
  isAuthenticated = false,
  onSaved,
  onNewSituation,
  situationInput = null,
}: Props) {
  const [showLecture, setShowLecture] = useState(false);

  const shareUrl = savedSlug ? `${APP_URL}/sc/${savedSlug}` : null

  const actions = (
    <div className="flex flex-col gap-4">

      {/* Share — visible only after save */}
      {shareUrl && (
        <ShareButtons
          url={shareUrl}
          title={result.card.title}
          insight={result.reframe}
        />
      )}

      {/* Collaborative — grayed out, Phase 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          disabled
          title="Coming soon — One situation. Several readings."
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '7px',
            background:    'transparent',
            border:        '1px solid var(--border-gold-subtle)',
            borderRadius:  '2px',
            padding:       '7px 14px',
            cursor:        'not-allowed',
            fontFamily:    'var(--font-cinzel)',
            fontSize:      '0.68rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            opacity:       0.4,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><circle cx="17" cy="11" r="3"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
          </svg>
          Collaborative
        </button>
        <span style={{
          fontFamily:    'var(--font-cinzel)',
          fontSize:      '0.52rem',
          color:         'var(--text-muted)',
          letterSpacing: '0.1em',
          opacity:       0.45,
          fontStyle:     'italic',
        }}>
          One situation. Several readings.
        </span>
      </div>

      {/* Lecture button — visible if lecture available */}
      {result.lecture && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={() => setShowLecture(v => !v)}
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '7px',
              background:    showLecture ? 'rgba(26,46,90,0.07)' : 'transparent',
              border:        '1px solid var(--border-gold)',
              borderRadius:  '2px',
              padding:       '7px 14px',
              cursor:        'pointer',
              fontFamily:    'var(--font-cinzel)',
              fontSize:      '0.68rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color:         'var(--navy)',
              transition:    'all 0.15s',
            }}
          >
            <BookOpen size={14} strokeWidth={1.5} />
            Lectures
          </button>
        </div>
      )}

      {/* Save + navigation actions */}
      <GenerateActions
        card={result.card}
        onNewSituation={onNewSituation}
        isAuthenticated={isAuthenticated}
        onSaved={onSaved}
        situationInput={situationInput}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <SituationCard
        card={result.card}
        insight={result.reframe}
        vulnerabilityIndex={result.vulnerability_index}
        vulnerabilityStatus={result.vulnerability_status}
        vulnerabilityFor={result.vulnerability_for}
        decisionDimensions={result.decision_dimensions}
        actions={actions}
      />

      {/* Lecture panel — ephemeral, only on /generate */}
      {result.lecture && showLecture && (
        <LecturePanel
          lecture={result.lecture}
          onClose={() => setShowLecture(false)}
        />
      )}

      {/* Investigation panel — ephemeral, only on /generate */}
      {result.investigation_mode && (
        <InvestigationPanel
          causalScenarios={result.causal_scenarios}
          verificationMatrix={result.verification_matrix}
          contextSources={result.context_sources}
        />
      )}
    </div>
  )
}