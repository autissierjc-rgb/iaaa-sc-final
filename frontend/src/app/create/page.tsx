import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClient from '@/components/home/HomeClient'

export const metadata: Metadata = {
  title: 'Créer une Situation Card',
  description: 'Posez une question, collez une URL ou ajoutez un document pour créer une Situation Card.',
}

function readLang(value: string | string[] | undefined): 'FR' | 'EN' {
  return value === 'en' ? 'EN' : 'FR'
}

export default function CreatePage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const initialLang = readLang(searchParams?.lang)

  return (
    <Suspense fallback={null}>
      <HomeClient initialLang={initialLang} surface="create" />
    </Suspense>
  )
}
