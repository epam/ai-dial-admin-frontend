## Context

See proposal.md for motivation. The facts that shape the approach:

- Both grids are fed by `getTestCaseRunResults` (`GET api/v1/analytics/eval-summaries`), one row per execution
  (`runIndex` / `requestIndex` / `turnIndex`). Verified on the live response for Run #3143: the rows carry
  `metricValues`, `executionStatus`, `execDurationMs`, `responseStatusCode` and identity fields, and **no
  score**; the `eval_summaries` query entity exposes none either.
- The only score source is the `test_case_eval_scores` structured-query entity — one row per test case per
  run (`test_suite_run_id`, `test_case_id`, `test_case_name`, `score`, `passed`). The Summary tab and the Trends
  stability matrix already query it, through the `executeStructuredQuery` server action and the builders in
  `utils/structured-query/build`. A plain mean of the row's `metricValues` reproduces its `score` for Run #3143,
  but the backend owns the scoring rules (Mean / Weighted mean, missing metrics), so the client must not
  recompute them.
- The threshold is `run.suiteSnapshot.overallScoreThreshold`: `undefined` when off, `null` when enabled but
  empty. The Summary card (`OverallScoreValue`) already renders the above/below glyph with `ChevronBadge` and
  tooltip keys of the form "Overall score is above the threshold ({threshold})."
- Single-run columns are the static `executionColumns` array in `Runs/View/utils.ts`; Compare builds one column
  per run through `buildRunColumns` in `Compare/ExecutionResults/utils/columns.ts`, and its panel, diff counting
  and "view differences only" logic key off the Execution colIds (`http`, `duration`, …) in `panel-columns.ts`
  and `metric-utils.ts`.
- PR #5213 (unmerged, test-case grouping) already contains a query/lookup for this data. It is a reference for
  the query shape only; this change does not depend on it and does not group rows.

## Goals / Non-Goals

**Goals:**

- One extra request per grid, started with the results request, and no per-test-case requests.
- A single cell renderer and a single value rule shared by the single-run and Compare grids.
- Compare behavior that follows the existing per-run Execution columns (`HTTP`, `Duration`) with no new
  mechanism for panel, diff border or diff counting.

**Non-Goals:**

- Row grouping, group summary rows, or any change to the flat-row contract in `run-results-turn-columns`.
- Recomputing scores on the client, or a backend change.
- The score in the Heat Map or CSV export.

## Decisions

### D1 — Join `test_case_eval_scores` on the client, not a client-side mean and not a new backend field

One row query selects `test_suite_run_id`, `test_case_id`, `test_case_name`, `score` and `passed` with
`test_suite_run_id IN (runIds)` and a 10,000-row limit. The rows become a lookup keyed by
`runId::testCaseId`, falling back to `runId::testCaseName` (the same two-step identity Compare already uses in
`mergeByTestCaseId` for a public vs. detached copy).

Alternatives considered:

- *Compute the mean from `metricValues` using the snapshotted `testCaseOverallScore`.* No request and
  per-execution granularity, but it duplicates backend scoring (weights, errored or missing metrics, suite
  functions) and can drift from the Summary pass rate. Rejected.
- *Ask the backend for a per-row field on eval-summaries.* Cleanest, but it did not exist at the time of
  writing and the backend team pointed to the extra-query approach. If it ships, the join becomes unnecessary
  and the renderer is unchanged (see D3).

Trade-off accepted: the score is per test case, so every row of a repeated or multi-turn test case shows the
same value. This is stated in the spec.

### D2 — Load the scores next to the results, store them in tab state, derive the rows

- **Single run** (`ExtractionResult.tsx`): a second effect, started with the results effect, calls
  `executeStructuredQuery(buildTestCaseScoresQuery([run.id]))` and stores the parsed summaries in the tab state
  (`ExtractionResultTabUiState.testCaseScores`, `null` until loaded, `[]` on failure). Tab state is where
  `results` already lives, so the tab-switch caching behavior is the same.
- **Compare** (`ExecutionResultsTab.tsx`): one effect queries with both run ids and stores the summaries in
  `ExecutionResultsTabUiState`. Two per-run requests would double the cost for no benefit. The effect keys on
  the pair of ids. A baseline flip resets the tab state, as it already does for the results, so both reload.
- The rows handed to the grid are derived with a pure util that attaches a client-only `testCaseScore`
  (`number | null`) to each `AnalyticsResult` (single run) or to both sides of a `CompareAnalyticsRow`. The
  field is declared on `AnalyticsResult` with a comment that the backend never sends it, following the
  `costWaitStartedAt` precedent on `Run`. Deriving (not mutating the fetched rows) keeps `results` identical to
  the response, so the metric-schema merge is untouched; the row-detail panels get the score separately (D7).
- **Readiness:** the grid waits for the scores as it waits for the results, so a cell never flips from a dash to
  a value. A failed query resolves to an empty list (D5) so it never holds the grid back.

