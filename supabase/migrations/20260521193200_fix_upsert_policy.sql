-- Drop the restrictive UPDATE policy and allow all updates (like INSERT)
DROP POLICY IF EXISTS "System can update synced activities" ON "Synced_Activities";
CREATE POLICY "System can update synced activities"
    ON "Synced_Activities" FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Ensure INSERT policy is unrestricted for system
DROP POLICY IF EXISTS "System can insert synced activities" ON "Synced_Activities";
CREATE POLICY "System can insert synced activities"
    ON "Synced_Activities" FOR INSERT
    WITH CHECK (true);
