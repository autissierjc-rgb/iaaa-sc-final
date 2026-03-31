"""
IAAA · Bloc 6A · Auth schemas
"""

import uuid
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email:    EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email:    EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    """
    Public user shape — never exposes password_hash or sensitive fields.
    email_verified excluded: email verification not implemented in V1.
    """
    model_config = ConfigDict(extra="forbid")
    id:       uuid.UUID
    email:    str
    tier:     str
    is_admin: bool


class TokenRefreshResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ok: bool = True
