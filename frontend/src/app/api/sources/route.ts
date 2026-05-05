import { NextRequest, NextResponse } from 'next/server'
import { fetchResources } from '@/lib/resources/fetchResources'
import { sanitizeResources } from '@/lib/resources/sanitizeResources'
import { shouldUseWeb } from '@/lib/resources/shouldUseWeb'

export async function GET() {
  return NextResponse.json({ sources: [] })
}

export async function POST(req: NextRequest) {
  try {
    const { situation, resources } = await req.json()
    const provided = sanitizeResources(resources)

    if (provided.length > 0) {
      return NextResponse.json({ sources: provided })
    }

    const text = typeof situation === 'string' ? situation.trim() : ''
    if (!text) {
      return NextResponse.json({ sources: [] })
    }

    if (!shouldUseWeb(text)) {
      return NextResponse.json({ sources: [] })
    }

    const liveSources = await fetchResources(text)
    return NextResponse.json({ sources: liveSources })
  } catch (error) {
    console.warn('sources route fallback:', error)
    return NextResponse.json({ sources: [] })
  }
}
