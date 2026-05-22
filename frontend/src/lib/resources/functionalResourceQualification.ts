import type { DumezilFunction } from '../patterns/humanCollective'
import type {
  ExtractedResourceOption,
  ExtractedResourceOptionKind,
  ExtractedResourceOptionStatus,
} from '../contracts/resources'

type QualifiableResourceItem = {
  id?: string
  title?: string
  excerpt?: string
  type?: string
}

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

export type TargetAudienceFamilyId =
  | 'individual_clarity'
  | 'professional_sis'
  | 'organization_governance'

export type TargetAudienceFamily = {
  id: TargetAudienceFamilyId
  label_fr: string
  offer_hint_fr: string
  audience_fr: string
  source_terms_fr: string[]
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

function isNavigationOrTechnicalLabel(value: string, resource?: QualifiableResourceItem): boolean {
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

function sourceTerm(value: string): string {
  return cleanCandidate(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function addFamily(
  families: Map<TargetAudienceFamilyId, TargetAudienceFamily>,
  id: TargetAudienceFamilyId,
  term: string,
) {
  const presets: Record<TargetAudienceFamilyId, Omit<TargetAudienceFamily, 'id' | 'source_terms_fr'>> = {
    individual_clarity: {
      label_fr: 'Usage individuel',
      offer_hint_fr: 'CLARITY',
      audience_fr: 'particuliers et personnes qui veulent clarifier une situation personnelle, relationnelle ou professionnelle',
    },
    professional_sis: {
      label_fr: 'Usage professionnel',
      offer_hint_fr: 'SIS',
      audience_fr: 'professionnels, managers, analystes, consultants, journalistes, chercheurs et équipes qui doivent structurer ou partager une lecture',
    },
    organization_governance: {
      label_fr: 'Usage organisationnel',
      offer_hint_fr: 'IAAA+ Governance',
      audience_fr: 'organisations, institutions, directions, comités ou équipes de gouvernance qui ont besoin de suivi, traçabilité ou intégration',
    },
  }
  const clean = sourceTerm(term)
  const current = families.get(id) ?? {
    id,
    ...presets[id],
    source_terms_fr: [],
  }
  if (clean && !current.source_terms_fr.some((item) => normalize(item) === normalize(clean))) {
    current.source_terms_fr.push(clean)
  }
  families.set(id, current)
}

function classifyAudienceFamiliesFromText(value: string, families: Map<TargetAudienceFamilyId, TargetAudienceFamily>) {
  const text = normalize(value)
  if (!text) return

  if (/\b(clarity|clarte|clart[eé]|personnel|personnelle|relationnel|relationnelle|intime|particulier|particuliers|individuel|individuelle|pour soi|usage individuel)\b/.test(text)) {
    addFamily(families, 'individual_clarity', value)
  }
  if (/\b(sis|professionnel|professionnels|manager|managers|management|rh|equipe|equipes|consultant|consultants|analyste|analystes|journaliste|journalistes|chercheur|chercheurs|brief|briefing|decision strategique|decisions strategiques|veille|conseil|usage professionnel)\b/.test(text)) {
    addFamily(families, 'professional_sis', value)
  }
  if (/\b(iaaa\+ governance|governance|gouvernance|enterprise|organisation|organisations|institution|institutions|direction|directions|comite|comit[eé]|collectif|roles et permissions|tracabilite|traçabilite|api|connecteur|connecteurs|integration|int[eé]gration|usage organisationnel)\b/.test(text)) {
    addFamily(families, 'organization_governance', value)
  }
}

function classifyCandidate(value: string, mode: ResourceLineMode, resource?: QualifiableResourceItem): QualifiedResourceFact[] {
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

export function qualifyResourceFacts(resources: QualifiableResourceItem[]): QualifiedResourceFact[] {
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

export function extractTargetAudiencesFromResources(resources: QualifiableResourceItem[]): string[] {
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

export function extractTargetAudienceFamiliesFromResources(resources: QualifiableResourceItem[]): TargetAudienceFamily[] {
  const families = new Map<TargetAudienceFamilyId, TargetAudienceFamily>()
  const facts = qualifyResourceFacts(resources)

  for (const fact of facts) {
    if (fact.kind === 'navigation_label' || fact.kind === 'source_title') continue
    classifyAudienceFamiliesFromText(fact.text, families)
  }

  for (const resource of resources) {
    classifyAudienceFamiliesFromText(`${resource.title ?? ''}\n${resource.excerpt ?? ''}`, families)
  }

  return [
    families.get('individual_clarity'),
    families.get('professional_sis'),
    families.get('organization_governance'),
  ].filter((item): item is TargetAudienceFamily => Boolean(item))
}

function optionKindFromFact(kind: QualifiedResourceKind): ExtractedResourceOptionKind {
  if (kind === 'audience') return 'user_segment'
  if (kind === 'use_case') return 'use_case'
  if (kind === 'offer') return 'offer'
  if (kind === 'proof') return 'proof_signal'
  return 'unknown'
}

function optionStatusFromFact(fact: QualifiedResourceFact): ExtractedResourceOptionStatus {
  if (fact.usable_for_target_choice && fact.source_title) return 'established'
  if (fact.source_title) return 'plausible'
  return 'hypothesis'
}

function optionId(prefix: string, value: string, index: number): string {
  const slug = normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return `${prefix}-${slug || index}`
}

export function extractQualifiedOptionsFromResources(resources: QualifiableResourceItem[]): ExtractedResourceOption[] {
  const options: ExtractedResourceOption[] = []
  const seen = new Set<string>()

  for (const family of extractTargetAudienceFamiliesFromResources(resources)) {
    const label = `${family.label_fr} / ${family.offer_hint_fr} : ${family.audience_fr}`
    const key = `audience_family:${normalize(label)}`
    if (seen.has(key)) continue
    seen.add(key)
    options.push({
      id: family.id,
      label_fr: label,
      kind: 'audience_family',
      status: 'established',
      source_type: 'resource',
      source_title: family.source_terms_fr[0],
      evidence_fr: family.source_terms_fr.slice(0, 4),
    })
  }

  const facts = qualifyResourceFacts(resources)
    .filter((fact) =>
      fact.kind !== 'navigation_label' &&
      fact.kind !== 'source_title' &&
      fact.kind !== 'constraint' &&
      fact.kind !== 'unknown' &&
      cleanCandidate(fact.text).length > 0,
    )

  for (const [index, fact] of facts.entries()) {
    const kind = optionKindFromFact(fact.kind)
    if (kind === 'unknown') continue
    const label = cleanCandidate(fact.text)
    const key = `${kind}:${normalize(label)}`
    if (seen.has(key)) continue
    seen.add(key)
    options.push({
      id: optionId(kind, label, index),
      label_fr: label,
      kind,
      status: optionStatusFromFact(fact),
      source_type: 'resource',
      source_title: fact.source_title,
      evidence_fr: fact.source_title ? [fact.source_title] : [],
    })
  }

  return options.slice(0, 12)
}
