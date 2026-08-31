## MODIFIED Requirements

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `response_ratings` entity — the per-response rollup of DIAL's rate events, keyed on the
rated `response_id` and carrying the `chat_id` the rating was submitted from — which the session rollup
does not include, and the structured-query DSL accepts a single `entity` with no join construct. A feedback
filter SHALL therefore be resolved as two queries: first a candidate query over `response_ratings` returning
the `chat_id` values carrying the requested feedback, then the session query over `sessions`
narrowed to those ids with an `in` predicate. Both SHALL be issued server-side with the caller's token, and
the `all` state SHALL issue only the session query, so the default path costs exactly one request per
page.

The two ids join without translation: the analytics service sets a session's id to the conversation's
`chat_id` wherever the hop carries one, so a rating's `chat_id` is a `client_session_id` for exactly the
sessions that have ratings. **A session that did not originate in DIAL Chat therefore has no rating and SHALL
NOT be presented as unrated-by-measurement.** Coding-agent traffic submits no rate events, so any state other
than `all` narrows the result to chat-origin sessions as a consequence of the data rather than as a filter on
client type, and the affordance MUST NOT be described as one.

The rating source SHALL be the per-response rollup rather than the raw rate-event log. The rollup partitions
each response's events into additive counts, which is what allows a direction to be selected and counted from
the same columns; the event log carries a single normalized `rate` from which the directions cannot be
separated without one query per direction.

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

The candidate query SHALL be aggregate mode over `response_ratings` grouped by `chat_id`, carry time bounds
over `last_rate_time` matching the period the session query is bounded to, and an empty-id guard, and
select `chat_id` plus `max(last_rate_time)`. It SHALL be ordered by most recent rating, so that if the
candidate set reaches its limit the ids retained are the most recently rated ones. Its limit SHALL NOT exceed
1000, the service's hard maximum.

The rate predicates SHALL be:

| State | Predicate |
|---|---|
| positive | `gt(rate_pos_count, 0)` |
| negative | `gt(rate_zero_count, 0)` OR `gt(rate_neg_count, 0)` |
| rated | `gt(rate_pos_count, 0)` OR `gt(rate_zero_count, 0)` OR `gt(rate_neg_count, 0)` |

These SHALL select exactly what the previous predicates over the event log's normalized `rate` selected, and
the negative state SHALL keep its present meaning: `rate_zero_count` counts the events the service normalized
to zero — a boolean `false` among them — and `rate_neg_count` counts the unambiguously negative ones, so
their union is what `le(rate, 0)` matched. The negative state MUST NOT be narrowed to the provably negative
subset: that would silently drop every non-positive rating whose submitted form predates the service's
captured-form column, which is most of the recorded history, and a filter that quietly stops returning rows
it used to return is a worse failure than a figure that needs a caveat.

`rated` SHALL be the union of the three value-bearing counts rather than an `IS NOT NULL` test. The rollup
partitions a response's events into positive, zero, negative and value-less counts, so those three cover
every event that carried a rating and exclude only an event whose body carried no rate at all — which is what
the previous null comparison excluded. The rule that `rated` must not be expressed as a union of the other two
states no longer applies: it existed because a rating outside the positive/negative split could not be
detected, and the rollup's partition leaves nothing outside it.

When the candidate query returns no ids the page SHALL return no rows **without** issuing the conversation
query: the service rejects an empty `in` list with HTTP 400, and "nothing carries this feedback" is already
the complete answer. Blank ids SHALL be dropped from the candidate set. When the candidate query fails, the
failure SHALL propagate and the session query MUST NOT run.

The page MUST NOT fall back to the raw rate-event log when the rollup is absent. The rollup is provisioned
per instance exactly as the conversation and turn rollups are, and the page cannot render without those
either, so an absent rating rollup SHALL surface as the read failing rather than as a second rating path
maintained beside the first.

#### Scenario: Feedback filter issues the candidate query then the narrowed query

- **WHEN** a feedback state other than all is selected
- **THEN** a query against `response_ratings` is issued first, carrying the state's rate predicate
- **AND** a query against `sessions` follows, restricted to the returned ids by an `in` predicate
- **AND** both carry the caller's token

#### Scenario: The first page costs one request, not two

- **WHEN** a feedback state other than all is selected and the first page of the result is fetched
- **THEN** the client issues exactly one request for that page
- **AND** the candidate ids are returned to the client with it

#### Scenario: Later pages reuse the ids without re-resolving them

- **WHEN** the operator scrolls to a further page of a feedback-filtered result
- **THEN** no further query against `response_ratings` is issued
- **AND** the page request carries the candidate ids the first page returned

#### Scenario: The default state costs one query per page

- **WHEN** the feedback filter is in its all state
- **THEN** only the session query is issued and it carries no `in` predicate

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
- **AND** the session query is not issued

#### Scenario: The candidate query fails

- **WHEN** the candidate query returns a failure
- **THEN** that failure is returned and the session query is not issued

#### Scenario: Negative feedback includes a zero rating

- **WHEN** the negative state is selected
- **THEN** its predicate matches a conversation whose only rating was normalized to zero, alongside one
  carrying an unambiguously negative rating
- **AND** it selects the same conversations the previous non-positive predicate selected

#### Scenario: Rated covers both thumbs

- **WHEN** the rated state is selected
- **THEN** its predicate matches every conversation the two thumb states match
- **AND** it does not match a conversation whose only rate event carried no rating value

#### Scenario: Feedback composes with the other filters

- **WHEN** a feedback state is selected while a search term and a time range are applied
- **THEN** the narrowed session query still carries the search predicates and the time bounds

#### Scenario: An agent session falls outside every feedback state but all

- **WHEN** a coding-agent session is in the period and the rated state is selected
- **THEN** the session is absent from the result, its id having carried no rating
- **AND** the affordance does not describe itself as filtering by client

#### Scenario: An instance without the rating rollup reports a failed read

- **WHEN** a feedback state is selected on an instance that does not carry `response_ratings`
- **THEN** the read fails and the failure is reported
- **AND** no query against a raw rate-event log is issued as a substitute

### Requirement: Rating column resolved for the displayed page

The grid SHALL show a Rating column giving each conversation's positive and negative rating counts, attributed
in the provenance band to `response_ratings` rather than to `sessions`.

A session with no rating SHALL render the same unavailable placeholder as a conversation nobody rated. An
agent session can carry no rating at all, so the empty cell SHALL NOT be styled or worded as a defect, and
the column MUST NOT be hidden for such a row — a column that disappears per row reads as a rendering fault.

Ratings SHALL be resolved by a query issued **after** the session query, restricted by `in` to exactly the
session ids in the page just returned. Resolving them from the feedback filter's candidate set instead
MUST NOT be done: that set is capped, so a displayed conversation could fall outside it and be reported as
unrated when it is not. The ratings query SHALL be skipped entirely when the returned page has no rows.

The two directions SHALL be resolved by a **single** query. The rating source partitions each response's
events into additive counts, so the directions are separate columns rather than a split to be derived: one
aggregate over `response_ratings` grouped by `chat_id`, restricted by `in` to the page's ids, selecting
`sum(rate_pos_count)` for the positive side and `sum(rate_zero_count)` and `sum(rate_neg_count)` for the
negative one. The previous rule requiring one query per direction SHALL NOT be carried forward: it existed
because the event log's normalized `rate` is a signed integer from which `count` and `sum` cannot recover the
two directions, and additive per-direction columns remove that obstacle entirely.

The negative figure SHALL be the sum of the zero and negative counts, which is what the previous non-positive
predicate counted, so the column's meaning is unchanged. Each side SHALL be counted from the **same** columns
the corresponding feedback filter predicates on, which is what guarantees the column agrees with the filter:
a conversation the Positive filter selected cannot then display a zero positive count, and the same holds for
the negative side.

The same query SHALL also select `sum(rate_bool_false_count)`, `sum(rate_raw_count)` and
`sum(rate_event_count)`. These do not compose either figure: they state how much of the negative one is
provably a thumbs-down, and how much of the conversation's feedback had its submitted form captured at all —
which is a proportion, so the event count is named to give it a denominator. Where part of a negative figure is not established as a thumbs-down, that side SHALL
carry a caveat saying so, and the caveat SHALL be reachable by keyboard and exposed to assistive technology —
the figure is not redefined, it is disclosed. The caveat MUST NOT attribute the whole gap to an uncaptured
form: a rating submitted as a numeric zero **is** captured, and is unestablished because the service has not
fixed what a numeric zero means. Stating only the uncaptured cause would contradict the captured-form
proportion quoted beside it. A cell whose negative figure is fully attributable, and a cell
with no negative ratings, SHALL carry no caveat: a caveat on every cell would stop being read.

