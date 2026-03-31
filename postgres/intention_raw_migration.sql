-- IAAA · intention_raw migration
-- Adds polished raw intention from user's question to cards table.
-- Separate from situation_input (the full question) and from
-- card.intention (the maïeutised version in the SC contract).

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS intention_raw TEXT DEFAULT NULL;

COMMENT ON COLUMN cards.intention_raw IS
  'Polished raw intention extracted from user question. '
  'Spelling/grammar corrected, meaning untouched. '
  'Displayed in Situation soumise block. Never generated if absent.';

-- NOTE: Ce fichier est REDONDANT.
-- intention_migration.sql ajoute déjà intention_raw + intention en une seule passe.
-- Ce fichier n'est PAS exécuté par deploy.sh.
-- Conservé pour traçabilité historique uniquement.
