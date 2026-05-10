import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClient from '@/components/home/HomeClient'

type HomeLocale = 'FR' | 'EN' | 'ES' | 'DE' | 'IT' | 'PT'

export const metadata: Metadata = {
  title: 'Situation Card — Comprendre les situations complexes',
  description: 'Décrivez une situation, obtenez une Situation Card structurée.',
}

function readLang(value: string | string[] | undefined): HomeLocale {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'us') return 'EN'
  if (raw === 'en') return 'EN'
  if (raw === 'es') return 'ES'
  if (raw === 'de') return 'DE'
  if (raw === 'it') return 'IT'
  if (raw === 'pt') return 'PT'
  return 'FR'
}

export default function HomePage({
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
