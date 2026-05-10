export type CtoWatchSeverity = 'ok' | 'watch' | 'critical'

export type CtoWatchMetricId =
  | 'public_fast_p95_ms'
  | 'generation_error_rate'
  | 'missing_required_sources_rate'
  | 'fallback_rate'
  | 'provider_error_rate'
  | 'estimated_hourly_cost_eur'
  | 'shared_card_cache_hit_rate'

export type CtoWatchMetricInput = {
  id: CtoWatchMetricId
  value: number
}

export type CtoWatchThreshold = {
  id: CtoWatchMetricId
  label_fr: string
  direction: 'max' | 'min'
  watch_at: number
  critical_at: number
  unit: 'ms' | 'rate' | 'eur' | 'percent'
  reason_fr: string
}

export type CtoWatchEvaluation = {
  id: CtoWatchMetricId
  label_fr: string
  value: number
  unit: CtoWatchThreshold['unit']
  severity: CtoWatchSeverity
  threshold: {
    direction: CtoWatchThreshold['direction']
    watch_at: number
    critical_at: number
  }
  message_fr: string
}

export type CtoWatchReport = {
  status: CtoWatchSeverity
  generated_at: string
  mode: 'passive_contract'
  should_alert: boolean
  alert_channels: Array<'admin_cockpit' | 'email' | 'slack' | 'sms'>
  evaluations: CtoWatchEvaluation[]
  recommended_actions: string[]
  guardrails: string[]
}

export const DEFAULT_CTO_WATCH_THRESHOLDS: CtoWatchThreshold[] = [
  {
    id: 'public_fast_p95_ms',
    label_fr: 'Latence public fast p95',
    direction: 'max',
    watch_at: 5000,
    critical_at: 6500,
    unit: 'ms',
    reason_fr: 'La generation publique doit rester rapide pour ne pas bloquer SIS.',
  },
  {
    id: 'generation_error_rate',
    label_fr: 'Taux erreur generation',
    direction: 'max',
    watch_at: 0.015,
    critical_at: 0.03,
    unit: 'rate',
    reason_fr: 'Un taux d erreur eleve signale une rupture provider, code ou quota.',
  },
  {
    id: 'missing_required_sources_rate',
    label_fr: 'Sources obligatoires absentes',
    direction: 'max',
    watch_at: 0.025,
    critical_at: 0.05,
    unit: 'rate',
    reason_fr: 'Les domaines factuels ne doivent pas perdre leurs sources rapides.',
  },
  {
    id: 'fallback_rate',
    label_fr: 'Fallback local',
    direction: 'max',
    watch_at: 0.1,
    critical_at: 0.25,
    unit: 'rate',
    reason_fr: 'Trop de fallback indique que le referent ou les ressources ne tiennent plus.',
  },
  {
    id: 'provider_error_rate',
    label_fr: 'Erreurs provider',
    direction: 'max',
    watch_at: 0.02,
    critical_at: 0.05,
    unit: 'rate',
    reason_fr: 'Les erreurs provider doivent declencher bascule, ralentissement ou alerte.',
  },
  {
    id: 'estimated_hourly_cost_eur',
    label_fr: 'Cout horaire estime',
    direction: 'max',
    watch_at: 50,
    critical_at: 100,
    unit: 'eur',
    reason_fr: 'Le buzz ne doit pas transformer la generation en incendie de cout.',
  },
  {
    id: 'shared_card_cache_hit_rate',
    label_fr: 'Cache hit cartes partagees',
    direction: 'min',
    watch_at: 0.9,
    critical_at: 0.75,
    unit: 'rate',
    reason_fr: 'Les consultations publiques doivent frapper le cache, pas le moteur.',
  },
]

export const DEFAULT_CTO_WATCH_GUARDS = [
  'Public reads must be snapshot-only and cacheable.',
  'Generation must be quota-limited by IP/account.',
  'Recherche+ must be async, paid or quota-limited.',
  'Provider fallback must be visible in telemetry.',
  'Critical source gaps must degrade the verdict instead of pretending solidity.',
]
