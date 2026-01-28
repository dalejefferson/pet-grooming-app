# Product Requirements Document (PRD)

## 1. Overview
This project is a multi-tenant SaaS MVP for pet grooming businesses. It focuses on providing both an administrative interface (for groomers) and a public booking portal (for clients). The scope of this PRD is limited to the frontend. Business logic and data persistence are simulated via an in-memory or `localStorage`-backed mock service. The app is architected to easily swap in real backend services at a later date (e.g., Supabase, Stripe).

## 2. Problem Statement
Pet grooming businesses need a streamlined solution to coordinate scheduling, manage clients/pets, and handle bookings and reminders. Existing solutions often bundle other services (like daycare or boarding) or lack robust multi-tenant features. This MVP seeks to address actual grooming workflows with minimal friction for staff and clients, ensuring easy expandability once a real backend is connected.

## 3. Goals & Non-Goals

### Goals
1. Provide a production-quality React + TypeScript frontend scaffold with:
   - Admin calendar (day/week view) to view and manage grooming appointments.
   - Public booking portal with a multi-pet flow, from selecting services to confirming a timeslot.
   - Clients & Pets management UI (including notes, vaccination details, and behavior warnings).
   - Service modifiers UI (e.g., coat type, breed, or weight affecting time/price).
   - Configurable policies (deposit, no-show fee, new-client booking mode).
   - Reminder settings (schedules and templates for appointment reminders and routine “due-for-grooming” nudges).
   - Basic responsive layout for desktop and mobile.

2. Scaffold a simple but flexible architecture that uses:
   - Vite, React, TypeScript
   - TanStack Query (or React Query) for data fetching/cache
   - TanStack Router or React Router for routing
   - Tailwind CSS for styling (optional usage of shadcn/ui)
   - Mocked APIs (in-memory or localStorage) to simulate reading/writing data

3. Keep the door open for backend integrations:
   - Placeholder Supabase client file
   - Placeholder Stripe file
   - Environment variable examples for future usage

### Non-Goals
- Implementing actual backend functionality (no real Supabase queries or data storage).
- Processing real payments with Stripe.
- Enforcing real authentication (beyond a mocked login flow).
- Building robust user roles, staff management, or administrative capabilities beyond basic placeholders.

## 4. Technical Approach

### 4.1 Application Architecture
- A single-page application (SPA) built with React + Vite + TypeScript.
- Routing:
  - Logged-out routes (e.g., `/login`).
  - Authenticated shell `/app` with nested routes (e.g., `/app/calendar`, `/app/clients`, etc.).
  - Public booking portal `/book/:orgSlug` for external clients.
- Data Layer & State Management:
  - TanStack Query (or React Query) manages remote data calls to a mock API layer in `src/lib/api`.
  - Each API module (e.g., `calendarApi`, `clientsApi`) stores data in memory or `localStorage` with a seed dataset.
- Styling & UI:
  - Tailwind CSS for quick, responsive styling.
  - Optional usage of shadcn/ui patterns and lucide-react icons for consistent UI elements.
  - react-big-calendar (or FullCalendar) to display day/week views with interactive appointment blocks.
- Modularity:
  - Each domain area (calendar, clients, pets, policies, etc.) has its own route, screens, and local components.
  - A shared or “common” folder for reusable components (like forms, modals, layout components).

### 4.2 Key Features
1. **Admin Calendar**  
   - Displays day/week appointments.  
   - Each appointment block shows time, client name, pet count, status color.  
   - A click on the appointment reveals a right-side drawer with appointment details and status drop-down.

2. **Public Booking Portal**  
   - Multi-step booking flow: Start → Pets → Intake details → Times selection → Confirm → Success.  
   - Each pet can be associated with grooming services, and modifiers apply to calculate final durations.

3. **Clients & Pets Management**  
   - Clients list with search.  
   - Client detail page with a list of pets, client notes.  
   - Pet detail page with grooming notes, behavior level, and vaccination records.

4. **Services & Modifiers**  
   - CRUD interface for base services (name, base duration, base price).  
   - Configurable modifiers for weight range, breed, or coat type.

5. **Policies**  
   - UI for deposit/no-show settings, new-client booking mode, cancel windows, etc.  
   - Preview text that would appear at booking confirmation.

6. **Reminders**  
   - Configure reminder schedules (48h/24h/2h toggles) and “due-for-grooming” intervals.  
   - Mocked template previews for appointment reminders.

7. **Feature Flag System**  
   - A simple config file (`src/config/flags.ts`) that can toggle features or designate future expansions.

## 5. Implementation Steps

1. **Project Setup**  
   1.1 Initialize a new Vite + React + TypeScript project.  
   1.2 Integrate Tailwind CSS and confirm styling via a sample component.  
   1.3 Set up React Router (or TanStack Router).  

2. **Directory & File Structure**  
   2.1 Create folder structure for `src/lib/api`, `src/pages`, `src/components`, `src/config`, etc.  
   2.2 Prepare placeholders for `supabase/client.ts` and `stripe/placeholder.ts`.  
   2.3 Define `.env.example` with dummy keys.

