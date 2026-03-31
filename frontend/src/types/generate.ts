/**
 * IAAA · Bloc 2 · Generation flow types
 *
 * These types describe the UI state of the /generate flow.
 * They are NOT the frozen product contracts (types/index.ts).
 *
 * The "reframe" field (What's really going on) is a UI-layer field.
 * It must NOT be added to the frozen SituationCard JSON contract.
 * It lives here, in the frontend generation flow, as a separate UI concern.
 */

import type { SituationCard } from './index'

// ── Generation states ─────────────────────────────────────────────────────────
export type GenerationStatus =
  | 'idle'       // input visible, nothing submitted yet
  | 'loading'    // AI is working — show progress phases
  | 'success'    // card returned, display result
  | 'error'      // generation failed

// ── Loading phases (shown as sequential progress hints) ───────────────────────
// Manages perceived wait time during the 2–3s generation window.
// In Bloc 3, these will reflect real backend processing stages.
export type LoadingPhase =
  | 'searching'       // "Searching for context…"
  | 'reading'         // "Reading sources…"
  | 'contextualizing' // "Building situation context…"
  | 'structuring'     // "Identifying structure…"
  | 'analyzing'       // "Analyzing forces and tensions…"
  | 'composing'       // "Composing Situation Card…"

// ── Generation result ─────────────────────────────────────────────────────────
// reframe, vulnerability_* are ephemeral UI fields — never stored in the card.
export interface GenerationResult {
  card:                 SituationCard
  reframe:              string
  vulnerability_index:  number
  vulnerability_status: string
  vulnerability_for:    string
  decision_type:        string
  decision_dimensions:  {
    reversibility:   string
    systemic_impact: string
    urgency:         string
    uncertainty:     string
  }
  // V5 ephemeral — lecture (deep causal explanation)
  lecture:                  string | null
  // V4 ephemeral — investigation + context
  investigation_mode:       boolean
  causal_scenarios:         CausalScenario[] | null
  verification_matrix:      VerificationItem[] | null
  context_sources:          string[] | null
  contextualization_level:  string | null
  generated_at: string
}

export interface CausalScenario {
  scenario_id:     string
  title:           string
  description:     string
  actors_involved: string[]
  causal_logic:    string
  plausibility:    string
}

export interface VerificationItem {
  question:                  string
  why_it_matters:            string
  who_can_verify:            string
  compromised_sources:       string[]
  independent_source_needed: boolean
}

// ── Generate page state ───────────────────────────────────────────────────────
export interface GeneratePageState {
  situation: string
  status: GenerationStatus
  phase: LoadingPhase | null
  result: GenerationResult | null
  error: string | null
}
