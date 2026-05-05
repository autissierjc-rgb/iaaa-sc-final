import type { SituationDomain } from '../resources/resourceContract'

export type DomainCoverage = {
  domain: SituationDomain
  requiredSignals: string[]
  clarifyQuestions: string[]
  minimumInputLength: number
}

export function getDomainCoverage(domain: SituationDomain): DomainCoverage {
  switch (domain) {
    case 'geopolitics':
    case 'war':
      return {
        domain,
        minimumInputLength: 18,
        requiredSignals: [
          'dirigeants nommés',
          'institutions militaires ou sécuritaires',
          'lieux ou chokepoints',
          'infrastructures critiques',
          'acteurs tiers ou médiateurs',
          'seuils d’escalade',
          'temporalités',
          'effets externes',
        ],
        clarifyQuestions: [
          'Quel angle voulez-vous privilégier : état du monde, dynamique militaire, acteurs, marchés/énergie ou issue diplomatique ?',
          'Quels acteurs, faits, lieux ou données doivent absolument être pris en compte ?',
        ],
      }
    case 'management':
    case 'professional':
      return {
        domain,
        minimumInputLength: 35,
        requiredSignals: [
          'acteurs impliqués',
          'décision à prendre',
          'charge réelle',
          'limite franchie',
          'tentatives déjà faites',
          'risque si rien ne change',
        ],
        clarifyQuestions: [
          'Qui sont les acteurs impliqués et quel est votre rôle exact dans la situation ?',
          'Quelle décision ou clarification doit être obtenue maintenant ?',
          'Qu’est-ce qui a déjà été tenté, et qu’est-ce qui risque d’arriver si rien ne change ?',
        ],
      }
    case 'personal':
      return {
        domain,
        minimumInputLength: 35,
        requiredSignals: [
          'personnes impliquées',
          'lien entre elles',
          'événement déclencheur',
          'limite ou peur principale',
          'ce qui est attendu',
        ],
        clarifyQuestions: [
          'Qui est impliqué et quel est le lien entre vous ?',
          'Quel événement ou comportement récent rend la situation difficile maintenant ?',
          'Qu’attendez-vous : comprendre, décider, parler à quelqu’un ou poser une limite ?',
        ],
      }
    case 'humanitarian':
      return {
        domain,
        minimumInputLength: 30,
        requiredSignals: [
          'lieu précis',
          'acteurs locaux',
          'autorités ou groupes armés',
          'personnes exposées',
          'accès et sécurité',
          'source de vérification',
        ],
        clarifyQuestions: [
          'Quel est le lieu précis et qui sont les acteurs locaux impliqués ?',
          'Qui vérifie l’information de sécurité ou d’accès ?',
          'Quelle décision opérationnelle doit être prise ?',
        ],
      }
    case 'startup_vc':
      return {
        domain,
        minimumInputLength: 45,
        requiredSignals: [
          'produit ou proposition de valeur',
          'client cible ou ICP',
          'marché et timing',
          'traction ou preuve d’usage',
          'revenus ou modèle économique',
          'équipe fondatrice',
          'différenciation ou moat',
          'risque d’exécution',
          'stade de levée',
          'décision investisseur à éclairer',
        ],
        clarifyQuestions: [
          'Quel est le produit analysé, son client cible et le problème concret qu’il résout ?',
          'Quelles preuves existent déjà : utilisateurs, revenus, traction, rétention, démonstrations, partenariats ou pipeline commercial ?',
          'Quelle décision VC faut-il éclairer : pré-seed, seed, sélection de deal, investissement, follow-on ou angle de pitch ?',
        ],
      }
    default:
      return {
        domain,
        minimumInputLength: 25,
        requiredSignals: [
          'acteurs',
          'enjeu',
          'contrainte',
          'décision ou question à trancher',
        ],
        clarifyQuestions: [
          'Qui sont les principaux acteurs de la situation ?',
          'Quelle décision, tension ou question voulez-vous éclairer ?',
          'Qu’est-ce qui rend la situation difficile maintenant ?',
        ],
      }
  }
}
