import { notFound } from 'next/navigation'
import PricingPage from '@/app/pricing/page'
import { isPublicLocale, localeToContentLang, PUBLIC_LOCALES } from '@/lib/i18n/publicLocales'

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
}

export default function LocalizedPricingPage({ params }: { params: { locale: string } }) {
  if (!isPublicLocale(params.locale)) notFound()
  return <PricingPage searchParams={{ lang: localeToContentLang(params.locale) }} />
}
