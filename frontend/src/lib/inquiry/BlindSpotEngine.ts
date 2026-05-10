import type {
  BlindSpotInquiry,
  BlindSpotLevel,
  InquiryContract,
} from '@/lib/contracts/inquiry'
import type { InterpretationContract } from '@/lib/contracts/interpretation'
import type { ConcreteTheatreContract } from '@/lib/contracts/theatre'

export type BlindSpotEngineInput = {
  interpretation: Pick<InterpretationContract, 'domain' | 'situation_soumise' | 'angle' | 'user_need'>
  theatre: Pick<
    ConcreteTheatreContract,
    'actors' | 'institutions' | 'procedures' | 'constraints' | 'evidence' | 'unknowns'
  >
}

function levelFor(item: string): BlindSpotLevel {
  if (
    /\bpreuve|document|source|url|client|revenu|certification|contrat|decision|publication|recours|contentieux|tribunal|cour supreme\b/i.test(
      item,
    )
  ) {
    return 'documentary'
  }
  if (
    /\bintention|peur|loyaute|relation|confiance|non[- ]dit|dependance|pouvoir reel|pression|relais|precedent\b/i.test(
      item,
    )
  ) {
    return 'structural'
  }
  return 'declarative'
}

function hasAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern))
}

function isBusinessDomain(domain: string) {
  return [
    'startup_market',
    'business_strategy',
    'product_platform',
    'professional',
    'management',
    'company_governance',
  ].includes(domain)
}

function situatedInquiry(
  item: string,
  input: BlindSpotEngineInput,
): Pick<
  BlindSpotInquiry,
  'why_it_matters' | 'where_to_look' | 'observable_signal' | 'decisive_evidence' | 'counter_hypothesis'
