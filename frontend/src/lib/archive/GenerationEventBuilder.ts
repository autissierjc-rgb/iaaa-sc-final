import { createHash } from 'crypto'
import type {
  DialogueGateContract,
  GenerationArchiveDecision,
  GenerationEvent,
  GenerationPrivacyMode,
  InterpretationContract,
  QualityGateContract,
  ResourceServiceContract,
  ServiceStatus,
} from '@/lib/contracts'

type BuildGenerationEventInput = {
  route: string
  raw_input: string
  interpretation: InterpretationContract
  dialogue: DialogueGateContract
  resources: ResourceServiceContract
  quality: QualityGateContract
  latency_ms: number
  tension_family?: string
}

function hashInput(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function resourceStatusToServiceStatus(status: ResourceServiceContract['status']): ServiceStatus {
  if (status === 'available' || status === 'not_needed') return 'ok'
  if (status === 'partial' || status === 'timeout') return 'partial'
  return 'error'
}

function eventStatus(quality: QualityGateContract): ServiceStatus {
  if (!quality.ok) return 'partial'
  return 'ok'
}

export function decideGenerationArchiveMode(input: {
  is_dry_run?: boolean
  launch_learning_enabled?: boolean
  sensitive?: boolean
}): GenerationArchiveDecision {
  if (input.is_dry_run) {
    return {
      store_event: true,
      store_snapshot: false,
      privacy_mode: 'metadata_only',
      reason: 'Dry-run V2: mesurer le pipeline sans conserver le contenu de carte.',
    }
  }

  if (input.sensitive) {
    return {
      store_event: true,
      store_snapshot: false,
      privacy_mode: 'metadata_only',
      reason: 'Sujet sensible: journaliser seulement les metadonnees de generation.',
    }
  }

  if (input.launch_learning_enabled) {
    return {
      store_event: true,
      store_snapshot: true,
      privacy_mode: 'private_learning_snapshot',
      reason: 'Mode lancement: snapshot prive admin pour apprendre des vraies questions et reponses.',
    }
  }

  return {
    store_event: true,
    store_snapshot: false,
    privacy_mode: 'metadata_only',
    reason: 'Mode standard: mesurer la generation sans conserver la carte par defaut.',
  }
}

export function buildGenerationEvent(input: BuildGenerationEventInput): {
  event: GenerationEvent
  archive_decision: GenerationArchiveDecision
} {
  const archiveDecision = decideGenerationArchiveMode({ is_dry_run: input.route.includes('generate-v2') })
  const privacyMode: GenerationPrivacyMode = archiveDecision.privacy_mode

  return {
    event: {
      id: `gen_${Date.now()}`,
      created_at: new Date().toISOString(),
      language: 'fr',
      surface: 'situation_card',
      privacy_mode: privacyMode,
      raw_input_hash: hashInput(input.raw_input),
      input_chars: input.raw_input.length,
      domain: input.interpretation.domain,
      tension_family: input.tension_family,
      intent: input.interpretation.intent,
      gate_status: input.dialogue.status,
      resources_status: resourceStatusToServiceStatus(input.resources.status),
      resources_count: input.resources.public_sources.length,
      quality_status: input.quality.trace.status,
      generation_status: eventStatus(input.quality),
      latency_ms: input.latency_ms,
      trace: [
        input.interpretation.trace,
        input.resources.trace,
        input.quality.trace,
      ],
    },
    archive_decision: archiveDecision,
  }
}
