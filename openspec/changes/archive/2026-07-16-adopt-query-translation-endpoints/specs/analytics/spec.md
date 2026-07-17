# Analytics — query-translation endpoints (delta)

> Applies on top of the master spec `openspec/specs/analytics/spec.md`.

## ADDED Requirements

### Requirement: Backend-authoritative query translation

The Query Builder SHALL treat the Analytics data-access service as the single source of truth for
translating between the structured query DSL and SQL, via two validation-only endpoints that never run
against ClickHouse. The server API layer SHALL expose `translateAction(query)` for
`POST /v1/queries/translate` (DSL → SQL, success body `{ "sql": <text> }`) and `translateSqlAction(sql)`
for `POST /v1/queries/translate-sql` (SQL → DSL, success body `{ "query": <StructuredQuery> }`), each
returning a `ServerActionResponse` envelope and reached through a server action injecting the user token.
The frontend SHALL NOT generate SQL from the structured query on the client; the client-side generator is
removed. When the backend rejects a translation with a `400` (a DSL the SQL subset cannot express, or SQL
that is unparseable or uses an unsupported construct), the failure SHALL be handled per the consuming
requirement (SQL-view seeding surfaces the error; the Builder switch falls back to the discard guard) and
SHALL NOT be presented as a successful translation.

#### Scenario: DSL is translated to SQL through the backend

- **WHEN** the SQL view needs to seed its editor from the current builder query
- **THEN** the structured query is sent to `POST /v1/queries/translate`
- **AND** the returned `{ sql }` text is used verbatim as the editor contents

#### Scenario: SQL is translated to a structured query through the backend

- **WHEN** SQL is translated for display in the visual builder
- **THEN** the SQL is sent to `POST /v1/queries/translate-sql`
- **AND** the returned `{ query }` is a structured query the `execute` endpoint would accept

#### Scenario: A DSL the SQL subset cannot express is rejected

- **WHEN** `POST /v1/queries/translate` is called for a query the SQL subset cannot express (for example `include_total`)
- **THEN** the backend responds `400`
- **AND** the frontend surfaces the failure rather than showing generated SQL

## MODIFIED Requirements

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure
- `POST /v1/queries/execute-sql` — execute an ad-hoc SQL SELECT (body `{ sql }`); exposed as `executeSqlAction`, returning a `ServerActionResponse` with the same result envelope as `execute`
- `POST /v1/queries/translate` — translate a structured query to the external-dialect SQL subset (validation only, no execution); exposed as `translateAction`, returning a `ServerActionResponse<{ sql }>`
- `POST /v1/queries/translate-sql` — translate a SQL SELECT to the structured DSL (body `{ sql }`, validation only, no execution); exposed as `translateSqlAction`, returning a `ServerActionResponse<{ query }>`

Tables endpoints (base path `/v1/tables`):
- `GET /v1/tables` — list tables; the response is wrapped as `{ tables: [...] }` and the client SHALL unwrap it to a bare array
- `POST /v1/tables` — create a table or enrichment (body-discriminated)
- `GET /v1/tables/{name}` — read one table by name
- `DELETE /v1/tables/{name}` — delete a table by name
- `PATCH /v1/tables/{name}/schema` — update a table's schema
- `POST /v1/tables/{name}/rows` — insert rows into a table

#### Scenario: Client targets the Analytics data-access host

- **WHEN** `analyticsDataApi` is instantiated in `app/api/api.ts`
- **THEN** it is constructed with `host: process.env.DIAL_ANALYTICS_API_URL`

#### Scenario: Client covers the queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, `POST /v1/queries/execute` via `executeAction`, `POST /v1/queries/execute-sql` via `executeSqlAction`, `POST /v1/queries/translate` via `translateAction`, and `POST /v1/queries/translate-sql` via `translateSqlAction`

#### Scenario: Client covers the tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables`, `GET /v1/tables/{name}`, `DELETE /v1/tables/{name}`, `PATCH /v1/tables/{name}/schema`, and `POST /v1/tables/{name}/rows`

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a WHERE tree limited to two levels: the root group holds conditions and groups, and nested groups hold only conditions. The "add nested group" action SHALL be offered only at the root group; nested groups SHALL offer only add-condition and remove actions. Each group SHALL expose a logical operator selector (AND / OR / NOT). Each condition SHALL expose a field selector (from the loaded schema, grouped by field category), an operator selector (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. Operators SHALL be shown as short uppercased codes (EQ, NE, LT, …); the two case-insensitive contains operators SHALL be shown with the familiar `CO`/`NC` labels while serializing to `ico`/`inc` (SQL ILIKE). The case-sensitive `co`/`nc` SHALL NOT be offered as authoring options but SHALL remain valid model values that serialize, deserialize, and round-trip without error when present in a JSON-authored or backend-translated query. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For `in` the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups and fieldless conditions SHALL be omitted; a `not` group SHALL wrap its single child, or an `and` of its children. Deeper nesting SHALL be expressible only through the SQL view.

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

- **WHEN** the user picks the CONTAINS operator for a condition
- **THEN** the predicate serializes with `op: "ico"`
- **AND** the case-sensitive `co`/`nc` operators are not offered in the operator selector

#### Scenario: A case-sensitive contains from an authored query still round-trips

- **WHEN** a JSON-authored or backend-translated query contains a predicate with `op: "co"`
- **THEN** it deserializes and serializes without error and is not silently changed to `ico`

### Requirement: Schema-aware SQL autocomplete

The SQL editor SHALL offer completion suggestions derived from the loaded schema and a fixed SQL catalog: the loaded schema's field names (each annotated with its field type), the selected entity name (as the query's source/`FROM` target), and the supported SQL keywords and functions. The keyword catalog SHALL include both `LIKE` (case-sensitive contains) and `ILIKE` (case-insensitive contains). Suggestions SHALL reflect the schema currently loaded, so changing the selected entity SHALL change the suggested field names and source name. The autocomplete SHALL NOT perform SQL validation.

