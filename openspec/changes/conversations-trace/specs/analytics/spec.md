## ADDED Requirements

### Requirement: Conversations page route, access guard, and server prefetch

The system SHALL expose an Analytics page at `/conversations-trace`, present in the `ApplicationRoute`
enum (`types/routes.ts`) as `ConversationsTrace`. The route directory SHALL be
`src/app/[lang]/conversations-trace/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'`, SHALL call `isAnalyticsForbidden()` before any data access and
render `Page403` when it returns `true`, and otherwise SHALL fetch the conversation rows server-side and
pass them to a client view as an initial-data prop. Code identifiers SHALL use `conversations-trace` /
`ConversationsTrace`; every user-facing string SHALL read "Conversations". The route MUST NOT collide with
the existing `/conversations` DIAL Core route — breadcrumb and menu resolution match on the exact first
path segment, so the two are independent.

#### Scenario: Page renders rows for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and the page is requested
- **THEN** the page fetches conversation rows on the server and renders the client view with them

#### Scenario: Forbidden caller sees Page403 and no query runs

- **WHEN** `isAnalyticsForbidden()` returns `true` and the page is requested
- **THEN** `Page403` is rendered
- **AND** no conversation query is issued and no fixture data is read

#### Scenario: Route does not shadow the DIAL Core conversations route

- **WHEN** the browser is at `/conversations-trace`
- **THEN** the Analytics "Conversations" menu item is the active item
- **AND** the existing `/conversations` menu item is not marked active

### Requirement: Analytics structured-query builder primitives

The system SHALL provide pure builder primitives for the analytics structured-query DSL in
`src/utils/analytics/query-build.ts`, typed exclusively against the enums in
`src/models/analytics/query.ts` (`QueryMode`, `QueryOperator`, `QueryValueType`, `QueryExprType`,
`QuerySortDirection`, `QueryPageType`). The primitives SHALL cover field and value expressions, the
`and`/`or`/`le`/`ne`/`gt`/`ico`/`in`/`is not null` nodes, function expressions with an optional `distinct`
flag, aliased output columns, sort items, an offset page, and an aggregate-query envelope. It SHALL provide
no lower-bound primitive of its own: the only lower bound these queries need arrives from
`timeRangePredicates`, which builds both range bounds together.

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

#### Scenario: Aggregate envelope sets mode explicitly

- **WHEN** an aggregate query envelope is built
- **THEN** it sets `mode: 'aggregate'` explicitly, because the service requires `mode` and never infers it
  from `group_by` or `select`

#### Scenario: Contains predicate always carries a string literal

- **WHEN** an `ico` predicate is built for any term, including one that looks numeric or boolean
- **THEN** its right operand is a value expression with `value_type: 'string'`

#### Scenario: Contains predicate adds no wildcards of its own

- **WHEN** an `ico` predicate is built for a term containing `%` or `_`
- **THEN** the literal is the term exactly as supplied, with no surrounding `%` and no escaping applied

### Requirement: Conversation list aggregate query

The system SHALL provide `buildConversationListQuery({ range, search })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity
`dial_usage_log` in aggregate mode, grouped by `['chat_id']`, selecting exactly the aliases the grid
displays:

| Alias | Expression |
|---|---|
| `turns` | `count(trace_id)` with `distinct` |
| `tokens` | `sum(total_tokens)` |
| `cost` | `sum(total_price)` |
| `last_activity` | `max(request_time)` |
| `project` | `min(project_id)` |

No output alias SHALL equal the name of a source column it aggregates over. ClickHouse expands an alias
into its own defining expression, so `min(project_id) AS project_id` is a self-reference and fails as a
cyclic alias rather than shadowing the column. The project alias is therefore `project`.

`turns` SHALL count `trace_id` distinctly: `dial_usage_log` holds one row per proxy hop and its sort key is
`(project_id, deployment, request_time, trace_id, core_span_id)`, so one turn can produce several rows
sharing a `trace_id`.

The filter SHALL be `and[ ge(request_time, startMs), le(request_time, endMs), ne(chat_id, '') ]`. The
`chat_id` guard SHALL use `ne` against the empty string and MUST NOT use `eq null`: the column is
non-nullable `String` in ClickHouse and therefore defaults to `''`, so a null comparison matches nothing.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates, matching `chat_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only
term SHALL add no predicate at all rather than an `ico` against the empty string, which would match every
row at the cost of a scan.

