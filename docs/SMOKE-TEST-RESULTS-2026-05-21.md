# Smoke Test Results — 2026-05-21

## Summary

**11/16 bugs fixed in 2.5-hour session**

### Smoke Tests Completed
| Test | Status |
|------|--------|
| Login | ✅ PASS |
| Invite flow | ✅ PASS (after Supabase key fix) |
| HubSpot OAuth | ✅ PASS |
| HubSpot Sync + Owner Mapping | ✅ PASS |
| Coaching reply | ✅ PASS |
| Rep isolation | ✅ PASS |
| Notes CRUD | ⚠️ PARTIAL (conversation refresh fixed) |
| Fathom OAuth | ❌ BLOCKED (waiting on support) |
| Billing | NOT TESTED |
| Team/call pages | NOT TESTED |

### Bugs Fixed (11)
1. ✅ Supabase client API keys (cache-cleared redeploy)
2. ✅ Invite emails not sending (fixed by #1)
3. ✅ Confetti/onboarding after accept (fixed by #1)
4. ✅ HubSpot OAuth redirect mismatch (`NEXT_PUBLIC_APP_URL` updated)
5. ✅ Success toasts too subtle (now green, 5sec, larger)
6. ✅ Notes notification not clickable (now links to /notes)
7. ✅ Notes conversation doesn't clear when switching reps (URL-based refresh)
8. ✅ Double-click required to select rep (now single-click)
9. ✅ Rep sees manager onboarding (hidden with role check)
10. ✅ Team member name not editable (added Edit button + API support)
11. ✅ Website "Book Demo" → "Login" button (deployed to oneclickcoaching.com)

### Bugs Remaining (5)
1. **Billing: missing cancel + add reps buttons** (medium, 20-30 min)
2. **Billing: no trial expiration notification** (medium, 15 min)
3. **Wrong coaching reply notification content** (needs investigation)
4. **Notes: newly accepted rep doesn't appear in selector** (timing/cache issue, 10-15 min)
5. **Password reset links to localhost** (Supabase site URL config — manual fix in dashboard)

### Blocked
- **Fathom OAuth:** App registered but no management UI visible in Fathom developer portal. Support ticket sent 2026-05-20.

## Deployment Status
**Production:** https://app.oneclickcoaching.com  
**Commits:** f16eb2d, 144920c, d9d51a5, c8bfdb2  
**Last deploy:** 2026-05-21 ~08:45 AM

## Next Session Priorities
1. Fix Supabase site URL (password reset localhost issue)
2. Add billing cancel/add buttons
3. Add trial expiration email/notification
4. Debug notes rep selector timing
5. Investigate coaching reply notification content mismatch
6. Resume Fathom OAuth when support responds
