import type {
  InterpretationContract,
  ResourceContract,
  ResourceServiceContract,
} from '../contracts'
import type { TraceMeta } from '../contracts/common'
import type { UserMaterialResourceRoleAssessment } from '../contracts/userMaterial'

export type SCMaterialRole =
  | 'object'
  | 'context'
  | 'evidence'
  | 'constraint'
  | 'options_source'
  | 'private_notes'

export type SCMaterialUnderstanding = {
  user_question_understood_fr: string
  decision_or_analysis_object_fr: string
  material_role: SCMaterialRole
  site_understanding_status: 'understood' | 'partial' | 'failed' | 'not_applicable'
  actors: string[]
  options: string[]
  constraints: string[]
  evidence: string[]
  uncertainties: string[]
  tensions: string[]
  time_factors: string[]
  perception_factors: string[]
  usable_for_diamond: boolean
  unusable_parts: string[]
  warnings: string[]
  trace: TraceMeta
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function lineAfterPrefix(value: string, prefix: string): string {
  const line = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()))
  return compact(line?.slice(prefix.length).replace(/^[:\s]+/, '') ?? '')
}

function splitFacts(value: string): string[] {
  return value
    .split(/\s+(?:\/|;|\||•)\s+|,(?=\s+[A-ZÉÈÀÂÊÎÔÛÇ])/)
    .map((item) => compact(item.replace(/^(?:non [ée]tabli|indisponible).*$/i, '')))
    .filter(Boolean)
    .slice(0, 8)
}

function isSiteBrief(resource: ResourceContract): boolean {
  return resource.title.toLowerCase().startsWith('fiche site') || /internal-site-brief|site understanding/i.test(resource.reliability ?? '')
}

function siteResourceText(resource: {
  title?: string
  type?: string
  reliability?: string
  excerpt?: string
  source?: string
}): string {
  return `${resource.title ?? ''} ${resource.type ?? ''} ${resource.reliability ?? ''} ${resource.source ?? ''} ${resource.excerpt ?? ''}`
}

export function isHeuristicSiteUnderstandingResource(resource: {
  title?: string
  type?: string
  reliability?: string
  excerpt?: string
  source?: string
}): boolean {
  const text = siteResourceText(resource)
  return /fiche site|site-brief|internal-site-brief|site understanding/i.test(text) &&
    /compr[ée]hension chatgpt du site\s*:\s*indisponible|fiche heuristique utilis[ée]e/i.test(text)
}

export function isCrawlSummaryResource(resource: {
  title?: string
  type?: string
  reliability?: string
  excerpt?: string
  source?: string
}): boolean {
  return /site-crawl-summary|synth[èe]se crawl site/i.test(siteResourceText(resource))
}

export function isCanonicalSiteUnderstandingResource(resource: {
  title?: string
  type?: string
  reliability?: string
  excerpt?: string
  source?: string
}): boolean {
  const text = siteResourceText(resource)
  return /fiche site|site-brief|internal-site-brief|site understanding/i.test(text) &&
    /compr[ée]hension chatgpt du site\s*:\s*oui/i.test(text) &&
    !isHeuristicSiteUnderstandingResource(resource)
}

export function isStructurallyUsableResource(resource: {
  title?: string
  type?: string
  reliability?: string
  excerpt?: string
  source?: string
}): boolean {
  const text = siteResourceText(resource)
  const siteLike = /fiche site|site-brief|internal-site-brief|site understanding|site-crawl-summary|synth[èe]se crawl/i.test(text)
  if (!siteLike) return true
  return isCanonicalSiteUnderstandingResource(resource)
}

function isHeuristicSiteBrief(resource: ResourceContract): boolean {
  return isSiteBrief(resource) && isHeuristicSiteUnderstandingResource(resource)
}

function isCanonicalSiteBrief(resource: ResourceContract): boolean {
  return isSiteBrief(resource) && isCanonicalSiteUnderstandingResource(resource)
}

function isCrawlSummary(resource: ResourceContract): boolean {
  return isCrawlSummaryResource(resource)
}

function materialRoleFromUserRole(role?: UserMaterialResourceRoleAssessment): SCMaterialRole {
  if (!role) return 'context'
  if (role.role === 'object_of_analysis') return 'object'
  if (role.role === 'evidence_source') return 'evidence'
  if (role.role === 'private_material') return 'private_notes'
  return 'context'
}

function optionLikeResources(resources: ResourceContract[]): string[] {
  return resources
    .flatMap((resource) => [
      lineAfterPrefix(resource.excerpt ?? '', 'Offres visibles'),
      lineAfterPrefix(resource.excerpt ?? '', 'Cas d’usage visibles'),
      lineAfterPrefix(resource.excerpt ?? '', 'Workflow produit'),
      lineAfterPrefix(resource.excerpt ?? '', 'Ce que fait l’entreprise'),
      lineAfterPrefix(resource.excerpt ?? '', 'Ce que le site permet d’établir'),
    ])
    .flatMap(splitFacts)
    .filter((item) => !/^non [ée]tabli/i.test(item))
    .slice(0, 8)
}

