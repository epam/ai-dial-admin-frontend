## ADDED Requirements

### Requirement: Conversation list query over the conversations entity

The system SHALL provide `buildConversationListQuery({ range, search, chatIds, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `conversations`
in **row mode**. The conversation rollup is materialized by the analytics service — one row per `chat_id`,
produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored columns and MUST NOT
group or aggregate.

The select SHALL name exactly the columns the page renders, by their entity field names:

| Field | Renders as |
|---|---|
| `chat_id` | conversation |
| `project_id` | project |
| `turn_count` | turns |
| `total_tokens` | tokens |
| `total_price` | cost |
| `last_request_time` | activity (relative) |
| `first_request_time` | activity (span) |

`turn_count` is the pipeline's `count()` over usage-log rows for the conversation, which includes non-LLM
spans such as embedding, MCP and routing calls. It is therefore **not** a count of distinct request traces,
and user-facing copy MUST NOT claim it is. An exact turn count is not expressible in a rollup: a pipeline
measure is one aggregate function over one column with no `distinct` option.

The filter SHALL be `and[ ge(last_request_time, startMs), le(last_request_time, endMs) ]`. The time bounds
SHALL apply to `last_request_time`, so a selected period means *conversations whose last activity falls in the
period*. The query MUST NOT carry an empty-`chat_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates matching `chat_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only term
SHALL add no predicate at all rather than an `ico` against the empty string, which would match every row at
the cost of a scan. Both targets are base columns of the entity, so no select-alias restriction applies.

Search MUST NOT reach message content: no column of `conversations` carries it, and the only column that
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. The
search affordance SHALL name only the fields search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(chat_id, chatIds)`, which is how the
feedback filter narrows the result.

The sort SHALL be `[{ last_request_time, desc }, { chat_id, asc }]`. The trailing `chat_id asc` tiebreaker is
required even with no sorting UI: the service appends no implicit tiebreaker, so without it a paged result is
not stable across requests and a row could be skipped or repeated between pages.

The page SHALL be `{ type: 'offset', offset, limit, include_total: true }`. A limit above 1000 SHALL never be
sent — the service rejects it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema; `conversations` exposes no
`sensitive` column, so every selected field is visible to a read-only admin.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `conversations` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `chat_id`, `project_id`, `turn_count`, `total_tokens`, `total_price`,
  `last_request_time` and `first_request_time`

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

#### Scenario: A blank search term adds no predicate

- **WHEN** the query is built with an empty or whitespace-only search term
- **THEN** the filter carries only the time bounds

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built
- **THEN** the sort is `last_request_time` descending followed by `chat_id` ascending
- **AND** `chat_id` ascending is the final sort entry

#### Scenario: Search leaves the rest of the query untouched

- **WHEN** the query is built with a search term
- **THEN** its select, sort and page are identical to the same query built without one
- **AND** the time bounds are unchanged
- **AND** `having` is absent

### Requirement: Server-side paging with an exact result total

The conversations page SHALL fetch its rows one page at a time from the backend and SHALL request the result
total with `include_total: true`. The analytics service populates `totalCount` for row-mode queries only; the
entity is read in row mode, so the total is available and SHALL be used rather than inferred from the number
of rows returned.

The page SHALL reuse the application's existing server-paged grid mechanism and its shared page size rather
than introducing a second paging pattern. Successive pages SHALL be requested by advancing the query's
`offset` while every other part of the query — filter, sort, limit — stays identical, so paging cannot change
which conversations are in the result, only which slice of it is delivered.

The grid SHALL be told the total number of rows once it is known, so it stops requesting pages at the end of
the result instead of probing past it. A request for a page beyond the result SHALL yield no rows and SHALL
NOT be reported as a failure.

Any filter change SHALL discard the pages already fetched and restart from the first page: a filter change
produces a different result set, so an already-fetched page of the previous one is not a prefix of it.

Ratings SHALL be resolved for each page as it arrives, restricted to the conversations that page contains.

The result total SHALL never be presented as a lower bound. Because the total is exact, the summary MUST NOT
render an approximation marker such as a trailing "+", and MUST NOT hint that the figures understate the
result.

#### Scenario: The first page requests a total

- **WHEN** the page loads its first page of conversations
- **THEN** the query's offset page sets `include_total: true`
- **AND** the returned `totalCount` is used as the result total

#### Scenario: Scrolling fetches the next page unchanged but for its offset

