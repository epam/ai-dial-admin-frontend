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
| `deployments` | deployments |

It SHALL additionally name **every offered field the entity's own source carries**, whether or not its column
is currently visible. Such a field costs the query one more column of the table it is already reading, which
is less than what re-fetching every loaded page costs when the operator reveals its column.

It SHALL name a field the service reports under an **enrichment namespace** — a name qualified by the
enrichment that supplies it, `conversation_insights.` and `conversation_buckets.` being the two the
`conversations` entity currently exposes — only while that field's column is visible. The service joins an
enrichment only when a query names one of its columns, so naming one unconditionally would add that join to
every page of every scroll, for columns the operator has not asked for.

Both rules SHALL apply to a **curated** column's field as well as an offered one's. A curated column is not
offered in the catalog — it is designed rather than derived — but it still reads a stored field, so a
projection that skipped it would render an empty cell for data the row does carry, and it is classified as
source- or enrichment-backed by the same test.

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

Search SHALL NOT reach the conversation title either: the title is an enrichment column, absent for any
conversation the evaluator has not processed, so a term matched against it would silently narrow the result to
enriched conversations only.

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

#### Scenario: A curated hidden column is projected once it is shown

- **WHEN** the operator makes the Topics column visible
- **THEN** the next request's select names `conversation_insights.topics`
- **AND** the cells render that field's values rather than empty cells

#### Scenario: The identity column's enrichment field is projected with no column of its own

- **WHEN** the list query is built with every optional column hidden
- **THEN** the select still names `conversation_insights.title`
- **AND** it names no other enrichment field

#### Scenario: Showing a column re-queries from the first page

- **WHEN** the operator makes a hidden enrichment-backed column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field

#### Scenario: Hiding a column does not re-query

- **WHEN** the operator hides a visible column carrying no filter
- **THEN** no new request is issued and the rows already loaded remain

#### Scenario: Hiding a filtered column clears its filter and re-queries

- **WHEN** the operator hides a column that carries an active filter
- **THEN** that column's filter is cleared
- **AND** the fetched pages are discarded and the next request is for the first page
- **AND** that request carries no predicate on the hidden column's field

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
the conversation yet — or partial, flagged `truncated`, when the conversation exceeded its budget. An absent
enrichment value SHALL read as **not yet evaluated**: it MUST NOT render as a zero, as a dash meaning "none",
or as any placeholder implying the evaluator looked and found nothing. Coverage is sparse and stays sparse —
under a quarter of conversations carry an insight row — so this is the common case, not an edge one.

Where such a value **labels** the conversation, an absent or blank one SHALL degrade to the unavailable marker
and MUST NOT degrade to the conversation id. Both surfaces that render a title render the id alongside it, so
substituting one for the other states the id twice and reads as though the conversation were named after its
own hash.

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

#### Scenario: A missing insight title degrades to the marker, not to the id

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the title renders as the unavailable marker
- **AND** the conversation id is not rendered in its place
- **AND** the id remains stated once, in its own line of the same cell

#### Scenario: An absent insight value is not presented as a finding

- **WHEN** the Topics column renders a conversation the evaluator has not processed
- **THEN** the cell renders empty
- **AND** it states no zero, no dash and no "none"

#### Scenario: A field the payload never carried is unavailable, not empty

- **WHEN** the metadata panel renders a conversation whose row carries no `traces` key, because the instance
  does not expose that column
- **THEN** the trace field renders as the unavailable marker
- **AND** a field present in the row with a `null` value renders as empty instead

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

This is one half of a rule the whole feature follows, and the two halves SHALL NOT be conflated:

- A **catalog identifier**, rendered in monospace, claims **the entity the page queried**. It SHALL name
  `conversations` or `rate_analytics` and SHALL NEVER name an enrichment — in a panel's source, in the page
  header's provenance line, or anywhere else an identifier appears.
- A **readable origin label** claims **where a value came from**, which is a different question and decides
  whether an empty cell means "not recorded" or "not yet evaluated". It SHALL distinguish an enrichment from
  the rollup it decorates.

Where both registers describe the same origin they SHALL carry the same provenance colour, so an identifier
and a label for one source cannot appear to disagree.

The usage panel SHALL state prompt tokens, completion tokens, total tokens, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. Monetary values SHALL carry the emphasis
money carries elsewhere in the app, which is independent of the panel's source colour.