The query SHALL carry time bounds over `last_rate_time` matching the period the session query is bounded
to. Bounding them identically keeps the column and the feedback filter consistent. The consequence — a rating
given outside the selected period is not counted — is accepted for that consistency.

Both counts SHALL be displayed at all times, including a zero, so the absence of ratings on one side is visible
rather than implied. A side carrying ratings SHALL be coloured — positive as success, negative as error, from
theme tokens — and a side with none SHALL stay muted. Each side SHALL carry a text label for assistive
technology, since the icons carry the meaning.

When the ratings query fails, both counts SHALL be left unresolved and the cell SHALL render nothing rather
than displaying zeros or a half-counted split, which would assert an absence of feedback that was never
established. The conversation rows themselves SHALL still be returned.

A comment indicator SHALL NOT be shown in the grid cell. The rating source's `comment_count` is catalogued
**non**-sensitive, so the previous reason for withholding it — that the event log's comment column could not
be counted by a caller without the elevated role — no longer holds. It is withheld on a different ground: the
cell is a two-direction figure, a third signal in it is a design question of its own, and the conversation's
comment count is stated on the detail view's feedback panel instead.

#### Scenario: Ratings are resolved for exactly the page returned

- **WHEN** a page of conversations is returned
- **THEN** exactly one `response_ratings` aggregate query follows, restricted by `in` to that page's ids
- **AND** it is not issued at all when the page has no rows

#### Scenario: Both directions come from one query

- **WHEN** the ratings query is built
- **THEN** it selects the positive count and the two columns forming the negative count in one aggregate
- **AND** no second query is issued for the other direction

#### Scenario: Both directions are always shown

- **WHEN** a conversation has positive ratings and no negative ones
- **THEN** the cell shows the positive count coloured and a muted zero for the negative side

#### Scenario: A conversation rated both ways shows both counts

- **WHEN** a conversation carries one like and one dislike
- **THEN** it shows one on each side, each coloured for its own direction

#### Scenario: A zero-normalized rating still counts as negative

- **WHEN** a conversation's only rating was submitted as a boolean false and normalized to zero
- **THEN** its negative count is one
- **AND** the figure matches what the previous non-positive count reported

#### Scenario: An unattributable negative figure carries a caveat

- **WHEN** part of a conversation's negative count comes from events whose submitted form was never captured
- **THEN** the negative side carries a caveat stating that
- **AND** the caveat is reachable by keyboard and exposed to assistive technology

#### Scenario: The caveat names both causes of an unestablished rating

- **WHEN** a conversation's negative figure includes a rating submitted as a numeric zero whose form was
  captured
- **THEN** the caveat states that such a rating is not established as a thumbs-down
- **AND** it does not claim the rating was recorded without its submitted form

#### Scenario: A fully attributable figure carries no caveat

- **WHEN** every event behind a conversation's negative count had its submitted form captured
- **THEN** the negative side carries no caveat

#### Scenario: An unrated conversation is muted, not blank

- **WHEN** a conversation has no ratings in the period
- **THEN** both sides show a muted zero

#### Scenario: A session that can carry no rating renders the ordinary placeholder

- **WHEN** the grid renders a coding-agent session
- **THEN** its Rating cell shows the same unavailable placeholder an unrated conversation shows
- **AND** the column is still present for that row

#### Scenario: A failed ratings lookup shows nothing rather than zero

- **WHEN** the ratings query fails
- **THEN** the conversation rows are still returned
- **AND** their rating cells render nothing, asserting no absence of feedback

### Requirement: Conversation list query over the conversations entity

The system SHALL provide
`buildConversationListQuery({ range, search, chatIds, sort, columnFilters, visibleFields, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `sessions`
in **row mode**. The session rollup is materialized by the analytics service — one row
per `client_session_id`, produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored
columns and MUST NOT group or aggregate.

The select SHALL name **`client_session_id` unconditionally**, and nothing else unconditionally. It is the only field
read outside a cell renderer — the grid keys its rows by it, a row click navigates by it, and the loaded set
is mapped by it — so a row without it is unusable whatever the column state. A sort or a filter needs no
field named here: both are resolved server-side by field name, not from the projected row.

Every other field a column reads SHALL reach the select through the cost classification below, with no
standing exemption for the curated columns. An exemption list would have to be re-audited against the schema
on every change and would not be, and it would defeat the classification exactly where it matters: a curated
field the service later marks `heavy` would go on being named on every page, silently, which is the failure
the heavy class exists to prevent. Three of the curated columns are hidden by default, so the exemption also
fetched and discarded their fields on every page.

A field SHALL be projected according to **what projecting it costs**, in three classes:

- a **cheap field of the entity's own source** SHALL be named whether or not its column is visible. Measured
  on a rollup of 6 328 conversations, twenty such columns instead of two read 2.08 MiB instead of 492 KiB and
  took 7 ms instead of 5 — so gating them would buy nothing and would add a re-fetch to every reveal;
- a field of the entity's own source that the service marks **`heavy`** SHALL be named only while its column
  is visible. The service omits such a field from a wildcard projection because it is expensive to transfer,
  and the measurement bears that out: adding the one heavy field to ten scalar columns took the read from
  1.44 MiB to 5.39 MiB — 2.7× the other ten together;
- a field the service reports under an **enrichment namespace** — a name qualified by the enrichment that
  supplies it, `session_insights.` being the one the `sessions` entity exposes today — SHALL be named only
  while that field's column is visible. The service joins an enrichment only
  when a query names one of its columns, so naming one unconditionally would add that join to every page of
  every scroll, for columns the operator has not asked for.

The classes SHALL be decided by what the schema reports — the qualified name for an enrichment, the `heavy`
flag for a heavy field — rather than by a list of field names held in the frontend, so a field the service
newly marks heavy, or an enrichment newly added to the entity, is classified without a code change.

All three rules SHALL apply to a **curated** column's field as well as a derived one's, with no exemption
beyond `client_session_id`. A curated column is
designed rather than derived, but it still reads a stored field, so a projection that skipped it would render
an empty cell for data the row does carry, and it is classified by the same test. The identity column's
enrichment field is the one exception and SHALL be named unconditionally: that column cannot be hidden, so
there is no hidden state for a visibility rule to key on.

It MUST NOT name every field the entity carries: the field set is whatever the service reports and can grow,
and a field no column reads is one nothing renders. A column with no field behind it — Rating is composed
from `rate_analytics` lookups — MUST NOT be named at all, since the entity has no such column.

Making a hidden **enrichment-backed** or **heavy** column visible SHALL restart paging, because the fetched
pages do not carry that field and a column rendered from an absent value would read as empty data rather than
as data not fetched. Making a hidden **cheap source-backed** column visible SHALL NOT re-query: its field is
already in every fetched page, so the rows already held render it. Hiding a visible column SHALL NOT re-query
in any case: the rows already held remain a correct answer to a narrower projection. The whole-result count
and cost SHALL be unaffected by which columns are visible, being aggregates over the filtered result rather
than over the projection.

`turn_count` is the pipeline's count of the conversation's **distinct trace ids**, one trace per request, so
it is a count of turns and not of usage-log rows: the embedding, MCP and routing hops a request fans out
into collapse into the trace that produced them. Turn, request and trace therefore name one quantity, and
user-facing copy SHALL call it **turns** throughout — a second name for the same figure reads as a second
figure. Copy MUST NOT claim it counts individual hops.

The filter SHALL be `and[ ge(last_request_time, startMs), le(last_request_time, endMs) ]`. The time bounds
SHALL apply to `last_request_time`, so a selected period means *conversations whose last activity falls in the
period*. The query MUST NOT carry an empty-`client_session_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

The projection SHALL NOT be what scales with data volume, and this requirement SHALL NOT be read as a
performance control. Measured across every projection variant above, the rows read stayed identical at 7 760
— the whole table — because the list query orders by `last_request_time` under no narrowing filter. The
ordering is what grows with the data; the column list does not.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates matching `client_session_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only term
SHALL add no predicate at all rather than an `ico` against the empty string, which would match every row at
the cost of a scan. Both targets are base columns of the entity, so no select-alias restriction applies.

Search SHALL NOT reach the conversation title either: the title is an enrichment column, absent for any
conversation the evaluator has not processed, so a term matched against it would silently narrow the result to
enriched conversations only.

Search MUST NOT reach message content: no column of `sessions` carries it, and the only column that
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. Search
SHALL NOT reach `user_hash` either: selecting the column for display does not make a surrogate a useful
free-text target, and a partial-match predicate over it would cost a scan for a value operators paste whole —
the user column's own filter is the exact-value input for it. The search affordance SHALL name only the fields
search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(client_session_id, chatIds)`, which is how the
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

