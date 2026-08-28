## Context

See `proposal.md` — Why. The requirements are in `specs/analytics/spec.md`; this document does not restate
them.

What constrains the approach:

- `buildConversationSpansQuery` already projects `core_parent_span_id` and `execution_path`. No query changes.
- `buildHopEventStream` currently produces a flat `HopEvent[]`: it filters `route` hops, sorts by
  `request_time`, expands each hop into one or more event seeds, runs `markUnansweredCalls` across the whole
  turn, then numbers the result.
- `markUnansweredCalls` resolves the tool-request/tool-result surplus **by count per tool name across the
  entire turn**. Whatever the new shape, it must still see every seed at once.
- `components/Common/TreeGrid/` already holds a tested, domain-free tree builder and an expand/collapse hook.
  The hook is coupled to AG Grid; the builder is not.
- Spans arrive capped at `CONVERSATION_SPAN_LIMIT` (300). A trace can hold thousands, so a page can cut
  through the middle of a tree.

## Goals / Non-Goals

**Goals:**

- One tree structure, built once per trace, that the filter and the expand/collapse state are applied *over*
  rather than baked into.
- Node positions that are a property of the tree, not of the view, so filtering and collapsing cannot renumber
  them.
- Reuse the existing tree builder rather than growing a second one.

**Non-Goals:**

- Virtualized rendering. The turn measured at 446 nodes; the current stream already renders that many rows
  without it, and adding it here would couple the tree to a windowing library for no present gain.
- Full `role="tree"` ARIA with arrow-key navigation — see Decisions.
- Anything in `proposal.md` — Non-goals.

## Decisions

### Reuse `buildTreeFromParentPointer` rather than write a span-specific builder

`components/Common/TreeGrid/utils.ts` already does the three things the spec's hardest clause needs:

- a row whose parent id is not among the loaded rows becomes a root (orphan hoisting);
- a back-edge into an ancestor is dropped rather than followed (cycles);
- after building, any row never visited is re-rooted, so nothing silently disappears.

That last pass is what satisfies "No hop SHALL be dropped for want of a place in the tree" — including at the
depth cap, where children are skipped during the walk and then recovered as roots.

Two quirks to carry a comment rather than a fix:

- The builder keys children by `getId(row)` and maintains composite `id:parent` keys, because the telemetry
  rows it was written for have repeating deployment names as ids. `core_span_id` is unique, so this machinery
  collapses to the trivial case. It works; the naming just reads oddly in a span context.
- A depth-cap hit is recovered by the same pass that recovers cycles, so it logs "Cycle detected". Misleading
  in an observability tool. Adjust the message to name both causes.

*Alternative rejected:* a span-local builder in `utils/analytics/`. It would duplicate cycle and orphan
handling that is already covered by tests, to avoid a naming smell.

### Build the tree from spans, then hang event seeds off it

Order matters because of `markUnansweredCalls`:

0. Drop the `TurnStart` / `TurnComplete` seeds. `HopEventType` loses both members, and with them the
   `span === null` branch that rendered a row as a `div` instead of a `button` — every node now stands for
   something openable.
1. Filter out `route` hops and expand every remaining hop into event seeds, as today.
2. Run `markUnansweredCalls` over the **flat** seed list, so the per-tool-name counting still sees the whole
   turn.
3. Build the span tree from the hops.
4. Attach each hop's seeds as leaf children of its node, ordered as `eventsForHop` produced them.
5. Collapse every hop that holds exactly one event into that event: one node carrying the hop's figures and
   the event's type and label. Child hops nest under that same node — they are calls the hop *made*, not
   things it *emitted*, so they are no reason to keep a second row.
6. Walk the tree depth-first once, assigning positions.

Step 5 is what keeps the taxonomy honest. `eventsForHop` emits exactly one event for every hop kind except a
multi-event model call — embeddings, MCP envelopes, MCP tool results, failures, and model calls that simply
answered are all one-to-one. Without the collapse each of those is a hop row and an event row carrying the
same label, and giving hop nodes a category (which they need, or no hop could ever match a filter) would make
that worse: two coloured rows per call, and a match count that counts each call twice.

Exempting a hop *with children* from the collapse was tried and rejected. An orchestrating call that answered
with text and then made sub-calls is a live shape, not a theoretical one, so the exemption put the duplicate
row and the double count back on exactly the calls a reader opens the tree to understand — and the duplicate
announced itself as `[Error, Error]` for a single failed orchestrating call.

A surviving hop node's category is then **derived from its own events, not from its kind**: several events
means model call, exactly one means that event's category. Two things follow. The category set grows by
`ModelCall` alone — the single-event case reuses a category already offered. And the rule stays correct for
hop kinds the data has not produced yet: an MCP or embedding call that acquires children in some future
deployment reads as an MCP or embedding call the day it appears, with no release here. Hardcoding
`ModelCall` on every surviving hop would have been correct against today's data and silently wrong against
tomorrow's, which is precisely what the deny-list rule exists to stop.

