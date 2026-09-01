## Why

A hop that belongs to no conversation cannot be read anywhere. The hop inspector built in
`add-hop-request-response-inspector` is reached only from a conversation's trace, and the trace is scoped by
`trace_id` — so a hop that is the **root of its own trace**, with no conversation behind it, has no path to a
detail view at all.

`conversation-trace-span-rows` closed the neighbouring half of this: `route` hops that sit *inside* a turn now
render in the span tree and open in the inspector like any other hop. What it did not close, and cannot, is
the other shape. Measured against the ADAS dev instance:

- **Route calls that are background work** — a channel-ingest route, a scheduler's resume route — record
  `core_parent_span_id` as null and stand alone in their own trace. Scoping the trace read by `trace_id` is
  precisely what keeps them out of a conversation's view, correctly: they are not part of a turn.
- **Non-conversational proxy routes** carry no `chat_id`, no `client_session_id`, and
  `client_session_source = 'none'`. They have no session key in any column, so no conversation-scoped view can
  ever list them.

The Usage Log already lists these rows. It has no detail view, so the inspector's panels cannot be reached
from it — and it is the only surface that can reach them, because it needs no conversation id and no parent
span: the row itself is the selection.

**A note on an earlier reading.** This proposal previously argued from the fact that route hops carried an
empty `chat_id`, and inferred from it that they were never part of a conversation. The measurement was right
and the inference was not: `chat_id` is unpopulated on whole classes of in-turn hops — one measured 18-span
turn carries an empty conversation id on **every** row — so its absence says nothing about membership. What
separates the two populations is the trace: an in-turn hop has a parent and siblings inside a turn's trace, a
background hop is alone in its own. That is the distinction this change now rests on.

## What Changes

1. **A Usage Log detail panel that renders a hop the way the trace rail does.** The existing components are
   reusable — `HopInspector` takes a hop row, not a tree node — so the work is a detail surface for the Usage
   Log, not a second inspector.
2. **A Core-side ticket: propagate the parent span and the conversation id into route calls.** Propagation
   began on 31 August 2026 (369 route hops carrying 215 parent spans and 10 conversation ids, all from one
   retrieval deployment's document-search route) and is not yet consistent across paths. Consistent
   propagation is what would let a reader find an in-turn route hop from its conversation every time rather
   than most of the time; it is not a prerequisite for either half of the frontend work.

**The Core ticket is not filed.** Filing it means posting to `epam/ai-dial-core`, which needs explicit
authorization — ask before creating it, and record the issue number here once it exists.

## Impact

Frontend: a detail route or drawer under `src/components/UsageLog/`, reusing
`Analytics/ConversationsTrace/Detail/Inspector/`. No new backend query shape — the Usage Log already reads the
entity the inspector's actions read.

## Non-goals

- **Admitting in-turn route hops to the conversation span tree.** Done by `conversation-trace-span-rows`,
  which removed the span tree's route exclusion along with the reasoning quoted above.
- **Making a non-conversational hop reachable from a conversation.** It is not part of a turn, and a view
  keyed by conversation is right to omit it. The Usage Log is the surface that answers for it.
