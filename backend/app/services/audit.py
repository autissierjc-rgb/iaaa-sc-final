"""
IAAA · Pre-Admin B · Admin audit trail service

Writes AdminAction rows on every admin write operation.
Called explicitly from admin route handlers.

Design:
  - Synchronous write (not fire-and-forget) — audit trail must not be lost
  - Raises on DB failure so the calling route can decide to rollback
  - value_before / value_after are plain dicts of changed fields only
    (not full object snapshots — too heavy and exposes sensitive data)

Usage:
    from app.services.audit import record_admin_action

    await record_admin_action(
        db,
        admin_id=admin.id,
        action="user.tier_change",
        target_type="user",
        target_id=str(user.id),
        value_before={"tier": "free"},
        value_after={"tier": "clarity"},
    )

Action naming convention: "{target_type}.{verb}"
Examples:
  user.tier_change
  user.disable
  user.enable
  user.quota_reset
  card.visibility_change
  card.delete
  ai_config.model_change
  ai_config.provider_change
"""

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_action import AdminAction


async def record_admin_action(
    db: AsyncSession,
    *,
    admin_id: uuid.UUID,
    action: str,
    target_type: str,
    target_id: str | None = None,
    value_before: dict[str, Any] | None = None,
    value_after: dict[str, Any] | None = None,
    note: str | None = None,
) -> AdminAction:
    """
    Write an admin audit trail entry.

    This is a synchronous write — not fire-and-forget.
    The caller is responsible for committing the surrounding transaction.
    If the audit write fails, the calling route should rollback.

    Returns the created AdminAction (not yet committed).
    """
    entry = AdminAction(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        value_before=value_before,
        value_after=value_after,
        note=note,
    )
    db.add(entry)
    return entry