`eventsForHop` and `markUnansweredCalls` are unchanged. Excluding a `route` hop at step 1 removes it from the
tree's input, so a non-`route` child of one is orphaned by step 3 and hoisted — which is the behavior the spec
requires.

Event nodes have no identity in the data, so their ids are derived (`<core_span_id>:event:<index>`). They are
always leaves.

*Alternative rejected:* interleaving events during the tree walk. It would put `markUnansweredCalls` inside a
recursive traversal, where "every seed at once" is exactly what it no longer has.

### Position numbers are assigned at build time, not at render time

Depth-first pre-order over the unfiltered, fully-expanded tree, stored on the node. Filtering and collapsing
read it; nothing recomputes it. This is the whole of "Positions survive filtering and collapsing" — as a
render-time counter it would be a standing bug waiting for the first filter.

### Filtering marks, it does not prune

The filter sets `isMatch` on every node of the emphasised category and changes nothing else — no pruning, no
re-parenting, no second tree. The renderer dims what is not a match.

This is what makes the filter cheap and the structure safe: since no node is removed, there is no orphan to
repair, no ancestor to re-attach, and the flattened row list is identical whatever the filter is. It also
keeps a dimmed hop fully selectable, which matters — a reader who narrowed to errors usually wants the call
immediately before one.

*Alternatives rejected:* pruning to matches breaks the tree into rows at depths nothing explains. Pruning but
keeping the ancestors of matches repairs that, but then needs a context-vs-match distinction, a second set of
rules for what the count means, and an ancestor walk on every filter change — all to reach a view that shows
strictly less than dimming does.

Because dimming is colour and opacity, a match also carries its own marker. `a11y.md` forbids colour as the
sole signal, and here the signal applies to most of the screen at once.

Dimming also costs the filter its structural feedback. Pruning removed nodes from the DOM, which assistive
technology notices on its own; dimming changes nothing a reader cannot see. So the live region carrying the
match count is the only thing that reports what the filter found, and it survives even though the resting
count does not — at rest the count would read `14 of 14` forever, which is why it goes.

*Alternative considered:* a count on each chip instead, which would answer "how many errors" without a click
and matches what `ConversationTraceChips` already does in the listing. Not taken here — the removed
requirement deliberately chose one count over per-control counts, and reversing that is a separate decision
from removing a count that dimming made meaningless.

### One palette for chips and rails, and it is smaller than the category list

`ConversationTraceChips` is the pattern to follow, not to duplicate: a bordered pill styled
`border-<token> text-<token>`, with unclassified kinds falling back to `border-primary text-secondary`. The
filter chips take the same shape.

The constraint is the token set. Distinct text hues available: `accent-primary` (blue), `accent-secondary`
(teal), `accent-tertiary` (purple), `error` (red), `warning` (yellow), `secondary` (grey), `primary`
(near-white). That is seven, and `info` / `success` cannot be counted as two more — on the built-in fallbacks
they resolve to the same values as `accent-primary` and `accent-secondary`. Ten categories, seven hues.

Resolved by kinship rather than by finding two more colours:

| Category               | Token             | Why                                            |
| ---------------------- | ----------------- | ---------------------------------------------- |
| Model call             | `accent-primary`  | the call itself; same hue the listing's chips already give `llm_call` |
| Error                  | `error`           | must never be mistaken for anything else       |
| Text / reasoning       | `accent-secondary`| one hue on purpose — both are what the model produced |
| Tool request / result  | `accent-tertiary` | one hue on purpose — two halves of one exchange |
| Embedding              | `warning`         | distinct kind of work, own hue                 |
| Session / empty / other| `secondary`       | the muted bucket, as in the existing chips     |

Reasoning shares teal with text so `accent-primary` is free for the model-call node, which matches
`ConversationTraceChips`'s existing `llm_call → accent-primary`. Full alignment with that component is not
reachable — its palette is over hop kinds, this one is over categories that are mostly events — so embedding
keeps yellow where the listing gives it teal.

`HOP_EVENT_RAIL_CLASS` must move onto the same palette, or the chip and the node stop keying to each other —
which is the whole point. Reasoning goes to `accent-secondary` beside text, embedding to `warning`, and empty,
session and other to the muted `primary` divider.

It must also move onto the same **namespace**, which is the part that is easy to miss: `bg-*` is not the hue
namespace. `bg-error` is #402027 and `bg-warning` is #3F3D25 — dark surface tints meant to sit behind text,
scoring 1.07:1 and 1.40:1 against a `bg-layer-3` card. A rail drawn with them is both invisible and a
different colour from its own chip. So the rail is drawn as a `border-l-2`, and both maps name the same
`border-<token>` — which makes the keying checkable by reading the two maps side by side.

The guide rails between cards answer to 1.4.11's 3:1 rather than to the palette, since they carry structure
rather than category: `border-primary` (3.72:1 on `bg-layer-1`), not `bg-layer-4` (1.37:1).

