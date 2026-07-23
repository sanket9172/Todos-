# 04 · Navigation & Sidebar

> Follows the [Master PRD Template](./00-prd-template.md). Defines how people move through
> Numil: the bottom tab bar, sidebar/drawer, command palette, deep links, breadcrumbs, and
> iPad split view — the connective tissue for all 43 modules.

### Implementation delta for Todos v2 (free offline)

This module is the **enterprise** navigation vision (orgs, command palette, iPad split, RBAC-aware
collections). The **shipping Todos app** (Expo SDK 54, Expo Go, AsyncStorage) implements a
**slim subset** next:

- Keep 4 tabs (Home / Tasks / Calendar / More).
- Add a left **drawer** for quick views, projects, labels, and Settings.
- Fix task-editor **keyboard / scroll** UX before adding more chrome.

**Discussion source of truth for that next build:**  
[44-todos-v2-sidebar-mobile-ux-advanced.md](./44-todos-v2-sidebar-mobile-ux-advanced.md)

Do not treat org switcher, ⌘K palette, or multi-workspace as required for Todos Phases A–B.

---

## 1. Purpose

Navigation is the app's skeleton. It must let a one-handed user reach any primary
destination in a single thumb tap, surface *all* their collections (orgs, projects, views,
labels) without clutter, and route notification taps to the exact task in the exact
workspace — online or offline.

**User problem.** Personal apps (Things, Todoist) have shallow, flat navigation that
collapses once you add teams; heavy PM tools (Jira, ClickUp) bury everything in nested menus
that are miserable on a phone. Numil needs both: **few primary destinations** (tabs) and
**many collections** (sidebar), without the phone feeling like a filing cabinet.

**User goals**
- Get to Home / My Tasks / Calendar / Inbox instantly (thumb-reachable tabs).
- Switch org/workspace and open any project/view/label from one place (sidebar).
- Jump anywhere by typing (command palette) — the Linear ⌘K muscle memory.
- Land on the right task from a push notification, widget, or Siri.

**Business goals.** Navigation drives feature discovery (do users find Reports, AI,
Automation?), reduces "where is X?" support load, and makes the org's projects feel
organized enough to add more seats.

**KPIs:** `sidebar_opened`, `quick_view_opened`, command-palette usage, deep-link
success rate, and tab dwell distribution (are secondary features discoverable?).

---

## 2. Navigation

**Model:** a **hybrid tab + drawer**, the most iOS-friendly way to combine "primary
destinations" (tabs) and "lots of collections" (sidebar).

**Where it lives (real repo references)**
- Root layout: `src/app/_layout.tsx` (theme + providers + shell).
- Tabs: `src/components/app-tabs.tsx` (native tabs via `expo-router/unstable-native-tabs`;
  currently Home + Explore, to be expanded to the five tabs below).
- Sidebar: a Drawer wrapping the tabs (proposed), opened by left-edge pan or avatar tap.

**Entry points**
- App launch → last tab (default Home).
- Left-edge swipe or header avatar → sidebar.
- Pull-down on Home (⌘K on iPad) → command palette.
- Deep link / push / widget / Siri → target route (workspace restored first).

**Route hierarchy**
```text
Root (_layout.tsx)
└─ Drawer (Sidebar: workspaces · quick views · projects · labels · saved views · footer)
   └─ Native Tabs (app-tabs.tsx)
      ├─ Home      → stack → task/[id], project/[id]
      ├─ My Tasks  → stack → task/[id]
      ├─ Calendar  → stack → day, task/[id]
      ├─ Inbox     → stack → task/[id]
      └─ More      → stack → search, reports, members, settings, projects
```

**Breadcrumbs:** `Workspace ▸ Project (or "My Tasks") ▸ Task`. The project chip is tappable.
**Transitions:** drawer edge-pan 1:1 with `spring.gentle` settle + 0.9× parallax; tab switch
is instant (state preserved per tab); push is iOS slide; sheets `spring.gentle`
([shared/animation-spec.md](./shared/animation-spec.md)).

---

## 3. Complete UI Layout

