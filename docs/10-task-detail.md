# 10 · Task Detail

> Follows the [Master PRD Template](./00-prd-template.md). This is the **reference-depth
> exemplar** for all modules. Task Detail is the atomic surface of Numil — where a single
> unit of work is fully expressed and manipulated.

---

## 1. Purpose

Task Detail is the full editor and collaboration surface for one task (personal or team).
It is the most-used deep screen in the product; everything else (lists, boards, calendar,
notifications) is a projection of the data edited here.

**User problem it solves.** In simple apps a task is just a title + checkbox; in heavy PM
tools (Jira/ClickUp) the detail screen is a wall of fields that intimidates. Numil's Task
Detail must feel as calm as Things 3 at first glance yet expose Linear/ClickUp-grade power
(status, dependencies, custom fields, automation, AI) *progressively*.

**User goals**
- Capture a task in <5s, then enrich it later without friction.
- Understand at a glance: what, when (due/scheduled/duration), who, how urgent, progress.
- Collaborate: discuss, mention, attach, react, assign, watch.
- Never lose context: full history/audit of what changed.

**Business goals**
- Drive activation (tasks created/enriched) and collaboration (comments/mentions).
- Be the anchor for monetized power features (AI breakdown, automation, custom fields).
- Provide the audit trail enterprises require.

**KPIs:** `task_updated` per task, comment rate, AI-assist acceptance, time-to-first-enrich,
% tasks with due dates (predicts reminder value), reopen rate (quality signal).

---

## 2. Navigation

**Entry points**
- Tap a `TaskRow` in any list/board/calendar/search/notification.
- Deep link `numil://task/{taskId}` (from push, widget, Siri, email-to-task).
- "Open in full" from the Quick-Add sheet.

**Route:** `src/app/task/[id].tsx` (stack screen) with an alternate **sheet presentation**
when opened from a list on iPhone (medium → large detents), and **push** when opened from
search or deep link.

**Navigation hierarchy & breadcrumbs**
```text
Workspace ▸ Project (or "My Tasks") ▸ [Task title]
```
On team tasks the breadcrumb project chip is tappable (→ project). Personal tasks show
"My Tasks".

**Transitions**
- From a row: shared-element hero on the title + color dot (`motion.slow`).
- Sheet: `spring.gentle`, medium detent default, drag to large; swipe-down to dismiss.
- Sub-editors (date picker, assignee, labels) open as **nested bottom sheets** (push style)
  so the user never loses the task context.

