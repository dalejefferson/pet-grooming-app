# Pet Grooming App - Claude Code Guide

## Project Overview

A pet grooming salon management SaaS application called **Sit Pretty Club**, built with React 19, TypeScript, and TailwindCSS 4.1. Features a **pastel neo-brutalist** design aesthetic with navy borders (#1e293b), offset shadows, and rounded corners. Data persists in Supabase (PostgreSQL) with Row-Level Security. Auth via Supabase Auth with Google OAuth (PKCE flow).

## Tech Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4.1 with `@tailwindcss/vite` plugin and custom theme variables
- **State Management**: React Query (`@tanstack/react-query` v5)
- **Routing**: React Router DOM v7
- **Calendar**: react-big-calendar v1 with drag-and-drop
- **Charts**: Recharts v3
- **PDF Generation**: jsPDF v4
- **Icons**: Lucide React
- **Date Utilities**: date-fns v4
- **Address Autocomplete**: use-places-autocomplete + @googlemaps/js-api-loader v2
- **Payments**: @stripe/stripe-js (Stripe Checkout + Customer Portal)
- **CSS Utilities**: clsx + tailwind-merge
- **Unit Testing**: Vitest 4 + React Testing Library + jsdom
- **E2E Testing**: Playwright
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Supabase Client**: @supabase/supabase-js v2
- **Linting**: ESLint 9 + TypeScript ESLint + React Hooks plugin + React Refresh plugin

## Project Structure

```
src/
├── modules/                     # Primary code organization (feature modules)
│   ├── auth/                    # Authentication & authorization
│   │   ├── api/                 # authApi.ts (Supabase Auth: password + OAuth)
│   │   ├── components/          # PermissionGate.tsx, ProtectedRoute.tsx
│   │   ├── context/             # AuthContext.tsx (session management)
│   │   ├── hooks/               # useAuth, usePermissions
│   │   ├── pages/               # LoginPage.tsx, AuthCallbackPage.tsx
│   │   ├── types/               # User type
│   │   └── utils/               # hasRole, isAdmin, isGroomer
│   ├── database/                # Data layer (Supabase-backed)
│   │   ├── api/                 # All domain API modules (14 files)
│   │   ├── config/              # queryClient.ts (React Query config)
│   │   ├── hooks/               # React Query hooks (14 files)
│   │   ├── seed/                # seed.ts (mock data generation, 831 lines)
│   │   ├── storage/             # Supabase storage helpers
│   │   └── types/               # All domain types (database models)
│   ├── notifications/           # Notification system
│   │   ├── hooks/               # useNotifications
│   │   └── services/            # inAppNotificationService, mockEmailService
│   └── ui/                      # All UI code
│       ├── assets/              # Static assets (react.svg)
│       ├── components/          # Reusable components by feature
│       │   ├── booking/         # Booking flow components (16 files)
│       │   ├── calendar/        # Calendar page components (10 files)
│       │   ├── clients/         # (empty - inline in page)
│       │   ├── common/          # Shared UI components (19 files)
│       │   ├── dashboard/       # VaccinationAlertsWidget
│       │   ├── groomers/        # GroomerCard, GroomerForm
│       │   ├── layout/          # AppLayout, BookingLayout, Header, Sidebar
│       │   ├── payment/         # Payment method components (5 files)
│       │   ├── pets/            # Pet detail components (9 files)
│       │   ├── policies/        # (empty - inline in page)
│       │   ├── reminders/       # VaccinationReminderSettings
│       │   ├── reports/         # Chart components (13 files)
│       │   ├── services/        # Service management components (4 files)
│       │   └── staff/           # Staff management components (6 files)
│       ├── context/             # React contexts
│       │   ├── BookingContext.tsx
│       │   ├── KeyboardContext.tsx
│       │   ├── ShortcutTipsContext.tsx
│       │   ├── ThemeContext.tsx
│       │   └── UndoContext.tsx
│       └── pages/
│           ├── app/             # Protected admin pages (15 files)
│           └── book/            # Public booking portal pages (7 files)
├── components/                  # Legacy directory (empty subdirs: clients, policies, reminders)
├── config/                      # App constants and feature flags
│   ├── constants.ts             # Status colors/labels, breeds, calendar hours, etc.
│   └── flags.ts                 # Feature flags (FeatureFlags type)
├── hooks/                       # Re-exports from modules + useGoogleMapsLoader
├── lib/
│   ├── api/                     # Re-exports from modules (backwards compatibility)
│   ├── stripe/                  # Mock Stripe integration (mockStripe.ts, placeholder.ts)
│   ├── supabase/                # Supabase client (client.ts, storage.ts)
│   └── utils/                   # Utility functions
│       ├── cardUtils.ts         # Payment card utilities
│       ├── contrast.ts          # WCAG color contrast (hexToRgb, luminance)
│       ├── reportCsvExport.ts   # CSV export for reports
│       ├── reportPdfExport.ts   # PDF export for reports (25k+ lines)
│       └── vaccinationUtils.ts  # Vaccination date/status helpers
├── test/                        # Test setup (setup.ts for Vitest)
└── types/                       # Re-exports from modules (backwards compatibility)
    └── index.ts                 # Re-exports @/modules/database/types + @/modules/auth/types
```

### Root Directory Files

```
CLAUDE.md                # This file
PROMPT.md                # Project prompt/spec
README.md                # Project readme
e2e/                     # Playwright E2E tests
scripts/                 # Build/CI helper scripts (build, commit, lint, test, etc.)
eslint.config.js         # ESLint configuration
index.html               # Vite entry HTML
playwright.config.ts     # Playwright config (Chromium, localhost:5173)
vite.config.ts           # Vite config with React + TailwindCSS plugins + @ alias
vitest.config.ts         # Vitest config (jsdom, globals, src/test/setup.ts)
tsconfig.json            # References tsconfig.app.json + tsconfig.node.json
tsconfig.app.json        # App TS config (ES2022, strict, @ path alias)
```

## Routing

### Auth Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | Login page (password + Google OAuth) |
| `/auth/callback` | `AuthCallbackPage` | OAuth callback handler (PKCE code exchange) |
| `/` | Redirect | Redirects to `/login` |
| `*` | Redirect | Catch-all redirects to `/login` |

### App Routes (Protected, under `/app`)

| Path | Component | Description |
|------|-----------|-------------|
| `/app` | Redirect | Redirects to `/app/dashboard` |
| `/app/dashboard` | `DashboardPage` | Stats overview with clickable cards |
| `/app/calendar` | `CalendarPage` | Day/Week/Month views with drag-and-drop |
| `/app/clients` | `ClientsPage` | Client list with search |
| `/app/clients/:clientId` | `ClientDetailPage` | Client profile with pets |
| `/app/pets` | `PetsPage` | All pets list |
| `/app/pets/:petId` | `PetDetailPage` | Pet profile, vaccinations, history |
| `/app/groomers` | Redirect | Redirects to `/app/staff` |
| `/app/staff` | `StaffPage` | Staff management with roles |
| `/app/staff/:staffId` | `StaffDetailPage` | Staff profile, schedule, performance |
| `/app/services` | `ServicesPage` | Service catalog with modifiers |
| `/app/policies` | `PoliciesPage` | Booking/cancellation policies |
| `/app/reminders` | `RemindersPage` | Reminder templates and scheduling |
| `/app/reports` | `ReportsPage` | Analytics with PDF/CSV export |
| `/app/settings` | `SettingsPage` | Organization and theme settings |

### Booking Routes (Public, under `/book/:orgSlug`)

| Path | Component | Description |
|------|-----------|-------------|
| `/book/:orgSlug` | Redirect | Redirects to `start` |
| `/book/:orgSlug/start` | `BookingStartPage` | Enter client info |
| `/book/:orgSlug/pets` | `BookingPetsPage` | Select/add pets |
| `/book/:orgSlug/groomer` | `BookingGroomerPage` | Choose groomer |
| `/book/:orgSlug/intake` | `BookingIntakePage` | Service selection per pet |
| `/book/:orgSlug/times` | `BookingTimesPage` | Pick appointment slot |
| `/book/:orgSlug/confirm` | `BookingConfirmPage` | Review and confirm |
| `/book/:orgSlug/success` | `BookingSuccessPage` | Confirmation screen |

## Context Providers

The app wraps everything in these providers (see `src/App.tsx`):

```
ErrorBoundary > QueryClientProvider > AuthProvider > ThemeProvider > BrowserRouter > KeyboardProvider > UndoProvider > ToastProvider > ShortcutTipsProvider
```

| Context | Hook | Purpose |
|---------|------|---------|
| `AuthProvider` | `useAuthContext()` | Supabase session management, auth state sync |
| `ThemeProvider` | `useTheme()` | 21-palette color theme system, persists to localStorage |
| `KeyboardProvider` | `useKeyboardShortcuts()` | Global keyboard shortcuts registration |
| `UndoProvider` | `useUndo()` | Soft-delete undo toast (5s auto-dismiss) |
| `ToastProvider` | `useToast()` | Toast notification system |
| `ShortcutTipsProvider` | `useShortcutTips()` | Periodic shortcut tip toasts (60-90s interval) |
| `BookingProvider` | `useBookingContext()` | Booking wizard state (used in booking flow) |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `S` | Toggle sidebar |
| `C` | Go to calendar |
| `Tab` | Cycle calendar views (calendar page only) |
| `A` | Book a new appointment |
| `T` | Cycle through color themes |
| `R` | Cycle report date ranges |
| `D` | Cycle dashboard issue ranges |
| `Shift + Up/Down` | Navigate sidebar menu |

## API Layer

### Architecture

All data persists in **Supabase** (PostgreSQL). The API layer (`src/modules/database/api/`) provides typed CRUD operations using the Supabase client.

- **Supabase Client**: `src/lib/supabase/client.ts` - Supabase client with PKCE auth config
- **Supabase Storage**: `src/lib/supabase/storage.ts` - File upload/download helpers (avatars, pet images, vaccination docs)
- **Type Mappers**: `src/modules/database/types/supabase-mappers.ts` - Map between Supabase row shapes and app domain types
- **Seed Data**: `scripts/seed-supabase.ts` - Supabase seed script for development data
- **Query Client**: `src/modules/database/config/queryClient.ts` - React Query configuration

### API Modules

| Module | File | Description |
|--------|------|-------------|
| `orgApi` | `orgApi.ts` | Organization CRUD |
| `clientsApi` | `clientsApi.ts` | Client management |
| `petsApi` | `petsApi.ts` | Pet profiles |
| `servicesApi` | `servicesApi.ts` | Service catalog + modifiers |
| `calendarApi` | `calendarApi.ts` | Appointment scheduling, status changes |
| `bookingApi` | `bookingApi.ts` | Public booking flow |
| `policiesApi` | `policiesApi.ts` | Booking policies |
| `remindersApi` | `remindersApi.ts` | Reminder schedules |
| `groomersApi` | `groomersApi.ts` | Groomer/staff profiles |
| `staffApi` | `staffApi.ts` | Staff management, availability, time-off |
| `historyApi` | `historyApi.ts` | Deleted items history (soft delete) |
| `paymentMethodsApi` | `paymentMethodsApi.ts` | Mock payment methods |
| `vaccinationRemindersApi` | `vaccinationRemindersApi.ts` | Vaccination tracking |
| `performanceApi` | `performanceApi.ts` | Staff performance metrics |

### React Query Hooks

Each API module has a corresponding hook in `src/modules/database/hooks/`:

`useOrganization`, `useClients`, `usePets`, `useServices`, `useCalendar`, `usePolicies`, `useReminders`, `useBooking`, `useGroomers`, `useHistory`, `usePaymentMethods`, `useVaccinationReminders`, `useStaff`, `usePerformance`

### Auth Hooks

From `src/modules/auth/hooks/`:

`useCurrentUser`, `useUsers`, `useLogin`, `useLogout`, `usePermissions`

## Data Types

All types are defined in `src/modules/database/types/index.ts` and `src/modules/auth/types/index.ts`, re-exported via `src/types/index.ts`.

### Core Domain Types

| Type | Key Fields |
|------|------------|
| `Organization` | id, name, slug, address, phone, email, timezone |
| `Client` | id, firstName, lastName, email, phone, preferredContactMethod, isNewClient, notificationPreferences, paymentMethods |
| `Pet` | id, clientId, name, species, breed, weight, weightRange, coatType, behaviorLevel, vaccinations, groomingNotes, medicalNotes |
| `Service` | id, name, description, baseDurationMinutes, basePrice, category, modifiers |
| `ServiceModifier` | id, name, type (weight/coat/breed/addon), condition, durationMinutes, priceAdjustment |
| `Appointment` | id, clientId, pets (AppointmentPet[]), groomerId, startTime, endTime, status, totalAmount, paymentStatus |
| `Groomer` | id, firstName, lastName, specialties, role (admin/groomer/receptionist), availability, timeOff |
| `User` | id, email, name, role, organizationId |

### Supporting Types

| Type | Purpose |
|------|---------|
| `VaccinationRecord` | Pet vaccination with name, dates, documentUrl |
| `BookingPolicies` | Deposit rules, cancellation windows, no-show fees |
| `ReminderSchedule` | Appointment reminder templates (48h, 24h, 2h) |
| `StaffAvailability` | Weekly schedule with day schedules and buffer times |
| `TimeOffRequest` | Staff time-off with approval status |
| `RolePermissions` | Per-role permission flags (admin/groomer/receptionist) |
| `PaymentMethod` | Card info (brand, last4, exp) |
| `BookingState` | Full booking wizard state (clientInfo includes optional address) |
| `DeletedItem` | Soft-deleted entity for undo functionality |
| `FeatureFlags` | Feature toggle config |
| `InAppNotification` | In-app notification record |
| `VaccinationReminder` | Vaccination expiry alerts |

### Enums and Union Types

- `AppointmentStatus`: requested | confirmed | checked_in | in_progress | completed | cancelled | no_show
- `PetSpecies`: dog | cat | other
- `CoatType`: short | medium | long | curly | double | wire
- `WeightRange`: small | medium | large | xlarge
- `BehaviorLevel`: 1-5 (calm to difficult)
- `PaymentStatus`: pending | processing | completed | failed
- `CardBrand`: visa | mastercard | amex | discover | unknown
- `NotificationChannel`: in_app | email
- Staff roles: admin | groomer | receptionist

## Component Library

All common components live in `src/modules/ui/components/common/`.

### Form Controls

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant` (primary/secondary/outline/ghost/danger/accent), `size` (sm/md/lg), `isLoading`, `disabled` | Neo-brutalist button with shadow effects |
| `Input` | `label`, `error`, `helperText`, standard input attrs | Text input with label and validation |
| `Textarea` | `label`, `error`, `helperText`, standard textarea attrs | Multi-line text input |
| `Select` | `label`, `error`, `options: SelectOption[]` | Dropdown select |
| `ComboBox` | `label`, `options: ComboBoxOption[]`, `value`, `onChange`, `placeholder` | Searchable dropdown with ARIA combobox pattern |
| `Toggle` | `label`, `checked`, `onChange` | Boolean toggle switch |
| `ImageUpload` | `value`, `onChange`, `label` | Image upload with base64 preview |
| `DocumentUpload` | `value`, `onChange`, `label`, `accept` | File upload component |
| `AddressAutocomplete` | `label`, `value`, `onChange`, `onSelect?`, `restrictToCountry?`, `error`, `helperText` | Google Maps Places address autocomplete with neo-brutalist dropdown. Falls back to plain input if API key missing. |
| `MiniCalendar` | `selectedDate`, `onDateSelect` | Compact calendar for date picking (day/week views) |

### Layout & Feedback

| Component | Props | Description |
|-----------|-------|-------------|
| `Card` | `colorVariant` (mint/lemon/lavender/pink/lime/peach/white), `padding` (none/sm/md/lg) | Card container with pastel variants |
| `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Standard React props | Card sub-components |
| `Modal` | `isOpen`, `onClose`, `title`, `size` (sm/md/lg/xl) | Modal dialog with backdrop |
| `Drawer` | `isOpen`, `onClose`, `title`, `side` | Slide-in drawer panel |
| `Badge` | `variant`, `children` | Status/label badge |
| `LoadingSpinner`, `LoadingPage` | size options | Loading indicators |
| `HistorySection` | `items`, `onRestore` | Deleted items history with restore |

## Design System

### Colors (defined in src/index.css)

```css
/* Primary - Soft Mint/Sage */
--color-primary-500: #6F8F72;
--color-primary-600: #5a7a5d;

/* Accent - Soft Peach/Lemon */
--color-accent-500: #F2A65A;

/* Ink/Border (navy) */
--color-ink: #1e293b;

/* Background */
--color-cream: #FAFAF8;

/* Text */
--color-charcoal: #334155;

/* Functional */
--color-success-500: #22c55e;
--color-warning-500: #f59e0b;
--color-danger-500: #ef4444;
```

#### Pastel Palette Colors

```css
--color-pastel-mint: #d1fae5;
--color-pastel-lemon: #fef9c3;
--color-pastel-lavender: #e9d5ff;
--color-pastel-pink: #fce7f3;
--color-pastel-lime: #ecfccb;
--color-pastel-peach: #fed7aa;
```

### Theme Palettes

21 theme palettes available via `useTheme()`. All share the same ink border (`#1e293b`). Default is `blueMango`.

#### Original Pastel Palettes (8)

| Theme | Accent | Accent Dark | Secondary | Description |
|-------|--------|-------------|-----------|-------------|
| **mint** | `#d1fae5` | `#a7f3d0` | `#fef9c3` | Soft mint/lime/lemon |
| **lavender** | `#e9d5ff` | `#c4b5fd` | `#ddd6fe` | Purple tones |
| **peach** | `#fed7aa` | `#fdba74` | `#fecaca` | Warm peach/coral |
| **ocean** | `#a5f3fc` | `#67e8f9` | `#99f6e4` | Cyan/teal |
| **rose** | `#fecdd3` | `#fda4af` | `#fbcfe8` | Pink/rose |
| **sunset** | `#fde68a` | `#fcd34d` | `#fed7aa` | Amber/gold |
| **forest** | `#bbf7d0` | `#86efac` | `#a7f3d0` | Green tones |
| **sky** | `#bae6fd` | `#7dd3fc` | `#e0f2fe` | Light blue |

#### Vibrant Palettes (6)

| Theme | Accent | Accent Dark | Secondary | Description |
|-------|--------|-------------|-----------|-------------|
| **skyButter** | `#4CC9FE` | `#37AFE1` | `#F5F4B3` | Sky blue + butter yellow |
| **oceanCitrus** | `#80D8C3` | `#4DA8DA` | `#FFD66B` | Teal + gold |
| **blueMango** | `#FFDE63` | `#799EFF` | `#FFBC4C` | Yellow + periwinkle blue |
| **aquaSunset** | `#FEEE91` | `#FFA239` | `#FF5656` | Aqua + warm sunset |
| **mintCreamsicle** | `#6AECE1` | `#26CCC2` | `#FFB76C` | Mint + creamsicle |
| **mintBlush** | `#FFD8DF` | `#A8DF8E` | `#FFAAB8` | Mint green + blush pink |

#### Dark/Earthy Palettes (7)

| Theme | Accent | Accent Dark | Secondary | Description |
|-------|--------|-------------|-----------|-------------|
| **plum** | `#DCA06D` | `#A55B4B` | `#4F1C51` | Dark plum + copper |
| **nautical** | `#D2C1B6` | `#456882` | `#234C6A` | Navy + sand |
| **sage** | `#E6D8C3` | `#5D866C` | `#C2A68C` | Sage green + warm tan |
| **slate** | `#A3B087` | `#435663` | `#FFF8D4` | Slate blue + olive |
| **taupe** | `#E1D0B3` | `#A18D6D` | `#703B3B` | Warm taupe + burgundy |
| **olive** | `#D2DCB6` | `#A1BC98` | `#778873` | Olive green tones |
| **terra** | `#E5BA41` | `#D1855C` | `#94A378` | Earth tones + gold |

### Neo-Brutalist Styling Patterns

#### Border & Shadow Standards

```css
/* Standard border */
border: 2px solid #1e293b;
/* Tailwind: border-2 border-[#1e293b] */

/* Border radius */
border-radius: 0.75rem;  /* rounded-xl - primary */
border-radius: 0.5rem;   /* rounded-lg - secondary */
border-radius: 1rem;     /* rounded-2xl - cards/modals */

/* Shadow sizes */
shadow-[2px_2px_0px_0px_#1e293b]  /* sm - inputs, small buttons */
shadow-[3px_3px_0px_0px_#1e293b]  /* default - cards, buttons */
shadow-[4px_4px_0px_0px_#1e293b]  /* lg - hover states, modals */

/* Named utility classes (defined in index.css) */
.shadow-pastel-sm  /* 2px shadow */
.shadow-pastel     /* 3px shadow */
.shadow-pastel-lg  /* 4px shadow */
.border-ink        /* border-color: #1e293b */
.text-ink          /* color: #1e293b */
.text-charcoal     /* color: #334155 */
```

#### Interactive States

```css
/* Hover - lift up and expand shadow */
hover:-translate-y-0.5
hover:shadow-[4px_4px_0px_0px_#1e293b]

/* Active/Pressed - push down and shrink shadow */
active:translate-y-0
active:shadow-[1px_1px_0px_0px_#1e293b]

/* Alternative pressed effect (more pronounced) */
translate-x-[2px] translate-y-[2px]
shadow-[1px_1px_0px_0px_#1e293b]
```

#### Animation Utilities (defined in index.css)

```css
/* Entrance animations */
.animate-fade-in     /* 150ms ease-out */
.animate-fade-out    /* 150ms ease-out */
.animate-scale-in    /* 150ms ease-out (0.95 -> 1) */
.animate-scale-out   /* 100ms ease-out (1 -> 0.95) */
.animate-slide-up    /* 150ms ease-out (8px -> 0) */
.animate-slide-down  /* 150ms ease-out (-8px -> 0) */

/* Stagger delays for lists (.stagger-item starts opacity:0) */
.stagger-1 through .stagger-8  /* 25ms increments */

/* Modal & dropdown specific */
.modal-backdrop-enter   /* fade-in */
.modal-content-enter    /* scale-in */
.dropdown-enter         /* scale-in from top */
.dropdown-exit          /* scale-out to top */
```

### Theme Usage

#### Using the useTheme() Hook

```tsx
import { useTheme } from '@/modules/ui/context/ThemeContext'

function MyComponent() {
  const { currentTheme, setTheme, colors } = useTheme()

  return (
    <div
      className={colors.pageGradient}
      style={{ borderColor: colors.inkBorder }}
    >
      <p>Current theme: {currentTheme}</p>
      <button onClick={() => setTheme('lavender')}>
        Switch to Lavender
      </button>
    </div>
  )
}
```

#### CSS Variables (set by ThemeContext on document root)

```css
var(--accent-color)           /* Theme accent color */
var(--accent-color-light)     /* Lighter variant */
var(--accent-color-dark)      /* Darker variant */
var(--secondary-accent)       /* Secondary/complementary color */
var(--ink-border)             /* Border color (#1e293b) */
var(--gradient-from)          /* Gradient start */
var(--gradient-via)           /* Gradient middle */
var(--gradient-to)            /* Gradient end */
var(--text-on-primary)        /* Contrast text for accent bg */
var(--text-on-accent)         /* Contrast text for accentDark bg */
var(--text-on-secondary)      /* Contrast text for secondary bg */
var(--text-on-accent-light)   /* Contrast text for accentLight bg */
var(--text-on-sidebar)        /* Contrast text for sidebar gradient bg */
```

#### ThemeColors Object Properties

```ts
interface ThemeColors {
  sidebarGradient: string      // Tailwind gradient class for sidebar
  pageGradient: string         // Full page gradient class
  pageGradientLight: string    // Lighter gradient (30% opacity)
  accentColor: string          // Hex value
  accentColorLight: string     // Hex value
  accentColorDark: string      // Hex value
  secondaryAccent: string      // Hex value
  inkBorder: string            // #1e293b
  gradientFrom: string         // Hex value
  gradientVia: string          // Hex value
  gradientTo: string           // Hex value
  // Dynamic text contrast colors (computed via WCAG luminance)
  textOnPrimary: string        // Text color for accentColor background
  textOnAccent: string         // Text color for accentColorDark background
  textOnSecondary: string      // Text color for secondaryAccent background
  textOnAccentLight: string    // Text color for accentColorLight background
  textOnSidebar: string        // Text color for sidebar gradient
}
```

### Component Styling Conventions

#### Card Pattern

```tsx
// Standard card
<div className="rounded-2xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b]">

// Card with pastel background
<Card colorVariant="mint">  // mint | lemon | lavender | pink | lime | peach | white

// Card padding options
<Card padding="none">  // none | sm (p-3) | md (p-4) | lg (p-6)
```

#### Button Variants

```tsx
// Primary (green) - main actions
<Button variant="primary">Save</Button>

// Secondary (lemon pastel) - secondary actions
<Button variant="secondary">Cancel</Button>

// Outline (white background) - tertiary actions
<Button variant="outline">Details</Button>

// Ghost (transparent, no border until hover)
<Button variant="ghost">Menu</Button>

// Danger (red) - destructive actions
<Button variant="danger">Delete</Button>

// Accent (accent color)
<Button variant="accent">Highlight</Button>

// Sizes: sm | md | lg
<Button size="sm">Small</Button>  // px-3 py-1.5 text-sm
<Button size="md">Medium</Button> // px-4 py-2 text-sm (default)
<Button size="lg">Large</Button>  // px-6 py-3 text-base
```

#### Form Input Pattern

```tsx
// Standard input styling
<input className={cn(
  'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2',
  'text-[#334155] placeholder-[#94a3b8]',
  'focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
  'disabled:cursor-not-allowed disabled:bg-gray-50'
)} />

// Using Input component
<Input
  label="Email"
  error="Invalid email"
  helperText="We'll never share your email"
/>
```

#### Modal Pattern

```tsx
// Modal container
<div className="rounded-2xl border-2 border-[#1e293b] bg-white p-6 shadow-[4px_4px_0px_0px_#1e293b]">

// Using Modal component
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  size="md"  // sm | md | lg | xl
>
  {children}
</Modal>
```

### Spacing & Typography

#### Spacing Scale (Tailwind defaults)

```
p-2 / m-2   = 0.5rem (8px)   - tight spacing
p-3 / m-3   = 0.75rem (12px) - compact elements
p-4 / m-4   = 1rem (16px)    - standard padding
p-6 / m-6   = 1.5rem (24px)  - generous spacing
gap-2       = 0.5rem         - tight gaps
gap-3       = 0.75rem        - standard gaps
gap-4       = 1rem           - comfortable gaps
```

#### Typography Scale

```
text-xs     = 0.75rem (12px) - helper text, badges
text-sm     = 0.875rem (14px) - body text, buttons
text-base   = 1rem (16px)    - large body text
text-lg     = 1.125rem (18px) - card titles
text-xl     = 1.25rem (20px) - section headers
text-2xl    = 1.5rem (24px)  - page titles
```

#### Font Weights

```
font-medium    = 500 - regular body text
font-semibold  = 600 - emphasized text, labels
font-bold      = 700 - headings, titles
font-extrabold = 800 - major headings
```

#### Font Family

```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

#### Text Colors

```
text-[#1e293b]  - ink color for headings, important text
text-[#334155]  - charcoal for body text
text-[#64748b]  - muted text, helper text
text-[#94a3b8]  - placeholder text
text-white      - on colored backgrounds
```

## Code Conventions

### File Organization

- **Max 200-300 lines per file** - Extract components when exceeding
- **Barrel exports** - Use `index.ts` files for clean imports
- **Colocation** - Keep related components in feature folders under `src/modules/ui/components/`
- **Path aliases** - Use `@/` to reference `src/` (configured in Vite + TSConfig)

### Component Patterns

```tsx
// Props interface exported for reuse
export interface MyComponentProps {
  data: SomeType
  onAction: (id: string) => void
}

// Functional component with proper typing
export function MyComponent({ data, onAction }: MyComponentProps) {
  // Component logic
}
```

### State Management

- **Server state**: React Query hooks in `src/modules/database/hooks/`
- **Auth state**: Auth hooks in `src/modules/auth/hooks/`
- **Local state**: `useState` for component-level state
- **Theme state**: `ThemeContext` for app-wide theming (persisted to localStorage)
- **Keyboard state**: `KeyboardContext` for global shortcut registration
- **Undo state**: `UndoContext` for soft-delete undo toasts
- **Booking state**: `BookingContext` for booking wizard flow

### Authorization Patterns

```tsx
// Role-based permissions via usePermissions hook
const { canManageStaff, canViewReports } = usePermissions()

// Declarative permission gating
<PermissionGate requires="canManageStaff" fallback={<NotAllowed />}>
  <StaffManagement />
</PermissionGate>
```

Three roles: `admin` (full access), `groomer` (own appointments + clients), `receptionist` (calendar + clients + booking).

### ARIA / Accessibility Patterns

- `role="dialog"` on modals with `aria-modal="true"`
- ComboBox and AddressAutocomplete implement full ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-activedescendant`)
- `aria-label` on icon-only buttons
- Focus management in modals and drawers

### Feature Flags

Feature flags are defined in `src/config/flags.ts`:

```ts
featureFlags: {
  multiStaffScheduling: false,
  onlinePayments: false,
  emailReminders: true,
  clientPortal: true,
  petPhotos: false,
  inventoryManagement: false,
}
```

Check flags with `isFeatureEnabled('flagName')`.

## Commands

```bash
npm run dev           # Start Vite dev server (localhost:5173)
npm run build         # TypeScript check + production build
npm run lint          # ESLint
npm run preview       # Preview production build
npm run test          # Run Vitest in watch mode
npm run test:run      # Run Vitest once
npm run test:coverage # Run Vitest with coverage
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run Playwright with UI
```

## Testing

- **Unit Tests**: Vitest + React Testing Library, jsdom environment
  - Setup: `src/test/setup.ts`
  - Config: `vitest.config.ts`
  - Test files: `*.test.ts` / `*.test.tsx` (6 test files currently)
- **E2E Tests**: Playwright (Chromium)
  - Config: `playwright.config.ts`
  - Tests: `e2e/` directory (1 spec currently: `calendar-month-view.spec.ts`)

## Working with This Codebase

### Adding a New Page

1. Create page component in `src/modules/ui/pages/app/` or `src/modules/ui/pages/book/`
2. Export from the folder's `index.ts`
3. Add route in `src/App.tsx`
4. Add navigation link in `src/modules/ui/components/layout/Sidebar.tsx`

### Adding a New Component

1. Create in appropriate `src/modules/ui/components/[feature]/` folder
2. Export from folder's `index.ts`
3. Keep under 300 lines - extract sub-components if needed

### Adding a New API Domain

1. Create API file in `src/modules/database/api/` (e.g., `newDomainApi.ts`)
2. Export from `src/modules/database/api/index.ts`
3. Create React Query hook in `src/modules/database/hooks/` (e.g., `useNewDomain.ts`)
4. Export from `src/modules/database/hooks/index.ts`
5. Add types to `src/modules/database/types/index.ts`

### Modifying the Calendar

- Main page: `src/modules/ui/pages/app/CalendarPage.tsx`
- Components: `src/modules/ui/components/calendar/`
- Styles: `src/index.css` (`.rbc-*` classes)

### Modifying Reports

- Main page: `src/modules/ui/pages/app/ReportsPage.tsx`
- Charts: `src/modules/ui/components/reports/`
- PDF export: `src/lib/utils/reportPdfExport.ts`
- CSV export: `src/lib/utils/reportCsvExport.ts`

### Modifying the Theme

- Theme definitions: `src/modules/ui/context/ThemeContext.tsx`
- CSS variables applied to `:root` dynamically
- Nav link styles use CSS variables: `.nav-link-active`, `.nav-link-inactive` (in `src/index.css`)
- Text contrast computed automatically using WCAG luminance via `src/lib/utils/contrast.ts`

## Notes

### Current Limitations

- **Stripe integration is mocked** - `src/lib/stripe/mockStripe.ts` simulates payment processing
- **Email notifications are mocked** - `src/modules/notifications/services/` has mock implementations (email-first strategy: all notifications route to email via Resend)
- **Legacy directories exist** - `src/components/`, `src/hooks/`, `src/lib/api/`, `src/types/` are re-export shims for backwards compatibility with the modular architecture under `src/modules/`

### Active Integrations

- **Supabase** - Database, auth, and storage
  - Client: `src/lib/supabase/client.ts` (PKCE flow, session persistence)
  - Storage helpers: `src/lib/supabase/storage.ts` (file uploads to Supabase Storage buckets)
  - Auth: `src/modules/auth/api/authApi.ts` (signInWithPassword, signInWithOAuth)
  - Auth context: `src/modules/auth/context/AuthContext.tsx` (session init + auth state listener)
  - OAuth callback: `src/modules/auth/pages/AuthCallbackPage.tsx`
  - Migrations: `supabase/migrations/` (4 files: schema, RLS, storage, OAuth trigger)
  - Type mappers: `src/modules/database/types/supabase-mappers.ts`
  - Env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`

- **Google Maps Places API** - Address autocomplete on client, organization, and booking forms
  - Packages: `use-places-autocomplete`, `@googlemaps/js-api-loader` v2, `@types/google.maps`
  - Loader hook: `src/hooks/useGoogleMapsLoader.ts` (uses v2 functional API: `setOptions()` + `importLibrary()`)
  - Component: `src/modules/ui/components/common/AddressAutocomplete.tsx`
  - Env var: `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`
  - Used in: `SettingsPage` (org address), `ClientsPage` (client form), `BookingStartPage` (new client)
  - Falls back to plain `<input>` if API key is missing or Google Maps fails to load
  - Restricted to US addresses by default (`restrictToCountry` prop)

### Stripe Subscription Billing (Active)

- **Plans**: Solo ($45/mo, $432/yr) and Studio ($95/mo, $912/yr) with 14-day free trial
- **Checkout**: Stripe Checkout redirect (not embedded)
- **Billing management**: Stripe Customer Portal (self-service upgrade/downgrade/cancel)
- **Edge Functions**: `create-checkout-session`, `create-portal-session`, `stripe-webhook` in `supabase/functions/`
- **Database**: `subscriptions` table (one per org), `billing_events` audit log, `stripe_customer_id` on organizations
- **Feature gating**: `SubscriptionGate` component + `SubscriptionContext` provider
  - Studio-only features: multipleStaff, rolePermissions, serviceModifiers, advancedReports, staffScheduling, performanceTracking
  - Config in `src/config/subscriptionGates.ts`
- **Dev bypass**: Set `VITE_DEV_BYPASS_SUBSCRIPTION=true` in `.env.local` to unlock all features without a real subscription
- **Reference**: See `stripeintegration.md` for full setup details (product IDs, webhook events, test cards, CLI commands)
- **Env vars needed**: `VITE_STRIPE_PUBLISHABLE_KEY` (frontend), Stripe secrets in Supabase Edge Function secrets

### Planned Integrations

- **Resend** - Email notifications and reminders (all notification types: appointment confirmations, reminders, cancellations, vaccination alerts). Email is the sole external notification channel.
- **PostHog** - Product analytics and feature flags
- **Vercel** - Hosting and deployment
