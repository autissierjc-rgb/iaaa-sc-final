/**
 * IAAA · Bloc 1 · Static landing data
 *
 * This file contains all static content for the landing page.
 * No API calls. No business logic.
 * Replace with real data in Bloc 6 (Library + public cards).
 */

import type { SituationCardPreviewData, LibraryCardData } from '@/types/landing'

// ── Example Situation Card ────────────────────────────────────────────────────
// Shown in Section B of landing. Represents the product output clearly.

export const EXAMPLE_CARD: SituationCardPreviewData = {
  title: 'Founding Team Conflict Before Series A',
  objective:
    'Decide whether to restructure roles or negotiate an exit before the funding round closes.',
  overview:
    'Two co-founders have diverging visions six months before a critical funding round. Technical execution is strong, but strategic alignment has broken down.',
  forces: [
    'Strong product traction — 40% MoM growth',
    'Investor interest formally confirmed',
    'Engineering team intact and motivated',
    'External deadline pressure from term sheet window',
  ],
  tensions: [
    'Founder A prioritises growth speed, Founder B prioritises unit economics',
    'Role boundaries were never formalised at incorporation',
    'Board expects unified front during due diligence',
  ],
  vulnerabilities: [
    'Round may collapse if investor detects internal conflict',
    'Key engineers are aligned with Founder B — risk of attrition',
    'No formal equity reclaim clause in shareholder agreement',
  ],
  main_vulnerability:
    'Round may collapse if investor detects internal conflict during due diligence.',
  trajectories: [
    'Structured role split with a binding side letter',
    'Negotiate voluntary exit with equity buyback at pre-A valuation',
    'Bring in an external COO to absorb operational tension',
  ],
  uncertainty: [
    'Investor reaction if conflict surfaces mid-process',
    "Founder B's actual exit conditions and timeline",
    'Whether role restructuring would hold under Series A pressure',
  ],
  reflection:
    'The real question is not who is right. It is whether both founders can subordinate their individual vision to the company\'s survival — and whether that commitment is mutual.',
}

// ── Landing Prompts ───────────────────────────────────────────────────────────
export const EXAMPLE_PROMPTS = [
  'Should I change jobs?',
  'Startup launch conflict',
  'Team burnout risk',
  'Relationship communication issue',
]

// ── Library Preview Cards ─────────────────────────────────────────────────────
// 3 static cards shown on the landing. Replaced by real public cards in Bloc 6.

export const LIBRARY_CARDS: LibraryCardData[] = [
  {
    slug: 'career-transition-after-40',
    title: 'Career Transition After 40',
    objective: 'Evaluate whether to leave a stable corporate role for an entrepreneurial path.',
    tags: ['career', 'identity', 'risk'],
    view_count: 847,
  },
  {
    slug: 'remote-team-restructuring',
    title: 'Remote Team Post-COVID Restructuring',
    objective: 'Decide on a return-to-office policy without losing top performers.',
    tags: ['team', 'leadership', 'change'],
    view_count: 1243,
  },
  {
    slug: 'family-business-succession',
    title: 'Family Business Succession Conflict',
    objective: 'Navigate generational handover while preserving family relationships.',
    tags: ['family', 'governance', 'transition'],
    view_count: 612,
  },
]

// ── Pricing Tiers ─────────────────────────────────────────────────────────────
export const PRICING_TIERS = [
  {
    id: 'clarity',
    name: 'Clarity',
    price: '€12',
    period: '/month',
    description: 'For personal reflection and decision-making.',
    features: [
      '5 Situation Cards per month',
      'Star Map exploration',
      'Personal reflection note',
      'Public card sharing',
    ],
    cta: 'Start with Clarity',
    href: '/register?tier=clarity',
    featured: false,
  },
  {
    id: 'sis',
    name: 'SIS',
    price: '€39',
    period: '/month',
    description: 'For professionals and analysts.',
    features: [
      'Unlimited Situation Cards',
      'Star Map exploration',
      'Personal reflection note',
      'Private cards',
      'PDF export',
    ],
    cta: 'Start with SIS',
    href: '/register?tier=sis',
    featured: true,
  },
  {
    id: 'plus',
    name: 'IAAA+',
    price: 'Contact',
    period: '',
    description: 'For governance teams and organisations.',
    features: [
      'Everything in SIS',
      'Custom onboarding',
      'Dedicated support',
      'Volume pricing',
    ],
    cta: 'Contact us',
    href: '/enterprise',
    featured: false,
  },
]
