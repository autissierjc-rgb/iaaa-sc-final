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
    hasAny(text, ['ex', 'ancien conjoint', 'ancienne conjointe', 'relation']) &&
    hasAny(text, ['cofondateur', 'co-fondateur', 'confondateur', 'associe', 'associer', 'associer comme', 's associer', 'startup', 'start-up'])
  ) {
    return 'professional'
  }

  if (hasAny(text, ['startup', 'start-up', 'vc', 'venture capital', 'capital-risque', 'levee', 'term sheet', 'dealflow', 'deal flow', 'due diligence', 'investissement startup', 'investisseur startup', 'investisseurs startup', 'pre-seed', 'seed', 'traction', 'runway'])) {
    return 'startup_vc'
  }

  if (hasAny(text, ['drh', 'manager', 'equipe', 'reorganisation', 'plan social', 'salarie', 'collegue'])) {
    return 'management'
  }

  if (hasAny(text, ['couple', 'famille', 'ami', 'amour', 'relation', 'separation', 'parent', 'enfant', 'fils', 'fille', 'ado', 'adolescent', 'adolescente', 'sport', 'tennis', 'motivation'])) {
    return 'personal'
  }

  if (hasAny(text, ['client', 'mission', 'associe', 'sponsor', 'poste', 'travail', 'carriere', 'conflit pro', 'pitch', 'jury', 'presentation', 'présentation', 'anglais', 'lancement', 'lancer', 'entrain', 'entraine'])) {
    return 'professional'
  }

  if (hasAny(text, ['gouvernance', 'conseil', 'elu', 'mairie', 'ministere', 'administration', 'institution'])) {
    return 'governance'
  }

  if (hasAny(text, ['marche', 'prix', 'petrole', 'inflation', 'banque', 'credit', 'investissement', 'bourse'])) {
    return 'economy'
  }

  return 'general'
}
