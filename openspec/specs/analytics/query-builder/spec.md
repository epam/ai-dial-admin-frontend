# Analytics Query Builder

## Purpose

How a query is authored: the rail's four mutually exclusive views — Form, JSON, SQL and AI — the builder controls behind the Form view, and the guarded transitions between them. Running a query and reading its result is `analytics/query-viewer`.

## Requirements

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

The query page SHALL prefetch, on the server, the queryable entities, the function catalog, the stored saved query, and the schema of that query's primary source, passing them to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, and the mode/filter/select/sort/page the stored query specifies) from those props without a mount-time fetch. The toolbar SHALL show the entity selector, holding the primary source. Changing the selected entity SHALL load its schema client-side via the `getEntitySchema` server action and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list, the stored query, and that query's primary-source schema
- **THEN** the builder renders with the primary source selected, its fields available, and the stored query reflected
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

Field options SHALL display the field's **display name** — the schema `display_name` when set, otherwise the field `name` — as primary text, the field type right-aligned, and the schema `description` as a secondary line when present; fields without display name and description SHALL render as a single line. The dropdown overlay width SHALL stay bounded: long descriptions truncate to one line and the full text is reachable via a hover tooltip of reasonable width. The dropdown search SHALL match against both the field name and its display name. Added items SHALL render compactly — chips for plain fields, collapsible rows for parameterized items (group-by functions, row-mode select functions, aggregates, conditions, having rows, sort keys) that expand into their editor and collapse back to a summary chip tinted with the owning section's palette color — and chips and collapsed summaries SHALL refer to fields by their display name. Display names are presentation-only: structured-query serialization, the JSON view, and the SQL view SHALL always use the raw field `name`. Styling SHALL use the project's palette/theme tokens only. A field whose schema `sensitive` flag is true SHALL show a sensitive marker (a colored dot with a "Sensitive" tooltip) in its dropdown option, after the display name.

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

The Query Builder SHALL source the set of functions it offers — in `aggregate` mode's Group by and Aggregate sections, in the `row`-mode Select projection, and as the left operand of a Filter condition — exclusively from the backend function catalog `GET /v1/queries/functions`, fetched on the server when the query-builder page loads and seeded into the builder. The frontend SHALL NOT hardcode any function name, group, argument shape, allowed literal values, numeric bound, distinct support, return type, or hint text: every such property SHALL be read from the served catalog entry. Each catalog entry provides the function `name`, `group` (`scalar`, `aggregate`, or `ordered_set_aggregate`), a `signature`, a `returns` type, a `distinct_supported` flag, a `description`, and an ordered `args` list; each argument provides its `name`, its `kind` (`expression`, `integer_literal`, `numeric_literal`, or `string_literal`), an `optional` flag, and — when applicable — `constraints` with `allowed_values` and/or `min`/`max`.

There SHALL be no local fallback catalog. When the catalog fetch fails or returns an empty list, no functions SHALL be offered: the Functions group of the Group by, row-mode Select, and Filter-condition dropdowns SHALL be empty and the Aggregate section SHALL offer no metric functions, while plain-column querying (the `row`-mode projection, plain group-by columns in `aggregate` mode, and conditions over a schema column) SHALL remain fully functional.

Every enum and function picker in the rail (operator, value type, nulls, sort direction, aggregate function) SHALL mark its current option the same way as the field dropdowns — a check mark beside the label plus the accent tint. Every function picker — the Aggregate section's selector and the Functions group of the Group by, row-mode Select, and Filter-condition dropdowns — SHALL name a function from the served catalog and SHALL expose its catalog `description` as a hover tooltip. The name SHALL be derived from the served data, never from a per-function table in the frontend: catalog descriptions open by naming the function ("Average of a numeric expression over the group; …", "Row count; with an argument …", "Continuous percentile: …"), so the label SHALL be that leading phrase, cut at the first clause break or the "<name> of/for …" and "<name> (…)" patterns. A description that instead opens with prose ("Lowercases a text expression."), or a function with no description, SHALL fall back to the function's own name made readable (`percentile_cont` → "Percentile cont"). A function with no description SHALL render without a tooltip.

#### Scenario: Functions offered come from the served catalog

