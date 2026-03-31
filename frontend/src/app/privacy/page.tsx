/**
 * IAAA · /privacy
 * Politique de confidentialité — version minimale staging.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Situation Card',
}

const SECTIONS = [
  {
    title: 'Who we are',
    content: `Situation Card is a product developed by IAAA+, a French SAS (société par actions simplifiée) registered under SIREN 920 042 439, headquartered at 14 rue Jean Perrin, 17000 La Rochelle, France. We build tools for structured situation analysis. Our platform is hosted on OVH infrastructure in Europe.

Contact: privacy@situationcard.com`,
  },
  {
    title: 'What we collect',
    content: `When you use Situation Card, we collect:

— Account information: email address and password (hashed, never stored in plain text) when you register.
— Situation Cards you create: the text you submit, the card generated, and your intention if you add one. Cards marked private are visible only to you.
— Usage data: pages visited, cards generated, actions taken in the interface. This data is used solely to improve the platform.
— No advertising data is collected. We do not sell your data to third parties.`,
  },
  {
    title: 'How we use your data',
    content: `Your data is used to:

— Provide the Situation Card service.
— Save and display your cards in your personal library.
— Improve the platform (aggregated, anonymised usage analysis).
— Send you transactional emails (account confirmation, password reset). We do not send marketing emails without your explicit consent.`,
  },
  {
    title: 'Public cards and the Atlas',
    content: `If you choose to make a Situation Card public, it will appear in the Atlas and be accessible to anyone. You can change a card from public to private at any time from your library. The card will be removed from the Atlas immediately.

The situation you submitted to generate a public card is visible to Atlas readers.`,
  },
  {
    title: 'AI processing',
    content: `Your situation descriptions are processed by an AI language model to generate Situation Cards. This processing occurs at the time of generation. We use Anthropic (Claude) or OpenAI (GPT) models depending on your plan.

Your data is not used to train AI models. We do not share your inputs with third parties for any purpose other than generating your card.`,
  },
  {
    title: 'Data retention',
    content: `Your account data and cards are retained for as long as your account is active. If you delete your account, your data is permanently deleted within 30 days.

You can delete individual cards at any time from your library.`,
  },
  {
    title: 'Your rights',
    content: `Under GDPR, you have the right to:

— Access your personal data.
— Correct inaccurate data.
— Request deletion of your data.
— Export your data in a portable format.
— Withdraw consent at any time.

To exercise these rights, contact us at privacy@situationcard.com.`,
  },
  {
    title: 'Cookies',
    content: `We use a minimal set of cookies: one session cookie for authentication, and one preference cookie for language settings. We do not use advertising or tracking cookies. We do not use third-party analytics that track you across other websites.`,
  },
  {
    title: 'Contact',
    content: `For any privacy-related question: privacy@situationcard.com

This policy was last updated on 28 March 2026.`,
  },
]

export default function PrivacyPage() {
  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <Link href="/" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 28px' }}>

        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Legal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '8px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '12px', color: '#9A8860', marginBottom: '48px' }}>
          Last updated: 28 March 2026
        </p>

        {SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A2E5A', marginBottom: '10px', letterSpacing: '0.02em' }}>
              {section.title}
            </h2>
            <div style={{ fontSize: '14px', color: '#5A6A7A', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {section.content}
            </div>
            <div style={{ height: '1px', background: '#E8E0D0', marginTop: '28px' }} />
          </div>
        ))}

      </div>
    </main>
  )
}
