## ADDED Requirements

### Requirement: Conversation message content is the recorded transcript

The conversation detail view SHALL render the conversation's **recorded** message text — the words the user
and the assistant actually exchanged, as `dial_usage_log` stored them — and MUST NOT render fabricated,
derived or sample content in their place.

The presentation SHALL be the one the view already uses: alternating user and assistant messages, each
assistant message carrying its turn's real token total, cost, hop count and duration, its rating counts, and
the control that opens that turn's trace. Only the message text changes. The notice stating that the messages
are samples SHALL be removed, because the statement it makes is no longer true.

The transcript MUST NOT interleave tool calls, model steps or embeddings between the messages. The hop chain
is the Trace view's subject, and a reader who wants it has a control on every assistant message and a view
switch on the page.

An assistant message SHALL be bound to its turn by **trace id**, not by its position in the rendered list. A
transcript assembled from one bounded read and a turn list assembled from another can differ in length or in
membership, and a positional binding would then attach one turn's figures to another turn's words.

An assistant message whose recorded response carries no text content SHALL render the view's explicit
unavailable placeholder rather than an empty bubble. A response with empty content is a response that put its
output somewhere other than text — commonly in tool calls — and a blank bubble would read as an assistant
that said nothing.

#### Scenario: Recorded messages render in place of sample content

- **WHEN** the detail view loads a conversation whose hop log carries its bodies
- **THEN** the user and assistant messages show the recorded text
- **AND** no notice claims the messages are samples

#### Scenario: The transcript carries no machinery between messages

- **WHEN** a turn's hop chain includes tool calls and embeddings
- **THEN** none of them render between the messages of the transcript
- **AND** the assistant message still offers the control that opens that turn's trace

#### Scenario: An assistant message takes its figures from its own turn

- **WHEN** the transcript carries a turn the bounded turn list does not, or lists them in a different order
- **THEN** each assistant message shows the figures of the turn whose trace id it shares
- **AND** no assistant message shows another turn's figures

#### Scenario: A response with no text content is stated, not blank

- **WHEN** a turn's recorded response carries no text content
- **THEN** that assistant message renders the explicit unavailable placeholder

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
set of turns in the rollup and no entry hop under their `chat_id`, and that case is governed below.

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

**The entry-hop test MUST NOT be relaxed.** A conversation can record hops under its `chat_id` and yet have
no entry hop among them, because the hop that entered DIAL was logged with no `chat_id` of its own. This is
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

### Requirement: Assistant text is read from the assembled response, or decoded from the raw body

A request body is always plain JSON. An assistant's text has **two** possible sources, and the transcript
SHALL treat both as first-class.

**Preferred source — `assembled_response`.** Where the producer persists it, this column holds the merged
response message: a single JSON object whose first choice's message content is the readable answer, already
reassembled from whatever streaming the call used. Reading it avoids reassembling a chunk transcript.

**Guaranteed fallback — `response_body`.** The assembled column is not always populated. It is null for every
row ingested before the producer began writing it, and hop rows live for a year, so a recently upgraded
instance carries up to a year of conversations for which the raw body is the **only** source of assistant
text. A minority of rows, current ones included, also store a value that is not JSON. The fallback is
therefore an ordinary operating mode, not an error path, and SHALL be implemented and tested as such.

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
cases are indistinguishable to a reader and SHALL be indistinguishable in behaviour. A turn SHALL NOT render
as unavailable while a decodable raw body for it exists.

Where neither source yields text, the turn SHALL render the view's unavailable placeholder. It MUST NOT yield
the raw body, a partial fragment, or a fabricated substitute: a malformed body is an unknown message, and
rendering bytes at the reader would present transport detail as conversation.

A response whose decoded content is empty, or which carries no content key at all, SHALL NOT be treated as an
empty step. Its output is in the response's tool calls, whose names exist **only** in a response body — the
hop log carries no column for them.

#### Scenario: The assembled response is preferred where present

- **WHEN** a turn's assembled response is present and parseable
- **THEN** the assistant message is its first choice's message content
- **AND** the raw response body is not decoded for that turn

#### Scenario: A null assembled response falls back to the raw body

- **WHEN** a turn's assembled response is null because the row predates the column
- **THEN** the assistant message is decoded from the raw response body
- **AND** the turn does not render as unavailable

#### Scenario: A non-JSON assembled response falls back to the raw body

- **WHEN** a turn's assembled response is present but is not parseable as JSON
- **THEN** the assistant message is decoded from the raw response body

#### Scenario: A streamed body is reassembled from its chunks

- **WHEN** the fallback decodes a body that is a stream of event chunks
- **THEN** the assistant message is the concatenation of their content deltas in arrival order

#### Scenario: A single-object body is read from its first choice

- **WHEN** the fallback decodes a body that is one JSON object
- **THEN** the assistant message is that object's first choice's message content

#### Scenario: An MCP body is read from its JSON-RPC result

- **WHEN** the fallback decodes an MCP hop's body written as JSON-RPC over server-sent events
- **THEN** its text is the concatenation of the result's content parts

