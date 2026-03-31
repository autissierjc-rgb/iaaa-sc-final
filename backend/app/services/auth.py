"""
IAAA · Bloc 6A · Auth service

Handles:
  - password hashing with bcrypt
  - JWT creation (access + refresh)
  - JWT decoding and validation
  - cookie parameter helpers (HttpOnly, Secure, SameSite=Lax)

Two separate cookies — per architecture decision:
  access_token  : 15 min  — Path=/
  refresh_token : 30 days — Path=/

Cookie flags:
  HttpOnly  = True  (JS cannot read)
  Secure    = True in production
  SameSite  = "lax"

Security boundary rule:
  Frontend middleware checks presence of access_token cookie for UX routing.
  Backend is the source of truth — always validates the JWT on protected routes.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Request, Response

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Token constants ───────────────────────────────────────────────────────────
ACCESS_TOKEN_MINUTES  = 15
REFRESH_TOKEN_DAYS    = 30
ACCESS_COOKIE_NAME    = "access_token"
REFRESH_COOKIE_NAME   = "refresh_token"
ALGORITHM             = "HS256"


# ── Password ──────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────
def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub":  subject,          # user id (UUID string)
        "type": token_type,       # "access" | "refresh"
        "exp":  expire,
        "iat":  datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: str) -> str:
    return _create_token(user_id, timedelta(minutes=ACCESS_TOKEN_MINUTES), "access")


def create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, timedelta(days=REFRESH_TOKEN_DAYS), "refresh")


def decode_token(token: str, expected_type: str) -> Optional[str]:
    """
    Decode and validate a JWT.
    Returns the subject (user_id) or None if invalid.
    Does NOT raise — callers handle None as Unauthorized.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None


# ── Cookie helpers ────────────────────────────────────────────────────────────
def _is_production() -> bool:
    return settings.DOMAIN != "localhost"


def set_auth_cookies(response: Response, user_id: str) -> None:
    """Set both access and refresh cookies on a response."""
    is_prod = _is_production()
    access  = create_access_token(user_id)
    refresh = create_refresh_token(user_id)

    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=ACCESS_TOKEN_MINUTES * 60,
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=REFRESH_TOKEN_DAYS * 24 * 3600,
    )


def rotate_access_cookie(response: Response, user_id: str) -> None:
    """
    Rotate access token only — refresh token remains unchanged.
    Used by POST /api/auth/refresh.
    """
    is_prod = _is_production()
    access  = create_access_token(user_id)
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=ACCESS_TOKEN_MINUTES * 60,
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear both cookies on logout."""
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")


def get_access_token_from_request(request: Request) -> Optional[str]:
    return request.cookies.get(ACCESS_COOKIE_NAME)


def get_refresh_token_from_request(request: Request) -> Optional[str]:
    return request.cookies.get(REFRESH_COOKIE_NAME)
