"""
IAAA · Pre-Admin A · Usage tracking service

Writes UsageEvent rows after LLM calls.

Design constraints:
  - NEVER raises an exception that reaches the caller
  - NEVER blocks the main request (fire-and-forget via asyncio.create_task)
  - Cost estimation is best-effort — NULL is acceptable
  - Token counts are extracted from provider-specific response shapes

Cost estimates (USD per 1M tokens, approximate at time of writing):
  openai   / gpt-4o:           input $5.00   output $15.00
  openai   / gpt-4o-mini:      input $0.15   output $0.60
  anthropic/ claude-*-sonnet:  input $3.00   output $15.00
  anthropic/ claude-*-haiku:   input $0.25   output $1.25
  openrouter: varies by model — uses model string to guess if recognizable

Unknown models → cost_usd = NULL (logged, not an error).
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage_event import UsageEvent

logger = logging.getLogger(__name__)

# ── Cost table (USD per 1M tokens) ────────────────────────────────────────────
# Keys are model string prefixes or exact matches, longest match wins.
_COST_TABLE: list[tuple[str, Decimal, Decimal]] = [
    # (model_prefix,          input_per_1m,    output_per_1m)
    ("gpt-4o-mini",           Decimal("0.15"),  Decimal("0.60")),
    ("gpt-4o",                Decimal("5.00"),  Decimal("15.00")),
    ("gpt-4-turbo",           Decimal("10.00"), Decimal("30.00")),
    ("openai/gpt-4o-mini",    Decimal("0.15"),  Decimal("0.60")),
    ("openai/gpt-4o",         Decimal("5.00"),  Decimal("15.00")),
    ("claude-3-5-sonnet",     Decimal("3.00"),  Decimal("15.00")),
    ("claude-3-5-haiku",      Decimal("0.25"),  Decimal("1.25")),
    ("claude-sonnet",         Decimal("3.00"),  Decimal("15.00")),
    ("claude-haiku",          Decimal("0.25"),  Decimal("1.25")),
    ("anthropic/claude",      Decimal("3.00"),  Decimal("15.00")),  # generic fallback
]


def _estimate_cost(model: str, tokens_input: int | None, tokens_output: int | None) -> Decimal | None:
    """Return estimated cost in USD, or None if model pricing unknown."""
    if tokens_input is None and tokens_output is None:
        return None

    model_lower = model.lower()
    matched_in = matched_out = None

    for prefix, cost_in, cost_out in _COST_TABLE:
        if model_lower.startswith(prefix.lower()):
            matched_in, matched_out = cost_in, cost_out
            break  # first match wins (list ordered most-specific first)

    if matched_in is None:
        return None  # unknown model — don't guess

    ti = Decimal(tokens_input or 0)
    to = Decimal(tokens_output or 0)
    return (ti * matched_in + to * matched_out) / Decimal("1000000")


def _extract_tokens(provider: str, raw_response: dict) -> tuple[int | None, int | None]:
    """
    Extract (tokens_input, tokens_output) from raw provider response.
    Returns (None, None) if not available.
    """
    try:
        if provider == "anthropic":
            usage = raw_response.get("usage", {})
            return usage.get("input_tokens"), usage.get("output_tokens")
        else:
            # OpenAI + OpenRouter: same shape
            usage = raw_response.get("usage", {})
            return usage.get("prompt_tokens"), usage.get("completion_tokens")
    except Exception:
        return None, None


async def _write_event(db: AsyncSession, event: UsageEvent) -> None:
    """Internal writer — runs in background task."""
    try:
        db.add(event)
        await db.commit()
    except Exception as exc:
        logger.warning("usage_events: failed to write event: %s", exc)
        await db.rollback()


def record_usage(
    db: AsyncSession,
    *,
    endpoint: str,
    provider: str,
    model: str,
    raw_response: dict,
    latency_ms: int,
    success: bool = True,
    user_id: uuid.UUID | None = None,
) -> None:
    """
    Fire-and-forget usage event recording.

    Call this after a successful (or failed) LLM response.
    Never raises. Never blocks the caller.

    Usage:
        record_usage(
            db,
            endpoint="generate",
            provider=settings.AI_PROVIDER,
            model="gpt-4o",
            raw_response=data,    # full provider JSON response
            latency_ms=1234,
            user_id=user.id,
        )
    """
    try:
        tokens_input, tokens_output = _extract_tokens(provider, raw_response)
        cost = _estimate_cost(model, tokens_input, tokens_output)

        event = UsageEvent(
            user_id=user_id,
            endpoint=endpoint,
            provider=provider,
            model=model,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            cost_usd=cost,
            latency_ms=latency_ms,
            success=success,
        )
        asyncio.create_task(_write_event(db, event))
    except Exception as exc:
        # Instrumentation must never surface to the user
        logger.warning("record_usage: unexpected error: %s", exc)
