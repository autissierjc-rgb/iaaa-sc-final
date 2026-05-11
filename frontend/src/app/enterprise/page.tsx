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
    title: 'Déployer Situation Card dans une équipe, une institution ou un système IA.',
    intro: 'IAAA+ transforme Situation Card en couche de contexte décisionnel : cartes, veille, rapports, données, traces de décision et intelligence collective.',
    secondIntro: 'Elle permet à plusieurs acteurs — humains, équipes, agents IA ou systèmes métier — de travailler à partir d’une même représentation structurée d’une situation.',
    pillars: [
      { n: '01', title: 'Lecture partagée', lead: 'Une même situation devient lisible par plusieurs acteurs.', body: 'IAAA+ aide une équipe à identifier les forces, tensions, vulnérabilités, incertitudes et angles morts d’une situation complexe. Le but n’est pas de forcer un consensus, mais de rendre visibles les accords, les désaccords et les points critiques.' },
      { n: '02', title: 'Veille, rapports et données', lead: 'Les cartes deviennent une mémoire structurée.', body: 'Les Situation Cards peuvent alimenter des notes, dossiers, rapports, revues de risques, veilles stratégiques, données métier et suivis de décision. Chaque carte peut être conservée, comparée, enrichie ou reprise dans le temps.' },
      { n: '03', title: 'Gouvernance', lead: 'Qui voit quoi. Qui interprète. Qui valide. Qui engage.', body: 'Chaque décision devient plus lisible. Chaque responsabilité devient plus explicite. Les systèmes complexes ne tombent pas seulement par manque d’information. Ils tombent souvent par manque de lecture partagée.' },
      { n: '04', title: 'Decision context layer', lead: 'La Situation Card n’est pas la décision.', body: 'Elle fournit un contexte structuré pour aider des humains, des équipes, des agents IA ou des systèmes métier à raisonner sur une situation. Faits, tensions, vulnérabilités, trajectoires, incertitudes et signaux deviennent exploitables dans un cadre commun.' },
      { n: '05', title: 'Systèmes et langages', lead: 'Traiter les informations, documents et langages techniques.', body: 'IAAA+ peut s’adapter à des environnements métier complexes : données, documents, code, protocoles, conformité, workflows, robotique, systèmes industriels et agents spécialisés. L’entrée peut venir de fichiers, d’API, de données structurées, de logs ou de systèmes techniques.' },
    ],
    accountability: 'SC peut alimenter des systèmes IA d’aide à la décision sans transférer la responsabilité de la décision à l’IA.',
    useCaseTitle: 'Cas d’usage',
    useCases: [
      { title: 'Équipe dirigeante / comité stratégique', body: 'Créer une lecture commune avant une décision importante.', examples: ['lancement produit', 'pivot stratégique', 'crise réputationnelle', 'choix d’investissement', 'conflit entre directions'] },
      { title: 'Veille stratégique', body: 'Transformer des signaux faibles, articles, rapports et données en cartes comparables dans le temps.', examples: ['veille géopolitique', 'veille marché', 'veille réglementaire', 'veille concurrentielle', 'veille risques'] },
      { title: 'Gestion de crise', body: 'Structurer rapidement une situation instable : forces, tensions, vulnérabilité principale, trajectoires, signal à surveiller.', examples: ['cyberattaque', 'incident industriel', 'rupture fournisseur', 'crise RH', 'crise médiatique'] },
      { title: 'Gouvernance et responsabilité', body: 'Tracer qui a vu quoi, qui a interprété quoi, qui a validé quoi, et sur quelle base.', examples: ['décision sensible', 'arbitrage réglementaire', 'dossier institutionnel', 'comité des risques', 'gouvernance IA'] },
      { title: 'Systèmes IA et agents métier', body: 'Fournir à d’autres IA un contexte structuré avant recommandation, simulation ou action.', examples: ['agent conformité', 'agent veille', 'agent juridique', 'agent supply chain', 'agent crise', 'agent financier'] },
      { title: 'Données, documents et langages techniques', body: 'Transformer des entrées non humaines en Situation Cards : JSON, logs, rapports, tickets, API, protocoles.', examples: ['logs cybersécurité', 'incidents IT', 'tickets Jira', 'tableaux de risques', 'données supply chain', 'rapports industriels'] },
    ],
    formula: 'IAAA+ sert à transformer des situations complexes en contexte décisionnel partagé, traçable et exploitable par des humains, des équipes ou des systèmes IA.',
    dataTitle: 'Souveraineté des données',
    dataLead: 'Vos données restent en Europe. Vos analyses restent les vôtres.',
    dataBody: 'Les organisations qui utilisent IAAA+ traitent des informations sensibles. Ce qu’elles analysent ne doit pas circuler au-delà de leur périmètre.',
    dataCards: [
      { t: 'Hébergement', b: 'Infrastructure OVH, France. Données exclusivement en Europe. Aucun transfert hors UE.' },
      { t: 'Chiffrement', b: 'Données chiffrées en transit et au repos. Vos analyses ne sont lisibles par personne d’autre.' },
      { t: 'Accès', b: 'Droits configurables par rôle. Ce que voit chaque personne dans votre organisation est défini par vous.' },
    ],
    ren: 'Le Resonance Engine Navigator — REN — est une technologie développée par IAAA+. REN agit comme une couche de navigation cognitive qui complète les grands modèles d’IA — OpenAI, Claude, Mistral ou modèles internes — en se concentrant sur trois dimensions : cohérence, structure et qualité du raisonnement.',
    forWho: 'Pour qui',
    audiences: ['Grandes entreprises', 'Institutions publiques', 'Organisations multi-acteurs', 'Environnements critiques'],
    footer: 'Structurer le contexte. Rendre la décision lisible.',
  },
  EN: {
    title: 'Deploy Situation Card inside a team, institution, or AI system.',
    intro: 'IAAA+ turns Situation Card into a decision context layer: cards, watch, reports, data, decision traces, and collective intelligence.',
    secondIntro: 'It allows several actors — humans, teams, AI agents, or business systems — to work from the same structured representation of a situation.',
    pillars: [
      { n: '01', title: 'Shared Reading', lead: 'The same situation becomes readable by several actors.', body: 'IAAA+ helps a team identify forces, tensions, vulnerabilities, uncertainties, and blind spots in a complex situation. The goal is not forced consensus, but making agreements, disagreements, and critical points visible.' },
      { n: '02', title: 'Watch, Reports, and Data', lead: 'Cards become structured memory.', body: 'Situation Cards can feed notes, dossiers, reports, risk reviews, strategic watch, business data, and decision follow-up. Each card can be saved, compared, enriched, or resumed over time.' },
      { n: '03', title: 'Governance', lead: 'Who sees what. Who interprets. Who validates. Who commits.', body: 'Every decision becomes more readable. Every responsibility becomes more explicit. Complex systems do not only fail because they lack information. They often fail because they lack shared reading.' },
      { n: '04', title: 'Decision Context Layer', lead: 'The Situation Card is not the decision.', body: 'It provides structured context to help humans, teams, AI agents, or business systems reason about a situation. Facts, tensions, vulnerabilities, trajectories, uncertainties, and signals become usable within a shared frame.' },
      { n: '05', title: 'Systems and Languages', lead: 'Process information, documents, and technical languages.', body: 'IAAA+ can adapt to complex business environments: data, documents, code, protocols, compliance, workflows, robotics, industrial systems, and specialized agents. Inputs can come from files, APIs, structured data, logs, or technical systems.' },
    ],
    accountability: 'SC can feed decision-support AI systems without transferring accountability to the AI.',
    useCaseTitle: 'Use cases',
    useCases: [
      { title: 'Executive team / strategic committee', body: 'Create a shared reading before an important decision.', examples: ['product launch', 'strategic pivot', 'reputation crisis', 'investment choice', 'conflict between departments'] },
      { title: 'Strategic watch', body: 'Turn weak signals, articles, reports, and data into cards that can be compared over time.', examples: ['geopolitical watch', 'market watch', 'regulatory watch', 'competitive watch', 'risk watch'] },
      { title: 'Crisis management', body: 'Quickly structure an unstable situation: forces, tensions, main vulnerability, trajectories, signal to watch.', examples: ['cyberattack', 'industrial incident', 'supplier disruption', 'HR crisis', 'media crisis'] },
      { title: 'Governance and accountability', body: 'Trace who saw what, who interpreted what, who validated what, and on what basis.', examples: ['sensitive decision', 'regulatory arbitration', 'institutional dossier', 'risk committee', 'AI governance'] },
      { title: 'AI systems and business agents', body: 'Give other AI systems structured context before recommendation, simulation, or action.', examples: ['compliance agent', 'watch agent', 'legal agent', 'supply chain agent', 'crisis agent', 'financial agent'] },
      { title: 'Data, documents, and technical languages', body: 'Turn non-human inputs into Situation Cards: JSON, logs, reports, tickets, APIs, protocols.', examples: ['cybersecurity logs', 'IT incidents', 'Jira tickets', 'risk tables', 'supply chain data', 'industrial reports'] },
    ],
    formula: 'IAAA+ turns complex situations into shared, traceable decision context usable by humans, teams, or AI systems.',
    dataTitle: 'Data Sovereignty',
    dataLead: 'Your data stays in Europe. Your analyses remain yours.',
    dataBody: 'Organizations using IAAA+ handle sensitive information. What they analyze must not circulate outside their perimeter.',
    dataCards: [
      { t: 'Hosting', b: 'OVH infrastructure, France. Data exclusively in Europe. No transfer outside the EU.' },
      { t: 'Encryption', b: 'Data encrypted in transit and at rest. Your analyses are not readable by anyone else.' },
      { t: 'Access', b: 'Role-based permissions. What each person in your organization can see is defined by you.' },
    ],
    ren: 'The Resonance Engine Navigator — REN — is a technology developed by IAAA+. REN acts as a cognitive navigation layer that complements large AI models — OpenAI, Claude, Mistral, or internal models — by focusing on three dimensions: coherence, structure, and reasoning quality.',
    forWho: 'For whom',
    audiences: ['Large companies', 'Public institutions', 'Multi-stakeholder organizations', 'Critical environments'],
    footer: 'Structure the context. Make decision-making readable.',
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
        <Link href={`/${suffix}`} style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '11px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.12em' }}>SITUATION CARD</Link>
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
        <p style={{ fontSize: 13, color: '#6F6255', lineHeight: 1.75, maxWidth: 720, margin: '16px auto 0' }}>
          {copy.secondIntro}
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
                {p.n === '04' && (
                  <p style={{ marginTop: 12, fontSize: 13, color: '#1A2E5A', lineHeight: 1.7, fontWeight: 600 }}>
                    {copy.accountability}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '42px 36px', maxWidth: 980, margin: '0 auto' }}>
        <p style={{ fontSize: 10, color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18 }}>{copy.useCaseTitle}</p>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 20, color: '#C8951A', fontStyle: 'italic', lineHeight: 1.5, maxWidth: 760, marginBottom: 22 }}>
          {copy.formula}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {copy.useCases.map((item) => (
            <div key={item.title} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 16, boxShadow: '0 10px 24px rgba(26,46,90,0.05)' }}>
              <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 11, color: '#1A2E5A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: '#6F6255', lineHeight: 1.65, marginBottom: 10 }}>{item.body}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {item.examples.map((example) => (
                  <span key={example} style={{ fontSize: 11, color: '#9A8860', lineHeight: 1.4 }}>- {example}</span>
                ))}
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
