# Supabase Migration Audit Report

**Date:** 2025-12-20
**Purpose:** Comprehensive audit to verify self-hosted Supabase migration and identify hardcoded/mock data
**Status:** In Progress

---

## Executive Summary

This audit identifies all areas requiring attention to ensure the application is fully functional with the self-hosted Supabase setup and displays real data from the database rather than hardcoded/mock data.

### Quick Stats
- **Critical Issues:** 3
- **High Priority Issues:** 8
- **Medium Priority Issues:** 12
- **Low Priority Issues:** 5

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

### 2.1 Critical: Service Worker Hardcoded URLs

**File:** `public/sw.js` (Lines 246-249)

```javascript
const supabaseUrl = self.location.origin.includes('localhost')
  ? 'YOUR_SUPABASE_URL'
  : 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

**Issue:** Background sync for check-ins has placeholder URLs that won't work.
**Priority:** HIGH
**Fix Required:** Inject actual Supabase URL/key at build time or fetch from app config.

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

### 3.1 Critical: Components Using Old `supabase.functions.invoke`

Some components still use `supabase.functions.invoke` directly instead of the new `invokeEdgeFunction` helper. This may not route correctly to the self-hosted functions subdomain.

**Files needing update:**

| File | Line | Function Called |
|------|------|-----------------|
| `src/components/members/MembershipInfo.tsx` | 91 | `customer-portal` |
| `src/pages/MembershipSuccessPage.tsx` | 28 | `check-subscription` |
| `src/pages/MembershipPlansPage.tsx` | 52 | `check-subscription` |
| `src/pages/PaymentSuccessPage.tsx` | 29 | `verify-payment` |
| `src/components/crm/conversion/PaymentStep.tsx` | 183 | `create-checkout` |
| `src/components/membership/SubscriptionManager.tsx` | 28, 53 | `check-subscription`, `customer-portal` |

**Priority:** CRITICAL
**Fix Required:** Replace `supabase.functions.invoke` with `invokeEdgeFunction` from client.

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

### 4.1 Critical: Analytics Dashboard Uses Mock Data

**File:** `src/components/analytics/AdvancedAnalyticsDashboard.tsx` (Lines 59-111)

```typescript
const mockAnalyticsData: AnalyticsData = {
  revenue: { current: 45780, previous: 42350, ... },
  members: { total: 1247, active: 1089, ... },
  classes: { attendance: 847, ... },
  ...
};
```

**Issue:** Dashboard displays hardcoded mock data instead of real analytics.
**Priority:** CRITICAL
**Fix Required:** Replace with Supabase queries for real data.

---

### 4.2 Critical: Notifications Hook Returns Mock Data

**File:** `src/hooks/useNotifications.ts` (Lines 49-116)

```typescript
// TODO: Replace with actual Supabase query once table is created
const mockNotifications: Notification[] = [
  { id: '1', type: 'payment_failed', title: 'Payment Failed', message: "John Doe's payment..." },
  ...
];
```

**Issue:** Notification system is completely stubbed with fake data.
**Priority:** CRITICAL
**Fix Required:**
1. Create `notifications` table in Supabase (if not exists)
2. Implement real Supabase query

---

### 4.3 High: Support Tickets Shows Hardcoded Data

**File:** `src/components/communication/PlaceholderComponents.tsx` (Lines 429-475)

```typescript
<TableCell>John Doe</TableCell>
<TableCell>Equipment Issue</TableCell>
...
<TableCell>Jane Smith</TableCell>
<TableCell>Class Booking Issue</TableCell>
```

**Issue:** Support tickets display is completely static HTML with fake data.
**Priority:** HIGH
**Fix Required:** Implement actual ticket fetching from `support_tickets` table.

---

### 4.4 High: Milestone Tracking Shows Fake Members

**File:** `src/components/communication/PlaceholderComponents.tsx` (Lines 514-576)

Hardcoded milestone data:
- "Sarah Johnson reached 50 gym visits!"
- "Mike Wilson completed his first fitness class"
- "Amy Davis referred her first new member"

**Priority:** HIGH
**Fix Required:** Query real milestone achievements from database.

---

### 4.5 High: Access Control Manager Uses Mock Users

**File:** `src/components/security/AccessControlManager.tsx` (Lines 55-89)

```typescript
const MOCK_USERS = [
  { name: 'John Smith', email: 'john@gymclub.com', role: 'Admin' },
  { name: 'Sarah Johnson', email: 'sarah@gymclub.com', role: 'Staff' },
  { name: 'Mike Wilson', email: 'mike@gymclub.com', role: 'Trainer' },
];
```

**Priority:** HIGH
**Fix Required:** Query actual users from `profiles` table.

---

### 4.6 High: Audit Trail Manager Uses Mock Logs

**File:** `src/components/audit/AuditTrailManager.tsx` (Lines 56-121)

Contains `MOCK_AUDIT_LOGS` array with fake audit entries.

**Priority:** HIGH
**Fix Required:** Query real audit logs from `audit_logs` table.

---

### 4.7 High: System Health Monitor Uses Mock Metrics

**File:** `src/components/audit/SystemHealthMonitor.tsx` (Lines 56-150)

Contains `MOCK_METRICS` and `MOCK_SERVICES` arrays with static health data.

**Priority:** HIGH
**Fix Required:** Integrate with actual health check edge function.

---

### 4.8 High: Invoice Generator Uses Hardcoded Invoices

**File:** `src/components/billing/InvoiceGenerator.tsx` (Lines 78-108)

Contains hardcoded invoice data with "john.doe@example.com" and "jane.smith@example.com".

**Priority:** HIGH
**Fix Required:** Query real invoices from database.

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

## 5. Action Items Checklist

### Critical (Must Fix Before Production)

- [ ] **SW-001:** Fix service worker Supabase URL placeholders (`public/sw.js`)
- [ ] **EF-001:** Update 7 components to use `invokeEdgeFunction` instead of `supabase.functions.invoke`
- [ ] **DATA-001:** Replace mock data in `AdvancedAnalyticsDashboard.tsx` with real queries
- [ ] **DATA-002:** Implement real notifications system in `useNotifications.ts`

### High Priority

- [ ] **DATA-003:** Implement real support tickets in `PlaceholderComponents.tsx`
- [ ] **DATA-004:** Implement real milestone tracking in `PlaceholderComponents.tsx`
- [ ] **DATA-005:** Replace mock users in `AccessControlManager.tsx`
- [ ] **DATA-006:** Replace mock audit logs in `AuditTrailManager.tsx`
- [ ] **DATA-007:** Replace mock metrics in `SystemHealthMonitor.tsx`
- [ ] **DATA-008:** Replace mock invoices in `InvoiceGenerator.tsx`
- [ ] **DATA-009:** Replace mock data in `src/components/advanced/AdvancedAnalyticsDashboard.tsx` (duplicate component)

### Medium Priority

- [ ] **SEC-001:** Remove `*.supabase.co` from CSP/CORS after migration stable
- [ ] **CONFIG-001:** Move footer contact info to organization settings
- [ ] **DATA-010:** Review staff schedule mock data in `ScheduleManager.tsx`
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
