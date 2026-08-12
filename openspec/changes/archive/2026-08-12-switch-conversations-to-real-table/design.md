## Context

See proposal.md — Why. The design-relevant facts, all verified against a running analytics service rather
than inferred from its source:

- **The entity exists and is populated.** `conversations` is an ACTIVE `source` table written
  `upsert_by_key`, `ordering_key: [chat_id]`, 13 columns, fed by the `conversations_rollup` aggregate pipeline
  on a 15-minute cron. Live on dev (5,507 rows) and provisioned locally (1,886 rows, drained).
- **Row mode returns a total; aggregate mode does not.** A row-mode query with `include_total: true` returned
  `"totalCount": 1886`; the same-shaped aggregate query returned rows with no `totalCount` key at all. This is
  the whole reason paging becomes exact in the same change.
- **Wire shapes.** Timestamps arrive as ISO-8601 with `Z` (`"2026-08-12T07:32:36.273Z"`), decimals as JSON
  numbers at full scale (`0.28438872`). The current comment in `conversation-formatting.ts` asserts epoch
  millis, which is backwards.
- **Real value distributions the page must survive**, from the local rollup: `project_id` is `''` for roughly a
  third of conversations, `total_price` is `null` for some, `chat_id` runs from 21 characters to 585 (some are
  URL-like strings, not ids), and `duration_ms` / `avg_duration_ms` are `0` throughout because the source
  column is zero in this data.
- **The rollup cannot carry a title.** `AggregateSpecValidator` resolves a pipeline's input columns against
  the input table's own column mappings, so a pipeline cannot roll up an enrichment column; and a measure is
  one function over one column with no `distinct`, which is also why `turn_count` counts rows rather than
  distinct traces.
- **Existing code to reuse rather than re-invent**: `infiniteGridOptions` and `PAGE_SIZE`
  (`src/constants/ag-grid.ts`), the datasource pattern in `src/components/ActivityAudit/List/List.tsx`,
  `GridView`'s existing `rowModelType === 'infinite'` handling, `useProtectedRequest`, `useTimeFilter`,
  `timeRangePredicates`, and `analyticsDataApi.executeAction`.

## Goals / Non-Goals

**Goals:**

- One data path. After this change there is no branch in the conversations action.
- Adopt the entity's own field names end to end, so a grid column, a row field and a query field are the same
  identifier and nothing needs translating.
- Page through the whole result with an exact total, using the mechanism the app already uses for server-paged
  grids.
- Keep every behavior the page already guarantees that still holds — debounce, latest-wins, failure
  reporting, the rating split, the provenance band — rather than rebuilding them around paging.

**Non-Goals:**

- See proposal.md — Non-goals. At design level, additionally: no change to the shared currency formatter, no
  widening of `AgGridProps.columnDefs`, and no URL-persisted filter state.

## Decisions

### Read the entity in row mode; do not page an aggregate

Paging an aggregate query would technically work, but it cannot report a total, so the summary would stay a
lower bound and the grid would have to probe past the end of the result to discover it. Reading the
materialized entity removes both problems and deletes the `group_by`/`fn` half of the query builder call.

*Alternative considered:* keep the aggregate query and add `Load more`. Rejected — it preserves exactly the
gap that made the current summary say "20+", and it keeps recomputing a rollup the backend already stores.

### Adopt the entity's field names on `ConversationRow`; no alias layer

`ConversationRow` takes the entity's names (`project_id`, `turn_count`, `total_tokens`, `total_price`,
`first_request_time`, `last_request_time`). The grid's `field` values are those same names, so a column
definition, a row key and a query field never disagree.

*Alternative considered:* keep the current display names (`project`, `turns`, `cost`, `last_activity`) and
alias in the select. Rejected — an alias layer whose only purpose is to preserve names chosen for a query that
no longer exists. Worse, the previous design already hit the alias trap it was invented to avoid
(`min(project_id) AS project_id` is a cyclic alias in ClickHouse); reading stored columns makes the whole
problem disappear, and re-introducing aliases would re-introduce a hazard for no gain.

`UsageLogField` is replaced by a `ConversationsField` enum. `RateAnalyticsField` and `FeedbackField` are
untouched — the feedback queries still read `rate_analytics`.

