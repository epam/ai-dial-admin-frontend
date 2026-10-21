## Context

`executeQuery` is a server action (`app/[lang]/queries/actions.ts`), so the client has no handle on the
request: Next issues its own fetch and, when navigation kills it, throws
`An unexpected response was received from the server.` at the caller. The usage dashboard catches that in
`runQuery`, treats it as a load failure, and raises a toast through `useLoadFailureNotice` — which lives in
the global notification context and so survives the navigation.

Two mechanisms already exist and are worth reusing rather than replacing:

- `BaseApi.sendActionRequest` wraps every call in an `AbortController` registered with `requestRegistry`,
  which logout aborts wholesale. The signal is already threaded into `sendRequest`.
- The dashboard's generation counters (`viewGeneration` and four siblings) already discard superseded
  responses within the life of the component.

Node is `>=24`, so `AbortSignal.any` is available without a polyfill.

## Goals / Non-Goals

**Goals:**

- A view that goes away stops the reads it started, in the service as well as in the browser.
- One place owns cancellation; callers opt in by using it.
- A cancellation is silent.

**Non-Goals:**

- Replacing server actions anywhere else, including Analytics prefetch.
- A data layer: no cache, no dedupe, no retry.
- Reducing the dashboard's nine queries to fewer — the progressive fill is deliberate, and one combined
  response would make every widget wait for the slowest read.

## Decisions

### D1 — A route handler for client-issued queries, the action kept for prefetch

`POST /api/analytics/query` reads the token the way the sibling handlers do
(`getUserToken(getIsEnableAuthToggle(), headers(), cookies())`), calls `analyticsDataApi.executeAction`, and
returns the envelope as JSON. Sixteen route handlers already exist under `app/api`, so this is an
established shape rather than a new one.

The server action stays. Prefetch runs before a view exists, has no caller to cancel it, and moving it
would mean a page fetching itself over HTTP from its own server for no gain.

**Alternative considered:** keeping the action and only ignoring its result after unmount — the one-line
cleanup. Rejected here because it fixes the toast and nothing else: the reads keep running, which is the
half that costs money on a wide window.

### D2 — An external signal beside the registry's, not instead of it

`sendActionRequest` gains an optional `signal`, and where one is passed it is combined with the registry's
own: `AbortSignal.any([controller.signal, signal])`. Logout keeps cancelling everything; a caller can now
cancel its own.

`executeAction` takes the signal as a third argument and passes it down. No other method changes — the
signal is threaded only where a caller has one.

**Alternative considered:** registering the incoming request's signal with `requestRegistry` instead.
Rejected: the registry is keyed for wholesale logout cancellation and has no notion of ownership, so a
per-caller abort would have to reach into it.

### D3 — One hook owns the controllers

`components/Analytics/Common/use-analytics-query.ts` exports `useAnalyticsQuery`, returning a `run(query)`
that creates a controller per call, keeps the live ones in a ref, and aborts them all in its cleanup. It
posts to the handler and maps the outcome to the shape callers already use, plus one new member: a
cancelled outcome, which is neither result nor error.

It replaces `Usage/run-query.ts` and the private `runQuery` inside `use-usage-dashboard-data.ts` — the two
copies of the same function that exist today — so the four callers converge on it.

**Alternative considered:** a single module-level controller shared by the whole app. Rejected: two views
open at once would cancel each other, and the component is the natural owner of "nobody is waiting any
more".

### D4 — A cancelled outcome is its own thing

`runQuery` today returns `{ result, error }`, and an abort would otherwise arrive as an error with the
framework's wording. The outcome gains `isCancelled`, and every caller's failure branch checks it before
reporting: no notification, no `failed()` state, the widget simply stops where it was. The page is gone, so
what it displays no longer matters — what matters is that nothing is said about it.

## Risks / Trade-offs

- **Two transports for the same endpoint.** Prefetch goes through the action, interactive reads through the
  handler. Stated in the spec and both delegate to the same client method, but a reader has to know which
  is which.
- **`AbortSignal.any` needs Node 24**, which `engines` already requires; a deployment on an older runtime
  would throw rather than degrade.
- **An aborted read is not free.** ClickHouse may have started work before the abort lands, so the saving
  is partial — bounded by how fast the service notices its client went away.
