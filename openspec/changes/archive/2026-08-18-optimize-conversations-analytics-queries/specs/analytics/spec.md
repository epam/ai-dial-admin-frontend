## ADDED Requirements

### Requirement: Entity schema responses are cached per caller role

An entity's schema describes the shape of a table rather than its contents: it changes when the table's
schema is patched, not when rows arrive. Re-fetching it on every page load spends a request on an answer that
did not change. The system SHALL therefore serve the `conversations` entity schema from a cache rather than
querying the analytics service on each page load.

The cache key SHALL include the caller's role, not the entity name alone. The service filters `sensitive`
columns from the schema by the caller's role, so one entity has more than one correct answer: a key that
ignores the role would either disclose to a caller field names their role withholds, or withhold from a
caller field names their role permits. A cached entry SHALL NOT be served to a caller whose role differs from
the one it was resolved under.

A cached entry SHALL expire after a bounded lifetime. The schema is stable, not immutable — a table schema
patch changes it — so an entry that never expires would pin the view to a field set the entity no longer has.

A cache miss, an expired entry, or a failed lookup SHALL fall through to the service exactly as an uncached
fetch does, and a fetch failure SHALL NOT be cached: a failure is a statement about one request, not about
the schema, and caching it would extend one outage over the entry's whole lifetime.

#### Scenario: A repeated load does not re-query the schema

- **WHEN** the conversations page is loaded twice in succession by the same caller within the entry's lifetime
- **THEN** the entity schema is fetched from the analytics service once
- **AND** the second load renders the same column catalog as the first

#### Scenario: A different role does not read another role's entry

- **WHEN** a caller whose role withholds sensitive columns loads the page after a caller whose role permits them
- **THEN** the schema served to the second caller is the one their own role resolves
- **AND** it does not offer a column their role withholds

#### Scenario: An expired entry is re-resolved

- **WHEN** the page is loaded after the cached entry's lifetime has elapsed
- **THEN** the schema is fetched from the analytics service again
- **AND** a field added to the entity since the entry was cached is offered in the catalog

#### Scenario: A failed schema fetch is not cached

- **WHEN** a schema fetch fails and the page is loaded again
- **THEN** the schema is fetched from the analytics service again rather than the failure being replayed

## MODIFIED Requirements

### Requirement: Conversations page route, access guard, and server prefetch

The system SHALL expose an Analytics page at `/conversations-trace`, present in the `ApplicationRoute`
enum (`types/routes.ts`) as `ConversationsTrace`. The route directory SHALL be
`src/app/[lang]/conversations-trace/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'`, SHALL call `isAnalyticsForbidden()` before any data access and
render `Page403` when it returns `true`. Code identifiers SHALL use `conversations-trace` /
`ConversationsTrace`; every user-facing string SHALL read "Conversations". The route MUST NOT collide with
the existing `/conversations` DIAL Core route — breadcrumb and menu resolution match on the exact first
path segment, so the two are independent.

For a permitted caller the page SHALL prefetch the **entity schema** server-side and pass it to the client
view as an initial-data prop, so the column catalog is known before the grid mounts. A schema prefetch
failure SHALL be reported through the initial state handed to the client view, since a server component
cannot raise a toast.

The page MUST NOT prefetch the first page of rows: the grid fetches its own pages, so a prefetched page would
be discarded or duplicated. The page MUST NOT prefetch the **result summary** either. The summary is required
to be an observation of the same fetch cycle as the rows on screen, so a summary resolved during server
rendering is superseded by the client's own first fetch the moment it lands; resolving it twice buys nothing
but a scan of the whole filtered result. The summary figures SHALL therefore be unavailable until the
client's first fetch resolves them, and the view SHALL render that pending state rather than zeros, which
would assert an empty result that was never established.

