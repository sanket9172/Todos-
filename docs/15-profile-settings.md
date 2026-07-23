# 15 · Profile & Settings

> Follows the [Master PRD Template](./00-prd-template.md). Settings is Numil's calm "control
> center": identity, appearance, task defaults, privacy/security (biometric lock), workspace
> switching, and deep-links into cross-cutting subsystems (notifications, org admin, billing).
> It stays a grouped iOS settings list — power lives one disclosure row down.

---

## 1. Purpose

Profile & Settings lets a user manage who they are, how the app looks and behaves, how they're
protected, and which workspace they're acting in — without ever feeling like a control panel.
Most settings are **preferences** (fast, optimistic, offline-safe); a few are **security
actions** (require connectivity + re-auth).

**User problem it solves.** Preference screens in productivity apps sprawl into hundreds of
toggles. Numil groups them the way iOS Settings does (a scannable grouped list), keeps the
first screen tiny, and pushes depth into sub-screens. A user changes their theme or time zone
in two taps; an admin reaches org security without cluttering everyone else's settings.

**User goals**
- Edit profile (avatar, name, time zone) and have it reflect app-wide instantly.
- Choose appearance (theme, accent, week start, time format).
- Set task defaults so new tasks match their workflow.
- Lock the app behind Face ID and control auto-lock.
- Switch workspaces; reach org settings if permitted.
- Manage account security (password, sessions, 2FA, delete/export).

**Business goals**
- Correct time zone / time format underpins reminder reliability (a core promise).
- Biometric lock + session management satisfy enterprise security expectations.
- Data export + account deletion satisfy GDPR/CCPA obligations.
- Workspace switching drives multi-org expansion.

**KPIs:** `settings_changed` by category, biometric-lock adoption, notification opt-in rate
(driven from here), time-zone correctness (fewer mis-fired reminders), account-deletion
completion (compliance), workspace-switch frequency.

---

## 2. Navigation

**Entry points**
- **Sidebar footer → Settings** (gear) and the **profile avatar** in list headers.
- **More tab → Settings** on compact layouts.
- Deep links: `numil://settings`, `numil://settings/appearance`, `numil://settings/security`,
  `numil://settings/notifications` (bounces into module 12), `numil://profile`.
- System hand-offs land here: iOS Settings "Open App" for permissions, or a security email
  ("review your sessions") → `numil://settings/security/sessions`.

**Route:** `src/app/settings/index.tsx` (grouped list) with pushed sub-screens
`src/app/settings/profile.tsx`, `.../account.tsx`, `.../appearance.tsx`, `.../defaults.tsx`,
`.../privacy.tsx`, `.../about.tsx`. Notifications and Org settings **deep-link out** to their
own modules rather than duplicating them.

**Navigation hierarchy & breadcrumbs**
```text
Settings ▸ Profile
Settings ▸ Account ▸ Active sessions
Settings ▸ Appearance
Settings ▸ Notifications        → 12-notifications-alerts.md
Settings ▸ Workspace ▸ Org settings → 13 / 30
Settings ▸ Privacy & Security ▸ App Lock
```

**Transitions & modal-vs-push**
- Settings is a **push** from the sidebar (full back stack).
- Sub-screens **push**; pickers (time zone, theme, accent) open as **bottom sheets**.
- Destructive/security flows (delete account, change password) open as **modals** that require
  explicit confirmation and re-auth.
