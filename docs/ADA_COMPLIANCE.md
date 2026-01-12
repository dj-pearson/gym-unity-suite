# ADA Compliance & WCAG 2.1 Accessibility Documentation

**Last Updated:** January 2026
**Compliance Level:** WCAG 2.1 AA (Partially Conformant)
**Status:** Active Maintenance

---

## Table of Contents

1. [Overview](#overview)
2. [Compliance Status](#compliance-status)
3. [Accessibility Features](#accessibility-features)
4. [Technical Implementation](#technical-implementation)
5. [Component Library](#component-library)
6. [Testing Strategy](#testing-strategy)
7. [Known Limitations](#known-limitations)
8. [Contact Information](#contact-information)
9. [Maintenance Schedule](#maintenance-schedule)

---

## Overview

Rep Club (Gym Unity Suite) is committed to ensuring digital accessibility for people with disabilities. This document outlines our accessibility implementation, compliance status, and ongoing improvement efforts.

### Legal Framework

Our accessibility efforts are guided by:
- **Americans with Disabilities Act (ADA)** - Title III requirements for public accommodations
- **Web Content Accessibility Guidelines (WCAG) 2.1** - International accessibility standard
- **Section 508** - Federal accessibility requirements

### Scope

This accessibility implementation covers:
- Main web application (repclub.app)
- All authenticated dashboard pages
- Member-facing portals
- Public marketing pages
- API documentation

---

## Compliance Status

### Current WCAG 2.1 Conformance

| Level | Status | Percentage |
|-------|--------|------------|
| **Level A** | Fully Conformant | 100% |
| **Level AA** | Partially Conformant | ~95% |
| **Level AAA** | Selective | ~40% |

### Conformance Criteria Met

#### Level A (Essential)

| Criterion | Description | Status |
|-----------|-------------|--------|
| 1.1.1 | Non-text Content | ✅ Pass |
| 1.2.1 | Audio-only and Video-only | ✅ Pass (N/A) |
| 1.3.1 | Info and Relationships | ✅ Pass |
| 1.3.2 | Meaningful Sequence | ✅ Pass |
| 1.3.3 | Sensory Characteristics | ✅ Pass |
| 1.4.1 | Use of Color | ✅ Pass |
| 1.4.2 | Audio Control | ✅ Pass |
| 2.1.1 | Keyboard | ✅ Pass |
| 2.1.2 | No Keyboard Trap | ✅ Pass |
| 2.1.4 | Character Key Shortcuts | ✅ Pass |
| 2.2.1 | Timing Adjustable | ✅ Pass |
| 2.2.2 | Pause, Stop, Hide | ✅ Pass |
| 2.3.1 | Three Flashes | ✅ Pass |
| 2.4.1 | Bypass Blocks | ✅ Pass |
| 2.4.2 | Page Titled | ✅ Pass |
| 2.4.3 | Focus Order | ✅ Pass |
| 2.4.4 | Link Purpose | ✅ Pass |
| 3.1.1 | Language of Page | ✅ Pass |
| 3.2.1 | On Focus | ✅ Pass |
| 3.2.2 | On Input | ✅ Pass |
| 3.3.1 | Error Identification | ✅ Pass |
| 3.3.2 | Labels or Instructions | ✅ Pass |
| 4.1.1 | Parsing | ✅ Pass |
| 4.1.2 | Name, Role, Value | ✅ Pass |

#### Level AA (Standard)

| Criterion | Description | Status |
|-----------|-------------|--------|
| 1.3.4 | Orientation | ✅ Pass |
| 1.3.5 | Identify Input Purpose | ✅ Pass |
| 1.4.3 | Contrast (Minimum) | ✅ Pass |
| 1.4.4 | Resize Text | ✅ Pass |
| 1.4.5 | Images of Text | ✅ Pass |
| 1.4.10 | Reflow | ✅ Pass |
| 1.4.11 | Non-text Contrast | ✅ Pass |
| 1.4.12 | Text Spacing | ✅ Pass |
| 1.4.13 | Content on Hover/Focus | ✅ Pass |
| 2.4.5 | Multiple Ways | ✅ Pass |
| 2.4.6 | Headings and Labels | ✅ Pass |
| 2.4.7 | Focus Visible | ✅ Pass |
| 2.5.1 | Pointer Gestures | ✅ Pass |
| 2.5.2 | Pointer Cancellation | ✅ Pass |
| 2.5.3 | Label in Name | ✅ Pass |
| 2.5.4 | Motion Actuation | ✅ Pass |
| 3.1.2 | Language of Parts | ✅ Pass |
| 3.2.3 | Consistent Navigation | ✅ Pass |
| 3.2.4 | Consistent Identification | ✅ Pass |
| 3.3.3 | Error Suggestion | ✅ Pass |
| 3.3.4 | Error Prevention | ✅ Pass |
| 4.1.3 | Status Messages | ✅ Pass |

#### Level AAA (Enhanced - Selective)

| Criterion | Description | Status |
|-----------|-------------|--------|
| 2.3.3 | Animation from Interactions | ✅ Pass |
| 2.5.5 | Target Size (44x44px) | ✅ Pass |

---

## Accessibility Features

### Navigation

#### Skip Links
- **Implementation:** `src/components/accessibility/SkipLink.tsx`
- **Behavior:** First focusable element on every page
- **Target:** Skips to `#main-content` landmark

```tsx
import { SkipLink } from '@/components/accessibility/SkipLink';

// In your layout
<SkipLink targetId="main-content" />
```

#### Keyboard Navigation
- Full keyboard accessibility throughout the application
- Logical tab order following visual hierarchy
- Focus trap implementation for modals and dialogs
- Escape key closes all overlays

#### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Open Command Palette | `Cmd/Ctrl + K` |
| Toggle Sidebar | `B` |
| Close Modal | `Escape` |
| Navigate Lists | `↑` / `↓` |
| Show Shortcuts | `?` |

### Visual Accessibility

#### Color Contrast
- All text meets WCAG 2.1 AA contrast ratios (4.5:1 for normal text)
- UI components meet 3:1 contrast ratio requirement
- Dark mode optimized for reduced eye strain

#### Focus Indicators
- Visible focus rings on all interactive elements
- 2px solid ring with 2px offset
- High visibility in both light and dark modes

```css
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

#### Motion Preferences
- Respects `prefers-reduced-motion` media query
- All animations can be disabled
- Essential animations only when reduced motion enabled

### Screen Reader Support

#### ARIA Implementation
- Semantic landmarks (header, main, footer, nav)
- ARIA labels for interactive elements
- Live regions for dynamic content updates
- Proper heading hierarchy

#### Live Regions
- **Implementation:** `src/components/accessibility/LiveRegion.tsx`
- Toast notifications announced via ARIA live regions
- Form validation errors announced to screen readers

```tsx
import { LiveRegion } from '@/components/accessibility/LiveRegion';

<LiveRegion
  message="Form submitted successfully"
  politeness="polite"
/>
```

### Form Accessibility

#### Labels and Instructions
- All form inputs have associated labels
- Required fields clearly indicated
- Help text available via `aria-describedby`

#### Error Handling
- Errors announced via ARIA live regions
- Error messages linked to inputs via `aria-describedby`
- Focus moves to first error on submission

### Data Tables

#### Accessible Tables
- **Implementation:** `src/components/accessibility/AccessibleTable.tsx`
- Proper `scope` attributes on headers
- Table captions (visible or screen reader only)
- Sortable columns with `aria-sort`
- Keyboard navigation for rows

---

## Technical Implementation

### File Structure

```
src/
├── components/
│   └── accessibility/
│       ├── AccessibleIcon.tsx      # Icon wrapper with proper ARIA
│       ├── AccessibleTable.tsx     # WCAG-compliant data tables
│       ├── KeyboardShortcutsDialog.tsx  # Keyboard shortcuts help
│       ├── LiveRegion.tsx          # ARIA live region components
│       └── SkipLink.tsx            # Skip-to-main-content link
├── hooks/
│   └── useAccessibility.ts         # Accessibility hooks
│       ├── useAnnounce()           # Screen reader announcements
│       ├── useFocusTrap()          # Focus trap for modals
│       ├── useReducedMotion()      # Detect motion preference
│       ├── useKeyboardNavigation() # List/grid keyboard nav
│       ├── useHighContrastMode()   # Detect high contrast
│       └── useFocusVisible()       # Track keyboard focus
├── pages/
│   └── AccessibilityPage.tsx       # Accessibility statement
└── index.css                       # Accessibility CSS utilities

supabase/functions/
└── accessibility-audit/            # Backend compliance auditing
    └── index.ts

e2e/
└── accessibility.spec.ts           # Automated accessibility tests
```

### CSS Utilities

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .border { border-width: 2px !important; }
  a { text-decoration: underline !important; }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Hooks Usage

```tsx
// Announce to screen readers
const { announce } = useAnnounce();
announce('Item added to cart');

// Trap focus in a modal
const containerRef = useRef(null);
useFocusTrap(containerRef, isOpen, {
  initialFocus: '[data-autofocus]',
  onEscape: () => setIsOpen(false)
});

// Check for reduced motion preference
const prefersReducedMotion = useReducedMotion();
if (!prefersReducedMotion) {
  // Play animation
}
```

---

## Component Library

### AccessibleIcon

Wraps icons for proper accessibility.

```tsx
import { AccessibleIcon, IconButton, StatusIcon } from '@/components/accessibility/AccessibleIcon';

// Decorative icon (hidden from screen readers)
<AccessibleIcon icon={HomeIcon} decorative />

// Informative icon with label
<AccessibleIcon icon={AlertIcon} label="Warning" />

// Icon-only button (always needs label)
<IconButton icon={TrashIcon} label="Delete item" onClick={handleDelete} />

// Status indicator
<StatusIcon status="success" label="Completed" />
```

### AccessibleTable

WCAG-compliant data table.

```tsx
import { AccessibleTable } from '@/components/accessibility/AccessibleTable';

<AccessibleTable
  caption="Members list"
  data={members}
  columns={[
    { id: 'name', header: 'Name', isRowHeader: true },
    { id: 'email', header: 'Email' },
    { id: 'status', header: 'Status', sortable: true }
  ]}
  getRowKey={(row) => row.id}
  onSort={handleSort}
  selectable
/>
```

### KeyboardShortcutsDialog

Shows all available keyboard shortcuts.

```tsx
import { KeyboardShortcutsDialog } from '@/components/accessibility/KeyboardShortcutsDialog';

<KeyboardShortcutsDialog />

// With custom trigger
<KeyboardShortcutsDialog
  trigger={<Button>View Shortcuts</Button>}
/>
```

---

## Testing Strategy

### Automated Testing

#### E2E Tests (Playwright + axe-core)

Run accessibility tests:
```bash
npm run test:e2e -- accessibility.spec.ts
```

Test coverage includes:
- WCAG 2.1 A and AA automated checks
- Heading hierarchy validation
- Landmark region detection
- Form label associations
- Color contrast verification
- Keyboard navigation testing
- Focus indicator visibility
- Mobile touch targets
- Reduced motion support

#### Edge Function Audit

The `accessibility-audit` edge function provides API access to compliance status:

```bash
# Quick status
curl https://your-domain.supabase.co/functions/v1/accessibility-audit/status

# Full report
curl https://your-domain.supabase.co/functions/v1/accessibility-audit/report
```

### Manual Testing Checklist

#### Keyboard Testing
- [ ] All interactive elements reachable via Tab
- [ ] Skip link works correctly
- [ ] Focus order is logical
- [ ] Focus never gets lost
- [ ] Escape closes modals
- [ ] Arrow keys navigate lists

#### Screen Reader Testing
- [ ] Page titles announced on navigation
- [ ] All images have appropriate alt text
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Dynamic content updates announced
- [ ] Tables navigable

#### Visual Testing
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Text resizable to 200%
- [ ] No horizontal scroll at 320px
- [ ] Works in high contrast mode

### Recommended Screen Reader Testing

| Platform | Screen Reader |
|----------|--------------|
| Windows | NVDA, JAWS |
| macOS | VoiceOver |
| iOS | VoiceOver |
| Android | TalkBack |

---

## Known Limitations

### Third-Party Content
Some embedded content from third-party providers may have accessibility limitations:
- Payment processor iframes (Stripe)
- External map embeds
- Some analytics widgets

**Mitigation:** We provide alternative contact methods for users who cannot use these features.

### PDF Documents
Some legacy PDF documents may not be fully accessible.

**Mitigation:** Alternative formats (HTML, plain text) available upon request.

### Complex Data Visualizations
Charts and graphs may be challenging for screen reader users.

**Mitigation:** Data tables provided as alternatives where applicable.

---

## Contact Information

### Accessibility Support

**Email:** accessibility@repclub.app
**Phone:** +1 (555) 012-3456
**TTY:** +1 (555) 012-3457
**Response Time:** Within 2 business days

### Reporting Issues

When reporting accessibility issues, please include:
1. URL of the page
2. Description of the barrier
3. Assistive technology used (if applicable)
4. Screenshots (if helpful)

### Formal Complaints

If accessibility issues are not resolved satisfactorily:
1. Email accessibility-complaints@repclub.app
2. Our Accessibility Coordinator responds within 5 business days
3. Escalation to executive team available
4. External mediation via [ADA.gov](https://www.ada.gov/file-a-complaint/)

---

## Maintenance Schedule

### Ongoing Activities
- Daily: Automated accessibility tests run in CI/CD
- Weekly: Review of accessibility feedback
- Monthly: Component library audit
- Quarterly: Manual accessibility testing with screen readers

### Annual Activities
- Full WCAG 2.1 AA compliance audit
- Third-party accessibility assessment
- Staff accessibility training update
- Accessibility statement review

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial ADA compliance implementation |

---

## Resources

### Internal Documentation
- `/accessibility` - Public accessibility statement
- `CLAUDE.md` - Development guidelines including accessibility

### External Resources
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**This document is maintained by the Rep Club development team. For questions or updates, contact the Accessibility Coordinator.**
