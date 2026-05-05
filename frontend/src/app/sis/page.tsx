import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClient from '@/components/home/HomeClient'

export const metadata: Metadata = {
  title: 'SIS — Situation Intelligence System',
  description:
    'Lire une situation complexe à partir de vos documents. SIS révèle la structure là où les autres résument.',
}

function readLang(value: string | string[] | undefined): 'FR' | 'EN' {
  return value === 'en' ? 'EN' : 'FR'
}

export default function SISPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const initialLang = readLang(searchParams?.lang)

  return (
    <Suspense fallback={null}>
      <HomeClient initialLang={initialLang} />
    </Suspense>
  )
}
