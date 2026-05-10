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

function playbookDomainFor(interpretation: InterpretationContract) {
  const text = [
    interpretation.raw_input,
    interpretation.situation_soumise,
    interpretation.object_of_analysis,
    interpretation.angle,
  ].join(' ')

  if (
    interpretation.domain === 'geopolitics' &&
    /\b(election|elections|electoral|midterm|mi[- ]mandat|resultat|resultats|certification|contester|contestation|coup d[' ]?etat|congres|cour supreme)\b/i.test(text)
  ) {
    return 'institutional_crisis' as const
  }

  if (
    interpretation.domain === 'professional' &&
    /\b(startup|start-up|entreprise|compagnie|societe|société|partenariat|rejoindre|go[- ]to[- ]market|marche|marché|client|pricing|revenu|traction|produit|offre)\b/i.test(text)
  ) {
    return 'startup_market' as const
  }

  return interpretation.domain
}

export function routeExpertisesMetiers(
  input: ExpertisesMetiersRouterInput,
): ExpertisesMetiersContract {
  const started = Date.now()
  const domain = input.interpretation.domain
  const playbookDomain = playbookDomainFor(input.interpretation)
  const domainPlaybook = getDomainPlaybook(playbookDomain)
  const metierLenses = getMetierLensesForDomain(playbookDomain)

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
        `playbook_domain=${playbookDomain}`,
        `metier_lenses=${metierLenses.length}`,
        'ExpertisesMetiers is an expertise map, not an encyclopedia.',
      ],
    },
  }
}
