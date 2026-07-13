import type { ResourceItem } from './resourceContract'

export const SEARCH_STOPWORDS = new Set([
  'avec', 'dans', 'pour', 'plus', 'moins', 'cela', 'cette', 'ceux', 'dont', 'quoi', 'quel', 'quelle',
  'quels', 'quelles', 'apres', 'après', 'deux', 'mois', 'guerre', 'guerres', 'feu', 'nous', 'mener',
  'peut', 'etre', 'être', 'faire', 'fait', 'dire', 'dit', 'then', 'that', 'what', 'with', 'from',
  'this', 'will', 'have', 'about', 'after', 'before', 'over', 'into', 'where', 'when',
])

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function searchKeywords(value: string): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(/[^a-z0-9]+/i)
        .map((word) => word.trim())
        .filter((word) => (word.length >= 4 || word === 'us') && !SEARCH_STOPWORDS.has(word))
    )
  ).slice(0, 12)
}

// Appariement par cognat : une question française et une source anglaise
// partagent leurs noms propres et leurs racines latines (Russie/Russia,
// iranien/Iranian, situation/situation) mais pas leurs flexions. Un token
// correspond s'il est contenu tel quel ou si les deux mots partagent leurs
// cinq premiers caractères normalisés. Aucun lexique de pays ou d'acteurs :
// la règle vaut pour n'importe quel sujet.
const COGNATE_PREFIX_LENGTH = 5

function cognateMatch(keyword: string, haystack: string, haystackTokens: string[]): boolean {
  if (haystack.includes(keyword)) return true
  if (keyword.length < COGNATE_PREFIX_LENGTH) return false
  const prefix = keyword.slice(0, COGNATE_PREFIX_LENGTH)
  return haystackTokens.some((token) => token.length >= COGNATE_PREFIX_LENGTH && token.startsWith(prefix))
}

function haystackTokensOf(haystack: string): string[] {
  return haystack.split(/[^a-z0-9]+/).filter((token) => token.length >= 4)
}

// Les ancres de pertinence viennent d'abord de la compréhension du référent
// canonique (entités expliquées, objet d'analyse, sujet d'en-tête) : c'est
// lui qui sait que « russe » désigne la Russie, minuscule ou pas. Zéro
// re-dérivation lexicale quand l'interprétation est disponible.
const GENERIC_ANCHOR_WORDS = new Set([
  'situation', 'question', 'analyse', 'analyses', 'evolution', 'evolutions',
  'contexte', 'comprendre', 'explication', 'probable', 'possible', 'actuel',
  'actuelle', 'identifier', 'expliciter', 'nom', 'propre', 'acronyme',
])

export function relevanceAnchorsFromUnderstanding(understanding: {
  entity_explanations?: Array<{ label?: string; explanation?: string }>
  object_of_analysis?: string
  header_subject?: string
}): string[] {
  const parts: string[] = []
  for (const entity of understanding.entity_explanations ?? []) {
    if (entity.label) parts.push(entity.label)
    if (entity.explanation) parts.push(entity.explanation)
  }
  if (understanding.object_of_analysis) parts.push(understanding.object_of_analysis)
  if (understanding.header_subject) parts.push(understanding.header_subject)

  const anchors = new Set<string>()
  for (const part of parts) {
    for (const token of normalizeSearchText(part).split(/[^a-z0-9]+/)) {
      if (token.length >= 4 && !SEARCH_STOPWORDS.has(token) && !GENERIC_ANCHOR_WORDS.has(token)) {
        anchors.add(token)
      }
    }
  }
  return Array.from(anchors).slice(0, 16)
}

