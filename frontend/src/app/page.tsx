import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClient from '@/components/home/HomeClient'

export const metadata: Metadata = {
  title: 'Situation Card — Comprendre les situations complexes',
  description: 'Décrivez une situation, obtenez une Situation Card structurée.',
}

function readLang(value: string | string[] | undefined): 'FR' | 'EN' {
  return value === 'en' ? 'EN' : 'FR'
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