The sort SHALL be the caller's sort keys, if any, followed by `{ client_session_id, asc }`; with no caller sort keys it
SHALL be `[{ last_request_time, desc }, { client_session_id, asc }]`. The trailing `client_session_id asc` tiebreaker is required
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

The query SHALL reference no column absent from the entity's role-visible schema; `sessions` exposes no
`sensitive` column, so every selected field is visible to a read-only admin. `user_hash` is catalogued
non-sensitive — the analytics service exposes it as a de-identified surrogate — so selecting, sorting or
filtering on it requires no elevated role.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `sessions` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `client_session_id`, `project_id`, `user_hash`, `turn_count`, `total_tokens`, `total_price`,
  `last_request_time`, `first_request_time` and `deployments`

#### Scenario: The query requests no result total

- **WHEN** the query is built for the first page, and again for a later page
- **THEN** each carries `include_total: false`

#### Scenario: Only row identity is named unconditionally

- **WHEN** the query is built with a classified set of source fields
- **THEN** the select names `client_session_id`
- **AND** it names no curated column's field that the classification did not carry
- **AND** `client_session_id` is named once, even where the classification carries it too

#### Scenario: Without a schema the base rollup columns are still named

- **WHEN** the query is built with no classified fields at all, the schema having failed to load
- **THEN** the select names the base rollup columns the curated set renders
- **AND** those columns render values rather than empty cells

#### Scenario: Source-owned fields are projected whether or not their columns are visible

- **WHEN** the query is built while every derived column is hidden
- **THEN** its select names each cheap field of the entity's own source
- **AND** it names no field reported under an enrichment namespace
- **AND** it names no field the service marks heavy

#### Scenario: A heavy source field is projected only while its column is visible

- **WHEN** the query is built with a heavy-field column hidden, and again with it visible
- **THEN** the first select does not name that field
- **AND** the second does

#### Scenario: Revealing a heavy column restarts paging

- **WHEN** the operator makes a hidden heavy-field column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field
- **AND** the column renders values rather than empty cells

#### Scenario: Time bounds apply to last activity as epoch-millisecond literals

- **WHEN** the query is built for a range
- **THEN** the filter contains a `ge` and an `le` predicate on `last_request_time`
- **AND** each carries `value_type: 'timestamp'` with the bound's epoch-millisecond count as a string

#### Scenario: No empty-id guard is emitted

- **WHEN** the query is built
- **THEN** the filter carries no comparison on `client_session_id` against the empty string

#### Scenario: A search term becomes an OR of contains predicates

- **WHEN** the query is built with a search term
- **THEN** the filter carries one additional `or` group of exactly two `ico` predicates
- **AND** they match `client_session_id` and `project_id`, each against the trimmed term
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
- **THEN** the sort is that key followed by `client_session_id` ascending
- **AND** the caller's key carries a nulls-last ordering

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built with no caller sort keys
- **THEN** the sort is `last_request_time` descending followed by `client_session_id` ascending
- **AND** `client_session_id` ascending is the final sort entry

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

- **WHEN** the operator makes a hidden cheap source-backed column visible after scrolling
- **THEN** no new request is issued and the rows already loaded render that column's values

#### Scenario: A curated hidden column is projected once it is shown

- **WHEN** the operator makes the Topics column visible
- **THEN** the next request's select names `session_insights.topics`
- **AND** the cells render that field's values rather than empty cells

#### Scenario: The identity column's enrichment field is projected with no column of its own

- **WHEN** the list query is built with every optional column hidden
- **THEN** the select still names `session_insights.title`
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

### Requirement: Conversation detail route, access guard, and not-found handling

The system SHALL provide a per-session detail view at `/<lang>/conversations-trace/<client_session_id>`, reached
by opening a row of the conversations log. The conversation id SHALL be carried in the path and MUST be
URL-encoded, since real ids are not opaque short tokens — they reach hundreds of characters and some contain
path separators and percent-encoded text.

The route SHALL apply the same analytics access guard as the conversations log and SHALL render the shared
forbidden view when access is denied, so the detail view cannot become a way around the gate.

The access guard SHALL resolve to "not forbidden" when the analytics service cannot be reached, rather than
rejecting. Callers await the guard before their own error handling, so a rejection escapes the page and
replaces the application shell instead of that page's load-error state.

When no conversation exists for the requested id the route SHALL render the application's not-found view.
An unknown id MUST NOT render an empty detail page, because every value on it would then read as unavailable
and the page would be indistinguishable from a conversation whose data is genuinely missing.

Returning to the conversations log is the application navigation's responsibility. The detail view MUST NOT
own a back control, so there is one way back rather than two that can disagree.

#### Scenario: Opening a conversation renders its detail view

- **WHEN** a conversation row in the log is opened
- **THEN** the detail view for that conversation renders
- **AND** the address carries the conversation id, URL-encoded

#### Scenario: A conversation id containing path separators survives the round trip

- **WHEN** a conversation whose id contains `/` or percent-encoded characters is opened
- **THEN** the detail view resolves that exact conversation

#### Scenario: Access is denied

- **WHEN** the analytics access guard denies access
- **THEN** the forbidden view renders instead of the detail view

#### Scenario: Unknown conversation id

- **WHEN** the requested conversation id matches no conversation
- **THEN** the not-found view renders

#### Scenario: The analytics service is unreachable

- **WHEN** the access guard's request to the analytics service fails to connect
- **THEN** the guard resolves to "not forbidden" and the route renders its own load-error state
- **AND** the application shell is not replaced by an error page

### Requirement: Single-conversation query over the conversations entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `sessions` in
**row mode**, narrowed to exactly one `client_session_id` by equality, requesting a single row.

The query SHALL select every stored column of the session rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the available field names from the caller rather than enumerating a field list of its
own, per "A conversation query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The insight enrichment's **descriptive** fields SHALL all be named where the schema reports them, not a
subset of them: the session's title, its summary, its sentiment, its topic and
topics, its language and its resolution status. A descriptive insight field the query does not name is a
field the detail view cannot render at all, and the reader has no way to tell that from a conversation the
evaluator never reached. The enrichment's `provenance`-tagged fields are not covered by this rule — they
are the evaluation's own bookkeeping, and the detail view reads none of them.

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

- **WHEN** the single-session query is built for a conversation id
- **THEN** it queries the `sessions` entity in row mode
- **AND** it filters on that id by equality and requests one row

#### Scenario: The heavy trace column is named explicitly

- **WHEN** the single-session query is built
- **THEN** its select names `traces`
- **AND** the projection is explicit rather than a default or wildcard projection

#### Scenario: The insight columns are selected

- **WHEN** the single-session query is built and the schema reports the insight columns
- **THEN** its select names `session_insights.title`
- **AND** it names the summary, sentiment, topic, topics, language, resolution status, activity type and activity sub-task type
- **AND** it names no `provenance`-tagged bookkeeping field of the enrichment

#### Scenario: A descriptive insight field the schema omits is not named

- **WHEN** the schema reports the insight enrichment but does not report its resolution status
- **THEN** the select names the descriptive insight fields the schema does report
- **AND** it does not name `session_insights.resolution_status`
- **AND** the query returns a row

#### Scenario: An instance without the enrichment still resolves a conversation

- **WHEN** the single-session query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the conversation's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-session query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A conversation outside the log's period still resolves

- **WHEN** a conversation whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that conversation's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-session query is built
- **THEN** its selected columns include no column the analytics service marks sensitive

### Requirement: A conversation query names only fields the entity's schema reports

The analytics service rejects a query that names a field its entity does not carry, and it rejects the
**whole query** rather than returning the columns it does have. A projection is therefore all-or-nothing:
one field the deployment lacks yields no rows at all, so a page that hardcodes its field list fails
entirely instead of rendering with one column empty.

The entity's fields are not fixed across deployments. The session rollup, the turn rollup and the
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
- **THEN** the select does not name `session_insights.title`
- **AND** it names every required field
- **AND** the query returns rows

#### Scenario: An optional field the schema reports is named

- **WHEN** the schema reports the conversation title
- **THEN** the select names `session_insights.title`

#### Scenario: A failed schema fetch falls back to the required fields

