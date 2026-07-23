# 06 · Onboarding & Workspace Setup

> Follows the [Master PRD Template](./00-prd-template.md). Onboarding is the **activation
> engine**: it turns a fresh sign-up into a user with a workspace and a first completed action,
> then gets out of the way. "Simple by default, deep on demand" starts here.

---

## 1. Purpose

Onboarding takes a brand-new user from "just authenticated" to **"has a workspace and has
created (or completed) a first task"** in the fewest possible steps. It also routes returning-
but-org-less users, invited teammates, and import/template flows.

**User problem it solves.** First-run experiences either overwhelm (endless setup wizards) or
under-serve (drop you into an empty app). Numil must feel like **Things 3's** calm first launch
while quietly doing the enterprise work of org creation, invites, and permission assignment —
and it must nail the "aha" moment (a task reminding you, a teammate joining) fast.

**User goals**
- Understand the value in seconds, then start (skippable tour).
- Create a workspace, or join my team's, without confusion.
- Turn on reminders because I *want* to, not because I was nagged.
- Do one real thing (create/complete a task) before I decide to stay.

**Business goals**
- Move the **activation** north-star metric: `signup_completed → org_created/joined → ≥3
  task_created within 7 days`.
- Seed collaboration (invite teammates during setup → higher retention).
- Reduce time-to-value and first-week churn.

**KPIs:** onboarding completion rate, time-to-first-task, notification opt-in rate, invites
sent per new org, D1/D7 retention of onboarded users, template/import adoption.

**Platform hooks (from `app.json`):** deep-link scheme `numil://` (invites, resume), bundle
`com.sanketsss.numil`, splash `#208AEF` continuity into the first screen.

---

## 2. Navigation

**Entry points**
- Automatically after `signup_completed` ([05 · Authentication](./05-authentication-login.md)).
- After login when the user has **no org membership**.
- Invite deep link `numil://invite/{code}` → routes through auth, then **Join** step pre-filled.
- Universal Link `https://numil.app/invite/{code}` (Associated Domains) → same as above.
- Resume: if abandoned, re-enter at the **last incomplete step** on next launch.

**Route group:** `src/app/(onboarding)/` — `tour`, `choose` (create/join), `create-org`,
`join-org`, `invite`, `notifications`, `first-task`. The root layout guard sends org-less
authenticated users here; completing it flips an `onboardingCompleted` flag and routes to Home
(`src/app/(tabs)/index`).

**Navigation hierarchy & flow**
```text
Auth ─▶ Onboarding
  Tour (skippable) ─▶ Choose ─┬─ Create org ─▶ Invite teammates ─▶ Notifications ─▶ First task ─▶ Home
                              └─ Join org (invite) ─▶ Notifications ─▶ First task ─▶ Home
  (Import ▸ module 37 and Templates ▸ module 24 are optional branches off First task)
```

**Modal vs push:** onboarding is a **full-screen push stack** (no tab bar) with a top progress
indicator and a persistent **Skip** where allowed. The notification prompt is the **system
sheet** (triggered after a priming screen). Sub-choices (workspace emoji/color, role dropdowns)
open as **bottom sheets** to keep context. Transitions: horizontal slide (`motion.base`); the
final "you're set" uses a brief success beat before Home.

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│▔▔▔  Dynamic Island / status bar safe area  ▔▔▔│
│   ●●●○○   (progress dots)              Skip ›   │  ← progress + skip
├───────────────────────────────────────────────┤
│                                                 │
│                (illustration)                    │
│      Your tasks and your team — in one place     │  ← value slide (large title)
│      Plan calmly. Get reminded. Stay in sync.    │
│                                                 │
│                                                 │
│   [        Get started        ]                 │  ← single primary (thumb zone)
│▁▁▁▁▁▁▁▁▁  home-indicator safe area  ▁▁▁▁▁▁▁▁▁▁│
└───────────────────────────────────────────────┘

  Choose step                        Create organization
