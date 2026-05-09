import type {
  InquiryContract,
  RecherchePlusChannel,
  RecherchePlusContract,
  RecherchePlusRadarTask,
  RecherchePlusSignalStatus,
  ResourceServiceContract,
} from '../contracts'

export type RecherchePlusPlannerInput = {
  resources: ResourceServiceContract
  inquiry: InquiryContract
}

const INTRODUCTION_FR =
  'Recherche+ cherche des pistes et signaux faibles. Ces elements ne sont pas des conclusions. Ils servent a orienter une verification ulterieure.'

const DISCLAIMER_FR =
  'Les resultats de Recherche+ restent separes de SC, Lecture et Approfondir tant qu ils ne sont pas verifies par une source exploitable.'

function signalClassesForFamily(family: RecherchePlusRadarTask['family']): RecherchePlusSignalStatus[] {
  if (family === 'legitimation') {
    return ['solid_source', 'contradiction', 'suspicious_absence', 'next_verification']
  }

  if (family === 'protection_conflict') {
    return ['weak_signal', 'lead', 'contradiction', 'not_accessible']
  }

  return ['lead', 'solid_source', 'suspicious_absence', 'next_verification']
}

function cautionForFamily(family: RecherchePlusRadarTask['family']): string {
  if (family === 'legitimation') {
    return 'Une source officielle peut legitimer une position sans prouver sa solidite operationnelle.'
  }

  if (family === 'protection_conflict') {
    return 'Un signal social ou conflictuel indique une tension possible, pas une causalite etablie.'
  }

  return 'Une preuve d usage, de revenus ou de charge doit etre reliee au contexte exact avant de conclure.'
}

function linkedBlindSpotsFor(question: string, blindSpots: InquiryContract['blind_spots']): string[] {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9À-ÿ]+/i)
    .filter((word) => word.length > 4)

  const linked = blindSpots
    .filter((blindSpot) => {
      const text = [
        blindSpot.blind_spot,
        blindSpot.where_to_look.join(' '),
        blindSpot.decisive_evidence,
      ].join(' ').toLowerCase()
      return words.some((word) => text.includes(word))
    })
    .map((blindSpot) => blindSpot.blind_spot)

  return Array.from(new Set(linked)).slice(0, 3)
}

function buildRadarTasks(input: RecherchePlusPlannerInput): RecherchePlusRadarTask[] {
  return input.resources.functional_needs.map((need) => ({
    family: need.family,
    label_fr: need.label_fr,
    radar_question_fr: need.question_fr,
    channels: need.channels as RecherchePlusChannel[],
    suggested_queries: need.suggested_queries,
    expected_evidence_fr: need.expected_evidence_fr,
    signal_classes: signalClassesForFamily(need.family),
    linked_blind_spots: linkedBlindSpotsFor(need.question_fr, input.inquiry.blind_spots),
    caution_fr: cautionForFamily(need.family),
  }))
}

export function prepareRecherchePlus(input: RecherchePlusPlannerInput): RecherchePlusContract {
  const started = Date.now()
  const radarTasks = buildRadarTasks(input)
  const targets = input.inquiry.blind_spots.slice(0, 5).map((blindSpot) => ({
    blind_spot: blindSpot.blind_spot,
    question: blindSpot.why_it_matters,
    expected_evidence: blindSpot.decisive_evidence,
    allowed_channels: Array.from(new Set(radarTasks.flatMap((task) => task.channels))).slice(0, 6),
    excluded_channels: [],
    safety_note:
      blindSpot.level === 'structural'
        ? 'Angle structurel : chercher des indices convergents, pas une preuve psychologique directe.'
        : undefined,
  }))

  return {
    mode: 'prepared',
    introduction_fr: INTRODUCTION_FR,
    radar_tasks: radarTasks,
    targets,
    findings: [],
    public_disclaimer_fr: DISCLAIMER_FR,
    trace: {
      service: 'RecherchePlusPlanner',
      version: 'v2-passive-radar',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: [
        `radar_tasks=${radarTasks.length}`,
        `targets=${targets.length}`,
        'no_external_fetch=true',
      ],
    },
  }
}