#### Scenario: The format is decided by the body, not by a flag

- **WHEN** the fallback decodes a response body
- **THEN** the format is determined from the body's own shape
- **AND** no streaming column of the hop log is consulted

#### Scenario: Neither source yields a placeholder, not raw bytes

- **WHEN** the assembled response is unusable and the raw body cannot be parsed in any of the three formats
- **THEN** that message renders the unavailable placeholder
- **AND** no part of either raw value is rendered

### Requirement: The body columns are schema-gated for two independent reasons

The fetched `dial_usage_log` entity schema SHALL be the sole authority on which body columns a query may
name. Two different conditions remove a column from that schema, they are **not** interchangeable, and a
projection that names an absent column is rejected with the whole query — so both must be handled or the
Chat view fails outright rather than degrading.

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
an instance that predates it costs the whole transcript query, which is the one failure this gate exists to
prevent — and it is a failure a full administrator would see, so no amount of permission masks it.

**`response_body` SHALL be optional on exactly the same terms**, and for a reason that follows directly from
the gate below: the view is offered when *either* response column is present, so an instance reporting only
the assembled column is a supported state — and a projection that names `response_body` regardless rejects
the whole query on it. Neither response column may be named unconditionally. Gating one and hard-coding the
other makes the gate and the projection two different answers to the same question, which is the failure this
requirement exists to prevent.

The Chat view SHALL be offered when the schema reports `request_body` **and at least one** of
`assembled_response` or `response_body`. The request body has no substitute — it is the only record of what
the user said — while either response column can supply the assistant's text. An instance that carries
`response_body` but not `assembled_response` SHALL therefore offer a fully functional Chat view.

The frontend MUST NOT implement an access check of its own. The service's column-level access control is the
gate, and a second gate maintained here would be a second answer to the same question.

Where the Chat view is not offered, the view SHALL state that the transcript is not available and SHALL keep
the Trace view, the header, the panels and every figure on the page fully functional. It MUST NOT render an
error, and MUST NOT imply the conversation recorded no messages.

A schema read that **fails** is not the same as a schema that omits a column, and SHALL be reported as a
failure rather than silently withholding the Chat view.

#### Scenario: A full administrator on a current instance is offered the transcript

- **WHEN** the fetched hop-log schema reports the request body and both response columns
- **THEN** the Chat view is offered and renders the recorded transcript

#### Scenario: An instance without the assembled column still offers the transcript

- **WHEN** the fetched schema reports the request body and the raw response body but not the assembled response
- **THEN** the Chat view is offered
- **AND** no query names the assembled response column
- **AND** the assistant text is decoded from the raw response body

#### Scenario: The assembled column is named only when the schema reports it

- **WHEN** the transcript body query is built and the schema does not report the assembled response
- **THEN** the select does not name it
- **AND** the query returns rows

#### Scenario: The raw response column is named only when the schema reports it

- **WHEN** the fetched schema reports the request body and the assembled column but not `response_body`
- **THEN** the transcript query does not name `response_body`
- **AND** the Chat view is offered and renders the transcript

#### Scenario: A caller without the body columns is not offered the transcript

- **WHEN** the fetched hop-log schema reports none of the body columns
- **THEN** the Chat view is not offered
- **AND** the view states that the transcript is unavailable to this caller rather than showing an error
- **AND** the Trace view, the header and the panels still render

#### Scenario: No frontend role check gates the transcript

- **WHEN** the detail route decides whether to offer the Chat view
- **THEN** the decision reads only the fetched entity schema
- **AND** no role, scope or permission of the session is consulted

#### Scenario: A failed schema read is reported as a failure

- **WHEN** the hop-log schema cannot be fetched
- **THEN** the view reports a failure rather than presenting the transcript as unavailable to the caller

### Requirement: Hop bodies are read and decoded server-side and never sent to the browser

Every read and every decode of a `request_body` or `response_body` value SHALL happen on the server, and
only the assembled transcript SHALL be sent to the client. Bodies reach megabytes in a single row — a sampled
response body was 1.4 MB and a 116-turn conversation's newest request body was 405 KB — so shipping them
would move the cost of the page onto the reader's connection and put encrypted-at-rest content into a client
bundle.

Every query reading the hop log SHALL predicate on `chat_id`. The table carries a bloom-filter index on
`chat_id`, `trace_id` and `core_span_id`, which makes such a read fast; a read predicated on an attribute
instead — `event_kind`, for instance — took over 120 s on a two-core virtual machine and took the service
down with it. A hop-log query MUST NOT be issued without a chat predicate.

The entry-hop read SHALL be split so the expensive columns are named only where needed: a first query naming
no body column establishes the conversation's entry hops, their times, their deployments and their message
counts, and a second names the body columns for the rows the assembly actually requires.

**A body query SHALL additionally be bounded by a range over the recorded times of the exact rows it
fetches.** The hop log is partitioned by the day of `request_time`, and a chat predicate alone does not prune
a single partition: a measured body read filtered only by `chat_id` and `trace_id` exceeded the service's
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
- **THEN** its filter includes an equality predicate on the conversation id

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

