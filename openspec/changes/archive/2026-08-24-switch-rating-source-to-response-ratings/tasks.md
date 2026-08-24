## 1. Model and constants

- [x] 1.1 Replace `RateAnalyticsField` with `ResponseRatingsField` in
      `src/models/analytics/conversations-trace.ts`, covering `chat_id`, `response_id`, `first_rate_time`,
      `last_rate_time`, `rate_pos_count`, `rate_zero_count`, `rate_neg_count`, `rate_bool_false_count`,
      `rate_raw_count`, `rate_distinct_count`, `comment_count` and `comment_sample`.
- [x] 1.2 Point `FEEDBACK_ENTITY` at `response_ratings` in
      `src/constants/analytics/conversations-trace.ts` and remove `POSITIVE_RATE_EXCLUSIVE_MIN`.
- [x] 1.3 Re-shape `ConversationFeedbackRow` to the rated-response grain and extend `RatingCounts` with the
      provable-negative and captured-form figures the caveat is drawn from.
- [x] 1.4 Add the optional-field list for the sensitive comment text column, so it is named only when the
      fetched schema reports it (the gate `OPTIONAL_USAGE_LOG_FIELDS` uses for the body columns).

## 2. Query builders

- [x] 2.1 Retarget the candidate query in `src/utils/analytics/conversations-queries.ts` to
      `response_ratings`: group by `chat_id`, select `chat_id` and `max(last_rate_time)`, bound
      `last_rate_time` to the period, keep the empty-id guard, the ordering and the 1000 cap.
- [x] 2.2 Replace `ratePredicates` with predicates over the split count columns per the delta spec's table,
      using the `or` primitive for the negative and rated states.
- [x] 2.3 Collapse `buildConversationRatingsQuery` from one query per direction into a single aggregate
      selecting `sum(rate_pos_count)`, `sum(rate_zero_count)`, `sum(rate_neg_count)`,
      `sum(rate_bool_false_count)` and `sum(rate_raw_count)`, and drop the `direction` parameter and
      `DIRECTION_FEEDBACK` map.
- [x] 2.4 Retarget the per-conversation feedback list query to `response_ratings`, selecting the response id,
      the two rate times, the direction counts, `rate_distinct_count`, `comment_count` and — when the schema
      reports it — the comment text, sorted by `last_rate_time` descending.
- [x] 2.5 Add a per-conversation aggregate for the detail view's direction figures: the same shape as 2.3
      narrowed to one `chat_id` by equality.

## 3. Server actions

- [x] 3.1 In `src/app/[lang]/conversations-trace/actions.ts`, replace the two concurrent directional requests
      with the single ratings request and map its row shape to the grid's rating counts.
- [x] 3.2 Have the conversation detail action return the aggregate direction figures alongside the feedback
      list, so the view no longer derives them.

## 4. Components

- [x] 4.1 Remove `countFeedbackDirections` from `src/utils/analytics/conversation-detail-fields.ts` and take
      the figures from the action's result in `Detail/ConversationDetailView.tsx`.
- [x] 4.2 Re-point `attributeRatingsToTurns` at the rated-response grain's latest rating time, keeping the
      time-based approximation and its existing behaviour on ties.
- [x] 4.3 Update `Detail/ConversationFeedbackPanel.tsx` for the new entry: direction from the response's own
      counts, a rating window where the two times differ, the comment count (distinguishing none from
      not-permitted), and a disagreement statement where `rate_distinct_count` exceeds one.
- [x] 4.4 Add the conditional negative-figure caveat to the rating presentation shared by the grid cell and
      the feedback panel, as a focusable control whose accessible name carries the caveat — matching the
      duration caveat's pattern in `ConversationFieldRows` (`.claude/rules/a11y.md`).
- [x] 4.5 Update the provenance band and panel source labels so the rating source reads `response_ratings`.

## 5. Tests

- [x] 5.1 Unit-test the candidate query: entity, grouping, `last_rate_time` bounds and ordering, empty-id
      guard, cap; and each of the three predicate states, including that negative matches a zero-only
      conversation and that rated excludes a response whose only event carried no rating value.
- [x] 5.2 Unit-test the ratings aggregate: one query rather than two, every projected column present, page
      ids applied by `in`, and that it is not built for an empty page.
- [x] 5.3 Unit-test the per-conversation aggregate and the feedback list query, including that the comment
      text column is named only when the schema reports it.
- [x] 5.4 Unit-test the negative composition and the caveat predicate: a fully attributable figure yields no
      caveat, a partially attributable one does, and an unrated conversation yields neither.
- [x] 5.5 Unit-test `attributeRatingsToTurns` against the new grain.
- [x] 5.6 Component-test the feedback panel: exact figures independent of the listed count, a re-rated
      response's window, a disagreement statement, a comment count with and without the text column, and the
      partial-list notice not qualifying the figures.
- [x] 5.7 Component-test the grid rating cell: both directions from one result, the conditional caveat's
      accessible name, and nothing rendered when the ratings query failed.
- [x] 5.8 Remove or retarget the existing specs that assert the `rate_analytics` entity, the per-direction
      query pair, and the flatly-unavailable comment.

## 6. Quality checks

- [x] 6.1 Confirm no source file outside the retention note references `rate_analytics`, and that
      `RateAnalyticsField`, `ratePredicates`, `POSITIVE_RATE_EXCLUSIVE_MIN`, `DIRECTION_FEEDBACK` and
      `countFeedbackDirections` are gone.
- [x] 6.2 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and resolve everything
      they report.

**No browser-verification task.** Several scenarios here are browser-observable, so the question was put to
the user, who chose to rely on unit and component tests for this change. Recorded so a later reader does not
read the omission as an oversight.
