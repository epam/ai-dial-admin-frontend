## Why

The trace drill-in names each row after the *content* of a hop's response instead of the *entity* that
produced it, so the tree cannot be read as an account of what the turn did.

The cause is one rule in the current requirement: *"A hop that emitted exactly one event SHALL render as a
single node, carrying the hop's own figures and that event's type and label."* Applied to real data it
overwrites the hop's identity with a fragment of its body. Measured on one 10-span trace rendered as 14
rows, **8 rows are labelled by their content rather than by the call**:

- One row reads as a **tool call named after a tool**. It is an `llm_call` span to a model deployment,
  4 008 tokens and a recorded cost, whose response carried a single `tool_calls` delta. It is not *before* the
  model call; it **is** the model call, and the reader cannot tell.
- The root row reads as **assistant text**. It is the `llm_call` to the conversation's own application
  deployment.
- Two sibling rows keep the label **model call** only because they emitted **two** events each (reasoning +
  text) and so took the other branch. The label depends on how many fragments a body happened to contain.

Two coordinate systems are mixed in one list. Span rows answer *"what did this turn ask DIAL to do"*;
event rows, decoded from response bodies, answer *"what did the agent do"*. Ordering, numbering and the
category axis are shared between them, so neither question gets a straight answer.

Three further readings of the same trace are wrong or unanswerable, all downstream of the same mixing:

- Rows 2–7 read `initialize`, `initialize`, `notifications/initialized`, `tools/list`, … and never name the
  MCP server. `spanLabelOf` prefers `mcp_method` over `deployment`, so two `initialize` rows in the same
  second are indistinguishable — they are two different MCP servers.
- The `no recorded result` chip reads as lost data. The requested tool is a built-in of the calling
  application, declared in that application's own `tools` array and not an MCP tool; it never crossed Core, so
  no hop exists. The trace has **zero** `tools/call` hops — both MCP toolsets were only handshaked and listed.
- The tree's own boundary is unstated. It can only show what crossed DIAL Core, which is why an application
  hop reports 0 tokens and why an application's internal tool has no result.

## What Changes

- **BREAKING (spec)**: the rule quoted above is removed. **A row is a span.** One span is one row, always —
  including a hop whose body decoded to exactly one fragment, and including each MCP protocol message.
- **Synthesized events leave the tree.** Assistant text, tool request, tool result, reasoning and empty stop
  being nodes. Every one is already rendered by the hop inspector built in
  `add-hop-request-response-inspector` (`HopMessageRow`, `HopToolCalls`, `HopMcpPanel`,
  `HopEmbeddingPanel`, `HopParamsLine`, `HopRawView`); the tree was showing a second, worse copy of it.
- **A row is titled by the deployment or toolset that did the work**, and an MCP row states its server *and*
  its phase (server name / `tools/list`).
- **A row's secondary line is chosen by the figures it has, not by its category.** A hop with tokens states
  tokens, messages and cost; a hop with neither tokens nor a `deployment_price` of its own states duration,
  chain cost and upstream host. Without this an application row prints `0 tok` and `—` and reads as broken —
  the root hop of the measured trace records `total_tokens: 0` and `deployment_price: null` while carrying a
  real `total_price`.
- **The category axis becomes the kind of call, taken from `event_kind`**: LLM, MCP, Embeddings, Route,
  Rating, and a generic kind. The event categories (*assistant text*, *tool request*, *tool result*,
  *reasoning*, *empty*, *session*) are removed along with the nodes they typed.
- **BREAKING (spec)**: `route` hops are admitted to the tree; the exclusion rule and its rationale are
  removed. See below.
- **Rating is a new kind**, matched by endpoint (`request_uri` ending `/rate`) — the same class of signal the
  requirement already sanctions for classifying an `event_kind`-less hop.
- **`no recorded result` states why**: the requested tool is internal to the calling application and never
  crossed Core, so no hop was recorded — not that a record was lost.

### Why `route` reverses

The current requirement excludes `route` hops on this rationale: *"All 5 611 of them carry an empty
`chat_id`: they are scheduler REST calls and never part of a conversation."* The measurement was right; the
inference was not. `chat_id` is unpopulated on whole classes of in-turn hops, so its absence says nothing
about whether a hop belongs to a turn.

One real agentic-application turn of 18 spans — model calls, embeddings, one `route` hop — carries
`chat_id = ''` on **every row in it**, not only the route one. Route hops *with* a populated `chat_id` also
exist: three were sampled, each an application routing to a retrieval deployment's document-search route.

