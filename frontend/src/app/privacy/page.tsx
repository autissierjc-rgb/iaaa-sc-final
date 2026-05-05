/**
 * IAAA · /privacy
 * Confidentialité, mentions légales et cadre d’usage.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy — Situation Card',
}

type Lang = 'FR' | 'EN'

const SECTIONS = {
  FR: [
    {
      title: 'Responsable du traitement',
      content: `Situation Card est un service développé par IAAA+, société par actions simplifiée (SAS), SIREN : 920 042 439, située 14 rue Jean Perrin, 17000 La Rochelle, France.

Contact unique : contact@situationcard.com`,
    },
    {
      title: 'Données collectées',
      content: `Lorsque vous utilisez Situation Card, nous pouvons collecter les informations nécessaires au fonctionnement du service : adresse email, préférences de langue, situations soumises, cartes générées, statut public ou restreint des cartes, et données techniques minimales liées à l’usage du site.

Nous ne vendons pas vos données. Nous ne les utilisons pas pour de la publicité ciblée.`,
    },
    {
      title: 'Utilisation des données',
      content: `Vos données servent à fournir le service Situation Card, générer et afficher vos cartes, conserver vos préférences, améliorer la qualité du produit et assurer la sécurité de la plateforme.

Les situations que vous soumettez peuvent être traitées par des modèles d’intelligence artificielle pour produire les cartes. Elles ne doivent pas contenir d’informations sensibles que vous n’êtes pas autorisé à partager.`,
    },
    {
      title: 'Cartes publiques et restreintes',
      content: `Une carte publique peut être visible dans l’Atlas. Une carte restreinte n’a pas vocation à être affichée publiquement dans l’Atlas, même si elle peut être partagée selon les fonctionnalités disponibles.

Vous restez responsable des informations que vous choisissez de rendre publiques.`,
    },
    {
      title: 'Vos droits',
      content: `Conformément au RGPD et à la loi Informatique et Libertés, vous pouvez demander l’accès, la rectification, la suppression, la limitation, l’opposition ou la portabilité de vos données personnelles.

Pour exercer ces droits : contact@situationcard.com`,
    },
    {
      title: 'Cookies',
      content: `Le site utilise uniquement les cookies nécessaires au fonctionnement du service, notamment pour la session, la sécurité et les préférences de langue. Aucun cookie publicitaire tiers n’est utilisé.`,
    },
    {
      title: 'Mentions légales',
      content: `Éditeur du site : IAAA+, société par actions simplifiée (SAS), SIREN : 920 042 439.
Siège social : 14 rue Jean Perrin, 17000 La Rochelle, France.
Directeur de la publication : JCA.

Sites édités : situationcard.com et situationcard.fr.

Hébergement : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France, www.ovh.com.

Contact : contact@situationcard.com`,
    },
    {
      title: 'Propriété intellectuelle',
      content: `L’ensemble des contenus présents sur situationcard.com, notamment les textes, graphismes, logiciels, bases de données et marques, est la propriété exclusive de IAAA+ ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans l’autorisation préalable écrite de IAAA+, sauf disposition contraire expressément indiquée.

Les Situation Cards publiées dans l’Atlas public sont mises à disposition sous licence Creative Commons Attribution 4.0 International (CC BY 4.0). Elles peuvent être partagées et adaptées à condition d’en mentionner la source.`,
    },
    {
      title: 'Intelligence artificielle',
      content: `Les Situation Cards sont générées par un système d’intelligence artificielle. Elles constituent une aide à la réflexion structurée et ne sauraient être considérées comme des conseils juridiques, financiers, médicaux ou professionnels.

La décision reste toujours celle de l’utilisateur.`,
    },
    {
      title: 'Droit applicable',
      content: `Le présent site et ses contenus sont soumis au droit français. Tout litige relatif à l’utilisation du site relève de la compétence exclusive des tribunaux français.`,
    },
  ],
  EN: [
    {
      title: 'Data Controller',
      content: `Situation Card is a service developed by IAAA+, a French simplified joint-stock company (SAS), SIREN 920 042 439, located at 14 rue Jean Perrin, 17000 La Rochelle, France.

Single contact address: contact@situationcard.com`,
    },
    {
      title: 'Data Collected',
      content: `When you use Situation Card, we may collect the information needed to operate the service: email address, language preferences, submitted situations, generated cards, public or restricted card status, and minimal technical usage data.

We do not sell your data. We do not use it for targeted advertising.`,
    },
    {
      title: 'Use of Data',
      content: `Your data is used to provide the Situation Card service, generate and display your cards, store your preferences, improve product quality, and ensure platform security.

Situations you submit may be processed by artificial intelligence models to produce cards. They must not contain sensitive information you are not authorized to share.`,
    },
    {
      title: 'Public and Restricted Cards',
      content: `A public card may be visible in the Atlas. A restricted card is not intended to be displayed publicly in the Atlas, although it may be shared according to available features.

You remain responsible for the information you choose to make public.`,
    },
    {
      title: 'Your Rights',
      content: `Under GDPR and French data protection law, you may request access, rectification, deletion, restriction, objection, or portability of your personal data.

To exercise these rights: contact@situationcard.com`,
    },
    {
      title: 'Cookies',
      content: `The site uses only cookies necessary for the service to function, including session, security, and language preference cookies. No third-party advertising cookies are used.`,
    },
    {
      title: 'Legal Notice',
      content: `Site publisher: IAAA+, French SAS, SIREN 920 042 439.
Registered office: 14 rue Jean Perrin, 17000 La Rochelle, France.
Publication director: JCA.

Published sites: situationcard.com and situationcard.fr.

Hosting: OVH SAS, 2 rue Kellermann, 59100 Roubaix, France, www.ovh.com.

Contact: contact@situationcard.com`,
    },
    {
      title: 'Intellectual Property',
      content: `All content on situationcard.com, including texts, graphics, software, databases, and trademarks, is the exclusive property of IAAA+ or its partners and is protected by French and international intellectual property laws.

Any reproduction, representation, modification, publication, or adaptation of all or part of the site elements is prohibited without prior written authorization from IAAA+, unless expressly stated otherwise.

Situation Cards published in the public Atlas are made available under the Creative Commons Attribution 4.0 International license (CC BY 4.0). They may be shared and adapted provided the source is credited.`,
    },
    {
      title: 'Artificial Intelligence',
      content: `Situation Cards are generated by an artificial intelligence system. They are an aid to structured reflection and should not be considered legal, financial, medical, or professional advice.

The decision always remains with the user.`,
    },
    {
      title: 'Applicable Law',
      content: `This site and its contents are governed by French law. Any dispute relating to the use of the site falls under the exclusive jurisdiction of French courts.`,
    },
  ],
} as const

const COPY = {
  FR: {
    back: '← Retour',
    eyebrow: 'Confidentialité · Mentions légales',
    title: 'Confidentialité',
    updated: 'Dernière mise à jour : 28 mars 2026',
  },
  EN: {
    back: '← Back',
    eyebrow: 'Privacy · Legal Notice',
    title: 'Privacy',
    updated: 'Last updated: March 28, 2026',
  },
} as const

function readLang(value: string | string[] | undefined): Lang {
  return value === 'en' ? 'EN' : 'FR'
}

export default function PrivacyPage({
  searchParams,
}: {
  searchParams?: { lang?: string | string[] }
}) {
  const lang = readLang(searchParams?.lang)
  const copy = COPY[lang]
  const suffix = `?lang=${lang.toLowerCase()}`

  return (
    <main style={{
      background: '#F5F0E8',
      minHeight: '100vh',
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      color: '#1A2E5A',
    }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${suffix}`} style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '13px', color: '#1A2E5A', textDecoration: 'none', letterSpacing: '0.1em' }}>
          SITUATION CARD
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/privacy?lang=fr" style={{ fontSize: '12px', color: lang === 'FR' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'FR' ? 600 : 400 }}>FR</Link>
          <Link href="/privacy?lang=en" style={{ fontSize: '12px', color: lang === 'EN' ? '#1A2E5A' : '#9A8860', textDecoration: 'none', fontWeight: lang === 'EN' ? 600 : 400 }}>EN</Link>
          <Link href={`/${suffix}`} style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>{copy.back}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 28px' }}>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          {copy.eyebrow}
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '40px' }}>
          {copy.title}
        </h1>

        {SECTIONS[lang].map((section) => (
          <div key={section.title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#1A2E5A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {section.title}
            </h2>
            <div style={{ fontSize: '14px', color: '#5A6A7A', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {section.content}
            </div>
            <div style={{ height: '1px', background: '#E8E0D0', marginTop: '24px' }} />
          </div>
        ))}

        <p style={{ fontSize: '11px', color: '#B8AD9A', marginTop: '24px' }}>
          {copy.updated}
        </p>
      </div>
    </main>
  )
}
