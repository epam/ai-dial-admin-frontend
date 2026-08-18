## ADDED Requirements

### Requirement: Conversation detail header identifies the conversation and states its turn count

The header SHALL lead with the conversation id as the view's heading. The rollup carries no conversation
title or summary, so the id is the only identifying value the view can state; a title field SHALL be
surfaced as unavailable rather than fabricated from other values.

The heading SHALL keep the full id reachable when it is too long to display, and SHALL offer a means of
copying it, since the id is the value a reader carries to another tool.

The header SHALL state the conversation's project, its turn count, the span between first and last activity,
and how long ago the last activity was. It SHALL surface a model field as unavailable — the rollup does not
carry `deployment`.

The header MUST NOT carry rating counts or a back control. Ratings belong with the panel that lists them, so
the same figures are not stated twice in different places, and returning to the log is the application
navigation's job rather than a control this view owns.

The turn count SHALL be read from the rollup's `turn_count` and labelled **turns**. It SHALL be stated
**once**: the header MUST NOT carry a second count of the same quantity under a different label.
`turn_count` counts distinct traces, so turn, request and trace name one quantity — a header stating both a
turns figure and a requests figure presents one fact as two, and gives the reader no way to tell which is
authoritative.

The header's turn count MUST NOT be derived from the loaded turn list. That list is bounded, so on a
conversation longer than the bound the derived figure is the bound itself, stated as though it were the
conversation's length.

Numeric, currency and time values in the header SHALL carry the same formatting those value types carry in
the conversations log, so the same conversation reads identically in both places.

#### Scenario: The heading is the conversation id

- **WHEN** the detail view renders
- **THEN** the conversation id is the heading
- **AND** a title field renders as unavailable

#### Scenario: A long conversation id stays reachable and copyable

- **WHEN** the conversation id is too long to fit the heading
- **THEN** it is truncated, its full value remains reachable, and it can be copied

#### Scenario: The header carries no ratings and no back control

- **WHEN** the detail view renders
- **THEN** the header shows no rating counts and no control for returning to the log

#### Scenario: The header states the conversation's facts

- **WHEN** the detail view renders
- **THEN** the header states the project, the turn count, the activity span and the time since last
  activity
- **AND** it renders a model field as unavailable

#### Scenario: The turn count is stated once, from the rollup

- **WHEN** the detail view renders a conversation whose `turn_count` is 911
- **THEN** the header states 911 under a turns label
- **AND** it states no second count of turns, requests or traces under any other label

#### Scenario: The header count is unaffected by how many turns loaded

- **WHEN** a conversation's `turn_count` is 911 and the view loads only the first 200 turns
- **THEN** the header states 911
- **AND** it does not state 200

#### Scenario: Header values match the log

- **WHEN** the same conversation is read in the log and in the detail view
- **THEN** its token, cost and activity values are formatted identically in both

### Requirement: Conversation turn list comes from the earliest hop of each trace and discloses its bound

The detail view SHALL derive a conversation's **turn list** from the usage log, taking one turn per trace and
identifying the turn's entry hop as the trace's **earliest** request. That list is the spine of the
transcript and the source of each turn's own figures. It is **not** the source of the conversation's turn
count, which the header reads from the rollup.

The entry hop MUST NOT be identified by an absent parent span. A chain's true first hop is frequently not
recorded in this table, so most conversations have **no** hop with a null parent span and that rule finds
nothing at all — leaving the view with no turns and no transcript.

A turn's cost SHALL be summed from each hop's own cost, not from the cost figure that already covers
everything a hop initiated; summing the latter across a chain double-counts.

The turn query MUST NOT name the request or response body columns. Those columns are heavy, and naming them
in a per-conversation read makes the turn list as slow as a transcript read.

Each turn SHALL carry its own model, token total and cost. A root hop's cost covers the whole chain beneath
it, so the turn's figure accounts for the calls it caused, not only itself.

The turn list SHALL be bounded, and the view MUST NOT page through it. When the bound clips the list — that
is, whenever fewer turns load than the rollup's `turn_count` — the view SHALL state both figures together, so
the number of turns on screen reads as a stated limit rather than as the conversation's length. That
disclosure MUST be visible without interaction, and MUST NOT render when the list is complete.

#### Scenario: One turn per trace

- **WHEN** the detail view loads a conversation whose usage log records many hops across a few traces
- **THEN** one turn renders per trace
- **AND** each turn reports its own hop count, token total and cost

#### Scenario: Turns resolve when no hop has a null parent span

- **WHEN** every hop of a conversation records a parent span
- **THEN** its turns are still identified, one per trace
- **AND** the transcript is still read

#### Scenario: A turn's cost is not double-counted

- **WHEN** a turn fans out into a chain of hops
- **THEN** its cost is the sum of each hop's own cost, not of the chain-inclusive figure

#### Scenario: A clipped turn list states its bound against the real count

- **WHEN** a conversation's `turn_count` is 911 and the turn list is bounded at 200
- **THEN** the view states that 200 of 911 turns are shown
- **AND** that disclosure is visible without interaction

#### Scenario: A complete turn list carries no disclosure

- **WHEN** a conversation's `turn_count` is 12 and all 12 turns load
- **THEN** no truncation disclosure renders

#### Scenario: The turn query reads no body column

- **WHEN** the turn list is requested
- **THEN** the query names neither the request body nor the response body column

## MODIFIED Requirements

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

