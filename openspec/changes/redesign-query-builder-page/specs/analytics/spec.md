# Analytics — Query Builder page redesign (delta)

## REMOVED Requirements

### Requirement: Schema preview popup

**Reason**: The source selector moves to the page toolbar as a plain dropdown; the schema-preview affordance is removed from the page.

### Requirement: Projection field selection filtered by tag

**Reason**: Superseded — row-mode projection fields are now added through a categorized (tag-grouped) searchable dropdown, which replaces the tag-filter checkbox row over a checkbox grid.

### Requirement: Complex entities load a detailed schema

**Reason**: The analytics backend has no detailed-schema endpoint; the `complex`/`schemaIdField` flags, the detailed-schema API call, and the instance-id UI were a dead code path and are removed.

## MODIFIED Requirements

### Requirement: Query Builder layout and view switcher

The Query Builder page (`app/[lang]/query-builder/page.tsx`) SHALL render a page title, a toolbar, a main results area, and a query-builder rail on the right side of the content area. The toolbar SHALL contain the source (entity) selector, the shared time filter, and the Run action. The rail header SHALL offer three mutually exclusive views — **Builder** (form), **SQL**, and **JSON** — via a `DialSegmentedControl`; selecting a view SHALL change the rail body without a page reload and the current view SHALL be indicated. The view switcher SHALL NOT be shown before a schema is loaded. Base form controls SHALL come from the DIAL UI Kit and tabular results SHALL be displayed with the app's grid stack.

#### Scenario: Results-first layout renders

- **WHEN** the user opens `/query-builder`
- **THEN** a toolbar with source selector, time filter, and Run is shown
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

The Query Builder page SHALL prefetch the queryable entities on the server and the first entity's schema, passing `initialEntities`, `initialEntityName`, and `initialFields` to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, with default mode/filter/select/sort/page) from those props without a mount-time fetch. The toolbar SHALL show the entity selector. Changing the selected entity SHALL load its schema client-side via the `getEntitySchema` server action and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

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

### Requirement: Query mode and DISTINCT

In the Builder view the rail SHALL let the user choose the query mode — `row` (projection) or `aggregate` (group + metrics) — via a two-option `DialSegmentedControl` at the top of the view. Selecting `row` SHALL show the projection (Select) section and hide the aggregate sections; selecting `aggregate` SHALL show the Group by, Aggregate, and Having sections and hide the projection section. DISTINCT controls SHALL NOT be rendered (neither a query-level toggle nor per-aggregate checkboxes); the serializer's support for `distinct` remains for JSON-authored queries.

#### Scenario: Switching to aggregate mode swaps sections

- **WHEN** the user selects `aggregate` mode
- **THEN** the Group by, Aggregate, and Having sections are shown
- **AND** the projection (Select) section is hidden

#### Scenario: DISTINCT is not offered

