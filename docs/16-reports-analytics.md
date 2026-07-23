# 16 · Reports & Analytics

> Follows the [Master PRD Template](./00-prd-template.md). Reports turns Numil's task data into
> insight: a personal productivity dashboard for everyone and scoped project/team/org rollups
> for managers — always permission-safe (personal tasks never aggregated). Narrative and
> predictive layers come from [36 · AI Productivity Insights](./36-ai-productivity-insights.md).

---

## 1. Purpose

Reports & Analytics answers "how am I / how is my team doing?" with trustworthy, real-time,
scope-correct metrics. It is Numil's accountability and reflection surface — the read-only
projection that helps individuals build streaks and managers spot overload and slippage early.

**User problem it solves.** Individuals lack a mirror on their own habits; managers fly blind on
who's overloaded and what's slipping until it's late. Heavy PM tools bury this in configurable
BI that most people never touch. Numil ships **opinionated, beautiful default charts** that are
useful on day one, with drill-down and export for power users — and it does so without ever
exposing anyone's private tasks.

**User goals**
- See my completions, on-time rate, overdue, and streak at a glance.
- Understand a project's progress (burnup, workload, distribution).
- As a manager, see team workload and who's overloaded — fairly and privately.
- Filter by range/project/member/label/priority and export a snapshot.

**Business goals**
- Retention through reflection (streaks, weekly review) and manager value (team visibility).
- A gateway to premium AI insights ([36](./36-ai-productivity-insights.md)) and enterprise
  reporting/export.
- Trust: rigorous permission scoping is itself a selling point for orgs.

**KPIs:** report open rate, range/filter interactions, export usage, streak retention lift,
correlation of report use with on-time completion, Manager weekly-active on team reports.

---

## 2. Navigation

**Entry points**
- **Sidebar footer / More tab → Reports.**
- **Home dashboard** "See more insights" ([07 · Home](./07-home-dashboard.md)) → Reports (My scope).
- A **project's overflow → "Project report"** ([09 · Team Tasks & Projects](./09-team-tasks-projects.md)).
- **Manager digest** ("3 tasks overdue on your team") deep-links into the team report.
- Deep links: `numil://reports?scope=me`, `numil://reports/project/{id}`, `numil://reports/team/{id}`.

**Route:** `src/app/reports/index.tsx` (scope selector + dashboard) with pushed detail screens
`src/app/reports/project/[id].tsx`, `.../team/[id].tsx`, `.../org.tsx`. A tapped chart element
pushes a **drill-down list** (`src/app/reports/drilldown.tsx`) — the underlying filtered tasks.

**Navigation hierarchy & breadcrumbs**
```text
Reports ▸ My productivity
Reports ▸ Project: Marketing
Reports ▸ Team: Growth ▸ Workload ▸ [drill-down list]
Reports ▸ Organization
```