- **WHEN** the operator scrolls past the rows already loaded
- **THEN** a further query is issued with a larger `offset`
- **AND** its filter, sort and limit are identical to the previous page's

#### Scenario: The grid stops at the end of the result

- **WHEN** the last page of the result has been delivered
- **THEN** the grid is told the total row count and issues no further page request

#### Scenario: A filter change restarts paging

- **WHEN** the operator changes the search term, the time period or the feedback state after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page of the new result

#### Scenario: Ratings follow each page

- **WHEN** a page of conversations arrives
- **THEN** the rating counts are resolved for exactly the conversations on that page

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

For a permitted caller the page SHALL prefetch the **result summary** server-side and pass it to the client
view as an initial-data prop. It MUST NOT prefetch the first page of rows: the grid fetches its own pages, so
a prefetched page would be discarded or duplicated. A prefetch failure SHALL be reported through the initial
state handed to the client view, since a server component cannot raise a toast.

The page SHALL depend on the `conversations` entity being registered and populated in the environment it runs
against. Where it is absent, the access guard still passes and the conversation query fails with HTTP 400; the
page SHALL surface that as a load failure rather than as an empty period.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and the page is requested
- **THEN** the page prefetches the result summary on the server and renders the client view with it
- **AND** the grid requests its first page of rows

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

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `rate_analytics` entity, which the conversation rollup does not include, and the
structured-query DSL accepts a single `entity` with no join construct. A feedback filter SHALL therefore be
resolved as two queries: first a candidate query over `rate_analytics` returning the `chat_id` values carrying
the requested feedback, then the conversation query over `conversations` narrowed to those ids with an `in`
predicate. Both SHALL be issued server-side with the caller's token, and the `all` state SHALL issue only the
conversation query, so the default path costs exactly one request per page.

The candidate query SHALL be aggregate mode over `rate_analytics` grouped by `chat_id`, carry the same time
bounds as the conversation query and an empty-id guard, and select `chat_id` plus `max(request_time)`. It SHALL
be ordered by most recent rating so that if the candidate set reaches its limit, the ids retained are those
most likely to survive the conversation query's own `last_request_time desc` ordering. Its limit SHALL NOT
exceed 1000, the service's hard maximum.

The candidate set SHALL be resolved once per filter state and reused across the pages of that result, rather
than re-queried per page: the narrowing is a property of the filter, not of the page.

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

#### Scenario: The default state costs one query per page

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

The page header SHALL state which entities the view is composed over, listing each contributing entity by its
real catalog name and colouring it with the same provenance colour the grid band uses, so the two cannot
disagree. Every entity named SHALL be one the page actually queries; the line MUST NOT name a source the page
does not read, and MUST NOT carry a "pending" or "not registered" marker — a source that does not exist is not
listed at all.

The header SHALL show summary pills for the conversation count, the rated count, the count carrying negative
feedback, and the total cost. The conversation count and the total cost SHALL be exact figures for the whole
filtered result, obtained from the backend under the same filter the list query carries, and MUST NOT be
computed from the rows currently loaded. The rated and negative counts SHALL be stated for the rows the page
has loaded and SHALL name that scope, rather than implying they cover the whole result. A row whose rating
could not be resolved MUST NOT be counted as rated, since an unresolved rating is not evidence of an absent
one.

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the
values carry twelve fractional digits, and SHALL be rounded for display. That rounding is local to the summary
and does not settle how the Cost column renders.

When the summary request fails, the pills SHALL report that the figures are unavailable rather than rendering
zeros, which would assert an empty result that was never established.

#### Scenario: The provenance line names only real, queried entities

- **WHEN** the page renders
- **THEN** the line lists the conversations and feedback entities by their catalog names
- **AND** each carries the provenance colour its columns carry in the grid band
- **AND** no entity is marked as pending or unregistered

#### Scenario: The conversation count is exact regardless of how much is loaded

- **WHEN** the result holds more conversations than one page and only the first page is loaded
- **THEN** the conversation count shows the whole result's total
- **AND** it carries no approximation marker and no "understated" hint

#### Scenario: Loaded-scope counts say so

- **WHEN** only part of the result is loaded
- **THEN** the rated and negative pills state that they cover the loaded conversations

#### Scenario: An unresolved rating is not counted as rated

- **WHEN** a row's rating could not be resolved
- **THEN** it counts toward neither the rated nor the negative pill

#### Scenario: A failed summary reports unavailability

