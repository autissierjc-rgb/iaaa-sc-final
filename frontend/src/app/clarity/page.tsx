'use client'

﻿'use client'

'use client'

/**
 * IAAA Â· /clarity
 * Bouton 1 de la home â€” comprÃ©hension individuelle
 */

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  { tag: 'Personnel', tagColor: '#185FA5', text: 'Je me sÃ©pare. Je ne sais pas si c\'est la bonne dÃ©cision.' },
  { tag: 'Personnel', tagColor: '#185FA5', text: 'Je n\'ai plus le sens de ce que je fais. Ni au travail, ni ailleurs.' },
  { tag: 'Personnel', tagColor: '#185FA5', text: 'J\'ai 20 ans et je ne sais pas ce que je veux faire. Tout le monde a l\'air d\'avoir une direction sauf moi.' },
  { tag: 'Professionnel', tagColor: '#C8951A', text: 'Mon Ã©quipe fonctionne mais quelque chose cloche. Je n\'arrive pas Ã  mettre le doigt dessus.' },
]

export default function ClarityPage() {
  const [situation, setSituation] = useState('')
  const router = useRouter()

  function handleSubmit() {
    const t = situation.trim()
    if (!t) return
    router.push(`/generate?q=${encodeURIComponent(t)}`)
  }

  return (
    <main style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', color: '#1A2E5A' }}>

      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '13px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.12em' }}>SITUATION CARD</Link>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#9A8860' }}>
          <Link href="/sis"        style={{ color: '#9A8860', textDecoration: 'none' }}>SIS</Link>
          <Link href="/enterprise" style={{ color: '#9A8860', textDecoration: 'none' }}>IAAA+</Link>
          <Link href="/login"      style={{ color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>Se connecter</Link>
        </div>
      </nav>

      <div style={{ padding: '52px 36px 0' }}>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#185FA5', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '14px' }}>Clarity</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: '#1A2E5A', lineHeight: 1.2, marginBottom: '14px' }}>
          Comprendre ce qui<br />se passe vraiment.
        </h1>
        <p style={{ fontSize: '14px', color: '#7A6A5A', lineHeight: 1.8, maxWidth: '440px', marginBottom: '28px' }}>
          DÃ©crivez une situation. La carte en rÃ©vÃ¨le la structure, les tensions et les Ã©volutions possibles.
        </p>

        <div style={{ background: '#fff', border: '1px solid #E8E0D0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit() }}
            placeholder="DÃ©crivez votre situationâ€¦"
            rows={3}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', padding: '16px', fontSize: '13px', color: '#1A2E5A', lineHeight: 1.7, fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box' }}
          />
          <div style={{ padding: '9px 14px', borderTop: '1px solid #F0EBE0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#B8AD9A' }}>âŒ˜â†µ</span>
            <button onClick={handleSubmit} disabled={!situation.trim()} style={{ background: situation.trim() ? '#1A2E5A' : 'transparent', color: situation.trim() ? '#fff' : '#9A8860', border: `1px solid ${situation.trim() ? '#1A2E5A' : '#DDD'}`, borderRadius: '6px', padding: '7px 18px', fontSize: '12px', cursor: situation.trim() ? 'pointer' : 'not-allowed' }}>
              GÃ©nÃ©rer â†’
            </button>
          </div>
        </div>

        <p style={{ fontSize: '10px', color: '#9A8860', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Exemples</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '44px' }}>
          {EXAMPLES.map((ex, i) => (
            <div key={i} onClick={() => setSituation(ex.text)} style={{ background: '#fff', border: '1px solid #E8E0D0', borderRadius: '8px', padding: '12px 14px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#C8951A')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8E0D0')}
            >
              <p style={{ fontSize: '10px', color: ex.tagColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>{ex.tag}</p>
              <p style={{ fontSize: '12px', color: '#5A6A7A', lineHeight: 1.5 }}>{ex.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', padding: '44px 36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#1A2E5A', lineHeight: 1.55, marginBottom: '7px' }}>Clarity ne vous dit pas quoi faire.</p>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#C8951A', lineHeight: 1.55 }}>Clarity vous montre ce qui est en jeu.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {['Une lecture structurÃ©e de votre situation', 'La vulnÃ©rabilitÃ© centrale', 'Trois Ã©volutions possibles', 'Un signal concret Ã  surveiller'].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#5A6A7A', lineHeight: 1.6 }}>
              <span style={{ color: '#C8951A', fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>â—†</span>{item}
            </div>
          ))}
        </div>
      </div>


      {/* CTA */}
      <div style={{ background: '#F5F0E8', borderTop: '1px solid #E8E0D0', padding: '36px 36px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: '#EEF4FF', color: '#185FA5', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px', marginBottom: '14px' }}>
            Freemium
          </span>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#1A2E5A', marginBottom: '8px', lineHeight: 1.5 }}>
            Commencez gratuitement. Aucune carte bancaire requise.
          </p>
          <p style={{ fontSize: '13px', color: '#9A8860', marginBottom: '20px', lineHeight: 1.7 }}>
            Clarity est libre d'accÃ¨s. CrÃ©ez votre premiÃ¨re Situation Card en moins d'une minute.
          </p>
          <Link href="/register?tier=clarity" style={{ display: 'inline-block', background: '#1A2E5A', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '11px 28px', borderRadius: '7px', textDecoration: 'none' }}>
            Commencer gratuitement
          </Link>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #E8E0D0', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F0E8' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '14px', fontStyle: 'italic', color: '#9A8860' }}>Moins d'opinion. Plus de structure.</p>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9A8860' }}>
          <Link href="/sis"     style={{ color: '#9A8860', textDecoration: 'none' }}>Voir SIS â†’</Link>
          <Link href="/pricing" style={{ color: '#9A8860', textDecoration: 'none' }}>Pricing â†’</Link>
        </div>
      </footer>

    </main>
  )
}

