-- Migration: Collapse MEDDIC → MEDDPICC
-- MEDDPICC is now the canonical qualification methodology.
-- MEDDIC (6-letter) accounts are migrated to MEDDPICC (8-letter).

BEGIN;

-- 1. Migrate existing MEDDIC accounts to MEDDPICC
UPDATE "Accounts"
SET methodology = 'meddpicc'
WHERE methodology = 'meddic';

-- 2. Update user_settings for any users who selected MEDDIC
UPDATE "user_settings"
SET selected_methodology = 'meddpicc'
WHERE selected_methodology = 'meddic';

-- 3. Drop old constraint and add new one
ALTER TABLE "user_settings"
DROP CONSTRAINT IF EXISTS user_settings_methodology_check;

ALTER TABLE "user_settings"
ADD CONSTRAINT user_settings_methodology_check
CHECK (selected_methodology IN ('sandler', 'challenger', 'gap', 'meddpicc', 'spin'));

-- 4. Update any coaching messages referencing the old methodology
UPDATE "Coaching_Messages"
SET methodology = 'meddpicc'
WHERE methodology = 'meddic';

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'MEDDIC → MEDDPICC consolidation complete';
    RAISE NOTICE '  ✓ Accounts migrated';
    RAISE NOTICE '  ✓ User settings migrated';
    RAISE NOTICE '  ✓ Constraint updated (sandler, challenger, gap, meddpicc, spin)';
    RAISE NOTICE '  ✓ Coaching messages migrated';
END $$;
