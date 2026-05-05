import type { DeepReading, SituationCard } from '../resources/resourceContract'

/*
 * Entity explanations are intentionally disabled here.
 *
 * The previous automatic insertion layer produced unsafe nested phrasing such as
 * "Macron (président (nom propre cité...) de la France)".
 *
 * This file remains as a no-op adapter so existing generation routes keep their
 * imports, but names/acronyms must not be injected until a single tested contract
 * owns the behavior end to end.
 */

export function applyEntityExplanationsToSituationCard(sc: SituationCard): SituationCard {
  return sc
}

export function applyEntityExplanationsToDeepReading(reading: DeepReading): DeepReading {
  return reading
}
