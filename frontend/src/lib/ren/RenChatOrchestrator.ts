import type {
  TreatmentPlanContract,
  RenChatMode,
  RenChatRequest,
  RenChatResponseContract,
  RenSuggestedNextAction,
  RenWorkingContext,
  UserMaterialSourceType,
} from '../contracts'
import { runRiskAdviceGuard } from '../safety'
import { runSecurityAbuseGuard } from '../security'
import type { InterpretationContract } from '../contracts'

const ACTOR_HINTS = /\b(je|mon|ma|mes|nous|notre|client|equipe|équipe|associe|associé|partenaire|trump|etat|état|entreprise|startup|board|maire|institution|fils|fille)\b/i
const CONSTRAINT_HINTS = /\b(dois|devons|risque|contrainte|delai|délai|budget|peur|bloque|bloqué|urgent|certification|recours|preuve|document|juridique|financier|sante|santé)\b/i
const CHALLENGE_HINTS = /\b(challenge|contredis|critique|ren|hypothese|hypothèse|angle mort|pourquoi|es-tu sur|es tu sur)\b/i
const EXPLICIT_URL_HINT = /\b(?:https?:\/\/|www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i
const MATERIAL_POINTER_HINT = /\b(?:c['’]est|c\s+est|elles?|ils?|tout|les\s+options?|les\s+infos?|les\s+d[eé]tails?|la\s+mati[eè]re|la\s+source)\s+(?:est|sont|se\s+trouvent|figurent)?\s*(?:sur|dans|via)\s+(?:le|la|les|mon|ma|mes|ce|cette)?\s*(?:site|document|doc|pdf|fichier|pi[eè]ce|plug|drive|notion|serveur|dossier|url)\b|\b(?:sur|dans|via)\s+(?:le|la|les|mon|ma|mes|ce|cette)?\s*(?:site|document|doc|pdf|fichier|pi[eè]ce|plug|drive|notion|serveur|dossier|url)\b|\b(?:voir|regarde|consulte)\s+(?:le|la|les|mon|ma|mes)?\s*(?:site|document|doc|pdf|fichier|plug|drive|notion|dossier)\b/i

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 8)
}

function sentenceHint(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 180)
}

function hasExplicitUrl(text: string): boolean {
  return EXPLICIT_URL_HINT.test(text)
}

function pointsToMissingMaterial(text: string): boolean {
  return MATERIAL_POINTER_HINT.test(text) && !hasExplicitUrl(text)
}

function inferActors(text: string, previous: string[]): string[] {
  const actors = [...previous]
  if (/\b(mon fils|ma fille|enfant|ado|adolescent)\b/i.test(text)) actors.push('enfant / parent')
  if (/\b(associe|associé|partenaire)\b/i.test(text)) actors.push('associe / partenaire')
  if (/\b(equipe|équipe|manager|collaborateur|client)\b/i.test(text)) actors.push('equipe / travail')
  if (/\b(startup|entreprise|compagnie|board|client|marche|marché)\b/i.test(text)) actors.push('entreprise / marche')
  if (/\b(trump|election|élection|etat|état|tribunal|congres|congrès)\b/i.test(text)) actors.push('acteurs institutionnels')
  if (actors.length === 0 && ACTOR_HINTS.test(text)) actors.push('acteur principal a preciser')
  return unique(actors)
}

function inferConstraints(text: string, previous: string[]): string[] {
  const constraints = [...previous]
  if (/\b(urgent|vite|delai|délai|timing)\b/i.test(text)) constraints.push('temps')
  if (/\b(preuve|source|document|url|recours|decision|décision)\b/i.test(text)) constraints.push('preuve')
  if (/\b(juridique|droit|tribunal|contrat)\b/i.test(text)) constraints.push('cadre juridique')
  if (/\b(finance|budget|revenu|cout|coût|prix)\b/i.test(text)) constraints.push('ressource financiere')
  if (/\b(peur|conflit|distant|silence|retrait)\b/i.test(text)) constraints.push('relation / reconnaissance')
  if (constraints.length === 0 && CONSTRAINT_HINTS.test(text)) constraints.push('contrainte a qualifier')
  return unique(constraints)
}

function buildWorkingContext(request: RenChatRequest): RenWorkingContext {
  const previous = request.working_context ?? {}
  const message = request.message.trim()
  const contextText = [previous.situation_hint, message].filter(Boolean).join('\n')
  const materialPointer = pointsToMissingMaterial(message)
  const materialSources = unique([
    ...(previous.material_sources ?? []),
    ...(request.material_sources ?? []),
  ]) as UserMaterialSourceType[]
  const actors = inferActors(contextText, previous.actors ?? [])
  const constraints = inferConstraints(contextText, previous.constraints ?? [])
  const hypotheses = unique([
    ...(previous.hypotheses ?? []),
    contextText.length > 40 ? 'la situation peut etre lue comme un rapport entre acteur, contrainte et seuil observable' : '',
  ])
  const missing_context = unique([
    ...(materialPointer ? ['source exploitable : URL, document, extrait ou plug autorise'] : previous.missing_context ?? []),
    actors.length === 0 ? 'acteur principal' : '',
    constraints.length === 0 ? 'contrainte decisive' : '',
    !materialPointer && !/\b(preuve|source|document|fait|date|decision|décision|message|acte)\b/i.test(contextText) ? 'trace observable' : '',
  ]).slice(0, 3)
  const ready_for_card = !materialPointer && contextText.length > 70 && actors.length > 0 && constraints.length > 0

  return {
    situation_hint: materialPointer
      ? previous.situation_hint
      : sentenceHint(contextText) || previous.situation_hint,
    pending_questions: previous.pending_questions ?? [],
    actors,
    constraints,
    hypotheses,
    missing_context,
    material_sources: materialSources,
    ready_for_card,
  }
}