**Transitions & modal-vs-push**
- Scope switch is an inline **segmented control** (no navigation).
- Range/filter open as **bottom sheets** (list updates live behind).
- Drill-down from a chart **pushes** a real task list (reuses [14](./14-search-filters-views.md) list).
- Export/share opens a **modal** (format picker → generate → share sheet).

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  Reports          [ Me ] Project Team Org       │  ← scope segmented
│  This week ▾                       ⤴ Export     │  ← range picker + export
├───────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │  ← summary cards
│  │  ✔ 18  │ │ 92%    │ │  ⚠ 3   │ │ 🔥 12d │    │
│  │ Done   │ │On-time │ │Overdue │ │ Streak │    │
│  └────────┘ └────────┘ └────────┘ └────────┘    │
├───────────────────────────────────────────────┤
│  Completed vs. Created                          │
│   ▁▃▅▇▆▅▃   ▁▂▃▂▄▃▂     ● done  ● created       │  ← dual line/bar trend
│   Mon Tue Wed Thu Fri Sat Sun                    │
├───────────────────────────────────────────────┤
│  By priority        By project                  │
│   ◕ Urgent 4        ▇▇▇ Marketing 40%           │  ← donut + stacked bar
│   ◑ High   7        ▇▇  Launch    30%           │
├───────────────────────────────────────────────┤
│  Workload by member  (team scope)               │
│   Priya  ▇▇▇▇▇▇▇  9  (2 urgent)                  │  ← horizontal bars
│   Marco  ▇▇▇▇     5                              │
│   Sara   ▇▇       2      · Unassigned ▇ 1        │
├───────────────────────────────────────────────┤
│  Completion heatmap (streak)                    │
│   ▢▪▪▢▪▪▪  ▪▪▪▢▪▪▪  … 12-day streak              │
└───────────────────────────────────────────────┘
```

- **Top:** scope segmented control (Me/Project/Team/Org — segments hidden if unauthorized) +
  range picker + Export. Large title collapses on scroll; respects Dynamic Island/safe areas.
- **Summary cards:** 3–4 headline numbers (Done, On-time %, Overdue, Streak) with trend arrows.
- **Trend chart:** completed vs. created over the range (dual series).
- **Breakdowns:** by priority (donut), by project/label (stacked/horizontal bar).
- **Workload (team only):** per-member open work weighted by priority; "Unassigned" bucket.
- **Heatmap:** completion calendar heatmap for streaks (personal scope).
- **Empty/low data:** friendly "complete a few tasks to see insights" per card.
- **Landscape / iPad:** multi-column dashboard grid; charts side-by-side; drill-down opens a
  right-hand pane.
- **Tab bar:** visible; charts are non-interactive to swipe-back gestures (tap to drill down).

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Header | `ScopeSegmentedControl` (Me/Project/Team/Org), `RangePicker` (presets + custom), `FilterButton`, `ExportButton` |
| Summary | `MetricCard` (value + label + trend delta + sparkline), `MetricCardGrid`, `TrendArrow` |
| Charts | `TrendChart` (dual line/bar), `DonutChart`, `StackedBarChart`, `HorizontalBarChart` (workload), `HeatmapCalendar` (streak), `ChartLegend`, `ChartTooltip`, `ChartSkeleton`, `ChartEmptyState` |
| Workload | `WorkloadRow` (avatar + weighted bar + counts), `UnassignedBucketRow`, `OverloadBadge` |
| Drill-down | `DrilldownHeader` (what/when scope), `TaskList` (reused from module 14), `BackToReportButton` |
| Filters | `FilterSheet` (project/member/label/priority), `ActiveFilterChip` |
| Export/share | `ExportSheet` (CSV / snapshot image / PDF 🔜), `ShareSheet`, `ScheduledReportSheet` 🔜 |
| Feedback | `Banner` (offline "as of {time}"), `Toast`, `AsOfTimestamp`, `NotEnoughDataCard` |
| AI | `InsightNarrativeCard` (module 36), `AtRiskBadge`, `ForecastLine` 🟣 |

All primitives are defined in [03 · Design System & UI](./03-design-system-ui.md); charts use a
lightweight RN charting layer with `react-native-reanimated`-driven animation.

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Personal productivity dashboard ✅ (Things "Logbook" + streaks)
- **Purpose:** a mirror on one's own throughput and consistency.
- **Workflow:** open Reports (defaults to **Me**) → summary cards + trend + priority/label
  breakdown + streak heatmap for the selected range.
- **UI:** `MetricCardGrid`, `TrendChart`, `DonutChart`, `HeatmapCalendar`.
- **Permissions:** self only; includes the user's **personal + assigned team** tasks.
- **Offline:** computed from the local mirror; shows an "as of {time}" note for server-only rollups.
- **API:** `GET /reports/me?range=&filter[...]=`.
- **DB:** reads `tasks` (completed_at, due_at, created_at, priority) + `streaks`.
- **Notify:** none (read-only); can feed the personal weekly-review digest (opt-in).
- **AC:** metrics match the raw task list for the same range/tz; streak counts consecutive
  days with ≥1 completion.

### 5.2 Project report ✅ (burnup + distribution)
- **Purpose:** one project's progress and composition.
- **Workflow:** from a project overflow or scope=Project → completed-vs-created burnup, status
  distribution, by-assignee workload, overdue list.
- **UI:** `TrendChart` (burnup), `StackedBarChart` (status), `WorkloadRow`s.
- **Permissions:** project members (Viewer+) and Manager+; respects project visibility.
- **Offline:** cached snapshot with "as of {time}".
- **API:** `GET /reports/project/:id?range=&filter[...]=`.
- **DB:** reads `tasks WHERE project_id=:id`; joins `project_members` for workload.
- **Notify:** overdue thresholds can feed a project-lead digest.
- **AC:** only team tasks in the project are counted; archived project renders read-only historical data.

### 5.3 Team report ✅ (Manager visibility)
- **Purpose:** a manager's view across the projects/members they manage.
- **Workflow:** scope=Team → aggregate completed/on-time/overdue across managed projects; the
  headline is **Workload by member** (weighted by priority) with an overload flag.
- **UI:** summary cards + `HorizontalBarChart` workload + overdue drill-down.
- **Permissions:** **Manager+** for their team; Admin/Owner org-wide.
- **Offline:** cached snapshot.
- **API:** `GET /reports/team/:teamId?range=&filter[...]=` (or `?managerId=me`).
- **DB:** reads across accessible projects; **excludes personal tasks entirely**.
- **Notify:** workload/overdue thresholds → opt-in manager daily digest (module 12).
- **AC:** a member's **personal (My Tasks) data never appears**; only shared-project team tasks
  are aggregated; workload weighting is documented and consistent.

### 5.4 Org report ✅ (Owner/Admin rollups)
- **Purpose:** company-wide health.
- **Workflow:** scope=Org → org completions, on-time trend, by-project/by-team breakdown,
  active-users and adoption rollups.
- **UI:** dashboard grid; drill into a team/project.
- **Permissions:** **Owner/Admin only**.
- **Offline:** cached snapshot.
- **API:** `GET /reports/org/:id?range=&filter[...]=`.
- **DB:** org-scoped aggregate reads (materialized rollups for performance).
- **Notify:** optional weekly org summary to Owner/Admin.
- **AC:** aggregates exclude personal tasks; numbers reconcile with the sum of team/project reports.

### 5.5 Ranges & filters ✅
- **Purpose:** slice any report by time and dimension.
- **Workflow:** range presets (Today, This week, Last 7 days, This month, Last 30 days, This
  quarter, **Custom**) + filters (project, member [team scope], label, priority).
- **UI:** `RangePicker`, `FilterSheet`, `ActiveFilterChip`.
- **Logic:** all date math in the user's **local time zone**; week boundaries per user's
  start-of-week setting ([15 · Settings](./15-profile-settings.md)).
- **Permissions:** filter values limited to accessible entities.
- **Offline:** local recompute for cached ranges.
- **API:** `?range=this_week|custom&from=&to=&filter[project]=&filter[priority]=`.
- **DB:** range-bounded queries over indexed `completed_at`/`due_at`/`created_at`.
- **AC:** switching range/filter updates all charts consistently; custom range validates from≤to.

### 5.6 Metrics catalog ✅ / 🔜
| Metric | Definition | Viz | Status |
|--------|-----------|-----|--------|
| Completed | Tasks completed in range | Bar/line | ✅ |
| Completion rate | Completed ÷ due in range | % + trend | ✅ |
| Overdue | Currently overdue count + age | Number + list | ✅ |
| On-time rate | Completed by due ÷ completed | % | ✅ |
| Created vs completed | Inflow vs outflow | Dual line | ✅ |
| Workload by member | Open tasks/assignee weighted by priority | H-bars | ✅ |
| Distribution | By priority / label / project | Donut / stacked | ✅ |
| Streak | Consecutive days completing ≥1 task | Number + heatmap | ✅ |
| Cycle time | Start→done duration | Histogram | 🔜 |
| Lead time | Created→done duration | Histogram | 🔜 |
| Forecast/velocity | Projected completion from throughput | Line + band | 🟣 |

### 5.7 Export & share ✅ / 🔜
- **Purpose:** take insight out of the app.
- **Workflow:** Export → **CSV** (raw rows for the current scope/range) ✅, **snapshot image** ✅
  of the dashboard, **PDF** 🔜; iOS share sheet to save/send.
- **Permissions:** you can only export what you can view; org exports Owner/Admin only.
- **API:** `POST /reports/export` (async job → signed URL).
- **DB:** `report_export_jobs`.
- **Notify:** "your export is ready".
- **AC:** exported numbers match the on-screen report; CSV respects permission scope.

### 5.8 Drill-down ✅
- Tap any chart segment/bar/card → pushes the exact filtered **task list** it represents (reuses
  the module 14 list), so every number is traceable to real tasks.

---

## 6. Smart AI Features

Deep insights live in [36 · AI Productivity Insights](./36-ai-productivity-insights.md); here are
the in-context surfaces, powered by [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md):

| Capability (`capability` id) | In Reports | Write? |
|------------------------------|------------|--------|
| `productivity_score` 🔜 | Narrative summary card: "You completed 18 tasks, 92% on time — up 12% from last week." | read-only |
| `risk_detect` 🔜 | Flags at-risk tasks/projects (slipping dates, overload, stale) with an `AtRiskBadge`. | read-only |
| `workload_predict` 🟣 | Forecasts when a member/project will clear its backlog at current velocity. | read-only |
| `report_nl` 💡 | "How did the Growth team do last month?" → generates the scoped report (permission-checked). | read-only |
| `anomaly_detect` 🟣 | Highlights unusual spikes/drops in throughput for a manager. | read-only |

Guardrails: all AI outputs are **read-only insights** with source links to the underlying tasks;
they respect the same permission scope (never reference private tasks); every call logs
`ai_invoked` with `capability` and `accepted`; narratives cite the metric they summarize.

---

## 7. Productivity Features

- **Weekly review ritual** (Sunsama-style): a Friday "week in review" report the user can turn
  into a shareable summary; a Monday "week ahead" preview.
- **Streaks & heatmap** reinforce daily completion habits (ties to
  [35 · Focus & Habits](./35-focus-pomodoro-habits.md)).
- **Goals/targets** 💡: set a target ("complete 20 tasks this week") and track progress against
  it in the summary cards (ties to [22 · Goals & OKRs](./22-goals-okrs-milestones.md)).
- **Personal on-time trend** nudges better estimating (feeds AI time-estimate learning).
- **One-tap "rebalance"** 🟣 from a workload chart hands overload to AI scheduling (module 19).

---

## 8. Enterprise Features

- **Org rollups & materialized reporting** for large workspaces (pre-aggregated for speed).
- **Scheduled reports** 🔜: email/deliver a team/org report weekly to Managers/Owners.
- **Custom report builder** 🟣: pick metrics/dimensions/visualizations and save as a shared
  report definition (like a Saved View for analytics).
- **Data warehouse export / BI** 🟣: scheduled CSV/parquet drop or a read replica /
  [GraphQL read layer](./shared/api-conventions.md) for BI tools; see also
  [38 · Developer API & Webhooks](./38-developer-api-webhooks.md).
- **Audit-safe:** report generation and export are recorded in
  [29 · Audit Logs](./29-activity-feed-audit-logs.md); retention honors org policy.
- **DLP:** aggregates never leak individual private-task content; row-level export respects scope.

---

## 9. Collaboration Features

- **Share a report snapshot** into [26 · Team Chat](./26-team-chat-collaboration.md) or as an
  image/PDF; recipients see a static, scope-safe snapshot (no live private data).
- **Shared report definitions** 🟣 (custom report builder) so a team sees the same dashboard.
- **Workload rebalancing** starts a collaborative conversation: from a member's overload bar,
  reassign or reschedule (writes go through task APIs with permission checks).
- **Manager ↔ member context:** drill-down from workload opens that member's *team* tasks only
  (never personal), preserving privacy while enabling 1:1 discussion.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Personal + project reports** are computed **client-side from the local mirror**, so they work
  offline; a subtle "as of {last sync time}" note appears when server rollups can't refresh.
- **Team/org aggregates** that rely on server-side materialized rollups show the **last cached
  snapshot** offline with the "as of" timestamp; they refresh on reconnect.
- Reports are **read-only** — no mutations, no outbox entries. Drill-down actions (reassign,
  reschedule) go through the normal offline task pipeline.
- **Export** requires connectivity (server-generated job); queued export requests are rejected
  gracefully offline with a "reconnect to export" note.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md) and
[shared/rbac-permissions.md](./shared/rbac-permissions.md):
- **Scope enforced server-side:** report endpoints build aggregates only from rows the caller may
  read; the client never post-filters privileged data.
- **Personal tasks (`project_id = null`) are excluded from all team/org aggregates** — even for
  Admins/Owners. This is a hard invariant, tested explicitly.
- **Least-disclosure aggregates:** team reports show counts/rollups, not the content of tasks the
  viewer couldn't otherwise open; drill-down re-checks per-task access.
- **Export** respects scope and is audited; signed, expiring URLs; no PII in filenames/logs.
- **Guests** cannot access team/org reports (only their own productivity within shared scope).

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- Reports are read-only and emit **no** direct notifications.
- **Manager thresholds** (overdue count, member overload) feed the **opt-in daily digest**;
  the digest links straight into the relevant team report/drill-down.
- **Scheduled reports** 🔜 deliver a report summary notification/email on a cadence.
- **Export-ready** notification when an async export job completes.
- All digest boundaries follow the user's start-of-week + local time zone.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- **Charts are not color-only:** every series has a label, value, and pattern/legend; VoiceOver
  reads a **data summary** ("Completed vs Created: Mon 3 done, 2 created; …") and each bar/segment
  exposes its value.
- Summary cards announce label + value + trend ("On-time rate, 92 percent, up 12 percent").
- Heatmap cells expose the date + completion count.
- Drill-down lists inherit the accessible task-row pattern.
- Reduce Transparency swaps chart glass for solid backgrounds; contrast ≥ 3:1 for chart elements.
- An optional **table view** toggle 🔜 renders any chart as an accessible data table.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Charts **animate in** on first paint (bars grow, lines draw, donut sweeps) over `motion.base`;
  subsequent range changes **tween** between datasets (no reload flash).
- Metric-card values **count up** to their number (`motion.slow`), trend arrow settles.
- Progress/streak heatmap fills sequentially; skipped under Reduce Motion (static render).
- Drill-down uses the standard push transition; export success shows a toast.
- All chart animation runs on the UI thread (worklets); Reduce Motion renders final state instantly.

---

## 15. Performance

- **Pre-aggregation:** server maintains **materialized rollups** (daily per project/member) so
  team/org reports load without scanning raw tasks; personal/project scopes compute from the
  local mirror.
- **Range-bounded queries** hit indexed `completed_at`/`due_at`/`created_at`; results cached per
  (scope, range, filter) key and invalidated on relevant task changes.
- **Charts render off the main path:** datasets memoized; only re-render on data/range change;
  virtualized workload lists for large teams.
- **Lazy load:** chart components code-split; heavy org dashboards fetch section-by-section.
- **Budgets:** report open <300ms from cache; range switch re-render <150ms; export runs async
  server-side (never blocks the UI).

---

## 16. Database Design

Aligns with [17 · Data Model & API](./17-data-model-api.md). Reports mostly **read** existing
task data plus lightweight rollup/streak tables.

```text
-- source (read): tasks(id, org_id, project_id?, owner_id, assignee_id?, priority,
--                        due_at?, completed_at?, created_at, deleted_at?)
report_rollups(org_id, scope('project'|'team'|'org'), scope_id, day,
               completed, created, overdue, on_time, weighted_open, version, updated_at)  -- materialized
