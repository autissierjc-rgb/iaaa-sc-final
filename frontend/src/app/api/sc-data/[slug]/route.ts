import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DEMO_SLUGS = ['ong-rdc', 'sequestration-v2', 'iran-j19']

const CERTIFIED_BY: Record<string, string> = {
  'iran-j19': 'JCA · IAAA+',
  'sequestration-v2': 'Maël · Chef de base ONG Congo',
  'ong-rdc': 'Maël · Chef de base ONG Congo',
}

const DATES: Record<string, string> = {
  'iran-j19': '22 mars 2026',
  'sequestration-v2': '19 mars 2026',
  'ong-rdc': '18 mars 2026',
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params

  if (DEMO_SLUGS.includes(slug)) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', `${slug}.json`)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(raw)
      return NextResponse.json({
        ...data,
        slug,
        certified: true,
        certified_by: CERTIFIED_BY[slug] ?? 'IAAA+',
        date: DATES[slug] ?? '',
      })
    } catch {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
  }

  // Backend FastAPI fallback
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    const res = await fetch(`${apiUrl}/api/cards/${slug}`)
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
