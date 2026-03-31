-- IAAA · Admin 2 · Migration
-- Adds is_active and account_expires_at to users table.
--
-- Apply on staging BEFORE deploying Admin 2 code:
--   docker compose exec postgres psql -U iaaa_staging_user -d iaaa_staging \
--     -f /tmp/admin2_migration.sql
--
-- is_active = false → user is disabled. Auth returns 403.
-- account_expires_at = NULL → no expiration. Non-null → access blocked after that date.
--
-- Safe to run on existing data:
--   All existing users get is_active=true and account_expires_at=NULL (no change in behavior).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active          BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS account_expires_at TIMESTAMPTZ          DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = false;
