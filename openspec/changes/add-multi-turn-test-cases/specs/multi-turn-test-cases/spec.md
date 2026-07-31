## ADDED Requirements

### Requirement: A test case carries an ordered sequence of turns

A test case SHALL be able to hold an ordered array of per-turn data maps in `multiTurnData`, alongside shared test-case-level fields in `data`. The two SHALL coexist: `data` holds fields that are constant across the conversation, each `multiTurnData[i]` holds the fields that vary at turn `i`. Turn order SHALL be array position; no persisted turn-index field exists.

A test case with no `multiTurnData` (or an empty one) is single-turn and SHALL behave exactly as before this change.

#### Scenario: A multi-turn case is persisted as one entity

- **WHEN** a test case with three turns is saved
- **THEN** one test case is sent with `multiTurnData` of length 3 in turn order, and its shared fields in `data`

#### Scenario: A single-turn case carries no turn array

- **WHEN** a test case with one turn and no turn structure is saved
- **THEN** the payload contains `data` and no `multiTurnData`

#### Scenario: A case reduced to one turn is not stored as a degenerate array

- **WHEN** a multi-turn case's turns are deleted until one remains
- **THEN** the case is saved with `data` only and no one-element `multiTurnData`

### Requirement: Turn rows are identified by a client-only turn index

The grid SHALL represent one logical test case as one or more flat rows sharing the case `id`. A row belonging to a multi-turn case SHALL carry a client-only `_turnIndex`; a single-turn case's row SHALL carry none. `_turnIndex` SHALL NOT be persisted.

After any structural change to a case's turns, its rows' `_turnIndex` values SHALL be renumbered to contiguous positions `0..n-1`.

`_turnIndex` SHALL be read tolerantly: a number or a numeric string is accepted, `0` is a valid present value, and anything else reads as absent.

#### Scenario: Turn index is stripped before sending

- **WHEN** turn rows are collapsed into a test case for saving
- **THEN** no `_turnIndex` appears anywhere in the payload

#### Scenario: Turn index zero is a present value

- **WHEN** a row carries `_turnIndex` of `0`
- **THEN** it is treated as the first turn of a multi-turn case, not as a single-turn row

#### Scenario: Indices are renumbered after a structural change

- **WHEN** the second of four turns is deleted
- **THEN** the remaining turns carry `_turnIndex` `0`, `1`, `2`

### Requirement: Rows project into group, turn, and single row types

Flat rows SHALL be grouped into logical cases and projected into grid rows of exactly three types: `GROUP` (a multi-turn case's collapsible master row), `TURN` (one turn of an expanded multi-turn case), and `SINGLE` (a single-turn case). Case order SHALL follow first appearance in the input, and turns SHALL be ordered by `_turnIndex`.

A multi-turn case SHALL render collapsed by default: one `GROUP` row, with its `TURN` rows emitted only while expanded.

Each projected row SHALL have a grid row id unique across the whole grid — the shared case `id` alone is not unique, since every turn of a case carries it.

#### Scenario: Collapsed multi-turn case renders one row

- **WHEN** a case with three turns is collapsed
- **THEN** the grid shows a single `GROUP` row for that case and no `TURN` rows

#### Scenario: Expanding reveals the turn rows

- **WHEN** the group is expanded
- **THEN** the `GROUP` row is followed immediately by its three `TURN` rows in turn order

#### Scenario: Single-turn cases are unaffected

- **WHEN** a single-turn case is projected
- **THEN** it renders as one `SINGLE` row with no chevron, no turn badge, and no turn label

### Requirement: An active column filter flattens groups

While any column filter is active, the projection SHALL drop `GROUP` summary rows and emit every turn as its own row, so the grid's native per-column filtering can hide non-matching turns individually.

#### Scenario: Filtering matches inside a collapsed group

- **WHEN** a column filter is applied that matches only the third turn of a collapsed case
- **THEN** that turn is shown as a row and the case's other turns are hidden

#### Scenario: Clearing the filter restores grouping

- **WHEN** the last active filter is cleared
- **THEN** multi-turn cases render as `GROUP` rows again, honouring their prior expand state

### Requirement: Turns are added, deleted, and reordered from the row actions

The grid SHALL offer, per row type:

- on a `GROUP` or `SINGLE` row — **Add turn** and **Delete test case**
- on a `TURN` row — **Move turn up**, **Move turn down**, and **Delete turn**

Adding a turn to a single-turn case SHALL promote that case to multi-turn: the existing row becomes turn 0 and a new empty turn is appended. Deleting turns until one remains SHALL demote the case back to a single-turn row.

After adding, deleting, or moving a turn, the affected group SHALL be expanded so the result is visible.

#### Scenario: Adding a turn promotes a single-turn case

- **WHEN** Add turn is used on a single-turn case
- **THEN** the case renders as an expanded group of two turns, the first retaining the original values and the second empty

#### Scenario: Deleting the last extra turn demotes the case

- **WHEN** a two-turn case has one turn deleted
- **THEN** the case renders as a plain `SINGLE` row again

#### Scenario: Move up reorders the turns

- **WHEN** Move turn up is used on turn 3
- **THEN** it becomes turn 2, the former turn 2 becomes turn 3, and both retain their values

#### Scenario: Turn actions are hidden on the wrong row type

- **WHEN** the action menu is opened on a `GROUP` row
- **THEN** Move turn up, Move turn down, and Delete turn are not offered

### Requirement: Schema fields are scoped as per-turn or shared

Each schema field SHALL be either per-turn (`perTurn` true) or shared. A field without `perTurn` SHALL read as shared, so schemas authored before this change keep their current meaning.

Rendering SHALL follow the scope:

| | collapsed `GROUP` row | `TURN` row | `SINGLE` row |
|---|---|---|---|
| per-turn field | every turn's value, one line per turn, read-only | editable | editable |
| shared field | editable | blank | editable |

Editing a shared field on a `GROUP` row SHALL write the value to every turn of that case.

#### Scenario: A per-turn column previews all turns when collapsed

- **WHEN** a three-turn case is collapsed
- **THEN** each per-turn column shows three stacked values in turn order, with an em dash for an empty turn value

#### Scenario: The stacked preview clears when expanded

- **WHEN** that group is expanded
- **THEN** the `GROUP` row's per-turn cells render empty, because the turn rows below now show each value

#### Scenario: A shared field is edited once

- **WHEN** a shared field is edited on a `GROUP` row
- **THEN** the value is applied to every turn of the case, and the case's `TURN` rows show that column blank

### Requirement: Editing a turn is preserved regardless of expand state

An edit SHALL be recorded against the underlying stored row identified by case `id` and turn index, not against the row object the grid rendered. An edit SHALL survive collapsing and re-expanding the group, and SHALL be included when the case is saved even if the group is collapsed at the time.

A reload that occurs while a case has unsaved changes SHALL keep that case's edited rows in place of the refetched ones, without dropping its other turns and without duplicating the case.

#### Scenario: An edit survives a collapse

- **WHEN** a turn value is edited, the group is collapsed, and the group is expanded again
- **THEN** the edited value is still shown

#### Scenario: A collapsed case still saves all its turns

- **WHEN** a turn is edited and the group is collapsed before saving
- **THEN** the saved case contains every turn, with the edit applied to the correct one

#### Scenario: A refresh preserves unsaved turn edits

- **WHEN** the grid refreshes while a multi-turn case has unsaved edits
- **THEN** that case shows its unsaved rows, all of its turns, and appears exactly once
