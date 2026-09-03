## ADDED Requirements

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

## MODIFIED Requirements

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
