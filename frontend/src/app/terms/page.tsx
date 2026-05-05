import { redirect } from 'next/navigation'

export default function TermsPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  redirect(searchParams?.lang === 'en' ? '/privacy?lang=en' : '/privacy?lang=fr')
}
