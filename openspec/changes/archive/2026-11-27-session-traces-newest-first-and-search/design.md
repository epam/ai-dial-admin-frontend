## Context

See proposal.md — Why. The listing resolves a page in three passes (`getSessionTracePage` in
`app/[lang]/sessions/actions.ts`): the paging query groups the hop log by `trace_id` under the session scope,
the session's project and a padded day window, and returns each trace's `min` and `max` `request_time`; the
roots and figures queries then read the page's trace ids. Only the paging query changes here.

The 2026-08-28 rebuild deferred keyset paging because `query-build.ts` did not expose `having`. The analytics
service's `StructuredQueryBuilder` resolves `having` in aggregate mode against both group keys and aggregate
output aliases, so `first_request_time` and `trace_id` are addressable there. Its own cursor page type is not an
option: the builder pages by offset only.

`request_time` is `DateTime64(3, 'UTC')`, and the paging query already returns it as epoch milliseconds, so the
value read back from a row is the exact value the next page compares against.

## Goals / Non-Goals

**Goals:**

- Newest-first order with paging that stays sound while the session is still being written.
- Exact trace-id lookup that reuses the paging query's scope rather than introducing a fourth query.

**Non-Goals:**

- Changing the roots query, the figures query, the padded window derivation or the card cap.
- Sharing listing state with the Chat view.

## Decisions

### Keyset bound in `having`, over the aggregate alias

The paging query sorts `first_request_time DESC, trace_id DESC` and, for every page after the first, carries

```
having: or(
  lt(first_request_time, T),
  and(eq(first_request_time, T), lt(trace_id, X)),
)
```

where `T` and `X` are the last row of the previous page. The page is requested at offset 0 with the same limit.

- *Alternative: the cursor in `filter`.* Rejected: `filter` bounds the rows, so a trace whose rows straddle `T`
  loses its earlier rows, its `min` moves past the cursor, and it reappears on the next page.
- *Alternative: keep offset paging and reverse the order.* Rejected: every trace recorded since the first page
  shifts the offsets by one, re-serving and skipping rows. This is the reason the current spec forbids it.
- *Alternative: the service's cursor page type.* Rejected: the structured-query builder pages by offset only.

`aggregateQuery` in `utils/analytics/query-build.ts` gains an optional `having` that it emits only when set, as it
already does for `filter`, `group_by` and `sort`. `buildSessionTracePageQuery` takes `cursor: SessionTraceCursor
| null` in place of `offset`; `SessionTraceCursor` (`firstRequestTime`, `traceId`) goes in
`models/analytics/sessions-trace.ts`.

### The action returns the next cursor

`getSessionTracePage` takes the cursor and returns `cursor` — the last paging row, through
`sessionTraceCursorOf` — or `null` when the page is short. The field name and the helper follow the entity trace
listing's `EntityTracePage.cursor` and `entityTraceCursorOf`. `hasMore` stays the "full page" signal, since aggregate mode carries no total. The hook holds the cursor
in a ref where it held the offset, and keeps the loaded-id set: a late row can still lower a trace's `min` below
the cursor and return it a second time.

### Search is the paging query with one more predicate

An optional `traceId` adds `eq(trace_id, X)` to the paging query's `filter`, alongside the session scope, project
and window. A matched trace then flows through the roots and figures passes unchanged, so it renders with the
same figures and cards as in the listing. The hop log is bloom-filtered on `trace_id`, so the equality prunes
granules; a `contains` predicate would not, which is the reason the match is exact.

- *Alternative: a dedicated lookup query by `trace_id` alone.* Rejected: without the session scope it would find
  traces of other sessions, and the spec scopes the search to this session.

In search mode there is no next page: one trace id yields at most one group, so the page is short and `cursor` is `null`.

### Hook and UI

`useSessionTraces` takes `traceId` alongside the session params. A change resets the loaded state exactly as a
session change does today, by being part of `loadPage`'s dependencies. The hook exposes `isSearch`, so the list
can tell "no trace with that id" from "this session has no traces".

The search field is the ui-kit `Search`, as `SessionsToolbar` uses it, placed at the top of the trace column in
`SessionDetailBody`. Its value is trimmed and applied through a lodash `debounce` with
`SESSIONS_SEARCH_DEBOUNCE_MS`, which is the sessions listing's pattern. An empty trimmed value applies no search.

The no-match message renders in `SessionDetailBody` in place of `SessionTraceList`, inside a `role="status"`
region, because the listing otherwise changes with no persistent confirmation (`.claude/rules/a11y.md`).
`SessionTraceList` is shared with the entity trace listing, so it gains no search-specific prop. A failed read keeps
the list's existing load-error state.

A page still in flight when the search changes is dropped: the hook tags each read with a generation that the
reset effect advances, so a slow read for the previous search cannot append its traces to the new listing.

## Risks / Trade-offs

- [A trace recorded after the listing loaded never appears without a reload] → accepted in the proposal; the
  session detail reload is the refresh path, and the alternative would be live insertion, which is out of scope.
- [`having` over an aggregate alias is new to this repo's callers] → a query-shape test asserts the bound lives
  in `having`, names `first_request_time` and `trace_id`, and is absent from `filter`.
- [Two traces with the same millisecond start] → the `trace_id` tie-break orders them, and the strict `lt` on
  `trace_id` admits the rest of the tie on the next page.
- [A pasted id with a typo shows "no trace"] → expected for exact match; the message names the condition rather
  than suggesting the session is empty.
