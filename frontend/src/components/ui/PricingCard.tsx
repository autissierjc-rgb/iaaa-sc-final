/**
 * IAAA · PricingCard
 *
 * Displays a single pricing tier.
 * No Stripe integration. No auth checks. Pure display.
 * Stripe wired in Bloc 6+.
 */

import Link from 'next/link'
import type { PricingTierData } from '@/types/landing'

interface PricingCardProps {
  tier: PricingTierData
}

export default function PricingCard({ tier }: PricingCardProps) {
  const { name, price, period, description, features, cta, href, featured } = tier

  return (
    <div
      className={`
        relative flex flex-col
        p-6 rounded-[2px]
        ${featured
          ? 'bg-ink-elevated border border-[rgba(196,168,130,0.28)]'
          : 'bg-ink-surface border border-[rgba(196,168,130,0.10)]'
        }
      `}
    >
      {featured && (
        <div className="absolute -top-px left-6 right-6 h-px bg-gold opacity-60" />
      )}

      {/* Tier name */}
      <div className="label-eyebrow mb-4">{name}</div>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span
          className="font-display text-4xl font-light text-parchment"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          {price}
        </span>
        {period && (
          <span className="text-xs text-parchment-dim font-sans">{period}</span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-parchment-muted mb-6 font-sans leading-relaxed">
        {description}
      </p>

      {/* Feature list */}
      <ul className="flex flex-col gap-2 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-xs font-sans text-parchment-dim">
            <span className="text-gold mt-0.5 shrink-0" style={{ fontSize: '0.55rem' }}>◆</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={href}
        className={`
          block text-center py-2.5 px-4
          text-xs font-sans font-medium
          tracking-[0.06em] uppercase
          rounded-[1px]
          transition-all duration-150
          ${featured
            ? 'btn-primary'
            : 'btn-ghost'
          }
        `}
      >
        {cta}
      </Link>
    </div>
  )
}
