/**
 * IAAA · /enterprise
 * Page IAAA+.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'IAAA+ — Situation Card pour organisations',
  description: 'Rendre les décisions lisibles, traçables et partageables. Infrastructure de lecture pour systèmes complexes.',
}

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    title: 'Rendre les décisions lisibles, traçables et partageables.',
    intro: 'IAAA+ est une infrastructure de lecture des systèmes complexes. Elle structure ce qui est vu, compris et engagé.',
    pillars: [
      { n: '01', title: 'Gouvernance', lead: 'Qui voit quoi. Qui interprète. Qui valide. Qui engage.', body: 'Chaque décision devient lisible. Chaque responsabilité devient explicite. Les systèmes complexes ne tombent pas en panne par manque d’information ; ils tombent en panne par manque de lecture partagée.' },
      { n: '02', title: 'Mode collaboratif', lead: 'Une situation n’est jamais lue par une seule personne.', body: 'Lectures multi-acteurs sur une même Situation Card. Chaque contributeur apporte sa propre lecture. Le résultat n’est pas un consensus forcé : c’est une compréhension partagée, ou des désaccords clairement identifiés.' },
      { n: '03', title: 'Traçabilité', lead: 'Les décisions cessent d’être implicites.', body: 'Historique complet des cartes. Évolution dans le temps. Qui a contribué quoi. Ce qui a changé entre deux lectures d’une même situation.' },
    ],
    dataTitle: 'Souveraineté des données',
    dataLead: 'Vos données restent en Europe. Vos analyses restent les vôtres.',
    dataBody: 'Les organisations qui utilisent IAAA+ traitent des informations sensibles. Ce qu’elles analysent ne doit pas circuler au-delà de leur périmètre.',
    dataCards: [
      { t: 'Hébergement', b: 'Infrastructure OVH, France. Données exclusivement en Europe. Aucun transfert hors UE.' },
      { t: 'Chiffrement', b: 'Données chiffrées en transit et au repos. Vos analyses ne sont lisibles par personne d’autre.' },
      { t: 'Accès', b: 'Droits configurables par rôle. Ce que voit chaque personne dans votre organisation est défini par vous.' },
    ],
    ren: 'Le Resonance Engine Navigator (REN) est une technologie développée par IAAA+. REN agit comme une couche de navigation cognitive qui vient compléter les grands modèles d’IA (OpenAI, Claude, Mistral…), en se concentrant sur trois choses : cohérence, structure et qualité du raisonnement.',
    forWho: 'Pour qui',
    audiences: ['Grandes entreprises', 'Institutions publiques', 'Organisations multi-acteurs', 'Environnements critiques'],
    footer: 'Un même système. Trois niveaux de lecture.',
  },
  EN: {
    title: 'Making decisions readable, traceable, and shareable.',
    intro: 'IAAA+ is a reading infrastructure for complex systems. It structures what is seen, understood, and committed.',
    pillars: [
      { n: '01', title: 'Governance', lead: 'Who sees what. Who interprets. Who validates. Who commits.', body: 'Every decision becomes readable. Every responsibility becomes explicit. Complex systems do not fail only because they lack information; they fail because they lack shared reading.' },
      { n: '02', title: 'Collaborative Mode', lead: 'A situation is never read by one person alone.', body: 'Multi-actor readings on the same Situation Card. Each contributor brings their own reading. The result is not forced consensus: it is shared understanding, or clearly identified disagreement.' },
      { n: '03', title: 'Traceability', lead: 'Decisions stop being implicit.', body: 'Complete card history. Evolution over time. Who contributed what. What changed between two readings of the same situation.' },
    ],
    dataTitle: 'Data Sovereignty',
    dataLead: 'Your data stays in Europe. Your analyses remain yours.',
    dataBody: 'Organizations using IAAA+ handle sensitive information. What they analyze must not circulate outside their perimeter.',
    dataCards: [
      { t: 'Hosting', b: 'OVH infrastructure, France. Data exclusively in Europe. No transfer outside the EU.' },
      { t: 'Encryption', b: 'Data encrypted in transit and at rest. Your analyses are not readable by anyone else.' },
      { t: 'Access', b: 'Role-based permissions. What each person in your organization can see is defined by you.' },
    ],
    ren: 'The Resonance Engine Navigator (REN) is a technology developed by IAAA+. REN acts as a cognitive navigation layer that complements large AI models (OpenAI, Claude, Mistral...) by focusing on three things: coherence, structure, and reasoning quality.',
    forWho: 'For whom',
    audiences: ['Large companies', 'Public institutions', 'Multi-stakeholder organizations', 'Critical environments'],
    footer: 'One system. Three levels of reading.',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function EnterprisePage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = readLang(searchParams?.lang)
  const copy = COPY[lang]
  const suffix = `?lang=${lang.toLowerCase()}`

  return (
    <main style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', color: '#1A2E5A' }}>

      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '13px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={`/sis${suffix}`} style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.12em' }}>SITUATION CARD</Link>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
          <Link href={`/clarity${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>Clarity</Link>
          <Link href={`/sis-system${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>SIS</Link>
          <a href="https://iaaa.fr/agence.html" target="_blank" rel="noreferrer" style={{ color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>IAAA+ WEBSITE</a>
        </div>
      </nav>

      <section style={{ padding: '64px 36px 48px', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 700, color: '#1A2E5A', letterSpacing: '0.14em', lineHeight: 1.08, marginBottom: 20 }}>
          IAAA+
        </h1>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontStyle: 'italic', color: '#C8951A', lineHeight: 1.28, marginBottom: 18 }}>
          {copy.title}
        </p>
        <p style={{ fontSize: 14, color: '#6F6255', lineHeight: 1.8, maxWidth: 640, margin: '0 auto' }}>
          {copy.intro}
        </p>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #E8E0D0', borderBottom: '1px solid #E8E0D0', padding: '12px 36px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {copy.pillars.map((p, i) => (
            <div key={p.n} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 20, padding: '24px 0', borderBottom: i < copy.pillars.length - 1 ? '1px solid #F0EBE0' : 'none' }}>
              <p style={{ fontSize: 11, color: '#C8951A', fontFamily: 'var(--font-cormorant, serif)', paddingTop: 2 }}>{p.n}</p>
              <div>
                <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 11, color: '#1A2E5A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>{p.title}</p>
                <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 17, fontStyle: 'italic', color: '#1A2E5A', lineHeight: 1.5, marginBottom: 8 }}>{p.lead}</p>
                <p style={{ fontSize: 13, color: '#6F6255', lineHeight: 1.8 }}>{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '42px 36px', maxWidth: 980, margin: '0 auto' }}>
        <p style={{ fontSize: 10, color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{copy.dataTitle}</p>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 18, fontStyle: 'italic', color: '#1A2E5A', marginBottom: 8 }}>{copy.dataLead}</p>
        <p style={{ fontSize: 13, color: '#6F6255', lineHeight: 1.8, marginBottom: 22, maxWidth: 620 }}>
          {copy.dataBody}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {copy.dataCards.map(c => (
            <div key={c.t} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 16, boxShadow: '0 10px 24px rgba(26,46,90,0.05)' }}>
              <p style={{ fontSize: 11, color: '#C8951A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{c.t}</p>
              <p style={{ fontSize: 12, color: '#6F6255', lineHeight: 1.65 }}>{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #E8E0D0', borderBottom: '1px solid #E8E0D0', padding: '42px 36px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <p style={{ fontSize: 10, color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Resonance Engine Navigator</p>
          <p style={{ fontSize: 13, color: '#6F6255', lineHeight: 1.8, maxWidth: 720, marginBottom: 24 }}>
            {copy.ren}
          </p>
          <a href="https://iaaa.fr/agence.html" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#E8C84A', color: '#1A2E5A', fontSize: 11, fontFamily: 'var(--font-cinzel, serif)', letterSpacing: '0.12em', padding: '13px 28px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
            IAAA+ WEBSITE
          </a>
        </div>
      </section>

      <section style={{ padding: '34px 36px', maxWidth: 980, margin: '0 auto' }}>
        <p style={{ fontSize: 10, color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>{copy.forWho}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {copy.audiences.map(item => (
            <div key={item} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 6, padding: '12px 14px', fontSize: 12, color: '#6F6255' }}>{item}</div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #E8E0D0', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F0E8' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 14, fontStyle: 'italic', color: '#9A8860' }}>{copy.footer}</p>
        <div style={{ display: 'flex', gap: 18, fontSize: 12 }}>
          <Link href={`/clarity${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>← Clarity</Link>
          <Link href={`/sis-system${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>← SIS</Link>
        </div>
      </footer>

    </main>
  )
}
