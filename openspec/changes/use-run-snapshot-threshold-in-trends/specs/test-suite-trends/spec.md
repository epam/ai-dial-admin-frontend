# Spec Delta

## ADDED Requirements

### Requirement: Test Case Stability tooltips show each run's threshold
Each Test Case Stability cell tooltip SHALL show the threshold from the run represented by that
row, after the run name and before Passed. When that run has no snapshotted threshold, the tooltip
SHALL show `N/A`.

#### Scenario: Threshold tooltip follows the cell's run
- **WHEN** two Test Case Stability rows belong to runs with snapshot thresholds `0.6` and `0.8`
- **THEN** their cell tooltips show `Threshold: 0.6` and `Threshold: 0.8` respectively, before
  their Passed rows

#### Scenario: Threshold tooltip is not applicable when unset
- **WHEN** a Test Case Stability row belongs to a run with no snapshot threshold
- **THEN** its cell tooltip shows `Threshold: N/A` before the Passed row

## MODIFIED Requirements

### Requirement: Pass / completion rate of latest run
The first KPI card SHALL show the latest Trends-window run’s rate from `test_case_eval_scores`
segments (`above / total`). Trends SHALL project each run’s snapshotted `overall_score_threshold`
from the structured-query runs result into its run metadata. Each run SHALL use that threshold:
when set,
`above` is SUCCESS + passed; when unset, `above` is every SUCCESS case. The card title and
threshold footer SHALL reflect the latest run’s snapshot, not the current suite settings. The card
SHALL:
- format the rate as a percentage with one decimal (trailing zeros stripped)
- draw a full-width rate bar coloured green (≥ 70%), yellow (40–69%), or red (< 40%)
- show a signed percentage-point delta vs the previous run (`+32% vs prev.`); hide it when either
  rate is missing or the delta is zero (higher is better → green)
- when the latest run's threshold is set, show a `Threshold:` footer with that threshold value

#### Scenario: Threshold pass rate title and footer
- **WHEN** the current suite threshold is `0.4`, the latest run snapshot threshold is `0.6`, and
  the latest run has above `197` of total `200`
- **THEN** the card title is Threshold Pass Rate of Latest Run, the value is `98.5%`, and the
  footer shows Threshold: `0.6`

#### Scenario: Completion rate without threshold
- **WHEN** the current suite threshold is set but the latest run snapshot has no threshold
- **THEN** the card title is Completion Rate of Latest Run and there is no threshold footer

### Requirement: Overall Score of Latest Run KPI card
The second KPI card SHALL show the latest Trends-window run’s `overallScore` (the same value
Overall Score Trend plots), formatted to three decimals. The card SHALL:
- use the latest run's snapshotted overall-score threshold for its threshold glyph and tooltip;
  omit the glyph when that snapshot has no threshold, and when set show an above/below glyph
  beside the value and a hover tooltip stating whether the score is above or below the threshold
  (exact threshold counts as above)
- show a signed delta vs the previous run’s overall score (`+0.12 vs prev.`); hide it when either
  score is missing or the delta is zero (higher is better → green)
- expose a static “Based on completed test cases” footer and an info control whose tooltip
  describes the suite’s overall-score calculation method

#### Scenario: Latest overall score value
- **WHEN** the Trends window’s latest run has overall score `0.58` and the previous run has `0.46`
- **THEN** the card shows `0.580` and `+0.12 vs prev.`

#### Scenario: Latest score classification follows its run snapshot
- **WHEN** the current suite threshold is `0.4`, the latest run snapshot threshold is `0.6`, and
  the latest score is `0.58`
- **THEN** the card shows the below-threshold glyph and tooltip using threshold `0.6`

#### Scenario: No threshold glyph without threshold
- **WHEN** the current suite threshold is set but the latest run snapshot has no threshold and a
  latest overall score is available
- **THEN** the card shows the score without an above/below glyph

### Requirement: Test Cases by-run stacked-bar card
When the Trends tab has at least one run in its Trends window, the system SHALL render a **Test
Cases** card to the left of Overall Score Trend (stacked above it below the `xl` breakpoint). Each
run SHALL use its own snapshotted overall-score threshold for segment classification, empty-result
fallback, and tooltip labels. The card SHALL:
- show **Above threshold**, **Below threshold**, and **Error or N/A** legend items when all runs
  have a threshold; show **Completed** and **Error or N/A** when no run has a threshold; and show
  both **Completed** and the threshold legend items when the window contains both kinds of run
