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

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Manage access** SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system).
- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown regardless of permission, as the header's primary action, for every `ACTIVE` **source** table and for every `ACTIVE` **enrichment** table whose payload names a source table (see "Table detail Connect panel").
- **Add rows** SHALL NOT be offered for an **enrichment** table whatever its `write` permission reports: those rows come from the enrichment process, so a hand-written insert is not a path this UI offers.
- For an `ACTIVE` table, **Add columns** (schema evolution) and **Add rows** (inserting rows) SHALL each be offered as its own standalone header button — **not** as items of a shared dropdown. **Add columns** SHALL be shown only when `canModify` and **Add rows** only when `canWrite`; when neither permission is held, neither button renders. Both SHALL render as neutral actions, never primary and never dependent on whether the other is present, so each keeps the same appearance whatever the viewer's other permissions are. **Add rows** is deliberately not the emphasized way to put data in the table — see "Table detail row writes".
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Header actions SHALL be ordered **Manage access, Delete table, Add columns, Add rows, Connect** — the primary action last, where the header's primary action already sits. A not-yet-`ACTIVE` table shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and materialize a table schema".

Because the backend reports `permissions {false,false}` for system tables, the write/modify-gated affordances (Add rows, Add columns, per-column edit/drop, inline rename, description edits) hide for system tables without a separate check. **Manage access** and **Delete table** are gated on `FULL_ADMIN`, which the backend does not scope per-table, so each carries its own explicit `!table.system` check.

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

#### Scenario: Manage access is hidden for a system table even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail page
- **THEN** the "Manage access" button is absent

#### Scenario: A system table still offers Connect

- **WHEN** a user opens an `ACTIVE` system table's detail page
- **THEN** **Connect** is present while **Add rows**, **Add columns**, **Manage access**, and **Delete table** are all absent

#### Scenario: An enrichment table offers Connect but never Add rows

- **WHEN** a user opens an `ACTIVE` enrichment table's detail page and its payload names a source table
- **THEN** **Connect** is present as the header's primary action
- **AND** no **Add rows** action is present, whatever the table's `write` permission reports

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
- **THEN** the actions appear in the order Manage access, Delete table, Add columns, Add rows, Connect

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

### Requirement: Full-admin per-table role management panel

The table detail view SHALL provide a panel to view and manage the table's `write` / `modify` provider-role lists, backed by `AnalyticsDataApi.getTableAccess` / `replaceTableAccess` (`GET` / `PUT /v1/tables/{name}/access`) and a `TableAccess { write: string[]; modify: string[] }` model. Because the backend restricts `GET /access` to `FULL_ADMIN` and system tables carry no per-table roles to manage, the panel SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system); a save SHALL full-replace the lists via `replaceTableAccess`.

Role names SHALL be picked from a closed option list rather than typed. The catalog behind that list SHALL be DIAL Core's own merged role population — the union of the roles written through Core's API and the roles declared in Core's configuration file, merged by bare name with an API-written entry superseding a configuration-file entry of the same name, and degrading to whichever population could be read rather than to an empty catalog. The admin backend's roles list SHALL NOT be requested: it is a third copy that is neither population, it can hold a role Core does not, and it is being retired — every other role picker in the application already reads Core. Each option's value SHALL be the role's bare name, which is the raw provider-role string the backend matches against; there is no separate role id, and no resource reference is ever stored.

The options SHALL be presented in alphabetical order, independently of the order the two populations were read in, so a role can be found by name.

The options SHALL additionally include every role name the table already grants, even when the catalog does not offer it. A closed select renders only the values that match an option, so without this a grant naming a role outside the catalog — one declared only in Core's configuration file, or any of them when the catalog read failed — would be invisible and would be dropped by the next unrelated edit, silently revoking access that is still in effect.

