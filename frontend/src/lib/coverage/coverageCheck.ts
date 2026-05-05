import type { CoverageCheck } from '../resources/resourceContract'
import { interpretRequest } from '../intent/interpretRequest'
import { detectDomain } from './detectDomain'
import { getDomainCoverage } from './domainCoverage'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function looksLikeClarificationAnswer(input: string): boolean {
  return /\bpr[eé]cisions?\b/i.test(input) || /\n.+\n/.test(input)
}

function hasQuestionOnlyShape(input: string): boolean {
  const text = normalize(input).trim()
  return /^(quel|quelle|quels|quelles|que|quoi|comment|pourquoi|peux-tu|analyse|situation)\b/.test(text) && text.length < 28
}

function extractRequestedSites(input: string): string[] {
  const matches = input.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? []
  const excluded = new Set(['openai.com', 'anthropic.com'])
  const seen = new Set<string>()

  return matches
    .map((value) =>
      value
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/[),.;:!?]+$/g, '')
        .toLowerCase()
    )
    .filter((value) => {
      if (!value || excluded.has(value) || seen.has(value)) return false
      seen.add(value)
      return true
    })
}

function asksForSiteAnalysis(input: string, requestedSites: string[]): boolean {
  if (requestedSites.length === 0) return false
  const text = normalize(input)
  return /\b(analyse|analyser|evaluer|evaluation|audit|pourquoi|selection|selectionne|investissement|investir|vc|site|startup|business|modele|traction)\b/.test(text)
}

function isFounderAssociationCase(input: string): boolean {
  const text = normalize(input)
  return (
    /\b(ex|ancien conjoint|ancienne conjointe|relation)\b/.test(text) &&
    /\b(cofondateur|co-fondateur|confondateur|associe|associer|s associer|startup|start-up)\b/.test(text)
  )
}

function siteClarifyQuestions(site: string): string[] {
  return [
    `Pour ${site}, quelle décision voulez-vous éclairer : évaluation, investissement, positionnement, risque ou prochaine preuve à produire ?`,
    'Quels éléments doivent peser le plus : produit, marché, traction, équipe, différenciation, revenus, usage ou potentiel investisseur ?',
  ]
}

