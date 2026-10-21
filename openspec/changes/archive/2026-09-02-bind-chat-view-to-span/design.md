## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `ConversationTraceView` renders one bordered box holding the span tree (`ConversationEventStream`) and a
  fixed-width rail (`ConversationSpanDetail`). The rail holds the span's facts **and** `HopInspector`, whose
  two tabs are the only reader of the tiered body reads.
- `HopInspector` already computes `activeSide` defensively — "the side actually on screen, and the only value
  anything is allowed to decide from" — because gating the response read on the reader's last *choice* rather
  than on what is rendered had already produced two values deciding one thing. That shape has to survive
  going from two tabs to three.
- `HopInspectorSide` is not a UI enum. `bodyFieldsFor(side)` and `isSideReadable(side, fields)` on the server
  turn it into a column list, so every member must name a real body column.
- `useHopRequest` fetches on selection; `useHopResponse` is deliberately lazy, enabled only while the
  Response tab is active. Chat needs both.
- `re-resizable` is already a dependency and `components.md` §5 names it for resizable panels. The one
  in-repo precedent, `Runs/Details/BottomDrawer`, sizes its drawer in **pixels** and carries a pointer-only
  handle labelled from `RunsI18nKey`.
- Test environment is jsdom: every element measures zero, so nothing that depends on measured height can be
  asserted.

## Goals / Non-Goals

**Goals:**

- One place decides which body tabs a span offers, so the tab strip, the reads and the panels cannot
  disagree.
- The 20% floor holds under a viewport change, not only under a drag.
- The split and its separator are domain-free and reusable, and testable without layout.
- Chat costs no read that Request and Response did not already make.

**Non-Goals:**

- Persisting the split across page loads or between conversations. It lives for as long as the open trace.
- Unifying `Runs/Details/BottomDrawer`'s handle with `SplitPane`'s. Two adjacent fixes to that drawer *were*
  folded in — its grip used `bg-tertiary`, a background token the palette does not define, so it rendered
  invisibly; and its separator had no keyboard operation, which
  `openspec/specs/analytics-bottom-drawer/spec.md` has required all along (Arrow 20px, Shift+Arrow 100px) and
  which was never implemented. The first was asked for directly; the second is that existing requirement
  being satisfied, not a new one. Sharing one component between the two remains out of scope: the drawer has
  a collapse control, a portal and pixel sizing of its own.
- Reworking the tiered read, the clamps, or the dialect parsers.

## Decisions

### Percentage-sized split, not pixel-sized

`SplitPane` keeps the top section's height as a **percentage** in state and hands `re-resizable`
`size={{ height: '52%' }}`, `minHeight="20%"`, `maxHeight="80%"`.

*Why:* the floor is specified against available height, and a pixel height satisfying it at one viewport
violates it at a shorter one — the drawer precedent has exactly this hole. Percentages are a first-class
`re-resizable` feature, not a workaround: it resolves percentage `minHeight`/`maxHeight` against the parent
and converts its internal size back to a percentage when the `size` prop is one, so bounds and state stay in
the same unit as the requirement.

*Alternatives:* pixels plus a `ResizeObserver` recomputing bounds on every viewport change (more moving parts
for the same result, and the clamp then runs in an effect where a stale value is visible for a frame);
pixels with no observer (fails the floor requirement); CSS `resize: vertical` (no floor, no keyboard, no
state).

*Consequence:* the pointer path is untestable in jsdom. The clamp is therefore extracted as a pure function
and unit-tested, and the keyboard path — which is percentage arithmetic with no measurement — carries the
interaction tests.

### The separator is a real splitter, not a decorative grip

`role="separator"`, `tabIndex={0}`, `aria-orientation="horizontal"`, `aria-valuenow` / `aria-valuemin` /
`aria-valuemax` carrying the same numbers the drag enforces, and Arrow keys moving the split in fixed steps
with Home/End going to the floors. `ariaLabel` is a required prop.

*Why:* `a11y.md` requires keyboard parity for any pointer affordance that does real work, and a splitter's
state is exactly what `aria-valuenow` exists for. It also gives the component a testable surface: the
rendered `aria-valuenow` **is** the state.

*Alternative:* copying `Runs/.../ResizeHandle` — at the time pointer-only, with no value state, and labelled
from a Runs i18n key, so it would have to be generalised anyway. That handle has since been given the same
pattern in place, at the step sizes its own spec requires.

### A new `SpanBodyTab` enum; `HopInspectorSide` keeps its meaning

`SpanBodyTab { Request, Response, Chat }` is the UI enum. Chat maps to *both* envelope sides; Request and
Response map to their own.

*Why:* adding `Chat` to `HopInspectorSide` would put a member with no column into the server's
`bodyFieldsFor` switch — a value the read layer would have to reject at runtime to stay correct. Two enums
with an explicit mapping states the relationship instead of hiding it in a name.

### `HopInspector` keeps its name and grows a third tab

It moves from the rail into the bodies section and owns the tab strip, the tab set, and the three panels.
`ConversationSpanDetail` keeps only the facts. The offered-tab set is computed once, from the hop row and the
column grants, and `activeTab` is resolved against it exactly as `activeSide` is today.

