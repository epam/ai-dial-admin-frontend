## Context

See `proposal.md` — Why. Requirements are in `specs/analytics/spec.md`; this document records the technical
decisions behind them and the measurements each rests on.

Three properties of the backend shape everything below.

**`dial_usage_log` is `ORDER BY (project_id, deployment, request_time, trace_id, core_span_id)`, partitioned
`PARTITION BY toYYYYMMDD(request_time)`.** The only skip index is a minmax on `_ingested_at`. There is no
index on `chat_id` and none on `trace_id`, and `trace_id` is the fourth sort-key column — so neither prunes.
The daily partition range is the primary prune and `project_id` the secondary one. `project_id` is a genuine
discriminator but tenant-dependent: measured over one window, the busiest project was 78 906 of 126 120 rows (63%) and
the empty project 7%, so a project filter alone can leave most of the table in scope.

**The query DSL's function catalog is a closed set, negotiated at runtime.** `GET /v1/queries/functions` is
the authority — not `QueryFunctionCatalog.java` in the local checkout, which is behind the deployed service.
The live catalog carries `if(condition, then, else)` with `equals` / `not_empty` / `starts_with` / `contains`
as boolean operands, which is what makes a conditional aggregate expressible client-side. Aggregate mode never
populates `totalCount`.

**The rollups are periodic while the log is live.** `conversations_rollup` and `turns_rollup` both filter
`length(chat_id) > 0`; `turns_rollup` groups by `trace_id` and sets `chat_id = max(chat_id)`, so a trace whose
root carries no header still *appears* — with every measure computed without that root. Observed lag: ~660 s
on `conversations_rollup`, ~900 s on `turns_rollup`.

## Goals / Non-Goals

**Goals:**

- One definition of the listing's unit, held in one place, that can describe a single client call.
- Figures that reconcile without per-field correction, and whose scoping cannot silently diverge.
- Structural assumptions expressed as guards, so a change in the data's shape fails loudly.

**Non-Goals:**

- Reducing the paging query's scan below the conversation's own span. It is the query that *discovers* the
  page, so it cannot be bounded by the page's own output. See Risks.
- Renaming the hop drawer's requirement vocabulary. Its requirement is still named after a "turn"; the drawer
  is otherwise out of scope, and renaming it belongs to the change that reworks it.
- Any change to how the transcript is assembled or rendered. The Chat view gains its own figures read and its
  footers move to the trace-group model, but the assembly and the message presentation are untouched.

## Decisions

### Live queries over the `turns` rollup

`turns_rollup` already computes, per trace, everything the paging query was first specified to return —
`min(request_time)`, `count()`, `sum(total_tokens)`, `sum(deployment_price)`, `max(operation_duration_ms)`,
and `failed_hop_count` as `count() where success = false`. Reading it would be one cheap query instead of a
grouped scan.

Rejected, because its population is the defect. Every measure is computed over `length(chat_id) > 0` rows, so
for the shape this change exists to fix each one omits the root. Reading the rollup and then correcting it
per field is precisely the arithmetic this design removes. Its 15-minute staleness would also become visible
the moment live root facts sat beside it on the same card.

*Alternative considered:* rollup for the sums, live for the roots. Rejected — a card mixing a live root with
sums up to 15 minutes old is the worst of both, and the corrections remain.

### Scope divergence, not scope breadth, is the failure mode

The root query and the figures query differ only in the root-span predicate and in row-vs-aggregate mode.
Every arithmetic correction that earlier drafts of this design carried — `+1` on a span count when the root's
`chat_id` was empty, `+ root.value` on each sum — existed because the two queries covered different row sets.
Removing `chat_id` from both makes the corrections unnecessary rather than smaller.

The invariant is therefore asserted as **one** property in the query-shape test: build both for the same page
and assert their filters are equal modulo the root predicate. Comparing two enumerated filter lists by eye is
what let them drift in the first place.

### `project_id` on the paging query only

Measured on three traces (`ab6e92ac`, `24955730`, `eb9359c6`): the client subtree carries the conversation's
project while the Core-internal root carries Core's own (`dial`). Filtering the root query or the figures
query by the conversation's project therefore deletes the Core-internal card and its rows — and deletes them
*silently*, because the figures query would still count what the root query dropped.

It is admissible on the paging query because that query is already restricted to rows carrying the chat id,
and those are single-project: `GROUP BY trace_id HAVING count(DISTINCT project_id) > 1` over labelled rows
returns nothing across the sampled window.

The asymmetry is the counter-intuitive part of this design, so the reason belongs in the code beside the
builders. A reader who tidies the three filter lists into one shared helper reintroduces the bug.

*Alternative considered:* `project_id IN (<conversation's>, 'dial')`. Rejected — Core's project is deployment
configuration, and hard-coding it stops marking anything on an instance configured differently.

