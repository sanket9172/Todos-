# 09 · Team Tasks & Projects

> Follows the [Master PRD Template](./00-prd-template.md). Projects are the collaborative
> core of Numil — shared containers of team tasks with List/Board/Calendar views, custom
> statuses, assignment, workload, and org-readable transparency.

---

## 1. Purpose

Projects are where teams do work together. A **project** is a shared container of **team
tasks** visible to its members; it competes with Asana/ClickUp/Linear/Jira/Monday/Trello
boards while staying calm and native. Managers plan and assign, contributors execute,
watchers stay informed, and progress is transparent to the org (subject to permissions).

**User problem it solves.** Individual lists don't scale to teams: you need shared status
workflows, assignment, multiple views of the same data (list for triage, board for flow,
calendar for timing), and bulk operations. Heavy PM tools deliver this but overwhelm; Numil
exposes the same power **progressively** — a project opens as a clean list and reveals board,
workload, automation, and sprints on demand.

**User goals**
- Create a project, invite the team, and start assigning in minutes.
- See the same tasks as a **list, board, or calendar** without data drift.
- Assign, prioritize, set status, and bulk-edit dozens of tasks quickly.
- Understand team **workload** and unblock people.

**Business goals**
- Core collaboration surface → seat expansion and team activation.
- Home for enterprise power (custom statuses/fields, automation, sprints, audit).
- Transparency (org-readable projects) drives cross-team adoption.

**KPIs:** projects created, tasks assigned/week, board moves, % projects with an active
board, bulk-action usage, cross-member collaboration rate, cycle time (created→Done).

---

## 2. Navigation

**Entry points**
- **Sidebar → Projects** section → a project (favorites pinned, unread/overdue badges).
  See [04 · Navigation & Sidebar](./04-navigation-sidebar.md).
- Home dashboard project cards. See [07 · Home Dashboard](./07-home-dashboard.md).
- Deep link `numil://project/{id}?view=board`, `numil://project/{id}/task/{taskId}`.
- Search result / notification / mention → the task within its project.
- Assigned tasks also appear in [08 · My Tasks](./08-my-tasks.md).

**Route:** `src/app/project/[id]/index.tsx` with `?view=list|board|calendar`. A task pushes
or sheet-presents [10 · Task Detail](./10-task-detail.md). "**+ New project**" is
permission-gated (Manager+, or Members if the org enables it).

**Navigation hierarchy & breadcrumbs**
```text
Workspace ▸ Projects ▸ [Project name] ▸ [view] ▸ [Task]
```

**Transitions**
- View switch (List/Board/Calendar): segmented control cross-fades content (`motion.base`),
  preserving scroll/selection per view.
- Board card drag: lift (`scale 1.03` + shadow), column highlight, autoscroll near edges.
- Row/card → detail: shared-element hero on title + color dot (`motion.slow`).