A panel field whose value cannot be read at face value SHALL carry a caveat stating why, and that caveat
SHALL be reachable by keyboard. A field label is not focusable, so a caveat attached to it by hover alone is
unreachable for a keyboard or screen-reader user; the caveat SHALL therefore be exposed through a focusable
control whose accessible name carries it. A `title` attribute alone does not satisfy this.

The recorded durations are two such fields. `duration_ms` sums a conversation's hop durations, and an outer
hop's duration already contains the hops it called, so a conversation whose turns fan out into chains reads
longer than the time it actually took. `avg_duration_ms` averages per **hop** rather than per turn, so it is
not the average turn. Each SHALL state its own caveat: the two figures are wrong in different ways, and one
shared note would misdescribe whichever it did not name. The view MUST NOT describe either as elapsed time.
This restates a caveat previously carried only by the conversations grid's Duration column, which no longer
exists — the figures remain on this panel, so the statement has to as well.

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

#### Scenario: A duration figure carries a keyboard-reachable caveat

- **WHEN** the usage panel renders a conversation's duration and average duration
- **THEN** each figure carries a caveat explaining what its value actually measures
- **AND** each caveat is reachable by keyboard and exposed to assistive technology
- **AND** neither figure is described as elapsed time

#### Scenario: An identifier never names an enrichment

- **WHEN** the detail view's panels and the log's provenance line render for an instance carrying the insight
  enrichment
- **THEN** every monospace catalog identifier names only an entity the page queries
- **AND** none of them names `conversation_insights`

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

### Requirement: Conversations grid with server-side ordering and per-column filtering

The conversations view SHALL render a grid of five visible columns — conversation, project, user, activity,
cost — plus the Rating column. Turns, tokens, deployments and topics are curated columns that default to
hidden; see "Conversation grid columns are a fixed curated set gated by the entity schema" for the whole set
and its origins.

A column SHALL offer a sort or a filter control **only** when the control can be answered over the whole
result. That is the case exactly when the column is backed by a stored field of the `conversations` entity,
because the control then becomes part of the query. Sorting and filtering SHALL therefore be resolved by the
backend, and the grid MUST NOT narrow or reorder the pages it already holds: those pages are a slice of the
result, so narrowing them client-side would report a slice as the complete answer.

| Column | Sort | Filter |
|---|---|---|
| conversation (`chat_id`) | yes | text |
| project (`project_id`) | yes | text |
| user (`user_hash`) | yes | text |
| turns (`turn_count`) | yes | number |
| activity (`last_request_time`) | yes | none |
| tokens (`total_tokens`) | yes | number |
| cost (`total_price`) | yes | number |
| deployments (`deployments`) | no | no |
| topics (`conversation_insights.topics`) | no | text |
| Rating | no | no |

The deployments column SHALL offer neither, because the query language expresses no ordering and no predicate
over an array. The topics column SHALL offer a text filter but no sort: its value is a delimited string, so a
lexicographic ordering would sort by whichever term happens to be written first and carry no meaning, while a
contains predicate matches a term wherever it appears in the string.

A predicate on an enrichment-backed field SHALL be gated on the entity schema exactly as the projection is. An
instance that does not carry the enrichment would have the whole query rejected, not the one predicate
dropped. A reader SHALL NOT be led to believe such a filter searched every conversation: it matches only rows
the enrichment has reached, which is under a quarter of them, and that is correct behaviour rather than a
bug — but it is a narrowing of the population, not only of the result.

The Rating column SHALL offer neither. It is composed from `rate_analytics` lookups resolved for the page
just returned and has no field on the queried entity, so any ordering or narrowing of it could only describe
the rows already on screen. The feedback control is the filter for that dimension.

The activity column SHALL be sortable but SHALL NOT offer a filter. The page's time-period control already
predicates on `last_request_time`, and a second control over the same dimension would let a filter appear to
widen a range the period clips.

Filter controls SHALL offer only operators the query language can express. An operator with no equivalent —
notably prefix and suffix matching — MUST NOT be offered, since an offered operator that cannot be translated
either fails or silently returns the wrong rows. Text columns SHALL offer contains, does-not-contain, equals
and not-equals; number columns SHALL additionally offer the four magnitude comparisons. An incomplete filter
entry — an operator chosen with no value — SHALL contribute no predicate rather than a predicate against an
empty value.

