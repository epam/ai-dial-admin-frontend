## ADDED Requirements

### Requirement: JSON editor for a table draft

For a table that is not yet materialized (`status` `PENDING` or `FAILED`) and that the caller may modify, the table detail view SHALL offer a JSON-editor toggle among the header's ordinary actions while the draft has no unsaved changes — once either surface has been edited the toggle is withdrawn with the header's other ordinary actions, as "A changed table draft's header offers Discard and Save" specifies — and the two authoring surfaces SHALL be mutually exclusive: while the editor is the active surface the column-by-column schema-definition surface SHALL NOT be rendered, and toggling the editor off SHALL restore it. The toggle SHALL NOT be offered on an `ACTIVE` table, whose schema is patched through the scoped add/drop/rename/update surface instead.

The edited document SHALL be the schema body the column form would submit for the table's kind — for a **source** `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`; for an **enrichment** `columns`, `grain_key`, `cardinality` — plus the table's catalog metadata `description` and `tag_order`, which the column form presents no field for. A member the column form would omit (an unset partition, an unset scan-metadata pair) SHALL be absent from the seeded document rather than present and empty.

The document SHALL be seeded **once**, when the editor is first opened, from the current column-form state and the table's stored `description`/`tag_order`. It SHALL NOT be re-seeded thereafter — not on a re-render, and not on a later entry into the editor — so an in-progress document is never silently replaced. The single action that does re-seed it is **Discard**, specified in "A changed table draft's header offers Discard and Save"; nothing else replaces the author's document. After the first seed the two surfaces hold independent state: an edit to the document SHALL NOT change the column form, and an edit to the column form SHALL NOT change the document.

Two consequences of the toggle's withdrawal, stated because they bound what the two paragraphs above can be observed to mean. A later entry into the editor is reachable only from an **unchanged** draft — once either surface has been edited the toggle is gone — so seeding once and re-seeding from the stored state are indistinguishable on every reachable path, and the seed-once rule is a statement about the implementation rather than an observable one. For the same reason the two surfaces can never be visited in sequence after a change, so their independence is observable only in what a save from each surface submits: "Saving from the column form sends only the schema request" and "A successful save sends the metadata update before the schema" are what pin it.

While the editor is the active surface, the column form's own completeness rules (at least one valid column, a non-empty ordering key, a complete-or-absent scan-metadata pair, a non-empty grain key, no invalid column row) SHALL NOT gate Save. The only client-side gate SHALL be that the document parses as JSON, reported by the editor's own parse markers: with markers present, Save SHALL send neither request and SHALL surface the parse errors as notifications. No client-side validation of the document's *content* SHALL be performed — an incomplete or otherwise unacceptable document is a service rejection (the data-access service parses request bodies strictly and answers 422 on an unknown property or a missing required field), and that rejection SHALL be shown as-is.

#### Scenario: The editor toggle takes over the draft surface

- **WHEN** the detail view of a `PENDING` or `FAILED` table renders for a caller who may modify it
- **THEN** a JSON-editor toggle is offered among the header's ordinary actions, and activating it replaces the column-by-column schema-definition surface with the JSON document
- **AND** on an `ACTIVE` table no such toggle is offered

#### Scenario: A source draft's document is its schema plus catalog metadata

- **WHEN** the editor is first opened for a source draft whose column form declares columns, an ordering key and a partition, and whose scan-metadata pair is unset
- **THEN** the seeded document carries `columns`, `ordering_key`, `partition_by`, `description` and `tag_order`
- **AND** it carries neither `identity_column` nor `version_column`, and no `grain_key` or `cardinality`

#### Scenario: An enrichment draft's document is its schema plus catalog metadata

- **WHEN** the editor is first opened for an enrichment draft whose column form declares columns and a grain key
- **THEN** the seeded document carries `columns`, `grain_key`, `cardinality`, `description` and `tag_order`
- **AND** it carries none of `ordering_key`, `partition_by`, `identity_column`, `version_column`

