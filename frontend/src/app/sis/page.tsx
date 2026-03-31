/**
 * IAAA · /sis
 * SIS — Situation Intelligence System — structuration professionnelle
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SIS — Situation Intelligence System',
  description: 'Lire une situation complexe à partir de vos documents. SIS révèle la structure là où les autres résument.',
}

const USE_CASES = [
  {
    label: 'ONG & terrain',
    desc:  'Lecture de situation opérationnelle avant décision de déploiement. Identification des vulnérabilités structurelles d\'une zone ou d\'un programme.',
  },
  {
    label: 'Conseil & stratégie',
    desc:  'Structuration rapide d\'un dossier client complexe. Mise en évidence des forces en tension et des trajectoires réalistes avant recommandation.',
  },
  {
    label: 'Journalisme & recherche',
    desc:  'Analyse d\'un dossier multisources. Identification de la dynamique sous-jacente au-delà des faits de surface.',
  },
  {
    label: 'Dirigeants & décideurs',
    desc:  'Comprendre une situation avant de décider. Réduire le bruit. Voir ce qui tient le système ensemble et ce qui peut le faire basculer.',
  },
]

export default function SISPage() {
  return (
    <main style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', color: '#1A2E5A' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/clarity"    style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>Clarity</Link>
          <Link href="/enterprise" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>IAAA+</Link>
          <Link href="/login"      style={{ fontSize: '12px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 28px 0' }}>

        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#C8951A', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '20px' }}>
          SIS — Situation Intelligence System
        </p>

        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '20px', lineHeight: 1.2 }}>
          Lire une situation complexe<br />à partir de vos documents.
        </h1>

        <p style={{ fontSize: '16px', color: '#7A6A5A', lineHeight: 1.8, marginBottom: '48px', maxWidth: '540px' }}>
          Importez vos données. SIS transforme l'information en structure exploitable.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '72px', flexWrap: 'wrap' }}>
          <Link href="/register?tier=sis" style={{ display: 'inline-block', background: '#1A2E5A', color: '#fff', fontSize: '12px', fontFamily: 'var(--font-cinzel, serif)', letterSpacing: '0.1em', padding: '13px 28px', borderRadius: '6px', textDecoration: 'none' }}>
            ANALYSER UN DOCUMENT
          </Link>
          <Link href="/library" style={{ display: 'inline-block', background: 'transparent', color: '#1A2E5A', fontSize: '12px', padding: '13px 20px', borderRadius: '6px', textDecoration: 'none', border: '1px solid #E8E0D0' }}>
            Voir l'Atlas →
          </Link>
        </div>

      </div>

      {/* What SIS does */}
      <div style={{ background: '#1A2E5A' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 28px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '22px', fontStyle: 'italic', color: '#fff', lineHeight: 1.6, marginBottom: '0' }}>
                SIS ne résume pas vos documents.
              </p>
              <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '22px', fontStyle: 'italic', color: '#E8C84A', lineHeight: 1.6 }}>
                SIS révèle leur structure.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                'Structure des situations multisources',
                'Détection des tensions et asymétries',
                'Identification de la vulnérabilité centrale',
                'Projection des évolutions possibles',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#E8C84A', fontSize: '12px', marginTop: '3px', flexShrink: 0 }}>◆</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Use cases */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 28px' }}>

          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '32px' }}>
            Usages réels
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {USE_CASES.map((uc, i) => (
              <div key={uc.label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '28px', padding: '20px 0', borderBottom: i < USE_CASES.length - 1 ? '1px solid #F0EBE0' : 'none', alignItems: 'start' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#C8951A' }}>{uc.label}</p>
                <p style={{ fontSize: '14px', color: '#7A6A5A', lineHeight: 1.75 }}>{uc.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#F5F0E8', borderTop: '1px solid #E8E0D0' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#9A8860' }}>
            Un même système. Trois niveaux de lecture.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/clarity"    style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>← Clarity</Link>
            <Link href="/enterprise" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>IAAA+ →</Link>
          </div>
        </div>
      </div>


      {/* CTA */}
      <div style={{ background: '#F5F0E8', borderTop: '1px solid #E8E0D0', padding: '36px 36px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: '#FFF7E6', color: '#C8951A', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px', marginBottom: '14px' }}>
            Abonnement — à venir
          </span>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#1A2E5A', marginBottom: '8px', lineHeight: 1.5 }}>
            SIS sera disponible prochainement.
          </p>
          <p style={{ fontSize: '13px', color: '#9A8860', marginBottom: '20px', lineHeight: 1.7 }}>
            Laissez votre adresse pour être notifié dès le lancement.
          </p>
          <a href="mailto:hello@situationcard.com?subject=SIS — notification lancement" style={{ display: 'inline-block', background: '#1A2E5A', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '11px 28px', borderRadius: '7px', textDecoration: 'none' }}>
            Être notifié du lancement
          </a>
        </div>
      </div>

    </main>
  )
}
