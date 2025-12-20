# Supabase Migration Audit Report

**Date:** 2025-12-20
**Purpose:** Comprehensive audit to verify self-hosted Supabase migration and identify hardcoded/mock data
**Status:** COMPLETE - All Critical & High Priority Items Fixed

---

## Executive Summary

This audit identifies all areas requiring attention to ensure the application is fully functional with the self-hosted Supabase setup and displays real data from the database rather than hardcoded/mock data.

### Quick Stats
- **Critical Issues:** ~~3~~ 0 remaining (4 fixed)
- **High Priority Issues:** ~~8~~ 0 remaining (6 fixed)
- **Medium Priority Issues:** 4
- **Low Priority Issues:** 2

---

## 1. Supabase Connection Configuration

### Status: Properly Configured

The main Supabase client (`src/integrations/supabase/client.ts`) is correctly configured for self-hosted Supabase:

- Uses environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_FUNCTIONS_URL`
- Includes `invokeEdgeFunction` helper for routing to separate functions subdomain
- Has `isSelfHosted` flag for conditional logic
- Supports both self-hosted and cloud Supabase configurations

**No changes needed for the client configuration.**

---

## 2. Legacy Cloud Supabase References

### 2.1 ~~Critical:~~ FIXED: Service Worker Hardcoded URLs

**File:** `public/sw.js`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Service worker now reads Supabase config from IndexedDB
- Main app stores config via `src/lib/pwa/swConfig.ts` on initialization
- Config is stored when app mounts and refreshed on visibility change

---

### 2.2 Medium: Security Headers & CORS Still Include Cloud Supabase

**Files:**
- `src/lib/security/security-headers.ts` (Lines 129-130)
- `src/lib/security/cors-config.ts` (Line 33)
- `public/_headers` (Line 10)

**Current State:**
```
'https://*.supabase.co',
'wss://*.supabase.co',
```

**Issue:** These are kept for "migration compatibility" but should be reviewed after migration is complete.
**Priority:** MEDIUM (not blocking, but cleanup needed)
**Recommendation:** Remove after confirming self-hosted setup is stable.

---

### 2.3 Low: Old Pooler URL in Temp File

**File:** `supabase/.temp/pooler-url`

```
postgresql://postgres.nerqstezuygviutluslt:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Issue:** Contains old cloud Supabase reference.
**Priority:** LOW (temp file, not used in production)
**Recommendation:** Delete this file or update for self-hosted.

---

### 2.4 Low: Documentation References

**Files with cloud Supabase URLs in documentation (acceptable to keep for reference):**
- `LIVING_TECHNICAL_SPECIFICATION.md`
- `SELF_HOSTED_SUPABASE_MIGRATION.md`
- Various docs in `docs/` folder

**Priority:** LOW (documentation only)

---

## 3. Edge Function Invocation Issues

### 3.1 ~~Critical:~~ FIXED: Components Using Old `supabase.functions.invoke`

**Status:** FIXED (2025-12-20)

All 6 components have been updated to use `invokeEdgeFunction`:

| File | Status |
|------|--------|
| `src/components/members/MembershipInfo.tsx` | FIXED |
| `src/pages/MembershipSuccessPage.tsx` | FIXED |
| `src/pages/MembershipPlansPage.tsx` | FIXED |
| `src/pages/PaymentSuccessPage.tsx` | FIXED |
| `src/components/crm/conversion/PaymentStep.tsx` | FIXED |
| `src/components/membership/SubscriptionManager.tsx` | FIXED |

---

### 3.2 Components Already Using Correct Helper (12 files)

These are correctly implemented:
- `src/pages/OrganizationSettingsPage.tsx`
- `src/lib/monitoring/health.ts`
- `src/lib/ai/aiService.ts`
- `src/hooks/useSubscription.ts`
- `src/hooks/useCustomDomain.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/tickets/EmailMessageDetail.tsx`
- `src/components/membership/SubscriptionStatus.tsx`
- `src/components/membership/OneTimePaymentButton.tsx`
- `src/components/membership/SubscriptionButton.tsx`
- `src/components/checkin/MemberCheckInPass.tsx`

---

## 4. Hardcoded/Mock Data Issues

### 4.1 ~~Critical:~~ FIXED: Analytics Dashboard Uses Mock Data

