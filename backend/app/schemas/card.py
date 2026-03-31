"""
IAAA · Bloc 6B · Card schemas

SaveCardRequest:
  card      — frozen SituationCard contract
  is_public — whether the card is publicly accessible at /sc/[slug]

reframe is NOT in the save request — per architecture decision:
  - reframe is a UI field, not persisted
  - content JSONB stores only the frozen SituationCard

CardResponse mirrors what the frontend needs for /sc/[slug] and My Situations.
"""

import uuid
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class SaveCardRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    card:            dict       = Field(..., description="Frozen SituationCard contract")
    is_public:       bool       = Field(default=False)
    situation_input: str | None = Field(default=None, description="Original user input — the real question asked")
    intention_raw:   str | None = Field(default=None, description="Polished raw intention — user words, corrected only for spelling")
    intention:       str | None = Field(default=None, description="Maïeutised intention — clarified by discovery chat, shown in Cap")
    # reframe intentionally excluded — not persisted, UI field only


class CardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id:              uuid.UUID
    slug:            str
    title:           str
    content:         dict          # frozen SituationCard
    is_public:       bool
    view_count:      int
    situation_input: str | None = None   # original user input — displayed on Atlas
    intention_raw:   str | None = None   # polished raw intention — displayed in situation soumise
    intention:       str | None = None   # maïeutised intention — displayed in Cap with cible picto
    created_at:      datetime
    updated_at:      datetime | None = None


class CardListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cards: list[CardResponse]
    total: int
