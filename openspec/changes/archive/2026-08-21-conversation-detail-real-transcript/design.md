## Context

See `proposal.md` — Why. What matters for the approach:

**What exists.** `app/[lang]/conversations-trace/[id]/page.tsx` already reads the `conversations` entity
schema server-side, builds the detail query from what it reports, and fetches feedback and turns in parallel.
`ConversationDetailView` holds a one-way switch: `useConversationTrace` swaps `ConversationTimeline` for
`ConversationTraceView` when a turn's trace control fires. `buildConversationSpansQuery` reads
`dial_usage_log` filtered by `chat_id` + `trace_id`, and `buildSpanTree` walks parent→child from the row
order the query returned. `withEntitySchemaCache` is already keyed by caller id, so a FULL_ADMIN schema
cannot be served to a non-admin.

**Constraints the data imposes.** Every figure below was measured against a local ADAS carrying imported dev
data (614 310 deduplicated rows) and is recorded in the proposal and the spec delta; this document does not
re-derive them.

- `WHERE chat_id = …` hits a bloom-filter index. `WHERE event_kind = 'mcp'` without a chat predicate ran
  over 120 s on a two-core VM and took the service down. Every query added here filters by `chat_id` first.
- Bodies are large: 1.4 MB for one response, 405 KB for one request. They are also `sensitive` (schema
  omits them below FULL_ADMIN) and `heavy` (omitted from a wildcard projection, returned when named).
- The hop log partitions on the day of `request_time`. A chat predicate prunes no partition: a body read
  filtered only by `chat_id` and `trace_id` was rejected for exceeding the 2 GB query budget, and the same
  read with a bounded time predicate returned immediately.
- There is **no** streaming column. `"stream": true` lives inside the request body.
- `assembled_response` exists on the dev instance and **not** on an older one, where the mapping states the
  merged response is read at ingest as a deriver source and never persisted.
- `operation_duration_ms` is zero for every hop of the sampled trace and is ambiguous between "real
  sub-millisecond" and "not reported by this producer version".

## Goals / Non-Goals

**Goals**

- Keep the transcript's rendering identical to today's, so the diff in `ConversationTimeline` is the message
  source and the removed notice — not a re-layout.
- Put every body read, decode and assembly step in server-only code, reachable from one server action.
- Make the schema the single gate on the Chat view, with no role logic in the frontend.
- Keep the parsing and assembly rules in pure functions under `utils/analytics/`, unit-testable without a
  backend.

