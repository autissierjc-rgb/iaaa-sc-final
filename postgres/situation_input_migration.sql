-- IAAA · situation_input migration
-- Adds the original user input to cards table.
-- This is the "vraie question" — displayed at the top of the SC on Atlas.
-- Non-destructive — existing cards get NULL, gracefully handled by frontend.

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS situation_input TEXT DEFAULT NULL;

COMMENT ON COLUMN cards.situation_input IS
  'Original user input that generated this card. Persisted for Atlas display and traceability.';
