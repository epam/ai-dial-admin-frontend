## REMOVED Requirements

### Requirement: A hop's own request and response are read on demand

**Reason**: The requirement was written to make a *reading* view safe, and it makes a *debugging* view
useless. It permits only the last message of an `llm_call` request, only for a role the transcript admits, and
states that the system prompt and the tool catalogue "must never reach the screen". A reader who opens a hop
to work out why a call behaved as it did is asking about precisely those things: the prompt that framed it,
the parameters it ran under, and the history it carried. The requirement also suppresses a hop whole when its
recorded response size is zero — the case most worth opening, because a call that returned nothing still sent
something — and suppresses every embedding hop, whose request body is the probe text and is the useful half.

Its scenario "An llm_call hop states its prompt, not its history" is removed with it: the inspector states the
history.

**Migration**: Replaced by the inspector requirements added below. Everything the removed requirement
established that is still right is carried into them unchanged and is not re-argued:

- Bodies are fetched one hop at a time, when that hop is opened, never with the hop chain.
- The read is filtered by session, trace and hop, and carries the same `request_time` range bound.
- Decoding happens server-side; only decoded content reaches the client.
- Re-opening a hop already read issues no second read.
- A hop that recorded nothing readable and a hop whose read failed are stated as the different facts they
  are.
- Long content stays reachable by keyboard.
- The nine MCP protocol-envelope methods remain settled without a fetch, `tools/list` among them — its 11 KB
  response *is* the tool catalogue.
- Classification stays a deny-list: an unrecognised `mcp_method` or `event_kind` defaults to shown.
- Tool *definitions* still never render. The count does, and tool-call names do.

Three rules are reversed, each deliberately: the system prompt renders, the whole message history renders, and
suppression is decided per tab rather than per hop.

## ADDED Requirements

### Requirement: A hop's request and response render as a structured inspector

The hop detail SHALL state what the selected hop sent and what came back as a **Request / Response**
inspector, not as excerpts. The two sides SHALL be separate tabs, because a reader is asking about one or the
other and the panel is a rail, not a page.

**The Request tab SHALL state the whole message list as a history**, one row per message, each carrying its
role, its position in the list and its size in bytes. A message's text SHALL be clamped to a readable length
with an affordance that opens the rest, and a message large enough to dominate the request SHALL be marked as
such **in words as well as by colour** — 21% of model-call requests exceed 100 KB, and which message made it
so is the first thing a reader wants.

**A tool call SHALL render as the message's content, not as metadata about it.** An assistant message that
called a tool and said nothing records `content` as the empty string, so the call is the whole of what that
message said: the row SHALL state each call's name and its arguments inline in the history. Stating a call as
a size instead leaves a card that reads as blank, which is what a reader opening the hop is trying to resolve.
A message that recorded neither text nor a call SHALL say so rather than render empty.

**Per-property sizes SHALL NOT be stated.** A message's own size is stated; its members' sizes are not. The
reader opens a hop for the history, and a property is not a unit they asked about.

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

### Requirement: The inspector states the parameters the request carried, and the absence of the ones it did not

The inspector SHALL state the sampling parameters the request body carries, beside the tabs. It SHALL NOT
render a hardcoded list of parameters with values looked up against it, and it SHALL NOT omit a parameter
merely because the body did not carry one.

**`temperature`, `max_tokens`, `tools` and `stream` SHALL always be stated**, showing a de-emphasised
placeholder when the body carries none. An absent `temperature` is a debugging answer — the call ran at the
deployment's default — and a parameter line that silently omits it cannot be told apart from one the reader
did not look at carefully.

**Every other parameter the body carries SHALL be stated when present**, and parameters this frontend does not
recognise SHALL be **counted, not listed**: an unbounded parameter list would push the messages off a 360px
rail to state keys that are usually vendor passthrough.

**Presence SHALL be tested as "not null", never as truthiness.** `temperature: 0` is real and common — it is
the value a reader most often wants confirmed — and `stream: false` is the fact that explains an unframed
response. A truthiness test reports both as absent, which is the opposite of what the body says.