**Modal vs push:** Project screen is a **push** (has back stack + breadcrumb). Task detail is
a **sheet** from a row/card, **push** when deep-linked. Project settings open as a **sheet**.

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  ‹ Projects   🟦 Marketing Launch      👥  •••  │  ← breadcrumb, avatar stack, overflow
│  ( List )  ( Board )  ( Calendar )              │  ← view switch (segmented)
│  Assignee ▾  Status ▾  Priority ▾   ⚑ Filter    │  ← filter/sort/group bar (sticky)
├───────────────────────────────────────────────┤   ── BOARD VIEW ──
│  TO DO (5)     IN PROGRESS (3)   REVIEW  DONE   │  ← columns by status
│ ┌───────────┐ ┌───────────┐                     │
│ │ Draft copy│ │ Build hero│  …                  │  ← draggable TaskCard
│ │ 👤P ⚑ Fri │ │ 👤M ▓▓░   │                     │    (assignee, flag, due, progress)
│ └───────────┘ └───────────┘                     │
│  [＋ add]      [＋ add]                          │
├───────────────────────────────────────────────┤   ── LIST VIEW (alt) ──
│  ▾ IN PROGRESS (3)                              │
│   ◯ Build hero   👤 Marco  ⚑  ▓▓░ 2/3  Fri 5PM  │
│   ◯ Write specs  👤 Priya                        │
│  ▾ TO DO (5) …                                  │
├───────────────────────────────────────────────┤
│  [✓ 4 selected]  Assign  Status  Due  •••   ✕   │  ← multi-select bulk bar (contextual)
├───────────────────────────────────────────────┤
│  ✨   Add a task to Marketing Launch…       ➤   │  ← project-scoped Quick Add
└───────────────────────────────────────────────┘
```

- **Top:** glass nav bar with **breadcrumb** (‹ Projects), project name + color/emoji,
  member **`AvatarStack`**, and `•••` overflow (settings, members, automation, sprints,
  archive, share). Respects Dynamic Island + top safe area; large title collapses on scroll.
- **View switch:** one segmented control (List / Board / Calendar) — the single prominent
  secondary control. **Filter/sort/group** chips sit beneath, badging when active.
- **Body (List):** grouped, virtualized `TaskRow`s (group by status/assignee/due/priority).
- **Body (Board):** horizontally scrollable **columns by status** (or a custom field);
  each column has a count, a collapse toggle, WIP-limit indicator (🔜), and a per-column ＋.
- **Body (Calendar):** the project's tasks placed by due/scheduled date — see
  [11 · Calendar & Scheduling](./11-calendar-scheduling.md).
- **Multi-select bar:** appears on long-press/select; floats above safe area with bulk ops.
- **Quick Add:** project-scoped; new tasks land in the default status/section.
- **Landscape / iPad:** board shows more columns; a right-hand **inspector** renders the
  selected task's detail (master–detail). Filters move to a left rail.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Nav bar | `GlassNavBar`, breadcrumb chip, `ProjectTitle` (color/emoji), `AvatarStack`, `•••` `ContextMenu` |
| View switch | `ViewSwitchSegmented` (List/Board/Calendar), per-view state persistence |
| Toolbar | `GroupByChip`, `SortChip`, `AssigneeFilterChip`, `StatusFilterChip`, `PriorityFilterChip`, `FilterChip` (badged), `SavedViewMenu` |
| List | `SectionListVirtualized` (FlashList), `SectionHeader` (count, collapse), `TaskRow` (checkbox, title, `AssigneeAvatar`, `StatusChip`, `PriorityFlag`, `DueChip`, `LabelChip`, `ProgressBar`) |
| Board | `BoardView`, `BoardColumn` (header, count, WIP badge, collapse), `TaskCard` (draggable), `AddCardButton`, `ColumnMenu`, `DropIndicator` |
| Assignment | `MemberPicker`, `AssigneeAvatar`, `MultiAssigneeStack` (🔜), `WorkloadBar` |
| Bulk | `MultiSelectBar`, `BulkAssignSheet`, `BulkStatusSheet`, `BulkDueSheet`, `BulkMoveSheet`, `BulkDeleteConfirm` |
| Project mgmt | `ProjectSettingsSheet`, `StatusColumnEditor`, `MemberRoleList`, `ArchiveDeleteRow`, `ProjectShareSheet` |
| Quick Add | `QuickAddBar`, `AIButton`, `StatusDefaultChip` |
| Feedback | `Skeleton` (list/board), `Toast`/`Snackbar` (undo), `Banner` (offline/conflict/no-access), `EmptyState`, `ConfirmDialog` |
| AI | `AIActionSheet` (breakdown, summarize project, plan sprint), `WorkloadInsightCard` |

Primitives are defined in [03 · Design System & UI](./03-design-system-ui.md).

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**
How a board move propagates to teammates in realtime:

```mermaid
sequenceDiagram
  participant A as User A (drags card)
  participant Store as Local DB
  participant API
  participant RT as Realtime project:{id}
  participant B as User B (viewing board)
  A->>Store: optimistic status+order (bump version)
  Store-->>A: card moves instantly
  A->>API: PATCH /tasks/:id {statusId, order} If-Match
  API-->>A: 200 canonical {version+1}
  API->>RT: task.moved {version}
  RT-->>B: card animates to the new column
  Note over API,RT: automation may fire on status → Done; watchers notified