### AG Grid infinite row model, not a Load-more button

The repo's server-paged grids use AG Grid's infinite row model with `infiniteGridOptions`, and `GridView`
already special-cases it. Following that keeps this page a sibling of `ActivityAudit` rather than the one page
with its own paging affordance, and `IGetRowsParams.successCallback(rows, lastRow)` is exactly the shape
`totalCount` fits.

This has three consequences the design accepts deliberately:

1. **The grid, not React state, owns the rows.** `use-conversations` keeps the filter state, the debounce, the
   latest-wins guard and the failure state, and hands the datasource a stable view of the applied filters. A
   filter change calls `setGridOption('datasource', …)` (or purges the cache), which is what makes "a filter
   change restarts paging" fall out of the mechanism instead of being hand-managed.
2. **The server prefetch changes meaning.** `page.tsx` can no longer usefully prefetch page one — the grid
   will request it regardless — so it prefetches the summary instead. This keeps the server component earning
   its `force-dynamic` and keeps the 403 guard exactly where it is.
3. **The empty state is the grid's, not the row array's.** `GridView` already disables its `getIsEmptyData`
   check under the infinite model, so the view derives "no rows" from the datasource result.

*Alternative considered:* keep rows in `useState` and append pages. Rejected — it re-implements block caching,
scroll-triggered fetching and end-of-data detection that the shared options already provide, and it leaves this
page inconsistent with every other server-paged grid in the app.

### The summary is its own query, and says which scope each pill covers

Two pills can be exact and two cannot, and conflating them is how the current "20+" caveat came about:

| Pill | Source | Scope |
|---|---|---|
| conversations | `count()` over `conversations` under the list filter | whole result, exact |
| cost | `sum(total_price)` over the same | whole result, exact |
| rated / negative | the rating counts already resolved per page | loaded rows, stated as such |

The count and cost ride on **one** aggregate query issued alongside the first page, under the same filter, so
they cannot disagree with the list. The rated and negative pills stay loaded-scope because making them exact
would need two more full-result queries per filter change under the same predicates the Rating column uses —
real work, and a decision about whether a whole-result feedback breakdown is what an operator wants, not a
mechanical extension of this change.

### The feedback candidate set is resolved once per filter state, not per page

The candidate query over `rate_analytics` depends only on the feedback state and the time range, so re-issuing
it for every page would be pure waste and could return a different set mid-scroll. It is resolved when the
filter state changes and its ids are carried into each page's `in` predicate. The 1,000-id cap is unchanged and
still noted as a known limitation.

### Ratings resolve per page, inside the same server action call

`withRatings` already takes the rows it should resolve, so it needs no change in shape — it now receives one
page instead of the single fixed page. The two direction queries stay concurrent, keep the list query's time
bounds, and keep reusing `ratePredicates`, which is what guarantees the column and the filter agree.

### Timestamp parsing: name the real shape, keep the tolerant path

`toMillis` keeps accepting a number or a string, because tolerating both costs nothing and the mapping is not
contractually fixed. What changes is the recorded fact and one hazard: a **zoneless** ISO string parses as
local time and would shift every activity cell by the viewer's offset. The service sends `Z`, so this is
latent rather than live — the parser will require or normalize the zone rather than rely on a bare
`Date.parse`, and the inverted comment is corrected at its source.

### `turn_count` keeps the "Turns" label and states what it counts

The entity's own column description reads "Number of turns (requests) rolled up into this conversation", and
`turn_count` is `count()` over usage-log rows — so it includes embedding, MCP and routing spans. Renaming the
column to "Requests" would be more literally accurate but would diverge from the backend's own naming and from
the page's purpose. The label stays "Turns" and the column carries a description naming the counting rule, so
nothing in the UI claims a distinct-trace count.

*Alternative considered:* add a `distinct` flag to the analytics backend's pipeline measure model — the shared
function catalog already advertises `distinct_supported: true` for `count`, and only
`AggregateCompiler.measureField`'s hardcoded `false` and the absent `Measure` field stand in the way. Deferred:
it is a backend change plus a pipeline re-declaration (which resets the cursor and rebuilds the rollup), and it
does not block this page.

### Deleting the mock deliberately gives up offline development

