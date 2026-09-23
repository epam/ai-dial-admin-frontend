# Analytics

## Purpose

Analytics is an experimental admin capability, gated by the `ANALYTICS_ENABLED` environment
variable, that lets an operator explore and shape analytics data held by the Analytics data-access
service (`analytics-data-access-service`, hosted at `DIAL_ANALYTICS_API_URL`). It surfaces as an
"Analytics" left-navigation group carrying a "Preview" tag.

All transport goes through a single server-side client (`AnalyticsDataApi`) via server actions; pages
prefetch their initial data on the server and hand it to client views.

This file holds only what every Analytics page shares — the feature flag, the menu group, the API
layer, server-side prefetch, and the structured-query DSL primitives. Everything else lives in a
sub-capability; open the one row that answers the question rather than reading the set:

| Sub-capability | Answers |
| --- | --- |
| `analytics/query-builder` | How a query is authored — the rail's four views (Form, JSON, SQL, AI) and the guarded transitions between them |
| `analytics/query-viewer` | What a run produces — execution, the result grid, stat tiles, table and chart views |
| `analytics/saved-queries` | Saved queries as addressable objects — storage contract, list page, CRUD, permission gating |
| `analytics/tables` | The tables catalog, column schema and enum columns, row writes, per-table roles, the Connect panel |
| `analytics/sessions-listing` | The sessions log page — filters, provenance line, grid columns, ordering and filtering |
| `analytics/session-trace-listing` | One session's page — route and guard, header, side panels, the trace listing |
| `analytics/session-trace-detail` | A trace opened in place — span tree, Request/Response/Chat tabs, tiered body reads |
| `analytics/pipelines` | The pipelines console — listing, registration, detail page, bindings and triggers, JSON editing |
| `analytics/dashboards` | The Dashboards page over the usage log — how it is reached, its requests, Compare, KPI row, heatmap, share donut, breakdown table |

## Requirements

### Requirement: ANALYTICS_ENABLED feature flag is surfaced on FeatureFlags

The system SHALL expose an environment variable `ANALYTICS_ENABLED` whose value is surfaced at runtime on the `FeatureFlags` object as `analyticsEnabled: boolean`. The flag MUST be `true` only when `process.env.ANALYTICS_ENABLED` is present and resolves truthy per the existing `isValueTruthy` helper; otherwise it MUST be `false`. The flag SHALL be initialized in the root layout (`app/[lang]/layout.tsx`) alongside the other feature flags and added to the `FeatureFlags` model (`models/feature-flags.ts`).

#### Scenario: Flag is true when env var is explicitly truthy

- **WHEN** `process.env.ANALYTICS_ENABLED` is set to `'true'` and the root layout initializes `FeatureFlags`
- **THEN** `featureFlags.analyticsEnabled` is `true`

#### Scenario: Flag defaults to false when env var is unset

- **WHEN** `process.env.ANALYTICS_ENABLED` is not set
- **THEN** `featureFlags.analyticsEnabled` is `false`

#### Scenario: Flag is false when env var is falsy

- **WHEN** `process.env.ANALYTICS_ENABLED` is set to `'false'`, `''`, `'0'`, or any value that `isValueTruthy` treats as falsy
- **THEN** `featureFlags.analyticsEnabled` is `false`

### Requirement: Analytics menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Tables" (linking to the Tables route), "Pipelines" (linking to the Pipelines route), "Queries" (linking to the Queries route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/queries`, `/tables`, `/pipelines`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Queries", "Tables", "Pipelines", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

There SHALL be no "Evaluators" item and no `/evaluators` route. The transform an evaluator used to carry is declared on the enrichment pipeline itself, so the pair the menu kept adjacent is one object; a second item would name a surface that authors nothing. `/evaluators` SHALL NOT be redirected — the pipelines listing answers a different question, and sending an old link there would misreport what was asked for.

The Pipelines route SHALL be spelled `/pipelines`, not `/rules`: `src/components/Rules/` and the `RuleFolderProvider` in the app's provider stack already denote entity **access rules**, an unrelated capability, and a `/rules` route would shadow that meaning in the menu, in breadcrumbs, and in the codebase.

