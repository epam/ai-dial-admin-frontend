## ADDED Requirements

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

**A fact read from the hop row rather than from a body SHALL render above the tab strip**, where it is visible
on every tab. An MCP hop's method, tool name and toolset are plain columns belonging to neither side, and
duplicating them onto both tabs would state the same thing twice while leaving a reader unsure whether the
two copies could differ. This is the slot the request's parameters already occupy.

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

#### Scenario: An MCP hop's row facts stay visible on both tabs

- **WHEN** an MCP hop is selected and the reader moves between its tabs
- **THEN** its method, tool name and toolset render above the tab strip on both

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

### Requirement: The conversation detail view presents its traces without a view switch

The conversation detail view SHALL present the conversation's **traces** and SHALL NOT offer a view switch.
The transcript is no longer a view of its own: a conversation's readable exchange is the request history of
its entry span, which the trace's own Chat tab states in the place where everything else about that trace is
stated.

The detail body SHALL render the trace listing, grouped by trace and carded by root span as
**The conversation trace listing groups by trace and cards by root span** defines, each card opening its
trace's hop chain. The conversation's header and the supporting panels beside the listing SHALL be
unaffected, and no body read SHALL be issued when the page opens.

A conversation whose trace listing is empty SHALL render the listing's own empty state, and a failed listing
read SHALL be reported as a failure there — both exactly as they already are.

Closing an open hop chain SHALL return to the trace listing.

No page of the console SHALL offer a conversation-level transcript, and none SHALL state that one is
unavailable: an option that no longer exists is not an option to explain.

#### Scenario: The detail view opens on its traces

- **WHEN** a conversation's detail view loads
- **THEN** the trace listing renders
- **AND** no view switch is offered
- **AND** no body read has been issued

#### Scenario: A trace in the list opens its hop chain

- **WHEN** a card of the trace listing is activated
- **THEN** that trace's hop chain opens

#### Scenario: Closing a hop chain returns to the listing

- **WHEN** an open hop chain is closed
- **THEN** the trace listing renders again

#### Scenario: A conversation with no traces states so

- **WHEN** a conversation's trace listing is empty
- **THEN** the listing states that no traces were recorded

#### Scenario: A caller without the body columns still gets the listing

- **WHEN** the schema reports no usable body column
- **THEN** the trace listing renders unchanged
- **AND** no statement about an unavailable transcript is made

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

### Requirement: A trace opens in place, stating its own figures and each span's

A trace SHALL be opened from the trace listing, and SHALL replace the listing **within the same view** with a
control returning to it. Opening a trace is a read of one trace and MUST NOT navigate away from the
conversation.

While a trace is open the conversation's header SHALL be replaced rather than kept above it. The trace states
its own identity and its own figures, and two stacked headers would leave the reader unsure which of them the
figures belong to.

**Ordering.** The rows SHALL be ordered by the recorded time of the span each stands for, and every row SHALL
state its own absolute recorded time. Measured over a 251-span trace, no child span began before its parent and
all 25 tied timestamps were between siblings — never between an ancestor and a descendant — so a tie means
genuine concurrency and any stable order among tied spans is honest. Spans from different parts of a trace
**interleave**: one sampled span's children spanned 22.8 s with 11 spans from elsewhere starting inside that
window, so the view MUST NOT present any group of spans as a contiguous block of time.

**A span's recorded duration SHALL be stated where the producer reported one, and a reported zero SHALL be
treated as no report.** Duration is recorded on effectively every span: over 325 455 spans in one measured
week, 51 reported zero — 0.016%, all in a single event-kind bucket — while `llm_call`, `embedding`, `mcp` and
`route` reported a minimum above zero and not one zero between them. The zero-handling rule is why a zero is
not rendered as `0 ms`: DIAL clamps its own measurement at zero, so on a core predating the field the
non-nullable fallback also stores zero, and the view cannot tell a real sub-millisecond operation from an
unreported one. **An offset from the start of the trace, and any duration bar drawn to scale against the
turn, SHALL NOT be rendered** — spans interleave, so a bar would assert a timeline the ordering rule refuses
to claim.

