# Custom Domain Feature - Testing Guide

## Overview

This document provides comprehensive testing procedures for the custom domain feature, covering manual testing, automated testing, and integration testing.

## Prerequisites

Before testing:
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Frontend built and deployed
- [ ] Cloudflare Worker deployed
- [ ] Test organization created with enterprise tier
- [ ] Test domain available (or use test.local)

## Test Environment Setup

### 1. Local Development Setup

```bash
# Start Supabase locally
supabase start

# Run database migrations
supabase db push

# Start edge functions
supabase functions serve

# Start frontend dev server
npm run dev

# In another terminal, start worker locally
cd workers/custom-domain-router
wrangler dev
```

### 2. Test Organization Setup

```sql
-- Create test organization with enterprise tier
INSERT INTO organizations (id, name, slug, subscription_tier, primary_color, secondary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Gym',
  'test-gym',
  'enterprise',
  '#2563eb',
  '#f97316'
);

-- Create test user/profile
-- (Use Supabase auth to create user, then update profile)
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'owner'
WHERE email = 'test@example.com';
```

### 3. Test Domain Setup

For local testing, add to `/etc/hosts`:
```
127.0.0.1 test-portal.local
127.0.0.1 portal.testgym.com
```

## Test Cases

### 1. Database Schema Tests

#### Test 1.1: Custom Domain Fields Exist

```sql
-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN (
    'subscription_tier',
    'custom_domain',
    'custom_domain_verified',
    'domain_verification_token',
    'domain_ssl_enabled'
  );
```

**Expected Result:** All 5 columns should be listed.

#### Test 1.2: Subscription Tier Constraint

```sql
-- Should fail: invalid tier
UPDATE organizations
SET subscription_tier = 'invalid'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Should succeed: valid tier
UPDATE organizations
SET subscription_tier = 'enterprise'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected Result:** First query fails with constraint violation, second succeeds.

#### Test 1.3: Custom Domain Trigger

```sql
-- Try to set custom domain on studio tier
UPDATE organizations
SET subscription_tier = 'studio',
    custom_domain = 'portal.test.com'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected Result:** Error: "Custom domains are only available for enterprise tier organizations"

```sql
-- Set custom domain on enterprise tier
UPDATE organizations
SET subscription_tier = 'enterprise',
    custom_domain = 'portal.test.com'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify verification token was generated
SELECT domain_verification_token, custom_domain_verified
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected Result:**
- Update succeeds
- `domain_verification_token` is populated
- `custom_domain_verified` is false

### 2. Edge Function Tests

#### Test 2.1: Verify Custom Domain - Success

```bash
# Start Supabase functions
supabase functions serve

# Test verification (adjust URL and auth token)
curl -X POST http://localhost:54321/functions/v1/verify-custom-domain \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "domain": "portal.test.com"
  }'
```

**Expected Result:** Returns verification status and DNS record details.

#### Test 2.2: Get Organization by Domain

```bash
curl -X GET "http://localhost:54321/functions/v1/get-org-by-domain?domain=portal.test.com" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected Result:**
- Returns organization data if domain is verified
- Returns 404 if domain not found or not verified

#### Test 2.3: Unauthorized Access

```bash
# Try without auth token
curl -X POST http://localhost:54321/functions/v1/verify-custom-domain \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "domain": "portal.test.com"
  }'
```

**Expected Result:** 401 or 403 error.

### 3. Frontend UI Tests

#### Test 3.1: Custom Domain Tab Visibility

**Steps:**
1. Log in as organization owner
2. Navigate to Settings > Organization Settings
3. Check for "Custom Domain" tab

**Expected Result:** Tab is visible for enterprise tier, shows enterprise badge.

#### Test 3.2: Enterprise Tier Check

**Test 3.2a: Non-Enterprise User**

**Steps:**
1. Set organization to studio tier
2. Navigate to Custom Domain tab

**Expected Result:**
- Warning message about enterprise feature
- "Upgrade to Enterprise" button shown
- Domain input disabled

**Test 3.2b: Enterprise User**

**Steps:**
1. Set organization to enterprise tier
2. Navigate to Custom Domain tab

**Expected Result:**
- Domain input enabled
- "Save Domain" button enabled
- No warning message

#### Test 3.3: Save Custom Domain

**Steps:**
1. Enter custom domain: `portal.testgym.com`
2. Click "Save Domain"

