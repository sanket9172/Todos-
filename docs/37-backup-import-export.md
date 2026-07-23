# 37 · Backup, Data Recovery, Import & Export

> Follows the [Master PRD Template](./00-prd-template.md). This module owns **data durability
> and portability**: automatic cloud backup, point-in-time recovery, GDPR/CCPA account data
> export, and importers/migration from Todoist, Asana, Trello, Notion, CSV, Google Tasks, and
> Microsoft To Do — with field mapping, dedupe, and a guided migration wizard. It matches the
> reference depth of [10 · Task Detail](./10-task-detail.md) and
> [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md).

---

## 1. Purpose

Trust is the foundation of a productivity app: users must believe their data is safe and that
they can leave whenever they want. This module makes Numil the **easiest app to move into**
(one-tap import from the tool you're leaving) and the **safest to stay in** (automatic backup,
recovery, and full export). Import lowers the activation barrier; backup/export lower the
adoption *risk*.

**User problem it solves.** Switching task managers is painful — data is trapped, formats
differ, duplicates pile up. Meanwhile, users fear losing years of work to a bug or a lost
device. Numil answers both: **frictionless migration in** (like Todoist's importer, but for
more tools) and **provable durability** (offline-first mirror + cloud backup + export).

**User goals**
- "Bring everything from Todoist/Asana/Trello/Notion/Google Tasks/Microsoft To Do/CSV."
- "Don't create duplicates when I re-import or sync two tools."
- "Restore my data if I mess up, delete something, or switch phones."
- "Download all my data" (peace of mind + compliance).

**Business goals**
- Activation & conversion: importers are a top acquisition lever (capture switchers).
- Retention & trust: reliable backup/restore reduces churn and support load.
- Enterprise/compliance: GDPR/CCPA export + retention/legal-hold unlock regulated buyers.

**KPIs:** import completion rate, tasks imported per import, dedupe accuracy, time-to-first-value
after import, restore success rate, export requests fulfilled within SLA, and switcher
conversion attributable to import.

**Platform reality.** The device already keeps an **offline-first SQLite mirror + outbox**
([shared/offline-sync-engine.md](./shared/offline-sync-engine.md)); "backup" here means
**server-side durable backup + point-in-time restore**, not a local file. Imports run
**server-side** (parsers, rate-limit-aware connectors) with a thin client wizard; large files
upload resumably via `expo-file-system`. Nothing here needs a custom native module — it's
standard Expo networking + document picking (`expo-document-picker`, `expo-sharing`).

---

## 2. Navigation

**Entry points**
- **Onboarding:** "Import your tasks" step in [06 · Onboarding & Workspace Setup](./06-onboarding.md)
  (the migration wizard is launched here for switchers).
- **Settings → Data:** `Import`, `Export`, `Backup & Restore` (`src/app/(settings)/data.tsx`).
- **Empty states:** an "Import from another app" CTA on My Tasks / a new project.
- **Account deletion flow** offers "Export before deleting".
- **Admin console:** org-level export/retention/backup policy in
  [30 · Workspace Administration](./30-workspace-administration.md).
- Deep links: `numil://import`, `numil://import/{provider}`, `numil://settings/backup`,
  `numil://export`.

**Route:** `src/app/(settings)/data/` group — `import.tsx` (provider picker), `import/[provider].tsx`
(wizard), `export.tsx`, `backup.tsx`. The **migration wizard** is a **full-screen modal stack**
(multi-step, cancelable). Backup/restore and export are **push** screens.

**Hierarchy/breadcrumbs**
```text
Settings ▸ Data ▸ Import ▸ Todoist ▸ (Connect → Map → Preview → Run → Report)
Settings ▸ Data ▸ Backup & Restore ▸ Restore point (date)
```

**Transitions:** wizard steps slide horizontally with a progress bar; a long-running import
shows a **Live Activity** + progress (module 33) so the user can leave the screen.

---

## 3. Complete UI Layout

Migration wizard (the densest surface) + Backup & Restore.

```text
┌───────────────────────────────────────────────┐
│  ✕  Import to Numil            Step 3 of 5  ▓▓▓░│  ← modal, progress
├───────────────────────────────────────────────┤
│  Source: Todoist  ·  Connected as priya@…       │
│  ─────────────────────────────────────────────  │
│  Field mapping                     [ Auto-map ] │
│   Todoist              →   Numil                │
│   Project              →   Project        ✓     │  ← disclosure rows
│   Section              →   (Section) 🔜   ▾     │
│   Priority p1–p4       →   Urgent…Low     ▾     │
│   Labels               →   Labels         ✓     │
│   Due (date/time/rec.) →   Due + Recur    ✓     │
│   Comments             →   Comments       ✓     │
│   Completed tasks      →   Include? ( ● )        │
├───────────────────────────────────────────────┤
│  Duplicate handling                             │
│   ( ) Skip   (●) Merge by title+due   ( ) Keep  │  ← segmented
├───────────────────────────────────────────────┤
│  Preview:  428 tasks · 12 projects · 37 dupes   │
│  [ Back ]                         [ Import ➤ ]  │
└───────────────────────────────────────────────┘
```