The page SHALL depend on the `conversations` entity being registered and populated in the environment it runs
against. Where it is absent, the access guard still passes and the conversation query fails with HTTP 400; the
page SHALL surface that as a load failure rather than as an empty period. That failure SHALL be reported by
the client's own fetch, which is the first request the page makes against the entity.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and the page is requested
- **THEN** the page prefetches the entity schema on the server and renders the client view with it
- **AND** the grid requests its first page of rows

#### Scenario: The summary is not resolved during server rendering

- **WHEN** the page is requested by a permitted caller
- **THEN** no result-summary query is issued while the page is rendered on the server
- **AND** the summary pills report their figures as pending until the client's first fetch resolves them

#### Scenario: Forbidden caller sees Page403 and no query runs

- **WHEN** `isAnalyticsForbidden()` returns `true` and the page is requested
- **THEN** `Page403` is rendered
- **AND** no conversation query is issued

#### Scenario: Route does not shadow the DIAL Core conversations route

- **WHEN** the browser is at `/conversations-trace`
- **THEN** the Analytics "Conversations" menu item is the active item
- **AND** the existing `/conversations` menu item is not marked active

#### Scenario: A missing conversations entity reads as a failure

- **WHEN** the `conversations` entity is not registered in the environment and the page is requested
- **THEN** the view reports a load failure
- **AND** it does not report that the period held no conversations

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `rate_analytics` entity, which the conversation rollup does not include, and the
structured-query DSL accepts a single `entity` with no join construct. A feedback filter SHALL therefore be
resolved as two queries: first a candidate query over `rate_analytics` returning the `chat_id` values carrying
the requested feedback, then the conversation query over `conversations` narrowed to those ids with an `in`
predicate. Both SHALL be issued server-side with the caller's token, and the `all` state SHALL issue only the
conversation query, so the default path costs exactly one request per page.

Both queries SHALL be issued within a **single** request from the client when the first page of a result is
fetched, rather than the client resolving candidates in one request and the page in another. The candidate
ids SHALL be returned to the client alongside that first page.

The candidate set SHALL be resolved once per filter state and reused across the pages of that result, rather
than re-queried per page: the narrowing is a property of the filter, not of the page. The reuse SHALL be held
per client, keyed by the filter state it was resolved under, and the ids SHALL be carried back with each
later page of that result. The candidate set MUST NOT be held in a cache shared between callers: it is
resolved under the caller's token, so serving one caller's set to another would narrow a result by rows the
second caller's token never selected.

When the candidate set reaches that limit the view SHALL state that the feedback-filtered result may be
incomplete and that the conversations shown are the most recently rated ones. The cap truncates the result
regardless of how it is ordered, and the ordering is the operator's to choose, so a truncated result MUST NOT
be presented as the complete set of conversations carrying that feedback. The disclosure SHALL be visible
while the capped filter state is applied and SHALL clear when the filter state no longer reaches the cap.

The candidate query SHALL be aggregate mode over `rate_analytics` grouped by `chat_id`, carry the same time
bounds as the conversation query and an empty-id guard, and select `chat_id` plus `max(request_time)`. It SHALL
be ordered by most recent rating, so that if the candidate set reaches its limit the ids retained are the most
recently rated ones. Its limit SHALL NOT exceed 1000, the service's hard maximum.

The rate predicates SHALL be:

| State | Predicate |
|---|---|
| positive | `gt(rate, 0)` |
| negative | `le(rate, 0)` |
| rated | `ne(rate, null)` |

`rate` is signed: DIAL sends `1` for a like and `-1` for a dislike, and the service normalizes a boolean
`false` to `0` and anything else to null. The negative state SHALL therefore match everything at or below
zero rather than testing for a value below zero, so a `false` normalized to `0` counts as negative alongside a
`-1` dislike. Neither comparison SHALL carry a companion null guard: SQL three-valued logic already evaluates
both to NULL for an unrated row, so an unrated conversation matches neither. `rated` SHALL be its own
`IS NOT NULL` predicate rather than a union of the other two, so a rating outside the positive/negative split
still counts as rated, and SHALL use `ne` — the only operator besides `eq` that accepts a null right operand.

