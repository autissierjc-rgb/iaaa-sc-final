import type { ResourceContract, SourceChannel } from '@/lib/contracts/resources'

export type CompleteSourceCoverageChannel = 'local_media' | 'official' | 'news_agency'

export type CompleteSourceCoverageResult = {
  required: CompleteSourceCoverageChannel[]
  present: CompleteSourceCoverageChannel[]
  missing: CompleteSourceCoverageChannel[]
  ok: boolean
  note_fr: string
}

const FACTUAL_COMPLETE_CHANNELS: CompleteSourceCoverageChannel[] = [
  'local_media',
  'official',
  'news_agency',
]

function hasChannel(resources: ResourceContract[], channel: SourceChannel): boolean {
  return resources.some((resource) => resource.channel === channel)
}

export function assessCompleteFactualSourceCoverage(
  resources: ResourceContract[],
  required: CompleteSourceCoverageChannel[] = FACTUAL_COMPLETE_CHANNELS,
): CompleteSourceCoverageResult {
  const present = required.filter((channel) => hasChannel(resources, channel))
  const missing = required.filter((channel) => !present.includes(channel))

  return {
    required,
    present,
    missing,
    ok: missing.length === 0,
    note_fr: missing.length === 0
      ? 'Socle probatoire complet : source locale, source officielle et agence/reference disponibles.'
      : `Socle probatoire incomplet pour SC complete factuelle : manque ${missing.join(', ')}.`,
  }
}
