## REMOVED Requirements

### Requirement: Query Builder and Tables pages render no content

**Reason**: Both pages now render full views. Their behavior is defined by the Query Builder requirements (from the Query Builder story) and by the new requirements below.

**Migration**: Superseded by "Analytics pages fetch initial data server-side", "Query Builder initial data loading and state", "Tables catalog page", "Create table (source or enrichment)", "Table detail column schema management", and "Table detail row writes".

## MODIFIED Requirements

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. The client MUST cover every request exercised by the service's demo pages across both endpoint families, and `{name}` path segments MUST be URL-encoded.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `GET /v1/queries/entities/schema/{name}/detailed?{idField}={id}` — fetch an instance-specific detailed schema for a complex entity
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure

Tables endpoints (base path `/v1/tables`):
- `GET /v1/tables` — list tables; the response is wrapped as `{ tables: [...] }` and the client SHALL unwrap it to a bare array
- `POST /v1/tables` — create a table or enrichment (body-discriminated)
- `GET /v1/tables/{name}` — read one table by name
- `DELETE /v1/tables/{name}` — delete a table by name
- `PATCH /v1/tables/{name}/schema` — update a table's schema
- `POST /v1/tables/{name}/rows` — insert rows into a table

#### Scenario: Client targets the Analytics data-access host

- **WHEN** `analyticsDataApi` is instantiated in `app/api/api.ts`
- **THEN** it is constructed with `host: process.env.DIAL_ANALYTICS_API_URL`

#### Scenario: Client covers the demo queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, the detailed-schema variant, and `POST /v1/queries/execute` via `executeAction`

#### Scenario: Client covers the demo tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables`, `GET /v1/tables/{name}`, `DELETE /v1/tables/{name}`, `PATCH /v1/tables/{name}/schema`, and `POST /v1/tables/{name}/rows`

## ADDED Requirements

### Requirement: Analytics pages fetch initial data server-side

The Analytics pages SHALL be `async` server components (`export const dynamic = 'force-dynamic'`) that fetch their initial data on the server via server actions delegating to `analyticsDataApi`, and pass that data to a client view as props; the client view SHALL own all subsequent interactive state and re-fetching. Fetch failures SHALL be logged (`errorObjLog`); a page whose required single entity is missing SHALL call `notFound()`. Pages SHALL NOT fetch their initial data from a client-side effect.

#### Scenario: Tables catalog data is fetched on the server

- **WHEN** the user navigates to `/tables`
- **THEN** the page awaits the tables list on the server and renders the catalog view seeded with it
- **AND** if the list request fails the page resolves to a not-found result

#### Scenario: Table detail data is fetched on the server

- **WHEN** the user navigates to `/tables/{name}`
- **THEN** the page awaits that table on the server and renders the detail view seeded with it
- **AND** if the table is missing the page resolves to a not-found result

### Requirement: Query Builder initial data loading and state

The Query Builder page SHALL prefetch the queryable entities on the server and, when the first entity is simple (not `complex`), that entity's schema, passing `initialEntities`, `initialEntityName`, and `initialFields` to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, with default mode/filter/select/sort/page) from those props without a mount-time fetch. Changing the selected entity, or supplying an instance id for a complex entity, SHALL load the corresponding schema client-side via server actions (`getEntitySchema` / `getDetailedEntitySchema`) and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list and the first entity's schema
- **THEN** the builder renders with that entity selected and its fields available
- **AND** no client-side entities/schema request is issued on mount

#### Scenario: Changing entity re-loads schema client-side

- **WHEN** the user selects a different (simple) entity
- **THEN** its schema is loaded client-side
- **AND** builder selections that referenced the previous schema's fields are cleared

#### Scenario: No entities provided

- **WHEN** the page provides an empty entities list
- **THEN** the builder shows the entities-load-failed empty state and no builder sections

### Requirement: Tables catalog page

The Tables page SHALL render the tables the page fetched as a grid with columns for name, type, description, and column count. Clicking a row (other than the actions column) SHALL navigate to that table's detail page. Each row SHALL offer a delete action whose confirmation dialog uses the danger (red confirm) variant. The header SHALL provide actions to create a source table and to create an enrichment table. After a successful create or delete the catalog SHALL refresh client-side.

#### Scenario: Catalog lists tables with navigation

