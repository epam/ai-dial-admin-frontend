# test-suite-trends Specification

## Purpose
Defines Test Suite Trends tab behavior for summarizing how recent suite runs compare, including
the latest-run KPI strip and chart sections.
## Requirements
### Requirement: Trends tab-line Preview runs badge
When the Trends tab is active, the system SHALL render a Preview runs badge on the entity tab line
(trailing the tabs). Preview runs SHALL reflect the Trends-window `runCount`: “Last 10 Runs”
when at least 10 runs are shown, “Last {N} Runs” when fewer than 10, and “Last 1 Run” when N is 1.

#### Scenario: Preview runs shows full window
- **WHEN** the Trends tab is active and the Trends window has at least 10 runs
- **THEN** the Preview runs badge shows “Last 10 Runs”

#### Scenario: Preview runs shows partial window
- **WHEN** the Trends tab is active and the Trends window has 3 runs
- **THEN** the Preview runs badge shows “Last 3 Runs”

#### Scenario: Preview runs shows singular for one run
- **WHEN** the Trends tab is active and the Trends window has exactly 1 run
- **THEN** the Preview runs badge shows “Last 1 Run”

### Requirement: Latest-run KPI strip
When the Trends tab has at least one run, the KPI strip SHALL include four cards, in order:
1. **Threshold Pass Rate of Latest Run** when `overallScoreThreshold` is set, otherwise
   **Completion Rate of Latest Run** (rate from the latest `test_case_eval_scores` segments;
   loading indicator while the combined eval aggregate is pending)
2. **Overall Score of Latest Run** (latest `runOrder` overall score, threshold glyph/tooltip when
   set, delta vs previous run, and the static "Based on completed test cases" subtitle; no
   calculation-method info)
3. **Total Runtime of Latest Run** (latest combo total + source/Metrics breakdown)
4. **Total Cost of Latest Run** (latest combo total + source/Metrics breakdown)

KPI delta badges SHALL show a tooltip with the full label only when the label is clipped by the badge
width.

Overall Score Trend, Metric Trends, and Test Case Stability section headers SHALL NOT append a
runs-count fragment (the Preview runs tab-line badge covers the window size).

#### Scenario: KPI delta label fits its badge
- **WHEN** a KPI delta label fits within its badge
- **THEN** hovering the badge does not show a tooltip

#### Scenario: KPI delta label is clipped
- **WHEN** a KPI delta label is clipped by its badge width
- **THEN** hovering the badge shows the full label in a tooltip

#### Scenario: Chart section titles omit runs count
- **WHEN** the Trends window has one or more runs
- **THEN** Overall Score Trend, Metric Trends, and Test Case Stability titles do not include a
  runs-count suffix

#### Scenario: Overall score is the latest run value
- **WHEN** the Trends window’s latest run has overall score `0.58`
- **THEN** the Overall Score of Latest Run card shows `0.580` (not a window average)

#### Scenario: Pass rate loading while combined aggregate is pending
- **WHEN** the Trends window has runs and the combined `test_case_eval_scores` aggregate has not
  returned yet
- **THEN** the pass / completion rate card shows a loading indicator instead of a final rate

### Requirement: Pass / completion rate of latest run
The first KPI card SHALL show the latest Trends-window run’s rate from `test_case_eval_scores`
segments (`above / total`). When the suite threshold is set, `above` is SUCCESS + passed; when
unset, `above` is every SUCCESS case. The card SHALL:
- format the rate as a percentage with one decimal (trailing zeros stripped)
- draw a full-width rate bar coloured green (≥ 70%), yellow (40–69%), or red (< 40%)
- show a signed percentage-point delta vs the previous run (`+32% vs prev.`); hide it when either
  rate is missing or the delta is zero (higher is better → green)
- when the threshold is set, show a `Threshold:` footer with the suite threshold value

