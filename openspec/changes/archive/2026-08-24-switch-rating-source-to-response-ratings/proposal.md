## Why

The Conversations feature resolves ratings from `rate_analytics`, the raw rate-event log, and pays for that
choice three times over.

**It costs three queries per page.** Candidate ids, then `buildConversationRatingsQuery` **twice** — once per
direction — because, as the code states, `rate` is a signed integer and "the split cannot be derived from
count and sum".

**It cannot say how sound its own negative figure is.** `rate_analytics.rate` collapses a boolean `false` and
a numeric `0` onto the same value. Counting both as negative is the specified behaviour and stays that way —
but `rate_analytics` offers no way to state how much of a negative figure is *provably* a thumbs-down. On the
dev instance, 63 non-positive ratings carry 25 provable negatives, and only 28 of 172 events captured the
submitted form at all. The current path has no column that can express any of that, so the figure is
presented without the caveat it needs.

**It counts only what it loaded.** The detail page's thumbs figures come from `countFeedbackDirections` over
the fetched rows, capped at 100. A conversation with 240 rate events shows the counts for 100 of them; the
"showing N of total" notice appears, but the numbers beside the thumbs stay the loaded subset.

`response_ratings` — the per-response rollup that is `turn_feedback`'s grain — answers all three. It carries
`chat_id`, so it addresses conversations directly, and it pre-splits the rating distribution into additive
columns.

## What Changes

- **BREAKING (behavioural):** every conversation rating read moves from `rate_analytics` to
  `response_ratings`. The rating source identifier shown in the feedback panel changes accordingly.
- The two directional rating queries collapse into **one**: `sum(rate_pos_count)` and `sum(rate_neg_count)`
  grouped by `chat_id`. Three queries per page become one.
- The rating figures keep their present meaning. Positive is `rate_pos_count`; negative is
  `rate_zero_count` plus `rate_neg_count`, which is arithmetically what `le(rate, 0)` selects today. The
  feedback filter's predicates move to the same columns, so the invariant that a conversation the Negative
  filter selects cannot display a zero negative count is preserved.
- **New:** the negative figure gains a disclosed caveat. `rate_bool_false_count` and `rate_raw_count` state
  how much of it is provably a thumbs-down and how much predates the captured-form column, so the reader is
  told what the figure does and does not establish — the way the duration and chain-cost figures already
  carry their own caveats. The figure itself is not redefined.
- The detail page's rating figures come from an **aggregate scoped to the conversation**, not from counting
  the loaded rows. They become exact regardless of the list's bound; the list keeps its cap and its partial
  notice, now reading as a bounded sample of an exactly-counted whole.
- The feedback list's grain changes from one card per rate **event** to one per rated **response**. A card
  gains a rate window (first and last rated time) where the two differ, a comment count, and a disclosure
  when the response's own ratings disagree (`rate_distinct_count > 1`).
- Comment counts become visible. `response_ratings.comment_count` is explicitly non-sensitive, so a card
  states how many comments a response carries; `comment_sample` and `comments` stay sensitive and are named
  only when the fetched schema reports them, the way the transcript's body columns already are.
- **Removed:** `RateAnalyticsField`, `FEEDBACK_ENTITY`'s `rate_analytics` binding, `ratePredicates`,
  `POSITIVE_RATE_EXCLUSIVE_MIN`, `buildConversationFeedbackQuery`'s event projection,
  `buildConversationRatingsQuery`'s per-direction duplication, and `countFeedbackDirections`.
- No fallback path. `response_ratings` is `system: false`, and so are `conversations` and `turns` — the page
  cannot render without either of those, so a missing rollup is handled the way `turns` already is: the read
  fails and the panel renders its existing failed-to-load state. Two rating paths maintained in parallel would
  cost more than the case is worth.

Non-goals:

- No per-turn rating attribution. Attributing a rating to a turn through `turns.response_id` or
  `turn_feedback` is separate work; this change keeps the existing time-based attribution, re-pointed at the
  new source's `last_rate_time`.
- No change to the grid's Rating column presentation, only to where its figures come from.
- No change to the feedback filter's vocabulary (All / Positive / Negative / Rated), only to the predicates
  behind it.

## Capabilities

### New Capabilities

None. The rating path is already specified.

### Modified Capabilities

- `analytics`: the requirements covering the feedback filter's resolving query, the Rating column's
  per-page resolution, and the detail view's rating source all change source entity, predicate basis and —
  for the detail figures — the grain they are counted at.

## Impact

- `apps/ai-dial-admin/src/utils/analytics/conversations-queries.ts` — three builders retargeted, the two
  directional queries merged, `ratePredicates` replaced by predicates over the split count columns.
- `apps/ai-dial-admin/src/models/analytics/conversations-trace.ts` — `RateAnalyticsField` replaced by
  `ResponseRatingsField`; `ConversationFeedbackRow` re-shaped to the response grain; `RatingCounts` gains the
  provable-negative and captured-form figures the caveat is drawn from.
- `apps/ai-dial-admin/src/constants/analytics/conversations-trace.ts` — `FEEDBACK_ENTITY` becomes
  `response_ratings`; `POSITIVE_RATE_EXCLUSIVE_MIN` removed.
- `apps/ai-dial-admin/src/app/[lang]/conversations-trace/actions.ts` — one rating request instead of two; the
  detail action returns aggregate counts alongside the list.
- `apps/ai-dial-admin/src/utils/analytics/conversation-detail-fields.ts` — `countFeedbackDirections` removed;
  `attributeRatingsToTurns` re-pointed at the response grain's `last_rate_time`.
- `ConversationDetailView.tsx`, `ConversationDetailRail.tsx`, `ConversationFeedbackPanel.tsx` — counts arrive
  as a prop rather than being derived; the card gains a rate window, comment count and disagreement notice.
- The feedback panel's monospace source identifier is user-visible and changes.
