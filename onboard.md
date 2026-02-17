# Onboarding Product Tour - Implementation Plan

## Context

New users land on the Dashboard after login with no guidance on what the app can do. This feature adds a guided product tour that auto-starts on first login, highlighting key features across 6 pages with a frosted blur backdrop and glowing spotlight. Users can restart the tour anytime from Settings.

## Design Summary

**Custom-built** (no libraries). A React context manages tour state, an overlay component renders a blurred backdrop with a CSS `clip-path` spotlight cutout, and neo-brutalist tooltip cards guide users through steps. Steps are role-aware — groomers/receptionists only see pages they can access.

**Visual:** Full-viewport frosted blur (`backdrop-filter: blur(3px)`) with a clear cutout around the highlighted element. The cutout gets a pulsing glow ring in the theme's accent color. A tooltip card appears near the highlighted element with title, description, progress dots, and Back/Next buttons.

**Tour flow:** Dashboard (sidebar, stats, schedule) → Calendar (toolbar, grid) → Clients → Services → Staff → Settings (9 steps for admin, fewer for other roles).

---

## New Files

### 1. `src/modules/ui/components/onboarding/tourSteps.ts` (~100 lines)
Declarative step definitions array. Each step has:
- `id`, `page` (route path), `target` (matches `data-tour-step` attr)
- `title`, `description`, `preferredPlacement` (top/bottom/left/right)
- `permission` (null = all roles, or a `RolePermissions` key to gate visibility)

**Steps:**
| # | Page | Target | Title |
|---|------|--------|-------|
| 1 | /app/dashboard | sidebar-navigation | Your Navigation Hub |
| 2 | /app/dashboard | dashboard-stats-grid | At-a-Glance Stats |
| 3 | /app/dashboard | dashboard-today-schedule | Today's Schedule |
| 4 | /app/calendar | calendar-toolbar | Calendar Controls |
| 5 | /app/calendar | calendar-grid | Your Appointment Calendar |
| 6 | /app/clients | clients-page-header | Client Management |
| 7 | /app/services | services-page-header | Service Catalog |
| 8 | /app/staff | staff-page-header | Team Management |
| 9 | /app/settings | settings-page-header | Your Settings |

Steps 6-9 are permission-gated (`canManageClients`, `canManageServices`, `canManageStaff`, `canManageSettings`).

### 2. `src/modules/ui/context/OnboardingContext.tsx` (~180 lines)
- Filters `TOUR_STEPS` based on `usePermissions()`
- Manages: `isTourActive`, `currentStepIndex`
- `startTour()` — resets index, navigates to first step's page, sets active
- `nextStep()` / `prevStep()` — advances/retreats, calls `navigate()` when page changes
- `skipTour()` / `completeTour()` — marks done in `localStorage` (`tour_completed_${userId}`)
- Auto-starts on first login: checks localStorage, triggers after 800ms delay on `/app/*`
- Placed in App.tsx between `BrowserRouter` and `KeyboardProvider`

### 3. `src/modules/ui/components/onboarding/useSpotlight.ts` (~80 lines)
Custom hook that finds `[data-tour-step="target"]` elements and returns their bounding rect.
- Uses `MutationObserver` to wait for elements after page navigation (3s timeout)
- Listens to `resize` and `scroll` events for repositioning
- Calls `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` if element is off-screen

### 4. `src/modules/ui/components/onboarding/TourOverlay.tsx` (~200 lines)
Rendered via `createPortal` to `document.body` at `z-index: 9999`.
- **Blur backdrop:** `<div>` with `backdrop-filter: blur(3px)` + `bg-slate-900/50`, uses CSS `clip-path: polygon(...)` to cut out spotlight hole
- **Glow ring:** Positioned `<div>` around spotlight with pulsing `box-shadow` animation using `var(--accent-color)`
- **Keyboard:** Escape (skip), ArrowRight (next), ArrowLeft (prev)
- **Click blocker:** Prevents interaction outside the spotlight
- **Skip button:** Fixed top-right, neo-brutalist styled
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-label="Product tour"`

### 5. `src/modules/ui/components/onboarding/TourTooltip.tsx` (~130 lines)
Neo-brutalist card: `rounded-2xl border-2 border-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b] bg-white w-80`
- Step counter ("Step 2 of 9"), title, description
- `TourProgress` dots
- Back/Next buttons (Next uses theme `accentColorDark`, Back is white/outline)
- Auto-positions based on `preferredPlacement` with viewport clamping
- `animate-scale-in` entrance animation

### 6. `src/modules/ui/components/onboarding/TourProgress.tsx` (~35 lines)
Dot indicators: active dot is elongated (w-6), completed dots use `accentColor`, future dots are gray. All have ink border.

### 7. `src/modules/ui/components/onboarding/index.ts` (~8 lines)
Barrel exports.

---

## Modified Files

### 8. `src/index.css`
Add ~30 lines: `tour-glow-pulse` keyframe animation, `tour-tooltip-enter` animation, `tour-spotlight-transition` utility class.

### 9. `src/App.tsx`
Insert `<OnboardingProvider>` between `<BrowserRouter>` and `<KeyboardProvider>`:
```
<BrowserRouter>
  <OnboardingProvider>    ← NEW
    <KeyboardProvider>
