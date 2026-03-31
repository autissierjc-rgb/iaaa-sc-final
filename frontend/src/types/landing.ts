/**
 * IAAA · Bloc 1 · Landing presentation types
 *
 * These types are for the landing page presentation layer only.
 * They are NOT the frozen product contracts from types/index.ts.
 *
 * The final SituationCard type (from types/index.ts) will be used
 * in Bloc 4 when the real card rendering component is built.
 */

// Simplified card data for SituationCardPreview (landing display only)
export interface SituationCardPreviewData {
  title: string
  objective: string
  overview: string
  forces: string[]
  tensions: string[]
  vulnerabilities: string[]
  main_vulnerability: string
  trajectories: string[]
  uncertainty: string[]
  reflection: string
}

// Library card thumbnail data
export interface LibraryCardData {
  slug: string
  title: string
  objective: string
  tags: string[]
  view_count: number
}

// Pricing tier display data
export interface PricingTierData {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  href: string
  featured: boolean
}
