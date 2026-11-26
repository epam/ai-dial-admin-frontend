## 1. Query layer

- [x] 1.1 Add an optional `having` to `aggregateQuery` in `apps/ai-dial-admin/src/utils/analytics/query-build.ts`, emitted only when set
- [x] 1.2 Add `SessionTraceCursor` (`firstRequestTime`, `traceId`) to `apps/ai-dial-admin/src/models/analytics/sessions-trace.ts`
- [x] 1.3 In `buildSessionTracePageQuery` (`apps/ai-dial-admin/src/utils/analytics/sessions-queries.ts`): sort `first_request_time DESC, trace_id DESC`; replace `offset` with `cursor: SessionTraceCursor | null` expressed in `having` per design.md; page at offset 0; accept an optional `traceId` added to `filter` as an equality; rewrite the ordering comment above it to state the keyset rule
- [x] 1.4 Unit tests: `query-build.spec.ts` covers `having` present and absent; `sessions-queries.spec.ts` asserts the descending sort, no `having` on the first page, the cursor bound in `having` naming `first_request_time` and `trace_id` and absent from `filter`, and the trace-id equality in `filter` beside the session, project and window predicates

## 2. Server action

- [x] 2.1 Change `getSessionTracePage` in `apps/ai-dial-admin/src/app/[lang]/sessions/actions.ts` to take `cursor` and an optional `traceId`, and to return `cursor` from the last paging row through `sessionTraceCursorOf` (`null` on a short page or in search mode)
- [x] 2.2 Update `apps/ai-dial-admin/src/app/[lang]/sessions/tests/detail-actions.spec.ts` (or whichever spec covers `getSessionTracePage`) for the cursor round trip, `cursor` on a full and a short page, and the trace id reaching the paging query

## 3. Hook and UI

- [x] 3.1 In `apps/ai-dial-admin/src/components/Analytics/SessionsTrace/Detail/use-session-traces.ts`: hold the cursor in place of the offset, keep the loaded-id set, accept `traceId`, reset on its change, and expose `isSearch`
- [x] 3.2 Add the ui-kit `Search` field at the top of the trace column in `SessionDetailBody.tsx`, trimming the value and applying it through `debounce` with `SESSIONS_SEARCH_DEBOUNCE_MS`
- [x] 3.3 In `SessionDetailBody.tsx`, render the no-match state in place of `SessionTraceList` when `isSearch` and no group is loaded, inside a `role="status"` region; keep the list's load-error state for a failed read
- [x] 3.4 Add i18n keys for the search placeholder and the no-match message to `SessionsTraceI18nKey` and the locale files
- [x] 3.5 Unit tests: `use-session-traces.spec.tsx` covers the cursor passed to the next page, dedupe of a repeated trace, reset on a trace-id change and on clearing it; `SessionDetailBody.spec.tsx` covers the trimmed, debounced search value reaching the hook and the no-match state versus the empty-session and load-error states

## 4. Docs and quality gate

- [x] 4.1 Update the comments in `sessions-queries.ts` and `use-session-traces.ts` that state ascending order and offset paging, so they match the keyset rule
- [x] 4.2 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass
