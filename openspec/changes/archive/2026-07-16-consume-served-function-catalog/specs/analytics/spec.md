# Analytics — consume the served function catalog (delta)

> Applies on top of the master spec `openspec/specs/analytics/spec.md`.

## ADDED Requirements

### Requirement: Served function catalog

The Query Builder SHALL source the set of functions offered in `aggregate` mode exclusively from the
backend function catalog `GET /v1/queries/functions`, fetched on the server when the query-builder
page loads and seeded into the builder. The frontend SHALL NOT hardcode any function name, group,
argument shape, allowed literal values, numeric bound, distinct support, return type, or hint text:
every such property SHALL be read from the served catalog entry. Each catalog entry provides the
function `name`, `group` (`scalar`, `aggregate`, or `ordered_set_aggregate`), a `signature`, a
`returns` type, a `distinct_supported` flag, a `description`, and an ordered `args` list; each
argument provides its `name`, its `kind` (`expression`, `integer_literal`, `numeric_literal`, or
`string_literal`), an `optional` flag, and — when applicable — `constraints` with `allowed_values`
and/or `min`/`max`.

There SHALL be no local fallback catalog. When the catalog fetch fails or returns an empty list, no
functions SHALL be offered: the Group by dropdown's Functions group SHALL be empty and the Aggregate
section SHALL offer no metric functions, while plain-column querying (`row` mode, and plain group-by
columns in `aggregate` mode) SHALL remain fully functional.

#### Scenario: Functions offered come from the served catalog

- **WHEN** the query-builder page loads and the function catalog lists `date_bin`, `width_bucket`,
  `lower`, `count`, `sum`, and `percentile_cont`
- **THEN** the Group by Functions group offers the `scalar` functions (`date_bin`, `width_bucket`,
  `lower`) and the Aggregate section offers the `aggregate` / `ordered_set_aggregate` functions
  (`count`, `sum`, `percentile_cont`)

#### Scenario: New backend functions appear with no frontend change

- **WHEN** the catalog advertises a function the frontend has never named (e.g. `width_bucket`,
  `percentile_cont`, `percentile_disc`)
- **THEN** it is offered in the appropriate section with an argument editor built from its catalog
  `args`, without any function-specific frontend code

#### Scenario: Absent catalog degrades to plain columns

- **WHEN** the function catalog fails to load or is empty
- **THEN** the Group by dropdown offers only schema columns and the Aggregate section offers no
  metric functions
- **AND** `row` mode and plain group-by columns still build and run

## MODIFIED Requirements

### Requirement: Query mode and DISTINCT

In the Builder view the rail SHALL let the user choose the query mode — `row` (projection) or
`aggregate` (group + metrics) — via a two-option `DialSegmentedControl` at the top of the view.
Selecting `row` SHALL show the projection (Select) section and hide the aggregate sections; selecting
`aggregate` SHALL show the Group by, Aggregate, and Having sections and hide the projection section.

An aggregate metric whose catalog entry has `distinct_supported: true` SHALL render a per-aggregate
DISTINCT control; aggregate metrics whose catalog entry has `distinct_supported: false` SHALL NOT
render one, and there SHALL be no query-level DISTINCT toggle. When set, the control SHALL serialize
into that aggregate's `distinct` flag. (This supersedes the previous rule that hid all DISTINCT
controls: the served catalog now identifies exactly which functions accept `distinct`, so the control
is offered precisely and only where it is valid.)

#### Scenario: Switching to aggregate mode swaps sections

- **WHEN** the user selects `aggregate` mode
- **THEN** the Group by, Aggregate, and Having sections are shown
- **AND** the projection (Select) section is hidden

#### Scenario: DISTINCT is offered only where the catalog allows it

- **WHEN** the user adds an aggregate whose catalog entry has `distinct_supported: true` (e.g.
  `count`, `sum`, `avg`)
- **THEN** a DISTINCT control is rendered on that aggregate row
- **AND** an aggregate whose catalog entry has `distinct_supported: false` (e.g. `min`, `max`,
  `percentile_cont`) renders no DISTINCT control

#### Scenario: Setting DISTINCT serializes onto the aggregate

- **WHEN** the user enables DISTINCT on a `count` aggregate over a field
- **THEN** that aggregate's serialized `fn` expression carries `distinct: true`

