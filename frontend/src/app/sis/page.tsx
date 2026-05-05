import { redirect } from 'next/navigation'

export default function SISPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = searchParams?.lang === 'en' ? '?lang=en' : searchParams?.lang === 'fr' ? '?lang=fr' : ''
  redirect(`/${lang}`)
}
