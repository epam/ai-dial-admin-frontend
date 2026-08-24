# Analytics — Master Spec

## Purpose

Analytics is an experimental admin capability, gated by the `ANALYTICS_ENABLED` environment
variable, that lets an operator explore and shape analytics data held by the Analytics data-access
service (`analytics-data-access-service`, hosted at `DIAL_ANALYTICS_API_URL`). It surfaces as a
"Analytics" left-navigation group (carrying a "Preview" tag) with these pages:

- **Queries** — saved queries as first-class, addressable objects: a grid of the queries visible to
  the caller, a create modal, and a page per query. That page is the results-first workbench —
  assemble a `StructuredQuery` through form controls, edit it as JSON, or write ad-hoc SQL in a
  collapsible right-side rail (Builder, JSON, and SQL are three views of the rail), then run it and
  read the result — table or chart — in the main area — plus Save, Discard, and Edit. A query stores
  authored intent only, and the builder is reachable only through one: there is no unsaved session.
- **Tables** — a catalog of source/enrichment tables with a detail page for managing each table's
  column schema and writing rows; system-owned tables are read-only.

All transport goes through a single server-side client (`AnalyticsDataApi`) via server actions; pages
prefetch their initial data on the server and hand it to client views.

This folder (`openspec/specs/analytics/`) is the single home for all Analytics specs; this file is
the consolidated master spec, folding in the scaffold, saved queries, the query workbench, the SQL
editor, the query assistant, Tables, and the conversations trace.
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

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Tables" (linking to the Tables route), "Queries" (linking to the Queries route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/queries`, `/tables`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Queries", "Tables", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

The standalone `/query-builder` route SHALL NOT be present in the menu or in the `ApplicationRoute` enum. Requests to `/query-builder` SHALL redirect to `/queries` so existing links resolve.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows a "Queries" sub-item linking to `/queries`
- **AND** it shows a "Conversations" sub-item linking to `/conversations-trace`
- **AND** no "Query Builder" sub-item is present

#### Scenario: The retired route redirects

- **WHEN** the user navigates to `/query-builder`
- **THEN** the browser is redirected to `/queries`

### Requirement: Analytics menu group is gated by the feature flag

The "Analytics" group SHALL be present in the menu only when `featureFlags.analyticsEnabled` is `true`, following the same filtering pattern used for the Deployments and Evaluation groups in `MENU_CONFIGURATION`. When the flag is `false`, the entire group and all of its sub-items MUST be absent from the sidebar, and the group's gating MUST compose independently of every other flag-gated group (disabling or enabling any other group MUST NOT affect Analytics's visibility, and vice versa).

#### Scenario: Group hidden when flag disabled

- **WHEN** `featureFlags.analyticsEnabled` is `false` and the sidebar menu renders
- **THEN** the "Analytics" group and all of its sub-items are absent from the sidebar

#### Scenario: Gating composes independently of other groups

- **WHEN** `featureFlags.analyticsEnabled` is `true` while `featureFlags.deploymentsEnabled` and `featureFlags.evaluationEnabled` are `false`
- **THEN** the "Analytics" group is present
- **AND** the Deployments and Evaluation groups are absent

### Requirement: Preview tag on the Analytics group header

The "Analytics" menu group header SHALL display the existing `PreviewTag` component. Because the preview-tag mechanism (`PREVIEW_TAG_MENU_ITEMS` in `MenuItemContent.tsx`) applies only to sub-items, the group header component (`MenuItem.tsx`) SHALL render a `PreviewTag` for groups marked as preview (an opt-in field on `MenuGroupConfiguration`). The tag MUST render only when the sidebar is expanded, and MUST NOT appear on any other group header. Sub-items ("Query Builder", "Tables", "Conversations") MUST NOT each carry their own preview tag.

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
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure
- `POST /v1/queries/execute-sql` — execute an ad-hoc SQL SELECT (body `{ sql }`); exposed as `executeSqlAction`, returning a `ServerActionResponse` with the same result envelope as `execute`
- `POST /v1/queries/translate` — translate a structured query to the external-dialect SQL subset (validation only, no execution); exposed as `translateAction`, returning a `ServerActionResponse<{ sql }>`
- `POST /v1/queries/translate-sql` — translate a SQL SELECT to the structured DSL (body `{ sql }`, validation only, no execution); exposed as `translateSqlAction`, returning a `ServerActionResponse<{ query }>`

Saved queries endpoints (base path `/v1/saved-queries`):
- `GET /v1/saved-queries?scope={personal|common}` — list the saved queries visible at that scope, each returned in full including its body, most recently updated first; the response is wrapped as `{ saved_queries: [...] }` and the client SHALL unwrap it to a bare array. There is no paging and no server-side sorting or filtering
- `POST /v1/saved-queries` — create; exposed as an `*Action` returning a `ServerActionResponse<SavedQuery>`
- `GET /v1/saved-queries/{id}` — read one in full, including its body
- `PUT /v1/saved-queries/{id}` — full replace of the caller-supplied members; exposed as an `*Action` returning a `ServerActionResponse<SavedQuery>`. The service accepts no precondition header, so no `If-Match` is sent
- `DELETE /v1/saved-queries/{id}` — delete; exposed as an `*Action` returning a `ServerActionResponse`

There SHALL be no client-side execute call for a saved query: the stored body is posted to the existing execute endpoints, so a run stays a read and no run state is written to the saved query.

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

#### Scenario: Client covers the saved-queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/saved-queries` for a given scope (unwrapping `{ saved_queries }`), `POST /v1/saved-queries`, `GET /v1/saved-queries/{id}`, `PUT /v1/saved-queries/{id}`, and `DELETE /v1/saved-queries/{id}`

#### Scenario: Client covers the tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables` (identity-only), `GET /v1/tables/{name}`, `PUT /v1/tables/{name}` via `updateTable`, `DELETE /v1/tables/{name}`, `POST /v1/tables/{name}/schema` via `defineTableSchema`, `PATCH /v1/tables/{name}/schema` via `updateTableSchema`, and `POST /v1/tables/{name}/rows`

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

#### Scenario: The queries list is fetched on the server

- **WHEN** the user navigates to `/queries`
- **THEN** the page awaits the saved queries for both the personal and the common scope on the server and renders the grid seeded with them

#### Scenario: A query's data is fetched on the server

- **WHEN** the user navigates to `/queries/{id}`
- **THEN** the page awaits that saved query, the queryable entities, the function catalog, and the schema of the query's own source on the server
- **AND** if the saved query cannot be read the page resolves to a not-found result

### Requirement: Query Builder layout and view switcher

The query page (`app/[lang]/queries/[id]/page.tsx`) SHALL render the saved query's name as the page heading, a toolbar, a main results area, and a query-builder rail on the right side of the content area. The toolbar SHALL contain the source (entity) selector, the shared time filter, the query's own actions, and the Run action. The rail header SHALL offer three mutually exclusive views — **Builder** (form), **SQL**, and **JSON** — via a `DialSegmentedControl`; selecting a view SHALL change the rail body without a page reload and the current view SHALL be indicated. The view switcher SHALL NOT be shown before a schema is loaded. Base form controls SHALL come from the DIAL UI Kit and tabular results SHALL be displayed with the app's grid stack.

The builder SHALL be reachable only through a saved query. There SHALL be no route offering the builder without a stored query behind it, so a query that cannot be stored cannot be run.

#### Scenario: Results-first layout renders

- **WHEN** the user opens a saved query
- **THEN** the query's name is shown as the heading
- **AND** a toolbar with source selector, time filter, the query's actions, and Run is shown
- **AND** the results area is the main content
- **AND** the query-builder rail is shown at the right

#### Scenario: Three views offered once a schema is loaded

- **WHEN** the page has loaded an entity schema
- **THEN** the rail header offers Builder, SQL, and JSON views
- **AND** one view is indicated as selected

#### Scenario: Switcher hidden before a schema loads

- **WHEN** no schema has been loaded yet
- **THEN** the view switcher is not shown

### Requirement: Query Builder initial data loading and state

The query page SHALL prefetch, on the server, the queryable entities, the function catalog, the stored saved query, and the schema of that query's own source, passing them to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, and the mode/filter/select/sort/page the stored query specifies) from those props without a mount-time fetch. The toolbar SHALL show the entity selector. Changing the selected entity SHALL load its schema client-side via the `getEntitySchema` server action and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list, the stored query, and that query's source schema
- **THEN** the builder renders with that source selected, its fields available, and the stored query reflected
- **AND** no client-side entities/schema/query request is issued on mount

#### Scenario: Changing entity reloads schema and resets selections

- **WHEN** the user selects a different (simple) entity
- **THEN** its schema is loaded client-side
- **AND** builder selections that referenced the previous schema's fields are cleared

#### Scenario: No entities provided

- **WHEN** the page provides an empty entities list
- **THEN** the builder shows the entities-load-failed empty state and no builder sections

### Requirement: Query Builder toolbar

The query page SHALL render an in-page toolbar containing, left to right: the source (entity) selector as a plain dropdown (`DialSelectField`, no schema-preview affordance), the shared time filter (`TimeFilter` with the global preset options and a custom-range picker), then right-aligned the query's own actions — Edit, Discard, and Save — followed by Copy and the Run primary action.

Discard and Save SHALL be present only while the page holds unsaved changes; Edit SHALL be present whenever the caller may write the query.

#### Scenario: Toolbar composition

- **WHEN** the user opens a saved query with entities loaded
- **THEN** the toolbar shows the source dropdown, the time filter, the Edit action, Copy, and the Run action

#### Scenario: Save and Discard appear with unsaved changes

- **WHEN** the page holds unsaved changes
- **THEN** the toolbar also shows the Discard and Save actions

### Requirement: Time range is part of the structured query

The toolbar time filter SHALL be a query control: its resolved range SHALL serialize into the structured query's filter as `ge`/`le` predicates on the source's automatically detected timestamp field (the first temporal-typed field of the loaded schema). The serialized query — as shown in the JSON view, copied by the Copy action, and executed by Run — SHALL include these predicates; nothing is added invisibly at execution time. The time predicates SHALL NOT be shown in the visual Filters tree — the toolbar control is their editor. When parsing JSON back into builder state, a matching `ge` + `le` predicate pair on the timestamp field SHALL be lifted into the toolbar control (displayed as a custom range); time conditions in any other shape or on other fields SHALL remain ordinary filter conditions. When the schema has no temporal field, no time predicates SHALL be serialized and the query runs without a time bound. SQL text SHALL never be modified by the time filter.

The **persisted** body is the one exception, and it is deliberate: the structured body written to a saved query SHALL be serialized without the time bound, and the authored range SHALL be stored separately as time intent (see **Saving persists authored intent, not a resolved range**). Serializing the range into a persisted body would freeze the saved query to the day it was authored.

#### Scenario: Time range serializes into the query

- **WHEN** the user has a time range selected and the schema has a temporal field
- **THEN** the serialized query's filter includes `ge` and `le` predicates on that field for the resolved range
- **AND** the JSON view displays these predicates
- **AND** the visual Filters tree does not display them

#### Scenario: JSON time predicates round-trip into the toolbar control

- **WHEN** the user edits the JSON's `ge`/`le` predicate pair on the timestamp field to a different range and the JSON is otherwise representable
- **THEN** the toolbar time filter reflects the edited range as a custom range
- **AND** the predicates do not appear in the visual Filters tree

#### Scenario: No temporal field

- **WHEN** the loaded schema has no temporal-typed field
- **THEN** the serialized query contains no time predicates and the run is not time-bounded

#### Scenario: SQL runs are not modified

- **WHEN** the user runs a query from the SQL view
- **THEN** the executed SQL is exactly the editor text

#### Scenario: The persisted body carries no time bound

- **WHEN** the user saves a query whose toolbar has a time range selected and whose schema has a temporal field
- **THEN** the persisted structured body contains no `ge`/`le` predicate on the timestamp field
- **AND** the range is carried as the saved query's time intent instead

### Requirement: Query builder rail with collapse

The query builder SHALL render in a fixed-width rail at the right edge of the content area with a header containing a collapse control and the view switcher. Collapsing SHALL hide the rail entirely and show a restore ("Query builder") button in the results-area header; restoring SHALL bring the rail back. The collapsed state SHALL be persisted in the browser's local storage under a Query-Builder-specific key and applied SSR-safely on the next visit.

#### Scenario: Collapse frees the results area

- **WHEN** the user activates the rail collapse control
- **THEN** the rail is hidden and the results area takes the full content width
- **AND** a restore button appears in the results-area header

#### Scenario: Restore brings the rail back

- **WHEN** the rail is collapsed and the user activates the restore button
- **THEN** the rail is shown again with its previous view and state

#### Scenario: Collapsed state persists

- **WHEN** the user collapses the rail and reloads the page
- **THEN** the rail is initially collapsed

### Requirement: Builder sections use section blocks with categorized field dropdowns and collapsible items

<!-- Merged from add-column-labels-and-descriptions (archived): display names, descriptions, and the bounded-width dropdown with hover tooltips. -->

Each Builder-view section (Group by, Aggregates, Select, Filters, Having, Sort, Page) SHALL render as a borderless section tile — a raised background panel, no outline — with a labeled header and a header-level add action where applicable. Field pickers SHALL be searchable dropdowns whose options are grouped by the field's schema tag/category (untagged fields under a default group). Category groups SHALL be collapsible headers showing the group's option count, with at most one category expanded at a time (accordion); the group holding the current selection SHALL start expanded, and an active search term SHALL show all matches regardless of collapse state. Category header colors SHALL cycle the full builder palette. The dropdown's search input SHALL use the same compact boxed style as the builder's other controls.

Field options SHALL display the field's **display name** — the schema `display_name` when set, otherwise the field `name` — as primary text, the field type right-aligned, and the schema `description` as a secondary line when present; fields without display name and description SHALL render as a single line. The dropdown overlay width SHALL stay bounded: long descriptions truncate to one line and the full text is reachable via a hover tooltip of reasonable width. The dropdown search SHALL match against both the field name and its display name. Added items SHALL render compactly — chips for plain fields, collapsible rows for parameterized items (group-by functions, aggregates, conditions, having rows, sort keys) that expand into their editor and collapse back to a summary chip tinted with the owning section's palette color — and chips and collapsed summaries SHALL refer to fields by their display name. Display names are presentation-only: structured-query serialization, the JSON view, and the SQL view SHALL always use the raw field `name`. Styling SHALL use the project's palette/theme tokens only. A field whose schema `sensitive` flag is true SHALL show a sensitive marker (a colored dot with a "Sensitive" tooltip) in its dropdown option, after the display name.

The field dropdown SHALL support a multi-select mode, used by the sections whose target is a list of fields — the row-mode Select projection and the plain-column part of Group by. In multi-select mode: picking an option SHALL toggle that field's membership and SHALL leave the overlay open, its search term, and its expanded category untouched, so several fields can be added in one visit; already-selected fields SHALL remain listed among the options rather than being filtered out; a selected option SHALL be marked by a check mark in the row's reserved left gutter plus the same accent background tint the single-select picker uses for its current value (no checkbox control), so the state does not rest on colour alone; clicking a selected option SHALL deselect it; and the listbox SHALL declare itself multi-selectable with each option carrying its selected state for assistive technology. Selection order SHALL be preserved as the section's list order (a newly selected field appends). Single-valued pickers — the Sort key field, the Filter and Having condition field, and function expression arguments — SHALL remain single-select and SHALL keep closing the overlay on pick.

#### Scenario: Sensitive field shows a marker in the dropdown

- **WHEN** a schema field whose `sensitive` flag is true is shown in a field dropdown
- **THEN** its option renders a sensitive marker with a "Sensitive" tooltip
- **AND** a non-sensitive field's option renders no such marker

#### Scenario: Field dropdown groups by category

- **WHEN** the user opens a field dropdown in a builder section
- **THEN** the fields are grouped under collapsible category headers with option counts
- **AND** expanding one category collapses the previously expanded one
- **AND** typing in the search shows all matching fields across categories

#### Scenario: Display-named field renders display name, description, and type

- **WHEN** the schema field `total_money` carries display name "Total money spend" and a description
- **THEN** its dropdown option shows "Total money spend" as primary text with the type right-aligned
- **AND** the description is shown as a secondary line

#### Scenario: Field without a display name falls back to its name

- **WHEN** a schema field has no display name and no description
- **THEN** its dropdown option shows the raw field name in a single line, as before

#### Scenario: Search matches the display name

- **WHEN** the user types "money" and only the field `total_money` with display name "Total money spend" matches
- **THEN** that field is shown in the results
- **AND** searching by the raw name `total_money` finds it as well

#### Scenario: Chips and summaries use the display name

- **WHEN** the user adds a projection chip and an aggregate over a field with a display name
- **THEN** the chip shows the field's display name
- **AND** the collapsed aggregate summary refers to the field by its display name
- **AND** the serialized query and the JSON view reference the raw field name

#### Scenario: Parameterized item collapses to a summary

- **WHEN** the user collapses an aggregate or filter-condition row
- **THEN** the row shows a compact summary of its configuration in its section's color
- **AND** expanding it restores the full editor

#### Scenario: Several fields are selected in one dropdown visit

- **WHEN** the user opens the row-mode Select dropdown, searches for "tokens", and picks two matching fields in turn
- **THEN** the overlay stays open with the search term and expanded category intact after each pick
- **AND** both fields are added as chips in the order they were picked

#### Scenario: Selected options stay listed and are marked

- **WHEN** a field is already part of the Select projection and the user opens the Select dropdown
- **THEN** that field is still listed among the options
- **AND** its option row carries a check mark beside the name and the accent background tint
- **AND** an unselected field's option row carries neither

#### Scenario: Clicking a selected option removes the field

- **WHEN** the user clicks a tinted (already selected) option in the Group by dropdown
- **THEN** that plain group-by column is removed from the section
- **AND** the overlay stays open with the option now untinted

#### Scenario: Single-valued pickers still close on pick

- **WHEN** the user picks a field for a Sort key or a Filter condition
- **THEN** the field is set and the overlay closes

#### Scenario: Section tiles carry no border

- **WHEN** the user views the Builder rail
- **THEN** each section is separated by its background panel alone, with no outline

#### Scenario: A row's editors wrap instead of collapsing

- **WHEN** an expanded aggregate row holds a function selector, its argument editor, a distinct toggle and an alias input, and they no longer fit the rail's width
- **THEN** the row wraps onto a second line
- **AND** no editor is squeezed below a usable width

### Requirement: Served function catalog

The Query Builder SHALL source the set of functions offered in `aggregate` mode exclusively from the backend function catalog `GET /v1/queries/functions`, fetched on the server when the query-builder page loads and seeded into the builder. The frontend SHALL NOT hardcode any function name, group, argument shape, allowed literal values, numeric bound, distinct support, return type, or hint text: every such property SHALL be read from the served catalog entry. Each catalog entry provides the function `name`, `group` (`scalar`, `aggregate`, or `ordered_set_aggregate`), a `signature`, a `returns` type, a `distinct_supported` flag, a `description`, and an ordered `args` list; each argument provides its `name`, its `kind` (`expression`, `integer_literal`, `numeric_literal`, or `string_literal`), an `optional` flag, and — when applicable — `constraints` with `allowed_values` and/or `min`/`max`.

There SHALL be no local fallback catalog. When the catalog fetch fails or returns an empty list, no functions SHALL be offered: the Group by dropdown's Functions group SHALL be empty and the Aggregate section SHALL offer no metric functions, while plain-column querying (`row` mode, and plain group-by columns in `aggregate` mode) SHALL remain fully functional.

Every enum and function picker in the rail (operator, value type, nulls, sort direction, aggregate function) SHALL mark its current option the same way as the field dropdowns — a check mark beside the label plus the accent tint. Every function picker — the Aggregate section's selector and the Group by Functions group — SHALL name a function from the served catalog and SHALL expose its catalog `description` as a hover tooltip. The name SHALL be derived from the served data, never from a per-function table in the frontend: catalog descriptions open by naming the function ("Average of a numeric expression over the group; …", "Row count; with an argument …", "Continuous percentile: …"), so the label SHALL be that leading phrase, cut at the first clause break or the "<name> of/for …" and "<name> (…)" patterns. A description that instead opens with prose ("Lowercases a text expression."), or a function with no description, SHALL fall back to the function's own name made readable (`percentile_cont` → "Percentile cont"). A function with no description SHALL render without a tooltip.

#### Scenario: Functions offered come from the served catalog

- **WHEN** the query-builder page loads and the function catalog lists `date_bin`, `width_bucket`, `lower`, `count`, `sum`, and `percentile_cont`
- **THEN** the Group by Functions group offers the `scalar` functions (`date_bin`, `width_bucket`, `lower`) and the Aggregate section offers the `aggregate` / `ordered_set_aggregate` functions (`count`, `sum`, `percentile_cont`)

#### Scenario: New backend functions appear with no frontend change

- **WHEN** the catalog advertises a function the frontend has never named (e.g. `width_bucket`, `percentile_cont`, `percentile_disc`)
- **THEN** it is offered in the appropriate section with an argument editor built from its catalog `args`, without any function-specific frontend code

#### Scenario: Absent catalog degrades to plain columns

- **WHEN** the function catalog fails to load or is empty
- **THEN** the Group by dropdown offers only schema columns and the Aggregate section offers no metric functions
- **AND** `row` mode and plain group-by columns still build and run

#### Scenario: Function options are named from the served description

- **WHEN** the catalog describes `avg` as "Average of a numeric expression over the group; distinct deduplicates values first." and `percentile_cont` as "Continuous percentile: interpolates between adjacent values…"
- **THEN** the Aggregate function selector labels them "Average" and "Continuous percentile"
- **AND** hovering an option shows that function's full catalog `description` as a tooltip

#### Scenario: A prose description falls back to the function name

- **WHEN** the catalog describes `lower` as "Lowercases a text expression."
- **THEN** the Group by Functions group labels it "Lower" rather than lifting the prose

### Requirement: Query mode and DISTINCT

In the Builder view the rail SHALL let the user choose the query mode — `row` (projection) or `aggregate` (group + metrics) — via a two-option `DialSegmentedControl` at the top of the view. Selecting `row` SHALL show the projection (Select) section and hide the aggregate sections; selecting `aggregate` SHALL show the Group by, Aggregate, and Having sections and hide the projection section.

An aggregate metric whose catalog entry has `distinct_supported: true` SHALL render a per-aggregate DISTINCT control; aggregate metrics whose catalog entry has `distinct_supported: false` SHALL NOT render one, and there SHALL be no query-level DISTINCT toggle. When set, the control SHALL serialize into that aggregate's `distinct` flag. (This supersedes the previous rule that hid all DISTINCT controls: the served catalog now identifies exactly which functions accept `distinct`, so the control is offered precisely and only where it is valid.)

#### Scenario: Switching to aggregate mode swaps sections

- **WHEN** the user selects `aggregate` mode
- **THEN** the Group by, Aggregate, and Having sections are shown
- **AND** the projection (Select) section is hidden

#### Scenario: DISTINCT is offered only where the catalog allows it

- **WHEN** the user adds an aggregate whose catalog entry has `distinct_supported: true` (e.g. `count`, `sum`, `avg`)
- **THEN** a DISTINCT control is rendered on that aggregate row
- **AND** an aggregate whose catalog entry has `distinct_supported: false` (e.g. `min`, `max`, `percentile_cont`) renders no DISTINCT control

#### Scenario: Setting DISTINCT serializes onto the aggregate

