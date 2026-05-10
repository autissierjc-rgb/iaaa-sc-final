import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import HomeClient from '@/components/home/HomeClient'

type HomeLocale = 'FR' | 'EN' | 'ES' | 'DE' | 'IT' | 'PT'

const LOCALE_TO_LANG: Record<string, HomeLocale> = {
  fr: 'FR',
  en: 'EN',
  us: 'EN',
  es: 'ES',
  de: 'DE',
  it: 'IT',
  pt: 'PT',
}

const METADATA: Record<HomeLocale, Metadata> = {
  FR: {
    title: 'Situation Card — Comprendre les situations complexes',
    description: 'Décrivez une situation, obtenez une Situation Card structurée.',
  },
  EN: {
    title: 'Situation Card — Understand complex situations',
    description: 'Describe a situation and get a structured Situation Card.',
  },
  ES: {
    title: 'Situation Card — Comprender situaciones complejas',
    description: 'Describe una situación y obtén una Situation Card estructurada.',
  },
  DE: {
    title: 'Situation Card — Komplexe Situationen verstehen',
    description: 'Beschreiben Sie eine Situation und erhalten Sie eine strukturierte Situation Card.',
  },
  IT: {
    title: 'Situation Card — Comprendere situazioni complesse',
    description: 'Descrivi una situazione e ottieni una Situation Card strutturata.',
  },
  PT: {
    title: 'Situation Card — Compreender situações complexas',
    description: 'Descreva uma situação e receba uma Situation Card estruturada.',
  },
}

export function generateStaticParams() {
  return Object.keys(LOCALE_TO_LANG).map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const lang = LOCALE_TO_LANG[params.locale]
  if (!lang) return {}
  return METADATA[lang]
}

export default function LocalizedHomePage({ params }: { params: { locale: string } }) {
  const initialLang = LOCALE_TO_LANG[params.locale]
  if (!initialLang) notFound()

  return (
    <Suspense fallback={null}>
      <HomeClient initialLang={initialLang} />
    </Suspense>
  )
}