The standalone `/query-builder` route SHALL NOT be present in the menu or in the `ApplicationRoute` enum. Requests to `/query-builder` SHALL redirect to `/queries` so existing links resolve.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows a "Pipelines" sub-item linking to `/pipelines`
- **AND** it shows a "Queries" sub-item linking to `/queries`
- **AND** it shows a "Conversations" sub-item linking to `/conversations-trace`
- **AND** no "Query Builder" sub-item is present
- **AND** no "Evaluators" sub-item is present

#### Scenario: The retired evaluators route is not offered and does not redirect

- **WHEN** the user navigates to `/evaluators`
- **THEN** the request resolves to the not-found page rather than to the pipelines listing

#### Scenario: The retired route redirects

- **WHEN** the user navigates to `/query-builder`
- **THEN** the browser is redirected to `/queries`

### Requirement: Analytics menu group is gated by the feature flag

The "Analytics" group SHALL be present in the menu only when `featureFlags.analyticsEnabled` is `true`, following the same filtering pattern used for the Deployments and Evaluation groups in `MENU_CONFIGURATION`. When the flag is `false`, the entire group and all of its sub-items MUST be absent from the sidebar, and the group's gating MUST compose independently of every other flag-gated group (disabling or enabling any other group MUST NOT affect Analytics's visibility, and vice versa).

#### Scenario: Group hidden when flag disabled

- **WHEN** `featureFlags.analyticsEnabled` is `false` and the sidebar menu renders
- **THEN** the "Analytics" group and all of its sub-items are absent from the sidebar

#### Scenario: Gating composes independently of other groups

- **WHEN** `featureFlags.analyticsEnabled` is `true` while `featureFlags.deploymentsEnabled` and `featureFlags.evaluationEnabled` are `false`
- **THEN** the "Analytics" group is present
- **AND** the Deployments and Evaluation groups are absent

### Requirement: Preview tag on the Analytics group header

The "Analytics" menu group header SHALL display the existing `PreviewTag` component. Because the preview-tag mechanism (`PREVIEW_TAG_MENU_ITEMS` in `MenuItemContent.tsx`) applies only to sub-items, the group header component (`MenuItem.tsx`) SHALL render a `PreviewTag` for groups marked as preview (an opt-in field on `MenuGroupConfiguration`). The tag MUST render only when the sidebar is expanded, and MUST NOT appear on any other group header. Sub-items ("Query Builder", "Tables", "Sessions") MUST NOT each carry their own preview tag.

#### Scenario: Preview tag shown on expanded group header

- **WHEN** the sidebar is expanded and the "Analytics" group is rendered
- **THEN** a "Preview" tag is shown on the "Analytics" group header
- **AND** no other group header shows a "Preview" tag

#### Scenario: Preview tag hidden when sidebar collapsed

- **WHEN** the sidebar is collapsed
- **THEN** the "Preview" tag is not rendered on the group header

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

**Every call SHALL return an error envelope, reads included.** A read SHALL resolve to
`ServerActionResponse<T>` — carrying `response` on success and `errorHeader`, `errorMessage`, `requestId` and
`status` on failure — rather than to `T | null`. A bare `T | null` discards what the service said about the
failure before any caller can report it, which leaves a surface with nothing to state but a sentence this app
wrote. Where a read has no failure to report the envelope costs the caller one member; where it does, that
member is the only route the service's own words have to the operator.

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

Pipeline endpoints (base path `/v1/pipelines`), covering both kinds — `enrich` and `aggregate` — in one registry:
- `GET /v1/pipelines` — list pipelines. Deployed builds of the service answer with either a bare array or a `{ pipelines: [...] }` wrapper, so the client SHALL accept both and unwrap to a bare array; only a response that is neither SHALL be read as a failure. **Where the wrapper is used its key differs from the tables listing's `{ tables }`.** The listing accepts three optional filters — `kind`, `enabled`, and `updated_since` — which combine rather than replace one another. The client SHALL support all three on the API surface even where no screen currently drives them. `enabled` SHALL be sent only as the literal `true` or `false`; when the caller expresses no preference the parameter SHALL be **omitted from the query string entirely**, because the service rejects an empty value — along with `1`, `yes`, `on`, `TRUE`, and a repeated parameter — with HTTP 400 rather than reading it as "unfiltered". The response order is total (oldest `updated_at` first, `name` breaking ties)
- `POST /v1/pipelines` — register a pipeline. A pipeline is created **whole in a single request**; unlike a table there is no identity-then-schema split and no draft state. An `enrich` body carries its whole transform as the nested `transform` block (`type`, `model`, `preset`, `params`, `request_template`, `inputs`, `outputs`); `evaluator_name`, `evaluator_version` and a top-level `vars` are refused at the binding with HTTP 400 on either kind. Exposed as an `*Action` returning a `ServerActionResponse`
- `GET /v1/pipelines/{name}` — read one pipeline by name
- `PATCH /v1/pipelines/{name}` — apply the members the request carries: an omitted member is left alone, a presented one is replaced. Exposed as an `*Action` returning a `ServerActionResponse`
- `DELETE /v1/pipelines/{name}` — delete a pipeline by name; exposed as an `*Action` returning a `ServerActionResponse`

