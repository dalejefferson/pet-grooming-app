# Sit Pretty Club - Expo Mobile App Feature Spec

## What We're Building

A client-facing Expo (React Native) mobile app where pet owners can:
- **Book** grooming appointments (condensed 4-screen flow)
- **Chat** with the salon in real-time (Supabase Realtime)
- **Get push notifications** (appointment reminders, status changes, new messages)
- **View appointment history** and rebook past appointments

Salon staff continues using the existing React web app. Both apps share the same Supabase backend.

---

## Architecture

**Separate project** in a sibling directory — zero changes to the existing web app codebase.

```
VIBE CODING/
├── pet-grooming-app/        ← existing web app (UNTOUCHED)
└── sit-pretty-mobile/       ← new Expo app
```

Both apps connect to the **same Supabase project** (same database, auth, realtime).

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Expo SDK 52+ (managed workflow) | OTA updates, EAS Build, managed native modules |
| Routing | Expo Router v4 (file-based) | Tab navigation, deep linking from push notifications |
| Styling | NativeWind v4 + Tailwind CSS 3 | Reuse Tailwind mental model from web app |
| State | React Query v5 | Same as web app — shared query patterns |
| Backend | Supabase JS v2 | Same Supabase project as web app |
| Auth | Google + Apple social login | `signInWithIdToken` via Supabase Auth |
| Chat | Supabase Realtime | postgres_changes for real-time message sync |
| Push | expo-notifications + Supabase Edge Functions | Expo Push API, triggered by DB webhooks |
| Forms | React Hook Form | Lightweight form management |
| Icons | lucide-react-native | Same icon library as web app |
| Dates | date-fns v4 | Same as web app |
| Auth Storage | expo-secure-store | Secure token persistence on device |

---

## Navigation Structure

```
Root Layout (_layout.tsx) — auth check, providers
├── (auth)/
│   └── sign-in.tsx           — Google + Apple sign-in buttons
└── (tabs)/ — bottom tab bar
    ├── Home
    │   ├── index.tsx          — next appointment, quick actions
    │   └── [appointmentId]    — appointment detail
    ├── Book
    │   ├── index.tsx          — Step 1: Select Pets + Services (combined)
    │   ├── groomer-time.tsx   — Step 2: Choose Groomer + Time Slot (combined)
    │   ├── confirm.tsx        — Step 3: Review + Confirm + Pay
    │   └── success.tsx        — Step 4: Confirmation
    ├── Chat
    │   ├── index.tsx          — conversation list
    │   └── [conversationId]   — real-time chat screen
    └── Account
        ├── index.tsx          — profile overview
        ├── history.tsx        — appointment history + rebook
        └── settings.tsx       — notification prefs, sign out
```

---

## Design: Hybrid Neo-Brutalist