### D3 — The column reads one row field, so the source can change later

The valueGetter returns `data.testCaseScore` (rounded with `+value.toFixed(3)`, the same rounding the metric
columns use, which also drops trailing zeros) or `undefined` when missing; the renderer shows a dash for a
missing value. Neither the column nor the renderer knows where the number came from.

### D4 — One cell renderer in `components/Grid/CellRenderers/`

`OverallScoreCellRenderer` takes the threshold as a `cellRendererParams` value. It renders the value and icon
right aligned, like the other numeric columns, with `ChevronBadge` (reused from `Common/ChevronBadge`) when a threshold exists and a score is present,
and a dash otherwise. The threshold decision (`score >= threshold` → above) lives in a small pure util in
`Runs/` so the single-run and Compare columns and the tests share it. The `null` threshold (enabled, empty) is
treated as no threshold, as `OverallScoreValue` does.

In Compare each run's column is built with that run's threshold. `CompareRun` does not carry the run entity, so
the Compare tab already needs the two thresholds: it reads them from the runs it loads for the results (`getRun`
in `loadRunResults`) and passes them into the column builder options, defaulting to "no threshold" until known.

- **Tooltip:** the kit `Tooltip` on the icon+value, message from new `RunsI18nKey` entries
  (`Overall score`, "The test case's overall score is above the threshold ({threshold}).", and the below
  variant). The threshold is formatted with the existing `formatThreshold`. No `tooltipValueGetter` is set (the
  a11y rule against a second, non-keyboard tooltip).
- **Accessibility:** the cell is `role="group"` with an `aria-label` of the score plus the same message, and the
  icon is `aria-hidden` (already how `ChevronBadge` renders). The renderer mounts no extra focusable node, so
  grid Tab order is unchanged; the implementation checks with the ui-kit MCP that the kit `Tooltip` shows on
  cell focus and, if it does not, relies on the `aria-label` for keyboard users.
- The value text uses theme tokens only; the icon colors come from `ChevronBadge`'s `score-abs-*` tokens.

### D5 — Missing and failed scores degrade to a dash

`parseTestCaseScores` keeps a row only when it has a run id and turns a non-finite score into `null`. A thrown
or `null` query result becomes an empty list, so every cell shows a dash and the rest of the grid is
unaffected. No toast: the data is a supplement to a grid that is otherwise complete, and the dash is the
specified outcome.

### D6 — Column placement and ids

- Single run: a `buildOverallScoreColumn` in `Runs/View/utils.ts` inserted in the execution columns immediately
  before `HTTP` (the Compare grid and its panel use the same order), `colId: 'overallScore'`, locked width (new `OVERALL_SCORE_COLUMN_WIDTH` in
  `grid-column-layout.ts`, wide enough for the icon and three digits), `NO_FILTER_COL_DEF`, right-aligned
  header and cells like the other numeric columns, sortable with the existing `numberValueComparator` (dashes last in both directions).
  `getAnalyticsColumns` gains an options argument carrying the threshold; the pre-fetch default build passes
  none. It is not in `EXECUTION_INDEX_FIELDS`, so `hideUniformColumns` leaves it visible.
- Compare: a `buildRunOverallScoreColumn` — `hide: true`, colId via `getCompareRunColId(slot, 'overallScore')`,
  and `pairCellClassRules` with a numeric pair-kind getter. Following the metric columns, **every** Execution
  field (`# Run number`, `Request`, `Turn`, `Overall score`, `HTTP`, `Duration`) becomes a group — its name as
  an `EllipsisHeaderGroup` over a leaf per run headed by the bare run-index badge (`compareRunIndexHeaderDef`
  loses its label parameter, and `formatCompareColumnHeader` goes with it). This keeps the title row and the
  badge row aligned across the grid; mixing flat `[1] HTTP` headers with a grouped score left the title rows
  displaced. Because the panel tree is flattened back into grid defs, `panel-columns.ts` reads the Execution
  leaves through nested groups (`nestExecutionGroup`) and, when flattening the Execution group, keeps each
  field group's title and leaves instead of flattening to bare leaves.
  `{ fieldLabel: 'Overall score', colId: 'overallScore' }` is added to `EXECUTION_FIELD_GROUPS` so the panel
  lists and reconciles it, and `collectCompareColumnBlocks` treats each group nested in Execution as a block
  so a drag cannot pull a pair apart.
- `metric-utils.ts`: add an overall-score diff check beside `hasHttpDiffForVisibility` /
  `hasDurationDiffForVisibility` and the matching counting branch, gated on `overallScore` / `cmp_overallScore`
  visibility, so hidden columns add nothing and shown ones feed "view differences only" and the legend.
- `map-grid-col-to-pivot-field.ts`: `overallScore` goes in `GRID_ONLY_COLUMNS` (no pivot counterpart), so a
  click on the cell opens the detail panel without trying to focus a field.
