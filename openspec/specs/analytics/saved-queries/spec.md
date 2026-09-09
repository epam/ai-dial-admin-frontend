# Analytics Saved Queries

## Purpose

Saved queries as addressable objects: the storage contract, the list page, create/duplicate/edit/delete, loading a stored query into the builder, unsaved-change handling, and scope-based permission gating.

## Requirements

### Requirement: Saved query storage contract

A saved query SHALL be an addressable object holding authored **intent** only: a name, an optional description and tag, a sharing scope, exactly one of a structured query body or a SQL body, the author's time intent, how the result was last rendered, and a chart configuration. The frontend SHALL treat the analytics data-access service's `/v1/saved-queries` contract as authoritative and SHALL NOT extend it.

The write payload SHALL consist of exactly these nine members: `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, `chart`. The frontend SHALL NOT send `id`, `owner_id`, `owner_email`, `source`, `generation`, `created_at`, `updated_at`, or `params` on a create or a replace — the service rejects each with `422`, so a payload type distinct from the response type SHALL be used rather than a subset of it.

The response's optional members SHALL be modelled as optional rather than nullable: the service omits absent members rather than emitting `null`.

`source` SHALL be modelled as a **list of entity names**, not a single name: a SQL body may be a composite statement — a join, a CTE, a derived table, or a subquery — that reads from several entities, and the service returns every entity the body reads. The service returns the list non-empty and sorted alphabetically, and returns exactly one element for a structured body. The frontend SHALL treat it as server-derived and read-only, SHALL NOT assume a particular element is the query's outer or governing entity, and SHALL tolerate a response whose `source` is absent or empty rather than failing to render the query. Because a deployment may still run a service build that returns `source` as a single name, the frontend SHALL accept that form too and read it as a one-element list. `generation` SHALL be treated as a change counter for display only; because the service accepts no precondition header, concurrent writes are last-write-wins and the frontend SHALL NOT present a conflict-resolution affordance.

#### Scenario: The write payload carries only the nine accepted members

- **WHEN** a query is created or saved
- **THEN** the request body contains only `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, and `chart`
- **AND** no server-assigned member is present

#### Scenario: Exactly one body is sent

- **WHEN** the query being saved was authored in the SQL view with non-blank SQL text
- **THEN** the payload carries `sql` and omits `query`

#### Scenario: A structured body is sent when the SQL buffer is not in play

- **WHEN** the query being saved was authored in the Builder or JSON view
- **THEN** the payload carries `query` and omits `sql`

#### Scenario: A multi-entity source is read as a list

- **WHEN** the service returns a saved query whose `source` names two entities
- **THEN** both are retained as the query's sources
- **AND** neither is treated as the only source

#### Scenario: An older service's single-name source still works

- **WHEN** the service returns a saved query whose `source` is a single name rather than a list
- **THEN** it is read as a one-element list
- **AND** the query's primary source is that name, not its first character

### Requirement: A saved query's primary source

A saved query's `source` is a set of entities, so every surface that needs exactly one entity — the
server-side schema prefetch, the toolbar's source selector, the SQL editor's autocomplete, and the
assistant's schema message — SHALL use the query's **primary source**, derived in one place from the
stored query alone: the structured body's `entity` when the query carries a structured body,
otherwise the first element of `source`. Because the service sorts `source` alphabetically, the
primary source of a composite SQL query is its alphabetically first entity: an arbitrary but stable
pick, chosen so field autocomplete keeps working rather than being switched off for composite
queries.

The frontend SHALL NOT infer a primary source from the SQL text, and SHALL NOT merge the schemas of
several sources into one field list. A query with neither a structured body nor a non-empty `source`
SHALL resolve to no primary source, and the page SHALL then load no schema rather than requesting
one for an empty entity name.

#### Scenario: A structured body's own entity is the primary source

- **WHEN** a saved query carries a structured body targeting `dial_usage_log` and a one-element `source`
- **THEN** its primary source is `dial_usage_log`

#### Scenario: A single-source SQL body resolves to that source

- **WHEN** a saved query carries a SQL body and a one-element `source`
- **THEN** its primary source is that element

#### Scenario: A composite SQL body resolves to its first source

- **WHEN** a saved query carries a SQL body joining two entities, so `source` holds both sorted alphabetically
- **THEN** its primary source is the first of the two
- **AND** the fields offered to the SQL autocomplete are that entity's fields only

#### Scenario: No source at all loads no schema