```

### 10. `src/modules/ui/context/index.ts`
Add export for `OnboardingProvider` and `useOnboarding`.

### 11. `src/modules/ui/components/layout/Sidebar.tsx`
Add `data-tour-step="sidebar-navigation"` to the `<nav>` element.

### 12. `src/modules/ui/components/layout/AppLayout.tsx`
- Read `isTourActive` from `useOnboarding()`
- Force sidebar expanded when tour is active
- Mount `<TourOverlay />` inside the layout

### 13-17. Page files (add `data-tour-step` attributes)
- `DashboardPage.tsx` — 2 attrs: `dashboard-stats-grid`, `dashboard-today-schedule`
- `CalendarPage.tsx` — 2 attrs: `calendar-toolbar`, `calendar-grid`
- `ClientsPage.tsx` — 1 attr: `clients-page-header`
- `ServicesPage.tsx` — 1 attr: `services-page-header`
- `StaffPage.tsx` — 1 attr: `staff-page-header`

### 18. `src/modules/ui/pages/app/SettingsPage.tsx`
- 1 attr: `settings-page-header`
- Add "Product Tour" card with Restart Tour button calling `startTour()`

### 19. `src/modules/ui/context/KeyboardContext.tsx`
Suppress global keyboard shortcuts while `isTourActive` is true (prevent S, C, A, T, etc. from firing during tour).

---

## Edge Cases Handled

- **Page navigation:** `MutationObserver` in `useSpotlight` waits for new DOM elements after `navigate()`
- **Collapsed sidebar:** `AppLayout` forces sidebar expansion during tour
- **Viewport resize:** `resize` + `ResizeObserver` listeners recalculate spotlight rect
- **Scroll:** Scroll event listeners (capture phase) + `scrollIntoView` for off-screen targets
- **Missing target (3s timeout):** Auto-skip to next step with toast notification
- **Rapid clicking:** 300ms debounce guard on nav buttons
- **Mobile:** Tooltip width reduces to `w-72`, position clamps more aggressively
- **Keyboard shortcuts:** Suppressed during tour to prevent accidental navigation

---

## Implementation Order (for /swarm parallelization)

**Wave 1 (no dependencies, parallel):**
- Task A: Create `tourSteps.ts` + `TourProgress.tsx` + `index.ts` barrel
- Task B: Create `useSpotlight.ts` hook
- Task C: Add CSS animations to `index.css`

**Wave 2 (depends on Wave 1):**
- Task D: Create `OnboardingContext.tsx` (needs tourSteps)
- Task E: Create `TourTooltip.tsx` (needs TourProgress)

**Wave 3 (depends on Wave 2):**
- Task F: Create `TourOverlay.tsx` (needs useSpotlight, TourTooltip, OnboardingContext)

**Wave 4 (depends on Wave 3, parallel):**
- Task G: Wire `OnboardingProvider` into `App.tsx` + context barrel export
- Task H: Add `data-tour-step` attrs to all 6 page files + Sidebar
- Task I: Add Restart Tour card to `SettingsPage.tsx`
- Task J: Update `AppLayout.tsx` (force sidebar) + `KeyboardContext.tsx` (suppress shortcuts)

---

## Verification

1. `npm run build` — ensure no TypeScript errors
2. `npm run dev` — manual testing:
   - Clear localStorage, log in → tour auto-starts on Dashboard
   - Walk through all 9 steps → verify blur, glow, tooltip positioning on each
   - Click Skip on step 3 → tour dismisses, refresh → tour does NOT restart
   - Go to Settings → click Restart Tour → tour starts from step 1
   - Log in as groomer role → verify only permitted steps appear (Dashboard + Calendar steps)
   - Resize window during tour → spotlight repositions correctly
   - Test keyboard: ArrowRight/Left to navigate, Escape to skip
   - Check mobile viewport (< 1024px) → tooltip positioning, sidebar drawer behavior