*Why:* the component's job — tabs over one hop's bodies — is unchanged, and the modified spec still calls it
the inspector. Renaming would churn its imports and its spec file for no change in responsibility.

*Consequence:* `HopInspector` no longer returns `null` for a fully withheld hop, and no longer branches by
kind before the tab strip; it returns nothing to render and the **caller** decides.
`ConversationTraceView` renders the tree alone when the span offers no tab, so an empty half-screen panel
never appears — this is why the offered-tab set is computed in a hook (`use-span-body-tabs`) that both the
view and the inspector read, rather than inside the inspector.

### One tab layout for every kind of hop, including MCP and embedding

Every kind renders through the same tab machinery. An MCP hop's arguments go on Request and its result on
Response; an embedding hop's probe text goes on Request and its dimension count on Response. Facts read from
the hop row rather than from a body — an MCP hop's method, tool name and toolset — render above the tab strip,
in the slot `HopParamsLine` already occupies, so they stay visible on every tab without being duplicated.

*Why:* the alternative was to keep `HopMcpPanel` as a merged, tab-less panel, which is what it is today. That
shape was chosen when it lived in a 360px rail, where two tabs of two fields each would have been wasteful; in
a half-height full-width section the crowding argument is gone, and what remains is a layout that changes
under the reader as they move down a tree of mixed kinds. It also leaves the current oddity in place, where an
embedding hop's dimension count — its one response-column field — renders inside the Request tab while the
Response tab states that there is nothing to read.

*Trade-off:* `getConversationHopMcp` issues one `readHopBody` naming both sides, so for MCP the tabs buy no
laziness the way they do for a model call — both halves are already paid for in one round trip, and the split
costs a click to reach a result that is in memory. Accepted: a consistent place to look is worth more than a
saved click, and the reader arriving at an MCP hop is usually asking about the result, which is one tab away
and instant.

*Consequence:* the response side of an embedding hop is no longer purely suppressed. `hopSideSuppressionsOf`
still marks it `Vector` — the vector is never rendered — but the tab now has one fact to state, so the
suppression note is what surrounds the dimension count rather than what replaces it.

### Chat is a second presentation of the same envelopes

`HopChatPanel` takes the already-fetched `HopRequestEnvelope` and `HopResponseEnvelope`, and
`useHopResponse`'s enable predicate widens to `activeTab === Response || activeTab === Chat`. Clamped turns
reuse `useHopMessage` — the same tier-2 read the Request tab uses, so opening a turn in Chat and opening the
same message in Request hit one cache path.

*Why:* the spec forbids a second read, and the envelope already carries role, text, clamp flag and tool calls
per message — which is the whole of what a chat turn renders.

*Alternative considered and rejected:* a `HopResponseMode`-style toggle inside the Request tab instead of a
third tab. The user asked for three tabs, and a mode buried in one tab is not discoverable as a way to read
the conversation.

### The chat bubble inherits `ConversationTimeline`'s look, not its data

The bubble treatment — alternating alignment, rounded corners with a squared corner on the speaker's side,
`whitespace-pre-wrap` — is lifted from the component being deleted. System, tool and unrecognised roles get a
third, full-width treatment with an explicit role label so they read as machinery rather than as either
party's speech.

*Why:* readers already know this shape; the change is which conversation it shows, and a new visual language
would make the relocation read as a redesign.

### Deletion is staged behind the new surface

The transcript pipeline is removed **after** Chat lands, in its own step: the view switch and
`ConversationDetailBody` first, then the server action, hook, timeline, utils and models. `isReadable` is
dropped from `TranscriptBodyFields` and `ConversationTranscriptAvailability` in that step, since the per-side
gating is what replaces it.

*Why:* it keeps each step reviewable and keeps a working build at every step. It also means the risky half
(deleting a spec'd server capability) is a diff a reviewer can read on its own.

## Risks / Trade-offs

- **A percentage `size` is only as good as the parent's height.** If the split's parent is not a bounded
  flex child (`min-h-0` all the way up), a percentage resolves against a collapsing box and the sections
  render at zero. → The split is introduced inside the existing bordered box, which is already
  `flex min-h-0 flex-1`; the SplitPane asserts its own `min-h-0` and the component test renders it inside a
  bounded parent.
- **jsdom cannot verify the drag.** → The clamp is a unit-tested pure function and the keyboard path is
  component-tested; the drag is the one path covered only by the library's own guarantees.
- **Deleting the transcript deletes a spec'd capability with real reasoning behind it** — the entry-hop rule
  existed to stop a system prompt rendering as a user's question. → The replacement renders system turns
  deliberately and labels every turn by role, which is the same protection by a different mechanism, and the
  REMOVED entries in the delta carry the reasoning forward rather than dropping it silently.
- **Chat can mislead a reader who expects the whole conversation.** A deep hop's history is that hop's view,
  not the session's. → The tab lives inside a span's detail, under the span's own facts, and the trace states
  which span is selected; nothing presents it as the conversation's transcript.
- **`re-resizable` renders its own wrapper element.** A component test querying by DOM structure could break
  on a library upgrade. → Tests query by role (`separator`) and by the panels' own accessible names.

## Migration Plan

No data migration and no backend change. Deploy is a frontend release. Rollback is a revert of the change —
the removed server action has no other caller, so nothing outside this change depends on either state.
