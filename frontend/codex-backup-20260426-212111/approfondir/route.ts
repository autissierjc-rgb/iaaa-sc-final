import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const APPROFONDIR_PROMPT = `You are the IAAA deep structural analysis engine.

Your task: extend a Situation Card into a deeper decision-grade reading for the "Approfondir" panel.

Return ONLY valid JSON.

{
  "approfondir_fr": "",
  "approfondir_en": ""
}

Writing rules:
- around 280 to 480 words per language
- continuous prose only
- no bullet points
- no section numbering
- do not repeat the short lecture
- go deeper than the SC and deeper than Lectures
- explain the structural contradiction
- explain what still holds the situation together
- explain what weakens it
- explain what could trigger escalation
- explain what could produce regime change
- explain what to watch now
- examples of probability may appear naturally in the prose, but do not classify or score them
- do not dramatize
- do not moralize
- do not sound academic
- French and English must both feel natural and sober
- valid JSON only`

type ApprofondirResponse = {
  approfondir_fr: string
  approfondir_en: string
}

function extractTextContent(
  content: Array<{ type: string; text?: string }>
): string {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('')
    .replace(/```json|```/g, '')
    .trim()
}

function parseJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()

  const attempts = [
    clean,
    clean
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\r?\n/g, ' '),
  ]

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch {}
  }

  const first = clean.indexOf('{')
  const last = clean.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const sliced = clean
      .slice(first, last + 1)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\r?\n/g, ' ')
    return JSON.parse(sliced)
  }

  throw new Error('Model returned invalid or truncated JSON')
}

function cleanText(value: string): string {
  return value
    .replace(/\r/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/—/g, ', ')
    .replace(/–/g, ', ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function buildApprofondirFallback(): ApprofondirResponse {
  return {
    approfondir_fr: cleanText(
      `Cette situation doit être lue moins comme une suite d'événements que comme un système sous contrainte. Ce qui compte n'est pas seulement ce qui se passe à la surface, mais la structure qui rend ces mouvements possibles, supportables ou dangereux. Tant que cette structure n'est pas clarifiée, des signaux visibles peuvent donner l'impression d'un changement alors que la nature profonde de la situation n'a pas réellement basculé.

Ce qui tient encore l'ensemble est souvent une combinaison d'intérêts temporaires, de coûts mutuellement redoutés et de mécanismes de coordination partiels. Cet équilibre peut être réel sans être solide. Il stabilise à court terme tout en laissant subsister la contradiction centrale qui rend la situation instable à moyen terme.

Ce qui affaiblit le système est souvent moins l'intention affichée des acteurs que la dissymétrie entre ce qu'ils gèrent publiquement et ce qu'aucun d'eux ne protège vraiment. C'est là que se logent les points porteurs, les retards dangereux, les angles morts de coordination et les seuils de rupture.

Le scénario le plus probable n'est pas toujours une rupture franche. Il peut s'agir d'un glissement progressif : calendrier qui dérape, incident mal absorbé, centre de décision qui se déplace, ou acteur secondaire qui prend trop de poids. C'est généralement à ce moment que la situation change de régime.

L'analyse approfondie n'a pas pu être complètement stabilisée dans cette génération. Mais la bonne lecture reste la même : identifier ce qui tient encore, ce qui n'est déjà plus protégé, et le point à partir duquel l'équilibre actuel cesse de contenir la dynamique.`
    ),
    approfondir_en: cleanText(
      `This situation should be read less as a sequence of events than as a constrained system. What matters is not only what happens on the surface, but the structure that makes those movements possible, bearable, or dangerous. Until that structure is clarified, visible signals can create the impression of change while the deeper nature of the situation has not truly shifted.

What still holds the whole together is usually a combination of temporary interests, mutually feared costs, and partial coordination mechanisms. That balance may be real without being solid. It can stabilize the situation in the short term while leaving intact the central contradiction that makes it unstable in the medium term.

What weakens the system is often not the actors' stated intent, but the asymmetry between what they can publicly manage and what none of them is really protecting. That is where load-bearing points, dangerous delays, coordination blind spots, and thresholds of rupture tend to appear.

The most probable outcome is not always an abrupt break. It may be a progressive drift: a calendar slipping, an incident poorly absorbed, the real center of decision moving, or a secondary actor gaining too much weight. That is often the moment when a situation changes regime.

The deep analysis could not be fully stabilized in this generation. But the right reading remains the same: identify what is still holding, what is no longer protected, and the point at which the current balance stops containing the dynamic.`
    ),
  }
}

function compactSc(sc: unknown) {
  if (!sc || typeof sc !== 'object') return {}
  const s = sc as Record<string, unknown>
  return {
    title_fr: s.title_fr ?? '',
    title_en: s.title_en ?? '',
    insight_fr: s.insight_fr ?? '',
    insight_en: s.insight_en ?? '',
    lecture_systeme_fr: s.lecture_systeme_fr ?? '',
    lecture_systeme_en: s.lecture_systeme_en ?? '',
    main_vulnerability_fr: s.main_vulnerability_fr ?? '',
    main_vulnerability_en: s.main_vulnerability_en ?? '',
    key_signal_fr: s.key_signal_fr ?? '',
    key_signal_en: s.key_signal_en ?? '',
    asymmetry_fr: s.asymmetry_fr ?? '',
    asymmetry_en: s.asymmetry_en ?? '',
  }
}

async function generateApprofondir(
  situation: string,
  sc?: unknown,
  lectures?: unknown
): Promise<ApprofondirResponse> {
  const fallback = buildApprofondirFallback()

  try {
    const context = {
      situation,
      sc: compactSc(sc),
      lectures: lectures ?? {},
    }

    const msg = await client.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1600,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: `${APPROFONDIR_PROMPT}\n\nContext:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    })

    const raw = extractTextContent(
      msg.content as Array<{ type: string; text?: string }>
    )
    const parsed = parseJSON(raw)

    const approfondir_fr =
      typeof parsed.approfondir_fr === 'string' && parsed.approfondir_fr.trim()
        ? cleanText(parsed.approfondir_fr.trim())
        : fallback.approfondir_fr

    const approfondir_en =
      typeof parsed.approfondir_en === 'string' && parsed.approfondir_en.trim()
        ? cleanText(parsed.approfondir_en.trim())
        : fallback.approfondir_en

    return {
      approfondir_fr,
      approfondir_en,
    }
  } catch (err) {
    console.error('generateApprofondir fallback:', err)
    return fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      situation,
      sc,
      lectures,
    }: {
      situation?: string
      sc?: unknown
      lectures?: unknown
    } = await req.json()

    if (!situation?.trim()) {
      return NextResponse.json({ error: 'No situation' }, { status: 400 })
    }

    const result = await generateApprofondir(situation.trim(), sc, lectures)
    return NextResponse.json(result)
  } catch (err) {
    console.error('approfondir route error:', err)
    return NextResponse.json(buildApprofondirFallback())
  }
}