The search predicates SHALL match the base `project_id` column, never the `project` output alias: the
service resolves `filter` against base fields and resolves only `having` against select aliases, so the
alias would be rejected as an unknown field. The predicates SHALL stay in `filter` (WHERE) rather than
moving to `having`, which would forfeit the partition and bloom-filter pruning the base columns allow.
Filtering `project_id` before grouping trims rows out of a group rather than dropping whole groups, so a
conversation spanning several projects would report partial `turns`/`tokens`; `project_id` is effectively
constant per `chat_id`, so this cannot occur in practice.

Search MUST NOT reach message content. The only column that could match it is `request_body`, which the
service catalogues as `sensitive` (FULL_ADMIN only), so referencing it would produce an HTTP 400 for every
other caller. User-facing search affordances SHALL therefore name only the fields search actually reaches.

The sort SHALL be `[{ last_activity, desc }, { chat_id, asc }]`. The trailing `chat_id asc` tiebreaker is
required even with no sorting UI: the service appends no implicit tiebreaker, so without it a fixed page is
not stable between identical requests. `last_activity` is an aggregate select alias, which the service
resolves against base fields together with select aliases.

The page SHALL be `{ type: 'offset', offset: 0, limit: CONVERSATION_PAGE_SIZE }` with
`CONVERSATION_PAGE_SIZE = 20`, and SHALL NOT request a total: `include_total` is a required field on the
offset page type and SHALL be set to `false`, since the service populates `totalCount` only for row-mode
queries and returns `null` for aggregate mode. A limit above 1000 SHALL never be sent — the service rejects
it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema. A `sensitive` column is
absent from a non-`FULL_ADMIN` caller's schema and is rejected as an unknown field, producing an HTTP 400
indistinguishable from a typo. This query selects no sensitive column.

#### Scenario: Query is aggregate mode grouped by chat_id

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `dial_usage_log` with `mode: 'aggregate'` and `group_by: ['chat_id']`
- **AND** its select entries carry the aliases `turns`, `tokens`, `cost`, `last_activity`, `project`
- **AND** the `turns` entry sets `distinct` on a `count` of `trace_id`

#### Scenario: No alias collides with the column it aggregates

- **WHEN** the query is built
- **THEN** no select entry's alias equals the name of a source column appearing inside its own expression

#### Scenario: Time bounds are epoch-millisecond timestamp literals

- **WHEN** the query is built for a range
- **THEN** the filter contains a `ge` and an `le` predicate on `request_time`
- **AND** each carries `value_type: 'timestamp'` with the bound's epoch-millisecond count as a string

#### Scenario: Empty conversation ids are excluded by string comparison

- **WHEN** the query is built
- **THEN** the filter contains `ne(chat_id, '')` with a string-typed empty-string literal
- **AND** the filter contains no null comparison on `chat_id`

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built
- **THEN** the sort is `last_activity` descending followed by `chat_id` ascending
- **AND** `chat_id` ascending is the final sort entry

#### Scenario: No total is requested and the limit is within the maximum

- **WHEN** the query is built
- **THEN** the offset page has `offset: 0`, `limit: 20`, and `include_total: false`
- **AND** the limit does not exceed 1000

The search placeholder SHALL name only the fields the active configuration can actually match: it SHALL promise
titles only while the conversation-summary enrichment is available, since on the live path an unregistered column
cannot be referenced at all.

#### Scenario: The placeholder promises only what it can search

- **WHEN** the conversation-summary enrichment is unavailable
- **THEN** the placeholder names conversations and projects, and does not mention titles

#### Scenario: A search term becomes an OR of contains predicates

- **WHEN** the query is built with a search term
- **THEN** the filter carries one additional `or` group of exactly two `ico` predicates
- **AND** they match `chat_id` and the base `project_id` column, each against the trimmed term
- **AND** neither references the `project` output alias

#### Scenario: A blank search term adds no predicate

- **WHEN** the query is built with an empty or whitespace-only search term
- **THEN** the filter carries only the time bounds and the empty-id guard

#### Scenario: Search leaves the rest of the query untouched

- **WHEN** the query is built with a search term
- **THEN** its select, sort and page are identical to the same query built without one
- **AND** the time bounds and the empty-id guard are unchanged
- **AND** `having` is absent

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `rate_analytics` entity, not `dial_usage_log`, and the structured-query DSL accepts a
single `entity` with no join construct. A feedback filter SHALL therefore be resolved as two queries: first a
candidate query over `rate_analytics` returning the `chat_id` values carrying the requested feedback, then the
conversation query narrowed to those ids with an `in` predicate. Both SHALL be issued server-side with the
caller's token, and the `all` state SHALL issue only the conversation query, so the default path costs exactly
one request.

