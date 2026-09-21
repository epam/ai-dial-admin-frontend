## MODIFIED Requirements

### Requirement: Time range is part of the structured query

The toolbar time filter SHALL be a query control: its range SHALL serialize into the structured query's filter as `ge`/`le` predicates on the source's automatically detected timestamp field (the first temporal-typed field of the loaded schema). The serialized query — as shown in the JSON view, copied by the Copy action, and executed by Run — SHALL include these predicates; nothing is added invisibly at execution time. The time predicates SHALL NOT be shown in the visual Filters tree — the toolbar control is their editor. When the schema has no temporal field, no time predicates SHALL be serialized and the query runs without a time bound. SQL text SHALL never be modified by the time filter.

A **preset** period SHALL serialize as a **relative** bound rather than as two instants: the lower bound SHALL compare the timestamp field against a call subtracting the preset's own unit and amount from the current instant, and the upper bound against the current instant itself. The body then carries the moving window on its own, so a copied, exported, or directly executed body returns the last N units at the moment it runs instead of the window its author happened to be looking at. Because the current instant is read where the query is evaluated rather than from the browser, a relative bound also removes the clock skew an instant resolved client-side carries.

A **custom** range SHALL keep serializing as two absolute instants, and an anchored option's fixed start SHALL stay absolute: both name one specific interval, which is what the user asked for.

Both the subtraction and the current-instant call SHALL be named by the served function catalog, and the frontend SHALL verify they are served before emitting them. When the catalog serves neither — it failed to load, or a deployment's catalog does not carry them — a preset SHALL serialize absolutely, exactly as a custom range does, rather than emit a call the service would reject and take the whole query down.

When parsing JSON back into builder state, a matching `ge` + `le` predicate pair on the timestamp field SHALL be lifted into the toolbar control: a **relative** pair whose subtracted unit and amount match an offered preset SHALL be lifted as that preset, and an **absolute** pair SHALL be lifted as a custom range, exactly as before. Time conditions in any other shape SHALL remain ordinary filter conditions, editable in the Filters tree like any other — including a relative lower bound with no matching upper bound, a relative bound matching no offered preset, and any pair on another field.

The **persisted** body is the one exception, and it is deliberate: the structured body written to a saved query SHALL be serialized without the time bound, and the authored range SHALL be stored separately as time intent (see **Saving persists authored intent, not a resolved range**). Serializing the range into a persisted body would freeze the saved query to the day it was authored.

#### Scenario: Time range serializes into the query

- **WHEN** the user has a time range selected and the schema has a temporal field
- **THEN** the serialized query's filter includes `ge` and `le` predicates on that field
- **AND** the JSON view displays these predicates
- **AND** the visual Filters tree does not display them

#### Scenario: A preset period serializes as a relative bound

- **WHEN** the user selects a preset period of 30 minutes and the schema has a temporal field
- **THEN** the serialized query's filter includes a `ge` predicate comparing that field against a call subtracting 30 minutes from the current instant
- **AND** an `le` predicate comparing it against the current instant
- **AND** the JSON view displays both predicates while the visual Filters tree does not

#### Scenario: A preset period's body stays current when re-run later

- **WHEN** a body serialized from a preset period is executed again some time after it was produced
- **THEN** it bounds the results by the preset's span measured from the moment of that execution
- **AND** no instant from the moment of authoring appears in the body

#### Scenario: A custom range serializes as instants

- **WHEN** the user selects a custom range
- **THEN** the serialized query's filter includes `ge` and `le` predicates carrying that range's two absolute instants
- **AND** no relative call is emitted

#### Scenario: A relative pair lifts back to its preset

- **WHEN** the JSON view holds a `ge`/`le` pair on the timestamp field whose lower bound subtracts 2 days from the current instant and whose upper bound is the current instant
- **THEN** the toolbar time filter shows the 2-day preset rather than a custom range
- **AND** the predicates do not appear in the visual Filters tree

