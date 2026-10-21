## Why

The conversation detail page renders **fabricated** message text. `mockConversationTranscript` picks a
canned exchange by hashing the chat id, and a notice tells the reader the words are samples while the
figures beside them are real. That was the right call when the message bodies were believed to be
unreachable at an acceptable cost — but an investigation against a local ADAS carrying imported dev data
(614 310 deduplicated `dial_usage_log` rows) established that they are reachable, cheaply, by a query that
filters by `chat_id` and bounds the partitions it reads. The page's whole reason to exist is to show what a
conversation was, and today it shows a placeholder.

The Trace view has the opposite problem: its data is real but under-projected. `mcp_method`,
`mcp_tool_call_name` and `execution_path` already exist on the entity and are not selected, so an MCP hop
is labelled by its server name and the tool it called is invisible — and in the sampled trace three
quarters of MCP hops are session handshake, which the view renders row by row.

## What Changes

- **Replace the mocked transcript with the real conversation.** The Chat view keeps today's presentation
  exactly — user/assistant bubbles, the assistant footer's real token/cost/hop/duration figures, the
  per-turn trace control, the rating counts — and only the message text changes from fabricated to
  recorded. The sample-content notice is removed with the mock. No step folding, no inline machinery: the
  hop chain stays in the Trace view where it already lives.
- **Assemble the transcript from every entry hop, not one row.** A hop with `core_parent_span_id IS NULL`
  is what the client sent to DIAL, and its `request_body.messages` carries the user-visible exchange with
  no system prompt. The "last entry hop holds the whole chat" shortcut holds only for clients that resend
  full history; a DIAL **application** deployment keeps conversation state server-side and sends one
  message per turn (measured: `1, 3, 1, 1, 1, 1, 1, 1, 3, 5, 5` across an 11-turn conversation).
- **Treat a conversation with no entry hop as a first-class outcome, not an edge case.** A conversation can
  record hops under its `chat_id` and have none that entered DIAL, because the entering hop was logged with
  no `chat_id`. Sampled conversations show this for every turn they have. What *is* attributed to them is
  inner agent-loop calls carrying a system prompt, a tool catalogue and content-part message lists — so there
  is no user-visible transcript to show, and the view must say so rather than reach for one. A dedicated
  "cannot be reconstructed" state is added alongside aged-out, never-recorded and failed, giving four
  distinguishable absences.
- **Read the assistant's text from `assembled_response` where the instance has it, decoding `response_body`
  otherwise.** The assembled column holds the producer's merged answer — already reassembled, read at
  `choices[0].message.content` — and was populated and valid on all 12 entry hops sampled. It is **not** a
  substitute for the decoder: it is null for every row ingested before the producer began writing it, and
  hops live a year, so a recently upgraded instance carries up to a year of conversations where decoding the
  raw body is the only path. The fallback decodes three formats — streamed SSE chunks, a single JSON object,
  and JSON-RPC over SSE for MCP — choosing between them by the body's own shape, since the hop log has **no**
  streaming column. Bodies never reach the browser: one sampled `response_body` was 1.4 MB.
- **Gate every body column on the fetched `dial_usage_log` schema, for two independent reasons.** A column
  can be missing because it is `sensitive` (the service hides it from anyone below FULL_ADMIN) or because the
  instance predates it. `assembled_response` is a later addition that older instances do not persist at all —
  one local instance has no such column, and its own mapping states the merged response is read at ingest and
  never stored — so it is missing for **every** caller there, full administrators included. Since the service
  rejects the whole query for one unknown field, `assembled_response` is named only when the schema reports
  it, through the same optional-field mechanism the insight columns already use. The Chat view is offered when
  the schema reports `request_body` plus at least one response column. **This change builds no access gate of
  its own** — the backend's column-level access control is the gate.
- **Add a Chat/Trace toggle** on the detail view, replacing the current one-way "open trace" navigation
  as the way to move between the two. The existing per-turn control still opens a specific turn.
- **Enrich the Trace view**: project `mcp_method`, `mcp_tool_call_name` and `execution_path`; label an MCP
  hop by the tool it called; render `execution_path` as the routing chain it already is; collapse runs of
  MCP handshake methods (`initialize`, `notifications/initialized`, `tools/list` were 131 of 173 MCP hops
  in the sampled trace) into one expandable row.
- **Order siblings by `request_time` inside `buildSpanTree`.** Measured over a 251-hop trace: no child
  starts before its parent, and all 25 tied timestamps are between siblings — so depth-first with
  siblings in time order is honest. Subtrees interleave, so every row states its absolute time and no
  subtree is presented as a contiguous time block.
- **Add the retention empty state.** `dial_usage_log` has a one-year row-level TTL and the `conversations`
  rollup has none, so a conversation older than a year keeps its list row and loses its transcript. That is
  one of the four absences above, and an absence rather than an error.
- **BREAKING (spec-level, not API):** the requirement that the view MUST NOT read a body column is
  reversed for the detail route. It stays in force for the turn list and the list page.

## Non-goals