#### Scenario: An in-progress document survives a re-render

- **WHEN** the author has edited the document and the surrounding view re-renders from an unrelated state change
- **THEN** the editor still shows the author's edited document, not a fresh seed

#### Scenario: Opening the editor and leaving it does not change what the column form submits

- **WHEN** the author opens the editor on an unchanged draft, makes no edit, toggles the editor off, then edits the column form and saves
- **THEN** the draft still reads as unchanged while the editor is open and after it is closed, so the toggle stays offered throughout
- **AND** the save sends `defineTableSchema` alone, carrying the column form's own body and no `updateTable`

#### Scenario: The column form's completeness rules do not gate Save in the editor

- **WHEN** the editor is the active surface, the author has edited the document, and it parses but omits a member the column form requires — a source document with no `ordering_key`
- **THEN** the Save the changed header offers is enabled, and submitting it sends the requests, so the service's answer decides the outcome

#### Scenario: A document that does not parse blocks the save

- **WHEN** the editor is the active surface, the document carries parse-error markers, and the author submits Save
- **THEN** neither the metadata request nor the schema request is sent, and the parse errors are surfaced as notifications

### Requirement: Pasting another environment's table response into a draft document

Pasting the JSON body of `GET /v1/tables/{name}` copied from another environment SHALL yield a document usable as-is for Save on this table. The client SHALL derive the two request bodies from the **parsed document** rather than from the editor's text, and in doing so it SHALL:

- drop the members the service does not accept on a write and that a read response carries: `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`;
- unpack the nested read shape `grain: { grain_key, cardinality }` into the flat `grain_key` and `cardinality` members the schema body uses, omitting `cardinality` when the nested object does not carry it, and leaving a flat member already present in the document as the winner over the nested one;
- route `description` and `tag_order` to the metadata request;
- pass every other member through to the schema request untouched, including one this console does not otherwise read or write.

The editor's text SHALL NOT be rewritten in response to a paste or to any other accepted edit: the transformation above is applied to what is sent, so the author's text, cursor and whitespace are never rewritten under them.

#### Scenario: Read-only and identity members are dropped from the schema request

- **WHEN** the author pastes a read response carrying `status`, `system`, `permissions`, `column_count`, `name`, `type` and `source_table`, and saves
- **THEN** the schema request body carries none of those seven members

#### Scenario: A nested grain object is unpacked into flat members

- **WHEN** the pasted document is an enrichment table's and carries `grain: { grain_key, cardinality }`, and the author saves
- **THEN** the schema request body carries `grain_key` and `cardinality` as top-level members and no `grain` object

#### Scenario: An unrecognized member is passed through to the schema request

- **WHEN** the pasted document carries a member this console does not otherwise read or write
- **THEN** the schema request body carries that member exactly as pasted

#### Scenario: Pasting does not rewrite the editor's text

- **WHEN** the author pastes a read response into the editor
- **THEN** the editor keeps showing exactly the pasted text, including the members that will be dropped from the request

### Requirement: Saving a table draft as metadata then schema

While the JSON editor is the active surface, the header **Save** action SHALL send two requests in this order:

1. `updateTable` (`PUT /v1/tables/{name}`, `UpdateTableDto` — `description`, `tag_order`; merge-patch semantics, so an absent member leaves the stored value unchanged and `tag_order: []` clears it);
2. `defineTableSchema` (`POST /v1/tables/{name}/schema`), which defines the schema and materializes the table.

The schema request SHALL be sent only if the metadata request succeeded. On success the view SHALL refresh from the server, showing the table `ACTIVE` with its live column surface, and SHALL raise the same success notification the column-form save already raises. On either failure the service's error SHALL be surfaced as-is — its error header, message and request id — with no client-side interpretation, and the view SHALL remain on the draft surface with the author's document intact so it can be corrected and submitted again. Re-submitting SHALL send both requests again, which is safe because the metadata request is a merge-patch.

#### Scenario: A successful save sends the metadata update before the schema

