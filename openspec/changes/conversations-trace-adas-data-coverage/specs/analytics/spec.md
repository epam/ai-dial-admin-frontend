## MODIFIED Requirements

### Requirement: Conversation list query over the conversations entity

The system SHALL provide
`buildConversationListQuery({ range, search, chatIds, sort, columnFilters, visibleFields, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `conversations`
in **row mode**. The conversation rollup is materialized by the analytics service — one row
per `chat_id`, produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored
columns and MUST NOT group or aggregate.

The select SHALL name the fields the default-visible curated columns require, by their entity field names:

| Field | Renders as |
|---|---|
| `chat_id` | conversation |
| `conversation_insights.title` | title |
| `project_id` | project |
| `user_hash` | user |
| `turn_count` | turns |
| `total_tokens` | tokens |
| `total_price` | cost |
| `last_request_time` | activity (relative) |
| `first_request_time` | activity (span) |
| `duration_ms` | duration |
| `deployments` | deployments |

It SHALL additionally name every field whose column is currently visible, whether that column is curated or
derived from the schema. Projection SHALL follow column visibility for **every** field-backed column, not only
for schema-derived ones: a curated column that defaults to hidden carries a real entity field, so a
visibility-driven projection that skipped it would render an empty cell for data the row does carry.

It MUST NOT name every field the entity carries: the field set is whatever the service reports and can grow,
so projecting all of it would make every page fetch pay for columns nobody asked for. A column with no field
behind it — Rating is composed from `rate_analytics` lookups — MUST NOT be named at all, since the entity has
no such column.

An enrichment column's exposed name is a qualified flat name containing a dot — `conversation_insights.title`.
That name SHALL be sent whole: the dot is part of the field name the service exposes, not a path to traverse
and not a table qualifier to strip.

The select SHALL be intersected with the fetched entity schema, per "A conversation query names only fields
the entity's schema reports". The ten fields the pre-existing curated columns read are required; the
conversation title is optional and is named only when the schema reports it.

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
the user column's own filter is the exact-value input for it. Search SHALL NOT reach the conversation title:
the title is an enrichment column that is absent for any conversation the evaluator has not processed, so a
term matched against it would silently narrow the result to enriched conversations only. The search affordance
SHALL name only the fields search actually reaches.

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
- **AND** its select names `chat_id`, `conversation_insights.title`, `project_id`, `user_hash`, `turn_count`,
  `total_tokens`, `total_price`, `last_request_time`, `first_request_time`, `duration_ms` and `deployments`

#### Scenario: An enrichment field is named by its qualified flat name

- **WHEN** the query names the conversation title
- **THEN** the select entry's field is the single name `conversation_insights.title`

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
- **AND** no predicate matches `user_hash` or `conversation_insights.title`

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

#### Scenario: A curated hidden column is projected once it is shown

- **WHEN** the operator makes the sentiment column visible
- **THEN** the next request's select names `conversation_insights.sentiment`
- **AND** the cells render that field's values rather than empty cells

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

### Requirement: Single-conversation query over the conversations entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `conversations` in
**row mode**, narrowed to exactly one `chat_id` by equality, requesting a single row.

The query SHALL select every stored column of the conversation rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the available field names from the caller rather than enumerating a field list of its
own, per "A conversation query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The selected set SHALL include the rollup's enrichment columns where the schema reports them, whose exposed
names are qualified flat names containing a dot. The query SHALL send such a name whole rather than treating
the dot as a path.

The query MUST NOT carry a time bound. The log's list query bounds `last_request_time` to the selected
period, but a detail view is addressed by id and SHALL resolve regardless of which period the log was
showing — a deep link or a bookmark MUST NOT fail because a conversation falls outside the current window.

The query MUST NOT reference any column the analytics service marks sensitive. Sensitive columns are removed
from the query model for callers without the elevated role, so referencing one would fail as an unknown
field for those callers rather than being refused cleanly, making the whole view unavailable to them.

#### Scenario: The query is narrowed to one conversation by id

- **WHEN** the single-conversation query is built for a conversation id
- **THEN** it queries the `conversations` entity in row mode
- **AND** it filters on that id by equality and requests one row

#### Scenario: The heavy trace column is named explicitly

- **WHEN** the single-conversation query is built
- **THEN** its select names `traces`
- **AND** the projection is explicit rather than a default or wildcard projection

#### Scenario: The insight columns are selected

- **WHEN** the single-conversation query is built and the schema reports the insight columns
- **THEN** its select names `conversation_insights.title`

#### Scenario: An instance without the enrichment still resolves a conversation

- **WHEN** the single-conversation query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the conversation's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-conversation query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A conversation outside the log's period still resolves

- **WHEN** a conversation whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that conversation's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-conversation query is built
- **THEN** its selected columns include no column the analytics service marks sensitive

### Requirement: Unavailable conversation values render an explicit placeholder

The detail view SHALL surface every field its layout defines. A field the view's layout defines but no
queried source supplies SHALL render its label together with an explicit unavailable marker. A field MUST NOT
be silently omitted, and its label MUST NOT be rendered with a blank value, so the difference between "this
system has no such data" and "this happens to be empty" stays visible to the reader.

The layout SHALL NOT define a field the platform does not record at all. An unavailable marker states "no
queried source carries this yet"; a field for a quantity DIAL never records is not pending but absent, and
presenting it invites the reader to expect a value that will never arrive. Such a field SHALL be removed from
the layout together with its label, rather than rendered as permanently unavailable.

The view SHALL distinguish three states, and MUST NOT collapse them onto one presentation:

- **unavailable** — no queried source carries the field at all;
- **empty** — a queried source carries the field and its value is absent for this conversation;
- **zero** — a queried source carries the field and its value is genuinely `0`.

The fetched row itself SHALL decide between the first two. The service returns every projected column in
every row, `null` where the cell is null — so a key **absent** from the row is a field that was never
projected, because the instance does not carry it, and SHALL render as unavailable; a key present and `null`
is a field the record simply has no value for, and SHALL render as empty. The view MUST NOT treat the two as
one: a deployment that lacks a column and a conversation that lacks a value are different findings, and only
the first is a reason to expect nothing there ever.

A zero count SHALL render as a number. It MUST NOT render as the unavailable marker, since `0` ratings or
`0` failed requests are findings rather than gaps.

A zero SHALL instead render as the unavailable marker where the measured quantity cannot be zero in a
conversation that occurred — an elapsed duration being the case in hand, since a conversation that ran took
time. There the zero records that the backend did not measure the value, not that the value was nothing, and
rendering it as a number would state a finding the data does not support. This rule SHALL apply wherever the
value is presented, so the grid and the detail view state the same thing about the same conversation.

A value supplied by a conversation-insight enrichment is a fourth case and SHALL NOT use any of the three
presentations above. The enrichment runs per conversation and can be absent — the evaluator has not processed
the conversation yet — or partial, flagged `truncated`, when the conversation exceeded its budget. Where such
a value identifies the conversation, an absent or blank one SHALL degrade to the value the view identifies the
conversation by otherwise, which is the conversation id. It MUST NOT render as an empty cell, an unavailable
marker, or a fabricated value.

The marker SHALL be a single presentation used consistently across the view, and SHALL come from theme
tokens rather than literal colour values.

#### Scenario: A field with no source renders its label and the marker

- **WHEN** the detail view renders a field no queried source supplies
- **THEN** the field's label renders
- **AND** its value renders as the unavailable marker

#### Scenario: A field the platform does not record is not presented

- **WHEN** the detail view renders
- **THEN** it presents no field for a conversation's region, because DIAL records none
- **AND** no label for it appears in any panel

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

#### Scenario: A missing insight degrades to the conversation id

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the title reads as the conversation id
- **AND** it renders as neither an empty value nor the unavailable marker

#### Scenario: A field the payload never carried is unavailable, not empty

- **WHEN** the metadata panel renders a conversation whose row carries no `traces` key, because the instance
  does not expose that column
- **THEN** the trace field renders as the unavailable marker
- **AND** a field present in the row with a `null` value renders as empty instead

### Requirement: Conversation detail header identifies the conversation and states its turn count

The header SHALL lead with the conversation id as the view's heading. The id is the value that addresses the
conversation everywhere else — the route, the log's identity column, another tool — so it SHALL remain the
heading even where a human-readable title exists.

The heading SHALL keep the full id reachable when it is too long to display, and SHALL offer a means of
copying it, since the id is the value a reader carries to another tool.

The header SHALL state the conversation's **title**, its project, its turn count, the span between first and
last activity, and how long ago the last activity was.

The title SHALL be read from the conversation-insight enrichment. It SHALL degrade to the conversation id
when the enrichment carries no row for the conversation or its title is blank, and MUST NOT be fabricated
from other values. A title computed from a truncated input SHALL still be stated: it describes the part of
the conversation the evaluator read, which is a weaker claim than a full title but a true one.

The header MUST NOT state the conversation's deployments. The metadata panel states them, and one fact
presented in two places gives the reader no way to tell which is authoritative — the same reason the turn
count is stated once and the rating counts are left to the panel that lists them.

The header MUST NOT state a **model** field. The rollup carries no conversation-level model column;
`deployments` names every deployment that handled any hop — routers, applications, MCP toolsets and embedding
deployments alongside the models — and which of them is a model is not derivable from the array. The view MUST
NOT synthesize the set either: the turn rollup's `models` column is the authoritative billed set but is **per
turn**, no server-side union over it is expressible, and a union taken over the view's bounded turn list would
understate a conversation longer than that bound, the same error the turn-count rule already forbids.
Presenting a real model set requires a conversation-level field the rollup does not yet carry.

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

#### Scenario: The title states the insight's value

- **WHEN** a conversation's insight row carries a title
- **THEN** the header states that title

#### Scenario: A conversation with no insight row falls back to its id

- **WHEN** a conversation has no insight row
- **THEN** the header's title field states the conversation id
- **AND** it renders neither blank nor as the unavailable marker

#### Scenario: The header states no deployments and no model

- **WHEN** a conversation's rollup records deployments including a router, an application and a model
- **THEN** the header states none of them
- **AND** it presents no model field
- **AND** the metadata panel remains where those deployments are stated

#### Scenario: A long conversation id stays reachable and copyable

- **WHEN** the conversation id is too long to fit the heading
- **THEN** it is truncated, its full value remains reachable, and it can be copied

#### Scenario: The header carries no ratings and no back control

- **WHEN** the detail view renders
- **THEN** the header shows no rating counts and no control for returning to the log

#### Scenario: The header states the conversation's facts

- **WHEN** the detail view renders
- **THEN** the header states the title, the project, the turn count, the activity span and the time since
  last activity

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

### Requirement: Conversation detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: token and cost usage, feedback, and
record metadata. Each panel SHALL carry an icon coloured by its source, so the panels are distinguishable at
a glance rather than by reading their headings.

Each panel SHALL name the entity it reads from, and MUST NOT overstate it. **Every** panel SHALL have a real
source: the view MUST NOT present a panel no queried entity populates, because a panel of nothing but
unavailable markers states a shape the system does not record.

A panel MUST NOT name an enrichment as its source. The analytics service exposes an enrichment's columns as
columns of the entity they enrich, and the view queries the entity — so a panel that reads an
enrichment-derived field still reads `conversations`, and naming the enrichment would present an internal
composition of the entity as a separate thing the view queried.

The usage panel SHALL state prompt tokens, completion tokens, total tokens, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. Monetary values SHALL carry the emphasis
money carries elsewhere in the app, which is independent of the panel's source colour.

The metadata panel SHALL state the conversation id, the anonymized user identifier, the project, the first
activity time, the successful-request count, the conversation's **trace ids** and the deployments that served
the conversation, all from the rollup. A field the rollup carries SHALL NOT be rendered as unavailable: the
panel states what the record holds, and marking a recorded field as absent misreports the data the view
already fetched.

The trace ids SHALL be read from the rollup's `traces`. Their order is the rollup's own — ascending by id,
not by turn — so the panel MUST NOT present them as a turn sequence or number them as turns. The panel MUST
NOT derive a turn count from the array's length: the length is not queryable and the array is subject to the
same bound as any projected value, so `turn_count` remains the count of record and the header remains where
it is stated.

The successful-request field's label SHALL state what `success_count` counts — a turn in which **at least one
hop** succeeded. Labelling it as an unqualified success count would read as "the turn succeeded", which is a
stronger claim than the rollup makes: a turn whose entry hop failed after a nested hop succeeded is counted.

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

- **WHEN** the metadata panel renders a field the conversation-insight enrichment supplies
- **THEN** the panel still names `conversations` as its source
- **AND** no panel is labelled as enrichment-derived

#### Scenario: The metadata panel marks what the rollup lacks

- **WHEN** the detail view renders
- **THEN** the metadata panel states the conversation id, user identifier, project, first activity,
  successful-request count, trace ids and the conversation's deployments
- **AND** it marks none of them as unavailable, because the rollup carries every field it lists

#### Scenario: Trace ids are not presented as a turn order

- **WHEN** a conversation's rollup records several trace ids
- **THEN** the metadata panel lists them without turn numbers or ordinal labels
- **AND** the panel states no turn count derived from how many it lists

#### Scenario: The successful-request label states what it counts

- **WHEN** the metadata panel renders
- **THEN** its successful-request label states that a turn counts when at least one of its hops succeeded

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
different names. The same applies to `duration_ms` and `deployments`, which the duration and deployments columns
consume, and to every field a curated insight, token or cost column reads.

An enrichment field's exposed name is a qualified flat name containing a dot — `conversation_insights.title`.
The grid SHALL read such a field by that whole name. It MUST NOT interpret the dot as a path into a nested
value: the row carries the name as a single key, so a path interpretation finds nothing and renders an empty
cell for a field the row does carry. This applies to schema-derived and curated columns alike.

The curated columns SHALL keep their composed cells and their labels. The **default visible set** SHALL be the
conversation, title, project, user, turns, activity, tokens, cost, duration and deployments columns together with
the Rating column. Every other column — curated or offered — SHALL default to hidden.

A curated column whose field the schema does not report SHALL NOT be rendered at all — neither shown nor
offered as hideable. A column that can never carry a value is not a column the operator has a use for:
enabling it would present permanently empty cells that read as missing data. This applies to the columns
added beyond the view's original set; the original curated columns and the composed Rating column are
rendered unconditionally, Rating because it reads no field of this entity. A column omitted this way SHALL
reappear on its own once the instance reports its field, with no stored column choice to reset.

The Title column is subject to the same rule rather than exempted by its fallback. It degrades to the
conversation id for a conversation the enrichment has not reached, which is right for a gap in the data — but
on an instance carrying no insight enrichment at all it would degrade for **every** row, presenting a second
column of conversation ids beside the first.

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
- **THEN** the deployments column renders `deployments`
- **AND** `deployments` is not additionally offered as a catalog column

#### Scenario: A composed column's source fields are not offered separately

- **WHEN** the catalog is built
- **THEN** the activity column is offered
- **AND** `first_request_time` and `last_request_time` are not offered as columns of their own

#### Scenario: A dotted enrichment field is read by its whole name

- **WHEN** a column for `conversation_insights.title` renders a row carrying that key
- **THEN** the cell states the row's title
- **AND** it is not empty

#### Scenario: A curated column whose field is missing is not rendered

- **WHEN** the schema reports no insight column
- **THEN** the grid renders no title, sentiment, sentiment score, topic, topics, language or resolution
  status column
- **AND** the column panel offers none of them
- **AND** the remaining columns render as they did before those columns existed

#### Scenario: Rating survives a schema that reports no such field

- **WHEN** the column set is built
- **THEN** the Rating column renders even though the entity carries no `rating` field

#### Scenario: The curated set is what is visible by default

- **WHEN** the conversations view loads with no stored column choice
- **THEN** the conversation, title, project, user, turns, activity, tokens, cost, duration, deployments and Rating
  columns are visible
- **AND** every other column is hidden

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

## REMOVED Requirements

### Requirement: Conversations grid names the models a conversation used

**Reason**: The column never named models. It rendered `conversations.deployments` narrowed by three
name-shaped rules — an `applications/` or `toolsets/` resource-path prefix, the substring `embedding`, and a
value containing another value of the same conversation — and that narrowing disagrees with the authoritative
billed set in both directions. Measured against `turns.models` on dev: for a conversation whose `deployments`
held seven values, the narrowing kept three orchestrating `statgpt-*` deployments the rollup excludes and
dropped two embedding deployments the rollup includes because they were billed, leaving only two of four
correct. Deployed under a plain name, a router or application is undetectable from the array, so no refinement
of a name heuristic can fix it. Replaced by "Conversations grid names the deployments a conversation used".

**Migration**: The column keeps its field, its position in the default visible set, its pill-and-overflow
rendering, its keyboard-reachable full list, and its absence of sort and filter affordances. Two things
change: it is labelled for `deployments` rather than for models, and it renders the recorded array unnarrowed,
so values the narrowing used to hide are now shown as the pills themselves rather than only in the overflow.
A per-conversation set of billed models needs a conversation-level field the rollup does not carry;
`turns.models` is per turn and no server-side union over it is expressible.

### Requirement: Conversation turn list comes from the earliest hop of each trace and discloses its bound

**Reason**: The analytics service now materializes a `turns` rollup — one row per trace, with the turn's
entry time, hop count, token totals, cost and wall-clock duration already computed. The frontend no longer
identifies a turn's entry hop or aggregates a turn's figures, so a requirement written around how to derive
turns from the hop-level usage log no longer describes the behaviour. Replaced by "Conversation turn list
comes from the turns rollup and discloses its bound".

**Migration**: No consumer-visible contract changes in the turn list's shape: one turn per trace, each with
its own hop count, token total and cost, bounded, with the same clipping disclosure. One behavioural change
follows the new source and is stated in the replacement requirement — the rollup is refreshed periodically
while the usage log is live, so a conversation newer than the last refresh has no turns to list.

## ADDED Requirements

### Requirement: A conversation query names only fields the entity's schema reports

The analytics service rejects a query that names a field its entity does not carry, and it rejects the
**whole query** rather than returning the columns it does have. A projection is therefore all-or-nothing:
one field the deployment lacks yields no rows at all, so a page that hardcodes its field list fails
entirely instead of rendering with one column empty.

The entity's fields are not fixed across deployments. The conversation rollup, the turn rollup and the
insight enrichment are catalog objects provisioned per instance rather than shipped with the service, so
an instance can carry an older set than the frontend knows about.

The conversations views SHALL therefore treat the fetched entity schema as the authority on what may be
named. Each view SHALL distinguish two classes of field:

- **required** — the fields without which the view cannot render its curated columns at all. These SHALL
  be named unconditionally.
- **optional** — every field added beyond that core. An optional field SHALL be named **only** when the
  fetched schema reports it.

When the schema cannot be fetched, the query SHALL name the required fields alone. A failed schema fetch
is not evidence that an optional field exists, and guessing costs the whole page rather than one column.

The schema SHALL be read **server-side**, on the route that renders the view, so the first paint already
knows which fields exist. A view MUST NOT issue its first data query before that answer is available.
The single-conversation query alone SHALL wait on it: the reads that name no optional field — the
conversation's feedback and its turns — SHALL stay parallel with the schema read rather than queue behind
it.

This rule governs the projection only. A filter, a sort key or a search predicate already refuses a field
the entity does not carry, and that behaviour is unchanged.

#### Scenario: An optional field the schema does not report is not named

- **WHEN** the conversations list query is built and the schema does not report the conversation title
- **THEN** the select does not name `conversation_insights.title`
- **AND** it names every required field
- **AND** the query returns rows

#### Scenario: An optional field the schema reports is named

- **WHEN** the schema reports the conversation title
- **THEN** the select names `conversation_insights.title`

#### Scenario: A failed schema fetch falls back to the required fields

- **WHEN** the entity schema cannot be fetched
- **THEN** the query names the required fields only
- **AND** it names no optional field

#### Scenario: One lagging field does not cost the whole view

- **WHEN** the instance carries the conversation rollup but not the insight enrichment
- **THEN** the conversations list renders its rows
- **AND** the detail view renders its header, panels and figures

#### Scenario: The detail route reads the schema server-side

- **WHEN** the conversation detail route renders
- **THEN** it fetches the conversations entity schema on the server
- **AND** the single-conversation query is built from the fields that schema reports
- **AND** the feedback and turn reads are issued without waiting for it

### Requirement: Conversation turn list comes from the turns rollup and discloses its bound

The detail view SHALL derive a conversation's **turn list** from the `turns` entity, which the analytics
service materializes as one row per trace. That list is the spine of the transcript and the source of each
turn's own figures. It is **not** the source of the conversation's turn count, which the header reads from
the conversations rollup.

The view MUST NOT identify turns itself by grouping the hop-level usage log. The rollup already resolves what
a turn is, and a second definition maintained in the frontend would drift from it: a turn's entry hop, its
hop count and its cost would each be answered twice, by two rules, for the same conversation.

Each turn SHALL carry its trace id, its start time, its hop count, its token total, its cost and its
wall-clock duration, all as the rollup states them. A turn's cost SHALL be the sum of each hop's own cost, not
the chain-inclusive figure that already covers everything a hop initiated; summing the latter across a chain
double-counts. A turn's duration SHALL be its elapsed time — the longest single hop, since a hop's duration
contains the hops it called — not the sum of its hops' durations.

The turn list SHALL be ordered by each turn's start time, ascending. The rollup carries no turn index, so
start time is the only ordering that reconstructs the conversation's sequence, and the view MUST NOT present
a turn number as though it were recorded.

The turn query SHALL name the trace id, so a turn's span tree stays addressable and the trace drawer's
behaviour is unchanged.

The turn query MUST NOT name a request or response body column, and the rollup exposes none: bodies are
heavy, and naming one in a per-conversation read makes the turn list as slow as a transcript read.

The turn list SHALL be bounded, and the view MUST NOT page through it. When the bound clips the list — that
is, whenever fewer turns load than the conversations rollup's `turn_count` — the view SHALL state both figures
together, so the number of turns on screen reads as a stated limit rather than as the conversation's length.
That disclosure MUST be visible without interaction, and MUST NOT render when the list is complete.

The turn read SHALL NOT be gated on a schema probe of its own. Unlike the conversation read, it names no
optional field: an instance either carries the turn rollup or it does not, so there is no partial projection
to negotiate. Where the rollup is absent the query fails, and the view SHALL render its existing
failed-to-load presentation — which is accurate, and stays distinct from a conversation that genuinely has
no turns.

The `turns` rollup is **refreshed periodically** while `dial_usage_log` is written live, so a conversation
that started after the last refresh has no rows in it. Such a conversation SHALL render the view's existing
empty-turn-list presentation: the header, the panels and the rollup's own figures still render from
`conversations`, and the view MUST NOT report an error, since nothing failed. The view MUST NOT fall back to
the hop-level usage log to synthesize turns for it — that would answer one conversation by one definition of a
turn and the next by another.

#### Scenario: One turn per trace, from the rollup

- **WHEN** the detail view loads a conversation the rollup records several turns for
- **THEN** one turn renders per trace
- **AND** each reports its own hop count, token total, cost and duration as the rollup states them
- **AND** the turn query targets the `turns` entity and carries no group-by

#### Scenario: Turns are ordered by when they started

- **WHEN** a conversation's turns are listed
- **THEN** they render in ascending order of start time
- **AND** the query's sort key is the turn's start time

#### Scenario: A turn's trace stays addressable

- **WHEN** a turn renders
- **THEN** it offers the control that opens that turn's trace
- **AND** the span tree that opens is the one for that turn's trace id

#### Scenario: A clipped turn list states its bound against the real count

- **WHEN** a conversation's `turn_count` is 911 and the turn list is bounded at 200
- **THEN** the view states that 200 of 911 turns are shown
- **AND** that disclosure is visible without interaction

#### Scenario: A complete turn list carries no disclosure

- **WHEN** a conversation's `turn_count` is 12 and all 12 turns load
- **THEN** no truncation disclosure renders

#### Scenario: The turn query reads no body column

- **WHEN** the turn list is requested
- **THEN** the query names neither a request body nor a response body column

#### Scenario: An instance without the turn rollup reports a failed read

- **WHEN** the detail view loads a conversation on an instance that does not carry the turn rollup
- **THEN** the timeline states that the turns could not be loaded
- **AND** the header, the panels and the conversation's own figures still render
- **AND** no schema probe of the turn entity is issued before the read

#### Scenario: A conversation newer than the last refresh lists no turns

- **WHEN** a conversation exists in the conversations rollup but has no rows in the turns rollup
- **THEN** the view renders its empty-turn-list presentation rather than an error
- **AND** the header and the panels still state the conversation's figures
- **AND** no request is made to the hop-level usage log for a substitute turn list

### Requirement: Conversations grid names the deployments a conversation used

The conversations grid SHALL present a curated **Deployments** column reading the rollup's `deployments`
array, so an operator can see which deployments served a conversation without opening it. The column SHALL be
part of the default visible set and SHALL be projected by the first list query.

The column SHALL render its values as discrete pills with an overflow badge stating how many further values
exist, and SHALL make the complete list reachable without a pointer, so the values hidden by the overflow are
available to a keyboard user and not only on hover.

The column SHALL render the array **as recorded**. It MUST NOT narrow it, and it MUST NOT be labelled as
naming models. `deployments` records every deployment that handled a hop — orchestrating deployments,
applications, MCP toolsets and embedding deployments alongside the models — and which of those is a model is
not derivable from the array. A name-shaped rule cannot decide it: a router or application deployed under a
plain name is indistinguishable from a model, while an embedding deployment that was billed is a legitimate
member of the billed set. A column labelled for the field it reads needs no such guess and cannot misreport.

Where a per-conversation set of **billed models** is wanted, it SHALL come from a conversation-level field the
service reports. The turn rollup's `models` column is the authoritative billed set but is per turn, no
server-side union over it is expressible, and a union over the bounded turn list a detail view loads would
understate a longer conversation — so the grid MUST NOT synthesize one.

The column SHALL NOT be sortable and SHALL NOT be filterable. The query language expresses no ordering or
predicate over an array field, and the grid pages server-side, so any client-side ordering or filtering would
apply to the loaded page rather than to the result and would misstate what it did.

#### Scenario: Deployments renders on first paint

- **WHEN** the conversations grid loads with no stored column choice
- **THEN** the Deployments column is visible
- **AND** the first list query's select names `deployments`

#### Scenario: Values render as pills with an overflow badge

- **WHEN** a conversation's list holds more values than the column width fits
- **THEN** the cell renders as many pills as fit followed by a badge stating the remaining count
- **AND** the complete list is reachable without a pointer

#### Scenario: The recorded array renders unnarrowed

- **WHEN** a conversation's deployments include an application resource path, a toolset resource path, an
  embedding deployment and a model
- **THEN** the cell states all four
- **AND** none is withheld as not being a model

#### Scenario: The column does not claim to name models

- **WHEN** the operator reads the column header
- **THEN** it names deployments
- **AND** the detail view's metadata panel names the same field the same way

#### Scenario: Deployments offers no sort or filter affordance

- **WHEN** the operator inspects the Deployments column header
- **THEN** it offers neither a sort affordance nor a filter control

### Requirement: Conversation grid columns curated from the rollup's insight, token and cost fields

The conversations log SHALL present curated columns for the fields the rollup carries beyond its default set,
rather than leaving them to the schema-derived catalog. A schema-derived column takes its header from the
field's display name and its formatting from the field's declared type, which is correct but generic; a field
whose values are a closed vocabulary, or whose meaning carries a caveat, needs a designed column instead.

The curated set SHALL cover, in addition to the nine existing columns:

| Field | Column | Default |
|---|---|---|
| `conversation_insights.title` | title | visible |
| `conversation_insights.sentiment` | sentiment | hidden |
| `conversation_insights.sentiment_score` | sentiment score | hidden |
| `conversation_insights.topic` | topic | hidden |
| `conversation_insights.topics` | topics | hidden |
| `conversation_insights.language` | language | hidden |
| `conversation_insights.resolution_status` | resolution status | hidden |
| `cache_creation_tokens` | cache creation tokens | hidden |
| `cached_prompt_tokens` | cached prompt tokens | hidden |
| `reasoning_tokens` | reasoning tokens | hidden |
| `chain_price_total` | chain cost | hidden |

The **title** column SHALL be an identity column presented alongside the conversation id, not a metadata
column ordered among the metrics: it is what a reader recognises a conversation by. It SHALL be visible by
default, and it SHALL degrade to the conversation id under the same rule the detail header applies, so the
same conversation is named the same in both places. It SHALL keep its full value reachable when truncated.

An insight column SHALL state that its values come from an evaluation of the conversation rather than from
the request log, so a reader does not take a sentiment or a resolution status for something DIAL recorded.
An insight column MAY be empty for any conversation the evaluator has not processed; an empty cell there
SHALL read as not-yet-evaluated rather than as a value of none.

The **chain cost** column SHALL state that it is the top-down figure and that it is absent wherever no turn of
the conversation has a chain-starting hop carrying a conversation id. It MUST NOT be presented as an
alternative cost of record: where it is present it agrees with `total_price`, and where it is absent the
difference is a coverage gap in the rollup's population, not an accounting difference. `total_price` SHALL
remain the cost column.

Every curated column SHALL be togglable and SHALL be attributed to the `conversations` provenance group, like
every other column read from that entity. A curated column's field SHALL NOT also be offered as a
schema-derived column, so the same data is never presented twice under two headers.

#### Scenario: The title column is an identity column, visible by default

- **WHEN** the conversations log loads with no stored column choice
- **THEN** the title column is visible, presented alongside the conversation id
- **AND** it renders the conversation id for a conversation with no insight title

#### Scenario: The new columns default to hidden and can be shown

- **WHEN** the conversations log loads with no stored column choice
- **THEN** the sentiment, sentiment score, topic, topics, language, resolution status, cache creation tokens,
  cached prompt tokens, reasoning tokens and chain cost columns are hidden
- **AND** each can be made visible from the column panel

#### Scenario: A curated field is not also offered as a raw column

- **WHEN** the column catalog is built
- **THEN** each curated field appears exactly once, under its curated column's header
- **AND** no schema-derived column is offered for the same field

#### Scenario: The chain cost column states its coverage gap

- **WHEN** the chain cost column is shown
- **THEN** its header discloses that it is the top-down figure and can be absent
- **AND** a conversation whose rollup carries no chain cost renders an empty cell rather than a zero

#### Scenario: An insight column is attributed to its evaluation

- **WHEN** the sentiment column is shown
- **THEN** its header discloses that the value comes from an evaluation of the conversation
