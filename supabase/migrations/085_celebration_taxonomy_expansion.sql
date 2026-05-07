-- Migration 085: Expand celebration taxonomy around methodology, execution, and business wins
-- Adds more behavior-linked celebration types and keeps them account-scoped.

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
  overall_best NUMERIC;
  perfect_call_count INT;
  recent_five_high_count INT;
  upfront_best NUMERIC;
  pain_best NUMERIC;
  budget_best NUMERIC;
  decision_best NUMERIC;
  criteria_best NUMERIC;
  identify_pain_best NUMERIC;
  current_state_best NUMERIC;
BEGIN
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

    -- 2. Core methodology wins
    SELECT
      MAX(NULLIF(methodology_scores ->> 'Upfront Contract', '')::NUMERIC),
      MAX(NULLIF(methodology_scores ->> 'Pain Funnel', '')::NUMERIC),
      MAX(NULLIF(methodology_scores ->> 'Budget', '')::NUMERIC),
      MAX(NULLIF(methodology_scores ->> 'Decision Process', '')::NUMERIC),
      MAX(NULLIF(methodology_scores ->> 'Decision Criteria', '')::NUMERIC),
      MAX(NULLIF(methodology_scores ->> 'Identify Pain', '')::NUMERIC),
      MAX(NULLIF(methodology_scores ->> 'Current State Discovery', '')::NUMERIC)
    INTO
      upfront_best,
      pain_best,
      budget_best,
      decision_best,
      criteria_best,
      identify_pain_best,
      current_state_best
    FROM "Synced_Conversations"
    WHERE account_id = p_account_id
      AND rep_email = rep.email
      AND methodology_scores IS NOT NULL;

    IF COALESCE(upfront_best, 0) >= 8 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'badge',
        'Upfront Contract Master',
        'Consistently setting clear expectations and next steps.',
        'upfront_contract_master'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    IF COALESCE(pain_best, 0) >= 8 OR COALESCE(identify_pain_best, 0) >= 8 OR COALESCE(current_state_best, 0) >= 8 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'badge',
        'Pain Funnel Pro',
        'Strong discovery and pain handling are showing up in the calls.',
        'pain_funnel_pro'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    IF COALESCE(budget_best, 0) >= 8 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'badge',
        'Budget Champion',
        'Budget is being handled directly and early.',
        'budget_champion'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    IF COALESCE(decision_best, 0) >= 8 OR COALESCE(criteria_best, 0) >= 8 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'badge',
        'Decision Process Master',
        'The buying process is being clarified instead of guessed at.',
        'decision_process_master'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    -- 3. First 8+ Sandler score (any call avg >= 8)
    SELECT COUNT(*) INTO high_score_count
    FROM "Synced_Conversations"
    WHERE account_id = p_account_id
      AND rep_email = rep.email
      AND methodology_scores IS NOT NULL
      AND (
        SELECT AVG(NULLIF(val, '')::NUMERIC)
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

    -- 4. Perfect component score
    SELECT COUNT(*) INTO perfect_call_count
    FROM "Synced_Conversations"
    WHERE account_id = p_account_id
      AND rep_email = rep.email
      AND methodology_scores IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_each_text(methodology_scores) AS kv(key, val)
        WHERE NULLIF(val, '')::NUMERIC >= 10
      );

    IF perfect_call_count >= 1 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'badge',
        'Perfect Score',
        'A methodology component hit a perfect 10/10.',
        'perfect_score'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    -- 5. Consistent closer: last five analyzed calls stay strong
    SELECT COUNT(*) INTO recent_five_high_count
    FROM (
      SELECT
        (
          SELECT AVG(NULLIF(val, '')::NUMERIC)
          FROM jsonb_each_text(methodology_scores) AS kv(key, val)
        ) AS avg_score
      FROM "Synced_Conversations"
      WHERE account_id = p_account_id
        AND rep_email = rep.email
        AND methodology_scores IS NOT NULL
      ORDER BY call_date DESC
      LIMIT 5
    ) recent_calls
    WHERE avg_score >= 7;

    IF recent_five_high_count >= 5 THEN
      INSERT INTO "Celebrations" (account_id, user_id, rep_email, type, title, description, badge_key)
      VALUES (
        p_account_id, rep.id, rep.email, 'streak',
        'Consistent Closer',
        'Kept execution strong across five recent calls.',
        'consistent_closer'
      )
      ON CONFLICT (account_id, rep_email, badge_key) DO NOTHING;

      IF FOUND THEN new_count := new_count + 1; END IF;
    END IF;

    -- 6. Quota hit (any Goals where current_value >= target_value)
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

    -- 7. Improvement streak (3+ consecutive calls with rising avg scores)
    streak := 0;
    prev_score := NULL;

    FOR call_rec IN
      SELECT
        call_date,
        (SELECT AVG(NULLIF(val, '')::NUMERIC) FROM jsonb_each_text(methodology_scores) AS kv(key, val)) AS avg_score
      FROM "Synced_Conversations"
      WHERE account_id = p_account_id
        AND rep_email = rep.email
        AND methodology_scores IS NOT NULL
      ORDER BY call_date DESC
      LIMIT 10
    LOOP
      IF prev_score IS NOT NULL AND call_rec.avg_score IS NOT NULL THEN
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
  'Scans reps in account for milestone achievements, inserts into Celebrations with expanded methodology, execution, and business wins';
