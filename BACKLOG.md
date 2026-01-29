# Product Backlog

## How to Read This Backlog
- **Priority**: P0 (critical), P1 (high), P2 (medium), P3 (nice-to-have)
- **Complexity**: S (small, 1-2 days), M (medium, 3-5 days), L (large, 1-2 weeks), XL (extra-large, 2-4 weeks)
- **Status**: Planned, In Progress, Done

---

## P0 - Foundation (Must Have for Launch)

### F-001: Supabase Auth & Database
- **Description**: Migrate from localStorage to Supabase for authentication, database, and file storage. Multi-tenant architecture where each salon is an organization.
- **Acceptance Criteria**:
  - Users can sign up/login with email or Google OAuth
  - All data persisted in PostgreSQL with RLS
  - Pet photos and documents stored in Supabase Storage
  - Existing data model fully migrated
- **Dependencies**: None
- **Complexity**: XL
- **Status**: Planned

### F-002: Unlimited Clients and Pets
- **Description**: Remove any client/pet limits. Support scalable client and pet management with pagination, search, and filtering. Ensure database schema supports unlimited records with proper indexing.
- **Acceptance Criteria**:
  - No hard limits on client or pet records
  - Pagination on client and pet list pages
  - Search and filter performance remains fast at 10k+ records
  - Bulk import capability (CSV)
- **Dependencies**: F-001 (Supabase)
- **Complexity**: M
- **Status**: Planned

### F-003: Stripe Payment Integration
- **Description**: Accept payments for grooming services via Stripe. Save cards on file, process payments at checkout, generate receipts.
- **Acceptance Criteria**:
  - Stripe Elements card input at booking and checkout
  - Save card on file for repeat clients
  - Process payment when service is completed
  - Generate and email receipts
  - Refund capability from admin dashboard
- **Dependencies**: F-001 (Supabase), F-010 (Resend for receipts)
- **Complexity**: L
- **Status**: Planned

### F-004: Square Payment Integration
- **Description**: Alternative payment processor for salons that prefer Square. Support same features as Stripe integration.
- **Acceptance Criteria**:
  - Square Web Payments SDK integration
  - Save card on file
  - Process payments
  - Salon can choose Stripe OR Square in settings
- **Dependencies**: F-001 (Supabase)
- **Complexity**: L
- **Status**: Planned

### F-005: Charge No-Show Fee
- **Description**: Automatically or manually charge clients who no-show for appointments. Configurable fee per service or flat rate.
- **Acceptance Criteria**:
  - Card on file required at booking (configurable)
  - When appointment marked "No Show", option to charge fee
  - Configurable no-show fee (percentage or flat amount) per service
  - Client notification before and after charge
  - No-show charge history in client profile
- **Dependencies**: F-003 (Stripe) or F-004 (Square)
- **Complexity**: M
- **Status**: Planned

---

## P1 - Core Features (High Value)

### F-006: Google Calendar Sync
- **Description**: Two-way sync between app calendar and Google Calendar for groomers. Appointments created in either system reflect in both.
- **Acceptance Criteria**:
  - OAuth connection to Google Calendar per groomer
  - New appointments sync to Google Calendar
  - Google Calendar events block availability in app
  - Edits and cancellations sync both ways
  - Sync status indicator in settings
- **Dependencies**: F-001 (Supabase)
- **Complexity**: L
- **Status**: Planned

### F-007: Mass Texting (SMS Marketing)
- **Description**: Send bulk SMS messages to client segments. Templates, scheduling, and opt-out management.
- **Acceptance Criteria**:
  - Segment clients by: last visit date, pet type, services used, location
  - SMS template builder with variable substitution ({clientName}, {petName}, etc.)
  - Schedule sends for future date/time
  - Opt-in/opt-out management (TCPA compliant)
  - Delivery status tracking
  - Usage dashboard with send counts
