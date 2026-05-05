'use client'

/**
 * IAAA · OfferModal
 * Pop-up Offres — déclenché par le bouton "Offres" de la home.
 * Trois colonnes : Clarity, SIS, IAAA+.
 */

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  onClose: () => void
}

const TIERS = [
  {
    id:     'clarity',
    name:   'Clarity',
    badge:  null,
    status: 'Freemium',
    statusColor: '#185FA5',
    statusBg:    '#EEF4FF',
    desc:   'Pour toute personne face à une situation difficile. Comprendre ce qui se passe vraiment, sans se faire dire quoi faire.',
    detail: [
      'Situation Cards illimitées',
      'Cap et trajectoires',
      'Partage public ou privé',
    ],
    cta:     'CLARITY WEBSITE',
    ctaHref: '/clarity',
    ctaStyle: 'primary',
    note:    null,
  },
  {
    id:     'sis',
    name:   'SIS',
    badge:  null,
    status: 'Collectif Pro · Situation Intelligence System',
    statusColor: '#C8951A',
    statusBg:    '#FFF7E6',
    desc:   'Pour les professionnels, analystes, consultants et équipes qui ont besoin de structurer des situations complexes à partir de documents.',
    detail: [
      'Situations multisources',
      'Mode collaboratif',
      'Historique et traçabilité',
    ],
    cta:     'SIS WEBSITE',
    ctaHref: '/sis-system',
    ctaStyle: 'secondary',
    note:    null,
  },
  {
    id:     'plus',
    name:   'IAAA+',
    badge:  'Gouvernance',
    status: 'Resonance Engine Navigator',
    statusColor: '#E8C84A',
    statusBg:    'rgba(232,200,74,0.15)',
    desc:   'Pour les organisations, institutions et environnements critiques qui ont besoin d\'une infrastructure de lecture collective, souveraine et traçable.',
    detail: [
      'Lecture multi-acteurs',
      'Hébergement Europe (OVH)',
      'Configuration sur mesure',
    ],
    cta:     'IAAA+ WEBSITE',
    ctaHref: 'https://iaaa.fr/agence.html',
    ctaStyle: 'gold',
    note:    null,
  },
]

export default function OfferModal({ onClose }: Props) {

  // Fermer sur Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed', inset: 0,
          background: 'rgba(26,46,90,0.55)',
          zIndex:     100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position:      'fixed',
        top:           '50%',
        left:          '50%',
        transform:     'translate(-50%, -50%)',
        zIndex:        101,
        width:         'min(960px, 95vw)',
        background:    '#fff',
        borderRadius:  '14px',
        overflow:      'hidden',
        fontFamily:    'var(--font-dm-sans, system-ui, sans-serif)',
      }}>

        {/* Header */}
        <div style={{ background: '#F5F0E8', padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E8E0D0' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Offres</p>
            <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '20px', color: '#1A2E5A', fontStyle: 'italic' }}>Un même système. Trois niveaux de lecture.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#9A8860', cursor: 'pointer', lineHeight: 1, padding: '0 0 2px' }}>✕</button>
        </div>

        {/* Tiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, maxHeight: '70vh', overflowY: 'auto' }}>
          {TIERS.map((tier, i) => (
            <div key={tier.id} style={{
              padding:      '24px 24px 28px',
              borderRight:  i < 2 ? '1px solid #F0EBE0' : 'none',
              display:      'flex',
              flexDirection:'column',
              background:   '#fff',
              minHeight: 360,
            }}>

              {/* Name + status */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '18px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tier.id === 'plus' ? '#1A2E5A' : '#1A2E5A', marginBottom: '8px' }}>
                  {tier.name}
                </p>
                <span style={{ display: 'inline-block', background: tier.statusBg, color: tier.statusColor, fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px' }}>
                  {tier.status}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '13px', color: '#7A6A5A', lineHeight: 1.75, marginBottom: '16px', flex: 1 }}>
                {tier.desc}
              </p>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px' }}>
                {tier.detail.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: '#9A8860', lineHeight: 1.5 }}>
                    <span style={{ color: '#C8951A', fontSize: '9px', marginTop: '4px', flexShrink: 0 }}>◆</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA */}
              {tier.ctaStyle === 'primary' && (
                <Link href={tier.ctaHref} onClick={onClose} style={{
                  display: 'block', textAlign: 'center',
                  background: '#1A2E5A', color: '#fff',
                  padding: '10px 16px', borderRadius: '7px',
                  fontSize: '12px', fontWeight: 500, textDecoration: 'none',
                }}>
                  {tier.cta}
                </Link>
              )}
              {tier.ctaStyle === 'secondary' && (
                <Link href={tier.ctaHref} onClick={onClose} style={{
                  display: 'block', textAlign: 'center',
                  background: 'transparent', color: '#1A2E5A',
                  border: '1px solid #E8E0D0',
                  padding: '10px 16px', borderRadius: '7px',
                  fontSize: '12px', textDecoration: 'none',
                }}>
                  {tier.cta}
                </Link>
              )}
              {tier.ctaStyle === 'gold' && (
                <a href={tier.ctaHref} target="_blank" rel="noreferrer" style={{
                  display: 'block', textAlign: 'center',
                  background: '#E8C84A', color: '#1A2E5A',
                  padding: '10px 16px', borderRadius: '7px',
                  fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                }}>
                  {tier.cta}
                </a>
              )}

              {tier.note && (
                <p style={{ fontSize: '11px', color: '#B8AD9A', marginTop: '8px', textAlign: 'center' }}>{tier.note}</p>
              )}

            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ background: '#F5F0E8', padding: '12px 28px', borderTop: '1px solid #E8E0D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9A8860' }}>
            Questions ? <a href="mailto:contact@situationcard.com" style={{ color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>contact@situationcard.com</a>
          </p>
          <Link href="/pricing" onClick={onClose} style={{ fontSize: '11px', color: '#9A8860', textDecoration: 'none' }}>
            Voir la page offres complète →
          </Link>
        </div>

      </div>
    </>
  )
}