While the initial fetch (the table's current access and the role catalog, requested together) is in flight the panel SHALL show a loading spinner in place of the role pickers. A failed access fetch and a failed role-catalog fetch SHALL each surface their own error notification (the two requests can fail independently); Save SHALL stay disabled until the access fetch succeeds. A failed role-catalog fetch SHALL still leave the table's existing grants selected and selectable rather than emptying the lists.

#### Scenario: Full admin edits the role lists

- **WHEN** a `FULL_ADMIN` opens the role panel, checks a role in the `write` list, and saves
- **THEN** `replaceTableAccess` is called with the full updated `{write, modify}` lists

#### Scenario: Panel hidden for non-admins

- **WHEN** the detail view renders for a user who is not `FULL_ADMIN`
- **THEN** the role-management panel is not shown

#### Scenario: Panel hidden for system tables even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail view
- **THEN** the role-management panel is not shown

#### Scenario: Loading spinner while fetching

- **WHEN** the panel opens
- **THEN** a loading spinner is shown until both the table's current access and the role catalog have been fetched

#### Scenario: Every catalog role is offered, not just the granted ones

- **WHEN** the role catalog loads
- **THEN** each write/modify picker offers every catalog role as an option, with already-granted roles selected

#### Scenario: Options are ordered alphabetically

- **WHEN** the catalog resolves in an order other than alphabetical
- **THEN** each picker presents its options sorted by name

#### Scenario: The admin backend's roles list is not requested

- **WHEN** the panel opens
- **THEN** no request is made to the admin backend's roles endpoint

#### Scenario: A granted role outside the catalog stays offered and survives a save

- **WHEN** the panel opens for a table whose stored `write` list contains a role the catalog does not offer
- **THEN** that role is offered as a selected option in the `write` picker
- **AND** a save made after editing only the `modify` list sends the `write` list back unchanged

#### Scenario: Roles-catalog fetch failure is surfaced independently

- **WHEN** the role catalog fails to load even though the table's current access loads successfully
- **THEN** an error notification distinct from the access-load-failure notification is shown
- **AND** the roles the table already grants remain offered and selected

### Requirement: System-owned tables are read-only

The catalog and detail views SHALL reflect the table's server-provided `system` flag. System-owned tables are seeded server-side and reject every modifying request (`409 table_is_system`), so the UI SHALL NOT offer modify actions for them: in the catalog the row's delete action SHALL be hidden and a System indicator SHALL be shown; in the detail view the manage-access / delete-table / write-rows / add-columns actions and the per-column edit/drop actions and inline rename SHALL be suppressed, replaced by a read-only indicator. System tables SHALL remain fully viewable and navigable, including their column display names and descriptions.

#### Scenario: System table in the catalog

- **WHEN** the catalog lists a table whose `system` flag is true
- **THEN** the row shows a System indicator
- **AND** the row's delete action is not offered

#### Scenario: System table detail is read-only

- **WHEN** the user opens a system table's detail page
- **THEN** the manage-access, delete-table, write-rows, and add-columns actions are absent and a read-only indicator is shown
- **AND** the column grid offers no edit/drop actions and no inline editing
- **AND** the table, its columns, and their display names and descriptions remain viewable

### Requirement: Analytics table role capability model

The system SHALL expose, on `AppContext`, the capability inputs for Analytics tables: `isFullAdmin`
(true when authentication is disabled, or when `userInfo.roles` includes `FULL_ADMIN`), the existing
`isReadOnlyAdmin`, and `isEnableAuth`. The `AnalyticsTable` model SHALL carry an optional
`permissions: { write: boolean; modify: boolean }` object supplied by the data-access service. A hook
`useAnalyticsTablePermissions(table?)` (`src/hooks/`) SHALL derive:

- `canCreate` SHALL equal `isFullAdmin`.
- `canDelete` and `canManageRoles` SHALL equal `isFullAdmin && !table.system`.
- `canWrite` SHALL equal `table.permissions.write` when present, otherwise `!isEnableAuth`.
- `canModify` SHALL equal `table.permissions.modify` when present, otherwise `!isEnableAuth`.

#### Scenario: Full admin can act on a non-system table

- **WHEN** authentication is enabled, the user is `FULL_ADMIN`, and a non-system table reports
  `permissions {write:true, modify:true}`
- **THEN** `canCreate`, `canDelete`, `canManageRoles`, `canWrite`, and `canModify` are all `true`

#### Scenario: Per-table write without modify

- **WHEN** a table reports `permissions {write:true, modify:false}` and the user is not `FULL_ADMIN`
- **THEN** `canWrite` is `true`, `canModify` is `false`, and `canCreate`/`canDelete`/`canManageRoles`
  are `false`

#### Scenario: System table exposes no edits, even for a full admin

- **WHEN** a system table reports `permissions {write:false, modify:false}` (as the backend does for
  every caller) and the user is `FULL_ADMIN`
- **THEN** `canWrite`, `canModify`, `canDelete`, and `canManageRoles` are all `false`

#### Scenario: Missing permissions default safely

- **WHEN** a table omits `permissions` and authentication is enabled
- **THEN** `canWrite` and `canModify` are `false`; **AND WHEN** authentication is disabled they are
  `true`

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

The UI SHALL surface a table's lifecycle `status` (`PENDING`, `ACTIVE`, `FAILED`) with a status badge that reuses the established admin sync-status badge approach (an enum→label and enum→color-token mapping rendered as an uppercase rounded pill, mirroring `Common/SyncCoreStatus/CoreSyncStatusBadge`). The badge SHALL render `PENDING` as "Draft", `ACTIVE` as "Active", and `FAILED` as "Failed", using the theme color tokens (warning / success / error respectively). The badge SHALL appear in the table detail header and in the catalog grid. The UI SHALL NOT poll for status — status changes only in response to the user's own schema-definition submission, and the badge reflects the last fetched definition.

#### Scenario: Detail header shows the status badge

- **WHEN** the table detail view renders
- **THEN** a status badge for the table's current `status` is shown next to the title

#### Scenario: An active table reads as Active

- **WHEN** a table's `status` is `ACTIVE`
- **THEN** its badge renders the "Active" (success) state

### Requirement: Define and materialize a table schema

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (a single **Name** field, used as both the column's exposed name and its physical source name since the two are always equal at definition time, type, nullable, optional tag, optional display name, optional description, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared column names, an optional partition (a temporal column + a day/month/year granularity), and an optional scan-metadata pair (`identity_column` and `version_column`); for an **enrichment**, its columns plus a grain key chosen from its source table's columns. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, tag length, display-name length, and description length exactly as the create/add-columns editor validates today, against both the exposed-name and source-name uniqueness constraints (which the merged Name field satisfies identically).

The **display name** and **description** fields SHALL be optional and SHALL be presented inline on the column row alongside its other fields, with field labels rendered on the first row only, as the row's existing fields already are. A blank value SHALL be valid and SHALL be omitted from the submitted column, exactly as a blank tag is — the service treats an absent metadata field as "not set". A display name longer than 128 characters or a description longer than 1024 characters SHALL be rejected client-side with a per-row validation message and SHALL disable Save, because the service answers 422 for either (the same caps and the same message the per-column edit modal already applies).

An Array-typed column row SHALL offer an additional element-type selector, restricted to the non-array, non-object column types (no nested arrays or objects). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column.

For a **source** table, the Partition column field's label SHALL carry an info affordance whose text includes the fact that only Date/Timestamp-typed columns are selectable, since that restriction is not otherwise visually obvious; the affordance and the rest of its text follow "Table schema keys are explained where they are chosen and where they are read". The Granularity field SHALL be rendered only once a partition column is selected; deselecting the partition column (including indirectly, by retyping the selected column away from Date/Timestamp) SHALL also clear any chosen granularity.

For a **source** table only, the surface SHALL offer two additional optional selects — **Identity column** and **Version column** — the pair the governed incremental scan pages a source by. An **enrichment** SHALL offer neither (the backend rejects either member for an enrichment with 422). The Identity column options SHALL be the declared columns that are non-nullable and not sensitive; the Version column options SHALL be that same set narrowed to `Timestamp`-typed columns (`Date` SHALL NOT be offered — the backend requires `timestamp`). Both labels SHALL carry an info affordance stating that these values are promises the service does not verify (the version is assigned at ingest, monotonic, and never backdated; the identity is unique per row) — see "Table schema keys are explained where they are chosen and where they are read" for the affordance and the rest of its text.

Because the scan requires **both** members and the backend accepts one alone — producing a table that is permanently unscannable, since `POST /v1/tables/{name}/schema` answers 409 once the table is `ACTIVE` and no `PATCH` member sets the pair — the surface SHALL treat the pair as all-or-nothing: while exactly one of the two is chosen, Save SHALL be disabled and the empty field SHALL show a validation message naming the other as required alongside it. Choosing neither SHALL be valid and SHALL leave the table unscannable, which is the correct declaration for a source whose row identity is its whole ordering key.

A selection SHALL be cleared when the column it references stops qualifying — renamed, removed, retyped, or flipped to nullable or sensitive in the column rows — so the submission can never carry a stale or now-invalid column name. For a `FAILED` table, both selects SHALL be seeded from the values the definition already stores, because an omitted member leaves any stored value unchanged rather than clearing it; when the definition stores either member, both selects SHALL be required (the pair cannot be cleared by re-posting).

Submitting the schema (a header **Save** action) SHALL send the whole document via `defineTableSchema` (`POST /v1/tables/{name}/schema`), which defines the schema **and** materializes the table in the same call — there is no separate save-draft step, and no way to persist an incomplete schema. Each submitted column SHALL carry `display_name` and `description` only when the corresponding field is non-blank, and SHALL omit either key otherwise. The submitted payload SHALL carry `identity_column`/`version_column` only when chosen, and SHALL omit either key when unset. Save SHALL be disabled until the schema is complete for its kind (a source needs at least one valid column, a non-empty ordering key, and a complete-or-absent scan-metadata pair; an enrichment needs a grain key), since the backend rejects an incomplete submission (422) without persisting it. On success the view SHALL refresh showing the table `ACTIVE` with its live column surface. On a backend (ClickHouse) failure the table becomes `FAILED`; the detail view SHALL present the same schema-definition surface with an indication that activation failed, allowing the user to adjust the schema and resubmit. While the table is not `ACTIVE`, the write-rows action SHALL NOT be offered.

#### Scenario: Save is gated on a complete schema

- **WHEN** a source table's schema has no ordering key (or no columns), or an enrichment's schema has no grain key
- **THEN** the Save action is disabled
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
- **AND** its hint text states that only Date/Timestamp columns are selectable

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

- **WHEN** the column currently chosen as the Version column is retyped away from `Timestamp`, renamed, removed, or flipped to nullable or sensitive
- **THEN** the Version column selection is cleared, so the submission cannot carry a stale or invalid column name

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
| Ordering key | Rows are stored in this order, and filtering or sorting by the key's leading columns reads only part of the table; the most-filtered columns belong first |
| Partition column | Rows are grouped into time chunks and a query filtered on this column skips the chunks it does not cover; most tables need no partition; only Date and Timestamp columns are eligible |
| Granularity | How much time one chunk covers, and that too many small chunks read slower rather than faster |
| Identity column | With Version column, it lets pipelines read the table in batches without handling a row twice; the value must differ in every row, uniqueness is not validated, and repeated values cause skipped rows; eligible columns are non-empty and not sensitive |
| Version column | It is how a pipeline tells which rows are new since its last pass; the value is expected at write time and must never move backwards, is not validated, and a backdated value causes missed rows; eligible columns are non-empty, non-sensitive Timestamp columns |
| Grain key | It links this table to its source table, a row attaches to every source row carrying the same value, and only one row is kept per value — a repeated key replaces the previous row |

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
nothing about a list of values otherwise suggests it.

Each value SHALL be validated client-side against the service's rules, with a per-value message and Save
disabled while any is violated:

- at least **1** and at most **512** values
- each value non-blank after trimming
- each value at most **64** characters
- values **distinct after trimming** — two entries differing only in surrounding whitespace collide

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

#### Scenario: Declared values are submitted in the authored order

- **WHEN** the user declares an enum column with the values `low`, `medium`, `high` in that order and saves a
  complete schema
- **THEN** that column in the submitted payload carries `enum_values` `["low", "medium", "high"]` in that order

#### Scenario: Reordering the list changes what is submitted

- **WHEN** the user reorders a declared enum column's values so that `high` precedes `low`
- **THEN** the submitted `enum_values` carries the new order

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

The **catalog list's** row action menu SHALL let the user edit a table's catalog metadata — its `description` and its per-table `tag_order` — in any status, via `updateTable` (`PUT /v1/tables/{name}`). `tag_order` SHALL be presented as a reorderable list of the distinct tags currently declared on the table's columns, and the resulting ordered list of tag names SHALL be sent to the backend; an empty order SHALL clear it and an unchanged order SHALL be left as-is (merge-patch semantics). On success the catalog SHALL refresh from the server. This surface SHALL NOT be offered for system-owned tables, and SHALL NOT be offered from the table detail view.

#### Scenario: Description is edited via the table update endpoint

- **WHEN** the user activates a row's edit action, changes the table description, and submits
- **THEN** `updateTable` is sent with the new description and the catalog refreshes

#### Scenario: Tag order is reordered and saved

- **WHEN** the user reorders the table's column tags and submits
- **THEN** `updateTable` is sent with the ordered `tag_order` list and the catalog refreshes

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
- `timestamp` — a **space-separated** `YYYY-MM-DD HH:MM:SS.mmm` literal, which is what the insert path accepts; an ISO-8601 `T` separator or `Z` suffix is rejected on write
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

The timestamp entry SHALL state the write format **and** that queries return ISO-8601, so the reader learns the two directions differ rather than discovering it from a rejected insert.

Rules that are not per-column SHALL be stated separately from the per-column list. These are the write batch maximum (10 000 rows per request) and, on the Read tab, the row limits below.

The Read tab SHALL state the row limits per surface, because they differ in kind and not only in value:

- **REST** (`/v1/queries/execute-sql`) — a query with no `LIMIT` runs with a default of 100; an explicit `LIMIT` above 1 000 is **rejected**, not reduced.
- **Flight SQL** — an oversized `LIMIT` is **clamped** to the endpoint's cap, never rejected; a query whose result exceeds that cap fails outright and returns no partial page. The cap is deployment-configured, so the panel SHALL describe it rather than printing a number.

After the write snippets — not before them, since the generated snippet already satisfies the rules above — the panel SHALL surface the two likeliest rejections, phrased as the message the caller sees and what to change: an unknown column, and an authorization failure. The unknown-column rejection SHALL be presented as one message covering both a mistaken display name and a `_`-prefixed platform column, because the backend does not distinguish them.

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

#### Scenario: Timestamp columns use the insert format and name the asymmetry

- **WHEN** a table has a `timestamp` column
- **THEN** its value in the write snippets is a space-separated `YYYY-MM-DD HH:MM:SS.mmm` literal, with no `T` separator and no `Z` suffix
- **AND** the format guidance states that queries return that column as ISO-8601

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

- **WHEN** the conversations page is loaded twice in succession by the same caller within the entry's lifetime
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

### Requirement: Table detail view is organized into Properties and Audit tabs

The table detail view (`/tables/{name}`) SHALL, for a table whose `status` is `ACTIVE`, present its
content under a horizontal tab strip with exactly two tabs, **Properties** and **Audit**, in that
order. `Properties` SHALL be the selected tab when the view is first opened.

The view header — the table name, the lifecycle status badge, the kind tag, the system tag, the
description row, and the whole header action row (Manage access, Delete table, Add columns, Add rows,
Connect, and the draft **Save** action) — SHALL render **above** the tab strip and SHALL be unchanged
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
view SHALL render no tab strip and no Audit tab, SHALL render the Properties content directly, and
SHALL issue no request to the analytics activity feed. A table that has not been materialized has no
audit history for the tab to show: it has no columns, and the analytics activity feed returns zero
activities for its name, so the tab could only ever be empty. On an `ACTIVE` table the Audit tab SHALL
require no permission beyond the one that already allows reading the table, and SHALL NOT consult the
per-table `write` / `modify` permissions.

The tab strip SHALL therefore be rendered only when `featureFlags.analyticsEnabled` is true **and**
the table's status is `ACTIVE`. With analytics disabled the detail view SHALL render the Properties
content directly, with no tab strip and no Audit tab, and SHALL issue no request to the analytics
activity feed — the same rendering as the non-`ACTIVE` case above. The route itself is not guarded —
`/tables/{name}` renders whenever it is reached, today and after this change; hiding the Analytics
menu group is not a route guard, so a bookmarked or pasted link still opens this view and the tab
condition is what keeps an analytics-disabled installation from issuing an activity request. Guarding
the route is a separate concern about the whole tables feature and is out of scope here.

#### Scenario: Properties is the selected tab when the detail view opens

- **WHEN** the user opens the detail view of a table whose `status` is `ACTIVE`
- **THEN** a tab strip showing `Properties` and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only schema-metadata summary and the columns grid are shown beneath it

#### Scenario: Header and its actions stay above the tab strip

- **GIVEN** the detail view of a table whose `status` is `ACTIVE`
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the table name, status badge, kind tag, description row, and every header action button
  the user's permissions allow remain rendered above the tab strip, unchanged

#### Scenario: Audit tab is hidden on a draft table

- **GIVEN** a table whose `status` is `PENDING`
- **WHEN** the user opens its detail view
- **THEN** no tab strip and no `Audit` tab are rendered
- **AND** the schema-metadata summary and the draft schema editor are shown directly, as they are
  before this change
- **AND** no request is issued to the analytics activity feed

#### Scenario: Audit tab needs no permission beyond reading the table

- **GIVEN** a table whose `status` is `ACTIVE`
- **AND** a viewer whose per-table permissions report `write: false` and `modify: false`
- **WHEN** the user opens the table detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **AND** a table whose `status` is `ACTIVE` — so the flag alone decides
- **WHEN** the user reaches `/tables/{name}` by a direct link
- **THEN** no tab strip and no `Audit` tab are rendered
- **AND** the schema-metadata summary and the columns grid or draft schema editor are shown directly
- **AND** no request is issued to the analytics activity feed

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

