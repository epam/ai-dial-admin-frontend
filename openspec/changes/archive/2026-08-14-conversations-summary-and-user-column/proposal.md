## Why

The Conversations page header shows four summary pills whose figures contradict each other: a review
of the live page found `1055 CONVERSATIONS` sitting next to `2/1057 RATED` — a denominator larger than
the total it is a subset of. Two defects produce that. The totals effect in `use-conversations.ts`
deliberately skips its first run and reuses the server prefetch, so on the default filter state the
count and cost stay a page-load snapshot while the grid keeps paging a continuously materialized
rollup. And `loadedRows` appends every delivered page with no dedupe while the infinite row model
caps its cache at ten blocks, so a block evicted and re-fetched on scroll-back is counted twice.

The pill row's mixed scope is by design — count and cost are whole-result figures, rated and negative
cover only the loaded rows — but that distinction is currently stated only in a `title` attribute and
visually-hidden text, so a reader glancing at the header has no way to know two of the four numbers
mean something different from the other two. The contradiction and the invisible caveat together make
the whole row read as untrustworthy.

Separately, the grid does not show who held a conversation. `user_hash` is already a field of the
`conversations` entity, is already selected by the detail query and rendered on the conversation
detail page, and is already a column in the Usage Log grids — the list view is the only place it is
missing.

## What Changes

- The count and cost totals are refreshed in step with the grid's first page rather than being left
  as a server-prefetch snapshot, so the pill row cannot present two observations of a live table as
  one consistent set of figures.
- `loadedRows` becomes an accumulator of distinct conversations rather than of delivered rows, so the
  rated pill's denominator counts each conversation once and can never exceed the result total.
- The loaded-scope caveat on the rated and negative pills becomes visible text in the pill, not a
  tooltip alone. The existing `title` and screen-reader text stay.
- `user_hash` is added to the conversation list query's projection, to the list row model, and to the
  grid as a visible column labelled the same way the detail page labels it, attributed to the
  `conversations` provenance group.

Whole-result rated and negative counts are **not** part of this change. Ratings live in the
`rate_analytics` entity, the structured-query DSL has no join, and the only available workaround is
the candidate-id list that is capped at 1000 — so a figure presented as exact would be wrong as soon
as the result exceeded the cap. A separate backend change to carry rating counts on the conversations
rollup is what upgrades those two pills from loaded-scope to whole-result; this change makes their
current scope honest and visible in the meantime.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the result-summary requirement gains the rule that the whole-result figures and the
  loaded-scope figures must be observations of the same fetch cycle and that the loaded-scope caveat
  must be visible rather than tooltip-only; the loaded-conversation count is defined as distinct
  conversations. The conversations-grid requirement and the conversation-list-query requirement gain
  the `user_hash` column and its projection.

## Impact

- `src/components/Analytics/ConversationsTrace/use-conversations.ts` — totals refresh trigger and the
  `loadedRows` accumulator.
- `src/components/Analytics/ConversationsTrace/Header/ConversationsSummary.tsx` — visible scope
  caveat on the rated and negative pills.
- `src/utils/analytics/conversations-queries.ts` — `user_hash` in the list query's `select`.
- `src/models/analytics/conversations-trace.ts` — `user_hash` on `ConversationRow`.
- `src/constants/grid-columns/grid-columns.tsx` — the `user_hash` column definition.
- `src/constants/analytics/conversations-trace.ts` — `user_hash` in the `conversations` provenance
  group, so every column keeps belonging to exactly one group.
- `src/constants/i18n.ts` and `src/locales/en.ts` — a key for the visible scope caveat; the "User"
  header label already exists for the detail page and is reused.
- No shared component, context or API route changes, so no other view is affected. The server
  prefetch in `app/[lang]/conversations-trace/page.tsx` keeps its role of painting the pills on first
  render; only its permanence changes.