#### Scenario: JSON time predicates round-trip into the toolbar control

- **WHEN** the user edits the JSON's `ge`/`le` predicate pair on the timestamp field to two absolute instants and the JSON is otherwise representable
- **THEN** the toolbar time filter reflects the edited range as a custom range
- **AND** the predicates do not appear in the visual Filters tree

#### Scenario: A relative bound the toolbar cannot own stays a filter condition

- **WHEN** a query carries only a `ge` predicate comparing the timestamp field against a call subtracting 30 minutes from the current instant, with no matching upper bound
- **THEN** it is shown as an ordinary condition in the Filters tree
- **AND** the toolbar time filter does not claim it

#### Scenario: A catalog without the relative functions falls back to instants

- **WHEN** the served function catalog carries neither the subtraction nor the current-instant function and the user has a preset period selected
- **THEN** the serialized query's filter carries that preset's resolved instants as absolute values
- **AND** the query runs

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

### Requirement: Served function catalog

The Query Builder SHALL source the set of functions it offers — in `aggregate` mode's Group by and Aggregate sections, in the `row`-mode Select projection, as **either** operand of a Filter condition, and as the value of an `expression` argument of a call already being built — exclusively from the backend function catalog `GET /v1/queries/functions`, fetched on the server when the query-builder page loads and seeded into the builder. The frontend SHALL NOT hardcode any function name, group, argument shape, allowed literal values, numeric bound, distinct support, return type, or hint text: every such property SHALL be read from the served catalog entry. Each catalog entry provides the function `name`, `group` (`scalar`, `aggregate`, or `ordered_set_aggregate`), a `signature`, a `returns` type, a `distinct_supported` flag, a `description`, and an ordered `args` list; each argument provides its `name`, its `kind` (`expression`, `integer_literal`, `numeric_literal`, or `string_literal`), an `optional` flag, and — when applicable — `constraints` with `allowed_values` and/or `min`/`max`.

There SHALL be no local fallback catalog. When the catalog fetch fails or returns an empty list, no functions SHALL be offered: the Functions group of the Group by, row-mode Select, Filter-condition operand and function-argument dropdowns SHALL be empty and the Aggregate section SHALL offer no metric functions, while plain-column querying (the `row`-mode projection, plain group-by columns in `aggregate` mode, and conditions over a schema column) SHALL remain fully functional.

Every enum and function picker in the rail (operator, value type, nulls, sort direction, aggregate function) SHALL mark its current option the same way as the field dropdowns — a check mark beside the label plus the accent tint. Every function picker — the Aggregate section's selector and the Functions group of the Group by, row-mode Select, Filter-condition operand and function-argument dropdowns — SHALL name a function from the served catalog and SHALL expose its catalog `description` as a hover tooltip. The name SHALL be derived from the served data, never from a per-function table in the frontend: catalog descriptions open by naming the function ("Average of a numeric expression over the group; …", "Row count; with an argument …", "Continuous percentile: …"), so the label SHALL be that leading phrase, cut at the first clause break or the "<name> of/for …" and "<name> (…)" patterns. A description that instead opens with prose ("Lowercases a text expression."), or a function with no description, SHALL fall back to the function's own name made readable (`percentile_cont` → "Percentile cont"). A function with no description SHALL render without a tooltip.

#### Scenario: Functions offered come from the served catalog

- **WHEN** the query-builder page loads and the function catalog lists `date_bin`, `width_bucket`, `lower`, `count`, `sum`, and `percentile_cont`
- **THEN** the Group by Functions group offers the `scalar` functions (`date_bin`, `width_bucket`, `lower`) and the Aggregate section offers the `aggregate` / `ordered_set_aggregate` functions (`count`, `sum`, `percentile_cont`)
- **AND** the row-mode Select dropdown, both of a Filter condition's operand dropdowns, and a function argument's own dropdown offer that same `scalar` set

#### Scenario: New backend functions appear with no frontend change

