# Analytics Conversation Trace Detail

## Purpose

A trace opened in place: the span tree, the selected span's Request/Response/Chat tabs, how each hop states its outcome, and the tiered, schema-gated reading of hop bodies.

## Requirements

### Requirement: A span's Chat states the conversation that span received

The **Chat** tab SHALL render the selected span's own recorded request message list as a conversation, in the
order the request carried it, followed by that span's assembled answer as the trailing turn. It answers what
the conversation looked like **at that hop** — the history a deep hop received carries sub-agent prompts,
tool results and intermediate turns that a conversation-level transcript never shows, and that history is
what makes a failed hop legible.

**Chat SHALL read no source of its own.** It SHALL be rendered from the same request envelope the Request tab
states and the same response the Response tab states — never a third read of a body already fetched for one
of them. Reaching Chat from the Request tab does fetch the response, because the response read is deferred
until a tab that shows it is open; moving between Chat and Response fetches nothing.

**Chat SHALL state the exchange, not the whole history.** A turn qualifies when its role is user or assistant
and it carries text; everything else a hop receives is machinery — a system prompt, a tool result, an
assistant turn that only called a tool — and the Request tab states all of it, in full, with its sizes. With
every message rendered the tab was the Request tab in different clothes: on a nested model call, fifty
messages became fifty bubbles, most of them tool traffic, and the exchange was not findable among them.

**Role alone SHALL NOT decide it.** The messages dialect feeds a tool result back as a **user** message
carrying `tool_result` blocks, so a filter by role would let machinery through wearing the user's role — the
one thing this tab must never do. A message that answers a recorded call SHALL be treated as a result
whatever role it arrived under.

**Every turn SHALL be labelled with its own role and its place in the history**, so a reader can point at one
and find it on the Request tab.

**A turn whose recorded text was clamped SHALL keep the affordance that opens the rest**, reading the one
message in full on demand exactly as the Request tab does. A conversation view that silently truncates is
worse than a list that admits it.

**The trailing answer SHALL be the span's assembled response text**, and SHALL be omitted rather than faked
where the response yields none. Where the response column is withheld from this caller, Chat SHALL still
render the history and SHALL state that the answer is withheld — the history is the substance of the tab and
is gated by its own column.

**The request's tool catalogue SHALL NOT render here either**, and no reasoning summary SHALL be merged into
the answer. Both rules already hold for the tabs Chat is rendered from, and Chat is not a way around them.

**A turn SHALL NOT render the blank lines a recorded body carried at either end of its text.** Content
routinely opens with a newline — a templated prompt is assembled around its variables and the template's own
leading break is part of the string; measured over one hour of model-call hops, 39 of 272 requests carried at
least one message whose content began with one, and 20 of their assembled responses did. Rendered as recorded,
each of those costs a line and a bubble opening on an empty line reads as a rendering fault. Only lines that
are **entirely** blank SHALL be dropped, and only at the two ends: the indentation of the first line that has
content is part of that content, and a message opening with a code block loses its shape without it. The
strip SHALL be applied where the text is read rather than where it is rendered, so one message cannot arrive
stripped through the envelope and unstripped through the read that opens it in full. **No stated size or
clamp SHALL change with it** — those are measured against the recorded body, not against the rendered text.

**An answer whose text is blank SHALL add no turn**, on the same terms as one that yielded no text at all.

**A span whose history is all machinery SHALL say so.** A retrieval prompt, or a tool loop with nothing said
in it, has no conversation to state — and saying that is the answer, where fifty bubbles of tool traffic was
not. Whether a hop records a history at all is decided from the row before any read; whether that history
contains an exchange can only be known after it, and is stated inside.

**Chat SHALL be offered only for a span that records a message history.** An MCP protocol message and an
embedding probe are not conversations, and a tab that resolves to "this hop has no conversation" on every
such span states a fixed fact once per click.

Where the request envelope carries no message, or its dialect is one no parser claims, Chat SHALL state that
rather than render an empty conversation; the raw body stays the Request tab's answer.

#### Scenario: A hop's history renders as a conversation

- **WHEN** a model-call span carrying prior turns is selected and Chat is opened
- **THEN** the request's messages render as a conversation in recorded order
- **AND** each turn states its role

#### Scenario: The machinery is left to the request tab

- **WHEN** the span's request carries a system prompt and tool results alongside the exchange
- **THEN** the conversation states the user and assistant turns
- **AND** it states neither the system prompt nor the tool results

#### Scenario: A result that arrived under the user role is still a result

- **WHEN** a message answering a recorded call arrives with the user role
- **THEN** it is not stated as part of the conversation

#### Scenario: A history with no exchange in it says so

- **WHEN** every message a span received is machinery
- **THEN** the tab states that the span received no conversation

#### Scenario: The answer is the span's own response

- **WHEN** the span's response yields assistant text
- **THEN** it renders as the trailing turn of the conversation

#### Scenario: A response that yields no text adds no turn

- **WHEN** the span's response yields no assistant text
- **THEN** no trailing assistant turn renders
- **AND** no substitute text is shown

#### Scenario: A withheld response still leaves the history

- **WHEN** the caller's schema reports the request body column but no response body column
- **THEN** Chat renders the history
- **AND** it states that the answer is withheld

#### Scenario: Chat re-reads no body already fetched

- **WHEN** the reader switches from Response to Chat for the same span
- **THEN** no additional body query is issued
- **AND** reaching Chat from Request fetches the response once, as opening the Response tab would

#### Scenario: A clamped turn can be opened in full

- **WHEN** a turn's recorded text was clamped
- **THEN** the turn offers the affordance that reads that message in full

#### Scenario: A turn does not render the blank lines its body carried

- **WHEN** a recorded message's content begins or ends with blank lines
- **THEN** the turn renders without them
- **AND** the indentation of its first line of content is preserved
- **AND** the size stated for that message is unchanged

#### Scenario: A blank answer adds no turn

- **WHEN** the span's response yields text that is blank throughout
- **THEN** no trailing assistant turn renders

#### Scenario: A span with no conversation offers no Chat

- **WHEN** an MCP span or an embedding span is selected
- **THEN** no Chat tab is offered for it

#### Scenario: A request that carried no message states so

- **WHEN** the span's request envelope carries no message
- **THEN** Chat states that the span received no conversation
- **AND** it does not render an empty conversation

### Requirement: Assistant text is read from the assembled response, or decoded from the raw body

A request body is always plain JSON. An assistant's text has **two** possible sources, and a span's response
SHALL treat both as first-class — for the Response tab's assembled statement and for the trailing answer of
its Chat tab alike.

**Preferred source — `assembled_response`.** Where the producer persists it, this column holds the merged
response message: a single JSON object whose first choice's message content is the readable answer, already
reassembled from whatever streaming the call used. Reading it avoids reassembling a chunk transcript.

**Guaranteed fallback — `response_body`.** The assembled column is not always populated. It is null for every
row ingested before the producer began writing it, and hop rows live for a year, so a recently upgraded
instance carries up to a year of spans for which the raw body is the **only** source of assistant text. A
minority of rows, current ones included, also store a value that is not JSON. The fallback is therefore an
ordinary operating mode, not an error path, and SHALL be implemented and tested as such.

The fallback SHALL decode `response_body` in whichever of three formats it is written:

- a stream of OpenAI server-sent-event chunks — the concatenation of the streamed content deltas in arrival
  order;
- a single JSON object — the first choice's message content;
- JSON-RPC over server-sent events, for an `mcp` hop — the concatenation of the result's content parts.

The format SHALL be determined from the body itself, not from a recorded flag. The hop log carries **no**
streaming column; whether a call streamed is stated inside the request body, and a request body that is
absent, withheld or unparseable would leave the response undecodable for want of a discriminator that the
response already carries plainly.

The fallback SHALL be used whenever the assembled value is absent, null, or not parseable as JSON — the three
cases are indistinguishable to a reader and SHALL be indistinguishable in behaviour. A span SHALL NOT render
as unavailable while a decodable raw body for it exists.

Where neither source yields text, the response SHALL state its own read state and the Chat tab SHALL add no
trailing turn. Neither MUST yield the raw body, a partial fragment, or a fabricated substitute: a malformed
body is an unknown message, and rendering bytes at the reader would present transport detail as conversation.

A response whose decoded content is empty, or which carries no content key at all, SHALL NOT be treated as an
empty step. Its output is in the response's tool calls, whose names exist **only** in a response body — the
hop log carries no column for them.

#### Scenario: The assembled response is preferred where present

- **WHEN** a span's assembled response is present and parseable
- **THEN** the assistant text is its first choice's message content
- **AND** the raw response body is not decoded for that span

#### Scenario: A null assembled response falls back to the raw body

- **WHEN** a span's assembled response is null because the row predates the column
- **THEN** the assistant text is decoded from the raw response body
- **AND** the span does not render as unavailable

#### Scenario: A non-JSON assembled response falls back to the raw body

- **WHEN** a span's assembled response is present but is not parseable as JSON
- **THEN** the assistant text is decoded from the raw response body

#### Scenario: A streamed body is reassembled from its chunks

- **WHEN** the fallback decodes a body that is a stream of event chunks
- **THEN** the assistant text is the concatenation of their content deltas in arrival order

#### Scenario: A single-object body is read from its first choice

- **WHEN** the fallback decodes a body that is one JSON object
- **THEN** the assistant text is that object's first choice's message content

#### Scenario: An MCP body is read from its JSON-RPC result

- **WHEN** the fallback decodes an MCP hop's body written as JSON-RPC over server-sent events
- **THEN** its text is the concatenation of the result's content parts

#### Scenario: The format is decided by the body, not by a flag

- **WHEN** the fallback decodes a response body
- **THEN** the format is determined from the body's own shape
- **AND** no streaming column of the hop log is consulted

#### Scenario: Neither source yields a placeholder, not raw bytes

- **WHEN** the assembled response is unusable and the raw body cannot be parsed in any of the three formats
- **THEN** the Response tab states its read-state placeholder and the Chat tab adds no trailing turn
- **AND** no part of either raw value is rendered

### Requirement: The hop body columns are schema-gated for two independent reasons

The fetched `dial_usage_log` entity schema SHALL be the sole authority on which body columns a query may
name. Two different conditions remove a column from that schema, they are **not** interchangeable, and a
projection that names an absent column is rejected with the whole query — so both must be handled or the
span's bodies fail outright rather than degrading.

**Access — `sensitive`.** `request_body`, `response_body` and `assembled_response` are flagged `sensitive` in
the analytics catalog, so the service omits them from the schema it returns to any caller below FULL_ADMIN.
This is the expected path for a non-admin, and it removes all three at once. All three are also `heavy`,
which keeps them out of a wildcard projection but is a transfer-cost hint rather than access control.