### Requirement: A turn is titled by the question it answered

The turn list SHALL title each row with that turn's own user question, and SHALL carry the turn number and
trace id as its subtitle. A reader scanning a conversation's turns is looking for the exchange, not for an
identifier; the number and the trace id identify a turn once it has been found, which is a subtitle's job.

The question SHALL be the last user message the turn contributed to the transcript. A turn's request body ends
with the user's new message, so its last user message is the question that turn answered. It SHALL be derived
from the assembled transcript rather than from a query of its own: the transcript is already fetched, decoded
and attributed, so one rule covers both fetch paths and the titles cost nothing.

**A turn with no question SHALL fall back to its turn number**, per turn rather than for the list as a whole.
A conversation with no entry hop has no transcript, and a caller whose schema withholds the body columns is
told nothing about any turn — the turn list SHALL remain usable in both cases, since its figures come from the
rollup and do not depend on a body.

An open hop chain SHALL be titled the same way, with the turn number and trace id beneath it: a reader who
reached a chain from a list row is looking at the same turn and SHALL see the same thing they clicked. Both
SHALL read one derivation of the questions, so the two cannot disagree about a turn.

The question SHALL be truncated with the shared ellipsis-tooltip control, so a long question stays reachable
rather than being cut off.

#### Scenario: Each turn is titled by its own question

- **WHEN** the turn list renders a conversation whose transcript is available
- **THEN** each row is titled with the user question that turn answered
- **AND** the turn number and trace id appear as that row's subtitle

#### Scenario: A turn without a question keeps its number

- **WHEN** a turn contributed no user message to the transcript
- **THEN** that row is titled with its turn number
- **AND** the other rows keep the questions they do have

#### Scenario: An open hop chain is titled by the same question

- **WHEN** a turn's hop chain is opened
- **THEN** it is titled with the question that turn answered
- **AND** the turn number and trace id appear beneath it

### Requirement: A turn renders as a flat, typed, filterable event stream

A turn's hops SHALL render as one flat numbered stream of typed events, not as a nested tree. The span tree is
one root with hundreds of direct children and a second level only under a tool call, so nesting conveys almost
nothing; typing and filtering convey what a turn consisted of.

**An event is not a hop.** One model call emits a reasoning marker, its answer, and one event per tool it
requested, so the stream is longer than the hop list — 384 hops of one measured turn become 446 events. Events
SHALL be typed as: the turn's question and its totals (the frame), assistant text, tool request, tool result,
reasoning, empty, error, session, embedding, and a generic type for anything unrecognised.

**Typing SHALL be a deny-list at every level.** An `event_kind` or `mcp_method` this frontend does not
recognise SHALL render as a shown, generically-typed row: silently dropping something unfamiliar is the worse
failure in an observability tool. Two cases SHALL be handled explicitly — a hop with no `event_kind` is not
unknown but an unlabelled model call, classified by its endpoint (53 179 such hops exist table-wide); and a
`count_tokens` endpoint is utility rather than conversation.

**`route` hops SHALL be excluded from the stream entirely.** All 5 611 of them carry an empty `chat_id`: they
are scheduler REST calls and never part of a conversation.

**A failed hop SHALL emit a single error event whatever kind of hop it is**, so a failure can never be buried
among the rows of the work it was attempting. A failure is either a false success flag or a status of 400 or
above.

**A reasoning event SHALL state its token count and MUST NOT claim to carry content.** The reasoning text is
recorded nowhere; the count is its only trace, and `reasoning · 264 tok` says more than an empty row.

**The tool-request to tool-result gap SHALL be surfaced, not hidden.** 85 tools were requested on the measured
turn and 57 results recorded; the missing 28 are functions the calling application handles internally, which
never cross a network boundary and so were never logged. A request with no recorded result SHALL say so. The
surplus SHALL be resolved **by count per tool name, never by identity** — the log pairs nothing, so no claim
may be made about which specific request went unanswered.

**The stream SHALL offer one filter control per event category, and SHALL start with every category shown.** An
observability tool that opens by hiding what it recorded makes the reader's judgement for them, so narrowing is
the reader's action.

**Activating a category SHALL isolate it**, showing that category alone; activating it again SHALL restore every
category, so one control both narrows and releases. A separate control SHALL also restore every category. Each
control SHALL name its category and nothing more, and SHALL expose programmatically whether it is the isolated
one rather than signalling it by appearance alone. **How much of the stream is showing SHALL be stated once**,
beside the filters, rather than as a count on each of them.

**The frame SHALL NOT be offered as a category, and SHALL be shown only while the whole turn is.** It describes
the turn rather than anything that happened inside it, so a view narrowed to one category SHALL answer with that
category alone — asking for the tool calls answers with tool calls, not with tool calls between two rows about
something else.

**Every category SHALL remain selectable whether or not the turn recorded any of it**, and isolating one the
turn has none of SHALL state that plainly. Asking "were there any errors" is a real question and *none* is a
real answer; a control that cannot be pressed gives neither. **No filter control SHALL be disabled, including
the one that is currently active**: the pressed state already says which filter is on, and disabling the active
control drops it out of the tab order — so the reader who narrowed by keyboard cannot get back.