- The **App Lock** screen is a full-screen modal presented over everything on cold start /
  return from background.

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  Settings                                       │  ← large title
├───────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐ │
│  │  ◯  Priya Rao                     ›         │ │  ← profile card (tap → edit)
│  │     priya@acme.co · Admin @ Acme            │ │
│  └───────────────────────────────────────────┘ │
├───────────────────────────────────────────────┤
│  ACCOUNT                                        │
│   Account & security                        ›   │
│   Notifications                             ›   │  ← deep-links to 12
├───────────────────────────────────────────────┤
│  PREFERENCES                                    │
│   Appearance            System ▸               │
│   Tasks & defaults                          ›   │
│   Start of week         Monday ▸               │
│   Time format           24-hour ▸              │
├───────────────────────────────────────────────┤
│  WORKSPACE                                      │
│   Acme (current)                            ⌄   │  ← switch workspace
│   Organization settings                     ›   │  ← Owner/Admin only
├───────────────────────────────────────────────┤
│  PRIVACY & SECURITY                             │
│   App Lock (Face ID)                    On ▸    │
│   Auto-lock             After 5 min ▸          │
│   Export my data                            ›   │
├───────────────────────────────────────────────┤
│  SUPPORT & ABOUT                                │
│   Help · Contact · Send feedback            ›   │
│   Version 1.0.0 (build 42)                      │
│   [ Sign out ]                                  │
└───────────────────────────────────────────────┘
```

App Lock modal:
```text
┌───────────────────────────────────────────────┐
│                                                 │
│                   ◈  Numil                      │
│                                                 │
│            Unlock with Face ID                  │
│                 [  Try Face ID  ]               │
│              Use passcode instead               │
└───────────────────────────────────────────────┘
```

- **Top:** the profile card is the only "hero"; everything else is a tidy grouped list.
- **Grouped sections:** Account · Preferences · Workspace · Privacy & Security · Support.
  Inline value labels (e.g., "System", "Monday") show current state without opening the row.
- **Owner/Admin-only rows** (Org settings, Billing) are hidden entirely for others — not
  disabled — to keep the list short.
- **App Lock** is a dedicated full-screen modal with a single primary action (biometric),
  passcode fallback, and no dismiss until authenticated.
- **Landscape / iPad:** master-detail — settings groups in a sidebar list, the selected
  sub-screen in the detail pane (Apple Settings-app pattern).
- **Tab bar:** visible on the root Settings screen; hidden on the App Lock modal.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Profile | `ProfileCard`, `AvatarPicker` (Photos/Camera + remove), `InlineTextField` (name/title/pronouns), `TimeZonePickerSheet`, `RolePill` |
| List chrome | `SettingsSection` (grouped), `SettingsRow` (label + value/chevron), `DisclosureRow`, `NavRow`, `ValueRow`, `DestructiveRow` |
| Controls | `ToggleSwitch`, `SegmentedControl` (theme), `AccentColorSwatchGrid`, `PickerSheet`, `StepperRow`, `RadioListSheet` |
| Account | `EmailChangeSheet` (re-verify), `PasswordChangeSheet`, `ConnectedMethodsList` (Apple/Google/SSO link/unlink), `TwoFactorSheet` 🔜, `ActiveSessionsList`, `SessionRow` (device, last active, "sign out"), `SignOutButton`, `DeleteAccountFlow` |
| Appearance | `ThemeSegmentedControl` (System/Light/Dark), `AccentPicker`, `WeekStartPicker`, `TimeFormatPicker`, `TextSizeNote` (defers to iOS Dynamic Type) |
| Defaults | `DefaultViewPicker`, `DefaultGroupSortPicker`, `DefaultDestinationPicker`, `DefaultReminderOffsetStepper`, `DefaultPriorityPicker`, `ConfirmBeforeDeleteToggle`, `HapticsToggle` |
| Workspace | `WorkspaceSwitcher` (list of memberships + "Add workspace"), `OrgSettingsNavRow`, `LeaveOrgFlow` |
| Security | `AppLockToggle`, `AutoLockTimeoutPicker`, `BiometricPrompt` (`expo-local-authentication`), `AppLockModal`, `DataExportSheet`, `LegalLinksList` |
| Support | `HelpCenterLink`, `ContactSupportSheet`, `FeedbackSheet`, `BugReportSheet` (attaches diagnostics), `VersionRow`, `WhatsNewSheet`, `DocsLinkRow` |
| Feedback | `Toast`/`Snackbar` (saved/undo), `Banner` (offline/needs-connection), `ConfirmDialog`, `ReAuthSheet` |

All primitives are defined in [03 · Design System & UI](./03-design-system-ui.md).

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Edit profile (avatar, name, time zone) ✅
- **Purpose:** identity that renders app-wide (avatars, mentions, assignee).
- **Workflow:** tap profile card → edit name/title/pronouns/time zone → change avatar
  (Photos/Camera/remove) → optimistic save; avatar uploads resumably.
- **UI:** `ProfileCard`, `AvatarPicker`, `TimeZonePickerSheet` (searchable IANA list).
- **Permissions:** self only (everyone edits their own).
- **Offline:** name/tz optimistic; avatar blob upload queued (`pending`).
- **API:** `PATCH /me`; `POST /me/avatar` (multipart/resumable).
- **DB:** `users(name, avatar_url, job_title?, pronouns?, time_zone, …)`.
- **Notify:** none (profile changes are silent).
- **AC:** time-zone change re-renders all displayed times and recomputes local reminders.

### 5.2 Appearance (theme, accent, week start, time format) ✅
- **Purpose:** match the OS and personal preference.
- **Workflow:** Theme **System/Light/Dark** applies instantly (wired to `useColorScheme` /
  theme provider); accent from brand palette; week start Sun/Mon; time 12h/24h.
- **UI:** `ThemeSegmentedControl`, `AccentPicker`, `WeekStartPicker`, `TimeFormatPicker`.
- **Permissions:** self.
- **Offline:** fully local (persisted in local prefs + synced).
- **API:** `PATCH /me/preferences`.
- **DB:** `user_preferences(theme, accent, week_start, time_format, …)`.
- **Notify:** none.
- **AC:** theme switch applies with no reload; time format reformats every displayed time;
  week start affects Calendar + "this week" filters ([11](./11-calendar-scheduling.md), [14](./14-search-filters-views.md)).

### 5.3 Task defaults ✅
- **Purpose:** make new tasks match the user's habits.
- **Workflow:** set default view (List/Board), default group/sort, default new-task
  destination (My Tasks vs last project), default reminder offset, default priority,
  confirm-before-delete, haptics.
- **UI:** `DefaultViewPicker`, `DefaultReminderOffsetStepper`, etc.
- **Permissions:** self.
- **Offline:** local + synced.
- **API:** `PATCH /me/preferences`.
- **DB:** `user_preferences(default_view, default_group, default_sort, default_destination,
  default_reminder_offset_min, default_priority, confirm_delete, haptics)`.
- **Notify:** none directly (but changes the default reminder behavior).
- **AC:** new tasks inherit defaults; changing them never rewrites existing tasks.

### 5.4 Account & security management ✅ / 🔜
- **Purpose:** control credentials, linked identities, sessions.
- **Workflow:** change email (re-verify), change password (current+new), link/unlink Apple/
  Google/SSO, enable **2FA** (TOTP 🔜 / passkeys 🟣), view **active sessions** and sign out a
  device remotely.
- **UI:** `EmailChangeSheet`, `PasswordChangeSheet`, `ConnectedMethodsList`, `TwoFactorSheet`,
  `ActiveSessionsList`.
- **Permissions:** self; **requires connectivity + re-auth** (`ReAuthSheet`).
- **Offline:** blocked with a "needs connection" banner (security actions never queue).
- **API:** `POST /auth/email/change`, `POST /auth/password/change`, `GET/DELETE /auth/sessions`,
  `POST /auth/2fa/*` (see [05 · Auth](./05-authentication-login.md), [shared/security-baseline.md](./shared/security-baseline.md)).
- **DB:** `sessions(id, user_id, device_id, ua, last_active_at, revoked_at?)`.
- **Notify:** password/email change and new-session events emit a **security alert** (email + push).
- **AC:** password change signs out other sessions (optional); revoking a session invalidates its tokens.

### 5.5 Biometric app lock + auto-lock ✅
- **Purpose:** protect work data on a shared/lost device.
- **Workflow:** toggle App Lock → authenticate to enable; pick auto-lock timeout (Immediately/
  1/5/15 min/1 hr); on cold start or return-from-background past the timeout, show the
  `AppLockModal` → Face ID / Touch ID (device-passcode fallback).
- **UI:** `AppLockToggle`, `AutoLockTimeoutPicker`, `AppLockModal`, `BiometricPrompt`.
- **Permissions:** self; uses `expo-local-authentication`.
- **Offline:** fully local — no network needed to lock/unlock.
- **API:** none (device-local); the *setting* syncs (so a new device suggests enabling it).
- **DB:** `user_preferences(app_lock_enabled, auto_lock_min)`; lock state is device-local
  (Keychain flag), never a server truth.
- **Notify:** none.
- **AC:** lock enforces on reopen after timeout; failed biometric falls back to passcode; app
  content is not visible behind the lock (blurred snapshot).

### 5.6 Workspace switching + org settings entry ✅
- **Purpose:** act in the right organization; reach admin surfaces if permitted.
- **Workflow:** tap current workspace → `WorkspaceSwitcher` lists memberships → select → app
  re-scopes (data, permissions, theme accent per org). Org settings row **deep-links** to
  [13 · Organization](./13-organization-members-roles.md) / [30 · Workspace Admin](./30-workspace-administration.md).
- **UI:** `WorkspaceSwitcher`, `OrgSettingsNavRow` (Owner/Admin only), `LeaveOrgFlow`.
- **Permissions:** switch = any membership; **Org settings row hidden unless Owner/Admin**.
- **Offline:** switch to a cached workspace works; uncached prompts a sync.
- **API:** `GET /me` (memberships), `X-Org-Id` header re-scopes subsequent calls; `POST /orgs/:id/leave`.
- **DB:** `memberships(user_id, org_id, role, status)`.
- **Notify:** `workspace_switched` analytics; leaving may notify Owner/Admin.
- **AC:** switching re-scopes all data and permissions; role changes take effect immediately
  (token/claims refresh — see RBAC spec).

### 5.7 Data export & account deletion ✅ (GDPR/CCPA)
- **Purpose:** user control over their data.
- **Workflow:** "Export my data" → async job → download link (machine-readable). "Delete
  account" → confirmation + optional export + re-auth; **Owner must transfer ownership first**.
- **UI:** `DataExportSheet`, `DeleteAccountFlow` (multi-step, typed confirmation).
- **Permissions:** self; Owner blocked from deleting until ownership transferred.
- **Offline:** blocked (needs connectivity).
- **API:** `POST /me/export`, `GET /me/export/:jobId`, `POST /me/delete`.
- **DB:** deletion cascades/anonymizes per retention policy; legal hold overrides.
- **Notify:** export-ready notification; deletion confirmation email.
- **AC:** export produces a downloadable archive; deletion is audited and irreversible after grace period.

### 5.8 Support, feedback & about ✅
- Help center, contact support, send feedback, **report a bug** (attaches diagnostics/log
  bundle with PII scrubbed), version/build, "What's new", and a link to these product docs.

---

## 6. Smart AI Features

AI here is light and optional, powered by [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md):

| Capability (`capability` id) | In Settings | Write? |
|------------------------------|-------------|--------|
| `settings_nl` 💡 | "Turn off weekend reminders" / "switch to dark mode" via Copilot → jumps to and toggles the setting (with confirmation). | proposes toggle |
| `smart_defaults` 🟣 | Suggests task defaults from behavior ("you usually schedule for 9am — set as default?"). | proposes |
| `tz_detect` ✅ | Detects a travel time-zone change and offers to update display tz (never silently). | proposes |
| `bug_triage` 🔜 | Bug-report text is summarized/categorized before submission (on-device where possible). | read-only |
| **AI governance link** | Per-org AI enable/disable and credits surface under Workspace → Org settings → AI (module 19 §8). | — |

Guardrails: AI never flips a **security** setting; all proposals require explicit confirmation;
no task content leaves the device for these features.

---

## 7. Productivity Features

- **Task defaults** (§5.3) are the biggest productivity lever — they shape every quick-add.
- **Per-workspace accent** gives a fast visual cue of which org you're in.
- **Quiet hours & digests** are configured via the Notifications deep-link (module 12) but
  gate reminder delivery globally.
- **"What's new"** surfaces newly shipped productivity features contextually.
- **Shortcuts hint:** Settings links to [34 · Siri & Shortcuts](./34-siri-voice-apple-intelligence.md)
  so users can wire "Plan my day" style automations.

---

## 8. Enterprise Features

- **Org-managed settings (MDM/SSO):** enterprises can pin certain settings (e.g., require App
  Lock, minimum auto-lock, disallow personal export) via [30 · Workspace Admin](./30-workspace-administration.md);
  such rows show a "Managed by your organization" note and are read-only.
- **SSO/SCIM identities:** connected-methods reflect SSO; SCIM-provisioned profile fields may
  be read-only (managed by IdP).
- **Session/device policy:** admins can force sign-out, require re-auth intervals, or
  allow-list devices (enterprise) — enforced server-side ([shared/security-baseline.md](./shared/security-baseline.md)).
- **Audit:** security-relevant self-service actions (password/email change, session revoke,
  2FA, delete) are written to [29 · Audit Logs](./29-activity-feed-audit-logs.md).
- **Retention/legal hold:** export and deletion honor org retention + legal hold.

---

## 9. Collaboration Features

- **Profile is the collaboration surface:** name, avatar, title, pronouns, and time zone appear
  in mentions, assignee pickers, presence, and member lists — so accurate profile data improves
  everyone's collaboration.
- **Working hours / availability** 🔜: optional working-hours in profile inform AI scheduling
  (module 19) and "best time to reach" hints in team views.
- **Status / away message** 🟣 (like Slack): a lightweight availability badge shown on avatars.
- Leaving an org triggers reassignment of that user's assigned tasks and owned shared views
  (see modules 13 and 14).

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **Preferences** (theme, accent, week start, time format, task defaults, app-lock setting,
  auto-lock) are edited offline and synced as normal entities (LWW on scalar fields).
- **Biometric lock/unlock is fully offline** — lock state is a device-local Keychain flag, never
  a server value; the *preference to enable it* syncs so new devices can suggest it.
- **Security actions** (password/email change, session revoke, 2FA, export, delete) are **never
  queued offline** — they require connectivity + re-auth and show a "needs connection" banner.
- **Avatar** metadata syncs immediately; the image blob uploads resumably with a `pending` state.
- Multi-device: preference conflicts resolve LWW; the most recent change wins per field.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- **App Lock** uses `expo-local-authentication` (Face ID/Touch ID) with device-passcode
  fallback; the app snapshot is **blurred in the app switcher** when lock is enabled.
- **Re-authentication** is required for all sensitive changes (password, email, 2FA, delete);
  tokens live only in Keychain (`expo-secure-store`), never AsyncStorage.
- **Session management** shows all active devices; revoking one invalidates its refresh-token
  family (replay protection); password change can revoke all others.
- **New-device sign-in** triggers a security alert (email + push).
- **Data export/erasure** flows are audited; PII is minimized and never logged.
- **Managed settings** enforced server-side; the client only reflects the policy.

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- The **Notifications** row deep-links into module 12 (the canonical preference surface):
  per-type toggles, default reminder time/offset, quiet hours, digests, sounds.
- Settings **originates** the notification permission prompt with a clear pre-permission
  rationale (also handled in [06 · Onboarding](./06-onboarding.md)); denial routes to iOS Settings.
- **Security notifications** (new device, password/email change, session revoke) are emitted by
  actions taken here and are non-suppressible (safety-critical category).
- Changing **time zone / time format** recomputes local reminder wall-clock times atomically.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Every `SettingsRow` announces label + current value + "Double-tap to change" ("Appearance,
  System, button").
- Toggles announce on/off state changes; segmented controls announce the selected segment.
- The App Lock modal is reachable and operable via VoiceOver/Switch Control; the biometric
  prompt is system-provided (inherits Apple a11y).
- Text-size row defers to iOS **Dynamic Type** (Numil never overrides system text size).
- Destructive rows use label + icon (not color alone) and require confirmation.
- Time-zone picker is a searchable, VoiceOver-navigable list.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Row value changes **cross-fade** (`motion.fast`); toggles use the native switch spring.
- Theme switch: a brief 200ms cross-fade of the whole surface (no hard flash), respecting
  Reduce Motion (instant swap).
- Pushed sub-screens use the iOS default slide with large-title collapse.
- App Lock modal fades in over a blurred snapshot; success unlock cross-fades to content.
- Workspace switch animates the accent-color change and a subtle content cross-fade.
- All movement respects Reduce Motion (swap to 120ms cross-fades).

---

## 15. Performance

- Settings is a lightweight grouped list — rows render lazily; sub-screens are code-split and
  lazy-imported so the root screen mounts <100ms.
- Preference reads come from the local mirror (no network on open); writes are optimistic and
  debounced before sync.
- Avatar images use `expo-image` with caching and downscaled thumbnails.
- Active-sessions list paginates; heavy security screens fetch on demand.
- Theme/accent changes update via the theme provider without a full re-mount (memoized tokens).
- App Lock check runs synchronously on foreground with a cached timestamp — no perceptible delay.

---

## 16. Database Design

Aligns with [17 · Data Model & API](./17-data-model-api.md).

```text
users(id, name, email, avatar_url?, job_title?, pronouns?, time_zone, created_at, updated_at, deleted_at?)
user_preferences(user_id→users, theme, accent, week_start, time_format,
                 default_view, default_group, default_sort, default_destination,
                 default_reminder_offset_min, default_priority, confirm_delete, haptics,
                 app_lock_enabled, auto_lock_min, version, updated_at)
sessions(id, user_id→users, device_id, user_agent, ip_region, last_active_at, created_at, revoked_at?)
connected_identities(id, user_id→users, provider('apple'|'google'|'sso'), external_id, created_at)
export_jobs(id, user_id→users, status, file_url?, requested_at, completed_at?)
-- notification preferences live in module 12; org-managed policy in module 30
```

**ER snippet:**
```text
User 1───1 UserPreferences
User 1───< Session                 (active devices)
User 1───< ConnectedIdentity       (Apple/Google/SSO)
User 1───< ExportJob
User >───< Organization (via Membership; role drives which settings rows appear)
```

**Indexes:** `sessions(user_id, last_active_at)`, `connected_identities(user_id, provider)`,
`export_jobs(user_id, status)`, unique `users(email)`. **Constraints:** exactly one
`user_preferences` row per user; `auto_lock_min` ∈ allowed set; email unique + verified before
activation. **Soft delete** on `users` via `deleted_at` (anonymized on hard-delete per
retention). Biometric lock state is **not** a DB field (device-local Keychain flag).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Current user + memberships + preferences |
| PATCH | `/me` (If-Match) | Update profile (name/title/pronouns/time zone) |
| POST | `/me/avatar` (multipart/resumable) | Avatar upload |
| PATCH | `/me/preferences` | Appearance + task defaults + app-lock setting |
| POST | `/auth/password/change` | Change password (re-auth) |
| POST | `/auth/email/change` | Change email (re-verify) |
| GET | `/auth/sessions` · DELETE `/auth/sessions/:id` | List / revoke sessions |
| POST | `/auth/2fa/enroll` · `/auth/2fa/verify` | 2FA (🔜) |
| POST | `/me/export` · GET `/me/export/:jobId` | Data export (GDPR) |
| POST | `/me/delete` | Account deletion (re-auth; owner must transfer first) |
| POST | `/orgs/:id/leave` | Leave workspace |

**Realtime:** channel `user:{id}` — `session.created` (new-device alert), `session.revoked`,
`preferences.updated` (multi-device sync). **Errors:** `401 unauthorized` (re-auth required),
`403 forbidden` (owner can't delete without transfer / managed setting), `409 conflict`
(preferences version), `422 validation_failed` (bad time zone/enum). **Idempotency-Key** on
all mutations. Security actions bypass the offline outbox (network-required).

**Sample request/response — update preferences**
```http
PATCH /v1/me/preferences   If-Match: 7   Idempotency-Key: 3af1…
Authorization: Bearer <token>
{ "theme": "dark", "weekStart": "mon", "timeFormat": "24h", "appLockEnabled": true, "autoLockMin": 5 }
```
```json
{ "data": { "userId": "usr_9", "theme": "dark", "weekStart": "mon", "timeFormat": "24h",
            "appLockEnabled": true, "autoLockMin": 5, "version": 8 },
  "meta": { "requestId": "req_a12" } }
```

---

## 18. Edge Cases

- **Offline security action:** password/email/2FA/delete blocked with "needs connection" banner;
  never queued.
- **Time-zone change while reminders scheduled:** all local notifications recomputed to the new
  wall-clock; user sees a brief "reminders updated" toast.
- **DST boundary:** all-day and time-bearing reminders re-derive correctly (server UTC + local tz).
- **Owner tries to leave/delete:** blocked until ownership transferred (guided flow).
- **Last Admin leaving:** warns and requires promoting another Admin/Owner first.
- **Biometric unavailable/changed** (Face ID re-enrolled, hardware off): fall back to device
  passcode; if none, App Lock auto-disables with a notice.
- **Session revoked mid-use:** next request `401` → forced re-auth or sign-out.
- **Avatar upload fails/oversized:** rejected with reason; ret/y; old avatar retained.
- **Managed (MDM) setting user tries to change:** row read-only with "Managed by your organization".
- **Email change to an already-used address:** `422`; original email retained until verify.
- **Export job stuck/expired:** downloadable link has TTL; user can re-request.
- **Workspace deleted while selected:** app falls back to another membership or the "no workspace" state.

---

## 19. User States

- **First-time:** minimal profile prompt; theme = System; sensible task defaults pre-filled;
  App Lock off (offered after first sensitive action).
- **Returning/power:** custom accent, tuned task defaults, App Lock on, multiple workspaces.
- **Guest:** limited settings (profile, appearance, app lock); no org settings; workspace list
  shows only shared orgs.
- **Manager:** same as Member plus team-scoped org links where applicable.
- **Admin:** Org settings + security rows visible; can't view others' personal tasks.
- **Owner:** Billing + delete/transfer org; must transfer before leaving/deleting account.
- **Offline / poor network:** preferences editable; security rows show connection banner.
- **Tablet/landscape:** master-detail settings.
- **Dark mode / large text / a11y:** tokenized; Dynamic Type deferred to system; VoiceOver verified.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md).

| event | key properties |
|-------|----------------|
| `settings_opened` | `via` (sidebar/avatar/deeplink) |
| `settings_changed` | `category` (appearance/defaults/notifications/security), `setting`, `value_bucket` |
| `theme_changed` | `theme` (system/light/dark) |
| `timezone_changed` | `changed_by` (user/auto_detect) |
| `app_lock_toggled` | `enabled`, `auto_lock_min` |
| `app_lock_unlocked` | `method` (faceid/touchid/passcode), `success` |
| `workspace_switched` | `from_org`, `to_org` |
| `session_revoked` | `self` (bool) |
| `notification_permission` | `granted` |
| `data_export_requested` | — |
| `account_delete_started` / `account_delete_completed` | `had_export` |

No PII, task content, avatars, or credentials are ever sent as event properties.

---

## 21. Acceptance Criteria

1. Profile edits (name/avatar/title/pronouns/time zone) save and reflect app-wide.
2. Changing time zone re-renders every displayed time and recomputes local reminders.
3. Avatar change supports Photos/Camera/remove; upload resumes after interruption.
4. Theme switch (System/Light/Dark) applies immediately with no reload.
5. Accent color applies app-wide and persists per workspace.
6. Time format (12h/24h) reformats all displayed times.
7. Start-of-week affects Calendar and "this week" filters.
8. Task defaults (view/group/sort/destination/reminder/priority) apply to new tasks only.
9. Changing defaults never rewrites existing tasks.
10. App Lock enables only after successful biometric authentication.
11. App Lock enforces on cold start and on foreground after the auto-lock timeout.
12. Biometric failure falls back to device passcode; content is blurred in the app switcher.
13. App Lock works fully offline (device-local, no server dependency).
14. Auto-lock timeout options apply correctly (Immediately/1/5/15 min/1 hr).
15. Password change requires current password + re-auth and can revoke other sessions.
16. Email change requires re-verification; original retained until verified.
17. Connected sign-in methods (Apple/Google/SSO) can be linked/unlinked.
18. Active sessions list shows devices; revoking one invalidates its tokens.
19. New-device sign-in raises a security alert (email + push).
20. Security actions are blocked offline with a clear "needs connection" banner (never queued).
21. Data export produces a downloadable machine-readable archive.
22. Account deletion requires re-auth and confirmation; Owner must transfer ownership first.
23. Deletion cascades/anonymizes per retention policy and is audited.
24. Workspace switch re-scopes all data, permissions, and accent.
25. Role changes take effect immediately (token/claims refresh).
26. Org settings and Billing rows are hidden (not just disabled) for unauthorized roles.
27. Managed (MDM) settings render read-only with "Managed by your organization".
28. Notifications row deep-links to module 12; permission prompt shows a clear rationale.
29. Preferences sync across devices; conflicts resolve last-write-wins per field.
30. Preferences are editable offline and sync when reconnected.
31. Leaving/deleting is blocked for the last Admin/Owner until reassignment.
32. VoiceOver announces each row's label + current value + change hint.
33. Text size defers to iOS Dynamic Type; no in-app override.
34. Reduce Motion swaps theme/screen transitions for cross-fades.
35. iPad shows master-detail settings.
36. Analytics events fire per category with no PII/credentials/task content.
37. Bug report attaches PII-scrubbed diagnostics and submits successfully.
38. Version/build and "What's new" render current values.
39. Sign out clears the session and returns to auth.
40. All mutations use `Idempotency-Key`; retries never duplicate a change.

---

## 22. Future Roadmap

- **V1 (✅):** profile edit, appearance, task defaults, biometric App Lock + auto-lock,
  workspace switching, org-settings entry, sessions/sign-out, data export + account deletion,
  support/about, notification deep-link.
- **V1.1 (🔜):** TOTP 2FA, working-hours/availability in profile, AI bug triage, richer session
  detail (location/region), automated export scheduling.
- **V2 (🟣):** WebAuthn passkeys, smart-default suggestions, status/away message, per-workspace
  profile overrides, admin-managed setting policies (MDM) UI.
- **Future (💡):** natural-language settings ("turn off weekend reminders"), device allow-listing
  UI, cross-device App Lock policy.
- **Experimental (🧪):** on-device travel-aware auto time-zone with proactive reminder shift;
  privacy dashboard showing exactly what data each feature uses.
- **AI track:** Copilot-driven settings navigation + governance surfaced from module 19.
- **Enterprise track:** SCIM-managed profile fields, session policy console, legal-hold-aware
  export/deletion (module 40).