- The "variation" comment in `column-variation.ts` that lists the columns exempt from the rule gains the new
  column; behavior is unchanged.

## Risks / Trade-offs

- **[Score is per test case, rows are per execution]** Repeated or multi-turn test cases repeat the value on
  every row, and a failed execution of a test case that has a score still shows that score → Stated in the spec
  and the proposal's non-goals; if the backend adds a per-row field the join is replaced without a UI change.
- **[Test cases past the row limit]** A run with more than 10,000 test-case scores would lose the excess → The
  results request is already capped at 1,000 rows, so the grid cannot show more test cases than the score query
  returns; no pagination.
- **[Identity mismatch]** A row whose test case id is absent from the score rows shows a dash → The
  name-keyed fallback covers detached copies; anything still unmatched is genuinely unscored.
- **[Extra request on a slow backend]** The grid now waits for two requests → They run in parallel, so the
  added latency is the slower of the two, not the sum. A failed score request does not block the grid (D5).
- **[Threshold source in Compare]** Reading each run's threshold requires the run entity → The Compare tab
  already loads both runs for their results; the threshold is taken from those, with no additional request.

### D7 — The row detail panels read the score through the same row field

The bottom drawer and the right side panel fetch the row's detail by id (`getTestCaseRunResultDetails`), which
returns no score. The score therefore comes from the grid rows the panels were opened from:

- `buildRowDetailSections` already builds an Execution section (status, run number, HTTP, duration) from
  `AnalyticsResult`s; it gets one more meta field, **Overall score** (`fieldKey: 'overallScore'`), placed after
  the run number. Its raw value is the same three-decimal rounding as the column, `null` when the result has
  no score, numeric (so Compare diffs it with the existing numeric rule and counts it in the panel's diff
  legend), and not a score-bar indicator. The pivot gets the existing narrow score width tier.
- **Single run:** `ExtractionResult` builds a `resultId → score` map from its scored rows and passes it to
  `useDetailMode`, which hands the opened row's score to `ExecutionRowDetailPanel` as `testCaseScore`. Passing
  the map (not the score at `openDetail` time) keeps the value when the panel is re-shown after switching
  between the drawer and the side panel. The panel merges it into the fetched detail before building sections.
- **Compare:** `CompareRowDetailPanel` already receives the merged grid row, which carries each run's score
  (`row.testCaseScore`, `row._compared.testCaseScore`); it merges them into the two fetched details.
- **Visibility:** the field is a normal Display-tree entry, so it is configurable in each panel's Display panel.
  It is visible by default in both panels, including Compare, whose panel hides run number and HTTP by default
  — a score the user turned on in the grid is then already there, without linking panel state to grid column
  state. Clicking an Overall score cell in the grid focuses the field in the panel (`mapGridColToPivotField`
  now maps `overallScore` to it).

### D8 — The panels' score row gets the same icon and tooltip

The threshold is needed next to the value, so it travels with the row: `RowDetailField` gains optional
`primaryThreshold` / `secondaryThreshold` (set on the overall score row only), filled by `buildRowDetailSections`
from a new `RowDetailScoreThresholds` argument (`primary`, `compared`).

- **Where thresholds come from:** single run — `run.suiteSnapshot.overallScoreThreshold`, passed through
  `useDetailMode` to `ExecutionRowDetailPanel` (so the value survives a drawer ↔ side panel switch). Compare —
  the two runs' thresholds the Execution results tab already stored in its state, memoized in `CompareView` and
  handed to `CompareRowDetailPanel` (directly for the side panel, through `CompareRowDetailBottomPanel` for the
  drawer). Each run's cell reads against its own threshold, as in the grid.
- **Icon:** `FieldValue`, the one value renderer all four panel cells share, takes an optional `threshold`; with a
  threshold and a numeric score it renders `ThresholdScoreValue` — the value, then `ChevronBadge`, plus the result
  as `sr-only` text (the pattern the Summary card uses) instead of an `aria-label`, because the cell is inside a
  button. Other fields never get a threshold, so nothing else changes.
- **Tooltip:** wrapped around the whole value *cell* (`ScoreThresholdTooltip`), not the icon. The side panel's
  cell has a full-cell overlay button for opening the value, which would swallow hover on an inner trigger;
  `mouseenter` on the cell fires whichever descendant is entered. The message comes from the same
  `getOverallScoreThresholdMessage` helper the grid cell uses, so the wording cannot drift.
- **Alignment:** the overall score joins run number, HTTP and duration in the right-aligned field keys, so the
  panels align it like the grid column.
- **Narrow side panel:** the Run Comparison side panel's Field | run 1 | run 2 | Delta table shrank each run's value
  column to 37px at a 1200px viewport, clipping the icon (found in browser verification). The run value columns now
  have a 72px minimum, taken from the field column, which shrinks from 212px to as low as 140px only when the panel
  is narrow (`ROW_DETAIL_GRID_TEMPLATE_COLUMNS`). At normal widths the layout is unchanged.
