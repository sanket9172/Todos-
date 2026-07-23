# 07 · Home Dashboard

> Follows the [Master PRD Template](./00-prd-template.md). The Home tab is Numil's daily
> launchpad — the first screen after login and the answer to "what should I do right now?"

---

## 1. Purpose

Home is where the user starts their day. It blends **personal and team** work into one
focused, glanceable view: today's agenda, overdue items, priorities, quick stats, and a
persistent quick-add. It must feel as calm as Things 3's "Today" while quietly surfacing the
team signal a manager needs.

**User problem.** Users open productivity apps and face either an empty void (no guidance) or
a firehose (every project, every task). Home solves the "cold open" — in one screen it tells
you what's due, what's slipping, and what matters, then lets you capture the next thing in
seconds without navigating anywhere.

**User goals**
- See what's due/scheduled today (personal + team) at a glance.
- Immediately spot overdue and high-priority work.
- Capture a new task in seconds via natural language, from anywhere on the screen.
- Complete/reschedule tasks inline without opening detail.
- Feel a sense of progress ("3 done today," "all caught up ✨").

**Business goals.** Home drives daily active use and habit formation (the reason to open the
app), funnels users into deeper modules (Task Detail, Calendar, Reports), and is the natural
home for AI "Plan my day" and iOS home-screen widgets — both retention and monetization
levers.

**KPIs:** DAU/Home-open rate, `task_created` from Home quick-add, inline `task_completed`
via Home, `quick_view_opened` from stat chips, and "Plan my day" adoption (🔜).

---

## 2. Navigation

**Entry points**
- Default tab after login (`house` icon). Route `src/app/index.js` → to become the dashboard
  (see [02-architecture-tech-stack.md](./02-architecture-tech-stack.md)).
- Re-tapping the Home tab scrolls to top; app cold start lands here.
- Deep link `numil://home` (or bare `numil://`).

**Exits (where Home sends you)**
- Stat chip → filtered Quick View list ([04-navigation-sidebar.md](./04-navigation-sidebar.md) §B).
- Task row → Task Detail sheet ([10-task-detail.md](./10-task-detail.md)) via shared-element hero.
- "Open Calendar" → [11-calendar-scheduling.md](./11-calendar-scheduling.md).
- Header avatar → sidebar; bell → Inbox ([12-notifications-alerts.md](./12-notifications-alerts.md)).
- Pull-down → command palette ([04](./04-navigation-sidebar.md) §5.3).

**Breadcrumbs:** none (Home is a tab root). **Transitions:** row → detail hero
(`motion.slow`); stat chip → list push (iOS slide); quick-add expands into a `spring.gentle`
sheet for enrichment. Motion tokens: [shared/animation-spec.md](./shared/animation-spec.md).

---

## 3. Complete UI Layout

Top → bottom, calm at rest, one primary action (quick-add) always reachable by thumb.

```text
┌───────────────────────────────────────────────┐
│  ☰   Good morning, Priya            🔔•   ＋    │  ← large title, avatar, bell, quick-add
│  Thursday, Jul 16 · 4 due today · 1 overdue     │  ← subtitle summary  (DI-safe)
├───────────────────────────────────────────────┤
│  TODAY                                          │  ← hero agenda card
│   ⚠ Overdue                                     │
│    ◯  Send contract to client       (yesterday) │  ← danger color + Overdue chip
│   ── now ──────────────────────────────────     │
│    ◯  Draft Q3 launch email      5:00 PM  ⚑     │
│    ◯  Review analytics deck      ⏱ 45m          │
├───────────────────────────────────────────────┤
│  [ Due 4 ] [ Overdue 1 ] [ Done 3 ] [ 7d 12 ]   │  ← glanceable stat chips (deep-link)
├───────────────────────────────────────────────┤
│  PRIORITIES                            See all ▸ │
│   ⚑ Ship pricing page     ⚑ Fix onboarding bug   │
├───────────────────────────────────────────────┤
│  AGENDA  (mini timeline)              Calendar ▸ │  ← optional toggle
│   9   10  11  12   1   2   3   4   5             │
│        ▓▓ standup      ▓▓▓ launch email          │
├───────────────────────────────────────────────┤
│  TEAM HIGHLIGHTS                                │  ← if in projects
│   • @you mentioned in "Website Redesign"        │
│   • 2 tasks assigned to you today               │
├───────────────────────────────────────────────┤
│  ⌨  Add a task…  "pay invoice tue 5pm !high" ➤ │  ← persistent quick-add (NLP)
├───────────────────────────────────────────────┤
│  [🏠][✓][📅][🔔•][⋯]                            │  ← native tab bar (glass)
└───────────────────────────────────────────────┘
```

