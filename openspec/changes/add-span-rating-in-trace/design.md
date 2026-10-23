## Context

Ratings live in `response_ratings`, grained by `response_id` and filtered by the session's `chat_id`. The
trace card already joins them to a trace by the response ids the trace recorded. Measured on dev, a rated
`response_id` matches exactly one `dial_usage_log` row — the trace's root, the hop that answered the client —
while in-turn hops carry their upstream's own ids (`resp_…` from the provider, a nested application's own
UUID, or nothing for a RAG hop). That was checked on a handful of traces, not proven for every producer.

## Decisions

### D1 — Attribute by an exact join on the span's response id, not by "the root"

The root is where the rating lands in the data observed, but placing it on the root by position would put a
rating on a trace whose root never produced the rated answer — a Core-internal root, an unrecorded root, a
trace whose root predates the column. Joining on the span's own `response_id` states only what the data
records.

*Alternative rejected:* badge the root whenever the trace card has a rating. Simpler, and wrong in exactly the
cases above.

### D2 — A response id recorded on several spans is placed on the shallowest one

`response_id` is the response body's `id`. An application that relays its model's stream unchanged would
record the model's id on its own hop too, and a plain map lookup would then show one rating on two rows — read
as two ratings. `attributeFeedbackToSpans` walks the tree level by level and places each rated response once,
on the shallowest span that carries it, earliest sibling first: the hop nearest the client is the one that
answered it. The result is keyed by span id, so the tree and the rail read the same placement.

*Alternative rejected:* show it on every matching span. Honest about the data, but it double-counts on screen,
and the trace card already states the trace-level figure once.

### D3 — Disclose the cap once, for the trace

The feedback rows are capped by `SESSION_FEEDBACK_LIMIT`. A rated response past the cap is absent from the map,
and its span is indistinguishable from an unrated one. The trace view states this once, beside the span-read
partial notice, when the session's list is partial. A per-span marker was rejected: it cannot say *which*
spans are affected, so it would mark every span.

### D4 — Reuse the feedback panel's entry; keep the tree badge control-free

The rail's section renders `FeedbackEntry`, extracted unchanged from `SessionFeedbackPanel`, so the comment
gate and the contested / re-rated wording cannot drift between the two. The tree badge sits inside the row's
`<button>`; `RatingCounts` would render a caveat button only for `provable_down`, which `feedbackRowCounts`
never sets, so no control nests inside the row.

## Risks

- **Coverage is thin where the session header is missing.** A root recorded without a `response_id` gets no
  badge; the trace card's own figure is unaffected.