- **WHEN** a saved query carries neither a structured body nor a non-empty `source`
- **THEN** no entity schema is requested
- **AND** the builder renders without fields rather than reporting a failed schema load

### Requirement: Saved query server API layer

The server API layer SHALL expose the saved-query endpoints of the analytics data-access service through the existing `analyticsDataApi` client and through server actions under `src/app/[lang]/queries/actions.ts` that inject the user token. List and single reads SHALL return the typed value or `null`; create, replace, and delete SHALL return a `ServerActionResponse`, because their callers branch on the machine error code carried on the failure envelope.

#### Scenario: List is scoped

- **WHEN** the saved queries for a scope are requested
- **THEN** the request is sent to `GET /v1/saved-queries` with that scope as a query parameter

#### Scenario: Writes surface the failure envelope

- **WHEN** a create, replace, or delete fails
- **THEN** the action returns a `ServerActionResponse` carrying the service's machine error code and message

### Requirement: Queries list page

The Analytics group SHALL provide a `/queries` page listing the saved queries visible to the caller. The page SHALL be an `async` server component gated by the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is denied. Because the service returns every visible row unpaged and offers no server-side sorting or filtering, the page SHALL fetch the full list on the server and the grid SHALL sort and filter client-side.

The service lists one scope per call, so the page SHALL fetch both the caller's personal scope and the common scope and present them as one list. The grid SHALL show, at minimum, the query's name, description, sources, tag, scope, the editor its body opens in, the author's display email, and its created and updated timestamps. The Source column SHALL render **every** entity the query reads, comma-separated in the order the service returns them, and its sorting, text filtering, and tooltip SHALL all read that same rendered text so a multi-source row is filterable by any of its entity names. A row whose `source` is absent or empty SHALL render an empty Source cell rather than failing. The editor column SHALL be derived from the body — a SQL body is SQL, a structured body the visual builder can represent is Builder, and any other structured body is JSON — and SHALL NOT be read from a stored field. The author column SHALL tolerate an absent value, which the service reports whenever there is no email to record.

Activating a row SHALL navigate to that query's page. Each row SHALL offer an actions menu with Open in new tab, Edit, and Delete. The page SHALL offer a Create action. When the caller has no visible saved queries the grid SHALL show an empty state.

#### Scenario: Both scopes appear in one list

- **WHEN** the caller has personal saved queries and common saved queries exist
- **THEN** the grid lists both
- **AND** each row shows its scope

#### Scenario: A multi-source query lists every source

- **WHEN** a listed saved query reads from two entities
- **THEN** its Source cell shows both names, comma-separated
- **AND** filtering the Source column by either name keeps the row

#### Scenario: The editor column is derived from the body

- **WHEN** a listed saved query carries a structured body whose filter nesting the visual builder cannot represent
- **THEN** its editor column reads JSON

#### Scenario: A row opens its query

- **WHEN** the user activates a grid row
- **THEN** the browser navigates to that saved query's page

#### Scenario: Row actions are offered

- **WHEN** the user opens a row's actions menu
- **THEN** Open in new tab, Edit, and Delete are offered

#### Scenario: Empty state when nothing is visible

- **WHEN** the caller has no visible saved queries
- **THEN** the grid shows an empty state rather than an empty table

### Requirement: Create a query

The Queries page SHALL offer a create modal collecting a **required** name and an optional description and tag. The modal SHALL NOT ask for a source or a scope. Submission SHALL be blocked while the name is blank.

Because the service refuses a saved query that could not execute as stored, the create SHALL send a minimal executable structured body targeting a default source — the first queryable entity — in row mode, together with a table result view. Scope SHALL be omitted, which the service resolves to personal.

On success the modal SHALL close, a success notification SHALL be shown, and the browser SHALL navigate to the new query's page so the user authors it there. On failure an error notification SHALL be shown carrying the service's message and the request identifier, and the modal SHALL stay open with the entered values intact.

#### Scenario: Name is required

- **WHEN** the create modal is open and the name field is blank
- **THEN** the submit action is disabled

#### Scenario: A created query is executable as stored

- **WHEN** the user submits the create modal with a name only
- **THEN** the request carries that name and a structured body naming the default source in row mode
- **AND** no source or scope field was presented to the user

#### Scenario: Success navigates to the new query

- **WHEN** a create succeeds
- **THEN** a success notification is shown
- **AND** the browser navigates to the created query's page

#### Scenario: Failure keeps the modal open

