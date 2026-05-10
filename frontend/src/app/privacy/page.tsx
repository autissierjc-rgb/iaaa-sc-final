/**
 * IAAA · /privacy
 * Information & Privacy Policy for Situation Card.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Information & Privacy Policy — Situation Card',
}

type Lang = 'FR' | 'EN'

type PolicySection = {
  title: string
  content: string
}

const SECTIONS: Record<Lang, PolicySection[]> = {
  FR: [
    {
      title: 'Responsable du traitement',
      content: `Situation Card est un service developpe par IAAA+, societe par actions simplifiee (SAS), SIREN : 920 042 439, situee 14 rue Jean Perrin, 17000 La Rochelle, France.

Contact unique : contact@situationcard.com`,
    },
    {
      title: 'Principe general',
      content: `Situation Card traite les informations strictement necessaires pour comprendre une situation, generer une carte, fournir des ressources, permettre le partage choisi par l'utilisateur et proteger le service.

Par defaut, les generations sont mesurees par metadonnees techniques. Le contenu complet d'une carte n'est conserve que lorsqu'un mode de snapshot l'autorise.`,
    },
    {
      title: 'Informations traitees',
      content: `Selon l'usage du service, nous pouvons traiter : adresse email, langue, question soumise, documents ou URL fournis, cartes generees, ressources publiques consultees, statut public ou restreint des cartes, traces techniques de generation, latence, erreurs, statut qualite et reactions utilisateur rattachees a des couches produit.

Nous ne vendons pas vos donnees. Nous ne les utilisons pas pour de la publicite ciblee.`,
    },
    {
      title: 'Generations et metadonnees',
      content: `Chaque generation peut produire un evenement technique : date, langue, domaine, intention, statut ressources, statut qualite, latence, erreurs eventuelles, taille ou hash de l'input.

Ce mode permet de mesurer l'activite et la qualite sans exposer le texte brut par defaut dans le cockpit admin.`,
    },
    {
      title: 'Snapshots de carte',
      content: `Une carte partagee ou exportee peut etre conservee sous forme de snapshot stable. Un snapshot contient la carte validee, sa langue, sa version, sa provenance, ses sources publiques utiles et son statut de confidentialite.

Une carte partagee existe dans une langue de snapshot. Changer de langue signifie lire ou creer un snapshot dans cette langue. Le PDF exporte la langue du snapshot. Le bouton Partager ne relance pas la generation.`,
    },
    {
      title: 'Cartes publiques, restreintes et privees',
      content: `Une carte publique peut etre accessible par lien ou dans des espaces publics prevus par le service. Une carte restreinte n'a pas vocation a etre affichee publiquement dans l'Atlas. Une carte privee ou sensible ne doit pas etre transformee en ressource publique.

Vous restez responsable des informations que vous choisissez de rendre publiques ou de partager.`,
    },
    {
      title: 'Ressources, URL et Recherche+',
      content: `Lorsque vous fournissez une URL ou lorsqu'un domaine depend de faits externes, Situation Card peut interroger des sources publiques ou des services de recherche cote serveur. Les cles API ne sont jamais exposees au client.

Recherche+ est separee de la carte rapide : elle cherche des pistes, signaux faibles, contradictions et preuves possibles. Ses resultats ne deviennent pas automatiquement des conclusions.`,
    },
    {
      title: 'Modeles d intelligence artificielle',
      content: `Les informations soumises peuvent etre traitees par des modeles d'intelligence artificielle afin de produire l'interpretation, la Situation Card, Lecture, Approfondir, les ressources ou les traductions de snapshot.

Le referent d'interpretation peut etre ChatGPT / GPT aujourd'hui ou un autre LLM demain. Les traductions peuvent etre confiees a un modele specialise. Les fournisseurs ne doivent pas recevoir plus d'information que necessaire au service demande.`,
    },
    {
      title: 'Domaines sensibles',
      content: `Les sujets medicaux, juridiques, financiers, administratifs, sociaux, relatifs aux mineurs ou a la securite sont traites avec prudence.

Situation Card fournit une analyse structuree. Elle ne remplace pas un avocat, medecin, conseiller financier, autorite publique ou professionnel qualifie. En cas d'urgence ou de danger, il faut contacter les services competents.`,
    },
    {
      title: 'Securite et anti-abus',
      content: `Les secrets et cles API sont utilises cote serveur. Les consultations de cartes partagees doivent lire des snapshots cacheables et ne doivent pas relancer les modeles IA.

Le service peut limiter, ralentir ou bloquer des usages abusifs : spam, surcharge, attaques, tentatives d'extraction de prompts, volume anormal, cout excessif ou requetes mettant en danger la disponibilite du service.`,
    },
    {
      title: 'Cockpit admin et veille CTO',
      content: `Le cockpit admin sert a piloter la qualite, la latence, les erreurs, les sources manquantes, les seuils de cout et les alertes techniques. Il doit privilegier les metadonnees et eviter l'exposition du contenu brut.

La veille CTO peut alerter si un seuil critique est atteint : latence p95, taux d'erreur, fallback, provider errors, sources obligatoires absentes, cout horaire estime ou cache hit insuffisant.`,
    },
    {
      title: 'Conservation et suppression',
      content: `Les metadonnees techniques peuvent etre conservees pour la mesure du service. Les snapshots peuvent etre conserves selon leur statut : public, restreint, prive, apprentissage lancement ou suppression.

Vous pouvez demander l'acces, la rectification, la limitation ou la suppression de vos donnees personnelles : contact@situationcard.com`,
    },
    {
      title: 'Cookies',
      content: `Le site utilise les cookies necessaires au fonctionnement du service : session, securite, preferences de langue et mesure technique. Aucun cookie publicitaire tiers n'est utilise.`,
    },
    {
      title: 'Mentions legales',
      content: `Editeur du site : IAAA+, societe par actions simplifiee (SAS), SIREN : 920 042 439.
Siege social : 14 rue Jean Perrin, 17000 La Rochelle, France.
Directeur de la publication : JCA.

Sites edites : situationcard.com et situationcard.fr.
Hebergement : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France, www.ovh.com.
Contact : contact@situationcard.com`,
    },
    {
      title: 'Droit applicable',
      content: `Le present site et ses contenus sont soumis au droit francais. Tout litige relatif a l'utilisation du site releve de la competence des juridictions francaises competentes.`,
    },
  ],
  EN: [
    {
      title: 'Data controller',
      content: `Situation Card is a service developed by IAAA+, a French simplified joint-stock company (SAS), SIREN 920 042 439, located at 14 rue Jean Perrin, 17000 La Rochelle, France.

Single contact address: contact@situationcard.com`,
    },
    {
      title: 'General principle',
      content: `Situation Card processes the information strictly needed to understand a situation, generate a card, provide resources, enable user-selected sharing, and protect the service.

By default, generations are measured through technical metadata. Full card content is stored only when a snapshot mode allows it.`,
    },
    {
      title: 'Information processed',
      content: `Depending on your use of the service, we may process: email address, language, submitted question, provided documents or URLs, generated cards, public sources consulted, public or restricted card status, generation traces, latency, errors, quality status, and user reactions attached to product layers.

We do not sell your data. We do not use it for targeted advertising.`,
    },
    {
      title: 'Generations and metadata',
      content: `Each generation may produce a technical event: date, language, domain, intent, resource status, quality status, latency, possible errors, and input size or hash.

This allows activity and quality to be measured without exposing raw text by default in the admin cockpit.`,
    },
    {
      title: 'Card snapshots',
      content: `A shared or exported card may be stored as a stable snapshot. A snapshot contains the validated card, its language, version, provenance, useful public sources, and privacy status.

A shared card exists in one snapshot language. Changing language means reading or creating a snapshot in that language. The PDF exports the snapshot language. The Share button never regenerates the card.`,
    },
    {
      title: 'Public, restricted and private cards',
      content: `A public card may be accessible by link or in public areas provided by the service. A restricted card is not intended to be publicly displayed in the Atlas. A private or sensitive card must not be turned into a public resource.

You remain responsible for the information you choose to make public or share.`,
    },
    {
      title: 'Resources, URLs and Recherche+',
      content: `When you provide a URL, or when a domain depends on external facts, Situation Card may query public sources or server-side search services. API keys are never exposed to the client.

Recherche+ is separate from the fast card: it looks for leads, weak signals, contradictions and possible evidence. Its results do not automatically become conclusions.`,
    },
    {
      title: 'Artificial intelligence models',
      content: `Submitted information may be processed by artificial intelligence models to produce interpretation, Situation Card, Lecture, Approfondir, resources, or snapshot translations.

The interpretation reference may be ChatGPT / GPT today or another LLM tomorrow. Translations may use a specialized model. Providers should not receive more information than needed for the requested service.`,
    },
    {
      title: 'Sensitive domains',
      content: `Medical, legal, financial, administrative, social, minor-related or safety-related topics are handled with caution.

Situation Card provides structured analysis. It does not replace a lawyer, doctor, financial adviser, public authority or qualified professional. In an emergency or danger, contact the appropriate services.`,
    },
    {
      title: 'Security and anti-abuse',
      content: `Secrets and API keys are used server-side. Shared card reads should use cacheable snapshots and must not trigger AI models again.

The service may limit, slow down or block abusive use: spam, overload, attacks, prompt extraction attempts, abnormal volume, excessive cost, or requests threatening service availability.`,
    },
    {
      title: 'Admin cockpit and CTO Watch',
      content: `The admin cockpit is used to monitor quality, latency, errors, missing sources, cost thresholds, and technical alerts. It should prefer metadata and avoid exposing raw content.

CTO Watch may alert when a critical threshold is reached: p95 latency, error rate, fallback rate, provider errors, missing required sources, estimated hourly cost, or insufficient cache hit rate.`,
    },
    {
      title: 'Retention and deletion',
      content: `Technical metadata may be retained for service measurement. Snapshots may be retained according to their status: public, restricted, private, launch learning, or deletion.

You may request access, rectification, restriction or deletion of your personal data: contact@situationcard.com`,
    },
    {
      title: 'Cookies',
      content: `The site uses cookies required for the service to function: session, security, language preferences and technical measurement. No third-party advertising cookies are used.`,
    },
    {
      title: 'Legal notice',
      content: `Site publisher: IAAA+, French SAS, SIREN 920 042 439.
Registered office: 14 rue Jean Perrin, 17000 La Rochelle, France.
Publication director: JCA.

Published sites: situationcard.com and situationcard.fr.
Hosting: OVH SAS, 2 rue Kellermann, 59100 Roubaix, France, www.ovh.com.
Contact: contact@situationcard.com`,
    },
    {
      title: 'Applicable law',
      content: `This site and its contents are governed by French law. Any dispute relating to the use of the site falls under the jurisdiction of the competent French courts.`,
    },
  ],
}

const COPY = {
  FR: {
    back: 'Retour',
    eyebrow: 'Information · confidentialite · securite',
    title: 'Politique de traitement des informations',
    intro:
      'Cette page explique comment Situation Card traite les questions, cartes, ressources, snapshots, partages, PDF et traces techniques.',
    updated: 'Derniere mise a jour : 10 mai 2026',
  },
  EN: {
    back: 'Back',
    eyebrow: 'Information · privacy · security',
    title: 'Information Processing Policy',
    intro:
      'This page explains how Situation Card processes questions, cards, resources, snapshots, sharing, PDFs and technical traces.',
    updated: 'Last updated: May 10, 2026',
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

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 28px' }}>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          {copy.eyebrow}
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '14px' }}>
          {copy.title}
        </h1>
        <p style={{ fontSize: '15px', color: '#5A6A7A', lineHeight: 1.75, marginBottom: '42px' }}>
          {copy.intro}
        </p>

        {SECTIONS[lang].map((section) => (
          <div key={section.title} style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#1A2E5A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {section.title}
            </h2>
            <div style={{ fontSize: '14px', color: '#5A6A7A', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {section.content}
            </div>
            <div style={{ height: '1px', background: '#E8E0D0', marginTop: '22px' }} />
          </div>
        ))}

        <p style={{ fontSize: '11px', color: '#B8AD9A', marginTop: '24px' }}>
          {copy.updated}
        </p>
      </div>
    </main>
  )
}