```text
┌───────────────────────────────────────────────┐
│  ‹ Data        Backup & Restore                 │
├───────────────────────────────────────────────┤
│  Automatic cloud backup            ( ● )  On    │
│  Last backup: today 3:02 AM · 2,481 items       │
│  ─────────────────────────────────────────────  │
│  Restore points                                 │
│   ◷ Today 3:02 AM        (auto)        Restore ▸│
│   ◷ Jul 15 3:00 AM       (auto)        Restore ▸│
│   ◷ Jul 12 (before import: Trello)     Restore ▸│  ← auto snapshot before risky ops
│  ─────────────────────────────────────────────  │
│  Export my data          [ Request export ]     │  → JSON + CSV bundle, emailed link
│  Trash (recover deleted) 42 items · 30-day  ▸   │
└───────────────────────────────────────────────┘
```

**Layout notes.** The wizard follows one-primary-action-per-step (Connect → Map → Dedupe →
Preview → Run). Auto-map is the default; power users disclose per-field controls. Preview
always shows counts (incl. duplicates) before any write — nothing imports without confirmation.
Backup/Restore is a calm grouped list; "Trash" is the lightweight self-serve recovery for the
common case, restore points for the heavy case. Respects Dynamic Island/safe areas; **iPad:**
two-pane (mapping left, live preview right).

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Provider picker | `ProviderGrid`, `ProviderCard` (logo, "Connect"/"Upload file"), `SearchField` |
| Connect | `OAuthConnectButton` (Todoist/Asana/Trello/Google/Microsoft/Notion), `FileDropZone` + `DocumentPickerButton` (CSV), `TokenPasteField` (Notion internal token / API key) |
| Mapping | `FieldMapList`, `FieldMapRow` (`SourceField → TargetPicker`), `AutoMapButton`, `EnumMapper` (priority/status), `IncludeToggle` (completed/archived), `PreviewChip` |
| Dedupe | `SegmentedControl` (Skip/Merge/Keep), `DedupeRuleEditor` (match keys), `DuplicatePreviewList` |
| Run | `ImportProgressBar`, `LiveActivityMirror`, `StageStepper`, `RateLimitBanner`, `PauseResumeButton` |
| Report | `ImportSummaryCard` (created/updated/skipped/failed), `ErrorRowList` (downloadable), `UndoImportButton` |
| Backup/Restore | `BackupToggle`, `RestorePointList`, `RestorePointRow`, `RestoreScopeSheet` (all / project / date range), `ConfirmDialog`, `TrashList`, `TrashRow` (Restore/Delete forever) |
| Export | `ExportRequestCard`, `ExportFormatPicker` (JSON/CSV/Markdown), `ExportScopePicker` (me/org), `ExportStatusRow` (queued/ready link) |
| Feedback | `Skeleton`, `Toast`, `Banner` (offline/quota), `ProgressRing`, `EmptyState` |

Primitives from [03 · Design System & UI](./03-design-system-ui.md); progress mirrors the
Live Activity in [33 · Widgets, Live Activities & Apple Watch](./33-widgets-live-activities-watch.md).

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Automatic cloud backup (✅ v1)
- **Purpose:** durable, server-side, versioned snapshots so no device loss = data loss.
- **Workflow:** the server takes **daily automatic snapshots** of the org/user dataset plus an
  **auto snapshot before risky operations** (import, bulk delete, restore). Continuous change
  data (from `/sync`) enables **point-in-time** recovery between snapshots.
- **UI:** `BackupToggle` (on by default for paid; free = last 7 days), "Last backup" + item
  count, restore-point list.
- **Permissions:** users' personal data backed up for them; org data backup governed by Owner/
  Admin retention policy; personal tasks never exposed to Admins in any restore UI.
- **Offline:** backups are server-side; the local mirror is itself a form of resilience.
- **API:** `GET /backups`, snapshots created by scheduled jobs.
- **DB:** `backups` (snapshot manifests), object storage for payloads.
- **Notify:** silent normally; a failed backup notifies the Owner/Admin.
- **AC:** at least daily snapshots retained per plan; a pre-risky-op snapshot always exists;
  restore points list shows date, type (auto/pre-op), and item count.