**Line numbers SHALL reflect position in the unfiltered stream**, so a narrowed view still says where in the
turn each row sits, and the stream SHALL state how many rows of the total are showing. Both sides of that
count SHALL exclude the frame, which is not one of the turn's rows: counting it in the total but not in a
narrowed selection compares unlike things. The count is the only feedback that a filter took effect — the rows
themselves change silently — so it SHALL be announced to assistive technology when it changes.

**A frame row SHALL NOT be a control.** It carries the question and the turn's totals and stands for no hop, so
there is nothing to open: rendering it as a control that happens to be unavailable advertises an action that
does not exist.

**Deriving the stream requires the model calls' own response bodies**, which are the only record of whether a
call answered and which tools it asked for. Those SHALL be read server-side for the model-call hops only,
bounded by a cap, with only the decoded text and tool names crossing to the client. On the measured turn that
is 43 of 384 hops and 2.04 MiB of the trace's 16.67 MiB. Where the response column is not in the caller's
schema, or a call falls past the cap, its rows SHALL be typed generically rather than reported as empty. A hop
the log records as having returned **no bytes** is the exception: its emptiness is a recorded fact, not an
unread body, and it SHALL be typed empty so the two remain distinguishable.

#### Scenario: One model call emits several events

- **WHEN** a model call answered and requested a tool
- **THEN** the stream carries a text event and a tool-request event for that one hop

#### Scenario: An unlabelled model call is typed as conversation

- **WHEN** a hop records no event kind but a model endpoint
- **THEN** its events are typed as a model call's

#### Scenario: An unrecognised hop is shown

- **WHEN** a hop records an event kind this frontend does not recognise
- **THEN** it renders as a generically-typed row rather than being dropped

#### Scenario: A route hop is excluded

- **WHEN** a trace contains a hop whose event kind is route
- **THEN** the stream contains no event for it

#### Scenario: A failed hop is one error event

- **WHEN** a hop failed
- **THEN** it emits a single error event and no other event

#### Scenario: A reasoning event states its tokens

- **WHEN** a hop recorded reasoning tokens
- **THEN** a reasoning event states that count
- **AND** it does not claim to carry the reasoning text

#### Scenario: An unanswered tool request says so

- **WHEN** more requests for a tool were made than results recorded for it
- **THEN** the surplus requests are marked as having no recorded result

#### Scenario: Every category is shown until the reader narrows

- **WHEN** the stream first renders
- **THEN** events of every category are shown
- **AND** each category offers a control naming it
- **AND** the stream states how many rows of the total are showing

#### Scenario: Activating a category isolates it

- **WHEN** a category's control is activated
- **THEN** only that category's events are shown
- **AND** activating it again shows every category

#### Scenario: A turn that recorded no hops says so

- **WHEN** a turn's trace returned no hops
- **THEN** the stream states that nothing was recorded
- **AND** it does not render the frame with nothing between its two rows

#### Scenario: A category with no events stays visible and operable

- **WHEN** the turn recorded no events of some category
- **THEN** that category's control remains selectable
- **AND** isolating it states that none were recorded

#### Scenario: The active filter is not disabled

- **WHEN** every category is showing
- **THEN** the control that restores every category states that it is the active one
- **AND** it is not disabled

#### Scenario: A frame row is not a control

- **WHEN** the stream renders the turn's question and totals
- **THEN** neither row is rendered as a control

#### Scenario: The showing count excludes the frame from both of its figures

- **WHEN** a category is isolated
- **THEN** the stated count compares that category's rows against the turn's rows
- **AND** neither figure counts the frame

#### Scenario: A model call recorded as returning no bytes is empty, not unread

- **WHEN** a model call's recorded response size is zero
- **THEN** its row is typed empty
- **AND** it is distinguishable from a call whose body was not read

#### Scenario: A narrowed view shows its category alone

- **WHEN** a category is isolated
- **THEN** the turn's question and totals are not shown
- **AND** restoring every category shows them again

#### Scenario: An isolated category with nothing in it says so

- **WHEN** a category the turn recorded none of is isolated
- **THEN** the stream states that the turn recorded no events of that kind

#### Scenario: Line numbers survive filtering

- **WHEN** the stream is filtered
- **THEN** each visible row keeps its number from the unfiltered stream

### Requirement: A hop's own request and response are read on demand

The hop detail SHALL state what the selected hop sent and what came back, decoded from its recorded bodies.
An `llm_call` hop SHALL state the last message it sent and its response text; an `mcp` hop SHALL state its
JSON-RPC arguments and its tool result. A hop whose response carried no text SHALL state the tool names it
requested, which exist only in a body — the hop log has no column for them.

**Only the last message of an `llm_call` request SHALL be stated, and only for a role the transcript admits.**
An inner agent-loop request carries a system prompt, a tool catalogue and the whole accumulated history, none
of which is what a reader opening one hop is asking about — and the first two must never reach the screen. The
role filter that protects the transcript SHALL apply here too, so this cannot become a second route to a
leaked prompt.