#### Scenario: A zero-valued parameter is stated, not treated as absent

- **WHEN** a request body carries `temperature: 0`
- **THEN** the parameter line states a temperature of 0
- **AND** it does not show the absent-value placeholder

#### Scenario: An absent parameter is stated as absent

- **WHEN** a request body carries no `temperature`
- **THEN** the parameter line states temperature with a de-emphasised absent-value placeholder

#### Scenario: Unrecognised parameters are counted

- **WHEN** a request body carries parameters this frontend does not recognise
- **THEN** the parameter line states how many there are
- **AND** it does not name them individually

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

**The nine MCP protocol-envelope methods SHALL remain settled without a fetch, on both tabs.** They negotiate
a session and carry no content, and `tools/list` returns the tool catalogue this requirement withholds
anyway.

**Embedding hops SHALL no longer be suppressed.** Their request body — averaging 352 B — is the probe text,
which is the half a reader is asking about; only the response is a vector, and it is the response side that
states so.

**The test SHALL remain a deny-list.** An `event_kind` or `mcp_method` this frontend does not recognise SHALL
default to shown, on both tabs.

#### Scenario: A hop that returned nothing still shows its request

- **WHEN** a hop whose recorded response size is zero is opened
- **THEN** the Request tab states what the hop sent
- **AND** the Response tab states that the hop returned no response body

#### Scenario: A protocol-envelope hop is settled without a fetch

- **WHEN** a hop whose MCP method negotiates the session is opened
- **THEN** no body is fetched for it
- **AND** both tabs state why that hop has no content

#### Scenario: An embedding hop shows its probe text

- **WHEN** an embedding hop is opened
- **THEN** the Request tab states the text that was embedded

#### Scenario: An unrecognised hop kind defaults to shown

- **WHEN** a hop records an event kind this frontend does not recognise
- **THEN** its bodies are fetched and its content is shown

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

**Assembled SHALL be built from the shape its dialect records, not from one shape for all of them.** The
Responses dialect lands in the same assembled column while recording `output[]` rather than
`choices[].message`, so a single decoder finds nothing there and reports a hop that recorded a full response as
having recorded nothing. The decode SHALL therefore be chosen by dialect.

**Assembled SHALL be the mode a hop opens in**, and SHALL be built from the assembled-response column where
the caller's schema reports it — averaging 1 511 characters against 52.8 KB for the raw body, roughly 35×
smaller, and already carrying the finish reason, the message and the full usage breakdown. Where that column
is absent from the schema, Assembled SHALL be decoded from the recorded response body, exactly as the
transcript already does. The column is a later addition to the hop log and an instance predating it does not
persist it, so its absence SHALL be handled, not assumed away.

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

### Requirement: MCP and embedding hops state the facts their kind actually has

**An MCP hop SHALL state its method, its tool name, its toolset, its arguments and its result.** The toolset
SHALL be taken from the hop's deployment: in one measured conversation all 277 MCP hops shared a single parent
span and were distinguishable only by it. **No session field SHALL be stated** — the hop log records no session
column for MCP, and a field with no source is a field that will be filled with the wrong thing.

`tools/call` is the only MCP method the inspector opens on; it averages 5.5 KB in and 123 KB out, so its
result SHALL be subject to the same clamp as any other raw content.

**An embedding hop SHALL state the model, the number of inputs, the dimension count, the token count and the
text that was embedded.** It SHALL NOT render the vector: 96% of recorded vectors arrive base64-encoded, so
any depiction of one requires decoding it first, and the result is decoration — the reader is asking what was
embedded, not what the coordinates were.

**The probe text SHALL be clamped like any other body-derived content.** A single input averages 352 B, but
the endpoint accepts an array and a batch is assembled into one text here — the one path that would otherwise
walk past the payload budget every other read honours.

#### Scenario: An MCP hop states its arguments, its result and its toolset

- **WHEN** an MCP tool call is opened
- **THEN** the inspector states the method, the tool name and the toolset
- **AND** it states the arguments sent and the result returned

#### Scenario: No MCP session field is stated

- **WHEN** an MCP hop is opened
- **THEN** no session field is stated