When the candidate query returns no ids the page SHALL return no rows **without** issuing the conversation
query: the service rejects an empty `in` list with HTTP 400, and "nothing carries this feedback" is already
the complete answer. Blank ids SHALL be dropped from the candidate set. When the candidate query fails, the
failure SHALL propagate and the conversation query MUST NOT run.

#### Scenario: Feedback filter issues the candidate query then the narrowed query

- **WHEN** a feedback state other than all is selected
- **THEN** a query against `rate_analytics` is issued first, carrying the state's rate predicate
- **AND** a query against `conversations` follows, restricted to the returned ids by an `in` predicate
- **AND** both carry the caller's token

#### Scenario: The first page costs one request, not two

- **WHEN** a feedback state other than all is selected and the first page of the result is fetched
- **THEN** the client issues exactly one request for that page
- **AND** the candidate ids are returned to the client with it

#### Scenario: Later pages reuse the ids without re-resolving them

- **WHEN** the operator scrolls to a further page of a feedback-filtered result
- **THEN** no further query against `rate_analytics` is issued
- **AND** the page request carries the candidate ids the first page returned

#### Scenario: The default state costs one query per page

- **WHEN** the feedback filter is in its all state
- **THEN** only the conversation query is issued and it carries no `in` predicate

#### Scenario: A capped candidate set is disclosed

- **WHEN** the candidate query returns its full limit of ids
- **THEN** the view states that the result may be incomplete and covers the most recently rated
  conversations

#### Scenario: The disclosure clears when the filter state no longer caps

- **WHEN** the operator changes to a filter state whose candidate set is below the limit
- **THEN** the incompleteness disclosure is no longer shown

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

### Requirement: Conversation list query over the conversations entity

The system SHALL provide
`buildConversationListQuery({ range, search, chatIds, sort, columnFilters, visibleFields, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `conversations`
in **row mode**. The conversation rollup is materialized by the analytics service — one row
per `chat_id`, produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored
columns and MUST NOT group or aggregate.

The select SHALL name the fields the curated columns require, by their entity field names:

| Field | Renders as |
|---|---|
| `chat_id` | conversation |
| `project_id` | project |
| `user_hash` | user |
| `turn_count` | turns |
| `total_tokens` | tokens |
| `total_price` | cost |
| `last_request_time` | activity (relative) |
| `first_request_time` | activity (span) |
| `duration_ms` | duration |
| `deployments` | models |

It SHALL additionally name **every offered field the entity's own source carries**, whether or not its column
is currently visible. Such a field costs the query one more column of the table it is already reading, which
is less than what re-fetching every loaded page costs when the operator reveals its column.

It SHALL name a field the service reports under an **enrichment namespace** — a name qualified by the
enrichment that supplies it, `conversation_insights.` and `conversation_buckets.` being the two the
`conversations` entity currently exposes — only while that field's column is visible. The service joins an
enrichment only when a query names one of its columns, so naming one unconditionally would add that join to
every page of every scroll, for columns the operator has not asked for.

It MUST NOT name every field the entity carries: the field set is whatever the service reports and can grow,
and a field the catalog does not offer is one no column renders. A column with no field behind it — Rating is
composed from `rate_analytics` lookups — MUST NOT be named at all, since the entity has no such column.

Making a hidden **enrichment-backed** column visible SHALL restart paging, because the fetched pages do not
carry that field and a column rendered from an absent value would read as empty data rather than as data not
fetched. Making a hidden **source-backed** column visible SHALL NOT re-query: its field is already in every
fetched page, so the rows already held render it. Hiding a visible column SHALL NOT re-query in either case:
the rows already held remain a correct answer to a narrower projection. The whole-result count and cost SHALL
be unaffected by which columns are visible, being aggregates over the filtered result rather than over the
projection.

`turn_count` is the pipeline's count of the conversation's **distinct trace ids**, one trace per request, so
it is a count of turns and not of usage-log rows: the embedding, MCP and routing hops a request fans out
into collapse into the trace that produced them. Turn, request and trace therefore name one quantity, and
user-facing copy SHALL call it **turns** throughout — a second name for the same figure reads as a second
figure. Copy MUST NOT claim it counts individual hops.

The filter SHALL be `and[ ge(last_request_time, startMs), le(last_request_time, endMs) ]`. The time bounds
SHALL apply to `last_request_time`, so a selected period means *conversations whose last activity falls in the
period*. The query MUST NOT carry an empty-`chat_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates matching `chat_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only term
SHALL add no predicate at all rather than an `ico` against the empty string, which would match every row at
the cost of a scan. Both targets are base columns of the entity, so no select-alias restriction applies.

Search MUST NOT reach message content: no column of `conversations` carries it, and the only column that
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. Search
SHALL NOT reach `user_hash` either: selecting the column for display does not make a surrogate a useful
free-text target, and a partial-match predicate over it would cost a scan for a value operators paste whole —
the user column's own filter is the exact-value input for it. The search affordance SHALL name only the fields
search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(chat_id, chatIds)`, which is how the
feedback filter narrows the result.

