## MODIFIED Requirements

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure
- `POST /v1/queries/execute-sql` — execute an ad-hoc SQL SELECT (body `{ sql }`); exposed as `executeSqlAction`, returning a `ServerActionResponse` with the same result envelope as `execute`
- `POST /v1/queries/translate` — translate a structured query to the external-dialect SQL subset (validation only, no execution); exposed as `translateAction`, returning a `ServerActionResponse<{ sql }>`
- `POST /v1/queries/translate-sql` — translate a SQL SELECT to the structured DSL (body `{ sql }`, validation only, no execution); exposed as `translateSqlAction`, returning a `ServerActionResponse<{ query }>`

Tables endpoints (base path `/v1/tables`):
- `GET /v1/tables` — list tables; the response is wrapped as `{ tables: [...] }` and the client SHALL unwrap it to a bare array
- `POST /v1/tables` — create a table or enrichment; **identity-only** (`{name, type, description?}`, plus `source_table` for an enrichment). It SHALL NOT send `columns` or any physical key; the created table is returned in `status=PENDING`
- `GET /v1/tables/{name}` — read one table by name
- `PUT /v1/tables/{name}` — update table catalog metadata (`description`, `tag_order`); exposed as `updateTable`, returning a `ServerActionResponse`
- `DELETE /v1/tables/{name}` — delete a table by name
- `POST /v1/tables/{name}/schema` — define the complete physical schema of a not-yet-materialized table (columns + physical keys) **and** materialize it in the same call (issues `CREATE TABLE`, flips to `ACTIVE`); exposed as `defineTableSchema`, returning a `ServerActionResponse`
- `PATCH /v1/tables/{name}/schema` — evolve a materialized (`ACTIVE`) table's columns; exposed as `updateTableSchema`
- `POST /v1/tables/{name}/rows` — insert rows into a table

#### Scenario: Client targets the Analytics data-access host

- **WHEN** `analyticsDataApi` is instantiated in `app/api/api.ts`
- **THEN** it is constructed with `host: process.env.DIAL_ANALYTICS_API_URL`

#### Scenario: Client covers the queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, `POST /v1/queries/execute` via `executeAction`, `POST /v1/queries/execute-sql` via `executeSqlAction`, `POST /v1/queries/translate` via `translateAction`, and `POST /v1/queries/translate-sql` via `translateSqlAction`

#### Scenario: Client covers the tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables` (identity-only), `GET /v1/tables/{name}`, `PUT /v1/tables/{name}` via `updateTable`, `DELETE /v1/tables/{name}`, `POST /v1/tables/{name}/schema` via `defineTableSchema`, `PATCH /v1/tables/{name}/schema` via `updateTableSchema`, and `POST /v1/tables/{name}/rows`

### Requirement: Create table (source or enrichment)

Creating a table SHALL open a form popup that is mounted only while open, so closing discards its state without a manual reset; the form SHALL be held as a single object seeded when the popup opens (enrichment defaults derived from the first source table). Create SHALL be **identity-only**: a **source** table SHALL collect a name and optional description; an **enrichment** table SHALL collect a name, optional description, and a source table. The popup SHALL NOT collect columns, ordering key, partition, or grain key — the physical schema is defined afterwards on the table detail view. Submit SHALL build the type-discriminated identity-only create payload, and on success SHALL show a success notification and route to the created table's detail view; the created table is in `PENDING` (not yet materialized) status.

#### Scenario: Popup state is discarded on close

- **WHEN** the user opens the create popup, edits fields, and closes it
- **THEN** re-opening the popup shows a fresh, empty form

#### Scenario: Create sends identity only

- **WHEN** the user creates a source (name + optional description) or an enrichment (name + source table + optional description) and submits
- **THEN** the create payload carries only identity/metadata fields and no `columns` or physical key
- **AND** on success the user is routed to the new table's detail view, which shows the table as a draft (`PENDING`)

#### Scenario: Enrichment requires a source table

- **WHEN** the user opens the create-enrichment popup
- **THEN** it offers a source-table selection whose value is required to submit

### Requirement: Tables catalog page

The Tables page SHALL render the tables the page fetched as a grid with columns for name, type, description, column count, and lifecycle status. The status SHALL be shown with the table status badge (Draft / Active / Failed). Clicking a row (other than the actions column) SHALL navigate to that table's detail page. Each row SHALL offer an action menu with **edit** and **delete** entries, mirroring the columns grid's own per-row action menu (one kebab icon; both entries hidden for system-owned tables); delete's confirmation dialog SHALL use the danger (red confirm) variant. The **edit** action SHALL open the table-metadata edit surface (see "Table metadata editing"). The header SHALL provide actions to create a source table and to create an enrichment table. After a successful create, edit, or delete the catalog SHALL refresh client-side.

#### Scenario: Catalog lists tables with navigation

- **WHEN** the catalog renders with tables
- **THEN** each table appears as a row with its name, type, description, column count, and status badge
- **AND** clicking a row navigates to that table's detail page

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

