# Analytics Tables

## Purpose

The tables catalog and a table's detail page: column schema definition and materialization, enum-typed columns, row writes, per-table roles, lifecycle status, and the Connect panel that surfaces the public endpoints.
## Requirements
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

### Requirement: Create table (source or enrichment)

Creating a table SHALL open a form popup that is mounted only while open, so closing discards its state without a manual reset; the form SHALL be held as a single object seeded when the popup opens (enrichment defaults derived from the first source table). Create SHALL be **identity-only**: a **source** table SHALL collect a name, optional description, and a **write discipline**; an **enrichment** table SHALL collect a name, optional description, and a source table. The popup SHALL NOT collect columns, ordering key, partition, or grain key — the physical schema is defined afterwards on the table detail view. Submit SHALL build the type-discriminated identity-only create payload, and on success SHALL show a success notification and route to the created table's detail view; the created table is in `PENDING` (not yet materialized) status.

The **write discipline** is the source table's `write` member: `append`, which keeps every written row, or `upsert_by_key`, which collapses the table to the latest row per ordering key and so makes the ordering key its unique key. It SHALL be offered as a two-option selection seeded to `append`, and SHALL always be sent — the create payload SHALL carry the selected value rather than relying on the service's own default, so the choice the user saw is the choice recorded. Each option SHALL be presented with the consequence of choosing it, and the control SHALL state that the value is fixed for the table's lifetime, in the manner the schema-definition surface already explains its physical keys (see "Table schema keys are explained where they are chosen and where they are read"). No later request changes it: the value selects the storage engine, which is frozen when the table is materialized, and the service rejects `write` on the schema-definition endpoint and on every mutating endpoint.

The write discipline is a **source-only** field. The create-enrichment popup SHALL NOT offer it and the enrichment create payload SHALL NOT carry it — an enrichment is always keyed and collapsed on its grain key, and the service answers 422 to a body that carries the member for one.

#### Scenario: Popup state is discarded on close

- **WHEN** the user opens the create popup, edits fields, and closes it
- **THEN** re-opening the popup shows a fresh, empty form
- **AND** the write-discipline selection is back to `append`

#### Scenario: Create sends identity only

- **WHEN** the user creates a source (name + optional description + write discipline) or an enrichment (name + source table + optional description) and submits
- **THEN** the create payload carries only identity/metadata fields and no `columns` or physical key
- **AND** on success the user is routed to the new table's detail view, which shows the table as a draft (`PENDING`)

#### Scenario: Enrichment requires a source table

- **WHEN** the user opens the create-enrichment popup
- **THEN** it offers a source-table selection whose value is required to submit

#### Scenario: Source create offers the two write disciplines

- **WHEN** the user opens the create-source popup
- **THEN** it offers a write-discipline selection with exactly the two options `append` and `upsert_by_key`, seeded to `append`
- **AND** each option states what it does to a write against a key the table already holds
- **AND** the control states that the choice is fixed once the table is created

#### Scenario: A source table is created upsert-keyed

- **WHEN** the user selects the collapsing discipline and submits the create-source form
- **THEN** the create payload carries `write: "upsert_by_key"`

#### Scenario: A source table created with the default still sends it

- **WHEN** the user submits the create-source form without touching the write-discipline selection
- **THEN** the create payload carries `write: "append"`

#### Scenario: Enrichment create never carries a write discipline

- **WHEN** the user opens the create-enrichment popup and submits it
- **THEN** no write-discipline control is offered
- **AND** the create payload carries no `write` member

### Requirement: Table detail column schema management

The Table detail page SHALL branch on the table's lifecycle `status`. The **live** column-management surface described here SHALL be offered only when the table is `ACTIVE`; for a `PENDING`/`FAILED` table the detail view SHALL instead offer the schema-definition surface (see "Define and materialize a table schema"). The detail header SHALL show the table's name, status badge, and kind (source or enrichment) regardless of status; the kind SHALL be presented as a neutral tag rather than a second status-colored badge, since it is fixed for the table's lifetime. When the table has a `description`, the description SHALL be shown beneath them regardless of status too — on its own row below the row that carries the name and the header actions, spanning the full header width. It SHALL be **readable without hovering**: held to **one line** with a **Show more** control on that same line, revealing the rest in place and appearing only when the line cannot hold it. Putting the control beneath the text would spend a second line on every description, including the ones that needed none. A description is the one field on this page written to be read, so an ellipsis tooltip — which asks for a hover and is unreachable by keyboard — is not enough for it. It SHALL NOT share the title row with the header actions, which is what previously cut it to the width they left over. The header actions SHALL NOT be compressed to make room for it: whatever the description contains, every action control SHALL keep its label on one line.

The header SHALL also show a read-only schema-metadata summary. While the table is `ACTIVE` that summary SHALL carry, for a **source** table, its ordering key when set, its partition column and granularity together when a partition is set, and its `identity_column` and `version_column` each when the definition declares it; for an **enrichment** table, the source table it enriches — labelled **Source**, as the pipeline pages label the same relation — and its grain key when set. A scan-metadata value the definition does not declare SHALL be omitted. When an `ACTIVE` **source** declares neither, the summary SHALL instead state that the table is not scannable — it cannot be read incrementally. An enrichment carries no such statement. A `_`-prefixed scan-metadata value (e.g. `_ingested_at`) is a system column and legitimately matches no row in the columns grid; this SHALL NOT be treated as an error. For a `PENDING`/`FAILED` table the summary SHALL carry an **enrichment**'s source table and nothing else: that value is fixed at create time and so is absent from the schema-definition surface, while a source table's own key, partition, and scan-metadata fields are exposed there as editable inputs instead.

For an `ACTIVE` table, the detail page SHALL show the table's columns in a grid (name, type, tag, display name, description, nullable rendered as a true/false value); the physical source name SHALL NOT be shown as its own grid column — it is an internal identifier surfaced only where an operation requires it (see "Table detail row writes", whose insert template must key by source name). A long **display name** or **description** SHALL be truncated in its cell with the full value reachable via the grid's ellipsis tooltip, which is how every other grid in the console presents a value too long for its column. The header's description is the one the page holds to a line with a **Show more** control; inside the grid that control competed with the row for width and, on a cell the grid does not clip, printed the description across the next column. A column whose `sensitive` flag is true SHALL show a marker (a colored dot with a "Sensitive" tooltip) rendered inline in the name cell, after the name; non-sensitive columns SHALL show no marker. Each column row SHALL offer a per-column action menu with **edit** and **delete (drop)** actions; the delete action SHALL NOT be offered for a column the table's `identity_column` or `version_column` names, since the backend rejects dropping one (422, nothing repoints the pair). Scan-metadata membership SHALL be matched on the column's physical source name, which a rename may have made different from its exposed name. The column name SHALL also be editable inline in the grid — this SHALL rename the column's exposed name only; the immutable physical source name is unaffected. Renaming a scan-metadata column SHALL remain allowed: the backend repoints the stored pair in the same transaction, and the post-change refresh SHALL therefore show the summary carrying the new name.