- **WHEN** the catalog renders with tables
- **THEN** each table appears as a row with its name, type, description, and column count
- **AND** clicking a row navigates to that table's detail page

#### Scenario: Delete a table

- **WHEN** the user activates a row's delete action and confirms in the red confirmation dialog
- **THEN** the table is deleted and the catalog refreshes
- **AND** a failure surfaces an error notification without navigating away

### Requirement: Create table (source or enrichment)

Creating a table SHALL open a form popup that is mounted only while open, so closing discards its state without a manual reset; the form SHALL be held as a single object seeded when the popup opens (enrichment defaults derived from the first source table). A **source** table SHALL collect a name, optional description, a repeatable set of columns (source name, exposed name, type, nullable, optional tag), an optional ordering key chosen from the declared column source names, and an optional partition consisting of a column and a granularity. The partition column SHALL be restricted to temporal (date/timestamp) columns and the granularity SHALL be one of a fixed set (day/month/year). An **enrichment** table SHALL collect a name, optional description, a source table, and a grain key chosen from the selected source table's ordering key; changing the source table SHALL reset the grain key. Submit SHALL build the type-discriminated create payload and show a success or error notification.

#### Scenario: Popup state is discarded on close

- **WHEN** the user opens the create popup, edits fields, and closes it
- **THEN** re-opening the popup shows a fresh, empty form

#### Scenario: Partition column limited to temporal columns

- **WHEN** the user is defining a source table's partition
- **THEN** only date/timestamp columns are offered as the partition column
- **AND** the granularity is one of day/month/year

#### Scenario: Enrichment grain key follows the source table

- **WHEN** the user changes the selected source table
- **THEN** the grain-key options become that source's ordering-key columns
- **AND** the grain key resets to that source's first ordering key

### Requirement: Table detail column schema management

The Table detail page SHALL show the table's columns in a grid (name, source name, type, tag, nullable rendered as a true/false value) with a per-column action menu offering rename, retag, and delete (drop). The column name SHALL also be editable inline in the grid. Adding columns SHALL be available from the header via a form popup reusing the column-row editor. Every schema change (add, drop, rename, retag) SHALL be sent as a schema patch to `updateTableSchema`, and on success the detail view SHALL refresh from the server. The header SHALL also offer deleting the whole table with a danger (red confirm) dialog, returning to the catalog on success.

#### Scenario: Inline rename patches the schema

- **WHEN** the user edits a column's name in the grid to a new non-empty value
- **THEN** a rename schema patch is sent and the grid refreshes with the server state

#### Scenario: Drop a column

- **WHEN** the user chooses delete from a column's action menu
- **THEN** a drop schema patch is sent and the column is removed after refresh

#### Scenario: Add columns

- **WHEN** the user adds one or more valid columns in the add-columns popup and submits
- **THEN** an add schema patch is sent and the new columns appear after refresh

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor. The input SHALL be validated as a JSON array before sending; invalid or non-array input SHALL surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

#### Scenario: Valid rows are inserted

- **WHEN** the user enters a valid JSON array of objects and submits
- **THEN** the rows are posted to the table and a success notification is shown

#### Scenario: Invalid rows JSON is rejected

- **WHEN** the user enters text that is not a JSON array
- **THEN** an error is shown and no request is issued

### Requirement: System-owned tables are read-only

The catalog and detail views SHALL reflect the table's server-provided `system` flag. System-owned tables are seeded server-side and reject every modifying request (`409 table_is_system`), so the UI SHALL NOT offer modify actions for them: in the catalog the row's delete action SHALL be hidden and a System indicator SHALL be shown; in the detail view the delete-table / write-rows / add-columns actions and the per-column rename/retag/drop actions and inline rename SHALL be suppressed, replaced by a read-only indicator. System tables SHALL remain fully viewable and navigable.

#### Scenario: System table in the catalog

- **WHEN** the catalog lists a table whose `system` flag is true
- **THEN** the row shows a System indicator
- **AND** the row's delete action is not offered

#### Scenario: System table detail is read-only

- **WHEN** the user opens a system table's detail page
- **THEN** the delete-table, write-rows, and add-columns actions are absent and a read-only indicator is shown
- **AND** the column grid offers no rename/retag/drop actions and no inline editing
- **AND** the table and its columns remain viewable
