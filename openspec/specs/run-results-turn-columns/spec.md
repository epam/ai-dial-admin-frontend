# run-results-turn-columns Specification

## Purpose

Defines how the run Extraction Result grid presents request and turn positions for single-request,
chained-request, and multi-turn test cases while preserving flat-row navigation and sorting behavior.

## Requirements

### Requirement: Run results show the turn number and total turn count

The run results grid SHALL display two columns in the `EXECUTION` column group, immediately after `# Run number`:

- **Turn** — the result's `turnIndex` rendered 1-based, matching how `# Run number` renders `runIndex`.
- **Total turns** — the result's `totalTurns` as supplied.

Both SHALL render empty when the underlying field is absent.

#### Scenario: A turn result shows its position

- **WHEN** a result row has `turnIndex` 2 within a 4-turn conversation
- **THEN** the Turn column shows `3` and the Total turns column shows `4`

#### Scenario: The first turn is shown as turn one

- **WHEN** a result row has `turnIndex` 0
- **THEN** the Turn column shows `1`, not `0`

#### Scenario: A single-turn result leaves both cells empty

- **WHEN** a result row carries neither `turnIndex` nor `totalTurns`
- **THEN** both columns render empty

### Requirement: Multi-turn results are not grouped

The results grid SHALL continue to render one flat row per result. It SHALL NOT group rows by test case, add an expander column, synthesize summary rows, alter the default sort, or disable sorting on any column, whether or not the run contains multi-turn cases.

This is a deliberate scope boundary: turn grouping in results is deferred so that concurrent comparison and heatmap work does not conflict with it.

#### Scenario: A multi-turn run renders flat

- **WHEN** a run containing 4-turn conversations is opened
- **THEN** each turn is its own row, with no expander column and no summary rows

#### Scenario: Column sorting still works on a multi-turn run

- **WHEN** a column header is used to sort a run containing multi-turn cases
- **THEN** the sort applies, exactly as it does for a single-turn run

#### Scenario: Per-turn metric scores need no special handling

- **WHEN** a metric is scored for each turn of a conversation
- **THEN** each turn's row shows its own score in the existing metric columns

### Requirement: Request and Turn columns are sortable

The Extraction Result grid SHALL allow users to sort rows numerically by the displayed Request and
Turn values. Sorting either column SHALL remain available and SHALL apply to the currently visible
rows while the Test Case name filter is active.

#### Scenario: Results are sorted by request number

- **WHEN** a user sorts the Request column
- **THEN** the result rows are ordered numerically by request number in the selected direction

#### Scenario: Results are sorted by turn number

- **WHEN** a user sorts the Turn column
- **THEN** the result rows are ordered numerically by turn number in the selected direction

#### Scenario: Filtered results remain sortable

- **WHEN** a user filters results by Test Case name and then sorts the Request or Turn column
- **THEN** the visible matching rows are ordered numerically by the selected column in the selected direction