**Service version.** `assembled_response` is a **later addition** to the hop log and does not exist on every
instance. An instance predating it does not persist the column at all — its own mapping states that the
merged response is read at ingest as a deriver source and never stored — so the column is missing from the
schema for **every** caller, full administrators included. This is not an access condition and no permission
changes it; only upgrading the service does.

Consequently `assembled_response` SHALL be treated as an **optional** field in exactly the sense the
conversations views already use: named only when the fetched schema reports it, through the same
optional-field mechanism the insight columns go through. It MUST NOT be named unconditionally. Naming it on
an instance that predates it costs the whole body query, which is the one failure this gate exists to
prevent — and it is a failure a full administrator would see, so no amount of permission masks it.

**`response_body` SHALL be optional on exactly the same terms**, and for a reason that follows directly from
the gate below: the response side is offered when *either* response column is present, so an instance
reporting only the assembled column is a supported state — and a projection that names `response_body`
regardless rejects the whole query on it. Neither response column may be named unconditionally. Gating one
and hard-coding the other makes the gate and the projection two different answers to the same question, which
is the failure this requirement exists to prevent.

**The grant SHALL be reported per side and SHALL NOT be reduced to a single combined flag.** The schema probe
SHALL report whether the request column is readable and whether at least one response column is, and each tab
SHALL be gated by the columns it actually reads, under **Each side of the inspector is gated by its own
recorded column**. A conjunction of the two has no reader: it would withhold a readable request over an
unreadable response.

The frontend MUST NOT implement an access check of its own. The service's column-level access control is the
gate, and a second gate maintained here would be a second answer to the same question.

Where no body column is granted, the trace view SHALL state that once for the whole session and SHALL keep
the tree, the span facts, the header, the panels and every figure on the page fully functional. It MUST NOT
render an error, and MUST NOT imply the hop recorded nothing.

A schema read that **fails** is not the same as a schema that omits a column, and SHALL be reported as a
failure rather than silently withholding the bodies.

#### Scenario: A full administrator on a current instance reads both sides

- **WHEN** the fetched hop-log schema reports the request body and both response columns
- **THEN** the Request, Response and Chat tabs are all offered

#### Scenario: An instance without the assembled column still reads responses

- **WHEN** the fetched schema reports the request body and the raw response body but not the assembled response
- **THEN** the Response tab is offered
- **AND** no query names the assembled response column
- **AND** the assistant text is decoded from the raw response body

#### Scenario: The assembled column is named only when the schema reports it

- **WHEN** a hop body query is built and the schema does not report the assembled response
- **THEN** the select does not name it
- **AND** the query returns rows

#### Scenario: The raw response column is named only when the schema reports it

- **WHEN** the fetched schema reports the request body and the assembled column but not `response_body`
- **THEN** no hop body query names `response_body`
- **AND** the Response tab is offered

#### Scenario: The probe reports each side separately

- **WHEN** the schema probe resolves the caller's body-column grant
- **THEN** it reports the request side and the response side independently
- **AND** it reports no combined flag requiring both

#### Scenario: A caller without the body columns keeps the rest of the trace

- **WHEN** the fetched hop-log schema reports none of the body columns
- **THEN** the trace states once that the bodies are unavailable to this caller
- **AND** the tree, the span facts, the header and the panels still render
- **AND** no error is rendered

#### Scenario: No frontend role check gates the bodies

- **WHEN** the trace view decides which tabs to offer
- **THEN** the decision reads only the fetched entity schema
- **AND** no role, scope or permission of the session is consulted

#### Scenario: A failed schema read is reported as a failure

- **WHEN** the hop-log schema cannot be fetched
- **THEN** the view reports a failure rather than presenting the bodies as unavailable to the caller

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

### Requirement: A hop's bodies are located by its trace and its span, never by the conversation header

The read that fetches a selected hop's request and response SHALL be located by the trace the span was read
under, the span's own id and its recorded time, and SHALL NOT be conditioned on the conversation or session
header. That header is unpopulated on whole classes of in-turn spans — a Core-internal call recorded under the
trace carries none — so a read requiring it matches no row for exactly those hops, and the section then
reports that the hop recorded nothing while the log holds its body.

**The bodies read and the span tree SHALL agree on which hops of one trace exist.** The tree is already
scoped by trace id alone, for this same reason; a tree that offers a row whose every tab denies it contradicts
itself, and the reader has no way to tell which of the two is wrong.

**Entitlement is unaffected.** Which body columns a caller may read is resolved from the entity schema and
stays the only gate on the content: a caller holding neither column SHALL still be told the column was
withheld, rather than that the hop recorded nothing.

#### Scenario: A hop recorded with no conversation header states its body

- **WHEN** a span whose conversation header is empty is selected
- **THEN** its Request and Response state what the log recorded for that span
- **AND** neither reports that the hop recorded nothing

#### Scenario: The tree and the bodies read agree

- **WHEN** a trace offers a row for a span
- **THEN** selecting that row reads that span's bodies under the same scope the row was read under

#### Scenario: A withheld column is still reported as withheld

- **WHEN** a caller entitled to neither body column opens a hop
- **THEN** the section states that the column was withheld rather than that nothing was recorded

### Requirement: A turn renders as a tree of spans

A turn SHALL render as a tree of spans. **A row SHALL stand for exactly one recorded span, and every
recorded span SHALL have exactly one row.** A span SHALL nest under the span identified by its
`core_parent_span_id`. Nesting is not decoration: a span that called another deployment is not a peer of the
call it made.

**Nothing decoded from a span's body SHALL be a row.** Assistant text, a requested tool, a tool result, a
reasoning marker and an empty answer are content *inside* a span, not spans; they SHALL be rendered by the span
inspector for the span the reader selected, under **A hop's request and response render as a structured
inspector**. Putting them in the tree alongside spans mixes two questions in one list — the tree answers
*what this turn asked DIAL to do*, the body answers *what the agent did* — and makes a row's name depend on
how many fragments its body happened to contain.

**One span is one row even when the span is an MCP protocol message.** Each `initialize`,
`notifications/initialized`, `tools/list` and `tools/call` is a separate request that Core proxied and
recorded, so each keeps a row. Grouping them would make the turn's span count and the rows' position
numbering unanswerable against the data they are read from.

**The tree SHALL contain rows for recorded work only.** The turn's own question, totals, duration, cost and
status are stated by the trace view's heading and figures, and SHALL NOT be repeated as rows inside the tree.

**A row SHALL be named by the entity that did the work** — the deployment or toolset the span was addressed
to — and never by the content of its response. Where no deployment is recorded the row SHALL fall back to the
request URI and then to the span's span id.

**A row's secondary line SHALL be chosen by the figures the span actually recorded, not by its kind.** A span
that recorded its own tokens SHALL state tokens, request messages and cost; a span that recorded no tokens and
no price of its own SHALL state its chain cost. An application span records zero tokens and a null own price
while carrying a real chain price, so a single token-shaped line would render it as `0 tok` and a dash,
reading as broken data rather than as a call that spent nothing itself.

**A span that recorded no figures at all SHALL state none.** A model call can record zero tokens, no price of
its own and no chain price; a row that then renders an empty line under its own name reads as broken rather
than as a call that measured nothing. Such a row states its name, its kind and its duration and nothing else.

**The upstream host SHALL NOT be a row fact.** It is constant across every span of one deployment, so per row
it restates the row's own name — a turn that handshakes two toolsets renders it seven times — and being the
longest token on the line it pushes the span's own method into truncation. The detail panel states the full
upstream URI once, for the span the reader opened.

**A duration SHALL be stated at the scale the span log records.** Recorded span durations begin at single-digit
milliseconds, so a sub-second duration SHALL keep its milliseconds: rendering a 15 ms handshake as `0s` is
the same zero-reading the rule below forbids, arrived at by rounding instead of by a missing value.

**Every row SHALL carry a kind, and the kind SHALL be the kind of call the span log records** — **LLM**,
**MCP**, **Embeddings**, **Route**, **Rating** — with a generic kind for anything unrecognised. The kind
SHALL be read from the span's recorded event kind, and from its endpoint only where no event kind is recorded.

**The kind SHALL NOT assert what sort of entity answered the call.** An application span and a model span are
both recorded as the same kind of call and nothing on the row separates them reliably: the `applications/`
name prefix misses the many applications deployed under a bare name; having child spans misses an application
that made none; a null own price catches unpriced *models* as readily as applications — adapters, preview
models and echo-style test deployments all carry no price of their own. A call to an application's chat
endpoint *is* an
LLM-protocol call, and naming it so asserts only what was recorded. Which span orchestrated the turn is
carried by the row's name and its depth, both of which are facts.

**A rating SHALL be its own kind, recognised by its endpoint.** A rating arrives as its own single-span trace
shortly after the turn it rates, carrying that turn's conversation id, so it is reachable in the
conversation's trace list and opens as one row. Typing it generically would put the console's least
informative label on the one thing a reader actually meets there.

**Kind and outcome SHALL be two axes, never one set.** A row SHALL state what kind of call it stands for
**and**, independently, whether that call failed. Collapsing the two makes a failed model call report its
failure *instead of* its kind, so the reader loses the fact they were about to act on: a failed MCP call and
a failed model call are different problems, and a set that names both "error" says neither.

**A span that failed SHALL keep its kind and carry a failure marker beside it.** A failure is either a false
success flag or a status of 400 or above. The marker SHALL be persistent and SHALL NOT depend on the current
emphasis, so a failure can never be buried among the rows of the work it was attempting. A failed span that
other spans nest under SHALL keep them as its children.

**The unrecorded-root placeholder SHALL carry no kind**, and is the one row exempt from the rule above. It
stands for a span the log has no row for, so naming a kind would assert what kind of call it was on no
evidence. It SHALL state in words what it is instead, and it SHALL match no filter.

**Typing SHALL be a deny-list at every level.** An event kind or MCP method this frontend does not recognise
SHALL render as a shown, generically-typed row: silently dropping something unfamiliar is the worse failure
in an observability tool. The generic kind SHALL be specified by that behaviour and not by a list of the
endpoints that reach it today. One case SHALL be handled explicitly: a span with no event kind is not unknown
but an unlabelled model call, classified by its endpoint.

**No endpoint SHALL be treated as too utilitarian to render.** The previous requirement carved out
token-counting and prompt-truncation endpoints as utility rather than conversation, which the one-row-per-span
rule now contradicts: a utility call is a request Core proxied and recorded, so it is a span of the turn and
gets its row like any other. It carries the generic kind, which states exactly what is known about it.

