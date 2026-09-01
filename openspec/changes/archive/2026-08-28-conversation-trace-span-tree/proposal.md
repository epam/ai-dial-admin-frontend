## Why

The trace drill-in renders a turn as a flat numbered stream, and the analytics spec states the reason
outright: "The span tree is one root with hundreds of direct children and a second level only under a tool
call, so nesting conveys almost nothing." That measurement was taken on one trace, and on that trace it holds.
Read across the table it does not.

Three shapes exist, all verified against ADAS dev:

- **Flat**, and dominant. Trace `d06f3890…` is 1 970 spans: one root, everything else its direct child.
  Nesting adds nothing here, and the current stream is the right reading.
- **Genuinely nested.** Trace `ba00487…` is 11 spans, of which one RAG application owns a sub-tree —
  its own embedding call and its own model call. Flattened, that RAG call is one sibling among ten and its
  two children read as two more siblings. The structure that explains the turn is exactly what the flat view
  discards.
- **Deep.** Trace `89bcf12…` is a three-level chain: a budget-demo application → a routing application →
  `ali.glm-5.2`. Sampling 1 000 parented spans across 696 traces, 18 (~2%) have a
  parent that is itself a child — rare, but not absent, and these are precisely the traces a reader opens the
  drill-in to understand. That same trace also has no root row at all, which is rarer still: 4 954 of
  1 860 573 traces record no root (0.27%), and a 50-trace sample of conversation traces contained none. The
  placeholder root is a correctness case, not a shape to design around.

So the flat view is not wrong, it is lossy on the traces that need it least to be. The parent pointer is
already fetched and already ignored.

## What Changes

- **BREAKING (spec)**: the requirement "A turn renders as a flat, typed, filterable event stream" is replaced.
  A turn renders as a tree. The flat view is removed rather than kept behind a toggle — one view, one
  selection state, one filter state. The replacement also **reverses** that requirement's rule that every
  category stays selectable whether or not the turn recorded any of it.
- Spans nest by `core_parent_span_id`. A span whose parent is absent from the loaded page is hoisted to root
  rather than dropped.
- A span's synthesized events (text, tool request, tool result, reasoning, empty, error) become leaves under
  the span that emitted them, instead of sitting in the same plane as it. This is the tree's main gain even on
  a flat trace: one model call and its four events stop reading as five peers.
- An unrecorded root renders as a synthetic node named from the first segment of a child's `execution_path`.
  Trace `89bcf12…` names its missing root `deployment-name-stage` this way. The same synthetic-ancestor
  approach is already used by `utils/entities-consumption-tree.ts`.
- The type filter **dims** non-matching nodes instead of removing them. Nothing is hidden, so the structure can
  never be broken by narrowing and no ancestor has to be forced back in as a special case. A dimmed node stays
  selectable and openable, and matches carry a marker that does not rely on colour.
- Only the categories the turn actually recorded get a filter control. Under dimming, a control for an absent
  category would dim everything and mark nothing; the absent control answers "were there any errors" on its
  own.
- The frame rows — the turn's question and its totals — are removed. The trace view's heading and its
  duration/tokens/cost/spans/status figures already state both, and a node standing for no hop is one the
  reader can neither open nor act on.
- Ordering stays by `request_time`, applied **within each parent's children**. The global time ordering the
  flat stream provided is lost; this is accepted, and the design records why.
- Nodes expand and collapse, with the state exposed programmatically, not just visually.

## Non-goals

- **Grouping repeated siblings.** Trace `d06f3890…` has 1 965 near-identical children; a tree does not fix
  that, and collapsing them by deployment is a separate change with its own reading-model questions.
- **Synthesizing levels the data does not record.** Interceptors are not spans — `event_kind` is only
  `llm_call`, `embedding`, `mcp`, `route`, and empty. Upstream is `response_upstream_uri`, a column on the
  span's own row, not a child. Neither becomes a tree level; upstream stays a line inside its node.
- **Raising `CONVERSATION_SPAN_LIMIT`.** The cap stays at 300, and the tree states that it was capped, exactly
  as the flat stream does today.
- **A parent-resolution fallback via `execution_path`.** Checked and rejected: all 300 sampled root spans have
  an `execution_path` of length 1, so the path never supplies a parent the pointer lacks. It is used only to
  *name* a missing root, never to build an edge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the turn's rendering requirement changes from a flat numbered stream to a tree — nesting rule,
  orphan hoisting, unrecorded-root naming, events-as-leaves, ancestor-preserving filtering, and expand/collapse
  state. The typing, deny-list, route exclusion, unanswered-tool-request, and body-reading requirements are
  unchanged and are not restated.

## Impact

**Behavior**

- The drill-in's reading model changes for every trace. On a flat trace the visible change is that events
  indent under their span; on a nested trace the hierarchy appears.
- Line numbers over a flat stream no longer describe the view. The design decides what replaces them.

**Code**

- `utils/analytics/conversation-hop-stream.ts` — currently emits a flat `HopEvent[]`; becomes a tree builder.
- `components/Analytics/ConversationsTrace/Detail/ConversationEventStream.tsx` — renders nodes, rails, and
  expanders instead of rows.
- `models/analytics/conversations-trace.ts`, `constants/analytics/conversations-trace.ts`,
  `constants/i18n.ts`, `locales/en.ts`.

**Reuse**

- `components/Common/TreeGrid/utils.ts` — `buildTreeFromParentPointer` already hoists orphans to root, detects
  cycles, and caps depth. Used as-is; not modified.
- `components/Common/TreeGrid/use-tree-rows.ts` — the expand/collapse hook, but coupled to AG Grid
  (`GridApi`, `refreshCells`). The stream is not a grid, so the grid-free part must be separated out.

**Not affected**

- No query change: `buildConversationSpansQuery` already projects `core_parent_span_id` and `execution_path`.
- The trace *listing* (cards, groups, unrecorded-root panel) is untouched — this change is the drill-in only.
