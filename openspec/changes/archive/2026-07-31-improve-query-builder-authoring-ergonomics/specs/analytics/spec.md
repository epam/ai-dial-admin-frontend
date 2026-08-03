## MODIFIED Requirements

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