Every row SHALL be typed, named, and — where it stands for a recorded span — selectable. **A failed span SHALL
keep its kind and carry its failure beside it**, never instead of it, under **A turn renders as a tree of
spans**. The failure rule SHALL be one predicate shared by the row and its detail, so a row marked as failed
can never open a detail reporting success.

**An MCP span SHALL be named by its server and by what it did.** The trace SHALL project the span's MCP method
and its tool-call name, and the row SHALL state the server together with the tool it called where one is
recorded and with the method otherwise. Naming the span by its tool or method alone leaves the server
invisible, so two protocol messages of different servers in the same second cannot be told apart; naming it
by the server alone leaves the call invisible, which is the one thing a reader opening a retrieval span is
looking for. Both SHALL be stated.

The trace MUST NOT present its MCP spans as the complete set of tools the model requested. A tool the calling
application implements internally never crosses a network boundary and is never logged: over one measured
trace, 43 of 48 requested tool calls produced exactly one MCP row each and 6 produced none, so the recorded
set under-reports model intent by roughly one call in eight. Every MCP-backed call did produce a row — no
rows are missing — so the view SHALL neither claim completeness nor report a missing row as an error.

**A span's routing chain SHALL be shown where recorded.** The span log carries the execution path as an
ordered list naming the deployments a request was routed through, application first and model last. Where
present it SHALL be rendered as that chain.

Selecting a span SHALL show its **facts** beside the tree — its kind and its outcome, its recorded time, its
duration where reported, its tokens and cost, its endpoint, its upstream, its calling deployment, its HTTP
status, its MCP method and tool where recorded, and its routing chain where recorded — while its **bodies**
render below the tree, under **The trace view splits the span tree from the selected span's bodies**. The
facts are reference values read once per hop; the bodies are the surface a reader works in, and the two SHALL
NOT compete for one column. Its request and response SHALL be read on demand for that span alone, under
**The inspector reads bodies in tiers, and never ships one whole** — a raw body MUST NOT reach the client
unread, and what does reach it SHALL be bounded and state its own clamp.

**Colour SHALL never be the only thing distinguishing one kind of row from another.** Every row states its
kind as text, so the rail colour is redundant by construction and the view SHALL NOT rely on a legend to
make its rows readable. Every colour SHALL come from a theme token that the project's palette defines: a
class naming a token the palette does not carry renders nothing at all, silently.

**The trace SHALL state the figures the listing states for it, and MUST NOT re-derive them from the spans it
read.** Its token total, cost, span count and status SHALL come from the same trace-level figures the
listing's group renders, and the opened root's own figures SHALL come from the same root row its card
renders, so the drawer and the card it was opened from cannot disagree. Summing the spans instead is wrong
whenever the span read is bounded, which is precisely when a trace is large enough for a reader to open it:
one measured 384-span trace read 300 spans and summed to 700 106 tokens and $1.01 against the trace's own
3 667 333 and $3.68 — a figure that is neither the trace's nor recognisably a part of it.

The status SHALL likewise be the trace's failed-span count rather than a failure seen among the spans read, for
the same reason: a failure past the bound would otherwise render the trace as OK. **No stated trace figure
SHALL be derived from a span's recorded duration**, whether or not durations are rendered per row: the span
read is bounded and the spans interleave, so neither a sum nor a span of them is the turn's latency.

#### Scenario: A rejected trace read still leaves the loading state

- **WHEN** the trace read rejects
- **THEN** no loading indicator remains
- **AND** the trace states that it could not be read

#### Scenario: Opening a trace replaces the listing in place

- **WHEN** a card of the trace listing is activated
- **THEN** that trace's tree renders in place of the listing
- **AND** the trace states the card it was opened from and its own trace id
- **AND** a control returns to the listing

