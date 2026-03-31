"""
IAAA · Bloc 6A · User model

Mirrors the `users` table defined in postgres/init.sql.
Do not add columns here without also migrating init.sql.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base

TierEnum = SAEnum("free", "clarity", "sis", "plus", name="user_tier")


class User(Base):
    __tablename__ = "users"

    id:                 Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email:              Mapped[str]       = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash:      Mapped[str]       = mapped_column(String(255), nullable=False)
    tier:               Mapped[str]       = mapped_column(TierEnum, nullable=False, server_default="free")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_admin:           Mapped[bool]           = mapped_column(Boolean, nullable=False, server_default="false")
    email_verified:     Mapped[bool]           = mapped_column(Boolean, nullable=False, server_default="false")
    # Admin 2 — account lifecycle
    is_active:          Mapped[bool]           = mapped_column(Boolean, nullable=False, server_default="true")
    account_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:         Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:         Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
