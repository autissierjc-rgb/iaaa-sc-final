import { NextRequest, NextResponse } from 'next/server'
import { runResearchFast } from '@/lib/research/researchFast'

export async function POST(req: NextRequest) {
  try {
    const { situation, topic_type, max_sources } = await req.json()
    if (typeof situation !== 'string' || !situation.trim()) {
      return NextResponse.json(
        {
          facts_snapshot: '',
          internal_sources: [],
          research_status: 'skipped',
          topic_type: 'general',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      await runResearchFast({
        situation,
        topic_type,
        max_sources,
      })
    )
  } catch (error) {
    console.warn('research-fast fallback:', error)
    return NextResponse.json({
      facts_snapshot: '',
      internal_sources: [],
      research_status: 'error',
      topic_type: 'general',
    })
  }
}