3. **Mock API and Seed Data**  
   3.1 In `src/lib/api`, create modules:  
       - `orgApi.ts`, `calendarApi.ts`, `bookingApi.ts`, `clientsApi.ts`, `petsApi.ts`, `servicesApi.ts`, `policiesApi.ts`, `remindersApi.ts`.  
   3.2 Implement localStorage-based CRUD operations with in-memory objects as fallback.  
   3.3 Seed data to demonstrate multi-staff shifts, multiple pets, status variations, etc.

4. **Global State & TanStack Query Setup**  
   4.1 Configure TanStack Query client at the root of the application.  
   4.2 Create hooks (e.g., `useCalendar()`, `useClients()`) that wrap TanStack Query for retrieving/updating data.  

5. **Routing & Layout**  
   5.1 Implement `/login` (mocked) and `/app/*` (authed shell).  
   5.2 Create top-level layout, sidebar navigation, and placeholders for certain pages (e.g., `/app/dashboard`).  
   5.3 Implement booking portal routes: `/book/:orgSlug/*`.

6. **Calendar UI**  
   6.1 Integrate react-big-calendar (or FullCalendar) in `/app/calendar`.  
   6.2 Display day/week toggles, styled appointment blocks.  
   6.3 Implement click-to-drawer functionality with appointment details, including internal notes, status selection, etc.

7. **Clients & Pets**  
   7.1 Create a clients list UI (`/app/clients`) with search.  
   7.2 Implement client detail page (`/app/clients/:clientId`) showing client info, pet list, notes.  
   7.3 Implement pet detail page (`/app/pets/:petId`) with grooming notes, behavior slider, vaccination files (mocked).

8. **Services & Modifiers**  
   8.1 Add a table or card list in `/app/services` to display all services.  
   8.2 Provide create/edit/delete modals for services and modifiers.  
   8.3 Verify final duration/price calculations in the booking flow.

9. **Policies & Reminders**  
   9.1 Implement `/app/policies` with toggles and numeric inputs for deposit fees, new-client mode, etc.  
   9.2 Show a generated policy summary text.  
   9.3 Implement `/app/reminders` to toggle default reminders (48h, 24h, 2h, etc.), plus a “due for grooming” threshold and template preview.

10. **Public Booking Flow**  
   10.1 Build multi-step flow:  
       - /book/:orgSlug/start  
       - /book/:orgSlug/pets (select or add pets)  
       - /book/:orgSlug/intake (pet details, modifiers)  
       - /book/:orgSlug/times (available time slots, mock)  
       - /book/:orgSlug/confirm (display policies, deposit summary)  
       - /book/:orgSlug/success  
   10.2 Enforce policy rules (e.g., request-only vs. confirmed booking).  
   10.3 Display final appointment summary with statuses (requested or confirmed).

11. **ReadMe & Documentation**  
   11.1 Write a comprehensive README covering how to install dependencies, run the project, and where to integrate the real backend later.  
   11.2 Document environment variables and placeholders.  

## 6. Testing Strategy

1. **Functional Tests**  
   - Verify each route loads correctly and renders the correct UI components.  
   - Check that mock data is properly displayed (e.g., seeded appointments in the calendar).  
   - Ensure booking flow steps proceed in the correct order, storing user selections in local or in-memory state.

2. **UI/UX Tests**  
   - Test responsiveness across desktop and mobile screen sizes.  
   - Confirm the day/week calendar toggles function properly.  
   - Verify that modals, drawers, and form submits are user-friendly.

3. **Regression & Integration Tests**  
   - Stub out basic integration tests to confirm mock APIs handle create/read/update/delete flows (using localStorage).  
   - Validate that updates in one area (e.g., new appointment booking) appear properly in other areas (e.g., admin calendar).

4. **Acceptance Criteria**  
   - The PRD does not provide explicit acceptance criteria, so success is measured by completed features matching the described UI flows, mock data usage, and placeholders.

## 7. Success Metrics
1. **Feature Completeness**  
   - All required views and flows (calendar, booking, clients/pets management, services, policies, reminders) are implemented with mock data and navigation.
2. **Usability**  
   - Groomers and clients can complete critical tasks (creating an appointment, booking a service) without errors or missing data.
3. **Performance**  
   - The calendar and booking flows load quickly in development mode, using TanStack Query effectively.
4. **Extendability**  
   - The code scaffolding is ready to plug in real Supabase and Stripe backends without rewriting core UI components or data flows.
5. **Documentation**  
   - A thorough README and code comments exist, guiding future developers on environment variables, feature flags, and data flow.

---

This PRD provides the high-level requirements, approach, and success criteria needed to guide development of the Pet Grooming Frontend MVP. By leveraging modern React tooling, a well-structured file tree, and mock data APIs, this project will be production-ready in terms of frontend design and architecture, awaiting only a real backend integration.