- **WHEN** the user enables DISTINCT on a `count` aggregate over a field
- **THEN** that aggregate's serialized `fn` expression carries `distinct: true`

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a WHERE tree limited to two levels: the root group holds conditions and groups, and nested groups hold only conditions. The "add nested group" action SHALL be offered only at the root group; nested groups SHALL offer only add-condition and remove actions. Each group SHALL expose a logical operator selector (AND / OR / NOT). Each condition SHALL expose a field selector (from the loaded schema, grouped by field category), an operator selector (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. Each operator SHALL be shown by its full name (Equals, Not equals, Contains, Does not contain, Less than, Greater than, Less than or equal, Greater than or equal, In list) — in the selector's open list, in its collapsed trigger, and in the condition's collapsed row summary — with no short code shown anywhere, and each option SHALL expose a hover tooltip describing the operator. The two case-insensitive contains operators SHALL be named Contains / Does not contain while serializing to `ico`/`inc` (SQL ILIKE); their tooltips SHALL state that matching is case-insensitive. The case-sensitive `co`/`nc` SHALL NOT be offered as authoring options but SHALL remain valid model values that serialize, deserialize, and round-trip without error when present in a JSON-authored or backend-translated query. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups and fieldless conditions SHALL be omitted; a `not` group SHALL wrap its single child, or an `and` of its children. Deeper nesting SHALL be expressible only through the SQL view.

#### Scenario: Nested group with a condition serializes

- **WHEN** the root group is AND with one condition `field eq value` and one nested OR group
- **THEN** the serialized `filter` has `op: "and"` whose args include the predicate and the nested `op: "or"` group
- **AND** groups with no conditions are omitted

#### Scenario: Nested groups cannot nest further

- **WHEN** the user inspects a nested (depth-1) group's actions
- **THEN** an add-condition action is offered
- **AND** no add-group action is offered

#### Scenario: is-null predicate

- **WHEN** a condition uses `eq` with "is null" enabled
- **THEN** the value input is hidden
- **AND** the predicate's right operand serializes as `{ "type": "value", "value_type": "null", "value": null }`

#### Scenario: in-operator builds an array

- **WHEN** a condition uses `in` with value `a, b, c`
- **THEN** the predicate's right operand serializes as an array expression with three value items

#### Scenario: Contains authoring is case-insensitive

- **WHEN** the user picks the Contains operator for a condition
- **THEN** the predicate serializes with `op: "ico"`
- **AND** the case-sensitive `co`/`nc` operators are not offered in the operator selector

#### Scenario: A case-sensitive contains from an authored query still round-trips

- **WHEN** a JSON-authored or backend-translated query contains a predicate with `op: "co"`
- **THEN** it deserializes and serializes without error and is not silently changed to `ico`

#### Scenario: Operator list shows full names with tooltips

- **WHEN** the user opens a condition's operator selector
- **THEN** each option shows only the operator's full name (e.g. "Greater than or equal")
- **AND** hovering an option shows a tooltip describing that operator

#### Scenario: Collapsed operator trigger and summary read in words

- **WHEN** a condition's operator is `ge` and the selector is closed
- **THEN** the trigger shows "Greater than or equal"
- **AND** the condition's collapsed row summary names the operator the same way

### Requirement: Row-mode projection

In `row` mode the Select section SHALL let the user add projection fields through a categorized searchable dropdown; added fields SHALL render as removable chips. Added fields SHALL serialize to `select` as field-expression output columns, in selection order. When no field is added, `select` SHALL be omitted (default projection).

#### Scenario: Selected fields become projection columns

- **WHEN** the user adds two fields in row mode
- **THEN** the serialized `select` contains a field-expression output column for each added field
- **AND** each added field is shown as a chip with a remove action

#### Scenario: No projection omits select

- **WHEN** no field is added in row mode
- **THEN** the serialized query has no `select` key

### Requirement: Aggregate-mode group by, time buckets, and metrics

In `aggregate` mode the builder SHALL provide a single Group by section combining plain columns and scalar-function entries, and an Aggregate section for metrics. The functions offered SHALL be exactly those served by the function catalog (see "Served function catalog"), grouped by their catalog `group`: `scalar` functions in the Group by Functions dropdown group, and `aggregate` / `ordered_set_aggregate` functions in the Aggregate section. There SHALL be no separate Time bucket section, and no function, argument, allowed-value, or bound SHALL be hardcoded.

Picking a plain column SHALL add it as a removable chip. Picking a function SHALL add a parameterized row whose argument editors are generated from the catalog entry's ordered `args`: an `expression` argument SHALL render a field dropdown; an `integer_literal` or `numeric_literal` argument SHALL render a numeric input constrained to the argument's `min`/`max` when present; a `string_literal` argument SHALL render a select of the argument's `allowed_values` when present, otherwise a text input; an argument marked `optional` MAY be left empty and SHALL be omitted from the serialized call. Each function row SHALL also carry an alias. The row's hint text SHALL be the catalog `description`.

A computed row — an Aggregate row or a Group by function row — SHALL be created with a prefilled human-readable alias derived from the row's function and arguments, because the alias is the column's only name: the backend rejects a computed output column without one, and Sort and Having can address it only by that name. The derived alias SHALL combine the argument's display name with the function's label (the same label its picker shows — see "Served function catalog"), reading as `<display name> (<function label>)` (e.g. `sum` over `total_tokens` with display name "Total tokens" derives `Total tokens (Sum)`), SHALL fold a distinct flag into the function part (`Conversation ID (Row count distinct)`), and SHALL name a row with no filled expression argument by that label alone (`avg` derives `Average`). An argument whose field has no schema `display_name` SHALL contribute its raw field name. While the user has not edited the alias, changing the row's function or arguments SHALL rederive it; once the user edits the alias, the row SHALL keep that custom value and SHALL NOT rederive it. An alias deserialized from an authored query SHALL be treated as user-authored and SHALL NOT be rederived. A blank alias SHALL fall back to the derived value at serialization time, so a builder-authored aggregate query SHALL never serialize a computed output column with an empty `as`. Derived aliases SHALL be made unique within the query by suffixing a counter (`Total tokens (sum) 2`), because duplicate output column names collapse in the result and make sort keys ambiguous; a user-typed duplicate SHALL be left as typed.

The serialized query SHALL place plain group-by field projections, aliased scalar-function columns, and aliased aggregate columns into `select`, and SHALL list plain group-by fields by name and function entries by alias in `group_by` (function entries without required arguments are excluded from `group_by`). Plain group-by field projections and row-mode projections SHALL carry no alias: for a schema column the raw field `name` remains the query's contract, and its human-readable label is applied at display time (see "Run query and result"). Each function argument SHALL serialize by its catalog `kind`: an `expression` argument as a field expression, and a literal argument as a value expression of the kind's type. When `aggregate` mode defines no explicit aggregate, the builder SHALL add an implicit count measure chosen from the catalog — the first `aggregate`-group function whose arguments are all optional — so grouped results still carry a value column; if the catalog has no such function, no implicit measure is added.

A function output's type (used to type Having and Sort options) SHALL be taken from the catalog `returns`; a `same_as_argument` return SHALL be resolved to the type of the function's first `expression` argument as declared in the entity schema.

#### Scenario: Aggregate select and group_by are built

- **WHEN** the user adds a group-by column and a `sum` aggregate over a field with alias `total`
- **THEN** `select` includes the group-by field column and a `sum` function column aliased `total`
- **AND** `group_by` includes the group-by field

#### Scenario: date_bin builds through the generic argument editor

- **WHEN** the user picks `date_bin` from the Group by Functions group and its catalog args are `amount` (`integer_literal`, `min` 1), `unit` (`string_literal`, `allowed_values`), and `timestamp` (`expression`), and sets 5 / `minute` / a timestamp field with alias `bucket`
- **THEN** the amount arg renders a numeric input floored at 1, the unit arg renders a select of the advertised units, and the timestamp arg renders a field dropdown
- **AND** `select` includes a `date_bin` function column aliased `bucket` whose args serialize as an integer value, a string value, and a field expression
- **AND** `group_by` includes `bucket`

#### Scenario: Multi-argument scalar function builds

- **WHEN** the user picks `width_bucket` whose catalog declares four `expression` args (`operand`, `low`, `high`, `count`) and fills each with a field, aliased `bkt`
- **THEN** the row renders four field dropdowns and `select` includes a `width_bucket` column aliased `bkt` with four field-expression args

#### Scenario: Ordered-set aggregate with a bounded literal builds

- **WHEN** the user picks `percentile_cont` whose catalog declares a `fraction` (`numeric_literal`, `min` 0, `max` 1) and a `column` (`expression`) argument
- **THEN** the fraction arg renders a numeric input constrained to `[0, 1]` and the column arg renders a field dropdown
- **AND** the serialized aggregate carries a numeric value arg and a field-expression arg

#### Scenario: Function select entries parse back into the correct section

- **WHEN** a JSON query's `select` holds a `scalar` catalog function column and an `ordered_set_aggregate` catalog function column
- **THEN** switching views shows the scalar one as a Group by function row and the ordered-set one as an Aggregate row

#### Scenario: Implicit measure is chosen from the catalog

- **WHEN** the user builds an `aggregate` query with a group-by column and no explicit aggregate
- **THEN** the serialized `select` includes an implicit measure that is the first catalog `aggregate`-group function whose arguments are all optional (`count`), aliased with the implicit count alias

#### Scenario: New aggregate row arrives with a derived alias

- **WHEN** the user adds a `sum` aggregate over the field `total_tokens` whose schema display name is "Total tokens"
- **THEN** the row's alias input is prefilled with `Total tokens (Sum)`
- **AND** the serialized aggregate column carries that value as its `as`

#### Scenario: Derived alias follows the row until the user edits it

- **WHEN** a prefilled `sum` aggregate's argument is changed to another field
- **THEN** the alias is rederived from the new argument
- **AND** after the user types a custom alias, changing the function or argument again leaves that custom alias untouched

#### Scenario: Distinct and argument-less aggregates derive readable aliases

- **WHEN** the user adds a `count` aggregate with DISTINCT over `project_id` (display name "Project ID") and a second `count` aggregate with no argument
- **THEN** the first row's alias is `Project ID (Row count distinct)`
- **AND** the second row's alias is `Row count`

#### Scenario: Duplicate derived aliases are uniquified

- **WHEN** the user adds a second `sum` aggregate over the same field as an existing prefilled one
- **THEN** the second row's derived alias is suffixed to stay unique (e.g. `Total tokens (Sum) 2`)

#### Scenario: Cleared alias falls back to the derived value

- **WHEN** the user clears an aggregate row's alias input and runs the query
- **THEN** the serialized aggregate column's `as` is the derived alias rather than an empty string
- **AND** the run is not rejected for a missing alias

#### Scenario: An authored alias survives a JSON round-trip

- **WHEN** a JSON query aliases a `sum` column `total` and the user switches to the Builder view
- **THEN** the aggregate row shows the alias `total`
- **AND** it is not rewritten to a derived alias

### Requirement: Aggregate-mode HAVING builder

In `aggregate` mode the builder SHALL provide a Having section using the same nested group/condition builder as the Filter section, but whose selectable fields are the query's aggregate output columns, resolved through the same shared name resolver Sort and serialization use: the plain group-by columns, every group-by function entry and aggregate under its effective name (its alias, or the derived name a blank alias falls back to), and — when the query defines no aggregates of its own — the implicit count column. A function entry whose required arguments are unfilled is excluded from the query and SHALL NOT be offered. The built tree SHALL serialize to the query's `having` node under the same rules as the filter tree.

#### Scenario: Having references an aggregate alias

- **WHEN** an aggregate is aliased `total` and the user adds a Having condition `total gt 100`
- **THEN** the field selector for that condition offers `total`
- **AND** the serialized query includes a `having` node with that predicate

#### Scenario: Having offers an aggregate whose alias is blank

- **WHEN** an aggregate's alias is empty and the user opens a Having condition's field selector
- **THEN** the aggregate is offered under the derived name the query will carry
- **AND** a condition on it serializes against that same name

### Requirement: Sort keys

The Sort section SHALL let the user add, edit, and remove sort keys, each with a field, a direction (`asc` / `desc`), and an optional nulls ordering (default / nulls first / nulls last). The direction selector SHALL show full names (Ascending / Descending) in its open list, its collapsed trigger, and the sort row's collapsed summary; the nulls select trigger SHALL carry a dimmed "Nulls:" prefix so its role is readable next to the direction select. In `row` mode the field options SHALL be the schema fields; in `aggregate` mode they SHALL be the aggregate output names: group-by columns, plus every computed row named by its **effective** alias — the row's alias, or the derived alias the serializer would fall back to when it is blank — so a computed column is offered even when its alias is empty (a query parsed from JSON, SQL, or the assistant, or an alias the user cleared). When the query defines no aggregates of its own, the implicit count column SHALL be offered too, since it is one of the query's output columns. Fieldless sort keys SHALL be omitted, and `sort` SHALL be omitted entirely when no valid key remains; the nulls ordering SHALL be omitted when left at default.

#### Scenario: Sort key serializes

- **WHEN** the user adds a sort key on a field with direction `desc`
- **THEN** the serialized `sort` contains an item with that field and `dir: "desc"`

#### Scenario: Nulls control names itself

- **WHEN** the user inspects a sort key row
- **THEN** the nulls select shows a "Nulls:" prefix before the selected value

#### Scenario: A freshly added aggregate is immediately sortable

- **WHEN** the user adds a `sum` aggregate in aggregate mode and then opens a sort key's field dropdown
- **THEN** that aggregate's derived alias is offered as a sort field
- **AND** picking it serializes a sort item naming that alias

#### Scenario: An aggregate whose alias is blank is still sortable

- **WHEN** a query parsed from JSON carries a `sum` column with no `as`, and the user opens a sort key's field dropdown
- **THEN** that aggregate is offered under the derived alias the query will be serialized with
- **AND** sorting by it produces a sort key matching that column's `as`

#### Scenario: The implicit count column is sortable

- **WHEN** aggregate mode has a group-by column and no aggregates of its own
- **THEN** the implicit count column is offered as a sort field

#### Scenario: Direction reads in words

- **WHEN** the user opens a sort key's direction selector
- **THEN** the options read "Ascending" and "Descending"
- **AND** the closed trigger and the row's collapsed summary read the same way

### Requirement: Paging

The Page section SHALL provide an "include page" toggle and a paging strategy selector (`offset` or `cursor`). For `offset` the controls SHALL be offset, limit, and an `include_total` toggle; for `cursor` the controls SHALL be a cursor value and a limit. The serialized `page` object SHALL match the selected strategy, and SHALL be omitted entirely when "include page" is off.

#### Scenario: Offset paging serializes

- **WHEN** "include page" is on with strategy `offset`, offset `0`, limit `25`, include_total off
- **THEN** `page` is `{ "type": "offset", "offset": 0, "limit": 25, "include_total": false }`

#### Scenario: Paging omitted when disabled

- **WHEN** "include page" is off
- **THEN** the serialized query has no `page` key

### Requirement: JSON view and copy

The JSON view SHALL render the current serialized `StructuredQuery` as JSON in a Monaco editor. Editing the JSON to a valid query the builder can represent SHALL parse it back into the builder state so the Builder view reflects the last such JSON; invalid JSON SHALL be flagged non-blockingly and SHALL disable Run while invalid. Valid JSON that the visual builder cannot represent (e.g. filter nesting deeper than two levels) SHALL remain fully editable and runnable: a non-blocking informational message SHALL state that the query cannot be shown in the visual builder, Run SHALL stay enabled and SHALL execute the JSON query as written, and the builder state SHALL NOT be updated from that JSON (switching to the Builder view is guarded by the written-mode confirmation). Entering the JSON view SHALL seed the editor from the current builder state. The Copy action SHALL copy the currently displayed query text (JSON for the Builder/JSON views, the SQL text for the SQL view).

#### Scenario: JSON reflects the form and round-trips

- **WHEN** the user edits the form, switches to the JSON view, and edits the JSON to valid content the builder can represent
- **THEN** the JSON initially mirrors the form
- **AND** the edited valid JSON is parsed back so the form reflects it

#### Scenario: Invalid JSON is flagged and blocks Run

- **WHEN** the JSON editor contains invalid JSON
- **THEN** a non-blocking invalid-JSON message is shown
- **AND** the Run action is disabled

#### Scenario: Unrepresentable JSON stays runnable

- **WHEN** the JSON editor contains a valid query whose filter nests deeper than two levels
- **THEN** a non-blocking message states the query cannot be shown in the visual builder
- **AND** the Run action stays enabled and executes the JSON query as written
- **AND** the builder state is not updated from that JSON

### Requirement: Aggregate validation warnings

While in `aggregate` mode the builder SHALL surface non-blocking warnings when: any Group by function entry lacks a source field; or the query has no group-by entries or aggregates. The warnings SHALL clear when resolved and SHALL NOT prevent running the query. There SHALL be no missing-alias warning: a computed row's alias is prefilled and a blank alias falls back to the derived value at serialization, so the state those warnings described is unreachable.

#### Scenario: Missing function argument warns

- **WHEN** a Group by function entry has an unfilled required argument
- **THEN** a warning states that the entry needs a source field

#### Scenario: Empty aggregate query warns

- **WHEN** aggregate mode has no group-by entries and no aggregates
- **THEN** a warning states that the query needs at least one group-by entry or aggregate

#### Scenario: Warnings clear when resolved

- **WHEN** the Group by function entry gains its source field
- **THEN** the corresponding warning is no longer shown

#### Scenario: A blank alias raises no warning

- **WHEN** the user clears an aggregate row's alias
- **THEN** no missing-alias warning is shown
- **AND** the query still runs, serializing the derived alias

### Requirement: Run query and result

The toolbar Run action SHALL execute the current query and render the result in the main results area. In the Builder view the query is the serialized `StructuredQuery` from the builder state; in the JSON view it is the query as written in the editor — both executed via a server action delegating to `analyticsDataApi.executeAction` (`/v1/queries/execute`). The result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified. A result column that names a schema field SHALL be headed by that field's display name, resolved through the same executed-query column-label map the chart views use; a column produced by a computed output column SHALL be headed by its alias, which is already human-readable. A SQL-view run, whose columns the builder cannot attribute to schema fields, SHALL head every column by its returned name. Before any run, the results area SHALL show an empty state inviting the user to run the query. An empty result SHALL show an empty-state message. A failed run SHALL surface an error via the app's notification convention and SHALL NOT replace a previously shown result with a broken grid. Run SHALL be disabled until a schema is loaded and while the JSON view contains invalid (unparseable) JSON.

#### Scenario: Successful run renders a result grid

- **WHEN** the user runs a valid query that returns rows
- **THEN** the rows are shown in a grid in the main results area with a column per result column

#### Scenario: Empty state before the first run

- **WHEN** the page is open and no query has been run yet
- **THEN** the results area shows an empty state inviting the user to run the query

#### Scenario: Empty result

- **WHEN** a run returns no rows
- **THEN** an empty-state message is shown instead of a grid

#### Scenario: Failed run surfaces an error

- **WHEN** a run fails
- **THEN** an error notification is shown
- **AND** the previous result (if any) is not replaced by a broken grid

#### Scenario: Result grid heads schema columns by display name

- **WHEN** a row-mode run projects `total_tokens`, whose schema display name is "Total tokens"
- **THEN** the grid column is headed "Total tokens"
- **AND** the row data is still keyed by the raw column name `total_tokens`

#### Scenario: Aggregate result heads columns consistently

- **WHEN** an aggregate run groups by `deployment` (display name "Deployment") and sums `total_tokens` under the derived alias `Total tokens (sum)`
- **THEN** the grid heads the two columns "Deployment" and "Total tokens (sum)"

#### Scenario: SQL-view result keeps returned column names

- **WHEN** the user runs a query from the SQL view
- **THEN** each grid column is headed by the name the result returned

### Requirement: Result stat tiles

When a result is shown, the results area SHALL display a stat-tile row above the result with: the number of returned rows, the number of result columns (Fields), and — when the response includes a total count — the Total. The service computes `totalCount` only for row-mode offset paging with `include_total=true`, so the Include total toggle SHALL be offered only in row mode with offset paging, and aggregate/SQL results never show a Total tile. No timing tile SHALL be shown (the backend does not report query timing).

#### Scenario: Tiles reflect the result

- **WHEN** a run returns 12 rows with 5 columns and no total
- **THEN** the stat tiles show Rows 12 and Fields 5
- **AND** no Total tile is shown

#### Scenario: Total appears when reported

- **WHEN** a row-mode offset-paged run requested a total and the response includes one
- **THEN** a Total tile shows the reported total

#### Scenario: Include total is offered only where the service supports it

- **WHEN** the builder is in aggregate mode (or cursor paging is selected)
- **THEN** the Include total toggle is not shown

### Requirement: Result table and chart views

The results area SHALL offer a Table ⇄ Chart switcher. The Table view SHALL render the result grid. Each result column SHALL render its row's actual value looked up by its exact column name, including a column name that itself contains a literal `.` (for example an enrichment projection's `table.column`) — such a name SHALL NOT be treated as a nested-path lookup. The Chart view SHALL render the result with ECharts and offer a chart-type control with four types — bar, line, pie, and scatter — plus two column selectors whose allowed columns and labels follow the selected type. The Chart view SHALL be available only when the shown result came from an aggregate-mode structured run with at least one group-by or bucket column; otherwise the Chart view SHALL show a hint that charts require an aggregate result with a group-by. Chart colors SHALL come from the shared chart color tokens.

For **bar** and **line**, the selectors SHALL be labeled X axis and Y axis: X over the executed query's group-by/bucket columns, Y over its aggregate columns (including the count column when present); defaults SHALL be the first dimension and the first aggregate. When every X value is numeric or date-like, the chart SHALL order the points along the X axis by that natural order (chronological/numeric ascending) regardless of the query's row order; mixed or plain-text X values keep row order. Long X-axis labels SHALL be truncated to a fixed label width with the full value available in the tooltip.

For **pie**, the same two selectors SHALL be labeled Category (group-by/bucket columns) and Value (aggregate columns). The chart SHALL show at most the top 10 categories by value as slices; any remaining categories SHALL be merged into a single "Other" slice.

For **scatter**, both selectors SHALL be labeled X axis and Y axis and SHALL offer the result's numeric columns — the group-by/bucket and aggregate columns whose every value is numeric or date-like. Each result row (one group) SHALL render as one point, with the row's dimension values available in the point tooltip; scatter SHALL NOT re-order rows. The scatter type SHALL be offered only when the result has at least two numeric columns; otherwise it is hidden from the chart-type control.

Switching chart type SHALL keep a column pick that is valid for the new type's selector and SHALL fall back to that selector's first valid default otherwise.

Everywhere the chart names a column — selector options, in-chart axis titles, and point tooltips — a group-by/bucket column SHALL display by its schema display name when the executed entity defines one (raw name otherwise); aggregate and scalar-function columns display by their user-authored alias. The labels SHALL follow the executed query's entity, not the currently selected source.

#### Scenario: Chart columns display by their schema display name

- **WHEN** an aggregate result grouped by a column whose schema defines a display name is charted
- **THEN** the axis selector and the chart axis title show the display name instead of the raw column name
- **AND** aggregate columns keep their user-authored aliases

#### Scenario: Chart renders for an aggregate result

- **WHEN** the shown result came from an aggregate run grouped by one field and the user selects the Chart view
- **THEN** a chart renders with the group-by column on X and an aggregate column on Y
- **AND** the user can switch between bar, line, pie, and scatter types

#### Scenario: Pie buckets the long tail into Other

- **WHEN** an aggregate result has more than 10 category values and the user selects the pie type
- **THEN** the pie shows the top 10 categories by value as slices
- **AND** the remaining categories are merged into a single "Other" slice

#### Scenario: Scatter plots one point per group

- **WHEN** an aggregate result grouped by one field has two aggregate columns and the user selects the scatter type
- **THEN** each group renders as one point with one aggregate on X and the other on Y
- **AND** the point tooltip shows the group's dimension value

#### Scenario: Scatter requires two numeric columns

- **WHEN** the shown aggregate result has only one numeric column
- **THEN** the scatter type is not offered in the chart-type control

#### Scenario: Column picks survive a compatible type switch

- **WHEN** the user configured Category and Value on a pie and switches to the bar type
- **THEN** the same columns stay selected as X and Y

#### Scenario: Comparable X values are ordered on the axis

- **WHEN** a top-N-by-count aggregate result has time-bucket X values and the user opens the Chart view
- **THEN** the chart shows the buckets in chronological order along the X axis
- **AND** the table keeps the query's row order

#### Scenario: Chart hint for non-aggregate results

- **WHEN** the shown result came from a row-mode or SQL run and the user selects the Chart view
- **THEN** a hint explains that charts require an aggregate result with a group-by

#### Scenario: A dotted column name still shows its value

- **WHEN** a result row includes a column whose name contains a literal `.` (e.g. an enrichment projection) and the backend response carries a value for it
- **THEN** the Table view shows that value in the corresponding cell rather than leaving it blank

### Requirement: Backend-authoritative query translation

The Query Builder SHALL treat the Analytics data-access service as the single source of truth for translating between the structured query DSL and SQL, via two validation-only endpoints that never run against ClickHouse. The server API layer SHALL expose `translateAction(query)` for `POST /v1/queries/translate` (DSL → SQL, success body `{ "sql": <text> }`) and `translateSqlAction(sql)` for `POST /v1/queries/translate-sql` (SQL → DSL, success body `{ "query": <StructuredQuery> }`), each returning a `ServerActionResponse` envelope and reached through a server action injecting the user token. The frontend SHALL NOT generate SQL from the structured query on the client; the client-side generator is removed. When the backend rejects a translation with a `400` (a DSL the SQL subset cannot express, or SQL that is unparseable or uses an unsupported construct), the failure SHALL be handled per the consuming requirement (SQL-view seeding surfaces the error; the Builder switch falls back to the discard guard) and SHALL NOT be presented as a successful translation.

#### Scenario: DSL is translated to SQL through the backend

- **WHEN** the SQL view needs to seed its editor from the current builder query
- **THEN** the structured query is sent to `POST /v1/queries/translate`
- **AND** the returned `{ sql }` text is used verbatim as the editor contents

#### Scenario: SQL is translated to a structured query through the backend

- **WHEN** SQL is translated for display in the visual builder
- **THEN** the SQL is sent to `POST /v1/queries/translate-sql`
- **AND** the returned `{ query }` is a structured query the `execute` endpoint would accept

#### Scenario: A DSL the SQL subset cannot express is rejected

- **WHEN** `POST /v1/queries/translate` is called for a query the SQL subset cannot express (for example `include_total`)
- **THEN** the backend responds `400`
- **AND** the frontend surfaces the failure rather than showing generated SQL

### Requirement: SQL view shows only a SQL editor

In the SQL view the rail SHALL render a SQL code editor filling the rail body, and SHALL NOT render the Mode, Filter, Select, Group by, Aggregate, Having, Sort, or Page sections. The source selector remains available in the toolbar. The editor SHALL provide SQL syntax highlighting (via the Monaco `sql` language). The Copy and Run actions SHALL remain available; Copy SHALL copy the SQL editor text.

#### Scenario: SQL view hides the builder sections

- **WHEN** the user selects the SQL view
- **THEN** a SQL editor is shown in the rail
- **AND** none of the Mode, Filter, Select, aggregate, Sort, or Page sections are shown

#### Scenario: SQL text is highlighted

- **WHEN** the user types a SQL statement in the SQL editor
- **THEN** the statement is rendered with SQL syntax highlighting

### Requirement: Schema-aware SQL autocomplete

The SQL editor SHALL offer completion suggestions derived from the loaded schema and a fixed SQL catalog: the loaded schema's field names (each annotated with its field type), the selected entity name (as the query's source/`FROM` target), and the supported SQL keywords and functions. The keyword catalog SHALL include both `LIKE` (case-sensitive contains) and `ILIKE` (case-insensitive contains). Suggestions SHALL reflect the schema currently loaded, so changing the selected entity SHALL change the suggested field names and source name. The autocomplete SHALL NOT perform SQL validation.

#### Scenario: Schema fields are suggested

- **WHEN** the user triggers completion in the SQL editor with a schema loaded
- **THEN** the loaded schema's field names are offered as suggestions
- **AND** each field suggestion shows its field type
- **AND** the selected entity name is offered as the source

#### Scenario: Suggestions follow the selected entity

- **WHEN** the user selects a different entity and triggers completion
- **THEN** the suggested field names are those of the newly selected entity's schema

#### Scenario: ILIKE is offered as a keyword

- **WHEN** the user triggers keyword completion in the SQL editor
- **THEN** both `LIKE` and `ILIKE` are offered as suggestions

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

The Query Builder SHALL keep the SQL editor text as its own buffer. Entering the SQL view SHALL seed the editor by translating the current builder query (including the toolbar time bound and the implicit count) to SQL via `POST /v1/queries/translate` through a server action, when the buffer is empty or still matches the last generated text; the seed is asynchronous and the editor SHALL show a loading affordance while the translation is in flight. When the translation is rejected (`400` — a query the SQL subset cannot express), the failure SHALL surface via the app's error-notification convention and the editor SHALL be left empty (with Run disabled), rather than being seeded with a locally generated or partial statement. User-edited SQL SHALL never be overwritten by a re-seed. Switching between the SQL and JSON views SHALL NOT prompt and SHALL leave both buffers intact.

#### Scenario: Entering SQL translates the builder query via the backend

- **WHEN** the user opens the SQL view without prior SQL edits
- **THEN** the current builder query is sent to `POST /v1/queries/translate`
- **AND** the editor is pre-filled with the returned SQL, auto-formatted for readability (see "SQL editor auto-formatting")

#### Scenario: A non-expressible query surfaces a translate error

- **WHEN** the user opens the SQL view for a query the SQL subset cannot express and the backend responds `400`
- **THEN** an error notification is shown with the backend's message
- **AND** the SQL editor is left empty and Run is disabled

#### Scenario: SQL text persists across written-mode switches

- **WHEN** the user edits SQL, switches to the JSON view, and switches back to the SQL view
- **THEN** the SQL editor shows the previously edited text unchanged
- **AND** the edited text is not re-translated over

### Requirement: SQL editor auto-formatting

The SQL editor SHALL auto-format its contents — there SHALL be no manual "Format" action. Formatting SHALL apply: when text is seeded into the editor (the translated builder query, or SQL returned from a rejected-JSON fallback), as the user types, and as the user pastes, using the Monaco `sql` language's document-formatting provider backed by the `sql-formatter` library. A syntax error in the current text SHALL leave that text unformatted rather than throwing or clearing it. Formatting is a display concern only: the text actually executed or copied is whatever the editor currently holds (the formatted text), and translating that SQL back to a structured query (see "Switching from a written mode to the Builder is guarded") is unaffected by whitespace/formatting differences.

#### Scenario: Typed SQL is auto-formatted

- **WHEN** the user types a SQL statement in the editor
- **THEN** the statement is reformatted without a manual Format action

#### Scenario: Pasted SQL is auto-formatted

- **WHEN** the user pastes a SQL statement into the editor
- **THEN** the pasted text is reformatted in place

#### Scenario: Seeded SQL is pre-formatted

- **WHEN** the editor is seeded from the translated builder query
- **THEN** the seeded text is already formatted, with no separate user action required

#### Scenario: Unformattable text is left as-is

- **WHEN** the editor's current text is not valid SQL
- **THEN** formatting leaves the text unchanged rather than erroring

### Requirement: Switching from a written mode to the Builder is guarded

SQL and JSON are "written" modes: they can hold queries the visual builder cannot display (edited SQL text; JSON with e.g. filter nesting deeper than two levels). When the user switches from the SQL view to the Builder view with an edited SQL buffer, the SQL SHALL first be translated to the structured DSL via `POST /v1/queries/translate-sql`. If the translation succeeds and the resulting query is representable in the two-level visual builder, the builder SHALL be hydrated from that query and the view SHALL switch with no confirmation and no data loss. If the translation fails (`400` — parse failure or an unsupported construct) or the resulting query is not builder-representable, a confirmation popup (danger variant) SHALL warn that switching will drop the current query and reset the builder to its starting point. From the JSON view the same guard applies when the JSON is valid but unrepresentable. Confirming SHALL discard the written query (clear the SQL buffer / discard the JSON edits), reset the builder state to its initial defaults for the selected entity, and switch to the Builder view. Cancelling SHALL keep the user in the written mode with the query intact. Switching to the Builder SHALL NOT prompt when nothing would be lost (empty or unedited generated SQL; SQL that translates to a representable query; JSON that round-trips into the builder).

#### Scenario: Translatable SQL hydrates the builder without a prompt

- **WHEN** the user edits SQL that translates to a builder-representable query and selects the Builder view
- **THEN** no confirmation is shown
- **AND** the builder reflects the translated query
- **AND** the SQL buffer is cleared