```

### 5.1 Projects & members ✅ v1
- **Purpose:** a shared container with its own members, roles, statuses, and settings.
- **Workflow:** create project (name, color/emoji, description) → invite members with a
  project role (Lead/Contributor/Viewer) → set default view + default status.
- **UI:** create sheet; `ProjectSettingsSheet`; `MemberRoleList`.
- **Permissions:** create = Manager+ (or Member if org allows); settings/members = Lead/Admin.
- **Offline:** project + members cached; edits queue.
- **API:** `POST /projects`, `PATCH /projects/:id`, `POST /projects/:id/members`.
- **DB:** `projects`, `project_members(project_id,user_id,role)`.
- **Notify:** invite → invited user (push+inbox+email).
- **AC:** only permitted roles can create/manage; member role changes take effect immediately.

### 5.2 List / Board / Calendar views ✅ v1
- **Purpose:** one dataset, three lenses; no data drift.
- **Workflow:** switch via segmented control; each view reads the same filtered task set.
  List groups by status/assignee/due/priority; Board columns = statuses; Calendar by date.
- **UI:** `ViewSwitchSegmented`, `SectionListVirtualized`, `BoardView`, calendar grid.
- **Permissions:** Viewers see all three read-only (no drag).
- **Offline:** all views render from local cache; moves queue.
- **API:** `GET /projects/:id/tasks?view=&group=&filter[...]&cursor=`.
- **DB:** view prefs in `project_view_prefs` / `saved_views`.
- **Notify:** none on view.
- **AC:** switching views preserves filters + selection; completing in one view reflects everywhere.

### 5.3 Custom statuses & Board drag ✅ v1
- **Purpose:** model the team's real workflow (e.g., To do / In progress / In review / Done).
- **Workflow:** Lead defines/renames/reorders/removes status columns; each maps to a
  **category** (`todo` / `active` / `done`) for analytics + completion semantics. Drag a card
  between columns to change status; drag within a column to reorder (fractional index).
- **UI:** `StatusColumnEditor`, `BoardColumn`, draggable `TaskCard`, `DropIndicator`.
- **Permissions:** edit statuses = Lead/Admin; move cards = Contributor+.
- **Offline:** status change + reorder optimistic + queued.
- **API:** `PATCH /projects/:id/statuses`, `PATCH /tasks/:id {status, order}`.
- **DB:** `project_statuses(id, project_id, name, category, order, wip_limit?)`; `tasks.status`.
- **Notify:** status → Done notifies watchers; moving into a status can trigger automation.
- **AC:** removing a status requires reassigning its tasks; category drives Done semantics.

### 5.4 Assignment & multiple assignees ✅ v1 / 🔜
- **Purpose:** make ownership explicit.
- **Workflow:** assign one member (v1); multiple assignees 🔜 v1.1. Reassigning notifies the
  new assignee immediately; the task appears in that member's My Tasks.
- **UI:** `MemberPicker`, `AssigneeAvatar` / `MultiAssigneeStack`.
- **Permissions:** assign to others = Contributor+ (project policy may restrict to Lead).
- **Offline:** optimistic; notification queued until online.
- **API:** `PATCH /tasks/:id {assigneeId}` / `POST /tasks/:id/assignees`.
- **DB:** `tasks.assignee_id` (+ `task_assignees` for multi 🔜).
- **Notify:** assignment → new assignee (push+inbox); unassignment silent.
- **AC:** assignee must be a project member; assignment reflects in My Tasks within one sync.

### 5.5 Workload view 🔜 v1.1
- **Purpose:** balance load across the team.
- **Workflow:** a per-member column/timeline shows open tasks, due dates, and estimated hours;
  drag a task from an overloaded member to another to reassign.
- **UI:** `WorkloadBar` per member, capacity indicator, drag-to-reassign.
- **Permissions:** view = Manager/Lead; reassign = Contributor+ per policy.
- **Offline:** read from cache; reassign queues.
- **API:** `GET /projects/:id/workload?window=`.
- **DB:** derived from `tasks(assignee_id, duration_min, due_at, status)`.
- **Notify:** reassignment notifies both parties.
- **AC:** capacity respects working hours; over-capacity members flagged.

### 5.6 Bulk actions ✅ v1
- **Purpose:** edit many tasks at once.
- **Workflow:** enter multi-select (long-press or select mode) → choose tasks → **Assign /
  Set status / Set due / Set priority / Move / Complete / Delete** as a batch.
- **UI:** `MultiSelectBar` + action sheets; live count; single undo snackbar for the batch.
- **Permissions:** each op re-checks per-task permission; unauthorized items skipped with a note.
- **Offline:** batch ops queue as individual idempotent ops.
- **API:** `POST /tasks/bulk` `{ids[], op, payload}`.
- **DB:** each op writes `tasks` + an `activity_log` row.
- **Notify:** assignment/status notifications fan out (deduped per recipient).
- **AC:** partial failures reported per item; the batch is undoable within 5s.

### 5.7 Move / copy tasks across projects ✅ v1
- **Purpose:** reorganize work.
- **Workflow:** move a task to another project (validates assignee membership + maps status);
  copy duplicates (optionally with subtasks and offset dates).
- **UI:** `BulkMoveSheet` / context-menu Move/Copy.
- **Permissions:** Contributor+ in both source and destination.
- **Offline:** optimistic; conflict if destination changed.
- **API:** `POST /tasks/:id/move` `{projectId, statusId}`, `POST /tasks/:id/duplicate`.
- **DB:** updates `project_id`, `status`; history preserved.
- **Notify:** new project watchers notified of arrival.
- **AC:** invalid assignee on move → prompt to reassign; status remapped to destination.

### 5.8 Org-readable visibility ✅ v1
- **Purpose:** transparency — let any org member view (not edit) a project.
- **Workflow:** Lead/Admin sets project visibility `private` vs `org_readable`. Org-readable
  projects appear in search and can be opened read-only by any member.
- **UI:** visibility toggle in settings; a read-only banner for non-members.
- **Permissions:** see [shared/rbac-permissions.md](./shared/rbac-permissions.md); non-members
  get read+comment-off by default (comment configurable).
- **Offline:** cached read-only when opened.
- **API:** `PATCH /projects/:id {visibility}`.
- **DB:** `projects.visibility` enum(`private`,`org_readable`).
- **Notify:** none.
- **AC:** non-members can view read-only; cannot edit/assign/change status; private stays hidden.

### 5.9 Sections, milestones & templates 🔜 / 💡
- **Sections** within a list (🔜); **milestones** grouping tasks toward a date (🔜); create a
  project from a **template** (💡, see [24 · Templates & Recurring Workflows](./24-templates-recurring-workflows.md)).

---

## 6. Smart AI Features

Powered by [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md). Project-scoped,
proposal-first surfaces:

| Capability (`id`) | What it does on a project |
|-------------------|---------------------------|
| `subtask_generate` / `task_breakdown` | Generate a task list for a goal, or subtasks for a task. |
| `summarize` | "Summarize this project / what changed this week." |
| `project_chat` (RAG) | Ask "what's blocking launch?" over accessible project tasks/docs, with citations. |
| `auto_prioritize` | Suggest priority/order across the backlog. |
| `workload_predict` | Flag overloaded members and slipping dates → surfaces in Workload. |
| `risk_detect` / `project_health` | At-risk tasks/project health score (module 36). |
| `smart_schedule` / `sprint_plan` | Propose a sprint/plan (links [23 · Sprint Planning](./23-sprints-agile-boards.md)). |
| `action_items` | Turn a pasted meeting note into assigned tasks. |

All AI writes are proposal-first (Accept/Edit/Undo), permission-scoped (never surfaces content
a user can't access), logged as `ai_invoked`, and governed by org AI settings.

---

## 7. Productivity Features

- **Board flow** with WIP limits (🔜) to visualize and cap in-progress work (kanban discipline).
- **Sprints & agile boards:** convert a project/backlog into iterations, points, burndown —
  see [23 · Sprint Planning & Agile Boards](./23-sprints-agile-boards.md).
- **Automation:** "when status → Done, notify manager", "when assigned, set due +3d", etc. —
  see [20 · Automation & Workflow Rules](./20-automation-workflow-rules.md).
- **Saved views:** persist a filtered/grouped/sorted view (e.g., "My open, high priority") —
  see [14 · Search, Filters & Saved Views](./14-search-filters-views.md).
- **Time tracking** rollups per project (see [21 · Time Tracking & Timesheets](./21-time-tracking-timesheets.md)).
- **Keyboard-first on iPad:** `⌘K` command palette, drag with pointer, multi-select with shift.

---

## 8. Enterprise Features

- **Custom statuses / task types / custom fields** per project (fields defined once, shown in
  detail rail — see [10 · Task Detail](./10-task-detail.md) §5.7).
- **Project & task audit log:** immutable record of every change (who/what/when, before→after)
  — see [29 · Activity Feed & Audit Logs](./29-activity-feed-audit-logs.md).
- **Automation & SLA/escalation** 🟣: due-based SLA breaches escalate via automation.
- **Approval workflows** 🔜: require an approver to move to Done per status policy.
- **Roles & RBAC:** project Lead/Contributor/Viewer atop org roles; custom roles (v2).
- **Org-readable transparency** + **archive/retention/legal hold** (soft-delete + retention
  window; legal hold blocks purge).
- **Reporting:** cycle time, throughput, workload feed [16 · Reports & Analytics](./16-reports-analytics.md).

---

## 9. Collaboration Features

- **Assignment, watchers/followers, @mentions, comments, reactions, threads** on every task
  (rendered in [10 · Task Detail](./10-task-detail.md)).
- **Live presence** on the board/list (who's viewing) and **realtime updates** — cards move
  for everyone as one person drags (via WebSocket).
- **Typing indicators** and **live comment stream** on task detail.
- **Shared project docs & chat** link out to [25 · Documents](./25-documents-knowledge-base.md)
  and [26 · Team Chat](./26-team-chat-collaboration.md).
- **Decision log:** pin a comment as a decision surfaced in the project overview.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- Project, members, statuses, and tasks are mirrored locally; List/Board/Calendar all render
  offline from the same cache.
- **Board moves** (status + order) are optimistic ops using **fractional indexing** to avoid
  renumber storms when multiple users reorder concurrently.
- **Structural conflicts** (a status column deleted server-side while you moved a card into it)
  resolve to server value; the card lands in the default status with a non-blocking notice.
- Bulk ops enqueue as individual idempotent ops; partial sync is safe.
- Org-readable projects opened offline are cached read-only.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Every task read/mutation re-checks **project membership + role + attribute** rules
  server-side; list endpoints **scope the query** (no over-fetch-then-filter).
- Org-readable projects grant read-only to org members; **private** projects hidden from
  non-members (even in search).
- Guests resolve only to explicitly shared projects/tasks across REST and realtime channels.
- Realtime channel `project:{id}` subscription is authorized on connect and per message.
- Rich text/comments sanitized; attachment scanning before availability.

**Org-role × project action matrix** (project roles Lead/Contributor/Viewer overlay these;
full model in [shared/rbac-permissions.md](./shared/rbac-permissions.md)):

| Action | Owner | Admin | Manager | Member | Guest |
|--------|:-----:|:-----:|:-------:|:------:|:-----:|
| View org-readable project | ✅ | ✅ | ✅ | ✅ | shared |
| Open private project (as member) | ✅ | ✅ | ✅ | ✅* | shared |
| Create project | ✅ | ✅ | ✅ | ⚙️ | ❌ |
| Manage project settings/members | ✅ | ✅ | own/assigned | ❌ | ❌ |
| Create/edit tasks · move card | ✅ | ✅ | ✅ | ✅* | shared* |
| Assign to others | ✅ | ✅ | ✅ | project-policy | ❌ |
| Bulk actions | ✅ | ✅ | ✅ | ✅* | ❌ |
| Manage automation | ✅ | ✅ | project | ❌ | ❌ |
| Archive/delete project | ✅ | ✅ | own/assigned | ❌ | ❌ |

`⚙️` gated by org setting "Members can create projects". `*` within accessible scope only.

---

## 12. Notification System

Deltas over the canonical [12 · Notifications & Alerts](./12-notifications-alerts.md):
- Emits: **assignment**, **mention**, **comment/reply**, **status change** (esp. → Done/Review),
  **due-soon/overdue** (assignee + optional manager), **added to project**, **approval request**.
- **Batching:** comment/status bursts on the same task batch to reduce noise; assignment is immediate.
- Per-project preference: **mute / mentions-only / all activity**; project digest (daily/weekly).
- Automation-driven notifications flow through the same categories with action buttons
  (Complete / Snooze / Open / Reply).

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Board columns announce as headings with counts ("In Progress, 3 tasks"); cards expose a
  **Move to column** `accessibilityAction` (no drag required) and Complete/Assign actions.
- `AvatarStack` announces "Assigned to Priya and 2 others".
- Multi-select announces selection count and available bulk actions.
- Status chips convey category by label + shape, never color alone.
- View switch, filters, and group announce current value and state.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- **Board card drag:** lift (scale 1.03 + shadow), source/target column highlight, autoscroll
  near edges, drop settle `spring.gentle`; reorder neighbors part smoothly.
- View switch cross-fades content (`motion.base`); column collapse animates width/opacity.
- Status → Done: card check + fade to Done column; confetti only on project milestone completion.
- Multi-select bar slides up (`spring.gentle`); bulk complete strikes rows in sequence.
- Reduce Motion swaps movement for cross-fades; drag still functions via accessibility action.

---

## 15. Performance

- Board and list virtualized (**FlashList**); columns render only visible cards + a small
  overscan; horizontal + vertical recycling.
- The task set is fetched once and projected client-side into all three views (memoized selectors).
- Board drag runs on the UI thread (reanimated worklets); reorder writes debounced (250ms).
- Cursor pagination per column/section; lazy-load older/Done tasks on scroll.
- Realtime updates diffed by `version`; own-echo ignored; batched re-renders.
- Screen open target **<200ms** from cache; large projects (10k tasks) stay smooth via windowing.

---

## 16. Database Design

Aligns with [17 · Data Model & API](./17-data-model-api.md).

```text
projects(id, org_id, name, color, emoji?, description?, visibility, default_view,
         default_status_id?, archived_at?, created_by, version, created_at, updated_at, deleted_at?)
