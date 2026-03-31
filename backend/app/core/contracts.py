"""
IAAA · V1 · Frozen JSON Contracts
These contracts must not change in V1.
Used by Pydantic schemas and system prompt validation.

────────────────────────────────────────────────────────────
CONTRACTS AUTHORITY RULE
────────────────────────────────────────────────────────────
This file (backend/app/core/contracts.py) is the canonical
source of truth for all data contracts.

frontend/src/types/index.ts MUST mirror these contracts exactly.
It must not introduce additional fields, rename fields, or
change types independently.

All cross-boundary discrepancies originate from deviating
from this rule. Do not deviate.
────────────────────────────────────────────────────────────
"""

# ── Situation Card Contract ───────────────────────────────────────────────────
SITUATION_CARD_CONTRACT = {
    "title": "",
    "objective": "",
    "overview": "",
    "forces": [],           # list of strings
    "tensions": [],         # list of strings
    "vulnerabilities": [],  # list of strings — center of the diamond
    "main_vulnerability": "",
    "trajectories": [],     # list of strings
    "constraints": [],      # list of strings
    "uncertainty": [],      # list of strings
    "reflection": ""
}

# ── Star Map Exploration Contract ─────────────────────────────────────────────
STAR_MAP_EXPLORATION_CONTRACT = {
    "dimension": "",            # one of STAR_MAP_DIMENSIONS
    "questions": [],            # max 3
    "insight": "",              # short, 1 sentence
    "related_trajectories": []  # from the parent Situation Card
}

# ── Star Map Dimensions (8 fixed branches — V1) ───────────────────────────────
STAR_MAP_DIMENSIONS = [
    "risk",
    "opportunity",
    "time",
    "power",
    "constraints",
    "change",
    "stability",
    "uncertainty"
]

# ── Tier Definitions ──────────────────────────────────────────────────────────
TIERS = {
    "free": {
        # Default unauthenticated / unsubscribed tier
        "cards_per_month": 5,
        "private_cards": False,
        "pdf_export": False,
    },
    "clarity": {
        # Future paid personal tier — same limits as free in V1
        # Distinction becomes meaningful in V2 (higher card limit, no ads)
        "cards_per_month": 5,
        "private_cards": False,
        "pdf_export": False,
    },
    "sis": {
        "cards_per_month": None,  # unlimited
        "private_cards": True,
        "pdf_export": True,
    },
    "plus": {
        "cards_per_month": None,  # unlimited — enterprise
        "private_cards": True,
        "pdf_export": True,
    }
}

# ── Situation Analysis Contract — FROZEN ─────────────────────────────────────
# Derived layer — computed from a SituationCard in a single LLM call.
# NEVER stored in situation_cards.content
# NEVER part of the SituationCard contract
# Visible only on /generate (ephemeral — not persisted in V1)

SITUATION_ANALYSIS_CONTRACT = {
    "system": {
        "name":       "",  # short name of the system in play
        "type":       "",  # e.g. "organizational", "market", "personal"
        "boundaries": ""   # what is inside vs outside the scope
    },
    "actors": [
        # { "name": "", "role": "", "influence": "low|medium|high" }
    ],
    "forces": [
        # { "description": "", "direction": "support|oppose|destabilize|stabilize", "strength": "low|medium|high" }
    ],
    "constraints": [
        # { "description": "", "severity": "low|medium|high" }
    ],
    "dynamics": {
        "pattern":   "",           # e.g. "escalating conflict", "slow drift"
        "speed":     "",           # "slow|medium|fast"
        "stability": ""            # "stable|fragile|unstable"
    },
    "trajectories": [
        # { "description": "", "signal": "" }
    ]
}

# ── Decision Dimensions Contract — FROZEN ─────────────────────────────────────
# Computed deterministically from card + analysis by backend rules.
# Each dimension = "low" | "medium" | "high"

DECISION_DIMENSIONS_CONTRACT = {
    "reversibility":   "",   # how easily can this decision be undone
    "systemic_impact": "",   # how broadly does this affect the system
    "urgency":         "",   # how time-sensitive is this
    "uncertainty":     ""    # how much is genuinely unknown
}

# ── Decision Types ─────────────────────────────────────────────────────────────
DECISION_TYPES = ["trivial", "experimental", "structural", "regime_shift"]

# ── /api/generate Response Contract — v2 ─────────────────────────────────────
# Controlled contract evolution.
# SituationCard itself is unchanged — analysis is a sibling, not nested inside card.
# decision_type and decision_dimensions are ephemeral — not persisted.
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  POST /api/generate v2                                                  │
# │                                                                         │
# │  Request:  { "situation": string }           ← unchanged               │
# │                                                                         │
# │  Response: {                                                            │
# │    "reframe":             string,            ← UI field only           │
# │    "card":                SituationCard,     ← frozen, unchanged       │
# │    "analysis":            SituationAnalysis, ← ephemeral, not saved    │
# │    "decision_type":       string,            ← ephemeral, not saved    │
# │    "decision_dimensions": {...},             ← ephemeral, not saved    │
# │    "generated_at":        string             ← ISO 8601 UTC            │
# │  }                                                                      │
# └─────────────────────────────────────────────────────────────────────────┘
GENERATE_RESPONSE_CONTRACT = {
    "reframe":             "",
    "card":                SITUATION_CARD_CONTRACT,
    "analysis":            SITUATION_ANALYSIS_CONTRACT,
    "decision_type":       "",
    "decision_dimensions": DECISION_DIMENSIONS_CONTRACT,
    "generated_at":        "",
}
