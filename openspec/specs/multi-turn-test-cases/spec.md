# multi-turn-test-cases Specification

## Purpose
TBD - created by archiving change add-multi-turn-test-cases. Update Purpose after archive.
## Requirements
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

A turn row emitted this way SHALL be marked as flattened. Because no `GROUP` row survives to carry them, a flattened turn row SHALL show the case's own `id` and name in their columns rather than leaving them blank — otherwise a filtered-down turn is unidentifiable and its case unrenameable. The case `id` SHALL be readable from the id column's value on every row type regardless of what that row displays, so an id filter can match a turn.

#### Scenario: Filtering matches inside a collapsed group

- **WHEN** a column filter is applied that matches only the third turn of a collapsed case
- **THEN** that turn is shown as a row, showing its case's id and name, and the case's other turns are hidden

#### Scenario: A case is renamed while a filter is active

- **WHEN** the name is edited on a flattened turn row
- **THEN** every turn of that case carries the new name, exactly as editing it on the `GROUP` row would

#### Scenario: Clearing the filter restores grouping

- **WHEN** the last active filter is cleared
- **THEN** multi-turn cases render as `GROUP` rows again, honouring their prior expand state

### Requirement: Turns are added, deleted, and reordered from the row actions

The grid SHALL offer, per row type:

- on a `GROUP` or `SINGLE` row — **Add turn** and **Delete test case**
- on a `TURN` row — **Move turn up**, **Move turn down**, and **Delete turn**

**Move turn up** SHALL NOT be offered on the first turn of a case, and **Move turn down** SHALL NOT be offered on its last turn; neither SHALL mark the case as changed.

Adding a turn to a single-turn case SHALL promote that case to multi-turn: the existing row becomes turn 0 and a new turn is appended whose per-turn fields are empty and whose shared fields carry the case's current shared values. Deleting turns until one remains SHALL demote the case back to a single-turn row.

After adding, deleting, or moving a turn, the affected group SHALL be expanded so the result is visible.

#### Scenario: Adding a turn promotes a single-turn case

- **WHEN** Add turn is used on a single-turn case
- **THEN** the case renders as an expanded group of two turns, the first retaining the original values and the second with no per-turn values of its own

#### Scenario: Deleting the last extra turn demotes the case

- **WHEN** a two-turn case has one turn deleted
- **THEN** the case renders as a plain `SINGLE` row again

#### Scenario: Move up reorders the turns

- **WHEN** Move turn up is used on turn 3
- **THEN** it becomes turn 2, the former turn 2 becomes turn 3, and both retain their values

#### Scenario: Turn actions are hidden on the wrong row type

- **WHEN** the action menu is opened on a `GROUP` row
- **THEN** Move turn up, Move turn down, and Delete turn are not offered

#### Scenario: Move actions are not offered at a turn boundary

- **WHEN** the action menu is opened on the first turn of a case
- **THEN** Move turn up is not offered, while Move turn down and Delete turn are

#### Scenario: A boundary move leaves the case unchanged

- **WHEN** a move past the first or last turn is requested anyway
- **THEN** the turn order is unchanged and the case is not marked as having unsaved changes

### Requirement: Schema fields are scoped as per-turn or shared

Each schema field SHALL be either per-turn (`perTurn` true) or shared. A field without `perTurn` SHALL read as shared, so schemas authored before this change keep their current meaning.

Rendering SHALL follow the scope:

| | collapsed `GROUP` row | `TURN` row | `SINGLE` row |
|---|---|---|---|
| per-turn field | every turn's value, one line per turn, read-only | editable | editable |
| shared field | editable | blank | editable |

Editing a shared field on a `GROUP` row SHALL write the value to every turn of that case. A case's turns SHALL always agree on their shared field values, whichever turn is later removed or reordered.

#### Scenario: A per-turn column previews all turns when collapsed

- **WHEN** a three-turn case is collapsed
- **THEN** each per-turn column shows three stacked values in turn order, with an em dash for an empty turn value

#### Scenario: The stacked preview clears when expanded

- **WHEN** that group is expanded
- **THEN** the `GROUP` row's per-turn cells render empty, because the turn rows below now show each value

#### Scenario: A shared field is edited once

