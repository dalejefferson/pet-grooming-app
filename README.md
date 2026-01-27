# Pet Grooming Pro

A multi-tenant SaaS MVP for pet grooming businesses. This frontend application provides an admin interface for managing appointments, clients, pets, and services, along with a public booking portal for customers.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM v7
- **Calendar**: react-big-calendar
- **Icons**: Lucide React
- **Dates**: date-fns
- **Testing**: Vitest + React Testing Library

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd pet-grooming-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase Configuration (placeholder - not yet integrated)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe Configuration (placeholder - not yet integrated)
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

**Note**: The current implementation uses mock APIs with localStorage. Supabase and Stripe integrations are placeholder files ready for future implementation.

## Running the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Type checking
npm run lint
```

The development server runs at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (Button, Input, Modal, etc.)
│   └── layout/          # Layout components (Sidebar, Header, AppLayout)
├── config/
│   ├── constants.ts     # App constants, status colors, labels
│   └── flags.ts         # Feature flags for gradual rollout
├── context/             # React context providers
├── hooks/               # Custom React hooks (TanStack Query wrappers)
├── lib/
│   ├── api/             # Mock API layer with localStorage
│   │   ├── authApi.ts
│   │   ├── bookingApi.ts
│   │   ├── calendarApi.ts
│   │   ├── clientsApi.ts
│   │   ├── orgApi.ts
│   │   ├── petsApi.ts
│   │   ├── policiesApi.ts
│   │   ├── remindersApi.ts
│   │   ├── seed.ts      # Seed data for development
│   │   ├── servicesApi.ts
│   │   └── storage.ts   # localStorage utilities
│   ├── stripe/          # Stripe integration placeholder
│   ├── supabase/        # Supabase integration placeholder
│   ├── queryClient.ts   # TanStack Query configuration
│   └── utils.ts         # Utility functions
├── pages/
│   ├── app/             # Admin interface pages
│   │   ├── CalendarPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── ClientDetailPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PetsPage.tsx
│   │   ├── PetDetailPage.tsx
│   │   ├── PoliciesPage.tsx
│   │   ├── RemindersPage.tsx
│   │   ├── ServicesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── auth/            # Authentication pages
│   │   └── LoginPage.tsx
│   └── book/            # Public booking flow pages
│       ├── BookingStartPage.tsx
│       ├── BookingPetsPage.tsx
│       ├── BookingIntakePage.tsx
│       ├── BookingTimesPage.tsx
│       ├── BookingConfirmPage.tsx
│       └── BookingSuccessPage.tsx
├── test/                # Test setup and utilities
├── types/               # TypeScript type definitions
├── App.tsx              # Main app with routing
└── main.tsx             # Application entry point
```

## Features

### Admin Interface (`/app/*`)

- **Dashboard**: Overview of today's appointments, upcoming bookings, and quick stats
- **Calendar**: Day and week views with drag-and-drop appointment management
- **Clients**: Client management with search, contact info, and visit history
- **Pets**: Pet profiles with species, breed, weight, coat type, and behavior notes
- **Services**: Service catalog with pricing tiers by weight range and modifiers
- **Policies**: Booking policies including deposits, cancellations, and no-show fees
- **Reminders**: Configurable SMS/email reminder templates and schedules
- **Settings**: Organization settings and preferences

### Public Booking Portal (`/book/:orgSlug/*`)

Multi-step booking flow:
1. **Start**: Client identification (email lookup or new client)
2. **Pets**: Select existing pets or add new ones
3. **Intake**: Service selection with intake questions
4. **Times**: Calendar view of available time slots
5. **Confirm**: Review booking details and policies
6. **Success**: Confirmation with appointment details

## Mock API & Seed Data

The application uses localStorage-backed mock APIs for development. Seed data is automatically loaded on first run, including:

- Sample organization ("Pawfect Grooming")
- Admin and staff users
- Sample clients and pets
- Services with modifiers (Full Groom, Bath & Brush, Nail Trim, etc.)
- Booking policies and reminder templates
- Sample appointments

To reset seed data, clear localStorage:
```javascript
localStorage.clear()
// Refresh the page
```

## Backend Integration Points

### Supabase Integration

Placeholder files are located at `src/lib/supabase/`. To integrate:

1. Set up a Supabase project
2. Create database tables matching the types in `src/types/`
3. Update `src/lib/supabase/client.ts` with initialization
4. Replace mock API calls with Supabase queries in the API modules

### Stripe Integration

Placeholder files are located at `src/lib/stripe/`. To integrate:

1. Set up a Stripe account
2. Update `src/lib/stripe/client.ts` with initialization
3. Implement payment processing in `BookingConfirmPage.tsx`
4. Add webhook handlers for payment events

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Test files are co-located with source files using the `.test.ts` or `.test.tsx` extension.

## Type Safety

All data structures are fully typed. Key types include:

- `Organization` - Multi-tenant organization data
- `User` - Admin and staff users
- `Client` - Customer records
- `Pet` - Pet profiles with medical info
- `Service` - Service offerings with pricing
- `ServiceModifier` - Add-on options for services
- `Appointment` - Booking records
- `BookingPolicies` - Configurable business rules
- `ReminderSchedule` - Automated reminder settings

## Feature Flags

Feature flags in `src/config/flags.ts` control gradual feature rollout:

- `onlineBooking` - Public booking portal
- `smsReminders` - SMS notification support
- `stripePayments` - Payment processing
- `multipleLocations` - Multi-location support
- `staffScheduling` - Staff schedule management

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run type checking: `npm run lint`
5. Submit a pull request

## License

MIT