### 5.2 Point-in-time restore (✅ v1)
- **Purpose:** roll back mistakes (mass delete, bad import) safely.
- **Workflow:** pick a restore point → choose **scope** (entire workspace / a project / a date
  range) → **preview diff** (what will be added/removed/changed) → confirm → restore runs as a
  reversible operation that itself creates a new restore point first.
- **UI:** `RestorePointList`, `RestoreScopeSheet`, diff preview, `ConfirmDialog` (typed
  confirm for whole-workspace).
- **Permissions:** Owner/Admin for workspace-wide; project Lead for a single project; a user
  for their own personal tasks.
- **Offline:** requires network; blocked with a clear message offline.
- **API:** `POST /backups/:id/restore` (scope in body), returns a job id.
- **DB:** restore writes are versioned; a `restore_jobs` row tracks progress + reversibility.
- **Notify:** progress via Live Activity; completion + summary notification.
- **AC:** restore is previewed before applying, creates a pre-restore snapshot, and is itself
  undoable within the retention window; it never resurrects data the actor can't access.

### 5.3 Trash & soft-delete recovery (✅ v1)
- **Purpose:** self-serve recovery for the everyday "oops I deleted it".
- **Workflow:** deleted tasks/projects go to **Trash** (soft-delete, `deleted_at`) for a
  retention window (default **30 days**); one-tap **Restore** or **Delete forever**.
- **UI:** `TrashList` with filters (tasks/projects/comments), search, bulk restore.
- **Permissions:** you can restore what you could delete; personal items only by the owner.
- **Offline:** restore of locally cached tombstones works optimistically; syncs later.
- **API:** `GET /trash`, `POST /trash/:id/restore`, `DELETE /trash/:id` (purge).
- **DB:** relies on existing `deleted_at` tombstones across entities.
- **Notify:** none (undo snackbars cover the immediate case).
- **AC:** deleted items are recoverable for the window; purge is irreversible + confirmed;
  restoring a task also restores its subtasks/comments.

### 5.4 Account & workspace data export — GDPR/CCPA (✅ v1)
- **Purpose:** users/orgs can download **all** their data (right to portability).
- **Workflow:** request export → choose **format** (machine-readable **JSON** + **CSV** tables,
  optional **Markdown** for docs) and **scope** (my data / whole org for Admins) → server builds
  a bundle → user gets a **secure, expiring download link** (email + in-app), verified by
  re-auth.
- **UI:** `ExportRequestCard`, format/scope pickers, status row with a countdown to link expiry.
- **Permissions:** any user can export **their own** data; **whole-org** export is Owner/Admin
  only and audited; personal tasks of *other* users are never included in an org export.
- **Offline:** requires network.
- **API:** `POST /exports`, `GET /exports/:id` (status + signed URL).
- **DB:** `exports` (scope, format, state, url, expires_at, requested_by).
- **Notify:** "Your export is ready" push/email with the link.
- **AC:** export includes tasks, projects, comments, attachments (as links or bundled),
  activity, settings; link expires; re-auth required; the request is audited.

### 5.5 Importers — Todoist / Asana / Trello / Notion / Google Tasks / Microsoft To Do / CSV (✅ v1)
- **Purpose:** move a switcher's data in with minimal effort.
- **Workflow:** pick provider → **Connect** (OAuth for Todoist/Asana/Trello/Google/Microsoft;
  token/CSV for Notion; file upload for CSV) → **auto field-map** → adjust → **dedupe rule** →
  **preview counts** → **run** (server-side, rate-limit-aware, resumable) → **report**.
- **UI:** provider grid, connect, `FieldMapList`, dedupe segmented control, preview, progress.
- **Permissions:** imports into projects the user can create/write; assignees mapped only to
  existing accessible members (unmatched left unassigned or invited per setting).
- **Offline:** requires network; the wizard state is saved so it resumes if interrupted.
- **API:** `POST /imports` (provider, mapping, dedupe), `GET /imports/:id` (progress/report),
  `POST /imports/:id/undo`.
- **DB:** `imports` (job), `import_items` (source→target id map for dedupe/undo).
- **Notify:** Live Activity progress + completion notification with the summary.
- **AC:** each provider maps projects, tasks, due/recurrence, priority, labels, completed state,
  and comments where the source exposes them; the import is previewed, resumable, and undoable.

