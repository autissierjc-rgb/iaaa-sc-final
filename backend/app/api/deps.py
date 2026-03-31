"""
IAAA · Bloc 6A · FastAPI Dependencies

get_db              — async DB session (replaces Bloc 0 stub)
get_current_user    — JWT from httpOnly cookie → User row (replaces stub)
get_current_user_optional — same, returns None for unauthenticated
require_tier        — tier gate (no Redis, check at service layer)

Cookie-based auth:
  Reads access_token httpOnly cookie — not Authorization header.
  Bearer scheme stub removed: cookies are the auth mechanism in V1.

Security boundary:
  Backend always validates JWT.
  Frontend middleware (middleware.ts) only checks cookie presence for UX.
"""

from typing import AsyncGenerator, Optional
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session    import AsyncSessionLocal
from app.models.user   import User
from app.services.auth import decode_token, get_access_token_from_request


# ── DB session ────────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# ── Auth helpers ──────────────────────────────────────────────────────────────
async def _resolve_user(request: Request, db: AsyncSession) -> Optional[User]:
    token = get_access_token_from_request(request)
    if not token:
        return None
    user_id = decode_token(token, expected_type="access")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


# ── get_current_user ──────────────────────────────────────────────────────────
async def get_current_user(
    request: Request,
    db:      AsyncSession = Depends(get_db),
) -> User:
    user = await _resolve_user(request, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    # Account lifecycle checks (Admin 2)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled.")
    if user.account_expires_at and user.account_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account expired.")
    return user


# ── get_current_user_optional ─────────────────────────────────────────────────
async def get_current_user_optional(
    request: Request,
    db:      AsyncSession = Depends(get_db),
) -> Optional[User]:
    return await _resolve_user(request, db)


# ── require_admin ─────────────────────────────────────────────────────────────
async def require_admin(user: User = Depends(get_current_user)) -> User:
    """
    Gate admin routes to users with is_admin=True.
    Returns 403 (not 404) — admin routes are not secret, just protected.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


# ── require_tier ──────────────────────────────────────────────────────────────
TIER_ORDER = {"free": 0, "clarity": 1, "sis": 2, "plus": 3}


def require_tier(minimum_tier: str):
    """
    Dependency factory — gate a route to a minimum tier.
    Usage: Depends(require_tier("sis"))
    Raises 403 if user tier is below minimum.
    No Redis. No queue. Checked at service layer per architecture brief.
    """
    async def _check(user: User = Depends(get_current_user)) -> User:
        if TIER_ORDER.get(user.tier, 0) < TIER_ORDER.get(minimum_tier, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires the '{minimum_tier}' tier or above.",
            )
        return user
    return _check