The cost of the exclusion is structural, not cosmetic: in that turn the route hop is the **parent of two
embedding hops**, so dropping it hoists both to the top level and destroys the retrieval structure the reader
opened the trace to see. Genuinely background route calls — a channel-ingest route and a scheduler's resume
route were sampled — are roots of their **own** traces, so scoping the detail by `trace_id` already keeps them
out and no deny-list is needed.

`surface-route-hops-in-usage-log` currently records the opposite decision, deferring this until Core's
propagation is consistent. Its own measurement shows propagation beginning 31 August 2026 (369 route hops,
215 parent spans, 10 conversation ids), and the structural argument above does not depend on propagation at
all: the detail loads by `trace_id`, which route hops have always carried. That change's out-of-scope note is
corrected as part of this one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the requirement *"A turn renders as a span tree with its events as leaves"* is replaced by one
  in which a row is a span. Removed from it: the single-event collapse rule, the event category set, the
  `route` exclusion, and the derived-hop-category rule that existed only to give hop and event nodes a shared
  axis. Added: rows titled by entity, a figure-driven secondary line, the Rating kind, the reason behind an
  unrecorded tool result, and the statement that the tree's boundary is Core's boundary. The requirement
  *"A turn's trace opens in place, stating the turn's own figures"* is modified only where it names the
  stream's event rows; its routing-chain and detail-panel rules already hold unchanged.

## Impact

**Removed**: `utils/analytics/conversation-hop-stream.ts` (event synthesis), the `HopEventType` /
`HopEventSeed` / `HopNodeKind.Event` model, `conversation-model-outputs.ts` and the server-side response-body
read that fed it — the tree no longer needs model-call bodies to build itself, so the trace page stops
fetching and decoding them for that purpose. The inspector keeps reading a body on demand for the hop the
reader selected.

**Changed**: `conversation-span-tree.ts` (nodes come straight from spans), `conversation-spans.ts`
(`spanLabelOf`, `SpanKind`), `ConversationEventStream.tsx` (row layout, chips), `SpanKindBadge.tsx`,
`ConversationSpanDetail.tsx`, `constants/analytics/conversations-trace.ts`, `constants/i18n.ts`,
`locales/en.ts`, and the specs of all of the above.

**Not changed**: the trace listing, the hop inspector's panels, the query shapes in
`conversations-queries.ts` apart from dropping the model-output read, and `CONVERSATION_SPAN_LIMIT`.

**Also edited**: `openspec/changes/surface-route-hops-in-usage-log/proposal.md`, whose out-of-scope note this
change contradicts.

## Non-goals

- **Interceptors.** They are not spans: `event_kind` carries only `llm_call`, `embedding`, `mcp`, `route` and
  empty, and an interceptor's own span id has no row (five parent ids checked, none logged). Core is expected
  to log them later; because the category axis derives from `event_kind` and the deny-list rule requires an
  unrecognised kind to render generically rather than vanish, interceptor spans will appear in the tree the
  day Core emits them, before any labelling work here. The `request_uri` rewrite to
  `/openai/deployments/interceptor/…` (6 497 rows, 1 779 traces, 28 deployments in August) was investigated
  and deliberately not relied on: it is undocumented, and `execution_path` is empty on MCP hops.
- **Upstream as a row.** `response_upstream_uri` is a column, not a span — one proxy request is one span is
  one row. The upstream target has no row anywhere — the root app's upstream has zero spans over a
  month — no duration of its own, and no cost. Its host goes on the row's secondary line; the full URI
  stays in the detail panel, where it already is.
- **Splitting `reasoning_tokens` out in the detail panel.** It is part of `completion_tokens` — over a week,
  `prompt` 288 065 397 + `completion` 14 818 690 = `total` 302 884 087 exactly, with `reasoning` 11 461 483
  inside `completion` — so no quantity is lost when its event node goes, and a sub-component of `completion`
  does not warrant more prominence than `completion` itself.
- **Naming today's non-conversational `Other` endpoints.** The application-specific proxy routes that reach
  the generic kind carry no `chat_id`, no `client_session_id`, `client_session_source = 'none'`, and are
  single-span roots of their own
  traces, so they can never reach a conversation view. The generic kind is specified by behaviour — show the
  unrecognised rather than drop it — not by a list of examples.
- **Collapsing repeated siblings**, **grouping the MCP handshake into one row**, and **raising
  `CONVERSATION_SPAN_LIMIT`**. One span to one row is what keeps the turn's span count and the nodes'
  position numbering answerable against the data.