A pipeline is addressed by its `name`, which is its identity and is never reassigned; there is no separate id.

Resolution is **kind-scoped**. A listing narrowed to one `kind` carries each pipeline's resolved members — for an enrichment pipeline the composed `response_schema`, the derived `outputs` mapping, the `grain_key` derived from the target enrichment, and the read source's `version_column`, which is absent when that source declares no scan metadata. No `evaluator` object is inlined in any projection; the service no longer serves one. A listing across both kinds omits every resolved member, so a cross-kind grid SHALL render only the flat members every pipeline carries — the authored `transform` among them, since it is declared rather than derived. A disabled pipeline is resolved exactly like an enabled one. `generation` is bumped on every accepted mutation and is the change signal; the service exposes no `ETag`, so no precondition header is sent.

Both pipeline reads SHALL keep a refusal distinct from a failure, and SHALL carry that distinction through the
read envelope's `status` rather than through a dedicated result type. A caller SHALL read a refusal as
`status: 403` on an unsuccessful envelope; every other failure SHALL carry the service's own status and
message. A separate `{ data, isForbidden }` shape is not kept alongside the envelope: it answers one question
the envelope already answers and discards the message the envelope carries.

**No evaluator endpoint SHALL be exposed on the client.** `POST /v1/evaluators` is removed from the
service; `GET /v1/evaluators` and `GET /v1/evaluators/{name}/versions/{version}` survive as a read-only
archive of definitions as they stood before the fold, and `PUT`/`DELETE` on a version still answer HTTP 409
`evaluator_immutable`. The console calls none of them, so `AnalyticsDataApi` SHALL carry no evaluator
method and no evaluator URL builder at all. A client method for a surface that authors nothing is a way to
reintroduce one by accident.

The accepted transform shape depends on `transform.type` and is enforced imperatively by the service rather than by schema validation: `llm` requires `model` and gives every output prose or nothing at all; `sql` forbids `preset`, `model`, `params`, `request_template` and `inputs`, and requires every output to carry an expression. A member belonging to the other branch is rejected, not ignored.

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

#### Scenario: Client covers the pipelines and evaluators endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/pipelines` (unwrapping `{ pipelines }`), `POST /v1/pipelines`, `GET /v1/pipelines/{name}`, `PATCH /v1/pipelines/{name}`, and `DELETE /v1/pipelines/{name}`
- **AND** it offers no evaluator call: an enrichment pipeline's whole transform travels on the pipeline request

#### Scenario: The client exposes no way to change or delete a registered version

- **WHEN** `analyticsDataApi` is used
- **THEN** it offers no call against any `/v1/evaluators` path, the archive reads included
- **AND** no evaluator write exists to expose

#### Scenario: The pipelines listing omits an unset enabled filter

- **WHEN** the pipelines listing is requested with no preference on `enabled`
- **THEN** the query string carries no `enabled` parameter at all
- **AND** it is not sent as an empty value, which the service rejects with HTTP 400

#### Scenario: The pipelines listing sends every filter together

- **WHEN** the pipelines listing is requested for one kind, enabled only, updated since a given instant
- **THEN** the query string carries `kind`, `enabled=true`, and `updated_since` with that instant
- **AND** the three narrow the result together rather than one replacing another

#### Scenario: A refused read is not reported as a failed one

- **WHEN** the service answers a pipelines listing or a single pipeline read with HTTP 403
- **THEN** the client returns an unsuccessful envelope carrying `status: 403` and no value
- **AND** any other failed read returns an unsuccessful envelope carrying that response's own status

#### Scenario: A failed read carries the service's own words