// Repli lexical quand aucune interprétation n'est disponible : les noms
// propres de la question (majuscule hors début de phrase).
export function queryProperNounAnchors(query: string): string[] {
  const anchors = new Set<string>()
  let sentenceStart = true
  for (const raw of query.split(/\s+/)) {
    const word = raw.replace(/^[«"'(\[]+/, '')
    const core = word.replace(/[»")\],.;:!?…]+$/g, '')
    if (!core) continue
    if (!sentenceStart && /^[A-ZÀ-Þ]/.test(core) && core.length >= 4) {
      for (const part of normalizeSearchText(core).split(/[^a-z0-9]+/)) {
        if (part.length >= 4) anchors.add(part)
      }
    }
    sentenceStart = /[.!?…:]$/.test(word)
  }
  return Array.from(anchors)
}

export function resourceSearchText(resource: ResourceItem): string {
  return normalizeSearchText(`${resource.title ?? ''} ${resource.excerpt ?? ''} ${resource.url ?? ''}`)
}

export function extractRequestedDomains(value: string): string[] {
  const matches = value.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi) ?? []
  const seen = new Set<string>()
  return matches
    .map((match) =>
      match
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '')
        .replace(/[),.;:!?]+$/g, '')
        .toLowerCase()
    )
    .filter((domain) => {
      if (!domain || seen.has(domain)) return false
      seen.add(domain)
      return true
    })
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export function isDirectSiteResource(resource: ResourceItem): boolean {
  return resource.type === 'requested-site' ||
    resource.type === 'site-crawl-summary' ||
    /direct-site/i.test(resource.reliability ?? resource.source ?? '')
}

function isCausalInfluenceQuery(query: string): boolean {
  const text = normalizeSearchText(query)
  return /\b(guerre|war|conflit|crise|decision|decision|arbitrage|responsabilite|responsibility|influence|pouvoir|rapport)\b/i.test(text) &&
    /\b(entraine|entraine|pousse|force|manipule|provoque|cause|declenche|amene|dragged|pushed|led|influence)\b/i.test(text)
}

// Les publications de plateformes sociales ne sont pas des preuves
// probantes : n'importe qui peut y publier n'importe quoi, sans date fiable
// ni responsabilité éditoriale. Règle de qualité de source, pas de cas
// spécial : elle vaut pour tout sujet.
const SOCIAL_POST_HOSTS = new Set([
  'facebook.com', 'm.facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'tiktok.com', 'vk.com', 't.me', 'youtube.com', 'reddit.com', 'threads.net',
])

export function isSocialPostResource(resource: ResourceItem): boolean {
  const host = hostname(resource.url)
  return SOCIAL_POST_HOSTS.has(host)
}

// Les ancres issues de la compréhension sont peu nombreuses et sûres :
// l'appariement tolère les flexions FR/EN par préfixe partagé de quatre
// caractères (russe~Russia, iranien~Iranian).
function anchorMatch(anchor: string, haystack: string, haystackTokens: string[]): boolean {
  if (haystack.includes(anchor)) return true
  if (anchor.length < 4) return false
  const prefix = anchor.slice(0, 4)
  return haystackTokens.some((token) => token.startsWith(prefix))
}

export function isRelevantResource(resource: ResourceItem, query: string, understandingAnchors?: string[]): boolean {
  if (isSocialPostResource(resource)) return false
  const haystack = resourceSearchText(resource)
  if (!haystack) return false
  if (isDirectSiteResource(resource)) {
    const requestedDomains = extractRequestedDomains(query)
    const host = hostname(resource.url)
    if (requestedDomains.length === 0 || requestedDomains.includes(host)) return true
  }

  const queryKeywords = searchKeywords(query)
  const causalQuery = isCausalInfluenceQuery(query)

  if (queryKeywords.length === 0) return true

  const haystackTokens = haystackTokensOf(haystack)
  const overlap = queryKeywords.filter((keyword) => cognateMatch(keyword, haystack, haystackTokens)).length
  const anchors = understandingAnchors?.length ? understandingAnchors : queryProperNounAnchors(query)

  if (anchors.length > 0) {
    const anchorHit = anchors.some((anchor) => anchorMatch(anchor, haystack, haystackTokens))
    // L'ancre est le signal fort : quand la source la porte, le classement
    // du moteur de recherche fait foi et un seul recoupement lexical suffit
    // (les flexions et la langue divergent). Sans elle, il faut une évidence
    // lexicale nette pour garder la source.
    return anchorHit ? overlap >= 1 : overlap >= 3
  }

  const minimumOverlap = causalQuery ? 2 : queryKeywords.length <= 3 ? 1 : 2
  return overlap >= minimumOverlap
}

export function bestRelevantExcerpt(resource: ResourceItem, query: string): string {
  const excerpt = String(resource.excerpt ?? '')
    .replace(/#+\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!excerpt) return ''

  const queryText = normalizeSearchText(query)
  const queryKeywords = searchKeywords(query)
  const sentences = excerpt
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)

  const scored = sentences.map((sentence) => {
    const text = normalizeSearchText(sentence)
    const textTokens = haystackTokensOf(text)
    const keywordScore = queryKeywords.filter((keyword) => cognateMatch(keyword, text, textTokens)).length
    const sequenceScore = queryText.length > 0 && text.includes(queryText.slice(0, 80)) ? 1 : 0
    return { sentence, score: keywordScore + sequenceScore }
  }).filter((item) => item.score > 0)

  const selected = scored.sort((a, b) => b.score - a.score)[0]?.sentence ?? ''
  const cleanSelected = selected.replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').trim()
  return cleanSelected.length > 220 ? `${cleanSelected.slice(0, 217).trim()}...` : cleanSelected
}

export function filterRelevantResources(resources: ResourceItem[], query: string, understandingAnchors?: string[]): ResourceItem[] {
  return resources.filter((resource) => isRelevantResource(resource, query, understandingAnchors))
}
