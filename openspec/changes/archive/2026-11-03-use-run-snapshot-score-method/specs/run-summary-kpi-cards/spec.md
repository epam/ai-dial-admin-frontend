## MODIFIED Requirements

### Requirement: Overall Score card

The Overall Score card SHALL show the run-level overall score with three decimals (`0.580`). When the run's
suite snapshot has an overall score threshold the card SHALL show an above/below glyph to the left of the
value — above when the score is at or over the threshold (inclusive), below otherwise — and hovering or
focusing the value SHALL show a tooltip stating `Overall score is above the threshold (<threshold>).` or
`Overall score is below the threshold (<threshold>).`. The above/below state SHALL also be available to
assistive technology as text, since the glyph is decorative. Without a threshold the card SHALL show neither
glyph nor tooltip on the value. The card SHALL show a static "Based on completed test cases" label and an info
control; hovering or focusing the control SHALL show the calculation method the run was evaluated with:
- Mean: "Calculation method:", "Mean of <N> metrics" and the formula `score = mean(m₁, m₂, … mₙ)`;
- Weighted mean: "Calculation method:", "Weighted mean of <N> metrics" and one `<metric>.<field> × <weight>`
  line per weight;
- Specific function: a table of Calculation method (Specific function), Function, Dataset column, Dataset
  value, P column and P column value.

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

### Requirement: Comparison strip composition and layout

The Run Comparison Summary strip SHALL render the same five cards in the same order as the single-run strip,
each in dual-run layout: the baseline run's value on the left and the second run's on the right, each
headed by its run name, separated by a divider, with the card title followed by a diff badge when a diff
exists. Per-run content SHALL match the single-run card (Test Cases Completed value, error line and hover
tooltip, headed by the run name; per-run rate with bar and threshold line; per-run overall score; per-run
runtime and cost breakdown). On the Overall Score card each run's value SHALL be followed by its own info
control with that run's calculation-method tooltip, taken from that run's own stored method as the single-run
card does, and the "Based on completed test cases" label SHALL stay below both runs. Each run's glyph,
threshold tooltip and `Threshold:` line SHALL use that run's own threshold.
The rate card SHALL be titled Threshold Pass Rate when either run has a threshold and Completion Rate when
neither does. In a pair where only one run has a threshold, the run without a threshold SHALL show an em dash
on the rate card and the rate diff badge SHALL be hidden. The strip SHALL show a spinner until both runs'
aggregates have loaded.

#### Scenario: Five cards in dual layout
- **WHEN** the comparison summary renders for runs #316 and #315
- **THEN** it shows Test Cases Completed, Threshold Pass Rate, Overall Score, Total Runtime and Total Run
  Cost, each with Run #316 on the left and Run #315 on the right

#### Scenario: Info control beside each score
- **WHEN** the Overall Score card renders in compare mode
- **THEN** an info control follows each run's score value
- **AND** the "Based on completed test cases" label appears once, below both runs

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
