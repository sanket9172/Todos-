# 00 · Master PRD Template & Authoring Standard

> This file is the **authoring contract** for every Numil module document. Every module
> MUST follow this structure and depth. It exists so a cross-functional team (PM, UX,
> iOS/Android, backend, QA, DevOps, tech writers) can build the module **without asking
> further questions**.

## Design north star (applies to every module)

Numil is a modern productivity platform blending the best of Todoist, Things 3, TickTick,
Microsoft To Do, Apple Reminders, Notion, ClickUp, Linear, Jira, Monday.com, Asana,
Trello, Motion, and Sunsama — while staying **extremely simple, beautiful, fast, native
iOS, offline-first, and organization-ready.**

The three non-negotiables, in priority order:

1. **Simple** — the primary action of any screen is obvious and reachable in one thumb tap.
   Advanced power is *progressive* (revealed on demand, never in the user's face).
2. **Fast & native** — 60fps, iOS-native patterns (sheets, swipe, context menus, haptics),
   instant optimistic UI, offline by default.
3. **Deep when needed** — enterprise power (automation, AI, RBAC, audit) lives one layer
   down, discoverable but never cluttering the simple path.

> **UI simplicity rule:** if a screen shows more than **one** primary action and **five**
> secondary affordances at rest, it must be redesigned or split. Complexity hides behind
> "…" menus, long-press, disclosure rows, and bottom sheets.

## Quality bar (per module doc)

- **Length:** 2,500–5,000 words of *substantive* content (no filler).
- **Diagrams:** include where they clarify — ASCII wireframes, user journeys, sequence
  diagrams (mermaid or ASCII), and state diagrams.
- **Self-contained but DRY:** each module contains all 22 sections. For cross-cutting
  concerns (animation, accessibility, analytics, offline, security, API, RBAC) the module
  states its **module-specific deltas** and links the canonical spec in `shared/`.
- **Tables over prose** for matrices (permissions, states, events, endpoints).
- **Status tags:** `✅ v1` · `🔜 v1.1` · `🟣 v2` · `💡 Future` · `🧪 Experimental`.
- **iOS-first:** call out Dynamic Island, safe areas, large titles, iPad/landscape.

## The 22 required sections (in order)

Every module doc uses exactly these H2 headings:

```text
1.  Purpose
2.  Navigation
3.  Complete UI Layout
4.  Complete Component Breakdown
5.  Modern Features (with per-feature: Purpose/Workflow/UI/Permissions/Offline/API/DB/Notify/AC)
6.  Smart AI Features
7.  Productivity Features
8.  Enterprise Features
9.  Collaboration Features
10. Offline Architecture (deltas + link to shared/offline-sync-engine)
11. Security (deltas + link to shared/security-baseline)
12. Notification System (deltas + link to 12-notifications-alerts)
13. Accessibility (deltas + link to shared/accessibility-spec)
14. Animations (deltas + link to shared/animation-spec)
15. Performance
16. Database Design (entities, relationships, indexes, constraints, soft-delete, history)
17. API Design (REST + realtime/WebSocket, request/response, errors, pagination, idempotency)
18. Edge Cases
19. User States
20. Analytics Events (link to shared/analytics-taxonomy for schema)
21. Acceptance Criteria (20–50 items)
22. Future Roadmap (V1 / V1.1 / V2 / Future / Experimental / AI / Enterprise)
```

## Section authoring notes

### 1. Purpose
Why the module exists, the user problem, user goals, business goals, and the KPIs it moves.

### 2. Navigation
Entry points, route paths (`src/app/...`), deep links (`numil://...`), navigation
hierarchy, breadcrumbs, transitions, and modal-vs-push decisions.

### 3. Complete UI Layout
Describe top → middle → bottom: header/large title, Dynamic Island spacing, safe areas,
cards, lists, FAB, bottom sheets, floating toolbar, search, sticky headers, empty space,
tab-bar behavior, landscape, and iPad adaptation. Include at least one ASCII wireframe.

### 4. Complete Component Breakdown
Enumerate every component on every screen (buttons, cards, badges, indicators, progress,
loaders, charts, avatar stacks, status chips, menus, context menus, swipe actions,
toolbars, sheets, dialogs, alerts, snackbars, banners, toasts, popovers, segmented
controls, carousels, accordions, inline editors, rich text, attachments, media preview,
emoji picker, reaction bar, voice recorder, AI buttons). Reference shared component names
from `03-design-system-ui.md`.

### 5–9. Feature sections
Each notable feature gets: **Purpose · Workflow · UI · Permissions · Offline · API · DB ·
Notification · Acceptance Criteria.** Reference the inspiring product (e.g., "like Linear's
command-K" ) but describe Numil's concrete behavior.

### 10–14. Cross-cutting
State only the **module-specific deltas** and link the canonical `shared/` spec. Do not
re-document the whole subsystem.

### 15. Performance
Virtualization (FlashList), pagination, lazy loading, image optimization, memoization,
background processing, battery/memory/network budgets, startup + bundle impact.

### 16. Database Design
Entities, relationships, indexes, constraints, FKs, soft-delete, audit/history tables,
search tables. Include an ER snippet. Align with `17-data-model-api.md`.

### 17. API Design
REST endpoints (+ optional GraphQL), request/response bodies, error codes, permissions,
pagination, filtering, sorting, realtime/WebSocket events, rate limits, idempotency keys.
Follow `shared/api-conventions.md`.

### 18. Edge Cases
Offline, deleted user/project, tz changes, DST, duplicates, permission lost, expired
invite, notification failure, storage full, API failure, conflicts, session expiry,
multi-device, account deletion, archived project, recurrence failure, invalid attachment.

### 19. User States
First-time, returning, power user, guest, manager, admin, owner, offline, poor network,
tablet, landscape, dark mode, large text, accessibility.

### 20. Analytics Events
Table of `event_name`, trigger, properties. Use the schema in
`shared/analytics-taxonomy.md`.

### 21. Acceptance Criteria
20–50 checkable, testable statements (Given/When/Then friendly).

### 22. Future Roadmap
Bucket features into V1 / V1.1 / V2 / Future / Experimental / AI / Enterprise.

## Reusable diagram conventions

- **Wireframes:** ASCII inside fenced blocks. Use `[ ]` buttons, `( )` toggles, `▸` chevrons.
- **Sequence/state diagrams:** prefer `mermaid` fenced blocks (` ```mermaid `), ASCII fallback.
- **Permission matrices:** markdown tables with roles as columns (Owner/Admin/Manager/Member/Guest).

## Canonical shared specs (link, don't duplicate)

| Concern | Canonical doc |
|---------|---------------|
| Design tokens & components | [03-design-system-ui.md](./03-design-system-ui.md) |
| Animation & motion | [shared/animation-spec.md](./shared/animation-spec.md) |
| Accessibility | [shared/accessibility-spec.md](./shared/accessibility-spec.md) |
| Analytics taxonomy | [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md) |
| Offline sync engine | [shared/offline-sync-engine.md](./shared/offline-sync-engine.md) |
| Security baseline | [shared/security-baseline.md](./shared/security-baseline.md) |
| API & realtime conventions | [shared/api-conventions.md](./shared/api-conventions.md) |
| RBAC/ABAC permissions | [shared/rbac-permissions.md](./shared/rbac-permissions.md) |
| Data model | [17-data-model-api.md](./17-data-model-api.md) |

## Definition of Done for a module doc

- [ ] All 22 sections present and non-trivial.
- [ ] ≥1 ASCII wireframe, ≥1 sequence or state diagram.
- [ ] Permission matrix included.
- [ ] ER snippet + API contract included.
- [ ] 20–50 acceptance criteria.
- [ ] Cross-cutting sections link the shared spec and list deltas only.
- [ ] Reflects the "simple by default, deep on demand" north star.
