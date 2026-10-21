## Why

Painting one screen of the conversations page costs **three full scans of the filtered result** — the
server-prefetched summary, the client's re-resolution of that same summary, and the list query's
`include_total` — and every subsequent scroll block costs a fourth. Each is a separate ClickHouse query:
`StructuredQueryExecutor` issues `include_total` as its own statement, serially after materializing the rows.

Two of those scans compute a number the page already has. `buildConversationTotalsQuery` and
`buildConversationListQuery` are built from the same `conversationFilter(filters)`, so the summary's
`count()` and the list query's `totalCount` are the same figure resolved twice — today by independent
requests that can disagree with each other. Alongside that, revealing a grid column discards every fetched
page to widen a projection by one field, and the entity schema — static for a given deployment and role — is
refetched on every page load.

## What Changes

- **Stop requesting `include_total` on the conversation list query.** The grid's row count comes from the
  result summary's conversation count, which is resolved under an identical filter. Removes one full scan per
  scroll block and makes the summary pill and the grid's row count the same observation rather than two that
  can disagree. Because the summary is not awaited before the rows are delivered, the count reaches the grid
  through `setRowCount` rather than the success callback's second argument.
- **Remove the server-side prefetch of the result summary.** The page component no longer resolves the
  summary; the client's first fetch does, as it already does today immediately afterwards. Removes the
  duplicate scan at mount while preserving the existing requirement that the displayed figures and the loaded
  rows be observations of the same fetch cycle. The page keeps its server-side schema fetch.
- **Resolve candidates, summary and the first page in one server action.** The first page returns the
  feedback candidate ids to the client, which continues to reuse them for later pages through the existing
  in-browser cache. Removes two browser→server round-trips from the initial render under an active feedback
  filter, and one otherwise. No shared server-side cache is introduced: a candidate set is resolved under the
  caller's token, and a cache keyed on filter state alone would serve one caller's set to another.
- **Always project the entity's own fields; keep the refetch only for enrichment-backed columns.** The
  `conversations` entity is one source plus exactly two enrichments, `conversation_insights.*` and
  `conversation_buckets.*`, which the backend `LEFT JOIN`s only when a query names one of their columns.
  Projecting every source-owned offerable field makes revealing those columns free; enrichment-backed columns
  keep restarting paging, because projecting them unconditionally would add two joins and a ~350-byte text
  column to every page of every scroll.
- **Cache the entity schema, keyed by the caller's role.** The schema endpoint filters `sensitive` columns by
  role, so a cache keyed on the entity name alone would either leak field names to a caller who may not see
  them or hide them from one who may. The entry carries a TTL, since a schema patch changes it.

## Capabilities

### New Capabilities

None. Caching the entity schema is a new requirement, but it belongs to the existing `analytics` capability
rather than introducing one of its own.

### Modified Capabilities

- `analytics`: four requirements of the conversations view change, and one is added.
  - *Entity schema responses are cached per caller role* (**added**) — the schema is served from a cache keyed
    on the caller's role with a bounded lifetime; a failed fetch is not cached.
  - *Server-side paging with an exact result total* — the list query no longer requests `include_total`; the
    grid's row count is supplied from the result summary, with the existing short-block heuristic as the sole
    fallback when the summary is unavailable.
  - *Conversations page route, access guard, and server prefetch* — the page no longer prefetches the result
    summary; it continues to fetch the entity schema server-side.
  - *Feedback filter resolved through a second query* — the candidate query is issued inside the same server
    action as the first page rather than as a separate call, and its ids are returned to the client for reuse
    across later pages.
  - *Conversation list query over the conversations entity* — the select names every source-owned offerable
    field unconditionally; only an enrichment-backed field is projected on demand.
  - *Conversation grid columns are offered from the entity schema* — each offered column records whether its
    field is enrichment-backed, which is what decides whether revealing it costs a re-query; a field the
    service marks `heavy` is no longer offered.

## Impact

**Affected code**

- `src/utils/analytics/conversations-queries.ts` — `buildConversationListQuery` drops `include_total` and
  widens its select; a new predicate distinguishes source-owned from enrichment-backed fields.
- `src/app/[lang]/conversations-trace/actions.ts` — `getConversations` returns the summary and the candidate
  ids on a first-page request; `getConversationsSchema` reads through a role-keyed cache.
- `src/app/[lang]/conversations-trace/page.tsx` — drops the summary prefetch and the `initialTotals` prop it
  feeds.
- `src/components/Analytics/ConversationsTrace/use-conversations.ts` — the row count arrives via
  `setRowCount`; the separate summary and candidate calls collapse into the page request; the
  `columnVisible` handler purges only for an enrichment-backed field.
- `src/utils/analytics/conversation-column-catalog.ts` — classifies an offerable field by its owning source.
- `src/models/analytics/conversations-trace.ts`, `src/models/analytics/entity.ts` — request/response shapes
  for the merged action; the schema field model gains the backend's `heavy` flag.

**Not affected**

- The analytics service. Every change is a different query from this repo, not a new backend capability;
  `include_total`, enrichment-on-demand joins and role-filtered schemas are all existing service behaviour.
- The conversation detail view, which already projects the full field set for a single row.

**Observable to the operator**

- The summary pills are briefly unavailable at mount instead of arriving server-rendered.
- Revealing a source-backed grid column no longer reloads the grid.
- If the summary request fails, the grid has no authoritative row count and terminates on a short block
  instead.
