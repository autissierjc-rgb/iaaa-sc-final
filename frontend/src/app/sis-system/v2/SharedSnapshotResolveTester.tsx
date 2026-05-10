'use client'

import { useState } from 'react'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'

type ResolveResponse = {
  ok?: boolean
  plan?: {
    status?: string
    read_rule?: string
    snapshot_id?: string
    route_language?: string
    snapshot_language?: string
    localized_path?: string
    data_endpoint?: string
    source_snapshot_present?: boolean
    allowed_runtime_calls?: string[]
    prohibited_runtime_calls?: string[]
    warnings?: string[]
    missing?: string[]
    cache_policy?: {
      public_snapshot_cache?: boolean
      s_maxage_seconds?: number
      stale_while_revalidate_seconds?: number
    }
  }
  error?: string
}

const SAMPLE_SNAPSHOT: GeneratedCardSnapshot = {
  id: 'sc_demo_share',
  generation_event_id: 'evt_demo_share',
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
  },
}

export default function SharedSnapshotResolveTester() {
  const [result, setResult] = useState<ResolveResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(routeLanguage: LanguageCode, withSnapshot: boolean) {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/share-v2/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: withSnapshot ? SAMPLE_SNAPSHOT.id : 'sc_demo_share-en',
          route_language: routeLanguage,
          surface: 'situation_card',
          snapshot: withSnapshot ? SAMPLE_SNAPSHOT : undefined,
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
          <h2 style={{ margin: 0, fontSize: 15 }}>Resolution snapshot partage</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Verifie la lecture d une carte partagee : route localisee, snapshot stable, cache public et aucune
            generation IA pendant la consultation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => run('fr', true)}
            disabled={busy}
            style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            Lire FR
          </button>
          <button
            type="button"
            onClick={() => run('en', false)}
            disabled={busy}
            style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}
          >
            Plan EN
          </button>
        </div>
      </div>

      {busy ? (
        <p style={{ color: '#8B8174', fontSize: 12, marginTop: 14 }}>Resolution en cours...</p>
      ) : null}

      {result ? (
        <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
          <p style={{ margin: 0, color: plan?.status === 'ready' ? '#1D9E75' : plan?.status === 'missing_snapshot' ? '#B23A3A' : '#C8951A', fontWeight: 700 }}>
            {result.ok ? `Statut : ${plan?.status}` : `Erreur : ${result.error}`}
          </p>
          {plan ? (
            <>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Route : <span style={{ fontFamily: 'monospace' }}>{plan.localized_path}</span> · endpoint : <span style={{ fontFamily: 'monospace' }}>{plan.data_endpoint}</span>
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Langue : route {plan.route_language} · snapshot {plan.snapshot_language ?? 'lookup'} · {plan.read_rule}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Autorise : {plan.allowed_runtime_calls?.join(', ')} · Interdit : {plan.prohibited_runtime_calls?.join(', ')}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Cache : s-maxage {plan.cache_policy?.s_maxage_seconds}s · stale {plan.cache_policy?.stale_while_revalidate_seconds}s
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Warnings : {plan.warnings?.length ? plan.warnings.join(', ') : 'aucun'} · Manquants : {plan.missing?.length ? plan.missing.join(', ') : 'aucun'}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
