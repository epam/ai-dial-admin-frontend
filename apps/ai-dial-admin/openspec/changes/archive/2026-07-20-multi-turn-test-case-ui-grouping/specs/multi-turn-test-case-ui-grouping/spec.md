## ADDED Requirements

### Requirement: Flat rows grouped into logical test cases
The test-case grids SHALL group flat backend rows into logical test cases by their top-level
`multiTurnId`. Rows sharing a non-empty `multiTurnId` form one multi-turn case; a row without
a `multiTurnId` is a single-turn case. Turns within a case SHALL be ordered by `turnIndex`.
Storage remains flat and unchanged — no field, entity, or CSV format change.

#### Scenario: Rows with a shared multiTurnId form one case
- **WHEN** two or more backend rows share the same non-empty `multiTurnId`
- **THEN** they are displayed as a single multi-turn test case whose turns are ordered by `turnIndex`

#### Scenario: Row without multiTurnId is single-turn
- **WHEN** a backend row has no `multiTurnId`
- **THEN** it is displayed as a single-turn test case (one editable row)

#### Scenario: Legacy gaps or duplicates in turnIndex
- **WHEN** grouped rows have non-contiguous or duplicate `turnIndex` values
- **THEN** turns are still displayed sorted by `turnIndex`
- **AND** the next structural operation renumbers them to contiguous `0..n-1`

### Requirement: Conversation-grouping keys are hidden and auto-managed
The grids SHALL NOT render the manual `multiTurnId` and `turnIndex` columns. The UI SHALL manage
those values automatically: generating a `multiTurnId` when a case becomes multi-turn and setting
`turnIndex` to each turn's position.

#### Scenario: Manual columns removed
- **WHEN** either test-case grid is displayed
- **THEN** no editable `multiTurnId` or `turnIndex` column is shown

#### Scenario: Keys assigned on promotion
- **WHEN** a single-turn case gains a second turn
- **THEN** the UI generates a `multiTurnId` shared by both turns and assigns `turnIndex` `0` and `1`

### Requirement: Multi-turn cases are collapsible and collapsed by default
The grid SHALL render each multi-turn case as a group summary row with an expander chevron, collapsed
by default. Expanding reveals one editable row per turn, aligned to the same columns. Single-turn
cases render as a single editable row with no chevron.

#### Scenario: Collapsed on load
- **WHEN** the grid loads
- **THEN** every multi-turn case is collapsed, showing only its group summary row

#### Scenario: Summary row shows all turns stacked
- **WHEN** a multi-turn case is collapsed
- **THEN** each schema column of its summary row shows every turn's value for that field, one line
  per turn (read-only), and the row grows to fit
- **AND** the name column shows the case name with an `N turns` badge

#### Scenario: Expand reveals editable turn rows
- **WHEN** the user clicks the chevron on a collapsed group
- **THEN** one editable turn row per turn appears beneath the summary row, aligned to the same columns

### Requirement: Search flattens to matching turns
When any floating column filter is active, the grid SHALL switch to a flat turn view — showing turn
and single rows without group summary rows — so native per-column filtering hides non-matching rows.
Clearing all filters SHALL restore the collapsed view.

#### Scenario: Typing a filter expands matches
- **WHEN** the user enters text in a floating column filter
- **THEN** group summary rows are replaced by their turn rows and non-matching turn/single rows are
  hidden, so a case is visible only if one of its turns matches
- **AND** each turn row shows its case name for context

#### Scenario: Clearing the filter re-collapses
- **WHEN** the user clears all floating column filters
- **THEN** the grid returns to the collapsed view honoring the user's expanded/collapsed state

### Requirement: Add, delete, and reorder turns
The grid SHALL let the user add a turn, delete a turn, and reorder turns (up/down), auto-managing
`multiTurnId`/`turnIndex`. Structural operations persist immediately via existing server actions;
field edits remain batched and flush on the existing Save.

#### Scenario: Add turn to a single-turn case (promote)
- **WHEN** the user adds a turn to a single-turn case
- **THEN** a `multiTurnId` is generated, the existing row is updated to `turnIndex 0`, and a new
  blank turn is created at `turnIndex 1`

#### Scenario: Add turn to a multi-turn case
- **WHEN** the user adds a turn to a multi-turn case with N turns
- **THEN** a new blank turn is created at `turnIndex = N`

#### Scenario: Delete a turn down to one (demote)
- **WHEN** the user deletes turns until one remains
- **THEN** the remaining row is updated to remove `multiTurnId` and `turnIndex`, becoming a
  single-turn case

#### Scenario: Delete a turn among many
- **WHEN** the user deletes one turn from a case with more than two turns
- **THEN** that row is removed and the remaining turns are renumbered to contiguous `0..n-1`

#### Scenario: Reorder turns
- **WHEN** the user moves a turn up or down
- **THEN** the affected turns swap `turnIndex` values and the new order is persisted

### Requirement: Case-level selection and read-only mode
Row selection for batch delete SHALL apply only to group summary and single-turn rows (whole cases);
turn rows SHALL NOT be selectable. In read-only mode, add/delete/reorder actions SHALL be hidden
while expand/collapse remains available.

#### Scenario: Turn rows not selectable
- **WHEN** the user attempts to select rows for batch delete
- **THEN** only group summary and single-turn rows can be selected; turn rows cannot

#### Scenario: Read-only hides edit actions
- **WHEN** the grid is in read-only mode
- **THEN** add/delete/reorder turn actions are hidden but the user can still expand and collapse cases