#### Scenario: Threshold pass rate title and footer
- **WHEN** the suite threshold is `0.6` and the latest run has above `197` of total `200`
- **THEN** the card title is Threshold Pass Rate of Latest Run, the value is `98.5%`, and the
  footer shows Threshold: `0.6`

#### Scenario: Completion rate without threshold
- **WHEN** the suite has no overall score threshold
- **THEN** the card title is Completion Rate of Latest Run and there is no threshold footer

### Requirement: Overall Score of Latest Run KPI card
The second KPI card SHALL show the latest Trends-window run’s `overallScore` (the same value
Overall Score Trend plots), formatted to three decimals. The card SHALL:
- omit the threshold glyph when `overallScoreThreshold` is unset; when set, show an above/below
  glyph beside the value and a hover tooltip stating whether the score is above or below the
  threshold (exact threshold counts as above)
- show a signed delta vs the previous run’s overall score (`+0.12 vs prev.`); hide it when either
  score is missing or the delta is zero (higher is better → green)
- show the static “Based on completed test cases” subtitle and omit the calculation-method tooltip

#### Scenario: Latest overall score value
- **WHEN** the Trends window’s latest run has overall score `0.58` and the previous run has `0.46`
- **THEN** the card shows `0.580` and `+0.12 vs prev.`

#### Scenario: No threshold glyph without threshold
- **WHEN** the suite has no `overallScoreThreshold` and a latest overall score is available
- **THEN** the card shows the score without an above/below glyph

### Requirement: Total Runtime and Total Cost of Latest Run
The third and fourth KPI cards SHALL show the latest run’s combined source + metrics totals from
the same Cost / Runtime combo data the charts use. Each card SHALL:
- show the total as the primary value and a signed delta vs the previous run (lower is better →
  green)
- show a footer with the suite source-kind label and Metrics breakdown values

#### Scenario: Runtime total from combo segments
- **WHEN** the latest run has source runtime `341s` and metrics runtime `291s`
- **THEN** the Total Runtime card shows `632s` and the source / Metrics footer values

#### Scenario: Cost total from combo segments
- **WHEN** the latest run has source cost `$9` and metrics cost `$1.7`
- **THEN** the Total Cost card shows `$10.7` and the source / Metrics footer values

### Requirement: Test Cases by-run stacked-bar card
When the Trends tab has at least one run in its Trends window, the system SHALL render a **Test
Cases** card to the left of Overall Score Trend (stacked above it below the `xl` breakpoint). The
card SHALL:
- when the suite’s `overallScoreThreshold` is set, show a legend with **Above threshold**,
  **Below threshold**, and **Error or N/A**
- when the suite’s `overallScoreThreshold` is unset, show a legend with **Completed** and
  **Error or N/A** (no below-threshold segment)
- load per-run counts from the combined `test_case_eval_scores` aggregate for the current
  `runOrder` run IDs, grouped by `test_suite_run_id`, `passed`, and `execution_status`, selecting
  count (shared with the pass / completion rate card)
- when the threshold is set, classify each count as: SUCCESS + `passed === true` → above;
  SUCCESS + `passed === false` → below; non-SUCCESS or SUCCESS with null `passed` → Error or N/A
- when the threshold is unset, classify each count as: SUCCESS → Completed; non-SUCCESS →
  Error or N/A
- draw one 100%-height stacked bar per run (normalized to that run’s total), segments top-to-bottom
  error / below (threshold set only) / above-or-completed, labeled under the bar with a shared
  Trends x-axis run-name glyph: always rotated 90°, leading `Run` stripped for display, max height
  64px with up to two lines then ellipsis, and the full original name in a hover tooltip
- on hover of a stacked bar, show a tooltip with the run name, **Total test cases**, and a
  breakdown: when the threshold is set — Completed (`above + below`) with nested Above / Below
  threshold rows that include the threshold value in parentheses, plus Error or N/A; when unset —
  Completed and Error or N/A only
