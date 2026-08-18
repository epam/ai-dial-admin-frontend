## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **`include_total` is a second statement, not a rider.** `StructuredQueryExecutor.execute` materializes the
  rows, then — if the offset page asked for a total — builds and runs a separate count query over the whole
  filtered result. So the cost of a total is one extra ClickHouse round-trip per page fetched.
- **The summary and the list query already share a filter.** Both are built from `conversationFilter(...)`,
  so the summary's `count()` and the list query's `totalCount` are the same figure by construction.
- **Enrichments are joins the service adds on demand.** `StructuredQueryBuilder` adds an enrichment's
  `LEFT JOIN` only when the query names one of that enrichment's columns. `conversations` is one source plus
  `conversation_insights` and `conversation_buckets`.
- **The schema is role-filtered by the service.** `sensitive` columns are returned only to callers whose role
  permits them, so one entity has more than one correct schema.
- **The repo has no caching primitive today.** Nothing under `src/server/` uses `unstable_cache`, `revalidate`
  or a module-level cache; this change introduces the first one.
- **The summary must stay same-fetch-cycle.** The existing *Provenance line and result summary* requirement
  forbids a server-prefetched figure from remaining on screen once the client has fetched a page, because the
  loaded-scope pills would otherwise be able to exceed the whole-result total.

## Goals / Non-Goals

**Goals:**

- One browser→server request per fetch cycle, carrying whatever that cycle needs.
- One ClickHouse statement per page fetched, plus the ratings pair, plus the summary on a first page only.
- Revealing a column that costs nothing to project costs nothing to reveal.

**Non-Goals:**

- Changing the ratings resolution. `withRatings` still issues its two queries per page, and they still cannot
  start until the page's `chat_id` values are known. Collapsing them into the row query needs a join the DSL
  does not express; that is its own change.
- Caching query results. Only the entity schema is cached — it describes a table's shape rather than its
  contents. A cached result set would need invalidating on a continuously materializing rollup.
- Introducing a shared server-side cache of anything derived from a caller's token.
- Any backend change. Every behaviour relied on here already exists in the analytics service.

## Decisions

### The total reaches the grid through `successCallback`, not `setRowCount`

Under today's split the summary is fired and not awaited (`void loadTotals(...)`), so the row count could only
arrive out-of-band — `gridApi.setRowCount(n, true)`. Merging the summary into the first page's response
removes that constraint: the count is in hand at the moment the page is delivered, so it goes in
`params.successCallback(rows, total)`, which is the mechanism the grid already uses.

This matters beyond tidiness. `purgeInfiniteCache` resets AG Grid's row count, so an out-of-band `setRowCount`
has to be re-applied after every purge and guarded against a stale summary landing after a newer filter's — a
second race on top of the `totalsRequestRef` guard. Delivering the count with the page it belongs to makes
both impossible: a stale response is already discarded by the existing request-id guard before it reaches the
callback.

*Alternative considered:* keep `setRowCount` so that #1 could ship independently of the merged action. Rejected
— the chosen scope lands both together, and carrying a mechanism whose only justification is a split we are
removing would leave dead complexity behind.

### The merged action resolves the summary in parallel with the rows, not after them

`getConversations` becomes the single entry point for a fetch cycle. On a first-page request it resolves the
candidate ids (when a feedback filter is active), then runs the row query and the summary query
**concurrently**, and returns `{ rows, total, summary, candidateIds, isCapped }`. On a later-page request it
takes the candidate ids from the client and returns `{ rows }` alone.

The concurrency is the point. Sequencing summary-after-rows would make the first page strictly slower than
today's parallel-but-separate arrangement; running them together makes the merged call cost
`max(rows + ratings, summary)` rather than their sum. Since the rows are followed by the ratings pair and the
summary is a single aggregate, the summary is normally the shorter of the two and adds nothing.

*Alternative considered:* merge only the candidates and leave the summary as its own un-awaited call. Rejected
— it saves a round-trip only when a feedback filter is active, and it keeps the summary's arrival independent
of the page it must be an observation of, which is the property the spec asks for.

### Candidate ids round-trip through the client; no server-side cache

The candidate set is resolved under the caller's token. A server-side cache keyed on filter state alone would
narrow one caller's result by ids another caller's token selected, and adding the caller to the key reduces it
to what the existing in-browser `candidateRef` already provides. There is also nowhere natural to put it: a
module-level map is per-pod and unbounded at 1000 ids × filter states × callers.