**Modal vs push**
- **Sheet (modal)** for quick view/edit from lists (keeps list underneath).
- **Push** for deep-linked/standalone contexts (has full back stack + breadcrumb).

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  ‹ Back        Marketing ▸           •••  ⋯    │  ← nav bar (glass), Dynamic Island safe
├───────────────────────────────────────────────┤
│  (◯)  Draft the Q3 launch email          ⚑     │  ← checkbox + title (inline edit) + flag
│  ┌─ status: In Progress ▾   👤 Priya  ▾ ─────┐ │  ← property rail (horizontal chips)
│  │ 📅 Due Fri 5:00 PM   ⏱ 45m   🔁 Weekly    │ │
│  └───────────────────────────────────────────┘ │
│  🏷 #launch #email   ⏰ 2 reminders             │
├───────────────────────────────────────────────┤
│  Description                                    │
│  ▸ rich text / checklist / links …              │
├───────────────────────────────────────────────┤
│  Subtasks                     ▓▓▓░░ 3/5         │  ← progress bar
│   ◉ Outline  ◉ Copy  ◯ Review  ◯ Send …         │
├───────────────────────────────────────────────┤
│  Attachments   [＋]                             │
│   ▢ brief.pdf   ▣ hero.png   🔗 figma.com/…      │
├───────────────────────────────────────────────┤
│  Activity ▾  |  Comments                        │  ← segmented
│   💬 @Marco can you review by Thu?  ❤️2 👍1      │
│   • Priya changed status → In Progress · 2h     │
├───────────────────────────────────────────────┤
│  [ @  😊  📎  🎤  ✨AI ]   Write a comment…  ➤   │  ← composer + AI
└───────────────────────────────────────────────┘
```

- **Top:** glass nav bar, back/close, tappable project breadcrumb, `•••` overflow (share,
  duplicate, move, convert, delete), respects Dynamic Island + top safe area.
- **Header block:** big tappable title (inline multiline), complete checkbox, priority flag.
- **Property rail:** horizontally scrollable chips (status, assignee, due, scheduled,
  duration, recurrence, project). Each opens a nested sheet. Empty properties show a subtle
  "＋ add" chip — the screen is calm when a task is simple.
- **Middle:** description (rich), subtasks (with progress ring/bar), attachments grid.
- **Bottom:** sticky segmented Activity/Comments + a floating composer with AI/mention/
  emoji/attachment/voice. Composer sits above the keyboard + home-indicator safe area.
- **Empty space:** generous; sections with no content collapse to a single "＋" affordance.
- **Landscape / iPad:** two-pane — task fields left (or master list), comments/activity
  right; property rail becomes a right-hand inspector panel (Notion-style).
- **Tab bar:** hidden on this screen (full immersion); returns on pop.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Nav bar | `GlassNavBar`, back button, breadcrumb chip, `•••` context menu (popover) |
| Header | `TaskCheckbox` (animated), `TitleInlineEditor` (multiline), `PriorityFlag` |
| Property rail | `PropertyChip` (status/assignee/due/scheduled/duration/recurrence/project), `AddPropertyChip`, `StatusPicker` (segmented in sheet), `MemberPicker`, `DateTimePickerSheet`, `DurationPicker`, `RecurrenceEditor`, `ProjectPicker` |
| Labels/reminders | `LabelChip`, `LabelPickerSheet`, `ReminderChip`, `ReminderEditorSheet` |
| Description | `RichTextEditor` (bold/italic/lists/checkboxes/links/code), `MarkdownRenderer`, slash-command menu |
| Subtasks | `SubtaskList`, `SubtaskRow` (checkbox, inline title, optional assignee/date), `ProgressBar`/`ProgressRing`, drag handle |
| Attachments | `AttachmentGrid`, `AttachmentCard`, `MediaPreview` (image/pdf/quicklook), `LinkPreviewCard`, add menu (Files/Photos/Camera/Link) |
| Collaboration | `SegmentedControl` (Activity/Comments), `CommentThread`, `CommentBubble`, `ReactionBar`, `MentionAutocomplete`, `ActivityLogRow`, `PresenceAvatars`, `TypingIndicator` |
| Composer | `Composer` (grow-with-text), `AIButton`, `EmojiPicker`, `AttachmentButton`, `VoiceRecorder`, send button |
| Feedback | `Skeleton`, `Toast`/`Snackbar` (undo), `Banner` (offline/conflict), `ContextMenu`, `Popover`, `ConfirmDialog` |
| AI | `AIActionSheet` (breakdown, summarize, estimate, rewrite), streaming `AIResponseCard` |

All primitives are defined in [03-design-system-ui.md](./03-design-system-ui.md).

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Inline field editing (Things 3 / Linear)
- **Purpose:** enrich a task without leaving context.
- **Workflow:** tap chip → nested sheet → pick → optimistic save → chip updates.
- **UI:** property rail chips; nested sheets; "＋ add" for empty fields.
- **Permissions:** Contributor+ on team tasks; owner on personal.
- **Offline:** optimistic; queued op.
- **API:** `PATCH /tasks/:id` (partial, `If-Match`).
- **DB:** `tasks` columns; `version` bump; `activity_log` row.
- **Notify:** field-specific (due change → watchers; assignee change → new assignee).
- **AC:** edits persist offline; conflict → keep-latest prompt.

### 5.2 Subtasks with progress (ClickUp checklists)
- **Purpose:** decompose work; visualize completion.
- **Workflow:** add inline; reorder (drag); complete; optional per-subtask due/assignee.
- **UI:** `SubtaskList` + progress ring "3/5"; converting a subtask → full task supported.
- **Permissions:** as parent task.
- **Offline:** full.
- **API:** `POST/PATCH/DELETE /tasks/:id/subtasks`.
- **DB:** `subtasks` (taskId FK, order float, completedAt, assigneeId?, dueAt?).
- **Notify:** subtask assignment notifies assignee.
- **AC:** progress reflects completed/total; reorder persists; promote-to-task keeps history.

### 5.3 Rich description with slash commands (Notion)
- **Purpose:** capture context, checklists, links, code.
- **Workflow:** type `/` → menu (heading, list, checkbox, divider, code, mention, date).
- **UI:** `RichTextEditor`; markdown-lite storage; link unfurls.
- **Permissions/Offline:** Contributor+; offline full.
- **API/DB:** description stored as portable JSON/markdown on `tasks.description`.
- **Notify:** none (unless @mention inside → notifies).
- **AC:** formatting round-trips; links open in in-app browser.

### 5.4 Comments, mentions, reactions, threads (Linear/Slack)
- **Purpose:** discussion co-located with work.
- **Workflow:** type, `@` to mention (autocomplete members), react with emoji, reply →
  thread; edit/delete own within window; pin important comment.
- **UI:** `CommentThread`, `ReactionBar`, `MentionAutocomplete`, typing indicator, presence.
- **Permissions:** Viewer can comment/react; edit/delete own only; leads can delete any.
- **Offline:** compose offline → queued; mentions resolve on send.
- **API:** `POST /tasks/:id/comments`, `POST /comments/:id/reactions`, realtime `comment.created`.
- **DB:** `comments` (append-only), `reactions`, `mentions[]`.
- **Notify:** mention → immediate; watchers → batched.
- **AC:** mentions notify; reactions realtime; threads preserve order.

### 5.5 Attachments & media (Asana/ClickUp)
- **Purpose:** attach files/images/links/voice.
- **Workflow:** add from Files/Photos/Camera/Link/voice; preview via QuickLook.
- **UI:** `AttachmentGrid`, `MediaPreview`, `LinkPreviewCard`.
- **Permissions:** Contributor+ add; Viewer view.
- **Offline:** metadata immediate; blob uploads resumable + `pending` state.
- **API:** `POST /tasks/:id/attachments` (multipart/resumable), signed URLs.
- **DB:** `attachments` (kind, url, name, sizeBytes, mimeType, uploadState).
- **Notify:** optional watcher note.
- **AC:** upload resumes after interruption; virus-scan gate before availability.

### 5.6 Task relationships & dependencies (Jira/Linear) 🔜
- **Purpose:** model blockers/relations.
- **Workflow:** add "blocked by / blocking / relates to / duplicate of"; blocked tasks
  show a lock + can't move to Done until unblocked (policy).
- **UI:** relations section with linked `TaskChip`s; dependency badge.
- **Permissions/Offline/API/DB:** Contributor+; offline; `task_links` (fromId,toId,type).
- **Notify:** unblocking notifies blocked assignee.
- **AC:** cyclic dependencies prevented; blocked→done gated per project policy.

### 5.7 Custom fields & task types (ClickUp/Jira) 🟣
- **Purpose:** org/project-specific data (Story points, Client, $Cost, dropdowns).
- **Workflow:** project defines fields; task shows them in the rail/inspector.
- **DB:** `custom_field_defs` (project) + `custom_field_values` (task,fieldId,value).
- **AC:** field types (text/number/select/multi/date/person/checkbox/url/money) validate.

### 5.8 Convert / move / duplicate / templatize
- Convert comment → task; subtask → task; task → template. Move across projects (permission
  + reassign validation). Duplicate with options (subtasks, dates offset).

### 5.9 Watchers/followers & sharing
- Follow to receive updates without assignment. Share a task via deep link (respects RBAC;
  guests get scoped access).

---

## 6. Smart AI Features

Powered by the [AI Assistant & Copilot](./19-ai-assistant-copilot.md) module; here are the
in-context surfaces (the ✨AI button in the composer/overflow):

| Capability | What it does on a task |
|-----------|------------------------|
| **Task breakdown** | Suggests subtasks from title/description (accept all / pick). |
| **AI time estimate** | Predicts `durationMin` from similar past tasks. |
| **Smart scheduling** | Proposes `scheduledAt` fitting calendar + workload + priority. |
| **Rewrite / summarize** | Clean up the description; TL;DR long comment threads. |
| **Deadline prediction** | Flags unrealistic due dates given load ("at risk"). |
| **Auto labels/tags** | Suggests labels from content. |
| **Smart replies** | 1-tap comment replies; action-item extraction from a thread. |
| **Voice/OCR/Screenshot/Email → task** | Populate this task's fields from captured input. |
| **Context-aware chat** | "Ask about this task" answers using task + linked docs. |

Each AI action is **suggestive** (preview + accept/undo), logged as `ai_invoked` with
`accepted`, respects org AI settings, and never auto-sends messages without confirmation.

---

## 7. Productivity Features

- **Start focus/Pomodoro on this task** → launches [Focus & Pomodoro](./35-focus-pomodoro-habits.md);
  logs time against the task.
- **Time blocking:** "Schedule on calendar" creates a calendar block of `durationMin`.
- **Add to My Day / Today** (Microsoft To Do "My Day").
- **Energy/effort tag** (light/medium/deep) to power AI day planning.
- **Streak/achievement** contribution on completion (gamification).
- **Quick reschedule** chips (Today/Tomorrow/Next week) via swipe or long-press.

---

## 8. Enterprise Features

- **Activity timeline + immutable audit** of every field change (who/what/when, before→after).
- **Version history** of description (restore prior version).
- **Approval workflow** 🔜: require approver to move to Done (per project/status policy).
- **SLA & escalation** 🟣: due-based SLA; breach escalates to manager (via automation).
- **Custom statuses / task types / custom fields** (see 5.7).
- **Automation hooks:** task events trigger [Automation rules](./20-automation-workflow-rules.md).
- **Retention/compliance:** soft-delete + retention window; legal hold blocks purge.

---

## 9. Collaboration Features

- **Live presence** (who's viewing), **typing indicators**, **live comment stream** via
  WebSocket.
- **Live co-editing** of description 🟣 (CRDT/OT) — v1 uses field-locking + last-write-wins
  with a "being edited by Marco" indicator.
- **Watchers/followers**, **@mentions**, **reactions**, **threads**, **pinned comment**,
  **voice comments** 🔜, **video message** 🟣.
- **Decision log:** pin a comment as a "decision" surfaced in project docs.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- Task fields, subtasks, comments, reactions all editable offline (optimistic).
- Comments/activity are **append-only** → merge by id, never conflict.
- Attachments: metadata syncs immediately; blobs upload resumably with `pending` state.
- Field conflicts: scalar last-write-wins; description conflict → keep-both prompt
  (create a restore point). Relationship ops to a deleted task → dropped with notice.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Every read/mutation re-checks task scope (project membership / personal ownership).
- Personal task content never exposed to Admins.
- Rich text/comments sanitized (no script/HTML injection); link previews fetched server-side.
- Attachment type/size validation + malware scan before availability; signed, expiring URLs.
- Share links carry scoped, revocable tokens.

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- Emits: reminder, due-soon, overdue, assignment, mention, comment, reaction (opt), status
  change, approval request, dependency unblocked.
- Notification action buttons: **Complete**, **Snooze**, **Reply**, **Open** (iOS category).
- Editing due/scheduled reschedules local reminders atomically.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Title editor announces as "Task title, text field, editing".
- Property chips expose value + `accessibilityActions` (e.g., "Change due date").
- Subtask checkboxes and progress ("3 of 5 complete") announced.
- Composer reachable via keyboard/Full Keyboard Access; AI actions labeled.
- Reactions have text alternatives ("❤️ 2, you and Priya").

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Hero title/dot from row → detail (`motion.slow`).
- Checkbox complete → confetti only if this completion finishes the parent (all subtasks done)
  or a streak milestone.
- Property chip update: value cross-fades (`motion.fast`).
- New comment: slide-up + fade; reaction: pop `spring.bouncy`.
- Subtask complete: strike + settle; progress ring animates to new value.

---

## 15. Performance

- Comments/activity virtualized (FlashList) with windowing; lazy-load older on scroll up.
- Description editor lazy-mounted; heavy media thumbnails via `expo-image` with placeholders.
- Property sheets code-split; RecurrenceEditor lazy-imported.
- Optimistic writes keep interaction <16ms; network off the main path.
- Realtime updates diffed by `version`; ignore stale/echo of own ops.
- Screen open target <150ms from cache (data already local via list prefetch).

---

## 16. Database Design

```text
tasks(id, org_id, project_id?, owner_id, assignee_id?, title, description_json,
      status, priority, due_at?, due_has_time, scheduled_at?, duration_min?,
      recurrence_json?, completed_at?, order, version, created_at, updated_at, deleted_at?)
