## ADDED Requirements

### Requirement: Saved query storage contract

A saved query SHALL be an addressable object holding authored **intent** only: a name, an optional description and tag, a sharing scope, exactly one of a structured query body or a SQL body, the author's time intent, how the result was last rendered, and a chart configuration. The frontend SHALL treat the analytics data-access service's `/v1/saved-queries` contract as authoritative and SHALL NOT extend it.

The write payload SHALL consist of exactly these nine members: `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, `chart`. The frontend SHALL NOT send `id`, `owner_id`, `owner_email`, `source`, `generation`, `created_at`, `updated_at`, or `params` on a create or a replace — the service rejects each with `422`, so a payload type distinct from the response type SHALL be used rather than a subset of it.

The response's optional members SHALL be modelled as optional rather than nullable: the service omits absent members rather than emitting `null`.

`source` SHALL be treated as server-derived and read-only. `generation` SHALL be treated as a change counter for display only; because the service accepts no precondition header, concurrent writes are last-write-wins and the frontend SHALL NOT present a conflict-resolution affordance.

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

The service lists one scope per call, so the page SHALL fetch both the caller's personal scope and the common scope and present them as one list. The grid SHALL show, at minimum, the query's name, description, source, tag, scope, the editor its body opens in, the author's display email, and its created and updated timestamps. The editor column SHALL be derived from the body — a SQL body is SQL, a structured body the visual builder can represent is Builder, and any other structured body is JSON — and SHALL NOT be read from a stored field. The author column SHALL tolerate an absent value, which the service reports whenever there is no email to record.

Activating a row SHALL navigate to that query's page. Each row SHALL offer an actions menu with Open in new tab, Edit, and Delete. The page SHALL offer a Create action. When the caller has no visible saved queries the grid SHALL show an empty state.

#### Scenario: Both scopes appear in one list

- **WHEN** the caller has personal saved queries and common saved queries exist
- **THEN** the grid lists both
- **AND** each row shows its scope

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

### Requirement: A query page loads its stored query into the builder

The Analytics group SHALL provide a `/queries/{id}` page rendering the Query Builder seeded from the stored saved query. The page SHALL be an `async` server component gated by the same Analytics access check as the other Analytics pages, and SHALL resolve to a not-found result when the query cannot be read — the service reports a query the caller may not see as absent rather than forbidden, so the two cases SHALL be indistinguishable to the user.

The page SHALL fetch the schema of **the stored query's own source**, not the first queryable entity's. The view the builder opens in SHALL be derived from the body: a SQL body opens the SQL view with the stored text, a structured body the visual builder can represent opens the Builder view hydrated from it, and any other structured body opens the JSON view showing it. The heading SHALL show the query's name.

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

### Requirement: The query assistant is given the selected source and its columns

A request to the query assistant SHALL lead with a system message describing the source currently
selected in the toolbar: its entity name, and for each of its fields the field's name, type, and the
display name and description the schema defines. A field the schema marks sensitive SHALL be marked as
such, so the assistant can avoid proposing a literal comparison the service would refuse to store.

The message SHALL carry **schema only**. No row data, and no value read out of the queried store, SHALL
be sent to the assistant deployment.

The message SHALL NOT appear in the visible transcript, and SHALL be built per request from the source
selected at that moment — so changing the source mid-conversation makes the next request describe the new
one. It SHALL state the selected source as the one to prefer rather than as a restriction, because a
generated query targeting a different entity is still honoured (see "Running a message's query loads it
into the builder and executes it").

When the selected source has no loaded field list, the message SHALL say so rather than name columns.

#### Scenario: The request names the selected source and its columns

- **WHEN** the user sends a request with an entity selected whose schema has loaded
- **THEN** the first message sent is a system message naming that entity
- **AND** it lists each of that entity's fields with its type

#### Scenario: Schema labels are included

- **WHEN** a listed field's schema defines a display name or a description
- **THEN** the system message carries them alongside that field's name and type

#### Scenario: A sensitive column is flagged

- **WHEN** a listed field is marked sensitive in the schema
- **THEN** the system message marks it as not to be compared to a literal value

#### Scenario: No row data is sent

- **WHEN** any request is sent to the assistant
- **THEN** the system message contains only entity and field names, types, and schema labels

#### Scenario: The schema message is not part of the conversation

- **WHEN** the user sends a request
- **THEN** the schema message is absent from the visible transcript

#### Scenario: Changing the source changes the next request

- **WHEN** the user selects a different source and sends another request
- **THEN** the system message on that request describes the newly selected source

#### Scenario: An unavailable column list is stated rather than invented

- **WHEN** the selected source has no loaded fields
- **THEN** the system message says the column list is unavailable and names no columns

### Requirement: The selected source is read from the builder context

Every part of the query builder that needs the selected entity, its fields, or the served function
catalog SHALL read them from the shared query-builder context rather than receive them as props, so a
single value decides which source is in play. This SHALL include the SQL editor's schema-aware
autocomplete and the AI panel's request context.

#### Scenario: SQL autocomplete follows the selected source

- **WHEN** the user selects a different source and opens the SQL view
- **THEN** the editor's completions offer that source's fields

#### Scenario: The assistant follows the selected source

- **WHEN** the user selects a different source and sends a request to the assistant
- **THEN** the request describes that source

## MODIFIED Requirements

### Requirement: Generate calls the assistant and shows the proposed query

Activating Send SHALL append the user's request as a new message in the visible transcript and call
the `generateQuery` server action with a system message describing the selected source (see "The query
assistant is given the selected source and its columns") followed by the full accumulated `messages[]`,
which posts to the configured deployment's chat-completions endpoint on DIAL Core (`QueryAssistantApi`,
reusing `DIAL_CORE_API_URL` and Bearer auth). On success the assistant's reply SHALL be appended as a new
message in the transcript, rendered as-is (no SQL extraction applied to the rendered text). When the reply
contains an extractable SQL block, that message additionally renders the extracted SQL read-only with its
own Copy and Run actions (see "Each assistant message with extracted SQL offers inline Run and Copy"). On
failure the system SHALL surface an error notification (header, message, and request id when
available); the just-sent user message SHALL remain visible in the transcript and no assistant message
SHALL be appended, so the user can retry or continue the conversation without losing what they asked.

#### Scenario: Successful generation appends to the transcript

- **WHEN** the user submits a request and the assistant returns a reply
- **THEN** the user's request and the assistant's reply both appear as new messages in the transcript

#### Scenario: The schema message leads the request

- **WHEN** the user submits a request
- **THEN** the messages sent begin with the system message describing the selected source
- **AND** end with the user's request

#### Scenario: Reply without SQL is a plain conversational turn

- **WHEN** the assistant reply contains no SQL block
- **THEN** the assistant's message is shown in the transcript with no Run or Copy action, and any
  previously loaded query is left untouched

#### Scenario: Generation failure notifies and preserves the transcript

- **WHEN** the `generateQuery` action returns a failure
- **THEN** an error notification is shown, the user's just-sent message remains in the transcript, and
  no assistant message is appended

### Requirement: Analytics menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Tables" (linking to the Tables route), "Queries" (linking to the Queries route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/queries`, `/tables`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Queries", "Tables", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

