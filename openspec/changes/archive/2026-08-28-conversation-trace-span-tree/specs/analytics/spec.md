## REMOVED Requirements

### Requirement: A turn renders as a flat, typed, filterable event stream

**Reason**: The requirement's premise — "the span tree is one root with hundreds of direct children and a
second level only under a tool call, so nesting conveys almost nothing" — was measured on one trace and does
not hold across the table. Trace `ba00487…` records 11 spans of which one owns a real sub-tree (its own
embedding call and its own model call); flattened, that sub-tree reads as three unrelated siblings. Trace
`89bcf12…` records a three-level chain, and 18 of 1 000 sampled parented spans across 696 traces have a parent
that is itself a child. The flat reading is lossy exactly on the traces a reader opens the drill-in to
understand. Separately, the requirement puts a span and the events it emitted in the same plane, so one model
call and its four events read as five peers on **every** trace, flat or not.

**Migration**: Replaced by **A turn renders as a span tree with its events as leaves**. Every rule this
requirement stated about typing, the deny-list, `route` exclusion, failed hops, reasoning events, the
tool-request/tool-result gap, and server-side body reading is carried into the replacement unchanged. Four
things differ:

1. Rows are arranged as a tree rather than a flat numbered stream.
2. The filter dims non-matching nodes instead of removing them, so nothing is ever hidden by narrowing.
3. The frame rows are gone. Every rule the removed requirement stated about the frame — that it is not a
   category, not a control, excluded from the counts, and suppressed in a narrowed view — is dropped with it,
   and nothing replaces it; the turn's question and totals are the trace view's heading and figures.
4. **Reversed**: the removed requirement kept every category selectable "whether or not the turn recorded any
   of it", on the reasoning that *none* is a real answer. Under dimming that control dims every node and marks
   none, so the replacement offers only the categories present — and the absent control now carries the same
   answer without a click.

No query changes: `core_parent_span_id` was already projected and ignored.

## ADDED Requirements

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
Events SHALL be typed as: assistant text, tool request, tool result, reasoning, empty, error, session,
embedding, and a generic type for anything unrecognised.

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

**A failed hop SHALL emit a single error node whatever kind of hop it is**, so a failure can never be buried
among the nodes of the work it was attempting. A failure is either a false success flag or a status of 400 or
above. A failed hop that other hops nest under SHALL keep them as its children.

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

- **WHEN** a hop failed and other hops nest under it
- **THEN** the failing call itself is categorised as an error
- **AND** emphasising errors marks it once, not twice

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
