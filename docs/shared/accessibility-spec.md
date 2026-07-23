# Shared · Accessibility Spec

Canonical accessibility (a11y) requirements. Module **Section 13** links here and lists
only module-specific deltas. Target: **WCAG 2.2 AA** + Apple accessibility best practices.

## Support matrix

| Capability | Requirement |
|------------|-------------|
| **VoiceOver** | Every interactive element has a role, label, value, and hint. Logical reading order matches visual order. Custom controls expose `accessibilityActions`. |
| **Dynamic Type** | All text scales from XS to AX5; layouts reflow (no clipping/truncation of essential text). Use scalable font tokens, min tap target 44×44pt. |
| **Reduce Motion** | Honor system flag; swap movement for fades (see animation spec). |
| **Reduce Transparency** | Replace glass/blur with solid `backgroundElement`. |
| **Increase Contrast** | Provide high-contrast token set; ≥4.5:1 text, ≥3:1 large text/icons. |
| **Bold Text** | Respect system bold. |
| **Color blindness** | Never use color alone; pair with icon/label/pattern (priority = flag + label). |
| **RTL** | Full mirroring for Arabic/Hebrew; use logical (start/end) not left/right. |
| **Keyboard / hardware** | iPad + external keyboard: full navigation, shortcuts, focus ring. |
| **Switch Control / Full Keyboard Access** | All flows completable without touch. |
| **Captions** | Any video/voice message provides transcripts/captions. |
| **Haptics** | Meaningful, not sole signal; respect system settings. |
| **Larger targets** | 44×44pt min; 48pt for primary. |

## VoiceOver label patterns

| Element | Label / value / hint |
|---------|----------------------|
| Task row | Label: title. Value: "High priority, due today 5 PM, in Marketing". Hint: "Double-tap to open". Actions: Complete, Snooze, Delete. |
| Checkbox | "Complete task" / state "not completed" |
| Priority flag | "Priority: Urgent" |
| Due chip | "Due tomorrow, 3 PM" |
| Avatar stack | "Assigned to Priya and 2 others" |
| FAB | "Add task" |
| AI button | "Ask Numil AI" |

## Testing

- Manual VoiceOver pass per screen; Accessibility Inspector audits in CI where possible.
- Snapshot tests at largest Dynamic Type size (AX5) to catch clipping.
- Contrast checks on both themes + high-contrast variant.
- RTL smoke test (pseudo-locale) on every list/detail screen.

## Acceptance (global)

- [ ] 100% of interactive elements have VoiceOver labels + actions.
- [ ] No clipped essential text at AX5.
- [ ] Reduce Motion & Reduce Transparency honored everywhere.
- [ ] All flows completable via Switch Control / keyboard.
- [ ] No information conveyed by color alone.
- [ ] RTL layouts mirror correctly.
