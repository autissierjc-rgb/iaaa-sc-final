import { NextResponse } from 'next/server'
import ongRdc from '@/data/ong-rdc.json'
import sequestration from '@/data/sequestration-v2.json'
import iranJ19 from '@/data/iran-j19.json'

const DATA: Record<string, any> = {
  'ong-rdc': { ...ongRdc, certified: true, certified_by: 'Maël · Chef de base ONG Congo', date: '18 mars 2026' },
  'sequestration-v2': { ...sequestration, certified: true, certified_by: 'Maël · Chef de base ONG Congo', date: '19 mars 2026' },
  'iran-j19': { ...iranJ19, certified: true, certified_by: 'JCA · IAAA+', date: '22 mars 2026' },
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const card = DATA[params.slug]
  if (card) return NextResponse.json(card)
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}