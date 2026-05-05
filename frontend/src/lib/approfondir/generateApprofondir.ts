import { cleanModelText, parseModelJSON } from '../ai/json'
import { APPROFONDIR_PROMPT } from '../prompts/approfondir'
import type {
  ArbreACamesAnalysis,
  DeepReading,
  InterpretedRequest,
  MetierProfileContext,
  PatternContext,
  ResourceItem,
  ScopeContext,
  SituationCard,
} from '../resources/resourceContract'
import { patternGuidance } from '../patterns/detectPatterns'
import { detectScopeContext } from '../scope/scopeContext'
import { applyEntityExplanationsToDeepReading } from '../text/entityExplanations'
import { isUnderSituatedText } from '../validation/situatedText'
import {
  buildGeneralDiamondDeepFallback,
  hasDiamondDeepSections,
  polishDiamondText,
} from '../editorial/diamond'

function polishDeepText(text: string): string {
  return polishDiamondText(text)
    .replace(/\n{2,}\s*(?:Ressources|Resources|Sources)\s*\n{2,}[\s\S]*$/i, '')
    .trim()
}

function isGlobalQuestion(value: string): boolean {
  return /\b(monde|mondial|mondiale|global|globale|international|internationale|ordre mondial|2026|géopolitique|geopolitique|alliances?|march[eé]s?|p[eé]trole|[eé]nergie)\b/i.test(value)
}

function compactForCompare(value: string): string {
  return polishDeepText(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function extractOpenAIText(data: Record<string, unknown>): string {
  if (typeof data.output_text === 'string') return data.output_text

  const output = Array.isArray(data.output) ? data.output : []
  return output
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const content = (item as Record<string, unknown>).content
      if (!Array.isArray(content)) return []
      return content.map((block) => {
        if (!block || typeof block !== 'object') return ''
        const record = block as Record<string, unknown>
        if (typeof record.text === 'string') return record.text
        if (typeof record.output_text === 'string') return record.output_text
        return ''
      })
    })
    .join('')
    .trim()
}

