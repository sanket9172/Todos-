# 14 · Search, Filters & Saved Views

> Follows the [Master PRD Template](./00-prd-template.md). Search is Numil's "find anything,
> shape anything" surface: one global query box, a composable filter/sort/group engine, and
> reusable **Saved Views**. It reads from the local mirror first (instant, offline) and
> escalates to server + semantic infra ([39 · Search Indexing & Semantic Search](./39-search-indexing-semantic.md))
> and [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md) for natural-language queries.

---

## 1. Purpose

Search, Filters & Saved Views is the retrieval and list-shaping layer of Numil. Every other
surface (My Tasks, Team Tasks, Calendar, Reports) is a *projection* of data; this module is
how a user slices that data down to exactly what they need and preserves the slice for reuse.

**User problem it solves.** In simple apps you scroll to find things; in heavy PM tools
(Jira JQL, ClickUp filters) power exists but is buried in intimidating query builders.
Numil must let a first-timer type three letters and tap a result, while a power user builds
`assignee:me is:overdue priority:high #launch` and saves it as "My fires" — both in the same
calm surface.

**User goals**
- Find a task/project/person/comment in <2s without remembering where it lives.
- Narrow any list by combining status, due, assignee, label, priority, project.
- Sort and group to match how they think (by due, by project, by person).
- Save a slice once and re-open it in one tap; share team slices.
- Ask in plain language ("what's due for me tomorrow") 💡.

**Business goals**
- Reduce time-to-find → higher daily engagement and retention.
- Saved Views seed dashboards, digests, and reports (reusable query object).
- Semantic + AI search is a premium differentiator (Motion/Notion-grade).

**KPIs:** `search_used` volume + result-tap rate, median query→open latency, `filter_applied`
adoption, `view_saved` count and re-open rate, share of queries using operators/NL, empty-result
rate (a quality signal).

---

## 2. Navigation

**Entry points**
- **Search icon** in every list/large-title header, and a persistent search row in the
  sidebar footer (see [04 · Navigation & Sidebar](./04-navigation-sidebar.md)).
- **Pull-down** on any scrollable list reveals the inline search bar (iOS `searchable` pattern).
- **Command palette** (pull-down on Home / ⌘K on iPad) opens global search with actions.
- **Filter/Sort/Group** toolbar button on every list surface.
- **Saved Views** section in the sidebar; long-press a view for quick actions.
- Deep links: `numil://search?q=...&scope=...`, `numil://view/{viewId}`.

**Route:** `src/app/search/index.tsx` (full-screen modal search) and a reusable
`FilterSheet`/`ViewSheet` presented from any list route (`src/app/(tabs)/...`). Saved views
resolve to their target list with the query pre-applied: `src/app/view/[id].tsx`.

**Navigation hierarchy & breadcrumbs**
```text
Workspace ▸ Search            (global, cross-entity)
Workspace ▸ [List] ▸ Filters  (scoped, list-local)
Workspace ▸ Saved Views ▸ [View name]
```

**Transitions & modal-vs-push**
- Global search is a **modal** slide-up over the current tab (keeps context; swipe-down to
  dismiss) — `spring.gentle`.
- Filter/Sort/Group open as **nested bottom sheets** (medium detent) so the list stays
  visible behind and updates live as filters toggle.
