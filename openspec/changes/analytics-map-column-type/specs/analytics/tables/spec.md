## ADDED Requirements

### Requirement: A column may be declared with a map type

The column-type vocabulary the schema editors offer SHALL include **map**, a bag of string keys mapped to string
values — the service's `map` type, which carries no key or value type of its own. It SHALL be offered wherever a
column is declared — the schema-definition surface of a `PENDING`/`FAILED` table, the "Add columns" popup of an
`ACTIVE` one, and the JSON draft editor — and for both **source** and **enrichment** tables, since the service
accepts it on either. A map column row SHALL offer no type-specific control: it takes neither an element type nor
a value list.

The column-type picker SHALL list Map **last**, after Array. The picker shows ten options before it scrolls, with
no scrollbar at rest, so whichever types sit past the tenth are found only by scrolling; the long-established
Array keeps its place and the newest type takes the one least likely to be looked for first.

A map column SHALL be labelled with its type wherever a column's type is shown — the columns grid, the field
dropdowns of the Query Builder, and the type badge, which SHALL give it a colour token of its own so it is not
mistaken for an Object column. A map column MAY be marked sensitive, as any other column can.

The rules that follow from the type — Nullable forced off, never offered as a key, an identity column or an
element type, its Add rows template value and its Connect panel literal — are stated in "Define and materialize
a table schema", "Table detail row writes" and "Connect panel snippets are generated from the table schema".

#### Scenario: Map is offered as a column type

- **WHEN** the user opens the type picker on a column row of a source or an enrichment table
- **THEN** Map is offered, listed after Array
- **AND** choosing it shows no element-type or value-list control on the row

#### Scenario: A declared map column submits its type

- **WHEN** the user declares a column `attributes` typed Map and saves the schema
- **THEN** the submitted column carries `type: "map"` and does not carry `nullable: true`, `element_type`, or `enum_values`

#### Scenario: A served map column shows its type

- **WHEN** an `ACTIVE` table's schema reports a column typed `map`
- **THEN** the columns grid shows its type as Map
- **AND** its type badge uses a colour distinct from an Object column's

