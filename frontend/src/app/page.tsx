export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import HeroSection from '@/components/landing/HeroSection'
import SituationCardPreview from '@/components/landing/SituationCardPreview'
import HowItWorks from '@/components/landing/HowItWorks'
import LibraryPreview from '@/components/landing/LibraryPreview'
import PricingPreview from '@/components/landing/PricingPreview'
import Footer from '@/components/landing/Footer'
import { EXAMPLE_CARD, LIBRARY_CARDS } from '@/data/landingData'

export const metadata: Metadata = {
  title: 'IAAA — Situation Intelligence Platform',
  description: 'Turn a complex situation into a clear Situation Card. Understand forces, tensions, and trajectories in seconds.',
}

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <SituationCardPreview card={EXAMPLE_CARD} />
      <HowItWorks />
      <LibraryPreview cards={LIBRARY_CARDS} />
      <PricingPreview />
      <Footer />
    </main>
  )
}
