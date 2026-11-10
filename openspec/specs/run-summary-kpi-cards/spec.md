# run-summary-kpi-cards Specification

## Purpose
Defines the KPI card strip on the Run Summary tab and on the Run Comparison Summary tab: which cards are
shown, what each one displays, how loading, absent and error data are presented, the hover and info
tooltips, and how compare mode shows both runs with a diff badge.

## Requirements

### Requirement: Single-run KPI strip composition

The Run Summary analytics strip SHALL render these cards, in this order: **Test Cases Completed**,
**Threshold Pass Rate** (or **Completion Rate** when the run's suite snapshot has no overall score
threshold), **Overall Score**, **Total Runtime**, **Total Run Cost**. The cards SHALL NOT include the former
Avg Test Case Run Time, Avg Metric-Eval Latency, Test Case LLM Cost, Metric-Eval Cost or Test Cases Passed
Threshold cards. Test Cases Completed and the rate card SHALL be shown for every run regardless of
threshold. The Overall Score card SHALL be omitted while the run-level overall score is loading or absent.
Until the run's test-case aggregates have loaded the strip SHALL show a spinner in place of the cards.

#### Scenario: Strip order with a threshold
- **WHEN** a run whose suite snapshot has `overallScoreThreshold` 0.6 and an overall score is opened
- **THEN** the strip shows Test Cases Completed, Threshold Pass Rate, Overall Score, Total Runtime and
  Total Run Cost, in that order

#### Scenario: Strip without a threshold
- **WHEN** a run whose suite snapshot has no overall score threshold is opened
- **THEN** the second card is titled Completion Rate
- **AND** no card is titled Threshold Pass Rate

#### Scenario: Old cards are gone
- **WHEN** the Run Summary tab renders
- **THEN** no card is titled Avg Test Case Run Time, Avg Metric-Eval Latency, Test Case LLM Cost,
  Metric-Eval Cost or Test Cases Passed Threshold

#### Scenario: Overall Score omitted without a score
- **WHEN** the run has no run-level overall score
- **THEN** the strip shows the other four cards and no Overall Score card

### Requirement: Test Cases Completed card

The Test Cases Completed card SHALL show `<completed> /<total>` as its value, where *total* is every test
case of the run and *completed* is the number of test cases that finished successfully: when the suite
snapshot has a threshold, SUCCESS cases whose `passed` is true or false; when it has none, every SUCCESS
case. Everything else (non-SUCCESS execution, or SUCCESS with no threshold outcome while a threshold is set)
is **Error or N/A**. How the counts are obtained for a run without metrics is specified in "Test case counts do
not depend on metrics". Below the value the card SHALL show the Error-or-N/A count with the error glyph and an
"Error" label, and SHALL show nothing there when that count is zero. Hovering or focusing the value SHALL open a
tooltip listing **Total test cases**, **Completed**, and — only when a threshold is set and score rows exist —
indented **Above threshold** and **Below threshold** rows, then **Error or N/A**, each with its count. When the
run reports no test cases the value SHALL be an em dash; the card SHALL show the Error badge when the run is not
in an incomplete status and an em dash otherwise. The absence of score rows alone SHALL NOT produce the Error
badge.

#### Scenario: Value and error line
- **WHEN** a run has 55 test cases, 45 completed and 10 Error or N/A
- **THEN** the card shows `45` with `/55` and an error line reading `10 Error`

#### Scenario: No errors hides the error line
- **WHEN** every test case completed, so Error or N/A is 0
- **THEN** the card shows the completed count and total
- **AND** no error glyph, count or "Error" label is shown

#### Scenario: Hover breakdown with a threshold
- **WHEN** the threshold is set, 20 completed cases are at or above it, 25 below it and 10 are Error or N/A
- **AND** the user hovers the value
- **THEN** the tooltip shows Total test cases 55, Completed 45, Above threshold 20, Below threshold 25 and
  Error or N/A 10

#### Scenario: Hover breakdown without a threshold
- **WHEN** the suite has no threshold and the user hovers the value
- **THEN** the tooltip shows Total test cases, Completed and Error or N/A
- **AND** it shows no Above threshold or Below threshold rows

