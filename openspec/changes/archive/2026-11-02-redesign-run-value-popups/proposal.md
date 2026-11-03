## Why

The Extraction result tab of a single run opens a row-detail panel as a right side panel (table) or a
bottom panel (pivot). In both, a click on a value cell already opens a popup, but the popups and the cell
behavior do not match the new Figma design (`DIAL-Admin-Evaluation--Run`, page "iteration 4", section
"Execution Results"). The design has a text popup for plain values and a separate score popup for metric
values (score chip, `reason` and `logs`). The score popup exists only as unmerged work: a stash from the
Compare redesign (`stash@{2}`) already implements it for Compare, and the same popup is wanted for the
single run's tables.

## What Changes

- **Cells.** In both single-run panels every value cell is clickable as a whole. Long content is
  truncated; hovering or focusing a cell shows the "open in new pop-up" icon at its bottom-right. The side
  panel already truncates to 3 lines. The bottom pivot truncates with an ellipsis that fits the cell
  height, instead of scrolling inside the cell.
- **Text popup.** A click on a non-metric cell opens the text popup restyled to the design: field label as
  title, close button, the full value in monospace, scrolling.
- **Score popup.** A click on a metric cell opens a score popup: metric name as title, a Score card with the
  score chip (including `Error`), a `reason` card open by default and a `logs` card collapsed, each with a
  size label, copy button and line numbers. One component serves single-run (one column) and Compare
  (one column per run, with word-level highlighting of differing reasons).
- **Recover the stash.** Bring over the `FieldCompare/` components, the text-diff util, the metric-info
  reader, and the Compare and pivot wiring from `stash@{2}` (see Impact). The stash is not applied
  wholesale: its new files are checked out, its four conflicting files are merged by hand, and its kit 1.0
  `Dial*` components are moved to the current kit components.
- **Side panel cell.** The truncated-only button of the previous change becomes an always-clickable cell.
  That reverses an assumption of the archived change `redesign-run-row-detail-sidebar`.

## Capabilities

### New Capabilities
- `run-value-popups`: what the two popups show and how they behave — the text popup, the score popup
  (score chip, reason, logs, error state, per-run columns, reason diff highlighting) — shared by every
  surface that opens them.

### Modified Capabilities
- `run-row-details`: the side panel's value cells are always clickable, and what the click opens is
  defined by `run-value-popups`.
- `analytics-bottom-drawer`: pivot cells truncate with an ellipsis instead of scrolling, the whole cell is
  clickable, and the popup is the text or score popup.
- `run-compare-row-details`: metric cells in the Compare pivot and table open the score popup; other cells
  keep the dual-run text diff; Compare cells keep their cell scrolling.

## Non-goals

- Compare's cell scrolling, its text diff popup, and the Compare table layout do not change; only the
  metric popup is new there.
- No change to which fields exist, the Display panel, filtering, or any server action / API.
- No change to the main results grid.

## Open questions

The user has not answered these; the proposal assumes the stated default. Each needs confirmation.

1. **Every cell clickable.** Assumed: all value cells, including the Execution status cell, open a popup,
   per "in both panels a cell must be clickable". This reverses the earlier "only truncated cells" choice.
2. **Truncation in the bottom pivot.** Assumed: the single-run pivot truncates with an ellipsis fitting the
   cell height, as in frames `988:16928` and `1383:13575`. The Compare pivot keeps scrolling, because the
   Figma frames only show Single Run and Extraction results.
3. **Compare popups have no design.** The frames named `Details_Diff` are single-column. Assumed: Compare
   keeps the stash's multi-column score popup restyled with the same tokens, and its text popup stays the
   existing diff viewer.
4. **JSON in the text popup.** The design shows a JSON array as raw text, while the current viewer
   pretty-prints JSON. Assumed: the design is a mock and pretty-printing stays.
5. **Score chip colours.** Assumed: Error / 0 / 1 use the existing absolute score buckets, to be checked
   against the Figma variables (`Score_Error`, `Score_0`, `Score_1`).
6. **Fullscreen button on score cards.** The design's `reason` / `logs` headers show only the size and a copy
   icon; the stash's cards also had a fullscreen button. Decided with the user during apply: no score card has a
   fullscreen button, in a single run or a comparison. The stash's fullscreen paths (the reasons diff and the
   logs viewer) are removed; differing reason words stay highlighted inline.

Not verified: the stashed code has not been run against the current HEAD; Figma variable values for the
chip colours; behavior of the popups at narrow viewports (the frames are 724 and 800 px wide).

## Impact

- Recovered from `stash@{2}` (base `43c81bc29`, 194 commits behind HEAD): the new files under
  `Runs/Compare/ExecutionResults/FieldCompare/`, `src/utils/text-diff.ts`, `src/models/text-diff.ts`,
  `Runs/Details/RowDetails/utils/metric-field-info.ts`, and their specs. Verified without applying: these
  apply cleanly and their imports resolve at HEAD.
- Merged by hand because they changed since the stash's base: `Runs/Details/RowDetails/models.ts`,
  `Runs/View/RowDetails/PivotValueCell.tsx`, and the specs `analytics-bottom-drawer` and
  `run-compare-row-details`.
- Modified: `ExpandableValueCell` / `ExecutionRowDetailTable` (side panel), `PivotValueCell` and
  `ExecutionRowDetailPivotTable` (bottom pivot), the Compare table and pivot, `FullscreenValueViewer`
  (text popup restyle), `Details/BottomDrawer/utils.ts` and `models.ts` (carry the metric info), three
  `Runs.*` i18n keys.
- Shared surface to watch: `PivotValueCell` and `FieldValue` are also used by the Compare pivot;
  `FullscreenDiffViewer` stays as the Compare text popup.
- The stash is kept; it is not dropped by this change.
