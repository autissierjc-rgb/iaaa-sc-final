import { NextRequest, NextResponse } from 'next/server'
import {
  computeState,
  getStateLabel,
  AstrolabeBranch,
  RadarScores,
} from '@/lib/scoring'
import { parseModelJSON } from '@/lib/ai/json'
import { analyzeWithArbreACames } from '@/lib/analysis/arbreACames'
import { coverageCheck } from '@/lib/coverage/coverageCheck'
import { enrichArbreWithCoverage } from '@/lib/coverage/enrichArbreWithCoverage'
import { generateLecture } from '@/lib/lecture/generateLecture'
import { inputQualityGate } from '@/lib/input/inputQualityGate'
import { selectClarifyingQuestions, selectRefineOptionalQuestions } from '@/lib/input/selectClarifyingQuestions'
import { situationReadinessGate } from '@/lib/input/situationReadinessGate'
import { clarifyBeforeGenerate } from '@/lib/intent/clarifyBeforeGenerate'
import { applyConversationContractToIntent, buildConversationContract, shouldCarryConversationContract } from '@/lib/intent/conversationContract'
import { buildCanonicalSituationFromDialogue } from '@/lib/intent/dialogueCanonicalizer'
import { interpretRequestWithModel } from '@/lib/intent/modelIntentInterpreter'
import { situationIntentRouter } from '@/lib/intent/situationIntentRouter'
import { detectPatterns, patternGuidance } from '@/lib/patterns/detectPatterns'
import { detectMetierProfile } from '@/lib/profiles/detectMetierProfile'
import { fetchResources } from '@/lib/resources/fetchResources'
import { DIAMOND_EDITORIAL_CONTRACT, SC_INTERPRETATION_AUTHORITY } from '@/lib/governance/scDoctrine'
import { sanitizeResources } from '@/lib/resources/sanitizeResources'
import { shouldUseWeb } from '@/lib/resources/shouldUseWeb'
import { enrichResourcesWithSiteUnderstanding } from '@/lib/resources/siteUnderstanding'
import { detectScopeContext } from '@/lib/scope/scopeContext'
import { buildConcreteTheatre } from '@/lib/context/concreteTheatre'
import { applyEntityExplanationsToSituationCard } from '@/lib/text/entityExplanations'
import { buildCausalMatter } from '@/lib/text/diamondConcrete'
import { normalizeSubmittedSituation } from '@/lib/text/normalizeSubmittedSituation'
import type {
  ArbreACamesAnalysis,
  PatternContext,
  ResourceItem,
  SituationCard,
  IntentContext,
  ConversationContract,
  ConcreteTheatre,
} from '@/lib/resources/resourceContract'

function hasExplicitUrl(value: string): boolean {
  return /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(value)
}

function explicitUrls(value: string): string[] {
  const seen = new Set<string>()
  return (value.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? [])
    .map((match) => match.replace(/[),.;:!?]+$/g, ''))
    .filter((url) => {
      const key = url.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function dialogueText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const text = (item as Record<string, unknown>).text
      return typeof text === 'string' ? text : ''
    })
    .filter(Boolean)
    .join('\n')
}

const FAST_CARD_PROMPT = `You are the IAAA Situation Card engine.

${SC_INTERPRETATION_AUTHORITY}

${DIAMOND_EDITORIAL_CONTRACT}

The Situation Card must be derived from the Arbre a Cames analysis, not from a simple summary.
Canonical Arbre a Cames V1 axes: Acteurs, Interets, Forces, Tensions, Contraintes, Incertitudes, Temps, Perceptions.
Central IAAA rule: a Situation Card does not summarize a situation. It searches, classifies, and ranks the powers in presence.
Powers in presence can be military, political, financial, symbolic, emotional, institutional, narrative, temporal, legitimating, blocking, wearing-down, or tipping powers depending on the situation.
Resources, when present, are context for reasoning and must remain attached to the SC output by the server.

VI rule:
- Treat Incertitudes as "Incertitudes & angles morts": not only unknown facts, but the absent dimensions that could reverse the reading.
- Always ask what the analysis risks missing: long personal or political relationships, networks, advisers, donors, lobbies, legal and institutional conditions, money, work, social status, state power, public funding, norms, infrastructures, hidden costs, or implicit assumptions.
- When a domain normally requires one of these dimensions and it is absent from the visible material, state it as a critical uncertainty, not as an invented fact.
- The dialogue should allow the user to rebound from VI: turn blind spots into inquiry moves such as "verify the relationship history", "check the legal frame", "map the networks", "look for the public funding", or "find the proof that would reverse this reading".

Astrolabe scoring rule:
- astrolabe_scores is canonical for the final card and must be coherent with state_index_final.
- display_score uses 0=absent, 1=calm/background, 2=moderate/active, 3=dominant/structuring.
- The primary branch should usually be 2 or 3; use primary=1 only for genuinely weak or trivial situations.
- Use at most 2 dominant branches and at most 3 moderate branches.
- A dominant branch means the dimension organizes the reading, not merely that a keyword appears.
- In open war, institutional crisis, severe conflict, or high-stakes human rupture, at least one branch should normally be dominant unless the user asks only for a low-stakes background note.

Interpretation rule:
- The interpreted_request is canonical when present.
- First obey intent_type: understand, decide, evaluate, prepare, diagnose, predict, or compare.
- Domain vocabulary must never override the user's intent.
- If intent_type is "understand", explain the role, mechanism, or tension of the object. Do not ask for evaluation criteria or produce a deal/investment assessment unless the user explicitly asks for evaluation.
- If intent_type is "evaluate", judge against proofs, criteria, and risks.
- If intent_type is "decide", structure the trade-off and conditions.
- If intent_type is "prepare", focus on sequence, message, proof, and next actions.
- If interpreted_request.question_type is "causal_attribution" or must_answer_first is true, answer the causal hypothesis first: established, plausible, not established, missing proof. Do not start with a general crisis, market, or context analysis.

Editorial anchoring rule:
- Structure must reveal, but concrete details must prove.
- Every user-facing field should combine structural reading with concrete anchors when the situation allows.
- Use named actors, organizations, places, mechanisms, markets, institutions, dates, numbers, observable signals, or professional artifacts from the provided context.
- If concrete_theatre exists, it is mandatory: each main user-facing field must use at least one actor, institution, procedure, place, date, precedent, mechanism, threshold, gesture, or evidence item from concrete_theatre when available.
- Do not let abstract formulas carry the card. Terms such as "actor", "relay", "mechanism", "channel", "proof", "risk", "system", "narrative", or "threshold" must be anchored in concrete theatre elements.
- For election or institutional-crisis questions, use the concrete theatre of electoral institutions, certification, courts, partisan relays, precedent, calendar, legal or extra-legal mechanisms, and institutional tipping thresholds.
- For affective or family questions, use the concrete theatre of people, bond, scene, gesture, silence, timing, asymmetry, repair threshold, and what the user should observe next.
- Never produce a field made only of abstract words such as system, channels, actors, risk, thresholds, order, constraints, or balance without concrete examples.
- Do not force any specific country, person, or place. Select anchors only from the situation, Arbre a Cames, resources, coverage check, scope context, or professional profile.
- For broad or global questions, keep the requested scale, but still name the concrete channels through which the crisis or situation travels.
- If a resource of type "site-brief" exists, treat it as the primary factual base for site or startup analysis.
- For site_analysis, first state plainly what the company appears to do, for whom, with what visible promise, and what proof is visible or missing.
- For site_analysis, never begin with abstract market forces, powers, regulation, liquidity, trust, prices, or scalability before the product is clear.
- For site_analysis, do not infer funding, traction, customers, pricing, regulation, partnerships, revenue, or business model unless the site-brief/resources explicitly support it.
- For site_analysis, avoid generic phrases such as "powers in presence", "financial powers", "liquidity", "prices", "regulatory frame", or "narrative trust" unless those words are directly grounded in provided facts.
- Role/title attribution rule: attach a status, title, office, candidacy, job, or institutional role to a named person only when that role is established by the user input, resources, concrete_theatre, or stable public knowledge. If the role is uncertain or not needed, use the name alone. Never infer a candidacy, office, employment status, family role, or organizational function from thematic proximity.

Return ONLY valid JSON. No markdown. No text outside JSON.

{
  "title_fr": "max 6 words",
  "title_en": "max 6 words",
  "submitted_situation_fr": "formalize the user's question faithfully: correct spelling and punctuation, preserve intent, names, facts, relations and requested action, do not add a domain angle",
  "submitted_situation_en": "same in EN",
  "insight_fr": "max 2 short sentences — reveal structure, not summarize",
  "insight_en": "same in EN",
  "main_vulnerability_fr": "precise structural failure point, max 1 sentence",
  "main_vulnerability_en": "same in EN",
  "asymmetry_fr": "what everyone manages vs what no one protects, max 1 sentence",
  "asymmetry_en": "same in EN",
  "key_signal_fr": "1 observable signal, max 1 sentence",
  "key_signal_en": "same in EN",
  "radar": {
    "impact": 0,
    "urgency": 0,
    "uncertainty": 0,
    "reversibility": 0
  },
  "astrolabe_scores": [
    { "branch": "I", "display_score": 0, "is_primary": false, "name": "Acteurs", "name_en": "Actors", "label": "", "label_en": "" },
    { "branch": "II", "display_score": 0, "is_primary": false, "name": "Intérêts", "name_en": "Interests", "label": "", "label_en": "" },
    { "branch": "III", "display_score": 0, "is_primary": false, "name": "Forces", "name_en": "Forces", "label": "", "label_en": "" },
    { "branch": "IV", "display_score": 0, "is_primary": false, "name": "Tensions", "name_en": "Tensions", "label": "", "label_en": "" },
    { "branch": "V", "display_score": 0, "is_primary": false, "name": "Contraintes", "name_en": "Constraints", "label": "", "label_en": "" },
    { "branch": "VI", "display_score": 0, "is_primary": false, "name": "Incertitudes", "name_en": "Uncertainty", "label": "", "label_en": "" },
    { "branch": "VII", "display_score": 0, "is_primary": false, "name": "Temps", "name_en": "Time", "label": "", "label_en": "" },
    { "branch": "VIII", "display_score": 0, "is_primary": false, "name": "Perception", "name_en": "Perception", "label": "", "label_en": "" }
  ],
  "radar_details": [
    {
      "axis": "impact",
      "label_fr": "Impact",
      "label_en": "Impact",
      "score": 0,
      "explanation_fr": "",
      "explanation_en": ""
    },
    {
      "axis": "urgency",
      "label_fr": "Urgence",
      "label_en": "Urgency",
      "score": 0,
      "explanation_fr": "",
      "explanation_en": ""
    },
    {
      "axis": "uncertainty",
      "label_fr": "Incertitudes",
      "label_en": "Uncertainties",
      "score": 0,
      "explanation_fr": "",
      "explanation_en": ""
    },
    {
      "axis": "reversibility",
      "label_fr": "Réversibilité",
      "label_en": "Reversibility",
      "score": 0,
      "explanation_fr": "",
      "explanation_en": ""
    }
  ],
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
  "lecture_systeme_fr": "exactly 3 short paragraphs separated by blank lines, 120 to 180 words",
  "lecture_systeme_en": "same in EN"
}

Add a detailed pressure radar. The radar must not be only numeric.
For each axis, provide a score from 0 to 3 and a concrete explanation in French and English.
Each explanation must cite a real actor, organization, place, date, mechanism, or observable signal when available.
No generic wording.`

function enrichWithScoring(
  sc: Record<string, unknown>,
  branches: AstrolabeBranch[]
): Record<string, unknown> {
  const radar = sc.radar as RadarScores | undefined
  if (!radar) return sc
  const normalizedAstrolabe = normalizeAstrolabeScores(sc.astrolabe_scores, branches)
  const scoringBranches = astrolabeScoresToBranches(normalizedAstrolabe)

  const state =
    scoringBranches.length > 0
      ? computeState(scoringBranches, radar)
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
    astrolabe_scores: normalizedAstrolabe,
    state_index_final: state,
    state_label: getStateLabel(state, 'fr'),
    state_label_en: getStateLabel(state, 'en'),
  }
}

const ASTROLABE_CODES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as const
type AstrolabeCode = typeof ASTROLABE_CODES[number]

const ASTROLABE_NAMES_FR: Record<AstrolabeCode, string> = {
  I: 'Acteurs',
  II: 'Intérêts',
  III: 'Forces',
  IV: 'Tensions',
  V: 'Contraintes',
  VI: 'Incertitudes',
  VII: 'Temps',
  VIII: 'Perception',
}

const ASTROLABE_NAMES_EN: Record<AstrolabeCode, string> = {
  I: 'Actors',
  II: 'Interests',
  III: 'Forces',
  IV: 'Tensions',
  V: 'Constraints',
  VI: 'Uncertainty',
  VII: 'Time',
  VIII: 'Perception',
}

function clampAstrolabeScore(value: unknown): 0 | 1 | 2 | 3 {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(3, Math.round(score))) as 0 | 1 | 2 | 3
}

function normalizeAstrolabeScores(value: unknown, fallbackBranches: AstrolabeBranch[]) {
  const raw = Array.isArray(value) ? value : []
  const fallbackByBranch = new Map(
    fallbackBranches
      .filter((branch) => ASTROLABE_CODES.includes(branch.b as AstrolabeCode))
      .map((branch) => [branch.b, branch])
  )
  const rawByBranch = new Map<string, Record<string, unknown>>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Record<string, unknown>
    const branch = String(entry.branch ?? entry.b ?? '').toUpperCase()
    if (ASTROLABE_CODES.includes(branch as AstrolabeCode)) rawByBranch.set(branch, entry)
  }
  const maxRawScore = Array.from(rawByBranch.values()).reduce((max, entry) => (
    Math.max(max, clampAstrolabeScore(entry.display_score ?? entry.s))
  ), 0)
  const useFallbackScores = fallbackBranches.length > 0 && (rawByBranch.size < ASTROLABE_CODES.length || maxRawScore <= 1)

  let scores = ASTROLABE_CODES.map((branch) => {
    const rawEntry = useFallbackScores ? undefined : rawByBranch.get(branch)
    const fallback = fallbackByBranch.get(branch)
    return {
      branch,
      display_score: clampAstrolabeScore(rawEntry?.display_score ?? rawEntry?.s ?? fallback?.s ?? 1),
      is_primary: Boolean(rawEntry?.is_primary ?? rawEntry?.p ?? fallback?.p ?? false),
      name: ASTROLABE_NAMES_FR[branch],
      name_en: ASTROLABE_NAMES_EN[branch],
      label: cleanPublicText(String(rawEntry?.label ?? '')),
      label_en: cleanPublicText(String(rawEntry?.label_en ?? '')),
    }
  })

  let dominantCount = 0
  scores = scores.map((score) => {
    if (score.display_score !== 3) return score
    dominantCount += 1
    return dominantCount <= 2 ? score : { ...score, display_score: 2 as const }
  })

  let moderateCount = 0
  scores = scores.map((score) => {
    if (score.display_score !== 2) return score
    moderateCount += 1
    return moderateCount <= 3 ? score : { ...score, display_score: 1 as const }
  })

  const primaryCount = scores.filter((score) => score.is_primary).length
  if (primaryCount !== 1) {
    const strongest = scores.reduce((best, score) => (
      score.display_score > best.display_score ? score : best
    ), scores[0])
    scores = scores.map((score) => ({ ...score, is_primary: score.branch === strongest.branch }))
  }
  scores = scores.map((score) => (
    score.is_primary && score.display_score < 2
      ? { ...score, display_score: 2 as const }
      : score
  ))

  return scores
}

function astrolabeScoresToBranches(scores: ReturnType<typeof normalizeAstrolabeScores>): AstrolabeBranch[] {
  return scores.map((score) => ({
    b: score.branch,
    s: score.display_score,
    p: score.is_primary,
  }))
}