function modeFor(text: string, context: RenWorkingContext, guarded: boolean): RenChatMode {
  if (guarded) return 'guarded'
  if (pointsToMissingMaterial(text)) return 'clarify'
  if (CHALLENGE_HINTS.test(text)) return 'challenge'
  if (context.ready_for_card) return 'ready_for_card'
  if (context.missing_context.length > 0) return 'clarify'
  return 'explore'
}

function modeFromTreatmentPlan(plan: TreatmentPlanContract | undefined, fallback: RenChatMode): RenChatMode {
  if (!plan) return fallback
  if (plan.mode === 'safety_first') return 'guarded'
  if (plan.mode === 'resource_first' && plan.source_status === 'missing') return 'clarify'
  if (plan.mode === 'collaborative_clarification' && !plan.can_generate) return 'clarify'
  if (plan.can_generate) return 'ready_for_card'
  return fallback
}

function nextActionFor(mode: RenChatMode, context: RenWorkingContext): RenSuggestedNextAction {
  if (context.missing_context.includes('source exploitable : URL, document, extrait ou plug autorise')) return 'attach_material'
  if (mode === 'ready_for_card') return 'click_compass_generate_card'
  if (mode === 'clarify') return 'ask_one_precision'
  if (context.material_sources.length === 0 && context.missing_context.includes('trace observable')) return 'attach_material'
  return 'continue_chat'
}

function nextActionFromTreatmentPlan(
  plan: TreatmentPlanContract | undefined,
  fallback: RenSuggestedNextAction,
): RenSuggestedNextAction {
  if (!plan) return fallback
  if (plan.mode === 'resource_first' && plan.source_status === 'missing') return 'attach_material'
  if (plan.mode === 'collaborative_clarification' && !plan.can_generate) return 'ask_one_precision'
  if (plan.can_generate) return 'click_compass_generate_card'
  if (plan.can_generate_exploratory) return 'click_compass_generate_card'
  return fallback
}

function planClarification(plan: TreatmentPlanContract | undefined): string | null {
  if (!plan) return null
  if (plan.public_clarification_fr) return plan.public_clarification_fr
  if (plan.mode === 'resource_first' && plan.source_status === 'missing') {
    return 'Donnez l URL exacte, collez l extrait utile, ajoutez un document ou utilisez Plug. Sinon, cliquez la boussole pour produire une carte exploratoire clairement provisoire.'
  }
  return null
}

function answerFr(mode: RenChatMode, context: RenWorkingContext): string {
  const actors = context.actors.length > 0 ? context.actors.join(', ') : 'l acteur principal'
  const constraints = context.constraints.length > 0 ? context.constraints.join(', ') : 'la contrainte decisive'
  if (mode === 'guarded') {
    return `REN peut vous aider a structurer la situation, mais cette demande touche une zone sensible. Restons sur les faits, les questions a verifier et les interlocuteurs competents.`
  }
  if (mode === 'ready_for_card') {
    return `La situation commence a etre assez structuree : ${actors} face a ${constraints}. Vous pouvez cliquer sur la boussole pour generer la Situation Card.`
  }
  if (mode === 'challenge') {
    return `Je challengerais l hypothese ainsi : ne regardons pas seulement ce qui est dit, mais qui porte le levier, quelle contrainte l encadre, et quelle trace ferait changer la lecture.`
  }
  if (mode === 'clarify') {
    const missing = context.missing_context[0] ?? 'le point concret a verifier'
    if (missing.startsWith('source exploitable')) {
      return `Je comprends : la matiere existe, mais elle n est pas encore exploitable ici. Donnez l URL exacte, collez l extrait utile, ajoutez un document ou utilisez Plug. Sinon, cliquez la boussole pour produire une carte exploratoire clairement provisoire.`
    }
    return `Je peux explorer avec vous. Le point le plus utile a preciser maintenant est : ${missing}. Ensuite la boussole pourra cristalliser la carte.`
  }
  return `REN lit cette situation comme une configuration a clarifier : acteurs, contraintes, hypothese et signal observable. Continuez le chat pour affiner, ou cliquez la boussole quand vous voulez generer la carte.`
}

