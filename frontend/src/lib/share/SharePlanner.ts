import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import {
  DEFAULT_UNIFIED_SHARE_BUTTON,
  type ShareChannel,
  type ShareVisibility,
} from '@/lib/contracts/share'
import { planLanguageSnapshot, type LanguageSnapshotPlan } from './LanguageSnapshotPlanner'
import { planPdfExport, type PdfExportPlan } from './PdfExportPlanner'

export type SharePlanStatus = 'ready' | 'partial' | 'blocked'

export type SharePlan = {
  status: SharePlanStatus
  share_button: typeof DEFAULT_UNIFIED_SHARE_BUTTON
  snapshot_id: string
  visibility: ShareVisibility
  target_language: LanguageCode
  public_url?: string
  actions: Array<{
    channel: ShareChannel
    status: 'ready' | 'blocked'
    reason_fr: string
  }>
  language_plan: LanguageSnapshotPlan
  pdf_plan: PdfExportPlan
  warnings: string[]
  blockers: string[]
}

function buildPublicUrl(snapshotId: string, language: LanguageCode): string | undefined {
  if (!snapshotId) return undefined
  return `/${language}/sc/${snapshotId}`
}

export function planShare(params: {
  snapshot: GeneratedCardSnapshot
  target_language: LanguageCode
  visibility?: ShareVisibility
}): SharePlan {
  const visibility = params.visibility ?? 'restricted'
  const blockers: string[] = []
  const warnings: string[] = []

  if (!params.snapshot.id) blockers.push('missing_snapshot_id')
  if (!params.snapshot.payload) blockers.push('missing_snapshot_payload')

  const languagePlan = planLanguageSnapshot({
    snapshot: params.snapshot,
    target_language: params.target_language,
  })
  const pdfPlan = planPdfExport(params.snapshot)

  if (languagePlan.status === 'blocked') blockers.push('language_snapshot_blocked')
  if (pdfPlan.status === 'blocked') warnings.push('pdf_export_blocked')
  if (pdfPlan.status === 'partial') warnings.push('pdf_export_partial')
  if (visibility === 'public' && params.snapshot.privacy_mode !== 'snapshot_allowed') {
    blockers.push('public_share_requires_snapshot_allowed')
  }

  const copyLinkReady = blockers.length === 0 && languagePlan.status !== 'blocked'
  const pdfReady = copyLinkReady && pdfPlan.status !== 'blocked'

  const actions: SharePlan['actions'] = [
    {
      channel: 'copy_link',
      status: copyLinkReady ? 'ready' : 'blocked',
      reason_fr: copyLinkReady
        ? 'Le lien pointe vers un snapshot stable dans la langue cible.'
        : 'Le lien exige un snapshot valide et une langue exportable.',
    },
    {
      channel: 'download_pdf',
      status: pdfReady ? 'ready' : 'blocked',
      reason_fr: pdfReady
        ? 'Le PDF peut etre exporte depuis le snapshot sans regeneration.'
        : 'Le PDF attend un snapshot complet et un plan PDF non bloque.',
    },
    {
      channel: 'email',
      status: copyLinkReady ? 'ready' : 'blocked',
      reason_fr: copyLinkReady
        ? 'L email partage le lien snapshot, pas le contenu brut.'
        : 'L email exige un lien snapshot valide.',
    },
  ]

  const status: SharePlanStatus =
    blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'partial' : 'ready'

  return {
    status,
    share_button: DEFAULT_UNIFIED_SHARE_BUTTON,
    snapshot_id: params.snapshot.id,
    visibility,
    target_language: params.target_language,
    public_url: buildPublicUrl(params.snapshot.id, params.target_language),
    actions,
    language_plan: languagePlan,
    pdf_plan: pdfPlan,
    warnings,
    blockers,
  }
}