- when a run has no `test_case_eval_scores` rows, fill a single-segment bar from the run-level
  overall score when present (above / below when the suite threshold is set; Completed when the
  threshold is unset), or as Error or N/A when the run is failed or has no overall score
- remain visible when the suite’s `overallScoreThreshold` is unset
- omit the design’s hidden **View by** control

#### Scenario: Card shown with runs
- **WHEN** the Trends tab has one or more runs in `runOrder`
- **THEN** a Test Cases card appears to the left of Overall Score Trend

#### Scenario: Segment classification
- **WHEN** a run has SUCCESS rows with `passed` true and false, plus ERROR rows, and the suite
  threshold is set
- **THEN** those counts map to above, below, and Error or N/A segments respectively

#### Scenario: Null passed counts as Error or N/A
- **WHEN** a SUCCESS row has `passed` null and the suite threshold is set
- **THEN** its count is included in the Error or N/A segment

#### Scenario: No-threshold legend and classification
- **WHEN** the suite threshold is unset
- **THEN** the legend shows Completed and Error or N/A, and SUCCESS counts map to Completed

#### Scenario: Empty eval rows fall back to overall score
- **WHEN** a non-failed run has no `test_case_eval_scores` rows, overall score `0.9`, and threshold
  `0.5`
- **THEN** that run’s bar is a single Above threshold segment

#### Scenario: Empty eval rows fall back without suite threshold
- **WHEN** a non-failed run has no `test_case_eval_scores` rows, overall score `0.9`, and the suite
  threshold is unset
- **THEN** that run’s bar is a single Completed segment

#### Scenario: Empty eval rows with no overall score
- **WHEN** a run has no `test_case_eval_scores` rows and no run-level overall score
- **THEN** that run’s bar is a single Error or N/A segment

#### Scenario: Long run name is truncated with tooltip
- **WHEN** a run’s display name does not fit the 64px two-line vertical label slot
- **THEN** the label wraps to at most two lines with ellipsis and the full original name is
  available in a hover tooltip

#### Scenario: Axis label strips leading Run
- **WHEN** a run’s name is `Run #19`
- **THEN** the bar axis label shows `#19` while the hover tooltip still shows `Run #19`

#### Scenario: Bar hover tooltip with suite threshold
- **WHEN** the suite threshold is `0.6` and the user hovers a stacked bar with above `120`, below
  `20`, and Error or N/A `10`
- **THEN** the tooltip shows the run name, Total test cases `150`, Completed `140` with nested
  Above threshold (0.6) `120` and Below threshold (0.6) `20`, and Error or N/A `10`

#### Scenario: Bar hover tooltip without suite threshold
- **WHEN** the suite threshold is unset and the user hovers a stacked bar with Completed `140` and
  Error or N/A `10`
- **THEN** the tooltip shows the run name, Total test cases, Completed, and Error or N/A (no Above /
  Below rows)

#### Scenario: Shared aggregate with pass / completion rate
- **WHEN** the Trends window has one or more runs
- **THEN** Test Cases segments and the pass / completion rate card are derived from one combined
  `test_case_eval_scores` aggregate for those run IDs (not two separate aggregate requests)

### Requirement: Latest Run card
When the Trends tab has at least one run in its Trends window, the system SHALL render a **Latest
Run** card immediately after the Test Cases card and before Overall Score Trend (stacked under Test
Cases below the `xl` breakpoint). The card SHALL:
- use the last entry of the Test Cases `segments` array (chronological `runOrder`, latest last)
- show the run’s display name beside the title, truncated with a hover tooltip when it overflows
- show a semicircle gauge of that run’s above / below / errorOrNa counts with the total in the center
  and a “Test Cases” caption
- when the suite’s `overallScoreThreshold` is set, show a legend with **Above threshold**,
  **Below threshold**, and **Error or N/A** (including zero counts)
- when the suite’s `overallScoreThreshold` is unset, show a legend with **Completed** and
  **Error or N/A** (no below-threshold row); the gauge omits the below segment