**Which hops have text worth opening SHALL be decided from the hop row, before any body is fetched.** The
section SHALL be suppressed, and the reason stated in its place, when the hop's recorded response size is
zero, when its MCP method is one of the nine protocol-envelope calls, or when its event kind is an embedding — a response that is a float vector and a request that is the probe
string producing it. On the sampled 384-hop turn this settles 284 hops with no fetch at all: 60 that returned
nothing, 116 session-setup calls and 108 embeddings, leaving 57 `tools/call` and 43 `llm_call`.

**That test SHALL be a deny-list and MUST NOT be inverted into an allow-list.** An MCP method or event kind
this frontend does not recognise SHALL default to shown. In an observability tool, silently hiding something
unfamiliar is the worse failure: an empty panel is a puzzle a reader can resolve by looking at it, while a hop
that never offers its text is a fact they cannot discover. A recorded response size that is absent rather than
zero is unknown, and an unknown size SHALL NOT be read as a claim that nothing came back.

A suppressed hop SHALL keep its row in the hop chain, with its timing, status and nesting intact — only the
text section is withheld, and it SHALL state why rather than rendering an empty panel.

**These bodies SHALL be fetched one hop at a time, when that hop is opened, and never with the hop chain.** A
measured 384-hop turn carried 99.26 MiB of request bodies and 16.67 MiB of responses, with one hop reaching
4.00 MiB; reading them with the chain would ship a hundred megabytes to render rows a reader may never open.
The read SHALL be filtered by conversation, trace and hop, and SHALL carry the same `request_time` range bound
as the transcript read — a single hop is a single instant, so the bound is one partition.

Decoding SHALL happen server-side and only the decoded text SHALL reach the client, exactly as the transcript
does. The same schema gate applies: where the body columns are not in the caller's schema the section SHALL be
absent entirely rather than explaining its own absence on every hop. A hop that recorded nothing readable and
a hop whose read failed SHALL be stated as the different facts they are.

Re-opening a hop already read SHALL issue no second read.

A read that **failed** SHALL be reported as a failure rather than in the same presentation as a hop that
recorded nothing — the two are the different facts named above, and rendering them identically hides an outage
behind an ordinary empty result. A decoded text long enough to scroll SHALL remain reachable by keyboard: a
scroll container with no tab stop puts everything past its first screenful out of reach for a reader with no
pointer.

#### Scenario: A hop's texts are read only when it is opened

- **WHEN** a turn's hop chain is rendered
- **THEN** no hop body is fetched for a hop that has not been opened
- **AND** opening one hop fetches that hop's bodies alone

#### Scenario: A hop with nothing worth reading is settled without a fetch

- **WHEN** a hop whose response size is zero, whose method is session setup, or whose kind is an embedding is
  opened
- **THEN** no body is fetched for it
- **AND** the section states why that hop has no text
- **AND** the hop keeps its row, its timing, its status and its nesting

#### Scenario: An unrecognised hop defaults to shown

- **WHEN** a hop records an MCP method or event kind this frontend does not recognise
- **THEN** its bodies are fetched and its text is shown

#### Scenario: An llm_call hop states its prompt, not its history

- **WHEN** an `llm_call` hop whose request carried a system prompt and prior turns is opened
- **THEN** the section states the last message the hop sent
- **AND** it states neither the system prompt nor the tool catalogue

#### Scenario: An mcp hop states its arguments and its result

- **WHEN** an `mcp` hop is opened
- **THEN** the section states the arguments it sent
- **AND** it states the text of the tool result

#### Scenario: A hop that returned no text names the tools it requested

- **WHEN** a hop whose response content is empty is opened
- **THEN** the section names the tools that response requested

#### Scenario: The section is absent when the body columns are withheld

- **WHEN** the caller's schema does not report the body columns
- **THEN** the hop detail renders no request-and-response section at all

### Requirement: The conversation detail view switches between Chat and Trace

The detail view SHALL offer a switch between two views of one conversation: **Chat**, the recorded
transcript, and **Trace**, the conversation's traces. The switch SHALL indicate which view is current, SHALL
be reachable by keyboard, and SHALL NOT navigate away from the conversation.

Choosing a view is a **local** change and SHALL re-render only the region the switch governs. The
conversation's header and the supporting panels beside the view do not depend on which view is showing, and
SHALL NOT re-render when it changes. Opening a hop chain is the exception, and only because the header gives
way to the trace's own identity.

**The Trace view SHALL land on a list of the conversation's traces**, one row per recorded turn, each stating
that turn's trace id, start time, hop count, token total, cost, duration and rating counts, and each opening
that turn's hop chain. Switching to Trace MUST NOT open a turn's hop chain directly: the reader has not chosen
a turn, and picking one for them presents an arbitrary default as the answer.

A conversation whose turn list is empty SHALL render the list's own empty state rather than refusing the
switch — the view still has something to say about why there is nothing to open. A failed turn read SHALL be
reported as a failure there, distinctly from an empty list.