It SHALL additionally name every field whose schema-driven column is currently visible. It MUST NOT name every
field the entity carries: the field set is whatever the service reports and can grow, so projecting all of it
would make every page fetch pay for columns nobody asked for. A column with no field behind it — Rating is
composed from `rate_analytics` lookups — MUST NOT be named at all, since the entity has no such column.

Making a hidden column visible SHALL restart paging, because the fetched pages do not carry that field and a
column rendered from an absent value would read as empty data rather than as data not fetched. Hiding a visible
column SHALL NOT re-query: the rows already held remain a correct answer to a narrower projection. The
whole-result count and cost SHALL be unaffected by which columns are visible, being aggregates over the
filtered result rather than over the projection.

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

The page SHALL be `{ type: 'offset', offset, limit, include_total: true }`. A limit above 1000 SHALL never be
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

- **WHEN** the query is built with a schema-driven column visible
- **THEN** the select names that column's field alongside the curated fields
- **AND** it does not name a field whose column is hidden

#### Scenario: Showing a column re-queries from the first page

- **WHEN** the operator makes a hidden column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field

#### Scenario: Hiding a column does not re-query

- **WHEN** the operator hides a visible column
- **THEN** no new request is issued and the rows already loaded remain

#### Scenario: The summary is unchanged by a projection change

- **WHEN** the operator changes which columns are visible
- **THEN** the whole-result conversation count and cost do not change

### Requirement: Conversation message content is sample data, and says so

The detail view SHALL render a conversation as user and assistant messages, and those messages SHALL be
**sample content**, not the conversation's stored message text.

Whenever sample messages render, the view SHALL display a persistent notice stating that the messages are
samples and that the surrounding turn, token and cost figures are real. The notice MUST be visible without
interaction and MUST NOT be the only cue in a tooltip or title attribute: sample content presented as real
traffic on an analytics page would misrepresent what the system recorded.

The view MUST NOT read the request or response body columns. Those columns are `heavy` and encrypted at
rest and reach megabytes in a single row, while the route re-renders on every view — so the message text the
system records is not available to this view at an acceptable cost.

Sample content SHALL be derived from the conversation's identity, so one conversation always renders the
same exchange. Content that varied between views would read as changing data rather than as sample content.

The number of sample turns SHALL equal the number of turns the view **loaded** — never more — so every
assistant message carries the real figures for its turn. It MUST NOT be taken from the rollup's `turn_count`:
on a conversation whose turn list is clipped, counting from the rollup would pad the transcript with
exchanges that have no turn behind them, leaving those messages with no figures beside them, and those
figures are the part of this region that is real. A conversation with no turns SHALL render no messages and
no notice, falling back to stating that message content is unavailable.

A failed turns query SHALL be reported as a failure and MUST NOT be presented as a conversation that
recorded no messages. Both states render an empty transcript, and reporting an outage as an absence would
state something false about the conversation.

#### Scenario: Messages render as sample content with a visible notice

- **WHEN** the detail view renders a conversation that recorded turns
- **THEN** user and assistant messages render
- **AND** a visible notice states that the messages are samples and the figures beside them are real

#### Scenario: No body column is ever requested

- **WHEN** the detail view loads a conversation
- **THEN** no query it issues references the request body or response body column

#### Scenario: The same conversation always renders the same exchange

- **WHEN** the same conversation is opened twice
- **THEN** its messages are identical

#### Scenario: Sample turns match the real turn count

- **WHEN** a conversation recorded three turns
- **THEN** three user messages and three assistant messages render

#### Scenario: A clipped turn list does not pad the transcript

- **WHEN** a conversation's `turn_count` is 911 and 200 turns loaded
- **THEN** 200 user messages and 200 assistant messages render
- **AND** every assistant message carries its turn's real figures

#### Scenario: A conversation with no turns shows no sample content

- **WHEN** a conversation has no turns
- **THEN** no messages and no sample notice render
- **AND** the view states that message content is unavailable

#### Scenario: A failed turns query is not reported as an absence of messages

- **WHEN** the turns query fails
- **THEN** the transcript states that the turns could not be loaded
- **AND** it does not state that message content was never recorded

#### Scenario: Every assistant message carries its turn's real figures

- **WHEN** a conversation's messages render
- **THEN** each assistant message shows its turn's real token total, cost and call count
- **AND** no assistant message renders without them

## REMOVED Requirements

### Requirement: Conversation detail header identifies the conversation

**Reason**: The requirement mandated a header that labels the rollup's count as **requests** and forbade
labelling it as turns, on the premise that `turn_count` counted usage-log rows. The pipeline now materializes
`turn_count` as `count(distinct trace_id)`, so that premise is false and the rule it justified inverts the
truth. Replaced by *Conversation detail header identifies the conversation and states its turn count*, which
keeps every unrelated scenario verbatim.

**Migration**: The header states one count, read from `turn_count` and labelled turns. The separate requests
figure and its hop-based explanatory copy are removed rather than relabelled — see the replacement
requirement for the full contract.

### Requirement: Conversation turns come from the earliest hop of each trace

**Reason**: The requirement made the derived turn list the source of the header's turn count and required it
to be stated "alongside the rollup's request count and under a distinct label", because the two measured
different quantities. They now measure the same one, and the derived figure is the bounded one — so the rule
required the view to state a page size next to the real answer. Replaced by *Conversation turn list comes
from the earliest hop of each trace and discloses its bound*.

**Migration**: The turn list keeps its derivation, its per-turn figures and its bound; it no longer supplies
the header's count, and it now discloses the bound against `turn_count` when it clips.
