'use client'

import { useState } from 'react'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'

type TranslatedSnapshotResponse = {
  ok?: boolean
  mode?: string
  plan?: {
    status?: string
    source_snapshot_id?: string
    target_snapshot_id?: string
    source_language?: string
    target_language?: string
    provider_selected?: string
    translation_rule?: string
    translation_scope?: string[]
    preserves?: string[]
    warnings?: string[]
    blockers?: string[]
    language_plan?: {
      status?: string
      snapshot_rule?: string
      missing?: string[]
    }
  }
  error?: string
}

const TARGET_LANGUAGES: LanguageCode[] = ['fr', 'en', 'es']

const SAMPLE_SNAPSHOT: GeneratedCardSnapshot = {
  id: 'sc_demo_snapshot_fr',
  generation_event_id: 'evt_demo_snapshot_fr',
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
    language: 'fr',
    writing: {
      situation_card: { title: 'Contestation resultats elections Trump' },
      lecture: 'Lecture structurelle complete.',
      approfondir: 'Approfondir enrichi complet.',
    },
    resources: {
      public_sources: [{ title: 'Source officielle' }],
    },
    safety: { risk_level: 'low' },
    quality: { status: 'ok' },
  },
}

export default function TranslatedSnapshotV2Tester() {
  const [result, setResult] = useState<TranslatedSnapshotResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(targetLanguage: LanguageCode) {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/language-v2/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: SAMPLE_SNAPSHOT,
          target_language: targetLanguage,
        }),
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
          <h2 style={{ margin: 0, fontSize: 15 }}>Snapshot traduit V2</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Verifie la regle canonique : un partage ou un PDF dans une autre langue doit d abord pointer vers
            un snapshot traduit stable, sans regeneration sauvage de la carte.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {TARGET_LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => run(language)}
              disabled={busy}
              style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Snapshot {language}
            </button>
          ))}
        </div>
      </div>

      {busy ? (
        <p style={{ color: '#8B8174', fontSize: 12, marginTop: 14 }}>Plan snapshot traduit en cours...</p>
      ) : null}

      {result ? (
        <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
          <p style={{ margin: 0, color: plan?.status === 'ready_to_create' ? '#C8951A' : plan?.status === 'blocked' ? '#B23A3A' : '#1D9E75', fontWeight: 700 }}>
            {result.ok ? `Statut : ${plan?.status}` : `Erreur : ${result.error}`}
          </p>
          {plan ? (
            <>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Snapshot : {plan.source_snapshot_id} → {plan.target_snapshot_id} · {plan.source_language} → {plan.target_language}
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Regle : {plan.translation_rule} · provider : {plan.provider_selected} · langue : {plan.language_plan?.snapshot_rule}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Traduire : {plan.translation_scope?.join(', ')}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Preserver : {plan.preserves?.join(', ')}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Blockers : {plan.blockers?.length ? plan.blockers.join(', ') : 'aucun'} · Warnings : {plan.warnings?.length ? plan.warnings.join(', ') : 'aucun'}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
