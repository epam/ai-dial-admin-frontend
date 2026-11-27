## Context

Issue #5197 (see proposal). ui-kit's 2.0 `Popup` builds its panel class from
`popupBaseClassName` (`... max-h-full flex-col ... md:h-auto`), a size class (`max-w-full md:max-w-[800px]`
for `Md`, `…[1200px]` for `Lg`), then the caller's `className`, merged by the kit's `mergeClasses`
(`tailwind-merge`). `tailwind-merge` removes a class only when a later one has the same variant and the
same group. `h-[800px]` (no variant) and `md:h-auto` are different variants, so both survive, and the
`md:` rule wins at ≥768px. The panel is content-sized, and `h-full` bodies inside it collapse.

The app's utilities are emitted `important`, but that only decides app-vs-kit rules, not two utilities
from the same stylesheet.

## Goals / Non-Goals

**Goals:**
- A `Popup` given a fixed height keeps it at ≥768px whatever its content.
- One mechanical, reviewable change per site.

**Non-Goals:**
- Changing the ui-kit, mobile layout, modal sizes, or other overlay types.

## Decisions

### Prefix the height with `md:` at each call site
`md:h-[800px]` has the same variant and group as `md:h-auto`, so `tailwind-merge` drops the kit's class
and ours stays. Below 768px the kit's `h-auto` plus full-screen padding applies, as designed.

Alternatives:
- **Override `.dial-popup { height }` in `tailwind.css`.** One edit, but it applies to every popup,
  including ones that want content height, and hides the kit's contract.
- **A local `FixedHeightPopup` wrapper.** Invents a component the kit lacks, and ~30 sites would still
  change. The kit's own prefix convention is enough.
- **`!h-[800px]`.** Wins regardless of variant, but defeats `tailwind-merge` and is hard to override
  later; the project avoids `!` outside the global `important` import.
- **Raise it with the kit so a caller height wins.** Right long term; not shippable here. Tracked as a
  follow-up, not a dependency.

Only the height class is touched. Composite classes (`AddMetricModal`:
`h-[800px] w-[1200px] max-w-[calc(100vw-2rem)]`) keep their other tokens; `w-*` and `max-w-*` are not
overridden by a kit `md:` class of the same group except `md:max-w-*` from the size map, which is already
the intended winner there.

### `min-h-*` and `max-h-*`
- `max-h-*` (`CreateApplication`, `CreateKeyModal`): no conflict with `md:h-auto`; unchanged.
- `min-h-*`: height stays `auto`, so a body using `h-full` or `flex-1 min-h-0` has no definite height.
  `RulesCompare` / `RulesStructure` size to their content with a floor, which is intended; unchanged.
  `EditRequestWizard` (`min-h-[800px]`) has a height-dependent body: decided by inspection in the task,
  converting to `md:h-[800px]` only if its content fills the panel.

### #5200: scan the file-manager package for utilities
The kit is already an `@source` because `important` makes the app's utilities beat the kit's unlayered rules; the same sheet means a library class pair like `opacity-0 group-hover/grid-row:opacity-100` is split between an `!important` base (the app's, since the kit uses `opacity-0`) and a plain variant (the library's own sheet). Adding the library to `@source` emits its variants `!important` as well, and Tailwind sorts variants after base utilities with higher specificity, so the hover reveal wins. Checked by compiling `tailwind.css` before and after: the variants (`group-hover/grid-row:opacity-100`, `…:pointer-events-auto`, `group-hover/item:visible`) appear only after, `!important`, after `.opacity-0`.

Alternatives: a hand-written `.file-manager-grid` override (fixes only this one class pair, and hover only, and rots with each library release); dropping `important` (needs a visual diff of the whole app, tracked as the migration's follow-up); asking the library to stop hiding with a utility pair (right long term, not shippable here).

## Risks / Trade-offs

- [Every library utility is now `!important` and built from the app's theme] → the surface is file-manager lists and its popups; verify visually before merge.

- [`tailwind-merge` does not dedupe `md:h-[…]` against `md:h-auto` as assumed] → task 1 checks it
  against the kit's `mergeClasses` for the three height forms (`px`, `vh`, `min-h`) before the sites move.
- [A fixed height taller than a short viewport overflows] → `max-h-full` from the base class still caps
  it; unchanged from the legacy popup.
- [Heights set outside a literal `Popup` are missed] → task 1 greps wrapper components that forward
  `className` to `Popup` (e.g. `InputPopup`).
- [Specs asserting `h-[800px]` break] → updated with the component.

## Open Questions

- Should mobile keep content height, as the kit intends, or fill the screen for tall modals? Assumed
  unchanged; flag if design disagrees.