#### Scenario: Keyboard users reach the breakdown
- **WHEN** the value receives keyboard focus
- **THEN** the same tooltip opens

#### Scenario: No test cases
- **WHEN** a COMPLETED run reports no test cases at all
- **THEN** the card shows the Error badge in place of the value
- **AND** the same run in an incomplete status shows an em dash

### Requirement: Threshold Pass Rate and Completion Rate card

The rate card SHALL show a percentage with one decimal (trailing zero stripped) and a full-width progress bar
filled to that percentage. The rate is *above ÷ total* when the suite snapshot has a threshold (above =
SUCCESS and `passed` true) and *completed ÷ total* when it has none. The card SHALL be titled **Threshold Pass
Rate** with a threshold and **Completion Rate** without one. The bar SHALL be green at 70 % and above, yellow
from 40 % up to but excluding 70 %, and red below 40 %. With a threshold the card SHALL show a
`Threshold: <value>` line at the bottom; without one it SHALL NOT show any threshold line. A run with no test
cases SHALL show an em dash and no bar. The bar SHALL be exposed to assistive technology as a progress
indicator named by the card title.

#### Scenario: Threshold pass rate
- **WHEN** the threshold is 0.6 and 197 of 200 test cases are above it
- **THEN** the card is titled Threshold Pass Rate, shows `98.5%` with a green bar and `Threshold: 0.6`

#### Scenario: Completion rate without a threshold
- **WHEN** the suite has no threshold and 45 of 55 test cases completed
- **THEN** the card is titled Completion Rate and shows `81.8%`
- **AND** there is no Threshold line

#### Scenario: Colour boundaries
- **WHEN** the rate is 69.9 %, 70 %, 40 % and 39.9 % in turn
- **THEN** the bar is yellow, green, yellow and red respectively

#### Scenario: No test cases
- **WHEN** the run has no test cases
- **THEN** the card shows an em dash and no progress bar

### Requirement: Overall Score card

The Overall Score card SHALL show the run-level overall score with three decimals (`0.580`). When the run's
suite snapshot has an overall score threshold the card SHALL show an above/below glyph to the left of the
value — above when the score is at or over the threshold (inclusive), below otherwise — and hovering or
focusing the value SHALL show a tooltip stating `Overall score is above the threshold (<threshold>).` or
`Overall score is below the threshold (<threshold>).`. The above/below state SHALL also be available to
assistive technology as text, since the glyph is decorative. Without a threshold the card SHALL show neither
glyph nor tooltip on the value. The card SHALL show a "Based on <method>" label naming the calculation method the run was evaluated with —
"mean of <N> metrics", "weighted mean of <N> metrics" or "specific function" — followed by an info control; the
label SHALL truncate with an ellipsis, revealing its full text in a tooltip, when it does not fit the card; hovering or focusing the
control SHALL show the calculation method the run was evaluated with:
- Mean: "Calculation method:", "Mean of <N> metrics" and the formula `score = mean(m₁, m₂, … mₙ)`;
- Weighted mean: "Calculation method:", "Weighted mean of <N> metrics" and one `<metric>.<field> × <weight>`
  line per weight;
- Specific function: a table of Calculation method (Specific function), Function, Ground truth,
  Ground truth value, Prediction and Prediction value.

The calculation method SHALL come from the overall-score method stored in the run's own suite snapshot, never
from the test suite as it is configured now, so editing the suite afterwards does not change what the tooltip
says about a finished run. A run whose snapshot exists but stores no method — a run created
before the method was configurable, or of a suite that never had one set — SHALL be described as the default
Mean. A run with no suite snapshot at all SHALL show no
info control, because nothing records how it was scored. The info control SHALL NOT depend on the live test
suite request.

#### Scenario: Above threshold
- **WHEN** the score is 0.812 and the threshold is 0.6
- **THEN** the card shows an above glyph beside `0.812`
- **AND** hovering the value shows `Overall score is above the threshold (0.6).`

#### Scenario: Exactly at the threshold counts as above
- **WHEN** the score equals the threshold
- **THEN** the card shows the above glyph and the above tooltip

#### Scenario: Below threshold
- **WHEN** the score is 0.580 and the threshold is 0.6
- **THEN** the card shows a below glyph and hovering the value shows
  `Overall score is below the threshold (0.6).`

