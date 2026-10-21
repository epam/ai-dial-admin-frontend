## Context

See `proposal.md` — Why. Two constraints shape everything below.

**Ratings are not a field of `conversations`.** They live in the `response_ratings` rollup, one row per rated
`response_id`, carrying `chat_id`. Both the dev and the local instance carry it and neither exposes a
rating enrichment on `conversations`, so a rating figure scoped to conversations is necessarily a second
query against a second entity. That is why the pills cannot simply be more columns on the existing totals
aggregate.

**The conversation count doubles as the grid's row total.** `getConversations` returns
`total: toNumber(totals.conversations)`, and `use-conversations.ts` hands it to `params.successCallback` as
the infinite row model's row count. Decoupling the pill from the grid's filters therefore also decouples it
from the value the grid needs, and the design has to say what the grid gets instead.

The queries below were run against the live local instance through `POST /v1/queries/execute` — the same
structured-DSL endpoint the frontend uses — and returned 21 rated and 13 negative conversations over the full
range. The approach is verified, not assumed.

## Goals / Non-Goals

**Goals:**

- One rating figure per pill that is complete from the first page and never moves as the operator scrolls.
- A provenance line that cannot drift from the instance it is rendering.
- No new backend or catalog dependency: the change must run unmodified against dev and local as they stand.
- Degrade per-figure, not per-header: a rating aggregate that fails must not blank the cost.

**Non-Goals:**

- Reducing the number of first-page requests. The header legitimately asks three questions of two entities.
- Making the pills honour the grid's filters by any later route (see `proposal.md` — Non-goals).

## Decisions

### D1 — Rating totals come from `response_ratings`, aggregated by distinct `chat_id`

`count` accepts a DISTINCT quantifier in the query DSL (`fn('count', [field(...)], true)`, already supported by
`query-build.ts`), so the period's rated and negative conversation counts are one aggregate each over
`response_ratings`: the existing time-range predicate on `last_rate_time`, the existing `chat_id != ''`
guard, and `count(DISTINCT chat_id)`.

The two rate predicates already exist. `ratePredicates(feedback)` in `conversations-queries.ts` builds exactly
the sets needed — `FeedbackFilter.Rated` for the rated pill, `FeedbackFilter.Negative` for the negative one —
so the new query reuses that helper rather than restating the thumb semantics a third time. That matters:
"negative" here means `rate_zero_count > 0 OR rate_neg_count > 0`, and the one place that decision is encoded
should stay one place.

*Alternatives considered.* **`turns.turn_feedback.*`** — an enrichment on `turns`, present on both instances,
which would let the counts be a plain aggregate with a normal join. Rejected on coverage: it attaches through
the turn's chain-entry `response_id`, and DIAL Core does not stamp `chat.id` on the record that begins a
chain, so most turns carry no response id at all. Measured on local: 2,395 of 35,877 turns carry one, and 6
match a rating — 5 conversations, against 19 reachable by `chat_id`. **A rating enrichment on
`conversations`** — the cleanest possible answer, one aggregate, same entity, same filter — rejected because
it does not exist on dev, and dev is the source of truth for what this frontend may assume.

### D2 — Two rating aggregates, not one

The rated and negative pills need different predicates over the same rows, and the DSL has no conditional
aggregate, so a single statement cannot carry both counts. Two aggregates, issued concurrently with the
conversations totals query in the existing `Promise.all`, are simpler than any encoding that squeezes them into
one and produces a shape the caller has to unpick.

### D3 — The grid takes the period count where it is exact, and no total where it is not

The pills stop carrying the filter, so they stop being a correct row total for a filtered grid. Where nothing
narrows the period the two questions have the same answer, so the grid reuses the period count already
resolved — exact, and free. Under a search term, a column filter or a feedback filter it does not, and the
period count must not be offered as one: it would overstate the result. The grid then finds the end by a page
coming back short, the signal it already terminates on.

An earlier draft resolved a second, filter-carrying aggregate so the scrollbar stayed exact under a filter.
It was dropped as unrequested complexity: a query builder, a resolver, a predicate and a block of tests bought
a scrollbar length in a state the operator has just narrowed by hand. The cost of not having it is that under
a filter the row count is discovered by scrolling rather than known up front.

The grid's total and the header's conversation pill are two named things that may legitimately differ, which
is the point of the change rather than a defect in it.

### D4 — The provenance line is derived, not configured

`conversation-column-catalog.ts` already reads an enrichment namespace off a field name (`enrichmentOf`) and
maps it to a provenance colour (`columnProvenance`), because the grid's provenance band needs exactly that.
The line reuses both: walk `schemaFields` in order, take the distinct namespaces, and render the base entity
first. An enrichment this frontend has never heard of falls to `ColumnProvenance.Other` and is still named —
the same treatment the grid band gives it, which is why the two cannot disagree.

Entities the page queries that are *not* enrichments of `conversations` — today only `response_ratings`,
which backs the Rating column — cannot be derived from that schema, so they stay a small explicit list. It is
a list of **what the page queries**, not of what the entity is composed of, and it shrinks to nothing on the
day ratings become an enrichment. `CONVERSATION_SOURCE_ENTITIES` is removed; nothing else reads it.

### D5 — the whole loaded-rows mechanism is deleted, not left unused

`summariseConversations` goes: nothing else calls it once the pills stop reading fetched rows, and keeping a
row-scanning summariser next to a header that no longer scans rows invites someone to reconnect them.

The `loaded` map goes with it, along with `loadedCount`, `LoadedConversations` and `resultKey`. An earlier
draft of this design kept the map on the grounds that it de-duplicates re-fetched blocks — that was wrong.
AG Grid's infinite row model owns its own block cache; the map never fed the grid, and its de-duplication
existed solely so the rated pill could report a count of *distinct* conversations rather than of delivered
rows. With the pill resolved from the backend, the map is written and never read. Verified by lint, which
reports it as an unused binding once the count is gone.

The lesson worth keeping: `loadedCount` was not a small dead return value on the way out, it was the only
reader of a whole subsystem.

## Risks / Trade-offs

- **The pills and the grid can show different populations, and that is now correct.** An operator who filters
  to one project sees a grid of that project beside a header covering everything in the period. → Every pill
  states its period visibly (spec requirement), so the header reads as a period dashboard rather than as a
  summary of the rows below it. This is the change's central trade-off, made deliberately.
- **Three aggregates on the first page instead of one**, four when a filter narrows. → All are issued
  concurrently in the existing `Promise.all`; none blocks the rows, which are fetched by their own query in the
  same cycle. The row query is unaffected.
- **`response_ratings` is filtered on `last_rate_time`, `conversations` on `last_request_time`.** A
  conversation whose turns fall in the period but whose rating was submitted after it counts in one and not
  the other. → Inherent to two entities with two clocks, and already true of the existing feedback filter,
  which predicates the same way. The pills describe rating activity in the period; the wording is "rated in
  this period", not "conversations from this period that are rated".
- **An instance lacking `response_ratings` makes two pills unavailable.** → Already the failure mode for the
  Rating column and the feedback filter on such an instance, and the spec requires unavailability rather than
  zeros. No instance in use lacks it.
- **A very large rated population makes `count(DISTINCT chat_id)` the header's slowest query.** → It is an
  aggregate with no projection and no page, over a rollup whose grain is already one row per rated response.
  If it ever becomes the bottleneck, it degrades independently under D2 without taking the cost pill with it.