For an **enrichment** table, the columns grid SHALL additionally show the table's grain key as a pinned, non-editable row at the top of the grid — it carries no action menu and its name is not inline-editable. Because the grain key is never included in the table's declared `columns` (the backend derives its physical type from the matching column on the enrichment's source table and never exposes it as an ordinary column), the pinned row's type/tag/display-name metadata SHALL be backfilled by looking up the source table's column of the same name; when no matching source column is found, the row SHALL still render (name only, blank type/tag/display name) rather than being omitted.

The edit action SHALL open a unified edit modal seeded with the column's current name, display name, tag, description, and sensitive flag, and showing the column's nullable flag. The name field SHALL be required (submit disabled while blank) and SHALL be disabled for columns the backend does not allow to rename (grain-key, ordering-key, partition, and `_`-prefixed system columns) while the metadata fields remain editable; a scan-metadata column SHALL NOT be added to that set, since renaming one is allowed. Blank display name, tag, or description values SHALL be valid input meaning "clear the value"; the sensitive flag SHALL be toggled with a switch, which SHALL be disabled for a column the `identity_column` or `version_column` names — the backend rejects setting `sensitive: true` on one (422) — while that column's name and other metadata fields stay editable. On submit the modal SHALL diff the form against the original column and send a **single** schema patch: a structural `rename` op when the name changed, plus a **single `update` merge-patch entry** carrying the target column name and only the metadata fields (tag, display name, description, sensitive) that changed. Within the `update` entry an omitted field leaves that attribute unchanged, a blank string value clears it, a non-blank string value sets it, and the boolean `sensitive` is sent as `true`/`false` when toggled. When a rename is included, the `update` entry SHALL reference the new (post-rename) column name. Submit SHALL be disabled when no field changed. The nullable flag SHALL be shown as a disabled switch, because nullability is fixed once the column exists: it is displayed for reference and is never part of the patch.

The delete action SHALL NOT be offered for a column that the table's ordering key, its partition column, its grain key (the pinned row), its `identity_column` or its `version_column` names, because the backend rejects dropping any of them (422). Every other column's delete action is unaffected.

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
- **AND** a description too long for the line offers Show more beside it, which reveals the rest in place
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
- **AND** a source declaring neither shows neither label and states that the table is not scannable
- **AND** a source declaring only one shows that one and omits the other

#### Scenario: A system scan-metadata column is not an error

- **WHEN** an `ACTIVE` source's `version_column` is a `_`-prefixed system column such as `_ingested_at`, which the columns grid therefore does not list
- **THEN** the summary shows that value and the view renders normally, with no error state

#### Scenario: Enrichment table shows its grain key summary

- **WHEN** an `ACTIVE` **enrichment** table renders
- **THEN** its grain key is shown in the header summary

#### Scenario: A column's description is truncated into the grid's tooltip

- **WHEN** the columns grid renders a column whose description exceeds its cell
- **THEN** the description is truncated in the cell, with the full value reachable through the grid's
  tooltip, and stays within its column

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

#### Scenario: An ordering-key or partition column cannot be dropped

- **WHEN** the columns grid renders a column named by the table's ordering key, or the table's partition column
- **THEN** that row's action menu offers no delete action
- **AND** every other column's delete action is unaffected

#### Scenario: A partition column cannot be renamed

- **WHEN** the user opens the edit modal for the table's partition column
- **THEN** the Name field is disabled
- **AND** the display name, tag, description and sensitive fields remain editable

#### Scenario: The edit modal shows Nullable read-only

- **WHEN** the user opens the edit modal for a nullable column, and for a non-nullable one
- **THEN** the modal shows a Nullable switch that is disabled, on for the first and off for the second
- **AND** a change to any editable field still submits a patch that carries no nullable member

#### Scenario: A source declaring neither scan-metadata member states it is not scannable

- **WHEN** an `ACTIVE` **source** table whose definition declares neither `identity_column` nor `version_column` renders
- **THEN** the header summary states that the table is not scannable
- **AND** an `ACTIVE` source declaring the pair, and an enrichment, carry no such statement

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

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown regardless of permission, as the header's primary action, for every `ACTIVE` **source** table and for every `ACTIVE` **enrichment** table whose payload names a source table (see "Table detail Connect panel").
- The **JSON-editor toggle** SHALL be shown on every `ACTIVE` table regardless of permission, because there it opens a read-only view of the stored definition and writes nothing (see "An ACTIVE table's definition is readable as JSON"); on a `PENDING`/`FAILED` table it SHALL be shown only when `canModify`, because there it authors the schema (see "JSON editor for a table draft"). It follows that an `ACTIVE` table always presents at least one header action, whatever the viewer's permissions are and whether or not Connect can be offered for it.
- **Add rows** SHALL NOT be offered for an **enrichment** table whatever its `write` permission reports: those rows come from the enrichment process, so a hand-written insert is not a path this UI offers.
- For an `ACTIVE` table, **Add columns** (schema evolution) and **Add rows** (inserting rows) SHALL each be offered as its own standalone header button — **not** as items of a shared dropdown. **Add columns** SHALL be shown only when `canModify` and **Add rows** only when `canWrite`; when neither permission is held, neither button renders. Both SHALL render as neutral actions, never primary and never dependent on whether the other is present, so each keeps the same appearance whatever the viewer's other permissions are. **Add rows** is deliberately not the emphasized way to put data in the table — see "Table detail row writes".
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Managing who can do what on the table is **not** a header action: it lives in the **Access** tab, whose offer is decided by `canManageRoles` (see "Access tab lists a table's roles").
- Header controls SHALL be ordered **Delete table, Add columns, Add rows, Connect, copy JSON definition, JSON-editor toggle** — the **JSON-editor toggle last**, after the primary **Connect**, with the copy-definition control immediately before the toggle and present only while the JSON view is on (see "The displayed definition is copyable in one action"). **Connect** remains the header's only primary action, and it remains the last **action**; it is no longer the last control, because the two controls that follow it act on the view rather than on the table. The rule that replaces "primary action last" is therefore: **actions on the table come before Connect, view controls after it**, so a later header addition has a rule to follow rather than a precedent to guess at. While the JSON view of an `ACTIVE` table is on, only the copy-definition control and the toggle are rendered. A not-yet-`ACTIVE` table shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and materialize a table schema"; its own JSON-editor toggle is likewise the last control of its row, where no primary action precedes it.

Because the backend reports `permissions {write:false, modify:false}` for system tables, the write/modify-gated affordances (Add rows, Add columns, per-column edit/drop, inline rename, description edits) hide for system tables without a separate check. **Delete table** is gated on `FULL_ADMIN`, which the backend does not scope per-table, so it carries its own explicit `!table.system` check. The JSON-editor toggle is deliberately outside that set on an `ACTIVE` table: it mutates nothing, and a system table is exactly the table whose definition an operator most often needs to read as a document.

#### Scenario: Write-capable, not modify-capable

- **WHEN** a table reports `permissions {write:true, modify:false}`
- **THEN** the header shows an **Add rows** button and no **Add columns** button, and the per-column action column and inline rename are absent

#### Scenario: Modify-capable, not write-capable

- **WHEN** a table reports `permissions {write:false, modify:true}`
- **THEN** the schema-edit affordances and per-column action column are present, and the header shows an **Add columns** button and no **Add rows** button

#### Scenario: Neither capability hides the Add dropdown entirely

- **WHEN** a table reports `permissions {write:false, modify:false}`
- **THEN** neither **Add columns** nor **Add rows** is rendered, and no **Add** dropdown is rendered in their place either

#### Scenario: Add actions keep a fixed emphasis

- **WHEN** a table reports both permissions, and separately when it reports only one
- **THEN** **Add columns** and **Add rows** each render as a neutral action whenever present, and neither is promoted to primary by the other's absence
- **AND** **Connect** is the only primary action in the header

#### Scenario: Delete stays admin-only

- **WHEN** a non-system table reports edit permissions but the user is not `FULL_ADMIN`
- **THEN** the "Delete table" button is absent

#### Scenario: No header action manages access

- **WHEN** a `FULL_ADMIN` opens a non-system `ACTIVE` table's detail page
- **THEN** the header has no Manage access button, and access is managed from the Access tab

#### Scenario: Manage access is hidden for a system table even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail page
- **THEN** the header has no Manage access button, as on any table, while the Access tab remains offered for its read-side grants

#### Scenario: A system table still offers Connect

- **WHEN** a user opens an `ACTIVE` system table's detail page
- **THEN** **Connect** is present while **Add rows**, **Add columns**, and **Delete table** are all absent
- **AND** the JSON-editor toggle is present, since it writes nothing

#### Scenario: An enrichment table offers Connect but never Add rows

- **WHEN** a user opens an `ACTIVE` enrichment table's detail page and its payload names a source table
- **THEN** **Connect** is present as the header's primary action
- **AND** no **Add rows** action is present, whatever the table's `write` permission reports

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
- **THEN** the controls appear in the order Delete table, Add columns, Add rows, Connect, JSON-editor toggle — the toggle last, after the primary Connect
- **AND** with the JSON view on, only the copy-definition control and the toggle remain, the toggle last

#### Scenario: A not-yet-active table shows Save in their place

- **WHEN** the detail header renders for a `PENDING` or `FAILED` table and the user has `canModify`
- **THEN** **Save** is shown, and none of **Connect**, **Add columns**, or **Add rows** is

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor, opened via the header **Add rows** button. The popup is a **hand-check** — a way for an admin to confirm the table accepts the shape they expect — and SHALL be presented as such, not as the way a table is populated; a table is populated by a client writing to its row endpoint programmatically (see "Table detail Connect panel"). Opening the editor SHALL prefill it with a one-row JSON template whose keys are the table's declared columns' **physical source names** (not their exposed names, which the backend's row-insert endpoint does not accept), each mapped to a value matching that column's type (`0` for Integer/Long/Decimal, `false` for Boolean, `{}` for Object, `[]` for Array, `""` otherwise) rather than a bare empty array, so the example stays valid input for every column. The popup SHALL NOT be reachable for an **enrichment** table (see the gating requirement); where the template is built for one, it includes the grain key as a top-level field, since an enrichment row cannot join to its source without it. The **Insert rows** submit action SHALL be disabled while the editor's content does not parse as a JSON array, re-enabling as soon as it does; submitting invalid or non-array input SHALL additionally surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

The popup SHALL carry, above its editor, a statement of its purpose — that it inserts rows by hand for checking a schema, and that ongoing ingestion goes through the table's row endpoint — together with a **Write rows programmatically** action which closes the popup, discarding the editor's content, and opens the Connect panel on its **Write data** tab (see "Table detail Connect panel"). Both SHALL sit at the top of the popup body, above the editor and away from the submit controls, so a user who opened the popup for real ingestion is redirected before typing rather than after.

#### Scenario: The popup states that it is a hand-check

- **WHEN** the user opens the Add rows editor
- **THEN** the popup shows, above the editor, that it is for inserting rows by hand and that ongoing ingestion uses the row endpoint

#### Scenario: Opening Add rows prefills a type-shaped template

- **WHEN** the user opens the Add rows editor for a table with declared columns
- **THEN** the editor is prefilled with one row object keyed by each column's physical source name, with type-appropriate placeholder values

#### Scenario: Add rows template keys a renamed column by its source name

- **WHEN** a column's exposed name differs from its physical source name and the user opens Add rows
- **THEN** the template key for that column is its source name, not its exposed name

#### Scenario: Enrichment template includes the grain key

- **WHEN** the Add rows template is built for an enrichment table
- **THEN** it includes the grain key as a top-level field alongside the declared columns

#### Scenario: Insert rows is disabled while the JSON is invalid

- **WHEN** the editor's content is not valid JSON, or is valid JSON that is not an array
- **THEN** the Insert rows action is disabled
- **AND** it re-enables once the content becomes a valid JSON array

#### Scenario: Valid rows are inserted

- **WHEN** the user enters a valid JSON array of objects and submits
- **THEN** the rows are posted to the table and a success notification is shown

#### Scenario: Invalid rows JSON is rejected

- **WHEN** the user enters text that is not a JSON array
- **THEN** an error is shown and no request is issued

#### Scenario: Escalating from the editor to a script

- **WHEN** the user activates **Write rows programmatically** in the Add rows popup
- **THEN** the popup closes and the Connect panel opens with its **Write data** tab selected

### Requirement: Delete confirmation identifies the table by name

Every delete-table confirmation dialog — the catalog list's row delete action and the detail view's **Delete table** action — SHALL show the target table's name as its own labeled row in the dialog, in addition to the standard warning copy, so the two surfaces present identical confirmation content.

#### Scenario: Catalog delete confirmation shows the table name

- **WHEN** the user activates a catalog row's delete action
- **THEN** the confirmation dialog shows a Name row with that table's name

#### Scenario: Detail delete confirmation shows the table name

- **WHEN** the user activates the detail view's Delete table action
- **THEN** the confirmation dialog shows a Name row with that table's name, matching the catalog's confirmation content

### Requirement: System-owned tables are read-only

The catalog and detail views SHALL reflect the table's server-provided `system` flag. System-owned tables are seeded server-side and reject every modifying request (`409 table_is_system`), so the UI SHALL NOT offer modify actions for them: in the catalog the row's delete action SHALL be hidden and a System indicator SHALL be shown; in the detail view the delete-table / write-rows / add-columns actions and the per-column edit/drop actions and inline rename SHALL be suppressed, replaced by a read-only indicator. System tables SHALL remain fully viewable and navigable, including their column display names and descriptions.

The **read-side** controls are the exception, because the service accepts read grants and row policies on a system table, which carries the shared data a policy most often narrows: a `FULL_ADMIN` SHALL still be offered the Access tab on an `ACTIVE` system table, where **Get**, **Read**, the sensitive clearance and row limits are editable and **Write** and **Modify** are locked with the reason (see "Role drawer edits one role's access and row limit").

#### Scenario: System table in the catalog

- **WHEN** the catalog lists a table whose `system` flag is true
- **THEN** the row shows a System indicator
- **AND** the row's delete action is not offered

#### Scenario: System table detail is read-only

- **WHEN** the user opens a system table's detail page
- **THEN** the delete-table, write-rows, and add-columns actions are absent and a read-only indicator is shown
- **AND** the column grid offers no edit/drop actions and no inline editing
- **AND** the table, its columns, and their display names and descriptions remain viewable

#### Scenario: A system table's access can still be managed

- **WHEN** a `FULL_ADMIN` opens an `ACTIVE` system table's detail page
- **THEN** the Access tab is offered
- **AND** its drawer allows **Read**, the sensitive switch and a row limit and locks **Write** and **Modify**

### Requirement: Analytics table role capability model

The system SHALL expose, on `AppContext`, the capability inputs for Analytics tables: `isFullAdmin`
(true when authentication is disabled, or when `userInfo.roles` includes `FULL_ADMIN`), the existing
`isReadOnlyAdmin`, and `isEnableAuth`. The `AnalyticsTable` model SHALL carry an optional
`permissions` object supplied by the data-access service, with the boolean flags `get`, `read`,
`sensitive`, `write`, `modify` and `rows_restricted`: the calling identity's effective per-table privileges
and whether a row policy confines it. A hook `useAnalyticsTablePermissions(table?)` (`src/hooks/`) SHALL
derive:

- `canCreate` SHALL equal `isFullAdmin`.
- `canDelete` SHALL equal `isFullAdmin && !table.system`.
- `canManageRoles` SHALL equal `isFullAdmin`, including on a system table, because the read-side grants and row policies of a system table are manageable.
- `canWrite` SHALL equal `table.permissions.write` when present, otherwise `!isEnableAuth`.
- `canModify` SHALL equal `table.permissions.modify` when present, otherwise `!isEnableAuth`.
- `canChangeSensitive` SHALL equal `canModify && table.permissions.sensitive` when `sensitive` is present, otherwise `!isEnableAuth`.
- `isRowsRestricted` SHALL equal `table.permissions.rows_restricted` when present, otherwise `false`.

#### Scenario: Full admin can act on a non-system table

- **WHEN** authentication is enabled, the user is `FULL_ADMIN`, and a non-system table reports
  `permissions {write:true, modify:true, sensitive:true}`
- **THEN** `canCreate`, `canDelete`, `canManageRoles`, `canWrite`, `canModify`, and `canChangeSensitive` are all `true`

#### Scenario: Per-table write without modify

- **WHEN** a table reports `permissions {write:true, modify:false}` and the user is not `FULL_ADMIN`
- **THEN** `canWrite` is `true`, `canModify` is `false`, and `canCreate`/`canDelete`/`canManageRoles`
  are `false`

#### Scenario: System table exposes no edits, even for a full admin

- **WHEN** a system table reports `permissions {write:false, modify:false}` (as the backend does for
  every caller) and the user is `FULL_ADMIN`
- **THEN** `canWrite`, `canModify`, and `canDelete` are `false`, and `canManageRoles` stays `true` so the read-side grants remain manageable

#### Scenario: Modify without the clearance cannot change sensitivity

- **WHEN** a table reports `permissions {modify:true, sensitive:false}`
- **THEN** `canModify` is `true` and `canChangeSensitive` is `false`

#### Scenario: Missing permissions default safely

- **WHEN** a table omits `permissions` and authentication is enabled
- **THEN** `canWrite`, `canModify`, and `canChangeSensitive` are `false` and `isRowsRestricted` is `false`; **AND WHEN** authentication is disabled the first three are `true` and `isRowsRestricted` stays `false`

### Requirement: Tables catalog gates catalog-level actions to full admins

The Tables catalog view (`components/Analytics/Tables/TablesView.tsx`) SHALL render the "Create source"
and "Create enrichment" buttons and the per-row Delete action only when the user is `FULL_ADMIN`
(`canCreate` / `canDelete`). The existing per-row rule keeping Delete unavailable for system tables
SHALL be preserved. Read paths (listing and opening tables) SHALL be unaffected.

#### Scenario: Full admin sees catalog actions

- **WHEN** the catalog renders for a `FULL_ADMIN`
- **THEN** both create buttons and the row Delete action are present

#### Scenario: Non-admin sees a read-only catalog

- **WHEN** the catalog renders for a user who is not `FULL_ADMIN` (auth enabled)
- **THEN** neither create button nor the row Delete action is rendered

### Requirement: Table lifecycle status badge

The UI SHALL surface a table's lifecycle `status` (`PENDING`, `ACTIVE`, `FAILED`) with a status badge (an enum→label and enum→color-token mapping rendered as an uppercase rounded pill). The badge SHALL render `PENDING` as "Draft", `ACTIVE` as "Active", and `FAILED` as "Failed", using the theme color tokens (warning / success / error respectively). The badge SHALL appear in the table detail header and in the catalog grid. The UI SHALL NOT poll for status — status changes only in response to the user's own schema-definition submission, and the badge reflects the last fetched definition.

#### Scenario: Detail header shows the status badge

- **WHEN** the table detail view renders
- **THEN** a status badge for the table's current `status` is shown next to the title

#### Scenario: An active table reads as Active

- **WHEN** a table's `status` is `ACTIVE`
- **THEN** its badge renders the "Active" (success) state

### Requirement: Define and materialize a table schema

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (a single **Name** field, used as both the column's exposed name and its physical source name since the two are always equal at definition time, type, nullable, optional tag, optional display name, optional description, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared columns that can key a table, an optional partition (a temporal column + a day/month/year granularity), and an optional scan-metadata pair (`identity_column` and `version_column`); for an **enrichment**, its columns plus a grain key chosen from those of its source table's columns that can key a table. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, tag length, display-name length, and description length exactly as the create/add-columns editor validates today, against both the exposed-name and source-name uniqueness constraints (which the merged Name field satisfies identically).

The same document MAY instead be authored as JSON — see "JSON editor for a table draft" — in which case that requirement's seeding rule, save gate and submission sequence apply and the rules in this requirement's remaining paragraphs govern the column-by-column surface only.

The **display name** and **description** fields SHALL be optional and SHALL be presented inline on the column row alongside its other fields, with field labels rendered on the first row only, as the row's existing fields already are. A blank value SHALL be valid and SHALL be omitted from the submitted column, exactly as a blank tag is — the service treats an absent metadata field as "not set". A display name longer than 128 characters or a description longer than 1024 characters SHALL be rejected client-side with a per-row validation message and SHALL disable Save, because the service answers 422 for either (the same caps and the same message the per-column edit modal already applies).

An Array-typed column row SHALL offer an additional element-type selector, restricted to the non-array, non-object column types (no nested arrays or objects). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column. An Object-typed row's Nullable control SHALL be disabled and forced off in the same way, because the backend rejects a nullable object column (the store has no nullable form of its JSON type). Retyping a row to Object SHALL switch its Nullable off.

For a **source** table, the Partition column field's label SHALL carry an info affordance whose text includes the fact that only non-nullable Date/Timestamp-typed columns are selectable, since that restriction is not otherwise visually obvious; the affordance and the rest of its text follow "Table schema keys are explained where they are chosen and where they are read". The Granularity field SHALL be rendered only once a partition column is selected; deselecting the partition column (including indirectly, by retyping the selected column away from Date/Timestamp) SHALL also clear any chosen granularity.

The key fields SHALL offer only columns the backend accepts as a key, so that a rejection it always answers (422 `validation_error`) cannot be reached from the surface. The **Ordering key** SHALL offer the declared columns that are non-nullable and not `Object`-typed. The **Partition column** SHALL offer the declared `Date` and `Timestamp` columns that are non-nullable; a sensitive column remains eligible, because the backend does not reject it. An enrichment's **Grain key** SHALL offer its source table's columns that are not `Object`-typed. A column row can still be declared nullable or `Object`; it is only not offered as a key.

For a **source** table only, the surface SHALL offer two additional optional selects — **Identity column** and **Version column** — the pair the governed incremental scan pages a source by. An **enrichment** SHALL offer neither (the backend rejects either member for an enrichment with 422). The Identity column options SHALL be the declared columns that are non-nullable and not sensitive; the Version column options SHALL be that same set narrowed to `Timestamp`-typed columns (`Date` SHALL NOT be offered — the backend requires `timestamp`). The column chosen as the Identity column SHALL NOT be offered as the Version column, and the column chosen as the Version column SHALL NOT be offered as the Identity column, so one column can never fill both roles; clearing either selection offers its column again in the other select. Both labels SHALL carry an info affordance stating that these values are promises the service does not verify (the version is assigned at ingest, monotonic, and never backdated; the identity is unique per row) — see "Table schema keys are explained where they are chosen and where they are read" for the affordance and the rest of its text.

Because the scan requires **both** members and the backend accepts one alone — producing a table that is permanently unscannable, since `POST /v1/tables/{name}/schema` answers 409 once the table is `ACTIVE` and no `PATCH` member sets the pair — the surface SHALL treat the pair as all-or-nothing: while exactly one of the two is chosen, Save SHALL be disabled and the empty field SHALL show a validation message naming the other as required alongside it. Choosing neither SHALL be valid and SHALL leave the table unscannable, which is the correct declaration for a source whose row identity is its whole ordering key.

A key selection — the Ordering key, the Partition column, the Identity column and the Version column — SHALL be cleared when the column it references stops qualifying under that field's own rule — removed, retyped, or flipped to nullable or sensitive in the column rows — so the submission can never carry a stale or now-invalid column name. When the referenced column is renamed, the selection SHALL follow it to the new name, in all four fields alike, so that none keeps a name that no longer matches a column; a rename to a blank name SHALL clear the selection. Clearing a Partition column SHALL also clear its granularity. For a `FAILED` table, both selects SHALL be seeded from the values the definition already stores, because an omitted member leaves any stored value unchanged rather than clearing it; when the definition stores either member, both selects SHALL be required (the pair cannot be cleared by re-posting).

While the column-by-column surface is the active one, submitting the schema (a header **Save** action) SHALL send the whole document via `defineTableSchema` (`POST /v1/tables/{name}/schema`) and SHALL send no other request — that surface has no `description` or `tag_order` field, so a save from it can never change catalog metadata. `defineTableSchema` defines the schema **and** materializes the table in the same call — there is no separate save-draft step, and no way to persist an incomplete schema. Each submitted column SHALL carry `display_name` and `description` only when the corresponding field is non-blank, and SHALL omit either key otherwise. The submitted payload SHALL carry `identity_column`/`version_column` only when chosen, and SHALL omit either key when unset. Save SHALL be disabled until the schema is complete for its kind (a source needs at least one valid column, a non-empty ordering key, and a complete-or-absent scan-metadata pair; an enrichment needs a grain key), since the backend rejects an incomplete submission (422) without persisting it. While the draft is unchanged the header offers no Save to disable — see "A changed table draft's header offers Discard and Save", which also states that this completeness gate governs the column-by-column surface only. On success the view SHALL refresh showing the table `ACTIVE` with its live column surface. On a backend (ClickHouse) failure the table becomes `FAILED`; the detail view SHALL present the same schema-definition surface with an indication that activation failed, allowing the user to adjust the schema and resubmit. While the table is not `ACTIVE`, the write-rows action SHALL NOT be offered.

#### Scenario: Saving from the column form sends only the schema request

- **WHEN** the column-by-column surface is the active one and the user, having edited it into a complete draft, saves
- **THEN** `defineTableSchema` is sent and `updateTable` is not sent

#### Scenario: Save is gated on a complete schema

- **WHEN** the author has edited a draft's column-by-column surface and a source table's schema still has no ordering key (or no columns), or an enrichment's schema still has no grain key
- **THEN** the Save action the changed header offers is disabled
- **AND** once the schema is complete the Save action is enabled

#### Scenario: Save defines and activates the table

- **WHEN** the user submits a `PENDING` table's complete schema and the request succeeds
- **THEN** `defineTableSchema` is sent and the view refreshes showing the table as `ACTIVE` with its live column surface

#### Scenario: Failed activation can be retried

- **WHEN** a table is `FAILED`
- **THEN** the detail view shows the schema-definition surface with a failure indication
- **AND** the user can adjust the schema and submit again

#### Scenario: Enrichment schema hardcodes cardinality

- **WHEN** an enrichment schema is submitted
- **THEN** the payload carries cardinality `zero_or_one` and no cardinality control is rendered

#### Scenario: Array column requires an element type

- **WHEN** the user sets a column row's type to Array and leaves its element type unset
- **THEN** the row shows a validation error and Save is disabled
- **AND** choosing an element type (a non-array, non-object type) clears the error

#### Scenario: Array column cannot be nullable

- **WHEN** a column row's type is Array
- **THEN** its Nullable control is disabled and shows off
- **AND** the built column payload does not send `nullable: true` for that row

#### Scenario: Object column cannot be nullable

- **WHEN** a column row's type is Object
- **THEN** its Nullable control is disabled and shows off
- **AND** the built column payload does not send `nullable: true` for that row
- **AND** a row that had Nullable on and is then retyped to Object shows it off

#### Scenario: A type-specific column keeps every row aligned

- **WHEN** a row below the first is typed Array or enum
- **THEN** every row reserves that control's column, empty in the rows whose type does not use it
- **AND** the column's label is shown on the first row only, alongside the other field labels

#### Scenario: A column row offers display name and description

- **WHEN** a `PENDING` table's schema-definition surface renders its column rows
- **THEN** each row offers an optional Display name field and an optional Description field alongside its other fields
- **AND** only the first row shows the two field labels

#### Scenario: Authored display name and description are submitted

- **WHEN** the user fills a column's Display name with "Total tokens" and its Description with "Prompt plus completion tokens" and saves a complete schema
- **THEN** that column in the submitted payload carries `display_name` "Total tokens" and `description` "Prompt plus completion tokens"

#### Scenario: Blank display name and description are omitted

- **WHEN** the user leaves a column's Display name and Description empty (or types only whitespace) and saves
- **THEN** that column in the submitted payload carries neither a `display_name` nor a `description` key

#### Scenario: Over-cap display name or description blocks Save

- **WHEN** a column row's Display name exceeds 128 characters, or its Description exceeds 1024 characters
- **THEN** that field shows a length validation message and Save is disabled
- **AND** shortening the value within its cap clears the message and re-enables Save

#### Scenario: A FAILED table seeds the authored display name and description

- **WHEN** the schema-definition surface renders a `FAILED` table whose stored definition has columns carrying `display_name` and `description`
- **THEN** each column row is seeded with those values, so resubmitting does not silently drop them

#### Scenario: Partition column restriction is explained via a tooltip

- **WHEN** a source table's schema-definition surface renders
- **THEN** the Partition column field's label carries a focusable info affordance
- **AND** its hint text states that only non-nullable Date/Timestamp columns are selectable

#### Scenario: Granularity is hidden until a partition column is chosen

- **WHEN** no partition column is selected
- **THEN** the Granularity field is not rendered
- **AND** selecting a partition column reveals it

#### Scenario: Retyping the selected partition column clears granularity too

- **WHEN** the column currently selected as the partition column is retyped away from Date/Timestamp
- **THEN** the partition column selection is cleared
- **AND** the previously chosen granularity is cleared, and the Granularity field is hidden again

#### Scenario: Scan-metadata selects are offered for a source only

- **WHEN** a `PENDING` **source** table's schema-definition surface renders
- **THEN** an Identity column and a Version column select are shown, each optional and each with an info affordance on its label
- **AND** a `PENDING` **enrichment** table's surface shows neither

#### Scenario: Scan-metadata options are restricted to columns the scan can page by

- **WHEN** the declared column rows include a non-nullable `timestamp`, a nullable `timestamp`, a sensitive `timestamp`, a non-nullable `date`, and a non-nullable `string`
- **THEN** the Identity column options are the non-nullable, non-sensitive columns (the `timestamp`, the `date`, and the `string`)
- **AND** the Version column options are only the non-nullable, non-sensitive `timestamp` column

#### Scenario: Declaring both members submits both

- **WHEN** the user chooses an Identity column and a Version column and submits
- **THEN** Save is enabled and the payload carries both `identity_column` and `version_column`

#### Scenario: Declaring neither member is valid

- **WHEN** the user leaves both scan-metadata selects empty and the rest of the source schema is complete
- **THEN** Save is enabled and the payload carries neither `identity_column` nor `version_column`

#### Scenario: Declaring exactly one member blocks Save

- **WHEN** the user chooses an Identity column and leaves the Version column empty (or the reverse)
- **THEN** Save is disabled and the empty field shows a validation message naming the other member as required alongside it
- **AND** clearing the chosen one, or choosing the missing one, re-enables Save

#### Scenario: A scan-metadata selection is cleared when its column stops qualifying

- **WHEN** the column currently chosen as the Version column is retyped away from `Timestamp`, removed, or flipped to nullable or sensitive
- **THEN** the Version column selection is cleared, so the submission cannot carry a stale or invalid column name

#### Scenario: The Ordering key offers only columns that can key a table

- **WHEN** the declared column rows include a nullable `string`, a non-nullable `string`, and a non-nullable `object`
- **THEN** the Ordering key options are only the non-nullable `string`

#### Scenario: The Partition column offers only non-nullable temporal columns

- **WHEN** the declared column rows include a non-nullable `timestamp`, a nullable `timestamp`, a sensitive non-nullable `date`, and a non-nullable `string`
- **THEN** the Partition column options are the non-nullable `timestamp` and the sensitive non-nullable `date`

#### Scenario: An enrichment's Grain key excludes Object columns of its source

- **WHEN** an enrichment's source table has a `string` column and an `object` column
- **THEN** the Grain key options include the `string` column and exclude the `object` column

#### Scenario: An Ordering key or Partition selection is dropped when its column stops qualifying

- **WHEN** the column chosen in the Ordering key or as the Partition column is flipped to nullable, or the Ordering key's column is retyped to `object`
- **THEN** that selection is removed, and the removed Partition column also clears its granularity
- **AND** the submission carries neither the stale key nor the stale granularity

#### Scenario: Renaming a column carries every selection that references it

- **WHEN** a column chosen as the Ordering key, the Partition column, the Identity column or the Version column is renamed
- **THEN** each of those fields shows the new name and keeps its selection
- **AND** the Ordering key shows no tag for the old name

#### Scenario: Renaming a selected column to a blank name clears the selection

- **WHEN** the name of a column chosen in any of the four key fields is cleared to blank
- **THEN** that selection is cleared

#### Scenario: Identity and Version never offer the same column

- **WHEN** a column is chosen as the Identity column, and it is also a non-nullable, non-sensitive `timestamp`
- **THEN** the Version column options do not include it
- **AND** clearing the Identity column offers it as a Version column again
- **AND** choosing a Version column removes it from the Identity column options in the same way

#### Scenario: A FAILED table's stored pair is seeded and cannot be cleared

- **WHEN** the schema-definition surface renders a `FAILED` source whose definition already stores `identity_column` and `version_column`
- **THEN** both selects are seeded with those stored values
- **AND** both are required, because omitting a member on re-post leaves the stored value unchanged rather than clearing it

### Requirement: Table schema keys are explained where they are chosen and where they are read

Every physical-key field of a table SHALL carry an info affordance on its label, on both surfaces that
present it: the schema-definition surface of a `PENDING`/`FAILED` table, and the read-only
schema-metadata summary of an `ACTIVE` table. The fields are **Ordering key**, **Partition column**,
**Granularity**, **Identity column** and **Version column** for a source, and **Grain key** for an
enrichment.

Each hint SHALL lead with what the choice gives the reader, and SHALL state its restrictions after
that, in language that does not require knowledge of the storage engine: no engine, part, granule, or
SQL-clause vocabulary. Each hint SHALL carry at least the following, and SHALL NOT contradict it:

| Field | The hint SHALL state |
| --- | --- |
| Ordering key | Rows are stored in this order, and filtering or sorting by the key's leading columns reads only part of the table; the most-filtered columns belong first; eligible columns are non-empty and not Object |
| Partition column | Rows are grouped into time chunks and a query filtered on this column skips the chunks it does not cover; most tables need no partition; only non-empty Date and Timestamp columns are eligible |
| Granularity | How much time one chunk covers, and that too many small chunks read slower rather than faster |
| Identity column | With Version column, it lets pipelines read the table in batches without handling a row twice; the value must differ in every row, uniqueness is not validated, and repeated values cause skipped rows; eligible columns are non-empty and not sensitive |
| Version column | It is how a pipeline tells which rows are new since its last pass; the value is expected at write time and must never move backwards, is not validated, and a backdated value causes missed rows; eligible columns are non-empty, non-sensitive Timestamp columns |
| Grain key | It links this table to its source table, a row attaches to every source row carrying the same value, and only one row is kept per value — a repeated key replaces the previous row; Object columns are not eligible |

On the schema-definition surface the key fields SHALL be grouped under a **Keys** sub-header carrying a
single note stating that the keys are set once, when the table is created, and are fixed afterwards.
That statement SHALL appear only in the group note, and SHALL NOT be repeated in the individual hints.
The `ACTIVE` summary SHALL NOT carry the note — its values are already read-only.

The info affordance SHALL be a focusable control whose accessible name is the hint text, so the hint is
reachable by keyboard and addressable by assistive technology; the icon inside it SHALL NOT contribute a
competing name. A non-focusable icon SHALL NOT be used for this purpose anywhere on either surface.

#### Scenario: Every key field on the draft surface is explained

- **WHEN** a `PENDING` **source** table's schema-definition surface renders with a partition column
  chosen
- **THEN** the Ordering key, Partition column, Granularity, Identity column, and Version column labels
  each carry an info affordance
- **AND** a `PENDING` **enrichment** table's surface carries one on its Grain key label

#### Scenario: The one-time nature of the keys is stated once

- **WHEN** a `PENDING` table's schema-definition surface renders
- **THEN** its key fields appear under a Keys sub-header whose note states that the keys are set at
  creation and fixed afterwards
- **AND** no individual key hint repeats that statement

#### Scenario: An active table's key summary carries the same explanations

- **WHEN** an `ACTIVE` source table with an ordering key, a partition, and a scan-metadata pair renders
- **THEN** each summarized key's label carries the same info affordance as the draft surface
- **AND** an `ACTIVE` enrichment table's grain key label carries its own
- **AND** neither summary shows the Keys group note

#### Scenario: A hint is reachable by keyboard and named for assistive technology

- **WHEN** a key field's info affordance renders on either surface
- **THEN** it is a control that can be focused by keyboard, and its accessible name is the hint text

#### Scenario: Key hints state which columns are eligible

- **WHEN** the Ordering key, Partition column or Grain key hint renders
- **THEN** the Ordering key hint states that eligible columns are non-empty and not Object
- **AND** the Partition column hint states that only non-empty Date and Timestamp columns are eligible
- **AND** the Grain key hint states that Object columns are not eligible

### Requirement: A column may be declared with an enum type and a closed, ordered value list

The column-type vocabulary the schema editors offer SHALL include **enum**, a string column whose value set is
closed. It SHALL be offered wherever a column is declared — the schema-definition surface of a `PENDING`/`FAILED`
table and the "Add columns" popup of an `ACTIVE` one — and for both **source** and **enrichment** tables, since
the service accepts it on either.

A column row typed enum SHALL offer a **required** value-list control in place of the element-type control an
Array row offers, laid out as a column of the whole editor on the terms stated for a type-specific control in
"Define and materialize a table schema". The control SHALL present the declared values as an **ordered** list the user can reorder,
because a value's position in the list becomes its numeric id in the physical type and the column therefore
sorts in **declared order, not alphabetically**. The control SHALL state that ordering consequence, since
nothing about a list of values otherwise suggests it. The statement SHALL sit beneath that enum row's own value
list, not once for the whole column grid, so it reads as being about that column's values; a grid with no enum
row SHALL carry no such statement.

Each value SHALL be validated client-side against the service's rules, with a per-value message and Save
disabled while any is violated:

- at least **1** and at most **512** values
- each value non-blank after trimming
- each value at most **64** characters
- values **distinct after trimming** — two entries differing only in surrounding whitespace collide

The value-list popup SHALL refuse a value longer than 64 characters with the same message as the column row. Its
list-wide rules (at least one value, distinct values) stay on the column row, which decides whether Save is enabled.

Values SHALL be submitted **trimmed**, which is how the service stores and materializes them. A value MAY
contain any characters, including commas and quotes, so the control MUST NOT treat any character as a
separator.

`enum_values` SHALL be submitted **if and only if** the column's type is enum: a column of any other type
carrying the key is rejected (422), and an enum column without it is rejected the same way. Retyping a row away
from enum SHALL discard the values it had collected, exactly as retyping away from Array discards its element
type, so a stale domain can never be submitted with a column that no longer has that type.

Enum SHALL NOT be offered as an Array column's **element type** — the service rejects an enum element. Enum
SHALL NOT appear among the **Version column** or **Partition column** candidates, both of which require a
temporal type. Enum SHALL be selectable as an **ordering key** entry, as an **Identity column**, and as an
enrichment's **grain key**, on the same terms as any other non-nullable, non-sensitive scalar.

#### Scenario: Enum is offered as a column type

- **WHEN** the user opens the column-type selector on a source or an enrichment table's column row
- **THEN** enum is among the offered types

#### Scenario: Choosing enum reveals a required value list

- **WHEN** the user sets a column row's type to enum
- **THEN** the row offers a required value-list control
- **AND** Save is disabled while the list is empty

#### Scenario: A mid-list enum row does not repeat the value column's label

- **WHEN** a row below the first is typed enum
- **THEN** its value list renders without a second copy of the column's label beside the control
- **AND** the column's label stays on the first row, whose value cell is empty

#### Scenario: The ordering note sits beneath the enum row's own value list

- **WHEN** a column row is typed enum
- **THEN** a note that the column sorts in declared order, not alphabetically, is shown beneath that row's value list
- **AND** the other fields of that row stay aligned with its other controls

#### Scenario: A grid without an enum row has no ordering note

- **WHEN** no column row is typed enum
- **THEN** no statement about declared-order sorting is shown

#### Scenario: Declared values are submitted in the authored order

- **WHEN** the user declares an enum column with the values `low`, `medium`, `high` in that order and saves a
  complete schema
- **THEN** that column in the submitted payload carries `enum_values` `["low", "medium", "high"]` in that order

#### Scenario: Reordering the list changes what is submitted

- **WHEN** the user reorders a declared enum column's values so that `high` precedes `low`
- **THEN** the submitted `enum_values` carries the new order

#### Scenario: An over-long value is refused in the popup

- **WHEN** the user enters a value longer than 64 characters in the value-list popup
- **THEN** the entry shows the same length message as the column row and the popup's Apply is disabled
- **AND** a value of 64 characters, or a single character, is accepted

#### Scenario: A blank or over-long value blocks Save

- **WHEN** an enum column's value list holds a blank entry, or an entry longer than 64 characters
- **THEN** that entry shows a validation message and Save is disabled
- **AND** correcting the entry clears the message and re-enables Save

#### Scenario: Duplicate values after trimming block Save

- **WHEN** an enum column's value list holds `failed` and `failed ` (with a trailing space)
- **THEN** a validation message reports the collision and Save is disabled

#### Scenario: Values are submitted trimmed

- **WHEN** the user declares an enum value as ` running ` and saves
- **THEN** the submitted `enum_values` carries `running`

#### Scenario: More than 512 values blocks Save

- **WHEN** an enum column's value list exceeds 512 entries
- **THEN** a validation message reports the cap and Save is disabled

#### Scenario: Retyping away from enum drops the collected values

- **WHEN** a column row typed enum with declared values is retyped to string
- **THEN** the value-list control is no longer offered
- **AND** the submitted column carries no `enum_values`

#### Scenario: Enum is not offered as an array element type

- **WHEN** a column row is typed Array and the user opens its element-type selector
- **THEN** enum is not among the offered element types

#### Scenario: An enum column is not a version-column candidate

- **WHEN** a source table declares an enum column and the user opens the Version column selector
- **THEN** that column is not offered
- **AND** it is offered in the Ordering key and Identity column selectors

#### Scenario: An enum column can be added to a materialized table

- **WHEN** the user adds an enum column with a declared value list to an `ACTIVE` table and submits
- **THEN** the schema patch's `add` entry carries the column's type and its `enum_values`
- **AND** on success the detail view refreshes from the server

### Requirement: An enum column's declared domain is immutable once the column exists

The service refuses to change a column's `enum_values` after the column exists: a schema-patch `update` entry
carrying the key is rejected with 422 rather than ignored, because widening a ClickHouse enum rewrites the
column and fails outright on any stored row holding a value the new domain drops.

The per-column **edit** modal SHALL therefore show an enum column's declared values **read-only**, and the patch
it submits SHALL NOT carry `enum_values` under any circumstance. Presenting the domain rather than omitting it
is the point: an operator who cannot find the values in the modal has no way to learn that the column has a
closed domain at all, and the read-only presentation states both facts at once. The modal SHALL say that the
domain cannot be changed and that changing it means dropping the column and adding it again — the only path the
service supports — so the restriction does not read as a gap in the console.

A **rename** SHALL remain available on an enum column on the same terms as any other column; the service keeps
the domain and the type intact across one.

The columns grid SHALL make an enum column's declared values reachable without opening the edit modal, so the
domain is discoverable from the schema at a glance.

#### Scenario: The edit modal shows the domain read-only

- **WHEN** the user opens the edit modal on an enum column
- **THEN** its declared values are shown and cannot be edited
- **AND** the modal states that the domain cannot be changed and that a change means dropping and re-adding the
  column

#### Scenario: An edit patch never carries the domain

- **WHEN** the user changes an enum column's display name in the edit modal and submits
- **THEN** the schema patch carries the metadata `update` entry
- **AND** it carries no `enum_values`

#### Scenario: An enum column can still be renamed

- **WHEN** the user renames an enum column
- **THEN** the rename patch is sent
- **AND** the refreshed column keeps its type and its declared values

#### Scenario: The declared domain is reachable from the columns grid

- **WHEN** the columns grid renders an enum column
- **THEN** its declared values are reachable from the grid without opening the edit modal

### Requirement: Table metadata editing (description and tag order)

The **catalog list's** row action menu SHALL let the user edit a table's catalog metadata — its `description` and its per-table `tag_order` — in any status, via `updateTable` (`PUT /v1/tables/{name}`). `tag_order` SHALL be presented as a reorderable list of the distinct tags currently declared on the table's columns, and the resulting ordered list of tag names SHALL be sent to the backend; an empty order SHALL clear it and an unchanged order SHALL be left as-is (merge-patch semantics). On success the catalog SHALL refresh from the server. This surface SHALL NOT be offered for system-owned tables.

The catalog list SHALL remain the only surface that offers this editor, and the table detail view SHALL NOT present a description or tag-order editing surface for an `ACTIVE` table. For a `PENDING`/`FAILED` table there is one exception, which exists because that popup builds its reorder list from the tags declared on the table's **existing** columns and a draft has none: the detail view's draft JSON document (see "JSON editor for a table draft") SHALL carry `description` and `tag_order`, and a save from that surface SHALL submit them through the same `updateTable` endpoint before the schema request, as "Saving a table draft as metadata then schema" specifies.

#### Scenario: Description is edited via the table update endpoint

- **WHEN** the user activates a row's edit action, changes the table description, and submits
- **THEN** `updateTable` is sent with the new description and the catalog refreshes

#### Scenario: Tag order is reordered and saved

- **WHEN** the user reorders the table's column tags and submits
- **THEN** `updateTable` is sent with the ordered `tag_order` list and the catalog refreshes

#### Scenario: A draft's metadata is submitted from the detail view, an active table's is not

- **WHEN** a `PENDING`/`FAILED` table is saved from the detail view's JSON editor with a `description` and a `tag_order` in the document
- **THEN** `updateTable` is sent carrying those two members
- **AND** the detail view of an `ACTIVE` table offers no description or tag-order editing surface

### Requirement: Public Analytics endpoints are surfaced to the table detail page

The system SHALL expose two optional environment variables carrying the endpoints an external client would call: `ANALYTICS_PUBLIC_URL` for the REST surface and `ANALYTICS_FLIGHT_SQL_PUBLIC_URL` for the Arrow Flight SQL surface. Both SHALL be read server-side in the table detail page (`app/[lang]/tables/[id]/page.tsx`) and passed to the detail view; neither SHALL be added to the `FeatureFlags` object, which carries booleans consumed app-wide. When a variable is unset or blank the detail view SHALL receive an empty value for it.

The Flight endpoint SHALL NOT be derived from the REST one. They are unrelated addresses — a different scheme, a separately exposed port, and commonly a different host — so deriving one from the other would produce a confidently wrong endpoint rather than an obviously unset one.

#### Scenario: Configured endpoints reach the view

- **WHEN** `ANALYTICS_PUBLIC_URL` and `ANALYTICS_FLIGHT_SQL_PUBLIC_URL` are set and the table detail page renders
- **THEN** the detail view receives both values

#### Scenario: An unset endpoint yields a blank value

- **WHEN** either variable is not set
- **THEN** the detail view receives an empty value for it rather than `undefined` leaking into a snippet

#### Scenario: Each endpoint is independent

- **WHEN** only `ANALYTICS_PUBLIC_URL` is set
- **THEN** the REST snippets carry that endpoint and the Flight snippets still carry their own placeholder

### Requirement: Table detail Connect panel

The Table detail page SHALL offer a **Connect** header action, shown only while the table is `ACTIVE`, and otherwise regardless of the viewer's per-table `write`/`modify` permissions. It SHALL be offered for a table of type **source**, and for a table of type **enrichment** whose payload names a source table: an enrichment is not queryable under its own name, but its columns are readable as table-qualified fields on its source table, and its detail page is the one place a reader is shown how. An enrichment whose payload names no source table SHALL offer no Connect action, since no runnable query can be generated for it. It SHALL NOT be shown for a `PENDING` or `FAILED` table, which has no materialized table to connect to. **Connect** SHALL be the header's primary action, so an `ACTIVE` table always presents exactly one primary action whatever the viewer's permissions are.

Activating **Connect** SHALL open a right-side overlay panel titled `Connect to <table name>`, dismissible by its close control, by the `Escape` key, and by activating the backdrop. The panel SHALL overlay the page rather than reflow it, and SHALL occupy the full viewport width below the layout's tablet breakpoint.

The panel SHALL be a modal dialog for assistive technology: it SHALL carry a dialog role and modal state with an accessible name matching its title, SHALL move focus into the panel on open, SHALL confine `Tab` cycling to the panel while open, and SHALL return focus to the **Connect** button on close.

The panel body SHALL be organised by **task, not by technology**: for a table a client can write, two tabs — **Write data** and **Read data** — with **Write data** selected by default from every entry point. Writing and reading are done by different people and carry different authorization, so each tab SHALL carry its own authorization statement and its own language examples, and neither SHALL require reading the other.

For a **system** table and for an **enrichment** table the panel SHALL offer the read path only: no **Write data** tab, no write snippets, and no write-role list. It SHALL state which reason applies. A system table is fed out of band and its row endpoint refuses every write regardless of any access list, so a write tab would teach a path that cannot succeed. An enrichment's rows are produced by the enrichment process, which is the same reason this UI offers no hand-written insert for one. In neither case SHALL the panel request the table's access lists, which cannot authorize anything there.

The API-key instruction SHALL be shown once at the top of the panel rather than duplicated inside each tab, and SHALL state that every example the panel shows takes the same key. It SHALL NOT be phrased in terms of the two tabs, since the read-only variants render no tabs at all.

That shared block SHALL carry the key **and nothing else**. An endpoint belongs to the surface that reads it: the REST base URL SHALL be shown as its own setup block above **each** REST example — Python and `curl` alike — and the Flight endpoint above the Flight example, so no example asks the reader to set a variable it never uses, and none asks them to find a variable it does. The Python examples SHALL additionally keep their endpoint default inline, so a copied script still runs when the export is skipped; `curl`, which can carry no default, depends on it.

The **Write data** tab SHALL cover posting rows to this table in Python (standard library only) and as a `curl` command. The **Read data** tab SHALL cover querying this table in Python, as a `curl` command, and over Arrow Flight SQL with pandas and the ADBC driver. Flight SQL SHALL appear only under Read, because that endpoint rejects write statements, and the panel SHALL say so. For Flight SQL the panel SHALL state that it needs its own Python packages.

Each code block SHALL offer a copy action that places that block's exact text on the clipboard and announces the result to assistive technology.

The panel assumes the deployment has API-key authentication and the Flight endpoint enabled. Both are backend configuration this application cannot read; the panel SHALL neither detect nor caveat either.

#### Scenario: Connect is offered on an active table

- **WHEN** the detail view renders an `ACTIVE` table
- **THEN** a **Connect** header action is present, rendered as the header's primary action

#### Scenario: An enrichment table offers Connect with the read path only

- **WHEN** the panel opens for an `ACTIVE` enrichment table
- **THEN** no **Write data** tab, write snippet, or write-role list is present, and the read path is shown with a statement of why it is the only one
- **AND** no request is made for the table's access lists

#### Scenario: An enrichment table offers no Connect action

- **WHEN** the detail view renders an `ACTIVE` enrichment table whose payload names no source table, the only case in which no runnable query can be generated for it
- **THEN** no **Connect** action is present
- **AND** the schema and catalog actions its permissions allow are still present

#### Scenario: Connect is not offered before materialization

- **WHEN** the detail view renders a `PENDING` or `FAILED` table
- **THEN** no **Connect** action is present

#### Scenario: Connect is offered to a viewer with no write or modify permission

- **WHEN** an `ACTIVE` table reports `permissions {write:false, modify:false}`
- **THEN** the **Connect** action is still present, even though no **Add rows** or **Add columns** action is

#### Scenario: Opening the panel

- **WHEN** the user activates **Connect** on a source table a client can write
- **THEN** a side panel titled `Connect to <table name>` opens with the **Write data** and **Read data** tabs, and **Write data** is the selected tab

#### Scenario: The panel takes and returns focus

- **WHEN** the panel opens
- **THEN** focus moves into the panel and `Tab` cycles within it
- **AND WHEN** the panel is closed by any of its dismissal routes
- **THEN** focus returns to the **Connect** button

#### Scenario: A system table offers the read path only

- **WHEN** the panel opens for a `system` table
- **THEN** no **Write data** tab, write snippet, or write-role list is present, and the read path is shown with a statement of why it is the only one
- **AND** no request is made for the table's access lists

#### Scenario: Each tab carries only its own authorization

- **WHEN** the **Write data** tab renders
- **THEN** it names the roles a key must carry to write to this table, and states no read-access rule
- **AND WHEN** the **Read data** tab renders
- **THEN** it states that reading is not scoped per table, and names no write role

#### Scenario: Flight SQL appears only under Read

- **WHEN** the **Read data** tab renders
- **THEN** a Flight SQL example is present, with a statement that the endpoint rejects write statements
- **AND WHEN** the **Write data** tab renders
- **THEN** no Flight SQL example is present

#### Scenario: Dismissing the panel

- **WHEN** the panel is open and the user activates its close control, presses `Escape`, or activates the backdrop
- **THEN** the panel closes and the detail page is unchanged

#### Scenario: Copying a snippet

- **WHEN** the user activates a code block's copy action
- **THEN** that block's exact text is placed on the clipboard and a success notification is shown

### Requirement: Connect panel snippets are generated from the table schema

Every snippet the Connect panel renders SHALL be generated from the table currently being viewed, so that a copied snippet runs against that table without editing. Snippets SHALL be derived from the table's declared columns; a column whose physical name begins with `_` SHALL be omitted, because the platform sets those and a row naming one is rejected. The exclusion SHALL hold for the read projection as well as the write snippets, so no part of the panel names a platform column.

**Write snippets** SHALL key each row field by the column's **physical source name**, which is what the row-insert endpoint accepts. The panel SHALL NOT explain that identifier or contrast it with the exposed name: the two are equal on every table this application can produce — its column editor fills both from one input, and a rename sets both — so the distinction is invisible here and naming it would teach a concept the reader cannot act on.

Each field's value SHALL be a mock literal of the column's declared type, chosen so the row is valid input:

- `uuid` — a well-formed UUID literal
- `string` — a quoted example string
- `integer` / `long` — a whole number
- `decimal` — a **quoted** numeric string, so the digits reach the store exactly rather than through a JSON float
- `boolean` — a boolean literal in the snippet's own syntax (`True` in Python, `true` in JSON and shell)
- `date` — a `YYYY-MM-DD` literal
- `timestamp` — an ISO-8601 literal with a `T` separator and an explicit zone (`2026-01-15T10:00:00.000Z`), the only form the insert path accepts; a space separator, a missing zone, a bare date, or an epoch number is rejected with `422 validation_error`
- `object` — an empty object literal
- `array` — a literal array of two values shaped by the column's `element_type`
- `enum` — **one of the column's own declared values** (its first), never a generic example string: the domain is closed and the server itself refuses a value outside it, so a placeholder literal is a row the reader cannot insert

A nullable column SHALL still receive a value rather than a null, so the snippet stays a working example.

**Read snippets** SHALL carry an explicit `LIMIT` no greater than the REST maximum, and SHALL project a **key subset** of the table rather than every column, so the example teaches the shape of a query instead of the width of the table:

- For a **source** table the projection SHALL be the table's **ordering-key columns** — the set a reader filters, sorts, and joins on — less any entry naming a `_`-prefixed platform column. `ordering_key` reports **physical source names**, while the query surface binds a `SELECT` list against the **exposed** name each column is published under, so each entry SHALL be matched to its declared column by source name and projected by that column's exposed name. The two spellings are equal on every table this application creates; on a table created through the API with a differing pair, projecting the physical name is an unknown-column error. An entry no declared column matches SHALL be projected as reported, since nothing better is known about it.
- For an **enrichment** table the query SHALL read `FROM` the enrichment's **source table**, never from the enrichment's own name, since an enrichment is not queryable under its own name. Its projection SHALL be the enrichment's **grain key**, which is a column of that source table, together with one of the enrichment's own columns — the first declared column whose physical name does not begin with `_`. The enrichment's column SHALL be addressed as `"<enrichment>.<column>"`, quoted as a **single** identifier with the dot inside it: the service exposes an enrichment column on the source table under a name that literally contains a dot, and quoting it as two identifiers (`"<enrichment>"."<column>"`) is rejected with `Table '<enrichment>' not found`.
- Every projected column SHALL be quoted, not only the enrichment column that has to be, so that one `SELECT` list does not mix quoted and bare names for no reason a reader can see.
- Where the rules above yield no column at all — a table declaring no ordering key or one naming only platform columns, an enrichment with neither a grain key nor a non-platform column — the projection SHALL be `*`, so no snippet is ever generated with an empty projection.

The **Read data** tab SHALL state that its snippet projects a subset and that any of the table's columns may be selected, so the shortened projection is not read as a restriction. That statement SHALL be shown **only when the snippet actually names columns** — where the rules above fell back to `*` it SHALL be omitted, since it would describe a projection the reader is not looking at. For an **enrichment** it SHALL additionally state that the query reads through the table it enriches, that every column of the enrichment is reachable as `"<enrichment>.<column>"`, and that any column of the source table may be selected in the same query. That statement SHALL **name** the source table rather than referring to it by a pronoun: two tables are in play, so "that table" resolves against either.

Snippets SHALL read each endpoint from an environment variable whose default is the corresponding configured public endpoint: `DIAL_ANALYTICS_BASE_URL` for the REST surfaces and `DIAL_ANALYTICS_FLIGHT_SQL_URL` for Flight SQL, with the key in `DIAL_API_KEY`. When an endpoint is not configured its default SHALL be a visible placeholder — `<analytics-base-url>` and `grpc://<analytics-host>:32010` respectively — and the panel SHALL show a note to replace it, positioned with **every** export block that carries it — the REST endpoint's export block is repeated above each REST example, and `curl` cannot carry an inline default the way the Python examples can, so a reader working from any one of them SHALL be told the value is a placeholder.

Every name a snippet asks the reader to set SHALL be one the product uses publicly. The analytics service's internal name SHALL NOT appear in any snippet, placeholder, or panel string — a reader configuring a client has no way to connect it to anything they were given.

A table with no declared columns SHALL still render every tab, with the write snippet carrying an empty row rather than failing to render.

**The panel's format guidance SHALL be generated from the schema, exactly as its snippets are, and SHALL name this table's own columns rather than the types they happen to have.** For each declared column whose type carries a value-format rule — a timestamp's representation, a decimal's quoting, an array's element shape — the panel SHALL state the rule against the column's name, listing the columns of that type when there is more than one. A rule no declared column's type uses SHALL be omitted entirely, so a table of strings and integers shows no format guidance.

The timestamp entry SHALL state the write format — ISO-8601 with `Z` or an explicit offset — **and** that it is the same form queries return, so a value read back can be written unchanged.

Rules that are not per-column SHALL be stated separately from the per-column list. These are the write batch maximum (10 000 rows per request) and, on the Read tab, the row limits below.

The Read tab SHALL state the row limits per surface, because they differ in kind and not only in value:

- **REST** (`/v1/queries/execute-sql`) — a query with no `LIMIT` runs with a default of 100; an explicit `LIMIT` above 1 000 is **rejected**, not reduced.
- **Flight SQL** — an oversized `LIMIT` is **clamped** to the endpoint's cap, never rejected; a query whose result exceeds that cap fails outright and returns no partial page. The cap is deployment-configured, so the panel SHALL describe it rather than printing a number.

After the write snippets — not before them, since the generated snippet already satisfies the rules above — the panel SHALL surface the likeliest rejections, phrased as the message the caller sees and what to change: an unknown column, a missing or null value in a non-nullable column, and an authorization failure. The authorization failure SHALL be stated as the `403 forbidden` the backend actually returns, never as "not authorized". The non-nullable rejection (`422`, "column '<col>' is not nullable and must be present with a non-null value") SHALL name this table's non-nullable, non-platform columns, and SHALL be omitted when the table has none. The unknown-column rejection SHALL be presented as one message covering both a mistaken display name and a `_`-prefixed platform column, because the backend does not distinguish them.

#### Scenario: Write snippets key by the physical source name

- **WHEN** the user opens the Connect panel
- **THEN** each write snippet's row fields are keyed by the columns' physical source names

#### Scenario: The panel teaches no second column identifier

- **WHEN** any part of the panel renders
- **THEN** it contains no explanation of, or contrast between, the physical and exposed column identifiers

#### Scenario: Read snippets project the ordering key

- **WHEN** the panel opens for a source table declaring columns `event_id`, `request_time`, and `total` with an ordering key of `event_id, request_time`
- **THEN** every read snippet — Python, `curl`, and Flight SQL — queries `SELECT "event_id", "request_time" FROM <table> LIMIT <limit>`, and `total` appears in none of them

#### Scenario: A platform column named by the ordering key is not projected

- **WHEN** a source table's ordering key names a `_`-prefixed platform column such as `_ingested_at` alongside an ordinary column
- **THEN** the read snippets project only the ordinary column

#### Scenario: A table with no usable ordering key projects everything

- **WHEN** the panel opens for a source table whose payload declares no ordering key, or one naming only `_`-prefixed platform columns
- **THEN** the read snippets query `SELECT * FROM <table> LIMIT <limit>`

#### Scenario: An enrichment reads from its source table

- **WHEN** the panel opens for an enrichment named `widget_scores` over source table `widget_events`, with grain key `event_id` and first declared column `score`
- **THEN** every read snippet queries `SELECT "event_id", "widget_scores.score" FROM widget_events LIMIT <limit>`
- **AND** no snippet queries `FROM widget_scores`

#### Scenario: The enrichment read tab states the qualified form

- **WHEN** the **Read data** tab renders for an enrichment
- **THEN** it names the source table the query reads through, states that every column of the enrichment is reachable there as `"<enrichment>.<column>"` quoted as one name, and states that any column of the source table may be selected in the same query

#### Scenario: The read tab states that the projection is a subset

- **WHEN** the **Read data** tab renders
- **THEN** it states that any of the table's columns may be selected, so the snippet's projection is not read as a restriction

#### Scenario: Timestamp columns use the insert format

- **WHEN** a table has a `timestamp` column
- **THEN** its value in the write snippets is the ISO-8601 literal `2026-01-15T10:00:00.000Z`
- **AND** the format guidance states that this is the same form queries return

#### Scenario: Non-nullable columns are named as required

- **WHEN** a writable table declares non-nullable columns
- **THEN** the rejection guidance names each of them as required with a non-null value in every row
- **AND** when every column is nullable, no such rejection is shown

#### Scenario: Decimal columns are quoted

- **WHEN** a table has a `decimal` column
- **THEN** its value in the write snippets is a quoted numeric string

#### Scenario: Array columns are shaped by their element type

- **WHEN** a table has an `array` column whose `element_type` is `string`
- **THEN** its value in the write snippets is an array of quoted strings, and an `array` of `long` yields an array of whole numbers

#### Scenario: Format guidance names columns, not types

- **WHEN** a table has a `decimal` column named `score` and a `timestamp` column named `recorded_at`
- **THEN** the format guidance states the quoting rule against `score` and the representation rule against `recorded_at`, naming neither type

#### Scenario: Several columns share a rule

- **WHEN** a table has two `timestamp` columns
- **THEN** the representation rule is stated once, naming both columns

#### Scenario: Irrelevant rules are omitted

- **WHEN** a table declares no `decimal`, `timestamp`, `date`, or `array` column
- **THEN** the panel shows no per-column format guidance

#### Scenario: Row limits are stated per surface

- **WHEN** the **Read data** tab renders
- **THEN** it states that a REST query without a limit runs with a default of 100 and that an explicit limit above 1 000 is rejected
- **AND** it states that Flight SQL clamps an oversized limit rather than rejecting it, and fails without a partial page when a result exceeds its cap

#### Scenario: Platform columns are omitted

- **WHEN** a table has a column whose physical name begins with `_`
- **THEN** that column appears in no snippet

#### Scenario: Endpoint defaults to the configured public URL

- **WHEN** a public Analytics endpoint is configured and the user opens the panel
- **THEN** the snippets default `DIAL_ANALYTICS_BASE_URL` to that endpoint

#### Scenario: Flight endpoint falls back to its own placeholder

- **WHEN** no public Flight endpoint is configured
- **THEN** the Flight snippets default `DIAL_ANALYTICS_FLIGHT_SQL_URL` to a `grpc://` placeholder, never to the REST endpoint, and the Read tab shows a note to replace it

#### Scenario: Endpoint falls back to a placeholder

- **WHEN** no public Analytics endpoint is configured
- **THEN** the snippets default `DIAL_ANALYTICS_BASE_URL` to `<analytics-base-url>` and the panel shows a note to replace it above every REST example, on both tabs — each `DIAL_ANALYTICS_BASE_URL` export block carries its own copy of the note

#### Scenario: The subset note is omitted over a wildcard projection

- **WHEN** the read snippets fall back to `SELECT *` — the table declares no ordering key, or names only platform columns
- **THEN** the Read tab omits the note about projecting a few columns, rather than stating it over a projection that selects every column

#### Scenario: The ordering key is projected by exposed name

- **WHEN** a source table's `ordering_key` names a column whose physical source name differs from its exposed name
- **THEN** the read snippets project that column's exposed name, which is the spelling the query surface binds

#### Scenario: The shared block carries only the key

- **WHEN** the panel renders
- **THEN** the block above the tabs exports `DIAL_API_KEY` and no endpoint variable
- **AND** the Flight SQL example, which needs the key but not the REST endpoint, sets no `DIAL_ANALYTICS_BASE_URL`
- **AND** each REST example is preceded by its own `DIAL_ANALYTICS_BASE_URL` export block

#### Scenario: A table with no columns still renders

- **WHEN** the user opens the Connect panel for an `ACTIVE` table that declares no columns
- **THEN** every tab renders and the write snippet carries an empty row

#### Scenario: Rejections are shown after the snippets

- **WHEN** the **Write data** tab renders
- **THEN** the unknown-column and authorization rejections appear below the write snippets, each naming the message the caller would see

#### Scenario: An enum column's write snippet uses one of its declared values

- **WHEN** the Connect panel renders the write snippet for a table declaring an enum column whose values are
  `pending`, `running`, `failed`
- **THEN** that column's field in the generated row carries `pending`
- **AND** it does not carry a generic example string

### Requirement: Connect panel states the authentication and role contract

The panel SHALL instruct the user to supply a DIAL API key through a `DIAL_API_KEY` environment variable rather than pasting it into the script. Every surface the panel shows takes the same key in the same `Api-Key` header; the Flight SQL client sends it as a gRPC call header, which is why its driver option carries the lower-cased name. The panel SHALL NOT render, echo, or offer to generate an actual key; the value in every snippet SHALL be a placeholder.

The panel SHALL read this table's access lists when it opens. The **Write data** tab SHALL render the `write` role names as the roles a key must carry to write rows to this table. These are the only role names the panel SHALL render.

The panel SHALL NOT name the analytics backend's application roles. Those are derived by that service from a provider-role mapping this application cannot read, they are not names an operator can attach to a key, and the similarly named role this application holds is a different service's notion of the same word. Where the panel must refer to that level of access it SHALL do so descriptively.

For the same reason the panel SHALL NOT present the current viewer's own per-table permissions as a statement about the key the snippets will use: `permissions` describes this console session, while the snippets run under a key the user supplies.

The **Write data** tab SHALL state that a key with administrator access can write to this table regardless of the list, together with the note that a role scoped to this table is the better choice for a job that only appends rows. It SHALL offer no step or instruction for obtaining such a key. Where the panel points at role management it SHALL attribute it to a full administrator rather than implying an on-screen control, since the header's **Manage access** action renders only for full admins on non-system tables. The panel SHALL offer no access-management control of its own; the header already carries one for those who can use it.

When the `write` list is empty the panel SHALL say so and name the consequence — that as configured, only a key with administrator access can write to this table.

The **Read data** tab SHALL state that read access is not scoped per table: a key able to query this table can query the whole catalog, and no per-table read-only role exists.

While the access request is in flight the panel SHALL show a loading state in place of the role list, and SHALL render every other part of the panel immediately. When the request fails — including the `403` returned to a caller holding neither application role — the panel SHALL omit the role list, keep every other part rendered, and SHALL NOT surface an error notification. Because that failure hides the role names from exactly the reader who cannot yet write, the panel SHALL NOT be described as guaranteeing that reader an answer.

#### Scenario: Write roles are listed

- **WHEN** the panel opens for a table whose `write` access list contains `analytics-writer`
- **THEN** the **Write data** tab lists `analytics-writer` as a role a key must carry to write to this table

#### Scenario: No internal service name is exposed

- **WHEN** any snippet, placeholder, or panel string renders
- **THEN** none of them contains the analytics service's internal name

#### Scenario: No application-role constant is rendered

- **WHEN** any part of the panel renders
- **THEN** neither `FULL_ADMIN` nor `READ_ONLY_ADMIN` appears in it, and the only role names shown are those returned by the table's access lists

#### Scenario: Administrator access is a caution, not an option

- **WHEN** the **Write data** tab renders
- **THEN** it states that a key with administrator access can write to this table regardless of the list, and that a scoped role is the better choice for a job that only appends rows
- **AND** it offers no step or instruction for obtaining such a key

#### Scenario: Role management is attributed, not pointed at

- **WHEN** the panel refers to granting a role
- **THEN** it attributes that to a full administrator rather than directing the reader to a control that may not be rendered for them

#### Scenario: Read scope is stated on the Read tab

- **WHEN** the **Read data** tab renders
- **THEN** it states that a key able to query this table can query the whole catalog, and that no per-table read-only role exists

#### Scenario: Empty write list names its consequence

- **WHEN** the panel opens for a table whose `write` access list is empty
- **THEN** the **Write data** tab states that as configured, only a key with administrator access can write to this table
- **AND** it does not present using such a key as the resolution

#### Scenario: Access is loading

- **WHEN** the access request has not yet resolved
- **THEN** the role list shows a loading state and every other part of the panel is already rendered

#### Scenario: Access is unreadable

- **WHEN** the request for the table's access lists fails
- **THEN** the role list is omitted, no error notification is shown, and the tabs and snippets still render

#### Scenario: No key is ever rendered

- **WHEN** any tab renders
- **THEN** the API key in every snippet is a placeholder, and the panel offers no way to reveal or generate a real key

#### Scenario: The panel offers no access-management control

- **WHEN** the panel renders for a viewer who can manage roles
- **THEN** it contains no control that opens the table's access management surface

### Requirement: Entity schema responses are cached per caller role

An entity's schema describes the shape of a table rather than its contents: it changes when the table's
schema is patched, not when rows arrive. Re-fetching it on every page load spends a request on an answer that
did not change. The system SHALL therefore serve the `conversations` entity schema from a cache rather than
querying the analytics service on each page load.

The cache key SHALL include the caller's role, not the entity name alone. The service filters `sensitive`
columns from the schema by the caller's role, so one entity has more than one correct answer: a key that
ignores the role would either disclose to a caller field names their role withholds, or withhold from a
caller field names their role permits. A cached entry SHALL NOT be served to a caller whose role differs from
the one it was resolved under.

A cached entry SHALL expire after a bounded lifetime. The schema is stable, not immutable — a table schema
patch changes it — so an entry that never expires would pin the view to a field set the entity no longer has.

A cache miss, an expired entry, or a failed lookup SHALL fall through to the service exactly as an uncached
fetch does, and a fetch failure SHALL NOT be cached: a failure is a statement about one request, not about
the schema, and caching it would extend one outage over the entry's whole lifetime.

#### Scenario: A repeated load does not re-query the schema

- **WHEN** the sessions page is loaded twice in succession by the same caller within the entry's lifetime
- **THEN** the entity schema is fetched from the analytics service once
- **AND** the second load renders the same column catalog as the first

#### Scenario: A different role does not read another role's entry

- **WHEN** a caller whose role withholds sensitive columns loads the page after a caller whose role permits them
- **THEN** the schema served to the second caller is the one their own role resolves
- **AND** it does not offer a column their role withholds

#### Scenario: An expired entry is re-resolved

- **WHEN** the page is loaded after the cached entry's lifetime has elapsed
- **THEN** the schema is fetched from the analytics service again
- **AND** a field added to the entity since the entry was cached is offered in the catalog

#### Scenario: A failed schema fetch is not cached

- **WHEN** a schema fetch fails and the page is loaded again
- **THEN** the schema is fetched from the analytics service again rather than the failure being replayed

### Requirement: Table Audit tab lists the table's own and its columns' activities

The global Activity Audit page's own `Analytics` view — the third option in its `View` selector, its
fetcher, its rollback absence, and how one of its rows resolves and renders on the audit detail page —
is specified by the `activity-audit-analytics-view` capability. This requirement covers only the tab
on the table detail view.

The **Audit** tab SHALL render the shared entity audit surface with the Activities list as its only
sub-tab — no Dashboard, Traces, or Conversations sub-tab, which report DIAL request telemetry keyed
by a deployment name and have no meaning for a catalog table — and with no view-type selector.

The list SHALL be sourced from the analytics backend (`POST /v1/activities` at
`DIAL_ANALYTICS_API_URL`) and SHALL be narrowed to the table being viewed **and its columns**. The
request SHALL carry a `resourceType` filter with the `in` operator and the value `Table,TableColumn`,
and a `resourceId` filter with the `co` operator and the table's name. Because `co` is a substring
match and the analytics backend names a column activity `<table>:<column>`, rows SHALL be narrowed
client-side to those whose `resourceId` is exactly the table's name or begins with the table's name
followed by `:`; a row belonging to any other table SHALL NOT be displayed.

Because the list carries two resource types, the grid SHALL show the `Resource type` and
`Resource identifier` columns, so a column activity states which column it refers to. Rows SHALL be
listed flat, newest first, with no row-expander column.

The tab renders the same `Analytics` view as the global page, so the suppression of a deleted table's
child column activities (`activity-audit-analytics-view`, *A child activity of a deleted table is not
listed*) applies here too. It is inert in practice — a deleted table has no detail view from which to
open this tab — and it never touches a column dropped from the table being viewed, whose parent is a
`Table` `Update`.

The tab SHALL offer the same time-period filter `EntityAudit` already renders for other entities,
initialized to the default period, and changing it SHALL re-request the list for the new range. The
row action menu SHALL offer `Open in a new tab` and SHALL NOT offer `Rollback` — the analytics backend
exposes no endpoint that writes an audit record, revision, or snapshot. A failed request SHALL leave
the grid in its existing error/empty state and SHALL NOT raise a toast notification; this surface is
read-only and performs no action a success or error notification would describe.

#### Scenario: Request is narrowed to the table and its columns

- **WHEN** the Audit tab is opened on the table named `conversations` and the grid requests its first
  row block
- **THEN** the analytics activity feed is requested with a `resourceType` filter
  `{ operator: "in", value: "Table,TableColumn" }` and a `resourceId` filter
  `{ operator: "co", value: "conversations" }`
- **AND** the request is not sent to the admin backend or the deployment-manager backend

#### Scenario: An activity belonging to a similarly named table is excluded

- **GIVEN** the Audit tab is open on the table named `orders`
- **AND** the feed response contains an activity with `resourceType: "TableColumn"` and
  `resourceId: "my_orders:total"`
- **WHEN** the grid renders the block
- **THEN** that row is not displayed
- **AND** a row with `resourceId: "orders"` and a row with `resourceId: "orders:total"` are both
  displayed

#### Scenario: A column activity states which column it refers to

- **GIVEN** the Audit tab is open on the table named `orders`
- **WHEN** the list contains an activity with `resourceType: "TableColumn"` and
  `resourceId: "orders:total"`
- **THEN** that row's `Resource type` cell reads the localized `Table column` label
- **AND** its `Resource identifier` cell reads `orders:total`

#### Scenario: Audit tab renders only the Activities sub-tab

- **WHEN** the user selects the `Audit` tab
- **THEN** the sub-tab rail lists `Activities` and nothing else
- **AND** no `Config / Deployments / Analytics` view-type dropdown is rendered

#### Scenario: Row click opens the global audit detail page

- **GIVEN** the Audit tab lists an activity whose `activityId` is `abc-123`
- **WHEN** the user clicks that row outside the action menu
- **THEN** the browser opens `/activity-audit/abc-123` in a new tab, as the shared audit list already
  does for every other view
- **AND** no `/tables/{name}/{activityId}` URL is requested

#### Scenario: No rollback action is offered

- **WHEN** the user opens the row action menu on any row in the Audit tab
- **THEN** the menu offers `Open in a new tab`
- **AND** the menu does not offer `Rollback`

#### Scenario: Table with no recorded history

- **GIVEN** a table for which the analytics activity feed returns zero rows
- **WHEN** the user opens the Audit tab
- **THEN** the grid shows its existing empty state, with no error and no notification
- **AND** the tab remains usable and the user can navigate away normally

#### Scenario: Changing the time period re-requests the list

- **GIVEN** the Audit tab is open
- **WHEN** the user changes the time-period filter
- **THEN** the next request to the analytics activity feed carries the updated
  `epochTimestampMs` `ge` and `le` filters

### Requirement: JSON editor for a table draft

For a table that is not yet materialized (`status` `PENDING` or `FAILED`) and that the caller may modify, the table detail view SHALL offer a JSON-editor toggle among the header's ordinary actions while the draft has no unsaved changes — once either surface has been edited the toggle is withdrawn with the header's other ordinary actions, as "A changed table draft's header offers Discard and Save" specifies — and the two authoring surfaces SHALL be mutually exclusive: while the editor is the active surface the column-by-column schema-definition surface SHALL NOT be rendered, and toggling the editor off SHALL restore it. The **authoring** editor specified here SHALL NOT be offered on an `ACTIVE` table, whose schema is patched through the scoped add/drop/rename/update surface instead; the same toggle on an `ACTIVE` table's header opens the **read-only** view specified in "An ACTIVE table's definition is readable as JSON", which authors nothing and submits nothing.

The edited document SHALL be the schema body the column form would submit for the table's kind — for a **source** `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`; for an **enrichment** `columns`, `grain_key`, `cardinality` — plus the table's catalog metadata `description` and `tag_order`, which the column form presents no field for. A member the column form would omit (an unset partition, an unset scan-metadata pair) SHALL be absent from the seeded document rather than present and empty.

The document SHALL be seeded **once**, when the editor is first opened, from the current column-form state and the table's stored `description`/`tag_order`. It SHALL NOT be re-seeded thereafter — not on a re-render, and not on a later entry into the editor — so an in-progress document is never silently replaced. The single action that does re-seed it is **Discard**, specified in "A changed table draft's header offers Discard and Save"; nothing else replaces the author's document. After the first seed the two surfaces hold independent state: an edit to the document SHALL NOT change the column form, and an edit to the column form SHALL NOT change the document.

Two consequences of the toggle's withdrawal, stated because they bound what the two paragraphs above can be observed to mean. A later entry into the editor is reachable only from an **unchanged** draft — once either surface has been edited the toggle is gone — so seeding once and re-seeding from the stored state are indistinguishable on every reachable path, and the seed-once rule is a statement about the implementation rather than an observable one. For the same reason the two surfaces can never be visited in sequence after a change, so their independence is observable only in what a save from each surface submits: "Saving from the column form sends only the schema request" and "A successful save sends the metadata update before the schema" are what pin it.

While the editor is the active surface, the column form's own completeness rules (at least one valid column, a non-empty ordering key, a complete-or-absent scan-metadata pair, a non-empty grain key, no invalid column row) SHALL NOT gate Save. The only client-side gate SHALL be that the document parses as JSON, reported by the editor's own parse markers: with markers present, Save SHALL send neither request and SHALL surface the parse errors as notifications. No client-side validation of the document's *content* SHALL be performed — an incomplete or otherwise unacceptable document is a service rejection (the data-access service parses request bodies strictly and answers 422 on an unknown property or a missing required field), and that rejection SHALL be shown as-is.

#### Scenario: The editor toggle takes over the draft surface

- **WHEN** the detail view of a `PENDING` or `FAILED` table renders for a caller who may modify it
- **THEN** a JSON-editor toggle is offered among the header's ordinary actions, and activating it replaces the column-by-column schema-definition surface with the JSON document
- **AND** on an `ACTIVE` table the same toggle offers no authoring surface at all — it opens the read-only view of the stored definition, from which no save is reachable

#### Scenario: A source draft's document is its schema plus catalog metadata

- **WHEN** the editor is first opened for a source draft whose column form declares columns, an ordering key and a partition, and whose scan-metadata pair is unset
- **THEN** the seeded document carries `columns`, `ordering_key`, `partition_by`, `description` and `tag_order`
- **AND** it carries neither `identity_column` nor `version_column`, and no `grain_key` or `cardinality`

#### Scenario: An enrichment draft's document is its schema plus catalog metadata

- **WHEN** the editor is first opened for an enrichment draft whose column form declares columns and a grain key
- **THEN** the seeded document carries `columns`, `grain_key`, `cardinality`, `description` and `tag_order`
- **AND** it carries none of `ordering_key`, `partition_by`, `identity_column`, `version_column`

#### Scenario: An in-progress document survives a re-render

- **WHEN** the author has edited the document and the surrounding view re-renders from an unrelated state change
- **THEN** the editor still shows the author's edited document, not a fresh seed

#### Scenario: Opening the editor and leaving it does not change what the column form submits

- **WHEN** the author opens the editor on an unchanged draft, makes no edit, toggles the editor off, then edits the column form and saves
- **THEN** the draft still reads as unchanged while the editor is open and after it is closed, so the toggle stays offered throughout
- **AND** the save sends `defineTableSchema` alone, carrying the column form's own body and no `updateTable`

#### Scenario: The column form's completeness rules do not gate Save in the editor

- **WHEN** the editor is the active surface, the author has edited the document, and it parses but omits a member the column form requires — a source document with no `ordering_key`
- **THEN** the Save the changed header offers is enabled, and submitting it sends the requests, so the service's answer decides the outcome

#### Scenario: A document that does not parse blocks the save

- **WHEN** the editor is the active surface, the document carries parse-error markers, and the author submits Save
- **THEN** neither the metadata request nor the schema request is sent, and the parse errors are surfaced as notifications

### Requirement: Pasting another environment's table response into a draft document

Pasting the JSON body of `GET /v1/tables/{name}` copied from another environment SHALL yield a document usable as-is for Save on this table. The client SHALL derive the two request bodies from the **parsed document** rather than from the editor's text, and in doing so it SHALL:

- drop the members the service does not accept on a write and that a read response carries: `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`;
- unpack the nested read shape `grain: { grain_key, cardinality }` into the flat `grain_key` and `cardinality` members the schema body uses, omitting `cardinality` when the nested object does not carry it, and leaving a flat member already present in the document as the winner over the nested one;
- route `description` and `tag_order` to the metadata request;
- pass every other member through to the schema request untouched, including one this console does not otherwise read or write.

The editor's text SHALL NOT be rewritten in response to a paste or to any other accepted edit: the transformation above is applied to what is sent, so the author's text, cursor and whitespace are never rewritten under them.

#### Scenario: Read-only and identity members are dropped from the schema request

- **WHEN** the author pastes a read response carrying `status`, `system`, `permissions`, `column_count`, `name`, `type` and `source_table`, and saves
- **THEN** the schema request body carries none of those seven members

#### Scenario: A nested grain object is unpacked into flat members

- **WHEN** the pasted document is an enrichment table's and carries `grain: { grain_key, cardinality }`, and the author saves
- **THEN** the schema request body carries `grain_key` and `cardinality` as top-level members and no `grain` object

#### Scenario: An unrecognized member is passed through to the schema request

- **WHEN** the pasted document carries a member this console does not otherwise read or write
- **THEN** the schema request body carries that member exactly as pasted

#### Scenario: Pasting does not rewrite the editor's text

- **WHEN** the author pastes a read response into the editor
- **THEN** the editor keeps showing exactly the pasted text, including the members that will be dropped from the request

### Requirement: Saving a table draft as metadata then schema

While the JSON editor is the active surface, the header **Save** action SHALL send two requests in this order:

1. `updateTable` (`PUT /v1/tables/{name}`, `UpdateTableDto` — `description`, `tag_order`; merge-patch semantics, so an absent member leaves the stored value unchanged and `tag_order: []` clears it);
2. `defineTableSchema` (`POST /v1/tables/{name}/schema`), which defines the schema and materializes the table.

The schema request SHALL be sent only if the metadata request succeeded. On success the view SHALL refresh from the server, showing the table `ACTIVE` with its live column surface, and SHALL raise the same success notification the column-form save already raises. On either failure the service's error SHALL be surfaced as-is — its error header, message and request id — with no client-side interpretation, and the view SHALL remain on the draft surface with the author's document intact so it can be corrected and submitted again. Re-submitting SHALL send both requests again, which is safe because the metadata request is a merge-patch.

#### Scenario: A successful save sends the metadata update before the schema

- **WHEN** the editor is the active surface, the author has edited the document into one the service accepts, and saves
- **THEN** `updateTable` is sent before `defineTableSchema`, the success notification is raised, and the refreshed view shows the table `ACTIVE` with its live column surface

#### Scenario: A failed metadata update blocks the schema request

- **WHEN** `updateTable` fails
- **THEN** `defineTableSchema` is not sent, the table's status is unchanged, and the service's error is shown as-is

#### Scenario: A failed schema request leaves the draft for a safe retry

- **WHEN** `updateTable` succeeds and `defineTableSchema` fails
- **THEN** the service's error is shown as-is, the view stays on the draft surface with the document intact, and saving again re-sends both requests

### Requirement: A changed table draft's header offers Discard and Save

For a table that is not yet materialized (`status` `PENDING` or `FAILED`) and that the caller may modify, the detail view SHALL adopt this console's changed-entity header convention, which every other entity view already follows: while the draft has unsaved changes the header's ordinary actions give way to **Discard** and **Save**.

A draft SHALL be treated as **changed** when either authoring surface differs from the table's stored state:

- the **column-by-column surface**, when the schema body it would submit differs from the schema body the table's stored definition yields — so a `PENDING` table whose form has not been touched and a `FAILED` table freshly seeded from its stored definition are both *unchanged*;
- the **JSON document**, when it differs from the document that same stored state seeds.

While the JSON editor is the active surface, unresolved parse markers SHALL additionally count as changed, because a marker suppresses the parse and the last successfully parsed document therefore cannot be compared — leaving the header in its ordinary state would offer no way out of a broken document but to fix it.

While the draft is changed the header SHALL present **Discard** and **Save**, and SHALL withdraw its ordinary actions — **Manage access**, **Delete table** and the JSON-editor toggle. Discard SHALL be confirmed through this console's shared discard confirmation before it takes effect. Both actions SHALL be presented only to a caller who may modify the table; a caller who may only view, delete or manage access SHALL never see them, and SHALL keep whichever ordinary actions its permissions already allow.

While the draft is **unchanged** the header SHALL present its ordinary actions — **Manage access**, **Delete table** and the JSON-editor toggle — and SHALL offer **neither Save nor Discard**, exactly as this console's convention behaves on every other entity view. Save is therefore reachable only while the draft is changed. One consequence is accepted deliberately: an untouched `FAILED` draft SHALL NOT be re-submittable as-is — its author must first make an edit that either surface registers as a change.

Save's **disabled** state SHALL follow the active surface, and SHALL be the convention's:

- from the **column-by-column surface**, Save SHALL be disabled while that surface's own completeness rules are unmet — the rules "Define and materialize a table schema" states;
- from the **JSON editor**, Save SHALL NOT be disabled; its only client-side gate SHALL be the parse markers "JSON editor for a table draft" specifies.

Save SHALL send from each surface exactly the requests that surface already sends: "Saving a table draft as metadata then schema" in the editor, `defineTableSchema` alone from the column form.

**Discard** SHALL restore both surfaces to the table's stored state: the column form to the values the stored definition seeds, and — if a document has been seeded — the JSON document to the document that stored state yields. Any parse markers and the notifications they raised SHALL be cleared first, so a stale marker cannot hold the changed header up on its own. The active surface SHALL NOT change: an author who discards while the editor is open stays in the editor, looking at the restored document.

No **authoring** behaviour of an `ACTIVE` table SHALL change. The changed-entity header SHALL NOT be presented there, and that view's own actions — Add columns, Add rows, Connect — SHALL be presented exactly as today. The one control that view's header gains is the read-only JSON-view toggle of "An ACTIVE table's definition is readable as JSON": it is not an authoring surface, it never marks the table changed, and neither Save nor Discard is reachable from it.

#### Scenario: Editing the JSON document swaps the header's actions

- **WHEN** the JSON editor is the active surface on a modifiable draft and the author edits the document
- **THEN** the header offers Discard and Save
- **AND** Manage access, Delete table and the JSON-editor toggle are no longer offered

#### Scenario: Editing the column form swaps the header's actions

- **WHEN** the author changes a value on a modifiable draft's column-by-column surface
- **THEN** the header offers Discard and Save, and Manage access, Delete table and the JSON-editor toggle are no longer offered

#### Scenario: An untouched draft keeps its ordinary header actions

- **WHEN** a modifiable draft renders and neither surface has been edited
- **THEN** the header offers Manage access, Delete table and the JSON-editor toggle
- **AND** it offers neither Save nor Discard

#### Scenario: An untouched FAILED draft offers no Save

- **WHEN** the detail view of a `FAILED` table renders for a caller who may modify it, both surfaces seeded from the table's stored definition and neither edited
- **THEN** no Save action is offered, so the stored definition cannot be re-submitted until an edit makes the draft changed

#### Scenario: Unresolved parse markers hold the changed header up

- **WHEN** the JSON editor is the active surface and the document carries parse-error markers
- **THEN** the header offers Discard and Save even though the last successfully parsed document is unchanged

#### Scenario: Discard restores both surfaces to the stored state

- **WHEN** the draft is changed and the author confirms Discard
- **THEN** the column form shows the values the table's stored definition seeds, the JSON document shows the document that stored state yields, the editor is still the active surface if it was, and the header returns to its ordinary actions

#### Scenario: Discard is confirmed before it takes effect

- **WHEN** the author activates Discard on a changed draft
- **THEN** a discard confirmation is presented, and dismissing it leaves both surfaces and the header as they were

#### Scenario: The changed header is offered only to a caller who may modify

- **WHEN** a draft's detail view renders for a caller who may delete or manage access but may not modify
- **THEN** neither Discard nor Save is offered in any state, and the actions that caller's permissions do allow are presented as before

#### Scenario: An ACTIVE table's header offers neither Discard nor Save

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with full permissions
- **THEN** no Discard action and no Save action is offered, in any state that view can be put in — the read-only JSON view included
- **AND** Manage access, Delete table, Add columns, Add rows and Connect are presented exactly as before this change, alongside the read-only JSON-view toggle

### Requirement: An ACTIVE table's definition is readable as JSON

For a table whose `status` is `ACTIVE`, the table detail view SHALL offer among the header's actions the **same JSON-editor toggle a draft offers**, and activating it SHALL replace the view's whole body — the Properties/Audit tab strip included — with the table's stored definition rendered as a JSON document, **read-only**. The only difference from the draft's arrangement SHALL be that nothing inside the document can be changed. Toggling the control off SHALL restore the body as it was, on the tab the reader had selected; the toggle SHALL stay in the header while the document is shown, so the way back is visible at all times and no other surface of the page is reachable behind it.

The document SHALL be the **paste-ready write shape**, not the `GET /v1/tables/{name}` read body: the schema body for the table's kind — for a **source** `columns`, `ordering_key`, `partition_by`, and `identity_column`/`version_column` when the stored definition declares them; for an **enrichment** `columns`, `grain_key`, `cardinality` — plus the catalog metadata `description` and `tag_order`. It SHALL carry none of `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested `grain` object. It SHALL be the identical document a `PENDING`/`FAILED` table's JSON editor seeds ("JSON editor for a table draft"), so a definition read here pastes into that editor on another environment with no member removed, renamed or unpacked. Each declared column SHALL carry the metadata the stored definition holds for it — its physical `source_name`, its exposed `name`, `type`, `nullable`, and `element_type`, `enum_values`, `tag`, `display_name`, `description` and `sensitive` where they are set — so that a column renamed after materialization contributes both names and the target environment reproduces the rename rather than losing it.

The toggle SHALL be offered on every `ACTIVE` table to every caller who can open its detail page:

- whatever the table reports for `permissions.write` and `permissions.modify` — including a system table, which reports `{write: false, modify: false}` to everyone — on the same reasoning that already keeps **Connect** free of a permission gate ("Table detail gates edits by per-table permissions"); and
- whatever `ANALYTICS_ENABLED` reports: with analytics disabled the detail view renders the Properties content as the whole body and no tab strip, and the toggle SHALL swap that body for the document just the same.

The JSON view SHALL offer no way to change the table. Its editor SHALL reject typing and pasting; no **Save**, no **Discard** and no changed-entity header SHALL be presented in any state a reader can reach from it; and no table write SHALL be issued from it — neither `updateTable` (`PUT /v1/tables/{name}`) nor `defineTableSchema` (`POST /v1/tables/{name}/schema`) nor `updateTableSchema` (`PATCH /v1/tables/{name}/schema`). Because the view is read-only there are no form fields to validate and no request to report on, so it raises no success or error notification of its own; the only notification it can produce is the copy confirmation specified in "The displayed definition is copyable in one action".

A save that materializes a draft **from its JSON editor** SHALL leave the reader on the live column surface of the now-`ACTIVE` table, not on the read-only JSON view: after a successful `defineTableSchema` the toggle SHALL be off, so that "Define and materialize a table schema" — "the view SHALL refresh showing the table `ACTIVE` with its live column surface" — keeps holding now that the same control has a meaning on an `ACTIVE` table.

While the JSON view is on, the header SHALL offer only the **copy control** and the toggle: Delete table, Add columns, Add rows and Connect are not rendered, and they return, each behaving exactly as before, when the view is turned off. The per-column edit/drop and inline-rename actions are unaffected. The JSON-editor toggle SHALL be the **last** control of the header row (see "Table detail gates edits by per-table permissions"). It is a view switch rather than an action on the table, and it is the one control that persists across the swap and that the reader returns to.

#### Scenario: The JSON-editor toggle is offered in an ACTIVE table's header

- **WHEN** the detail view of an `ACTIVE` table renders
- **THEN** the header offers the same JSON-editor toggle a draft's header offers, as the last control of the row, after **Connect**
- **AND** activating it shows the table's stored definition as a read-only JSON document

#### Scenario: Opening the JSON view replaces the whole body

- **WHEN** a reader activates the toggle on an `ACTIVE` table whose body is showing the Properties/Audit tab strip
- **THEN** the document takes over the body, the tab strip is no longer rendered, and neither the columns grid nor the Audit tab's content is on screen
- **AND** the toggle is still in the header, showing that the JSON view is the active surface

#### Scenario: Closing the JSON view restores the tab the reader was on

- **WHEN** a reader on the **Audit** tab of an `ACTIVE` table opens the JSON view and then toggles it off
- **THEN** the tab strip is rendered again with **Audit** still selected and its content shown
- **AND** the same holds for the **Properties** tab

#### Scenario: A source table's document is the write shape, not the GET response

- **WHEN** a reader opens the JSON view on an `ACTIVE` source table whose stored definition declares columns, an ordering key, a partition and a scan-metadata pair
- **THEN** the document shows `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`, `description` and `tag_order`
- **AND** it shows none of `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested `grain` object
- **AND** on a source table whose scan-metadata pair is unset, neither `identity_column` nor `version_column` is present

#### Scenario: An enrichment table's document carries its enrichment members

- **WHEN** a reader opens the JSON view on an `ACTIVE` enrichment table
- **THEN** the document shows `columns`, `grain_key`, `cardinality`, `description` and `tag_order`
- **AND** it shows no source-only member — no `ordering_key`, no `partition_by`, no `identity_column`, no `version_column` — and no `source_table`

#### Scenario: A column's stored metadata survives into the document

- **WHEN** a reader opens the JSON view on an `ACTIVE` table one of whose columns was renamed after materialization and carries a tag, a display name, a description and the sensitive flag
- **THEN** that column appears with both its physical `source_name` and its exposed `name`, and with its `tag`, `display_name`, `description` and `sensitive` as stored
- **AND** a member the stored definition does not set is absent from that column rather than present and empty

#### Scenario: The document is the shape a draft editor seeds

- **WHEN** the document shown for an `ACTIVE` table is compared with the document a `PENDING` table of the same kind seeds its JSON editor with
- **THEN** the two are built from the same shape, so the text read here needs no member removed, renamed or unpacked before it is saved from that editor

#### Scenario: A caller with no write or modify permission still sees it

- **WHEN** the detail view of an `ACTIVE` table renders for a caller the table reports `permissions {write: false, modify: false}` for — which is every caller on a system table
- **THEN** the JSON-editor toggle is offered and opens the document
- **AND** no permission-gated action appears alongside it

#### Scenario: The JSON view is reachable with analytics disabled

- **WHEN** the detail view of an `ACTIVE` table renders with `ANALYTICS_ENABLED` off, so that no Properties/Audit tab strip is rendered and the Properties content is the whole body
- **THEN** the JSON-editor toggle is offered, and activating it replaces that body with the document

#### Scenario: The view cannot be edited

- **WHEN** a caller with every permission opens the JSON view of an `ACTIVE` table and types or pastes into the document
- **THEN** the document's content is unchanged

#### Scenario: No save path exists from an ACTIVE table's JSON view

- **WHEN** the JSON view is shown on an `ACTIVE` table, in any state a reader can put it in
- **THEN** neither Save nor Discard is offered, the changed-entity header is never presented, and no `updateTable`, `defineTableSchema` or `updateTableSchema` request is issued from it

#### Scenario: The ACTIVE view's own actions are unaffected

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with every permission and the JSON view is off
- **THEN** Delete table, Add columns, Add rows and Connect are all offered, each behaving exactly as before
- **AND** **Connect** is still the header's only primary action, though it is no longer the header's last control — the JSON-editor toggle follows it

#### Scenario: Turning the JSON view on leaves only copy and the toggle

- **WHEN** the reader turns the JSON view on
- **THEN** the header shows the copy control and the JSON-editor toggle and no other control, and turning the view off restores Delete table, Add columns, Add rows and Connect

#### Scenario: Materializing a draft from the JSON editor lands on the live column surface

- **WHEN** an author saves a `PENDING` table from its JSON editor and the schema request succeeds, so the refreshed table is `ACTIVE`
- **THEN** the body shows the live column surface of the now-`ACTIVE` table, not the read-only JSON view
- **AND** the toggle is off, so the reader turns it on again to read the definition as a document

#### Scenario: A not-yet-materialized table is untouched

- **WHEN** the detail view of a `PENDING` or `FAILED` table renders
- **THEN** the toggle authors the draft exactly as before — it opens the editable JSON editor, not a read-only view — and the column-by-column schema-definition surface, the changed-entity header and the toggle's own `canModify` gate are all as before

### Requirement: The displayed definition is copyable in one action

While the read-only JSON view of an `ACTIVE` table is shown, the header SHALL offer a copy control — a button with a copy icon and the text **Copy** — immediately before the JSON-editor toggle that opened the view, and no other table action (see "An ACTIVE table's definition is readable as JSON"), so the document can be taken without scrolling it. Its accessible name SHALL state that it copies, and that name SHALL be unchanged by a copy; the confirmation of the copy names the value. The control SHALL be shown **only while the document is** — it copies what is displayed, so it has no meaning when nothing is, and a permanent control in the header would offer to copy a document that is not on screen.

The read-only view itself SHALL carry no toolbar and no heading of its own: it is reached by a labelled toggle that names the surface, and the copy control travels with that toggle, so the whole body below the header is the document.

Activating the control SHALL place the **entire** document on the clipboard — the same text the read-only view displays, character for character including its indentation, whatever part of the document is scrolled into view and whatever the editor's own selection happens to be. The control SHALL be offered to every caller the view itself is offered to, including one the table reports `permissions {write: false, modify: false}` for.

A successful copy SHALL be confirmed by a notification raised through the console's notification container, which is itself a polite live region (`role="status"`, `aria-live="polite"`) distinct from the control's own accessible name, so the outcome is announced without the reader having to see a transient visual cue. The change SHALL introduce no new error path: a clipboard write the browser rejects is the shared copy control's existing behaviour and raises no notification.

#### Scenario: The copy control is offered with the document

- **WHEN** a reader opens the JSON view of an `ACTIVE` table
- **THEN** a **Copy** button with a copy icon is offered in the header, immediately before the JSON-editor toggle, with no other table action beside it
- **AND** it is offered to every caller the view is offered to, including one the table reports `permissions {write: false, modify: false}` for

#### Scenario: The copy control is absent while the JSON view is off

- **WHEN** the detail view of an `ACTIVE` table renders with the JSON view off, and again after a reader turns the view on and then off
- **THEN** no copy-definition control is present in the header in either case, and the JSON-editor toggle is still the header's last control
- **AND** on a `PENDING` or `FAILED` table no copy-definition control is present in any state, whether that table's own JSON editor is open or closed

#### Scenario: Copying places the whole displayed document on the clipboard

- **WHEN** the reader activates that control
- **THEN** the clipboard holds the entire document the view displays — the paste-ready shape, complete and identically formatted — whatever part of it is scrolled into view and whatever the editor's own selection is

#### Scenario: The copy is announced to assistive technology

- **WHEN** the copy succeeds
- **THEN** a confirmation naming the copied value is announced politely through the console's notification container, a live region distinct from the control's own accessible name
- **AND** the control's accessible name is unchanged by the copy

### Requirement: Table detail view is organized into Properties, Access and Audit tabs

The table detail view (`/tables/{name}`) SHALL, for a table whose `status` is `ACTIVE`, present its
content under a horizontal tab strip, built from the design system's 2.0 tabs component, with the tabs
**Properties**, **Access** and **Audit**, in that order. The **Access** tab SHALL be offered only as
"Access tab lists a table's roles" states; where it is not offered the strip carries **Properties** and
**Audit** alone. `Properties` SHALL be the selected tab when the view is first opened. The selected tab is
held by the view, as the other entity views' tabs are, and is not part of the URL.

The view header — the table name, the lifecycle status badge, the Rows restricted badge, the kind tag, the
system tag, the description row, and the whole header action row (Delete table, Add columns, Add rows,
Connect, and the draft **Save** action) — SHALL render **above** the tab strip and SHALL be otherwise unchanged
by this reorganization: the same controls, in the same order, under the same permission and status
conditions as before, visible whichever tab is selected. Every other element the "Table detail column
schema management", "Define and materialize a table schema", and "Table detail row writes"
requirements describe as being on the detail page — the read-only schema-metadata summary, the
columns grid or the draft schema editor, and the modals those actions open — SHALL render inside the
**Properties** tab where a tab strip is rendered, and directly beneath the header where it is not
(see the status and feature-flag conditions below). Whichever of the two applies, that content SHALL
be the same content, in the same order, as before this change.

The Audit tab SHALL be offered **only** on a table whose `status` is `ACTIVE`. On a table at any other
status — `PENDING` (Draft), `FAILED`, or a table whose status the backend does not report — the detail
view SHALL render no tab strip and no Audit or Access tab, SHALL render the Properties content directly, and
SHALL issue no request to the analytics activity feed or to the access and row-policy endpoints. A table that
has not been materialized has no audit history for the tab to show: it has no columns, and the analytics
activity feed returns zero activities for its name, so the tab could only ever be empty. On an `ACTIVE`
table the Audit tab SHALL require no permission beyond the one that already allows reading the table, and
SHALL NOT consult the per-table `write` / `modify` permissions.

The tab strip SHALL therefore be rendered only when `featureFlags.analyticsEnabled` is true **and**
the table's status is `ACTIVE`. With analytics disabled the detail view SHALL render the Properties
content directly, with no tab strip and no Audit or Access tab, and SHALL issue no request to the analytics
activity feed or to the access and row-policy endpoints — the same rendering as the non-`ACTIVE` case above.
The route itself is not guarded —
`/tables/{name}` renders whenever it is reached, today and after this change; hiding the Analytics
menu group is not a route guard, so a bookmarked or pasted link still opens this view and the tab
condition is what keeps an analytics-disabled installation from issuing an activity request. Guarding
the route is a separate concern about the whole tables feature and is out of scope here.

#### Scenario: Properties is the selected tab when the detail view opens

- **WHEN** the user opens the detail view of a table whose `status` is `ACTIVE`
- **THEN** a tab strip showing `Properties`, `Access` (for a viewer who can manage it) and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only schema-metadata summary and the columns grid are shown beneath it

#### Scenario: Header and its actions stay above the tab strip

- **GIVEN** the detail view of a table whose `status` is `ACTIVE`
- **WHEN** the user switches from `Properties` to `Access` or `Audit`
- **THEN** the table name, status badge, kind tag, description row, and every header action button
  the user's permissions allow remain rendered above the tab strip, unchanged

#### Scenario: A viewer who cannot manage access sees two tabs

- **GIVEN** a table whose `status` is `ACTIVE` and a user who is not `FULL_ADMIN`
- **WHEN** the detail view renders
- **THEN** the strip shows `Properties` and `Audit` only, and no request is made to the access or row-policy endpoints

#### Scenario: Audit tab is hidden on a draft table

- **GIVEN** a table whose `status` is `PENDING`
- **WHEN** the user opens its detail view
- **THEN** no tab strip and no `Audit` or `Access` tab are rendered
- **AND** the schema-metadata summary and the draft schema editor are shown directly, as they are
  before this change
- **AND** no request is issued to the analytics activity feed or to the access and row-policy endpoints

#### Scenario: Audit tab needs no permission beyond reading the table

- **GIVEN** a table whose `status` is `ACTIVE`
- **AND** a viewer whose per-table permissions report `write: false` and `modify: false`
- **WHEN** the user opens the table detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **AND** a table whose `status` is `ACTIVE` — so the flag alone decides
- **WHEN** the user reaches `/tables/{name}` by a direct link
- **THEN** no tab strip and no `Audit` or `Access` tab are rendered
- **AND** the schema-metadata summary and the columns grid or draft schema editor are shown directly
- **AND** no request is issued to the analytics activity feed or to the access and row-policy endpoints

### Requirement: Access tab lists a table's roles

The table detail view SHALL offer an **Access** tab to a user for whom `canManageRoles` is true, on a table that has an `ACTIVE` status (see "Table detail view is organized into Properties, Access and Audit tabs"). Its content SHALL be backed by `GET /v1/tables/{name}/access` and `GET /v1/tables/{name}/row-policies` of the data-access service, requested together when the detail view of such a table loads, so the tab's presence is known before the tab is opened.

The tab SHALL NOT be offered when the access read answers `403` — the service requires `TABLE_GRANT` for it, which `FULL_ADMIN` normally carries but an operator may configure away — and that answer SHALL produce no notification, because a user who cannot manage grants has nothing to be told. Any other failure of either request SHALL surface an error notification, SHALL leave the tab offered with an empty roles table, and SHALL keep **Add role** and every row action disabled until a reload succeeds.

The tab SHALL render a roles table with one row per such role, sorted by role name, with these columns:

- **Role**: the role name, with a sensitive indicator when the role is in the `sensitive` list.
- **Get**, **Read**, **Write**, **Modify**: a mark per privilege. A privilege the role holds through its own stored list SHALL show a full mark. A privilege the role holds only by implication — `get` through `read` or `modify` — SHALL show a lighter mark, and a stored list SHALL NOT be reported as expanded by that implication. A privilege the role does not hold SHALL show a neutral placeholder.
- **Rows**: the role's row limit rendered as a readable condition summary when the role has a row policy; otherwise **All rows** when the role holds `read`; otherwise **Cannot read rows**.

A role that has a row policy and no grant SHALL be listed, with every privilege mark neutral and its row limit shown. The roles table SHALL offer a role-name search and two filters, **Can read** and **Rows limited**, applied on the client to the loaded rows. Selecting a row SHALL open the role drawer on that role (see "Role drawer edits one role's access and row limit"); **Add role** SHALL open it on a new role.

Every row SHALL be operable by keyboard, and a row's mark cells SHALL carry an accessible name stating the privilege and whether it is stored or implied.

#### Scenario: A table's roles are listed with their grants

- **GIVEN** a table whose `read` list names `team-x` and whose `write` list names `ingest-bot`
- **WHEN** a `FULL_ADMIN` opens its Access tab
- **THEN** one row is shown for each role, sorted by name
- **AND** `team-x` shows a lighter **Get** mark and a full **Read** mark, and `ingest-bot` shows a full **Write** mark

#### Scenario: The stored list is not shown as expanded

- **GIVEN** a table whose `read` list names `team-x` and whose `get` list is empty
- **WHEN** the tab renders
- **THEN** the **Get** mark of `team-x` is the lighter, implied mark, not the full one

#### Scenario: Rows column states what each role reads

- **GIVEN** `team-x` has a row policy, `pii-analysts` holds `read` and has none, and `ingest-bot` holds only `write`
- **WHEN** the tab renders
- **THEN** `team-x` shows its condition summary, `pii-analysts` shows **All rows**, and `ingest-bot` shows **Cannot read rows**

#### Scenario: A role with only a row policy is listed

- **GIVEN** a role that has a row policy and appears in no grant list
- **WHEN** the tab renders
- **THEN** the role is listed with every privilege mark neutral and its row limit shown

#### Scenario: The tab is hidden when the access read is forbidden

- **GIVEN** a `FULL_ADMIN` whose `GET /access` answers `403`
- **WHEN** the detail view of an `ACTIVE` table loads
- **THEN** no Access tab is offered and no notification is shown

#### Scenario: Another failure is surfaced and keeps the tab

- **WHEN** the access read fails with a status other than `403`
- **THEN** an error notification is shown, the Access tab is offered with an empty roles table, and **Add role** is disabled

#### Scenario: Filters narrow the loaded rows

- **WHEN** the user selects **Can read**
- **THEN** only the roles that hold `read` remain listed, without a new request

### Requirement: Role drawer edits one role's access and row limit

The Access tab SHALL edit a role in a **drawer** that opens over the right edge of the page, keeps the roles table visible, and closes with its close control, with Escape, and with **Cancel**. The drawer SHALL hold the following steps in order, each addressable by a numbered heading:

1. **Role**: for a new role, a single-choice picker over the role catalog described in "Role catalog for the drawer", offering only roles that have no entry on the table; for an existing role, the role's name, read-only. A role that already has an entry is edited by selecting its row.
2. **What it can do**: shown only once a role is chosen (always, for an existing role); four selectable cards — **Get**, **Read**, **Write**, **Modify**. **Get** SHALL show as held, with the note that it comes from **Read** or **Modify**, while either is selected, and SHALL then be neither separately togglable nor stored by this save unless it was already stored.
3. **Sensitive columns**: a switch that grants the sensitive clearance, naming the table's sensitive columns. A note beneath it SHALL state that the clearance belongs to the role and covers everything it can do on this table. This step SHALL be offered only while **Get**, **Read** or **Modify** is held, stored or implied, because the clearance authorizes nothing by itself.
4. **Which rows can it read?**: **All rows** or **Only some rows**. This step SHALL be offered only while **Read** is selected. **Only some rows** reveals the row-limit editor (see "Row-limit editor"). A note in this step SHALL state that the limit also applies to SQL, CSV export and Flight SQL.

On a `system` table, **Write** and **Modify** SHALL be locked and unselected, with the reason that the service feeds system tables so they cannot be written to or changed, and that read access and row limits work as on any table. Steps 3 and 4 SHALL work as on any other table.

The footer SHALL offer the actions **Cancel** and **Save role**.

**Save role** SHALL be disabled until the role is chosen and at least one privilege is held or a row limit is set, and while a request is in flight. It SHALL change the role's membership in each of the five grant lists and nothing else: the drawer SHALL read the table's lists again immediately before saving, add or remove only this role in each list whose membership for it changed, and send only the keys that changed through `PUT /v1/tables/{name}/access`, which merges by key. The roles of every other grantee in every list SHALL be preserved. The row policy SHALL then be saved by a second request (see "Row-limit editor").

A successful save SHALL show a success notification, update the roles table from the service's response, and close the drawer, unless the response reports grants that change nothing (see "Drawer reports grants that change nothing"). A save that fails SHALL show an error notification carrying the service's message and request id, SHALL leave the drawer open with the user's input intact, and SHALL change nothing in the roles table.

Turning **Read** off SHALL leave the role's existing row policy untouched: that policy still narrows the role if it reads the table by another path, and removing it would widen the role's access.

#### Scenario: Adding a role grants Read and implies Get

- **WHEN** the user chooses **Add role**, picks `team-z`, selects **Read**, and saves
- **THEN** `PUT /access` is sent with a `read` list that contains `team-z` and every previous member
- **AND** the roles table shows `team-z` with a full **Read** mark and an implied **Get** mark

#### Scenario: Other roles' membership is preserved

- **GIVEN** the `read` list contains `team-x` and `pii-analysts`
- **WHEN** the user grants **Write** to `ingest-bot` and saves
- **THEN** only the `write` key is sent, and the `read` list is not sent

#### Scenario: The lists are read again before they are changed

- **GIVEN** another admin added `analysts` to the `read` list after this view loaded
- **WHEN** the user grants `team-z` **Read** and saves
- **THEN** the `read` list sent contains `analysts` as well as `team-z`

#### Scenario: Nothing below the role is shown until a role is chosen

- **WHEN** the drawer opens on a new role and no role is chosen
- **THEN** only the **Role** step is shown, with no privilege cards
- **AND WHEN** a role is chosen
- **THEN** the **What it can do** step appears

#### Scenario: Sensitive is offered only with a verb

- **WHEN** no privilege is selected
- **THEN** the **Sensitive columns** step is not offered
- **AND WHEN** **Modify** is selected
- **THEN** the step is offered

#### Scenario: The row step is offered only for Read

- **WHEN** only **Write** is selected
- **THEN** the **Which rows can it read?** step is not offered
- **AND WHEN** **Read** is selected
- **THEN** it is offered with **All rows** chosen for a role that has no row policy

#### Scenario: A system table locks Write and Modify

- **WHEN** the drawer is opened on a `system` table
- **THEN** **Write** and **Modify** are locked with the stated reason, and **Read**, the sensitive switch and the row step behave as on any table

#### Scenario: Turning Read off keeps the row policy

- **GIVEN** a role with a row policy
- **WHEN** the user deselects **Read** and saves
- **THEN** no request to the row-policies endpoint is sent

#### Scenario: A failed save keeps the drawer open

- **WHEN** `PUT /access` fails
- **THEN** an error notification shows the service's message and request id
- **AND** the drawer stays open with the selections unchanged and the roles table unchanged

#### Scenario: The drawer closes with Escape

- **WHEN** the drawer is open and the user presses Escape
- **THEN** it closes without sending a request

### Requirement: Role catalog for the drawer

The role picker SHALL be fed from DIAL Core's own merged role population, and the option rules of the earlier per-table role panel SHALL be kept: the catalog is the union of the roles written through Core's API and the roles declared in Core's configuration file, merged by bare name with an API-written entry superseding a configuration-file entry of the same name, and degrading to whichever population could be read rather than to an empty catalog. The admin backend's roles list SHALL NOT be requested. Each option's value SHALL be the role's bare name, which is the raw provider-role string the service matches against; no resource reference is ever stored.

Options SHALL be presented in alphabetical order, independently of the order the two populations were read in. A role the table already names in any list or policy SHALL always be offered when editing that role, even when the catalog does not contain it, so a grant to a role outside the catalog is never invisible and never silently revoked.

While the catalog is being fetched the picker SHALL show a loading state. A failed catalog fetch SHALL surface its own error notification, distinct from the access-load failure, and SHALL leave the roles already on the table listed and editable.

#### Scenario: Options are ordered alphabetically

- **WHEN** the catalog resolves in an order other than alphabetical
- **THEN** the picker presents its options sorted by name

#### Scenario: The admin backend's roles list is not requested

- **WHEN** the drawer opens
- **THEN** no request is made to the admin backend's roles endpoint

#### Scenario: A granted role outside the catalog stays editable

- **GIVEN** the table's `write` list names a role the catalog does not offer
- **WHEN** the user opens that role's row
- **THEN** the drawer shows that role and a save made after changing only another step keeps the role in the `write` list

#### Scenario: A catalog failure is surfaced independently

- **WHEN** the role catalog fails to load while the table's access loads
- **THEN** an error notification distinct from the access-load failure is shown
- **AND** the roles on the table remain listed

#### Scenario: Roles that already have an entry are not offered for a new role

- **GIVEN** `team-x` already has an entry on the table
- **WHEN** the user opens **Add role**
- **THEN** `team-x` is not offered in the picker

### Requirement: Row-limit editor

When the user chooses **Only some rows**, the drawer SHALL show a row-limit editor that builds a predicate over the table's own columns. The editor SHALL be the filter-condition editor of the Query Builder's Filter section, shared rather than duplicated, and SHALL show the same condition and group controls, operators, value inputs and operator rules for the same column types. It SHALL NOT depend on a Query Builder's state: its columns SHALL be the table's stored columns — sensitive columns included, whatever the viewer sees — and it SHALL offer no function operand, no parameter and no aggregate, because the service refuses a row-policy filter that uses them. A column the table does not store, including a dotted enrichment field, SHALL NOT be offered.

The editor SHALL also offer a **JSON** view of the same predicate in the service's stable filter serialization — the one the Query Builder's JSON view uses — and a predicate that nests deeper than the visual editor can hold SHALL open in the JSON view with a note saying why, without changing it. Editing the predicate in either view SHALL keep the other in step when the predicate is representable visually.

Saving a role with **Only some rows** SHALL send `PUT /v1/tables/{name}/row-policies/{role}` with the body `{"filter": …}`. Saving with **All rows** for a role that has a row policy SHALL send `DELETE /v1/tables/{name}/row-policies/{role}`; a `404` answer to that delete SHALL be treated as success, because it means the policy is already gone. Saving with **All rows** for a role that has no row policy SHALL send nothing to that endpoint. **Only some rows** with an empty predicate SHALL NOT be savable. A visual predicate holding a condition that names no column, or a nested group with no members, SHALL NOT be savable either, and the editor SHALL say so: serialization skips such an element, so what would be stored is wider than what the editor shows. An invalid JSON predicate SHALL NOT be sent, and leaving the JSON view for text that is not a filter (an empty or blank document is an empty predicate, not such text) SHALL keep the JSON view with a message of its own, distinct from the one for a predicate that is too deep.

The two requests of **Save role** are independent. When the grants save succeeds and the row-policy request fails, the drawer SHALL stay open, the roles table SHALL show the saved grants, an error notification SHALL carry the service's message — which names the offending field for a `422` — and the footer's action SHALL become **Save row limit**, which repeats only the row-policy request. The note on screen SHALL state exactly what was saved. A predicate the service rejects for a field the user can see in JSON SHALL have that field highlighted there when the service names it.

#### Scenario: A row limit is saved with the grants

- **WHEN** the user selects **Read**, chooses **Only some rows**, builds `project_id is one of Z-PRJ-3, Z-PRJ-4`, and saves
- **THEN** `PUT /access` is sent, then `PUT /row-policies/{role}` with a `filter` for that predicate

#### Scenario: Switching to All rows removes the limit

- **GIVEN** a role with a row policy
- **WHEN** the user chooses **All rows** and saves
- **THEN** `DELETE /row-policies/{role}` is sent
- **AND** a `404` answer does not produce an error notification

#### Scenario: All rows on a role without a policy sends nothing

- **GIVEN** a role without a row policy
- **WHEN** the user keeps **All rows** and saves
- **THEN** no request to the row-policies endpoint is sent

#### Scenario: A rejected row limit keeps the saved grants

- **GIVEN** the grants save succeeds and the row-policy request answers `422` naming `region`
- **THEN** an error notification shows the service's message
- **AND** the drawer stays open, the roles table shows the saved grants, and the footer action reads **Save row limit**
- **AND WHEN** the user fixes the predicate and chooses **Save row limit**
- **THEN** only the row-policy request is sent again

#### Scenario: A deeply nested predicate opens as JSON

- **GIVEN** a role whose stored predicate nests deeper than the visual editor holds
- **WHEN** the drawer opens on it
- **THEN** the row-limit editor shows the JSON view with a note that the predicate is too deep for the visual editor, and the predicate is unchanged

#### Scenario: Only the table's own columns are offered

- **WHEN** the user adds a condition
- **THEN** the column picker lists the table's stored columns, including a sensitive column, and no dotted enrichment field

#### Scenario: Function operands are not offered

- **WHEN** the user edits a condition in the row-limit editor
- **THEN** no function operand is offered for either side

#### Scenario: An unfinished condition keeps the limit from being saved

- **GIVEN** one condition on `project_id` is filled and a second condition has no column chosen
- **THEN** the editor says an unfinished condition is not stored, and **Save role** is disabled

#### Scenario: An empty JSON document returns to the visual view

- **WHEN** no condition was added, the user switches to the JSON view, and then back to the visual view
- **THEN** the visual view returns with no conditions and no message, and the empty document is not treated as invalid JSON

#### Scenario: Text that is not a filter keeps the JSON view with its own message

- **WHEN** the JSON text is not a filter and the user switches to the visual view
- **THEN** the JSON view stays, with a message that the JSON is not a valid filter, not the too-deep message

#### Scenario: An empty predicate cannot be saved

- **WHEN** **Only some rows** is chosen and no condition has been added
- **THEN** **Save role** is disabled

### Requirement: Drawer reports grants that change nothing

When `PUT /access` answers with `ineffective_grants`, the drawer SHALL stay open after the save, SHALL render one in-drawer banner entry per reported grant beside the card or step it concerns, using the entry's `message` verbatim, and SHALL change its primary action from **Save role** to **Done**. A banner is for a grant that was stored and has no effect — it is not an error and SHALL NOT be shown as a notification. An entry whose `key` is `read` SHALL mark the **Read** card; an entry whose `key` is `sensitive` SHALL mark the sensitive step.

The row limit of a role whose grant changed nothing SHALL still be saved and shown, because a row policy applies to its role whatever path the role reads the table by.

An error response to `PUT /access` — a `403`, a `404`, a `409 table_is_system` or a `422`, including `sensitive_grant_widens` — SHALL be an error notification carrying the service's message and request id, and SHALL NOT be shown as a banner.

#### Scenario: A grant the service reports as redundant shows a banner

- **GIVEN** the service answers with `ineffective_grants` of reason `already_global` for the `read` key
- **THEN** the drawer stays open and the **Read** card carries a banner with the entry's `message`
- **AND** the primary action reads **Done**
- **AND** no notification is shown for it

#### Scenario: Done closes the drawer

- **WHEN** the drawer shows **Done** and the user selects it
- **THEN** the drawer closes without sending a request

#### Scenario: A refusal is a notification

- **WHEN** `PUT /access` answers `422` with the code `sensitive_grant_widens`
- **THEN** an error notification shows the service's message and request id
- **AND** the drawer stays open, nothing is saved, and no banner is shown for it

#### Scenario: A row limit is still saved beside a banner

- **GIVEN** the save reports a redundant grant and the role has a row limit
- **THEN** the row-policy request is sent and the roles table shows the limit

### Requirement: Remove a role from a table

The roles table SHALL offer **Remove role** on each row, which opens a confirmation dialog titled with the role name. The dialog SHALL list what will be removed: the table, the role's privileges (**Read (with Get)** where Get is implied), and its row limit when it has one, and SHALL state that both the access and the row limit are removed and that, if the role also reads every table through its privilege mapping, its users will then see every row of this table.

Confirming SHALL remove the role from every grant list that names it and delete its row policy when it has one: one `PUT /access` sending only the keys that named the role, and one `DELETE /row-policies/{role}`. A `404` answer to that delete SHALL be treated as success. A confirmed removal SHALL show a success notification and drop the role from the roles table. A failure of either request SHALL show an error notification and SHALL leave the roles table reflecting only what was actually removed.

#### Scenario: The dialog names what is removed

- **GIVEN** `team-x` holds `read` and has a row limit
- **WHEN** the user selects **Remove role** on its row
- **THEN** the dialog names `team-x`, the table, **Read (with Get)** and the row limit
- **AND** it warns that the users of the role may then see every row

#### Scenario: Confirming removes grants and policy

- **WHEN** the user confirms
- **THEN** a `PUT /access` carrying only the changed keys without `team-x` is sent and `DELETE /row-policies/team-x` is sent
- **AND** the role disappears from the roles table

#### Scenario: Cancelling changes nothing

- **WHEN** the user cancels the dialog
- **THEN** no request is sent

#### Scenario: A role without a row limit sends no policy delete

- **GIVEN** a role that has no row policy
- **WHEN** the user confirms its removal
- **THEN** no request to the row-policies endpoint is sent

### Requirement: Rows restricted badge

A table whose `permissions.rows_restricted` is true SHALL show a **Rows restricted** badge, with a filter icon, on the table detail header beside the status badge, and in the Tables catalog row beside the table name. The detail header badge SHALL carry a tooltip stating that a row policy limits which rows of the table the user reads through every query surface. The limit itself — the policy's predicate — SHALL NOT be shown or requested for this user. A table whose `rows_restricted` is false or missing SHALL show no such badge.

The badge SHALL be shown to every viewer the service reports confined, whether or not the viewer can manage access.

#### Scenario: A confined user sees the badge

- **WHEN** a table reports `permissions.rows_restricted = true`
- **THEN** the detail header and the catalog row each show **Rows restricted**
- **AND** hovering the header badge shows the explanation

#### Scenario: An unconfined user sees no badge

- **WHEN** a table reports `rows_restricted = false` or omits it
- **THEN** no Rows restricted badge is shown

#### Scenario: The policy is not revealed

- **WHEN** a non-admin user views a table that reports `rows_restricted = true`
- **THEN** no request is made to the row-policies endpoint and no predicate is displayed

### Requirement: Changing a column's sensitivity is locked without the clearance

In the column editor, the **Sensitive** switch SHALL be locked, with a lock icon and a tooltip stating that changing sensitivity needs the sensitive clearance on this table, whenever the viewer's per-table permissions do not report both `modify` and `sensitive`, because the service refuses the change with `403` otherwise. A locked switch SHALL keep its current value visible and SHALL NOT be togglable. The rest of the editor SHALL stay editable.

#### Scenario: The switch is locked without the clearance

- **GIVEN** a viewer with `permissions.modify = true` and `permissions.sensitive = false`
- **WHEN** the column editor opens
- **THEN** the Sensitive switch shows the column's value, is not togglable, and shows the lock with its reason

#### Scenario: The switch is togglable with the clearance

- **GIVEN** a viewer with `permissions.modify = true` and `permissions.sensitive = true`
- **WHEN** the column editor opens
- **THEN** the Sensitive switch can be toggled

### Requirement: Backfill data is offered to a full admin from the Tables toolbar

The Tables page SHALL offer a **Backfill data** button in its toolbar, beside the controls that create a
table, to a full admin. It SHALL be withheld from a caller who is not a full admin, and while a backfill run
is in progress. The button SHALL open the backfill drawer and SHALL NOT start anything itself.

#### Scenario: A full admin sees the button

- **GIVEN** a full admin on the Tables page and no backfill run in progress
- **THEN** the toolbar offers Backfill data

#### Scenario: A caller who is not a full admin sees no button

- **GIVEN** a caller who is not a full admin
- **THEN** the toolbar offers no Backfill data control and the page shows no backfill banner

#### Scenario: A run in progress replaces the button

- **GIVEN** a backfill run in progress
- **THEN** the toolbar offers no Backfill data button and the banner above the listing opens the drawer

### Requirement: A backfill run in progress is stated above the Tables listing

While a backfill run is in progress the Tables page SHALL show a banner above the listing stating that data
is being backfilled, how far it has got as "day N of M", and when it started, with a control that opens the
backfill drawer. The banner SHALL be read from the service's list of runs filtered to running, so it is
present after a reload without the run id being known. It SHALL NOT be shown for a run that has finished.

"Day N of M" SHALL count the days the run has finished, completed or failed, against the range's total; it
SHALL NOT be presented as a percentage.

The console SHALL read the run again on an interval while it is running and SHALL stop when the run reaches
a terminal state or the drawer and banner are no longer shown.

#### Scenario: The banner follows a running run

- **GIVEN** a run covering thirty days that has finished eleven
- **THEN** the banner states day 12 of 30 together with the start time

#### Scenario: A finished run shows no banner

- **GIVEN** the service reports no running run
- **THEN** the Tables listing shows no backfill banner

#### Scenario: A reload finds the run

- **GIVEN** a run started earlier by this or another session
- **WHEN** the Tables page loads
- **THEN** the banner is shown without the console having held the run id

#### Scenario: Polling stops at a terminal state

- **GIVEN** the drawer is open on a running run
- **WHEN** the service reports the run done or failed
- **THEN** the console stops reading it again

### Requirement: The backfill drawer is three blocks: the run, the start form and the retained runs

The backfill drawer SHALL be a modal panel at the right edge of the page, 600px wide, and SHALL be divided into
up to three labelled blocks, each on a background a step lighter than the drawer panel's own rather than behind a border.

The **start form** block SHALL come first, and SHALL be present only while no run is in progress: starting a run
is what a reader opens the drawer for, and it SHALL NOT sit under the figures of the last one. The **run** block
SHALL follow it and present one run: the run the reader has chosen from the list, or else the run in progress, or
else the most recent run. The **retained runs** block SHALL come last and list the runs the service retains, newest first, each by status, range
and the days it finished against the total; choosing one SHALL present it in the run block. The run block is
absent when the service retains no run, and so is the retained runs block — an empty list SHALL NOT be drawn as a
heading over a sentence.

The run's facts SHALL come in one fixed order, the same on the pipeline drawer and named alike: the id (copyable),
the window, then how the run went in rows of figures — days total, days completed, days failed; then rows inserted,
rows skipped, rows dropped — then what else it measured (the date being processed while it runs, files processed),
then start and finish together in one row of their own, finish only once finished. Days completed SHALL be coloured
as a success when above zero and days failed as a failure when above zero; a zero stays the text colour. The failed
days SHALL NOT be listed. What skipped and dropped rows mean SHALL be explained behind an info icon beside each of
those two labels, not in a paragraph. The window SHALL be kept on one line.

The drawer SHALL NOT describe the service's retention under the list.

#### Scenario: A run in progress is the one presented

- **GIVEN** a running run and earlier finished runs
- **WHEN** the drawer opens
- **THEN** the run block presents the running run, there is no start form block, and the list shows all retained runs

#### Scenario: The latest run is presented when none is running

- **GIVEN** no running run and one finished run
- **WHEN** the drawer opens
- **THEN** the start form block comes first and the run block presenting that run follows it

#### Scenario: The blocks come in a fixed order

- **GIVEN** a retained run and none in progress
- **THEN** the blocks are, from the top, the start form, the run, the retained runs

#### Scenario: Choosing a run from the list

- **GIVEN** several retained runs
- **WHEN** the reader chooses an earlier one
- **THEN** the run block presents that run

#### Scenario: No runs are retained

- **GIVEN** the service retains no run
- **THEN** the drawer holds only the start form block, with no run block and no retained runs block

#### Scenario: The three blocks are told apart without borders

- **GIVEN** a retained run and none in progress
- **THEN** the run, the start form and the retained runs are three separate labelled blocks, each on a lighter background than the drawer's

#### Scenario: Skipped and dropped rows are explained beside their labels

- **GIVEN** a presented run
- **THEN** the labels of rows skipped and rows dropped each carry an info icon with their explanation, and the run block has no paragraph about them

#### Scenario: The facts come in one order

- **GIVEN** a presented run
- **THEN** its facts are, in order, the id, the window, days total, days completed, days failed, rows inserted, rows skipped, rows dropped, files processed, start and finish

#### Scenario: Days are coloured by outcome

- **GIVEN** a run that completed 28 days and failed 2
- **THEN** days total, days completed and days failed share one row, days completed reads as a success and days failed as a failure

#### Scenario: Rows share a row too

- **GIVEN** a presented run
- **THEN** rows inserted, rows skipped and rows dropped share one row

#### Scenario: Start and finish share a row

- **GIVEN** a finished run
- **THEN** start and finish are in one row of their own, below the other measures

#### Scenario: Nothing is said about retention

- **GIVEN** retained runs
- **THEN** the retained runs block lists them and carries no sentence about memory or restarts

#### Scenario: The run id can be copied

- **GIVEN** a presented run
- **THEN** its id is shown with a control that copies it

### Requirement: Run status is presented in one vocabulary and never inferred from counts

The console SHALL present the service's `completed` state as **Done**, and its `running` and `failed` states
as Running and Failed. A run that ended before working through its range SHALL be presented as Failed on the
service's state alone: the console SHALL NOT infer an early stop from the counts, because a run that stops
on its last day has counts that sum to the total and is still failed.

A Done run that has failed days SHALL show that: days failed above zero, coloured as a failure. Done SHALL NOT be
presented as clean, and nothing is added beside the status for it. The failed days themselves are not listed.

#### Scenario: An early stop is Failed whatever the counts

- **GIVEN** a failed run whose completed and failed days sum to the total
- **THEN** the console presents it as Failed

#### Scenario: Done with failed days is not clean

- **GIVEN** a run that is done and carries two failed days
- **THEN** the status is Done and days failed reads as a failure

#### Scenario: Failed days are not listed

- **GIVEN** a run whose failed days the service names
- **THEN** the run block does not list them

### Requirement: A backfill range is two inclusive UTC dates within the span limit

The start form SHALL take a first and a last date, both inclusive and both UTC, and SHALL state the number of
days they cover. It SHALL send them to the service as calendar dates, not as moments. It SHALL NOT allow a
last date after today's UTC date, a first date after the last, a missing date, or a span longer than the
span limit, and SHALL disable the start control while the range is not valid. "Today" SHALL be today in UTC,
not in the reader's time zone.

The span limit SHALL be held in one constant, changed together with the service's default. It SHALL be stated
in one place only: the message for a range that exceeds it, which SHALL give the number of days. When the service
refuses a range the console SHALL show the service's own message.

#### Scenario: A valid range enables the start control

- **GIVEN** a first date and a last date no later than today in UTC, within the span limit
- **THEN** the form states the number of days and the start control is enabled

#### Scenario: An invalid range disables the start control

- **GIVEN** a range that is longer than the span limit, ends in the future, or is inverted
- **THEN** the start control is disabled

#### Scenario: A range that is too long names the limit

- **GIVEN** a range longer than the span limit
- **THEN** the message says the range is longer than the limit and gives that number of days

#### Scenario: Today is UTC

- **GIVEN** a reader whose local date differs from the UTC date
- **THEN** the last selectable date is the UTC date

#### Scenario: A refused range reports the service's message

- **GIVEN** the service answers 400 to a range the form accepted
- **THEN** the console shows the service's message

### Requirement: A backfill skips what is already ingested unless asked to re-ingest

Every backfill the console starts SHALL ask the service to skip what it has already ingested, unless the
admin chooses **Re-ingest already ingested data**. The choice SHALL be offered on the start form and beside
**Rerun failed**, SHALL be off by default in both, and SHALL NOT be carried over from the run being re-run,
which does not report how it was started. Beside it the console SHALL state that re-ingesting writes every log
in the range again and that the re-written rows re-trigger the pipelines reading the source tables. A run that
skips ingested data over a range that is already ingested finishes with zero files and zero rows. The service reports the same zero for a range that holds no logs at all, so the
drawer SHALL say, for a Done run with zero files processed, that nothing new was written because the range was
already ingested or holds no logs — and SHALL NOT say which of the two it was, which the service does not report.

#### Scenario: The request skips ingested data

- **WHEN** the console starts a backfill or a re-run without choosing to re-ingest
- **THEN** it sends the range with re-ingest off

#### Scenario: Re-ingest is chosen on the start form

- **WHEN** an admin chooses re-ingest on the start form and starts a backfill
- **THEN** the console sends the range with re-ingest on

#### Scenario: A re-run re-ingests only when chosen

- **GIVEN** a finished run that offers **Rerun failed**
- **WHEN** an admin chooses re-ingest beside it and re-runs
- **THEN** the console sends the re-run range with re-ingest on
- **AND** the choice starts off for every run presented, whichever way that run was started

#### Scenario: The cost is stated beside the choice

- **WHEN** the re-ingest choice is offered
- **THEN** it says that every log in the range is written again and that the re-written rows re-trigger the
  pipelines reading the source tables
- **AND** beside **Rerun failed** it says that the days of the re-run range that succeeded are written again too

#### Scenario: A run that wrote nothing says why it may have

- **GIVEN** a Done run that processed no files
- **THEN** the drawer states that nothing new was written, because the range was already ingested or holds no logs

### Requirement: A finished run can be re-run from its first failed day

A run that is Done and carries failed days, or that is Failed, SHALL offer **Rerun failed**, and only when no run
is in progress. The control starts the re-run from the run's earliest failed day. The re-run SHALL cover the earliest failed day through the last day
of the original range, because a run that stopped early names only the days it attempted and leaves the rest
unattempted. A Failed run that named no failed day SHALL re-run its whole original range.

A Done run with no failed day SHALL offer no re-run.

#### Scenario: A Done run with failed days

- **GIVEN** a Done run over a range whose failed days are the fourth and the seventeenth
- **THEN** Rerun failed is offered, and starts a run from the fourth through the last day of the original range

#### Scenario: A Failed run covers its unattempted days

- **GIVEN** a Failed run that stopped on the seventeenth of a range ending on the thirtieth, and named the fourth and the seventeenth as failed
- **THEN** the re-run covers the fourth through the thirtieth

#### Scenario: A Failed run that named no failed day

- **GIVEN** a Failed run that stopped before attempting any failing day, over a range from the first through the thirtieth
- **THEN** Rerun failed is offered, and covers the first through the thirtieth

#### Scenario: No re-run while another run is in progress

- **GIVEN** a run in progress
- **THEN** no run offers a re-run

#### Scenario: A clean Done run offers no re-run

- **GIVEN** a Done run with no failed day
- **THEN** no re-run is offered

### Requirement: A refused start reports the service's message

When the service refuses to start a backfill the console SHALL show the service's own message and SHALL leave
the form as it was. This includes a refusal because a run is already in progress, because the backfill is
switched off in the service's configuration, and because the range is invalid. The console SHALL NOT hide the
Backfill data button on the basis of a probe: the service reports that backfill is switched off only when a
start is attempted.

#### Scenario: A run is already in progress

- **GIVEN** the service answers a start with a conflict
- **THEN** the console shows its message and the form remains

#### Scenario: Backfill is switched off

- **GIVEN** the service answers a start with its backfill-disabled refusal
- **THEN** the console shows its message

### Requirement: The backfill drawer closes when the reader moves away from it

The backfill drawer SHALL close through its close control, on Escape, and when the scrim around the panel is pressed.
A press on something that is outside the panel but opened from inside it — a calendar's popup — SHALL NOT close it,
and neither SHALL a press that began inside the panel and ended on the scrim, such as dragging a text selection out.
Closing SHALL discard nothing the reader would miss: the form holds two dates. While it is closed the drawer SHALL
not be mounted, so each opening reads the service afresh.

#### Scenario: A press on the scrim closes it

- **GIVEN** the drawer open
- **WHEN** the reader presses the page around the panel
- **THEN** the drawer closes

#### Scenario: Choosing a date does not close it

- **GIVEN** the drawer open with a calendar's popup showing
- **WHEN** the reader chooses a day
- **THEN** the popup closes, the drawer stays open, and the date is in the form

#### Scenario: The close control and Escape close it

- **GIVEN** the drawer open
- **WHEN** the reader presses its close control, or Escape
- **THEN** the drawer closes

#### Scenario: A drag out of the panel does not close it

- **GIVEN** a press that began inside the panel
- **WHEN** it ends on the scrim
- **THEN** the drawer stays open