#### Scenario: An embedding hop states its input, not its vector

- **WHEN** an embedding hop is opened
- **THEN** the inspector states the model, the dimension count and the embedded text
- **AND** it renders no depiction of the vector

#### Scenario: A batch of embedding inputs is clamped and says so

- **WHEN** an embedding hop's inputs assemble into more text than the budget admits
- **THEN** the probe text is clamped
- **AND** the panel states the recorded size and the delivered size

### Requirement: Each side of the inspector is gated by its own recorded column

The request body and the response body are separate columns of the hop log, so the caller's entitlement to
them is separate. The inspector SHALL treat them separately: a caller whose schema reports one and not the
other SHALL get the tab they are entitled to rather than neither.

**A withheld side SHALL be stated once, not on every hop.** The statement belongs with the view's own header,
where it explains the state for the whole session, and individual hops SHALL stay silent about it — a
per-hop explanation repeats a fixed fact once per click.

**The statistics SHALL stay visible when a body is withheld.** Sizes, token counts, message counts, status,
duration and cost are plain columns and are not gated by the body grant; withdrawing them along with the
bodies would withdraw facts the caller is entitled to.

**A withheld body and a failed read SHALL be stated as different things**, as SHALL a hop that recorded
nothing — three distinct facts, and rendering any two identically hides an outage behind an entitlement or an
entitlement behind an empty result.

**A panel built from both columns SHALL state each half by its own grant.** The MCP and embedding panels are
not one side of a hop: an MCP hop's arguments are the request column and its result the response column, and
an embedding hop's dimension count is its only response-column field. Where one column is granted and the
other is not, the granted half SHALL render and the withheld half SHALL be stated as withheld — never as a
hop that recorded nothing, which describes the caller's entitlement as a property of the hop.

#### Scenario: A caller entitled to one side gets that side

- **WHEN** the caller's schema reports the request body column but no response body column
- **THEN** the Request tab renders
- **AND** the Response tab states that it is withheld

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
- **THEN** the arguments render
- **AND** the result is stated as withheld rather than as recorded nothing

#### Scenario: A half-granted embedding hop states its dimension count as withheld

- **WHEN** the caller's schema reports the request body column but no response body column
- **AND** an embedding hop is opened
- **THEN** the probe text renders
- **AND** the dimension count is stated as withheld rather than as absent

## MODIFIED Requirements

### Requirement: A turn renders as a span tree with its events as leaves

A turn's hops SHALL render as a tree. A hop SHALL nest under the hop identified by its `core_parent_span_id`,
and the events a hop emitted SHALL nest under that hop. Nesting is not decoration: a hop that called another
deployment is not a peer of the call it made, and an event is not a peer of the hop that emitted it.

**The tree SHALL contain nodes for recorded work only.** The turn's own question, totals, duration, cost and
status are stated by the trace view's heading and figures, and SHALL NOT be repeated as nodes inside the tree.
A node that stands for no hop is a node the reader can neither open nor act on, and stating one fact in two
places on one screen invites them to disagree.

**An event is not a hop.** One model call emits a reasoning marker, its answer, and one event per tool it
requested, so the tree holds more nodes than the hop list — 384 hops of one measured turn become 446 nodes.
Events SHALL be typed as: assistant text, tool request, tool result, reasoning, empty, session, embedding,
and a generic type for anything unrecognised. **Failure is not one of these types** — see the outcome axis
below.

**Every node that stands for recorded work SHALL carry a category.** A category set covering events alone
would leave every hop node unable to match anything, so emphasising *assistant text* would dim the very model
calls that produced that text.

**A hop node's category SHALL be derived, never assumed.** A hop that emitted more than one event is a
**model call** — that is the only kind that emits several. A hop that emitted exactly one takes **that
event's** category, whatever kind of hop it was.

This SHALL hold for every hop kind, not only the ones the data currently produces. Today every hop that
other hops nest under is a model call — 16 of 16 in a 1 000-row sample — but a deployment that grows an MCP
or embedding call into an orchestrating one is a change in someone else's service, not in this frontend, and
it must not need a release here to be labelled correctly. Deriving the category makes an MCP call that
acquires children read as an MCP call on the day it appears; hardcoding **model call** for every surviving
hop would silently mislabel it, which is the failure the deny-list rule exists to prevent.

