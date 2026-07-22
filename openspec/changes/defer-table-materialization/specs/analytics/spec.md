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

Adding columns SHALL be available from the header via a form popup reusing the column-row editor. Every live schema change SHALL be sent as a schema patch to `updateTableSchema` (`PATCH /v1/tables/{name}/schema`), and on success the detail view SHALL refresh from the server. Deleting the whole table and editing its catalog metadata (description/tag order) SHALL NOT be offered from this view — both live only in the catalog list's row action menu (see "Tables catalog page").

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

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (source name, exposed name, type, nullable, optional tag, optional sensitive flag), an ordering key chosen from the declared column source names, and an optional partition (a temporal column + a day/month/year granularity); for an **enrichment**, its columns plus a grain key chosen from its source table's columns. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, and tag length exactly as the create/add-columns editor validates today.

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

### Requirement: Table metadata editing (description and tag order)

The **catalog list's** row action menu SHALL let the user edit a table's catalog metadata — its `description` and its per-table `tag_order` — in any status, via `updateTable` (`PUT /v1/tables/{name}`). `tag_order` SHALL be presented as a reorderable list of the distinct tags currently declared on the table's columns, and the resulting ordered list of tag names SHALL be sent to the backend; an empty order SHALL clear it and an unchanged order SHALL be left as-is (merge-patch semantics). On success the catalog SHALL refresh from the server. This surface SHALL NOT be offered for system-owned tables, and SHALL NOT be offered from the table detail view.

#### Scenario: Description is edited via the table update endpoint

- **WHEN** the user activates a row's edit action, changes the table description, and submits
- **THEN** `updateTable` is sent with the new description and the catalog refreshes

#### Scenario: Tag order is reordered and saved

- **WHEN** the user reorders the table's column tags and submits
- **THEN** `updateTable` is sent with the ordered `tag_order` list and the catalog refreshes