- **WHEN** the editor is the active surface, the author has edited the document into one the service accepts, and saves
- **THEN** `updateTable` is sent before `defineTableSchema`, the success notification is raised, and the refreshed view shows the table `ACTIVE` with its live column surface

#### Scenario: A failed metadata update blocks the schema request

- **WHEN** `updateTable` fails
- **THEN** `defineTableSchema` is not sent, the table's status is unchanged, and the service's error is shown as-is

#### Scenario: A failed schema request leaves the draft for a safe retry

- **WHEN** `updateTable` succeeds and `defineTableSchema` fails
- **THEN** the service's error is shown as-is, the view stays on the draft surface with the document intact, and saving again re-sends both requests

### Requirement: A changed table draft's header offers Discard and Save

For a table that is not yet materialized (`status` `PENDING` or `FAILED`) and that the caller may modify, the detail view SHALL adopt this console's changed-entity header convention, which every other entity view already follows: while the draft has unsaved changes the header's ordinary actions give way to **Discard** and **Save**.

A draft SHALL be treated as **changed** when either authoring surface differs from the table's stored state:

- the **column-by-column surface**, when the schema body it would submit differs from the schema body the table's stored definition yields — so a `PENDING` table whose form has not been touched and a `FAILED` table freshly seeded from its stored definition are both *unchanged*;
- the **JSON document**, when it differs from the document that same stored state seeds.

While the JSON editor is the active surface, unresolved parse markers SHALL additionally count as changed, because a marker suppresses the parse and the last successfully parsed document therefore cannot be compared — leaving the header in its ordinary state would offer no way out of a broken document but to fix it.

While the draft is changed the header SHALL present **Discard** and **Save**, and SHALL withdraw its ordinary actions — **Manage access**, **Delete table** and the JSON-editor toggle. Discard SHALL be confirmed through this console's shared discard confirmation before it takes effect. Both actions SHALL be presented only to a caller who may modify the table; a caller who may only view, delete or manage access SHALL never see them, and SHALL keep whichever ordinary actions its permissions already allow.

While the draft is **unchanged** the header SHALL present its ordinary actions — **Manage access**, **Delete table** and the JSON-editor toggle — and SHALL offer **neither Save nor Discard**, exactly as this console's convention behaves on every other entity view. Save is therefore reachable only while the draft is changed. One consequence is accepted deliberately: an untouched `FAILED` draft SHALL NOT be re-submittable as-is — its author must first make an edit that either surface registers as a change.

Save's **disabled** state SHALL follow the active surface, and SHALL be the convention's:

- from the **column-by-column surface**, Save SHALL be disabled while that surface's own completeness rules are unmet — the rules "Define and materialize a table schema" states;
- from the **JSON editor**, Save SHALL NOT be disabled; its only client-side gate SHALL be the parse markers "JSON editor for a table draft" specifies.

Save SHALL send from each surface exactly the requests that surface already sends: "Saving a table draft as metadata then schema" in the editor, `defineTableSchema` alone from the column form.

**Discard** SHALL restore both surfaces to the table's stored state: the column form to the values the stored definition seeds, and — if a document has been seeded — the JSON document to the document that stored state yields. Any parse markers and the notifications they raised SHALL be cleared first, so a stale marker cannot hold the changed header up on its own. The active surface SHALL NOT change: an author who discards while the editor is open stays in the editor, looking at the restored document.

Nothing about an `ACTIVE` table SHALL change. The changed-entity header SHALL NOT be presented there, and that view's own actions — Add columns, Add rows, Connect — SHALL be presented exactly as today.

#### Scenario: Editing the JSON document swaps the header's actions

- **WHEN** the JSON editor is the active surface on a modifiable draft and the author edits the document
- **THEN** the header offers Discard and Save
- **AND** Manage access, Delete table and the JSON-editor toggle are no longer offered

#### Scenario: Editing the column form swaps the header's actions

