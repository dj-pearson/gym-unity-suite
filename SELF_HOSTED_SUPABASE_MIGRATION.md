# Self-Hosted Supabase Migration Guide

**Last Updated:** 2025-12-18
**Status:** Audit Complete - Action Items Identified

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues Found](#critical-issues-found)
3. [Files Requiring Updates](#files-requiring-updates)
4. [Edge Functions Audit](#edge-functions-audit)
5. [Environment Variables Master List](#environment-variables-master-list)
6. [Routing Architecture](#routing-architecture)
7. [Security Configuration Updates](#security-configuration-updates)
8. [Action Items Checklist](#action-items-checklist)

---

## Executive Summary

This document provides a comprehensive audit of the Gym Unity Suite codebase for migration from cloud-hosted Supabase (`*.supabase.co`) to self-hosted Supabase with custom domains.

### Self-Hosted Routing Architecture

| Service | Domain Pattern | Example |
|---------|----------------|---------|
| **API (Kong)** | `api.[domain]` | `https://api.repclub.net` |
| **Edge Functions** | `functions.[domain]` | `https://functions.repclub.net` |
| **Realtime** | `realtime.[domain]` or via API | `wss://api.repclub.net/realtime/v1` |
| **Storage** | `api.[domain]/storage/v1` | `https://api.repclub.net/storage/v1` |
| **Auth** | `api.[domain]/auth/v1` | `https://api.repclub.net/auth/v1` |

---

## Critical Issues Found

### 1. Hardcoded Supabase.co URL in EmailTicketManager

**File:** `src/components/tickets/EmailTicketManager.tsx:54-55`
**Severity:** CRITICAL
**Issue:** Hardcoded project reference and supabase.co domain

```typescript
// CURRENT (BROKEN for self-hosted)
const projectRef = 'nerqstezuygviutluslt';
const url = `https://${projectRef}.supabase.co/functions/v1/receive-email`;
```

**Fix Required:**
```typescript
import { edgeFunctions } from '@/integrations/supabase/client';

const generateWebhookUrl = () => {
  const url = edgeFunctions.getUrl('receive-email');
  setWebhookUrl(url);
};
```

---

### 2. Fallback Hardcoded URLs in Supabase Client

**File:** `src/integrations/supabase/client.ts:18-19`
**Severity:** HIGH
**Issue:** Contains fallback to old cloud Supabase URL and exposed anon key

```typescript
// CURRENT - Contains fallback to old URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://nerqstezuygviutluslt.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGci...";
```

**Recommendation:** Remove fallbacks or update to self-hosted defaults:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://api.repclub.net";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";  // Force explicit config
```

---

### 3. Service Worker Placeholder URLs

**File:** `public/sw.js:247-249`
**Severity:** MEDIUM
**Issue:** Placeholder values that need configuration

```javascript
// CURRENT - Placeholders
const supabaseUrl = self.location.origin.includes('localhost')
  ? 'YOUR_SUPABASE_URL'
  : 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

**Fix Required:** These need to be replaced during build or use a configuration approach.

---

## Files Requiring Updates

### Files with `supabase.co` References

| File | Line(s) | Type | Action Required |
|------|---------|------|-----------------|
| `src/components/tickets/EmailTicketManager.tsx` | 54-55 | Hardcoded URL | **FIX REQUIRED** |
| `src/integrations/supabase/client.ts` | 18-19 | Fallback URL | Update fallback |
| `src/lib/security/security-headers.ts` | 124-125 | CSP connect-src | Add self-hosted domains |
| `src/lib/security/cors-config.ts` | 30 | CORS origins | Add self-hosted domains |
| `public/_headers` | 10 | CSP connect-src | Add self-hosted domains |
| `public/sw.js` | 247-249 | Placeholder URLs | Configure properly |

### Documentation Files (Reference Only - No Action)

These files contain `supabase.co` references in examples/documentation:
- `BLOG-SOCIAL-AI-AUTOMATION-PRD.md`
- `CUSTOM_DOMAIN_IMPLEMENTATION.md`
- `LIVING_TECHNICAL_SPECIFICATION.md`
- `docs/CUSTOM_DOMAIN_CORS.md`
- `docs/CUSTOM_DOMAIN_FEATURE.md`
- `docs/CUSTOM_DOMAIN_TESTING.md`

---

## Edge Functions Audit

All 16 edge functions were audited. **All are correctly using environment variables** for Supabase configuration.

### Edge Functions Summary

| Function | SUPABASE_URL | SUPABASE_ANON_KEY | SUPABASE_SERVICE_ROLE_KEY | Other APIs |
|----------|--------------|-------------------|---------------------------|------------|
| `ai-generate` | - | - | - | CLAUDE_API_KEY, OPENAI_API_KEY |
| `check-subscription` | Yes | - | Yes | - |
| `create-checkout` | Yes | Yes | - | STRIPE_SECRET_KEY |
| `create-one-time-payment` | Yes | Yes | Yes | STRIPE_SECRET_KEY |
| `customer-portal` | Yes | Yes | - | STRIPE_SECRET_KEY |
| `generate-sitemap` | Yes | - | Yes | - |
| `generate-wallet-pass` | Yes | - | Yes | APPLE_*, GOOGLE_WALLET_* |
| `get-org-by-domain` | Yes | - | Yes | - |
| `health` | - | - | - | - |
| `health-check` | Yes | - | Yes | - |
| `rate-limit` | Yes | - | Yes | - |
| `receive-email` | Yes | - | Yes | AMAZON_SMTP_* |
| `send-email-response` | Yes | Yes | - | AMAZON_SMTP_* |
| `setup-new-user` | Yes | - | Yes | - |
| `verify-custom-domain` | Yes | - | Yes | - |
| `verify-payment` | Yes | - | Yes | STRIPE_WEBHOOK_SECRET |

**Verdict:** Edge functions are properly configured for self-hosted deployment.

---

## Environment Variables Master List

### Frontend Variables (VITE_*)

Required for client-side application:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | **Yes** | Main Supabase API URL | `https://api.repclub.net` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Public anonymous key | `eyJhbGci...` |
| `VITE_SUPABASE_FUNCTIONS_URL` | **Yes*** | Edge functions URL (self-hosted) | `https://functions.repclub.net` |
| `VITE_APP_VERSION` | No | App version for display | `1.0.0` |
| `VITE_APP_ENV` | No | Environment mode | `production` |
| `VITE_GA_ID` | No | Google Analytics ID | `G-XXXXXXXXXX` |
| `VITE_DEFAULT_ORIGIN` | No | Default domain for routing | `gym-unity.app` |

*Required for self-hosted Supabase deployments

---

### Edge Functions Variables

Core Supabase configuration:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | **Yes** | Self-hosted API URL |
| `SUPABASE_ANON_KEY` | **Yes** | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Admin service role key (SECRET!) |

AI/LLM Services:

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_API_KEY` | For AI features | Anthropic Claude API key |
| `OPENAI_API_KEY` | For AI features | OpenAI API key |

Payment Processing (Stripe):

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | For payments | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | Stripe webhook signing secret |

Email (Amazon SES):

| Variable | Required | Description |
|----------|----------|-------------|
| `AMAZON_SMTP_ENDPOINT` | For email | SES SMTP endpoint (e.g., `email-smtp.us-east-1.amazonaws.com:587`) |
| `AMAZON_SMTP_USER_NAME` | For email | SES SMTP username |
| `AMAZON_SMTP_PASSWORD` | For email | SES SMTP password |

Apple Wallet:

| Variable | Required | Description |
|----------|----------|-------------|
| `APPLE_PASS_TYPE_ID` | For wallet | Pass Type ID (e.g., `pass.com.yourcompany.gym`) |
| `APPLE_TEAM_ID` | For wallet | Apple Developer Team ID |
| `APPLE_PASS_CERTIFICATE` | For wallet | Base64 encoded .p12 certificate |
| `APPLE_PASS_CERTIFICATE_PASSWORD` | For wallet | Password for .p12 certificate |
| `APPLE_WWDR_CERTIFICATE` | For wallet | Base64 encoded Apple WWDR certificate |

Google Wallet:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_WALLET_ISSUER_ID` | For wallet | Google Wallet Issuer ID |
| `GOOGLE_WALLET_SERVICE_ACCOUNT` | For wallet | Base64 encoded service account JSON |

Build/Deploy Metadata:

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_VERSION` | No | Application version |
| `ENVIRONMENT` | No | Environment name |
| `GIT_COMMIT` | No | Git commit SHA |
| `GIT_BRANCH` | No | Git branch name |
| `BUILD_TIME` | No | Build timestamp |

---

### Cloudflare Worker Variables

For custom domain routing:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | **Yes** | Self-hosted API URL |
| `SUPABASE_ANON_KEY` | **Yes** | Public anonymous key |
| `SUPABASE_FUNCTIONS_URL` | For self-hosted | Edge functions URL |
| `DEFAULT_ORIGIN` | **Yes** | Default app domain |

---

### Database Direct Access (Optional)

Only needed for direct PostgreSQL connections:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_DB_HOST` | For direct DB | Database host |
| `SUPABASE_DB_PORT` | For direct DB | Database port (default: 5432) |
| `SUPABASE_DB_PASSWORD` | For direct DB | Database password |

---

## Routing Architecture

### Self-Hosted URL Patterns

```
Self-Hosted Supabase Architecture
================================

┌─────────────────────────────────────────────────────────┐
│                    Your Domain                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  api.[domain]           (Kong Gateway)                  │
│  ├── /rest/v1/*        → PostgREST                     │
│  ├── /auth/v1/*        → GoTrue (Auth)                 │
│  ├── /storage/v1/*     → Storage                       │
│  ├── /realtime/v1/*    → Realtime                      │
│  └── /functions/v1/*   → Edge Functions (fallback)     │
│                                                         │
│  functions.[domain]     (Edge Functions via Kong)       │
│  └── /{function-name}  → Deno Edge Runtime             │
│                                                         │
│  studio.[domain]        (Supabase Studio - Optional)   │
│  └── /*                → Studio Dashboard              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Client Configuration

The Supabase client at `src/integrations/supabase/client.ts` supports both configurations:

```typescript
// For self-hosted: Set both URLs
VITE_SUPABASE_URL=https://api.repclub.net
VITE_SUPABASE_FUNCTIONS_URL=https://functions.repclub.net

// For cloud-hosted: Only main URL needed
VITE_SUPABASE_URL=https://yourproject.supabase.co
// Functions default to ${SUPABASE_URL}/functions/v1
```

---

## Security Configuration Updates

### CSP Headers (public/_headers)

Current CSP connect-src includes `*.supabase.co`. For self-hosted, add your domains:

```
Content-Security-Policy: ... connect-src 'self'
  https://api.repclub.net
  https://functions.repclub.net
  wss://api.repclub.net
  https://*.supabase.co  # Keep for compatibility during migration
  ...
```

### CORS Configuration (src/lib/security/cors-config.ts)

Update `PRODUCTION_ORIGINS` to include self-hosted domains:

```typescript
const PRODUCTION_ORIGINS = [
  // Primary domain
  'https://gym-unity-suite.com',
  // ... existing entries ...

  // Self-hosted Supabase
  'https://api.repclub.net',
  'https://functions.repclub.net',

  // Keep supabase.co for migration period
  'https://*.supabase.co',
];
```

### Security Headers (src/lib/security/security-headers.ts)

Update CSP directives:

```typescript
'connect-src': [
  "'self'",
  'https://api.repclub.net',
  'https://functions.repclub.net',
  'wss://api.repclub.net',
  // Keep during migration
  'https://*.supabase.co',
  'wss://*.supabase.co',
  // ... other entries
],
```

---

## Action Items Checklist

### Critical (Must Fix)

- [ ] **Fix EmailTicketManager.tsx** - Replace hardcoded URL with `edgeFunctions.getUrl()`
- [ ] **Update client.ts fallbacks** - Remove or update hardcoded supabase.co URLs
- [ ] **Configure service worker** - Update placeholder URLs in `public/sw.js`

### High Priority

- [ ] **Update CSP headers** - Add self-hosted domains to `public/_headers`
- [ ] **Update CORS config** - Add self-hosted domains to `cors-config.ts`
- [ ] **Update security headers** - Add self-hosted domains to `security-headers.ts`

### Environment Setup

- [ ] Set all required `VITE_*` environment variables in Cloudflare Pages
- [ ] Set all required edge function variables in Coolify/Docker
- [ ] Set Cloudflare Worker secrets via `wrangler secret put`

### Testing

- [ ] Verify client can connect to self-hosted API
- [ ] Verify edge functions are accessible via functions subdomain
- [ ] Verify auth flow works end-to-end
- [ ] Verify storage operations work
- [ ] Verify realtime subscriptions work
- [ ] Test webhook URLs (email tickets, payments)

---

## Quick Reference: Environment Template

### .env (Frontend - Cloudflare Pages)

```bash
# Required
VITE_SUPABASE_URL=https://api.repclub.net
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_FUNCTIONS_URL=https://functions.repclub.net

# Optional
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_GA_ID=G-XXXXXXXXXX
```

### Edge Functions (.env or Coolify Environment)

```bash
# Core Supabase
SUPABASE_URL=https://api.repclub.net
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
AMAZON_SMTP_ENDPOINT=email-smtp.us-east-1.amazonaws.com:587
AMAZON_SMTP_USER_NAME=AKIA...
AMAZON_SMTP_PASSWORD=...

# Mobile Wallets (optional)
APPLE_PASS_TYPE_ID=pass.com.yourcompany.gym
APPLE_TEAM_ID=...
GOOGLE_WALLET_ISSUER_ID=...
```

### Cloudflare Worker (via wrangler secret put)

```bash
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_ANON_KEY --env production
wrangler secret put SUPABASE_FUNCTIONS_URL --env production
wrangler secret put DEFAULT_ORIGIN --env production
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-18 | Claude | Initial audit and documentation |

