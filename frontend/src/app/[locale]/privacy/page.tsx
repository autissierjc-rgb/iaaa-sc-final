import { notFound } from 'next/navigation'
import PrivacyPage from '@/app/privacy/page'
import { isPublicLocale, localeToContentLang, PUBLIC_LOCALES } from '@/lib/i18n/publicLocales'

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
}

export default function LocalizedPrivacyPage({ params }: { params: { locale: string } }) {
  if (!isPublicLocale(params.locale)) notFound()
  return <PrivacyPage searchParams={{ lang: localeToContentLang(params.locale) }} />
}
