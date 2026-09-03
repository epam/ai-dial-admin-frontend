## ADDED Requirements

### Requirement: A column may be declared with an enum type and a closed, ordered value list

The column-type vocabulary the schema editors offer SHALL include **enum**, a string column whose value set is
closed. It SHALL be offered wherever a column is declared — the schema-definition surface of a `PENDING`/`FAILED`
table and the "Add columns" popup of an `ACTIVE` one — and for both **source** and **enrichment** tables, since
the service accepts it on either.

A column row typed enum SHALL offer a **required** value-list control in place of the element-type control an
Array row offers. The control SHALL present the declared values as an **ordered** list the user can reorder,
because a value's position in the list becomes its numeric id in the physical type and the column therefore
sorts in **declared order, not alphabetically**. The control SHALL state that ordering consequence, since
nothing about a list of values otherwise suggests it.

Each value SHALL be validated client-side against the service's rules, with a per-value message and Save
disabled while any is violated:

- at least **1** and at most **512** values
- each value non-blank after trimming
- each value at most **64** characters
- values **distinct after trimming** — two entries differing only in surrounding whitespace collide

Values SHALL be submitted **trimmed**, which is how the service stores and materializes them. A value MAY
contain any characters, including commas and quotes, so the control MUST NOT treat any character as a
separator.

`enum_values` SHALL be submitted **if and only if** the column's type is enum: a column of any other type
carrying the key is rejected (422), and an enum column without it is rejected the same way. Retyping a row away
from enum SHALL discard the values it had collected, exactly as retyping away from Array discards its element
type, so a stale domain can never be submitted with a column that no longer has that type.

Enum SHALL NOT be offered as an Array column's **element type** — the service rejects an enum element. Enum
SHALL NOT appear among the **Version column** or **Partition column** candidates, both of which require a
temporal type. Enum SHALL be selectable as an **ordering key** entry, as an **Identity column**, and as an
enrichment's **grain key**, on the same terms as any other non-nullable, non-sensitive scalar.

#### Scenario: Enum is offered as a column type

- **WHEN** the user opens the column-type selector on a source or an enrichment table's column row
- **THEN** enum is among the offered types

#### Scenario: Choosing enum reveals a required value list

- **WHEN** the user sets a column row's type to enum
- **THEN** the row offers a required value-list control
- **AND** Save is disabled while the list is empty

#### Scenario: Declared values are submitted in the authored order

- **WHEN** the user declares an enum column with the values `low`, `medium`, `high` in that order and saves a
  complete schema
- **THEN** that column in the submitted payload carries `enum_values` `["low", "medium", "high"]` in that order

#### Scenario: Reordering the list changes what is submitted

- **WHEN** the user reorders a declared enum column's values so that `high` precedes `low`
- **THEN** the submitted `enum_values` carries the new order

#### Scenario: A blank or over-long value blocks Save

- **WHEN** an enum column's value list holds a blank entry, or an entry longer than 64 characters
- **THEN** that entry shows a validation message and Save is disabled
- **AND** correcting the entry clears the message and re-enables Save

#### Scenario: Duplicate values after trimming block Save

- **WHEN** an enum column's value list holds `failed` and `failed ` (with a trailing space)
- **THEN** a validation message reports the collision and Save is disabled

#### Scenario: Values are submitted trimmed

- **WHEN** the user declares an enum value as ` running ` and saves
- **THEN** the submitted `enum_values` carries `running`

#### Scenario: More than 512 values blocks Save

- **WHEN** an enum column's value list exceeds 512 entries
- **THEN** a validation message reports the cap and Save is disabled

#### Scenario: Retyping away from enum drops the collected values

- **WHEN** a column row typed enum with declared values is retyped to string
- **THEN** the value-list control is no longer offered
- **AND** the submitted column carries no `enum_values`

#### Scenario: Enum is not offered as an array element type

- **WHEN** a column row is typed Array and the user opens its element-type selector
- **THEN** enum is not among the offered element types

#### Scenario: An enum column is not a version-column candidate

- **WHEN** a source table declares an enum column and the user opens the Version column selector
- **THEN** that column is not offered
- **AND** it is offered in the Ordering key and Identity column selectors

#### Scenario: An enum column can be added to a materialized table

