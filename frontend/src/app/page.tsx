import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Situation Card — Comprendre les situations complexes',
  description: 'Décrivez une situation, obtenez une Situation Card structurée.',
}

export default function HomePage() {
  redirect('/sis')
}