The per-turn trace control on each assistant message SHALL keep its current behaviour: it opens a turn's hop
chain directly, without passing through the list.

Returning from a hop chain SHALL land on the view it was opened from. A reader who reached a hop chain from
the trace list and is returned to the transcript has been moved somewhere they were not, and has to find their
way back to the list to continue.

Where the Chat view is not offered — because the schema reports no usable body column, for either of the two
reasons a column can be missing — the switch SHALL still be rendered, with the Chat option disabled and its
reason stated, rather than removed. A control that disappears leaves the reader unable to tell an unavailable
view from a view that does not exist.

**In that state the view SHALL open on Trace**, not on the disabled Chat option. Opening on it makes the same
option current and unselectable at once, which is the expected path for every caller below FULL_ADMIN: the
disabled segment is not focusable, so keyboard navigation within the switch has no starting point, and the data
that *is* available has to be discovered.

The Chat option SHALL remain enabled whenever the transcript is merely **empty**. An aged-out, not
reconstructable or never-recorded transcript is a Chat view with something to say, and disabling the switch
would replace that statement with silence.

#### Scenario: Switching views keeps the conversation

- **WHEN** the user switches from Chat to Trace
- **THEN** the hop chain renders in place
- **AND** the page does not navigate away from the conversation

#### Scenario: The current view is indicated

- **WHEN** either view is shown
- **THEN** the switch indicates which of the two is current

#### Scenario: A caller without the body columns opens on the Trace view

- **WHEN** the schema reports no usable body column
- **THEN** the detail opens on the Trace view
- **AND** the Chat option is rendered, disabled, with its reason stated

#### Scenario: A per-turn control opens the trace on that turn

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's hop chain opens directly

#### Scenario: Switching to Trace lists the conversation's traces

- **WHEN** the user switches to Trace from the view switch
- **THEN** one row renders per recorded turn, each stating that turn's own figures
- **AND** no turn's hop chain is opened and no hop read is issued

#### Scenario: A trace in the list opens its hop chain

- **WHEN** a row of the trace list is activated
- **THEN** that turn's hop chain opens

#### Scenario: A conversation with no turns switches to an empty list

- **WHEN** the user switches to Trace on a conversation whose turn list is empty
- **THEN** the trace list states that no traces were recorded
- **AND** the switch is not refused

#### Scenario: Returning from a hop chain lands on the view it was opened from

- **WHEN** a hop chain opened from the trace list is closed
- **THEN** the Trace view is shown, still listing the traces
- **AND** a hop chain opened from an assistant message returns to the transcript instead

#### Scenario: An unavailable Chat view is disabled, not hidden

- **WHEN** the schema reports no usable body column
- **THEN** the switch renders with the Chat option disabled and its reason stated

#### Scenario: Choosing a view does not re-render the page around it

- **WHEN** the user switches between Chat and Trace
- **THEN** the conversation's header does not re-render
- **AND** the supporting panels beside the view do not re-render

#### Scenario: An empty transcript keeps the Chat view enabled

- **WHEN** the transcript is aged out, not reconstructable, or was never recorded
- **THEN** the Chat option stays enabled
- **AND** selecting it shows the statement for that cause

### Requirement: An absent transcript is distinguished from a failed one, by cause

A transcript can be absent for three different reasons and can fail for a fourth. All four render no
messages, and the view SHALL distinguish them, because they say different things about the conversation: one
lost its detail to age, one never had detail to lose, one has detail that cannot be attributed to the user,
and one is an outage. Collapsing them would state something false about three conversations out of four.

**Aged out.** `dial_usage_log` and `rate_analytics` retain a row for one year from its request time, while
`conversations`, `turns` and `conversation_insights` retain theirs indefinitely. The retention is
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

### Requirement: A turn's trace opens in place, stating the turn's own figures

Each assistant message SHALL offer a control opening that turn's trace, and the view switch SHALL offer the
Trace view for the conversation. The trace SHALL replace the transcript **within the same view** and SHALL
offer a control returning to the transcript. Opening a trace is a read of one turn and MUST NOT navigate away
from the conversation.

While a trace is open the conversation's header SHALL be replaced rather than kept above it. The trace states
its own identity and its own figures, and two stacked headers would leave the reader unsure which of them the
figures belong to.

**Ordering.** The events SHALL be ordered by the recorded time of the hop that produced them, and every row
SHALL state its own absolute recorded time. Measured over a 251-hop trace, no child hop began before its
parent and all 25 tied timestamps were between siblings — never between an ancestor and a descendant — so a
tie means genuine concurrency and any stable order among tied hops is honest. Hops from different parts of a
trace **interleave**: one sampled hop's children spanned 22.8 s with 11 hops from elsewhere starting inside
that window, so the view MUST NOT present any group of hops as a contiguous block of time.

