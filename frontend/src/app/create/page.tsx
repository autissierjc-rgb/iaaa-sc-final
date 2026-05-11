import { redirect } from 'next/navigation'

function readLang(value: string | string[] | undefined): 'fr' | 'en' {
  return value === 'en' ? 'en' : 'fr'
}

export default function CreatePage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = readLang(searchParams?.lang)
  redirect(`/clarity?lang=${lang}`)
}