- load per-run counts from the combined `test_case_eval_scores` aggregate for the current
  `runOrder` run IDs, grouped by `test_suite_run_id`, `passed`, and `execution_status`, selecting
  count (shared with the pass / completion rate card)
- for a run with a threshold, classify each count as: SUCCESS + `passed === true` → above;
  SUCCESS + `passed === false` → below; non-SUCCESS or SUCCESS with null `passed` → Error or N/A
- for a run without a threshold, classify each SUCCESS count as Completed and each non-SUCCESS
  count as Error or N/A
- draw one 100%-height stacked bar per run (normalized to that run’s total), segments top-to-bottom
  error / below (when that run has a threshold) / above-or-completed, labeled under the bar with a
  shared Trends x-axis run-name glyph: always rotated 90°, leading `Run` stripped for display,
  max height 64px with up to two lines then ellipsis, and the full original name in a hover tooltip
- on hover of a stacked bar, show a tooltip with the run name, **Total test cases**, and a
  breakdown based on that run's threshold: when set — Completed (`above + below`) with nested
  Above / Below threshold rows that include that run's threshold value in parentheses, plus Error
  or N/A; when unset — Completed and Error or N/A only
- when a run has no `test_case_eval_scores` rows, fill a single-segment bar from the run-level
  overall score when present (above / below when that run has a threshold; Completed when it does
  not), or as Error or N/A when the run is failed or has no overall score
- remain visible when no run in the window has a threshold
- omit the design’s hidden **View by** control

#### Scenario: Card shown with runs
- **WHEN** the Trends tab has one or more runs in `runOrder`
- **THEN** a Test Cases card appears to the left of Overall Score Trend

#### Scenario: Segment classification
- **WHEN** the current suite threshold differs from a run's snapshot threshold, and that run has
  SUCCESS rows with `passed` true and false plus ERROR rows
- **THEN** the bar uses the snapshot threshold and maps those counts to above, below, and Error or
  N/A respectively

#### Scenario: Null passed counts as Error or N/A
- **WHEN** a SUCCESS row has `passed` null and that run snapshot has a threshold
- **THEN** its count is included in the Error or N/A segment

#### Scenario: No-threshold legend and classification
- **WHEN** a run snapshot has no threshold, even if the current suite threshold is set
- **THEN** the run's SUCCESS counts map to Completed and its tooltip has no Above / Below rows

#### Scenario: Empty eval rows fall back to overall score
- **WHEN** a non-failed run has no `test_case_eval_scores` rows, overall score `0.58`, current
  suite threshold `0.4`, and run snapshot threshold `0.6`
- **THEN** that run’s bar is a single Below threshold segment

#### Scenario: Empty eval rows fall back without suite threshold
- **WHEN** a non-failed run has no `test_case_eval_scores` rows, overall score `0.9`, and its
  snapshot has no threshold
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
- **WHEN** the current suite threshold is `0.4`, a run snapshot threshold is `0.6`, and the user
  hovers a bar with above `120`, below `20`, and Error or N/A `10`
- **THEN** the tooltip shows the run name, Total test cases `150`, Completed `140` with nested
  Above threshold (0.6) `120` and Below threshold (0.6) `20`, and Error or N/A `10`

#### Scenario: Bar hover tooltip without suite threshold
- **WHEN** a run snapshot has no threshold and its bar has Completed `140` and Error or N/A `10`
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
- show a semicircle gauge of that run’s above / below / errorOrNa counts with the total in the
  center and a “Test Cases” caption
- derive whether to show the threshold legend and below segment from the latest run's snapshot,
  not the current suite settings
- remain visible when the latest run's snapshot has no threshold

#### Scenario: Card shown after Test Cases
- **WHEN** the Trends tab has one or more runs in `runOrder`
- **THEN** a Latest Run card appears after the Test Cases card and before Overall Score Trend

#### Scenario: Latest run is the last chronological segment
- **WHEN** `runOrder` has runs A then B and both have segment counts
- **THEN** the Latest Run card shows run B’s name and B’s segment totals

#### Scenario: Threshold legend
- **WHEN** the current suite threshold differs from the latest run snapshot threshold
- **THEN** the legend shows Above threshold, Below threshold, and Error or N/A only when the latest
  run snapshot has a threshold; otherwise it shows Completed and Error or N/A, with no Below
  threshold row

#### Scenario: No-threshold legend
- **WHEN** the latest run snapshot has no threshold, even if the current suite threshold is set
- **THEN** the legend shows Completed and Error or N/A, and Below threshold is omitted
