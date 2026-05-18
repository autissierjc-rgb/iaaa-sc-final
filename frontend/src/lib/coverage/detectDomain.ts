import type { SituationDomain } from '../resources/resourceContract'

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

export function detectDomain(input: string): SituationDomain {
  const text = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (hasAny(text, ['iran', 'israel', 'gaza', 'ukraine', 'russie', 'chine', 'otan', 'onu', 'trump', 'teheran', 'washington', 'sanction', 'nucleaire'])) {
    return 'geopolitics'
  }

  if (hasAny(text, ['guerre', 'frappe', 'bombard', 'cessez-le-feu', 'militaire', 'missile', 'front', 'otage'])) {
    return 'war'
  }

  if (hasAny(text, ['ong', 'humanitaire', 'terrain', 'deplacement', 'refugie', 'camps', 'acces humanitaire'])) {
    return 'humanitarian'
  }

  if (
    /\b(ex|ancien conjoint|ancienne conjointe|relation)\b/.test(text) &&
    hasAny(text, ['cofondateur', 'co-fondateur', 'confondateur', 'associe', 'associer', 'associer comme', 's associer', 'startup', 'start-up'])
  ) {
    return 'professional'
  }

  if (hasAny(text, ['startup', 'start-up', 'vc', 'venture capital', 'capital-risque', 'levee', 'term sheet', 'dealflow', 'deal flow', 'due diligence', 'investissement startup', 'investisseur startup', 'investisseurs startup', 'pre-seed', 'seed', 'traction', 'runway'])) {
    return 'startup_vc'
  }

  if (
    hasAny(text, ['http://', 'https://', 'www.', '.com', '.fr', '.io', '.ai']) &&
    hasAny(text, ['que fait', 'interessant', 'intéressant', 'avis', 'evaluer', 'évaluer', 'potentiel', 'produit', 'service', 'site', 'startup', 'marche', 'marché'])
  ) {
    return 'startup_vc'
  }

  if (
    hasAny(text, ['communaute d utilisateurs', 'communaute utilisateur', 'communaute utilisateurs', 'utilisateur', 'utilisateurs', 'audience', 'acquisition', 'retention', 'activation', 'onboarding', 'go to market', 'go-to-market']) &&
    hasAny(text, ['cible', 'segment', 'options', 'strategie', 'strategique', 'developper', 'croissance', 'produit', 'plateforme', 'app', 'saas', 'situation card', 'situationcard', 'situation car d'])
  ) {
    return 'startup_vc'
  }

  if (hasAny(text, ['drh', 'manager', 'equipe', 'reorganisation', 'plan social', 'salarie', 'collegue'])) {
    return 'management'
  }

  if (hasAny(text, ['couple', 'famille', 'ami', 'amour', 'aime', 'aimait', 'relation', 'separation', 'parent', 'enfant', 'fils', 'fille', 'ado', 'adolescent', 'adolescente', 'symptome', 'symptomes', 'sante', 'santé', 'consulter', 'sport', 'tennis', 'motivation'])) {
    return 'personal'
  }

  if (hasAny(text, ['client', 'mission', 'associe', 'sponsor', 'poste', 'travail', 'carriere', 'contrat de travail', 'employeur', 'licenciement', 'rh', 'conflit pro', 'pitch', 'jury', 'presentation', 'présentation', 'anglais', 'lancement', 'lancer', 'entrain', 'entraine'])) {
    return 'professional'
  }

  if (hasAny(text, ['gouvernance', 'conseil', 'elu', 'mairie', 'ministere', 'administration', 'institution', 'commune', 'habitants', 'projet industriel', 'conteste', 'contesté'])) {
    return 'governance'
  }

  if (hasAny(text, ['marche', 'prix', 'petrole', 'inflation', 'banque', 'credit', 'investissement', 'bourse'])) {
    return 'economy'
  }

  return 'general'
}
