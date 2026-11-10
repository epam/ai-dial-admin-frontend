# run-results-overall-score Specification

## Purpose

Defines the Overall score column of the run results grid and the Run Comparison Execution results grid, and
the matching row in the row detail panels: the test case's score, how it reads against the suite threshold,
what a missing score looks like, and how the column behaves when two runs are compared.

## Requirements

### Requirement: Run results show each test case's overall score

The run Extraction result grid SHALL provide an **Overall score** column in the `EXECUTION` column group.
It SHALL be visible when the grid opens, whatever its values, and SHALL sit after the Execution position
columns (`# Run number`, `Request`, `Turn`) and immediately before `HTTP`.

Each cell SHALL show the overall score of the test case the row belongs to, rounded to at most three decimal
places with trailing zeros dropped (`0.7`, `0.929`). The score is per test case within the run, so rows of
one test case that carry different run numbers, requests or turns SHALL show the same value.

The column SHALL NOT take part in the variation rule that hides uniform position columns: a run whose test
cases all score the same still shows the column.

#### Scenario: The column is shown by default

- **WHEN** the Extraction result grid opens for a run whose test cases have scores
- **THEN** an `Overall score` column is shown in the `EXECUTION` group between the position columns and `HTTP`

#### Scenario: A row shows its test case's score

- **WHEN** a test case scored 0.7 in the run
- **THEN** its row's Overall score cell shows `0.7`

#### Scenario: Scores are rounded to three decimals

- **WHEN** a test case scored 0.92857
- **THEN** its Overall score cell shows `0.929`

#### Scenario: Rows of a repeated test case share the score

- **WHEN** a test case ran twice and its two rows carry run numbers 1 and 2
- **THEN** both rows show the same Overall score value

#### Scenario: A uniform column is still shown

- **WHEN** every test case in the run has the same overall score
- **THEN** the `Overall score` column is still shown

### Requirement: A threshold shows whether a test case passed it

When the run's suite snapshot carries a score threshold, each Overall score cell that has a score SHALL show
an icon next to the value: an **above threshold** icon when the score is greater than or equal to the
threshold, a **below threshold** icon when it is lower. The icon SHALL have a tooltip stating the result and
the threshold as stored, in the form "The test case's overall score is above the threshold (0.6)." or "The
test case's overall score is below the threshold (0.6).".

A cell with an icon SHALL expose its score and the threshold result to assistive technology, so the result is
not conveyed by the icon alone.

When the suite snapshot has no threshold — absent, or enabled with an empty value — scores SHALL be shown
with no icon and no tooltip.

#### Scenario: A score above the threshold

- **WHEN** the threshold is 0.6 and a test case scored 0.7
- **THEN** its cell shows `0.7` with the above-threshold icon

#### Scenario: A score equal to the threshold counts as above

- **WHEN** the threshold is 0.6 and a test case scored 0.6
- **THEN** its cell shows the above-threshold icon

#### Scenario: A score below the threshold

- **WHEN** the threshold is 0.6 and a test case scored 0.5
- **THEN** its cell shows `0.5` with the below-threshold icon

#### Scenario: The icon explains itself on hover

- **WHEN** the user hovers the above-threshold icon of a cell in a run whose threshold is 0.6
- **THEN** a tooltip reads "The test case's overall score is above the threshold (0.6)."

#### Scenario: The result is available without the icon

- **WHEN** a screen reader reaches an Overall score cell that shows an icon
- **THEN** it announces the score and whether it is above or below the threshold

#### Scenario: No threshold means no icons

- **WHEN** the run's suite snapshot has no threshold
- **THEN** every Overall score cell shows its value with no icon

### Requirement: A test case without a score shows a dash

An Overall score cell for a row whose test case has no score — for example one that failed with an HTTP error
before any metric ran — SHALL show a dash and no icon, whether or not the suite has a threshold. A score of
`0` is a score and SHALL be shown as such.

If the scores cannot be loaded, the grid SHALL still render with its other columns and every Overall score
cell SHALL show a dash; the failure SHALL NOT block or replace the grid.

#### Scenario: A failed test case shows a dash

- **WHEN** a test case has no overall score
- **THEN** its Overall score cell shows a dash and no icon

#### Scenario: A zero score is shown

