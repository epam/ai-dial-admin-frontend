## 1. Trace view opens without a session

- [x] 1.1 Replace `scope: SessionScope` with `readKey: string` in `components/Analytics/SessionsTrace/Detail/SessionTraceView.tsx`, `Inspector/HopInspector.tsx`, `Inspector/HopChatPanel.tsx` and the `use-hop-*` hooks, keying the read cache by it; drop the unused `scope` parameter from the hop-body actions in `app/[lang]/sessions/actions.ts`; the session page passes its session id
- [x] 1.2 Add an optional `initialSpanId` to `useSessionTrace().onOpenTrace`: select it once the span read returns, falling back to the entry hop when the read did not return it; `SessionEventStream` scrolls the selection into view once per opened trace
- [x] 1.3 Update and add specs for 1.1–1.2: existing inspector and trace-view tests pass with `readKey`; new cases for a preselected nested span, a preselected span the read did not return, and the once-per-trace scroll

## 2. Trace card parts that only a session has

- [x] 2.1 Make `traceRatings` optional in `components/Analytics/SessionsTrace/Detail/SessionTraceList.tsx`, rendering no rating counts when absent
- [x] 2.2 Add optional caller (`parent_deployment`) and project fields to `SessionTraceCard` in `models/analytics/sessions-trace.ts` and render them in the call tier only when present, with the unavailable placeholder for an empty recorded value
- [x] 2.3 Specs for 2.1–2.2: the session listing renders unchanged; a card with caller fields shows them; a card without ratings shows no counts

## 3. Entity call queries

- [x] 3.1 Add the entity call page query (D1) with its keyset continuation (D2) to a new `utils/analytics/entity-trace-queries.ts`, reusing `getEntityDeploymentName` and the `own` predicate from `components/Analytics/Usage/utils/entity-scope.ts` and the tool-call predicate the usage MCP view uses for toolset routes
- [x] 3.2 Add the row-to-group mapping that turns page rows into `SessionTraceGroup`s keyed by `trace_id`, merging a later page's card into an existing group, discarding an already-loaded `core_span_id`, and attaching figures from `buildSessionTraceFiguresQuery` over the page window padded by whole UTC days
- [x] 3.3 Unit specs for 3.1–3.2: query shape per route (model, application, toolset, asset toolset), keyset predicate, no-name entity yields no query, group merge across pages, duplicate discard, padded window

## 4. Entity trace listing

- [x] 4.1 Add a server action beside `getSessionTracePage` in `app/[lang]/sessions/actions.ts` that reads one page (page query, then figures) through `AnalyticsDataApi`, returning the 403 case distinctly; and a `use-entity-traces` hook holding the cursor, loaded groups, `hasMore`, load and per-page error state, reset on period change and Refresh
- [x] 4.2 Add `components/Analytics/EntityTraces/EntityTraceListing.tsx`: `TimeFilter` from the shared Audit `TimeFilterValue` without the telemetry cap, Refresh, `SessionTraceList` without ratings, the empty, no-match, no-access and error states with a polite live region, and the opened trace in place via `SessionTraceView` with `initialSpanId`, keeping loaded pages on return; add its i18n keys to `constants/i18n.ts` and `locales/en.ts`
- [x] 4.3 Switch the `Traces` branch of `components/EntityTabs/Audit/EntityAudit.tsx` to the listing when `analyticsEnabled && analyticsUsageEnabled`, keeping `UsageLog` otherwise
- [x] 4.4 Specs for 4.1–4.3: hook paging and reset, listing states, opening and returning, flag switch in `EntityAudit` (both flags on → listing; either off → `UsageLog`), asset applications still without `Traces`

## 5. Verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local app with auth disabled and both `ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED` on; resolve every `fail` verdict before the change is complete

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix every failure
