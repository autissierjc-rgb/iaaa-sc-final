import { NextRequest, NextResponse } from 'next/server'
import { runResearchDeep } from '@/lib/research/researchDeep'

export async function POST(req: NextRequest) {
  try {
    const { situation, topic_type, max_sources } = await req.json()
    if (typeof situation !== 'string' || !situation.trim()) {
      return NextResponse.json(
        {
          facts_deep: '',
          analysis_notes: '',
          sources: [],
          research_status: 'skipped',
          topic_type: 'general',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      await runResearchDeep({
        situation,
        topic_type,
        max_sources,
      })
    )
  } catch (error) {
    console.warn('research-deep fallback:', error)
    return NextResponse.json({
      facts_deep: '',
      analysis_notes: '',
      sources: [],
      research_status: 'error',
      topic_type: 'general',
    })
  }
}