Deriving it this way also needs **no category that is not already offered**: the single-event case reuses the
event's own category, so the set grows by **model call** alone.

**Kind and outcome SHALL be two axes, never one set.** A node SHALL state what kind of call it stands for
**and**, independently, whether that call failed. Collapsing the two into a single set makes a failed model
call report its failure *instead of* its kind, so the reader loses the fact they were about to act on: a
failed MCP call and a failed model call are different problems, and a set that names both "error" says
neither.

**A hop's kind SHALL be named as the hop log names it** — **LLM**, **MCP**, **Embeddings**, **Route** — with
a generic kind for anything unrecognised. The earlier names *Deployment* and *Retrieval* SHALL NOT be used:
they name an internal taxonomy rather than the thing the reader is looking at, and neither appears anywhere
in the data they are reading.

**A hop that failed SHALL keep its kind and carry a failure marker beside it.** A failure is either a false
success flag or a status of 400 or above. The marker SHALL be persistent and SHALL NOT depend on the current
emphasis, so a failure can never be buried among the nodes of the work it was attempting — the guarantee the
single-error-node rule used to provide, now provided without discarding the kind.

**The unrecorded-root placeholder SHALL carry no category**, and is the one node exempt from the rule above.
It stands for a hop the log has no row for, so naming a category would assert what kind of call it was on no
evidence. It states in words what it is instead, and it matches no filter — which is correct, because it is
not one of the turn's recorded events.

**A hop that emitted exactly one event SHALL render as a single node**, carrying the hop's own figures and
that event's type and label — **whether or not other hops nest under it**. Every embedding hop, every MCP
hop, every failed hop and every model call that simply answered emits exactly one event, so without this rule
each renders as two rows with the same name, the second saying nothing the first did not.

Child hops SHALL nest under that same node. They are calls the hop *made*, not things it *emitted*, so they
never need a row of their own to hang from — and exempting a hop because it has children would reintroduce
the duplicate on exactly the orchestrating calls a reader opens the tree to understand. It would also count
one recorded event twice: the hop and its event child share a category by the derivation rule above, so
emphasising that category would mark two nodes for one thing that happened.

Only a hop that emitted **several** events SHALL keep a node distinct from them, because only then is there
more than one thing to group.

**Typing SHALL be a deny-list at every level.** An `event_kind` or `mcp_method` this frontend does not
recognise SHALL render as a shown, generically-typed node: silently dropping something unfamiliar is the worse
failure in an observability tool. Two cases SHALL be handled explicitly — a hop with no `event_kind` is not
unknown but an unlabelled model call, classified by its endpoint (53 179 such hops exist table-wide); and a
`count_tokens` endpoint is utility rather than conversation.

**`route` hops SHALL be excluded from the tree entirely.** All 5 611 of them carry an empty `chat_id`: they
are scheduler REST calls and never part of a conversation. A non-`route` hop SHALL NOT be excluded because its
parent was.

**No hop SHALL be dropped for want of a place in the tree.** A hop whose `core_parent_span_id` names a hop
absent from the loaded page — the page is capped, and a trace can hold thousands of spans — SHALL render at
the top level rather than disappear. The same SHALL hold for a hop whose parent chain is circular or nests
deeper than the rendering bound. Losing a recorded hop to a structural accident is a worse failure than
showing it at the wrong depth.

**A trace whose root hop was not recorded SHALL render that root as a named placeholder**, taking its name
from the first segment of a child's `execution_path`, and SHALL mark it as not recorded. The turn's real work
nests beneath it. Presenting the orphaned children as unrelated top-level hops would assert a structure the
data contradicts. This is a **rare** shape — 4 954 of 1 860 573 traces record no root at all (0.27%), and a
50-trace sample of conversation traces contained none — so it is a correctness case, not a common one, and
nothing about the tree's ordinary presentation may be shaped around it.

