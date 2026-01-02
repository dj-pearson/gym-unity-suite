# Lighthouse Performance Analysis Report

**Date:** 2026-01-02
**Analyzed By:** Build output analysis (CLI Lighthouse unavailable)

---

## Executive Summary

Analysis of the production build revealed several critical loading performance issues. The main JavaScript bundle exceeds recommended size limits, and several heavy dependencies are not optimally code-split.

---

## Critical Issues Identified

### 1. Main Bundle Size (CRITICAL)
- **File:** `index-[hash].js`
- **Size:** 683 KB (195 KB gzipped)
- **Recommendation:** Should be under 300 KB for optimal First Contentful Paint (FCP)
- **Impact:** Slow initial page load, especially on mobile networks

### 2. TabletCheckInPage Bundle (HIGH)
- **File:** `TabletCheckInPage-[hash].js`
- **Size:** 360 KB (106 KB gzipped)
- **Root Cause:** `html5-qrcode` library (~300KB) imported synchronously via `CameraScanner.tsx`
- **Location:** `src/components/checkin/CameraScanner.tsx:2`

### 3. vendor-charts Bundle (HIGH)
- **File:** `vendor-charts-[hash].js`
- **Size:** 420 KB (107 KB gzipped)
- **Root Cause:** Recharts library loaded in dashboard context
- **Note:** Already in separate chunk, but loaded too early

### 4. PersonalTrainingPage Bundle (MEDIUM)
- **File:** `PersonalTrainingPage-[hash].js`
- **Size:** 189 KB (50 KB gzipped)
- **Root Cause:** Large component with many features

### 5. LandingPage Not Lazy-Loaded (MEDIUM)
- **File:** `src/pages/LandingPage.tsx` (813 lines)
- **Location:** `src/App.tsx:20` - Direct import instead of lazy()
- **Impact:** Adds to main bundle size for authenticated users

---

## Bundle Analysis Summary

### Largest JavaScript Chunks (>50KB)

| File | Size | Gzipped | Priority |
|------|------|---------|----------|
| index.js (main) | 683 KB | 195 KB | CRITICAL |
| vendor-charts.js | 420 KB | 107 KB | HIGH |
| TabletCheckInPage.js | 360 KB | 106 KB | HIGH |
| PersonalTrainingPage.js | 189 KB | 50 KB | MEDIUM |
| vendor-react.js | 142 KB | 45 KB | OK (required) |
| vendor-gsap.js | 113 KB | 44 KB | OK (lazy-loaded) |
| ImportButton.js | 77 KB | 22 KB | LOW |
| Dashboard.js | 75 KB | 23 KB | LOW |
| EquipmentPage.js | 69 KB | 13 KB | LOW |

---

## Recommended Fixes

### Fix 1: Lazy-load CameraScanner (HIGH PRIORITY)
The `html5-qrcode` library should be dynamically imported only when the camera scanner is activated.

**Current Implementation:**
```typescript
// src/components/checkin/CameraScanner.tsx
import { Html5Qrcode } from 'html5-qrcode'; // Synchronous import
```

**Recommended Implementation:**
```typescript
// Lazy load the library only when needed
const loadScanner = async () => {
  const { Html5Qrcode } = await import('html5-qrcode');
  return Html5Qrcode;
};
```

### Fix 2: Lazy-load LandingPage (MEDIUM PRIORITY)
**Current Implementation:**
```typescript
// src/App.tsx
import LandingPage from "./pages/LandingPage";
```

**Recommended Implementation:**
```typescript
const LandingPage = lazy(() => import("./pages/LandingPage"));
```

### Fix 3: Defer Chart Loading (MEDIUM PRIORITY)
Charts should only be loaded when the dashboard is accessed, not in the initial bundle.

### Fix 4: Split DashboardLayout Heavy Dependencies (LOW PRIORITY)
Components like `CommandPalette`, `NotificationCenter`, and `OnboardingTour` could be lazy-loaded.

---

## Performance Metrics Targets

| Metric | Current (Estimated) | Target |
|--------|---------------------|--------|
| Main Bundle | 683 KB | < 300 KB |
| Time to Interactive | ~3-4s (3G) | < 2s |
| First Contentful Paint | ~2s | < 1s |
| Largest Contentful Paint | ~3s | < 2.5s |

---

## Files Modified in This Fix

1. `src/components/checkin/CameraScanner.tsx` - Lazy load html5-qrcode
2. `src/App.tsx` - Lazy load LandingPage
3. `vite.config.ts` - Add html5-qrcode to manual chunks

---

## Post-Fix Verification

Run the following after applying fixes:
```bash
npm run build
# Verify main bundle is reduced
# Verify TabletCheckInPage chunk is reduced
```

---

## Fixes Applied (2026-01-02)

### Changes Made:
1. **CameraScanner.tsx** - Lazy-load html5-qrcode library (~300KB savings)
2. **App.tsx** - Lazy-load LandingPage component
3. **vite.config.ts** - Add html5-qrcode to manual chunks as `vendor-qrcode`

### Results After Fixes:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main bundle (index.js) | 683 KB | 586 KB | **-97 KB (14%)** |
| TabletCheckInPage | 360 KB | 26 KB | **-334 KB (93%)** |
| LandingPage | (in main bundle) | 32 KB separate | Now lazy-loaded |
| vendor-qrcode | (in TabletCheckIn) | 374 KB separate | Only loaded when camera used |

### New Bundle Distribution:
- `index.js`: 586 KB (was 683 KB)
- `vendor-qrcode.js`: 374 KB (lazy-loaded on demand)
- `vendor-charts.js`: 420 KB (lazy-loaded on dashboard)
- `vendor-gsap.js`: 113 KB (lazy-loaded on landing page)
- `LandingPage.js`: 32 KB (lazy-loaded)
- `TabletCheckInPage.js`: 26 KB (was 360 KB)

### Remaining Optimization Opportunities:
- Main bundle still above 300 KB target (currently 586 KB)
- Consider further code-splitting DashboardLayout dependencies
- Consider lazy-loading heavy page components on scroll

---

**Report Generated:** 2026-01-02
