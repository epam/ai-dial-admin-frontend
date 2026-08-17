## MODIFIED Requirements

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

The whole-result figures and the loaded-scope figures SHALL be observations of the same fetch cycle. The
whole-result figures SHALL therefore be re-resolved whenever the page fetches the first page of a result,
including the first page the client fetches after mount, and a server-prefetched figure MUST NOT remain the
displayed value once the client has fetched a page of its own. The rollup the page reads is materialized
continuously, so a figure resolved at page load and a page fetched later are two observations of a changing
table: presenting them side by side lets the loaded-scope denominator exceed the whole-result total, which
states an impossibility.

The loaded-conversation count SHALL be a count of **distinct** conversations, not of delivered rows. The row
cache is bounded, so a conversation whose block is evicted and re-fetched is delivered more than once; it
SHALL be counted once.

The rated and negative pills SHALL name their loaded scope in text that is visible on the pill. A caveat
carried only in a tooltip or only in assistive-technology-only content is not stated for the reader looking at
the header, who then reads all four figures as one consistent set. The visible caveat SHALL NOT replace the
existing hover and assistive-technology text.

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the
values carry twelve fractional digits, and SHALL be rounded for display. That rounding is local to the summary
and does not settle how the Cost column renders.

When the summary request fails, the pills SHALL report that the figures are unavailable rather than rendering
zeros, which would assert an empty result that was never established.

A failure to fetch the rows SHALL NOT by itself make the figures unavailable: they are resolved by their own
request, so a row failure is no evidence about them. A failure that prevents the summary request from being
issued at all SHALL, however, clear the figures, because the ones on screen then describe the previous filter
state rather than the applied one.

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
- **AND** that statement is visible on the pill without hovering it

#### Scenario: The whole-result figures follow the first page

- **WHEN** the client fetches the first page of a result
- **THEN** the whole-result count and cost are re-resolved for that same filter state
- **AND** the figures shown are those observations, not the ones prefetched at page load

#### Scenario: The loaded denominator cannot exceed the result total

- **WHEN** enough of the result has been scrolled that a previously delivered page is re-fetched
- **THEN** each conversation counts once toward the loaded-conversation count
- **AND** that count does not exceed the whole-result conversation total

#### Scenario: An unresolved rating is not counted as rated

- **WHEN** a row's rating could not be resolved
- **THEN** it counts toward neither the rated nor the negative pill

#### Scenario: A failed summary reports unavailability

- **WHEN** the summary request fails
- **THEN** the pills report the figures as unavailable rather than showing zeros

#### Scenario: A failed row fetch leaves the figures standing

- **WHEN** the first page of rows fails but the summary request succeeded
- **THEN** the pills keep showing the figures the summary request returned

#### Scenario: A summary that could not be issued reports unavailability

- **WHEN** a failure prevents the summary request from being issued for the applied filter state
- **THEN** the pills report the figures as unavailable rather than the previous state's figures

### Requirement: Read-only conversations grid

The conversations view SHALL render a grid of seven visible columns — conversation, project, user, turns,
activity, tokens, cost — plus the Rating column. No column SHALL be sortable, and no column SHALL offer a
filter control of its own — neither a floating filter row nor a filter menu in the header. Per-column filtering
stays off even though the page itself has filters: the page's filters are query predicates over the whole
result, whereas a column filter narrows only the pages already fetched, and would report that narrowed view as
the complete answer. Ordering is fixed by the query, most recent last activity first.

The user column SHALL show the conversation's `user_hash`, labelled the way the conversation detail page labels
it. The value is a de-identified surrogate rather than an identity, so the column SHALL NOT be presented as a
name or an address, and the page MUST NOT claim the free-text search reaches it while it does not.

The grid SHALL obtain its rows page by page from the backend and MUST NOT be handed a superset to narrow, and
no grid-level filter model SHALL be set from the page's filter state. While the first page of a new filter
state is in flight the view SHALL show a loading indicator, so the empty state cannot flash between a filter
change and its rows. When the result holds no rows the view SHALL render a no-data state rather than an empty
grid body.

The conversation column SHALL keep the full conversation id reachable when it is too long to display, since
real ids are not uniformly short and can run to hundreds of characters. Truncation MUST NOT be the only
presentation of the value. The user column SHALL keep its value reachable on the same terms.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

Rows SHALL be openable, navigating to that conversation's detail view. Opening a row is a read, not a
mutation of the result, so it does not make the grid writable: sorting and per-column filtering stay off.
The grid SHALL indicate that its rows are openable rather than leaving the affordance undiscoverable, and
SHALL honour the app's convention for opening a row in a new tab. The conversation id SHALL be URL-encoded
into the detail address, since real ids contain path separators and percent-encoded text.

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
- **AND** the conversation, project, user, turns, activity, tokens and cost columns are attributed to
  `conversations`, and the Rating column to `rate_analytics`

#### Scenario: The user column shows the conversation's user hash

- **WHEN** the grid renders a conversation whose `user_hash` is populated
- **THEN** the user column shows that value under the `conversations` provenance group

#### Scenario: A conversation with no user hash renders no invented value

- **WHEN** a conversation's `user_hash` is absent
- **THEN** the user cell renders the view's placeholder rather than an empty-looking identity

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

#### Scenario: Opening a row navigates to the conversation

- **WHEN** a grid row is opened
- **THEN** that conversation's detail view is navigated to, with its id URL-encoded in the address

#### Scenario: Opening a row in a new tab

- **WHEN** a grid row is opened with the app's new-tab modifier
- **THEN** the conversation's detail view opens in a new tab and the grid keeps its fetched pages

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
| `user_hash` | user |
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
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. Search
SHALL NOT reach `user_hash` either: selecting the column for display does not make a surrogate a useful
free-text target, and a partial-match predicate over it would cost a scan for a value operators paste whole.
The search affordance SHALL name only the fields search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(chat_id, chatIds)`, which is how the
feedback filter narrows the result.

The sort SHALL be `[{ last_request_time, desc }, { chat_id, asc }]`. The trailing `chat_id asc` tiebreaker is
required even with no sorting UI: the service appends no implicit tiebreaker, so without it a paged result is
not stable across requests and a row could be skipped or repeated between pages.

The page SHALL be `{ type: 'offset', offset, limit, include_total: true }`. A limit above 1000 SHALL never be
sent — the service rejects it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema; `conversations` exposes no
`sensitive` column, so every selected field is visible to a read-only admin. `user_hash` is catalogued
non-sensitive — the analytics service exposes it as a de-identified surrogate — so selecting it requires no
elevated role.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `conversations` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `chat_id`, `project_id`, `user_hash`, `turn_count`, `total_tokens`, `total_price`,
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
- **AND** no predicate matches `user_hash`

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
