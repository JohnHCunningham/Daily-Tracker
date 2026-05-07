-- Migration 084: harden seat enforcement and subscription actions

CREATE OR REPLACE FUNCTION has_available_rep_slot(p_account_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  SELECT COALESCE(rep_count, max_team_members, 1)
  INTO v_limit
  FROM "Accounts"
  WHERE id = p_account_id;

  IF v_limit IS NULL OR v_limit < 1 THEN
    v_limit := 1;
  END IF;

  SELECT
    COALESCE((
      SELECT COUNT(*)
      FROM "Users"
      WHERE account_id = p_account_id
        AND role = 'rep'
    ), 0)
    + COALESCE((
      SELECT COUNT(*)
      FROM "Invitations"
      WHERE account_id = p_account_id
        AND role = 'rep'
        AND status = 'pending'
    ), 0)
  INTO v_used;

  RETURN v_used < v_limit;
END;
$func$;

CREATE OR REPLACE FUNCTION enforce_rep_slot_on_invitations()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.role = 'rep' AND NEW.status = 'pending' AND NOT has_available_rep_slot(NEW.account_id) THEN
    RAISE EXCEPTION 'No rep slots available';
  END IF;

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_enforce_rep_slot_on_invitations ON "Invitations";
CREATE TRIGGER trg_enforce_rep_slot_on_invitations
  BEFORE INSERT OR UPDATE OF role, status, account_id
  ON "Invitations"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_rep_slot_on_invitations();

CREATE OR REPLACE FUNCTION enforce_rep_slot_on_users()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.role = 'rep' AND NOT has_available_rep_slot(NEW.account_id) THEN
    RAISE EXCEPTION 'No rep slots available';
  END IF;

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_enforce_rep_slot_on_users ON "Users";
CREATE TRIGGER trg_enforce_rep_slot_on_users
  BEFORE INSERT OR UPDATE OF role, account_id
  ON "Users"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_rep_slot_on_users();

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_auth_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
BEGIN
  -- Find valid invitation
  SELECT * INTO v_invitation
  FROM "Invitations"
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Mark invitation accepted first so its reserved seat is released before the user insert
  UPDATE "Invitations"
  SET status = 'accepted', updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Create user record linked to account
  INSERT INTO "Users" (auth_id, account_id, role, email)
  VALUES (p_auth_id, v_invitation.account_id, v_invitation.role, v_invitation.email)
  RETURNING id INTO v_user_id;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$func$;