### Padding, not rounding, and derived from the page

Rounding a bound to the *containing* UTC day gives zero margin at exactly the boundary the observed offsets
straddle: a root precedes its children by 54–502 ms (no stated upper bound), and a Core-internal root fires at
its parent's completion — 36 s later on one measured trace. `± 1 day` costs one extra daily partition at each
end.

Bounds come from the **page**, not the conversation: the paging query returns each trace's `min` *and* `max`
recorded time, so the window is the page's own span, typically minutes. A conversation-wide window would make
the figures query read one partition per day of a long-running conversation's life on every page fetch.
Returning `max` as well as `min` is free on a scan already paid for, and it keeps the padding absorbing a
bounded offset rather than an unbounded call duration — a ceiling built from `min`-of-`min`s is the *start* of
the page's last trace.

The query-shape test asserts the **padding**. A test that only asserts a UTC day boundary passes a query that
still clips.

### Offset paging, ascending, with a client-side id set

Ascending order is what makes offset paging sound against a live table: a newly recorded trace sorts past the
last page fetched, so consumed offsets do not shift. Descending inverts that — a new trace displaces every row
after it, and later pages re-serve and skip.

Keyset paging was considered and deferred. It requires the cursor bound over the **aggregated** start time
(`HAVING min(request_time) > cursor`, which `StructuredQuery` models but `query-build.ts` does not yet
expose); filtering the underlying rows by the cursor instead changes a straddling trace's computed `min`, and
that trace reappears. The largest observed conversation is 191 traces — four pages — so the complexity is not
yet earned. Newest-first is gated on doing keyset first, which is why the sort direction is a spec constraint
rather than a display option.

Independently of the scheme, loaded trace ids are held in a `Set`: a late-ingested row can lower a trace's
`min(request_time)` and move it across a page boundary. Both schemes are exposed; the id set makes the
duplicate impossible rather than unlikely.

### `project_id` inequality as the Core-internal marker

Over the full retention window every `project_id = 'dial'` row is `event_kind = 'llm_call'` with
`number_request_messages ∈ [1, 2]` and an empty `chat_id`, and no trace carries more than one such root. The
earlier conclusion that only a size heuristic was available was wrong: the two-message shape is a *consequence*
of the signal, and the signal is the project.

The predicate is relative — `root.project_id != <the conversation's project>` — so it needs no hard-coded
name, and it degrades correctly: in the router form both rows share the project, so nothing is marked, which
is right because there is no service call in that trace.

It ships with the two-card presentation because the two are load-bearing on each other. A trace's figures
include its Core-internal calls, so the trace total exceeds the client card's chain total — $0.0291008
against $0.02895 on `ab6e92ac`, the $0.0001508 difference being the title-generation call. Unmarked that gap
reads as an arithmetic fault.

### Exact rating attribution, no time fallback

`turns_rollup` carries `response_ids`, and the figures query can resolve the same set live via
`group_uniq_array(response_id)`. `response_ratings` is grained by `response_id`, so the join is exact.

The existing heuristic — a rating belongs to the last trace that had started when it was submitted — is
evaluated over the traces loaded so far, so under paging a rating after the last loaded trace attaches to that
trace and then *moves* when the next page arrives. A figure that changes because the reader scrolled is worse
than an absent one, so an unmatched rating goes unplaced. It is not lost: the feedback panel's figures come
from a conversation-scoped aggregate, not from what the listing attributed.

### The transcript's body read moves; the switch's gating does not

`getConversationTranscript` resolves `ColumnsUnavailable` from a **cached entity-schema read** and returns
before issuing any body query (`actions.ts:498–509`). So "can this caller read bodies at all" is a schema fact
available at page open, and only the body read needs to move behind the switch.

An earlier draft made the Chat option optimistically enabled, on the assumption that availability could not be
known before the transcript loaded. That was simply wrong, and it would have traded an accurate
disabled-with-reason control for a false affordance. `ConversationViewSwitch` is therefore unchanged, and the
split is stated in the spec as: **gating up front (a schema fact), content states inside (data facts —
expired, not reconstructable, never recorded, failed).**

This also dissolves the "coupled decision" between card text and gating semantics. They are independent: cards
drop body-derived text so the listing needs no body read, and the body read moves so a failure is local. The
gating never depended on either.

### Each view fetches what it displays

`ConversationTimeline` looks a turn up by `trace_id` to render each answer's footer figures, ratings and
open-trace control (`ConversationTimeline.tsx:187`). That worked while `turns` was loaded whole; under a paged
listing it does not — a message whose trace lies beyond the loaded pages would lose its figures, so which
answers were complete would depend on how far the reader had scrolled the *other* view.