### 5.6 Field mapping & enum translation (✅ v1)
- **Purpose:** reconcile different schemas (priorities, statuses, labels) sensibly.
- **Workflow:** an **auto-mapper** proposes mappings (Todoist p1→Urgent … p4→Low; Trello lists→
  status or sections; Asana sections→sections; Notion select props→labels/status); the user can
  override each; unmapped source fields can be dropped or stored on a `notes`/custom field.
- **UI:** `FieldMapRow` + `EnumMapper` with sensible defaults; a warning for lossy mappings.
- **DB:** mapping persisted on the `imports` job for reproducibility + undo.
- **AC:** default mappings are correct for each provider; overrides persist; lossy mappings are
  flagged before running.

### 5.7 Deduplication (✅ v1)
- **Purpose:** avoid duplicates on re-import or when two tools overlap.
- **Workflow:** choose **Skip / Merge / Keep both**; merge matches on configurable keys
  (default: normalized **title + due date** within a project; optional source-id memory so a
  repeat import of the same account updates instead of duplicating).
- **UI:** segmented control + `DedupeRuleEditor` + a `DuplicatePreviewList`.
- **DB:** `import_items(source_provider, source_id, target_task_id)` enables idempotent re-import.
- **AC:** re-importing the same Todoist account twice does not create duplicates (source-id
  match); merge preserves the richer record; the dedupe decision is shown in the report.

### 5.8 Migration wizard (✅ v1)
- **Purpose:** a guided, forgiving path for non-technical switchers (linked from onboarding).
- **Workflow:** Connect → Map → Dedupe → Preview → Run → Report, with back navigation, saved
  progress, and a safety **pre-import snapshot** (§5.1) so an import is always reversible.
- **UI:** `StageStepper` + progress + a friendly summary; "Import more" or "Go to My Tasks".
- **AC:** the wizard is resumable, cancelable, previews before writing, and always leaves a
  restore point; from [06 · Onboarding](./06-onboarding.md) it flows straight to Home on finish.

### 5.9 Scheduled / recurring sync-import (🟣 v2)
- **Purpose:** keep an external source in sync (not just one-shot import).
- **Workflow:** for OAuth providers, opt into periodic delta import (uses `import_items` id map
  to update/insert). Distinct from live [32 · Integrations](./32-integrations.md) two-way sync.
- **AC:** periodic imports are idempotent and never duplicate; user can stop anytime.

---

## 6. Smart AI Features

AI assists mapping and cleanup, always **proposal-first** (governed by
[19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md)):

| Capability | What it does here |
|-----------|-------------------|
| **AI field auto-map** | Suggests target fields/enum mappings for unfamiliar CSV columns or Notion props (user confirms). |
| **AI dedupe assist** | Flags near-duplicates that aren't exact matches (fuzzy title/semantics) for review. |
| **AI cleanup** | Proposes normalizing messy titles, extracting dates from title text, splitting checklists into subtasks — preview + accept. |
| **AI project structuring** | Suggests grouping a flat CSV into projects/sections from patterns. |
| **Export summary** | On export, an optional AI "what's in this archive" summary (on-device where possible, see module 34). |

All AI actions are logged as `ai_invoked` with `accepted`, never auto-apply, and respect org
AI settings + DLP. No raw imported content is sent to external models when the org disables it.

---

## 7. Productivity Features

- **Import → instant Today:** after import, the wizard offers "Plan my day" ([19](./19-ai-assistant-copilot.md))
  so the user sees value immediately.
- **Template extraction:** turn a recurring imported structure into a reusable template
  ([24 · Templates & Recurring Workflows](./24-templates-recurring-workflows.md)).
- **CSV round-trip:** export → edit in a spreadsheet → re-import with dedupe (bulk editing).
- **Selective restore** of just one project keeps momentum without a full rollback.
- **Backup peace-of-mind indicator** on the Home dashboard ("Backed up 3:02 AM").

---

## 8. Enterprise Features

- **Retention policy:** org-configurable retention for completed tasks, activity/audit, and
  Trash windows; **legal hold** overrides purge (aligns with
  [40 · Security & Compliance Center](./40-security-compliance-center.md) and
  [shared/security-baseline.md](./shared/security-baseline.md)).
- **Org-wide export / eDiscovery:** Owner/Admin export of the whole workspace (audited, re-auth,
  scoped); excludes other users' personal tasks.
- **Data residency:** exports/backups honor the org's region pinning (enterprise).
- **Immutable backup audit:** who ran restore/export/import, when, scope, and result → audit log
  ([29 · Activity Feed & Audit Logs](./29-activity-feed-audit-logs.md)).
