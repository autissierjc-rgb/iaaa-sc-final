import { detectDomain } from '../coverage/detectDomain'
import type { InterpretedRequest, SituationDomain } from '../resources/resourceContract'
import { interpretRequest } from './interpretRequest'

export type DominantFrame =
  | 'causal_attribution'
  | 'founder_governance'
  | 'startup_investment'
  | 'site_analysis'
  | 'experience_explanation'
  | 'personal_relationship'
  | 'team_management'
  | 'professional_decision'
  | 'geopolitical_crisis'
  | 'general_analysis'

export type DecisionType =
  | 'accept_refuse_conditions'
  | 'evaluate_investment'
  | 'analyze_site'
  | 'clarify_relationship'
  | 'resolve_team_blockage'
  | 'choose_action'
  | 'understand_situation'

export type SituationIntentContext = {
  surface_domain: SituationDomain
  dominant_frame: DominantFrame
  decision_type: DecisionType
  interpreted_request?: InterpretedRequest
  needs_clarification: boolean
  clarification_focus: string[]
  questions: string[]
  signals: string[]
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function hasWarSecuritySignal(input: string): boolean {
  return /\b(guerre|militaire|frappe|bombard|missile|cessez|cessez-le-feu|sanction|nucleaire|nucl[eé]aire|frontiere|frontière|otan|civils?|otage|attaque|riposte|escalade|dissuasion|iran|israel|gaza|ukraine|russie|chine|taiwan|syrie|liban|yemen|d[eé]troit|ormuz)\b/i.test(input)
}

function hasClarification(input: string): boolean {
  return /\bpr[eé]cisions?\b/i.test(input) || /\n.+\n/.test(input)
}

function isExperienceExplanation(input: string): boolean {
  return (
    /\b(comment|pourquoi)\s+(?:expliquer|comprendre|raconter|dire)\b.*\b(plaisir|attrait|fascination|gout|goût|interet|intérêt|sens|joie)\b/i.test(input) ||
    /\b(plaisir|attrait|fascination|gout|goût|interet|intérêt|sens|joie)\s+(?:de|du|des|pour)\b/i.test(input)
  )
}

function extractSites(input: string): string[] {
  const matches = input.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? []
  return [...new Set(matches.map((value) =>
    value
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/[),.;:!?]+$/g, '')
      .toLowerCase()
  ))]
}

