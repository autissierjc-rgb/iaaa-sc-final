"""
IAAA · Bloc 9 · POST /api/generate — v2

Contract evolution:
  Before: { reframe, card, generated_at }
  After:  { reframe, card, analysis, decision_type, decision_dimensions, generated_at }

SituationCard is UNCHANGED.
analysis is computed by the LLM (same call, extended prompt).
decision_dimensions and decision_type are computed by backend rules (no extra LLM call).
None of the new fields are persisted — /api/cards contract is unchanged.

Internal architecture (Camshaft Tree, Astrolabe, etc.) never surfaces here.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.schemas.generate       import GenerateRequest, GenerateResponse
from app.schemas.analysis       import SituationAnalysisSchema, DecisionDimensionsSchema
from app.services.parsing_engine import parsing_engine
from app.services.situation_analysis import (
    compute_decision_dimensions,
    compute_decision_type,
    compute_vulnerability_index,
    compute_vulnerability_status,
    compute_vulnerability_for,
)
from app.services.usage import record_usage
from app.api.deps import get_db, get_current_user_optional
from app.models.user import User

router = APIRouter()


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate a Situation Card + Analysis from free text",
    tags=["core"],
)
async def generate_situation_card(
    request: GenerateRequest,
    db:      AsyncSession  = Depends(get_db),
    user:    User | None   = Depends(get_current_user_optional),
) -> GenerateResponse:
    """
    Transform a free-text situation into:
      - reframe          (UI insight string)
      - card             (frozen SituationCard)
      - analysis         (derived analytical layer — ephemeral)
      - decision_type    (trivial|experimental|structural|regime_shift — ephemeral)
      - decision_dimensions (4 axes — ephemeral)

    One LLM call produces reframe + card + analysis.
    Backend rules derive decision_dimensions + decision_type (no second LLM call).
    _meta from parsing engine is consumed here for usage tracking — never returned.
    """
    try:
        result = await parsing_engine.generate(request.situation)
    except TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Generation timed out. Please try again.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not structure the situation: {exc}",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Generation failed. Please try again.",
        )

    # Consume _meta for usage tracking — strip before building response
    meta = result.pop("_meta", {})
    record_usage(
        db,
        endpoint="generate",
        provider=meta.get("provider", "unknown"),
        model=meta.get("model", "unknown"),
        raw_response=meta.get("raw_response", {}),
        latency_ms=meta.get("latency_ms", 0),
        user_id=user.id if user else None,
    )

    # Re-instantiate validated schemas for analysis computation
    from app.schemas.generate import SituationCardSchema
    card_schema     = SituationCardSchema(**result["card"])
    analysis_schema = SituationAnalysisSchema(**result["analysis"])

    # Deterministic rules — no LLM call
    dims             = compute_decision_dimensions(card_schema, analysis_schema)
    decision_type    = compute_decision_type(dims)
    vuln_index       = compute_vulnerability_index(dims)
    vuln_status      = compute_vulnerability_status(vuln_index)
    vuln_for         = compute_vulnerability_for(card_schema, analysis_schema, decision_type)

    return GenerateResponse(
        reframe=result["reframe"],
        card=card_schema,
        analysis=analysis_schema,
        decision_type=decision_type,
        decision_dimensions=dims,
        vulnerability_index=vuln_index,
        vulnerability_status=vuln_status,
        vulnerability_for=vuln_for,
        investigation_mode=result.get("investigation_mode", False),
        causal_scenarios=result.get("causal_scenarios"),
        verification_matrix=result.get("verification_matrix"),
        context_sources=result.get("context_sources"),
        lecture=result.get("lecture"),
        contextualization_level=result.get("contextualization_level"),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