> | null {
  const normalized = item.toLowerCase()
  const domain = input.interpretation.domain

  if (
    (domain === 'geopolitics' || domain === 'institutional_crisis') &&
    hasAny(normalized, [
      'certification',
      'recours',
      'contentieux',
      'tribunal',
      'cour supreme',
      'congres',
      'etat',
      'election',
      'janvier 2021',
      'responsable electoral',
      'gouverneur',
      'parti',
      'relais institutionnel',
      'regle exploitable',
      'acteur capable',
      'bloquer',
      'pression',
    ])
  ) {
    if (normalized.includes('relais institutionnel')) {
      return {
        why_it_matters:
          'Le risque ne vient pas seulement de Trump ; il devient institutionnel si des relais acceptent de donner une procedure a la contestation.',
        where_to_look: [
          'Parti republicain',
          'responsables electoraux locaux',
          'gouverneurs',
          'Congres',
          'tribunaux',
        ],
        observable_signal:
          'Un responsable ou une institution reprend la contestation et la transforme en refus, recours, consigne ou delai officiel.',
        decisive_evidence:
          'Une prise de position, un acte procedural ou un document reliant la contestation de Trump a un relais institutionnel identifiable.',
        counter_hypothesis:
          'Trump peut contester publiquement sans bascule si aucun relais institutionnel ne convertit ce refus en procedure.',
      }
    }

    if (normalized.includes('regle exploitable')) {
      return {
        why_it_matters:
          'Une crise electorale progresse souvent par une regle utilisee a contre-emploi : delai, recours, certification, recomptage ou competence locale.',
        where_to_look: [
          'regles de certification des Etats',
          'delais de recours',
          'procedures de recomptage',
          'reglements du Congres',
          'decisions de justice',
        ],
        observable_signal:
          'Une regle ordinaire est invoquee pour retarder, contester ou delegitimer un resultat dans un Etat cle.',
        decisive_evidence:
          'Un texte, un recours ou une decision montrant quelle regle precise est mobilisee pour bloquer ou deplacer le resultat.',
        counter_hypothesis:
          'La contestation reste limitee si les regles disponibles ne permettent pas de retarder ou modifier les etapes electorales.',
      }
    }

    if (normalized.includes('acteur capable') || normalized.includes('bloquer')) {
      return {
        why_it_matters:
          'La question decisive est de savoir qui possede reellement un levier : certifier, retarder, juger, mobiliser ou legitimer.',
        where_to_look: [
          'autorites electorales locales',
          'secretaires d Etat',
          'gouverneurs',
          'juges',
          'leaders partisans',
        ],
        observable_signal:
          'Un acteur disposant d un levier formel annonce un refus, retarde une etape ou soutient une contestation procedurale.',
        decisive_evidence:
          'Un acte public d un acteur habilite : refus de certification, recours depose, injonction judiciaire, consigne partisane ou calendrier modifie.',
        counter_hypothesis:
          'Le risque reste surtout narratif si les acteurs capables de bloquer maintiennent les procedures ordinaires.',
      }
    }

    if (normalized.includes('pression')) {
      return {
        why_it_matters:
          'La pression devient dangereuse quand elle cible les personnes qui administrent ou valident le resultat.',
        where_to_look: [
          'responsables electoraux locaux',
          'menaces publiques',
          'consignes de mobilisation',
          'medias allies',
          'reactions des autorites',
        ],
        observable_signal:
          'Des responsables electoraux sont nommes, menaces, pousses a retarder ou a justifier publiquement leur decision.',
        decisive_evidence:
          'Une trace de pression coordonnee : declaration, campagne, menace documentee, plainte ou mesure de protection.',
        counter_hypothesis:
          'Une pression diffuse peut augmenter le bruit politique sans produire de blocage si les responsables restent proteges et suivis.',
      }
    }

    if (normalized.includes('certification')) {
      return {
        why_it_matters:
          'La certification est le passage ou une contestation electorale peut devenir un blocage institutionnel.',
        where_to_look: [
          'autorites electorales locales',
          'secretaires d Etat des Etats',
          'gouverneurs',
          'calendrier officiel de certification',
        ],
        observable_signal:
          'Un Etat cle retarde, refuse ou conditionne publiquement la certification des resultats.',
        decisive_evidence:
          'Une decision officielle, un proces-verbal, un recours ou une declaration d autorite electorale montrant que la certification change de statut.',
        counter_hypothesis:
          'La contestation peut rester rhetorique si chaque Etat certifie dans les delais et si les recours n interrompent pas la procedure.',
      }
    }

    if (normalized.includes('recours') || normalized.includes('contentieux')) {
      return {
        why_it_matters:
          'Le contentieux indique si la crainte reste politique ou si elle entre dans une strategie procedurale coordonnee.',
        where_to_look: ['tribunaux', 'dossiers de recours', 'calendrier judiciaire', 'equipes juridiques des partis'],
        observable_signal:
          'Des recours similaires sont deposes dans plusieurs Etats cle avec le meme argument ou le meme calendrier.',
        decisive_evidence:
          'Un depot de recours, une ordonnance judiciaire ou une coordination documentee qui relie la contestation a une procedure.',
        counter_hypothesis:
          'Des recours isoles ou rejetes rapidement peuvent signaler une contestation visible sans capacite de blocage durable.',
      }
    }

    if (normalized.includes('tribunal') || normalized.includes('cour supreme')) {
      return {
        why_it_matters:
          'L arbitrage judiciaire peut transformer un conflit politique en contrainte legale qui modifie le calendrier ou la validation.',
        where_to_look: ['tribunaux federaux', 'cours des Etats', 'Cour supreme', 'decisions et injonctions publiees'],
        observable_signal:
          'Une decision judiciaire suspend, valide ou reconfigure une etape electorale decisive.',
        decisive_evidence:
          'Une decision de justice qui affecte directement certification, depouillement, recomptage ou delai electoral.',
        counter_hypothesis:
          'Si les tribunaux refusent d intervenir ou confirment les procedures ordinaires, le risque reste politiquement fort mais institutionnellement contenu.',
      }
    }

    if (normalized.includes('janvier 2021') || normalized.includes('precedent')) {
      return {
        why_it_matters:
          'Le precedent du 6 janvier 2021 change ce qui parait imaginable, mais il ne prouve pas a lui seul une repetition.',
        where_to_look: ['discours publics', 'consignes de mobilisation', 'relais militants', 'reactions des institutions de securite'],
        observable_signal:
          'La rhetorique de fraude se combine avec des appels a mobilisation ou une pression explicite sur des responsables.',
        decisive_evidence:
          'Une coordination publique ou documentee entre recit de fraude, mobilisation et cible institutionnelle precise.',
        counter_hypothesis:
          'Le precedent peut seulement amplifier la perception du risque sans produire les relais necessaires a une nouvelle crise.',
      }
    }

    return {
      why_it_matters:
        'Dans une crise electorale, le risque devient reel quand un acteur ou une institution donne une forme procedurale au refus.',
      where_to_look: [
        'Congres',
        'Etats federes',
        'Parti republicain',
        'autorites electorales',
        'medias allies',
      ],
      observable_signal:
        'Un acteur capable de bloquer change de registre : consigne, refus, recours, pression publique ou decision officielle.',
      decisive_evidence:
        'Une trace reliant un acteur nomme, une regle electorale et un geste concret : refus de certification, recours coordonne ou pression sur une autorite locale.',
      counter_hypothesis:
        'La crainte peut rester une alerte sans bascule si les relais partisans, judiciaires et administratifs ne s alignent pas.',
    }
  }

  if (
    isBusinessDomain(domain) ||
    hasAny(normalized, [
      'client',
      'revenu',
      'traction',
      'juridique',
      'legal',
      'partenariat',
      'startup',
      'entreprise',
      'compagnie',
      'societe',
      'offre',
      'produit',
      'marche',
      'business model',
      'modele economique',
      'pricing',
      'prix',
      'contrat',
      'integration',
      'donnees',
      'responsabilite',
      'decision d achat',
    ])
  ) {
    if (
      hasAny(normalized, [
        'client',
        'usage',
        'adoption',
        'reference',
        'temoignage',
        'cas client',
        'utilisateur',
      ])
    ) {
      return {
        why_it_matters:
          'Un client identifiable separe une promesse de marche d une preuve d adoption.',
        where_to_look: ['site officiel', 'temoignages publics', 'cas clients', 'LinkedIn', 'communiques'],
        observable_signal:
          'Un client nomme, un cas d usage public ou une reference verifiable confirme que l offre est utilisee.',
        decisive_evidence:
          'Un client identifiable, un usage repete ou un temoignage public relie a un cas concret.',
        counter_hypothesis:
          'L absence de client public ne prouve pas l absence de traction, mais oblige a rester prudent sur la validation marche.',
      }
    }

    if (
      hasAny(normalized, [
        'revenu',
        'traction',
        'croissance',
        'vente',
        'pricing',
        'prix',
        'monetisation',
        'modele economique',
        'business model',
        'financement',
        'investisseur',
      ])
    ) {
      return {
        why_it_matters:
          'La traction montre si l interet declare devient adoption, paiement ou repetition d usage.',
        where_to_look: ['pricing', 'jobs', 'investisseurs', 'communiques', 'registres publics', 'produit'],
        observable_signal:
          'Des revenus, une croissance d usage, des recrutements ou des contrats rendent la progression visible.',
        decisive_evidence:
          'Une trace de revenus, d usage repete, de contrat signe ou de decision d achat.',
        counter_hypothesis:
          'Une startup peut etre en phase d exploration ; le manque de traction visible peut venir du stade, pas de l absence de potentiel.',
      }
    }

    if (
      hasAny(normalized, [
        'droit',
        'legal',
        'juridique',
        'statut',
        'salarial',
        'travail',
        'societes',
        'fiscal',
        'reglementaire',
        'responsabilite',
        'conformite',
        'conditions juridiques',
      ])
    ) {
      return {
        why_it_matters:
          'Le cadre juridique peut renverser l evaluation si le modele touche au travail, au capital, aux contrats ou a la responsabilite.',
        where_to_look: ['mentions legales', 'conditions d utilisation', 'cadre social et fiscal', 'avocat qualifie', 'regulateurs'],
        observable_signal:
          'Une clause, une limite reglementaire ou une obligation sociale change les conditions d adoption.',
        decisive_evidence:
          'Un texte applicable, une clause contractuelle ou un avis qualifie qui precise ce qui est possible, risque ou interdit.',
        counter_hypothesis:
          'Le risque juridique peut etre deja traite par la structure contractuelle si les roles, responsabilites et statuts sont clairement definis.',
      }
    }

    if (
      hasAny(normalized, [
        'role',
        'place',
        'partenariat',
        'rejoindre',
        'alliance',
        'integration',
        'conditions d entree',
        'conditions de sortie',
        'pouvoir de decision',
        'dependance',
        'exclusivite',
      ])
    ) {
      return {
        why_it_matters:
          'La place exacte dans le partenariat decide si la startup gagne un levier, un client, une dependance ou une contrainte nouvelle.',
        where_to_look: ['conditions d entree', 'contrat propose', 'modele de revenus', 'droits de decision', 'obligations reciproques'],
        observable_signal:
          'Le role devient clair quand le partenariat nomme qui decide, qui paie, qui porte le risque et qui peut sortir.',
        decisive_evidence:
          'Une clarification du role exact, du pouvoir de decision, des engagements reciproques et des conditions de sortie.',
        counter_hypothesis:
          'Le partenariat peut rester interessant si la place de la startup est limitee, reversible et compatible avec ses propres priorites.',
      }
    }

    if (
      hasAny(normalized, [
        'offre',
        'produit',
        'promesse',
        'proposition',
        'service',
        'fonctionnalite',
        'segment',
        'cible',
        'marche',
      ])
    ) {
      return {
        why_it_matters:
          'L evaluation change selon que l offre repond a un besoin precis, a un segment identifiable ou seulement a une promesse generale.',
        where_to_look: ['site officiel', 'documentation produit', 'pricing', 'cas d usage', 'segments clients', 'concurrents directs'],
        observable_signal:
          'La promesse devient verifiable quand elle nomme un utilisateur, un probleme, un usage repete et une condition d achat.',
        decisive_evidence:
          'Une trace reliant offre, cible, cas d usage et preuve d adoption : page produit, demonstration, client public, contrat ou usage documente.',
        counter_hypothesis:
          'Une offre encore peu documentee peut rester prometteuse si le partenariat donne un acces teste, limite et reversible au marche vise.',
      }
    }

    if (hasAny(normalized, ['donnee', 'data', 'integration', 'api', 'securite', 'infrastructure', 'technique'])) {
      return {
        why_it_matters:
          'Une cooperation startup peut echouer moins par le marche que par l integration technique, les donnees, la securite ou la dependance operationnelle.',
        where_to_look: ['documentation technique', 'API', 'politique de donnees', 'conditions de securite', 'SLA', 'retours utilisateurs'],
        observable_signal:
          'Une contrainte technique devient visible quand elle impose un delai, une dependance, un risque donnees ou un cout d integration.',
        decisive_evidence:
          'Une documentation, un test d integration, une clause de responsabilite ou une contrainte de donnees qui montre ce que la startup devra porter.',
        counter_hypothesis:
          'Le risque technique peut etre acceptable si l integration est borne, testable et sans dependance critique pour le coeur de produit.',
      }
    }

    return {
      why_it_matters:
        'Dans une decision entreprise ou startup, le risque est de confondre l interet apparent, la preuve d usage, le cadre contractuel et la place reelle dans l accord.',
      where_to_look: [
        'site officiel',
        'page produit',
        'pricing',
        'cas clients',
        'LinkedIn',
        'offres d emploi',
        'mentions legales',
        'conditions contractuelles',
      ],
      observable_signal:
        'Un element public ou contractuel montre qui utilise, qui paie, qui decide, qui porte le risque ou qui peut bloquer le partenariat.',
      decisive_evidence:
        'Une trace reliant offre, client ou cas d usage, conditions d engagement et role concret de la startup : contrat, pricing, cas client, preuve d usage, clause ou decision d achat.',
      counter_hypothesis:
        'L opportunite peut rester pertinente meme avec peu de preuves publiques si l engagement est exploratoire, limite, reversible et compatible avec la strategie de la startup.',
    }
  }

  if (
    domain === 'family' ||
    domain === 'couple' ||
    hasAny(normalized, ['relation', 'confiance', 'peur', 'non-dit', 'dependance', 'role'])
  ) {
    return {
      why_it_matters:
        'Dans une situation relationnelle, l angle mort peut etre le sens donne au geste par chacun, pas seulement le fait visible.',
      where_to_look: ['mots exacts', 'chronologie du lien', 'gestes apres le message', 'disponibilite reelle', 'limites posees'],
      observable_signal:
        'Une parole plus claire, un rendez-vous propose, un evitement repete ou une coherence entre mots et actes rend le lien lisible.',
      decisive_evidence:
        'Une clarification situee : ce que la personne veut, ce qu elle peut faire, ce qu elle evite et ce que l utilisateur attend vraiment.',
      counter_hypothesis:
        'Le signe peut exprimer une affection sincere sans annoncer une intention plus large ; la projection peut remplir ce que le message ne dit pas.',
    }
  }

  return null
}