Contrast: `a11y.md` publishes verified ratios for `accent-primary`, `accent-secondary`, `error` and
`secondary`. It does **not** cover `warning` or `accent-tertiary`, so both need measuring against `bg-layer-1`
before they ship rather than being assumed to pass.

The emphasised chip cannot be signalled by hue alone — the chip already *is* its hue when idle. It carries a
fill and a persistent glyph in addition to `aria-pressed`.

### Only present categories get a control

The category set is derived from the built tree, so it is a property of the turn rather than a fixed list.
`FILTERABLE_EVENT_TYPES` stops being the rendered set and becomes the ordering for whichever categories are
present.

### Extract the grid-free half of `useTreeRows` into Common, don't fork it

`use-tree-rows.ts` holds two separable things: expansion state (`overlayExpandedState`, stale-id pruning,
toggle) which is domain-free and reusable, and an AG Grid `refreshCells` effect which is not. Extract the
first into `use-tree-expansion.ts` under `Common/TreeGrid/` and have `use-tree-rows.ts` wrap it — the
telemetry grid keeps its behavior, and the stream gets the same state machine without importing `GridApi`.

Rule §4 is the reason: the expansion logic is generic UI, so it belongs in `Common/`, not copied into
`ConversationsTrace/`.

The spec requires the tree to open fully expanded, while `buildTreeFromParentPointer` sets `expanded: false`
on every node. Give the extracted hook a `defaultExpanded` option rather than changing the builder, so the
telemetry grid stays collapsed-by-default.

### Render a flattened row list with depth-driven rails, not nested containers

Flatten the visible tree to rows carrying `depth` and `ancestorHasNextSibling: boolean[]`, then render one row
per node. The rails in the reference design are drawn from that boolean array — a continuing vertical line
where an ancestor still has siblings below, an elbow at the last child.

Flat rows over nested containers because: tab order is document order without extra work; row markup stays
close to what exists; and nesting interactive rows inside interactive rows is the thing to avoid.

Within a row the same rule decides where the expander goes. It belongs inside the card visually, so the card
is a plain container holding two sibling controls — the expander and the selectable row — rather than a button
inside a button. The frame (border, background, selected and failed states) moves onto that container, which
means its hover feedback has to be matched by `focus-within` rather than `focus-visible`: the element the
reader focuses is no longer the element wearing the border.

### Keep list semantics with `aria-expanded`, not `role="tree"`

`a11y.md` requires expand/collapse state to be programmatic — `aria-expanded` on the control plus
`aria-controls` pointing at a real `useId()`. That is satisfied by the existing `role="group"` container with
expander buttons.

`role="tree"` / `role="treeitem"` would be more precise, but it carries a keyboard contract (roving tabindex,
Up/Down/Left/Right) that this change would then owe in full. A half-implemented tree role is worse for a
screen-reader user than an honest list. Left out deliberately; it can be added later without touching the
spec, since no requirement names a role.

Rails are decorative and get `aria-hidden`. A match is marked by text or an attribute, never by the dimming of
its neighbours alone.

### Row text truncates without a tooltip

A departure from `a11y.md`'s "use `DialEllipsisTooltip` when truncating", made after seeing the alternative in
a browser: a row's detail can be a whole model answer, and the tooltip covered the viewport. Worse, ui-kit's
ellipsis tooltip exposes the full text through `aria-label` on the reference node, so a 4 000-character answer
became part of the row button's accessible name — a screen reader read the entire answer to announce one row.

The rule's requirement is that the full value stay reachable, and it is: selecting the row opens it in the
detail panel, where the sent and received bodies already live. The one row that escape hatch does not cover is
the unrecorded-root placeholder, which has no span to open, so it keeps the tooltip — its label is a single
`execution_path` segment, so nothing there can cover the screen.

## Risks / Trade-offs

- **The 300-span cap cuts through a tree** → a trace's later children arrive without their parents and hoist
  to the top level, so a deep trace can render flatter than it is. The existing "showing n of m spans" notice
  already states that the page is partial; no new claim is made about structure.
- **Global time ordering is gone** → on a trace with parallel MCP calls under different parents, "what
  happened next" is no longer readable off the view. Accepted per the proposal; sibling order still carries it
  for the single-level shape, which is most traces.
- **A 1 965-sibling trace gains an indent and rails and nothing else** → the tree does not help there, and
  grouping is a separate change. It does not get worse, but the reader gets no new leverage.
- **Re-filtering and re-flattening on every render** → 446 nodes is small, but both are pure functions of
  (tree, filter, expansion), so memoize on those inputs; the existing stream already memoizes its filter.
- **Reversing a documented spec decision** → the removed requirement's rationale was a real measurement, and
  the REMOVED block records why it no longer generalizes rather than quietly dropping it.

## Migration Plan

Single PR, no data or config migration, no feature flag. The drill-in is behind `ANALYTICS_ENABLED` as before.
Rollback is a revert: nothing persists tree state, and the query is unchanged.
