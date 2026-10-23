## 1. Join ratings to spans

- [x] 1.1 Add `response_id` to `SessionSpanRow` and `SPAN_BASE_FIELDS`; add `feedbackByResponseId` to `utils/analytics/session-detail-fields.ts` and `attributeFeedbackToSpans` (shallowest span wins, D2) to `utils/analytics/session-span-tree.ts`
- [x] 1.2 Unit specs for 1.1: exact join, in-turn hop unmatched, relayed id on the shallowest span, siblings by start order, no ratings, rows without a response id

## 2. Tree badge and rail section

- [x] 2.1 Extract `FeedbackEntry` from `SessionFeedbackPanel` into `components/Analytics/SessionsTrace/Detail/FeedbackEntry.tsx`, unchanged
- [x] 2.2 `SessionDetailView` passes the session's feedback map, its partial state and the comment-text grant to `SessionTraceView`; the view attributes them to spans once and passes the result to `SessionEventStream` (badge on the row) and `SessionSpanDetail` (Feedback section)
- [x] 2.3 State the partial rating list once in `SessionTraceView` (D3); add `TraceRatingsPartial` to `constants/i18n.ts` and `locales/en.ts`
- [x] 2.4 Component specs for 2.1–2.3: rated span badge, unrated hop without one, no session, relayed id badged once, partial notice present and absent, rail section with comment text readable and withheld, unrated span without a section

## 3. Quality checks

- [x] 3.1 Run lint, both typechecks, the Analytics test suites and `openspec validate`
