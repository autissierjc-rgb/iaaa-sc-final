from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── Auth ──────────────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── AI Provider ───────────────────────────────────────────────────────────
    # One active provider at a time. Switch via env var.
    # openrouter = OpenAI-compatible API, any model, admin-controllable.
    # Management key (OPENROUTER_MGMT_KEY) is separate — used only for
    # admin key rotation/listing, never for inference calls.
    AI_PROVIDER: Literal["openai", "anthropic", "openrouter"] = "openai"
    OPENAI_API_KEY:       str = ""
    ANTHROPIC_API_KEY:    str = ""
    OPENROUTER_API_KEY:   str = ""           # inference key — backend only
    OPENROUTER_MGMT_KEY:  str = ""           # management key — admin only, Bloc Admin
    OPENROUTER_DEFAULT_MODEL: str = "openai/gpt-4o"  # overridable per admin config

    # ── Stripe ────────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY:      str = ""
    STRIPE_WEBHOOK_SECRET:  str = ""
    STRIPE_PRICE_ID_CLARITY: str = ""
    STRIPE_PRICE_ID_SIS:    str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    DOMAIN: str = "iaaa.app"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
