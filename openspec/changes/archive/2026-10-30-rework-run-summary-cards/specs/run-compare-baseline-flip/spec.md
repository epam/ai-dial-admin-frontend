## MODIFIED Requirements

### Requirement: Every delta is measured from the current baseline

Every delta, highlight and diff count on the Run Comparison page SHALL be measured as the second run minus the
baseline (first) run, using the baseline in force after the last flip. This applies to Summary Overview delta
badges, the Execution Results Delta columns, Execution Results difference highlighting, and the diff legend
counts. Colors SHALL follow each metric's polarity: for Overall Score, Test Cases Completed and Threshold Pass
Rate / Completion Rate a positive delta is green and a negative delta red; for Total Runtime and Total Run
Cost a positive delta is red and a negative delta green.

#### Scenario: Summary Overview badges recalculate on flip
- **WHEN** the baseline run has Overall Score 0.900 and the second run 0.817, so the badge shows -0.083 in red, and the user flips the runs
- **THEN** the cards show the runs in swapped places
- **AND** the Overall Score badge shows +0.083 in green

#### Scenario: Time metrics keep inverted polarity after flip
- **WHEN** the user flips runs and Total Runtime or Total Run Cost of the new second run is lower than the new baseline's
- **THEN** its badge shows a negative delta in green

#### Scenario: Execution Results Delta columns recalculate on flip
- **WHEN** a row shows `context_to_answer` 1.000 (baseline) and 0.917 with Delta -0.083, and the user flips the runs
- **THEN** the run columns show 0.917 then 1.000
- **AND** the Delta column shows +0.083 with its color following the new sign

#### Scenario: Summary badges agree with Metric Scores after flip
- **WHEN** the user flips the runs
- **THEN** the signs and colors of the Summary Overview badges and of the Metric Scores badges are all computed from the same baseline