subtasks(id, task_id→tasks, title, assignee_id?, due_at?, completed_at?, order)
comments(id, task_id→tasks, author_id, body_json, mentions[], parent_id?, pinned, created_at, edited_at?, deleted_at?)
reactions(id, comment_id→comments, user_id, emoji, created_at)   UNIQUE(comment_id,user_id,emoji)
attachments(id, task_id→tasks, kind, url, name, size_bytes, mime_type, upload_state, created_at)
task_links(id, from_task→tasks, to_task→tasks, type)             -- dependencies/relations
watchers(task_id→tasks, user_id)                                 PK(task_id,user_id)
activity_log(id, task_id→tasks, actor_id, action, before_json, after_json, created_at)  -- immutable
custom_field_values(task_id→tasks, field_id→custom_field_defs, value_json)
description_versions(id, task_id→tasks, body_json, editor_id, created_at)  -- history
```

**Indexes:** `tasks(project_id, status)`, `tasks(assignee_id, due_at)`,
`tasks(org_id, due_at) WHERE completed_at IS NULL` (overdue/today), `comments(task_id, created_at)`,
`activity_log(task_id, created_at)`, full-text on `title`+`description`.
**Constraints:** `assignee_id` ∈ project members; personal task ⇒ `project_id IS NULL` and
assignee = owner; recurrence requires an anchor date. **Soft delete** via `deleted_at`
(tombstone). **Audit/history** tables are append-only.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/tasks/:id?expand=assignee,labels,subtasks,attachments` | Fetch detail |
| PATCH | `/tasks/:id` (If-Match) | Partial update |
| POST | `/tasks/:id/complete` | Complete (+spawn recurrence) |
| POST | `/tasks/:id/subtasks` · PATCH/DELETE `/subtasks/:id` | Subtasks |
| POST | `/tasks/:id/comments` · PATCH/DELETE `/comments/:id` | Comments |
| POST | `/comments/:id/reactions` · DELETE | Reactions |
| POST | `/tasks/:id/attachments` (resumable) | Upload |
| POST | `/tasks/:id/links` | Relations/dependencies |
| POST | `/tasks/:id/watchers` · DELETE | Watch/unwatch |
| GET | `/tasks/:id/activity?cursor=` | Audit/activity |
| POST | `/tasks/:id/ai/{breakdown|estimate|summarize|reschedule}` | AI actions |

