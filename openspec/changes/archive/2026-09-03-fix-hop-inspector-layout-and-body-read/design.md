## Context

See `proposal.md` — Why. Three constraints shape the approach:

- The bodies section is one component, `HopInspector`, which owns the strip, a fixed slot above it for
  hop-row facts, and a scrolling body below it. The slot exists because an MCP hop's method, tool and
  toolset are hop-row columns describing neither side; that reasoning is unchanged, only the slot's
  position is.
- Every body is read, decoded and clamped server-side; what crosses to the browser is an envelope or a
  clamped text, never a body. Anything this change does to the text of a body therefore happens in the
  server-side read, not in a panel.
- A clamp states the recorded size and the delivered size. Any reformatting has to leave the first of
  those two numbers describing the log rather than describing the rendering.

## Goals / Non-Goals

**Goals:**

- One layout rule for the bodies section: strip first, hop-row facts below it, body below that.
- One formatting rule for both halves of an MCP hop, applied where the body is already decoded.
- One scoping rule for a trace's reads: the tree and the bodies read locate a span the same way.

**Non-Goals:**

- The envelope reads (`getConversationHopRequest` / `getConversationHopResponse`) and the raw view are
  untouched; a model call's messages are already parsed per dialect and rendered per message.
- No change to the clamp budgets or to the column grants.

## Decisions

### The facts slot moves below the strip and stays outside the scroll container

`HopInspector` renders the strip and the facts line in one non-scrolling header block; the change is
their order within it.

Alternatives considered:

- **Move the facts into the Request tab.** Rejected: the method, tool and toolset are hop-row columns
  belonging to neither side, so stating them on the Request tab describes the Response tab's content
  from a tab that is not showing.
- **Move the facts into the scroll container.** Rejected: an MCP result is the longest content the
  section renders, so the facts would scroll away exactly where the reader is scrolling — and the point
  of the slot is that they stay stated while either half is read.

Ordering is also the accessible reading order and the tab order, so the strip is now reached before the
facts it governs. The facts line keeps its `role="group"` and its accessible name.

### Both MCP halves are formatted server-side, before the clamp

Formatting belongs in `mcpFactsOf`, which already decodes both halves: the arguments are formatted there
today (`jsonRpcArgumentsOf`), and the result is the one half that is not. A shared helper in
`utils/analytics/hop-inspector/` parses the decoded text and re-serialises it indented, returning the
text unchanged when it does not parse — so a plain-text or truncated result is never mangled.

Order matters and is the reason this is a decision rather than a detail:

- **Format, then clamp.** A clamped JSON document no longer parses, so formatting after the clamp would
  leave exactly the large results — the ones a reader cannot scan unaided — unformatted.
- **The recorded size is measured on the recorded text, before formatting.** `clampToBudget` currently
  derives `recordedBytes` from the text it is given, which after this change is the reformatted one.
  It therefore takes the recorded byte count as an input so the clamp note keeps stating what the log
  holds; `deliveredBytes` stays measured on what actually crosses, which is the formatted, clamped text.

Alternative considered: **format in the panel.** Rejected: the panels render what the read produced, and
formatting in the browser means shipping the raw line and parsing a six-figure-byte document there — the
opposite of the tiered-read rule the inspector is built on.

### The bodies read drops the session predicate

`buildConversationHopBodyQuery` keeps `trace_id`, `core_span_id` and the recorded-time equality and loses
`sessionScopePredicate(scope)`. A span id is unique within its trace and the read is a single-row page,
so the remaining predicates identify the same row the tree offered. `buildConversationSpansQuery` already
made this move, with the same reasoning recorded against it.

Entitlement is unchanged and deliberately not carried by this predicate: which body columns a caller may
read is resolved from the cached entity schema, and a caller holding neither column still gets the
withheld-column note rather than a body.

Alternative considered: **keep the predicate and admit an empty header as a second way to match.** Rejected:
it encodes the empty header as a special case, when the rule the tree already follows is that the header
says nothing about membership at all.

`SessionScope` stays on the action signature — the callers pass it, and the parameter is what makes the
per-scope hold key in `use-hop-envelope` meaningful — but it no longer reaches the query's filter.

### Protocol hops are read in two layers, and only the second costs a read