Column filters SHALL compose with the page's own controls as a conjunction: the search term, the time period,
the feedback narrowing and every column filter SHALL all hold for a returned conversation. The page's filter
state MUST NOT be written into the grid's filter model, and the grid's filter model MUST NOT be read as the
page's filter state; they are separate inputs to one query.

A change to the sort or to any column filter SHALL discard the pages already fetched and restart from the
first page of the new result, exactly as a search, period or feedback change does. The whole-result
conversation count and cost SHALL be re-resolved under the same predicates, so the summary cannot describe a
different result than the rows.

When no column sort is applied the result SHALL be ordered most recent last activity first. Clearing a
column's sort SHALL return to that default rather than leaving an arbitrary order.

The conversation column SHALL keep **both** of its lines reachable when either is too long to display, since
real ids are not uniformly short and can run to hundreds of characters, and a title is free text. Truncation
MUST NOT be the only presentation of either value. The user column SHALL keep its value reachable on the same
terms.

The conversation column MUST NOT carry a copy control per row. The full id is already reachable there, and a
control in every row of an infinitely scrolling grid adds a focusable node per row to the tab order for a
value the detail view already offers to copy.

The user column SHALL show the conversation's `user_hash`, labelled the way the conversation detail page
labels it. The value is a de-identified surrogate rather than an identity, so the column SHALL NOT be
presented as a name or an address.

While the first page of a new sort, filter or page-control state is in flight the view SHALL show a loading
indicator, so the empty state cannot flash between a change and its rows. When the result holds no rows the
view SHALL render a no-data state rather than an empty grid body.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

Rows SHALL be openable, navigating to that conversation's detail view. The grid SHALL indicate that its rows
are openable rather than leaving the affordance undiscoverable, and SHALL honour the app's convention for
opening a row in a new tab. The conversation id SHALL be URL-encoded into the detail address, since real ids
contain path separators and percent-encoded text.

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

#### Scenario: Sorting a field-backed column re-queries from the first page

- **WHEN** the operator sorts the cost column descending
- **THEN** a new request is issued carrying that sort key with a first-page offset
- **AND** the pages already fetched are discarded
- **AND** the rows shown are the result's ordering, not a reordering of the rows already held

#### Scenario: Clearing a sort returns to the default ordering

- **WHEN** the operator clears the sort on a column
- **THEN** the result is ordered most recent last activity first

#### Scenario: A column filter becomes a query predicate

- **WHEN** the operator applies a contains filter on the project column
- **THEN** a new request is issued carrying that predicate with a first-page offset
- **AND** the returned rows are the whole result's matches, not the previously loaded rows narrowed

#### Scenario: Column filters compose with the page's controls

- **WHEN** a column filter is applied while a search term, a time period and a feedback state are active
- **THEN** the request carries all of them, and a returned conversation satisfies every one

#### Scenario: The summary follows the sort and filter state

- **WHEN** a column filter is applied
- **THEN** the whole-result conversation count and cost are re-resolved under the same predicates

#### Scenario: Rating offers no sort and no filter

- **WHEN** the operator inspects the Rating column header
- **THEN** it offers no sort affordance and no filter control
- **AND** clicking it does not change the row order

#### Scenario: Activity sorts but does not filter

- **WHEN** the operator inspects the activity column header
- **THEN** a sort affordance is offered
- **AND** no filter control is offered

#### Scenario: Untranslatable operators are not offered

- **WHEN** the operator opens a text column's filter
- **THEN** the operator list offers contains, does-not-contain, equals and not-equals
- **AND** it offers no prefix or suffix matching option

#### Scenario: An operator with no value contributes nothing

- **WHEN** a filter entry has an operator selected and its value left empty
- **THEN** the request carries no predicate for that column

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group
- **AND** the conversation, project, user, turns, activity, tokens and cost columns are attributed to
  `conversations`, and the Rating column to `rate_analytics`

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: A long conversation id stays reachable

- **WHEN** a conversation id is too long to fit its column
- **THEN** the cell truncates it and the full value remains reachable

#### Scenario: Opening a row navigates to the conversation

- **WHEN** a grid row is opened
- **THEN** that conversation's detail view is navigated to, with its id URL-encoded in the address

#### Scenario: Opening a row in a new tab

