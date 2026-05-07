-- Migration 083: tighten remaining account-scoped RLS rules
-- This closes the last obvious gaps where a matching rep_email alone was enough
-- to access goals or commitments without an explicit account check.

-- Goals: reps should only see their own goals inside their own account.
DROP POLICY IF EXISTS "reps_view_own_goals" ON "Goals";
CREATE POLICY "reps_view_own_goals" ON "Goals"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND EXISTS (
      SELECT 1
      FROM "Users"
      WHERE "Users".auth_id = auth.uid()
        AND "Users".account_id = "Goals".account_id
        AND ("Goals".user_id = "Users".id OR "Goals".rep_email = "Users".email)
    )
  );

-- Coaching commitments: reps should only see/update their own commitments inside their own account.
DROP POLICY IF EXISTS "Reps see own commitments" ON "Coaching_Commitments";
CREATE POLICY "Reps see own commitments"
  ON "Coaching_Commitments"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND rep_email = (
      SELECT email FROM "Users"
      WHERE auth_id = auth.uid()
      LIMIT 1
    )
  );

DROP POLICY IF EXISTS "Reps update own commitments" ON "Coaching_Commitments";
CREATE POLICY "Reps update own commitments"
  ON "Coaching_Commitments"
  FOR UPDATE
  USING (
    account_id = get_my_account_id()
    AND rep_email = (
      SELECT email FROM "Users"
      WHERE auth_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    account_id = get_my_account_id()
    AND rep_email = (
      SELECT email FROM "Users"
      WHERE auth_id = auth.uid()
      LIMIT 1
    )
  );

-- Celebrations: leaders can create team celebrations in their own account.
DROP POLICY IF EXISTS "managers_create_celebrations" ON "Celebrations";
DROP POLICY IF EXISTS "leaders_create_celebrations" ON "Celebrations";
CREATE POLICY "leaders_create_celebrations" ON "Celebrations"
  FOR INSERT
  WITH CHECK (
    account_id = get_my_account_id()
    AND is_account_leader()
  );