When `columnFilters` is non-empty the filter SHALL additionally carry one predicate per entry, conjoined with
everything above. Each entry names a field of the entity and an operator the language expresses; an entry
naming a field the entity does not carry, or an operator with no equivalent, SHALL be rejected rather than
translated to an approximation. A range entry SHALL become a `ge` and an `le` predicate on the same field.
Predicate value types SHALL follow the field's type: string fields carry string literals, count fields
integers, price fields decimals, and timestamp fields epoch-millisecond literals.

An array field SHALL carry neither a sort key nor a filter predicate: the query language expresses no ordering
or comparison over one, so a request to sort or filter by such a field SHALL be rejected rather than
approximated client-side over the loaded page.

The sort SHALL be the caller's sort keys, if any, followed by `{ chat_id, asc }`; with no caller sort keys it
SHALL be `[{ last_request_time, desc }, { chat_id, asc }]`. The trailing `chat_id asc` tiebreaker is required
in every case: the service appends no implicit tiebreaker, so without it a paged result is not stable across
requests and a row could be skipped or repeated between pages. A caller sort key SHALL carry an explicit
nulls ordering placing nulls last, so a column holding nulls orders deterministically rather than relying on
the backend's default. A sort key naming a field the entity does not carry SHALL be rejected: sorting by a
value the query cannot name would silently fall back to an unstated order.

The page SHALL be `{ type: 'offset', offset, limit, include_total: false }`, on **every** page including the
first. The result total is resolved by the summary query under an identical filter, so requesting it here
resolves the same figure a second time; the service issues `include_total` as its own statement over the whole
filtered result, so the second resolution costs a scan per page fetched. A limit above 1000 SHALL never be
sent — the service rejects it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema; `conversations` exposes no
`sensitive` column, so every selected field is visible to a read-only admin. `user_hash` is catalogued
non-sensitive — the analytics service exposes it as a de-identified surrogate — so selecting, sorting or
filtering on it requires no elevated role.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `conversations` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `chat_id`, `project_id`, `user_hash`, `turn_count`, `total_tokens`, `total_price`,
  `last_request_time`, `first_request_time`, `duration_ms` and `deployments`

#### Scenario: The query requests no result total

- **WHEN** the query is built for the first page, and again for a later page
- **THEN** each carries `include_total: false`

#### Scenario: Source-owned fields are projected whether or not their columns are visible

- **WHEN** the query is built while every schema-driven column is hidden
- **THEN** its select names each offered field the entity's own source carries
- **AND** it names no field reported under an enrichment namespace

#### Scenario: Time bounds apply to last activity as epoch-millisecond literals

- **WHEN** the query is built for a range
- **THEN** the filter contains a `ge` and an `le` predicate on `last_request_time`
- **AND** each carries `value_type: 'timestamp'` with the bound's epoch-millisecond count as a string

