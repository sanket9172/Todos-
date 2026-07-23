# Shared · Analytics Event Taxonomy

Canonical analytics contract. Every module's **Section 20** references this file for the
event schema and naming rules, then lists only its module-specific events.

## Goals

- One consistent event schema across product, growth, and data science.
- Privacy-first: never log task titles/descriptions/PII in event properties.
- Enough granularity to compute activation, retention, feature adoption, and funnels.

## Naming convention

- `snake_case`, `object_action` (noun first, past-tense verb): `task_completed`,
  `reminder_fired`, `view_saved`.
- Screens: `screen_viewed` with `screen` property (avoid one event per screen).
- Never encode dynamic values in the name; use properties.

## Global properties (attached to every event)

| Property | Type | Notes |
|----------|------|-------|
| `user_id` | uuid (hashed) | pseudonymous |
| `org_id` | uuid | current workspace |
| `role` | enum | owner/admin/manager/member/guest |
| `platform` | enum | ios/android/web |
| `app_version` | string | semver + build |
| `device_model` | string | e.g., iPhone16,2 |
| `os_version` | string | |
| `network` | enum | wifi/cellular/offline |
| `session_id` | uuid | |
| `timestamp` | iso8601 | client + server both recorded |
| `locale` | string | |
| `is_offline_queued` | bool | event captured offline, flushed later |

## Transport

- Batched, offline-buffered queue (mirrors the offline sync engine): events persist
  locally and flush on connectivity; deduped by `event_id` (idempotent).
- Respect **consent**: analytics disabled → only crash/health telemetry (see security).
- PII scrubbing at the client SDK boundary; server re-validates.

## Core event catalog (excerpt — modules extend this)

| event_name | Trigger | Key properties |
|------------|---------|----------------|
| `app_opened` | Cold/warm launch | `cold_start`, `startup_ms` |
| `screen_viewed` | Screen focus | `screen`, `referrer` |
| `signup_started` / `signup_completed` | Auth | `method` |
| `login_succeeded` / `login_failed` | Auth | `method`, `error_code` |
| `org_created` / `org_joined` | Onboarding | `invite` |
| `workspace_switched` | Sidebar | `from_org`, `to_org` |
| `task_created` | Create task | `source` (quickadd/detail/ai/voice), `has_due`, `has_time`, `priority`, `project_type` |
| `task_updated` | Edit field | `field` |
| `task_completed` | Complete | `was_overdue`, `had_subtasks`, `via` (swipe/detail/notification) |
| `task_deleted` | Delete | `soft` |
| `task_assigned` | Assign | `self_assign` |
| `subtask_added` / `subtask_completed` | Subtasks | |
| `comment_posted` | Comment | `has_mention`, `has_attachment` |
| `reminder_scheduled` | Set reminder | `offset_min`, `anchor` |
| `reminder_fired` | Local/push delivered | `type` |
| `reminder_opened` | Tap notification | `type`, `action` (open/complete/snooze) |
| `recurrence_set` | Repeat rule | `freq` |
| `sidebar_opened` | Drawer open | `method` (swipe/tap) |
| `quick_view_opened` | Today/Upcoming/etc | `view` |
| `calendar_viewed` | Calendar | `mode` (day/week/month/agenda) |
| `search_used` | Query | `result_count`, `used_operators` |
| `filter_applied` | Filter | `dimensions` |
| `view_saved` | Saved view | `scope` |
| `ai_invoked` | AI action | `capability`, `latency_ms`, `accepted` |
| `automation_triggered` | Rule fired | `trigger`, `actions_count` |
| `report_exported` | Export | `format`, `scope` |
| `notification_permission` | Prompt result | `granted` |
| `integration_connected` | OAuth link | `provider` |
| `error_shown` | User-facing error | `code`, `screen` |

## Funnels & north-star metrics

- **Activation:** `signup_completed` → `org_created`/`org_joined` → ≥3 `task_created` (7d).
- **Reminder reliability:** `reminder_scheduled` → `reminder_fired` within ±60s.
- **AI adoption:** `ai_invoked` with `accepted=true` rate.
- **Collaboration:** orgs with ≥2 active users and ≥1 shared project.

## Governance

- New events require a PR to this file (name + properties + owner).
- A CI check fails builds that emit events not registered here (`analytics-lint`).
- Data retention & user deletion follow `shared/security-baseline.md`.
