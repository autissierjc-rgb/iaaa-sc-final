import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import {
  DEFAULT_UNIFIED_SHARE_BUTTON,
  type ShareChannel,
  type ShareVisibility,
} from '@/lib/contracts/share'
import { planPdfExport, type PdfExportPlan } from './PdfExportPlanner'
import { planTranslatedSnapshot, type TranslatedSnapshotPlan } from './TranslatedSnapshotPlanner'

export type SharePlanStatus = 'ready' | 'partial' | 'blocked'
export type ShareActionStatus = 'ready' | 'pending' | 'blocked'

export type ShareNextStep =
  | 'create_translated_snapshot'
  | 'export_pdf_from_target_snapshot'
  | 'copy_snapshot_link'
  | 'send_snapshot_link'

export type SharePlan = {
  status: SharePlanStatus
  share_button: typeof DEFAULT_UNIFIED_SHARE_BUTTON
  snapshot_id: string
  source_snapshot_id: string
  target_snapshot_id?: string
  visibility: ShareVisibility
  target_language: LanguageCode
  public_url?: string
  planned_public_url?: string
  actions: Array<{
    channel: ShareChannel
    status: ShareActionStatus
    reason_fr: string
  }>
  translated_snapshot_plan: TranslatedSnapshotPlan
  language_plan: TranslatedSnapshotPlan['language_plan']
  pdf_plan: PdfExportPlan
  next_steps: ShareNextStep[]
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

  const translatedSnapshotPlan = planTranslatedSnapshot({
    snapshot: params.snapshot,
    target_language: params.target_language,
  })
  const languagePlan = translatedSnapshotPlan.language_plan
  const pdfPlan = planPdfExport(params.snapshot, {
    target_language: params.target_language,
  })

  if (translatedSnapshotPlan.status === 'blocked') blockers.push('translated_snapshot_blocked')
  if (pdfPlan.status === 'blocked' && languagePlan.status !== 'ready') {
    warnings.push('pdf_export_blocked')
  }
  if (pdfPlan.status === 'partial') warnings.push('pdf_export_partial')
  if (visibility === 'public' && params.snapshot.privacy_mode !== 'snapshot_allowed') {
    blockers.push('public_share_requires_snapshot_allowed')
  }

  const copyLinkReady = blockers.length === 0 && languagePlan.status !== 'blocked'
  const needsTranslatedSnapshot = translatedSnapshotPlan.status === 'ready_to_create'
  const pdfReady = copyLinkReady && pdfPlan.status !== 'blocked'
  const pdfPending = copyLinkReady && needsTranslatedSnapshot && pdfPlan.snapshot_rule === 'requires_translated_snapshot'
  const sourceSnapshotId = params.snapshot.id
  const targetSnapshotId = translatedSnapshotPlan.target_snapshot_id
  const readySnapshotId = needsTranslatedSnapshot ? undefined : targetSnapshotId ?? sourceSnapshotId
  const plannedSnapshotId = targetSnapshotId ?? sourceSnapshotId

  const nextSteps: ShareNextStep[] = []
  if (needsTranslatedSnapshot) nextSteps.push('create_translated_snapshot')
  if (pdfReady) nextSteps.push('export_pdf_from_target_snapshot')
  if (pdfPending) nextSteps.push('export_pdf_from_target_snapshot')
  if (copyLinkReady) nextSteps.push('copy_snapshot_link', 'send_snapshot_link')

  const actions: SharePlan['actions'] = [
    {
      channel: 'copy_link',
      status: needsTranslatedSnapshot ? 'pending' : copyLinkReady ? 'ready' : 'blocked',
      reason_fr: needsTranslatedSnapshot
        ? 'Le lien sera pret apres creation du snapshot dans la langue cible.'
        : copyLinkReady
        ? 'Le lien pointe vers un snapshot stable dans la langue cible.'
        : 'Le lien exige un snapshot valide et une langue exportable.',
    },
    {
      channel: 'download_pdf',
      status: pdfPending ? 'pending' : pdfReady ? 'ready' : 'blocked',
      reason_fr: pdfPending
        ? 'Le PDF sera exportable apres creation du snapshot dans la langue cible.'
        : pdfReady
        ? 'Le PDF peut etre exporte depuis le snapshot sans regeneration.'
        : 'Le PDF attend un snapshot complet dans la langue cible, sans traduction a la volee.',
    },
    {
      channel: 'email',
      status: needsTranslatedSnapshot ? 'pending' : copyLinkReady ? 'ready' : 'blocked',
      reason_fr: needsTranslatedSnapshot
        ? 'L email sera pret apres creation du snapshot dans la langue cible.'
        : copyLinkReady
        ? 'L email partage le lien snapshot, pas le contenu brut.'
        : 'L email exige un lien snapshot valide.',
    },
  ]

  const status: SharePlanStatus =
    blockers.length > 0
      ? 'blocked'
      : warnings.length > 0 || actions.some((action) => action.status === 'pending')
        ? 'partial'
        : 'ready'

  return {
    status,
    share_button: DEFAULT_UNIFIED_SHARE_BUTTON,
    snapshot_id: readySnapshotId ?? sourceSnapshotId,
    source_snapshot_id: sourceSnapshotId,
    target_snapshot_id: targetSnapshotId,
    visibility,
    target_language: params.target_language,
    public_url: readySnapshotId ? buildPublicUrl(readySnapshotId, params.target_language) : undefined,
    planned_public_url: plannedSnapshotId ? buildPublicUrl(plannedSnapshotId, params.target_language) : undefined,
    actions,
    translated_snapshot_plan: translatedSnapshotPlan,
    language_plan: languagePlan,
    pdf_plan: pdfPlan,
    next_steps: nextSteps,
    warnings,
    blockers,
  }
}
