'use client'

/**
 * IAAA · ScPageActions
 *
 * All interactive actions on /sc/[slug]:
 *   - Statut (Privée / Collaborative-grisé / Publique)
 *   - Traçabilité (dates)
 *   - Enregistrer (save to user collection)
 *   - Récapitulatif (placeholder V1)
 *   - Analyse détaillée (expand card content)
 *   - Partager (Share buttons)
 *
 * V1 rules:
 *   - Collaborative = grisé / Coming soon
 *   - Récapitulatif = placeholder UI, no LLM call
 *   - Analyse détaillée = expand existing card data, no new call
 *   - Statut toggle = PATCH /api/cards/:slug/visibility (owner only)
 */

import { useState }        from 'react'
import type { SituationCard } from '@/types/index'
import ShareButtons          from './ShareButtons'
import { saveCard }          from '@/lib/cardsApi'
import { Star, Lock, Globe, Users, Map, BarChart2 } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://iaaa.app'

interface Props {
  slug:       string
  card:       SituationCard
  isPublic:   boolean
  isOwner:    boolean    // true if authenticated user owns this card
  createdAt:  string
  updatedAt:  string | null
  viewCount?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    + ' — '
    + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (    <p
      style={{
        fontSize:      '0.56rem',
        opacity:       0.4,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontFamily:    'var(--font-dm-sans)',
        fontWeight:    500,
        color:         'var(--gold)',
      }}
    >
      {children}
    </p>
  )
}

const btnBase: React.CSSProperties = {
  fontSize:      '0.62rem',
  letterSpacing: '0.08em',
  border:        '1px solid var(--border-gold-subtle)',
  borderRadius:  '2px',
  padding:       '0.35rem 0.85rem',
  background:    'transparent',
  cursor:        'pointer',
  color:         'var(--text-muted)',
  fontFamily:    'var(--font-dm-sans)',
  transition:    'color 0.15s, border-color 0.15s',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScPageActions({
  slug,
  card,
  isPublic,
  isOwner,
  createdAt,
  updatedAt,
  viewCount,
}: Props) {
  const [visibility, setVisibility]     = useState<'private' | 'public'>(isPublic ? 'public' : 'private')
  const [visLoading, setVisLoading]     = useState(false)
  const [saveState, setSaveState]       = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [recapOpen, setRecapOpen]       = useState(false)
  const [analyseOpen, setAnalyseOpen]   = useState(false)

  const shareUrl = `${APP_URL}/sc/${slug}`

  // ── Visibility toggle (owner only) ────────────────────────────────────────
  async function toggleVisibility(target: 'private' | 'public') {
    if (!isOwner || visLoading) return
    setVisLoading(true)
    try {
      await fetch(`/api/cards/${slug}/visibility`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ is_public: target === 'public' }),
      })
      setVisibility(target)
    } catch { /* silent */ }
    setVisLoading(false)
  }

  // ── Enregistrer (save to user collection) ─────────────────────────────────
  async function handleSave() {
    if (saveState !== 'idle') return
    setSaveState('saving')
    try {
      await saveCard(card, true)
      setSaveState('saved')
      } catch (e) {
  setSaveState('error')
}
}