**Durations are not claimed.** The view MUST NOT render a hop duration, a duration bar, an offset from the
start of the trace, or any other per-hop wall-clock figure. All 251 hops of the sampled trace reported a
duration of zero: DIAL clamps its own measurement at zero, so on a current producer a reported zero is a real
sub-millisecond operation, but a core predating the field omits it and the non-nullable fallback stores zero
— on that producer version zero is indistinguishable from "not reported", and the view cannot tell the two
apart. Ordering and absolute times are the only temporal claims the data supports. This is a property of the
producer, and the view SHALL NOT compensate for it.

Every row SHALL be typed, named, and — where it stands for a recorded hop — selectable. A **failed** hop
SHALL be typed by its failure whatever its kind: on a trace the reader is looking for what broke. The failure
rule SHALL be one predicate shared by the row and its detail, so a row typed as an error can never open a
detail reporting success.

**An MCP hop SHALL be named by what it did.** The trace SHALL project the hop's MCP method and its tool-call
name and SHALL label the hop by the tool it called where one is recorded, falling back to the method and only
then to the server name. Labelling an MCP hop by its server name alone leaves the tool invisible, which is
the one thing a reader opening a retrieval hop is looking for.

The trace MUST NOT present its MCP hops as the complete set of tools the model requested. A tool the calling
application implements internally never crosses a network boundary and is never logged: over one measured
trace, 43 of 48 requested tool calls produced exactly one MCP row each and 6 produced none, so the recorded
set under-reports model intent by roughly one call in eight. Every MCP-backed call did produce a row — no
rows are missing — so the view SHALL neither claim completeness nor report a missing row as an error.

**A hop's routing chain SHALL be shown where recorded.** The hop log carries the execution path as an
ordered list naming the deployments a request was routed through, application first and model last. Where
present it SHALL be rendered as that chain.

Selecting a hop SHALL show its detail beside the stream: its category and status, its recorded time, its
tokens and cost, its endpoint, its upstream, its calling deployment, its HTTP status, its MCP method and tool
where recorded, and its routing chain where recorded. Its decoded request and response text SHALL be read on
demand for that hop alone, under **A hop's own request and response are read on demand** — a raw body MUST
NOT reach the client in any case.

**Colour SHALL never be the only thing distinguishing one kind of row from another.** Every row states its
type as text, so the rail colour is redundant by construction and the view SHALL NOT rely on a legend to
make its rows readable. Every colour SHALL come from a theme token that the project's palette defines: a
class naming a token the palette does not carry renders nothing at all, silently.

**The trace SHALL state the turn's figures as the rollup resolved them, and MUST NOT re-derive them from the
hops it read.** Its token total, cost, hop count, duration and status SHALL come from the same turn row the
turn list renders, so the two cannot disagree about one turn. Summing the hops instead is wrong whenever the
hop read is bounded, which is precisely when a turn is large enough for a reader to open it: one measured
384-hop turn read 300 hops and summed to 700 106 tokens and $1.01 against the turn's own 3 667 333 and
$3.68 — a figure that is neither the turn's nor recognisably a part of it.

The status SHALL likewise be the turn's failed-hop count rather than a failure seen among the hops read, for
the same reason: a failure past the bound would otherwise render the turn as OK.

The hop list SHALL be bounded and SHALL say so when it was cut short. A trace's hop count reaches into the
hundreds, and one observed turn recorded 1226 hops. The bound SHALL NOT be raised to accommodate such a
turn: filtering and on-demand disclosure are the answer, since a read large enough for the worst turn is a
read that punishes every other one.

**Opening a trace SHALL always leave the loading state, whatever the read does.** A read that rejects rather
than returning a failed result — the service unreachable, the session gone — SHALL open the trace stating that
it could not be read, not leave a loading indicator in place of the view. **A loading indicator SHALL NOT be
shown over an already-opened trace**, since a loaded chain beneath one reads as a chain that never loaded.

**An enrichment that fails SHALL NOT discard a read that succeeded.** The decoded model outputs that type the
stream's rows are an enrichment of the hop read, not a part of it: where resolving them fails or throws, the
hops SHALL still render, with their model-call rows typed generically. Rejecting the whole read would tell the
reader the trace could not be read while its rows were already in hand.

#### Scenario: A rejected trace read still leaves the loading state

- **WHEN** the trace read rejects
- **THEN** no loading indicator remains
- **AND** the trace states that it could not be read

#### Scenario: Opening a turn's trace replaces the transcript in place

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's event stream renders in place of the transcript
- **AND** the trace states the turn it belongs to and its own trace id
- **AND** a control returns to the transcript

#### Scenario: A turn's figures are the same in the list and in its trace

- **WHEN** a turn's trace is opened from the turn list
- **THEN** the tokens, cost, hop count and duration stated above the hop chain equal those on its list row
- **AND** they do not change when the hop chain is clipped by its bound

#### Scenario: The shortcut attributes each message to its own turn

- **WHEN** the whole conversation is assembled from one entry hop's body
- **THEN** each message carries the trace id of the turn that produced it
- **AND** the newest turn's figures appear only beneath the newest turn's answer

#### Scenario: Hops render in the order they were recorded

- **WHEN** a turn records hops at different times
- **THEN** their rows render in ascending order of recorded time

