# Plan: Replace react-big-calendar with FullCalendar

## Feasibility: Yes

All current features are available in FullCalendar's **free MIT tier**. No paid features needed.

## Files to Modify (7 files)

| File | Change |
|------|--------|
| `package.json` | Add 5 FC packages, remove 2 RBC packages |
| `src/modules/ui/components/calendar/types.ts` | Add `toFullCalendarEvent()`, `fromFullCalendarEvent()`, update `PendingMove` with `revert()`, add `view` to `CustomEventProps` |
| `src/modules/ui/components/calendar/index.ts` | Export new mapping functions |
| `src/modules/ui/pages/app/CalendarPage.tsx` | Replace `DragAndDropCalendar` with `<FullCalendar>`, rewrite event handlers |
| `src/modules/ui/components/calendar/CustomEvent.tsx` | Use `view` prop for compact/full rendering instead of CSS ancestor selectors |
| `src/index.css` | Replace lines 113-519 (`.rbc-*` rules) with `.fc-*` equivalents |
| `e2e/calendar-month-view.spec.ts` | Update 4 tests: replace `.rbc-*` selectors with `.fc-*` |

## Files NOT Changing (11+ files)

CalendarToolbar.tsx, HoverPopup.tsx, AppointmentDetailsDrawer.tsx, CreateAppointmentModal.tsx, RescheduleConfirmModal.tsx, StatusChangeModal.tsx, StatusLegend.tsx, MiniCalendar.tsx, calendarApi.ts, useCalendar.ts, BookingTimesPage.tsx, constants.ts

---

## Phase 1: Install FullCalendar Packages

```bash
npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

Keep react-big-calendar until Phase 7. Verify `npm run build` still passes.

---

## Phase 2: Add Event Adapters in `types.ts`

### 2a. Add `toFullCalendarEvent()` function

Maps our `CalendarEvent` to FullCalendar's `EventInput`:
- `resource` -> `extendedProps.resource`
- `clientName`, `petNames`, `serviceSummary` -> `extendedProps.*`
- Status colors set per-event: `backgroundColor: STATUS_BG_COLORS[status]`, `borderColor: STATUS_BORDER_COLORS[status]`, `textColor: STATUS_TEXT_COLORS[status]`
- Adds `classNames: ['status-{status}']` for CSS targeting

### 2b. Add `fromFullCalendarEvent()` function

Extracts our `CalendarEvent` back from FullCalendar's `EventApi`:
- `event.extendedProps.resource` -> `resource`
- `event.start!`, `event.end!` -> `start`, `end`

### 2c. Update `PendingMove` interface

Add `revert: () => void` field. FullCalendar mutates events in-place on drag. If user cancels the RescheduleConfirmModal, calling `revert()` snaps the event back to its original position. This replaces the current approach where react-big-calendar just re-renders from state.

### 2d. Update `CustomEventProps`

Add optional `view?: string` prop (will receive `'dayGridMonth'` | `'timeGridWeek'` | `'timeGridDay'`).

### 2e. Export from `index.ts`

Add exports for `toFullCalendarEvent` and `fromFullCalendarEvent`.

---

## Phase 3: Rewrite CalendarPage.tsx

### 3a. Replace imports (lines 2-8)

**Remove:**
```ts
import { Calendar, dateFnsLocalizer, type View, type Components, type SlotInfo } from 'react-big-calendar'
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
```

**Add:**
```ts
import { useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DateSelectArg, EventContentArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
```

### 3b. Remove localizer and HOC setup (lines 35-46)

**Remove:**
```ts
const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })
const DragAndDropCalendar = withDragAndDrop<CalendarEvent, object>(Calendar)
```

Also remove unused imports: `parse`, `getDay`, `enUS` from date-fns. Keep `format`, `startOfWeek`, `endOfWeek`, `addMonths`, `subMonths`, `addWeeks`, `subWeeks`, `addDays`, `subDays` (used by toolbar navigation and display date).

### 3c. Add FullCalendar ref

```ts
const calendarRef = useRef<FullCalendar>(null)
```

### 3d. Change view state type (line 55)

Current: `useState<View>('month')` -- `View` is from react-big-calendar
Change to: `useState<'day' | 'week' | 'month'>('month')` -- use our own `ViewType`

### 3e. Add view/date sync effects

FullCalendar doesn't accept `view` and `date` as declarative props. Sync via imperative API:

```ts
const FC_VIEW_MAP = { day: 'timeGridDay', week: 'timeGridWeek', month: 'dayGridMonth' } as const

