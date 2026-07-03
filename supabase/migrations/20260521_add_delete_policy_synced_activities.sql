-- Allow admins and managers to delete synced activities from their account
DROP POLICY IF EXISTS "Admins can delete synced activities" ON "Synced_Activities";
CREATE POLICY "Admins can delete synced activities"
    ON "Synced_Activities" FOR DELETE
    USING (
        account_id IN (
            SELECT u.account_id 
            FROM "Users" u
            WHERE u.auth_id = auth.uid()
            AND u.role IN ('admin', 'manager')
        )
    );

-- Allow system to update synced activities (for upserts)
DROP POLICY IF EXISTS "System can update synced activities" ON "Synced_Activities";
CREATE POLICY "System can update synced activities"
    ON "Synced_Activities" FOR UPDATE
    USING (true)
    WITH CHECK (true);