- **WHEN** the catalog advertises a function the frontend has never named (e.g. `width_bucket`, `percentile_cont`, `percentile_disc`)
- **THEN** it is offered in the appropriate section with an argument editor built from its catalog `args`, without any function-specific frontend code

#### Scenario: Absent catalog degrades to plain columns

- **WHEN** the function catalog fails to load or is empty
- **THEN** the Group by, row-mode Select, and Filter-condition operand dropdowns offer only schema columns, and the Aggregate section offers no metric functions
- **AND** the row-mode projection, plain group-by columns, and conditions comparing a schema column against a literal still build and run

#### Scenario: Function options are named from the served description

- **WHEN** the catalog describes `avg` as "Average of a numeric expression over the group; distinct deduplicates values first." and `percentile_cont` as "Continuous percentile: interpolates between adjacent values…"
- **THEN** the Aggregate function selector labels them "Average" and "Continuous percentile"
- **AND** hovering an option shows that function's full catalog `description` as a tooltip

#### Scenario: A prose description falls back to the function name

- **WHEN** the catalog describes `lower` as "Lowercases a text expression."
- **THEN** the Group by Functions group labels it "Lower" rather than lifting the prose

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a WHERE tree limited to two levels: the root group holds conditions and groups, and nested groups hold only conditions. The "add nested group" action SHALL be offered only at the root group; nested groups SHALL offer only add-condition and remove actions. Each group SHALL expose a logical operator selector (AND / OR / NOT). Each condition SHALL expose a left-operand selector, an operator selector (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`), a right-operand kind, a value input, a value-type selector, and a remove action. The left operand SHALL be either a schema column or a call to a `scalar` catalog function: the operand dropdown SHALL offer the loaded schema's fields grouped by field category and, in the same Functions group the Group by dropdown carries, the catalog's scalar functions. The functions offered here SHALL exclude those whose catalog return type is `array`: the service accepts an array result as a projected column but rejects it as an operand, and it rejects the whole query for one bad predicate, so such a condition would take every other one down with it. The exclusion SHALL key on the served return type, never on a list of names. Choosing a function SHALL expand the condition into one argument editor per catalog argument — built from the catalog exactly as a group-by function row's editors are — and the condition's collapsed summary SHALL read the call with its arguments in place of a column name. A function operand SHALL serialize as the predicate's left `fn` expression. The **right** operand SHALL offer the same choice: a condition's right-operand kind SHALL be either a literal value — the value input and value-type selector it carries today — or a call to a `scalar` catalog function, picked from the same Functions group the left operand offers, subject to the same array-return exclusion, and expanded into the same per-argument editors. While the right operand is a function, the value input, the value-type selector and the "is null" option SHALL be hidden: the compared type is the function's own and there is no literal to type. The `in` operator SHALL keep taking comma-separated tokens only, because its right operand is an array of literals and a single call is not one; switching a condition to `in` SHALL return its right operand to the literal kind. A function right operand SHALL serialize as the predicate's second `fn` expression, and a condition whose right-operand function has unfilled required arguments SHALL be omitted and SHALL raise the same Filter-header warning a left-operand one does — the query would otherwise run without that predicate and return more rows than were asked for.

An `expression` argument of a function being built — in either operand of a condition, in Group by, in row-mode Select, or in an Aggregate metric — SHALL accept either a schema column or a call to a `scalar` catalog function, nested **one level deep**; a nested call's own `expression` arguments SHALL accept columns only. A nested call taking no arguments at all is what expresses a value read at execution time, which is what makes a bound relative to the current instant authorable in the visual builder. The nested position SHALL offer the catalog's whole `scalar` set **without** the array-return exclusion that applies to a condition's operands: an argument may legitimately take an array, and the catalog does not declare what type an `expression` argument expects, so there is nothing to exclude on. A nested call whose own required arguments are unfilled SHALL leave its parent call incomplete, so the row or condition carrying it is omitted and warned about exactly as any other incomplete call is. Nesting deeper than one level SHALL be expressible only through the JSON and SQL views. The condition's default value type, and the operator-withholding rule below, SHALL follow the operand's **resolved type**: a column's schema type, or a function's catalog return type — resolved, for a function whose return type is declared as its argument's own, from the schema type of its first expression argument's field. Each operator SHALL be shown by its full name (Equals, Not equals, Contains, Does not contain, Less than, Greater than, Less than or equal, Greater than or equal, In list) — in the selector's open list, in its collapsed trigger, and in the condition's collapsed row summary — with no short code shown anywhere, and each option SHALL expose a hover tooltip describing the operator. The two case-insensitive contains operators SHALL be named Contains / Does not contain while serializing to `ico`/`inc` (SQL ILIKE); their tooltips SHALL state that matching is case-insensitive. The case-sensitive `co`/`nc` SHALL NOT be offered as authoring options but SHALL remain valid model values that serialize, deserialize, and round-trip without error when present in a JSON-authored or backend-translated query. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups, conditions with no left operand, and function conditions whose required catalog arguments are not all filled SHALL be omitted; a condition omitted for an unfilled function argument SHALL raise a warning on the Filter section header, because the query then runs without that predicate and returns more rows than were asked for with nothing else on screen saying so; a `not` group SHALL wrap its single child, or an `and` of its children. Deeper nesting SHALL be expressible only through the SQL view.

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

#### Scenario: A function right operand serializes as an fn expression

- **WHEN** a condition compares a timestamp column with Greater than or equal, its right operand is a scalar function, and that function's arguments are filled
- **THEN** the serialized predicate's second argument is an `fn` expression naming that function with its arguments in place
- **AND** the condition's collapsed summary reads the call rather than a typed value

#### Scenario: A relative bound is authored through a nested call

- **WHEN** a condition compares a timestamp column with Greater than or equal, its right operand is the subtraction function with unit "minute" and amount 30, and that function's timestamp argument is set to the current-instant function
- **THEN** the serialized predicate's second argument is the subtraction call whose third argument is the current-instant call with an empty argument list
- **AND** the query runs and returns the last 30 minutes

#### Scenario: A function right operand hides the literal inputs

- **WHEN** a condition's right-operand kind is a function
- **THEN** the value input, the value-type selector and the "is null" option are not shown
- **AND** the function's own argument editors are shown instead

#### Scenario: The in operator keeps taking literals

- **WHEN** a condition whose right operand is a function has its operator changed to In list
- **THEN** the right operand returns to the literal kind and takes comma-separated tokens
- **AND** no function is offered for that operator's right operand

#### Scenario: An incomplete nested call omits the condition, and says so

- **WHEN** a condition's right-operand function has a nested call whose own required argument is unfilled
- **THEN** that condition contributes no predicate to the serialized filter
- **AND** the Filter section header shows a warning that the condition is left out

#### Scenario: A nested call cannot nest further

- **WHEN** the user opens the argument editors of a call that is already nested inside another call's argument
- **THEN** its `expression` arguments offer schema columns only
- **AND** no function is offered there

#### Scenario: An array-returning function is offered inside an argument

- **WHEN** the catalog serves a scalar function whose return type is `array` and the user opens a function argument's own dropdown
- **THEN** that function is among the Functions group's options
- **AND** it is still withheld from the condition's own two operand dropdowns

#### Scenario: A JSON-authored function right operand round-trips

- **WHEN** a query authored in the JSON view carries a predicate whose right operand is an `fn` expression naming a served catalog function, with a nested call one level deep
- **THEN** the Builder view shows that condition with both calls selected and their arguments filled
- **AND** serializing the builder state reproduces the same predicate

### Requirement: A query the visual builder cannot hold stays in the written views

The Builder view SHALL never silently drop part of a query. Builder-representability SHALL therefore
cover every expression the builder would have to hold, not only the shape of the filter tree. Beyond
the existing two-level nesting rule, a structured query SHALL be treated as representable only when:

- every `fn` expression in a position the builder edits — a `select` entry in either mode, and
  **either** operand of a `filter` or `having` predicate — names a function the served catalog
  lists;
- each such call carries no argument beyond the ones its catalog entry declares (a variadic call
  carries more, and the builder has exactly one slot per declared argument); and
- each argument is of the kind its position expects — a literal for a literal argument, and for an
  `expression` argument either a field reference or a call to a served catalog function nested no
  more than one level deep, whose own `expression` arguments are field references — because those
  are the only forms the argument editor produces and therefore the only ones it can show back.
- a predicate's right operand is a literal value, an array of them, or a call to a served catalog
  function — the right-hand shapes the condition editor produces.

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

Two shapes move the other way, because the condition editor now produces them: a predicate compared
against a function call, and a call nested one level inside an `expression` argument. A query
carrying either — a bound relative to the current instant is the shape that motivated both — SHALL
hydrate into the Builder rather than be pushed into the written views. A call nested two or more
levels deep SHALL NOT: the argument editor stops at one, so showing it would again show less than
the query says.

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

#### Scenario: A predicate compared against a call is representable

- **WHEN** a query's predicate compares a column against an `fn` expression naming a served catalog function whose arguments are of the declared kinds
- **THEN** the query is representable and hydrates into the Builder view with that condition intact

#### Scenario: A call nested one level deep is representable

- **WHEN** a query's predicate compares a timestamp column against a subtraction call whose timestamp argument is a call to the served current-instant function
- **THEN** the query is representable and hydrates into the Builder view with both calls intact

#### Scenario: A call nested two levels deep stays in the written view

- **WHEN** a query's predicate carries a call whose `expression` argument is a call whose own `expression` argument is a third call
- **THEN** the query is not builder-representable and is not hydrated with the deepest call dropped
- **AND** Run stays enabled and executes the query as written

### Requirement: JSON view and copy

The JSON view SHALL render the current serialized `StructuredQuery` as JSON in a Monaco editor. Editing the JSON to a valid query the builder can represent SHALL parse it back into the builder state so the Builder view reflects the last such JSON; invalid JSON SHALL be flagged non-blockingly and SHALL disable Run while invalid. Valid JSON that the visual builder cannot represent (e.g. filter nesting deeper than two levels) SHALL remain fully editable and runnable: a non-blocking informational message SHALL state that the query cannot be shown in the visual builder, Run SHALL stay enabled and SHALL execute the JSON query as written, and the builder state SHALL NOT be updated from that JSON (switching to the Builder view is guarded by the written-mode confirmation). Entering the JSON view SHALL seed the editor from the current builder state, and **while that view is open** a toolbar change — the time filter or the selected source — SHALL re-seed it, so the buffer never shows, or runs, a query the toolbar no longer describes. A re-seed after a source change SHALL resolve the time bound against the newly loaded schema's timestamp column, not the previous source's. An editor the user has taken over, by editing it to a body the visual builder cannot represent, SHALL NOT be re-seeded: it is theirs until they leave the view. The Copy action SHALL copy the currently displayed query text (JSON for the Builder/JSON views, the SQL text for the SQL view).

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

#### Scenario: A time filter change reaches the open JSON buffer

- **WHEN** the user is in the JSON view and picks a different period in the toolbar's time filter
- **THEN** the JSON editor shows the time bound of the newly picked period
- **AND** Run executes that bound rather than the previous one

#### Scenario: A source change reaches the open JSON buffer

- **WHEN** the user is in the JSON view and selects a different source in the toolbar
- **THEN** the JSON editor shows a query over the newly selected source
- **AND** its time bound names that source's own timestamp column

#### Scenario: An edited JSON buffer is left alone

- **WHEN** the user has edited the JSON to a body the visual builder cannot represent and then changes the toolbar's time filter
- **THEN** the JSON editor still holds exactly what the user wrote
