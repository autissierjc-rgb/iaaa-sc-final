import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="fr">
      <body className="antialiased" style={{ background: '#F5F3EE', color: '#1a2a3a' }}>
        {children}
      </body>
    </html>
  )
}