The candidate query SHALL be aggregate mode grouped by `chat_id`, carry the same time bounds and empty-id
guard as the conversation query, and select `chat_id` plus `max(request_time)`. It SHALL be ordered by most
recent rating so that if the candidate set reaches its limit, the ids retained are those most likely to
survive the conversation query's own `last_activity desc` ordering. Its limit SHALL NOT exceed 1000, the
service's hard maximum.

The rate predicates SHALL be:

| State | Predicate |
|---|---|
| positive | `gt(rate, 0)` |
| negative | `le(rate, 0)` |
| rated | `ne(rate, null)` |

`rate` is signed: DIAL sends `1` for a like and `-1` for a dislike, and the service normalizes a boolean
`false` to `0` and anything else to null. The negative state SHALL therefore match everything at or below
zero rather than testing for a value below zero, so a `false` normalized to `0` counts as negative
alongside a `-1` dislike. Neither
comparison SHALL carry a companion null guard: SQL three-valued logic already evaluates both to NULL for an
unrated row, so an unrated conversation matches neither. `rated` SHALL be its own `IS NOT NULL` predicate
rather than a union of the other two, so a rating outside the positive/negative split still counts as rated,
and SHALL use `ne` — the only operator besides `eq` that accepts a null right operand.

When the candidate query returns no ids the page SHALL return no rows **without** issuing the conversation
query: the service rejects an empty `in` list with HTTP 400, and "nothing carries this feedback" is already
the complete answer. Blank ids SHALL be dropped from the candidate set. When the candidate query fails, the
failure SHALL propagate and the conversation query MUST NOT run.

#### Scenario: Feedback filter issues the candidate query then the narrowed query

- **WHEN** a feedback state other than all is selected
- **THEN** a query against `rate_analytics` is issued first, carrying the state's rate predicate
- **AND** a query against `dial_usage_log` follows, restricted to the returned ids by an `in` predicate
- **AND** both carry the caller's token

#### Scenario: The default state costs one query

- **WHEN** the feedback filter is in its all state
- **THEN** only the conversation query is issued and it carries no `in` predicate

#### Scenario: No conversation carries the feedback

- **WHEN** the candidate query returns no ids
- **THEN** no rows are returned
- **AND** the conversation query is not issued

#### Scenario: The candidate query fails

- **WHEN** the candidate query returns a failure
- **THEN** that failure is returned and the conversation query is not issued

#### Scenario: Negative feedback includes a zero rating

- **WHEN** the negative state is selected
- **THEN** its predicate matches ratings less than or equal to zero, covering both a `-1` dislike and a
  `false` thumb normalized to `0`

#### Scenario: Rated covers both thumbs

- **WHEN** the rated state is selected
- **THEN** its predicate is a null comparison on `rate`, matching every conversation the two thumb states
  match and any rating outside that split

#### Scenario: Feedback composes with the other filters

- **WHEN** a feedback state is selected while a search term and a time range are applied
- **THEN** the narrowed conversation query still carries the search predicates and the time bounds

### Requirement: Provenance line and result summary

The page header SHALL state which entities the view is composed over, listing each contributing entity by its real
catalog name and colouring it with the same provenance colour the grid band uses, so the two cannot disagree. An
entity that is not registered yet SHALL be marked as pending and explained on hover, so it is never presented as a
live source.

The header SHALL show summary pills for the conversation count, the rated count, the count carrying negative
feedback, and the total cost. They SHALL be computed from the rows the page holds, not from a separate total
query, and MUST NOT be presented as totals for the whole filtered result when they are not: when the result fills
a page the count SHALL be marked as a lower bound and the hint SHALL say the totals understate the result. A row
whose rating could not be resolved MUST NOT be counted as rated, since an unresolved rating is not evidence of an
absent one.

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the values
carry twelve fractional digits, and SHALL be rounded for display. That rounding is local to the summary and does
not settle how the Cost column renders.

#### Scenario: The provenance line names the real entities

- **WHEN** the page renders with enrichment on
- **THEN** the line lists the usage-log, feedback and enrichment entities by their catalog names
- **AND** each carries the provenance colour its columns carry in the grid band
- **AND** the enrichment is marked as not yet registered

#### Scenario: Summary reflects the rows on screen

- **WHEN** the page holds fewer rows than one page
- **THEN** the conversation count is exact
- **AND** the rated count is shown as a fraction of those conversations

#### Scenario: Summary marks a capped result as a lower bound

- **WHEN** the page holds a full page of rows
- **THEN** the conversation count is shown as a lower bound rather than an exact total
- **AND** its hint says the totals understate the result

#### Scenario: An unresolved rating is not counted as rated