The standalone `/query-builder` route SHALL NOT be present in the menu or in the `ApplicationRoute` enum. Requests to `/query-builder` SHALL redirect to `/queries` so existing links resolve.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows a "Queries" sub-item linking to `/queries`
- **AND** it shows a "Conversations" sub-item linking to `/conversations-trace`
- **AND** no "Query Builder" sub-item is present

#### Scenario: The retired route redirects

- **WHEN** the user navigates to `/query-builder`
- **THEN** the browser is redirected to `/queries`

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure
- `POST /v1/queries/execute-sql` — execute an ad-hoc SQL SELECT (body `{ sql }`); exposed as `executeSqlAction`, returning a `ServerActionResponse` with the same result envelope as `execute`
- `POST /v1/queries/translate` — translate a structured query to the external-dialect SQL subset (validation only, no execution); exposed as `translateAction`, returning a `ServerActionResponse<{ sql }>`
- `POST /v1/queries/translate-sql` — translate a SQL SELECT to the structured DSL (body `{ sql }`, validation only, no execution); exposed as `translateSqlAction`, returning a `ServerActionResponse<{ query }>`

Saved queries endpoints (base path `/v1/saved-queries`):
- `GET /v1/saved-queries?scope={personal|common}` — list the saved queries visible at that scope, each returned in full including its body, most recently updated first; the response is wrapped as `{ saved_queries: [...] }` and the client SHALL unwrap it to a bare array. There is no paging and no server-side sorting or filtering
- `POST /v1/saved-queries` — create; exposed as an `*Action` returning a `ServerActionResponse<SavedQuery>`
- `GET /v1/saved-queries/{id}` — read one in full, including its body
- `PUT /v1/saved-queries/{id}` — full replace of the caller-supplied members; exposed as an `*Action` returning a `ServerActionResponse<SavedQuery>`. The service accepts no precondition header, so no `If-Match` is sent
- `DELETE /v1/saved-queries/{id}` — delete; exposed as an `*Action` returning a `ServerActionResponse`

