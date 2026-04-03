'use client'

﻿'use client'

/**
 * IAAA Â· SituationCardPreview
 *
 * LANDING PRESENTATION COMPONENT â€” not the final product SituationCard.
 * The final card rendering belongs to Bloc 4.
 *
 * This component renders static example data to show the product output.
 * Props: SituationCardPreviewData
 * No interaction. No state. No API calls.
 *
 * Layout:
 * - Header: title + objective
 * - Row 1: Forces + Tensions (2 cols on desktop)
 * - Row 2: Vulnerabilities â€” highlighted as "center of the diamond"
 * - Row 3: Trajectories + Uncertainty (2 cols on desktop)
 * - Footer: Reflection
 */

import type { SituationCardPreviewData } from '@/types/landing'

interface SituationCardPreviewProps {
  card: SituationCardPreviewData
}

// â”€â”€ Section primitive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CardSection({
  label,
  items,
  accent,
}: {
  label: string
  items: string[]
  accent?: string
}) {
  return (
    <div>
      <p
        className="label-eyebrow mb-2.5"
        style={accent ? { color: accent } : undefined}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-xs font-sans leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              className="mr-2 opacity-50"
              style={{
                fontSize: '0.5rem',
                color: accent || 'var(--gold)',
                verticalAlign: 'middle',
              }}
              aria-hidden="true"
            >
              â—†
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SituationCardPreview({ card }: SituationCardPreviewProps) {
  return (
    <section className="py-20 px-5" style={{ background: 'var(--bg-base)' }}>
      {/* Section header */}
      <div className="max-w-prose mx-auto text-center mb-12">
        <p className="label-eyebrow mb-4">Example Output</p>
        <h2
          className="heading-display mb-3"
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            color: 'var(--text-primary)',
            fontWeight: 400,
          }}
        >
          A Situation Card
        </h2>
        <p
          className="text-sm font-sans"
          style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
        >
          One input. One structured view. Readable in 10 seconds.
        </p>
      </div>

      {/* Card */}
      <div
        className="max-w-card mx-auto rounded-[2px] overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-gold-medium)',
        }}
      >
        {/* Card header */}
        <div
          className="px-6 py-5"
          style={{
            borderBottom: '1px solid var(--border-gold-subtle)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3
              className="heading-display"
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {card.title}
            </h3>
            <span
              className="label-eyebrow shrink-0 mt-1"
              style={{ fontSize: '0.58rem', opacity: 0.5 }}
            >
              Situation Card
            </span>
          </div>
          <p
            className="text-sm font-sans italic"
            style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
          >
            {card.objective}
          </p>
        </div>

        {/* Card body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Row 1: Forces + Tensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSection label="Forces" items={card.forces} />
            <CardSection
              label="Tensions"
              items={card.tensions}
              accent="var(--tension)"
            />
          </div>

          {/* Row 2: Vulnerabilities â€” center of the diamond */}
          <div
            className="rounded-[1px] px-4 py-4"
            style={{
              background: 'rgba(196, 106, 106, 0.06)',
              border: '1px solid rgba(196, 106, 106, 0.18)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 pt-0.5">
                <p className="label-eyebrow" style={{ color: 'var(--vulnerability)' }}>
                  Vulnerabilities
                </p>
                <p
                  className="text-[0.6rem] font-sans mt-0.5 opacity-50 tracking-[0.08em]"
                  style={{ color: 'var(--vulnerability)' }}
                >
                  center of the diamond
                </p>
              </div>
            </div>

            {/* Main vulnerability callout */}
            <p
              className="text-sm font-sans italic mt-3 mb-3 leading-relaxed"
              style={{ color: 'var(--vulnerability)', fontWeight: 300 }}
            >
              &#8220;{card.main_vulnerability}&#8221;
            </p>

            <ul className="flex flex-col gap-1.5">
              {card.vulnerabilities.map((v, i) => (
                <li
                  key={i}
                  className="text-xs font-sans leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span
                    className="mr-2"
                    style={{ fontSize: '0.5rem', color: 'rgba(196,106,106,0.6)' }}
                    aria-hidden="true"
                  >
                    â—†
                  </span>
                  {v}
                </li>
              ))}
            </ul>
          </div>

          {/* Row 3: Trajectories + Uncertainty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSection
              label="Trajectories"
              items={card.trajectories}
              accent="rgba(106,158,196,0.8)"
            />
            <CardSection label="Uncertainty" items={card.uncertainty} />
          </div>

          {/* Reflection */}
          <div
            className="pt-4"
            style={{ borderTop: '1px solid var(--border-gold-subtle)' }}
          >
            <p className="label-eyebrow mb-2">Reflection</p>
            <p
              className="text-sm font-sans italic leading-relaxed"
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
        </div>
      </div>
    </section>
  )
}

