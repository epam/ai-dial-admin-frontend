## ADDED Requirements

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
