import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, DM_Mono, Cinzel } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cinzel',
  display: 'swap',
})

import type { Viewport } from 'next'

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       5,
  viewportFit:        'cover',  // safe area for notched phones
  themeColor:         '#07070A',
}

export const metadata: Metadata = {
  title: {
    default: 'IAAA — Situation Intelligence Platform',
    template: '%s · IAAA',
  },
  description:
    'Turn a complex situation into a clear Situation Card. Understand forces, tensions, and trajectories in seconds.',
  metadataBase: new URL('https://iaaa.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://iaaa.app',
    siteName: 'IAAA',
    title: 'IAAA — Situation Intelligence Platform',
    description: 'Turn a complex situation into a clear Situation Card.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IAAA — Situation Intelligence Platform',
    description: 'Turn a complex situation into a clear Situation Card.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} ${cinzel.variable}`}
    >
      <body className="bg-ink-base text-parchment antialiased">
        {children}
      </body>
    </html>
  )
}
