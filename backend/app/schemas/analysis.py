"""
IAAA · Bloc 9 · Analysis schemas

SituationAnalysis — derived from a SituationCard via LLM.
DecisionDimensions — computed deterministically from card + analysis.
AnalysisResponse   — ephemeral, never stored in DB.

All schemas: extra="forbid" — no undeclared fields.
"""

from typing import Literal, Annotated
from pydantic import BaseModel, ConfigDict, Field


# ── Sub-schemas ───────────────────────────────────────────────────────────────

class SystemInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name:       str
    type:       str
    boundaries: str


class Actor(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name:      str
    role:      str
    influence: Literal["low", "medium", "high"]


class Force(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: str
    direction:   Literal["support", "oppose", "destabilize", "stabilize"]
    strength:    Literal["low", "medium", "high"]


class Constraint(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: str
    severity:    Literal["low", "medium", "high"]


class Dynamics(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pattern:   str
    speed:     Literal["slow", "medium", "fast"]
    stability: Literal["stable", "fragile", "unstable"]


class Trajectory(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: str
    signal:      str


# ── SituationAnalysis ─────────────────────────────────────────────────────────

class SituationAnalysisSchema(BaseModel):
    """
    Rich analytical layer derived from a SituationCard.
    Output by the LLM in the same call as the card.
    NEVER stored in situation_cards.content.

    Size limits enforced here AND in the system prompt.
    Belt-and-suspenders: prompt asks for compact output, schema rejects oversized.
    """
    model_config = ConfigDict(extra="forbid")
    system:       SystemInfo
    actors:       list[Actor]      = Field(..., max_length=3)   # max 3 actors
    forces:       list[Force]      = Field(..., max_length=4)   # max 4 forces
    constraints:  list[Constraint] = Field(..., max_length=4)   # max 4 constraints
    dynamics:     Dynamics
    trajectories: list[Trajectory] = Field(..., max_length=3)   # max 3 trajectories


# ── Decision Dimensions ───────────────────────────────────────────────────────

Level = Literal["low", "medium", "high"]

class DecisionDimensionsSchema(BaseModel):
    """
    Four analytical dimensions computed deterministically from card + analysis.
    Used to derive decision_type.
    Ephemeral — not persisted.
    """
    model_config = ConfigDict(extra="forbid")
    reversibility:   Level
    systemic_impact: Level
    urgency:         Level
    uncertainty:     Level


# ── Decision type ─────────────────────────────────────────────────────────────

DecisionType = Literal["trivial", "experimental", "structural", "regime_shift"]
