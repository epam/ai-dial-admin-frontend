## MODIFIED Requirements

### Requirement: Shared heatmap grid shell

Test Case Stability and Run Comparison Heat Map SHALL share domain-free heatmap grid chrome
(equal-width value columns, axis header rotation, value text threshold, tooltip centering, ColorScale
slot) from `Common/HeatMap`. Compare-specific data shaping (Absolute/Delta, metric groups, twin run
rows) SHALL remain in the Compare feature folder.

Value cells in both grids SHALL render their content right-aligned, matching the rest of the app's
numeric-column convention. The label column (test case or run name) is unaffected and keeps its
existing left alignment.

#### Scenario: Compare Heat Map still renders after extract

- **WHEN** a user opens Run Comparison Heat Map after the shared extract
- **THEN** the Heat Map tab still shows the metric × test-case grid with Absolute/Delta and metrics
  toolbar behavior unchanged

#### Scenario: Heat Map values are right-aligned

- **WHEN** a Run Comparison Heat Map cell shows a value
- **THEN** the value is right-aligned within the cell

#### Scenario: Test Case Stability values are right-aligned

- **WHEN** a Test Case Stability cell shows a score
- **THEN** the value is right-aligned within the cell
