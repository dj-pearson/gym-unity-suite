# Performance Optimization Guide

**Last Updated:** 2025-12-03
**Status:** Active

This document covers performance optimization strategies for the Gym Unity Suite application, including code splitting, CDN configuration, query performance monitoring, and database index recommendations.

---

## Table of Contents

1. [Code Splitting Strategy](#code-splitting-strategy)
2. [CDN Configuration](#cdn-configuration)
3. [Query Performance Monitoring](#query-performance-monitoring)
4. [Database Index Optimization](#database-index-optimization)
5. [Lighthouse CI](#lighthouse-ci)
6. [Performance Budgets](#performance-budgets)

---

## Code Splitting Strategy

### Overview

The application uses Vite's manual chunks configuration to split the bundle into optimized chunks. The goal is to keep most chunks under **250KB** while ensuring efficient caching and minimal redundant downloads.

### Chunk Categories

#### Vendor Chunks (Third-Party Libraries)

| Chunk | Libraries | Size Target | Load Strategy |
|-------|-----------|-------------|---------------|
| `vendor-react` | React, ReactDOM | ~140KB | Critical - preloaded |
| `vendor-router` | React Router | ~14KB | Critical - preloaded |
| `vendor-ui-utils` | clsx, tailwind-merge, CVA | ~21KB | Critical - preloaded |
| `vendor-radix-core` | Dialog, Dropdown, Popover, Toast | ~36KB | On-demand |
| `vendor-radix-forms` | Select, Checkbox, Radio, Switch, Tabs | ~30KB | On-demand |
| `vendor-radix-extra` | Other Radix primitives | ~56KB | On-demand |
| `vendor-query` | TanStack Query | ~38KB | Critical |
| `vendor-supabase` | Supabase client | ~124KB | Critical |
| `vendor-forms` | React Hook Form, Zod | ~80KB | On-demand |
| `vendor-calendar` | react-big-calendar, date-fns | ~157KB | On-demand |
| `vendor-charts` | Recharts, D3 | ~344KB | Lazy-loaded |
| `vendor-qrcode-scan` | html5-qrcode (scanner) | ~334KB | Lazy-loaded |
| `vendor-animations` | GSAP | ~113KB | On-demand |
| `vendor-dnd` | @dnd-kit | ~45KB | On-demand |
| `vendor-icons` | Lucide React | ~38KB | On-demand |

#### Application Chunks (Feature Modules)

| Chunk | Components | Description |
|-------|------------|-------------|
| `app-analytics` | Analytics dashboards | ~84KB |
| `app-crm` | CRM, leads, pipeline | ~127KB |
| `app-members` | Member management | ~58KB |
| `app-billing` | Billing, payments | ~48KB |
| `app-classes` | Class scheduling | ~45KB |
| `app-staff` | Staff management | ~45KB |
| `app-marketing` | Marketing automation | ~39KB |
| `app-mobile` | Mobile-specific components | ~52KB |
| `app-equipment` | Equipment tracking | ~99KB |
| `app-ui-components` | Shared UI components | ~50KB |

### Optimization Principles

1. **Critical Path Optimization**: Core React, Router, and UI utilities are preloaded
2. **Feature-Based Splitting**: Large features are split into separate chunks
3. **Lazy Loading**: Heavy libraries (charts, QR scanner) are only loaded when needed
4. **Cache Efficiency**: Content-hashed filenames enable long-term caching

### Vite Configuration

See `vite.config.ts` for the complete `manualChunks` configuration.

---

## CDN Configuration

### Cache Strategy

The application uses Cloudflare Pages for hosting with the following cache headers:

#### Critical Assets (No Cache)

```
/index.html
  Cache-Control: no-cache, no-store, must-revalidate
```

The HTML entry point must always be fresh to ensure users get the latest version.

#### Immutable Assets (1 Year Cache)

All hashed build output:
```
/assets/js/*   - Cache-Control: public, max-age=31536000, immutable
/assets/css/*  - Cache-Control: public, max-age=31536000, immutable
/assets/fonts/* - Cache-Control: public, max-age=31536000, immutable
```

#### Static Assets (1 Week Cache with Revalidation)

Static images and files that may change:
```
/*.webp, /*.png, /*.jpg, /*.svg
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
```

#### Dynamic Assets (Short Cache)

- **PWA Manifest**: 1 hour with stale-while-revalidate
- **Service Worker**: No cache (must always be fresh)
- **Sitemap/Robots**: 1 day cache

### Resource Hints

The `_headers` file includes preload hints for critical assets:

```
Link: </assets/js/vendor-react-*.js>; rel=modulepreload; as=script
Link: </assets/js/vendor-router-*.js>; rel=modulepreload; as=script
Link: <https://fonts.googleapis.com>; rel=preconnect
Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin
```

### Security Headers

All responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: [configured policy]`

---

## Query Performance Monitoring

### N+1 Query Detection

N+1 queries occur when fetching related data in a loop instead of batching. This is common in lists showing related entities.

#### Common N+1 Patterns to Avoid

```typescript
// BAD: N+1 Query
const members = await supabase.from('members').select('*');
for (const member of members) {
  // This creates N additional queries!
  const membership = await supabase
    .from('memberships')
    .select('*')
    .eq('member_id', member.id);
}

// GOOD: Single Query with Join
const { data } = await supabase
  .from('members')
  .select(`
    *,
    memberships (
      id,
      status,
      plan:membership_plans (name, price)
    )
  `)
  .eq('organization_id', orgId);
```

#### TanStack Query Best Practices

```typescript
// Use select to specify only needed fields
const { data } = useQuery({
  queryKey: ['members', orgId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, email, status, memberships(status)')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data;
  },
  // Stale time to reduce refetches
  staleTime: 30000, // 30 seconds
});
```

### Query Performance Checklist

- [ ] Use `.select()` to specify only needed columns
- [ ] Use joins instead of multiple queries for related data
- [ ] Implement pagination for large lists (`.range(0, 49)`)
- [ ] Use appropriate `staleTime` in React Query
- [ ] Enable query batching where possible
- [ ] Avoid fetching data that's already in cache

### Monitoring in Development

Add query logging in development:

```typescript
// In supabase client setup
if (import.meta.env.DEV) {
  // Log queries in development
  console.time('supabase-query');
  // ... query
  console.timeEnd('supabase-query');
}
```

### Supabase Dashboard Monitoring

1. Navigate to your Supabase project dashboard
2. Go to **Database > Query Performance**
3. Review slow queries and execution plans
4. Look for sequential scans on large tables (indicates missing indexes)

---

## Database Index Optimization

### Existing Indexes

The database already has indexes on:
- Organization-scoped queries (most tables have `organization_id` indexes)
- Status fields for filtering
- Date fields for time-based queries
- Foreign key relationships

### Recommended Additional Indexes

Based on common query patterns, consider adding these indexes:

#### Members Table

```sql
-- For member search by name
CREATE INDEX idx_members_org_name
ON public.profiles(organization_id, first_name, last_name);

-- For member status filtering
CREATE INDEX idx_members_org_status
ON public.profiles(organization_id, role) WHERE role = 'member';
```

#### Check-ins Table

```sql
-- For daily check-in reports
CREATE INDEX idx_check_ins_org_date
ON public.check_ins(organization_id, checked_in_at DESC);

-- For member check-in history
CREATE INDEX idx_check_ins_member_date
ON public.check_ins(member_id, checked_in_at DESC);
```

#### Classes Table

```sql
-- For upcoming classes
CREATE INDEX idx_classes_org_scheduled
ON public.classes(organization_id, scheduled_at)
WHERE scheduled_at > NOW();

-- For instructor schedules
CREATE INDEX idx_classes_instructor_scheduled
ON public.classes(instructor_id, scheduled_at);
```

#### Leads Table (CRM)

```sql
-- For lead pipeline views
CREATE INDEX idx_leads_org_status_updated
ON public.leads(organization_id, status, updated_at DESC);

-- For lead assignment
CREATE INDEX idx_leads_assigned_status
ON public.leads(assigned_to, status);
```

#### Bookings Table

```sql
-- For upcoming member bookings
CREATE INDEX idx_bookings_member_date
ON public.class_bookings(member_id, class_id);

-- For class roster
CREATE INDEX idx_bookings_class_status
ON public.class_bookings(class_id, status);
```

### Index Best Practices

1. **Multi-column Indexes**: Put most selective columns first
2. **Partial Indexes**: Use WHERE clauses for common filters
3. **Avoid Over-Indexing**: Each index adds write overhead
4. **Regular Review**: Monitor unused indexes and remove them
5. **EXPLAIN ANALYZE**: Use this to verify query plans

### Running Index Analysis

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_tup_read DESC;

-- Find missing indexes (tables with sequential scans)
SELECT
  schemaname,
  relname,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_tup_read DESC
LIMIT 20;
```

---

## Lighthouse CI

### Configuration

See `lighthouserc.js` for the complete configuration.

### Performance Budgets

| Metric | Budget | Description |
|--------|--------|-------------|
| First Contentful Paint | < 2.0s | Time to first content render |
| Largest Contentful Paint | < 3.0s | Time to largest element render |
| Time to Interactive | < 4.0s | Time to full interactivity |
| Total Blocking Time | < 300ms | Main thread blocking time |
| Cumulative Layout Shift | < 0.1 | Visual stability |
| Total Bundle Size | < 500KB | Initial JS + CSS |

### Running Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run lighthouse
lhci autorun

# Or with specific config
lhci autorun --config=lighthouserc.js
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run build
    - run: npm install -g @lhci/cli
    - run: lhci autorun
```

---

## Performance Budgets

### Bundle Size Limits

| Asset Type | Warning | Error |
|------------|---------|-------|
| Initial JS | 400KB | 500KB |
| Chunk Size | 200KB | 250KB |
| Initial CSS | 100KB | 150KB |
| Images | 500KB | 1MB |

### Load Time Targets

| Metric | 3G Target | 4G Target | Desktop Target |
|--------|-----------|-----------|----------------|
| FCP | < 3.0s | < 1.5s | < 1.0s |
| LCP | < 4.0s | < 2.5s | < 1.5s |
| TTI | < 7.0s | < 3.5s | < 2.0s |

### Monitoring

1. **Build-time**: Vite reports chunk sizes during build
2. **CI**: Lighthouse CI runs on every PR
3. **Production**: Use real user monitoring (RUM) with Google Analytics or similar

---

## Quick Optimization Checklist

### Before Deployment

- [ ] Run production build and check chunk sizes
- [ ] Verify no chunks exceed 250KB (except lazy-loaded features)
- [ ] Run Lighthouse audit locally
- [ ] Check for N+1 queries in new features
- [ ] Verify images are optimized (WebP, proper sizing)

### Monthly Review

- [ ] Review Supabase query performance dashboard
- [ ] Check for unused indexes
- [ ] Analyze real user metrics
- [ ] Update dependencies for performance improvements
- [ ] Review and clean up unused code

---

## Resources

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/)
- [Supabase Performance Guide](https://supabase.com/docs/guides/platform/performance)
- [PostgreSQL Index Tuning](https://www.postgresql.org/docs/current/indexes.html)
- [Web.dev Performance](https://web.dev/performance/)
