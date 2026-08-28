## Why

The conversation detail view derives its listing from the `turns` rollup, whose population is
`length(chat_id) > 0`. Core writes `X-CONVERSATION-ID` per request, so the header routinely lands on a child
row while the trace's root span carries none — the normal shape for agent clients, not corrupt data. Every
figure the rollup states for such a trace therefore omits the root: the hop count is short, the token and
price sums exclude the call the user actually made, and the root's own status, endpoint and message count are
absent entirely. The listing reads as a partial or empty account of the conversation for a large share of
traffic.

The rollup also cannot be fixed in place. It defines a turn as a trace and states one set of sums per trace,
so a listing built on it can never describe *a client call* — which is what an operator opens this page to
see. Rebuilding the listing on the live hop log lets a card describe one call, read from that call's own row,
while trace-level figures stay trace-level.

## What Changes

- **BREAKING** — `buildConversationTurnsQuery` and the `turns` entity are removed from the conversation
  detail path. The listing is rebuilt on three live queries over `dial_usage_log`.
- The listing becomes **trace-as-group, root-as-card**. A card is a root span
  (`core_parent_span_id IS NULL`); trace-level figures attach to the group, card-level figures come from the
  root's own row. Single-root traces — the overwhelming majority — collapse group and card into one row.
- A trace's Core-internal calls (title generation and similar) render as their own cards, marked
  Core-internal by `project_id != <the conversation's project>`. This supersedes the earlier finding that no
  reliable signal existed: the signal is categorical, not a size heuristic.
- Cards carry **no body-derived content**. Titles come from `deployment`, falling back to `request_uri`.
  This is what severs the listing's dependency on the transcript.
- Paging replaces the 200-row ceiling: page size 50, appended on scroll, offset paging ascending on
  `(min(request_time), trace_id)`. The trace listing becomes the default view.
- Ratings attribution moves from a time-window heuristic to exact per-trace attribution via `response_id`.
  The heuristic is not stable under paging.
- The chat view's transcript **body read** moves to the switch rather than page open, so a body-read failure
  no longer blanks the page. The cheap cached schema probe that decides whether this caller can read bodies at
  all stays on page open, so the Chat option keeps its accurate disabled-with-reason state.
- The `chat_id` predicate is removed from `buildConversationSpansQuery`, without which the span drawer
  contradicts the card that opens it.
- Five empirical invariants ship as guards that fail loudly, not as prose.

## Non-goals

- The span tree and hop drawer's own presentation, per-hop bodies, and orphan spans.
- Decoding Anthropic reply bodies and tool blocks.
- Deleting the transcript assembly code, or changing how the transcript is assembled or rendered. The chat
  view does become **self-sufficient** — it fetches its own transcript plus the figures for the traces that
  transcript covers — because reading figures from the listing's paged state would make a message's
  completeness depend on how far another view had been scrolled.
- Any ADAS-side work: no new pipeline, measure, or derived column. Everything here is expressible in the
  existing client query DSL.
- Keyset paging and a newest-first sort. Both are deliberately deferred, and the sort direction is recorded
  as a constraint precisely so it is not flipped as a cosmetic tweak.

## Capabilities

### New Capabilities

None. Analytics is one master spec; this change modifies it.

### Modified Capabilities

- `analytics`: replaces the requirement that the turn list comes from the `turns` rollup with a listing
  defined over the live hop log; redefines the listing's unit from a turn to a root span grouped by trace;
  adds the query-scoping invariant, the day-padding rule, the paging constraint, the Core-internal marker,
  and the disclosure states; moves the transcript's body read behind the view switch while leaving the
  switch's own gating intact; replaces time-window rating attribution with an exact join on response id, with
  no time fallback.

## Impact

**Data layer**
- `src/utils/analytics/conversations-queries.ts` — `buildConversationTurnsQuery` removed; three new builders
  added; `buildConversationSpansQuery` loses its `chat_id` predicate.
- `src/app/[lang]/conversations-trace/actions.ts` — `getConversationTurns` replaced by a paged action;
  `getConversationTranscript` becomes client-invoked rather than page-invoked.
- `src/constants/analytics/conversations-trace.ts` — `TURNS_ENTITY` and `CONVERSATION_TURN_LIMIT` retired;
  page size and root cap added.
- `src/models/analytics/conversations-trace.ts` — `ConversationTurnRow` / `TurnsField` retired; group and
  card models added. The retirement reaches the chat view: `ConversationTimeline` looks a turn up by
  `trace_id` to render each answer's footer figures, ratings and open-trace control, so it moves to the
  trace-group model and fetches its own figures.

**View layer**
- `Detail/ConversationTraceList.tsx` — rebuilt as a grouped, paging listing.
- `Detail/ConversationDetailBody.tsx` — default view flips to Trace; the transcript becomes client-fetched
  state. `ConversationViewSwitch.tsx` is unchanged.
- `Detail/ConversationDetailView.tsx`, `[id]/page.tsx` — the transcript leaves the page's server prefetch.
- `Detail/ConversationTimeline.tsx` — assistant footers read the trace-group model, resolved for the
  transcript's own traces rather than from the listing's loaded pages.
- `src/utils/analytics/conversation-detail-fields.ts` — `attributeRatingsToTurns` superseded.

**Shared surfaces**
- The `turns` entity stops being read by the frontend. Nothing else reads it, so no other view is affected.
- `ConversationTraceView` (the drawer) keeps its internals but now receives no `question` prop, since cards
  no longer carry transcript-derived text.