- Opening a Saved View is a **push** (it *is* a list) with the view name as the large title.
- Tapping a search result **pushes** the entity (task detail, project, member card).

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  Cancel     🔎  Search everything…        ✨    │  ← search field + AI/NL toggle
├───────────────────────────────────────────────┤
│  Scope:  [ All ] Tasks  Projects  People  Docs  │  ← segmented scope
├───────────────────────────────────────────────┤
│  Recent            Clear                        │  ← empty state
│   ⏱ "overdue marketing"   ⏱ "@priya"           │
│  Suggested filters                              │
│   [ is:overdue ] [ assignee:me ] [ due:today ]  │
├───────────────────────────────────────────────┤
│  TASKS · 12                                     │  ← grouped results (typed)
│   ◯ Draft Q3 launch email   #launch · Fri 5pm   │
│   ◯ Review pricing deck     High · Marketing    │
│  PROJECTS · 2                                    │
│   ▸ Marketing        14 open                     │
│  PEOPLE · 1                                       │
│   👤 Priya Rao        priya@acme.co              │
│  COMMENTS · 3                                     │
│   💬 "…ship by Thursday" → Draft Q3 launch email │
└───────────────────────────────────────────────┘
```

Filter / Sort / Group toolbar on a list:

```text
┌───────────────────────────────────────────────┐
│  My Tasks                          ⌄  ⇅  ▦  •••│  ← Filter ⌄ · Sort ⇅ · Group ▦
├───────────────────────────────────────────────┤
│  [ is:overdue ×] [ #launch ×] [ me ×]   Save ▾ │  ← active filter chips + Save view
├───────────────────────────────────────────────┤
│  ▸ Overdue (3)                                  │  ← group header (collapsible)
│    ◯ Send invoices          Yesterday 5pm       │
│  ▸ Today (5)                                     │
│    ◯ Draft launch email     5pm  #launch        │
└───────────────────────────────────────────────┘
```

- **Top:** large-title header collapses to an inline search field on scroll; `✨` toggles
  natural-language mode. Dynamic Island + top safe area respected; keyboard pushes results up.
- **Scope segmented control:** All / Tasks / Projects / People / Docs (Docs when
  [25 · Documents](./25-documents-knowledge-base.md) present). Defaults to All.
- **Empty state:** Recent searches (local) + tappable Suggested filters. Calm, no wall of options.
- **Results:** grouped by entity type with counts; matched terms highlighted; each row shows
  the minimum context to disambiguate (project, due, assignee).
- **Filter bar:** active filters render as removable chips; a **Save ▾** control turns the
  current filter+sort+group into a Saved View.
- **Group headers:** collapsible with counts; manual sort exposes drag handles.
- **Landscape / iPad:** two-pane — results list left, live preview of the selected result
  right; the filter sheet becomes a left inspector rail.
- **Tab bar:** hidden while the global search modal is open; returns on dismiss.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Search field | `SearchField` (debounced), `ScopeSegmentedControl`, `AIToggle` (✨ NL mode), `VoiceSearchButton` 🔜, `ClearButton`, `CancelButton` |
| Empty / suggestions | `RecentSearchesList`, `RecentSearchRow`, `SuggestedFilterChip`, `SavedViewSuggestionRow` |
| Results | `ResultSectionHeader` (type + count), `TaskResultRow`, `ProjectResultRow`, `PersonResultRow`, `CommentResultRow`, `DocResultRow`, `HighlightedText`, `EmptyResults`, `ResultSkeleton` |
| Filter engine | `FilterToolbarButton`, `FilterSheet`, `FilterDimensionRow`, `MultiSelectList`, `DateRangePicker`, `ActiveFilterChip` (removable), `ClearAllFiltersButton` |
| Sort/group | `SortSheet`, `SortFieldRow`, `DirectionToggle`, `GroupBySheet`, `GroupHeader` (collapsible, drag when manual) |
| Saved views | `SaveViewButton`, `SaveViewSheet` (name/scope/icon), `SavedViewRow` (sidebar), `SavedViewContextMenu`, `SharedViewBadge`, `PinToggle` |
| Query language | `OperatorAutocomplete` (popover), `TokenizedQueryField`, `QueryChip`, `SyntaxErrorBanner` |
| AI / semantic | `AISearchAnswerCard` (cited), `SourceCitationChip`, `SemanticToggle`, `RelatedResults` |
| Feedback | `Toast`/`Snackbar` (view saved/undo), `Banner` (offline/partial results), `ContextMenu` |

All primitives are defined in [03 · Design System & UI](./03-design-system-ui.md).

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Global cross-entity search ✅ (Linear ⌘K / Notion Quick Find)
- **Purpose:** find any task, project, person, comment, or doc from one box.
- **Workflow:** type → debounced incremental results grouped by type → tap to open; switch
  scope to narrow.
- **UI:** `SearchField` + `ScopeSegmentedControl`; grouped `ResultSectionHeader`s; highlights.
- **Permissions:** results are **permission-scoped server-side** (never returns inaccessible
  content); personal tasks only for their owner.
- **Offline:** searches the local SQLite mirror (FTS) instantly; banner notes results may be
  incomplete vs. server.
- **API:** `GET /search?q=&scope=&limit=&cursor=`.
- **DB:** `search_index` (FTS5 virtual table locally; Postgres tsvector server-side).
- **Notify:** none.
- **AC:** results appear <150ms from local cache; matched terms highlighted; tap opens entity.

### 5.2 Composable filters (Jira/ClickUp, made calm) ✅
- **Purpose:** narrow any list by combinable dimensions.
- **Workflow:** open Filter sheet → toggle values across dimensions → list updates live →
  active filters render as removable chips.
- **UI:** `FilterSheet` with `FilterDimensionRow`s; `ActiveFilterChip` bar; `ClearAllFilters`.
- **Logic:** **AND across dimensions, OR within a dimension** (multi-select). Dimensions:
  status, priority, due, scheduled, assignee, project, label, created/updated range, completion.
- **Permissions:** dimension values limited to what the user can see (e.g., assignee list =
  accessible members).
- **Offline:** evaluated over the local mirror; fully functional.
- **API:** `filter[...]` params per [shared/api-conventions.md](./shared/api-conventions.md).
- **DB:** indexed columns back each dimension (see §16).
- **AC:** filters combine correctly; chips remove individually; date filters honor local tz.

### 5.3 Sort & group ✅
- **Purpose:** order and cluster a list to match the user's mental model.
- **Workflow:** Sort sheet (field + direction); Group sheet (field); manual sort enables drag.
- **UI:** `SortSheet`, `GroupBySheet`, collapsible `GroupHeader` with counts.
- **Sort fields:** due, scheduled, priority, created, updated, alphabetical, manual (`order`).
- **Group fields:** due, priority, project, assignee, label, status, none.
- **Permissions:** none beyond list access.
- **Offline:** local.
- **API:** `?sort=-dueAt,priority` (secondary keys supported).
- **DB:** stable sort by (`sortKey`, `id`) to avoid flicker; manual uses fractional `order`.
- **AC:** sort/group persist **per list per user**; manual reorder persists via fractional index.

### 5.4 Search operators / query DSL 🔜 (Jira JQL, lightweight)
- **Purpose:** power users express filters as text; the DSL is the serialized form of §5.2.
- **Workflow:** type `is:overdue assignee:me priority:high #launch due:<7d "launch email"` →
  `OperatorAutocomplete` assists; invalid tokens show a `SyntaxErrorBanner` (non-blocking).
- **Grammar (informal):**

```text
query      := (clause | freeText)*
clause     := key ":" value | "#" label | "@" member | quotedPhrase
key        := is | assignee | project | label | priority | due | scheduled | created | updated | status | has
value      := token | date-token | range           ( date-token: today|tomorrow|overdue|<7d|>30d|YYYY-MM-DD )
negation   := "-" clause                            ( e.g., -label:internal )
```
- **UI:** `TokenizedQueryField`; each parsed clause becomes a `QueryChip`; free text does FTS.
- **Permissions:** same scoping as §5.1/5.2.
- **Offline:** parser is on-device; executes over the local mirror.
- **API:** `GET /search?q=<dsl>` — server parses identically (shared grammar spec in module 39).
- **DB:** DSL compiles to the same indexed predicates as the filter sheet.
- **AC:** every filter-sheet state has an equivalent DSL string and vice-versa (round-trip).

### 5.5 Saved Views (personal & shared) ✅
- **Purpose:** persist a filter+sort+group+scope combo as a named, reusable list.
- **Workflow:** shape a list → **Save ▾** → name, pick icon/color, choose **Personal** or
  **Shared** → appears in sidebar; pin to top. Editing a shared view offers "update for
  everyone" vs "save as personal copy".
- **UI:** `SaveViewSheet`, `SavedViewRow`, `SharedViewBadge`, `PinToggle`, context menu
  (rename/duplicate/share/delete).
- **Permissions:** personal = private to owner; **shared** create/edit gated to Managers+
  or the view's creator; scoped to an org or a specific project.
- **Offline:** create/edit optimistic; the stored `query` JSON syncs like any entity.
- **API:** `POST /views`, `PATCH /views/:id`, `DELETE /views/:id`, `GET /views?scope=`.
- **DB:** `saved_views(id, org_id, owner_id?, scope, project_id?, name, icon, query_json, pinned, version, …)`.
- **Notify:** sharing a view can notify the target project's members (opt-in, batched).
- **AC:** a view re-creates its exact query; sharing respects roles; personal views never leak.

### 5.6 Recent & suggested searches ✅
- Local `recent_searches` (last 20, deduped, private to device) with clear; context-aware
  `SuggestedFilterChip`s (e.g., on My Tasks: `is:overdue`, `due:today`).

### 5.7 Cross-list persistence & deep links ✅
- Each list remembers its last filter/sort/group per user. Views are addressable
  (`numil://view/{id}`) so digests, widgets ([33](./33-widgets-live-activities-watch.md)), and
  Siri shortcuts ([34](./34-siri-voice-apple-intelligence.md)) can open a saved slice directly.

---

## 6. Smart AI Features

Powered by [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md) and the retrieval
infrastructure in [39 · Search Indexing & Semantic Search](./39-search-indexing-semantic.md).

| Capability (`capability` id) | What it does in Search | Write? |
|------------------------------|------------------------|--------|
| `semantic_search` 🔜 | Vector/embedding match so "things I owe the client" finds relevant tasks/comments without keyword overlap. | read-only |
| `nl_query` 💡 | "What's due for me tomorrow" → compiles to a DSL query the user can inspect/edit. | read-only |
| `project_chat` (RAG) 🔜 | "What's blocking launch?" answers with an `AISearchAnswerCard` + `SourceCitationChip`s over accessible content. | read-only |
| `smart_view_suggest` 🟣 | Proposes Saved Views from behavior ("You keep filtering overdue+@me — save it?"). | proposes |
| `did_you_mean` ✅ | Typo tolerance / fuzzy fallback when exact FTS returns 0. | read-only |

Guardrails: NL queries render the **interpreted DSL** for confirmation before execution;
answers are **permission-filtered at retrieval** and **cite sources**; results never include
content the user can't open; logged as `ai_invoked` with `capability` + `accepted`.

---

## 7. Productivity Features

- **Quick filter chips** in list headers (Today / Overdue / Assigned to me) — one-tap slices
  that map to Saved View queries.
- **Saved Views as launchers:** pin "My fires" to the sidebar top; open from a widget or Siri.
- **Bulk actions from a filtered list:** multi-select → complete/reschedule/label/assign the
  whole slice (respects permissions).
- **"Focus this list":** hand a filtered list to [35 · Focus & Pomodoro](./35-focus-pomodoro-habits.md)
  as a session queue.
- **Digest-ready queries:** a Manager's "Team overdue" view feeds their daily digest
  ([12 · Notifications](./12-notifications-alerts.md)).

---

## 8. Enterprise Features

- **Shared/org views governance:** Admins can promote a view to an **org default** shown to
  all members (e.g., "This sprint"); creation of shared views is role-gated.
- **Saved-view ownership transfer** when a creator leaves the org (reassigned to a Manager/Admin).
- **Audit:** create/update/delete/share of shared views is logged to
  [29 · Activity Feed & Audit Logs](./29-activity-feed-audit-logs.md).
- **Data-scope enforcement:** semantic/RAG search honors DLP and permission scope — never
  surfaces private tasks or restricted projects (see [40 · Security & Compliance](./40-security-compliance-center.md)).
- **Retention:** recent-search history and view definitions honor org retention policy.

---

## 9. Collaboration Features

- **Shared Saved Views** are the collaborative core: a team opens the same "Sprint board" or
  "Unassigned in Marketing" slice; edits (with permission) update it for everyone.
- **View subscription** 🔜: follow a shared view to get a notification when it gains items
  matching a threshold (e.g., "overdue crossed 5").
- **Share a query as a link/message** into [26 · Team Chat](./26-team-chat-collaboration.md);
  recipients open the identical slice (permission-scoped on open).
- **Presence on shared views** 🟣: see who else is viewing the same live list.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Search runs against the local mirror first** using SQLite **FTS5** (`search_index`); results
  are instant offline. A non-blocking banner notes "Offline — searching this device only".
- **Filter/sort/group/DSL** are pure client evaluations over cached rows → fully offline.
- **Saved Views** are normal syncable entities (optimistic create/edit; `query_json` merges by
  version; LWW on scalar fields). A shared-view edit conflict resolves server-authoritative
  with a non-blocking notice.
- **Semantic/RAG/NL** capabilities require network → show an "AI search needs a connection"
  state and fall back to local FTS.
- **Recent searches** are device-local (never synced; privacy) and survive offline.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md) and
[shared/rbac-permissions.md](./shared/rbac-permissions.md):
- **Query scoping, not post-filtering:** the server builds the result set from authorized rows
  only (no over-fetch then hide); realtime and pagination stay within scope.