## MODIFIED Requirements

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor, opened via the header **Add rows** button. The popup is a **hand-check** — a way for an admin to confirm the table accepts the shape they expect — and SHALL be presented as such, not as the way a table is populated; a table is populated by a client writing to its row endpoint programmatically (see "Table detail Connect panel"). Opening the editor SHALL prefill it with a one-row JSON template whose keys are the table's declared columns' **physical source names** (not their exposed names, which the backend's row-insert endpoint does not accept), each mapped to a value matching that column's type (`0` for Integer/Long/Decimal, `false` for Boolean, `{}` for Object and Map, `[]` for Array, `""` otherwise) rather than a bare empty array, so the example stays valid input for every column. The popup SHALL NOT be reachable for an **enrichment** table (see the gating requirement); where the template is built for one, it includes the grain key as a top-level field, since an enrichment row cannot join to its source without it. The **Insert rows** submit action SHALL be disabled while the editor's content does not parse as a JSON array, re-enabling as soon as it does; submitting invalid or non-array input SHALL additionally surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

The popup SHALL carry, above its editor, a statement of its purpose — that it inserts rows by hand for checking a schema, and that ongoing ingestion goes through the table's row endpoint — together with a **Write rows programmatically** action which closes the popup, discarding the editor's content, and opens the Connect panel on its **Write data** tab (see "Table detail Connect panel"). Both SHALL sit at the top of the popup body, above the editor and away from the submit controls, so a user who opened the popup for real ingestion is redirected before typing rather than after.

#### Scenario: The popup states that it is a hand-check

- **WHEN** the user opens the Add rows editor
- **THEN** the popup shows, above the editor, that it is for inserting rows by hand and that ongoing ingestion uses the row endpoint

#### Scenario: Opening Add rows prefills a type-shaped template

- **WHEN** the user opens the Add rows editor for a table with declared columns
- **THEN** the editor is prefilled with one row object keyed by each column's physical source name, with type-appropriate placeholder values

#### Scenario: A map column's template value is an empty object

- **WHEN** the user opens the Add rows editor for a table that declares a `map` column
- **THEN** that column's template value is `{}`, not `""`, which the service would reject as a map value

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

### Requirement: Define and materialize a table schema

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (a single **Name** field, used as both the column's exposed name and its physical source name since the two are always equal at definition time, type, nullable, optional tag, optional display name, optional description, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared columns that can key a table, an optional partition (a temporal column + a day/month/year granularity), and an optional scan-metadata pair (`identity_column` and `version_column`); for an **enrichment**, its columns plus a grain key chosen from those of its source table's columns that can key a table. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, tag length, display-name length, and description length exactly as the create/add-columns editor validates today, against both the exposed-name and source-name uniqueness constraints (which the merged Name field satisfies identically).

The same document MAY instead be authored as JSON — see "JSON editor for a table draft" — in which case that requirement's seeding rule, save gate and submission sequence apply and the rules in this requirement's remaining paragraphs govern the column-by-column surface only.

The **display name** and **description** fields SHALL be optional and SHALL be presented inline on the column row alongside its other fields, with field labels rendered on the first row only, as the row's existing fields already are. A blank value SHALL be valid and SHALL be omitted from the submitted column, exactly as a blank tag is — the service treats an absent metadata field as "not set". A display name longer than 128 characters or a description longer than 1024 characters SHALL be rejected client-side with a per-row validation message and SHALL disable Save, because the service answers 422 for either (the same caps and the same message the per-column edit modal already applies).

An Array-typed column row SHALL offer an additional element-type selector, restricted to the scalar column types — no Array, Object or Map element (no nested arrays, objects or maps). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column. An Object-typed row's Nullable control SHALL be disabled and forced off in the same way, because the backend rejects a nullable object column (the store has no nullable form of its JSON type). A Map-typed row's Nullable control SHALL be disabled and forced off for the same reason — the store has no nullable map, and an absent bag is written as the empty map `{}`. Retyping a row to Object or Map SHALL switch its Nullable off.

For a **source** table, the Partition column field's label SHALL carry an info affordance whose text includes the fact that only non-nullable Date/Timestamp-typed columns are selectable, since that restriction is not otherwise visually obvious; the affordance and the rest of its text follow "Table schema keys are explained where they are chosen and where they are read". The Granularity field SHALL be rendered only once a partition column is selected; deselecting the partition column (including indirectly, by retyping the selected column away from Date/Timestamp) SHALL also clear any chosen granularity.

The key fields SHALL offer only columns the backend accepts as a key, so that a rejection it always answers (422 `validation_error`) cannot be reached from the surface. The **Ordering key** SHALL offer the declared columns that are non-nullable and neither `Object`- nor `Map`-typed (the store defines no comparison over a map, so it cannot key a table). The **Partition column** SHALL offer the declared `Date` and `Timestamp` columns that are non-nullable; a sensitive column remains eligible, because the backend does not reject it. An enrichment's **Grain key** SHALL offer its source table's columns that are neither `Object`- nor `Map`-typed. A column row can still be declared nullable, `Object` or `Map`; it is only not offered as a key.

For a **source** table only, the surface SHALL offer two additional optional selects — **Identity column** and **Version column** — the pair the governed incremental scan pages a source by. An **enrichment** SHALL offer neither (the backend rejects either member for an enrichment with 422). The Identity column options SHALL be the declared columns that are non-nullable, not sensitive and not `Array`-, `Object`- or `Map`-typed (the service refuses any of the three as a scan cursor); the Version column options SHALL be that same set narrowed to `Timestamp`-typed columns (`Date` SHALL NOT be offered — the backend requires `timestamp`). The column chosen as the Identity column SHALL NOT be offered as the Version column, and the column chosen as the Version column SHALL NOT be offered as the Identity column, so one column can never fill both roles; clearing either selection offers its column again in the other select. Both labels SHALL carry an info affordance stating that these values are promises the service does not verify (the version is assigned at ingest, monotonic, and never backdated; the identity is unique per row) — see "Table schema keys are explained where they are chosen and where they are read" for the affordance and the rest of its text.

Because the scan requires **both** members and the backend accepts one alone — producing a table that is permanently unscannable, since `POST /v1/tables/{name}/schema` answers 409 once the table is `ACTIVE` and no `PATCH` member sets the pair — the surface SHALL treat the pair as all-or-nothing: while exactly one of the two is chosen, Save SHALL be disabled and the empty field SHALL show a validation message naming the other as required alongside it. Choosing neither SHALL be valid and SHALL leave the table unscannable, which is the correct declaration for a source whose row identity is its whole ordering key.

A key selection — the Ordering key, the Partition column, the Identity column and the Version column — SHALL be cleared when the column it references stops qualifying under that field's own rule — removed, retyped, or flipped to nullable or sensitive in the column rows — so the submission can never carry a stale or now-invalid column name. When the referenced column is renamed, the selection SHALL follow it to the new name, in all four fields alike, so that none keeps a name that no longer matches a column; a rename to a blank name SHALL clear the selection. Clearing a Partition column SHALL also clear its granularity. For a `FAILED` table, both selects SHALL be seeded from the values the definition already stores, because an omitted member leaves any stored value unchanged rather than clearing it; when the definition stores either member, both selects SHALL be required (the pair cannot be cleared by re-posting).

While the column-by-column surface is the active one, submitting the schema (a header **Save** action) SHALL send the whole document via `defineTableSchema` (`POST /v1/tables/{name}/schema`) and SHALL send no other request — that surface has no `description` or `tag_order` field, so a save from it can never change catalog metadata. `defineTableSchema` defines the schema **and** materializes the table in the same call — there is no separate save-draft step, and no way to persist an incomplete schema. Each submitted column SHALL carry `display_name` and `description` only when the corresponding field is non-blank, and SHALL omit either key otherwise. The submitted payload SHALL carry `identity_column`/`version_column` only when chosen, and SHALL omit either key when unset. Save SHALL be disabled until the schema is complete for its kind (a source needs at least one valid column, a non-empty ordering key, and a complete-or-absent scan-metadata pair; an enrichment needs a grain key), since the backend rejects an incomplete submission (422) without persisting it. While the draft is unchanged the header offers no Save to disable — see "A changed table draft's header offers Discard and Save", which also states that this completeness gate governs the column-by-column surface only. On success the view SHALL refresh showing the table `ACTIVE` with its live column surface. On a backend (ClickHouse) failure the table becomes `FAILED`; the detail view SHALL present the same schema-definition surface with an indication that activation failed, allowing the user to adjust the schema and resubmit. While the table is not `ACTIVE`, the write-rows action SHALL NOT be offered.

#### Scenario: Saving from the column form sends only the schema request

- **WHEN** the column-by-column surface is the active one and the user, having edited it into a complete draft, saves
- **THEN** `defineTableSchema` is sent and `updateTable` is not sent

#### Scenario: Save is gated on a complete schema

- **WHEN** the author has edited a draft's column-by-column surface and a source table's schema still has no ordering key (or no columns), or an enrichment's schema still has no grain key
- **THEN** the Save action the changed header offers is disabled
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

#### Scenario: Object column cannot be nullable

- **WHEN** a column row's type is Object
- **THEN** its Nullable control is disabled and shows off
- **AND** the built column payload does not send `nullable: true` for that row
- **AND** a row that had Nullable on and is then retyped to Object shows it off

#### Scenario: Map column cannot be nullable

- **WHEN** a column row's type is Map
- **THEN** its Nullable control is disabled and shows off
- **AND** the built column payload does not send `nullable: true` for that row
- **AND** a row that had Nullable on and is then retyped to Map shows it off

#### Scenario: Map is not an element type

- **WHEN** a column row is typed Array
- **THEN** its element-type selector offers neither Array, Object, Enum nor Map

#### Scenario: A type-specific column keeps every row aligned

- **WHEN** a row below the first is typed Array or enum
- **THEN** every row reserves that control's column, empty in the rows whose type does not use it
- **AND** the column's label is shown on the first row only, alongside the other field labels

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
- **THEN** the Partition column field's label carries a focusable info affordance
- **AND** its hint text states that only non-nullable Date/Timestamp columns are selectable

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

- **WHEN** the column currently chosen as the Version column is retyped away from `Timestamp`, removed, or flipped to nullable or sensitive
- **THEN** the Version column selection is cleared, so the submission cannot carry a stale or invalid column name

#### Scenario: The Ordering key offers only columns that can key a table

- **WHEN** the declared column rows include a nullable `string`, a non-nullable `string`, a non-nullable `object`, and a `map`
- **THEN** the Ordering key options are only the non-nullable `string`

#### Scenario: The Partition column offers only non-nullable temporal columns

- **WHEN** the declared column rows include a non-nullable `timestamp`, a nullable `timestamp`, a sensitive non-nullable `date`, and a non-nullable `string`
- **THEN** the Partition column options are the non-nullable `timestamp` and the sensitive non-nullable `date`

#### Scenario: An enrichment's Grain key excludes Object columns of its source

- **WHEN** an enrichment's source table has a `string` column and an `object` column
- **THEN** the Grain key options include the `string` column and exclude the `object` column
- **AND** a `map` column of the source is excluded the same way

#### Scenario: A non-scalar column is not offered as the Identity column

- **WHEN** the declared column rows include a non-nullable, non-sensitive `string`, an `array`, an `object` and a `map`
- **THEN** the Identity column options include the `string` and exclude the `array`, the `object` and the `map`

#### Scenario: An Ordering key or Partition selection is dropped when its column stops qualifying

- **WHEN** the column chosen in the Ordering key or as the Partition column is flipped to nullable, or the Ordering key's column is retyped to `object` or `map`
- **THEN** that selection is removed, and the removed Partition column also clears its granularity
- **AND** the submission carries neither the stale key nor the stale granularity

#### Scenario: Renaming a column carries every selection that references it

- **WHEN** a column chosen as the Ordering key, the Partition column, the Identity column or the Version column is renamed
- **THEN** each of those fields shows the new name and keeps its selection
- **AND** the Ordering key shows no tag for the old name

#### Scenario: Renaming a selected column to a blank name clears the selection

- **WHEN** the name of a column chosen in any of the four key fields is cleared to blank
- **THEN** that selection is cleared

#### Scenario: Identity and Version never offer the same column

- **WHEN** a column is chosen as the Identity column, and it is also a non-nullable, non-sensitive `timestamp`
- **THEN** the Version column options do not include it
- **AND** clearing the Identity column offers it as a Version column again
- **AND** choosing a Version column removes it from the Identity column options in the same way

#### Scenario: A FAILED table's stored pair is seeded and cannot be cleared

- **WHEN** the schema-definition surface renders a `FAILED` source whose definition already stores `identity_column` and `version_column`
- **THEN** both selects are seeded with those stored values
- **AND** both are required, because omitting a member on re-post leaves the stored value unchanged rather than clearing it

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
- `timestamp` — an ISO-8601 literal with a `T` separator and an explicit zone (`2026-01-15T10:00:00.000Z`), the only form the insert path accepts; a space separator, a missing zone, a bare date, or an epoch number is rejected with `422 validation_error`
- `object` — an empty object literal
- `map` — an object literal with one string key mapped to a string value (`{"key": "value"}`), so the snippet shows the bag's shape; a non-string value is not a map entry
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

**The panel's format guidance SHALL be generated from the schema, exactly as its snippets are, and SHALL name this table's own columns rather than the types they happen to have.** For each declared column whose type carries a value-format rule — a timestamp's representation, a decimal's quoting, an array's element shape, a map's string-to-string entries — the panel SHALL state the rule against the column's name, listing the columns of that type when there is more than one. A rule no declared column's type uses SHALL be omitted entirely, so a table of strings and integers shows no format guidance.

The timestamp entry SHALL state the write format — ISO-8601 with `Z` or an explicit offset — **and** that it is the same form queries return, so a value read back can be written unchanged.

Rules that are not per-column SHALL be stated separately from the per-column list. These are the write batch maximum (10 000 rows per request) and, on the Read tab, the row limits below.

The Read tab SHALL state the row limits per surface, because they differ in kind and not only in value:

- **REST** (`/v1/queries/execute-sql`) — a query with no `LIMIT` runs with a default of 100; an explicit `LIMIT` above 1 000 is **rejected**, not reduced.
- **Flight SQL** — an oversized `LIMIT` is **clamped** to the endpoint's cap, never rejected; a query whose result exceeds that cap fails outright and returns no partial page. The cap is deployment-configured, so the panel SHALL describe it rather than printing a number.

After the write snippets — not before them, since the generated snippet already satisfies the rules above — the panel SHALL surface the likeliest rejections, phrased as the message the caller sees and what to change: an unknown column, a missing or null value in a non-nullable column, and an authorization failure. The authorization failure SHALL be stated as the `403 forbidden` the backend actually returns, never as "not authorized". The non-nullable rejection (`422`, "column '<col>' is not nullable and must be present with a non-null value") SHALL name this table's non-nullable, non-platform columns, and SHALL be omitted when the table has none. The unknown-column rejection SHALL be presented as one message covering both a mistaken display name and a `_`-prefixed platform column, because the backend does not distinguish them.

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

#### Scenario: Timestamp columns use the insert format

- **WHEN** a table has a `timestamp` column
- **THEN** its value in the write snippets is the ISO-8601 literal `2026-01-15T10:00:00.000Z`
- **AND** the format guidance states that this is the same form queries return

#### Scenario: Non-nullable columns are named as required

- **WHEN** a writable table declares non-nullable columns
- **THEN** the rejection guidance names each of them as required with a non-null value in every row
- **AND** when every column is nullable, no such rejection is shown

#### Scenario: Decimal columns are quoted

- **WHEN** a table has a `decimal` column
- **THEN** its value in the write snippets is a quoted numeric string

#### Scenario: Array columns are shaped by their element type

- **WHEN** a table has an `array` column whose `element_type` is `string`
- **THEN** its value in the write snippets is an array of quoted strings, and an `array` of `long` yields an array of whole numbers

#### Scenario: Map columns are shown as a string-to-string object

- **WHEN** a table has a `map` column `attributes`
- **THEN** its value in the write snippets is an object with one string key and one string value, in each snippet's own syntax
- **AND** the format guidance states, against `attributes`, that its value is an object whose keys and values are all strings

#### Scenario: Format guidance names columns, not types

- **WHEN** a table has a `decimal` column named `score` and a `timestamp` column named `recorded_at`
- **THEN** the format guidance states the quoting rule against `score` and the representation rule against `recorded_at`, naming neither type

#### Scenario: Several columns share a rule

- **WHEN** a table has two `timestamp` columns
- **THEN** the representation rule is stated once, naming both columns

#### Scenario: Irrelevant rules are omitted

- **WHEN** a table declares no `decimal`, `timestamp`, `date`, `array`, or `map` column
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

### Requirement: Table schema keys are explained where they are chosen and where they are read

Every physical-key field of a table SHALL carry an info affordance on its label, on both surfaces that
present it: the schema-definition surface of a `PENDING`/`FAILED` table, and the read-only
schema-metadata summary of an `ACTIVE` table. The fields are **Ordering key**, **Partition column**,
**Granularity**, **Identity column** and **Version column** for a source, and **Grain key** for an
enrichment.

Each hint SHALL lead with what the choice gives the reader, and SHALL state its restrictions after
that, in language that does not require knowledge of the storage engine: no engine, part, granule, or
SQL-clause vocabulary. Each hint SHALL carry at least the following, and SHALL NOT contradict it:

| Field | The hint SHALL state |
| --- | --- |
| Ordering key | Rows are stored in this order, and filtering or sorting by the key's leading columns reads only part of the table; the most-filtered columns belong first; eligible columns are non-empty and neither Object nor Map |
| Partition column | Rows are grouped into time chunks and a query filtered on this column skips the chunks it does not cover; most tables need no partition; only non-empty Date and Timestamp columns are eligible |
| Granularity | How much time one chunk covers, and that too many small chunks read slower rather than faster |
| Identity column | With Version column, it lets pipelines read the table in batches without handling a row twice; the value must differ in every row, uniqueness is not validated, and repeated values cause skipped rows; eligible columns are non-empty, not sensitive and not Array, Object or Map |
| Version column | It is how a pipeline tells which rows are new since its last pass; the value is expected at write time and must never move backwards, is not validated, and a backdated value causes missed rows; eligible columns are non-empty, non-sensitive Timestamp columns |
| Grain key | It links this table to its source table, a row attaches to every source row carrying the same value, and only one row is kept per value — a repeated key replaces the previous row; Object and Map columns are not eligible |

On the schema-definition surface the key fields SHALL be grouped under a **Keys** sub-header carrying a
single note stating that the keys are set once, when the table is created, and are fixed afterwards.
That statement SHALL appear only in the group note, and SHALL NOT be repeated in the individual hints.
The `ACTIVE` summary SHALL NOT carry the note — its values are already read-only.

The info affordance SHALL be a focusable control whose accessible name is the hint text, so the hint is
reachable by keyboard and addressable by assistive technology; the icon inside it SHALL NOT contribute a
competing name. A non-focusable icon SHALL NOT be used for this purpose anywhere on either surface.

#### Scenario: Every key field on the draft surface is explained

- **WHEN** a `PENDING` **source** table's schema-definition surface renders with a partition column
  chosen
- **THEN** the Ordering key, Partition column, Granularity, Identity column, and Version column labels
  each carry an info affordance
- **AND** a `PENDING` **enrichment** table's surface carries one on its Grain key label

#### Scenario: The one-time nature of the keys is stated once

- **WHEN** a `PENDING` table's schema-definition surface renders
- **THEN** its key fields appear under a Keys sub-header whose note states that the keys are set at
  creation and fixed afterwards
- **AND** no individual key hint repeats that statement

#### Scenario: An active table's key summary carries the same explanations

- **WHEN** an `ACTIVE` source table with an ordering key, a partition, and a scan-metadata pair renders
- **THEN** each summarized key's label carries the same info affordance as the draft surface
- **AND** an `ACTIVE` enrichment table's grain key label carries its own
- **AND** neither summary shows the Keys group note

#### Scenario: A hint is reachable by keyboard and named for assistive technology

- **WHEN** a key field's info affordance renders on either surface
- **THEN** it is a control that can be focused by keyboard, and its accessible name is the hint text

#### Scenario: Key hints state which columns are eligible

- **WHEN** the Ordering key, Partition column or Grain key hint renders
- **THEN** the Ordering key hint states that eligible columns are non-empty and neither Object nor Map
- **AND** the Partition column hint states that only non-empty Date and Timestamp columns are eligible
- **AND** the Grain key hint states that Object and Map columns are not eligible