streaks(user_id, current_len, longest_len, last_completed_day, updated_at)
report_export_jobs(id, user_id, org_id, scope, scope_id?, range_json, format('csv'|'png'|'pdf'),
                   status, file_url?, requested_at, completed_at?)
saved_reports(id, org_id, owner_id?, scope, name, definition_json, shared, version, …)  -- 🟣 report builder
```

**ER snippet:**
```text
Organization 1───< ReportRollup        (daily materialized aggregates per scope)
User          1───1 Streak
User          1───< ReportExportJob
Task (read)   ─── aggregated into ──> ReportRollup   (personal tasks NEVER aggregated)
Organization 1───< SavedReport         (🟣 custom report definitions, personal/shared)
```

**Indexes:** `tasks(assignee_id, completed_at)`, `tasks(project_id, completed_at)`,
`tasks(org_id, due_at) WHERE completed_at IS NULL` (overdue), `report_rollups(scope, scope_id, day)`,
`report_export_jobs(user_id, status)`. **Constraints:** rollups exclude rows where
`project_id IS NULL` (personal); `range_json.from ≤ to`; export `format` ∈ allowed set.
**Soft delete** respected (excluded via `deleted_at`). Rollups are derived/idempotent (rebuildable).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md). All read endpoints;
mutations happen only via drill-down into task APIs.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/reports/me?range=&filter[...]=` | Personal dashboard |
| GET | `/reports/project/:id?range=&filter[...]=` | Project report |
| GET | `/reports/team/:teamId?range=&filter[...]=` | Team report (Manager+) |
| GET | `/reports/org/:id?range=&filter[...]=` | Org rollups (Owner/Admin) |
| GET | `/reports/metric/:metric?scope=&range=` | Single metric (widgets/home) |
| GET | `/reports/:scope/drilldown?metric=&range=&filter[...]=` | The tasks behind a number |
| POST | `/reports/export` | Async export (CSV/PNG/PDF) |
| GET | `/reports/export/:jobId` | Export status → signed URL |
| GET | `/graphql` | Complex multi-metric reads (v2 read layer) |