**No span SHALL be excluded from the tree for the kind of call it was.** In particular `route` spans SHALL
render. They sit inside conversation traces and orchestrate other spans: one measured turn of 18 spans has a
route span that is the **parent of two embedding spans**, so excluding it hoists both to the top level and
destroys the structure the reader opened the trace to see. Route calls that are genuinely background work are
roots of **their own** traces, so scoping the trace read by trace id already keeps them out and no exclusion
rule is needed.

**An empty conversation id SHALL NOT be read as evidence that a span is outside the turn.** The field is
unpopulated on whole classes of in-turn spans — one measured 18-span turn carries an empty conversation id on
**every** row — so its absence says nothing about membership. Membership SHALL be decided by the trace the
span was read under and by its parent pointer, never by that field.

**No span SHALL be dropped for want of a place in the tree.** A span whose parent span id names a span absent
from the loaded page — the page is capped, and a trace can hold thousands of spans — SHALL render at the top
level rather than disappear. The same SHALL hold for a span whose parent chain is circular or nests deeper
than the rendering bound.

**A trace whose root span was not recorded SHALL render that root as a named placeholder**, taking its name
from the first segment of a child's execution path, and SHALL mark it as not recorded. The turn's real work
nests beneath it. The execution path SHALL NOT be used to establish a parent-child edge; its only use here is
naming an unrecorded root.

**Ordering SHALL be by recorded request time among siblings.** The tree states structure, and a global
ordering across the whole turn cannot be read off it. Where a turn's spans all sit at one level — the common
shape — sibling ordering is that global ordering.

**The tool-request to tool-result gap SHALL be surfaced with its cause, not merely flagged.** A tool the
calling application implements internally never crosses Core and is therefore never recorded as a span, so a
requested tool with no recorded result SHALL state that the execution did not cross DIAL rather than imply a
record was lost. One measured turn requested a tool by name in a model response and recorded no MCP tool call
at all: the tool was declared by the calling application in its own request and executed inside it. Because
requested tools are content and no longer rows, this SHALL be stated in the inspector of the span that
requested the tool. The surplus SHALL be resolved **by count per tool name, never by identity** — the log
pairs nothing, so no claim may be made about which specific request went unanswered.

**The cause SHALL be claimed only where the span read was complete.** The read is capped, so on a bounded
turn a `tools/call` past the bound is unread rather than absent, and stating that the application ran the
tool itself would assert a cause from a page that cannot support it. Where the read was bounded the view
SHALL state nothing about the gap rather than state it wrongly.

**A row with children SHALL expand and collapse, and SHALL expose which state it is in programmatically**
rather than by appearance alone. **The tree SHALL open fully expanded.** An observability tool that opens by
hiding what it recorded makes the reader's judgement for them.

**The tree SHALL offer one filter control per kind, and SHALL start with no kind emphasised.** Activating a
kind SHALL emphasise it; activating it again SHALL return to no emphasis. A separate control SHALL also
return to no emphasis. Each control SHALL name its kind and nothing more, and SHALL expose programmatically
whether it is the emphasised one.

**Emphasising a kind SHALL de-emphasise every other row, and SHALL NOT remove any row.** Every span stays
where it is, at the depth it belongs. **A de-emphasised row SHALL remain readable, selectable and openable.**
**A match SHALL be distinguishable by more than the dimming of everything else**, carrying its own persistent
marker, because colour and opacity alone carry nothing to a reader who cannot perceive them.

**While a kind is emphasised, the number of matches SHALL be stated once** beside the filter controls, and
SHALL be announced. **At rest there SHALL be no such count.** Because dimming changes no row's presence, a
reader using assistive technology gets no structural signal that the filter did anything; the count is the
only thing that says what it found.

**The outcome axis SHALL have exactly one control — Failed — and it SHALL be offered only when the turn
recorded a failure.** Emphasising it SHALL mark every failed row whatever its kind, and SHALL behave in every
other respect as a kind control does. There SHALL be no "succeeded" control: the turn's own status figure
already states whether anything failed.

**Only the kinds the turn actually recorded SHALL be offered.** Under dimming, a control for a kind the turn
has none of would dim every row and mark none. The set of controls SHALL therefore be the set of kinds
present, which answers "were there any errors" by whether the control exists at all.

**A kind's control SHALL carry that kind's own colour, and that colour SHALL be the one marking its rows in
the tree.** Every colour SHALL be a theme token: a hardcoded value is where contrast quietly breaks. **Colour
SHALL NOT be the only thing that distinguishes one control from another** — each states its kind in words.
**No filter control SHALL be disabled, including the one that is currently active**: disabling the active
control drops it out of the tab order, so the reader who narrowed by keyboard cannot get back.

**Each row SHALL carry its position in the turn**, numbered by depth-first order over the whole tree. The
numbering SHALL NOT change when the reader filters or collapses.

**The tree's boundary is Core's boundary, and the view SHALL NOT imply otherwise.** A row exists for each
request Core proxied and for nothing else, which is why an application span reports no tokens of its own, why
a tool the application ran itself has no row, and why an upstream has no row. Where the reader would
otherwise read a boundary as missing data, the view SHALL state the boundary.

**Building the tree SHALL NOT require any span's response body.** Rows SHALL come from the recorded spans alone, so
the trace no longer reads or decodes model-call bodies in order to render. Bodies are read on demand for the
one span the reader selected, under **The inspector reads bodies in tiers, and never ships one whole**.

#### Scenario: A span nests under its parent span

- **WHEN** a trace records a span whose parent span id names another span in the same trace
- **THEN** that span renders as a child of the named span

#### Scenario: A model call that requested one tool still reads as a model call

- **WHEN** a model call's response carried exactly one tool request and nothing else
- **THEN** one row renders, named after the deployment that was called and typed LLM
- **AND** no row is named after the requested tool
- **AND** the requested tool is shown in that span's inspector

#### Scenario: A model call that only answered still reads as a model call

- **WHEN** a model call's response carried assistant text and nothing else
- **THEN** one row renders, named after the deployment that was called and typed LLM
- **AND** the answer is shown in that span's inspector rather than as a row

#### Scenario: A span's row count does not depend on its body

- **WHEN** one model call's response carried text and three tool requests and another carried only text
- **THEN** each renders as exactly one row

#### Scenario: The tree holds no row for decoded content

- **WHEN** the tree renders a turn whose model calls recorded reasoning tokens, text and tool requests
- **THEN** no row stands for a reasoning marker, an assistant text, a tool request or a tool result

#### Scenario: A model call recorded as returning no bytes is still one row

- **WHEN** a model call's recorded response size is zero
- **THEN** one row renders for it, typed by its kind of call
- **AND** its emptiness is stated by its inspector rather than by its kind

#### Scenario: Each MCP protocol message keeps its own row

- **WHEN** a turn records `initialize`, `notifications/initialized` and `tools/list` against one toolset
- **THEN** three rows render
- **AND** the turn's row count for that toolset equals its recorded span count

#### Scenario: A span with no tokens of its own states what it does have

- **WHEN** a span records zero tokens, no price of its own, and a chain price
- **THEN** its secondary line states its chain cost
- **AND** it does not state a token count of zero
- **AND** it does not state its upstream host

#### Scenario: A span with its own tokens states them

- **WHEN** a span records its own tokens and its own price
- **THEN** its secondary line states tokens, request messages and cost

#### Scenario: A span that recorded no figures states none

- **WHEN** a span records no tokens, no price of its own and no chain price
- **THEN** no secondary line renders for it
- **AND** its name, its kind and its duration still render

#### Scenario: A sub-second duration keeps its milliseconds

- **WHEN** a span reports a duration below one second
- **THEN** its row states that duration in milliseconds
- **AND** it does not state it as zero seconds

#### Scenario: An application call is typed by the call, not by the callee

- **WHEN** a span addresses an application's chat endpoint
- **THEN** its row is typed LLM
- **AND** no kind asserts that the callee is an application

#### Scenario: A rating opens as its own row

- **WHEN** a conversation records a rating span in its own trace
- **THEN** that trace opens as one row typed Rating
- **AND** the row is not typed generically

#### Scenario: A failed call of one kind is distinguishable from a failed call of another

- **WHEN** a turn records a failed model call and a failed MCP call
- **THEN** each row states its own kind
- **AND** both carry a failure marker

#### Scenario: A failed orchestrating call keeps its kind and its children

- **WHEN** a model call failed and other spans nest under it
- **THEN** its row states the kind LLM and carries a failure marker beside it
- **AND** the spans nesting under it are still rendered as its children
- **AND** emphasising Failed marks it once

#### Scenario: The Failed control is absent when nothing failed

- **WHEN** a turn recorded no failure
- **THEN** no Failed control is offered

#### Scenario: A failure marker does not depend on emphasis

- **WHEN** no kind is emphasised
- **THEN** a failed row still carries its failure marker

#### Scenario: A route span renders in the tree

- **WHEN** a trace contains a span whose event kind is route
- **THEN** a row renders for it, typed Route

#### Scenario: A route span keeps the spans that nest under it

- **WHEN** a route span is the parent of two embedding spans in the same trace
- **THEN** the route span renders as their parent
- **AND** neither embedding span is hoisted to the top level

#### Scenario: An empty conversation id does not exclude a span

- **WHEN** every span of a turn records an empty conversation id
- **THEN** every one of them renders
- **AND** no span is excluded for that reason

#### Scenario: A background route call does not reach a conversation's trace

- **WHEN** a route call is the root of its own trace and belongs to no conversation
- **THEN** no conversation's trace renders a row for it

#### Scenario: The tree holds no row for the turn itself

- **WHEN** the tree renders
- **THEN** it contains no row standing for the turn's question or its totals

#### Scenario: An orphaned span is kept at the top level

- **WHEN** a span's parent span id names a span absent from the loaded page
- **THEN** the span renders at the top level
- **AND** it is not dropped

#### Scenario: A circular parent chain does not lose its spans

- **WHEN** a trace's parent pointers form a cycle
- **THEN** every span in the cycle is still rendered

#### Scenario: An unrecorded root is named from a child's execution path

- **WHEN** a trace's root span is absent but its children record an execution path
- **THEN** a placeholder root renders, named from the first segment of that path
- **AND** it is marked as not recorded
- **AND** it carries no kind and matches no filter
- **AND** the trace's spans render beneath it

#### Scenario: Siblings are ordered by start time

- **WHEN** a span has several children
- **THEN** they render in ascending order of request time

#### Scenario: A trace with no nesting renders as one level

- **WHEN** every span of a trace has the same parent
- **THEN** they all render at the same depth

