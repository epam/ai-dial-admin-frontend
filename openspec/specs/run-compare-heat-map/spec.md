# run-compare-heat-map Specification

## Purpose
Defines how the Run Comparison Heat Map tab applies the shared score-cell rendering contract: its use
of the score-cell palette, with no border between cells whose values are visible.

## Requirements
### Requirement: Heat Map cells use the shared score-cell palette
The Heat Map tab's value cells, in both Absolute and Delta display mode, SHALL render using the
`score-cell-rendering` contract. A value cell draws no border while its value text is visible; when
its value text is hidden, the contract's hidden-state accent border takes over.

#### Scenario: Absolute mode cell uses the shared palette
- **WHEN** the Heat Map tab is in Absolute display mode and a cell shows a score
- **THEN** the cell's background, text, and border come from the `score-cell-rendering` absolute
  bucket for that score

#### Scenario: Delta mode cell uses the shared palette
- **WHEN** the Heat Map tab is in Delta display mode and a cell shows a non-zero delta
- **THEN** the cell's background, text, and border come from the `score-cell-rendering` delta bucket
  for that delta

#### Scenario: Heat Map cells show no visible divider between each other
- **WHEN** a user views adjacent value cells in the Heat Map tab, each with its value text visible
- **THEN** no border divides them

### Requirement: Delta mode is measured from the baseline run

In Delta display mode the Heat Map SHALL show each cell as the second run's value minus the baseline run's value,
and the cell tooltip SHALL show the same delta with the baseline and compared values it came from. After the runs
are flipped, the delta values, cell colors and tooltips SHALL be recalculated against the new baseline.

#### Scenario: Delta cell recalculates on flip
- **WHEN** Delta mode shows -0.556 for Row 000012 `context_to_answer` (baseline Run # 1732 = 1.000, Run # 1726 = 0.444) and the user flips the runs
- **THEN** the cell shows +0.556 with its delta color
- **AND** its tooltip reads +0.556 as Run # 1732 (1.000) minus the baseline Run # 1726 (0.444)

#### Scenario: Absolute mode is unaffected by baseline
- **WHEN** the Heat Map is in Absolute mode and the user flips the runs
- **THEN** each run's scores are unchanged and the run rows appear in the swapped order
