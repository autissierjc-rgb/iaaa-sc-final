"""
IAAA · Bloc 6B · SituationCard model

Mirrors the `situation_cards` table in postgres/init.sql.

content JSONB = frozen SituationCard contract (from contracts.py).
reframe is NOT stored — UI field only, not persisted per architecture decision.
slug is immutable after first save — enforced at service layer.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey

from app.db.session import Base


class SituationCard(Base):
    __tablename__ = "situation_cards"

    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:    Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    slug:       Mapped[str]       = mapped_column(String(255), unique=True, nullable=False, index=True)
    title:      Mapped[str]       = mapped_column(Text, nullable=False)
    content:    Mapped[dict]      = mapped_column(JSONB, nullable=False)   # frozen SituationCard contract
    is_public:       Mapped[bool]       = mapped_column(Boolean, nullable=False, default=False)
    view_count:      Mapped[int]        = mapped_column(Integer, nullable=False, default=0)
    situation_input: Mapped[str | None] = mapped_column(Text, nullable=True)   # original user input — "vraie question"
    intention_raw:   Mapped[str | None] = mapped_column(Text, nullable=True)   # user intention, spelling-corrected only
    intention:       Mapped[str | None] = mapped_column(Text, nullable=True)   # maïeutised intention — shown in Cap
    intention_raw:   Mapped[str | None] = mapped_column(Text, nullable=True)   # polished raw intention from user's question
    created_at:      Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:      Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
