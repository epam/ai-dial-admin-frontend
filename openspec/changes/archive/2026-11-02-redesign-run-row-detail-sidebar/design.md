## Context

See `proposal.md` for motivation and the open questions; `specs/run-row-details/spec.md` for behavior.

Current state that shapes the approach:

- Single-run row detail has two surfaces chosen in `use-detail-mode.tsx`. `DetailMode.Drawer` renders
  `ExecutionRowDetailBottomPanel` (pivot; owns loading, `buildRowDetailSections`, display tree, Display
  overlay). `DetailMode.Sidebar` renders `RunMetricDetailPanel` (card layout, own data shaping through
  `getDetailEntries` / `getMetricGroups`). The two share nothing.
- Compare already solved the same pairing: `CompareRowDetailPanel` is one component with a `position`
  prop — `Bottom` renders the pivot, `Right` renders `CompareRowDetailTable` — and a thin bottom wrapper.
  The Compare table is `FilterRow` + `SectionRows` + `DetailRow` in a CSS grid, with sticky chrome
  expressed as `scroll-padding` / `scroll-margin` so `scrollPivotToField` can pin a field below it.
- `RowDetailHeader` already takes `SidebarPosition` and shows the right icon for `Right`.
- `PivotValueCell` already has the hover icon and `FullscreenValueViewer`, but scrolls inside the cell
  and reveals the icon on `group-hover` only.
- `filterRowDetailSections` already works with only primary-side options (`secondary*`, `deltaFilter`,
  `showDiffsOnly` are optional or can be left off), so single run can use it unchanged.
- `use-detail-mode` already keeps one `displayTreeRef` and passes `initialDisplayTree` /
  `onDisplayTreeChange` to the drawer; the sidebar branch just does not pass them yet.
- Both Figma frames are only partial: no loading / error / empty state, no open filter popover, no
  narrow width, and frame `1131:23633` shows inverted chevrons (open question 3).

## Goals / Non-Goals

**Goals:**
- Side panel and bottom drawer load and shape row data **once**, through the same sections and display
  tree, so Display and field order cannot drift between modes.
- The single-run table is built from the same parts as Compare's table wherever the layout is the same,
  and diverges only where the design does (two columns, 40px filter row, truncating cells).
- The truncation + pop-up cell is accessible by keyboard, not only by mouse.

**Non-Goals:**
- Not restyling Compare's table or the bottom pivot, and not adopting the truncating cell there.
- Not making the row-detail layout an AG Grid: this is a static key–value layout, not sortable/editable
  data (`components.md` §6), and Compare's table is the precedent.
- Not changing default hidden fields (open question 4).

## Decisions

**1. One panel parameterized by `position`, not a second panel component.**
Rename `ExecutionRowDetailBottomPanel` to `ExecutionRowDetailPanel`, add `position: SidebarPosition`,
render `ExecutionRowDetailPivotTable` for `Bottom` and the new `ExecutionRowDetailTable` for `Right`,
and pass `position` to `RowDetailHeader`. This mirrors `CompareRowDetailPanel` and removes the need to
duplicate ~100 lines of loading/sections/display-tree logic.
*Alternative:* a new `ExecutionRowDetailSidePanel` beside the bottom one — rejected: two copies of the
load + `buildRowDetailSections` + display-tree effects that must stay identical (the spec requires shared
Display). *Alternative:* extract a `use-execution-row-detail` hook and keep two shells — viable, but one
component with a prop is the established shape here, and the proposal's "new side panel" wording is
satisfied by the `Right` branch. The bottom panel's behavior does not change; only its name and one prop.

**2. Move what both tables need to `Runs/Details/RowDetails/`, parameterize the rest.**
Move `TextFilterCell`, `filterRowDetailSections` (+ its filter models) and the shared cell/sticky
constants out of `Compare/.../RowCompareDetails/`, with `git mv` and import updates in Compare;
Compare's rendered output must be byte-for-byte unchanged. `TextFilterCell` gains a height/offset input
(it currently hard-codes `h-7` and `top-10`), and Compare passes the current 28px so its look does not
change. Add a shared `SectionHeaderRow` taking `isCollapsed`, `onToggle`, label, and a `columnCount`
(or `gridColumn: '1 / -1'`), used by Compare's `SectionRows` and the new table. Chevron size and padding
differ between Compare (12px, `p-3`) and the design (16px, 48px row), so those are props with Compare's
values as defaults.
*Alternative:* import Compare's pieces from the single-run files without moving them — smaller diff but
`View/` would depend on `Compare/` internals in both directions (`Compare` already imports
`View/RowDetails/PivotValueCell`). *Alternative:* copy — rejected: this is the "locally correct,
invents its own shape" failure the repo warns about, and the two tables would drift.

**3. Table structure.** `ExecutionRowDetailTable` is a CSS grid with
`grid-template-columns: <ROW_DETAIL_FIELD_COL_MIN>px minmax(0, 1fr)`; sticky header at `top-0`, sticky
filter row at `top-10`, each 40px, so `scroll-padding-top` is 80px. Section header rows span all columns
and are 48px; field rows keep `ROW_DETAIL_FIELD_INDENT` and `data-field-key` so `scrollPivotToField`
works unchanged, with `scroll-margin-top` equal to the section header row height. Collapsed-section
state, search/filter state and filtering follow `CompareRowDetailTable` (all local `useState`, reset by
`key={resultId}` on the table so a new row clears them). Section labels use `SECTION_I18N` with the
section's own label as fallback, as Compare does; long labels truncate with `EllipsisTooltip` per
`a11y.md`.
Collapsible header: `<button aria-expanded>` with a chevron `aria-hidden`; down = expanded.

