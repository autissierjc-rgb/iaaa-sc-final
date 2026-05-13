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

const GENERIC_FALLBACK_MARKERS = [
  'La situation ne se joue pas seulement dans l’événement visible',
  'distribution des leviers réels',
  'Ce qui paraît stable dépend d’un levier discret',
  'La vulnérabilité centrale se situe dans ce que le système ne protège plus',
]

function asPayloadProbe(payload: unknown): SnapshotPayloadProbe {
  if (!payload || typeof payload !== 'object') return {}
  return payload as SnapshotPayloadProbe
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function hasText(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (!value || typeof value !== 'object') return false
  return Object.values(value as Record<string, unknown>).some((item) => typeof item === 'string' && item.trim().length > 0)
}

function cardText(card: Record<string, unknown>, keys: string[]): string {
  return keys.map((key) => text(card[key])).find(Boolean) ?? ''
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
  const card = asRecord(payload.writing?.situation_card)
  const missing: string[] = []
  const warnings: string[] = []
  const sourceLanguage = snapshot.language ?? payload.language ?? 'fr'
  const targetLanguage = options.target_language ?? sourceLanguage
  const needsTranslatedSnapshot = sourceLanguage !== targetLanguage
  const canonicalQuestion = text(snapshot.canonical_question) || text((snapshot as any).submittedQuestion)
  const headerSubject = text(snapshot.header_subject) || text((snapshot as any).title)
  const submittedSituation = text(snapshot.situation_soumise) || text((snapshot as any).submittedQuestion) || canonicalQuestion
  const lecture =
    hasText(payload.writing?.lecture)
      ? JSON.stringify(payload.writing?.lecture)
      : cardText(card, ['lecture_systeme_fr', 'lecture_systeme_en', 'lecture'])
  const approfondir =
    hasText(payload.writing?.approfondir)
      ? JSON.stringify(payload.writing?.approfondir)
      : cardText(card, ['approfondir_fr', 'approfondir_en', 'approfondir'])
  const astrolabeScores = Array.isArray(card.astrolabe_scores) ? card.astrolabe_scores : []

  if (!snapshot.id) missing.push('source_snapshot_id')
  if (!snapshot.language && !payload.language) missing.push('snapshot_language')
  if (!canonicalQuestion) missing.push('canonical_question')
  if (!headerSubject) missing.push('header_subject')
  if (!submittedSituation) missing.push('situation_soumise')
  if (!payload.writing?.situation_card) missing.push('situation_card')
  if (!lecture) missing.push('lecture')
  if (!approfondir) missing.push('approfondir')
  if (astrolabeScores.length < 8) missing.push('astrolabe_scores')
  if (GENERIC_FALLBACK_MARKERS.some((marker) => lecture.includes(marker))) {
    missing.push('situated_writing')
  }
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
    filename: `${safeSlug(headerSubject)}-${snapshot.id}.pdf`,
  }
}
