## Context

The trace listing resolves a page in three queries (page, roots, figures) whose scopes are one invariant —
see `analytics/session-trace-listing`. The figures query groups by `(trace_id, event_kind)` and sums tokens
and price; `traceFiguresOf` folds those rows into a trace's figures, and both the session listing and the
entity call listing use it. The span tree reads each span with every column the hop log schema reports, so
`cached_prompt_tokens` and `cache_creation_tokens` already reach `SessionSpanRow` where the instance
publishes them; `hopFactsOf` decides which figures a row states.

Measured on the hop log: no row records more cached prompt tokens than prompt tokens, in either the chat
completions or the messages dialect, so `prompt_tokens` includes the cached part on both.

## Goals / Non-Goals

**Goals:**
- One cache figure per register: a share for the trace, read and write for a span.
- No new query and no change to the three-query scope invariant.

**Non-Goals:**
- Gating the span row's cache figure separately: the span read already projects only schema-reported
  columns, so an absent column arrives as `undefined` and the row states nothing.

## Decisions

### The trace states a share, not counts

`sum(cached_prompt_tokens) / sum(prompt_tokens)` over the trace, formatted with the existing `formatShare`.
A share is what explains why a large token total costs little; absolute counts beside a token total read as
a second token total. Counts stay available per span.

*Alternative:* `read / write` counts summed over the chain. Rejected — it adds two numbers to a line that
already carries tokens and cost, and the write count only matters per call.

### No cache on the card's own facts

The card's middle tier is read from the root's own row. An application root has zero own tokens, so an own
cache fact is always zero there; a model root's trace equals its call. Both cases make it noise.

*Alternative:* a chain cache sum on the card, beside `chain cost`. Rejected — `chain cost` is a column the
root row itself records (`total_price`); no root column records chain cache, so the value would be a trace
figure presented in the card's own register, which the listing spec forbids.

### The figures query gains two sums, gated by one schema check

`buildSessionTraceFiguresQuery` takes a `hasCacheColumns` flag and, when set, adds
`sum(prompt_tokens)` and `sum(cached_prompt_tokens)`. The server action resolves the flag with the existing
`isUsageLogFieldServed(UsageLogField.CachedPromptTokens, …)`, as it already does for the client session id,
on both callers (session listing and entity call listing). `traceFiguresOf` sums the two aliases with `?? 0`,
so a query without them yields `promptTokens: 0` and the share is not rendered.

*Alternative:* always name the columns. Rejected — an instance without them rejects the whole figures query
and every trace loses its span count, tokens and price.

### Span row: read / write, rendered only when non-zero

`hopFactsOf` adds `cacheRead` and `cacheWrite` to the metered shape. The row renders
`cache r/w {read} / {write}` after the token count when either is above zero; a missing side renders `0`.
The unmetered shape is unchanged.

### Separator as a presentational pseudo-element

The metered facts render inside one flex span whose children after the first get a `::before` middle dot in
`text-tertiary`, following the `AllSuitesTrendsHeader` precedent. No separator elements enter the DOM, so a
conditionally absent figure can never leave a doubled or dangling dot, and the figures' text is unchanged
for tests and assistive tech.

## Risks / Trade-offs

- [A trace mixing cached and uncached providers states one blended share] → Accepted: the share answers
  "how much of this trace's prompt was cached", which is the question the cost raises; per-call detail is on
  the span rows.
- [A router hop that relays a model's usage repeats the model's cache figure on its own row] → Accepted:
  its tokens are already repeated the same way; the row states what that hop recorded.
- [A screen reader may announce the CSS dot] → Use the alt-text form of `content` (`"·" / ""`) so the
  separator is silent to assistive tech.
- [Spec fixtures that build `SessionTraceGroup` or `HopMeteredFacts` by hand] → The new fields are required
  on the group and the metered facts, so `typecheck:specs` surfaces every fixture to update.
