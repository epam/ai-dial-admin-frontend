## ADDED Requirements

### Requirement: Conversations grid states how long each conversation took

The conversations grid SHALL present a curated **Duration** column reading the rollup's `duration_ms`, so an
operator scanning the list can find slow conversations without opening each one. The column SHALL be part of
the default visible set and SHALL be projected by the first list query, so it carries a value on the grid's
first paint rather than after a column-selection round trip.

The column SHALL render a human-readable elapsed time rather than a raw millisecond count, at a precision that
stays legible across the range the field spans — sub-minute durations reading in seconds, longer ones in
minutes and seconds.

The column SHALL be sortable and range-filterable server-side on the same terms as the other numeric curated
columns, since `duration_ms` is a stored scalar of the queried entity.

The field records the summed duration of a conversation's hops. Where a turn fans out into a chain, an outer
hop's duration contains its inner hops' durations, so the value exceeds the conversation's elapsed wall-clock
time. User-facing copy MUST NOT describe the column as elapsed time.

#### Scenario: Duration renders on first paint

- **WHEN** the conversations grid loads with no stored column choice
- **THEN** the Duration column is visible
- **AND** the first list query's select names `duration_ms`

#### Scenario: Duration renders as elapsed time, not milliseconds

- **WHEN** a conversation has a recorded duration
- **THEN** the cell states it in seconds, or in minutes and seconds when it exceeds a minute
- **AND** it does not state a raw millisecond count

#### Scenario: Duration sorts and filters server-side

- **WHEN** the operator sorts by Duration or applies a range filter to it
- **THEN** the query carries a sort key or a `ge`/`le` predicate pair on `duration_ms`
- **AND** paging restarts from the first page

### Requirement: Conversations grid names the models a conversation used

The conversations grid SHALL present a curated **Models** column derived from the rollup's `deployments`
array, so an operator can see which models served a conversation without opening it. The column SHALL be part
of the default visible set and SHALL be projected by the first list query.

The column SHALL render its values as discrete pills with an overflow badge stating how many further values
exist, and SHALL make the complete list reachable without a pointer, so the values hidden by the overflow are
available to a keyboard user and not only on hover.

`deployments` records every deployment that handled a hop, which includes orchestrating deployments,
applications, MCP toolsets and embedding deployments alongside the models themselves. Because the column
claims to name models, it SHALL narrow the array before rendering pills by excluding:

- a value carrying an application or toolset resource path, which names a DIAL resource rather than a model;
- a value naming an embedding deployment;
- a value that contains another value of the same conversation as a substring, which is how a deployment that
  wraps and dispatches to another one is named.

The narrowing is an approximation and SHALL be treated as one. An orchestrating deployment whose name shares
nothing with the deployment it dispatched to is not detectable from the array alone and SHALL be allowed to
remain rather than removed by a guess. When narrowing would leave no value at all, the column SHALL render the
unnarrowed list, because a conversation served only by an application is better described by that application
than by an empty cell.

The complete unnarrowed list SHALL remain reachable from the cell, so a value the narrowing removed is
recoverable by the reader and the column never silently discards recorded data.

The column SHALL NOT be sortable and SHALL NOT be filterable. The query language expresses no ordering or
predicate over an array field, and the grid pages server-side, so any client-side ordering or filtering would
apply to the loaded page rather than to the result and would misstate what it did.

#### Scenario: Models renders on first paint

- **WHEN** the conversations grid loads with no stored column choice
- **THEN** the Models column is visible
- **AND** the first list query's select names `deployments`

#### Scenario: Values render as pills with an overflow badge

- **WHEN** a conversation's narrowed list holds more values than the column width fits
- **THEN** the cell renders as many pills as fit followed by a badge stating the remaining count
- **AND** the complete list is reachable without a pointer

#### Scenario: Applications, toolsets and embeddings are narrowed away

- **WHEN** a conversation's deployments include an application resource path, a toolset resource path and an
  embedding deployment alongside a model
- **THEN** the pills state the model
- **AND** they state none of the other three

#### Scenario: A wrapping deployment is narrowed away by its name

- **WHEN** a conversation's deployments include a value that contains another of its values as a substring
- **THEN** the containing value is not rendered as a pill
- **AND** the contained value is

#### Scenario: An undetectable orchestrator remains

- **WHEN** a conversation's orchestrating deployment shares no substring with the deployments it dispatched to
- **THEN** it remains among the rendered pills rather than being removed by a guess

#### Scenario: Narrowing to nothing falls back to the recorded list

- **WHEN** every value of a conversation's deployments is excluded by the narrowing rules
- **THEN** the cell renders the unnarrowed list rather than an empty cell

#### Scenario: The complete list stays reachable

- **WHEN** narrowing removed a value from a conversation's pills
- **THEN** the complete recorded list is still reachable from the cell

#### Scenario: Models offers no sort or filter affordance