- **WHEN** a create fails
- **THEN** an error notification carries the service's message and the request identifier
- **AND** the modal remains open with the entered values

### Requirement: Edit query metadata

A saved query's name, description, tag, and scope SHALL be editable through a single modal, reachable from the Edit action in the Queries grid's row menu and from an Edit control on the query's own page. The modal SHALL reuse the same field set as the create modal, so the two cannot diverge.

Editing metadata SHALL replace the stored query with its body unchanged. A blank name SHALL block submission. The scope field SHALL be offered only when the caller is a full administrator, because the service permits common writes only to that role.

On success a success notification SHALL be shown and the affected view SHALL reflect the new values. On failure an error notification SHALL be shown.

#### Scenario: Metadata edits leave the body alone

- **WHEN** the user changes only the name in the edit modal and submits
- **THEN** the replace request carries the same body the query already had
- **AND** the new name

#### Scenario: Scope is administrator-only

- **WHEN** a caller who is not a full administrator opens the edit modal
- **THEN** no scope field is offered

#### Scenario: Edit is reachable from both surfaces

- **WHEN** the user activates Edit from a grid row, or the Edit control on a query's page
- **THEN** the same modal opens, seeded with that query's current metadata

### Requirement: Delete a query

A saved query SHALL be deletable from the Queries grid's row actions menu, behind the application's standard delete confirmation. On success the row SHALL disappear from the grid and a success notification SHALL be shown. On failure an error notification SHALL be shown. Delete SHALL be offered only when the caller may write the row's scope.

#### Scenario: Delete asks for confirmation

- **WHEN** the user activates Delete on a grid row
- **THEN** a confirmation naming the query is shown before anything is deleted

#### Scenario: A confirmed delete removes the row

- **WHEN** the user confirms the deletion and it succeeds
- **THEN** a success notification is shown
- **AND** the query is no longer listed

### Requirement: Duplicate a query

A saved query SHALL be duplicable from the Queries grid's row actions menu. Activating Duplicate SHALL
open a modal that reuses the same field set as the create and edit modals — a **required** name and an
optional description and tag — so the three cannot diverge. A blank name SHALL block submission. The
service places no uniqueness constraint on a saved query's name, so a name already in use SHALL NOT
block submission and SHALL NOT be pre-checked against the existing list.

The modal SHALL be seeded from the source query: its description and tag SHALL be carried over, and the
name SHALL be pre-filled with the source's name plus a copy suffix, so submitting without editing
produces a distinguishable copy rather than an identical one.

Submission SHALL create a **new** saved query. The copy SHALL carry the source's body, time intent,
result view, and chart configuration across unchanged; only name, description, tag, and scope SHALL come
from the modal. The source query SHALL NOT be modified.

On success the modal SHALL close, a success notification SHALL be shown, and the browser SHALL navigate
to the new query's page, matching the behaviour of create. On failure an error notification SHALL be
shown following the machine-error-code rules, and the modal SHALL stay open with the entered values
intact. Because the service revalidates a body on create, a stored query whose body it no longer accepts
SHALL fail at this point and SHALL be reported as a body refusal carrying the service's own message.

#### Scenario: Duplicate is offered on a row

- **WHEN** the user opens a row's actions menu in the Queries grid
- **THEN** Duplicate is offered

#### Scenario: The modal is seeded from the source

- **WHEN** the user activates Duplicate on a saved query
- **THEN** the modal opens with the source's description and tag
- **AND** the name field holds the source's name with a copy suffix

#### Scenario: Name is required

- **WHEN** the duplicate modal is open and the name field is blank
- **THEN** the submit action is disabled

#### Scenario: A name already in use is accepted

- **WHEN** the user submits the duplicate modal with a name another visible query already uses
- **THEN** the submission proceeds without a uniqueness error

#### Scenario: The copy carries the source's body

- **WHEN** the user submits the duplicate modal
- **THEN** the create request carries the source's body, time intent, result view, and chart unchanged
- **AND** the metadata entered in the modal
- **AND** the source query is left unchanged

#### Scenario: Success navigates to the copy

- **WHEN** a duplicate succeeds
- **THEN** a success notification is shown
- **AND** the browser navigates to the new query's page, not the source's

#### Scenario: Failure keeps the modal open

- **WHEN** a duplicate fails
- **THEN** an error notification is shown
- **AND** the modal remains open with the entered values

#### Scenario: A body the service no longer accepts fails at duplicate time