- remain visible when the suite’s `overallScoreThreshold` is unset

#### Scenario: Card shown after Test Cases
- **WHEN** the Trends tab has one or more runs in `runOrder`
- **THEN** a Latest Run card appears after the Test Cases card and before Overall Score Trend

#### Scenario: Latest run is the last chronological segment
- **WHEN** `runOrder` has runs A then B and both have segment counts
- **THEN** the Latest Run card shows run B’s name and B’s segment totals

#### Scenario: Threshold legend
- **WHEN** the suite threshold is set and the latest run has above, below, and errorOrNa counts
- **THEN** the legend shows Above threshold, Below threshold, and Error or N/A with those counts

#### Scenario: No-threshold legend
- **WHEN** the suite threshold is unset
- **THEN** the legend shows Completed and Error or N/A, and Below threshold is omitted

### Requirement: Overall Score Trend chart
When the Trends tab has at least one run in its Trends window, the system SHALL render an
**Overall Score Trend** card in the same row as Test Cases and Latest Run (stacked below them
below the `xl` breakpoint). The card SHALL:
- stretch to the same height as the sibling cards in that row on `xl` and larger, with a minimum
  chart height of 220px when the row is stacked
- plot overall scores in **equal category slots** (one slot per run in Trends-window order), with
  run-name labels rendered **below** the bordered plot (not inside the chart frame)
- place the first run on the left edge and the last run on the right edge so gaps between runs are
  equal, including runs that share a calendar day
- show each run label with the shared Trends x-axis glyph: always rotated 90°, leading `Run`
  stripped for display, max height 64px with up to two lines then ellipsis, full original name in a
  hover tooltip
- show Y-axis labels at `1`, `0.75`, `0.50`, `0.25`, and `0` **outside** the bordered plot (to the
  left)
- show a click tooltip with: a header of the run-name link (accent, with an external-link icon) and
  the run’s real timestamp as `MMM YYYY, HH:mm` (24-hour, semibold); and a second row of the label
  `Score` and the formatted overall score
- when the suite’s `overallScoreThreshold` is set (including `0`), draw a 1px dashed horizontal
  threshold line in the accent-secondary stroke color with a left-side label `Threshold (value)`
- omit the threshold line and label when `overallScoreThreshold` is unset

#### Scenario: Same-day runs use equal slots
- **WHEN** the Trends window has seven runs computed on the same local calendar day with varying
  scores
- **THEN** those runs plot as seven equal category slots, each labeled with its run name

#### Scenario: Axis label strips leading Run
- **WHEN** the Overall Score Trend has a run named `Run #19`
- **THEN** the axis label shows `#19` and the hover tooltip shows `Run #19`

#### Scenario: Threshold line when configured
- **WHEN** the suite has `overallScoreThreshold` set to `0.6`
- **THEN** the chart shows a dashed horizontal line at `0.6` labeled `Threshold (0.6)`

#### Scenario: No threshold line when unset
- **WHEN** the suite has no `overallScoreThreshold`
- **THEN** the chart has no threshold markLine

#### Scenario: Tooltip shows run link, month-year time, and score
- **WHEN** the user opens the Overall Score Trend tooltip for a run named `Run #23` computed at
  Feb 19 2026 10:12 with score `0.65`
- **THEN** the tooltip header shows a `Run #23` link and a timestamp containing `Feb 2026` and
  `10:12`, and the second row shows `Score` and `0.65`

### Requirement: Metric Trend score-axis readability
When Metric Trends renders one or more metric-series cards, each card SHALL use the fixed `0`–`1`
score domain and display Y-axis labels at `1`, `0.75`, `0.50`, `0.25`, and `0` **outside** the
bordered plot (to the left), matching the score scale in Figma.

#### Scenario: Metric Trend card shows the fixed labeled score scale outside the plot
- **WHEN** a user views a Metric Trend card with one or more visible metric series
- **THEN** the card shows Y-axis labels `1`, `0.75`, `0.50`, `0.25`, and `0` to the left of the
  bordered plot (not inside the chart frame)

