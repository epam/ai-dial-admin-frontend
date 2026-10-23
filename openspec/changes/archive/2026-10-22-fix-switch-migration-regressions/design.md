## Context

The 2.0 `Switch` renders `<input type="checkbox" role="switch" class="peer sr-only">` plus two sibling `<label for>` elements. The legacy `DialSwitch` input was `invisible size-0`, which cannot receive focus. Clicking a 2.0 switch therefore moves focus to the `sr-only` input, and the browser scrolls the focused element into view.

`sr-only` is `position: absolute`, and the nearest positioned ancestor between a switch and the page is the `Content` root (`flex flex-col flex-1 min-h-0 min-w-0 relative overflow-hidden`, `Content.tsx:97`). Console inspection after a click shows that element is the one that scrolls. `overflow-hidden` removes scrollbars but not programmatic scrolling, so the shell shifts under its own children: the page appears at the top with empty space below, and the toolset page reads as blank.

The Features tooltip is a separate cause. The 2.0 `Tooltip` wraps its child in a `<span>` and the migration swapped `bottom-start` for `TooltipPlacement.Bottom`; the kit (`0.16.0-dev.33`) has no start-aligned placement, so the tooltip centres on a span as wide as its grid cell.

## Goals / Non-Goals

**Goals:**
- Toggling any switch leaves the scroll position unchanged on the Features tab, the startup probe, and the toolset detail page.
- The inherited-feature tooltip appears under the toggle it describes.

**Non-Goals:**
- Changing the kit's `Switch`. The app cannot override the input class (`className` lands on the row wrapper and the input's `peer sr-only` is applied after `...rest`), so the fix is on our side of the boundary.
- Per-call-site changes across the ~40 `Switch` usages.

## Decisions

**1. `overflow-hidden` → `overflow-clip` on the `Content` root.**
`overflow: clip` forbids all scrolling, programmatic included, while still clipping. It fixes the shell for every `sr-only` control at once and needs no per-screen knowledge.
- Alternative — `relative` wrapper around the scrolling content area: anchors the absolute input to the real scroller. Needs identifying the right wrapper and fixes the symptom only where the wrapper exists. Kept as the fallback if `overflow-clip` breaks a `sticky` descendant.
- Alternative — `onMouseDown={e => e.preventDefault()}` on each label: stops focus moving on click, but changes mouse/keyboard focus parity (`a11y.md`) and must be repeated per call site. Rejected.
- Alternative — wait for a kit fix: leaves a P2 open and is outside our control. The shell fix is harmless if the kit later changes.

**2. Stop the switch group stretching its children (`items-start` on the group).**
Each group is `flex flex-col`, whose default `align-items: stretch` makes the tooltip's trigger span and the `Switch` root full width, so a centred `Bottom` placement centres on the row. `items-start` on the group lets every child shrink to its content, with no change to `Tooltip` or `Switch` usage. Proposed by the reporter.
- Tried first and ineffective: `triggerClassName="w-fit"` on the `Tooltip`, then a `w-fit` wrapper passed with `asChild`. Both left the stretched flex item in place.
- Alternative — ask upstream for `BottomStart`: tracked separately, not a blocker.

**3. Confirm before relying on the theory.** The mechanism is inferred, not reproduced here. The first task checks it in the running app (`scrollTop` of the `Content` root after a click; swap the class live and re-click) before the class change is committed.

## Risks / Trade-offs

- [`overflow-clip` stops the box being a scroll container for `position: sticky` descendants] → Check `Sidebar`, `Footer`, `Blackout` and `UserMobile` for `sticky`; if any rely on it, use the `relative` wrapper fallback instead.
- [`overflow-clip` ignores `overflow-clip-margin` defaults that `overflow-hidden` never had, and clips differently around border-radius] → The shell has no radius or outline overflow; no visual change expected.
- [The theory is wrong and the scroll comes from another source] → Task 1.1 catches this before any code change; the design is revisited rather than shipped on a guess.
- [`items-start` also shrinks the group's `Label` heading] → Intended; the heading is text and needs no width.
