-- Fix create_account_on_signup RPC
-- Bug 1: Used "name" column but Accounts table has "company_name"
-- Bug 2: Missing required owner_user_id (NOT NULL) and contact_email

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
  INSERT INTO "Accounts" (company_name, owner_user_id, contact_email)
  VALUES (p_company_name, p_auth_id, p_email)
  RETURNING id INTO v_account_id;

  INSERT INTO "Users" (auth_id, account_id, role, email, full_name)
  VALUES (p_auth_id, v_account_id, 'admin', p_email, p_full_name)
  RETURNING id INTO v_user_id;

  RETURN json_build_object('success', true, 'account_id', v_account_id, 'user_id', v_user_id);
END $func$;

-- Fallback function for existing users who signed up but have no Account/Users record
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

  -- Already has a Users record? Return it
  SELECT id, account_id INTO v_user_id, v_account_id
  FROM "Users" WHERE auth_id = v_auth_id;

  IF v_user_id IS NOT NULL THEN
    RETURN json_build_object('exists', true, 'user_id', v_user_id, 'account_id', v_account_id);
  END IF;

  -- Get info from auth.users metadata
  SELECT email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'company_name'
  INTO v_email, v_full_name, v_company_name
  FROM auth.users WHERE id = v_auth_id;

  -- Create account + user
  INSERT INTO "Accounts" (company_name, owner_user_id, contact_email)
  VALUES (COALESCE(v_company_name, split_part(v_email, '@', 2)), v_auth_id, v_email)
  RETURNING id INTO v_account_id;

  INSERT INTO "Users" (auth_id, account_id, role, email, full_name)
  VALUES (v_auth_id, v_account_id, 'admin', v_email, v_full_name)
  RETURNING id INTO v_user_id;

  RETURN json_build_object('created', true, 'user_id', v_user_id, 'account_id', v_account_id);
END $func$;