- **Personal tasks** (`project_id = null`) are searchable only by their owner — excluded from
  every other user's index, including Admins.
- **Free-text and DSL input** are treated as data: parameterized queries, no injection into
  FTS/SQL; DSL parser rejects unknown operators safely.
- **Semantic retrieval** filters candidates by permission **before** ranking; citations are
  re-validated at answer time so stale/again-restricted content is dropped.
- **Recent searches** stored locally only; cleared on sign-out and on app-lock wipe.

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- Search itself emits **no** notifications directly.
- **Shared-view actions** may emit an opt-in notice ("Priya shared the view 'Team overdue'").
- **View subscriptions** 🔜 emit threshold alerts ("'Overdue' now has 6 items") — batched,
  respects quiet hours.
- **Saved-view queries power digests:** the daily/weekly digest can render a named view's
  current contents; the view is the query source of truth.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Search field announces as "Search everything, search field"; scope control exposes selected
  value; clearing announces "Search cleared".
- Result rows announce type + primary context: "Task, Draft Q3 launch email, due Friday 5 PM,
  Marketing. Double-tap to open."
- Result section headers announce group name + count ("Tasks, 12 results").
- Filter chips expose a "Remove <filter>" action; the Save-View control is fully labeled.
- Highlighted matches don't rely on color alone (bold + underline for VoiceOver text).
- NL/semantic answer cards use `accessibilityLiveRegion="polite"`; citations are labeled links.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Results **cross-fade/reflow** as the query changes (`motion.fast`); never a jarring reload.
- Adding/removing a filter chip: chip **pops in / collapses out** (`spring.snappy`); the list
  re-groups with a `motion.base` reorder.
