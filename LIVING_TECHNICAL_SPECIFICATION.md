# Living Technical Specification: Gym Unity Suite

**Document Version:** 1.0
**Last Updated:** November 14, 2025
**Status:** Active Development
**Repository:** gym-unity-suite

---

## Executive Summary

**Gym Unity Suite** is a comprehensive, enterprise-ready B2B SaaS platform for gym and fitness studio management. Built with modern web technologies (React, TypeScript, Supabase, Cloudflare), it provides end-to-end business management including member management, class scheduling, CRM/sales, billing automation, analytics, and specialized services for pools, spas, childcare, and more.

**Key Differentiators:**
- Multi-tenant architecture with organization-level isolation
- Enterprise custom domain support for white-label experiences
- 20+ integrated business modules (CRM, scheduling, billing, analytics, specialized services)
- Mobile-first PWA design with offline capability
- Comprehensive role-based access control (5 user roles, 30+ permissions)
- Real-time collaboration via Supabase subscriptions
- AI-powered features for content generation and predictive analytics

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Core Features](#8-core-features)
9. [Specialized Modules](#9-specialized-modules)
10. [Enterprise Features](#10-enterprise-features)
11. [API & Integration Layer](#11-api--integration-layer)
12. [Security Architecture](#12-security-architecture)
13. [Performance & Optimization](#13-performance--optimization)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Development Workflow](#15-development-workflow)
16. [Testing Strategy](#16-testing-strategy)
17. [Monitoring & Observability](#17-monitoring--observability)
18. [Roadmap & Future Development](#18-roadmap--future-development)
19. [Growth Opportunities](#19-growth-opportunities)
20. [Appendices](#20-appendices)

---

## 1. Project Overview

### 1.1 Project Identity

**Name:** Gym Unity Suite (formerly Rep Club)
**Type:** Enterprise Gym Management Platform (B2B SaaS)
**Target Market:** Fitness studios, gyms, boutique fitness centers, wellness centers
**Business Model:** Tiered SaaS subscriptions (Studio, Boutique, Enterprise)

### 1.2 Mission

Provide an all-in-one, comprehensive gym management solution that eliminates the need for multiple disconnected tools, enabling fitness businesses to manage members, classes, sales, billing, and operations from a single unified platform.

### 1.3 Current Status

- **Development Stage:** Active Development (Beta/Production Ready)
- **Core Features:** 85% complete
- **Enterprise Features:** 60% complete
- **Advanced Analytics:** 75% complete
- **Mobile Experience:** 50% complete (PWA functional)

### 1.4 Key Metrics

- **Total Codebase:** 150,000+ lines of code
- **Component Files:** 229 React components
- **Page Routes:** 64+ distinct pages
- **Database Tables:** 243 tables
- **Edge Functions:** 9 serverless functions
- **Dependencies:** 100+ npm packages
- **Feature Modules:** 20+ business domains

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool with SWC compiler |
| Tailwind CSS | 3.4.17 | Styling framework |
| shadcn-ui | Latest | UI component library (40+ components) |
| Radix UI | 1.x | Headless UI primitives |
| TanStack Query | 5.83.0 | Server state management |
| React Router | 6.30.1 | Client-side routing |
| React Hook Form | 7.61.1 | Form handling |
| Zod | 3.25.76 | Schema validation |
| Recharts | 2.15.4 | Data visualization |
| React Big Calendar | 1.19.4 | Calendar UI |
| Lucide React | 0.462.0 | Icon system |
| date-fns | 3.6.0 | Date manipulation |
| Sonner | 1.7.4 | Toast notifications |
| QRCode | 1.5.4 | QR code generation |
| React Helmet Async | 2.0.5 | SEO meta tags |

### 2.2 Backend Stack

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL | Primary database |
| Deno | Edge functions runtime |
| Stripe | Payment processing |
| Cloudflare Pages | Frontend hosting |
| Cloudflare Workers | Custom domain routing |
| Cloudflare CDN | Global content delivery |

### 2.3 Third-Party Services

- **Authentication:** Supabase Auth (Email/Password, OAuth ready)
- **Payments:** Stripe (Subscriptions, one-time payments)
- **Hosting:** Cloudflare Pages
- **DNS & SSL:** Cloudflare
- **Analytics:** Google Analytics (GA-4)
- **AI Services:** OpenAI/Claude API (optional)
- **Email:** SendGrid/Mailgun ready
- **SMS:** Twilio ready

### 2.4 Development Tools

- **Package Manager:** npm
- **Linting:** ESLint 9.32.0
- **Version Control:** Git + GitHub
- **Code Quality:** TypeScript strict mode (relaxed for MVP)
- **PWA:** Service Worker for offline support

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Desktop   │  │   Tablet   │  │   Mobile   │            │
│  │  Browser   │  │  Browser   │  │    PWA     │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
└────────┼────────────────┼────────────────┼──────────────────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │    CLOUDFLARE CDN & WORKERS     │
         │  - Pages Hosting                │
         │  - Custom Domain Router         │
         │  - SSL/TLS Termination          │
         │  - DDoS Protection              │
         └────────────┬────────────────────┘
                      │
         ┌────────────▼────────────────┐
         │    REACT APPLICATION        │
         │  - SPA with React Router    │
         │  - Component-based UI       │
         │  - TanStack Query Cache     │
         │  - Context Providers        │
         └────────┬────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐         ┌────────▼──────┐
│  SUPABASE  │         │    STRIPE     │
│  BACKEND   │         │   PAYMENTS    │
│            │         │               │
│ - Auth     │         │ - Checkout    │
│ - Database │         │ - Portal      │
│ - Storage  │         │ - Webhooks    │
│ - Realtime │         │ - Invoices    │
│ - Edge Fns │         │               │
└────────────┘         └───────────────┘
```

### 3.2 Application Layers

1. **Presentation Layer** - React components, routing, UI state
2. **State Management Layer** - TanStack Query, React Context
3. **API Layer** - Supabase client, Edge functions
4. **Data Layer** - PostgreSQL with Row-Level Security
5. **Integration Layer** - Stripe, AI services, third-party webhooks

### 3.3 Multi-Tenant Architecture

```
Organization (Tenant)
  ├── Locations (1 to many)
  │     ├── Staff Members
  │     ├── Regular Members
  │     ├── Classes
  │     ├── Equipment
  │     └── Check-ins
  ├── Subscription Tier (Studio/Boutique/Enterprise)
  ├── Custom Domain (Enterprise only)
  └── Branding (Logo, Colors)
```

**Data Isolation:**
- Row-Level Security (RLS) at PostgreSQL level
- All queries automatically filtered by organization_id
- No cross-tenant data leakage possible
- Client-side permission enforcement for UI

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
src/
├── pages/                      # 64 route components
│   ├── Dashboard.tsx
│   ├── MembersPage.tsx
│   ├── ClassesPage.tsx
│   ├── CheckInsPage.tsx
│   ├── CRMPage.tsx
│   ├── BillingPage.tsx
│   ├── ReportsPage.tsx
│   ├── MemberDashboard.tsx
│   ├── admin/                  # Admin-specific pages
│   ├── blog/                   # Blog & marketing pages
│   └── features/               # Feature showcase pages
│
├── components/                 # 229 components
│   ├── ui/                     # 40+ shadcn-ui base components
│   ├── layout/                 # Layouts & navigation
│   │   ├── DashboardLayout.tsx
│   │   ├── MemberLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   └── Footer.tsx
│   ├── crm/                    # CRM features (23 files)
│   ├── analytics/              # Analytics (18 files)
│   ├── members/                # Member management (9 files)
│   ├── classes/                # Class scheduling
│   ├── mobile/                 # Mobile app components
│   ├── billing/                # Payment components
│   ├── equipment/              # Equipment tracking
│   ├── incidents/              # Safety incidents
│   ├── lockers/                # Locker management
│   ├── pools/                  # Pool management
│   ├── spa/                    # Spa services
│   ├── childcare/              # Childcare
│   └── [15+ more modules]
│
├── contexts/                   # React Context providers
│   ├── AuthContext.tsx
│   └── CustomDomainContext.tsx
│
├── hooks/                      # Custom hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useSubscription.ts
│   └── useCustomDomain.ts
│
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase initialization
│       └── types.ts            # Generated DB types
│
├── lib/                        # Utilities
│   ├── ai/                     # AI integration
│   └── utils.ts
│
├── App.tsx                     # Root component
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

### 4.2 Component Architecture

**Layout Hierarchy:**
```
App.tsx
  ├── AuthProvider (Context)
  ├── CustomDomainProvider (Context)
  ├── QueryClientProvider (TanStack Query)
  ├── HelmetProvider (SEO)
  └── Router
        ├── DashboardLayout (Staff/Admin)
        │     ├── AppSidebar (Navigation)
        │     ├── Header
        │     └── Main Content (Pages)
        ├── MemberLayout (Member Portal)
        │     └── Member Pages
        └── Public Routes (Marketing, Auth)
```

**Component Patterns:**
- Functional components with hooks
- Composition over inheritance
- Compound components (Dialog, Dropdown, etc.)
- Render props for flexibility
- Higher-order components for protection (ProtectedRoute)

### 4.3 State Management Strategy

**React Context:**
- `AuthContext` - User session, profile, organization
- `CustomDomainContext` - Domain detection, branding

**TanStack Query:**
- Server state caching
- Automatic refetching
- Optimistic updates
- Pagination support
- Real-time synchronization

**Local State:**
- `useState` for component-level state
- `useReducer` for complex state logic
- Form state via React Hook Form

### 4.4 Routing Architecture

```typescript
// Public Routes
/                          → Landing page
/login                     → Authentication
/signup                    → Registration
/pricing                   → Pricing tiers
/features/*                → Feature pages
/blog/*                    → Blog posts
/compare/*                 → Competitor comparisons

// Staff Dashboard (Protected)
/dashboard                 → Overview
/members                   → Member management
/classes                   → Class scheduling
/check-ins                 → Check-in tracking
/crm                       → Sales CRM
/leads                     → Lead pipeline
/billing                   → Billing & payments
/reports                   → Analytics
/admin/*                   → Admin settings

// Member Portal (Protected)
/member/dashboard          → Member overview
/member/profile            → Profile management
/member/classes            → Class booking
/member/billing            → Payment history

// Mobile App
/mobile/check-in           → Mobile check-in interface
```

### 4.5 UI Component Library

**shadcn-ui Components (40+):**
- Accordion, Alert, Avatar, Badge, Button
- Calendar, Card, Checkbox, Collapsible, Command
- Dialog, Dropdown, Form, Input, Label
- Navigation Menu, Popover, Progress, Radio
- Select, Separator, Sheet, Sidebar, Skeleton
- Slider, Switch, Table, Tabs, Textarea, Toast
- Tooltip, And more...

**Custom Components:**
- MemberCardDisplay (Barcode/QR display)
- LeadPipeline (Kanban-style CRM)
- AdvancedAnalyticsDashboard
- ClassCalendar
- CheckInKiosk
- PaymentForm

---

## 5. Backend Architecture

### 5.1 Supabase Backend Structure

```
Supabase Project
├── Authentication
│   ├── Email/Password
│   ├── OAuth Providers (ready)
│   ├── JWT Token Management
│   └── Session Handling
│
├── Database (PostgreSQL)
│   ├── 243 Tables (from 93 migrations)
│   ├── Row-Level Security (RLS) Policies
│   ├── Foreign Key Constraints
│   ├── Indexes for Performance
│   └── Triggers & Functions
│
├── Storage
│   ├── Member Documents
│   ├── Organization Logos
│   ├── Profile Pictures
│   └── Class Images
│
├── Edge Functions (9 functions)
│   ├── setup-new-user
│   ├── create-checkout
│   ├── create-one-time-payment
│   ├── check-subscription
│   ├── customer-portal
│   ├── verify-custom-domain
│   ├── get-org-by-domain
│   ├── ai-generate
│   └── verify-payment
│
└── Realtime
    ├── Database Change Subscriptions
    ├── Presence Tracking
    └── Broadcast Channels
```

### 5.2 Edge Functions Details

#### setup-new-user
```typescript
Purpose: Initialize new user profile on signup
Trigger: Auth signup webhook
Actions:
  - Create profile record
  - Assign default role
  - Create or join organization
  - Send welcome email
```

#### create-checkout
```typescript
Purpose: Create Stripe checkout session
Input: plan_id, user_id, organization_id
Output: Stripe checkout URL
Actions:
  - Validate plan exists
  - Create/retrieve Stripe customer
  - Generate checkout session
  - Store session in database
```

#### verify-custom-domain
```typescript
Purpose: Verify DNS records for custom domains
Input: domain, organization_id
Actions:
  - Check TXT record for verification token
  - Check CNAME record points to Cloudflare
  - Update domain verification status
  - Trigger SSL provisioning
```

#### ai-generate
```typescript
Purpose: Generate content using AI
Input: prompt, content_type
Output: Generated text
Uses: OpenAI/Claude API
Examples:
  - Email templates
  - Marketing copy
  - Announcement text
```

### 5.3 Database Migration Strategy

**Migration Pattern:**
```sql
-- 20250826000000_initial_schema.sql
CREATE TABLE organizations (...);
CREATE TABLE profiles (...);
CREATE POLICY "org_isolation" ON organizations ...;

-- 20250827000000_add_crm.sql
CREATE TABLE leads (...);
CREATE TABLE lead_sources (...);

-- 20251111000000_custom_domains.sql
ALTER TABLE organizations ADD COLUMN custom_domain TEXT UNIQUE;
CREATE INDEX idx_orgs_custom_domain ON organizations(custom_domain);
```

**Version Control:**
- All migrations in `supabase/migrations/`
- Timestamped filenames for ordering
- Idempotent operations (IF NOT EXISTS)
- Rollback scripts for critical changes

---

## 6. Database Schema

### 6.1 Core Tables

#### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  subscription_tier TEXT CHECK (subscription_tier IN ('studio', 'boutique', 'enterprise')),
  custom_domain TEXT UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  domain_ssl_enabled BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('owner', 'manager', 'staff', 'trainer', 'member')),
  avatar_url TEXT,
  barcode TEXT UNIQUE,
  date_of_birth DATE,
  address JSONB,
  emergency_contact JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### memberships
```sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id),
  status TEXT CHECK (status IN ('active', 'inactive', 'frozen', 'cancelled', 'past_due')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### classes
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  location_id UUID REFERENCES locations(id),
  category_id UUID REFERENCES class_categories(id),
  instructor_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  max_capacity INTEGER,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  source_id UUID REFERENCES lead_sources(id),
  lead_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lead_score INTEGER DEFAULT 0,
  qualification_status TEXT CHECK (qualification_status IN ('cold', 'warm', 'hot', 'qualified')),
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Row-Level Security (RLS) Policies

**Organization Isolation:**
```sql
-- Users can only view their own organization
CREATE POLICY "org_isolation_select"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Members see only their own data
CREATE POLICY "members_own_data"
  ON memberships FOR SELECT
  USING (
    member_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
      AND organization_id = memberships.organization_id
    )
  );
```

**Location-Based Access:**
```sql
CREATE POLICY "location_access"
  ON classes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      location_id IN (
        SELECT location_id FROM profiles WHERE id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('owner', 'manager')
      )
    )
  );
```

### 6.3 Database Relationships

```
organizations (1) ──→ (many) locations
organizations (1) ──→ (many) profiles
organizations (1) ──→ (many) membership_plans
organizations (1) ──→ (many) classes
organizations (1) ──→ (many) leads

profiles (1) ──→ (many) memberships (as member)
profiles (1) ──→ (many) classes (as instructor)
profiles (1) ──→ (many) leads (as assigned_to)
profiles (1) ──→ (many) check_ins

classes (1) ──→ (many) class_bookings
membership_plans (1) ──→ (many) memberships
```

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow

**Signup Process:**
```
1. User submits email/password → Supabase Auth
2. Email confirmation sent
3. User confirms email
4. setup-new-user edge function triggered
5. Profile created in profiles table
6. Default role assigned (member/staff based on context)
7. Organization created or user added to existing org
8. Redirect to dashboard
```

**Login Process:**
```
1. User submits credentials → Supabase Auth
2. JWT token generated and returned
3. Token stored in localStorage
4. Profile data fetched from profiles table
5. Organization data loaded
6. Permissions calculated
7. User redirected to appropriate dashboard
```

**Session Management:**
- JWT tokens auto-refresh on expiration
- Sessions persist across page reloads
- Logout clears tokens and cache
- Inactive sessions expire after 7 days

### 7.2 Role-Based Access Control (RBAC)

**Roles:**
1. **Owner** - Full system access, can edit organization, manage billing
2. **Manager** - Manage staff/members, view reports, access billing
3. **Staff** - Daily operations, check-ins, class management
4. **Trainer** - Instruct classes, manage personal training
5. **Member** - Self-service portal, book classes, view profile

**Permission Matrix:**

| Permission | Owner | Manager | Staff | Trainer | Member |
|------------|-------|---------|-------|---------|--------|
| VIEW_DASHBOARD | ✓ | ✓ | ✓ | ✓ | ✓ |
| VIEW_MEMBERS | ✓ | ✓ | ✓ | ✗ | ✗ |
| MANAGE_MEMBERS | ✓ | ✓ | ✗ | ✗ | ✗ |
| VIEW_CRM | ✓ | ✓ | ✓ | ✗ | ✗ |
| MANAGE_LEADS | ✓ | ✓ | ✓ | ✗ | ✗ |
| VIEW_BILLING | ✓ | ✓ | ✗ | ✗ | ✗ |
| MANAGE_BILLING | ✓ | ✗ | ✗ | ✗ | ✗ |
| VIEW_REPORTS | ✓ | ✓ | ✗ | ✗ | ✗ |
| MANAGE_STAFF | ✓ | ✓ | ✗ | ✗ | ✗ |
| EDIT_ORGANIZATION | ✓ | ✗ | ✗ | ✗ | ✗ |
| MANAGE_CLASSES | ✓ | ✓ | ✓ | ✓ | ✗ |
| CHECK_IN_MEMBERS | ✓ | ✓ | ✓ | ✗ | ✗ |

### 7.3 Protected Routes

```typescript
// High-level protection
<ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
  <MembersPage />
</ProtectedRoute>

// Role-based protection
<ProtectedRoute roles={['owner', 'manager']}>
  <BillingPage />
</ProtectedRoute>

// Component-level protection
{hasPermission(PERMISSIONS.MANAGE_LEADS) && (
  <Button onClick={createLead}>Create Lead</Button>
)}
```

---

## 8. Core Features

### 8.1 Member Management

**Capabilities:**
- Complete member profiles (personal info, emergency contacts)
- Family relationship tracking (primary/secondary members)
- Digital member cards (barcode + QR code)
- Photo uploads for member IDs
- Member document storage (waivers, agreements)
- Activity history tracking
- Membership status management
- Guest check-in system
- Member notes and tags
- Bulk import/export

**Key Components:**
- `MemberDetailDialog.tsx` - Full member profile view
- `MemberCardDisplay.tsx` - Digital member card with barcode
- `GuestCheckInDialog.tsx` - Guest check-in workflow
- `FitnessAssessmentDisplay.tsx` - Fitness assessments
- `ProfileEditForm.tsx` - Member profile editing

**Database Tables:**
- `profiles` - Core member data
- `memberships` - Active subscriptions
- `member_documents` - Stored documents
- `member_milestones` - Achievements
- `member_family_relationships` - Family links

### 8.2 Class Scheduling & Management

**Capabilities:**
- Full calendar view (week/month/day)
- Drag-and-drop class scheduling
- Recurring class templates
- Class categories and types
- Instructor assignment
- Capacity management with waitlists
- Member booking system
- Drop-in class support
- Class cancellation handling
- Attendance tracking
- Class history and analytics

**Key Components:**
- `ClassCalendar.tsx` - Main calendar interface
- `ClassBookingDialog.tsx` - Member booking
- `ClassAttendanceTracker.tsx` - Attendance management
- `RecurringClassManager.tsx` - Recurring class setup

**Database Tables:**
- `classes` - Class schedules
- `class_categories` - Class types
- `class_bookings` - Member bookings
- `class_waitlists` - Waitlist management

### 8.3 Check-In & Attendance System

**Capabilities:**
- Multiple check-in methods:
  - QR code scan (mobile app)
  - Barcode scan (physical cards)
  - Manual search & check-in
  - Facial recognition ready
- Real-time capacity monitoring
- Check-in history tracking
- Daily visit logs
- Guest check-in workflow
- Tablet kiosk mode
- Check-out tracking (for facilities with exit requirements)

**Key Components:**
- `CheckInKiosk.tsx` - Kiosk interface
- `MobileCheckInPage.tsx` - Mobile check-in
- `CheckInHistory.tsx` - Historical logs

**Database Tables:**
- `check_ins` - Visit tracking
- `guest_check_ins` - Guest visits

### 8.4 CRM & Sales Pipeline

**Capabilities:**

**Lead Management:**
- Lead capture forms (web, walk-in, phone)
- Lead source tracking (Google Ads, Facebook, Referral, Walk-in)
- Automated lead scoring system
- Lead qualification workflows
- Activity logging (calls, emails, meetings)
- Follow-up task management
- Lead assignment to sales reps

**Sales Tools:**
- Sales pipeline visualization (Kanban)
- Quote/proposal generation
- Facility tour scheduling
- Trial membership creation
- Lead-to-member conversion workflow
- Commission tracking
- Referral program management
- Lead attribution analytics

**Analytics:**
- Sales funnel metrics
- Conversion rate tracking
- Sales rep performance
- Lead source ROI
- Pipeline velocity
- Win/loss analysis

**Key Components (23 files):**
- `LeadForm.tsx` - Lead capture
- `LeadScoringManager.tsx` - Scoring rules
- `PipelineView.tsx` - Kanban pipeline
- `SalesQuotesManager.tsx` - Quote generation
- `ToursSchedulingManager.tsx` - Tour booking
- `CommissionTrackingManager.tsx` - Sales commissions
- `SalesFunnelAnalytics.tsx` - Funnel visualization
- `LeadAttributionManager.tsx` - Source attribution

**Database Tables:**
- `leads` - Lead records
- `lead_sources` - Source tracking
- `lead_scoring_rules` - Automated scoring
- `lead_activities` - Activity log
- `sales_quotes` - Quotes/proposals
- `facility_tours` - Tour scheduling
- `referrals` - Referral tracking

### 8.5 Billing & Payments

**Capabilities:**
- Stripe integration for payments
- Recurring subscription billing
- Multiple billing intervals (weekly, monthly, yearly)
- One-time payments for add-ons
- Failed payment handling with retry logic
- Refund processing
- Invoice generation and history
- Payment method management
- Automated billing reminders
- Proration for plan changes
- Custom payment plans

**Key Components:**
- `PaymentForm.tsx` - Payment collection
- `BillingHistory.tsx` - Payment history
- `SubscriptionManager.tsx` - Plan management
- `InvoiceDisplay.tsx` - Invoice view

**Database Tables:**
- `payments` - Payment records
- `invoices` - Invoice history
- `payment_methods` - Stored payment methods

**Edge Functions:**
- `create-checkout` - Checkout session
- `create-one-time-payment` - One-off payments
- `customer-portal` - Stripe portal access
- `verify-payment` - Webhook handling

### 8.6 Reporting & Analytics

**Capabilities:**

**Executive Dashboard:**
- Real-time member count
- Revenue metrics (MRR, ARR)
- Growth trends
- Daily check-ins
- Class utilization
- Lead pipeline status
- Top KPIs at a glance

**Advanced Analytics:**
- Member lifetime value (LTV)
- Churn rate and prediction
- Revenue forecasting
- Member engagement scoring
- Capacity utilization analysis
- Class popularity metrics
- Staff performance tracking
- Department P&L analysis

**Report Types:**
- Member reports (growth, retention, churn)
- Revenue reports (MRR, ARR, projections)
- Class reports (attendance, popularity)
- Sales reports (lead conversion, pipeline)
- Custom date range filtering
- Export to CSV/PDF

**Key Components (18 files):**
- `AdvancedAnalyticsDashboard.tsx` - Main analytics hub
- `RevenueAnalytics.tsx` - Revenue metrics
- `MemberAnalytics.tsx` - Member behavior
- `ClassAnalytics.tsx` - Class performance
- `PredictiveAnalytics.tsx` - Forecasting
- `DepartmentPLManager.tsx` - P&L tracking
- `MarketingAnalytics.tsx` - Marketing ROI

**Database Tables:**
- `analytics_snapshots` - Daily metrics
- `revenue_forecasts` - Predictions
- `member_engagement_scores` - Engagement tracking

---

## 9. Specialized Modules

### 9.1 Equipment Management

**Capabilities:**
- Equipment inventory tracking
- Maintenance scheduling
- Repair logs
- Equipment reservation system
- Usage tracking
- Depreciation tracking
- QR code labeling

**Components:** `EquipmentInventory.tsx`, `MaintenanceScheduler.tsx`
**Tables:** `equipment`, `equipment_maintenance`, `equipment_reservations`

### 9.2 Incident Reporting & Safety

**Capabilities:**
- Incident logging (injuries, accidents)
- Witness statements
- Photo documentation
- Follow-up action tracking
- Incident analytics
- Compliance reporting

**Components:** `IncidentReportForm.tsx`, `IncidentLog.tsx`
**Tables:** `incidents`, `incident_witnesses`

### 9.3 Locker Management

**Capabilities:**
- Locker assignment tracking
- Availability status
- Rental management
- Lock combination storage
- Cleaning schedules
- Revenue tracking

**Components:** `LockerGrid.tsx`, `LockerAssignment.tsx`
**Tables:** `lockers`, `locker_rentals`

### 9.4 Court/Sports Facility Booking

**Capabilities:**
- Court scheduling (tennis, pickleball, basketball)
- Hourly slot booking
- Recurring reservations
- Court availability calendar
- Equipment rental tracking
- Revenue reporting

**Components:** `CourtBookingCalendar.tsx`, `CourtReservation.tsx`
**Tables:** `courts`, `court_bookings`

### 9.5 Pool Management

**Capabilities:**
- Lane assignment
- Swim class scheduling
- Lap swim vs. open swim tracking
- Pool capacity monitoring
- Chemical/maintenance logs
- Temperature tracking

**Components:** `PoolSchedule.tsx`, `PoolMaintenance.tsx`
**Tables:** `pools`, `pool_schedules`, `pool_maintenance`

### 9.6 Spa Services

**Capabilities:**
- Service catalog (massage, facials, etc.)
- Therapist scheduling
- Appointment booking
- Package management
- Gift certificate tracking
- Commission calculation

**Components:** `SpaBooking.tsx`, `SpaServices.tsx`
**Tables:** `spa_services`, `spa_appointments`, `spa_therapists`

### 9.7 Childcare Management

**Capabilities:**
- Child enrollment
- Check-in/check-out tracking
- Caregiver assignment
- Capacity monitoring
- Parent communication
- Emergency contact access
- Activity tracking

**Components:** `ChildcareCheckIn.tsx`, `ChildcareRoster.tsx`
**Tables:** `childcare_enrollments`, `childcare_check_ins`

### 9.8 Personal Training

**Capabilities:**
- Trainer scheduling
- Session booking
- Package management (5-pack, 10-pack)
- Workout plan creation
- Progress tracking
- Commission tracking

**Components:** `PTScheduler.tsx`, `WorkoutPlanner.tsx`
**Tables:** `training_sessions`, `training_packages`

### 9.9 Retail/POS

**Capabilities:**
- Product catalog
- Point-of-sale transactions
- Inventory management
- Towel service tracking
- Pro shop management
- Sales reporting

**Components:** `POSInterface.tsx`, `ProductCatalog.tsx`
**Tables:** `products`, `transactions`, `towel_rentals`

### 9.10 Staff Management

**Capabilities:**
- Staff profiles with certifications
- Shift scheduling
- Certification expiration tracking
- Background check status
- Payroll integration ready
- Performance reviews

**Components:** `StaffScheduler.tsx`, `CertificationTracker.tsx`
**Tables:** `staff_certifications`, `staff_schedules`

---

## 10. Enterprise Features

### 10.1 Custom Domain Support

**Overview:**
Enterprise-tier subscribers can use their own custom domains (e.g., `portal.yourgym.com`) instead of the default platform domain.

**Technical Implementation:**

**DNS Configuration:**
```
Type: CNAME
Name: portal (or subdomain of choice)
Value: gym-unity-suite.pages.dev
TTL: Auto

Type: TXT
Name: _gym-unity-verification
Value: [verification-token]
TTL: Auto
```

**Verification Process:**
1. Customer adds CNAME and TXT records
2. Customer triggers verification in admin panel
3. `verify-custom-domain` edge function checks DNS
4. Domain status updated in database
5. SSL certificate auto-provisioned by Cloudflare
6. Domain activated

**Cloudflare Worker Router:**
```typescript
// workers/custom-domain-router/index.js
export default {
  async fetch(request) {
    const hostname = new URL(request.url).hostname;

    // Lookup organization by domain
    const org = await getOrgByDomain(hostname);

    if (org) {
      // Apply custom branding
      return fetchWithBranding(request, org);
    }

    // Default behavior
    return fetch(request);
  }
}
```

**Branding Application:**
- Custom logo display
- Brand colors (primary/secondary)
- Custom favicon
- Organization name in titles
- Whitelabel experience

**Components:**
- `CustomDomainSetup.tsx` - Setup wizard
- `DNSInstructions.tsx` - DNS guide
- `DomainVerification.tsx` - Verification status

**Database:**
```sql
ALTER TABLE organizations ADD COLUMN custom_domain TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN custom_domain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN domain_verification_token TEXT;
ALTER TABLE organizations ADD COLUMN domain_ssl_enabled BOOLEAN DEFAULT FALSE;
```

### 10.2 Subscription Tiers

**Studio Plan ($97/month):**
- Up to 200 members
- 1 location
- Core features (members, classes, check-ins)
- Basic reporting
- Email support

**Boutique Plan ($197/month):**
- Up to 500 members
- Up to 3 locations
- All core features
- Advanced analytics
- CRM & sales pipeline
- Priority support

**Enterprise Plan ($497/month):**
- Unlimited members
- Unlimited locations
- All features
- Custom domain
- Custom branding
- AI-powered features
- Dedicated support
- API access (roadmap)

**Implementation:**
```typescript
// Subscription check
const { subscription_tier } = useAuth().organization;

if (subscription_tier === 'enterprise') {
  // Enable custom domain features
}

// Feature gating
<FeatureGate tier="boutique">
  <AdvancedAnalytics />
</FeatureGate>
```

### 10.3 Multi-Location Support

**Capabilities:**
- Organization owns multiple locations
- Location-specific staff assignments
- Location-based class scheduling
- Consolidated reporting across locations
- Location-level access control
- Member access to multiple locations (plan dependent)

**Data Model:**
```
Organization
  ├── Location A
  │     ├── Staff (assigned)
  │     ├── Classes
  │     ├── Equipment
  │     └── Check-ins
  ├── Location B
  │     └── [same structure]
  └── Location C
        └── [same structure]
```

**Components:**
- `LocationSelector.tsx` - Switch between locations
- `LocationManager.tsx` - Location settings
- `CrossLocationReports.tsx` - Consolidated analytics

---

## 11. API & Integration Layer

### 11.1 Supabase Client API

**Initialization:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Common Patterns:**
```typescript
// SELECT with RLS auto-filtering
const { data: members } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'member');

// INSERT with relationship
const { data: lead } = await supabase
  .from('leads')
  .insert({
    organization_id: orgId,
    lead_name: 'John Doe',
    email: 'john@example.com'
  })
  .select()
  .single();

// REAL-TIME subscription
const subscription = supabase
  .from('check_ins')
  .on('INSERT', payload => {
    console.log('New check-in:', payload.new);
  })
  .subscribe();

// STORAGE upload
const { data } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file);
```

### 11.2 Stripe Integration

**Checkout Flow:**
```typescript
// 1. Create checkout session (edge function)
const { data } = await supabase.functions.invoke('create-checkout', {
  body: { plan_id, organization_id }
});

// 2. Redirect to Stripe
window.location.href = data.checkout_url;

// 3. Webhook updates subscription status
// (handled server-side via verify-payment edge function)
```

**Customer Portal:**
```typescript
const { data } = await supabase.functions.invoke('customer-portal', {
  body: { organization_id }
});

window.location.href = data.portal_url;
```

### 11.3 Webhook Handlers

**Stripe Webhooks:**
```typescript
// Edge function: verify-payment
export default async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, signature, secret);

  switch (event.type) {
    case 'invoice.payment_succeeded':
      await activateSubscription(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await cancelMembership(event.data.object);
      break;
  }
};
```

### 11.4 Third-Party Integration Foundation

**Email Service (Ready):**
- SendGrid/Mailgun configuration ready
- Email templates prepared
- Trigger points identified (welcome, reminders, invoices)

**SMS Service (Ready):**
- Twilio integration foundation
- SMS templates for reminders
- Opt-in/opt-out management

**Calendar Sync (Roadmap):**
- Google Calendar integration
- Outlook/Exchange sync
- Two-way sync for class bookings

**Zapier/Make (Webhook Ready):**
- Webhook endpoints for major events
- Lead creation webhook
- Member signup webhook
- Class booking webhook

---

## 12. Security Architecture

### 12.1 Data Protection

**Encryption:**
- All traffic over HTTPS/TLS 1.3
- Database connections encrypted
- Passwords hashed with bcrypt (Supabase Auth)
- Sensitive data encrypted at rest

**Row-Level Security:**
- Every table has RLS policies
- Automatic org_id filtering
- Role-based data access
- No cross-tenant data leakage

**API Security:**
- JWT token authentication
- Public/anonymous key separation
- Service role key server-side only
- Rate limiting on endpoints

### 12.2 Authentication Security

**Password Policy:**
- Minimum 6 characters (configurable)
- Email confirmation required
- Password reset via secure token
- Session invalidation on password change

**Session Management:**
- JWT tokens with expiration
- Auto-refresh on token expiry
- Logout clears all tokens
- Inactive session timeout (7 days)

**OAuth (Ready):**
- Google OAuth provider configured
- GitHub OAuth ready
- Social login infrastructure

### 12.3 Access Control

**Permission Checks:**
```typescript
// Route-level protection
<ProtectedRoute permission={PERMISSIONS.VIEW_BILLING}>
  <BillingPage />
</ProtectedRoute>

// Component-level protection
{hasPermission(PERMISSIONS.MANAGE_STAFF) && (
  <EditStaffButton />
)}

// API-level protection (RLS)
-- Automatic org filtering in database queries
```

**Audit Trail:**
- User action logging
- Changes to critical records
- Login/logout tracking
- Failed authentication attempts

### 12.4 Compliance & Privacy

**GDPR Readiness:**
- Data export functionality
- Right to deletion (member removal)
- Consent tracking for communications
- Data retention policies

**PCI Compliance:**
- No credit card storage (Stripe handles)
- PCI-DSS Level 1 via Stripe
- Secure payment forms
- Webhook signature verification

**Data Backup:**
- Automatic daily backups (Supabase)
- Point-in-time recovery available
- Backup retention (30 days)

---

## 13. Performance & Optimization

### 13.1 Frontend Optimizations

**Code Splitting:**
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['@radix-ui/*'],
        'charts': ['recharts'],
        'analytics': ['src/components/analytics/'],
        'crm': ['src/components/crm/']
      }
    }
  }
}
```

**Lazy Loading:**
```typescript
const MembersPage = lazy(() => import('./pages/MembersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

<Suspense fallback={<Loading />}>
  <Route path="/members" element={<MembersPage />} />
</Suspense>
```

**Image Optimization:**
- WebP format for modern browsers
- Responsive image sizes
- Lazy loading below fold
- CDN delivery via Cloudflare

**CSS Optimization:**
- Tailwind CSS purging unused styles
- Critical CSS inline
- Non-critical CSS deferred
- Per-component CSS chunks

**Bundle Size:**
- Main bundle: ~150KB gzipped
- Vendor chunks: ~250KB gzipped
- Total initial load: ~400KB
- Route-specific chunks: 20-50KB each

### 13.2 Backend Optimizations

**Database:**
- Indexes on frequently queried columns
- Selective field queries (avoid SELECT *)
- Connection pooling (Supabase)
- Query optimization via EXPLAIN

**Caching:**
- TanStack Query caching (5 min default)
- Stale-while-revalidate strategy
- Edge function result caching
- CDN caching for static assets

**Real-time:**
- WebSocket connections for live data
- Subscription filtering to reduce payload
- Debounced updates for high-frequency changes

### 13.3 Performance Metrics

**Target Metrics:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms

**Lighthouse Scores (Target):**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

**Current Performance:**
- Desktop: 90+ performance score
- Mobile: 85+ performance score
- Bundle size optimized with code splitting
- CDN reduces latency globally

---

## 14. Deployment & Infrastructure

### 14.1 Hosting Architecture

```
┌────────────────────────────────────────┐
│         CLOUDFLARE EDGE                │
│  - Global CDN (200+ locations)         │
│  - DDoS Protection                     │
│  - WAF (Web Application Firewall)      │
│  - SSL/TLS Termination                 │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      CLOUDFLARE PAGES                  │
│  - Static Site Hosting                 │
│  - Automatic Builds on Git Push        │
│  - Preview Deployments                 │
│  - Custom Domain Support               │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      CLOUDFLARE WORKERS                │
│  - Custom Domain Router                │
│  - Organization Lookup                 │
│  - Branding Injection                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│         SUPABASE BACKEND               │
│  - PostgreSQL Database                 │
│  - Authentication Service              │
│  - Edge Functions (Deno)               │
│  - Real-time Subscriptions             │
│  - File Storage                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│         STRIPE SERVICES                │
│  - Payment Processing                  │
│  - Subscription Management             │
│  - Customer Portal                     │
│  - Webhook Delivery                    │
└────────────────────────────────────────┘
```

### 14.2 Deployment Pipeline

**Development:**
```bash
git checkout -b feature/new-feature
# Make changes
npm run dev  # Test locally on :8080
git commit -m "Add new feature"
git push origin feature/new-feature
# Create pull request
```

**Staging (Preview):**
- Cloudflare Pages auto-creates preview deployment
- URL: `https://abc123.gym-unity-suite.pages.dev`
- Full environment for testing
- Database points to staging Supabase

**Production:**
```bash
git checkout main
git merge feature/new-feature
git push origin main
# Cloudflare Pages auto-deploys to production
# URL: https://gym-unity-suite.pages.dev
```

**Rollback:**
- Cloudflare Pages keeps deployment history
- One-click rollback to previous version
- Database migrations require manual rollback

### 14.3 Environment Configuration

**Local Development (.env.local):**
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Production (.env.production):**
```bash
VITE_SUPABASE_URL=https://nerqstezuygviutluslt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (production)
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

**Edge Functions (.env):**
```bash
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 14.4 CI/CD Pipeline

**Automated Checks:**
- ESLint on every push
- TypeScript compilation check
- Build success verification
- No manual deployment steps

**Cloudflare Pages Integration:**
```yaml
# wrangler.toml
name = "gym-unity-suite"
pages_build_output_dir = "dist"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.preview]
vars = { ENVIRONMENT = "preview" }
```

---

## 15. Development Workflow

### 15.1 Getting Started

**Prerequisites:**
- Node.js 18+ (locked in .nvmrc)
- npm
- Git
- Supabase account
- Stripe account

**Setup:**
```bash
# Clone repository
git clone <repo-url>
cd gym-unity-suite

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe keys

# Start development server
npm run dev
# Open http://localhost:8080
```

**Database Setup:**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref <project-id>

# Run migrations
supabase db push
```

### 15.2 Development Commands

```bash
npm run dev         # Start dev server with hot reload
npm run build       # Production build
npm run preview     # Preview production build locally
npm run lint        # Run ESLint
npm run typecheck   # TypeScript type checking
```

### 15.3 Code Organization Standards

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `MemberCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `use*.ts` (e.g., `useAuth.ts`)
- Pages: `PascalCase.tsx` (e.g., `MembersPage.tsx`)

**Import Order:**
```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal utilities
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';

// 3. Components
import { Button } from '@/components/ui/button';
import { MemberCard } from '@/components/members/MemberCard';

// 4. Types
import type { Profile } from '@/types';
```

**Component Structure:**
```typescript
// 1. Imports
// 2. Type definitions
// 3. Component definition
// 4. Exports

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  // Hooks
  const { user } = useAuth();
  const { data } = useQuery(...);

  // Event handlers
  const handleClick = () => { ... };

  // Render
  return (...);
};
```

### 15.4 Git Workflow

**Branch Naming:**
```
feature/add-sms-integration
bugfix/fix-class-booking
hotfix/critical-payment-issue
refactor/optimize-queries
```

**Commit Messages:**
```
feat: Add SMS notification system
fix: Resolve class double-booking issue
refactor: Optimize member query performance
docs: Update API documentation
```

---

## 16. Testing Strategy

### 16.1 Current Testing Approach

**Manual Testing:**
- Feature testing in development
- User acceptance testing (UAT)
- Cross-browser testing
- Mobile responsive testing
- Payment flow testing in Stripe test mode

**Test Checklist (Manual):**
- [ ] User authentication flow
- [ ] Member CRUD operations
- [ ] Class booking workflow
- [ ] Check-in process
- [ ] Payment processing
- [ ] CRM lead creation
- [ ] Reporting accuracy
- [ ] Permission enforcement

### 16.2 Future Testing Strategy

**Unit Testing (Planned):**
```typescript
// Example with Vitest
import { render, screen } from '@testing-library/react';
import { MemberCard } from './MemberCard';

describe('MemberCard', () => {
  it('displays member name', () => {
    const member = { first_name: 'John', last_name: 'Doe' };
    render(<MemberCard member={member} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

**Integration Testing (Planned):**
- API endpoint testing
- Database query testing
- Authentication flow testing
- Payment integration testing

**E2E Testing (Planned):**
```typescript
// Example with Playwright
test('member can book a class', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'member@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.goto('/member/classes');
  await page.click('text=Book Class');
  await expect(page.locator('text=Booking Confirmed')).toBeVisible();
});
```

---

## 17. Monitoring & Observability

### 17.1 Application Monitoring

**Google Analytics:**
- Page view tracking
- User behavior flows
- Conversion tracking (signup, upgrade)
- Goal completion tracking

**Cloudflare Analytics:**
- Traffic volume
- Geographic distribution
- Threat detection
- Cache hit ratio

**Error Tracking (Recommended):**
- Sentry integration for frontend errors
- Error boundary components
- User context in error reports

### 17.2 Performance Monitoring

**Web Vitals:**
- Lighthouse CI integration
- Core Web Vitals tracking
- Performance budgets

**Real User Monitoring (RUM):**
- Actual user performance data
- Device/browser breakdowns
- Geographic latency

### 17.3 Backend Monitoring

**Supabase Dashboard:**
- Database performance metrics
- Query execution times
- Connection pool usage
- Storage usage

**Edge Function Logs:**
- Execution logs in Supabase
- Error rates
- Invocation counts
- Execution duration

**Stripe Dashboard:**
- Payment success rates
- Failed payment reasons
- Subscription metrics
- Churn tracking

### 17.4 Health Checks

**Uptime Monitoring:**
- Cloudflare health checks
- Supabase status page
- Stripe status page

**Alerting (Recommended):**
- Downtime alerts
- Error rate thresholds
- Failed payment notifications
- Domain verification failures

---

## 18. Roadmap & Future Development

### 18.1 Current Status Summary

**Phase 1: Foundation (COMPLETE ✓)**
- Multi-tenant architecture
- Authentication & RBAC
- Core member management
- Basic dashboard

**Phase 2: Core Features (85% COMPLETE)**
- Member management ✓
- Class scheduling ✓
- Check-in system ✓
- CRM & sales pipeline ✓
- Basic billing (in progress)
- Reporting & analytics ✓

**Phase 3: Specialized Services (60% COMPLETE)**
- Equipment tracking ✓
- Incident reporting ✓
- Locker management ✓
- Pool management ✓
- Spa services ✓
- Childcare ✓
- Court bookings (in progress)
- Personal training (in progress)

**Phase 4: Enterprise Features (60% COMPLETE)**
- Custom domains ✓
- Multi-location support ✓
- Advanced analytics (75%)
- AI features (foundation)
- API access (planned)

### 18.2 Near-Term Roadmap (Next 3-6 Months)

**Q1 2025:**
- [ ] Complete Stripe billing integration
- [ ] Automated recurring billing
- [ ] Failed payment retry logic
- [ ] Invoice generation
- [ ] Complete personal training module
- [ ] Complete court booking system

**Q2 2025:**
- [ ] Mobile app v2 (native iOS/Android)
- [ ] Push notifications
- [ ] Enhanced mobile check-in
- [ ] Offline mode improvements
- [ ] Advanced automation workflows
- [ ] Email marketing campaigns

### 18.3 Mid-Term Roadmap (6-12 Months)

**Advanced Features:**
- [ ] Predictive analytics engine
- [ ] Member churn prediction
- [ ] AI-powered lead scoring refinement
- [ ] Automated email sequences
- [ ] SMS campaigns
- [ ] Member app (white-label)

**Integrations:**
- [ ] Zapier official integration
- [ ] Mailchimp/Klaviyo integration
- [ ] QuickBooks accounting sync
- [ ] Mindbody migration tool
- [ ] Google Calendar two-way sync
- [ ] Apple Health / Google Fit integration

**API Ecosystem:**
- [ ] Public REST API
- [ ] API documentation
- [ ] Developer portal
- [ ] Webhook management UI
- [ ] API rate limiting
- [ ] OAuth for third-party apps

### 18.4 Long-Term Vision (12+ Months)

**Market Expansion:**
- [ ] International payment support
- [ ] Multi-currency billing
- [ ] Multi-language UI
- [ ] Regional compliance (GDPR, CCPA, etc.)
- [ ] International SMS/email providers

**White-Label Platform:**
- [ ] Fully white-labeled solution
- [ ] Partner program for resellers
- [ ] Agency tier for multi-client management
- [ ] Custom subdomain per client

**Advanced AI:**
- [ ] AI workout recommendations
- [ ] Predictive maintenance for equipment
- [ ] Chatbot for member support
- [ ] AI-generated marketing content
- [ ] Sentiment analysis on feedback

**Hardware Integration:**
- [ ] Access control system integration
- [ ] Biometric check-in (fingerprint, facial)
- [ ] IoT equipment sensors
- [ ] Smart locker systems
- [ ] Wearable device integration

---

## 19. Growth Opportunities

### 19.1 Feature Gaps & Expansion

**Identified Opportunities:**

1. **Marketing Automation**
   - Automated email campaigns
   - Drip sequences for leads
   - Re-engagement campaigns for inactive members
   - Birthday/milestone emails
   - Referral program automation

2. **Mobile App Enhancement**
   - Native iOS/Android apps
   - Apple Wallet / Google Pay integration
   - Push notifications for classes
   - In-app messaging
   - Workout tracking

3. **Community Features**
   - Member social feed
   - Achievement badges
   - Leaderboards
   - Member-to-member messaging
   - Group challenges

4. **Virtual Training**
   - Video streaming integration
   - On-demand workout library
   - Virtual class scheduling
   - Live streaming classes
   - Recorded session playback

5. **Nutrition & Wellness**
   - Meal planning integration
   - Nutrition tracking
   - Wellness assessments
   - Goal setting & tracking
   - Body composition analysis

6. **Financial Tools**
   - Revenue forecasting
   - Budget management
   - Payroll integration
   - Tax reporting
   - Financial dashboards

### 19.2 Market Opportunities

**Verticals to Target:**
- Yoga studios
- Pilates studios
- CrossFit boxes
- Boxing/MMA gyms
- Dance studios
- Climbing gyms
- Martial arts dojos
- Wellness centers
- Physical therapy clinics

**Geographic Expansion:**
- International markets (UK, AU, CA, EU)
- Localized pricing
- Regional payment processors
- Compliance with local regulations

**Partnership Opportunities:**
- Equipment manufacturers
- Supplement brands
- Insurance providers
- Payroll services
- Accounting software

### 19.3 Competitive Advantages

**Current Differentiators:**
1. All-in-one platform (no fragmentation)
2. Modern, intuitive UI
3. Competitive pricing
4. Enterprise features at boutique pricing
5. Comprehensive CRM built-in
6. Real-time data sync
7. Mobile-first design
8. Custom domain white-labeling

**Future Differentiators:**
1. AI-powered insights
2. Predictive analytics
3. Best-in-class mobile app
4. Extensive API ecosystem
5. Hardware integrations
6. Community features
7. Virtual training capabilities

### 19.4 Scaling Considerations

**Technical Scaling:**
- Database sharding for growth
- Read replicas for analytics
- Multi-region deployment
- Advanced caching strategies
- Microservices architecture (if needed)

**Business Scaling:**
- Customer success team
- Sales team expansion
- Partner/reseller program
- Enterprise sales motion
- Implementation services
- Training & certification program

---

## 20. Appendices

### 20.1 Glossary

**Terms:**
- **RLS:** Row-Level Security (database-level access control)
- **Edge Function:** Serverless function running on Cloudflare/Deno
- **Multi-tenant:** Architecture supporting multiple isolated customers
- **PWA:** Progressive Web App (installable, offline-capable)
- **MRR:** Monthly Recurring Revenue
- **ARR:** Annual Recurring Revenue
- **LTV:** Lifetime Value (of a member)
- **Churn:** Member cancellation rate

### 20.2 Key Files Reference

**Configuration:**
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling system
- `tsconfig.json` - TypeScript settings
- `components.json` - shadcn-ui configuration
- `wrangler.toml` - Cloudflare Pages settings
- `supabase/config.toml` - Supabase CLI config

**Core Application:**
- `src/App.tsx` - Root component & routing
- `src/main.tsx` - Application entry point
- `src/contexts/AuthContext.tsx` - Authentication state
- `src/integrations/supabase/client.ts` - Backend connection

**Key Components:**
- `src/components/layout/DashboardLayout.tsx` - Main layout
- `src/components/layout/AppSidebar.tsx` - Navigation
- `src/components/crm/PipelineView.tsx` - CRM pipeline
- `src/components/analytics/AdvancedAnalyticsDashboard.tsx` - Analytics

**Database:**
- `supabase/migrations/` - All database schemas
- `supabase/functions/` - Edge functions

**Documentation:**
- `README.md` - Project overview
- `PROJECT_ROADMAP.md` - Development plan
- `docs/` - Feature documentation

### 20.3 External Resources

**Documentation:**
- React: https://react.dev
- TypeScript: https://typescriptlang.org
- Vite: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- shadcn-ui: https://ui.shadcn.com

**Community:**
- GitHub Issues: [Repo Issues]
- Discord: [Community Channel]
- Documentation Site: [Docs URL]

### 20.4 Contact & Support

**Development Team:**
- Lead Developer: [Name]
- Backend Engineer: [Name]
- UI/UX Designer: [Name]

**Support Channels:**
- Email: support@gymunitysuite.com
- Documentation: docs.gymunitysuite.com
- Status Page: status.gymunitysuite.com

---

## Document Maintenance

**This Living Technical Specification should be updated:**
- After major feature releases
- When architecture changes
- When new modules are added
- Quarterly at minimum
- Before onboarding new developers

**Update Process:**
1. Review recent changes in codebase
2. Update relevant sections
3. Increment version number
4. Update "Last Updated" date
5. Commit to repository
6. Share with team

**Version History:**
- v1.0 (Nov 14, 2025) - Initial comprehensive specification

---

**End of Living Technical Specification**

This document represents the current state of the Gym Unity Suite platform as of November 14, 2025. It serves as the single source of truth for understanding the system architecture, features, and future direction.
