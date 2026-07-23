# 27 · Whiteboard & Brainstorming

> Follows the [Master PRD Template](./00-prd-template.md). The Whiteboard is Numil's infinite
> canvas for thinking visually — sticky notes, shapes, connectors, drawing, and templates —
> with live multiplayer cursors and **Apple Pencil**. The hard constraint: a **mobile
> whiteboard must feel light and finger-friendly, not like a cramped desktop tool.** Power is
> progressive; the default is "drop a sticky and go."

---

## 1. Purpose

The Whiteboard lets teams brainstorm, map, and plan visually, then **turn ideas into tracked
work** — a sticky becomes a task in one tap. It competes with **Miro, FigJam, and Apple
Freeform**, but is designed thumb-first for iPhone and Pencil-first for iPad, and is wired
into Numil's tasks/projects so a workshop's output doesn't die on the canvas.

**User problem it solves.** Brainstorming tools are desktop-heavy and disconnected from
execution. On a phone they feel impossible (tiny targets, fiddly zoom). Numil's whiteboard
must be **genuinely usable on a phone** (large touch targets, gesture-native pan/zoom, a
calm toolbar) while scaling to a rich Pencil canvas on iPad — and every idea can convert into
a task/doc so the thinking becomes doing.

**User goals**
- Capture ideas fast: drop sticky notes, type, move — no manual required.
- Cluster, connect, and structure ideas (frames, connectors, templates).
- Draw/annotate naturally with Apple Pencil (and finger).
- Brainstorm together in realtime (see teammates' cursors and selections).
- Convert stickies/shapes into tasks and export the board.

**Business goals**
- Differentiate as an all-in-one (chat + docs + boards + tasks) vs point tools.
- Drive collaborative activation (workshops pull whole teams in) and premium (unlimited
  boards, advanced templates, video-in-board).
- Feed execution: boards that generate tasks increase downstream engagement.

**KPIs:** `board_created`, active collaborators per board, `sticky_to_task` conversions,
template usage, multiplayer sessions (≥2 concurrent), Pencil adoption on iPad, export rate,
time-to-first-sticky.

**Status:** infinite canvas, stickies/shapes/connectors/text/pen, templates, sticky→task,
export, offline ✅ v1; live multiplayer cursors + CRDT co-editing 🔜→🟣; video/voice on board
💡; AI clustering/diagram-from-text 🔜.

---

## 2. Navigation

**Entry points**
- **Boards** section in the [sidebar](./04-navigation-sidebar.md) → board gallery.
- Project screen → **Boards** tab (project-scoped boards).
- "＋ New" → **Whiteboard** (blank or from template).
- From chat/doc: "Open whiteboard" link/embed → board.
- Deep links: `numil://board/{boardId}`, `numil://board/{boardId}?frame={frameId}` (jump to
  a frame/region), `numil://board/{boardId}?present=1` (presentation mode).

**Route:** `src/app/boards/index.tsx` (gallery), `src/app/board/[id].tsx` (canvas). The canvas
is always a **full-screen push** (immersive; tab bar + nav auto-hide). Board **details/
settings** and **sticky→task** open as **sheets** over the canvas so canvas context is kept.

**Navigation hierarchy & breadcrumbs**
```text
Workspace ▸ Project (or "My Boards") ▸ [Board name]
On-canvas: Frame ▸ region (minimap shows position)
```

**Transitions**
- Gallery card → canvas: shared-element hero on the board thumbnail (`motion.slow`).
- Enter canvas: chrome fades; a minimal floating toolbar fades in.
- Frame jump / fit-to-content: eased camera pan+zoom (`motion.base`).

**Modal vs push**
- **Push** for the canvas (owns immersion + camera state).
- **Sheet** for object inspector, sticky→task, share, template picker, and export.

---

## 3. Complete UI Layout

Radically minimal at rest: an infinite canvas with **one floating toolbar** (a thumb-reachable
pill) and a small zoom/minimap control. No desktop-style ribbons. Tools reveal options only
when selected.

```text
┌───────────────────────────────────────────────┐
│  ‹        Launch Brainstorm       🟢🟢  ⤴ ⋯     │  ← glass nav (auto-hides): presence + share
│                                                 │
│        ┌────────────┐        ╭───────────╮      │
│        │  Idea A     │───────▶│  Idea B    │     │  ← sticky → connector → sticky
│        └────────────┘        ╰───────────╯      │
│                  ╲                              │
│                   ╲   ┌──────────────┐          │
│                    ▶  │  Frame: MVP   │          │  ← frame (grouping container)
│                       │  • ◻ ◻ ◻       │          │
│                       └──────────────┘          │
│                                                 │
│                                       ┌───────┐ │
│                                       │ ▚ mini │ │  ← minimap (tap to navigate)
│                                       └───────┘ │
├───────────────────────────────────────────────┤
│   ⟵undo ⟶redo   ┌───────────────────────────┐  │
│                 │ 🖐 ▧sticky ▭shape ↘connect ✎pen│ │  ← floating tool pill (thumb zone)
│                 │  🅣text  🖼img  ✨AI   ➕more   │ │
│                 └───────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- **Top (auto-hiding):** glass nav — back, editable board name, **live presence avatars**,
  share, `•••` (templates, export, board settings, present mode, version). Fades away while
  interacting; taps bring it back. Respects Dynamic Island + safe areas.
- **Canvas:** the star. **Gestures** — one-finger drag = pan; pinch = zoom; two-finger = pan
  while zoomed; tap = select; long-press empty = context add; double-tap empty = new sticky.
  A subtle **dot grid** and optional snap. **Fit / 100% / zoom** control bottom-right with a
  tappable **minimap**.
- **Floating tool pill (bottom, thumb zone):** Select/Hand, **Sticky**, Shape, Connector,
  **Pen** (Pencil), Text, Image, **✨AI**, and "＋ more" (frame, template, stamp, laser
  pointer). Selecting a tool reveals a compact **contextual bar** (e.g., sticky color, pen
  width/color) — never a permanent ribbon. Undo/redo flank the pill.
- **Selection:** tapping an object shows a small **radial/inline action bar** (color, delete,
  duplicate, **→ Task**, comment, lock, bring-to-front) near the object, not a distant panel.
- **Empty state:** a friendly prompt ("Double-tap to add a sticky") + template chips + Pencil
  hint on iPad.
- **Landscape / iPad:** the canvas shines — **Apple Pencil** for pen/handwriting (PencilKit),
  hover preview (Pencil 2/Pro), double-tap/squeeze tool switch; optional left **tool rail** and
  right **inspector**; external keyboard shortcuts (V/S/T/P tools, ⌘Z, space-drag to pan).
  **Presentation mode** hides all chrome and follows frames.
- **Tab bar:** hidden on canvas.

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Nav | `GlassNavBar` (auto-hide), `BoardTitleInline`, `PresenceAvatars`, `ShareButton`, `•••` `ContextMenu` |
| Canvas | `InfiniteCanvas` (Skia/GPU), `CameraController` (pan/zoom worklets), `DotGrid`, `SnapGuides`, `SelectionLayer`, `Minimap`, `ZoomControl`, `FitButton` |
| Objects | `StickyNote`, `ShapeNode` (rect/ellipse/diamond/triangle/arrow), `Connector` (straight/elbow/curved, arrowheads), `TextObject`, `ImageObject`, `Frame` (container), `InkStroke` (Pencil), `Stamp`/`Emoji`, `EmbedObject` (doc/task/link 🔜) |
| Tools | `ToolPill`, `ToolButton`, `ContextualToolBar` (color/width/font), `ColorPalette`, `PenSettings`, `StrokeWidthSlider`, `LaserPointer`, `EraserTool` |
| Selection | `ObjectActionBar` (radial/inline), `TransformHandles` (resize/rotate), `AlignDistributeMenu`, `LockBadge`, `GroupBadge` |
| Collaboration | `LiveCursor` (name + color), `RemoteSelectionOutline`, `FollowUser` (spotlight), `CommentPin`, `ReactionBurst` (emoji), `PresenceAvatars` |
| Sticky→work | `StickyToTaskSheet`, `TaskRefBadge` (live status), `ClusterToTasksSheet` |
| Templates | `TemplateGallery`, `TemplateCard`, `SaveAsTemplateButton` |
| History/present | `VersionHistorySheet`, `SnapshotThumb`, `PresentModeBar`, `FrameStrip` |
| AI | `AIButton` (✨), `AIClusterCard`, `DiagramFromTextSheet`, `SummarizeBoardCard` |
| Feedback | `Skeleton`, `Toast` (undo), `Banner` (offline/read-only/conflict), `SyncBadge`, `ConfirmDialog` |

Primitives from [03-design-system-ui.md](./03-design-system-ui.md). Canvas rendering uses a
GPU-backed surface (Skia/`react-native-skia`) with Reanimated worklets for camera + drag.

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Infinite canvas with gesture pan/zoom (Miro/Freeform) ✅
- **Purpose:** unbounded space to think, navigable by thumb.
- **Workflow:** drag to pan, pinch to zoom (10%–400%), double-tap to zoom to fit an object;
  minimap tap to jump; "Fit to content" and "100%" shortcuts.
- **UI:** `InfiniteCanvas`, `Minimap`, `ZoomControl`, `FitButton`.
- **Permissions:** Viewer can pan/zoom; Editor+ modifies (see §8 matrix).
- **Offline:** fully navigable/editable offline; camera state local.
- **API:** board fetched once (`GET /boards/:id`); objects stream via realtime deltas.
- **DB:** camera not persisted server-side (per-user local); board bounds derived.
- **Notify:** none.
- **AC:** 60fps pan/zoom on thousands of objects; minimap reflects position; gestures never
  fight scroll.

### 5.2 Sticky notes & text (FigJam) ✅
- **Purpose:** the atomic idea unit — fast, colorful, legible.
- **Workflow:** double-tap empty canvas or tap Sticky tool → a sticky drops under the thumb,
  auto-focuses text; type; color via contextual bar; drag to move; **auto-resize/auto-shrink
  text**; duplicate by drag-with-hold.
- **UI:** `StickyNote` (rounded, shadow, big default font), `ContextualToolBar` (color).
- **Permissions:** Editor+ creates/edits; Viewer reads.
- **Offline:** full (optimistic object ops).
- **API:** `PATCH /boards/:id/objects` (batch ops); realtime `board.op`.
- **DB:** `board_objects` (type=sticky, content_json, x/y/w/h, color, z, author).
- **Notify:** none per keystroke; `@mention` in a sticky notifies.
- **AC:** sticky created in one action, text legible at default zoom, color changes persist,
  text auto-fits.

### 5.3 Shapes & connectors (diagramming) ✅
- **Purpose:** structure ideas into flows/maps.
- **Workflow:** Shape tool → drop rect/ellipse/diamond/etc.; Connector tool → drag from one
  object's edge to another (connector **binds** and re-routes when objects move);
  straight/elbow/curved; arrowheads; label a connector.
- **UI:** `ShapeNode`, `Connector` with binding anchors, `ContextualToolBar`.
- **Permissions:** Editor+.
- **Offline:** full; binding recomputed locally.
- **API/DB:** objects + `board_connectors` (from_object, to_object, from_anchor, to_anchor,
  style, label).
- **Notify:** none.
- **AC:** connectors stay bound and re-route on move; arrow/curve styles persist; labels edit.

### 5.4 Apple Pencil drawing & handwriting (PencilKit) ✅
- **Purpose:** natural freehand ink, annotation, and handwriting on iPad.
- **Workflow:** Pen tool → draw with pressure/tilt; pen/marker/highlighter; eraser
  (stroke/pixel); **palm rejection**; **Scribble** to write into sticky/text fields;
  double-tap/squeeze to switch tool (Pencil gestures); ink is a first-class object (move/
  scale/delete). Finger-draw supported (toggle "draw with finger").
- **UI:** `InkStroke`, `PenSettings`, `StrokeWidthSlider`, `EraserTool`.
- **Permissions:** Editor+.
- **Offline:** full; strokes captured locally, synced as vector ops.
- **API/DB:** `board_objects` (type=ink, stroke vector points/pressure, color, width).
- **Notify:** none.
- **AC:** low-latency ink (<1 frame perceived) with pressure/tilt; palm rejection; Scribble
  into text; ink moves/scales as an object.

### 5.5 Frames, grouping, align & templates ✅
- **Purpose:** organize regions; reuse structures; present.
- **Workflow:** wrap objects in a **Frame** (named region → also a presentation slide);
  multi-select (lasso/tap) → group, align, distribute, lock; start from a **template**
  (brainstorm, retro, mind-map, user-journey, Kanban, flowchart, SWOT); "Save as template".
- **UI:** `Frame`, `AlignDistributeMenu`, `TemplateGallery`, `FrameStrip`.
- **Permissions:** Editor+ edits; Manager+ publishes org templates.
- **Offline:** built-in + cached templates usable offline.
- **API:** `POST /boards?fromTemplate=:id`, `GET /board-templates`, `POST /board-templates`.
- **DB:** `frames` (board_id, name, bounds, order), `board_templates`.
- **Notify:** none.
- **AC:** frames group/name/reorder; align/distribute/lock work; templates instantiate;
  present mode follows frames.

### 5.6 Sticky/shape → Task (the differentiator) ✅
- **Purpose:** turn ideas into tracked work.
- **Workflow:** select a sticky (or **multi-select a cluster/frame**) → **→ Task**; a sheet
  pre-fills task title from the sticky text, target project (board's project), assignee, due;
  bulk convert a whole frame → a set of tasks (optionally as subtasks of one parent). The
  object shows a live `TaskRefBadge` linking to [Task Detail](./10-task-detail.md).
- **UI:** `StickyToTaskSheet`, `ClusterToTasksSheet`, `TaskRefBadge`.
- **Permissions:** create in board's project scope; assign per project policy.
- **Offline:** created optimistically + queued; badge shows `pending`.
- **API:** `POST /boards/:id/objects/:objId/task`, bulk `POST /boards/:id/tasks`.
- **DB:** `board_objects.linked_task_id` + `tasks.source_board_object_id` (two-way).
- **Notify:** assignee notified; board shows badge.
- **AC:** single + bulk (cluster/frame) conversion; two-way live link; task inherits context.

### 5.7 Live multiplayer cursors & co-editing (Miro/FigJam) 🔜→🟣
- **Purpose:** brainstorm together, seeing each other in realtime.
- **Workflow:** each collaborator has a **named colored cursor**; see remote selections;
  **follow** a teammate (spotlight their viewport); emoji **reaction bursts** and a **laser
  pointer** for facilitation; concurrent edits merge (CRDT).
- **UI:** `LiveCursor`, `RemoteSelectionOutline`, `FollowUser`, `ReactionBurst`, `LaserPointer`.
- **Permissions:** Editor+ co-edits; Viewer sees cursors (read-only).
- **Offline:** cursors online-only; edits made offline merge on reconnect (CRDT).
- **API:** realtime `cursor.moved`, `board.op` (CRDT delta), `presence.changed`,
  `reaction.burst` on channel `board:{id}`.
- **DB:** cursors ephemeral (not persisted); ops persisted as `board_ops`/materialized objects.
- **Notify:** "X started editing the board" (opt).
- **AC:** cursors <100ms perceived; concurrent edits converge without loss; follow works.

### 5.8 Comments, reactions & voting ✅
- **Purpose:** discuss and prioritize on the board.
- **Workflow:** drop a **comment pin** anywhere or on an object; `@mention`, react, resolve;
  **dot voting** on stickies for prioritization (each user N votes).
- **UI:** `CommentPin`, `CommentThread`, `ReactionBar`, vote dots.
- **Permissions:** Comment+ comments/votes; resolve by Comment+/author.
- **Offline:** append-only, queued.
- **API:** `POST /boards/:id/comments`, `POST /objects/:id/votes`.
- **DB:** `board_comments` (anchor object/point), `board_votes`.
- **Notify:** mention → immediate.
- **AC:** pins anchor to objects/points; voting tallies; resolve works.

### 5.9 Export, embed & present ✅
- **Purpose:** share the outcome.
- **Workflow:** export board/frame to **PNG/PDF** (whole board or a frame); embed a board
  preview into a [doc](./25-documents-knowledge-base.md) or [chat](./26-team-chat-collaboration.md);
  **presentation mode** steps through frames (with laser pointer).
- **UI:** `ExportSheet`, `PresentModeBar`, `FrameStrip`.
- **Permissions:** export by Editor+ (DLP-gated for sensitive boards).
- **Offline:** local render for export possible; high-res render server-side when online.
- **API:** `POST /boards/:id/export?format=png|pdf&frame=:id`.
- **DB:** none new (render service).
- **Notify:** none.
- **AC:** export renders faithfully; present mode follows frames; embeds show live preview.

---

## 6. Smart AI Features

Powered by [AI Assistant & Copilot](./19-ai-assistant-copilot.md). All **proposal-first**
(preview + Accept/Edit/Undo); AI never mutates the board without confirmation.

| Capability | What it does on a board |
|-----------|-------------------------|
| **Cluster & theme stickies** (`summarize`) | Group related stickies and label the clusters (affinity mapping). |
| **Diagram from text** (`rewrite`) | "Draw a login flow" → generates shapes + connectors as a proposal. |
| **Sticky brainstorm** (`action_items`) | "Give me 10 ideas for onboarding" → drops stickies. |
| **Summarize board** (`summarize`) | Turn a messy board into a structured [doc](./25-documents-knowledge-base.md) summary. |
| **Cluster → tasks** (`action_items`) | Convert a themed cluster into a task list with owners. |
| **Handwriting → text** (OCR) | Convert Pencil handwriting/ink to editable text/stickies. |
| **Tidy / auto-layout** | Align and space objects; straighten connectors. |
| **Ask this board** (`project_chat` RAG) | Q&A grounded in board content (cited). |

Logs `ai_invoked` (`capability`, `accepted`, `latency_ms`); respects org AI governance;
outputs land as editable objects users can accept/undo.

---

## 7. Productivity Features

- **Templates** for common rituals (retro, brainwriting, mind-map, journey map, Kanban).
- **Frame = slide** presentation mode for reviews.
- **Dot voting & timer** for facilitated sessions (a countdown `Timer` overlay).
- **Cluster → tasks / board → doc** to carry outcomes into execution.
- **Quick capture:** snap a photo of a physical whiteboard → import as image → AI OCR to
  stickies ([34 Siri/Shortcuts](./34-siri-voice-apple-intelligence.md) capture entry).
- **Focus/present** hides chrome for distraction-free facilitation.

---

## 8. Enterprise Features

- **Board/object permissions** (role matrix):

| Action | Owner | Admin | Manager | Member (Editor) | Member (Commenter) | Guest (Viewer) |
|--------|:-----:|:-----:|:-------:|:---------------:|:------------------:|:--------------:|
| View / pan-zoom | ✅ | ✅ | ✅ | ✅ | ✅ | shared |
| Comment / vote | ✅ | ✅ | ✅ | ✅ | ✅ | shared |
| Add / edit objects | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sticky/cluster → task | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage sharing/permissions | ✅ | ✅ | board-lead | ❌ | ❌ | ❌ |
| Publish org template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export / present | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lock objects / board | ✅ | ✅ | board-lead | own objects | ❌ | ❌ |
| Delete board | ✅ | ✅ | board-lead | own draft | ❌ | ❌ |
| Retention / legal hold | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

Roles reference [shared/rbac-permissions.md](./shared/rbac-permissions.md) (board roles map to
project Lead/Contributor/Viewer). Personal boards (`projectId = null`, `ownerId`) are never
readable by Admins.

- **Object & board locking** to protect facilitator structure.
- **Immutable audit** of board lifecycle → [Activity Feed & Audit Logs](./29-activity-feed-audit-logs.md).
- **Retention & legal hold**; soft-delete with restore window.
- **DLP / watermark** 🟣 on export of sensitive boards.
- **Version history & snapshots** with restore.

---

## 9. Collaboration Features

- **Live multiplayer** (🔜→🟣): named cursors, remote selections, follow/spotlight, emoji
  bursts, laser pointer, timer — powered by WebSocket per
  [shared/api-conventions.md](./shared/api-conventions.md) (channel `board:{id}`) and CRDT
  merge per [shared/offline-sync-engine.md](./shared/offline-sync-engine.md).
- **Comments, mentions, reactions, dot voting, decisions.**
- **Presence** avatars in the nav; "N editing now".
- **Cross-surface:** sticky→task ([10](./10-task-detail.md)), board→doc summary
  ([25](./25-documents-knowledge-base.md)), share into chat ([26](./26-team-chat-collaboration.md)).

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- Board **objects** (stickies/shapes/connectors/ink/text/frames) edit fully offline via
  **granular object ops** (`object.create|update|move|resize|delete`, `connector.rebind`).
- **CRDT merge** for object properties and positions so concurrent edits converge without
  locks (v1 falls back to per-object last-write-wins on server timestamp; position moves use
  LWW; a deleted-then-edited object → delete wins unless newer + restore policy).
- **Ink strokes** are immutable once drawn (append-only) → never conflict; erase is a delete op.
- **Connectors** re-bind locally; if a bound object is deleted remotely, the connector detaches
  gracefully (dangling → auto-removed with notice).
- Multiplayer cursors/presence/reactions are **online-only** (ephemeral).
- Media (images) upload resumably (`pending`); large boards lazy-load off-screen regions.
- `SyncBadge` shows "Saved locally — will sync" vs "Synced".

**Multiplayer op flow:**
```mermaid
sequenceDiagram
  participant A as User A (canvas)
  participant SA as A Local Store
  participant RT as WebSocket board:{id}
  participant SRV as Server (CRDT authority)
  participant B as User B (canvas)
  A->>SA: move sticky (optimistic) + local op
  SA-->>A: 60fps render
  A->>RT: board.op {opId, objectId, type:move, xy, lamport}
  RT->>SRV: apply + merge (CRDT)
  SRV-->>RT: broadcast merged op (canonical)
  RT-->>B: apply op → sticky moves live
  RT-->>A: ack (dedupe by opId; no re-render if unchanged)
  Note over A,B: cursors stream via cursor.moved (ephemeral, coalesced)
```

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md):
- Board scope re-checked on every read/op; realtime `board:{id}` subscription authorized on
  connect + per op; guests contained to shared boards.
- Sticky/text/comment content **sanitized**; pasted links unfurled server-side (SSRF-guarded).
- Image objects type/size-validated + malware-scanned before availability; signed URLs.
- Export/embed respects DLP; watermark option for sensitive boards.
- No board content in analytics/logs; AI RAG permission-filtered.
- Ink/vector data treated as untrusted input (bounds/size validated to prevent abuse).

---

## 12. Notification System

Deltas over [12-notifications-alerts.md](./12-notifications-alerts.md):
- Emits: `@mention` on a board/comment, comment on a watched board, share/access granted,
  "invited to collaborate", sticky→task assignment, version restored, "session started" (opt).
- Mentions immediate; collaboration invites immediate; watcher digests batched.
- Notification actions: **Open board**, **Reply** (comment), **Join session** (🔜).
- An active multiplayer session may show a Dynamic Island **Live Activity** ("3 editing").

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- A **canvas is inherently visual** — Numil provides an **accessible object list/outline**
  (VoiceOver): each object announced ("Sticky: 'Idea A', yellow, connected to 'Idea B'") with
  actions (Edit, Move, Convert to task, Delete). Navigation via list, not spatial drag.
- Focus/selection changes announced; connectors describe their endpoints.
- Every object requires/encourages a text alternative; images need alt text; ink can be
  OCR'd to provide a text description.
- Controls (tool pill, contextual bars, action bar) are ≥44pt, labeled, and keyboard/Switch-
  Control operable; color is never the only differentiator (sticky color paired with label).
- Reduce Motion disables camera-pan easing/reaction bursts; Reduce Transparency solidifies
  glass surfaces.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Board thumbnail → canvas hero (`motion.slow`); chrome fade on enter.
- Object add: scale-in from the tap point (`spring.gentle`); drag: lift (scale 1.03 + shadow).
- Camera pan/zoom: inertial, worklet-driven; fit-to-content eased (`motion.base`).
- Connector draw: animated path; re-route springs when endpoints move.
- Remote cursor: smooth interpolation between updates; reaction bursts pop `spring.bouncy`.
- Sticky→task: object shrinks into a `TaskRefBadge`. Reduce Motion → cross-fades, no inertia.

---

## 15. Performance

- **GPU canvas:** Skia-backed rendering; camera + object transforms on the UI thread via
  Reanimated worklets. Target 60fps (120fps ProMotion aware) with **thousands of objects**.
- **Culling & LOD:** only render objects intersecting the viewport; distant objects draw as
  simplified placeholders; ink strokes simplified (Douglas-Peucker) at low zoom.
- **Tiled rendering / offscreen:** large boards render in tiles; minimap uses a downsampled
  snapshot.
- **Op batching:** object ops batched (16–50ms) to the outbox/realtime; cursor updates
  coalesced (~30–60Hz) and interpolated.
- **Ink latency:** predicted/coalesced touches for near-zero perceived latency (PencilKit).
- **Memory:** image objects via `expo-image` cache with LRU; off-screen bitmaps released.
- **Startup:** board opens from cached snapshot <300ms; deltas stream in after.

---

## 16. Database Design

```text
boards(id, org_id, project_id?, owner_id, name, thumbnail_url?, bounds_json?, is_template,
       version, created_at, updated_at, deleted_at?)            -- personal board ⇒ project_id NULL
board_objects(id, board_id→boards, type, content_json, x, y, w, h, rotation, z_index, color?,
              style_json?, parent_frame_id?→frames, linked_task_id?, author_id, version,
              created_at, updated_at, deleted_at?)              -- type: sticky|shape|text|image|ink|stamp|embed
board_connectors(id, board_id→boards, from_object_id→board_objects, to_object_id→board_objects,
                 from_anchor, to_anchor, style, label?, z_index, version)
frames(id, board_id→boards, name, x, y, w, h, order)
board_comments(id, board_id→boards, anchor_object_id?→board_objects, x?, y?, author_id,
               body_json, mentions[], resolved, is_decision, created_at, deleted_at?)
board_votes(id, board_id→boards, object_id→board_objects, user_id, created_at)
board_ops(id, board_id→boards, actor_id, op_json, lamport, created_at)  -- CRDT op log (compactable)
board_versions(id, board_id→boards, snapshot_json, editor_id, label?, created_at)  -- history
board_permissions(id, board_id→boards, principal_type, principal_id, role)  UNIQUE(board_id,principal_type,principal_id)
board_templates(id, org_id?, scope, name, thumbnail_url, body_json, created_by, created_at)
board_watchers(board_id→boards, user_id)                        PK(board_id,user_id)
board_activity(id, board_id→boards, actor_id, action, before_json?, after_json?, created_at)  -- immutable
```

**Indexes:** `board_objects(board_id, z_index)`, `board_objects(board_id) WHERE deleted_at IS
NULL`, `board_connectors(board_id)`, `board_connectors(from_object_id)`,
`board_connectors(to_object_id)`, `board_ops(board_id, lamport)`, `board_comments(board_id,
anchor_object_id)`, `boards(project_id, updated_at)`, `boards(owner_id) WHERE project_id IS
NULL` (personal). **Constraints:** connector endpoints must reference objects on the same
board; `parent_frame_id` frame on the same board; personal board ⇒ owner-only. **Soft delete**
via `deleted_at`. **CRDT op log** compacted into `snapshot_json`/materialized objects
periodically. **History/audit** append-only.

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/boards?filter[project]=&cursor=` | Board gallery |
| POST | `/boards` (`fromTemplate?`, `projectId?`) | Create board |
| GET | `/boards/:id?expand=objects,connectors,frames` | Fetch board snapshot |
| PATCH | `/boards/:id` (If-Match) | Name/thumbnail/settings |
| PATCH | `/boards/:id/objects` (batch ops, Idempotency-Key) | Create/update/move/delete objects |
| POST | `/boards/:id/connectors` · PATCH/DELETE | Connectors |
| POST | `/boards/:id/objects/:objId/task` · POST `/boards/:id/tasks` | Sticky/cluster → task |
| POST | `/boards/:id/comments` · POST `/objects/:id/votes` | Comments / dot voting |
| GET | `/boards/:id/versions?cursor=` · POST `/versions/:vid/restore` | History |
| GET/PUT | `/boards/:id/permissions` | Sharing |
| GET/POST | `/board-templates` | Templates |
| POST | `/boards/:id/export?format=png\|pdf&frame=:id` | Export |
| POST | `/boards/:id/ai/{cluster\|diagram\|brainstorm\|summarize\|tidy\|ocr}` | AI (module 19) |

**Realtime:** channel `board:{id}` — `board.op` (CRDT object/connector delta), `cursor.moved`
(ephemeral, coalesced), `presence.changed`, `reaction.burst`, `comment.created`,
`follow.changed`. Client applies ops by `lamport`/`version`; missed ops recovered via delta
`GET /sync?since=` or a fresh `GET /boards/:id` snapshot. **Errors:** `403 forbidden` (scope),
`409 gone` (deleted), `409 conflict` (snapshot version on non-CRDT PATCH), `413` (object/image
too large). **Idempotency-Key** on all mutations; each op carries `opId`.

**Sample: batch object op**
```http
PATCH /v1/boards/bd_47/objects   If-Match: 91
Idempotency-Key: c71a-...-e2
{ "ops": [
  { "opId":"o1","type":"create","object":{"type":"sticky","x":320,"y":180,"w":160,"h":160,
     "color":"yellow","content":{"text":"Idea A"}} },
  { "opId":"o2","type":"move","objectId":"obj_88","x":540,"y":210,"lamport":12045 }
] }
```
```json
{ "data": { "boardId":"bd_47","version":92,"applied":["o1","o2"],
  "objects":[{"id":"obj_120","version":1,"z_index":37},{"id":"obj_88","version":8}] },
  "meta": { "requestId":"req_..." } }
```

---

## 18. Edge Cases

- **Offline edits + remote changes:** CRDT converges; v1 fallback per-object LWW; deleted-then-
  edited object → delete wins (restorable from history).
- **Connector's bound object deleted:** connector detaches → auto-removed with a notice (or
  becomes a floating dangling arrow if configured).