project_members(project_id→projects, user_id, role, added_at)   PK(project_id, user_id)
project_statuses(id, project_id→projects, name, category, order, wip_limit?, is_default)
tasks(id, org_id, project_id→projects, owner_id, assignee_id?, title, description_json,
      status_id→project_statuses, priority, due_at?, scheduled_at?, duration_min?,
      order, version, created_at, updated_at, completed_at?, deleted_at?)
task_assignees(task_id→tasks, user_id)   PK(task_id, user_id)          -- multi-assignee 🔜
saved_views(id, project_id?, owner_id?, scope, name, query_json, is_shared)
project_view_prefs(user_id, project_id→projects, view, group_by, sort, filter_json)
activity_log(id, project_id?, task_id?, actor_id, action, before_json, after_json, created_at) -- immutable
```

**Indexes:** `tasks(project_id, status_id, order)` (board), `tasks(project_id, assignee_id)
WHERE completed_at IS NULL` (workload), `tasks(project_id, due_at) WHERE completed_at IS NULL`
(calendar/overdue), `project_members(user_id)` (access), full-text on `tasks.title`+`description`.
**Constraints:** `assignee_id` ∈ `project_members`; `status_id` ∈ `project_statuses` of same
project; org-readable ⇒ non-members read-only. **Soft delete** via `deleted_at`; **history**
append-only in `activity_log`. Archived project ⇒ read-only.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/projects?filter[fav]=1&cursor=` | List accessible projects |
| POST | `/projects` (Idempotency-Key) | Create project |
| GET | `/projects/:id?expand=members,statuses` | Project detail |
| PATCH | `/projects/:id` (If-Match) | Update (name/visibility/default) |
| POST/DELETE | `/projects/:id/members` | Manage members/roles |
| PATCH | `/projects/:id/statuses` | Define/reorder status columns |
| GET | `/projects/:id/tasks?view=&group=&filter[...]&sort=&cursor=` | Tasks for a view |
| POST | `/projects/:id/tasks` | Create task in project |
| PATCH | `/tasks/:id` (If-Match) | Update (status/order/assignee/etc.) |
| POST | `/tasks/bulk` | Bulk assign/status/due/move/complete/delete |
| POST | `/tasks/:id/move` · `/tasks/:id/duplicate` | Move/copy across projects |
| GET | `/projects/:id/workload?window=` | Workload (🔜) |
| POST | `/projects/:id/ai/{summarize\|chat\|breakdown}` | AI (module 19) |