**`execution_path` SHALL NOT be used to establish a parent-child edge.** Every root hop records a path of one
segment, so the path never supplies a parent the pointer lacks; its only use here is naming an unrecorded
root.

**Ordering SHALL be by `request_time` among siblings.** The tree states structure, and a global ordering
across the whole turn cannot be read off it. Where a turn's hops all sit at one level — the common shape —
sibling ordering is that global ordering.

**A failed hop SHALL emit a single node whatever kind of hop it is**, carrying its kind and its failure
marker together, so a failure is stated once rather than once per event it managed to emit. A failed hop that
other hops nest under SHALL keep them as its children.

**A reasoning event SHALL state its token count and MUST NOT claim to carry content.** The reasoning text is
recorded nowhere; the count is its only trace, and `reasoning · 264 tok` says more than an empty node.

**The tool-request to tool-result gap SHALL be surfaced, not hidden.** 85 tools were requested on the measured
turn and 57 results recorded; the missing 28 are functions the calling application handles internally, which
never cross a network boundary and so were never logged. A request with no recorded result SHALL say so. The
surplus SHALL be resolved **by count per tool name, never by identity** — the log pairs nothing, so no claim
may be made about which specific request went unanswered.

**A node with children SHALL expand and collapse, and SHALL expose which state it is in programmatically**
rather than by appearance alone. **The tree SHALL open fully expanded.** An observability tool that opens by
hiding what it recorded makes the reader's judgement for them, so collapsing is the reader's action.

**The tree SHALL offer one filter control per event category, and SHALL start with no category emphasised.**
Activating a category SHALL emphasise it; activating it again SHALL return to no emphasis, so one control both
narrows and releases. A separate control SHALL also return to no emphasis. Each control SHALL name its
category and nothing more, and SHALL expose programmatically whether it is the emphasised one.

**Emphasising a category SHALL de-emphasise every other node, and SHALL NOT remove any node.** The tree is the
answer to "what did this turn consist of", and a filter that removed nodes would either break the structure it
exists to show or force ancestors back in as a special case. Every hop stays where it is, at the depth it
belongs, and the reader keeps the surrounding shape while reading one category out of it.

**A de-emphasised node SHALL remain readable, selectable and openable.** It is dimmed, not disabled: its
detail is exactly as reachable as before, because a reader who narrowed to errors still needs the call that
came just before one.

**A match SHALL be distinguishable by more than the dimming of everything else.** Colour and opacity alone
carry nothing to a reader who cannot perceive them, so a match SHALL carry its own persistent marker.

**While a category is emphasised, the number of matches SHALL be stated once** beside the filter controls, and
SHALL be announced. **At rest there SHALL be no such count**: dimming removes nothing, so a standing count
could only ever restate the total against itself.

That announcement is not decoration. Because dimming changes no node's presence, a reader using assistive
technology gets no structural signal that the filter did anything — the pressed control says a filter is on,
the count is the only thing that says what it found. It SHALL therefore not be dropped along with the resting
count.

**The outcome axis SHALL have exactly one control — Failed — and it SHALL be offered only when the turn
recorded a failure.** Emphasising it SHALL mark every failed node whatever its kind, and SHALL behave in every
other respect as a kind control does. There SHALL be no "succeeded" control: the turn's own status figure
already states whether anything failed, and a control marking almost every node answers nothing.

**Only the categories the turn actually recorded SHALL be offered.** Under dimming, a control for a category
the turn has none of would dim every node and mark none — an unreadable screen in answer to a reasonable
question. The set of controls SHALL therefore be the set of categories present, which answers "were there any
errors" by whether the control exists at all, at a glance and without a click.

**A category's control SHALL carry that category's own colour, and that colour SHALL be the one marking its
nodes in the tree.** One palette across the control and the node is what lets a reader match the two without
reading either label. The control that returns to no emphasis names no category, so it SHALL stay neutral
rather than borrow a hue that would read as a tenth category.