- **Dependencies**: F-001 (Supabase), Twilio integration
- **Complexity**: L
- **Status**: Planned

### F-008: Coupon System
- **Description**: Create and manage discount coupons for services. Support percentage and fixed-amount discounts with usage limits and expiration.
- **Acceptance Criteria**:
  - Create coupons: code, type (% or $), amount, expiration, usage limit
  - Apply coupon at booking checkout
  - Restrict coupons to specific services or client segments
  - Track coupon usage and revenue impact
  - Auto-expire coupons past expiration date
  - First-time client discount option
- **Dependencies**: F-003 (Stripe) or F-004 (Square)
- **Complexity**: M
- **Status**: Planned

### F-009: Gift Card System
- **Description**: Sell and redeem digital gift cards. Purchasable online or in-salon with custom amounts and designs.
- **Acceptance Criteria**:
  - Purchase gift cards with custom amount ($25, $50, $100, custom)
  - Email delivery with unique code and design
  - Redeem at checkout (partial or full balance)
  - Check balance online
  - Gift card management dashboard (issued, redeemed, outstanding balance)
  - Expiration policy (configurable or no expiration per local law)
- **Dependencies**: F-003 (Stripe), F-010 (Resend)
- **Complexity**: L
- **Status**: Planned

### F-010: Transactional Email (Resend)
- **Description**: Send automated emails for booking confirmations, reminders, receipts, and account management via Resend.
- **Acceptance Criteria**:
  - Booking confirmation email
  - Appointment reminder email (configurable: 24h, 48h before)
  - Payment receipt email
  - Password reset email
  - Branded email templates matching salon theme
- **Dependencies**: F-001 (Supabase)
- **Complexity**: M
- **Status**: Planned

---

## P2 - Growth Features (Medium Priority)

### F-011: Dynamic Routing for Multi-Location
- **Description**: Support salons with multiple locations. Dynamic URL routing (e.g., /book/downtown, /book/westside) with location-specific staff, services, and availability.
- **Acceptance Criteria**:
  - Location management in settings (name, address, hours, staff)
  - Dynamic booking URLs per location
  - Location selector in booking flow
  - Dashboard and reports filterable by location
  - Staff can be assigned to one or multiple locations
  - Google Maps integration showing all locations
- **Dependencies**: F-001 (Supabase), F-014 (Google Maps)
- **Complexity**: XL
- **Status**: Planned

### F-012: QuickBooks Sync
- **Description**: Sync financial data (invoices, payments, expenses) with QuickBooks Online for accounting.
- **Acceptance Criteria**:
  - OAuth connection to QuickBooks Online
  - Sync completed appointments as invoices
  - Sync payments received
  - Map services to QuickBooks items
  - Sync customer records
  - Manual and automatic sync options
  - Sync status dashboard with error handling
- **Dependencies**: F-001 (Supabase), F-003 (Stripe)
- **Complexity**: XL
- **Status**: Planned

### F-013: Product Analytics (PostHog)
- **Description**: Integrate PostHog for product analytics, feature flags, and session recording.
- **Acceptance Criteria**:
  - Page view and event tracking
  - Booking funnel analytics
  - Feature flag system for gradual rollout
  - Session recording for UX research
  - Custom dashboards for key metrics
- **Dependencies**: F-001 (Supabase)
- **Complexity**: M
- **Status**: Planned

### F-014: Google Maps Integration
- **Description**: Display salon location on booking pages, enable location-based features.
- **Acceptance Criteria**:
  - Map embed on booking page showing salon location
  - Directions link
  - Geocoding for address validation
  - Distance calculation for multi-location routing
- **Dependencies**: None
- **Complexity**: S
- **Status**: Planned

### F-015: Personal Phone Numbers
- **Description**: Provision dedicated phone numbers for salon users via Twilio. Enable direct client communication without exposing personal numbers.
- **Acceptance Criteria**:
  - Provision local phone number per user/salon
  - Inbound SMS goes to app inbox
  - Outbound SMS from provisioned number
  - Call forwarding to personal number (configurable)
  - Number porting support
  - Monthly billing per number