- **WHEN** the user duplicates a stored query whose body the service now refuses
- **THEN** an error notification carries the service's message together with repair guidance
- **AND** no copy is created

### Requirement: A query page loads its stored query into the builder

The Analytics group SHALL provide a `/queries/{id}` page rendering the Query Builder seeded from the stored saved query. The page SHALL be an `async` server component gated by the same Analytics access check as the other Analytics pages, and SHALL resolve to a not-found result when the query cannot be read — the service reports a query the caller may not see as absent rather than forbidden, so the two cases SHALL be indistinguishable to the user.

The page SHALL fetch the schema of **the stored query's primary source**, not the first queryable entity's. The view the builder opens in SHALL be derived from the body: a SQL body opens the SQL view with the stored text, a structured body the visual builder can represent opens the Builder view hydrated from it, and any other structured body opens the JSON view showing it. The heading SHALL show the query's name.

A query reading from several entities SHALL open the same way — its stored SQL shown in the SQL view — with the schema of its primary source loaded. Switching such a query to the Builder or JSON view SHALL follow the existing translation behaviour for SQL the DSL cannot express: the service refuses the translation and the discard guard applies.

The stored time intent SHALL be applied to the toolbar time filter: a relative intent selects that period, an absolute intent selects that custom range, and an absent intent leaves the toolbar at its default. A relative period the frontend does not recognise SHALL leave the toolbar unchanged and SHALL NOT prevent the query from loading.

#### Scenario: A structured body opens in the Builder view

- **WHEN** the user opens a query whose structured body the visual builder can represent
- **THEN** the Builder view is shown reflecting that query
- **AND** the heading shows the query's name

#### Scenario: An unrepresentable structured body opens in the JSON view

- **WHEN** the user opens a query whose structured body the visual builder cannot represent
- **THEN** the JSON view is shown containing that body

#### Scenario: A SQL body opens in the SQL view

- **WHEN** the user opens a query carrying a SQL body
- **THEN** the SQL view is shown containing the stored statement
- **AND** entering the SQL view does not overwrite it with a re-seeded translation

#### Scenario: The schema loaded is the query's own source

- **WHEN** the user opens a query whose source is not the first queryable entity
- **THEN** the fields available to the builder are that source's fields

#### Scenario: A composite query opens with its primary source's schema

- **WHEN** the user opens a query whose SQL joins two entities
- **THEN** the SQL view shows the stored statement
- **AND** the schema requested is that of the query's primary source, so the toolbar shows that entity and its fields are available
- **AND** the page does not report a failed schema load

#### Scenario: An unreadable query is not found

- **WHEN** the user opens an id that does not exist, or one belonging to another caller's personal scope
- **THEN** the page resolves to a not-found result, identically in both cases

#### Scenario: An unrecognised relative period still loads

- **WHEN** a stored query carries a relative period the frontend does not recognise
- **THEN** the query loads and the toolbar time filter is left as it was

### Requirement: Saving persists authored intent, not a resolved range

Saving SHALL persist the query as authored intent. The persisted structured body SHALL be serialized **without** the toolbar's time bound, and the authored range SHALL travel separately as time intent: a preset period SHALL be stored as its relative token and SHALL NOT be resolved to instants, and a custom range SHALL be stored as an absolute pair. An absolute pair whose start is after its end SHALL be ordered before it is sent.

This is the load-bearing distinction: serializing the range into the body — as the Run and JSON-view paths correctly do — would freeze the query to the day it was authored, and the service cannot detect that because a frozen range is a valid query.

Saving SHALL replace the stored query and SHALL then re-read it so the page reflects what was persisted. On success a success notification SHALL be shown; on failure an error notification SHALL be shown and the unsaved edits SHALL be preserved.

#### Scenario: A relative period is stored as a token

- **WHEN** the user saves a query with a preset time period selected
- **THEN** the payload's time intent names that period as a relative token
- **AND** the payload's structured body contains no timestamp range predicate

#### Scenario: A custom range is stored as instants

- **WHEN** the user saves a query with a custom range selected
- **THEN** the payload's time intent carries that range as an absolute pair
- **AND** the payload's structured body contains no timestamp range predicate

#### Scenario: A relative period survives a round trip

- **WHEN** a query saved with a preset period is reopened later
- **THEN** the toolbar shows that same preset period, not a fixed range

#### Scenario: A failed save keeps the edits

- **WHEN** a save fails
- **THEN** an error notification is shown
- **AND** the user's unsaved edits remain in the builder