- **Header:** large title greeting (time-of-day aware) + one-line summary; left avatar opens
  sidebar; right bell (badge) + `＋`. Large title collapses to inline on scroll; respects
  Dynamic Island + top safe area.
- **Today hero:** overdue pinned at top in `danger` with an "Overdue" chip, then a subtle
  "now" divider, then today's tasks sorted by time then priority. Inline complete + swipe.
- **Stat chips:** Due today / Overdue / Completed today / Upcoming (7d) — each deep-links to
  the matching Quick View.
- **Priorities:** up to ~5 High/Urgent incomplete tasks across all projects + "See all."
- **Agenda:** optional compact hour-by-hour timeline of scheduled tasks; "Open Calendar."
- **Team highlights:** mentions, new assignments, review requests (only if in projects).
- **Quick-add:** persistent bottom bar above the tab bar + home-indicator safe area;
  natural-language parsing; expands to a sheet for enrichment.
- **iPad / landscape:** two-column — Today + Priorities left, Agenda + Team highlights right;
  quick-add anchors the left column. Sections with no content collapse to a single affordance.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Header | `GlassNavBar`, `LargeTitleGreeting`, `SummarySubtitle`, `AvatarButton`, `InboxBell` (badge), `QuickAddButton` |
| Today hero | `TodaySection`, `OverdueGroup`, `NowDivider`, `TaskRow` (checkbox + title + time + flag), `SwipeActions` (Complete/Snooze/Delete), `ContextMenu` (long-press) |
| Stats | `StatChipRow`, `StatChip` (label + count), tap → Quick View |
| Priorities | `PrioritySection`, `TaskRow`, `SeeAllLink` |
| Agenda | `MiniTimeline`, `TimeBlock`, `OpenCalendarLink` |
| Team highlights | `HighlightsSection`, `MentionRow`, `AssignmentRow`, `ReviewRequestRow`, `AvatarStack` |
| Quick-add | `QuickAddBar`, `NLParseHighlighter`, `QuickAddSheet`, `ParsePreviewChip`, `AIButton` (✨), `VoiceButton` |
| Empty/loading | `EmptyState` (new user / all-done celebration), `SkeletonCard`, `PullToRefresh` |
| Feedback | `Toast`/`Snackbar` (undo complete), `OfflineBanner`, `HapticFeedback` (`expo-haptics`) |
| Customization | `SectionReorderSheet` (🔜), `WidgetVisibilityToggle` (🔜) |

Primitives in [03-design-system-ui.md](./03-design-system-ui.md); `TaskRow`, `TaskCheckbox`,
and swipe actions are shared with My Tasks + project lists.

---

## 5. Modern Features

Each: Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · Acceptance.

### 5.1 Today agenda (personal + team) ✅ v1
- **Purpose:** one focused list of what's due or scheduled today, across contexts.
- **Workflow:** on focus, compute today's set in the user's timezone; overdue pinned; sort by
  time then priority; inline complete/swipe/long-press.
- **UI:** `TodaySection` with `OverdueGroup`, `NowDivider`, `TaskRow`s.
- **Permissions:** shows only tasks the user can access (own + assigned/visible team tasks).
- **Offline:** fully from local mirror; completes queue as ops.
- **API:** `GET /tasks?filter[due]=today,overdue&filter[assignee]=me`.
- **DB:** `tasks(assignee_id, due_at) WHERE completed_at IS NULL`.
- **Notify:** completing clears any pending reminders for that task.
- **Acceptance:** correct set + order; TZ-correct "today"; overdue pinned; inline complete works.