**Realtime:** channel `task:{id}` — `task.updated`, `comment.created`, `reaction.created`,
`presence.changed`, `typing.changed`. **Errors:** `409 conflict` (version), `403 forbidden`
(scope), `409 gone` (deleted). **Idempotency-Key** on all mutations.

**Sample PATCH request/response**
```http
PATCH /v1/tasks/abc If-Match: 12
{ "priority": "high", "dueAt": "2026-07-17T11:30:00Z", "dueHasTime": true }
```
```json
{ "data": { "id":"abc","priority":"high","dueAt":"2026-07-17T11:30:00Z","version":13 } }
```

---

## 18. Edge Cases

- **Offline edit + remote change:** scalar LWW; description → keep-both restore point.
- **Deleted task opened (deep link):** "This task is no longer available" + back.
- **Deleted assignee/user:** show "Unassigned"/"Former member"; keep history.
- **Project archived:** detail becomes read-only banner.
- **Permission lost mid-session:** next mutation `403` → rollback + notice.
- **Timezone/DST change:** times re-render local; reminders recomputed.
- **Recurrence generation failure:** retried; user sees "next occurrence pending".
- **Invalid/oversized attachment:** rejected with reason; upload state `failed` + retry.
- **Duplicate submit (retry):** deduped by `Idempotency-Key`/`opId`.
- **Storage full:** metadata still edits; media upload paused with warning.
- **Cyclic dependency attempt:** blocked with explanation.
- **Comment on task you just lost access to:** `403`, comment stays queued then drops with notice.