- **WHEN** a row's rating could not be resolved
- **THEN** it counts toward neither the rated nor the negative pill

### Requirement: Conversation filters re-query the backend

The conversations page SHALL provide a free-text search box, a time-period control and a feedback filter, and
every change to any of them SHALL produce a new backend request carrying the filter values. The page MUST NOT
filter, hide or reorder rows it already holds in response to a filter change: the grid holds at most one
page of aggregate rows, so narrowing those client-side would silently hide matches that exist outside the
page and report a wrong result as a complete one. The rows the response returns SHALL replace the rows the
grid holds.

The time-period control SHALL reuse the shared `TimeFilter` component and the `useTimeFilter` hook — the
same controls the dashboard and Usage Log use — so presets, the custom range picker and their labels behave
identically across the app. The page's default period SHALL be the 7-day preset.

Filter state SHALL cross the server-action boundary as a search string plus the range's start and end as
epoch milliseconds, not as `Date` instances: epoch millis are already the shape the query's timestamp
literals require, and the boundary then carries no value whose serialization has to be reasoned about.

Search input SHALL be debounced so that a burst of keystrokes issues one request rather than one per
character, while the box SHALL show each character as it is typed. A time-period or feedback change SHALL NOT
be debounced — each is one deliberate action, so it queries immediately. Because a debounced search can
overlap either and its response can arrive after the newer one, the page SHALL apply only the most recent
request's response.

The server component's initial prefetch SHALL use the same defaults the controls mount with, and mounting
the client view MUST NOT re-issue that request.

A failed conversations request SHALL be reported to the operator rather than rendered as an absence of
data. An emptied grid alone is indistinguishable from a period that genuinely held no conversations, so a
failure SHALL surface both as an error toast and in the empty state's own wording, and the failed state
SHALL clear as soon as a later request succeeds. The server prefetch reports its failure through the
initial state it hands the client view, since a server component cannot raise a toast; because the action
returns a failure in its `ServerActionResponse` rather than throwing, the prefetch MUST test the success
flag rather than treating absent rows as an empty result.

#### Scenario: A search term issues a new query

- **WHEN** the operator types a term into the search box
- **THEN** the server action is called with that term
- **AND** the grid's rows are replaced by the rows the response returns

#### Scenario: Keystrokes collapse into one request

- **WHEN** the operator types several characters in quick succession
- **THEN** the box shows each character immediately
- **AND** exactly one request is issued for the burst

#### Scenario: A time-period change issues a new query

- **WHEN** the operator selects a different time preset
- **THEN** the server action is called with the new range as epoch-millisecond bounds
- **AND** the currently applied search term is carried into that request

#### Scenario: A feedback change issues a new query without waiting

- **WHEN** the operator selects a feedback state
- **THEN** the server action is called immediately with that state, without waiting out the search debounce
- **AND** the currently applied search term is carried into that request

#### Scenario: Mounting does not duplicate the prefetch

- **WHEN** the client view mounts with server-prefetched rows and no filter has changed
- **THEN** no request is issued

#### Scenario: A stale response cannot overwrite a newer one

- **WHEN** two filter changes are in flight and the earlier one's response arrives last
- **THEN** the rows shown are those of the most recently issued request

#### Scenario: A failed filtered request does not leave stale rows

- **WHEN** a request issued by a filter change fails
- **THEN** the grid does not keep showing rows that no longer match the applied filters

#### Scenario: A failed request says so rather than reading as no traffic

- **WHEN** a request issued by a filter change fails
- **THEN** an error notification names the failure
- **AND** the empty grid reports the failure instead of "No conversations"

#### Scenario: A successful request clears an earlier failure

- **WHEN** a request succeeds after an earlier one failed
- **THEN** the grid shows the returned rows and no longer reports a failure
- **AND** a successful request raises no notification

#### Scenario: A failed prefetch is reported through the initial state

- **WHEN** the server prefetch returns a failure and the client view mounts with no rows
- **THEN** the empty state reports the failure rather than an empty period
- **AND** no request is issued on mount

### Requirement: Hardcoded mock switch for the conversations data source

The system SHALL gate the conversations data source on a single hardcoded constant in
`src/mocks/analytics/conversations-trace.ts` — beside the fixtures it switches on, so that deleting that
one file removes the mock whole — read only from the `'use server'` action module. The
constant SHALL be explicitly annotated as `boolean` (not left to literal-type inference) so that both
branches remain reachable and independently testable, and SHALL default to mock-enabled. It MUST NOT be an
environment variable and MUST NOT be a `NEXT_PUBLIC_` value; switching data sources is a manual source
edit.

