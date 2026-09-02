## REMOVED Requirements

### Requirement: A turn renders as a span tree with its events as leaves

**Reason**: Two of the requirement's rules are wrong on the data it was written against.

The first is *"A span that emitted exactly one event SHALL render as a single node, carrying the span's own
figures and that event's type and label."* It was adopted to avoid a span and its only event rendering as two
rows with the same name, and it does that — by overwriting the span's identity with a fragment of its
response. Measured on one 10-span trace rendered as 14 rows, 8 rows are named after content rather than
after the call: a model call whose response carried one tool request renders as a tool call named after that
tool and no longer reads as a model call at all, and the root call to an application renders as assistant
text. Two sibling calls to the same deployment kept the name `model call` only because their responses
happened to carry two fragments each, so a row's name depends on how many pieces its body was decoded into.

Behind that is the requirement's premise: that a span's synthesized events belong in the same tree as its
spans, with one category axis, one ordering and one numbering serving both. Span rows answer *what this turn
asked DIAL to do*; body-derived rows answer *what the agent did*. Neither question gets a straight answer
while both share the list.

The second is *"`route` spans SHALL be excluded from the tree entirely"*, on the rationale *"All 5 611 of them
carry an empty `chat_id`: they are scheduler REST calls and never part of a conversation."* The measurement
was right; the inference was not. An empty conversation id is not evidence of non-membership — one measured
18-span turn carries an empty conversation id on **every** row — and in that same turn the excluded route span
is the **parent of two embedding spans**, so the exclusion hoists both to the top level and destroys the
structure the reader opened the trace to see.

**Migration**: Replaced by **A turn renders as a tree of spans**. Every rule of this requirement that did not
depend on either premise is carried into it unchanged in effect: nesting by parent span id, rows for recorded
work only, kind and outcome as two independent axes, the failure marker and its persistence, the
unrecorded-root placeholder and its exemption from carrying a kind, deny-list typing, no span dropped for want
of a place, sibling ordering by recorded time, expand/collapse with programmatic state and a fully-expanded
default, one filter control per kind offered only where present, dimming rather than removal, the
non-colour match marker, the announced match count shown only while emphasising, the single Failed control,
the shared control-and-row colour from theme tokens, no disabled control, and depth-first positions that
survive filtering and collapsing.

What changes in the replacement: a row is exactly one span and a span is exactly one row; nothing decoded from
a body is a row; rows are named by the entity that did the work; the secondary line is chosen by the figures
the span recorded; the category axis is the kind of call rather than the kind of event; `Rating` joins the kind
set and the event categories leave it; `route` spans render; and building the tree no longer reads any
response body. The scenarios that asserted the two removed premises — `A span's events nest under it`,
`A span with one event and no children is one node`, `A model call that only answered is one node`,
`A span with one event is one node even when spans nest under it`, `A reasoning event states its tokens`,
`A model call recorded as returning no bytes is empty, not unread`, `A route span is excluded` and
`A span excluded from the tree does not take its children with it` — are replaced by scenarios asserting the
opposite behaviour, listed in the new requirement. `An unanswered tool request says so` moves into the
inspector, where the requested tool now lives, and gains the cause of the absence.

### Requirement: A turn's trace opens in place, stating the turn's own figures

**Reason**: Three of the requirement's rules no longer describe the data or agree with the rest of the spec.

*"Durations are not claimed"* rests on a sampled trace whose 251 spans all reported a duration of zero. That
was a property of one producer version. Over 325 455 spans in one measured week, 51 report zero — 0.016%, all
within a single event-kind bucket — while `llm_call` (201 875 spans, minimum 10 ms), `embedding` (72 087,
29 ms), `mcp` (15 277, 6 ms) and `route` (796, 33 ms) report not one zero between them. Suppressing duration
now withholds a recorded fact, and it withholds the only figure of its own that a span with no tokens and no
price has.

*"An MCP span SHALL be named by what it did… falling back to the method and only then to the server name"*
makes the server unreachable in exactly the common case: a turn that handshakes two toolsets renders
`initialize`, `initialize`, `notifications/initialized`, `tools/list` and cannot say which server any of them
belongs to. The rule's own concern — that naming a span by its server alone leaves the tool invisible — is
real, and is met by stating both rather than by choosing one.

*"A **failed** span SHALL be typed by its failure whatever its kind"* contradicts **A turn renders as a span
tree with its events as leaves**, which established kind and outcome as two independent axes precisely
because a set naming both a failed MCP call and a failed model call "error" says neither. The tree
requirement is the later and the correct one; this rule is the older survivor of a resolved disagreement.

**Migration**: Replaced by **A turn's trace opens in place, stating the turn's own figures and each span's**.
Everything else in the requirement is carried across unchanged: opening in place and returning to the
transcript, the single replaced header, ordering by recorded time with each row stating its own absolute
time, the interleaving prohibition, no offset and no duration bar drawn to scale, every row typed and named
and selectable where it stands for a span, one failure predicate shared by row and detail, the incompleteness
statement about requested tools, the routing chain where recorded, the detail's field set and its
read-on-demand body rules, colour never being the only distinction and every colour a theme token, and the
trace stating the listing's own figures rather than re-deriving them from a bounded span read. `No span states
a duration` and `A failed span is typed by its failure` are replaced by scenarios asserting the opposite;
`An MCP span is named by the tool it called` and `An MCP span with no tool call falls back to its method` gain
the server; `A failed enrichment still renders the spans` is dropped because the decoded-model-output
enrichment it guards is removed by this change — the tree no longer reads a body to render, so there is no
enrichment left to fail.

## ADDED Requirements

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

### Requirement: A turn's trace opens in place, stating the turn's own figures and each span's

Each assistant message SHALL offer a control opening that turn's trace, and the view switch SHALL offer the
Trace view for the conversation. The trace SHALL replace the transcript **within the same view** and SHALL
offer a control returning to the transcript. Opening a trace is a read of one turn and MUST NOT navigate away
from the conversation.

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

Selecting a span SHALL show its detail beside the tree: its kind and its outcome, its recorded time, its
duration where reported, its tokens and cost, its endpoint, its upstream, its calling deployment, its HTTP
status, its MCP method and tool where recorded, and its routing chain where recorded. Its request and
response SHALL be read on demand for that span alone, under **The inspector reads bodies in tiers, and never
ships one whole** — a raw body MUST NOT reach the client unread, and what does reach it SHALL be bounded and
state its own clamp.

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

#### Scenario: Opening a turn's trace replaces the transcript in place

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's tree renders in place of the transcript
- **AND** the trace states the turn it belongs to and its own trace id
- **AND** a control returns to the transcript

#### Scenario: A turn's figures are the same in the list and in its trace

- **WHEN** a trace is opened from the trace listing
- **THEN** the tokens, cost and span count stated above the tree equal those the listing states for it
- **AND** they do not change when the span read is clipped by its bound

#### Scenario: The shortcut attributes each message to its own turn

- **WHEN** the whole conversation is assembled from one entry span's body
- **THEN** each message carries the trace id of the turn that produced it
- **AND** the newest turn's figures appear only beneath the newest turn's answer

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
- **THEN** the span's detail shows that chain in that order

#### Scenario: Selecting a span shows its detail

- **WHEN** a span is selected
- **THEN** its kind, status, recorded time, tokens, cost, endpoint, upstream, caller and HTTP status render
  beside the tree
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
