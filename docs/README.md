# Numil / Todos — Product Requirements (iOS / React Native)

Numil is a mobile-first productivity platform for organizations. It blends the best of
**Todoist, Things 3, TickTick, Microsoft To Do, Apple Reminders, Notion, ClickUp, Linear,
Jira, Monday.com, Asana, Trello, Motion, and Sunsama** — while staying **extremely simple,
beautiful, fast, native iOS, offline-first, and organization-ready.**

**Shipping app name:** **Todos** (Expo Go, free offline).  
**Current runtime:** **Expo SDK 54** + React Native 0.81 — so App Store Expo Go works.  
Modules 01–43 describe the full **enterprise** vision; the **next free build** is guided by module **44**.

> This `docs/` folder is a full **enterprise Product Requirements Document (PRD)**, plus a
> discussion brief for the next Todos offline build. A cross-functional team can build from
> these specs; for the free Expo Go track, start with [44](./44-todos-v2-sidebar-mobile-ux-advanced.md).

---

## Design north star

1. **Simple** — one obvious primary action per screen, reachable by thumb. Power is
   *progressive*: hidden behind `…` menus, long-press, disclosure rows, and sheets.
2. **Fast & native** — 60fps, iOS patterns (sheets, swipe, context menus, haptics),
   optimistic UI, offline by default.
3. **Deep on demand** — enterprise/AI power (automation, RBAC, audit, copilot) lives one
   layer down: discoverable, never cluttering the simple path.

See the authoring standard: [00-prd-template.md](./00-prd-template.md).

---

## How to read a module doc

Every module follows the same **22-section** structure (Purpose → Navigation → UI Layout →
Components → Modern/AI/Productivity/Enterprise/Collaboration features → Offline → Security →
Notifications → Accessibility → Animations → Performance → Database → API → Edge cases →
User states → Analytics → Acceptance criteria → Roadmap).

**Gold-standard exemplars to model everything on:**
- [10 · Task Detail](./10-task-detail.md)
- [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md)

---

## Shared specs (cross-cutting — modules link these, not duplicate)

| Concern | Doc |
|---------|-----|
| Design system, tokens, components | [03-design-system-ui.md](./03-design-system-ui.md) |
| Animation & motion | [shared/animation-spec.md](./shared/animation-spec.md) |
| Accessibility | [shared/accessibility-spec.md](./shared/accessibility-spec.md) |
| Analytics taxonomy | [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md) |
| Offline sync engine | [shared/offline-sync-engine.md](./shared/offline-sync-engine.md) |
| Security baseline | [shared/security-baseline.md](./shared/security-baseline.md) |
| API & realtime conventions | [shared/api-conventions.md](./shared/api-conventions.md) |
| RBAC / ABAC permissions | [shared/rbac-permissions.md](./shared/rbac-permissions.md) |

---

## Module index

### Foundation & platform
| # | Module | Doc |
|---|--------|-----|
| 00 | PRD Template & Authoring Standard | [00-prd-template.md](./00-prd-template.md) |
| 01 | Product Overview & Vision | [01-product-overview.md](./01-product-overview.md) |
| 02 | Architecture & Tech Stack | [02-architecture-tech-stack.md](./02-architecture-tech-stack.md) |
| 03 | Design System & UI | [03-design-system-ui.md](./03-design-system-ui.md) |
| 17 | Data Model & API | [17-data-model-api.md](./17-data-model-api.md) |
| 18 | iOS Testing & Release | [18-testing-ios-release.md](./18-testing-ios-release.md) |

### Core app
| # | Module | Doc |
|---|--------|-----|
| 04 | Navigation & Sidebar | [04-navigation-sidebar.md](./04-navigation-sidebar.md) |
| 05 | Authentication & Login | [05-authentication-login.md](./05-authentication-login.md) |
| 06 | Onboarding & Workspace Setup | [06-onboarding.md](./06-onboarding.md) |
| 07 | Home Dashboard | [07-home-dashboard.md](./07-home-dashboard.md) |
| 08 | My Tasks (Individual) | [08-my-tasks.md](./08-my-tasks.md) |
| 09 | Team Tasks & Projects | [09-team-tasks-projects.md](./09-team-tasks-projects.md) |
| 10 | Task Detail ⭐ | [10-task-detail.md](./10-task-detail.md) |
| 11 | Calendar & Scheduling | [11-calendar-scheduling.md](./11-calendar-scheduling.md) |
| 12 | Notifications & Alerts | [12-notifications-alerts.md](./12-notifications-alerts.md) |
| 13 | Organization, Members & Roles | [13-organization-members-roles.md](./13-organization-members-roles.md) |
| 14 | Search, Filters & Saved Views | [14-search-filters-views.md](./14-search-filters-views.md) |
| 15 | Profile & Settings | [15-profile-settings.md](./15-profile-settings.md) |
| 16 | Reports & Analytics | [16-reports-analytics.md](./16-reports-analytics.md) |

