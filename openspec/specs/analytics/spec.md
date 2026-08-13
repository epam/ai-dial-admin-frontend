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

Adding columns SHALL be available from the header via a form popup reusing the column-row editor, including its element-type control and disabled-Nullable behavior for Array-typed rows (see "Define and materialize a table schema"). Every live schema change SHALL be sent as a schema patch to `updateTableSchema` (`PATCH /v1/tables/{name}/schema`), and on success the detail view SHALL refresh from the server. Deleting the whole table SHALL be offered from this view's header (behind a confirmation identifying the table by name) as well as from the catalog list's row action menu; editing its catalog metadata (description/tag order) SHALL NOT be offered here and lives only in that row action menu (see "Tables catalog page").

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
- For an `ACTIVE` table, **Add rows** (inserting rows) and **Add columns** (schema evolution) SHALL be offered as items of a single header **Add** dropdown rather than two standalone buttons; **Add rows** SHALL be shown only when `canWrite`, **Add columns** only when `canModify`, and the dropdown itself SHALL NOT render when neither is available.
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Header actions SHALL be ordered **Manage access, Delete table, Add** (a not-yet-`ACTIVE` table shows **Save** in place of **Add** — see "Define and materialize a table schema").

Because the backend reports `permissions {false,false}` for system tables, the write/modify-gated affordances (Add rows, Add columns, per-column edit/drop, inline rename, description edits) hide for system tables without a separate check. **Manage access** and **Delete table** are gated on `FULL_ADMIN`, which the backend does not scope per-table, so each carries its own explicit `!table.system` check.

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

#### Scenario: Manage access is hidden for a system table even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail page
- **THEN** the "Manage access" button is absent

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission
- **THEN** the actions appear in the order Manage access, Delete table, Add (or Save when not `ACTIVE`)

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor, opened via the header **Add** dropdown's **Add rows** item. Opening the editor SHALL prefill it with a one-row JSON template whose keys are the table's declared columns' **physical source names** (not their exposed names, which the backend's row-insert endpoint does not accept), each mapped to a value matching that column's type (`0` for Integer/Long/Decimal, `false` for Boolean, `{}` for Object, `[]` for Array, `""` otherwise) rather than a bare empty array, so the example stays valid input for every column. For an **enrichment** table the template SHALL additionally include the grain key as a top-level field, since the backend requires it on every inserted row. The **Insert rows** submit action SHALL be disabled while the editor's content does not parse as a JSON array, re-enabling as soon as it does; submitting invalid or non-array input SHALL additionally surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

#### Scenario: Opening Add rows prefills a type-shaped template

- **WHEN** the user opens the Add rows editor for a table with declared columns
- **THEN** the editor is prefilled with one row object keyed by each column's physical source name, with type-appropriate placeholder values

#### Scenario: Add rows template keys a renamed column by its source name

- **WHEN** a column's exposed name differs from its physical source name and the user opens Add rows
- **THEN** the template key for that column is its source name, not its exposed name

#### Scenario: Enrichment template includes the grain key

