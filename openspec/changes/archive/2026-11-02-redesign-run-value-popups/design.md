## Context

See `proposal.md` for motivation and open questions; `specs/` for behavior.

Current state that shapes the approach (all verified against HEAD unless marked):

- **Side panel** (`Runs/View/RowDetails/ExecutionRowDetailTable` + `ExpandableValueCell`, committed in the
  previous change): the cell renders `FieldValue` clamped to 3 lines and mounts an overlay `<button>` only
  while the value overflows; one `FullscreenValueViewer` lives in the table.
- **Bottom pivot** (`ExecutionRowDetailPivotTable` + `PivotValueCell`): every cell is a `<button>` with the
  hover icon on `group-hover` only, `FieldValue` in its `fill` variant (scrolls inside the cell), and its own
  popup state. `PivotValueCell` is also used by the **Compare** pivot, which passes `onOpenFullscreen`.
- **Compare** (`CompareRowDetailTable`, `CompareRowDetailPivotTable`) opens `FullscreenDiffViewer` for every
  field; there is no score popup.
- **The stash** `stash@{2}` (WIP on `feat/run-results-redesign`, base `43c81bc29`, 194 commits behind HEAD)
  holds the score popup for Compare and the single-run pivot. Checked read-only: its 12 new non-test files
  apply cleanly and every import resolves at HEAD; only `Details/RowDetails/models.ts`,
  `View/RowDetails/PivotValueCell.tsx` and two specs conflict. It uses kit 1.0 `DialPopup`,
  `DialGhostIconButton` and `DialEllipsisTooltip`; HEAD has none. It has not been run or typechecked here.
- **Designs**: the Figma frames have only single-run popups (one column). The `Details_Diff` frames exist
  twice with identical pixels (`1125:*` and `1383:*`); one set is used.

## Goals / Non-Goals

**Goals:**
- One score popup and one text popup, opened identically from the side panel, the bottom pivot and Compare.
- Recover the stash's work without losing its tests and without a wholesale `git stash apply`.
- Every single-run cell is clickable, truncates, and shows the hover/focus icon, in both panels.

**Non-Goals:**
- Not redesigning Compare's table or pivot, its scrolling cells, or its text diff.
- Not changing how metric info is fetched; `metricInfos` is already in the row detail response.

## Decisions

**1. Recover by patch, not by `git stash apply`.** Write `git stash show -p stash@{2}`, apply it with
`git apply --exclude=` for the four conflicting paths and the two spec files (specs are carried by this
change's own deltas), then hand-merge the four. This keeps the clean hunks (Compare table and pivot wiring,
`run-field-values`, `BottomDrawer` models/utils, i18n keys) and avoids conflict markers across 37 files.
The stash is left in place. *Alternative:* `git stash apply` and resolve — rejected: it conflicts on files
this branch has since reworked, and leaves a half-applied tree if it fails midway.

**2. Move the shared popup out of `Compare/`.** After the patch applies, `git mv`
`Compare/ExecutionResults/FieldCompare/*` to `Runs/Details/ValuePopups/`, dropping "Compare" from the names
that are no longer Compare-only (`ScoreCompareModal` → `ScoreModal`, `ScoreCompareColumn` → `ScoreColumn`).
`FieldCompareModal` (metric → score popup, otherwise the text diff) stays in Compare. Single run gets
`Runs/View/RowDetails/RunValueModal` (metric → `ScoreModal` with `SINGLE_RUN_COLUMNS`, otherwise the text
popup). *Why:* the stash's own `PivotValueCell` change already imports Compare's folder from `View/`,
and `Compare` already imports `View/RowDetails/PivotValueCell`, so leaving it would tighten a circular
dependency between the two feature folders. *Alternative:* keep the stash layout — smaller diff, but the
cycle grows with the side panel as a third importer.

**3. Migrate kit 1.0 components in the same step as the move.** `DialPopup` → `Popup`,
`DialGhostIconButton` → `GhostIconButton`, `DialEllipsisTooltip` → `EllipsisTooltip` (the same props at the
call sites used; confirm with the ui-kit MCP server rather than by grep), per `.claude/rules/a11y.md`.
Typecheck both projects before restyling so a failure points at the migration, not at the design work.

**4. Always-clickable side-panel cell.** `ExpandableValueCell` drops its `isOverflowing` gate: the overlay
button is always rendered and covers the whole cell, including full-bleed score cells; the icon shows on
`group-hover/cell` and `group-focus-visible`. It stops owning popup state: `onOpen(field)` goes up to the
table, which renders `RunValueModal` for the selected field. The clamp stays at 3 lines. `ExpandableValueCell`
is renamed `ValueCell` only if the diff stays reviewable; otherwise keep the name.

**5. Bottom pivot truncates to the cell height.** `FieldValue`'s `fill` variant scrolls; a new variant clamps
to the lines that fit. A hook `use-fitted-line-clamp` observes the cell with a `ResizeObserver`, computes
`floor(height / lineHeight)` and sets `-webkit-line-clamp` inline (a fixed `line-clamp-N` class cannot follow
a height that depends on the panel). `PivotValueCell` gets an `isTruncated` prop (`true` from the single-run
pivot); the Compare pivot passes nothing and keeps scrolling. *Alternative:* a CSS-only fade mask — rejected,
the design shows an ellipsis. *Alternative:* `max-height` with `overflow: hidden` — cuts a line in half and
shows no ellipsis.

**6. Score popup layout.** Reuse the stash's `ScoreModal`/`ScoreColumn`/`MetricInfoCard`/`HighlightedEditor`
and restyle to the frames: 800 px wide, title = metric name, Score card, `reason` open, `logs` collapsed,
size label and Copy in each card header. The stash's fullscreen paths are removed: `MetricInfoCard` and
`ScoreColumn` have no fullscreen handler, and `ScoreModal` no longer opens the reasons diff or the logs viewer
(open question 6). Chip colours stay the absolute score buckets until the Figma variables are read (open
question 5).

**7. Text popup.** Restyle `FullscreenValueViewer` to the 724 px frame: field label title, close button,
`font-mono` pre-wrapped body that scrolls; keep its JSON pretty-printing (open question 4). Pick the closest
`PopupSize` from the kit instead of a pixel width where one exists.

**8. Specs.** The score view requirement the stash wrote into `run-compare-row-details` moves to the new
`run-value-popups` capability so single run and Compare do not each restate it; the two surface specs
reference it.

## Risks / Trade-offs

- **Untested stash code** → run its own specs first, after the migration and before any restyle.
- **Monaco inside popups** (`HighlightedEditor`) is heavy in tests and in layout (needs a sized parent) →
  mock Monaco in specs per `testing.md`; give the card body a fixed flex height; check the editor does not
  mount while its card is closed.
- **`PivotValueCell` is shared with Compare** → default every new behavior off; the Compare pivot spec must
  pass unchanged.
- **Always-clickable cells change what a click on a short value does** (it opens a popup now) → this is
  the requested behavior; the hover icon makes it discoverable.
- **Fit-to-height clamp can flicker on resize** → compute inside `useLayoutEffect` and debounce nothing;
  the observer fires after layout, before paint.
- **Renaming moved files hides history** → move in its own commit-sized step before editing the content.
- **Chip colours and popup widths are unverified against Figma variables** → read the variables at apply time
  and note any difference.

## Migration Plan

No data or API change. Steps: patch → move → migrate → typecheck and run recovered specs → restyle →
cell changes → specs. Continue on the current branch `feat/5262-extruction-result-sidebar` as new commits;
no push. Rollback is a revert; the stash is untouched either way.