- **WHEN** the entity schema cannot be fetched
- **THEN** the query names the required fields only
- **AND** it names no optional field

#### Scenario: One lagging field does not cost the whole view

- **WHEN** the instance carries the session rollup but not the insight enrichment
- **THEN** the conversations list renders its rows
- **AND** the detail view renders its header, panels and figures

#### Scenario: The detail route reads the schema server-side

- **WHEN** the conversation detail route renders
- **THEN** it fetches the `sessions` entity schema on the server
- **AND** the single-session query is built from the fields that schema reports
- **AND** the feedback and turn reads are issued without waiting for it

### Requirement: The trace listing is resolved by three queries whose scopes are one invariant

The listing SHALL be resolved over the live hop log by three queries, and by no rollup. A rollup is refreshed
periodically while the hop log is written live, and the listing's correctness now depends on rows a
session-id-scoped rollup omits.

**The paging query** SHALL group the hop log by trace, filtered by the session id, the
conversation's project, and a padded day range. It SHALL return exactly three things: the trace ids of the
page, each trace's earliest recorded time as the ordering key, and each trace's latest recorded time. It MUST
NOT return figures — nothing consumes them, and a figure resolved under a session-id filter is the defect this
change removes.

**The root query** SHALL return **every** root span of the page's traces, located by trace id, and MUST NOT be
filtered by session id. It SHALL project only cheap columns: the trace and span ids, the recorded time, the
operation duration, the success flag and response status, the token total, the chain price and the call's own
price, the session id, the request endpoint, the event kind, the request message count, the deployment, and the
**project id**.

The project id SHALL appear in the root query's **projection** and MUST NOT appear in its **filter**. The
Core-internal marker is a comparison against the conversation's project, so the value has to be read; filtering
on it would drop the very rows the marker exists to identify. One name, required in one clause and forbidden in
the other, is where a reader tidying this query will go wrong, so the distinction SHALL be stated where the
query is built.

**The figures query** SHALL group the page's traces by trace and event kind, and MUST NOT be filtered by chat
id. It SHALL yield each trace's span count, token total, price total, its per-kind breakdown for the chips,
its failed-hop count, and the set of response ids the trace recorded.

**The root query and the figures query SHALL be scoped identically** — the page's trace ids and the same
padded window, with no session id and no project — differing only in the root-span predicate and in reading rows
rather than groups. This SHALL be verified as **one** invariant rather than as two filter lists compared by
eye. Divergence between these two scopes is the mechanism that produced every arithmetic correction this
design removes: when the figures cover rows the roots do not, a trace's totals stop reconciling with its cards
and the gap has to be patched field by field.

**Dropping the chat id from the figures query is what makes the figures correct without correction.** Scoped
by trace, the span count, tokens and price are simply the trace's own. There SHALL be no compensating
adjustment — no increment to a span count, no addition of a root's value to a sum — because there is nothing
left to compensate for.

**The figures query has a second call site, and the invariant SHALL hold at both.** The transcript states each
answer's own figures, so the Chat view SHALL resolve figures for the traces **its own transcript covers**,
scoped by those trace ids and a window padded from their own earliest and latest recorded times, with no chat
id and no project. It MUST NOT read them from whatever the listing happens to have paged in: the listing loads
a page at a time, so a message whose trace lies beyond the loaded pages would lose its figures, and which
messages were complete would depend on how far the reader had scrolled a different view. Each view SHALL fetch
what it displays; overlapping reads between the two are acceptable and SHALL NOT be avoided by sharing state
between them.

A narrower filter at that second call site reintroduces every correction this design removes, inside the Chat
view instead of the listing. The scope invariant SHALL therefore be asserted for both call sites, not only for
the listing's.

**The conversation's project SHALL filter the paging query and MUST NOT filter the other two.** It is
admissible on the paging query only because that query is already restricted to rows carrying the session id, and
a trace's session-id-carrying rows are single-project. On the other two it is destructive: a trace's
Core-internal calls are recorded under Core's own project while the client's rows carry the conversation's, so
filtering by the conversation's project deletes exactly the cards and the rows this design added. That
deletion is silent — the figures query would still count what the root query dropped — so the reason SHALL be
recorded where the queries are built, not only in this spec.

No query in the listing path SHALL name a request body or a response body column. Bodies are heavy, and
naming one makes the listing as slow as a transcript read.

The listing MUST NOT be gated on a schema probe of its own: it names no optional field.

#### Scenario: The figures query carries no conversation filter

- **WHEN** the listing's figures are requested for a page of traces
- **THEN** the query's filter names the page's trace ids and the padded window
- **AND** it names neither the session id nor the project

#### Scenario: The paging query carries the project and the chat id

- **WHEN** a page of traces is requested
- **THEN** the query's filter names the session id, its project, and the padded day range

#### Scenario: The root query and the figures query agree on scope

- **WHEN** both queries are built for the same page
- **THEN** their filters are equal but for the root-span predicate
- **AND** that equality is asserted as one property rather than as two enumerated filter lists

#### Scenario: A trace's totals reconcile with its cards without adjustment

- **WHEN** a trace records a client root, three children and a Core-internal root
- **THEN** the trace's span count is five
- **AND** no increment is applied to it for a root missing from the conversation's row set

#### Scenario: No listing query reads a body column

- **WHEN** any of the three queries is built
- **THEN** it names neither a request body nor a response body column

#### Scenario: The root query projects the project id but does not filter on it

- **WHEN** the root query is built
- **THEN** its projection names the project id
- **AND** its filter does not

#### Scenario: The Chat view resolves figures for its own transcript's traces

- **WHEN** the transcript resolves and covers traces beyond those the listing has paged in
- **THEN** figures are requested for the transcript's own trace ids
- **AND** every answer states its trace's figures regardless of how far the listing has been scrolled

#### Scenario: The second call site is held to the same scope invariant

- **WHEN** the figures query is built for the transcript's traces
- **THEN** its filter names those trace ids and a padded window derived from them
- **AND** it names neither the session id nor the project

### Requirement: Conversation detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: the conversation's insights, token
and cost usage, feedback, and record metadata. Each panel SHALL carry an icon coloured by its source, so the
panels are distinguishable at a glance rather than by reading their headings.

Each panel SHALL name the entity it reads from, and MUST NOT overstate it. **Every** panel SHALL have a real
source: the view MUST NOT present a panel no queried entity populates, because a panel of nothing but
unavailable markers states a shape the system does not record.

A panel MUST NOT name an enrichment as its source. The analytics service exposes an enrichment's columns as
columns of the entity they enrich, and the view queries the entity — so a panel that reads an
enrichment-derived field still reads `sessions`, and naming the enrichment would present an internal
composition of the entity as a separate thing the view queried.

This is one half of a rule the whole feature follows, and the two halves SHALL NOT be conflated:

- A **catalog identifier**, rendered in monospace, claims **the entity the page queried**. It SHALL name
  `sessions` or the entity the conversation's ratings are read from, and SHALL NEVER name an
  enrichment — in a panel's source, in a page header's provenance line, or anywhere else an identifier
  appears. It is stated as the entity's role rather than as a fixed name so that the rule does not have to
  be restated when the rating source changes.
- A **readable origin label** claims **where a value came from**, which is a different question and decides
  whether an empty cell means "not recorded" or "not yet evaluated". It SHALL distinguish an enrichment from
  the rollup it decorates.

Where both registers describe the same origin they SHALL carry the same provenance colour, so an identifier
and a label for one source cannot appear to disagree. Where they describe **different** origins — a panel
reading an enrichment through the entity that exposes it — the two registers SHALL be free to differ: the
panel's identifier states the entity queried while its colour states the enrichment the values came from.
A panel's identifier and its colour are therefore two independent claims, and the view MUST NOT derive one
from the other. Deriving the colour from the identifier would paint an enrichment-sourced panel as the
rollup, which is the mis-attribution the two registers exist to prevent.

The **insights panel** SHALL present the conversation's insight enrichment: its summary, its sentiment, its
resolution status, its topic and topics, and its language. It SHALL take the **insight** provenance colour
and SHALL name `sessions` as its source, per the rule above. It MUST NOT restate the conversation's
title, which is the view's heading.

The insights panel SHALL render **only where the conversation carries an insight row**. Where it does not,
the view SHALL state in the panel's place, in text, that the conversation has not been evaluated — and MUST
NOT render the panel with its fields marked unavailable. The enrichment runs per conversation and reaches a
minority of them, so a panel of unavailable markers would be the common case rather than the exception, and
it would state a shape the record does not have. The statement SHALL distinguish *not yet evaluated* from
*this instance carries no insight enrichment at all*: the first is a conversation the evaluator has not
reached, the second is a capability the deployment does not have, and a reader cannot act on the two the
same way.