---

## 19. User States

- **First-time:** minimal task (title + checkbox); coach-mark on the "＋ add" chips + ✨AI.
- **Returning/power:** full rail, keyboard-driven on iPad, AI + automation visible.
- **Guest:** scoped; only shared task; limited fields; no automation/audit.
- **Manager/Admin/Owner:** see approvals/audit; Admin can't see personal tasks.
- **Offline / poor network:** optimistic, "will sync" chip; media deferred.
- **Tablet/landscape:** two-pane inspector.
- **Dark mode / large text / a11y:** tokens + Dynamic Type; VoiceOver flows verified.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md).

| event | key properties |
|-------|----------------|
| `task_detail_opened` | `via` (row/deeplink/search/notif), `is_personal` |
| `task_updated` | `field` |
| `task_completed` | `via`, `was_overdue`, `had_subtasks` |
| `subtask_added`/`subtask_completed` | `count` |
| `comment_posted` | `has_mention`, `has_attachment`, `is_reply` |
| `reaction_added` | `emoji` |
| `attachment_added` | `kind`, `size_bucket` |
| `dependency_added` | `type` |
| `ai_invoked` | `capability`, `accepted`, `latency_ms` |
| `focus_started_from_task` | — |
| `task_shared` | `target` (link/guest) |

---

