# CLAUDE.md - AI Assistant Guide for Gym Unity Suite

**Last Updated:** 2026-01-01
**Codebase Version:** 1.2
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Structure](#codebase-structure)
4. [Development Workflows](#development-workflows)
5. [Key Conventions](#key-conventions)
6. [Architecture Patterns](#architecture-patterns)
7. [Database & Backend](#database--backend)
8. [Common Tasks & Examples](#common-tasks--examples)
9. [Testing Guidelines](#testing-guidelines)
10. [Deployment & Build](#deployment--build)
11. [Important Files & Configurations](#important-files--configurations)
12. [Gotchas & Known Issues](#gotchas--known-issues)

---

## Project Overview

### What is Gym Unity Suite?

**Gym Unity Suite** is an enterprise-ready B2B SaaS platform for comprehensive gym and fitness studio management. It serves boutique fitness studios, mid-size health clubs, large multi-location gym chains, and enterprise fitness franchises.

**Project Identity:**
- **Type:** Full-stack SaaS web application (React + Supabase)
- **Target Users:** Gym owners, managers, staff, trainers, and members
- **Business Model:** Multi-tenant SaaS with tiered subscriptions
- **Scale:** 40,000+ potential boutique studios, plus large gym chains

**Key Metrics:**
- **Total Codebase:** 175,000+ lines of code
- **React Components:** 294+ components (85,000+ lines)
- **Page Routes:** 80 pages, 75+ distinct routes
- **Database Tables:** 243 tables
- **Edge Functions:** 17 Supabase serverless functions
- **Database Migrations:** 98 migration files
- **Component Domains:** 43 feature directories
- **Dependencies:** 100+ npm packages
- **Feature Modules:** 20+ business domains

**Current Development Status:**
- Core features: 90% complete
- Enterprise features: 70% complete
- Advanced analytics: 80% complete
- Mobile experience (PWA): 60% complete
- Testing infrastructure: Established (Vitest + Playwright)

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool with SWC compiler |
| **Tailwind CSS** | 3.4.17 | Styling framework |
| **shadcn-ui** | Latest | UI component library (40+ components) |
| **Radix UI** | 1.x | Headless UI primitives (25+ packages) |
| **TanStack Query** | 5.83.0 | Server state management & caching |
| **React Router** | 6.30.1 | Client-side routing |
| **React Hook Form** | 7.61.1 | Form handling |
| **Zod** | 3.25.76 | Schema validation |
| **Recharts** | 2.15.4 | Data visualization |
| **React Big Calendar** | 1.19.4 | Calendar UI |
| **@dnd-kit** | 6.3.1+ | Drag & drop |
| **Lucide React** | 0.555.0 | Icon library |
| **next-themes** | 0.3.0 | Dark mode support |
| **GSAP** | 3.13.0 | Animation library |
| **Three.js** | 0.181.2 | 3D graphics |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.56.0 | Backend-as-a-Service (Auth, DB, Storage) |
| **PostgreSQL** | (via Supabase) | Relational database |
| **Supabase Edge Functions** | Deno runtime | Serverless functions |
| **Cloudflare Workers** | - | Custom domain routing |
| **Cloudflare Pages** | - | Hosting & CDN |

### Development & Testing Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Vitest** | 1.3.1 | Unit & component testing |
| **Playwright** | 1.40.0 | End-to-end testing |
| **React Testing Library** | 14.2.1 | Component testing utilities |
| **ESLint** | 9.32.0 | Code linting |
| **PostCSS** | 8.5.6 | CSS processing |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixes |
| **Terser** | 5.44.0 | Production minification |
| **Lovable Tagger** | 1.1.9 | Development tagging (dev mode only) |

---

## Codebase Structure

### Root Directory Layout

```
/home/user/gym-unity-suite/
├── src/                          # Main application source
│   ├── components/               # React components (294 files, 43 domains)
│   ├── pages/                   # Page-level components (80 files)
│   ├── contexts/                # React Context providers
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   ├── integrations/            # External service integrations
│   ├── test/                    # Test utilities and setup
│   └── utils/                   # Helper utilities
├── supabase/                    # Backend infrastructure
│   ├── functions/               # Edge functions (17 functions)
│   └── migrations/              # Database migrations (98 files)
├── workers/                     # Cloudflare Workers
│   └── custom-domain-router/    # Enterprise custom domain handling
├── e2e/                         # End-to-end tests (Playwright)
├── public/                      # Static assets
├── docs/                        # Documentation
├── dist/                        # Build output (gitignored)
└── [config files]               # Root-level configs
```

### Component Organization (Feature-Based)

Components are organized by **business domain** rather than technical type. This is a **feature-first architecture**.

```
src/components/
├── ui/                  # Reusable atomic UI components (shadcn-ui)
├── layout/              # Layout components (DashboardLayout, etc.)
├── auth/                # Authentication components
├── dashboard/           # Dashboard & widgets
├── analytics/           # Analytics dashboards & reporting
├── crm/                 # CRM, leads, pipeline management
├── members/             # Member management
├── classes/             # Class scheduling & management
├── billing/             # Billing & payments
├── staff/               # Staff management
├── training/            # Personal training
├── equipment/           # Equipment tracking
├── forms/               # Reusable form components
├── integrations/        # Third-party integration UI
├── marketing/           # Marketing automation
├── membership/          # Membership plans & management
├── communication/       # Communication tools
├── retail/              # Pro shop & POS
├── mobile/              # Mobile-specific components
├── pools/               # Pool management
├── spa/                 # Spa services
├── childcare/           # Childcare management
├── courts/              # Court sports management
├── lockers/             # Locker management
├── towels/              # Towel service tracking
├── incidents/           # Incident reporting
├── security/            # Security features
├── visitors/            # Visitor management
├── corporate/           # Corporate accounts
├── onboarding/          # User onboarding
├── location/            # Multi-location management
├── admin/               # Admin tools
├── ai/                  # AI-powered features
├── seo/                 # SEO utilities (FAQSection, ComparisonTable, etc.)
├── blog/                # Blog functionality
├── tickets/             # Support ticket system
├── audit/               # Audit trails
├── advanced/            # Advanced features
├── 3d/                  # 3D elements
├── backgrounds/         # Background components
├── checkin/             # Check-in kiosk & workflows
├── charts/              # Reusable chart components
└── imports/             # Data import utilities
```

**Key Insight:** Each domain folder contains all related components for that business feature, promoting cohesion and making it easy to find related code.

### Pages Structure

```
src/pages/
├── Index.tsx                    # Landing page
├── Dashboard.tsx                # Main dashboard
├── Login.tsx                    # Authentication
├── Members.tsx                  # Member management
├── Classes.tsx                  # Class scheduling
├── CRM.tsx                      # CRM & leads
├── Analytics.tsx                # Analytics dashboard
├── Billing.tsx                  # Billing management
├── [54+ more pages]             # Domain-specific pages
├── admin/                       # Admin pages
│   └── BlogAdminPage.tsx        # Blog management
├── blog/                        # SEO blog content
│   ├── BestGymSoftware2025.tsx
│   └── GymMemberRetentionGuide.tsx
├── compare/                     # Competitor comparison pages
│   ├── GlofoxAlternativePage.tsx
│   ├── MindbodyAlternativePage.tsx
│   └── ZenPlannerAlternativePage.tsx
├── features/                    # Feature-specific landing pages
│   └── SchedulingPage.tsx
├── local/                       # Geographic/local SEO pages
│   └── NewYorkGymSoftwarePage.tsx
└── solutions/                   # Industry-specific solution pages
    ├── CrossFitGymsPage.tsx
    ├── MartialArtsSchoolsPage.tsx
    └── YogaStudiosPage.tsx
```

### Important Directories

**`src/contexts/`** - React Context providers:
- `AuthContext.tsx` - User authentication & organization state
- `CustomDomainContext.tsx` - Enterprise custom domain handling

**`src/hooks/`** - Custom React hooks:
- `useCheckIn.ts` - Check-in business logic
- `useMembers.ts` - Member data fetching
- `useOnboarding.ts` - Onboarding flow state
- `usePermissions.ts` - RBAC logic
- `useNotifications.ts` - Notification management
- `usePresence.ts` - Real-time presence

**`src/lib/`** - Utility libraries:
- `utils.ts` - General utilities (cn() helper for Tailwind)
- `ai/` - AI service abstraction

**`src/integrations/`** - External service integrations:
- `supabase/` - Supabase client & types

**`supabase/functions/`** - Edge functions (17 total):
- `ai-generate` - AI content generation (with CORS & input validation)
- `check-subscription` - Subscription verification
- `create-checkout` - Payment checkout
- `create-one-time-payment` - One-time payments
- `customer-portal` - Customer portal access
- `generate-sitemap` - SEO sitemap generation
- `generate-wallet-pass` - Apple Wallet/Google Pay pass generation
- `get-org-by-domain` - Custom domain resolution
- `health` - Health check endpoint
- `health-check` - Extended health monitoring
- `rate-limit` - Rate limiting enforcement
- `receive-email` - Inbound email handling
- `send-email-response` - Outbound email responses
- `setup-new-user` - New user setup
- `stripe-webhook` - Stripe payment webhook handler
- `verify-custom-domain` - Domain verification
- `verify-payment` - Payment verification

---

## Development Workflows

### Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Build for Cloudflare Pages (includes headers/redirects)
npm run build:pages

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Branch Strategy

**Important:** All development should occur on designated `claude/*` branches with matching session IDs. Each Claude Code session creates a unique branch for tracking changes.

### Git Workflow

1. **Develop** on the designated branch
2. **Commit** with clear, descriptive messages
3. **Push** to remote with: `git push -u origin <branch-name>`
4. **Create PR** when ready for review

**Git Commit Best Practices:**
- Use conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep commits focused and atomic
- Reference issues/tickets if applicable
- Example: `feat: Add member check-in analytics dashboard`

### Creating New Features

**Step-by-step process:**

1. **Identify the domain** - Which business module does this belong to?
2. **Check existing components** - Can you reuse or extend existing components?
3. **Create in appropriate directory** - Place in `src/components/[domain]/`
4. **Follow naming conventions** - See conventions section below
5. **Use TypeScript** - Always type your components and props
6. **Implement RBAC** - Check permissions if needed (use `usePermissions` hook)
7. **Test locally** - Verify in dev environment
8. **Update documentation** - Update relevant MD files if needed

### Adding New Pages

1. **Create page component** in `src/pages/`
2. **Add route** in `src/App.tsx`
3. **Implement lazy loading** - Use `React.lazy()` for code splitting
4. **Wrap with ProtectedRoute** if authentication required
5. **Add to navigation** - Update navigation components as needed

**Example:**
```typescript
// In src/pages/NewFeature.tsx
const NewFeaturePage = () => {
  return <div>New Feature</div>;
};

export default NewFeaturePage;

// In src/App.tsx
const NewFeature = lazy(() => import("./pages/NewFeature"));

// Inside router
<Route path="/new-feature" element={
  <ProtectedRoute permission="VIEW_FEATURE">
    <NewFeature />
  </ProtectedRoute>
} />
```

### Working with Supabase

**Database queries:**
```typescript
import { supabase } from "@/integrations/supabase/client";

// Fetch data
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('organization_id', orgId);

// Insert data
const { data, error } = await supabase
  .from('members')
  .insert({ name: 'John', organization_id: orgId });

// Update data
const { data, error } = await supabase
  .from('members')
  .update({ status: 'active' })
  .eq('id', memberId);

// Delete data
const { data, error } = await supabase
  .from('members')
  .delete()
  .eq('id', memberId);
```

**Using TanStack Query for data fetching:**
```typescript
import { useQuery } from "@tanstack/react-query";

const useMembers = (orgId: string) => {
  return useQuery({
    queryKey: ['members', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', orgId);
      if (error) throw error;
      return data;
    },
  });
};
```

### Working with Forms

**Use React Hook Form + Zod for validation:**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const MyForm = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

---

## Key Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `DashboardLayout.tsx` |
| **Hooks** | camelCase with "use" prefix | `usePermissions.ts` |
| **Contexts** | PascalCase with "Context" suffix | `AuthContext.tsx` |
| **Pages** | PascalCase with "Page" suffix | `MembersPage.tsx` |
| **Types/Interfaces** | PascalCase | `Member`, `Organization` |
| **Constants** | SCREAMING_SNAKE_CASE | `PERMISSIONS`, `API_ENDPOINTS` |
| **Functions** | camelCase | `getMemberById`, `calculateTotal` |
| **Files (utility)** | kebab-case or camelCase | `utils.ts`, `api-client.ts` |

### File Organization

- **Co-location:** Keep related components together in feature directories
- **No barrel exports:** Use direct imports (e.g., `import { Button } from "@/components/ui/button"`)
- **Backup files:** Files with `.backup` extension should be cleaned up (technical debt)
- **Index files:** Avoid `index.tsx` barrel exports; prefer explicit file names

### Import Conventions

**Use path alias `@` for src imports:**
```typescript
// ✅ Good
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ❌ Bad
import { Button } from "../../components/ui/button";
```

**Import order:**
1. External libraries (React, etc.)
2. Internal absolute imports (`@/...`)
3. Relative imports
4. Type imports (if separate)

### Component Structure

**Recommended component structure:**

```typescript
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Component
const MyComponent = ({ title, onAction }: MyComponentProps) => {
  // 4. Hooks
  const [isOpen, setIsOpen] = useState(false);

  // 5. Event handlers
  const handleClick = () => {
    onAction?.();
  };

  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Click me</Button>
    </div>
  );
};

// 7. Export
export default MyComponent;
```

### Styling Conventions

**Use Tailwind CSS utility classes:**
```typescript
// ✅ Good
<div className="flex items-center gap-4 p-4 bg-background">

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

**Use `cn()` helper for conditional classes:**
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-variant"
)}>
```

**Tailwind Configuration:**
- Custom colors use HSL variables (defined in `globals.css`)
- Dark mode: Class-based (`dark:` prefix)
- Custom animations: Defined in `tailwind.config.ts`
- Typography plugin available (`@tailwindcss/typography`)

### TypeScript Conventions

**Current TypeScript Config:**
- `noImplicitAny: false` - Implicit any is allowed (relaxed)
- `strictNullChecks: false` - Null checks are relaxed
- `skipLibCheck: true` - Skip library type checking
- `allowJs: true` - JavaScript files allowed

**Best Practices:**
- Type props and state explicitly when possible
- Use `interface` for object types
- Use `type` for unions, intersections, primitives
- Avoid `any` when possible (even though allowed)

---

## Architecture Patterns

### Multi-Tenant Architecture

**Organization-Level Isolation:**
- Each gym business is a separate "organization" (tenant)
- All data is scoped by `organization_id`
- Database queries MUST filter by organization
- Row-Level Security (RLS) enforces isolation at DB level

**Example:**
```typescript
// Always filter by organization
const { data } = await supabase
  .from('members')
  .select('*')
  .eq('organization_id', user.organization_id);
```

### Role-Based Access Control (RBAC)

**5 User Roles:**
1. **Owner** - Full system access
2. **Manager** - Location management
3. **Staff** - Day-to-day operations
4. **Trainer** - Class/training management
5. **Member** - Self-service portal

**30+ Permissions:**
```typescript
PERMISSIONS = {
  VIEW_DASHBOARD,
  VIEW_MEMBERS,
  CREATE_MEMBERS,
  EDIT_MEMBERS,
  DELETE_MEMBERS,
  VIEW_CRM,
  VIEW_CLASSES,
  VIEW_BILLING,
  VIEW_REPORTS,
  MANAGE_STAFF,
  MANAGE_SYSTEM,
  // ... 20+ more
}
```

**Using Permissions:**
```typescript
import { usePermissions } from "@/hooks/usePermissions";

const MyComponent = () => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('VIEW_MEMBERS')) {
    return <div>No access</div>;
  }

  return <MembersList />;
};
```

**ProtectedRoute Component:**
```typescript
<ProtectedRoute permission="VIEW_MEMBERS" role="owner">
  <MembersPage />
</ProtectedRoute>
```

### State Management Patterns

**Layered Approach:**

1. **Local State** - `useState` for component-level state
2. **Context** - Shared state across component tree
   - `AuthContext` - User, organization, role
   - `CustomDomainContext` - Domain configuration
3. **Server State** - TanStack Query for API data
   - Automatic caching
   - Background refetching
   - Optimistic updates
4. **Form State** - React Hook Form for complex forms

**Example with TanStack Query:**
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['members'],
  queryFn: fetchMembers,
});

// Mutate data
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createMember,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
  },
});
```

### Routing Pattern

**Lazy Loading for Code Splitting:**
```typescript
import { lazy, Suspense } from "react";

const MembersPage = lazy(() => import("./pages/Members"));

<Suspense fallback={<LoadingSpinner />}>
  <MembersPage />
</Suspense>
```

**Route Protection:**
```typescript
<Route path="/members" element={
  <ProtectedRoute permission="VIEW_MEMBERS">
    <MembersPage />
  </ProtectedRoute>
} />
```

**Dynamic Home Route:**
- Landing page for unauthenticated users
- Appropriate dashboard for authenticated users based on role

### Data Fetching Patterns

**Custom Hooks for Domain Logic:**
```typescript
// hooks/useMembers.ts
export const useMembers = (organizationId: string) => {
  return useQuery({
    queryKey: ['members', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data;
    },
  });
};

// In component
const { data: members, isLoading } = useMembers(orgId);
```

### Component Patterns

**Atomic Design Influence:**
- **Atoms:** `src/components/ui/` - Buttons, inputs, cards
- **Molecules:** Feature-specific reusable components
- **Organisms:** Complex components like forms, tables
- **Templates:** Layout components
- **Pages:** Full page compositions

---

## Database & Backend

### Database Schema

**243 Tables** organized by domain:
- Members, memberships, plans
- Classes, schedules, bookings
- Staff, trainers, availability
- CRM, leads, pipeline
- Billing, invoices, payments
- Analytics, reports
- Equipment, maintenance
- Specialized services (pools, spa, childcare, etc.)

**Key Tables:**
- `profiles` - User profiles
- `organizations` - Tenant/gym businesses
- `members` - Gym members
- `classes` - Class definitions
- `class_bookings` - Member bookings
- `leads` - Sales leads
- `invoices` - Billing invoices
- `payments` - Payment transactions

### Migrations

**Location:** `supabase/migrations/`
**Count:** 100+ migration files
**Format:** Timestamped SQL files

**Important:**
- Never modify existing migrations
- Always create new migrations for schema changes
- Use descriptive migration names
- Test migrations locally before deploying

### Row-Level Security (RLS)

Supabase uses RLS policies to enforce multi-tenant isolation:
- Users can only access data from their organization
- Policies check `organization_id` on every query
- Admin users may have broader access

**Always query with organization filter:**
```sql
SELECT * FROM members
WHERE organization_id = auth.jwt() ->> 'organization_id';
```

### Edge Functions

**Serverless functions** for:
- Payment processing (Stripe integration)
- AI content generation
- Domain verification
- Sitemap generation
- User setup workflows

**Calling Edge Functions:**
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param: 'value' },
});
```

---

## Common Tasks & Examples

### Adding a New Feature Module

**Scenario:** Add a new "Events" management feature

1. **Create component directory:**
   ```bash
   mkdir src/components/events
   ```

2. **Create page:**
   ```typescript
   // src/pages/Events.tsx
   import EventsManager from "@/components/events/EventsManager";

   const EventsPage = () => {
     return <EventsManager />;
   };

   export default EventsPage;
   ```

3. **Add route:**
   ```typescript
   // src/App.tsx
   const Events = lazy(() => import("./pages/Events"));

   <Route path="/events" element={
     <ProtectedRoute permission="VIEW_EVENTS">
       <Events />
     </ProtectedRoute>
   } />
   ```

4. **Create main component:**
   ```typescript
   // src/components/events/EventsManager.tsx
   import { useQuery } from "@tanstack/react-query";
   import { supabase } from "@/integrations/supabase/client";

   const EventsManager = () => {
     const { data: events, isLoading } = useQuery({
       queryKey: ['events'],
       queryFn: async () => {
         const { data, error } = await supabase
           .from('events')
           .select('*');
         if (error) throw error;
         return data;
       },
     });

     if (isLoading) return <div>Loading...</div>;

     return (
       <div>
         <h1>Events</h1>
         {events?.map(event => (
           <div key={event.id}>{event.name}</div>
         ))}
       </div>
     );
   };

   export default EventsManager;
   ```

5. **Add navigation link** (if needed)

### Creating a New UI Component

**Using shadcn-ui CLI:**
```bash
npx shadcn-ui@latest add [component-name]
```

This adds the component to `src/components/ui/`

**Manual component creation:**
```typescript
// src/components/ui/custom-card.tsx
import { cn } from "@/lib/utils";

interface CustomCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const CustomCard = ({ title, children, className }: CustomCardProps) => {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
};
```

### Adding Permission Checks

```typescript
import { usePermissions } from "@/hooks/usePermissions";

const MyComponent = () => {
  const { hasPermission, hasRole } = usePermissions();

  // Check permission
  const canEditMembers = hasPermission('EDIT_MEMBERS');

  // Check role
  const isOwner = hasRole('owner');

  return (
    <div>
      {canEditMembers && <Button>Edit Member</Button>}
      {isOwner && <AdminPanel />}
    </div>
  );
};
```

### Creating Database Queries

**Simple query:**
```typescript
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('organization_id', orgId);
```

**Query with joins:**
```typescript
const { data, error } = await supabase
  .from('class_bookings')
  .select(`
    *,
    member:members(id, name, email),
    class:classes(id, name, start_time)
  `)
  .eq('organization_id', orgId);
```

**Query with filters:**
```typescript
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('organization_id', orgId)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Working with Forms

**Full form example:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const memberSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

const MemberForm = ({ onSubmit }: { onSubmit: (values: MemberFormValues) => void }) => {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
```

---

## Testing Guidelines

### Current Status

**Testing infrastructure is established** with Vitest for unit/component tests and Playwright for E2E tests.

### Test Configuration

**Files:**
- `vitest.config.ts` - Unit/component test configuration
- `playwright.config.ts` - E2E test configuration (multi-browser)
- `src/test/setup.ts` - Test environment setup

### Running Tests

```bash
# Unit/Component Tests (Vitest)
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage report
npm run test:ui           # UI dashboard

# End-to-End Tests (Playwright)
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Visible browser
npm run test:e2e:debug    # Debug mode
npm run test:e2e:report   # View test report
npm run test:e2e:codegen  # Generate tests from browser

# Full Suite
npm run test:all          # Run all tests
```

### Current Test Coverage

**Unit Tests** (`src/` directory):
- `src/components/ui/` - Button, Card, Alert components
- `src/components/auth/` - ProtectedRoute component
- `src/lib/` - Utils, rate-limiter, TOTP utilities
- `src/hooks/` - usePermissions hook

**E2E Tests** (`e2e/` directory):
- `auth.spec.ts` - Authentication flows
- `accessibility.spec.ts` - Accessibility compliance
- `performance.spec.ts` - Performance metrics
- `navigation.spec.ts` - Navigation functionality

### Testing Features

- **Vitest:** JSDOM environment, React Testing Library integration
- **Playwright:** Cross-browser testing (Chrome, Firefox, Safari, Mobile)
- **Artifacts:** Screenshots, videos, traces on failures
- **Reports:** HTML and JSON test reports
- **Coverage:** v8 provider with detailed reports

### Writing New Tests

**Unit Test Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**E2E Test Example:**
```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to dashboard', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Dashboard');
  await expect(page).toHaveURL('/dashboard');
});
```

### Areas Needing Test Expansion

- Business-critical hooks (useMembers, useCheckIn)
- CRM domain components
- Billing workflows
- Form validation logic
- Multi-tenant data isolation

### Manual Testing Checklist

When implementing features, also manually verify:
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode compatibility
- ✅ Permission checks work correctly
- ✅ Multi-tenant isolation (can't see other org's data)
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states

---

## Deployment & Build

### Build Configuration

**Vite Configuration** (`vite.config.ts`):
- **Server:** Port 8080, IPv6 support
- **SWC compiler** for fast builds
- **Code splitting strategy:**
  - Vendor chunks: `vendor-react`, `vendor-ui`, `vendor-data`
  - Feature chunks: `analytics`, `crm`, `ui-components`
  - Library chunks: `charts`, `calendar`
- **Minification:** Terser with console removal
- **Target:** ES2015
- **Chunk size warning:** 600KB

### Build Scripts

```bash
# Standard production build
npm run build

# Development mode build (keeps console logs)
npm run build:dev

# Cloudflare Pages build (includes _headers and _redirects)
npm run build:pages
```

### Deployment Target

**Primary Hosting:** Cloudflare Pages
- **Build command:** `npm run build:pages`
- **Output directory:** `dist/`
- **Auto-deployment:** On git push to main branch

**Custom Domains:** Cloudflare Worker (`workers/custom-domain-router/`)
- Enterprise white-label domain support
- Automatic SSL provisioning
- Organization-specific branding

### Environment Variables

**Required for production:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon public key

**Optional:**
- `VITE_GA_ID` - Google Analytics tracking ID
- Other service API keys as needed

### Build Output

**Artifacts:**
- `dist/` - Built application
- `dist/_headers` - Cloudflare headers config
- `dist/_redirects` - URL redirect rules
- `dist/manifest.json` - PWA manifest
- `dist/sw.js` - Service worker
- `dist/sitemap.xml` - SEO sitemap
- `dist/robots.txt` - Search engine directives

---

## Important Files & Configurations

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript configuration (composite) |
| `tsconfig.app.json` | App TypeScript config |
| `tsconfig.node.json` | Node TypeScript config |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `components.json` | shadcn-ui configuration |
| `wrangler.toml` | Cloudflare Workers config |
| `.nvmrc` | Node version (8) |
| `eslint.config.js` | ESLint rules |

### Key Source Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component, routing |
| `src/main.tsx` | Entry point |
| `src/index.css` | Global styles, Tailwind imports |
| `src/contexts/AuthContext.tsx` | Authentication state |
| `src/integrations/supabase/client.ts` | Supabase client |
| `src/lib/utils.ts` | Utility functions |
| `src/components/auth/ProtectedRoute.tsx` | Route protection |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Basic project info |
| `PRD.md` | Product Requirements Document (71KB) |
| `LIVING_TECHNICAL_SPECIFICATION.md` | Technical spec (60KB) |
| `PROJECT_ROADMAP.md` | Development roadmap |
| `PLATFORM_COMPLETION_ROADMAP.md` | Feature completion tracking |
| `gym-platform-feature-modules.md` | Feature module docs (32KB) |
| `SEO.md` | SEO playbook |
| `gym-unity-suite-seo-strategy.md` | SEO strategy (53KB) |
| `CUSTOM_DOMAIN_IMPLEMENTATION.md` | Custom domain setup |
| `Build-Output.md` | Build process docs |
| `motion_ai_implementation_timeline.md` | AI capabilities roadmap |
| `docs/` | Additional documentation |

### Supabase Files

| Location | Purpose |
|----------|---------|
| `supabase/config.toml` | Supabase project config |
| `supabase/functions/` | Edge functions (17 functions) |
| `supabase/migrations/` | Database migrations (98 files) |

### Test Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest test configuration |
| `playwright.config.ts` | Playwright E2E config |
| `src/test/setup.ts` | Test environment setup |
| `e2e/` | E2E test specifications |

---

## Gotchas & Known Issues

### TypeScript Relaxed Mode

**The TypeScript config is RELAXED:**
- `noImplicitAny: false` - Implicit `any` allowed
- `strictNullChecks: false` - Null checks not enforced
- This was likely done for rapid development

**Recommendation:** Be extra careful with types even though it's not enforced.

### Backup Files

**Issue:** Database backup files exist in `backup/` and `backups/` directories
**Impact:** Storage overhead (these are large .gz files)
**Status:** These are database backups, not source code - consider archiving to external storage

### Testing Coverage Gap

**Status:** Testing infrastructure is established (Vitest + Playwright)
**Current Coverage:** Limited (8 unit tests, 4 E2E specs)
**Priority:** Expand coverage to business-critical domains (CRM, billing, members)
**Action:** Add tests for hooks and form validation logic

### Code Splitting

**Large chunks:** Some feature chunks can be large (analytics, CRM)
**Mitigation:** Vite config has manual chunk splitting
**Monitor:** Keep an eye on chunk sizes in production builds

### Multi-Tenancy Critical

**ALWAYS filter by `organization_id`** in queries!
**Failure to do so = data leak between tenants**

Example of what NOT to do:
```typescript
// ❌ DANGEROUS - No organization filter!
const { data } = await supabase.from('members').select('*');
```

Always do:
```typescript
// ✅ SAFE - Organization filtered
const { data } = await supabase
  .from('members')
  .select('*')
  .eq('organization_id', user.organization_id);
```

### Performance Considerations

- **Large datasets:** Consider pagination for member lists, class history, etc.
- **Real-time subscriptions:** Use sparingly, can impact performance
- **Image optimization:** Use Cloudflare Image Resizing for uploaded images
- **Lazy loading:** All pages are lazy loaded - maintain this pattern

### SEO Considerations

- React Helmet Async is used for meta tags
- Sitemap is generated via edge function
- Schema.org structured data in index.html
- SEO landing pages organized in subdirectories:
  - `src/pages/compare/` - Competitor comparison pages
  - `src/pages/solutions/` - Industry vertical pages
  - `src/pages/local/` - Geographic targeting pages
  - `src/pages/blog/` - SEO-optimized blog content
- SEO utility components in `src/components/seo/`
- FAQ sections added to key comparison pages
- Keep SEO metadata updated for new pages

### Dark Mode

- Uses `next-themes` with class-based approach
- All new components should support dark mode
- Test in both light and dark modes
- Use Tailwind `dark:` prefix for dark mode styles

### Mobile/PWA

- PWA functionality is implemented (`manifest.json`, `sw.js`)
- Mobile-first design approach
- Test on actual mobile devices when possible
- Mobile-specific components in `src/components/mobile/`

---

## Best Practices for AI Assistants

### When Adding Features

1. **Understand the domain** - Read related existing components first
2. **Check permissions** - Does this feature need RBAC?
3. **Follow patterns** - Use existing patterns for consistency
4. **Type everything** - Even though TypeScript is relaxed, add types
5. **Think multi-tenant** - Always scope by organization
6. **Code split** - Use lazy loading for new pages
7. **Mobile-first** - Design for mobile, enhance for desktop
8. **Accessibility** - Use semantic HTML, ARIA labels
9. **Dark mode** - Support both themes
10. **Document** - Update relevant docs

### When Refactoring

1. **Don't break existing functionality**
2. **Maintain backwards compatibility**
3. **Update all imports** if moving files
4. **Test thoroughly** - Manual testing checklist
5. **Consider impact** - Will this affect other modules?

### When Debugging

1. **Check organization_id** - Most bugs are tenant isolation issues
2. **Check permissions** - User might not have access
3. **Check Supabase RLS** - Row-level security policies
4. **Check console** - Error messages are helpful
5. **Check network tab** - API calls and responses
6. **Check auth state** - User might not be authenticated

### Communication

When explaining code:
- Reference file paths like `src/components/crm/LeadForm.tsx:45`
- Explain the "why" not just the "what"
- Consider the business context (gym management)
- Use examples from the existing codebase

---

## Quick Reference

### Common Imports

```typescript
// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

// Utilities
import { cn } from "@/lib/utils";

// Supabase
import { supabase } from "@/integrations/supabase/client";

// React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Forms
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Hooks
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";

// Routing
import { useNavigate, Link } from "react-router-dom";
```

### Common Patterns

**Query with organization filter:**
```typescript
const { data } = useQuery({
  queryKey: ['resource', orgId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('resource')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data;
  },
});
```

**Mutation with cache invalidation:**
```typescript
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async (newData) => {
    const { data, error } = await supabase
      .from('resource')
      .insert(newData);
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
  },
});
```

**Protected component:**
```typescript
const MyComponent = () => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('VIEW_RESOURCE')) {
    return <div>Access denied</div>;
  }

  return <div>Content</div>;
};
```

---

## Resources

### External Documentation

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn-ui Components](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

### Internal Documentation

- `PRD.md` - Product requirements and business context
- `LIVING_TECHNICAL_SPECIFICATION.md` - Detailed technical spec
- `gym-platform-feature-modules.md` - Feature module details
- `CUSTOM_DOMAIN_IMPLEMENTATION.md` - Custom domain setup
- `motion_ai_implementation_timeline.md` - AI feature roadmap
- `gym-unity-suite-seo-strategy.md` - Comprehensive SEO strategy

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-01-01 | Updated metrics (294 components, 80 pages, 17 edge functions, 98 migrations), documented testing infrastructure (Vitest + Playwright), added new edge functions (wallet pass, health checks, rate limiting, Stripe webhook), updated development tool versions, added new component directories (checkin, charts, imports) |
| 1.1 | 2025-11-28 | Updated metrics (256 components, 73 pages, 13 edge functions), added email functions, fixed SEO pages structure, added new component directories |
| 1.0 | 2025-11-16 | Initial comprehensive CLAUDE.md documentation |

---

## Notes for AI Assistants

This document is specifically designed to help AI assistants (like Claude) understand the Gym Unity Suite codebase quickly and work effectively within it. Key things to remember:

✅ **Always** filter by `organization_id` for multi-tenant isolation
✅ **Always** check permissions before showing/allowing actions
✅ **Always** use TypeScript types even though config is relaxed
✅ **Always** follow the established file organization patterns
✅ **Always** use lazy loading for new pages
✅ **Always** consider mobile-first design
✅ **Always** support dark mode
✅ **Always** run `npm run test:run` before committing changes
✅ **Always** add tests for new business logic (hooks, utilities)

❌ **Never** skip organization filtering in queries
❌ **Never** commit directly to main branch
❌ **Never** ignore RBAC requirements
❌ **Never** use inline styles (use Tailwind)
❌ **Never** create barrel exports (index.tsx)
❌ **Never** modify existing migrations

**When in doubt:** Look at existing similar components and follow their patterns.

---

**End of CLAUDE.md**
