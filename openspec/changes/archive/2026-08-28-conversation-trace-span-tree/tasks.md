## 1. Shared tree primitives

- [x] 1.1 Extract the grid-free expansion state out of `src/components/Common/TreeGrid/use-tree-rows.ts` into
      `src/components/Common/TreeGrid/use-tree-expansion.ts` — expansion map, stale-id pruning,
      `overlayExpandedState`, `flattenTree`, toggle — with a `defaultExpanded` option. Leave the AG Grid
      `refreshCells` effect in `use-tree-rows.ts`, which now wraps the extracted hook. Telemetry grid behavior
      must not change (still collapsed by default).
- [x] 1.2 In `src/components/Common/TreeGrid/utils.ts`, correct the recovery warning so a depth-cap hit is not
      reported as a cycle, and note in a comment that `getId` is unique in the span case so the composite-key
      machinery collapses to the trivial one.

## 2. Tree model and builder

- [x] 2.1 Add the tree node types to `src/models/analytics/conversations-trace.ts` — node kind (span, event,
      unrecorded root), `isMatch`, `position`, `depth`, `ancestorHasNextSibling`.
- [x] 2.2 Create `src/utils/analytics/conversation-span-tree.ts`: build the span tree with
      `buildTreeFromParentPointer` keyed on `core_span_id` / `core_parent_span_id`, sort siblings by
      `request_time`, attach each hop's event seeds as leaves with derived ids, and assign depth-first
      positions over the unfiltered tree.
- [x] 2.3 In the same util, render an unrecorded root as a named placeholder taking its name from the first
      segment of a child's `execution_path`, marked as not recorded, with the trace's hops beneath it.
- [x] 2.4 Rework `src/utils/analytics/conversation-hop-stream.ts` to emit a tree: keep `eventsForHop`,
      `isConversationHop`, `isFailedHop` and the `route` exclusion unchanged, keep `markUnansweredCalls`
      running over the flat seed list before nesting, then hand off to the tree builder.
- [x] 2.5 Remove `HopEventType.TurnStart` and `HopEventType.TurnComplete` along with their seeds, label keys,
      rail classes and the `span === null` render branch — the trace view's heading and figures already state
      the turn's question and totals.
- [x] 2.6 Replace `filterEvents` / `rowCountOf` with a marking filter: set `isMatch` on the emphasised
      category and prune nothing, and count matches against the turn's total nodes.
- [x] 2.7 Derive the offered category set from the built tree so a category the turn recorded none of gets no
      control; `FILTERABLE_EVENT_TYPES` becomes the ordering for whichever categories are present.
- [x] 2.8 Add the flatten step that turns the visible tree into rows carrying `depth` and
      `ancestorHasNextSibling`, for the renderer's guide rails.

## 3. Rendering

- [x] 3.1 Rewrite `src/components/Analytics/ConversationsTrace/Detail/ConversationEventStream.tsx` to render
      flattened rows with depth indentation and guide rails drawn from `ancestorHasNextSibling`. Rails are
      decorative and get `aria-hidden`.
- [x] 3.2 Add the expander control to nodes with children — `aria-expanded` plus `aria-controls` bound to a
      real `useId()`, per `.claude/rules/a11y.md`. Wire it to the hook from task 1.1 with
      `defaultExpanded: true`.
- [x] 3.3 Dim non-matching nodes while keeping them selectable and openable, and give each match a marker that
      does not rely on colour or opacity.
- [x] 3.4 Show the match count only while a category is emphasised — nothing at rest — and keep it in the live
      region, since dimming leaves assistive technology no other signal that the filter found anything.
- [x] 3.5 Render filter controls only for the categories present in the turn, and preserve the
      nothing-recorded empty state.
- [x] 3.6 Move `HOP_EVENT_RAIL_CLASS` onto the palette in `design.md` — reasoning to `accent-primary`,
      embedding to `warning`, empty and other to `secondary` — and add the matching
      `border-<token> text-<token>` chip map beside it, following `ConversationTraceChips`. The chip that
      clears the filter stays neutral (`border-primary text-secondary`).
- [x] 3.7 Give the emphasised chip a fill and a glyph alongside `aria-pressed`, so its active state is not
      carried by hue alone.
- [x] 3.8 Measure `text-warning` and `text-accent-tertiary` against `bg-layer-1` and confirm both clear 4.5:1;
      `a11y.md` publishes ratios for the other tokens in the map but not for these two. Substitute if either
      fails.
- [x] 3.9 Add the new i18n keys to `src/constants/i18n.ts` (`ConversationsTraceI18nKey`) and
      `src/locales/en.ts` — expand/collapse labels, unrecorded-root label, match marker. Reuse
      `BasicI18nKey` / `ButtonsI18nKey` where a label already exists.
