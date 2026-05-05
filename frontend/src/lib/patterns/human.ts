export type HumanPattern = {
  id: string
  label: string
  description: string
  keywords: string[]
  diagnosticBias: string
}

export const HUMAN_PATTERNS: HumanPattern[] = [
  {
    id: 'identity_split',
    label: 'Identity Split',
    description: 'Tiraillement entre deux définitions incompatibles de soi.',
    keywords: ['identité', 'role', 'rôle', 'qui je suis', 'double vie', 'choisir entre', 'incompatible'],
    diagnosticBias: 'chercher la définition de soi que la situation rend intenable',
  },
  {
    id: 'loyalty_conflict',
    label: 'Loyalty Conflict',
    description: 'Obligations envers deux parties ou valeurs incompatibles.',
    keywords: ['loyauté', 'loyaute', 'fidèle', 'trahir', 'entre deux', 'famille', 'équipe', 'equipe', 'valeurs'],
    diagnosticBias: 'identifier les deux loyautés qui ne peuvent plus être honorées ensemble',
  },
  {
    id: 'dependency_loop',
    label: 'Dependency Loop',
    description: 'La personne a besoin de ce dont elle essaie de sortir.',
    keywords: ['dépend', 'depend', 'besoin de', 'sortir de', 'bloqué', 'bloque', 'piégé', 'piege', 'client', 'sponsor'],
    diagnosticBias: 'repérer la ressource dont l’acteur dépend alors qu’elle entretient le problème',
  },
  {
    id: 'recognition_asymmetry',
    label: 'Recognition Asymmetry',
    description: 'Contribution invisible à ceux qui comptent le plus.',
    keywords: ['reconnaissance', 'invisible', 'pas vu', 'pas reconnu', 'contribution', 'effort', 'mérite', 'merite'],
    diagnosticBias: 'chercher qui porte une contribution indispensable sans reconnaissance suffisante',
  },
  {
    id: 'shame_avoidance_loop',
    label: 'Shame-Avoidance Loop',
    description: 'Peur d’exposition empêchant l’action nécessaire.',
    keywords: ['honte', 'exposé', 'expose', 'peur que ça se sache', 'cacher', 'éviter', 'eviter', 'aveu'],
    diagnosticBias: 'chercher l’exposition redoutée qui bloque l’action nécessaire',
  },
  {
    id: 'fear_of_loss_paralysis',
    label: 'Fear-of-Loss Paralysis',
    description: 'Figé entre de mauvaises options pour éviter la perte.',
    keywords: ['perdre', 'perte', 'risque de perdre', 'paralysé', 'paralyse', 'n’ose pas', 'nose pas', 'mauvaises options'],
    diagnosticBias: 'identifier la perte que l’acteur évite au prix d’une immobilité coûteuse',
  },
  {
    id: 'self_worth_role_fusion',
    label: 'Self-Worth / Role Fusion',
    description: 'Identité trop fusionnée avec un rôle ou un titre.',
    keywords: ['titre', 'statut', 'poste', 'rôle', 'role', 'valeur personnelle', 'estime', 'fonction'],
    diagnosticBias: 'distinguer la personne du rôle qui absorbe sa valeur perçue',
  },
  {
    id: 'chronic_over_adaptation',
    label: 'Chronic Over-Adaptation',
    description: 'Ajustements continus jusqu’à ce qu’il ne reste plus rien d’authentique.',
    keywords: ['s’adapte', 'adapte toujours', 'prend sur lui', 'prend sur elle', 'compromis', 's’efface', 'sefface'],
    diagnosticBias: 'chercher la limite franchie par l’adaptation répétée',
  },
  {
    id: 'emotional_load_asymmetry',
    label: 'Emotional Load Asymmetry',
    description: 'Une personne porte ce qui devrait être distribué.',
    keywords: ['charge émotionnelle', 'charge emotionnelle', 'porte tout', 'épuisé', 'epuise', 'fatigue', 'pression équipe', 'pression equipe'],
    diagnosticBias: 'identifier qui porte seul une charge qui devrait être distribuée',
  },
  {
    id: 'unspoken_contract_breakdown',
    label: 'Unspoken Contract Breakdown',
    description: 'Accord implicite jamais formulé, maintenant violé.',
    keywords: ['accord implicite', 'non dit', 'jamais dit', 'contrat moral', 'promesse', 'trahi', 'trahison'],
    diagnosticBias: 'formuler l’accord implicite dont la violation crée la crise',
  },
  {
    id: 'hidden_resentment_accumulation',
    label: 'Hidden Resentment Accumulation',
    description: 'Silences passés empoisonnant le présent.',
    keywords: ['ressentiment', 'rancœur', 'rancoeur', 'accumule', 'silence', 'depuis longtemps', 'reproches'],
    diagnosticBias: 'chercher les reproches accumulés qui transforment un détail en rupture',
  },
  {
    id: 'boundary_erosion',
    label: 'Boundary Erosion',
    description: 'Limites franchies si souvent qu’elles ne semblent plus réelles.',
    keywords: ['limite', 'frontière', 'frontiere', 'déborde', 'deborde', 'abus', 'toujours plus', 'envahit'],
    diagnosticBias: 'identifier la limite qui a cessé d’être défendue',
  },
  {
    id: 'meaning_collapse_under_constraint',
    label: 'Meaning Collapse Under Constraint',
    description: 'Le sens disparaît sous l’accumulation des obligations.',
    keywords: ['plus de sens', 'perte de sens', 'obligations', 'absurde', 'à quoi bon', 'a quoi bon', 'contrainte'],
    diagnosticBias: 'chercher la contrainte qui vide l’action de son sens',
  },
  {
    id: 'care_burden_imbalance',
    label: 'Care Burden Imbalance',
    description: 'Soin donné excède soin reçu, de façon insoutenable.',
    keywords: ['aide toujours', 'prend soin', 's’occupe', 'soccupe', 'aidant', 'famille', 'care', 'soutien'],
    diagnosticBias: 'repérer le déséquilibre entre soin donné et soin reçu',
  },
  {
    id: 'validation_trap',
    label: 'Validation Trap',
    description: 'Estime de soi dépendante d’une approbation externe incontrôlable.',
    keywords: ['validation', 'approbation', 'plaire', 'regard des autres', 'jugement', 'reconnu par', 'avis'],
    diagnosticBias: 'identifier l’approbation externe qui contrôle l’action',
  },
  {
    id: 'deferred_conflict_saturation',
    label: 'Deferred Conflict Saturation',
    description: 'Conversations évitées créant maintenant une pression systémique.',
    keywords: ['conflit évité', 'conflit evite', 'conversation évitée', 'conversation evitee', 'on n’en parle pas', 'explose', 'saturation'],
    diagnosticBias: 'chercher la conversation évitée qui organise maintenant toute la pression',
  },
  {
    id: 'projection_misalignment',
    label: 'Projection / Misalignment',
    description: 'Réponse à une dynamique imaginée, pas réelle.',
    keywords: ['malentendu', 'projection', 'interprète', 'interprete', 'croit que', 'suppose', 'alignement'],
    diagnosticBias: 'vérifier si l’acteur répond à la situation réelle ou à une projection',
  },
  {
    id: 'attachment_security_conflict',
    label: 'Attachment-Security Conflict',
    description: 'Désir de proximité en conflit avec besoin de sécurité.',
    keywords: ['proximité', 'proximite', 'sécurité', 'securite', 'attachement', 'distance', 'relation', 'couple'],
    diagnosticBias: 'repérer le conflit entre lien recherché et sécurité nécessaire',
  },
  {
    id: 'invisible_standards_pressure',
    label: 'Invisible Standards Pressure',
    description: 'Jugé selon des standards jamais explicitement formulés.',
    keywords: ['standard', 'exigence', 'jamais clair', 'attentes', 'évalué', 'evalue', 'critères', 'criteres'],
    diagnosticBias: 'rendre visibles les critères implicites qui gouvernent le jugement',
  },
  {
    id: 'role_container_failure',
    label: 'Role Container Failure',
    description: 'Le rôle ne contient plus la complexité réelle de ce qui est requis.',
    keywords: ['rôle ne suffit plus', 'role ne suffit plus', 'fonction déborde', 'fonction deborde', 'poste', 'responsabilité', 'responsabilite', 'médiateur', 'tiers'],
    diagnosticBias: 'chercher si le rôle actuel ne peut plus contenir ce qu’on lui demande de porter',
  },
]