When the switch is enabled the action SHALL return the fixtures without calling
`analyticsDataApi.executeAction`. When disabled it SHALL build the conversation query and delegate to
`analyticsDataApi.executeAction` with the caller's token, returning a `ServerActionResponse`. Because the
switch and the fixtures are referenced only from server modules, no fixture module can reach the client
bundle.

With the switch enabled the action SHALL apply the same predicate semantics to the fixtures that the query
would apply to the backend — the time bounds on `last_activity`, the case-insensitive contains across
conversation id and project, and the page limit — so the filter controls behave identically on either data
source. This fixture filtering SHALL happen inside the server action, the same place the query is otherwise
built; it is the single point at which the two data sources diverge and MUST NOT be mistaken for, or
implemented as, client-side filtering of held rows.

#### Scenario: Switch enabled returns fixtures without a query

- **WHEN** the mock constant is `true` and the conversations action is invoked
- **THEN** the fixture rows are returned
- **AND** `analyticsDataApi.executeAction` is not called

#### Scenario: Filters narrow the fixtures too

- **WHEN** the mock constant is `true` and the action is invoked with a search term, and again with a
  narrower time range
- **THEN** each returns fewer rows than the unfiltered call
- **AND** neither returns zero rows for a term and range the fixtures cover

#### Scenario: Switch disabled delegates to the analytics api client

- **WHEN** the mock constant is `false` and the conversations action is invoked
- **THEN** `analyticsDataApi.executeAction` is called with the built conversation query and the caller's
  token
- **AND** the api client's `ServerActionResponse` is returned unchanged

#### Scenario: Fixtures are not reachable from client code

- **WHEN** the client view module graph is inspected
- **THEN** it contains no import of the fixture module, directly or transitively

### Requirement: Conversation fixtures reproduce real backend value shapes

The system SHALL provide 10–20 aggregate-shaped fixture rows in
`src/mocks/analytics/conversations-trace.ts`. Fixture values SHALL reproduce the shapes the live
backend actually returns rather than presentation-ready values, so that formatting and layout defects
surface while the mock is the default rather than on the first manual flip. Specifically the fixtures SHALL
include:

- a `cost` at the full scale of a `Decimal(38, 12)` sum, because the shared currency formatter renders the
  value through `Big#toString()` without rounding
- at least one row whose `tokens` and `cost` are `null`, since both underlying columns are nullable and an
  aggregate over an all-null group sums to `null`, not `0`
- at least one row with an empty `project_id`
- `chat_id` values of realistic production length, not shortened display ids, so column proportions are
  tuned against real content
- a wide spread of `turns` values
- a rating per conversation standing in for its `rate_analytics` rows, spread across positive, negative — using
  both the `0` and the negative encodings — and unrated, with at least one positive and one negative recent
  enough to survive the narrowest time window
- a `title` and a `snippet` standing in for the not-yet-existing enrichment, each independently absent on some
  rows so that every combination is covered: both present, title only, snippet only, and neither. Snippets SHALL
  be long enough to overflow the conversation column, so it is tuned against real text rather than short labels.

Fixture-only bookkeeping — the range offset and the rating — MUST NOT appear on the produced rows. The rating is
a filter input, not a displayed column, and a row carrying it would let a column bind to data the live path
cannot supply.

Fixture activity SHALL be expressed as a distance back from the requested range's end rather than as an
absolute instant, and SHALL be resolved against that end when the rows are produced. Absolute fixture
timestamps fall outside a sliding "last N" window within days and would leave the page permanently empty,
which is indistinguishable from a broken query. Their offsets SHALL span from minutes to several days so
that each time preset returns a different, plausible subset and the time control is demonstrably doing
something without a populated backend. Offsets SHALL ascend, matching the descending `last_activity` order
the query returns.

#### Scenario: Cost fixture carries full decimal scale

- **WHEN** the fixture rows are read
- **THEN** at least one `cost` value carries the full fractional scale of a `Decimal(38, 12)` sum rather
  than a rounded display value

#### Scenario: Null metrics are represented

- **WHEN** the fixture rows are read
- **THEN** at least one row has `tokens` and `cost` equal to `null`

#### Scenario: Fixture count is within the demo range

- **WHEN** the fixture rows are read
- **THEN** there are between 10 and 20 rows inclusive

#### Scenario: Fixtures never age out of a sliding window

- **WHEN** the fixtures are produced for a range whose end is much later than when they were written
- **THEN** the same number of rows is returned, shifted to sit inside that range

#### Scenario: Narrower presets return proper subsets

- **WHEN** the fixtures are produced for a narrow range and again for a wide one
- **THEN** the narrow result is non-empty, smaller, and a subset of the wide result