#### Scenario: Untranslatable SQL asks for confirmation

- **WHEN** the user edits SQL that the backend rejects (or that translates to an unrepresentable query) and selects the Builder view
- **THEN** a confirmation popup warns that the current query will be dropped and the builder reset

#### Scenario: Confirming drops the written query and resets the builder

- **WHEN** the confirmation popup is shown and the user confirms
- **THEN** the view switches to the Builder view
- **AND** the written query is discarded
- **AND** the builder state is reset to its initial defaults for the selected entity

#### Scenario: Cancelling keeps the written query

- **WHEN** the confirmation popup is shown and the user cancels
- **THEN** the user remains in the written mode
- **AND** the written query text is unchanged

#### Scenario: Representable JSON switches silently

- **WHEN** the JSON editor holds a valid query the builder can represent and the user selects the Builder view
- **THEN** no confirmation is shown
- **AND** the builder reflects that query

### Requirement: Saved query storage contract

A saved query SHALL be an addressable object holding authored **intent** only: a name, an optional description and tag, a sharing scope, exactly one of a structured query body or a SQL body, the author's time intent, how the result was last rendered, and a chart configuration. The frontend SHALL treat the analytics data-access service's `/v1/saved-queries` contract as authoritative and SHALL NOT extend it.

The write payload SHALL consist of exactly these nine members: `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, `chart`. The frontend SHALL NOT send `id`, `owner_id`, `owner_email`, `source`, `generation`, `created_at`, `updated_at`, or `params` on a create or a replace — the service rejects each with `422`, so a payload type distinct from the response type SHALL be used rather than a subset of it.

The response's optional members SHALL be modelled as optional rather than nullable: the service omits absent members rather than emitting `null`.

`source` SHALL be treated as server-derived and read-only. `generation` SHALL be treated as a change counter for display only; because the service accepts no precondition header, concurrent writes are last-write-wins and the frontend SHALL NOT present a conflict-resolution affordance.

#### Scenario: The write payload carries only the nine accepted members

- **WHEN** a query is created or saved
- **THEN** the request body contains only `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, and `chart`
- **AND** no server-assigned member is present

#### Scenario: Exactly one body is sent

- **WHEN** the query being saved was authored in the SQL view with non-blank SQL text
- **THEN** the payload carries `sql` and omits `query`

#### Scenario: A structured body is sent when the SQL buffer is not in play

- **WHEN** the query being saved was authored in the Builder or JSON view
- **THEN** the payload carries `query` and omits `sql`

### Requirement: Saved query server API layer

The server API layer SHALL expose the saved-query endpoints of the analytics data-access service through the existing `analyticsDataApi` client and through server actions under `src/app/[lang]/queries/actions.ts` that inject the user token. List and single reads SHALL return the typed value or `null`; create, replace, and delete SHALL return a `ServerActionResponse`, because their callers branch on the machine error code carried on the failure envelope.

#### Scenario: List is scoped

- **WHEN** the saved queries for a scope are requested
- **THEN** the request is sent to `GET /v1/saved-queries` with that scope as a query parameter

#### Scenario: Writes surface the failure envelope

- **WHEN** a create, replace, or delete fails
- **THEN** the action returns a `ServerActionResponse` carrying the service's machine error code and message

### Requirement: Queries list page

The Analytics group SHALL provide a `/queries` page listing the saved queries visible to the caller. The page SHALL be an `async` server component gated by the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is denied. Because the service returns every visible row unpaged and offers no server-side sorting or filtering, the page SHALL fetch the full list on the server and the grid SHALL sort and filter client-side.

The service lists one scope per call, so the page SHALL fetch both the caller's personal scope and the common scope and present them as one list. The grid SHALL show, at minimum, the query's name, description, source, tag, scope, the editor its body opens in, the author's display email, and its created and updated timestamps. The editor column SHALL be derived from the body — a SQL body is SQL, a structured body the visual builder can represent is Builder, and any other structured body is JSON — and SHALL NOT be read from a stored field. The author column SHALL tolerate an absent value, which the service reports whenever there is no email to record.

Activating a row SHALL navigate to that query's page. Each row SHALL offer an actions menu with Open in new tab, Edit, and Delete. The page SHALL offer a Create action. When the caller has no visible saved queries the grid SHALL show an empty state.

#### Scenario: Both scopes appear in one list

- **WHEN** the caller has personal saved queries and common saved queries exist
- **THEN** the grid lists both
- **AND** each row shows its scope

#### Scenario: The editor column is derived from the body

- **WHEN** a listed saved query carries a structured body whose filter nesting the visual builder cannot represent
- **THEN** its editor column reads JSON

#### Scenario: A row opens its query

- **WHEN** the user activates a grid row
- **THEN** the browser navigates to that saved query's page

#### Scenario: Row actions are offered

- **WHEN** the user opens a row's actions menu
- **THEN** Open in new tab, Edit, and Delete are offered

#### Scenario: Empty state when nothing is visible

- **WHEN** the caller has no visible saved queries
- **THEN** the grid shows an empty state rather than an empty table

### Requirement: Create a query

The Queries page SHALL offer a create modal collecting a **required** name and an optional description and tag. The modal SHALL NOT ask for a source or a scope. Submission SHALL be blocked while the name is blank.

Because the service refuses a saved query that could not execute as stored, the create SHALL send a minimal executable structured body targeting a default source — the first queryable entity — in row mode, together with a table result view. Scope SHALL be omitted, which the service resolves to personal.

On success the modal SHALL close, a success notification SHALL be shown, and the browser SHALL navigate to the new query's page so the user authors it there. On failure an error notification SHALL be shown carrying the service's message and the request identifier, and the modal SHALL stay open with the entered values intact.

#### Scenario: Name is required

- **WHEN** the create modal is open and the name field is blank
- **THEN** the submit action is disabled

#### Scenario: A created query is executable as stored

- **WHEN** the user submits the create modal with a name only
- **THEN** the request carries that name and a structured body naming the default source in row mode
- **AND** no source or scope field was presented to the user

#### Scenario: Success navigates to the new query

- **WHEN** a create succeeds
- **THEN** a success notification is shown
- **AND** the browser navigates to the created query's page

#### Scenario: Failure keeps the modal open

- **WHEN** a create fails
- **THEN** an error notification carries the service's message and the request identifier
- **AND** the modal remains open with the entered values

### Requirement: Edit query metadata

A saved query's name, description, tag, and scope SHALL be editable through a single modal, reachable from the Edit action in the Queries grid's row menu and from an Edit control on the query's own page. The modal SHALL reuse the same field set as the create modal, so the two cannot diverge.

Editing metadata SHALL replace the stored query with its body unchanged. A blank name SHALL block submission. The scope field SHALL be offered only when the caller is a full administrator, because the service permits common writes only to that role.

On success a success notification SHALL be shown and the affected view SHALL reflect the new values. On failure an error notification SHALL be shown.

#### Scenario: Metadata edits leave the body alone

- **WHEN** the user changes only the name in the edit modal and submits
- **THEN** the replace request carries the same body the query already had
- **AND** the new name

#### Scenario: Scope is administrator-only

- **WHEN** a caller who is not a full administrator opens the edit modal
- **THEN** no scope field is offered

#### Scenario: Edit is reachable from both surfaces

- **WHEN** the user activates Edit from a grid row, or the Edit control on a query's page
- **THEN** the same modal opens, seeded with that query's current metadata

### Requirement: Delete a query

A saved query SHALL be deletable from the Queries grid's row actions menu, behind the application's standard delete confirmation. On success the row SHALL disappear from the grid and a success notification SHALL be shown. On failure an error notification SHALL be shown. Delete SHALL be offered only when the caller may write the row's scope.

#### Scenario: Delete asks for confirmation

- **WHEN** the user activates Delete on a grid row
- **THEN** a confirmation naming the query is shown before anything is deleted

#### Scenario: A confirmed delete removes the row

- **WHEN** the user confirms the deletion and it succeeds
- **THEN** a success notification is shown
- **AND** the query is no longer listed

### Requirement: A query page loads its stored query into the builder

The Analytics group SHALL provide a `/queries/{id}` page rendering the Query Builder seeded from the stored saved query. The page SHALL be an `async` server component gated by the same Analytics access check as the other Analytics pages, and SHALL resolve to a not-found result when the query cannot be read — the service reports a query the caller may not see as absent rather than forbidden, so the two cases SHALL be indistinguishable to the user.

The page SHALL fetch the schema of **the stored query's own source**, not the first queryable entity's. The view the builder opens in SHALL be derived from the body: a SQL body opens the SQL view with the stored text, a structured body the visual builder can represent opens the Builder view hydrated from it, and any other structured body opens the JSON view showing it. The heading SHALL show the query's name.

The stored time intent SHALL be applied to the toolbar time filter: a relative intent selects that period, an absolute intent selects that custom range, and an absent intent leaves the toolbar at its default. A relative period the frontend does not recognise SHALL leave the toolbar unchanged and SHALL NOT prevent the query from loading.

#### Scenario: A structured body opens in the Builder view

- **WHEN** the user opens a query whose structured body the visual builder can represent
- **THEN** the Builder view is shown reflecting that query
- **AND** the heading shows the query's name

#### Scenario: An unrepresentable structured body opens in the JSON view

- **WHEN** the user opens a query whose structured body the visual builder cannot represent
- **THEN** the JSON view is shown containing that body

#### Scenario: A SQL body opens in the SQL view

- **WHEN** the user opens a query carrying a SQL body
- **THEN** the SQL view is shown containing the stored statement
- **AND** entering the SQL view does not overwrite it with a re-seeded translation

#### Scenario: The schema loaded is the query's own source

- **WHEN** the user opens a query whose source is not the first queryable entity
- **THEN** the fields available to the builder are that source's fields

#### Scenario: An unreadable query is not found

- **WHEN** the user opens an id that does not exist, or one belonging to another caller's personal scope
- **THEN** the page resolves to a not-found result, identically in both cases

#### Scenario: An unrecognised relative period still loads

- **WHEN** a stored query carries a relative period the frontend does not recognise
- **THEN** the query loads and the toolbar time filter is left as it was

### Requirement: Saving persists authored intent, not a resolved range

Saving SHALL persist the query as authored intent. The persisted structured body SHALL be serialized **without** the toolbar's time bound, and the authored range SHALL travel separately as time intent: a preset period SHALL be stored as its relative token and SHALL NOT be resolved to instants, and a custom range SHALL be stored as an absolute pair. An absolute pair whose start is after its end SHALL be ordered before it is sent.

This is the load-bearing distinction: serializing the range into the body — as the Run and JSON-view paths correctly do — would freeze the query to the day it was authored, and the service cannot detect that because a frozen range is a valid query.

Saving SHALL replace the stored query and SHALL then re-read it so the page reflects what was persisted. On success a success notification SHALL be shown; on failure an error notification SHALL be shown and the unsaved edits SHALL be preserved.

#### Scenario: A relative period is stored as a token

- **WHEN** the user saves a query with a preset time period selected
- **THEN** the payload's time intent names that period as a relative token
- **AND** the payload's structured body contains no timestamp range predicate

#### Scenario: A custom range is stored as instants

- **WHEN** the user saves a query with a custom range selected
- **THEN** the payload's time intent carries that range as an absolute pair
- **AND** the payload's structured body contains no timestamp range predicate

#### Scenario: A relative period survives a round trip

- **WHEN** a query saved with a preset period is reopened later
- **THEN** the toolbar shows that same preset period, not a fixed range

#### Scenario: A failed save keeps the edits

- **WHEN** a save fails
- **THEN** an error notification is shown
- **AND** the user's unsaved edits remain in the builder

### Requirement: Unsaved changes and discard on a query page

A query page SHALL indicate whether it holds unsaved changes and SHALL offer Save and Discard controls in the builder toolbar's actions area, leaving the page's layout otherwise as it is. Unsaved-change detection SHALL compare the payload the page would save against the payload the stored query represents, so it cannot disagree with what is actually persisted; it SHALL NOT compare builder state directly, which carries catalog data and generated identifiers that differ between two states representing the same query.

Every member of the write payload SHALL count toward unsaved changes — the body, the time intent, the result view, and the chart configuration alike. Save SHALL be unavailable when nothing has changed, because the service refreshes the modification timestamp on every write and that timestamp is the order the list is shown in.

Discard SHALL ask for confirmation and, on confirmation, SHALL restore the page to the stored query. This discard SHALL be distinct from the existing guard on switching out of a written view: that guard resets the builder to its starting defaults, whereas this one reverts to the last saved query.

#### Scenario: An edit enables Save and Discard

- **WHEN** the user changes anything the payload carries — a filter, the time period, the result view, or the chart configuration
- **THEN** the page indicates unsaved changes and Save and Discard become available

#### Scenario: Save is unavailable when nothing changed

- **WHEN** the page holds no unsaved changes
- **THEN** Save is unavailable

#### Scenario: Discard reverts to the last saved query

- **WHEN** the user discards and confirms
- **THEN** the builder, the time filter, the result view, and the chart configuration return to the stored query's values
- **AND** the page no longer indicates unsaved changes

#### Scenario: Discard can be cancelled

- **WHEN** the user discards and cancels the confirmation
- **THEN** the unsaved edits are still present

### Requirement: Result view and chart configuration round-trip

The result view a query was last rendered in, and its chart configuration, SHALL be part of what a saved query stores and restores. Reopening a saved query SHALL show it in its stored result view, and a stored chart configuration SHALL survive the page's first run rather than being reset by it. A stored chart configuration whose axis columns are not set SHALL be re-derived from the result. The chart configuration SHALL be stored without interpretation — it names result columns, not schema fields.

#### Scenario: A stored chart view is restored

- **WHEN** the user opens a query saved in the chart view and runs it
- **THEN** the result is shown as a chart using the stored chart type and axis columns

#### Scenario: An unset axis is re-derived

- **WHEN** the user opens a query whose stored chart configuration has no axis columns set and runs it
- **THEN** the chart selects its default columns from the result

#### Scenario: Changing the result view is an unsaved change

- **WHEN** the user switches a saved query from the table view to the chart view
- **THEN** the page indicates unsaved changes

### Requirement: Scope-based permission gating for saved queries

Writing a common-scope saved query SHALL require a full administrator, matching the service's rule. On a common query the caller may not write, Save, Edit, and Delete SHALL be unavailable rather than offered and allowed to fail. A caller's own personal queries SHALL always be writable by them.

#### Scenario: A non-administrator cannot write a common query

- **WHEN** a caller who is not a full administrator opens a common-scope saved query
- **THEN** Save and Edit are unavailable
- **AND** Delete is not offered for that row in the grid

#### Scenario: An administrator can write a common query

- **WHEN** a full administrator opens a common-scope saved query
- **THEN** Save, Edit, and Delete are available

### Requirement: Saved query failures are reported by machine error code

A failed saved-query request SHALL be reported by branching on the machine error code the service puts on its failure envelope, not on the HTTP status alone. Each recognised code SHALL map to its own guidance. A refusal caused by the body — a validation failure, a rejected literal, or a bad request — SHALL surface the service's own message alongside that guidance, because it names the offending part of the query; a refusal about identity or visibility SHALL NOT.

A query reported as absent SHALL be treated as gone: the user SHALL be told and returned to the Queries list, and the list SHALL be re-read.

No message SHALL disclose whether a query exists but is invisible, or whether a column exists but is restricted.

#### Scenario: A body refusal shows the service's message

- **WHEN** a save is refused because the body is invalid
- **THEN** the notification carries the service's message together with guidance on how to repair the query

#### Scenario: A visibility refusal does not

- **WHEN** a save is refused because the query is absent or not visible
- **THEN** the notification explains the query is no longer available without stating whether it exists

#### Scenario: A vanished query returns the user to the list

- **WHEN** the query the page is showing is reported as absent by a save
- **THEN** the user is notified and returned to the Queries list

### Requirement: The query assistant is given the selected source and its columns

A request to the query assistant SHALL lead with a system message describing the source currently
selected in the toolbar: its entity name, and for each of its fields the field's name, type, and the
display name and description the schema defines. A field the schema marks sensitive SHALL be marked as
such, so the assistant can avoid proposing a literal comparison the service would refuse to store.

The message SHALL carry **schema only**. No row data, and no value read out of the queried store, SHALL
be sent to the assistant deployment.

