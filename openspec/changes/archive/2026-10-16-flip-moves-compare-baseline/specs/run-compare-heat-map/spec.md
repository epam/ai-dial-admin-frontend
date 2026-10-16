## ADDED Requirements

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
