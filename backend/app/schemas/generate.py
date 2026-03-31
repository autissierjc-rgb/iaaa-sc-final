"""
IAAA · Bloc 3 · Generate schemas — corrected

Pydantic v2 models for POST /api/generate.

Corrections applied after Bloc 3 audit:
  1. min_length=1 on all critical list fields (forces, tensions,
     vulnerabilities, trajectories) — a card with empty lists is not valid.
  2. reframe validation: min 10 / max 280 chars.
  3. extra="forbid" on SituationCardSchema — reframe cannot leak into card.
  4. extra="forbid" on GenerateResponse — no parasitic fields.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from app.schemas.analysis import SituationAnalysisSchema, DecisionDimensionsSchema


# ── Request ───────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    situation: str = Field(..., min_length=10, max_length=10000)


# ── Situation Card — frozen contract ──────────────────────────────────────────
class SituationCardSchema(BaseModel):
    """
    Mirror of SITUATION_CARD_CONTRACT.
    extra="forbid" prevents any additional field (including a stray reframe)
    from passing validation silently.
    """
    model_config = ConfigDict(extra="forbid")

    title:              str        = Field(..., min_length=1)
    intention:          str | None = Field(default=None)   # maïeutisée — angle de lecture, optionnelle
    overview:           str        = Field(..., min_length=1)
    forces:             List[str]  = Field(..., min_length=1)   # ≥1 item required
    tensions:           List[str]  = Field(..., min_length=1)   # ≥1 item required
    vulnerabilities:    List[str]  = Field(..., min_length=1)   # ≥1 item required
    main_vulnerability: str        = Field(..., min_length=1)
    trajectories:       List[str]  = Field(..., min_length=1)   # ≥1 item required
    constraints:        List[str]  = Field(..., min_length=1)
    uncertainty:        List[str]  = Field(..., min_length=1)
    reflection:         str        = Field(..., min_length=1)


# ── Investigation mode — ephemeral, never persisted ──────────────────────────
class CausalScenario(BaseModel):
    """One possible causal reading of the situation."""
    model_config = ConfigDict(extra="forbid")
    scenario_id:     str
    title:           str
    description:     str
    actors_involved: List[str]
    causal_logic:    str
    plausibility:    str   # "high" | "medium" | "low"

class VerificationItem(BaseModel):
    """One question to verify before trusting the SC."""
    model_config = ConfigDict(extra="forbid")
    question:                  str
    why_it_matters:            str
    who_can_verify:            str
    compromised_sources:       List[str]
    independent_source_needed: bool


# ── Generate response — v4 contract ──────────────────────────────────────────
class GenerateResponse(BaseModel):
    """
    Controlled contract evolution — v4.
    Added in v4: investigation_mode, causal_scenarios, verification_matrix,
                 context_sources, contextualization_level (all Optional, ephemeral).
    Added in v3: vulnerability_index, vulnerability_status, vulnerability_for.
    Added in v2: analysis, decision_type, decision_dimensions.
    SituationCard (card) is unchanged and persisted.
    All other fields are ephemeral — not persisted in DB.
    """
    model_config = ConfigDict(extra="forbid")

    reframe:              str                      = Field(..., min_length=10, max_length=280)
    card:                 SituationCardSchema
    analysis:             SituationAnalysisSchema
    decision_type:        Literal["trivial", "experimental", "structural", "regime_shift"]
    decision_dimensions:  DecisionDimensionsSchema
    vulnerability_index:  int                      = Field(..., ge=0, le=100)
    vulnerability_status: str                      = Field(...)
    vulnerability_for:    str                      = Field(...)

    # V4 — context enrichment (populated when AI_PROVIDER=anthropic)
    context_sources:          Optional[List[str]]         = None  # URLs consulted
    contextualization_level:  Optional[str]               = None  # explicit|inferred|partial|insufficient

    # V4 — investigation mode (ephemeral — shown on /generate only, never on /sc/[slug])
    investigation_mode:       bool                        = False
    causal_scenarios:         Optional[List[CausalScenario]]    = None
    verification_matrix:      Optional[List[VerificationItem]]  = None

    generated_at:         str                      = Field(...)

    # V5 — Lecture (ephemeral — shown in SC but never persisted)
    # Explains the internal causal logic behind the SC structure
    lecture:              Optional[str]               = None