- Group headers collapse/expand with height animation; counts tween.
- Save-View success: sheet dismiss + toast slide-up; pinned view row settles into the sidebar.
- AI streaming answer uses the standard token cursor pulse. All movement respects Reduce Motion
  (swap to 120ms cross-fades).

---

## 15. Performance

- **Debounce** input ~200ms; cancel in-flight requests on keystroke (abortable fetch).
- **Local-first:** FTS5 query on a background thread returns instantly; server results merge in
  when they arrive (marked "more results").
- **Virtualized results** via FlashList with windowing; section headers sticky.
- **Incremental indexing:** the local `search_index` updates on every mutation via triggers, so
  it never needs a full rebuild at query time.
- **Bounded result sets:** default `limit=50`, cursor-paginated; grouped counts computed with a
  cheap aggregate, not by materializing all rows.
- **Memoized** filter predicates; group/sort recomputed only on dependency change.
- Semantic search paginates server-side (ANN index); NL parse debounced. Target: local query→
  first paint <150ms; server enrich <500ms typical.

---

## 16. Database Design

Aligns with [17 · Data Model & API](./17-data-model-api.md).

```text
saved_views(id, org_id, owner_id?, scope('personal'|'shared'), project_id?, name, icon,
            color, query_json, pinned, order, version, created_at, updated_at, deleted_at?)
recent_searches(id, user_id, device_id, query, scope, created_at)   -- device-local only
search_index(entity_type, entity_id, org_id, project_id?, owner_id?, title, body,
             tsv/fts, updated_at)                                    -- FTS5 local / tsvector server
view_subscriptions(view_id→saved_views, user_id, threshold_json)    -- 🔜
```