#### Scenario: Schema fields are suggested

- **WHEN** the user triggers completion in the SQL editor with a schema loaded
- **THEN** the loaded schema's field names are offered as suggestions
- **AND** each field suggestion shows its field type
- **AND** the selected entity name is offered as the source

#### Scenario: Suggestions follow the selected entity

- **WHEN** the user selects a different entity and triggers completion
- **THEN** the suggested field names are those of the newly selected entity's schema

#### Scenario: ILIKE is offered as a keyword

- **WHEN** the user triggers keyword completion in the SQL editor
- **THEN** both `LIKE` and `ILIKE` are offered as suggestions

### Requirement: SQL view state is an independent buffer

The Query Builder SHALL keep the SQL editor text as its own buffer. Entering the SQL view SHALL seed the editor by translating the current builder query (including the toolbar time bound and the implicit count) to SQL via `POST /v1/queries/translate` through a server action, when the buffer is empty or still matches the last generated text; the seed is asynchronous and the editor SHALL show a loading affordance while the translation is in flight. When the translation is rejected (`400` — a query the SQL subset cannot express), the failure SHALL surface via the app's error-notification convention and the editor SHALL be left empty (with Run disabled), rather than being seeded with a locally generated or partial statement. User-edited SQL SHALL never be overwritten by a re-seed. Switching between the SQL and JSON views SHALL NOT prompt and SHALL leave both buffers intact.

#### Scenario: Entering SQL translates the builder query via the backend

- **WHEN** the user opens the SQL view without prior SQL edits
- **THEN** the current builder query is sent to `POST /v1/queries/translate`
- **AND** the editor is pre-filled with the returned SQL

#### Scenario: A non-expressible query surfaces a translate error

- **WHEN** the user opens the SQL view for a query the SQL subset cannot express and the backend responds `400`
- **THEN** an error notification is shown with the backend's message
- **AND** the SQL editor is left empty and Run is disabled

#### Scenario: SQL text persists across written-mode switches

- **WHEN** the user edits SQL, switches to the JSON view, and switches back to the SQL view
- **THEN** the SQL editor shows the previously edited text unchanged
- **AND** the edited text is not re-translated over

### Requirement: Switching from a written mode to the Builder is guarded

SQL and JSON are "written" modes: they can hold queries the visual builder cannot display (edited SQL text; JSON with e.g. filter nesting deeper than two levels). When the user switches from the SQL view to the Builder view with an edited SQL buffer, the SQL SHALL first be translated to the structured DSL via `POST /v1/queries/translate-sql`. If the translation succeeds and the resulting query is representable in the two-level visual builder, the builder SHALL be hydrated from that query and the view SHALL switch with no confirmation and no data loss. If the translation fails (`400` — parse failure or an unsupported construct) or the resulting query is not builder-representable, a confirmation popup (danger variant) SHALL warn that switching will drop the current query and reset the builder to its starting point. From the JSON view the same guard applies when the JSON is valid but unrepresentable. Confirming SHALL discard the written query (clear the SQL buffer / discard the JSON edits), reset the builder state to its initial defaults for the selected entity, and switch to the Builder view. Cancelling SHALL keep the user in the written mode with the query intact. Switching to the Builder SHALL NOT prompt when nothing would be lost (empty or unedited generated SQL; SQL that translates to a representable query; JSON that round-trips into the builder).

#### Scenario: Translatable SQL hydrates the builder without a prompt

- **WHEN** the user edits SQL that translates to a builder-representable query and selects the Builder view
- **THEN** no confirmation is shown
- **AND** the builder reflects the translated query
- **AND** the SQL buffer is cleared

#### Scenario: Untranslatable SQL asks for confirmation

- **WHEN** the user edits SQL that the backend rejects (or that translates to an unrepresentable query) and selects the Builder view
- **THEN** a confirmation popup warns that the current query will be dropped and the builder reset

#### Scenario: Confirming drops the written query and resets the builder

- **WHEN** the confirmation popup is shown and the user confirms
- **THEN** the view switches to the Builder view
- **AND** the written query is discarded
- **AND** the builder state is reset to its initial defaults for the selected entity

#### Scenario: Cancelling keeps the written query

- **WHEN** the confirmation popup is shown and the user cancels
- **THEN** the user remains in the written mode
- **AND** the written query text is unchanged

#### Scenario: Representable JSON switches silently

- **WHEN** the JSON editor holds a valid query the builder can represent and the user selects the Builder view
- **THEN** no confirmation is shown
- **AND** the builder reflects that query
