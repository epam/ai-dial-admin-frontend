## ADDED Requirements

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

## MODIFIED Requirements

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

#### Scenario: The pipelines listing is fetched on the server

- **WHEN** the user navigates to `/pipelines`
- **THEN** the page awaits the unfiltered pipelines list on the server and renders the listing view seeded with it
- **AND** if the list request fails the page renders the console with the failure stated rather than a not-found result

#### Scenario: The queries list is fetched on the server

- **WHEN** the user navigates to `/queries`
- **THEN** the page awaits the saved queries for both the personal and the common scope on the server and renders the grid seeded with them

#### Scenario: A query's data is fetched on the server

- **WHEN** the user navigates to `/queries/{id}`
- **THEN** the page awaits that saved query, the queryable entities, the function catalog, and the schema of the query's primary source on the server
- **AND** if the saved query cannot be read the page resolves to a not-found result

### Requirement: Query Builder initial data loading and state

The query page SHALL prefetch, on the server, the queryable entities, the function catalog, the stored saved query, and the schema of that query's primary source, passing them to the client builder. The client SHALL seed its `QueryBuilderState` (entity name + fields, and the mode/filter/select/sort/page the stored query specifies) from those props without a mount-time fetch. The toolbar SHALL show the entity selector, holding the primary source. Changing the selected entity SHALL load its schema client-side via the `getEntitySchema` server action and reset builder selections that may reference stale fields. When no entities were provided, the builder SHALL show the entities-load-failed empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list, the stored query, and that query's primary-source schema
- **THEN** the builder renders with the primary source selected, its fields available, and the stored query reflected
- **AND** no client-side entities/schema/query request is issued on mount

#### Scenario: Changing entity reloads schema and resets selections

- **WHEN** the user selects a different (simple) entity
- **THEN** its schema is loaded client-side
- **AND** builder selections that referenced the previous schema's fields are cleared

#### Scenario: No entities provided

- **WHEN** the page provides an empty entities list
- **THEN** the builder shows the entities-load-failed empty state and no builder sections

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
