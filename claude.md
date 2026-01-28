# Pet Grooming App - Claude Code Guide

## Project Overview

A pet grooming salon management SaaS application built with React 19, TypeScript, and TailwindCSS 4.1. Features a **pastel neo-brutalist** design aesthetic with navy borders (#1e293b), offset shadows, and rounded corners.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: TailwindCSS 4.1 with custom theme variables
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM v7
- **Calendar**: react-big-calendar with drag-and-drop
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (Button, Card, Modal, etc.)
│   ├── layout/          # App layout (Sidebar, Header, AppLayout)
│   ├── booking/         # Booking flow components
│   ├── calendar/        # Calendar page components
│   ├── groomers/        # Groomer management components
│   ├── pets/            # Pet detail page components
│   ├── reports/         # Reports page components
│   └── services/        # Service management components
├── pages/
│   ├── app/             # Protected app pages (Dashboard, Calendar, etc.)
│   └── book/            # Public booking portal pages
├── hooks/               # Custom React hooks
├── lib/
│   ├── api/             # API layer with localStorage persistence
│   └── utils/           # Utility functions
├── context/             # React contexts (Theme)
├── config/              # Constants and configuration
└── types/               # TypeScript type definitions
```

## Design System

### Colors (defined in src/index.css)
- **Primary**: Soft Mint/Sage (#6F8F72)
- **Accent**: Soft Peach/Lemon (#F2A65A)
- **Ink/Border**: Navy (#1e293b)
- **Background**: Cream (#FAFAF8)
- **Pastels**: mint, lemon, lavender, pink, lime, peach

### Neo-Brutalist Styling
```css
/* Standard card/button styling */
border: 2px solid #1e293b;
border-radius: 0.75rem; /* rounded-xl */
box-shadow: 3px 3px 0px 0px #1e293b;
```

### Theme Context
Three color palettes available: mint (default), lavender, peach. Access via `useTheme()` hook.

## Code Conventions

### File Organization
- **Max 200-300 lines per file** - Extract components when exceeding
- **Barrel exports** - Use index.ts files for clean imports
- **Colocation** - Keep related components in feature folders

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
- **Server state**: React Query hooks in `src/hooks/`
- **Local state**: useState for component-level state
- **Theme state**: ThemeContext for app-wide theming

### API Layer
- Uses localStorage for persistence (see `src/lib/api/storage.ts`)
- Each domain has its own API file (clientsApi, petsApi, etc.)
- Mock data seeded on first load (see `src/lib/api/seed.ts`)

## Key Features

### App Pages (Protected)
- **Dashboard**: Stats overview with clickable cards
- **Calendar**: Day/Week/Month views with drag-and-drop scheduling
- **Clients**: Client management with pet linking
- **Pets**: Pet profiles with vaccinations, grooming history
- **Groomers**: Staff management with specialties
- **Services**: Service catalog with modifiers
- **Reports**: Analytics with PDF/CSV export
- **Settings**: Organization and theme settings

### Booking Portal (Public)
Flow: Start → Pets → Groomer → Services → Times → Confirm → Success

### Calendar Features
- Drag-and-drop rescheduling
- Mini calendar navigation (day/week views)
- Appointment status management (No Show, Canceled with notes)
- Hover popups with appointment details

## Commands

```bash
npm run dev      # Start development server
npm run build    # TypeScript check + production build
npm run test     # Run tests
npm run lint     # ESLint
```

## Working with This Codebase

### Adding a New Page
1. Create page component in `src/pages/app/` or `src/pages/book/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

### Adding a New Component
1. Create in appropriate `src/components/[feature]/` folder
2. Export from folder's `index.ts`
3. Keep under 300 lines - extract sub-components if needed

### Modifying the Calendar
- Main page: `src/pages/app/CalendarPage.tsx`
- Components: `src/components/calendar/`
- Styles: `src/index.css` (`.rbc-*` classes)

### Modifying Reports
- Main page: `src/pages/app/ReportsPage.tsx`
- Charts: `src/components/reports/`
- PDF export: `src/lib/utils/reportPdfExport.ts`
- CSV export: `src/lib/utils/reportCsvExport.ts`

## Data Types

Key types defined in `src/types/index.ts`:
- `Client`, `Pet`, `Groomer`, `Service`, `Appointment`
- `Organization`, `Reminder`, `Policy`
- Booking flow types: `BookingSlot`, `ServiceModifier`

## Testing

Tests use Vitest + React Testing Library. Run with `npm run test`.

## Notes

- No backend - all data persists in localStorage
- Stripe integration is placeholder only
- Supabase client exists but is not connected
- Images use base64 data URLs for local storage

---

## Design System Reference

### Color Palettes

Eight theme palettes available via `useTheme()`. All share the same ink border (`#1e293b`).

| Theme | Accent | Accent Light | Accent Dark | Secondary | Gradient From | Gradient Via | Gradient To |
|-------|--------|--------------|-------------|-----------|---------------|--------------|-------------|
| **mint** (default) | `#d1fae5` | `#ecfccb` | `#a7f3d0` | `#fef9c3` | `#ecfccb` | `#d1fae5` | `#fef9c3` |
| **lavender** | `#e9d5ff` | `#f3e8ff` | `#c4b5fd` | `#ddd6fe` | `#e9d5ff` | `#ddd6fe` | `#f3e8ff` |
| **peach** | `#fed7aa` | `#ffedd5` | `#fdba74` | `#fecaca` | `#fed7aa` | `#fecaca` | `#ffedd5` |
| **ocean** | `#a5f3fc` | `#cffafe` | `#67e8f9` | `#99f6e4` | `#a5f3fc` | `#99f6e4` | `#cffafe` |
| **rose** | `#fecdd3` | `#fce7f3` | `#fda4af` | `#fbcfe8` | `#fecdd3` | `#fbcfe8` | `#fce7f3` |
| **sunset** | `#fde68a` | `#fef3c7` | `#fcd34d` | `#fed7aa` | `#fde68a` | `#fed7aa` | `#fef3c7` |
| **forest** | `#bbf7d0` | `#dcfce7` | `#86efac` | `#a7f3d0` | `#bbf7d0` | `#a7f3d0` | `#dcfce7` |
| **sky** | `#bae6fd` | `#e0f2fe` | `#7dd3fc` | `#e0f2fe` | `#bae6fd` | `#e0f2fe` | `#f0f9ff` |

#### Core Design Colors (src/index.css)
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

#### CSS Variables (set by ThemeContext)
```css
var(--accent-color)        /* Theme accent color */
var(--accent-color-light)  /* Lighter variant */
var(--accent-color-dark)   /* Darker variant */
var(--secondary-accent)    /* Secondary/complementary color */
var(--ink-border)          /* Border color (#1e293b) */
var(--gradient-from)       /* Gradient start */
var(--gradient-via)        /* Gradient middle */
var(--gradient-to)         /* Gradient end */
```

#### ThemeColors Object Properties
```ts
interface ThemeColors {
  sidebarGradient: string      // Tailwind gradient class
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
