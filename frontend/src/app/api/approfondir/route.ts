import { NextRequest, NextResponse } from 'next/server'
import { analyzeWithArbreACames } from '@/lib/analysis/arbreACames'
import { generateApprofondir } from '@/lib/approfondir/generateApprofondir'
import { applyConversationContractToIntent, buildConversationContract, shouldCarryConversationContract } from '@/lib/intent/conversationContract'
import { interpretRequestWithModel } from '@/lib/intent/modelIntentInterpreter'
import { situationIntentRouter } from '@/lib/intent/situationIntentRouter'
import { detectPatterns } from '@/lib/patterns/detectPatterns'
import { detectMetierProfile } from '@/lib/profiles/detectMetierProfile'
import { buildConcreteTheatre } from '@/lib/context/concreteTheatre'
import { fetchResources } from '@/lib/resources/fetchResources'
import { sanitizeResources } from '@/lib/resources/sanitizeResources'
import { shouldUseWeb } from '@/lib/resources/shouldUseWeb'
import { detectScopeContext } from '@/lib/scope/scopeContext'
import type { ArbreACamesAnalysis, ConversationContract, SituationCard } from '@/lib/resources/resourceContract'

function contractApprofondirResponse(sc: unknown): { approfondir_fr: string; approfondir_en: string; sources: unknown[] } | null {
  const card = sc as { writing_contract?: { approfondir?: { analysis_fr?: unknown; analysis_en?: unknown; sections_fr?: unknown } }; resources?: unknown[] } | undefined
  const approfondir = card?.writing_contract?.approfondir
  const sections = Array.isArray(approfondir?.sections_fr) ? approfondir.sections_fr : []
  const sectionText = sections
    .map((section) => {
      const item = section as { title?: unknown; body?: unknown }
      const title = String(item.title ?? '').trim()
      const body = String(item.body ?? '').trim()
      return [title, body].filter(Boolean).join('\n')
    })
    .filter(Boolean)
    .join('\n\n')
  const analysisFr = String(approfondir?.analysis_fr ?? '').trim()
  const approfondirFr = [analysisFr, sectionText].filter(Boolean).join('\n\n').trim()
  if (approfondirFr.length < 120) return null

  const analysisEn = String(approfondir?.analysis_en ?? '').trim()
  return {
    approfondir_fr: approfondirFr,
    approfondir_en: analysisEn || approfondirFr,
    sources: Array.isArray(card?.resources) ? card.resources : [],
  }
}

export async function POST(req: NextRequest) {
  try {
    const { situation, sc, lecture, lectures, resources: rawResources, conversation_contract } = await req.json()
    const text =
      typeof situation === 'string'
        ? situation.trim()
        : typeof sc?.submitted_situation_fr === 'string'
          ? sc.submitted_situation_fr.trim()
          : ''

    if (!text) {
      return NextResponse.json({ error: 'No situation' }, { status: 400 })
    }

    const canonicalApprofondir = contractApprofondirResponse(sc)
    if (canonicalApprofondir) {
      return NextResponse.json(canonicalApprofondir)
    }

    const provided = sanitizeResources(rawResources ?? sc?.resources)
    const resources =
      provided.length > 0
        ? provided
        : shouldUseWeb(text)
          ? await fetchResources(text)
          : []

    const existingArbre = sc?.arbre_a_cames as ArbreACamesAnalysis | undefined
    const existingInterpreted = (sc as SituationCard | undefined)?.intent_context?.interpreted_request
    const previousContract = (conversation_contract && typeof conversation_contract === 'object'
      ? conversation_contract
      : (sc as SituationCard | undefined)?.conversation_contract) as ConversationContract | undefined
    const modelInterpreted = await interpretRequestWithModel(text)
    const carriedPreviousContract = shouldCarryConversationContract(modelInterpreted, previousContract)
      ? previousContract
      : undefined
    const freshInterpreted = applyConversationContractToIntent(
      modelInterpreted,
      carriedPreviousContract
    )
    const carryExistingInterpreted = existingInterpreted?.question_type &&
      shouldCarryConversationContract(modelInterpreted, (sc as SituationCard | undefined)?.conversation_contract)
    const interpretedRequest = carryExistingInterpreted
      ? {
          ...freshInterpreted,
          ...existingInterpreted,
          signals: existingInterpreted.signals ?? freshInterpreted.signals,
          confidence: existingInterpreted.confidence ?? freshInterpreted.confidence,
          needs_clarification: existingInterpreted.needs_clarification ?? freshInterpreted.needs_clarification,
        }
      : freshInterpreted
    const hasSiteBrief = provided.some((resource) => resource.type === 'site-brief')
    const routedIntentContext = situationIntentRouter(text, interpretedRequest)
    const conversationContract = buildConversationContract({
      situation: text,
      intentContext: routedIntentContext,
      previous: carriedPreviousContract,
    })
    const intentContext = hasSiteBrief
      ? {
          ...routedIntentContext,
          dominant_frame: 'site_analysis',
          decision_type: 'analyze_site',
          needs_clarification: false,
          clarification_focus: ['site fourni', 'produit', 'cible', 'preuves visibles', 'angles morts'],
          questions: [],
          signals: [...routedIntentContext.signals, 'fiche site disponible'],
        }
      : routedIntentContext
    const arbre = existingArbre ?? (await analyzeWithArbreACames(text, resources, intentContext))
    const concreteTheatre = buildConcreteTheatre({ situation: text, arbre, resources, intentContext })
    const effectiveSc = {
      ...(sc as SituationCard | undefined),
      intent_context: intentContext,
      conversation_contract: conversationContract,
      concrete_theatre: concreteTheatre,
      coverage_check: sc?.coverage_check
        ? {
            ...sc.coverage_check,
            intent_context: intentContext,
            conversation_contract: conversationContract,
            concrete_theatre: concreteTheatre,
          }
        : {
            domain: intentContext.interpreted_request?.domain ?? intentContext.surface_domain,
            status: 'sufficient',
            questions: [],
            missingCritical: [],
            requiredSignals: [],
            intent_context: intentContext,
            conversation_contract: conversationContract,
            concrete_theatre: concreteTheatre,
          },
    } as SituationCard | undefined
    const patternContext =
      effectiveSc?.pattern_context ?? detectPatterns({ situation: text, arbre })
    const metierProfile = effectiveSc?.metier_profile ?? detectMetierProfile(text)
    const scopeContext = effectiveSc?.scope_context ?? detectScopeContext(text, arbre)

    const result = await generateApprofondir({
      situation: text,
      arbre,
      sc: effectiveSc,
      lecture: lecture ?? lectures,
      patternContext,
      metierProfile,
      scopeContext,
      resources,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('approfondir route error:', error)
    return NextResponse.json(
      {
        approfondir_fr:
          "Lecture approfondie indisponible pour cette carte. La Situation Card reste utilisable, mais le developpement long n'a pas pu etre stabilise.",
        approfondir_en:
          'Deep reading unavailable for this card. The Situation Card remains usable, but the long-form development could not be stabilized.',
        sources: [],
      },
      { status: 200 }
    )
  }
}