#### Scenario: No empty-id guard is emitted

- **WHEN** the query is built
- **THEN** the filter carries no comparison on `chat_id` against the empty string

#### Scenario: A search term becomes an OR of contains predicates

- **WHEN** the query is built with a search term
- **THEN** the filter carries one additional `or` group of exactly two `ico` predicates
- **AND** they match `chat_id` and `project_id`, each against the trimmed term
- **AND** no predicate matches `user_hash`

#### Scenario: A blank search term adds no predicate

- **WHEN** the query is built with an empty or whitespace-only search term
- **THEN** the filter carries only the time bounds

#### Scenario: A column filter becomes a conjoined predicate

- **WHEN** the query is built with a column filter entry on `total_price` above a value
- **THEN** the filter carries a `gt` predicate on `total_price` conjoined with the time bounds
- **AND** a range entry instead produces a `ge` and an `le` predicate on that field

#### Scenario: An array field carries no sort or filter

- **WHEN** the query is built with a sort key or a column filter naming `deployments`
- **THEN** that input is rejected rather than translated into a predicate or sort key

#### Scenario: Caller sort keys precede the tiebreaker

- **WHEN** the query is built with a sort key on `total_tokens` descending
- **THEN** the sort is that key followed by `chat_id` ascending
- **AND** the caller's key carries a nulls-last ordering

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built with no caller sort keys
- **THEN** the sort is `last_request_time` descending followed by `chat_id` ascending
- **AND** `chat_id` ascending is the final sort entry

#### Scenario: An unknown field is rejected rather than approximated

- **WHEN** the query is built with a sort key or column filter naming a field the entity does not carry
- **THEN** that input is rejected rather than translated

#### Scenario: Search leaves the rest of the query untouched

- **WHEN** the query is built with a search term
- **THEN** its select, sort and page are identical to the same query built without one
- **AND** the time bounds are unchanged
- **AND** `having` is absent

#### Scenario: The projection follows the visible columns

- **WHEN** the query is built with one enrichment-backed column visible and another hidden
- **THEN** the select names the visible column's field
- **AND** it does not name the hidden column's field

#### Scenario: Showing a source-backed column does not re-query

- **WHEN** the operator makes a hidden source-backed column visible after scrolling
- **THEN** no new request is issued and the rows already loaded render that column's values

#### Scenario: Showing a column re-queries from the first page

- **WHEN** the operator makes a hidden enrichment-backed column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field

#### Scenario: Hiding a column does not re-query

- **WHEN** the operator hides a visible column
- **THEN** no new request is issued and the rows already loaded remain

#### Scenario: The summary is unchanged by a projection change

- **WHEN** the operator changes which columns are visible
- **THEN** the whole-result conversation count and cost do not change

### Requirement: Server-side paging with an exact result total

The conversations page SHALL fetch its rows one page at a time from the backend. The result total SHALL be
the conversation count the result summary resolves, and the list query SHALL NOT request a total of its own.
The summary count and the list query are built from the same filter, so they resolve the same figure; asking
for it twice returns one number by two independent requests, which can disagree with each other and costs a
scan of the whole filtered result on each page fetched.

The page SHALL reuse the application's existing server-paged grid mechanism and its shared page size rather
than introducing a second paging pattern. Successive pages SHALL be requested by advancing the query's
`offset` while every other part of the query — filter, sort, limit — stays identical, so paging cannot change
which conversations are in the result, only which slice of it is delivered.

The grid SHALL be told the total number of rows once it is known, so it stops requesting pages at the end of
the result instead of probing past it. The summary and the first page of a result SHALL be resolved
concurrently and delivered together, so the total reaches the grid with that page rather than by a second
request; the first page SHALL NOT wait on the summary beyond whichever of the two is slower. A later page
carries no summary and SHALL leave the total as it stands. A request for a page beyond the result SHALL
yield no rows and SHALL NOT be reported as a failure.

