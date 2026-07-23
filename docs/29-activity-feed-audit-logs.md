# 29 · Activity Feed & Audit Logs

> Follows the [Master PRD Template](./00-prd-template.md). This is the **canonical** doc for
> Numil's change history: the human-friendly **activity feed** (per-entity + org) and the
> immutable, compliance-grade **security audit log**. Referenced by
> [10 · Task Detail](./10-task-detail.md) (per-task activity), the
> [shared/security-baseline.md](./shared/security-baseline.md), and
> [40 · Security & Compliance Center](./40-security-compliance-center.md) (admin audit,
> export, legal hold).

---

## 1. Purpose

Every meaningful change in Numil is recorded twice, for two audiences: a friendly **activity
feed** so people understand "what happened here," and an **immutable audit log** so security,
legal, and compliance can prove "who did what, when, from where."

**User problem it solves.** Teams lose trust when work changes silently ("who moved this to
Done?"). Enterprises can't adopt a tool without a tamper-evident record for SOC 2 / ISO 27001,
GDPR access reviews, and incident forensics. Numil provides both without cluttering the calm UI:
activity lives one disclosure away; the security audit is an admin surface.

**User goals**
- See a task/project/doc's history at a glance and jump to any change.
- Follow an **org activity feed** of relevant events (filtered to what I can access).
- (Admin) Search/filter/export the **audit log**; place a **legal hold**; set **retention**.
- Prove integrity: the audit record cannot be edited or silently deleted.

**Business goals**
- Unlock enterprise deals (audit, retention, legal hold, SIEM export are procurement blockers).
- Increase trust/transparency → higher collaboration and retention.
- Provide the substrate for AI ("summarize what changed this week") and analytics.

**KPIs:** activity views per active project, audit searches by admins, export usage, mean
time-to-answer for "who changed X," % orgs with retention/legal-hold configured.

**Status:** per-entity activity + org feed + basic audit ✅ v1 · advanced filters + export +
retention policy 🔜 v1.1 · legal hold + SIEM streaming + integrity verification 🟣 v2 ·
anomaly detection + natural-language audit search 🧪.

---

## 2. Navigation

**Entry points**
- **Per-entity activity:** the "Activity" segment on a task ([10](./10-task-detail.md)),
  project, document ([25](./25-documents-knowledge-base.md)), etc.
- **Org activity feed:** Home ([07](./07-home-dashboard.md)) "Recent activity" card → full
  feed; sidebar → "Activity".
- **Audit log (admin):** [40 · Security & Compliance Center](./40-security-compliance-center.md)
  → "Audit log"; also Workspace Admin ([30](./30-workspace-administration.md)).
- Deep links: `numil://activity`, `numil://task/{id}?tab=activity`, `numil://audit`,
  `numil://audit/{eventId}`.

**Routes** (`src/app/...`): `activity/index.tsx` (org feed), `audit/index.tsx` (admin audit),
`audit/[eventId].tsx` (event detail), plus embedded `ActivityTab` components on entities.
Entity activity is inline; org feed is a **push**; audit detail opens as a **sheet**.

**Hierarchy / breadcrumbs**
```text
Workspace ▸ Activity            (feed)
Workspace ▸ Security ▸ Audit log ▸ [Event 1a2b]   (admin)
```

**Transitions:** feed rows fade/slide in on load; filter changes cross-fade the list
(`motion.base`); audit event → detail sheet `spring.gentle`.

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  Activity                     ⌕     [ Filter ▾]│  ← large title, search, filter (Island-safe)
├───────────────────────────────────────────────┤
│  [ All ] [ Mentions ] [ Mine ] [ Projects ]     │  ← scope segmented
├───────────────────────────────────────────────┤
│  Today                                          │
│  • Priya moved “Launch email” → Done     · 2m   │  ← actor + verb + target + time
│    Marketing · was In Review                    │  ← context / before→after
│  • Marco commented on “Hero image”       · 18m  │
│  • You added 3 subtasks to “Q3 plan”     · 1h   │
│  Yesterday                                      │
│  • Admin changed role: Sara → Manager    · 🔒   │  ← 🔒 = also in security audit
├───────────────────────────────────────────────┤
│  ── Audit log (admin) ─────────────────────────│
│  ⌕ actor / action / entity / IP    [Export ▾]   │
│  ┌ time ┬ actor ┬ action ┬ target ┬ ip ┬ dev ┐  │
│  │09:20 │ Sara  │ role.change│ user │ … │ iPhone│ │  ← dense table (iPad/landscape)
│  │09:02 │ Priya │ task.update│ NUM-9│ … │ iPad  │ │
│  └──────┴───────┴────────────┴──────┴───┴───────┘ │
│  Retention: 400 days · Legal hold: 2 active     │  ← footer status
└───────────────────────────────────────────────┘
```

- **Top:** large title, search, filter. Dynamic Island + top safe area respected; large title
  collapses on scroll.
- **Feed (everyone):** grouped by day; each `ActivityRow` = **actor avatar + verb + target +
  relative time**, with an optional **before→after** context line and a `🔒` marker when the
  event is also a security-audit event. Tap → open the target (deep link).
- **Scope segmented:** All / Mentions / Mine / a specific Project.
- **Audit table (admin only):** dense, columnar (time, actor, action, target, IP, device,
  result); tap a row → **event detail sheet** with full metadata, before→after JSON, request
  id, and an integrity hash. `Export` and retention/legal-hold status live here.
- **Empty space:** quiet — a new project shows "No activity yet"; audit shows "No events match".
- **iPad / landscape:** feed left, **event detail inspector** right; audit becomes a full data
  table with sortable columns and a filter rail.
- **Tab bar:** visible on the feed; hidden in full audit-table immersion on iPhone.

**Write path (dual record: activity + immutable audit)** — how one mutation produces both:

```mermaid
sequenceDiagram
  participant UI
  participant API
  participant DB as DB (append-only)
  participant RT as Realtime
  UI->>API: mutation e.g. PATCH /tasks/:id + Idempotency-Key
  API->>DB: apply change and bump version
  API->>DB: append activity_event with before and after
  API->>DB: append audit_event, hash = H(prev_hash + event) if security-relevant
  API-->>RT: activity.created to authorized subscribers only; audit never broadcast
  API-->>UI: 200 OK, optimistic row reconciled by id or op_id
  Note over DB: audit is write-once; no UPDATE or DELETE path exists
```

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Header | `GlassNavBar`, large title, `SearchField`, `FilterButton` (popover), `ExportMenu` |
| Feed | `ActivityList` (FlashList), `ActivityRow`, `ActorAvatar`, `VerbPhrase`, `BeforeAfterLine`, `DayHeader`, `SecurityMarker` (🔒), `RelativeTime` |
| Entity tab | `ActivityTab` (embedded), `ActivitySegmentedControl`, `LoadMoreFooter` |
| Filters | `FilterSheet` (actor/action/entity/date/IP), `ActionTypePicker`, `DateRangePicker`, `ActorPicker` |
| Audit | `AuditTable`, `AuditRow`, `ColumnHeader` (sortable), `AuditEventSheet`, `DiffViewer` (before→after JSON), `IntegrityBadge`, `RequestIdChip` |
| Compliance | `RetentionBanner`, `LegalHoldSheet`, `HoldBadge`, `ExportProgressCard`, `SIEMStatusChip` |
| Feedback | `Skeleton`, `Toast`, `Banner` (retention/hold/offline), `ConfirmDialog`, `EmptyState` |
| AI | `AIButton` ("Summarize activity", "Explain this change"), `AISummaryCard` |

Primitives from [03 · Design System](./03-design-system-ui.md). The per-task `ActivityTab` is
the same component embedded by [10 · Task Detail](./10-task-detail.md).

---

## 5. Modern Features

Each: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

**Role permission matrix** (module actions; per-feature deltas noted inline; canonical model
in [shared/rbac-permissions.md](./shared/rbac-permissions.md)):

| Action | Owner | Admin | Manager | Member | Guest |
|--------|:-----:|:-----:|:-------:|:------:|:-----:|
| View entity activity (accessible) | ✅ | ✅ | ✅ | ✅ | shared |
| View org activity feed | ✅ | ✅ | scoped | own-scope | shared |
| Search / filter security audit | ✅ | ✅ | team-scoped | ❌ | ❌ |
| Export audit log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure retention policy | ✅ | ✅ | ❌ | ❌ | ❌ |
| Place / release legal hold | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure SIEM streaming | ✅ | ✅ | ❌ | ❌ | ❌ |

Personal-task activity is owner-only (never visible to Admins), consistent with
[10](./10-task-detail.md) and [shared/rbac-permissions.md](./shared/rbac-permissions.md).

### 5.1 Per-entity activity timeline ✅ (Linear/Jira history)
- **Purpose:** show the full change history of one task/project/doc in context.
- **Workflow:** any field change, comment, status move, assignment, attachment, relationship,
  or lifecycle event appends a record; the entity's Activity segment renders them newest-first
  with before→after; tap to jump to a comment or prior version.
- **UI:** `ActivityTab`, `ActivityRow`, `BeforeAfterLine`, `DiffViewer` for rich changes.
- **Permissions:** anyone who can view the entity sees its activity; guests only shared entities.
- **Offline:** append-only records sync losslessly (merge by id — never conflict); local
  optimistic entries show immediately with a "pending sync" hint.
- **API:** `GET /activity?entity=task&entityId=…&cursor=`.
- **DB:** `activity_events` (see §16), immutable, indexed by entity.
- **Notify:** none by itself (individual actions drive their own notifications via [12](./12-notifications-alerts.md)).
- **AC:** every mutation produces exactly one activity event with before→after; ordering stable;
  deep-links resolve to the exact change.

### 5.2 Organization activity feed ✅ (Slack-style)
- **Purpose:** a scannable, filtered stream of what's happening across the workspace.
- **Workflow:** open Activity → scope (All/Mentions/Mine/Project) → grouped by day; infinite
  scroll; tap any row to open the target.
- **UI:** `ActivityList`, scope segmented, `DayHeader`, `SecurityMarker`.
- **Permissions:** **query-scoped** — each user only sees events for resources they can access;
  never over-fetch then filter client-side.
- **Offline:** recent feed cached; older loads on reconnect; no dead spinners.
- **API:** `GET /activity?scope=all|mentions|mine|project&projectId=&cursor=`.
- **DB:** reads `activity_events` with a permission-scoped query.
- **Notify:** none (feed is pull; notifications are separate).
- **AC:** feed never shows an event for inaccessible content; scope filters are accurate;
  pagination is stable under new inserts (cursor-based).

### 5.3 Immutable security audit log ✅ (SOC 2 / ISO 27001)
- **Purpose:** tamper-evident record of security-relevant actions for compliance & forensics.
- **Workflow:** security events (auth, role change, permission change, export, deletion,
  retention/hold changes, billing, integration connect, API-key issue) are written to an
  **append-only, write-once** store with actor, target, IP, device, user-agent, request id,
  result, and an integrity hash chaining to the previous event.
- **UI:** `AuditTable`, `AuditEventSheet`, `IntegrityBadge` (verified/broken).
- **Permissions:** **Admin/Owner only** (Manager gets a team-scoped read at most).
- **Offline:** audit is **server-authoritative**; the admin view requires connectivity (no
  offline audit editing — by design).
- **API:** `GET /audit?filter[...]=&cursor=`, `GET /audit/:id`.
- **DB:** `audit_events` (append-only + hash chain), never `UPDATE`/`DELETE` at the app layer.
- **Notify:** high-risk events (new-device login, role escalation, mass export) can alert
  Owners/Admins ([12](./12-notifications-alerts.md)).
- **AC:** no API path mutates or deletes an audit event; hash chain verifies; every
  security-relevant action across the app appears exactly once.

### 5.4 Filters, search & drill-down 🔜
- **Purpose:** answer "who changed X / what did user Y do / all deletions last week."
- **Workflow:** filter by actor, action type, entity type/id, date range, IP, result; full-text
  on target labels; combine filters (AND across keys); save a filter as a view.
- **UI:** `FilterSheet`, `ActionTypePicker`, `DateRangePicker`, `ActorPicker`, sortable columns.
- **Permissions:** feed filters for everyone (scoped); audit filters Admin-only.
- **Offline:** feed filters run on cached data; audit filters require server.
- **API:** `GET /audit?filter[actor]=&filter[action]=&filter[from]=&filter[to]=&sort=-ts`.
- **DB:** covered by composite indexes (§16).
- **Notify:** none.
- **AC:** filters compose correctly; results are permission-scoped; large ranges paginate
  without timeout; saved filters persist.

### 5.5 Export 🔜 (CSV / JSON / SIEM)
- **Purpose:** hand auditors a file and stream to enterprise security tooling.
- **Workflow:** Admin selects a range/filters → async export → signed, expiring download
  (CSV/JSON/NDJSON); optional scheduled export; **SIEM streaming** (Splunk/Datadog/S3) via
  webhook/stream 🟣.
- **UI:** `ExportMenu`, `ExportProgressCard` (Live Activity for long jobs), `SIEMStatusChip`.
- **Permissions:** export is Owner/Admin-only and is itself an audited action.
- **Offline:** requires connectivity.
- **API:** `POST /audit/exports`, `GET /audit/exports/:id`, `PUT /orgs/:id/audit/siem`.
- **DB:** `audit_exports` (request, range, requester, status, file ref, expiry).
- **Notify:** export ready → requester; export **failure** → requester + Admin.
- **AC:** export contents match the filtered query exactly; files expire; every export is
  recorded in the audit log (meta-audit); SIEM stream retries with backoff.

### 5.6 Retention policy ✅/🔜
- **Purpose:** balance storage/compliance — keep as long as required, no longer.
- **Workflow:** Admin sets retention per **stream** (activity vs security audit) — e.g., keep
  audit 400 days, activity 180 days; expired records purged by a scheduled job **unless under
  legal hold**. Defaults align with [shared/security-baseline.md](./shared/security-baseline.md).
- **UI:** `RetentionBanner`, retention settings in [40](./40-security-compliance-center.md).
- **Permissions:** Owner/Admin.
- **Offline:** server-side job; N/A offline.
- **API:** `GET/PUT /orgs/:id/audit/retention`.
- **DB:** `retention_policies(org_id, stream, days)`; purge job respects holds.
- **Notify:** "retention changed" is itself audited; optional Owner confirmation for shortening.
- **AC:** shortening retention warns and is audited; purge never deletes held records; audit
  retention floor enforced (can't be set below a compliance minimum, e.g., 90 days).

### 5.7 Legal hold 🟣 (eDiscovery)
- **Purpose:** freeze records from deletion during litigation/investigation.
- **Workflow:** Admin creates a **hold** scoped by user, project, entity, or date range with a
  case name; held records are exempt from retention purge and from user-initiated deletion
  (soft-delete allowed, physical purge blocked); releasing the hold resumes normal retention.
- **UI:** `LegalHoldSheet`, `HoldBadge`, hold list in [40](./40-security-compliance-center.md).
- **Permissions:** Owner/Admin only; creating/releasing a hold is audited.
- **Offline:** server-side; N/A offline.
- **API:** `POST /orgs/:id/legal-holds`, `DELETE /legal-holds/:id`, `GET /legal-holds`.
- **DB:** `legal_holds(id, org_id, scope_json, case_name, created_by, created_at, released_at?)`.
- **Notify:** hold created/released alerts Owners; end-user account-deletion requests during a
  hold are deferred with a compliance notice.
- **AC:** held records survive retention purge and account deletion; a purge attempt on a held
  record is blocked and logged; hold scope is evaluated at purge time (not just creation).

### 5.8 Integrity verification 🟣
- **Purpose:** prove the audit log wasn't tampered with.
- **Workflow:** each `audit_event` stores `hash = H(prev_hash || canonical_event)`; a periodic
  job + on-demand admin action re-computes the chain and reports any break; optional external
  anchoring (e.g., daily digest to a WORM bucket / transparency log) 💡.
- **UI:** `IntegrityBadge` (verified / mismatch), verification report in [40](./40-security-compliance-center.md).
- **Permissions:** Owner/Admin.
- **Offline:** server-side.
- **API:** `POST /audit/verify?from=&to=` → report.
- **DB:** `audit_events.hash`, `audit_events.prev_hash`.
- **Notify:** integrity mismatch → immediate Owner/Admin + security incident.
- **AC:** verification detects any insert/edit/delete in the chain; a broken chain raises an
  incident; verification itself is audited.

---

## 6. Smart AI Features

Powered by [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md); proposal-first and
read-only where it touches audit (AI **never** writes audit records). Logged as `ai_invoked`.

| Capability (`capability` id) | What it does |
|------------------------------|--------------|
| `activity_summary` | "What changed in this project this week?" → narrative digest from the feed (permission-scoped). |
| `change_explain` | "Explain this change" on an event → plain-language before→after with likely reason. |
| `audit_nl_search` | Natural-language audit queries ("all role changes by admins in June") → structured filters (🧪). |
| `anomaly_detect` | Flags unusual patterns (mass deletes, off-hours exports, impossible travel) as security insights (🧪). |

AI reads audit **metadata only** (never raw task content unless the org opts in for debugging),
respects DLP scope, and its own queries/exports are recorded in the audit log.

---

## 7. Productivity Features

- **"What did I miss?"** — a since-last-seen activity digest per project on return.
- **Jump-to-change** — tap any feed row to deep-link to the exact comment/field/version.
- **Watch & mute** — follow an entity's activity or mute noisy ones (reuses watchers from [10](./10-task-detail.md)).
- **Saved audit views** — Admins pin frequent queries ("deletions last 30d", "exports").
- **Weekly activity recap** — optional digest via [12 · Notifications](./12-notifications-alerts.md).

---

## 8. Enterprise Features

- **Immutable, hash-chained audit** with integrity verification (§5.3, §5.8).
- **Retention policies** per stream with a compliance floor (§5.6).
- **Legal hold / eDiscovery** freezing records against purge and deletion (§5.7).
- **SIEM streaming & scheduled export** (Splunk/Datadog/S3/NDJSON) for security ops (§5.5).
- **Access reviews** — audit surfaces role/permission changes over time to support periodic
  access reviews (SOC 2 CC6).
- **Data residency** — audit stored in the org's pinned region (enterprise).
- **Meta-audit** — reads/exports of the audit log are themselves audited ("who looked?").
- Admin controls surfaced in [40 · Security & Compliance Center](./40-security-compliance-center.md).

---

## 9. Collaboration Features

- **Shared context** — activity co-located with work builds trust ("Priya moved this, 2m ago").
- **@mention scope** — the "Mentions" feed aggregates everywhere you were mentioned across
  tasks/docs/comments.
- **Comment/decision linkage** — a pinned "decision" comment ([10](./10-task-detail.md)) shows
  in the feed as a decision event.
- **Reactions on activity** 💡 — lightweight acknowledgment of a change ("👍 seen").
- **No surveillance** — the feed shows *work* changes; per-keystroke or presence tracking is
  never logged; personal-task activity stays private.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Activity events are append-only** → they merge by id and **never conflict**; an offline
  action creates a local optimistic activity row that reconciles to the server's canonical
  event (same id) on sync.
- The activity source of truth is **server-generated** alongside each mutation, so the client's
  optimistic row is replaced, not duplicated, on reconnect (deduped by `opId`/event id).
- The **security audit log is server-only**: it is not mirrored for offline editing and cannot
  be created client-side (integrity requirement); the admin view requires connectivity.
- Feed reads use the cached mirror for recent items; deep history and audit fetch on demand.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md) (this module is the
canonical audit surface that spec references):
- **Write-once semantics:** no application code path performs `UPDATE`/`DELETE` on
  `audit_events`; enforced by DB grants + append-only table + hash chain.
- **Least privilege:** audit read is Owner/Admin only; the feed is strictly query-scoped so
  users never see events for content they can't access; personal-task activity is owner-only.
- **PII minimization:** audit stores actor/target ids + metadata, not raw task content; before→
  after diffs redact sensitive fields (e.g., rate cards from [21](./21-time-tracking-timesheets.md)).
- **Meta-audit + anomaly:** viewing/exporting the audit is itself recorded; unusual access is
  flagged (§6). Integrity verification detects tampering (§5.8). Exports are signed + expiring.

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- **New types:** `audit_export_ready` / `audit_export_failed` (→ requester/Admin),
  `legal_hold_created` / `legal_hold_released` (→ Owners), `audit_integrity_alert`
  (→ Owner/Admin, immediate, bypasses quiet hours), `security_anomaly` (opt-in).
- The **activity feed itself does not push** — it's a pull surface; individual actions notify
  through their own modules to avoid double-alerting.
- Weekly **activity recap** digest is opt-in and respects quiet hours.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- `ActivityRow` reads as a single sentence: "Priya moved Launch email to Done, 2 minutes ago,
  was In Review" — no information conveyed by the `🔒` icon alone (paired with "security event").
- The audit `DiffViewer` exposes before/after as labeled regions ("Before: In Review. After:
  Done."), navigable field-by-field.
- The dense audit table on iPad exposes column headers and sortable state; each row is a
  navigable element with a summarized label.
- Relative times also expose an absolute timestamp on focus ("2 minutes ago, July 16 3:08 AM").

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- New activity rows slide-up + fade (`motion.base`); day headers stick during scroll.
- Filter changes cross-fade the list rather than reflow-jump (respects Reduce Motion → instant).
- Audit event → detail sheet `spring.gentle`; `IntegrityBadge` mismatch pulses red **once**
  (no loop) and is announced, never relying on motion alone.
- No celebratory motion here — this is a record surface; motion stays functional and quiet.

---

## 15. Performance

- Feed and audit lists virtualized (FlashList) with cursor pagination; only visible rows render.
- Activity events are **written asynchronously** on the write path (outbox → event bus) so
  logging never blocks the user's optimistic mutation.
- Audit queries hit composite/covering indexes; large date ranges stream (NDJSON) for export
  rather than buffering; verification runs incrementally in the background.
- Feed cache holds recent N days locally; deep history is fetch-on-scroll.
- High write volume handled by partitioning `audit_events`/`activity_events` by month; hot
  partition indexed for recent reads.

---

## 16. Database Design

```text
activity_events(id, org_id, actor_id?→users, entity_type, entity_id, action,
                summary, before_json?, after_json?, project_id?, visibility
                enum(entity|project|org), op_id?, created_at)          -- append-only, user-facing
audit_events(id, org_id, actor_id?→users, actor_ip, device_id?, user_agent, action,
             target_type, target_id?, result enum(success|denied|error), meta_json,
             request_id, prev_hash, hash, created_at)                  -- write-once, hash-chained
legal_holds(id, org_id, scope_json, case_name, created_by→users, created_at, released_at?)
retention_policies(org_id, stream enum(activity|audit), days, updated_by→users, updated_at)
audit_exports(id, org_id, requested_by→users, filter_json, format enum(csv|json|ndjson),
              status enum(pending|ready|failed), file_ref?, expires_at?, created_at)
siem_configs(org_id, provider enum(splunk|datadog|s3|webhook), endpoint, secret_ref,
             enabled bool, last_delivered_at?)
```

**Indexes:** `activity_events(entity_type, entity_id, created_at)`,
`activity_events(org_id, created_at)`, `activity_events(project_id, created_at)`,
`audit_events(org_id, created_at)`, `audit_events(actor_id, created_at)`,
`audit_events(action, created_at)`, `audit_events(target_type, target_id)`, monthly
**partitioning** on `created_at` for both event tables.
**Constraints & integrity:** `audit_events` is **append-only** (no `UPDATE`/`DELETE` grant to
the app role); `hash = H(prev_hash || canonical(event))` chains events per org; activity
`visibility` drives query scoping; purge job deletes only rows past retention **and not under
any matching legal hold**. `activity_events` merge by `id`/`op_id` (idempotent) for offline
reconciliation. Aligns with [17 · Data Model](./17-data-model-api.md) and the per-task
`activity_log` in [10](./10-task-detail.md) (which is the task-scoped projection of
`activity_events`).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/activity?scope=&entity=&entityId=&projectId=&cursor=` | Activity feed (scoped) |
| GET | `/audit?filter[actor]=&filter[action]=&filter[from]=&filter[to]=&sort=-ts&cursor=` | Audit search (admin) |
| GET | `/audit/:id` | Audit event detail (metadata + before→after + hash) |
| POST | `/audit/exports` | Start async export (CSV/JSON/NDJSON) |
| GET | `/audit/exports/:id` | Export status + signed URL |
| POST | `/audit/verify?from=&to=` | Integrity verification report (🟣) |
| GET/PUT | `/orgs/:id/audit/retention` | Retention policy per stream |
| POST | `/orgs/:id/legal-holds` · `GET` · `DELETE /legal-holds/:id` | Legal hold (🟣) |
| GET/PUT | `/orgs/:id/audit/siem` | SIEM streaming config (🟣) |

**Realtime:** channel `org:{id}` → `activity.created` (scoped fan-out to authorized subscribers);
audit is **not** broadcast in realtime (pull + export only). **Errors:** `403 forbidden`
(non-admin audit access, out-of-scope activity), `405`/`403` on any attempt to `PATCH`/`DELETE`
an audit event (immutable), `409 conflict` on retention-below-floor, `429 rate_limited` on heavy
audit queries. There are **no mutation endpoints** for audit events by design. Reads are
`Idempotency-Key`-free (GET); export creation carries an `Idempotency-Key`.

**Sample — audit search**
```http
GET /v1/audit?filter[action]=role.change&filter[from]=2026-06-01&filter[to]=2026-06-30&sort=-ts&limit=2
X-Org-Id: org_1
```
```json
{ "data": [
  { "id": "aev_1a2b", "actorId": "usr_admin", "action": "role.change",
    "targetType": "user", "targetId": "usr_sara", "result": "success",
    "actorIp": "203.0.113.7", "device": "iPhone16,2",
    "before": { "role": "member" }, "after": { "role": "manager" },
    "requestId": "req_88…", "hash": "b7f3…", "createdAt": "2026-06-14T09:20:00Z" }
], "meta": { "nextCursor": "opaque", "total": 37 } }
```

---

## 18. Edge Cases

- **Offline action then reconnect:** optimistic activity row is replaced by the canonical
  server event (same id/`opId`) — never duplicated.
- **Deleted actor/target:** events retain a denormalized label ("Former member", "Deleted
  task"); ids preserved for forensics; no orphan crash.
- **Attempt to edit/delete an audit event:** rejected at API + DB layer; the attempt is itself
  logged as a denied action.
- **Retention purge vs legal hold:** hold always wins; a purge that would touch held rows skips
  them and records the skip.
- **Clock skew / timezone:** all timestamps stored UTC; displayed local; audit ordering uses
  server time, not client `clientTs`.
- **Hash chain gap (missing/void event):** verification flags the break, raises an integrity
  alert, and pinpoints the affected range.
- **Huge export range:** streamed (NDJSON) with backpressure; if it fails midway, status
  `failed` and it can be retried; partial files are never handed out.
- **Permission lost mid-session:** subsequent feed/audit reads re-scope; previously loaded
  rows for now-inaccessible content are dropped on refresh.
- **Personal task activity:** never appears in Admin audit or others' feeds.
- **SIEM endpoint down:** events buffered and retried with backoff; nothing dropped; status chip
  shows degraded delivery.
- **Storage pressure:** activity mirror evicts oldest cached rows (re-fetchable); audit is
  server-side and never evicted client-side.
- **Timezone-spanning date filter:** range boundaries interpreted in the admin's tz but matched
  against UTC storage consistently.

---

## 19. User States

- **First-time:** entity Activity shows "No activity yet"; org feed introduces scopes.
- **Returning / power:** "What did I miss?" digest, saved filters, jump-to-change.
- **Guest:** activity only for explicitly shared entities; no audit access.
- **Member:** entity + scoped org feed; no security audit.
- **Manager:** team-scoped feed; at most team-scoped audit read (per org policy).
- **Admin/Owner:** full audit search/export, retention, legal hold, SIEM, integrity, meta-audit.
- **Offline / poor network:** cached feed works; audit + export require connectivity (clear
  messaging, no dead spinners).
- **Tablet / landscape:** feed + event inspector; audit as a full sortable data table with a
  filter rail.
- **Dark mode / large text / a11y:** tokens + Dynamic Type; single-sentence row labels; diff
  regions labeled; icons never sole signal.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md). Product analytics
about *using* the feed/audit — distinct from the audit log itself; never contains task content.

| event | key properties |
|-------|----------------|
| `activity_viewed` | `surface` (entity/org), `scope` |
| `activity_filtered` | `dimensions` |
| `activity_row_opened` | `entity_type` |
| `audit_searched` | `filters_count`, `result_count_bucket`, `range_days_bucket` |
| `audit_event_opened` | `action` |
| `audit_exported` | `format`, `range_days_bucket` |
| `retention_changed` | `stream`, `direction` (increase/decrease) |
| `legal_hold_created` / `legal_hold_released` | `scope_type` |
| `audit_integrity_checked` | `result` (verified/mismatch) |
| `siem_configured` | `provider` |
| `ai_invoked` | `capability` (activity_summary/change_explain/audit_nl_search/anomaly_detect), `accepted` |

---

## 21. Acceptance Criteria

1. Every mutation across the app appends exactly one activity event with before→after.
2. Per-entity Activity renders newest-first and deep-links to the exact change.
3. The org feed is query-scoped; users never see events for inaccessible content.
4. Feed scopes (All/Mentions/Mine/Project) filter accurately.
5. Cursor pagination is stable when new events are inserted mid-scroll.
6. Personal-task activity is never visible to Admins or other users.
7. Security-relevant actions (auth, role/permission change, export, deletion, retention, hold,
   billing, integration, API key) are written to the audit log.
8. No API or app-layer path can update or delete an audit event.
9. An attempt to modify an audit event is rejected and itself logged as denied.
10. Each audit event stores actor, IP, device, user-agent, request id, result, and a hash.
11. The audit hash chain verifies; any tampering is detectable and pinpointed.
12. A broken integrity chain raises an immediate Owner/Admin alert and incident.
13. Audit read/search is Owner/Admin only (Manager at most team-scoped per policy).
14. Viewing and exporting the audit log are themselves audited (meta-audit).
15. Audit filters compose (actor/action/entity/date/IP/result) and paginate large ranges.
16. Exports (CSV/JSON/NDJSON) match the filtered query exactly and are signed + expiring.
17. Export files never expose partial results on failure; failures notify requester + Admin.
18. Retention policy is configurable per stream (activity vs audit) with a compliance floor.
19. Shortening retention warns, requires confirmation, and is audited.
20. The purge job never deletes records under an active legal hold.
21. Legal hold freezes matching records against retention purge and user deletion.
22. A purge/delete attempt on held records is blocked and logged.
23. Legal-hold scope is evaluated at purge time, not only at creation.
24. SIEM streaming retries with backoff; no events are dropped when the endpoint is down.
25. Activity events are append-only and merge by id — offline actions never duplicate them.
26. The audit log is server-only and cannot be created or edited from the client.
27. Deleted actors/targets keep denormalized labels; ids preserved for forensics.
28. All timestamps are stored UTC, displayed local; audit ordering uses server time.
29. Realtime `activity.created` fans out only to authorized subscribers; audit is not broadcast.
30. AI activity summaries/explanations are read-only, permission-scoped, and logged.
31. AI never writes audit records and reads metadata only (unless org opts in for debugging).
32. VoiceOver reads each activity row as one sentence; the `🔒` marker is paired with text.
33. The audit diff viewer exposes labeled before/after regions.
34. Reduce Motion makes filter changes instant and disables the integrity pulse (still announced).
35. iPad landscape shows feed + event inspector and a sortable audit table with a filter rail.
36. Offline feed reads work from cache; audit/export show clear "requires connection" states.
37. Analytics-of-usage events fire with correct properties and contain no task content.
38. Heavy audit queries are rate-limited and never time out the client (streamed/paginated).

---

## 22. Future Roadmap

- **V1 (✅):** per-entity activity timeline, org activity feed (scoped), immutable audit log
  with actor/IP/device/hash, high-risk alerts, basic retention defaults.
- **V1.1 (🔜):** advanced audit filters + saved views, CSV/JSON export, configurable retention
  per stream, "what did I miss" digests, activity AI summary/explain.
- **V2 (🟣):** legal hold / eDiscovery, integrity verification + external anchoring, SIEM
  streaming (Splunk/Datadog/S3), meta-audit dashboards, data residency for audit.
- **Future (💡):** transparency-log anchoring, cross-org audit federation, reactions on activity,
  field-level history diff explorer.
- **Experimental (🧪):** natural-language audit search, ML anomaly detection (mass delete,
  off-hours export, impossible travel), auto-generated incident timelines.
- **AI track:** narrative "activity story" per project/week; proactive "unusual change" nudges.
- **Enterprise track:** access-review workflows (SOC 2 CC6), eDiscovery exports, per-region
  audit storage, customer-managed keys for audit at rest.