The panel's summary SHALL render as prose rather than as a label-and-value row: it is two or three sentences
describing what happened, and a value slot sized for a figure would truncate it. The two fields whose values
form a closed vocabulary — sentiment and resolution status — SHALL render as badges, so the reader can scan
them rather than read them, and SHALL render their values as readable words rather than as the raw
underscored token the evaluator emits. A value the frontend holds no styling for SHALL render as a neutral
badge carrying that value's text, never dropped and never styled as though it were a recognised one: the
evaluator's vocabulary is declared on the service side and can gain a value without a frontend release.

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

- **WHEN** the detail view renders a conversation carrying an insight row
- **THEN** the insights, usage, feedback and metadata panels render
- **AND** each names the entity it reads from

#### Scenario: The usage panel reports real values

- **WHEN** a conversation has recorded token usage and cost
- **THEN** the usage panel states its prompt tokens, completion tokens, total tokens and total cost

#### Scenario: No panel is populated entirely by unavailable markers

- **WHEN** the detail view renders
- **THEN** every panel it renders has a real source entity

#### Scenario: The insights panel states the evaluator's reading

- **WHEN** a conversation carries an insight row
- **THEN** the insights panel states its summary, sentiment, resolution status, topic, topics and language
- **AND** it does not restate the conversation's title

#### Scenario: An unevaluated conversation gets a statement, not a panel of dashes

- **WHEN** the detail view renders a conversation the insight enrichment carries no row for
- **THEN** no insights panel renders
- **AND** the view states in text that the conversation has not been evaluated
- **AND** no insight field renders as an unavailable marker

#### Scenario: An instance without the enrichment says so distinctly

- **WHEN** the detail view renders on an instance whose schema reports no insight column
- **THEN** the view's statement distinguishes an absent enrichment from an unevaluated conversation

#### Scenario: A closed-vocabulary value renders as a readable badge

- **WHEN** the insights panel renders a resolution status of `partially_resolved`
- **THEN** it renders as a badge reading readable words rather than the underscored token

#### Scenario: An unrecognised vocabulary value still renders

- **WHEN** the insights panel renders a sentiment value the frontend holds no styling for
- **THEN** a neutral badge carrying that value's text renders
- **AND** the value is neither dropped nor styled as a recognised one

#### Scenario: The insights panel is coloured by the enrichment and identified by the entity

- **WHEN** the insights panel renders
- **THEN** its monospace source identifier names `sessions`
- **AND** its icon carries the insight provenance colour rather than the rollup's

#### Scenario: A duration figure carries a keyboard-reachable caveat

- **WHEN** the usage panel renders a conversation's duration and average duration
- **THEN** each figure carries a caveat explaining what its value actually measures
- **AND** each caveat is reachable by keyboard and exposed to assistive technology
- **AND** neither figure is described as elapsed time

#### Scenario: An identifier never names an enrichment

- **WHEN** the detail view's panels and the log's provenance line render for an instance carrying the insight
  enrichment
- **THEN** every monospace catalog identifier names only an entity the page queries
- **AND** none of them names `session_insights`

#### Scenario: No panel claims an enrichment

- **WHEN** the metadata panel renders a field the conversation-insight enrichment supplies
- **THEN** the panel still names `sessions` as its source
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
result. That is the case exactly when the column is backed by a stored field of the `sessions` entity,
because the control then becomes part of the query. Sorting and filtering SHALL therefore be resolved by the
backend, and the grid MUST NOT narrow or reorder the pages it already holds: those pages are a slice of the
result, so narrowing them client-side would report a slice as the complete answer.

| Column | Sort | Filter |
|---|---|---|
| conversation (`client_session_id`) | yes | text |
| project (`project_id`) | yes | text |
| user (`user_hash`) | yes | text |
| turns (`turn_count`) | yes | number |
| activity (`last_request_time`) | yes | none |
| tokens (`total_tokens`) | yes | number |
| cost (`total_price`) | yes | number |
| deployments (`deployments`) | no | no |
| topics (`session_insights.topics`) | no | text |
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

The Rating column SHALL offer neither. It is composed from rating-source lookups resolved for the page
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
  `sessions`, and the Rating column to `response_ratings`

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

### Requirement: Conversation grid columns are the curated set plus every field the entity schema reports

The conversations grid SHALL offer, in addition to its curated columns, one column per field the fetched
`sessions` entity schema reports. The offered set SHALL follow the instance rather than a list held in
the frontend, and the number of columns MUST NOT be fixed anywhere in the frontend: one instance reports 39
fields (25 from the rollup, 14 from `session_insights`), another carrying a further enrichment reports
more, and the difference between them is the reason the schema is read rather than a list maintained.

The curated columns SHALL keep their designed cells, headers and defaults and SHALL NOT be re-derived. They
are Conversation, Project, User, Turns, Activity, Tokens, Cost, Deployments, Topics and Rating.

A derived column SHALL take:

- its header from the field's `display_name` where the schema reports one, and otherwise from the field's
  `name` rendered readably — separators replaced by spaces and the first word capitalized, with an
  enrichment prefix stripped first, so `avg_duration_ms` reads "Avg duration ms" and
  `session_insights.activity_sub_task_type` reads "Activity sub task type". `display_name` is reported for some
  fields and not others on the same instance, and for none at all on some instances, so both paths are
  ordinary rather than exceptional. A raw catalog identifier SHALL NOT be presented as a header;
- its tooltip from the field's `description`, **verbatim**. The descriptions are authoritative and several
  contradict what the column looks like — `duration_ms` counts a chained turn's nested hops more than once
  and so exceeds the conversation's elapsed time, and `chain_price_total` is NULL wherever no turn carries a
  chain-starting hop with a chat id, which is a coverage gap and not a zero. The frontend SHALL NOT
  paraphrase a description into a string of its own, because a paraphrase is a second copy that drifts when
  the service re-words the original;
- its cell formatting and its sort affordance from the field's declared type, on the same terms as any other
  column of that value type elsewhere in the app;
- its filter from the declared type **only where the grid's filter translation carries that filter's model**.
  A derived column of a timestamp or boolean type SHALL offer no filter at all. A date filter reports its
  bounds under names the translation does not read, so the predicate would be dropped and the header would
  show an active filter over an unnarrowed result; a boolean falling through to the text filter would offer
  a contains predicate the query language cannot express over a boolean, and the service rejects a whole
  query for one such predicate — so a filter menu would take the listing down rather than narrow it. Both
  SHALL remain sortable: an ordering is expressible for either, and it is only the predicate that has no
  translation.

A field SHALL NOT be offered as a derived column when:

- the service marks it `sensitive` — selecting it would be rejected for a caller without the required role,
  so the column could never be shown;
- its type is the non-scalar `object` or `array` — a grid cell is not a structured-value viewer, and
  rendering one as text would assert a shape the view does not know;
- a curated column already reads it, including a field a curated column composes without having a column of
  its own. `first_request_time` (composed into Activity) and `session_insights.title` (read by the
  identity column) SHALL NOT additionally appear as columns of their own, which would present the same value
  twice under two names.

A field the service marks `heavy` SHALL NOT be excluded from being offered on that ground alone: `heavy` is a
transfer-cost hint and SHALL govern **projection** rather than offering.

On the current schema no offered field is heavy, so the heavy class is empty — the expected result rather
than a gap. The non-scalar rule is a rule about which fields become **columns**, and carries no implication
for projection: `deployments` is an array, has a designed column, and is projected on every page like any
other cheap field. The one heavy field the entity reports is `traces`, and it is absent from the projection
because **no rendered column reads it**, not because of its type. The class SHALL become non-empty on either
of two events, neither requiring this rule to be revisited: the service marking a scalar field `heavy`, or a
column being designed that reads `traces`.

The default visible set SHALL be exactly the set visible today — Conversation, Project, User, Activity, Cost
and Rating — and every derived column SHALL ship hidden. Grouping constrains column order, so the default
visible **order** SHALL become Conversation, Activity, Project, User, Cost, Rating. The change of order is
accepted deliberately: a group a reader can see is worth more than a preserved column sequence.

Columns SHALL be grouped on the pair of **origin and tag**, at one level, with one group per pair the schema
actually reports:

- the **tag** SHALL supply the group's label, rendered as readable words rather than as the raw kebab-case
  catalog identifier. A tag for which the frontend holds no label SHALL fall back to the raw tag rather than
  causing its columns to be dropped, and a group with no tag at all SHALL be labelled by its origin;
