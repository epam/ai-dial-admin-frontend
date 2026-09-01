## Why

The hop detail rail answers *where a hop went and what it cost*, and it is specified to withhold almost
everything about *what it actually sent*. The requirement "A hop's own request and response are read on
demand" states that only the **last** message of an `llm_call` request may be shown, only for a role the
transcript admits, and that the system prompt and the tool catalogue "must never reach the screen".

That rule was written for a reading view. Applied to a debugging view it removes the answer: a reader opening
a hop to work out *why this call behaved that way* is looking at exactly the system prompt, the sampling
parameters and the accumulated history the rule withholds. Today the panel shows three plain paragraphs —
Sent, Received, Tool calls — and a hop whose response was empty shows nothing at all, which is the case most
worth opening.

The data to answer the question is already fetched. `getConversationHopBodies` reads `request_body`,
`response_body` and `assembled_response` for the selected hop, and `hopTextsOf` reduces all three to two
strings and a list of names before anything crosses to the client.

Measured against the ADAS dev instance on 2026-08-28, the shape of that data settles most of the design:

- **The common case is small.** Of 32 639 `llm_call` hops in one day, 20 457 (63%) carry a request body
  under 10 KB and 29 656 (91%) carry ten messages or fewer. The distribution is bimodal — ordinary chats are
  small, agent loops are huge (21% are ≥100 KB, max observed 4 194 306 B), and little sits between.
- **The empty `event_kind` is not junk.** 168 137 hops table-wide record an empty kind; they are the
  Anthropic messages dialect (`/v1/messages`), and they carry the heaviest bodies in the system — averaging
  166.9 KB and 56.6 messages against 68.7 KB and 9.84 for `llm_call`. A second parser is required, chosen by
  endpoint. A **third** was built mid-change: `/v1/responses` traffic appeared on the instance after this
  proposal was written, and the fallback rendered nothing for all 472 sampled hops of it (tasks 13.1-13.11).
- **The response already has a cheap form.** `assembled_response` averages 1 511 characters against 52.8 KB
  for the raw body — roughly 35× smaller — and already carries `finish_reason`, the message, and the full
  usage breakdown.

Separately, the span list's category vocabulary conflates two axes: `SpanCategory` holds `Error` alongside
`Embedding`, `Retrieval`, `Route` and `Deployment`, so a failed model call reports its failure *instead of*
its kind, and the two names a reader sees for the two kinds they care about are `Retrieval` and `Deployment`
rather than MCP and LLM.

## What Changes

- **BREAKING (spec)**: the requirement "A hop's own request and response are read on demand" is replaced. The
  hop detail renders a structured **Request / Response inspector** instead of three paragraphs. Its scenario
  "An llm_call hop states its prompt, not its history" goes with it — the inspector states the history.
- **The system prompt is shown**, labelled `SYSTEM`, like any other message. No per-role setting: bodies are
  already behind the caller's schema grant, and a debugging view that hides the prompt cannot answer the
  question it exists for. The rule this reverses is one of three guarding the same outcome; the other two
  are unchanged (see below).
- **Tool *definitions* are still withheld.** The params line states a **count** (`tools 3`); the catalogue
  itself never renders, and `tools/list` stays in `MCP_PROTOCOL_METHODS`.
- **Request tab**: the request's message history — role filter chips with counts, and per message its role,
  position, byte size, and its text or the calls it made, each clamped with an expand affordance. (Revised
  mid-change: the first implementation described each message as a list of *properties* with a size per
  property. A reader opening a hop is reading a conversation, not an object graph, so the properties were
  replaced by the message history — task 10.5.)
- **Params line**: renders what the body carries. `temperature`, `max_tokens` and `tools` always render —
  a dimmed placeholder when absent, because absence is itself an answer — and `stream` renders alongside
  them. Presence is tested with `!= null`, never truthiness: `temperature: 0` occurs in real traffic.
- **Response tab**: two modes, **Assembled** (from `assembled_response`, falling back to decoding
  `response_body`) and **Raw**, fetched on demand and server-clamped.
- **Suppression becomes per-tab.** Today a hop whose `response_body_bytes` is zero is suppressed whole; its
  request is still worth reading, so only the Response tab states the absence. Embedding hops gain a
  dedicated view — model, dimension count and the probe text — instead of being suppressed.
