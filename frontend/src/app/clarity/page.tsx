/**
 * IAAA · /clarity
 * Page de présentation Clarity.
 */

import Link from 'next/link'

type Lang = 'FR' | 'EN'

const COPY = {
  FR: {
    home: 'Accueil',
    login: 'Se connecter',
    intro: 'Clarté est la porte d’entrée de Situation Card : transformer une question, une URL ou un document en carte lisible, partageable et traçable.',
    formula: 'Clarté sert à transformer une situation confuse en point d’appui lisible.',
    useCaseTitle: 'Cas d’usage',
    useCases: [
      {
        title: 'Comprendre une situation personnelle',
        body: 'Mettre à plat une tension, un choix, un conflit ou une décision intime sans remplacer le jugement personnel.',
        examples: ['Quitter ou non un poste', 'Tension familiale difficile', 'Décision importante qui tourne en rond'],
      },
      {
        title: 'Clarifier une situation professionnelle',
        body: 'Transformer une situation de travail confuse en carte lisible : acteurs, tensions, contraintes et vulnérabilité centrale.',
        examples: ['Conflit d’équipe', 'Décision de recrutement', 'Relation client difficile', 'Changement d’organisation'],
      },
      {
        title: 'Lire l’actualité autrement',
        body: 'Transformer un événement public en Situation Card pour comprendre les forces en présence, les trajectoires et le signal à surveiller.',
        examples: ['Crise géopolitique', 'Élection', 'Marché énergétique', 'Décision gouvernementale'],
      },
      {
        title: 'Analyser une URL ou un document',
        body: 'Coller un lien, une note, un article ou un document pour en extraire une lecture structurée.',
        examples: ['Article de presse', 'Rapport PDF', 'Note interne', 'Page web'],
      },
      {
        title: 'Préparer une discussion',
        body: 'Produire une carte courte avant un rendez-vous, une réunion ou une conversation sensible.',
        examples: ['Réunion avec un associé', 'Conversation difficile', 'Échange client', 'Préparation d’un pitch'],
      },
    ],
    line1: 'Clarté ne remplace pas votre jugement.',
    line2: 'Clarté met la situation en forme pour mieux penser.',
    benefits: [
      'Une Situation Card structurée',
      'Une lecture courte pour voir le système',
      'La vulnérabilité centrale',
      'Trois évolutions possibles',
      'Un signal concret à surveiller',
      'Des pistes d’approfondissement et de ressources',
    ],
    free: 'Commencez gratuitement. Aucune carte bancaire requise.',
    start: 'Lancez votre première Situation Card depuis l’interface de création.',
    cta: 'Créer une Situation Card',
    footer: 'Une question devient une carte. Une carte devient un point d’appui.',
    atlas: 'Explorer Atlas →',
    enterprise: 'IAAA+ →',
  },
  EN: {
    home: 'Home',
    login: 'Sign in',
    intro: 'Clarity is the entry point to Situation Card: turn a question, URL, or document into a readable, shareable, and traceable card.',
    formula: 'Clarity turns a confusing situation into a readable point of support.',
    useCaseTitle: 'Use cases',
    useCases: [
      {
        title: 'Understand a personal situation',
        body: 'Lay out a tension, choice, conflict, or intimate decision without replacing personal judgment.',
        examples: ['Leaving a job or not', 'Difficult family tension', 'Important decision going in circles'],
      },
      {
        title: 'Clarify a professional situation',
        body: 'Turn a confusing work situation into a readable card: actors, tensions, constraints, and central vulnerability.',
        examples: ['Team conflict', 'Hiring decision', 'Difficult client relationship', 'Organizational change'],
      },
      {
        title: 'Read public events differently',
        body: 'Turn a public event into a Situation Card to understand forces, trajectories, and the signal to watch.',
        examples: ['Geopolitical crisis', 'Election', 'Energy market', 'Government decision'],
      },
      {
        title: 'Analyze a URL or document',
        body: 'Paste a link, note, article, or document and extract a structured reading.',
        examples: ['Press article', 'PDF report', 'Internal note', 'Web page'],
      },
      {
        title: 'Prepare a discussion',
        body: 'Produce a short card before a meeting, appointment, or sensitive conversation.',
        examples: ['Meeting with a partner', 'Difficult conversation', 'Client exchange', 'Pitch preparation'],
      },
    ],
    line1: 'Clarity does not replace your judgment.',
    line2: 'Clarity gives the situation a form you can think with.',
    benefits: [
      'A structured Situation Card',
      'A short reading to see the system',
      'The central vulnerability',
      'Three possible trajectories',
      'One concrete signal to watch',
      'Deepening paths and resources',
    ],
    free: 'Start for free. No credit card required.',
    start: 'Launch your first Situation Card from the creation interface.',
    cta: 'Create a Situation Card',
    footer: 'A question becomes a card. A card becomes a point of support.',
    atlas: 'Explore Atlas →',
    enterprise: 'IAAA+ →',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function ClarityPage({
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
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#9A8860' }}>
          <Link href={`/${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.home}</Link>
          <Link href={`/enterprise${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>IAAA+</Link>
          <Link href="/login" style={{ color: '#1A2E5A', textDecoration: 'none', borderBottom: '1px solid #C8951A', paddingBottom: '1px' }}>{copy.login}</Link>
        </div>
      </nav>

      <section style={{ padding: '64px 36px 56px', maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 700, color: '#185FA5', letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1.08, marginBottom: '22px' }}>
          {lang === 'FR' ? 'Clarté' : 'Clarity'}
        </h1>
        <p style={{ fontSize: '15px', color: '#6F6255', lineHeight: 1.8, maxWidth: '620px', margin: '0 auto 34px' }}>
          {copy.intro}
        </p>

        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '22px', fontStyle: 'italic', color: '#C8951A', lineHeight: 1.45, maxWidth: 620, margin: '0 auto' }}>
          {copy.formula}
        </p>
      </section>

      <section style={{ background: '#fff', padding: '44px 36px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '36px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#1A2E5A', lineHeight: 1.55, marginBottom: '7px' }}>{copy.line1}</p>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#C8951A', lineHeight: 1.55 }}>{copy.line2}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {copy.benefits.map((item) => (
            <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#5A6A7A', lineHeight: 1.6 }}>
              <span style={{ color: '#C8951A', fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>◆</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '42px 36px', maxWidth: 980, margin: '0 auto' }}>
        <p style={{ fontSize: 10, color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18 }}>{copy.useCaseTitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
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

      <section style={{ background: '#F5F0E8', borderTop: '1px solid #E8E0D0', padding: '36px 36px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: '#EEF4FF', color: '#185FA5', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px', marginBottom: '14px' }}>
            Freemium
          </span>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '18px', fontStyle: 'italic', color: '#1A2E5A', marginBottom: '8px', lineHeight: 1.5 }}>
            {copy.free}
          </p>
          <p style={{ fontSize: '13px', color: '#9A8860', marginBottom: '20px', lineHeight: 1.7 }}>
            {copy.start}
          </p>
          <Link href={`/${suffix}`} style={{ display: 'inline-block', background: '#1A2E5A', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '11px 28px', borderRadius: '7px', textDecoration: 'none' }}>
            {copy.cta}
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #E8E0D0', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F0E8' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '14px', fontStyle: 'italic', color: '#9A8860' }}>{copy.footer}</p>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9A8860' }}>
          <Link href={`/library${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.atlas}</Link>
          <Link href={`/enterprise${suffix}`} style={{ color: '#9A8860', textDecoration: 'none' }}>{copy.enterprise}</Link>
        </div>
      </footer>

    </main>
  )
}