- **WHEN** the summary request fails
- **THEN** the pills report the figures as unavailable rather than showing zeros

### Requirement: Conversation filters re-query the backend

The conversations page SHALL provide a free-text search box, a time-period control and a feedback filter, and
every change to any of them SHALL produce a new backend request carrying the filter values. The page MUST NOT
filter, hide or reorder rows it already holds in response to a filter change: the page holds only the pages it
has fetched, so narrowing those client-side would silently hide matches that exist outside them and report a
wrong result as a complete one. A filter change SHALL discard the loaded pages and re-fetch from the first
page of the new result.

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

A failed conversations request SHALL be reported to the operator rather than rendered as an absence of
data. An emptied grid alone is indistinguishable from a period that genuinely held no conversations, so a
failure SHALL surface both as an error toast and in the empty state's own wording, and the failed state
SHALL clear as soon as a later request succeeds. A failure while fetching a later page SHALL NOT discard the
pages already shown, and SHALL still raise the notification.

#### Scenario: A search term issues a new query from the first page

- **WHEN** the operator types a term into the search box
- **THEN** the server action is called with that term and a first-page offset
- **AND** the rows the grid holds are replaced by the rows the response returns

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

#### Scenario: A failed later page keeps the rows already shown

- **WHEN** fetching a page after the first fails
- **THEN** an error notification names the failure
- **AND** the rows already loaded remain visible

### Requirement: Rating column resolved for the displayed page

The grid SHALL show a Rating column giving each conversation's positive and negative rating counts, attributed
in the provenance band to `rate_analytics` rather than to `conversations`.

Ratings SHALL be resolved by a query issued **after** the conversation query, restricted by `in` to exactly the
conversation ids in the page just returned. Resolving them from the feedback filter's candidate set instead
MUST NOT be done: that set is capped, so a displayed conversation could fall outside it and be reported as
unrated when it is not. The ratings query SHALL be skipped entirely when the returned page has no rows.

The split SHALL NOT be derived from one aggregate. `rate` is a signed integer — DIAL sends `1` for a like and
`-1` for a dislike, and the service normalizes a boolean `false` to `0` — so `count(rate)` and `sum(rate)` do
not determine the two directions: one like and one dislike sum to zero, indistinguishable from no likes at all.

Each direction SHALL instead be counted by its own query: aggregate mode over `rate_analytics` grouped by
`chat_id`, selecting `count(rate)`, restricted by `in` to the page's ids, and filtered by the **same** rate
predicate the corresponding feedback filter uses — `gt(rate, 0)` for the positive side and `le(rate, 0)` for
the negative one. Reusing those predicates is what guarantees the column agrees with the filter: a
conversation the Positive filter selected cannot then display a zero positive count. Two queries are required
because the language offers no conditional aggregation; they SHALL be issued concurrently.

Both queries SHALL carry the same time bounds as the conversation query. Bounding them identically keeps the
column and the feedback filter consistent. The consequence — a rating given outside the selected period is not
counted — is accepted for that consistency.

Both counts SHALL be displayed at all times, including a zero, so the absence of ratings on one side is visible
rather than implied. A side carrying ratings SHALL be coloured — positive as success, negative as error, from
theme tokens — and a side with none SHALL stay muted. Each side SHALL carry a text label for assistive
technology, since the icons carry the meaning.

When either ratings query fails, both counts SHALL be left unresolved and the cell SHALL render nothing rather
than displaying zeros or a half-counted split, which would assert an absence of feedback that was never
established. The conversation rows themselves SHALL still be returned.

A comment indicator SHALL NOT be shown. `rate_analytics.comment` is catalogued sensitive, so it cannot be
selected — or even counted — by a non-`FULL_ADMIN` caller.

#### Scenario: Ratings are resolved for exactly the page returned

- **WHEN** a page of conversations is returned
- **THEN** one `rate_analytics` count query per direction follows, each restricted by `in` to that page's ids
- **AND** neither is issued at all when the page has no rows

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

The grid SHALL render composed cells rather than one raw stored value per column:

- The activity column SHALL stack how long ago the conversation was last active over how long it ran. The span
  requires the first activity as well as the last, so the query SHALL select both. The absolute instant SHALL
  stay reachable on hover, since relative time is readable but imprecise.
- Token counts SHALL be compacted rather than delimited in full.
- Cost SHALL be rounded to significant digits and coloured. Rounding SHALL be local to this page and MUST NOT
  change the shared currency formatter, so other price columns are unaffected.