### Requirement: Rating column resolved for the displayed page

The grid SHALL show a Rating column giving each conversation's positive and negative rating counts, attributed
in the provenance band to `rate_analytics` rather than to `dial_usage_log`.

Ratings SHALL be resolved by a query issued **after** the conversation query, restricted by `in` to exactly the
conversation ids the page is displaying. Resolving them from the feedback filter's candidate set instead MUST NOT
be done: that set is capped, so a displayed conversation could fall outside it and be reported as unrated when it
is not. The ratings query SHALL be skipped entirely when the page has no rows.

The split SHALL NOT be derived from one aggregate. `rate` is a signed integer — DIAL sends `1` for a like and
`-1` for a dislike, and the service normalizes a boolean `false` to `0` — so `count(rate)` and `sum(rate)` do not
determine the two directions: one like and one dislike sum to zero, indistinguishable from no likes at all.

Each direction SHALL instead be counted by its own query: aggregate mode grouped by `chat_id`, selecting
`count(rate)`, restricted by `in` to the displayed ids, and filtered by the **same** rate predicate the
corresponding feedback filter uses — `gt(rate, 0)` for the positive side and `le(rate, 0)` for the negative one.
Reusing those predicates is what guarantees the column agrees with the filter: a conversation the Positive filter
selected cannot then display a zero positive count. Two queries are required because the language offers no
conditional aggregation; they SHALL be issued concurrently.

Both queries SHALL carry the same time bounds as the conversation query. Bounding them identically keeps the
column and the feedback filter consistent. The consequence — a rating given outside the selected period is not
counted — is accepted for that consistency.

Summary figures that are a lower bound SHALL carry their caveat in content reachable by keyboard and by assistive
technology, not in a hover-only `title` on a non-interactive element. The caveat SHALL NOT replace the figure as
the element's accessible name.

Both counts SHALL be displayed at all times, including a zero, so the absence of ratings on one side is visible
rather than implied. A side carrying ratings SHALL be coloured — positive as success, negative as error, from
theme tokens — and a side with none SHALL stay muted. Each side SHALL carry a text label for assistive
technology, since the icons carry the meaning.

When either ratings query fails, both counts SHALL be left unresolved and the cell SHALL render nothing rather
than displaying zeros or a half-counted split, which would assert an absence of feedback that was never established. The conversation rows
themselves SHALL still be returned.

A comment indicator SHALL NOT be shown. `rate_analytics.comment` is catalogued sensitive, so it cannot be
selected — or even counted — by a non-`FULL_ADMIN` caller.

#### Scenario: Ratings are resolved for exactly the displayed conversations

- **WHEN** the conversation query returns rows
- **THEN** one `rate_analytics` count query per direction follows, each restricted by `in` to those
  conversations' ids
- **AND** neither is issued at all when there are no rows

#### Scenario: Both directions are always shown

- **WHEN** a conversation has positive ratings and no negative ones
- **THEN** the cell shows the positive count coloured and a muted zero for the negative side

#### Scenario: A conversation rated both ways shows both counts

- **WHEN** a conversation carries one like and one dislike
- **THEN** it shows one on each side, each coloured for its own direction — not zero likes, which is what a
  `count`-and-`sum` split reports for a signed rate

#### Scenario: An unrated conversation is muted, not blank

- **WHEN** a conversation has no ratings in the period
- **THEN** both sides show a muted zero

#### Scenario: A failed ratings lookup shows nothing rather than zero

- **WHEN** the ratings query fails
- **THEN** the conversation rows are still returned
- **AND** their rating cells render nothing, asserting no absence of feedback

### Requirement: Conversation cells render composed values, not raw aggregates

The grid SHALL render composed cells rather than one raw aggregate per column:

- The project column SHALL stack the project over the model the conversation used, the model shown as a chip with
  a colour dot derived from its name so a model keeps the same colour between rows and renders. `deployment` is
  not a grouping key, so the model comes from an aggregate and reports only one value; the query SHALL therefore
  also select the distinct deployment count, and the cell SHALL show how many further models a conversation used
  rather than implying it used one.
- The activity column SHALL stack how long ago the conversation was last active over how long it ran. The span
  requires the first activity as well as the last, so the query SHALL select both bounds of `request_time`. The
  absolute instant SHALL stay reachable on hover, since relative time is readable but imprecise.
- Token counts SHALL be compacted rather than delimited in full.
- Cost SHALL be rounded to significant digits and coloured. Rounding SHALL be local to this page and MUST NOT
  change the shared currency formatter, so other price columns are unaffected.

