## Why

Route hops are recorded and cannot be read anywhere. The conversation trace excludes them from the span
tree, so the hop inspector built in `add-hop-request-response-inspector` can never be opened on one — see
that change's design.md §6.

The cause is missing data from Core rather than a judgement that route hops are uninteresting. Measured
2026-09-01 against the ADAS dev instance, `event_kind = 'route'`:

- **4 780 hops in August 2026.** Through 30 August, **0** carried a `chat_id` and 1 carried a
  `core_parent_span_id`. Without a conversation id a route hop is unreachable from the trace view; without a
  parent span it has nowhere to nest.
- **On 31 August this began to change**: 369 route hops carried 215 parent spans and 10 conversation ids,
  each of those 10 carrying both, all from a single RAG deployment's
  `/route/channel/documents/search`.

So there are two separable pieces of work, and one does not block the other.

## What Changes

1. **A Usage Log detail panel that renders a hop the way the trace rail does.** The Usage Log lists route
   hops today; it has no detail view, so the inspector's panels cannot be reached from it. This is the path
   that works with the data as it is: it needs no conversation id and no parent span, because the row itself
   is the selection. The existing components are reusable — `HopInspector` takes a hop row, not a tree node.
2. **A Core-side ticket: propagate the parent span and the conversation id into route calls.** Until Core
   records them, a route hop cannot be placed in a conversation at all. The 31 August data shows this is
   already being fixed for at least one path; the ticket is to make it consistent.

**The Core ticket is not filed.** Filing it means posting to `epam/ai-dial-core`, which needs explicit
authorization — ask before creating it, and record the issue number here once it exists.

## Impact

Frontend: a detail route or drawer under `src/components/UsageLog/`, reusing
`Analytics/ConversationsTrace/Detail/Inspector/`. No new backend query shape — the Usage Log already reads
the entity the inspector's actions read.

Out of scope: admitting route hops to the conversation span tree. That is a spec change to the span-tree
requirement and should wait until Core's propagation is consistent enough to rely on.