┌─────────────────────────┐        ┌─────────────────────────┐
│  How do you want to work?│        │  Name your workspace     │
│  ┌───────────────────┐   │        │  [ Acme Marketing      ] │
│  │ ➕ Create a workspace│  │        │  Color/emoji  🟦 🚀 ▾     │
│  └───────────────────┘   │        │  (You'll be the Owner)   │
│  ┌───────────────────┐   │        │  [   Create workspace  ] │
│  │ 👥 Join with invite │  │        └─────────────────────────┘
│  └───────────────────┘   │
└─────────────────────────┘

  Notifications priming              First task (activation)
┌─────────────────────────┐        ┌─────────────────────────┐
│  🔔 Never miss a due task │        │  Try it: your first task │
│  We'll remind you before  │        │  (◯) Tap me to complete ✓│
│  things are due.          │        │  ＋ Add your own…         │
│  [ Turn on reminders ]    │        │  Start from a template › │  ← ▸ module 24
│  Not now                  │        │  Import your tasks    ›   │  ← ▸ module 37
└─────────────────────────┘        └─────────────────────────┘
```

- **Top:** progress dots + `Skip›` where allowed; respects Dynamic Island + top safe area.
- **Value tour:** one message per slide, large title, one primary CTA — never a wall of text.
- **Choose:** two large tappable cards (Create / Join); if arriving via invite, **Join** is
  auto-selected and pre-filled.
- **Create org:** name (required) + optional color/emoji; a clear "You'll be the Owner" note.
- **Notifications:** a **priming screen first** (value), then the system prompt — never cold.
- **First task:** a pre-filled example to complete + QuickAdd, with disclosure rows to
  Templates (module 24) and Import (module 37).
- **iPad / landscape:** content centers at ≤`MaxContentWidth`; illustration and form sit
  side-by-side in landscape; the primary CTA stays bottom-anchored.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Tour | `OnboardingCarousel`, `ValueSlide` (illustration + title + subtitle), `ProgressDots`, `SkipButton` |
| Choose | `ChoiceCard` (Create / Join), `SelectionState` |
| Create org | `TextField` (org name), `EmojiColorPicker` (bottom sheet), `OwnerBadgeNote`, `SubmitButton` |
| Join org | `InviteCodeField`, `InvitePreviewCard` (org name + inviter + role), `JoinButton`, `QRScanButton` |
| Invite teammates | `EmailChipsInput` (bulk paste), `RolePickerRow`, `InviteListRow`, `SkipForNowButton`, `CopyInviteLinkButton` |
| Notifications | `NotificationPrimingCard`, system permission prompt trigger, `NotNowLink` |
| First task | `ExampleTaskRow` (pre-filled), `QuickAddBar`, `TemplateEntryRow` (▸ module 24), `ImportEntryRow` (▸ module 37), `ConfettiOnFirstComplete` |
| Feedback | `Banner` (offline/invalid invite), `Toast`, `Skeleton`, `ConfirmDialog`, `EmptyState` |

All primitives come from [03 · Design System & UI](./03-design-system-ui.md); onboarding adds
only the onboarding-specific composites above. Tokens (`tint`, `Spacing`, typography) from
`src/constants/theme.ts`.

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Value tour ✅
- **Purpose:** communicate value in seconds; earn the next tap.
- **Workflow:** 2–3 swipeable slides; `Skip` always available; last slide → Get started.
- **UI:** `OnboardingCarousel` + `ProgressDots`; one message per slide.
- **Permissions:** N/A (pre-org).
- **Offline:** fully offline (bundled assets).
- **API:** none.
- **DB:** `onboarding_progress.tour_seen` (local + synced).
- **Notify:** none.
- **AC:** skippable at any point; never blocks reaching Choose.

### 5.2 Create organization ✅
- **Purpose:** stand up a new workspace/tenant; creator becomes **Owner**.
- **Workflow:** enter name (+ optional emoji/color) → `POST /orgs` → membership(Owner) created
  → active workspace set → continue.
- **UI:** name field + `EmojiColorPicker`; "You'll be the Owner" note.
- **Permissions:** any authenticated user (subject to plan/seat limits).
- **Offline:** **requires network** — show a gentle blocker + retry (no fake org).
- **API:** `POST /orgs {name, emoji?, color?}`.
- **DB:** `orgs`, `memberships(role='owner')`; see [13 · Org, Members & Roles](./13-organization-members-roles.md).
- **Notify:** none (self-action); welcome content in-app.
- **AC:** creator is Owner; duplicate-name allowed (orgs are id-scoped); empty name blocked.

### 5.3 Join organization via invite ✅
- **Purpose:** let invited users land in the right org with the right role.
- **Workflow:** open `numil://invite/{code}` (or paste code / scan QR) → preview org + inviter +
  role → Join → membership created with the **inviter-assigned role**.
- **UI:** `InvitePreviewCard`; auto-filled when arriving from a deep link.
- **Permissions:** governed by the invite (role pre-set; default Member; Guests scoped).
- **Offline:** requires network; the code is captured offline and resolved on reconnect.
- **API:** `GET /invites/:code` (preview), `POST /invites/:code/accept`.
- **DB:** `invites`, `memberships`; role from the invite record.
- **Notify:** inviter/admins get "X joined"; new member gets a welcome.
- **AC:** valid invite assigns the correct role/org; expired/revoked → helpful error (see §18).

### 5.4 Invite teammates during setup ✅
- **Purpose:** seed collaboration immediately (retention driver).
- **Workflow:** creator adds emails (bulk paste) + role each → `POST /invites` → links/emails
  sent; **Skip for now** allowed.
- **UI:** `EmailChipsInput` + `RolePickerRow`; `CopyInviteLinkButton` for a shareable link.
- **Permissions:** Owner/Admin can invite any role ≤ their own; Managers invite Members/Guests.
- **Offline:** queued; sent on reconnect with a "will send when online" note.
- **API:** `POST /invites {invitees:[{email, role}]}`.
- **DB:** `invites(org_id, email, role, code, expires_at, status)`.
- **Notify:** invite emails/push to invitees; confirmation to inviter.
- **AC:** invalid emails flagged inline; skip is always available; links honor role.

### 5.5 Notification permission priming ✅
- **Purpose:** maximize opt-in by explaining value before the one-shot iOS prompt.
- **Workflow:** show `NotificationPrimingCard` → on "Turn on reminders" trigger the system
  prompt → store result; "Not now" proceeds and can be re-primed from Settings.
- **UI:** value-first card; never trigger the cold system prompt.
- **Permissions:** N/A.
- **Offline:** the OS prompt works offline; server sync of preference deferred.
- **API:** register push token later via `POST /devices` (see [12 · Notifications](./12-notifications-alerts.md)).
- **DB:** `onboarding_progress.notif_primed`, device push token.
- **Notify:** none here; enables later notifications.
- **AC:** system prompt only fires after priming; denial doesn't block onboarding; re-promptable.

### 5.6 First-task activation ✅
- **Purpose:** deliver the "aha" — complete or create one real task.
- **Workflow:** a pre-filled `ExampleTaskRow` invites a completion (confetti); QuickAdd lets the
  user type a real one; disclosure rows offer Templates/Import.
- **UI:** `ExampleTaskRow` + `QuickAddBar` + `TemplateEntryRow`/`ImportEntryRow`.
- **Permissions:** Member+ (personal task always allowed).
- **Offline:** fully offline (optimistic task create).
- **API:** `POST /tasks` (see [10 · Task Detail](./10-task-detail.md)).
- **DB:** `tasks`; `onboarding_progress.first_task_done`.
- **Notify:** if the created task has a due date, a reminder is scheduled.
- **AC:** completing the example or adding a task marks activation and finishes onboarding.

### 5.7 Import tasks 🔜
- **Purpose:** reduce switching cost from Todoist/Things/Reminders/CSV.
- **Workflow:** entry row hands off to [37 · Backup, Import & Export](./37-backup-import-export.md);
  mapping + progress handled there; returns to Home when done.
- **UI:** `ImportEntryRow` → module 37 flow.
- **Permissions:** Member+ for personal; Manager+ for project import.
- **Offline:** file selection offline; upload/parse on reconnect.
- **API:** delegated to module 37 (`POST /imports`).
- **DB:** import job + created `tasks/projects`.
- **Notify:** import-complete notification.
- **AC:** onboarding can complete without import; import is resumable and non-blocking.

### 5.8 Start from a template 💡
- **Purpose:** give teams a running start (Team kickoff, Content calendar, Sprint).
- **Workflow:** entry row opens [24 · Templates & Recurring Workflows](./24-templates-recurring-workflows.md);
  applying a template creates a project + tasks in the new org.
- **UI:** `TemplateEntryRow` → module 24 gallery.
- **Permissions:** Manager+ to create a project from a template; Members get personal templates.
- **Offline:** browse cached templates offline; apply requires network for team projects.
- **API:** delegated to module 24 (`POST /templates/:id/apply`).
- **DB:** template application creates `projects`/`tasks`.
- **Notify:** teammates notified if added to the new project.
- **AC:** applying a template lands the user in a populated project; skippable.

---

## 6. Smart AI Features

Onboarding uses AI **lightly and optionally**, always previewed and skippable (governed by
[19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md)):

| Capability | What it does during onboarding |
|-----------|--------------------------------|
| **NL first task** (`nl_parse`) | The activation QuickAdd parses "Email Priya the deck tomorrow 4pm !high" into a structured task — a delightful first "wow." On-device parser works even offline. |
| **Smart setup suggestions** 🔜 | From org name/industry (optional), suggests starter projects/labels ("Marketing → Campaigns, Content"), shown as an accept/skip preview. |
| **Template match** 💡 | Recommends a relevant template from stated team type; one tap to apply. |
| **Invite suggestions** 💡 | If the user grants Contacts (optional, explicit), proposes teammates to invite by work-email domain — never auto-sends. |

All AI here is **proposal-first** (Accept/Skip), logged as `ai_invoked`, and never a
prerequisite to finishing onboarding.

---

## 7. Productivity Features

- **Fast path:** invite → auto-Join → notifications → done in under a minute.
- **QuickAdd with NLP** as the first-task surface (same primitive as everywhere; muscle memory).
- **Resume where you left off:** abandoned onboarding restarts at the last incomplete step.
- **Deferred deep links:** a task/invite link opened before onboarding is replayed after it.
- **Prefilled context:** workspace color/emoji + first project seed reduce empty-state friction.
- **Skip-friendly:** every optional step (tour, invites, notifications, import, template) can be
  skipped and completed later, honoring the "simple by default" rule.

---

## 8. Enterprise Features

- **Invite-link / domain capture:** enterprise orgs can enable **domain-based auto-join** so
  anyone with a verified `@acme.com` email joins as a default role (configured in
  [30 · Workspace Administration](./30-workspace-administration.md)).
- **SSO-first onboarding:** members from an SSO org skip org creation entirely; SSO login
  JIT-provisions them into the existing org with the mapped role (see module 05 §5.4).
- **SCIM-provisioned users** (🔜) may arrive already-a-member; onboarding becomes a light
  welcome + notifications + first task (no org creation/join).
- **Managed defaults:** admins can preset default project visibility, starter template, and
  whether members may create projects — onboarding respects these.
- **Audit:** org creation, invite acceptance, and role assignment are written to the immutable
  audit log ([29 · Activity & Audit](./29-activity-feed-audit-logs.md)).

**Onboarding capability permission matrix** (during and just after setup; roles per
[shared/rbac-permissions.md](./shared/rbac-permissions.md)):

| Action | Owner | Admin | Manager | Member | Guest |
|--------|:-----:|:-----:|:-------:|:------:|:-----:|
| Create a new org (become Owner) | ✅ (creator) | — | — | — | — |
| Join via invite | ✅ | ✅ | ✅ | ✅ | ✅ (shared scope) |
| Invite teammates as Admin/Manager | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite teammates as Member/Guest | ✅ | ✅ | ✅ | ❌ | ❌ |
| Apply a team template / create project | ✅ | ✅ | ✅ | ⚙️ | ❌ |
| Import into a team project | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create first personal task | ✅ | ✅ | ✅ | ✅ | ✅ |
| Set org onboarding defaults | ✅ | ✅ | ❌ | ❌ | ❌ |

`⚙️` gated by the org setting "Members can create projects" (default off). Guests always join
scoped to explicitly shared projects; roles are assigned by the inviter at invite time.

---

## 9. Collaboration Features

- **Invite teammates in-flow** (5.4) — the single biggest retention lever; supports bulk paste,
  per-invitee roles, and a copyable link.
- **Invite preview** shows *who* invited you and *what* org, building trust before joining.
- **Welcome moment:** on join, the new member sees who's on the team (avatar stack) and any
  project they were pre-assigned to.
- **Shared first project:** applying a team template (5.8) or accepting a project invite lands
  multiple people in the same space immediately.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Tour is fully offline** (bundled). **Creating/joining an org requires network** — show a
  gentle blocker with retry rather than a fake success.
- An **invite code opened offline** is captured and resolved on reconnect; the preview shows a
  "will confirm when online" state.
- **First-task creation is optimistic/offline** via the standard task outbox op.
- `onboarding_progress` is written locally first and synced; the abandoned-resume flag survives
  offline restarts.
- Notification permission (an OS action) works offline; server-side token registration defers.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Invite **codes are single-purpose, expiring, and revocable**; accepting binds to the
  authenticated identity (no anonymous joins).
- Invite links carry no PII beyond the org/inviter display needed for the preview.
- Domain auto-join requires a **verified** email domain and is Admin-gated.
- Org creation is subject to plan/seat/rate limits (anti-abuse; burst-signup detection).
- Contacts access for invite suggestions (💡) is explicit, revocable, and never uploaded without
  consent; suggestions computed to minimize data sent.
- Respects `ITSAppUsesNonExemptEncryption: false` (standard HTTPS only).

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- Onboarding **primes then triggers** the single iOS permission prompt (never cold).
- On join, emits a **welcome** notification and notifies the inviter/admins ("X joined").
- Invite emails/push are transactional; invitee reminders (unaccepted invite) are gentle and
  capped.
- If the first task has a due date, its reminder is scheduled immediately (proves the value).
- Denial is respected app-wide; a non-nagging re-prompt path lives in Settings.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Carousel slides are individually focusable; `ProgressDots` announce "Step 2 of 3."
- `Skip` is always reachable by VoiceOver/Full Keyboard Access, early in the reading order.
- The priming card explains value in text (not image-only) so screen-reader users can decide.
- `EmailChipsInput` announces added/removed invitees and inline validation errors.
- The example task's completion is announced ("Task completed") with a non-visual success cue.
- Full Dynamic Type; slides scroll instead of clipping at AX5.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Slide transitions `motion.base`; progress dots animate with `motion.fast`.
- **First-task completion → confetti** (`spring.bouncy`, ≤1.2s) — the one celebratory moment;
  **disabled under Reduce Motion** (replaced by a checkmark + color change).
- "You're all set" uses a brief success beat before pushing Home.
- Choice cards press-scale 1→0.97 (`motion.fast`) with `impactLight`.

---

## 15. Performance

- **First screen renders instantly** from the bundle (no network on the tour); illustrations
  are optimized `expo-image` assets with placeholders.
- Org create/join calls are single-flight with inline progress (no full-screen block).
- Invite preview (`GET /invites/:code`) is cached for the session; QR scanning is lazy-loaded.
- Import/template flows are **code-split** (modules 37/24) and only loaded on tap.
- Activation task write is optimistic (<16ms interaction); reminder scheduling is off the main
  path. Target: reach Home within 2 taps + one network round-trip on the invite happy path.

---

## 16. Database Design

```text
orgs(id, name, emoji?, color?, plan, created_by→users, created_at, deleted_at?)
memberships(id, org_id→orgs, user_id→users, role, status, joined_at, invited_by?)
             UNIQUE(org_id, user_id)      -- role ∈ {owner,admin,manager,member,guest}
invites(id, org_id→orgs, email, role, code, invited_by→users, project_id?,
        status, expires_at, created_at, accepted_at?, revoked_at?)
             UNIQUE(org_id, email) WHERE status='pending'
onboarding_progress(user_id→users, tour_seen, org_step_done, notif_primed,
                    first_task_done, resume_step, updated_at, version)
domain_autojoin(org_id→orgs, domain, default_role, enabled)   -- enterprise
```

**Relationships:** `orgs` 1:N `memberships` N:1 `users`; `invites` N:1 `orgs`; one
`onboarding_progress` per user. **Indexes:** `memberships(user_id)`, `memberships(org_id, role)`,
`invites(code)` unique, `invites(org_id, status)`, `onboarding_progress(user_id)` PK.
**Constraints:** exactly one Owner per org (enforced on create/transfer); pending invite unique
per (org,email). **Soft-delete:** `orgs.deleted_at`; declined/expired invites retained for
audit. **History:** org creation, invite accept, and role assignment append to the org audit log.
Aligns with [13 · Org, Members & Roles](./13-organization-members-roles.md) and
[17 · Data Model & API](./17-data-model-api.md).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/orgs` | Create org (creator → Owner) |
| GET | `/invites/:code` | Preview an invite (org, inviter, role) |
| POST | `/invites/:code/accept` | Join org with the invited role |
| POST | `/invites` | Create invites (bulk, per-role) |
| GET | `/me/onboarding` · PATCH `/me/onboarding` | Read/advance onboarding progress |
| POST | `/devices` | Register push token after notification opt-in |
| POST | `/tasks` | Create the first task |
| POST | `/templates/:id/apply` | Apply a starter template (▸ module 24) |
| POST | `/imports` | Kick off an import (▸ module 37) |

**Realtime:** `org:{id}` → `member.joined` (inviter/admins update live); `user:{id}` →
`onboarding.updated` (multi-device resume). **Errors:** `410 gone`/`409 gone` (expired/revoked
invite), `403 forbidden` (invite role exceeds inviter authority), `422 validation_failed`
(empty org name, bad email), `409 conflict` (already a member). **Idempotency-Key** on
`/orgs`, `/invites`, `/invites/:code/accept` so retries never create duplicates.

**Sample request/response**
```http
POST /v1/invites/accept
Path: /v1/invites/INV-7Q2K/accept
Authorization: Bearer eyJ…
Idempotency-Key: 9c31…
```
```json
{
  "data": {
    "org": { "id": "org_1", "name": "Acme Marketing", "emoji": "🚀" },
    "membership": { "role": "member", "status": "active", "joinedAt": "2026-07-16T09:40:00Z" },
    "nextStep": "notifications"
  },
  "meta": { "requestId": "req_7d4" }
}
```

---

## 18. Edge Cases

- **Already in an org:** onboarding is skipped entirely → straight to Home.
- **Invalid/expired/revoked invite:** clear error + "Ask for a new invite" + option to create
  an org instead.
- **Invite role exceeds inviter authority (later downgraded):** accept lands the user at the
  currently-valid role with a notice.
- **Offline org create/join:** gentle blocker + retry; code captured and resolved on reconnect.
- **Notification permission denied:** proceed; surface a re-prompt path in Settings; never nag.
- **Abandoned onboarding:** resume at `resume_step` on next launch; partial data preserved.
- **Duplicate accept (retry / two devices):** deduped by `Idempotency-Key`; second returns the
  same membership (idempotent), no double-join.
- **Seat/plan limit reached (join):** show "workspace is full — ask an admin"; do not silently
  fail.
- **Email mismatch on invite:** if the invite email differs from the signed-in email, warn and
  require confirmation (or block for strict orgs).
- **Domain auto-join + explicit invite conflict:** explicit invite role wins.
- **Deep link opened while signed out:** capture → auth → replay Join step.
- **First task created offline then org join fails:** the personal task persists locally and
  syncs once a workspace exists.

---

## 19. User States

- **First-time (no org):** full flow — tour → create/join → notifications → first task.
- **Invited user:** Join auto-selected/pre-filled; skips org creation.
- **SSO/SCIM-provisioned:** already a member → light welcome + notifications + first task.
- **Returning, abandoned mid-flow:** resumes at the last incomplete step.
- **Owner (just created):** sees invite-teammates step and workspace defaults.
- **Guest:** joins scoped to shared projects; sees a trimmed first-task step.
- **Offline / poor network:** tour + first task work; org create/join blocked with retry.
- **Tablet/landscape:** side-by-side illustration + form; bottom-anchored CTA.
- **Dark mode / large text / a11y / RTL:** fully themed, Dynamic Type, mirrored layouts.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md). No PII (no emails).

| event | key properties |
|-------|----------------|
| `onboarding_started` | `via` (signup/login/invite) |
| `tour_completed` | `skipped`, `slide_count` |
| `org_created` | `has_emoji`, `has_color` |
| `org_joined` | `invite`, `role` |
| `invite_sent` | `count`, `roles` |
| `notification_permission` | `granted` |
| `first_task_created` | `source` (example/quickadd/template/import), `has_due` |
| `template_applied` | `template_id`, `scope` |
| `import_started` / `import_completed` | `source`, `item_count` |
| `onboarding_completed` | `duration_ms`, `steps_skipped` |
| `onboarding_abandoned` | `last_step` |

**North-star funnel:** `signup_completed → org_created|org_joined → first_task_created → ≥3
task_created (7d)`. Watch `onboarding_abandoned.last_step` to fix drop-off points.

---

## 21. Acceptance Criteria

1. A new user with no org is routed into onboarding automatically.
2. The value tour is skippable at any point and never blocks progress.
3. Creating an org makes the creator the Owner and sets it as the active workspace.
4. Empty org name is blocked with an inline hint.
5. Org creation requires network; offline shows a gentle blocker with retry (no fake org).
6. Opening `numil://invite/{code}` routes through auth and pre-selects Join.
7. Universal Links (`https://numil.app/invite/{code}`) behave identically to the custom scheme.
8. The invite preview shows org name, inviter, and assigned role before joining.
9. Accepting a valid invite assigns the correct role and org.
10. Expired/revoked/invalid invites show a helpful error with a create-org fallback.
11. Duplicate invite acceptance (retry or second device) is idempotent — no double-join.
12. Owners/Admins can invite any role ≤ their own; Managers can invite Members/Guests.
13. Invite teammates supports bulk email paste with inline validation and per-invitee roles.
14. "Skip for now" is always available on the invite step.
15. The notification prompt is preceded by a value-first priming screen (never cold).
16. Denying notifications does not block onboarding and is re-promptable from Settings.
17. The first-task step lets a user complete the example or create a real task via QuickAdd.
18. QuickAdd parses natural language (date/time/priority/label) for the first task.
19. Completing the first task triggers confetti (disabled under Reduce Motion).
20. Creating a task with a due date schedules its reminder immediately.
21. Templates entry hands off to module 24 and returns to a populated project.
22. Import entry hands off to module 37 and is resumable/non-blocking.
23. Abandoned onboarding resumes at the last incomplete step on next launch.
24. A user already in an org skips onboarding entirely.
25. SSO/SCIM-provisioned users get a light welcome flow (no org creation/join).
26. Domain auto-join (enterprise) joins verified-domain users at the default role.
27. Org creation, invite acceptance, and role assignment are written to the audit log.
28. Onboarding completion flips `onboardingCompleted` and routes to Home.
29. All steps pass VoiceOver with a logical reading order and reachable Skip.
30. Progress dots announce the current step number to assistive tech.
31. Layouts pass Dynamic Type at AX5 without clipping (slides scroll if needed).
32. iPad/landscape centers content at ≤`MaxContentWidth` with a bottom-anchored CTA.
33. RTL locales mirror the flow correctly.
34. Analytics fire for each step with no PII; the activation funnel is measurable.
35. Deep links captured pre-auth are replayed after onboarding completes.
36. Seat/plan limits on join surface a clear "workspace is full" message.

---

## 22. Future Roadmap

- **V1 (✅):** value tour, create org (Owner), join via invite/deep link, invite teammates,
  notification priming, first-task activation with NL QuickAdd.
- **V1.1 (🔜):** task import (module 37 handoff), smart setup suggestions (starter
  projects/labels), SCIM-arrival light welcome, domain-based auto-join.
- **V2 (🟣):** template-driven onboarding gallery (module 24), role-tailored flows
  (manager vs member), guided project setup, in-flow calendar/integration connect.
- **Future (💡):** AI concierge onboarding ("tell me about your team, I'll set it up"),
  contact-based invite suggestions, personalized activation checklist on Home.
- **Experimental (🧪):** adaptive onboarding that reorders steps by predicted intent;
  progressive checklists that unlock features as the user is ready.
- **AI track:** natural-language workspace setup + template match (governed, proposal-first).
- **Enterprise track:** managed onboarding policies, mandatory training/consent steps, bulk
  provisioning welcome, onboarding analytics for admins.
