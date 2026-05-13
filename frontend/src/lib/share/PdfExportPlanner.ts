import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { LanguageCode } from '@/lib/contracts/common'
import {
  DEFAULT_PDF_EXPORT_CONTRACT,
  type PdfExportContract,
} from '@/lib/contracts/share'

export type PdfExportReadinessStatus = 'ready' | 'partial' | 'blocked'

export type PdfExportPlan = {
  status: PdfExportReadinessStatus
  contract: Omit<PdfExportContract, 'export_id' | 'source_snapshot_id' | 'language'>
  source_language: LanguageCode
  target_language: LanguageCode
  snapshot_rule: 'export_current_snapshot' | 'requires_translated_snapshot'
  missing: string[]
  warnings: string[]
  required_notice_fr: string
  required_notice_placement: 'end_matter'
  filename: string
}

type SnapshotPayloadProbe = {
  writing?: {
    situation_card?: unknown
    lecture?: unknown
    approfondir?: unknown
  }
  resources?: {
    public_sources?: unknown[]
    resources?: unknown[]
    status?: string
  }
  safety?: {
    risk_level?: string
    disclaimer_fr?: string
  }
  quality?: {
    status?: string
  }
  language?: LanguageCode
}

const REQUIRED_NOTICE_FR =
  'Ce document est une note analytique produite par Situation Card. Il structure une lecture, des hypotheses et des signaux a verifier. Il ne constitue ni un rapport officiel, ni une preuve, ni un avis professionnel.'

function asPayloadProbe(payload: unknown): SnapshotPayloadProbe {
  if (!payload || typeof payload !== 'object') return {}
  return payload as SnapshotPayloadProbe
}

function safeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'situation-card'
}

export function planPdfExport(
  snapshot: GeneratedCardSnapshot,
  options: { target_language?: LanguageCode } = {},
): PdfExportPlan {
  const payload = asPayloadProbe(snapshot.payload)
  const missing: string[] = []
  const warnings: string[] = []
  const sourceLanguage = snapshot.language ?? payload.language ?? 'fr'
  const targetLanguage = options.target_language ?? sourceLanguage
  const needsTranslatedSnapshot = sourceLanguage !== targetLanguage

  if (!snapshot.id) missing.push('source_snapshot_id')
  if (!snapshot.language && !payload.language) missing.push('snapshot_language')
  if (!snapshot.canonical_question) missing.push('canonical_question')
  if (!snapshot.header_subject) missing.push('header_subject')
  if (!snapshot.situation_soumise) missing.push('situation_soumise')
  if (!payload.writing?.situation_card) missing.push('situation_card')
  if (!payload.writing?.lecture) missing.push('lecture')
  if (!payload.writing?.approfondir) missing.push('approfondir')
  if (needsTranslatedSnapshot) missing.push('translated_snapshot_for_target_language')

  const publicSources =
    payload.resources?.public_sources ?? payload.resources?.resources ?? []
  if (snapshot.source_count === 0 && publicSources.length === 0) {
    warnings.push('public_sources_missing_or_partial')
  }

  if (payload.quality?.status && payload.quality.status !== 'ok') {
    warnings.push(`quality_${payload.quality.status}`)
  }

  if (payload.safety?.risk_level && payload.safety.risk_level !== 'low') {
    warnings.push(`high_stakes_${payload.safety.risk_level}`)
  }

  const status: PdfExportReadinessStatus =
    missing.length > 0 ? 'blocked' : warnings.length > 0 ? 'partial' : 'ready'

  return {
    status,
    contract: DEFAULT_PDF_EXPORT_CONTRACT,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    snapshot_rule: needsTranslatedSnapshot ? 'requires_translated_snapshot' : 'export_current_snapshot',
    missing,
    warnings,
    required_notice_fr: REQUIRED_NOTICE_FR,
    required_notice_placement: 'end_matter',
    filename: `${safeSlug(snapshot.header_subject)}-${snapshot.id}.pdf`,
  }
}
