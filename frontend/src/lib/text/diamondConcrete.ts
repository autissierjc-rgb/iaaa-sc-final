import type { ArbreACamesAnalysis, ResourceItem, SituationCard } from '../resources/resourceContract'
import { cleanModelText } from '../ai/json'

export type CausalMatter = {
  hypothesis: string
  sourceActor: string
  targetActor: string
  event: string
  namedAnchors: string[]
  causalChannels: string[]
  counterChannels: string[]
  proofSignals: string[]
}

function clean(value: unknown): string {
  return cleanModelText(String(value ?? '')).replace(/[.;:]+$/g, '').trim()
}

function capitalizeEntity(value: string): string {
  const text = clean(value)
    .replace(/\b(?:a|as|ont|avait|avaient|aurait|auraient)\s*$/i, '')
    .replace(/\b(?:a-t-il|a t il|at['’]?il|t['’]?il)\s*$/i, '')
    .trim()
  if (!text) return ''
  return text
    .split(/\s+/)
    .map((word) => {
      if (/^(de|du|des|d['’]|le|la|les|en|dans|contre|et|ou)$/i.test(word)) return word.toLowerCase()
      return word.length <= 3 ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
    })
    .join(' ')
}

function unique(values: string[], max = 8): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values) {
    const value = clean(raw)
    const key = value.toLowerCase()
    if (!value || value.length > 72 || /\b(éventuels?|capables de bloquer|what.?s|will .* accept|source|ressource)\b/i.test(value) || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result.slice(0, max)
}

function extractProperAnchors(text: string): string[] {
  const explicit = text.match(/\b[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’.-]{2,}(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’.-]{2,}){0,3}\b/g) ?? []
  return explicit
    .map((item) => clean(item))
    .filter((item) => !/^(Ce|La|Le|Les|Un|Une|Dans|Avec|Sans|Pour|Que|Qu|Est|Situation|Card|SC)$/i.test(item))
}

function parseCausalQuestion(hypothesis: string) {
  const text = clean(hypothesis)
    .replace(/\ba\s+a\s*t(['’]?\s*)?il\b/gi, 'a t il')
    .replace(/\ba\s+at(['’]?\s*)?il\b/gi, 'a t il')
    .replace(/\bat(['’]?\s*)?il\b/gi, 'a t il')
  const verb =
    '(?:entra[iî]n[eé]?|pouss[eé]?|forc[eé]?|manipul[eé]?|amen[eé]?|conduit|provoqu[eé]?|d[eé]clench[eé]?|fait entrer)'
  const patterns = [
    new RegExp(`^(.+?)\\s+(?:a-t-il|a t il|a-t-elle|a t elle)\\s+${verb}\\s+(.+?)(?:\\s+dans\\s+(.+?))?\\s*\\??$`, 'i'),
    new RegExp(`^(.+?)\\s+a\\s*t['’]?\\s*il\\s+${verb}\\s+(.+?)(?:\\s+dans\\s+(.+?))?\\s*\\??$`, 'i'),
    new RegExp(`^(.+?)\\s+${verb}\\s+(.+?)(?:\\s+dans\\s+(.+?))?\\s*\\??$`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    return {
      sourceActor: capitalizeEntity(match[1]),
      targetActor: capitalizeEntity(match[2]),
      event: clean(match[3] ?? ''),
    }
  }

  return { sourceActor: '', targetActor: '', event: '' }
}

function firstUseful(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = clean(value)
    if (text.length > 4) return text
  }
  return fallback
}

export function buildCausalMatter({
  situation,
  arbre,
  sc,
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  sc?: SituationCard
  resources?: ResourceItem[]
}): CausalMatter {
  const interpreted = sc?.intent_context?.interpreted_request ?? sc?.coverage_check?.intent_context?.interpreted_request
  const hypothesis = clean(interpreted?.primary_hypothesis || interpreted?.user_question || sc?.submitted_situation_fr || situation)
  const parsed = parseCausalQuestion(hypothesis)
  const sourceActor = parsed.sourceActor || firstUseful([arbre?.acteurs?.[0]], 'l’acteur supposé influencer')
  const targetActor = parsed.targetActor || firstUseful([arbre?.acteurs?.[1]], 'l’acteur supposé décider')
  const event = parsed.event || firstUseful([interpreted?.object_of_analysis, sc?.submitted_situation_fr], 'la décision ou l’action contestée')
  const namedAnchors = unique([
    sourceActor,
    targetActor,
    event,
    ...extractProperAnchors(hypothesis),
    ...(arbre?.acteurs ?? []),
  ], 8)

  return {
    hypothesis,
    sourceActor,
    targetActor,
    event,
    namedAnchors,
    causalChannels: [
      `${sourceActor} peut peser sur ${targetActor} par une relation directe, des relais, une pression publique ou un intérêt partagé`,
      `le passage vers ${event} suppose un canal observable entre influence, arbitrage et exécution`,
      `Les institutions, conseillers, règles, financements, calendrier et opinion peuvent transformer une influence en contrainte`,
    ],
    counterChannels: [
      `${targetActor} peut décider pour ses propres intérêts, coûts, contraintes institutionnelles ou calculs de calendrier`,
      `une convergence entre ${sourceActor} et ${targetActor} peut ressembler à une influence sans prouver une causalité`,
      `un récit public peut attribuer la décision à ${sourceActor} alors que la chaîne réelle passe par d’autres verrous`,
    ],
    proofSignals: [
      `chronologie reliant ${sourceActor}, ${targetActor} et ${event}`,
      'échange privé, document, ordre, témoignage solide ou canal institutionnel',
      'trace montrant que l’influence a réduit la liberté de choix du décideur',
    ],
  }
}