- **Dependencies**: F-001 (Supabase), Twilio
- **Complexity**: L
- **Status**: Planned

---

## P3 - Future Features (Nice to Have)

### F-016: Connected Mobile App
- **Description**: Native mobile app (React Native or Expo) connected to the same Supabase backend. Groomers can manage schedule on-the-go, clients can book and manage appointments.
- **Acceptance Criteria**:
  - Groomer app: view schedule, update appointment status, view client/pet details
  - Client app: book appointments, view upcoming, manage pets
  - Push notifications for appointment reminders
  - Offline capability for viewing schedule
  - Camera integration for pet photos
- **Dependencies**: F-001 (Supabase), all core integrations
- **Complexity**: XL
- **Status**: Planned

### F-017: Offline/Online File Access
- **Description**: Enable key data (today's schedule, client info, pet records) to be accessible offline with sync when back online.
- **Acceptance Criteria**:
  - Service worker for offline capability
  - Cache today's appointments and related client/pet data
  - Queue changes made offline
  - Sync when connection restored with conflict resolution
  - Offline indicator in UI
  - Works in both web and mobile app
- **Dependencies**: F-001 (Supabase), F-016 (Mobile App - for mobile offline)
- **Complexity**: XL
- **Status**: Planned

### F-018: SMS Appointment Reminders
- **Description**: Automated SMS reminders sent before appointments via Twilio.
- **Acceptance Criteria**:
  - Configurable reminder timing (1hr, 24hr, 48hr before)
  - Client can reply to confirm or cancel
  - Reminder status tracking
  - Opt-out management
- **Dependencies**: F-001 (Supabase), Twilio
- **Complexity**: M
- **Status**: Planned

### F-019: Loyalty/Rewards Program
- **Description**: Points-based loyalty system. Clients earn points per visit or dollar spent, redeemable for discounts.
- **Acceptance Criteria**:
  - Points earned per visit or per dollar
  - Point redemption at checkout
  - Loyalty tier levels (Bronze, Silver, Gold)
  - Birthday rewards
  - Points balance visible in client portal
- **Dependencies**: F-001 (Supabase), F-003 (Stripe)
- **Complexity**: L
- **Status**: Planned

### F-020: Waitlist Management
- **Description**: When appointments are fully booked, clients can join a waitlist and get notified when slots open.
- **Acceptance Criteria**:
  - Join waitlist for specific date/groomer/service
  - Automatic notification when slot opens
  - First-come-first-served or priority-based
  - Waitlist dashboard for staff
- **Dependencies**: F-001 (Supabase), F-007 (Twilio SMS) or F-010 (Resend email)
- **Complexity**: M
- **Status**: Planned

---

## Feature Dependency Map

```
F-001 (Supabase) ─┬─→ F-002 (Unlimited Clients)
                   ├─→ F-003 (Stripe) ──┬─→ F-005 (No-Show Charge)
                   │                     ├─→ F-008 (Coupons)
                   │                     ├─→ F-009 (Gift Cards)
                   │                     └─→ F-012 (QuickBooks)
                   ├─→ F-004 (Square) ──→ F-005 (No-Show Charge)
                   ├─→ F-006 (Google Calendar)
                   ├─→ F-007 (Mass Texting)
                   ├─→ F-010 (Resend Email)
                   ├─→ F-011 (Multi-Location) ←── F-014 (Google Maps)
                   ├─→ F-013 (PostHog)
                   ├─→ F-015 (Phone Numbers)
                   ├─→ F-016 (Mobile App) ──→ F-017 (Offline Access)
                   ├─→ F-018 (SMS Reminders)
                   ├─→ F-019 (Loyalty)
                   └─→ F-020 (Waitlist)
```
