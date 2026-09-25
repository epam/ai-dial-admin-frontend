# test-suite-trends Specification

## Purpose
Defines Test Suite Trends tab behavior for summarizing how recent suite runs compare against the
suite’s optional overall score threshold, including KPI card visibility and pass/fail/error counts.
## Requirements
### Requirement: Runs Passed Threshold KPI card visibility
When the Trends tab has at least one run in its Trends window, the system SHALL render a
**Runs Passed Threshold** KPI card if and only if the suite’s `overallScoreThreshold` is set
(including `0`). When `overallScoreThreshold` is unset (`null` / `undefined`), the card SHALL be
omitted entirely — not shown as empty or “No Data”.

#### Scenario: Card shown when threshold is configured
- **WHEN** the Trends tab has run data and the suite has `overallScoreThreshold` set to a number
  (including `0`)
- **THEN** the KPI strip includes a Runs Passed Threshold card

#### Scenario: Card hidden when threshold is unset
- **WHEN** the Trends tab has run data and the suite has no `overallScoreThreshold`
- **THEN** the Runs Passed Threshold card does not appear in the KPI strip

### Requirement: Runs Passed Threshold metric and window label
The Runs Passed Threshold card SHALL show a primary metric of `passed / total`, where `total` is
the number of runs in the current Trends window and `passed` is the count of those runs that meet
the pass rule below. The card title SHALL include a fixed window label of the form
“Last {N} Runs” where `N` is the Trends run-window size (currently 10), even when fewer than `N`
runs exist.

#### Scenario: Metric reflects passed count over window size
- **WHEN** the Trends window has 7 runs and 3 of them pass the threshold
- **THEN** the card displays `3` as the primary numerator and `/7` as the denominator

#### Scenario: Window label uses configured Trends window size
- **WHEN** the Trends run-window size is 10 and the suite has fewer than 10 runs with a threshold set
- **THEN** the card title still includes “Last 10 Runs”

### Requirement: Threshold outcome aggregation for the Trends window
For each run in the Trends window, the system SHALL classify outcomes against
`overallScoreThreshold` as follows:
- **error** — the run is failed (`isFailed === true`), regardless of whether an overall score exists
- **passed** — the run is not failed, has a non-null overall score, and that score is greater than or
  equal to the threshold
- **failed** — the run is not failed, has a non-null overall score, and that score is less than the
  threshold
- runs that are not failed and have a null overall score SHALL count toward `total` only and SHALL
  not increment passed, failed, or error

The card SHALL always show all three legend statuses (pass, fail, error) with their counts,
including zeros.

#### Scenario: Passed and failed by score against threshold
- **WHEN** the threshold is `0.5`, and the window has a non-failed run with overall score `0.6` and
  a non-failed run with overall score `0.4`
- **THEN** the legend shows 1 pass and 1 fail for those runs

#### Scenario: Exact threshold counts as pass
- **WHEN** the threshold is `0.5` and a non-failed run has overall score `0.5`
- **THEN** that run is counted as pass

#### Scenario: Failed run counts as error even with a score
- **WHEN** a run is failed and has an overall score
- **THEN** that run is counted as error, not pass or fail

#### Scenario: Unscored non-failed run only increases total
- **WHEN** a run is not failed and has no overall score
- **THEN** that run increases `total` but does not increase pass, fail, or error counts

#### Scenario: Legend always shows zero counts
- **WHEN** the card is shown and one of pass, fail, or error has count `0`
- **THEN** that status still appears in the legend with `0`

### Requirement: Metric Trend score-axis readability
When Metric Trends renders one or more metric-series cards, each card SHALL use the fixed `0`–`1`
score domain and display Y-axis labels at `0`, `0.25`, `0.5`, `0.75`, and `1`. The chart SHALL
reserve sufficient left-side plot space so those labels are visible without clipping. The X axis
SHALL remain hidden.

#### Scenario: Metric Trend card shows the fixed labeled score scale
- **WHEN** a user views a Metric Trend card with one or more visible metric series
- **THEN** the card shows Y-axis labels `0`, `0.25`, `0.5`, `0.75`, and `1` within reserved
  left-side chart space, while its X axis remains hidden

#### Scenario: Metric Trend card retains existing chart interactions and marks
- **WHEN** a user views or filters metric series in a Metric Trend card
- **THEN** metric lines, legend/tag filtering, tooltip content, and horizontal grid lines remain
  available and unchanged

### Requirement: Test Case Stability section visibility
When the Trends tab has at least one run in its Trends window (`runOrder.length > 0`), the system
SHALL render a **Test Case Stability** section below Metric Trends using the shared `SummarySection`
chrome (`isFillHeight={false}`) and a title of the form “Test Case Stability · {N} runs” where `N`
is the actual run count in the window. When the Trends window is empty, the section SHALL not appear
(the tab’s empty state already covers that case).

#### Scenario: Section shown when Trends has runs
- **WHEN** the Trends tab has loaded data with one or more runs in `runOrder`
- **THEN** a Test Case Stability section is present below Metric Trends

#### Scenario: Section omitted when Trends is empty
- **WHEN** the Trends tab has no runs (`runCount === 0`)
- **THEN** the Test Case Stability section is not rendered

### Requirement: Stability data from eval_summaries for runOrder IDs
The system SHALL load Stability cells by executing a structured row query against `eval_summaries`
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
- **THEN** no Stability `eval_summaries` query is executed

### Requirement: Test case × run matrix with gap handling
The Stability section SHALL present a heatmap whose **rows** are the Trends `runOrder` runs in
chronological order and whose **columns** are distinct `test_case_name` values (sorted ascending).
Each cell SHALL reflect the `score` (and expose `passed` in the cell tooltip) for that
`(test_case_name, runId)` pair. When no summary exists for a pair, the cell SHALL render as a gap
(default empty fill and non-applicable value), not as an error or crash. Duplicate summaries for
the same pair SHALL resolve with last-row-wins semantics.

#### Scenario: Present score cell
- **WHEN** a summary row exists for test case T and run R with score `0.75`
- **THEN** the matrix cell for run R × test case T shows the score using the shared accuracy heatmap coloring

#### Scenario: Missing test case is a gap
- **WHEN** test case T has a summary in run R1 but not in run R2
- **THEN** the R2 × T cell is a gap (not an error state for the section)

#### Scenario: Duplicate summaries last-wins
- **WHEN** two summary rows share the same `test_case_name` and `test_suite_run_id` and differ in
  `score`
- **THEN** the matrix cell uses the score from the later row in the result set

### Requirement: Shared heatmap grid shell
Test Case Stability and Run Comparison Heat Map SHALL share domain-free heatmap grid chrome
(equal-width value columns, axis header rotation, value text threshold, tooltip centering, ColorScale
slot) from `Common/HeatMap`. Compare-specific data shaping (Absolute/Delta, metric groups, twin run
rows) SHALL remain in the Compare feature folder.

#### Scenario: Compare Heat Map still renders after extract
- **WHEN** a user opens Run Comparison Heat Map after the shared extract
- **THEN** the Heat Map tab still shows the metric × test-case grid with Absolute/Delta and metrics
  toolbar behavior unchanged