The transport line — status with its reason phrase, the two recorded sizes, the duration — is built from hop-row
columns the tree already carries. It therefore costs no read, renders for a hop whose body columns are
withheld, and is what stops "you may not see this" from rendering as "nothing happened". The decoded facts are
the second layer, read on demand for the hop the reader opened, exactly like any other body.

Alternative considered: **decode everything on open**. Rejected for the same reason the inspector reads in
tiers — a `tools/list` response reaches hundreds of kilobytes in the recorded log, and nine protocol hops per
toolset per turn would pay that on every selection.

The line is split by side rather than shared. A single line under the tab strip, visible on both tabs, states
the outcome of the call above the request — which has not made it yet — and the reader on the Request tab is
looking at response facts. So the verb and the size sent render beside the request's parameters, the status,
the size received and the duration beside what answered, and the Chat tab carries neither: it states a
history, not a call. The one place both halves still render together is a hop offering no tab at all, where
the line is the whole of what the section can show.

### A protocol hop is stated as its bodies, not as decoded facts

The first pass decoded each method into a line of named facts — a negotiated version for `initialize`, a count
and tool names for `tools/list`. It read as a *description* of a response rather than as the response, made
two protocol messages look like two different screens, and needed a decoder per method, so the tenth method to
appear had nothing to fall back to but a blank.

What shipped instead states both halves as the JSON they were recorded as, formatted — the same shape a tool
call's arguments and result are stated in, because they are the same kind of thing. The clamp bounds it, and
the recorded size is measured before formatting so the note stays honest.

The one thing this needed from the read layer is that `decodeJsonRpcStream` reads exactly one shape,
`result.content[].text`, which is what `tools/call` answers in and nothing else does. `jsonRpcResultOf` returns
the frame's `result` whole and lets the caller decide, which is also why routing to these panels is now "an MCP
hop that called no tool" rather than a list of the nine methods this console happens to know.

### The status has one home

`ConversationSpanDetail` states `HTTP status` today. The transport line is the better home — the status is the
answer to "did this call work", which is the question the two bodies are read against — so the row leaves the
rail rather than being stated twice. Failure keeps being decided by `isFailedHop`, reused rather than
re-derived, so the chip and the tree's failure marker cannot disagree; a 202 is stated as the success it is.

### The raw switch closes the panel instead of heading it

It moves to the end of both panels and is pinned to the panel's bottom edge rather than scrolling away: the
original reason for pinning it — a recorded body runs far past a screen, and a control that scrolls off with
it strands the reader in the mode they wanted to leave — is unchanged by moving which edge it is pinned to.
Its position in the DOM follows the content, so the reading order and the tab order both put it after what it
governs.

Two consequences to keep in view: a keyboard reader now tabs through the panel's content before reaching the
switch, which is the correct order for a control that acts on that content; and the response's facts line no
longer sits inside the non-raw branch, so it renders in both modes.

### One opaque surface from the strip to the body

The section currently separates its pinned header from its scroll port with a transparent gap. Measured on the
running app the gap is 12px of the section's own ground, with nothing painting into it — but it is exactly the
seam where a stale repaint survives on a pinned element, which is what the reported band of clipped glyphs
looks like. The header block and the scroll port share one ground, and the separation becomes padding inside
that ground rather than a gap between two boxes, so there is no band to see through whatever the compositor
does.

## Risks / Trade-offs

- **A wider row set for the body query** → the trace id, the span id and the recorded time still identify
  one row, and the read takes a one-row page; the query gains no new columns and no new entity.
- **Formatting costs a parse and a serialise on the server** → bounded by the same budget as before, and
  wrapped so a parse failure returns the recorded text rather than throwing inside a server action.
- **Formatted text is larger than what was recorded** → the clamp is applied after formatting, so the
  budget still bounds what crosses; the note states the recorded size and the delivered size separately,
  which is why the recorded one has to be passed in rather than re-derived.
- **Lifting the suppression costs one read per protocol hop the reader opens** → bounded exactly like every
  other hop's read, and the transport line means an unopened or unreadable hop still states something.
- **A protocol body can be large** → the result is clamped like any other raw content, and the clamp states
  what it withheld. A `tools/list` response carries every tool's schema, so this clamp fires in practice.
- **Moving the status out of the rail is a visible removal for anyone who reads it there** → it moves rather
  than disappears, into the surface where the bodies it describes are read.
- **A body clamped mid-document cannot be formatted** → it renders as recorded, with the clamp note that
  already says the content was cut. This is the honest reading: a truncated JSON document is not JSON.