**Realtime:** channel `org:{id}` — `report.rollup.updated` (nudges a soft refresh); reports also
reconcile opportunistically on task-change events for the visible scope. **Errors:**
`403 forbidden` (scope/role), `422 validation_failed` (bad range/custom dates), `404 not_found`
(archived/deleted scope → historical read-only). **Idempotency-Key** on export requests. Reads
are cursor-paginated where lists are returned (drill-down, workload).

**Sample request/response — team report**
```http
GET /v1/reports/team/team_growth?range=this_week&filter[label]=launch
Authorization: Bearer <token>
X-Org-Id: org_123
```
```json
{
  "data": {
    "range": { "from": "2026-07-13T00:00:00+05:30", "to": "2026-07-19T23:59:59+05:30", "tz": "Asia/Kolkata" },
    "summary": { "completed": 42, "onTimeRate": 0.9, "overdue": 3, "createdVsCompleted": { "created": 38, "completed": 42 } },
    "workload": [
      { "userId": "usr_priya", "open": 9, "weighted": 17, "urgent": 2, "overloaded": true },
      { "userId": "usr_marco", "open": 5, "weighted": 8, "urgent": 0, "overloaded": false },
      { "userId": null, "open": 1, "weighted": 1, "label": "Unassigned" }
    ],
    "byPriority": { "urgent": 4, "high": 12, "medium": 18, "low": 8 }
  },
  "meta": { "asOf": "2026-07-16T09:40:00Z", "requestId": "req_r16" }
}
```

