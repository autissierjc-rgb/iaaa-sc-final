import { SC_COLLABORATION_RULE, SC_NON_COMPLETION_PRINCIPLE } from '../governance/scDoctrine'
import type { IntentContext, ResourceItem } from '../resources/resourceContract'

export type ReadinessStatus = 'ready' | 'ask_user' | 'generate_prudently'

export type SituationReadinessGate = {
  status: ReadinessStatus
  reason: string
  question?: string
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