- the **origin** — the rollup, a named enrichment, or the rating source — SHALL supply the group's colour;
- a group of an **enrichment** origin SHALL additionally name that enrichment in the label itself, not in
  the colour alone, and two enrichments the frontend cannot name SHALL form separate groups even where they
  carry the same tag — they share one catch-all origin, so the enrichment is the only thing distinguishing
  them. The columns panel prints a group's label as the caption under each of its columns, so a
  caption reading only "Evaluator run" above a column reading "Model" still leaves the reader to guess whose
  model it is. A group of the rollup SHALL take no such prefix: the rollup is what the grid is a list of, and
  naming the source table there is the mis-attribution this grouping replaced.

Each group SHALL also state its origin's meaning on hover, so a hue is never the only carrier of the
distinction.

Keying on the pair rather than on the tag alone SHALL keep a rollup field and an enrichment field that share
a tag in separate groups. Two origins merged under one tag would attribute an enrichment value to the rollup,
and the two produce different kinds of empty cell — one that cannot happen and one that means not yet
evaluated.

Every column SHALL be attributed to exactly one group, and no column SHALL be left unattributed.

The five fields the schema tags `provenance` are the evaluation's own bookkeeping rather than facts about the
conversation: the evaluator's DIAL deployment, its version, the input's group version, when the row was
computed, and whether the input was truncated. They SHALL be presented only under a group whose label names
them as the evaluator's run, and MUST NOT be presented under a label a reader could take for a property of
the conversation. In particular the field whose reported `display_name` is "Model" — described by the service
as the DIAL deployment that produced the row — MUST NOT appear as a column headed "Model" without that group
above it: read bare, it is indistinguishable from the deployments the conversation actually used, which is
the specific defect that caused schema-derived columns to be withdrawn.

The identity column SHALL NOT be hideable. It is how a reader recognises a row and how a row is opened, so a
grid without it is a table of values belonging to conversations the reader cannot name. It SHALL declare the
rollup as its origin even though it reads the enrichment for its title — a conversation's identity is its id
and the title only labels it — and SHALL state in its own disclosure that the title comes from the insight
enrichment and may describe only part of the conversation. It SHALL state that size cap **once**, for the
column, rather than marking the rows it applies to.

`session_insights.summary` SHALL be offered as a derived column, hidden by default. It is derived text
the service reports as non-sensitive, like the title the identity column already shows. This is recorded as a
decision and not an oversight: the request and response bodies it was derived from are marked `sensitive` and
`heavy`, are encrypted at rest and carry an explicit gating instruction, and none of that propagates through
an enrichment — so the flags on the derived field cannot be read as evidence that the derivation is
uninteresting, only that the service does not gate it.

The two fields whose values form a closed vocabulary — an insight's sentiment and its resolution status —
SHALL be offered as derived columns of their reported string type, with the string operators the query
language already expresses. The frontend SHALL NOT hold a copy of the evaluator's enumeration in order to
offer a value-list filter for them: that vocabulary is declared in the evaluator's response schema on the
service side and would drift silently whenever the evaluator is re-versioned.

A curated column whose field the entity schema does not report SHALL NOT be rendered at all — neither shown
nor offered as hideable — because the query cannot name the field and the cells could never fill. Rating is
the exception and SHALL render unconditionally: it reads no field of this entity, so no schema will ever
report it, and it SHALL remain outside the derived set, not offered, hidden or reordered as a field-backed
column is.

An enrichment field's exposed name is a qualified flat name containing a dot. The grid SHALL read such a field
by that whole name and MUST NOT interpret the dot as a path into a nested value: the row carries the name as a
single key, so a path interpretation finds nothing and renders an empty cell for a field the row does carry.

No column SHALL be offered for a request or response body, because the entity reports no such field. Those
are columns of `dial_usage_log`, a different entity; the listing queries `sessions`. The frontend SHALL
state this where columns are derived and SHALL NOT carry a filter against those names, which would imply the
schema could report them.

When the entity schema cannot be fetched the grid SHALL render the curated columns that need no optional
field, SHALL offer no derived column, and SHALL report that the additional columns could not be read.

A stored column choice recorded against a smaller column set SHALL leave a column it does not name at that
column's coded default, so columns introduced by this change arrive hidden for an operator who already has a
stored choice.

#### Scenario: The offered columns come from the schema, not from a fixed list

- **WHEN** the grid loads against an instance whose schema reports fields beyond those the curated columns read
- **THEN** each such field is offered as a column
- **AND** the offered count follows the schema rather than a number held in the frontend
- **AND** an instance reporting a further enrichment offers that enrichment's fields too, with no code change

#### Scenario: The default visible set is unchanged and derived columns ship hidden

- **WHEN** the grid loads with no stored column choice
- **THEN** the Conversation, Project, User, Activity and Cost columns are visible, together with Rating
- **AND** every derived column is hidden
- **AND** the visible order is Conversation, Activity, Project, User, Cost, Rating

#### Scenario: A group is named by its tag and coloured by its origin

- **WHEN** the grid renders its column groups
- **THEN** each group is labelled in readable words rather than by a raw catalog identifier
- **AND** each group's colour distinguishes the rollup from an enrichment
- **AND** a group of an enrichment origin names that enrichment in its label, while a rollup group does not
- **AND** each group states its origin's meaning on hover
- **AND** the columns of one group are adjacent
- **AND** every column belongs to exactly one group

#### Scenario: A rollup field and an enrichment field sharing a tag stay in separate groups

- **WHEN** the schema reports an enrichment field carrying the same tag as a field of the rollup
- **THEN** the two are placed in different groups
- **AND** neither group attributes an enrichment value to the rollup

#### Scenario: The evaluator's deployment never reads as the conversation's model

- **WHEN** the schema reports `session_insights.model` with the display name "Model"
- **THEN** its column appears only under a group whose label names the evaluator's run
- **AND** the columns panel states that column's origin alongside it
- **AND** no column headed "Model" appears with no such group above it

#### Scenario: A tag the frontend has no label for still yields columns

- **WHEN** the schema reports a field carrying a tag the frontend holds no label for
- **THEN** the field is still offered as a column
- **AND** its group is labelled with the raw tag rather than dropped

#### Scenario: A field with no display name gets a readable header

- **WHEN** the schema reports `avg_duration_ms` with no display name, and
  `session_insights.activity_sub_task_type` with none either
- **THEN** the first column's header reads "Avg duration ms"
- **AND** the second's reads "Activity sub task type", the enrichment prefix having been stripped
- **AND** neither header is a raw catalog identifier

#### Scenario: A field's description is its tooltip, unparaphrased

- **WHEN** the grid renders the header of a derived column whose field carries a description
- **THEN** the tooltip is that description as the service reported it
- **AND** the duration column's tooltip states that nested hops are counted more than once
- **AND** the chain-cost column's tooltip states that its NULL is a coverage gap, not an accounting difference

#### Scenario: Sensitive and non-scalar fields are not offered

- **WHEN** the schema reports a field marked sensitive, and a field of an object or array type
- **THEN** neither is offered as a column

#### Scenario: A heavy field is not excluded for being heavy

- **WHEN** the schema reports a scalar field marked heavy
- **THEN** it is offered as a column
- **AND** it is hidden by default like any other derived column

#### Scenario: A field a curated column already reads is not offered twice

- **WHEN** the columns are built
- **THEN** `first_request_time` is not offered as a column of its own, being composed into Activity
- **AND** `session_insights.title` is not offered as a column of its own, being read by the identity column
- **AND** `deployments` and `session_insights.topics` are offered only as their curated columns

#### Scenario: The summary is offered, hidden

- **WHEN** the schema reports `session_insights.summary`
- **THEN** it is offered as a column
- **AND** it is hidden by default

#### Scenario: Sentiment and resolution status are offered as string columns

- **WHEN** the schema reports the insight sentiment and resolution status as string fields
- **THEN** each is offered as a column with the string filter operators the query language expresses
- **AND** neither offers a value list drawn from a copy of the evaluator's enumeration held in the frontend

#### Scenario: No body column is offered

- **WHEN** the columns are built from the reported schema
- **THEN** no column is offered for a request or response body
- **AND** no filter names those fields, the schema reporting none

#### Scenario: The identity column cannot be hidden and discloses its title's source

- **WHEN** the operator opens the columns panel
- **THEN** the Conversation column offers no way to hide it
- **AND** every other column can be hidden
- **AND** the column's own disclosure states that its title comes from the insight enrichment and may describe
  only part of the conversation
