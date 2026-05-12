'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_PRIVATE_PLUG_CONTRACT,
  type UserMaterialPolicyContract,
  type UserMaterialKind,
  type UserMaterialRetentionChoice,
  type UserMaterialSensitivity,
} from '@/lib/contracts/userMaterial'

const MATERIAL_KINDS: UserMaterialKind[] = ['document', 'image', 'spreadsheet', 'dataset', 'url', 'private_plug']
const SENSITIVITIES: UserMaterialSensitivity[] = ['unknown', 'public', 'professional', 'personal', 'sensitive', 'regulated']

function boolLabel(value: boolean) {
  return value ? 'oui' : 'non'
}

export default function UserMaterialPolicyTester() {
  const [kind, setKind] = useState<UserMaterialKind>('document')
  const [sensitivity, setSensitivity] = useState<UserMaterialSensitivity>('unknown')
  const [confirmedRights, setConfirmedRights] = useState(false)
  const [keepPrivate, setKeepPrivate] = useState(false)
  const [publicSource, setPublicSource] = useState(false)
  const [policy, setPolicy] = useState<UserMaterialPolicyContract | null>(null)
  const [error, setError] = useState<string | null>(null)

  const retentionChoice: UserMaterialRetentionChoice = keepPrivate ? 'keep_private' : 'discard_after_processing'

  useEffect(() => {
    let active = true

    async function loadPolicy() {
      setError(null)

      try {
        const response = await fetch('/api/material-policy', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            kind,
            sensitivity,
            public_source: publicSource,
            user_confirmed_rights: confirmedRights,
            retention_choice: retentionChoice,
          }),
        })
        const payload = (await response.json()) as { ok?: boolean; policy?: UserMaterialPolicyContract; error?: string }

        if (!active) return

        if (!response.ok || !payload.ok || !payload.policy) {
          setPolicy(null)
          setError(payload.error ?? 'material_policy_unavailable')
          return
        }

        setPolicy(payload.policy)
      } catch {
        if (!active) return
        setPolicy(null)
        setError('material_policy_unavailable')
      }
    }

    void loadPolicy()

    return () => {
      active = false
    }
  }, [confirmedRights, kind, publicSource, retentionChoice, sensitivity])

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Matiere utilisateur / Plug prive</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Simule la politique avant upload ou connexion privee : droits confirmes, conservation optionnelle,
            extraction minimale, documents non exploitables par IAAA+ sans consentement separe.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as UserMaterialKind)}
            style={{ border: '1px solid #D8CBB5', borderRadius: 8, padding: '9px 10px', background: '#fff', color: '#1A2E5A' }}
          >
            {MATERIAL_KINDS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={sensitivity}
            onChange={(event) => setSensitivity(event.target.value as UserMaterialSensitivity)}
            style={{ border: '1px solid #D8CBB5', borderRadius: 8, padding: '9px 10px', background: '#fff', color: '#1A2E5A' }}
          >
            {SENSITIVITIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 14 }}>
        {[
          {
            label: 'Je confirme avoir le droit de partager',
            value: confirmedRights,
            set: setConfirmedRights,
          },
          {
            label: 'Garder prive',
            value: keepPrivate,
            set: setKeepPrivate,
          },
          {
            label: 'Source publique',
            value: publicSource,
            set: setPublicSource,
          },
        ].map((item) => (
          <label key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#FCFAF6', color: '#1A2E5A', fontSize: 12 }}>
            <input
              type="checkbox"
              checked={item.value}
              onChange={(event) => item.set(event.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <div style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6', marginTop: 14 }}>
        {!policy ? (
          <p style={{ margin: 0, color: error ? '#B23A3A' : '#6F6255', fontWeight: 700 }}>
            {error ? `Contrat indisponible : ${error}` : 'Chargement du contrat serveur...'}
          </p>
        ) : (
          <>
            <p style={{ margin: 0, color: policy.extraction_rule === 'blocked_until_user_confirms_rights' ? '#B23A3A' : '#1D9E75', fontWeight: 700 }}>
              {policy.extraction_rule === 'blocked_until_user_confirms_rights' ? 'Bloque avant confirmation des droits' : 'Traitement autorise sous contrat'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 10 }}>
              {[
                ['Extraction', policy.extraction_rule],
                ['Source', policy.source_type],
                ['Conservation', policy.retention_choice],
                ['Stockage', policy.storage_rule],
                ['Sortie publique', policy.public_output_rule],
                ['LLM', boolLabel(policy.may_be_sent_to_llm)],
                ['Search provider', boolLabel(policy.may_be_sent_to_search_provider)],
                ['Snapshot public', boolLabel(policy.may_be_included_in_public_snapshot)],
                ['Exploitable IAAA+', boolLabel(policy.exploitable_by_iaaa)],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid #E1D6C2', borderRadius: 8, padding: 10, background: '#fff' }}>
                  <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>{value}</p>
                  <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>{label}</h3>
                </div>
              ))}
            </div>
            <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '10px 0 0' }}>
              {policy.required_user_warning_fr}
            </p>
            <p style={{ color: '#8B8174', fontSize: 11, lineHeight: 1.55, margin: '8px 0 0' }}>
              {policy.non_exploitation_rule_fr}
            </p>
            {policy.kind === 'private_plug' && (
              <div style={{ border: '1px solid #D8CBB5', borderRadius: 8, padding: 12, background: '#fff', marginTop: 12 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                  {DEFAULT_PRIVATE_PLUG_CONTRACT.connector_type} · {DEFAULT_PRIVATE_PLUG_CONTRACT.access_mode}
                </p>
                <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>Plug prive</h3>
                <p style={{ color: '#6F6255', fontSize: 12, lineHeight: 1.55, margin: '8px 0 0' }}>
                  {DEFAULT_PRIVATE_PLUG_CONTRACT.user_promise_fr}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