#### Scenario: Metric Trend card retains existing chart interactions and marks
- **WHEN** a user views or filters metric series in a Metric Trend card
- **THEN** metric lines, legend/tag filtering, hover tooltips (including the first run mark), and
  horizontal grid lines remain available

### Requirement: Metric Trend run tooltip
When the user hovers a run on a Metric Trend chart, the system SHALL show a tooltip with:
- a header row of the run name (left) and the run’s real timestamp as `MMM YYYY, HH:mm` (24-hour,
  semibold, right)
- below the header, one row per visible metric series: series-color dot, metric name with a colon,
  and the formatted score

#### Scenario: Tooltip header shows run name and month-year time
- **WHEN** the user hovers a Metric Trend mark for a run named `Run #19` computed at Feb 19 2026 10:12
- **THEN** the tooltip header shows `Run #19` and a timestamp containing `Feb 2026` and `10:12`

### Requirement: Metric Trend legend tags
When a Metric Trend card shows one or more metric series, each series SHALL appear as a selectable
tag whose stroke, fill, and hover fill come from the six-color Figma palette for the active theme
(dark or light). Chart line and tag stroke/dot SHALL use the same theme stroke (light blue is
`#155BFD`). Tags SHALL:
- stay on a single non-wrapping row; when they overflow the card width, show left/right arrow
  buttons that scroll the row horizontally
- apply a `116px` max width and ellipsis only when the card has two or more tags; a single tag is
  not capped
- expose the full label via a hover tooltip when the text is clipped
- keep click-to-toggle series visibility (hidden series fade)

#### Scenario: Multi-tag row truncates and scrolls
- **WHEN** a Metric Trend card has several series whose tags do not fit on one line
- **THEN** each tag is capped at `116px` with ellipsis, and left/right arrows scroll the row

#### Scenario: Single tag is not width-capped
- **WHEN** a Metric Trend card has exactly one series
- **THEN** that tag has no `116px` max-width cap

#### Scenario: Light theme uses the light blue stroke
- **WHEN** the active theme is light and a Metric Trend card has a series in the blue palette slot
- **THEN** the tag stroke/dot and chart line use `#155BFD`

### Requirement: Metric Trend run-name axis
When Metric Trends renders a metric-series card with run data, the card SHALL use always-visible
series symbols and run-name labels rendered **below** the bordered plot (not inside the chart
frame). Axis mode SHALL:
- plot runs in **equal category slots** (even visual spacing) in Trends-window order
- place the first run on the left edge and the last run on the right edge (a single run sits in
  the center)
- show each run label with the shared Trends x-axis glyph: always rotated 90°, leading `Run`
  stripped for display, max height 64px with up to two lines then ellipsis, full original name in a
  hover tooltip

#### Scenario: Run names outside the plot with symbols
- **WHEN** a user views a Metric Trend card with one or more runs
- **THEN** series symbols are visible inside the bordered plot and 90° run-name labels sit below
  that border

#### Scenario: Equal slots for every run
- **WHEN** a Metric Trend card has runs spanning multiple days (or the same day)
- **THEN** series points sit in equal horizontal slots labeled by run name — not proportional
  wall-clock gaps

#### Scenario: Axis label strips leading Run
- **WHEN** a Metric Trend card has a run named `Run #19`
- **THEN** the axis label shows `#19` and the hover tooltip shows `Run #19`

#### Scenario: Single-run mark is centered
- **WHEN** a Metric Trend card has exactly one run with a score value
- **THEN** the symbol sits in the center of the plot

### Requirement: Test Case Stability section visibility
When the Trends tab has at least one run in its Trends window (`runOrder.length > 0`), the system
SHALL render a **Test Case Stability** section below Metric Trends using the shared `SummarySection`
chrome (`isFillHeight={false}`). When the Trends window is empty, the section SHALL not appear (the
tab’s empty state already covers that case).

