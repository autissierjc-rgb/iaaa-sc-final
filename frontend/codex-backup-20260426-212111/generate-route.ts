import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  computeState,
  getStateLabel,
  AstrolabeBranch,
  RadarScores,
} from '@/lib/scoring'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})
const FAST_CARD_PROMPT = `You are the IAAA Situation Card engine.

Return ONLY valid JSON. No markdown. No text outside JSON.

{
  "title_fr": "max 6 words",
  "title_en": "max 6 words",
  "submitted_situation_fr": "restate submitted situation, correct spelling, no reformulation",
  "submitted_situation_en": "same in EN",
  "insight_fr": "2 sentences — reveal structure, not summarize",
  "insight_en": "same in EN",
  "main_vulnerability_fr": "precise structural failure point",
  "main_vulnerability_en": "same in EN",
  "asymmetry_fr": "what everyone manages vs what no one protects",
  "asymmetry_en": "same in EN",
  "key_signal_fr": "1 observable signal",
  "key_signal_en": "same in EN",
  "radar": {
    "impact": 0,
    "urgency": 0,
    "uncertainty": 0,
    "reversibility": 0
  },
  "trajectories": [
    {
      "type": "stabilization",
      "title_fr": "",
      "title_en": "",
      "description_fr": "",
      "description_en": "",
      "signal_fr": "",
      "signal_en": ""
    },
    {
      "type": "escalation",
      "title_fr": "",
      "title_en": "",
      "description_fr": "",
      "description_en": "",
      "signal_fr": "",
      "signal_en": ""
    },
    {
      "type": "regime_shift",
      "title_fr": "",
      "title_en": "",
      "description_fr": "",
      "description_en": "",
      "signal_fr": "",
      "signal_en": ""
    }
  ],
  "cap": {
    "hook_fr": "",
    "hook_en": "",
    "watch_fr": "",
    "watch_en": ""
  },
  "movements_fr": ["", "", ""],
  "movements_en": ["", "", ""],
  "avertissement_fr": "",
  "avertissement_en": "",
  "lecture_systeme_fr": "3-4 sentences",
  "lecture_systeme_en": "same in EN"
}`

function parseJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return JSON.parse(
      clean
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\r?\n/g, ' ')
    )
  }
}

function enrichWithScoring(
  sc: Record<string, unknown>,
  branches: AstrolabeBranch[]
): Record<string, unknown> {
  const radar = sc.radar as RadarScores | undefined
  if (!radar) return sc

  const state =
    branches.length > 0
      ? computeState(branches, radar)
      : Math.round(
          Math.max(
            0,
            Math.min(
              100,
              radar.impact * 0.3 +
                radar.urgency * 0.25 +
                radar.uncertainty * 0.25 +
                (100 - radar.reversibility) * 0.2
            )
          )
        )

  return {
    ...sc,
    state_index_final: state,
    state_label: getStateLabel(state, 'fr'),
    state_label_en: getStateLabel(state, 'en'),
  }
}

async function generateFastCard(
  situation: string,
  branches: AstrolabeBranch[] = []
) {
  console.log('ANTHROPIC KEY PRESENT?', !!process.env.ANTHROPIC_API_KEY)
  console.log('GENERATE START')

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: `${FAST_CARD_PROMPT}\n\nSituation:\n${situation}`,
      },
    ],
  })

  const raw = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .replace(/```json|```/g, '')
    .trim()

  const sc = parseJSON(raw)
  return enrichWithScoring(sc, branches)
}

export async function POST(req: NextRequest) {
  try {
    const { situation, astrolabe_branches } = await req.json()

    if (!situation?.trim()) {
      return NextResponse.json({ error: 'No situation' }, { status: 400 })
    }

    const sc = await generateFastCard(
      situation.trim(),
      astrolabe_branches ?? []
    )

    return NextResponse.json({ gate: 'GENERATE', sc })
  } catch (err: any) {
    console.error('generate error FULL:', err)
    console.error('generate error message:', err?.message)
    console.error('generate error status:', err?.status)
    console.error(
      'generate error response:',
      err?.response ?? err?.error ?? null
    )
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
} 