- **WHEN** the user adds an enum column with a declared value list to an `ACTIVE` table and submits
- **THEN** the schema patch's `add` entry carries the column's type and its `enum_values`
- **AND** on success the detail view refreshes from the server

### Requirement: An enum column's declared domain is immutable once the column exists

The service refuses to change a column's `enum_values` after the column exists: a schema-patch `update` entry
carrying the key is rejected with 422 rather than ignored, because widening a ClickHouse enum rewrites the
column and fails outright on any stored row holding a value the new domain drops.

The per-column **edit** modal SHALL therefore show an enum column's declared values **read-only**, and the patch
it submits SHALL NOT carry `enum_values` under any circumstance. Presenting the domain rather than omitting it
is the point: an operator who cannot find the values in the modal has no way to learn that the column has a
closed domain at all, and the read-only presentation states both facts at once. The modal SHALL say that the
domain cannot be changed and that changing it means dropping the column and adding it again — the only path the
service supports — so the restriction does not read as a gap in the console.

A **rename** SHALL remain available on an enum column on the same terms as any other column; the service keeps
the domain and the type intact across one.

The columns grid SHALL make an enum column's declared values reachable without opening the edit modal, so the
domain is discoverable from the schema at a glance.

#### Scenario: The edit modal shows the domain read-only

- **WHEN** the user opens the edit modal on an enum column
- **THEN** its declared values are shown and cannot be edited
- **AND** the modal states that the domain cannot be changed and that a change means dropping and re-adding the
  column

#### Scenario: An edit patch never carries the domain

- **WHEN** the user changes an enum column's display name in the edit modal and submits
- **THEN** the schema patch carries the metadata `update` entry
- **AND** it carries no `enum_values`

#### Scenario: An enum column can still be renamed

- **WHEN** the user renames an enum column
- **THEN** the rename patch is sent
- **AND** the refreshed column keeps its type and its declared values

#### Scenario: The declared domain is reachable from the columns grid

- **WHEN** the columns grid renders an enum column
- **THEN** its declared values are reachable from the grid without opening the edit modal

### Requirement: The enum value filter is presented in the grid's own filter design language

The value-selection control an enum-typed column's filter offers (see "A column of an enum type filters by
selecting from its observed values", whose value semantics this requirement does not change) SHALL be presented
consistently with the text and number filters in the same grid header, which are themed to the application's
form controls. A control that applies the same kind of narrowing SHALL NOT read as a different class of thing
because of how it was implemented.

The control SHALL provide:

- a **search field** that narrows the listed values, offered once the list is long enough for scanning to be the
  slower path. The search SHALL be presentational: it SHALL NOT change which values are selected, and clearing
  it SHALL restore the full list with the selection intact.
- a **select-all / clear** affordance reflecting the current selection as all, none, or partial, so a
  many-valued column does not have to be cleared one value at a time.
- each value's **count** rendered as its own trailing element in a secondary text treatment, **not** concatenated
  into the option's label. The count SHALL NOT form part of the option's accessible name: the name is the value,
  which is what a selection means, and a name that changes as counts move makes the same option unrecognisable
  between openings.
- a **reset** action that clears the selection, matching the reset the text and number filters offer.

The control's **loading**, **empty** and **failed** states SHALL each be announced through a live region and
SHALL be visually distinguishable, with the failed state carrying the error text treatment. The live region
SHALL remain separate from any control's own label.

An enum column SHALL keep its place in the grid's **floating-filter row**, so its affordance sits level with
every neighbouring column's filter rather than a row above it. It MUST NOT take the row's default floating
filter, which is a free-text entry and would write a text model over the column's value model. The affordance
SHALL be the grid's own filter button — the same control, at the same size, as the one every other column in
that row carries — and MUST NOT be a bespoke substitute, which would differ from its neighbours for no reason
a reader could see. Exactly one such control SHALL be offered for the column.

The listed values SHALL remain keyboard-reachable and operable, and the selected state SHALL be exposed
programmatically rather than by styling alone.

#### Scenario: The filter is themed like the grid's other filters

- **WHEN** the operator opens an enum column's filter
- **THEN** its surface, spacing and controls follow the same treatment as the text and number filters in that
  grid's header

#### Scenario: Search narrows the list without changing the selection

- **WHEN** the operator has two values selected and types a term matching neither
- **THEN** the list shows only the matching values
- **AND** the two values remain selected
- **AND** clearing the term restores the full list with both still selected

