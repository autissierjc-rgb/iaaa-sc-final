// IAAA · V1 · Frozen TypeScript contracts
// Mirror of backend/app/core/contracts.py — must stay in sync.
//
// ─────────────────────────────────────────────────────────────
// CONTRACTS AUTHORITY RULE
// backend/app/core/contracts.py = canonical source of truth
// This file = TypeScript mirror. No additional fields.
// No renames. No independent type changes.
// All modifications must originate in contracts.py first.
// ─────────────────────────────────────────────────────────────

// ── Situation Card ────────────────────────────────────────────────────────────
export interface SituationCard {
  title: string;
  objective: string;
  overview: string;
  forces: string[];
  tensions: string[];
  vulnerabilities: string[];       // center of the diamond
  main_vulnerability: string;
  trajectories: string[];
  constraints: string[];
  uncertainty: string[];
  reflection: string;
}

// ── Star Map ──────────────────────────────────────────────────────────────────
export type StarMapDimension =
  | "risk"
  | "opportunity"
  | "time"
  | "power"
  | "constraints"
  | "change"
  | "stability"
  | "uncertainty";

export const STAR_MAP_DIMENSIONS: StarMapDimension[] = [
  "risk",
  "opportunity",
  "time",
  "power",
  "constraints",
  "change",
  "stability",
  "uncertainty",
];

export interface StarMapExploration {
  dimension: StarMapDimension;
  questions: string[];             // max 3
  insight: string;
  related_trajectories: string[];
}

// ── API card object (from DB) ─────────────────────────────────────────────────
export interface CardRecord {
  id: string;
  slug: string;
  title: string;
  content: SituationCard;
  is_public: boolean;
  view_count: number;
  situation_input: string | null;   // original user input — "vraie question"
  intention_raw:   string | null;   // user intention, spelling-corrected — shown in Situation soumise
  intention:       string | null;   // maïeutised intention — shown in Cap with cible picto
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
}

// ── User ──────────────────────────────────────────────────────────────────────
export type UserTier = "free" | "clarity" | "sis" | "plus";

export interface User {
  id: string;
  email: string;
  tier: UserTier;
  is_admin: boolean;
  email_verified: boolean;
  created_at: string;
}

// ── Tier limits ───────────────────────────────────────────────────────────────
export const TIER_LIMITS: Record<UserTier, { cards_per_month: number | null; private_cards: boolean; pdf_export: boolean }> = {
  free:    { cards_per_month: 5,    private_cards: false, pdf_export: false },
  clarity: { cards_per_month: 5,    private_cards: false, pdf_export: false },
  sis:     { cards_per_month: null, private_cards: true,  pdf_export: true  },
  plus:    { cards_per_month: null, private_cards: true,  pdf_export: true  },
};

// ── /api/generate Response Contract — FROZEN ─────────────────────────────────
// Mirror of backend/app/core/contracts.py GENERATE_RESPONSE_CONTRACT
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  reframe  = UI field. Sibling of card. Never inside card.              │
// │  card     = SituationCard — frozen contract above.                     │
// │                                                                         │
// │  RULE: Do not add fields to card to absorb reframe.                    │
// │  RULE: Bloc 3 changes only the generation logic, not this shape.       │
// └─────────────────────────────────────────────────────────────────────────┘

// ── Situation Analysis — derived layer (ephemeral, not persisted) ─────────────
// Mirror of backend/app/schemas/analysis.py

export interface SystemInfo {
  name:       string
  type:       string
  boundaries: string
}

export interface AnalysisActor {
  name:      string
  role:      string
  influence: 'low' | 'medium' | 'high'
}

export interface AnalysisForce {
  description: string
  direction:   'support' | 'oppose' | 'destabilize' | 'stabilize'
  strength:    'low' | 'medium' | 'high'
}

export interface AnalysisConstraint {
  description: string
  severity:    'low' | 'medium' | 'high'
}

export interface AnalysisDynamics {
  pattern:   string
  speed:     'slow' | 'medium' | 'fast'
  stability: 'stable' | 'fragile' | 'unstable'
}

export interface AnalysisTrajectory {
  description: string
  signal:      string
}

export interface SituationAnalysis {
  system:      SystemInfo
  actors:      AnalysisActor[]
  forces:      AnalysisForce[]
  constraints: AnalysisConstraint[]
  dynamics:    AnalysisDynamics
  trajectories: AnalysisTrajectory[]
}

export interface DecisionDimensions {
  reversibility:   'low' | 'medium' | 'high'
  systemic_impact: 'low' | 'medium' | 'high'
  urgency:         'low' | 'medium' | 'high'
  uncertainty:     'low' | 'medium' | 'high'
}

export type DecisionType = 'trivial' | 'experimental' | 'structural' | 'regime_shift'

export interface GenerateApiResponse {
  reframe: string        // "What's really going on" — UI field, not in card
  card: SituationCard    // frozen contract — do not extend
  generated_at: string   // ISO 8601 UTC
  vulnerability_index?:  number
  vulnerability_status?: string
  vulnerability_for?:    string
  decision_type?:        string
  insight?:              string
  decision_dimensions?:  DecisionDimensions
  intention?:            string
  investigation_mode?:     boolean
  causal_scenarios?:       any
  verification_matrix?:    any
  context_sources?:        any
  contextualization_level?: any
  lecture?:                any
}
