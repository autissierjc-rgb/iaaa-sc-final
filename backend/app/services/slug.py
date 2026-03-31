"""
IAAA · Bloc 6B · Slug service

Generates SEO-friendly slugs from card titles.
Handles deduplication with numeric suffix: -2, -3, etc.

Rules:
  - lowercase
  - trim whitespace
  - replace non-alphanumeric with hyphens
  - collapse multiple hyphens
  - max 80 characters (reasonable URL length)
  - if slug already exists in DB → append -2, -3, etc.
  - slug is immutable after first save (enforced at route layer)
"""

import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.card import SituationCard


def _slugify(text: str) -> str:
    """Convert a title string to a URL-safe slug."""
    slug = text.strip().lower()
    slug = re.sub(r"[^\w\s-]", "", slug)       # remove special chars
    slug = re.sub(r"[\s_]+", "-", slug)          # spaces/underscores → hyphens
    slug = re.sub(r"-{2,}", "-", slug)            # collapse multiple hyphens
    slug = slug.strip("-")                         # strip leading/trailing hyphens
    return slug[:80]                               # max 80 chars


async def generate_unique_slug(title: str, db: AsyncSession) -> str:
    """
    Generate a unique slug for a card title.
    If the base slug is taken, appends -2, -3, etc.
    """
    base = _slugify(title)
    if not base:
        base = "situation"  # fallback for edge cases

    # Check base slug
    candidate = base
    result = await db.execute(
        select(SituationCard.slug).where(SituationCard.slug == candidate)
    )
    if result.scalar_one_or_none() is None:
        return candidate

    # Find first available suffix
    suffix = 2
    while True:
        candidate = f"{base}-{suffix}"
        result = await db.execute(
            select(SituationCard.slug).where(SituationCard.slug == candidate)
        )
        if result.scalar_one_or_none() is None:
            return candidate
        suffix += 1
        if suffix > 999:
            # Extreme edge case — fall back to UUID fragment
            import uuid
            return f"{base}-{str(uuid.uuid4())[:8]}"