- **Bring-your-own storage (💡):** enterprise backup destination (customer S3/GCS bucket).
- **Right-to-erasure:** account deletion cascades/anonymizes per policy; export offered first.

Role permission matrix:

| Capability | Owner | Admin | Manager | Member | Guest |
|-----------|:-----:|:-----:|:-------:|:------:|:-----:|
| Import into accessible project | ✅ | ✅ | ✅ | ⚙️ | ❌ |
| Configure dedupe/mapping | ✅ | ✅ | ✅ | ✅ | ❌ |
| Restore own personal tasks | ✅ | ✅ | ✅ | ✅ | own |
| Restore a project | ✅ | ✅ | Lead | ❌ | ❌ |
| Restore whole workspace | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export own data | ✅ | ✅ | ✅ | ✅ | own |
| Export whole org / eDiscovery | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set retention / legal hold | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure org backup policy | ✅ | ✅ | ❌ | ❌ | ❌ |

`⚙️` gated by org "Members can create projects" setting. Full model:
[shared/rbac-permissions.md](./shared/rbac-permissions.md).

---

## 9. Collaboration Features

- **Assignee resolution on import:** map source assignees to Numil members (fuzzy by name/email);
  unmatched → unassigned or **auto-invite** (per setting), so team structure carries over.