- **WHEN** a test case scored 0 and the threshold is 0.6
- **THEN** its cell shows `0` with the below-threshold icon

#### Scenario: Scores fail to load

- **WHEN** the request for test case scores fails
- **THEN** the grid renders normally with a dash in every Overall score cell

### Requirement: The Overall score column is right-aligned and sortable

The Overall score header and cells SHALL be right-aligned like the other numeric Execution columns, with the
threshold icon after the value. In Run Comparison the same holds for each run's column: its cells and its
run-index header are right-aligned. Sorting
the column SHALL order rows numerically by score in the selected direction, with rows that have no score after
all scored rows in both directions.

#### Scenario: Values sit at the right edge

- **WHEN** the Overall score column is shown
- **THEN** its header text and each cell's content (value, then icon) end at the column's right edge, as for `HTTP` and `Duration`

#### Scenario: Sorting ascending

- **WHEN** the user sorts the Overall score column ascending
- **THEN** rows are ordered from the lowest score to the highest, and rows without a score come last

#### Scenario: Sorting descending

- **WHEN** the user sorts the Overall score column descending
- **THEN** rows are ordered from the highest score to the lowest, and rows without a score still come last

### Requirement: Run Comparison offers the Overall score column hidden by default

The Run Comparison Execution results grid SHALL provide an Overall score column for each compared run in the
`EXECUTION` group, in the same position relative to `HTTP` as in the single-run grid. Both columns SHALL start
hidden, SHALL be listed as unselected in the columns panel, and SHALL show their values once the user selects
them. Each run's cells SHALL show that run's own test case score with the same value, threshold icon, tooltip
and missing-score rendering as the single-run grid, using that run's own threshold.

#### Scenario: Hidden on opening

- **WHEN** the Run Comparison Execution results grid opens
- **THEN** the Overall score columns are not shown

#### Scenario: Offered in the columns panel

- **WHEN** the user opens the columns panel
- **THEN** Overall score is listed as unselected, with an entry for each compared run

#### Scenario: The user shows the column

- **WHEN** the user selects Overall score in the columns panel
- **THEN** each compared run's Overall score column appears with the score of each test case in that run

#### Scenario: Each run reads against its own threshold

- **WHEN** the two compared runs have thresholds 0.6 and 0.8 and a test case scored 0.7 in both
- **THEN** the first run's cell shows the above-threshold icon and the second run's cell shows the below-threshold icon

#### Scenario: A test case present in one run only

- **WHEN** a test case exists in the first run but not in the second
- **THEN** the second run's Overall score cell for that row shows a dash

### Requirement: Run Comparison heads each Execution field once over its per-run columns

Every field of the Run Comparison Execution group — `# Run number`, `Request`, `Turn`, `Overall score`,
`HTTP` and `Duration` — SHALL appear as one title over its per-run columns, each of those headed by its run
index (`1`, `2`) alone, the way a metric's name sits over its run columns. A per-run column SHALL NOT repeat
the field's name in its own header, so the title row and the run-index row each read as one aligned row across
the whole grid. A field's pair of columns SHALL stay together when the user drags a column.

#### Scenario: A field's two runs share one title

- **WHEN** the Execution columns are shown for two compared runs
- **THEN** each field's name appears once, over two columns headed `1` and `2`

#### Scenario: Run-index headers carry no field name

- **WHEN** the `HTTP` columns are shown
- **THEN** their headers read `1` and `2`, and `HTTP` appears only as the title above them

#### Scenario: A field's pair stays together on drag

- **WHEN** the user drags one of the two `Overall score` columns
- **THEN** its counterpart stays beside it under the same title

### Requirement: Differing overall scores are highlighted in Run Comparison

While the Overall score columns are shown, a row whose two runs have different overall scores SHALL carry the
same diff border on the pair of cells as the other compared Execution columns, closed around the pair on
screen. Rows whose scores are equal SHALL carry no border. Hiding the highlights SHALL remove the border like
it does for the other columns.

While the columns are shown, a differing score SHALL count toward "view differences only" row filtering and
toward the diff legend counts. While they are hidden it SHALL NOT, matching how the other hidden columns are
treated.

#### Scenario: Different scores are bordered

