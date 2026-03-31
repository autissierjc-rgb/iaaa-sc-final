/**
 * IAAA · /legal
 * Mentions légales — obligatoires (loi française du 21 juin 2004, LCEN)
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — Situation Card',
}

export default function LegalPage() {
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
        <Link href="/" style={{ fontSize: '12px', color: '#9A8860', textDecoration: 'none' }}>← Retour</Link>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 28px' }}>

        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '10px', color: '#9A8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Légal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 400, color: '#1A2E5A', marginBottom: '40px' }}>
          Mentions légales
        </h1>

        {[
          {
            title: 'Éditeur du site',
            content: `IAAA+
Société par actions simplifiée (SAS)
SIREN : 920 042 439
Activité : Conseil pour les affaires et activités logiciels

Siège social : 14 rue Jean Perrin, 17000 La Rochelle, France

Directeur de la publication : JCA`,
          },
          {
            title: 'Sites édités',
            content: `situationcard.com
situationcard.fr`,
          },
          {
            title: 'Hébergement',
            content: `OVH SAS
2 rue Kellermann — 59100 Roubaix — France
www.ovh.com`,
          },
          {
            title: 'Contact',
            content: `Pour toute question relative au site ou à son contenu :
hello@situationcard.com

Pour toute question relative à la protection des données personnelles :
privacy@situationcard.com

Pour toute question juridique :
legal@situationcard.com`,
          },
          {
            title: 'Propriété intellectuelle',
            content: `L'ensemble des contenus présents sur situationcard.com (textes, graphismes, logiciels, bases de données, marques) est la propriété exclusive de IAAA+ ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation préalable écrite de IAAA+, sauf disposition contraire expressément indiquée.

Les Situation Cards publiées dans l'Atlas public sont mises à disposition sous licence Creative Commons Attribution 4.0 International (CC BY 4.0). Elles peuvent être librement partagées et adaptées à condition d'en mentionner la source.`,
          },
          {
            title: 'Intelligence artificielle',
            content: `Les Situation Cards sont générées par un système d'intelligence artificielle (modèles de langage de grande taille). Elles constituent une aide à la réflexion structurée et ne sauraient être considérées comme des conseils juridiques, financiers, médicaux ou professionnels.

La décision reste toujours celle de l'utilisateur.`,
          },
          {
            title: 'Données personnelles',
            content: `Conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles.

Pour exercer ces droits : privacy@situationcard.com

Voir notre politique de confidentialité complète : situationcard.com/privacy`,
          },
          {
            title: 'Cookies',
            content: `Le site utilise un nombre minimal de cookies fonctionnels (session d'authentification, préférences de langue). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.

Voir notre politique de confidentialité pour plus de détails.`,
          },
          {
            title: 'Droit applicable',
            content: `Le présent site et ses contenus sont soumis au droit français. Tout litige relatif à l'utilisation du site relève de la compétence exclusive des tribunaux français.`,
          },
        ].map((section) => (
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
          Dernière mise à jour : 28 mars 2026
        </p>

      </div>
    </main>
  )
}