The message SHALL NOT appear in the visible transcript, and SHALL be built per request from the source
selected at that moment — so changing the source mid-conversation makes the next request describe the new
one. It SHALL state the selected source as the one to prefer rather than as a restriction, because a
generated query targeting a different entity is still honoured (see "Running a message's query loads it
into the builder and executes it").

When the selected source has no loaded field list, the message SHALL say so rather than name columns.

#### Scenario: The request names the selected source and its columns

- **WHEN** the user sends a request with an entity selected whose schema has loaded
- **THEN** the first message sent is a system message naming that entity
- **AND** it lists each of that entity's fields with its type

#### Scenario: Schema labels are included

- **WHEN** a listed field's schema defines a display name or a description
- **THEN** the system message carries them alongside that field's name and type

#### Scenario: A sensitive column is flagged

- **WHEN** a listed field is marked sensitive in the schema
- **THEN** the system message marks it as not to be compared to a literal value

#### Scenario: No row data is sent

- **WHEN** any request is sent to the assistant
- **THEN** the system message contains only entity and field names, types, and schema labels

#### Scenario: The schema message is not part of the conversation

- **WHEN** the user sends a request
- **THEN** the schema message is absent from the visible transcript

#### Scenario: Changing the source changes the next request

- **WHEN** the user selects a different source and sends another request
- **THEN** the system message on that request describes the newly selected source

#### Scenario: An unavailable column list is stated rather than invented

- **WHEN** the selected source has no loaded fields
- **THEN** the system message says the column list is unavailable and names no columns

### Requirement: The selected source is read from the builder context

Every part of the query builder that needs the selected entity, its fields, or the served function
catalog SHALL read them from the shared query-builder context rather than receive them as props, so a
single value decides which source is in play. This SHALL include the SQL editor's schema-aware
autocomplete and the AI panel's request context.

#### Scenario: SQL autocomplete follows the selected source

- **WHEN** the user selects a different source and opens the SQL view
- **THEN** the editor's completions offer that source's fields

#### Scenario: The assistant follows the selected source

- **WHEN** the user selects a different source and sends a request to the assistant
- **THEN** the request describes that source

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

### Requirement: Table detail column schema management

The Table detail page SHALL branch on the table's lifecycle `status`. The **live** column-management surface described here SHALL be offered only when the table is `ACTIVE`; for a `PENDING`/`FAILED` table the detail view SHALL instead offer the schema-definition surface (see "Define and materialize a table schema"). The detail header SHALL show the table's name and status badge regardless of status, and, when the table has a `description`, the description SHALL be shown beneath them regardless of status too (truncated with the full value reachable via an ellipsis tooltip, as elsewhere long text is truncated).

While the table is `ACTIVE`, the header SHALL also show a read-only schema-metadata summary: for a **source** table, its ordering key when set, its partition column and granularity together when a partition is set, and its `identity_column` and `version_column` each when the definition declares it; for an **enrichment** table, its grain key when set. A scan-metadata value the definition does not declare SHALL simply be omitted, with no substitute message. A `_`-prefixed scan-metadata value (e.g. `_ingested_at`) is a system column and legitimately matches no row in the columns grid; this SHALL NOT be treated as an error. This summary SHALL NOT be shown for a `PENDING`/`FAILED` table, which instead exposes the same fields as editable inputs in the schema-definition surface.

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
- **THEN** the description is shown under the name and status badge
- **AND** a table with no description shows nothing in its place

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

The table detail view SHALL provide a panel to view and manage the table's `write` / `modify` provider-role lists, backed by `AnalyticsDataApi.getTableAccess` / `replaceTableAccess` (`GET` / `PUT /v1/tables/{name}/access`) and a `TableAccess { write: string[]; modify: string[] }` model. Because the backend restricts `GET /access` to `FULL_ADMIN` and system tables carry no per-table roles to manage, the panel SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system); a save SHALL full-replace the lists via `replaceTableAccess`. Role names SHALL be picked as checkboxes from the DIAL Roles catalog (fetched via `RolesApi.getRolesList`, the same source other admin surfaces such as App Routes already use for role selection) rather than typed free text — each option's value is the `DialRole.name`, which is also the raw provider-role string the backend matches against; there is no separate role id. While the initial fetch (the table's current access and the roles catalog, requested together) is in flight the panel SHALL show a loading spinner in place of the role pickers. A failed access fetch and a failed roles-catalog fetch SHALL each surface their own error notification (the two requests can fail independently); Save SHALL stay disabled until the access fetch succeeds.

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
- **THEN** a loading spinner is shown until both the table's current access and the roles catalog have been fetched

#### Scenario: Every catalog role is offered, not just the granted ones

- **WHEN** the roles catalog loads
- **THEN** each write/modify picker offers every catalog role as a checkbox, with already-granted roles checked

#### Scenario: Roles-catalog fetch failure is surfaced independently

- **WHEN** the roles catalog fails to load even though the table's current access loads successfully
- **THEN** an error notification distinct from the access-load-failure notification is shown

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

For a **source** table, the Partition column field's label SHALL carry an info affordance (an icon with a hover tooltip) explaining that only Date/Timestamp-typed columns are selectable, since that restriction is not otherwise visually obvious. The Granularity field SHALL be rendered only once a partition column is selected; deselecting the partition column (including indirectly, by retyping the selected column away from Date/Timestamp) SHALL also clear any chosen granularity.

For a **source** table only, the surface SHALL offer two additional optional selects — **Identity column** and **Version column** — the pair the governed incremental scan pages a source by. An **enrichment** SHALL offer neither (the backend rejects either member for an enrichment with 422). The Identity column options SHALL be the declared columns that are non-nullable and not sensitive; the Version column options SHALL be that same set narrowed to `Timestamp`-typed columns (`Date` SHALL NOT be offered — the backend requires `timestamp`). Both labels SHALL carry an info affordance, following the Partition column pattern, stating that the values are the caller's own promise the service cannot verify (the version is assigned at ingest, monotonic, and never backdated; the identity is unique per row) and that the choice cannot be changed once the table is materialized.

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
- **THEN** the Partition column field's label shows an info icon
- **AND** hovering it shows a tooltip explaining that only Date/Timestamp columns are selectable

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

### Requirement: Table metadata editing (description and tag order)

The **catalog list's** row action menu SHALL let the user edit a table's catalog metadata — its `description` and its per-table `tag_order` — in any status, via `updateTable` (`PUT /v1/tables/{name}`). `tag_order` SHALL be presented as a reorderable list of the distinct tags currently declared on the table's columns, and the resulting ordered list of tag names SHALL be sent to the backend; an empty order SHALL clear it and an unchanged order SHALL be left as-is (merge-patch semantics). On success the catalog SHALL refresh from the server. This surface SHALL NOT be offered for system-owned tables, and SHALL NOT be offered from the table detail view.

#### Scenario: Description is edited via the table update endpoint

- **WHEN** the user activates a row's edit action, changes the table description, and submits
- **THEN** `updateTable` is sent with the new description and the catalog refreshes

#### Scenario: Tag order is reordered and saved

- **WHEN** the user reorders the table's column tags and submits
- **THEN** `updateTable` is sent with the ordered `tag_order` list and the catalog refreshes

### Requirement: Query Assistant feature flag derives from deployment config

The system SHALL expose a `queryAssistantEnabled: boolean` on the `FeatureFlags` object
(`models/feature-flags.ts`), initialized in the root layout (`app/[lang]/layout.tsx`) alongside the
other flags. It SHALL be `true` only when `ANALYTICS_ENABLED` resolves truthy (per `isValueTruthy`)
AND `process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT` is present (non-empty); otherwise `false`. The
`DIAL_QUERY_ASSISTANT_DEPLOYMENT` value is the assistant application's DIAL Core deployment id
(resource URL, stored raw with literal `/`) and SHALL be read server-side only.

#### Scenario: Flag true when analytics enabled and deployment set

- **WHEN** `ANALYTICS_ENABLED` is truthy and `DIAL_QUERY_ASSISTANT_DEPLOYMENT` is set to a non-empty value
- **THEN** `featureFlags.queryAssistantEnabled` is `true`

#### Scenario: Flag false when deployment unset

- **WHEN** `ANALYTICS_ENABLED` is truthy but `DIAL_QUERY_ASSISTANT_DEPLOYMENT` is unset or empty
- **THEN** `featureFlags.queryAssistantEnabled` is `false`

#### Scenario: Flag false when analytics disabled

- **WHEN** `ANALYTICS_ENABLED` is falsy
- **THEN** `featureFlags.queryAssistantEnabled` is `false` regardless of the deployment variable

### Requirement: Query Builder rail offers an AI view when the assistant is enabled

The Query Builder view switcher SHALL include a fourth mutually exclusive view — AI — alongside Form,
JSON, and SQL, rendered in the existing segmented control and marked with a spark icon. The AI option
SHALL be present only when `featureFlags.queryAssistantEnabled` is `true`. When the flag is `false` the
switcher SHALL offer exactly the existing three views. As with the other views, the switcher (and thus
the AI option) is available only once an entity schema has loaded.

#### Scenario: AI option shown when enabled

- **WHEN** the schema has loaded and `queryAssistantEnabled` is `true`
- **THEN** the view switcher offers Form, JSON, SQL, and AI

#### Scenario: AI option hidden when disabled

- **WHEN** the schema has loaded and `queryAssistantEnabled` is `false`
- **THEN** the view switcher offers only Form, JSON, and SQL and no AI option is present

#### Scenario: Selecting the AI view

- **WHEN** the user selects the AI view
- **THEN** the rail shows the AI panel and the current view is indicated as AI

### Requirement: AI panel accepts a plain-language prompt with suggestions

In the AI view the rail SHALL render a heading, an explanatory description, a conversation transcript,
a multi-line text input for a plain-language request, and a Send action. While the transcript is empty
the rail SHALL additionally render a set of suggested-prompt chips; once at least one message has been
sent the chips SHALL no longer be shown. Clicking a suggested-prompt chip SHALL populate the text input
with that chip's prompt text. The Send action SHALL be disabled while the input is empty or a
generation request is in flight. All text SHALL be provided through i18n.

#### Scenario: Suggested prompt fills the input

- **WHEN** the AI view is shown, the transcript is empty, and the user clicks a suggested-prompt chip
- **THEN** the text input is populated with that chip's prompt text

#### Scenario: Suggestions hidden once a conversation has started

- **WHEN** at least one message has been sent in the AI view
- **THEN** the suggested-prompt chips are no longer shown

#### Scenario: Send disabled when input empty

- **WHEN** the text input is empty
- **THEN** the Send action is disabled

#### Scenario: Send disabled while in flight

- **WHEN** a generation request is in progress
- **THEN** the Send action is disabled and a loading indicator is shown

### Requirement: Generate calls the assistant and shows the proposed query

Activating Send SHALL append the user's request as a new message in the visible transcript and call
the `generateQuery` server action with a system message describing the selected source (see "The query
assistant is given the selected source and its columns") followed by the full accumulated `messages[]`,
which posts to the configured deployment's chat-completions endpoint on DIAL Core (`QueryAssistantApi`,
reusing `DIAL_CORE_API_URL` and Bearer auth). On success the assistant's reply SHALL be appended as a new
message in the transcript, rendered as-is (no SQL extraction applied to the rendered text). When the reply
contains an extractable SQL block, that message additionally renders the extracted SQL read-only with its
own Copy and Run actions (see "Each assistant message with extracted SQL offers inline Run and Copy"). On
failure the system SHALL surface an error notification (header, message, and request id when
available); the just-sent user message SHALL remain visible in the transcript and no assistant message
SHALL be appended, so the user can retry or continue the conversation without losing what they asked.

#### Scenario: Successful generation appends to the transcript

- **WHEN** the user submits a request and the assistant returns a reply
- **THEN** the user's request and the assistant's reply both appear as new messages in the transcript

#### Scenario: The schema message leads the request

- **WHEN** the user submits a request
- **THEN** the messages sent begin with the system message describing the selected source
- **AND** end with the user's request

#### Scenario: Reply without SQL is a plain conversational turn

- **WHEN** the assistant reply contains no SQL block
- **THEN** the assistant's message is shown in the transcript with no Run or Copy action, and any
  previously loaded query is left untouched

#### Scenario: Generation failure notifies and preserves the transcript

- **WHEN** the `generateQuery` action returns a failure
- **THEN** an error notification is shown, the user's just-sent message remains in the transcript, and
  no assistant message is appended

### Requirement: SQL is extracted from the assistant reply

The system SHALL provide a pure `extractSql(content)` utility that returns the trimmed contents of the
last fenced code block tagged `sql` (case-insensitive) in a single message's content. If no
`sql`-tagged block exists but an untagged fenced block does, that block SHALL be returned as a
fallback. If no fenced block exists, the utility SHALL return `null`. The utility SHALL be unit-tested.
It SHALL be applied independently to each assistant message in the conversation, so a conversation with
several assistant turns can have several messages each carrying their own extracted SQL (or none).

#### Scenario: Extract the sql-tagged block

- **WHEN** a message's content contains prose and a ` ```sql … ``` ` block
- **THEN** `extractSql` returns the block's SQL text, trimmed, without the fences

#### Scenario: Last block wins within a message

- **WHEN** a single message's content contains more than one fenced SQL block
- **THEN** `extractSql` returns the contents of that message's last block

#### Scenario: No block returns null

- **WHEN** a message's content contains no fenced code block
- **THEN** `extractSql` returns `null` for that message

#### Scenario: Extraction is independent per message

- **WHEN** a conversation has multiple assistant messages, some with SQL blocks and some without
- **THEN** each message's extraction result reflects only that message's own content

### Requirement: Each assistant message with extracted SQL offers inline Run and Copy

An assistant message whose content yields a non-null result from `extractSql` SHALL render that SQL
read-only beneath the message, with its own Copy action and its own Run action. A message with no
extracted SQL SHALL render neither action. The Run action SHALL be disabled while any message's Run is
already in progress (translating or executing), and SHALL also be disabled on the message that is
currently the loaded query (see "Running a message's query loads it into the builder and executes it")
— that disabled state is the only indicator of which message is current; there is no separate badge.

#### Scenario: SQL-bearing message shows Run and Copy

- **WHEN** an assistant message has extracted SQL
- **THEN** that message renders the SQL read-only with a Copy action and a Run action

#### Scenario: Plain message shows neither action

- **WHEN** an assistant message has no extracted SQL
- **THEN** that message renders no Copy action and no Run action

#### Scenario: Run disabled while another run is in progress

- **WHEN** a message's Run has been clicked and its translate-and-execute is still in flight
- **THEN** every message's Run action in the transcript is disabled until it completes

#### Scenario: Run disabled on the currently loaded message

- **WHEN** a message's query is the currently loaded query
- **THEN** that message's Run action is disabled, while other SQL-bearing messages' Run actions remain
  enabled

### Requirement: Running a message's query loads it into the builder and executes it

Clicking a message's Run action SHALL translate that message's SQL into a structured query and, when
the builder can represent it, hydrate the builder state so the Builder, JSON, and SQL views all reflect
it; when the query cannot be represented (or translation fails), the raw SQL SHALL remain runnable and
visible in the SQL view instead. In the same action, the system SHALL execute the query (via the
structured or SQL execution path, matching whichever form was loaded) and show the result in the
existing result area. The AI view SHALL remain active after Run (no forced view switch). The message
whose Run was most recently clicked SHALL have its Run action disabled to indicate it is the currently
loaded query (see "Each assistant message with extracted SQL offers inline Run and Copy") — no separate
visual badge is used.

#### Scenario: Representable query loads and runs

- **WHEN** the user clicks Run on a message whose query the builder can represent
- **THEN** the Builder, JSON, and SQL views are hydrated with that query, the query executes, and the
  result appears in the result area

#### Scenario: Non-representable query still runs via SQL

- **WHEN** the user clicks Run on a message whose query the builder cannot represent (or translation
  fails)
- **THEN** the raw SQL remains visible and runnable in the SQL view, and the query still executes via
  the SQL path

#### Scenario: Running an earlier message updates which query is loaded

- **WHEN** a later message's Run was previously clicked and the user then clicks an earlier message's
  Run
- **THEN** the earlier message's Run action becomes disabled, the later message's Run action becomes
  enabled again, and the Builder/JSON/SQL views and any subsequent toolbar-independent Copy reflect the
  earlier query instead

#### Scenario: Changing the entity clears the conversation and loaded state

- **WHEN** a query has been run from the AI view and the user selects a different entity
- **THEN** the conversation is cleared entirely (no messages remain, so no Run action is disabled or
  present)

### Requirement: Toolbar Run and Copy are not shown in the AI view

When the AI view is active, the Query Builder toolbar SHALL NOT render its Run action or its Copy
action; the entity selector and time filter controls remain. Running and copying a query in the AI view
happens only through the per-message actions on the transcript.

#### Scenario: Toolbar Run hidden in AI view

- **WHEN** the AI view is active
- **THEN** the toolbar does not show a Run action

#### Scenario: Toolbar Copy hidden in AI view

- **WHEN** the AI view is active
- **THEN** the toolbar does not show a Copy action

#### Scenario: Entity and time controls remain available

- **WHEN** the AI view is active
- **THEN** the entity selector and time filter controls are still shown and usable

### Requirement: Conversations page route, access guard, and server prefetch

The system SHALL expose an Analytics page at `/conversations-trace`, present in the `ApplicationRoute`
enum (`types/routes.ts`) as `ConversationsTrace`. The route directory SHALL be
`src/app/[lang]/conversations-trace/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'`, SHALL call `isAnalyticsForbidden()` before any data access and
render `Page403` when it returns `true`. Code identifiers SHALL use `conversations-trace` /
`ConversationsTrace`; every user-facing string SHALL read "Conversations". The route MUST NOT collide with
the existing `/conversations` DIAL Core route — breadcrumb and menu resolution match on the exact first
path segment, so the two are independent.

For a permitted caller the page SHALL prefetch the **entity schema** server-side and pass it to the client
view as an initial-data prop, so the column catalog is known before the grid mounts. A schema prefetch
failure SHALL be reported through the initial state handed to the client view, since a server component
cannot raise a toast.

The page MUST NOT prefetch the first page of rows: the grid fetches its own pages, so a prefetched page would
be discarded or duplicated. The page MUST NOT prefetch the **result summary** either. The summary is required
to be an observation of the same fetch cycle as the rows on screen, so a summary resolved during server
rendering is superseded by the client's own first fetch the moment it lands; resolving it twice buys nothing
but a scan of the whole filtered result. The summary figures SHALL therefore be unavailable until the
client's first fetch resolves them, and the view SHALL render that pending state rather than zeros, which
would assert an empty result that was never established.

The page SHALL depend on the `conversations` entity being registered and populated in the environment it runs
against. Where it is absent, the access guard still passes and the conversation query fails with HTTP 400; the
page SHALL surface that as a load failure rather than as an empty period. That failure SHALL be reported by
the client's own fetch, which is the first request the page makes against the entity.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and the page is requested
- **THEN** the page prefetches the entity schema on the server and renders the client view with it
- **AND** the grid requests its first page of rows

#### Scenario: The summary is not resolved during server rendering

- **WHEN** the page is requested by a permitted caller
- **THEN** no result-summary query is issued while the page is rendered on the server
- **AND** the summary pills report their figures as pending until the client's first fetch resolves them

#### Scenario: Forbidden caller sees Page403 and no query runs

- **WHEN** `isAnalyticsForbidden()` returns `true` and the page is requested
- **THEN** `Page403` is rendered
- **AND** no conversation query is issued

#### Scenario: Route does not shadow the DIAL Core conversations route

- **WHEN** the browser is at `/conversations-trace`
- **THEN** the Analytics "Conversations" menu item is the active item
- **AND** the existing `/conversations` menu item is not marked active

#### Scenario: A missing conversations entity reads as a failure

- **WHEN** the `conversations` entity is not registered in the environment and the page is requested
- **THEN** the view reports a load failure
- **AND** it does not report that the period held no conversations

### Requirement: Analytics structured-query builder primitives

The system SHALL provide pure builder primitives for the analytics structured-query DSL in
`src/utils/analytics/query-build.ts`, typed exclusively against the enums in
`src/models/analytics/query.ts` (`QueryMode`, `QueryOperator`, `QueryValueType`, `QueryExprType`,
`QuerySortDirection`, `QueryPageType`). The primitives SHALL cover field and value expressions, the
`and`/`or`/`le`/`ne`/`gt`/`ico`/`in`/`is not null` nodes, function expressions with an optional `distinct`
flag, aliased output columns, sort items, an offset page, and **both** query envelopes — aggregate and row
mode. It SHALL provide no lower-bound primitive of its own: the only lower bound these queries need arrives
from `timeRangePredicates`, which builds both range bounds together.

Each envelope SHALL set `mode` explicitly, because the service requires `mode` and never infers it. The
offset page SHALL carry `include_total` as a caller-supplied value rather than a fixed one: the service
populates `totalCount` for row-mode queries and returns none for aggregate mode, so whether a total is worth
requesting is a property of the query being built.

The builder SHALL encode the backend's literal rules so callers do not have to remember them: a timestamp
value SHALL serialize as a decimal epoch-millisecond string with `value_type: 'timestamp'`, because the
service parses timestamp literals as longs and rejects ISO-8601 strings. The epoch-millisecond rule has a
single source of truth — the builder SHALL reuse `timeRangePredicates` from
`components/Analytics/QueryBuilder/utils/time.ts` rather than re-deriving the `ge`/`le` pair.

The `ico` primitive (case-insensitive contains, SQL `ILIKE`) SHALL take the search term as a plain string
and construct the literal itself, rather than accepting a caller-built value expression: the service rejects
a non-string or null right operand for the contains operators with HTTP 400, so the literal type is not the
caller's to choose. The term SHALL be passed through verbatim — the service wraps it in `%…%` and escapes
`%`, `_` and `\` itself, so adding wildcards in the builder would search for them literally.

The builder MUST NOT reuse `src/utils/structured-query/build.ts`; that module targets the evaluation DSL
(`models/evaluation/structured-query.ts`) whose enums are structurally different, so sharing it would be a
type error rather than a simplification.

#### Scenario: Timestamp literal serializes as epoch milliseconds

- **WHEN** a timestamp value expression is built from a `Date`
- **THEN** its `value_type` is `timestamp` and its `value` is the decimal epoch-millisecond count as a
  string, containing no ISO-8601 date punctuation

#### Scenario: Comparison predicate carries a field and a typed literal

- **WHEN** an `le`, `ne`, or `gt` predicate is built for a field and a literal
- **THEN** the node is `{ op, args: [fieldExpr, valueExpr] }` with the field expression first

#### Scenario: Each envelope sets its mode explicitly

- **WHEN** an aggregate query envelope and a row-mode query envelope are built
- **THEN** the first sets `mode: 'aggregate'` and the second sets `mode: 'row'`
- **AND** neither leaves `mode` to be inferred from `group_by` or `select`

#### Scenario: The offset page carries the caller's total request

- **WHEN** an offset page is built requesting a total, and again not requesting one
- **THEN** `include_total` is `true` in the first and `false` in the second

#### Scenario: Contains predicate always carries a string literal

- **WHEN** an `ico` predicate is built for any term, including one that looks numeric or boolean
- **THEN** its right operand is a value expression with `value_type: 'string'`

#### Scenario: Contains predicate adds no wildcards of its own

- **WHEN** an `ico` predicate is built for a term containing `%` or `_`
- **THEN** the literal is the term exactly as supplied, with no surrounding `%` and no escaping applied

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `rate_analytics` entity, which the conversation rollup does not include, and the
structured-query DSL accepts a single `entity` with no join construct. A feedback filter SHALL therefore be
resolved as two queries: first a candidate query over `rate_analytics` returning the `chat_id` values carrying
the requested feedback, then the conversation query over `conversations` narrowed to those ids with an `in`
predicate. Both SHALL be issued server-side with the caller's token, and the `all` state SHALL issue only the
conversation query, so the default path costs exactly one request per page.

Both queries SHALL be issued within a **single** request from the client when the first page of a result is
fetched, rather than the client resolving candidates in one request and the page in another. The candidate
ids SHALL be returned to the client alongside that first page.

The candidate set SHALL be resolved once per filter state and reused across the pages of that result, rather
than re-queried per page: the narrowing is a property of the filter, not of the page. The reuse SHALL be held
per client, keyed by the filter state it was resolved under, and the ids SHALL be carried back with each
later page of that result. The candidate set MUST NOT be held in a cache shared between callers: it is
resolved under the caller's token, so serving one caller's set to another would narrow a result by rows the
second caller's token never selected.

When the candidate set reaches that limit the view SHALL state that the feedback-filtered result may be
incomplete and that the conversations shown are the most recently rated ones. The cap truncates the result
regardless of how it is ordered, and the ordering is the operator's to choose, so a truncated result MUST NOT
be presented as the complete set of conversations carrying that feedback. The disclosure SHALL be visible
while the capped filter state is applied and SHALL clear when the filter state no longer reaches the cap.

The candidate query SHALL be aggregate mode over `rate_analytics` grouped by `chat_id`, carry the same time
bounds as the conversation query and an empty-id guard, and select `chat_id` plus `max(request_time)`. It SHALL
be ordered by most recent rating, so that if the candidate set reaches its limit the ids retained are the most
recently rated ones. Its limit SHALL NOT exceed 1000, the service's hard maximum.

The rate predicates SHALL be:

| State | Predicate |
|---|---|
| positive | `gt(rate, 0)` |
| negative | `le(rate, 0)` |
| rated | `ne(rate, null)` |

`rate` is signed: DIAL sends `1` for a like and `-1` for a dislike, and the service normalizes a boolean
`false` to `0` and anything else to null. The negative state SHALL therefore match everything at or below
zero rather than testing for a value below zero, so a `false` normalized to `0` counts as negative alongside a
`-1` dislike. Neither comparison SHALL carry a companion null guard: SQL three-valued logic already evaluates
both to NULL for an unrated row, so an unrated conversation matches neither. `rated` SHALL be its own
`IS NOT NULL` predicate rather than a union of the other two, so a rating outside the positive/negative split
still counts as rated, and SHALL use `ne` — the only operator besides `eq` that accepts a null right operand.

When the candidate query returns no ids the page SHALL return no rows **without** issuing the conversation
query: the service rejects an empty `in` list with HTTP 400, and "nothing carries this feedback" is already
the complete answer. Blank ids SHALL be dropped from the candidate set. When the candidate query fails, the
failure SHALL propagate and the conversation query MUST NOT run.

#### Scenario: Feedback filter issues the candidate query then the narrowed query

- **WHEN** a feedback state other than all is selected
- **THEN** a query against `rate_analytics` is issued first, carrying the state's rate predicate
- **AND** a query against `conversations` follows, restricted to the returned ids by an `in` predicate
- **AND** both carry the caller's token

#### Scenario: The first page costs one request, not two

- **WHEN** a feedback state other than all is selected and the first page of the result is fetched
- **THEN** the client issues exactly one request for that page
- **AND** the candidate ids are returned to the client with it

#### Scenario: Later pages reuse the ids without re-resolving them

- **WHEN** the operator scrolls to a further page of a feedback-filtered result
- **THEN** no further query against `rate_analytics` is issued
- **AND** the page request carries the candidate ids the first page returned

#### Scenario: The default state costs one query per page

- **WHEN** the feedback filter is in its all state
- **THEN** only the conversation query is issued and it carries no `in` predicate

#### Scenario: A capped candidate set is disclosed

- **WHEN** the candidate query returns its full limit of ids
- **THEN** the view states that the result may be incomplete and covers the most recently rated
  conversations

#### Scenario: The disclosure clears when the filter state no longer caps

- **WHEN** the operator changes to a filter state whose candidate set is below the limit
- **THEN** the incompleteness disclosure is no longer shown

#### Scenario: No conversation carries the feedback

- **WHEN** the candidate query returns no ids
- **THEN** no rows are returned
- **AND** the conversation query is not issued

#### Scenario: The candidate query fails

- **WHEN** the candidate query returns a failure
- **THEN** that failure is returned and the conversation query is not issued

#### Scenario: Negative feedback includes a zero rating

- **WHEN** the negative state is selected
- **THEN** its predicate matches ratings less than or equal to zero, covering both a `-1` dislike and a
  `false` thumb normalized to `0`

#### Scenario: Rated covers both thumbs

- **WHEN** the rated state is selected
- **THEN** its predicate is a null comparison on `rate`, matching every conversation the two thumb states
  match and any rating outside that split

#### Scenario: Feedback composes with the other filters

- **WHEN** a feedback state is selected while a search term and a time range are applied
- **THEN** the narrowed conversation query still carries the search predicates and the time bounds

### Requirement: Provenance line and result summary

The page header SHALL state which entities the view is composed over, listing each contributing entity by its
real catalog name and colouring it with the same provenance colour the grid band uses, so the two cannot
disagree. Every entity named SHALL be one the page actually queries; the line MUST NOT name a source the page
does not read, and MUST NOT carry a "pending" or "not registered" marker — a source that does not exist is not
listed at all.

The header SHALL show summary pills for the conversation count, the rated count, the count carrying negative
feedback, and the total cost. The conversation count and the total cost SHALL be exact figures for the whole
filtered result, obtained from the backend under the same filter the list query carries, and MUST NOT be
computed from the rows currently loaded. The rated and negative counts SHALL be stated for the rows the page
has loaded and SHALL name that scope, rather than implying they cover the whole result. A row whose rating
could not be resolved MUST NOT be counted as rated, since an unresolved rating is not evidence of an absent
one.

The whole-result figures and the loaded-scope figures SHALL be observations of the same fetch cycle. The
whole-result figures SHALL therefore be re-resolved whenever the page fetches the first page of a result,
including the first page the client fetches after mount, and a server-prefetched figure MUST NOT remain the
displayed value once the client has fetched a page of its own. The rollup the page reads is materialized
continuously, so a figure resolved at page load and a page fetched later are two observations of a changing
table: presenting them side by side lets the loaded-scope denominator exceed the whole-result total, which
states an impossibility.

The loaded-conversation count SHALL be a count of **distinct** conversations, not of delivered rows. The row
cache is bounded, so a conversation whose block is evicted and re-fetched is delivered more than once; it
SHALL be counted once.

The rated and negative pills SHALL name their loaded scope in text that is visible on the pill. A caveat
carried only in a tooltip or only in assistive-technology-only content is not stated for the reader looking at
the header, who then reads all four figures as one consistent set. The visible caveat SHALL NOT replace the
existing hover and assistive-technology text.

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the
values carry twelve fractional digits, and SHALL be rounded for display. That rounding is local to the summary
and does not settle how the Cost column renders.

When the summary request fails, the pills SHALL report that the figures are unavailable rather than rendering
zeros, which would assert an empty result that was never established.

A failure to fetch the rows SHALL NOT by itself make the figures unavailable: they are resolved by their own
request, so a row failure is no evidence about them. A failure that prevents the summary request from being
issued at all SHALL, however, clear the figures, because the ones on screen then describe the previous filter
state rather than the applied one.

#### Scenario: The provenance line names only real, queried entities

- **WHEN** the page renders
- **THEN** the line lists the conversations and feedback entities by their catalog names
- **AND** each carries the provenance colour its columns carry in the grid band
- **AND** no entity is marked as pending or unregistered

#### Scenario: The conversation count is exact regardless of how much is loaded

- **WHEN** the result holds more conversations than one page and only the first page is loaded
- **THEN** the conversation count shows the whole result's total
- **AND** it carries no approximation marker and no "understated" hint

#### Scenario: Loaded-scope counts say so

- **WHEN** only part of the result is loaded
- **THEN** the rated and negative pills state that they cover the loaded conversations
- **AND** that statement is visible on the pill without hovering it

#### Scenario: The whole-result figures follow the first page

- **WHEN** the client fetches the first page of a result
- **THEN** the whole-result count and cost are re-resolved for that same filter state
- **AND** the figures shown are those observations, not the ones prefetched at page load

#### Scenario: The loaded denominator cannot exceed the result total

- **WHEN** enough of the result has been scrolled that a previously delivered page is re-fetched
- **THEN** each conversation counts once toward the loaded-conversation count
- **AND** that count does not exceed the whole-result conversation total

#### Scenario: An unresolved rating is not counted as rated

- **WHEN** a row's rating could not be resolved
- **THEN** it counts toward neither the rated nor the negative pill

#### Scenario: A failed summary reports unavailability

- **WHEN** the summary request fails
- **THEN** the pills report the figures as unavailable rather than showing zeros

#### Scenario: A failed row fetch leaves the figures standing

- **WHEN** the first page of rows fails but the summary request succeeded
- **THEN** the pills keep showing the figures the summary request returned

#### Scenario: A summary that could not be issued reports unavailability

- **WHEN** a failure prevents the summary request from being issued for the applied filter state
- **THEN** the pills report the figures as unavailable rather than the previous state's figures

### Requirement: Conversation filters re-query the backend

The conversations page SHALL provide a free-text search box, a time-period control and a feedback filter, and
every change to any of them SHALL produce a new backend request carrying the filter values. The page MUST NOT
filter, hide or reorder rows it already holds in response to a filter change: the page holds only the pages it
has fetched, so narrowing those client-side would silently hide matches that exist outside them and report a
wrong result as a complete one. A filter change SHALL discard the loaded pages and re-fetch from the first
page of the new result.

The time-period control SHALL reuse the shared `TimeFilter` component and the `useTimeFilter` hook — the
same controls the dashboard and Usage Log use — so presets, the custom range picker and their labels behave
identically across the app. The page's default period SHALL be the 7-day preset.

Filter state SHALL cross the server-action boundary as a search string plus the range's start and end as
epoch milliseconds, not as `Date` instances: epoch millis are already the shape the query's timestamp
literals require, and the boundary then carries no value whose serialization has to be reasoned about.

Search input SHALL be debounced so that a burst of keystrokes issues one request rather than one per
character, while the box SHALL show each character as it is typed. A time-period or feedback change SHALL NOT
be debounced — each is one deliberate action, so it queries immediately. Because a debounced search can
overlap either and its response can arrive after the newer one, the page SHALL apply only the most recent
request's response.

A failed conversations request SHALL be reported to the operator rather than rendered as an absence of
data. An emptied grid alone is indistinguishable from a period that genuinely held no conversations, so a
failure SHALL surface both as an error toast and in the empty state's own wording, and the failed state
SHALL clear as soon as a later request succeeds. A failure while fetching a later page SHALL NOT discard the
pages already shown, and SHALL still raise the notification.

#### Scenario: A search term issues a new query from the first page

- **WHEN** the operator types a term into the search box
- **THEN** the server action is called with that term and a first-page offset
- **AND** the rows the grid holds are replaced by the rows the response returns

#### Scenario: Keystrokes collapse into one request

- **WHEN** the operator types several characters in quick succession
- **THEN** the box shows each character immediately
- **AND** exactly one request is issued for the burst

#### Scenario: A time-period change issues a new query

- **WHEN** the operator selects a different time preset
- **THEN** the server action is called with the new range as epoch-millisecond bounds
- **AND** the currently applied search term is carried into that request

#### Scenario: A feedback change issues a new query without waiting

- **WHEN** the operator selects a feedback state
- **THEN** the server action is called immediately with that state, without waiting out the search debounce
- **AND** the currently applied search term is carried into that request

#### Scenario: A stale response cannot overwrite a newer one

- **WHEN** two filter changes are in flight and the earlier one's response arrives last
- **THEN** the rows shown are those of the most recently issued request

#### Scenario: A failed filtered request does not leave stale rows

- **WHEN** a request issued by a filter change fails
- **THEN** the grid does not keep showing rows that no longer match the applied filters

#### Scenario: A failed request says so rather than reading as no traffic

- **WHEN** a request issued by a filter change fails
- **THEN** an error notification names the failure
- **AND** the empty grid reports the failure instead of "No conversations"

#### Scenario: A successful request clears an earlier failure

- **WHEN** a request succeeds after an earlier one failed
- **THEN** the grid shows the returned rows and no longer reports a failure
- **AND** a successful request raises no notification

#### Scenario: A failed later page keeps the rows already shown

- **WHEN** fetching a page after the first fails
- **THEN** an error notification names the failure
- **AND** the rows already loaded remain visible

### Requirement: Rating column resolved for the displayed page

The grid SHALL show a Rating column giving each conversation's positive and negative rating counts, attributed
in the provenance band to `rate_analytics` rather than to `conversations`.

Ratings SHALL be resolved by a query issued **after** the conversation query, restricted by `in` to exactly the
conversation ids in the page just returned. Resolving them from the feedback filter's candidate set instead
MUST NOT be done: that set is capped, so a displayed conversation could fall outside it and be reported as
unrated when it is not. The ratings query SHALL be skipped entirely when the returned page has no rows.

The split SHALL NOT be derived from one aggregate. `rate` is a signed integer — DIAL sends `1` for a like and
`-1` for a dislike, and the service normalizes a boolean `false` to `0` — so `count(rate)` and `sum(rate)` do
not determine the two directions: one like and one dislike sum to zero, indistinguishable from no likes at all.

Each direction SHALL instead be counted by its own query: aggregate mode over `rate_analytics` grouped by
`chat_id`, selecting `count(rate)`, restricted by `in` to the page's ids, and filtered by the **same** rate
predicate the corresponding feedback filter uses — `gt(rate, 0)` for the positive side and `le(rate, 0)` for
the negative one. Reusing those predicates is what guarantees the column agrees with the filter: a
conversation the Positive filter selected cannot then display a zero positive count. Two queries are required
because the language offers no conditional aggregation; they SHALL be issued concurrently.

Both queries SHALL carry the same time bounds as the conversation query. Bounding them identically keeps the
column and the feedback filter consistent. The consequence — a rating given outside the selected period is not
counted — is accepted for that consistency.

Both counts SHALL be displayed at all times, including a zero, so the absence of ratings on one side is visible
rather than implied. A side carrying ratings SHALL be coloured — positive as success, negative as error, from
theme tokens — and a side with none SHALL stay muted. Each side SHALL carry a text label for assistive
technology, since the icons carry the meaning.

When either ratings query fails, both counts SHALL be left unresolved and the cell SHALL render nothing rather
than displaying zeros or a half-counted split, which would assert an absence of feedback that was never
established. The conversation rows themselves SHALL still be returned.

A comment indicator SHALL NOT be shown. `rate_analytics.comment` is catalogued sensitive, so it cannot be
selected — or even counted — by a non-`FULL_ADMIN` caller.

#### Scenario: Ratings are resolved for exactly the page returned

- **WHEN** a page of conversations is returned
- **THEN** one `rate_analytics` count query per direction follows, each restricted by `in` to that page's ids
- **AND** neither is issued at all when the page has no rows

#### Scenario: Both directions are always shown

- **WHEN** a conversation has positive ratings and no negative ones
- **THEN** the cell shows the positive count coloured and a muted zero for the negative side

#### Scenario: A conversation rated both ways shows both counts

- **WHEN** a conversation carries one like and one dislike
- **THEN** it shows one on each side, each coloured for its own direction — not zero likes, which is what a
  `count`-and-`sum` split reports for a signed rate

#### Scenario: An unrated conversation is muted, not blank

- **WHEN** a conversation has no ratings in the period
- **THEN** both sides show a muted zero

#### Scenario: A failed ratings lookup shows nothing rather than zero

- **WHEN** the ratings query fails
- **THEN** the conversation rows are still returned
- **AND** their rating cells render nothing, asserting no absence of feedback

### Requirement: Conversation cells render composed values, not raw aggregates

The grid SHALL render composed cells rather than one raw stored value per column:

- The conversation column SHALL be a single **identity** cell stacking the conversation's title over its id,
  rather than two columns. The title labels the conversation and the id addresses it; they are one identity,
  and a column apiece printed the id twice on every conversation the enrichment has not reached, which is
  most of them. Where no title exists the first line SHALL render the unavailable marker and MUST NOT repeat
  the id.
- The topics column SHALL render its value as discrete chips rather than as the stored string. The value is a
  delimited list whose separator is not reliably spaced in real data, so the cell SHALL split on the
  delimiter, trim each term and drop empty ones before rendering. A term the view does not recognise SHALL
  render as it is stored: the vocabulary is owned by an evaluator that can be re-versioned without the
  frontend knowing, so normalising or dropping an unexpected term would hide real data. The full list SHALL
  stay reachable when more terms exist than the cell shows.
- The activity column SHALL stack how long ago the conversation was last active over how long it ran. The span
  requires the first activity as well as the last, so the query SHALL select both. The absolute instant SHALL
  stay reachable on hover, since relative time is readable but imprecise.
- Token counts SHALL be compacted rather than delimited in full.
- Cost SHALL be rounded to significant digits and coloured. Rounding SHALL be local to this page and MUST NOT
  change the shared currency formatter, so other price columns are unaffected.
- The project column SHALL show the project alone. It MUST NOT show a model chip: the conversation rollup does
  not carry `deployment`, so the page has no model to attribute to a conversation and MUST NOT infer one. A
  conversation with no project SHALL render an explicit placeholder rather than an empty cell, because an
  unattributed project is common in real data and a blank cell reads as a rendering fault.

Relative time and span helpers SHALL take the current time as a parameter rather than reading the clock, so
they stay deterministic and need no fake timers. Colours SHALL come from theme tokens, never literal values.

Every composed cell SHALL degrade rather than break when part of its data is missing: an absent first activity
leaves the relative time alone, and an absent last activity renders nothing at all.

#### Scenario: The identity cell states the title over the id

- **WHEN** a row carries both a conversation id and an insight title
- **THEN** one cell states the title above the id
- **AND** no separate title column exists

#### Scenario: An untitled conversation shows the marker, not a repeated id

- **WHEN** a row carries no insight title
- **THEN** the cell's first line renders the unavailable marker
- **AND** the id appears once, on the second line

#### Scenario: Topics render as chips from an unevenly delimited string

- **WHEN** a row's topics value is `capabilities,error` and another's is `security, code review, validation`
- **THEN** both render as discrete chips with no leading or trailing whitespace
- **AND** an unrecognised term renders as stored

#### Scenario: The project cell shows the project alone

- **WHEN** a row has a project
- **THEN** the cell shows the project
- **AND** it shows no model chip and no model count

#### Scenario: A conversation with no project is marked, not blank

- **WHEN** a row's project is an empty string
- **THEN** the cell renders an explicit placeholder rather than nothing

#### Scenario: The activity cell carries the span

- **WHEN** a row has both activity bounds
- **THEN** the cell shows the relative time over the span
- **AND** the absolute timestamp is available on hover

#### Scenario: Composed cells degrade on missing parts

- **WHEN** the first activity is absent
- **THEN** the relative time renders alone
- **AND** when the last activity is absent, the cell renders nothing

#### Scenario: Cost is readable

- **WHEN** a cost arrives at the full scale of a decimal sum
- **THEN** it renders rounded to significant digits rather than showing every fractional digit

### Requirement: Conversation row values tolerate either backend wire shape

The `ConversationRow` model in `src/models/analytics/conversations-trace.ts` SHALL type its timestamp and
numeric-metric fields to accept either a number or a string, and nullable metrics to additionally accept
`null`.

The shapes the service actually returns are: a timestamp as an **ISO-8601 string with a `Z` zone designator**,
and a decimal as a **JSON number carrying the column's full fractional scale**. Timestamp parsing SHALL treat
a zoneless string as a hazard rather than assume a shape — a zoneless value parses as local time and shifts by
the viewer's offset — so it SHALL either require the zone or normalize the value before parsing, and MUST NOT
rely on a bare local-time parse. Comments and documentation MUST NOT state that timestamps arrive as epoch
milliseconds.

Tolerating both shapes still costs nothing — the shared formatters (`formatDateTimeToLocalString`,
`currencyValueFormatter`, `numberValueFormatter`) already accept `number | string` — and keeps the page
resilient if the mapping changes.

#### Scenario: Timestamp renders from the shape the service returns

- **WHEN** `last_request_time` arrives as an ISO-8601 string with a `Z` designator
- **THEN** the activity cell renders a formatted local date-time for that instant

#### Scenario: Timestamp renders from an epoch-millisecond number too

- **WHEN** `last_request_time` arrives as an epoch-millisecond number
- **THEN** the activity cell renders a formatted local date-time for the same instant

#### Scenario: Null metrics render as empty cells

- **WHEN** a row's `total_tokens` or `total_price` is `null`
- **THEN** the corresponding cell renders empty rather than `0`, `null`, or `NaN`

### Requirement: Conversation list query over the conversations entity

The system SHALL provide
`buildConversationListQuery({ range, search, chatIds, sort, columnFilters, visibleFields, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `conversations`
in **row mode**. The conversation rollup is materialized by the analytics service — one row
per `chat_id`, produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored
columns and MUST NOT group or aggregate.

The select SHALL name the fields the curated columns require, by their entity field names:

| Field | Renders as |
|---|---|
| `chat_id` | conversation |
| `project_id` | project |
| `user_hash` | user |
| `turn_count` | turns |
| `total_tokens` | tokens |
| `total_price` | cost |
| `last_request_time` | activity (relative) |
| `first_request_time` | activity (span) |
| `duration_ms` | duration |
| `deployments` | deployments |

It SHALL additionally name **every offered field the entity's own source carries**, whether or not its column
is currently visible. Such a field costs the query one more column of the table it is already reading, which
is less than what re-fetching every loaded page costs when the operator reveals its column.

It SHALL name a field the service reports under an **enrichment namespace** — a name qualified by the
enrichment that supplies it, `conversation_insights.` and `conversation_buckets.` being the two the
`conversations` entity currently exposes — only while that field's column is visible. The service joins an
enrichment only when a query names one of its columns, so naming one unconditionally would add that join to
every page of every scroll, for columns the operator has not asked for.

Both rules SHALL apply to a **curated** column's field as well as an offered one's. A curated column is not
offered in the catalog — it is designed rather than derived — but it still reads a stored field, so a
projection that skipped it would render an empty cell for data the row does carry, and it is classified as
source- or enrichment-backed by the same test.

It MUST NOT name every field the entity carries: the field set is whatever the service reports and can grow,
and a field the catalog does not offer is one no column renders. A column with no field behind it — Rating is
composed from `rate_analytics` lookups — MUST NOT be named at all, since the entity has no such column.

Making a hidden **enrichment-backed** column visible SHALL restart paging, because the fetched pages do not
carry that field and a column rendered from an absent value would read as empty data rather than as data not
fetched. Making a hidden **source-backed** column visible SHALL NOT re-query: its field is already in every
fetched page, so the rows already held render it. Hiding a visible column SHALL NOT re-query in either case:
the rows already held remain a correct answer to a narrower projection. The whole-result count and cost SHALL
be unaffected by which columns are visible, being aggregates over the filtered result rather than over the
projection.

`turn_count` is the pipeline's count of the conversation's **distinct trace ids**, one trace per request, so
it is a count of turns and not of usage-log rows: the embedding, MCP and routing hops a request fans out
into collapse into the trace that produced them. Turn, request and trace therefore name one quantity, and
user-facing copy SHALL call it **turns** throughout — a second name for the same figure reads as a second
figure. Copy MUST NOT claim it counts individual hops.

The filter SHALL be `and[ ge(last_request_time, startMs), le(last_request_time, endMs) ]`. The time bounds
SHALL apply to `last_request_time`, so a selected period means *conversations whose last activity falls in the
period*. The query MUST NOT carry an empty-`chat_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates matching `chat_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only term
SHALL add no predicate at all rather than an `ico` against the empty string, which would match every row at
the cost of a scan. Both targets are base columns of the entity, so no select-alias restriction applies.

Search SHALL NOT reach the conversation title either: the title is an enrichment column, absent for any
conversation the evaluator has not processed, so a term matched against it would silently narrow the result to
enriched conversations only.

Search MUST NOT reach message content: no column of `conversations` carries it, and the only column that
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. Search
SHALL NOT reach `user_hash` either: selecting the column for display does not make a surrogate a useful
free-text target, and a partial-match predicate over it would cost a scan for a value operators paste whole —
the user column's own filter is the exact-value input for it. The search affordance SHALL name only the fields
search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(chat_id, chatIds)`, which is how the
feedback filter narrows the result.

When `columnFilters` is non-empty the filter SHALL additionally carry one predicate per entry, conjoined with
everything above. Each entry names a field of the entity and an operator the language expresses; an entry
naming a field the entity does not carry, or an operator with no equivalent, SHALL be rejected rather than
translated to an approximation. A range entry SHALL become a `ge` and an `le` predicate on the same field.
Predicate value types SHALL follow the field's type: string fields carry string literals, count fields
integers, price fields decimals, and timestamp fields epoch-millisecond literals.

An array field SHALL carry neither a sort key nor a filter predicate: the query language expresses no ordering
or comparison over one, so a request to sort or filter by such a field SHALL be rejected rather than
approximated client-side over the loaded page.

The sort SHALL be the caller's sort keys, if any, followed by `{ chat_id, asc }`; with no caller sort keys it
SHALL be `[{ last_request_time, desc }, { chat_id, asc }]`. The trailing `chat_id asc` tiebreaker is required
in every case: the service appends no implicit tiebreaker, so without it a paged result is not stable across
requests and a row could be skipped or repeated between pages. A caller sort key SHALL carry an explicit
nulls ordering placing nulls last, so a column holding nulls orders deterministically rather than relying on
the backend's default. A sort key naming a field the entity does not carry SHALL be rejected: sorting by a
value the query cannot name would silently fall back to an unstated order.

The page SHALL be `{ type: 'offset', offset, limit, include_total: false }`, on **every** page including the
first. The result total is resolved by the summary query under an identical filter, so requesting it here
resolves the same figure a second time; the service issues `include_total` as its own statement over the whole
filtered result, so the second resolution costs a scan per page fetched. A limit above 1000 SHALL never be
sent — the service rejects it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema; `conversations` exposes no
`sensitive` column, so every selected field is visible to a read-only admin. `user_hash` is catalogued
non-sensitive — the analytics service exposes it as a de-identified surrogate — so selecting, sorting or
filtering on it requires no elevated role.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `conversations` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `chat_id`, `project_id`, `user_hash`, `turn_count`, `total_tokens`, `total_price`,
  `last_request_time`, `first_request_time`, `duration_ms` and `deployments`

#### Scenario: The query requests no result total

- **WHEN** the query is built for the first page, and again for a later page
- **THEN** each carries `include_total: false`

#### Scenario: Source-owned fields are projected whether or not their columns are visible

- **WHEN** the query is built while every schema-driven column is hidden
- **THEN** its select names each offered field the entity's own source carries
- **AND** it names no field reported under an enrichment namespace

#### Scenario: Time bounds apply to last activity as epoch-millisecond literals

- **WHEN** the query is built for a range
- **THEN** the filter contains a `ge` and an `le` predicate on `last_request_time`
- **AND** each carries `value_type: 'timestamp'` with the bound's epoch-millisecond count as a string

#### Scenario: No empty-id guard is emitted

- **WHEN** the query is built
- **THEN** the filter carries no comparison on `chat_id` against the empty string

#### Scenario: A search term becomes an OR of contains predicates

- **WHEN** the query is built with a search term
- **THEN** the filter carries one additional `or` group of exactly two `ico` predicates
- **AND** they match `chat_id` and `project_id`, each against the trimmed term
- **AND** no predicate matches `user_hash`

#### Scenario: A blank search term adds no predicate

- **WHEN** the query is built with an empty or whitespace-only search term
- **THEN** the filter carries only the time bounds

#### Scenario: A column filter becomes a conjoined predicate

- **WHEN** the query is built with a column filter entry on `total_price` above a value
- **THEN** the filter carries a `gt` predicate on `total_price` conjoined with the time bounds
- **AND** a range entry instead produces a `ge` and an `le` predicate on that field

#### Scenario: An array field carries no sort or filter

- **WHEN** the query is built with a sort key or a column filter naming `deployments`
- **THEN** that input is rejected rather than translated into a predicate or sort key

#### Scenario: Caller sort keys precede the tiebreaker

- **WHEN** the query is built with a sort key on `total_tokens` descending
- **THEN** the sort is that key followed by `chat_id` ascending
- **AND** the caller's key carries a nulls-last ordering

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built with no caller sort keys
- **THEN** the sort is `last_request_time` descending followed by `chat_id` ascending
- **AND** `chat_id` ascending is the final sort entry

#### Scenario: An unknown field is rejected rather than approximated

- **WHEN** the query is built with a sort key or column filter naming a field the entity does not carry
- **THEN** that input is rejected rather than translated

#### Scenario: Search leaves the rest of the query untouched

- **WHEN** the query is built with a search term
- **THEN** its select, sort and page are identical to the same query built without one
- **AND** the time bounds are unchanged
- **AND** `having` is absent

#### Scenario: The projection follows the visible columns

- **WHEN** the query is built with one enrichment-backed column visible and another hidden
- **THEN** the select names the visible column's field
- **AND** it does not name the hidden column's field

#### Scenario: Showing a source-backed column does not re-query

- **WHEN** the operator makes a hidden source-backed column visible after scrolling
- **THEN** no new request is issued and the rows already loaded render that column's values

#### Scenario: A curated hidden column is projected once it is shown

- **WHEN** the operator makes the Topics column visible
- **THEN** the next request's select names `conversation_insights.topics`
- **AND** the cells render that field's values rather than empty cells

#### Scenario: The identity column's enrichment field is projected with no column of its own

- **WHEN** the list query is built with every optional column hidden
- **THEN** the select still names `conversation_insights.title`
- **AND** it names no other enrichment field

#### Scenario: Showing a column re-queries from the first page

- **WHEN** the operator makes a hidden enrichment-backed column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field

#### Scenario: Hiding a column does not re-query

- **WHEN** the operator hides a visible column carrying no filter
- **THEN** no new request is issued and the rows already loaded remain

#### Scenario: Hiding a filtered column clears its filter and re-queries

- **WHEN** the operator hides a column that carries an active filter
- **THEN** that column's filter is cleared
- **AND** the fetched pages are discarded and the next request is for the first page
- **AND** that request carries no predicate on the hidden column's field

#### Scenario: The summary is unchanged by a projection change

- **WHEN** the operator changes which columns are visible
- **THEN** the whole-result conversation count and cost do not change

### Requirement: Server-side paging with an exact result total

The conversations page SHALL fetch its rows one page at a time from the backend. The result total SHALL be
the conversation count the result summary resolves, and the list query SHALL NOT request a total of its own.
The summary count and the list query are built from the same filter, so they resolve the same figure; asking
for it twice returns one number by two independent requests, which can disagree with each other and costs a
scan of the whole filtered result on each page fetched.

The page SHALL reuse the application's existing server-paged grid mechanism and its shared page size rather
than introducing a second paging pattern. Successive pages SHALL be requested by advancing the query's
`offset` while every other part of the query — filter, sort, limit — stays identical, so paging cannot change
which conversations are in the result, only which slice of it is delivered.

The grid SHALL be told the total number of rows once it is known, so it stops requesting pages at the end of
the result instead of probing past it. The summary and the first page of a result SHALL be resolved
concurrently and delivered together, so the total reaches the grid with that page rather than by a second
request; the first page SHALL NOT wait on the summary beyond whichever of the two is slower. A later page
carries no summary and SHALL leave the total as it stands. A request for a page beyond the result SHALL
yield no rows and SHALL NOT be reported as a failure.

Where the summary is unavailable — it failed, or it has not yet arrived — the grid SHALL fall back to
treating a page returning fewer rows than were requested as the end of the result, which is the same signal
it uses to terminate a result whose total is not yet known. No further total SHALL be requested on that
account: the fallback already terminates paging, and re-requesting one would reintroduce the scan this
requirement removes. Until either signal arrives the end of the result is simply unknown, which the grid
already represents.

Any filter change SHALL discard the pages already fetched and restart from the first page: a filter change
produces a different result set, so an already-fetched page of the previous one is not a prefix of it. A
change to the sort SHALL restart paging on the same grounds: a page of a differently ordered result is not a
prefix of the new one either, even though the set of conversations is unchanged. A change to any column filter
SHALL restart paging as a filter change.

Ratings SHALL be resolved for each page as it arrives, restricted to the conversations that page contains.

The result total SHALL never be presented as a lower bound. Because the total is exact, the summary MUST NOT
render an approximation marker such as a trailing "+", and MUST NOT hint that the figures understate the
result.

#### Scenario: The first page requests a total

- **WHEN** the page loads its first page of conversations
- **THEN** the request resolves the result summary alongside the rows
- **AND** the list query's offset page sets `include_total: false`
- **AND** the result total shown is the conversation count that summary resolved

#### Scenario: A later page requests no total

- **WHEN** a page after the first is fetched
- **THEN** its list query's offset page sets `include_total: false`

#### Scenario: The total is delivered with the first page

- **WHEN** the first page of a result is fetched
- **THEN** the summary is resolved concurrently with the rows and returned alongside them
- **AND** the grid's row count is set from that summary as the page is delivered

#### Scenario: A later page does not restate the total

- **WHEN** a page after the first is fetched
- **THEN** its response carries no summary
- **AND** the grid's row count is left as the first page established it

#### Scenario: Scrolling fetches the next page unchanged but for its offset

- **WHEN** the operator scrolls past the rows already loaded
- **THEN** a further query is issued with a larger `offset`
- **AND** its filter, sort and limit are identical to the previous page's

#### Scenario: The grid stops at the end of the result

- **WHEN** the last page of the result has been delivered
- **THEN** the grid is told the total row count and issues no further page request

#### Scenario: A short page ends the result when the total is unavailable

- **WHEN** the summary request failed and a page returns fewer rows than were requested
- **THEN** the grid treats that page as the end of the result and issues no further page request
- **AND** no total is requested to establish it

#### Scenario: A filter change restarts paging

- **WHEN** the operator changes the search term, the time period or the feedback state after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page of the new result

#### Scenario: A sort change restarts paging

- **WHEN** the operator changes a column's sort after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page, carrying the new sort

#### Scenario: A column filter change restarts paging

- **WHEN** the operator applies or clears a column filter after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page, carrying the new predicates

#### Scenario: Ratings follow each page

- **WHEN** a page of conversations arrives
- **THEN** the rating counts are resolved for exactly the conversations on that page

### Requirement: Conversation detail route, access guard, and not-found handling

The system SHALL provide a per-conversation detail view at `/<lang>/conversations-trace/<chat_id>`, reached
by opening a row of the conversations log. The conversation id SHALL be carried in the path and MUST be
URL-encoded, since real ids are not opaque short tokens — they reach hundreds of characters and some contain
path separators and percent-encoded text.

The route SHALL apply the same analytics access guard as the conversations log and SHALL render the shared
forbidden view when access is denied, so the detail view cannot become a way around the gate.

The access guard SHALL resolve to "not forbidden" when the analytics service cannot be reached, rather than
rejecting. Callers await the guard before their own error handling, so a rejection escapes the page and
replaces the application shell instead of that page's load-error state.

When no conversation exists for the requested id the route SHALL render the application's not-found view.
An unknown id MUST NOT render an empty detail page, because every value on it would then read as unavailable
and the page would be indistinguishable from a conversation whose data is genuinely missing.

Returning to the conversations log is the application navigation's responsibility. The detail view MUST NOT
own a back control, so there is one way back rather than two that can disagree.

#### Scenario: Opening a conversation renders its detail view

- **WHEN** a conversation row in the log is opened
- **THEN** the detail view for that conversation renders
- **AND** the address carries the conversation id, URL-encoded

#### Scenario: A conversation id containing path separators survives the round trip

- **WHEN** a conversation whose id contains `/` or percent-encoded characters is opened
- **THEN** the detail view resolves that exact conversation

#### Scenario: Access is denied

- **WHEN** the analytics access guard denies access
- **THEN** the forbidden view renders instead of the detail view

#### Scenario: Unknown conversation id

- **WHEN** the requested conversation id matches no conversation
- **THEN** the not-found view renders

#### Scenario: The analytics service is unreachable

- **WHEN** the access guard's request to the analytics service fails to connect
- **THEN** the guard resolves to "not forbidden" and the route renders its own load-error state
- **AND** the application shell is not replaced by an error page

### Requirement: Single-conversation query over the conversations entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `conversations` in
**row mode**, narrowed to exactly one `chat_id` by equality, requesting a single row.

The query SHALL select every stored column of the conversation rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the available field names from the caller rather than enumerating a field list of its
own, per "A conversation query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The selected set SHALL include the rollup's enrichment columns where the schema reports them, whose exposed
names are qualified flat names containing a dot. The query SHALL send such a name whole rather than treating
the dot as a path.

The query MUST NOT carry a time bound. The log's list query bounds `last_request_time` to the selected
period, but a detail view is addressed by id and SHALL resolve regardless of which period the log was
showing — a deep link or a bookmark MUST NOT fail because a conversation falls outside the current window.

The query MUST NOT reference any column the analytics service marks sensitive. Sensitive columns are removed
from the query model for callers without the elevated role, so referencing one would fail as an unknown
field for those callers rather than being refused cleanly, making the whole view unavailable to them.

#### Scenario: The query is narrowed to one conversation by id

- **WHEN** the single-conversation query is built for a conversation id
- **THEN** it queries the `conversations` entity in row mode
- **AND** it filters on that id by equality and requests one row

#### Scenario: The heavy trace column is named explicitly

- **WHEN** the single-conversation query is built
- **THEN** its select names `traces`
- **AND** the projection is explicit rather than a default or wildcard projection

#### Scenario: The insight columns are selected

- **WHEN** the single-conversation query is built and the schema reports the insight columns
- **THEN** its select names `conversation_insights.title`

#### Scenario: An instance without the enrichment still resolves a conversation

- **WHEN** the single-conversation query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the conversation's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-conversation query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A conversation outside the log's period still resolves

- **WHEN** a conversation whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that conversation's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-conversation query is built
- **THEN** its selected columns include no column the analytics service marks sensitive

### Requirement: A conversation query names only fields the entity's schema reports

The analytics service rejects a query that names a field its entity does not carry, and it rejects the
**whole query** rather than returning the columns it does have. A projection is therefore all-or-nothing:
one field the deployment lacks yields no rows at all, so a page that hardcodes its field list fails
entirely instead of rendering with one column empty.

The entity's fields are not fixed across deployments. The conversation rollup, the turn rollup and the
insight enrichment are catalog objects provisioned per instance rather than shipped with the service, so
an instance can carry an older set than the frontend knows about.

The conversations views SHALL therefore treat the fetched entity schema as the authority on what may be
named. Each view SHALL distinguish two classes of field:

- **required** — the fields without which the view cannot render its curated columns at all. These SHALL
  be named unconditionally.
- **optional** — every field added beyond that core. An optional field SHALL be named **only** when the
  fetched schema reports it.

When the schema cannot be fetched, the query SHALL name the required fields alone. A failed schema fetch
is not evidence that an optional field exists, and guessing costs the whole page rather than one column.

The schema SHALL be read **server-side**, on the route that renders the view, so the first paint already
knows which fields exist. A view MUST NOT issue its first data query before that answer is available.
The single-conversation query alone SHALL wait on it: the reads that name no optional field — the
conversation's feedback and its turns — SHALL stay parallel with the schema read rather than queue behind
it.

This rule governs the projection, and the same gate SHALL govern a filter and a sort key. A predicate or an
ordering naming a field the entity does not carry is rejected with the whole query exactly as a projection is,
so the allow-lists that decide which columns may sort and filter SHALL be derived from the schema-gated column
set rather than from a list held independently of it. A list maintained separately would drift the moment a
column is dropped for a lagging instance, and the failure would be the whole page rather than one control.

#### Scenario: An optional field the schema does not report is not named

- **WHEN** the conversations list query is built and the schema does not report the conversation title
- **THEN** the select does not name `conversation_insights.title`
- **AND** it names every required field
- **AND** the query returns rows

#### Scenario: An optional field the schema reports is named

- **WHEN** the schema reports the conversation title
- **THEN** the select names `conversation_insights.title`

#### Scenario: A failed schema fetch falls back to the required fields

- **WHEN** the entity schema cannot be fetched
- **THEN** the query names the required fields only
- **AND** it names no optional field

#### Scenario: One lagging field does not cost the whole view

- **WHEN** the instance carries the conversation rollup but not the insight enrichment
- **THEN** the conversations list renders its rows
- **AND** the detail view renders its header, panels and figures

#### Scenario: The detail route reads the schema server-side

- **WHEN** the conversation detail route renders
- **THEN** it fetches the conversations entity schema on the server
- **AND** the single-conversation query is built from the fields that schema reports
- **AND** the feedback and turn reads are issued without waiting for it

### Requirement: Unavailable conversation values render an explicit placeholder

The detail view SHALL surface every field its layout defines. A field the view's layout defines but no
queried source supplies SHALL render its label together with an explicit unavailable marker. A field MUST NOT
be silently omitted, and its label MUST NOT be rendered with a blank value, so the difference between "this
system has no such data" and "this happens to be empty" stays visible to the reader.

The layout SHALL NOT define a field the platform does not record at all. An unavailable marker states "no
queried source carries this yet"; a field for a quantity DIAL never records is not pending but absent, and
presenting it invites the reader to expect a value that will never arrive. Such a field SHALL be removed from
the layout together with its label, rather than rendered as permanently unavailable.

The view SHALL distinguish three states, and MUST NOT collapse them onto one presentation:

- **unavailable** — no queried source carries the field at all;
- **empty** — a queried source carries the field and its value is absent for this conversation;
- **zero** — a queried source carries the field and its value is genuinely `0`.

The fetched row itself SHALL decide between the first two. The service returns every projected column in
every row, `null` where the cell is null — so a key **absent** from the row is a field that was never
projected, because the instance does not carry it, and SHALL render as unavailable; a key present and `null`
is a field the record simply has no value for, and SHALL render as empty. The view MUST NOT treat the two as
one: a deployment that lacks a column and a conversation that lacks a value are different findings, and only
the first is a reason to expect nothing there ever.

A zero count SHALL render as a number. It MUST NOT render as the unavailable marker, since `0` ratings or
`0` failed requests are findings rather than gaps.

A zero SHALL instead render as the unavailable marker where the measured quantity cannot be zero in a
conversation that occurred — an elapsed duration being the case in hand, since a conversation that ran took
time. There the zero records that the backend did not measure the value, not that the value was nothing, and
rendering it as a number would state a finding the data does not support. This rule SHALL apply wherever the
value is presented, so the grid and the detail view state the same thing about the same conversation.

A value supplied by a conversation-insight enrichment is a fourth case and SHALL NOT use any of the three
presentations above. The enrichment runs per conversation and can be absent — the evaluator has not processed
the conversation yet — or partial, flagged `truncated`, when the conversation exceeded its budget. An absent
enrichment value SHALL read as **not yet evaluated**: it MUST NOT render as a zero, as a dash meaning "none",
or as any placeholder implying the evaluator looked and found nothing. Coverage is sparse and stays sparse —
under a quarter of conversations carry an insight row — so this is the common case, not an edge one.

Where such a value **labels** the conversation, an absent or blank one SHALL degrade to the unavailable marker
and MUST NOT degrade to the conversation id. Both surfaces that render a title render the id alongside it, so
substituting one for the other states the id twice and reads as though the conversation were named after its
own hash.

The marker SHALL be a single presentation used consistently across the view, and SHALL come from theme
tokens rather than literal colour values.

#### Scenario: A field with no source renders its label and the marker

- **WHEN** the detail view renders a field no queried source supplies
- **THEN** the field's label renders
- **AND** its value renders as the unavailable marker

#### Scenario: A field the platform does not record is not presented

- **WHEN** the detail view renders
- **THEN** it presents no field for a conversation's region, because DIAL records none
- **AND** no label for it appears in any panel

#### Scenario: An empty value is distinguishable from an unavailable one

- **WHEN** a conversation has no project
- **THEN** the project field renders its own empty presentation, not the unavailable marker

#### Scenario: A zero value renders as a number

- **WHEN** a conversation has zero ratings
- **THEN** the rating counts render as `0` rather than as the unavailable marker

#### Scenario: An impossible zero renders as unavailable

- **WHEN** a conversation's recorded duration is `0`
- **THEN** it renders as the unavailable marker rather than as a zero duration
- **AND** the grid and the detail view render it the same way

#### Scenario: A missing insight title degrades to the marker, not to the id

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the title renders as the unavailable marker
- **AND** the conversation id is not rendered in its place
- **AND** the id remains stated once, in its own line of the same cell

#### Scenario: An absent insight value is not presented as a finding

- **WHEN** the Topics column renders a conversation the evaluator has not processed
- **THEN** the cell renders empty
- **AND** it states no zero, no dash and no "none"

#### Scenario: A field the payload never carried is unavailable, not empty

- **WHEN** the metadata panel renders a conversation whose row carries no `traces` key, because the instance
  does not expose that column
- **THEN** the trace field renders as the unavailable marker
- **AND** a field present in the row with a `null` value renders as empty instead

### Requirement: Conversation detail header names the conversation and states its turn count

The header SHALL lead with the conversation's **title** as the view's heading, and SHALL state the
conversation **id** in the meta row alongside its project, turn count, activity span and time since last
activity. A heading names the thing on the page; the id addresses it. Leading with the id made every
conversation's heading a hash, and the reader who needs the id needs to copy it rather than read it.

The id SHALL keep its full value reachable when it is too long to display, and SHALL offer a means of copying
it, since the id is the value a reader carries to another tool. Those affordances follow the id into the meta
row rather than staying with the heading.

The title SHALL be read from the conversation-insight enrichment. Where the enrichment carries no row for the
conversation, or its title is blank, the heading SHALL render the unavailable marker and MUST NOT render the
id in its place — the id is already stated in the meta row, and repeating it as the name states one value
twice. The marker MUST NOT stand as the heading's only content for assistive technology: a heading whose text
is a dash names nothing, so it SHALL carry an accessible name stating that the conversation is untitled. The
title MUST NOT be fabricated from other values.

A title computed from a `truncated` input SHALL still be stated: it describes the part of the conversation the
evaluator read, which is a weaker claim than a full title but a true one. The detail view SHALL state that
weaker claim **for the conversation it is showing**, in text rather than as a bare marker, because the reader
is looking at one conversation and has room for the explanation. It MUST NOT leave the truncation unstated:
most titled conversations are truncated, so silence would present a partial label as a whole one.

The header MUST NOT state the conversation's deployments. The metadata panel states them, and one fact
presented in two places gives the reader no way to tell which is authoritative — the same reason the turn
count is stated once and the rating counts are left to the panel that lists them.

The header MUST NOT state a **model** field. The rollup carries no conversation-level model column;
`deployments` names every deployment that handled any hop — routers, applications, MCP toolsets and embedding
deployments alongside the models — and which of them is a model is not derivable from the array. The view MUST
NOT synthesize the set either: the turn rollup's `models` column is the authoritative billed set but is **per
turn**, no server-side union over it is expressible, and a union taken over the view's bounded turn list would
understate a conversation longer than that bound, the same error the turn-count rule already forbids.
Presenting a real model set requires a conversation-level field the rollup does not yet carry.

The header MUST NOT carry rating counts or a back control. Ratings belong with the panel that lists them, so
the same figures are not stated twice in different places, and returning to the log is the application
navigation's job rather than a control this view owns.

The turn count SHALL be read from the rollup's `turn_count` and labelled **turns**. It SHALL be stated
**once**: the header MUST NOT carry a second count of the same quantity under a different label.
`turn_count` counts distinct traces, so turn, request and trace name one quantity — a header stating both a
turns figure and a requests figure presents one fact as two, and gives the reader no way to tell which is
authoritative.

The header's turn count MUST NOT be derived from the loaded turn list. That list is bounded, so on a
conversation longer than the bound the derived figure is the bound itself, stated as though it were the
conversation's length.

Numeric, currency and time values in the header SHALL carry the same formatting those value types carry in
the conversations log, so the same conversation reads identically in both places.

#### Scenario: The heading is the conversation's title

- **WHEN** a conversation's insight row carries a title
- **THEN** that title is the view's heading
- **AND** the conversation id is stated in the meta row

#### Scenario: An untitled conversation still has a named heading

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the heading renders the unavailable marker
- **AND** the heading carries an accessible name stating the conversation is untitled
- **AND** the conversation id is not rendered as the heading

#### Scenario: A truncated title says so

- **WHEN** a conversation's insight row is flagged `truncated`
- **THEN** the detail view states that the title describes only part of the conversation
- **AND** the title itself is still stated

#### Scenario: The header states no deployments and no model

- **WHEN** a conversation's rollup records deployments including a router, an application and a model
- **THEN** the header states none of them
- **AND** it presents no model field
- **AND** the metadata panel remains where those deployments are stated

#### Scenario: A long conversation id stays reachable and copyable

- **WHEN** the conversation id is too long to fit the meta row
- **THEN** it is truncated, its full value remains reachable, and it can be copied

#### Scenario: The header carries no ratings and no back control

- **WHEN** the detail view renders
- **THEN** the header shows no rating counts and no control for returning to the log

#### Scenario: The header states the conversation's facts

- **WHEN** the detail view renders
- **THEN** the header states the title as its heading, and the id, the project, the turn count, the activity
  span and the time since last activity in its meta row

#### Scenario: The turn count is stated once, from the rollup

- **WHEN** the detail view renders a conversation whose `turn_count` is 911
- **THEN** the header states 911 under a turns label
- **AND** it states no second count of turns, requests or traces under any other label

#### Scenario: The header count is unaffected by how many turns loaded

- **WHEN** a conversation's `turn_count` is 911 and the view loads only the first 200 turns
- **THEN** the header states 911
- **AND** it does not state 200

#### Scenario: Header values match the log

- **WHEN** the same conversation is read in the log and in the detail view
- **THEN** its token, cost and activity values are formatted identically in both

### Requirement: Conversation turn list comes from the turns rollup and discloses its bound

The detail view SHALL derive a conversation's **turn list** from the `turns` entity, which the analytics
service materializes as one row per trace. That list is the spine of the transcript and the source of each
turn's own figures. It is **not** the source of the conversation's turn count, which the header reads from
the conversations rollup.

The view MUST NOT identify turns itself by grouping the hop-level usage log. The rollup already resolves what
a turn is, and a second definition maintained in the frontend would drift from it: a turn's entry hop, its
hop count and its cost would each be answered twice, by two rules, for the same conversation.

Each turn SHALL carry its trace id, its start time, its hop count, its token total, its cost and its
wall-clock duration, all as the rollup states them. A turn's cost SHALL be the sum of each hop's own cost, not
the chain-inclusive figure that already covers everything a hop initiated; summing the latter across a chain
double-counts. A turn's duration SHALL be its elapsed time — the longest single hop, since a hop's duration
contains the hops it called — not the sum of its hops' durations.

The turn list SHALL be ordered by each turn's start time, ascending. The rollup carries no turn index, so
start time is the only ordering that reconstructs the conversation's sequence, and the view MUST NOT present
a turn number as though it were recorded.

The turn query SHALL name the trace id, so a turn's span tree stays addressable and the trace drawer's
behaviour is unchanged.

The turn query MUST NOT name a request or response body column, and the rollup exposes none: bodies are
heavy, and naming one in a per-conversation read makes the turn list as slow as a transcript read.

The turn list SHALL be bounded, and the view MUST NOT page through it. When the bound clips the list — that
is, whenever fewer turns load than the conversations rollup's `turn_count` — the view SHALL state both figures
together, so the number of turns on screen reads as a stated limit rather than as the conversation's length.
That disclosure MUST be visible without interaction, and MUST NOT render when the list is complete.

The turn read SHALL NOT be gated on a schema probe of its own. Unlike the conversation read, it names no
optional field: an instance either carries the turn rollup or it does not, so there is no partial projection
to negotiate. Where the rollup is absent the query fails, and the view SHALL render its existing
failed-to-load presentation — which is accurate, and stays distinct from a conversation that genuinely has
no turns.

The `turns` rollup is **refreshed periodically** while `dial_usage_log` is written live, so a conversation
that started after the last refresh has no rows in it. Such a conversation SHALL render the view's existing
empty-turn-list presentation: the header, the panels and the rollup's own figures still render from
`conversations`, and the view MUST NOT report an error, since nothing failed. The view MUST NOT fall back to
the hop-level usage log to synthesize turns for it — that would answer one conversation by one definition of a
turn and the next by another.

#### Scenario: One turn per trace, from the rollup

- **WHEN** the detail view loads a conversation the rollup records several turns for
- **THEN** one turn renders per trace
- **AND** each reports its own hop count, token total, cost and duration as the rollup states them
- **AND** the turn query targets the `turns` entity and carries no group-by

#### Scenario: Turns are ordered by when they started

- **WHEN** a conversation's turns are listed
- **THEN** they render in ascending order of start time
- **AND** the query's sort key is the turn's start time

#### Scenario: A turn's trace stays addressable

- **WHEN** a turn renders
- **THEN** it offers the control that opens that turn's trace
- **AND** the span tree that opens is the one for that turn's trace id

#### Scenario: A clipped turn list states its bound against the real count

- **WHEN** a conversation's `turn_count` is 911 and the turn list is bounded at 200
- **THEN** the view states that 200 of 911 turns are shown
- **AND** that disclosure is visible without interaction

#### Scenario: A complete turn list carries no disclosure

- **WHEN** a conversation's `turn_count` is 12 and all 12 turns load
- **THEN** no truncation disclosure renders

#### Scenario: The turn query reads no body column

- **WHEN** the turn list is requested
- **THEN** the query names neither a request body nor a response body column

#### Scenario: An instance without the turn rollup reports a failed read

- **WHEN** the detail view loads a conversation on an instance that does not carry the turn rollup
- **THEN** the timeline states that the turns could not be loaded
- **AND** the header, the panels and the conversation's own figures still render
- **AND** no schema probe of the turn entity is issued before the read

#### Scenario: A conversation newer than the last refresh lists no turns

- **WHEN** a conversation exists in the conversations rollup but has no rows in the turns rollup
- **THEN** the view renders its empty-turn-list presentation rather than an error
- **AND** the header and the panels still state the conversation's figures
- **AND** no request is made to the hop-level usage log for a substitute turn list

### Requirement: Conversation detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: token and cost usage, feedback, and
record metadata. Each panel SHALL carry an icon coloured by its source, so the panels are distinguishable at
a glance rather than by reading their headings.

Each panel SHALL name the entity it reads from, and MUST NOT overstate it. **Every** panel SHALL have a real
source: the view MUST NOT present a panel no queried entity populates, because a panel of nothing but
unavailable markers states a shape the system does not record.

A panel MUST NOT name an enrichment as its source. The analytics service exposes an enrichment's columns as
columns of the entity they enrich, and the view queries the entity — so a panel that reads an
enrichment-derived field still reads `conversations`, and naming the enrichment would present an internal
composition of the entity as a separate thing the view queried.

This is one half of a rule the whole feature follows, and the two halves SHALL NOT be conflated:

- A **catalog identifier**, rendered in monospace, claims **the entity the page queried**. It SHALL name
  `conversations` or `rate_analytics` and SHALL NEVER name an enrichment — in a panel's source, in the page
  header's provenance line, or anywhere else an identifier appears.
- A **readable origin label** claims **where a value came from**, which is a different question and decides
  whether an empty cell means "not recorded" or "not yet evaluated". It SHALL distinguish an enrichment from
  the rollup it decorates.

Where both registers describe the same origin they SHALL carry the same provenance colour, so an identifier
and a label for one source cannot appear to disagree.

The usage panel SHALL state prompt tokens, completion tokens, total tokens, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. Monetary values SHALL carry the emphasis
money carries elsewhere in the app, which is independent of the panel's source colour.

A panel field whose value cannot be read at face value SHALL carry a caveat stating why, and that caveat
SHALL be reachable by keyboard. A field label is not focusable, so a caveat attached to it by hover alone is
unreachable for a keyboard or screen-reader user; the caveat SHALL therefore be exposed through a focusable
control whose accessible name carries it. A `title` attribute alone does not satisfy this.

The recorded durations are two such fields. `duration_ms` sums a conversation's hop durations, and an outer
hop's duration already contains the hops it called, so a conversation whose turns fan out into chains reads
longer than the time it actually took. `avg_duration_ms` averages per **hop** rather than per turn, so it is
not the average turn. Each SHALL state its own caveat: the two figures are wrong in different ways, and one
shared note would misdescribe whichever it did not name. The view MUST NOT describe either as elapsed time.
This restates a caveat previously carried only by the conversations grid's Duration column, which no longer
exists — the figures remain on this panel, so the statement has to as well.

The metadata panel SHALL state the conversation id, the anonymized user identifier, the project, the first
activity time, the successful-request count, the conversation's **trace ids** and the deployments that served
the conversation, all from the rollup. A field the rollup carries SHALL NOT be rendered as unavailable: the
panel states what the record holds, and marking a recorded field as absent misreports the data the view
already fetched.

The trace ids SHALL be read from the rollup's `traces`. Their order is the rollup's own — ascending by id,
not by turn — so the panel MUST NOT present them as a turn sequence or number them as turns. The panel MUST
NOT derive a turn count from the array's length: the length is not queryable and the array is subject to the
same bound as any projected value, so `turn_count` remains the count of record and the header remains where
it is stated.

The successful-request field's label SHALL state what `success_count` counts — a turn in which **at least one
hop** succeeded. Labelling it as an unqualified success count would read as "the turn succeeded", which is a
stronger claim than the rollup makes: a turn whose entry hop failed after a nested hop succeeded is counted.

Panel provenance colours SHALL come from theme tokens, and every provenance value the view can render SHALL
map to a colour, so a newly added source cannot render unstyled.

#### Scenario: Panels render with their sources named

- **WHEN** the detail view renders
- **THEN** the usage, feedback and metadata panels render
- **AND** each names the entity it reads from

#### Scenario: The usage panel reports real values

- **WHEN** a conversation has recorded token usage and cost
- **THEN** the usage panel states its prompt tokens, completion tokens, total tokens and total cost

#### Scenario: No panel is populated entirely by unavailable markers

- **WHEN** the detail view renders
- **THEN** every panel it renders has a real source entity

#### Scenario: A duration figure carries a keyboard-reachable caveat

- **WHEN** the usage panel renders a conversation's duration and average duration
- **THEN** each figure carries a caveat explaining what its value actually measures
- **AND** each caveat is reachable by keyboard and exposed to assistive technology
- **AND** neither figure is described as elapsed time

#### Scenario: An identifier never names an enrichment

- **WHEN** the detail view's panels and the log's provenance line render for an instance carrying the insight
  enrichment
- **THEN** every monospace catalog identifier names only an entity the page queries
- **AND** none of them names `conversation_insights`

#### Scenario: No panel claims an enrichment

- **WHEN** the metadata panel renders a field the conversation-insight enrichment supplies
- **THEN** the panel still names `conversations` as its source
- **AND** no panel is labelled as enrichment-derived

#### Scenario: The metadata panel marks what the rollup lacks

- **WHEN** the detail view renders
- **THEN** the metadata panel states the conversation id, user identifier, project, first activity,
  successful-request count, trace ids and the conversation's deployments
- **AND** it marks none of them as unavailable, because the rollup carries every field it lists

#### Scenario: Trace ids are not presented as a turn order

- **WHEN** a conversation's rollup records several trace ids
- **THEN** the metadata panel lists them without turn numbers or ordinal labels
- **AND** the panel states no turn count derived from how many it lists

#### Scenario: The successful-request label states what it counts

- **WHEN** the metadata panel renders
- **THEN** its successful-request label states that a turn counts when at least one of its hops succeeded

### Requirement: Conversation detail feedback reads the rating source

The detail view SHALL read this conversation's ratings from the feedback source and SHALL state, **in the
feedback panel**, how many were positive and how many negative. A conversation with no ratings SHALL state
zero in both directions rather than rendering them as unavailable.

Each assistant message SHALL also show the ratings attributed to its turn. Attribution SHALL be by time — a
rating belongs to the last turn that had started when the rating was submitted — because the feedback source
records no trace identifier and its trace and span columns are not queryable. This is an approximation and
MUST NOT be presented as an exact join: a rating left after a later turn began is attributed to that later
turn.

The feedback panel SHALL list the conversation's individual ratings with their direction and the time each
was recorded, most recent first.

Each listed rating SHALL surface a comment field as unavailable. The feedback source's comment column is
marked sensitive, so requesting it would make the view unavailable to callers without the elevated role.

When more ratings exist than the view requested, the panel SHALL say the list is partial rather than
presenting it as complete.

#### Scenario: Rating counts render with the ratings they summarise

- **WHEN** a conversation has positive and negative ratings
- **THEN** the feedback panel states the count in each direction

#### Scenario: An unrated conversation reports zero

- **WHEN** a conversation has no ratings
- **THEN** the feedback panel states zero in both directions

#### Scenario: An assistant message shows its turn's ratings

- **WHEN** a rating was submitted after a turn began and before the next turn began
- **THEN** that turn's assistant message shows it in the matching direction

#### Scenario: Individual ratings are listed

- **WHEN** a conversation has ratings
- **THEN** the feedback panel lists each with its direction and recorded time, most recent first

#### Scenario: A listed rating's comment is marked unavailable

- **WHEN** the feedback panel lists a rating
- **THEN** its comment renders as unavailable

#### Scenario: A partial rating list says so

- **WHEN** a conversation has more ratings than the view requested
- **THEN** the panel states that the list is partial

### Requirement: Conversations grid with server-side ordering and per-column filtering

The conversations view SHALL render a grid of five visible columns — conversation, project, user, activity,
cost — plus the Rating column. Turns, tokens, deployments and topics are curated columns that default to
hidden; see "Conversation grid columns are a fixed curated set gated by the entity schema" for the whole set
and its origins.

A column SHALL offer a sort or a filter control **only** when the control can be answered over the whole
result. That is the case exactly when the column is backed by a stored field of the `conversations` entity,
because the control then becomes part of the query. Sorting and filtering SHALL therefore be resolved by the
backend, and the grid MUST NOT narrow or reorder the pages it already holds: those pages are a slice of the
result, so narrowing them client-side would report a slice as the complete answer.

| Column | Sort | Filter |
|---|---|---|
| conversation (`chat_id`) | yes | text |
| project (`project_id`) | yes | text |
| user (`user_hash`) | yes | text |
| turns (`turn_count`) | yes | number |
| activity (`last_request_time`) | yes | none |
| tokens (`total_tokens`) | yes | number |
| cost (`total_price`) | yes | number |
| deployments (`deployments`) | no | no |
| topics (`conversation_insights.topics`) | no | text |
| Rating | no | no |

The deployments column SHALL offer neither, because the query language expresses no ordering and no predicate
over an array. The topics column SHALL offer a text filter but no sort: its value is a delimited string, so a
lexicographic ordering would sort by whichever term happens to be written first and carry no meaning, while a
contains predicate matches a term wherever it appears in the string.

A predicate on an enrichment-backed field SHALL be gated on the entity schema exactly as the projection is. An
instance that does not carry the enrichment would have the whole query rejected, not the one predicate
dropped. A reader SHALL NOT be led to believe such a filter searched every conversation: it matches only rows
the enrichment has reached, which is under a quarter of them, and that is correct behaviour rather than a
bug — but it is a narrowing of the population, not only of the result.

The Rating column SHALL offer neither. It is composed from `rate_analytics` lookups resolved for the page
just returned and has no field on the queried entity, so any ordering or narrowing of it could only describe
the rows already on screen. The feedback control is the filter for that dimension.

The activity column SHALL be sortable but SHALL NOT offer a filter. The page's time-period control already
predicates on `last_request_time`, and a second control over the same dimension would let a filter appear to
widen a range the period clips.

Filter controls SHALL offer only operators the query language can express. An operator with no equivalent —
notably prefix and suffix matching — MUST NOT be offered, since an offered operator that cannot be translated
either fails or silently returns the wrong rows. Text columns SHALL offer contains, does-not-contain, equals
and not-equals; number columns SHALL additionally offer the four magnitude comparisons. An incomplete filter
entry — an operator chosen with no value — SHALL contribute no predicate rather than a predicate against an
empty value.

Column filters SHALL compose with the page's own controls as a conjunction: the search term, the time period,
the feedback narrowing and every column filter SHALL all hold for a returned conversation. The page's filter
state MUST NOT be written into the grid's filter model, and the grid's filter model MUST NOT be read as the
page's filter state; they are separate inputs to one query.

A change to the sort or to any column filter SHALL discard the pages already fetched and restart from the
first page of the new result, exactly as a search, period or feedback change does. The whole-result
conversation count and cost SHALL be re-resolved under the same predicates, so the summary cannot describe a
different result than the rows.

When no column sort is applied the result SHALL be ordered most recent last activity first. Clearing a
column's sort SHALL return to that default rather than leaving an arbitrary order.

The conversation column SHALL keep **both** of its lines reachable when either is too long to display, since
real ids are not uniformly short and can run to hundreds of characters, and a title is free text. Truncation
MUST NOT be the only presentation of either value. The user column SHALL keep its value reachable on the same
terms.

The conversation column MUST NOT carry a copy control per row. The full id is already reachable there, and a
control in every row of an infinitely scrolling grid adds a focusable node per row to the tab order for a
value the detail view already offers to copy.

The user column SHALL show the conversation's `user_hash`, labelled the way the conversation detail page
labels it. The value is a de-identified surrogate rather than an identity, so the column SHALL NOT be
presented as a name or an address.

While the first page of a new sort, filter or page-control state is in flight the view SHALL show a loading
indicator, so the empty state cannot flash between a change and its rows. When the result holds no rows the
view SHALL render a no-data state rather than an empty grid body.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

Rows SHALL be openable, navigating to that conversation's detail view. The grid SHALL indicate that its rows
are openable rather than leaving the affordance undiscoverable, and SHALL honour the app's convention for
opening a row in a new tab. The conversation id SHALL be URL-encoded into the detail address, since real ids
contain path separators and percent-encoded text.

The grid SHALL carry a provenance band above the column headers, grouping every column under the data source
it comes from, and a column MUST NOT be able to leave its group when moved.

Every column SHALL belong to exactly one group: an unattributed column would imply a provenance the page has
not stated. Group labels SHALL name the actual source of the columns beneath them and MUST NOT overstate it —
a column read from a source table MUST NOT be labelled as enrichment-derived, and no group SHALL be attributed
to a source the page does not query. Each group SHALL carry a tooltip naming its source precisely. Colours
SHALL come from theme tokens, never literal values, and every provenance value SHALL map to a colour, so a
newly added one cannot render unstyled.

The band and the column-header row SHALL each carry their own height, and the band label SHALL be separated
from the column header beneath it.

#### Scenario: Sorting a field-backed column re-queries from the first page

- **WHEN** the operator sorts the cost column descending
- **THEN** a new request is issued carrying that sort key with a first-page offset
- **AND** the pages already fetched are discarded
- **AND** the rows shown are the result's ordering, not a reordering of the rows already held

#### Scenario: Clearing a sort returns to the default ordering

- **WHEN** the operator clears the sort on a column
- **THEN** the result is ordered most recent last activity first

#### Scenario: A column filter becomes a query predicate

- **WHEN** the operator applies a contains filter on the project column
- **THEN** a new request is issued carrying that predicate with a first-page offset
- **AND** the returned rows are the whole result's matches, not the previously loaded rows narrowed

#### Scenario: Column filters compose with the page's controls

- **WHEN** a column filter is applied while a search term, a time period and a feedback state are active
- **THEN** the request carries all of them, and a returned conversation satisfies every one

#### Scenario: The summary follows the sort and filter state

- **WHEN** a column filter is applied
- **THEN** the whole-result conversation count and cost are re-resolved under the same predicates

#### Scenario: Rating offers no sort and no filter

- **WHEN** the operator inspects the Rating column header
- **THEN** it offers no sort affordance and no filter control
- **AND** clicking it does not change the row order

#### Scenario: Activity sorts but does not filter

- **WHEN** the operator inspects the activity column header
- **THEN** a sort affordance is offered
- **AND** no filter control is offered

#### Scenario: Untranslatable operators are not offered

- **WHEN** the operator opens a text column's filter
- **THEN** the operator list offers contains, does-not-contain, equals and not-equals
- **AND** it offers no prefix or suffix matching option

#### Scenario: An operator with no value contributes nothing

- **WHEN** a filter entry has an operator selected and its value left empty
- **THEN** the request carries no predicate for that column

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group
- **AND** the conversation, project, user, turns, activity, tokens and cost columns are attributed to
  `conversations`, and the Rating column to `rate_analytics`

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: A long conversation id stays reachable

- **WHEN** a conversation id is too long to fit its column
- **THEN** the cell truncates it and the full value remains reachable

#### Scenario: Opening a row navigates to the conversation

- **WHEN** a grid row is opened
- **THEN** that conversation's detail view is navigated to, with its id URL-encoded in the address

#### Scenario: Opening a row in a new tab

- **WHEN** a grid row is opened with the app's new-tab modifier
- **THEN** the conversation's detail view opens in a new tab and the grid keeps its fetched pages

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** the first page of a new sort or filter state is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown

#### Scenario: Empty result renders the empty state

- **WHEN** the result holds zero conversations
- **THEN** the no-data content renders instead of an empty grid body

### Requirement: Conversation grid columns are a fixed curated set gated by the entity schema

The conversations grid SHALL present a fixed set of designed columns. Each column SHALL be written in the
frontend with a chosen header, a chosen presentation, and — where its value cannot be read at face value — a
statement of what it actually holds. A field the entity carries for which no column is designed SHALL NOT
appear as a column, and the grid MUST NOT generate a column from a field's declared type and display name: a
header derived that way asserts a meaning nobody checked, and the entity carries fields whose display names
are actively wrong for this view.

The set SHALL be exactly these ten columns, in this order, with these defaults:

| Column | Reads | Default |
|---|---|---|
| Conversation | `chat_id` + `conversation_insights.title` | visible |
| Project | `project_id` | visible |
| User | `user_hash` | visible |
| Turns | `turn_count` | hidden |
| Activity | `last_request_time` | visible |
| Tokens | `total_tokens` | hidden |
| Cost | `total_price` | visible |
| Deployments | `deployments` | hidden |
| Topics | `conversation_insights.topics` | hidden |
| Rating | composed from `rate_analytics` | visible |

Every column SHALL be attributed to exactly one origin, and its origin SHALL be the source the value actually
comes from:

| Origin | Columns | What the origin means |
|---|---|---|
| Conversation | the eight rollup columns | one row per conversation, refreshed periodically from the usage log; a value is present for every conversation, because without it the row would not exist |
| Conversation insights | Topics | computed by a separate evaluation run; absent for any conversation the evaluator has not reached, and absence means not-yet-evaluated |
| Ratings | Rating | resolved by a separate query for the conversations on the page, counted only within the selected period |

Origins SHALL be presented as readable names rather than as catalog identifiers, and SHALL distinguish an
enrichment from the rollup it decorates. A column read from an enrichment MUST NOT be attributed to the rollup:
the two produce different kinds of empty cell — one that cannot happen and one that is expected — and a reader
who cannot tell them apart reads a coverage gap as a measurement.

Origins SHALL be rendered as real column groups, which constrains column order so that columns of one origin
are adjacent. That constraint is accepted: an origin a reader can see is worth more than an arbitrary column
order.

The identity column SHALL NOT be hideable. It is how a reader recognises a row and how a row is opened, so a
grid without it is a table of values belonging to conversations the reader cannot name. Its permanence is also
what makes its enrichment field unconditional in the projection: a field read by a column that can be hidden
is projected on visibility, and the identity column has no hidden state for that rule to key on.

The identity column SHALL declare the rollup as its origin even though it reads the enrichment for its title.
A conversation's identity is its id; the title only labels it. That column SHALL state in its own disclosure
that the title comes from the insight enrichment, and that a title is written from a size-capped copy of the
conversation and may therefore describe only part of it. It SHALL state the size cap **once**, for the column,
rather than marking the rows it applies to: it applies to the large majority of titled conversations, so a
per-row marker would be background rather than signal.

A column SHALL offer a sort only where the query can order the whole result by its field, since paging is
server-side and a client-side sort over one loaded block would report a slice as the answer. Sortable:
`chat_id`, `project_id`, `user_hash`, `turn_count`, `last_request_time`, `total_tokens`, `total_price`. Not
sortable: Rating, Topics and Deployments.

Every column filter SHALL come from the operator sets the query language can already express; this
requirement introduces none. The two fields whose values form a closed vocabulary — an insight's sentiment and
its resolution status — SHALL NOT be presented as columns at all, because that vocabulary is declared in the
evaluator's own response schema on the service side while the entity schema reports only a string type. A
usable filter for them would mean a second copy of the enum held in the frontend, drifting silently whenever
the evaluator is re-versioned. Both fields remain reachable through the Query Builder, which names fields
rather than designing columns for them.

A curated column whose field the entity schema does not report SHALL NOT be rendered at all — neither shown
nor offered as hideable. A column that can never carry a value is not one an operator has a use for, and the
query cannot name the field in the first place. Rating is the exception and SHALL render unconditionally: it
reads no field of this entity, so no schema will ever report it. A column omitted this way SHALL reappear on
its own once the instance reports its field, with no stored column choice to reset.

An enrichment field's exposed name is a qualified flat name containing a dot. The grid SHALL read such a field
by that whole name and MUST NOT interpret the dot as a path into a nested value: the row carries the name as a
single key, so a path interpretation finds nothing and renders an empty cell for a field the row does carry.

A column SHALL be classified by whether its field is enrichment-backed, because that classification decides
whether revealing the column costs a re-query. A rollup field is a plain column of the table already being
read, so it is projected whether or not its column is visible and revealing it fetches nothing. An enrichment
field pulls its enrichment's join in, so it is projected only while its column is visible — except where the
identity column reads it, since that column cannot be hidden.

When the entity schema cannot be fetched the grid SHALL render the columns that need no optional field, and
SHALL report what was dropped in terms of the columns themselves rather than in terms of a catalog of
additional fields, which no longer exists.

#### Scenario: The column set is fixed, not derived

- **WHEN** the conversations grid loads against an instance reporting every field this view can read
- **THEN** it renders exactly the ten designed columns
- **AND** no column is generated from a field's display name or declared type
- **AND** no column is offered for the insight sentiment, sentiment score, topic, language, resolution status,
  model, evaluator version, enriched-at or group version, nor for the cache, cached-prompt or reasoning token
  counts, nor for the chain cost

#### Scenario: The default view is six columns

- **WHEN** the grid loads with no stored column choice
- **THEN** the conversation, project, user, activity and cost columns are visible, together with Rating
- **AND** the turns, tokens, deployments and topics columns are hidden

#### Scenario: Origins are named readably and the enrichment is distinguished

- **WHEN** the grid renders its origin groups
- **THEN** each is named in readable words rather than by a catalog identifier
- **AND** the topics column is attributed to the insight enrichment, not to the rollup
- **AND** the columns of one origin are adjacent

#### Scenario: The identity column declares the rollup and discloses its title's source

- **WHEN** the grid renders the conversation column's disclosure
- **THEN** the column is attributed to the rollup origin
- **AND** the disclosure states that the title comes from the insight enrichment
- **AND** it states that a title may describe only part of the conversation
- **AND** no row carries a separate truncation marker

#### Scenario: The identity column cannot be hidden

- **WHEN** the operator opens the column panel
- **THEN** the conversation column offers no way to hide it
- **AND** every other column can be hidden

#### Scenario: Every column is attributed to exactly one origin

- **WHEN** the column set is built
- **THEN** each column belongs to one origin group
- **AND** no column is left unattributed

#### Scenario: A dotted enrichment field is read by its whole name

- **WHEN** the topics column renders a row carrying the `conversation_insights.topics` key
- **THEN** the cell states that row's topics
- **AND** it is not empty

#### Scenario: A curated column whose field is missing is not rendered

- **WHEN** the schema reports no insight column
- **THEN** the grid renders no topics column
- **AND** the column panel offers it nowhere
- **AND** the remaining columns render as they did before it existed

#### Scenario: Rating survives a schema that reports no such field

- **WHEN** the column set is built from a schema that reports no `rating` field
- **THEN** the Rating column renders

#### Scenario: A failed schema fetch degrades to the unconditional columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the columns that need no optional field render
- **AND** the view reports that the optional columns were dropped because the schema could not be read

#### Scenario: Sort affordances match what the query can order

- **WHEN** the grid renders its headers
- **THEN** the conversation, project, user, turns, activity, tokens and cost columns offer a sort
- **AND** the rating, topics and deployments columns offer none

### Requirement: Conversations grid names the deployments a conversation used

The conversations grid SHALL present a curated **Deployments** column reading the rollup's `deployments`
array, so an operator can see which deployments served a conversation without opening it. The column SHALL be
part of the default visible set and SHALL be projected by the first list query.

The column SHALL render its values as discrete pills with an overflow badge stating how many further values
exist, and SHALL make the complete list reachable without a pointer, so the values hidden by the overflow are
available to a keyboard user and not only on hover.

The column SHALL render the array **as recorded**. It MUST NOT narrow it, and it MUST NOT be labelled as
naming models. `deployments` records every deployment that handled a hop — orchestrating deployments,
applications, MCP toolsets and embedding deployments alongside the models — and which of those is a model is
not derivable from the array. A name-shaped rule cannot decide it: a router or application deployed under a
plain name is indistinguishable from a model, while an embedding deployment that was billed is a legitimate
member of the billed set. A column labelled for the field it reads needs no such guess and cannot misreport.

Where a per-conversation set of **billed models** is wanted, it SHALL come from a conversation-level field the
service reports. The turn rollup's `models` column is the authoritative billed set but is per turn, no
server-side union over it is expressible, and a union over the bounded turn list a detail view loads would
understate a longer conversation — so the grid MUST NOT synthesize one.

The column SHALL NOT be sortable and SHALL NOT be filterable. The query language expresses no ordering or
predicate over an array field, and the grid pages server-side, so any client-side ordering or filtering would
apply to the loaded page rather than to the result and would misstate what it did.

#### Scenario: Deployments renders on first paint

- **WHEN** the conversations grid loads with no stored column choice
- **THEN** the Deployments column is visible
- **AND** the first list query's select names `deployments`

#### Scenario: Values render as pills with an overflow badge

- **WHEN** a conversation's list holds more values than the column width fits
- **THEN** the cell renders as many pills as fit followed by a badge stating the remaining count
- **AND** the complete list is reachable without a pointer

#### Scenario: The recorded array renders unnarrowed

- **WHEN** a conversation's deployments include an application resource path, a toolset resource path, an
  embedding deployment and a model
- **THEN** the cell states all four
- **AND** none is withheld as not being a model

#### Scenario: The column does not claim to name models

- **WHEN** the operator reads the column header
- **THEN** it names deployments
- **AND** the detail view's metadata panel names the same field the same way

#### Scenario: Deployments offers no sort or filter affordance

- **WHEN** the operator inspects the Deployments column header
- **THEN** it offers neither a sort affordance nor a filter control

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

### Requirement: Conversation message content is the recorded transcript

The conversation detail view SHALL render the conversation's **recorded** message text — the words the user
and the assistant actually exchanged, as `dial_usage_log` stored them — and MUST NOT render fabricated,
derived or sample content in their place.

The presentation SHALL be the one the view already uses: alternating user and assistant messages, each
assistant message carrying its turn's real token total, cost, hop count and duration, its rating counts, and
the control that opens that turn's trace. Only the message text changes. The notice stating that the messages
are samples SHALL be removed, because the statement it makes is no longer true.

The transcript MUST NOT interleave tool calls, model steps or embeddings between the messages. The hop chain
is the Trace view's subject, and a reader who wants it has a control on every assistant message and a view
switch on the page.

An assistant message SHALL be bound to its turn by **trace id**, not by its position in the rendered list. A
transcript assembled from one bounded read and a turn list assembled from another can differ in length or in
membership, and a positional binding would then attach one turn's figures to another turn's words.

An assistant message whose recorded response carries no text content SHALL render the view's explicit
unavailable placeholder rather than an empty bubble. A response with empty content is a response that put its
output somewhere other than text — commonly in tool calls — and a blank bubble would read as an assistant
that said nothing.

#### Scenario: Recorded messages render in place of sample content

- **WHEN** the detail view loads a conversation whose hop log carries its bodies
- **THEN** the user and assistant messages show the recorded text
- **AND** no notice claims the messages are samples

#### Scenario: The transcript carries no machinery between messages

- **WHEN** a turn's hop chain includes tool calls and embeddings
- **THEN** none of them render between the messages of the transcript
- **AND** the assistant message still offers the control that opens that turn's trace

#### Scenario: An assistant message takes its figures from its own turn

- **WHEN** the transcript carries a turn the bounded turn list does not, or lists them in a different order
- **THEN** each assistant message shows the figures of the turn whose trace id it shares
- **AND** no assistant message shows another turn's figures

#### Scenario: A response with no text content is stated, not blank

- **WHEN** a turn's recorded response carries no text content
- **THEN** that assistant message renders the explicit unavailable placeholder

### Requirement: The transcript is assembled from every entry hop of the conversation

A conversation's **entry hop** is a `dial_usage_log` row attributed to that conversation whose
`core_parent_span_id` is null — what the client sent to DIAL. Where one exists, its request body carries the
user-visible exchange with no system prompt and no internal planning; a child hop carries the machinery
instead, and one sampled child held a 20 461-character system prompt. The transcript SHALL therefore be
assembled from entry hops alone, and MUST NOT read a child hop's body for message text.

The null test SHALL be a null test. The column is null for a root hop and never the empty string (measured:
655 078 null, 0 empty), so a predicate comparing it to an empty string would match nothing.

Where a conversation has entry hops at all, it has at most one per trace id, so its entry hops are its turns.
A conversation MUST NOT be assumed to have one per trace, or any at all: observed conversations carry a full
set of turns in the rollup and no entry hop under their `chat_id`, and that case is governed below.

The transcript MUST NOT be taken from a single row. Reading only the newest entry hop's request body is
correct **only** for a client that resends the whole history each turn. A DIAL **application** deployment
keeps conversation state server-side and sends only the new message: one measured 11-turn conversation
reported `1, 3, 1, 1, 1, 1, 1, 1, 3, 5, 5` messages across its entry hops in time order, eight of eleven
turns carrying a single message, while a full-history client on the same instance grew monotonically
247 → 250 → 253 → 255 → 258.

Entry hops SHALL be read in ascending `request_time` order and assembled in that order. For each entry hop,
the messages its request body carries SHALL be appended to the transcript **after dropping the longest
leading run of them that already matches the tail of the assembled transcript**, and the text decoded from
its response body SHALL then be appended as that turn's assistant message. One rule SHALL cover both client
shapes: a full-history client's leading run matches everything already assembled and contributes only its
new message, and an application deployment's single message matches nothing and is appended whole.

**A message whose text was never recorded SHALL match.** Two messages with the same role SHALL be treated as
the same message when either carries no text, because a message this view failed to decode is still that
message. A turn that answered with tool calls alone decodes to no text while the resent copy of that same
message carries no `content` key at all, and comparing the two strictly finds no overlap anywhere in the
history: the match is effectively all-or-nothing, so a single mismatched message re-appends the **whole**
conversation under the later turn — the reader sees their first question twice, and the duplicated answer
carries the later turn's tokens, cost, hops and duration.

Where the newest entry hop demonstrably carries the whole conversation, the implementation MAY fetch that one
row's bodies instead of every row's. **The test SHALL be that every entry hop's message count is exactly
`2k − 1` at its position `k`** — one question and one answer per turn, in order — and not merely that the
newest hop's count reaches `2n − 1`. Where the test does not hold, every entry hop's bodies SHALL be fetched.

This is a cost optimisation and SHALL produce the same transcript as the general rule, **including which turn
each message belongs to**. A single body carries no turn of its own for the messages inside it, so a count
that only reaches `2n − 1` establishes that the content is all present while saying nothing about where one
turn ends and the next begins; attributing those messages by position under that weaker test puts the newest
turn's figures beneath every answer in the conversation. Under the exact test the attribution is arithmetic:
the messages at index `2i` and `2i + 1` belong to turn `i + 1`, and the newest turn's answer comes from the
response body. Where the decoded history is not the length the test promised, the implementation SHALL fall
back to fetching every entry hop's bodies rather than attributing by position.

The entry-hop read SHALL be bounded by the same limit as the turn list, so the transcript and the turn list
cannot disclose different lengths for one conversation. When the bound clips the entry hops, the view SHALL
state both figures together exactly as the turn list already does.

**The entry-hop test MUST NOT be relaxed.** A conversation can record hops under its `chat_id` and yet have
no entry hop among them, because the hop that entered DIAL was logged with no `chat_id` of its own. This is
not a rare accident: it is a routine outcome for whole classes of deployment, and observed conversations show
it for every one of their turns. In such a conversation the hops that *are* attributed to it are inner
agent-loop calls, and the view MUST NOT take message text from one. Sampled examples carry a system message,
a tool-definition array, and per-turn message counts that grow with the loop rather than with the
conversation. Specifically, the view MUST NOT fall back to a hop whose parent is merely absent from the
result, nor to the earliest hop of each trace, nor to any hop selected by recency or depth: each of those
would render a system prompt and a tool catalogue as though the user had typed them. A conversation with hops
but no entry hop SHALL render the dedicated state that says the transcript cannot be reconstructed.

**Only user and assistant messages belong to the transcript.** A message whose role is neither SHALL be
excluded, and a request body's own system field — where the dialect carries one outside the message list —
SHALL be ignored. The exclusion is by role, applied to every entry hop, and does not depend on the entry-hop
test having already screened the hop: two independent rules protecting one outcome is the point, because the
consequence of a single missed case is a leaked system prompt.

**A message's content is a string or a list of content parts.** Both SHALL be handled; a list SHALL be
reduced to the text of its text-bearing parts, in order. A message that carries no `content` key at all is
not a message with empty content — it is a message whose output went elsewhere, and it SHALL be treated as
such rather than as an empty string.

#### Scenario: Entry hops are selected by a null parent span

- **WHEN** the entry-hop query is built
- **THEN** its filter tests that the parent span column is null
- **AND** it does not compare that column to an empty string

#### Scenario: A server-side-state deployment's transcript is assembled across turns

- **WHEN** a conversation's entry hops each carry only the turn's new message
- **THEN** the transcript contains every turn's user message
- **AND** it is not limited to the messages the newest entry hop carried

#### Scenario: A full-history client's repeated messages appear once

- **WHEN** a conversation's entry hops each resend the whole prior exchange
- **THEN** each message renders exactly once
- **AND** the messages are in the order the entry hops recorded them

#### Scenario: A resent message whose text was never recorded is not repeated

- **WHEN** a full-history client resends a message whose text this view could not decode from its own turn
- **THEN** that message appears once
- **AND** the earlier turn's messages are not repeated under the later turn

#### Scenario: Child hop bodies are never read for message text

- **WHEN** the transcript is assembled
- **THEN** no body of a hop with a non-null parent span is read

#### Scenario: A clipped entry-hop read states its bound

- **WHEN** a conversation records more entry hops than the bound allows
- **THEN** the view states how many of how many turns are shown
- **AND** that disclosure is visible without interaction

#### Scenario: A conversation with hops but no entry hop is not reconstructed from them

- **WHEN** a conversation's hops all record a parent span and none is an entry hop
- **THEN** the view renders the state that says the transcript cannot be reconstructed
- **AND** no message text is taken from any of those hops
- **AND** the Trace view, the header, the panels and the turn list still render

#### Scenario: A system message is never part of the transcript

- **WHEN** an entry hop's request body carries a system message, or a system field outside the message list
- **THEN** neither appears in the transcript
- **AND** only the user and assistant messages render

#### Scenario: Content parts are reduced to their text

- **WHEN** a message's content is a list of content parts rather than a string
- **THEN** the message renders the text of its text-bearing parts in order

### Requirement: Assistant text is read from the assembled response, or decoded from the raw body

A request body is always plain JSON. An assistant's text has **two** possible sources, and the transcript
SHALL treat both as first-class.

**Preferred source — `assembled_response`.** Where the producer persists it, this column holds the merged
response message: a single JSON object whose first choice's message content is the readable answer, already
reassembled from whatever streaming the call used. Reading it avoids reassembling a chunk transcript.

**Guaranteed fallback — `response_body`.** The assembled column is not always populated. It is null for every
row ingested before the producer began writing it, and hop rows live for a year, so a recently upgraded
instance carries up to a year of conversations for which the raw body is the **only** source of assistant
text. A minority of rows, current ones included, also store a value that is not JSON. The fallback is
therefore an ordinary operating mode, not an error path, and SHALL be implemented and tested as such.

The fallback SHALL decode `response_body` in whichever of three formats it is written:

- a stream of OpenAI server-sent-event chunks — the concatenation of the streamed content deltas in arrival
  order;
- a single JSON object — the first choice's message content;
- JSON-RPC over server-sent events, for an `mcp` hop — the concatenation of the result's content parts.

The format SHALL be determined from the body itself, not from a recorded flag. The hop log carries **no**
streaming column; whether a call streamed is stated inside the request body, and a request body that is
absent, withheld or unparseable would leave the response undecodable for want of a discriminator that the
response already carries plainly.

The fallback SHALL be used whenever the assembled value is absent, null, or not parseable as JSON — the three
cases are indistinguishable to a reader and SHALL be indistinguishable in behaviour. A turn SHALL NOT render
as unavailable while a decodable raw body for it exists.

Where neither source yields text, the turn SHALL render the view's unavailable placeholder. It MUST NOT yield
the raw body, a partial fragment, or a fabricated substitute: a malformed body is an unknown message, and
rendering bytes at the reader would present transport detail as conversation.

A response whose decoded content is empty, or which carries no content key at all, SHALL NOT be treated as an
empty step. Its output is in the response's tool calls, whose names exist **only** in a response body — the
hop log carries no column for them.

#### Scenario: The assembled response is preferred where present

- **WHEN** a turn's assembled response is present and parseable
- **THEN** the assistant message is its first choice's message content
- **AND** the raw response body is not decoded for that turn

#### Scenario: A null assembled response falls back to the raw body

- **WHEN** a turn's assembled response is null because the row predates the column
- **THEN** the assistant message is decoded from the raw response body
- **AND** the turn does not render as unavailable

#### Scenario: A non-JSON assembled response falls back to the raw body

- **WHEN** a turn's assembled response is present but is not parseable as JSON
- **THEN** the assistant message is decoded from the raw response body

#### Scenario: A streamed body is reassembled from its chunks

- **WHEN** the fallback decodes a body that is a stream of event chunks
- **THEN** the assistant message is the concatenation of their content deltas in arrival order

#### Scenario: A single-object body is read from its first choice

- **WHEN** the fallback decodes a body that is one JSON object
- **THEN** the assistant message is that object's first choice's message content

#### Scenario: An MCP body is read from its JSON-RPC result

- **WHEN** the fallback decodes an MCP hop's body written as JSON-RPC over server-sent events
- **THEN** its text is the concatenation of the result's content parts

#### Scenario: The format is decided by the body, not by a flag

- **WHEN** the fallback decodes a response body
- **THEN** the format is determined from the body's own shape
- **AND** no streaming column of the hop log is consulted

#### Scenario: Neither source yields a placeholder, not raw bytes

- **WHEN** the assembled response is unusable and the raw body cannot be parsed in any of the three formats
- **THEN** that message renders the unavailable placeholder
- **AND** no part of either raw value is rendered

### Requirement: The body columns are schema-gated for two independent reasons

The fetched `dial_usage_log` entity schema SHALL be the sole authority on which body columns a query may
name. Two different conditions remove a column from that schema, they are **not** interchangeable, and a
projection that names an absent column is rejected with the whole query — so both must be handled or the
Chat view fails outright rather than degrading.

**Access — `sensitive`.** `request_body`, `response_body` and `assembled_response` are flagged `sensitive` in
the analytics catalog, so the service omits them from the schema it returns to any caller below FULL_ADMIN.
This is the expected path for a non-admin, and it removes all three at once. All three are also `heavy`,
which keeps them out of a wildcard projection but is a transfer-cost hint rather than access control.

**Service version.** `assembled_response` is a **later addition** to the hop log and does not exist on every
instance. An instance predating it does not persist the column at all — its own mapping states that the
merged response is read at ingest as a deriver source and never stored — so the column is missing from the
schema for **every** caller, full administrators included. This is not an access condition and no permission
changes it; only upgrading the service does.

Consequently `assembled_response` SHALL be treated as an **optional** field in exactly the sense the
conversations views already use: named only when the fetched schema reports it, through the same
optional-field mechanism the insight columns go through. It MUST NOT be named unconditionally. Naming it on
an instance that predates it costs the whole transcript query, which is the one failure this gate exists to
prevent — and it is a failure a full administrator would see, so no amount of permission masks it.

**`response_body` SHALL be optional on exactly the same terms**, and for a reason that follows directly from
the gate below: the view is offered when *either* response column is present, so an instance reporting only
the assembled column is a supported state — and a projection that names `response_body` regardless rejects
the whole query on it. Neither response column may be named unconditionally. Gating one and hard-coding the
other makes the gate and the projection two different answers to the same question, which is the failure this
requirement exists to prevent.

The Chat view SHALL be offered when the schema reports `request_body` **and at least one** of
`assembled_response` or `response_body`. The request body has no substitute — it is the only record of what
the user said — while either response column can supply the assistant's text. An instance that carries
`response_body` but not `assembled_response` SHALL therefore offer a fully functional Chat view.

The frontend MUST NOT implement an access check of its own. The service's column-level access control is the
gate, and a second gate maintained here would be a second answer to the same question.

Where the Chat view is not offered, the view SHALL state that the transcript is not available and SHALL keep
the Trace view, the header, the panels and every figure on the page fully functional. It MUST NOT render an
error, and MUST NOT imply the conversation recorded no messages.

A schema read that **fails** is not the same as a schema that omits a column, and SHALL be reported as a
failure rather than silently withholding the Chat view.

#### Scenario: A full administrator on a current instance is offered the transcript

- **WHEN** the fetched hop-log schema reports the request body and both response columns
- **THEN** the Chat view is offered and renders the recorded transcript

#### Scenario: An instance without the assembled column still offers the transcript

- **WHEN** the fetched schema reports the request body and the raw response body but not the assembled response
- **THEN** the Chat view is offered
- **AND** no query names the assembled response column
- **AND** the assistant text is decoded from the raw response body

#### Scenario: The assembled column is named only when the schema reports it

- **WHEN** the transcript body query is built and the schema does not report the assembled response
- **THEN** the select does not name it
- **AND** the query returns rows

#### Scenario: The raw response column is named only when the schema reports it

- **WHEN** the fetched schema reports the request body and the assembled column but not `response_body`
- **THEN** the transcript query does not name `response_body`
- **AND** the Chat view is offered and renders the transcript

#### Scenario: A caller without the body columns is not offered the transcript

- **WHEN** the fetched hop-log schema reports none of the body columns
- **THEN** the Chat view is not offered
- **AND** the view states that the transcript is unavailable to this caller rather than showing an error
- **AND** the Trace view, the header and the panels still render

#### Scenario: No frontend role check gates the transcript

- **WHEN** the detail route decides whether to offer the Chat view
- **THEN** the decision reads only the fetched entity schema
- **AND** no role, scope or permission of the session is consulted

#### Scenario: A failed schema read is reported as a failure

- **WHEN** the hop-log schema cannot be fetched
- **THEN** the view reports a failure rather than presenting the transcript as unavailable to the caller

### Requirement: Hop bodies are read and decoded server-side and never sent to the browser

Every read and every decode of a `request_body` or `response_body` value SHALL happen on the server, and
only the assembled transcript SHALL be sent to the client. Bodies reach megabytes in a single row — a sampled
response body was 1.4 MB and a 116-turn conversation's newest request body was 405 KB — so shipping them
would move the cost of the page onto the reader's connection and put encrypted-at-rest content into a client
bundle.

Every query reading the hop log SHALL predicate on `chat_id`. The table carries a bloom-filter index on
`chat_id`, `trace_id` and `core_span_id`, which makes such a read fast; a read predicated on an attribute
instead — `event_kind`, for instance — took over 120 s on a two-core virtual machine and took the service
down with it. A hop-log query MUST NOT be issued without a chat predicate.

The entry-hop read SHALL be split so the expensive columns are named only where needed: a first query naming
no body column establishes the conversation's entry hops, their times, their deployments and their message
counts, and a second names the body columns for the rows the assembly actually requires.

**A body query SHALL additionally be bounded by a range over the recorded times of the exact rows it
fetches.** The hop log is partitioned by the day of `request_time`, and a chat predicate alone does not prune
a single partition: a measured body read filtered only by `chat_id` and `trace_id` exceeded the service's
two-gigabyte query budget and was rejected, while the same read with a bounded time predicate returned
immediately. The bound MUST NOT be widened to the conversation's own span — conversations run for weeks, and
one observed conversation spanned 27 daily partitions, enough to exceed the budget again. The first query
already returns each entry hop's `request_time`, so the second SHALL be bounded by the earliest and latest of
exactly the times it is fetching. Where the assembly needs one row, that is one instant and one partition.

**The bound SHALL be expressed as a `>=`/`<=` pair, never as an `in` list of the exact instants.** An `in`
list over a timestamp column compiles to `has([…], request_time)`, a function over the column: the query
planner reports its partition condition as unconditionally true and selects every part, exactly as no
predicate at all does. Only a range prunes. A range matches other entry hops that fall inside the window; the
`trace_id` list is what keeps the result exact, and it is required for correctness rather than for cost,
since it prunes no partition either.

**Those times SHALL be converted to epoch milliseconds.** The query DSL accepts a `timestamp` value only as
milliseconds, while a row carries `request_time` as an ISO-8601 string. Passing a returned value through
verbatim is rejected as an invalid timestamp literal, which fails the whole body read and is indistinguishable
to the reader from a conversation that recorded no bodies. The column has millisecond precision, so the
conversion is lossless.

#### Scenario: The client receives messages, not bodies

- **WHEN** the detail page renders a transcript
- **THEN** the data sent to the browser contains the decoded messages
- **AND** it contains no request or response body value

#### Scenario: Every hop-log query filters by conversation

- **WHEN** any query against the hop log is built for this view
- **THEN** its filter includes an equality predicate on the conversation id

#### Scenario: The cheap read names no body column

- **WHEN** the first entry-hop query is built
- **THEN** it names no body column

#### Scenario: A body query is bounded by the times of the rows it fetches

- **WHEN** the body query is built for a set of entry hops
- **THEN** its filter bounds `request_time` to the earliest and latest recorded time among exactly those rows
- **AND** the bound is not widened to the conversation's own first and last request time

#### Scenario: The bound is a range, not a set of instants

- **WHEN** the body query is built for a set of entry hops
- **THEN** the time bound is a pair of `>=` and `<=` comparisons
- **AND** it is not an `in` list of the individual recorded instants

#### Scenario: A recorded time is converted to epoch milliseconds

- **WHEN** a first-query time is returned as an ISO-8601 string
- **THEN** the value sent as the bound is that instant in epoch milliseconds

### Requirement: A turn is titled by the question it answered

The turn list SHALL title each row with that turn's own user question, and SHALL carry the turn number and
trace id as its subtitle. A reader scanning a conversation's turns is looking for the exchange, not for an
identifier; the number and the trace id identify a turn once it has been found, which is a subtitle's job.

The question SHALL be the last user message the turn contributed to the transcript. A turn's request body ends
with the user's new message, so its last user message is the question that turn answered. It SHALL be derived
from the assembled transcript rather than from a query of its own: the transcript is already fetched, decoded
and attributed, so one rule covers both fetch paths and the titles cost nothing.

**A turn with no question SHALL fall back to its turn number**, per turn rather than for the list as a whole.
A conversation with no entry hop has no transcript, and a caller whose schema withholds the body columns is
told nothing about any turn — the turn list SHALL remain usable in both cases, since its figures come from the
rollup and do not depend on a body.

An open hop chain SHALL be titled the same way, with the turn number and trace id beneath it: a reader who
reached a chain from a list row is looking at the same turn and SHALL see the same thing they clicked. Both
SHALL read one derivation of the questions, so the two cannot disagree about a turn.

The question SHALL be truncated with the shared ellipsis-tooltip control, so a long question stays reachable
rather than being cut off.

#### Scenario: Each turn is titled by its own question

- **WHEN** the turn list renders a conversation whose transcript is available
- **THEN** each row is titled with the user question that turn answered
- **AND** the turn number and trace id appear as that row's subtitle

#### Scenario: A turn without a question keeps its number

- **WHEN** a turn contributed no user message to the transcript
- **THEN** that row is titled with its turn number
- **AND** the other rows keep the questions they do have

#### Scenario: An open hop chain is titled by the same question

- **WHEN** a turn's hop chain is opened
- **THEN** it is titled with the question that turn answered
- **AND** the turn number and trace id appear beneath it

### Requirement: A turn renders as a flat, typed, filterable event stream

A turn's hops SHALL render as one flat numbered stream of typed events, not as a nested tree. The span tree is
one root with hundreds of direct children and a second level only under a tool call, so nesting conveys almost
nothing; typing and filtering convey what a turn consisted of.

**An event is not a hop.** One model call emits a reasoning marker, its answer, and one event per tool it
requested, so the stream is longer than the hop list — 384 hops of one measured turn become 446 events. Events
SHALL be typed as: the turn's question and its totals (the frame), assistant text, tool request, tool result,
reasoning, empty, error, session, embedding, and a generic type for anything unrecognised.

**Typing SHALL be a deny-list at every level.** An `event_kind` or `mcp_method` this frontend does not
recognise SHALL render as a shown, generically-typed row: silently dropping something unfamiliar is the worse
failure in an observability tool. Two cases SHALL be handled explicitly — a hop with no `event_kind` is not
unknown but an unlabelled model call, classified by its endpoint (53 179 such hops exist table-wide); and a
`count_tokens` endpoint is utility rather than conversation.

**`route` hops SHALL be excluded from the stream entirely.** All 5 611 of them carry an empty `chat_id`: they
are scheduler REST calls and never part of a conversation.

**A failed hop SHALL emit a single error event whatever kind of hop it is**, so a failure can never be buried
among the rows of the work it was attempting. A failure is either a false success flag or a status of 400 or
above.

**A reasoning event SHALL state its token count and MUST NOT claim to carry content.** The reasoning text is
recorded nowhere; the count is its only trace, and `reasoning · 264 tok` says more than an empty row.

**The tool-request to tool-result gap SHALL be surfaced, not hidden.** 85 tools were requested on the measured
turn and 57 results recorded; the missing 28 are functions the calling application handles internally, which
never cross a network boundary and so were never logged. A request with no recorded result SHALL say so. The
surplus SHALL be resolved **by count per tool name, never by identity** — the log pairs nothing, so no claim
may be made about which specific request went unanswered.

**The stream SHALL offer one filter control per event category, and SHALL start with every category shown.** An
observability tool that opens by hiding what it recorded makes the reader's judgement for them, so narrowing is
the reader's action.

**Activating a category SHALL isolate it**, showing that category alone; activating it again SHALL restore every
category, so one control both narrows and releases. A separate control SHALL also restore every category. Each
control SHALL name its category and nothing more, and SHALL expose programmatically whether it is the isolated
one rather than signalling it by appearance alone. **How much of the stream is showing SHALL be stated once**,
beside the filters, rather than as a count on each of them.

**The frame SHALL NOT be offered as a category, and SHALL be shown only while the whole turn is.** It describes
the turn rather than anything that happened inside it, so a view narrowed to one category SHALL answer with that
category alone — asking for the tool calls answers with tool calls, not with tool calls between two rows about
something else.

**Every category SHALL remain selectable whether or not the turn recorded any of it**, and isolating one the
turn has none of SHALL state that plainly. Asking "were there any errors" is a real question and *none* is a
real answer; a control that cannot be pressed gives neither. **No filter control SHALL be disabled, including
the one that is currently active**: the pressed state already says which filter is on, and disabling the active
control drops it out of the tab order — so the reader who narrowed by keyboard cannot get back.

**Line numbers SHALL reflect position in the unfiltered stream**, so a narrowed view still says where in the
turn each row sits, and the stream SHALL state how many rows of the total are showing. Both sides of that
count SHALL exclude the frame, which is not one of the turn's rows: counting it in the total but not in a
narrowed selection compares unlike things. The count is the only feedback that a filter took effect — the rows
themselves change silently — so it SHALL be announced to assistive technology when it changes.

**A frame row SHALL NOT be a control.** It carries the question and the turn's totals and stands for no hop, so
there is nothing to open: rendering it as a control that happens to be unavailable advertises an action that
does not exist.

**Deriving the stream requires the model calls' own response bodies**, which are the only record of whether a
call answered and which tools it asked for. Those SHALL be read server-side for the model-call hops only,
bounded by a cap, with only the decoded text and tool names crossing to the client. On the measured turn that
is 43 of 384 hops and 2.04 MiB of the trace's 16.67 MiB. Where the response column is not in the caller's
schema, or a call falls past the cap, its rows SHALL be typed generically rather than reported as empty. A hop
the log records as having returned **no bytes** is the exception: its emptiness is a recorded fact, not an
unread body, and it SHALL be typed empty so the two remain distinguishable.

#### Scenario: One model call emits several events

- **WHEN** a model call answered and requested a tool
- **THEN** the stream carries a text event and a tool-request event for that one hop

#### Scenario: An unlabelled model call is typed as conversation

- **WHEN** a hop records no event kind but a model endpoint
- **THEN** its events are typed as a model call's

#### Scenario: An unrecognised hop is shown

- **WHEN** a hop records an event kind this frontend does not recognise
- **THEN** it renders as a generically-typed row rather than being dropped

#### Scenario: A route hop is excluded

- **WHEN** a trace contains a hop whose event kind is route
- **THEN** the stream contains no event for it

#### Scenario: A failed hop is one error event

- **WHEN** a hop failed
- **THEN** it emits a single error event and no other event

#### Scenario: A reasoning event states its tokens

- **WHEN** a hop recorded reasoning tokens
- **THEN** a reasoning event states that count
- **AND** it does not claim to carry the reasoning text

#### Scenario: An unanswered tool request says so

- **WHEN** more requests for a tool were made than results recorded for it
- **THEN** the surplus requests are marked as having no recorded result

#### Scenario: Every category is shown until the reader narrows

- **WHEN** the stream first renders
- **THEN** events of every category are shown
- **AND** each category offers a control naming it
- **AND** the stream states how many rows of the total are showing

#### Scenario: Activating a category isolates it

- **WHEN** a category's control is activated
- **THEN** only that category's events are shown
- **AND** activating it again shows every category

#### Scenario: A turn that recorded no hops says so

- **WHEN** a turn's trace returned no hops
- **THEN** the stream states that nothing was recorded
- **AND** it does not render the frame with nothing between its two rows

#### Scenario: A category with no events stays visible and operable

- **WHEN** the turn recorded no events of some category
- **THEN** that category's control remains selectable
- **AND** isolating it states that none were recorded

#### Scenario: The active filter is not disabled

- **WHEN** every category is showing
- **THEN** the control that restores every category states that it is the active one
- **AND** it is not disabled

#### Scenario: A frame row is not a control

- **WHEN** the stream renders the turn's question and totals
- **THEN** neither row is rendered as a control

#### Scenario: The showing count excludes the frame from both of its figures

- **WHEN** a category is isolated
- **THEN** the stated count compares that category's rows against the turn's rows
- **AND** neither figure counts the frame

#### Scenario: A model call recorded as returning no bytes is empty, not unread

- **WHEN** a model call's recorded response size is zero
- **THEN** its row is typed empty
- **AND** it is distinguishable from a call whose body was not read

#### Scenario: A narrowed view shows its category alone

- **WHEN** a category is isolated
- **THEN** the turn's question and totals are not shown
- **AND** restoring every category shows them again

#### Scenario: An isolated category with nothing in it says so

- **WHEN** a category the turn recorded none of is isolated
- **THEN** the stream states that the turn recorded no events of that kind

#### Scenario: Line numbers survive filtering

- **WHEN** the stream is filtered
- **THEN** each visible row keeps its number from the unfiltered stream

### Requirement: A hop's own request and response are read on demand

The hop detail SHALL state what the selected hop sent and what came back, decoded from its recorded bodies.
An `llm_call` hop SHALL state the last message it sent and its response text; an `mcp` hop SHALL state its
JSON-RPC arguments and its tool result. A hop whose response carried no text SHALL state the tool names it
requested, which exist only in a body — the hop log has no column for them.

**Only the last message of an `llm_call` request SHALL be stated, and only for a role the transcript admits.**
An inner agent-loop request carries a system prompt, a tool catalogue and the whole accumulated history, none
of which is what a reader opening one hop is asking about — and the first two must never reach the screen. The
role filter that protects the transcript SHALL apply here too, so this cannot become a second route to a
leaked prompt.

**Which hops have text worth opening SHALL be decided from the hop row, before any body is fetched.** The
section SHALL be suppressed, and the reason stated in its place, when the hop's recorded response size is
zero, when its MCP method is one of the nine protocol-envelope calls, or when its event kind is an embedding — a response that is a float vector and a request that is the probe
string producing it. On the sampled 384-hop turn this settles 284 hops with no fetch at all: 60 that returned
nothing, 116 session-setup calls and 108 embeddings, leaving 57 `tools/call` and 43 `llm_call`.

**That test SHALL be a deny-list and MUST NOT be inverted into an allow-list.** An MCP method or event kind
this frontend does not recognise SHALL default to shown. In an observability tool, silently hiding something
unfamiliar is the worse failure: an empty panel is a puzzle a reader can resolve by looking at it, while a hop
that never offers its text is a fact they cannot discover. A recorded response size that is absent rather than
zero is unknown, and an unknown size SHALL NOT be read as a claim that nothing came back.

A suppressed hop SHALL keep its row in the hop chain, with its timing, status and nesting intact — only the
text section is withheld, and it SHALL state why rather than rendering an empty panel.

**These bodies SHALL be fetched one hop at a time, when that hop is opened, and never with the hop chain.** A
measured 384-hop turn carried 99.26 MiB of request bodies and 16.67 MiB of responses, with one hop reaching
4.00 MiB; reading them with the chain would ship a hundred megabytes to render rows a reader may never open.
The read SHALL be filtered by conversation, trace and hop, and SHALL carry the same `request_time` range bound
as the transcript read — a single hop is a single instant, so the bound is one partition.

Decoding SHALL happen server-side and only the decoded text SHALL reach the client, exactly as the transcript
does. The same schema gate applies: where the body columns are not in the caller's schema the section SHALL be
absent entirely rather than explaining its own absence on every hop. A hop that recorded nothing readable and
a hop whose read failed SHALL be stated as the different facts they are.

Re-opening a hop already read SHALL issue no second read.

A read that **failed** SHALL be reported as a failure rather than in the same presentation as a hop that
recorded nothing — the two are the different facts named above, and rendering them identically hides an outage
behind an ordinary empty result. A decoded text long enough to scroll SHALL remain reachable by keyboard: a
scroll container with no tab stop puts everything past its first screenful out of reach for a reader with no
pointer.

#### Scenario: A hop's texts are read only when it is opened

- **WHEN** a turn's hop chain is rendered
- **THEN** no hop body is fetched for a hop that has not been opened
- **AND** opening one hop fetches that hop's bodies alone

#### Scenario: A hop with nothing worth reading is settled without a fetch

- **WHEN** a hop whose response size is zero, whose method is session setup, or whose kind is an embedding is
  opened
- **THEN** no body is fetched for it
- **AND** the section states why that hop has no text
- **AND** the hop keeps its row, its timing, its status and its nesting

#### Scenario: An unrecognised hop defaults to shown

- **WHEN** a hop records an MCP method or event kind this frontend does not recognise
- **THEN** its bodies are fetched and its text is shown

#### Scenario: An llm_call hop states its prompt, not its history

- **WHEN** an `llm_call` hop whose request carried a system prompt and prior turns is opened
- **THEN** the section states the last message the hop sent
- **AND** it states neither the system prompt nor the tool catalogue

#### Scenario: An mcp hop states its arguments and its result

- **WHEN** an `mcp` hop is opened
- **THEN** the section states the arguments it sent
- **AND** it states the text of the tool result

#### Scenario: A hop that returned no text names the tools it requested

- **WHEN** a hop whose response content is empty is opened
- **THEN** the section names the tools that response requested

#### Scenario: The section is absent when the body columns are withheld

- **WHEN** the caller's schema does not report the body columns
- **THEN** the hop detail renders no request-and-response section at all

### Requirement: The conversation detail view switches between Chat and Trace

The detail view SHALL offer a switch between two views of one conversation: **Chat**, the recorded
transcript, and **Trace**, the conversation's traces. The switch SHALL indicate which view is current, SHALL
be reachable by keyboard, and SHALL NOT navigate away from the conversation.

Choosing a view is a **local** change and SHALL re-render only the region the switch governs. The
conversation's header and the supporting panels beside the view do not depend on which view is showing, and
SHALL NOT re-render when it changes. Opening a hop chain is the exception, and only because the header gives
way to the trace's own identity.

**The Trace view SHALL land on a list of the conversation's traces**, one row per recorded turn, each stating
that turn's trace id, start time, hop count, token total, cost, duration and rating counts, and each opening
that turn's hop chain. Switching to Trace MUST NOT open a turn's hop chain directly: the reader has not chosen
a turn, and picking one for them presents an arbitrary default as the answer.

A conversation whose turn list is empty SHALL render the list's own empty state rather than refusing the
switch — the view still has something to say about why there is nothing to open. A failed turn read SHALL be
reported as a failure there, distinctly from an empty list.

The per-turn trace control on each assistant message SHALL keep its current behaviour: it opens a turn's hop
chain directly, without passing through the list.

Returning from a hop chain SHALL land on the view it was opened from. A reader who reached a hop chain from
the trace list and is returned to the transcript has been moved somewhere they were not, and has to find their
way back to the list to continue.

Where the Chat view is not offered — because the schema reports no usable body column, for either of the two
reasons a column can be missing — the switch SHALL still be rendered, with the Chat option disabled and its
reason stated, rather than removed. A control that disappears leaves the reader unable to tell an unavailable
view from a view that does not exist.

**In that state the view SHALL open on Trace**, not on the disabled Chat option. Opening on it makes the same
option current and unselectable at once, which is the expected path for every caller below FULL_ADMIN: the
disabled segment is not focusable, so keyboard navigation within the switch has no starting point, and the data
that *is* available has to be discovered.

The Chat option SHALL remain enabled whenever the transcript is merely **empty**. An aged-out, not
reconstructable or never-recorded transcript is a Chat view with something to say, and disabling the switch
would replace that statement with silence.

#### Scenario: Switching views keeps the conversation

- **WHEN** the user switches from Chat to Trace
- **THEN** the hop chain renders in place
- **AND** the page does not navigate away from the conversation

#### Scenario: The current view is indicated

- **WHEN** either view is shown
- **THEN** the switch indicates which of the two is current

#### Scenario: A caller without the body columns opens on the Trace view

- **WHEN** the schema reports no usable body column
- **THEN** the detail opens on the Trace view
- **AND** the Chat option is rendered, disabled, with its reason stated

#### Scenario: A per-turn control opens the trace on that turn

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's hop chain opens directly

#### Scenario: Switching to Trace lists the conversation's traces

- **WHEN** the user switches to Trace from the view switch
- **THEN** one row renders per recorded turn, each stating that turn's own figures
- **AND** no turn's hop chain is opened and no hop read is issued

#### Scenario: A trace in the list opens its hop chain

- **WHEN** a row of the trace list is activated
- **THEN** that turn's hop chain opens

#### Scenario: A conversation with no turns switches to an empty list

- **WHEN** the user switches to Trace on a conversation whose turn list is empty
- **THEN** the trace list states that no traces were recorded
- **AND** the switch is not refused

#### Scenario: Returning from a hop chain lands on the view it was opened from

- **WHEN** a hop chain opened from the trace list is closed
- **THEN** the Trace view is shown, still listing the traces
- **AND** a hop chain opened from an assistant message returns to the transcript instead

#### Scenario: An unavailable Chat view is disabled, not hidden

- **WHEN** the schema reports no usable body column
- **THEN** the switch renders with the Chat option disabled and its reason stated

#### Scenario: Choosing a view does not re-render the page around it

- **WHEN** the user switches between Chat and Trace
- **THEN** the conversation's header does not re-render
- **AND** the supporting panels beside the view do not re-render

#### Scenario: An empty transcript keeps the Chat view enabled

- **WHEN** the transcript is aged out, not reconstructable, or was never recorded
- **THEN** the Chat option stays enabled
- **AND** selecting it shows the statement for that cause

### Requirement: An absent transcript is distinguished from a failed one, by cause

A transcript can be absent for three different reasons and can fail for a fourth. All four render no
messages, and the view SHALL distinguish them, because they say different things about the conversation: one
lost its detail to age, one never had detail to lose, one has detail that cannot be attributed to the user,
and one is an outage. Collapsing them would state something false about three conversations out of four.

**Aged out.** `dial_usage_log` and `rate_analytics` retain a row for one year from its request time, while
`conversations`, `turns` and `conversation_insights` retain theirs indefinitely. The retention is
**row-level**, so a body lives exactly as long as the hop carrying it: a conversation older than a year keeps
its list row, its detail header and its rollup figures, and has no hops left to read. The view SHALL state
that the hop log no longer carries the conversation.

**Not reconstructable.** The conversation has hops, but none of them is an entry hop, so nothing recorded
under it represents what the user sent. The view SHALL state that the transcript cannot be reconstructed from
what was logged, and MUST NOT state that no messages were recorded — messages were recorded; they cannot be
attributed. This state exists precisely so that the view never has a reason to reach for an inner hop's body.

This is also the state for entry hops that **were** read and yielded no message: rows exist and no transcript
could be built from them, which is what this state says. Reporting that combination as an available transcript
of nothing renders it through the nothing-recorded presentation, which is the mislabel this state was added to
prevent. On the dev instance this is not an edge case — of 228 conversations with hops in one recent two-day
window, 112 had no entry hop, every one of them agent-SDK or benchmark traffic whose bodies open with a 6.6 KB
system prompt rather than anything a person typed. Widening the entry-hop rule to admit an orphaned hop would
put that system prompt where the user's first question belongs.

**Nothing recorded.** The conversation is within the retention window and has no hops at all.

**Failed.** A query or the schema read failed. The view SHALL state that the transcript could not be loaded.

None of the first three SHALL render as an error — nothing failed in any of them. In all four the header, the
panels, the turn list and every rollup figure SHALL still render, and the Trace view SHALL remain available
wherever hops exist.

#### Scenario: A conversation past retention states its transcript has aged out

- **WHEN** the detail view loads a conversation whose last request is older than the hop log's retention
- **AND** the conversation has no hops
- **THEN** the transcript region states that the hop log no longer carries the conversation
- **AND** no error is reported
- **AND** the header, the panels and the turn list still render

#### Scenario: Entry hops that yield no message state the transcript cannot be reconstructed

- **WHEN** the entry hops are read and none of their bodies yields a message
- **THEN** the transcript region states that the transcript cannot be reconstructed from the log
- **AND** it does not state that the conversation recorded no messages

#### Scenario: A conversation with hops but no entry hop states it cannot be reconstructed

- **WHEN** a conversation records hops and none of them is an entry hop
- **THEN** the transcript region states that the transcript cannot be reconstructed from the log
- **AND** it does not state that no messages were recorded
- **AND** the Trace view remains available for those hops

#### Scenario: A recent conversation with no hops states nothing was recorded

- **WHEN** a conversation within the retention window records no hops at all
- **THEN** the transcript region states that no messages were recorded

#### Scenario: A failed entry-hop query is reported as a failure

- **WHEN** the entry-hop query fails
- **THEN** the transcript region states that the transcript could not be loaded
- **AND** it does not state that the conversation recorded no messages

#### Scenario: The four states are distinguishable

- **WHEN** each of the four causes occurs
- **THEN** the transcript region renders a different statement for each

### Requirement: A turn's trace opens in place, stating the turn's own figures

Each assistant message SHALL offer a control opening that turn's trace, and the view switch SHALL offer the
Trace view for the conversation. The trace SHALL replace the transcript **within the same view** and SHALL
offer a control returning to the transcript. Opening a trace is a read of one turn and MUST NOT navigate away
from the conversation.

While a trace is open the conversation's header SHALL be replaced rather than kept above it. The trace states
its own identity and its own figures, and two stacked headers would leave the reader unsure which of them the
figures belong to.

**Ordering.** The events SHALL be ordered by the recorded time of the hop that produced them, and every row
SHALL state its own absolute recorded time. Measured over a 251-hop trace, no child hop began before its
parent and all 25 tied timestamps were between siblings — never between an ancestor and a descendant — so a
tie means genuine concurrency and any stable order among tied hops is honest. Hops from different parts of a
trace **interleave**: one sampled hop's children spanned 22.8 s with 11 hops from elsewhere starting inside
that window, so the view MUST NOT present any group of hops as a contiguous block of time.

**Durations are not claimed.** The view MUST NOT render a hop duration, a duration bar, an offset from the
start of the trace, or any other per-hop wall-clock figure. All 251 hops of the sampled trace reported a
duration of zero: DIAL clamps its own measurement at zero, so on a current producer a reported zero is a real
sub-millisecond operation, but a core predating the field omits it and the non-nullable fallback stores zero
— on that producer version zero is indistinguishable from "not reported", and the view cannot tell the two
apart. Ordering and absolute times are the only temporal claims the data supports. This is a property of the
producer, and the view SHALL NOT compensate for it.

Every row SHALL be typed, named, and — where it stands for a recorded hop — selectable. A **failed** hop
SHALL be typed by its failure whatever its kind: on a trace the reader is looking for what broke. The failure
rule SHALL be one predicate shared by the row and its detail, so a row typed as an error can never open a
detail reporting success.

**An MCP hop SHALL be named by what it did.** The trace SHALL project the hop's MCP method and its tool-call
name and SHALL label the hop by the tool it called where one is recorded, falling back to the method and only
then to the server name. Labelling an MCP hop by its server name alone leaves the tool invisible, which is
the one thing a reader opening a retrieval hop is looking for.

The trace MUST NOT present its MCP hops as the complete set of tools the model requested. A tool the calling
application implements internally never crosses a network boundary and is never logged: over one measured
trace, 43 of 48 requested tool calls produced exactly one MCP row each and 6 produced none, so the recorded
set under-reports model intent by roughly one call in eight. Every MCP-backed call did produce a row — no
rows are missing — so the view SHALL neither claim completeness nor report a missing row as an error.

**A hop's routing chain SHALL be shown where recorded.** The hop log carries the execution path as an
ordered list naming the deployments a request was routed through, application first and model last. Where
present it SHALL be rendered as that chain.

Selecting a hop SHALL show its detail beside the stream: its category and status, its recorded time, its
tokens and cost, its endpoint, its upstream, its calling deployment, its HTTP status, its MCP method and tool
where recorded, and its routing chain where recorded. Its decoded request and response text SHALL be read on
demand for that hop alone, under **A hop's own request and response are read on demand** — a raw body MUST
NOT reach the client in any case.

**Colour SHALL never be the only thing distinguishing one kind of row from another.** Every row states its
type as text, so the rail colour is redundant by construction and the view SHALL NOT rely on a legend to
make its rows readable. Every colour SHALL come from a theme token that the project's palette defines: a
class naming a token the palette does not carry renders nothing at all, silently.

**The trace SHALL state the turn's figures as the rollup resolved them, and MUST NOT re-derive them from the
hops it read.** Its token total, cost, hop count, duration and status SHALL come from the same turn row the
turn list renders, so the two cannot disagree about one turn. Summing the hops instead is wrong whenever the
hop read is bounded, which is precisely when a turn is large enough for a reader to open it: one measured
384-hop turn read 300 hops and summed to 700 106 tokens and $1.01 against the turn's own 3 667 333 and
$3.68 — a figure that is neither the turn's nor recognisably a part of it.

The status SHALL likewise be the turn's failed-hop count rather than a failure seen among the hops read, for
the same reason: a failure past the bound would otherwise render the turn as OK.

The hop list SHALL be bounded and SHALL say so when it was cut short. A trace's hop count reaches into the
hundreds, and one observed turn recorded 1226 hops. The bound SHALL NOT be raised to accommodate such a
turn: filtering and on-demand disclosure are the answer, since a read large enough for the worst turn is a
read that punishes every other one.

**Opening a trace SHALL always leave the loading state, whatever the read does.** A read that rejects rather
than returning a failed result — the service unreachable, the session gone — SHALL open the trace stating that
it could not be read, not leave a loading indicator in place of the view. **A loading indicator SHALL NOT be
shown over an already-opened trace**, since a loaded chain beneath one reads as a chain that never loaded.

**An enrichment that fails SHALL NOT discard a read that succeeded.** The decoded model outputs that type the
stream's rows are an enrichment of the hop read, not a part of it: where resolving them fails or throws, the
hops SHALL still render, with their model-call rows typed generically. Rejecting the whole read would tell the
reader the trace could not be read while its rows were already in hand.

#### Scenario: A rejected trace read still leaves the loading state

- **WHEN** the trace read rejects
- **THEN** no loading indicator remains
- **AND** the trace states that it could not be read

#### Scenario: Opening a turn's trace replaces the transcript in place

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's event stream renders in place of the transcript
- **AND** the trace states the turn it belongs to and its own trace id
- **AND** a control returns to the transcript

#### Scenario: A turn's figures are the same in the list and in its trace

- **WHEN** a turn's trace is opened from the turn list
- **THEN** the tokens, cost, hop count and duration stated above the hop chain equal those on its list row
- **AND** they do not change when the hop chain is clipped by its bound

#### Scenario: The shortcut attributes each message to its own turn

- **WHEN** the whole conversation is assembled from one entry hop's body
- **THEN** each message carries the trace id of the turn that produced it
- **AND** the newest turn's figures appear only beneath the newest turn's answer

#### Scenario: Hops render in the order they were recorded

- **WHEN** a turn records hops at different times
- **THEN** their rows render in ascending order of recorded time

#### Scenario: No hop states a duration

- **WHEN** the trace renders its hops
- **THEN** no hop shows a duration, a duration bar or an offset from the start of the trace
- **AND** each hop shows its own absolute recorded time

#### Scenario: A failed hop is typed by its failure

- **WHEN** a hop did not succeed
- **THEN** it is typed as an error rather than by its event kind
- **AND** its detail reports the same verdict as its row

#### Scenario: An MCP hop is named by the tool it called

- **WHEN** an MCP hop records a tool-call name
- **THEN** the hop is labelled by that tool
- **AND** the query that fetched it named the MCP method and tool-call columns

#### Scenario: An MCP hop with no tool call falls back to its method

- **WHEN** an MCP hop records a method but no tool-call name
- **THEN** the hop is labelled by that method

#### Scenario: A routing chain renders as a chain

- **WHEN** a hop records an execution path of an application followed by a model
- **THEN** the hop's detail shows that chain in that order

#### Scenario: Selecting a hop shows its detail

- **WHEN** a hop is selected
- **THEN** its category, status, recorded time, tokens, cost, endpoint, upstream, caller and HTTP status
  render beside the stream
- **AND** its MCP method, tool and routing chain render where recorded
- **AND** no raw request or response body value reaches the client

#### Scenario: Every row states its type in words

- **WHEN** the stream renders its rows
- **THEN** each row states its type as text rather than by colour alone

#### Scenario: A failed enrichment still renders the hops

- **WHEN** resolving the decoded model outputs throws
- **THEN** the hops that were read still render
- **AND** the view does not state that the trace could not be read

#### Scenario: The trace states no latency derived from hop durations

- **WHEN** the trace states its own figures
- **THEN** they include its token total, its cost, its hop count and its status
- **AND** no stated figure is derived from a hop's recorded duration

#### Scenario: A clipped hop list says so

- **WHEN** the hop read is bounded below the turn's recorded hop count
- **THEN** the view states that the list is partial

