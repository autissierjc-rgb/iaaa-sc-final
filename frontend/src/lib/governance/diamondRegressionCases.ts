import type { SituationDomain } from '../resources/resourceContract'

export type DiamondRegressionCase = {
  id: string
  domain: SituationDomain
  input: string
  expectations: {
    headerDomain?: string
    forbiddenTerms: string[]
    requiredTerms: string[]
    maxModerateBranches?: number
    maxDominantBranches?: number
    minDominantBranches?: number
    visibleAxisVI: 'Incertitudes'
    notes: string
  }
}

export const DIAMOND_REGRESSION_CASES: DiamondRegressionCase[] = [
  {
    id: 'macron-iran-position',
    domain: 'geopolitics',
    input: "Macron ne s'exprime pas beaucoup sur la guerre en Iran, quelle est sa position ?",
    expectations: {
      headerDomain: 'Géopolitique',
      forbiddenTerms: [
        'traction',
        'distribution produit',
        'pipeline commercial',
        'site officiel',
        'nom propre cité',
        'pays du Moyen-Orient',
        'Macron (président',
      ],
      requiredTerms: ['Macron', 'Iran', 'position', 'guerre en Iran'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      minDominantBranches: 1,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit lire une posture publique dans un contexte de guerre : perception, contraintes diplomatiques et tensions doivent rester cohérentes avec l’indice.',
    },
  },
  {
    id: 'netanyahu-trump-iran-causality',
    domain: 'geopolitics',
    input: "Netanyahou a-t-il entraîné Trump dans la guerre en Iran ?",
    expectations: {
      headerDomain: 'Géopolitique',
      forbiddenTerms: [
        'traction',
        'distribution produit',
        'pipeline commercial',
        'lien affectif familial',
        'demande de préparation',
        'site officiel',
      ],
      requiredTerms: ['Netanyahou', 'Trump', 'Iran', 'preuve'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      minDominantBranches: 1,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit répondre d’abord à l’hypothèse causale : établi, plausible, non établi, preuve manquante. VI doit enquêter sur les canaux invisibles.',
    },
  },
  {
    id: 'flexup-site-analysis',
    domain: 'startup_vc',
    input: 'Que fait https://www.flexup.org/fr et est-ce intéressant ?',
    expectations: {
      headerDomain: 'Startup',
      forbiddenTerms: ['CGRI', 'détroit', 'enfant intérieur', 'site officiel à identifier', 'rituel ancien'],
      requiredTerms: ['FlexUp', 'site', 'preuve'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit comprendre le site avant de juger : produit, cible, usage, preuves visibles et preuves manquantes.',
    },
  },
  {
    id: 'flexup-join-startup-decision',
    domain: 'startup_vc',
    input: "Que fait la compagnie FlexUp et qu'en penser pour éventuellement la rejoindre avec ma startup ?",
    expectations: {
      headerDomain: 'Startup',
      forbiddenTerms: [
        'Quelle décision ou clarification doit être obtenue maintenant',
        'Qui sont les acteurs impliqués',
        'Voulez-vous les traiter ensemble ou prioriser',
        'site officiel à identifier',
        'rituel ancien',
        'mécanisme de sélection',
      ],
      requiredTerms: ['FlexUp', 'startup', 'rejoindre'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La demande contient déjà objet, évaluation, rôle utilisateur et décision potentielle. La clarification ne doit pas bloquer ; SC doit générer ou enquêter si la source manque.',
    },
  },
  {
    id: 'father-son-carp-fishing',
    domain: 'personal',
    input:
      "Mon fils de 14 ans est passionné par la pêche à la carpe. Nous y sommes allés 4 jours mais n'ayant pas pris de poisson, il a eu tendance à me reporter la faute et a préféré le dernier jour rester enfermé dans la voiture. Comment réagir ?",
    expectations: {
      headerDomain: 'Personnel',
      forbiddenTerms: [
        'site officiel',
        'URL officielle',
        'page produit',
        'traction',
        'pipeline commercial',
        'CGRI',
        'infrastructure critique',
        'mécanisme de sélection',
        'rituel ancien',
      ],
      requiredTerms: ['fils', 'pêche', 'voiture'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit rester dans une scène relationnelle concrète : adolescent, frustration, attribution de faute, retrait, réparation du lien.',
    },
  },
  {
    id: 'family-love-after-silence',
    domain: 'personal',
    input:
      "J'ai été surpris car je n'ai pas réagi. Nous sommes rentrés après 4 heures de voiture et quelques échanges anodins. Au moment de nous dire au revoir, il m'a dit qu'il m'aimait.",
    expectations: {
      headerDomain: 'Personnel',
      forbiddenTerms: [
        'site officiel',
        'URL officielle',
        'page produit',
        'traction',
        'pipeline commercial',
        'CGRI',
        'détroit d’Ormuz',
        'mécanisme de sélection',
        'rituel ancien',
      ],
      requiredTerms: ['voiture', 'aimait', 'réagi'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte ne doit jamais basculer en analyse de site. Elle doit lire le geste affectif, le silence, la surprise et ce qui reste non dit.',
    },
  },
]
