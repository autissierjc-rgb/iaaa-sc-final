export type DisplayableBlindSpot = {
  blind_spot: string
  level: string
}

export function inquiryLevelLabel(level: string) {
  if (level === 'documentary') return 'preuve documentaire'
  if (level === 'structural') return 'angle structurel'
  return 'precision utilisateur'
}

export function publicInquiryQuestion(blindSpot: string) {
  const normalized = blindSpot.toLowerCase()

  if (blindSpot === 'relais institutionnel') {
    return 'Quel relais institutionnel pourrait transformer la contestation en acte officiel ?'
  }
  if (blindSpot === 'regle exploitable') {
    return 'Quelle regle electorale pourrait etre utilisee pour retarder ou deplacer le resultat ?'
  }
  if (blindSpot === 'acteur capable de bloquer') {
    return 'Qui possede vraiment le levier pour certifier, retarder, juger ou legitimer la contestation ?'
  }
  if (normalized.includes('client')) {
    return 'Quels clients ou usages prouvent que la promesse est deja adoptee ?'
  }
  if (normalized.includes('revenu') || normalized.includes('traction')) {
    return 'Quelle trace montre que l interet devient usage, revenu ou decision d achat ?'
  }
  if (normalized.includes('droit') || normalized.includes('juridique')) {
    return 'Quelle contrainte juridique pourrait changer les conditions d adoption ?'
  }
  if (normalized.includes('place') || normalized.includes('role') || normalized.includes('partenariat')) {
    return 'Quelle place concrete la startup aurait-elle dans le partenariat : client, associe, fournisseur, relais ou dependance ?'
  }
  return `Que faut-il verifier concretement derriere : ${blindSpot} ?`
}