Relative time and span helpers SHALL take the current time as a parameter rather than reading the clock, so they
stay deterministic and need no fake timers. Colour dots SHALL come from theme tokens, never literal values.

Every composed cell SHALL degrade rather than break when part of its data is missing: an absent model leaves the
project alone, an absent first activity leaves the relative time alone, and an absent last activity renders
nothing at all.

#### Scenario: The project cell carries the model

- **WHEN** a row has a project and a model
- **THEN** the cell shows the project above a model chip with a colour dot
- **AND** the dot colour is stable for that model name

#### Scenario: A conversation spanning models says so

- **WHEN** a conversation used more than one deployment
- **THEN** the cell reports how many further models it used

#### Scenario: The activity cell carries the span

- **WHEN** a row has both activity bounds
- **THEN** the cell shows the relative time over the span
- **AND** the absolute timestamp is available on hover

#### Scenario: Composed cells degrade on missing parts

- **WHEN** the model is absent
- **THEN** the project renders alone
- **AND** when the first activity is absent, the relative time renders alone
- **AND** when the last activity is absent, the cell renders nothing

#### Scenario: Cost is readable

- **WHEN** a cost arrives at the full scale of a decimal sum
- **THEN** it renders rounded to significant digits rather than showing every fractional digit

### Requirement: Conversation title and snippet come from an enrichment

The conversation cell SHALL render a derived title over a message snippet, both typed nullable on
`ConversationRow`. Neither has a source column in `dial_usage_log`: the only column that could yield them is
`request_body`, which the catalog marks `sensitive`. They SHALL instead be supplied by an enrichment at `chat_id`
grain whose evaluator reads the sensitive column server-side and writes non-sensitive derived columns — the
supported way to expose a value derived from a restricted column without granting access to it.

Because the service publishes an enrichment's columns into its source's flat query schema and LEFT-joins them on
the grain key, these columns SHALL be selectable within the existing conversation query — no second query and no
client-side merge. They SHALL therefore be referenced only once the enrichment is registered: an unknown field is
rejected with an HTTP 400 indistinguishable from a typo, so until then no query SHALL reference them and the
fixtures SHALL be their only source.

The fields SHALL remain nullable permanently, not merely until the enrichment exists, because the join is a LEFT
join: a conversation whose evaluator has not run yet has no row on the enrichment side.

When selected, an enrichment column SHALL be aliased in the query. The service publishes enrichment columns
under a dotted name qualified by their owning table so they cannot collide with source columns, and a dotted
key does not bind to a grid column — the alias is what makes the value reachable in a cell.

The cell SHALL degrade rather than blank out when either value is missing: the conversation id SHALL occupy the
title line when there is no title and the second line when a title displaced it, and an absent value MUST NOT
render an empty line. An empty string SHALL be treated as absent, since a value that LEFT-joined to nothing may
arrive either way. With both values present the two lines are full and the raw id is not displayed.

Search SHALL match the title and the snippet as well as the conversation id and project. On the live path the
enrichment columns are only referenced once the enrichment is available, because an unknown field is rejected as a
400 — and until then no row carries a title, so nothing is missed by not searching one. Selecting the enrichment
columns and searching them SHALL be governed by the **same** flag, so the two can never drift into a state where a
title is displayed but not searchable.

Enrichment columns are filterable, not merely selectable: the service publishes them into the same field bindings
as base columns under their dotted name, and referencing one in the filter emits the join. So the search predicate
needs no separate mechanism from the source columns.

#### Scenario: A fully enriched row shows the title and snippet

- **WHEN** a row carries both a title and a snippet
- **THEN** the cell shows the title on the first line and the snippet on the second
- **AND** the conversation id is not displayed

#### Scenario: An unenriched row falls back to the id

- **WHEN** a row carries neither a title nor a snippet, as on the live path
- **THEN** the cell shows the conversation id once and renders no empty second line

#### Scenario: A partially enriched row keeps the id visible

- **WHEN** a row carries a title but no snippet
- **THEN** the title is on the first line and the conversation id on the second
- **AND** when a row carries a snippet but no title, the id takes the first line and the snippet the second

#### Scenario: An empty enrichment value is treated as absent

- **WHEN** a title or snippet arrives as an empty string
- **THEN** the cell renders as though the value were absent, with no blank line

#### Scenario: Search matches a title and a snippet

- **WHEN** a term matching only a conversation's title is searched
- **THEN** that conversation is returned
- **AND** a term matching only its snippet returns it too
- **AND** a conversation with no title stays reachable by its id

#### Scenario: The enrichment is referenced only when it exists