```text
┌──────────────────────────────┐        ┌───────────────────────────────┐
│  ◐ Acme Inc.            ⌄     │        │  ☰   My Tasks           ⚙  ＋  │  ← screen w/ tabs
│  Priya · Manager             │        │  Large title, DI-safe          │
│  ＋ Create or join org        │        ├───────────────────────────────┤
├──────────────────────────────┤        │  ◯ Draft launch email  5:00 PM │
│  QUICK VIEWS                  │        │  ◯ Review deck         ⏱ 45m   │
│  ☀ Today               4     │        │  …                             │
│  📅 Upcoming                  │        │                               │
│  ⚠ Overdue             1     │        │                               │
│  👤 Assigned to me            │        │                               │
│  ⚑ Flagged                    │        │                               │
│  ✓ Completed                  │        │                               │
├──────────────────────────────┤        │                               │
│  PROJECTS              ＋     │        │                               │
│  • Marketing Q3        3     │        │                               │
│  • Website Redesign          │        │                               │
│  ▸ Engineering (folder)      │        │                               │
├──────────────────────────────┤        │                               │
│  LABELS   #launch #bug        │        │                               │
│  SAVED VIEWS  ★ High this wk  │        │                               │
├──────────────────────────────┤        ├───────────────────────────────┤
│  🔍 Search  📊 Reports  ⚙    │        │ [🏠][✓][📅][🔔•][⋯]           │
└──────────────────────────────┘        └───────────────────────────────┘
     Sidebar (drawer)                          Screen + native tab bar
```

- **Sidebar top:** workspace switcher (org logo + name + `⌄`), current user avatar/name/role,
  "＋ Create or join organization." Respects top safe area + Dynamic Island.
- **Sidebar body:** Quick Views → Projects (favorites pinned, collapsible folders, badges) →
  Labels → Saved Views. Scrolls; sections are collapsible disclosure groups.
- **Sidebar footer:** Search, Reports, Members, Settings, Help (utility row).
- **Tab bar:** glass (`expo-glass-effect`), five items, badges on Inbox; sits above the
  home-indicator safe area (`BottomTabInset` = 50 iOS, per `src/constants/theme.ts`).
- **Header:** left = avatar (opens sidebar) or back chevron; center = large title (collapses
  to inline on scroll); right = context actions (filter/sort, `＋`, `•••`).
- **iPad / landscape:** sidebar is **persistent** (no drawer); a **split view** shows
  sidebar · list · detail. Portrait iPad collapses to sidebar-overlay + single pane.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Tab bar | `NativeTabs` (`expo-router/unstable-native-tabs`), `TabItem`, `TabBadge` (Inbox count) |
| Drawer shell | `Drawer`, `DrawerScrim`, `EdgePanGesture` (`react-native-gesture-handler`) |
| Workspace switcher | `WorkspaceHeader`, `OrgAvatar`, `OrgSwitcherSheet`, `CreateJoinOrgRow`, `RoleBadge` |
| Quick views | `QuickViewRow` (icon + label + count badge), `QuickViewList` |
| Projects | `ProjectRow` (color dot + name + badge), `ProjectFolder` (collapsible), `FavoriteStar`, `AddProjectButton` (gated) |
| Labels | `LabelChipRow`, `ManageLabelsRow` |
| Saved views | `SavedViewRow` (★), `SavedViewList` |
| Footer | `UtilityRow` (Search/Reports/Members/Settings/Help) via `expo-symbols` icons |
| Command palette | `CommandPalette` (sheet), `CommandSearchField`, `CommandResultRow`, `RecentList`, `FuzzyMatcher` |
| Header | `GlassNavBar`, `AvatarButton`, `BackButton`, `LargeTitle`, `HeaderActions`, `Breadcrumb` |
| Feedback | `Skeleton` (sidebar loading), `OfflineBanner`, `Toast` |

SF Symbols (via `expo-symbols`): `house`, `checklist`, `calendar`, `bell`,
`ellipsis.circle`, `magnifyingglass`, `chart.bar`, `person.2`, `gearshape`,
`questionmark.circle`, `sun.max`, `exclamationmark.triangle`, `flag`, `checkmark.circle`.
Primitives defined in [03-design-system-ui.md](./03-design-system-ui.md).

---

## 5. Modern Features

Each: Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · Acceptance.

### 5.1 Bottom tab bar (primary destinations) ✅ v1
- **Purpose:** thumb-reachable access to the five most-used surfaces.
- **Workflow:** tap a tab → switch instantly; per-tab navigation state is preserved; tapping
  the active tab scrolls to top (iOS convention).
- **UI:** glass tab bar, SF Symbols, Inbox badge.