The mock's real remaining value was rendering the page with no reachable backend. That is now covered by
provisioning the entity locally, which is a one-time setup rather than a permanent second code path. Keeping a
branch that nobody exercises would leave two behaviors to maintain and one of them untested against reality —
the failure mode the mock was originally introduced to avoid.

### Provenance collapses to two sources

`CONVERSATION_PROVENANCE_GROUPS` becomes `conversations` (conversation, project, turns, activity, tokens, cost)
and `rate_analytics` (rating). The enrichment provenance value, the `isDerived` marker, the pending-entity
badge and the "these are sample values" hint all go, because attributing a column to a source that does not
exist is the one error a provenance band cannot survive. `ColumnProvenance` keeps exhaustive colour mapping, so
a future value cannot render unstyled.

## Risks / Trade-offs

**The page now shows a rollup, not live traffic** → the newest conversations are missing until the pipeline
refreshes. The cron is 15 minutes plus a safety lag, and dev's `state.lag_seconds` is a sawtooth reaching into
the thousands between runs. The current aggregate query was always current, so this is a real regression in
freshness traded for paging, exact totals and a fraction of the query cost. Not fixable client-side; the lever
is the pipeline's cron. Worth stating in the UI only if operators actually trip over it.

**A conversation can shift between pages while scrolling** → `conversations` is upserted, so a conversation's
`last_request_time` changes when new turns arrive, and the sort key is not stable across a refresh. A page
sequence that straddles a refresh could therefore skip or repeat a row. The `chat_id` tiebreaker keeps ordering
deterministic *within* a snapshot but cannot pin one across refreshes. Mitigated by the refresh cadence being
far longer than a scroll; a true fix is a snapshot token the service does not offer.

**The page hard-depends on an entity nothing seeds** → in any environment where the pipeline was never
provisioned, the access guard passes and the query 400s. Mitigated by the spec requiring that to read as a load
failure rather than an empty period, and by naming the provisioning as a prerequisite. The durable fix — a seed
migration, a script, or a Pipelines UI — is out of scope here and called out in the proposal.

**`turn_count` overstates turns** → measured ~21% high in aggregate on local data, identical for 165 of 223
conversations. Accepted with the label decision above; the exact count needs a backend change.

**Deleting the mock removes the last no-backend path** → accepted; local provisioning replaces it.

**Two pills are exact and two are loaded-scope** → a reader could take all four as whole-result figures.
Mitigated by stating the scope on the pills themselves rather than in a hover-only hint.

## Migration Plan

Prerequisite, already done on dev and locally: the `conversations` table and `conversations_rollup` pipeline
must exist and be drained in the target environment. Order matters — the pipeline validator requires an ACTIVE
`upsert_by_key` source whose `ordering_key` equals the group-by output before it accepts the declaration.

The frontend change is additive and read-only: no schema change, no new endpoint, no new API class, no
persisted client state (the grid still sets no `storageKey`). Rollback is reverting the commit; the entity and
pipeline can stay in place, since nothing else reads them.

## Open Questions

1. **Should the rollup's newly-available columns join the grid?** `user_hash`, the prompt/completion token
   split, `success_count`, `duration_ms`, `avg_duration_ms`, and the `conversation_buckets` enrichment
   (`turn_bucket`, `token_bucket`, `duration_bucket`, `activity_day`) are all queryable at no extra cost. A
   success rate and an average latency are plausibly more useful to an operator than the model chip this change
   removes. Deferred because it is a column-set decision, not a consequence of switching data sources.
2. **Should the rated and negative pills become whole-result figures?** Two more queries per filter change under
   the Rating column's predicates. Cheap to build, but worth knowing whether operators read those pills as
   result-wide first.
3. **Does the 15-minute rollup lag need to be visible?** A "data as of" indicator would be honest; it would also
   be the only page in the app carrying one.
4. **Is `rate = 0` really a dislike?** The negative predicate counts it as one, on the documented rule that a
   boolean `false` normalizes to `0`. Local `rate_analytics` holds 17 zeros against 8 explicit `-1`s, so if any
   zero means "rating cleared" the negative figures are materially inflated. Safe to defer only because the
   predicate is unchanged by this change — it is not new risk, but it is unverified.
