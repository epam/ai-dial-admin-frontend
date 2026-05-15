## MODIFIED Requirements

### Requirement: Three-level column headers in compare mode
When compare mode is active, the Analytics grid SHALL display three levels of column headers. The `[blank]` group (execution status icon and test case name) SHALL remain unchanged. All other column groups (EXECUTION, each metric group, EXTRACTED) SHALL each contain individual field sub-groups at the second level. Each field sub-group SHALL contain exactly two leaf columns: **Current** (reading from the current run's row data) and **Compared** (reading from the matched compared run row data).

The column hierarchy in compare mode SHALL follow the shape:
- `[blank group]` (L1) → status icon, test case name (leaves, unchanged)
- `EXECUTION` (L1) → `#` (L2) → `Current`, `Compared` (leaves); `HTTP` (L2) → `Current`, `Compared` (leaves); `Duration` (L2) → `Current`, `Compared` (leaves)
- `<metric group>` (L1) → `<metric key>` (L2) → `Current`, `Compared` (leaves) — repeated per metric key per group
- `EXTRACTED` (L1) → `<field key>` (L2) → `Current`, `Compared` (leaves) — repeated per extracted field

#### Scenario: Column header levels in compare mode
- **WHEN** compare mode is active
- **THEN** EXECUTION, metric groups, and EXTRACTED each have field sub-groups at the second level
- **AND** each field sub-group has exactly a Current leaf and a Compared leaf at the third level

#### Scenario: Blank group stays single-level in compare mode
- **WHEN** compare mode is active
- **THEN** the execution status icon column and test case name column are not duplicated

#### Scenario: Metric key is the second-level group header
- **WHEN** compare mode is active and the grid has a metric group "accuracy" with keys "score" and "pass"
- **THEN** "accuracy" appears at level 1 with "score" and "pass" as level-2 sub-groups
- **AND** each of "score" and "pass" contains a "Current" and a "Compared" leaf column
