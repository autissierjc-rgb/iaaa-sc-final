import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'A propos - IAAA+',
  description: 'IAAA+ societe a mission dediee aux architectures IA',
}

export default function AboutPage() {
  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <Link href="/" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>Retour</Link>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 28px' }}>

        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
          A propos
        </p>

        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '6px', lineHeight: 1.3 }}>
          IAAA+
        </h1>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#9A8860', letterSpacing: '0.08em', marginBottom: '48px' }}>
          Agence d Intelligence Artificielle d Alliance
        </p>

        <div style={{ fontSize: '15px', color: '#5A6A7A', lineHeight: 1.9 }}>

          <div style={{ borderLeft: '3px solid #C8951A', paddingLeft: '20px', marginBottom: '40px' }}>
            <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '21px', fontStyle: 'italic', color: '#1A2E5A', lineHeight: 1.6 }}>
              IAAA+ est une societe a mission dediee a l education et a la conception d architectures pour l alliance entre humains et intelligences artificielles.
            </p>
          </div>

          <p style={{ marginBottom: '24px' }}>
            L intelligence artificielle ne remplace pas le jugement humain. Elle peut l eclairer, a condition d etre concue pour cela.
          </p>

          <p style={{ marginBottom: '24px' }}>
            Situation Card est la premiere expression publique de cette question. Un systeme d analyse structuree de situations complexes, concu pour que la decision reste toujours celle de la personne qui fait face a la situation.
          </p>

          <p style={{ marginBottom: '48px' }}>
            Ce n est pas un outil de reponse. C est un instrument de clarte.
          </p>

        </div>

        <div style={{ borderTop: '1px solid #E8E0D0', paddingTop: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/pricing" style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '2px' }}>Voir les offres</Link>
          <Link href="/library" style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '2px' }}>Explorer l Atlas</Link>
          <Link href="/contact" style={{ fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '2px' }}>Contact</Link>
        </div>

      </div>
    </main>
  )
}