#### Scenario: A three-level trace renders three levels

- **WHEN** an application span's child is itself an application span with a model call beneath it
- **THEN** the tree renders all three at their recorded depths

#### Scenario: An unlabelled model call is typed by its endpoint

- **WHEN** a span records no event kind but a model endpoint
- **THEN** its row is typed LLM

#### Scenario: An unrecognised span is shown

- **WHEN** a span records an event kind this frontend does not recognise
- **THEN** it renders as a generically-typed row rather than being dropped

#### Scenario: A tool the application ran itself says why it has no result

- **WHEN** a model response requested a tool for which the turn recorded no MCP tool call
- **THEN** the span's inspector states that the execution did not cross DIAL and so was not recorded
- **AND** it does not present the absence as a lost or failed record

#### Scenario: An unanswered tool request is resolved by count, not by identity

- **WHEN** more requests for a tool were made than results recorded for it
- **THEN** the surplus is stated as a count for that tool name
- **AND** no claim is made about which specific request went unanswered

#### Scenario: The tree opens fully expanded

- **WHEN** the tree first renders
- **THEN** every row with children is expanded

#### Scenario: A row collapses and states that it is collapsed

- **WHEN** a row with children is collapsed
- **THEN** its descendants are not shown
- **AND** the row exposes its collapsed state programmatically

#### Scenario: No kind is emphasised until the reader chooses one

- **WHEN** the tree first renders
- **THEN** no row is de-emphasised
- **AND** each kind present offers a control naming it

#### Scenario: Emphasising a kind dims the rest without removing them

- **WHEN** a kind's control is activated
- **THEN** every row of that kind is marked as a match
- **AND** every other row is still rendered, at the same depth, de-emphasised
- **AND** activating the control again returns every row to no emphasis

#### Scenario: A de-emphasised span can still be opened

- **WHEN** a kind is emphasised and the reader selects a span of another kind
- **THEN** that span's detail opens as it would with no filter active

#### Scenario: A match is marked by more than dimming

- **WHEN** a kind is emphasised
- **THEN** each matching row carries a marker that does not rely on colour or opacity

#### Scenario: The match count appears only while a kind is emphasised

- **WHEN** no kind is emphasised
- **THEN** no match count is shown
- **AND** emphasising a kind shows its match count against the turn's rows
- **AND** that count is announced

#### Scenario: A turn that recorded no spans says so

- **WHEN** a turn's trace returned no spans
- **THEN** the tree states that nothing was recorded

#### Scenario: A control and its kind's rows share one colour

- **WHEN** the tree renders a kind's control
- **THEN** the control carries the same colour that marks that kind's rows

#### Scenario: The control that clears the filter carries no kind colour

- **WHEN** the filter controls render
- **THEN** the control that returns to no emphasis is neutral

#### Scenario: A kind the turn has none of is not offered

- **WHEN** the turn recorded no spans of some kind
- **THEN** no control for that kind is rendered
- **AND** no disabled control stands in its place

#### Scenario: The active filter is not disabled

- **WHEN** no kind is emphasised
- **THEN** the control that returns to no emphasis states that it is the active one
- **AND** it is not disabled

#### Scenario: Positions survive filtering and collapsing

- **WHEN** a kind is emphasised or a row is collapsed
- **THEN** each visible row keeps the position it had in the unfiltered tree

#### Scenario: The tree renders without reading any response body

- **WHEN** a turn's trace opens
- **THEN** every row renders from the recorded spans alone
- **AND** no model-call response body is read to build the tree

### Requirement: The trace view splits the span tree from the selected span's bodies

Inside an open trace the left region SHALL be split horizontally into two sections: the **span tree** above
and the **selected span's bodies** below. The bodies SHALL NOT be presented in the span rail beside the tree.
One 360px rail cannot hold a span's facts, its request, its response and its conversation at once — the facts
block was already capped to stop it squeezing the message history to a sliver — and a reader compares a hop's
request against the tree, which a rail forces into a column a third of the tree's width.

**The split SHALL be adjustable by the reader**, so a reader following a long chain can give the tree the
screen and a reader reading a large request can give it to the bodies.

**Each section SHALL be floored at 20% of the split region's available height**, and neither SHALL be
collapsible to nothing. The floor SHALL be expressed as a proportion of the available height rather than as a
fixed number of pixels, so that a size chosen at one viewport height stays legal at a smaller one: a section
sized in pixels can fall below its own floor when the window shrinks, which is the state the floor exists to
prevent.

**The split SHALL start at 50/50** and SHALL keep the reader's chosen proportion while the trace stays open,
including across changes of selected span. Resetting the split when the selection changes would undo the
reader's adjustment on every click of the surface the adjustment was made for.

**The separator SHALL be operable by keyboard as well as by pointer.** It SHALL expose its orientation and
its current proportion to assistive technology, and SHALL report the same floor it enforces. A pointer-only
handle leaves a reader with no pointer unable to reach a size the view offers everyone else.

**Where the selected span offers no body at all** — every body column withheld from this caller — the region
SHALL render the tree alone, with no bodies section and no separator. A floor governs how small a section may
be made, not whether a section exists; half the region held open for a statement the trace's header already
makes once would cost the tree the screen it is the only remaining use for.

Changing the split MUST NOT re-read anything. It is a layout change, and neither the span read nor any body
read depends on it.

#### Scenario: The split opens at half the region and is adjustable

- **WHEN** a trace's hop chain opens
- **THEN** the span tree and the span's bodies each take half the split region's height
- **AND** the separator between them can be dragged

#### Scenario: Neither section can be driven below its floor

- **WHEN** the separator is dragged past either end
- **THEN** each section keeps at least 20% of the available height
- **AND** neither section is collapsed to nothing

#### Scenario: The floor survives a smaller viewport

- **WHEN** the reader sizes one section near its floor and the window is then made shorter
- **THEN** both sections still hold at least 20% of the available height

#### Scenario: The separator is operable from the keyboard

- **WHEN** the separator is focused and an arrow key is pressed
- **THEN** the split moves in that direction
- **AND** the separator states its orientation and its current proportion to assistive technology

#### Scenario: Selecting another span keeps the reader's split

- **WHEN** the reader adjusts the split and then selects a different span
- **THEN** the split keeps the adjusted proportion

#### Scenario: Adjusting the split issues no read

- **WHEN** the separator is dragged
- **THEN** no span query and no body query is issued

#### Scenario: A span with no readable body renders no split

- **WHEN** every body column is withheld from this caller
- **THEN** the span tree takes the whole region
- **AND** no bodies section and no separator render

### Requirement: The span's bodies are presented as Request, Response and Chat tabs

The bodies section SHALL present the selected span in tabs, in the fixed order **Request**, **Response**,
**Chat**. Request and Response state the envelope as the inspector requirements define them; Chat states the
conversation the span received.

**The order SHALL be fixed and SHALL NOT be reordered by which tabs a span offers.** A tab a span has nothing
for is absent, and the remaining tabs keep their relative order, so the strip does not rearrange itself as
the reader moves down the tree.

**The active tab SHALL persist across a change of selected span** wherever the newly selected span offers it,
and SHALL fall back to the first tab the span offers where it does not. A reader comparing one side of two
hops is asking the same question twice; being returned to the first tab on each click answers a different one.

**The tab set SHALL be one layout rule for every kind of hop.** What differs by kind is what each tab renders
and whether Chat is offered — never whether the strip exists. An MCP hop's arguments are its request column
and its result its response column; an embedding hop's probe text is its request column and its dimension
count its only response-column field. Each SHALL therefore render on the tab that reads the column it comes
from, so a reader moving down a tree of mixed kinds keeps one layout and finds a response fact where every
other response fact was.

**The tab strip SHALL be the first element of the bodies section.** It is the control that decides what the
section shows, so it heads the section it governs; a section opening with a row of facts puts what a reader
reads second above what they act on first.

**The strip, the hop-row facts and the body SHALL sit on one continuous opaque surface.** A transparent band
between them shows whatever lies behind the section, and on the seam of a pinned element it is where a stale
repaint survives; the section's own ground SHALL run from the strip to the body with no gap to see through.

**A fact read from the hop row rather than from a body SHALL render directly below the tab strip**, outside
the scrolling body, where it stays visible on every tab. An MCP hop's method, tool name and toolset are plain
columns belonging to neither side, and duplicating them onto both tabs would state the same thing twice while
leaving a reader unsure whether the two copies could differ.

**A trace SHALL open on its entry hop** — the span whose parent is null, what the client sent to DIAL — and
on its earliest span where it records none. That hop's request body is the only one carrying the user-visible
exchange with no system prompt and no internal planning, so it is the span whose Chat answers "what was this
conversation" for a reader who has not yet picked a hop. Ordering alone does not find it: a Core-internal
root can fire long after the hop it belongs to, so the earliest span lands on the conversation only usually.

**Where no span is selected the section SHALL say so** rather than render an empty tab strip — the same
statement the rail makes for the same state.

#### Scenario: The tabs render in a fixed order

- **WHEN** a span offering all three is selected
- **THEN** the tabs read Request, Response, Chat in that order

#### Scenario: A missing tab does not reorder the others

- **WHEN** a span offers Request and Chat but not Response
- **THEN** Request precedes Chat
- **AND** no placeholder Response tab renders

#### Scenario: The active tab survives a change of span

- **WHEN** the reader is on Response and selects another span that offers Response
- **THEN** Response is still the active tab

#### Scenario: A span that does not offer the active tab falls back

- **WHEN** the reader is on Chat and selects a span that offers no Chat
- **THEN** the first tab that span offers becomes active

#### Scenario: An MCP hop splits its arguments from its result

- **WHEN** an MCP hop is selected
- **THEN** the Request tab states the arguments it sent
- **AND** the Response tab states the result it returned
- **AND** no Chat tab is offered for it

#### Scenario: The tab strip heads the bodies section

- **WHEN** a span is selected
- **THEN** the tab strip is the first element of the bodies section
- **AND** any fact read from the hop row renders below it

#### Scenario: An MCP hop's row facts stay visible on both tabs

- **WHEN** an MCP hop is selected and the reader moves between its tabs
- **THEN** its method, tool name and toolset render below the tab strip on both

#### Scenario: An embedding hop states its dimension count on the response side

- **WHEN** an embedding hop is selected
- **THEN** the Request tab states the model, the input count and the embedded text
- **AND** the Response tab states the dimension count rather than that there is nothing to read

#### Scenario: A trace opens on the span whose history is the conversation

- **WHEN** a trace whose earliest span is a child of a later-recorded root is opened
- **THEN** the entry hop is the selected span
- **AND** a trace recording no entry hop opens on its earliest span instead