- **Two users drag the same sticky:** last position wins smoothly; no flicker/jump-back (op
  interpolation).
- **Massive board (10k+ objects):** culling + LOD keep 60fps; a "large board" hint suggests
  splitting into frames.
- **Permission lost mid-session:** next op `403` → local changes rolled back; board becomes
  read-only banner; realtime downgraded to view.
- **Pencil disconnects mid-stroke:** stroke finalizes at last point; no partial corruption.
- **Paste huge image / unsupported format:** downscaled/validated or rejected with reason.
- **Presentation mode with no frames:** falls back to fit-to-content stepping.
- **Deleted board via deep link:** graceful "no longer available"; restorable within retention.
- **Archived project board:** read-only banner.
- **Storage full:** vector edits continue; image uploads paused with warning.
- **Clock skew:** server lamport/timestamps authoritative for op ordering.

---

## 19. User States

- **First-time:** empty canvas with "Double-tap to add a sticky" + template chips + (iPad)
  Pencil hint; a 3-step coach-mark (add, move, → task).
- **Returning/power:** keyboard tool shortcuts (iPad), templates, multi-select, present mode.
- **Facilitator:** timer, dot voting, laser pointer, follow/spotlight, lock structure.
- **Viewer/Commenter:** pan/zoom + comment/vote; cannot edit objects.
- **Guest:** only shared boards; no gallery browse; export gated.
- **Manager/Admin/Owner:** templates, permissions, audit; Admin can't read personal boards.
- **Offline / poor network:** optimistic ops, `SyncBadge`, deferred images, cursors hidden.
- **iPhone (small screen):** big touch targets, thumb-zone tool pill, gesture-first — never a
  cramped desktop ribbon.