- **WHEN** a grid row is opened with the app's new-tab modifier
- **THEN** the conversation's detail view opens in a new tab and the grid keeps its fetched pages

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** the first page of a new sort or filter state is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown

#### Scenario: Empty result renders the empty state

- **WHEN** the result holds zero conversations
- **THEN** the no-data content renders instead of an empty grid body

### Requirement: Conversation cells render composed values, not raw aggregates

The grid SHALL render composed cells rather than one raw stored value per column:

- The conversation column SHALL be a single **identity** cell stacking the conversation's title over its id,
  rather than two columns. The title labels the conversation and the id addresses it; they are one identity,
  and a column apiece printed the id twice on every conversation the enrichment has not reached, which is
  most of them. Where no title exists the first line SHALL render the unavailable marker and MUST NOT repeat
  the id.
- The topics column SHALL render its value as discrete chips rather than as the stored string. The value is a
  delimited list whose separator is not reliably spaced in real data, so the cell SHALL split on the
  delimiter, trim each term and drop empty ones before rendering. A term the view does not recognise SHALL
  render as it is stored: the vocabulary is owned by an evaluator that can be re-versioned without the
  frontend knowing, so normalising or dropping an unexpected term would hide real data. The full list SHALL
  stay reachable when more terms exist than the cell shows.
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

#### Scenario: The identity cell states the title over the id

- **WHEN** a row carries both a conversation id and an insight title
- **THEN** one cell states the title above the id
- **AND** no separate title column exists

#### Scenario: An untitled conversation shows the marker, not a repeated id

- **WHEN** a row carries no insight title
- **THEN** the cell's first line renders the unavailable marker
- **AND** the id appears once, on the second line

#### Scenario: Topics render as chips from an unevenly delimited string

- **WHEN** a row's topics value is `capabilities,error` and another's is `security, code review, validation`
- **THEN** both render as discrete chips with no leading or trailing whitespace
- **AND** an unrecognised term renders as stored

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

## REMOVED Requirements

### Requirement: Conversations grid names the models a conversation used

**Reason**: The column never named models. It rendered `conversations.deployments` narrowed by three
name-shaped rules — an `applications/` or `toolsets/` resource-path prefix, the substring `embedding`, and a
value containing another value of the same conversation — and that narrowing disagrees with the authoritative
billed set in both directions. Measured against `turns.models` on dev: for a conversation whose `deployments`
held seven values, the narrowing kept three orchestrating application deployments the rollup excludes and
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

### Requirement: Conversation grid columns are offered from the entity schema

**Reason**: The generic path produces columns that mislead. A schema-derived column takes its header from the
field's `display_name` and its formatting from the declared type, and says nothing else. Three fields of the
conversations entity cannot be read that way. `conversation_insights.model` is tagged provenance and its
display name is "Model": the catalog renders a column headed **Model** holding the *evaluator's* deployment,
so every row of a day on which one evaluator produced all 137 insights reads the same model name, beside a
`deployments` array holding what actually served the conversation. `chain_price_total` is NULL wherever no turn
has a chain-starting hop carrying a chat id — a coverage gap that renders as an alternative cost.
`sentiment_score` and `topic` restate `sentiment` and `topics`. A header a reader trusts has to be chosen, and
choosing it is what "curated" means, so the curated set becomes the whole set. Replaced by "Conversation grid
columns are a fixed curated set gated by the entity schema".

**Migration**: Four of this requirement's rulings are behaviour, not catalog mechanics, and are carried into
the replacement rather than dropped: an enrichment field's dotted name is read as one whole key and never as a
path; a curated column whose field the schema does not report is not rendered at all; a column is classified
by whether its field is enrichment-backed, and that classification decides whether revealing it costs a
re-query; and a failed schema fetch degrades to the columns that need no optional field, with the view saying
so. What is lost is the offering itself: a field the entity gains no longer appears as a column without a
frontend release. That was the original argument for the derived catalog and it is traded away deliberately —
an undesigned column that misleads is worse than no column. Sensitive, heavy and non-scalar exclusions cease
to be column rules, because nothing is offered for them to exclude; `traces` remains named only by the
single-conversation query, which is where it was already read.

### Requirement: Conversations grid states how long each conversation took