async function generateApprofondirWithOpenAI(context: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        max_tokens: 1700,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `${APPROFONDIR_PROMPT}\n\nContext:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI approfondir failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    return parseModelJSON(typeof content === 'string' ? content : extractOpenAIText(data))
  } finally {
    clearTimeout(timeout)
  }
}

function looksGenericDeep(value: string, situation: string): boolean {
  const text = compactForCompare(value)
  const rawQuestion = compactForCompare(situation)
  const rawQuestionFragment = rawQuestion.slice(0, 60)

  return [
    'cette situation doit être lue par ses mécanismes concrets',
    'cette situation doit etre lue par ses mecanismes concrets',
    'la situation est lisible comme un système sous contrainte',
    'la situation est lisible comme un systeme sous contrainte',
    'les acteurs transforment un événement visible en contrainte durable',
    'les acteurs transforment un evenement visible en contrainte durable',
    'ce qui tient encore repose sur une combinaison fragile',
    'la trajectoire la plus favorable ressemble à ceci',
    'la trajectoire la plus favorable ressemble a ceci',
    'seuil exact à partir duquel la tension devient visible',
    'seuil exact a partir duquel la tension devient visible',
  ].some((marker) => text.includes(marker)) ||
    (rawQuestionFragment.length > 30 && text.includes(rawQuestionFragment))
}

const FRAME_FORBIDDEN_TERMS: Record<string, RegExp[]> = {
  geopolitical_crisis: [
    /\b(pitch deck|pitchs?|traction|revenus?|retention|rétention|decision client|décision client|preuve d usage|preuve d’usage|mvp|investisseur|startup)\b/i,
    /\b(ex|couple|relation amoureuse|attachement|conversation évitée)\b/i,
  ],
  startup_investment: [
    /\b(frappes?|cessez-le-feu|cessez le feu|dissuasion|riposte militaire|forces armées|sanctions internationales)\b/i,
    /\b(ex|couple|relation amoureuse|attachement|conversation évitée)\b/i,
  ],
  personal_relationship: [
    /\b(pitch deck|traction|revenus?|mvp|investisseur|startup|marché adressable)\b/i,
    /\b(frappes?|dissuasion|riposte militaire|forces armées|sanctions internationales)\b/i,
  ],
}

function looksCrossDomainContaminated(value: string, frame?: string): boolean {
  if (!frame) return false
  const text = compactForCompare(value)
  return (FRAME_FORBIDDEN_TERMS[frame] ?? []).some((pattern) => pattern.test(text))
}

function hasSiteBrief(resources: ResourceItem[]): boolean {
  return resources.some((resource) => resource.type === 'site-brief')
}

function isCausalAttribution(interpreted: InterpretedRequest | undefined, frame?: string): boolean {
  return interpreted?.question_type === 'causal_attribution' || frame === 'causal_attribution'
}

function fallbackDeep({
  situation,
  arbre,
  sc,
  scopeContext,
  resources,
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  sc?: SituationCard
  scopeContext?: ScopeContext
  resources: ResourceItem[]
}): DeepReading {
  return applyEntityExplanationsToDeepReading(
    buildGeneralDiamondDeepFallback({ situation, arbre, sc, scopeContext, resources })
  )
}

export async function generateApprofondir({
  situation,
  arbre,
  sc,
  lecture,
  patternContext,
  metierProfile,
  scopeContext,
  resources = [],
}: {
  situation: string
  arbre?: ArbreACamesAnalysis
  sc?: SituationCard
  lecture?: unknown
  patternContext?: PatternContext
  metierProfile?: MetierProfileContext
  scopeContext?: ScopeContext
  resources?: ResourceItem[]
}): Promise<DeepReading> {
  const fallback = fallbackDeep({ situation, arbre, sc, scopeContext, resources })
  const interpreted = sc?.intent_context?.interpreted_request ?? sc?.coverage_check?.intent_context?.interpreted_request
  const frame = sc?.intent_context?.dominant_frame ?? sc?.coverage_check?.intent_context?.dominant_frame
  const decision = sc?.intent_context?.decision_type ?? sc?.coverage_check?.intent_context?.decision_type
  if (frame === 'site_analysis' || decision === 'analyze_site' || hasSiteBrief(resources)) {
    return fallback
  }
  if (isCausalAttribution(interpreted, frame)) {
    return fallback
  }
  if (frame === 'personal_relationship' || interpreted?.domain === 'personal') {
    return fallback
  }
  if (interpreted?.intent_type === 'understand') {
    return fallback
  }
  const effectiveScope = scopeContext ?? sc?.scope_context ?? detectScopeContext(situation, arbre)
  const wideGlobal = effectiveScope.scope === 'global' || isGlobalQuestion(situation)

  const context = {
    situation,
    arbre,
    sc,
    lecture,
    resources,
    intent_context:
      sc?.intent_context ?? sc?.coverage_check?.intent_context,
    scope_context: scopeContext ?? sc?.scope_context,
    pattern_context: patternContext,
    metier_profile: metierProfile,
    concrete_theatre: sc?.concrete_theatre ?? sc?.coverage_check?.concrete_theatre,
    pattern_guidance: patternGuidance(patternContext),
  }

  try {
    const parsed = await generateApprofondirWithOpenAI(context)
    const parsedApprofondirFr =
      typeof parsed.approfondir_fr === 'string' ? parsed.approfondir_fr : ''
    const parsedApprofondirEn =
      typeof parsed.approfondir_en === 'string' ? parsed.approfondir_en : ''
    const approfondir_fr =
      polishDeepText(parsedApprofondirFr) || fallback.approfondir_fr
    const approfondir_en =
      polishDeepText(parsedApprofondirEn) || fallback.approfondir_en

    if (
      !hasDiamondDeepSections(approfondir_fr) ||
      looksGenericDeep(approfondir_fr, situation) ||
      (wideGlobal && looksGenericDeep(approfondir_fr, situation)) ||
      looksCrossDomainContaminated(approfondir_fr, frame) ||
      isUnderSituatedText(approfondir_fr, sc?.concrete_theatre ?? sc?.coverage_check?.concrete_theatre, 4)
    ) {
      return fallback
    }

    return applyEntityExplanationsToDeepReading({
      approfondir_fr,
      approfondir_en,
      sources: [],
    })
  } catch (error) {
    console.warn('generateApprofondir OpenAI fallback:', error)
    return fallback
  }
}
