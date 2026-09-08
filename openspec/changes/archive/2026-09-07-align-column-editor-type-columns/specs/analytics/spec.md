## MODIFIED Requirements

### Requirement: Define and materialize a table schema

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (a single **Name** field, used as both the column's exposed name and its physical source name since the two are always equal at definition time, type, nullable, optional tag, optional display name, optional description, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared column names, an optional partition (a temporal column + a day/month/year granularity), and an optional scan-metadata pair (`identity_column` and `version_column`); for an **enrichment**, its columns plus a grain key chosen from its source table's columns. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, tag length, display-name length, and description length exactly as the create/add-columns editor validates today, against both the exposed-name and source-name uniqueness constraints (which the merged Name field satisfies identically).

The **display name** and **description** fields SHALL be optional and SHALL be presented inline on the column row alongside its other fields, with field labels rendered on the first row only, as the row's existing fields already are. A blank value SHALL be valid and SHALL be omitted from the submitted column, exactly as a blank tag is — the service treats an absent metadata field as "not set". A display name longer than 128 characters or a description longer than 1024 characters SHALL be rejected client-side with a per-row validation message and SHALL disable Save, because the service answers 422 for either (the same caps and the same message the per-column edit modal already applies).

An Array-typed column row SHALL offer an additional element-type selector, restricted to the non-array, non-object column types (no nested arrays or objects). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column.

A **type-specific** control — an Array row's element type, an enum row's value list (see "A column may be declared with an enum type and a closed, ordered value list") — SHALL be presented as a column of the whole editor, not as an extra field inserted into the one row that has that type: once any row offers one, every row SHALL reserve that column's cell, left empty where the row's type does not use it, so every other field keeps the same position and the same width in every row. The column's label SHALL be rendered on the first row only, alongside the other field labels, including when the first row is not a row that uses the control — a label rendered beside a mid-list row's control is what previously put a field label in the middle of the editor and shifted that row's other fields out of line with the rows above it.

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

### Requirement: A column may be declared with an enum type and a closed, ordered value list

The column-type vocabulary the schema editors offer SHALL include **enum**, a string column whose value set is
closed. It SHALL be offered wherever a column is declared — the schema-definition surface of a `PENDING`/`FAILED`
table and the "Add columns" popup of an `ACTIVE` one — and for both **source** and **enrichment** tables, since
the service accepts it on either.

A column row typed enum SHALL offer a **required** value-list control in place of the element-type control an
Array row offers, laid out as a column of the whole editor on the terms stated for a type-specific control in
"Define and materialize a table schema". The control SHALL present the declared values as an **ordered** list the user can reorder,
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

#### Scenario: A mid-list enum row does not repeat the value column's label

- **WHEN** a row below the first is typed enum
- **THEN** its value list renders without a second copy of the column's label beside the control
- **AND** the column's label stays on the first row, whose value cell is empty

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