**Non-Goals** (design-level, beyond the proposal's)

- No streaming or incremental render of the transcript. The page is `force-dynamic` and already awaits its
  reads; a second loading mode for one region would be new machinery for a read that is index-backed.
- No caching of assembled transcripts. `withEntitySchemaCache` caches *shapes*; caching decoded message text
  would put `sensitive` content in a process-wide map keyed by something other than the caller.
- No client-side re-fetch of the transcript. It is resolved once, on the route.

## Decisions

### 1. Two independent pieces of state, at the two levels that actually depend on them

- **Which view is showing** (Chat or the trace list) lives in `ConversationDetailBody`, alongside the switch
  that changes it. Nothing above the body depends on the answer, so choosing a view re-renders the body and
  nothing else — the header is a sibling of the body, not a parent, so it cannot re-render for a change the
  body owns.
- **Which hop chain is open** stays in `ConversationDetailView` via `useConversationTrace`, because the header
  *does* depend on it: a trace states its own identity and its own figures, and the spec requires the
  conversation header to give way rather than stack.

Keeping them apart is the whole point. One shared `view` enum covering "chat | trace list | hop chain" would
have put the frequent, local change (the switch) at the same level as the rare, global one (opening a chain),
and every switch would re-render the page.

`ConversationDetailRail` is `memo`-wrapped: it sits inside the body and is identical beside both views, so
without it a switch would re-render three panels of resolved fields to produce the same output. Its props
come from the parent, which does not re-render on a switch, so they are referentially stable and the memo
actually holds.

- **Alternative — a route segment or search param** (`?view=trace`). Shareable and back-button-friendly, but
  the trace read is a client-side action today and the detail route already awaits three server reads; moving
  view selection into the URL means either re-running the route per switch or keeping the client fetch anyway
  and having two sources of truth for what is on screen. Rejected as more surface than the requirement asks
  for — the spec requires the switch not to navigate.
- **Alternative — one `view` enum in the parent, with the header memoized.** Cheaper to write, and the
  expensive children would still be spared. Rejected because it makes the correct behaviour depend on
  remembering to memoize every sibling, where the split makes it structural.

### 1b. The body stays mounted while a hop chain is open

The hop chain renders *beside* the body rather than instead of it, with the body hidden (`hidden` plus
`inert`, so it leaves both the layout and the tab order per `a11y.md`).

Unmounting it would be simpler, but the body owns the view state — so unmounting discards it, and closing a
hop chain reached from the trace list would drop the reader back onto the transcript. Returning someone to a
view they did not leave is worse than keeping a rendered subtree in the DOM, which costs nothing to keep: it
holds no subscriptions and issues no reads.

### 2. The Trace view lands on a list, not on a turn

Switching to Trace shows `ConversationTraceList` — one row per recorded turn, each opening that turn's hop
chain. It follows the selectable-row shape the span rail already used rather than AG Grid's: same interaction
(selectable rows that open a detail), same surface, and a row is a real `<button>`, so keyboard reachability
needs no extra wiring.

An earlier cut opened the conversation's first turn on switching, so the view always had a subject. Rejected
on reflection: the reader had not chosen a turn, and presenting the first one answers a question they did not
ask. The list makes the choice visible, and it is also where a turn's figures are comparable across turns —
which the hop chain, scoped to one turn, cannot show.

### 3. One server action returns the assembled transcript; nothing about bodies crosses to the client

`getConversationTranscript(chatId)` in `app/[lang]/conversations-trace/actions.ts` runs the whole pipeline —
schema check, entry-hop read, body read, decode, assemble — and returns
`ServerActionResponse<ConversationTranscript>` where the payload is decoded messages plus a state discriminant.
The route calls it in the same `Promise.all` wave as feedback and turns.

The alternative — returning rows and decoding in a client component — was rejected outright: it ships
megabytes of encrypted-at-rest content to the browser, which the spec forbids.

**Why an enum discriminant rather than an empty array.** The spec requires four absences plus the offered
and unavailable cases to be distinguishable, and an empty message list cannot distinguish them:

| State | Cause |
| --- | --- |
| `Available` | bodies decoded, messages present |
| `ColumnsUnavailable` | schema reports no usable body column — `sensitive`, or the instance predates it |
| `NotReconstructable` | the conversation has hops, but none of them is an entry hop |
| `Expired` | no hops at all **and** `last_request_time` older than the hop log's retention |
| `NoMessages` | no hops at all, within the retention window |
| `LoadFailed` | a query or the schema read failed |

Two of these are computed rather than reported, and each needs one cheap signal:

- **`NotReconstructable` vs `NoMessages`** — step 1 already reads the conversation's hops; the discriminant
  is whether it found hops with no entry hop among them, or no hops at all. So step 1 SHALL count the
  conversation's hops without the entry-hop predicate as well as with it. That is one extra aggregate on
  non-heavy columns, and it is what stops the view saying "no messages were recorded" about a conversation
  that recorded plenty.
- **`Expired` vs `NoMessages`** — the conversation's `last_request_time` against a one-year constant. That
  constant is a copy of a backend TTL and will drift if the TTL changes — see Risks.

### 4. `page.tsx` waits on the hop-log schema; the existing waves are unchanged

The route already fetches the `conversations` schema and `.catch()`es it so a failed schema read costs the
optional columns rather than the page. The hop-log schema read joins that same wave and follows the same
`.catch()` discipline, and only the transcript read waits on it. Feedback and turns still do not wait on
anything — the existing requirement that they stay parallel is untouched.

`getConversationTranscript` fetches the hop-log schema itself through `withEntitySchemaCache`, rather than the
route fetching it and passing the answer in. The gate then lives with the read it gates: a future second
caller cannot forget to check, and the cache makes the extra call free after the first.

### 5. Two-step body read, with the cheap step deciding what the expensive step names

- **Step 1** — `buildConversationEntryHopsQuery(chatId, limit)`: `trace_id`, `request_time`, `deployment`,
  `number_request_messages`, `request_body_bytes`, `response_body_bytes`. Filtered on `chat_id` and
  `core_parent_span_id IS NULL`, sorted by `request_time` ascending, bounded by `CONVERSATION_TURN_LIMIT` so
  the transcript and the turn list cannot disclose different lengths.
- **Step 1b** — `buildConversationHopCountQuery(chatId)`: a count over the conversation's hops with **no**
  entry-hop predicate, which is the only thing separating `NotReconstructable` from `NoMessages`. Runs
  concurrently with step 1; both name only non-heavy columns.
- **Step 2** — `buildConversationEntryBodiesQuery(chatId, hops, hasAssembled)`: the same chat filter narrowed
  by `trace_id IN (…)` **and** bounded by the recorded times of exactly those hops, naming `trace_id`,
  `request_body`, `response_body` and — only when `hasAssembled` — `assembled_response`. It names no streaming
  column, because none exists.

Step 1 exists to keep Step 2 honest: without it there is no way to know how many turns there are, and the
`2n − 1` shortcut cannot be evaluated. It also yields the byte sizes, which is what makes a future guard on
total body volume possible without another round trip.

`isNotNull` already exists in `query-build`; an `isNull` predicate is added beside it. The spec's insistence
on a null test rather than `= ''` is a real trap here — the column has 655 078 nulls and zero empty strings,
so the wrong predicate returns nothing and looks like an empty conversation.

**Step 2's time bound is what makes it affordable, and it comes from step 1 rather than from the rollup.**
The table partitions on the day of `request_time`, so a `chat_id` + `trace_id` filter prunes nothing and the
read was rejected at the 2 GB budget. Bounding by the conversation's own span would be weaker than it needs
to be: conversations run for weeks, and one observed conversation spans 27 daily partitions — enough to
exceed the budget again. Step 1 already returns each hop's `request_time`, so step 2 is bounded by the
earliest and latest of exactly the times it is fetching. Under the `2n − 1` shortcut that is a single
instant in a single partition.

**The bound is a `ge`/`le` pair, not `inValues`.** This is the one shape that looks equivalent and is not:
an `in` list over a timestamp compiles to `has([…], request_time)`, a function over the column, and
`EXPLAIN indexes=1` reports its partition condition as unconditionally `true` — 73 parts of 73 selected,
identical to no predicate at all. The equivalent range selects 2. A range also matches other entry hops
falling inside the window, which is why the `trace_id` list stays: it is there for correctness, not for cost,
since it prunes no partition either.

**The times are converted to epoch millis with `toMillis`.** The DSL accepts a `timestamp` value only as
millis, while a row carries `request_time` as an ISO-8601 string — `2026-08-18T11:33:17.216Z`. Sending that
through verbatim is rejected outright (`invalid long/timestamp literal`), which fails the whole body read.
`toMillis` already handles both an epoch scalar and an ISO string, and the column is `DateTime64(3)`, so the
round trip is lossless. An earlier draft of this design said the opposite — echo the scalar, keep `toMillis`
off this path — on the assumption that `request_time` comes back as epoch millis. It does not.

**`assembled_response` is projected through the existing optional-field mechanism**, not a bespoke check:
`OPTIONAL_USAGE_LOG_FIELDS` plus `availableSelectFields`, exactly as `OPTIONAL_DETAIL_SELECT_FIELDS` does for
the insight columns. This is the one gate that protects a *full administrator* — on an instance predating the
column, naming it unconditionally is a 400 on the whole query and the Chat view is simply broken, with no
permission that would fix it.

### 6. Assembly is one tail-overlap rule, not two client-shape branches

`assembleTranscript(entryHops, decodedBodies)` in a new `utils/analytics/conversation-transcript.ts`:

For each entry hop in time order, append its request body's messages after dropping the longest leading run
that already matches the tail of the assembled transcript, then append the decoded response as that turn's
assistant message, tagged with the hop's `trace_id`.

- **Alternative — branch on client shape** (monotonic message counts ⇒ full-history; otherwise incremental).
  Rejected: the measured application deployment reported `1, 3, 1, 1, …`, which is neither monotonic nor
  uniformly single-message, so the classifier would need its own heuristic and would be wrong on the mixed
  case. The overlap rule handles both without knowing which it is — a full-history client's leading run
  matches everything already assembled, an application deployment's single message matches nothing.
- The `2n − 1` shortcut is a **fetch** optimisation layered on top: it changes which rows Step 2 names, not
  the assembly rule, and the spec requires both paths to produce the same transcript. The unit test asserts
  exactly that — over the whole message, not only its text. Comparing only the content is what let a shortcut
  that collapsed every message onto the newest turn pass its tests: the words were right and the figures
  beneath them were the last turn's, eight times over.
- **The shortcut's test is `2k − 1` at every hop, not `2n − 1` at the last.** One body carries no turn of its
  own for the messages inside it, so the weaker test establishes that the content is all there and nothing
  about the boundaries. The exact sequence makes the attribution arithmetic rather than inference — indices
  `2i` and `2i + 1` are turn `i + 1` — and narrows when the shortcut applies, which is the right direction:
  failing it costs one wider query, and getting it wrong is invisible. A history that comes back shorter than
  the counts promised also falls back, so a body whose roles the decoder declined cannot shift the whole
  transcript by one.
- Messages carry `trace_id`, so `ConversationTimeline` binds an assistant message to its turn by trace id
  instead of the current positional `turns[assistantIndex]`. That is a correctness fix the two independently
  bounded reads make necessary, not a refactor.

### 7. Assistant text has a preferred source and a guaranteed fallback, both pure

`utils/analytics/conversation-bodies.ts`:

- `assistantTextOf(row)` — tries `assembled_response` first (`choices[0].message.content`), and falls back to
  `decodeResponseBody(row)` when it is absent, null, or not parseable as JSON. All 12 sampled entry hops had
  it populated and valid, and one sampled hop elsewhere had a value that was **not** JSON — so the fallback
  is reached by a live row today, not only by an old one.
- `decodeResponseBody(row)` — dispatches to `decodeStreamedChunks`, `decodeSingleCompletion` or
  `decodeJsonRpcStream`. A parse failure returns `null`, never a fragment and never the raw body; `null`
  becomes the view's placeholder.

**The dispatcher sniffs the body; it cannot read a flag.** There is no streaming column on the hop log — my
original design said otherwise and was wrong. `"stream": true` sits inside the *request* body, so keying the
response decode on it would make decoding a response depend on fetching and parsing a second column that may
be absent or withheld. The response states its own shape plainly: an SSE transcript begins with `data:`
frames, a single completion parses as one JSON object, and an MCP body carries JSON-RPC `event:` frames.
Sniffing is both simpler and more available than the flag would have been.

**The fallback is a first-class path, not an error path.** `assembled_response` is null for every row ingested
before the producer began writing it, and hop rows live a year — so a recently upgraded instance carries up to
a year of conversations for which the decoder is the *only* source of assistant text. It therefore gets the
same test depth as the preferred path, and `assistantTextOf` is tested on the fallback with the preferred
column both absent from the schema and present-but-unusable.

**Content shapes.** `messageTextOf(message)` handles a `content` that is a string or a list of content parts,
reducing a list to its text-bearing parts in order. A message with **no** `content` key is distinguished from
one with `''`: the former had its output elsewhere (tool calls), and conflating them would render a tool-call
turn as a blank bubble. `transcriptMessagesOf(requestBody)` filters to user and assistant roles and ignores a
top-level `system` field, so a system prompt cannot reach the transcript even if an entry hop carries one.

Placed in `utils/analytics/` rather than under `server/` because these are pure value→value functions with no
token, no fetch and no request context — `.claude/rules/utils.md` puts them in `utils/`. What must stay
server-only is the *action* that reads the rows, and it already is (`'use server'`).

Tool-call names are extracted here too, for the Trace view: a response whose content is empty or absent put
its output in `tool_calls`, and those names exist only in a body. This is the one place where the Trace view
depends on a body — and it is the reason the Trace view's enrichment is in the same change rather than a
later one.

### 7b. No fallback to a non-entry hop — the rejected recovery path

Two of five sampled conversations have hops under their `chat_id` but no entry hop. Their true entry hops
**do** exist: same `trace_id`, `core_parent_span_id` null, but `chat_id`, `event_kind` and `deployment` all
empty strings, so nothing finds them by conversation. They are reachable by `trace_id IN (…)` with no chat
predicate, and `trace_id` is bloom-indexed, so the query would be cheap.

**Rejected anyway**, and the rejection is recorded here so it is not re-derived as an easy win:

- The recovered body is a different API dialect — a top-level `system` field, `tools`, `thinking`, and
  content-part lists rather than strings. Its `assembled_response` was not JSON either.
- Every candidate fallback renders a system prompt as user text if the role filter or the dialect handling
  has one gap: the in-chat hops carry an explicit `system` message and a tool catalogue, and the recovered
  hop carries its system prompt *outside* the message list where a role filter does not see it at all.
- The failure is silent and the blast radius is a leaked proprietary prompt, which is the same class of harm
  the `sensitive` flag exists to prevent.
- The spec's `NotReconstructable` state exists so the view has something true to say instead, and the Trace
  view over those hops still works.

A future change may revisit this with its own investigation — starting with how widespread the blank-`chat_id`
shape actually is, which five conversations do not establish.

### 8. Sibling ordering goes inside `buildSpanTree`, not into the query's sort

**Superseded by 9e.** There is no tree left to order: the stream sorts the hops themselves by `request_time`,
and `buildSpanTree`, `childrenOf` and their spec were deleted once nothing rendered a tree. What survives from
this decision is the tie rule and the removal of the duration fields, both restated below. Kept for the
reasoning about ties, which still applies to the flat order.

`buildConversationSpansQuery` already sorts by `request_time` ascending, but `buildSpanTree` re-groups rows
by parent and walks depth-first, so the sibling order it produces is the order rows happened to arrive within
each parent group. Sorting each sibling group by `request_time` inside `childrenOf` makes the walk
deterministic and matches the spec.

Ties are left in their arrival order — a stable sort. All 25 measured ties were between siblings, never
between an ancestor and a descendant, so a tie means genuine concurrency and any stable order is honest.

`offsetMs` and `durationMs` are removed from `ConversationSpanNode`, and `traceTotalsOf` loses `latencyMs`.
`ConversationSpanNode` gains the absolute recorded time instead. Removing the fields rather than leaving them
unrendered is deliberate: a nullable `durationMs` on the node is an invitation to render it again later.

### 9. Handshake collapse is a display grouping computed after the tree, not a filter on it

**Superseded by 9e.** `collapseHandshakeRuns` and `MCP_SESSION_SETUP_METHODS`-driven grouping are gone. The
same 131-of-173 handshake volume is now handled by typing those hops `session` and letting the reader isolate
or ignore that category — no expandable group, no collapsed state to hold.

`collapseHandshakeRuns(nodes)` folds a maximal run of **consecutive siblings at one depth** whose
`mcp_method` is in `MCP_SESSION_SETUP_METHODS` into a single group node carrying the collapsed hops. A hop
with a `mcp_tool_call_name`, or any non-MCP hop, terminates a run.

- Consecutive-siblings-only, rather than "all setup hops under this parent", so collapsing never reorders
  anything or hides a tool call that sat between two handshakes.
- Computed after `buildSpanTree` so the tree stays the honest structure and collapse stays a rendering
  concern. A filter at query time would make the disclosed hop count disagree with the fetched one.
- Expanded state is local to `ConversationSpanList`. Collapsed by default: 131 of 173 MCP hops in the
  sampled trace were setup.

### 9b. A turn is titled by its question, derived from what is already loaded

The turn list titled every row `Turn N`, which identifies a turn without describing it — a reader scanning
eight turns for the one they care about had to open each. The title is now that turn's own question, with the
number and trace id demoted to the subtitle.

**Derived from the assembled transcript, not from a new read.** A turn's request body ends with the user's new
message, so the last user message a turn contributed *is* its question — and the transcript is already
fetched, already decoded and already attributed by trace id. `questionsByTurn` reduces the messages to a
`Map<trace_id, question>`, so both fetch paths are covered by one rule and the feature costs one pass over an
array already in memory.

Derived once in `ConversationDetailView` and passed to both consumers — the turn list and an open hop chain,
which is titled the same way. A reader who reached a chain from a row is looking at the same turn and should
see the same thing they clicked; one derivation is what makes that true by construction rather than by two
call sites agreeing.

- **Alternative — read `number_request_messages - 1` out of the newest body.** Rejected: it is the same answer
  by a longer route, and it works only on the single-row path. The last-user-message rule is one rule for both
  paths, and it does not need the message counts at all.
- Fallback is **per turn**, not per list: a turn with no question keeps its number while its neighbours keep
  their questions. That is what makes the list survive a conversation with no entry hop and a caller whose
  schema withheld the body columns — the figures come from the rollup and never depended on a body.

### 9c. A hop's texts are read when the hop is opened, one at a time

The hop detail said where a hop went and what it cost, but not what it did. It now states what the hop sent
and what came back — the last prompt and the response text for an `llm_call`, the JSON-RPC arguments and the
tool result for an `mcp` hop, and the requested tool names for a hop that answered with no text.

**On demand is not an optimisation here; it is the only viable shape.** Turn 8 of the sampled conversation
carries 99.26 MiB of request bodies and 16.67 MiB of responses across 384 hops, one hop reaching 4.00 MiB.
Reading those with the chain would ship a hundred megabytes to render rows the reader may never open. So the
read is filtered to one `core_span_id` and bounded by that hop's own instant — the same range rule as the
transcript read, and for the same reason, except that a single hop collapses it to one partition. Measured at
71–337 ms per hop.

- **Only the last message of a request is stated.** An inner agent-loop request carries a system prompt, a
  tool catalogue and the entire accumulated history. `lastRequestMessageOf` walks back to the last message
  with text and reads it through `transcriptMessagesOf`, so the transcript's role filter guards this path too
  — a third surface that could leak a proprietary prompt is a third surface that must be closed by the same
  rule rather than by a new one.
- **The request side splits on event kind; the response side does not.** The two kinds record structurally
  different requests, so rendering one as the other yields either a wall of JSON or nothing. Responses already
  state their own format, which `decodeResponseBody` sniffs — so an MCP hop that answered with a completion,
  or the reverse, still decodes.
- **One hop's answer is held, and only one.** Re-selecting the hop you just left re-reads nothing. A cache
  keyed by hop was rejected: a reader walking a 384-hop chain would accumulate the whole trace in memory,
  which is the cost this design exists to avoid. The held key is `chat:trace:span` rather than the span id,
  because a span id is unique within its trace and not across the table.
- The held key also settles the late-answer race: an answer whose key no longer matches is dropped, so an
  earlier hop's text can never appear under a later hop's heading.

### 9d. Which hops are worth opening is decided from the row, not from a fetch

`response_body_bytes` joins the span projection — a `long`, so it costs nothing — and `hopTextSuppressionOf`
answers three questions from columns the row already carries: did anything come back, was this session setup,
was this an embedding. On the sampled 384-hop turn that settles 284 hops before a request would be issued: 60
returned nothing, 116 were `initialize`/`notifications/initialized`/`tools/list`, 108 were embeddings. 57
`tools/call` and 43 `llm_call` remain. Verified in `query_log`: opening a handshake hop and an embedding hop
issued zero reads.

- **A deny-list, never an allow-list.** An unrecognised `mcp_method` or `event_kind` is shown. The asymmetry
  is deliberate: an empty panel is a puzzle a reader resolves by looking at it, while a hop that never offers
  its text is a fact they cannot discover — so in an observability tool the unrecognised case must fail
  towards showing. The consequence is that this list grows only by adding an observed reason, and a future
  event kind needs no change here to be readable.
- **Zero is tested explicitly, not for falsiness.** An absent `response_body_bytes` is an unknown size, and an
  unknown size is not a claim that nothing came back — so it falls through to shown, like any other
  unrecognised state.
- **A suppressed hop keeps its row.** Its timing, status and nesting are exactly as informative as any other
  hop's; only the text section goes, and it states which of the three reasons applies rather than rendering an
  empty panel. The three reasons are distinct because "returned nothing" and "was never text" are different
  things to learn about a hop.
- **The verdict outranks every other state in the panel**, including loading: it is known before a request
  exists, so there is nothing in flight to report and nothing that could have failed.
- **Deferred — surfacing `tools/list` once per trace.** The catalogue is byte-identical across every call in a
  trace, so a per-trace rendering would be the only honest shape for it. Not built: it needs a fetch path and
  a cache of its own for a payload no reader has yet asked to see, and `tools/list` is now suppressed, so
  nothing renders it 43 times either. The suppression reason is the natural place to add it if it is ever
  wanted.

### 9e. The chain is a typed event stream, not a tree

**Reversal of 9e as first designed.** That decision grouped hops into MCP bursts, folded embeddings into their
parents and collapsed repeated model calls — a nesting-and-collapsing answer to a chain of hundreds of rows. It
is replaced: the span tree is one root with hundreds of direct children and a second level only under a tool
call, so nesting bought almost nothing, while typing and filtering buy the ability to see what a turn consisted
of. `conversation-hop-groups.ts`, the burst and repeated-call entries and `ConversationSpanList` are gone.

`conversation-hop-stream.ts` derives one flat numbered stream. **An event is not a hop**: a model call emits a
reasoning marker, its answer, and one event per tool it requested, so 384 hops become 446 events.

- **Deriving the stream needs the model calls' response bodies, and this is the one place the "never bulk
  fetch" rule is narrowed.** Whether a call answered and which tools it asked for is recorded nowhere else. The
  read is confined to the model-call hops and capped at `STREAM_MODEL_BODY_LIMIT`: on the measured turn that is
  43 of 384 hops and 2.04 MiB of the trace's 16.67 MiB of responses, and only decoded text and tool names cross
  to the client. Past the cap, or with no response column in the schema, those rows are typed generically —
  "not read" rather than "empty", because the two are different facts.
- **A failed hop emits one error event instead of its normal events.** A failure buried among the rows of the
  work it was attempting is a failure the reader has to hunt for.
- **The tool-request gap is resolved by count per name, never by identity.** 85 requests against 57 results;
  the log carries nothing that pairs one to the other, so the surplus for a name is marked and no claim is made
  about which specific request went unanswered.
- **Line numbers are assigned over the whole stream before filtering.** A filtered view that renumbers its rows
  cannot tell you where in the turn you are, which is the one thing a filter takes away.
- **The frame is not a category, and shows only while the whole turn does.** It frames the turn rather than
  anything inside it, so padding a narrowed view with it answers the wrong question — asking for the tool calls
  should return tool calls. Its totals still come from the same rollup row the header and the turn list read.
- **One ghost button per category, isolating on click, all shown by default** — reversing first the two-preset
  switch and then the independent-switch set this shipped with in turn. Reading a turn is asking "show me the
  tool calls", which is one click when a control isolates and eight when each control only switches its own
  category off. Clicking the isolated category again releases it, so the same control narrows and restores.
- **Every category stays selectable, including ones the turn recorded none of.** Disabling them was wrong:
  "were there any errors" is a real question and *none* is a real answer, which an unpressable control cannot
  give. Isolating an empty category returns an empty list that says so.
- **The showing-of-total line counts the turn's own rows on both sides, and announces itself.** Counting the
  frame in the total but not in a narrowed selection mixed two denominators, so "5 of 448" compared unlike
  things; `rowCountOf` excludes the frame from both. It is the only feedback that a filter took effect, so it
  is a `role="status"` live region — the rows themselves change silently.
- **`hasFilteredRows` exists because the unfiltered stream always carries its frame.** `events.length` is never
  zero, so the guard that was supposed to say "this turn recorded no hops" could never fire, and such a turn
  rendered as a question above a totals line with nothing between them. Counting the turn's own rows covers
  both that case and an isolated category with nothing in it.
- **Superseded: the two-preset switch and the independent switches.** A preset pair could not isolate a single category, could not offer embeddings without also
  offering session noise, and started by hiding two thirds of the recorded rows on someone else's judgement.
  Per-category toggles are what the data already supports. The per-category counting helper written for the
  superseded design went with it: no surviving control shows a count.
- **A category names itself and carries no count.** Nine counts on nine controls is the same total stated nine
  times; the showing-of-total line says it once. A zero-count category stays visible and operable rather than
  greyed: isolating it answers "were there any errors" with an empty list that says so, which is the same
  information the number carried. The All control is not disabled while it is active either — `aria-pressed`
  states which filter is on, and disabling the active one drops it out of the tab order.
- **Both regions live in a labelled `role="group"`** — the filters and the row list. A filter's visible label is
  the same word its rows carry in the type column, by design, so nothing reading by accessible name can tell a
  filter from a row without the labels. That is not a testing detail: it is exactly what made the specs for each
  unable to address the other, and a screen reader has the same problem.

**Measured against the real trace**, spans and bodies read from ADAS and run through the derivation: 448 events
(446 + frame). SESSION 176, EMBEDDING 108, TOOL-CALL 85, TOOL-RESULT 57, unanswered 28, ERROR 0 — each matching
the figures the design was given. Three counts came out differently and the bodies are the reason: TEXT 16 and
EMPTY 0 against an expected 13 and 3, because all 43 model responses carry either text or tool calls and none
carry neither; and THINKING 4 against an expected 0, because four hops of this trace do record reasoning
tokens. Cross-tabulated: 16 text-only, 27 tools-only, 0 both, 0 neither.

- **A real defect surfaced here.** 9 of the 43 responses are streamed, and a streamed response carries no
  `message.tool_calls` at all — each chunk contributes a fragment under `delta.tool_calls`, keyed by slot. Two
  of the 85 tool requests lived only there, so reading `message` alone made a streamed call that asked for a
  tool look like a call that asked for nothing. `toolCallRequestsOf` now assembles from both shapes, which is
  what closed 83 to 85.

### 10. The Trace view states the turn's own figures, and claims no per-hop latency

**Every figure above the hop chain is the turn row the list already renders** — tokens, cost, hop count,
duration and status — rather than a sum over the hops that were read. Re-deriving them is wrong exactly when
a turn is big enough to be worth opening: the hop read stops at `CONVERSATION_SPAN_LIMIT`, so a measured
384-hop turn read 300 hops and summed to 700 106 tokens and $1.01 against the turn's own 3 667 333 and
$3.68. That is not a rounding disagreement; it is a different number with no meaning. Status comes from
`failed_hop_count` for the same reason — a failure past the bound would otherwise render the turn as OK.

Reading one source also removes the class of bug entirely: the list and the detail can no longer disagree,
because there is nothing left to disagree about.

The per-hop duration column still becomes the hop's absolute time, and the hop detail's offset row goes the
same way. That part of the original decision stands: no figure is derived from a single hop's
`operation_duration_ms`.

- **Reversed from the original decision, which rejected the rollup's `duration_ms`.** That rejection rested
  on two things the data does not support. It assumed the rollup's duration is a sum of
  `operation_duration_ms` — it is not; that sum is a *separate* column, `hop_duration_total_ms`. And it
  generalised "all 251 hops reported zero" from one trace to the dataset: the measured 384-hop turn reports
  1 160 204 ms across its hops, so a zero duration is a producer-version property of some traces rather than
  a property of the column. `duration_ms` measures 523 263 ms against a first-to-last span of 520 396 ms —
  the wall clock, closed by the final hop's own duration. It is the turn's real elapsed time, and it is what
  the list shows.
- **Alternative — keep the duration column and render the placeholder on zero.** Rejected: a real
  sub-millisecond hop would then be indistinguishable from an unreported one, which is the same ambiguity
  moved into the UI.

### 11. Accessibility

- The switch is a `DialSegmentedControl` (the pattern the Query Builder rail already uses for Builder /
  SQL / JSON). It renders a `tablist` with `aria-selected` on the current option and handles arrow/Home/End
  keys itself, and each `SegmentedControlOption` takes a `disabled` flag — so the "Chat disabled" state is
  the kit's, not a hand-rolled one. A disabled segment is not focusable and so cannot carry its own
  tooltip: the reason is rendered as visible text beside the switch, which reaches a screen reader and a
  pointer alike. A `title` attribute would reach neither reliably.
- A frame row is not a control at all. It carries the question and the turn's totals, so there is nothing to
  open: rendering it as a permanently `disabled` button advertised an unavailable control where none exists.
- Message text renders in the existing bubbles with `whitespace-pre-wrap`; recorded content can be long, so
  the transcript region keeps its own scroll container and code-like content wraps rather than using
  `break-all`. A hop's `execution_path` chain uses `DialEllipsisTooltip` when it truncates.
- Each trace-list row is a real `<button>`, so the list is keyboard-operable
  with no roving-tabindex machinery. Its trace id truncates through `DialEllipsisTooltip` rather than
  `break-all`.
- Every non-`Available` state is rendered by `DialNoDataContent`, matching the existing empty states, so each
  is a real heading plus description rather than a styled sentence. `NotReconstructable` in particular needs
  wording that does not read as an error, since nothing failed.

### 12. Corrections from the review pass

Findings from a code-and-quality review of the finished change, each verified before it was acted on.

- **An unrecorded message text is not a different text.** Assembling the transcript compared a resent message
  against the decoded one with `===`, and the only realistic drift is between an empty string and an absent
  `content` key: a turn that answered with tool calls alone decodes to no text, while the resent copy of that
  same message carries no `content` at all. One mismatch anywhere in the history found no overlap and
  re-appended the whole conversation under the later turn — the reader saw their first question twice, its
  duplicate answer carrying the later turn's tokens, cost and duration. The comparison now treats an
  unrecorded text on either side as a match, since a message we failed to decode is still that message.
- **Both body columns are optional, not just the assembled one.** The read gate accepts either
  `assembled_response` or `response_body`, so an instance persisting only the assembled column is a supported
  state — but the queries named `response_body` unconditionally, and one unknown field rejects the whole
  query. Both are now schema-gated, which is what the gate already claimed.
- **A hop the log records as returning nothing is empty, not unread.** Zero-byte model calls are excluded from
  the body derivation deliberately, so they arrived at the stream with no output and were typed generically —
  indistinguishable from a call past the byte budget, which 9e says must stay distinct. The size is recorded,
  so the emptiness is a known fact and is typed as such.
- **An enrichment must not sink the read it enriches.** `resolveModelOutputs` awaits a schema read that
  rethrows, inside the returned object literal, so a transient schema failure rejected `getConversationSpans`
  and the view reported that the trace could not be read while its spans were already in hand. It now cannot
  throw.
- **Entry hops that yield no message are not an empty conversation.** That combination returned `Available`
  with zero messages, which the timeline renders through its no-messages fallback — the mislabel
  `NotReconstructable` was added to prevent. It returns that state instead.
- **Four Tailwind classes named tokens the palette does not define** (`bg-stroke-primary`,
  `bg-stroke-secondary`, `bg-stroke-tertiary`, `bg-controls-bg-accent`): `stroke-*` names exist only under
  `borderColor`, and the controls key is `controls-accent`. Tailwind emits nothing for an unknown key, so five
  of eleven event types rendered no rail at all and the filter-bar divider was invisible. `eslint-plugin-tailwindcss`
  is registered with no rules enabled, so nothing warned. The maps moved to the constants module beside their
  siblings, on defined tokens.
- **The legend was removed rather than corrected.** It coloured `SpanCategory` while the rows are coloured by
  `HopEventType`, and the two taxonomies collide on the same tokens — it told the reader that teal meant
  *embedding* where the stream used teal for *text*, and named a `route` category the stream excludes. Every
  row states its type in words and the filter bar names all eleven, so the legend was redundant even before it
  was wrong.
- **One failure predicate.** `isFailedHop` counts a status of 400 or above; the detail panel checked only
  `success === false`, so a hop with an unset flag and a 500 rendered as a red error row whose detail said OK
  in green.
- **Land on a view that can be selected.** The detail opened on Chat unconditionally, so every caller below
  FULL_ADMIN landed on a segment that is simultaneously current and disabled — and a disabled segment is not
  focusable, leaving arrow-key navigation in the switch with no starting point.
- **Dead code carries interface drift.** `buildSpanTree` had no production caller left and constructed nodes
  with `depth` and `embeddingCount`, neither of which `ConversationSpanNode` still declares — invisible to the
  compiler because the literal was an inference source rather than a checked assignment. It, `childrenOf`, a
  duplicated `byStartTime`, `countEventsByType` and the write-only `HopEvent.suppression` are gone, along with
  the specs that were their only callers.
- **`MCP_EVENT_KIND` was declared three times and the copies had diverged**: the stream trimmed `event_kind`
  before comparing, the text decoder did not, so a stored `'mcp '` would be typed as an MCP call and then
  decoded as a model call. One constant, one trimming predicate (`isMcpCall`), one protocol-envelope
  predicate.
- **Test defects.** Two `getConversationSpans` tests were duplicated verbatim inside the
  `getConversationFeedback` describe, crediting that action with schema-gating it does not have; the
  entry-**bodies** read failing was uncovered (deleting its guard left the suite green while the view claimed
  the conversation recorded no messages); and two page tests asserted a failed transcript only by the rendered
  component's name, so swapping the fallback state passed.

**Not acted on, and why:**

- **The `2k-1` shortcut is defeated by a constant system message.** A full-history client that also sends a
  system prompt reports `2k`, so the shortcut never fires and every entry hop's body is fetched. Correct but
  expensive; a constant-offset test (`2k-1+c`) would restore it, and the attribution would then have to skip
  the leading offset. Left alone because the fallback is correct and the change is not, on this evidence,
  provably safe.
- **A model call's response body is read twice per selection** — once in bulk to derive the stream, again when
  its row is opened. Only the request side needs the second read.
- **The byte budget under-counts** by the size of `assembled_response`, which the query also names and
  `response_body_bytes` does not measure.
- **Focus is not moved when a hop chain opens or closes.** `hidden` + `inert` are correct, but no component
  takes focus, so a keyboard reader loses their place in both directions.

### 13. What the dev instance actually contains

Verified against the dev ADAS (1 996 235 hop rows, live to the minute), because the Chat view showed
"Transcript cannot be reconstructed" there for conversations that render fine locally.

Of 228 conversations with hops recorded in one recent two-day window, **112 have no entry hop at all** — and
every one of those 112 has a UUID-shaped `chat_id`, while all 116 nanoid-shaped ones do have entry hops. The
rootless conversations are agent-SDK and benchmark traffic: each hop names an unlogged parent span, one row per
trace, `number_request_messages` climbing 2, 4, 6 … 204, and the request body's first message is a 6.6 KB
system prompt (`x-anthropic-billing-header: … cc_entrypoint=sdk-cli`) followed by an agent prompt rather than
anything a person typed.

So the empty state is correct for them, and correct for the right reason: rendering those bodies as a chat
would put a system prompt where the user's first question belongs — the exact failure the entry-hop rule
exists to prevent. It is not a signal that the rule should be widened to treat an orphaned hop as an entry
hop. What the observation does argue for, as a follow-up rather than here, is that the conversation list gives
no hint which conversations have a transcript at all, and on this instance that is half of them.

## Risks / Trade-offs

- **Rendering verbatim prompts is not an engineering decision.** → Scoped so the answer is enforceable
  without touching this code: the Chat view appears exactly when the service puts the body columns in the
  caller's schema. If product or security says no, the fix is a catalog change, not a frontend change.
- **The one-year retention constant duplicates a backend TTL.** → It is used only to choose between two
  empty-state messages, never to decide whether to query. If the TTL changes, the worst outcome is the wrong
  empty-state wording, not a wrong transcript. The constant is defined once, next to the entity name, with
  the TTL it mirrors named in a comment.
- **A whole class of conversation gets no transcript.** Two of five sampled conversations have no entry hop
  and so render `NotReconstructable`. Five conversations are not a frequency estimate, and the real share is
  unmeasured — it could be most of an instance's traffic on some deployments. → Accepted deliberately: the
  alternative is rendering system prompts as user messages (see 7b). The state names the cause rather than
  implying the conversation was empty, and the Trace view over those hops is unaffected. If the share turns
  out to be large, the follow-up in 6b is the lever, not a relaxed entry-hop test.
- **A body read that does not prune partitions is rejected, not merely slow.** The 2 GB budget returns a 422,
  so getting the time bound wrong breaks the Chat view outright rather than making it sluggish. → The bound is
  derived from step 1's own rows, so it cannot drift from what step 2 fetches. A unit test asserts the bound
  is present, is a range, and is built from the fetched rows' times.
- **The bound has two failure modes that look nothing like a bad predicate.** Sending an ISO-8601 value
  where the DSL wants millis is rejected as an invalid literal, failing the whole body read; and an `in` list
  of the exact instants is accepted and prunes nothing, so the read is rejected at the budget instead.
  → The times go through `toMillis`, the predicate is a range, and unit tests pin both — the millis
  conversion from an ISO input, and the `ge`/`le` ops. Pinned rather than reviewed because the first failure
  reads as "no bodies recorded" and the second as "the service is slow".
- **`assembled_response` may be absent for reasons that look identical.** A missing column means "no rights"
  on one instance and "no upgrade" on another, and both surface as a schema without the field. → Both are
  handled by the same mechanism, and the Chat view only needs *one* response column, so the version case
  degrades to the decoder rather than to no view. The `sensitive` case removes all three columns at once,
  which is distinguishable because `request_body` goes with them.
- **A turn with 1226 hops.** → `CONVERSATION_SPAN_LIMIT` stays at 300 and the partial disclosure already
  exists; handshake collapse makes the fetched 300 far more readable. Virtualisation is deliberately not
  added — with collapse in place the rendered row count for the sampled trace drops from 251 to well under
  100, and adding a virtualiser would trade a measured problem for an unmeasured one.
- **A conversation with 200 entry hops carrying large bodies.** → Step 1 returns the byte sizes before any
  body is named, so the volume is known before it is fetched. This change does not add a cap; it makes one
  possible without a schema change. Flagged rather than solved, since no measured conversation needed it.
- **`number_request_messages` may be absent on an older producer**, which breaks the `2n − 1` shortcut. →
  The shortcut is an optimisation with a defined fallback: a missing count fails the test, and every entry
  hop's bodies are fetched. The general assembly rule needs no message count at all.
- **The three body formats are what one instance writes.** A fourth shape, or a variation in the SSE framing,
  would decode to nothing. → It decodes to `null`, which renders the placeholder for that one message rather
  than failing the page. The spec forbids rendering a fragment precisely so this failure stays local, and
  where `assembled_response` is available it covers the streamed case without the decoder being involved.
- **`ConversationSpanNode` loses two fields and `traceTotalsOf` loses one**, which touches
  `ConversationSpanDetail`, `ConversationSpanList`, `ConversationTraceView` and their existing specs. →
  Mechanical, and the existing `conversation-spans.spec.ts` and `ConversationTraceView.spec.tsx` cover the
  surface; the task list keeps that removal in its own step so the transcript work is not entangled with it.

## Migration Plan

No data migration and no config change. Deployment order does not matter: every field this change names is
either already on the entity or projected only when the fetched schema reports it, so an instance that lacks
one degrades — to the decoder for `assembled_response`, or to "Chat not offered" if no body column is
readable — rather than failing.

The one deployment-shaped risk is the reverse of the usual: this frontend is likely to meet ADAS instances
*older* than the dev one it was built against. That is exactly what the optional-field projection is for, and
it is worth verifying the Chat view against an instance without `assembled_response` before release.

Rollback is a revert. The only removed asset is `mocks/analytics/conversation-transcript.ts`, which nothing
else imports.