function inquiryFor(item: string, input: BlindSpotEngineInput): BlindSpotInquiry {
  const level = levelFor(item)
  const actors = input.theatre.actors.slice(0, 3)
  const institutions = input.theatre.institutions.slice(0, 3)
  const situated = situatedInquiry(item, input)

  return {
    blind_spot: item,
    level,
    evidence_level: level === 'documentary' ? 'missing' : level === 'structural' ? 'uncertain' : 'plausible',
    why_it_matters:
      situated?.why_it_matters ??
      'Cet angle mort peut modifier la lecture s il revele un acteur, une contrainte ou une preuve plus decisive que les signaux visibles.',
    where_to_look:
      situated?.where_to_look ??
      (level === 'documentary'
        ? ['sources officielles', 'documents publics', 'articles fiables', 'traces datables']
        : level === 'structural'
          ? ['chronologie relationnelle', 'roles reels', 'dependances cachees', 'contre-hypotheses']
          : ['question utilisateur', 'contexte manquant', 'precision factuelle']),
    who_can_confirm:
      actors.length > 0 || institutions.length > 0
        ? [...actors, ...institutions]
        : ['utilisateur', 'acteur direct', 'source fiable'],
    observable_signal:
      situated?.observable_signal ??
      'Un fait, une decision, un message, un document ou un changement de comportement rend cet angle visible.',
    decisive_evidence:
      situated?.decisive_evidence ??
      (level === 'documentary'
        ? 'Une source verifiable qui confirme ou infirme directement le point manquant.'
        : 'Une reponse situee qui nomme l acteur concerne, le geste attendu, la contrainte et la consequence observable.'),
    counter_hypothesis:
      situated?.counter_hypothesis ??
      'La lecture actuelle peut rester valable si cet angle mort n a pas de lien causal avec la decision ou la tension observee.',
  }
}

export function buildBlindSpotInquiry(input: BlindSpotEngineInput): InquiryContract {
  const started = Date.now()
  const candidates = [
    ...input.theatre.unknowns,
    ...input.theatre.procedures.filter((procedure) => /certification|recours|contentieux|decision|preuve|verification/i.test(procedure)),
    ...input.theatre.constraints.filter((constraint) => /regle|argent|temps|preuve|relation|decision|institution/i.test(constraint)),
  ]

  const unique = Array.from(new Set(candidates.map((item) => item.trim()).filter(Boolean))).slice(0, 5)
  const blind_spots = unique.map((item) => inquiryFor(item, input))

  return {
    blind_spots,
    should_offer_inquiry: blind_spots.length > 0,
    inquiry_button_label_fr: 'Lancer l’enquete',
    inquiry_button_label_en: 'Start inquiry',
    trace: {
      service: 'BlindSpotEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: blind_spots.length > 0 ? 'ok' : 'partial',
      notes: [`blind_spots=${blind_spots.length}`],
    },
  }
}
