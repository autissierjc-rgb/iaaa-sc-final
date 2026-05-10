import {
  DEFAULT_CTO_WATCH_GUARDS,
  DEFAULT_CTO_WATCH_THRESHOLDS,
  type CtoWatchEvaluation,
  type CtoWatchMetricInput,
  type CtoWatchReport,
  type CtoWatchSeverity,
  type CtoWatchThreshold,
} from '@/lib/contracts/ctoWatch'
import type { TraceMeta } from '@/lib/contracts/common'
import type { GenerationEvent } from '@/lib/contracts/generationArchive'

type GenerationEventForWatch = Pick<
  GenerationEvent,
  'latency_ms' | 'generation_status' | 'resources_status' | 'resources_count' | 'trace' | 'error_kind'
>

function severityRank(severity: CtoWatchSeverity): number {
  if (severity === 'critical') return 2
  if (severity === 'watch') return 1
  return 0
}

function evaluateThreshold(value: number, threshold: CtoWatchThreshold): CtoWatchSeverity {
  if (threshold.direction === 'max') {
    if (value >= threshold.critical_at) return 'critical'
    if (value >= threshold.watch_at) return 'watch'
    return 'ok'
  }

  if (value <= threshold.critical_at) return 'critical'
  if (value <= threshold.watch_at) return 'watch'
  return 'ok'
}

function formatMetricValue(value: number, unit: CtoWatchThreshold['unit']): string {
  if (unit === 'rate') return `${Math.round(value * 1000) / 10}%`
  if (unit === 'percent') return `${value}%`
  if (unit === 'eur') return `${value} EUR/h`
  return `${value} ms`
}

function buildMessage(value: number, threshold: CtoWatchThreshold, severity: CtoWatchSeverity): string {
  const formatted = formatMetricValue(value, threshold.unit)
  if (severity === 'critical') return `${threshold.label_fr} critique (${formatted}). ${threshold.reason_fr}`
  if (severity === 'watch') return `${threshold.label_fr} a surveiller (${formatted}). ${threshold.reason_fr}`
  return `${threshold.label_fr} OK (${formatted}).`
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[index] ?? 0
}

function traceContains(trace: TraceMeta[] | undefined, pattern: RegExp): boolean {
  if (!trace?.length) return false
  return trace.some((item) =>
    [
      item.service,
      item.model,
      item.status,
      item.notes?.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .match(pattern),
  )
}

export function buildCtoWatchMetricsFromEvents(params: {
  events: GenerationEventForWatch[]
  estimated_hourly_cost_eur?: number
  shared_card_cache_hit_rate?: number
}): CtoWatchMetricInput[] {
  const events = params.events
  const total = events.length
  const denominator = total || 1
  const errored = events.filter((event) => event.generation_status === 'error').length
  const missingSources = events.filter(
    (event) => event.resources_status === 'partial' || event.resources_status === 'error' || event.resources_count === 0,
  ).length
  const fallback = events.filter(
    (event) => event.error_kind?.includes('fallback') || traceContains(event.trace, /fallback/i),
  ).length
  const providerErrors = events.filter(
    (event) => event.error_kind?.includes('provider') || traceContains(event.trace, /provider|openai|anthropic|tavily/i),
  ).length

  return [
    { id: 'public_fast_p95_ms', value: percentile(events.map((event) => event.latency_ms), 95) },
    { id: 'generation_error_rate', value: errored / denominator },
    { id: 'missing_required_sources_rate', value: missingSources / denominator },
    { id: 'fallback_rate', value: fallback / denominator },
    { id: 'provider_error_rate', value: providerErrors / denominator },
    { id: 'estimated_hourly_cost_eur', value: params.estimated_hourly_cost_eur ?? 0 },
    { id: 'shared_card_cache_hit_rate', value: params.shared_card_cache_hit_rate ?? 1 },
  ]
}

export function buildCtoWatchReport(params: {
  metrics: CtoWatchMetricInput[]
  thresholds?: CtoWatchThreshold[]
  generated_at?: string
}): CtoWatchReport {
  const thresholds = params.thresholds ?? DEFAULT_CTO_WATCH_THRESHOLDS
  const values = new Map(params.metrics.map((metric) => [metric.id, metric.value]))

  const evaluations: CtoWatchEvaluation[] = thresholds.map((threshold) => {
    const value = values.get(threshold.id) ?? 0
    const severity = evaluateThreshold(value, threshold)

    return {
      id: threshold.id,
      label_fr: threshold.label_fr,
      value,
      unit: threshold.unit,
      severity,
      threshold: {
        direction: threshold.direction,
        watch_at: threshold.watch_at,
        critical_at: threshold.critical_at,
      },
      message_fr: buildMessage(value, threshold, severity),
    }
  })

  const status = evaluations.reduce<CtoWatchSeverity>(
    (current, evaluation) =>
      severityRank(evaluation.severity) > severityRank(current) ? evaluation.severity : current,
    'ok',
  )

  const recommendedActions = evaluations
    .filter((evaluation) => evaluation.severity !== 'ok')
    .map((evaluation) => {
      if (evaluation.id === 'shared_card_cache_hit_rate') {
        return 'Verifier CDN, headers cache et lecture snapshot des cartes partagees.'
      }
      if (evaluation.id === 'estimated_hourly_cost_eur') {
        return 'Ralentir generation, augmenter cache, activer quota ou basculer certains flux en file.'
      }
      if (evaluation.id === 'missing_required_sources_rate') {
        return 'Degrader le verdict qualite et inspecter ResourceService / sources rapides.'
      }
      if (evaluation.id === 'provider_error_rate') {
        return 'Basculer provider, reduire timeouts et afficher fallback dans le cockpit.'
      }
      if (evaluation.id === 'fallback_rate') {
        return 'Verifier le LLM referent, les timeouts et les causes de fallback.'
      }
      return 'Inspecter la couche concernee et limiter le flux si le seuil critique persiste.'
    })

  return {
    status,
    generated_at: params.generated_at ?? new Date().toISOString(),
    mode: 'passive_contract',
    should_alert: status === 'critical',
    alert_channels: status === 'critical' ? ['admin_cockpit', 'email'] : ['admin_cockpit'],
    evaluations,
    recommended_actions: Array.from(new Set(recommendedActions)),
    guardrails: DEFAULT_CTO_WATCH_GUARDS,
  }
}
