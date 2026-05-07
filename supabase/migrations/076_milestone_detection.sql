-- Migration 076: Milestone detection function
-- Checks for achievements and inserts into Celebrations with dedup.

-- Recreate the base Celebrations table if production drift removed it.
CREATE TABLE IF NOT EXISTS "Celebrations" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE,
  rep_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('badge', 'milestone', 'streak', 'achievement')),
  title TEXT NOT NULL,
  description TEXT,
  badge_key TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "Celebrations" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_view_celebrations" ON "Celebrations";
CREATE POLICY "account_view_celebrations" ON "Celebrations"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".auth_id = auth.uid()
      AND "Users".account_id = "Celebrations".account_id
    )
  );

DROP POLICY IF EXISTS "managers_create_celebrations" ON "Celebrations";
CREATE POLICY "managers_create_celebrations" ON "Celebrations"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".auth_id = auth.uid()
      AND "Users".account_id = "Celebrations".account_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_celebrations_account ON "Celebrations"(account_id);
CREATE INDEX IF NOT EXISTS idx_celebrations_user ON "Celebrations"(user_id);

-- Add badge_key + rep_email unique index for dedup (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_celebrations_dedup
  ON "Celebrations"(account_id, rep_email, badge_key)
  WHERE badge_key IS NOT NULL AND rep_email IS NOT NULL;

-- Milestone detection function
CREATE OR REPLACE FUNCTION detect_milestones(p_account_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rep RECORD;
  new_count INT := 0;
  conv_count INT;
  high_score_count INT;
  goal_hit BOOLEAN;
  streak INT;
  prev_score NUMERIC;
  call_rec RECORD;
BEGIN
  -- Loop through all reps in the account
  FOR rep IN
    SELECT id, email FROM "Users"
    WHERE account_id = p_account_id AND role = 'rep'
  LOOP

    -- 1. First call analyzed
    SELECT COUNT(*) INTO conv_count
    FROM "Synced_Conversations"
    WHERE account_id = p_account_id
      AND rep_email = rep.email
      AND methodology_scores IS NOT NULL;

    IF conv_count >= 1 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'milestone',
        'First Call Analyzed',
        'Had their first sales call analyzed by the coaching system.',
        'first_call'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    -- 2. First 8+ Sandler score (any call avg >= 8)
    SELECT COUNT(*) INTO high_score_count
    FROM "Synced_Conversations"
    WHERE account_id = p_account_id
      AND rep_email = rep.email
      AND methodology_scores IS NOT NULL
      AND (
        SELECT AVG(val::NUMERIC)
        FROM jsonb_each_text(methodology_scores) AS kv(key, val)
      ) >= 8;

    IF high_score_count >= 1 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'badge',
        'Score Champion',
        'Achieved an average Sandler score of 8 or higher on a call.',
        'score_champion'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    -- 3. Quota hit (any Goals where current_value >= target_value)
    SELECT EXISTS(
      SELECT 1 FROM "Goals"
      WHERE account_id = p_account_id
        AND (rep_email = rep.email OR rep_email IS NULL)
        AND current_value >= target_value
        AND target_value > 0
    ) INTO goal_hit;

    IF goal_hit THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'milestone',
        'Quota Crusher',
        'Hit or exceeded their target on a goal.',
        'quota_hit'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    -- 4. Improvement streak (3+ consecutive calls with rising avg scores)
    streak := 0;
    prev_score := NULL;

    FOR call_rec IN
      SELECT
        call_date,
        (SELECT AVG(val::NUMERIC) FROM jsonb_each_text(methodology_scores) AS kv(key, val)) AS avg_score
      FROM "Synced_Conversations"
      WHERE account_id = p_account_id
        AND rep_email = rep.email
        AND methodology_scores IS NOT NULL
      ORDER BY call_date DESC
      LIMIT 10
    LOOP
      IF prev_score IS NOT NULL AND call_rec.avg_score IS NOT NULL THEN
        -- Since we're iterating newest-first, "rising" means prev (newer) > current (older)
        IF prev_score > call_rec.avg_score THEN
          streak := streak + 1;
        ELSE
          EXIT;
        END IF;
      END IF;
      prev_score := call_rec.avg_score;
    END LOOP;

    IF streak >= 3 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'streak',
        'Streak Builder',
        'Improved scores on 3 or more consecutive calls.',
        'streak_builder'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

  END LOOP;

  RETURN new_count;
END;
$$;

COMMENT ON FUNCTION detect_milestones(UUID) IS
  'Scans reps in account for milestone achievements, inserts into Celebrations with dedup';

SELECT 'Migration 076 complete: detect_milestones() function' AS status;
