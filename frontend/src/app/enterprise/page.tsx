/**
 * IAAA · /enterprise
 * Bouton 3 de la home — IAAA+ gouvernance collective
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'IAAA+ — Situation Card pour organisations',
  description: 'Rendre les décisions lisibles, traçables et partageables. Infrastructure de lecture pour systèmes complexes.',
}

export default function EnterprisePage() {
  return (
    <main style={{ background: '#1A2E5A', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', color: '#fff' }}>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '13px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#E8C84A', textDecoration: 'none', letterSpacing: '0.12em' }}>SITUATION CARD</Link>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
          <Link href="/clarity" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Clarity</Link>
          <Link href="/sis"     style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>SIS</Link>
          <a href="mailto:enterprise@situationcard.com" style={{ color: '#E8C84A', textDecoration: 'none', borderBottom: '1px solid #E8C84A', paddingBottom: '1px' }}>Demander une démo</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '60px 36px 0' }}>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#E8C84A', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '14px' }}>IAAA+</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '14px' }}>
          Rendre les décisions lisibles,<br />traçables et partageables.
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: '500px', marginBottom: '14px' }}>
          IAAA+ est une infrastructure de lecture des systèmes complexes. Elle structure ce qui est vu, compris et engagé.
        </p>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#E8C84A', marginBottom: '52px' }}>
          IAAA+ ne décide pas. IAAA+ rend la décision explicite.
        </p>
      </div>

      {/* Pillars */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0 36px' }}>
        {[
          { n: '01', title: 'Gouvernance', lead: 'Qui voit quoi. Qui interprète. Qui valide. Qui engage.', body: 'Chaque décision devient lisible. Chaque responsabilité devient explicite. Les systèmes complexes ne tombent pas en panne par manque d\'information — ils tombent en panne par manque de lecture partagée.' },
          { n: '02', title: 'Mode collaboratif', lead: 'Une situation n\'est jamais lue par une seule personne.', body: 'Lectures multi-acteurs sur une même Situation Card. Chaque contributeur apporte sa propre lecture. Le résultat n\'est pas un consensus forcé : c\'est une compréhension partagée, ou des désaccords clairement identifiés.' },
          { n: '03', title: 'Traçabilité', lead: 'Les décisions cessent d\'être implicites.', body: 'Historique complet des cartes. Évolution dans le temps. Qui a contribué quoi. Ce qui a changé entre deux lectures d\'une même situation.' },
        ].map((p, i, arr) => (
          <div key={p.n} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '20px', padding: '24px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-cormorant, serif)', paddingTop: '2px' }}>{p.n}</p>
            <div>
              <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#E8C84A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '7px' }}>{p.title}</p>
              <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '16px', fontStyle: 'italic', color: '#fff', lineHeight: 1.5, marginBottom: '8px' }}>{p.lead}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.52)', lineHeight: 1.8 }}>{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Souveraineté */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 36px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Souveraineté des données</p>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#fff', marginBottom: '8px' }}>Vos données restent en Europe. Vos analyses restent les vôtres.</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '22px', maxWidth: '540px' }}>
          Les organisations qui utilisent IAAA+ traitent des informations sensibles. Ce qu'elles analysent ne doit pas circuler au-delà de leur périmètre.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { t: 'Hébergement', b: 'Infrastructure OVH, France. Données exclusivement en Europe. Aucun transfert hors UE.' },
            { t: 'Chiffrement',  b: 'Données chiffrées en transit et au repos. Vos analyses ne sont lisibles par personne d\'autre.' },
            { t: 'Accès',       b: 'Droits configurables par rôle. Ce que voit chaque personne dans votre organisation est défini par vous.' },
          ].map(c => (
            <div key={c.t} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#E8C84A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{c.t}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.52)', lineHeight: 1.65 }}>{c.b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connectivité */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 36px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Connectivité</p>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#fff', marginBottom: '8px' }}>IAAA+ s'intègre là où votre information existe déjà.</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '22px', maxWidth: '560px' }}>
          Vous n'avez pas à changer vos outils ni vos flux. IAAA+ peut recevoir des situations depuis vos systèmes, générer des cartes automatiquement, et restituer les résultats là où vous en avez besoin.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { t: 'Entrée',        b: 'Vos systèmes envoient une situation à IAAA+. La carte est générée et disponible immédiatement.' },
            { t: 'Sortie',        b: 'Les cartes générées sont exportables et intégrables dans vos flux de travail existants.' },
            { t: 'Automatisation', b: 'IAAA+ peut surveiller des sources internes et déclencher une analyse dès qu\'une condition est remplie.' },
            { t: 'Intégration',   b: 'Les résultats apparaissent dans l\'outil que vos équipes utilisent déjà. Pas d\'interface supplémentaire.' },
          ].map(c => (
            <div key={c.t} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#E8C84A', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>{c.t}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{c.b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mise en place */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 36px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Mise en place</p>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '17px', fontStyle: 'italic', color: '#fff', marginBottom: '8px' }}>Chaque organisation est différente. On en parle.</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: '520px' }}>
          La configuration, la formation des équipes et l'intégration avec vos systèmes existants dépendent de votre contexte. Il n'y a pas de formule standard. Contactez-nous et nous définirons ensemble ce qui fait sens.
        </p>
      </div>

      {/* Pour qui */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 36px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Pour qui</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {['Grandes entreprises', 'Institutions publiques', 'Organisations multi-acteurs', 'Environnements critiques'].map(item => (
            <div key={item} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '11px 13px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{item}</div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '44px 36px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', background: 'rgba(232,200,74,0.2)', color: '#E8C84A', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px', marginBottom: '16px' }}>
          Sur devis
        </span>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '20px', color: '#fff', marginBottom: '9px' }}>Intéressé par IAAA+ pour votre organisation ?</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px', lineHeight: 1.7 }}>
          Nous travaillons avec un nombre limité d'organisations par secteur.<br />Décrivez votre situation — nous vous répondons sous quelques jours.
        </p>
        <a href="mailto:enterprise@situationcard.com" style={{ display: 'inline-block', background: '#E8C84A', color: '#1A2E5A', fontSize: '11px', fontFamily: 'var(--font-cinzel, serif)', letterSpacing: '0.12em', padding: '13px 28px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
          DEMANDER UNE DÉMO
        </a>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '13px', fontStyle: 'italic', color: 'rgba(255,255,255,0.25)' }}>Un même système. Trois niveaux de lecture.</p>
        <div style={{ display: 'flex', gap: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/clarity" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Clarity</Link>
          <Link href="/sis"     style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← SIS</Link>
        </div>
      </div>

    </main>
  )
}
