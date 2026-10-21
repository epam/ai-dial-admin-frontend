## MODIFIED Requirements

### Requirement: Test case × run matrix with gap handling
The Stability section SHALL present a heatmap whose **rows** are the Trends `runOrder` runs in
chronological order and whose **columns** are distinct `test_case_name` values (sorted ascending).
Each cell SHALL reflect the `score` (and expose `passed` in the cell tooltip) for that
`(test_case_name, runId)` pair. When no summary exists for a pair, the cell SHALL render as a gap
(default empty fill and non-applicable value), not as an error or crash. Duplicate summaries for
the same pair SHALL resolve with last-row-wins semantics. The cell's score color SHALL come from
the shared `score-cell-rendering` absolute palette, with no border between cells with visible values.

#### Scenario: Present score cell
- **WHEN** a summary row exists for test case T and run R with score `0.75`
- **THEN** the matrix cell for run R × test case T shows the score using the shared
  `score-cell-rendering` absolute bucket colors, with no border separating it from its
  neighbors

#### Scenario: Missing test case is a gap
- **WHEN** test case T has a summary in run R1 but not in run R2
- **THEN** the R2 × T cell is a gap (not an error state for the section)

#### Scenario: Duplicate summaries last-wins
- **WHEN** two summary rows share the same `test_case_name` and `test_suite_run_id` and differ in
  `score`
- **THEN** the matrix cell uses the score from the later row in the result set
