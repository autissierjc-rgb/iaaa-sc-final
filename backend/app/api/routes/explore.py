"""
IAAA · Bloc 5 · POST /api/explore placeholder

Same pattern as Bloc 2's /api/generate.
Returns static exploration JSON per dimension.
The real exploration engine (LLM-powered) replaces _mock_explore() in Bloc 6+.

Request:  { dimension, card }
Response: { dimension, questions, insight, related_trajectories }

Contract matches StarMapExploration in frontend types/index.ts — frozen.
"""

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from typing import List

router = APIRouter()

STAR_MAP_DIMENSIONS = [
    "risk", "opportunity", "time", "power",
    "constraints", "change", "stability", "uncertainty"
]


# ── Schemas ───────────────────────────────────────────────────────────────────
class ExploreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dimension: str
    card:      dict   # SituationCard — validated structurally in Bloc 6+


class ExploreResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dimension:           str
    questions:           List[str]   # max 3
    insight:             str
    related_trajectories: List[str]


# ── Route ─────────────────────────────────────────────────────────────────────
@router.post("/explore", response_model=ExploreResponse, tags=["core"])
async def explore_star_map(request: ExploreRequest) -> ExploreResponse:
    """
    Generate exploration content for one Star Map branch.
    Bloc 5: static mock per dimension.
    Bloc 6+: replace _mock_explore() with LLM-powered exploration engine.
    """
    return _mock_explore(request.dimension, request.card)


# ── Static mock payloads ───────────────────────────────────────────────────────
_MOCK_EXPLORATIONS = {
    "risk": {
        "questions": [
            "What is the worst realistic outcome if nothing changes in the next 90 days?",
            "Which risk is most likely to materialize first — and why?",
            "What would need to be true for the main risk to become irreversible?",
        ],
        "insight": "The most dangerous risks here are not the visible ones — they are the assumptions that have never been tested.",
        "related_trajectories": [],
    },
    "opportunity": {
        "questions": [
            "What is the one opportunity that exists precisely because of this tension?",
            "Who benefits most from the current situation — and what does that reveal?",
            "What would you do differently if you knew this situation would resolve positively?",
        ],
        "insight": "The constraints driving this situation are also creating asymmetric openings for those willing to move differently.",
        "related_trajectories": [],
    },
    "time": {
        "questions": [
            "What decision has a shorter window than it appears?",
            "What looks urgent but is actually not — and what looks stable but is actually eroding?",
            "In 18 months, which of the current forces will no longer be relevant?",
        ],
        "insight": "Time is not neutral in this situation — delay is itself a choice with compounding consequences.",
        "related_trajectories": [],
    },
    "power": {
        "questions": [
            "Who has leverage that they haven't used yet — and why?",
            "Whose decision is this actually, beneath the stated roles?",
            "What would change if the power dynamic shifted by 20%?",
        ],
        "insight": "The formal authority structure and the real decision-making structure are not the same in this situation.",
        "related_trajectories": [],
    },
    "constraints": {
        "questions": [
            "Which constraint is truly fixed — and which only appears fixed?",
            "What would you attempt if the hardest constraint were removed for 30 days?",
            "Are the constraints protecting something valuable, or just limiting movement?",
        ],
        "insight": "At least one constraint in this situation is being treated as permanent when it is actually negotiable.",
        "related_trajectories": [],
    },
    "change": {
        "questions": [
            "What change has already begun that hasn't been named yet?",
            "What would need to stay the same for any trajectory to succeed?",
            "What are you hoping will change on its own — without a decision?",
        ],
        "insight": "The situation is already changing — the question is whether the response is leading the change or following it.",
        "related_trajectories": [],
    },
    "stability": {
        "questions": [
            "What is the one thing that, if preserved, makes all trajectories viable?",
            "What are you stabilizing — and at what cost?",
            "What false stability is currently masking a deeper instability?",
        ],
        "insight": "What looks like stability in this situation may be accumulated tension waiting for a release point.",
        "related_trajectories": [],
    },
    "uncertainty": {
        "questions": [
            "What do you know you don't know — and what don't you know you don't know?",
            "Which uncertainty, if resolved, would change everything?",
            "What decision could you make now that remains valid across multiple uncertain outcomes?",
        ],
        "insight": "The most important uncertainty here is not informational — it is about what the other actors will actually do.",
        "related_trajectories": [],
    },
}


def _mock_explore(dimension: str, card: dict) -> ExploreResponse:
    """
    Static mock — Bloc 5.
    Bloc 6+: replace with LLM call that uses card content to generate
    contextual questions and insight specific to this situation.
    """
    base = _MOCK_EXPLORATIONS.get(dimension, _MOCK_EXPLORATIONS["uncertainty"])

    # Pull relevant trajectories from card if available
    related = card.get("trajectories", [])[:2] if card else []

    return ExploreResponse(
        dimension=dimension,
        questions=base["questions"],
        insight=base["insight"],
        related_trajectories=related,
    )
