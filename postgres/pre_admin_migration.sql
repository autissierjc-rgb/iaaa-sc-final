-- IAAA · Pre-Admin A+B · Migration
-- Adds: usage_events, admin_actions
--
-- Apply on staging BEFORE deploying Pre-Admin code:
--   docker compose exec postgres psql -U iaaa_staging_user -d iaaa_staging -f /tmp/pre_admin_migration.sql
--
-- These tables are append-only (no updates, no deletes).
-- usage_events  → cost tracking per LLM call
-- admin_actions → audit trail for all admin write operations

-- ── usage_events ──────────────────────────────────────────────────────────────
-- Written on every LLM call (generate endpoint).
-- Never blocks the main request — written fire-and-forget.
-- cost_usd is estimated from known provider pricing at time of call.
-- NULL cost_usd = unknown provider pricing (not an error).
CREATE TABLE IF NOT EXISTS usage_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = anonymous
    endpoint        VARCHAR(50)  NOT NULL,   -- 'generate' | 'explore'
    provider        VARCHAR(50)  NOT NULL,   -- 'openai' | 'anthropic' | 'openrouter'
    model           VARCHAR(100) NOT NULL,
    tokens_input    INTEGER,                 -- NULL if provider did not return usage
    tokens_output   INTEGER,
    cost_usd        NUMERIC(10, 6),          -- estimated, NULL if unknown
    latency_ms      INTEGER,                 -- wall-clock time for the LLM call
    success         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_user_id    ON usage_events(user_id);
CREATE INDEX idx_usage_created_at ON usage_events(created_at DESC);
CREATE INDEX idx_usage_endpoint   ON usage_events(endpoint);
CREATE INDEX idx_usage_provider   ON usage_events(provider);

-- ── admin_actions ─────────────────────────────────────────────────────────────
-- Written on every admin write operation (PATCH /api/admin/*).
-- Append-only. Never modified. The source of truth for "who changed what when".
-- value_before / value_after: JSONB snapshots of the changed fields only.
CREATE TABLE IF NOT EXISTS admin_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,   -- e.g. 'user.tier_change', 'user.disable'
    target_type     VARCHAR(50)  NOT NULL,   -- 'user' | 'card' | 'plan' | 'ai_config'
    target_id       VARCHAR(255),            -- UUID or slug of the affected object
    value_before    JSONB,                   -- snapshot of changed fields before
    value_after     JSONB,                   -- snapshot of changed fields after
    note            TEXT,                    -- optional human comment from admin
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_actions_admin_id    ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target      ON admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_created_at  ON admin_actions(created_at DESC);
