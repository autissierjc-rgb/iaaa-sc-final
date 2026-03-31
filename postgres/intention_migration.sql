-- IAAA · intention fields migration
-- Two fields, non-destructive.
-- intention_raw : user's words, spelling-corrected only — shown in "Situation soumise"
-- intention     : maïeutised by discovery chat — shown in Cap with cible picto

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS intention_raw TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS intention     TEXT DEFAULT NULL;

COMMENT ON COLUMN cards.intention_raw IS
  'User intention, spelling-corrected only. Shown in Situation soumise block. Not modified in meaning.';

COMMENT ON COLUMN cards.intention IS
  'Intention clarified by discovery chat (maïeutisée). Shown in Cap with cible picto. Never generated — only clarified.';
