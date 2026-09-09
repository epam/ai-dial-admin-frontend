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
| `analytics/conversations-listing` | The conversations log page — filters, provenance line, grid columns, ordering and filtering |
| `analytics/conversation-trace-listing` | One conversation's page — route and guard, header, side panels, the trace listing |
| `analytics/conversation-trace-detail` | A trace opened in place — span tree, Request/Response/Chat tabs, tiered body reads |
| `analytics/pipelines` | The pipelines console — listing, registration, detail page, bindings and triggers, JSON editing |
| `analytics/evaluators` | The evaluators console — listing, version-addressed detail, tabs, the append-only version model |

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

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Tables" (linking to the Tables route), "Pipelines" (linking to the Pipelines route), "Evaluators" (linking to the Evaluators route), "Queries" (linking to the Queries route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/queries`, `/tables`, `/pipelines`, `/evaluators`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Queries", "Tables", "Pipelines", "Evaluators", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

"Evaluators" SHALL sit directly after "Pipelines" rather than before it. An evaluator cannot be registered from this console, so a position ahead of Pipelines would read as the first step of a workflow that does not start here; the evaluators page is a reference surface an operator reaches from a pipeline, and placing it next to Pipelines keeps the pair adjacent.

The Pipelines route SHALL be spelled `/pipelines`, not `/rules`: `src/components/Rules/` and the `RuleFolderProvider` in the app's provider stack already denote entity **access rules**, an unrelated capability, and a `/rules` route would shadow that meaning in the menu, in breadcrumbs, and in the codebase.

The standalone `/query-builder` route SHALL NOT be present in the menu or in the `ApplicationRoute` enum. Requests to `/query-builder` SHALL redirect to `/queries` so existing links resolve.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows a "Pipelines" sub-item linking to `/pipelines`
- **AND** it shows an "Evaluators" sub-item linking to `/evaluators`, ordered after "Pipelines"
- **AND** it shows a "Queries" sub-item linking to `/queries`
- **AND** it shows a "Conversations" sub-item linking to `/conversations-trace`
- **AND** no "Query Builder" sub-item is present

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

The "Analytics" menu group header SHALL display the existing `PreviewTag` component. Because the preview-tag mechanism (`PREVIEW_TAG_MENU_ITEMS` in `MenuItemContent.tsx`) applies only to sub-items, the group header component (`MenuItem.tsx`) SHALL render a `PreviewTag` for groups marked as preview (an opt-in field on `MenuGroupConfiguration`). The tag MUST render only when the sidebar is expanded, and MUST NOT appear on any other group header. Sub-items ("Query Builder", "Tables", "Conversations") MUST NOT each carry their own preview tag.

#### Scenario: Preview tag shown on expanded group header

- **WHEN** the sidebar is expanded and the "Analytics" group is rendered
- **THEN** a "Preview" tag is shown on the "Analytics" group header
- **AND** no other group header shows a "Preview" tag

#### Scenario: Preview tag hidden when sidebar collapsed

- **WHEN** the sidebar is collapsed
- **THEN** the "Preview" tag is not rendered on the group header

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

Pipeline endpoints (base path `/v1/pipelines`), covering both kinds — `enrich` and `aggregate` — in one registry:
- `GET /v1/pipelines` — list pipelines. Deployed builds of the service answer with either a bare array or a `{ pipelines: [...] }` wrapper, so the client SHALL accept both and unwrap to a bare array; only a response that is neither SHALL be read as a failure. **Where the wrapper is used its key differs from the tables listing's `{ tables }` and from the evaluators listing's `{ items }`.** The listing accepts three optional filters — `kind`, `enabled`, and `updated_since` — which combine rather than replace one another. The client SHALL support all three on the API surface even where no screen currently drives them. `enabled` SHALL be sent only as the literal `true` or `false`; when the caller expresses no preference the parameter SHALL be **omitted from the query string entirely**, because the service rejects an empty value — along with `1`, `yes`, `on`, `TRUE`, and a repeated parameter — with HTTP 400 rather than reading it as "unfiltered". The response order is total (oldest `updated_at` first, `name` breaking ties)
- `POST /v1/pipelines` — register a pipeline. A pipeline is created **whole in a single request**; unlike a table there is no identity-then-schema split and no draft state. Exposed as an `*Action` returning a `ServerActionResponse`
- `GET /v1/pipelines/{name}` — read one pipeline by name
- `PATCH /v1/pipelines/{name}` — apply the members the request carries: an omitted member is left alone, a presented one is replaced. Exposed as an `*Action` returning a `ServerActionResponse`
- `DELETE /v1/pipelines/{name}` — delete a pipeline by name; exposed as an `*Action` returning a `ServerActionResponse`

