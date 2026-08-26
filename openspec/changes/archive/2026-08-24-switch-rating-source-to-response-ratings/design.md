## Context

See proposal.md — Why. The constraints that shape the approach:

- **The DSL has no join.** Every rating read is a separate query keyed on `chat_id`, and that structure does
  not change; only the entity and the columns do.
- **The consistency invariant is already specified.** The Rating column must predicate on the *same* columns
  the feedback filter does, so a conversation the Negative filter selected cannot display a zero negative
  count. Any change to one side has to move the other with it.
- **Three consumers, three shapes.** The feedback filter wants candidate `chat_id`s; the grid wants per-page
  per-`chat_id` counts; the detail view wants both a per-conversation total and a list. All three come off
  one entity, but they are not one query.
- **`turn_feedback` is not a candidate.** It is an enrichment on `turns`, joined by the turn's chain-entry
  `response_id`, which is NULL for 87% of turns because DIAL Core does not stamp the chat id on the proxy
  entry record. Measured on dev, it reaches 24 of 44 rated conversations. `response_ratings` is its grain
  table and carries `chat_id` directly.

## Goals / Non-Goals

**Goals:**

- One rating query per page instead of three, with no change to what the figures mean.
- Detail figures that are exact rather than a count of what the panel loaded.
- Disclose what the negative figure does and does not establish, without redefining it.
- Leave no second rating path behind.

**Non-Goals:**

- Per-turn rating attribution through `turns.response_id` or `turn_feedback`. The existing time-based
  attribution is re-pointed at the new grain's latest rating time and otherwise left alone.
- Any change to the grid's Rating cell layout. Its figures' source changes; its two-direction presentation
  does not, beyond the conditional caveat.
- Localizing or reinterpreting `rate_sum`, `rater_count` or `rated_deployment`. They are available on the
  new source and deliberately unused here.

## Decisions

### Preserve the negative figure's meaning; disclose its attributability separately

`rate_zero_count + rate_neg_count` is arithmetically what `le(rate, 0)` selects — the service normalizes a
boolean `false` to `0`, and that is counted, exactly as the spec already requires. `rate_bool_false_count`
and `rate_raw_count` are added to the projection to *describe* the figure, not to compute it.

*Alternative considered:* redefine negative as the provable subset (`rate_neg_count + rate_bool_false_count`).
Rejected on two grounds. It would break the filter/column invariant unless the filter moved with it, and if
the filter moved too, every non-positive rating predating the service's `rate_raw` column would silently stop
being returned — on dev that is 52 of 172 events. A filter that quietly narrows is worse than a figure that
carries a caveat, and this spec already handles "the figure is real but needs reading carefully" with a
caveat in three other places (`duration_ms`, `avg_duration_ms`, `chain_price_total`).

### One aggregate for both directions

The additive per-direction columns retire the per-direction query pair outright. The old rule was not a style
choice — `count(rate)` and `sum(rate)` genuinely cannot recover two directions from a signed value — so the
delta states why it is being dropped rather than just dropping it.

### No fallback to `rate_analytics`

`response_ratings` is `system: false`, and so are `conversations` and `turns`. The page cannot render without
either of those, so this adds no new class of failure: an absent rollup is handled the way an absent turn
rollup already is, by the read failing and the view rendering its existing failure state.

*Alternative considered:* probe the entity list and fall back to the event-log path. Rejected — every builder,
model, predicate and count helper this change removes would have to stay alive beside its replacement, and the
two paths would produce subtly different negative figures for the same conversation.

### Detail figures come from an aggregate, not from the loaded rows

`countFeedbackDirections` over the fetched rows is removed; the detail action issues the same per-`chat_id`
aggregate the grid uses, scoped to one id, alongside the list read. The list keeps its bound and its partial
notice; the figures stop being bounded by it.

*Alternative considered:* raise `CONVERSATION_FEEDBACK_LIMIT` so the loaded set is "usually" complete.
Rejected: it makes the figures right more often without making them right, and the failure stays silent.

### The list's grain becomes the rated response

One row per rated response is what the source carries; a per-event list is not reconstructible from it. Rather
than approximate the old list, the entry states what the new grain actually knows: direction, the rating
window where first and last differ, the comment count, and whether the response's own ratings disagree. That
last one is information the event-log path could not surface at all.

### Comment count and comment text are gated differently

`comment_count` is catalogued non-sensitive — a scoped count aggregates no protected column — so it is
projected unconditionally. `comment_sample` is sensitive, so it goes through the same schema gate the
transcript body columns use: named only when the fetched schema reports it, which is per caller role. This
replaces the flat "comment renders as unavailable" rule, which conflated "no comment" with "not permitted".

## Risks / Trade-offs

**Refresh lag.** `rate_analytics` is ingested live; `response_ratings` is a periodically-refreshed rollup, so
a rating submitted minutes ago will not appear until the next refresh. → Accepted, and consistent with the
rest of the view: the conversation and turn rollups the page already depends on have the same property, and
the turn-list requirement already specifies the behaviour for a conversation newer than the last refresh.

**A conversation's rating figures can disagree with DIAL Chat for a few minutes.** → Same cause as above,
same acceptance. Not disclosed per-cell; a caveat on every rating figure for a transient condition would
train readers to ignore caveats.

**The feedback panel's monospace source identifier changes, visibly.** → Intended. It is a claim about which
entity the page queried, and that claim is changing.

**The per-event list is gone.** A response rated twice was two entries and is now one. → Mitigated by
stating the rating window and the disagreement flag, which together carry more than two undifferentiated
entries did.

**Requirement overlap with `add-conversation-insights-panel`.** Both changes touch the panels requirement's
catalog-identifier rule. That change's delta states the rule in terms of *the entity the ratings are read
from* rather than naming one, specifically so this change does not have to modify the same requirement. If the
two are archived in the other order, re-check that bullet rather than assuming it.

**One stale illustrative mention is left behind.** The conversation-list-query requirement describes Rating
as "composed from `rate_analytics` lookups" in an aside whose normative content — a column with no field
behind it must not be named — is unaffected. Copying a 275-line requirement to correct one parenthetical
would re-assert far more than it fixes, so it is left for a later editorial pass and recorded here.