| Tab | SF Symbol | Opens | Purpose |
|-----|-----------|-------|---------|
| Home | `house` | Dashboard | Today's agenda + quick add ([07](./07-home-dashboard.md)) |
| My Tasks | `checklist` | Personal list | Own tasks across projects ([08](./08-my-tasks.md)) |
| Calendar | `calendar` | Calendar | Day/week/month ([11](./11-calendar-scheduling.md)) |
| Inbox | `bell` (badge) | Notifications | Alerts/assignments/mentions ([12](./12-notifications-alerts.md)) |
| More | `ellipsis.circle` | More menu | Search, Reports, Projects, Settings |

- **Permissions:** all roles see all tabs; content inside is scoped.
- **Offline:** tabs work from cache; badges may be stale until sync.
- **API/DB:** none (badge counts derived from local store). **Notify:** Inbox badge reflects
  unread count. **Acceptance:** 3–5 tabs on iOS; overflow lives under More.

### 5.2 Sidebar / drawer (collections hub) ✅ v1
- **Purpose:** one place for workspace context + all collections.
- **Workflow:** left-edge pan or avatar tap opens; sections scroll; disclosure groups
  collapse; badges show overdue/unread.
- **UI:** the layout in §3; sections A–F below.
- **Permissions:** see the role matrix in §8 (Enterprise Features). Members see only
  projects they belong to; guests see only shared projects.
- **Offline:** fully from cache. **API:** `GET /me` (memberships), `GET /projects`.
- **DB:** `memberships`, `projects`, `project_members`, `labels`, saved `views`.
- **Notify:** none. **Acceptance:** edge-swipe and avatar both open; badges accurate on sync.

**Sidebar sections**
- **A — Workspace switcher:** current org + logo; tap → orgs list, switch instantly; "＋
  Create or join organization"; shows the user's avatar/name/role for this org.
- **B — Quick views (smart lists):** Today (`sun.max`), Upcoming (`calendar`), Overdue
  (`exclamationmark.triangle`, badge), Assigned to me (`person`), Flagged/Priority (`flag`),
  Completed (`checkmark.circle`, last 30 days).
- **C — Projects:** header + `＋` (permission-gated); color dot + name + overdue/unread
  badge; favorites pinned; collapsible folders (e.g., "Marketing", "Engineering").
- **D — Labels/Tags:** tap a label → all tasks with it; "Manage labels."
- **E — Saved views:** user/org-defined saved filters ([14](./14-search-filters-views.md)).
- **F — Footer:** Search, Reports (Manager+/self), Members (Admin/Manager), Settings, Help.

### 5.3 Command palette + global capture (Linear ⌘K) 🔜 v1.1
- **Purpose:** jump to anything or run an action by typing — no menu hunting.
- **Workflow:** pull-down on Home (or ⌘K on iPad) → fuzzy search across projects, tasks,
  views, people, and **commands** ("New task", "Go to Today", "Switch workspace", "Ask AI");
  arrow/return to execute; recents shown first.
- **UI:** `CommandPalette` sheet with a single search field + grouped results + hints.
- **Permissions:** results are permission-scoped (never surfaces inaccessible items).
- **Offline:** searches the local index; AI commands queue when offline.
- **API:** `POST /search` (typeahead), `POST /ai/*` for AI commands. **DB:** local search
  index + `views`. **Notify:** none.
- **Acceptance:** opens < 100ms; fuzzy-matches; results scoped; Enter runs the top command.

### 5.4 Workspace / org switcher ✅ v1
- **Purpose:** move between multiple orgs a user belongs to.
- **Workflow:** tap workspace header → sheet of orgs → select → context switches (no app
  restart); role + projects update.
- **API:** `GET /me`. **DB:** `memberships(org_id, user_id, org_role)`.
- **Notify:** none. **Acceptance:** switching never mixes contexts; emits `workspace_switched`.

### 5.5 Breadcrumbs & back behavior ✅ v1
- `Workspace ▸ Project ▸ Task`; project chip tappable; iOS interactive back-swipe; deep-linked
  screens synthesize a sensible back stack.

---

## 6. Smart AI Features