useEffect(() => {
  const api = calendarRef.current?.getApi()
  if (api) api.changeView(FC_VIEW_MAP[view])
}, [view])

useEffect(() => {
  const api = calendarRef.current?.getApi()
  if (api) api.gotoDate(currentDate)
}, [currentDate])
```

### 3f. Transform events for FullCalendar

After the existing `filteredEvents` memo, add:
```ts
const fcEvents = useMemo(() => filteredEvents.map(toFullCalendarEvent), [filteredEvents])
```

### 3g. Rewrite event handlers

**handleSelectEvent (line 142)** -> `handleEventClick`:
```ts
const handleEventClick = useCallback((info: EventClickArg) => {
  setSelectedAppointment(info.event.extendedProps.resource as Appointment)
}, [])
```

**handleEventDrop (lines 234-239)** -> new signature:
```ts
const handleEventDrop = useCallback((info: EventDropArg) => {
  setIsDragging(false)
  if (!info.event.start || !info.event.end) { info.revert(); return }
  const calEvent = fromFullCalendarEvent(info.event)
  setPendingMove({ event: calEvent, start: info.event.start, end: info.event.end, isResize: false, revert: info.revert })
  setShowMoveConfirmModal(true)
}, [])
```

**handleEventResize (lines 241-246)** -> new signature:
```ts
const handleEventResize = useCallback((info: EventResizeDoneArg) => {
  setIsDragging(false)
  if (!info.event.start || !info.event.end) { info.revert(); return }
  const calEvent = fromFullCalendarEvent(info.event)
  setPendingMove({ event: calEvent, start: info.event.start, end: info.event.end, isResize: true, revert: info.revert })
  setShowMoveConfirmModal(true)
}, [])
```

**handleCancelMove (line 255)** -> also call revert:
```ts
const handleCancelMove = useCallback(() => {
  pendingMove?.revert()
  setPendingMove(null)
  setShowMoveConfirmModal(false)
}, [pendingMove])
```

**handleSelectSlot (lines 258-263)** -> `handleDateSelect`:
```ts
const handleDateSelect = useCallback((info: DateSelectArg) => {
  setCreateStartTime(format(info.start, "yyyy-MM-dd'T'HH:mm"))
  setCreateEndTime(format(info.end, "yyyy-MM-dd'T'HH:mm"))
  setSelectedClientId('')
  setShowCreateModal(true)
  calendarRef.current?.getApi().unselect()
}, [])
```

**handleDragStart (line 232)** -> same logic but attached to `eventDragStart`

**Remove:** `eventStyleGetter` (lines 340-374), `EventWrapper` (lines 377-380), `components` (line 382). Per-event colors are now set in `toFullCalendarEvent()`.

**Remove:** `handleNavigate` (line 143) and `handleViewChange` as `onView` callback (line 144) -- FullCalendar uses imperative API instead. Keep `handleViewChange` for CalendarToolbar's `onViewChange` prop.

### 3h. Add eventContent render hook

```ts
const renderEventContent = useCallback((eventInfo: EventContentArg) => {
  const calEvent = fromFullCalendarEvent(eventInfo.event)
  return (
    <CustomEvent
      event={calEvent}
      view={eventInfo.view.type}
      onMouseEnter={handleEventMouseEnter}
      onMouseLeave={handleEventMouseLeave}
    />
  )
}, [handleEventMouseEnter, handleEventMouseLeave])
```

### 3i. Replace JSX (lines 411-437)

**Remove the `<DragAndDropCalendar>` block. Replace with:**
```tsx
<FullCalendar
  ref={calendarRef}
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  headerToolbar={false}
  events={fcEvents}
  eventContent={renderEventContent}
  eventClick={handleEventClick}
  eventDrop={handleEventDrop}
  eventResize={handleEventResize}
  eventDragStart={handleDragStart}
  select={handleDateSelect}
  selectable={true}
  editable={true}
  slotMinTime={`${String(CALENDAR_BUSINESS_HOURS.start).padStart(2, '0')}:00:00`}
  slotMaxTime={`${String(CALENDAR_BUSINESS_HOURS.end).padStart(2, '0')}:00:00`}
  slotDuration="00:15:00"
  slotLabelInterval="01:00:00"
  dayMaxEvents={true}
  height="100%"
  expandRows={true}
  nowIndicator={true}
  eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
  firstDay={0}
