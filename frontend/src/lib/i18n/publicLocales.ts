export type PublicLocale = 'fr' | 'en' | 'us' | 'es' | 'de' | 'it' | 'pt'
export type HomeLang = 'FR' | 'EN' | 'ES' | 'DE' | 'IT' | 'PT'
export type ContentLang = 'fr' | 'en'

export const PUBLIC_LOCALES: PublicLocale[] = ['fr', 'en', 'us', 'es', 'de', 'it', 'pt']

export const PUBLIC_LOCALE_TO_HOME_LANG: Record<PublicLocale, HomeLang> = {
  fr: 'FR',
  en: 'EN',
  us: 'EN',
  es: 'ES',
  de: 'DE',
  it: 'IT',
  pt: 'PT',
}

export const PUBLIC_LOCALE_TO_CONTENT_LANG: Record<PublicLocale, ContentLang> = {
  fr: 'fr',
  en: 'en',
  us: 'en',
  es: 'en',
  de: 'en',
  it: 'en',
  pt: 'en',
}

export function isPublicLocale(value: string): value is PublicLocale {
  return PUBLIC_LOCALES.includes(value as PublicLocale)
}

export function localeToContentLang(locale: string): ContentLang {
  return isPublicLocale(locale) ? PUBLIC_LOCALE_TO_CONTENT_LANG[locale] : 'en'
}

export function localizedPublicPath(locale: PublicLocale, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `/${locale}${cleanPath}`
}
