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
  const actors = joinVisible(input.theatre.actors, 'les acteurs directement impliques')
  const evidence = joinVisible(input.expertises_metiers.evidence_to_seek, 'les preuves observables')
  const blindSpot = joinVisible(input.expertises_metiers.blind_spots_to_test, 'ce qui manque au regard')
  const probability = probabilityFromTheatre(input.theatre)
  const diamondText = compactSentence(
    `${subject} ne se comprend pas par son recit seul : la bascule se joue quand ${actors} transforment ${evidence} en decision observable.`,
  )

  const publicWarnings = [
    input.safety.required_disclaimer_fr,
    ...input.scoring.scoring_warnings,
  ].filter((item): item is string => Boolean(item))

  const lecture = [
    `${subject} doit etre lu par son theatre reel : ${actors}.`,
    `Le fond de la carte tient a la difference entre ce qui est affirme, ce qui est probable et ce qui reste a prouver.`,
    `Le point fragile se situe dans ${blindSpot}.`,
    `Le signal utile est le moment ou ${evidence} devient verifiable, public ou opposable.`,
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
      title_fr: input.interpretation.header_subject,
      submitted_situation_fr: input.interpretation.situation_soumise,
      insight_fr: compactSentence(lecture, 420),
      main_vulnerability_fr: compactSentence(`Le point fragile est ${blindSpot}.`),
      asymmetry_fr: compactSentence(`Ce qui est visible chez ${actors} peut masquer ${blindSpot}.`),
      key_signal_fr: compactSentence(`Signal cle : ${evidence} devient observable ou verifiable.`),
    },
    trajectories: [
      {
        type: 'stabilization',
        title_fr: 'Clarification',
        description_fr: 'La situation se clarifie si les preuves attendues confirment le role des acteurs nommes.',
        signal_fr: `Un element verifiable apparait : ${evidence}.`,
      },
      {
        type: 'escalation',
        title_fr: 'Tension accrue',
        description_fr: 'La pression augmente si le recit devient plus fort que les preuves disponibles.',
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
      analysis_fr: lecture,
      sections_fr: [
        {
          id: 'fond',
          title: 'Fond',
          body: `Acteurs : ${actors}. Preuves attendues : ${evidence}.`,
        },
        {
          id: 'forme',
          title: 'Forme',
          body: diamondText,
        },
        {
          id: 'probabilites',
          title: 'Probabilites',
          body: `${probability.probability_label_fr} : ${probability.claim_fr}`,
        },
      ],
    },
    public_warnings: publicWarnings,
    trace: {
      service: 'WritingEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: ['Passive deterministic writing scaffold; final prose remains LLM-backed later.'],
    },
  }
}