#### Scenario: A turn's figures are the same in the list and in its trace

- **WHEN** a trace is opened from the trace listing
- **THEN** the tokens, cost and span count stated above the tree equal those the listing states for it
- **AND** they do not change when the span read is clipped by its bound

#### Scenario: Spans render in the order they were recorded

- **WHEN** a turn records spans at different times
- **THEN** their rows render in ascending order of recorded time
- **AND** each row states its own absolute recorded time

#### Scenario: A reported duration is stated

- **WHEN** a span reports a duration above zero
- **THEN** its row and its detail state that duration

#### Scenario: A reported zero duration is not stated as zero

- **WHEN** a span reports a duration of zero
- **THEN** no duration is rendered for it
- **AND** it is not rendered as zero milliseconds

#### Scenario: No timeline is drawn

- **WHEN** the tree renders a turn whose spans interleave
- **THEN** no row shows an offset from the start of the trace
- **AND** no duration bar is drawn to scale against the turn

#### Scenario: A failed span keeps its kind and states its failure

- **WHEN** a span did not succeed
- **THEN** its row states its kind of call and carries a failure marker beside it
- **AND** its detail reports the same verdict as its row

#### Scenario: An MCP span is named by its server and the tool it called

- **WHEN** an MCP span records a tool-call name
- **THEN** the row states the server and that tool
- **AND** the query that fetched it named the MCP method and tool-call columns

#### Scenario: An MCP span with no tool call is named by its server and its method

- **WHEN** an MCP span records a method but no tool-call name
- **THEN** the row states the server and that method

#### Scenario: Two protocol messages of different servers are distinguishable

- **WHEN** two toolsets each record an `initialize` span in the same second
- **THEN** each row names its own server
- **AND** the two rows are distinguishable from one another

#### Scenario: A routing chain renders as a chain

- **WHEN** a span records an execution path of an application followed by a model
- **THEN** the span's facts show that chain in that order

#### Scenario: Selecting a span shows its facts beside the tree and its bodies below it

- **WHEN** a span is selected
- **THEN** its kind, status, recorded time, tokens, cost, endpoint, upstream, caller and HTTP status render
  beside the tree
- **AND** its request, response and conversation render in the section below the tree
- **AND** its duration renders where the producer reported one
- **AND** its MCP method, tool and routing chain render where recorded
- **AND** no raw request or response body value reaches the client

#### Scenario: Every row states its type in words

- **WHEN** the tree renders its rows
- **THEN** each row states its kind as text rather than by colour alone

#### Scenario: The trace states no latency derived from span durations

- **WHEN** the trace states its own figures
- **THEN** they include its token total, its cost, its span count and its status
- **AND** no stated figure is derived from a span's recorded duration

#### Scenario: A clipped span list says so

- **WHEN** the span read is bounded below the turn's recorded span count
- **THEN** the view states that the list is partial

#### Scenario: The span tree contains the root the card describes

- **WHEN** a card whose root carries no conversation header is opened
- **THEN** that root appears as a row in the tree
- **AND** the span read's filter names the trace id and not the chat id

### Requirement: The inspector states every parameter the request carried, and the absence of the ones it did not

The inspector SHALL state the parameters the request body carries, on the Request tab. It SHALL NOT render a
hardcoded list of parameters with values looked up against it, and it SHALL NOT omit a parameter merely
because the body did not carry one.

**`temperature`, `max_tokens`, `tools` and `stream` SHALL always be stated**, showing a de-emphasised
placeholder when the body carries none. An absent `temperature` is a debugging answer — the call ran at the
deployment's default — and a parameter line that silently omits it cannot be told apart from one the reader
did not look at carefully.

**Every other member of the body SHALL be stated under the name the body gave it**, whether or not this
frontend recognises it. The recognised names are an *ordering* — the settings a reader looks for by name come
first, under a short label — not an allow-list. A parameter this frontend has never met is still one the call
was made with, and the endpoint set is open by design, so any allow-list is permanently behind it.