- **AND** no row carries a separate truncation marker of its own

#### Scenario: A dotted enrichment field is read by its whole name

- **WHEN** a derived enrichment column renders a row carrying that field's qualified name as a key
- **THEN** the cell states that row's value
- **AND** it is not empty

#### Scenario: A curated column whose field is missing is not rendered

- **WHEN** the schema reports no insight fields
- **THEN** the grid renders no Topics column
- **AND** the columns panel offers it nowhere
- **AND** the remaining columns render as they did before it existed

#### Scenario: Rating survives a schema that reports no such field

- **WHEN** the columns are built from a schema reporting no `rating` field
- **THEN** the Rating column renders
- **AND** it is not offered as a derived column

#### Scenario: A failed schema fetch degrades to the curated columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the curated columns that need no optional field render
- **AND** no derived column is offered
- **AND** the view reports that the additional columns could not be read

#### Scenario: A stored choice from the smaller set leaves new columns hidden

- **WHEN** the grid loads for an operator whose stored column choice names only the previously shipped columns
- **THEN** that stored choice is honoured for the columns it names
- **AND** every column it does not name is hidden

#### Scenario: A derived timestamp or boolean column offers no filter

- **WHEN** the schema reports a timestamp field and a boolean field that no curated column reads
- **THEN** each is offered as a column and each offers a sort
- **AND** neither offers a filter control

#### Scenario: Two unnamed enrichments sharing a tag stay apart

- **WHEN** the schema reports fields from two enrichments the frontend has no name for, both carrying the
  same tag
- **THEN** each enrichment's fields form their own group
- **AND** each group is labelled with the enrichment that supplies it

#### Scenario: Sort affordances match what the query can order

- **WHEN** the grid renders its headers
- **THEN** a derived column of a scalar type offers a sort
- **AND** the Rating, Topics and Deployments columns offer none

### Requirement: The transcript is assembled from every entry hop of the conversation

A conversation's **entry hop** is a `dial_usage_log` row attributed to that conversation whose
`core_parent_span_id` is null — what the client sent to DIAL. Where one exists, its request body carries the
user-visible exchange with no system prompt and no internal planning; a child hop carries the machinery
instead, and one sampled child held a 20 461-character system prompt. The transcript SHALL therefore be
assembled from entry hops alone, and MUST NOT read a child hop's body for message text.

The null test SHALL be a null test. The column is null for a root hop and never the empty string (measured:
655 078 null, 0 empty), so a predicate comparing it to an empty string would match nothing.

Where a conversation has entry hops at all, it has at most one per trace id, so its entry hops are its turns.
A conversation MUST NOT be assumed to have one per trace, or any at all: observed conversations carry a full
set of turns in the rollup and no entry hop under their session id, and that case is governed below.

The transcript MUST NOT be taken from a single row. Reading only the newest entry hop's request body is
correct **only** for a client that resends the whole history each turn. A DIAL **application** deployment
keeps conversation state server-side and sends only the new message: one measured 11-turn conversation
reported `1, 3, 1, 1, 1, 1, 1, 1, 3, 5, 5` messages across its entry hops in time order, eight of eleven
turns carrying a single message, while a full-history client on the same instance grew monotonically
247 → 250 → 253 → 255 → 258.

Entry hops SHALL be read in ascending `request_time` order and assembled in that order. For each entry hop,
the messages its request body carries SHALL be appended to the transcript **after dropping the longest
leading run of them that already matches the tail of the assembled transcript**, and the text decoded from
its response body SHALL then be appended as that turn's assistant message. One rule SHALL cover both client
shapes: a full-history client's leading run matches everything already assembled and contributes only its
new message, and an application deployment's single message matches nothing and is appended whole.

**A message whose text was never recorded SHALL match.** Two messages with the same role SHALL be treated as
the same message when either carries no text, because a message this view failed to decode is still that
message. A turn that answered with tool calls alone decodes to no text while the resent copy of that same
message carries no `content` key at all, and comparing the two strictly finds no overlap anywhere in the
history: the match is effectively all-or-nothing, so a single mismatched message re-appends the **whole**
conversation under the later turn — the reader sees their first question twice, and the duplicated answer
carries the later turn's tokens, cost, hops and duration.

Where the newest entry hop demonstrably carries the whole conversation, the implementation MAY fetch that one
row's bodies instead of every row's. **The test SHALL be that every entry hop's message count is exactly
`2k − 1` at its position `k`** — one question and one answer per turn, in order — and not merely that the
newest hop's count reaches `2n − 1`. Where the test does not hold, every entry hop's bodies SHALL be fetched.

This is a cost optimisation and SHALL produce the same transcript as the general rule, **including which turn
each message belongs to**. A single body carries no turn of its own for the messages inside it, so a count
that only reaches `2n − 1` establishes that the content is all present while saying nothing about where one
turn ends and the next begins; attributing those messages by position under that weaker test puts the newest
turn's figures beneath every answer in the conversation. Under the exact test the attribution is arithmetic:
the messages at index `2i` and `2i + 1` belong to turn `i + 1`, and the newest turn's answer comes from the
response body. Where the decoded history is not the length the test promised, the implementation SHALL fall
back to fetching every entry hop's bodies rather than attributing by position.

The entry-hop read SHALL be bounded by the same limit as the turn list, so the transcript and the turn list
cannot disclose different lengths for one conversation. When the bound clips the entry hops, the view SHALL
state both figures together exactly as the turn list already does.

**The entry-hop test MUST NOT be relaxed.** A conversation can record hops under its session id and yet have
no entry hop among them, because the hop that entered DIAL was logged with no session id of its own. This is
not a rare accident: it is a routine outcome for whole classes of deployment, and observed conversations show
it for every one of their turns. In such a conversation the hops that *are* attributed to it are inner
agent-loop calls, and the view MUST NOT take message text from one. Sampled examples carry a system message,
a tool-definition array, and per-turn message counts that grow with the loop rather than with the
conversation. Specifically, the view MUST NOT fall back to a hop whose parent is merely absent from the
result, nor to the earliest hop of each trace, nor to any hop selected by recency or depth: each of those
would render a system prompt and a tool catalogue as though the user had typed them. A conversation with hops
but no entry hop SHALL render the dedicated state that says the transcript cannot be reconstructed.

**Only user and assistant messages belong to the transcript.** A message whose role is neither SHALL be
excluded, and a request body's own system field — where the dialect carries one outside the message list —
SHALL be ignored. The exclusion is by role, applied to every entry hop, and does not depend on the entry-hop
test having already screened the hop: two independent rules protecting one outcome is the point, because the
consequence of a single missed case is a leaked system prompt.

**A message's content is a string or a list of content parts.** Both SHALL be handled; a list SHALL be
reduced to the text of its text-bearing parts, in order. A message that carries no `content` key at all is
not a message with empty content — it is a message whose output went elsewhere, and it SHALL be treated as
such rather than as an empty string.

#### Scenario: Entry hops are selected by a null parent span

- **WHEN** the entry-hop query is built
- **THEN** its filter tests that the parent span column is null
- **AND** it does not compare that column to an empty string

#### Scenario: A server-side-state deployment's transcript is assembled across turns

- **WHEN** a conversation's entry hops each carry only the turn's new message
- **THEN** the transcript contains every turn's user message
- **AND** it is not limited to the messages the newest entry hop carried

#### Scenario: A full-history client's repeated messages appear once

- **WHEN** a conversation's entry hops each resend the whole prior exchange
- **THEN** each message renders exactly once
- **AND** the messages are in the order the entry hops recorded them

#### Scenario: A resent message whose text was never recorded is not repeated

- **WHEN** a full-history client resends a message whose text this view could not decode from its own turn
- **THEN** that message appears once
- **AND** the earlier turn's messages are not repeated under the later turn

#### Scenario: Child hop bodies are never read for message text

- **WHEN** the transcript is assembled
- **THEN** no body of a hop with a non-null parent span is read

#### Scenario: A clipped entry-hop read states its bound

- **WHEN** a conversation records more entry hops than the bound allows
- **THEN** the view states how many of how many turns are shown
- **AND** that disclosure is visible without interaction

#### Scenario: A conversation with hops but no entry hop is not reconstructed from them

- **WHEN** a conversation's hops all record a parent span and none is an entry hop
- **THEN** the view renders the state that says the transcript cannot be reconstructed
- **AND** no message text is taken from any of those hops
- **AND** the Trace view, the header, the panels and the turn list still render

#### Scenario: A system message is never part of the transcript

