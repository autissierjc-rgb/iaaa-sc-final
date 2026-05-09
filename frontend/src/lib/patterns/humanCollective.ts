export type HumanCollectiveScale =
  | 'individual'
  | 'family'
  | 'couple'
  | 'team'
  | 'organization'
  | 'institution'
  | 'state'
  | 'community'

export type PatternEvidenceMode =
  | 'internal_narrative'
  | 'user_clarification'
  | 'documentary'
  | 'public_sources'
  | 'recherche_plus'

export type DumezilFunction =
  | 'legitimize'
  | 'protect_fight'
  | 'produce_reproduce'

export type HumanCollectivePattern = {
  id: string
  label_fr: string
  traditions: string[]
  dumezil_functions: DumezilFunction[]
  applies_to: HumanCollectiveScale[]
  structure: string
  detects: string[]
  questions: string[]
  observable_signals: string[]
  evidence_modes: PatternEvidenceMode[]
  writing_use: string
  inquiry_use: string
  scoring_effect?: string
}

export type SelectedHumanCollectivePattern = {
  id: string
  label_fr: string
  confidence: number
  hypothesis: string
  observable_signal: string
  inquiry_question: string
}

export type HumanCollectivePatternContext = {
  selected_patterns: SelectedHumanCollectivePattern[]
  dumezil_balance: Record<DumezilFunction, number>
  trace: {
    total_patterns: number
    matched_patterns: number
    rule: 'patterns_are_lenses_not_conclusions'
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const HUMAN_COLLECTIVE_PATTERNS: HumanCollectivePattern[] = [
  {
    id: 'face_role_public',
    label_fr: 'Face / role public',
    traditions: ['Goffman'],
    dumezil_functions: ['legitimize', 'protect_fight'],
    applies_to: ['individual', 'family', 'couple', 'team', 'organization', 'institution', 'state'],
    structure: 'Un acteur protege une image publique ou une place relationnelle avant de traiter le fond.',
    detects: ['honte', 'humiliation', 'retrait', 'justification', 'image', 'reputation', 'face'],
    questions: ['Qui risque de perdre la face si la situation est nommee clairement ?'],
    observable_signals: ['Un acteur prefere se retirer, bloquer ou justifier plutot que reconnaitre une erreur.'],
    evidence_modes: ['internal_narrative', 'user_clarification', 'public_sources'],
    writing_use: 'Montrer ce que l acteur protege publiquement avant de conclure sur son intention.',
    inquiry_use: 'Chercher le geste, le silence ou la justification qui signale la protection de face.',
    scoring_effect: 'La pression augmente si la perte de face devient publique ou irreparable.',
  },
  {
    id: 'taboo_invisible_norm',
    label_fr: 'Tabou / norme invisible',
    traditions: ['Mary Douglas'],
    dumezil_functions: ['legitimize'],
    applies_to: ['family', 'team', 'organization', 'institution', 'state', 'community'],
    structure: 'Le groupe evite un sujet parce que le nommer menacerait son ordre implicite.',
    detects: ['tabou', 'norme', 'interdit', 'impur', 'on ne dit pas', 'silence', 'malaise'],
    questions: ['Qu est-ce que le groupe ne peut pas dire sans se menacer lui-meme ?'],
    observable_signals: ['Un detail banal declenche une reaction disproportionnee.'],
    evidence_modes: ['internal_narrative', 'user_clarification'],
    writing_use: 'Rendre visible la norme qui organise les reactions sans l appeler diagnostic.',
    inquiry_use: 'Demander quelle phrase, quel fait ou quel acteur devient intouchable.',
    scoring_effect: 'La pression augmente si le tabou bloque une decision necessaire.',
  },
  {
    id: 'discretionary_power_zone',
    label_fr: 'Zone d incertitude / pouvoir discret',
    traditions: ['Crozier', 'Friedberg'],
    dumezil_functions: ['protect_fight'],
    applies_to: ['team', 'organization', 'institution', 'state', 'community'],
    structure: 'Un acteur tient un levier parce qu il controle une incertitude, une competence ou un passage oblige.',
    detects: ['bloquer', 'ralentir', 'dependance', 'levier', 'decision', 'procedure', 'qui decide'],
    questions: ['Qui peut bloquer ou rendre possible parce que les autres dependent de lui ?'],
    observable_signals: ['Un acteur peu visible modifie le rythme de toute la situation.'],
    evidence_modes: ['internal_narrative', 'user_clarification', 'documentary'],
    writing_use: 'Nommer le pouvoir reel plutot que le seul organigramme officiel.',
    inquiry_use: 'Chercher le point de passage, la competence ou la regle qui donne le levier.',
    scoring_effect: 'La pression augmente si le levier discret devient un blocage explicite.',
  },
  {
    id: 'symbolic_capital_recognition',
    label_fr: 'Capital symbolique / reconnaissance',
    traditions: ['Bourdieu'],
    dumezil_functions: ['legitimize', 'produce_reproduce'],
    applies_to: ['individual', 'family', 'team', 'organization', 'institution', 'state', 'community'],
    structure: 'Le conflit porte sur le rang, la legitimite ou la reconnaissance autant que sur l objet visible.',
    detects: ['reconnaissance', 'rang', 'statut', 'legitimite', 'prestige', 'invisible', 'merite'],
    questions: ['Quel rang ou quelle reconnaissance est donne, retire ou refuse ?'],
    observable_signals: ['Un objet secondaire devient decisif parce qu il attribue une valeur publique.'],
    evidence_modes: ['internal_narrative', 'user_clarification', 'public_sources'],
    writing_use: 'Distinguer l objet apparent de la valeur symbolique qu il distribue.',
    inquiry_use: 'Chercher qui gagne ou perd en legitimite si la situation est tranchee.',
    scoring_effect: 'La pression augmente si la reconnaissance devient non negociable.',
  },
  {
    id: 'gift_debt_loyalty',
    label_fr: 'Don / dette / loyaute',
    traditions: ['Mauss'],
    dumezil_functions: ['produce_reproduce', 'legitimize'],
    applies_to: ['individual', 'family', 'couple', 'team', 'organization', 'community'],
    structure: 'Une dette implicite ou un don passe continue d organiser les obligations presentes.',
    detects: ['dette', 'loyaute', 'trahir', 'apres tout', 'obligation', 'don', 'service rendu'],
    questions: ['Quelle dette implicite continue d organiser les gestes ?'],
    observable_signals: ['Un argument moral remplace une regle claire ou un accord explicite.'],
    evidence_modes: ['internal_narrative', 'user_clarification'],
    writing_use: 'Montrer la dette sans la transformer en faute psychologique.',
    inquiry_use: 'Demander ce qui a ete donne, attendu en retour, ou jamais clarifie.',
    scoring_effect: 'La pression augmente si une dette implicite devient impossible a honorer.',
  },
  {
    id: 'moral_justification_regime',
    label_fr: 'Justification / recit moral',
    traditions: ['Boltanski', 'Thevenot'],
    dumezil_functions: ['legitimize'],
    applies_to: ['individual', 'family', 'team', 'organization', 'institution', 'state', 'community'],
    structure: 'Les acteurs ne s opposent pas seulement sur les faits mais sur le monde moral qui rend une position legitime.',
    detects: ['justice', 'valeurs', 'merite', 'efficacite', 'tradition', 'mission', 'responsabilite'],
    questions: ['Quel monde moral chaque acteur invoque pour justifier sa position ?'],
    observable_signals: ['Les memes faits sont lus comme preuve de justice par les uns et d abus par les autres.'],
    evidence_modes: ['internal_narrative', 'user_clarification', 'public_sources'],
    writing_use: 'Nommer la contradiction entre regimes de justification plutot que juger un camp trop vite.',
    inquiry_use: 'Chercher les mots de justification et les criteres de grandeur mobilises.',
  },
  {
    id: 'deep_culture_contradiction',
    label_fr: 'Culture profonde / contradiction',
    traditions: ['Schein'],
    dumezil_functions: ['produce_reproduce', 'legitimize'],
    applies_to: ['team', 'organization', 'institution', 'state', 'community'],
    structure: 'Les valeurs affichees et les comportements recompenses racontent deux organisations differentes.',
    detects: ['culture', 'valeurs', 'mission', 'discours', 'pratique', 'recompense', 'contradiction'],
    questions: ['Quelle hypothese non dite gouverne encore les comportements ?'],
    observable_signals: ['Ce qui est proclame n est pas ce qui est recompense ou protege.'],
    evidence_modes: ['internal_narrative', 'documentary', 'public_sources'],
    writing_use: 'Opposer fonction reelle, valeurs affichees et gestes recompenses.',
    inquiry_use: 'Chercher les decisions qui revelent la culture plus que les slogans.',
    scoring_effect: 'La pression augmente si la contradiction image/fonction devient visible.',
  },
  {
    id: 'collective_defensive_routine',
    label_fr: 'Defense collective / refus d apprendre',
    traditions: ['Argyris', 'Janis'],
    dumezil_functions: ['protect_fight'],
    applies_to: ['team', 'organization', 'institution', 'state', 'community'],
    structure: 'Le groupe protege sa coherence en evitant les signaux qui exigeraient d apprendre ou de changer.',
    detects: ['minimise', 'deni', 'on savait', 'signal faible', 'consensus', 'pression du groupe', 'defense'],
    questions: ['Quelle verite le groupe evite-t-il d apprendre ?'],
    observable_signals: ['Les alertes sont expliquees, isolees ou renvoyees a un individu au lieu de modifier le systeme.'],
    evidence_modes: ['internal_narrative', 'documentary', 'public_sources'],
    writing_use: 'Montrer comment le systeme neutralise l alerte sans accuser une intention cachee.',
    inquiry_use: 'Chercher les alertes anciennes, les decisions ignorees et les dissidents isoles.',
    scoring_effect: 'La pression augmente si le refus d apprendre prolonge une trajectoire couteuse.',
  },
  {
    id: 'threshold_status_passage',
    label_fr: 'Seuil / passage / statut',
    traditions: ['Turner'],
    dumezil_functions: ['legitimize', 'produce_reproduce'],
    applies_to: ['individual', 'family', 'couple', 'team', 'organization', 'institution', 'community'],
    structure: 'Un ancien role ne contient plus la situation et un nouveau role n est pas encore stabilise.',
    detects: ['passage', 'seuil', 'transition', 'ancien role', 'nouveau role', 'statut', 'entre deux'],
    questions: ['Quel ancien role ne contient plus ce qui arrive ?'],
    observable_signals: ['La crise apparait au moment ou une place doit etre renegociee.'],
    evidence_modes: ['internal_narrative', 'user_clarification'],
    writing_use: 'Lire la tension comme crise de passage plutot que simple conflit.',
    inquiry_use: 'Demander quelle place ancienne est perdue et quelle place nouvelle n est pas reconnue.',
  },
  {
    id: 'mimetic_rivalry_scapegoat',
    label_fr: 'Desir mimetique / bouc emissaire',
    traditions: ['Girard'],
    dumezil_functions: ['protect_fight', 'legitimize'],
    applies_to: ['individual', 'family', 'couple', 'team', 'organization', 'institution', 'state', 'community'],
    structure: 'La rivalite se cristallise autour d un objet rendu desirable par le regard d autrui, ou une faute est transferee pour refaire de l unite.',
    detects: ['rivalite', 'jalousie', 'imitation', 'bouc emissaire', 'faute', 'accusation', 'unite'],
    questions: ['Quel objet devient desirable parce qu un autre le rend desirable ? Qui porte la faute collective ?'],
    observable_signals: ['Une accusation redonne provisoirement de l unite ou une rivalite depasse l enjeu apparent.'],
    evidence_modes: ['internal_narrative', 'user_clarification', 'public_sources'],
    writing_use: 'Formuler une hypothese de rivalite ou de transfert de faute sans en faire une certitude.',
    inquiry_use: 'Chercher qui gagne en unite lorsque la faute est portee par un acteur unique.',
    scoring_effect: 'La pression augmente si le groupe se stabilise par accusation plutot que par resolution.',
  },
  {
    id: 'material_relations_ideology',
    label_fr: 'Rapports materiels / ideologie',
    traditions: ['Marx'],
    dumezil_functions: ['produce_reproduce', 'legitimize'],
    applies_to: ['team', 'organization', 'institution', 'state', 'community'],
    structure: 'Un recit moral ou naturel masque des rapports de travail, de valeur, de dependance ou d extraction.',
    detects: ['argent', 'travail', 'valeur', 'salaire', 'dependance', 'extraction', 'classe', 'ideologie', 'propriete'],
    questions: ['Qui travaille, qui possede, qui depend, qui capte la valeur ?'],
    observable_signals: ['Un discours moral rend naturel un rapport materiel avantageux pour certains acteurs.'],
    evidence_modes: ['internal_narrative', 'documentary', 'public_sources', 'recherche_plus'],
    writing_use: 'Relier le recit aux interets materiels sans reduire toute la situation a l argent.',
    inquiry_use: 'Chercher contrats, flux d argent, charge de travail, dependances et captation de valeur.',
    scoring_effect: 'La pression augmente si le rapport materiel contredit le recit legitime.',
  },
  {
    id: 'symbolic_opposition_boundary',
    label_fr: 'Oppositions symboliques / frontieres',
    traditions: ['Levi-Strauss'],
    dumezil_functions: ['legitimize'],
    applies_to: ['individual', 'family', 'couple', 'team', 'organization', 'institution', 'state', 'community'],
    structure: 'Une opposition cachee organise la situation jusqu au moment ou un acteur brouille la frontiere.',
    detects: ['ancien', 'nouveau', 'loyaute', 'autonomie', 'terrain', 'siege', 'peuple', 'elite', 'frontiere', 'identite'],
    questions: ['Quelle opposition symbolique la situation essaie-t-elle de reconcilier ?'],
    observable_signals: ['Une reaction forte apparait quand une frontiere stabilisatrice devient floue.'],
    evidence_modes: ['internal_narrative', 'user_clarification', 'public_sources'],
    writing_use: 'Montrer la frontiere symbolique que le conflit rend instable.',
    inquiry_use: 'Chercher les couples d opposition qui reviennent dans les mots des acteurs.',
  },
]

export function selectHumanCollectivePatterns(input: {
  text: string
  max?: number
}): HumanCollectivePatternContext {
  const max = input.max ?? 4
  const haystack = normalize(input.text)

  const matched = HUMAN_COLLECTIVE_PATTERNS.map((pattern) => {
    const hits = pattern.detects.filter((item) => haystack.includes(normalize(item)))
    return { pattern, hits }
  })
    .filter((item) => item.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length)

  const dumezil_balance: Record<DumezilFunction, number> = {
    legitimize: 0,
    protect_fight: 0,
    produce_reproduce: 0,
  }

  for (const item of matched) {
    for (const fn of item.pattern.dumezil_functions) {
      dumezil_balance[fn] += item.hits.length
    }
  }

  return {
    selected_patterns: matched.slice(0, max).map(({ pattern, hits }) => ({
      id: pattern.id,
      label_fr: pattern.label_fr,
      confidence: Math.min(0.88, 0.42 + hits.length * 0.14),
      hypothesis: pattern.structure,
      observable_signal: pattern.observable_signals[0],
      inquiry_question: pattern.questions[0],
    })),
    dumezil_balance,
    trace: {
      total_patterns: HUMAN_COLLECTIVE_PATTERNS.length,
      matched_patterns: matched.length,
      rule: 'patterns_are_lenses_not_conclusions',
    },
  }
}
