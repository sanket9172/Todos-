# 01 · Product Overview & Vision

> Follows the [Master PRD Template](./00-prd-template.md). This is the product's north-star
> document: the "why" and the "shape" of Numil that every other module (02–43) refines.

---

## 1. Purpose

Numil is an **iOS-first, offline-first team & personal productivity platform** built on
Expo SDK 57 + React Native 0.86. It lets a single person run their day *and* lets an
organization run its work — in one calm, fast, native app.

**The user problem.** The productivity market is split into two painful camps. On one side,
delightful-but-shallow personal apps (Things 3, Todoist, Apple Reminders, TickTick, MS To
Do) that feel great but collapse under team coordination. On the other, powerful-but-heavy
work platforms (Jira, ClickUp, Monday, Asana, Linear, Notion) whose depth intimidates,
overwhelm on a phone, and require a laptop to be usable. People end up juggling two or three
tools and copy-pasting between "my stuff" and "the team's stuff."

**Numil's thesis:** *simple by default, deep on demand.* A task is a title + a checkbox in
under five seconds; the same task can carry status, dependencies, custom fields, automation,
and AI when — and only when — the user reaches for them. Personal and team work live in one
switchable context, so the "subway test" (no signal, one hand, five seconds) and the
"quarterly planning" workflow are the same product.

**User goals**
- Capture anything in one thumb tap, then enrich later without friction.
- See "what should I do right now?" across personal + team work in one glance.
- Never miss a deadline — the right reminder at the right time, reliably.
- Collaborate (assign, comment, mention, share) without switching apps.
- Trust the app offline and on a plane, and trust the org's data governance.

**Business goals**
- Win activation with a Things-grade first-run, then expand into seats via team features.
- Monetize *depth* (AI credits, automation, custom fields, enterprise governance) while the
  simple core stays free/cheap and beloved.
- Be the org's system of record for work, with the audit trail, RBAC, and compliance that
  enterprises require.

**KPIs this module moves (north-star set).** Activation (≥3 tasks in week 1), D7/D30
retention, reminder reliability (delivered within ±60s ≥99%), median "open → task created"
< 8s, collaboration ratio (orgs with ≥2 active members + ≥1 shared project), and AI
acceptance rate. Detailed instrumentation lives in
[shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md).

---

## 2. Navigation

At the product level, "navigation" means **how a person enters Numil and how the surfaces
connect.** The canonical interaction model is defined in
[04-navigation-sidebar.md](./04-navigation-sidebar.md); this section maps the whole product.

**Entry points into the product**
- Cold launch → **Home Dashboard** ([07-home-dashboard.md](./07-home-dashboard.md)) after
  auth ([05-authentication-login.md](./05-authentication-login.md)).
- Push/reminder tap → deep link `numil://task/{id}` (scheme `numil` from `app.json`).
- iOS Home-Screen / Lock-Screen widget, Siri Shortcut, or Share Sheet → quick capture
  ([33-widgets-live-activities-watch.md](./33-widgets-live-activities-watch.md),
  [34-siri-voice-apple-intelligence.md](./34-siri-voice-apple-intelligence.md)).
- Email-to-task, calendar event, or integration webhook
  ([32-integrations.md](./32-integrations.md)).

**Product surface map (how the 43 modules connect)**

```text
Auth/Onboarding ─▶ Home Dashboard ─┬─▶ My Tasks ─────▶ Task Detail ◀─┐
   (05,06)            (07)          ├─▶ Team/Projects ─▶ Task Detail  │
                                    ├─▶ Calendar ──────▶ Task Detail  │
                                    ├─▶ Inbox (Notifs 12)             │
                                    └─▶ More ▸ Search(14) Reports(16) │
                                              Settings(15) Org(13)    │
Cross-cutting copilots & engines (available everywhere):             │
  AI(19) · Automation(20) · Offline(shared) · Search infra(39) ──────┘
```

**Navigation hierarchy / breadcrumbs.** `Workspace ▸ Project (or "My Tasks") ▸ Task`. On
iPhone, deep surfaces open as **sheets** (keep context) or **push** (deep links). On iPad,
a persistent **split view** keeps the sidebar + list + detail on screen.