**Expected Result:**
- Success toast notification
- DNS instructions appear
- Verification token displayed
- Domain input becomes disabled
- "Verify Domain" button appears

#### Test 3.4: DNS Instructions Display

**Steps:**
1. After saving domain, check DNS instructions

**Expected Result:**
- TXT record instructions with token
- CNAME record instructions
- Copy-to-clipboard buttons work
- All values are correct

#### Test 3.5: Domain Verification

**Steps:**
1. Configure DNS records (or mock verification)
2. Click "Verify Domain"

**Expected Result:**
- Loading spinner shows
- After verification:
  - Success: Green checkmark, success message
  - Failure: Error message, retry button

#### Test 3.6: Verified Domain Display

**Steps:**
1. View Custom Domain tab with verified domain

**Expected Result:**
- Green success box shown
- "Verified" badge displayed
- Link to custom domain works
- Domain input disabled

### 4. Middleware Tests

#### Test 4.1: Custom Domain Detection

**Steps:**
1. Access application via default domain
2. Check custom domain context

**Expected Result:**
- `isCustomDomain` is false
- `organization` is null

**Steps:**
1. Access via custom domain
2. Check custom domain context

**Expected Result:**
- `isCustomDomain` is true
- `organization` contains org data
- Branding applied (check CSS variables)

#### Test 4.2: Branding Application

**Steps:**
1. Access via custom domain
2. Inspect page elements

**Expected Result:**
- Document title shows organization name
- CSS variables set:
  - `--primary` matches organization color
  - `--secondary` matches organization color
- Logo displayed if configured

### 5. Cloudflare Worker Tests

#### Test 5.1: Worker Intercepts Custom Domain

**Steps:**
1. Deploy worker locally: `wrangler dev`
2. Access custom domain

**Expected Result:**
- Worker intercepts request
- Logs show domain lookup
- Response includes custom headers:
  - `X-Custom-Domain`
  - `X-Organization-ID`
  - `X-Organization-Slug`

#### Test 5.2: Default Domain Passthrough

**Steps:**
1. Access default domain (gym-unity.app)

**Expected Result:**
- Worker passes through without modification
- No custom headers added

#### Test 5.3: Unverified Domain Handling

**Steps:**
1. Access unverified custom domain

**Expected Result:**
- 404 response
- Error message: "Custom domain not found or not verified"

#### Test 5.4: CORS Handling

**Steps:**
1. Make OPTIONS preflight request

```bash
curl -X OPTIONS https://portal.testgym.com/api/test \
  -H "Origin: https://portal.testgym.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected Result:**
- Response includes CORS headers
- Status: 200
- Headers:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods`
  - `Access-Control-Allow-Headers`

#### Test 5.5: HTML Injection

**Steps:**
1. Access custom domain HTML page
2. View page source

**Expected Result:**
- Script tag with `window.__CUSTOM_DOMAIN_ORG__`
- Meta tags with organization info
- Style tag with CSS variables
- Title updated to organization name

### 6. CORS Tests

#### Test 6.1: API Request from Custom Domain

**Steps:**
1. From custom domain, make API request to Supabase

```javascript
const response = await fetch('https://your-project.supabase.co/rest/v1/organizations', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

**Expected Result:**
- Request succeeds
- No CORS errors
- Response headers include CORS headers

#### Test 6.2: WebSocket Connections

**Steps:**
1. From custom domain, establish realtime connection

**Expected Result:**
- Connection succeeds
- Data syncs properly
- No CORS issues

### 7. Security Tests

#### Test 7.1: SQL Injection Protection

**Steps:**
1. Try to inject SQL in domain input:
   - `portal.test.com'; DROP TABLE organizations; --`
   - `portal.test.com<script>alert('xss')</script>`

**Expected Result:**
- Input sanitized
- No SQL injection
- No XSS

#### Test 7.2: Domain Hijacking Prevention

**Steps:**
1. Try to claim another org's domain

```sql
-- As user from org A, try to set org B's verified domain
UPDATE organizations
SET custom_domain = 'portal.orgb.com'
WHERE id = 'org-a-id';
```

**Expected Result:**
- Unique constraint violation
- Domain cannot be claimed

#### Test 7.3: Unauthorized Verification

**Steps:**
1. Try to verify domain without owner role