### Next build (Todos free offline — discuss then implement)
| # | Module | Doc |
|---|--------|-----|
| 44 | **Todos v2 — Sidebar, Mobile UX & Advanced Features** (discussion source of truth) | [44-todos-v2-sidebar-mobile-ux-advanced.md](./44-todos-v2-sidebar-mobile-ux-advanced.md) |

Phases in 44: **A** keyboard-safe task editor → **B** left sidebar drawer → **C** labels → **D** recurrence → **E** saved views. Approve in discussion before coding.

### AI & productivity
| # | Module | Doc |
|---|--------|-----|
| 19 | AI Assistant & Copilot ⭐ | [19-ai-assistant-copilot.md](./19-ai-assistant-copilot.md) |
| 20 | Automation & Workflow Rules | [20-automation-workflow-rules.md](./20-automation-workflow-rules.md) |
| 35 | Focus Mode, Pomodoro, Habits & Routines | [35-focus-pomodoro-habits.md](./35-focus-pomodoro-habits.md) |
| 36 | AI Productivity Insights | [36-ai-productivity-insights.md](./36-ai-productivity-insights.md) |

### Work management
| # | Module | Doc |
|---|--------|-----|
| 21 | Time Tracking & Timesheets | [21-time-tracking-timesheets.md](./21-time-tracking-timesheets.md) |
| 22 | Goals, OKRs & Milestones | [22-goals-okrs-milestones.md](./22-goals-okrs-milestones.md) |
| 23 | Sprint Planning & Agile Boards | [23-sprints-agile-boards.md](./23-sprints-agile-boards.md) |
| 24 | Templates Library & Recurring Workflows | [24-templates-recurring-workflows.md](./24-templates-recurring-workflows.md) |

### Content & collaboration
| # | Module | Doc |
|---|--------|-----|
| 25 | Documents & Knowledge Base | [25-documents-knowledge-base.md](./25-documents-knowledge-base.md) |
| 26 | Team Chat & Collaboration Hub | [26-team-chat-collaboration.md](./26-team-chat-collaboration.md) |
| 27 | Whiteboard & Brainstorming | [27-whiteboard-brainstorming.md](./27-whiteboard-brainstorming.md) |
| 28 | File Management | [28-file-management.md](./28-file-management.md) |
| 29 | Activity Feed & Audit Logs | [29-activity-feed-audit-logs.md](./29-activity-feed-audit-logs.md) |

### Administration & platform
| # | Module | Doc |
|---|--------|-----|
| 30 | Workspace Administration | [30-workspace-administration.md](./30-workspace-administration.md) |
| 31 | Billing & Subscription | [31-billing-subscription.md](./31-billing-subscription.md) |
| 40 | Security & Compliance Center | [40-security-compliance-center.md](./40-security-compliance-center.md) |
| 41 | Localization & Multi-language | [41-localization-i18n.md](./41-localization-i18n.md) |
| 42 | Feature Flags & Remote Config | [42-feature-flags-remote-config.md](./42-feature-flags-remote-config.md) |
| 43 | Observability, Errors & Analytics Platform | [43-observability-error-monitoring.md](./43-observability-error-monitoring.md) |

### Integrations, developer & Apple platform
| # | Module | Doc |
|---|--------|-----|
| 32 | Integrations (Calendar, Slack, Teams, GitHub, Jira, Zapier…) | [32-integrations.md](./32-integrations.md) |
| 33 | Widgets, Live Activities & Apple Watch | [33-widgets-live-activities-watch.md](./33-widgets-live-activities-watch.md) |
| 34 | Siri Shortcuts, Voice & Apple Intelligence | [34-siri-voice-apple-intelligence.md](./34-siri-voice-apple-intelligence.md) |
| 37 | Backup, Recovery, Import & Export | [37-backup-import-export.md](./37-backup-import-export.md) |
| 38 | Developer API & Webhooks | [38-developer-api-webhooks.md](./38-developer-api-webhooks.md) |
| 39 | Search Indexing & Semantic Search Infra | [39-search-indexing-semantic.md](./39-search-indexing-semantic.md) |

---

## Roles (used throughout)

| Role | Key powers |
|------|-----------|
| **Owner** | Billing, delete/transfer org, everything Admin can |
| **Admin** | Members, roles, security, all projects & settings |
| **Manager** | Create/manage projects, assign, team reports |
| **Member** | Create/complete tasks, comment, personal tasks |
| **Guest** | Access only explicitly shared projects/tasks |

Full model: [shared/rbac-permissions.md](./shared/rbac-permissions.md).

## Status legend

✅ v1 · 🔜 v1.1 · 🟣 v2 · 💡 Future · 🧪 Experimental

> ⭐ = reference-depth exemplar. Modules are being progressively expanded to the full
> 22-section enterprise depth defined in [00-prd-template.md](./00-prd-template.md).
>
> For the **free Todos app next build**, use [44-todos-v2-sidebar-mobile-ux-advanced.md](./44-todos-v2-sidebar-mobile-ux-advanced.md)
> as the discussion source of truth (sidebar + mobile keyboard UX + phased advanced features).