The Chat view therefore resolves figures for the traces **its own transcript covers**, reusing the figures
builder with the transcript's trace ids. The transcript is already bounded to at most 200 entry hops and every
message carries its `trace_id`, so the id list is in hand and the query shape is unchanged.

*Alternatives considered:* fetching per-message figures lazily as messages scroll into view — rejected, it
contradicts the decision to do one load behind a spinner rather than many small reads in a scrollable
transcript. Dropping the footers' figures — rejected, it removes information a reader has today for no gain.
Shipping the coupling as a known regression — rejected, its visibility would depend on scroll position in a
different view, which is the silent-degradation class this design exists to remove.

Overlapping reads between the two views are accepted; no shared cache is built for it now.

The invariant applies at this second call site too: trace ids plus a window padded from their own bounds, no
chat id, no project. A narrower filter here would reintroduce every deleted correction inside the Chat view
instead of the listing, so the scope assertion covers both call sites.

### The spans query loses its `chat_id` predicate

Pulled in from the drawer's own change because the listing cannot ship correct without it. `buildConversation
SpansQuery` filters `chat_id AND trace_id`; the figures query does not. Measured on `7eb599a4`, the card
states two hops while the header-scoped read returns one — and the root the card describes is absent from its
own span tree. Licensed by the same evidence as dropping `chat_id` from the figures query: no trace carries
two distinct non-empty `chat_id`s.

## Risks / Trade-offs

**The paging query's scan grows with the conversation's calendar span** → It is the query that discovers the
page, so it cannot be page-bounded; its window is the conversation's own. On a long-running conversation in a
large tenant that is a wide partition range per page fetch. Mitigated by `project_id` + the day range, and
bounded in practice by conversations rarely exceeding one page (191 traces observed at the maximum). Keyset
paging is the fix and is deferred deliberately, above.

**The Chat view's figures read is conversation-wide** → Its window comes from the transcript's entry hops,
which span the whole conversation, so on a long-running one it reads a partition per day of that
conversation's life with no `chat_id` and no `project_id`. That is the same cost this design rejected for the
listing, accepted here because the transcript itself is already a conversation-wide read bounded at 200 entry
hops — the figures ride along with a read whose scope was never per-page. If the transcript is ever paged,
this window has to be paged with it.

**A guard trips in production** → Guards fail loudly by design, which means a data shape nobody has seen can
surface as a fault rather than a wrong number. That is the intended trade: the alternative is a silently
mis-attributed trace. Each guard's message names the property and the trace, so the finding is actionable.

**The card cap can make a trace's totals exceed the cards on screen** → The trace's figures are not bounded by
the cap. Disclosed rather than hidden ("N further calls in this trace"), per the project's no-silent-caps rule.
Measured fan-in is one Core-internal root per trace, so this is a guard against the unlabelled batch shape —
one trace observed with 93 roots, all unlabelled and therefore never listed — not against chat traffic.

**`turn_count` in the header can disagree with the card count** → `conversations_rollup.turn_count` is
`count(DISTINCT trace_id)` over labelled rows, which is the same population the listing groups by, so they
agree for single-root traces. They can differ by rollup staleness (~660 s), and by design where a trace
renders more than one card. The header's existing rule — the count MUST NOT be derived from the loaded list —
is unchanged and still correct.

**Removing `chat_id` from the spans query widens the drawer's read** → It now returns the trace's Core-internal
rows too. That is the point, and it cannot draw in another conversation: no trace carries two distinct
non-empty `chat_id`s. `trace_id` still prunes nothing, so the drawer's cost is unchanged in kind.

## Migration Plan

Three PRs, in order; each is independently shippable and leaves the view coherent.

**The `turns` read stays alive through PRs 1 and 2, feeding the chat view alone.** The chat view's answer
footers look a turn up by `trace_id`, so deleting the turns path in PR 1 would strand them for two PRs.
Keeping it until its last consumer is replaced is what makes each PR shippable; the deletion is PR 3's final
step.

1. **Data layer plus card fields.** The three builders, the `chat_id` removal from the spans query, the paged
   action, and cards reading their own rows. The listing still renders flat — one card per trace — because
   every trace in chat traffic has one client root; the grouping affordance arrives in PR 2. The chat view is
   untouched and still reads `turns`.
2. **Grouping and the Core-internal marker.** Trace-as-group with the collapse rule, the marker, the card cap
   with its disclosure, and the five guards. These ship together because the marker is what makes the second
   card's effect on the trace total legible.
3. **Chat view self-sufficient, then its load timing, then the deletion.** The Chat view gains its own figures
   read and its footers move to the trace-group model; the body read moves behind the switch while the schema
   probe stays on page open; and the turns path is deleted once nothing reads it.

No data migration and no backend change. Rollback is per PR; the `turns` entity is untouched on the service
side, so reverting PR 1 restores the previous listing without any state to undo.