- **WHEN** any Analytics read fails and the service's response carries an error header, a message, or both
- **THEN** the envelope the caller receives carries them as `errorHeader` and `errorMessage`
- **AND** it carries the `requestId` of the failed request

#### Scenario: A successful read carries its value and no error members

- **WHEN** any Analytics read succeeds
- **THEN** the envelope reports success and carries the value as `response`
- **AND** it carries no `errorHeader` and no `errorMessage`
### Requirement: Analytics pages fetch initial data server-side

The Analytics pages SHALL be `async` server components (`export const dynamic = 'force-dynamic'`) that fetch their initial data on the server via server actions delegating to `analyticsDataApi`, and pass that data to a client view as props; the client view SHALL own all subsequent interactive state and re-fetching. Fetch failures SHALL be logged (`errorObjLog`); a page whose required single entity is missing SHALL call `notFound()`. Pages SHALL NOT fetch their initial data from a client-side effect.

**A page that renders despite a failed read SHALL hand the client view the failure itself, not a flag.** The
prop SHALL carry the service's `errorHeader`, `errorMessage` and `requestId` where the response supplied them,
so the client view can report what the service said. A boolean prop is not sufficient: it tells the view that
something failed and nothing about what, which leaves the view with only a fixed sentence to show for a
failure the service described.

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
- **AND** if the list request fails the page renders the console rather than a not-found result, handing the view the failure's own header, message and request id

#### Scenario: The queries list is fetched on the server

- **WHEN** the user navigates to `/queries`
- **THEN** the page awaits the saved queries for both the personal and the common scope on the server and renders the grid seeded with them

#### Scenario: A query's data is fetched on the server

- **WHEN** the user navigates to `/queries/{id}`
- **THEN** the page awaits that saved query, the queryable entities, the function catalog, and the schema of the query's primary source on the server
- **AND** if the saved query cannot be read the page resolves to a not-found result

### Requirement: An Analytics read failure is reported by notification, in the service's own words

Where an Analytics surface renders despite a failed read, that failure SHALL be reported by an error
notification rather than by text inserted into the page. A sentence placed in the page's own column flow
reports the same class of event in a different place from the rest of the console — where a failed save, a
failed table read and a failed sessions page all raise a notification — and it shifts the content it sits
above as it arrives and leaves.

**The notification SHALL carry what the service said.** Its title SHALL be the service's `errorHeader` and its
body the service's `errorMessage`, and it SHALL carry the failed request's `requestId`. A fixed string this app
wrote SHALL be used only as the title where the response supplied no header — never in place of a message the
service did supply. An operator who cannot quote a request id cannot ask the team running the service about the
failure.

**The report SHALL persist until dismissed.** An error notification SHALL NOT auto-dismiss, because a failure
an operator did not happen to be looking at is a failure they never saw.

**A failure SHALL be reported once.** A surface SHALL raise the notification when the failure first reaches it
and again only when the failure changes — not on every re-render, and not once per row, cell or offered value.

**A statement of absence MAY remain in place, and states only the absence.** Where the notification appears
away from what the operator is looking at — inside a popup, a panel, or a cell — the surface MAY keep a short
statement that there is nothing to show. That statement SHALL NOT be the report of the failure: the cause,
the service's message and the request id belong to the notification.

This requirement does NOT apply where:

- **the failure text is the whole content.** A surface whose entire content is replaced by the failure — an
  empty-state panel standing in for a grid, a page that could not read the one entity it exists to show, a
  grid already rendering its own error state — SHALL keep that statement. Moving it to a notification would
  leave a blank surface with nothing to explain it once the notification is dismissed.
- **the message is form validation.** A rejected field value is not a failed request.
- **the message is a value the service returned.** A recorded error on a pipeline's runtime state, or an
  error message recorded in the usage log for a failed hop, is data this console displays. It is not a
  failure the console suffered, and it stays where it is rendered.

#### Scenario: A degraded surface reports the failure as a notification

- **WHEN** a surface renders its content while one of its reads has failed
- **THEN** an error notification reports the failure
- **AND** no sentence reporting that failure is inserted into the page's content flow

#### Scenario: The notification states the service's header, message and request id

- **WHEN** a read fails and the response carries an error header, an error message and a request id
- **THEN** the notification's title is that header, its body that message, and it carries that request id

#### Scenario: A response with no header falls back to a fixed title only