**Transitions.** iOS-native throughout — slide push, `spring.gentle` sheets, shared-element
hero from list row → Task Detail. Motion tokens in
[shared/animation-spec.md](./shared/animation-spec.md).

---

## 3. Complete UI Layout

The product's information architecture is a **hub-and-spoke**: five bottom tabs (the hub)
plus a left drawer (the collections), with Task Detail as the shared "leaf." Every screen
obeys the UI-simplicity rule: **one** primary action + at most **five** secondary
affordances at rest.

```text
┌───────────────────────────────────────────────┐
│  ☰  Good morning, Priya            🔔   ＋      │  ← large title, Dynamic Island safe
│  Thu Jul 16 · 4 due today · 1 overdue           │
├───────────────────────────────────────────────┤
│  TODAY                                          │  ← hero agenda card
│   ◯  Draft Q3 launch email      5:00 PM  ⚑      │
│   ◯  Review analytics deck      ⏱ 45m           │
├───────────────────────────────────────────────┤
│  [ Due 4 ] [ Overdue 1 ] [ Done 3 ] [ 7d 12 ]   │  ← glanceable stat chips
├───────────────────────────────────────────────┤
│  PRIORITIES                            See all ▸ │
│   ⚑ Ship pricing page   ⚑ Fix onboarding bug     │
├───────────────────────────────────────────────┤
│  ⌨  Add a task…  "pay invoice tue 5pm !high"  ➤ │  ← quick-add NLP bar
├───────────────────────────────────────────────┤
│  [🏠 Home] [✓ Tasks] [📅 Cal] [🔔 Inbox] [⋯ More]│  ← native tab bar (glass)
└───────────────────────────────────────────────┘
```

- **Top:** large title greeting + drawer toggle (avatar), inbox bell (badge), and quick-add
  `＋`. Respects Dynamic Island + top safe area; large title collapses to inline on scroll.
- **Middle:** the "Today" hero, glanceable stats, priorities, agenda — each a projection of
  the same task store edited in Task Detail.
- **Bottom:** persistent quick-add + native tab bar sitting above the home-indicator safe
  area (`BottomTabInset` = 50 on iOS per `src/constants/theme.ts`).
- **iPad / landscape:** three-column split view (sidebar · list · detail); the phone's
  sheets become inline panels. Portrait iPad collapses to two columns.
- **Empty space is a feature:** calm at rest, power on demand.

---

## 4. Complete Component Breakdown

At the product level the "components" are the **module surfaces** and the shared vocabulary
they all speak. Primitive UI components live in
[03-design-system-ui.md](./03-design-system-ui.md).

| Surface group | Modules (docs) |
|---------------|----------------|
| Capture & do | Home (07), My Tasks (08), Task Detail (10), Quick Add / NLP (07, 19) |
| Team & plan | Projects (09), Calendar (11), Sprints (23), Goals/OKRs (22), Templates (24) |
| Communicate | Notifications (12), Chat (26), Documents (25), Whiteboard (27), Activity (29) |
| Find & measure | Search & Views (14), Reports (16), AI Insights (36), Search infra (39) |
| Administer | Org & Roles (13), Settings (15), Admin (30), Billing (31), Security Ctr (40) |
| Extend | AI (19), Automation (20), Integrations (32), Widgets/Watch (33), Siri (34), API (38) |

**Product lexicon (glossary).** Precise, shared terms used across all docs:

| Term | Meaning |
|------|---------|
| **Organization (Org)** | Top-level tenant; contains members, projects, settings, billing. |
| **Workspace** | A switchable context; a user may belong to several orgs/workspaces. |
| **Project** | Shared container of team tasks (e.g., "Marketing Q3"); has members + roles. |
| **Task** | One unit of work; personal (`projectId = null`) or team (belongs to a project). |
| **Subtask** | A checklist item inside a task; can be promoted to a full task. |
| **Assignee / Watcher** | Who's responsible / who follows for updates without owning. |
| **Due vs Scheduled** | When it must be *done* vs when you plan to *work* on it. |
| **Duration / Recurrence** | Estimated effort / a rule that regenerates the task. |
| **View** | A saved filter + sort + grouping (see 14). |
| **Label / Priority** | Freeform tag / None–Low–Medium–High–Urgent. |
| **Role** | Owner / Admin / Manager / Member / Guest (org) + Lead/Contributor/Viewer (project). |

