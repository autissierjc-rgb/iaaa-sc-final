import type { DumezilFunction } from '../patterns/humanCollective'
import type { ResourceItem } from './resourceContract'

export type QualifiedResourceKind =
  | 'audience'
  | 'use_case'
  | 'offer'
  | 'proof'
  | 'constraint'
  | 'navigation_label'
  | 'source_title'
  | 'unknown'

export type QualifiedResourceFact = {
  text: string
  kind: QualifiedResourceKind
  dumezil_function: DumezilFunction
  usable_for_target_choice: boolean
  source_title?: string
}

type ResourceLineMode = 'audience' | 'use_case' | 'offer' | 'proof' | 'generic'

const RESOURCE_LINE_LABELS: Array<{ label: string; mode: ResourceLineMode }> = [
  { label: 'Utilisateurs ou clients visés', mode: 'audience' },
  { label: 'Utilisateurs ou clients vises', mode: 'audience' },
  { label: 'Publics visés', mode: 'audience' },
  { label: 'Publics vises', mode: 'audience' },
  { label: 'Cibles visibles', mode: 'audience' },
  { label: 'Segments visibles', mode: 'audience' },
  { label: 'Cas d’usage visibles', mode: 'use_case' },
  { label: 'Cas d usage visibles', mode: 'use_case' },
  { label: 'Offres visibles', mode: 'offer' },
  { label: 'Preuves visibles', mode: 'proof' },
  { label: 'Faits extraits du site', mode: 'generic' },
]