#### Scenario: Section shown when Trends has runs
- **WHEN** the Trends tab has loaded data with one or more runs in `runOrder`
- **THEN** a Test Case Stability section is present below Metric Trends

#### Scenario: Section omitted when Trends is empty
- **WHEN** the Trends tab has no runs (`runCount === 0`)
- **THEN** the Test Case Stability section is not rendered

### Requirement: Test Case Stability method label for ROC AUC
When the suite’s `overallScore.type` is the suite-level function (ROC AUC), the Test Case Stability
section title SHALL show a secondary method label for how test cases are scored:
- Mean → “Mean of {n} metrics” where `n` is the latest run’s `metricNames` length
- Weighted mean → “Weighted mean of {n} metrics” where `n` is `testCaseOverallScore.weights.length`

When overall score is Mean or Weighted mean (not a suite-level function), the method label SHALL
be omitted.

#### Scenario: Mean test-case method under ROC AUC
- **WHEN** the suite overall score is a custom function and `testCaseOverallScore` is Mean, and the
  latest run has 4 metric names
- **THEN** the Stability title includes “Mean of 4 metrics”

#### Scenario: Method label omitted for mean overall score
- **WHEN** the suite overall score is Mean
- **THEN** the Stability title does not include a method label

### Requirement: Stability data from test_case_eval_scores for runOrder IDs
The system SHALL load Stability cells by executing a structured row query against `test_case_eval_scores`
filtered to `test_suite_run_id IN` the current `runOrder` run IDs. The query SHALL select
`test_suite_run_id`, `test_case_name`, `score`, and `passed`; sort by `test_suite_run_id` descending
then `test_case_name` ascending; and page with offset `0`, limit `200`, `include_total: false`.
The system SHALL NOT re-derive the last-N run window independently of `runOrder`. When `runOrder`
is empty, the system SHALL skip the Stability fetch.

#### Scenario: Query uses runOrder IDs
- **WHEN** Trends has three runs in `runOrder` with ids A, B, and C
- **THEN** the Stability query filter includes exactly those three UUIDs in an `IN` on
  `test_suite_run_id`

#### Scenario: Empty runOrder skips fetch
- **WHEN** `runOrder` is empty
- **THEN** no Stability `test_case_eval_scores` query is executed

### Requirement: Test Case Stability query failure presentation
When the Stability `test_case_eval_scores` row query fails after `runOrder` is non-empty, the
Test Case Stability section SHALL show a localized load-failure message (`role="alert"`) instead of
the empty “No data” placeholder. When the query succeeds with no cells, the section SHALL continue
to show the empty/no-data state.

#### Scenario: Query failure is distinct from empty data
- **WHEN** Stability fetch rejects and `runOrder` is non-empty
- **THEN** the section shows a load-failure message and does not claim there is no data

#### Scenario: Successful empty matrix still shows no data
- **WHEN** Stability fetch succeeds with no test-case columns or rows
- **THEN** the section shows the empty/no-data content

### Requirement: Test case × run matrix with gap handling
The Stability section SHALL present a heatmap whose **rows** are the Trends `runOrder` runs in
chronological order and whose **columns** are distinct `test_case_name` values (sorted ascending).
Each cell SHALL reflect the `score` (and expose `passed` in the cell tooltip) for that
`(test_case_name, runId)` pair. When no summary exists for a pair, the cell SHALL render as a gap
(default empty fill and non-applicable value), not as an error or crash. Duplicate summaries for
the same pair SHALL resolve with last-row-wins semantics. The cell's score color SHALL come from
the shared `score-cell-rendering` absolute palette, with no border between cells with visible values.

#### Scenario: Present score cell
- **WHEN** a summary row exists for test case T and run R with score `0.75`
- **THEN** the matrix cell for run R × test case T shows the score using the shared
  `score-cell-rendering` absolute bucket colors, with no border separating it from its
  neighbors