function hasNamedSiteSignal(input: string): boolean {
  const normalized = normalize(input)
  return (
    /\b(site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?[a-z0-9-]{3,}\b/i.test(normalized) ||
    /\b[a-z0-9-]{3,}\s+(?:site|page|plateforme|application|app|service|outil)\b/i.test(normalized)
  )
}

function siteQuestions(site: string): string[] {
  return [
    `Pour ${site}, quelle décision voulez-vous éclairer : évaluation, investissement, positionnement, risque ou prochaine preuve à produire ?`,
    'Quels éléments doivent peser le plus : produit, utilisateurs, traction, revenus, équipe, marché ou différenciation ?',
  ]
}

export function situationIntentRouter(input: string, interpretedOverride?: InterpretedRequest): SituationIntentContext {
  const text = input.trim()
  const normalized = normalize(text)
  const interpretedRequest = interpretedOverride ?? interpretRequest(text)
  const surfaceDomain = interpretedRequest.domain || detectDomain(text)
  const sites = extractSites(text)
  const clarified = hasClarification(text)

  const hasStartupSignal = hasAny(normalized, ['startup', 'start-up', 'fondateur', 'fondatrice', 'cofondateur', 'co-fondateur', 'confondateur'])
  const hasInvestorSignal = hasAny(normalized, ['vc', 'venture capital', 'capital-risque', 'investisseur', 'investissement', 'levee', 'pre-seed', 'seed', 'term sheet'])
  const hasRelationshipSignal =
    /\b(ex|couple|relation|separation|rupture)\b/.test(normalized) ||
    /\bancien(?:ne)?\s+conjoint(?:e)?\b/.test(normalized)
  const hasFamilyDevelopmentSignal = hasAny(normalized, ['famille', 'parent', 'enfant', 'fils', 'fille', 'ado', 'adolescent', 'adolescente'])
  const hasAssociationSignal = hasAny(normalized, ['associe', 'associer', 's associer', 'cofondateur', 'co-fondateur', 'confondateur', 'parts', 'equity', 'capital', 'role'])
  const hasManagementSignal = hasAny(normalized, ['manager', 'equipe', 'collegue', 'drh', 'organisation', 'reorganisation'])
  const hasPitchSignal =
    /\b(pitch|jury|presentation|anglais|lancement|lancer|entrainement|entraine|entrainé|entrainer)\b/i.test(normalized)
  const hasGeopoliticalSignal = ['geopolitics', 'war'].includes(surfaceDomain)
  const hasGeopoliticalCrisisSignal = surfaceDomain === 'war' || hasWarSecuritySignal(text)
  const hasSiteSignal = sites.length > 0 || hasNamedSiteSignal(text)
  const canonicalSite = interpretedRequest.question_type === 'site_analysis'
  const canonicalPersonal =
    (
      surfaceDomain === 'personal' ||
      interpretedRequest.domain === 'personal' ||
      hasFamilyDevelopmentSignal ||
      hasRelationshipSignal
    ) && !(hasStartupSignal && hasAssociationSignal)

  const understandingQuestion = interpretedRequest.intent_type === 'understand' && !interpretedRequest.needs_clarification
  const predictiveQuestion = interpretedRequest.intent_type === 'predict' && !interpretedRequest.needs_clarification

  if (interpretedRequest.question_type === 'causal_attribution') {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'causal_attribution',
      decision_type: 'understand_situation',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: ['hypothèse causale', 'preuves disponibles', 'contre-hypothèses', 'preuves manquantes'],
      questions: [],
      signals: [
        ...interpretedRequest.signals,
        'contrat canonique : répondre d’abord à l’hypothèse causale',
      ],
    }
  }

  if (canonicalPersonal) {
    return {
      surface_domain: 'personal',
      dominant_frame: 'personal_relationship',
      decision_type: interpretedRequest.intent_type === 'prepare' || /\bcomment\s+(?:reagir|réagir|faire|repondre|répondre)\b/i.test(text)
        ? 'choose_action'
        : 'clarify_relationship',
      interpreted_request: {
        ...interpretedRequest,
        domain: 'personal',
      },
      needs_clarification: false,
      clarification_focus: ['personnes impliquées', 'événement déclencheur', 'posture à tenir', 'autonomie', 'lien'],
      questions: [],
      signals: [
        ...interpretedRequest.signals,
        'contrat canonique : situation personnelle ou familiale',
      ],
    }
  }

  if (canonicalSite && hasSiteSignal && !clarified) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'site_analysis',
      decision_type: 'analyze_site',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: ['site fourni', 'décision à éclairer', 'preuves disponibles'],
      questions: [],
      signals: sites.length > 0 ? [`site mentionné : ${sites.join(', ')}`] : ['site ou page à identifier par recherche'],
    }
  }

  if (isExperienceExplanation(text)) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'experience_explanation',
      decision_type: 'understand_situation',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: ['expérience à rendre lisible', 'gestes concrets', 'ce que voit l’extérieur', 'ce que vit la personne'],
      questions: [],
      signals: ['demande d’explication d’une expérience ou d’un plaisir'],
    }
  }

  if (hasStartupSignal && hasRelationshipSignal && hasAssociationSignal) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'founder_governance',
      decision_type: 'accept_refuse_conditions',
      interpreted_request: interpretedRequest,
      needs_clarification: !clarified,
      clarification_focus: ['décision à trancher', 'rôle demandé', 'parts et pouvoir', 'risque relationnel', 'conditions de gouvernance'],
      questions: clarified
        ? []
        : [
            'Quelle décision devez-vous trancher : accepter, refuser, différer ou poser des conditions à son entrée comme cofondatrice ?',
            'Que demande-t-elle concrètement : rôle, parts, pouvoir de décision, temps de travail, argent investi ou titre, et quel risque voulez-vous éviter ?',
          ],
      signals: ['startup + relation personnelle + association fondatrice'],
    }
  }

  if ((surfaceDomain === 'startup_vc' || (hasStartupSignal && hasInvestorSignal)) && !understandingQuestion) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'startup_investment',
      decision_type: interpretedRequest.intent_type === 'prepare' ? 'choose_action' : 'evaluate_investment',
      interpreted_request: interpretedRequest,
      needs_clarification: !clarified,
      clarification_focus: ['produit', 'client cible', 'preuve d’usage', 'traction', 'décision investisseur'],
      questions: clarified
        ? []
        : [
            'Quel est le produit, son client cible et le problème concret qu’il résout ?',
            'Quelles preuves existent déjà : utilisateurs, revenus, traction, rétention, démonstrations, partenariats ou pipeline commercial ?',
          ],
      signals: ['domaine startup/VC détecté'],
    }
  }

  if (interpretedRequest.intent_type === 'evaluate') {
    const businessLike = surfaceDomain === 'startup_vc' || surfaceDomain === 'economy' || hasStartupSignal || hasInvestorSignal
    return {
      surface_domain: surfaceDomain,
      dominant_frame: businessLike ? 'startup_investment' : 'general_analysis',
      decision_type: businessLike ? 'evaluate_investment' : 'understand_situation',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: businessLike
        ? ['produit', 'marché', 'preuve d’usage', 'différenciation', 'risques']
        : ['objet évalué', 'critères', 'preuves disponibles', 'risques'],
      questions: [],
      signals: [
        ...interpretedRequest.signals,
        `objet à évaluer : ${interpretedRequest.object_of_analysis}`,
      ],
    }
  }

  if (understandingQuestion || predictiveQuestion) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: hasGeopoliticalCrisisSignal ? 'geopolitical_crisis' : 'general_analysis',
      decision_type: 'understand_situation',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: [
        interpretedRequest.object_of_analysis,
        interpretedRequest.implicit_tension,
        'acteurs et mécanismes concrets',
      ],
      questions: [],
      signals: [
        ...interpretedRequest.signals,
        `objet interprété : ${interpretedRequest.object_of_analysis}`,
        `tension interprétée : ${interpretedRequest.implicit_tension}`,
      ],
    }
  }

  if (surfaceDomain === 'personal' || hasRelationshipSignal || hasFamilyDevelopmentSignal) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'personal_relationship',
      decision_type: 'clarify_relationship',
      interpreted_request: interpretedRequest,
      needs_clarification: text.length < 80 && !clarified,
      clarification_focus: ['personnes impliquées', 'événement déclencheur', 'attente réelle', 'puissances en présence'],
      questions: text.length < 80 && !clarified
        ? [
            'Qui est impliqué et quel est le lien entre vous ?',
            'Quelle décision, limite ou conversation voulez-vous éclairer maintenant ?',
          ]
        : [],
      signals: ['enjeu relationnel détecté'],
    }
  }

  if (surfaceDomain === 'management' || hasManagementSignal) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'team_management',
      decision_type: 'resolve_team_blockage',
      interpreted_request: interpretedRequest,
      needs_clarification: text.length < 90 && !clarified,
      clarification_focus: ['acteurs', 'rôle de l’utilisateur', 'décision attendue', 'risque si rien ne change'],
      questions: text.length < 90 && !clarified
        ? [
            'Qui sont les acteurs impliqués et quel est votre rôle exact ?',
            'Quelle décision ou clarification doit être obtenue maintenant ?',
          ]
        : [],
      signals: ['enjeu collectif ou managérial détecté'],
    }
  }

  if (hasGeopoliticalSignal && hasGeopoliticalCrisisSignal) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'geopolitical_crisis',
      decision_type: 'understand_situation',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: ['acteurs', 'seuils', 'temporalités', 'lieux critiques', 'sources'],
      questions: [],
      signals: ['crise géopolitique ou guerre détectée'],
    }
  }

  if (hasPitchSignal) {
    return {
      surface_domain: surfaceDomain,
      dominant_frame: 'professional_decision',
      decision_type: 'choose_action',
      interpreted_request: interpretedRequest,
      needs_clarification: false,
      clarification_focus: ['message central', 'jury', 'préparation', 'anglais', 'répétition'],
      questions: [],
      signals: ['pitch, lancement ou présentation détecté'],
    }
  }

  return {
    surface_domain: surfaceDomain,
    dominant_frame: surfaceDomain === 'professional' ? 'professional_decision' : 'general_analysis',
    decision_type: surfaceDomain === 'professional' ? 'choose_action' : 'understand_situation',
    interpreted_request: interpretedRequest,
    needs_clarification: text.length < 30 && !clarified,
    clarification_focus: ['situation concrète', 'acteurs', 'décision ou question à éclairer'],
    questions: text.length < 30 && !clarified
      ? [
          'Quelle est la situation concrète à analyser ?',
          'Quels acteurs, faits ou données doivent absolument être pris en compte ?',
          'Quelle décision, tension ou question voulez-vous éclairer ?',
        ]
      : [],
    signals: [],
  }
}