- [x] 3.10 Update `src/components/Analytics/ConversationsTrace/Detail/ConversationTraceView.tsx` for the new
      builder signature, memoizing the tree on `(spans, modelOutputs, figures, title)` and the filtered/
      flattened rows on `(tree, filter, expansion)`.

## 4. Tests

- [x] 4.1 Unit-test `conversation-span-tree.ts` in
      `src/utils/analytics/tests/conversation-span-tree.spec.ts`: nesting by parent id, sibling ordering,
      events as leaves, orphan hoisting, cycles, depth-cap recovery, unrecorded-root naming, and depth-first
      positions.
- [x] 4.2 Extend `src/utils/analytics/tests/conversation-hop-stream.spec.ts` for the tree output: `route`
      exclusion not taking non-`route` children with it, failed hop keeping its children, and
      `markUnansweredCalls` still counting across the whole turn.
- [x] 4.3 Unit-test the marking filter, the derived category set and the flatten step — matches marked and
      nothing pruned, a category with no events absent from the set, and positions unchanged under filtering
      and collapsing.
- [x] 4.4 Unit-test `use-tree-expansion.ts` under `src/components/Common/TreeGrid/tests/`, including
      `defaultExpanded`, and confirm the existing `use-tree-rows` tests still pass unchanged.
- [x] 4.5 Update the component tests in
      `src/components/Analytics/ConversationsTrace/tests/ConversationTraceView.spec.tsx` and add coverage for
      the tree rendering — expanded on open, collapse hiding descendants and exposing `aria-expanded`, a
      dimmed node still openable under a filter, no control for an absent category, and no match count at
      rest. Query by role and accessible name per `.claude/rules/testing.md`.

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and resolve everything
      they report.

No `spec-browser-verify` task: the change's scenarios are browser-observable, the question was put to the
user, and they chose unit tests only.

## 6. Hop categories and single-event collapse

Follow-on to groups 1–5, which shipped a category set covering events only. Hop nodes are built with a null
type, so `markMatchingNodes` can never match one and `categoriesOf` never offers one — every model call,
MCP call and embedding call dims under any filter, including the call that produced the very event being
emphasised. The same gap renders a one-event hop as two rows with the same label. Both come from carrying
the flat view's taxonomy over unchanged, where a hop had no row of its own.

- [x] 6.1 Add a model-call category to `HopEventType` and give hop nodes a type in
      `src/utils/analytics/conversation-span-tree.ts`, so a hop node can match a filter and be offered as a
      control.
- [x] 6.2 Collapse a hop that holds exactly one event and no child hops into a single node carrying the hop's
      figures and the event's type and label. A hop with several events, or with hops nesting under it, keeps
      its own node.
- [x] 6.3 Extend the palette in `src/constants/analytics/conversations-trace.ts` — model call takes
      `accent-primary`, reasoning moves in with text on `accent-secondary` to free it. Keep the measured
      contrast comment beside it accurate for the tokens still in use.
- [x] 6.4 Unit-test both in `src/utils/analytics/tests/conversation-span-tree.spec.ts`: a multi-event model
      call keeps its node and is typed as a model call, an embedding hop collapses to one node, a one-event
      hop with children keeps its node, and the match count counts a collapsed call once.
- [x] 6.5 Extend the component tests for a collapsed leaf marked rather than dimmed when its own category is
      emphasised, and for the model-call control appearing only when a multi-event call exists.
- [x] 6.6 Re-run `npm run lint`, `npm run format`, and `npm run test` — group 5's gate ran before this group
      existed.
- [x] 6.7 Derive a surviving hop node's category from its own events instead of hardcoding model call:
      several events means model call, exactly one means that event's category. This needs no new category
      beyond model call, and keeps an MCP or embedding call that acquires children in some future deployment
      correctly labelled without a release here. Only `llm_call` hops have children in today's data (16 of 16
      sampled), so the test must construct the case: a one-event MCP hop and a one-event embedding hop, each
      with a child, asserting each keeps its own category rather than reading as a model call.
- [x] 6.8 Drop the "no other hop nests under it" condition from the collapse: a hop with exactly one event is
      one node whether or not it has children, and child hops nest under that same node. This removes the
      duplicate row and the double-count in the one shape 6.2 left open — an orchestrating call that answered
      without requesting a tool, which is a live shape, not a theoretical one. Update the `orchestrating`
      fixture accordingly: it should now assert one node per hop, and the failed-orchestrator case should
      yield a single `Error` node rather than `[Error, Error]`.