#### Scenario: No threshold
- **WHEN** the suite snapshot has no threshold
- **THEN** the card shows `0.580` with no glyph and no tooltip on the value

#### Scenario: Mean method tooltip
- **WHEN** the run's stored method is the mean over 4 metrics and the user hovers the info control
- **THEN** the tooltip shows `Calculation method:`, `Mean of 4 metrics` and `score = mean(m₁, m₂, … mₙ)`

#### Scenario: Weighted mean method tooltip
- **WHEN** the run's stored method is a weighted mean of `aidial_rag_eval.retrieval.f1` × 0.7 and
  `deepeval.context_prec.score` × 0.3
- **THEN** the tooltip shows `Weighted mean of 2 metrics` and both `<metric> × <weight>` lines

#### Scenario: Specific function tooltip
- **WHEN** the run's stored method is the ROC AUC function
- **THEN** the tooltip shows Calculation method Specific function, Function roc auc and the dataset and P
  column rows

#### Scenario: Suite not loaded
- **WHEN** the live test suite request has not resolved, or failed
- **THEN** the info control is still shown and describes the run's stored method

#### Scenario: The method comes from the run, not the current suite
- **WHEN** a run was evaluated with the mean method and its test suite has since been changed to a weighted mean
- **THEN** the info tooltip still shows the mean method

#### Scenario: A snapshot without a stored method shows Mean
- **WHEN** a run's suite snapshot stores no overall-score method
- **THEN** the info tooltip shows `Mean of <N> metrics`, whatever the live suite is configured with

#### Scenario: A run without a snapshot has no info control
- **WHEN** a run has no suite snapshot
- **THEN** the Overall Score card shows no info control

### Requirement: Total Runtime card

The Total Runtime card SHALL show the run's total runtime: the sum, over the run's test cases, of the source
execution time and the metric-evaluation time. Durations under a minute SHALL read in seconds with one decimal
(`45.2s`), under an hour in minutes and seconds (`10m 32s`), and from an hour up in hours and minutes
(`1h 5m`) — the format of the Runs list Duration column. The same format SHALL apply on the Run Summary, the
Run Comparison Summary Overview and the Test Suite Trends card.
Beneath the total it SHALL show two labelled values: `<Source type>: <duration>` and `Metrics: <duration>`.
`<Source type>` is the kind of the evaluated entity (Model, Application, MCP or Route) and falls back to
"Source" when the kind cannot be determined. If only one of the two parts is absent that part SHALL show an
em dash and the total SHALL be the other part alone. If both are absent the value SHALL be the Error badge
for a run that is not in an incomplete status and otherwise a single em dash with no breakdown beneath it. The card SHALL NOT be an average.

#### Scenario: Total and breakdown
- **WHEN** the source runtime is 341 s and the metrics runtime is 291 s
- **THEN** the card shows `10m 32s`, `Model: 5m 41s` and `Metrics: 4m 51s` for a model run

#### Scenario: Long runtime scales to minutes and hours
- **WHEN** the source runtime is 3 900 s and the metrics runtime is 300 s
- **THEN** the card shows `1h 10m`, `Model: 1h 5m` and `Metrics: 5m 0s`

#### Scenario: Metrics runtime absent
- **WHEN** the run computed no metrics so metric-evaluation time is absent
- **THEN** the total shows the source time alone and the Metrics value is an em dash

#### Scenario: No runtime data on a completed run
- **WHEN** a COMPLETED run has neither source nor metrics runtime
- **THEN** the card shows the Error badge
- **AND** the same run in an incomplete status shows an em dash

#### Scenario: Incomplete run with no runtime data
- **WHEN** an incomplete run has neither source nor metrics runtime
- **THEN** the card shows one em dash and no `<Source type>` or Metrics lines

#### Scenario: Source type fallback
- **WHEN** the evaluated entity's kind cannot be resolved
- **THEN** the breakdown label reads `Source:`

### Requirement: Comparison strip composition and layout