**Query JSON shape (the serialized filter/sort/group — the DSL's canonical form):**
```json
{
  "scope": "tasks",
  "filters": { "assignee": ["me"], "is": ["overdue"], "label": ["launch"], "priority": ["high","urgent"] },
  "sort": [{ "field": "dueAt", "dir": "asc" }, { "field": "priority", "dir": "desc" }],
  "group": "dueDate",
  "text": "launch email"
}
```

**ER snippet:**
```text
User ──< SavedView (personal: owner_id set, scope='personal')
Organization ──< SavedView (shared: scope='shared', project_id? optional narrowing)
SavedView ──< ViewSubscription >── User            -- 🔜
User ──< RecentSearch                              -- device-local, not synced
(search_index projects Task/Project/Comment/Doc/Member rows for retrieval)
```

**Indexes:** `saved_views(org_id, scope)`, `saved_views(owner_id) WHERE scope='personal'`,
FTS index on `search_index(title, body)`, `search_index(org_id, entity_type)`; per-dimension
task indexes reused from module 17 (`tasks(assignee_id, due_at)`, `tasks(project_id, status)`).
**Constraints:** shared view requires `org_id`; personal view requires `owner_id`; `query_json`
schema-validated on write. **Soft delete** via `deleted_at`. `recent_searches` never leaves the
device (no server row).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/search?q=&scope=&limit=&cursor=` | Global/typed search (FTS server-side) |
| GET | `/search/suggest?q=` | Autocomplete / did-you-mean |
| GET | `/tasks?filter[...]=&sort=&expand=` | Filtered/sorted list (list surfaces) |
| GET | `/views?scope=&projectId=` | List saved views (personal + accessible shared) |
| POST | `/views` | Create saved view |
| PATCH | `/views/:id` (If-Match) | Update name/query/scope/pin |
| DELETE | `/views/:id` | Soft-delete view |
| POST | `/views/:id/subscribe` · DELETE | View subscription 🔜 |
| POST | `/ai/search` | Semantic / NL search (cited) — see module 19 |

**Realtime:** channel `org:{id}` / `project:{id}` — `view.created|updated|deleted` so shared
views sync live; result lists reconcile via `version`. **Errors:** `422 validation_failed`
(bad DSL/query JSON, with `details[]`), `403 forbidden` (share scope), `409 conflict`
(view version). **Idempotency-Key** on all mutations. Pagination via opaque `cursor`.

**Sample request/response**
```http
GET /v1/search?q=launch%20email&scope=tasks&limit=20
Authorization: Bearer <token>
X-Org-Id: org_123
```
```json
{
  "data": {
    "tasks": [
      { "id": "tsk_abc", "title": "Draft Q3 launch email", "dueAt": "2026-07-17T17:00:00Z",
        "projectId": "prj_mkt", "highlights": { "title": "Draft Q3 <em>launch email</em>" } }
    ],
    "counts": { "tasks": 12, "projects": 2, "people": 1, "comments": 3 }
  },
  "meta": { "nextCursor": "eyJ0IjoxMn0", "requestId": "req_9f2" }
}
```

**Sample Saved View create**
```http
POST /v1/views   Idempotency-Key: 6b1e…
{ "scope": "shared", "projectId": "prj_mkt", "name": "Team overdue",
  "icon": "flame", "queryJson": { "filters": { "is": ["overdue"] }, "group": "assignee" } }
```
```json
{ "data": { "id": "view_77", "name": "Team overdue", "scope": "shared", "version": 1 } }
```

---

## 18. Edge Cases

- **Offline:** local FTS only; banner "searching this device"; AI/semantic disabled gracefully.
- **Zero results:** empty state + `did_you_mean` fuzzy fallback + "clear filters" affordance.
- **Malformed DSL:** non-blocking `SyntaxErrorBanner`; valid clauses still apply; caret marks
  the bad token.
- **Permission lost mid-session:** a Saved View whose project you can no longer access shows a
  "no longer available" row; results silently exclude it.
- **Shared view edited concurrently:** `409 conflict` → server copy wins with a "view was
  updated" notice; local unsaved rename kept as a personal copy.
- **Creator of a shared view leaves:** ownership transfers to a Manager/Admin; view persists.
- **Timezone/DST change:** relative date filters (`today`, `<7d`) recompute in the new local tz
  and roll at local midnight.
- **Huge result set:** capped + cursor-paginated; counts shown as "50+" until exact count cheap.
- **Deleted entity in results (stale index):** tapping shows a graceful "no longer available".
- **Stale local index after bulk server change:** delta sync repairs `search_index` via triggers;
  a manual "reindex" exists in settings for recovery.
- **Emoji/label collision in DSL** (`#launch` vs literal text): `#` prefix always means label;
  quote to force free text.

---

## 19. User States

- **First-time:** empty search shows friendly recents placeholder + a couple of suggested
  filters; no operator overwhelm.
- **Returning/power:** DSL, command palette, pinned Saved Views, keyboard-driven on iPad.
- **Guest:** search limited to explicitly shared projects/tasks; personal/other-project results
  never appear.
- **Manager/Admin:** can create shared/org views; sees team-scoped slices; Admin still cannot
  see personal tasks.
- **Owner:** manages org-default views; can transfer view ownership.
- **Offline / poor network:** local FTS results with a partial-results banner; no dead spinners.
- **Tablet/landscape:** two-pane search with live preview; filter inspector rail.
- **Dark mode / large text / a11y:** tokenized; highlights don't rely on color; VoiceOver flows
  verified for results and filter chips.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md) (extends the core
`search_used`, `filter_applied`, `view_saved`).

