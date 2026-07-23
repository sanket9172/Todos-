# Shared · Animation & Motion Spec

Canonical motion system. Module **Section 14** links here and lists only deltas.
Implemented with **react-native-reanimated 4** (worklets on the UI thread) + **expo-haptics**.

## Principles

- **Motion clarifies, never decorates.** Every animation communicates causality
  (this came from that) or state (loading, success, error).
- **Fast.** Most transitions 150–300ms. Nothing blocks input.
- **Interruptible.** Gestures own the animation; releasing mid-gesture settles with a spring.
- **Respect Reduce Motion** (see accessibility): swap movement for cross-fades.

## Duration & easing tokens

| Token | Duration | Curve | Use |
|-------|----------|-------|-----|
| `motion.instant` | 80ms | ease-out | State toggles (checkbox tint) |
| `motion.fast` | 150ms | ease-out | Chips, badges, hover/press |
| `motion.base` | 220ms | ease-in-out | Most transitions, sheets content |
| `motion.slow` | 300ms | ease-in-out | Page/hero transitions |
| `spring.snappy` | — | stiffness 400, damping 32 | Buttons, swipe settle |
| `spring.gentle` | — | stiffness 220, damping 26 | Sheets, drawer, cards |
| `spring.bouncy` | — | stiffness 260, damping 18 | Celebrations only |

## Signature interactions

| Interaction | Spec |
|-------------|------|
| **Press** | scale 1→0.97, `motion.fast`, light haptic on down |
| **Checkbox complete** | ring fill + checkmark draw 220ms, scale bounce, `success` haptic, row strikethrough + fade to Completed section over 300ms |
| **Swipe action** | track finger 1:1; action pill grows past threshold (haptic at threshold); release → `spring.snappy` |
| **Row delete** | height collapse + fade 220ms; undo snackbar 5s |
| **Bottom sheet** | `spring.gentle`; content fades in after 60ms; backdrop opacity 0→0.4 |
| **Drawer/sidebar** | edge-pan 1:1; `spring.gentle` settle; parallax content 0.9x |
| **Page push** | iOS default slide; large-title collapse on scroll |
| **Hero (task row → detail)** | shared-element on title + color dot, `motion.slow` |
| **Drag reorder** | lift (scale 1.03 + shadow), neighbors part with `spring.gentle`, drop settle |
| **Board card drag** | same lift; column highlight; autoscroll near edges |
| **Progress ring** | animate stroke-dashoffset over `motion.base` |
| **Confetti** | `spring.bouncy`, ≤1.2s, only on goal/streak/all-done; skipped under Reduce Motion |
| **Skeleton shimmer** | 1.2s linear loop; stops immediately when data arrives |
| **Toast/snackbar** | slide-up + fade `motion.base`; auto-dismiss 4–5s; swipe to dismiss |
| **AI streaming** | token cursor pulse; content fades in per chunk |

## Haptics map (expo-haptics)

| Event | Haptic |
|-------|--------|
| Press primary | `impactLight` |
| Complete task | `notificationSuccess` |
| Reach swipe threshold | `impactMedium` |
| Destructive confirm | `notificationWarning` |
| Error | `notificationError` |
| Reorder pickup/drop | `impactRigid` / `impactSoft` |

## Performance rules

- All animations run as worklets on the UI thread; never animate layout on JS thread.
- Prefer `transform`/`opacity` (GPU) over width/height/margin where possible.
- 60fps budget (120fps ProMotion aware); drop frames → simplify, never stutter input.

## Reduce Motion behavior

- Replace slides/scales with 120ms cross-fades.
- Disable confetti, parallax, shimmer (use static placeholder).
- Keep essential state feedback (checkbox fill) but without bounce.
