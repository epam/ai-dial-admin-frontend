## 1. The transport can be cancelled

- [x] 1.1 Accept an optional external `signal` in `server/base-api.ts` `sendActionRequest`, combined with
      the registry's own controller via `AbortSignal.any`, leaving logout cancellation as it is (design D2)
- [x] 1.2 Thread it through `analyticsDataApi.executeAction` (design D2)
- [x] 1.3 Add `app/api/analytics/query/route.ts`: same token helper as the sibling handlers, same
      `executeAction`, same envelope, passing `request.signal` (design D1)

## 2. One hook cancels for everything

- [x] 2.1 Add `components/Analytics/Common/use-analytics-query.ts`: a `run(query)` that posts to the
      handler with a per-call controller, keeps live controllers in a ref and aborts them on unmount,
      returning `{ result, error, isCancelled }` (design D3, D4)
- [x] 2.2 Delete `components/Analytics/Usage/run-query.ts` and the private `runQuery` in
      `Usage/use-usage-dashboard-data.ts`, moving both to the hook
- [x] 2.3 Switch the four callers to it — `Usage/use-usage-dashboard-data.ts`, `Usage/use-heatmap-week.ts`,
      `Usage/use-breakdown-dialog-rows.ts`, `QueryBuilder/QueryBuilder.tsx` — and skip the failure branch
      on a cancelled outcome (design D4)

## 3. Tests

- [x] 3.1 Cover the handler: it calls `executeAction` with the request's signal and returns the envelope
      unchanged, for both a success and a service failure
- [x] 3.2 Cover the hook: unmounting aborts the controllers it holds, a cancelled outcome carries neither
      result nor error, and a service failure still carries the message
- [x] 3.3 Cover the dashboard: a cancelled query raises no notification, while a failed one still does

## 4. Quality gate

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and
      `npm run test`, and clear everything they report
- [x] 4.2 Update the consolidated `analytics/spec.md` opening paragraph, which stated that all transport
      goes through server actions — a description rather than a requirement, so the delta cannot carry it
      and it was corrected in place rather than left false until archive

<!--
No browser-verification task: the change's observable behaviour is the absence of a toast after navigating
away, and the user chose unit tests for the console changes that preceded it (2026-09-24).
-->
