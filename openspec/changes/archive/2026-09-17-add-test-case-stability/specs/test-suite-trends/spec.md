## Purpose

Defines Test Suite Trends tab behavior for the Test Case Stability heatmap: loading per-test-case
outcomes for the Trends run window, rendering the matrix, and gap handling for missing cases.

## ADDED Requirements

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