- The project column SHALL show the project alone. It MUST NOT show a model chip: the conversation rollup does
  not carry `deployment`, so the page has no model to attribute to a conversation and MUST NOT infer one. A
  conversation with no project SHALL render an explicit placeholder rather than an empty cell, because an
  unattributed project is common in real data and a blank cell reads as a rendering fault.

Relative time and span helpers SHALL take the current time as a parameter rather than reading the clock, so
they stay deterministic and need no fake timers. Colours SHALL come from theme tokens, never literal values.

Every composed cell SHALL degrade rather than break when part of its data is missing: an absent first activity
leaves the relative time alone, and an absent last activity renders nothing at all.

#### Scenario: The project cell shows the project alone

- **WHEN** a row has a project
- **THEN** the cell shows the project
- **AND** it shows no model chip and no model count

#### Scenario: A conversation with no project is marked, not blank

- **WHEN** a row's project is an empty string
- **THEN** the cell renders an explicit placeholder rather than nothing

#### Scenario: The activity cell carries the span

- **WHEN** a row has both activity bounds
- **THEN** the cell shows the relative time over the span
- **AND** the absolute timestamp is available on hover

#### Scenario: Composed cells degrade on missing parts

- **WHEN** the first activity is absent
- **THEN** the relative time renders alone
- **AND** when the last activity is absent, the cell renders nothing

#### Scenario: Cost is readable

- **WHEN** a cost arrives at the full scale of a decimal sum
- **THEN** it renders rounded to significant digits rather than showing every fractional digit

### Requirement: Conversation row values tolerate either backend wire shape

The `ConversationRow` model in `src/models/analytics/conversations-trace.ts` SHALL type its timestamp and
numeric-metric fields to accept either a number or a string, and nullable metrics to additionally accept
`null`.

The shapes the service actually returns are: a timestamp as an **ISO-8601 string with a `Z` zone designator**,
and a decimal as a **JSON number carrying the column's full fractional scale**. Timestamp parsing SHALL treat
a zoneless string as a hazard rather than assume a shape — a zoneless value parses as local time and shifts by
the viewer's offset — so it SHALL either require the zone or normalize the value before parsing, and MUST NOT
rely on a bare local-time parse. Comments and documentation MUST NOT state that timestamps arrive as epoch
milliseconds.

Tolerating both shapes still costs nothing — the shared formatters (`formatDateTimeToLocalString`,
`currencyValueFormatter`, `numberValueFormatter`) already accept `number | string` — and keeps the page
resilient if the mapping changes.

#### Scenario: Timestamp renders from the shape the service returns

- **WHEN** `last_request_time` arrives as an ISO-8601 string with a `Z` designator
- **THEN** the activity cell renders a formatted local date-time for that instant

#### Scenario: Timestamp renders from an epoch-millisecond number too

- **WHEN** `last_request_time` arrives as an epoch-millisecond number
- **THEN** the activity cell renders a formatted local date-time for the same instant

#### Scenario: Null metrics render as empty cells

- **WHEN** a row's `total_tokens` or `total_price` is `null`
- **THEN** the corresponding cell renders empty rather than `0`, `null`, or `NaN`

### Requirement: Read-only conversations grid

The conversations view SHALL render a grid of six visible columns — conversation, project, turns, activity,
tokens, cost — plus the Rating column. No column SHALL be sortable, and no column SHALL offer a filter control
of its own — neither a floating filter row nor a filter menu in the header. Per-column filtering stays off even
though the page itself has filters: the page's filters are query predicates over the whole result, whereas a
column filter narrows only the pages already fetched, and would report that narrowed view as the complete
answer. Ordering is fixed by the query, most recent last activity first.

The grid SHALL obtain its rows page by page from the backend and MUST NOT be handed a superset to narrow, and
no grid-level filter model SHALL be set from the page's filter state. While the first page of a new filter
state is in flight the view SHALL show a loading indicator, so the empty state cannot flash between a filter
change and its rows. When the result holds no rows the view SHALL render a no-data state rather than an empty
grid body.

The conversation column SHALL keep the full conversation id reachable when it is too long to display, since
real ids are not uniformly short and can run to hundreds of characters. Truncation MUST NOT be the only
presentation of the value.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

The grid SHALL carry a provenance band above the column headers, grouping every column under the data source
it comes from, and a column MUST NOT be able to leave its group when moved.

