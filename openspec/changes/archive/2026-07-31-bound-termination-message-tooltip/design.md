## Context

`DialTooltip`'s floating content (ui-kit) is styled `z-[55] whitespace-pre-wrap break-words … max-w-[300px]` — width-capped, height-unbounded — and is rendered `position: absolute` inside a `FloatingPortal` that, with no `#tooltip-portal` element in the app, is appended to `document.body`. The positioning middleware is `offset` / `flip` / `shift` / `arrow`; there is no `size` middleware, so nothing clamps the floating element to the viewport. A pod `lastTerminationMessage` is a full Kubernetes stack trace, so the tooltip renders at its natural full height, extends the document, and distorts the page — Issue #4072.

## Goals / Non-Goals

- **Goal:** the tooltip surface is bounded regardless of message length; the page layout never changes when it opens.
- **Goal:** the inline header field keeps the same truncated look as its sibling fields (Restarts, Last restarted at, Last reason).
- **Non-goal:** a comfortable reading experience for the whole trace (see *Known limitation*).
- **Non-goal:** touching `Common/LabelledText` or the ui-kit tooltip contract.

## Decisions

**Cap at the call site, not in `Common/LabelledText`.** `LabelledText` and `DialLabelledText` both type `tooltip` as `string`, so there is no seam to style the content through; widening that prop would change a shared component's contract for one caller. `PodView` instead uses `LabelledText`'s `children` slot with its own `DialTooltip` — the same escape hatch `Assets/Conversations/View/Properties.tsx` uses. `triggerClassName="text-primary min-w-0"` reproduces what `DialLabelledText` applies to its own trigger (`DialTooltip` adds `truncate` itself), so the field looks unchanged.

**Cap on an inner wrapper, not via `contentClassName`.** Putting `overflow-y-auto` on the floating element itself would make it a scroll container, and `FloatingArrow` is absolutely positioned *inside* that element — it would scroll away from the trigger edge. Wrapping the message in `max-h-[240px] overflow-y-auto overscroll-contain` keeps the floating box (and its arrow) small and static while the text scrolls within it. As a side benefit `max-w-[300px]` in `contentClassName` is appended *after* the consumer's classes in ui-kit, so a width override would not have won the merge anyway — height is the only dimension a consumer can influence.

**`overscroll-contain`.** Without it, scrolling to the end of the tooltip content chains into scrolling the page behind it — the interaction the reporter was performing when the layout broke.

## Known limitation (runtime, not covered by unit tests)

ui-kit configures `useHover` with `delay: { open: 500, close: 0 }` and no `handleClose`/`safePolygon`. In `@floating-ui/react`, a `mouseleave` on the reference with a mouse pointer always closes immediately (the `contains(floating, relatedTarget)` reprieve applies to `pointerType === 'touch'` only). So on desktop the tooltip cannot be entered and its scrollbar cannot be reached: the cap determines how much of the trace a hover reveals (~240px worth), and the rest is unreachable there. On touch the container is genuinely scrollable.

This is accepted for a layout-break fix. Making the full trace readable needs a surface that survives losing hover — `Common/ExpandableText` with `popupHeader` (bounded, `grow overflow-auto` popup body) or the existing `LogViewer` — and is left to a follow-up, since it changes how the field reads rather than fixing a defect.

## Risks

- The 240px cap is a judgement call, not a derived value: tall enough to show the first frames of a trace, short enough that `flip`/`shift` can always place it. If it proves too small in review, only that one class changes; the spec asserts a cap exists, not its value (the test matches `max-h-[\d+px]`).