- **Comment & mention import:** where the source exposes them, comments/mentions import with
  authorship attributed (or "Imported from Trello" if the author isn't a member).
- **Shared import report:** a Manager importing a team project can share the summary with the
  project (what came in, what was skipped).
- **Handoff-safe:** long imports run server-side, so any teammate can watch progress; the
  initiating device shows the Live Activity.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Import/export/restore are server-side, network-required** — the wizard clearly blocks with
  a retry affordance when offline (unlike the rest of the app, which is offline-first).
- **Trash restore** of locally cached tombstones is **optimistic** (works offline) and syncs
  later via the normal outbox.
- Imported data arrives via the standard **delta pull** (`GET /sync?since=`), so the local
  mirror populates incrementally rather than in one giant download.
- All import writes are server-generated with canonical versions; the client reconciles by
  `version` (no client-side dedupe ambiguity).
- Wizard state (provider, mapping, dedupe choice, step) is persisted locally so an interrupted
  session **resumes** where it left off.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- **OAuth tokens** for source providers are stored **server-side, encrypted**, used only for the
  import job, and **revoked/deleted** after completion (or on user disconnect); never in the app
  bundle or local storage.
- **Export links** are **signed, single-purpose, and expiring** (default 24–72h), gated behind
  **re-authentication** (and biometric app-lock where enabled); downloads are logged.
- **Uploaded import files** (CSV) are size/type-validated and **malware-scanned** before parsing;
  parsing is sandboxed; parser resource limits prevent zip-bomb/CSV-bomb abuse.
- **Scope enforcement:** imports write only to authorized projects; org export excludes other
  users' personal tasks; restore never resurrects content outside the actor's scope.
- **PII & logs:** task content never in logs/analytics; import errors reference row indices/ids,
  not content.
- **Erasure integrity:** after account deletion + retention window, backups holding the user's
  data are purged/anonymized per policy; legal hold suspends purge with an audit reason.
- All destructive/portability actions (restore, purge, export, org import) are **audited**.

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- **Import progress** → a **Live Activity** (module 33) + a completion push ("Imported 428 tasks
  · 37 duplicates merged · 2 errors").
- **Export ready** → push + email with the secure link; a reminder before the link expires.
- **Backup failure** → Owner/Admin push + email (security/reliability alert, bypasses quiet
  hours if configured urgent).
- **Restore complete** → summary notification with an "Undo restore" affordance during the
  window.
- Imported tasks with due dates **schedule their reminders** normally (respecting quiet hours
  and default reminder time) — but bulk imports **suppress a notification storm** (no per-task
  assignment push; one digest instead).

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- The wizard is a **linear, labeled flow**; each step announces "Step 3 of 5, Field mapping"
  and the progress bar has an accessible value.
- `FieldMapRow` exposes source→target as a single readable label with a picker action; lossy
  mappings announce a warning, not color-only.
- Preview counts and the final report are read as structured text ("428 created, 37 merged,
  2 failed"); the error list is navigable and exportable.
- Long-running progress uses `accessibilityLiveRegion` (polite) — periodic, not spammy.
- Destructive confirmations (purge, whole-workspace restore) require an explicit, labeled
  confirm and are reachable via Switch Control/keyboard.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Wizard step transitions: horizontal slide (`motion.base`) with the progress bar animating
  (`motion.fast`); **Reduce Motion** → cross-fade.
- Import progress ring animates stroke (`motion.base`); no confetti mid-import.
- On successful import/restore, a single subtle success check (`spring.snappy`) — celebrations
  stay proportionate.
- Duplicate/merge rows animate in as they're detected in preview (`motion.fast`).
- Long jobs delegate visible progress to the Live Activity so the app can be backgrounded.

---

## 15. Performance

- **Server-side parsing & connectors:** heavy work never runs on-device; the client streams
  progress via polling/WS.
- **Resumable, chunked import:** provider pagination + `import_items` checkpointing means a
  428-task import resumes after a network drop without re-doing work or duplicating.
- **Rate-limit-aware connectors:** respect each provider's API limits (backoff + queue) so
  imports don't get throttled/banned.
- **Resumable uploads** for CSV via `expo-file-system` (large files never block the UI).
- **Incremental hydration:** imported data lands in the local mirror via delta sync, virtualized
  in lists (FlashList) — the app stays at 60fps even after a 10k-task import.
- **Backup snapshots** are incremental (change-based) to bound storage + time.
- **Export streaming:** large exports are generated as a streamed archive server-side, not held
  in memory; the client only receives a link.

---

## 16. Database Design

Aligns with [17 · Data Model & API](./17-data-model-api.md). Jobs + mappings are server-side;
Trash reuses existing soft-delete tombstones.

```text
imports(id, org_id, requested_by, provider, source_account?, mapping_json, dedupe_mode,
        include_completed, state, counts_json, error_url?, undoable_until?, created_at, finished_at?)
import_items(id, import_id→imports, source_provider, source_id, target_type,
             target_id?, action, dedupe_key)         -- source→target map (idempotent re-import + undo)
exports(id, org_id, requested_by, scope, format, state, object_url?, expires_at, created_at)
backups(id, org_id, kind, reason, item_count, size_bytes, manifest_url, created_at)  -- auto/pre-op
restore_jobs(id, backup_id→backups, requested_by, scope_json, state, pre_restore_backup_id,
             reversible_until?, counts_json, created_at, finished_at?)
retention_policies(org_id, entity, ttl_days, trash_window_days, legal_hold bool, updated_at)
-- Trash = existing entities WHERE deleted_at IS NOT NULL (tombstones), purged after trash_window_days
```

**Indexes:** `imports(org_id, created_at)`, `import_items(import_id, source_provider, source_id)`
UNIQUE (dedupe/idempotency), `exports(requested_by, created_at)`, `backups(org_id, created_at)`,
`restore_jobs(backup_id)`. **Constraints:** whole-org export/restore requires Owner/Admin; a
restore always writes `pre_restore_backup_id` first; `legal_hold=true` blocks purge jobs.
**Soft-delete/history:** all entities carry `deleted_at`; restores are versioned writes (audited
via `activity_log`).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md). All mutations require an
`Idempotency-Key`; long jobs return a job id polled via `GET` or observed on the realtime channel.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/imports/providers` | List supported providers + connect method |
| POST | `/imports` | Start an import (provider, connection, mapping, dedupe) |
| GET | `/imports/:id` | Progress + report (counts, errors url) |
| POST | `/imports/:id/undo` | Reverse an import (within window) |
| POST | `/imports/upload` (resumable) | Upload a CSV for file-based import |
| POST | `/exports` | Request a data export (scope, format) |
| GET | `/exports/:id` | Export status + signed download URL |
| GET | `/backups` | List restore points |
| POST | `/backups/:id/restore` | Restore (scope in body) → `restore_jobs` id |
| GET | `/restore-jobs/:id` | Restore progress |
| GET | `/trash` · POST `/trash/:id/restore` · DELETE `/trash/:id` | Soft-delete recovery |
| GET/PUT | `/orgs/:id/retention` | Retention/legal-hold policy (Owner/Admin) |

**Realtime:** channel `user:{id}`/`org:{id}` emits `import.progress`, `import.completed`,
`export.ready`, `restore.progress`, `restore.completed`.

**Sample — start a Todoist import**
```http
POST /v1/imports HTTP/1.1
Authorization: Bearer <token>
Idempotency-Key: 4d9e-…
Content-Type: application/json

{ "provider": "todoist",
  "connection": { "type": "oauth", "grantId": "oauth_tdst_123" },
  "mapping": { "priority": {"p1":"urgent","p2":"high","p3":"medium","p4":"low"},
               "sections": "sections", "labels": "labels" },
  "dedupe": { "mode": "merge", "keys": ["title","dueAt"], "rememberSourceIds": true },
  "includeCompleted": true, "targetProjectStrategy": "mirror" }
```
```json
{ "data": { "id": "imp_7f2", "state": "running",
            "estimated": { "tasks": 428, "projects": 12, "duplicates": 37 } },
  "meta": { "requestId": "req_c31" } }
```

**Errors:** `403 forbidden` (scope/role, or org export not permitted), `409 conflict`
(concurrent restore/import lock), `413 payload_too_large` (CSV over cap), `422 validation_failed`
(bad mapping — `details[]`), `429 rate_limited` (provider throttling → auto-backoff),
`424 provider_error` (upstream connector failure, retriable). Every response echoes `requestId`.

---

## 18. Edge Cases

- **Provider OAuth expires mid-import:** pause, prompt re-connect, resume from checkpoint (no
  duplication).
- **Rate-limited by source API:** connector backs off; progress shows "waiting on Todoist…".
- **Malformed/huge CSV:** validation rejects with the offending rows; partial import optional.
- **Assignee/label not found:** mapped to unassigned/created-label per setting; reported.
- **Re-import same account:** `import_items` source-id match updates instead of duplicating.
- **Recurrence/timezone mismatch:** convert source RRULE/tz to Numil recurrence; ambiguous rules
  flagged for review, not silently dropped.
- **Interrupted import (app closed / network lost):** server job continues; client re-attaches
  on next open; state resumes.
- **Undo after further edits:** undo removes import-created items but preserves user edits made
  afterward (reports conflicts rather than clobbering).
- **Restore into a changed workspace:** diff preview shows adds/removes; restore never deletes
  data created after the snapshot unless explicitly chosen.
- **Whole-workspace restore permission lost mid-job:** job aborts, partial changes rolled back to
  the pre-restore snapshot.
- **Export link leaked/expired:** link expires + is single-purpose; re-request needed; access
  audited.
- **Legal hold active:** purge/erasure suspended with an audit note; export still allowed.
- **Storage/quota full (plan limit):** import blocked pre-run with a clear upsell; no partial mess.
- **Deleted user's data in org export:** anonymized/attributed as "Former member", never leaking
  personal tasks.
- **Concurrent import + restore:** a lock prevents overlapping destructive jobs (`409 conflict`).

---

## 19. User States

- **First-time / switcher:** lands in the migration wizard from onboarding; auto-map + preview
  make it a few taps; sees value ("428 tasks imported") then "Plan my day".
- **Returning:** backup indicator, Trash for quick recovery, occasional CSV round-trip.
- **Power user:** custom field maps, dedupe rules, scheduled re-import (🟣), selective restore.
- **Guest:** no import/export beyond own shared scope; backup/restore N/A for shared-only.
- **Manager:** import/restore for their projects; share import reports.
- **Admin/Owner:** org export/eDiscovery, retention/legal-hold, backup policy, org-wide restore.
- **Offline / poor network:** import/export/restore blocked with retry; Trash restore optimistic.
- **iPad / landscape:** two-pane mapping + live preview.
- **Dark mode / large text / a11y:** wizard fully labeled; progress announced politely; Reduce
  Motion honored.
- **Free vs paid:** backup retention window and import size caps differ by plan
  ([31 · Billing & Subscription](./31-billing-subscription.md)).

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md). Never logs task
content — only counts, providers, and outcomes.

| event | key properties |
|-------|----------------|
| `import_started` | `provider`, `connect_method` (oauth/file/token), `include_completed` |
| `import_mapping_edited` | `provider`, `fields_changed` |
| `import_dedupe_set` | `mode` (skip/merge/keep), `keys` |
| `import_previewed` | `provider`, `tasks`, `projects`, `duplicates` |
| `import_completed` | `provider`, `created`, `updated`, `skipped`, `failed`, `duration_s` |
| `import_undone` | `provider`, `items_removed` |
| `import_failed` | `provider`, `code` |
| `export_requested` | `scope` (me/org), `format` (json/csv/markdown) |
| `export_ready` | `scope`, `size_bucket` |
| `export_downloaded` | `scope` |
| `backup_completed` | `kind` (auto/pre_op), `item_count` |
| `backup_failed` | `code` |
| `restore_started` | `scope` (all/project/range) |
| `restore_completed` | `scope`, `items_restored`, `duration_s` |
| `trash_item_restored` | `entity_type` |
| `trash_item_purged` | `entity_type` |
| `retention_policy_changed` | `entity`, `ttl_days`, `legal_hold` |
| `ai_invoked` | `capability` (auto_map/dedupe_assist/cleanup), `accepted` |

---

## 21. Acceptance Criteria

1. Automatic daily cloud backups run and appear as restore points with date + item count.
2. A pre-operation snapshot is created before every import, bulk delete, and restore.
3. Restore points list distinguishes auto vs. pre-op snapshots.
4. Point-in-time restore previews a diff before applying anything.
5. Restore supports scope: whole workspace, a single project, or a date range.
6. A restore creates a pre-restore snapshot and is itself undoable within the window.
7. Whole-workspace restore is Owner/Admin only and requires a typed confirmation.
8. Restore never resurrects data outside the actor's permission scope.
9. Deleted items go to Trash for a 30-day (configurable) window and can be restored.
10. Purging from Trash is irreversible and explicitly confirmed.
11. Restoring a task also restores its subtasks and comments.
12. A user can export all of their own data (tasks, projects, comments, activity, settings).
13. Export offers JSON + CSV (and Markdown for docs) and a chosen scope.
14. Org-wide export is Owner/Admin only, audited, and excludes others' personal tasks.
15. Export links are signed, expiring, single-purpose, and gated by re-auth.
16. Importers exist for Todoist, Asana, Trello, Notion, Google Tasks, Microsoft To Do, and CSV.
17. OAuth providers connect via OAuth; Notion via token; CSV via resumable file upload.
18. Auto-mapping proposes correct default field/enum mappings per provider.
19. Users can override any field/enum mapping; lossy mappings are flagged before running.
20. Priority, due dates, recurrence, labels, completed state, and comments import where exposed.
21. Dedupe supports Skip / Merge / Keep both with configurable match keys.
22. Re-importing the same source account does not create duplicates (source-id memory).
23. Import preview shows counts (tasks/projects/duplicates) before any write.
24. Imports run server-side, are rate-limit-aware, resumable, and show progress.
25. An import can be undone within the window, preserving later user edits (reports conflicts).
26. Long imports show a Live Activity + a completion notification with a summary.
27. Bulk imports suppress per-task notification storms (single digest instead).
28. The migration wizard is launchable from onboarding and returns to Home on finish.
29. Wizard state is saved and resumes after interruption.
30. Assignees map to accessible members; unmatched are unassigned or auto-invited per setting.
31. Recurrence/timezone rules convert correctly; ambiguous rules are flagged, not dropped.
32. Uploaded CSVs are size/type-validated and malware-scanned before parsing.
33. Source OAuth tokens are stored server-side encrypted and revoked after the job.
34. Retention policies (TTL, Trash window) and legal hold are configurable by Owner/Admin.
35. Legal hold suspends purge/erasure with an audited reason.
36. All restore/export/import/purge actions are recorded in the audit log with actor + scope.
37. Backup failures alert the Owner/Admin.
38. Offline blocks import/export/restore with a clear retry; Trash restore works optimistically.
39. Imported data hydrates the local mirror via delta sync and lists stay at 60fps.
40. AI auto-map/dedupe/cleanup suggestions are proposal-first and logged (`accepted`).
41. Plan limits (backup retention, import size) are enforced with a clear upsell.
42. Every listed analytics event fires with correct, content-free properties.

---

## 22. Future Roadmap

- **V1 (✅):** automatic cloud backup + point-in-time restore, Trash recovery, GDPR/CCPA export
  (JSON/CSV/Markdown), importers for Todoist/Asana/Trello/Notion/Google Tasks/Microsoft To Do/CSV
  with auto field-mapping, enum translation, dedupe (skip/merge/keep), resumable server-side
  import, undoable import, migration wizard from onboarding, retention/legal-hold basics.
- **V1.1 (🔜):** AI auto-map + fuzzy dedupe assist + cleanup, more importers (TickTick, ClickUp,
  Apple Reminders, OmniFocus), attachment bundling in exports, export-link expiry reminders.
- **V2 (🟣):** scheduled recurring sync-import, bring-your-own backup storage (S3/GCS),
  cross-workspace migration, selective field-level restore diff UI, ical/RRULE-perfect recurrence.
- **Future (💡):** continuous "backup vault" with instant any-second restore, eDiscovery export
  UI with legal filters, customer-managed encryption keys for backups.
- **Experimental (🧪):** AI "migration co-pilot" that inspects a source workspace and proposes an
  optimal Numil structure (projects/sections/labels) before importing.
- **AI track:** on-device export summaries (module 34), semantic dedupe via
  [39 · Search Indexing & Semantic](./39-search-indexing-semantic.md).
- **Enterprise track:** data residency for backups/exports, immutable backup audit, retention +
  legal hold surfaced in [40 · Security & Compliance Center](./40-security-compliance-center.md).
```