- **WHEN** a read fails and the response carries a message but no error header
- **THEN** the notification's title is this app's own string for that failure
- **AND** its body is still the service's message

#### Scenario: The report does not disappear on its own

- **WHEN** an Analytics read failure raises its notification
- **THEN** the notification remains until the operator dismisses it

#### Scenario: Re-rendering does not re-raise the report

- **WHEN** a surface holding a failed read re-renders without the failure changing
- **THEN** no further notification is raised

#### Scenario: A replaced surface keeps its statement

- **WHEN** a read fails and the surface has no content to render without it
- **THEN** the surface states that in place, as it did before
- **AND** dismissing any notification leaves that statement on screen

### Requirement: Analytics structured-query builder primitives

The system SHALL provide pure builder primitives for the analytics structured-query DSL in
`src/utils/analytics/query-build.ts`, typed exclusively against the enums in
`src/models/analytics/query.ts` (`QueryMode`, `QueryOperator`, `QueryValueType`, `QueryExprType`,
`QuerySortDirection`, `QueryPageType`). The primitives SHALL cover field and value expressions, the
`and`/`or`/`le`/`ne`/`gt`/`ico`/`in`/`is not null` nodes, function expressions with an optional `distinct`
flag, aliased output columns, sort items, an offset page, and **both** query envelopes — aggregate and row
mode. It SHALL provide no lower-bound primitive of its own: the only lower bound these queries need arrives
from `timeRangePredicates`, which builds both range bounds together.

Each envelope SHALL set `mode` explicitly, because the service requires `mode` and never infers it. The
offset page SHALL carry `include_total` as a caller-supplied value rather than a fixed one: the service
populates `totalCount` for row-mode queries and returns none for aggregate mode, so whether a total is worth
requesting is a property of the query being built.

The builder SHALL encode the backend's literal rules so callers do not have to remember them: a timestamp
value SHALL serialize as a decimal epoch-millisecond string with `value_type: 'timestamp'`, because the
service parses timestamp literals as longs and rejects ISO-8601 strings. The epoch-millisecond rule has a
single source of truth — the builder SHALL reuse `timeRangePredicates` from
`components/Analytics/QueryBuilder/utils/time.ts` rather than re-deriving the `ge`/`le` pair.

The `ico` primitive (case-insensitive contains, SQL `ILIKE`) SHALL take the search term as a plain string
and construct the literal itself, rather than accepting a caller-built value expression: the service rejects
a non-string or null right operand for the contains operators with HTTP 400, so the literal type is not the
caller's to choose. The term SHALL be passed through verbatim — the service wraps it in `%…%` and escapes
`%`, `_` and `\` itself, so adding wildcards in the builder would search for them literally.

The builder MUST NOT reuse `src/utils/structured-query/build.ts`; that module targets the evaluation DSL
(`models/evaluation/structured-query.ts`) whose enums are structurally different, so sharing it would be a
type error rather than a simplification.

#### Scenario: Timestamp literal serializes as epoch milliseconds

- **WHEN** a timestamp value expression is built from a `Date`
- **THEN** its `value_type` is `timestamp` and its `value` is the decimal epoch-millisecond count as a
  string, containing no ISO-8601 date punctuation

#### Scenario: Comparison predicate carries a field and a typed literal

- **WHEN** an `le`, `ne`, or `gt` predicate is built for a field and a literal
- **THEN** the node is `{ op, args: [fieldExpr, valueExpr] }` with the field expression first

#### Scenario: Each envelope sets its mode explicitly

- **WHEN** an aggregate query envelope and a row-mode query envelope are built
- **THEN** the first sets `mode: 'aggregate'` and the second sets `mode: 'row'`
- **AND** neither leaves `mode` to be inferred from `group_by` or `select`

#### Scenario: The offset page carries the caller's total request

- **WHEN** an offset page is built requesting a total, and again not requesting one
- **THEN** `include_total` is `true` in the first and `false` in the second

#### Scenario: Contains predicate always carries a string literal

- **WHEN** an `ico` predicate is built for any term, including one that looks numeric or boolean
- **THEN** its right operand is a value expression with `value_type: 'string'`

#### Scenario: Contains predicate adds no wildcards of its own

- **WHEN** an `ico` predicate is built for a term containing `%` or `_`
- **THEN** the literal is the term exactly as supplied, with no surrounding `%` and no escaping applied
