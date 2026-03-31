"""
IAAA · Bloc 6B · Card routes

POST /api/cards          — save a generated card (auth required)
GET  /api/cards          — list current user's cards (auth required)
GET  /api/cards/:slug    — fetch a single card by slug (public or owned)

Save behavior:
  - generate ≠ save (explicit save action)
  - reframe NOT stored — UI field only
  - slug generated from title, immutable after save

Quota semantics (explicit — not generation quota, save quota):
  Because generate and save are separate actions, the quota tracked here
  is "saved cards per month", not "generated cards per month".
  free/clarity: 5 saved cards per month
  sis/plus: unlimited
  This is intentional: users can generate freely, but saving is the
  quota-gated action. Naming and error messages reflect this.

Public card behavior:
  - is_public = true → accessible without auth
  - view_count incremented on public fetch
  - is_public = false → only accessible by owner

Bloc 6B does NOT implement:
  - card deletion
  - card editing
  - card_notes
  - sharing URL (just the slug returned)
  - public library listing
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func
from datetime import datetime, timezone, timedelta
import uuid

from pydantic import ConfigDict
from app.api.deps     import get_db, get_current_user, get_current_user_optional
from app.models.user  import User
from app.models.card  import SituationCard
from app.schemas.card import SaveCardRequest, CardResponse, CardListResponse
from app.schemas.generate import SituationCardSchema   # for validation
from app.services.slug import generate_unique_slug
from app.core.contracts import TIERS

router = APIRouter(prefix="/cards", tags=["cards"])


# ── Helpers ───────────────────────────────────────────────────────────────────
def _card_response(card: SituationCard) -> CardResponse:
    return CardResponse(
        id=card.id,
        slug=card.slug,
        title=card.title,
        content=card.content,
        is_public=card.is_public,
        view_count=card.view_count,
        situation_input=card.situation_input,
        intention_raw=card.intention_raw,
        intention=card.intention,
        created_at=card.created_at,
        updated_at=card.updated_at,
    )


async def _count_cards_this_month(db: AsyncSession, user_id: uuid.UUID) -> int:
    """
    Count cards SAVED by user in the current calendar month.
    This is the save quota — not a generation quota.
    See module docstring for quota semantics.
    """
    start_of_month = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    result = await db.execute(
        select(sql_func.count())
        .select_from(SituationCard)
        .where(
            SituationCard.user_id == user_id,
            SituationCard.created_at >= start_of_month,
        )
    )
    return result.scalar_one()


# ── POST /api/cards ────────────────────────────────────────────────────────────
@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def save_card(
    body:    SaveCardRequest,
    db:      AsyncSession = Depends(get_db),
    user:    User         = Depends(get_current_user),
) -> CardResponse:
    """
    Save a generated Situation Card explicitly.
    Generate and Save are NOT the same action.
    reframe is not stored — it is a UI field.
    """
    # Validate card content against frozen contract
    try:
        validated = SituationCardSchema(**body.card)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Card content does not match the frozen contract: {exc}",
        )

    # Tier quota check — free/clarity: 5 cards/month
    tier_config = TIERS.get(user.tier, TIERS["free"])
    monthly_limit = tier_config.get("cards_per_month")  # None = unlimited

    if monthly_limit is not None:
        count = await _count_cards_this_month(db, user.id)
        if count >= monthly_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Monthly save limit reached ({monthly_limit} saved cards). Upgrade your plan to save more.",
            )

    # Private cards check
    if body.is_public is False:
        # Free/clarity tiers: all saved cards are public (no private cards)
        if not tier_config.get("private_cards", False):
            # Force public — silently correct (not an error, just a tier constraint)
            is_public = True
        else:
            is_public = False
    else:
        is_public = body.is_public

    card_data = validated.model_dump()
    slug = await generate_unique_slug(card_data["title"], db)

    card = SituationCard(
        user_id=user.id,
        slug=slug,
        title=card_data["title"],
        content=card_data,
        is_public=is_public,
        situation_input=body.situation_input or None,
        intention_raw=body.intention_raw or None,
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)

    return _card_response(card)


# ── GET /api/cards ─────────────────────────────────────────────────────────────
@router.get("", response_model=CardListResponse)
async def list_my_cards(
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
) -> CardListResponse:
    """List all cards saved by the current user, newest first."""
    result = await db.execute(
        select(SituationCard)
        .where(SituationCard.user_id == user.id)
        .order_by(SituationCard.created_at.desc())
    )
    cards = result.scalars().all()

    return CardListResponse(
        cards=[_card_response(c) for c in cards],
        total=len(cards),
    )


# ── GET /api/cards/:slug ───────────────────────────────────────────────────────
@router.get("/{slug}", response_model=CardResponse)
async def get_card_by_slug(
    slug:    str,
    request: Request,
    db:      AsyncSession = Depends(get_db),
    user:    User | None  = Depends(get_current_user_optional),
) -> CardResponse:
    """
    Fetch a card by slug.
    Public cards: accessible without auth (view_count incremented).
    Private cards: only accessible by their owner.
    """
    result = await db.execute(
        select(SituationCard).where(SituationCard.slug == slug)
    )
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found.")

    # Authorization check
    if not card.is_public:
        if not user or card.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,  # 404, not 403 — don't reveal existence
                detail="Card not found.",
            )

    # Increment view_count on public fetch (non-owner)
    if card.is_public and (not user or card.user_id != user.id):
        card.view_count += 1
        await db.commit()
        await db.refresh(card)

    return _card_response(card)


# ── PATCH /api/cards/:slug/visibility ─────────────────────────────────────────
from pydantic import BaseModel as _BaseModel

class VisibilityRequest(_BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_public: bool


@router.patch("/{slug}/visibility", response_model=CardResponse)
async def set_card_visibility(
    slug:    str,
    body:    VisibilityRequest,
    db:      AsyncSession = Depends(get_db),
    user:    User         = Depends(get_current_user),
) -> CardResponse:
    """
    Toggle a card public/private.
    Only the card owner can change visibility.
    Private cards: only sis/plus tier can keep cards private.
    Free/clarity: setting is_public=False is rejected with a 403 + clear message.
    """
    result = await db.execute(
        select(SituationCard).where(SituationCard.slug == slug)
    )
    card = result.scalar_one_or_none()

    if not card or card.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found.")

    # Tier check for private cards
    if not body.is_public:
        tier_config = TIERS.get(user.tier, TIERS["free"])
        if not tier_config.get("private_cards", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Private cards require the SIS or Plus plan.",
            )

    card.is_public = body.is_public
    card.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(card)

    return _card_response(card)