- **Raw mode is the fallback for an unrecognised body shape**, so a dialect this frontend has not met
  degrades to readable JSON rather than to an empty panel.
- **Entitlement splits into two.** `transcriptBodyFields` already computes request-side and response-side
  readability and then conjoins them into one `isReadable`; the inspector consumes them separately, so a
  caller granted one column and not the other sees the tab they are entitled to.
- **Span categories split onto two axes.** Kind becomes LLM / MCP / Route / Embeddings / Other; failure
  becomes a status carried beside the kind rather than a member of the same enum. `Retrieval` and
  `Deployment` are renamed to MCP and LLM.
- `MessageRole` gains `System`, `Tool` and `Other` — the last so a role this frontend does not recognise is
  still rendered as a message under a neutral label rather than dropped from the history.

## Non-goals

- **The transcript role filter is untouched.** Its rationale is misattribution — a system prompt rendered
  "as though the user had typed" it in a reading view. The inspector labels every message with its role, so
  that rationale does not transfer. One rule changes, not both.
- **The payload rule is untouched.** "Hop bodies are read and decoded server-side and never sent to the
  browser" stays exactly as written; the inspector's tiered, clamped, on-demand reads are how it is honoured,
  not an exception to it.
- **No route-hop branch.** The span-tree requirement excludes `route` hops from the tree, so a route hop
  cannot be selected and a route rendering would be unreachable. The cause is missing data rather than a
  judgement that route hops are uninteresting: Core records nothing tying a route call to a conversation.
  See design.md §6 for the measurement and for what changed on 31 August 2026. `Route` survives as a
  category name only.
- **No frame counting.** Counting SSE frames needs a server-side pass over the raw body; whether a response
  was framed follows from the request's `stream` flag, which is free.
- **No embedding vector preview.** 96% of vectors arrive base64-encoded, so drawing one means decoding it
  first, for decoration.
- **No message threshold or collapsed-history summary.** Every message renders. Revisit only if the 2.7%
  tail with more than 100 messages proves unusable.
- **No MCP `session` field.** The hop log has no session column; `deployment` already carries the toolset.
- No change to the conversations list, the transcript, the trace listing, or any query in the listing path.

## Capabilities

### New Capabilities

None. This extends an existing capability.

### Modified Capabilities

- `analytics`: replaces "A hop's own request and response are read on demand" with the inspector's
  requirements — what the Request and Response tabs state, how bodies are fetched in tiers, how suppression
  is decided per tab, how the three LLM dialects are told apart, and how a missing grant is stated. Modifies
  "A turn renders as a span tree with its events as leaves" to split kind from failure status.

## Impact

**Components** — `Detail/ConversationHopTexts.tsx` is replaced by an inspector component set;
`Detail/ConversationSpanDetail.tsx` hosts it; `Detail/SpanCategoryBadge.tsx` is replaced by
`Detail/SpanKindBadge.tsx` and `Detail/ConversationEventStream.tsx` follows the category split.

**Utils** — `utils/analytics/conversation-hop-texts.ts` is replaced by a `utils/analytics/hop-inspector/`
folder of dialect-aware request and response parsers, one file per dialect plus the shared envelope, the
parameter reader, and the MCP and embedding fact builders; `utils/analytics/conversation-bodies.ts` gains
block-shaped content handling for the messages dialect and exports its SSE frame splitter for the
Responses decoder; `utils/analytics/conversation-spans.ts` splits `spanCategoryOf` into kind and status;
`utils/analytics/conversation-column-catalog.ts` stops conjoining the two body grants.

**Server** — `getConversationHopBodies` is replaced by six actions: one envelope per side (so a caller
entitled to one column reads only that one), one message in full, the clamped raw body, and the MCP and
embedding fact reads. The three-tier model is unchanged; the action count grew with the per-side split and
the two kind-specific panels. All parsing stays server-side.

**Queries** — the spans query adds `number_request_messages` and `request_body_bytes`, both plain columns
already available without reading a body. No body column is added to any listing query.

**Models / constants / i18n** — `MessageRole` gains `System`, `Tool` and `Other`; `SpanCategory` splits;
new `ConversationsTraceI18nKey` entries replace the `SpanSent` / `SpanReceived` / `SpanToolCalls` set.

**Risk** — the category split touches the span tree, its badge and its filter, which are covered by existing
specs and tests; those move with it in the same change.
