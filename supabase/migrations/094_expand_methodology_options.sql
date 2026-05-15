-- Expand account methodology values to match the app selector and Copilot routing.

ALTER TABLE "Accounts"
  DROP CONSTRAINT IF EXISTS accounts_methodology_check;

ALTER TABLE "Accounts"
  ADD CONSTRAINT accounts_methodology_check
  CHECK (methodology IN ('sandler', 'challenger', 'gap', 'meddic', 'meddpicc', 'spin'));

CREATE OR REPLACE FUNCTION get_methodology_config(account_uuid UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
DECLARE
    m TEXT;
BEGIN
    SELECT methodology INTO m FROM "Accounts" WHERE id = account_uuid;

    IF m = 'sandler' THEN
        RETURN '{"name":"Sandler","components":["Upfront Contract","Pain Funnel","Budget","Decision Process","Fulfillment","Post-Sell","Bonding & Rapport","Negative Reverse Selling"]}'::JSONB;
    ELSIF m = 'challenger' THEN
        RETURN '{"name":"Challenger","components":["Teaching","Tailoring","Taking Control","Constructive Tension","Commercial Insight","Reframe Thinking"]}'::JSONB;
    ELSIF m = 'spin' THEN
        RETURN '{"name":"SPIN Selling","components":["Situation Questions","Problem Questions","Implication Questions","Need-Payoff Questions","Explicit Need","Question Sequence"]}'::JSONB;
    ELSIF m = 'gap' THEN
        RETURN '{"name":"Gap Selling","components":["Current State","Future State","Gap Identification","Problem Quantification","Root Cause","Impact Assessment"]}'::JSONB;
    ELSIF m = 'meddic' THEN
        RETURN '{"name":"MEDDIC","components":["Metrics","Economic Buyer","Decision Criteria","Decision Process","Identify Pain","Champion"]}'::JSONB;
    ELSIF m = 'meddpicc' THEN
        RETURN '{"name":"MEDDPICC","components":["Metrics","Economic Buyer","Decision Criteria","Decision Process","Paper Process","Identify Pain","Champion","Competition"]}'::JSONB;
    ELSE
        RETURN '{"name":"Custom","components":[]}'::JSONB;
    END IF;
END;
$func$;

CREATE OR REPLACE FUNCTION update_account_methodology(new_methodology TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $func$
DECLARE
    user_account_id UUID;
BEGIN
    SELECT account_id INTO user_account_id
    FROM "User_Roles"
    WHERE user_id = auth.uid() AND role = 'manager'
    LIMIT 1;

    IF user_account_id IS NULL THEN
        RAISE EXCEPTION 'Only managers can update methodology';
    END IF;

    IF new_methodology NOT IN ('sandler', 'challenger', 'gap', 'meddic', 'meddpicc', 'spin') THEN
        RAISE EXCEPTION 'Invalid methodology: %. Must be sandler, challenger, gap, meddic, meddpicc, or spin', new_methodology;
    END IF;

    UPDATE "Accounts"
    SET methodology = new_methodology, updated_at = NOW()
    WHERE id = user_account_id;

    RETURN TRUE;
END;
$func$;