Every column SHALL belong to exactly one group: an unattributed column would imply a provenance the page has
not stated. Group labels SHALL name the actual source of the columns beneath them and MUST NOT overstate it —
a column read from a source table MUST NOT be labelled as enrichment-derived, and no group SHALL be attributed
to a source the page does not query. Each group SHALL carry a tooltip naming its source precisely. Colours
SHALL come from theme tokens, never literal values, and every provenance value SHALL map to a colour, so a
newly added one cannot render unstyled.

The band and the column-header row SHALL each carry their own height, and the band label SHALL be separated
from the column header beneath it.

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group
- **AND** the conversation, project, turns, activity, tokens and cost columns are attributed to
  `conversations`, and the Rating column to `rate_analytics`

#### Scenario: No group claims an enrichment the page does not query

- **WHEN** the grid renders
- **THEN** no provenance group is labelled as enrichment-derived
- **AND** no group tooltip says its values are samples

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: Rows render from the fetched pages

- **WHEN** the grid has fetched a page of conversations
- **THEN** one grid row renders per conversation, most recent last activity first

#### Scenario: A long conversation id stays reachable

- **WHEN** a conversation id is too long to fit its column
- **THEN** the cell truncates it and the full value remains reachable

#### Scenario: Sorting is disabled

- **WHEN** a column header is clicked
- **THEN** the row order does not change and no sort indicator appears

#### Scenario: No filter control is reachable

- **WHEN** the grid renders
- **THEN** no floating filter row appears beneath the header row
- **AND** no column header offers a filter control, so no client-side filter can be applied

#### Scenario: Empty result renders the empty state

- **WHEN** the result holds zero conversations
- **THEN** the no-data content renders instead of an empty grid body

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** the first page of a new filter state is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown

## REMOVED Requirements

### Requirement: Conversation list aggregate query

**Reason**: The conversation rollup is now materialized by the analytics service as the `conversations`
entity, so the page reads stored rows instead of recomputing the aggregate on every request. Row mode also
returns a result total, which the aggregate query could not, and that is what makes paging exact. Replaced by
"Conversation list query over the conversations entity".

**Migration**: Callers build the query with the same helper name against `conversations` in row mode. Field
names change: `turns` → `turn_count`, `tokens` → `total_tokens`, `cost` → `total_price`, `last_activity` →
`last_request_time`, `first_activity` → `first_request_time`, `project` → `project_id`. The `model` and
`model_count` aliases have no replacement — `deployment` is not part of the rollup. The time filter moves from
`request_time` to `last_request_time`, and the empty-`chat_id` guard is dropped because the pipeline's
membership predicate already excludes those rows.

### Requirement: Hardcoded mock switch for the conversations data source

**Reason**: The switch existed so the page was demonstrable before the analytics backend could answer its
query. The backend now serves a populated `conversations` entity, so the mock has nothing to stand in for, and
a second data path that no one exercises is a liability rather than a safety net.

**Migration**: None for callers — the server action keeps its signature and its `ServerActionResponse`
contract, and always queries the backend. Anything that relied on the page rendering without a reachable
analytics backend must instead point `DIAL_ANALYTICS_API_URL` at an environment where `conversations` is
registered and populated.

### Requirement: Conversation fixtures reproduce real backend value shapes

**Reason**: The fixtures existed to surface formatting and layout defects against realistic values while the
mock was the default data source. Real data now flows through the same code paths, so the value shapes the
fixtures imitated are the shapes the page actually receives.

**Migration**: The scenarios the fixtures were designed to cover — a full-scale decimal cost, null token and
cost metrics, an empty project, and production-length conversation ids — remain required behavior and are
covered by the null-metric, empty-project, long-id and cost-rounding scenarios on the requirements that own
those cells.

### Requirement: Conversation title and snippet come from an enrichment

**Reason**: No enrichment supplies them, and none can be built by the mechanism this requirement assumed. An
aggregate pipeline cannot roll up an enrichment column — the service resolves a pipeline's input columns
against the input table's own column mappings only — so a conversation-grain title cannot be derived from a
per-request enrichment. With the fixtures gone, the fields would be permanently null and the requirement would
describe behavior that never occurs.

**Migration**: The conversation cell renders the conversation id alone, and search matches the conversation id
and the project. When a conversation-grain source for a title and snippet exists, it returns as its own change
with a contract written against whatever actually supplies it.