- **WHEN** the user opens the Add rows editor for an enrichment table
- **THEN** the template includes the grain key as a top-level field alongside the declared columns

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

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (a single **Name** field, used as both the column's exposed name and its physical source name since the two are always equal at definition time, type, nullable, optional tag, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared column names, an optional partition (a temporal column + a day/month/year granularity), and an optional scan-metadata pair (`identity_column` and `version_column`); for an **enrichment**, its columns plus a grain key chosen from its source table's columns. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, and tag length exactly as the create/add-columns editor validates today, against both the exposed-name and source-name uniqueness constraints (which the merged Name field satisfies identically).

An Array-typed column row SHALL offer an additional element-type selector, restricted to the non-array, non-object column types (no nested arrays or objects). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column.

For a **source** table, the Partition column field's label SHALL carry an info affordance (an icon with a hover tooltip) explaining that only Date/Timestamp-typed columns are selectable, since that restriction is not otherwise visually obvious. The Granularity field SHALL be rendered only once a partition column is selected; deselecting the partition column (including indirectly, by retyping the selected column away from Date/Timestamp) SHALL also clear any chosen granularity.

For a **source** table only, the surface SHALL offer two additional optional selects — **Identity column** and **Version column** — the pair the governed incremental scan pages a source by. An **enrichment** SHALL offer neither (the backend rejects either member for an enrichment with 422). The Identity column options SHALL be the declared columns that are non-nullable and not sensitive; the Version column options SHALL be that same set narrowed to `Timestamp`-typed columns (`Date` SHALL NOT be offered — the backend requires `timestamp`). Both labels SHALL carry an info affordance, following the Partition column pattern, stating that the values are the caller's own promise the service cannot verify (the version is assigned at ingest, monotonic, and never backdated; the identity is unique per row) and that the choice cannot be changed once the table is materialized.

Because the scan requires **both** members and the backend accepts one alone — producing a table that is permanently unscannable, since `POST /v1/tables/{name}/schema` answers 409 once the table is `ACTIVE` and no `PATCH` member sets the pair — the surface SHALL treat the pair as all-or-nothing: while exactly one of the two is chosen, Save SHALL be disabled and the empty field SHALL show a validation message naming the other as required alongside it. Choosing neither SHALL be valid and SHALL leave the table unscannable, which is the correct declaration for a source whose row identity is its whole ordering key.

A selection SHALL be cleared when the column it references stops qualifying — renamed, removed, retyped, or flipped to nullable or sensitive in the column rows — so the submission can never carry a stale or now-invalid column name. For a `FAILED` table, both selects SHALL be seeded from the values the definition already stores, because an omitted member leaves any stored value unchanged rather than clearing it; when the definition stores either member, both selects SHALL be required (the pair cannot be cleared by re-posting).

Submitting the schema (a header **Save** action) SHALL send the whole document via `defineTableSchema` (`POST /v1/tables/{name}/schema`), which defines the schema **and** materializes the table in the same call — there is no separate save-draft step, and no way to persist an incomplete schema. The submitted payload SHALL carry `identity_column`/`version_column` only when chosen, and SHALL omit either key when unset. Save SHALL be disabled until the schema is complete for its kind (a source needs at least one valid column, a non-empty ordering key, and a complete-or-absent scan-metadata pair; an enrichment needs a grain key), since the backend rejects an incomplete submission (422) without persisting it. On success the view SHALL refresh showing the table `ACTIVE` with its live column surface. On a backend (ClickHouse) failure the table becomes `FAILED`; the detail view SHALL present the same schema-definition surface with an indication that activation failed, allowing the user to adjust the schema and resubmit. While the table is not `ACTIVE`, the write-rows action SHALL NOT be offered.

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

For a permitted caller the page SHALL prefetch the **result summary** server-side and pass it to the client
view as an initial-data prop. It MUST NOT prefetch the first page of rows: the grid fetches its own pages, so
a prefetched page would be discarded or duplicated. A prefetch failure SHALL be reported through the initial
state handed to the client view, since a server component cannot raise a toast.

The page SHALL depend on the `conversations` entity being registered and populated in the environment it runs
against. Where it is absent, the access guard still passes and the conversation query fails with HTTP 400; the
page SHALL surface that as a load failure rather than as an empty period.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and the page is requested
- **THEN** the page prefetches the result summary on the server and renders the client view with it
- **AND** the grid requests its first page of rows

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

The candidate query SHALL be aggregate mode over `rate_analytics` grouped by `chat_id`, carry the same time
bounds as the conversation query and an empty-id guard, and select `chat_id` plus `max(request_time)`. It SHALL
be ordered by most recent rating so that if the candidate set reaches its limit, the ids retained are those
most likely to survive the conversation query's own `last_request_time desc` ordering. Its limit SHALL NOT
exceed 1000, the service's hard maximum.

The candidate set SHALL be resolved once per filter state and reused across the pages of that result, rather
than re-queried per page: the narrowing is a property of the filter, not of the page.

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

#### Scenario: The default state costs one query per page

- **WHEN** the feedback filter is in its all state
- **THEN** only the conversation query is issued and it carries no `in` predicate

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

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the
values carry twelve fractional digits, and SHALL be rounded for display. That rounding is local to the summary
and does not settle how the Cost column renders.

When the summary request fails, the pills SHALL report that the figures are unavailable rather than rendering
zeros, which would assert an empty result that was never established.

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

#### Scenario: An unresolved rating is not counted as rated

- **WHEN** a row's rating could not be resolved
- **THEN** it counts toward neither the rated nor the negative pill

#### Scenario: A failed summary reports unavailability

- **WHEN** the summary request fails
- **THEN** the pills report the figures as unavailable rather than showing zeros

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

### Requirement: Read-only conversations grid

The conversations view SHALL render a grid of six visible columns — conversation, project, turns, activity,
tokens, cost — plus the Rating column. No column SHALL be sortable, and no column SHALL offer a filter control
of its own — neither a floating filter row nor a filter menu in the header. Per-column filtering stays off even
though the page itself has filters: the page's filters are query predicates over the whole result, whereas a
column filter narrows only the pages already fetched, and would report that narrowed view as the complete
answer. Ordering is fixed by the query, most recent last activity first.

The grid SHALL obtain its rows page by page from the backend and MUST NOT be handed a superset to narrow, and
no grid-level filter model SHALL be set from the page's filter state. While the first page of a new filter
state is in flight the view SHALL show a loading indicator, so the empty state cannot flash between a filter
change and its rows. When the result holds no rows the view SHALL render a no-data state rather than an empty
grid body.

The conversation column SHALL keep the full conversation id reachable when it is too long to display, since
real ids are not uniformly short and can run to hundreds of characters. Truncation MUST NOT be the only
presentation of the value.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

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

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group
- **AND** the conversation, project, turns, activity, tokens and cost columns are attributed to
  `conversations`, and the Rating column to `rate_analytics`

#### Scenario: No group claims an enrichment the page does not query

- **WHEN** the grid renders
- **THEN** no provenance group is labelled as enrichment-derived
- **AND** no group tooltip says its values are samples

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: Rows render from the fetched pages

- **WHEN** the grid has fetched a page of conversations
- **THEN** one grid row renders per conversation, most recent last activity first

#### Scenario: A long conversation id stays reachable

- **WHEN** a conversation id is too long to fit its column
- **THEN** the cell truncates it and the full value remains reachable

#### Scenario: Sorting is disabled

- **WHEN** a column header is clicked
- **THEN** the row order does not change and no sort indicator appears

#### Scenario: No filter control is reachable

- **WHEN** the grid renders
- **THEN** no floating filter row appears beneath the header row
- **AND** no column header offers a filter control, so no client-side filter can be applied

#### Scenario: Empty result renders the empty state

- **WHEN** the result holds zero conversations
- **THEN** the no-data content renders instead of an empty grid body

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** the first page of a new filter state is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown

### Requirement: Conversation list query over the conversations entity

The system SHALL provide `buildConversationListQuery({ range, search, chatIds, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `conversations`
in **row mode**. The conversation rollup is materialized by the analytics service — one row per `chat_id`,
produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored columns and MUST NOT
group or aggregate.

The select SHALL name exactly the columns the page renders, by their entity field names:

| Field | Renders as |
|---|---|
| `chat_id` | conversation |
| `project_id` | project |
| `turn_count` | turns |
| `total_tokens` | tokens |
| `total_price` | cost |
| `last_request_time` | activity (relative) |
| `first_request_time` | activity (span) |

`turn_count` is the pipeline's `count()` over usage-log rows for the conversation, which includes non-LLM
spans such as embedding, MCP and routing calls. It is therefore **not** a count of distinct request traces,
and user-facing copy MUST NOT claim it is. An exact turn count is not expressible in a rollup: a pipeline
measure is one aggregate function over one column with no `distinct` option.

The filter SHALL be `and[ ge(last_request_time, startMs), le(last_request_time, endMs) ]`. The time bounds
SHALL apply to `last_request_time`, so a selected period means *conversations whose last activity falls in the
period*. The query MUST NOT carry an empty-`chat_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates matching `chat_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only term
SHALL add no predicate at all rather than an `ico` against the empty string, which would match every row at
the cost of a scan. Both targets are base columns of the entity, so no select-alias restriction applies.

Search MUST NOT reach message content: no column of `conversations` carries it, and the only column that
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. The
search affordance SHALL name only the fields search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(chat_id, chatIds)`, which is how the
feedback filter narrows the result.

The sort SHALL be `[{ last_request_time, desc }, { chat_id, asc }]`. The trailing `chat_id asc` tiebreaker is
required even with no sorting UI: the service appends no implicit tiebreaker, so without it a paged result is
not stable across requests and a row could be skipped or repeated between pages.

The page SHALL be `{ type: 'offset', offset, limit, include_total: true }`. A limit above 1000 SHALL never be
sent — the service rejects it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema; `conversations` exposes no
`sensitive` column, so every selected field is visible to a read-only admin.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `conversations` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `chat_id`, `project_id`, `turn_count`, `total_tokens`, `total_price`,
  `last_request_time` and `first_request_time`

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

#### Scenario: A blank search term adds no predicate

- **WHEN** the query is built with an empty or whitespace-only search term
- **THEN** the filter carries only the time bounds

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built
- **THEN** the sort is `last_request_time` descending followed by `chat_id` ascending
- **AND** `chat_id` ascending is the final sort entry

#### Scenario: Search leaves the rest of the query untouched

- **WHEN** the query is built with a search term
- **THEN** its select, sort and page are identical to the same query built without one
- **AND** the time bounds are unchanged
- **AND** `having` is absent

### Requirement: Server-side paging with an exact result total

The conversations page SHALL fetch its rows one page at a time from the backend and SHALL request the result
total with `include_total: true`. The analytics service populates `totalCount` for row-mode queries only; the
entity is read in row mode, so the total is available and SHALL be used rather than inferred from the number
of rows returned.

The page SHALL reuse the application's existing server-paged grid mechanism and its shared page size rather
than introducing a second paging pattern. Successive pages SHALL be requested by advancing the query's
`offset` while every other part of the query — filter, sort, limit — stays identical, so paging cannot change
which conversations are in the result, only which slice of it is delivered.

The grid SHALL be told the total number of rows once it is known, so it stops requesting pages at the end of
the result instead of probing past it. A request for a page beyond the result SHALL yield no rows and SHALL
NOT be reported as a failure.

Any filter change SHALL discard the pages already fetched and restart from the first page: a filter change
produces a different result set, so an already-fetched page of the previous one is not a prefix of it.

Ratings SHALL be resolved for each page as it arrives, restricted to the conversations that page contains.

The result total SHALL never be presented as a lower bound. Because the total is exact, the summary MUST NOT
render an approximation marker such as a trailing "+", and MUST NOT hint that the figures understate the
result.

#### Scenario: The first page requests a total

- **WHEN** the page loads its first page of conversations
- **THEN** the query's offset page sets `include_total: true`
- **AND** the returned `totalCount` is used as the result total

#### Scenario: Scrolling fetches the next page unchanged but for its offset

- **WHEN** the operator scrolls past the rows already loaded
- **THEN** a further query is issued with a larger `offset`
- **AND** its filter, sort and limit are identical to the previous page's

#### Scenario: The grid stops at the end of the result

- **WHEN** the last page of the result has been delivered
- **THEN** the grid is told the total row count and issues no further page request

#### Scenario: A filter change restarts paging

- **WHEN** the operator changes the search term, the time period or the feedback state after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page of the new result

#### Scenario: Ratings follow each page

- **WHEN** a page of conversations arrives
- **THEN** the rating counts are resolved for exactly the conversations on that page