#### Scenario: Missing test case is a gap
- **WHEN** test case T has a summary in run R1 but not in run R2
- **THEN** the R2 × T cell is a gap (not an error state for the section)

#### Scenario: Duplicate summaries last-wins
- **WHEN** two summary rows share the same `test_case_name` and `test_suite_run_id` and differ in
  `score`
- **THEN** the matrix cell uses the score from the later row in the result set

### Requirement: Cost Trend and Runtime Trend cards
When the Trends tab has at least one run in its Trends window, the system SHALL render full-width
**Cost Trend** and **Runtime Trend** cards between the Test Cases / Latest Run / Overall Score Trend
row and Metric Trends. Each card SHALL:
- show a legend with three items: a dynamic **`{Source type} cost`** / **`{Source type} runtime`**
  label (Application, Model, MCP, or Route from the suite target; fallback **Source**), a fixed
  **Metrics cost** / **Metrics runtime** label, and a total-line label (**Cost** / **Time**)
- draw one stacked bar per Trends-window run (source/blue under metrics/violet), scaled to a shared
  nice Y ceiling with five external ticks (`$…` for Cost via the shared run-cost formatter; duration
  via the shared suite run-time formatter)
- overlay a total line whose points sit on each stack top (sum of present segments; a run with both
  segments missing is a gap with no bar and no point)
- load Cost from one-shot `GET /test-suite-runs/{id}/costs` per window run (`avgTestCaseCost` /
  `avgMetricEvalCost`); load Runtime from one `eval_summaries` aggregate grouped by run id
  (`avg(exec_duration_ms)` / `avg(metric_eval_duration_ms)`)
- label runs under the plot with the shared Trends rotated run-name glyph
- show a loading indicator while the card’s fetch is in flight with no points yet, and the shared
  empty state when every run lacks figures

#### Scenario: Cards render with the Trends window
- **WHEN** the Trends tab has one or more runs in `runOrder`
- **THEN** Cost Trend and Runtime Trend cards appear above Metric Trends

#### Scenario: Source-type legend follows the suite target
- **WHEN** the suite’s deployment ref type is Application
- **THEN** the Cost Trend legend shows “Application cost” and the Runtime Trend legend shows
  “Application runtime”

#### Scenario: Missing cost is a gap
- **WHEN** a run’s `/costs` payload has no finite averages
- **THEN** that run has no Cost Trend bar segment and no total-line point

#### Scenario: Runtime averages map to bar segments
- **WHEN** a run’s `eval_summaries` aggregate returns `avg_duration_ms` `100` and
  `avg_metric_eval_duration_ms` `40`
- **THEN** that run’s Runtime Trend bar stacks source `100` under metrics `40` and the total line
  point is `140`

### Requirement: Shared heatmap grid shell

Test Case Stability and Run Comparison Heat Map SHALL share domain-free heatmap grid chrome
(equal-width value columns, axis header rotation, value text threshold, tooltip centering, ColorScale
slot) from `Common/HeatMap`. Compare-specific data shaping (Absolute/Delta, metric groups, twin run
rows) SHALL remain in the Compare feature folder.

Value cells in both grids SHALL render their content right-aligned, matching the rest of the app's
numeric-column convention. The label column (test case or run name) is unaffected and keeps its
existing left alignment.

#### Scenario: Compare Heat Map still renders after extract

- **WHEN** a user opens Run Comparison Heat Map after the shared extract
- **THEN** the Heat Map tab still shows the metric × test-case grid with Absolute/Delta and metrics
  toolbar behavior unchanged

#### Scenario: Heat Map values are right-aligned

- **WHEN** a Run Comparison Heat Map cell shows a value
- **THEN** the value is right-aligned within the cell

#### Scenario: Test Case Stability values are right-aligned

- **WHEN** a Test Case Stability cell shows a score
- **THEN** the value is right-aligned within the cell