- **No duration rendering per hop.** All 251 hops of the sampled trace report
  `operation_duration_ms = 0`. A reported 0 is a real sub-millisecond operation on a current producer, but
  a core predating the field omits it and the non-nullable fallback stores 0 — so on that producer version
  zero is indistinguishable from "not reported". Ordering only: no duration bars, no concurrency
  rendering, no per-hop wall-clock claim. This is a producer-version issue, not one to fix here.
- **No hop-limit increase.** `CONVERSATION_SPAN_LIMIT` stays at 300 and `CONVERSATION_TURN_LIMIT` at 200.
  One observed turn had `hop_count = 1226`; the answer is collapsing and disclosure, not a bigger fetch.
- **No feature flag for the Chat view.** The schema is the gate.
- **No scan by attribute.** `WHERE event_kind = 'mcp'` without a chat filter took over 120 s on a two-core
  VM and knocked the service over. Every query this change adds filters by `chat_id` first.
- **No transcript search, export, or copy.** Rendering the recorded exchange is the whole scope.
- **No change to the conversations list page's data**, and no change to the `conversations.traces` projection
  — that field is `heavy` and works only because it is named explicitly. One presentational exception was
  taken: the list's empty state is offset by the header stack (`CONVERSATIONS_FLOATING_FILTER_HEIGHT` +
  `CONVERSATIONS_HEADER_STACK_HEIGHT`) so the overlay stops covering the filter inputs. No query, column or
  projection on that page changed.

## Open decision (not an engineering one)

Product and security must confirm that FULL_ADMIN may read **verbatim user prompts** in the admin
console. The backend has taken a position — AES-256-GCM-SIV at rest, the `sensitive` flag, an explicit
gating instruction in the DDL — but the console rendering the text is a separate call. Sampled bodies
contained an internal billing header, a CI runner path and a full proprietary system prompt, and
`user_hash` exists to pseudonymise the user, which rendering their prompts undoes in one step. This
change is scoped so the answer is enforceable without touching it: the Chat view appears only where the
service puts a readable body column in the caller's own schema, so revoking the rights withdraws the view
with no frontend change.

## Capabilities

### New Capabilities

None. Per the project convention, every Analytics requirement lives in the single master spec.

### Modified Capabilities

- `analytics`: replaces the requirement that conversation message content is sample data with one that
  reads the recorded transcript from entry hops; adds requirements for entry-hop transcript assembly, the
  assembled-response-then-raw-body decode, the two independent reasons a body column is schema-gated, the
  server-side read with its partition bound, the Chat/Trace toggle, and the four distinguishable absences;
  replaces the trace requirement to cover MCP labelling, handshake collapse, sibling ordering and the removal
  of per-hop duration claims. The prohibition on naming a body column is narrowed to the turn list and the
  list page rather than dropped.

## Impact

**Affected code**

- `app/[lang]/conversations-trace/[id]/page.tsx` — drop `mockConversationTranscript`, fetch the transcript
- `app/[lang]/conversations-trace/actions.ts` — new action for entry hops and their bodies; extend the
  spans action
- `utils/analytics/conversations-queries.ts` — new entry-hop and body query builders, the second bounded by
  the exact recorded times of the rows it fetches; extend `buildConversationSpansQuery`
- `utils/analytics/` — new modules for body parsing (three formats) and transcript assembly
- `utils/analytics/conversation-spans.ts` — sibling ordering in `buildSpanTree`; handshake grouping
- `components/Analytics/ConversationsTrace/Detail/ConversationDetailView.tsx` — Chat/Trace toggle
- `components/Analytics/ConversationsTrace/Detail/ConversationTimeline.tsx` — real messages, notice removed
- `components/Analytics/ConversationsTrace/Detail/ConversationTraceView.tsx` and
  `ConversationSpanList.tsx` / `ConversationSpanDetail.tsx` — MCP labels, routing chain, collapse
- `models/analytics/conversations-trace.ts` — extend `UsageLogField` (including `assembled_response`; there
  is no streaming column to add); transcript models
- `constants/analytics/conversations-trace.ts` — handshake method set, entry-hop limits, the optional
  hop-log field list, the retention constant
- `constants/i18n.ts` and `locales/en.ts` — new keys; `DetailSampleMessages` retired
- `mocks/analytics/conversation-transcript.ts` — deleted

**Systems and dependencies**

- Reads three new columns of the existing `dial_usage_log` entity — `request_body`, `response_body` and,
  where present, `assembled_response` — through the existing `analyticsDataApi.executeAction` path. No new
  backend, no new env var, no new dependency.
- Body reads must prune partitions. The hop log partitions on the day of `request_time`, and a chat predicate
  alone prunes none: a measured body read filtered only by `chat_id` and `trace_id` was rejected for
  exceeding the service's two-gigabyte query budget, while the same read with a bounded time predicate
  returned immediately. One observed conversation spans 27 daily partitions, so the bound is taken from the
  exact recorded times of the rows being fetched rather than from the conversation's span.
- Uses the existing `withEntitySchemaCache`, which is already keyed by caller — so a FULL_ADMIN schema
  cannot be served to a non-admin.
- No other page reads `dial_usage_log` bodies, so nothing else is affected.