#### Scenario: No selected span is stated

- **WHEN** the trace opens with no span selected
- **THEN** the bodies section states that no span is selected

### Requirement: Every hop states how its call went, before any body is read

**A hop SHALL state the outcome of its call from the hop row alone** — the recorded HTTP status with its
reason phrase, the recorded size of each side, and the duration — and SHALL state it without reading a body.
These are columns the tree already carries, so the statement costs no read and holds for a hop whose bodies
are withheld, absent, or clamped away. Until now a hop that showed no body showed nothing at all, which
reports a gap in what the reader may see as a gap in what happened.

**The outcome SHALL be stated in the bodies section rather than on the span's facts sheet.** The status is the
answer to "did this call work", which is the question the two bodies are read against, so it belongs where
they are read; stating it in both places leaves one fact with two homes and two chances to disagree.

**Each fact SHALL be stated on the side it describes, beside that side's own facts.** The verb heads the
request; the status heads the response. Stated once over both tabs, the outcome of the call sits above the
request describing something the request has not done yet.

**A tab SHALL state the one fact its side owns, and not the measurements another surface already carries.**
The duration is on the span's facts sheet, the sizes are on the messages and on the recorded bytes — a line
that repeats them makes the reader search it for the two facts only it can give. **Where a hop offers no tab
at all** — a caller entitled to neither body column — **the sizes and the duration SHALL be stated with both
halves**, because that line is then the whole of what the section can show.

**The conversation tab SHALL state neither half**: it presents a history rather than a call.

**A failed call SHALL be marked on the line as a whole, not on the status alone.** The status states the
failure in words; the line carries it before the reader has read anything.

**Failure SHALL be decided by the same test the tree uses** — a false success flag or a status of 400 and
above — so a hop cannot read as failed in one surface and successful in the other. A status outside that
test, such as the 202 a notification is answered with, SHALL be stated as the success it is.

#### Scenario: A hop with no readable body still states its outcome

- **WHEN** a hop whose body columns are withheld is opened
- **THEN** the section states the recorded status, the recorded sizes and the duration
- **AND** it states separately that the bodies were withheld

#### Scenario: Each side states its own half of the call

- **WHEN** the reader is on the Request tab
- **THEN** it states the verb and does not state the status
- **AND** on the Response tab the status is stated instead

#### Scenario: A failed call is marked on the line, not by the status alone

- **WHEN** a hop whose call failed is opened
- **THEN** its status states the failure in words
- **AND** the line carrying it is marked as failed

#### Scenario: The conversation tab states no transport facts

- **WHEN** the reader moves to the Chat tab
- **THEN** neither half of the transport is stated there

#### Scenario: An accepted notification is not stated as a failure

- **WHEN** a hop answered with a status outside the failure test is opened
- **THEN** it is stated as successful
- **AND** the marker the tree gives that hop agrees with it

### Requirement: A hop's request and response render as a structured inspector

The hop detail SHALL state what the selected hop sent and what came back as a **Request / Response**
inspector, not as excerpts. The two sides SHALL be separate tabs, because a reader is asking about one or the
other; they sit in the trace view's bodies section alongside the Chat tab, under
**The span's bodies are presented as Request, Response and Chat tabs**.

**The Request tab SHALL state the whole message list as a history**, one row per message, each carrying its
role, its position in the list and its size in bytes. A message's text SHALL be clamped to a readable length
with an affordance that opens the rest.

**The control that opens a message in full SHALL carry no border of its own.** It sits inside a bordered
card, where a second border reads as a nested panel; it states itself as a link instead, in the accent colour
the rest of the console uses for an action.

**No message SHALL be marked as large, and no message SHALL be outlined for its size.** The removed rule
marked a message at or above a byte threshold, in words and by a warning border. The size itself is stated on
every message and is the honest form of that fact: a threshold turns a continuum into a verdict, and the
border made a routine 1 KB system prompt look like a fault. Which message made a request heavy is read from
the sizes, which are already there.

**One message SHALL be presented one way wherever it is read.** The request's history rows and the assembled
response SHALL share the card: a response *is* one assistant message, with a role, a size, text and the calls
it asked for, and stating it as bare text made the two tabs look like two tools reading two different things.

**A tool call SHALL render as the message's content, not as metadata about it.** An assistant message that
called a tool and said nothing records `content` as the empty string, so the call is the whole of what that
message said: the row SHALL state each call's name and its arguments inline in the history. Stating a call as
a size instead leaves a card that reads as blank, which is what a reader opening the hop is trying to resolve.
A message that recorded neither text nor a call SHALL say so rather than render empty.

**Per-property sizes SHALL NOT be stated.** A message's own size is stated; its members' sizes are not. The
reader opens a hop for the history, and a property is not a unit they asked about.

**A call SHALL state the id its answer will quote, and a result SHALL state the call it answers.** A recorded
result carries only the id of the call, so on its own it is an anonymous block of text: a turn that called
one tool three times is answered by three messages nothing distinguishes. The tool's **name** SHALL be
stated, resolved against the calls the same request carried, together with enough of the call's id to tell
two answers of one tool apart. Where an id matches no call in this request — the history a client feeds back
can reach further than the request itself — the id SHALL still be stated and no tool named, rather than the
pairing shifting onto another call.

**A result that reported a failure SHALL be marked as failed, in words as well as by colour.** A failed tool
is usually why a reader opened the hop, and it is a fact about the result that its text may not state.

This is stated here and not on the Chat tab: Chat leaves tool traffic out of the conversation entirely, so
the pairing has exactly one surface.

**The request's parameters SHALL be stated inside the Request tab**, not in the hop-row facts slot below the
tab strip. Only facts read from the hop row belong in that slot: a request-body fact placed there is stated
over the Response tab too, describing something else.

**The system message SHALL render, labelled by its role, like any other message.** This reverses the removed
requirement. There SHALL be no per-role setting and no separate reveal: the bodies are already behind the
caller's own column grant, so a second gate inside the screen would protect nothing the first does not, while
a debugging view that withholds the prompt cannot answer the question it exists for. Every message SHALL be
labelled with its role, so nothing can be read as something a person typed.

**Tool definitions SHALL NOT render.** The request's tool catalogue SHALL be stated as a **count** only. A
catalogue is thousands of tokens of someone's proprietary schema and answers no question a count does not.

**A role filter SHALL be offered, with a count per role and a control that returns to all roles.** Roles
present in the request SHALL be offered; a role the request does not carry SHALL NOT be offered, for the same
reason the tree offers only the categories it recorded.

**A role this frontend does not recognise SHALL still render as a message**, under a neutral label and
counted like any other. The history is the answer; a message dropped because its role was unfamiliar is a
gap the reader cannot see, and the endpoint set is open by design.

**The request's message count SHALL come from the hop row, not from a body.** `number_request_messages` is a
plain column, so the count is known before anything is fetched and stays right when a body read is clamped or
withheld. It SHALL be stated alongside the request's parameters rather than as a count on the tab itself,
whose emphasis styling belongs to the design system and reads as a link. There SHALL be no corresponding count on the Response tab: the only response count worth stating is
its frame count, and frames can be counted only by a pass over the raw body.

#### Scenario: The request states every message, not the last one

- **WHEN** a model-call hop whose request carried a system message and prior turns is opened
- **THEN** the Request tab states every message the request carried
- **AND** each message states its role, its position and its size

#### Scenario: An assistant call renders as that message's content

- **WHEN** a request carries an assistant message whose content is empty and which called a tool
- **THEN** the row states the call's name and its arguments as that message's content
- **AND** it does not state the message as empty

#### Scenario: A message that recorded nothing says so

- **WHEN** a request carries a message with neither text nor a tool call
- **THEN** the row states that the message recorded no text

#### Scenario: No message is marked or outlined for its size

- **WHEN** a request carries a message far larger than the others
- **THEN** no marker names it as large
- **AND** its card is not outlined differently from the rest
- **AND** its size is stated as it is for every other message

#### Scenario: A call and its answer state the id that pairs them

- **WHEN** a request carries an assistant call and the message answering it
- **THEN** the call states the tail of its id
- **AND** the answering message names that call's tool
- **AND** it states enough of the call's id to distinguish two answers of the same tool

#### Scenario: An answer to a call this request does not carry states no tool

- **WHEN** a message quotes a call id that no call in the request carries
- **THEN** the id is still stated
- **AND** no tool name is claimed for it

#### Scenario: A failed tool result is marked as failed

- **WHEN** a recorded result reports a failure
- **THEN** the row states that it failed in words, not by colour alone

#### Scenario: The request's parameters are stated on the request tab alone

- **WHEN** the reader moves to the Response tab
- **THEN** the request's parameters are not stated outside the Request tab

#### Scenario: No per-property size is stated

- **WHEN** the Request tab renders a message
- **THEN** it states that message's own size
- **AND** it states no size for any member of it

#### Scenario: The system message renders under its own role

- **WHEN** a request carries a system message
- **THEN** it renders labelled as a system message
- **AND** it is not presented as anything a user or an assistant said

#### Scenario: The tool catalogue is counted, not shown

- **WHEN** a request carries a tool catalogue
- **THEN** the inspector states how many tools it carried
- **AND** no tool definition renders

#### Scenario: An unrecognised role still renders as a message

- **WHEN** a request carries a message whose role this frontend does not recognise
- **THEN** the message renders in the history under a neutral role label
- **AND** it is counted in the role filter

#### Scenario: A role the request does not carry is not offered

- **WHEN** a request carries only user and assistant messages
- **THEN** the role filter offers those roles and no others

#### Scenario: The message count is read from a plain column

- **WHEN** the hop chain is read
- **THEN** the request message count comes from the hop row
- **AND** no body column is named to obtain it

### Requirement: The inspector states every parameter the request carried, and the absence of the ones it did not

The inspector SHALL state the parameters the request body carries, on the Request tab. It SHALL NOT render a
hardcoded list of parameters with values looked up against it, and it SHALL NOT omit a parameter merely
because the body did not carry one.

**`temperature`, `max_tokens`, `tools` and `stream` SHALL always be stated**, showing a de-emphasised
placeholder when the body carries none. An absent `temperature` is a debugging answer — the call ran at the
deployment's default — and a parameter line that silently omits it cannot be told apart from one the reader
did not look at carefully.

**The model the request asked for SHALL head the line**, and the settings a reader looks for by name SHALL
follow it. The call was made *to* a model, and everything after it is how — a line that states the model as
one member among ten makes the reader search for the subject of the sentence.

