## RENAMED Requirements

- FROM: `### Requirement: Multi-turn results are not grouped`
- TO: `### Requirement: The flat list renders one row per result`

## MODIFIED Requirements

### Requirement: The flat list renders one row per result

While grouping by test case is switched off or does not apply to the run (see `run-results-test-case-grouping`), the results grid SHALL render one flat row per result. In the flat list it SHALL NOT add an expander column, synthesize summary rows, alter the default sort, or disable sorting on any column, whether or not the run contains multi-turn cases.

Grouping by test case is a separate, switchable view of the same results. It is the only way the grid shows group rows, and turning it off SHALL return exactly this flat list.

#### Scenario: A multi-turn run renders flat

- **WHEN** a run containing 4-turn conversations is opened and grouping by test case is switched off
- **THEN** each turn is its own row, with no expander column and no summary rows

#### Scenario: Column sorting still works on a multi-turn run

- **WHEN** a column header is used to sort a run containing multi-turn cases in the flat list
- **THEN** the sort applies, exactly as it does for a single-turn run

#### Scenario: Per-turn metric scores need no special handling

- **WHEN** a metric is scored for each turn of a conversation
- **THEN** each turn's result row shows its own score in the existing metric columns, in the flat list and inside an expanded group

### Requirement: Request and Turn columns are sortable

In the flat list, the Extraction Result grid SHALL allow users to sort rows numerically by the displayed Request and
Turn values. Sorting either column SHALL remain available and SHALL apply to the currently visible
rows while the Test Case name filter is active. While the grid is grouped by test case no column is sortable
(see `run-results-test-case-grouping`); inside a group, rows keep their run → request → turn order.

#### Scenario: Results are sorted by request number

- **WHEN** a user sorts the Request column in the flat list
- **THEN** the result rows are ordered numerically by request number in the selected direction

#### Scenario: Results are sorted by turn number

- **WHEN** a user sorts the Turn column in the flat list
- **THEN** the result rows are ordered numerically by turn number in the selected direction

#### Scenario: Filtered results remain sortable

- **WHEN** a user filters results by Test Case name and then sorts the Request or Turn column in the flat list
- **THEN** the visible matching rows are ordered numerically by the selected column in the selected direction

#### Scenario: No sorting by position while grouped

- **WHEN** the grid is grouped by test case and the user activates the Request or Turn header
- **THEN** the order of groups and rows does not change
