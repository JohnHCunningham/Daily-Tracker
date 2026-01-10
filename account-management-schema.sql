-- ============================================
-- ACCOUNT & WHITE LABEL MANAGEMENT
-- Multi-tenant system where first user = manager/owner
-- ============================================

-- ============================================
-- TABLE: Accounts (Organizations)
-- Each account = one company/sales consultant
-- ============================================
CREATE TABLE IF NOT EXISTS "Accounts" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- White Label Settings
    company_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    primary_color VARCHAR(7) DEFAULT '#10C3B0', -- Hex color for branding

    -- Account owner (first user to sign up)
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Subscription/limits
    max_team_members INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: User_Roles
-- Maps users to accounts with their role
-- ============================================
CREATE TABLE IF NOT EXISTS "User_Roles" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,

    -- Role: 'manager' (owner/admin) or 'user' (team member/rep)
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'user')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One user per account
    UNIQUE(user_id, account_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON "User_Roles"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_account ON "User_Roles"(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON "Accounts"(owner_user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE "Accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User_Roles" ENABLE ROW LEVEL SECURITY;

-- Users can view their own account
CREATE POLICY "Users can view their account"
    ON "Accounts" FOR SELECT
    USING (
        id IN (
            SELECT account_id FROM "User_Roles" WHERE user_id = auth.uid()
        )
    );

-- Only managers can update account settings
CREATE POLICY "Managers can update account"
    ON "Accounts" FOR UPDATE
    USING (
        owner_user_id = auth.uid() OR
        id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid() AND role = 'manager'
        )
    );

-- Users can view their own role
CREATE POLICY "Users can view their role"
    ON "User_Roles" FOR SELECT
    USING (user_id = auth.uid());

-- Managers can view all roles in their account
CREATE POLICY "Managers can view team roles"
    ON "User_Roles" FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid() AND role = 'manager'
        )
    );

-- Managers can add users to their account
CREATE POLICY "Managers can add users"
    ON "User_Roles" FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid() AND role = 'manager'
        )
    );

-- Managers can update/remove users in their account
CREATE POLICY "Managers can manage users"
    ON "User_Roles" FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid() AND role = 'manager'
        )
    );

CREATE POLICY "Managers can delete users"
    ON "User_Roles" FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid() AND role = 'manager'
        )
    );

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_accounts_updated_at ON "Accounts";
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON "Accounts"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON "User_Roles";
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON "User_Roles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Check if user is manager
-- ============================================
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "User_Roles"
    WHERE user_id = auth.uid() AND role = 'manager'
  );
END;
$$;

-- ============================================
-- FUNCTION: Get user's account
-- ============================================
CREATE OR REPLACE FUNCTION get_user_account()
RETURNS TABLE (
    account_id UUID,
    company_name VARCHAR(255),
    logo_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    primary_color VARCHAR(7),
    user_role VARCHAR(20),
    is_manager BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.company_name,
    a.logo_url,
    a.contact_email,
    a.contact_phone,
    a.primary_color,
    ur.role,
    (ur.role = 'manager')
  FROM "Accounts" a
  JOIN "User_Roles" ur ON a.id = ur.account_id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- ============================================
-- FUNCTION: Create account (first signup)
-- Called after user signs up to create their account
-- ============================================
CREATE OR REPLACE FUNCTION create_account_for_user(
    user_email TEXT,
    company_name_input TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_account_id UUID;
    target_user_id UUID;
    company_name_final TEXT;
BEGIN
    -- Get user ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;

    -- Check if user already has an account
    IF EXISTS (SELECT 1 FROM "User_Roles" WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'User already has an account';
    END IF;

    -- Use provided company name or default to email domain
    IF company_name_input IS NOT NULL THEN
        company_name_final := company_name_input;
    ELSE
        company_name_final := split_part(user_email, '@', 1) || '''s Sales Team';
    END IF;

    -- Create account
    INSERT INTO "Accounts" (
        company_name,
        owner_user_id,
        contact_email
    ) VALUES (
        company_name_final,
        target_user_id,
        user_email
    )
    RETURNING id INTO new_account_id;

    -- Assign user as manager
    INSERT INTO "User_Roles" (
        user_id,
        account_id,
        role
    ) VALUES (
        target_user_id,
        new_account_id,
        'manager'
    );

    RETURN new_account_id;
END;
$$;

-- ============================================
-- FUNCTION: Add team member
-- Manager adds a user to their account
-- ============================================
CREATE OR REPLACE FUNCTION add_team_member(
    member_email TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    manager_account_id UUID;
    member_user_id UUID;
    new_role_id UUID;
BEGIN
    -- Get manager's account
    SELECT account_id INTO manager_account_id
    FROM "User_Roles"
    WHERE user_id = auth.uid() AND role = 'manager'
    LIMIT 1;

    IF manager_account_id IS NULL THEN
        RAISE EXCEPTION 'Only managers can add team members';
    END IF;

    -- Get member user ID
    SELECT id INTO member_user_id
    FROM auth.users
    WHERE email = member_email;

    IF member_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', member_email;
    END IF;

    -- Check if already in account
    IF EXISTS (
        SELECT 1 FROM "User_Roles"
        WHERE user_id = member_user_id AND account_id = manager_account_id
    ) THEN
        RAISE EXCEPTION 'User is already a team member';
    END IF;

    -- Add as team member
    INSERT INTO "User_Roles" (
        user_id,
        account_id,
        role
    ) VALUES (
        member_user_id,
        manager_account_id,
        'user'
    )
    RETURNING id INTO new_role_id;

    RETURN new_role_id;
END;
$$;

-- ============================================
-- VIEW: Team Members (for managers)
-- ============================================
CREATE OR REPLACE VIEW "Team_Members" AS
SELECT
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    ur.role,
    ur.created_at as added_date,
    a.company_name
FROM "User_Roles" ur
JOIN auth.users u ON ur.user_id = u.id
JOIN "Accounts" a ON ur.account_id = a.id
WHERE ur.account_id IN (
    SELECT account_id FROM "User_Roles"
    WHERE user_id = auth.uid() AND role = 'manager'
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Account Management System Created!';
    RAISE NOTICE '   - Accounts table (white label settings)';
    RAISE NOTICE '   - User_Roles table (manager/user roles)';
    RAISE NOTICE '   - is_manager() function';
    RAISE NOTICE '   - get_user_account() function';
    RAISE NOTICE '   - create_account_for_user() function';
    RAISE NOTICE '   - add_team_member() function';
    RAISE NOTICE '   - Team_Members view';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 First user to signup = Manager automatically!';
    RAISE NOTICE '🎨 White label ready: logo, company name, colors';
END $$;
