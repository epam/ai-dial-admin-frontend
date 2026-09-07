## MODIFIED Requirements

### Requirement: Tables catalog page

The Tables page SHALL render the tables the page fetched as a grid with columns for name, type, the source table an enrichment enriches, description, column count, and lifecycle status. The source-table column SHALL be blank for a source table, which enriches nothing. The status SHALL be shown with the table status badge (Draft / Active / Failed). Clicking a row (other than the actions column) SHALL navigate to that table's detail page. Each row SHALL offer an action menu with **edit** and **delete** entries, mirroring the columns grid's own per-row action menu (one kebab icon; both entries hidden for system-owned tables); delete's confirmation dialog SHALL use the danger (red confirm) variant. The **edit** action SHALL open the table-metadata edit surface (see "Table metadata editing"). The header SHALL provide actions to create a source table and to create an enrichment table. After a successful create, edit, or delete the catalog SHALL refresh client-side.

#### Scenario: Catalog lists tables with navigation

- **WHEN** the catalog renders with tables
- **THEN** each table appears as a row with its name, type, source table, description, column count, and status badge
- **AND** clicking a row navigates to that table's detail page

#### Scenario: Catalog names the source table an enrichment enriches

- **WHEN** the catalog lists an enrichment table alongside a source table
- **THEN** the enrichment's row shows the name of the table it enriches
- **AND** the source table's row leaves that cell blank

#### Scenario: Draft and active tables are visually distinct

- **WHEN** the catalog lists a `PENDING`/`FAILED` table and an `ACTIVE` table
- **THEN** the draft/failed table shows a non-active status badge and the active table shows the active badge

#### Scenario: Row action menu offers edit and delete

- **WHEN** a non-system row's action menu is opened
- **THEN** it offers an edit entry (table metadata) and a delete entry
- **AND** a system-owned table's row offers neither

#### Scenario: Delete a table

- **WHEN** the user activates a row's delete action and confirms in the red confirmation dialog
- **THEN** the table is deleted and the catalog refreshes
- **AND** a failure surfaces an error notification without navigating away

### Requirement: Table detail column schema management

The Table detail page SHALL branch on the table's lifecycle `status`. The **live** column-management surface described here SHALL be offered only when the table is `ACTIVE`; for a `PENDING`/`FAILED` table the detail view SHALL instead offer the schema-definition surface (see "Define and materialize a table schema"). The detail header SHALL show the table's name, status badge, and kind (source or enrichment) regardless of status; the kind SHALL be presented as a neutral tag rather than a second status-colored badge, since it is fixed for the table's lifetime. When the table has a `description`, the description SHALL be shown beneath them regardless of status too — on its own row below the row that carries the name and the header actions, as a single line spanning the full header width, truncated with the full value reachable via an ellipsis tooltip (as elsewhere long text is truncated). It SHALL NOT share the title row with the header actions, which is what previously cut it to the width they left over. The header actions SHALL NOT be compressed to make room for it: whatever the description contains, every action control SHALL keep its label on one line.

The header SHALL also show a read-only schema-metadata summary. While the table is `ACTIVE` that summary SHALL carry, for a **source** table, its ordering key when set, its partition column and granularity together when a partition is set, and its `identity_column` and `version_column` each when the definition declares it; for an **enrichment** table, the source table it enriches and its grain key when set. A scan-metadata value the definition does not declare SHALL simply be omitted, with no substitute message. A `_`-prefixed scan-metadata value (e.g. `_ingested_at`) is a system column and legitimately matches no row in the columns grid; this SHALL NOT be treated as an error. For a `PENDING`/`FAILED` table the summary SHALL carry an **enrichment**'s source table and nothing else: that value is fixed at create time and so is absent from the schema-definition surface, while a source table's own key, partition, and scan-metadata fields are exposed there as editable inputs instead.

For an `ACTIVE` table, the detail page SHALL show the table's columns in a grid (name, type, tag, display name, description, nullable rendered as a true/false value); the physical source name SHALL NOT be shown as its own grid column — it is an internal identifier surfaced only where an operation requires it (see "Table detail row writes", whose insert template must key by source name). Long display name/description values SHALL be truncated with the full value reachable via an ellipsis tooltip. A column whose `sensitive` flag is true SHALL show a marker (a colored dot with a "Sensitive" tooltip) rendered inline in the name cell, after the name; non-sensitive columns SHALL show no marker. Each column row SHALL offer a per-column action menu with **edit** and **delete (drop)** actions; the delete action SHALL NOT be offered for a column the table's `identity_column` or `version_column` names, since the backend rejects dropping one (422, nothing repoints the pair). Scan-metadata membership SHALL be matched on the column's physical source name, which a rename may have made different from its exposed name. The column name SHALL also be editable inline in the grid — this SHALL rename the column's exposed name only; the immutable physical source name is unaffected. Renaming a scan-metadata column SHALL remain allowed: the backend repoints the stored pair in the same transaction, and the post-change refresh SHALL therefore show the summary carrying the new name.