The Table detail page SHALL branch on the table's lifecycle `status`. The **live** column-management surface described here SHALL be offered only when the table is `ACTIVE`; for a `PENDING`/`FAILED` table the detail view SHALL instead offer the schema-definition surface (see "Define and materialize a table schema").

For an `ACTIVE` table, the detail page SHALL show the table's columns in a grid (name, source name, type, tag, display name, description, nullable rendered as a true/false value); long display name/description values SHALL be truncated with the full value reachable via an ellipsis tooltip. A column whose `sensitive` flag is true SHALL show a marker (a colored dot with a "Sensitive" tooltip) rendered inline in the name cell, after the name; non-sensitive columns SHALL show no marker. Each column row SHALL offer a per-column action menu with **edit** and **delete (drop)** actions. The column name SHALL also be editable inline in the grid.

The edit action SHALL open a unified edit modal seeded with the column's current name, display name, tag, description, and sensitive flag. The name field SHALL be required (submit disabled while blank) and SHALL be disabled for columns the backend does not allow to rename (grain-key, ordering-key, and `_`-prefixed system columns) while the metadata fields remain editable. Blank display name, tag, or description values SHALL be valid input meaning "clear the value"; the sensitive flag SHALL be toggled with a switch. On submit the modal SHALL diff the form against the original column and send a **single** schema patch: a structural `rename` op when the name changed, plus a **single `update` merge-patch entry** carrying the target column name and only the metadata fields (tag, display name, description, sensitive) that changed. Within the `update` entry an omitted field leaves that attribute unchanged, a blank string value clears it, a non-blank string value sets it, and the boolean `sensitive` is sent as `true`/`false` when toggled. When a rename is included, the `update` entry SHALL reference the new (post-rename) column name. Submit SHALL be disabled when no field changed.

Adding columns SHALL be available from the header via a form popup reusing the column-row editor, including its element-type control and disabled-Nullable behavior for Array-typed rows (see "Define and materialize a table schema"). Every live schema change SHALL be sent as a schema patch to `updateTableSchema` (`PATCH /v1/tables/{name}/schema`), and on success the detail view SHALL refresh from the server. Deleting the whole table and editing its catalog metadata (description/tag order) SHALL NOT be offered from this view — both live only in the catalog list's row action menu (see "Tables catalog page").

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

#### Scenario: Adding an array column requires an element type

- **WHEN** the user adds a column typed Array in the add-columns popup without choosing an element type
- **THEN** submit is disabled until an element type is chosen

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- For an `ACTIVE` table, **Add rows** (inserting rows) and **Add columns** (schema evolution) SHALL be offered as items of a single header **Add** dropdown rather than two standalone buttons; **Add rows** SHALL be shown only when `canWrite`, **Add columns** only when `canModify`, and the dropdown itself SHALL NOT render when neither is available.
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Header actions SHALL be ordered **Manage access, Delete table, Add** (a not-yet-`ACTIVE` table shows **Save** in place of **Add** — see "Define and materialize a table schema").

Because the backend reports `permissions {false,false}` for system tables, these edit affordances hide for system tables without a separate check.

#### Scenario: Write-capable, not modify-capable

- **WHEN** a table reports `permissions {write:true, modify:false}`
- **THEN** the header **Add** dropdown offers **Add rows** but not **Add columns**, and the per-column action column and inline rename are absent

#### Scenario: Modify-capable, not write-capable

- **WHEN** a table reports `permissions {write:false, modify:true}`
- **THEN** the schema-edit affordances and per-column action column are present, and the header **Add** dropdown offers **Add columns** but not **Add rows**

#### Scenario: Neither capability hides the Add dropdown entirely

- **WHEN** a table reports `permissions {write:false, modify:false}`
- **THEN** the header **Add** dropdown is not rendered at all

#### Scenario: Delete stays admin-only

- **WHEN** a non-system table reports edit permissions but the user is not `FULL_ADMIN`
- **THEN** the "Delete table" button is absent

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission
- **THEN** the actions appear in the order Manage access, Delete table, Add (or Save when not `ACTIVE`)

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor, opened via the header **Add** dropdown's **Add rows** item. Opening the editor SHALL prefill it with a one-row JSON template whose keys are the table's declared column names, each mapped to a value matching that column's type (`0` for Integer/Long/Decimal, `false` for Boolean, `{}` for Object, `[]` for Array, `""` otherwise) rather than a bare empty array, so the example stays valid input for every column. The **Insert rows** submit action SHALL be disabled while the editor's content does not parse as a JSON array, re-enabling as soon as it does; submitting invalid or non-array input SHALL additionally surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

#### Scenario: Opening Add rows prefills a type-shaped template

- **WHEN** the user opens the Add rows editor for a table with declared columns
- **THEN** the editor is prefilled with one row object keyed by each column's name, with type-appropriate placeholder values

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

### Requirement: Full-admin per-table role management panel