**Every other member of the body SHALL be counted, with its names carried.** A parameter this frontend has
never met is still one the call was made with, so it is never dropped; but naming every member turned the
line into a paragraph the reader had to read through to find the four settings they came for, on hops that
carry a dozen passthrough members. The count SHALL carry the names of what it stands for, as text a screen
reader reaches, and the values SHALL remain one control away in the recorded bytes.

This reverses the rule that replaced the original count. That rule was right that a bare count says something
exists while refusing to name it — which is why the names travel with this one.

**Only the members that carry the conversation itself SHALL be left out** — the message list, its per-dialect
spellings, and the system prompt — because the history renders those in full and a second, counted copy of
them says nothing.

**The tool catalogue's count SHALL be labelled as a catalogue.** It states how many tools the model was
offered, while the role filter one row below counts the tool *results* the history fed back — a turn offered
ten tools can answer with twenty results, and stated as two bare counts of "tool" the two read as one number
that disagrees with itself.

**The model the request asked for SHALL be stated.** It is not the deployment the hop row names: a deployment
routes to a model whose own id and version the row never records, and the two strings differ on real traffic.
The response states what answered; this states what was asked for.

**A state envelope SHALL keep its presence stated, as a name among the counted members.** The DIAL-specific
envelopes are blobs and are never rendered; an envelope is why a message's recorded size can run far past its
visible text, and a reader comparing the two has no other way to see that it is there.

**An array among the named settings SHALL be stated by its length, and an object by the names of its
members.** How many tools were offered is the answer for a catalogue; for a settings object it is not — a
lone `1` under a parameter says something is set while refusing to say what, and the member names say it in
the same space.

**The request's message count SHALL be stated only where no message list states it.** The list's own "all N"
control sits one row below, and the same number twice over two adjacent lines is noise; where the list is
absent — a withheld column, a body that recorded none — the hop row's count is the only thing that still
answers how long the request was.

**Presence SHALL be tested as "not null", never as truthiness.** `temperature: 0` is real and common — it is
the value a reader most often wants confirmed — and `stream: false` is the fact that explains an unframed
response. A truthiness test reports both as absent, which is the opposite of what the body says.

**A stated value SHALL be bounded, with the whole value still reachable.** Naming every member of the body
means any of them can reach this line, and one long passthrough value rendered whole gave the bodies section
a horizontal scrollbar of its own. A truncated value SHALL keep the full one available rather than losing it,
under the truncation rule in `a11y.md`.

#### Scenario: A zero-valued parameter is stated, not treated as absent

- **WHEN** a request body carries `temperature: 0`
- **THEN** the parameter line states a temperature of 0
- **AND** it does not show the absent-value placeholder

#### Scenario: An absent parameter is stated as absent

- **WHEN** a request body carries no `temperature`
- **THEN** the parameter line states temperature with a de-emphasised absent-value placeholder

#### Scenario: An unrecognised parameter is named

- **WHEN** a request body carries a parameter this frontend does not recognise
- **THEN** the parameter line counts it among the members it does not name
- **AND** the name it was recorded under travels with that count, reachable by a screen reader
- **AND** its value is not stated on the line

#### Scenario: The settings a reader looks for come first

- **WHEN** a request body carries both a recognised parameter and an unrecognised one
- **THEN** the model heads the line and the always-stated four follow it
- **AND** the unrecognised one is counted at the end rather than stated among them

#### Scenario: The tool catalogue is not confusable with the tool results

- **WHEN** a request offers a catalogue of tools and its history carries tool results
- **THEN** the catalogue's count is labelled as what was offered
- **AND** it is not stated as a bare count under the same word the role filter uses

#### Scenario: The requested model is stated

- **WHEN** a request body names the model it asked for
- **THEN** the parameter line states it
- **AND** it is stated whether or not the hop row's deployment carries the same string

#### Scenario: A long parameter value is bounded, not lost

- **WHEN** a request body carries a parameter whose value is long enough to overflow the line
- **THEN** the line stays within the width of the section
- **AND** the whole value remains reachable

#### Scenario: A parameter carrying a blob is stated by its size

- **WHEN** a named setting carries an array
- **THEN** the line states its length rather than its content

#### Scenario: A named setting carrying an object states its members

- **WHEN** a named setting carries an object
- **THEN** the line states the names of its members rather than how many there are
- **AND** it states none of their values

#### Scenario: The message count is not stated twice

- **WHEN** the Request tab lists the messages and offers the role filter
- **THEN** the parameter line does not restate the message count
- **AND** a hop whose message list is absent has it stated there

### Requirement: The inspector reads bodies in tiers, and never ships one whole

Every read and decode stays server-side, exactly as the retained payload requirement states. The inspector
SHALL honour it by reading in **three tiers**, so that what crosses to the browser is bounded by what the
reader has actually asked to see:

1. **On opening a hop** — an envelope: the parameters, the per-role counts, and one entry per message giving
   its role, position and size, with its text and the arguments of anything it called each clamped to a stated
   length.
2. **On opening one message** — that message in full: its text and the arguments of anything it called, for
   that message alone.
3. **On switching to raw mode** — the body as recorded, clamped to a stated budget.

**A clamp SHALL state that it clamped, and by how much.** Silent truncation in an observability tool produces
a reader who believes they have read the whole request. Where tier 3 clamps, the response SHALL state the
recorded size alongside the size delivered.

**The envelope SHALL be bounded as a whole, not only per message.** A request of 56 messages — the average for
the messages dialect — clamped individually can still assemble into a payload larger than the rail will ever
show, so the envelope SHALL carry a total budget and SHALL state when it was reached. Past that budget a
message SHALL keep its role, position, size and the **names** of anything it called — the facts a reader
decides from — and give up only its text and its arguments, which tier 2 fetches one message at a time.

Sizes and counts SHALL be computed server-side from the recorded body. They are the numbers that let a reader
decide what to open, so they SHALL be present even for a message whose text was clamped away entirely.

#### Scenario: Opening a hop ships an envelope, not a body

- **WHEN** a hop is opened
- **THEN** what reaches the browser carries per-message roles, positions, sizes and clamped texts
- **AND** it carries no whole request or response body

#### Scenario: Opening one message fetches only that message

- **WHEN** the reader opens the full text of one message
- **THEN** that message's text and tool-call arguments are read server-side and returned
- **AND** no other message's value is returned with it

#### Scenario: A clamped raw body states what was withheld

- **WHEN** the raw body exceeds the delivered budget
- **THEN** the raw view states the recorded size and the delivered size
- **AND** it states that the content was clamped

#### Scenario: An envelope that reaches its total budget says so

- **WHEN** a request carries more messages than the envelope budget admits
- **THEN** the envelope states that it was clamped
- **AND** every message still carries its role, position and size
- **AND** a message past the budget still names anything it called, without its arguments

### Requirement: Which tab has content is decided per tab, from the hop row

Whether a hop has anything worth reading SHALL be decided from the hop row before any body is fetched, and
that decision SHALL be made **per tab**.

**A hop whose recorded response size is zero SHALL still offer its Request tab.** The removed requirement
suppressed such a hop whole. A call that returned nothing is the case a reader most wants opened, and its
request is the only record of what it attempted; only the Response tab SHALL state the absence.

**A protocol-envelope method SHALL NOT be settled as having nothing to show.** The claim that the nine of
them carry no content is measurably wrong: over the recorded log `initialize` and `tools/list` record response
bodies reaching hundreds of kilobytes, and every protocol hop records its status, its two sizes and its
duration whether or not it recorded a body. What that rule actually protected was the tool catalogue, which is
a policy about what to render — stated as if it were a fact about the log, it left nine methods blank on both
tabs. What a protocol hop states is governed by **A protocol hop states the facts its method carries**.

**A side SHALL be suppressed only where the log holds nothing for it**, and the suppression SHALL say which
case it is. A notification answered by the protocol with no body has recorded nothing to show; a method whose
body the reader is not being shown has not.

**Embedding hops SHALL no longer be suppressed.** Their request body — averaging 352 B — is the probe text,
which is the half a reader is asking about; only the response is a vector, and it is the response side that
states so.

**The Chat tab SHALL be decided from the row on the same terms**, and SHALL be offered only for a hop that
records a message history: an MCP hop and an embedding hop SHALL NOT offer it, because a protocol message and
a probe vector are not conversations. What Chat states once offered is governed by
**A span's Chat states the conversation that span received**.

**The test SHALL remain a deny-list.** An `event_kind` or `mcp_method` this frontend does not recognise SHALL
default to shown, on every tab — including Chat, whose content states its own absence of messages where the
dialect turns out to carry none.

#### Scenario: A hop that returned nothing still shows its request

- **WHEN** a hop whose recorded response size is zero is opened
- **THEN** the Request tab states what the hop sent
- **AND** the Response tab states that the hop returned no response body

#### Scenario: A protocol-envelope hop is settled without a fetch

- **WHEN** a hop whose MCP method negotiates the session is opened
- **THEN** its status, its two sizes and its duration are stated from the hop row, with no body read
- **AND** nothing further is claimed about it until its body is read

#### Scenario: A protocol hop states how its call went

- **WHEN** a hop whose MCP method negotiates the session is opened
- **THEN** it states the status, the two sizes and the duration recorded for it
- **AND** neither tab reports that the hop recorded nothing where the log holds a body for it

#### Scenario: A notification states that the protocol defines no body

- **WHEN** a hop whose method is a notification is opened
- **THEN** its response states that the protocol defines no body for it
- **AND** it does not state that nothing was recorded

#### Scenario: An embedding hop shows its probe text

- **WHEN** an embedding hop is opened
- **THEN** the Request tab states the text that was embedded

#### Scenario: An unrecognised hop kind defaults to shown

- **WHEN** a hop records an event kind this frontend does not recognise
- **THEN** its bodies are fetched and its content is shown
- **AND** its Chat tab is offered

#### Scenario: A hop with no conversation offers no Chat tab

- **WHEN** an MCP hop or an embedding hop is opened
- **THEN** no Chat tab is offered for it

### Requirement: The model-call dialects are told apart by endpoint, never by body inspection

The hop log records model calls in **three structurally different dialects**, and the inspector SHALL parse
each with a parser chosen from the hop's `request_uri`. One mapping from endpoint to parser SHALL serve every
tier, so the envelope and a single-message read cannot disagree about which parser a hop gets.

**An empty `event_kind` is a model call, not an unclassified hop.** 168 137 such hops exist table-wide, and
they carry the heaviest bodies in the system — averaging 166.9 KB and 56.6 messages against 68.7 KB and 9.84
for a hop labelled `llm_call`. Gating the inspector on `event_kind` alone would leave the heaviest and most
agentic traffic in the log unreadable.

