## Why

Review feedback on the Conversations page: the grid "lacks sorting/filtering". It does, deliberately —
the current requirement forbids both, on the grounds that a column filter narrows only the pages already
fetched and would then report that narrowed view as the complete answer.

That reasoning is sound but it argues against *client-side* filtering, not against filtering. The
structured-query DSL already expresses sort keys with direction and nulls ordering, and the whole
comparison operator set (`eq`, `ne`, `ico`, `inc`, `lt`, `gt`, `le`, `ge`, `in`). Pushed into the query,
a sort or a column filter applies to the whole result and the objection disappears. The Usage Log grids
already work this way against the same kind of backend.

The constraint that stays is which columns may participate. A control that narrows or reorders and does
not return true results is worse than no control, so only columns backed by a real `conversations` field
get one.

## What Changes

- Columns backed by a `conversations` field become sortable, with the sort pushed into the query. Text,
  number and timestamp columns get the operator sets the DSL can express, reusing the existing
  `baseStringFilter` / `baseNumberFilter` presets — whose `filterOptions` already exclude the AG Grid
  options (`startsWith`, `endsWith`) the DSL has no operator for.
- Column filters become query predicates, ANDed with the page's own search, period and feedback filters.
  The page's filter state is still never pushed into the grid's filter model, and the grid is still never
  handed a superset to narrow.
- The `Rating` column stays unsortable and unfilterable. It has no field behind it — it is composed from
  per-page `rate_analytics` lookups — so any ordering or narrowing of it would describe only the rows
  already on screen. The feedback control remains its filter.
- The activity column becomes sortable but not filterable: the page's time-period control already owns
  that dimension, and a second control over it would let a filter appear to widen a range the period
  clips.
- A sort or column-filter change discards the fetched pages and restarts from the first page, exactly as
  a search, period or feedback change already does. The whole-result count and cost are re-resolved
  under the same predicates, so the summary keeps agreeing with the rows.
- **BREAKING (spec-level)**: the "Read-only conversations grid" requirement is removed and replaced. Its
  no-sort/no-filter scenarios are the behaviour being reversed, so they cannot survive as a modification.
- When the feedback filter's candidate query returns its full 1000-id limit, the view states that the
  result may be incomplete. That is already true today; sorting makes it matter, because the candidate
  set is retained in most-recently-rated order and only a `last_request_time desc` listing is guaranteed
  to agree with it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the conversations-grid requirement is replaced by one that permits server-side sorting and
  per-column filtering on field-backed columns while keeping every other guarantee (provenance band,
  openable rows, reachable long values, loading and empty states). The conversation-list-query requirement
  accepts sort keys and column predicates. The paging requirement adds sort and column filters to the set
  of changes that restart paging. The feedback-filter requirement gains the candidate-cap disclosure and
  drops the assumption that the listing order is fixed.

## Impact

- Depends on `conversations-summary-and-user-column`, and must be applied and archived **after** it. That
  change moves the totals resolution into the first-page fetch, which is what lets the totals pick up the
  column filters for free; it also adds the user column, which this change makes sortable and filterable.
- `src/utils/analytics/conversations-queries.ts` — the list and totals queries accept sort keys and column
  predicates.
- New pure utils translating the grid's sort and filter models into DSL sort keys and predicates, tested
  in isolation, following `translateUsageLogSortModel` / `translateUsageLogFilterModel` in
  `src/utils/telemetry.ts`.
- `src/models/analytics/conversations-trace.ts` — serializable sort-key and column-filter shapes crossing
  the server-action boundary.
- `src/app/[lang]/conversations-trace/actions.ts` — `getConversations` and `getConversationTotals` accept
  them.
- `src/components/Analytics/ConversationsTrace/use-conversations.ts` — the datasource reads
  `params.sortModel` and `params.filterModel`; a candidate set at the cap raises the disclosure.
- `src/constants/grid-columns/grid-columns.tsx` — `restrictSort` receives the sortable field whitelist
  instead of an empty array; per-column filter presets replace the blanket `filter: false`.
- No shared grid component changes and no column-state persistence, so no other grid is affected. Sort and
  filter state lives only in the mounted grid; persisting it belongs to the column-selection change, which
  is what introduces a `storageKey` here.
