import type { ResourceContract, ResourceServiceContract } from '../contracts/resources'

export type ProbativeEvidenceRejectionReason =
  | 'empty'
  | 'markdown_noise'
  | 'url_avalanche'
  | 'image_noise'
  | 'navigation_noise'
  | 'too_long'

export type ProbativeEvidenceStatus = 'usable' | 'weak' | 'rejected'

export type ProbativeEvidence = {
  source_id?: string
  public_label_fr: string
  status: ProbativeEvidenceStatus
  reason?: ProbativeEvidenceRejectionReason
  can_be_public: boolean
  can_drive_probability: boolean
}

const PUBLIC_EVIDENCE_MAX_LENGTH = 220

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripMarkdownLinks(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
}

function countUrls(value: string): number {
  return value.match(/https?:\/\//gi)?.length ?? 0
}

function hasMarkdownNoise(value: string): boolean {
  return /!\[[^\]]*]\(|\[[^\]]+]\(https?:\/\//i.test(value)
}

function hasImageNoise(value: string): boolean {
  return /(?:^|\s)(?:image|img)\s*\d{1,4}\b/i.test(value) ||
    /\.(?:avif|png|jpe?g|gif|webp|svg)(?:\)|\s|$)/i.test(value)
}

function hasNavigationNoise(value: string): boolean {
  return /\b(skip to|menu|privacy policy|terms of service|all rights reserved|cookie|javascript)\b/i.test(value)
}

function publicSourceLabel(source: ResourceContract): string {
  const sourceName = source.source || 'source'
  const title = compact(source.title)
  return title ? `${title} (${sourceName})` : sourceName
}

export function sanitizeProbativeEvidenceText(
  value: string | undefined,
  fallbackLabel: string,
  sourceId?: string,
): ProbativeEvidence {
  const raw = compact(value ?? '')
  if (!raw) {
    return {
      source_id: sourceId,
      public_label_fr: fallbackLabel,
      status: 'weak',
      reason: 'empty',
      can_be_public: true,
      can_drive_probability: false,
    }
  }

  if (hasMarkdownNoise(raw)) {
    const stripped = compact(stripMarkdownLinks(raw))
    if (stripped && stripped.length <= PUBLIC_EVIDENCE_MAX_LENGTH && countUrls(stripped) === 0 && !hasImageNoise(stripped)) {
      return {
        source_id: sourceId,
        public_label_fr: stripped,
        status: 'weak',
        reason: 'markdown_noise',
        can_be_public: true,
        can_drive_probability: false,
      }
    }

    return {
      source_id: sourceId,
      public_label_fr: fallbackLabel,
      status: 'rejected',
      reason: 'markdown_noise',
      can_be_public: false,
      can_drive_probability: false,
    }
  }

  if (countUrls(raw) > 1) {
    return {
      source_id: sourceId,
      public_label_fr: fallbackLabel,
      status: 'rejected',
      reason: 'url_avalanche',
      can_be_public: false,
      can_drive_probability: false,
    }
  }

  if (hasImageNoise(raw)) {
    return {
      source_id: sourceId,
      public_label_fr: fallbackLabel,
      status: 'rejected',
      reason: 'image_noise',
      can_be_public: false,
      can_drive_probability: false,
    }
  }

  if (hasNavigationNoise(raw)) {
    return {
      source_id: sourceId,
      public_label_fr: fallbackLabel,
      status: 'weak',
      reason: 'navigation_noise',
      can_be_public: true,
      can_drive_probability: false,
    }
  }

  if (raw.length > PUBLIC_EVIDENCE_MAX_LENGTH) {
    return {
      source_id: sourceId,
      public_label_fr: `${raw.slice(0, PUBLIC_EVIDENCE_MAX_LENGTH - 1).trim()}...`,
      status: 'weak',
      reason: 'too_long',
      can_be_public: true,
      can_drive_probability: false,
    }
  }

  return {
    source_id: sourceId,
    public_label_fr: raw,
    status: 'usable',
    can_be_public: true,
    can_drive_probability: true,
  }
}

export function sanitizeResourceAsProbativeEvidence(source: ResourceContract): ProbativeEvidence {
  const fallbackLabel = publicSourceLabel(source)
  const candidate = source.excerpt ? `${source.title} : ${source.excerpt}` : fallbackLabel
  return sanitizeProbativeEvidenceText(candidate, fallbackLabel, source.id)
}

export function publicProbativeEvidence(resources?: ResourceServiceContract, max = 3): ProbativeEvidence[] {
  if (!resources) return []

  return resources.public_sources
    .map((source) => sanitizeResourceAsProbativeEvidence(source))
    .filter((evidence) => evidence.can_be_public)
    .slice(0, max)
}
