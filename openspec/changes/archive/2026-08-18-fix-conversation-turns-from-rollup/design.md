## Context

See proposal.md — Why. The mechanics that shape the approach:

- `buildConversationDetailQuery` already projects **every** `ConversationsField`, so `turn_count` is on
  `ConversationDetailRow` at the header's fingertips. No query, action or model change is needed.
- `ConversationDetailView` computes `turns` once (server-fetched, capped at `CONVERSATION_TURN_LIMIT = 200`)
  and threads `turnCount={turns.length}` into the header. The same `turns` array is the transcript's spine —
  `page.tsx` builds sample messages from `turns.length` — so the list itself must keep its current length
  semantics.
- `ConversationTimeline` already renders a persistent `DialNotification` at the top of the scroll region for
  the sample-content notice, which is the natural neighbour for a truncation disclosure.
- `toNumber` in `src/utils/analytics/scalar.ts` is the existing coercion for the
  `number | string | null` wire shape these fields arrive in.

## Goals / Non-Goals

**Goals:**

- One turn figure in the UI, sourced from the rollup, with the 200-cap visible only where it is a stated
  bound.
- No new fetch, no new round trip, no widening of any query.

**Non-Goals:**

- Detecting or repairing rows rolled up under the old pipeline (see Risks).
- Changing `CONVERSATION_TURN_LIMIT`, or paging the turn list.
- Anything in the proposal's Non-goals list.

## Decisions

### The header reads `conversation.turn_count`; the `turnCount` prop is deleted

`ConversationDetailHeader` already receives the whole `ConversationDetailRow`. Re-sourcing the Turns slot from
`conversation.turn_count` and deleting the `turnCount` prop removes the only channel by which the bounded list
could reach the header, so the defect cannot regrow by someone re-wiring the prop.

*Alternative considered:* keep the prop and pass `conversation.turn_count` down from `ConversationDetailView`.
Rejected — it leaves a `turnCount: number` prop whose correct argument is non-obvious, which is exactly the
shape of the current bug.

### The disclosure sits at the top of the timeline, beside the sample notice

The spec requires it visible without interaction. A footer at the end of a 200-message scroll is not, so it
renders in the same region as the existing sample-content `DialNotification`, as its own notification rather
than appended to that one — "these messages are samples" and "this list is clipped" are unrelated claims, and
merging them makes a single sentence that is hard to translate and easy to misread as one caveat.

Both notices only render when messages render, which matches the spec: a conversation with no loaded turns
falls through to `DialNoDataContent` and has no list to disclose a bound for.

*Alternative considered:* put the disclosure in the header next to the turn count ("911 · showing 200").
Rejected — it re-introduces two numbers in the header, which is the thing this change removes.

### Truncation is derived, not flagged by the server action

`turns.length < toNumber(conversation.turn_count)` is the condition, evaluated where both values are already
in hand. The alternative — having `getConversationTurns` return an `isCapped` flag alongside the rows, as
`ConversationCandidateIds` does — would need the action to fetch `turn_count` it does not otherwise read.
`turns.length === CONVERSATION_TURN_LIMIT` is rejected as the condition: a conversation with exactly 200 turns
would falsely disclose a cut.

When `turn_count` is null or unparseable, no disclosure renders. A disclosure needs a real second number, and
"showing 200 of —" states nothing.

### The transcript keeps counting loaded turns

`mockConversationTranscript(chatId, turns.length)` is left alone, and the spec now says why. This is the one
place where "show the real number everywhere" must not be applied: the sample exchanges exist to carry each
turn's real figures, so generating 911 of them against 200 turns would produce 711 exchanges with nothing
real beside them.

### Copy: "requests" leaves the conversations vocabulary

`DetailRequests` and `DetailRequestsHint` are deleted from `ConversationsTraceI18nKey` and `en.ts` rather than
reworded — nothing renders them once the slot is gone, and a retained key invites reuse of a word this change
removes. The grid's `TurnsHint` ("Requests recorded for this conversation.") is reworded to name turns, since
the grid header already says Turns and the two currently disagree.

## Risks / Trade-offs

- **Rollups written under the old pipeline would render a false cut.** A stale row carrying `turn_count` =
  2,190 hops against 3 real turns discloses "showing 3 of 2,190" — alarming and wrong. The FE cannot
  distinguish the two semantics from the row, so there is no client-side mitigation. → **Confirm with the
  analytics service team that the conversations pipeline was backfilled** before this ships. If it was not,
  the disclosure is the only part of this change that needs holding back; re-sourcing the header count is
  correct either way, because the old figure was already wrong under both semantics.
- **`success_count` may not have moved with `turn_count`.** The Metadata rail states it as a bare count today,
  so a mismatch is currently invisible — but it becomes visible the moment anyone divides one by the other.
  → Out of scope here; flagged so the follow-up change verifies it rather than assuming.
- **Tests assert the removed figure.** `ConversationDetailHeader.spec.tsx` carries a comment explaining why
  930 is labelled requests, and `detail-page.spec.tsx` / `ConversationDetailRail.spec.tsx` / the
  `conversation-detail-*` util specs all fix `turn_count: 930` against 3 turns. Those fixtures encode the old
  semantics as intent, not incidentally. → Update the assertions and the comments together; a fixture left at
  930-against-3 will keep passing while documenting a model the product no longer has.

## Open Questions

None blocking. The backfill question above is a pre-ship confirmation, not a design unknown — it changes
nothing about the approach.
