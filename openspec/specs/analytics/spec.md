# Analytics — Master Spec

## Purpose

Analytics is an experimental admin capability, gated by the `ANALYTICS_ENABLED` environment
variable, that lets an operator explore and shape analytics data held by the Analytics data-access
service (`analytics-data-access-service`, hosted at `DIAL_ANALYTICS_API_URL`). It surfaces as a
"Analytics" left-navigation group (carrying a "Preview" tag) with two pages:

- **Query Builder** — assemble a `StructuredQuery` through form controls, edit it as JSON, or write
  ad-hoc SQL, then run it and view the result. Form, JSON, and SQL are three views of one page,
  switched by a control below the source selector.
- **Tables** — a catalog of source/enrichment tables with a detail page for managing each table's
  column schema and writing rows; system-owned tables are read-only.

All transport goes through a single server-side client (`AnalyticsDataApi`) via server actions; pages
prefetch their initial data on the server and hand it to client views.

This folder (`openspec/specs/analytics/`) is the single home for all Analytics specs; this file is
the consolidated master spec, folding in the scaffold, Query Builder, SQL editor, and Tables stories.

## Requirements

### Requirement: ANALYTICS_ENABLED feature flag is surfaced on FeatureFlags

The system SHALL expose an environment variable `ANALYTICS_ENABLED` whose value is surfaced at runtime on the `FeatureFlags` object as `analyticsEnabled: boolean`. The flag MUST be `true` only when `process.env.ANALYTICS_ENABLED` is present and resolves truthy per the existing `isValueTruthy` helper; otherwise it MUST be `false`. The flag SHALL be initialized in the root layout (`app/[lang]/layout.tsx`) alongside the other feature flags and added to the `FeatureFlags` model (`models/feature-flags.ts`).

#### Scenario: Flag is true when env var is explicitly truthy

- **WHEN** `process.env.ANALYTICS_ENABLED` is set to `'true'` and the root layout initializes `FeatureFlags`
- **THEN** `featureFlags.analyticsEnabled` is `true`

#### Scenario: Flag defaults to false when env var is unset

- **WHEN** `process.env.ANALYTICS_ENABLED` is not set
- **THEN** `featureFlags.analyticsEnabled` is `false`

#### Scenario: Flag is false when env var is falsy

- **WHEN** `process.env.ANALYTICS_ENABLED` is set to `'false'`, `''`, `'0'`, or any value that `isValueTruthy` treats as falsy
- **THEN** `featureFlags.analyticsEnabled` is `false`

### Requirement: Analytics menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Query Builder" (linking to the Query Builder route) and "Tables" (linking to the Tables route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/query-builder` and `/tables` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Query Builder", "Tables").

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Query Builder" sub-item linking to `/query-builder`
- **AND** it shows a "Tables" sub-item linking to `/tables`

### Requirement: Analytics menu group is gated by the feature flag

The "Analytics" group SHALL be present in the menu only when `featureFlags.analyticsEnabled` is `true`, following the same filtering pattern used for the Deployments and Evaluation groups in `MENU_CONFIGURATION`. When the flag is `false`, the entire group and both sub-items MUST be absent from the sidebar, and the group's gating MUST compose independently of every other flag-gated group (disabling or enabling any other group MUST NOT affect Analytics's visibility, and vice versa).

#### Scenario: Group hidden when flag disabled

- **WHEN** `featureFlags.analyticsEnabled` is `false` and the sidebar menu renders
- **THEN** the "Analytics" group and both its sub-items are absent from the sidebar

#### Scenario: Gating composes independently of other groups

- **WHEN** `featureFlags.analyticsEnabled` is `true` while `featureFlags.deploymentsEnabled` and `featureFlags.evaluationEnabled` are `false`
- **THEN** the "Analytics" group is present
- **AND** the Deployments and Evaluation groups are absent

### Requirement: Preview tag on the Analytics group header

The "Analytics" menu group header SHALL display the existing `PreviewTag` component. Because the preview-tag mechanism (`PREVIEW_TAG_MENU_ITEMS` in `MenuItemContent.tsx`) applies only to sub-items, the group header component (`MenuItem.tsx`) SHALL render a `PreviewTag` for groups marked as preview (an opt-in field on `MenuGroupConfiguration`). The tag MUST render only when the sidebar is expanded, and MUST NOT appear on any other group header. Sub-items ("Query Builder", "Tables") MUST NOT each carry their own preview tag.

