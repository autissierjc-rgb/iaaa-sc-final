import type { ResourceServiceContract, WritingContract } from '@/lib/contracts'
import { containsForbiddenPublicPhrase } from '@/lib/writing/diamondRules'

export type WritingQualityBenchmarkResult = {
  checks: Array<{
    id: string
    label_fr: string
    passed: boolean
    detail_fr: string
  }>
  passed: number
  total: number
  verdict: 'pass' | 'review'
}

function publicText(writing: WritingContract): string {
  return [
    writing.situation_card.insight_fr,
    writing.situation_card.main_vulnerability_fr,
    writing.situation_card.asymmetry_fr,
    writing.situation_card.key_signal_fr,
    writing.lecture.text_fr,
    writing.approfondir.analysis_fr,
    ...writing.approfondir.sections_fr.map((section) => `${section.title} ${section.body}`),
  ].join(' ')
}

export function benchmarkWritingQuality(
  writing: WritingContract,
  resources?: ResourceServiceContract,
): WritingQualityBenchmarkResult {
  const sharpDiamond = writing.diamond_sentences.find((sentence) => sentence.style === 'diamant_tranchant')
  const forbidden = containsForbiddenPublicPhrase(publicText(writing))
  const needsResourceWarning = Boolean(resources?.needs_web)
  const hasResourceWarning = !needsResourceWarning ||
    writing.public_warnings.some((warning) => warning === resources?.policy_reason_fr || warning.includes('sources rapides') || warning.includes('URL'))

  const checks = [
    {
      id: 'sharp_diamond',
      label_fr: 'Diamant tranchant public',
      passed: Boolean(sharpDiamond?.must_be_public && sharpDiamond.text_fr.length >= 70),
      detail_fr: sharpDiamond
        ? `${sharpDiamond.text_fr.length} caracteres.`
        : 'Aucune phrase diamant tranchant publique.',
    },
    {
      id: 'no_forbidden_public_phrase',
      label_fr: 'Pas de hors-sol interdit',
      passed: forbidden.length === 0,
      detail_fr: forbidden.length > 0 ? forbidden.join(', ') : 'Aucune formule interdite detectee.',
    },
    {
      id: 'resource_warning',
      label_fr: 'Warning ressources si necessaire',
      passed: hasResourceWarning,
      detail_fr: resources?.needs_web
        ? `Politique ${resources.policy}; warnings=${writing.public_warnings.length}.`
        : 'Sources externes non obligatoires pour ce cas.',
    },
    {
      id: 'probability_status',
      label_fr: 'Statut probabiliste',
      passed: writing.probability_assessments.length > 0,
      detail_fr: writing.probability_assessments[0]?.probability_label_fr ?? 'Aucun statut.',
    },
  ]
  const passed = checks.filter((check) => check.passed).length

  return {
    checks,
    passed,
    total: checks.length,
    verdict: passed === checks.length ? 'pass' : 'review',
  }
}