**Realtime:** channel `project:{id}` — `task.created|updated|deleted`, `task.moved`,
`comment.created`, `presence.changed`, `automation.triggered`. Reconcile by `version`;
recover missed via `GET /sync?since=`.
**Errors:** `403 forbidden` (scope/role), `409 conflict` (version), `409 gone` (deleted/archived),
`422 validation_failed` (bad status/assignee). **Idempotency-Key** on all mutations.

**Sample request/response (board move)**
```http
PATCH /v1/tasks/tsk_88   If-Match: 12   X-Org-Id: org_9f3
Idempotency-Key: 5c1e...   Authorization: Bearer <token>
{ "statusId": "st_inprogress", "order": 4096.5 }
```
```json
{
  "data": { "id": "tsk_88", "statusId": "st_inprogress", "status": "In Progress",
            "order": 4096.5, "version": 13, "updatedAt": "2026-07-16T09:12:00Z" },
  "meta": { "requestId": "req_a91" }
}
```

---

## 18. Edge Cases

- **Status column deleted while a card moves into it:** card lands in default status + notice.
- **Assignee removed from project:** task shows "Former member"/Unassigned; history kept.
- **Move to project you lack access to:** blocked (`403`) with explanation.
- **Bulk op partial failure:** per-item result; succeeded items applied, failures listed.
- **Concurrent board reorder (two users):** fractional indexing merges; no renumber storm.
- **Archived project opened:** read-only banner; edits blocked; automation paused.
- **Org-readable → private toggle:** non-members lose access immediately (token/claims refresh).
- **Deleted project via deep link:** "This project is no longer available" + back.
- **Timezone/DST:** due/overdue and calendar placement computed in each viewer's local tz.
- **Duplicate submit (retry):** deduped by `Idempotency-Key`/`opId`.
- **Storage full offline:** metadata edits continue; attachments deferred.
- **Guest opens a non-shared task in an org-readable project:** `403` (guests are share-scoped).
- **WIP limit exceeded (🔜):** soft warning, move allowed unless policy hard-blocks.