- **iPad + Pencil / landscape:** full Pencil canvas, hover preview, tool rail + inspector,
  Scribble.
- **Dark mode / large text / a11y:** tokens + Dynamic Type in editors; accessible object list.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md) (no board content/PII).

| event | key properties |
|-------|----------------|
| `board_created` | `source` (blank/template), `template_id?`, `board_type` (project/personal) |
| `board_opened` | `via` (gallery/link/chat/doc), `object_count_bucket` |
| `object_added` | `object_type` (sticky/shape/connector/ink/text/image) |
| `ink_stroke_added` | `input` (pencil/finger) |
| `sticky_to_task` | `mode` (single/cluster/frame), `count_bucket` |
| `board_comment_posted` | `has_mention`, `is_decision` |
| `board_vote_cast` | `object_type` |
| `multiplayer_session` | `peak_participants_bucket`, `duration_bucket` |
| `board_presented` | `frame_count_bucket` |
| `board_exported` | `format`, `scope` (board/frame) |
| `template_used` / `template_saved` | `scope` |
| `ai_invoked` | `capability`, `accepted`, `latency_ms` |

---

## 21. Acceptance Criteria

1. A board opens from cache in <300ms; pan/zoom holds 60fps with thousands of objects.
2. Double-tap or the sticky tool drops a focused sticky in one action.
3. Sticky text auto-fits, stays legible at default zoom, and color changes persist.
4. Shapes drop and resize/rotate via handles; z-order controls work.
5. Connectors bind to objects, re-route on move, and support straight/elbow/curved + arrows.
6. Deleting a bound object detaches its connector gracefully.
7. Apple Pencil draws with pressure/tilt and near-zero perceived latency; palm rejection works.
8. Scribble writes into sticky/text fields; ink is a movable/scalable object.
9. Finger-draw toggle works for users without a Pencil.
10. Frames group/name/reorder objects and act as presentation slides.
11. Multi-select supports group/align/distribute/lock.
12. Templates instantiate; "Save as template" works; org templates gated to Manager+.
13. Sticky → task pre-fills context and creates a two-way live link.
14. Cluster/frame → tasks performs bulk conversion (optionally as subtasks).
15. The task-reference badge stays live as the task status changes.
16. Live multiplayer cursors render <100ms with names/colors (🔜).
17. Concurrent edits converge via CRDT without data loss; v1 LWW fallback is deterministic.
18. Follow/spotlight, emoji bursts, and laser pointer aid facilitation.
19. Comment pins anchor to objects/points; mentions notify; resolve works.
20. Dot voting tallies per-user vote budgets.
21. Everything edits offline; a `SyncBadge` reflects sync state.
22. Ink strokes are append-only and never conflict; erase is a delete op.
23. Missed ops recover via delta sync or a fresh snapshot on reconnect.
24. Version snapshots capture and restore non-destructively (audited).
25. Export to PNG/PDF (board or frame) renders faithfully.
26. Presentation mode follows frames and hides all chrome.
27. Board/object locking protects structure; permissions gate every action.
28. Permission lost mid-session rolls back and downgrades to read-only.
29. Deleted board via deep link shows a graceful unavailable state; restorable within retention.
30. Archived project board is read-only.
31. Sticky/text/comment content is sanitized; images malware-scanned before availability.
32. No board content in analytics/logs; AI RAG is permission-filtered.
33. Personal boards are never visible to Admins/others.
34. AI cluster/diagram/brainstorm/summarize/tidy/OCR are proposal-first and logged.
35. AI outputs land as editable objects (accept/undo).
36. VoiceOver exposes an accessible object list with per-object actions (no spatial drag needed).
37. Color is never the sole differentiator (sticky color paired with label/text).
38. Reduce Motion disables camera easing/bursts; Reduce Transparency solidifies glass.
39. iPhone layout is thumb-first (bottom tool pill, ≥44pt targets) — not a desktop ribbon.
40. iPad shows Pencil canvas + tool rail/inspector + keyboard shortcuts.
41. Large-board culling/LOD prevents frame drops; ink simplified at low zoom.
42. Analytics events fire with correct properties (incl. offline-buffered), no content/PII.
43. Undo/redo covers object ops; 5s undo snackbar for board/object deletion.

