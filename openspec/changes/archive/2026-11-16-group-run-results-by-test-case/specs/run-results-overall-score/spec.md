## MODIFIED Requirements

### Requirement: Run results show each test case's overall score

The run Extraction result grid SHALL provide an **Overall score** column in the `EXECUTION` column group.
It SHALL be visible when the grid opens, whatever its values, and SHALL sit after the Execution position
columns (`# Run number`, `Request`, `Turn`) and immediately before `HTTP`.

In the flat list — grouping switched off, or not applicable to the run — each cell SHALL show the overall
score of the test case the row belongs to, rounded to at most three decimal places with trailing zeros
dropped (`0.7`, `0.929`). The score is per test case within the run, so rows of one test case that carry
different run numbers, requests or turns SHALL show the same value.

While the grid is grouped by test case (see `run-results-test-case-grouping`), the score SHALL be shown on
the group row only, with the same rounding; result rows SHALL leave the cell empty.

The column SHALL NOT take part in the variation rule that hides uniform position columns: a run whose test
cases all score the same still shows the column.

#### Scenario: The column is shown by default

- **WHEN** the Extraction result grid opens for a run whose test cases have scores
- **THEN** an `Overall score` column is shown in the `EXECUTION` group between the position columns and `HTTP`

#### Scenario: A row shows its test case's score

- **WHEN** a test case scored 0.7 in the run and the list is flat
- **THEN** its row's Overall score cell shows `0.7`

#### Scenario: Scores are rounded to three decimals

- **WHEN** a test case scored 0.92857
- **THEN** its Overall score cell — the row's in the flat list, the group row's when grouped — shows `0.929`

#### Scenario: Rows of a repeated test case share the score

- **WHEN** a test case ran twice, its two rows carry run numbers 1 and 2, and the list is flat
- **THEN** both rows show the same Overall score value

#### Scenario: A grouped test case shows its score once

- **WHEN** a test case ran twice and the grid is grouped
- **THEN** the score is shown on its group row and neither result row shows one

#### Scenario: A uniform column is still shown

- **WHEN** every test case in the run has the same overall score
- **THEN** the `Overall score` column is still shown

### Requirement: A test case without a score shows a dash

An Overall score cell that carries a test case's score — a row's in the flat list, a group row's when
grouped — for a test case that has no score, for example one that failed with an HTTP error before any metric
ran, SHALL show a dash and no icon, whether or not the suite has a threshold. A score of `0` is a score and
SHALL be shown as such. The empty Overall score cell of a result row inside a group is not a missing score
and SHALL stay empty.

If the scores cannot be loaded, the grid SHALL still render with its other columns and every Overall score
cell that carries a score SHALL show a dash; the failure SHALL NOT block or replace the grid.

#### Scenario: A failed test case shows a dash

- **WHEN** a test case has no overall score
- **THEN** its Overall score cell shows a dash and no icon

#### Scenario: A zero score is shown

- **WHEN** a test case scored 0 and the threshold is 0.6
- **THEN** its cell shows `0` with the below-threshold icon

#### Scenario: Scores fail to load

- **WHEN** the request for test case scores fails
- **THEN** the grid renders normally with a dash in every Overall score cell that carries a score

#### Scenario: Result rows of a group stay empty

- **WHEN** the grid is grouped and a test case has no score
- **THEN** its group row shows a dash and its result rows' Overall score cells are empty

### Requirement: The Overall score column is right-aligned and sortable

The Overall score header and cells SHALL be right-aligned like the other numeric Execution columns, with the
threshold icon after the value. In Run Comparison the same holds for each run's column: its cells and its
run-index header are right-aligned. In the flat list, sorting the column SHALL order rows numerically by
score in the selected direction, with rows that have no score after all scored rows in both directions.
While the grid is grouped the column is not sortable (see `run-results-test-case-grouping`).

#### Scenario: Values sit at the right edge

- **WHEN** the Overall score column is shown
- **THEN** its header text and each cell's content (value, then icon) end at the column's right edge, as for `HTTP` and `Duration`

#### Scenario: Sorting ascending

- **WHEN** the user sorts the Overall score column ascending in the flat list
- **THEN** rows are ordered from the lowest score to the highest, and rows without a score come last

#### Scenario: Sorting descending

- **WHEN** the user sorts the Overall score column descending in the flat list
- **THEN** rows are ordered from the highest score to the lowest, and rows without a score still come last

#### Scenario: No sorting while grouped

- **WHEN** the grid is grouped and the user activates the Overall score header
- **THEN** the order of groups and rows does not change
