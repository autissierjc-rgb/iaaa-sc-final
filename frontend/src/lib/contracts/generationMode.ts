import type { WritingEngineMode } from '@/lib/writing'

export type GenerationModeId =
  | 'public_fast'
  | 'diamond_llm'
  | 'research_plus'
  | 'admin_benchmark'

export type InterpretationRuntimeMode = 'referent_llm' | 'local_contract'

export type GenerationModeContract = {
  id: GenerationModeId
  label_fr: string
  interpretation_mode: InterpretationRuntimeMode
  writing_mode: WritingEngineMode
  allows_recherche_plus: boolean
  public_default: boolean
  latency_target_ms: number
  rule_fr: string
}

export const GENERATION_MODES: Record<GenerationModeId, GenerationModeContract> = {
  public_fast: {
    id: 'public_fast',
    label_fr: 'SIS public rapide',
    interpretation_mode: 'referent_llm',
    writing_mode: 'local_contract',
    allows_recherche_plus: false,
    public_default: true,
    latency_target_ms: 6500,
    rule_fr:
      'LLM referent rapide pour interpretation, fallback local seulement si echec technique, ecriture contractuelle rapide, ressources rapides si necessaires, Recherche+ separee.',
  },
  diamond_llm: {
    id: 'diamond_llm',
    label_fr: 'Diamant LLM',
    interpretation_mode: 'referent_llm',
    writing_mode: 'referent_llm',
    allows_recherche_plus: false,
    public_default: false,
    latency_target_ms: 16000,
    rule_fr:
      'LLM referent pour interpretation et redaction diamant. Mode plus lent, reserve a IAAA+ ou au cockpit.',
  },
  research_plus: {
    id: 'research_plus',
    label_fr: 'Recherche+',
    interpretation_mode: 'referent_llm',
    writing_mode: 'local_contract',
    allows_recherche_plus: true,
    public_default: false,
    latency_target_ms: 0,
    rule_fr:
      'Enquete externe separee, non bloquante, qui cherche des pistes et preuves sans remplacer SC, Lecture ou Approfondir.',
  },
  admin_benchmark: {
    id: 'admin_benchmark',
    label_fr: 'Admin benchmark',
    interpretation_mode: 'local_contract',
    writing_mode: 'local_contract',
    allows_recherche_plus: true,
    public_default: false,
    latency_target_ms: 3000,
    rule_fr:
      'Mode cockpit pour tester les contrats, benchmarks, warnings et regressions sans consommer le LLM referent.',
  },
}

export function resolveGenerationMode(
  mode?: GenerationModeId,
  overrides?: Partial<Pick<GenerationModeContract, 'interpretation_mode' | 'writing_mode'>>,
): GenerationModeContract {
  const base = GENERATION_MODES[mode ?? 'admin_benchmark'] ?? GENERATION_MODES.admin_benchmark

  return {
    ...base,
    interpretation_mode: overrides?.interpretation_mode ?? base.interpretation_mode,
    writing_mode: overrides?.writing_mode ?? base.writing_mode,
  }
}
