> Prerequisite, already satisfied on dev and on the local environment: the `conversations` table and the
> `conversations_rollup` aggregate pipeline must exist and be drained in the environment
> `DIAL_ANALYTICS_API_URL` points at. Provisioning them is not part of this change — see proposal.md,
> Non-goals.

## 1. Models, constants, and the query builder

- [x] 1.1 In `src/models/analytics/conversations-trace.ts`, replace `UsageLogField` with a
      `ConversationsField` enum carrying the entity's own field names (`chat_id`, `project_id`, `turn_count`,
      `total_tokens`, `total_price`, `first_request_time`, `last_request_time`). Leave `RateAnalyticsField`
      and `FeedbackField` untouched — the feedback queries still read `rate_analytics`.
- [x] 1.2 Rewrite `ConversationRow` to the entity's field names, dropping `title`, `snippet`, `model` and
      `model_count`, and keeping `rating_up` / `rating_down`. Keep timestamps and metrics typed
      `number | string` (plus `null` where the column is nullable) per the wire-shape requirement.
- [x] 1.3 Extend `ConversationFilters` with `offset` and `limit`, and add a `ConversationsPage` type carrying
      `rows` plus the result `total`. Add a `ConversationTotals` type for the summary query's result. No
      inline anonymous object types.
- [x] 1.4 In `src/constants/analytics/conversations-trace.ts`: set `CONVERSATIONS_ENTITY = 'conversations'`;
      delete `CONVERSATION_PAGE_SIZE`, `CONVERSATION_SUMMARY_ENRICHMENT`, `SUMMARY_ENRICHMENT_FIELDS`,
      `USE_CONVERSATION_SUMMARY_ENRICHMENT`, `CONVERSATION_ENRICHMENT_ENTITY` and `MODEL_DOT_CLASSES`;
      import `PAGE_SIZE` from `src/constants/ag-grid.ts` at the call sites instead of redefining a page size.
- [x] 1.5 Reduce `CONVERSATION_SOURCE_ENTITIES` and `CONVERSATION_PROVENANCE_GROUPS` to two groups —
      `conversations` (conversation, project, turns, activity, tokens, cost) and `rate_analytics` (rating) —
      with no `isDerived` marker and no pending entity. Remove `ColumnProvenance.Enrichment` and its
      `PROVENANCE_TEXT_CLASS` entry only if nothing else maps it; the record must stay exhaustive.
- [x] 1.6 In `src/utils/analytics/query-build.ts`, add a row-mode query envelope alongside `aggregateQuery`,
      and make `offsetPage` take `include_total` from the caller rather than hardcoding `false`. Do not touch
      the existing primitives or `src/utils/structured-query/build.ts`.

## 2. Queries

- [x] 2.1 Rewrite `buildConversationListQuery` in `src/utils/analytics/conversations-queries.ts` as a
      row-mode query over `conversations`: select the seven fields, `timeRangePredicates` on
      `last_request_time`, the optional `or` of two `ico` predicates on `chat_id` / `project_id`, the optional
      `in(chat_id, chatIds)`, sort `last_request_time desc` then `chat_id asc`, and
      `offsetPage(offset, PAGE_SIZE, true)`. Drop the `group_by`, every `fn` expression, the enrichment select
      entries and the empty-`chat_id` guard.
- [x] 2.2 Add `buildConversationTotalsQuery` — aggregate mode over `conversations` with no `group_by`,
      selecting `count()` and `sum(total_price)` under the *same* filter the list query builds, so the pills
      cannot disagree with the list. Extract the shared filter into one private helper used by both.
- [x] 2.3 Repoint `buildRatedConversationIdsQuery` and `buildConversationRatingsQuery` at the list query's new
      time semantics only where they must agree; their entity, predicates and `ratePredicates` reuse stay
      unchanged.
- [x] 2.4 Delete `searchPredicates`' enrichment branch and `enrichmentColumns` entirely.

## 3. Server action

- [x] 3.1 In `src/app/[lang]/conversations-trace/actions.ts`, delete the `USE_CONVERSATIONS_MOCK` branch and
      the `src/mocks/analytics/conversations-trace` import, then delete
      `src/mocks/analytics/conversations-trace.ts` (this empties `src/mocks/`).
- [x] 3.2 Change `getConversations` to accept the offset and return `{ rows, total }` from the response's
      `totalCount`, keeping `withRatings` resolving ratings for the returned page and keeping the existing
      `ServerActionResponse` failure contract.
- [x] 3.3 Add `getConversationTotals` issuing `buildConversationTotalsQuery`, and change `fetchRatedChatIds`
      so the candidate ids can be resolved once per filter state and passed in, rather than re-queried per
      page.
- [x] 3.4 In `src/app/[lang]/conversations-trace/page.tsx`, keep the `isAnalyticsForbidden()` → `Page403`
      guard and `force-dynamic`, and replace the row prefetch with the summary prefetch, passing its failure
      state to the view.

## 4. Paging in the view

- [x] 4.1 Rework `src/components/Analytics/ConversationsTrace/use-conversations.ts` to own filter state,
      debounce, latest-wins and failure state while the grid owns rows: build an `IDatasource` whose `getRows`
      calls `getConversations` with `startRow` as the offset and calls `successCallback(rows, lastRow)` with
      `lastRow` derived from `total`. Resolve the feedback candidate ids per filter state, not per block.
      Follow `src/components/ActivityAudit/List/List.tsx` for the datasource + `setGridOption('datasource', …)`
      pattern.
