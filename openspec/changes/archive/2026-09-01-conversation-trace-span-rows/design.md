## Context

See `proposal.md` — Why. What matters for the approach is the shape of the code that produced the defect.

The tree is built in two stages today. `conversation-hop-stream.ts` turns each hop plus its decoded response
into one or more `HopEventSeed`s; `conversation-span-tree.ts` turns hops and their seeds into nodes, and
collapses a hop with exactly one seed into that seed. Two consequences follow from that split, and both are
the defect rather than side effects of it:

- **Two parallel taxonomies exist for the same rows.** `HopEventType` (nine members, event-shaped) types the
  tree; `SpanKind` (five members, call-shaped) types the detail panel's badge. A row and its own detail
  therefore describe themselves in different vocabularies, and the tree's filter chips are drawn from the
  event one.
- **The tree depends on response bodies.** The server action reads and decodes model-call bodies to produce
  `ModelCallOutput[]`, which exists solely to feed seed construction — no other consumer reads it. The trace
  page cannot render its tree until that read completes.

Removing seeds collapses both: `SpanKind` becomes the single taxonomy, and the body read for the tree has no
caller left.

## Goals / Non-Goals

**Goals:**

- One taxonomy for a row, its badge, its filter chip and its detail.
- A node derivable from a hop row alone, so the tree is a pure function of the spans.
- A row's secondary facts decided by what the hop recorded, expressed as data rather than as a formatted
  string, so the component owns presentation and the rule stays unit-testable.

**Non-Goals:**

- Changing how the inspector reads or renders bodies. It already covers everything leaving the tree; this
  change adds one note to it and otherwise does not touch it.
- Changing the hop-log query shapes, other than dropping the model-body read the tree required.
- Any new tree affordance — no grouping, no virtualisation, no timeline. The row count per turn is unchanged
  or lower, so nothing here pushes on the existing bound.

## Decisions

### `SpanKind` becomes the only row taxonomy; `HopEventType` is deleted

`SpanKind` already maps from the recorded event kind and already backs the detail badge, so the tree adopts
it rather than a third set. It gains one member for a rating, recognised by endpoint suffix — the same
mechanism `isModelCall` already uses to classify a hop that records no event kind, so no new kind of
inference is introduced.

*Alternative considered:* keep `HopEventType` and map it onto `SpanKind` for display. Rejected — the two sets
would still have to be kept in step, and the mapping is exactly the indirection that let a row and its
detail disagree.

`HopEventSeed`, `HopNodeKind.Event`, `conversation-hop-stream.ts`, `conversation-model-outputs.ts` and the
`ModelCallOutput` model are removed. `buildSpanTree` takes the spans and nothing else.

### The secondary line is a discriminated union, not a formatted string

A pure function maps a hop row to one of two shapes, or to nothing: one shape carrying tokens,
request-message count and cost; one carrying the chain cost; `null` where the hop recorded neither. The
predicate is *did this hop record tokens or a price of its own* — a data-presence test, not an entity-type
test, which is what keeps it out of the inference the spec forbids.

Duration is not a member of either shape: every row states it in its own column, so repeating it in the facts
would print it twice on exactly the rows that have least else to show. Neither is the upstream host — see
below.

Answering `null` rather than an empty shape is deliberate. The first cut returned an empty unmetered shape and
left the row to notice it had nothing to render, which produced a blank line under the hop's name on every
model call that recorded zero tokens and no price. Emptiness is a property of the hop, so the hop's own
function decides it and the row simply renders what it is given.

It returns the union, not text. The component formats, so the choice is testable without rendering and the
formatting stays where the existing formatters and i18n keys already live.

*Alternative considered:* one line listing every figure and letting empties fall out. Rejected — an
orchestrating hop then leads with an unavailable-value dash where the reader expects its most important
figure, which is the failure mode this rule exists to prevent.

### `spanLabelOf` inverts its preference; the MCP phase becomes a second field

Today the label prefers the MCP tool name, then the method, then the deployment — so a protocol message loses
its server. The label becomes deployment-first (falling back to request URI, then span id), and *what the hop
did* moves to a separate accessor returning the tool name or the method. The row renders both; the detail
heading uses the label alone, which is what it wants.

