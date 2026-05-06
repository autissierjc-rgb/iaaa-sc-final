import type { ExpertisesMetiersContract, InterpretationContract } from '../contracts'
import { getDomainPlaybook } from './domainPlaybooks'
import { getMetierLensesForDomain } from './metierLenses'

export type ExpertisesMetiersRouterInput = {
  interpretation: InterpretationContract
}

function uniqueTyped<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items))
}

function uniqueText(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

export function routeExpertisesMetiers(
  input: ExpertisesMetiersRouterInput,
): ExpertisesMetiersContract {
  const started = Date.now()
  const domain = input.interpretation.domain
  const domainPlaybook = getDomainPlaybook(domain)
  const metierLenses = getMetierLensesForDomain(domain)

  return {
    domain,
    domain_playbook: domainPlaybook,
    metier_lenses: metierLenses,
    source_channels: uniqueTyped([
      ...domainPlaybook.source_channels,
      ...metierLenses.flatMap((lens) => lens.source_preferences),
    ]),
    evidence_to_seek: uniqueText([
      ...domainPlaybook.expected_evidence,
      ...metierLenses.flatMap((lens) => lens.evidence_they_expect),
    ]),
    blind_spots_to_test: uniqueText([
      ...domainPlaybook.common_blind_spots,
      ...metierLenses.flatMap((lens) => lens.blind_spots_they_watch),
    ]),
    probability_markers: domainPlaybook.probability_markers,
    writing_anchors: domainPlaybook.writing_anchors,
    trace: {
      service: 'ExpertisesMetiersRouter',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: [
        `domain=${domain}`,
        `metier_lenses=${metierLenses.length}`,
        'ExpertisesMetiers is an expertise map, not an encyclopedia.',
      ],
    },
  }
}