#### Scenario: Preview tag shown on expanded group header

- **WHEN** the sidebar is expanded and the "Analytics" group is rendered
- **THEN** a "Preview" tag is shown on the "Analytics" group header
- **AND** no other group header shows a "Preview" tag

#### Scenario: Preview tag hidden when sidebar collapsed

- **WHEN** the sidebar is collapsed
- **THEN** the "Preview" tag is not rendered on the group header

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `GET /v1/queries/entities/schema/{name}/detailed?{idField}={id}` — fetch an instance-specific detailed schema for a complex entity
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure
- `POST /v1/queries/execute-sql` — execute an ad-hoc SQL SELECT (body `{ sql }`); exposed as `executeSqlAction`, returning a `ServerActionResponse` with the same result envelope as `execute`

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

#### Scenario: Client covers the queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, the detailed-schema variant, `POST /v1/queries/execute` via `executeAction`, and `POST /v1/queries/execute-sql` via `executeSqlAction`

#### Scenario: Client covers the tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables`, `GET /v1/tables/{name}`, `DELETE /v1/tables/{name}`, `PATCH /v1/tables/{name}/schema`, and `POST /v1/tables/{name}/rows`

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

### Requirement: Query Builder layout and view switcher

The Query Builder page (`app/[lang]/query-builder/page.tsx`) SHALL render a header (title, a Copy action, and a Run action), a persistent Source section, and — once a schema is loaded — a view switcher directly below the Source section offering three mutually exclusive views: **Form**, **JSON**, and **SQL** (rendered as a `DialSegmentedControl`). Selecting a view SHALL change the page body to that view without a page reload; the current view SHALL be indicated. Running a query SHALL open the result in a sidebar (`QueryResultSidebar`). Base form controls SHALL come from the DIAL UI Kit and results SHALL be displayed with the app's grid stack.

#### Scenario: Three views offered once a schema is loaded

- **WHEN** the page has loaded an entity schema
- **THEN** a view switcher below the Source section offers Form, JSON, and SQL
- **AND** one view is indicated as selected

#### Scenario: Switcher hidden before a schema loads

- **WHEN** no schema has been loaded yet
- **THEN** the view switcher is not shown

### Requirement: Query Builder initial data loading and state

The Query Builder page SHALL prefetch the queryable entities on the server and, when the first entity is simple (not `complex`), that entity's schema, passing `initialEntities`, `initialEntityName`, and `initialFields` to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, with default mode/filter/select/sort/page) from those props without a mount-time fetch. The Source section SHALL show an entity selector and, once a schema is loaded, a field-count/schema-preview affordance. Changing the selected entity, or supplying an instance id for a complex entity, SHALL load the corresponding schema client-side via server actions (`getEntitySchema` / `getDetailedEntitySchema`) and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list and the first entity's schema
- **THEN** the builder renders with that entity selected and its fields available
- **AND** no client-side entities/schema request is issued on mount

#### Scenario: Changing entity reloads schema and resets selections

- **WHEN** the user selects a different (simple) entity
- **THEN** its schema is loaded client-side
- **AND** builder selections that referenced the previous schema's fields are cleared

#### Scenario: No entities provided

- **WHEN** the page provides an empty entities list
- **THEN** the builder shows the entities-load-failed empty state and no builder sections

### Requirement: Complex entities load a detailed schema

When the selected entity is complex (`complex: true`), the Source section SHALL require an instance id whose parameter name is the entity's `schemaIdField` (defaulting to `id`), and the schema SHALL be loaded from the detailed-schema endpoint (`GET /v1/queries/entities/schema/{name}/detailed?{schemaIdField}={id}` with all segments/params URL-encoded). Simple entities SHALL use the base schema endpoint and SHALL NOT require an instance id.

#### Scenario: Detailed schema requested for a complex entity

- **WHEN** a complex entity is selected and an instance id is provided
- **THEN** the schema is loaded via the detailed-schema endpoint
- **AND** the builder uses the returned fields

#### Scenario: Complex entity without an instance id

- **WHEN** a complex entity is selected and no instance id is provided
- **THEN** the user is prompted to supply the required id
- **AND** no detailed schema request is issued

### Requirement: Schema preview popup

The Source section SHALL provide a "Schema preview" action that opens a popup displaying the loaded schema. The popup SHALL default to a grid view with the columns Field, Type, Family, Source, and Tag, where Family is derived from the field name (the substring before the first `:`, or `column` when the name contains no `:`) and Tag shows a placeholder when absent. The popup SHALL provide a toggle between the grid view and the raw schema JSON.