Every colour SHALL be a theme token: a hardcoded value is where contrast quietly breaks, and a theme served by
the themes service can repaint any of them. **Colour SHALL NOT be the only thing that distinguishes one
control from another** — each states its category in words — and where the palette offers fewer distinct hues
than there are categories, categories SHALL share a hue by kinship rather than be given a hue too close to
another's to tell apart.

**No filter control SHALL be disabled, including the one that is currently active**: the pressed state already
says which filter is on, and disabling the active control drops it out of the tab order — so the reader who
narrowed by keyboard cannot get back. A category the turn has none of is absent, never present-and-disabled.

**Each node SHALL carry its position in the turn**, numbered by depth-first order over the whole tree, so a
node's place in the turn is stated wherever the reader is. The numbering SHALL NOT change when the reader
filters or collapses.

**Deriving the events requires the model calls' own response bodies**, which are the only record of whether a
call answered and which tools it asked for. Those SHALL be read server-side for the model-call hops only,
bounded by a cap, with only the decoded text and tool names crossing to the client. On the measured turn that
is 43 of 384 hops and 2.04 MiB of the trace's 16.67 MiB. Where the response column is not in the caller's
schema, or a call falls past the cap, its nodes SHALL be typed generically rather than reported as empty. A
hop the log records as having returned **no bytes** is the exception: its emptiness is a recorded fact, not an
unread body, and it SHALL be typed empty so the two remain distinguishable.

#### Scenario: A hop nests under its parent hop

- **WHEN** a trace records a hop whose parent span id names another hop in the same trace
- **THEN** that hop renders as a child of the named hop

#### Scenario: A hop's events nest under it

- **WHEN** a model call answered and requested a tool
- **THEN** a text node and a tool-request node render as children of that hop's node
- **AND** the hop's own node is categorised as a model call

#### Scenario: A hop with one event and no children is one node

- **WHEN** an embedding hop emits its single embedding event and no hop nests under it
- **THEN** one node renders, carrying the hop's figures and the event's type
- **AND** the hop's name is not repeated on a second row

#### Scenario: A model call that only answered is one node

- **WHEN** a model call emitted assistant text and nothing else, and no hop nests under it
- **THEN** one node renders, categorised as assistant text
- **AND** emphasising assistant text marks it rather than dimming it

#### Scenario: A hop with one event is one node even when hops nest under it

- **WHEN** a hop emitted one event and another hop nests under it
- **THEN** one node renders for that hop, carrying its figures and the event's category
- **AND** the hop nesting under it renders as that node's child
- **AND** the event is not repeated as a second row

#### Scenario: A failed orchestrating call is one error node

- **WHEN** a model call failed and other hops nest under it
- **THEN** the failing call renders as one node stating the kind LLM
- **AND** it carries a failure marker beside that kind
- **AND** emphasising Failed marks it once, not twice

#### Scenario: A failed call of one kind is distinguishable from a failed call of another

- **WHEN** a turn records a failed model call and a failed MCP call
- **THEN** each node states its own kind
- **AND** both carry a failure marker

#### Scenario: The Failed control is absent when nothing failed

- **WHEN** a turn recorded no failure
- **THEN** no Failed control is offered

#### Scenario: A failure marker does not depend on emphasis

- **WHEN** no category is emphasised
- **THEN** a failed node still carries its failure marker

#### Scenario: The unrecorded root carries no category

- **WHEN** a trace renders its unrecorded-root placeholder
- **THEN** the placeholder is offered as no category and matches no filter
- **AND** it states in words that the entry call was not recorded

#### Scenario: The tree holds no node for the turn itself

- **WHEN** the tree renders
- **THEN** it contains no node standing for the turn's question or its totals

#### Scenario: An orphaned hop is kept at the top level

- **WHEN** a hop's parent span id names a hop absent from the loaded page
- **THEN** the hop renders at the top level
- **AND** it is not dropped

#### Scenario: A circular parent chain does not lose its hops

- **WHEN** a trace's parent pointers form a cycle
- **THEN** every hop in the cycle is still rendered

#### Scenario: An unrecorded root is named from a child's execution path

