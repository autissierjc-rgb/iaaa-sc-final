import type { EmotionSignal, ReflectiveQuestionType } from './types'

export type EmotionStructureSignal = {
  emotion: EmotionSignal
  type: ReflectiveQuestionType
  structural_hint_fr: string
  structural_hint_en: string
}

const SIGNALS: Array<{ pattern: RegExp; signal: EmotionStructureSignal }> = [
  {
    pattern: /\b(col[èe]re|furieux|furieuse|rage|enerv[ée]s?|énerv[ée]s?|agac[ée]s?)\b/i,
    signal: {
      emotion: 'anger',
      type: 'boundary',
      structural_hint_fr: 'frontière, reconnaissance ou pouvoir déplacé',
      structural_hint_en: 'boundary, recognition, or shifted power',
    },
  },
  {
    pattern: /\b(peur|angoisse|inquiet|inqui[eè]te|craint|explose|exploser|danger)\b/i,
    signal: {
      emotion: 'fear',
      type: 'structure_gap',
      structural_hint_fr: 'incertitude, dépendance ou sécurité insuffisamment cadrée',
      structural_hint_en: 'uncertainty, dependency, or insufficiently framed safety',
    },
  },
  {
    pattern: /\b(triste|tristesse|perte|deuil|fini|fin de cycle|d[ée]sengagement)\b/i,
    signal: {
      emotion: 'sadness',
      type: 'meaning',
      structural_hint_fr: 'perte, fin de cycle ou désengagement',
      structural_hint_en: 'loss, end of cycle, or disengagement',
    },
  },
  {
    pattern: /\b(surpris|surprise|sid[ée]r[ée]|inattendu|impr[ée]vu|rupture)\b/i,
    signal: {
      emotion: 'surprise',
      type: 'tension',
      structural_hint_fr: 'rupture de modèle ou événement non anticipé',
      structural_hint_en: 'model rupture or unanticipated event',
    },
  },
  {
    pattern: /\b(d[ée]go[ûu]t|rejet|inacceptable|malsain|trahi|trahison|contrat rompu)\b/i,
    signal: {
      emotion: 'disgust',
      type: 'boundary',
      structural_hint_fr: 'incohérence morale ou contrat implicite rompu',
      structural_hint_en: 'moral inconsistency or broken implicit contract',
    },
  },
  {
    pattern: /\b(joie|enthousiasme|soulag[ée]|accord|align[ée]|coh[ée]rence)\b/i,
    signal: {
      emotion: 'joy',
      type: 'meaning',
      structural_hint_fr: 'accord, stabilisation ou cohérence temporaire',
      structural_hint_en: 'agreement, stabilization, or temporary coherence',
    },
  },
  {
    pattern: /\b([ée]puis[ée]s?|fatigu[ée]s?|us[ée]s?|surcharge|charge invisible)\b/i,
    signal: {
      emotion: 'fatigue',
      type: 'tension',
      structural_hint_fr: 'charge invisible ou répartition de l’effort',
      structural_hint_en: 'invisible load or distribution of effort',
    },
  },
  {
    pattern: /\b(confus|confuse|confusion|flou|illisible|on ne comprend plus)\b/i,
    signal: {
      emotion: 'confusion',
      type: 'structure_gap',
      structural_hint_fr: 'règle manquante ou structure non lisible',
      structural_hint_en: 'missing rule or unreadable structure',
    },
  },
]

export function mapEmotionSignals(text: string): EmotionStructureSignal[] {
  const seen = new Set<EmotionSignal>()
  const signals: EmotionStructureSignal[] = []
  for (const item of SIGNALS) {
    if (!item.pattern.test(text)) continue
    if (seen.has(item.signal.emotion)) continue
    seen.add(item.signal.emotion)
    signals.push(item.signal)
  }
  return signals.slice(0, 3)
}
