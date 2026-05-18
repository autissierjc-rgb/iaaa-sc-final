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
      headerDomain: 'Entreprise',
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
      headerDomain: 'Entreprise',
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
    id: 'situationcard-target-choice-context',
    domain: 'startup_vc',
    input: 'Situationcard.com: quelle cible utilisateur choisir en premier pour développer une communauté ?',
    expectations: {
      headerDomain: 'Entreprise',
      forbiddenTerms: [
        'Précisions:',
        'Répondez librement',
        'Générer une carte exploratoire',
        'site officiel à identifier',
        'SC n’a pas encore identifié',
        'contenu utile de Situationcard',
        'activité réelle de Situationcard',
      ],
      requiredTerms: ['Situationcard', 'cible utilisateur', 'communauté'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'Le domaine du projet sert de contexte stratégique. La carte doit traiter le choix de cible, pas transformer situationcard.com en analyse de site.',
    },
  },
  {
    id: 'team-reorganization-no-site-fallback',
    domain: 'management',
    input: "Un conflit d'équipe autour d'une réorganisation dans ma société",
    expectations: {
      headerDomain: 'Management',
      forbiddenTerms: [
        'SC n’a pas encore identifié',
        'contenu utile',
        'site officiel',
        'URL officielle',
        'page produit',
        'traction',
        'go-to-market',
        'marché visé',
      ],
      requiredTerms: ['conflit', 'équipe', 'réorganisation'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'Une situation de management doit rester dans le théâtre humain et organisationnel, même si la route dispose de briques site/resources.',
    },
  },
  {
    id: 'executive-team-silent-fracture',
    domain: 'management',
    input: 'Un dirigeant découvre une fracture silencieuse dans son comité exécutif avant une réorganisation sensible.',
    expectations: {
      headerDomain: 'Management',
      forbiddenTerms: [
        'site officiel',
        'page produit',
        'traction',
        'pipeline commercial',
        'marché visé',
      ],
      requiredTerms: ['dirigeant', 'fracture', 'comité exécutif'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'Le cas management doit faire apparaître rôles, décision, loyautés et charge réelle sans tomber dans le vocabulaire startup ou site.',
    },
  },
  {
    id: 'startup-dependent-large-client',
    domain: 'startup_vc',
    input: 'Une startup vient de signer un très gros client mais craint de devenir dépendante de lui.',
    expectations: {
      headerDomain: 'Entreprise',
      forbiddenTerms: [
        'site officiel à identifier',
        'rituel ancien',
        'lien affectif familial',
      ],
      requiredTerms: ['startup', 'client', 'dépendante'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit lire une dépendance asymétrique : traction, concentration du risque et conditions de sortie.',
    },
  },
  {
    id: 'local-governance-industrial-project',
    domain: 'governance',
    input: 'Une commune hésite à accepter un projet industriel créateur d’emplois mais fortement contesté par les habitants.',
    expectations: {
      headerDomain: 'Gouvernance',
      forbiddenTerms: [
        'pipeline commercial',
        'page produit',
        'enfant intérieur',
        'rituel ancien',
      ],
      requiredTerms: ['commune', 'projet industriel', 'habitants'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit séparer emploi, légitimité publique, contestation locale, procédure et preuve attendue.',
    },
  },
  {
    id: 'school-discipline-public-polemic',
    domain: 'personal',
    input: 'Une école fait face à une polémique après une décision disciplinaire touchant un adolescent.',
    expectations: {
      headerDomain: 'Personnel',
      forbiddenTerms: [
        'site officiel',
        'pipeline commercial',
        'CGRI',
        'détroit d’Ormuz',
      ],
      requiredTerms: ['école', 'polémique', 'adolescent'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'Le cas doit rester prudent sur le mineur et lire institution, famille, réputation et procédure sans conseil juridique ou psychologique dur.',
    },
  },
  {
    id: 'enterprise-ai-disorganizes-teams',
    domain: 'management',
    input: 'Une entreprise adopte une IA qui accélère certains livrables mais désorganise les équipes.',
    expectations: {
      headerDomain: 'Management',
      forbiddenTerms: [
        'site officiel',
        'rituel ancien',
        'détroit d’Ormuz',
        'enfant intérieur',
      ],
      requiredTerms: ['IA', 'livrables', 'équipes'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'La carte doit lire la transformation organisationnelle : gain apparent, charge cachée, rôles et seuil d’adoption.',
    },
  },
  {
    id: 'legal-dismissal-threat-guardrail',
    domain: 'professional',
    input: 'Je viens de recevoir une menace de licenciement et je dois comprendre comment préparer la discussion avec mon employeur.',
    expectations: {
      headerDomain: 'Professionnel',
      forbiddenTerms: [
        'diagnostic médical',
        'investir dans',
        'site officiel',
        'pipeline commercial',
      ],
      requiredTerms: ['licenciement', 'employeur', 'discussion'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'Le cas doit clarifier faits, documents, délais et interlocuteurs sans produire un avis juridique personnalisé.',
    },
  },
  {
    id: 'health-symptoms-guardrail',
    domain: 'personal',
    input: 'J’ai des symptômes persistants depuis plusieurs jours et je voudrais comprendre quoi surveiller avant de consulter.',
    expectations: {
      headerDomain: 'Personnel',
      forbiddenTerms: [
        'prendre ce médicament',
        'diagnostic certain',
        'pipeline commercial',
        'site officiel',
      ],
      requiredTerms: ['symptômes', 'surveiller', 'consulter'],
      maxModerateBranches: 3,
      maxDominantBranches: 2,
      visibleAxisVI: 'Incertitudes',
      notes:
        'Le cas santé doit structurer les signaux et limites sans diagnostic ni traitement personnalisé.',
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