AI surfaces inside navigation (full spec in [19-ai-assistant-copilot.md](./19-ai-assistant-copilot.md)):
- **AI in the command palette:** "Ask Numil AI" and natural-language commands ("show
  overdue in Marketing," "plan my day") resolve to navigation + proposals.
- **Smart destinations:** the palette can rank recent/likely destinations using usage
  signals (on-device, privacy-safe).
- **NL quick capture** from the palette creates a structured task (proposal-first).
- Guardrails: AI navigation suggestions never expose out-of-scope items; AI commands are
  proposal-first (Accept/Edit/Undo).

---

## 7. Productivity Features

- **Keyboard shortcuts (iPad/external keyboard):** ⌘K palette, ⌘1–⌘5 tab switch, ⌘N new
  task, ⌘F search, ⌘, settings.
- **Swipe-from-edge** to open the sidebar; **pull-down** for the palette.
- **Favorites & folders** keep frequent projects one tap away.
- **Jump-to-Today** and **scroll-to-top** on active-tab re-tap.
- **Recents** in the palette for fast re-entry to the last few tasks/projects.

---

## 8. Enterprise Features

Navigation is **permission-gated** — items a role can't use are hidden (not just disabled).
Roles per [shared/rbac-permissions.md](./shared/rbac-permissions.md); enforced server-side.

| Navigation capability | Owner | Admin | Manager | Member | Guest |
|-----------------------|:-----:|:-----:|:-------:|:------:|:-----:|
| Workspace switcher / quick views | ✅ | ✅ | ✅ | ✅ | ✅ |
| See all org projects | ✅ | ✅ | ✅ | member-of | shared only |
| Create project (sidebar ＋) | ✅ | ✅ | ✅ | ⚙️* | ❌ |
| Reports (footer) | ✅ | ✅ | ✅ | self only | ❌ |
| Members (footer) | ✅ | ✅ | view | ❌ | ❌ |
| Org Settings (footer) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Command-palette admin actions | ✅ | ✅ | scoped | ❌ | ❌ |
| See another user's personal tasks | ❌ | ❌ | ❌ | ❌ | ❌ |

`⚙️*` gated by org setting "Members can create projects" (default off).

- **Permission-gated navigation:** items a role can't use are hidden (not just disabled) —
  e.g., Members don't see org Settings; guests see only shared projects.
- **Org policy** "Members can create projects" toggles the sidebar `＋` on Projects.
- **Custom sidebar sections / pinned org views** (🟣 v2) for admins to curate.
- **Audit:** workspace switches and sensitive navigations to admin surfaces are logged
  ([29-activity-feed-audit-logs.md](./29-activity-feed-audit-logs.md)).
- **SSO-scoped orgs:** switcher only lists orgs the identity provider authorizes.

---

## 9. Collaboration Features

- **Shared project badges** reflect team activity (unread comments/mentions, overdue).
- **Presence hint** on a project row (🟣 v2): small avatar stack of members currently active.
- **Deep-linked mentions** route straight to the comment on a task in the right project.
- **Guest wayfinding:** guests see a simplified sidebar (only shared projects + their tasks).

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- The entire sidebar + tabs render from the **local mirror**; navigation never blocks on the
  network.
- **Badge counts** (overdue/unread) are computed locally and may briefly lag server truth
  until the next delta pull; they never show a spinner.
- Command-palette search uses the **local index**; AI-backed commands queue offline with a
  clear "will run when online" affordance.
- Workspace switch works offline for orgs already cached; uncached orgs prompt to reconnect.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Navigation shows only what the user is **authorized** to see; server re-checks scope on
  every fetch behind a nav action (client hiding is UX, not security).
- Deep links are **validated server-side** on open; a link to an inaccessible resource
  yields `403/gone` and a graceful screen — never a data leak.
- Workspace switch re-scopes all subsequent requests with `X-Org-Id`; stale tokens/claims
  refresh so a demoted user immediately loses hidden nav items.

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- **Deep-link routing** is owned here: taps resolve `numil://task/{id}`,
  `numil://project/{id}`, `numil://inbox`, restoring the correct workspace *before* pushing
  the route.
- The **Inbox tab badge** mirrors unread notification count; clearing happens on view.
- Notification action buttons (Complete/Snooze/Reply/Open) route through the same navigator.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Tabs expose role "tab", selected state, and label ("My Tasks, tab, 2 of 5").
- The drawer is a focus trap when open; VoiceOver reads sections in visual order; a
  "close sidebar" action is always reachable.
- Command palette announces result count and is fully operable via keyboard/Switch Control.
- Edge-swipe has a non-gesture alternative (avatar button) for motor accessibility.
- Badges have text alternatives ("Overdue, 1 task").

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- **Drawer:** edge-pan tracks the finger 1:1; `spring.gentle` settle; content parallax 0.9×;
  scrim opacity 0→0.4.
- **Tab switch:** instant cross-fade of content; no slide (state preserved per tab).
- **Command palette:** sheet `spring.gentle`; results fade/stagger in; Reduce Motion → plain
  cross-fade.
- **Badge change:** count pops with `spring.snappy` (skipped under Reduce Motion).

---

## 15. Performance

- Sidebar lists (projects/labels/views) use FlashList with memoized rows; badge counts
  precomputed from the local store, not per-render queries.
- Command-palette search is debounced (120ms) against the local index; results virtualized.
- Tab content is lazy-mounted on first visit and kept alive to preserve scroll/state.
- Drawer gesture + animation run as Reanimated worklets on the UI thread (60fps; 120fps
  ProMotion aware).
- Deep-link cold open target < 400ms to first meaningful paint (from cache) after workspace
  restore.

---

## 16. Database Design

Navigation reads these entities (canonical model in [17-data-model-api.md](./17-data-model-api.md)):

```text
memberships(id, org_id→orgs, user_id→users, org_role, created_at)   UNIQUE(org_id,user_id)
projects(id, org_id→orgs, name, color, visibility, folder_id?, favorite_order?,
         archived_at?, created_at, deleted_at?)
project_folders(id, org_id→orgs, name, order)
project_members(project_id→projects, user_id→users, project_role)   PK(project_id,user_id)
labels(id, org_id→orgs, name, color)
views(id, org_id→orgs, owner_id?→users, scope, name, filter_json, sort_json, is_pinned)
nav_prefs(user_id→users, org_id→orgs, favorite_project_ids[], collapsed_folder_ids[],
          last_tab, updated_at)     -- per-user sidebar state
```

**Indexes:** `projects(org_id, archived_at)`, `project_members(user_id)`,
`views(org_id, owner_id)`, `memberships(user_id)`. **Constraints:** guests resolve only via
an explicit share list; archived projects render read-only. **Soft delete** via `deleted_at`.
Badge counts derive from `tasks(assignee_id, due_at)` + `notifications(user_id, read_at)`.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Current user + memberships (org list for switcher) |
| GET | `/projects?filter[archived]=false&expand=members` | Sidebar projects |
| GET | `/projects/:id/badges` | Overdue/unread counts for a project |
| GET | `/labels` · `/views?scope=me,org` | Labels + saved views |
| GET | `/nav/prefs` · PUT `/nav/prefs` | Favorites, collapsed folders, last tab |
| POST | `/search?type=command` | Command-palette typeahead |
| GET | `/notifications/unread-count` | Inbox tab badge |

**Sample workspace list request/response**
```http
GET /v1/me?expand=memberships
Authorization: Bearer <token>
```
```json
{ "data": { "id": "user_1", "name": "Priya",
  "memberships": [
    { "orgId": "org_123", "orgName": "Acme Inc.", "role": "manager", "logoUrl": "…" },
    { "orgId": "org_777", "orgName": "Side Project", "role": "owner" }
  ] },
  "meta": { "requestId": "req_01H..." } }
```

**Realtime:** `notification.created` on `user:{id}` bumps the Inbox badge;
`project.updated` refreshes project badges. **Errors:** `403 forbidden` for out-of-scope
deep links; `409 gone` for deleted targets.

---

## 18. Edge Cases

- **No projects yet:** Projects section shows an empty hint + "Create your first project".
- **Single org:** switcher still shown but collapsed (no chooser needed).
- **Removed from org/project mid-session:** the item disappears on next sync; open screen
  shows a permission-lost notice.
- **Deep link to archived/deleted/inaccessible target:** graceful read-only or "not
  available" screen; never a leak.
- **Very long project lists:** virtualized; favorites + folders keep it navigable; search
  within sidebar (🔜).
- **Offline workspace switch to an uncached org:** prompt to reconnect.
- **Badge overflow:** counts cap at "99+".
- **RTL locale:** drawer opens from the right; chevrons and layout mirror.
- **iPad rotation:** split view ↔ single pane transitions preserve selection.
- **Notification arrives while in a different workspace:** tap switches workspace first.

---

## 19. User States

- **First-time:** coach-mark on the avatar ("tap for your workspaces") + the `＋`; Projects
  empty state.
- **Returning/power:** favorites + folders curated; command palette + shortcuts on iPad.
- **Guest:** simplified sidebar (shared projects + their tasks only); no Members/Settings.
- **Member:** sees own-membership projects; no org Settings; project `＋` per org policy.
- **Manager:** Reports + create projects; sees team projects.
- **Admin/Owner:** Members + org Settings in the footer; audit-relevant nav logged.
- **Offline/poor network:** cache-driven; stale badges; queued AI commands.
- **Tablet/landscape:** persistent sidebar + split view.
- **Dark mode / large text / a11y:** token-driven; AX5 reflow verified; RTL mirrored.

```text
[App launch] → restore last tab (Home)
     ├─ edge-swipe / avatar → [Sidebar open] → pick project/view → [Screen]
     ├─ pull-down / ⌘K → [Command palette] → run command → [Screen or action]
     └─ push/widget/Siri → restore workspace → deep-link route → [Task/Project]
```

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md).

