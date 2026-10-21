# run-compare-baseline-flip Specification

## Purpose
Defines what "Flip runs order" does on the Run Comparison page: the baseline moves with the flip, and every
comparison surface is measured from the new baseline, so the page never mixes two baselines.

## Requirements

### Requirement: Flip moves the baseline with the run order

Activating "Flip runs order" SHALL swap the two compared runs, so the run that was second becomes the first
and the baseline, and the run that was the baseline becomes second. The "1" index badge and the "(baseline)"
label SHALL always sit on the first (left) run tag, and the "2" badge on the second. The compared-run URL
(`?runs=`) SHALL be rewritten with the swapped run ids, so a reload or a shared link keeps the flipped order.

#### Scenario: Flip swaps the runs and keeps the labels in place
- **WHEN** the page shows "1 Run # 1732 (baseline)" and "2 Run # 1726" and the user activates "Flip runs order"
- **THEN** the page shows "1 Run # 1726 (baseline)" and "2 Run # 1732"

#### Scenario: Flip is reflected in the URL
- **WHEN** the user flips runs `a` and `b` (URL `?runs=a,b`)
- **THEN** the URL becomes `?runs=b,a`
- **AND** reloading the page shows `b` as the baseline

#### Scenario: Flipping twice restores the original order
- **WHEN** the user flips the runs and flips them again
- **THEN** the original run is the baseline again and every value matches what the page showed before the first flip

### Requirement: Every delta is measured from the current baseline

Every delta, highlight and diff count on the Run Comparison page SHALL be measured as the second run minus the
baseline (first) run, using the baseline in force after the last flip. This applies to Summary Overview delta
badges, the Execution Results Delta columns, Execution Results difference highlighting, and the diff legend
counts. Colors SHALL follow each metric's polarity: for Overall Score and Test Cases Passed Threshold a positive
delta is green and a negative delta red; for Avg Test Case Run Time and Avg Metric-Eval Latency a positive delta
is red and a negative delta green.

#### Scenario: Summary Overview badges recalculate on flip
- **WHEN** the baseline run has Overall Score 0.900 and the second run 0.817, so the badge shows -0.083 in red, and the user flips the runs
- **THEN** the cards show the runs in swapped places
- **AND** the Overall Score badge shows +0.083 in green

#### Scenario: Time metrics keep inverted polarity after flip
- **WHEN** the user flips runs and Avg Test Case Run Time of the new second run is lower than the new baseline's
- **THEN** its badge shows a negative delta in green

#### Scenario: Execution Results Delta columns recalculate on flip
- **WHEN** a row shows `context_to_answer` 1.000 (baseline) and 0.917 with Delta -0.083, and the user flips the runs
- **THEN** the run columns show 0.917 then 1.000
- **AND** the Delta column shows +0.083 with its color following the new sign

#### Scenario: Summary badges agree with Metric Scores after flip
- **WHEN** the user flips the runs
- **THEN** the signs and colors of the Summary Overview badges and of the Metric Scores badges are all computed from the same baseline

### Requirement: One-sided values are outlined by which run holds them

In Execution Results, a value that exists only in the baseline run SHALL be outlined in red, and a value that
exists only in the other run SHALL be outlined in teal. After a flip the outlines SHALL swap accordingly.

#### Scenario: Baseline-only value is red, other-only is teal
- **WHEN** a row has values in the baseline run and "—" in the other run
- **THEN** the row is outlined in red

#### Scenario: Outline colors swap on flip
- **WHEN** a row has values only in Run # 1598 and Run # 1598 is the baseline (red outline), and the user flips the runs
- **THEN** Run # 1598 is the second run and the row is outlined in teal

### Requirement: Flip behaves like a change of the compared pair

Flipping SHALL be treated as a change of the compared runs: Display field visibility and difference toggles
reset to their defaults, an open row-details panel closes, and the results grid is rebuilt from the new baseline,
so its row order follows the new baseline.

#### Scenario: Open row-details panel closes on flip
- **WHEN** a row-details panel is open (bottom or side) and the user flips the runs
- **THEN** the panel closes

#### Scenario: Display settings reset on flip
- **WHEN** the user has hidden a column group in Execution Results Display and then flips the runs
- **THEN** Display shows its default field visibility

### Requirement: Run tags are always shown, by name when known and by id otherwise

Both run tags SHALL be shown from the first render, including while run data is loading. A tag SHALL show the
run's name once it is known and the run's id until then. A name learned for a run SHALL stay in use when the run
changes position (flip), so a flip never blanks or downgrades a tag whose name was already known.

#### Scenario: Tags show ids while names load
- **WHEN** the Run Comparison page opens and the run names have not loaded yet
- **THEN** both tags are shown with the run ids
- **AND** each tag switches to the run's name when it loads

#### Scenario: Known names survive a flip
- **WHEN** both run names are known and the user flips the runs while the new baseline's data is still loading
- **THEN** both tags are shown immediately with their run names, swapped
