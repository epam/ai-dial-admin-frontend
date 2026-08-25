## MODIFIED Requirements

### Requirement: Analytics menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Tables" (linking to the Tables route), "Enrichment rules" (linking to the Enrichment rules route), "Queries" (linking to the Queries route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/queries`, `/tables`, `/enrichment-rules`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Queries", "Tables", "Enrichment rules", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

The Enrichment rules route SHALL be spelled `/enrichment-rules`, not `/rules`: `src/components/Rules/` and the `RuleFolderProvider` in the app's provider stack already denote entity **access rules**, an unrelated capability, and a `/rules` route would shadow that meaning in the menu, in breadcrumbs, and in the codebase.

The standalone `/query-builder` route SHALL NOT be present in the menu or in the `ApplicationRoute` enum. Requests to `/query-builder` SHALL redirect to `/queries` so existing links resolve.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows an "Enrichment rules" sub-item linking to `/enrichment-rules`
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

Enrichment rules endpoints (base path `/v1/rules`):
- `GET /v1/rules` — list rules; the response is wrapped as `{ items: [...] }` and the client SHALL unwrap it to a bare array. **The wrapper key differs from the tables listing's `{ tables }`.** The listing accepts two optional filters, `enabled` and `updated_since`, which combine rather than replace one another. `enabled` SHALL be sent only as the literal `true` or `false`; when the caller expresses no preference the parameter SHALL be **omitted from the query string entirely**, because the service rejects an empty value — along with `1`, `yes`, `on`, `TRUE`, and a repeated parameter — with HTTP 400 rather than reading it as "unfiltered". The response order is total (oldest `updated_at` first, `id` breaking ties)
- `POST /v1/rules` — register a rule. A rule is created **whole in a single request**; unlike a table there is no identity-then-schema split and no draft state. Exposed as an `*Action` returning a `ServerActionResponse`
- `GET /v1/rules/{id}` — read one rule by id
- `PUT /v1/rules/{id}` — **full replace**, not a merge-patch: an omitted member is erased. Exposed as an `*Action` returning a `ServerActionResponse`
- `DELETE /v1/rules/{id}` — delete a rule by id; exposed as an `*Action` returning a `ServerActionResponse`

