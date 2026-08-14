Prerequisite: apply and archive `conversations-summary-and-user-column` first. This change builds on the
totals-inside-first-page seam and on the user column that change introduces.

Verification note: the change's scenarios are browser-observable, so the `spec-browser-verify` question was
asked; the user chose unit-test coverage only, so no verification task is included.

## 1. Boundary types

- [ ] 1.1 In `src/models/analytics/conversations-trace.ts`, add the serializable sort-key and column-filter
      descriptor shapes plus the enums they need — a sort direction, and a column-filter operator set covering
      contains, does-not-contain, equals, not-equals, the four magnitude comparisons and a range. Keep the
      operator enum in `models.ts`-style type files and any constant lists in the feature `constants` file, per
      the repo's constants/models split.
- [ ] 1.2 Extend `ConversationPageRequest` (and the totals request shape) with optional `sort` keys and
      `columnFilters` descriptors.

## 2. Translation utils

- [ ] 2.1 Add a pure `translateConversationSortModel` in `src/utils/analytics/`: AG Grid `SortModelItem[]` →
      sort-key descriptors, rejecting a `colId` that is not a field-backed conversations column, and returning
      an empty list for an empty model so the query applies its default.
- [ ] 2.2 Add a pure `translateConversationFilterModel` in the same place: AG Grid filter model → column-filter
      descriptors. Map each `GridFilterType` to its operator, turn a number `inRange` into a range descriptor,
      skip an entry whose value is blank, and reject an entry naming an unknown field or an unmapped operator.
      Follow `translateUsageLogFilterModel` in `src/utils/telemetry.ts` for shape.

## 3. Query builders

- [ ] 3.1 In `src/utils/analytics/conversations-queries.ts`, have `conversationFilter` accept the column-filter
      descriptors and conjoin one predicate per entry (a range becoming `ge` + `le`), choosing the value type
      from the field — string, integer, decimal or timestamp.
- [ ] 3.2 Have `buildConversationListQuery` accept sort keys, emit them each with a nulls-last ordering
      followed by the `chat_id asc` tiebreaker, and fall back to `last_request_time desc` + `chat_id asc` when
      none are given.
- [ ] 3.3 Have `buildConversationTotalsQuery` take the same column-filter descriptors, so the count and cost
      are resolved under the predicates the rows were.

## 4. Server actions

- [ ] 4.1 In `src/app/[lang]/conversations-trace/actions.ts`, pass `sort` and `columnFilters` from
      `getConversations` into `buildConversationListQuery`, and from `getConversationTotals` into
      `buildConversationTotalsQuery`.
- [ ] 4.2 Have `getRatedChatIds` report whether the candidate set reached `FEEDBACK_CANDIDATE_LIMIT`, so the
      view can disclose a capped result.

## 5. Column configuration

- [ ] 5.1 In `src/constants/grid-columns/grid-columns.tsx`, replace the blanket
      `filter: false, floatingFilter: false` mapping in `CONVERSATIONS_TRACE_COLUMNS` with per-column presets:
      `baseStringFilter` on conversation, project and user; `baseNumberFilter` on turns, tokens and cost;
      `filter: false` kept on activity and Rating.
- [ ] 5.2 Pass the field-backed column list to `restrictSort` instead of an empty array, leaving Rating out so
      it stays unsortable, and set the grid's initial sort to `last_request_time` descending.
- [ ] 5.3 Confirm no filter-value getter is introduced on the cost column: the predicate is built from the raw
      field, and a formatted getter would filter on the rendered currency string.

## 6. Datasource wiring

- [ ] 6.1 In `src/components/Analytics/ConversationsTrace/use-conversations.ts`, translate
      `params.sortModel` and `params.filterModel` inside `getRows` and pass the descriptors into
      `getConversations`; pass the same column-filter descriptors into the totals call in the first-page
      branch.
- [ ] 6.2 Verify no explicit purge or reset wiring is needed — the infinite row model discards its blocks and
      re-requests row 0 when either model changes — and that the `datasource` identity still changes only with
      the page's own filters.

## 7. Capped-result disclosure

- [ ] 7.1 Surface the capped-candidate flag from `resolveCandidates()` through the hook's return value.
- [ ] 7.2 Render it as a persistent inline notice near the feedback control in
      `src/components/Analytics/ConversationsTrace/Toolbar/`, stating that the result may be incomplete and
      covers the most recently rated conversations; it clears when the applied filter state no longer caps.

## 8. Tests

- [ ] 8.1 Add specs for both translation utils in `src/utils/analytics/tests/`: each operator mapping, the
      `inRange` split, a blank value skipped, an unknown field rejected, an empty sort model returning nothing.
- [ ] 8.2 Extend `src/utils/analytics/tests/conversations-queries.spec.ts`: a column filter becomes a conjoined
      predicate with the right value type; a caller sort key precedes the `chat_id asc` tiebreaker and carries
      nulls-last; no caller keys yields the default sort; the totals query carries the same predicates.
- [ ] 8.3 Extend `src/app/[lang]/conversations-trace/tests/actions.spec.ts` for the sort and filter
      pass-through and for the capped-candidate flag.
- [ ] 8.4 Extend `src/constants/grid-columns/tests/conversations-trace-columns.spec.ts`: which columns are
      sortable, which filter preset each carries, that activity and Rating carry none, and that the offered
      text operators exclude prefix and suffix matching.
- [ ] 8.5 Extend `src/components/Analytics/ConversationsTrace/tests/ConversationsTraceView.spec.tsx` for the
      datasource behaviour — a sort model reaching the server action, a filter model reaching both the list and
      totals calls — and add coverage for the capped-result notice appearing and clearing.

## 9. Quality checks

- [ ] 9.1 Run `npm run lint`, `npm run format`, and the test suite from `apps/ai-dial-admin/`, and resolve
      everything they report.
