## Why

PR #5151 moved `DialSwitch` and `DialTooltip` to the ui-kit 2.0 `Switch` and `Tooltip` and introduced three regressions, reported as #5170 (P3), #5172 (P2) and #5173 (P4):

- **#5170 / #5172** — toggling a switch on the Features tab, the Containers startup probe, or the toolset "Forward per request key" scrolls the page to the top and leaves the area below it empty (on the toolset page it reads as a blank page). Console inspection after a click shows the element that scrolls is the `Content` root, `flex flex-col flex-1 min-h-0 min-w-0 relative overflow-hidden`. The legacy `DialSwitch` input was `invisible size-0` and could not take focus; the 2.0 input is `peer sr-only`, absolutely positioned and focusable, so a click focuses it and the browser scrolls the nearest `overflow-hidden` ancestor to reveal it. That ancestor is a layout shell that was never meant to scroll.
- **#5173** — the "inherited from Application Runner" tooltip on a disabled feature switch renders far to the right of its toggle. The migration replaced `placement="bottom-start"` with `TooltipPlacement.Bottom`, and the switches sit in a stretched flex column, so the tooltip's trigger is as wide as the row and a centred placement centres on the row, not the toggle. The installed kit (`0.16.0-dev.33`) has no start-aligned placement.

## What Changes

- `Content.tsx`: the root container becomes `overflow-clip` instead of `overflow-hidden`, so nothing can scroll it programmatically. This protects every `sr-only` control (switch, checkbox, radio), not only the three reported screens.
- `EntityTabs/Features/Features.tsx` and `Assets/Resources/ResourceFeatures.tsx` (the asset-application Features tab, which has the same group markup): each switch group is `items-start` instead of the default stretch. The 2.0 `Switch` root and the tooltip's trigger span are flex items of that column and filled the row, so a centred placement centred on the row. Two earlier attempts (`triggerClassName="w-fit"`, then a `w-fit` wrapper with `asChild`) did not help.
- Component tests for both, and the `Features` spec (previously `describe.skip`) re-enabled against the wrapper.
- Both reported fixes are checked against the root-cause theory first: confirm `scrollTop` on the `Content` root changes after a click, and that switching the class live removes the jump. If `overflow-clip` breaks a `sticky` descendant (sidebar, footer), fall back to a `relative` wrapper around the scrolling content area — see `design.md`.

## Capabilities

### New Capabilities
- `content-shell-scroll-containment`: the application content shell never scrolls programmatically when a visually hidden control inside it receives focus.
- `features-inherited-tooltip-placement`: the inherited-feature tooltip on the Features tab appears under the hovered switch, aligned to it.

### Modified Capabilities
None.

## Non-goals

- Changing the kit's `Switch` markup or asking upstream for a `BottomStart` placement (tracked separately; the app-level fix does not depend on it).
- Re-auditing the other ~40 `Switch` call sites beyond confirming the shell fix covers them.
- Reworking `Features` layout or the app-runner inheritance logic.
- Browser verification tasks (declined for this change).

## Impact

- `apps/ai-dial-admin/src/components/Content/Content.tsx` — shared shell wrapping every page. `overflow-clip` also stops the box acting as a scroll container for `position: sticky` descendants; `Sidebar`, `Footer`, `Blackout` and `UserMobile` need a check.
- `apps/ai-dial-admin/src/components/EntityTabs/Features/Features.tsx` — shared by Models and Applications in Entities and AI Gateway.
- No API, dependency, or i18n changes.