**Unrecognised parameters SHALL NOT be collapsed into a count.** The removed rule counted them, to keep an
unbounded list from pushing the messages off a 360px rail. The parameter line no longer lives in that rail,
and a count told the reader that something existed while refusing to name it — the one thing they would have
opened the hop to learn.

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

**A state envelope SHALL be stated by its size, not omitted.** The DIAL-specific envelopes are blobs, so like
any array- or object-valued parameter they SHALL be stated by their length or their number of keys rather
than rendered — which is what keeps a passthrough blob from becoming the line. Their presence is worth
stating: an envelope is why a message's recorded size can run far past its visible text, and a reader
comparing the two has no other way to see that it is there.

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
- **THEN** the parameter line states it under the key the body recorded
- **AND** no count stands in place of it

#### Scenario: The settings a reader looks for come first

- **WHEN** a request body carries both a recognised parameter and an unrecognised one
- **THEN** the always-stated four lead the line
- **AND** the recognised parameter precedes the unrecognised one

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

- **WHEN** a request body carries a parameter whose value is an array or an object
- **THEN** the line states its length or its number of keys rather than its content

## MODIFIED Requirements

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
and a pinned control row carrying the rail's background reads as a lighter stripe across the panel. The raw
switch SHALL sit at the same end of that row on both tabs, so the control does not move when the reader
changes tab.

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

**The response's own facts SHALL be stated outside that card, and above it.** Which model answered, how the
tokens split, what came from cache and the upstream's id for the completion are facts about the response
rather than about the message it carried — and the tab holds exactly one answer, so they head the reply
instead of trailing a card the reader has to scroll past. The clamp and the note about a requested tool with
no recorded call stay with the text they qualify.

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

#### Scenario: The role filter is not offered over the recorded bytes

- **WHEN** the request's raw switch is on
- **THEN** the role filter is not offered


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

**The request's parameters SHALL be stated inside the Request tab**, not above the tab strip. Only facts read
from the hop row belong above it: a request-body fact placed there sits over the Response tab describing
something else.

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
- **THEN** the request's parameters are not stated above the tab strip

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
- **THEN** no body is fetched for it
- **AND** both tabs state why that hop has no content

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

### Requirement: MCP and embedding hops state the facts their kind actually has

**An MCP hop SHALL state its method, its tool name, its toolset, its arguments and its result.** The toolset
SHALL be taken from the hop's deployment: in one measured conversation all 277 MCP hops shared a single parent
span and were distinguishable only by it. **No session field SHALL be stated** — the hop log records no session
column for MCP, and a field with no source is a field that will be filled with the wrong thing.

**Each of those facts SHALL be stated where the column it comes from is stated.** The method, the tool name
and the toolset are plain hop-row columns and SHALL render above the tab strip, visible on every tab; the
arguments are the request column and SHALL render on the Request tab; the result is the response column and
SHALL render on the Response tab. The hop's two halves are read in one round trip, so neither tab waits on
the other — the split is a matter of where a fact is stated, not of when it is fetched.

`tools/call` is the only MCP method the inspector opens on; it averages 5.5 KB in and 123 KB out, so its
result SHALL be subject to the same clamp as any other raw content.

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
- **THEN** the method, the tool name and the toolset render above the tab strip
- **AND** the Request tab states the arguments sent and the Response tab states the result returned

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

## REMOVED Requirements

### Requirement: The conversation detail view switches between Chat and Trace

**Reason**: There is no longer a second view to switch to. The conversation-level transcript is replaced by
the span-scoped Chat tab inside a trace, so the detail view has one subject — the conversation's traces — and
a switch with one option is not a switch. Everything the requirement said about landing on Trace, gating a
Chat option, reporting an empty or failed listing, and not re-rendering the header and panels is either
carried by **The conversation detail view presents its traces without a view switch** or moot.