**Reason**: The column presents a number that is wrong for a large minority of conversations, and no
presentation fixes it. `duration_ms` sums a conversation's hop durations, but an outer hop's duration already
contains the hops it called, so every nested chain is counted more than once. On dev-like data 2033 of 5853
conversations contain a multi-hop turn, and of those carrying duration data 46% read wrong. A correct value
needs a max-per-turn-then-sum, a two-level aggregate no single pass over hops can express, so it has to be
fixed in the rollup rather than in the view. Removing the column rather than hiding it is the point: a hidden
column is one click away from stating a wrong number, and the click carries no warning with it.

**Migration**: An operator loses the ability to scan the log for slow conversations, and no other column
replaces it — the honest answer is that this data does not support that scan today. The figures themselves are
**not** removed from the product: the detail view's usage panel continues to state `duration_ms` and
`avg_duration_ms`, and the header continues to state the wall-clock span between first and last activity,
which is a different and correct measure. This requirement's closing ruling — that the summed-hop behaviour is
disclosed and that user-facing copy MUST NOT describe the value as elapsed time — moves onto the usage panel,
which is now the only place the figures appear. Restoring a grid column is a follow-up on the rollup, not on
the view.

### Requirement: Conversation detail header identifies the conversation and states its turn count

**Reason**: The requirement's central ruling was that the conversation id "SHALL remain the heading even where
a human-readable title exists". That inverts: the title becomes the heading and the id moves into the meta
row. A heading names the thing on the page, and leading with the id made every conversation's heading a hash
while a readable name sat unused beside it; the reader who needs the id needs to copy it, not read it as a
title. The requirement's second inversion is the degradation rule — the title no longer falls back to the id,
because the id is now stated in the same header and substituting it states one value twice. Replaced by
"Conversation detail header names the conversation and states its turn count".

**Migration**: Everything the requirement ruled other than the heading and the fallback is carried into the
replacement unchanged: the id stays reachable and copyable, the turn count is stated once from the rollup and
never derived from the loaded turn list, the header states no deployments and no model, it carries no rating
counts and no back control, and its values are formatted as the log formats them. The replacement adds two
rulings the old one lacked: an untitled conversation's heading carries an accessible name, since a heading
whose only text is a dash names nothing; and a title written from a truncated conversation says so on the
detail view, where there is room to explain it.

## ADDED Requirements
### Requirement: Conversation detail header names the conversation and states its turn count

The header SHALL lead with the conversation's **title** as the view's heading, and SHALL state the
conversation **id** in the meta row alongside its project, turn count, activity span and time since last
activity. A heading names the thing on the page; the id addresses it. Leading with the id made every
conversation's heading a hash, and the reader who needs the id needs to copy it rather than read it.

The id SHALL keep its full value reachable when it is too long to display, and SHALL offer a means of copying
it, since the id is the value a reader carries to another tool. Those affordances follow the id into the meta
row rather than staying with the heading.

The title SHALL be read from the conversation-insight enrichment. Where the enrichment carries no row for the
conversation, or its title is blank, the heading SHALL render the unavailable marker and MUST NOT render the
id in its place — the id is already stated in the meta row, and repeating it as the name states one value
twice. The marker MUST NOT stand as the heading's only content for assistive technology: a heading whose text
is a dash names nothing, so it SHALL carry an accessible name stating that the conversation is untitled. The
title MUST NOT be fabricated from other values.

A title computed from a `truncated` input SHALL still be stated: it describes the part of the conversation the
evaluator read, which is a weaker claim than a full title but a true one. The detail view SHALL state that
weaker claim **for the conversation it is showing**, in text rather than as a bare marker, because the reader
is looking at one conversation and has room for the explanation. It MUST NOT leave the truncation unstated:
most titled conversations are truncated, so silence would present a partial label as a whole one.

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

#### Scenario: The heading is the conversation's title

- **WHEN** a conversation's insight row carries a title
- **THEN** that title is the view's heading
- **AND** the conversation id is stated in the meta row

#### Scenario: An untitled conversation still has a named heading

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the heading renders the unavailable marker
- **AND** the heading carries an accessible name stating the conversation is untitled
- **AND** the conversation id is not rendered as the heading

#### Scenario: A truncated title says so

- **WHEN** a conversation's insight row is flagged `truncated`
- **THEN** the detail view states that the title describes only part of the conversation
- **AND** the title itself is still stated

#### Scenario: The header states no deployments and no model

- **WHEN** a conversation's rollup records deployments including a router, an application and a model
- **THEN** the header states none of them
- **AND** it presents no model field
- **AND** the metadata panel remains where those deployments are stated