return (
  <div className="flex flex-col gap-5">

      {/* ── Traçabilité ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Traçabilité</SectionLabel>
        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Créé le {formatDate(createdAt)}
        </p>
        {updatedAt && updatedAt !== createdAt && (
          <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            Modifié le {formatDate(updatedAt)}
          </p>
        )}
        {viewCount !== undefined && viewCount > 0 && (
          <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            {viewCount.toLocaleString()} vue{viewCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Statut ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Statut</SectionLabel>
        <div className="flex gap-2 flex-wrap">

          {/* Privée */}
          <button
            onClick={() => toggleVisibility('private')}
            disabled={!isOwner || visLoading}
            style={{
              ...btnBase,
              color:       visibility === 'private' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderColor: visibility === 'private' ? 'var(--border-gold-medium)' : 'var(--border-gold-subtle)',
              opacity:     !isOwner ? 0.4 : 1,
              cursor:      !isOwner ? 'not-allowed' : 'pointer',
            }}
          >
            <Lock size={12} strokeWidth={1.5} style={{marginRight:'4px',verticalAlign:'middle'}}/> Privée
          </button>

          {/* Collaborative — grisé */}
          <button
            disabled
            title="Coming soon"
            style={{
              ...btnBase,
              opacity: 0.3,
              cursor:  'not-allowed',
            }}
          >
            <Users size={12} strokeWidth={1.5} style={{marginRight:'4px',verticalAlign:'middle'}}/> Collaborative
          </button>

          {/* Publique */}
          <button
            onClick={() => toggleVisibility('public')}
            disabled={!isOwner || visLoading}
            style={{
              ...btnBase,
              color:       visibility === 'public' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderColor: visibility === 'public' ? 'var(--border-gold-medium)' : 'var(--border-gold-subtle)',
              opacity:     !isOwner ? 0.4 : 1,
              cursor:      !isOwner ? 'not-allowed' : 'pointer',
            }}
          >
            <Globe size={12} strokeWidth={1.5} style={{marginRight:'4px',verticalAlign:'middle'}}/> Publique
          </button>
        </div>
        {!isOwner && (
          <p style={{ fontSize: '0.54rem', color: 'var(--text-muted)', opacity: 0.6 }}>
            Connectez-vous pour modifier le statut
          </p>
        )}
      </div>

      {/* ── Actions row ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">

        {/* Enregistrer */}
       <button
  onClick={handleSave}
  disabled={saveState === 'saving' || saveState === 'saved'}
  style={{
    ...btnBase,
    color: saveState === 'saved' ? 'var(--gold)' : 'var(--text-muted)',
    opacity: saveState === 'saving' ? 0.5 : 1,
  }}
>
  {saveState === 'saved' ? 'Enregistrée' : saveState === 'saving' ? '...' : 'Enregistrer'}
</button>

{/* Récapitulatif */}
<button
  onClick={() => setRecapOpen((o) => !o)}
  style={{ ...btnBase }}
>
  🧭 Récapitulatif
</button>

        {/* Analyse détaillée */}
        <button
          onClick={() => setAnalyseOpen((o) => !o)}
          style={{ ...btnBase }}
        >
          {analyseOpen ? 'Fermer analyse' : 'Voir analyse détaillée'}
        </button>
      </div>

      {/* ── Récapitulatif placeholder ───────────────────────────────────────── */}
      {recapOpen && (
        <div
          className="rounded-[2px] p-4 flex flex-col gap-3"
          style={{
            background: 'rgba(196,168,130,0.04)',
            border:     '1px solid var(--border-gold-subtle)',
          }}
        >
          <SectionLabel>Récapitulatif · Évolution</SectionLabel>
          <div className="flex flex-col gap-2">
            {[
              'Phase 1 — Situation initiale identifiée',
              'Phase 2 — Tensions structurelles émergentes',
              'Phase 3 — Point de fragilité central révélé',
              'Phase 4 — Trajectoires divergentes ouvertes',
              'Phase 5 — Signal critique à surveiller',
            ].map((phase, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span style={{ fontSize: '0.56rem', color: 'var(--gold-dim)', marginTop: '0.1rem', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 300 }}>
                  {phase}
                </p>
              </div>
            ))}
          </div>
          <div
            className="px-3 py-2 rounded-[2px]"
            style={{ background: 'rgba(196,168,130,0.06)', borderLeft: '2px solid rgba(196,168,130,0.3)' }}
          >
            <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Point clé : {card.main_vulnerability}
            </p>
          </div>
          <p style={{ fontSize: '0.52rem', color: 'var(--text-muted)', opacity: 0.5, marginTop: '0.25rem' }}>
            Récapitulatif généré — moteur analytique bientôt disponible
          </p>
        </div>
      )}

      {/* ── Analyse détaillée ───────────────────────────────────────────────── */}
      {analyseOpen && (
        <div
          className="rounded-[2px] p-4 flex flex-col gap-4"
          style={{
            background: 'rgba(196,168,130,0.03)',
            border:     '1px solid var(--border-gold-subtle)',
          }}
        >
          <SectionLabel>Analyse détaillée</SectionLabel>

          {card.forces?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem', color: 'var(--gold)' }}>Forces</p>
              {card.forces.map((f, i) => (
                <p key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.5, marginBottom: '0.2rem' }}>· {f}</p>
              ))}
            </div>
          )}

          {card.tensions?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem', color: 'var(--gold)' }}>Tensions</p>
              {card.tensions.map((t, i) => (
                <p key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.5, marginBottom: '0.2rem' }}>· {t}</p>
              ))}
            </div>
          )}

          {card.vulnerabilities?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem', color: 'var(--gold)' }}>Vulnérabilités</p>
              {card.vulnerabilities.map((v, i) => (
                <p key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.5, marginBottom: '0.2rem' }}>· {v}</p>
              ))}
            </div>
          )}

          {card.constraints?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem', color: 'var(--gold)' }}>Contraintes</p>
              {card.constraints.map((c, i) => (
                <p key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.5, marginBottom: '0.2rem' }}>· {c}</p>
              ))}
            </div>
          )}

          {card.uncertainty?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem', color: 'var(--gold)' }}>Incertitudes</p>
              {card.uncertainty.map((u, i) => (
                <p key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.5, marginBottom: '0.2rem' }}>· {u}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Partager ────────────────────────────────────────────────────────── */}
      <ShareButtons
        url={shareUrl}
        title={card.title}
      />

      {/* ── Collaborative — grayed, Phase 2 ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          disabled
          title="Coming soon — One situation. Several readings."
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '7px',
            background:    'transparent',
            border:        '1px solid var(--border-gold-subtle)',
            borderRadius:  '2px',
            padding:       '7px 14px',
            cursor:        'not-allowed',
            fontFamily:    'var(--font-cinzel)',
            fontSize:      '0.68rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            opacity:       0.4,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><circle cx="17" cy="11" r="3"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
          </svg>
          Collaborative
        </button>
        <span style={{
          fontFamily:    'var(--font-cinzel)',
          fontSize:      '0.52rem',
          color:         'var(--text-muted)',
          letterSpacing: '0.1em',
          opacity:       0.45,
          fontStyle:     'italic',
        }}>
          One situation. Several readings.
        </span>
      </div>
    </div>
  )
}
