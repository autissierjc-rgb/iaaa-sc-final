"""
IAAA · Bloc 8 · GET /api/library

Returns public Situation Cards for the /library page.
Sort: newest first (chronological).
Pagination: cursor-based (created_at + id).

Why cursor, not offset:
  Offset pagination drifts as new cards are added — users get duplicates
  or skip cards on "Load more". Cursor is stable.

Cursor = opaque base64-encoded "created_at::id" string.
  - frontend sends cursor= query param
  - backend returns next_cursor (or null if no more pages)

view_count is NOT incremented here.
  view_count increments on /sc/[slug] only — per architecture decision.
  /library is a discovery surface, not a view.

Response shape:
  {
    "cards": [...],       # list of LibraryCardResponse
    "next_cursor": "..."  # null when no more pages
  }
"""

import base64
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps   import get_db
from app.models.card import SituationCard

router = APIRouter(tags=["library"])

PAGE_SIZE = 20


# ── Response ──────────────────────────────────────────────────────────────────
class LibraryCardPreview(BaseModel):
    """
    Minimal card preview for /library.
    Only exposes: title + main_vulnerability (most distinctive IAAA field).
    Does NOT expose full card content — user must navigate to /sc/[slug].
    """
    model_config = ConfigDict(extra="forbid")
    slug:               str
    title:              str
    main_vulnerability: str
    view_count:         int
    created_at:         datetime


class LibraryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cards:       list[LibraryCardPreview]
    next_cursor: Optional[str]  # null = no more pages


# ── Cursor helpers ─────────────────────────────────────────────────────────────
def _encode_cursor(created_at: datetime, card_id: str) -> str:
    raw = f"{created_at.isoformat()}::{card_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    """Decode cursor → (created_at, uuid.UUID). Raises ValueError on invalid input."""
    raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    ts, id_str = raw.split("::", 1)
    return datetime.fromisoformat(ts), uuid.UUID(id_str)


# ── Route ─────────────────────────────────────────────────────────────────────
@router.get("/library", response_model=LibraryResponse)
async def get_library(
    cursor: Optional[str] = Query(default=None, description="Pagination cursor from previous response"),
    db:     AsyncSession   = Depends(get_db),
) -> LibraryResponse:
    """
    Public card library — all public cards, newest first.
    Use next_cursor from response for "Load more".
    """
    query = (
        select(SituationCard)
        .where(SituationCard.is_public == True)  # noqa: E712
        .order_by(SituationCard.created_at.desc(), SituationCard.id.desc())
        .limit(PAGE_SIZE + 1)  # fetch one extra to detect next page
    )

    if cursor:
        # Correction: invalid cursor → 400, not silent fallback to first page
        try:
            pivot_dt, pivot_id = _decode_cursor(cursor)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cursor.")

        # Cursor filter mirrors the ORDER BY (created_at DESC, id DESC) exactly:
        #   (created_at < pivot) OR (created_at == pivot AND id < pivot_id)
        # No extra and_() layer. UUID compared to UUID directly (no cast).
        query = query.where(
            (SituationCard.created_at < pivot_dt) |
            (
                (SituationCard.created_at == pivot_dt) &
                (SituationCard.id < pivot_id)
            )
        )

    result = await db.execute(query)
    rows   = result.scalars().all()

    has_more    = len(rows) > PAGE_SIZE
    page_rows   = rows[:PAGE_SIZE]
    next_cursor = (
        _encode_cursor(page_rows[-1].created_at, str(page_rows[-1].id))
        if has_more and page_rows
        else None
    )

    cards = [
        LibraryCardPreview(
            slug=c.slug,
            title=c.title,
            main_vulnerability=c.content.get("main_vulnerability", ""),
            view_count=c.view_count,
            created_at=c.created_at,
        )
        for c in page_rows
    ]

    return LibraryResponse(cards=cards, next_cursor=next_cursor)
