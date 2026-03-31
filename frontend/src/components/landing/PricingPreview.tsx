/**
 * IAAA · PricingPreview
 *
 * Renders 3 pricing tiers on the landing page.
 * Stripe and checkout are NOT wired here — belongs to Bloc 6+.
 * CTAs are simple links to /register?tier=X or /enterprise.
 */

import PricingCard from '@/components/ui/PricingCard'
import { PRICING_TIERS } from '@/data/landingData'
import Link from 'next/link'

export default function PricingPreview() {
  return (
    <section
      className="py-20 px-5"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="max-w-content mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="label-eyebrow mb-4">Pricing</p>
          <h2
            className="heading-display mb-3"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              color: 'var(--text-primary)',
              fontWeight: 400,
            }}
          >
            One platform. Three layers.
          </h2>
          <p
            className="text-sm font-sans max-w-sm mx-auto"
            style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
          >
            From personal reflection to professional analysis to organisational governance.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* Link to full pricing page */}
        <div className="text-center">
          <Link
            href="/pricing"
            className="text-xs font-sans tracking-[0.08em] uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            See full feature comparison →
          </Link>
        </div>
      </div>
    </section>
  )
}