Where the summary is unavailable — it failed, or it has not yet arrived — the grid SHALL fall back to
treating a page returning fewer rows than were requested as the end of the result, which is the same signal
it uses to terminate a result whose total is not yet known. No further total SHALL be requested on that
account: the fallback already terminates paging, and re-requesting one would reintroduce the scan this
requirement removes. Until either signal arrives the end of the result is simply unknown, which the grid
already represents.

Any filter change SHALL discard the pages already fetched and restart from the first page: a filter change
produces a different result set, so an already-fetched page of the previous one is not a prefix of it. A
change to the sort SHALL restart paging on the same grounds: a page of a differently ordered result is not a
prefix of the new one either, even though the set of conversations is unchanged. A change to any column filter
SHALL restart paging as a filter change.

Ratings SHALL be resolved for each page as it arrives, restricted to the conversations that page contains.

The result total SHALL never be presented as a lower bound. Because the total is exact, the summary MUST NOT
render an approximation marker such as a trailing "+", and MUST NOT hint that the figures understate the
result.

#### Scenario: The first page requests a total

- **WHEN** the page loads its first page of conversations
- **THEN** the request resolves the result summary alongside the rows
- **AND** the list query's offset page sets `include_total: false`
- **AND** the result total shown is the conversation count that summary resolved

#### Scenario: A later page requests no total

- **WHEN** a page after the first is fetched
- **THEN** its list query's offset page sets `include_total: false`

#### Scenario: The total is delivered with the first page

- **WHEN** the first page of a result is fetched
- **THEN** the summary is resolved concurrently with the rows and returned alongside them
- **AND** the grid's row count is set from that summary as the page is delivered

#### Scenario: A later page does not restate the total

- **WHEN** a page after the first is fetched
- **THEN** its response carries no summary
- **AND** the grid's row count is left as the first page established it

#### Scenario: Scrolling fetches the next page unchanged but for its offset

- **WHEN** the operator scrolls past the rows already loaded
- **THEN** a further query is issued with a larger `offset`
- **AND** its filter, sort and limit are identical to the previous page's

#### Scenario: The grid stops at the end of the result

- **WHEN** the last page of the result has been delivered
- **THEN** the grid is told the total row count and issues no further page request

#### Scenario: A short page ends the result when the total is unavailable

- **WHEN** the summary request failed and a page returns fewer rows than were requested
- **THEN** the grid treats that page as the end of the result and issues no further page request
- **AND** no total is requested to establish it

#### Scenario: A filter change restarts paging

- **WHEN** the operator changes the search term, the time period or the feedback state after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page of the new result

#### Scenario: A sort change restarts paging

- **WHEN** the operator changes a column's sort after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page, carrying the new sort

#### Scenario: A column filter change restarts paging

- **WHEN** the operator applies or clears a column filter after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page, carrying the new predicates

#### Scenario: Ratings follow each page

- **WHEN** a page of conversations arrives
- **THEN** the rating counts are resolved for exactly the conversations on that page

### Requirement: Conversation grid columns are offered from the entity schema

The conversations view SHALL build its column catalog from the `conversations` entity's schema as the analytics
service reports it, not from a field list held in the frontend. The schema is already fetched for the Query
Builder, is role-filtered by the service, and declares each field's type, display name and description — so it
is the only source that stays correct when the entity gains or loses a field.

Each offered column SHALL derive its header label from the field's display name, falling back to the field
name, and SHALL derive its cell formatting, its sortability and its filter type from the field's declared type:
count-like integer types, decimal money types, timestamp types and string types each render and filter the way
that value type already renders and filters elsewhere in the app.

A field SHALL NOT be offered when the grid cannot honestly render or query it:

- a field the service marks `sensitive` — selecting it would be rejected for a caller without the required
  role, so offering it would present a column that cannot be shown;
