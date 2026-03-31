"""
IAAA · Admin 1+2 · Admin routes

GET   /api/admin/stats              — dashboard summary
GET   /api/admin/users              — paginated user list (read)
PATCH /api/admin/users/{user_id}    — user write actions (Admin 2)

All routes require is_admin=True (require_admin dependency).
All write routes record an audit trail entry before committing.

Admin 2 actions (via PATCH body):
  tier_change      — upgrade or downgrade user tier
  disable          — set is_active=false
  enable           — set is_active=true
  set_expiration   — set or clear account_expires_at

Safety constraints:
  - Admin cannot disable themselves
  - Admin cannot downgrade themselves
  - tier must be one of: free | clarity | sis | plus
  - expiration date must be in the future if set
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func, desc
from datetime import datetime, timezone, timedelta
from typing import Literal

from app.api.deps import get_db, require_admin
# User model fields used in Admin 2 (confirmed present — see admin2_migration.sql):
#   is_active (bool, default true), account_expires_at (timestamptz, nullable), updated_at
from app.models.user import User
from app.models.card import SituationCard
# Pre-Admin A dependency: usage_events table must exist before deploying this module.
# Apply postgres/pre_admin_migration.sql first, then postgres/admin2_migration.sql.
from app.models.usage_event import UsageEvent
from app.services.audit import record_admin_action

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Schemas (inline — admin only, no public contract exposure) ────────────────
from pydantic import BaseModel, ConfigDict
import uuid


class AdminUserRow(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id:                 uuid.UUID
    email:              str
    tier:               str
    is_admin:           bool
    is_active:          bool
    account_expires_at: datetime | None
    created_at:         datetime
    card_count:         int = 0


class AdminUsersResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    users:  list[AdminUserRow]
    total:  int
    offset: int
    limit:  int


class AdminStatsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    users_total:           int
    users_by_tier:         dict[str, int]
    cards_total:           int
    cards_public:          int
    generate_calls_7d:     int
    generate_cost_7d_usd:  float | None
    last_updated:          datetime


# ── Admin 2 — write request schema ───────────────────────────────────────────
VALID_TIERS = {"free", "clarity", "sis", "plus"}

class AdminUserPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: Literal["tier_change", "disable", "enable", "set_expiration"]
    # tier_change
    tier:               str | None = None
    # set_expiration
    account_expires_at: datetime | None = None   # None = clear expiration
    # optional note for audit trail
    note:               str | None = None


class AdminUserPatchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: uuid.UUID
    action:  str
    message: str


# ── GET /api/admin/stats ──────────────────────────────────────────────────────
@router.get("/stats", response_model=AdminStatsResponse)
async def admin_stats(
    db:    AsyncSession = Depends(get_db),
    admin: User         = Depends(require_admin),
) -> AdminStatsResponse:
    """
    Dashboard summary.
    Aggregates over full dataset — intended for admin use only.
    No cache in V1 (dataset small). Add Redis cache in V2 if slow.
    """
    # User counts
    total_users = (await db.execute(select(sql_func.count()).select_from(User))).scalar_one()

    tier_rows = (await db.execute(
        select(User.tier, sql_func.count().label("n"))
        .group_by(User.tier)
    )).all()
    users_by_tier = {row.tier: row.n for row in tier_rows}

    # Card counts
    total_cards  = (await db.execute(select(sql_func.count()).select_from(SituationCard))).scalar_one()
    public_cards = (await db.execute(
        select(sql_func.count()).select_from(SituationCard)
        .where(SituationCard.is_public == True)  # noqa: E712
    )).scalar_one()

    # Usage last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    generate_calls_7d = (await db.execute(
        select(sql_func.count()).select_from(UsageEvent)
        .where(
            UsageEvent.endpoint == "generate",
            UsageEvent.created_at >= seven_days_ago,
        )
    )).scalar_one()

    cost_row = (await db.execute(
        select(sql_func.sum(UsageEvent.cost_usd))
        .where(
            UsageEvent.endpoint == "generate",
            UsageEvent.created_at >= seven_days_ago,
            UsageEvent.cost_usd.isnot(None),
        )
    )).scalar_one()

    return AdminStatsResponse(
        users_total=total_users,
        users_by_tier=users_by_tier,
        cards_total=total_cards,
        cards_public=public_cards,
        generate_calls_7d=generate_calls_7d,
        generate_cost_7d_usd=float(cost_row) if cost_row is not None else None,
        last_updated=datetime.now(timezone.utc),
    )


# ── GET /api/admin/users ──────────────────────────────────────────────────────
@router.get("/users", response_model=AdminUsersResponse)
async def admin_list_users(
    offset: int = Query(default=0, ge=0),
    limit:  int = Query(default=50, ge=1, le=200),
    tier:   str | None = Query(default=None),   # optional filter — validated against VALID_TIERS
    db:     AsyncSession = Depends(get_db),
    admin:  User         = Depends(require_admin),
) -> AdminUsersResponse:
    """
    Paginated user list with card count per user.
    Filterable by tier (must be a valid tier if provided).
    Ordered by created_at DESC (newest first).
    """
    if tier is not None and tier not in VALID_TIERS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid tier filter. Must be one of: {', '.join(sorted(VALID_TIERS))}",
        )
    # Total count (with optional tier filter)
    count_q = select(sql_func.count()).select_from(User)
    if tier:
        count_q = count_q.where(User.tier == tier)
    total = (await db.execute(count_q)).scalar_one()

    # Build user query — filter first, then order + paginate
    user_q = select(User)
    if tier:
        user_q = user_q.where(User.tier == tier)
    user_q = user_q.order_by(desc(User.created_at)).offset(offset).limit(limit)
    users = (await db.execute(user_q)).scalars().all()

    # Card counts per user (single query)
    user_ids = [u.id for u in users]
    card_counts: dict[uuid.UUID, int] = {}
    if user_ids:
        rows = (await db.execute(
            select(SituationCard.user_id, sql_func.count().label("n"))
            .where(SituationCard.user_id.in_(user_ids))
            .group_by(SituationCard.user_id)
        )).all()
        card_counts = {row.user_id: row.n for row in rows}

    return AdminUsersResponse(
        users=[
            AdminUserRow(
                id=u.id,
                email=u.email,
                tier=u.tier,
                is_admin=u.is_admin,
                is_active=u.is_active,
                account_expires_at=u.account_expires_at,
                created_at=u.created_at,
                card_count=card_counts.get(u.id, 0),
            )
            for u in users
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


# ── PATCH /api/admin/users/{user_id} ──────────────────────────────────────────
@router.patch("/users/{user_id}", response_model=AdminUserPatchResponse)
async def admin_patch_user(
    user_id: uuid.UUID,
    body:    AdminUserPatchRequest,
    db:      AsyncSession = Depends(get_db),
    admin:   User         = Depends(require_admin),
) -> AdminUserPatchResponse:
    """
    Apply an admin action to a user.
    All actions write an audit trail entry in the same transaction.

    Actions:
      tier_change    — set user.tier (requires body.tier)
      disable        — set is_active=false
      enable         — set is_active=true
      set_expiration — set or clear account_expires_at
    """
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Safety constraints on self-actions
    # Rule: admin cannot change their own tier (any direction) or disable themselves.
    # Simple and unambiguous — avoids accidental lockout.
    if target.id == admin.id and body.action in ("disable", "tier_change"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin cannot change their own tier or disable their own account.",
        )

    value_before: dict = {}
    value_after:  dict = {}
    message = ""

    # ── tier_change ───────────────────────────────────────────────────────────
    if body.action == "tier_change":
        if not body.tier or body.tier not in VALID_TIERS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"tier must be one of: {', '.join(sorted(VALID_TIERS))}",
            )
        value_before = {"tier": target.tier}
        value_after  = {"tier": body.tier}
        target.tier  = body.tier
        message = f"Tier changed to {body.tier}"

    # ── disable ───────────────────────────────────────────────────────────────
    elif body.action == "disable":
        value_before = {"is_active": target.is_active}
        value_after  = {"is_active": False}
        target.is_active = False
        message = "Account disabled"

    # ── enable ────────────────────────────────────────────────────────────────
    elif body.action == "enable":
        value_before = {"is_active": target.is_active}
        value_after  = {"is_active": True}
        target.is_active = True
        message = "Account enabled"

    # ── set_expiration ────────────────────────────────────────────────────────
    elif body.action == "set_expiration":
        if body.account_expires_at is not None:
            if body.account_expires_at <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="account_expires_at must be in the future.",
                )
        value_before = {"account_expires_at": target.account_expires_at.isoformat() if target.account_expires_at else None}
        value_after  = {"account_expires_at": body.account_expires_at.isoformat() if body.account_expires_at else None}
        target.account_expires_at = body.account_expires_at
        message = (
            f"Expiration set to {body.account_expires_at.isoformat()}"
            if body.account_expires_at else "Expiration cleared"
        )

    target.updated_at = datetime.now(timezone.utc)

    # Audit trail — written in same transaction
    await record_admin_action(
        db,
        admin_id=admin.id,
        action=f"user.{body.action}",
        target_type="user",
        target_id=str(target.id),
        value_before=value_before,
        value_after=value_after,
        note=body.note,
    )

    await db.commit()

    return AdminUserPatchResponse(
        user_id=target.id,
        action=body.action,
        message=message,
    )