#### Scenario: A long conversation id stays reachable and copyable

- **WHEN** the conversation id is too long to fit the meta row
- **THEN** it is truncated, its full value remains reachable, and it can be copied

#### Scenario: The header carries no ratings and no back control

- **WHEN** the detail view renders
- **THEN** the header shows no rating counts and no control for returning to the log

#### Scenario: The header states the conversation's facts

- **WHEN** the detail view renders
- **THEN** the header states the title as its heading, and the id, the project, the turn count, the activity
  span and the time since last activity in its meta row

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


### Requirement: Conversation grid columns are a fixed curated set gated by the entity schema

The conversations grid SHALL present a fixed set of designed columns. Each column SHALL be written in the
frontend with a chosen header, a chosen presentation, and — where its value cannot be read at face value — a
statement of what it actually holds. A field the entity carries for which no column is designed SHALL NOT
appear as a column, and the grid MUST NOT generate a column from a field's declared type and display name: a
header derived that way asserts a meaning nobody checked, and the entity carries fields whose display names
are actively wrong for this view.

The set SHALL be exactly these ten columns, in this order, with these defaults:

| Column | Reads | Default |
|---|---|---|
| Conversation | `chat_id` + `conversation_insights.title` | visible |
| Project | `project_id` | visible |
| User | `user_hash` | visible |
| Turns | `turn_count` | hidden |
| Activity | `last_request_time` | visible |
| Tokens | `total_tokens` | hidden |
| Cost | `total_price` | visible |
| Deployments | `deployments` | hidden |
| Topics | `conversation_insights.topics` | hidden |
| Rating | composed from `rate_analytics` | visible |

Every column SHALL be attributed to exactly one origin, and its origin SHALL be the source the value actually
comes from:

| Origin | Columns | What the origin means |
|---|---|---|
| Conversation | the eight rollup columns | one row per conversation, refreshed periodically from the usage log; a value is present for every conversation, because without it the row would not exist |
| Conversation insights | Topics | computed by a separate evaluation run; absent for any conversation the evaluator has not reached, and absence means not-yet-evaluated |
| Ratings | Rating | resolved by a separate query for the conversations on the page, counted only within the selected period |

Origins SHALL be presented as readable names rather than as catalog identifiers, and SHALL distinguish an
enrichment from the rollup it decorates. A column read from an enrichment MUST NOT be attributed to the rollup:
the two produce different kinds of empty cell — one that cannot happen and one that is expected — and a reader
who cannot tell them apart reads a coverage gap as a measurement.

Origins SHALL be rendered as real column groups, which constrains column order so that columns of one origin
are adjacent. That constraint is accepted: an origin a reader can see is worth more than an arbitrary column
order.

The identity column SHALL NOT be hideable. It is how a reader recognises a row and how a row is opened, so a
grid without it is a table of values belonging to conversations the reader cannot name. Its permanence is also
what makes its enrichment field unconditional in the projection: a field read by a column that can be hidden
is projected on visibility, and the identity column has no hidden state for that rule to key on.

The identity column SHALL declare the rollup as its origin even though it reads the enrichment for its title.
A conversation's identity is its id; the title only labels it. That column SHALL state in its own disclosure
that the title comes from the insight enrichment, and that a title is written from a size-capped copy of the
conversation and may therefore describe only part of it. It SHALL state the size cap **once**, for the column,
rather than marking the rows it applies to: it applies to the large majority of titled conversations, so a
per-row marker would be background rather than signal.

A column SHALL offer a sort only where the query can order the whole result by its field, since paging is
server-side and a client-side sort over one loaded block would report a slice as the answer. Sortable:
`chat_id`, `project_id`, `user_hash`, `turn_count`, `last_request_time`, `total_tokens`, `total_price`. Not
sortable: Rating, Topics and Deployments.

Every column filter SHALL come from the operator sets the query language can already express; this
requirement introduces none. The two fields whose values form a closed vocabulary — an insight's sentiment and
its resolution status — SHALL NOT be presented as columns at all, because that vocabulary is declared in the
evaluator's own response schema on the service side while the entity schema reports only a string type. A
usable filter for them would mean a second copy of the enum held in the frontend, drifting silently whenever
the evaluator is re-versioned. Both fields remain reachable through the Query Builder, which names fields
rather than designing columns for them.