- a non-scalar `object` or `array` field — a grid cell is not a structured-value viewer, and rendering one as
  text would assert a shape the view does not know;
- a field the service marks `heavy` — the service omits such a field from a wildcard projection because it is
  expensive to transfer, and a column the catalog offers is one the view may project on every page.

The array exclusion governs what the catalog offers, not what the view can render. A curated column MAY read an
array field where the view defines a presentation for that field's values and states what they mean; such a
column is designed rather than derived, and its field remains outside the catalog like any other curated
field's.

A field consumed by a curated column SHALL NOT also be offered as a raw column. The activity column composes
`first_request_time` and `last_request_time` into one cell, so the catalog SHALL offer that column and MUST NOT
additionally offer its two source fields as separate columns, which would present the same data twice under
different names. The same applies to `duration_ms` and `deployments`, which the duration and models columns
consume.

The nine curated columns — conversation, project, user, turns, activity, tokens, cost, duration, models —
SHALL keep their composed cells and their labels, and SHALL be the default visible set together with the
Rating column. Every other offered field SHALL default to hidden.

Every offered column SHALL be attributed to the `conversations` provenance group, since every one is read from
that entity. The Rating column SHALL remain attributed to `rate_analytics` and SHALL remain outside the
catalog: it is not a field of the queried entity, so it cannot be offered, hidden or reordered as one.

An offered column SHALL be classified by whether the schema reports its field under an enrichment namespace,
because that classification decides whether revealing it costs a re-query. The classification SHALL follow
what the schema reports rather than a list held in the frontend, so an enrichment added to the entity is
classified correctly without a code change.

When the schema cannot be fetched the view SHALL render the curated columns and SHALL report that the
additional columns are unavailable, rather than presenting an empty catalog as though the entity had no other
fields.

A field made visible SHALL be sortable and filterable on the same terms as a curated field-backed column,
since it is a stored field of the same entity. A curated column reading an array field is the exception and
SHALL offer neither, because the query language expresses no ordering or predicate over an array.

#### Scenario: The catalog comes from the schema

- **WHEN** the conversations view loads
- **THEN** the column catalog offers the entity's fields as reported by the schema
- **AND** each offered column's label, formatting, sortability and filter type follow its declared type

#### Scenario: Sensitive and non-scalar fields are not offered

- **WHEN** the schema reports a field marked sensitive, and a field of an object or array type
- **THEN** neither is offered in the catalog

#### Scenario: A heavy field is not offered

- **WHEN** the schema reports a field the service marks `heavy`
- **THEN** it is not offered in the catalog

#### Scenario: A curated array column's field is not offered separately

- **WHEN** the catalog is built
- **THEN** the models column renders `deployments`
- **AND** `deployments` is not additionally offered as a catalog column

#### Scenario: A composed column's source fields are not offered separately

- **WHEN** the catalog is built
- **THEN** the activity column is offered
- **AND** `first_request_time` and `last_request_time` are not offered as columns of their own

#### Scenario: An offered column is classified by its backing source

- **WHEN** the catalog is built from a schema reporting both plain field names and enrichment-namespaced ones
- **THEN** each offered column records whether its field is enrichment-backed
- **AND** that classification comes from the reported schema rather than a frontend list

#### Scenario: The curated set is what is visible by default

- **WHEN** the conversations view loads with no stored column choice
- **THEN** the conversation, project, user, turns, activity, tokens, cost, duration, models and Rating columns
  are visible
- **AND** every other offered column is hidden

#### Scenario: Rating is not part of the catalog

- **WHEN** the operator opens the column panel
- **THEN** the Rating column is not offered as a selectable column

#### Scenario: A failed schema fetch degrades to the curated columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the curated columns render
- **AND** the view reports that the additional columns are unavailable

#### Scenario: A newly visible column can be sorted and filtered

- **WHEN** a schema-driven column is made visible
- **THEN** it offers a sort affordance and a filter control matching its declared type
- **AND** applying either carries a predicate or sort key on that field into the query
