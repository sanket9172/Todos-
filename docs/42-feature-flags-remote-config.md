# 42 · Feature Flags & Remote Config

> Authoring standard: [00-prd-template.md](./00-prd-template.md).

> Follows the [Master PRD Template](./00-prd-template.md). Feature Flags & Remote Config is
> the control plane that lets Numil ship continuously, roll out safely, and kill a bad change
> in seconds — all without an App Store release. It is deeply technical yet, per the north
> star, **completely invisible to end users** and **one obvious switch** for the operators
> who wield it.

---

## 1. Purpose

Feature Flags & Remote Config decouples **deploy** from **release**. Code can ship dark, be
turned on for 1% of users, ramped to 100%, targeted at an org or plan, or killed instantly —
governed by a rules engine that evaluates safely on-device and offline.

**User problem it solves.** Mobile releases are slow and irreversible: a bug shipped in a
binary can take days to fix through review. Teams over-test and under-ship. Product can't run
experiments. Enterprises want to gate features per plan/org. Remote Config removes all of
this friction: engineers merge behind a flag, product controls exposure, and a kill-switch
protects users when something breaks.

**User goals (operators — PM/Eng/Admin)**
- Ship code dark, then turn it on for a cohort with one tap.
- Roll a change from 1% → 100% and halt/rollback instantly if metrics dip.
- Kill a broken feature immediately (kill-switch) without a release.
- Gate features by plan, org, role, platform, or app version.
- Tune runtime constants (limits, timeouts, copy) without redeploying.

