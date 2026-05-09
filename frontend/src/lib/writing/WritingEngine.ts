import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  ProbabilityAssessment,
  RiskAdviceGuardContract,
  ScoringContract,
  WritingContract,
} from '../contracts'
import { ASSERTION_LABELS_FR, compactSentence, countWords } from './diamondRules'

export type WritingEngineInput = {
  interpretation: InterpretationContract
  safety: RiskAdviceGuardContract
  expertises_metiers: ExpertisesMetiersContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
}

function joinVisible(items: string[], fallback: string): string {
  return items.length > 0 ? items.slice(0, 4).join(', ') : fallback
}

function normalizeAnchor(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function isPublicPlaceholder(item: string): boolean {
  const normalized = normalizeAnchor(item)
  return [
    'acteurs directs',
    'acteurs visibles',
    'acteurs impliques',
    'personnes impliquees',
    'dirigeant ou candidat nomme',
    'contraintes materielles',
    'regles et institutions',
    'recit dominant',
    'sources externes',
    'general analysis',
    'general_analysis',
    'understand situation',
    'understand_situation',
  ].includes(normalized)
}

function publicAnchors(items: string[], fallback: string, max = 4): string {
  const cleaned = unique(items).filter((item) => !isPublicPlaceholder(item))
  return (cleaned.length > 0 ? cleaned : [fallback]).slice(0, max).join(', ')
}

function namedAction(items: string[], fallback: string): string {
  return items.length > 0 ? items[0] : fallback
}

function tensionLabel(input: WritingEngineInput): string {
  const haystack = [
    input.interpretation.header_subject,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.domain,
  ].join(' ').toLowerCase()

  if (haystack.includes('election') || haystack.includes('certification') || haystack.includes('contester')) {
    return 'la contestation elle-meme'
  }

  if (haystack.includes('startup') || haystack.includes('compagnie') || haystack.includes('site') || haystack.includes('url')) {
    return 'la promesse affichee'
  }

  if (haystack.includes('amie') || haystack.includes('fils') || haystack.includes('famille') || haystack.includes('couple')) {
    return 'le signe affectif'
  }

  return 'l hypothese elle-meme'
}

function probabilityFromTheatre(theatre: ConcreteTheatreContract): ProbabilityAssessment {
  const hasEvidence = theatre.evidence.length > 0
  const hasMissing = theatre.missing_anchors.length > 0
  const status = hasEvidence && !hasMissing ? 'probable' : hasEvidence ? 'plausible' : 'hypothesis'

  return {
    claim_fr: hasEvidence
      ? 'La lecture dispose de premiers appuis, mais leur portee doit rester qualifiee.'
      : 'La lecture reste une hypothese de travail tant que les preuves centrales manquent.',
    status,
    probability_label_fr: ASSERTION_LABELS_FR[status],
    confidence: hasEvidence ? 0.62 : 0.42,
    examples: theatre.evidence.slice(0, 3).map((item) => ({
      text_fr: item.label,
      status: item.level === 'established' ? 'established' : 'plausible',
      source_ids: item.source_ids,
    })),
    missing_proof_fr: hasMissing
      ? `Preuve ou ancre manquante : ${theatre.missing_anchors.slice(0, 3).join(', ')}.`
      : undefined,
  }
}

export function composeDiamondWriting(input: WritingEngineInput): WritingContract {
  const started = Date.now()
  const subject = input.interpretation.object_of_analysis || input.interpretation.situation_soumise
  const title = input.interpretation.header_subject
  const actors = publicAnchors(input.theatre.actors, 'les acteurs habilites')
  const institutions = publicAnchors(input.theatre.institutions, 'les institutions concernees')
  const evidence = publicAnchors(input.expertises_metiers.evidence_to_seek, 'une trace verifiable')
  const blindSpot = publicAnchors(input.expertises_metiers.blind_spots_to_test, 'le relais qui transforme l hypothese en acte')
  const firstProcedure = namedAction(input.theatre.procedures, 'une procedure verifiable')
  const firstEvidence = namedAction(input.expertises_metiers.evidence_to_seek, 'une preuve publique')
  const tension = tensionLabel(input)
  const probability = probabilityFromTheatre(input.theatre)
  const diamondText = compactSentence(
    `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} donnent une forme procedurale a ${firstProcedure}.`,
  )

  const publicWarnings = [
    input.safety.required_disclaimer_fr,
    ...input.scoring.scoring_warnings,
  ].filter((item): item is string => Boolean(item))

  const scInsight = compactSentence(
    `${subject} ne se tranche pas par une declaration seule. Le point decisif est le passage entre ${tension}, ${firstProcedure} et les leviers detenus par ${institutions}.`,
    360,
  )
  const vulnerability = compactSentence(
    `La vulnerabilite centrale est ${blindSpot} : sans ce relais, la situation reste une crainte ; avec lui, elle peut devenir un acte opposable.`,
    320,
  )
  const asymmetry = compactSentence(
    `${actors} rendent la tension visible, mais ${institutions} peuvent lui donner, ou lui refuser, une forme effective.`,
  )
  const keySignal = compactSentence(
    `Signal cle : ${firstEvidence} reliant un acteur habilite, une regle et une consequence observable.`,
  )
  const lecture = [
    `${subject} se joue comme un test de passage : une inquietude ou une hypothese devient serieuse seulement si elle rencontre ${institutions}.`,
    `La scene utile n est donc pas le bruit public, mais la chaine qui relie ${actors}, ${firstProcedure} et ${evidence}.`,
    vulnerability,
    keySignal,
  ].join(' ')
  const approfondirAnalysis = [
    `Le fond de la situation tient a la transformation possible d un recit en procedure.`,
    `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
    `Ce qu il faut etablir n est pas seulement l intention, mais le lien entre ${firstProcedure}, ${evidence} et ${blindSpot}.`,
    `La lecture reste donc prudente : ${probability.probability_label_fr.toLowerCase()}, tant que la preuve decisive manque.`,
  ].join(' ')

  return {
    substance_form: {
      substance_fr: [
        'structure reelle',
        'vulnerabilite centrale',
        'preuves et seuils',
        'probabilites explicites',
      ],
      form_fr: [
        'essai court',
        'phrases nettes',
        'tension narrative',
        'phrase diamant memorisable',
      ],
      diamond_sentence: {
        text_fr: diamondText,
        role: 'thesis',
        must_be_public: true,
      },
    },
    diamond_sentences: [
      {
        text_fr: diamondText,
        role: 'thesis',
        must_be_public: true,
      },
      {
        text_fr: compactSentence(`Le point fragile est ${blindSpot}.`),
        role: 'vulnerability',
        must_be_public: true,
      },
    ],
    probability_assessments: [probability],
    situation_card: {
      title_fr: title,
      submitted_situation_fr: input.interpretation.situation_soumise,
      insight_fr: scInsight,
      main_vulnerability_fr: vulnerability,
      asymmetry_fr: asymmetry,
      key_signal_fr: keySignal,
    },
    trajectories: [
      {
        type: 'stabilization',
        title_fr: 'Clarification',
        description_fr: 'La situation se clarifie si un acteur habilite confirme publiquement son role ou ses limites.',
        signal_fr: `Un element verifiable apparait : ${firstEvidence}.`,
      },
      {
        type: 'escalation',
        title_fr: 'Tension accrue',
        description_fr: 'La pression augmente si la contestation trouve un relais capable de ralentir ou delegitimer la procedure.',
        signal_fr: `Le manque critique reste : ${blindSpot}.`,
      },
      {
        type: 'regime_shift',
        title_fr: 'Bascule',
        description_fr: 'La logique change quand une preuve, une regle ou un acteur transforme l hypothese en fait opposable.',
        signal_fr: 'Une decision, un document, une action ou un seuil rend la lecture non reversible.',
      },
    ],
    lecture: {
      text_fr: lecture,
      word_count_fr: countWords(lecture),
    },
    approfondir: {
      analysis_fr: approfondirAnalysis,
      sections_fr: [
        {
          id: 'fond',
          title: 'Fond',
          body: `La question porte sur une transformation : ce qui est dit ou redoute peut-il devenir une action reconnue par ${institutions} ? Les acteurs a suivre sont ${actors}.`,
        },
        {
          id: 'forme',
          title: 'Forme',
          body: diamondText,
        },
        {
          id: 'probabilites',
          title: 'Probabilites',
          body: `${probability.probability_label_fr} : ${probability.claim_fr} La preuve qui ferait changer le statut est ${firstEvidence}.`,
        },
        {
          id: 'angles-morts',
          title: 'Incertitudes / angles morts',
          body: `A verifier : ${blindSpot}. Ces points doivent etre relies a ${evidence}, sans quoi ils restent des hypotheses.`,
        },
      ],
    },
    public_warnings: publicWarnings,
    trace: {
      service: 'WritingEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: ['Deterministic writing contract; final prose remains LLM-backed later.'],
    },
  }
}