**File:** `src/components/analytics/AdvancedAnalyticsDashboard.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Created new hook `src/hooks/useAnalyticsData.ts`
- Fetches real data from: members, payment_transactions, classes, class_bookings, equipment tables
- Calculates real metrics: revenue, member counts, class attendance, equipment utilization
- Displays loading skeleton while data loads
- Uses TanStack Query for caching and refetching

---

### 4.2 ~~Critical:~~ FIXED: Notifications Hook Returns Mock Data

**File:** `src/hooks/useNotifications.ts`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Hook now queries real `notifications` table from Supabase
- Implemented real mutations for markAsRead, markAllAsRead, deleteNotification
- `is_read` derived from `read_at` timestamp field
- Proper organization filtering applied

---

### 4.3 ~~High:~~ FIXED: Support Tickets Shows Hardcoded Data

**File:** `src/components/communication/PlaceholderComponents.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Component now fetches real tickets from `support_tickets` table
- Joins with `profiles` table for member names
- Implemented filtering by status and search
- Dynamic priority and status badges

---

### 4.4 ~~High:~~ FIXED: Milestone Tracking Shows Fake Members

**File:** `src/components/communication/PlaceholderComponents.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Component now fetches real milestones from `member_milestones` table
- Joins with `profiles` table for member names
- Implemented filtering by milestone type and search
- Send recognition functionality updates database
- Dynamic milestone type colors

---

### 4.5 ~~High:~~ FIXED: Access Control Manager Uses Mock Users

**File:** `src/components/security/AccessControlManager.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Queries real users from `profiles` table
- Uses TanStack Query for data fetching
- Implements role update mutations to update user roles in database
- Shows loading skeleton while data loads
- Calculates role counts dynamically from real data

---

### 4.6 ~~High:~~ FIXED: Audit Trail Manager Uses Mock Logs

**File:** `src/components/audit/AuditTrailManager.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Queries real activity logs from multiple tables: `integration_logs`, `webhook_logs`, `lead_activities`
- Transforms logs into unified audit format
- Supports date range filtering
- Shows loading skeleton while data loads
- Note: A dedicated `audit_logs` table could be added for more comprehensive auditing

---

### 4.7 ~~High:~~ FIXED: System Health Monitor Uses Mock Metrics

**File:** `src/components/audit/SystemHealthMonitor.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Performs real health checks against Supabase services (database, auth, storage, realtime, edge functions)
- Measures actual response times for each service
- Auto-refreshes every 60 seconds
- Calculates metrics from real service responses
- Response time trends tracked over session
- Note about server-side metrics (CPU/memory/disk) not being available from client

---

### 4.8 ~~High:~~ FIXED: Invoice Generator Uses Hardcoded Invoices