The Run Comparison Summary strip SHALL render the same five cards in the same order as the single-run strip,
each in dual-run layout: the baseline run's value on the left and the second run's on the right, each
headed by its run name, separated by a divider, with the card title followed by a diff badge when a diff
exists. Per-run content SHALL match the single-run card (Test Cases Completed value, error line and hover
tooltip, headed by the run name; per-run rate with bar and threshold line; per-run overall score; per-run
runtime and cost breakdown). On the Overall Score card each run's value SHALL be followed by only its own info control, at the end of the
score row and with no label, showing that run's calculation-method tooltip, taken from that
run's own stored method as the single-run card does. Each run's glyph,
threshold tooltip and `Threshold:` line SHALL use that run's own threshold.
The rate card SHALL be titled Threshold Pass Rate when either run has a threshold and Completion Rate when
neither does. In a pair where only one run has a threshold, the run without a threshold SHALL show an em dash
on the rate card and the rate diff badge SHALL be hidden. The strip SHALL show a spinner until both runs'
aggregates have loaded.

#### Scenario: Five cards in dual layout
- **WHEN** the comparison summary renders for runs #316 and #315
- **THEN** it shows Test Cases Completed, Threshold Pass Rate, Overall Score, Total Runtime and Total Run
  Cost, each with Run #316 on the left and Run #315 on the right

#### Scenario: Info control without a label beside each score
- **WHEN** the Overall Score card renders in compare mode
- **THEN** each run's score row ends with an info control
- **AND** no "Based on" label is shown

#### Scenario: Per-run threshold glyphs
- **WHEN** run #316 scores 0.812 and run #315 scores 0.265 against a threshold of 0.6
- **THEN** run #316 shows the above glyph and run #315 shows the below glyph
- **AND** hovering run #315's score shows `Overall score is below the threshold (0.6).`

#### Scenario: Per-run calculation method
- **WHEN** the user hovers the info control of the second run
- **THEN** the tooltip describes the calculation method stored on the second run, even when the baseline run
  was evaluated with a different one

#### Scenario: Mixed thresholds
- **WHEN** only the baseline run's suite snapshot has a threshold
- **THEN** the rate card is titled Threshold Pass Rate
- **AND** the second run's side shows an em dash and the card has no diff badge

### Requirement: Comparison diff badges

Every comparison card SHALL show a diff badge next to its title, computed as the second run's value minus the
baseline run's value (see "Every delta is measured from the current baseline" in run-compare-baseline-flip).
The badge SHALL be omitted when either side has no value or the difference is zero. Badge content and colour:
- Test Cases Completed: the signed difference in completed counts (`-3`); higher is better (positive green,
  negative red);
- rate card: the signed percentage-point difference (`+87%`); higher is better;
- Overall Score: the signed difference of the scores (`-0.574`); higher is better;
- Total Runtime: the signed difference in seconds (`+110s`); lower is better (negative green, positive red);
- Total Run Cost: the signed dollar difference (`-$10`); lower is better.

#### Scenario: Completed count diff
- **WHEN** the baseline completed 45 test cases and the second run 42
- **THEN** the Test Cases Completed badge shows `-3` in red

#### Scenario: Rate diff
- **WHEN** the baseline rate is 12.5 % and the second run's is 99.5 %
- **THEN** the rate badge shows `+87%` in green

#### Scenario: Runtime diff has inverted polarity
- **WHEN** the baseline runtime is 241 s and the second run's is 351 s
- **THEN** the Total Runtime badge shows `+110s` in red

#### Scenario: Cost diff
- **WHEN** the baseline cost is $120 and the second run's is $110
- **THEN** the Total Run Cost badge shows `-$10` in green

#### Scenario: Equal or missing values have no badge
- **WHEN** both runs have the same total runtime, or one run has no overall score
- **THEN** the corresponding card shows no diff badge

### Requirement: Matching-only toggle scope in comparison

When the comparison is limited to matching test cases, Test Cases Completed, the rate card and Total Runtime
SHALL be computed from the matched test cases only. Total Run Cost SHALL always show the whole run's cost,
because cost is only aggregated per run; the card SHALL NOT change when the toggle changes.

#### Scenario: Counts follow the toggle
- **WHEN** the user turns on matching-only
- **THEN** Test Cases Completed, the rate and Total Runtime of each run are recomputed over its matched test
  cases

#### Scenario: Cost ignores the toggle
- **WHEN** the user turns on matching-only
- **THEN** each run's Total Run Cost is unchanged