Reusable primitives referenced everywhere: `TaskRow`, `TaskCheckbox`, `PropertyChip`,
`GlassNavBar`, `SegmentedControl`, `BottomSheet`, `Toast`, `Skeleton`, `AvatarStack`,
`AIButton` — all defined in [03-design-system-ui.md](./03-design-system-ui.md).

---

## 5. Modern Features

Numil's competitive wedge, framed as **what we borrow and how we stay simple.** Each feature
follows Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · Acceptance.

### 5.1 Unified personal + team workspace (vs Todoist/Asana split) ✅ v1
- **Purpose:** end the two-app juggle; one place for "mine" and "ours."
- **Workflow:** a task created in Quick Add defaults to My Tasks; move-to-project promotes it
  to team work with an assignee.
- **UI:** the same `TaskRow`/Task Detail render personal and team tasks; a project chip marks
  team tasks.
- **Permissions:** personal tasks readable only by owner (even Admins cannot see them);
  team tasks by project scope — see [shared/rbac-permissions.md](./shared/rbac-permissions.md).
- **Offline:** both stores fully editable offline.
- **API:** `POST /tasks` (with/without `projectId`), `POST /tasks/:id/move`.
- **DB:** `tasks.project_id` nullable discriminates personal vs team.
- **Notify:** move-to-project notifies the new assignee.
- **Acceptance:** switching workspaces never mixes personal + team data; move preserves history.

### 5.2 "Simple by default, deep on demand" progressive disclosure ✅ v1
- **Purpose:** keep the first tap trivial while depth is one layer down.
- **Workflow:** empty properties render as subtle "＋ add" chips; advanced fields hide behind
  `•••`, long-press, and sheets.
- **UI:** property rail on Task Detail; calm home; power in menus.
- **Acceptance:** any at-rest screen shows ≤1 primary + ≤5 secondary affordances (enforced in
  design review per [00-prd-template.md](./00-prd-template.md)).

### 5.3 Native iOS feel: sheets, swipe, context menus, haptics ✅ v1
- Like Things 3's polish: medium/large detents, swipe-to-complete/snooze/delete, long-press
  context menus, `expo-haptics` feedback. Motion per
  [shared/animation-spec.md](./shared/animation-spec.md).

### 5.4 Time intelligence: due / scheduled / duration / recurrence ✅ v1
- **Purpose:** model *when it's due*, *when you'll do it*, *how long*, and *repeat rules*
  independently (beats single-date apps).
- **API/DB:** `tasks(due_at, due_has_time, scheduled_at, duration_min, recurrence_json)`.
- **Acceptance:** all four are independently editable; recurrence spawns next occurrence on
  completion (detailed in [10-task-detail.md](./10-task-detail.md)).

### 5.5 Command palette + global capture (vs Linear ⌘K) 🔜 v1.1
- Pull-down on Home (⌘K on iPad) opens a fuzzy command/search palette; Share Sheet + Siri
  capture from anywhere. See [04-navigation-sidebar.md](./04-navigation-sidebar.md) §5.

### 5.6 Boards, calendar, timeline projections (vs ClickUp/Monday) 🟣 v2
- The same tasks projected as list, board, calendar, and timeline
  ([09](./09-team-tasks-projects.md), [11](./11-calendar-scheduling.md)). Timeline/Gantt is v2.

**Competitive positioning (why Numil wins on iOS)**

| Competitor | Their strength | Where Numil wins |
|-----------|----------------|------------------|
| Things 3 / Todoist | Beautiful personal capture | Adds team + org + AI without losing calm |
| Notion / ClickUp | Infinite depth | Native iOS speed; simple-by-default; offline-first |
| Linear | Fast, opinionated eng workflow | Personal + general teams, not just engineering |
| Jira / Asana / Monday | Enterprise PM | Phone-first, thumb-reachable, 60fps, no clutter |
| Motion / Sunsama | AI planning & rituals | Same, plus a great free/simple core |

---

## 6. Smart AI Features

AI is a cross-cutting copilot, fully specified in
[19-ai-assistant-copilot.md](./19-ai-assistant-copilot.md). Product-level promise: **AI is
suggestive, proposal-first (Accept/Edit/Undo), permission-scoped, and never auto-sends.**

