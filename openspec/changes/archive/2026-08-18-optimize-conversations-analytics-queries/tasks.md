## 1. Schema field classification

- [x] 1.1 Add the service's `heavy` flag to `AnalyticsEntityField` in `src/models/analytics/entity.ts`
- [x] 1.2 Add an `isEnrichmentBacked` discriminator to the offered-column model in
      `src/models/analytics/conversations-trace.ts`, so a catalog column records whether its field comes from
      the entity's own source
- [x] 1.3 In `src/utils/analytics/conversation-column-catalog.ts`, exclude a `heavy` field from
      `offerableSchemaFields` alongside the existing `sensitive` and non-scalar exclusions
- [x] 1.4 In the same module, classify each offered field as source-backed when its schema `name` equals its
      `source`, and carry that classification onto the column `buildConversationColumnCatalog` produces
- [x] 1.5 Expose the source-backed subset from the model scope the grid consumes, so both the query builder
      and the visibility handler read one classification

## 2. List query: no total, wider projection

- [x] 2.1 In `src/utils/analytics/conversations-queries.ts`, change `buildConversationListQuery` to pass
      `includeTotal: false` to `offsetPage` on every page
- [x] 2.2 Change `conversationSelect` to take the source-backed offerable fields and the visible
      enrichment-backed fields separately: project the former unconditionally alongside
      `CURATED_SELECT_FIELDS`, and the latter only when visible
- [x] 2.3 Update `ConversationListQueryParams` so the caller passes both sets rather than a single
      `visibleFields` list

## 3. Entity schema cache

- [x] 3.1 Add a TTL-bounded module-level cache under `src/server/analytics/`, keyed by entity name plus the
      caller's `userId` (one shared key when auth is disabled), storing successful lookups only
- [x] 3.2 Route `getConversationsSchema` in `src/app/[lang]/conversations-trace/actions.ts` through it, falling
      through to `analyticsDataApi.getEntitySchema` on a miss or an expired entry

## 4. Merged first-page server action

- [x] 4.1 Extend `ConversationPageRequest` and `ConversationsPage` in
      `src/models/analytics/conversations-trace.ts` to carry the candidate ids, the cap flag and the summary
      on a first-page exchange
- [x] 4.2 In `actions.ts`, make `getConversations` resolve the feedback candidates itself when the request is
      for the first page and a feedback state other than `All` is applied, and return the resolved ids and cap
      flag with the page
- [x] 4.3 In the same action, run the row query and the summary query concurrently for a first-page request
      and return the summary with the rows; a later-page request runs neither the candidate query nor the
      summary
- [x] 4.4 Keep `isNarrowedToNothing`'s short-circuit correct for the merged shape: an empty candidate set
      returns no rows, a zero summary and no failure
- [x] 4.5 Remove `getRatedChatIds` and `getConversationTotals` as exported server actions once nothing outside
      `actions.ts` calls them, keeping their query-building logic as internal helpers

## 5. Page: drop the summary prefetch

- [x] 5.1 In `src/app/[lang]/conversations-trace/page.tsx`, remove the `getConversationTotals` prefetch and the
      `initialTotals` prop, keeping the `getConversationsSchema` prefetch and its error handling
- [x] 5.2 Remove `hasInitialLoadError` from `page.tsx` and from `ConversationsTraceView`'s props — the client's
      own first fetch is now the first request against the entity and already reports its failures
- [x] 5.3 Verify the summary pills render their existing pending state, not zeros, before the first fetch
      resolves

## 6. Hook: one request per fetch cycle

- [x] 6.1 In `src/components/Analytics/ConversationsTrace/use-conversations.ts`, collapse the separate
      `getRatedChatIds` and `getConversationTotals` calls in `datasource.getRows` into the single
      `getConversations` call
- [x] 6.2 Set the summary state and pass the total to `params.successCallback` from the first page's response;
      keep the existing short-block fallback when the response carries no summary
- [x] 6.3 Keep `candidateRef` as the per-filter-state cache, seeding it from the first page's returned ids and
      sending them with each later page
- [x] 6.4 Drop `visibleFields` from `resultKey`, and split the column state the datasource reads into
      source-backed and enrichment-backed sets for the query
- [x] 6.5 Narrow the `columnVisible` handler so `purgeInfiniteCache` runs only when the revealed column is
      enrichment-backed
- [x] 6.6 Fold the removed `initialTotals` / `hasInitialLoadError` parameters out of the hook signature and its
      call site

## 7. Tests

- [x] 7.1 `src/utils/analytics/tests/conversation-column-catalog.spec.ts` — a `heavy` field is not offered; a
      field whose `name` equals its `source` is classified source-backed and a namespaced one is not
- [x] 7.2 `src/utils/analytics/tests/conversations-queries.spec.ts` — `include_total` is `false` on the first
      page and a later one; source-backed offerable fields are selected with every schema column hidden; an
      enrichment-backed field appears only when visible
- [x] 7.3 `src/server/analytics/tests/` — the schema cache returns a stored entry within its TTL, re-resolves
      after it, does not serve an entry across `userId`s, and does not store a failure
- [x] 7.4 `src/app/[lang]/conversations-trace/tests/actions.spec.ts` — a first-page request returns rows,
      summary and candidate ids and issues the row and summary queries concurrently; a later-page request
      issues neither the candidate nor the summary query; an empty candidate set returns a zero summary
      without issuing the conversation query
- [x] 7.5 `src/components/Analytics/ConversationsTrace/tests/` — the hook issues one server call per fetch
      cycle; the total reaches `successCallback` from the first page; a summary-less response falls back to the
      short-block signal; revealing a source-backed column issues no request while revealing an
      enrichment-backed one purges and refetches
- [x] 7.6 `src/app/[lang]/conversations-trace/tests/` — the page issues no summary query during server
      rendering and still prefetches the schema

## 8. Quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and resolve everything
      they report

Note: no browser-verification task is included. Several scenarios in this change are browser-observable, so
the question was put to the user, who chose unit tests only.
