import type {
  BlindSpotInquiry,
  BlindSpotLevel,
  InquiryContract,
} from '@/lib/contracts/inquiry'
import type { InterpretationContract } from '@/lib/contracts/interpretation'
import type { ConcreteTheatreContract } from '@/lib/contracts/theatre'

export type BlindSpotEngineInput = {
  interpretation: Pick<InterpretationContract, 'domain' | 'situation_soumise' | 'angle' | 'user_need'>
  theatre: Pick<ConcreteTheatreContract, 'actors' | 'institutions' | 'constraints' | 'evidence' | 'unknowns'>
}

function levelFor(item: string): BlindSpotLevel {
  if (/\bpreuve|document|source|url|client|revenu|certification|contrat|decision|publication\b/i.test(item)) {
    return 'documentary'
  }
  if (/\bintention|peur|loyaute|relation|confiance|non[- ]dit|dependance|pouvoir reel\b/i.test(item)) {
    return 'structural'
  }
  return 'declarative'
}

function inquiryFor(item: string, input: BlindSpotEngineInput): BlindSpotInquiry {
  const level = levelFor(item)
  const actors = input.theatre.actors.slice(0, 3)
  const institutions = input.theatre.institutions.slice(0, 3)

  return {
    blind_spot: item,
    level,
    evidence_level: level === 'documentary' ? 'missing' : level === 'structural' ? 'uncertain' : 'plausible',
    why_it_matters:
      'Cet angle mort peut modifier la lecture si ce qui manque explique mieux la situation que les signaux visibles.',
    where_to_look:
      level === 'documentary'
        ? ['sources officielles', 'documents publics', 'articles fiables', 'traces datables']
        : level === 'structural'
          ? ['chronologie relationnelle', 'roles reels', 'dependances cachees', 'contre-hypotheses']
          : ['question utilisateur', 'contexte manquant', 'precision factuelle'],
    who_can_confirm:
      actors.length > 0 || institutions.length > 0
        ? [...actors, ...institutions]
        : ['utilisateur', 'acteur direct', 'source fiable'],
    observable_signal:
      'Un fait, une decision, un message, un document ou un changement de comportement rend cet angle visible.',
    decisive_evidence:
      level === 'documentary'
        ? 'Une source verifiable qui confirme ou infirme directement le point manquant.'
        : 'Une precision qui relie l angle mort a un acteur, un geste, une contrainte ou une consequence observable.',
    counter_hypothesis:
      'La lecture actuelle peut rester valable si cet angle mort n a pas de lien causal avec la decision ou la tension observee.',
  }
}

export function buildBlindSpotInquiry(input: BlindSpotEngineInput): InquiryContract {
  const started = Date.now()
  const candidates = [
    ...input.theatre.unknowns,
    ...input.theatre.constraints.filter((constraint) => /regle|argent|temps|preuve|relation|decision|institution/i.test(constraint)),
  ]

  const unique = Array.from(new Set(candidates.map((item) => item.trim()).filter(Boolean))).slice(0, 5)
  const blind_spots = unique.map((item) => inquiryFor(item, input))

  return {
    blind_spots,
    should_offer_inquiry: blind_spots.length > 0,
    inquiry_button_label_fr: 'Lancer l’enquete',
    inquiry_button_label_en: 'Start inquiry',
    trace: {
      service: 'BlindSpotEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: blind_spots.length > 0 ? 'ok' : 'partial',
      notes: [`blind_spots=${blind_spots.length}`],
    },
  }
}