Both existing non-test callers — the tree and the detail heading — want the new behaviour, so no call site
needs a compatibility path.

### Duration needs a hop-scale formatter, not the conversation one

`formatConversationDuration` was the obvious reuse and is the wrong scale. It renders anything under 50 ms as
`0s`, and recorded hop durations begin at single-digit milliseconds — a 15 ms MCP handshake read as zero,
which is the same misreading the zero-as-no-report rule exists to prevent, reached by rounding instead of by
a missing value. `formatHopDuration` keeps milliseconds below a second and reuses the existing
second/minute/hour shapes above it.

It answers the empty string, not the unavailable dash, for an absent or zero value: the row renders it
directly, and a caller that wants a placeholder — the detail panel does — supplies its own.

### The upstream host is not a row fact

It is constant across every hop of one deployment, so per row it restates the row's own name: a turn that
handshakes two toolsets renders the same host seven times, and being the longest token on the line it pushes
the hop's own method into truncation. It stays in the detail panel, in full, once, for the hop the reader
opened.

This reverses the plan the proposal argued for, and the rendered result is the reason: on an application row
the upstream is genuinely a different thing from the row's name and reads as information, while on a toolset's
rows it is the same fact repeated. One informative case does not pay for the repetition on all the others.

### Removing the model-body read is a subtraction from the server action, not a refactor

`resolveModelOutputs` and its caller in the trace action are deleted along with the field on the payload the
page passes down. The remaining body path — the inspector's on-demand read for one selected hop — is
untouched, and the requirement governing session predicates and time bounds on every hop-log query continues
to apply to it unchanged.

*Consequence worth stating:* the trace page's first paint no longer waits on a body read. That is a
side effect of the subtraction, not a goal, and no figure the view states was ever derived from it.

### The unrecorded-tool note lives beside the tool names the response panel already lists

The requested tool moves into the selected hop's inspector, so the explanation of a missing result belongs
there rather than as a chip on a row. It lands in `HopResponsePanel`, which already renders the hop's
requested tools by name — the response side is where the model asked for them.

The turn-wide MCP tool-call counts are computed once where the spans are in hand and passed down as one prop.
`HopToolCalls` was the first candidate, but it renders the tool calls of the *request* messages — the
conversation history — not the tools this hop asked for, and reaching it means threading the counts through
two further components for a note that belongs on neither.

*Alternative considered:* a context for the counts. Rejected — one read-only value consumed by one component
does not earn a provider, and this repo keeps contexts in `src/context/` for cross-cutting state.

## Risks / Trade-offs

- **A row loses its own type when the reader wanted the events.** The tree no longer says at a glance that a
  hop reasoned or answered — that is now one selection away. → Accepted deliberately: the badge and the name
  answer *what the call was*, which is the question a tree of calls should answer, and the inspector answers
  the other. This is the change's premise rather than a regression to mitigate.
- **The kind no longer distinguishes an orchestrating application from a model.** A reader scanning for "the
  app hop" reads depth and name instead of a badge. → Accepted, and the spec records why no honest badge
  exists. Depth and name are recorded facts; the badge would not be.
- **The rating kind is recognised by an endpoint suffix, which is a shape rather than a documented contract.**
  → The deny-list rule contains the failure: an endpoint that stops matching falls to the generic kind and
  still renders. Nothing disappears, and the row stays selectable and openable.
- **Route hops now render, and their propagation from Core is recent.** A route hop whose parent was not
  propagated will render at the top level. → That is the existing no-hop-dropped rule doing its job, and it
  is strictly better than the current behaviour of not rendering the hop at all.
- **Test churn is broad.** The specs for the hop stream, the tree, the event stream component and the trace
  view all assert seed behaviour. → Unavoidable: the behaviour they assert is what the change removes. The
  suite for the inspector, which is where the removed content now lives, is unaffected.

## Migration Plan

No data migration and no persisted state. The tree's expansion and selection state is per-render, and the
filter emphasis is per-mount, so nothing carries a stale shape across the deploy.

The i18n keys for the removed event categories are deleted in the same change as their last usage, so no key
is left addressing a category the view can no longer produce.

Rollback is a revert: the change is confined to the trace detail's tree, one server-action read, and their
tests.
