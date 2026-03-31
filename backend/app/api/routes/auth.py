"""
IAAA · Bloc 6A · Auth routes

POST /api/auth/register  — create account, set cookies, return user
POST /api/auth/login     — verify credentials, set cookies, return user
POST /api/auth/logout    — clear both cookies
POST /api/auth/refresh   — rotate access token from refresh token
GET  /api/auth/me        — return current user (access token required)

Cookie strategy (per architecture decision):
  Two separate httpOnly cookies.
  access_token  (15 min)  — presence checked by Next.js middleware for UX
  refresh_token (30 days) — used only by /api/auth/refresh

Security rule:
  Backend always validates JWT. Frontend middleware is UX-only.
  Password never logged or returned.

No email verification in Bloc 6A.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps              import get_db
from app.models.user           import User
from app.schemas.auth          import RegisterRequest, LoginRequest, UserResponse, TokenRefreshResponse
from app.services.auth         import (
    hash_password, verify_password,
    decode_token,
    set_auth_cookies, clear_auth_cookies, rotate_access_cookie,
    get_access_token_from_request, get_refresh_token_from_request,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Helpers ───────────────────────────────────────────────────────────────────
def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        tier=user.tier,
        is_admin=user.is_admin,
    )


async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


def _unauthorized(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


# ── POST /api/auth/register ───────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body:     RegisterRequest,
    response: Response,
    db:       AsyncSession = Depends(get_db),
) -> UserResponse:
    # Normalize email — strip whitespace, lowercase
    email = body.email.strip().lower()

    # Check email not already taken
    existing = await _get_user_by_email(db, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        password_hash=hash_password(body.password),
        tier="free",
        is_admin=False,
        email_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    set_auth_cookies(response, str(user.id))
    return _user_response(user)


# ── POST /api/auth/login ──────────────────────────────────────────────────────
@router.post("/login", response_model=UserResponse)
async def login(
    body:     LoginRequest,
    response: Response,
    db:       AsyncSession = Depends(get_db),
) -> UserResponse:
    # Normalize email — strip whitespace, lowercase
    email = body.email.strip().lower()
    user = await _get_user_by_email(db, email)

    # Constant-time failure — never reveal whether email exists
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    set_auth_cookies(response, str(user.id))
    return _user_response(user)


# ── POST /api/auth/logout ─────────────────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    clear_auth_cookies(response)


# ── POST /api/auth/refresh ────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    request:  Request,
    response: Response,
    db:       AsyncSession = Depends(get_db),
) -> TokenRefreshResponse:
    token = get_refresh_token_from_request(request)
    if not token:
        raise _unauthorized("No refresh token.")

    user_id = decode_token(token, expected_type="refresh")
    if not user_id:
        raise _unauthorized("Invalid or expired refresh token.")

    user = await _get_user_by_id(db, user_id)
    if not user:
        raise _unauthorized("User not found.")

    rotate_access_cookie(response, str(user.id))  # refresh token unchanged
    return TokenRefreshResponse(ok=True)


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def me(
    request: Request,
    db:      AsyncSession = Depends(get_db),
) -> UserResponse:
    token = get_access_token_from_request(request)
    if not token:
        raise _unauthorized()

    user_id = decode_token(token, expected_type="access")
    if not user_id:
        raise _unauthorized("Invalid or expired token.")

    user = await _get_user_by_id(db, user_id)
    if not user:
        raise _unauthorized("User not found.")

    return _user_response(user)