---

## 18. Edge Cases

- **Offline:** personal/project computed locally; team/org show cached snapshot + "as of {time}";
  export blocked with a reconnect note.
- **Not enough data:** friendly per-card "complete a few tasks to see insights" (no empty axes).
- **Time-zone / DST change:** ranges recompute in the new local tz; week boundaries follow
  start-of-week; a range spanning a DST switch counts days correctly.
- **Archived/deleted project or team:** report renders **historical read-only** data (no writes,
  drill-down still opens existing tasks) or a graceful "no longer available".
- **Member deactivated/left:** their workload bar shows "Former member" and historical
  completions remain attributed for the range; excluded from current open workload.
- **Custom range invalid** (from>to / future-only): validation error with guidance.
- **Huge org / very long range:** server uses materialized rollups; UI paginates workload and
  drill-downs; extreme ranges are capped with a note.
- **Permission changes mid-view:** losing access to a scope hides its segment and shows a notice
  on refresh.
- **Personal-task leakage attempt:** verified impossible — aggregates and drill-down exclude
  `project_id IS NULL`; covered by explicit tests.
- **Export job failure/expiry:** signed URL TTL; user can re-request; failures surface a reason.

---

## 19. User States

- **First-time:** mostly empty cards with encouraging copy; only "My productivity" scope visible.
- **Returning/power:** custom ranges, filters, export, weekly-review habit.
- **Guest:** only personal productivity within shared scope; no team/org.
- **Member:** My productivity + project reports for projects they belong to.
- **Manager:** team report for their team; project reports for managed projects.
- **Admin/Owner:** org rollups; Owner also gets org summary digest options; **neither sees
  personal tasks**.