**4. Row hover.** Each field row is a `display: contents` wrapper with `group`, as Compare's `DetailRow`
is, and both cells get `group-hover:bg-accent-primary-alpha`. Heat-map score cells keep their own
background (no hover tint) so the score colour stays readable; the Field cell of that row still
highlights. Tokens only, no hex.

**5. Truncating cell: `ExpandableValueCell`, popup state at the table.**
- `FieldValue` gets one prop for the clamp class (default stays `line-clamp-4`, so the other callers are
  untouched); the single-run table passes `line-clamp-3`. It already reports overflow through
  `onOverflowChange` and re-checks on resize, which is what makes "widen the panel → affordance goes
  away" work.
- The cell holds `isOverflowing` state, and renders a `<button>` only while it is true; otherwise a plain
  cell. A plain cell for a non-overflowing value avoids a pointless tab stop and a pop-up of text that is
  already fully visible. Because the overflow check runs after the first render, the cell is plain until
  measured, then becomes a button; the Field-cell/row geometry does not change when it flips.
- The button gets an accessible name from a new i18n key (`Runs.OpenFullValue`, "Open full value") via a
  visually-hidden span or `aria-label`, `aria-haspopup="dialog"`, and shows the `open-pop-up.svg` icon
  `aria-hidden`. The icon is `opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100` on the
  cell's own `group`, with a focus-visible ring on the button — keyboard parity per `a11y.md`.
- One `FullscreenValueViewer` lives in the table (`{ fieldLabel, value } | null`), like `diffView` in
  Compare's table, instead of one mounted per cell. The cell only receives `onOpen`.
- Score cells and the Execution status never use the clamp, so they never become buttons.
*Alternative:* reuse `PivotValueCell` with a `truncate` prop — rejected: it is shaped around the pivot
grid (`h-full`, `fill` scrolling, own popup state, shared with Compare's dual-run popup), so a mode flag
would branch most of it. *Alternative:* always make every value a button (what `PivotValueCell` does) —
rejected per open question 1; trivial to switch later because the affordance is gated by one boolean.

**6. Wiring in `use-detail-mode`.** The sidebar branch renders `ExecutionRowDetailPanel` with
`position={SidebarPosition.Right}`, the same `initialDisplayTree` / `onDisplayTreeChange`, and
`focusFieldKey` / `focusRequestId`, with `ROW_DETAIL_SIDEBAR_CLASS`. `switchToSidebar` keeps passing a
null field key. `metricBindings` and `snapshotsToBindingsMap` are removed only after confirming nothing
else reads them (`ExtractionResult` computes it solely to pass it in). `DetailMode`/`useDetailMode`'s
public return shape is unchanged.

**7. New i18n keys** `Runs.ValuesColumn` ("Values") and `Runs.OpenFullValue`, added to `RunsI18nKey` and
`locales/en.ts`; `FieldColumn`, `RunCompareDisplay`, `SwitchToBottom`, `RunCompareFilterField` are reused.

**8. Removal is a separate step after the new panel is wired.** The old panel and card components are
deleted in the second PR together with their specs; `DetailRequestAccordion` and `DetailSection` have no
importers today and go too. `getDetailEntries`, `getMetricGroups`, `getPanelTitle` and their cases in
`View/tests/utils.spec.ts` go with the panel, `formatBindingValue` copies are removed only where unused.
Shared helpers with other importers (the `BottomDrawer/utils.ts` and `TestSuites/Metrics/utils.ts`
`formatBindingValue`, `CodeViewer`, `JsonEditor`) stay.

## Risks / Trade-offs

- **Dropping functionality (open question 2)** — the JSON switch, per-metric info, group errors and
  bindings are no longer reachable from this panel → this ships only after the user/designer confirms;
  if any is kept, it becomes a follow-up row or popup, not a reason to keep the old panel.
- **Moving shared files can change Compare silently** → move with unchanged defaults, keep Compare's
  existing specs green without edits to their assertions, and run both typechecks (a moved import in a
  spec fixture only surfaces in `typecheck:specs`).
- **Overflow measurement flicker** — a cell becomes a button after the first layout pass → the cell's
  box is identical in both states; the spec scenario covers the resize case.
- **`position`-parameterized panel grows** — `ExecutionRowDetailPanel` now picks between two bodies →
  keep body logic in the two table components and the panel to wiring, as `CompareRowDetailPanel` does.
- **Design tokens** — design uses `stroke/secondary` row borders where Compare's table uses
  `border-tertiary` → read the design variables at apply time and choose per table; do not assume.
- **Unspecified states** — loading/error reuse the bottom panel's existing spinner and `LoadError`
  text; empty (all rows filtered out) shows no rows and keeps the header. These are assumptions, not
  design.

## Migration Plan

No data or API change. Ship as two PRs: (1) shared extraction + table + cell with their specs, with
the old panel still wired; (2) wire the new panel in `use-detail-mode`, remove the old panel and dead
code. Rollback of (2) is a revert; (1) is inert until (2).