For an **enrichment** table, the columns grid SHALL additionally show the table's grain key as a pinned, non-editable row at the top of the grid — it carries no action menu and its name is not inline-editable. Because the grain key is never included in the table's declared `columns` (the backend derives its physical type from the matching column on the enrichment's source table and never exposes it as an ordinary column), the pinned row's type/tag/display-name metadata SHALL be backfilled by looking up the source table's column of the same name; when no matching source column is found, the row SHALL still render (name only, blank type/tag/display name) rather than being omitted.

The edit action SHALL open a unified edit modal seeded with the column's current name, display name, tag, description, and sensitive flag. The name field SHALL be required (submit disabled while blank) and SHALL be disabled for columns the backend does not allow to rename (grain-key, ordering-key, and `_`-prefixed system columns) while the metadata fields remain editable; a scan-metadata column SHALL NOT be added to that set, since renaming one is allowed. Blank display name, tag, or description values SHALL be valid input meaning "clear the value"; the sensitive flag SHALL be toggled with a switch, which SHALL be disabled for a column the `identity_column` or `version_column` names — the backend rejects setting `sensitive: true` on one (422) — while that column's name and other metadata fields stay editable. On submit the modal SHALL diff the form against the original column and send a **single** schema patch: a structural `rename` op when the name changed, plus a **single `update` merge-patch entry** carrying the target column name and only the metadata fields (tag, display name, description, sensitive) that changed. Within the `update` entry an omitted field leaves that attribute unchanged, a blank string value clears it, a non-blank string value sets it, and the boolean `sensitive` is sent as `true`/`false` when toggled. When a rename is included, the `update` entry SHALL reference the new (post-rename) column name. Submit SHALL be disabled when no field changed.

Adding columns SHALL be available from the header via a form popup reusing the column-row editor, including its optional display name and description fields, its element-type control, and its disabled-Nullable behavior for Array-typed rows (see "Define and materialize a table schema"). A column added here SHALL therefore be able to carry its display name and description in the same request that creates it, with no follow-up edit needed; the same optionality, blank-omission, and length rules stated there apply. Every live schema change SHALL be sent as a schema patch to `updateTableSchema` (`PATCH /v1/tables/{name}/schema`), and on success the detail view SHALL refresh from the server. Deleting the whole table SHALL be offered from this view's header (behind a confirmation identifying the table by name) as well as from the catalog list's row action menu; editing its catalog metadata (description/tag order) SHALL NOT be offered here and lives only in that row action menu (see "Tables catalog page").

#### Scenario: Live column surface only for materialized tables

- **WHEN** the detail view renders a `PENDING` or `FAILED` table
- **THEN** the live add/drop/rename/edit column surface and the write-rows action are not offered (the schema-definition surface is shown instead)
- **AND** when the table is `ACTIVE` the live column surface is offered

#### Scenario: Inline rename patches the schema

- **WHEN** the user edits an `ACTIVE` table column's name in the grid to a new non-empty value
- **THEN** a rename schema patch is sent and the grid refreshes with the server state

#### Scenario: Combined edit sends one patch with post-rename names

- **WHEN** the user renames `total_money` to `total_cost` and sets its display name to "Total money spend" in the edit modal and submits
- **THEN** a single schema patch is sent containing a rename from `total_money` to `total_cost` and an `update` entry whose `name` is `total_cost` and `display_name` is "Total money spend"
- **AND** the grid refreshes with the server state

#### Scenario: Only changed fields become update fields

- **WHEN** the user changes only the display name and leaves name, tag, and description untouched
- **THEN** the patch contains a single `update` entry carrying only `name` and `display_name`, with no `tag` or `description` field

#### Scenario: Blank metadata clears the value

- **WHEN** the user clears the display name field and submits
- **THEN** the `update` entry sends `display_name` as an empty string, clearing the stored display name

#### Scenario: Sensitive columns are marked in the grid

- **WHEN** the columns grid renders a column whose `sensitive` flag is true
- **THEN** the name cell shows a marker with a "Sensitive" tooltip after the name
- **AND** a column whose flag is false shows no marker

#### Scenario: Drop a column

- **WHEN** the user chooses delete from a column's action menu
- **THEN** a drop schema patch is sent and the column is removed after refresh

#### Scenario: Add columns

- **WHEN** the user adds one or more valid columns in the add-columns popup and submits
- **THEN** an add schema patch is sent and the new columns appear after refresh

#### Scenario: Add-columns popup offers display name and description

- **WHEN** the add-columns popup renders for an `ACTIVE` table
- **THEN** each column row offers an optional Display name field and an optional Description field

#### Scenario: A column added with metadata needs no follow-up edit

- **WHEN** the user adds a column in the add-columns popup with a Display name and a Description filled in and submits
- **THEN** the `add` entry of the schema patch carries that column's `display_name` and `description`
- **AND** after the refresh the grid shows those values without the edit modal having been opened

#### Scenario: Over-cap metadata blocks the add-columns submit

- **WHEN** a column row in the add-columns popup has a Display name over 128 characters or a Description over 1024 characters
- **THEN** that field shows a length validation message and submit is disabled

#### Scenario: Adding an array column requires an element type

- **WHEN** the user adds a column typed Array in the add-columns popup without choosing an element type
- **THEN** submit is disabled until an element type is chosen

#### Scenario: Table description shown under the header

- **WHEN** a table (of any status) has a non-empty `description`
- **THEN** the description is shown under the name and status badge as one line spanning the full header width, independent of how much width the header actions occupy
- **AND** a description too long for that line is truncated with its full value reachable via the ellipsis tooltip
- **AND** a table with no description shows nothing in its place

#### Scenario: Table detail header states the table's kind

- **WHEN** a table (of any status) renders its detail page
- **THEN** the header states whether it is a source table or an enrichment, beside the status badge

#### Scenario: A long description does not reflow the header actions

- **WHEN** a table whose description is long enough to overflow its line renders with its header actions
- **THEN** each action control keeps its label on a single line

#### Scenario: Source table shows its schema metadata summary

- **WHEN** an `ACTIVE` **source** table with an ordering key and a partition set renders
- **THEN** its ordering key, partition column, and granularity are all shown
- **AND** an `ACTIVE` source table with no partition shows only its ordering key

#### Scenario: Source table shows its declared scan-metadata pair

- **WHEN** an `ACTIVE` **source** table whose definition declares `identity_column` and `version_column` renders
- **THEN** both values are shown in the header summary alongside the ordering key
- **AND** a source declaring neither shows neither label and no substitute message
- **AND** a source declaring only one shows that one and omits the other

#### Scenario: A system scan-metadata column is not an error

- **WHEN** an `ACTIVE` source's `version_column` is a `_`-prefixed system column such as `_ingested_at`, which the columns grid therefore does not list
- **THEN** the summary shows that value and the view renders normally, with no error state

#### Scenario: Enrichment table shows its grain key summary

- **WHEN** an `ACTIVE` **enrichment** table renders
- **THEN** its grain key is shown in the header summary

#### Scenario: Enrichment header names the source table it enriches

- **WHEN** an `ACTIVE` **enrichment** table renders
- **THEN** the source table it enriches is shown in the header summary alongside the grain key
- **AND** a `PENDING` or `FAILED` enrichment shows that source table too, with no grain key beside it
- **AND** a source table shows no such value, because it enriches nothing

#### Scenario: Enrichment grid pins the grain key with backfilled metadata

- **WHEN** an `ACTIVE` enrichment table's columns grid renders and its source table has a column matching the grain key's name
- **THEN** the grid shows the grain key as a pinned row at the top, with that source column's type, tag, and display name
- **AND** the pinned row offers no action menu and its name is not inline-editable

#### Scenario: Enrichment grid pins the grain key even without a source-column match

- **WHEN** the enrichment's source table has no column matching the grain key's name
- **THEN** the pinned row still renders, showing the grain key name with blank type, tag, and display name

#### Scenario: A scan-metadata column cannot be dropped

- **WHEN** the columns grid renders a column whose physical source name is the table's `identity_column` or `version_column`
- **THEN** that row's action menu offers no delete action
- **AND** every other column's delete action is unaffected

#### Scenario: A scan-metadata column cannot be marked sensitive

- **WHEN** the user opens the edit modal for a column the table's `identity_column` or `version_column` names
- **THEN** the Sensitive switch is disabled
- **AND** the name, tag, display name, and description fields remain editable and a change to any of them still submits a patch

#### Scenario: Renaming a scan-metadata column repoints the summary

- **WHEN** the user renames a column named by the table's `version_column`
- **THEN** the rename is submitted (it is not blocked) and, after the refresh, the header summary shows the new name
