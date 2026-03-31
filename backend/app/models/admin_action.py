"""
IAAA · Pre-Admin B · AdminAction model

Append-only audit trail. Written on every admin write operation.
Never modified. Never deleted. Source of truth for admin activity.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.session import Base


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    action       = Column(String(100), nullable=False)   # e.g. 'user.tier_change'
    target_type  = Column(String(50),  nullable=False)   # 'user' | 'card' | 'plan' | 'ai_config'
    target_id    = Column(String(255), nullable=True)    # UUID or slug
    value_before = Column(JSONB,       nullable=True)    # changed fields before
    value_after  = Column(JSONB,       nullable=True)    # changed fields after
    note         = Column(Text,        nullable=True)    # optional human comment
    created_at   = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