- **WHEN** the author changes a value on a modifiable draft's column-by-column surface
- **THEN** the header offers Discard and Save, and Manage access, Delete table and the JSON-editor toggle are no longer offered

#### Scenario: An untouched draft keeps its ordinary header actions

- **WHEN** a modifiable draft renders and neither surface has been edited
- **THEN** the header offers Manage access, Delete table and the JSON-editor toggle
- **AND** it offers neither Save nor Discard

#### Scenario: An untouched FAILED draft offers no Save

- **WHEN** the detail view of a `FAILED` table renders for a caller who may modify it, both surfaces seeded from the table's stored definition and neither edited
- **THEN** no Save action is offered, so the stored definition cannot be re-submitted until an edit makes the draft changed

#### Scenario: Unresolved parse markers hold the changed header up

- **WHEN** the JSON editor is the active surface and the document carries parse-error markers
- **THEN** the header offers Discard and Save even though the last successfully parsed document is unchanged

#### Scenario: Discard restores both surfaces to the stored state

- **WHEN** the draft is changed and the author confirms Discard
- **THEN** the column form shows the values the table's stored definition seeds, the JSON document shows the document that stored state yields, the editor is still the active surface if it was, and the header returns to its ordinary actions

#### Scenario: Discard is confirmed before it takes effect

- **WHEN** the author activates Discard on a changed draft
- **THEN** a discard confirmation is presented, and dismissing it leaves both surfaces and the header as they were

#### Scenario: The changed header is offered only to a caller who may modify

- **WHEN** a draft's detail view renders for a caller who may delete or manage access but may not modify
- **THEN** neither Discard nor Save is offered in any state, and the actions that caller's permissions do allow are presented as before

#### Scenario: An ACTIVE table's header is untouched

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with full permissions
- **THEN** no Discard action is offered
- **AND** Manage access, Delete table, Add columns, Add rows and Connect are presented exactly as before this change

## MODIFIED Requirements

### Requirement: Define and materialize a table schema

