# Email Notifications Plan — Sit Pretty Club

## What's the Problem?

Your app already has all the wiring for sending emails (Resend edge function, email API, reminder templates, vaccination tracking) — but nothing actually sends real emails yet. The test email button is hardcoded to `dalejefferson00@gmail.com` and the notification system is mocked.

---

## What Already Exists (You Don't Need to Build From Scratch)

| Component | File | Status |
|-----------|------|--------|
| Resend edge function | `supabase/functions/send-email/index.ts` | Working — sends via `onboarding@resend.dev` |
| Resend client | `supabase/functions/_shared/resend.ts` | Resend v4, needs `RESEND_API_KEY` secret |
| Frontend email API | `src/modules/database/api/emailApi.ts` | Calls edge function with auth token |
| Reminder templates | `src/modules/database/api/remindersApi.ts` | 48h, 24h, 2h templates with {{variables}} |
| Vaccination reminders | `src/modules/database/api/vaccinationRemindersApi.ts` | Full system: settings, pending/sent tracking, channels |
| In-app notifications | `src/modules/notifications/services/inAppNotificationService.ts` | Working (Supabase-backed) |
| Mock email service | `src/modules/notifications/services/mockEmailService.ts` | Dev only — stores in localStorage |
| Email settings UI | `src/modules/ui/pages/app/SettingsPage.tsx` | Sender name + reply-to config |
| Reminder settings UI | `src/modules/ui/pages/app/RemindersPage.tsx` | Template editing, enable/disable toggles |
| Vaccination settings UI | `src/modules/ui/components/reminders/VaccinationReminderSettings.tsx` | Channels, reminder days, block booking toggle |

---

## The User Flow (How It Should Work)

### Groomer Setup
1. Groomer signs up and logs in
2. Goes to **Settings** → enters their business email, sender display name, reply-to email
3. Clicks **Send Test Email** → enters any email address → gets a test email delivered

### Day-to-Day Usage
1. Groomer creates a **client** with the client's email address
2. Groomer adds the client's **pet(s)** with vaccination records
3. Groomer books an **appointment** for the client's pet

### Email Notifications That Should Fire
| Trigger | Email Goes To | What It Says |
|---------|---------------|-------------|
| Groomer marks appointment "Completed" | Client's email | "Hi Sarah, Buddy is all done and looking fabulous! Ready for pickup at Sit Pretty Club." |
| Groomer clicks "Send Reminder" on appointment | Client's email | "Hi Sarah, reminder that Buddy's grooming appointment is tomorrow at 2:00 PM." |
| Pet's vaccination is expiring (30 days, 7 days, expired) | Client's email | "Hi Sarah, Buddy's Rabies vaccination expires on March 15, 2026." |
| Groomer clicks "Send Test Email" in Settings | Whatever email they type in | "This is a test email from your Sit Pretty Club account." |

### Appointment Status Flow
```
requested → confirmed → checked_in → in_progress → completed (triggers pickup email)
                                                  → cancelled
                                                  → no_show
```

**"Completed" = pet is ready for pickup.** No separate "ready for pickup" status needed.

When the groomer selects "Completed," a **confirmation dialog** appears:
> "Mark as completed? This will send a pickup notification to Sarah at sarah@email.com."

This prevents accidental status changes from triggering emails.

---

## What Needs to Be Built (6 Phases)