- **WHEN** the user inspects the Builder view in either mode
- **THEN** no DISTINCT toggle or checkbox is present

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a WHERE tree limited to two levels: the root group holds conditions and groups, and nested groups hold only conditions. The "add nested group" action SHALL be offered only at the root group; nested groups SHALL offer only add-condition and remove actions. Each group SHALL expose a logical operator selector (AND / OR / NOT). Each condition SHALL expose a field selector (from the loaded schema, grouped by field category), an operator selector (`eq`, `ne`, `co`, `nc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups and fieldless conditions SHALL be omitted; a `not` group SHALL wrap its single child, or an `and` of its children. Deeper nesting SHALL be expressible only through the SQL view.

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

### Requirement: Row-mode projection

In `row` mode the Select section SHALL let the user add projection fields through a categorized searchable dropdown; added fields SHALL render as removable chips. Added fields SHALL serialize to `select` as field-expression output columns, in selection order. When no field is added, `select` SHALL be omitted (default projection).

#### Scenario: Selected fields become projection columns

- **WHEN** the user adds two fields in row mode
- **THEN** the serialized `select` contains a field-expression output column for each added field
- **AND** each added field is shown as a chip with a remove action

#### Scenario: No projection omits select

- **WHEN** no field is added in row mode
- **THEN** the serialized query has no `select` key

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

### Requirement: Run query and result

The toolbar Run action SHALL execute the current query and render the result in the main results area. In the Builder view the query is the serialized `StructuredQuery` from the builder state; in the JSON view it is the query as written in the editor — both executed via a server action delegating to `analyticsDataApi.executeAction` (`/v1/queries/execute`). The result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified. Before any run, the results area SHALL show an empty state inviting the user to run the query. An empty result SHALL show an empty-state message. A failed run SHALL surface an error via the app's notification convention and SHALL NOT replace a previously shown result with a broken grid. Run SHALL be disabled until a schema is loaded and while the JSON view contains invalid (unparseable) JSON.

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

### Requirement: SQL view shows only a SQL editor

In the SQL view the rail SHALL render a SQL code editor filling the rail body, and SHALL NOT render the Mode, Filter, Select, Group by, Aggregate, Having, Sort, or Page sections. The source selector remains available in the toolbar. The editor SHALL provide SQL syntax highlighting (via the Monaco `sql` language). The Copy and Run actions SHALL remain available; Copy SHALL copy the SQL editor text.

#### Scenario: SQL view hides the builder sections

- **WHEN** the user selects the SQL view
- **THEN** a SQL editor is shown in the rail
- **AND** none of the Mode, Filter, Select, aggregate, Sort, or Page sections are shown

#### Scenario: SQL text is highlighted

- **WHEN** the user types a SQL statement in the SQL editor
- **THEN** the statement is rendered with SQL syntax highlighting

### Requirement: SQL view state is an independent buffer

The Query Builder SHALL keep the SQL editor text as its own buffer. Entering the SQL view SHALL seed the editor with SQL generated from the current builder query (including the toolbar time bound and the implicit count) when the buffer is empty or still matches the last generated text; user-edited SQL SHALL never be overwritten by generation. The SQL text SHALL NEVER be parsed back into the builder form state. Switching between the SQL and JSON views SHALL NOT prompt and SHALL leave both buffers intact.

#### Scenario: Entering SQL compiles the builder query

- **WHEN** the user opens the SQL view without prior SQL edits
- **THEN** the editor is pre-filled with a SQL statement generated from the current builder query

#### Scenario: SQL text persists across written-mode switches

- **WHEN** the user edits SQL, switches to the JSON view, and switches back to the SQL view
- **THEN** the SQL editor shows the previously edited text unchanged

### Requirement: Switching from a written mode to the Builder is guarded

SQL and JSON are "written" modes: they can hold queries the visual builder cannot display (edited SQL text; JSON with e.g. filter nesting deeper than two levels). When the user switches from a written mode to the Builder view while the current written query cannot be shown in the builder (SQL: buffer edited away from the last generated text; JSON: valid but unrepresentable query), a confirmation popup (danger variant) SHALL warn that switching will drop the current query and reset the builder to its starting point. Confirming SHALL discard the written query (clear the SQL buffer / discard the JSON edits), reset the builder state to its initial defaults for the selected entity, and switch to the Builder view. Cancelling SHALL keep the user in the written mode with the query intact. Switching to the Builder SHALL NOT prompt when nothing would be lost (empty or unedited generated SQL; JSON that round-trips into the builder).

#### Scenario: Leaving SQL with edits asks for confirmation

- **WHEN** the user edits SQL and selects the Builder view
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

### Requirement: Aggregate-mode group by, time buckets, and metrics

In `aggregate` mode the builder SHALL provide a single Group by section combining plain columns and scalar-function entries, and an Aggregate section for metrics. The Group by add-dropdown SHALL offer the schema columns (categorized) plus a Functions group with the service's scalar allowlist: `date_bin`, `lower`, `upper`, `length`, `trim`, `abs`. Picking a column SHALL add it as a removable chip; picking a function SHALL add a parameterized row — `date_bin` with an amount, a unit (`second`, `minute`, `hour`, `day`, `week`), a source timestamp/date field, and an alias; every other function with a field and an alias. There SHALL be no separate Time bucket section. Aggregate metrics keep a function (`count`, `sum`, `avg`, `min`, `max`), an optional field argument, and an alias. The serialized query SHALL place plain group-by field projections, aliased scalar-function columns, and aliased aggregate columns into `select`, and SHALL list plain group-by fields by name and function entries by alias in `group_by` (function entries without a field or alias are excluded from `group_by`).

#### Scenario: Aggregate select and group_by are built

- **WHEN** the user adds a group-by column and a `sum` aggregate over a field with alias `total`
- **THEN** `select` includes the group-by field column and a `sum` function column aliased `total`
- **AND** `group_by` includes the group-by field

#### Scenario: date_bin function entry becomes a bucket column

- **WHEN** the user picks `date_bin` from the Group by Functions group with 5 minutes over a timestamp field and alias `bucket`
- **THEN** `select` includes a `date_bin` function column aliased `bucket`
- **AND** `group_by` includes `bucket`

#### Scenario: Scalar function entry serializes with its alias

- **WHEN** the user picks `lower` over a string field with alias `dep`
- **THEN** `select` includes a `lower` function column aliased `dep`
- **AND** `group_by` includes `dep`

#### Scenario: Scalar-function select entries parse back into Group by

- **WHEN** a JSON query's `select` holds a scalar-function column from the allowlist
- **THEN** switching views shows it as a Group by function row, not an aggregate

### Requirement: Sort keys

The Sort section SHALL let the user add, edit, and remove sort keys, each with a field, a direction (`asc` / `desc`), and an optional nulls ordering (default / nulls first / nulls last). The nulls select trigger SHALL carry a dimmed "Nulls:" prefix so its role is readable next to the direction select. In `row` mode the field options SHALL be the schema fields; in `aggregate` mode they SHALL be the aggregate output names (group-by columns, function-entry aliases, aggregate aliases). Fieldless sort keys SHALL be omitted, and `sort` SHALL be omitted entirely when no valid key remains; the nulls ordering SHALL be omitted when left at default.

#### Scenario: Sort key serializes

- **WHEN** the user adds a sort key on a field with direction `desc`
- **THEN** the serialized `sort` contains an item with that field and `dir: "desc"`

#### Scenario: Nulls control names itself

- **WHEN** the user inspects a sort key row
- **THEN** the nulls select shows a "Nulls:" prefix before the selected value

### Requirement: Aggregate validation warnings

While in `aggregate` mode the builder SHALL surface non-blocking warnings when: any aggregate lacks an alias; any Group by function entry lacks a source field or an alias; or the query has no group-by entries or aggregates. The warnings SHALL clear when resolved and SHALL NOT prevent running the query.

#### Scenario: Missing aggregate alias warns

- **WHEN** in aggregate mode an aggregate has no alias
- **THEN** a warning states that every aggregate needs an alias

#### Scenario: Missing function alias warns

- **WHEN** a Group by function entry has a field but no alias
- **THEN** a warning states that every group-by function needs an alias

#### Scenario: Warnings clear when resolved

- **WHEN** the aggregate gains an alias
- **THEN** the corresponding warning is no longer shown

## ADDED Requirements

### Requirement: Query Builder toolbar

The Query Builder page SHALL render an in-page toolbar containing, left to right: the source (entity) selector as a plain dropdown (`DialSelectField`, no schema-preview affordance), the shared time filter (`TimeFilter` with the global preset options and a custom-range picker), and the Run primary action aligned to the right.

#### Scenario: Toolbar composition

- **WHEN** the user opens the page with entities loaded
- **THEN** the toolbar shows the source dropdown, the time filter, and the Run action

### Requirement: Time range is part of the structured query

The toolbar time filter SHALL be a query control: its resolved range SHALL serialize into the structured query's filter as `ge`/`le` predicates on the source's automatically detected timestamp field (the first temporal-typed field of the loaded schema). The serialized query — as shown in the JSON view, copied by the Copy action, and executed by Run — SHALL include these predicates; nothing is added invisibly at execution time. The time predicates SHALL NOT be shown in the visual Filters tree — the toolbar control is their editor. When parsing JSON back into builder state, a matching `ge` + `le` predicate pair on the timestamp field SHALL be lifted into the toolbar control (displayed as a custom range); time conditions in any other shape or on other fields SHALL remain ordinary filter conditions. When the schema has no temporal field, no time predicates SHALL be serialized and the query runs without a time bound. SQL text SHALL never be modified by the time filter.

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

Each Builder-view section (Group by, Aggregates, Select, Filters, Having, Sort, Page) SHALL render as a bordered section block with a labeled header and a header-level add action where applicable. Field pickers SHALL be searchable dropdowns whose options are grouped by the field's schema tag/category (untagged fields under a default group). Category groups SHALL be collapsible headers showing the group's option count, with at most one category expanded at a time (accordion); the group holding the current selection SHALL start expanded, and an active search term SHALL show all matches regardless of collapse state. Category header colors SHALL cycle the full builder palette. The dropdown's search input SHALL use the same compact boxed style as the builder's other controls. Added items SHALL render compactly — chips for plain fields, collapsible rows for parameterized items (group-by functions, aggregates, conditions, having rows, sort keys) that expand into their editor and collapse back to a summary chip tinted with the owning section's palette color. Styling SHALL use the project's palette/theme tokens only.

#### Scenario: Field dropdown groups by category

- **WHEN** the user opens a field dropdown in a builder section
- **THEN** the fields are grouped under collapsible category headers with option counts
- **AND** expanding one category collapses the previously expanded one
- **AND** typing in the search shows all matching fields across categories

#### Scenario: Parameterized item collapses to a summary

- **WHEN** the user collapses an aggregate or filter-condition row
- **THEN** the row shows a compact summary of its configuration in its section's color
- **AND** expanding it restores the full editor

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

The results area SHALL offer a Table ⇄ Chart switcher. The Table view SHALL render the result grid. The Chart view SHALL render the result with ECharts and offer: a chart-type control (bar, line, area), an X-axis selector over the executed query's group-by/bucket columns, and a Y-axis selector over its aggregate columns (including the count column when present); sensible defaults SHALL be preselected (first dimension, first aggregate). The Chart view SHALL be available only when the shown result came from an aggregate-mode structured run with at least one group-by or bucket column; otherwise the Chart view SHALL show a hint that charts require an aggregate result with a group-by. When every X value is numeric or date-like, the chart SHALL order the points along the X axis by that natural order (chronological/numeric ascending) regardless of the query's row order; mixed or plain-text X values keep row order. Long X-axis labels SHALL be truncated to a fixed label width with the full value available in the tooltip. Chart colors SHALL come from the shared chart color tokens.

#### Scenario: Chart renders for an aggregate result

- **WHEN** the shown result came from an aggregate run grouped by one field and the user selects the Chart view
- **THEN** a chart renders with the group-by column on X and an aggregate column on Y
- **AND** the user can switch between bar, line, and area types

#### Scenario: Comparable X values are ordered on the axis

- **WHEN** a top-N-by-count aggregate result has time-bucket X values and the user opens the Chart view
- **THEN** the chart shows the buckets in chronological order along the X axis
- **AND** the table keeps the query's row order

#### Scenario: Chart hint for non-aggregate results

- **WHEN** the shown result came from a row-mode or SQL run and the user selects the Chart view
- **THEN** a hint explains that charts require an aggregate result with a group-by
