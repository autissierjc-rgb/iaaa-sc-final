'use client'

import { useState } from 'react'
import type { LanguageCode } from '@/lib/contracts/common'
import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'

type LanguagePlanResponse = {
  ok?: boolean
  plan?: {
    status?: string
    source_language?: string
    target_language?: string
    provider_selected?: string
    snapshot_rule?: string
    missing?: string[]
    warnings?: string[]
    contract?: {
      mode?: string
      translated_fields?: string[]
      must_preserve_terms?: string[]
      quality_checks?: Record<string, boolean>
    }
  }
  error?: string
}

const SAMPLE_SNAPSHOT: GeneratedCardSnapshot = {
  id: 'sc_demo_language',
  generation_event_id: 'evt_demo_language',
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
  },
}

export default function LanguageV2Tester() {
  const [result, setResult] = useState<LanguagePlanResponse | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(targetLanguage: LanguageCode) {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/language-v2/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: SAMPLE_SNAPSHOT,
          source_language: 'fr',
          target_language: targetLanguage,
          provider_preference: ['gemma', 'kimi', 'nvidia_nim', 'reference_llm'],
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
          <h2 style={{ margin: 0, fontSize: 15 }}>Test LanguageService</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Planifie une version multilingue depuis un snapshot : langue source, langue cible, provider prefere,
            champs a traduire et controles anti-melange.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {(['fr', 'en', 'es', 'de'] as LanguageCode[]).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => run(language)}
              disabled={busy}
              style={{ border: '1px solid #C8951A', background: '#FFF8E8', color: '#1A2E5A', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      {busy ? (
        <p style={{ color: '#8B8174', fontSize: 12, marginTop: 14 }}>Plan langue en cours...</p>
      ) : null}

      {result ? (
        <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
          <p style={{ margin: 0, color: plan?.status === 'ready' ? '#1D9E75' : plan?.status === 'blocked' ? '#B23A3A' : '#C8951A', fontWeight: 700 }}>
            {result.ok ? `Statut : ${plan?.status}` : `Erreur : ${result.error}`}
          </p>
          {plan ? (
            <>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                {plan.source_language} → {plan.target_language} · {plan.snapshot_rule} · provider : {plan.provider_selected}
              </p>
              <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                Mode : {plan.contract?.mode} · champs : {plan.contract?.translated_fields?.join(', ')}
              </p>
              <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
                Preserver : {plan.contract?.must_preserve_terms?.join(', ')}
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
