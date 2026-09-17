## ADDED Requirements

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