### 5.2 Quick-add with natural-language parsing ✅ v1
- **Purpose:** capture a fully-structured task in seconds without leaving Home.
- **Workflow:** type "Pay invoice tomorrow 5pm !high #finance every month" → on-device
  parser extracts due date/time, priority (`!high`), label (`#finance`), recurrence; inline
  highlights show what was parsed; confirm chip preview; submit creates the task (defaults to
  My Tasks unless a project/context is chosen). Server LLM enriches when online (module 19).
- **UI:** `QuickAddBar` → `NLParseHighlighter` → optional `QuickAddSheet` for enrichment;
  ✨ and 🎤 buttons for AI/voice.
- **Permissions:** create scope; assigning to others requires project policy.
- **Offline:** on-device parse works offline; task created locally + queued.
- **API:** `POST /ai/parse` (enrich) then `POST /tasks`. **DB:** creates `tasks`.
- **Notify:** if a due time is set, a local reminder is scheduled.
- **Acceptance:** parses date/time/priority/label/recurrence; editable before save; works offline.

### 5.3 Glanceable stat chips ✅ v1
- **Purpose:** one-tap situational awareness + navigation.
- **Workflow:** chips show Due today / Overdue / Completed today / Upcoming (7d); tap → the
  matching Quick View list.
- **UI:** `StatChipRow`; counts recomputed on task change + at local midnight.
- **Permissions:** counts reflect only accessible tasks. **Offline:** computed locally.
- **API:** derived from cached tasks (no dedicated call). **DB:** aggregate over `tasks`.
- **Notify:** none. **Acceptance:** counts accurate; each chip deep-links correctly.

### 5.4 Inline complete, swipe, long-press ✅ v1
- **Purpose:** act on a task without opening it.
- **Workflow:** tap checkbox (haptic + strikethrough), swipe for Complete/Snooze/Delete,
  long-press for a context menu (reschedule Today/Tomorrow/Next week, set priority, open).
- **UI:** `TaskRow` + `SwipeActions` + `ContextMenu`; undo snackbar (5s).
- **Offline:** optimistic + queued. **API:** `POST /tasks/:id/complete`, `PATCH /tasks/:id`.
- **DB:** `tasks.completed_at`, `order`. **Notify:** complete clears reminders.
- **Acceptance:** completion updates counts instantly; undo restores; swipe thresholds haptic.

### 5.5 Priorities section ✅ v1
- Up to ~5 High/Urgent incomplete tasks across all projects; "See all" → Flagged Quick View.
- **API:** `GET /tasks?filter[priority]=high,urgent&filter[status]=open&limit=5`.

### 5.6 Agenda / mini-timeline (toggle) ✅ v1
- Compact hour-by-hour view of today's scheduled tasks + calendar events; "Open Calendar."
- **API:** `GET /tasks?filter[scheduled]=today` (+ calendar via [32](./32-integrations.md)).

### 5.7 Customizable dashboard 🔜 v1.1
- **Purpose:** let users reorder/hide sections (agenda, team highlights, priorities).
- **Workflow:** long-press a section header → `SectionReorderSheet`; toggle visibility.
- **DB:** `dashboard_prefs(user_id, org_id, section_order[], hidden_sections[])`.
- **Acceptance:** layout persists per user + workspace; resets available.

### 5.8 iOS home-screen & lock-screen widgets 🔜 v1.1
- **Purpose:** glance + capture without opening the app.
- **Workflow:** WidgetKit widgets show Today count / next task / a quick-add deep link; tap →
  `numil://task/{id}` or `numil://quickadd`. Full spec in
  [33-widgets-live-activities-watch.md](./33-widgets-live-activities-watch.md).
- **Acceptance:** widget data refreshes on sync; deep links land correctly.

---

## 6. Smart AI Features

