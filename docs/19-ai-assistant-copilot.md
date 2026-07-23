# 19 · AI Assistant & Copilot

> Follows the [Master PRD Template](./00-prd-template.md). This is the second
> reference-depth exemplar. "Numil AI" is a cross-cutting copilot that lives everywhere
> (task, project, home, chat) and also has a dedicated surface.

---

## 1. Purpose

Numil AI turns natural intent into structured work and removes planning drudgery. It is the
capability that lets Numil compete with **Motion** (auto-scheduling), **ClickUp AI**,
**Notion AI**, and **Linear** while staying calm and native.

**User problems solved**
- Capturing/organizing tasks is manual and slow → NLP capture + auto-structure.
- Planning a day/week is cognitively expensive → AI day/week planning + smart scheduling.
- Estimating and prioritizing is guesswork → AI estimates, prioritization, risk detection.
- Finding things across tasks/docs/comments is hard → semantic + context-aware chat.

**User goals:** "Add my tasks by talking", "Plan my day", "Break this down", "What's at
risk?", "Summarize this project", "Draft a reply".

**Business goals:** differentiation, higher activation/retention, a monetizable premium
tier (AI credits/seats), and enterprise governance (controls + auditability of AI).

**KPIs:** `ai_invoked` volume + **acceptance rate**, tasks created via AI, planning
adoption, time-to-plan reduction, premium conversion attributable to AI.

---

## 2. Navigation

**Entry points (ubiquitous but unobtrusive)**
- **Composer ✨ button** on Task Detail, comments, project, home.
- **Global Copilot** — invoked from a persistent floating "✨" in the More tab and via the
  **command palette** (pull-down on Home / ⌘K on iPad).
- **Quick Add NLP bar** — every quick-add parses natural language.
- **Contextual AI** in menus ("Summarize", "Break down", "Reschedule").
- Deep link `numil://ai?prompt=...`; Siri/Shortcuts (see module 34).

**Route:** `src/app/ai/index.tsx` (Copilot chat) + inline `AISheet` components. Copilot is
a **sheet** (medium→large) from anywhere; the dedicated screen is a **push** from More.

**Hierarchy/breadcrumbs:** Copilot shows the active **context scope** chip
(Global / This project / This task) that the user can change.

