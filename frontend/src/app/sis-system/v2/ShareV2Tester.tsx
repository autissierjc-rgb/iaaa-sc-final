'use client'

import { useState } from 'react'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'
import type { ShareVisibility } from '@/lib/contracts/share'

type SharePlanResponse = {
  ok?: boolean
  plan?: {
    status?: string
    public_url?: string
    visibility?: string
    target_language?: string
    warnings?: string[]
    blockers?: string[]
    actions?: Array<{
      channel?: string
      status?: string
      reason_fr?: string
    }>
    language_plan?: {
      status?: string
      snapshot_rule?: string
      provider_selected?: string
    }
    pdf_plan?: {
      status?: string
      filename?: string
    }
  }
  error?: string
}

const SAMPLE_SNAPSHOT: GeneratedCardSnapshot = {
  id: 'sc_demo_share',
  generation_event_id: 'evt_demo_share',
  created_at: new Date('2026-05-10T00:00:00.000Z').toISOString(),
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

export default function ShareV2Tester() {
  const [result, setResult] = useState<SharePlanResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(targetLanguage: LanguageCode, visibility: ShareVisibility) {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/share-v2/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: SAMPLE_SNAPSHOT,
          target_language: targetLanguage,
          visibility,
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
          <h2 style={{ margin: 0, fontSize: 15 }}>Test SharePlanner</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Orchestre le menu Partager : lien, PDF, langue, visibilite et canaux autorises, toujours depuis un snapshot.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => run('fr', 'restricted')}
            disabled={busy}
            style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            Partager FR
          </button>
          <button
            type="button"
            onClick={() => run('en', 'public')}
            disabled={busy}
            style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            Public EN
          </button>
        </div>
      </div>

      {busy ? (
        <p style={{ color: '#8B8174', fontSize: 12, marginTop: 14 }}>Plan partage en cours...</p>
      ) : null}

      {result ? (
        <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
          <p style={{ margin: 0, color: plan?.status === 'ready' ? '#1D9E75' : plan?.status === 'blocked' ? '#B23A3A' : '#C8951A', fontWeight: 700 }}>
            {result.ok ? `Statut : ${plan?.status}` : `Erreur : ${result.error}`}
          </p>
          {plan ? (
            <>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                URL : <span style={{ fontFamily: 'monospace' }}>{plan.public_url}</span> · {plan.visibility} · {plan.target_language}
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Langue : {plan.language_plan?.status} · {plan.language_plan?.snapshot_rule} · {plan.language_plan?.provider_selected}
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                PDF : {plan.pdf_plan?.status} · {plan.pdf_plan?.filename}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
                {plan.actions?.map((action) => (
                  <div key={action.channel} style={{ border: '1px solid #E1D6C2', borderRadius: 8, padding: 10, background: '#fff' }}>
                    <p style={{ margin: 0, color: action.status === 'ready' ? '#1D9E75' : '#B23A3A', fontSize: 12, fontWeight: 700 }}>
                      {action.channel} · {action.status}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.4 }}>{action.reason_fr}</p>
                  </div>
                ))}
              </div>
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