- **WHEN** a test case scored 0.5 in the first run and 0.7 in the second and the columns are shown
- **THEN** the pair of Overall score cells carries the diff border

#### Scenario: Equal scores are not bordered

- **WHEN** a test case scored 0.7 in both runs
- **THEN** the pair of Overall score cells carries no diff border

#### Scenario: Hidden columns do not count as differences

- **WHEN** two runs differ only in a test case's overall score and the Overall score columns are hidden
- **THEN** the row is not treated as different by "view differences only" and adds nothing to the diff legend

#### Scenario: Shown columns count as differences

- **WHEN** two runs differ only in a test case's overall score and the Overall score columns are shown
- **THEN** the row is kept by "view differences only" and adds to the diff legend counts

### Requirement: Row detail panels show the overall score

The row detail panels — the bottom drawer and the right side panel, for a single run and for Run Comparison —
SHALL show an **Overall score** row in their Execution section, after `# Run number`, with the same value and
rounding as the grid cell, right-aligned like the other numeric Execution rows. When the run has a threshold,
the value SHALL be followed by the same above/below threshold icon as in the grid, and hovering the cell SHALL
show the same tooltip; a score without a threshold, and a missing score, SHALL show no icon. In Run Comparison
it SHALL show each run's score read against that run's own threshold, and take part in the panel's difference
highlighting and diff counts like the other numeric Execution rows. A test case without a score SHALL show the
panel's empty value, not `0`.

The row SHALL be listed in each panel's Display configuration and SHALL be shown by default, so an Overall
score visible in the grid is visible in the panels as well; the user MAY hide it there, and hiding it in a panel
SHALL NOT change the grid. Clicking an Overall score cell in the grid SHALL bring the matching row into view in
the opened panel.

#### Scenario: The bottom drawer shows the score

- **WHEN** the user opens the bottom drawer for a test case that scored 0.7
- **THEN** the Execution section shows an `Overall score` row with `0.7`

#### Scenario: The score row carries the threshold icon

- **WHEN** the run's threshold is 0.5 and the opened test case scored 0.5, or scored 0
- **THEN** the `Overall score` row shows `0.5` followed by the above-threshold icon, or `0` followed by the below-threshold icon

#### Scenario: Hovering the score row explains the result

- **WHEN** the user hovers the `Overall score` value cell of a run whose threshold is 0.5
- **THEN** a tooltip reads "The test case's overall score is above the threshold (0.5)." or the "below" wording, matching the icon

#### Scenario: No threshold means no icon in the panel

- **WHEN** the opened test case's run has no threshold
- **THEN** the `Overall score` row shows its value with no icon

#### Scenario: The side panel shows the score

- **WHEN** the user switches the open panel to the right side panel
- **THEN** the same `Overall score` row with the same value is shown there

#### Scenario: A zero score is shown as zero

- **WHEN** the opened test case scored 0
- **THEN** the `Overall score` row shows `0`, not an empty value

#### Scenario: No score shows the empty value

- **WHEN** the opened test case has no score
- **THEN** the `Overall score` row shows the panel's empty value

#### Scenario: Each compared run reads against its own threshold in the panel

- **WHEN** the compared runs have thresholds 0.6 and 0.8 and a test case scored 0.7 in both
- **THEN** the panel shows the above-threshold icon for the first run's score and the below-threshold icon for the second's

#### Scenario: Run Comparison panels show both runs

- **WHEN** the user opens a row in Run Comparison whose runs scored 0.5 and 0.7
- **THEN** the panel's `Overall score` row shows `0.5` for the first run and `0.7` for the second, highlighted as a difference

#### Scenario: The row is configurable in the panel

- **WHEN** the user opens a panel's Display configuration
- **THEN** `Overall score` is listed under Execution as selected, and unselecting it removes the row from that panel only

#### Scenario: The icon is not clipped in a narrow Run Comparison side panel

- **WHEN** the Run Comparison side panel is open at a narrow width and shows an `Overall score` row with a threshold
- **THEN** each run's value and its icon are fully visible, the field column giving up width before the value columns do

#### Scenario: A grid cell click focuses the row

- **WHEN** the user clicks an Overall score cell in the grid
- **THEN** the opened panel scrolls to and focuses the `Overall score` row