There SHALL be no client-side execute call for a saved query: the stored body is posted to the existing execute endpoints, so a run stays a read and no run state is written to the saved query.

Tables endpoints (base path `/v1/tables`):
- `GET /v1/tables` — list tables; the response is wrapped as `{ tables: [...] }` and the client SHALL unwrap it to a bare array
- `POST /v1/tables` — create a table or enrichment; **identity-only** (`{name, type, description?}`, plus `source_table` for an enrichment). It SHALL NOT send `columns` or any physical key; the created table is returned in `status=PENDING`
- `GET /v1/tables/{name}` — read one table by name
- `PUT /v1/tables/{name}` — update table catalog metadata (`description`, `tag_order`); exposed as `updateTable`, returning a `ServerActionResponse`
- `DELETE /v1/tables/{name}` — delete a table by name
- `POST /v1/tables/{name}/schema` — define the complete physical schema of a not-yet-materialized table (columns + physical keys) **and** materialize it in the same call (issues `CREATE TABLE`, flips to `ACTIVE`); exposed as `defineTableSchema`, returning a `ServerActionResponse`
- `PATCH /v1/tables/{name}/schema` — evolve a materialized (`ACTIVE`) table's columns; exposed as `updateTableSchema`
- `POST /v1/tables/{name}/rows` — insert rows into a table

#### Scenario: Client targets the Analytics data-access host

- **WHEN** `analyticsDataApi` is instantiated in `app/api/api.ts`
- **THEN** it is constructed with `host: process.env.DIAL_ANALYTICS_API_URL`

#### Scenario: Client covers the queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, `POST /v1/queries/execute` via `executeAction`, `POST /v1/queries/execute-sql` via `executeSqlAction`, `POST /v1/queries/translate` via `translateAction`, and `POST /v1/queries/translate-sql` via `translateSqlAction`

#### Scenario: Client covers the saved-queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/saved-queries` for a given scope (unwrapping `{ saved_queries }`), `POST /v1/saved-queries`, `GET /v1/saved-queries/{id}`, `PUT /v1/saved-queries/{id}`, and `DELETE /v1/saved-queries/{id}`

#### Scenario: Client covers the tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables` (identity-only), `GET /v1/tables/{name}`, `PUT /v1/tables/{name}` via `updateTable`, `DELETE /v1/tables/{name}`, `POST /v1/tables/{name}/schema` via `defineTableSchema`, `PATCH /v1/tables/{name}/schema` via `updateTableSchema`, and `POST /v1/tables/{name}/rows`

### Requirement: Analytics pages fetch initial data server-side

The Analytics pages SHALL be `async` server components (`export const dynamic = 'force-dynamic'`) that fetch their initial data on the server via server actions delegating to `analyticsDataApi`, and pass that data to a client view as props; the client view SHALL own all subsequent interactive state and re-fetching. Fetch failures SHALL be logged (`errorObjLog`); a page whose required single entity is missing SHALL call `notFound()`. Pages SHALL NOT fetch their initial data from a client-side effect.

#### Scenario: Tables catalog data is fetched on the server

- **WHEN** the user navigates to `/tables`
- **THEN** the page awaits the tables list on the server and renders the catalog view seeded with it
- **AND** if the list request fails the page resolves to a not-found result

#### Scenario: Table detail data is fetched on the server

- **WHEN** the user navigates to `/tables/{name}`
- **THEN** the page awaits that table on the server and renders the detail view seeded with it
- **AND** if the table is missing the page resolves to a not-found result

#### Scenario: The queries list is fetched on the server

- **WHEN** the user navigates to `/queries`
- **THEN** the page awaits the saved queries for both the personal and the common scope on the server and renders the grid seeded with them

#### Scenario: A query's data is fetched on the server

- **WHEN** the user navigates to `/queries/{id}`
- **THEN** the page awaits that saved query, the queryable entities, the function catalog, and the schema of the query's own source on the server
- **AND** if the saved query cannot be read the page resolves to a not-found result

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

The query page SHALL prefetch, on the server, the queryable entities, the function catalog, the stored saved query, and the schema of that query's own source, passing them to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, and the mode/filter/select/sort/page the stored query specifies) from those props without a mount-time fetch. The toolbar SHALL show the entity selector. Changing the selected entity SHALL load its schema client-side via the `getEntitySchema` server action and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list, the stored query, and that query's source schema
- **THEN** the builder renders with that source selected, its fields available, and the stored query reflected
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
