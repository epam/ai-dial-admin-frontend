## Purpose

Defines how the Run Comparison Heat Map tab applies the shared score-cell rendering contract: its use
of the score-cell palette, with no border between cells whose values are visible.

## ADDED Requirements

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