- **WHEN** an entry hop's request body carries a system message, or a system field outside the message list
- **THEN** neither appears in the transcript
- **AND** only the user and assistant messages render

#### Scenario: Content parts are reduced to their text

- **WHEN** a message's content is a list of content parts rather than a string
- **THEN** the message renders the text of its text-bearing parts in order

### Requirement: Hop bodies are read and decoded server-side and never sent to the browser

Every read and every decode of a `request_body` or `response_body` value SHALL happen on the server, and
only the assembled transcript SHALL be sent to the client. Bodies reach megabytes in a single row — a sampled
response body was 1.4 MB and a 116-turn conversation's newest request body was 405 KB — so shipping them
would move the cost of the page onto the reader's connection and put encrypted-at-rest content into a client
bundle.

Every query reading the hop log SHALL predicate on the session's own identifier. The table carries a
bloom-filter index on `chat_id`, `trace_id` and `core_span_id`, which makes such a read fast; a read
predicated on an attribute instead — `event_kind`, for instance — took over 120 s on a two-core virtual
machine and took the service down with it. A hop-log query MUST NOT be issued without a session predicate.

**Which column carries that predicate SHALL be decided by the session's `client_session_source`, not by one
rule for both populations.** A session whose id came from `chat_id` SHALL be scoped by `chat_id`, keeping the
bloom-filtered fast path for every conversation the view reads today. A session whose id came from a harness
header SHALL be scoped by `usage_client_identity.client_session_id`, because its hops carry an empty
`chat_id` and no other column identifies them. The enrichment column is **not** one of the bloom-filtered
three, so it MUST NOT be substituted for `chat_id` on the chat path merely to have one code path: that would
move every existing read off the index for no gain. The session row the detail view already loads carries
`client_session_source`, so the choice costs no extra query.

The entry-hop read SHALL be split so the expensive columns are named only where needed: a first query naming
no body column establishes the conversation's entry hops, their times, their deployments and their message
counts, and a second names the body columns for the rows the assembly actually requires.

**A body query SHALL additionally be bounded by a range over the recorded times of the exact rows it
fetches.** The hop log is partitioned by the day of `request_time`, and a session predicate alone does not prune
a single partition: a measured body read filtered only by the session id and `trace_id` exceeded the service's
two-gigabyte query budget and was rejected, while the same read with a bounded time predicate returned
immediately. The bound MUST NOT be widened to the conversation's own span — conversations run for weeks, and
one observed conversation spanned 27 daily partitions, enough to exceed the budget again. The first query
already returns each entry hop's `request_time`, so the second SHALL be bounded by the earliest and latest of
exactly the times it is fetching. Where the assembly needs one row, that is one instant and one partition.

**The bound SHALL be expressed as a `>=`/`<=` pair, never as an `in` list of the exact instants.** An `in`
list over a timestamp column compiles to `has([…], request_time)`, a function over the column: the query
planner reports its partition condition as unconditionally true and selects every part, exactly as no
predicate at all does. Only a range prunes. A range matches other entry hops that fall inside the window; the
`trace_id` list is what keeps the result exact, and it is required for correctness rather than for cost,
since it prunes no partition either.

**Those times SHALL be converted to epoch milliseconds.** The query DSL accepts a `timestamp` value only as
milliseconds, while a row carries `request_time` as an ISO-8601 string. Passing a returned value through
verbatim is rejected as an invalid timestamp literal, which fails the whole body read and is indistinguishable
to the reader from a conversation that recorded no bodies. The column has millisecond precision, so the
conversion is lossless.

#### Scenario: The client receives messages, not bodies

- **WHEN** the detail page renders a transcript
- **THEN** the data sent to the browser contains the decoded messages
- **AND** it contains no request or response body value

#### Scenario: Every hop-log query filters by conversation

- **WHEN** any query against the hop log is built for this view
- **THEN** its filter includes an equality predicate on the session id

#### Scenario: A chat-origin session keeps the indexed column

- **WHEN** a hop-log query is built for a session whose `client_session_source` is `chat_id`
- **THEN** the equality predicate names `chat_id`
- **AND** it does not name the identity enrichment's column

#### Scenario: An agent session is scoped by the enrichment column

- **WHEN** a hop-log query is built for a session whose `client_session_source` is a harness header
- **THEN** the equality predicate names the identity enrichment's `client_session_id`
- **AND** the query still carries its time bound

#### Scenario: The cheap read names no body column

- **WHEN** the first entry-hop query is built
- **THEN** it names no body column

#### Scenario: A body query is bounded by the times of the rows it fetches

- **WHEN** the body query is built for a set of entry hops
- **THEN** its filter bounds `request_time` to the earliest and latest recorded time among exactly those rows
- **AND** the bound is not widened to the conversation's own first and last request time

#### Scenario: The bound is a range, not a set of instants

- **WHEN** the body query is built for a set of entry hops
- **THEN** the time bound is a pair of `>=` and `<=` comparisons
- **AND** it is not an `in` list of the individual recorded instants

#### Scenario: A recorded time is converted to epoch milliseconds

- **WHEN** a first-query time is returned as an ISO-8601 string
- **THEN** the value sent as the bound is that instant in epoch milliseconds

### Requirement: An absent transcript is distinguished from a failed one, by cause

A transcript can be absent for three different reasons and can fail for a fourth. All four render no
messages, and the view SHALL distinguish them, because they say different things about the conversation: one
lost its detail to age, one never had detail to lose, one has detail that cannot be attributed to the user,
and one is an outage. Collapsing them would state something false about three conversations out of four.

**Aged out.** `dial_usage_log` and `rate_analytics` retain a row for one year from its request time, while
`sessions`, `turns` and `session_insights` retain theirs indefinitely. The retention is
**row-level**, so a body lives exactly as long as the hop carrying it: a conversation older than a year keeps
its list row, its detail header and its rollup figures, and has no hops left to read. The view SHALL state
that the hop log no longer carries the conversation.

**Not reconstructable.** The conversation has hops, but none of them is an entry hop, so nothing recorded
under it represents what the user sent. The view SHALL state that the transcript cannot be reconstructed from
what was logged, and MUST NOT state that no messages were recorded — messages were recorded; they cannot be
attributed. This state exists precisely so that the view never has a reason to reach for an inner hop's body.

This is also the state for entry hops that **were** read and yielded no message: rows exist and no transcript
could be built from them, which is what this state says. Reporting that combination as an available transcript
of nothing renders it through the nothing-recorded presentation, which is the mislabel this state was added to
prevent. On the dev instance this is not an edge case — of 228 conversations with hops in one recent two-day
window, 112 had no entry hop, every one of them agent-SDK or benchmark traffic whose bodies open with a 6.6 KB
system prompt rather than anything a person typed. Widening the entry-hop rule to admit an orphaned hop would
put that system prompt where the user's first question belongs.

**Nothing recorded.** The conversation is within the retention window and has no hops at all.

**Failed.** A query or the schema read failed. The view SHALL state that the transcript could not be loaded.

None of the first three SHALL render as an error — nothing failed in any of them. In all four the header, the
panels, the turn list and every rollup figure SHALL still render, and the Trace view SHALL remain available
wherever hops exist.

#### Scenario: A conversation past retention states its transcript has aged out

- **WHEN** the detail view loads a conversation whose last request is older than the hop log's retention
- **AND** the conversation has no hops
- **THEN** the transcript region states that the hop log no longer carries the conversation
- **AND** no error is reported
- **AND** the header, the panels and the turn list still render

#### Scenario: Entry hops that yield no message state the transcript cannot be reconstructed

- **WHEN** the entry hops are read and none of their bodies yields a message
- **THEN** the transcript region states that the transcript cannot be reconstructed from the log
- **AND** it does not state that the conversation recorded no messages

#### Scenario: A conversation with hops but no entry hop states it cannot be reconstructed

- **WHEN** a conversation records hops and none of them is an entry hop
- **THEN** the transcript region states that the transcript cannot be reconstructed from the log
- **AND** it does not state that no messages were recorded
- **AND** the Trace view remains available for those hops

#### Scenario: A recent conversation with no hops states nothing was recorded

- **WHEN** a conversation within the retention window records no hops at all
- **THEN** the transcript region states that no messages were recorded

#### Scenario: A failed entry-hop query is reported as a failure

- **WHEN** the entry-hop query fails
- **THEN** the transcript region states that the transcript could not be loaded
- **AND** it does not state that the conversation recorded no messages

#### Scenario: The four states are distinguishable

- **WHEN** each of the four causes occurs
- **THEN** the transcript region renders a different statement for each

