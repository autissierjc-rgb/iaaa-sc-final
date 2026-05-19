import { SC_COLLABORATION_RULE, SC_NON_COMPLETION_PRINCIPLE } from '../governance/scDoctrine'
import type { IntentContext, ResourceItem } from '../resources/resourceContract'

export type ReadinessStatus = 'ready' | 'ask_user' | 'generate_prudently'

export type SituationReadinessGate = {
  status: ReadinessStatus
  reason: string
  question?: string
  can_generate_prudently?: boolean
  prudent_generation_label_fr?: string
  message_fr?: string
  warning_fr?: string
  needs: string[]
  doctrine: string
}

function hasExplicitUrl(value: string): boolean {
  return /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(value)
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
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

function siteBrief(resources: ResourceItem[]): ResourceItem | undefined {
  return resources.find((resource) => resource.type === 'site-brief')
}

function hasConcreteSiteUnderstanding(brief?: ResourceItem): boolean {
  const excerpt = String(brief?.excerpt ?? '')
  if (!excerpt) return false
  const what = excerpt.match(/Ce que fait l’entreprise\s*:\s*(.+)/i)?.[1]?.trim() ?? ''
  if (!what || /^Non établi/i.test(what)) return false
  return what.length >= 35
}

function siteNameFromSituation(situation: string): string {
  const match =
    situation.match(/\b(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?([a-z0-9-]{3,})\b/i) ||
    situation.match(/\b([a-z0-9-]{3,})\s+(?:site|page|plateforme|application|app|service|outil)\b/i)
  return match?.[1] ?? ''
}

function siteNameFromIntent(intentContext: IntentContext, situation: string): string {
  const fromSituation = siteNameFromSituation(situation)
  if (fromSituation) return fromSituation

  const object = String(intentContext.interpreted_request?.object_of_analysis ?? '')
    .replace(/^(?:le|la|les|un|une)\s+(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?/i, '')
    .replace(/^(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?/i, '')
    .replace(/[.;:]+$/g, '')
    .trim()
  if (object) return object
  const match = situation.match(/\b(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?([a-z0-9-]{3,})\b/i)
  return match?.[1] ?? 'ce site'
}

function asksToCompareUnspecifiedOptions(situation: string, intentContext: IntentContext): boolean {
  const interpreted = intentContext.interpreted_request as Record<string, unknown> | undefined
  const text = normalize([
    situation,
    interpreted?.user_need,
    interpreted?.object_of_analysis,
  ].filter(Boolean).join(' '))
  const asksOptions =
    /\b(option|options|scenario|scenarios|strategie|strategies|choix|arbitrage|plan)\b/.test(text) &&
    /\b(plusieurs|differentes|comparer|tenir compte|arbitrer|entre)\b/.test(text)
  if (!asksOptions) return false

  const namedOptions =
    /\b(option|scenario|strategie)\s*(?:1|2|3|a|b|c)\b/i.test(situation) ||
    /\b(soit|ou bien|premiere option|deuxieme option|troisieme option)\b/i.test(situation) ||
    /(?:\n|;|•|-)\s*(?:option|scenario|strategie)?\s*[A-C1-3][).:-]/i.test(situation)

  return !namedOptions
}

function hasSuppliedMaterial(situation: string, resources: ResourceItem[]): boolean {
  if (hasExplicitUrl(situation)) return true
  return resources.some((resource) => {
    const text = [resource.title, resource.url, resource.excerpt, resource.source, resource.type]
      .filter(Boolean)
      .join(' ')
      .trim()
    return text.length >= 30
  })
}

function asksTargetChoiceWithoutMaterial(situation: string, intentContext: IntentContext, resources: ResourceItem[]): boolean {
  if (hasSuppliedMaterial(situation, resources)) return false

  const interpreted = intentContext.interpreted_request as Record<string, unknown> | undefined
  const text = normalize([
    situation,
    interpreted?.user_need,
    interpreted?.object_of_analysis,
    intentContext.dominant_frame,
    intentContext.decision_type,
  ].filter(Boolean).join(' '))

  const targetChoice =
    /\b(cible|client|clients|utilisateur|utilisateurs|communaute|communaute|segment|persona|icp|audience)\b/.test(text) &&
    /\b(choisir|prioriser|premier|premiere|lancement|lancer|developper|developpement|acquisition|activation|go to market|go market|marche)\b/.test(text)

  if (!targetChoice) return false

  const productOrProject =
    /\b(produit|service|site|app|application|plateforme|startup|entreprise|projet|offre|situation card|situationcard|situation carte|situationcarte|situation car)\b/.test(text) ||
    intentContext.surface_domain === 'startup_vc' ||
    intentContext.dominant_frame === 'startup_target_choice'

  return productOrProject
}

export function situationReadinessGate({
  situation,
  intentContext,
  resources = [],
  forceGenerate = false,
}: {
  situation: string
  intentContext: IntentContext
  resources?: ResourceItem[]
  forceGenerate?: boolean
}): SituationReadinessGate {
  const frame = intentContext.dominant_frame
  const decision = intentContext.decision_type
  if (!forceGenerate && asksToCompareUnspecifiedOptions(situation, intentContext)) {
    const question =
      'Vous évoquez plusieurs options, mais elles ne sont pas encore nommées. Quelles sont les 2 ou 3 options à comparer, ou dois-je d’abord proposer une carte exploratoire pour les faire émerger ?'

    return {
      status: 'ask_user',
      reason: 'strategic_options_missing',
      question,
      can_generate_prudently: true,
      prudent_generation_label_fr: 'Générer une carte exploratoire',
      message_fr: question,
      warning_fr: 'Options stratégiques non précisées : SC doit collaborer avant de conclure.',
      needs: ['options à comparer', 'critère de décision', 'contrainte prioritaire'],
      doctrine: `${SC_NON_COMPLETION_PRINCIPLE}\n\n${SC_COLLABORATION_RULE}`,
    }
  }

  if (asksTargetChoiceWithoutMaterial(situation, intentContext, resources)) {
    const question =
      'Pour choisir une cible client ou utilisateur, il manque la matière produit. Donnez-moi l’URL du site, une page de présentation, un document ou un plug autorisé ; sinon je peux générer une carte exploratoire clairement provisoire.'

    return {
      status: forceGenerate ? 'generate_prudently' : 'ask_user',
      reason: 'target_choice_material_missing',
      question,
      can_generate_prudently: true,
      prudent_generation_label_fr: 'Générer une carte exploratoire',
      message_fr: question,
      warning_fr: 'Choix de cible sans matière produit/source : SC doit collaborer avant de conclure.',
      needs: ['URL, document ou plug autorisé', 'segments envisagés', 'critère de priorité'],
      doctrine: `${SC_NON_COMPLETION_PRINCIPLE}\n\n${SC_COLLABORATION_RULE}`,
    }
  }

  const isSite =
    intentContext.interpreted_request?.question_type === 'site_analysis' &&
    (frame === 'site_analysis' || decision === 'analyze_site')

  if (isSite) {
    const brief = siteBrief(resources)
    const name = siteNameFromIntent(intentContext, situation)
    const hasUrl = hasExplicitUrl(situation)
    const requested = normalize(name).replace(/\b(site|page|plateforme|application|app|service|outil)\b/g, '').trim()
    const root = normalize(rootDomainName(brief?.url ?? ''))
    const siteIdentityMatches = hasUrl || !brief || !requested || root === requested
    const concrete = hasConcreteSiteUnderstanding(brief)
    if (!concrete || !siteIdentityMatches) {
      const question = hasUrl
        ? `Je n’ai pas encore assez de contenu utile pour dire concrètement ce que fait ${name}. Voulez-vous que j’enquête davantage sur les pages du site ?`
        : `Je n’ai pas identifié avec certitude le site officiel de ${name}. Donnez-moi l’URL, ou dites-moi si vous voulez lancer une enquête.`

      return {
        status: forceGenerate ? 'generate_prudently' : 'ask_user',
        reason: !siteIdentityMatches ? 'site_identity_ambiguous' : hasUrl ? 'site_content_insufficient' : 'site_not_identified',
        question,
        can_generate_prudently: true,
        prudent_generation_label_fr: 'Générer une carte exploratoire',
        message_fr: question,
        warning_fr: hasUrl
          ? `Site insuffisamment compris : SC ne peut pas affirmer ce que fait ${name} sans contenu utile.`
          : `Site officiel non identifié : SC ne doit pas inventer ce que fait ${name}.`,
        needs: hasUrl ? ['contenu utile du site', 'description produit concrète'] : ['URL officielle', 'source web fiable'],
        doctrine: `${SC_NON_COMPLETION_PRINCIPLE}\n\n${SC_COLLABORATION_RULE}`,
      }
    }
  }

  return {
    status: 'ready',
    reason: 'ready_for_sc',
    needs: [],
    doctrine: SC_NON_COMPLETION_PRINCIPLE,
  }
}