**Migration**: None for the reader — the detail view opens on the trace listing, which is where the switch
already landed. A reader who wants the conversation as text opens the trace's entry span and reads its Chat
tab, which states the same exchange plus everything the transcript could not show.

### Requirement: An absent transcript is distinguished from a failed one, by cause

**Reason**: The four causes described the states of a conversation-level transcript region that no longer
exists. The span bodies have their own state vocabulary — withheld, no body, failed, unstructured — already
required by **Each side of the inspector is gated by its own recorded column** and stated per span, where the
cause is a fact about the hop the reader opened rather than about the conversation.

**Migration**: A conversation past the hop log's retention now shows an empty trace listing, which is the
same fact stated by the surface that reads those rows. A conversation with hops but no entry hop is no longer
a special case: its hops are in the tree and each one's own history is readable, which is what the
not-reconstructable state existed to refuse.

### Requirement: Conversation message content is the recorded transcript

**Reason**: The conversation-level transcript is removed. Its guarantees — recorded text and never fabricated
or sample content, an explicit placeholder rather than an empty bubble, no machinery interleaved between
messages, and figures bound by trace id rather than by position — belong to a view that no longer exists.
The equivalent guarantees for the surface that replaces it are stated by **A span's Chat states the
conversation that span received**.

**Migration**: None. No consumer read the transcript other than the removed view.

### Requirement: The transcript is assembled from every entry hop of the conversation

**Reason**: With no conversation-level transcript there is nothing to assemble. The whole apparatus — the
entry-hop null-parent test, the leading-overlap merge across turns, the `2k − 1` whole-conversation
shortcut, the bounded entry-hop read, and the exclusion of every role but user and assistant — existed to
turn many hop bodies into one conversation without ever reading a child hop's body for message text. A
span's Chat reads exactly one hop's own request, so there is no cross-hop assembly to get wrong and no
inner-hop body to mistake for something a person typed.

**Migration**: The safety property the entry-hop rule protected is preserved by a different mechanism: every
turn Chat renders is labelled with its own role and a system or tool turn is presented distinctly, so a
system prompt cannot read as a user's question. The entry span's own request carries the user-visible
exchange, so opening it gives the reader what the assembled transcript gave them.

### Requirement: The body columns are schema-gated for two independent reasons

**Reason**: Replaced by **The hop body columns are schema-gated for two independent reasons**. The two
gating conditions and the optional-field discipline are unchanged; what changed is what they gate. The old
requirement's contract was the combined predicate "offer the Chat view when the request column and at least
one response column are reported", and with the conversation-level transcript gone that conjunction has no
reader: it would withhold a readable request history over an unreadable answer.

**Migration**: The schema probe reports the two sides separately, and each tab is gated by the columns it
reads. A caller entitled to the request alone now gets the Request and Chat tabs instead of nothing.

### Requirement: A turn's trace opens in place, stating the turn's own figures and each span's

**Reason**: Replaced by **A trace opens in place, stating its own figures and each span's**. A trace is no
longer "a turn's", opened from an assistant message in a transcript — it is opened from the trace listing —
and the selected span's detail is no longer one rail: its facts stay beside the tree and its bodies move
below it. Every rule about ordering, durations, MCP naming, colour, and figures coming from the listing
rather than from the spans read is carried forward unchanged.

**Migration**: None for the reader. The per-turn "open trace" control disappeared with the transcript that
carried it; the listing's cards open the same traces.

### Requirement: The inspector states the parameters the request carried, and the absence of the ones it did not

**Reason**: Replaced by **The inspector states every parameter the request carried, and the absence of the
ones it did not**. Its one substantive clause — that unrecognised parameters are counted rather than listed —
rested on the parameter line living in a 360px rail, which this change removed. Every other clause is carried
forward unchanged.

**Migration**: None for the reader: a line that said `+1 more` now names that parameter. The count member is
gone from the parameter shape, so nothing computes it.
