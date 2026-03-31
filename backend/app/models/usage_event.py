"""
IAAA · Pre-Admin A · UsageEvent model

Append-only table. Written fire-and-forget on every LLM call.
Never blocks the main request — see services/usage.py.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean, Column, Integer, Numeric, String, Text,
    TIMESTAMP, ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    endpoint     = Column(String(50),  nullable=False)   # 'generate' | 'explore'
    provider     = Column(String(50),  nullable=False)   # 'openai' | 'anthropic' | 'openrouter'
    model        = Column(String(100), nullable=False)
    tokens_input = Column(Integer,     nullable=True)
    tokens_output= Column(Integer,     nullable=True)
    cost_usd     = Column(Numeric(10, 6), nullable=True) # estimated; NULL = unknown pricing
    latency_ms   = Column(Integer,     nullable=True)
    success      = Column(Boolean,     nullable=False, default=True)
    created_at   = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
