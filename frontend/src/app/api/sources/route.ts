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
      console.info('resources diagnostic', {
        webNeeded: false,
        provided: provided.length,
        fetched: 0,
        tavilyKeyPresent: Boolean(process.env.TAVILY_API_KEY),
        openAIKeyPresent: Boolean(process.env.OPENAI_API_KEY),
        braveKeyPresent: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      })
      return NextResponse.json({ sources: provided })
    }

    const text = typeof situation === 'string' ? situation.trim() : ''
    if (!text) {
      console.info('resources diagnostic', {
        webNeeded: false,
        reason: 'empty_situation',
        provided: 0,
        fetched: 0,
        tavilyKeyPresent: Boolean(process.env.TAVILY_API_KEY),
        openAIKeyPresent: Boolean(process.env.OPENAI_API_KEY),
        braveKeyPresent: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      })
      return NextResponse.json({ sources: [] })
    }

    if (!shouldUseWeb(text)) {
      console.info('resources diagnostic', {
        webNeeded: false,
        reason: 'should_use_web_false',
        provided: 0,
        fetched: 0,
        tavilyKeyPresent: Boolean(process.env.TAVILY_API_KEY),
        openAIKeyPresent: Boolean(process.env.OPENAI_API_KEY),
        braveKeyPresent: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      })
      return NextResponse.json({ sources: [] })
    }

    const liveSources = await fetchResources(text)
    console.info('resources diagnostic', {
      webNeeded: true,
      provided: 0,
      fetched: liveSources.length,
      tavilyKeyPresent: Boolean(process.env.TAVILY_API_KEY),
      openAIKeyPresent: Boolean(process.env.OPENAI_API_KEY),
      braveKeyPresent: Boolean(process.env.BRAVE_SEARCH_API_KEY),
    })
    return NextResponse.json({ sources: liveSources })
  } catch (error) {
    console.warn('sources route fallback:', error)
    return NextResponse.json({ sources: [] })
  }
}