function normalize(value: string): string {
  return cleanCandidate(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function cleanCandidate(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/^(?:utilisateurs?|clients?|publics?|cibles?|segments?|offres?|cas d['’ ]usage visibles?|faits extraits du site|preuves visibles?)\s*(?:vis[ée]s?)?\s*:\s*/i, '')
    .replace(/\b(non [ée]tabli|non disponible|indisponible|à qualifier|a qualifier)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.;:,/|–—-]+\s*$/g, '')
    .trim()
}

function splitCandidateLine(value: string): string[] {
  return value
    .split(/\s+(?:\/|;|\||•)\s+|,(?=\s+(?:[A-ZÉÈÀÂÊÎÔÛÇ]|[a-z]{3,}\s+(?:et|ou)\s+))/)
    .map(cleanCandidate)
    .filter(Boolean)
}

function isNavigationOrTechnicalLabel(value: string, resource?: ResourceItem): boolean {
  const text = normalize(value)
  if (!text) return true
  if (resource?.type === 'site-crawl-summary') return true
  if (/^[a-z0-9-]+\.(?:com|fr|io|ai|org|net)$/.test(text)) return true
  if (/^(?:iaaa|iaaa\+|about|offres?|offers?|pricing|accueil|home|contact|connexion|login|langue|language|menu|dashboard|privacy|mentions|legal|terms)$/.test(text)) {
    return true
  }
  return /\b(?:synthese|summary|crawl|fiche site|site understanding|navigation|navbar|footer)\b/.test(text)
}

function targetAudiencesFromUseCase(value: string): string[] {
  const text = normalize(value)
  const audiences: string[] = []

  if (/\b(personnel|personnelle|relationnel|relationnelle|intime|particulier|individuel|individuelle)\b/.test(text)) {
    audiences.push('particuliers en clarification personnelle ou professionnelle')
  }
  if (/\b(conflit d equipe|conflits d equipe|equipe|management|manager|rh|reorganisation|decision strategique|decisions strategiques)\b/.test(text)) {
    audiences.push('managers, équipes et professionnels confrontés à des décisions complexes')
  }
  if (/\b(evenement public|evenements publics|actualite|geopolitique|election|journaliste|journalistes|analyste|analystes|veille|societe|cartes publiques)\b/.test(text)) {
    audiences.push('analystes, journalistes et publics de veille sur événements complexes')
  }
  if (/\b(document|documents|url|rapport|article|source|sources|pdf|note|briefing)\b/.test(text)) {
    audiences.push('professionnels qui transforment documents et sources en lectures partageables')
  }
  if (/\b(organisation|organisations|institution|institutions|gouvernance|board|comite|comité|direction|collectif|systeme ia|agent ia)\b/.test(text)) {
    audiences.push('organisations et instances de gouvernance')
  }
  if (/\b(cyber|it|soc|dsi|rssi|risque|conformite|conformite)\b/.test(text)) {
    audiences.push('équipes risque, cyber, DSI et conformité')
  }

  return audiences
}

function classifyCandidate(value: string, mode: ResourceLineMode, resource?: ResourceItem): QualifiedResourceFact[] {
  const text = cleanCandidate(value)
  if (!text || isNavigationOrTechnicalLabel(text, resource)) {
    return [{
      text,
      kind: 'navigation_label',
      dumezil_function: 'legitimize',
      usable_for_target_choice: false,
      source_title: resource?.title,
    }]
  }

  if (mode === 'use_case' || /^(?:comprendre|analyser|transformer|créer|creer|explorer)\b/i.test(text)) {
    const audiences = targetAudiencesFromUseCase(text)
    return audiences.map((audience) => ({
      text: audience,
      kind: 'audience',
      dumezil_function: 'produce_reproduce',
      usable_for_target_choice: true,
      source_title: resource?.title,
    }))
  }

  const normalized = normalize(text)
  const looksLikeAudience =
    mode === 'audience' ||
    /\b(?:particuliers?|professionnels?|utilisateurs?|clients?|managers?|dirigeants?|analystes?|journalistes?|consultants?|chercheurs?|equipes?|équipes|organisations?|institutions?|dsi|rssi|soc)\b/.test(normalized)

  if (looksLikeAudience) {
    return [{
      text,
      kind: 'audience',
      dumezil_function: 'produce_reproduce',
      usable_for_target_choice: true,
      source_title: resource?.title,
    }]
  }

  if (mode === 'offer' || /\b(?:clarity|clarte|clarté|sis|iaaa\+ governance|governance|offre|abonnement|pricing|prix)\b/.test(normalized)) {
    return [{
      text,
      kind: 'offer',
      dumezil_function: 'produce_reproduce',
      usable_for_target_choice: false,
      source_title: resource?.title,
    }]
  }

  if (mode === 'proof' || /\b(?:preuve|usage|revenu|client|partenaire|retention|activation|abonnement|paiement)\b/.test(normalized)) {
    return [{
      text,
      kind: 'proof',
      dumezil_function: 'produce_reproduce',
      usable_for_target_choice: false,
      source_title: resource?.title,
    }]
  }

  return [{
    text,
    kind: 'unknown',
    dumezil_function: 'legitimize',
    usable_for_target_choice: false,
    source_title: resource?.title,
  }]
}

export function qualifyResourceFacts(resources: ResourceItem[]): QualifiedResourceFact[] {
  const facts: QualifiedResourceFact[] = []

  for (const resource of resources) {
    const excerpt = typeof resource.excerpt === 'string' ? resource.excerpt : ''
    for (const { label, mode } of RESOURCE_LINE_LABELS) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const match = excerpt.match(new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, 'i'))
      if (!match?.[1]) continue
      for (const candidate of splitCandidateLine(match[1])) {
        facts.push(...classifyCandidate(candidate, mode, resource))
      }
    }

    const title = cleanCandidate(String(resource.title ?? '').split(/\s[|–—-]\s/)[0] ?? '')
    if (title) {
      facts.push(...classifyCandidate(title, 'generic', resource))
    }
  }

  return facts
}

export function extractTargetAudiencesFromResources(resources: ResourceItem[]): string[] {
  const seen = new Set<string>()

  return qualifyResourceFacts(resources)
    .filter((fact) => fact.usable_for_target_choice && fact.kind === 'audience' && fact.dumezil_function === 'produce_reproduce')
    .map((fact) => fact.text)
    .filter((text) => {
      const key = normalize(text)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 4)
}