### Requirement: Unsaved changes and discard on a query page

A query page SHALL indicate whether it holds unsaved changes and SHALL offer Save and Discard controls in the builder toolbar's actions area, leaving the page's layout otherwise as it is. Unsaved-change detection SHALL compare the payload the page would save against the payload the stored query represents, so it cannot disagree with what is actually persisted; it SHALL NOT compare builder state directly, which carries catalog data and generated identifiers that differ between two states representing the same query.

Every member of the write payload SHALL count toward unsaved changes — the body, the time intent, the result view, and the chart configuration alike. Save SHALL be unavailable when nothing has changed, because the service refreshes the modification timestamp on every write and that timestamp is the order the list is shown in.

Discard SHALL ask for confirmation and, on confirmation, SHALL restore the page to the stored query. This discard SHALL be distinct from the existing guard on switching out of a written view: that guard resets the builder to its starting defaults, whereas this one reverts to the last saved query.

#### Scenario: An edit enables Save and Discard

- **WHEN** the user changes anything the payload carries — a filter, the time period, the result view, or the chart configuration
- **THEN** the page indicates unsaved changes and Save and Discard become available

#### Scenario: Save is unavailable when nothing changed

- **WHEN** the page holds no unsaved changes
- **THEN** Save is unavailable

#### Scenario: Discard reverts to the last saved query

- **WHEN** the user discards and confirms
- **THEN** the builder, the time filter, the result view, and the chart configuration return to the stored query's values
- **AND** the page no longer indicates unsaved changes

#### Scenario: Discard can be cancelled

- **WHEN** the user discards and cancels the confirmation
- **THEN** the unsaved edits are still present

### Requirement: Result view and chart configuration round-trip

The result view a query was last rendered in, and its chart configuration, SHALL be part of what a saved query stores and restores. Reopening a saved query SHALL show it in its stored result view, and a stored chart configuration SHALL survive the page's first run rather than being reset by it. A stored chart configuration whose axis columns are not set SHALL be re-derived from the result. The chart configuration SHALL be stored without interpretation — it names result columns, not schema fields.

#### Scenario: A stored chart view is restored

- **WHEN** the user opens a query saved in the chart view and runs it
- **THEN** the result is shown as a chart using the stored chart type and axis columns

#### Scenario: An unset axis is re-derived

- **WHEN** the user opens a query whose stored chart configuration has no axis columns set and runs it
- **THEN** the chart selects its default columns from the result

#### Scenario: Changing the result view is an unsaved change

- **WHEN** the user switches a saved query from the table view to the chart view
- **THEN** the page indicates unsaved changes

### Requirement: Scope-based permission gating for saved queries

Writing a common-scope saved query SHALL require a full administrator, matching the service's rule. On a common query the caller may not write, Save, Edit, and Delete SHALL be unavailable rather than offered and allowed to fail. A caller's own personal queries SHALL always be writable by them.

#### Scenario: A non-administrator cannot write a common query

- **WHEN** a caller who is not a full administrator opens a common-scope saved query
- **THEN** Save and Edit are unavailable
- **AND** Delete is not offered for that row in the grid

#### Scenario: An administrator can write a common query

- **WHEN** a full administrator opens a common-scope saved query
- **THEN** Save, Edit, and Delete are available

### Requirement: Saved query failures are reported by machine error code

A failed saved-query request SHALL be reported by branching on the machine error code the service puts on its failure envelope, not on the HTTP status alone. Each recognised code SHALL map to its own guidance. A refusal caused by the body — a validation failure, a rejected literal, or a bad request — SHALL surface the service's own message alongside that guidance, because it names the offending part of the query; a refusal about identity or visibility SHALL NOT.

A query reported as absent SHALL be treated as gone: the user SHALL be told and returned to the Queries list, and the list SHALL be re-read.

No message SHALL disclose whether a query exists but is invisible, or whether a column exists but is restricted.

#### Scenario: A body refusal shows the service's message

- **WHEN** a save is refused because the body is invalid
- **THEN** the notification carries the service's message together with guidance on how to repair the query

#### Scenario: A visibility refusal does not

- **WHEN** a save is refused because the query is absent or not visible
- **THEN** the notification explains the query is no longer available without stating whether it exists

#### Scenario: A vanished query returns the user to the list

- **WHEN** the query the page is showing is reported as absent by a save
- **THEN** the user is notified and returned to the Queries list