| Pillar | What it does for the user | Module |
|--------|---------------------------|--------|
| NL capture | "Email Priya the deck tomorrow 4pm !high #launch every Fri" → structured task | 19 §5.1 |
| Breakdown & estimate | Suggest subtasks; predict `durationMin` | 10, 19 |
| Day/week planning | Motion-style auto-schedule into free time | 19 §5.3 |
| Summaries & action items | TL;DR threads/docs → proposed tasks | 19 §5.7 |
| Semantic search + RAG chat | Cited answers over accessible content | 39, 19 |
| Risk / health insights | Flag at-risk tasks/projects | 36 |

Governance (per-org enable/disable, quotas, no-train, audit) lives in 19 §8 and
[40-security-compliance-center.md](./40-security-compliance-center.md).

---

## 7. Productivity Features

- **Today / My Day ritual** (MS To Do) on Home; morning "Plan my day," evening "Shut down."
- **Focus & Pomodoro, habits, streaks** ([35-focus-pomodoro-habits.md](./35-focus-pomodoro-habits.md)).
- **Time blocking** — schedule a task as a calendar block of `durationMin`.
- **Energy/effort tags** (light/medium/deep) to power AI planning.
- **Time tracking & timesheets** ([21-time-tracking-timesheets.md](./21-time-tracking-timesheets.md)).
- **Quick reschedule** via swipe / long-press (Today / Tomorrow / Next week).
- **Templates & recurring workflows** ([24-templates-recurring-workflows.md](./24-templates-recurring-workflows.md)).

---

## 8. Enterprise Features

Numil is **organization-ready** from day one. Roles per
[shared/rbac-permissions.md](./shared/rbac-permissions.md), enforced server-side:

| Capability | Owner | Admin | Manager | Member | Guest |
|-----------|:-----:|:-----:|:-------:|:------:|:-----:|
| Personal tasks (own) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/complete team tasks | ✅ | ✅ | ✅ | ✅* | shared* |
| Create/manage projects | ✅ | ✅ | own/assigned | ⚙️ | ❌ |
| Invite members / change roles | ✅ | ≤Admin | ≤Member/Guest | ❌ | ❌ |
| Org settings & security | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure AI governance | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | scoped | ❌ | ❌ |
| Billing / delete-transfer org | ✅ | ❌ | ❌ | ❌ | ❌ |
| See another user's personal tasks | ❌ | ❌ | ❌ | ❌ | ❌ |

`*` within accessible scope · `⚙️` gated by the "Members can create projects" org setting.

Capabilities:

- **RBAC + ABAC** roles and scopes ([shared/rbac-permissions.md](./shared/rbac-permissions.md)).
- **Immutable audit log** of security-relevant + data changes ([29-activity-feed-audit-logs.md](./29-activity-feed-audit-logs.md)).
- **SSO (SAML/OIDC), SCIM provisioning, 2FA/passkeys** ([05-authentication-login.md](./05-authentication-login.md)).
- **Automation & workflow rules** ([20-automation-workflow-rules.md](./20-automation-workflow-rules.md)).
- **Compliance:** SOC 2 / ISO 27001 posture, GDPR/CCPA export + erasure, retention + legal
  hold ([40-security-compliance-center.md](./40-security-compliance-center.md)).
- **Billing & subscription**, seats, AI credits ([31-billing-subscription.md](./31-billing-subscription.md)).
- **Custom fields / statuses / roles** (🟣 v2), **data residency / BYO-key** (🟣 v2).

---

## 9. Collaboration Features

- **Comments, @mentions, reactions, threads, pinned decisions** (see [10-task-detail.md](./10-task-detail.md)).
- **Live presence, typing indicators, realtime updates** via WebSocket
  ([shared/api-conventions.md](./shared/api-conventions.md)).
- **Team chat & collaboration hub** ([26-team-chat-collaboration.md](./26-team-chat-collaboration.md)).
- **Shared docs & whiteboards** ([25](./25-documents-knowledge-base.md), [27](./27-whiteboard-brainstorming.md)).
- **Guest sharing** with scoped, revocable access; **watchers/followers**; **live
  co-editing** (🟣 v2, CRDT).

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Product promise:** the entire capture/do/complete loop works with zero network — the
  "subway test" is a launch requirement, not a nice-to-have.
