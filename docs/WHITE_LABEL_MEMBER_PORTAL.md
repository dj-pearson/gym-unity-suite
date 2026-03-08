# White-Label Member Portal - Complete Planning Document

**Document Version:** 1.0
**Created:** 2026-03-08
**Status:** Planning Phase
**Author:** Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Tiers](#product-vision--tiers)
3. [Existing Infrastructure Audit](#existing-infrastructure-audit)
4. [Architecture Design](#architecture-design)
5. [Member Portal Feature Inventory](#member-portal-feature-inventory)
6. [Branding & Customization System](#branding--customization-system)
7. [Deployment Models](#deployment-models)
8. [Database & Multi-Tenancy](#database--multi-tenancy)
9. [Authentication & Security](#authentication--security)
10. [API Layer & Edge Functions](#api-layer--edge-functions)
11. [Component Migration Plan](#component-migration-plan)
12. [Implementation Phases](#implementation-phases)
13. [Subscription & Billing Model](#subscription--billing-model)
14. [Technical Specifications](#technical-specifications)
15. [Risk Assessment & Mitigations](#risk-assessment--mitigations)

---

## 1. Executive Summary

### What We're Building

A **fully white-labeled, plug-and-play member portal** that any gym can adopt as their own branded member experience. Members see their gym's branding, colors, logo, and domain - never "Rep Club" or "Gym Unity Suite." The portal is a turnkey solution: a gym signs up, configures their brand, and their members get a polished, modern app experience under the gym's identity.

### Why This Matters

- **For Gyms:** A professional digital member experience without building custom software. Members interact with "FitLife Gym" or "Iron Temple," not a third-party platform.
- **For Members:** A seamless, branded experience for class booking, check-ins, loyalty rewards, billing, and fitness tracking.
- **For Rep Club (Us):** A scalable SaaS revenue model with tiered pricing, expanding from gym management tooling into the member-facing experience market.

### Core Principles

1. **Zero Rep Club Branding** - Members should never see our brand unless the gym opts into a "Powered by" badge
2. **Plug & Play** - Gym sets up in under 30 minutes: upload logo, pick colors, configure domain
3. **Fully Customizable** - Every visual element adapts to the gym's brand
4. **Mobile-First** - PWA with offline support, designed for phone-in-pocket gym usage
5. **Secure Multi-Tenant** - Complete data isolation between gyms

---

## 2. Product Vision & Tiers

### Subscription Tiers

| Feature | Starter | Professional | Enterprise |
|---------|---------|-------------|------------|
| **Monthly Price** | $49/mo | $149/mo | $349+/mo |
| **Domain** | `gymname.repclub.app` | `gymname.repclub.app` | `members.yourgym.com` |
| **Branding** | Logo + 2 colors | Logo + full theme | Complete white-label |
| **"Powered by" Badge** | Required | Optional | Removable |
| **Member Limit** | 500 | 2,000 | Unlimited |
| **Features** | Core (dashboard, classes, check-in) | Core + Loyalty + Referrals | Full suite + API access |
| **Custom CSS** | No | Limited | Full override |
| **Mobile PWA** | Yes | Yes + custom icon | Yes + custom splash |
| **Email Templates** | Standard branded | Custom branded | Fully custom |
| **Support** | Email | Priority email | Dedicated account manager |
| **Analytics** | Basic | Advanced | Advanced + export |
| **Custom Pages** | No | No | Yes (via CMS blocks) |
| **API Access** | No | Read-only | Full CRUD |

### Tier-Specific Domain Architecture

```
STARTER:        https://irontemple.repclub.app
PROFESSIONAL:   https://irontemple.repclub.app  (badge optional)
ENTERPRISE:     https://members.irontemple.com   (fully white-labeled)
```

---

## 3. Existing Infrastructure Audit

### What Already Exists (and can be leveraged)

#### Custom Domain System (COMPLETE)
- **Database:** `organizations` table has `custom_domain`, `custom_domain_verified`, `domain_verification_token`, `domain_ssl_enabled`, `subscription_tier`
- **Edge Function:** `get-org-by-domain` resolves domain to organization branding data
- **Edge Function:** `verify-custom-domain` handles DNS TXT/CNAME/A record verification
- **Cloudflare Worker:** `custom-domain-router` intercepts requests, injects branding CSS/JS into HTML
- **Frontend:** `CustomDomainContext`, `useCustomDomain` hook apply branding dynamically
- **Status:** Production-ready, enterprise tier only

#### Branding System (PARTIAL)
- **Database Fields:** `logo_url`, `primary_color`, `secondary_color` on `organizations`
- **CSS Variables:** `--primary`, `--secondary` injected at multiple levels (Worker, hook, CSS)
- **Admin UI:** Color pickers and logo upload in OrganizationSettingsPage (Branding tab)
- **Gap:** Only 2 colors. Need full theme system (background, text, accent, surface colors, fonts, border radius, etc.)

#### Member Portal Pages (COMPLETE - needs extraction)
- `MemberDashboard.tsx` - Stats, upcoming classes, activity feed, loyalty points
- `MemberClasses.tsx` - Browse, book, waitlist, cancel classes
- `MemberProfilePage.tsx` - Profile view/edit, member card, QR code, fitness assessments
- `MemberNotifications.tsx` - Inbox, preferences, channel settings
- `MemberWorkoutHistory.tsx` - Check-in history, streaks, statistics
- `MembershipPlansPage.tsx` - Browse and subscribe to plans
- `MembershipSuccessPage.tsx` - Post-purchase confirmation

#### Member Components (COMPLETE - needs extraction)
- `MemberCheckInPass.tsx` - QR code, barcode, Apple/Google Wallet
- `ProfileEditForm.tsx` - Full profile editing with Zod validation
- `MembershipInfo.tsx` - Current plan, billing, manage subscription
- `MemberActivitySummary.tsx` - Activity stats
- `NotificationSettings.tsx` - Channel and category preferences
- `MemberCardDisplay.tsx` - Visual member ID card
- `FitnessAssessmentDisplay.tsx` - Fitness tracking data

#### Mobile/PWA Components (COMPLETE - needs extraction)
- `MobileCheckIn.tsx` - Mobile check-in with QR code
- `EnhancedMobileDashboard.tsx` - Mobile-first dashboard
- `PWAInstallPrompt.tsx` - Install prompts per device
- `MobileNavigation.tsx` - Bottom tab navigation
- `MobileClassBooking.tsx` - Mobile class booking
- `OfflineModeManager.tsx` - IndexedDB sync, background sync
- `PushNotificationManager.tsx` - Push notification subscription

#### Loyalty & Engagement (COMPLETE - needs extraction)
- **Database:** `loyalty_points`, `member_engagement_history`, `retention_campaigns`, `referral_programs`, `member_referrals`
- **Components:** `LoyaltyPointsManager`, `LoyaltyProgramsManager`, `ReferralProgramsManager`

#### Authentication (COMPLETE)
- Supabase Auth with email/password, magic link
- Organization-scoped sessions via `AuthContext`
- RBAC with 5 roles and 30+ permissions
- `ProtectedRoute` component for route-level access control

### What Needs to Be Built

| Component | Priority | Effort |
|-----------|----------|--------|
| Subdomain routing (`*.repclub.app`) | P0 | Medium |
| Extended theme system (beyond 2 colors) | P0 | Medium |
| Member portal shell/layout (isolated from admin) | P0 | Medium |
| Portal configuration admin panel | P0 | Large |
| Theme preview (live preview as gym configures) | P1 | Medium |
| Custom font support | P1 | Small |
| Email template branding | P1 | Medium |
| PWA manifest generation per gym | P1 | Medium |
| Embeddable widget mode | P2 | Large |
| Custom CSS injection (Enterprise) | P2 | Small |
| CMS block system for custom pages (Enterprise) | P3 | Large |
| API access layer (Enterprise) | P2 | Large |

---

## 4. Architecture Design

### High-Level Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              DNS / Cloudflare                │
                    │                                             │
                    │  *.repclub.app  →  Wildcard subdomain       │
                    │  members.gym.com →  Custom domain (CNAME)   │
                    └─────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────▼───────────────────────────────┐
                    │         Cloudflare Worker (Edge)            │
                    │                                             │
                    │  1. Extract org from subdomain or domain    │
                    │  2. Fetch org branding from Supabase        │
                    │  3. Inject theme CSS + org config into HTML │
                    │  4. Proxy to member portal SPA              │
                    │  5. Set security headers                    │
                    └─────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────▼───────────────────────────────┐
                    │      Member Portal SPA (React App)          │
                    │                                             │
                    │  Separate build / entry point from admin    │
                    │  ┌──────────────────────────────────┐      │
                    │  │  Portal Shell                     │      │
                    │  │  ├── Branded Header/Nav           │      │
                    │  │  ├── Theme Provider               │      │
                    │  │  ├── Auth (member-only)           │      │
                    │  │  └── Routes:                      │      │
                    │  │      ├── /dashboard               │      │
                    │  │      ├── /classes                 │      │
                    │  │      ├── /check-in                │      │
                    │  │      ├── /profile                 │      │
                    │  │      ├── /loyalty                 │      │
                    │  │      ├── /billing                 │      │
                    │  │      ├── /notifications           │      │
                    │  │      └── /history                 │      │
                    │  └──────────────────────────────────┘      │
                    └─────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────▼───────────────────────────────┐
                    │           Supabase Backend                  │
                    │                                             │
                    │  Auth  │  Database (RLS)  │  Edge Functions │
                    │  Storage  │  Realtime  │  File Storage      │
                    └─────────────────────────────────────────────┘
```

### Two Build Strategy: Admin vs. Member Portal

The member portal should be a **separate Vite entry point** sharing the same component library but with an independent route tree and shell layout. This provides:

- **Smaller bundle** - Members don't download admin code
- **Independent deployment** - Portal updates don't require admin redeployment
- **Security isolation** - No admin routes exist in the portal bundle
- **Different PWA manifests** - Each gym gets its own manifest

```
src/
├── admin/                    # Admin app entry
│   ├── main.tsx             # Admin entry point
│   ├── App.tsx              # Admin routes & layout
│   └── ...
├── portal/                   # Member portal entry (NEW)
│   ├── main.tsx             # Portal entry point
│   ├── App.tsx              # Portal routes & layout
│   ├── PortalShell.tsx      # Branded shell wrapper
│   ├── PortalThemeProvider.tsx  # Dynamic theming
│   ├── PortalAuthProvider.tsx   # Member-only auth
│   └── routes/              # Portal route definitions
├── components/               # Shared component library
│   ├── ui/                  # Shared UI primitives
│   ├── members/             # Member components (shared)
│   ├── membership/          # Membership components (shared)
│   ├── checkin/             # Check-in components (shared)
│   ├── mobile/              # Mobile components (shared)
│   └── portal/              # Portal-specific components (NEW)
│       ├── PortalHeader.tsx
│       ├── PortalFooter.tsx
│       ├── PortalSidebar.tsx
│       ├── BrandedLogin.tsx
│       ├── ThemePreview.tsx
│       └── ...
├── hooks/                   # Shared hooks
├── contexts/                # Shared contexts
├── lib/                     # Shared utilities
└── integrations/            # Shared integrations
```

### Vite Multi-Entry Configuration

```typescript
// vite.config.ts addition
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        admin: resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'portal.html'),
      },
    },
  },
});
```

---

## 5. Member Portal Feature Inventory

### Features Moving to Portal (Copy/Share, Not Move)

Components are **shared** between admin and portal, not moved. The portal imports them from the shared component library.

#### Tier: Starter (Core)

| Feature | Source Component(s) | Portal Route | Notes |
|---------|-------------------|--------------|-------|
| **Member Dashboard** | `MemberDashboard.tsx`, `EnhancedMobileDashboard.tsx` | `/dashboard` | Combine desktop + mobile into responsive portal dashboard |
| **Class Browser & Booking** | `MemberClasses.tsx`, `MobileClassBooking.tsx` | `/classes` | Calendar view, book, waitlist, cancel |
| **Check-In Pass** | `MemberCheckInPass.tsx`, `MobileCheckIn.tsx` | `/check-in` | QR code, barcode, Apple/Google Wallet |
| **Profile Management** | `MemberProfilePage.tsx`, `ProfileEditForm.tsx`, `MemberCardDisplay.tsx` | `/profile` | View/edit profile, member card |
| **Notification Center** | `MemberNotifications.tsx`, `NotificationSettings.tsx` | `/notifications` | Inbox + preference management |
| **PWA Install** | `PWAInstallPrompt.tsx`, `OfflineModeManager.tsx` | (global) | Per-gym PWA with custom icon/name |
| **Branded Login** | NEW - `BrandedLogin.tsx` | `/login` | Gym-branded login/signup page |
| **Membership Plans** | `MembershipPlansPage.tsx`, `MembershipPlanCard.tsx` | `/plans` | Browse and subscribe to plans |

#### Tier: Professional (Core + Advanced)

| Feature | Source Component(s) | Portal Route | Notes |
|---------|-------------------|--------------|-------|
| **Loyalty Points** | `LoyaltyPointsManager.tsx` (member view) | `/loyalty` | Points balance, history, redemption |
| **Referral Program** | `ReferralProgramsManager.tsx` (member view) | `/referrals` | Share referral links, track rewards |
| **Workout History** | `MemberWorkoutHistory.tsx` | `/history` | Attendance, streaks, statistics |
| **Fitness Assessments** | `FitnessAssessmentDisplay.tsx` | `/fitness` | View fitness data and progress |
| **Billing Management** | `MembershipInfo.tsx`, `SubscriptionStatus.tsx` | `/billing` | Manage subscription, view invoices |
| **Push Notifications** | `PushNotificationManager.tsx` | (global) | Browser push notification support |

#### Tier: Enterprise (Full Suite)

| Feature | Source Component(s) | Portal Route | Notes |
|---------|-------------------|--------------|-------|
| **Custom Pages** | NEW - CMS block system | `/pages/:slug` | Gym creates custom content pages |
| **Community/Social** | NEW | `/community` | Member-to-member interaction |
| **Personal Training** | Training components | `/training` | Book PT sessions, view programs |
| **Retail/Pro Shop** | Retail components | `/shop` | Browse and purchase merchandise |
| **Spa/Services** | Spa components | `/services` | Book spa and wellness services |
| **Court Booking** | Court components | `/courts` | Reserve courts and facilities |
| **Childcare** | Childcare components | `/childcare` | Reserve childcare slots |
| **API Access** | NEW - REST API | N/A | Headless access for custom apps |

### New Portal-Specific Components to Build

| Component | Purpose | Priority |
|-----------|---------|----------|
| `PortalShell.tsx` | Main layout wrapper with branded header, nav, footer | P0 |
| `PortalHeader.tsx` | Branded header with gym logo, member name, notifications | P0 |
| `PortalSidebar.tsx` | Navigation sidebar (desktop) with gym branding | P0 |
| `PortalBottomNav.tsx` | Mobile bottom navigation bar | P0 |
| `PortalFooter.tsx` | Footer with optional "Powered by" badge | P0 |
| `BrandedLogin.tsx` | Gym-branded login/signup page | P0 |
| `BrandedSignup.tsx` | Gym-branded member registration | P0 |
| `PortalThemeProvider.tsx` | Applies full theme (colors, fonts, radius, etc.) | P0 |
| `ThemePreview.tsx` | Live theme preview for admin configuration | P1 |
| `PortalOnboarding.tsx` | First-time member onboarding flow | P1 |
| `LoyaltyDashboard.tsx` | Member-facing loyalty points view | P1 |
| `ReferralWidget.tsx` | Shareable referral link with stats | P1 |
| `PortalWelcomeScreen.tsx` | Customizable welcome/landing page per gym | P1 |

---

## 6. Branding & Customization System

### Extended Theme Schema

The current system only supports `primary_color` and `secondary_color`. The white-label portal needs a comprehensive theme system.

#### New Database Table: `portal_themes`

```sql
CREATE TABLE portal_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Core Colors (HSL format for Tailwind compatibility)
  color_primary TEXT NOT NULL DEFAULT '221 83% 53%',       -- Primary brand color
  color_secondary TEXT NOT NULL DEFAULT '24 95% 53%',      -- Secondary/accent color
  color_background TEXT NOT NULL DEFAULT '0 0% 100%',      -- Page background
  color_surface TEXT NOT NULL DEFAULT '0 0% 98%',          -- Card/panel background
  color_text_primary TEXT NOT NULL DEFAULT '222 47% 11%',  -- Primary text
  color_text_secondary TEXT NOT NULL DEFAULT '215 14% 34%', -- Secondary text
  color_text_muted TEXT NOT NULL DEFAULT '220 9% 46%',     -- Muted/helper text
  color_border TEXT NOT NULL DEFAULT '220 13% 91%',        -- Borders
  color_success TEXT NOT NULL DEFAULT '142 70% 45%',       -- Success states
  color_warning TEXT NOT NULL DEFAULT '38 92% 50%',        -- Warning states
  color_error TEXT NOT NULL DEFAULT '0 84% 60%',           -- Error states

  -- Dark Mode Colors (nullable - falls back to auto-generated if not set)
  dark_color_background TEXT,
  dark_color_surface TEXT,
  dark_color_text_primary TEXT,
  dark_color_text_secondary TEXT,
  dark_color_border TEXT,

  -- Typography
  font_family_heading TEXT DEFAULT 'Inter',     -- Heading font
  font_family_body TEXT DEFAULT 'Inter',        -- Body font
  font_size_base TEXT DEFAULT '16px',           -- Base font size

  -- Shape & Layout
  border_radius TEXT DEFAULT '0.5rem',          -- Global border radius
  border_radius_button TEXT DEFAULT '0.375rem', -- Button border radius
  button_style TEXT DEFAULT 'default',          -- default | rounded | pill | square
  card_style TEXT DEFAULT 'bordered',           -- bordered | shadow | flat

  -- Logo & Images
  logo_url TEXT,                                -- Primary logo (header)
  logo_dark_url TEXT,                           -- Logo for dark mode
  logo_icon_url TEXT,                           -- Square icon (PWA, favicon)
  login_background_url TEXT,                    -- Login page background image
  welcome_hero_url TEXT,                        -- Welcome page hero image

  -- Custom CSS (Enterprise only)
  custom_css TEXT,                              -- Raw CSS override

  -- "Powered By" Configuration
  show_powered_by BOOLEAN DEFAULT true,         -- Show "Powered by Rep Club"
  powered_by_style TEXT DEFAULT 'badge',        -- badge | text | none

  -- PWA Configuration
  pwa_name TEXT,                                -- PWA app name
  pwa_short_name TEXT,                          -- PWA short name
  pwa_theme_color TEXT,                         -- PWA theme color (status bar)
  pwa_background_color TEXT,                    -- PWA splash screen color

  -- Email Branding
  email_header_color TEXT,                      -- Email template header color
  email_footer_text TEXT,                       -- Custom email footer

  -- Feature Toggles
  features_enabled JSONB DEFAULT '{
    "classes": true,
    "check_in": true,
    "loyalty": false,
    "referrals": false,
    "fitness_tracking": false,
    "billing_self_service": true,
    "push_notifications": false,
    "workout_history": false,
    "personal_training": false,
    "retail": false,
    "spa": false,
    "courts": false,
    "childcare": false,
    "community": false,
    "custom_pages": false,
    "api_access": false
  }'::jsonb,

  -- Navigation Customization
  nav_items JSONB,                              -- Custom navigation order/labels

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One theme per organization
CREATE UNIQUE INDEX idx_portal_themes_org ON portal_themes(organization_id);
```

### Theme Application Flow

```
1. Cloudflare Worker: Fetch theme from get-org-by-domain (cached 5 min)
2. Inject into HTML <head>:
   - <style> block setting all CSS variables
   - <script> with window.__PORTAL_THEME__ = { ... }
   - <link> for custom Google Fonts if specified
   - Custom favicon/icon links
3. React PortalThemeProvider reads window.__PORTAL_THEME__
4. Falls back to Supabase query if not injected (direct access)
5. Applies all CSS variables to :root
6. Components use Tailwind classes that reference CSS variables
```

### Theme CSS Variable Mapping

```css
:root {
  /* Core */
  --portal-primary: var(--theme-color-primary, 221 83% 53%);
  --portal-secondary: var(--theme-color-secondary, 24 95% 53%);
  --portal-background: var(--theme-color-background, 0 0% 100%);
  --portal-surface: var(--theme-color-surface, 0 0% 98%);
  --portal-text: var(--theme-color-text-primary, 222 47% 11%);
  --portal-text-secondary: var(--theme-color-text-secondary, 215 14% 34%);
  --portal-text-muted: var(--theme-color-text-muted, 220 9% 46%);
  --portal-border: var(--theme-color-border, 220 13% 91%);

  /* Status */
  --portal-success: var(--theme-color-success, 142 70% 45%);
  --portal-warning: var(--theme-color-warning, 38 92% 50%);
  --portal-error: var(--theme-color-error, 0 84% 60%);

  /* Typography */
  --portal-font-heading: var(--theme-font-heading, 'Inter');
  --portal-font-body: var(--theme-font-body, 'Inter');
  --portal-font-size-base: var(--theme-font-size, 16px);

  /* Shape */
  --portal-radius: var(--theme-border-radius, 0.5rem);
  --portal-radius-button: var(--theme-border-radius-button, 0.375rem);
}
```

### Preset Themes (Quick Start)

Offer preset themes gyms can start from and customize:

| Preset | Description | Primary | Surface | Style |
|--------|-------------|---------|---------|-------|
| **Modern** | Clean, minimal, blue accents | Blue | White | Rounded corners |
| **Dark Gym** | Dark, bold, orange accents | Orange | Charcoal | Sharp corners |
| **Wellness** | Soft, warm, green accents | Sage Green | Cream | Pill buttons |
| **Urban** | High contrast, neon accents | Electric Blue | Near-black | Flat cards |
| **Classic** | Traditional, navy/gold | Navy | Light gray | Bordered cards |
| **Vibrant** | Colorful, energetic | Hot Pink | White | Rounded, shadows |

---

## 7. Deployment Models

### Model A: Subdomain Hosting (Starter + Professional)

```
irontemple.repclub.app
├── Wildcard DNS: *.repclub.app → Cloudflare Worker
├── Worker extracts subdomain → looks up organization by slug
├── Fetches theme, injects branding
├── Serves portal SPA from CDN
└── All member traffic stays on repclub.app domain
```

**Implementation:**
- Wildcard DNS A/AAAA record for `*.repclub.app`
- Cloudflare Worker route: `*.repclub.app/*`
- Worker extracts subdomain from hostname
- Looks up org by `slug` field (not custom domain)
- Same branding injection as custom domain worker

**New Edge Function: `get-org-by-slug`**
```typescript
// Fast lookup by organization slug for subdomain routing
const { data } = await supabase
  .from('organizations')
  .select('id, name, slug, logo_url, primary_color, secondary_color')
  .eq('slug', slug)
  .single();
```

### Model B: Custom Domain Hosting (Enterprise)

```
members.irontemple.com
├── CNAME: members.irontemple.com → portal.repclub.app
├── Cloudflare Worker intercepts
├── Existing verify-custom-domain + get-org-by-domain flow
├── Full white-label: no Rep Club branding visible
└── Custom SSL certificate via Cloudflare
```

**Already Implemented:** The existing custom domain infrastructure supports this. Enhancements needed:
- Update worker to serve portal SPA instead of admin app
- Add portal-specific theme injection
- Generate per-gym PWA manifests dynamically

### Model C: Embeddable Widget (Future)

```html
<!-- Gym embeds on their existing website -->
<div id="repclub-portal"></div>
<script src="https://portal.repclub.app/embed.js"
        data-org="irontemple"
        data-features="classes,check-in,loyalty">
</script>
```

**Deferred to Phase 3.** Requires:
- Shadow DOM isolation
- Postmessage authentication
- Iframe fallback option

### Cloudflare Worker Enhancement

The existing `custom-domain-router` worker needs to be expanded to handle subdomain routing:

```typescript
// Enhanced worker logic (pseudocode)
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const hostname = url.hostname;

  let orgData: OrganizationData | null = null;

  // 1. Check if subdomain of repclub.app
  if (hostname.endsWith('.repclub.app') && hostname !== 'repclub.app') {
    const slug = hostname.split('.')[0];
    if (slug !== 'www' && slug !== 'api' && slug !== 'admin') {
      orgData = await fetchOrgBySlug(slug);  // New edge function
    }
  }

  // 2. Check if custom domain (existing logic)
  if (!orgData && !isDefaultDomain(hostname)) {
    orgData = await fetchOrgByDomain(hostname);  // Existing edge function
  }

  // 3. No org found - show generic landing or 404
  if (!orgData) {
    return new Response('Portal not found', { status: 404 });
  }

  // 4. Fetch portal SPA and inject branding
  const response = await fetch(PORTAL_ORIGIN + url.pathname);
  return injectBranding(response, orgData);
}
```

---

## 8. Database & Multi-Tenancy

### New Tables Required

```sql
-- 1. Portal Themes (detailed above in Section 6)
-- portal_themes

-- 2. Portal Configuration
CREATE TABLE portal_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Portal Status
  portal_enabled BOOLEAN DEFAULT false,
  portal_tier TEXT DEFAULT 'starter',  -- starter | professional | enterprise

  -- Subdomain
  portal_subdomain TEXT UNIQUE,        -- e.g., 'irontemple'
  subdomain_verified BOOLEAN DEFAULT false,

  -- Custom Domain (enterprise)
  portal_custom_domain TEXT UNIQUE,
  portal_domain_verified BOOLEAN DEFAULT false,
  portal_domain_verification_token TEXT,

  -- Welcome/Onboarding
  welcome_message TEXT,
  welcome_enabled BOOLEAN DEFAULT true,

  -- Registration
  allow_self_registration BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  registration_fields JSONB DEFAULT '["name", "email", "phone"]'::jsonb,

  -- Portal Analytics
  portal_visits_total INTEGER DEFAULT 0,
  portal_active_members INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_portal_config_org ON portal_configurations(organization_id);

-- 3. Portal Custom Pages (Enterprise)
CREATE TABLE portal_custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,            -- Structured content blocks
  published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- 4. Portal Member Sessions (analytics)
CREATE TABLE portal_member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  session_start TIMESTAMPTZ DEFAULT now(),
  session_end TIMESTAMPTZ,
  pages_visited JSONB DEFAULT '[]'::jsonb,
  device_type TEXT,                    -- mobile | tablet | desktop
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

All portal tables enforce organization isolation:

```sql
-- Portal themes: only org owners/managers can modify
CREATE POLICY "portal_themes_select" ON portal_themes
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "portal_themes_modify" ON portal_themes
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Member sessions: members can only see their own
CREATE POLICY "portal_sessions_select" ON portal_member_sessions
  FOR SELECT USING (member_id = auth.uid());
```

### Existing Tables Used by Portal

These tables are already in the database and will be queried by the portal:

| Table | Portal Usage |
|-------|-------------|
| `organizations` | Org branding, name, domain |
| `profiles` | Member profile data |
| `members` | Member status, membership info |
| `membership_plans` | Available plans to browse |
| `memberships` | Active membership details |
| `classes` | Class schedule and details |
| `class_bookings` | Member's booked classes |
| `class_waitlists` | Waitlist positions |
| `check_ins` | Check-in history |
| `loyalty_points` | Points balance and history |
| `member_engagement_history` | Activity feed data |
| `referral_programs` | Active referral programs |
| `member_referrals` | Member's referral tracking |
| `fitness_assessments` | Fitness data |
| `notification_preferences` | Notification settings |
| `notifications` | Notification inbox |
| `subscribers` | Stripe subscription data |
| `locations` | Gym locations for check-in |

---

## 9. Authentication & Security

### Member Authentication Flow

```
1. Member visits irontemple.repclub.app/login
2. Portal loads with Iron Temple branding
3. Member enters email + password (or magic link)
4. Supabase Auth validates credentials
5. Portal verifies member belongs to organization:
   - Query profiles table for user
   - Verify organization_id matches portal's org
   - Verify role = 'member'
6. Session established, member redirected to /dashboard
7. All subsequent API calls scoped by org + member ID
```

### Security Model

| Layer | Protection |
|-------|-----------|
| **DNS** | Domain verification prevents spoofing |
| **Edge** | Cloudflare Worker validates domain → org mapping |
| **Auth** | Supabase Auth handles credentials, JWT tokens |
| **Session** | JWT contains organization_id, role claims |
| **Database** | RLS policies enforce org isolation on every query |
| **Portal** | Member role check - can't access admin routes |
| **API** | Edge functions validate auth + org membership |

### Member Self-Registration

For gyms that enable self-registration:

```
1. Prospective member visits portal
2. Clicks "Sign Up" / "Join"
3. Fills registration form (configurable fields)
4. Supabase Auth creates account
5. Profile created with organization_id from portal context
6. If require_approval = true:
   - Member gets "pending approval" status
   - Gym admin notified
   - Admin approves in admin panel
7. If require_approval = false:
   - Member immediately active
   - Redirected to membership plan selection
```

### Cross-Origin Security

- Portal on `irontemple.repclub.app` makes API calls to Supabase
- CORS already configured in Supabase for `*.repclub.app`
- Custom domains need explicit CORS allowlist per organization
- Cloudflare Worker sets appropriate CORS headers

---

## 10. API Layer & Edge Functions

### New Edge Functions Required

| Function | Purpose | Tier |
|----------|---------|------|
| `get-org-by-slug` | Resolve subdomain slug to org branding | All |
| `get-portal-theme` | Fetch full theme for organization | All |
| `portal-register` | Member self-registration with org context | All |
| `generate-portal-manifest` | Dynamic PWA manifest per gym | All |
| `portal-analytics` | Track portal usage metrics | Pro+ |
| `portal-api` | RESTful API for headless access | Enterprise |

### Existing Edge Functions Used by Portal

| Function | Portal Usage |
|----------|-------------|
| `get-org-by-domain` | Custom domain resolution (enterprise) |
| `verify-custom-domain` | Domain setup (enterprise) |
| `check-subscription` | Verify member subscription status |
| `create-checkout` | Membership purchase flow |
| `customer-portal` | Stripe billing management |
| `generate-wallet-pass` | Apple/Google Wallet check-in pass |
| `send-email-response` | Branded email notifications |

### Portal API (Enterprise Tier)

Enterprise gyms get RESTful API access for building custom integrations:

```
GET    /api/v1/members/me              - Current member profile
PUT    /api/v1/members/me              - Update profile
GET    /api/v1/classes                  - Available classes
POST   /api/v1/classes/:id/book        - Book a class
DELETE /api/v1/classes/:id/book        - Cancel booking
GET    /api/v1/check-ins               - Check-in history
POST   /api/v1/check-ins               - Record check-in
GET    /api/v1/loyalty                  - Loyalty points balance
GET    /api/v1/loyalty/history          - Points history
GET    /api/v1/membership              - Current membership
GET    /api/v1/notifications            - Notifications
```

---

## 11. Component Migration Plan

### Strategy: Shared Components, Portal-Specific Wrappers

Components are NOT moved or copied. They remain in `src/components/` and are imported by both the admin app and the portal app. Portal-specific wrappers add branding and portal context.

### Component Classification

#### Direct Reuse (No Changes Needed)

These components work as-is in the portal:

| Component | Path | Notes |
|-----------|------|-------|
| All `ui/` components | `src/components/ui/` | shadcn-ui primitives, already themed via CSS variables |
| `ProfileEditForm` | `src/components/members/ProfileEditForm.tsx` | Form works in any context |
| `MemberCardDisplay` | `src/components/members/MemberCardDisplay.tsx` | Pure display component |
| `MemberActivitySummary` | `src/components/members/MemberActivitySummary.tsx` | Pure display component |
| `FitnessAssessmentDisplay` | `src/components/members/FitnessAssessmentDisplay.tsx` | Pure display component |
| `NotificationSettings` | `src/components/members/NotificationSettings.tsx` | Self-contained form |
| `MemberCheckInPass` | `src/components/checkin/MemberCheckInPass.tsx` | QR/barcode display |
| `MembershipPlanCard` | `src/components/membership/MembershipPlanCard.tsx` | Plan display card |
| `SubscriptionStatus` | `src/components/membership/SubscriptionStatus.tsx` | Status display |
| `SubscriptionButton` | `src/components/membership/SubscriptionButton.tsx` | Checkout trigger |
| `OneTimePaymentButton` | `src/components/membership/OneTimePaymentButton.tsx` | Payment button |
| `PWAInstallPrompt` | `src/components/mobile/PWAInstallPrompt.tsx` | Install prompt |
| `OfflineModeManager` | `src/components/mobile/OfflineModeManager.tsx` | Offline sync |
| `PushNotificationManager` | `src/components/mobile/PushNotificationManager.tsx` | Push setup |

#### Needs Portal Wrapper (Minor Adaptation)

These components need a thin wrapper to replace admin-specific context with portal context:

| Component | Adaptation Needed |
|-----------|-------------------|
| `MemberDashboard.tsx` | Replace admin layout → portal layout. Remove staff-only widgets. |
| `MemberClasses.tsx` | Replace admin sidebar → portal navigation. Simplify to member-only actions. |
| `MemberProfilePage.tsx` | Remove admin tabs (fitness assessment editing). Member can view, limited edit. |
| `MemberNotifications.tsx` | Works mostly as-is. Wrap with portal layout. |
| `MemberWorkoutHistory.tsx` | Works mostly as-is. Wrap with portal layout. |
| `MembershipPlansPage.tsx` | Remove admin edit controls. Member can only browse and subscribe. |
| `MembershipInfo.tsx` | Remove staff override options. Member self-service only. |
| `MobileCheckIn.tsx` | Needs portal auth context instead of admin auth. |
| `EnhancedMobileDashboard.tsx` | Replace mobile navigation with portal bottom nav. |

#### New Portal-Only Components

| Component | Purpose | Details |
|-----------|---------|---------|
| `PortalShell.tsx` | Main layout | Header + sidebar (desktop) or bottom nav (mobile) + footer |
| `PortalHeader.tsx` | Branded header | Gym logo, member avatar, notification bell, menu toggle |
| `PortalSidebar.tsx` | Desktop nav | Navigation links based on enabled features |
| `PortalBottomNav.tsx` | Mobile nav | Bottom tab bar (Dashboard, Classes, Check-In, Profile, More) |
| `PortalFooter.tsx` | Footer | Optional "Powered by", links, copyright |
| `BrandedLogin.tsx` | Login page | Gym logo, colors, optional background image, login form |
| `BrandedSignup.tsx` | Registration | Self-registration with configurable fields |
| `PortalThemeProvider.tsx` | Theme engine | Reads theme config, applies CSS variables |
| `PortalOnboarding.tsx` | New member flow | Welcome, select plan, complete profile |
| `LoyaltyDashboard.tsx` | Points view | Balance, history, available rewards, tier progress |
| `ReferralWidget.tsx` | Referral CTA | Share link, track referrals, view rewards |
| `PortalWelcomeScreen.tsx` | Landing page | Customizable welcome for first visit |
| `PortalClassCalendar.tsx` | Calendar view | Simplified class calendar for member booking |

### Hook Usage in Portal

| Hook | Portal Usage | Changes Needed |
|------|-------------|----------------|
| `useCheckIn` | Member check-in flow | None - works with member auth |
| `useMembers` | Fetch member's own data | Add member-self query variant |
| `usePermissions` | Feature gating | Add portal tier checking |
| `useCustomDomain` | Theme/branding application | Extend for full theme support |
| `useSubscription` | Membership status | None - works with member auth |
| NEW: `usePortalTheme` | Full theme management | New hook for portal theming |
| NEW: `usePortalConfig` | Portal configuration | New hook for feature flags, nav |
| NEW: `usePortalAuth` | Portal-specific auth | Member-only auth with org validation |

---

## 12. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Portal shell, theming, subdomain routing - get the infrastructure running

| Task | Description | Effort |
|------|-------------|--------|
| 1.1 | Create `portal_themes` and `portal_configurations` database tables + migrations | 2 days |
| 1.2 | Create `src/portal/` directory structure with entry point | 1 day |
| 1.3 | Build `PortalThemeProvider` - reads theme, applies CSS variables | 3 days |
| 1.4 | Build `PortalShell` - responsive layout (header, nav, footer) | 3 days |
| 1.5 | Build `BrandedLogin` - gym-branded login page | 2 days |
| 1.6 | Build `PortalAuthProvider` - member-only auth with org validation | 2 days |
| 1.7 | Create `get-org-by-slug` edge function | 1 day |
| 1.8 | Enhance Cloudflare Worker for subdomain routing (`*.repclub.app`) | 2 days |
| 1.9 | Configure Vite multi-entry build (admin + portal) | 2 days |
| 1.10 | Set up Cloudflare Pages deployment for portal build output | 1 day |
| 1.11 | Portal admin panel: enable portal, choose subdomain, configure theme | 3 days |

**Deliverable:** A gym admin can enable portal, choose subdomain, set basic theme. Members can log in and see a branded shell at `gymname.repclub.app`.

### Phase 2: Core Features (Weeks 5-8)

**Goal:** Starter tier fully functional

| Task | Description | Effort |
|------|-------------|--------|
| 2.1 | Portal Dashboard - integrate `MemberDashboard` with portal layout | 2 days |
| 2.2 | Portal Classes - integrate class browsing and booking | 3 days |
| 2.3 | Portal Check-In - integrate QR code pass and mobile check-in | 2 days |
| 2.4 | Portal Profile - member profile view and edit | 2 days |
| 2.5 | Portal Notifications - inbox and preferences | 1 day |
| 2.6 | Portal Membership Plans - browse and subscribe | 2 days |
| 2.7 | Member self-registration flow (`BrandedSignup`) | 3 days |
| 2.8 | PWA manifest generation per gym | 2 days |
| 2.9 | Mobile-responsive testing across all portal pages | 2 days |
| 2.10 | "Powered by Rep Club" badge component | 1 day |

**Deliverable:** Starter tier fully operational. Members can log in, view dashboard, book classes, check in, manage profile, view notifications.

### Phase 3: Professional Features (Weeks 9-12)

**Goal:** Professional tier fully functional

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Loyalty Dashboard - points, history, redemption | 3 days |
| 3.2 | Referral Widget - share links, track rewards | 3 days |
| 3.3 | Workout History integration | 1 day |
| 3.4 | Fitness Assessment display | 1 day |
| 3.5 | Billing self-service (Stripe customer portal) | 2 days |
| 3.6 | Push notification setup and management | 2 days |
| 3.7 | Advanced theme editor with live preview | 3 days |
| 3.8 | Custom font support (Google Fonts integration) | 1 day |
| 3.9 | Email template branding | 3 days |
| 3.10 | Portal analytics dashboard (for gym admin) | 3 days |

**Deliverable:** Professional tier fully operational. Loyalty, referrals, advanced theming, email branding.

### Phase 4: Enterprise Features (Weeks 13-18)

**Goal:** Enterprise tier fully functional

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Custom domain setup for portal (extend existing system) | 2 days |
| 4.2 | Custom CSS injection (Enterprise) | 1 day |
| 4.3 | CMS block system for custom pages | 5 days |
| 4.4 | Portal REST API (headless access) | 5 days |
| 4.5 | Personal training booking integration | 3 days |
| 4.6 | Retail/pro shop integration | 3 days |
| 4.7 | Spa/services booking integration | 2 days |
| 4.8 | Court booking integration | 2 days |
| 4.9 | Childcare reservation integration | 2 days |
| 4.10 | Embeddable widget mode (iframe/script) | 5 days |
| 4.11 | API key management for enterprise gyms | 2 days |
| 4.12 | White-label email sender domain support | 3 days |

**Deliverable:** Enterprise tier fully operational. Custom domains, custom pages, API access, all facility bookings.

### Phase 5: Polish & Scale (Weeks 19-22)

| Task | Description | Effort |
|------|-------------|--------|
| 5.1 | Performance optimization (Lighthouse 90+) | 3 days |
| 5.2 | Comprehensive E2E test suite for portal | 5 days |
| 5.3 | Accessibility audit and fixes (WCAG 2.1 AA) | 3 days |
| 5.4 | Load testing for multi-tenant portal | 2 days |
| 5.5 | Documentation for gym admins (setup guide) | 2 days |
| 5.6 | Onboarding wizard for new portal setup | 3 days |
| 5.7 | Theme marketplace (preset themes) | 3 days |
| 5.8 | Analytics and conversion tracking | 2 days |

---

## 13. Subscription & Billing Model

### Portal as Add-On to Existing Plans

The member portal is an **add-on subscription** to the gym's existing Gym Unity Suite subscription:

```
Gym Unity Suite (Admin Platform)
├── Studio Tier:     $99/mo  - Core gym management
├── Boutique Tier:   $249/mo - Advanced features
└── Enterprise Tier: $499/mo - Full suite + multi-location

Member Portal (Add-On)
├── Starter:         +$49/mo  - Subdomain, basic branding, core features
├── Professional:    +$149/mo - Full branding, loyalty, referrals, analytics
└── Enterprise:      +$349/mo - Custom domain, API, custom pages, all features
```

### Billing Implementation

- Portal subscription managed through existing Stripe integration
- New Stripe Products/Prices for portal tiers
- Upgrade/downgrade handled via Stripe proration
- Feature flags stored in `portal_configurations.portal_tier`
- Edge functions check tier before serving premium features

### Usage-Based Considerations

| Metric | Starter | Professional | Enterprise |
|--------|---------|-------------|------------|
| Active Members | 500 | 2,000 | Unlimited |
| Monthly Page Views | 50,000 | 200,000 | Unlimited |
| File Storage (images) | 1 GB | 5 GB | 25 GB |
| API Calls | N/A | N/A | 100,000/mo |
| Custom Pages | N/A | N/A | 50 |

---

## 14. Technical Specifications

### Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| Portal Bundle Size | < 200KB (gzipped) |
| Theme Load Time | < 100ms (cached) |
| Lighthouse Score | > 90 |

### Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 90+ |
| Edge | 90+ |
| iOS Safari | 14+ |
| Chrome Android | 90+ |

### PWA Requirements

Each gym's portal operates as an independent PWA:

- **Dynamic Manifest:** Generated per-gym via edge function
- **Service Worker:** Shared SW with org-specific cache namespace
- **Offline Support:** Dashboard, check-in pass, last-synced class schedule
- **Push Notifications:** Per-gym notification channels
- **Install Prompt:** Branded with gym name and icon

### Caching Strategy

| Resource | Cache Duration | Strategy |
|----------|---------------|----------|
| Theme/Branding | 5 minutes | Stale-while-revalidate |
| Organization Data | 5 minutes | Stale-while-revalidate |
| Static Assets (JS/CSS) | 1 year | Immutable (hashed filenames) |
| Class Schedule | 1 minute | Network-first |
| Member Profile | Session | Cache-first |
| Check-In Pass | Persistent | Cache-first + background update |
| PWA Manifest | 1 hour | Network-first |

---

## 15. Risk Assessment & Mitigations

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Subdomain wildcard SSL issues** | High | Low | Cloudflare provides free wildcard SSL for `*.repclub.app` |
| **Theme CSS conflicts** | Medium | Medium | Namespace all portal CSS variables with `--portal-` prefix |
| **Bundle size bloat from shared components** | Medium | Medium | Tree-shaking, separate entry points, dynamic imports |
| **Cross-tenant data leakage** | Critical | Low | RLS policies, org validation in every query, automated testing |
| **Custom domain DNS propagation delays** | Low | High | Clear documentation, DNS checker tool, fallback subdomain |
| **Offline/PWA sync conflicts** | Medium | Medium | Conflict resolution strategy, last-write-wins with timestamps |
| **Custom CSS breaking portal layout** | Medium | Medium | Enterprise-only, CSS sandboxing, validation rules |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Low adoption of portal add-on** | High | Medium | Offer 30-day free trial, showcase demo portals |
| **Gyms wanting features we don't support** | Medium | High | Enterprise API access enables custom development |
| **Competitor launches similar feature** | Medium | Medium | First-mover advantage, deep integration with admin platform |
| **Support burden from custom domains** | Medium | High | Self-service DNS tools, detailed guides, automated verification |

### Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Portal outage affects all gyms** | Critical | Low | Multi-region deployment, health monitoring, auto-failover |
| **Theme misconfiguration makes portal unusable** | Medium | Medium | Live preview before publish, reset to default button |
| **Malicious custom CSS (Enterprise)** | Medium | Low | CSS sanitization, content security policy, restricted properties |

---

## Appendix A: File Structure (Final State)

```
src/
├── portal/                              # NEW - Member portal app
│   ├── main.tsx                        # Portal entry point
│   ├── App.tsx                         # Portal router
│   ├── PortalShell.tsx                 # Main layout wrapper
│   ├── PortalThemeProvider.tsx         # Dynamic theme engine
│   ├── PortalAuthProvider.tsx          # Member-only auth
│   ├── hooks/
│   │   ├── usePortalTheme.ts          # Theme management hook
│   │   ├── usePortalConfig.ts         # Feature flag/config hook
│   │   └── usePortalAuth.ts           # Portal auth hook
│   ├── pages/
│   │   ├── PortalDashboard.tsx        # Member dashboard
│   │   ├── PortalClasses.tsx          # Class browsing/booking
│   │   ├── PortalCheckIn.tsx          # Check-in pass
│   │   ├── PortalProfile.tsx          # Profile management
│   │   ├── PortalLoyalty.tsx          # Loyalty points (Pro+)
│   │   ├── PortalReferrals.tsx        # Referral program (Pro+)
│   │   ├── PortalBilling.tsx          # Billing management
│   │   ├── PortalHistory.tsx          # Workout history (Pro+)
│   │   ├── PortalNotifications.tsx    # Notification center
│   │   ├── PortalPlans.tsx            # Membership plans
│   │   ├── PortalLogin.tsx            # Branded login
│   │   ├── PortalSignup.tsx           # Branded registration
│   │   └── PortalCustomPage.tsx       # CMS pages (Enterprise)
│   └── components/
│       ├── PortalHeader.tsx           # Branded header
│       ├── PortalSidebar.tsx          # Desktop navigation
│       ├── PortalBottomNav.tsx        # Mobile bottom nav
│       ├── PortalFooter.tsx           # Footer with powered-by
│       ├── PoweredByBadge.tsx         # "Powered by Rep Club"
│       ├── LoyaltyDashboard.tsx       # Points/rewards view
│       ├── ReferralWidget.tsx         # Referral share widget
│       ├── ThemePreview.tsx           # Live theme preview
│       └── PortalFeatureGate.tsx      # Tier-based feature gating
│
├── components/                         # EXISTING - Shared components
│   ├── ui/                            # shadcn-ui (shared)
│   ├── members/                       # Member components (shared)
│   ├── membership/                    # Membership components (shared)
│   ├── checkin/                       # Check-in components (shared)
│   ├── mobile/                        # Mobile components (shared)
│   ├── marketing/                     # Loyalty/referral (shared)
│   └── admin/
│       └── portal/                    # NEW - Admin portal management
│           ├── PortalSetupWizard.tsx  # Enable & configure portal
│           ├── PortalThemeEditor.tsx  # Visual theme editor
│           ├── PortalPreview.tsx      # Preview portal as member
│           ├── PortalAnalytics.tsx    # Portal usage stats
│           └── PortalDomainSetup.tsx  # Subdomain/domain config
│
├── admin/                             # REFACTORED - Admin app entry
│   ├── main.tsx
│   └── App.tsx
│
├── contexts/                          # Shared contexts
├── hooks/                             # Shared hooks
├── lib/                               # Shared utilities
└── integrations/                      # Shared integrations

portal.html                            # NEW - Portal HTML entry
index.html                             # EXISTING - Admin HTML entry

supabase/
├── functions/
│   ├── get-org-by-slug/              # NEW
│   ├── get-portal-theme/             # NEW
│   ├── portal-register/             # NEW
│   ├── generate-portal-manifest/    # NEW
│   └── portal-api/                  # NEW (Enterprise)
└── migrations/
    ├── XXXXXX_add_portal_themes.sql        # NEW
    ├── XXXXXX_add_portal_configurations.sql # NEW
    └── XXXXXX_add_portal_custom_pages.sql  # NEW

workers/
└── custom-domain-router/
    └── index.ts                       # ENHANCED - subdomain + portal routing
```

---

## Appendix B: Admin Portal Management UI

The gym admin configures their member portal through a new section in the admin panel:

### Portal Setup Flow

```
Step 1: Enable Portal
  → Toggle portal on/off
  → Choose tier (Starter/Professional/Enterprise)

Step 2: Choose Domain
  → Enter desired subdomain: [________].repclub.app
  → Availability check (real-time)
  → Enterprise: Configure custom domain

Step 3: Brand Your Portal
  → Upload logo (light + dark variants)
  → Choose preset theme or custom colors
  → Set fonts (Google Fonts picker)
  → Configure button/card styles
  → Live preview panel shows changes in real-time

Step 4: Configure Features
  → Toggle features on/off per tier limits
  → Set registration preferences
  → Customize welcome message
  → Configure notification defaults

Step 5: Launch
  → Review summary
  → Publish portal
  → Share link with members
```

---

## Appendix C: Migration Path for Existing Member Pages

Current member pages (`/member/*` routes) in the admin app will continue to work for backward compatibility. The portal is a separate deployment that serves the same functionality under the gym's brand.

**Transition Plan:**
1. Phase 1-2: Portal runs alongside existing member pages
2. Phase 3: Admin member pages show banner: "Your members now have their own portal at [link]"
3. Phase 4: Admin member pages redirect to portal setup if not configured
4. Phase 5: Deprecate admin-embedded member pages (optional, gym decides)

---

## Appendix D: Competitive Analysis

| Feature | Rep Club Portal | Mindbody | Glofox | Wodify |
|---------|----------------|----------|--------|--------|
| Custom subdomain | Yes (all tiers) | No | No | No |
| Custom domain | Yes (enterprise) | No | Yes ($) | No |
| Full white-label | Yes (enterprise) | No | Partial | No |
| Custom colors | Yes (all tiers) | Limited | Limited | Limited |
| Custom fonts | Yes (pro+) | No | No | No |
| PWA support | Yes (all tiers) | App only | App only | App only |
| Offline mode | Yes | No | No | No |
| Custom CSS | Yes (enterprise) | No | No | No |
| API access | Yes (enterprise) | Yes ($$$) | Limited | Limited |
| Loyalty program | Yes (pro+) | Add-on | No | No |
| Referral program | Yes (pro+) | No | No | No |

**Key Differentiator:** Rep Club offers the deepest white-label customization at the most accessible price point, with PWA/offline support that native-app-only competitors can't match for cost-effective deployment.

---

**End of Document**
