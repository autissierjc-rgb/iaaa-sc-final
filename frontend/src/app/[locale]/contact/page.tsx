import { notFound } from 'next/navigation'
import ContactPage from '@/app/contact/page'
import { isPublicLocale, localeToContentLang, PUBLIC_LOCALES } from '@/lib/i18n/publicLocales'

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
}

export default function LocalizedContactPage({ params }: { params: { locale: string } }) {
  if (!isPublicLocale(params.locale)) notFound()
  return <ContactPage searchParams={{ lang: localeToContentLang(params.locale) }} />
}