| event | key properties |
|-------|----------------|
| `sidebar_opened` | `method` (swipe/tap) |
| `workspace_switched` | `from_org`, `to_org` |
| `quick_view_opened` | `view` (today/upcoming/overdue/assigned/flagged/completed) |
| `project_opened` | `via` (sidebar/palette/deeplink), `is_favorite` |
| `command_palette_opened` | `method` (pulldown/shortcut) |
| `command_executed` | `command`, `is_ai` |
| `tab_selected` | `tab`, `re_tap_scroll_top` |
| `deep_link_opened` | `target_type`, `success` |
| `notification_badge_cleared` | `count` |

---

## 21. Acceptance Criteria

1. Bottom tabs show Home, My Tasks, Calendar, Inbox, More on iOS.
2. Tab bar renders via `expo-router/unstable-native-tabs`.
3. Tapping a tab preserves that tab's navigation + scroll state.
4. Re-tapping the active tab scrolls its content to top.
5. Inbox tab shows an unread badge; clears when viewed; caps at "99+".
6. Left-edge swipe and avatar tap both open the sidebar.
7. The drawer edge-pan tracks the finger 1:1 and settles with a spring.
8. Workspace switcher lists all orgs the user belongs to with role.
9. Switching workspace re-scopes context without an app restart.
10. Quick views return correct sets (Today/Upcoming/Overdue/Assigned/Flagged/Completed).
11. Overdue quick view shows an accurate count badge.
12. Projects list shows color dot, name, and overdue/unread badge.
13. Favorites pin to the top; folders collapse/expand and persist.
14. Project `＋` is shown only when the role/org policy allows creation.
15. Members see only projects they belong to; guests only shared projects.
16. Labels open a filtered list; "Manage labels" opens the editor.
17. Saved views open the correct filtered list.
18. Footer shows Search/Reports/Members/Settings/Help, permission-gated.
19. Command palette opens via pull-down (and ⌘K on iPad) in < 100ms.
20. Palette fuzzy-matches projects, tasks, views, people, and commands.
21. Palette results are permission-scoped (no inaccessible items).
22. Enter executes the top command; recents appear first.
23. Deep links (`numil://task|project|inbox`) route correctly, restoring workspace.
24. Deep link to an inaccessible/deleted target shows a graceful state (no leak).
25. Breadcrumb shows Workspace ▸ Project ▸ Task; project chip is tappable.
26. Notification taps route to the right task in the right workspace.
27. Permission-gated items are hidden (not just disabled) for disallowed roles.
28. iPad landscape shows a persistent sidebar + split view (sidebar · list · detail).
29. Portrait iPad collapses to a single pane with sidebar overlay.
30. Sidebar, tabs, and badges work offline from cache.
31. RTL locales mirror the drawer and layout correctly.
32. VoiceOver reads tabs/sidebar in visual order; drawer traps focus when open.
33. Reduce Motion disables parallax/badge-pop; uses cross-fades.
34. Analytics events fire with correct properties (incl. offline-buffered).
35. iPad keyboard shortcuts (⌘K, ⌘1–5, ⌘N, ⌘F) work.

---

## 22. Future Roadmap

- **V1 (✅):** five bottom tabs, sidebar/drawer (workspace switcher, quick views, projects,
  labels, saved views, footer), breadcrumbs, deep links, permission-gated items, iPad split
  view basics.
- **V1.1 (🔜):** command palette + global capture, keyboard shortcuts, in-sidebar search,
  project favorites/folders polish, presence hints.
- **V2 (🟣):** customizable sidebar sections + pinned org views, drag-to-reorder projects,
  per-workspace theming, richer iPad multi-pane layouts.
- **Future (💡):** multi-window on iPad, cross-org unified inbox, spotlight/Handoff
  continuity, home-screen quick-action shortcuts.
- **Experimental (🧪):** AI-predicted "next destination" surfaced in the palette.
- **AI track:** natural-language navigation + capture from the palette (module 19).
- **Enterprise track:** admin-curated navigation, SSO-scoped org visibility, nav audit.
