# Fathom OAuth Integration Blocker — 2026-05-20

## Current Status

**BLOCKED:** Cannot complete Fathom OAuth integration because the Fathom developer portal does not provide a visible way to manage registered OAuth applications.

## What Happened

1. Registered OAuth app "One Click Coaching" in Fathom developer portal
2. Received Client ID Production and Client Secret Production
3. Added credentials to Vercel and Supabase production environments
4. Attempted to test OAuth flow
5. Received `invalid_redirect_uri` error from Fathom
6. Cannot locate the OAuth app in the developer portal to verify/update redirect URIs
7. No confirmation email received with management link

**Support ticket sent:** 2026-05-20 to Fathom support asking how to access OAuth app management page
**2026-05-25 update:** Cannot log into the free Fathom account where OAuth was registered (aiadvantagesolutions.ca). Request sent to Fathom support to transfer account to johncunningham@oneclickcoaching.com. Awaiting response.

## Registered OAuth App Details

**App Name:** One Click Coaching

**Description:** Sales coaching automation that syncs Fathom recordings for AI-powered methodology reinforcement.

**Redirect URIs registered:**
- Production: `https://oneclickcoaching-xeso.vercel.app/api/integrations/fathom/oauth/callback`
- Development: `https://oneclickcoaching-xeso.vercel.app/api/integrations/fathom/oauth/callback`

**Credentials stored in:**
- Vercel production env: `FATHOM_CLIENT_ID`, `FATHOM_CLIENT_SECRET`
- Supabase Edge Function secrets: `FATHOM_CLIENT_ID`, `FATHOM_CLIENT_SECRET`

## When Fathom Support Replies

### Option A: They provide the app management URL

1. Navigate to the URL they provide
2. Verify the registered redirect URIs
3. If correct, test the OAuth flow immediately
4. If incorrect, update to match what's documented above
5. Test OAuth flow: https://oneclickcoaching-xeso.vercel.app/integrations/fathom
6. Document the management URL for future reference

### Option B: They can't find the app / it wasn't saved

1. Register a new OAuth app using the exact details above
2. Copy new Client ID Production and Client Secret Production
3. Update Vercel env vars:
   ```bash
   cd /Users/johncunningham/oneclickcoaching
   echo "y" | vercel env rm FATHOM_CLIENT_ID production
   pbpaste | vercel env add FATHOM_CLIENT_ID production
   
   echo "y" | vercel env rm FATHOM_CLIENT_SECRET production
   pbpaste | vercel env add FATHOM_CLIENT_SECRET production
   ```

4. Update Supabase secrets:
   ```bash
   SECRET=$(pbpaste)
   supabase secrets set --env-file /dev/stdin <<< "FATHOM_CLIENT_ID=$SECRET"
   
   # (copy secret to clipboard)
   SECRET=$(pbpaste)
   supabase secrets set --env-file /dev/stdin <<< "FATHOM_CLIENT_SECRET=$SECRET"
   ```

5. Redeploy:
   ```bash
   vercel --prod --yes
   ```

6. Test OAuth flow: https://oneclickcoaching-xeso.vercel.app/integrations/fathom

### Option C: They say redirect URI format is wrong

If Fathom says the redirect URI format doesn't match their requirements:

1. Ask them for the exact required format
2. Update redirect URI in the OAuth app settings
3. Update `NEXT_PUBLIC_APP_URL` if needed to match
4. Redeploy and test

## Testing the OAuth Flow (After Resolution)

1. Open: https://oneclickcoaching-xeso.vercel.app/login
2. Log in with your manager account
3. Navigate to: https://oneclickcoaching-xeso.vercel.app/integrations/fathom
4. Click "Connect to Fathom"
5. Should redirect to Fathom authorization page
6. Sign in with Google SSO (Individual plan requirement)
7. Authorize One Click Coaching
8. Should redirect back to OCC with "Connected" status
9. Click "Sync Now"
10. Check dashboard for Synced_Conversations rows

## Error Messages to Watch For

- `invalid_redirect_uri` → Redirect URI mismatch, needs updating in Fathom OAuth app
- `invalid_client` → Client ID/Secret mismatch, check credentials
- `access_denied` → User canceled authorization, try again
- `Fathom error, check status page` → Generic app error, check browser console and server logs

## Code References

- OAuth start route: `web/app/api/integrations/[provider]/oauth/start/route.ts`
- OAuth callback route: `web/app/api/integrations/[provider]/oauth/callback/route.ts`
- Redirect URI builder: `web/lib/integrations/oauth.ts` → `getOAuthRedirectUri()`
- Fathom sync function: `supabase/functions/fathom-sync/index.ts`

## Next Steps After Fathom Works

1. Test HubSpot OAuth + sync
2. Run full manual smoke test suite (see JOHN-DASHBOARD.md)
3. Update DNS to point app.oneclickcoaching.com correctly
4. Update NEXT_PUBLIC_APP_URL back to app.oneclickcoaching.com
5. Update Fathom OAuth redirect URIs to use app.oneclickcoaching.com
6. Final production smoke tests with custom domain

---

**Created:** 2026-05-20  
**Status:** Awaiting Fathom support response  
**Contact:** john@aiadvantagesolutions.ca logged into Fathom
