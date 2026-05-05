import type {
  ArbreACamesAnalysis,
  CoverageCheck,
} from '../resources/resourceContract'

function addUnique(list: string[], value: string): string[] {
  const normalized = value.toLowerCase()
  if (list.some((item) => item.toLowerCase() === normalized)) return list
  return [...list, value]
}

const UNIVERSAL_BLIND_SPOTS =
  'Chercher ce qui pourrait renverser la lecture : relations longues, réseaux d’influence, cadre légal ou institutionnel, argent, travail, rôle de l’État, normes sociales, infrastructures, coûts cachés ou hypothèses implicites.'

const PERSONAL_BLIND_SPOTS =
  'Chercher ce qui reste invisible dans le lien : honte, fatigue, besoin de sauver la face, peur de décevoir, attente non dite, tentative de réparation, interprétation du silence ou autonomie adolescente.'

function blindSpotForDomain(coverage?: CoverageCheck): string {
  const domain =
    coverage?.intent_context?.interpreted_request?.domain ??
    coverage?.intent_context?.surface_domain ??
    coverage?.domain
  const frame = coverage?.intent_context?.dominant_frame
  if (domain === 'personal' || frame === 'personal_relationship') return PERSONAL_BLIND_SPOTS
  return UNIVERSAL_BLIND_SPOTS
}

function withContextualBlindSpot(arbre: ArbreACamesAnalysis, coverage?: CoverageCheck): ArbreACamesAnalysis {
  return {
    ...arbre,
    incertitudes: addUnique(arbre.incertitudes, blindSpotForDomain(coverage)),
  }
}

function enrichByDomain(arbre: ArbreACamesAnalysis, coverage: CoverageCheck): ArbreACamesAnalysis {
  switch (coverage.domain) {
    case 'management':
    case 'professional':
      return {
        ...arbre,
        acteurs: addUnique(arbre.acteurs, 'Acteurs directs, manager, équipe, décideur réel, personne qui porte la charge et éventuel tiers de médiation'),
        contraintes: addUnique(arbre.contraintes, 'Mandat réel, pouvoir de décision, charge distribuée, limites franchies et conversations évitées structurent la situation.'),
        incertitudes: addUnique(arbre.incertitudes, 'Chercher le rôle exact de chacun, ce qui a déjà été tenté, le risque si rien ne change et qui supporte le coût réel.'),
        temps: addUnique(arbre.temps, 'La fenêtre critique est le moment où la charge silencieuse devient retrait, conflit explicite ou demande de tiers.'),
      }
    case 'personal':
      return {
        ...arbre,
        acteurs: addUnique(arbre.acteurs, 'Personnes impliquées, lien réel entre elles, personne qui attend, personne qui évite et tiers éventuel'),
        contraintes: addUnique(arbre.contraintes, 'Lien affectif, peur de perte, limite à poser, conversation évitée et conséquence d’une clarification trop tardive.'),
        incertitudes: addUnique(arbre.incertitudes, 'Chercher ce que chacun attendait sans le dire, ce qui a été dit clairement et ce qui relève d’une projection ou d’un accord implicite.'),
      }
    case 'humanitarian':
      return {
        ...arbre,
        acteurs: addUnique(arbre.acteurs, 'ONG, autorités locales, groupes armés éventuels, bénéficiaires, équipe terrain et source indépendante de vérification'),
        contraintes: addUnique(arbre.contraintes, 'Accès humanitaire, sécurité terrain, dépendance aux autorités locales, vérification indépendante et risque de captation.'),
        incertitudes: addUnique(arbre.incertitudes, 'Vérifier la fiabilité des sources locales, le rôle des autorités, la sécurité réelle et l’exposition des bénéficiaires.'),
      }
    case 'governance':
      return {
        ...arbre,
        acteurs: addUnique(arbre.acteurs, 'Décideur officiel, décideur réel, institution, opposants, bénéficiaires et acteurs capables de bloquer la mise en œuvre'),
        contraintes: addUnique(arbre.contraintes, 'Légitimité, calendrier politique, procédure, coalition de soutien et coût public d’un revirement.'),
        incertitudes: addUnique(arbre.incertitudes, 'Vérifier les alliances réelles, le seuil de contestation et les effets institutionnels secondaires.'),
      }
    case 'startup_vc':
      return {
        ...arbre,
        acteurs: addUnique(arbre.acteurs, 'Fondateurs, VC, utilisateurs cibles, acheteurs réels, concurrents, prescripteurs et premiers clients capables de valider ou d’invalider le deal.'),
        interets: addUnique(arbre.interets, 'Le VC cherche une asymétrie positive entre taille de marché, vitesse d’adoption, qualité d’équipe, différenciation et prix d’entrée.'),
        forces: addUnique(arbre.forces, 'Les forces à vérifier sont la douleur client, la preuve d’usage, la traction, la rétention, le timing de marché, le wedge produit et la capacité de distribution.'),
        tensions: addUnique(arbre.tensions, 'La tension centrale oppose la promesse pitchée à la preuve disponible : usage réel, revenu, répétabilité commerciale et capacité d’exécution.'),
        contraintes: addUnique(arbre.contraintes, 'Sans données sur produit, marché, traction, équipe, concurrence et stade de levée, la lecture investisseur doit rester conditionnelle.'),
        incertitudes: addUnique(arbre.incertitudes, 'Vérifier l’ICP, la willingness to pay, la rétention, le CAC, le cycle de vente, le moat et le risque de dépendre d’une démonstration trop narrative.'),
        temps: addUnique(arbre.temps, 'Le temps VC dépend du stade : pré-seed valide le problème et l’équipe, seed valide la traction et le marché répétable, Series A valide la machine commerciale.'),
        perceptions: addUnique(arbre.perceptions, 'Un même projet peut être perçu comme visionnaire ou fragile selon que le VC voit une preuve d’usage, un marché urgent et une équipe capable de livrer.'),
      }
    case 'economy':
      return {
        ...arbre,
        acteurs: addUnique(arbre.acteurs, 'Acteurs de marché, régulateurs, banques, investisseurs, entreprises exposées et ménages touchés indirectement'),
        contraintes: addUnique(arbre.contraintes, 'Liquidité, prix, taux, réglementation, confiance, dette et transmission vers l’économie réelle.'),
        incertitudes: addUnique(arbre.incertitudes, 'Vérifier l’ampleur de la contagion, la réaction des autorités et la durée du choc.'),
      }
    default:
      return arbre
  }
}

export function enrichArbreWithCoverage({
  arbre,
  coverage,
}: {
  arbre: ArbreACamesAnalysis
  coverage?: CoverageCheck
}): ArbreACamesAnalysis {
  if (!coverage) return withContextualBlindSpot(arbre)
  return withContextualBlindSpot(enrichByDomain(arbre, coverage), coverage)
}