export function interpretSCMaterial(input: {
  interpretation: InterpretationContract
  resources?: ResourceServiceContract
  userMaterialRole?: UserMaterialResourceRoleAssessment
}): SCMaterialUnderstanding {
  const started = Date.now()
  const publicSources = input.resources?.public_sources ?? []
  const canonicalSiteBriefs = publicSources.filter(isCanonicalSiteBrief)
  const heuristicSiteBriefs = publicSources.filter(isHeuristicSiteBrief)
  const crawlSummaries = publicSources.filter(isCrawlSummary)
  const hasUserUrl = (input.userMaterialRole?.urls ?? []).length > 0
  const hasSiteMaterial = publicSources.some(isSiteBrief) || hasUserUrl

  const siteUnderstandingStatus: SCMaterialUnderstanding['site_understanding_status'] =
    canonicalSiteBriefs.length > 0
      ? 'understood'
      : hasSiteMaterial && heuristicSiteBriefs.length > 0
        ? 'failed'
        : hasSiteMaterial
          ? 'partial'
          : 'not_applicable'
  const options = optionLikeResources(canonicalSiteBriefs)
  const evidence = canonicalSiteBriefs
    .flatMap((resource) => splitFacts(lineAfterPrefix(resource.excerpt ?? '', 'Preuves ou signaux visibles')))
    .slice(0, 8)
  const constraints = canonicalSiteBriefs
    .flatMap((resource) => [
      ...splitFacts(lineAfterPrefix(resource.excerpt ?? '', 'Preuves manquantes')),
      ...splitFacts(lineAfterPrefix(resource.excerpt ?? '', 'Angles morts critiques à vérifier')),
    ])
    .slice(0, 8)
  const actors = canonicalSiteBriefs
    .flatMap((resource) => splitFacts(lineAfterPrefix(resource.excerpt ?? '', 'Utilisateurs ou clients visés')))
    .slice(0, 8)

  const unusableParts = [
    ...heuristicSiteBriefs.map((resource) => resource.title),
    ...crawlSummaries.map((resource) => resource.title),
  ]
  const siteMaterialNotUnderstood = hasSiteMaterial && canonicalSiteBriefs.length === 0
  const usableForDiamond =
    !siteMaterialNotUnderstood ||
    (!hasUserUrl && publicSources.some((resource) => !isHeuristicSiteBrief(resource) && !isCrawlSummary(resource)))

  return {
    user_question_understood_fr: input.interpretation.situation_soumise,
    decision_or_analysis_object_fr: input.interpretation.object_of_analysis || input.interpretation.header_subject,
    material_role: materialRoleFromUserRole(input.userMaterialRole),
    site_understanding_status: siteUnderstandingStatus,
    actors,
    options,
    constraints,
    evidence,
    uncertainties: constraints,
    tensions: [],
    time_factors: [],
    perception_factors: [],
    usable_for_diamond: usableForDiamond,
    unusable_parts: unusableParts,
    warnings: [
      ...(siteMaterialNotUnderstood ? ['Matiere site non comprise par le referent : elle ne doit pas alimenter la colonne diamant.'] : []),
      ...(heuristicSiteBriefs.length > 0 ? ['Fiche site heuristique presente : contexte seulement, pas preuve structurante.'] : []),
    ],
    trace: {
      service: 'SCMaterialInterpreter',
      version: 'v1',
      duration_ms: Date.now() - started,
      status: usableForDiamond ? 'ok' : 'partial',
      notes: [
        `site_understanding_status=${siteUnderstandingStatus}`,
        `public_sources=${publicSources.length}`,
        `canonical_site_briefs=${canonicalSiteBriefs.length}`,
        `heuristic_site_briefs=${heuristicSiteBriefs.length}`,
        `usable_for_diamond=${usableForDiamond}`,
      ],
    },
  }
}

export function resourcePlanForDiamond(
  resources: ResourceServiceContract,
  material: SCMaterialUnderstanding,
): ResourceServiceContract {
  const filteredResources = resources.resources.filter(isStructurallyUsableResource)
  const filteredPublicSources = resources.public_sources.filter(isStructurallyUsableResource)

  if (material.usable_for_diamond) {
    const filtered = filteredResources.length !== resources.resources.length ||
      filteredPublicSources.length !== resources.public_sources.length
    return {
      ...resources,
      status: filtered ? 'partial' : resources.status,
      resources: filteredResources,
      public_sources: filteredPublicSources,
      internal_notes: [
        ...resources.internal_notes,
        ...(filtered ? ['SCMaterialInterpreter removed non-canonical site material from diamond spine.'] : []),
      ],
      trace: {
        ...resources.trace,
        status: filtered ? 'partial' : resources.trace.status,
        notes: [
          ...(resources.trace.notes ?? []),
          ...(filtered ? ['sc_material_understanding=filtered_non_canonical_site_material'] : []),
        ],
      },
    }
  }

  return {
    ...resources,
    status: 'partial',
    needs_web: resources.needs_web,
    resources: [],
    public_sources: [],
    extracted_options: [],
    internal_notes: [
      ...resources.internal_notes,
      'SCMaterialInterpreter blocked raw or heuristic material from diamond spine.',
      ...material.warnings,
    ],
    trace: {
      ...resources.trace,
      status: 'partial',
      notes: [
        ...(resources.trace.notes ?? []),
        'sc_material_understanding=not_usable_for_diamond',
      ],
    },
  }
}

export function resourceItemsUsableForStructure<T extends { title?: string; type?: string; reliability?: string; excerpt?: string }>(
  resources: T[],
  material: SCMaterialUnderstanding,
): T[] {
  const structurallyUsable = resources.filter(isStructurallyUsableResource)
  if (material.usable_for_diamond) return structurallyUsable
  return structurallyUsable.filter((resource) => !/fiche site|site-brief|internal-site-brief|site understanding/i.test(siteResourceText(resource)))
}
