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
  themeColor: '#F5F3EE',
}

export const metadata: Metadata = {
  title: {
    default: 'IAAA — Plateforme de Situation Intelligence',
    template: '%s · IAAA',
  },
  description:
    'Transformez une situation complexe en Situation Card claire. Comprenez les forces, les tensions et les trajectoires en quelques secondes.',
  metadataBase: new URL('https://iaaa.app'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://iaaa.app',
    siteName: 'IAAA',
    title: 'IAAA — Plateforme de Situation Intelligence',
    description: 'Transformez une situation complexe en Situation Card claire.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IAAA — Plateforme de Situation Intelligence',
    description: 'Transformez une situation complexe en Situation Card claire.',
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
      lang="fr"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} ${cinzel.variable}`}
    >
      <body className="antialiased" style={{ background: '#F5F3EE', color: '#1a2a3a' }}>
        {children}
      </body>
    </html>
  )
}