**Expected Result:**
- 403 Forbidden
- Error: "Only owners and managers can verify custom domains"

### 8. Performance Tests

#### Test 8.1: Domain Lookup Performance

**Steps:**
1. Measure time for domain lookup

```bash
time curl "https://your-project.supabase.co/functions/v1/get-org-by-domain?domain=portal.test.com"
```

**Expected Result:** < 100ms response time

#### Test 8.2: Worker Overhead

**Steps:**
1. Measure response time with and without worker

**Expected Result:**
- Overhead < 50ms
- Total response time < 500ms

#### Test 8.3: Load Testing

**Steps:**
1. Use load testing tool (e.g., k6, artillery)

```javascript
import http from 'k6/http';

export default function() {
  http.get('https://portal.testgym.com');
}
```

**Expected Result:**
- 99th percentile < 1s
- No errors under load
- Worker handles 1000+ RPS

### 9. Integration Tests

#### Test 9.1: End-to-End User Flow

**Steps:**
1. Sign up new organization
2. Upgrade to enterprise
3. Configure custom domain
4. Add DNS records
5. Verify domain
6. Access custom domain
7. Member logs in
8. Member books class
9. Member checks in

**Expected Result:**
- All steps complete successfully
- No errors or broken functionality
- Consistent branding throughout

#### Test 9.2: Multi-Organization Test

**Steps:**
1. Create 3 test organizations with custom domains
2. Access each custom domain
3. Verify correct org data for each

**Expected Result:**
- Each domain shows correct organization
- No data leakage between orgs
- Branding unique per org

### 10. Browser Compatibility Tests

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

**Test for:**
- [ ] Page loads correctly
- [ ] Branding applies
- [ ] No console errors
- [ ] SSL certificate valid
- [ ] All features work

## Automated Testing

### Unit Tests

```typescript
// Test custom domain hook
describe('useCustomDomain', () => {
  it('detects custom domain', () => {
    // Mock window.location.hostname
    // Test isCustomDomain returns true
  });

  it('fetches organization data', async () => {
    // Mock API response
    // Test organization data loaded
  });

  it('applies branding', () => {
    // Test CSS variables set
  });
});
```

### Integration Tests

```typescript
// Test full flow
describe('Custom Domain Feature', () => {
  it('allows enterprise org to set custom domain', async () => {
    // Test UI flow
  });

  it('verifies domain with correct DNS', async () => {
    // Mock DNS verification
  });

  it('routes traffic correctly', async () => {
    // Test routing
  });
});
```

## Testing Checklist

### Database
- [ ] Migration applied successfully
- [ ] All fields created
- [ ] Constraints work correctly
- [ ] Triggers function properly
- [ ] RLS policies enforced

### Edge Functions
- [ ] verify-custom-domain deployed
- [ ] get-org-by-domain deployed
- [ ] Functions return correct data
- [ ] Error handling works
- [ ] Authentication required

### Frontend
- [ ] UI renders correctly
- [ ] Enterprise check works
- [ ] Domain save succeeds
- [ ] Verification works
- [ ] DNS instructions clear
- [ ] Copy buttons work
- [ ] Error messages helpful

### Middleware
- [ ] Custom domain detected
- [ ] Organization data loaded
- [ ] Branding applied
- [ ] Default domains ignored

### Cloudflare Worker
- [ ] Worker deployed
- [ ] Routes configured
- [ ] Secrets set
- [ ] Custom domains intercepted
- [ ] Default domains passed through
- [ ] CORS works
- [ ] HTML injection works

### Security
- [ ] Enterprise tier enforced
- [ ] Domain uniqueness enforced
- [ ] Verification required
- [ ] Authorization checked
- [ ] No SQL injection
- [ ] No XSS vulnerabilities

### Performance
- [ ] Fast domain lookup
- [ ] Minimal worker overhead
- [ ] Handles high load
- [ ] Caching works

### Documentation
- [ ] DNS setup guide complete
- [ ] CORS documentation complete
- [ ] Worker README complete
- [ ] Feature documentation complete
- [ ] Testing guide complete

## Bug Reporting

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/videos
5. Browser/environment details
6. Console errors
7. Network requests (from DevTools)

## Conclusion

All tests should pass before deploying to production. Document any failures and fix before release.

---

**Testing Status:** ✅ Ready for Testing
**Last Updated:** 2025-11-11
**Tester:** [Your Name]
