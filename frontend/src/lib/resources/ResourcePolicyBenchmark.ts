import { interpretSituation } from '@/lib/interpretation'
import { planResources } from '@/lib/resources/ResourceService'
import type { FastResourcePolicy, ResourceStatus } from '@/lib/contracts'

export type ResourcePolicyBenchmarkCase = {
  id: string
  label: string
  input: string
  expected_policy: FastResourcePolicy
  expected_needs_web: boolean
}

export type ResourcePolicyBenchmarkResult = ResourcePolicyBenchmarkCase & {
  domain: string
  subject: string
  status: ResourceStatus
  policy: FastResourcePolicy
  needs_web: boolean
  reason: string
  fallback_searches: string[]
  passed: boolean
}

export const RESOURCE_POLICY_BENCHMARK_CASES: ResourcePolicyBenchmarkCase[] = [
  {
    id: 'personal',
    label: 'Personnel',
    input: "Mon fils de 14 ans s'est enferme dans la voiture apres quatre jours de peche sans carpe, comment reagir ?",
    expected_policy: 'internal_context_ok',
    expected_needs_web: false,
  },
  {
    id: 'politics',
    label: 'Politique actuelle',
    input: 'Trump peut-il contester les resultats des elections de mi-mandat ?',
    expected_policy: 'fast_sources_required',
    expected_needs_web: true,
  },
  {
    id: 'enterprise',
    label: 'Entreprise',
    input: "Que fait la compagnie FlexUp et qu'en penser pour eventuellement la rejoindre avec ma startup ?",
    expected_policy: 'fast_sources_required',
    expected_needs_web: true,
  },
  {
    id: 'url',
    label: 'URL',
    input: 'Quelles options de go-to-market pour https://situationcard.com/ ?',
    expected_policy: 'url_extract_required',
    expected_needs_web: true,
  },
  {
    id: 'health',
    label: 'Sante',
    input: 'Que penser de ce nouveau traitement medical dont tout le monde parle ?',
    expected_policy: 'fast_sources_required',
    expected_needs_web: true,
  },
  {
    id: 'conceptual',
    label: 'Conceptuel',
    input: "Comment penser le role d'un contre-pouvoir dans une organisation ?",
    expected_policy: 'internal_context_ok',
    expected_needs_web: false,
  },
]

export async function runResourcePolicyBenchmark(): Promise<ResourcePolicyBenchmarkResult[]> {
  return Promise.all(
    RESOURCE_POLICY_BENCHMARK_CASES.map(async (item) => {
      const interpretation = await interpretSituation({
        raw_input: item.input,
        mode: 'local_contract',
      })
      const resources = planResources({ interpretation })
      const passed =
        resources.policy === item.expected_policy &&
        resources.needs_web === item.expected_needs_web

      return {
        ...item,
        domain: interpretation.header_domain,
        subject: interpretation.header_subject,
        status: resources.status,
        policy: resources.policy,
        needs_web: resources.needs_web,
        reason: resources.policy_reason_fr,
        fallback_searches: resources.fallback_searches,
        passed,
      }
    }),
  )
}