- **WHEN** a trace's root hop is absent but its children record an execution path
- **THEN** a placeholder root renders, named from the first segment of that path
- **AND** it is marked as not recorded
- **AND** the trace's hops render beneath it

#### Scenario: Siblings are ordered by start time

- **WHEN** a hop has several children
- **THEN** they render in ascending order of request time

#### Scenario: A trace with no nesting renders as one level

- **WHEN** every hop of a trace has the same parent
- **THEN** they all render at the same depth
- **AND** a hop that emitted several events still renders them beneath it

#### Scenario: A failed hop keeps its children

- **WHEN** a hop failed and other hops nest under it
- **THEN** it emits a single error node
- **AND** the hops that nest under it are still rendered as its children

#### Scenario: An unlabelled model call is typed as conversation

- **WHEN** a hop records no event kind but a model endpoint
- **THEN** its events are typed as a model call's

#### Scenario: An unrecognised hop is shown

- **WHEN** a hop records an event kind this frontend does not recognise
- **THEN** it renders as a generically-typed node rather than being dropped

#### Scenario: A route hop is excluded

- **WHEN** a trace contains a hop whose event kind is route
- **THEN** the tree contains no node for it

#### Scenario: A hop excluded from the tree does not take its children with it

- **WHEN** a route hop has non-route children
- **THEN** those children are still rendered

#### Scenario: A reasoning event states its tokens

- **WHEN** a hop recorded reasoning tokens
- **THEN** a reasoning node states that count
- **AND** it does not claim to carry the reasoning text

#### Scenario: An unanswered tool request says so

- **WHEN** more requests for a tool were made than results recorded for it
- **THEN** the surplus requests are marked as having no recorded result

#### Scenario: The tree opens fully expanded

- **WHEN** the tree first renders
- **THEN** every node with children is expanded

#### Scenario: A node collapses and states that it is collapsed

- **WHEN** a node with children is collapsed
- **THEN** its descendants are not shown
- **AND** the node exposes its collapsed state programmatically

#### Scenario: No category is emphasised until the reader chooses one

- **WHEN** the tree first renders
- **THEN** no node is de-emphasised
- **AND** each category offers a control naming it

#### Scenario: Emphasising a category dims the rest without removing them

- **WHEN** a category's control is activated
- **THEN** every node of that category is marked as a match
- **AND** every other node is still rendered, at the same depth, de-emphasised
- **AND** activating the control again returns every node to no emphasis

#### Scenario: A de-emphasised hop can still be opened

- **WHEN** a category is emphasised and the reader selects a hop of another category
- **THEN** that hop's detail opens as it would with no filter active

#### Scenario: A match is marked by more than dimming

- **WHEN** a category is emphasised
- **THEN** each matching node carries a marker that does not rely on colour or opacity

#### Scenario: The match count appears only while a category is emphasised

- **WHEN** no category is emphasised
- **THEN** no match count is shown
- **AND** emphasising a category shows its match count against the turn's nodes
- **AND** that count is announced

#### Scenario: A turn that recorded no hops says so

- **WHEN** a turn's trace returned no hops
- **THEN** the tree states that nothing was recorded

#### Scenario: A control and its category's nodes share one colour

- **WHEN** the tree renders a category's control
- **THEN** the control carries the same colour that marks that category's nodes

#### Scenario: The control that clears the filter carries no category colour

- **WHEN** the filter controls render
- **THEN** the control that returns to no emphasis is neutral

#### Scenario: A category the turn has none of is not offered

- **WHEN** the turn recorded no events of some category
- **THEN** no control for that category is rendered
- **AND** no disabled control stands in its place

#### Scenario: The active filter is not disabled

- **WHEN** no category is emphasised
- **THEN** the control that returns to no emphasis states that it is the active one
- **AND** it is not disabled

#### Scenario: A model call recorded as returning no bytes is empty, not unread

- **WHEN** a model call's recorded response size is zero
- **THEN** its node is typed empty
- **AND** it is distinguishable from a call whose body was not read

#### Scenario: Positions survive filtering and collapsing

- **WHEN** a category is emphasised or a node is collapsed
- **THEN** each visible node keeps the position it had in the unfiltered tree

