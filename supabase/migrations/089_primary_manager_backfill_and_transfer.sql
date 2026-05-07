-- Migration 089: backfill and maintain primary manager ownership

ALTER TABLE "Accounts"
  ADD COLUMN IF NOT EXISTS primary_manager_user_id UUID;

-- Backfill existing accounts to the first admin/manager on the account, then owner_user_id fallback
UPDATE "Accounts" a
SET primary_manager_user_id = COALESCE(
  a.primary_manager_user_id,
  (
    SELECT u.id
    FROM "Users" u
    WHERE u.account_id = a.id
      AND u.role IN ('admin', 'manager')
    ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.created_at ASC
    LIMIT 1
  ),
  (
    SELECT u.id
    FROM "Users" u
    WHERE u.auth_id = a.owner_user_id
    LIMIT 1
  )
)
WHERE a.primary_manager_user_id IS NULL;

-- Keep account creation paths aligned with the primary manager field
CREATE OR REPLACE FUNCTION create_account_on_signup(
  p_auth_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_company_name TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
DECLARE
  v_account_id UUID;
  v_user_id UUID;
BEGIN
  INSERT INTO "Accounts" (company_name, owner_user_id, contact_email, primary_manager_user_id)
  VALUES (p_company_name, p_auth_id, p_email, NULL)
  RETURNING id INTO v_account_id;

  INSERT INTO "Users" (auth_id, account_id, role, email, full_name)
  VALUES (p_auth_id, v_account_id, 'admin', p_email, p_full_name)
  RETURNING id INTO v_user_id;

  UPDATE "Accounts"
  SET primary_manager_user_id = v_user_id
  WHERE id = v_account_id;

  RETURN json_build_object('success', true, 'account_id', v_account_id, 'user_id', v_user_id);
END $func$;

CREATE OR REPLACE FUNCTION ensure_user_has_account()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
DECLARE
  v_auth_id UUID;
  v_email TEXT;
  v_full_name TEXT;
  v_company_name TEXT;
  v_account_id UUID;
  v_user_id UUID;
BEGIN
  v_auth_id := auth.uid();

  SELECT id, account_id INTO v_user_id, v_account_id
  FROM "Users" WHERE auth_id = v_auth_id;

  IF v_user_id IS NOT NULL THEN
    RETURN json_build_object('exists', true, 'user_id', v_user_id, 'account_id', v_account_id);
  END IF;

  SELECT email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'company_name'
  INTO v_email, v_full_name, v_company_name
  FROM auth.users WHERE id = v_auth_id;

  INSERT INTO "Accounts" (company_name, owner_user_id, contact_email, primary_manager_user_id)
  VALUES (COALESCE(v_company_name, split_part(v_email, '@', 2)), v_auth_id, v_email, NULL)
  RETURNING id INTO v_account_id;

  INSERT INTO "Users" (auth_id, account_id, role, email, full_name)
  VALUES (v_auth_id, v_account_id, 'admin', v_email, v_full_name)
  RETURNING id INTO v_user_id;

  UPDATE "Accounts"
  SET primary_manager_user_id = v_user_id
  WHERE id = v_account_id;

  RETURN json_build_object('created', true, 'user_id', v_user_id, 'account_id', v_account_id);
END $func$;