/>
```

---

## Phase 4: Update CustomEvent.tsx

Replace CSS-ancestor-based visibility with explicit `view` prop:

```tsx
export function CustomEvent({ event, view, onMouseEnter, onMouseLeave }: CustomEventProps) {
  const status = event.resource.status
  const statusLabel = APPOINTMENT_STATUS_LABELS[status]
  const timeStr = format(event.start, 'h:mm a')
  const isMonthView = view === 'dayGridMonth'

  const handleMouseEnter = (e: React.MouseEvent) => {
    onMouseEnter?.(event, e)
  }

  return (
    <div className="h-full" onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
      {isMonthView ? (
        <div className="truncate text-[11px] font-medium leading-tight">
          <span className="opacity-80">{timeStr}</span>
          <span className="mx-1 opacity-50">&bull;</span>
          <span>{event.clientName}</span>
        </div>
      ) : (
        <div>
          <div className="font-bold text-xs leading-tight truncate">{event.clientName}</div>
          <div className="text-xs opacity-80 truncate">{event.petNames}</div>
          <div className="text-[10px] opacity-70 truncate">{timeStr}</div>
          <div
            className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
            style={{
              backgroundColor: status === 'completed' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
              color: 'inherit',
            }}
          >
            {statusLabel}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Phase 5: CSS Migration in `index.css`

Replace lines 113-519 (all `.rbc-*` rules). Keep animation utilities at lines 329-448 intact.

### Add FullCalendar CSS variable overrides at top of calendar section:

```css
:root {
  --fc-border-color: #1e293b;
  --fc-today-bg-color: #f0fdf4;
  --fc-now-indicator-color: #6F8F72;
  --fc-highlight-color: rgba(111, 143, 114, 0.2);
  --fc-event-border-color: #1e293b;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #f8fafc;
  --fc-small-font-size: 0.875rem;
}
```

### Full CSS rule mapping:

| Old `.rbc-*` Rule (line) | New `.fc-*` Equivalent | Notes |
|---|---|---|
| `.rbc-calendar` (114) | `.fc` | Same: bg-white, rounded-2xl, 2px navy border, 3px shadow |
| `.rbc-header` (120) | `.fc-col-header-cell` | Same: py-2 font-semibold, charcoal text, 2px navy border-bottom |
| `.rbc-time-view` (126) | `.fc-timegrid` | Same: 2px navy border, rounded-2xl |
| `.rbc-time-header` (131) | `.fc-timegrid .fc-col-header` | Same: 2px navy border-bottom |
| `.rbc-time-content` (135) | Remove | FullCalendar handles this |
| `.rbc-time-slot` (139) | `.fc-timegrid-slot` | Same: 1px #cbd5e1 border-top |
| `.rbc-timeslot-group` (143) | Remove | Handled by `.fc-timegrid-slot` |
| `.rbc-current-time-indicator` (151) | `.fc-timegrid-now-indicator-line` | Use `--fc-now-indicator-color` variable |
| `.rbc-event` (155) | `.fc-event` | Same: rounded-xl, 2px navy border, 2px shadow, cursor pointer |
| `.rbc-event-content` (163) | `.fc-event-main` | Same: font-medium |
| `.rbc-toolbar` (167-194) | Remove entirely | We use `headerToolbar={false}`, toolbar is custom component |
| `.rbc-today` (196) | `.fc-day-today` | Use `--fc-today-bg-color` variable |
| `.rbc-event:hover` (200) | `.fc-event:hover` | Same: translate(-1px,-1px), 3px shadow |
| `.rbc-event.rbc-selected` (206) | `.fc-event.fc-event-selected` | Same: darker background |
| `.rbc-show-more` (210) | `.fc-daygrid-more-link` | Same: green color, semibold |
| `.rbc-month-view` (221) | `.fc-daygrid` or `.fc-view-harness` | Same: 2px navy border, rounded-2xl, overflow-hidden |
| `.rbc-month-view .rbc-month-header` (227) | Remove | Handled by header cell styles |
| `.rbc-month-row` (231) | `.fc-daygrid-body tr` | Same: 1px #cbd5e1 border-bottom |
| `.rbc-date-cell` (239) | `.fc-daygrid-day-number` | Same: py-1 px-2, right-aligned, font-semibold |
| `.rbc-date-cell.rbc-now` (244) | `.fc-day-today .fc-daygrid-day-number` | Same: green color, bold |
| `.rbc-date-cell.rbc-off-range` (249) | `.fc-day-other .fc-daygrid-day-number` | Same: #94a3b8 |
| `.rbc-off-range-bg` (253) | `.fc-day-other` | Same: #f8fafc background |
| `.rbc-month-view .rbc-header` (258) | `.fc-daygrid .fc-col-header-cell` | **THEME-AWARE**: `background-color: var(--accent-color-light)`, `color: var(--text-on-accent-light)` |
| `.rbc-month-view .rbc-header:first/last-child` (266-272) | `.fc-daygrid .fc-col-header-cell:first/last-child` | Same: rounded-tl/tr-xl |
| `.rbc-month-view .rbc-event` (275) | `.fc-daygrid-event` | Same: text-xs, py-0.5, px-2, 1px shadow, 18-20px height |
| `.rbc-month-view .event-full-details` (284) | REMOVE | Now handled by CustomEvent `view` prop |
| `.rbc-month-view .event-compact` (288) | REMOVE | Now handled by CustomEvent `view` prop |
| `.rbc-month-view .rbc-row-segment` (293) | `.fc-daygrid-event-harness` | Same: py-0.5 px-0.5 |
| `.rbc-month-view .rbc-row-content` (298) | Remove | FullCalendar handles z-index |
| `.rbc-day-view .rbc-time-header` (304) | `.fc-timeGridDay-view .fc-col-header` | Same: 2px navy border-bottom |
| `.rbc-day-view .rbc-allday-cell` (308) | `.fc-timegrid-allday` | Same: 1px #cbd5e1 border-bottom |
| `.rbc-agenda-view` (313-327) | Remove | Not using agenda view |
| `.rbc-overlay` (450) | `.fc-popover` | Same: rounded-xl, 2px navy border, 4px shadow |
| `.rbc-overlay-header` (457) | `.fc-popover-header` | Same: bold, navy border-bottom |
| `.rbc-slot-selection` (463) | `.fc-highlight` | Use `--fc-highlight-color` variable + dashed border |
| `.rbc-time-gutter` (470) | `.fc-timegrid-axis-cushion` | Same: text-xs font-medium, #64748b |
| `.rbc-label` (475) | Remove | Handled by axis cushion |
| `.rbc-allday-cell` (480) | `.fc-timegrid-allday` | Same: min-h-8 |
| `.rbc-day-bg:hover` (485) | `.fc-daygrid-day:hover` | Same: rgba(111,143,114,0.05) |
| `.rbc-time-slot` transition (490) | `.fc-timegrid-slot` | Same: transition 0.15s |
| `.rbc-day-slot .rbc-time-slot:hover` (494) | `.fc-timegrid-slot:hover` | Same: rgba(111,143,114,0.1), cursor pointer |
| `.rbc-timeslot-group:hover` (500) | Remove | Simplified to slot-level hover |
| `.rbc-event:focus` (516) | `.fc-event:focus` | Same: 2px green outline, 2px offset |

---

## Phase 6: Update E2E Tests

`e2e/calendar-month-view.spec.ts` has 4 tests using `.rbc-*` selectors:

### Test 1: "event cards in last row are not clipped by overflow"
- `.rbc-month-view` -> `.fc-daygrid-body` (or parent `.fc-view-harness`)
- `.rbc-month-row` -> `.fc-daygrid-body tr`
- `current.classList.contains('rbc-month-view')` -> `current.classList.contains('fc-view-harness')`

### Test 2: "calendar grid fills available viewport height"
- `.rbc-calendar` -> `.fc`

### Test 3: "events are visible and not cut off"
- `.rbc-event` -> `.fc-event`

### Test 4: "month view container has proper corner clipping"
- `.rbc-month-view` -> `.fc-view-harness` (or whichever container has overflow-hidden and border-radius)

Test logic stays the same -- just selector updates.

---

## Phase 7: Cleanup

```bash
npm uninstall react-big-calendar @types/react-big-calendar
npm run build
npm run lint
npm run test:run
npm run test:e2e
```

---

## Theme Integration Details

FullCalendar exposes 27 CSS variables. The key ones we override:

| FC Variable | Value | Source |
|---|---|---|
| `--fc-border-color` | `#1e293b` | Always navy (hardcoded) |
| `--fc-today-bg-color` | `#f0fdf4` | Light green (hardcoded) |
| `--fc-now-indicator-color` | `#6F8F72` | Primary green (hardcoded) |
| `--fc-highlight-color` | `rgba(111,143,114,0.2)` | Selection highlight (hardcoded) |
| `--fc-page-bg-color` | `transparent` | Let page gradient show through |

Month view headers use existing app CSS variables (`var(--accent-color-light)`, `var(--text-on-accent-light)`) so they automatically update when the user toggles themes with the T key.

Status colors (STATUS_BG_COLORS, STATUS_TEXT_COLORS, STATUS_BORDER_COLORS) remain **static** across all 21 palettes -- pastel lemon/mint/lavender/lime/green/gray/pink for consistent appointment identification regardless of theme.

Per-event colors are set directly on the FullCalendar EventInput objects (in `toFullCalendarEvent()`), not via CSS -- so they work regardless of theme.

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Drag cancellation leaves event at wrong position | Store `revert()` in `PendingMove`, call it on cancel |
| CSS specificity conflicts with FC defaults | Use `!important` selectively; our CSS loads after FC's |
| Event data shape mismatch | `toFullCalendarEvent` / `fromFullCalendarEvent` adapters isolate mapping |
| Keyboard shortcuts break | View cycling via `setView()` -> `useEffect` -> `api.changeView()` (same pattern as current) |
| FullCalendar imperative API race conditions | Guards: `if (api)` checks in useEffects |
| Month view "+N more" popover looks different | Style `.fc-popover` with same neo-brutalist rules |
| Hover popup stops working | Mouse events still fire from CustomEvent rendered inside `.fc-event` |

---

## Verification Checklist

Run `npm run dev` and manually verify:

1. **Month view**: Events render as compact pills with status colors, "+N more" popover works, date headers use theme accent color
2. **Week view**: Events render with full details (client, pets, time, status badge), 15-min time slots, 8AM-6PM range
3. **Day view**: Same as week but single column, mini calendar sidebar visible
4. **Drag-and-drop**: Drag event -> RescheduleConfirmModal appears with old/new times -> Confirm updates, Cancel reverts
5. **Resize**: Drag event edge -> same confirmation flow
6. **Click event**: AppointmentDetailsDrawer opens with correct data
7. **Click empty slot**: CreateAppointmentModal opens with pre-filled time
8. **Keyboard**: Tab cycles views (day->week->month), A opens create modal, T cycles themes, S toggles sidebar
9. **Theme switching**: Toggle through palettes with T key -- month headers update, page gradient updates, calendar doesn't break
10. **Search**: Type in toolbar search -> events filter in real-time, ESC clears
11. **Status filters**: Click status buttons -> events filter by status
12. **Hover popup**: Hover over event -> HoverPopup appears with smart positioning
13. **Now indicator**: Current time line visible in day/week views
14. **E2E tests**: `npm run test:e2e` passes all 4 calendar tests

---

## FullCalendar Free vs Premium Reference

| Feature | Free (MIT) | Premium ($480/yr) |
|---|---|---|
| Day/Week/Month views | Yes | Yes |
| Drag-and-drop | Yes | Yes |
| Event resizing | Yes | Yes |
| Custom event rendering | Yes | Yes |
| CSS variable theming | Yes | Yes |
| TypeScript | Yes | Yes |
| Now indicator | Yes | Yes |
| Touch support | Yes | Yes |
| Timeline views | No | Yes |
| Resource columns (groomer per column) | No | Yes |
| Printer-friendly | No | Yes |

**All features needed for this migration are FREE.**