**Transitions:** AI sheet `spring.gentle`; streamed responses fade in per chunk.

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│  ✨ Numil AI            Context: This project ▾ │  ← scope selector
├───────────────────────────────────────────────┤
│  Suggestions                                    │
│  [ Plan my day ] [ Summarize ] [ What's at risk?]│ ← suggestion chips (carousel)
├───────────────────────────────────────────────┤
│                                                 │
│  🧑 Break the launch into subtasks              │  ← user bubble
│  ✨ Here are 6 subtasks:                         │  ← streaming answer
│     ◻ Draft copy   ◻ Design hero  …             │
│     [ Add all ]  [ Pick… ]  [ Undo ]            │  ← action buttons on proposals
│                                                 │
├───────────────────────────────────────────────┤
│  [ 🎤  📎  🖼  📷 ]  Ask or describe a task…  ➤ │  ← multimodal input
└───────────────────────────────────────────────┘
```

- **Top:** title + **context scope** selector (Global/Project/Task) + history.
- **Middle:** suggestion chips (context-aware), then the conversation. AI **proposals**
  render as **preview cards** (tasks/subtasks/schedule) with explicit **Accept / Edit /
  Undo** — AI never mutates data without confirmation.
- **Bottom:** multimodal composer: text, **voice** (dictation), **attach doc**, **image/
  screenshot** (OCR), **camera**. Grows with input; above keyboard + safe area.
- **Empty state:** friendly intro + example prompts + privacy note ("AI uses your
  workspace data; nothing is used to train external models" — per org policy).
- **iPad/landscape:** Copilot as a right-hand panel alongside the current screen (works on
  the visible context live).
- **Dynamic Island / Live Activity:** long AI jobs (e.g., "planning your week") show
  progress in the Island.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Header | `AITitleBar`, `ContextScopeSelector` (popover), `AIHistoryButton` |
| Suggestions | `SuggestionChipCarousel`, `SuggestionChip` |
| Conversation | `ChatList` (virtualized), `UserBubble`, `AIBubble` (streaming), `TypingDots`, `CodeBlock`, `MarkdownRenderer` |
| Proposals | `TaskProposalCard`, `SubtaskProposalList`, `SchedulePreview` (mini calendar), `DiffPreview` (before→after), action bar `[Accept][Edit][Undo]` |
| Input | `MultimodalComposer`, `VoiceRecorder`, `AttachmentButton`, `ImageCapture`, send |
| Feedback | `Skeleton`, `StreamingCursor`, `Toast`, `Banner` (quota/offline), `RateLimitCard`, `FeedbackThumbs` (👍/👎) |
| Governance | `AIDisclosureBadge`, `CreditMeter`, `SourceCitationChip` (for RAG answers) |

---

## 5. Modern Features

Each: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Natural Language capture (Todoist/Fantastical)
- **Purpose:** create fully-structured tasks by typing/speaking.
- **Workflow:** "Email Priya the deck tomorrow 4pm !high #launch every Fri" → parses due,
  time, priority, label, recurrence, assignee.
- **UI:** inline parse highlights in Quick Add; confirm chip preview.
- **Permissions:** create scope. **Offline:** on-device lightweight parser handles dates/
  priority/labels; server LLM enrich when online. **API:** `POST /ai/parse`.
- **DB:** creates `tasks`. **Notify:** as normal task creation.
- **AC:** parses date/time/priority/label/recurrence/assignee; editable before save.

### 5.2 AI Task Breakdown / Subtask generation (ClickUp/Notion)
- Generates subtasks from a task; **Accept all / pick**; logs acceptance.
- `POST /tasks/:id/ai/breakdown` → proposal (no write until accept).

### 5.3 Smart Scheduling & AI Day/Week Planning (Motion/Sunsama)
- **Purpose:** auto-fit tasks into free calendar time by priority, due, duration, energy.
- **Workflow:** "Plan my day" → proposes time blocks respecting meetings, working hours,
  focus prefs; user accepts/tweaks; writes `scheduledAt` + calendar blocks.
- **UI:** `SchedulePreview` timeline with drag to adjust before accepting.
- **API:** `POST /ai/plan` (scope=day|week). **Offline:** requires network (heuristic
  fallback: sort by priority/due only). **AC:** never double-books; respects quiet/working
  hours; fully reversible.

### 5.4 Auto Prioritization & Deadline/Workload Prediction (Linear/Motion)
- Suggests priority; predicts realistic completion date from historical throughput;
  flags overload. `POST /ai/prioritize`, `/ai/predict`.

### 5.5 Semantic & Smart Search (see module 14 / 27)
- Natural-language + vector search across tasks/comments/docs with **source citations**.
- `POST /ai/search` → results + `SourceCitationChip`s. Respects permissions (never returns
  inaccessible content).

### 5.6 Context-aware Project Chat / Knowledge Assistant (Notion Q&A)
- Ask questions about a project ("what's blocking launch?"); RAG over project tasks, docs,
  comments the user can access. Cites sources; refuses out-of-scope.

### 5.7 Summaries & Action-item extraction
- Summarize a project/thread/doc; extract action items → propose tasks with assignees/dates.
- **Meeting notes / Email / Document → tasks** (paste or attach → extract tasks).

### 5.8 Multimodal capture: Voice / OCR / Screenshot / Photo → task
- Voice dictation → parsed task(s); image/screenshot OCR → task with detected date.
- `POST /ai/extract` (multipart). Offline: capture stored, processed on reconnect.

### 5.9 AI Recurring rules & AI auto-labels/tags
- Suggests recurrence ("looks weekly — repeat?") and labels from content.

### 5.10 Smart Replies & Copilot writing
- 1-tap comment replies; rewrite/expand/shorten/translate description or comment.

### 5.11 AI Risk Detection & Project Health (module 36 deep-dives)
- Detects at-risk tasks/projects (slipping dates, overload, stale) → surfaced as insights.

---

## 6. Smart AI Features

This *is* the AI module, so Section 6 doubles as the capability registry consumed by other
modules. Capability catalog (each has a stable `capability` id for analytics + governance):

| capability | Surface | Write? |
|-----------|---------|--------|
| `nl_parse` | quick add | creates (after confirm) |
| `task_breakdown` | task | proposes subtasks |
| `subtask_generate` | task/project | proposes |
| `smart_schedule` | task/day/week | proposes blocks |
| `day_plan` / `week_plan` | home/calendar | proposes |
| `time_estimate` | task | fills duration (confirm) |
| `auto_prioritize` | task/list | suggests |
| `deadline_predict` / `workload_predict` | task/reports | read-only insight |
| `meeting_detect` | calendar | suggests focus blocks around meetings |
| `summarize` | project/thread/doc | read-only |
| `action_items` | thread/notes/email | proposes tasks |
| `semantic_search` | search | read-only |
| `project_chat` (RAG) | project | read-only |
| `smart_reply` | comments | drafts (confirm to send) |
| `rewrite` | text fields | edits (confirm) |
| `auto_label` | task | suggests |
| `voice_to_task` / `ocr_to_task` / `screenshot_to_task` / `email_to_task` / `doc_to_task` | capture | proposes |
| `risk_detect` / `project_health` / `productivity_score` | insights | read-only |
| `focus_suggest` | focus mode | suggests |

**Guardrails (all capabilities):** proposal-first (Accept/Edit/Undo), permission-scoped
context only, citations for factual answers, no external-model training on org data
(configurable), full audit of AI actions, and per-org enable/disable + credit quotas.

---

## 7. Productivity Features

- **AI Daily Planning / Weekly Review** rituals (Sunsama-style): morning "Plan my day",
  evening "Shut down" summary; Monday "Week ahead", Friday "Week in review".
- **AI Time Estimation & Focus Mode suggestions** (what to focus on now).
- **Energy-aware scheduling** using the user's energy/effort tags.
- **Productivity score** narrative ("You completed 18 tasks, 92% on time").

---

## 8. Enterprise Features

- **AI governance console** (admin): enable/disable capabilities per role, data-residency &
  no-train toggle, model selection, **credit/quotas** per seat, and **full AI audit log**
  (prompt metadata, capability, accepted?, cost) — content redaction respects privacy.
- **DLP:** prevent AI from surfacing content outside a user's permission scope.
- **BYO-key / private model** (🟣) for regulated orgs.

---

## 9. Collaboration Features

- Copilot can post (with confirmation) summaries/action-items into comments or a project doc.
- **Shared AI threads** 🟣 (team sees a project's AI Q&A).
- Smart replies + mention suggestions in comments.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **On-device** lightweight NLP (dates/priority/labels) works offline (via Apple
  Intelligence/`NaturalLanguage` where available — see module 34).
- Server LLM capabilities require network → queued "process when online" for captures;
  clear affordance that AI is unavailable offline.
- AI proposals are **not** persisted until accepted (no offline mutation ambiguity).

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Prompts/context scoped to caller permissions (server enforces; RAG retrieval filtered).
- No task content in analytics; AI audit stores metadata + hashes, not raw content, unless
  org opts in for debugging.
- Rate-limited + quota-metered; prompt-injection defenses on RAG (content treated as data).
- Optional no-retention / no-train contractual mode; region pinning (enterprise).

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- Long jobs (week planning) → Live Activity + completion notification.
- "AI found 3 at-risk tasks" digest insight (opt-in).
- Quota warnings ("80% of AI credits used").

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- Streaming answers announced politely (not spammy) via `accessibilityLiveRegion`.
- Proposal cards expose Accept/Edit/Undo as labeled actions.
- Voice input has a visible transcript; all AI outputs have text (no audio-only).

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Token streaming cursor pulse; per-chunk fade-in.
- Proposal accept → items animate into the list (shared-element to their destination).
- Sparkle micro-animation on the ✨ button (disabled under Reduce Motion).

---

## 15. Performance

- Stream responses (SSE/websocket) for perceived speed; cancelable.
- Client caches recent Copilot context; debounced NL parse as the user types.
- Vector search server-side; results paginated. On-device models run off main thread.
- Strict timeouts + graceful fallback to heuristics.

---

## 16. Database Design

```text
ai_conversations(id, org_id, user_id, scope_type, scope_id?, created_at)
ai_messages(id, conversation_id→ai_conversations, role, content_json, created_at)
ai_actions(id, org_id, user_id, capability, target_type, target_id?, accepted, tokens_in,
           tokens_out, cost, model, latency_ms, created_at)         -- audit + billing
ai_embeddings(id, org_id, entity_type, entity_id, vector, updated_at) -- RAG index (pgvector)
ai_quota(org_id, period, credits_used, credits_limit)
ai_settings(org_id, enabled_capabilities[], no_train, model, region)
```
**Indexes:** `ai_actions(org_id, created_at)`, `ai_embeddings` ANN index (ivfflat/hnsw),
`ai_messages(conversation_id, created_at)`. **Retention:** conversations honor org policy;
embeddings deleted on source delete (cascade) for GDPR.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/ai/parse` | NL → structured task |
| POST | `/ai/chat` (SSE stream) | Copilot conversation (scoped) |
| POST | `/ai/plan` | Day/week scheduling proposal |
| POST | `/tasks/:id/ai/breakdown` | Subtask proposal |
| POST | `/ai/estimate` `/ai/prioritize` `/ai/predict` | Estimates/priority/risk |
| POST | `/ai/summarize` `/ai/action-items` | Summaries/extraction |
| POST | `/ai/search` | Semantic search (cited) |
| POST | `/ai/extract` (multipart) | Voice/OCR/screenshot/email/doc → tasks |
| GET | `/ai/quota` | Remaining credits |
| GET/PUT | `/orgs/:id/ai/settings` | Governance |
| GET | `/ai/audit?cursor=` | AI action audit (admin) |

- **Streaming:** `POST /ai/chat` returns SSE tokens; client can `abort`.
- **Idempotency-Key** on capture/plan writes; proposals are read-only until an explicit
  `POST /ai/proposals/:id/accept`.
- **Errors:** `429 rate_limited` (quota), `403` (capability disabled/scope), `422` (unparseable).

---

## 18. Edge Cases

- **Offline:** server AI disabled → on-device parse only; captures queued.
- **Quota exhausted:** graceful card + upsell; core app unaffected.
- **Ambiguous NL** ("next Friday" near DST/tz): show interpreted value for confirmation.
- **RAG over deleted/again-restricted content:** retrieval filtered; citations validated at
  answer time; stale → omitted.
- **Proposal accepted after context changed** (task deleted/moved): validate on accept,
  skip invalid items with notice.
- **Prompt injection** in task/comment content: treated as untrusted data, never instructions.
- **Hallucinated assignee/project:** matched against real members/projects; unmatched → left blank.
- **Model/provider outage:** fallback model or heuristic; clear "AI unavailable" state.
- **Multi-device:** conversations sync; streaming continues on the initiating device.

---

## 19. User States

- **First-time:** intro + example prompts + privacy explainer; opt-in.
- **Returning/power:** command palette, keyboard, saved prompts, planning rituals.
- **Guest:** AI limited to shared scope; may be disabled by org.
- **Manager/Admin:** insights (risk/health/workload); Admin sees governance + audit.
- **Owner:** billing/credits.
- **Offline/poor network:** on-device only; queued captures; no dead spinners.
- **Tablet/landscape:** side-panel copilot.
- **Dark/large text/a11y:** streaming announced; proposals labeled; Reduce Motion respected.

---

## 20. Analytics Events

| event | properties |
|-------|-----------|
| `ai_opened` | `surface`, `scope` |
| `ai_invoked` | `capability`, `accepted`, `latency_ms`, `tokens`, `offline_fallback` |
| `ai_proposal_shown` | `capability`, `items` |
| `ai_proposal_accepted` | `capability`, `items_accepted`, `items_total` |
| `ai_feedback` | `capability`, `rating` (up/down) |
| `ai_quota_warning` / `ai_quota_exhausted` | `percent` |
| `ai_setting_changed` | `capability`, `enabled` |

---

## 21. Acceptance Criteria

1. ✨ entry points exist on task, project, home, comments, quick add.
2. Copilot opens as a sheet anywhere and as a full screen from More.
3. Context scope (Global/Project/Task) selectable and enforced.
4. NL parse extracts date/time/priority/label/recurrence/assignee; editable before save.
5. On-device parse works offline for dates/priority/labels.
6. Server captures queued offline are processed on reconnect.
7. Every write is proposal-first with Accept/Edit/Undo.
8. Task breakdown proposes subtasks; Add all / pick works; acceptance logged.
9. "Plan my day/week" proposes blocks respecting meetings + working/quiet hours; no double-book.
10. Schedule proposals are editable (drag) before accept and fully reversible.
11. Time estimate/priority/prediction return values with rationale.
12. Semantic search returns permission-scoped results with source citations.
13. Project chat (RAG) answers only from accessible content and cites sources.
14. Summaries + action-item extraction produce editable task proposals.
15. Voice/OCR/screenshot/email/doc → tasks populate fields; date detection works.
16. Smart replies draft but never send without confirmation.
17. Rewrite/translate edits apply only on confirm.
18. Responses stream token-by-token and are cancelable.
19. Rate limits/quota return graceful cards; core app unaffected.
20. Prompt-injection content is treated as data, not instructions.
21. Hallucinated members/projects are dropped, not invented.
22. AI actions recorded in `ai_actions` audit (capability, accepted, cost).
23. Org governance can enable/disable capabilities per role.
24. No-train/region settings respected; no task content in analytics.
25. Quota metering accurate; owner sees credit usage.
26. Long jobs show Live Activity + completion notification.
27. Proposal accepted after context change validates and skips invalid items.
28. Model outage falls back gracefully with clear messaging.
29. VoiceOver announces streaming politely; proposals have labeled actions.
30. Reduce Motion disables sparkle/stream animations; content still fades minimally.
31. iPad shows side-panel copilot operating on the visible context.
32. Multi-device conversations sync.
33. Feedback (👍/👎) captured per capability.
34. All AI text outputs have accessible text alternatives (no audio-only).
35. Cost/latency within budget; timeouts trigger fallback, never hang.

---

## 22. Future Roadmap

- **V1 (✅):** NL parse (on-device + server), task breakdown, summarize, action-items,
  smart reply, rewrite, basic semantic search, quota + governance basics, audit.
- **V1.1 (🔜):** day/week planning (Motion-style), OCR/screenshot/email→task, auto-labels,
  time estimate, project chat (RAG) with citations.
- **V2 (🟣):** shared AI threads, risk/health/productivity insights suite, BYO-key/private
  model, custom prompt library per org, autonomous multi-step "agents".
- **Future (💡):** proactive assistant ("you have a gap at 2pm — want to knock out X?"),
  cross-tool agent (acts across integrations).
- **Experimental (🧪):** on-device fine-tuned personal model; fully autonomous execution
  with approval gates.
- **AI track:** deep Apple Intelligence integration (module 34).
- **Enterprise track:** eDiscovery of AI interactions, per-capability cost centers.