So the first page returns the ids and the client keeps caching them exactly as it does now, keyed by filter
state, and sends them back with each later page. The wire cost is up to 1000 ids per page request under an
active feedback filter — which is what the current later-page path already sends.

### A field is projected unconditionally when its flat name equals its source

The schema reports each field's `name` (the queryable flat name) and `source` (the entity field backing it).
For a plain column of the source table these are equal; an enrichment-supplied field is namespaced by its
enrichment, so `conversation_insights.title` has `source: "title"`. `name === source` is therefore the test
for "a plain column of the table the query already reads", and those are the fields projected on every page.

*Alternative considered:* test for a `.` in the name, or hold a list of the two known enrichment prefixes.
Rejected — a prefix list needs editing whenever the entity gains an enrichment, and `name === source` is the
broader and more conservative condition: it also excludes a JSONB-derived field, which is likewise not a plain
column and likewise not free to project.

This classification is computed once when the column catalog is built and recorded on the offered column, so
the `columnVisible` handler can decide whether to purge without re-deriving it.

### The schema cache is keyed by the caller, with a TTL, in a module-level store

Keyed by the token's `userId` (a single shared key when auth is disabled, where every request is the same
principal), plus the entity name, plus a TTL. Keying on the caller rather than on a role is deliberate: the
frontend has no notion of the analytics role — `isAnalyticsForbidden` only distinguishes a 403 — so a
role-derived key would have to be invented, while a caller-derived key is correct by construction for the
property that matters, which is that no entry crosses a role boundary. It also matches the pattern the cache
is actually for: one operator loading the page repeatedly.

A module-level store rather than `unstable_cache`: the repo uses no Next caching primitives today, the entry
is one small object per caller, and a plain TTL map is inspectable and testable without a framework
integration. Failures are not stored, so an outage cannot outlive the request it happened on.

*Note:* `conversations` currently exposes no `sensitive` column, so its schema is in fact role-invariant
today. The keying is not load-bearing yet — it exists so that adding a sensitive column to the entity does not
silently turn the cache into a disclosure.

### The page keeps its schema prefetch and loses its summary prefetch

`page.tsx` drops `getConversationTotals` and the `initialTotals` prop. `hasInitialLoadError` was derived from
that prefetch's failure and has no remaining source — the first request against the entity is now the client's
own, which already reports its failures through the existing path. It is removed rather than repurposed;
`hasSchemaError` continues to carry the schema prefetch's failure.

## Risks / Trade-offs

- **The summary pills are pending at first paint instead of server-rendered.** → This is the visible cost of
  removing the duplicate scan, and it is brief: the pills resolve with the first page rather than after it.
  The pending state is the one the view already renders while a filter change is in flight.
- **A slow summary now delays the first page.** The merged response cannot return until both halves finish. →
  They run concurrently, and the summary is a single aggregate against the rows-plus-ratings chain, so it is
  normally the shorter branch. If it inverts under load, the cost is bounded by one aggregate rather than by a
  serial hop.
- **A failed summary now leaves the grid with no authoritative row count.** Previously `totalCount` was an
  independent second source. → By decision, the fallback is the existing short-block heuristic only; paging
  still terminates, the end of the result is just unknown until a short page arrives. Re-requesting a total on
  the failure path would reintroduce the scan this change removes.
- **The row payload grows by roughly eight numeric columns per row.** → They are plain columns of a table the
  query already reads, and ClickHouse is columnar, so the added scan cost is proportional to those columns
  alone. The columns that would actually hurt — the insights text and the two joins — stay opt-in.
- **A stale schema can outlive a schema patch by up to the TTL.** → The failure mode is a newly added column
  missing from the catalog for that window, not a wrong value in a cell. A short TTL bounds it; the entity's
  schema changes on deploy-scale timescales.
- **The classification depends on the service continuing to report `source` for every field.** → It is a
  documented part of the schema contract and every field of `conversations` carries it today. A field with no
  `source` would be treated as not-plain, which is the conservative direction: it would be projected on demand
  rather than unconditionally.

## Migration Plan

No data migration and no backend coordination — every query this change issues is one the service already
accepts, and no persisted shape changes. The only cross-boundary consideration is that the row payload widens
and the count statement disappears, both of which are per-request.

Rollback is a revert. The removed `include_total` and the removed summary prefetch have no persisted effect,
and the schema cache holds nothing that outlives the process.