---

## 19. User States

- **First-time (empty project):** "No tasks yet" + create CTA + optional template picker + a
  coach-mark on the view switch and Quick Add.
- **Returning/power:** remembered view + filters per project; keyboard/pointer on iPad; AI + automation visible.
- **No access:** "You don't have access" with a **Request access** action.
- **Guest:** only shared projects/tasks; no settings; limited fields.
- **Contributor:** full task ops; no settings/member management.
- **Viewer / org-readable non-member:** read-only banner; no drag/edit; comment per policy.
- **Manager/Lead/Admin/Owner:** settings, members, workload, automation, audit, reports.
- **Offline / poor network:** cached views editable; "will sync" chip; no dead spinners.
- **Tablet/landscape:** master–detail with inspector; wider board.
- **Dark mode / large text / a11y:** tokens + Dynamic Type; VoiceOver board actions verified.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md). Module-specific:

| event | key properties |
|-------|----------------|
| `project_created` | `has_template`, `visibility` |
| `project_viewed` | `view` (list/board/calendar), `is_member` |
| `project_view_switched` | `from`, `to` |
| `task_created` | `source` (quickadd/ai/board), `status`, `has_assignee` |
| `task_assigned` | `self_assign`, `via` (detail/board/bulk) |
| `task_status_changed` | `from_category`, `to_category`, `via` (board/detail/bulk/automation) |
| `board_card_moved` | `from_status`, `to_status` |
| `bulk_action` | `op`, `count`, `failed` |
| `task_moved_project` | `has_reassign` |
| `workload_viewed` | `window` |
| `project_visibility_changed` | `to` (private/org_readable) |
| `saved_view_applied` | `scope` |
| `ai_invoked` | `capability`, `accepted`, `latency_ms` |

