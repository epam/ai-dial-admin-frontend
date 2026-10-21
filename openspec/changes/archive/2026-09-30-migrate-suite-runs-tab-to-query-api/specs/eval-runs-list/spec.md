## ADDED Requirements

### Requirement: The suite-scoped runs list sources the same data as the unscoped list

The Test Suite Runs tab SHALL read run rows from the same query-backed source as the unscoped runs
list, so a suite-scoped row carries the same Target, Metrics, Cost, and Overall score values a
corresponding unscoped row would carry for the same run — never a missing-value indication caused
only by which view rendered it.

#### Scenario: Suite tab shows the same target, metrics, cost, and score as the unscoped list

- **WHEN** a run has a resolvable target, metric names, a recorded cost, or an overall score
- **AND** the operator views that run from its test suite's Runs tab
- **THEN** the Target, Metrics, Cost, and Overall score cells show the same values they would show on
  the unscoped runs list

#### Scenario: A run genuinely lacking a value still shows the missing-value indication

- **WHEN** a run has no resolvable target, no metrics, no cost, or no overall score
- **AND** the operator views that run from its test suite's Runs tab
- **THEN** the corresponding cell shows the missing-value indication, matching the unscoped list's
  behavior for the same run
