'use client'

import { useState } from 'react'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'

type PdfPlanResponse = {
  ok?: boolean
  plan?: {
    status?: string
    source_language?: string
    target_language?: string
    snapshot_rule?: string
    missing?: string[]
    warnings?: string[]
    required_notice_placement?: string
    filename?: string
    contract?: {
      layout?: string
      authority_status?: string
      distribution?: string
      generation_rule?: string
    }
  }
  error?: string
}

const SAMPLE_COMPLETE_SNAPSHOT: GeneratedCardSnapshot = {
  id: 'sc_demo_ready',
  generation_event_id: 'evt_demo_ready',
  created_at: new Date('2026-05-10T00:00:00.000Z').toISOString(),
  language: 'fr',
  privacy_mode: 'snapshot_allowed',
  admin_learning_only: false,
  user_deletable: true,
  card_version: 'v2-draft',
  canonical_question: 'Trump peut-il contester les resultats des elections de mi-mandat ?',
  header_domain: 'Geopolitique',
  header_subject: 'contestation resultats elections Trump',
  situation_soumise: 'Trump peut-il contester les resultats des elections de mi-mandat ?',
  source_count: 3,
  payload: {
    writing: {
      situation_card: { title: 'Contestation resultats elections Trump' },
      lecture: 'Lecture structurelle complete.',
      approfondir: 'Approfondir enrichi complet.',
    },
    resources: {
      status: 'available',
      public_sources: [
        { title: 'Source officielle', url: 'https://example.org/source' },
      ],
    },
    safety: { risk_level: 'low' },
    quality: { status: 'ok' },
  },
}

const SAMPLE_INCOMPLETE_SNAPSHOT: GeneratedCardSnapshot = {
  ...SAMPLE_COMPLETE_SNAPSHOT,
  id: 'sc_demo_blocked',
  source_count: 0,
  payload: {
    writing: {
      situation_card: { title: 'Contestation resultats elections Trump' },
    },
    resources: { status: 'partial', public_sources: [] },
    safety: { risk_level: 'regulated' },
    quality: { status: 'warning' },
  },
}

export default function PdfExportV2Tester() {
  const [result, setResult] = useState<PdfPlanResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(snapshot: GeneratedCardSnapshot, targetLanguage: LanguageCode = snapshot.language) {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/pdf-v2/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, target_language: targetLanguage }),
      })
      setResult(await response.json())
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' })
    } finally {
      setBusy(false)
    }
  }

  const plan = result?.plan

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Test export PDF</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Verifie si un snapshot peut devenir un PDF complet protege : contenu present, sources, provenance,
            statut non officiel et mention placee en fin de document.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => run(SAMPLE_COMPLETE_SNAPSHOT, 'fr')}
            disabled={busy}
            style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            PDF FR
          </button>
          <button
            type="button"
            onClick={() => run(SAMPLE_COMPLETE_SNAPSHOT, 'en')}
            disabled={busy}
            style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            PDF EN
          </button>
          <button
            type="button"
            onClick={() => run(SAMPLE_INCOMPLETE_SNAPSHOT, 'fr')}
            disabled={busy}
            style={{ border: '1px solid #E1D6C2', background: '#FCFAF6', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            Snapshot incomplet
          </button>
        </div>
      </div>

      {busy ? (
        <p style={{ color: '#8B8174', fontSize: 12, marginTop: 14 }}>Verification PDF en cours...</p>
      ) : null}

      {result ? (
        <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
          <p style={{ margin: 0, color: plan?.status === 'ready' ? '#1D9E75' : plan?.status === 'blocked' ? '#B23A3A' : '#C8951A', fontWeight: 700 }}>
            {result.ok ? `Statut : ${plan?.status}` : `Erreur : ${result.error}`}
          </p>
          {plan ? (
            <>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Fichier prevu : <span style={{ fontFamily: 'monospace' }}>{plan.filename}</span>
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Regle : {plan.contract?.generation_rule} · {plan.contract?.layout} · {plan.contract?.authority_status}
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Langue : {plan.source_language} → {plan.target_language} · {plan.snapshot_rule}
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Mention : {plan.required_notice_placement}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Manquants : {plan.missing?.length ? plan.missing.join(', ') : 'aucun'} · Warnings : {plan.warnings?.length ? plan.warnings.join(', ') : 'aucun'}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