function detectMissingCritical(input: string, requiredSignals: string[]): string[] {
  const text = normalize(input)
  const missing: string[] = []
  const requestedSites = extractRequestedSites(input)

  if (/\b(startup|start-up|vc|venture capital|capital-risque|levee|investissement startup|pre-seed|seed)\b/.test(text) && !isFounderAssociationCase(input)) {
    if (!/\b(produit|plateforme|saas|logiciel|outil|service|proposition de valeur|probleme|usage)\b/.test(text)) {
      missing.push('produit ou proposition de valeur')
    }
    if (!/\b(client|utilisateur|icp|cible|persona|acheteur|marche|segment)\b/.test(text)) {
      missing.push('client cible ou marché adressé')
    }
    if (!/\b(traction|revenu|revenus|mrr|arr|retention|utilisateurs|clients|demo|pilote|partenariat|pipeline)\b/.test(text)) {
      missing.push('traction, revenus ou preuve d’usage')
    }
    if (!/\b(equipe|fondateur|fondatrice|founder|experience|execution|cto|ceo)\b/.test(text)) {
      missing.push('équipe fondatrice et capacité d’exécution')
    }
    if (!/\b(differenciation|moat|concurren|avantage|barriere|defendable|unique)\b/.test(text)) {
      missing.push('différenciation ou avantage défendable')
    }
    if (!/\b(pre-seed|seed|serie a|follow-on|ticket|levee|valorisation|investir|selection|pitch)\b/.test(text)) {
      missing.push('stade de levée ou décision investisseur')
    }
  }

  if (/\b(iran|teheran|cessez-le-feu|nucleaire|cgr|israel)\b/.test(text)) {
    if (!/\b(khamenei|guide supreme|guide supr[eê]me|raissi|pezeshkian|trump|washington)\b/.test(text)) {
      missing.push('dirigeants nommés : Khamenei / Guide suprême, Trump / Washington selon le cas')
    }
    if (!/\b(cgri|irgc|armee|renseignement|securitaire|militaire)\b/.test(text)) {
      missing.push('institutions militaires ou sécuritaires : CGRI / IRGC, armée, renseignement')
    }
    if (!/\b(ormuz|detroit d ormuz|golfe|oman|teheran|israel|infrastructure)\b/.test(text)) {
      missing.push('lieux ou chokepoints : détroit d’Ormuz, Oman, Israël/Iran, infrastructures critiques')
    }
    if (!/\b(nucleaire|energie|petrole|raffinerie|militaire|infrastructure|sanction)\b/.test(text)) {
      missing.push('infrastructures critiques : nucléaire, énergie, militaire, sanctions')
    }
    if (!/\b(oman|qatar|onu|washington|moscou|pekin|mediateur|mediation|proxy|proxies|hezbollah|houthis)\b/.test(text)) {
      missing.push('acteurs tiers ou médiateurs : Oman, proxies, ONU ou puissances tierces')
    }
    if (!/\b(24|48|seuil|riposte|incident|frappe|rupture|escalade|cessez-le-feu)\b/.test(text)) {
      missing.push('seuils d’escalade et temporalités : 24–48 h après incident, rupture de pause')
    }
  }

  const signalMissing = requiredSignals.filter((signal) => {
    if (signal.includes('acteur')) return !/\b(qui|avec|contre|entre|manager|equipe|iran|israel|trump|client|famille|collegue|ong|autorite)\b/.test(text)
    if (signal.includes('décision') || signal.includes('question')) return !/\b(decider|decision|choisir|faire|trancher|question|comprendre|analyser)\b/.test(text)
    if (signal.includes('temps') || signal.includes('temporal')) return !/\b(aujourd|demain|hier|semaine|mois|annee|24|48|depuis|apres|avant|maintenant)\b/.test(text)
    if (signal.includes('lieu') || signal.includes('théâtre')) return !/\b(iran|israel|gaza|ukraine|rdc|kivu|oman|ormuz|teheran|washington|frontiere|ville|pays)\b/.test(text)
    if (signal.includes('limite')) return !/\b(limite|deborde|abus|refus|peur|risque|charge|pression)\b/.test(text)
    if (signal.includes('tentatives')) return !/\b(deja|tent[eé]|essay[eé]|parl[eé]|fait|aucun)\b/.test(text)
    if (signal.includes('source') || signal.includes('vérification')) return !/\b(source|verifi|temoin|document|preuve|confirme|autorite)\b/.test(text)
    return false
  })

  return [...missing, ...signalMissing.filter((signal) => !missing.includes(signal))]
}

export function coverageCheck(input: string): CoverageCheck {
  const text = input.trim()
  const domain = detectDomain(text)
  const coverage = getDomainCoverage(domain)
  const interpreted = interpretRequest(text)
  const requestedSites = extractRequestedSites(text)
  const hasClarificationAnswer = looksLikeClarificationAnswer(text)
  const needsSiteClarification =
    asksForSiteAnalysis(text, requestedSites) && requestedSites.length === 0 && !hasClarificationAnswer
  const missingCritical = detectMissingCritical(text, coverage.requiredSignals)
  const shouldClarify =
    needsSiteClarification ||
    (!hasClarificationAnswer &&
      domain === 'startup_vc' &&
      requestedSites.length === 0 &&
      interpreted.intent_type !== 'understand' &&
      missingCritical.length > 0) ||
    (!hasClarificationAnswer &&
      ['personal', 'management', 'professional'].includes(domain) &&
      missingCritical.length > 1) ||
    (!hasClarificationAnswer &&
      (text.length < coverage.minimumInputLength || hasQuestionOnlyShape(text)) &&
      domain !== 'geopolitics' &&
      domain !== 'war')

  return {
    domain,
    status: shouldClarify ? 'clarify' : 'sufficient',
    questions: shouldClarify
      ? needsSiteClarification
        ? siteClarifyQuestions(requestedSites[0] ?? 'le site')
        : coverage.clarifyQuestions.slice(0, 2)
      : [],
    missingCritical,
    requiredSignals: coverage.requiredSignals,
    requestedSites,
  }
}