**File:** `src/components/billing/InvoiceGenerator.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Queries real payment transactions from `payment_transactions` table
- Joins with `profiles` and `memberships` tables for member info
- Creates new payment transactions when "invoices" are created
- Updates payment status via database mutations
- Added info note about dedicated invoicing module availability

---

### 4.9 Medium: Footer Has Placeholder Phone Number

**File:** `src/components/layout/Footer.tsx` (Lines 30-42)

```typescript
phone: '+1 (555) 012-3456',
```

**Priority:** MEDIUM
**Recommendation:** Move contact info to organization settings or environment config.

---

### 4.10 Low: Role Testing Panel (Intentional Test Data)

**File:** `src/components/auth/RoleTestingPanel.tsx` (Lines 30-36)

Test accounts for development. This is **acceptable** for development/testing purposes.

---

### 4.11 Low: CSV Template Examples (Educational)

**File:** `src/components/corporate/BulkMemberOperations.tsx`

Example CSV data like "john@example.com, Jane Doe" in templates. This is **acceptable** as user guidance.

---

### 4.12 ~~High:~~ FIXED: Duplicate Advanced Analytics Dashboard

**File:** `src/components/advanced/AdvancedAnalyticsDashboard.tsx`

**Status:** FIXED (2025-12-20)

**Solution Applied:**
- Component now fetches real data from multiple Supabase tables: `members`, `check_ins`, `payment_transactions`, `equipment`, `classes`, `class_bookings`
- AI insights are dynamically generated based on actual member activity, revenue, and equipment status
- Predictive metrics calculate real retention rates, utilization, and equipment uptime
- Automation rules displayed as configurable templates (pending activation)
- Added loading skeleton and refresh functionality
- Uses TanStack Query for data fetching and caching

---

### 4.13 Note: Staff Schedule Manager

**File:** `src/components/staff/ScheduleManager.tsx`

**Status:** Already properly implemented

The ScheduleManager correctly fetches real data:
- Staff members from `profiles` table
- Locations from `locations` table
- Schedules table doesn't exist yet (intentional - awaiting database migration)
- Shows appropriate messaging about table creation needed

---

### 4.14 Note: Early Access Form

**File:** `src/components/auth/EarlyAccessForm.tsx`

**Status:** Already using real data

- Inserts to `early_access_requests` table via Supabase
- Proper validation with Zod schema
- No mock data present

---

### 4.15 Note: Tablet Signup Form

**File:** `src/components/members/TabletSignupForm.tsx`

**Status:** Already using real data

- Creates leads in `leads` table
- Fetches locations from `locations` table
- No mock data present

---

## 5. Action Items Checklist

### Critical (Must Fix Before Production) - ALL COMPLETE

- [x] **SW-001:** Fix service worker Supabase URL placeholders (`public/sw.js`)
- [x] **EF-001:** Update 7 components to use `invokeEdgeFunction` instead of `supabase.functions.invoke`
- [x] **DATA-001:** Replace mock data in `AdvancedAnalyticsDashboard.tsx` with real queries
- [x] **DATA-002:** Implement real notifications system in `useNotifications.ts`

### High Priority - ALL COMPLETE

- [x] **DATA-003:** Implement real support tickets in `PlaceholderComponents.tsx`
- [x] **DATA-004:** Implement real milestone tracking in `PlaceholderComponents.tsx`
- [x] **DATA-005:** Replace mock users in `AccessControlManager.tsx`
- [x] **DATA-006:** Replace mock audit logs in `AuditTrailManager.tsx`
- [x] **DATA-007:** Replace mock metrics in `SystemHealthMonitor.tsx`
- [x] **DATA-008:** Replace mock invoices in `InvoiceGenerator.tsx`
- [x] **DATA-009:** Replace mock data in `src/components/advanced/AdvancedAnalyticsDashboard.tsx`

### Medium Priority

- [ ] **SEC-001:** Remove `*.supabase.co` from CSP/CORS after migration stable
- [ ] **CONFIG-001:** Move footer contact info to organization settings
- [x] **DATA-010:** Review staff schedule mock data in `ScheduleManager.tsx` - Already uses real data, schedules table needed
- [ ] **DATA-011:** Review push notification manager mock data

### Low Priority

- [ ] **CLEANUP-001:** Delete `supabase/.temp/pooler-url` or update
- [ ] **DOCS-001:** Update documentation with self-hosted URLs where appropriate

---

## 6. Database Tables Required

Verify these tables exist and have proper RLS policies:

| Table | Purpose | Status |
|-------|---------|--------|
| `notifications` | System notifications | Verify exists |
| `support_tickets` | Support ticket system | Verify exists |
| `audit_logs` | Audit trail | Verify exists |
| `member_milestones` | Achievement tracking | Verify exists |
| `system_health_metrics` | Health monitoring | May need to create |

---

## 7. Edge Functions Status

All edge functions properly use `Deno.env.get("SUPABASE_URL")` for self-hosted compatibility:

| Function | Status | Notes |
|----------|--------|-------|
| `ai-generate` | OK | Uses env vars |
| `check-subscription` | OK | Uses env vars |
| `create-checkout` | OK | Uses env vars |
| `create-one-time-payment` | OK | Uses env vars |
| `customer-portal` | OK | Uses env vars |
| `generate-sitemap` | OK | Uses env vars |
| `generate-wallet-pass` | OK | Uses env vars |
| `get-org-by-domain` | OK | Uses env vars |
| `health` | OK | Simple health probe |
| `health-check` | OK | Full health with dependency checks |
| `rate-limit` | OK | Uses env vars |
| `receive-email` | OK | Uses env vars |
| `send-email-response` | OK | Uses env vars |
| `setup-new-user` | OK | Uses env vars |
| `verify-custom-domain` | OK | Uses env vars |
| `verify-payment` | OK | Uses env vars |

---

## 8. Testing Recommendations

After fixes are implemented, verify:

1. **Connection Test:** Confirm all API calls go to `api.repclub.net`
2. **Functions Test:** Confirm edge functions route to `functions.repclub.net`
3. **Data Test:** Verify all dashboards show real data
4. **Auth Test:** Confirm authentication works end-to-end
5. **Real-time Test:** Verify Supabase real-time subscriptions work

---

## 9. Next Steps

1. Review this document with the team
2. Prioritize critical items first
3. Create individual tasks/tickets for each item
4. Test thoroughly after each fix
5. Update this document as items are completed

---

**Document Maintained By:** Claude Code Assistant
**Last Updated:** 2025-12-20