- [x] 4.2 On any filter change, discard the loaded blocks and restart from the first page; keep
      `useProtectedRequest`, the 400 ms search debounce, the immediate time/feedback requery, and the
      error-toast-plus-empty-state failure reporting. A failed later page must keep the rows already shown.
- [x] 4.3 In `List/ConversationsList.tsx`, spread `infiniteGridOptions` into `additionalGridOptions` alongside
      the existing row and header heights, and pass the datasource. Never pass `defaultColDef` through
      `additionalGridOptions`; keep `storageKey` absent.
- [x] 4.4 Fetch the totals once per filter state and feed `Header/ConversationsSummary.tsx`: exact
      conversation count and cost from the totals query, rated/negative stated as covering the loaded rows,
      and an unavailable state when the totals request fails.

## 5. Cells, columns, and formatting

- [x] 5.1 `List/ConversationCellRenderer.tsx`: render the conversation id alone through
      `DialEllipsisTooltip`, dropping the title/snippet lines.
- [x] 5.2 `List/ProjectCellRenderer.tsx`: drop the model chip and the `+N` count; render an explicit
      placeholder when `project_id` is empty.
- [x] 5.3 Remove `modelDotClass` from `src/utils/analytics/conversation-formatting.ts` and its test.
- [x] 5.4 In the same file, fix the inverted wire-shape comment and make `toMillis` safe for a zoneless ISO
      string (require or normalize the zone) instead of relying on a bare local-time `Date.parse`.
- [x] 5.5 In `src/constants/grid-columns/grid-columns.tsx`, repoint the conversations columns at the new field
      names, drop the model chip from the Project column, and give the Turns column a description naming what
      `turn_count` counts. Keep `restrictSort` with an empty allowlist and `filter: false` +
      `floatingFilter: false` per column. Do not modify any other column array.
- [x] 5.6 Update `Header/ConversationsProvenanceLine.tsx` and `List/ProvenanceHeaderGroup.tsx` for the
      two-source band, and remove the pending marker and its `IconAsterisk` usage.
- [x] 5.7 Remove the now-unused i18n keys and English strings — the enrichment provenance label and hint, the
      `EntityPending` string, the enrichment search placeholder variant, and the truncated-summary hint — and
      add strings for the empty-project placeholder, the loaded-scope pill wording, the unavailable-totals
      state and the Turns description.
- [x] 5.8 Update `src/utils/analytics/conversation-rows.ts`: `summariseConversations` no longer computes a
      count or cost (they come from the totals query) and no longer reports `isTruncated`; `attachRatings` and
      `unresolvedRatings` keep their shape.

## 6. Tests

- [x] 6.1 `src/utils/analytics/tests/query-build.spec.ts` — the row-mode envelope sets `mode: 'row'`, and
      `offsetPage` carries the caller's `include_total` in both states.
- [x] 6.2 `src/utils/analytics/tests/conversations-queries.spec.ts` — rewrite for the row-mode list query:
      entity `conversations`, no `group_by` and no `fn`, epoch-millis bounds on `last_request_time`, no
      empty-id guard, the `ico` pair on `chat_id`/`project_id`, a blank term adding nothing, the `in` narrowing,
      the `chat_id asc` tiebreaker last, `include_total: true`, and a limit within 1000. Add coverage that the
      totals query carries a filter identical to the list query's.
- [x] 6.3 Delete `src/utils/analytics/tests/conversations-trace.mock.spec.ts` and every fixture-shape
      assertion that outlived the fixtures.
- [x] 6.4 `src/app/[lang]/conversations-trace/tests/actions.spec.ts` — drop `loadActions(useMock)` and the
      `vi.doMock` machinery; assert the single path: the built query is passed to
      `analyticsDataApi.executeAction`, `total` comes from `totalCount`, ratings resolve for the returned page,
      a candidate-query failure short-circuits the list query, and an empty candidate set returns no rows
      without issuing it.
- [x] 6.5 `src/utils/analytics/tests/conversation-formatting.spec.ts` — an ISO string with `Z` and an
      epoch-millisecond number resolve to the same instant, and a zoneless string does not silently shift by the
      local offset.
- [x] 6.6 `src/constants/grid-columns/tests/conversations-trace-columns.spec.ts` — the columns bind the new
      field names, no column is sortable, both filter flags are off per column, and the Project column has no
      model renderer.
- [x] 6.7 Component tests under `src/components/Analytics/ConversationsTrace/tests/` — rows render from a
      datasource block; scrolling past the block issues a further request with a larger offset and an otherwise
      identical query; the grid stops at `total`; a filter change restarts from the first page; the pills show
      the exact total with no `+` marker and report rated/negative as loaded-scope; a failed totals request
      reports unavailable rather than zeros; a failed later page keeps the rows already shown; an empty
      `project_id` renders the placeholder; null `total_tokens`/`total_price` render empty; a long `chat_id`
      stays reachable; the provenance band names only `conversations` and `rate_analytics` and marks nothing
      pending. Assert against renderer output, not raw cell text.

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` flow over the browser-observable scenarios in
      `specs/analytics/spec.md` for this change, against the local app with the provisioned `conversations`
      entity. Resolve every `fail` verdict before the change is considered complete.

## 8. Quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run test`, and `npx nx build ai-dial-admin`; fix
      everything they surface.
- [x] 8.2 Confirm `src/mocks/` is gone and nothing imports it, and that no remaining reference to
      `USE_CONVERSATIONS_MOCK`, `USE_CONVERSATION_SUMMARY_ENRICHMENT`, `title`, `snippet`, `model_count` or
      `dial_usage_log` survives in the conversations feature.