Keep brand identity from the web app but adapt for mobile:
- **Keep:** Pastel colors, rounded corners, ink-colored borders (#1e293b), playful brand feel
- **Adapt:** Thinner borders (1-2px), smaller offset shadows, native navigation patterns (tab bar, stack push/pop)
- **Font:** Plus Jakarta Sans via expo-font
- **Themes:** Same 21 palettes available as web app
- **Colors:** Same brand palette (ink #1e293b, cream #FAFAF8, primary #6F8F72, accent #F2A65A, all pastels)

---

## Feature Details

### 1. Authentication (Google + Apple)

**Sign-in screen:**
- Brand logo/illustration at top
- "Welcome to Sit Pretty Club" heading
- "Continue with Google" button
- "Continue with Apple" button (iOS only)
- Pastel background, neo-brutalist card container

**Technical flow:**
- Google: `@react-native-google-signin/google-signin` → `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`
- Apple: `@invertase/react-native-apple-authentication` → `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })`
- On first sign-in: Supabase trigger auto-creates a `clients` record linked to `auth.users` via new `auth_user_id` column
- Session persisted in expo-secure-store (survives app restarts)

### 2. Home Screen

**Layout:**
1. **WelcomeHeader** — "Hi, {firstName}!" with salon branding
2. **NextAppointmentCard** — large hero card showing next appointment (date, time, groomer, pets, services)
3. **QuickActions** — 3 icon buttons: "Book Now", "Chat", "My Pets"
4. **Upcoming** — list of next 2-3 upcoming appointments

**Empty state:** "No upcoming appointments" with prominent "Book Now" CTA

### 3. Booking Flow (4 Condensed Screens)

**Step 1: Pets + Services** (combines web steps 2+3)
- Show client's existing pets with checkboxes
- "Add a Pet" button → bottom sheet form
- Below each selected pet: service category picker → service selection
- Auto-apply modifiers based on pet weight/coat type
- Running total at bottom
- "Next" button

**Step 2: Groomer + Time** (combines web steps 4+5)
- Horizontal scrolling groomer cards (photo, name, specialties)
- "No Preference" option
- Horizontal week-view date picker
- Time slot grid (30-min intervals, grayed out when unavailable)
- "Next" button

**Step 3: Review + Confirm** (web step 6)
- Full booking summary card
- Price breakdown with modifier details
- Deposit amount (if required by policies)
- Notes text field
- Policy agreement checkbox
- "Confirm Booking" button with loading state

**Step 4: Success** (web step 7)
- Checkmark animation
- "Your appointment is confirmed/requested!" message
- Appointment summary
- "View Appointment" → navigates to home detail
- "Book Another" → resets flow

**Key business logic (ported from web):**
- Modifier price/duration calculation
- Time slot availability (groomer schedule, breaks, time off, buffer)
- Booking validation (max pets, advance window, vaccination status)

### 4. Chat (Supabase Realtime)

**Conversation list:**
- One conversation per salon topic
- Last message preview + timestamp
- Unread count badge
- "New Conversation" button
- Pull to refresh

**Chat screen:**
- Real-time messages via Supabase Realtime subscription
- Client messages on right (accent color bubble)
- Staff messages on left (white bubble)
- Timestamp + read status
- Text input + send button at bottom
- Messages marked as read when conversation opened

**Technical:** Supabase Realtime channel listens for `postgres_changes` INSERT events on `chat_messages` table, filtered by conversation_id.

### 5. Push Notifications

**Registration:** On app launch (after auth), request notification permissions → get Expo push token → store in `push_tokens` table.

**Notification triggers (via Supabase Edge Functions):**

| Event | Title | Body | Deep Link |
|-------|-------|------|-----------|
| Booking confirmed | "Booking Confirmed!" | "Your appointment on {date} at {time}" | `/home/{appointmentId}` |
| Status change | "Appointment Update" | "Status changed to {status}" | `/home/{appointmentId}` |
| 24h reminder | "Tomorrow's Appointment" | "Grooming at {time} with {groomer}" | `/home/{appointmentId}` |
| New chat message | "New Message" | "{senderName}: {preview}" | `/chat/{conversationId}` |

**Deep linking:** Tapping notification → `router.push(data.url)` → navigates to correct screen.

### 6. Appointment History + Rebook

**History screen** (under Account tab):
- FlatList with infinite scroll (10 per page)
- Filter pills: All, Completed, Cancelled
- Each card: date, groomer, pets, services, total, status badge
- "Rebook" button on each card

**Rebook flow:**
1. Extract pets + services from past appointment
2. Verify pets still exist and services still active
3. Pre-fill booking state
4. Navigate directly to Step 2 (groomer + time) — pets/services already selected
5. Client just picks a new date/time

### 7. Account

- **Profile:** View/edit name, email, phone, address
- **My Pets:** Quick list of pets (future: full pet profiles with vaccination status)
- **Appointment History:** → history screen
- **Notification Settings:** Toggle push on/off
- **Sign Out:** Clear session, return to sign-in

---

## New Supabase Infrastructure

### Schema Changes (existing Supabase project)

**Modify `clients` table:**
```sql
ALTER TABLE clients ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) UNIQUE;
```

**Modify `handle_new_user()` trigger:**
- Skip creating `users` record for mobile client signups (check `raw_app_meta_data->>'app' = 'mobile'`)

**New `handle_new_mobile_user()` trigger:**
- On `auth.users` INSERT where app = 'mobile'
- Creates `clients` record with name/email from OAuth profile
- Links via `auth_user_id`

**New tables:**

```sql
-- Chat
chat_conversations (id, organization_id, client_id, subject, last_message_at, is_archived, created_at)
chat_messages (id, conversation_id, sender_type, sender_id, content, is_read, created_at)

-- Push tokens
push_tokens (id, user_id, token, platform, is_active, created_at)
```

**Enable Realtime** on `chat_messages`.

### RLS Policies

- Clients read/write own conversations and messages only
- Clients read/write own client record, pets, and appointments only
- Staff read all conversations for their organization
- Users manage only their own push tokens
- Helper function: `get_client_id_for_auth_user()` returns client_id for `auth.uid()`

### Edge Functions

| Function | Trigger | Action |
|----------|---------|--------|
| `send-push-notification` | Called by other functions | Reads push_tokens, sends via Expo Push API |
| `on-booking-created` | DB webhook: appointments INSERT | Push confirmation to client + notify staff |
| `on-chat-message` | DB webhook: chat_messages INSERT | Push to other participant |
| `on-appointment-status-change` | DB webhook: appointments UPDATE (status) | Push status update to client |

---

## Implementation Phases

```
Phase 1: Project Scaffolding       — Expo setup, NativeWind, Supabase client, tab nav
Phase 2: Supabase Schema           — auth_user_id, chat tables, push_tokens, Edge Functions, RLS
Phase 3: Authentication            — Google + Apple sign-in, auth guard, client linkage
Phase 4: Home Screen               — upcoming appointments, quick actions, detail view
Phase 5: Booking Flow              — 4-screen wizard with ported business logic
Phase 6: Chat                      — Supabase Realtime messaging (parallel with 4+5)
Phase 7: Push Notifications        — Expo push tokens, Edge Function triggers, deep linking
Phase 8: Appointment History       — paginated history, filters, rebook flow
Phase 9: Polish + App Store Prep   — animations, error handling, a11y, EAS Build
```

**Dependency graph:**
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 8
                  ↘ Phase 6 (parallel with 4+5)  ↘ Phase 7
                                                    Phase 9 (after all)
```

---

## Key Files to Reference in Web App

When implementing the mobile app, reference these files from the existing web codebase:

| Purpose | Web App Path |
|---------|-------------|
| All domain types | `src/modules/database/types/index.ts` |
| Booking calculation logic | `src/modules/database/api/bookingApi.ts` |
| Time slot availability | `src/modules/database/api/calendarApi.ts` |
| Constants (breeds, statuses, etc.) | `src/config/constants.ts` |
| Appointment status transitions | `src/modules/database/api/statusMachine.ts` |
| Existing DB schema | `supabase/migrations/001_initial_schema.sql` |
| Existing RLS policies | `supabase/migrations/002_rls_policies.sql` |
| Existing OAuth trigger | `supabase/migrations/004_handle_new_oauth_user.sql` |
| Theme colors | `src/modules/ui/context/ThemeContext.tsx` |
| Brand color values | `src/index.css` |

---

## Verification Checklist

After full implementation, verify this end-to-end flow:

1. Fresh Google sign-in → client record auto-created in Supabase
2. Home screen shows empty state with "Book Now" CTA
3. Complete booking flow → appointment created in database
4. Appointment appears on home screen
5. Staff can see the appointment on the web app calendar
6. Open chat → send message → message appears in Supabase
7. Insert staff reply via Supabase → appears in mobile app in real-time
8. Push notification received for new message (physical device)
9. Tap notification → deep links to chat conversation
10. View appointment history → tap "Rebook" → pre-filled booking flow
11. Sign out → session cleared → returns to sign-in screen