#### Scenario: Schema preview opens as a grid

- **WHEN** the user activates "Schema preview" with a schema loaded
- **THEN** a popup shows the fields in a grid with Field, Type, Family, Source, and Tag columns

#### Scenario: Toggle to JSON view

- **WHEN** the schema preview popup is open and the user toggles to JSON
- **THEN** the popup shows the raw schema JSON
- **AND** toggling back returns to the grid view

### Requirement: Query mode and DISTINCT

In the Form view the builder SHALL let the user choose the query mode — `row` (projection) or `aggregate` (group + metrics) — via a radio group, and toggle `SELECT DISTINCT`. Selecting `row` SHALL show the projection (Select) section and hide the aggregate sections; selecting `aggregate` SHALL show the Group by, Time bucket, Aggregate, and Having sections and hide the projection section. Enabling DISTINCT SHALL set `distinct: true` on the serialized query; disabling it SHALL omit `distinct`.

#### Scenario: Switching to aggregate mode swaps sections

- **WHEN** the user selects `aggregate` mode
- **THEN** the Group by, Time bucket, Aggregate, and Having sections are shown
- **AND** the projection (Select) section is hidden

#### Scenario: DISTINCT toggles the serialized flag

- **WHEN** the user enables SELECT DISTINCT
- **THEN** the serialized query includes `"distinct": true`

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a recursive WHERE tree. Each group SHALL expose a logical operator selector (AND / OR / NOT) and actions to add a condition, add a nested group, and (for non-root groups) remove itself. Each condition SHALL expose a field selector (from the loaded schema), an operator selector (`eq`, `ne`, `co`, `nc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups and fieldless conditions SHALL be omitted; a `not` group SHALL wrap its single child, or an `and` of its children.

#### Scenario: Nested group with a condition serializes

- **WHEN** the root group is AND with one condition `field eq value` and one nested OR group
- **THEN** the serialized `filter` has `op: "and"` whose args include the predicate and the nested `op: "or"` group
- **AND** groups with no conditions are omitted

#### Scenario: is-null predicate

- **WHEN** a condition uses `eq` with "is null" enabled
- **THEN** the value input is hidden
- **AND** the predicate's right operand serializes as `{ "type": "value", "value_type": "null", "value": null }`

#### Scenario: in-operator builds an array

- **WHEN** a condition uses `in` with value `a, b, c`
- **THEN** the predicate's right operand serializes as an array expression with three value items

### Requirement: Row-mode projection

In `row` mode the Select section SHALL present the schema fields as a checkbox grid. Checked fields SHALL serialize to `select` as field-expression output columns, in selection order. When no field is checked, `select` SHALL be omitted (default projection).

#### Scenario: Selected fields become projection columns

- **WHEN** the user checks two fields in row mode
- **THEN** the serialized `select` contains a field-expression output column for each checked field

#### Scenario: No projection omits select

- **WHEN** no field is checked in row mode
- **THEN** the serialized query has no `select` key

### Requirement: Projection field selection filtered by tag

The row-mode Select (projection) section SHALL render, above the field checkboxes, a tag filter offering one checkbox per distinct tag present on the loaded schema's fields (deduped, with untagged fields grouped under an "untagged" option). When one or more tags are selected, only fields whose tag is among the selection SHALL be shown; when no tag is selected, all fields SHALL be shown. The tag filter SHALL affect only field visibility and MUST NOT change which fields are selected — a selected field SHALL remain in the query even while hidden. The tag selection SHALL reset when the schema changes. The aggregate Group by grid is not affected.

#### Scenario: Tag filter narrows the visible fields

- **WHEN** the schema has fields tagged `identity`, `system`, and `lineage`, and the user checks the `lineage` tag
- **THEN** only fields tagged `lineage` are shown in the field grid
- **AND** all distinct tags remain available as filter checkboxes

#### Scenario: Hidden selected field stays in the query

- **WHEN** a field is checked and the user then applies a tag filter that excludes that field
- **THEN** the field is not shown in the grid
- **AND** the field remains in the serialized query (still selected)

### Requirement: Aggregate-mode group by, time buckets, and metrics

In `aggregate` mode the builder SHALL support: a Group by checkbox grid of schema fields; zero or more `date_bin` time buckets, each with an amount, a unit (`second`, `minute`, `hour`, `day`, `week`), a source timestamp/date field, and an alias; and zero or more aggregate metrics, each with a function (`count`, `sum`, `avg`, `min`, `max`), an optional field argument, an optional `distinct` flag, and an alias. The serialized query SHALL place group-by field projections, aliased `date_bin` function columns, and aliased aggregate function columns into `select`, and SHALL list the checked group-by fields plus the active bucket aliases in `group_by`.

#### Scenario: Aggregate select and group_by are built

- **WHEN** the user checks a group-by field and adds a `sum` aggregate over a field with alias `total`
- **THEN** `select` includes the group-by field column and a `sum` function column aliased `total`
- **AND** `group_by` includes the checked group-by field

#### Scenario: Time bucket becomes a date_bin column

- **WHEN** the user adds a time bucket of 5 minutes over a timestamp field with alias `bucket`
- **THEN** `select` includes a `date_bin` function column aliased `bucket`
- **AND** `group_by` includes `bucket`

### Requirement: Aggregate-mode HAVING builder

In `aggregate` mode the builder SHALL provide a Having section using the same nested group/condition builder as the Filter section, but whose selectable fields are the aggregate output names — the checked group-by fields, the bucket aliases, and the aggregate aliases. The built tree SHALL serialize to the query's `having` node under the same rules as the filter tree.

#### Scenario: Having references an aggregate alias

- **WHEN** an aggregate is aliased `total` and the user adds a Having condition `total gt 100`
- **THEN** the field selector for that condition offers `total`
- **AND** the serialized query includes a `having` node with that predicate

### Requirement: Sort keys

The Sort section SHALL let the user add, edit, and remove sort keys, each with a field, a direction (`asc` / `desc`), and an optional nulls ordering (default / nulls first / nulls last). In `row` mode the field options SHALL be the schema fields; in `aggregate` mode they SHALL be the aggregate output names. Fieldless sort keys SHALL be omitted, and `sort` SHALL be omitted entirely when no valid key remains; the nulls ordering SHALL be omitted when left at default.

#### Scenario: Sort key serializes

- **WHEN** the user adds a sort key on a field with direction `desc`
- **THEN** the serialized `sort` contains an item with that field and `dir: "desc"`

#### Scenario: Fieldless sort key is omitted

- **WHEN** a sort key has no field selected
- **THEN** it does not appear in the serialized `sort`

### Requirement: Paging

The Page section SHALL provide an "include page" toggle and a paging strategy selector (`offset` or `cursor`). For `offset` the controls SHALL be offset, limit, and an `include_total` toggle; for `cursor` the controls SHALL be a cursor value and a limit. The serialized `page` object SHALL match the selected strategy, and SHALL be omitted entirely when "include page" is off.

#### Scenario: Offset paging serializes

- **WHEN** "include page" is on with strategy `offset`, offset `0`, limit `25`, include_total off
- **THEN** `page` is `{ "type": "offset", "offset": 0, "limit": 25, "include_total": false }`

#### Scenario: Paging omitted when disabled

- **WHEN** "include page" is off
- **THEN** the serialized query has no `page` key

### Requirement: JSON view and copy

The JSON view SHALL render the current serialized `StructuredQuery` as JSON in a Monaco editor. Editing the JSON SHALL parse it back into the builder state so the Form view reflects the last valid JSON; invalid JSON SHALL be flagged non-blockingly and SHALL disable Run while invalid. Entering the JSON view SHALL seed the editor from the current builder state. The header Copy action SHALL copy the currently displayed query text (JSON for the Form/JSON views, the SQL text for the SQL view).

#### Scenario: JSON reflects the form and round-trips

- **WHEN** the user edits the form, switches to the JSON view, and edits the JSON to valid content
- **THEN** the JSON initially mirrors the form
- **AND** the edited valid JSON is parsed back so the form reflects it

#### Scenario: Invalid JSON is flagged and blocks Run

- **WHEN** the JSON editor contains invalid JSON
- **THEN** a non-blocking invalid-JSON message is shown
- **AND** the Run action is disabled

### Requirement: Aggregate validation warnings

While in `aggregate` mode the builder SHALL surface non-blocking warnings when: any aggregate lacks an alias; any time bucket lacks a source field or an alias; or the query has no group-by, buckets, or aggregates. The warnings SHALL clear when resolved and SHALL NOT prevent running the query.

#### Scenario: Missing aggregate alias warns

- **WHEN** in aggregate mode an aggregate has no alias
- **THEN** a warning states that every aggregate needs an alias

#### Scenario: Warnings clear when resolved

- **WHEN** the aggregate gains an alias
- **THEN** the corresponding warning is no longer shown

### Requirement: Run query and result

The header Run action SHALL execute the current query and open the result in a sidebar. In the Form and JSON views the query is the serialized `StructuredQuery`, executed via a server action delegating to `analyticsDataApi.executeAction` (`/v1/queries/execute`). The result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified, and a meta line stating the row count (and the total when the response includes one). An empty result SHALL show an empty-state message. A failed run SHALL surface an error via the app's notification convention and SHALL NOT replace a previously shown result with a broken grid. Run SHALL be disabled until a schema is loaded (and while JSON is invalid).

#### Scenario: Successful run renders a result grid

- **WHEN** the user runs a valid query that returns rows
- **THEN** the rows are shown in a grid with a column per result column
- **AND** a meta line shows the row count

#### Scenario: Empty result

- **WHEN** a run returns no rows
- **THEN** an empty-state message is shown instead of a grid

#### Scenario: Failed run surfaces an error

- **WHEN** a run fails
- **THEN** an error notification is shown
- **AND** the previous result (if any) is not replaced by a broken grid

### Requirement: SQL view shows only the source selector and a SQL editor

In the SQL view the page SHALL render the persistent Source section (entity selector and, for complex entities, the instance-id controls) and a SQL code editor filling the remaining area, and SHALL NOT render the Mode, Filter, Select, Group by, Time bucket, Aggregate, Having, Sort, or Page sections. The editor SHALL provide SQL syntax highlighting (via the Monaco `sql` language). The Copy and Run actions SHALL remain available; Copy SHALL copy the SQL editor text.

#### Scenario: SQL view hides the builder sections

- **WHEN** the user selects the SQL view
- **THEN** the Source selector is shown
- **AND** a SQL editor is shown
- **AND** none of the Mode, Filter, Select, aggregate, Sort, or Page sections are shown

#### Scenario: SQL text is highlighted

- **WHEN** the user types a SQL statement in the SQL editor
- **THEN** the statement is rendered with SQL syntax highlighting

### Requirement: Schema-aware SQL autocomplete

The SQL editor SHALL offer completion suggestions derived from the loaded schema and a fixed SQL catalog: the loaded schema's field names (each annotated with its field type), the selected entity name (as the query's source/`FROM` target), and the supported SQL keywords and functions. Suggestions SHALL reflect the schema currently loaded, so changing the selected entity SHALL change the suggested field names and source name. The autocomplete SHALL NOT perform SQL validation.

#### Scenario: Schema fields are suggested

- **WHEN** the user triggers completion in the SQL editor with a schema loaded
- **THEN** the loaded schema's field names are offered as suggestions
- **AND** each field suggestion shows its field type
- **AND** the selected entity name is offered as the source

#### Scenario: Suggestions follow the selected entity

- **WHEN** the user selects a different entity and triggers completion
- **THEN** the suggested field names are those of the newly selected entity's schema

### Requirement: SQL execution via the SQL endpoint

Running a query in the SQL view SHALL execute the editor's SQL text against `POST /v1/queries/execute-sql` through a server action (`executeSqlQuery`) delegating to `analyticsDataApi.executeSqlAction`, sending the statement as `{ "sql": <text> }`. On success the returned rows SHALL be shown in the same result grid used by the structured Run. Because the SQL endpoint never returns a total count, no total SHALL be shown for SQL results. Run SHALL be disabled until a schema is loaded and while the SQL editor is empty.

#### Scenario: SQL run renders a result grid

- **WHEN** the user runs a valid SQL SELECT that returns rows
- **THEN** the request is sent to `/v1/queries/execute-sql` with body `{ "sql": <the editor text> }`
- **AND** the returned rows are shown in the result grid with a row-count meta line

#### Scenario: Run disabled for empty SQL

- **WHEN** the SQL editor is empty
- **THEN** the Run action is disabled

### Requirement: SQL validation is backend-authoritative

The SQL view SHALL NOT perform client-side SQL parsing or validation. When the backend rejects the SQL (a `400` — parse/validation failure or an unsupported construct such as a join, CTE, subquery, arithmetic, `CAST`, or a `LIMIT` above the maximum), the failure SHALL surface via the app's notification convention (error header/message), and a previously shown result SHALL NOT be replaced by a broken grid.

#### Scenario: Rejected SQL surfaces an error

- **WHEN** the user runs SQL that the backend rejects with a `400`
- **THEN** an error notification is shown with the backend's message
- **AND** any previously shown result is not replaced by a broken grid

### Requirement: SQL view state is an independent buffer

The Query Builder SHALL keep the SQL editor text as its own buffer, independent of the Form and JSON views. Switching away from and back to the SQL view SHALL restore the SQL text unchanged. The SQL text SHALL NEVER be parsed back into the builder form state. The Form and JSON views SHALL continue to round-trip through the shared builder state, unaffected by any SQL text.

#### Scenario: SQL text persists across view switches

- **WHEN** the user edits SQL, switches to the Form view, and switches back to the SQL view
- **THEN** the SQL editor shows the previously edited text unchanged

#### Scenario: SQL does not rewrite the form

- **WHEN** the user has a built form, switches to SQL, edits the SQL, and switches back to Form
- **THEN** the form is unchanged from before entering the SQL view

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

The Table detail page SHALL show the table's columns in a grid (name, source name, type, tag, display name, description, nullable rendered as a true/false value); long display name/description values SHALL be truncated with the full value reachable via an ellipsis tooltip. Each column row SHALL offer a per-column action menu with **edit** and **delete (drop)** actions. The column name SHALL also be editable inline in the grid.

The edit action SHALL open a unified edit modal seeded with the column's current name, display name, and tag. The description SHALL NOT be offered for editing while the backend has no description-edit operation (the backend silently ignores unknown patch operations, which would make a save appear to do nothing); the field joins the modal once that operation ships. The name field SHALL be required (submit disabled while blank) and SHALL be disabled for columns the backend does not allow to rename (grain-key, ordering-key, and `_`-prefixed system columns) while the metadata fields remain editable. Blank display name or tag values SHALL be valid input meaning "clear the value". On submit the modal SHALL diff the form against the original column and send a **single** schema patch containing only the changed operations (`rename`, `retag`, `set_display_name`); when a rename is included, the metadata operations SHALL reference the new (post-rename) column name. Submit SHALL be disabled when no field changed.

Adding columns SHALL be available from the header via a form popup reusing the column-row editor. Every schema change SHALL be sent as a schema patch to `updateTableSchema`, and on success the detail view SHALL refresh from the server. The header SHALL also offer deleting the whole table with a danger (red confirm) dialog, returning to the catalog on success.

#### Scenario: Inline rename patches the schema

- **WHEN** the user edits a column's name in the grid to a new non-empty value
- **THEN** a rename schema patch is sent and the grid refreshes with the server state

#### Scenario: Combined edit sends one patch with post-rename names

- **WHEN** the user renames `total_money` to `total_cost` and sets its display name to "Total money spend" in the edit modal and submits
- **THEN** a single schema patch is sent containing a rename from `total_money` to `total_cost` and a set_display_name targeting `total_cost`
- **AND** the grid refreshes with the server state

#### Scenario: Only changed fields become operations

- **WHEN** the user changes only the display name and leaves name and tag untouched
- **THEN** the patch contains only a set_display_name operation

#### Scenario: Blank metadata clears the value

- **WHEN** the user clears the display name field and submits
- **THEN** a set_display_name operation with an empty value is sent, clearing the stored display name

#### Scenario: Restricted columns cannot be renamed but keep metadata editable

- **WHEN** the user opens the edit modal for a grain-key or ordering-key column
- **THEN** the name input is disabled
- **AND** display name and tag remain editable

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

The catalog and detail views SHALL reflect the table's server-provided `system` flag. System-owned tables are seeded server-side and reject every modifying request (`409 table_is_system`), so the UI SHALL NOT offer modify actions for them: in the catalog the row's delete action SHALL be hidden and a System indicator SHALL be shown; in the detail view the delete-table / write-rows / add-columns actions and the per-column edit/drop actions and inline rename SHALL be suppressed, replaced by a read-only indicator. System tables SHALL remain fully viewable and navigable, including their column display names and descriptions.

#### Scenario: System table in the catalog

- **WHEN** the catalog lists a table whose `system` flag is true
- **THEN** the row shows a System indicator
- **AND** the row's delete action is not offered

#### Scenario: System table detail is read-only

- **WHEN** the user opens a system table's detail page
- **THEN** the delete-table, write-rows, and add-columns actions are absent and a read-only indicator is shown
- **AND** the column grid offers no edit/drop actions and no inline editing
- **AND** the table, its columns, and their display names and descriptions remain viewable