No task titles/descriptions are logged (PII scrubbing at SDK boundary).

---

## 21. Acceptance Criteria

1. A permitted role can create a project with name, color/emoji, and description.
2. Project creation is gated (Manager+; Members only if the org enables it).
3. Members can be invited with project role Lead / Contributor / Viewer.
4. Role changes take effect immediately (claims refresh).
5. List, Board, and Calendar views render the same task set with no data drift.
6. Switching views preserves active filters, sort, group, and selection.
7. Completing/updating a task in one view reflects in all views instantly.
8. Custom status columns can be added, renamed, reordered, and removed by Lead/Admin.
9. Removing a status requires reassigning its tasks to another status.
10. Each status maps to a category (todo/active/done) driving completion semantics.
11. Dragging a card between columns changes status; drag within a column reorders.
12. Board reorder uses fractional indexing and survives concurrent edits without renumber storms.
13. Assigning a task requires the assignee be a project member.
14. Assignment notifies the new assignee and surfaces the task in their My Tasks within one sync.
15. Multiple assignees supported (🔜 v1.1) with a stacked avatar affordance.
16. Filter/sort/group by assignee/status/priority/due/label all work and persist per project.
17. Multi-select bulk assign/status/due/priority/move/complete/delete work with one undo.
18. Bulk ops report per-item success/failure; unauthorized items are skipped with a note.
19. Move validates assignee membership and remaps status to the destination project.
20. Copy/duplicate optionally includes subtasks and offsets dates.
21. Org-readable projects are viewable read-only by any org member; private projects are hidden.
22. Non-members cannot edit/assign/change status in org-readable projects.
23. Guests resolve only explicitly shared projects/tasks across REST and realtime.
24. Every task read/mutation is authorized server-side (role + scope + attribute).
25. Realtime board/list updates appear for all viewers; cards move live.
26. Live presence shows who is viewing the project.
27. Workload view (🔜) shows per-member load and supports drag-to-reassign.
28. Archived projects are read-only; edits blocked; automation paused.
29. Status/assignment/mention/comment/overdue notifications fire per preferences and batch appropriately.
30. Per-project mute / mentions-only / all-activity preference is honored.
31. Times display in each viewer's local zone; stored UTC; DST-safe.
32. Fully functional offline; moves/edits/bulk queue and sync losslessly; retries never duplicate.
33. Structural conflicts (deleted status) resolve to server value with a non-blocking notice.
34. Screen opens in <200ms from cache; 10k-task projects scroll at 60/120fps.
35. AI summarize/chat/breakdown are proposal-first (Accept/Edit/Undo) and permission-scoped.
36. AI never surfaces content the caller cannot access; actions log `ai_invoked`.
37. VoiceOver exposes board Move-to-column and Complete/Assign actions without drag.
38. Status conveyed by label + shape, not color alone; AX5 reflows without clipping.
39. Reduce Motion disables card-lift/confetti; drag remains functional.
40. Analytics events fire with correct properties (incl. offline-buffered) and no PII.
41. Audit log records every task/project change immutably (before→after).
42. Automation rules trigger on task events (assign/status/due) per module 20.
43. Saved views persist and re-apply filter/group/sort.
44. "No access" state offers Request access; deleted project shows graceful unavailable state.
45. Cycle-time / throughput data feeds Reports correctly.

---

## 22. Future Roadmap

- **V1 (✅):** projects+members+roles, List/Board/Calendar, custom statuses, board drag,
  single assignee, bulk actions, move/copy, org-readable visibility, offline, audit,
  realtime/presence, core AI (summarize/breakdown/chat).
- **V1.1 (🔜):** multiple assignees, Workload view, sections & milestones, WIP limits,
  approval workflows, richer saved views.
- **V2 (🟣):** custom fields/task types, SLA & escalation, custom project roles, timeline/
  Gantt view, dependencies visualization, portfolio (multi-project) rollups.
- **Future (💡):** project templates marketplace, cross-project dependencies, resource
  planning, capacity forecasting.
- **Experimental (🧪):** AI auto-triage of the backlog, autonomous status suggestions.
- **AI track:** project health/risk suite (module 36), AI sprint planning (module 23).
- **Enterprise track:** legal hold UI, per-field audit export, custom-role builder, eDiscovery.
