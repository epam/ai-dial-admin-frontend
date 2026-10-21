## Why

Opening the usage dashboard fires nine queries at once. Leaving the page before they land does not stop
them: a server action cannot be cancelled from the client, so Next aborts its own call, the client sees
`An unexpected response was received from the server.`, and the dashboard's failure notice raises a toast
that outlives the page — an operator who clicks away mid-load reads "Could not load usage data" on the
sessions page they just opened.

The toast is the visible half. The other half is that every one of those nine queries keeps running: the
server keeps its ADAS request open and ClickHouse keeps scanning for a page nobody is looking at. On a wide
window those are the most expensive reads the console issues, and a few impatient navigations multiply
them.

Both halves have one cause: the client cannot cancel what it started. Server actions carry no
`AbortSignal`, so neither the fetch nor the work behind it can be called off.

## What Changes

1. **Analytics queries go out over a route handler instead of a server action.** `POST
   /api/analytics/query` does exactly what the `executeQuery` action does — the same token, the same
   `analyticsDataApi.executeAction`, the same response envelope — but a route handler can be aborted, so
   the client keeps a handle on the request it made. It states its own auth guard, because the middleware
   matcher excludes `/api` while it covers the page path an action posts to, and it answers every case
   with an envelope so the client never has to parse a framework error page.

2. **Cancellation reaches the service.** `BaseApi` already wraps every call in an `AbortController` for
   logout; it learns to accept an external signal beside it, and the handler passes the incoming
   request's. A client that gives up therefore stops the ADAS read too, rather than only stopping itself
   from listening.

3. **One hook cancels for everything.** `useAnalyticsQuery` owns the controllers for the component that
   uses it and aborts them when that component goes away. Callers replace their local runner with it —
   four today, and anything added later gets the behaviour without asking.

4. **A cancelled query is not a failure.** It reports no error and raises no notification: nobody is
   waiting for the answer, so there is nothing to tell them.

## Non-goals

- The rest of the console's server actions. This is the one surface that fans out to nine long reads from
  a single page; the pattern can spread later if something else needs it.
- Caching or request deduplication. The page's own generation counters stay as they are; this change adds
  cancellation, not a data layer.
- The dashboard's shape — how many queries it issues, and which widget waits for which, is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the shared transport gains a cancellable path for client-issued queries, and cancellation
  is passed through to the data-access service.

## Impact

- `app/api/analytics/query/route.ts` (new), `server/base-api.ts` (an optional external signal),
  `server/analytics/analytics-data-api.ts` (passes it through on `executeAction`).
- `components/Analytics/Common/use-analytics-query.ts` (new), replacing
  `components/Analytics/Usage/run-query.ts` and the private runner inside
  `Usage/use-usage-dashboard-data.ts`.
- Callers: `Usage/use-usage-dashboard-data.ts`, `Usage/use-heatmap-week.ts`,
  `Usage/use-breakdown-dialog-rows.ts`, `QueryBuilder/QueryBuilder.tsx`.
- The `executeQuery` server action stays for server-side prefetch; no service change.