**In the messages dialect the system prompt is a top-level field, not a message** — 99.5% of a 399-hop
sample — and message content is a list of typed blocks (`text`, `tool_use`, `thinking`), with tool results
arriving as blocks inside a **user** message. The inspector SHALL present that dialect's system field as a
system message, its `text` and `tool_result` blocks as the message's text, and its `tool_use` blocks as tool
calls — so every dialect normalises into one shape and a reader never has to know which one they are looking
at.

**Only chat completions carries its system prompt inside the message list; the other two carry it outside.**
Chat completions states it as a `system`-role message, the messages dialect as a top-level `system`, and the
Responses dialect as a top-level `instructions` (393 of 472 sampled hops). **A parser SHALL therefore never
assume the message list is the whole request** — the rule this exists for, and the one that holds however many
dialects arrive later.

**The Responses dialect records neither `messages` nor `choices`.** Its request carries `input` — a string on
most hops and an array of typed items on 47 of 472, so both SHALL be handled — and `instructions` for the
prompt; `messages` is absent from every sampled body and SHALL NOT be reached for. Its **response** carries
`output[]`, not `choices[].message`, even though it lands in the same assembled column: a `message` item's
`output_text` parts are the answer (431 of 472), and a `reasoning` item's `summary_text` (219 of 472) SHALL be
stated as reasoning and never merged into the answer. This shape states `status`, so the finish reason SHALL be
taken from it. A streamed response — 24 of 472 — frames its events **by name**
(`response.output_text.delta` and the rest) and its terminal `response.completed` frame carries the whole
response object, so a stream SHALL be decoded from that frame rather than by accumulating deltas.

Every figure above is measured over the **same 472 hops across 23 deployments, 2026-08-17..21**. The
per-day spread is wide enough that a narrower window misleads: `instructions` appears on 180 of the 185 hops
recorded on 19 August and on **none** of the 14 recorded on 18 and 20 August, and the array-shaped `input` is
absent from 19 August entirely while accounting for 10 of 11 hops on 20 August. A figure quoted from one day
of this endpoint's traffic describes that day and not the endpoint.

**Tool use is barely exercised on this endpoint, and "barely" is not "never".** One hop in 472 recorded a
`function_call` output item; `function_call_output` never appeared. Handling SHALL NOT be built out from the
API documentation on that evidence — but because only a `message` item carries text, a hop that called a tool
and said nothing else SHALL still state the call rather than render as reasoning alone with the call invisible.
An item type this frontend does not recognise SHALL render, never be silently hidden, exactly as the hop-kind
deny-list requires.

**A role SHALL NEVER be determined by matching text against the body.** In 43% of sampled messages-dialect
bodies that carry no system role at all, the literal `"role":"system"` occurs inside tool results and quoted
transcripts. A substring test therefore reports a system prompt that does not exist — and, in a view that
renders system prompts, invents one out of a user's pasted text. Roles SHALL be read from parsed structure
only.

**The endpoint families SHALL be an open set.** The frontend recognises four model-call endpoint markers and
parses three of them. `/v1/completions` recorded **zero hops in two weeks** and SHALL be left on the raw
fallback rather than fitted to a guess. An endpoint whose dialect this frontend cannot parse SHALL fall back to
the raw view rather than be parsed as the nearest known dialect, which would render a confidently wrong
message list.

#### Scenario: A hop with no event kind is inspected as a model call

- **WHEN** a hop records an empty event kind and a model-call endpoint
- **THEN** the inspector opens on it
- **AND** the dialect is chosen from the endpoint

#### Scenario: The messages dialect's system field renders as a system message

- **WHEN** a request carries its system prompt as a top-level field rather than as a message
- **THEN** the Request tab states it as a system message

#### Scenario: A quoted role string does not become a message

- **WHEN** a request carries the text `"role":"system"` inside a tool result
- **THEN** no system message is derived from that text
- **AND** the roles offered are the roles the parsed structure carries

#### Scenario: The Responses dialect's instructions render as a system message

- **WHEN** a request carries a top-level `instructions` field and a string `input`
- **THEN** the Request tab states the instructions as a system message
- **AND** it states the input as a user message

#### Scenario: An array input is read as messages

- **WHEN** a Responses request carries `input` as an array of items with typed content parts
- **THEN** each item renders as a message with its own role
- **AND** its `input_text` parts are reduced to that message's text

#### Scenario: The Responses dialect never reaches for `messages`

- **WHEN** a Responses request carries a `messages` member
- **THEN** no message is derived from it

#### Scenario: A Responses output is decoded from its items

- **WHEN** a Responses hop's assembled response carries a `message` item and a `reasoning` item
- **THEN** the answer is the `message` item's `output_text`
- **AND** the `reasoning` item's summary is stated separately from the answer
- **AND** the finish reason is taken from the response's `status`

#### Scenario: A Responses hop whose output was only reasoning is not reported as empty

- **WHEN** a Responses hop recorded a reasoning summary and no message item
- **THEN** the response is stated as available
- **AND** the reasoning summary renders

#### Scenario: A streamed Responses hop is decoded from its terminal frame

- **WHEN** a Responses response is recorded as named server-sent events
- **THEN** the answer is decoded from the `response.completed` frame
- **AND** no delta accumulation is required to produce it

#### Scenario: A Responses hop that called a tool and said nothing states the call

- **WHEN** a Responses hop's output carries a `function_call` item and no `message` item
- **THEN** the response states the name of the tool that was called
- **AND** it is not reported as having recorded nothing

#### Scenario: An unrecognised Responses item type still renders

- **WHEN** a Responses request carries an input item of a type this frontend does not recognise
- **THEN** that item still renders as a message
- **AND** it is not silently dropped

#### Scenario: An unparseable dialect falls back to raw

- **WHEN** a model call's endpoint belongs to no dialect this frontend parses
- **THEN** the inspector states that it cannot structure that body
- **AND** it offers the raw view instead of an empty panel

### Requirement: A response is stated in assembled form, with the recorded body as a second mode

The Response tab SHALL offer two modes: **Assembled**, the response as the client received it, and **Raw**,
the body as recorded.

**The recorded bytes SHALL be reached through one switch, offered on both the Request and the Response tab.**
"Show me what was recorded" is one question about whichever side is open, so it is one control in one place
rather than a mode that exists on one side only. **There SHALL be no named "assembled" mode**: it was never
something a reader chose — it is simply what a tab shows when it is not showing bytes — and naming it made a
two-option control out of a single toggle.

**While the recorded bytes are shown, a control that narrows the structured view SHALL NOT be offered.** The
request's role filter narrows a list, and the bytes are not a list.

**The recorded bytes SHALL be shown readably, not dumped.** A body arrives as one unwrapped line of up to
half a megabyte. It SHALL be pretty-printed where it parses, syntax-highlighted, foldable and copyable —
through the console's own code viewer rather than a preformatted block — and shown as recorded where it does
not parse.

**A control SHALL sit on the ground of the section it is in.** The bodies section's ground is not the rail's,
and a pinned control row carrying the rail's background reads as a lighter stripe across the panel.

**The control that reaches the recorded bytes SHALL sit at the end of that side's facts line**, in the same
place on both tabs — the line says what this half of the call was, and the last thing on it is "or show me it
as recorded". It is therefore always in view, whatever the body below it does.

**It SHALL be the same control the rest of that surface is made of, carrying its state programmatically.** A
toggle-switch widget on a line of facts reads as a setting for the screen rather than as one more control on
that line, and the one it replaced hid its accessible node behind a label a pointer could not reach.

**Every statement that there is nothing to show SHALL be made in one treatment.** A withheld column, a body
the protocol defines none of, a request whose method is the whole of it — these differ in what they say, not
in what kind of thing they are, and rendering one as loose text beside another in a bordered note made the
section look like two screens.

**A fact stated about the hop SHALL remain stated over the recorded bytes.** Only a control that narrows the
structured view is withdrawn there. What answered and at what cost describes the same response whichever form
of it is on screen, and withdrawing it makes the raw mode read as a different hop.

**The control that opens a turn in full SHALL sit inside that turn**, not beneath it: below the bubble it
reads as a control for the conversation rather than for the turn it opens.

**A chosen filter SHALL be marked in the accent colour, not by a lighter panel.** A selected chip filled with
the next background layer reads as a slab of background rather than as a selection, and a row of them reads
as disabled. The state SHALL remain programmatic as well as visual, under the toggle-state rule.

**Assembled SHALL be stated as a message**, in the same card the request's history rows use, carrying the
assistant role, the recorded size, the text and the calls the response asked for. A response is one assistant
message; stating it as bare text made the two tabs read as two different tools.

**A call the response asked for SHALL state its arguments and its id**, not its name alone. All three are
recorded in the body: the name says which tool, the arguments say what was asked of it, and the id is what
the message answering it quotes back in the next request. Carrying the name alone discarded the other two and
left a result unpairable.

**The response's own facts SHALL be stated outside that card, and above it.** How the tokens split and what
came from cache are facts about the response rather than about the message it carried — and the tab holds
exactly one answer, so they head the reply instead of trailing a card the reader has to scroll past. The clamp
and the note about a requested tool with no recorded call stay with the text they qualify.

**The model that answered SHALL be stated only where it differs from the model the request asked for.** The
request line names the asked-for model one tab away, and repeating the same string on the response says
nothing; a difference is the thing no other field on the screen can tell the reader, and it is exactly what
this fact exists for.

**The upstream's id for the completion SHALL NOT be stated on this line.** It is not a fact a reader scans a
line for — it is one they copy, once, to take to the provider's own logs — and it sits in the recorded bytes
the control at the end of this line opens. Carrying it here cost the line a third of its width for a value
nobody reads in place.

**Assembled SHALL be built from the shape its dialect records, not from one shape for all of them.** The
Responses dialect lands in the same assembled column while recording `output[]` rather than
`choices[].message`, so a single decoder finds nothing there and reports a hop that recorded a full response as
having recorded nothing. The decode SHALL therefore be chosen by dialect.

**Assembled SHALL be the mode a hop opens in**, and SHALL be built from the assembled-response column where
the caller's schema reports it — averaging 1 511 characters against 52.8 KB for the raw body, roughly 35×
smaller, and already carrying the finish reason, the message and the full usage breakdown. Where that column
is absent from the schema, Assembled SHALL be decoded from the recorded response body. The column is a later
addition to the hop log and an instance predating it does not persist it, so its absence SHALL be handled, not
assumed away.

**Raw SHALL be fetched only when selected**, and clamped per the tier rules above.

**Whether the response was framed SHALL be stated from the request, not derived from the response.** The
request body's `stream` flag is present on every sampled hop and corresponds exactly to whether the recorded
response is a sequence of server-sent frames; the parameter line already states it. The Response tab SHALL
NOT count frames, which needs a pass over the whole raw body to state a number that answers no question the
flag does not.