- Local SQLite mirror + outbox queue is the default for tasks, subtasks, comments, views.
- Read-heavy surfaces (reports, semantic search, AI planning) degrade to cached/heuristic
  results offline with a clear "AI/network unavailable" affordance — never a dead spinner.
- No product surface may hard-require the network for its primary action except sign-in.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- **Privacy invariant (product-wide):** personal task content is never visible to Admins or
  anyone but the owner; task content never appears in logs/analytics.
- Tokens in Keychain (`expo-secure-store`); `ITSAppUsesNonExemptEncryption: false` in
  `app.json` (standard HTTPS only).
- Every mutation is re-authorized server-side; the client hides UI only as UX.
- Enterprise posture (SSO/SCIM, audit, retention, legal hold) centralized in
  [40-security-compliance-center.md](./40-security-compliance-center.md).

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- Product reliability bar: **reminder delivered within ±60s of schedule ≥ 99%.**
- Categories with actions (Complete / Snooze / Reply / Open) work from the lock screen.
- Editing a task's due/scheduled time reschedules local reminders atomically.
- Long AI jobs surface as **Live Activities** in the Dynamic Island (see 19 §12, 33).

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- **Product commitment: WCAG 2.2 AA + Apple a11y best practices on every screen** — a
  release gate, not a backlog item.
- VoiceOver, Dynamic Type to AX5 (no clipping), Reduce Motion/Transparency, high contrast,
  no color-only signals (priority = flag + label), full RTL, keyboard/Switch Control.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Product signature moments: checkbox-complete (ring + haptic), shared-element hero into
  Task Detail, confetti reserved for goal/streak/all-done, `spring.gentle` sheets/drawer.
- 60fps budget (ProMotion 120fps aware); Reduce Motion swaps movement for 120ms cross-fades.

---

## 15. Performance

Product-level budgets that every module inherits:

| Budget | Target |
|--------|--------|
| Cold start (launch → interactive Home) | < 1.8s on iPhone 12 |
| Screen open from cache (list → Task Detail) | < 150ms |
| Task list scroll | 60fps (120fps ProMotion) via FlashList windowing |
| Optimistic write latency (tap → UI) | < 16ms (network off the main path) |
| Reminder delivery accuracy | ±60s ≥ 99% |
| JS bundle over-the-air update | incremental; code-split heavy editors/pickers |

Techniques: FlashList virtualization, memoized rows, precomputed date strings, lazy-mounted
editors, `expo-image` caching, Reanimated worklets on the UI thread, React Compiler
(`experiments.reactCompiler: true` in `app.json`).

---

## 16. Database Design

The core domain (canonical model in [17-data-model-api.md](./17-data-model-api.md)):

```text
orgs(id, name, plan, created_at, deleted_at?)
users(id, email, name, avatar_url, created_at, deleted_at?)
memberships(id, org_id→orgs, user_id→users, org_role, created_at)   UNIQUE(org_id,user_id)
projects(id, org_id→orgs, name, color, visibility, archived_at?, created_at, deleted_at?)
project_members(project_id→projects, user_id→users, project_role)   PK(project_id,user_id)
tasks(id, org_id→orgs, project_id?→projects, owner_id→users, assignee_id?→users,
      title, description_json, status, priority, due_at?, due_has_time, scheduled_at?,
      duration_min?, recurrence_json?, completed_at?, order, version,
      created_at, updated_at, deleted_at?)
labels(id, org_id→orgs, name, color)                task_labels(task_id, label_id)  PK(both)
notifications(id, org_id, user_id→users, type, payload_json, read_at?, created_at)
activity_log(id, org_id, actor_id→users, entity_type, entity_id, action,
             before_json, after_json, created_at)   -- immutable audit
```