- **WHEN** the query-builder page loads and the function catalog lists `date_bin`, `width_bucket`, `lower`, `count`, `sum`, and `percentile_cont`
- **THEN** the Group by Functions group offers the `scalar` functions (`date_bin`, `width_bucket`, `lower`) and the Aggregate section offers the `aggregate` / `ordered_set_aggregate` functions (`count`, `sum`, `percentile_cont`)
- **AND** the row-mode Select dropdown and a Filter condition's operand dropdown offer that same `scalar` set

#### Scenario: New backend functions appear with no frontend change

- **WHEN** the catalog advertises a function the frontend has never named (e.g. `width_bucket`, `percentile_cont`, `percentile_disc`)
- **THEN** it is offered in the appropriate section with an argument editor built from its catalog `args`, without any function-specific frontend code

#### Scenario: Absent catalog degrades to plain columns

- **WHEN** the function catalog fails to load or is empty
- **THEN** the Group by, row-mode Select, and Filter-condition dropdowns offer only schema columns, and the Aggregate section offers no metric functions
- **AND** the row-mode projection, plain group-by columns, and conditions over a schema column still build and run

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

The Filter section SHALL let the user build a WHERE tree limited to two levels: the root group holds conditions and groups, and nested groups hold only conditions. The "add nested group" action SHALL be offered only at the root group; nested groups SHALL offer only add-condition and remove actions. Each group SHALL expose a logical operator selector (AND / OR / NOT). Each condition SHALL expose a left-operand selector, an operator selector (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. The left operand SHALL be either a schema column or a call to a `scalar` catalog function: the operand dropdown SHALL offer the loaded schema's fields grouped by field category and, in the same Functions group the Group by dropdown carries, the catalog's scalar functions. The functions offered here SHALL exclude those whose catalog return type is `array`: the service accepts an array result as a projected column but rejects it as an operand, and it rejects the whole query for one bad predicate, so such a condition would take every other one down with it. The exclusion SHALL key on the served return type, never on a list of names. Choosing a function SHALL expand the condition into one argument editor per catalog argument — built from the catalog exactly as a group-by function row's editors are — and the condition's collapsed summary SHALL read the call with its arguments in place of a column name. A function operand SHALL serialize as the predicate's left `fn` expression. The condition's default value type, and the operator-withholding rule below, SHALL follow the operand's **resolved type**: a column's schema type, or a function's catalog return type — resolved, for a function whose return type is declared as its argument's own, from the schema type of its first expression argument's field. Each operator SHALL be shown by its full name (Equals, Not equals, Contains, Does not contain, Less than, Greater than, Less than or equal, Greater than or equal, In list) — in the selector's open list, in its collapsed trigger, and in the condition's collapsed row summary — with no short code shown anywhere, and each option SHALL expose a hover tooltip describing the operator. The two case-insensitive contains operators SHALL be named Contains / Does not contain while serializing to `ico`/`inc` (SQL ILIKE); their tooltips SHALL state that matching is case-insensitive. The case-sensitive `co`/`nc` SHALL NOT be offered as authoring options but SHALL remain valid model values that serialize, deserialize, and round-trip without error when present in a JSON-authored or backend-translated query. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups, conditions with no left operand, and function conditions whose required catalog arguments are not all filled SHALL be omitted; a condition omitted for an unfilled function argument SHALL raise a warning on the Filter section header, because the query then runs without that predicate and returns more rows than were asked for with nothing else on screen saying so; a `not` group SHALL wrap its single child, or an `and` of its children. Deeper nesting SHALL be expressible only through the SQL view.

The two contains operators SHALL be **withheld** when the condition's left operand resolves to the schema's
**enum** type — a column the schema types enum, or a function whose resolved return type is that column's. ClickHouse defines comparison over an enum but not the string functions, so the service refuses the
LIKE-based operators on an enum field — and it rejects the **whole** query for one bad predicate, so a single
such condition takes the entire result down rather than degrading it. The remaining operators (`eq`, `ne`, the
four magnitude comparisons, and `in`) SHALL stay offered, since comparison, equality, membership, grouping and
sorting all work over an enum. The withholding SHALL key on the **resolved operand type alone**: no list in the
frontend names which fields are enums, so a field an instance begins reporting as an enum is guarded with no
change here. A condition that already carries a contains operator when its left operand is changed to an
enum-typed one SHALL be moved to a supported operator rather than left serializing a predicate the service will
reject.

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

#### Scenario: Contains is withheld on an enum-typed field

- **WHEN** a condition's left operand is a column the schema types enum and the user opens its operator selector
- **THEN** Contains and Does not contain are not offered
- **AND** Equals, Not equals, the magnitude comparisons and In list remain offered

#### Scenario: Switching a contains condition to an enum field leaves a valid operator

- **WHEN** a condition carrying Contains has its left operand changed to an enum-typed column
- **THEN** the condition's operator is no longer Contains
- **AND** the serialized query carries no LIKE-based predicate over that field

#### Scenario: A function left operand serializes as an fn expression

- **WHEN** a condition's left operand is the scalar function `json_extract_string` over a JSON column with the key `baggage`, its operator is Contains, and its value is a token
- **THEN** the serialized predicate's first argument is an `fn` expression naming that function, with the column as a field argument and the key as a string value argument
- **AND** the condition's collapsed summary reads the call and its arguments rather than a column name

#### Scenario: An incomplete function condition is omitted, and says so

- **WHEN** a condition's left operand is a function whose required arguments are not all filled
- **THEN** that condition contributes no predicate to the serialized filter
- **AND** the rest of the filter tree still serializes
- **AND** the Filter section header shows a warning that the condition is left out

#### Scenario: An array-returning function is not offered as an operand

- **WHEN** the catalog serves a scalar function whose return type is `array` and the user opens a condition's operand dropdown
- **THEN** that function is not among the Functions group's options
- **AND** it is still offered in the row-mode Select dropdown, where its result is projected rather than compared

#### Scenario: The value type follows the function's return type

- **WHEN** the user picks a scalar function returning an integer as a condition's left operand
- **THEN** the condition's value type defaults to the integer type rather than to string

#### Scenario: A JSON-authored function predicate round-trips

- **WHEN** a query authored in the JSON view carries a predicate whose left operand is an `fn` expression naming a served catalog function
- **THEN** the Builder view shows that condition with the function selected and its arguments filled
- **AND** serializing the builder state reproduces the same predicate

### Requirement: Row-mode projection

In `row` mode the Select section SHALL let the user build the projection from two kinds of entry, both added through the section's one categorized searchable dropdown: **schema columns**, offered in multi-select mode and rendered as removable chips, and **`scalar` catalog functions**, offered in the dropdown's Functions group and rendered as collapsible rows carrying one argument editor per catalog argument plus an alias input — the same controls, built the same way from the catalog, as a Group by function row. Entries SHALL serialize to `select` in the order they were added: a column as a field-expression output column, a function as its `fn` expression under its effective alias. A function entry's alias SHALL be prefilled from its function and arguments, rederived while the user has not edited it, kept unique against the query's other output names, and fall back to the derived value when blank — exactly as a computed row's alias does in `aggregate` mode, and for the same reason: it is that output column's only name. A function entry whose required catalog arguments are not all filled SHALL contribute no output column, and SHALL raise a warning on the Select section header so the omission is not silent. When no entry is added, `select` SHALL be omitted (default projection).

#### Scenario: Selected fields become projection columns

- **WHEN** the user adds two fields in row mode
- **THEN** the serialized `select` contains a field-expression output column for each added field
- **AND** each added field is shown as a chip with a remove action

#### Scenario: No projection omits select

- **WHEN** no entry is added in row mode
- **THEN** the serialized query has no `select` key

#### Scenario: A scalar function becomes an aliased projection column

- **WHEN** the user picks `json_extract_string` from the row-mode Select dropdown's Functions group and fills its arguments with a JSON column and a key
- **THEN** the section shows a collapsible row with an editor per catalog argument and a prefilled alias
- **AND** the serialized `select` carries that call as an `fn` expression under that alias

#### Scenario: An incomplete function entry is not projected, and says so

- **WHEN** a row-mode function entry has an unfilled required argument
- **THEN** the serialized `select` carries no column for it
- **AND** the other entries are still projected
- **AND** the Select section header shows a warning that the column is left out

#### Scenario: A JSON-authored function column round-trips

- **WHEN** a `row`-mode query authored in the JSON view carries a `select` entry whose expression is an `fn` naming a served catalog function
- **THEN** the Builder view shows that entry with its function and arguments filled and its authored alias kept
- **AND** serializing the builder state reproduces the same output column

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

The Sort section SHALL let the user add, edit, and remove sort keys, each with a field, a direction (`asc` / `desc`), and an optional nulls ordering (default / nulls first / nulls last). The direction selector SHALL show full names (Ascending / Descending) in its open list, its collapsed trigger, and the sort row's collapsed summary; the nulls select trigger SHALL carry a dimmed "Nulls:" prefix so its role is readable next to the direction select. In `row` mode the field options SHALL be the schema fields plus the **effective** alias of every function entry in the projection — a row-mode select alias is one of the query's output names and the service accepts it as a sort key; in `aggregate` mode they SHALL be the aggregate output names: group-by columns, plus every computed row named by its **effective** alias — the row's alias, or the derived alias the serializer would fall back to when it is blank — so a computed column is offered even when its alias is empty (a query parsed from JSON, SQL, or the assistant, or an alias the user cleared). When the query defines no aggregates of its own, the implicit count column SHALL be offered too, since it is one of the query's output columns. Fieldless sort keys SHALL be omitted, and `sort` SHALL be omitted entirely when no valid key remains; the nulls ordering SHALL be omitted when left at default.

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

#### Scenario: A row-mode function column is sortable by its alias

- **WHEN** a row-mode projection carries a scalar-function entry and the user opens a sort key's field dropdown
- **THEN** that entry's effective alias is offered as a sort field
- **AND** picking it serializes a sort item naming that alias

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

### Requirement: Backend-authoritative query translation

The Query Builder SHALL treat the Analytics data-access service as the single source of truth for translating between the structured query DSL and SQL, via two validation-only endpoints that never run against ClickHouse. The server API layer SHALL expose `translateAction(query)` for `POST /v1/queries/translate` (DSL → SQL, success body `{ "sql": <text> }`) and `translateSqlAction(sql)` for `POST /v1/queries/translate-sql` (SQL → DSL, success body `{ "query": <StructuredQuery> }`), each returning a `ServerActionResponse` envelope and reached through a server action injecting the user token. The frontend SHALL NOT generate SQL from the structured query on the client; the client-side generator is removed. When the backend rejects a translation with a `400` (a DSL the SQL subset cannot express, or SQL that is unparseable or uses an unsupported construct), the failure SHALL be handled per the consuming requirement (SQL-view seeding surfaces the error; the Builder switch falls back to the discard guard; a SQL run falls back to classifying its result columns from the returned rows) and SHALL NOT be presented as a successful translation.

Running a query from the SQL view SHALL translate the SQL alongside executing it, so the result can be described in the same terms as a structured run. The translation SHALL NOT delay or gate the result: a rejected translation SHALL neither fail the run, surface an error, nor discard the returned rows. A run that has already translated its SQL for another purpose SHALL reuse that translation rather than requesting it again.

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

#### Scenario: A SQL run translates and executes together

- **WHEN** the user runs a query from the SQL view
- **THEN** the SQL is sent to both the execute-SQL endpoint and the translation endpoint
- **AND** a rejected translation leaves the executed result shown without an error notification

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

Leaving the SQL view for the **JSON** view is guarded the same way, by the same translation and the same popup — see "Switching from the SQL view to JSON translates the SQL buffer". The two switches differ only in where a successful translation lands: the Builder switch requires a builder-representable body, while the JSON switch shows any translated body.

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
- **THEN** the view switches to the view that was requested
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

### Requirement: Switching from the SQL view to JSON translates the SQL buffer

The JSON view SHALL show the query the user actually authored, never a body derived from builder state the SQL was never hydrated into. When the user leaves the SQL view for the JSON view with an **edited** SQL buffer, that SQL SHALL be translated through `POST /v1/queries/translate-sql` — the same endpoint and the same failure semantics as the Builder switch.

On a successful translation the JSON view SHALL show the translated body and the SQL buffer SHALL be cleared, so the body on screen is the body a save would persist. A translated body the visual builder can represent SHALL additionally hydrate the builder; one it cannot SHALL leave the JSON buffer marked as diverged, so a later switch to the Builder still goes through the written-mode guard.

On a rejected translation — a composite statement (a join, a CTE, a derived table, or a subquery), or any SQL the DSL cannot express — the same danger confirmation popup used for the Builder switch SHALL be shown. Confirming SHALL discard the SQL, reset the builder to its defaults for the selected source, and open the JSON view on that default body rather than on an empty buffer. Cancelling SHALL leave the user in the SQL view with the text unchanged.

The popup SHALL describe the switch the user actually asked for. Its header is shared, but its description SHALL name the destination: the Builder switch SHALL state that the query cannot be shown in the visual builder, while the JSON switch SHALL state that the SQL could not be translated into a structured query — the JSON view can display any structured body, so the failure there is the translation, not the display. Neither description SHALL name the construct the DSL lacks.

An empty or unedited generated SQL buffer SHALL NOT be translated: the JSON view SHALL be filled from the current builder state, as it is when entering JSON from the Builder view.

#### Scenario: Translatable SQL is shown as its translated body

- **WHEN** the user edits SQL that the service translates and selects the JSON view
- **THEN** the JSON view shows the translated body
- **AND** the SQL buffer is cleared
- **AND** no confirmation is shown

#### Scenario: A translated body the builder cannot hold stays diverged

- **WHEN** the edited SQL translates to a query the visual builder cannot represent and the user selects the JSON view
- **THEN** the JSON view shows that body
- **AND** switching from there to the Builder view goes through the written-mode confirmation

#### Scenario: A composite statement asks for confirmation

- **WHEN** the user edits SQL that joins two entities, which the service refuses to translate, and selects the JSON view
- **THEN** a confirmation popup warns that the current query will be dropped
- **AND** its description states that the SQL could not be translated into a structured query, not that it cannot be shown in the visual builder
- **AND** the JSON view is not shown while the popup is open

#### Scenario: The Builder switch keeps its own wording

- **WHEN** the same untranslatable SQL is switched to the Builder view instead
- **THEN** the popup description states that the query cannot be shown in the visual builder

#### Scenario: Confirming opens JSON on the default body

- **WHEN** that confirmation is shown and the user confirms
- **THEN** the JSON view is shown holding the default body for the selected source
- **AND** the SQL buffer is discarded

#### Scenario: Cancelling keeps the SQL view

- **WHEN** that confirmation is shown and the user cancels
- **THEN** the SQL view stays open with its text unchanged

#### Scenario: Unedited SQL is not translated

- **WHEN** the SQL buffer is empty, or holds SQL the page generated from the builder and the user has not edited, and the user selects the JSON view
- **THEN** no translation request is sent
- **AND** the JSON view shows the body derived from the current builder state

### Requirement: A query the visual builder cannot hold stays in the written views

The Builder view SHALL never silently drop part of a query. Builder-representability SHALL therefore
cover every expression the builder would have to hold, not only the shape of the filter tree. Beyond
the existing two-level nesting rule, a structured query SHALL be treated as representable only when:

- every `fn` expression in a position the builder edits — a `select` entry in either mode, and the
  left operand of a `filter` or `having` predicate — names a function the served catalog lists;
- each such call carries no argument beyond the ones its catalog entry declares (a variadic call
  carries more, and the builder has exactly one slot per declared argument); and
- each argument is of the kind its position expects — a field reference for an `expression`
  argument, a literal for a literal one — because those are the only forms the argument editor
  produces and therefore the only ones it can show back.
- a predicate's right operand is a literal value or an array of them, the only right-hand shape the
  condition editor produces.

A query failing any of these SHALL be handled exactly as filter nesting deeper than two levels
already is: it stays in the written view, fully editable and runnable, a non-blocking message states
that it cannot be shown in the visual builder, the builder state SHALL NOT be updated from it —
including when a stored query is opened, where the builder SHALL start from its defaults rather than
from a partial parse — and switching to the Builder view SHALL go through the written-mode
confirmation. An empty or failed catalog therefore makes every function-bearing query unrepresentable
rather than stripping its functions.

This widens what opens in the written views. A query passing a constant where the catalog declares an
`expression` argument, or a JSON path of several keys through a variadic argument, previously opened
in the Builder with that argument blanked; it now opens in the JSON view intact. That is the point:
the builder has no editor for either, so showing them was showing something the query did not say.

#### Scenario: A query using an unserved function stays in the written view

- **WHEN** the JSON view holds a valid query whose filter predicate calls a function the served catalog does not list
- **THEN** the informational message states the query cannot be shown in the visual builder
- **AND** Run stays enabled and executes the query as written
- **AND** the builder state is not updated from it

#### Scenario: A call carrying more arguments than the catalog declares stays in the written view

- **WHEN** a query calls a served function with an extra argument beyond the ones its catalog entry declares
- **THEN** the query is not builder-representable and is not hydrated with the extra argument dropped

#### Scenario: A literal where the catalog declares an expression stays in the written view

- **WHEN** a query passes a constant to an argument the catalog declares as an `expression`
- **THEN** the query is not builder-representable and is not hydrated with that argument blank

#### Scenario: A stored query the builder cannot hold does not seed builder state

- **WHEN** a saved query whose body the builder cannot represent is opened
- **THEN** it opens in the JSON view showing that body
- **AND** the builder rail holds its defaults rather than a partial parse of the body

#### Scenario: A served function is representable

- **WHEN** the same query calls a function the catalog does list, in a position the builder edits, with arguments of the declared kinds
- **THEN** the query is representable and hydrates into the Builder view with that call intact

### Requirement: The SQL editor reads the selected source from the builder context

Every part of the query builder that needs the selected entity, its fields, or the served function
catalog SHALL read them from the shared query-builder context rather than receive them as props, so a
single value decides which source is in play. This SHALL include the SQL editor's schema-aware
autocomplete. The AI panel SHALL NOT be among them: it sends no source information, so it reads no
source at all and the toolbar selection SHALL NOT change what it sends.

#### Scenario: SQL autocomplete follows the selected source

- **WHEN** the user selects a different source and opens the SQL view
- **THEN** the editor's completions offer that source's fields

#### Scenario: The assistant request is independent of the selected source

- **WHEN** the user selects a different source and sends a request to the assistant
- **THEN** the messages sent are unchanged by that selection

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

### Requirement: Generate sends the transcript and shows the proposed query

Activating Send SHALL append the user's request as a new message in the visible transcript and call
the `generateQuery` server action with the accumulated transcript — the user and assistant turns and
nothing else — which posts to the configured deployment's chat-completions endpoint on DIAL Core
(`QueryAssistantApi`, reusing `DIAL_CORE_API_URL` and Bearer auth). The admin console SHALL NOT add a
message of its own to the request: the assistant deployment owns its system prompt and resolves any
schema it needs through its own tools. Because the console sends no schema, no row data and no value
read out of the queried store can reach the assistant deployment by construction.

On success the assistant's reply SHALL be appended as a new message in the transcript, rendered as-is
(no SQL extraction applied to the rendered text). When the reply contains an extractable SQL block, that
message additionally renders the extracted SQL read-only with its own Copy and Run actions (see "Each
assistant message with extracted SQL offers inline Run and Copy"). On failure the system SHALL surface an
error notification (header, message, and request id when available); the just-sent user message SHALL
remain visible in the transcript and no assistant message SHALL be appended, so the user can retry or
continue the conversation without losing what they asked.

#### Scenario: Successful generation appends to the transcript

- **WHEN** the user submits a request and the assistant returns a reply
- **THEN** the user's request and the assistant's reply both appear as new messages in the transcript

#### Scenario: The request carries the transcript and nothing else

- **WHEN** the user submits a request
- **THEN** the messages sent are exactly the visible transcript, beginning with its first turn and ending
  with the user's request
- **AND** no system message is present

#### Scenario: No schema and no row data are sent

- **WHEN** any request is sent to the assistant
- **THEN** the request carries no entity name, no field list, and no value read out of the queried store

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
