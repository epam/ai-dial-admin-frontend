## Why

A session's ratings are stated in three places today — the sessions grid, the feedback panel, and the trace
card that recorded the rated response — and stop there. A reader who opens the trace to see *why* an answer
was rated down lands in the span tree with no mark of which span produced that answer, and selecting it shows
nothing about the rating. The reader has to return to the session, find the response in the feedback panel,
and match ids by eye.

## What Changes

- **The span tree marks the rated span.** In a trace opened from a session, the row of the span that answered
  a rated response shows that response's rating counts — the same `RatingCounts` the trace card shows.
- **The span rail states the rating.** Selecting that span adds a rating card to the rail, with no heading of its own: the rating's
  direction, when it was rated (or the window, for a re-rated response), whether its ratings disagree, and its
  comments under the feedback panel's own comment-text gate. It reuses the feedback panel's entry, extracted
  into its own component.
- **A partial rating list is disclosed.** The session's rating list is capped; when it is partial, the trace
  view says once that a span may carry a rating it does not show.
- **No new read.** Everything comes from the feedback rows the session page already loads, plus `response_id`
  added to the span query's base fields where the schema reports it.

## Non-goals

- **Rating an individual step.** Only the response the client was answered with is rated; an in-turn hop —
  a model call inside an application, a tool call — has no rating to show, and none is invented for it.
  Rating steps would need the client to send a span id with the rating, which is backend work.
- **Ratings in a trace opened from an entity's Audit `Traces` tab.** That listing has no session and so no
  rating source; it stays as it is.
- **Lifting the rating-list cap.** The cap is the feedback panel's; this change discloses it rather than
  changing it.

## Impact

- `analytics/session-trace-detail` gains one requirement.
- Components: `SessionTraceView`, `SessionEventStream`, `SessionSpanDetail`, `SessionDetailView`; new
  `FeedbackEntry` extracted from `SessionFeedbackPanel` (its rendering unchanged).
- Utils: `attributeFeedbackToSpans` in `session-span-tree.ts`, `feedbackByResponseId` in
  `session-detail-fields.ts`. `SPAN_BASE_FIELDS` gains `response_id`, filtered by the schema like every base
  field, so an instance whose hop log lacks the column still reads the tree.
