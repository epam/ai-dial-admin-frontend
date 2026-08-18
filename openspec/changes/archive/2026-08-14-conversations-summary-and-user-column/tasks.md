Verification note: the change's scenarios are browser-observable, so the `spec-browser-verify` question was
asked; the user chose unit-test coverage only, so no verification task is included.

## 1. Summary figures come from the first-page fetch

- [x] 1.1 In `src/components/Analytics/ConversationsTrace/use-conversations.ts`, move the
      `getConversationTotals` call into `datasource.getRows`' first-page branch, reusing the `chatIds` that
      branch already resolved from `resolveCandidates()`, and keep the `totalsRequestRef` monotonic guard so a
      later first-page fetch wins over an earlier one.
- [x] 1.2 Delete the standalone totals `useEffect` on `[filters, resolveCandidates]`, its
      `isFirstTotalsRunRef` skip flag, and its duplicate `resolveCandidates()` call.
- [x] 1.3 Distinguish the two first-page failure paths: a failed row query leaves the figures standing, while a
      failed candidate resolution clears them (the totals query never ran, so the figures on screen belong to
      the previous filter state). Confirm the server prefetch in
      `src/app/[lang]/conversations-trace/page.tsx` still paints the pills on first render before the client
      fetch supersedes it.

## 2. Loaded-scope figures count distinct conversations

- [x] 2.1 In `use-conversations.ts`, change the accumulator to `{ key, byId: Map<string, ConversationRow> }`
      keyed by `chat_id`, reset when the filter key changes rather than when the offset is zero — a bounded row
      cache re-requests block 0 on scroll-back, and resetting there would drop everything loaded after it.
- [x] 2.2 Derive `summary` from the map's values via `summariseConversations` and `loadedCount` from the map's
      size, so a re-delivered block overwrites its own entries instead of adding duplicates.

## 3. The loaded-scope caveat is visible

- [x] 3.1 In `src/components/Analytics/ConversationsTrace/Header/ConversationsSummary.tsx`, give `SummaryPill`
      a flag that renders its `hint` as visible muted text beneath the label, and omit the `sr-only` copy for
      those pills so the sentence is not announced twice; keep `title` in place.
- [x] 3.2 Set that flag on the rated and negative pills with a short `SummaryLoadedScope` string, keeping
      `SummaryLoadedHint` as the hover explanation; leave the count and cost pills' hint behaviour unchanged.

## 4. The user column

- [x] 4.1 Add `ConversationsField.UserHash` to `buildConversationListQuery`'s `select` in
      `src/utils/analytics/conversations-queries.ts`, and `user_hash` to `ConversationRow` in
      `src/models/analytics/conversations-trace.ts`.
- [x] 4.2 Add `UserCellRenderer` under
      `src/components/Analytics/ConversationsTrace/List/`, modelled on `ProjectCellRenderer`:
      `DialEllipsisTooltip` around the value, and the detail page's `UNAVAILABLE_VALUE` placeholder when the
      field is absent.
- [x] 4.3 Add the column to `BASE_CONVERSATIONS_TRACE_COLUMNS` in
      `src/constants/grid-columns/grid-columns.tsx`, between project and turns, reusing the detail page's
      "User" label key, with a flex and `minWidth` sized for a hash rather than a name.
- [x] 4.4 Append `ConversationsField.UserHash` to the `conversations` entry of
      `CONVERSATION_PROVENANCE_GROUPS` in `src/constants/analytics/conversations-trace.ts`, so the column
      belongs to exactly one provenance group and cannot be dragged out of it.

## 5. Tests

- [x] 5.1 Extend `src/utils/analytics/tests/conversations-queries.spec.ts`: the list query's select names
      `user_hash`, and a search term still produces exactly two `ico` predicates, neither of them on
      `user_hash`.
- [x] 5.2 Extend `src/constants/grid-columns/tests/conversations-trace-columns.spec.ts` for the seventh
      column — its position, its label key, and that it remains non-sortable with no filter, like its
      neighbours.
- [x] 5.3 Add `src/components/Analytics/ConversationsTrace/tests/UserCellRenderer.spec.tsx` covering a
      populated hash and an absent one rendering the placeholder.
- [x] 5.4 Extend `src/components/Analytics/ConversationsTrace/tests/ConversationsSummary.spec.tsx`: the rated
      and negative pills render the loaded-scope caveat as visible text and no longer duplicate it as
      `sr-only`; the count and cost pills keep their current hint behaviour.
- [x] 5.5 Extend `src/components/Analytics/ConversationsTrace/tests/ConversationsTraceView.spec.tsx` (where
      the hook is exercised today) for the two hook behaviours: the totals are re-resolved when the first page
      is fetched rather than left as the prefetched value, and a conversation delivered twice counts once
      toward `loadedCount`.
- [x] 5.6 `summariseConversations` still takes a `ConversationRow[]` — the hook passes the map's values — so
      only its fixture needed the new field. No behavioural change to cover.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, and the test suite from `apps/ai-dial-admin/`, and resolve
      everything they report.
