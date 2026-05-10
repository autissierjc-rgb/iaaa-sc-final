import { notFound } from 'next/navigation'
import AboutPage from '@/app/about/page'
import { isPublicLocale, localeToContentLang, PUBLIC_LOCALES } from '@/lib/i18n/publicLocales'

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
}

export default function LocalizedAboutPage({ params }: { params: { locale: string } }) {
  if (!isPublicLocale(params.locale)) notFound()
  return <AboutPage searchParams={{ lang: localeToContentLang(params.locale) }} />
}
