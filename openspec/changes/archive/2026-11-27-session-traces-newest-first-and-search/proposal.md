## Why

The session detail lists traces oldest-first, so in a long session the reader scrolls through every page to reach
the most recent call — usually the one being investigated. A trace id copied from a log or another screen also
has no way in: the reader has to scroll the listing and compare ids by eye.

The oldest-first order was not a preference. Offset paging over a live table is sound only in ascending order,
and the spec forbids newest-first until keyset paging replaces it. The backend already resolves `having` against
aggregate outputs in aggregate mode, so the keyset cursor the earlier design deferred is now available.

## What Changes

- The session trace listing orders traces newest-first: the trace whose earliest recorded time is latest is on
  top, older traces load below as the reader scrolls.
- Paging switches from offset to keyset: each next page is bounded by the last loaded trace's earliest recorded
  time and trace id, expressed over the aggregated start time.
- A trace that starts after the listing loaded is not inserted; it appears when the session detail reloads.
- A search field above the listing finds a trace of this session by its exact trace id. A match shows that
  trace alone; no match states that the session has no trace with that id; clearing the field restores the
  newest-first listing.
- The structured-query builder used by the listing gains a `having` clause for aggregate queries.

## Non-goals

- No substring or prefix search on the trace id, and no search by any other field.
- No live insertion of newly recorded traces at the top of the listing.
- No change to the root query, the figures query, the padded window rule, the card cap, or the Chat view.
- No change to the sessions listing page.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/session-trace-listing`: the paging requirement changes from offset paging in ascending order to
  keyset paging in descending order; a new requirement adds exact trace-id search within the session.

## Impact

- `apps/ai-dial-admin/src/utils/analytics/query-build.ts` — `aggregateQuery` passes `having`.
- `apps/ai-dial-admin/src/utils/analytics/sessions-queries.ts` — `buildSessionTracePageQuery` sorts descending,
  takes a cursor instead of an offset, and takes an optional trace id.
- `apps/ai-dial-admin/src/app/[lang]/sessions/actions.ts` — `getSessionTracePage` takes the cursor and the
  trace id and returns the next cursor.
- `apps/ai-dial-admin/src/components/Analytics/SessionsTrace/Detail/use-session-traces.ts`,
  `SessionDetailBody.tsx`, `SessionTraceList.tsx` — cursor state, the search field, and the no-match state.
- i18n keys for the search placeholder and the no-match message.
- Backend: none. The analytics service already compiles `having` over aggregate aliases and group keys.