AI on Home (full spec in [19-ai-assistant-copilot.md](./19-ai-assistant-copilot.md)):
- **"Plan my day" (🔜):** proposes time blocks for today's tasks respecting meetings, working
  hours, priority, and energy (Motion/Sunsama-style) — proposal-first, editable, reversible.
- **NL quick-add enrichment:** server LLM refines the on-device parse (assignee resolution,
  smart labels, recurrence detection) when online.
- **Daily narrative (🔜):** a one-line AI summary in the subtitle ("Heavy afternoon — 3
  deep-work tasks; consider moving the deck to tomorrow").
- **Smart suggestions:** "You have a gap at 2pm — knock out X?" (💡 Future, opt-in).
- Guardrails: suggestive only, Accept/Edit/Undo, permission-scoped, never auto-completes or
  auto-sends; respects org AI settings + quotas.

---

## 7. Productivity Features

- **My Day ritual** (MS To Do): pull today's chosen tasks to the top; evening "Shut down"
  summary.
- **Quick reschedule** chips (Today/Tomorrow/Next week) via swipe/long-press.
- **Start Focus/Pomodoro** on a Home task → [35-focus-pomodoro-habits.md](./35-focus-pomodoro-habits.md).
- **Streak / "all caught up"** celebration reinforces the daily habit.
- **Pull-to-refresh** to re-sync; **energy tag** hints feed AI planning.
- **Time blocking** from the agenda: drag a task onto the timeline (🔜).

---

## 8. Enterprise Features

Home respects org roles ([shared/rbac-permissions.md](./shared/rbac-permissions.md)); the
privacy invariant (no cross-user personal tasks) holds for every role:

| Home capability | Owner | Admin | Manager | Member | Guest |
|-----------------|:-----:|:-----:|:-------:|:------:|:-----:|
| See own Today / agenda | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quick-add personal task | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign task to others via quick-add | ✅ | ✅ | ✅ | project-policy | ❌ |
| See team highlights (accessible) | ✅ | ✅ | ✅ | ✅* | shared* |
| Manager "team today" digest (🟣) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Set org-default dashboard sections | ✅ | ✅ | ❌ | ❌ | ❌ |
| See another user's personal tasks | ❌ | ❌ | ❌ | ❌ | ❌ |

`*` within accessible scope.

- **Scoped team highlights:** only shows mentions/assignments/reviews the user can access;
  respects project RBAC ([shared/rbac-permissions.md](./shared/rbac-permissions.md)).
- **Privacy invariant:** no role can see another user's personal (My Tasks) items on any
  dashboard.
- **Manager lens (🟣 v2):** an optional "team today" digest card for managers (their team's
  due/overdue counts) — read-only, aggregate, never exposing personal tasks.
- **Org-configurable defaults (🔜):** admins can set default visible sections for new users.
- **Audit:** dashboard actions that change data (complete/reschedule) log to
  [29-activity-feed-audit-logs.md](./29-activity-feed-audit-logs.md).

---

## 9. Collaboration Features

- **Team highlights feed:** @mentions, new assignments to you, "needs your review," and
  recent activity in your most active projects.
- **Assignment awareness:** tasks assigned to you today surface immediately with the assigner
  + project.
- **One-tap into discussion:** a highlight routes to the exact comment on the task
  ([10-task-detail.md](./10-task-detail.md)).
- **Presence-lite (🟣 v2):** small avatar hints on team highlight rows.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- Home renders entirely from the **local mirror**; today/overdue/priority sets and stat
  counts are computed locally, so the screen is instant and works with no signal.
- Quick-add uses the **on-device NL parser** offline; the task is created locally + queued;
  server LLM enrichment applies on reconnect.
- Completions/reschedules are optimistic ops; counts update immediately and reconcile on sync.
- "Plan my day" and AI narrative require network → show a clear "available online" affordance,
  never a dead spinner.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Home only queries tasks the user is authorized to see; server scopes the query (no
  over-fetch then client filter).
- Personal task content on Home is never exposed to Admins or included in logs/analytics.
- Team highlights are permission-filtered server-side; a lost permission removes the row on
  next sync.
- Deep links from stat chips/widgets validate scope server-side on open.

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- The header **bell badge** mirrors unread notification count; tapping opens Inbox.
- Completing a task on Home cancels its pending local reminders atomically.
- The subtitle summary ("4 due today, 1 overdue") is derived from the same reminder engine;
  a daily-digest notification can deep-link back to Home (`numil://home`).
- Widget/Live Activity refreshes align with reminder scheduling (module 33).

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- The greeting + summary are one VoiceOver announcement ("Good morning Priya, 4 due today, 1
  overdue").
- Stat chips announce label + count + hint ("Overdue, 1 task, double-tap to view").
- `TaskRow` exposes Complete/Snooze/Delete as `accessibilityActions`; completion state
  announced.
- Quick-add announces parsed values ("Parsed: due tomorrow 5 PM, high priority, label
  finance") before save.
- All sections reachable via Switch Control / external keyboard; no color-only signals
  (overdue = color + "Overdue" chip).

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- **Complete:** checkbox ring-fill + checkmark draw, `success` haptic, row strike + fade to
  Completed; count chips tick to the new value.
- **Row → detail:** shared-element hero on title + color dot (`motion.slow`).
- **Quick-add:** bar expands to sheet with `spring.gentle`; parse highlights fade in.
- **All-done state:** celebratory confetti (`spring.bouncy`, ≤1.2s) — only when everything
  due today is complete; skipped under Reduce Motion.
- **Pull-to-refresh:** custom spinner; shimmer skeletons stop the instant data arrives.

---

## 15. Performance

- Today/Priorities/Highlights lists use FlashList windowing with memoized `TaskRow`s; swipe
  actions live inside the row.
- Stat counts + today/overdue sets are precomputed from the local store on focus + on task
  change (not recomputed per render); date math off the render path.
- Agenda mini-timeline lazy-mounts only when the section is visible.
- Screen open target < 150ms from cache; optimistic completes < 16ms.
- `expo-image` for avatars/thumbnails with placeholders; React Compiler reduces re-renders.
- Background sync + local-midnight timer refresh keep counts fresh without a full reload.

---

## 16. Database Design

Home reads the core task model (canonical in [17-data-model-api.md](./17-data-model-api.md)):

```text
tasks(id, org_id→orgs, project_id?→projects, owner_id→users, assignee_id?→users,
      title, status, priority, due_at?, due_has_time, scheduled_at?, duration_min?,
      completed_at?, order, version, created_at, updated_at, deleted_at?)
notifications(id, org_id, user_id→users, type, payload_json, read_at?, created_at)
activity_log(id, org_id, actor_id→users, entity_type, entity_id, action,
             before_json, after_json, created_at)      -- immutable audit
dashboard_prefs(user_id→users, org_id→orgs, section_order[], hidden_sections[], updated_at)  -- 🔜
```

**Indexes powering Home:** `tasks(assignee_id, due_at) WHERE completed_at IS NULL`
(today/overdue), `tasks(org_id, priority) WHERE status='open'` (priorities),
`tasks(assignee_id, completed_at)` (done today), `notifications(user_id, read_at)` (badge).
**Constraints:** "today" bucket computed against the user's timezone; personal task ⇒
`project_id IS NULL` and `assignee_id = owner_id`. **Soft delete** via `deleted_at`.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/home?tz=America/Los_Angeles` | Aggregated dashboard (today, overdue, stats, priorities, highlights) |
| GET | `/tasks?filter[due]=today,overdue&filter[assignee]=me&sort=dueAt,-priority` | Today set |
| GET | `/tasks?filter[priority]=high,urgent&filter[status]=open&limit=5` | Priorities |
| POST | `/ai/parse` | NL quick-add enrichment |
| POST | `/tasks` (Idempotency-Key) | Create from quick-add |
| POST | `/tasks/:id/complete` | Inline complete (+recurrence spawn) |
| PATCH | `/tasks/:id` (If-Match) | Inline reschedule/priority |
| GET | `/notifications/unread-count` | Header bell badge |
| GET/PUT | `/home/prefs` | Dashboard customization (🔜) |

**Sample aggregated Home request/response**
```http
GET /v1/home?tz=America/Los_Angeles
Authorization: Bearer <token>   X-Org-Id: org_123
```
```json
{ "data": {
    "summary": { "dueToday": 4, "overdue": 1, "completedToday": 3, "upcoming7d": 12 },
    "today": [
      { "id": "task_abc", "title": "Draft Q3 launch email", "dueAt": "2026-07-16T17:00:00Z",
        "dueHasTime": true, "priority": "high", "projectId": null, "version": 12 }
    ],
    "overdue": [ { "id": "task_zzz", "title": "Send contract", "dueAt": "2026-07-15T23:00:00Z" } ],
    "priorities": [ { "id": "task_p1", "title": "Ship pricing page", "priority": "urgent" } ],
    "highlights": [ { "type": "mention", "taskId": "task_m1", "projectId": "proj_web" } ]
  },
  "meta": { "requestId": "req_01H..." } }
```

**Realtime:** `task.updated` / `task.completed` on subscribed channels and
`notification.created` on `user:{id}` refresh Home live. **Errors:** standard envelope
(`forbidden` 403 for out-of-scope highlights, `conflict` 409 on stale complete).

---

## 18. Edge Cases

- **New user, no tasks:** friendly hero ("Nothing due today — add your first task") + CTA;
  quick-add front and center.
- **All done:** celebratory empty state ("You're all caught up ✨").
- **Not in any project:** Team Highlights section hidden entirely.
- **Timezone/DST change or travel:** "today" recomputed in local tz; overdue rollover at
  local midnight; reminders recomputed.
- **Task completed on another device:** realtime update removes it from Today; counts adjust.
- **Overdue rollover mid-view:** a task passing its due time moves to Overdue without a reload.
- **Offline:** banner shown; data from cache; quick-add queued; "Plan my day"/AI disabled.
- **Permission lost** (removed from a project): highlighted team task disappears on next sync.
- **Huge overdue backlog:** overdue group is collapsible with a count ("Overdue · 37 ▸").
- **Duplicate quick-add submit (retry):** deduped by `Idempotency-Key`.
- **Recurring task completion:** spawns next occurrence; today's list updates accordingly.
- **Clock/locale changes greeting:** morning/afternoon/evening from device clock.

---

## 19. User States

- **First-time:** empty hero + coach-mark on quick-add ("Try: 'call mom tomorrow 6pm'").
- **Returning:** today/overdue/priorities populated; pull-to-refresh; My Day ritual.
- **Power user:** customized sections (🔜), "Plan my day," keyboard/iPad two-column.
- **Guest:** personal quick-add + only shared-project highlights; no org-wide data.
- **Manager:** team highlights richer; manager digest card (🟣 v2).
- **Admin/Owner:** same personal Home; admin surfaces live under More, not Home.
- **Offline / poor network:** cache-driven; queued quick-adds; AI features gated.
- **Tablet / landscape:** two-column dashboard; quick-add anchored.
- **Dark mode / large text / a11y:** token-driven; AX5 reflow; Reduce Motion honored; RTL.

```text
[Open Home] → compute today/overdue/stats (local, tz-aware)
     ├─ empty → [New-user hero + CTA]
     ├─ all today complete → [All-caught-up celebration]
     └─ has work → [Today hero + chips + priorities + agenda + highlights]
Quick-add (any state) → parse → optional enrich sheet → create (optimistic) → schedule reminder
```

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md).

| event | key properties |
|-------|----------------|
| `screen_viewed` | `screen=home`, `referrer` |
| `home_refreshed` | `method` (focus/pull) |
| `task_created` | `source=quickadd`, `has_due`, `has_time`, `priority`, `project_type` |
| `quick_add_parsed` | `parsed_fields[]` (date/time/priority/label/recurrence) |
| `task_completed` | `via=home`, `was_overdue`, `had_subtasks` |
| `task_rescheduled` | `via` (swipe/longpress), `target` (today/tomorrow/nextweek) |
| `stat_chip_tapped` | `chip` (due/overdue/done/upcoming) |
| `quick_view_opened` | `view` |
| `highlight_opened` | `type` (mention/assignment/review) |
| `plan_my_day_invoked` | `accepted`, `blocks_count` (🔜) |
| `dashboard_customized` | `action` (reorder/hide), `section` (🔜) |

---

## 21. Acceptance Criteria

1. Home is the default tab after login and cold start.
2. Today shows tasks due or scheduled today, correctly ordered (time then priority).
3. Overdue tasks are pinned at the top in danger color with an "Overdue" chip.
4. "Today" respects the user's timezone and rolls over at local midnight.
5. The subtitle summary matches the true due/overdue counts.
6. Stat chips (Due/Overdue/Done/Upcoming) show accurate counts.
7. Each stat chip deep-links to the matching Quick View list.
8. Priorities shows up to ~5 High/Urgent open tasks with "See all."
9. Quick-add parses date/time/priority/label/recurrence from natural language.
10. Parsed values are shown inline and are editable before save.
11. Quick-add defaults to My Tasks unless a project/context is chosen.
12. A due time set via quick-add schedules a local reminder.
13. Quick-add works offline via the on-device parser and queues the create.
14. Completing a task on Home updates counts immediately.
15. Completing a recurring task spawns the next occurrence.
16. Swipe actions offer Complete/Snooze/Delete with haptic thresholds.
17. Long-press offers reschedule (Today/Tomorrow/Next week), priority, open.
18. Destructive/complete actions offer a 5s undo snackbar.
19. Team highlights show only accessible mentions/assignments/reviews.
20. No role sees another user's personal tasks on any dashboard.
21. Agenda mini-timeline reflects today's scheduled tasks + calendar events.
22. "Open Calendar" navigates to the Calendar module.
23. Pull-to-refresh re-syncs and updates counts.
24. Empty (new user) and all-done states render friendly hero content.
25. Works offline with cached data and queued quick-adds (no dead spinners).
26. "Plan my day" (🔜) proposes editable, reversible time blocks respecting meetings.
27. Header bell badge reflects unread notifications; tapping opens Inbox.
28. Realtime updates (complete/assign/mention) refresh Home without a manual reload.
29. Screen opens from cache in < 150ms; completes apply in < 16ms.
30. Dashboard customization (🔜) persists section order/visibility per user + workspace.
31. iOS widgets (🔜) show Today count/next task and deep-link correctly.
32. iPad landscape shows a two-column dashboard with quick-add anchored.
33. Dynamic Type to AX5 reflows without clipping; light/dark themes verified.
34. VoiceOver announces greeting/summary, chips, and row actions correctly.
35. Reduce Motion disables hero/confetti; state feedback retained.
36. Analytics events fire with correct properties (incl. offline-buffered).

---

## 22. Future Roadmap

- **V1 (✅):** today agenda (personal + team), overdue pinning, stat chips, priorities,
  agenda toggle, team highlights, quick-add NLP, inline complete/swipe/long-press,
  pull-to-refresh, offline.
- **V1.1 (🔜):** "Plan my day" AI, customizable dashboard sections, iOS home/lock-screen
  widgets (module 33), AI daily narrative, time-blocking drag onto the agenda.
- **V2 (🟣):** manager "team today" digest card, presence-lite on highlights, multiple
  saved dashboard layouts, richer iPad multi-pane.
- **Future (💡):** proactive AI nudges ("gap at 2pm — do X?"), Lock-Screen Live Activity for
  the current focus task, Apple Watch "Today" complication.
- **Experimental (🧪):** fully AI-arranged dashboard that reorders itself by predicted
  relevance.
- **AI track:** energy-aware planning, weekly review ritual surfaced on Home (module 19/36).
- **Enterprise track:** org-default dashboard templates, admin-curated highlight rules.
