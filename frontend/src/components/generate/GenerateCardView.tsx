'use client'

/**
 * IAAA · GenerateCardView
 *
 * BLOC 2 PRESENTATION COMPONENT — not the final product SituationCard.
 * The final card rendering belongs to Bloc 4 (/sc/[slug] page).
 *
 * Displays:
 * 1. "What's really going on" reframe (UI field — NOT in JSON contract)
 * 2. Structured Situation Card content
 * 3. Post-result actions: New situation + placeholders for Save/Share/StarMap
 *
 * Props: result (GenerationResult), onNewSituation (callback)
 * No state. No API calls.
 */

import type { GenerationResult } from '@/types/generate'
import type { SituationCard } from '@/types/index'

// ── Section primitive ──────────────────────────────────────────────────────────
function CardField({
  label,
  items,
  accentColor,
}: {
  label: string
  items: string[]
  accentColor?: string
}) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <p
        className="label-eyebrow mb-2.5"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs font-sans leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: '0.5rem',
                color: accentColor || 'var(--gold)',
                marginTop: '0.25rem',
                flexShrink: 0,
                opacity: 0.6,
              }}
            >
              ◆
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Vulnerability block ────────────────────────────────────────────────────────
function VulnerabilityBlock({ card }: { card: SituationCard }) {
  return (
    <div
      className="rounded-[1px] px-4 py-4"
      style={{
        background: 'rgba(196,106,106,0.05)',
        border: '1px solid rgba(196,106,106,0.16)',
      }}
    >
      <p className="label-eyebrow mb-0.5" style={{ color: 'rgba(196,106,106,0.85)' }}>
        Vulnerabilities
      </p>
      <p
        className="text-[0.6rem] font-sans tracking-[0.08em] mb-3"
        style={{ color: 'rgba(196,106,106,0.5)', textTransform: 'uppercase' }}
      >
        center of the diamond
      </p>

      {/* Main vulnerability callout */}
      <p
        className="text-sm font-sans italic leading-relaxed mb-3"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1rem',
          color: 'rgba(196,106,106,0.75)',
          fontWeight: 300,
        }}
      >
        &#8220;{card.main_vulnerability}&#8221;
      </p>

      <ul className="flex flex-col gap-1.5">
        {card.vulnerabilities.map((v, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs font-sans leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              aria-hidden="true"
              style={{ fontSize: '0.5rem', color: 'rgba(196,106,106,0.5)', marginTop: '0.25rem', flexShrink: 0 }}
            >
              ◆
            </span>
            {v}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Post-result actions ────────────────────────────────────────────────────────
function ResultActions({ onNewSituation }: { onNewSituation: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 pt-5 mt-5"
      style={{ borderTop: '1px solid var(--border-gold-subtle)' }}
    >
      {/* New situation — functional */}
      <button
        onClick={onNewSituation}
        className="btn-ghost px-4 py-2 text-xs focus-ring"
      >
        New situation
      </button>

      {/* Save — placeholder until Bloc 6 */}
      <button
        disabled
        title="Available after sign-in — coming in a future update"
        className="text-xs font-sans px-4 py-2 rounded-[1px] opacity-30 cursor-not-allowed"
        style={{
          color: 'var(--gold)',
          border: '1px solid var(--border-gold-subtle)',
        }}
      >
        Save card
      </button>

      {/* Share — placeholder until Bloc 6 */}
      <button
        disabled
        title="Coming in a future update"
        className="text-xs font-sans px-4 py-2 rounded-[1px] opacity-30 cursor-not-allowed"
        style={{
          color: 'var(--gold)',
          border: '1px solid var(--border-gold-subtle)',
        }}
      >
        Share
      </button>

      {/* Star Map — placeholder until Bloc 5 */}
      <button
        disabled
        title="Star Map — coming in Bloc 5"
        className="text-xs font-sans px-4 py-2 rounded-[1px] opacity-30 cursor-not-allowed"
        style={{
          color: 'var(--steel)',
          border: '1px solid rgba(74,127,165,0.2)',
        }}
      >
        Explore Star Map ✦
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
interface GenerateCardViewProps {
  result: GenerationResult
  onNewSituation: () => void
}

export default function GenerateCardView({
  result,
  onNewSituation,
}: GenerateCardViewProps) {
  const { card, reframe } = result

  return (
    <div className="w-full max-w-card mx-auto">
      {/*
       * ── "What's really going on" reframe ──────────────────────────────────
       * UI field ONLY. Not part of the SituationCard JSON contract.
       * Lives above the card, visually separated.
       */}
      {reframe && (
        <div
          className="mb-6 px-5 py-4 rounded-[2px]"
          style={{
            background: 'rgba(196,168,130,0.05)',
            border: '1px solid var(--border-gold-subtle)',
            borderLeft: '2px solid var(--gold)',
          }}
        >
          <p className="label-eyebrow mb-2" style={{ opacity: 0.5 }}>
            What&rsquo;s really going on
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              fontWeight: 300,
              fontStyle: 'italic',
            }}
          >
            {reframe}
          </p>
        </div>
      )}

      {/* ── Situation Card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-[2px] overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-gold-medium)',
        }}
      >
        {/* Card header */}
        <div
          className="px-6 py-5"
          style={{
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-gold-subtle)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                color: 'var(--text-primary)',
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              {card.title}
            </h1>
            <span
              className="label-eyebrow shrink-0 mt-1 opacity-40"
              style={{ fontSize: '0.58rem' }}
            >
              Situation Card
            </span>
          </div>
          <p
            className="text-sm font-sans"
            style={{ color: 'var(--text-secondary)', fontWeight: 300, fontStyle: 'italic' }}
          >
            {card.objective}
          </p>
        </div>

        {/* Card body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Overview */}
          {card.overview && (
            <p
              className="text-sm font-sans leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
            >
              {card.overview}
            </p>
          )}

          <div
            className="h-px"
            style={{ background: 'var(--border-gold-subtle)' }}
          />

          {/* Row 1: Forces + Tensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CardField label="Forces" items={card.forces} />
            <CardField
              label="Tensions"
              items={card.tensions}
              accentColor="rgba(196,130,106,0.85)"
            />
          </div>

          {/* Row 2: Vulnerabilities — center of the diamond */}
          <VulnerabilityBlock card={card} />

          {/* Row 3: Trajectories + Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CardField
              label="Trajectories"
              items={card.trajectories}
              accentColor="rgba(106,158,196,0.85)"
            />
            <CardField label="Constraints" items={card.constraints} />
          </div>

          {/* Uncertainty */}
          <CardField label="Uncertainty" items={card.uncertainty} />

          {/* Reflection */}
          {card.reflection && (
            <div
              className="pt-4"
              style={{ borderTop: '1px solid var(--border-gold-subtle)' }}
            >
              <p className="label-eyebrow mb-2">Reflection</p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                }}
              >
                {card.reflection}
              </p>
            </div>
          )}

          {/* Actions */}
          <ResultActions onNewSituation={onNewSituation} />
        </div>
      </div>
    </div>
  )
}