- **WHEN** the operator inspects the Models column header
- **THEN** it offers neither a sort affordance nor a filter control

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
it is a count of requests and not of usage-log rows: the embedding, MCP and routing hops a request fans out
into collapse into the trace that produced them. User-facing copy SHALL describe it as requests and MUST NOT
claim it counts individual hops.

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
  text would assert a shape the view does not know.

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

#### Scenario: A curated array column's field is not offered separately

- **WHEN** the catalog is built
- **THEN** the models column renders `deployments`
- **AND** `deployments` is not additionally offered as a catalog column

#### Scenario: A composed column's source fields are not offered separately

- **WHEN** the catalog is built
- **THEN** the activity column is offered
- **AND** `first_request_time` and `last_request_time` are not offered as columns of their own

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

### Requirement: Unavailable conversation values render an explicit placeholder

The detail view SHALL surface every field its layout defines, including fields no queried source can supply.
Such a field SHALL render its label together with an explicit unavailable marker. A field MUST NOT be
silently omitted, and its label MUST NOT be rendered with a blank value, so the difference between "this
system has no such data" and "this happens to be empty" stays visible to the reader.

The view SHALL distinguish three states, and MUST NOT collapse them onto one presentation:

- **unavailable** — no queried source carries the field at all;
- **empty** — a queried source carries the field and its value is absent for this conversation;
- **zero** — a queried source carries the field and its value is genuinely `0`.

A zero count SHALL render as a number. It MUST NOT render as the unavailable marker, since `0` ratings or
`0` failed requests are findings rather than gaps.

A zero SHALL instead render as the unavailable marker where the measured quantity cannot be zero in a
conversation that occurred — an elapsed duration being the case in hand, since a conversation that ran took
time. There the zero records that the backend did not measure the value, not that the value was nothing, and
rendering it as a number would state a finding the data does not support. This rule SHALL apply wherever the
value is presented, so the grid and the detail view state the same thing about the same conversation.

The marker SHALL be a single presentation used consistently across the view, and SHALL come from theme
tokens rather than literal colour values.

#### Scenario: A field with no source renders its label and the marker

- **WHEN** the detail view renders a field no queried source supplies
- **THEN** the field's label renders
- **AND** its value renders as the unavailable marker

#### Scenario: An empty value is distinguishable from an unavailable one

- **WHEN** a conversation has no project
- **THEN** the project field renders its own empty presentation, not the unavailable marker

#### Scenario: A zero value renders as a number

- **WHEN** a conversation has zero ratings
- **THEN** the rating counts render as `0` rather than as the unavailable marker

#### Scenario: An impossible zero renders as unavailable

- **WHEN** a conversation's recorded duration is `0`
- **THEN** it renders as the unavailable marker rather than as a zero duration
- **AND** the grid and the detail view render it the same way

### Requirement: Conversation detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: token and cost usage, feedback, and
record metadata. Each panel SHALL carry an icon coloured by its source, so the panels are distinguishable at
a glance rather than by reading their headings.

Each panel SHALL name the entity it reads from, and MUST NOT overstate it. **Every** panel SHALL have a real
source: the view MUST NOT present a panel no queried entity populates, because a panel of nothing but
unavailable markers states a shape the system does not record. A panel MUST NOT be labelled as
enrichment-derived: the view queries no enrichment, and the analytics deployment defines none over the
conversation rollup.

The usage panel SHALL state prompt tokens, completion tokens, total tokens, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. Monetary values SHALL carry the emphasis
money carries elsewhere in the app, which is independent of the panel's source colour.

The metadata panel SHALL state the conversation id, the anonymized user identifier, the project, the first
activity time, the successful-request count and the deployments that served the conversation, all from the
rollup, and SHALL surface trace and region fields as unavailable. A field the rollup carries SHALL NOT be
rendered as unavailable: the panel states what the record holds, and marking a recorded field as absent
misreports the data the view already fetched.

Panel provenance colours SHALL come from theme tokens, and every provenance value the view can render SHALL
map to a colour, so a newly added source cannot render unstyled.

#### Scenario: Panels render with their sources named

- **WHEN** the detail view renders
- **THEN** the usage, feedback and metadata panels render
- **AND** each names the entity it reads from

#### Scenario: The usage panel reports real values

- **WHEN** a conversation has recorded token usage and cost
- **THEN** the usage panel states its prompt tokens, completion tokens, total tokens and total cost

#### Scenario: No panel is populated entirely by unavailable markers

- **WHEN** the detail view renders
- **THEN** every panel it renders has a real source entity

#### Scenario: No panel claims an enrichment

- **WHEN** the detail view renders
- **THEN** no panel is labelled as enrichment-derived

#### Scenario: The metadata panel marks what the rollup lacks

- **WHEN** the detail view renders
- **THEN** the metadata panel states the conversation id, user identifier, project, first activity,
  successful-request count and the conversation's deployments
- **AND** it renders trace and region as unavailable
