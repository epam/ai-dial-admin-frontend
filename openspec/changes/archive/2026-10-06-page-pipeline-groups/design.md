## Context

See proposal.md — Why. The runner contract (`analytics-enrichment-runner`, change `improve-group-endpoints`):
`GET /v1/pipelines/{name}/groups?limit=&order=oldest|newest&cursor=` → `{ groups, next_cursor?, has_more, total }`;
`limit` 1..500, default 100; a cursor from the other order, or one the listing did not issue, is `400
invalid_cursor`. `total` ignores the cursor and is read on the page's snapshot. Requeue binds a `%2F`-encoded key,
except the keys its firewall or Tomcat refuse before routing.

The Failures card already walks a cursor-paged listing on scroll (`use-pipeline-failures.ts`, `FailuresGrid.tsx`):
`next_cursor` kept in state, `loadMore` guarded on `has_more` and an in-flight read, `onBodyScroll` near the end.

## Decisions

### D1 — Follow the Failures walk, without its button

`use-pipeline-groups` keeps `{ groups, total, hasMore, cursor, order, isLoading, isLoadingMore }`. `reload` reads the
first page in the current order; `loadMore` appends the next one. Every read carries a sequence id so a page started
under an older order or before a reload cannot land. The grid calls `loadMore` from `onBodyScroll` within a few rows
of the end, as `FailuresGrid` does. The Failures card's "load more" button exists because its search can narrow the
listing below scroll height; here the search note states the limit and tells the reader to clear the filter to
load more, and the user asked for no button. A failed next page ends the walk, as the Failures walk does; a
ref-based in-flight flag keeps two scroll events from asking for the same page twice.

### D2 — Order lives in the hook; the activity column uses ag-grid's sort for its header only

`GroupListOrder` (`newest` | `oldest`) is the hook's state; `setOrder` resets the walk. The `Last activity` column is
the only `sortable` one, with `sortingOrder: ['desc', 'asc']` so it never clears, and a comparator that returns 0, so
the grid keeps the runner's order (ties fall back to row position). `onSortChanged` reads the column's direction and
calls `setOrder`. This gives the header ag-grid's own arrow, keyboard handling and `aria-sort` without a custom
header component; the alternative — a `<button>` header — would have re-implemented all three.

### D3 — `invalid_cursor` restarts rather than errors

The console never edits a cursor, so a refusal means the walk is no longer valid (an order switch racing a page, a
runner rollout). Restarting from the first page is the recovery the user would perform by hand.

### D4 — The addressable-key predicate mirrors the runner's list, in one place

`isAddressableGroupKey(key)` in `groups.ts` encodes the runner spec's exception list. It is a copy of another
service's rule and can drift; the copy is the price of not offering a control that ends in a misleading 401 under
OIDC. Kept to the list the runner spec names, with a pointer to it.

### D5 — The probe keeps `limit=1`

The probe only needs to know whether a group exists; it reads `groups.length` from the new envelope.

## Risks / Trade-offs

- [Client search misses unloaded groups] → stated beside the search while `has_more`; replaced by the runner's
  search when it lands.
- [Activity moves a group across the cursor] → under newest first a group active mid-walk can be passed over, as the
  runner spec states; a reload re-reads from the top.
- [The key predicate drifts from the runner] → one function, one test table mirroring the runner's own test values.