#### Scenario: Select all and clear act on the whole list

- **WHEN** the operator activates select-all on an enum column's filter
- **THEN** every listed value becomes selected
- **AND** the affordance reports the selection as complete
- **AND** activating it again clears the selection

#### Scenario: A value's accessible name is the value alone

- **WHEN** the operator reaches a listed value with assistive technology
- **THEN** its accessible name is the value
- **AND** the count is not part of that name

#### Scenario: Reset clears the selection

- **WHEN** the operator has values selected and activates reset
- **THEN** no value is selected
- **AND** the request carries no predicate for that column

#### Scenario: The affordance sits level with the other columns' filters

- **WHEN** the grid renders an enum column beside a text-filtered one
- **THEN** both columns' filter affordances are in the floating-filter row
- **AND** the enum column's is the grid's own filter button, not a text entry and not a bespoke one

#### Scenario: Only one control opens the value list

- **WHEN** the grid renders an enum column
- **THEN** its floating-filter row offers a single filter control
- **AND** no second control for the same column appears in the header row

#### Scenario: Loading, empty and failed states are announced

- **WHEN** the value query is in flight, returns nothing, or fails
- **THEN** the corresponding message is announced through a live region
- **AND** the failed state is rendered in the error text treatment

## MODIFIED Requirements

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a WHERE tree limited to two levels: the root group holds conditions and groups, and nested groups hold only conditions. The "add nested group" action SHALL be offered only at the root group; nested groups SHALL offer only add-condition and remove actions. Each group SHALL expose a logical operator selector (AND / OR / NOT). Each condition SHALL expose a field selector (from the loaded schema, grouped by field category), an operator selector (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. Each operator SHALL be shown by its full name (Equals, Not equals, Contains, Does not contain, Less than, Greater than, Less than or equal, Greater than or equal, In list) — in the selector's open list, in its collapsed trigger, and in the condition's collapsed row summary — with no short code shown anywhere, and each option SHALL expose a hover tooltip describing the operator. The two case-insensitive contains operators SHALL be named Contains / Does not contain while serializing to `ico`/`inc` (SQL ILIKE); their tooltips SHALL state that matching is case-insensitive. The case-sensitive `co`/`nc` SHALL NOT be offered as authoring options but SHALL remain valid model values that serialize, deserialize, and round-trip without error when present in a JSON-authored or backend-translated query. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups and fieldless conditions SHALL be omitted; a `not` group SHALL wrap its single child, or an `and` of its children. Deeper nesting SHALL be expressible only through the SQL view.

The two contains operators SHALL be **withheld** when the condition's selected field is one the schema types
**enum**. ClickHouse defines comparison over an enum but not the string functions, so the service refuses the
LIKE-based operators on an enum field — and it rejects the **whole** query for one bad predicate, so a single
such condition takes the entire result down rather than degrading it. The remaining operators (`eq`, `ne`, the
four magnitude comparisons, and `in`) SHALL stay offered, since comparison, equality, membership, grouping and
sorting all work over an enum. The withholding SHALL key on the **declared type alone**: no list in the frontend
names which fields are enums, so a field an instance begins reporting as an enum is guarded with no change here.
A condition that already carries a contains operator when its field is changed to an enum-typed one SHALL be
moved to a supported operator rather than left serializing a predicate the service will reject.

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

- **WHEN** a condition's selected field is one the schema types enum and the user opens its operator selector
- **THEN** Contains and Does not contain are not offered
- **AND** Equals, Not equals, the magnitude comparisons and In list remain offered

#### Scenario: Switching a contains condition to an enum field leaves a valid operator

- **WHEN** a condition carrying Contains has its field changed to an enum-typed field
- **THEN** the condition's operator is no longer Contains
- **AND** the serialized query carries no LIKE-based predicate over that field

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
- `enum` — **one of the column's own declared values** (its first), never a generic example string: the domain is closed and the server itself refuses a value outside it, so a placeholder literal is a row the reader cannot insert

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

#### Scenario: An enum column's write snippet uses one of its declared values

- **WHEN** the Connect panel renders the write snippet for a table declaring an enum column whose values are
  `pending`, `running`, `failed`
- **THEN** that column's field in the generated row carries `pending`
- **AND** it does not carry a generic example string