**Indexes:** `tasks(assignee_id, due_at)`, `tasks(project_id, status)`,
`tasks(org_id, due_at) WHERE completed_at IS NULL`, `memberships(org_id, user_id)`,
full-text on `tasks.title`+`description`. **Constraints:** personal task ⇒ `project_id IS
NULL` and `assignee_id = owner_id`; `assignee_id ∈ project_members`. **Soft delete** via
`deleted_at`; **audit/history** tables append-only.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md) (base
`https://api.numil.app/v1`, Bearer auth, `Idempotency-Key`, cursor pagination, `If-Match`
concurrency). Product-level surface:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` · `/auth/refresh` | Session |
| GET | `/me` | Current user + memberships |
| GET/POST | `/orgs` · `/orgs/:id` | Org CRUD |
| GET/POST | `/projects` · `/projects/:id` | Projects |
| GET/POST | `/tasks?filter[...]&sort=&cursor=` | List/create tasks |
| GET/PATCH/DELETE | `/tasks/:id` (If-Match) | Task detail |
| POST | `/tasks/:id/complete` · `/tasks/:id/move` | Lifecycle |
| GET | `/sync?since=` · POST `/sync` | Offline delta + batch ops |
| POST | `/ai/*` | Copilot capabilities (see 19) |
| WS | `wss://rt.numil.app/v1` (`org:` `project:` `task:` `user:` channels) | Realtime |

**Sample create request/response**
```http
POST /v1/tasks
Authorization: Bearer <token>
Idempotency-Key: 9d1c...  X-Org-Id: org_123
{ "title": "Draft Q3 launch email", "dueAt": "2026-07-17T17:00:00Z",
  "dueHasTime": true, "priority": "high", "projectId": null }
```
```json
{ "data": { "id": "task_abc", "title": "Draft Q3 launch email",
  "status": "open", "priority": "high", "dueAt": "2026-07-17T17:00:00Z",
  "version": 1, "createdAt": "2026-07-16T21:39:00Z" },
  "meta": { "requestId": "req_01H..." } }
```

**Errors** use the shared envelope (`validation_failed` 422, `forbidden` 403, `conflict`
409, `rate_limited` 429). Realtime events reconcile by `version`.

---

## 18. Edge Cases

- **First launch, no account:** land on auth; capture blocked until an org exists (or use
  "solo workspace" auto-provisioned on signup).
- **Sole Owner leaves/deletes account:** force ownership transfer before deletion.
- **Offline signup/first sync:** allow local-only tasks; reconcile on first connect.
- **Timezone/DST change or travel:** times stored UTC, rendered local; reminders recomputed.
- **Permission lost mid-session** (removed from org/project): next mutation `403` → rollback
  + notice; personal tasks unaffected.
- **Org over seat/plan limit:** read-only or grace banner; capture still works.
- **Archived project / deleted task via deep link:** graceful read-only / "no longer
  available" states.
- **Storage full:** metadata keeps syncing; media caching pauses with a warning.
- **Multi-device same user:** per-device cursors; optimistic edits reconcile by version.
- **Analytics/consent off:** only crash/health telemetry; no task content ever logged.

---

## 19. User States

Personas double as the primary user states, each with a representative journey:

- **Priya — Individual contributor (first-time → returning).** *Journey:* installs from
  TestFlight → signs in with Apple → captures "Pay invoice tomorrow 5pm !high" in 6s →
  gets a reminder next day → swipes complete. Values speed, calm, reliable reminders.
- **Marco — Team manager (power user).** *Journey:* creates "Marketing Q3" project → invites
  3 members → assigns tasks → uses AI "Plan my week" → checks Reports for team load.
- **Ada — Org Admin.** *Journey:* configures SSO + SCIM → sets roles → reviews audit log →
  enables/limits AI capabilities and retention. Cannot see members' personal tasks.
- **Sam — External guest.** *Journey:* accepts a scoped invite → sees only the shared
  project → comments and completes assigned tasks → no access to org settings/other projects.
- **System states:** offline / poor network (optimistic + queued), tablet/landscape
  (split view), dark mode, large text (AX5), Reduce Motion, RTL — all first-class.

```text
[Anonymous] → sign in → [Member of ≥1 org]
     │                        ├─ create/join org ─▶ [Owner/Admin]
     │                        ├─ invited to project ─▶ [Contributor/Viewer]
     └─ share link ──────────▶ [Guest: shared scope only]
Offline ⇄ Online is orthogonal to all states (optimistic everywhere).
```

---

## 20. Analytics Events

Schema + global properties per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md).
Product-level (north-star) events:

| event | key properties |
|-------|----------------|
| `app_opened` | `cold_start`, `startup_ms` |
| `signup_completed` | `method` |
| `org_created` / `org_joined` | `invite` |
| `task_created` | `source`, `has_due`, `priority`, `project_type` |
| `task_completed` | `was_overdue`, `via` |
| `workspace_switched` | `from_org`, `to_org` |
| `reminder_fired` / `reminder_opened` | `type`, `action` |
| `ai_invoked` | `capability`, `accepted`, `latency_ms` |
| `screen_viewed` | `screen`, `referrer` |

**Funnels:** Activation = `signup_completed` → `org_created`/`org_joined` → ≥3
`task_created` in 7d. AI adoption = `ai_invoked` with `accepted=true` rate.

---

## 21. Acceptance Criteria

1. New user can sign in and reach Home in < 5 taps.
2. A task can be captured in < 8s median (open → created).
3. Quick Add parses date/time/priority/label from natural language.
4. Personal and team tasks coexist and never leak across contexts.
5. Personal task content is never visible to Admins or other members.
6. Workspace switching changes context without app restart.
7. The full capture/complete loop works offline (subway test).
8. Offline edits sync losslessly and never duplicate (opId idempotency).
9. Reminders deliver within ±60s of scheduled time ≥ 99%.
10. Reminder notifications support Complete/Snooze/Reply/Open from lock screen.
11. Deep links (`numil://task/{id}`) open the right task in the right workspace.
12. Every screen has ≤1 primary + ≤5 secondary affordances at rest.
13. Task Detail exposes due/scheduled/duration/recurrence independently.
14. Recurrence spawns the next occurrence on completion, preserving history.
15. Roles (Owner/Admin/Manager/Member/Guest) gate every mutation server-side.
16. Guests resolve only to explicitly shared resources.
17. AI actions are proposal-first (Accept/Edit/Undo) and never auto-send.
18. AI respects org enable/disable, quotas, and no-train settings.
19. All data changes are recorded in an immutable audit log.
20. GDPR export + right-to-erasure flows function and are audited.
21. Cold start reaches interactive Home in < 1.8s on iPhone 12.
22. Task lists scroll at 60fps (120fps ProMotion) via virtualization.
23. Screen open from cached data is < 150ms.
24. Times display in the user's timezone; stored UTC; DST-safe.
25. Light/dark themes and Dynamic Type to AX5 render without clipping.
26. Reduce Motion and Reduce Transparency are honored app-wide.
27. VoiceOver labels + actions exist on all interactive elements.
28. No information is conveyed by color alone (priority = flag + label).
29. iPad shows a three-column split view; portrait collapses gracefully.
30. Dynamic Island / Live Activities show long AI or timer jobs.
31. Offline surfaces degrade to cache/heuristics, never dead spinners.
32. Permission lost mid-session rolls back the next mutation with a notice.
33. Sole-owner account deletion requires ownership transfer first.
34. Analytics never contain task titles/descriptions or PII.
35. All primary flows are completable via Switch Control / external keyboard.
36. App boots on iOS Simulator and physical iPhone via the Expo dev client.

---

## 22. Future Roadmap

- **V1 (✅):** unified personal + team tasks, Task Detail depth, time intelligence,
  reminders, offline-first, sidebar + tabs, RBAC, core AI (NL capture/breakdown/summarize),
  reports basics, comments/mentions, notifications.
- **V1.1 (🔜):** command palette, dependencies/relations, day/week AI planning,
  integrations (Google/Outlook calendar, Slack), Home-screen/Lock-screen widgets, 2FA.
- **V2 (🟣):** boards/timeline (Gantt), custom fields/statuses/roles, live co-editing
  (CRDT), docs + whiteboards GA, passkeys, data residency / BYO-key, GraphQL read layer.
- **Future (💡):** cross-org task sharing, marketplace of templates/automations,
  Apple Watch complications, deep Apple Intelligence integration.
- **Experimental (🧪):** autonomous AI planning agents, predictive "next best action."
- **AI track:** RAG project chat with citations, risk/health insight suite.
- **Enterprise track:** eDiscovery, SIEM streaming, per-field audit export, HIPAA posture.
