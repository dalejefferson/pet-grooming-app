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