function hasTextSignal(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyDialogueClarifications(text: string): string {
  const parts = text.split(/\n\s*Pr[eé]cisions?\s*:\s*\n/i)
  if (parts.length < 2) return text

  let base = parts[0].trim()
  const clarification = parts.slice(1).join('\nPrécisions :\n')
  const entityClarification =
    /qui\s+ou\s+quoi\s+d[ée]signez-vous\s+par\s+[«"]([^»"]+)[»"]\s*\?\s*\n\s*([^\n]+)/i.exec(clarification) ||
    /qui\s+d[ée]signez-vous\s+par\s+[«"]([^»"]+)[»"]\s*\?\s*\n\s*([^\n]+)/i.exec(clarification) ||
    /que\s+d[ée]signez-vous\s+par\s+[«"]([^»"]+)[»"]\s*\?\s*\n\s*([^\n]+)/i.exec(clarification)
  const confirmationEntity =
    /je\s+comprends\s+que\s+vous\s+parlez\s+de\s+(.+?)\s+en\s+utilisant\s+(?:le\s+)?(?:terme|nom|mot)\s+['"«]?([^'"».\n]+)['"»]?.*?\n\s*([^\n]+)/i.exec(clarification)

  if (confirmationEntity) {
    const likelyReferent = confirmationEntity[1]?.trim()
    const uncertain = confirmationEntity[2]?.trim()
    const answer = confirmationEntity[3]?.trim()
    if (!likelyReferent || !uncertain || !answer) return text

    const isConfirmation = /^(oui|yes|ok|c(?:'|’)?est\s+(?:ça|cela)|exact|exactement|bien\s+s[uû]r)$/i.test(answer)
    const replacement = (isConfirmation ? likelyReferent : answer)
      .replace(/[.?!]+$/g, '')
      .trim()
    if (!replacement || replacement.length > 120) return text

    base = base.replace(new RegExp(`\\b${escapeRegExp(uncertain)}\\b`, 'gi'), replacement)
    return normalizeSubmittedSituation(base)
  }

  if (!entityClarification) return text

  const uncertain = entityClarification[1]?.trim()
  const answer = entityClarification[2]?.trim()
  if (!uncertain || !answer || answer.length > 80) return text

  const replacement = answer.replace(/[.?!]+$/g, '').trim()
  if (!replacement) return text

  base = base.replace(new RegExp(`\\b${escapeRegExp(uncertain)}\\b`, 'gi'), replacement)
  return normalizeSubmittedSituation(base)
}

function inferAstrolabeBranches(situation: string, intentContext: IntentContext): AstrolabeBranch[] {
  const text = situation.toLowerCase()
  const isWarOrCrisis = hasTextSignal(text, [/\b(guerre|frappe|missile|attaque|gaza|ukraine|otan|cessez-le-feu|escalade|nucl[eé]aire)\b/i])
  const isPublicPosition = hasTextSignal(text, [/\b(position|s['’ ]?exprime|silence|discours|d[eé]claration|posture|ligne officielle)\b/i])
  const isCausal = intentContext.interpreted_request?.question_type === 'causal_attribution'
  const isSite = intentContext.interpreted_request?.question_type === 'site_analysis' || /\bhttps?:\/\/|site\b/i.test(situation)
  const isPersonal = intentContext.interpreted_request?.domain === 'personal' || hasTextSignal(text, [/\b(fils|fille|parent|couple|famille|ado|adolescent|relation)\b/i])
  const isDecision = intentContext.interpreted_request?.intent_type === 'decide' || hasTextSignal(text, [/\b(comment r[eé]agir|que faire|dois-je|faut-il|choisir|d[eé]cider)\b/i])

  const scores = new Map<AstrolabeCode, 0 | 1 | 2 | 3>(
    ASTROLABE_CODES.map((branch) => [branch, 1 as 0 | 1 | 2 | 3])
  )
  let primary: AstrolabeCode = 'III'

  if (isWarOrCrisis) {
    primary = isPublicPosition ? 'VIII' : 'IV'
    scores.set('IV', isPublicPosition ? 2 : 3)
    scores.set('V', 2)
    scores.set('VI', 2)
    if (isPublicPosition) scores.set('VIII', 3)
  }

  if (isCausal) {
    primary = 'VI'
    scores.set('VI', 3)
    scores.set('I', 2)
    scores.set('IV', Math.max(scores.get('IV') ?? 1, 2) as 2 | 3)
  } else if (isSite) {
    primary = 'III'
    scores.set('III', 2)
    scores.set('VI', 2)
    scores.set('VIII', 2)
  } else if (isPersonal) {
    primary = isDecision ? 'I' : 'VI'
    scores.set('I', 2)
    scores.set('VI', 2)
    scores.set('VIII', 2)
  } else if (isDecision && !isWarOrCrisis) {
    primary = 'II'
    scores.set('II', 2)
    scores.set('V', 2)
    scores.set('VI', 2)
  }

  return ASTROLABE_CODES.map((branch) => ({
    b: branch,
    s: scores.get(branch) ?? 1,
    p: branch === primary,
  }))
}

function firstText(values: unknown[], fallback: string): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

function ensureList(value: unknown, fallback: string[]): string[] {
  const list = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : []
  return [...list, ...fallback].filter(Boolean).slice(0, 3)
}

function cleanPublicText(text: string): string {
  return text
    .replace(/\n{2,}\s*(?:Ressources|Resources|Sources)\b[\s\S]*$/i, '')
    .replace(/\b(?:general_analysis|understand_situation|site_analysis|startup_investment|personal_relationship)\b/gi, '')
    .replace(/\bLa question décisive est simple\s*:\s*quel acteur, quel geste, quelle règle ou quelle preuve peut transformer l[’']hypothèse en fait observable\s*\??/gi, '')
    .replace(/\bDes éléments visibles existent, mais leur portée reste à établir par des preuves concrètes\.?/gi, '')
    .replace(/\bUn objet visible garde un rôle parce qu[’']il condense des rapports de confiance, de preuve et de pouvoir\.?/gi, '')
    .replace(/\bLa situation tient encore par\s+et\s+/gi, 'La situation tient encore par ')
    .replace(/\s*\((?:peuvent?|transforme|rendent?|réduit|ouvrent?|donnent?|gardent?|portent?|cadre|condense)[^)]{8,}\)/gi, '')
    .replace(/\bDirigeants et partis,\s*Institutions,\s*Opinion publique,\s*Médias et récits publics,\s*Calendrier politique\b/gi, '')
    .replace(/\bCe qui l’affaiblit\s*\n+\s*,\s*c[’']est\b/gi, 'Ce qui l’affaiblit\n\nC’est')
    .replace(/\bCe qui l'affaiblit\s*\n+\s*,\s*c[’']est\b/gi, "Ce qui l'affaiblit\n\nC’est")
    .replace(/\bCe qui l’affaiblit\s*,\s*c[’']est\b/gi, 'Ce qui l’affaiblit, c’est')
    .replace(/\bCe qui l'affaiblit\s*,\s*c[’']est\b/gi, "Ce qui l'affaiblit, c’est")
    .replace(/\s*\((?:nom propre|acronyme)\s+(?:cit[eé]\s+dans\s+la\s+situation|[aà]\s+(?:identifier|expliciter))\)/gi, '')
    .replace(/\s*\((?:pr[eé]sident|pays|conflit|nom propre)[^)]{8,}\)/gi, '')
    .replace(/\bSC n[’']a pas encore une compr[eé]hension suffisante du site officiel de\b[^.?!]*[.?!]?/gi, '')
    .replace(/\bLa carte ne doit donc pas inventer une activit[eé], une cible ou un segment [^.?!]*[.?!]?/gi, '')
    .replace(/\bLa bonne lecture est une suspension prudente\s*:\s*il faut d[’']abord identifier l[’']URL officielle[^.?!]*[.?!]?/gi, '')
    .replace(/\bLe prochain signal utile n[’']est pas une conclusion sur le march[eé] vis[eé][^.?!]*[.?!]?/gi, '')
    .replace(/acteurs et s[eé]quences disponibles dans la situation fournie/gi, '')
    .replace(/ressources web absentes ou non stabilis[eé]es/gi, '')
    .replace(/ressources absentes|ressources web absentes|web absent/gi, '')
    .replace(/non stabilis[eé]es?/gi, '')
    .replace(/premi[eè]re lecture structurelle/gi, '')
    .replace(/[aà] partir des signaux disponibles/gi, '')
    .replace(/sans actualisation web disponible/gi, '')
    .replace(/fallback|parse|json|mod[eè]le|model/gi, '')
    .replace(/\bvalidation concrète du face\b/gi, 'validation concrète face')
    .replace(/\bdu face aux exigences\b/gi, 'face aux exigences')
    .replace(/\bdu face au marché\b/gi, 'face au marché')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const SC_PUBLIC_TEXT_FIELDS = new Set([
  'title_fr',
  'title_en',
  'submitted_situation_fr',
  'submitted_situation_en',
  'insight_fr',
  'insight_en',
  'main_vulnerability_fr',
  'main_vulnerability_en',
  'asymmetry_fr',
  'asymmetry_en',
  'key_signal_fr',
  'key_signal_en',
  'hook_fr',
  'hook_en',
  'watch_fr',
  'watch_en',
  'avertissement_fr',
  'avertissement_en',
  'lecture_systeme_fr',
  'lecture_systeme_en',
  'label',
  'label_en',
  'label_fr',
  'explanation_fr',
  'explanation_en',
  'description_fr',
  'description_en',
  'signal_fr',
  'signal_en',
])

const SC_PUBLIC_TEXT_ARRAY_FIELDS = new Set([
  'movements_fr',
  'movements_en',
  'constraints_fr',
  'constraints_en',
  'uncertainties_fr',
  'uncertainties_en',
])

function sanitizeScPublicValue(value: unknown, key = ''): unknown {
  if (typeof value === 'string') {
    return SC_PUBLIC_TEXT_FIELDS.has(key) ? cleanPublicText(value) : value
  }
  if (Array.isArray(value)) {
    if (SC_PUBLIC_TEXT_ARRAY_FIELDS.has(key)) {
      return value.map((item) => typeof item === 'string' ? cleanPublicText(item) : item)
    }
    return value.map((item) => sanitizeScPublicValue(item, key))
  }
  if (!value || typeof value !== 'object') return value
  if (key === 'resources' || key === 'arbre_a_cames' || key === 'intent_context' || key === 'coverage_check') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
      childKey,
      sanitizeScPublicValue(childValue, childKey),
    ])
  )
}

function sanitizeSituationCardPublicText(sc: SituationCard): SituationCard {
  return sanitizeScPublicValue(sc) as SituationCard
}

function stripEntityExplanations(text: string): string {
  return cleanPublicText(text)
    .replace(/\s*\([^)]{8,}\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const HEADER_STOP_WORDS = /^(a|à|au|aux|avec|ce|ces|cet|cette|comme|d|de|des|du|dans|dont|elle|elles|en|et|est|il|ils|la|le|les|leur|leurs|ne|ou|où|par|pas|plus|pour|que|quel|quelle|quels|quelles|qui|quoi|sa|se|ses|son|sur|un|une|y)$/i
const HEADER_TOPIC_FILLER_WORDS = /^(analyse|avis|comprendre|lecture|perdre|perte|position|question|risque|rôle|role|situation)$/i

function meaningfulHeaderWords(value: string): string[] {
  return stripEntityExplanations(value)
    .replace(/[?!.:;,()[\]{}]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !HEADER_STOP_WORDS.test(word))
}

function canonicalHeaderSubject({
  entities,
  object,
  fallback,
}: {
  entities: string[]
  object?: string
  fallback: string
}): string {
  const entityWords = entities.flatMap(meaningfulHeaderWords)
  const objectWords = meaningfulHeaderWords(cleanPublicText(object ?? ''))
    .filter((word) => !HEADER_TOPIC_FILLER_WORDS.test(word))
  const fallbackWords = meaningfulHeaderWords(fallback)
    .filter((word) => !HEADER_TOPIC_FILLER_WORDS.test(word))

  const words: string[] = []
  for (const word of [...entityWords, ...objectWords, ...fallbackWords]) {
    if (words.some((item) => item.toLowerCase() === word.toLowerCase())) continue
    words.push(word)
    if (words.length >= 4) break
  }

  return words.join(' ')
}

function atlasDomainLabel(sc: SituationCard): string {
  const interpreted = sc.intent_context?.interpreted_request ?? sc.coverage_check?.intent_context?.interpreted_request
  if (interpreted?.question_type === 'site_analysis' || sc.intent_context?.dominant_frame === 'site_analysis') {
    return 'Site'
  }

  const domain =
    sc.intent_context?.interpreted_request?.domain ??
    sc.intent_context?.surface_domain ??
    sc.coverage_check?.intent_context?.interpreted_request?.domain ??
    sc.coverage_check?.intent_context?.surface_domain ??
    sc.coverage_check?.domain ??
    'general'

  const labels: Record<string, string> = {
    geopolitics: 'Géopolitique',
    war: 'Guerre',
    management: 'Management',
    personal: 'Personnel',
    professional: 'Professionnel',
    governance: 'Gouvernance',
    startup_vc: 'Startup',
    economy: 'Économie',
    humanitarian: 'Humanitaire',
    general: 'Général',
  }
  return labels[domain] ?? 'Général'
}

function ensureMinimumSubjectWords(subject: string, fallback: string): string {
  const cleanSubject = stripEntityExplanations(subject)
  const meaningful = meaningfulHeaderWords(cleanSubject)
  if (meaningful.length >= 3) return cleanSubject
  const fallbackWords = meaningfulHeaderWords(fallback)
  return [...cleanSubject.split(/\s+/).filter(Boolean), ...fallbackWords]
    .filter((word, index, list) => list.findIndex((item) => item.toLowerCase() === word.toLowerCase()) === index)
    .filter((word) => word.length > 1 && !HEADER_STOP_WORDS.test(word))
    .slice(0, 4)
    .join(' ')
}

function compactHeaderTitle(sc: SituationCard, situation: string): string {
  const interpreted = sc.intent_context?.interpreted_request ?? sc.coverage_check?.intent_context?.interpreted_request
  const labels = (interpreted?.entity_explanations ?? [])
    .map((item) => stripEntityExplanations(item.label))
    .filter((label) => label && !/^(Iran|France|Isra[eë]l|Gaza|Ukraine|Russie|Chine|États-Unis|Etats-Unis)$/i.test(label))
  const question = `${interpreted?.user_question ?? ''} ${situation}`
  const first = labels[0] ?? ''
  const second = labels.find((label) => label !== first) ?? ''
  const domain = atlasDomainLabel(sc)
  const dialogueHeaderSubject = typeof (sc.coverage_check as Record<string, unknown> | undefined)?.canonical_header_subject === 'string'
    ? String((sc.coverage_check as Record<string, unknown>).canonical_header_subject).trim()
    : ''
  if (dialogueHeaderSubject) {
    return `${domain} · ${ensureMinimumSubjectWords(dialogueHeaderSubject, question)}`
  }
  let subject = ''

  if (interpreted?.question_type === 'site_analysis') {
    const object = stripEntityExplanations(cleanPublicText(interpreted.object_of_analysis ?? ''))
      .replace(/\b(que fait|site|page|est ce interessant|est-ce intéressant)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    subject = first ? `Site ${first}` : object ? `Analyse site ${object}` : 'Analyse du site'
    return `${domain} · ${ensureMinimumSubjectWords(subject, question)}`
  }
  if (interpreted?.question_type === 'causal_attribution') {
    const causal = buildCausalMatter({ situation, sc })
    subject = canonicalHeaderSubject({
      entities: [causal.sourceActor, causal.targetActor].filter((item) => item && !/^l[’']?acteur suppos[ée]/i.test(item)),
      object: causal.event,
      fallback: question,
    })
    return `${domain} · ${ensureMinimumSubjectWords(subject, question)}`
  }
  if (/\bposition\b|\bquelle est sa position\b/i.test(question) && first) {
    subject = `Position de ${first}`
    return `${domain} · ${ensureMinimumSubjectWords(subject, question)}`
  }
  if (interpreted?.domain === 'personal') {
    const theatre = sc.concrete_theatre ?? sc.coverage_check?.concrete_theatre
    const theatreActors = Array.isArray(theatre?.actors) ? theatre.actors : []
    const theatrePlaces = Array.isArray(theatre?.places) ? theatre.places : []
    const theatreMechanisms = Array.isArray(theatre?.mechanisms) ? theatre.mechanisms : []
    const personalParts = [
      ...labels,
      ...theatreActors.filter((item) => !/^l[’']?utilisateur$/i.test(item)),
      ...theatrePlaces,
      ...theatreMechanisms.filter((item) => /\b(message|coeur|cœur|rendez[-\s]?vous|venue|dix\s+ans|10\s*ans)\b/i.test(item)),
    ]
      .map((item) => stripEntityExplanations(cleanPublicText(item)).replace(/^l[’']\s*/i, '').trim())
      .filter(Boolean)
    subject = canonicalHeaderSubject({
      entities: personalParts.slice(0, 4),
      object: interpreted.object_of_analysis,
      fallback: question,
    }) || personalParts.slice(0, 4).join(' ') || 'Lien personnel'
    return `${domain} · ${ensureMinimumSubjectWords(subject, question)}`
  }
  if (interpreted?.intent_type === 'understand' && interpreted.object_of_analysis) {
    subject = canonicalHeaderSubject({
      entities: labels,
      object: interpreted.object_of_analysis,
      fallback: question,
    })
    return `${domain} · ${ensureMinimumSubjectWords(subject || first || 'Lecture structurelle', question)}`
  }
  const raw = stripEntityExplanations(firstText([sc.title_fr, sc.title], 'Lecture structurelle'))
  const words = raw.split(/\s+/).filter(Boolean)
  if (words.length > 4 || /^(position|avis|lecture|analyse)\b.+\b(sur|de|du|des|face|concernant)\b/i.test(raw)) {
    subject = canonicalHeaderSubject({
      entities: labels,
      object: interpreted?.object_of_analysis || raw,
      fallback: question,
    }) || 'Lecture structurelle'
    return `${domain} · ${ensureMinimumSubjectWords(subject, question)}`
  }
  return `${domain} · ${ensureMinimumSubjectWords(raw, question)}`
}

function enforceHeaderContract(sc: SituationCard, situation: string): SituationCard {
  return {
    ...sc,
    title_fr: compactHeaderTitle(sc, situation),
    title_en: stripEntityExplanations(cleanPublicText(firstText([sc.title_en, sc.title], 'Structural reading'))).split(/\s+/).slice(0, 4).join(' '),
  }
}

function comparableText(text: string): string {
  return cleanPublicText(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function looksLikeUnprocessedInput(value: string, situation: string): boolean {
  const candidate = comparableText(value)
  const input = comparableText(situation)
  if (!candidate || !input) return false
  if (/\b(?:objet|tension)\s+interpr[ée]t[ée]|\bunderstand_situation\b|\bActeurs visibles\b|\bContraintes mat[ée]rielles\b|\bR[èe]gles et institutions\b|\bR[ée]cit dominant\b/i.test(value)) return true
  if (candidate.endsWith('?') && candidate.length > 25) return true
  if (input.length > 30 && candidate.includes(input)) return true
  if (candidate.length > 30 && input.includes(candidate)) return true
  const candidateWords = new Set(candidate.split(' ').filter((word) => word.length > 3))
  const inputWords = input.split(' ').filter((word) => word.length > 3)
  if (candidateWords.size < 4 || inputWords.length < 6) return false
  const overlap = inputWords.filter((word) => candidateWords.has(word)).length
  return overlap / Math.max(1, Math.min(inputWords.length, candidateWords.size)) > 0.75
}

function safePublicText(value: unknown, situation: string, fallback: string): string {
  const text = typeof value === 'string' ? cleanPublicText(value) : ''
  if (!text || looksLikeUnprocessedInput(text, situation)) return fallback
  return text
}

function firstSafeText(values: unknown[], situation: string, fallback: string): string {
  for (const value of values) {
    const text = safePublicText(value, situation, '')
    if (text) return text
  }
  return fallback
}

function powersLabel(arbre: ArbreACamesAnalysis, fallback = 'acteurs, contraintes et temporalités'): string {
  const names = arbre.powers_in_presence?.primary
    ?.map((power) => cleanPublicText(power.name))
    .filter(Boolean)
    .slice(0, 4)
  return names && names.length > 0 ? names.join(', ') : fallback
}

function sentenceFragment(text: string): string {
  return cleanPublicText(text).replace(/[.;:]+$/g, '')
}

function conciseTrajectorySubject(value: string): string {
  const text = sentenceFragment(value)
  if (!text) return 'ce point'
  if (text.length <= 72) return text
  if (/\brisque|crainte|peur|menace\b/i.test(text)) return 'ce risque'
  if (/\bhypoth[eè]se|causal|preuve|attribu/i.test(text)) return 'cette hypothèse'
  if (/\bd[ée]cision|arbitrage|choix\b/i.test(text)) return 'cette décision'
  return 'ce point'
}

function cleanList(list: string[]): string[] {
  return list.map(cleanPublicText).filter(Boolean)
}

function uniqueCleanList(list: string[]): string[] {
  const seen = new Set<string>()
  const hasAngleMort = { value: false }
  const result: string[] = []
  for (const item of cleanList(list)) {
    const key = comparableText(item)
    const isBlindSpotGeneric = /angle mort|angles morts|blind spots?|incertitudes? sur les intentions|hypoth[eè]ses? implicites/i.test(item)
    const normalizedKey = isBlindSpotGeneric ? 'blind-spot-generic' : key
    if (!normalizedKey || seen.has(normalizedKey)) continue
    if (isBlindSpotGeneric && hasAngleMort.value) continue
    if (isBlindSpotGeneric) hasAngleMort.value = true
    seen.add(normalizedKey)
    result.push(item)
  }
  return result
}

const UNIVERSAL_BLIND_SPOT_FR =
  'Chercher ce qui pourrait renverser la lecture : relations longues, réseaux d’influence, cadre légal ou institutionnel, argent, travail, rôle de l’État, normes sociales, infrastructures, coûts cachés ou hypothèses implicites.'
const UNIVERSAL_BLIND_SPOT_EN =
  'Look for what could reverse the reading: long-standing relationships, influence networks, legal or institutional frame, money, work, state power, social norms, infrastructures, hidden costs, or implicit assumptions.'
const PERSONAL_BLIND_SPOT_FR =
  'Chercher ce qui reste invisible dans le lien : honte, fatigue, besoin de sauver la face, peur de décevoir, attente non dite, tentative de réparation, interprétation du silence ou autonomie adolescente.'
const PERSONAL_BLIND_SPOT_EN =
  'Look for what remains invisible in the bond: shame, fatigue, face-saving, fear of disappointing, unspoken expectation, repair attempt, interpretation of silence, or adolescent autonomy.'
const ENQUIRY_REBOUND_FR =
  'Rebond d’enquête : choisir l’absence la plus décisive et vérifier quelle preuve pourrait renverser la lecture.'
const ENQUIRY_REBOUND_EN =
  'Inquiry rebound: choose the most decisive absence and verify what proof could reverse the reading.'

function ensureBlindSpotFr(list: string[]): string[] {
  const cleaned = uniqueCleanList(list).map(toInquiryFr).filter(Boolean)
  const hasBlindSpot = cleaned.some((item) => /chercher|v[eé]rifier|rep[eé]rer|quelle preuve|relation|r[eé]seau|l[eé]gal|institution|argent|travail|[eé]tat|norme|infrastructure|hypoth[eè]se/i.test(item))
  return (hasBlindSpot ? cleaned : [...cleaned, UNIVERSAL_BLIND_SPOT_FR]).slice(0, 4)
}

function ensureBlindSpotEn(list: string[]): string[] {
  const cleaned = uniqueCleanList(list).map(toInquiryEn).filter(Boolean)
  const hasBlindSpot = cleaned.some((item) => /look for|verify|identify|what proof|relationship|network|legal|institution|money|work|state|norm|infrastructure|assumption/i.test(item))
  return (hasBlindSpot ? cleaned : [...cleaned, UNIVERSAL_BLIND_SPOT_EN]).slice(0, 4)
}

function toInquiryFr(item: string): string {
  const text = cleanPublicText(item)
  if (/^demande de /i.test(text)) return ''
  if (/^angles morts relationnels/i.test(text)) return PERSONAL_BLIND_SPOT_FR
  if (/^angles morts/i.test(text)) return UNIVERSAL_BLIND_SPOT_FR
  if (/^incertitudes sur ce qui est attendu/i.test(text)) {
    return 'Chercher ce que chacun attendait sans le dire, ce qui a été exprimé clairement et ce qui relève d’une projection.'
  }
  if (/^incertitudes sur les intentions/i.test(text)) {
    return 'Chercher quelles intentions, informations manquantes, seuils de rupture ou effets secondaires pourraient changer la lecture.'
  }
  if (/^incertitudes sur /i.test(text)) return text.replace(/^Incertitudes sur /i, 'Vérifier ')
  if (/^seuil exact/i.test(text)) {
    return text
      .replace(/^Seuil exact à partir duquel/i, 'Repérer le moment où')
      .replace(/pour tous les acteurs\.?$/i, 'dans le lien.')
  }
  return text
}

function toInquiryEn(item: string): string {
  const text = cleanPublicText(item)
  if (/^request for /i.test(text)) return ''
  if (/^relational blind spots/i.test(text)) return PERSONAL_BLIND_SPOT_EN
  if (/^blind spots/i.test(text)) return UNIVERSAL_BLIND_SPOT_EN
  if (/^uncertainties about what is expected/i.test(text)) {
    return 'Look for what each person expected without saying it, what was clearly expressed, and what may be projection.'
  }
  if (/^uncertainties about /i.test(text)) return text.replace(/^Uncertainties about /i, 'Verify ')
  if (/^exact threshold/i.test(text)) return text.replace(/^Exact threshold at which/i, 'Identify when')
  return text
}

function ensureContextualBlindSpotFr(list: string[], intentContext?: IntentContext): string[] {
  const domain = intentContext?.interpreted_request?.domain ?? intentContext?.surface_domain
  if (domain !== 'personal' && intentContext?.dominant_frame !== 'personal_relationship') return ensureBlindSpotFr(list)
  const cleaned = uniqueCleanList(list).map(toInquiryFr).filter((item) =>
    Boolean(item) &&
    !/argent|travail|[ée]tat|infrastructures?|d[ée]cision client|revenus?|traction|march[ée]/i.test(item) &&
    !/^demande de /i.test(item)
  )
  const hasRelational = cleaned.some((item) => /chercher|v[eé]rifier|rep[eé]rer|honte|fatigue|face|d[eé]cevoir|attente|r[eé]paration|silence|autonomie|adolescent/i.test(item))
  return (hasRelational ? cleaned : [...cleaned, PERSONAL_BLIND_SPOT_FR]).slice(0, 4)
}

function ensureContextualBlindSpotEn(list: string[], intentContext?: IntentContext): string[] {
  const domain = intentContext?.interpreted_request?.domain ?? intentContext?.surface_domain
  if (domain !== 'personal' && intentContext?.dominant_frame !== 'personal_relationship') return ensureBlindSpotEn(list)
  const cleaned = uniqueCleanList(list).map(toInquiryEn).filter((item) =>
    Boolean(item) &&
    !/money|work|state|infrastructure|customer decision|revenue|traction|market/i.test(item) &&
    !/^request for /i.test(item)
  )
  const hasRelational = cleaned.some((item) => /look for|verify|identify|shame|fatigue|face|disappoint|expectation|repair|silence|autonomy|teen/i.test(item))
  return (hasRelational ? cleaned : [...cleaned, PERSONAL_BLIND_SPOT_EN]).slice(0, 4)
}

function normalizeRadarBlindSpotLabels(details: unknown): unknown {
  if (!Array.isArray(details)) return details
  return details.map((item) => {
    if (!item || typeof item !== 'object') return item
    const entry = item as Record<string, unknown>
    if (entry.axis !== 'uncertainty') return item
    return {
      ...entry,
      label_fr: 'Incertitudes',
      label_en: 'Uncertainties',
    }
  })
}

function listFromAxis(value: unknown, fallback: string[], situation = ''): string[] {
  const list = Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => cleanPublicText(item))
    : []
  return uniqueCleanList([...list, ...fallback])
    .map(cleanPublicText)
    .filter((item) => Boolean(item) && (!situation || !looksLikeUnprocessedInput(item, situation)))
    .slice(0, 4)
}

function defaultTrajectories(arbre: ArbreACamesAnalysis, situation: string) {
  const powers = powersLabel(arbre)
  const tension = firstSafeText(
    [arbre.tensions?.[0], arbre.load_bearing_contradiction],
    situation,
    'une force réelle impose son rythme sans clarification'
  )

  return [
    {
      type: 'stabilization',
      title_fr: 'Cohérence temporaire',
      title_en: 'Temporary coherence',
      description_fr: `La situation se stabilise si les forces principales retrouvent un cadre lisible : ${powers}.`,
      description_en: 'The situation stabilizes if the main forces regain a legible frame.',
      signal_fr: 'Un accord, une limite, un rôle ou un calendrier rend l’action à nouveau lisible.',
      signal_en: 'Fewer rupture signals and renewed coordination channels.',
    },
    {
      type: 'escalation',
      title_fr: 'Usure cumulative',
      title_en: 'Cumulative attrition',
      description_fr: `La pression augmente lorsque ${sentenceFragment(tension).toLowerCase()}. Les coûts deviennent alors plus visibles.`,
      description_en: 'Pressure rises if a real force imposes its tempo and makes costs more visible.',
      signal_fr: 'Un refus, un blocage, une dépense ou une prise de parole oblige les acteurs à se repositionner.',
      signal_en: 'Harder public positions, more visible costs, or blocked mediation.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Changement de logique',
      title_en: 'Logic shift',
      description_fr: 'La logique change quand le point fragile devient une décision, un coût, un refus ou un seuil observable.',
      description_en: 'The logic shifts when the fragile point becomes a decision, cost, refusal, or observable threshold.',
      signal_fr: 'Une force jusque-là implicite devient explicite et oblige à changer de cadre.',
      signal_en: 'A decisive actor stops playing by the rules that still held the balance.',
    },
  ]
}

function interpretedObject(sc?: SituationCard): string {
  return cleanPublicText(sc?.intent_context?.interpreted_request?.object_of_analysis ?? '').replace(/[.;:]+$/g, '')
}

function capitalizeFirst(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value
}

function afterDe(value: string): string {
  const text = value.trim()
  if (/^le\s+/i.test(text)) return `du ${text.replace(/^le\s+/i, '')}`
  if (/^les\s+/i.test(text)) return `des ${text.replace(/^les\s+/i, '')}`
  if (/^la\s+/i.test(text)) return `de la ${text.replace(/^la\s+/i, '')}`
  if (/^l[’']\s*/i.test(text)) return `de l’${text.replace(/^l[’']\s*/i, '')}`
  if (/^(risque|rôle|role|avis|position|question|hypoth[eè]se)\b/i.test(text)) return `du ${text}`
  return `de ${text}`
}

function isExperienceExplanationFrame(intentContext?: IntentContext): boolean {
  return intentContext?.dominant_frame === 'experience_explanation'
}

function experienceLexicon(situation: string, objectLabel: string) {
  const subject = /\bcarpe|p[eê]che|no\s*kill|poisson|eau|rivière|riviere|étang|etang\b/i.test(situation)
    ? 'la pêche no kill'
    : objectLabel
  const concrete = /\bcarpe\b/i.test(situation)
    ? 'la carpe, l’attente, la lecture de l’eau, le combat, le soin du poisson et la remise à l’eau'
    : 'les gestes, l’attente, l’attention, le cadre, le corps et le récit que la pratique rend possibles'
  return { subject, concrete }
}

function experienceTrajectories(subject: string) {
  return [
    {
      type: 'stabilization',
      title_fr: 'Expérience lisible',
      title_en: 'Legible experience',
      description_fr: `${capitalizeFirst(subject)} devient compréhensible si l’on décrit la séquence vécue, pas seulement le résultat visible.`,
      description_en: 'The experience becomes understandable when the lived sequence is described, not only the visible result.',
      signal_fr: 'Les gestes, l’attente, l’attention et le relâchement deviennent racontables sans justification forcée.',
      signal_en: 'Gestures, waiting, attention, and release can be described without forced justification.',
    },
    {
      type: 'escalation',
      title_fr: 'Malentendu durable',
      title_en: 'Lasting misunderstanding',
      description_fr: `La tension augmente si ${subject} est réduit à une contradiction extérieure ou à une simple habitude.`,
      description_en: 'Tension rises if the practice is reduced to an outside contradiction or a mere habit.',
      signal_fr: 'L’explication tourne en défense morale au lieu de rendre l’expérience concrète.',
      signal_en: 'The explanation becomes moral defence instead of making the experience concrete.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Sens déplacé',
      title_en: 'Meaning shifts',
      description_fr: 'La logique change quand on comprend que le plaisir vient moins de posséder que de lire, approcher, maîtriser puis relâcher.',
      description_en: 'The logic shifts when pleasure is understood as reading, approaching, mastering, then releasing rather than possessing.',
      signal_fr: 'La capture cesse d’être le centre unique ; la relation au milieu devient la vraie preuve.',
      signal_en: 'The catch stops being the only center; the relation to the environment becomes the real proof.',
    },
  ]
}

function experienceRadarDetails(subject: string) {
  return [
    {
      axis: 'impact' as const,
      label_fr: 'Impact',
      label_en: 'Impact',
      score: 1,
      explanation_fr: `L’impact est limité mais réel : mal expliquer ${subject} peut le faire passer pour une contradiction alors qu’il s’agit d’une expérience codée.`,
      explanation_en: 'Impact is limited but real: poorly explaining the practice can make it look contradictory rather than coded.',
    },
    {
      axis: 'urgency' as const,
      label_fr: 'Urgence',
      label_en: 'Urgency',
      score: 0,
      explanation_fr: 'Il n’y a pas d’urgence décisionnelle ; la pression porte surtout sur la qualité de l’explication.',
      explanation_en: 'There is no decision urgency; pressure lies mainly in the quality of explanation.',
    },
    {
      axis: 'uncertainty' as const,
      label_fr: 'Incertitudes',
      label_en: 'Uncertainties',
      score: 1,
      explanation_fr: 'L’incertitude porte sur ce que l’interlocuteur ne voit pas : attente, maîtrise technique, soin du vivant, communauté ou souvenir.',
      explanation_en: 'Uncertainty concerns what the listener does not see: waiting, technical mastery, care for the living, community, or memory.',
    },
    {
      axis: 'reversibility' as const,
      label_fr: 'Réversibilité',
      label_en: 'Reversibility',
      score: 3,
      explanation_fr: 'La lecture est très réversible : une bonne description des gestes et du milieu peut transformer rapidement la compréhension.',
      explanation_en: 'The reading is highly reversible: a good description of gestures and environment can quickly change understanding.',
    },
  ]
}

function rootDomainName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '')
    const parts = host.split('.')
    return parts.length > 1 ? parts[parts.length - 2] ?? host : host
  } catch {
    return ''
  }
}

function siteBrief(resources: ResourceItem[], requestedName = '', situation = ''): ResourceItem | undefined {
  const brief = resources.find((resource) => resource.type === 'site-brief')
  if (!brief) return undefined
  if (/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(situation)) return brief
  const requested = comparableText(requestedName).replace(/\b(site|page|plateforme|application|app|service|outil)\b/g, '').trim()
  if (!requested) return brief
  const root = comparableText(rootDomainName(brief.url))
  return root === requested ? brief : undefined
}

function lineAfterPrefix(value: string, prefix: string): string {
  const line = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()))
  return cleanPublicText(line?.slice(prefix.length).replace(/^[:\s]+/, '') ?? '')
}

function isEstablishedSiteField(value: string): boolean {
  const text = cleanPublicText(value)
  return Boolean(text) &&
    !/^non [ée]tabli/i.test(text) &&
    !/doit d[’']abord être (?:identifi[eé]|expliqu[eé]|compris)/i.test(text) &&
    text.length >= 35
}

function siteNameFromBrief(brief: ResourceItem | undefined, fallback: string): string {
  const titleName = cleanPublicText(brief?.title.replace(/^Fiche site\s*-\s*/i, '') ?? '')
  if (titleName) return titleName
  try {
    return new URL(brief?.url ?? '').hostname.replace(/^www\./, '') || fallback
  } catch {
    return fallback
  }
}

function frenchSiteProduct(company: string, product: string): string {
  if (/platform that helps you start,\s*grow,\s*and manage your business/i.test(product)) {
    return `${company} se présente comme une plateforme qui aide à créer, développer et gérer une entreprise, avec une promesse de simplicité, d’équité et de transparence.`
  }
  return product
}

function sentenceWithPeriod(value: string): string {
  const text = cleanPublicText(value).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function siteAnalysisFallbackCard({
  situation,
  arbre,
  resources,
  branches,
  intentContext,
}: {
  situation: string
  arbre: ArbreACamesAnalysis
  resources: ResourceItem[]
  branches: AstrolabeBranch[]
  intentContext?: IntentContext
}): SituationCard | null {
  const intent = intentContext?.interpreted_request?.intent_type
  const frame = intentContext?.dominant_frame
  const canUseSiteBrief =
    frame === 'site_analysis' ||
    frame === 'startup_investment' ||
    ((intent === 'evaluate' || intent === 'understand' || intent === 'compare') && frame === 'general_analysis')
  if (!canUseSiteBrief) return null

  const objectName = cleanPublicText(intentContext?.interpreted_request?.object_of_analysis ?? '')
    .replace(/^(?:le|la|les|un|une)\s+(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?/i, '')
    .replace(/^(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?/i, '')
    .replace(/[.;:]+$/g, '')
    .trim()
  const brief = siteBrief(resources, objectName, situation)
  const hasExplicitSiteSignal =
    /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(situation) ||
    /\b(site|page|plateforme|application|app|service|outil)\b/i.test(situation) ||
    resources.some((resource) => resource.type === 'site-brief')
  const hasExplicitUrlSignal = hasExplicitUrl(situation)
  if (frame === 'general_analysis' && !hasExplicitSiteSignal) return null
  if (!brief && frame !== 'site_analysis' && frame !== 'startup_investment') return null
  const excerpt = brief?.excerpt ?? ''
  const company = siteNameFromBrief(brief, objectName || 'ce site')
  const product = lineAfterPrefix(excerpt, 'Ce que fait l’entreprise') ||
    lineAfterPrefix(excerpt, 'Ce que le site permet d’établir') ||
    `${company} doit d’abord être identifié à partir du contenu utile disponible : produit, cible, usage, preuves visibles et angles morts.`
  const productIsEstablished = isEstablishedSiteField(product)
  const productFr = frenchSiteProduct(company, product)
  const proofLine = lineAfterPrefix(excerpt, 'Preuves ou signaux visibles')
  const proof = proofLine && !/^non [ée]tabli/i.test(proofLine) ? proofLine :
    'Les preuves visibles restent à qualifier : clients, usage répété, revenus, partenariats, rétention ou décisions d’achat.'
  const market = /march[eé]\s+europ|europe|europ[eé]en/i.test(situation)
    ? 'le marché européen'
    : 'le marché visé'
  const marketPrep = market === 'le marché visé' ? 'au marché visé' : `au ${market}`
  const productSentence = sentenceWithPeriod(productFr)
  const proofSentence = sentenceWithPeriod(proof)
  const title = productIsEstablished
    ? `${company} sur ${market}`.replace(/\s+/g, ' ').trim()
    : `${company} à identifier`.replace(/\s+/g, ' ').trim()
  const vulnerability =
    `Le point fragile est l’écart entre la promesse visible de ${company} et les preuves observables de marché, d’usage et de différenciation.`
  const asymmetry =
    `${company} peut rendre une promesse lisible sur son site, mais l’analyse doit vérifier ce que les clients, usages, revenus ou partenariats prouvent déjà.`
  const keySignal =
    `Le signal clé sera une preuve vérifiable d’usage répété ou de décision client sur un segment précis du ${market.replace(/^le\s+/i, '')}.`

  return enrichWithScoring(
    {
      title_fr: title,
      title_en: title,
      submitted_situation_fr: situation,
      submitted_situation_en: situation,
      insight_fr:
        productIsEstablished
          ? `${company} doit d’abord être compris par ce que son site rend vérifiable : promesse, cible, usage et preuves visibles. L’analyse investisseur vient ensuite, pas avant.`
          : hasExplicitUrlSignal
            ? `L’URL de ${company} a été prise en compte, mais l’extraction/recherche serveur n’a pas produit assez de contenu exploitable pour établir précisément son activité. SC doit donc rester prudente au lieu d’inventer.`
            : `SC n’a pas encore identifié avec certitude le contenu utile de ${company}. Elle ne doit donc pas inventer son activité.`,
      insight_en:
        productIsEstablished
          ? `${company} should first be understood through what its website makes verifiable: promise, target users, use case, and visible proof. Investor analysis comes after that, not before.`
          : `SC has not yet identified ${company}'s official site or useful content with certainty. It must not invent its activity.`,
        main_vulnerability_fr: productIsEstablished ? vulnerability : hasExplicitUrlSignal
          ? `Le point fragile est l’échec ou l’insuffisance de l’extraction du site : l’URL existe, mais le contenu utile reste trop pauvre pour conclure.`
          : `Le point fragile est l’identification incertaine du contenu utile et donc l’impossibilité de dire concrètement ce que fait ${company}.`,
      main_vulnerability_en:
        `The fragile point is the gap between ${company}'s visible promise and observable proof of market, usage, and differentiation.`,
      asymmetry_fr: productIsEstablished ? asymmetry : hasExplicitUrlSignal
        ? `L’utilisateur a fourni une URL, mais SC ne doit exploiter que le contenu public effectivement extrait ou retrouvé par recherche serveur.`
        : `La lecture utile dépend d’abord d’une source exploitable ; sans elle, l’activité réelle de ${company} ne doit pas être inventée.`,
      asymmetry_en:
        `${company} can make a promise legible on its website, but the analysis must verify what customers, usage, revenue, or partnerships already prove.`,
      key_signal_fr: keySignal,
      key_signal_en:
        'The key signal is verifiable repeated usage or a customer decision in a precise target-market segment.',
      radar: {
        impact: 35,
        urgency: 30,
        uncertainty: 65,
        reversibility: 70,
      },
      radar_details: [
        {
          axis: 'impact',
          label_fr: 'Impact',
          label_en: 'Impact',
          score: 1,
          explanation_fr:
            `L’impact dépend de la capacité de ${company} à transformer sa promesse de site en usage réel, client identifiable ou partenariat utile.`,
          explanation_en:
            `Impact depends on ${company}'s ability to turn its website promise into real usage, identifiable customers, or useful partnerships.`,
        },
        {
          axis: 'urgency',
          label_fr: 'Urgence',
          label_en: 'Urgency',
          score: 1,
          explanation_fr:
            `L’urgence est modérée : avant de conclure sur ${market}, il faut comprendre le produit, la cible et les preuves déjà visibles.`,
          explanation_en:
            `Urgency is moderate: before judging ${market}, the product, target, and visible proof need to be understood.`,
        },
        {
          axis: 'uncertainty',
          label_fr: 'Incertitudes',
          label_en: 'Uncertainties',
          score: 2,
          explanation_fr:
            `Les angles morts portent sur ce que le site ne prouve pas encore clairement : traction, modèle économique, différenciation, rétention, volonté de payer, cadre légal, travail, fiscalité ou rôle éventuel d’acteurs publics.`,
          explanation_en:
            `Blind spots concern what the website does not yet prove clearly: traction, business model, differentiation, retention, willingness to pay, legal frame, work status, tax, or possible public-sector role.`,
        },
        {
          axis: 'reversibility',
          label_fr: 'Réversibilité',
          label_en: 'Reversibility',
          score: 2,
          explanation_fr:
            `La lecture reste réversible : une preuve client, une métrique d’usage ou une clarification du positionnement peut changer fortement l’évaluation.`,
          explanation_en:
            `The reading remains reversible: customer proof, usage metrics, or clearer positioning can materially change the assessment.`,
        },
      ],
      trajectories: [
        {
          type: 'stabilization',
          title_fr: 'Promesse clarifiée',
          title_en: 'Promise clarified',
          description_fr:
            `${company} devient plus lisible si le site permet d’identifier simplement le client cible, le problème traité, le produit et la preuve d’usage.`,
          description_en:
            `${company} becomes more legible if the site clearly identifies the target customer, problem, product, and usage proof.`,
          signal_fr:
            'Le visiteur comprend en quelques minutes ce qui est vendu, à qui, pourquoi maintenant et avec quelle preuve.',
          signal_en:
            'A visitor understands within minutes what is sold, to whom, why now, and with what proof.',
        },
        {
          type: 'escalation',
          title_fr: 'Promesse trop floue',
          title_en: 'Promise too vague',
          description_fr:
            `La pression augmente si ${company} reste difficile à expliquer après consultation du site : cible, modèle, usage ou différenciation restent ambigus.`,
          description_en:
            `Pressure rises if ${company} remains difficult to explain after reading the website: target, model, use case, or differentiation remain ambiguous.`,
          signal_fr:
            'Les mêmes mots séduisent, mais ne permettent pas de juger le marché, la traction ou la capacité de passage à l’échelle.',
          signal_en:
            'The same words may appeal, but do not allow assessment of market, traction, or scalability.',
        },
        {
          type: 'regime_shift',
          title_fr: 'Preuve de marché',
          title_en: 'Market proof',
          description_fr:
            `La logique change si ${company} montre une preuve externe : clients, revenus, usage répété, partenariat européen ou segment prêt à payer.`,
          description_en:
            `The logic shifts if ${company} shows external proof: customers, revenue, repeated use, European partnership, or a segment willing to pay.`,
          signal_fr:
            'Une preuve observable devient plus forte que le récit du site.',
          signal_en:
            'Observable proof becomes stronger than the website narrative.',
        },
      ],
      cap: {
        hook_fr:
          'Ne pas juger une startup avant d’avoir séparé promesse, produit, preuve et marché.',
        hook_en:
          'Do not judge a startup before separating promise, product, proof, and market.',
        watch_fr:
          `Surveiller ce que ${company} rend concret : client cible, usage répété, revenus, partenariats et différenciation.`,
        watch_en:
          `Watch what ${company} makes concrete: target customer, repeated use, revenue, partnerships, and differentiation.`,
      },
      movements_fr: [
        `Expliquer simplement ce que fait ${company}, pour qui, et quel problème le site affirme résoudre.`,
        'Séparer les preuves visibles des hypothèses : clients, usage, revenus, partenariats, traction, modèle.',
        `Évaluer ensuite l’adéquation ${marketPrep} : besoin, concurrence, distribution, régulation éventuelle et capacité de passage à l’échelle.`,
      ],
      movements_en: [
        `Explain simply what ${company} does, for whom, and what problem the site claims to solve.`,
        'Separate visible proof from assumptions: customers, usage, revenue, partnerships, traction, model.',
        `Then assess fit with ${market}: need, competition, distribution, possible regulation, and scalability.`,
      ],
      avertissement_fr:
        productIsEstablished
          ? 'Ne pas confondre qualité du récit de site et preuve de marché.'
          : 'SC prudente : contenu utile non confirmé, aucune activité ne doit être inventée.',
      avertissement_en:
        'Do not confuse website narrative quality with market proof.',
      lecture_systeme_fr:
        productIsEstablished
          ? `${productSentence} Cela donne une première base, mais pas encore une preuve complète de marché.\n\n` +
            `La contradiction centrale est là : un site peut rendre une promesse claire sans prouver que le marché suit. Pour juger ${company} sur ${market}, il faut donc distinguer quatre niveaux : ce que l’entreprise dit faire, pour qui elle le fait, quelle douleur elle résout, et quelles preuves externes confirment déjà l’usage.\n\n` +
            `Le point de bascule ne sera pas une meilleure formulation du site, mais une preuve observable. ${proofSentence} Si ces signaux deviennent vérifiables, l’analyse peut passer d’un avis sur le positionnement à une vraie lecture de potentiel. Sinon, la carte doit rester prudente.`
          : `SC n’a pas encore une compréhension suffisante du contenu utile de ${company}. La carte ne doit donc pas inventer une activité, une cible ou un segment à partir d’un nom seul.\n\n` +
            (hasExplicitUrlSignal
              ? `L’URL a bien été fournie, mais l’extraction directe et la recherche serveur n’ont pas encore donné assez de matière publique exploitable. La bonne lecture consiste donc à dire précisément ce manque, pas à conclure sur ${market}.\n\n`
              : `La bonne lecture est une suspension prudente : il faut d’abord obtenir un contenu exploitable, puis seulement séparer produit, cible, usage, preuves visibles et angles morts.\n\n`) +
            `Le prochain signal utile n’est pas une conclusion sur ${market}, mais une source exploitable : description claire, éléments de preuve, clients, cas d’usage ou tarification visible.`,
      lecture_systeme_en:
        productIsEstablished
          ? `${sentenceWithPeriod(product)} This provides a first basis, but not yet full market proof.\n\n` +
            `The central contradiction is this: a website can make a promise clear without proving that the market follows. To judge ${company} in ${market}, four layers must be separated: what the company says it does, who it serves, what pain it solves, and what external proof already confirms usage.\n\n` +
            `The tipping point will not be better website wording, but observable proof. ${proofSentence} If these signals become verifiable, the analysis can move from a positioning opinion to a real potential reading. Otherwise, the card must remain cautious.`
          : `SC does not yet have enough understanding of ${company}'s official website. The card must not invent an activity, target, or segment from a name alone.\n\n` +
            `The right reading is a prudent suspension: first identify the official URL or obtain useful site content, then separate product, target, use case, visible proof, and blind spots.\n\n` +
            `The useful next signal is not a conclusion on ${market}, but an exploitable source: official URL, product page, clear description, proof elements, customers, use cases, or visible pricing.`,
      constraints_fr: [
        'La page consultée donne une base de compréhension, mais ne suffit pas à prouver la traction.',
        'La lecture du marché européen exige des preuves externes : clients, usages, partenariats, revenus ou distribution.',
      ],
      uncertainties_fr: [
        'Client cible exact, fréquence d’usage, modèle économique et différenciation réelle.',
        'Capacité à convertir une promesse de site en adoption répétée sur un segment européen précis.',
      ],
      generation_status: 'partial',
    },
    branches
  ) as SituationCard
}

function interpretedTension(sc?: SituationCard): string {
  return cleanPublicText(sc?.intent_context?.interpreted_request?.implicit_tension ?? '').replace(/[.;:]+$/g, '')
}

function isUnderstandingRequest(sc?: SituationCard): boolean {
  const intent = sc?.intent_context?.interpreted_request?.intent_type
  const frame = sc?.intent_context?.dominant_frame
  const decision = sc?.intent_context?.decision_type
  const domain =
    sc?.intent_context?.surface_domain ??
    sc?.intent_context?.interpreted_request?.domain ??
    sc?.coverage_check?.domain
  return intent === 'understand' &&
    frame !== 'site_analysis' &&
    frame !== 'startup_investment' &&
    frame !== 'causal_attribution' &&
    domain !== 'geopolitics' &&
    domain !== 'war' &&
    decision !== 'analyze_site' &&
    decision !== 'evaluate_investment'
}

function isCausalAttributionContext(sc?: SituationCard): boolean {
  return sc?.intent_context?.interpreted_request?.question_type === 'causal_attribution' ||
    sc?.intent_context?.dominant_frame === 'causal_attribution'
}

function causalAttributionCard({
  situation,
  arbre,
  branches,
  intentContext,
  resources = [],
}: {
  situation: string
  arbre: ArbreACamesAnalysis
  branches: AstrolabeBranch[]
  intentContext?: IntentContext
  resources?: ResourceItem[]
}): SituationCard {
  const interpreted = intentContext?.interpreted_request
  const matter = buildCausalMatter({
    situation,
    arbre,
    sc: { intent_context: intentContext } as SituationCard,
    resources,
  })
  const hypothesis = matter.hypothesis
  const actors = powersLabel(arbre, 'acteurs impliqués, institutions, relais, intérêts propres et canaux de décision')
  const uncertainty = firstSafeText(
    [arbre.incertitudes?.[0], arbre.tensions?.[0]],
    situation,
    'le lien causal exact entre influence, décision propre et contraintes institutionnelles reste à établir'
  )

  return enrichWithScoring(
    {
      title_fr: 'Hypothèse causale à vérifier',
      title_en: 'Causal hypothesis to test',
      submitted_situation_fr: normalizeSubmittedSituation(situation),
      submitted_situation_en: normalizeSubmittedSituation(situation),
      insight_fr:
        `${matter.sourceActor}, ${matter.targetActor} et ${matter.event} forment une question de causalité, pas seulement de contexte. Le point décisif est de savoir si l’influence alléguée a réellement réduit la liberté de décision de ${matter.targetActor}.`,
      insight_en:
        'The issue is causal, not only contextual: the decisive point is whether alleged influence actually constrained the decision-maker.',
      main_vulnerability_fr:
        `Le point fragile est la confusion possible entre influence de ${matter.sourceActor}, convergence d’intérêts avec ${matter.targetActor}, décision autonome et preuve manquante.`,
      main_vulnerability_en:
        'The fragile point is the possible confusion between real influence, political narrative, autonomous decision, and missing proof.',
      asymmetry_fr:
        `${matter.sourceActor} peut avoir un pouvoir de récit ou de pression, mais ${matter.targetActor} garde aussi ses intérêts propres, ses institutions, ses coûts et ses contre-hypothèses.`,
      asymmetry_en:
        'The question asks for causal attribution; SC must separate established, plausible, not established, and missing proof.',
      key_signal_fr:
        `Le signal clé serait une trace reliant ${matter.sourceActor}, ${matter.targetActor} et ${matter.event} : ${matter.proofSignals.join(', ')}.`,
      key_signal_en:
        'The key signal is verifiable evidence linking influence and decision: chronology, statement, private channel, adviser, material interest, institutional constraint, or operational order.',
      radar: { impact: 70, urgency: 50, uncertainty: 80, reversibility: 55 },
      radar_details: [
        {
          axis: 'impact',
          label_fr: 'Impact',
          label_en: 'Impact',
          score: 2,
          explanation_fr: `L’impact est élevé si l’imputation déplace la responsabilité perçue de ${matter.targetActor} vers ${matter.sourceActor}, ou inversement.`,
          explanation_en: 'Impact is high if attribution changes perceived responsibility, alliances, or the public reading of the decision.',
        },
        {
          axis: 'urgency',
          label_fr: 'Urgence',
          label_en: 'Urgency',
          score: 1,
          explanation_fr: `L’urgence dépend de l’apparition de traces concrètes entre ${matter.sourceActor}, ${matter.targetActor} et la décision contestée.`,
          explanation_en: 'Urgency depends on available proof: without new evidence, the right stance is cautious inquiry.',
        },
        {
          axis: 'uncertainty',
          label_fr: 'Incertitudes',
          label_en: 'Uncertainties',
          score: 3,
          explanation_fr: `L’incertitude centrale porte sur ${uncertainty}, notamment les canaux entre ${matter.sourceActor} et ${matter.targetActor}.`,
          explanation_en: 'The central uncertainty concerns the actual causal chain and missing evidence.',
        },
        {
          axis: 'reversibility',
          label_fr: 'Réversibilité',
          label_en: 'Reversibility',
          score: 2,
          explanation_fr: 'La lecture peut changer fortement si une preuve directe ou une contre-preuve apparaît.',
          explanation_en: 'The reading can shift strongly if direct proof or counter-proof appears.',
        },
      ],
      trajectories: [
        {
          type: 'stabilization',
          title_fr: 'Hypothèse clarifiée',
          title_en: 'Hypothesis clarified',
          description_fr: `La situation se clarifie si la chronologie sépare ce que ${matter.sourceActor} a pu pousser, ce que ${matter.targetActor} voulait déjà et ce que les contraintes externes imposaient.`,
          description_en: 'The situation clarifies if evidence separates influence, autonomous decision, and external constraints.',
          signal_fr: matter.proofSignals[0],
          signal_en: 'A sourced chronology separates what precedes, triggers, and follows the decision.',
        },
        {
          type: 'escalation',
          title_fr: 'Imputation contestée',
          title_en: 'Contested attribution',
          description_fr: `La pression augmente si le récit “${matter.sourceActor} a entraîné ${matter.targetActor}” devient plus fort que les traces disponibles.`,
          description_en: 'Pressure rises if the attribution narrative becomes stronger than the available proof.',
          signal_fr: `Les camps opposés exploitent ${matter.event} sans produire de trace vérifiable.`,
          signal_en: 'Actors exploit the accusation without producing verifiable evidence.',
        },
        {
          type: 'regime_shift',
          title_fr: 'Preuve décisive',
          title_en: 'Decisive proof',
          description_fr: `La lecture bascule si une preuve montre comment ${matter.sourceActor} a transformé l’arbitrage de ${matter.targetActor}.`,
          description_en: 'The reading shifts if evidence shows a direct operational or political link between influence and decision.',
          signal_fr: 'Document, témoignage, ordre, échange privé, vote, pression financière ou canal institutionnel vérifiable.',
          signal_en: 'Document, testimony, order, private exchange, vote, financial pressure, or verifiable institutional channel.',
        },
      ],
      cap: {
        hook_fr: `${matter.sourceActor} / ${matter.targetActor} : influence possible, causalité à prouver.`,
        hook_en: 'Answer the hypothesis first, then open the systemic reading.',
        watch_fr: `Surveiller ${matter.proofSignals.join(', ')}.`,
        watch_en: 'Watch evidence linking influence, self-interest, decision, and execution.',
      },
      constraints_fr: [
        `${matter.causalChannels[0]}.`,
        `${matter.counterChannels[0]}.`,
        `${matter.causalChannels[2]}.`,
      ],
      constraints_en: [
        'Build a sourced chronology between alleged influence and decision.',
        'Separate external pressure, self-interest of the decision-maker, and institutional constraints.',
        'Identify channels: long relationships, advisers, networks, money, security, law, public opinion, institutions.',
      ],
      uncertainties_fr: ensureBlindSpotFr([
        `Quel élément prouve que ${matter.sourceActor} a fait passer ${matter.targetActor} de l’influence reçue à la décision ?`,
        `${matter.counterChannels[1]} ?`,
        `Quels canaux privés, institutionnels ou matériels entre ${matter.sourceActor} et ${matter.targetActor} restent invisibles ?`,
      ]),
      uncertainties_en: ensureBlindSpotEn([
        'What proves the move from influence to decision?',
        'Which counter-hypotheses explain the decision without direct attribution?',
        'Which private, institutional, or material channels remain invisible?',
      ]),
      movements_fr: [
        `Comparer la chronologie de ${matter.sourceActor}, ${matter.targetActor} et ${matter.event}.`,
        `Chercher une preuve qui relie influence, arbitrage et exécution : ${matter.proofSignals[1]}.`,
        `Tester l’hypothèse inverse : ${matter.counterChannels[0]}.`,
      ],
      movements_en: [
        'Answer provisionally: established, plausible, not established, or undecidable at this stage.',
        'List the proof that would change the conclusion.',
        'Test counter-hypotheses before widening into trajectories.',
      ],
      avertissement_fr: `${matter.sourceActor} et ${matter.targetActor} ne suffisent pas : il faut le canal qui relie influence et décision.`,
      avertissement_en: 'Do not turn a causal question into a general crisis analysis.',
      lecture_systeme_fr:
        `${hypothesis} met face à face ${matter.sourceActor}, ${matter.targetActor} et ${matter.event}. La question n’est pas de raconter tout le contexte, mais de savoir si ${matter.sourceActor} a seulement pesé sur le récit ou s’il a réellement modifié l’arbitrage de ${matter.targetActor}.\n\n` +
        `La contradiction tient à la coexistence de canaux possibles et de contre-hypothèses. ${matter.causalChannels[0]}. Mais ${matter.counterChannels[0]}. Une connivence, une relation ancienne ou une convergence stratégique rend l’hypothèse plausible ; elle ne la démontre pas.\n\n` +
        `Le basculement viendrait d’une trace concrète : ${matter.proofSignals.join(', ')}. Sans ce lien, la lecture doit rester incarnée mais prudente : influence possible, causalité non établie, enquête ouverte sur les canaux réels.`,
      lecture_systeme_en:
        `The question first asks for an answer to a causal hypothesis. SC must not begin by describing the whole situation; it must separate established, plausible, not established, and missing proof.\n\n` +
        `The core issue is the difference between influence and decision. An actor may push, frame, advise, or pressure, but action also depends on self-interest, institutions, costs, law, networks, and operational thresholds.\n\n` +
        `The next step is inquiry: chronology, long relationships, private channels, advisers, money, guarantees, public statements, formal decisions, and counter-hypotheses. Without such proof, the card remains cautious rather than conclusive.`,
      generation_status: 'partial',
      intent_context: intentContext,
      powers_context: arbre.powers_in_presence,
      arbre_a_cames: arbre,
    },
    branches
  ) as SituationCard
}

function humanDevelopmentTrajectories() {
  return [
    {
      type: 'stabilization',
      title_fr: 'Choix réouvert',
      title_en: 'Choice reopened',
      description_fr:
        'La situation s’apaise si l’activité ou la passion redevient un espace de choix, pas une preuve à fournir au parent.',
      description_en:
        'The situation stabilizes if the activity or passion becomes a space of choice again, not proof owed to the parent.',
      signal_fr:
        'L’adolescent peut dire ce qu’il refuse, ce qui l’a blessé ou lassé, et ce qui pourrait redevenir désirable.',
      signal_en:
        'The teenager can say what he refuses, what tired him, and what activity could become desirable again.',
    },
    {
      type: 'escalation',
      title_fr: 'Refus durci',
      title_en: 'Hardened refusal',
      description_fr:
        'La pression augmente si chaque échange transforme l’activité en jugement, comparaison ou obligation de redevenir l’enfant motivé d’avant.',
      description_en:
        'Pressure rises if each exchange turns sport into judgment, comparison, or an obligation to become the formerly motivated child again.',
      signal_fr:
        'Il évite la conversation, se ferme, ironise ou refuse toute activité dès qu’elle ressemble à une injonction.',
      signal_en:
        'He avoids the conversation, shuts down, jokes it away, or refuses any activity that feels like pressure.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Autonomie assumée',
      title_en: 'Assumed autonomy',
      description_fr:
        'La logique change si le sujet n’est plus l’activité elle-même, mais la manière dont il reprend autorité sur son rythme, son image et son désir.',
      description_en:
        'The logic shifts if the subject is no longer the activity itself, but how he regains authority over rhythm, self-image, and desire.',
      signal_fr:
        'Une nouvelle activité, un autre cadre ou un autre adulte permet de choisir sans perdre la face.',
      signal_en:
        'A new activity, another frame, or another adult lets him choose without losing face.',
    },
  ]
}

function personalRelationshipTrajectories() {
  return [
    {
      type: 'stabilization',
      title_fr: 'Lien clarifié',
      title_en: 'Clarified bond',
      description_fr:
        'La situation se clarifie si le signe affectif est relié à des actes simples : réponse, disponibilité, proposition concrète ou parole plus explicite.',
      description_en:
        'The situation clarifies if the affectionate sign is tied to simple acts: reply, availability, concrete proposal, or clearer words.',
      signal_fr:
        'Le rythme des messages, l’initiative du rendez-vous et la cohérence entre ton et actes réduisent l’ambiguïté.',
      signal_en:
        'Message rhythm, meeting initiative, and consistency between tone and actions reduce ambiguity.',
    },
    {
      type: 'escalation',
      title_fr: 'Projection amplifiée',
      title_en: 'Amplified projection',
      description_fr:
        'La pression augmente si un signe isolé devient une certitude intérieure avant que la relation réelle ait repris son rythme.',
      description_en:
        'Pressure rises if an isolated sign becomes an inner certainty before the real relationship has found its rhythm again.',
      signal_fr:
        'Les attentes montent plus vite que les échanges, ou chaque silence devient une preuve.',
      signal_en:
        'Expectations rise faster than exchanges, or every silence becomes proof.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Intention nommée',
      title_en: 'Named intention',
      description_fr:
        'La logique change lorsqu’une parole ou une rencontre rend l’intention plus nette : amitié, nostalgie, désir, prudence ou simple chaleur du lien.',
      description_en:
        'The logic changes when words or a meeting clarify the intention: friendship, nostalgia, desire, caution, or simple warmth.',
      signal_fr:
        'Une proposition concrète, une parole directe ou une rencontre réelle déplace la lecture.',
      signal_en:
        'A concrete proposal, direct words, or a real meeting shifts the reading.',
    },
  ]
}

function personalRelationshipRadarDetails() {
  return [
    {
      axis: 'impact',
      label_fr: 'Impact',
      label_en: 'Impact',
      score: 2,
      explanation_fr:
        'L’impact vient de la charge affective du lien, de l’histoire passée et de ce que la reprise de contact peut rouvrir.',
      explanation_en:
        'Impact comes from the emotional charge of the bond, the past history, and what renewed contact may reopen.',
    },
    {
      axis: 'urgency',
      label_fr: 'Urgence',
      label_en: 'Urgency',
      score: 1,
      explanation_fr:
        'L’urgence reste modérée : il vaut mieux répondre simplement et laisser les actes préciser l’intention.',
      explanation_en:
        'Urgency is moderate: it is better to answer simply and let actions clarify intention.',
    },
    {
      axis: 'uncertainty',
      label_fr: 'Incertitudes',
      label_en: 'Uncertainties',
      score: 2,
      explanation_fr:
        'L’inconnu porte sur le sens réel du signe affectif, le rythme des échanges, la disponibilité et la rencontre possible.',
      explanation_en:
        'The unknown concerns the meaning of the affectionate sign, message rhythm, availability, and possible meeting.',
    },
    {
      axis: 'reversibility',
      label_fr: 'Réversibilité',
      label_en: 'Reversibility',
      score: 2,
      explanation_fr:
        'La situation reste réversible si la réponse accueille le signe sans forcer une interprétation.',
      explanation_en:
        'The situation remains reversible if the response welcomes the sign without forcing interpretation.',
    },
  ]
}

function personalRelationshipCap() {
  return {
    hook_fr: 'Un signe affectif compte, mais il se comprend par la suite des actes.',
    hook_en: 'An affectionate sign matters, but it is understood through what follows.',
    watch_fr:
      'Surveiller les actes simples : rythme des messages, proposition concrète, disponibilité, ton, rencontre et clarté progressive.',
    watch_en:
      'Watch simple acts: message rhythm, concrete proposal, availability, tone, meeting, and progressive clarity.',
  }
}

function isPersonalRelationshipCard(sc?: SituationCard, intentContext?: IntentContext): boolean {
  const frame = sc?.intent_context?.dominant_frame ??
    sc?.coverage_check?.intent_context?.dominant_frame ??
    intentContext?.dominant_frame
  const domain =
    sc?.intent_context?.interpreted_request?.domain ??
    sc?.intent_context?.surface_domain ??
    sc?.coverage_check?.domain ??
    intentContext?.interpreted_request?.domain ??
    intentContext?.surface_domain
  return frame === 'personal_relationship' ||
    domain === 'personal' ||
    sc?.conversation_contract?.domain === 'personal'
}

function pitchReadinessTrajectories() {
  return [
    {
      type: 'stabilization',
      title_fr: 'Message resserré',
      title_en: 'Tightened message',
      description_fr:
        'La situation se stabilise si le pitch est réduit à une promesse claire, trois preuves et une demande explicite au jury.',
      description_en:
        'The situation stabilizes if the pitch is reduced to one clear promise, three proofs, and one explicit ask to the jury.',
      signal_fr:
        'Vous pouvez répéter en anglais une version courte sans chercher vos mots ni justifier chaque détail.',
      signal_en:
        'You can rehearse a short English version without searching for words or justifying every detail.',
    },
    {
      type: 'escalation',
      title_fr: 'Exposition subie',
      title_en: 'Exposed performance',
      description_fr:
        'La pression augmente si le regard des pairs et du jury devient le centre, au lieu du problème, de la solution et de la preuve.',
      description_en:
        'Pressure rises if the gaze of peers and jury becomes central instead of the problem, solution, and proof.',
      signal_fr:
        'Le pitch s’allonge, l’anglais devient défensif et les réponses aux objections partent dans tous les sens.',
      signal_en:
        'The pitch gets longer, English becomes defensive, and answers to objections scatter.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Preuve publique',
      title_en: 'Public proof',
      description_fr:
        'La logique change si l’exercice n’est plus une épreuve personnelle mais une première preuve publique de clarté et de leadership.',
      description_en:
        'The logic shifts if the exercise is no longer a personal ordeal but a first public proof of clarity and leadership.',
      signal_fr:
        'Le jury comprend en moins d’une minute ce que fait IAAA, pourquoi maintenant et ce que vous demandez.',
      signal_en:
        'The jury understands in under one minute what IAAA does, why now, and what you are asking for.',
    },
  ]
}

function vcTrajectories() {
  return [
    {
      type: 'stabilization',
      title_fr: 'Deal qualifié',
      title_en: 'Qualified deal',
      description_fr:
        'Le dossier devient lisible si le produit, l’ICP, la douleur client et la preuve d’usage forment une même ligne.',
      description_en:
        'The deal becomes legible if product, ICP, customer pain, and usage proof line up.',
      signal_fr:
        'Des utilisateurs qualifiés reviennent, partagent les cartes ou demandent une intégration dans leur flux de décision.',
      signal_en:
        'Qualified users return, share cards, or request integration into their decision workflow.',
    },
    {
      type: 'escalation',
      title_fr: 'Preuve insuffisante',
      title_en: 'Insufficient proof',
      description_fr:
        'Le projet reste séduisant mais fragile si la promesse dépasse la traction, la répétabilité commerciale ou la volonté de payer.',
      description_en:
        'The project remains attractive but fragile if the promise exceeds traction, commercial repeatability, or willingness to pay.',
      signal_fr:
        'Beaucoup d’intérêt en démonstration, mais peu d’usage répété, peu de budget identifié ou un cycle de vente flou.',
      signal_en:
        'Strong demo interest, but little repeated usage, unclear budget, or a vague sales cycle.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Marché activable',
      title_en: 'Activatable market',
      description_fr:
        'La nature du dossier change si le produit prouve un segment acheteur précis et un usage récurrent défendable.',
      description_en:
        'The file changes nature if the product proves a precise buyer segment and defensible recurring use.',
      signal_fr:
        'Un ICP clair accepte de payer, recommande l’outil et le réutilise pour plusieurs décisions critiques.',
      signal_en:
        'A clear ICP agrees to pay, recommends the tool, and reuses it for multiple critical decisions.',
    },
  ]
}

function founderGovernanceTrajectories() {
  return [
    {
      type: 'stabilization',
      title_fr: 'Pacte clarifié',
      title_en: 'Clarified pact',
      description_fr:
        'La relation devient gouvernable si le rôle, les parts, le pouvoir de décision et les conditions de sortie sont écrits avant l’association.',
      description_en:
        'The relationship becomes governable if role, equity, decision power, and exit terms are written before cofounding.',
      signal_fr:
        'Un accord explicite sépare l’histoire personnelle, l’aide passée et le mandat opérationnel futur.',
      signal_en:
        'An explicit agreement separates the personal history, past help, and future operating mandate.',
    },
    {
      type: 'escalation',
      title_fr: 'Dette relationnelle',
      title_en: 'Relational debt',
      description_fr:
        'La tension augmente si la gratitude, le prestige du profil ou l’urgence de scaler remplacent une vraie négociation d’associés.',
      description_en:
        'Tension rises if gratitude, profile prestige, or urgency to scale replaces a real cofounder negotiation.',
      signal_fr:
        'Une demande de rôle, de titre ou de parts arrive avant que le pouvoir réel et les zones de conflit soient clarifiés.',
      signal_en:
        'A request for role, title, or equity arrives before real power and conflict zones are clarified.',
    },
    {
      type: 'regime_shift',
      title_fr: 'Conflit de gouvernance',
      title_en: 'Governance conflict',
      description_fr:
        'La nature du projet change si un désaccord personnel devient une décision bloquée sur stratégie, recrutement, capital ou autorité finale.',
      description_en:
        'The project changes nature if a personal disagreement becomes a blocked decision on strategy, hiring, equity, or final authority.',
      signal_fr:
        'La première décision dure révèle que le lien passé pèse plus que le pacte d’associés.',
      signal_en:
        'The first hard decision reveals that the past relationship weighs more than the cofounder pact.',
    },
  ]
}

function scoreFromRadar(value: unknown, inverse = false): number {
  const numeric = typeof value === 'number' ? value : 50
  const normalized = inverse ? 100 - numeric : numeric
  return Math.max(0, Math.min(3, Math.round(normalized / 33)))
}

function defaultRadarDetails(
  radar: Record<string, number>,
  arbre: ArbreACamesAnalysis,
  situation: string
) {
  const actors = firstSafeText([arbre.acteurs?.[0]], situation, powersLabel(arbre, 'les acteurs directement engagés'))
  const constraint = firstSafeText(
    [arbre.contraintes?.[0]],
    situation,
    'les limites de temps, de ressources, de rôle ou de décision'
  )
  const uncertainty = firstSafeText(
    [arbre.incertitudes?.[0]],
    situation,
    'les intentions réelles, les seuils de rupture ou les informations manquantes'
  )
  const time = firstSafeText(
    [arbre.temps?.[0], arbre.temporalites?.[0]],
    situation,
    'la fenêtre d’action disponible'
  )

  return [
    {
      axis: 'impact',
      label_fr: 'Impact',
      label_en: 'Impact',
      score: scoreFromRadar(radar.impact),
      explanation_fr: `L’impact dépend des marges d’action des acteurs engagés : ${actors}. Leur capacité à modifier, bloquer ou accélérer la situation détermine la pression réelle.`,
      explanation_en: `Impact comes from the actors involved: ${actors}. A poorly absorbed decision would directly shift their room for action.`,
    },
    {
      axis: 'urgency',
      label_fr: 'Urgence',
      label_en: 'Urgency',
      score: scoreFromRadar(radar.urgency),
      explanation_fr: `L’urgence vient du rythme temporel : ${time}. Plus cette fenêtre se referme, plus les choix deviennent coûteux.`,
      explanation_en: `Urgency comes from the available time: ${time}. As that window closes, choices become more costly.`,
    },
    {
      axis: 'uncertainty',
      label_fr: 'Incertitudes',
      label_en: 'Uncertainties',
      score: scoreFromRadar(radar.uncertainty),
      explanation_fr: `L’incertitude principale concerne : ${uncertainty}. C’est ce point qui peut modifier le diagnostic.`,
      explanation_en: `Uncertainty concerns ${uncertainty}. This is what can change the reading of the situation.`,
    },
    {
      axis: 'reversibility',
      label_fr: 'Réversibilité',
      label_en: 'Reversibility',
      score: scoreFromRadar(radar.reversibility, true),
      explanation_fr: `La réversibilité dépend des contraintes qui limitent l’action : ${constraint}. Plus ces limites deviennent visibles, moins le retour arrière est simple.`,
      explanation_en: `Reversibility depends on ${constraint}. Once these constraints become public or irreversible, room to step back narrows.`,
    },
  ]
}

function radarDetailsLookInternal(value: unknown): boolean {
  const text = JSON.stringify(value ?? '')
  return /\b(?:objet|tension)\s+interpr[ée]t[ée]|\bunderstand_situation\b|\bActeurs visibles\b|\bContraintes mat[ée]rielles\b|\bR[èe]gles et institutions\b|\bR[ée]cit dominant\b/i.test(text)
}

function vcRadarDetails() {
  return [
    {
      axis: 'impact',
      label_fr: 'Impact',
      label_en: 'Impact',
      score: 2,
      explanation_fr:
        'Impact élevé si le produit transforme sa promesse en workflow utilisé par consultants, dirigeants, analystes ou investisseurs.',
      explanation_en:
        'High impact if the product turns its promise into a workflow used by consultants, executives, analysts, or investors.',
    },
    {
      axis: 'urgency',
      label_fr: 'Urgence',
      label_en: 'Urgency',
      score: 2,
      explanation_fr:
        'L’urgence vient du stade early : il faut vite prouver un ICP, un usage répété et une volonté de payer avant de pitcher comme dossier VC.',
      explanation_en:
        'Urgency comes from the early stage: ICP, repeated usage, and willingness to pay must be proven before pitching as a VC case.',
    },
    {
      axis: 'uncertainty',
      label_fr: 'Incertitudes',
      label_en: 'Uncertainties',
      score: 3,
      explanation_fr:
        'L’incertitude porte sur la répétabilité commerciale : qui paie, à quelle fréquence, pour quelle décision, et avec quel cycle de vente.',
      explanation_en:
        'Uncertainty concerns commercial repeatability: who pays, how often, for which decision, and through what sales cycle.',
    },
    {
      axis: 'reversibility',
      label_fr: 'Réversibilité',
      label_en: 'Reversibility',
      score: 2,
      explanation_fr:
        'La trajectoire reste réversible tant que le positionnement, le segment cible et le packaging peuvent être ajustés avant une levée.',
      explanation_en:
        'The trajectory remains reversible while positioning, target segment, and packaging can still be adjusted before fundraising.',
    },
  ]
}

function founderGovernanceRadarDetails() {
  return [
    {
      axis: 'impact',
      label_fr: 'Impact',
      label_en: 'Impact',
      score: 2,
      explanation_fr:
        'Impact significatif sur la startup si l’entrée au capital mélange relation passée, rôle opérationnel et pouvoir de décision.',
      explanation_en:
        'Significant impact on the startup if equity mixes past relationship, operating role, and decision power.',
    },
    {
      axis: 'urgency',
      label_fr: 'Urgence',
      label_en: 'Urgency',
      score: 1,
      explanation_fr:
        'Pas d’urgence externe : l’urgence réelle est de cadrer la demande avant tout titre, parts ou engagement irréversible.',
      explanation_en:
        'No external urgency: the real urgency is to frame the request before any title, equity, or irreversible commitment.',
    },
    {
      axis: 'uncertainty',
      label_fr: 'Incertitudes',
      label_en: 'Uncertainties',
      score: 2,
      explanation_fr:
        'Deux inconnues dominent : sa capacité à accepter un pacte écrit et votre capacité à refuser sans transformer la dette symbolique en conflit.',
      explanation_en:
        'Two unknowns dominate: her ability to accept a written pact and your ability to refuse without turning symbolic debt into conflict.',
    },
    {
      axis: 'reversibility',
      label_fr: 'Réversibilité',
      label_en: 'Reversibility',
      score: 2,
      explanation_fr:
        'Situation réversible si elle passe par une mission test ; beaucoup moins réversible après attribution de parts ou titre fondateur.',
      explanation_en:
        'Reversible if it goes through a test mission; far less reversible after equity or founder title is granted.',
    },
  ]
}

function completeSituationCard(
  sc: SituationCard,
  situation: string,
  arbre: ArbreACamesAnalysis,
  resources: ResourceItem[],
  branches: AstrolabeBranch[]
): SituationCard {
  if (isCausalAttributionContext(sc)) {
    return causalAttributionCard({
      situation,
      arbre,
      branches,
      intentContext: sc.intent_context,
      resources,
    })
  }

  if (sc.intent_context?.dominant_frame === 'site_analysis' || sc.intent_context?.decision_type === 'analyze_site') {
    const siteFallback = siteAnalysisFallbackCard({
      situation,
      arbre,
      resources,
      branches,
      intentContext: sc.intent_context,
    })
    if (siteFallback) return siteFallback
  }

  const allowLegacyScenarioOverrides = false
  const isVcCard =
    allowLegacyScenarioOverrides &&
    sc.intent_context?.interpreted_request?.intent_type !== 'understand' &&
    (sc.coverage_check?.domain === 'startup_vc' ||
      sc.metier_profile?.id === 'vc_investisseur')
  const isFounderGovernance =
    allowLegacyScenarioOverrides &&
    (sc.intent_context?.dominant_frame === 'founder_governance' ||
      sc.coverage_check?.intent_context?.dominant_frame === 'founder_governance')
  const isHumanDevelopment =
    allowLegacyScenarioOverrides &&
    sc.intent_context?.dominant_frame === 'personal_relationship' &&
    /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|sport|p[eê]che|carpe|loisir|passion|motivation)\b/i.test(situation)
  const isPersonalRelationship = isPersonalRelationshipCard(sc)
  const isPitchReadiness =
    allowLegacyScenarioOverrides &&
    sc.intent_context?.dominant_frame === 'professional_decision' &&
    /\b(pitch|jury|pairs?|presentation|présentation|anglais|lancement|lancer|entrain|entraine)\b/i.test(situation)
  const radar = sc.radar && typeof sc.radar === 'object'
    ? sc.radar
    : { impact: 55, urgency: 50, uncertainty: 60, reversibility: 45 }
  const understands = isUnderstandingRequest(sc) && !isPersonalRelationship
  const object = interpretedObject(sc)
  const tension = interpretedTension(sc)
  const objectLabel = object || 'l’objet de la question'
  const trajectorySubject = conciseTrajectorySubject(objectLabel)
  const objectSentence = capitalizeFirst(objectLabel)
  const objectDe = afterDe(objectLabel)
  const isExperienceExplanation = isExperienceExplanationFrame(sc.intent_context)
  const experience = experienceLexicon(situation, objectLabel)
  const tensionLabel = tension || 'un rôle visible continue à organiser la confiance, la preuve et la décision'
  const trajectories = isVcCard
    ? vcTrajectories()
    : isFounderGovernance
    ? founderGovernanceTrajectories()
    : isHumanDevelopment
    ? humanDevelopmentTrajectories()
    : isPersonalRelationship
    ? personalRelationshipTrajectories()
    : isPitchReadiness
    ? pitchReadinessTrajectories()
    : isExperienceExplanation
    ? experienceTrajectories(experience.subject)
    : understands
    ? [
        {
          type: 'stabilization',
          title_fr: 'Mécanisme clarifié',
          title_en: 'Clarified role',
          description_fr: `La situation se clarifie si ${trajectorySubject} est relié à des acteurs, des moyens d’action et des preuves observables.`,
          description_en: 'The situation clarifies when actors, means of action, and observable proof are linked.',
          signal_fr: 'Un fait, une décision ou un canal vérifiable permet de distinguer crainte, capacité et acte.',
          signal_en: 'A fact, decision, or verifiable channel separates fear, capacity, and action.',
        },
        {
          type: 'escalation',
          title_fr: 'Crainte amplifiée',
          title_en: 'Hollow ritual',
          description_fr: `La pression augmente si ${trajectorySubject} devient un récit dominant sans preuve proportionnée.`,
          description_en: 'Pressure rises if the issue becomes a dominant narrative without proportional proof.',
          signal_fr: 'Des accusations, procédures, consignes ou refus publics durcissent les positions.',
          signal_en: 'Accusations, procedures, instructions, or public refusals harden positions.',
        },
        {
          type: 'regime_shift',
          title_fr: 'Seuil rendu visible',
          title_en: 'Proof displaced',
          description_fr: 'La logique change quand ce qui restait supposé devient une décision, un coût, une preuve ou un blocage public.',
          description_en: 'The logic shifts when what was assumed becomes a decision, cost, proof, or public blockage.',
          signal_fr: 'Un acteur capable d’agir change de registre et rend la tension vérifiable.',
          signal_en: 'An actor able to act changes register and makes the tension verifiable.',
        },
      ]
    : Array.isArray(sc.trajectories) && sc.trajectories.length > 0
    ? sc.trajectories
    : defaultTrajectories(arbre, situation)
  const cap = isVcCard
    ? {
        hook_fr: 'Une startup devient investissable quand la preuve d’usage dépasse la beauté du concept.',
        hook_en: 'A startup becomes investable when usage proof exceeds the beauty of the concept.',
        watch_fr: 'Surveiller l’usage répété, la volonté de payer, l’ICP et la capacité à convertir une démonstration en décision d’achat.',
        watch_en: 'Watch repeated usage, willingness to pay, ICP, and the ability to turn a demo into a buying decision.',
      }
    : isFounderGovernance
    ? {
        hook_fr: 'Une aide décisive ne suffit pas à faire un bon pacte d’associés.',
        hook_en: 'Decisive help is not enough to make a good cofounder pact.',
        watch_fr: 'Surveiller le premier désaccord concret sur rôle, parts, stratégie, recrutement ou autorité finale.',
        watch_en: 'Watch the first concrete disagreement over role, equity, strategy, hiring, or final authority.',
      }
    : isHumanDevelopment
    ? {
        hook_fr: 'Le refus du sport peut protéger quelque chose que le parent ne voit pas encore.',
        hook_en: 'Refusing sport may protect something the parent does not yet see.',
        watch_fr: 'Surveiller s’il peut parler de fatigue, de honte, de comparaison ou d’envie sans se sentir jugé.',
        watch_en: 'Watch whether he can speak about fatigue, shame, comparison, or desire without feeling judged.',
      }
    : isPersonalRelationship
    ? personalRelationshipCap()
    : isPitchReadiness
    ? {
        hook_fr: 'Le risque n’est pas le niveau d’anglais ; c’est un message trop large sous regard public.',
        hook_en: 'The risk is not English level; it is an overwide message under public scrutiny.',
        watch_fr: 'Surveiller si vous pouvez dire en une minute : problème, promesse, preuve, demande.',
        watch_en: 'Watch whether you can state in one minute: problem, promise, proof, ask.',
      }
    : understands
    ? {
        hook_fr: 'Une crainte ne devient structurante que lorsqu’elle trouve un relais capable d’agir.',
        hook_en: 'A concern becomes structuring only when it finds a channel able to act.',
        watch_fr: 'Surveiller les actes qui transforment la crainte en capacité : décision, procédure, blocage, consigne, calendrier ou preuve.',
        watch_en: 'Watch acts that turn concern into capacity: decision, procedure, blockage, instruction, calendar, or proof.',
      }
    : sc.cap && typeof sc.cap === 'object'
      ? sc.cap
      : {
        hook_fr: 'L’aspect de façade n’est pas forcément ce qui protège réellement la situation.',
        hook_en: 'What preserves appearances is not necessarily what truly protects the situation.',
        watch_fr: firstSafeText(
          [arbre.temps?.[0], arbre.temporalites?.[0]],
          situation,
          'Surveiller le moment où un refus, un coût, une décision ou un seuil devient visible.'
        ),
        watch_en: firstSafeText(
          [arbre.temps?.[0], arbre.temporalites?.[0]],
          situation,
          'Watch when a refusal, cost, decision, or threshold becomes visible.'
        ),
      }
  const constraintsFr = listFromAxis(sc.constraints_fr, [
    ...(arbre.contraintes ?? []),
    'Marges d’action limitées par le temps, les ressources et les dépendances.',
  ], situation)
  const uncertaintiesFr = listFromAxis(sc.uncertainties_fr, [
    ...(arbre.incertitudes ?? []),
    'Seuil exact à partir duquel la tension devient visible pour tous les acteurs.',
  ], situation)
  const understandingConstraintsFr = [
    'Distinguer crainte exprimée, capacité réelle d’action, relais institutionnels et preuve observable.',
    'Identifier les acteurs capables de transformer la tension en décision, blocage, procédure ou récit public.',
    'Séparer ce qui est établi, plausible, non établi et ce qui manque pour trancher.',
  ]
  const understandingUncertaintiesFr = [
    'Quelle absence peut renverser la lecture : fait manquant, relation invisible, cadre légal, source, preuve ou contre-hypothèse ?',
    'Quel canal concret relie la crainte aux acteurs capables d’agir : institution, argent, droit, réseau, procédure ou opinion ?',
    'Quelle contre-hypothèse expliquerait la situation sans confirmer la crainte principale ?',
  ]
  const understandingMovementsFr = [
    'Nommer les acteurs, canaux et preuves qui rendent la crainte vérifiable.',
    'Séparer le scénario redouté des mécanismes capables de le produire.',
    'Transformer VI en enquête concrète plutôt qu’en liste générale.',
  ]

  const completed = {
    ...sc,
    title_fr: compactHeaderTitle(sc, situation),
    title_en: stripEntityExplanations(cleanPublicText(firstText([sc.title_en, sc.title], 'Structural reading'))).split(/\s+/).slice(0, 4).join(' '),
    submitted_situation_fr: normalizeSubmittedSituation(cleanPublicText(firstText([sc.submitted_situation_fr, sc.submitted_situation], situation))),
    submitted_situation_en: normalizeSubmittedSituation(cleanPublicText(firstText([sc.submitted_situation_en, sc.submitted_situation], situation))),
    insight_fr: understands
      ? `${objectSentence} met en tension ce qui est craint, ce qui est possible et ce qui est prouvable. Le point décisif est la capacité réelle des acteurs à transformer cette tension en décision, blocage ou changement observable.`
      : isVcCard
      ? 'Pour un VC, le produit devient intéressant si sa promesse se transforme en preuve d’usage répétable.'
      : isFounderGovernance
      ? 'La vraie décision n’est pas d’ajouter un profil brillant, mais de savoir si une relation passée peut devenir une gouvernance claire.'
      : isHumanDevelopment
      ? 'La situation se lit par les forces discrètes du lien : autonomie adolescente, regard parental, passion investie, déception vécue et besoin de ne pas perdre la face.'
      : isPersonalRelationship
      ? 'La situation se lit par la reprise concrète du lien : signe affectif, histoire passée, distance, rythme des messages et possibilité réelle d’une rencontre.'
      : isPitchReadiness
      ? 'La situation se lit par les forces en présence du pitch : clarté du message, regard du jury, anglais moyen, manque de répétition et proximité du lancement.'
      : safePublicText(
          firstText([sc.insight_fr, sc.insight], ''),
          situation,
          `La situation se lit par les leviers réels en présence : ${powersLabel(arbre)}.`
        ),
    insight_en: isVcCard
      ? 'For a VC, the product becomes interesting if its promise turns into repeatable usage proof.'
      : isFounderGovernance
      ? 'The real decision is not adding a brilliant profile, but whether a past relationship can become clear governance.'
      : safePublicText(
          firstText([sc.insight_en, sc.insight], ''),
          situation,
          'The situation is read through the real levers in presence.'
        ),
    main_vulnerability_fr: understands
      ? 'Le point fragile est le passage entre crainte, intention, capacité réelle et acte vérifiable.'
      : isVcCard
      ? 'Le point fragile est l’écart entre une proposition intellectuellement forte et des preuves encore à établir : usage répété, volonté de payer, ICP clair et distribution.'
      : isFounderGovernance
      ? 'Le point fragile est le passage d’une dette relationnelle à un pouvoir d’associée sans pacte explicite sur rôle, parts, décision et sortie.'
      : isHumanDevelopment
      ? 'Le point fragile est le moment où une passion partagée devient pression, comparaison ou perte d’autonomie.'
      : isPersonalRelationship
      ? 'Le point fragile est le risque de transformer un signe affectif en certitude avant que les actes aient clarifié l’intention.'
      : isPitchReadiness
      ? 'Le point fragile est l’écart entre l’importance publique du lancement et le manque de répétition qui rend le message vulnérable.'
      : firstSafeText(
          [sc.main_vulnerability_fr, sc.main_vulnerability, arbre.main_vulnerability_candidate],
          situation,
          'Le point fragile est le levier réel qui n’est pas encore protégé ou clarifié.'
        ),
    main_vulnerability_en: isVcCard
      ? 'The fragile point is the gap between an intellectually strong proposition and proof still to be established: repeated use, willingness to pay, clear ICP, and distribution.'
      : isFounderGovernance
      ? 'The fragile point is the move from relational debt to cofounder power without an explicit pact on role, equity, decision, and exit.'
      : firstSafeText(
          [sc.main_vulnerability_en, sc.main_vulnerability, arbre.main_vulnerability_candidate],
          situation,
          'The fragile point is the real lever that is not yet protected or clarified.'
        ),
    asymmetry_fr: understands
      ? 'La tension peut être largement commentée, mais elle ne devient lisible qu’en identifiant qui peut réellement agir, bloquer ou légitimer.'
      : isVcCard
      ? 'Le fondateur vend une vision ; le VC cherche une preuve que cette vision devient un marché achetable, répétable et défendable.'
      : isFounderGovernance
      ? 'Elle apporte accès, prestige et capacité de scale ; vous devez protéger la startup d’une gouvernance dictée par la gratitude ou l’histoire personnelle.'
      : isHumanDevelopment
      ? 'Le parent veut comprendre et réparer le lien, tandis que l’adolescent peut protéger son autonomie, son image ou sa manière de vivre la déception.'
      : isPersonalRelationship
      ? 'Un message peut réchauffer un lien ancien, mais seule la suite des échanges montre s’il ouvre une rencontre, une clarification ou seulement une chaleur prudente.'
      : isPitchReadiness
      ? 'Vous portez une vision forte, mais le jury évaluera surtout la clarté, la confiance, la preuve et la capacité à répondre sous pression.'
      : firstSafeText(
          [sc.asymmetry_fr, sc.asymmetry, arbre.load_bearing_contradiction],
          situation,
          'Ce qui semble tenir publiquement dépend d’un levier plus discret qui peut bloquer, user ou faire basculer.'
        ),
    asymmetry_en: isVcCard
      ? 'The founder sells a vision; the VC looks for proof that this vision becomes a payable, repeatable, defensible market.'
      : isFounderGovernance
      ? 'She brings access, prestige, and scaling capacity; you must protect the startup from governance dictated by gratitude or personal history.'
      : firstSafeText(
          [sc.asymmetry_en, sc.asymmetry, arbre.load_bearing_contradiction],
          situation,
          'What appears to hold publicly depends on a quieter lever that can block, wear down, or tip the situation.'
        ),
    key_signal_fr: understands
      ? 'Le signal clé serait un acte vérifiable : décision, refus, procédure, pression organisée, changement de calendrier ou prise de position qui modifie les marges d’action.'
      : isVcCard
      ? 'Le signal clé est l’apparition d’un usage répété par un ICP identifiable, avec volonté de payer ou intégration dans un flux de décision.'
      : isFounderGovernance
      ? 'Le signal clé est sa capacité à accepter un pacte écrit qui limite clairement rôle, pouvoir, parts et conditions de sortie.'
      : isHumanDevelopment
      ? 'Le signal clé est sa capacité à dire ce qu’il refuse, ce qu’il protège et ce qui pourrait redevenir désirable autrement.'
      : isPersonalRelationship
      ? 'Le signal clé est une cohérence entre le signe affectif et les actes : rendez-vous proposé, disponibilité, parole plus claire ou rythme régulier.'
      : isPitchReadiness
      ? 'Le signal clé est votre capacité à répéter une version courte en anglais sans perdre le fil sous questions.'
      : firstSafeText(
          [sc.key_signal_fr, sc.key_signal],
          situation,
          'Le signal clé est un changement observable de rythme : décision, refus, coût visible, seuil ou déplacement de pouvoir.'
        ),
    key_signal_en: isFounderGovernance
      ? 'The key signal is her ability to accept a written pact that clearly limits role, power, equity, and exit terms.'
      : firstSafeText(
          [sc.key_signal_en, sc.key_signal, arbre.temps?.[0], arbre.temporalites?.[0]],
          situation,
          'The key signal is an observable tempo shift: decision, refusal, visible cost, threshold, or power move.'
        ),
      radar,
      radar_details: understands
        ? [
            {
              axis: 'impact',
              label_fr: 'Impact',
              label_en: 'Impact',
              score: 2,
              explanation_fr: `${objectSentence} devient important si la crainte modifie les décisions, les procédures, la confiance ou la lecture publique des acteurs.`,
              explanation_en: 'Impact comes from whether the concern changes decisions, procedures, trust, or public reading.',
            },
            {
              axis: 'urgency',
              label_fr: 'Urgence',
              label_en: 'Urgency',
              score: 1,
              explanation_fr: 'L’urgence dépend du calendrier concret : échéance, procédure, décision publique ou preuve nouvelle.',
              explanation_en: 'Urgency depends on the concrete calendar: deadline, procedure, public decision, or new proof.',
            },
            {
              axis: 'uncertainty',
              label_fr: 'Incertitudes',
              label_en: 'Uncertainties',
              score: 2,
              explanation_fr: 'L’incertitude porte sur le canal qui transformerait la crainte en acte : droit, institution, réseau, argent, opinion ou procédure.',
              explanation_en: 'Uncertainty concerns what is missing to decide: fact, source, precision, proof, or counter-hypothesis.',
            },
            {
              axis: 'reversibility',
              label_fr: 'Réversibilité',
              label_en: 'Reversibility',
              score: 2,
              explanation_fr: 'La lecture reste réversible tant qu’aucun acte vérifiable ne ferme les contre-hypothèses.',
              explanation_en: 'The reading remains reversible until no verifiable act closes the counter-hypotheses.',
            },
          ]
        : isVcCard
        ? vcRadarDetails()
        : isFounderGovernance
        ? founderGovernanceRadarDetails()
        : isHumanDevelopment
        ? [
            {
              axis: 'impact',
              label_fr: 'Impact',
              label_en: 'Impact',
              score: 2,
              explanation_fr:
                'Impact significatif sur le lien parent-enfant, l’image de soi de l’adolescent et son rapport durable au mouvement.',
              explanation_en:
                'Significant impact on the parent-child bond, the teenager’s self-image, and his long-term relationship to movement.',
            },
            {
              axis: 'urgency',
              label_fr: 'Urgence',
              label_en: 'Urgency',
              score: 1,
              explanation_fr:
                'Pas d’urgence immédiate sur l’activité ; l’urgence réelle est de ne pas transformer le sujet en bras de fer.',
              explanation_en:
                'No immediate sporting urgency; the real urgency is not turning the subject into a power struggle.',
            },
            {
              axis: 'uncertainty',
              label_fr: 'Incertitudes',
              label_en: 'Uncertainties',
              score: 2,
              explanation_fr:
                'L’inconnu principal est ce qu’il protège par ce refus : fatigue, honte, comparaison, perte de désir ou besoin d’autonomie.',
              explanation_en:
                'The main unknown is what he protects through refusal: fatigue, shame, comparison, loss of desire, or need for autonomy.',
            },
            {
              axis: 'reversibility',
              label_fr: 'Réversibilité',
              label_en: 'Reversibility',
              score: 2,
              explanation_fr:
                'La situation reste réversible si un autre cadre lui permet de choisir sans devoir sauver la face.',
              explanation_en:
                'The situation remains reversible if another frame lets him choose without having to save face.',
            },
          ]
        : isPersonalRelationship
        ? personalRelationshipRadarDetails()
        : isPitchReadiness
        ? [
            {
              axis: 'impact',
              label_fr: 'Impact',
              label_en: 'Impact',
              score: 2,
              explanation_fr:
                'Impact élevé sur la première impression d’IAAA auprès des pairs, du jury et des relais possibles.',
              explanation_en:
                'High impact on IAAA’s first impression among peers, jury, and possible relays.',
            },
            {
              axis: 'urgency',
              label_fr: 'Urgence',
              label_en: 'Urgency',
              score: 3,
              explanation_fr:
                'Urgence forte : le pitch arrive dans quelques jours et la préparation doit produire une version répétable immédiatement.',
              explanation_en:
                'High urgency: the pitch is coming in days and preparation must produce a repeatable version immediately.',
            },
            {
              axis: 'uncertainty',
              label_fr: 'Incertitudes',
              label_en: 'Uncertainties',
              score: 2,
              explanation_fr:
                'L’incertitude porte sur la réaction du jury, les questions en anglais et la capacité à rester clair sous pression.',
              explanation_en:
                'Uncertainty concerns jury reaction, questions in English, and the ability to stay clear under pressure.',
            },
            {
              axis: 'reversibility',
              label_fr: 'Réversibilité',
              label_en: 'Reversibility',
              score: 2,
              explanation_fr:
                'La situation est encore réversible si le message est resserré, répété et préparé avec des réponses courtes aux objections.',
              explanation_en:
                'The situation is still reversible if the message is tightened, rehearsed, and prepared with short answers to objections.',
            },
          ]
        : Array.isArray(sc.radar_details) && sc.radar_details.length > 0 && !radarDetailsLookInternal(sc.radar_details)
        ? sc.radar_details
        : defaultRadarDetails(radar as Record<string, number>, arbre, situation),
      trajectories,
    cap,
    constraints_fr: understands
      ? understandingConstraintsFr
      : isVcCard
      ? [
        'Prouver un ICP précis : le métier, le budget et la décision que le produit aide réellement à traiter.',
        'Transformer la démonstration produit en usage répété, mesurable et partageable par plusieurs utilisateurs.',
        'Montrer une différenciation défendable face aux outils de synthèse, de conseil, de veille ou de collaboration existants.',
      ]
      : isFounderGovernance
      ? [
        'Séparer la gratitude pour l’aide passée de la décision d’ouvrir le capital ou le pouvoir.',
        'Définir par écrit rôle, parts, autorité finale, vesting, période d’essai et conditions de sortie.',
        'Vérifier si le besoin réel est un profil de scale, une conseillère, une salariée senior ou une cofondatrice.',
      ]
      : isHumanDevelopment
      ? [
        'Ne pas transformer l’activité ou la passion en preuve d’obéissance ou de motivation retrouvée.',
        'Distinguer plaisir, performance, fatigue, regard des autres et besoin d’autonomie.',
        'Créer un cadre de parole où il peut expliquer son refus sans perdre la face.',
      ]
      : isPersonalRelationship
      ? [
        'Ne pas transformer un signe affectif isolé en preuve définitive d’intention.',
        'Distinguer histoire passée, chaleur du message, disponibilité réelle et rencontre concrète.',
        'Répondre de façon accueillante sans forcer l’autre à clarifier plus vite que le lien ne le permet.',
      ]
      : isPitchReadiness
      ? [
        'Réduire le pitch à une phrase de promesse, trois preuves et une demande explicite.',
        'Préparer une version anglaise courte, simple et répétable plutôt qu’un anglais parfait.',
        'Anticiper cinq questions du jury avec des réponses de vingt secondes.',
      ]
      : constraintsFr,
    constraints_en: understands
      ? [
        'Identify what this format truly proves: trust, comparison, narrative, decision, or risk reduction.',
        'Distinguish direct technical proof from the trust needed to decide.',
        'Observe who still requires this format, and for what function: filtering, framing, reputation, or commitment.',
      ]
      : isVcCard
      ? [
        'Prove a precise ICP: the role, budget, and decision the product actually helps process.',
        'Turn the product demo into repeated, measurable usage shared by several users.',
        'Show defensible differentiation against existing synthesis, consulting, monitoring, or collaboration tools.',
      ]
      : listFromAxis(sc.constraints_en, constraintsFr, situation),
    uncertainties_fr: understands
      ? ensureContextualBlindSpotFr(understandingUncertaintiesFr, sc.intent_context)
      : isVcCard
      ? ensureContextualBlindSpotFr([
        'Volonté de payer : les utilisateurs voient-ils un gain assez fort pour acheter, renouveler ou recommander ?',
        'Répétabilité : le cas d’usage se reproduit-il dans plusieurs organisations ou reste-t-il trop artisanal ?',
        'Distribution : quel canal permet d’atteindre les premiers acheteurs sans dépendre uniquement du fondateur ?',
      ])
      : isFounderGovernance
      ? ensureContextualBlindSpotFr([
        'Sa demande porte-t-elle sur un vrai engagement opérationnel ou sur une reconnaissance symbolique de l’aide donnée ?',
        'Le lien personnel peut-il supporter un désaccord dur sur stratégie, parts ou autorité ?',
        'Quel rôle précis manque à la startup pour scaler : cofondatrice, COO, board advisor ou apport ponctuel ?',
      ])
      : isHumanDevelopment
      ? ensureContextualBlindSpotFr([
        'Refuse-t-il l’activité, l’échec vécu, le regard des autres, la pression implicite ou la façon dont l’épisode a été partagé ?',
        'Y a-t-il fatigue, honte, perte de plaisir, besoin de réparation ou autre centre d’intérêt plus fort ?',
        'Quel cadre lui permettrait de revenir au lien sans devoir se justifier ?',
      ])
      : isPersonalRelationship
      ? ensureContextualBlindSpotFr([
        'Le signe affectif annonce-t-il une intention, une nostalgie, une politesse chaleureuse ou une simple reprise de lien ?',
        'Qui prend l’initiative concrète : proposer un rendez-vous, maintenir le rythme des messages, clarifier le ton ?',
        'Quelle part vient de l’histoire passée, de la distance, de la projection ou du moment présent ?',
      ])
      : isPitchReadiness
      ? ensureContextualBlindSpotFr([
        'Quel message doit rester en mémoire si le jury ne retient qu’une seule phrase ?',
        'Quelles objections risquent de déstabiliser : marché, produit, traction, différenciation ou crédibilité ?',
        'Quelle partie du pitch devient fragile en anglais : ouverture, transition, preuve ou réponse aux questions ?',
      ])
      : ensureContextualBlindSpotFr(uncertaintiesFr, sc.intent_context),
    uncertainties_en: understands
      ? ensureContextualBlindSpotEn([
        'Which direct proof can truly replace this format: usage, adoption, revenue, retention, or customer decision?',
        'Which actors still give it authority, and why?',
        'When does the format stop clarifying the decision and become only a ritual?',
      ])
      : isVcCard
      ? ensureContextualBlindSpotEn([
        'Willingness to pay: do users see enough value to buy, renew, or recommend?',
        'Repeatability: does the use case recur across organizations or remain too bespoke?',
        'Distribution: which channel reaches early buyers without depending only on the founder?',
      ])
      : ensureContextualBlindSpotEn(listFromAxis(sc.uncertainties_en, uncertaintiesFr, situation), sc.intent_context),
    movements_fr: understands
      ? understandingMovementsFr
      : isVcCard
      ? [
        'Identifier l’ICP prioritaire et la décision critique que la carte rend plus claire.',
        'Mesurer l’usage répété, le temps gagné et la volonté de payer sur quelques utilisateurs qualifiés.',
        'Transformer la démo en preuve investissable : pipeline, rétention, prix et canal d’acquisition.',
      ]
      : isFounderGovernance
      ? [
        'Écrire le rôle demandé, les pouvoirs associés et ce qui serait explicitement exclu.',
        'Tester une collaboration limitée avant toute attribution de parts ou de titre fondateur.',
        'Prévoir dès le départ une clause de sortie et un mode de résolution des conflits.',
      ]
      : isHumanDevelopment
      ? [
        'Explorer ce que l’épisode représente maintenant pour lui : plaisir abîmé, pression, honte, fatigue ou besoin de réparation.',
        'Lui laisser choisir une activité, un rythme, une pause ou une manière de reprendre sans objectif de performance immédiat.',
        'Observer si le dialogue rouvre du désir ou si le refus protège une difficulté plus profonde.',
      ]
      : isPersonalRelationship
      ? [
        'Accueillir le signe sans le transformer immédiatement en promesse.',
        'Proposer un cadre simple de rencontre ou d’échange, puis observer la réponse réelle.',
        'Laisser VI enquêter sur le rythme, les actes et les mots exacts plutôt que remplir l’ambiguïté.',
      ]
      : isPitchReadiness
      ? [
        'Écrire une version de 60 secondes : problème, promesse, preuve, demande.',
        'Répéter à voix haute en anglais trois fois par jour jusqu’au pitch.',
        'Préparer une réponse courte aux objections probables plutôt que défendre tout le projet.',
      ]
      : cleanList(ensureList(sc.movements_fr, [
      'Identifier les forces qui agissent, bloquent ou supportent la situation.',
      'Transformer VI en enquête : quel angle absent peut renverser la lecture ?',
      ENQUIRY_REBOUND_FR,
    ])),
    movements_en: understands
      ? [
        'Name the format’s real function: proving, comparing, reassuring, narrating, or committing.',
        'Compare that function with the more direct proofs already available.',
        'Spot the signal showing authority moving from narrative to usage.',
      ]
      : isVcCard
      ? [
        'Identify the priority ICP and the critical decision the card makes clearer.',
        'Measure repeated usage, time saved, and willingness to pay among qualified users.',
        'Turn the demo into investable proof: pipeline, retention, pricing, and acquisition channel.',
      ]
      : cleanList(ensureList(sc.movements_en, [
      'Identify the forces acting, blocking, or carrying the situation.',
      'Turn VI into inquiry: which absent angle could reverse the reading?',
      ENQUIRY_REBOUND_EN,
    ])),
    avertissement_fr: understands
      ? 'Ne pas confondre compréhension de la question et remplissage d’un cadre.'
      : isVcCard
      ? 'Ne pas confondre intérêt en démonstration et preuve d’investissement.'
      : isFounderGovernance
      ? 'Ne pas confondre gratitude, prestige du profil et solidité d’un pacte d’associés.'
      : isHumanDevelopment
      ? 'Ne pas confondre refus de l’activité, déception vécue et besoin de reprendre la main.'
      : isPersonalRelationship
      ? 'Ne pas confondre signe affectif, intention claire et projection personnelle.'
      : isPitchReadiness
      ? 'Ne pas confondre niveau d’anglais et clarté stratégique du message.'
      : cleanPublicText(firstText(
        [sc.avertissement_fr, sc.avertissement],
        'Ne pas confondre tenue apparente et capacité réelle d’absorption.'
      )),
    avertissement_en: cleanPublicText(firstText(
      [sc.avertissement_en, sc.avertissement],
      'Structural reading from available signals.'
    )),
  }

  return enrichWithScoring(
    {
      ...completed,
      radar_details: normalizeRadarBlindSpotLabels(completed.radar_details),
    },
    branches
  ) as SituationCard
}

async function fetchResourcesFast(situation: string): Promise<ResourceItem[]> {
  const timeout = new Promise<ResourceItem[]>((resolve) => {
    setTimeout(() => resolve([]), hasExplicitUrl(situation) ? 15000 : 8000)
  })

  try {
    return await Promise.race([fetchResources(situation), timeout])
  } catch (error) {
    console.warn('generate fast resources fallback:', error)
    return []
  }
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

async function generateFastCardWithOpenAI(
  situation: string,
  branches: AstrolabeBranch[] = [],
  arbre: ArbreACamesAnalysis,
  resources: ResourceItem[],
  intentContext?: IntentContext,
  concreteTheatre?: ConcreteTheatre
) {
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
        max_tokens: 2200,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `${FAST_CARD_PROMPT}\n\nContext:\n${JSON.stringify(
              { situation, arbre, resources, interpreted_request: intentContext?.interpreted_request, intent_context: intentContext, concrete_theatre: concreteTheatre },
              null,
              2
            )}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI generation failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    const sc = parseModelJSON(typeof content === 'string' ? content : extractOpenAIText(data))
    return enrichWithScoring(sc, branches)
  } finally {
    clearTimeout(timeout)
  }
}

async function generateFastCard(
  situation: string,
  branches: AstrolabeBranch[] = [],
  arbre: ArbreACamesAnalysis,
  resources: ResourceItem[],
  intentContext?: IntentContext,
  concreteTheatre?: ConcreteTheatre
) {
  console.log('GENERATE START: Tavily resources -> OpenAI SC')
  return generateFastCardWithOpenAI(situation, branches, arbre, resources, intentContext, concreteTheatre)
}

function buildFallbackCard(
  situation: string,
  arbre: ArbreACamesAnalysis,
  resources: ResourceItem[],
  branches: AstrolabeBranch[],
  intentContext?: IntentContext
): SituationCard {
  const scope = detectScopeContext(situation, arbre)
  const wideGlobal = scope.scope === 'global'
  const isPersonalRelationship = isPersonalRelationshipCard(undefined, intentContext)
  const humanDevelopment = /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|sport|p[eê]che|carpe|loisir|passion|motivation)\b/i.test(situation)
  const powerLens = firstSafeText(
    [arbre.rapports_de_force?.[0], arbre.forces?.[0]],
    situation,
    `les leviers réels en présence : ${powersLabel(arbre, 'qui peut agir, bloquer, légitimer, user ou faire basculer')}`
  ).replace(/^puissances en présence\s*:\s*/i, '').replace(/[.;]+$/g, '')
  const vulnerability = wideGlobal
    ? 'Le point fragile est le passage d’un choc local vers plusieurs canaux de puissance à la fois.'
    : humanDevelopment
      ? 'Le point fragile est le moment où une passion partagée devient pression, comparaison ou perte d’autonomie.'
    : isPersonalRelationship
      ? 'Le point fragile est le risque de transformer un signe affectif en certitude avant que les actes aient clarifié l’intention.'
    : firstSafeText(
        [arbre.main_vulnerability_candidate],
        situation,
        'Le point fragile est le levier réel qui n’est pas encore protégé ou clarifié.'
      )
  const contradiction = wideGlobal
    ? 'Le théâtre initial peut rester contenu localement, mais ses effets peuvent circuler par l’énergie, les marchés, les alliances, les seuils militaires ou les récits politiques.'
    : humanDevelopment
      ? 'Le parent veut comprendre et réparer le lien, tandis que l’adolescent peut protéger son autonomie, son image ou sa manière de vivre la déception.'
    : isPersonalRelationship
      ? 'Un message peut réchauffer un lien ancien, mais seule la suite des échanges montre s’il ouvre une rencontre, une clarification ou seulement une chaleur prudente.'
    : firstSafeText(
        [arbre.load_bearing_contradiction],
        situation,
        'Ce qui paraît stable dépend d’un levier discret qui peut bloquer, user ou faire basculer.'
      )
  const radar = {
    impact: 55,
    urgency: 50,
    uncertainty: 60,
    reversibility: 45,
  }
  const interpreted = intentContext?.interpreted_request
  const understands =
    interpreted?.intent_type === 'understand' &&
    !isPersonalRelationship &&
    intentContext?.dominant_frame !== 'site_analysis' &&
    intentContext?.dominant_frame !== 'startup_investment' &&
    intentContext?.dominant_frame !== 'causal_attribution' &&
    intentContext?.surface_domain !== 'war' &&
    interpreted?.domain !== 'war' &&
    intentContext?.decision_type !== 'analyze_site' &&
    intentContext?.decision_type !== 'evaluate_investment'
  const objectLabel = cleanPublicText(interpreted?.object_of_analysis ?? '').replace(/[.;:]+$/g, '') || 'l’objet de la question'
  const trajectorySubject = conciseTrajectorySubject(objectLabel)
  const objectSentence = capitalizeFirst(objectLabel)
  const objectDe = afterDe(objectLabel)
  const tensionLabel = cleanPublicText(interpreted?.implicit_tension ?? '').replace(/[.;:]+$/g, '') || 'un format visible continue à organiser confiance, preuve et décision'
  const understandingInsight =
    `${objectSentence} met en tension ce qui est craint, ce qui est possible et ce qui est prouvable. Le point décisif est la capacité réelle des acteurs à transformer cette tension en décision, blocage ou changement observable.`
  const understandingVulnerability =
    'Le point fragile est le passage entre crainte, intention, capacité réelle et acte vérifiable.'
  const understandingAsymmetry =
    'La tension peut être largement commentée, mais elle ne devient lisible qu’en identifiant qui peut réellement agir, bloquer ou légitimer.'
  const understandingSignal =
    'Le signal clé serait un acte vérifiable : décision, refus, procédure, pression organisée, changement de calendrier ou prise de position qui modifie les marges d’action.'
  const understandingLecture =
    `${objectSentence} ne se résume pas à une inquiétude générale. La situation se joue dans l’écart entre une crainte formulée et la capacité concrète des acteurs à la traduire en acte : décision, blocage, procédure, pression publique ou déplacement du calendrier.\n\n` +
    `La contradiction centrale tient à ceci : ${tensionLabel}. Une perception peut devenir politiquement puissante avant d’être prouvée, mais elle ne devient structurante que si elle rencontre des relais capables de la porter, de la légaliser, de la financer, de la médiatiser ou de la bloquer.\n\n` +
    `Le point de bascule sera observable. Il apparaîtra lorsqu’un acteur, une institution ou un canal changera de registre : recours, refus, consigne publique, arbitrage, calendrier modifié ou preuve qui rend impossible de traiter la situation comme une simple inquiétude.`
  const siteFallback = siteAnalysisFallbackCard({
    situation,
    arbre,
    resources,
    branches,
    intentContext,
  })
  if (siteFallback) return siteFallback

  return enrichWithScoring(
    {
      title_fr: 'Lecture structurelle',
      title_en: 'Structural Reading',
      submitted_situation_fr: situation,
      submitted_situation_en: situation,
      insight_fr:
        understands
          ? understandingInsight
          :
        wideGlobal
          ? 'La situation se lit à l’échelle des puissances capables de transformer une crise locale en signal mondial : États, marchés, alliances, institutions et récits publics.'
          : humanDevelopment
            ? 'La situation se lit par les forces discrètes du lien : autonomie adolescente, regard parental, ancienne passion, frustration vécue et besoin de ne pas perdre la face.'
          : isPersonalRelationship
            ? 'La situation se lit par la reprise concrète du lien : signe affectif, histoire passée, distance, rythme des messages et possibilité réelle d’une rencontre.'
            : `La situation se lit d’abord par les leviers en présence : ${powerLens}. Le point central est la tension entre ce qui préserve la façade et ce qui peut réellement faire basculer.`,
      insight_en:
        'The situation is first read through the powers in presence: who can act, block, legitimize, wear down, or tip the balance. The central point is the tension between what can still hold and what can now shift the system.',
      main_vulnerability_fr: understands
          ? understandingVulnerability
        : vulnerability,
      main_vulnerability_en: vulnerability,
      asymmetry_fr: understands
        ? understandingAsymmetry
        : contradiction,
      asymmetry_en: contradiction,
      key_signal_fr: understands
          ? understandingSignal
        : isPersonalRelationship
          ? 'Le signal clé est une cohérence entre le signe affectif et les actes : rendez-vous proposé, disponibilité, parole plus claire ou rythme régulier.'
        : 'Le signal clé est le moment où un acteur ou un canal change de registre : décision, blocage, coût visible, récit public ou seuil de rupture.',
      key_signal_en: firstSafeText(
        [arbre.temps?.[0], arbre.temporalites?.[0]],
        situation,
        'The key signal is the moment an actor or channel changes register.'
      ),
      radar,
      radar_details: humanDevelopment
        ? [
            {
              axis: 'impact',
              label_fr: 'Impact',
              label_en: 'Impact',
              score: 2,
              explanation_fr:
                'L’impact porte sur le lien parent-enfant, l’image de soi de l’adolescent et son rapport durable au mouvement.',
              explanation_en:
                'The impact concerns the parent-child bond, the teenager’s self-image, and his long-term relationship to movement.',
            },
            {
              axis: 'urgency',
              label_fr: 'Urgence',
              label_en: 'Urgency',
              score: 1,
              explanation_fr:
                'Il n’y a pas d’urgence sportive immédiate ; l’urgence est de ne pas transformer le sujet en bras de fer.',
              explanation_en:
                'There is no immediate sporting urgency; the urgency is not turning the issue into a power struggle.',
            },
            {
              axis: 'uncertainty',
              label_fr: 'Incertitudes',
              label_en: 'Uncertainties',
              score: 2,
              explanation_fr:
                'L’inconnu principal est ce qu’il protège par ce refus : fatigue, honte, comparaison, perte de désir ou besoin d’autonomie.',
              explanation_en:
                'The main unknown is what he protects through refusal: fatigue, shame, comparison, loss of desire, or need for autonomy.',
            },
            {
              axis: 'reversibility',
              label_fr: 'Réversibilité',
              label_en: 'Reversibility',
              score: 2,
              explanation_fr:
                'La situation reste réversible si un autre cadre lui permet de choisir sans devoir sauver la face.',
              explanation_en:
                'The situation remains reversible if another frame lets him choose without having to save face.',
            },
          ]
        : isPersonalRelationship
          ? personalRelationshipRadarDetails()
        : defaultRadarDetails(radar, arbre, situation),
      trajectories: understands
        ? [
            {
              type: 'stabilization',
              title_fr: 'Mécanisme clarifié',
              title_en: 'Clarified role',
              description_fr: `La situation se clarifie si ${trajectorySubject} est relié à des acteurs, des moyens d’action et des preuves observables.`,
              description_en: 'The situation clarifies if the object remains tied to the actual question.',
              signal_fr: 'Un fait, une décision ou un canal vérifiable permet de distinguer crainte, capacité et acte.',
              signal_en: 'One can state what is established, plausible, not established, and missing.',
            },
            {
              type: 'escalation',
              title_fr: 'Crainte amplifiée',
              title_en: 'Forced frame',
              description_fr: `La pression augmente si ${trajectorySubject} devient un récit dominant sans preuve proportionnée.`,
              description_en: 'Pressure rises if the object is replaced by a generic frame.',
              signal_fr: 'Des accusations, procédures, consignes ou refus publics durcissent les positions.',
              signal_en: 'The answer seems coherent, but no longer answers the exact question.',
            },
            {
              type: 'regime_shift',
              title_fr: 'Seuil rendu visible',
              title_en: 'Open inquiry',
              description_fr: 'La logique change quand ce qui restait supposé devient une décision, un coût, une preuve ou un blocage public.',
              description_en: 'The logic shifts when SC stops filling gaps and asks for the decisive proof or precision.',
              signal_fr: 'Un acteur capable d’agir change de registre et rend la tension vérifiable.',
              signal_en: 'A single question, source, or user follow-up becomes more useful than a conclusion.',
            },
          ]
        : isPersonalRelationship ? personalRelationshipTrajectories()
        : humanDevelopment ? humanDevelopmentTrajectories() : defaultTrajectories(arbre, situation),
      cap: {
        hook_fr: understands
          ? 'Une crainte ne devient structurante que lorsqu’elle trouve un relais capable d’agir.'
          : isPersonalRelationship
          ? personalRelationshipCap().hook_fr
          : humanDevelopment
          ? 'Le refus ou le retrait peut protéger quelque chose que le parent ne voit pas encore.'
          : 'L’aspect de façade n’est pas forcément ce qui protège réellement la situation.',
        hook_en: isPersonalRelationship
          ? personalRelationshipCap().hook_en
          : 'What still holds is not necessarily what truly protects the system.',
        watch_fr: understands
          ? 'Surveiller les actes qui transforment la crainte en capacité : décision, procédure, blocage, consigne, calendrier ou preuve.'
          : isPersonalRelationship
          ? personalRelationshipCap().watch_fr
          : humanDevelopment
          ? 'Surveiller s’il peut parler de fatigue, de honte, de comparaison ou d’envie sans se sentir jugé.'
          : firstSafeText(
              [arbre.temps?.[0], arbre.temporalites?.[0]],
              situation,
              'Surveiller le moment où un refus, un coût, une décision ou un seuil devient visible.'
            ),
        watch_en: isPersonalRelationship
          ? personalRelationshipCap().watch_en
          : firstSafeText(
              [arbre.temps?.[0], arbre.temporalites?.[0]],
              situation,
              'Watch when a refusal, cost, decision, or threshold becomes visible.'
            ),
      },
      movements_fr: [
        ...(understands
          ? [
              'Séparer la crainte exprimée, les acteurs capables d’agir et les preuves observables.',
              'Identifier les relais institutionnels, publics, juridiques ou matériels qui peuvent transformer le risque.',
              'Chercher l’absence décisive : preuve, canal, décision, calendrier ou acteur manquant.',
            ]
          : humanDevelopment
          ? [
              'Demander ce qui a été le plus difficile dans l’expérience, sans chercher tout de suite à convaincre.',
              'Proposer un cadre choisi par lui : autre rythme, autre manière de pratiquer, autre objectif ou simple pause.',
              'Séparer plaisir, performance, fatigue et regard parental pour réduire la pression.',
            ]
          : isPersonalRelationship
          ? [
              'Séparer le signe affectif, l’histoire du lien et ce qui est proposé concrètement.',
              'Observer le rythme des messages, la disponibilité et la clarté de la rencontre.',
              'Répondre sans surinterpréter : accueillir, proposer un cadre simple et laisser le réel préciser l’intention.',
            ]
          : [
              'Identifier les forces qui agissent, bloquent ou supportent la situation.',
              'Repérer le signal concret qui rend la tension visible.',
              'Clarifier le levier qui n’est plus protégé.',
            ]),
      ],
      movements_en: [
        ...([
              'Identify the actors carrying the load.',
              'Watch the temporal tipping point.',
              'Clarify what is no longer protected.',
            ]),
      ],
      avertissement_fr: isPersonalRelationship
        ? 'Ne pas confondre signe affectif, intention claire et projection personnelle.'
        : 'Ne pas confondre façade de contrôle et capacité réelle d’absorption.',
      avertissement_en: isPersonalRelationship
        ? 'Do not confuse an affectionate sign, clear intention, and personal projection.'
        : 'Structural reading from available signals.',
      lecture_systeme_fr: understands
        ? understandingLecture
        : isPersonalRelationship
        ? `La situation doit rester attachée à la scène relationnelle concrète. Elle ne demande pas de transformer un signe affectif en preuve immédiate ; elle demande de comprendre ce qu’un message, une distance, une reprise de contact ou une rencontre possible peuvent ouvrir sans surinterpréter.\n\n` +
          `La contradiction centrale tient à l’écart entre le signe et l’intention. Un cœur, une parole douce, une proposition ou une venue peuvent compter réellement, mais ils ne disent pas seuls ce qui va se passer. Le lien se clarifie par la suite des actes : rythme des messages, initiative concrète, disponibilité, manière de nommer ou d’éviter l’ambiguïté.\n\n` +
          `Le point de bascule sera simple et observable : une proposition de rendez-vous, une parole plus explicite, une cohérence entre le ton et les actes, ou au contraire un retrait qui montre que le signe servait surtout à maintenir une chaleur sans ouvrir davantage.`
        : humanDevelopment
        ? `La situation ne parle pas seulement d’un adolescent qui réagit mal à une déception. Elle fait apparaître plusieurs forces discrètes : désir d’autonomie, regard parental, passion investie, honte de l’échec, fatigue possible et besoin de ne pas perdre la face.\n\n` +
          `La contradiction centrale est délicate : ce qui devait être un moment partagé peut devenir, à quatorze ans, une scène où l’échec paraît exposer l’adolescent. Le retrait ou le reproche ne sont donc pas forcément une accusation stable ; ils peuvent être une manière de reprendre la main, d’éviter la honte, ou de vérifier que le lien tient encore.\n\n` +
          `Le point de bascule sera le moment où la question cessera d’être “qui est responsable ?” pour devenir “comment reconnaître la déception sans enfermer chacun dans son rôle ?”. Le signal utile est sa capacité à revenir au lien, même indirectement, sans devoir justifier toute son émotion.`
        : `La situation ne se joue pas seulement dans l’événement visible. Elle se joue dans la distribution des leviers réels : qui peut agir, bloquer, légitimer, financer, user ou faire basculer.\n\n` +
          `La contradiction centrale tient à ceci : ${contradiction}. La façade peut encore fonctionner, mais il faut regarder quelle force réelle la soutient, la ralentit ou la rend fragile.\n\n` +
          `Le point de bascule sera le moment où ${vulnerability.toLowerCase()} deviendra visible dans une décision, un coût, un refus, un récit public ou un changement de rythme.`,
      lecture_systeme_en:
        `The situation is no longer only in the visible event. It is entering a phase where the system can still display control while its material, social, or political margins narrow.\n\n` +
        `The central contradiction lies between what appears controlled and what is becoming harder to absorb: ${firstSafeText([arbre.load_bearing_contradiction], situation, 'a quiet lever can block, wear down, or tip the situation')}.\n\n` +
        `The tipping point arrives when constraints, timing, and perceptions no longer contain ${firstSafeText([arbre.main_vulnerability_candidate], situation, 'the unprotected fragile point').toLowerCase()}.`,
      generation_status: 'partial',
    },
    branches
  ) as SituationCard
}

function buildDegradedCard({
  situation,
  resources,
  branches,
  resourcesStatus,
  internalError,
}: {
  situation: string
  resources: ResourceItem[]
  branches: AstrolabeBranch[]
  resourcesStatus: 'not_needed' | 'available' | 'unavailable' | 'timeout'
  internalError: string
}): SituationCard {
  const publicMessageFr =
    resourcesStatus === 'unavailable' || resourcesStatus === 'timeout'
      ? 'La Situation Card complète ne peut pas être générée pour le moment : cette demande semble nécessiter des éléments externes, mais la recherche ou la génération approfondie n’est pas disponible actuellement. Vous pouvez réessayer, préciser la situation avec vos propres éléments, ou demander une lecture courte sans sources.'
      : 'La Situation Card complète ne peut pas être générée pour le moment : le service de génération approfondie n’est pas disponible actuellement. Vous pouvez réessayer dans quelques instants ou préciser la situation avec vos propres éléments.'
  const publicMessageEn =
    resourcesStatus === 'unavailable' || resourcesStatus === 'timeout'
      ? 'The full Situation Card cannot be generated right now: this request appears to require external context, but search or deep generation is currently unavailable. You can try again, add your own facts, or request a short structural reading without sources.'
      : 'The full Situation Card cannot be generated right now: deep generation is currently unavailable. You can try again shortly or add your own context.'

  return enrichWithScoring(
    {
      title_fr: 'Génération indisponible',
      title_en: 'Generation unavailable',
      submitted_situation_fr: situation,
      submitted_situation_en: situation,
      insight_fr: publicMessageFr,
      insight_en: publicMessageEn,
      main_vulnerability_fr: 'Analyse complète indisponible pour le moment.',
      main_vulnerability_en: 'Full analysis unavailable for now.',
      asymmetry_fr: 'Le système ne dispose pas actuellement des conditions nécessaires pour produire une carte complète fiable.',
      asymmetry_en: 'The system does not currently have the conditions required to produce a reliable full card.',
      key_signal_fr: 'Réessayer lorsque la génération ou la recherche externe est disponible, ou ajouter des faits vérifiés dans le dialogue.',
      key_signal_en: 'Try again when generation or external search is available, or add verified facts in the dialogue.',
      radar: { impact: 0, urgency: 0, uncertainty: 0, reversibility: 0 },
      radar_details: [],
      trajectories: [],
      cap: {
        hook_fr: 'Carte complète non générée.',
        hook_en: 'Full card not generated.',
        watch_fr: 'Ajouter du contexte vérifié ou réessayer.',
        watch_en: 'Add verified context or try again.',
      },
      movements_fr: [
        'Réessayer dans quelques instants.',
        'Ajouter vos propres faits, dates, acteurs ou sources.',
        'Demander une lecture courte sans sources si l’urgence prime.',
      ],
      movements_en: [
        'Try again shortly.',
        'Add your own facts, dates, actors, or sources.',
        'Request a short reading without sources if urgency matters most.',
      ],
      avertissement_fr: publicMessageFr,
      avertissement_en: publicMessageEn,
      lecture_systeme_fr: publicMessageFr,
      lecture_systeme_en: publicMessageEn,
      resources,
      resources_status: resourcesStatus,
      generation_status: 'degraded',
      generation_error_public: publicMessageFr,
      generation_error_internal: internalError,
    },
    branches
  ) as SituationCard
}

function applyPatternContextToCard(
  sc: SituationCard,
  patternContext: PatternContext,
  domain?: string,
  intentFrame?: string
): SituationCard {
  const allowLegacyPatternOverrides = false
  if (!allowLegacyPatternOverrides) return sc
  if (!patternContext.primary) return sc
  if (intentFrame === 'founder_governance') return sc
  if (
    intentFrame === 'personal_relationship' &&
      /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|sport|p[eê]che|carpe|loisir|passion|motivation)\b/i.test(
      String(sc.submitted_situation_fr ?? sc.submitted_situation_en ?? '')
    )
  ) {
    return sc
  }
  if (
    intentFrame === 'professional_decision' &&
    /\b(pitch|jury|pairs?|presentation|présentation|anglais|lancement|lancer|entrain|entraine)\b/i.test(
      String(sc.submitted_situation_fr ?? sc.submitted_situation_en ?? '')
    )
  ) {
    return sc
  }
  if (!['personal', 'management', 'professional'].includes(domain ?? '')) {
    return sc
  }

  const guidance = patternGuidance(patternContext)
  const firstGuidance = guidance[0] ?? 'identifier le point humain que la situation rend intenable'
  const humanSignal =
    'Le signal à surveiller est le moment où la personne qui porte la charge cesse de compenser silencieusement.'

  const primaryId = patternContext.primary.id
  const refinements: Record<string, Partial<SituationCard>> = {
    recognition_asymmetry: {
      main_vulnerability_fr:
        'Le point fragile est la contribution indispensable qui reste invisible pour les personnes capables de décider ou de protéger.',
      asymmetry_fr:
        'La situation tient parce qu’une personne porte plus qu’elle ne reçoit en reconnaissance, en pouvoir réel ou en protection.',
      key_signal_fr:
        'Le basculement commence quand cette contribution invisible devient retrait, plainte explicite ou demande de tiers.',
    },
    role_container_failure: {
      main_vulnerability_fr:
        'Le point fragile est le rôle lui-même : il ne contient plus la complexité réelle de ce qu’on lui demande de porter.',
      asymmetry_fr:
        'On traite encore le problème comme une responsabilité individuelle alors qu’il exige un contenant plus large, parfois un tiers.',
      key_signal_fr:
        'Le signal clé est l’apparition d’un besoin de médiation, de clarification de mandat ou de rôle externe.',
    },
    emotional_load_asymmetry: {
      main_vulnerability_fr:
        'Le point fragile est la charge émotionnelle concentrée sur une seule personne alors qu’elle devrait être distribuée.',
      asymmetry_fr:
        'Le collectif bénéficie d’une stabilité apparente parce qu’un acteur absorbe seul la tension que les autres évitent.',
      key_signal_fr:
        'Le basculement apparaît quand cette personne réduit son effort, s’épuise ou rend la charge visible.',
    },
    deferred_conflict_saturation: {
      main_vulnerability_fr:
        'Le point fragile est la conversation évitée qui organise désormais toute la pression de la situation.',
      asymmetry_fr:
        'Ce qui semble être un problème récent vient en réalité d’un conflit différé qui a saturé les marges de compromis.',
      key_signal_fr:
        'Le signal clé est le moment où une discussion longtemps évitée devient impossible à différer.',
    },
    boundary_erosion: {
      main_vulnerability_fr:
        'Le point fragile est la limite qui a été franchie trop souvent pour être encore reconnue comme réelle.',
      asymmetry_fr:
        'La situation tient parce qu’une partie continue d’accepter ce qui devrait déjà être renégocié ou refusé.',
      key_signal_fr:
        'Le basculement survient quand une limite est enfin posée et que les autres acteurs la contestent.',
    },
  }

  const refinement = refinements[primaryId] ?? {
    main_vulnerability_fr:
      `Le point fragile est humain et structurel : il faut ${firstGuidance}.`,
    asymmetry_fr:
      'La tension visible masque un déséquilibre plus profond entre ce qui est demandé, porté et reconnu.',
    key_signal_fr: humanSignal,
  }

  return {
    ...sc,
    ...refinement,
    movements_fr: [
      'Nommer qui porte réellement la charge et qui bénéficie de ce silence.',
      'Identifier la conversation, la limite ou le rôle qui ne peut plus être différé.',
      'Tester si un tiers, un mandat clarifié ou une redistribution de charge est nécessaire.',
    ],
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      situation,
      original_situation,
      mode,
      astrolabe_branches,
      resources: rawResources,
      refine_acknowledged,
      generate_prudently,
      conversation_contract,
      dialogue_events,
    } = await req.json()

    if (!situation?.trim()) {
      return NextResponse.json({ error: 'No situation' }, { status: 400 })
    }

    const text = situation.trim()
    const rawDisplayText =
      typeof original_situation === 'string' && original_situation.trim()
        ? normalizeSubmittedSituation(original_situation.trim())
        : normalizeSubmittedSituation(text)
    const hasUserAdditions =
      typeof original_situation === 'string' &&
      original_situation.trim() &&
      normalizeSubmittedSituation(text) !== rawDisplayText
    const canonicalDialogue = await buildCanonicalSituationFromDialogue({
      rawSituation: text,
      originalSituation: typeof original_situation === 'string' ? original_situation : undefined,
      dialogueEvents: dialogue_events,
    })
    const analysisText = canonicalDialogue?.canonical_situation ||
      applyDialogueClarifications(hasUserAdditions ? text : rawDisplayText || text)
    const urlSourceText = [
      text,
      rawDisplayText,
      canonicalDialogue?.canonical_situation ?? '',
      typeof original_situation === 'string' ? original_situation : '',
      dialogueText(dialogue_events),
    ].filter(Boolean).join('\n')
    const hasUrlInFlow = hasExplicitUrl(urlSourceText)
    const urlAugmentedAnalysisText =
      hasUrlInFlow && !hasExplicitUrl(analysisText)
        ? `${analysisText}\n${explicitUrls(urlSourceText).join('\n')}`
        : analysisText
    const previousContract = conversation_contract && typeof conversation_contract === 'object'
      ? conversation_contract as ConversationContract
      : undefined
    const modelInterpreted = await interpretRequestWithModel(analysisText)
    const carriedPreviousContract = shouldCarryConversationContract(modelInterpreted, previousContract, analysisText)
      ? previousContract
      : undefined
    const interpretedRequest = applyConversationContractToIntent(
      modelInterpreted,
      carriedPreviousContract,
      analysisText
    )
    const hasUsableInterpretation =
      !interpretedRequest.needs_clarification &&
      (interpretedRequest.object_of_analysis?.trim().length ?? 0) >= 4 &&
      (interpretedRequest.user_question?.trim().length ?? 0) >= 20 &&
      (Boolean(interpretedRequest.expected_answer_shape?.trim()) || interpretedRequest.confidence >= 0.55)
    const displayText = normalizeSubmittedSituation(
      interpretedRequest.user_question || rawDisplayText || text
    )
    const intentContext = situationIntentRouter(analysisText, interpretedRequest)
    const conversationContract = buildConversationContract({
      situation: analysisText,
      intentContext,
      previous: carriedPreviousContract,
    })
    const canonicalSubmittedText = normalizeSubmittedSituation(
      conversationContract.canonical_situation ||
      canonicalDialogue?.canonical_situation ||
      interpretedRequest.user_question ||
      displayText
    )
    const initialScopeContext = detectScopeContext(analysisText)
    const coverage = coverageCheck(analysisText)
    const inputQuality = inputQualityGate(analysisText)
    const coverageWithQuality = {
      ...coverage,
      intent_context: intentContext,
      conversation_contract: conversationContract,
      scope_context: initialScopeContext,
      canonical_header_subject: canonicalDialogue?.header_subject,
      input_quality: {
        status: inputQuality.status,
        questions: inputQuality.questions,
        signals: inputQuality.signals,
      },
    }
    const clarifyQuestions = selectClarifyingQuestions({
      situation: analysisText,
      domain: coverage.domain,
      intentContext,
      coverage: coverageWithQuality,
      inputQuestions: inputQuality.questions,
      coverageQuestions: coverage.questions,
    })
    const intentGate = clarifyBeforeGenerate({
      situation: analysisText,
      intentContext,
      inputQuality,
    })
    const refineQuestions = selectRefineOptionalQuestions({
      situation: analysisText,
      domain: coverage.domain,
      intentContext,
      coverage: coverageWithQuality,
      inputQuestions: inputQuality.questions,
      coverageQuestions: coverage.questions,
    })
    const effectiveCoverage = {
      ...coverageWithQuality,
      input_quality: {
        ...coverageWithQuality.input_quality,
        intent_gate_status: intentGate.status,
        question_shape: intentGate.shape.kind,
        intent_gate_signals: intentGate.signals,
      },
    }

    if (canonicalDialogue && canonicalDialogue.can_generate === false && canonicalDialogue.next_question && !hasUrlInFlow) {
      return NextResponse.json({
        gate: 'CLARIFY',
        questions: [canonicalDialogue.next_question],
        coverage_check: effectiveCoverage,
      })
    }

    const explicitPrudentGeneration = Boolean(generate_prudently)
    const earlyReadinessGate = situationReadinessGate({
      situation: urlAugmentedAnalysisText,
      intentContext,
      resources: sanitizeResources(rawResources),
      forceGenerate: explicitPrudentGeneration,
    })

    const shouldStopForEarlyReadiness =
      earlyReadinessGate.status === 'ask_user' &&
      earlyReadinessGate.reason !== 'site_content_insufficient' &&
      earlyReadinessGate.question &&
      !explicitPrudentGeneration &&
      !hasUrlInFlow

    if (shouldStopForEarlyReadiness) {
      return NextResponse.json({
        gate: 'CLARIFY',
        questions: [earlyReadinessGate.question],
        coverage_check: {
          ...effectiveCoverage,
          readiness_gate: earlyReadinessGate,
        },
      })
    }

    if (intentGate.shouldClarify && !refine_acknowledged && !hasUrlInFlow) {
      return NextResponse.json({
        gate: 'CLARIFY',
        questions: intentGate.questions,
        coverage_check: effectiveCoverage,
      })
    }

    if (mode !== 'generate' && mode !== 'generate_full') {
      if (inputQuality.questions.length > 0 && !hasUrlInFlow) {
        return NextResponse.json({
          gate: 'CLARIFY',
          questions: clarifyQuestions,
          coverage_check: effectiveCoverage,
        })
      }

      if (coverage.status === 'clarify' && !hasUsableInterpretation && !hasUrlInFlow) {
        return NextResponse.json({
          gate: 'CLARIFY',
          questions: clarifyQuestions,
          coverage_check: effectiveCoverage,
        })
      }

      if (refineQuestions.length > 0 && !refine_acknowledged && !hasUrlInFlow) {
        return NextResponse.json({
          gate: 'REFINE_OPTIONAL',
          questions: refineQuestions,
          coverage_check: effectiveCoverage,
        })
      }

      return NextResponse.json({
        gate: 'GENERATE',
        coverage_check: effectiveCoverage,
      })
    }

    const branches = Array.isArray(astrolabe_branches) && astrolabe_branches.length > 0
      ? astrolabe_branches
      : inferAstrolabeBranches(analysisText, intentContext)
    const providedResources = sanitizeResources(rawResources)
    const webNeeded = hasUrlInFlow || shouldUseWeb(urlAugmentedAnalysisText)
    const rawFetchedResources =
      providedResources.length > 0
        ? providedResources
        : webNeeded
          ? await fetchResourcesFast(urlAugmentedAnalysisText)
          : []
    const resources = await enrichResourcesWithSiteUnderstanding({
      situation: urlAugmentedAnalysisText,
      resources: rawFetchedResources,
      intentContext,
    })
    const readinessGate = situationReadinessGate({
      situation: urlAugmentedAnalysisText,
      intentContext,
      resources,
      forceGenerate: explicitPrudentGeneration || hasUrlInFlow,
    })
    const resourcesStatus =
      rawFetchedResources.length > 0
        ? 'available'
        : webNeeded
          ? 'unavailable'
          : 'not_needed'

    if (readinessGate.status === 'ask_user' && readinessGate.question && !explicitPrudentGeneration && !hasUrlInFlow) {
      return NextResponse.json({
        gate: 'CLARIFY',
        questions: [readinessGate.question],
        coverage_check: {
          ...effectiveCoverage,
          readiness_gate: readinessGate,
        },
        resources_status: resourcesStatus,
      })
    }

    const rawArbre = await analyzeWithArbreACames(analysisText, resources, intentContext)
    const effectiveCoverageWithReadiness = {
      ...effectiveCoverage,
      readiness_gate: readinessGate,
    }
    const arbre = enrichArbreWithCoverage({ arbre: rawArbre, coverage: effectiveCoverageWithReadiness })
    const scopeContext = detectScopeContext(analysisText, arbre)
    const concreteTheatre = buildConcreteTheatre({
      situation: analysisText,
      arbre,
      resources,
      intentContext,
    })
    const effectiveCoverageForGeneration = {
      ...effectiveCoverageWithReadiness,
      concrete_theatre: concreteTheatre,
    }
    const patternContext = detectPatterns({ situation: analysisText, arbre })
    const metierProfile = detectMetierProfile(analysisText)
    const prebuiltSiteCard = siteAnalysisFallbackCard({
      situation: displayText,
      arbre,
      resources,
      branches,
      intentContext,
    })
    let baseSc: SituationCard
    if (prebuiltSiteCard) {
      baseSc = {
        ...prebuiltSiteCard,
        generation_status: readinessGate.status === 'generate_prudently' ? 'partial' : 'ok',
      }
    } else {
      try {
        baseSc = await generateFastCard(displayText, branches, arbre, resources, intentContext, concreteTheatre) as SituationCard
      } catch (error) {
        console.warn('model card generation unavailable, using local fallback:', error)
        const localFallback = intentContext.interpreted_request?.question_type === 'causal_attribution'
          ? causalAttributionCard({
              situation: displayText,
              arbre,
              branches,
              intentContext,
              resources,
            })
          : buildFallbackCard(displayText, arbre, resources, branches, intentContext)
        const fallbackSc: SituationCard = sanitizeSituationCardPublicText(enforceHeaderContract(
          applyEntityExplanationsToSituationCard({
            ...localFallback,
            coverage_check: effectiveCoverageForGeneration,
            intent_context: intentContext,
            conversation_contract: conversationContract,
            scope_context: scopeContext,
            concrete_theatre: concreteTheatre,
            pattern_context: patternContext,
            metier_profile: metierProfile,
            arbre_a_cames: arbre,
            powers_context: arbre.powers_in_presence,
            resources,
            resources_status: resourcesStatus,
            generation_status: 'partial',
            generation_error_internal: error instanceof Error ? error.message : String(error),
          }),
          displayText
        ))
        return NextResponse.json({ gate: 'GENERATE', sc: fallbackSc })
      }
    }
    baseSc = {
      ...baseSc,
      coverage_check: effectiveCoverageForGeneration,
      intent_context: intentContext,
      conversation_contract: conversationContract,
      scope_context: scopeContext,
      concrete_theatre: concreteTheatre,
      metier_profile: metierProfile,
      resources_status: resourcesStatus,
    }
    baseSc = completeSituationCard(baseSc, displayText, arbre, resources, branches)
    baseSc = {
      ...baseSc,
      coverage_check: effectiveCoverageForGeneration,
      intent_context: intentContext,
      conversation_contract: conversationContract,
      scope_context: scopeContext,
      concrete_theatre: concreteTheatre,
    }
    const siteGuard = prebuiltSiteCard ?? siteAnalysisFallbackCard({
      situation: displayText,
      arbre,
      resources,
      branches,
      intentContext,
    })
    if (siteGuard) {
      baseSc = {
        ...baseSc,
        insight_fr: siteGuard.insight_fr,
        insight_en: siteGuard.insight_en,
        main_vulnerability_fr: siteGuard.main_vulnerability_fr,
        main_vulnerability_en: siteGuard.main_vulnerability_en,
        asymmetry_fr: siteGuard.asymmetry_fr,
        asymmetry_en: siteGuard.asymmetry_en,
        key_signal_fr: siteGuard.key_signal_fr,
        key_signal_en: siteGuard.key_signal_en,
        radar: siteGuard.radar,
        radar_details: siteGuard.radar_details,
        trajectories: siteGuard.trajectories,
        cap: siteGuard.cap,
        movements_fr: siteGuard.movements_fr,
        movements_en: siteGuard.movements_en,
        avertissement_fr: siteGuard.avertissement_fr,
        avertissement_en: siteGuard.avertissement_en,
        lecture_systeme_fr: siteGuard.lecture_systeme_fr,
        lecture_systeme_en: siteGuard.lecture_systeme_en,
        state_index_final: siteGuard.state_index_final,
        state_label: siteGuard.state_label,
        state_label_en: siteGuard.state_label_en,
      }
    }
    baseSc = applyPatternContextToCard(
      baseSc,
      patternContext,
      effectiveCoverageForGeneration.domain,
      intentContext.dominant_frame
    )
    if (intentContext.interpreted_request?.question_type === 'causal_attribution') {
      baseSc = {
        ...causalAttributionCard({
          situation: displayText,
          arbre,
          branches,
          intentContext,
          resources,
        }),
        coverage_check: effectiveCoverageForGeneration,
        intent_context: intentContext,
        conversation_contract: conversationContract,
        scope_context: scopeContext,
        concrete_theatre: concreteTheatre,
      }
    }

    const shouldRegenerateLecture =
      !siteGuard &&
      (intentContext.interpreted_request?.intent_type === 'understand' ||
      effectiveCoverageWithReadiness.domain === 'startup_vc' ||
      metierProfile?.id === 'vc_investisseur' ||
      scopeContext.scope === 'global' ||
      intentContext.dominant_frame !== 'general_analysis')
    const hasLecture =
      baseSc.generation_status !== 'partial' &&
      !shouldRegenerateLecture &&
      typeof baseSc.lecture_systeme_fr === 'string' &&
      baseSc.lecture_systeme_fr.trim().length > 80 &&
      typeof baseSc.lecture_systeme_en === 'string' &&
      baseSc.lecture_systeme_en.trim().length > 80

    const lecture = hasLecture
      ? {
          lecture_systeme_fr: baseSc.lecture_systeme_fr,
          lecture_systeme_en: baseSc.lecture_systeme_en,
        }
      : await generateLecture({
          situation: analysisText,
          arbre,
          sc: baseSc,
          resources,
          patternContext,
          metierProfile,
          intentContext,
          scopeContext,
        })

    const assembledSc: SituationCard = {
      ...baseSc,
      ...lecture,
      resources,
      arbre_a_cames: arbre,
      powers_context: arbre.powers_in_presence,
      coverage_check: effectiveCoverageForGeneration,
      intent_context: intentContext,
      conversation_contract: conversationContract,
      scope_context: scopeContext,
      concrete_theatre: concreteTheatre,
      pattern_context: patternContext,
      metier_profile: metierProfile,
      generation_status: baseSc.generation_status ?? 'ok',
      resources_status: resourcesStatus,
    }
    const sc: SituationCard = {
      ...sanitizeSituationCardPublicText(enforceHeaderContract(
      applyEntityExplanationsToSituationCard(
        intentContext.interpreted_request?.question_type === 'causal_attribution'
          ? {
              ...causalAttributionCard({
                situation: displayText,
                arbre,
                branches,
                intentContext,
                resources,
              }),
            ...lecture,
            resources,
            arbre_a_cames: arbre,
            powers_context: arbre.powers_in_presence,
            coverage_check: effectiveCoverageForGeneration,
            intent_context: intentContext,
            conversation_contract: conversationContract,
            scope_context: scopeContext,
            concrete_theatre: concreteTheatre,
            pattern_context: patternContext,
              metier_profile: metierProfile,
              generation_status: assembledSc.generation_status ?? 'partial',
              resources_status: resourcesStatus,
            }
          : assembledSc
      ),
      displayText
      )),
      submitted_situation_fr: canonicalSubmittedText,
      submitted_situation_en: canonicalSubmittedText,
    }

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