- **Offline / poor network:** cached snapshots with "as of {time}"; no dead spinners; export disabled.
- **Tablet/landscape:** multi-column dashboard; drill-down in a side pane.
- **Dark mode / large text / a11y:** chart palettes have dark variants; data summaries for VoiceOver;
  optional table view.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md) (extends core
`report_exported`).

| event | key properties |
|-------|----------------|
| `report_viewed` | `scope` (me/project/team/org), `range`, `filter_count` |
| `report_scope_changed` | `from`, `to` |
| `report_range_changed` | `range` (preset/custom) |
| `report_filter_applied` | `dimensions` |
| `report_drilldown_opened` | `metric`, `scope` |
| `report_exported` | `format` (csv/png/pdf), `scope`, `range` |
| `report_shared` | `target`, `scope` |
| `insight_viewed` | `capability` (productivity_score/risk_detect), `scope` |
| `workload_rebalance_started` | `member`, `over_by` |
| `scheduled_report_configured` | `cadence`, `scope` |

No task titles, descriptions, or member PII beyond hashed ids are ever sent as properties;
aggregate counts only.

---

## 21. Acceptance Criteria

1. Reports opens to **My productivity** by default for every role.
2. Scope segments (Me/Project/Team/Org) appear only if the user is authorized.
3. Summary metrics (Done, On-time %, Overdue, Streak) match the raw task data for the range/tz.
4. All date math uses the user's local time zone; week boundaries follow start-of-week.
5. Range presets (Today/This week/Last 7/This month/Last 30/This quarter/Custom) compute correctly.
6. Custom range validates `from ≤ to` and rejects impossible ranges with guidance.
7. Filters (project/member/label/priority) apply consistently across all charts on the screen.
8. Completed-vs-created trend renders both series over the selected range.
9. Priority/label/project distributions render and update on range/filter change.
10. Workload-by-member reflects **current open** tasks weighted by priority, with an overload flag.
11. Team/org reports **exclude every personal task** (`project_id = null`) — a hard invariant.
12. A member's personal (My Tasks) data never appears in any team/org aggregate or drill-down.
13. Project reports count only that project's team tasks; archived projects show read-only history.
14. Team reports are visible to Manager+ (their team) and Admin/Owner (org-wide); Guests excluded.
15. Org reports are visible to Owner/Admin only.
16. Streak counts consecutive local-days with ≥1 completion; heatmap matches.
17. Tapping any chart element/card drills into the exact filtered task list behind it.
18. Drill-down re-checks per-task access before showing tasks.
19. Numbers reconcile: org = sum of teams/projects; drill-down count = displayed metric.
20. Export produces CSV and snapshot image whose numbers match the on-screen report.
21. Export respects permission scope and is generated server-side (async, signed URL).
22. Export requires connectivity and fails gracefully offline with a reconnect note.
23. Team/org reports show a cached snapshot with an "as of {time}" note when offline.
24. Personal/project reports compute from the local mirror and work offline.
25. Reports are read-only; drill-down actions route through normal permission-checked task APIs.
26. Charts are never color-only; each series has label/value/legend and VoiceOver data summary.
27. Summary cards announce label + value + trend to VoiceOver.
28. Reduce Motion renders final chart state without animation.
29. Reduce Transparency swaps chart glass for solid backgrounds; contrast ≥ 3:1.
30. iPad shows a multi-column dashboard with side-pane drill-down.
31. Not-enough-data states show encouraging copy, never broken/empty axes.
32. Deactivated/left members show "Former member" and retain historical attribution in-range.
33. Losing access to a scope hides its segment and shows a notice on refresh.
34. Manager thresholds (overdue/overload) can feed the opt-in daily digest.
35. Scheduled reports (🔜) deliver on cadence to authorized recipients.
36. AI insight cards (🔜) are read-only, scope-safe, and cite their underlying metric.
37. Report generation and export are recorded in the audit log.
38. Analytics events fire with aggregate-only properties (no titles/PII).
39. Range/scope switches re-render all charts within performance budget (<150ms from cache).
40. Materialized rollups are rebuildable and reconcile with live data after a rebuild.

---

## 22. Future Roadmap

- **V1 (✅):** personal dashboard (completed/on-time/overdue/streak), project & team reports,
  org rollups, ranges + filters (local-tz), workload-by-member, priority/label/project
  breakdowns, streak heatmap, drill-down, CSV + snapshot export.
- **V1.1 (🔜):** cycle time & lead time, scheduled reports, PDF export, productivity-score
  narrative + at-risk detection (module 36), accessible table-view toggle, goals/targets.
- **V2 (🟣):** custom report builder (saved shared report definitions), forecast/velocity with
  confidence bands, anomaly detection, workload rebalancing → AI scheduling, BI/warehouse export
  and GraphQL read layer.
- **Future (💡):** natural-language reporting ("how did Growth do last month"), goal tracking
  woven into cards, cross-workspace portfolio reporting for multi-org users.
- **Experimental (🧪):** predictive "this project will slip" alerts with recommended actions;
  team-health composite score.
- **AI track:** deep integration with [36 · AI Productivity Insights](./36-ai-productivity-insights.md)
  and [19 · Copilot](./19-ai-assistant-copilot.md).
- **Enterprise track:** materialized reporting at scale, DLP-aware exports, per-report retention,
  audit-grade export lineage (module 40).
