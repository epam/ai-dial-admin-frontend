## MODIFIED Requirements

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

## ADDED Requirements

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