#### Scenario: A hop opens on the assembled response

- **WHEN** a hop with a recorded response is opened and the Response tab is selected
- **THEN** the assembled response renders
- **AND** the raw body has not been fetched

#### Scenario: The assembled response survives a missing column

- **WHEN** the caller's schema does not report the assembled-response column
- **THEN** the assembled view is decoded from the recorded response body

#### Scenario: Raw is fetched on selection

- **WHEN** the reader selects the raw mode
- **THEN** the recorded body is read server-side and returned clamped

#### Scenario: The assembled response is stated as a message

- **WHEN** a response carrying text is opened
- **THEN** it renders in the same card the request's history rows use
- **AND** it states the assistant role and the recorded size

#### Scenario: A response's calls state their arguments and ids

- **WHEN** a response asked for a tool call
- **THEN** the call states its name, its arguments and the tail of its id

#### Scenario: The raw switch is offered on both sides

- **WHEN** either the Request or the Response tab is open
- **THEN** a single switch offers the recorded bytes for that side
- **AND** no separate "assembled" option is offered

#### Scenario: The recorded bytes are read only when the switch is turned on

- **WHEN** the Request tab is opened and its raw switch is off
- **THEN** the recorded body has not been read
- **AND** turning the switch on reads it and states it

#### Scenario: The recorded bytes are shown pretty-printed

- **WHEN** the raw switch is on and the recorded body parses as JSON
- **THEN** it renders pretty-printed rather than as the single line it was recorded as

#### Scenario: The raw control closes the facts line

- **WHEN** either the Request or the Response tab is open
- **THEN** the control reaching the recorded bytes is the last element of that side's facts line
- **AND** its pressed state is exposed programmatically

#### Scenario: The response's facts are stated over the recorded bytes

- **WHEN** the response's raw switch is on
- **THEN** the line stating what answered is still present

#### Scenario: The role filter is not offered over the recorded bytes

- **WHEN** the request's raw switch is on
- **THEN** the role filter is not offered

### Requirement: MCP and embedding hops state the facts their kind actually has

**An MCP hop SHALL state its method, its tool name, its toolset, its arguments and its result.** The toolset
SHALL be taken from the hop's deployment: in one measured conversation all 277 MCP hops shared a single parent
span and were distinguishable only by it. **No session field SHALL be stated** — the hop log records no session
column for MCP, and a field with no source is a field that will be filled with the wrong thing.

**Each of those facts SHALL be stated where the column it comes from is stated.** The method, the tool name
and the toolset are plain hop-row columns and SHALL render below the tab strip, visible on every tab; the
arguments are the request column and SHALL render on the Request tab; the result is the response column and
SHALL render on the Response tab. The hop's two halves are read in one round trip, so neither tab waits on
the other — the split is a matter of where a fact is stated, not of when it is fetched.

`tools/call` is the only MCP method the inspector opens on; it averages 5.5 KB in and 123 KB out, so its
result SHALL be subject to the same clamp as any other raw content.

**Both halves SHALL be presented as formatted JSON where what was recorded is JSON**, and exactly as recorded
where it is not. A tool returns its result as one line, and a reader cannot pick a field out of a JSON
document written that way; the arguments are already stated formatted, and the two halves of one hop SHALL NOT
be formatted by different rules. **The sizes stated about a body SHALL remain the recorded ones** —
reformatting adds whitespace that the log never held, and a clamp that counted it would report a size the hop
does not have.

**An embedding hop SHALL state the model, the number of inputs, the dimension count, the token count and the
text that was embedded.** It SHALL NOT render the vector: 96% of recorded vectors arrive base64-encoded, so
any depiction of one requires decoding it first, and the result is decoration — the reader is asking what was
embedded, not what the coordinates were.

**The dimension count SHALL be stated on the Response tab**, which is the column it is read from, and that
tab SHALL NOT be presented as having nothing to read. The vector itself is still never rendered, so the
count is what the response side has to say — and it is exactly the answer a reader checking that a probe
returned a usable embedding is after. Stating it beside the request's own facts put a response fact on the
request side, where a reader had no reason to look for it.

**The probe text SHALL be clamped like any other body-derived content.** A single input averages 352 B, but
the endpoint accepts an array and a batch is assembled into one text here — the one path that would otherwise
walk past the payload budget every other read honours.

#### Scenario: An MCP hop states its arguments, its result and its toolset

- **WHEN** an MCP tool call is opened
- **THEN** the method, the tool name and the toolset render below the tab strip
- **AND** the Request tab states the arguments sent and the Response tab states the result returned

#### Scenario: A JSON tool result is presented as formatted JSON

- **WHEN** an MCP tool call whose recorded result is a JSON document is opened
- **THEN** the Response tab presents that result as formatted JSON
- **AND** the size it states is the size the log recorded, not the size after formatting

#### Scenario: A tool result that is not JSON is presented as recorded

- **WHEN** an MCP tool call whose recorded result is not JSON is opened
- **THEN** the Response tab presents the text exactly as it was recorded

#### Scenario: No MCP session field is stated

- **WHEN** an MCP hop is opened
- **THEN** no session field is stated

#### Scenario: An embedding hop states its input, not its vector

- **WHEN** an embedding hop is opened
- **THEN** the Request tab states the model, the input count and the embedded text
- **AND** the Response tab states the dimension count
- **AND** neither renders a depiction of the vector

#### Scenario: A batch of embedding inputs is clamped and says so

- **WHEN** an embedding hop's inputs assemble into more text than the budget admits
- **THEN** the probe text is clamped
- **AND** the panel states the recorded size and the delivered size

### Requirement: A protocol hop states the facts its method carries

Beyond the outcome every hop states, an MCP protocol hop SHALL state what its own method actually recorded,
decoded server-side into facts rather than shipped as a body.

**Both halves SHALL be stated as the JSON they were recorded as, formatted** — the parameters the client sent
on the Request tab, the result the server answered with on the Response tab. A protocol message is a request
and a response like any other, and it is stated in the shape every other body is stated in.

**They SHALL NOT be summarised into named facts.** Decoding each method into a line — a negotiated version
here, a tool count and names there — describes a response instead of showing one, and makes two protocol
messages read as two different screens. It also needs a decoder per method, so an unfamiliar method has
nothing to fall back to but a blank.

**The result SHALL be clamped like any other raw content.** A `tools/list` result carries every tool's schema
and reaches hundreds of kilobytes; the clamp is what bounds it, and it states what it withheld.

This does not reopen the tool-catalogue rule, which governs a **model call's** request line: that line states
a count because the catalogue is one member of a body the reader opened for other reasons. A `tools/list` hop
*is* the catalogue — it is what the reader selected the span to see.

#### Scenario: A protocol hop states the result it was answered with

- **WHEN** an `initialize` or `tools/list` hop is opened
- **THEN** its Response states the recorded result as formatted JSON
- **AND** a method this console has never met is stated the same way rather than left blank

#### Scenario: A protocol result too large for the budget states what it withheld

- **WHEN** a protocol result exceeds the delivered budget
- **THEN** it is clamped
- **AND** the panel states the recorded size and the delivered size

### Requirement: Each side of the inspector is gated by its own recorded column

The request body and the response body are separate columns of the hop log, so the caller's entitlement to
them is separate. The inspector SHALL treat them separately: a caller whose schema reports one and not the
other SHALL get the tab they are entitled to rather than neither.

**The Chat tab SHALL be gated by the request column alone.** The history is the substance of that tab and it
comes from the request body; the trailing answer comes from a response column and SHALL be stated as withheld
where none is granted. Gating Chat on both columns would withdraw the history over the absence of the answer,
which is the failure this per-column rule exists to prevent.

**A withheld side SHALL be stated once, not on every hop.** The statement belongs with the view's own header,
where it explains the state for the whole session, and individual hops SHALL stay silent about it — a
per-hop explanation repeats a fixed fact once per click. The withheld answer inside Chat is the exception and
is stated where the answer would have been, because there it marks the position of something absent rather
than explaining an entitlement.

**The statistics SHALL stay visible when a body is withheld.** Sizes, token counts, message counts, status,
duration and cost are plain columns and are not gated by the body grant; withdrawing them along with the
bodies would withdraw facts the caller is entitled to.

**A withheld body and a failed read SHALL be stated as different things**, as SHALL a hop that recorded
nothing — three distinct facts, and rendering any two identically hides an outage behind an entitlement or an
entitlement behind an empty result.

**A kind whose two halves are different shapes SHALL still state each half by its own grant, on the tab that
reads that column.** An MCP hop's arguments are the request column and its result the response column, and an
embedding hop's dimension count is its only response-column field. Where one column is granted and the other
is not, the granted half SHALL render on its own tab and the withheld half SHALL be stated as withheld on
its — never as a hop that recorded nothing, which describes the caller's entitlement as a property of the
hop.

#### Scenario: A caller entitled to one side gets that side

- **WHEN** the caller's schema reports the request body column but no response body column
- **THEN** the Request tab renders
- **AND** the Response tab states that it is withheld

#### Scenario: A caller entitled to the request alone still gets Chat

- **WHEN** the caller's schema reports the request body column but no response body column
- **THEN** the Chat tab is offered
- **AND** it renders the history and states that the answer is withheld

#### Scenario: A caller entitled to the response alone is offered no Chat

- **WHEN** the caller's schema reports a response body column but not the request body column
- **THEN** the Response tab renders
- **AND** no Chat tab is offered

#### Scenario: A withheld side is explained once

- **WHEN** a side is withheld and the reader opens several hops
- **THEN** the explanation is stated with the view's header
- **AND** no hop repeats it

#### Scenario: Statistics survive a withheld body

- **WHEN** both body columns are absent from the caller's schema
- **THEN** the hop's sizes, tokens, status, duration and cost still render

#### Scenario: Withheld, failed and empty are three different statements

- **WHEN** a body is withheld, a read fails, and a hop recorded nothing
- **THEN** each is stated differently from the other two

#### Scenario: A half-granted MCP hop states which half was withheld

- **WHEN** the caller's schema reports the request body column but no response body column
- **AND** an MCP tool call is opened
- **THEN** the arguments render on the Request tab
- **AND** the Response tab states the result as withheld rather than as recorded nothing

#### Scenario: A half-granted embedding hop states its dimension count as withheld

- **WHEN** the caller's schema reports the request body column but no response body column
- **AND** an embedding hop is opened
- **THEN** the probe text renders on the Request tab
- **AND** the Response tab states the dimension count as withheld rather than as absent