For a not-yet-materialized table (`status` `PENDING` or `FAILED`), the table detail view SHALL present a schema-definition surface in place of the live column surface. The surface SHALL let the user define the whole physical schema: for a **source**, a repeatable set of columns (a single **Name** field, used as both the column's exposed name and its physical source name since the two are always equal at definition time, type, nullable, optional tag, optional display name, optional description, optional sensitive flag, and — for a column typed Array — a required element type), an ordering key chosen from the declared column names, an optional partition (a temporal column + a day/month/year granularity), and an optional scan-metadata pair (`identity_column` and `version_column`); for an **enrichment**, its columns plus a grain key chosen from its source table's columns. Cardinality SHALL NOT be user-selectable — the enrichment submission SHALL send the single supported value (`zero_or_one`). Column rows SHALL be validated for identifier grammar, uniqueness, tag length, display-name length, and description length exactly as the create/add-columns editor validates today, against both the exposed-name and source-name uniqueness constraints (which the merged Name field satisfies identically).

The same document MAY instead be authored as JSON — see "JSON editor for a table draft" — in which case that requirement's seeding rule, save gate and submission sequence apply and the rules in this requirement's remaining paragraphs govern the column-by-column surface only.

The **display name** and **description** fields SHALL be optional and SHALL be presented inline on the column row alongside its other fields, with field labels rendered on the first row only, as the row's existing fields already are. A blank value SHALL be valid and SHALL be omitted from the submitted column, exactly as a blank tag is — the service treats an absent metadata field as "not set". A display name longer than 128 characters or a description longer than 1024 characters SHALL be rejected client-side with a per-row validation message and SHALL disable Save, because the service answers 422 for either (the same caps and the same message the per-column edit modal already applies).

An Array-typed column row SHALL offer an additional element-type selector, restricted to the non-array, non-object column types (no nested arrays or objects). Submitting a row typed Array without an element type SHALL be rejected client-side (the backend also rejects it, 422). An Array-typed row's Nullable control SHALL be disabled and forced off — the backend rejects a nullable array column.

For a **source** table, the Partition column field's label SHALL carry an info affordance whose text includes the fact that only Date/Timestamp-typed columns are selectable, since that restriction is not otherwise visually obvious; the affordance and the rest of its text follow "Table schema keys are explained where they are chosen and where they are read". The Granularity field SHALL be rendered only once a partition column is selected; deselecting the partition column (including indirectly, by retyping the selected column away from Date/Timestamp) SHALL also clear any chosen granularity.

For a **source** table only, the surface SHALL offer two additional optional selects — **Identity column** and **Version column** — the pair the governed incremental scan pages a source by. An **enrichment** SHALL offer neither (the backend rejects either member for an enrichment with 422). The Identity column options SHALL be the declared columns that are non-nullable and not sensitive; the Version column options SHALL be that same set narrowed to `Timestamp`-typed columns (`Date` SHALL NOT be offered — the backend requires `timestamp`). Both labels SHALL carry an info affordance stating that these values are promises the service does not verify (the version is assigned at ingest, monotonic, and never backdated; the identity is unique per row) — see "Table schema keys are explained where they are chosen and where they are read" for the affordance and the rest of its text.

Because the scan requires **both** members and the backend accepts one alone — producing a table that is permanently unscannable, since `POST /v1/tables/{name}/schema` answers 409 once the table is `ACTIVE` and no `PATCH` member sets the pair — the surface SHALL treat the pair as all-or-nothing: while exactly one of the two is chosen, Save SHALL be disabled and the empty field SHALL show a validation message naming the other as required alongside it. Choosing neither SHALL be valid and SHALL leave the table unscannable, which is the correct declaration for a source whose row identity is its whole ordering key.

A selection SHALL be cleared when the column it references stops qualifying — renamed, removed, retyped, or flipped to nullable or sensitive in the column rows — so the submission can never carry a stale or now-invalid column name. For a `FAILED` table, both selects SHALL be seeded from the values the definition already stores, because an omitted member leaves any stored value unchanged rather than clearing it; when the definition stores either member, both selects SHALL be required (the pair cannot be cleared by re-posting).

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
- **AND** its hint text states that only Date/Timestamp columns are selectable

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

The **catalog list's** row action menu SHALL let the user edit a table's catalog metadata — its `description` and its per-table `tag_order` — in any status, via `updateTable` (`PUT /v1/tables/{name}`). `tag_order` SHALL be presented as a reorderable list of the distinct tags currently declared on the table's columns, and the resulting ordered list of tag names SHALL be sent to the backend; an empty order SHALL clear it and an unchanged order SHALL be left as-is (merge-patch semantics). On success the catalog SHALL refresh from the server. This surface SHALL NOT be offered for system-owned tables.

The catalog list SHALL remain the only surface that offers this editor, and the table detail view SHALL NOT present a description or tag-order editing surface for an `ACTIVE` table. For a `PENDING`/`FAILED` table there is one exception, which exists because that popup builds its reorder list from the tags declared on the table's **existing** columns and a draft has none: the detail view's draft JSON document (see "JSON editor for a table draft") SHALL carry `description` and `tag_order`, and a save from that surface SHALL submit them through the same `updateTable` endpoint before the schema request, as "Saving a table draft as metadata then schema" specifies.

#### Scenario: Description is edited via the table update endpoint

- **WHEN** the user activates a row's edit action, changes the table description, and submits
- **THEN** `updateTable` is sent with the new description and the catalog refreshes

#### Scenario: Tag order is reordered and saved

- **WHEN** the user reorders the table's column tags and submits
- **THEN** `updateTable` is sent with the ordered `tag_order` list and the catalog refreshes

#### Scenario: A draft's metadata is submitted from the detail view, an active table's is not

- **WHEN** a `PENDING`/`FAILED` table is saved from the detail view's JSON editor with a `description` and a `tag_order` in the document
- **THEN** `updateTable` is sent carrying those two members
- **AND** the detail view of an `ACTIVE` table offers no description or tag-order editing surface