| event | key properties |
|-------|----------------|
| `search_used` | `scope`, `result_count`, `used_operators` (bool), `used_nl` (bool), `latency_ms`, `is_offline_queued` |
| `search_result_opened` | `entity_type`, `position`, `via` (typed/scope) |
| `search_zero_results` | `used_operators`, `used_nl` |
| `filter_applied` | `dimensions` (array), `filter_count` |
| `sort_changed` | `field`, `dir` |
| `group_changed` | `field` |
| `view_saved` | `scope` (personal/shared), `from_dsl` (bool) |
| `view_opened` | `scope`, `is_pinned`, `via` (sidebar/deeplink/widget) |
| `view_shared` | `target` (project/org) |
| `view_deleted` | `scope` |
| `ai_invoked` | `capability` (semantic_search/nl_query/project_chat), `accepted`, `latency_ms` |

No query text or task titles are ever sent as properties (PII scrubbing at the SDK boundary).

---

## 21. Acceptance Criteria

1. Global search returns permission-scoped results across tasks, projects, people, and comments.
2. Personal tasks appear in search only for their owner — never for Admins or others.
3. Results are grouped by entity type with per-type counts.
4. Matched terms are highlighted without relying on color alone.
5. Local FTS returns first results in <150ms from the on-device mirror.
6. Search works fully offline against the local cache with a clear partial-results banner.
7. Scope segmented control (All/Tasks/Projects/People/Docs) narrows results correctly.
8. Recent searches persist per device, are private, and can be cleared.
9. Suggested filter chips are context-aware to the originating list.
10. Filters combine as **AND across dimensions, OR within a dimension**.
11. Each active filter renders as a chip and can be removed individually; "clear all" resets.
12. Date-based filters (today/overdue/this week/<7d) evaluate in the user's local time zone and roll at midnight.
13. Sort supports due/scheduled/priority/created/updated/alphabetical/manual with direction.
14. Group supports due/priority/project/assignee/label/status/none with collapsible headers + counts.
15. Sort/group/filter choices persist per list, per user, across sessions and devices.
16. Manual sort persists via fractional `order` without renumber storms.
17. Search operators/DSL parse `is:`, `assignee:`, `project:`, `label:`/`#`, `priority:`, `due:`, `status:`, negation `-`, and quoted phrases (🔜).
18. Every filter-sheet state has an equivalent DSL string and round-trips losslessly.
19. Malformed DSL shows a non-blocking error, still applies valid clauses, and marks the bad token.
20. Saving a view captures scope + filters + sort + group + text into `query_json`.
21. A Saved View re-creates its exact query when reopened.
22. Personal views are private to the owner; shared views are visible to the correct scope.
23. Creating/editing a shared view is gated to Managers+ or the creator.
24. Editing a shared view offers "update for everyone" vs "save as personal copy".
25. Views can be pinned/reordered in the sidebar and opened via deep link/widget/Siri.
26. Shared-view create/update/delete/share is recorded in the audit log.
27. Shared views sync live across devices via realtime `view.*` events.
28. View ownership transfers when the creator leaves the org.
29. Semantic search (🔜) returns permission-filtered results ranked by relevance with citations.
30. NL queries (💡) render the interpreted DSL for confirmation before executing.
31. AI/semantic capabilities degrade gracefully offline, falling back to local FTS.
32. `did_you_mean` fuzzy fallback triggers on zero exact matches.
33. Deleted/again-restricted entities never appear; stale taps show a graceful unavailable state.
34. All mutations use `Idempotency-Key`; retries never duplicate a view.
35. View version conflicts resolve server-authoritative with a clear notice.
36. VoiceOver announces field, scope, result type + context, and section counts.
37. Reduce Motion swaps result/chip animations for cross-fades.
38. iPad landscape shows two-pane results with live preview and a filter inspector rail.
39. Analytics events fire with correct properties and never include query text or titles.
40. Result lists are virtualized; scrolling stays at 60fps with 1k+ results.

---

## 22. Future Roadmap

- **V1 (✅):** global cross-entity search, permission scoping, composable filters (AND/OR),
  sort + group with per-list persistence, Saved Views (personal + shared), recent searches,
  did-you-mean, deep links.
- **V1.1 (🔜):** search operators / DSL with autocomplete, semantic (vector) search + RAG
  project chat with citations, voice search, view subscriptions + threshold alerts.
- **V2 (🟣):** AI smart-view suggestions, presence on shared views, org-default views managed by
  Admins, cross-workspace search for multi-org users.
- **Future (💡):** natural-language query bar everywhere ("what's due for me tomorrow"),
  personalized ranking that learns from open behavior.
- **Experimental (🧪):** proactive "you might be looking for…" surfacing; agentic search that
  performs the follow-up action (reschedule the whole overdue slice) after confirmation.
- **AI track:** deep integration with [19 · AI Copilot](./19-ai-assistant-copilot.md) and
  [39 · Semantic Search Infra](./39-search-indexing-semantic.md).
- **Enterprise track:** DLP-aware search, per-view retention, saved-view export/import across orgs.
