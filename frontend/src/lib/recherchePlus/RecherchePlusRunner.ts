import type {
  RecherchePlusContract,
  RecherchePlusFinding,
  RecherchePlusRadarTask,
  RecherchePlusSignalStatus,
} from '../contracts'

export type RecherchePlusRunInput = {
  contract: RecherchePlusContract
  mode?: 'simulated'
}

function statusForTask(task: RecherchePlusRadarTask): RecherchePlusSignalStatus {
  if (task.signal_classes.includes('next_verification')) return 'next_verification'
  if (task.signal_classes.includes('lead')) return 'lead'
  return task.signal_classes[0] ?? 'lead'
}

function titleForStatus(status: RecherchePlusSignalStatus, label: string): string {
  if (status === 'solid_source') return `Source solide a rechercher - ${label}`
  if (status === 'contradiction') return `Contradiction possible a tester - ${label}`
  if (status === 'weak_signal') return `Signal faible a surveiller - ${label}`
  if (status === 'suspicious_absence') return `Absence suspecte a verifier - ${label}`
  if (status === 'not_accessible') return `Source potentiellement inaccessible - ${label}`
  if (status === 'next_verification') return `Verification suivante - ${label}`
  return `Piste a ouvrir - ${label}`
}

function simulatedFinding(task: RecherchePlusRadarTask): RecherchePlusFinding {
  const status = statusForTask(task)
  const channel = task.channels[0] ?? 'other'
  const evidence = task.expected_evidence_fr[0] ?? 'trace verifiable'

  return {
    target_blind_spot: task.linked_blind_spots[0] ?? task.label_fr,
    status,
    channel,
    source_title: titleForStatus(status, task.label_fr),
    retrieved_at: new Date().toISOString(),
    what_it_suggests: `Recherche+ devra chercher ${evidence} via ${channel} pour tester ${task.radar_question_fr}`,
    what_it_does_not_prove:
      'Cette sortie simule le cadrage probatoire. Elle ne prouve encore aucun fait externe.',
    next_verification_step: task.suggested_queries[0]
      ? `Lancer une recherche ciblee : ${task.suggested_queries[0]}`
      : 'Lancer une recherche ciblee sur la preuve attendue.',
  }
}

export function runRecherchePlus(input: RecherchePlusRunInput): RecherchePlusContract {
  const started = Date.now()
  const findings = input.contract.radar_tasks.map(simulatedFinding)

  return {
    ...input.contract,
    mode: 'completed',
    findings,
    trace: {
      service: 'RecherchePlusRunner',
      version: 'v2-simulated',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: [
        `mode=${input.mode ?? 'simulated'}`,
        `findings=${findings.length}`,
        'external_fetch=false',
      ],
    },
  }
}
