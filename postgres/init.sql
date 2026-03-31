-- IAAA · V1 · Database Schema
-- Frozen. Do not alter without explicit block instruction.
-- Applies on first postgres container start via docker-entrypoint-initdb.d

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ── Enums ─────────────────────────────────────────────────────────────────────
CREATE TYPE user_tier AS ENUM ('free', 'clarity', 'sis', 'plus');

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       TEXT NOT NULL,
    tier                user_tier NOT NULL DEFAULT 'free',
    stripe_customer_id  VARCHAR(255),
    is_admin            BOOLEAN NOT NULL DEFAULT false,
    email_verified      BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ── situation_cards ───────────────────────────────────────────────────────────
-- user_id NULLABLE → allows anonymous card generation
-- content JSONB → full frozen Situation Card JSON
-- slug immutable after first save (enforced at service layer)
CREATE TABLE IF NOT EXISTS situation_cards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    content     JSONB NOT NULL,    -- frozen Situation Card contract
    is_public   BOOLEAN NOT NULL DEFAULT false,
    view_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_cards_user_id    ON situation_cards(user_id);
CREATE INDEX idx_cards_slug       ON situation_cards(slug);
CREATE INDEX idx_cards_is_public  ON situation_cards(is_public) WHERE is_public = true;
CREATE INDEX idx_cards_created_at ON situation_cards(created_at DESC);

-- ── card_notes ────────────────────────────────────────────────────────────────
-- One private note per user per card. Not public. Not threaded.
CREATE TABLE IF NOT EXISTS card_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id     UUID NOT NULL REFERENCES situation_cards(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    UNIQUE (card_id, user_id)   -- one note per (card, user) — enforced
);

CREATE INDEX idx_notes_card_user ON card_notes(card_id, user_id);

-- ── star_map_explorations (cache only — optional) ─────────────────────────────
-- Build this table if caching explorations is needed.
-- dimension is one of 8 fixed branches: risk|opportunity|time|power|constraints|change|stability|uncertainty
CREATE TABLE IF NOT EXISTS star_map_explorations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id     UUID NOT NULL REFERENCES situation_cards(id) ON DELETE CASCADE,
    dimension   VARCHAR(50) NOT NULL,
    content     JSONB NOT NULL,    -- frozen Exploration JSON contract
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (card_id, dimension)    -- one exploration cache per (card, dimension)
);

CREATE INDEX idx_explorations_card ON star_map_explorations(card_id);

-- ── subscriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_sub_id       VARCHAR(255) UNIQUE,
    stripe_price_id     VARCHAR(255),
    status              VARCHAR(50),
    current_period_end  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id    ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_sub_id);
