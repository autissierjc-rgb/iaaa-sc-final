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
  const actors = joinVisible(input.theatre.actors, 'les acteurs directement impliques')
  const institutions = joinVisible(input.theatre.institutions, 'les institutions concernees')
  const evidence = joinVisible(input.expertises_metiers.evidence_to_seek, 'les preuves observables')
  const blindSpot = joinVisible(input.expertises_metiers.blind_spots_to_test, 'ce qui manque au regard')
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

  const lecture = [
    `${subject} met en jeu ${actors}, mais la decision se deplace surtout dans ${institutions}.`,
    `La question utile est de separer la contestation visible de la capacite reelle a produire ${firstProcedure}.`,
    `Le point fragile reste ${blindSpot} : sans ce lien, la lecture reste une hypothese a tester.`,
    `Le signal utile serait ${firstEvidence} reliant un acteur habilite, une regle et une consequence observable.`,
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
      main_vulnerability_fr: compactSentence(`La vulnerabilite centrale est ${blindSpot} : c est la zone ou une crainte peut, ou non, devenir un acte opposable.`),
      asymmetry_fr: compactSentence(`${actors} rendent la tension visible, mais ${institutions} detiennent les leviers qui peuvent la bloquer ou la rendre effective.`),
      key_signal_fr: compactSentence(`Signal cle : ${firstEvidence} relie un acteur habilite, une regle et une consequence observable.`),
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
      analysis_fr: lecture,
      sections_fr: [
        {
          id: 'fond',
          title: 'Fond',
          body: `Acteurs : ${actors}. Institutions : ${institutions}. Preuves a verifier : ${evidence}.`,
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
      notes: ['Deterministic writing contract; final prose remains LLM-backed later.'],
    },
  }
}