- **WHEN** the enrichment is unavailable
- **THEN** the query neither selects nor searches its columns
- **AND** when it becomes available, one flag turns on both

### Requirement: Conversation row values tolerate either backend wire shape

The `ConversationRow` model in `src/models/analytics/conversations-trace.ts` SHALL type its timestamp and
numeric-metric fields to accept either a number or a string, and nullable metrics to additionally accept
`null`. The wire type of an aggregate over a ClickHouse `DateTime64` and the scale of an aggregate over a
`Decimal(38, 12)` are not fixed by the service contract — result values pass through untransformed and its
JSON mapper configures no date handling — so the page SHALL NOT depend on one shape. The shared formatters
(`formatDateTimeToLocalString`, `currencyValueFormatter`, `numberValueFormatter`) already accept
`number | string`, so tolerating both costs nothing.

#### Scenario: Timestamp renders from either wire shape

- **WHEN** `last_activity` arrives as an epoch-millisecond number
- **THEN** the activity cell renders a formatted local date-time
- **AND** the same cell renders a formatted local date-time when the value arrives as an ISO-8601 string

#### Scenario: Null metrics render as empty cells

- **WHEN** a row's `tokens` or `cost` is `null`
- **THEN** the corresponding cell renders empty rather than `0`, `null`, or `NaN`

### Requirement: Read-only conversations grid

The conversations view SHALL render a grid of six visible columns — conversation id, project, turns,
activity, tokens, cost. No column SHALL be sortable, and no column SHALL offer a filter control of its own —
neither a floating filter row nor a filter menu in the header. Per-column filtering stays off even though
the page itself has filters: the page's filters are query predicates over the whole result, whereas a column
filter narrows only the page already fetched, and would report that narrowed view as the complete answer.

The grid SHALL be given the rows to display and nothing more — it MUST NOT be handed a superset to narrow,
and no grid-level filter model SHALL be set from the page's filter state. While a filter change is in
flight the view SHALL show a loading indicator in place of the grid, so the empty state cannot flash between
a filter change and its rows. When there are no rows the view SHALL render a no-data state rather than an
empty grid body.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app,
and the activity column SHALL render absolute local time, so the page introduces no formatting of its own.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

The grid SHALL carry a provenance band above the column headers, grouping every column under the data source
it comes from, and a column MUST NOT be able to leave its group when moved.

Every column SHALL belong to exactly one group: an unattributed column would imply a provenance the page has not
stated. Group labels SHALL name the actual source of the columns beneath them and MUST NOT overstate it — a
column read from a source table MUST NOT be labelled as enrichment-derived. Each group SHALL carry a tooltip
naming its source precisely, including whether that source is live yet.

Groups whose data is derived rather than read directly SHALL be visually distinguished from source-table groups,
by colour and an icon. Colours SHALL come from theme tokens, never literal values, and the icon SHALL be
decorative only — hidden from assistive technology, since the label already names the source. Every provenance
value SHALL map to a colour, so a newly added one cannot render unstyled.

The band and the column-header row SHALL each carry their own height, and the band label SHALL be separated
from the column header beneath it.

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group

#### Scenario: Derived data is distinguished from source-table data

- **WHEN** a group's data is derived by an enrichment rather than read from a source table
- **THEN** that group is marked with its own colour and a decorative icon
- **AND** a group read directly from a source table carries no such icon

#### Scenario: A group explains its source on hover

- **WHEN** a provenance group header is hovered
- **THEN** a tooltip names the source the columns come from
- **AND** for a source that is not live yet, it says the values are samples

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: Rows render from the supplied data

- **WHEN** the view receives conversation rows
- **THEN** one grid row renders per conversation, most recent `last_activity` first
- **AND** the conversation id, project, turns, activity, tokens and cost columns are present

#### Scenario: Sorting is disabled

- **WHEN** a column header is clicked
- **THEN** the row order does not change and no sort indicator appears

#### Scenario: No filter control is reachable

- **WHEN** the grid renders
- **THEN** no floating filter row appears beneath the header row
- **AND** no column header offers a filter control, so no client-side filter can be applied

#### Scenario: Empty result renders the empty state

- **WHEN** the view receives zero conversation rows
- **THEN** the no-data content renders instead of an empty grid body

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** a filter change is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown

## MODIFIED Requirements

### Requirement: Analytics menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Query Builder" (linking to the Query Builder route), "Tables" (linking to the Tables route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/query-builder`, `/tables`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Query Builder", "Tables", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Query Builder" sub-item linking to `/query-builder`
- **AND** it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows a "Conversations" sub-item linking to `/conversations-trace`

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