function answerFrFromTreatmentPlan(
  plan: TreatmentPlanContract | undefined,
  mode: RenChatMode,
  context: RenWorkingContext,
): string {
  const clarification = planClarification(plan)
  if (mode === 'clarify' && clarification) return clarification
  return answerFr(mode, context)
}

function answerEn(mode: RenChatMode, context: RenWorkingContext): string {
  const actors = context.actors.length > 0 ? context.actors.join(', ') : 'the main actor'
  const constraints = context.constraints.length > 0 ? context.constraints.join(', ') : 'the decisive constraint'
  if (mode === 'guarded') {
    return 'REN can help structure the situation, but this touches a sensitive area. Let us stay with facts, verification questions, and competent human review.'
  }
  if (mode === 'ready_for_card') {
    return `The situation is becoming structured enough: ${actors} facing ${constraints}. You can click the compass to generate the Situation Card.`
  }
  if (mode === 'challenge') {
    return 'I would challenge the hypothesis this way: do not only look at what is said; look at who holds the lever, what constraint frames it, and what trace would change the reading.'
  }
  if (mode === 'clarify') {
    const missing = context.missing_context[0] ?? 'the concrete point to verify'
    if (missing.startsWith('source exploitable')) {
      return 'I understand: the material exists, but it is not usable here yet. Provide the exact URL, paste the useful excerpt, add a document, or use Plug. Otherwise, click the compass to generate a clearly provisional exploratory card.'
    }
    return `I can explore this with you. The most useful point to clarify now is: ${missing}. Then the compass can crystallize the card.`
  }
  return 'REN reads this as a configuration to clarify: actors, constraints, hypothesis, and observable signal. Keep chatting to sharpen it, or click the compass when you want to generate the card.'
}

function answerEnFromTreatmentPlan(
  plan: TreatmentPlanContract | undefined,
  mode: RenChatMode,
  context: RenWorkingContext,
): string {
  if (mode === 'clarify' && plan?.mode === 'resource_first' && plan.source_status === 'missing') {
    return 'Provide the exact URL, paste the useful excerpt, add a document, or use Plug. Otherwise, click the compass to generate a clearly provisional exploratory card.'
  }
  if (mode === 'clarify' && plan?.public_clarification_fr) {
    return plan.public_clarification_fr
  }
  return answerEn(mode, context)
}

function pseudoInterpretation(message: string): InterpretationContract {
  return {
    raw_input: message,
    reference_model: {
      provider: 'local',
      model: 'ren-passive-orchestrator',
    },
    intent: 'understand',
    domain: 'general',
    question_type: 'open_analysis',
    situation_soumise: message,
    object_of_analysis: message,
    header_domain: 'REN',
    header_subject: sentenceHint(message) || 'atelier de discussion',
    angle: 'exploration',
    user_need: 'clarifier sans generer automatiquement une Situation Card',
    expected_answer_shape: 'ren_chat_response',
    must_answer_first: false,
    needs_clarification: false,
    entity_explanations: [],
    confidence: 0.62,
    signals: ['ren_chat'],
    trace: {
      service: 'RenChatOrchestrator',
      version: 'v2-passive',
      status: 'ok',
    },
  }
}

export function runRenChatOrchestrator(request: RenChatRequest): RenChatResponseContract {
  const started = Date.now()
  const language = request.language ?? 'fr'
  const message = request.message.trim()
  const workingContext = buildWorkingContext(request)
  const safety = runRiskAdviceGuard({ interpretation: pseudoInterpretation(message) })
  const security = runSecurityAbuseGuard({
    input_chars: message.length,
    text_sample: message,
    request_count_1m: 1,
  })
  const guarded = safety.domain_risk !== 'normal' || security.risk_level === 'block'
  const fallbackMode = modeFor(message, workingContext, guarded)
  const renMode = modeFromTreatmentPlan(request.treatment_plan, fallbackMode)
  const fallbackNextAction = nextActionFor(renMode, workingContext)
  const nextAction = nextActionFromTreatmentPlan(request.treatment_plan, fallbackNextAction)

  return {
    answer: language === 'en'
      ? answerEnFromTreatmentPlan(request.treatment_plan, renMode, workingContext)
      : answerFrFromTreatmentPlan(request.treatment_plan, renMode, workingContext),
    ren_mode: renMode,
    treatment_plan: request.treatment_plan,
    useful_context: unique([
      ...workingContext.actors.map((actor) => `acteur: ${actor}`),
      ...workingContext.constraints.map((constraint) => `contrainte: ${constraint}`),
    ]),
    missing_context: workingContext.missing_context,
    suggested_next_action: nextAction,
    working_context: workingContext,
    safety,
    security,
    trace: {
      service: 'RenChatOrchestrator',
      version: 'v2-passive',
      duration_ms: Date.now() - started,
      status: guarded ? 'partial' : 'ok',
      notes: [
        `mode=${renMode}`,
        `next=${nextAction}`,
        request.treatment_plan ? 'treatment_plan=applied' : 'treatment_plan=fallback_missing',
      ],
    },
  }
}