#### Scenario: No hop states a duration

- **WHEN** the trace renders its hops
- **THEN** no hop shows a duration, a duration bar or an offset from the start of the trace
- **AND** each hop shows its own absolute recorded time

#### Scenario: A failed hop is typed by its failure

- **WHEN** a hop did not succeed
- **THEN** it is typed as an error rather than by its event kind
- **AND** its detail reports the same verdict as its row

#### Scenario: An MCP hop is named by the tool it called

- **WHEN** an MCP hop records a tool-call name
- **THEN** the hop is labelled by that tool
- **AND** the query that fetched it named the MCP method and tool-call columns

#### Scenario: An MCP hop with no tool call falls back to its method

- **WHEN** an MCP hop records a method but no tool-call name
- **THEN** the hop is labelled by that method

#### Scenario: A routing chain renders as a chain

- **WHEN** a hop records an execution path of an application followed by a model
- **THEN** the hop's detail shows that chain in that order

#### Scenario: Selecting a hop shows its detail

- **WHEN** a hop is selected
- **THEN** its category, status, recorded time, tokens, cost, endpoint, upstream, caller and HTTP status
  render beside the stream
- **AND** its MCP method, tool and routing chain render where recorded
- **AND** no raw request or response body value reaches the client

#### Scenario: Every row states its type in words

- **WHEN** the stream renders its rows
- **THEN** each row states its type as text rather than by colour alone

#### Scenario: A failed enrichment still renders the hops

- **WHEN** resolving the decoded model outputs throws
- **THEN** the hops that were read still render
- **AND** the view does not state that the trace could not be read

#### Scenario: The trace states no latency derived from hop durations

- **WHEN** the trace states its own figures
- **THEN** they include its token total, its cost, its hop count and its status
- **AND** no stated figure is derived from a hop's recorded duration

#### Scenario: A clipped hop list says so

- **WHEN** the hop read is bounded below the turn's recorded hop count
- **THEN** the view states that the list is partial

## REMOVED Requirements

### Requirement: Conversation message content is sample data, and says so

**Reason**: The requirement rests on a premise that an investigation against a live instance disproved — that
the recorded message text "is not available to this view at an acceptable cost". A hop-log read predicated on
`chat_id` uses a bloom-filter index and is fast, and decoding bodies server-side keeps their size off the
wire. With that premise gone, the requirement mandated fabricated content on the one page whose purpose is to
show what a conversation was, and its prohibition on naming a body column blocked the fix.

**Migration**: Superseded by **Conversation message content is the recorded transcript**, **The transcript is
assembled from every entry hop of the conversation**, **Assistant text is read from the assembled response, or
decoded from the raw body**, **The body columns are schema-gated for two independent reasons**, **Hop bodies
are read and decoded server-side and never sent to the browser**, and **An absent transcript is distinguished
from a failed one, by cause**.

The prohibition on naming a body column is **narrowed, not dropped**. It remains in force for the turn list —
see the unchanged "The turn query MUST NOT name a request or response body column" in **Conversation turn
list comes from the turns rollup and discloses its bound** — and for the conversations list page, neither of
which may name one. The detail route's transcript read is the sole exception, and only server-side.

The sample-content notice, the identity-derived sample generator, and the rule that the number of sample
turns equals the number of turns loaded are all removed with it; the surviving requirement that every
assistant message carries its own turn's real figures is restated in **Conversation message content is the
recorded transcript**, bound by trace id rather than by position.

### Requirement: A turn's trace opens in place, with a selectable span tree

**Reason**: Replaced rather than amended because two of its normative claims are withdrawn, not adjusted.
It required every hop to state its **duration** and its offset from the start of the trace, and required the
trace to state a **latency** defined as its longest hop — all three derived from `operation_duration_ms`,
which the sampled 251-hop trace reported as zero for every hop. On a current producer a reported zero is a
real sub-millisecond operation; on a core predating the field the non-nullable fallback also stores zero, and
the view cannot tell the two apart. A requirement that mandates a figure the data cannot support is not
satisfiable, so its scenario "Trace latency is the enclosing hop, not the sum" is retired with it rather than
restated.

**Migration**: Superseded by **A turn's trace opens in place, stating the turn's own figures** and **A turn
renders as a flat, typed, filterable event stream**, which keep in-place replacement, header substitution,
failure-first typing, theme-token colours, selectable rows, cost per hop and the bounded-and-disclosed hop
list, and replace the duration clauses with absolute recorded times plus time ordering. Three further clauses
are **withdrawn rather than restated**: parent-span nesting with bounded depth and orphan hops as roots (the
sampled tree is one root with hundreds of direct children and a second level only under a tool call, so
nesting conveyed almost nothing — replaced by typing and filtering); the collapse of session-setup runs into
one expandable row (the same 131-of-173 handshake volume is now removed from view by the session filter
instead); and the legend, since every row states its type as text. The prohibition on showing a body in the
hop detail is **narrowed, not dropped**: decoded text for one hop is read on demand under **A hop's own
request and response are read on demand**, and no raw body value ever reaches the client.