## 21. Acceptance Criteria

1. Detail opens <150ms from cached list data.
2. Title inline-edits and autosaves; empty title blocked with hint.
3. Every property chip opens a nested sheet and saves optimistically.
4. Due vs scheduled vs duration are independently editable and displayed.
5. All-day task (no time) uses default reminder time.
6. Reminders (multiple) save and reschedule when due/scheduled changes.
7. Recurrence editor supports daily/weekly/monthly(by date & nth-weekday)/yearly/custom + end conditions.
8. Completing a recurring task spawns the next occurrence and keeps history.
9. Subtasks add/reorder/complete; progress reflects completed/total.
10. Subtask → task conversion preserves data + history.
11. Description supports slash commands and round-trips formatting.
12. Comments post; `@mentions` autocomplete and notify.
13. Reactions add/remove and appear realtime with text alternatives.
14. Threaded replies preserve order; pin/unpin works.
15. Attachments upload from Files/Photos/Camera/Link; resume after interruption.
16. Attachments virus-scanned before becoming available.
17. Dependencies prevent cycles; blocked→Done gated per policy (🔜).
18. Activity log records every field change (before→after) immutably.
19. Description version history restores prior versions.
20. Move-to-project validates assignee membership.
21. Duplicate offers subtasks/date-offset options.
22. Watch/unwatch controls update notifications.
23. AI breakdown/estimate/reschedule/summarize preview + accept/undo; logged.
24. AI never sends a comment without explicit confirmation.
25. Presence + typing indicators show for concurrent viewers.
26. Offline edits persist and sync losslessly; retries never duplicate.
27. Scalar conflicts resolve LWW; description conflict creates keep-both restore point.
28. Deleted task via deep link shows graceful unavailable state.
29. Archived project → read-only banner; edits blocked.
30. Permission lost mid-edit rolls back with clear notice.
31. Times display in user's tz; stored UTC; DST-safe.
32. Personal task content never visible to Admins/others.
33. Rich text/comments sanitized against injection.
34. VoiceOver labels/actions on all controls; AX5 no clipping.
35. Reduce Motion disables hero/confetti; state feedback retained.
36. iPad landscape shows two-pane inspector.
37. Notification actions (Complete/Snooze/Reply/Open) work from lock screen.
38. Analytics events fire with correct properties (incl. offline-buffered).
39. Screen degrades gracefully with no network (no dead spinners).
40. Undo available (5s snackbar) for destructive actions (delete comment/task).

---

## 22. Future Roadmap

- **V1 (✅):** inline fields, subtasks, rich description, comments/mentions/reactions,
  attachments, reminders, recurrence, watchers, activity log, offline, core AI (breakdown/
  estimate/summarize), presence/typing.
- **V1.1 (🔜):** dependencies/relations, voice comments, approval workflow, SLA basics,
  richer link previews.
- **V2 (🟣):** custom fields/task types, live co-editing (CRDT), video messages, custom roles.
- **Future (💡):** whiteboard embed, cross-org task sharing, granular field-level history diff UI.
- **Experimental (🧪):** fully autonomous AI subtask execution, predictive "next best action".
- **AI track:** context-aware chat over task + linked docs, risk/at-risk detection.
- **Enterprise track:** legal hold UI, per-field audit export, eDiscovery.