---

## 22. Future Roadmap

- **V1 (✅):** infinite canvas + gestures, stickies/shapes/connectors/text/ink (Pencil),
  frames/grouping/align, templates, sticky/cluster→task, comments/reactions/voting, export,
  present mode, version history, offline object ops.
- **V1.1 (🔜):** live multiplayer cursors + follow/spotlight, laser pointer + facilitation
  timer, AI cluster/diagram-from-text/brainstorm/OCR, doc/task **embeds** on canvas, board
  preview embeds in docs/chat.
- **V2 (🟣):** full CRDT co-editing, DLP/watermark export, advanced connectors (auto-layout),
  board → structured doc, private/BYO render, custom template packs per org.
- **Future (💡):** video/voice tiles on board (workshop calls), mind-map auto-expand, physical-
  whiteboard photo → clean digital board, board graph/relationships view, cross-org boards.
- **Experimental (🧪):** AI facilitator that runs a retro/brainstorm end-to-end; on-device
  handwriting recognition; generative diagram refinement.
- **AI track:** "summarize this workshop into a plan" (board → doc + tasks + owners); RAG over
  board + linked docs/tasks with citations.
- **Enterprise track:** board retention/legal hold UI, export eDiscovery, classification
  labels + DLP enforcement, SSO-scoped board sharing.