The table detail view SHALL provide a panel to view and manage the table's `write` / `modify` provider-role lists, backed by `AnalyticsDataApi.getTableAccess` / `replaceTableAccess` (`GET` / `PUT /v1/tables/{name}/access`) and a `TableAccess { write: string[]; modify: string[] }` model. Because the backend restricts `GET /access` to `FULL_ADMIN`, the panel SHALL be shown only when `canManageRoles` (`FULL_ADMIN`); a save SHALL full-replace the lists via `replaceTableAccess`. Role names SHALL be picked as checkboxes from the DIAL Roles catalog (fetched via `RolesApi.getRolesList`, the same source other admin surfaces such as App Routes already use for role selection) rather than typed free text — each option's value is the `DialRole.name`, which is also the raw provider-role string the backend matches against; there is no separate role id. While the initial fetch (the table's current access and the roles catalog, requested together) is in flight the panel SHALL show a loading spinner in place of the role pickers. A failed access fetch and a failed roles-catalog fetch SHALL each surface their own error notification (the two requests can fail independently); Save SHALL stay disabled until the access fetch succeeds.

#### Scenario: Full admin edits the role lists

- **WHEN** a `FULL_ADMIN` opens the role panel, checks a role in the `write` list, and saves
- **THEN** `replaceTableAccess` is called with the full updated `{write, modify}` lists

#### Scenario: Panel hidden for non-admins

- **WHEN** the detail view renders for a user who is not `FULL_ADMIN`
- **THEN** the role-management panel is not shown

#### Scenario: Loading spinner while fetching

- **WHEN** the panel opens
- **THEN** a loading spinner is shown until both the table's current access and the roles catalog have been fetched

#### Scenario: Every catalog role is offered, not just the granted ones

- **WHEN** the roles catalog loads
- **THEN** each write/modify picker offers every catalog role as a checkbox, with already-granted roles checked

#### Scenario: Roles-catalog fetch failure is surfaced independently

- **WHEN** the roles catalog fails to load even though the table's current access loads successfully
- **THEN** an error notification distinct from the access-load-failure notification is shown

## ADDED Requirements

### Requirement: Table lifecycle status badge

The UI SHALL surface a table's lifecycle `status` (`PENDING`, `ACTIVE`, `FAILED`) with a status badge that reuses the established admin sync-status badge approach (an enum→label and enum→color-token mapping rendered as an uppercase rounded pill, mirroring `Common/SyncCoreStatus/CoreSyncStatusBadge`). The badge SHALL render `PENDING` as "Draft", `ACTIVE` as "Active", and `FAILED` as "Failed", using the theme color tokens (warning / success / error respectively). The badge SHALL appear in the table detail header and in the catalog grid. The UI SHALL NOT poll for status — status changes only in response to the user's own schema-definition submission, and the badge reflects the last fetched definition.

#### Scenario: Detail header shows the status badge

- **WHEN** the table detail view renders
- **THEN** a status badge for the table's current `status` is shown next to the title

#### Scenario: An active table reads as Active

- **WHEN** a table's `status` is `ACTIVE`
- **THEN** its badge renders the "Active" (success) state

### Requirement: Define and materialize a table schema

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (source name, exposed name, type, nullable, optional tag, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared column source names, and an optional partition (a temporal column + a day/month/year granularity); for an **enrichment**, its columns plus a grain key chosen from its source table's columns. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, and tag length exactly as the create/add-columns editor validates today.

An Array-typed column row SHALL offer an additional element-type selector, restricted to the non-array, non-object column types (no nested arrays or objects). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column.

Submitting the schema (a header **Save** action) SHALL send the whole document via `defineTableSchema` (`POST /v1/tables/{name}/schema`), which defines the schema **and** materializes the table in the same call — there is no separate save-draft step, and no way to persist an incomplete schema. Save SHALL be disabled until the schema is complete for its kind (a source needs at least one valid column and a non-empty ordering key; an enrichment needs a grain key), since the backend rejects an incomplete submission (422) without persisting it. On success the view SHALL refresh showing the table `ACTIVE` with its live column surface. On a backend (ClickHouse) failure the table becomes `FAILED`; the detail view SHALL present the same schema-definition surface with an indication that activation failed, allowing the user to adjust the schema and resubmit. While the table is not `ACTIVE`, the write-rows action SHALL NOT be offered.

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

### Requirement: Table metadata editing (description and tag order)

The **catalog list's** row action menu SHALL let the user edit a table's catalog metadata — its `description` and its per-table `tag_order` — in any status, via `updateTable` (`PUT /v1/tables/{name}`). `tag_order` SHALL be presented as a reorderable list of the distinct tags currently declared on the table's columns, and the resulting ordered list of tag names SHALL be sent to the backend; an empty order SHALL clear it and an unchanged order SHALL be left as-is (merge-patch semantics). On success the catalog SHALL refresh from the server. This surface SHALL NOT be offered for system-owned tables, and SHALL NOT be offered from the table detail view.

#### Scenario: Description is edited via the table update endpoint

- **WHEN** the user activates a row's edit action, changes the table description, and submits
- **THEN** `updateTable` is sent with the new description and the catalog refreshes

#### Scenario: Tag order is reordered and saved

- **WHEN** the user reorders the table's column tags and submits
- **THEN** `updateTable` is sent with the ordered `tag_order` list and the catalog refreshes