### Requirement: Comparison cost and runtime states

In compare mode each side of Total Runtime and Total Run Cost SHALL present loading, absent and error data
exactly as the single-run cards do (Calculating state while costs are pending, Error badge, a single em
dash when there is no figure at all, a per-part em dash when only one part is absent). Each run's cost SHALL be fetched with the same eligibility rules as the single-run card,
evaluated per run. A run with a missing figure SHALL NOT blank the other run's side.

#### Scenario: One run still calculating
- **WHEN** the baseline run's cost is available and the second run's is still being aggregated
- **THEN** the baseline side shows its figure and the second side shows the Calculating state
- **AND** the cost diff badge is hidden

#### Scenario: One run has no metrics cost
- **WHEN** the second run has no metrics cost
- **THEN** its Metrics value shows an em dash and its other values are unaffected

### Requirement: Test case counts do not depend on metrics

The Test Cases Completed and rate cards SHALL show correct counts for a run whose suite has no metrics, where
the per-test-case score table has no rows. The *total* SHALL be the run's reported number of test cases once
the run has finished (any status other than PENDING, RUNNING or CANCELLING); for a run still in flight it
SHALL be the number of test cases seen so far. When the run has score rows the counts SHALL come from them
exactly as for any run with metrics. When it has none, the counts SHALL be derived from the run's executions:
each test case is **completed** only when every one of its executions succeeded; every other executed test
case, and every test case of the run with no execution, is **Error or N/A**. Repeat executions of one test case
SHALL count as one test case. The threshold treatment — the Threshold Pass Rate title, the Threshold line and the
Above threshold and Below threshold rows — SHALL apply only when score rows exist; without them the counts are
rated by completion. In the Run Comparison with matching-only enabled, the executions considered SHALL be limited to the
matched ones and the total SHALL be the number of matched test cases seen.

#### Scenario: A run without metrics completes normally
- **WHEN** a COMPLETED run reports 4 test cases, has no score rows, and all 4 test cases have only successful
  executions
- **THEN** Test Cases Completed shows `4` with `/4` and no error line
- **AND** the rate card is titled Completion Rate and shows `100%`
- **AND** neither card shows the Error badge

#### Scenario: Repeat executions count as one test case
- **WHEN** a run without metrics reports 2 test cases and each was executed 3 times, all successfully
- **THEN** Test Cases Completed shows `2` with `/2`, not `/6`

#### Scenario: A test case with a failed execution is not completed
- **WHEN** a run without metrics reports 3 test cases, one with executions SUCCESS and FAILED, one with only
  SUCCESS, and one with only SUCCESS
- **THEN** Test Cases Completed shows `2` with `/3` and an error line reading `1 Error`

#### Scenario: A test case that never executed is N/A
- **WHEN** a finished run without metrics reports 3 test cases but only 1 has any execution, and it succeeded
- **THEN** Test Cases Completed shows `1` with `/3` and an error line reading `2 Error`
- **AND** the tooltip lists Total test cases 3, Completed 1 and Error or N/A 2

#### Scenario: A threshold without score rows is rated by completion
- **WHEN** the run's suite snapshot has a threshold but the run has no score rows yet
- **THEN** the rate card is titled Completion Rate and shows no Threshold line
- **AND** the Test Cases Completed tooltip shows no Above threshold or Below threshold rows

#### Scenario: A run with metrics is unchanged
- **WHEN** a run has score rows
- **THEN** its counts and its Above threshold and Below threshold rows come from those rows
- **AND** no execution query is made for it

#### Scenario: No threshold rows without scores
- **WHEN** the counts were derived from executions
- **AND** the user hovers the value
- **THEN** the tooltip shows no Above threshold or Below threshold rows

#### Scenario: An in-flight run reports what has been seen
- **WHEN** a RUNNING run without metrics reports 10 test cases and 3 have finished successfully
- **THEN** the total reflects the 3 seen so far, not 10, and the card does not count the unstarted ones as errors

#### Scenario: Matching-only limits the fallback to matched executions
- **WHEN** the comparison is limited to matching test cases and a run without metrics has executions outside the
  matched set
- **THEN** only the matched executions are counted for that run
