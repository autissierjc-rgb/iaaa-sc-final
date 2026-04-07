import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const METADATA: Record<string, object> = {
  'ong-rdc':          { certified: true, certified_by: 'Maël · Chef de base ONG Congo', date: '18 mars 2026' },
  'sequestration-v2': { certified: true, certified_by: 'Maël · Chef de base ONG Congo', date: '19 mars 2026' },
  'iran-j19':         { certified: true, certified_by: 'JCA · IAAA+', date: '22 mars 2026' },
}

const SLUGS = ['ong-rdc', 'sequestration-v2', 'iran-j19']

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!SLUGS.includes(params.slug))
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  try {
    const file = join(process.cwd(), 'src', 'data', `${params.slug}.json`)
    const data = JSON.parse(readFileSync(file, 'utf-8'))
    return NextResponse.json({ ...data, ...METADATA[params.slug] })
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