Every rule the service returns is **resolved**: it carries its pinned evaluator version inlined as `evaluator`, its read `source` (declared on the rule, or defaulted to the target enrichment's `source_table` — the response does not distinguish the two), the `grain_key` derived from the target enrichment, and the read source's `version_column`, which is absent when that source declares no scan metadata. A disabled rule is resolved exactly like an enabled one. `generation` is bumped on every accepted mutation and is the change signal; the service exposes no `ETag`, so no precondition header is sent.

Evaluator endpoints (base path `/v1/evaluators`), read-only from this app — evaluators are registered outside the UI:
- `GET /v1/evaluators` — list evaluators as `{name, latest_version, created_at}`; the response is wrapped as `{ items: [...] }` and the client SHALL unwrap it. Version definitions are **not** included
- `GET /v1/evaluators/{name}` — read that evaluator's latest version in full, including `type` (`llm` or `sql`), `input_vars`, and `output_vars`
- `GET /v1/evaluators/{name}/versions/{version}` — read one pinned version in full

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

#### Scenario: Client covers the rules and evaluators endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/rules` (unwrapping `{ items }`), `POST /v1/rules`, `GET /v1/rules/{id}`, `PUT /v1/rules/{id}`, and `DELETE /v1/rules/{id}`
- **AND** it can issue `GET /v1/evaluators` (unwrapping `{ items }`), `GET /v1/evaluators/{name}`, and `GET /v1/evaluators/{name}/versions/{version}`

#### Scenario: The rules listing omits an unset enabled filter

- **WHEN** the rules listing is requested with no preference on `enabled`
- **THEN** the query string carries no `enabled` parameter at all
- **AND** it is not sent as an empty value, which the service rejects with HTTP 400

#### Scenario: The rules listing sends both filters together

- **WHEN** the rules listing is requested for enabled rules updated since a given instant
- **THEN** the query string carries `enabled=true` and `updated_since` with that instant
- **AND** the two narrow the result together rather than one replacing the other

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

#### Scenario: The enrichment rules listing is fetched on the server

- **WHEN** the user navigates to `/enrichment-rules`
- **THEN** the page awaits the unfiltered rules list on the server and renders the listing view seeded with it
- **AND** if the list request fails the page resolves to a not-found result

#### Scenario: The queries list is fetched on the server

- **WHEN** the user navigates to `/queries`
- **THEN** the page awaits the saved queries for both the personal and the common scope on the server and renders the grid seeded with them

#### Scenario: A query's data is fetched on the server

- **WHEN** the user navigates to `/queries/{id}`
- **THEN** the page awaits that saved query, the queryable entities, the function catalog, and the schema of the query's own source on the server
- **AND** if the saved query cannot be read the page resolves to a not-found result

## ADDED Requirements

### Requirement: Enrichment rules page route and access guard

The system SHALL expose an Analytics page at `/enrichment-rules`, present in the `ApplicationRoute` enum
(`types/routes.ts`) as `AnalyticsEnrichmentRules`, with the route directory
`src/app/[lang]/enrichment-rules/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'` that calls `isAnalyticsForbidden()` before any data access and
renders `Page403` when it returns `true`, matching the guard the Tables, Queries, and Conversations pages
already use. User-facing strings SHALL read "Enrichment rules".

The listing view SHALL be seeded from an **unfiltered** server-side fetch, so the page opens showing every
registered rule — enabled and disabled alike. Narrowing is the user's explicit act, because the question the
page exists to answer ("is this enrichment's rule missing, or registered but switched off?") is unanswerable
from a view that hides disabled rules by default.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and `/enrichment-rules` is requested
- **THEN** the page fetches the rules list on the server and renders the listing seeded with it
- **AND** disabled rules are present in that initial listing

#### Scenario: Forbidden caller sees Page403 and no rules are fetched

- **WHEN** `isAnalyticsForbidden()` returns `true` and `/enrichment-rules` is requested
- **THEN** `Page403` is rendered
- **AND** no rules request is issued

### Requirement: Enrichment rules listing grid

The Enrichment rules page SHALL render the fetched rules as a grid, in the order the service returned them —
the service's ordering is total, so the grid SHALL NOT re-sort client-side. Columns SHALL be: **name**,
**target enrichment**, **source**, **trigger**, **evaluator**, **grain key**, **version column**,
**enabled**, **generation**, and **updated at**.

- The **name** cell SHALL navigate to that rule's detail route, `/enrichment-rules/{id}`.
- The **trigger** cell SHALL show the `trigger_kind` as a badge, and beneath it the `trigger_cron` for a
  `schedule` rule or `by {group_by}` for a `group` rule; an `on_ingest` rule SHALL show the badge alone.
- The **evaluator** cell SHALL show `{evaluator_name}@{version}` with a badge for the evaluator's `llm` or
  `sql` type, and SHALL mark the pin as "latest" when the rule declares no `evaluator_version`. This cell
  SHALL be resolved from the listing response alone — the rule carries its evaluator inlined, so the grid
  SHALL NOT issue a per-row evaluator request.
- The **version column** cell SHALL render an em dash when the rule reports none, which means the read source
  declares no scan metadata. This is a legitimate state on this read, not an error.
- The **enabled** cell SHALL render as a badge distinguishing an enabled from a disabled rule; colour alone
  SHALL NOT be the only carrier of that distinction.

Each row SHALL offer an action menu with a **delete** entry, whose confirmation dialog SHALL use the danger
(red confirm) variant and SHALL identify the rule by name. After a successful delete the listing SHALL
refresh client-side, preserving the filters currently applied.

#### Scenario: Listing renders a rule with its resolved evaluator

- **WHEN** the listing renders a rule pinned to version 4 of an `llm` evaluator
- **THEN** its evaluator cell shows the evaluator name with version 4 and an `llm` type badge
- **AND** no additional evaluator request is issued for that row

#### Scenario: An unpinned evaluator is marked latest

- **WHEN** the listing renders a rule that declares no `evaluator_version`
- **THEN** its evaluator cell marks the pin as "latest"

#### Scenario: Trigger cell carries the kind and its qualifier

- **WHEN** the listing renders a `schedule` rule and a `group` rule
- **THEN** the `schedule` row shows a schedule badge with its cron expression beneath
- **AND** the `group` row shows a group badge with `by {group_by}` beneath

#### Scenario: A rule whose source declares no scan metadata

- **WHEN** the listing renders a rule with no `version_column`
- **THEN** that cell shows an em dash
- **AND** the row is presented as an ordinary rule, not as a failure

#### Scenario: Navigating to a rule

- **WHEN** the user activates a rule's name cell
- **THEN** the browser navigates to `/enrichment-rules/{id}` for that rule

#### Scenario: Delete a rule

- **WHEN** the user activates a row's delete action and confirms in the red confirmation dialog
- **THEN** the rule is deleted, a success notification is shown, and the listing refreshes with the current filters still applied
- **AND** a failure surfaces an error notification without removing the row

### Requirement: Enrichment rules listing filters

The listing SHALL offer two filters, held as client state and applied by re-fetching from the service — the
service filters, not the grid. Filter state SHALL NOT be written to the URL, following the existing Analytics
listing views.

- **Enabled**: a three-way control — all rules / enabled only / disabled only. Selecting "all" SHALL cause the
  request to carry **no** `enabled` parameter; the control MUST NOT resolve "all" to an empty string, which
  the service rejects with HTTP 400.
- **Updated since**: a preset selection ("Any time" plus relative windows) resolved to an ISO-8601 instant at
  request time. "Any time" SHALL omit the `updated_since` parameter.

A failed re-fetch SHALL surface an error notification and SHALL leave the previously displayed rows in place,
so a transient failure does not read as "no rules match".

#### Scenario: Filtering to disabled rules

- **WHEN** the user selects "disabled only"
- **THEN** the listing re-fetches with `enabled=false` and shows the returned rules

#### Scenario: Clearing the enabled filter

- **WHEN** the user returns the enabled filter to "all"
- **THEN** the listing re-fetches with no `enabled` parameter in the request

#### Scenario: Both filters apply together

- **WHEN** the user selects "enabled only" and an updated-since window
- **THEN** the request carries both parameters and the listing shows rules satisfying both

#### Scenario: A failed re-fetch does not empty the grid

- **WHEN** a filter change triggers a re-fetch that fails
- **THEN** an error notification is shown
- **AND** the rows from the previous successful fetch remain displayed

### Requirement: Rule creation requires full-admin rights and a registered evaluator

Registering and enabling a rule is `FULL_ADMIN`-only on the service, and a rule DTO carries no per-entity
`permissions` object of the kind table DTOs report. The console SHALL therefore gate the create action on the
caller's application role (`isFullAdmin` from `AppContext`) alone, and SHALL NOT attempt a per-rule permission
derivation. A caller who is not a full admin SHALL see the listing without a create action.

Because evaluators are registered outside this UI, a rule cannot be created at all when none exist. When the
evaluator list is empty the create action SHALL be **disabled rather than hidden**, accompanied by a note
stating that an evaluator must be registered through the API first. A disabled-with-explanation control
distinguishes "nothing to build from yet" from "you may not do this", which hiding the action would conflate.

#### Scenario: Non-admin sees no create action

- **WHEN** a caller who is not a full admin opens the listing
- **THEN** no create-rule action is offered

#### Scenario: No evaluators registered

- **WHEN** a full admin opens the listing and the evaluator list is empty
- **THEN** the create action is present but disabled
- **AND** a note explains that an evaluator must be registered via the API first

#### Scenario: Create action available

- **WHEN** a full admin opens the listing and at least one evaluator is registered
- **THEN** the create action is enabled and opens the create-rule modal

### Requirement: Create-rule modal collects a complete rule in one request

The service has no draft state for a rule: it is created whole by a single `POST /v1/rules`. The create modal
SHALL therefore assemble a submittable rule in one pass, collecting fields in this order: **name**,
**evaluator**, **evaluator version**, **target enrichment**, **trigger kind**, the conditional block for the
selected trigger kind, **output bindings**, **enabled**.

The modal SHALL be mounted only while open, so closing discards its state without a manual reset, following
the create-table popup.

Five values are required by the service, and all five SHALL be required to submit:

- **name** — validated only as non-blank; the service defines no grammar for it. Uniqueness is enforced by
  the service, not pre-checked here.
- **evaluator** — selected from the registered evaluators.
- **target enrichment** — selected from tables of type `enrichment`.
- **trigger kind** — one of `on_ingest`, `schedule`, `group`.
- **enabled** — an explicit `true`/`false` choice with **no default**. The service models this as a
  non-nullable boolean specifically so that whether a rule starts live is an operator decision rather than an
  omission silently becoming `false`; the modal SHALL preserve that by refusing to submit until the operator
  chooses. The `true` option SHALL be captioned "Runs on its schedule" and the `false` option "Registered but
  not running. Manual scan and backfill still work".

**Evaluator version** is optional: the control SHALL offer "latest" alongside each concrete version from `1`
to the evaluator's `latest_version`, and "latest" SHALL submit no `evaluator_version` member rather than a
literal string.

On success the modal SHALL close, show a success notification, and refresh the listing.

#### Scenario: All five required values are needed to submit

- **WHEN** the modal is open with any of name, evaluator, target enrichment, trigger kind, or enabled unset
- **THEN** submission is blocked

#### Scenario: Enabled has no default

- **WHEN** the modal is opened
- **THEN** neither the enabled nor the disabled option is preselected
- **AND** both options carry their captions describing what the choice means

#### Scenario: Latest version is submitted as an omission

- **WHEN** the user leaves the evaluator version as "latest" and submits
- **THEN** the request body carries no `evaluator_version` member

#### Scenario: Modal state is discarded on close

- **WHEN** the user opens the modal, edits fields, and closes it
- **THEN** re-opening the modal shows a fresh, empty form

#### Scenario: Successful creation refreshes the listing

- **WHEN** creation succeeds
- **THEN** the modal closes, a success notification is shown, and the new rule appears in the listing

### Requirement: The selected trigger kind determines which members are sent

The service's trigger invariants run **both ways**: a member that belongs to the selected trigger kind is
required, and a member that does not belong to it is **rejected with HTTP 422 rather than ignored**. The modal
SHALL therefore strip the members of every unselected branch from the request body — hiding a control is not
sufficient, because a value entered before the trigger kind was changed would otherwise still be submitted.

- `trigger_kind = on_ingest` — the body SHALL carry none of `trigger_cron`, `group_by`, `ready_when`, or
  `member_select`.
- `trigger_kind = schedule` — `trigger_cron` SHALL be required; `group_by`, `ready_when`, and `member_select`
  SHALL be absent.
- `trigger_kind = group` — `group_by` and `ready_when` SHALL both be required; `trigger_cron` SHALL be absent.
  `member_select` is never required and is not collected by this modal.

#### Scenario: Switching trigger kind strips the abandoned branch

- **WHEN** the user fills a cron expression, then switches the trigger kind to `group`, then submits
- **THEN** the request body carries `group_by` and `ready_when` and carries no `trigger_cron`

#### Scenario: An on-ingest rule sends no trigger qualifiers

- **WHEN** the user submits an `on_ingest` rule
- **THEN** the request body carries none of `trigger_cron`, `group_by`, `ready_when`, or `member_select`

#### Scenario: A schedule rule requires its cron

- **WHEN** the trigger kind is `schedule` and no cron expression has been provided
- **THEN** submission is blocked

#### Scenario: A group rule requires its readiness declaration

- **WHEN** the trigger kind is `group` and no readiness condition has been provided
- **THEN** submission is blocked

### Requirement: The modal resolves the evaluator and the target table on demand

Neither list response carries what the form needs: `GET /v1/evaluators` returns no version definitions, and
`GET /v1/tables` returns neither `grain` nor `columns`. The modal SHALL therefore read the full evaluator
whenever the selected evaluator or its version changes — the pinned version via
`GET /v1/evaluators/{name}/versions/{version}`, "latest" via `GET /v1/evaluators/{name}` — and the full target
table via `GET /v1/tables/{name}` whenever the target enrichment changes. Resolved values SHALL be cached by
their key for the lifetime of the modal, so re-selecting a previously chosen evaluator, version, or table
issues no second request.

Controls that depend on a resolution SHALL report a pending state while it is in flight rather than rendering
as empty, and a failed resolution SHALL be reported in the form rather than leaving a control silently
unpopulated.

#### Scenario: Selecting an evaluator resolves its variables

- **WHEN** the user selects an evaluator
- **THEN** its full definition is read and its `output_vars` become available to the output-bindings editor

#### Scenario: Pinning a version re-resolves

- **WHEN** the user changes the evaluator version from "latest" to a concrete version
- **THEN** that version is read and the available output variables are those of the pinned version

#### Scenario: Resolutions are cached

- **WHEN** the user selects a target enrichment, switches to another, and switches back
- **THEN** no second request is issued for the first table

#### Scenario: A failed resolution is reported

- **WHEN** reading the selected target table fails
- **THEN** the form reports the failure
- **AND** the controls that depend on that table do not present themselves as having no options

### Requirement: Target enrichments already bound to a rule are not offered

An enrichment table admits **at most one** rule — a UNIQUE constraint, because an enrichment is a
replacing-merge table whose rows are replaced whole by grain, so two rules writing different columns of the
same row would clobber one another. A second rule on the same target is rejected with HTTP 409.

The target-enrichment control SHALL therefore offer only enrichment tables that no existing rule already
targets, derived by excluding the rules listing's target enrichments from the enrichment tables. Learning
about the constraint from a 409 after filling in an entire form is a preventable failure.

The 409 SHALL still be handled: the exclusion is computed from data that can be stale by the time the form is
submitted, so a rejection SHALL surface the service's message and leave the form open with its values intact.

#### Scenario: A bound enrichment is not offered as a target

- **WHEN** an enrichment table is already the target of a registered rule
- **THEN** it does not appear among the target-enrichment options

#### Scenario: Every enrichment is already bound

- **WHEN** every enrichment table already has a rule
- **THEN** the target-enrichment control offers no options and states why

#### Scenario: A racing 409 is surfaced without losing the form

- **WHEN** submission is rejected with HTTP 409 because another rule claimed the target first
- **THEN** the service's message is shown
- **AND** the modal stays open with the entered values intact

### Requirement: Output bindings editor

`output_bindings` maps the evaluator's output variables onto the target table's columns; without it a rule
computes a result and discards it. The modal SHALL collect it as a repeater whose every row is a pair of
selects: a **column**, from the resolved target table's `columns`, and a **variable**, from the resolved
evaluator version's `output_vars`.

- The editor SHALL enforce the one-to-one mapping by suppressing an already-chosen column or variable from its
  sibling rows' options. This guard is load-bearing rather than cosmetic: the service does not reject a
  duplicate, it silently drops a binding, so an unguarded duplicate produces a rule that quietly writes less
  than the operator specified.
- Each option SHALL display its type alongside its name. When a row pairs a column and a variable whose types
  disagree, the editor SHALL flag the row. The flag is advisory — the service remains the authority — and
  SHALL NOT by itself block submission.
- When the evaluator, the version, or the target table changes so that a chosen column or variable no longer
  exists, the editor SHALL **mark the affected rows as invalid and retain their values**, and MUST NOT clear
  them silently. A silent clear destroys work the operator has already done and gives no account of why.
- Before both an evaluator and a target table are chosen the editor SHALL render an empty state directing the
  operator to choose them, rather than an empty repeater.

At least one binding SHALL be required to submit when the resolved evaluator's `type` is `sql`, which the
service rejects outright without one. For an `llm` evaluator the service accepts a rule with no bindings, and
submission SHALL be allowed — but the modal SHALL warn that such a rule computes results and stores none,
since that is a silent misconfiguration rather than a deliberate mode.

#### Scenario: Empty state before its inputs are chosen

- **WHEN** the modal is open with no evaluator or no target enrichment selected
- **THEN** the output-bindings editor shows a prompt to select an evaluator and a target table

#### Scenario: A chosen column is withheld from sibling rows

- **WHEN** a row binds a target column
- **THEN** that column is not offered in any other row's column select

#### Scenario: A chosen variable is withheld from sibling rows

- **WHEN** a row binds an output variable
- **THEN** that variable is not offered in any other row's variable select

#### Scenario: A type mismatch is flagged but not blocking

- **WHEN** a row pairs a column and a variable of disagreeing types
- **THEN** the row is flagged with the mismatch
- **AND** submission is not blocked by that flag alone

#### Scenario: Changing the evaluator invalidates rather than clears

- **WHEN** filled rows exist and the user changes the evaluator to one lacking those output variables
- **THEN** the affected rows keep their values and are marked invalid
- **AND** no row is silently emptied

#### Scenario: A sql evaluator requires at least one binding

- **WHEN** the resolved evaluator's type is `sql` and no output binding has been added
- **THEN** submission is blocked

#### Scenario: An llm evaluator with no bindings warns

- **WHEN** the resolved evaluator's type is `llm` and no output binding has been added
- **THEN** the modal warns that the rule will compute results and store none
- **AND** submission remains possible

### Requirement: Six-field cron control for a scheduled rule

The service checks only whether `trigger_cron` is present or absent for the selected trigger kind — it never
parses the expression, at create or at update. A syntactically invalid expression is accepted with HTTP 201
and fails later inside the runner, where the operator will not be looking. The console is the only guard, so
the control SHALL validate the expression it submits.

The accepted format is **six-field cron** — seconds, minutes, hours, day-of-month, month, day-of-week —
matching every expression the service configures and the parser its sibling scheduled capability validates
against. A five-field expression SHALL be rejected by the control: it parses as a *different* schedule under a
six-field reader, so accepting one silently shifts the schedule rather than failing.

The control SHALL offer named presets alongside a custom expression. A custom expression SHALL be validated
for its field count before submission, and an invalid expression SHALL block submission with a message naming
the six-field requirement.

#### Scenario: A preset yields a six-field expression

- **WHEN** the user selects a named schedule preset
- **THEN** the value submitted as `trigger_cron` has six fields

#### Scenario: A five-field custom expression is rejected

- **WHEN** the user enters a five-field expression
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: A valid custom expression is accepted

- **WHEN** the user enters a well-formed six-field expression
- **THEN** the control accepts it and submission proceeds

### Requirement: Readiness declaration for a group rule

A `group` rule requires `ready_when`, and the service rejects the object with HTTP 422 unless at least one of
`signal`, `idle`, or `max_staleness` is present. The reason is behavioural rather than formal: a readiness
declaration satisfying none of them would leave a group perpetually dirty and never ready, so the rule would
register successfully and then do nothing.

This modal SHALL collect `idle` and `max_staleness`, and SHALL require at least one of the two before
submission. It SHALL also accept an optional `cost_ceiling`, constrained to a positive integer. `signal` — the
SQL-predicate form of readiness — is not collected here; the duration form alone yields a valid rule.

Each duration SHALL be entered as a **number paired with a unit** and submitted in the service's short form
(for example `10` and minutes submitted as `"10m"`), rather than as free text, which offers nothing but a way
to mistype a format. When a duration control is seeded with an existing value it SHALL round-trip both
accepted spellings — the short form and the ISO-8601 form — and SHALL fall back to a raw text input holding
the value verbatim when it matches neither, rather than discarding a value written directly through the API.

#### Scenario: A group rule needs at least one readiness condition

- **WHEN** the trigger kind is `group` and neither idle nor max staleness has a value
- **THEN** submission is blocked with a message that at least one is required

#### Scenario: A duration is submitted in short form

- **WHEN** the user enters 10 and selects minutes for idle
- **THEN** the request body carries `ready_when.idle` as `"10m"`

#### Scenario: Cost ceiling must be a positive integer

- **WHEN** the user enters zero or a negative cost ceiling
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: An unrecognised duration is preserved verbatim

- **WHEN** a duration control is seeded with a value matching neither the short nor the ISO-8601 form
- **THEN** it presents that value in a raw text input
- **AND** the value is not discarded

### Requirement: Group-by is derived from the target enrichment's grain key

`group_by` is a string in the API, but the service accepts exactly one value: the target enrichment's own
grain key. Anything else is rejected with HTTP 422. The constraint is physical — an enrichment is keyed on its
grain and collapses by it, so grouping by any other column would pile many groups onto a single row.

The modal SHALL therefore **derive** `group_by` from the resolved target table's `grain.grain_key` and present
it read-only, captioned as the target table's grain key. It SHALL NOT be offered as a free-text input, which
could only produce a value the service rejects. The derived value SHALL be re-read whenever the target
enrichment changes.

#### Scenario: Group-by is filled from the target's grain key

- **WHEN** the trigger kind is `group` and a target enrichment is selected
- **THEN** the group-by field shows that table's grain key and is not editable

#### Scenario: Changing the target re-derives group-by

- **WHEN** the user changes the target enrichment to one with a different grain key
- **THEN** the group-by field shows the new table's grain key

### Requirement: Rule action failures report the service's own message

The Analytics data-access service reports a failure as `{status, error, message, path, method}`, where `error`
is a stable machine code and `message` names the specific violation and often the fix. Rule actions — create,
delete, and any listing re-fetch — SHALL surface that `message` to the user as the service worded it, through
the app's error notification, rather than substituting generic text. Replacing it discards the most useful
part of the response, and the codes involved (`rule_validation_failed` at 422 and 409,
`sensitive_column_not_entitled` at 403, `write_column_not_allowed` at 422, `bad_request` at 400,
`unknown_rule` at 404) are not individually actionable in the UI in a way that generic text could preserve.

A create rejection SHALL leave the modal open with its values intact, so the operator can act on the message
without re-entering the form.

#### Scenario: A validation rejection shows the service's message

- **WHEN** creation is rejected with a `rule_validation_failed` response
- **THEN** the message from the response is shown to the user as worded by the service
- **AND** the modal stays open with its values intact

#### Scenario: A forbidden sensitive column is reported as sent

- **WHEN** an action is rejected with `sensitive_column_not_entitled`
- **THEN** the service's message is shown rather than a generic authorization error