### Phase 1: Verify Resend API Key
- Check if `RESEND_API_KEY` is set in Supabase Edge Function secrets
- If not: create a Resend account at resend.com → get API key → add as Supabase secret
- Current sender: `onboarding@resend.dev` (Resend's sandbox — fine for testing, need custom domain for production)

### Phase 2: Fix Hardcoded Test Email
**File**: `src/modules/ui/pages/app/SettingsPage.tsx` (lines 258-271)

**Current**: Hardcoded `dalejefferson00@gmail.com`
**Change**: Add an email input field → groomer types any address → Send Test Email uses that address

### Phase 3: "Pet Ready for Pickup" Auto-Email
**Files**:
- `src/modules/database/api/emailApi.ts` — add `sendReadyForPickupEmail()` method
- `src/modules/ui/pages/app/CalendarPage.tsx` — add confirmation dialog before "Completed"
- `src/modules/ui/components/calendar/AppointmentDetailsDrawer.tsx` — surface confirmation

**How it works**:
1. Groomer selects "Completed" from status dropdown
2. Confirmation dialog: "Mark as completed? This will email {clientName} at {clientEmail}."
3. On confirm → update status → auto-send email to client (fire-and-forget)
4. If email fails, status still changes — no error shown to groomer

**Email content**: "Hi {clientName}, {petNames} is all done and looking fabulous! Ready for pickup at {businessName}."

### Phase 4: Manual "Send Reminder" Button
**Files**:
- `src/modules/database/api/emailApi.ts` — add `sendAppointmentReminderEmail()` with template rendering
- `src/modules/ui/components/calendar/AppointmentDetailsDrawer.tsx` — add Mail button

**How it works**:
1. Button visible only on `confirmed` / `checked_in` appointments
2. Uses the 24h reminder template (already exists in `remindersApi`)
3. Renders `{{clientName}}`, `{{petName}}`, `{{date}}`, `{{time}}` variables
4. Sends to client's email
5. Shows success/error toast

### Phase 5: Automatic Vaccination Expiry Alerts
**Files**:
- `src/modules/database/api/emailApi.ts` — add `sendVaccinationReminderEmail()` with urgency levels
- `src/modules/database/hooks/useVaccinationReminders.ts` — add hook that sends email + marks as sent
- Dashboard vaccination widget — trigger send for pending reminders

**How it works**:
1. System generates pending reminders via `generateReminders()` (already exists)
2. For each pending reminder where `channels` includes `email`:
   - Look up client email
   - Send email with urgency text (30-day vs 7-day vs expired)
   - Mark reminder as `sent`
3. Triggers on dashboard load or reminders page load

**Email content varies by urgency**:
- 30 days: "Buddy's Rabies vaccination expires on March 15."
- 7 days: "Buddy's Rabies vaccination expires in less than a week!"
- Expired: "Buddy's Rabies vaccination has expired."

### Phase 6: HTML Email Templates
**Files**:
- `supabase/functions/send-email/index.ts` — accept `html` field alongside `body`
- `src/modules/database/api/emailApi.ts` — add `html` to options
- NEW: `src/modules/notifications/templates/emailTemplates.ts` — template builders

**Templates use the neo-brutalist design**:
- White card with `border: 2px solid #1e293b`
- `border-radius: 16px`
- `box-shadow: 3px 3px 0px 0px #1e293b`
- Cream background (`#FAFAF8`)
- Plus Jakarta Sans font
- Footer: "Sent from {businessName} via Sit Pretty Club"

---

## Files That Get Modified

| File | Phase | What Changes |
|------|-------|-------------|
| `src/modules/ui/pages/app/SettingsPage.tsx` | 2 | Replace hardcoded email with input field |
| `src/modules/database/api/emailApi.ts` | 3,4,5,6 | Add 3 new send methods + html support |
| `src/modules/ui/pages/app/CalendarPage.tsx` | 3 | Confirmation dialog + auto-email on completion |
| `src/modules/ui/components/calendar/AppointmentDetailsDrawer.tsx` | 3,4 | Confirmation for completed + Send Reminder button |
| `src/modules/database/hooks/useVaccinationReminders.ts` | 5 | New hook for email + mark-sent |
| Dashboard vaccination alerts widget | 5 | Auto-send + manual send button |
| `supabase/functions/send-email/index.ts` | 6 | Accept `html` field |
| `src/modules/notifications/templates/emailTemplates.ts` (NEW) | 6 | HTML template builders |

---

## How to Test Each Phase

1. **Test email**: Settings → type your email → Send Test → check inbox
2. **Pickup email**: Create appointment → move to In Progress → move to Completed → see dialog → confirm → check client's email
3. **Reminder**: Open a confirmed appointment → click Send Reminder → check client's email
4. **Vaccination**: Add a pet with vaccination expiring soon → go to dashboard → verify email sent
5. **HTML templates**: Check received emails render nicely in Gmail / Outlook / Apple Mail
6. **Error resilience**: Turn off wifi → complete an appointment → status changes, no crash (email silently fails)

---

## Important Notes

- **Resend free tier**: 100 emails/day, 3,000/month — plenty for manual triggers and small salons
- **Sender domain**: Currently `onboarding@resend.dev` (sandbox) — for production, verify a custom domain in Resend dashboard
- **Spam risk**: Emails from `onboarding@resend.dev` may land in spam — custom domain fixes this
- **No cron jobs needed yet**: Manual buttons + status-change triggers are sufficient for v1
- **Client preferences exist but aren't used**: `Client.notificationPreferences` has `enabled` and `channels` fields that could gate email sending in a future version