**Business goals**
- Faster, safer releases (higher deploy frequency, lower change-failure rate).
- Monetization gating (features per plan/tier — feeds module 31).
- Experimentation velocity (A/B tests feeding module 43's analytics).
- Enterprise control: per-org feature availability + audit.

**KPIs:** flag-evaluation latency (p99, on-device), config freshness (age of cached config),
kill-switch time-to-mitigate, rollout safety (auto-halt rate), % features shipped behind
flags, experiment throughput, and stale-flag debt.

---

## 2. Navigation

**Entry points (operator-facing; not shown to end users)**
- **Admin ▸ Feature Flags** (`src/app/settings/flags.tsx`) — list, search, toggle, target.
- **Admin ▸ Remote Config** (`src/app/settings/remote-config.tsx`) — typed config values.
- **Flag detail** (`src/app/settings/flags/[key].tsx`) — targeting, rollout, history.
- **Developer overlay** (debug builds): shake-to-open flag inspector to override locally.
- Deep links `numil://admin/flags`, `numil://admin/flags/{key}`, `numil://admin/remote-config`.

**Route hierarchy & breadcrumbs**
```text
Admin ▸ Feature Flags ▸ [flag key]
Admin ▸ Remote Config ▸ [namespace]
```

**Transitions**
- Flag list → detail is a **push** (full editing context, history tab).
- Targeting/rollout editors open as **nested sheets** (`spring.gentle`) so the operator never
  loses the flag context.
- The debug overlay is a **modal sheet** available in dev/TestFlight only.

**Modal vs push:** management screens are **pushed** (deep, history-bearing); quick editors
and the debug inspector are **sheets**.

---

## 3. Complete UI Layout

**Admin ▸ Feature Flags** list and a flag detail, respecting the Dynamic Island, large-title
nav, and bottom safe area:

```text
┌───────────────────────────────────────────────┐
│  ‹ Admin        Feature Flags        [＋ New]   │  ← glass nav, large title
│  🔎 Search flags…                    ⚙︎ Filters │
├───────────────────────────────────────────────┤
│  ● new_home_dashboard        Rollout 25% ▸     │  ← status dot + rollout badge
│      boolean · 3 rules · edited 2h by Priya     │
│  ● ai_weekly_planning        ON (Pro)     ▸     │  ← plan-gated
│  ◐ board_swimlanes           Multivariate ▸     │  ← A/B/C variants
│  ⦸ realtime_v2               KILLED       ▸     │  ← kill-switch engaged (red)
│  ○ voice_comments            OFF          ▸     │
├───────────────────────────────────────────────┤
│  FLAG DETAIL — new_home_dashboard               │
│  [ Off ]  [ On ]  ( Gradual • 25% ▾ )   ⏻ Kill │  ← state segmented + kill-switch
│  Default (offline): OFF                          │  ← safe default chip
│  ┌ Targeting rules (evaluated top-down) ───────┐│
│  │ 1. IF plan = pro       → ON        ⋮  ↕     ││  ← reorderable rules
│  │ 2. IF org ∈ {beta}     → ON        ⋮  ↕     ││
│  │ 3. ELSE                → 25% rollout        ││  ← bucketed by stable hash
│  └───────────────────────────────────────────┘│
│  Variants: —      Experiment: home_v2 (linked) │
│  History ▾   • Priya set 10%→25% · 2h           │  ← audit trail
└───────────────────────────────────────────────┘
```

- **Top:** large title, search, filters (type, status, owner, stale), "＋ New flag".
- **List rows:** status glyph (`●` on/partial, `○` off, `◐` multivariate, `⦸` killed),
  flag key, type, rollout/plan badge, last-edited meta.
- **Detail:** state control (Off / On / Gradual %), a prominent **Kill** button, the
  **offline default** chip, an ordered **targeting rules** list (reorderable, top-down
  evaluation), variants (for multivariate), a linked experiment, and a **History** audit tab.
- **Empty state:** "No flags yet — create one to ship safely."
- **Landscape / iPad:** two-pane (flag list left, detail right).
- **End-user side:** none — flags are invisible; UI simply shows/hides gated surfaces.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Nav | `GlassNavBar`, large-title header, `SearchField`, `FilterButton`, `NewFlagButton` |
| List | `FlagRow` (status glyph, key, type badge, rollout badge, meta), `FlagStatusDot`, `RolloutBadge`, `KilledBadge`, `EmptyState` |
| State control | `FlagStateSegmented` (Off/On/Gradual), `RolloutSlider` (0–100%), `KillSwitchButton` (destructive), `OfflineDefaultChip` |
| Targeting | `RuleList` (reorderable), `RuleRow`, `SegmentPicker`, `AttributeConditionEditor` (plan/org/role/platform/version/locale), `PercentageRolloutEditor` |
| Multivariate | `VariantList`, `VariantRow` (key, weight, payload), `VariantWeightSlider`, `PayloadJSONEditor` |
| Remote config | `ConfigNamespaceList`, `ConfigRow` (typed: bool/number/string/json), `TypedValueEditor`, `SchemaValidationBadge` |
| Experiment link | `ExperimentLinkCard`, `MetricGuardrailChip`, `AutoHaltBadge` |
| History/audit | `HistoryTab`, `AuditRow` (actor, before→after, ts), `DiffPreview`, `RollbackButton` |
| Developer | `DebugFlagOverlay` (shake to open), `LocalOverrideRow`, `EvaluationTraceCard` (why a flag resolved) |
| Feedback | `Skeleton`, `Toast` (undo), `Banner` (config stale / kill active), `ConfirmDialog` (kill/rollback), `Popover` |

Primitives are defined in [03-design-system-ui.md](./03-design-system-ui.md).

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

**Flag lifecycle (state diagram):**
```mermaid
stateDiagram-v2
  [*] --> Off: create (safe default)
  Off --> Gradual: start rollout %
  Gradual --> Gradual: ramp 1→5→25→100
  Gradual --> On: reach 100%
  On --> Gradual: dial back %
  Off --> On: force on (targeted)
  Gradual --> Killed: kill-switch / auto-halt
  On --> Killed: kill-switch / auto-halt
  Killed --> Off: unkill (returns to safe default)
  Off --> Archived: retire stale flag
  On --> Archived: retire stale flag
  Archived --> [*]
  note right of Killed: overrides all rules → serves safe value; realtime-pushed
```

### 5.1 Flag types — boolean & multivariate ✅
- **Purpose:** simple on/off gates plus multi-arm variants (A/B/C) with payloads.
- **Workflow:** create a flag with `key`, type, description, owner, and **safe default**.
  Boolean returns true/false; multivariate returns a variant key + typed payload (used for
  config-like values or experiment arms).
- **UI:** `FlagStateSegmented`, `VariantList` with weights and `PayloadJSONEditor`.
- **Permissions:** create/edit → Admin (or delegated flag-manager); Managers read.
- **Offline:** last evaluation cached; falls back to safe default if never fetched.
- **API:** `POST /flags`, `PATCH /flags/:key`.
- **DB:** `feature_flags`, `flag_variants`.
- **Notify:** flag change → in-app operator toast + optional Slack (module 32).
- **AC:** a flag always resolves to a defined value; multivariate weights sum to 100%.

### 5.2 Targeting rules & segments ✅
- **Purpose:** expose a feature to precise cohorts.
- **Workflow:** ordered rules evaluated top-down; first match wins. Conditions use context
  attributes (`plan`, `orgId`, `role`, `platform`, `appVersion`, `locale`, `deviceModel`,
  `userId ∈ allowlist`). Reusable **segments** (e.g., "internal-staff", "beta-orgs")
  encapsulate common conditions.
- **UI:** `RuleList` (reorderable), `AttributeConditionEditor`, `SegmentPicker`.
- **Permissions:** Admin/flag-manager.
- **Offline:** rules are part of the cached config and evaluated on-device.
- **API:** `PUT /flags/:key/rules`, `POST /segments`.
- **DB:** `flag_rules`, `segments`, `segment_conditions`.
- **Notify:** targeting change audited + toast.
- **AC:** evaluation is deterministic and order-sensitive; an unmatched context falls to the
  default rule.

### 5.3 Gradual (percentage) rollout ✅
- **Purpose:** ramp exposure safely (1% → 5% → 25% → 100%).
- **Workflow:** the default rule (or any rule) can specify a percentage. Bucketing uses a
  **stable hash** of `hash(flagKey + userId)` so a user's assignment is sticky across
  sessions/devices and monotonic as the percentage increases (no flicker on ramp).
- **UI:** `RolloutSlider` + quick presets; shows estimated affected users.
- **Permissions:** Admin/flag-manager.
- **Offline:** bucketing computed on-device from cached percentage.
- **API:** `PATCH /flags/:key` (`rollout`).
- **DB:** `feature_flags.rollout_pct`, rule-level `rollout_pct`.
- **Notify:** rollout change audited.
- **AC:** increasing % only adds users (never removes); assignment is stable per user.

### 5.4 Kill-switch ✅
- **Purpose:** disable a feature instantly, everywhere, in an incident.
- **Workflow:** one tap → flag forced to its **off/safe** value regardless of rules; clients
  pick it up on their next poll and via a realtime `config.updated` push for near-instant
  effect. Requires a confirm + reason (written to audit).
- **UI:** prominent `KillSwitchButton` (destructive), red `KilledBadge` on the row.
- **Permissions:** Admin/Owner; optionally on-call responders via a break-glass role.
- **Offline:** clients already offline keep the last value until they reconnect; the safe
  default is chosen so "off" is always the safe state.
- **API:** `POST /flags/:key/kill`, `POST /flags/:key/unkill`.
- **DB:** `feature_flags.killed`, `killed_by`, `killed_reason`, `killed_at`.
- **Notify:** kill → high-priority operator alert (push + Slack/PagerDuty via module 32/43).
- **AC:** kill overrides all rules; effect is realtime-pushed and applied within one poll for
  offline clients on reconnect.

### 5.5 Offline default values + cached config ✅
- **Purpose:** flags must resolve correctly with zero network — from cold start.
- **Workflow:** every flag has a **compile-time default** bundled in the app; the last fetched
  config is persisted (SQLite/secure store); on boot the SDK loads cache synchronously and
  refreshes in the background. Resolution order: **local dev override → cached remote →
  bundled default**.
- **UI:** `OfflineDefaultChip` in detail; debug overlay shows which source won.
- **Permissions:** defaults set at flag creation (Admin).
- **Offline:** the whole point — evaluation never blocks on network.
- **API:** `GET /config?since=` (delta), full `GET /config`.
- **DB:** client `config_cache(payload, etag, fetched_at)`.
- **Notify:** none.
- **AC:** a flag resolves synchronously on first frame from cache/default; no UI waits on a
  network round-trip.

### 5.6 Client SDK ✅
- **Purpose:** a tiny, typed, synchronous evaluation API for the app.
- **Workflow:** `flags.bool('new_home_dashboard')`, `flags.variant('board_swimlanes')`,
  `config.number('sync.batch_size', 50)`. The SDK exposes a React hook
  `useFlag('key')` that re-renders on config refresh, an evaluation **context** builder, and
  **exposure tracking** (fires `flag_evaluated` once per key per session for experiments).
- **UI:** none (developer API) + debug overlay.
- **Permissions:** read-only evaluation for all app code.
- **Offline:** synchronous, offline-first (see 5.5).
- **API:** consumes `GET /config`; posts exposures via the analytics buffer.
- **DB:** in-memory evaluation over cached config.
- **Notify:** none.
- **AC:** evaluation is synchronous (<1ms typical), typed, and defaulted; exposure logged at
  most once per key per session unless re-evaluated with a changed value.

### 5.7 Remote config (typed constants) ✅
- **Purpose:** tune runtime values (limits, timeouts, feature copy, thresholds) without a
  release.
- **Workflow:** namespaced typed keys (`sync.batch_size`, `ai.timeout_ms`, `home.banner_text`)
  with JSON-schema validation and safe defaults; can also be targeted/rolled out like flags.
- **UI:** `ConfigNamespaceList`, `TypedValueEditor`, `SchemaValidationBadge`.
- **Permissions:** Admin; schema authored by engineering.
- **Offline:** cached + defaulted like flags.
- **API:** `PATCH /config/:namespace/:key`.
- **DB:** `remote_config_values`.
- **Notify:** config change audited + toast.
- **AC:** an out-of-schema value is rejected server-side; clients clamp to default on parse
  failure.

### 5.8 Experiment integration ✅
- **Purpose:** run A/B/n tests with metric guardrails.
- **Workflow:** link a multivariate flag to an experiment (hypothesis, primary metric,
  guardrails, target segment). Assignment = variant bucketing; exposure + outcome events flow
  to the analytics platform (module 43) for readout. Guardrail breach can **auto-halt** the
  rollout.
- **UI:** `ExperimentLinkCard`, `MetricGuardrailChip`, `AutoHaltBadge`.
- **Permissions:** Admin/PM (experiment role).
- **Offline:** assignment cached; exposures buffered offline.
- **API:** `POST /experiments`, `GET /experiments/:id/results`.
- **DB:** `experiments`, `experiment_variants`, `experiment_metrics`.
- **Notify:** experiment start/stop/auto-halt → operator alert.
- **AC:** a user's variant is sticky; guardrail breach auto-halts and pins to control.

### 5.9 Audit of flag changes ✅
- **Purpose:** every change is attributable and reversible.
- **Workflow:** each mutation writes an immutable audit row (actor, before→after, reason, ts);
  a **Rollback** restores any prior state in one tap.
- **UI:** `HistoryTab`, `AuditRow`, `DiffPreview`, `RollbackButton`.
- **Permissions:** view → Admin/Manager (scoped); rollback → Admin.
- **Offline:** history is server-authoritative (read online).
- **API:** `GET /flags/:key/history`, `POST /flags/:key/rollback`.
- **DB:** `flag_audit_log` (append-only).
- **Notify:** rollback audited + toast.
- **AC:** every change appears in history with actor + diff; rollback recreates the exact
  prior configuration.

---

## 6. Smart AI Features

Powered by the [AI Assistant & Copilot](./19-ai-assistant-copilot.md) and productivity
insights (module 36); flag-management deltas:

| Capability | What it does for flags/config |
|-----------|-------------------------------|
| **Rollout risk advisor** | Predicts blast radius of a rollout % (affected users/orgs) and suggests a safe ramp schedule. |
| **Auto-halt recommendation** | Watches guardrail metrics (module 43) and proposes/executes a kill when error or latency spikes. |
| **Stale-flag detector** | Flags that have been 100%-on (or off) for N days are surfaced as tech-debt cleanup suggestions. |
| **Experiment readout summary** | Natural-language summary of A/B results with significance + a recommended winner. |
| **Config anomaly detection** | Flags a config change correlated with a metric regression. |

All AI suggestions are **proposal-first** (Accept/Undo), logged as `ai_invoked`, and never
change production flags without an explicit operator confirmation (except a pre-authorized
auto-halt, which is itself audited).

---

## 7. Productivity Features

- **One-tap rollout presets** (1/5/10/25/50/100%) and a scheduled ramp.
- **Bulk actions** (kill all flags in a namespace during an incident).
- **Flag templates** (boolean gate, plan-gated, experiment) to create consistently.
- **Saved segments** reused across flags.
- **Copy-to-clipboard SDK snippet** for a flag key (`flags.bool('key')`).
- **Command palette** (iPad ⌘K): jump to a flag, toggle, or kill quickly.
- **Debug overlay** for engineers: force any value locally to test without touching prod.

---

## 8. Enterprise Features

- **Per-org feature availability:** gate features by org/plan (drives entitlements with
  module 31 Billing).
- **Environment separation:** `development` / `staging` / `production` configs; promotion flow
  copies rules between environments with review.
- **Approvals / change control:** production flag changes can require a second approver
  (four-eyes) for regulated orgs; changes enter a pending state until approved.
- **Break-glass on-call role:** time-boxed elevated permission to kill flags during incidents,
  fully audited.
- **Immutable audit + export:** all changes exported to SIEM (module 40) and the audit feed
  (module 29).
- **SLA-grade delivery:** config CDN with multi-region failover; signed config payloads.

**Permission matrix** (roles per [shared/rbac-permissions.md](./shared/rbac-permissions.md)):

| Action | Owner | Admin | Manager | Member | Guest |
|--------|:-----:|:-----:|:-------:|:------:|:-----:|
| Evaluate flags (app runtime) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View flag list & detail | ✅ | ✅ | scoped | ❌ | ❌ |
| Create / edit flag & rules | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change rollout % | ✅ | ✅ | ❌ | ❌ | ❌ |
| Engage kill-switch | ✅ | ✅ | break-glass* | ❌ | ❌ |
| Edit remote config values | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create / manage experiments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve production change (four-eyes) | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit / rollback | ✅ | ✅ (rollback) | view scoped | ❌ | ❌ |
| Manage environments / promotion | ✅ | ✅ | ❌ | ❌ | ❌ |

`*` break-glass = time-boxed, audited on-call elevation. All checks enforced server-side.

---

## 9. Collaboration Features

- **Ownership & watchers:** each flag has an owner; teammates can watch to get change alerts.
- **Change reasons + comments:** every mutation prompts a reason, visible in history.
- **Slack/Teams notifications** (module 32): flag flips, kills, and rollout ramps post to a
  channel with actor + diff.
- **Linked context:** a flag links to the PR/issue and the experiment it gates.
- **Handoff-friendly history:** on-call can read exactly what changed and roll back safely.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- Config is a **read-mostly, client-cached** payload (not a mutable entity queue): the SDK
  loads the last-good cache synchronously and refreshes via `GET /config?since=` with ETag.
- **Bundled compile-time defaults** guarantee evaluation from a cold, offline first launch.
- Operator mutations (from the Admin app) go through the normal outbox, but flag *evaluation*
  is always local and never blocks.
- Realtime `config.updated` (WebSocket) enables near-instant kill propagation; missed events
  are recovered by the next `since` poll.
- Safe defaults are chosen so the offline/failure state is always the **conservative** one.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Config payloads are **signed** and integrity-checked; clients reject tampered/unsigned
  configs and fall back to cached/bundled values.
- No secrets in flags/config (secrets live in EAS secrets/server); config is treated as
  low-sensitivity but still access-controlled.
- Evaluation context sent to the server is minimized (hashed `userId`, plan, platform, app
  version) — no task content or PII.
- Management endpoints require Admin + org scope; kill-switch and four-eyes changes are
  authorized server-side and rate-limited.
- All mutations are audited immutably (actor, reason, before→after) per module 29/40.

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- **Operator alerts** (not end-user): kill-switch engaged, auto-halt fired, rollout ramped,
  four-eyes approval requested — delivered via push + Slack/PagerDuty (module 32/43).
- **Watcher notifications** for changes to a flag you own/watch.
- End users receive **no** flag notifications; newly enabled features may surface via the
  normal in-app "What's new" surface, not the flag system.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Flag state is never conveyed by the color dot alone — each row includes a text state
  ("On", "25% rollout", "Killed") and an icon.
- `FlagStateSegmented`, `RolloutSlider`, and `KillSwitchButton` expose VoiceOver labels,
  values, and `accessibilityActions` ("Kill feature", "Set rollout to 50%").
- Destructive kill/rollback require an accessible confirm with a clear consequence statement.
- The rules list is operable via keyboard/Switch Control (reorder + edit) on iPad.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Rollout slider updates the affected-users estimate with a `motion.fast` cross-fade.
- Kill-switch engages with a `notificationWarning` haptic and a red state settle (no bounce).
- New audit rows slide-up + fade as history streams in.
- Rule reorder uses the standard lift + neighbor-part drag animation; Reduce Motion swaps to
  fades per the shared spec.

---

## 15. Performance

- **Evaluation:** O(rules) in-memory, memoized per (flag, context) — target <1ms; `useFlag`
  re-renders only affected subtrees on config refresh.
- **Payload size:** config is compact (rules compiled to a flat structure); delta sync via
  `since` keeps refreshes tiny; ETag/304 avoids re-download.
- **Startup:** synchronous cache load off the boot critical path; background refresh; budget
  <5ms added to cold start.
- **Bucketing:** stable hash is a cheap non-crypto hash (e.g., FNV/xxHash) computed locally.
- **Realtime:** a single multiplexed WebSocket channel (`org:{id}`) carries `config.updated`;
  no per-flag connections.
- **Debounced refresh** on foreground; no polling storms.

---

## 16. Database Design

Aligns with [17-data-model-api.md](./17-data-model-api.md).

```text
feature_flags(id, org_id?, key UNIQUE, type, description, owner_id, default_value_json,
              rollout_pct, killed, killed_by?, killed_reason?, killed_at?, environment,
              stale_since?, version, created_at, updated_at, archived_at?)
flag_variants(id, flag_id→feature_flags, variant_key, weight, payload_json)   -- multivariate
flag_rules(id, flag_id→feature_flags, order, segment_id?→segments, conditions_json,
           serve_value_json?, serve_variant?, rollout_pct?)                    -- top-down
segments(id, org_id?, key, name, description)
segment_conditions(id, segment_id→segments, attribute, op, value_json)
remote_config_values(id, org_id?, namespace, key, type, value_json, schema_json,
                     rollout_pct, environment, version, updated_at)
experiments(id, flag_id→feature_flags, name, hypothesis, primary_metric, guardrails_json,
            segment_id?→segments, status, started_at?, stopped_at?)
experiment_variants(id, experiment_id→experiments, variant_key, weight)
flag_audit_log(id, flag_id→feature_flags, actor_id, action, before_json, after_json, reason,
               created_at)                                                     -- immutable
config_cache(etag, payload_json, fetched_at)                                   -- client only
```

**Indexes:** `feature_flags(org_id, key)` UNIQUE, `feature_flags(environment, updated_at)`,
`flag_rules(flag_id, order)`, `remote_config_values(org_id, namespace, key, environment)`
UNIQUE, `flag_audit_log(flag_id, created_at)`, `experiments(flag_id, status)`.
**Constraints:** multivariate `weight` sums to 100 per flag; `rollout_pct ∈ [0,100]`; a killed
flag ignores rules at evaluation; `default_value_json` type matches the flag `type`.
**Soft-delete** via `archived_at`. **Audit/history** table is append-only; rollback writes a
new audit row (never mutates prior rows).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/config?since=<cursor>&env=production` | Delta config bundle for a client (ETag) |
| GET | `/config` | Full config bundle (cold cache) |
| GET | `/flags?filter[type]=boolean&filter[status]=on` | List flags (admin) |
| POST | `/flags` | Create a flag |
| PATCH | `/flags/:key` (If-Match) | Update state/rollout/default |
| PUT | `/flags/:key/rules` | Replace ordered targeting rules |
| POST | `/flags/:key/kill` · `/flags/:key/unkill` | Kill-switch |
| POST | `/flags/:key/rollback` | Restore a prior version |
| GET | `/flags/:key/history?cursor=` | Audit trail |
| POST | `/segments` · `PATCH /segments/:id` | Reusable segments |
| PATCH | `/config/:namespace/:key` | Typed remote config value |
| POST | `/experiments` · `GET /experiments/:id/results` | Experiment lifecycle |

**Realtime:** channel `org:{id}` emits `config.updated` (`{ changedKeys[] }`) and
`flag.killed`. Clients reconcile by config `version`; missed events recovered via
`GET /config?since=`. **Errors:** `422 validation_failed` (weights≠100, out-of-schema),
`403 forbidden` (non-admin), `409 conflict` (If-Match version). **Idempotency-Key** on all
mutations.

**Sample request/response**
```http
POST /v1/flags/new_home_dashboard/kill
Authorization: Bearer <admin-token>
Idempotency-Key: 7c9e...
Content-Type: application/json

{ "reason": "elevated crash rate on Home (SEV2 incident #4821)" }
```
```json
{
  "data": {
    "key": "new_home_dashboard",
    "killed": true,
    "killedBy": "u_admin_12",
    "killedReason": "elevated crash rate on Home (SEV2 incident #4821)",
    "killedAt": "2026-07-16T04:12:07Z",
    "servedValue": false,
    "version": 41,
    "propagation": { "realtime": "pushed", "estimatedClientsPolling": "<= 60s" }
  },
  "meta": { "requestId": "req_a71f" }
}
```

---

## 18. Edge Cases

- **Cold start, never fetched:** evaluate from bundled compile-time defaults; refresh in bg.
- **Stale cache (long offline):** keep last-good config; show operator "config age" in debug;
  safe defaults ensure conservative behavior.
- **Tampered/unsigned config:** rejected; fall back to cache/default; security event logged.
- **Weights don't sum to 100:** rejected at save; runtime normalizes defensively.
- **User has no matching rule:** default rule / default value applies.
- **Percentage decreased:** users bucketed out are handled gracefully (feature hides on next
  evaluation; state persisted to avoid data loss where relevant).
- **Kill during active use:** feature disables on next evaluation/route; in-flight operations
  complete or roll back cleanly (no partial state).
- **Flag deleted while referenced in code:** SDK returns the code-supplied default; a lint/CI
  check flags orphaned keys.
- **Clock skew / rollout race:** server `version` authoritative; last write wins on `If-Match`.
- **Experiment stopped mid-session:** users pin to control; exposures already logged remain.
- **Two admins edit concurrently:** `409 conflict` → show server copy + re-apply.
- **Realtime down:** polling `since` still converges; kill still applies within one poll.
- **Config parse failure on a single key:** clamp that key to default; don't discard the whole
  bundle.

---

## 19. User States

- **End user:** never sees flags; simply gets the enabled experience; assignment is sticky.
- **First-time operator:** empty flag list with a template-driven "create your first flag".
- **Returning operator/PM:** search, filters, rollout presets, experiment readouts.
- **Manager:** scoped read of relevant flags; break-glass kill only during incidents.
- **Admin:** full CRUD, kill, rollback, config, experiments, four-eyes approvals.
- **Owner:** plan-gating + environment/promotion + billing-linked entitlements.
- **On-call responder:** break-glass elevation to kill, time-boxed and audited.
- **Offline / poor network:** evaluation from cache/default; admin edits queue.
- **Tablet/landscape:** two-pane management; command palette.
- **Dark mode / large text / a11y:** state conveyed by text+icon, not color alone.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md) (no PII; context is
minimized/hashed).

| event | key properties |
|-------|----------------|
| `flag_evaluated` | `flag_key`, `value`/`variant`, `reason` (rule/rollout/default/kill), `source` (cache/remote/default) |
| `flag_exposure` | `flag_key`, `variant`, `experiment_id?` (once per key/session) |
| `flag_changed` | `flag_key`, `change_type` (state/rollout/rules), `actor_role` |
| `flag_killed` / `flag_unkilled` | `flag_key`, `reason_present` |
| `flag_rollback` | `flag_key`, `to_version` |
| `rollout_ramped` | `flag_key`, `from_pct`, `to_pct` |
| `config_updated` | `namespace`, `key`, `changed_keys_count` |
| `config_fetch` | `source` (delta/full), `bytes`, `duration_ms`, `not_modified` |
| `experiment_started` / `experiment_stopped` | `experiment_id`, `variant_count` |
| `experiment_auto_halted` | `experiment_id`, `guardrail` |
| `ai_invoked` | `capability` (rollout_risk/auto_halt/stale_flag), `accepted` |

`flag_exposure` is the join key for experiment analysis in the observability/analytics
platform (module 43); it is de-duped per key per session.

---

## 21. Acceptance Criteria

1. Every flag resolves to a defined value at all times (never `undefined`).
2. Evaluation is synchronous (<1ms typical) and works on the first frame from cache/default.
3. Bundled compile-time defaults make flags resolve from a cold, offline first launch.
4. Resolution order is local override → cached remote → bundled default.
5. Boolean flags return true/false; multivariate returns a variant + typed payload.
6. Multivariate variant weights are validated to sum to 100%.
7. Targeting rules evaluate top-down; the first matching rule wins.
8. Rule conditions support plan, org, role, platform, app version, locale, device, allowlist.
9. Reusable segments encapsulate conditions and are shared across flags.
10. Percentage rollout uses a stable hash so assignment is sticky per user.
11. Increasing rollout % only adds users; a user never flickers out on ramp-up.
12. The kill-switch overrides all rules and forces the safe value.
13. Kill requires a confirm + reason, which is written to the audit log.
14. Kill propagates via realtime push and applies within one poll for offline clients.
15. Safe defaults ensure the offline/failure state is the conservative one.
16. The client SDK exposes typed `bool`/`variant`/`config` APIs and a `useFlag` hook.
17. `useFlag` re-renders only affected subtrees on config refresh.
18. Exposure (`flag_exposure`) is logged at most once per key per session.
19. Remote config supports typed values with JSON-schema validation.
20. Out-of-schema config values are rejected server-side and clamped to default on the client.
21. Experiments link to a multivariate flag with a primary metric and guardrails.
22. A user's experiment variant is sticky across sessions and devices.
23. Guardrail breach can auto-halt an experiment and pin users to control.
24. Every flag/config mutation writes an immutable audit row (actor, before→after, reason).
25. Any prior flag state can be restored via one-tap rollback.
26. Rollback recreates the exact prior configuration and is itself audited.
27. Config payloads are signed; tampered/unsigned configs are rejected with fallback.
28. Delta config sync uses `since` + ETag; unchanged fetches return 304.
29. Production changes can require four-eyes approval for regulated orgs.
30. A break-glass on-call role can kill flags with time-boxed, audited elevation.
31. Per-org/plan gating drives entitlements consistent with Billing (module 31).
32. Environments (dev/staging/prod) are separated with a reviewed promotion flow.
33. Operator alerts fire on kill, auto-halt, ramp, and approval requests (not to end users).
34. End users receive no flag notifications.
35. Flag state is conveyed by text + icon, never color alone (a11y).
36. Kill/rollback controls have accessible confirms stating the consequence.
37. Concurrent admin edits return `409 conflict` with the server copy.
38. Orphaned/stale flags are detected and surfaced as cleanup debt.
39. Analytics events carry no PII and use hashed/minimized context.
40. A debug overlay lets engineers force local values without touching production.
41. All management endpoints enforce Admin + org scope server-side.
42. A single config parse failure clamps that key to default without discarding the bundle.

---

## 22. Future Roadmap

- **V1 (✅):** boolean & multivariate flags, targeting rules + segments, percentage rollout,
  kill-switch, offline defaults + cached config, typed client SDK + `useFlag`, remote config,
  experiment integration basics, full audit + rollback, per-org/plan gating.
- **V1.1 (🔜):** four-eyes approvals, scheduled ramps, break-glass on-call role, Slack/Teams
  change notifications, stale-flag detector, richer experiment readouts.
- **V2 (🟣):** metric-driven **auto-halt** wired to observability guardrails, environment
  promotion workflow, mutually-exclusive experiment groups (holdouts), config schema registry.
- **Future (💡):** progressive delivery tied to release health (auto-ramp on green metrics),
  cross-platform flag parity dashboard, self-serve entitlement editor for sales.
- **Experimental (🧪):** AI-driven autonomous rollout ("ramp to 100% if guardrails hold"),
  bandit-style experiment optimization.
- **AI track:** rollout risk advisor, experiment significance summaries, config anomaly
  detection (module 36/43).
- **Enterprise track:** signed multi-region config CDN, SIEM export of all flag changes,
  per-flag change-management workflows with ticket linkage.