### Requirement: Aggregate-mode group by, time buckets, and metrics

In `aggregate` mode the builder SHALL provide a single Group by section combining plain columns and
scalar-function entries, and an Aggregate section for metrics. The functions offered SHALL be exactly
those served by the function catalog (see "Served function catalog"), grouped by their catalog
`group`: `scalar` functions in the Group by Functions dropdown group, and `aggregate` /
`ordered_set_aggregate` functions in the Aggregate section. There SHALL be no separate Time bucket
section, and no function, argument, allowed-value, or bound SHALL be hardcoded.

Picking a plain column SHALL add it as a removable chip. Picking a function SHALL add a parameterized
row whose argument editors are generated from the catalog entry's ordered `args`: an `expression`
argument SHALL render a field dropdown; an `integer_literal` or `numeric_literal` argument SHALL
render a numeric input constrained to the argument's `min`/`max` when present; a `string_literal`
argument SHALL render a select of the argument's `allowed_values` when present, otherwise a text
input; an argument marked `optional` MAY be left empty and SHALL be omitted from the serialized call.
Each function row SHALL also carry an alias. The row's hint text SHALL be the catalog `description`.

The serialized query SHALL place plain group-by field projections, aliased scalar-function columns,
and aliased aggregate columns into `select`, and SHALL list plain group-by fields by name and
function entries by alias in `group_by` (function entries without required arguments or without an
alias are excluded from `group_by`). Each function argument SHALL serialize by its catalog `kind`: an
`expression` argument as a field expression, and a literal argument as a value expression of the
kind's type. When `aggregate` mode defines no explicit aggregate, the builder SHALL add an implicit
count measure chosen from the catalog — the first `aggregate`-group function whose arguments are all
optional — so grouped results still carry a value column; if the catalog has no such function, no
implicit measure is added.

A function output's type (used to type Having and Sort options) SHALL be taken from the catalog
`returns`; a `same_as_argument` return SHALL be resolved to the type of the function's first
`expression` argument as declared in the entity schema.

#### Scenario: Aggregate select and group_by are built

- **WHEN** the user adds a group-by column and a `sum` aggregate over a field with alias `total`
- **THEN** `select` includes the group-by field column and a `sum` function column aliased `total`
- **AND** `group_by` includes the group-by field

#### Scenario: date_bin builds through the generic argument editor

- **WHEN** the user picks `date_bin` from the Group by Functions group and its catalog args are
  `amount` (`integer_literal`, `min` 1), `unit` (`string_literal`, `allowed_values`), and `timestamp`
  (`expression`), and sets 5 / `minute` / a timestamp field with alias `bucket`
- **THEN** the amount arg renders a numeric input floored at 1, the unit arg renders a select of the
  advertised units, and the timestamp arg renders a field dropdown
- **AND** `select` includes a `date_bin` function column aliased `bucket` whose args serialize as an
  integer value, a string value, and a field expression
- **AND** `group_by` includes `bucket`

#### Scenario: Multi-argument scalar function builds

- **WHEN** the user picks `width_bucket` whose catalog declares four `expression` args (`operand`,
  `low`, `high`, `count`) and fills each with a field, aliased `bkt`
- **THEN** the row renders four field dropdowns and `select` includes a `width_bucket` column aliased
  `bkt` with four field-expression args

#### Scenario: Ordered-set aggregate with a bounded literal builds

- **WHEN** the user picks `percentile_cont` whose catalog declares a `fraction` (`numeric_literal`,
  `min` 0, `max` 1) and a `column` (`expression`) argument
- **THEN** the fraction arg renders a numeric input constrained to `[0, 1]` and the column arg renders
  a field dropdown
- **AND** the serialized aggregate carries a numeric value arg and a field-expression arg

#### Scenario: Function select entries parse back into the correct section

- **WHEN** a JSON query's `select` holds a `scalar` catalog function column and an
  `ordered_set_aggregate` catalog function column
- **THEN** switching views shows the scalar one as a Group by function row and the ordered-set one as
  an Aggregate row

#### Scenario: Implicit measure is chosen from the catalog

- **WHEN** the user builds an `aggregate` query with a group-by column and no explicit aggregate
- **THEN** the serialized `select` includes an implicit measure that is the first catalog
  `aggregate`-group function whose arguments are all optional (`count`), aliased with the implicit
  count alias