- **WHEN** a shared field is edited on a `GROUP` row
- **THEN** the value is applied to every turn of the case, and the case's `TURN` rows show that column blank

#### Scenario: A shared value survives deleting the turn it was entered on

- **WHEN** a shared field is set on a single-turn case, a turn is added, and the original first turn is deleted
- **THEN** the surviving turn still carries the shared value, and the saved case keeps it

### Requirement: The test case name belongs to the case, not to a turn

The name column SHALL render an editable case name on a `GROUP` row and on a `SINGLE` row. Alongside the editor it SHALL show the turn-count badge on a `GROUP` row and the row's own `Turn N` label on a flattened turn row. A turn row nested under its `GROUP` row SHALL show only its `Turn N` label, since the row above already names the case. The editor SHALL fall back to plain ellipsised text where the grid is read-only.

Editing the name SHALL write it to every turn of that case, so a case's turns always agree on their name.

#### Scenario: A multi-turn case is renamed

- **WHEN** the name is edited on a collapsed `GROUP` row
- **THEN** every turn of that case carries the new name, the case is marked dirty, and the saved case is renamed

#### Scenario: A nested turn row shows its position instead of the name

- **WHEN** a group is expanded
- **THEN** each `TURN` row's name cell shows its `Turn N` label and offers no name editor

#### Scenario: A flattened turn row names its own case

- **WHEN** a filter flattens a three-turn case
- **THEN** each of its rows shows the editable case name with its own `Turn N` label beside it

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

### Requirement: A grouped test case displays its validity once

Validation warnings describe a test case as a whole, not an individual turn. A multi-turn case SHALL therefore present its validity status on exactly one grid row.

While a case is projected with a `GROUP` row, that `GROUP` row SHALL carry the status and its `TURN` rows SHALL render an empty status cell — the same treatment a shared (non-per-turn) schema field already receives on a `TURN` row.

`SINGLE` rows SHALL be unaffected. Rows that carry no row type at all — a grid consuming the shared status column without the grouping projection, such as the CSV import preview — SHALL continue to render their status.

#### Scenario: A collapsed multi-turn case shows one status

- **WHEN** an invalid test case with three turns is collapsed
- **THEN** its master row shows the invalid status and no other row for that case shows a status

#### Scenario: Expanded turn rows show no status

- **WHEN** an invalid multi-turn case is expanded
- **THEN** its master row shows the invalid status and each `Turn N` row shows an empty status cell

#### Scenario: A single-turn case is unchanged

- **WHEN** an invalid single-turn case is displayed
- **THEN** its row shows the invalid status exactly as before this change

#### Scenario: A grid without the grouping projection still shows status

- **WHEN** the CSV import preview renders a row that has no row type
- **THEN** that row shows its validity status

### Requirement: A flattened turn row keeps its status

When an active column filter flattens groups, no master row is emitted for a multi-turn case. In that mode a `TURN` row SHALL show the case's validity status, so that an invalid case is never displayed without a validity signal.

#### Scenario: Filtering flattens a group and the turns keep their status

- **WHEN** a column filter flattens an invalid multi-turn case into bare turn rows
- **THEN** each of those turn rows shows the invalid status

#### Scenario: Clearing the filter restores the single signal

- **WHEN** the column filter is cleared and the case regroups
- **THEN** the status returns to the master row only and the turn rows go blank

### Requirement: Duplicate warnings are stated once on the master row

The master row aggregates its warnings from its turn rows, each of which carries a copy of the same case-level list. Aggregation SHALL deduplicate, so that a warning identical in code, path, field name, and message appears once regardless of how many turns the case has. Warnings differing in any of those SHALL all be kept.

A group SHALL remain valid only when every one of its turns is valid.

#### Scenario: One warning on a three-turn case is shown once

- **WHEN** a three-turn case carries a single case-level warning
- **THEN** the master row's warning list contains that message once

#### Scenario: Warnings differing only by path are both kept

- **WHEN** aggregation encounters two warnings with the same message but different paths
- **THEN** both are kept in the master row's warning list

#### Scenario: One invalid turn makes the group invalid

- **WHEN** any turn of a case is invalid
- **THEN** the master row shows the invalid status

