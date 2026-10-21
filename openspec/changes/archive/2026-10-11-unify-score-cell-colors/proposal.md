## Why

Extraction Result's metric columns show a score as a progress bar (`ScoreBar`) next to a
neutral-colored number, and the Heat Map tab (Run Compare + Test Case Stability) shows a score as a
number on a flat-hex background with an always-on border — two different visual languages for the
same underlying "score between 0 and 1" concept, built from two independent, uncoordinated bucket
maps (`Common/ScoreBar`'s 11-step map, `Common/ColorScale`'s 10-step accuracy map +
positive/negative delta maps). Neither gives the number itself a meaningful color: text is always a
neutral `text-primary`/`text-secondary` token, so the only score signal in Extraction Result is the
bar, and in the Heat Map the only score signal is the cell background. A new DIAL Data Visualization
design replaces both with one visual language — a right-aligned number on a colored background,
where text and border share one bucket-driven accent color — and finer-grained buckets (12 for an
absolute 0.00–1.00 score, 8 for a −1.00–+1.00 delta) than either existing map uses today.

## What Changes

- Add a shared score-to-style module (new 12-bucket absolute palette, 8-bucket delta palette, each
  with independent background/text/border colors per light/dark theme) and one AG Grid cell
  renderer that applies it. Extraction Result, the Heat Map tab, and Test Case Stability switch to
  it. `Common/ScoreBar` and `Common/ColorScale`'s accuracy/delta color maps are **not** deleted —
  they stay in the codebase because `Runs/Compare/ExecutionResults/utils/columns.ts` (the diff-border
  file, out of scope below) and `Runs/Details/MetricCard.tsx` (a summary card outside Extraction
  Result and the Heat Map tables, also out of scope) both still depend on them after this change.
- Extraction Result's metric columns drop the `ScoreBar` progress bar; a score renders as a
  right-aligned, background-colored number instead. The bar still appears in Compare Execution
  Results' metric columns and in `Runs/Details/MetricCard.tsx`, both unaffected by this change.
- Heat Map tab (Run Compare, both Absolute and Delta display modes) and the Test Case Stability
  heatmap switch to the new palette. The cell border — currently hardcoded on for every value cell
  (`borderRight` + `borderBottom`) — becomes opt-in and off by default; no heatmap consumer turns it
  on in this change.
- The Heat Map tab's "hide value text" behavior (automatic only, driven by a 48px column-width
  threshold) is unchanged. A hidden value stays available to assistive tech via the existing cell
  tooltip / an `aria-label`.
- The `ColorScale` legend component is restyled to the new bucket counts and colors.
- Compare Execution Results' paired-metric diff border (`compare-metric-improved/new/regressed-*`
  in `ag-grid.scss`, driven by `MetricDeltaKind`) is explicitly **not** touched — it is a separate,
  already-correct 3-state semantic (added/changed/removed) indicator, unrelated to score magnitude.
  Its metric-cell rendering (`MetricScoreCellRenderer`/`ScoreBar`, `getAccuracyColors`) is left as-is
  for the same reason: untangling it from the diff-border `cellClassRules` on the same columns is out
  of scope here.
- `Runs/Details/RowDetails/FieldValue.tsx`'s inline score-bar row and `Runs/Details/MetricCard.tsx`
  are explicitly **not** touched — neither is part of Extraction Result or the Heat Map tables, and
  both keep using `Common/ScoreBar`/`Common/ColorScale` unchanged.

## Capabilities

### New Capabilities
- `score-cell-rendering`: the shared value→style contract — given a score (0.00–1.00, "absolute")
  or a difference between two scores (−1.00–+1.00, "delta") and a theme, resolve a background,
  text, and border color from the matching bucket; render as a right-aligned AG Grid cell; draw no
  border while the value is visible and the value text hideable while remaining accessible when
  hidden. Covers both Extraction Result's and the Heat Map/Stability's use of this
  renderer.
- `run-compare-heat-map`: the Heat Map tab's use of the shared score-cell palette (no border between
  cells with visible values).

### Modified Capabilities
- `test-suite-trends`: the Test Case Stability heatmap's "shared accuracy heatmap coloring"
  requirement is updated to use the new `score-cell-rendering` palette and its border-off default,
  replacing the always-on border the shared heatmap grid shell relied on before.

## Impact

- Added: `src/components/Common/ScoreCell/{models.ts,constants.ts,utils.ts}`,
  `src/components/Grid/CellRenderers/ScoreCellRenderer.tsx`.
- Changed: `Runs/View/utils.ts` (`getMetricsColumns`),
  `Runs/Compare/HeatMap/utils/build-heat-map-columns.ts`, `Runs/Compare/HeatMap/HeatMapToolbar.tsx`,
  `Runs/Compare/HeatMap/utils/build-heat-map-cell-tooltip-data.ts`,
  `TestSuites/Trends/utils/build-stability-columns.ts`, and `Common/ColorScale/ColorScale.tsx` are
  updated to use the new module. `Grid/CellRenderers/MetricScoreCellRenderer.tsx` and
  `Common/HeatMap/HeatMapValueCellRenderer.tsx` (+ its `Runs/Compare/HeatMap` wrapper) lose their
  Extraction Result / Heat Map / Stability callers and are deleted once those are the only callers
  left — see Decisions in `design.md` for why they are **not** deleted outright.
- Kept, unmodified: `Common/ScoreBar/{ScoreBar.tsx,constants.ts,utils.ts}` and
  `Common/ColorScale/{constants.ts,models.ts,utils.ts}` (the accuracy/delta bucket maps) — both stay
  in the codebase because `Runs/Compare/ExecutionResults/utils/columns.ts`,
  `Runs/Details/RowDetails/FieldValue.tsx` (+ `row-detail-sections.ts`), and
  `Runs/Details/MetricCard.tsx` still depend on them and are out of scope.
- Unaffected: `Runs/Compare/ExecutionResults/*` (diff-border system), `ag-grid.scss`'s
  `.compare-metric-*` rules, `CompareDeltaCellRenderer`, `MetricDeltaBadge`,
  `Runs/Details/RowDetails/FieldValue.tsx`, `Runs/Details/MetricCard.tsx`.
- No API or server-action changes; this is a presentation-layer rework of existing grid columns.
