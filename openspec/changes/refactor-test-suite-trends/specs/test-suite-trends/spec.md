## MODIFIED Requirements

### Requirement: Latest-run KPI strip
When the Trends tab has at least one run, the KPI strip SHALL include four cards, in order:
1. **Threshold Pass Rate of Latest Run** when `overallScoreThreshold` is set, otherwise
   **Completion Rate of Latest Run** (rate from the latest `test_case_eval_scores` segments;
   loading indicator while the combined eval aggregate is pending)
2. **Overall Score of Latest Run** (latest `runOrder` overall score, threshold glyph/tooltip when
   set, delta vs previous run, calculation-method info)
3. **Total Runtime of Latest Run** (latest combo total + source/Metrics breakdown)
4. **Total Cost of Latest Run** (latest combo total + source/Metrics breakdown)

#### Scenario: Overall score is the latest run value
- **WHEN** the Trends window’s latest run has overall score `0.58`
- **THEN** the Overall Score of Latest Run card shows `0.580` (not a window average)

#### Scenario: Pass rate loading while combined aggregate is pending
- **WHEN** the Trends window has runs and the combined `test_case_eval_scores` aggregate has not
  returned yet
- **THEN** the pass / completion rate card shows a loading indicator instead of a final rate

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
  error / below (threshold set only) / above-or-completed, labeled with the run’s display name
  truncated with a hover tooltip when it does not fit the label slot
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
- **WHEN** a run’s display name does not fit the vertical label slot
- **THEN** the label is truncated and the full name is available in a hover tooltip

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

## ADDED Requirements

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