A curated column whose field the entity schema does not report SHALL NOT be rendered at all — neither shown
nor offered as hideable. A column that can never carry a value is not one an operator has a use for, and the
query cannot name the field in the first place. Rating is the exception and SHALL render unconditionally: it
reads no field of this entity, so no schema will ever report it. A column omitted this way SHALL reappear on
its own once the instance reports its field, with no stored column choice to reset.

An enrichment field's exposed name is a qualified flat name containing a dot. The grid SHALL read such a field
by that whole name and MUST NOT interpret the dot as a path into a nested value: the row carries the name as a
single key, so a path interpretation finds nothing and renders an empty cell for a field the row does carry.

A column SHALL be classified by whether its field is enrichment-backed, because that classification decides
whether revealing the column costs a re-query. A rollup field is a plain column of the table already being
read, so it is projected whether or not its column is visible and revealing it fetches nothing. An enrichment
field pulls its enrichment's join in, so it is projected only while its column is visible — except where the
identity column reads it, since that column cannot be hidden.

When the entity schema cannot be fetched the grid SHALL render the columns that need no optional field, and
SHALL report what was dropped in terms of the columns themselves rather than in terms of a catalog of
additional fields, which no longer exists.

#### Scenario: The column set is fixed, not derived

- **WHEN** the conversations grid loads against an instance reporting every field this view can read
- **THEN** it renders exactly the ten designed columns
- **AND** no column is generated from a field's display name or declared type
- **AND** no column is offered for the insight sentiment, sentiment score, topic, language, resolution status,
  model, evaluator version, enriched-at or group version, nor for the cache, cached-prompt or reasoning token
  counts, nor for the chain cost

#### Scenario: The default view is six columns

- **WHEN** the grid loads with no stored column choice
- **THEN** the conversation, project, user, activity and cost columns are visible, together with Rating
- **AND** the turns, tokens, deployments and topics columns are hidden

#### Scenario: Origins are named readably and the enrichment is distinguished

- **WHEN** the grid renders its origin groups
- **THEN** each is named in readable words rather than by a catalog identifier
- **AND** the topics column is attributed to the insight enrichment, not to the rollup
- **AND** the columns of one origin are adjacent

#### Scenario: The identity column declares the rollup and discloses its title's source

- **WHEN** the grid renders the conversation column's disclosure
- **THEN** the column is attributed to the rollup origin
- **AND** the disclosure states that the title comes from the insight enrichment
- **AND** it states that a title may describe only part of the conversation
- **AND** no row carries a separate truncation marker

#### Scenario: The identity column cannot be hidden

- **WHEN** the operator opens the column panel
- **THEN** the conversation column offers no way to hide it
- **AND** every other column can be hidden

#### Scenario: Every column is attributed to exactly one origin

- **WHEN** the column set is built
- **THEN** each column belongs to one origin group
- **AND** no column is left unattributed

#### Scenario: A dotted enrichment field is read by its whole name

- **WHEN** the topics column renders a row carrying the `conversation_insights.topics` key
- **THEN** the cell states that row's topics
- **AND** it is not empty

#### Scenario: A curated column whose field is missing is not rendered

- **WHEN** the schema reports no insight column
- **THEN** the grid renders no topics column
- **AND** the column panel offers it nowhere
- **AND** the remaining columns render as they did before it existed

#### Scenario: Rating survives a schema that reports no such field

- **WHEN** the column set is built from a schema that reports no `rating` field
- **THEN** the Rating column renders

#### Scenario: A failed schema fetch degrades to the unconditional columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the columns that need no optional field render
- **AND** the view reports that the optional columns were dropped because the schema could not be read

#### Scenario: Sort affordances match what the query can order

- **WHEN** the grid renders its headers
- **THEN** the conversation, project, user, turns, activity, tokens and cost columns offer a sort
- **AND** the rating, topics and deployments columns offer none

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

This rule governs the projection, and the same gate SHALL govern a filter and a sort key. A predicate or an
ordering naming a field the entity does not carry is rejected with the whole query exactly as a projection is,
so the allow-lists that decide which columns may sort and filter SHALL be derived from the schema-gated column
set rather than from a list held independently of it. A list maintained separately would drift the moment a
column is dropped for a lagging instance, and the failure would be the whole page rather than one control.

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