A pipeline is addressed by its `name`, which is its identity and is never reassigned; there is no separate id.

Resolution is **kind-scoped**. A listing narrowed to one `kind` carries each pipeline's resolved members — for an enrichment pipeline its pinned evaluator version inlined as `evaluator`, the `grain_key` derived from the target enrichment, and the read source's `version_column`, which is absent when that source declares no scan metadata. A listing across both kinds omits all three, so a cross-kind grid SHALL render only the flat members every pipeline carries. A disabled pipeline is resolved exactly like an enabled one. `generation` is bumped on every accepted mutation and is the change signal; the service exposes no `ETag`, so no precondition header is sent.

Both pipeline reads SHALL keep a refusal distinct from a failure. `BaseApi` answers HTTP 403 with no value and any other failure with a null; the client SHALL carry that distinction to the caller as `PipelineReadResult<T>` — `{ data, isForbidden }` — rather than collapsing the two into one empty result.

Evaluator endpoints (base path `/v1/evaluators`). Reads are open to any authenticated caller; the single write is `FULL_ADMIN`-only:
- `GET /v1/evaluators` — list evaluators as `{name, latest_version, created_at}`; as with the pipelines listing the response may be a bare array or a wrapper and the client SHALL accept both. Version definitions are **not** included
- `GET /v1/evaluators/{name}` — read that evaluator's latest version in full, including `type` (`llm` or `sql`), `input_vars`, and `output_vars`
- `GET /v1/evaluators/{name}/versions/{version}` — read one pinned version in full
- `POST /v1/evaluators` — register an evaluator or **append a version to an existing one**; the only evaluator mutation the service offers, and the only one it marks `@FullAdminOnly`. The body carries no version: an unknown `name` creates version 1, and a known `name` creates `latest_version + 1`, so there is no way to address which version is produced. Exposed as an `*Action` returning a `ServerActionResponse`
- `PUT /v1/evaluators/{name}/versions/{version}` and `DELETE /v1/evaluators/{name}/versions/{version}` exist only to reject: both answer HTTP 409 with error code `evaluator_immutable`. There is **no** endpoint that deletes an evaluator by name. The client SHALL NOT surface either, because a registered version can never be changed and a registered evaluator can never be removed

The accepted body shape depends on `type` and is enforced imperatively by the service rather than by schema validation: `llm` requires `preset` and `model`; `sql` forbids `preset`, `model`, `params`, `request_template`, `input_vars`, and `response_schema`, and requires every output variable to carry a `sql` expression. A member belonging to the other branch is rejected, not ignored.

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
- **AND** it can issue `GET /v1/evaluators` (unwrapping `{ items }`), `GET /v1/evaluators/{name}`, and `GET /v1/evaluators/{name}/versions/{version}`
- **AND** it can issue `POST /v1/evaluators` to register an evaluator or append a version

#### Scenario: The client exposes no way to change or delete a registered version

- **WHEN** `analyticsDataApi` is used
- **THEN** it offers no call against `PUT /v1/evaluators/{name}/versions/{version}` or `DELETE /v1/evaluators/{name}/versions/{version}`
- **AND** the only evaluator write available is the registration POST

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
- **THEN** the client returns `isForbidden: true` with no data
- **AND** any other failed read returns `isForbidden: false` with no data

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
