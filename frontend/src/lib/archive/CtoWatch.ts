import {
  DEFAULT_CTO_WATCH_GUARDS,
  DEFAULT_CTO_WATCH_THRESHOLDS,
  type CtoWatchEvaluation,
  type CtoWatchMetricInput,
  type CtoWatchReport,
  type CtoWatchSeverity,
  type CtoWatchThreshold,
} from '@/lib/contracts/ctoWatch'

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
