## ADDED Requirements

### Requirement: Conversation grid columns are the curated set plus every field the entity schema reports

The conversations grid SHALL offer, in addition to its curated columns, one column per field the fetched
`conversations` entity schema reports. The offered set SHALL follow the instance rather than a list held in
the frontend, and the number of columns MUST NOT be fixed anywhere in the frontend: one instance reports 32
fields (19 from the rollup, 13 from `conversation_insights`), another carrying a further enrichment reports
more, and the difference between them is the reason the schema is read rather than a list maintained.

The curated columns SHALL keep their designed cells, headers and defaults and SHALL NOT be re-derived. They
are Conversation, Project, User, Turns, Activity, Tokens, Cost, Deployments, Topics and Rating.

A derived column SHALL take:

- its header from the field's `display_name` where the schema reports one, and otherwise from the field's
  `name` rendered readably — separators replaced by spaces and the first word capitalized, with an
  enrichment prefix stripped first, so `avg_duration_ms` reads "Avg duration ms" and
  `conversation_insights.sentiment_score` reads "Sentiment score". `display_name` is reported for some
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
  its own. `first_request_time` (composed into Activity) and `conversation_insights.title` (read by the
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

`conversation_insights.summary` SHALL be offered as a derived column, hidden by default. It is derived text
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
are columns of `dial_usage_log`, a different entity; the listing queries `conversations`. The frontend SHALL
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

- **WHEN** the schema reports `conversation_insights.model` with the display name "Model"
- **THEN** its column appears only under a group whose label names the evaluator's run
- **AND** the columns panel states that column's origin alongside it
- **AND** no column headed "Model" appears with no such group above it

#### Scenario: A tag the frontend has no label for still yields columns

- **WHEN** the schema reports a field carrying a tag the frontend holds no label for
- **THEN** the field is still offered as a column
- **AND** its group is labelled with the raw tag rather than dropped

#### Scenario: A field with no display name gets a readable header

- **WHEN** the schema reports `avg_duration_ms` with no display name, and
  `conversation_insights.sentiment_score` with none either
- **THEN** the first column's header reads "Avg duration ms"
- **AND** the second's reads "Sentiment score", the enrichment prefix having been stripped
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
- **AND** `conversation_insights.title` is not offered as a column of its own, being read by the identity column
- **AND** `deployments` and `conversation_insights.topics` are offered only as their curated columns

#### Scenario: The summary is offered, hidden

- **WHEN** the schema reports `conversation_insights.summary`
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

## MODIFIED Requirements

### Requirement: Conversation list query over the conversations entity

The system SHALL provide
`buildConversationListQuery({ range, search, chatIds, sort, columnFilters, visibleFields, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `conversations`
in **row mode**. The conversation rollup is materialized by the analytics service — one row
per `chat_id`, produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored
columns and MUST NOT group or aggregate.

The select SHALL name **`chat_id` unconditionally**, and nothing else unconditionally. It is the only field
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
  supplies it, `conversation_insights.` and `conversation_buckets.` being two the `conversations` entity
  exposes — SHALL be named only while that field's column is visible. The service joins an enrichment only
  when a query names one of its columns, so naming one unconditionally would add that join to every page of
  every scroll, for columns the operator has not asked for.

The classes SHALL be decided by what the schema reports — the qualified name for an enrichment, the `heavy`
flag for a heavy field — rather than by a list of field names held in the frontend, so a field the service
newly marks heavy, or an enrichment newly added to the entity, is classified without a code change.

All three rules SHALL apply to a **curated** column's field as well as a derived one's, with no exemption
beyond `chat_id`. A curated column is
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
period*. The query MUST NOT carry an empty-`chat_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

The projection SHALL NOT be what scales with data volume, and this requirement SHALL NOT be read as a
performance control. Measured across every projection variant above, the rows read stayed identical at 7 760
— the whole table — because the list query orders by `last_request_time` under no narrowing filter. The
ordering is what grows with the data; the column list does not.

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
  `last_request_time`, `first_request_time` and `deployments`

#### Scenario: The query requests no result total

- **WHEN** the query is built for the first page, and again for a later page
- **THEN** each carries `include_total: false`

#### Scenario: Only row identity is named unconditionally

- **WHEN** the query is built with a classified set of source fields
- **THEN** the select names `chat_id`
- **AND** it names no curated column's field that the classification did not carry
- **AND** `chat_id` is named once, even where the classification carries it too

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

- **WHEN** the operator makes a hidden cheap source-backed column visible after scrolling
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

## REMOVED Requirements

### Requirement: Conversation grid columns are a fixed curated set gated by the entity schema

**Reason**: Its central claim — that the set "SHALL be exactly these ten columns" and that the grid "MUST NOT
generate a column from a field's declared type and display name" — is what this change reverses. The defect
that motivated it was one mis-labelled field, `conversation_insights.model`, and the schema's own `tag`
resolves that generically: the five evaluator-bookkeeping fields are all and only those tagged `provenance`,
so they can be grouped under a heading that names them rather than suppressed along with 20 sound fields.

Two of its rulings are reversed knowingly and are unrelated to that defect: that sentiment and resolution
status "SHALL NOT be presented as columns at all", and that the insight fields beyond Topics are not offered.

**Migration**: Replaced by "Conversation grid columns are the curated set plus every field the entity schema
reports", which carries forward every ruling that still holds — the unhideable identity column and its
title disclosure, readable origin names, one origin per column, the whole-name read of a dotted enrichment
field, a curated column dropped where its field is unreported, Rating rendering unconditionally, and the
degraded set on a failed schema fetch.
