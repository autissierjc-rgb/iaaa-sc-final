import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { situation } = await req.json()
    if (!situation) {
      return NextResponse.json({ error: 'No situation provided' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Tu es le moteur Situation Card. Analyse cette situation et retourne un JSON structuré avec ces champs exactement. Reponds UNIQUEMENT avec le JSON brut, sans markdown, sans backticks, sans commentaires.

{
  "title": "titre court de la situation",
  "subtitle": "sous-titre",
  "state": "Contrôlable",
  "index": 54,
  "insight": "lecture principale en une phrase",
  "vulnerability": "point de vulnérabilité clé",
  "cap": "cap recommandé",
  "watch": "signal à surveiller",
  "trajectories": [
    {"type": "Stabilisation", "color": "#1D9E75", "title": "titre", "desc": "description"},
    {"type": "Escalade", "color": "#E06B4A", "title": "titre", "desc": "description"},
    {"type": "Rupture", "color": "#378ADD", "title": "titre", "desc": "description"}
  ]
}

Situation : ${situation}`,
        },
      ],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    const sc = JSON.parse(raw)
    return NextResponse.json(sc)
  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
