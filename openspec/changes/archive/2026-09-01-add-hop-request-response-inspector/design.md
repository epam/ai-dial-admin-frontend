## Context

See `proposal.md` — Why. The constraints that actually shape the implementation:

- **The rail is 360px and scrolls** (`ConversationRailShell`). Everything below competes for that width with
  the span label, the metrics grid and the facts list already in `ConversationSpanDetail` — and, as it turned
  out, for the rail's *height* too: see §10.
- **The payload requirement stands unchanged.** Bodies are read and decoded server-side and never sent to the
  browser. This change does not amend it; it is the boundary every decision below is drawn against.
- **The data is bimodal.** 63% of model-call requests are under 10 KB and 91% carry ten messages or fewer,
  while 21% exceed 100 KB and one measured hop reached 4 194 306 B. A design tuned for either mode alone is
  wrong for the other.
- **Three dialects, and a fourth family named in code.** `MODEL_CALL_URI_MARKERS` lists
  `/chat/completions`, `/v1/messages`, `/v1/responses` and `/v1/completions`. Two were measured when this was
  written and both were parsed; `/v1/responses` appeared on the instance during the change and was parsed
  too (§3). `/v1/completions` still records zero hops and stays on the raw fallback. The endpoint set is
  open.
- **The existing read is already correct in shape.** `getConversationHopBodies` fetches one hop, bounded by
  its own instant, with a held key that settles the late-answer race. That machinery is kept; only what it
  returns changes.

## Goals / Non-Goals

**Goals:**

- Keep the browser's payload proportional to what the reader asked to see, not to what the hop recorded.
- One reading for every dialect, so a reader does not have to know which one they are looking at.
- Make absence legible: an absent parameter, a withheld column, a failed read and an empty body are four
  different statements.

**Non-Goals:**

- No client-side body parsing, at any tier. The client receives structured results only.
- No caching across hops. The held-key model holds one hop's answer; a reader walking a 384-hop chain must not
  accumulate the trace in memory.
- No new backend endpoint or query shape. Everything comes from the hop-log entity the view already reads.

## Decisions

### 1. Three fetch tiers, six server actions

`getConversationHopBodies` is replaced by six actions in the same file, each re-reading the one hop row —
filtered by session, trace and `core_span_id`, bounded by that hop's own instant, which is one partition and
measured at 71-337 ms.

The **three tiers** are the model and they did not change. The action *count* did, for two reasons that only
became visible while building:

| Tier | Action | Returns |
| --- | --- | --- |
| 1 (on hop select) | `getConversationHopRequest` | params, dialect, per-role counts, one entry per message: role, index, byte size, its text and the arguments of anything it called, each clamped |
| 1 (on Response tab) | `getConversationHopResponse` | the assembled answer, its reasoning summary, finish reason or status, tool-call names, with the clamp stated |
| 2 (on reveal) | `getConversationHopMessage` | one message in full - its text and its calls' arguments |
| 3 (on raw mode) | `getConversationHopRawBody` | the recorded body, clamped to a byte budget, with recorded and delivered sizes stated |
| 1 (MCP hop) | `getConversationHopMcp` | method, tool, toolset, arguments, result, each side by its own grant |
| 1 (embedding hop) | `getConversationHopEmbedding` | model, input count, dimension count, clamped probe text |

**Why one action per side.** A single envelope action would have to name both body columns to answer either
tab, which defeats §5: a caller entitled to the request column alone cannot be served by a read that also
selects the response column. Splitting them makes the entitlement enforceable at the query rather than in the
panel, and the response read is issued only when its tab is actually on screen.

**Why two kind-specific actions.** An MCP hop and an embedding hop state named facts, not a message list, so
routing them through the message envelope would mean an envelope with every field empty and the real answer
carried beside it.

**Alternative rejected — one action returning everything.** It is the whole body with extra steps: the 21%
tail would put megabytes on the wire to render a rail the reader may close.

**Alternative rejected — fetch once, hold the parsed body server-side.** Server actions here are stateless
and the app runs no server cache; introducing one for a debugging panel is a disproportionate amount of new
surface. Re-reading one partition is cheap enough that the simpler shape wins.

The cost is that a reader who reveals five messages issues five reads of the same row. Accepted: reveals are
deliberate, and the alternative is paying for the whole body on every hop selection instead.

**Tier 2 was reshaped mid-change.** It first returned one *property* of one message; it now returns the whole
message. The trade-off anticipated under Risks - "tier 2 can be widened to return the whole message rather
than one property" - was taken, though not for the reason given there: not because reads proved chatty, but
because the properties themselves were removed (§7, task 10.5). A message is the unit a reader asks for.

### 2. Sizes are of the recorded JSON, computed server-side

A message's size is the byte length of that message's recorded JSON — not the length of the rendered text.
There is no per-property size; the delta spec states that absence as a scenario, so it cannot be
reintroduced by accident. The reader is asking what made the request 166 KB, and that is the serialized
form the log actually stored. This also means a message whose text was clamped away entirely still carries an
honest size, which is what tier 1 exists to provide.

### 3. Dialect is chosen from the endpoint, and the enum is open

```
dialectOf(request_uri) → ChatCompletions | Messages | Responses | Unknown
```

`Unknown` is not a failure — it routes to the raw view, which is a complete answer for a dialect this
frontend has not met. `/v1/completions` lands there and records zero hops in two weeks, so no parser was
built for it (task 13.7). Widening the enum is a parser plus one `DIALECT_MARKERS` row, with no change to the
panel — which is what `Responses` cost when its traffic appeared (tasks 13.1-13.6).

A dialect that resolves to `Unknown` — or one whose parser finds no messages — is reported as the read state
`Unstructured`, which is *not* the same as a hop that recorded nothing: the panel states that it could not
structure the body and renders the body itself. An observability tool that answers an unrecognised shape with
an empty panel is a dead end, and the raw dump without the statement is a dump the reader cannot account for.

**Never infer the dialect from the body.** Beyond being slower, it is wrong: `"role":"system"` appears as
literal text in 43% of sampled messages-dialect bodies that carry no system role at all — it is quoted
transcripts and tool results. Roles and shapes come from parsed structure or not at all — and a role that
parses to something this frontend does not recognise becomes `MessageRole.Other`, keeping the message in the
history under a neutral label rather than dropping it.

Every dialect is normalised into the same envelope, in its own module, so the panel and every test above it
see one shape:

- **messages** — the top-level `system` field becomes a system message at index 0 (99.5% of a 399-hop sample
  carry the prompt there rather than in `messages`), and its typed content blocks become the message's text
  and the calls it made: `text` and `tool_result` contribute text, `tool_use` contributes a call.
- **Responses** — `instructions` becomes the system message, `input` is either a string or a list of
  messages, and the answer is assembled from `output[]` items rather than `choices[]`: `message` items carry
  the text, `reasoning` items the summary, `function_call` items the calls. It states `status` where the other
  two state a finish reason, and a streamed response is decoded from its terminal `response.completed` frame.

The reasoning summary is carried as its own field on the response envelope, never merged into the answer:
54% of Responses hops record one, and reading it as the reply misattributes the model's scratch work.

### 4. Suppression moves from the hop to the tab

`hopTextSuppressionOf` returns a single verdict for a hop. It is replaced by a resolver returning one verdict
**per side**:

```
                              request side              response side
protocol envelope method      SessionSetup              SessionSetup
embedding                     available (probe text)    Vector (stated, not rendered)
response_body_bytes === 0     available                 NoResponse
otherwise                     available                 available
```

**The order is part of the rule, and this table stated it wrongly.** It read
response-bytes → envelope → embedding, while the code tests the envelope first. The code is right: a
protocol-envelope hop records zero response bytes, so a response-bytes-first reading labels every
session-negotiation hop "this hop returned no response body" — true but useless, and it hides the reason
there is nothing to read. The table is corrected here rather than the code being changed to match it
(task 12.3).

The zero-fetch guarantee is preserved where it still pays: a protocol-envelope hop fetches nothing on either
side. The other two rows no longer suppress a fetch, but the request side of an embedding hop averages 352 B
and a zero-response hop's request is the point of opening it.

### 5. Entitlement stops being conjoined

`transcriptBodyFields` currently returns `isReadable: has(request_body) && responseFields.length > 0`. It
gains `isRequestReadable` and `isResponseReadable` alongside, and the inspector consumes those. `isReadable`
stays for the transcript, which genuinely needs both.

The withheld statement is rendered **once, with the trace view's header**, not per hop — the spec's existing
position, kept. `ConversationTraceView` already receives what it needs to state it.

**A panel built from both columns states each half by its own grant.** The MCP and embedding panels are not
one side of the hop: an MCP hop's arguments come from the request column and its result from the response
one, and an embedding hop's dimension count is the only field read from the response. A read that proceeds
when *one* side is granted must therefore be told which, or it reports "this hop recorded nothing" for a
column the caller was simply not shown — describing the caller's entitlement as a property of the hop. The
grants travel into the fact builders as `HopSideGrants`, and the panels state the withheld half distinctly
(task 11.10).

### 6. Span kind and outcome become two fields

`SpanCategory` loses `Error` and renames two members:

```
  Error       → removed (becomes a status)
  Deployment  → Llm
  Retrieval   → Mcp
  Embedding   → Embeddings
  Route       → Route          (kept as a name; see below)
  Other       → Other
```

`spanCategoryOf` currently short-circuits on `success === false` before looking at the kind, which is exactly
the conflation being removed. It splits into `spanKindOf` (no failure branch) and `isFailedHop` — named for
the hop, since that is what it takes — and `SpanCategoryBadge` is replaced by `SpanKindBadge`, which renders
the kind badge with a failure marker beside it rather than instead of it.

In the tree, `HopEventType.Error` is removed from the event-type set and becomes an outcome carried on the
node. The filter gains one **Failed** control on that axis, offered only when the turn recorded a failure;
`categoriesOf` returns kinds, and the failure control is derived separately.

**Route stays a name with no reachable node.** The span-tree requirement excludes `route` hops from the tree,
so no route hop can be selected and no route branch is built. This contradicts the design session's decision
to render route hops as raw JSON, and the honest reason for the contradiction is **not** that route hops are
uninteresting — it is that Core records nothing that would place one in a conversation:

- August 2026, `event_kind = 'route'`: **4 780 hops**. Through 30 August, **0** carried a `chat_id` and 1
  carried a `core_parent_span_id`. Without a conversation id a route hop is not reachable from this view at
  all, and without a parent span it has nowhere to nest even if it were.
- **This is changing.** Re-measured on 1 September: on **31 August** alone, 369 route hops recorded 215
  parent spans and 10 conversation ids — every one of those 10 carrying both, all from a single RAG
  deployment's `/route/channel/documents/search`. So the gap is Core-side propagation, and it has begun to
  close.

Consequently the exclusion is a **data** decision, not a rendering preference, and the design session's
substance ("do not build a route field table") is honoured by building nothing: if route hops are admitted to
the tree once Core propagates the parent span consistently, the raw view already covers them with no new
branch. That propagation is a Core-side ticket, recorded in tasks.md as a parked item.

### 7. Component shape

A new `Detail/Inspector/` folder, following the `Header/` `List/` `Toolbar/` subfolder precedent one level up:

```
HopInspector.tsx          tabs + params line, switches on hop kind and dialect
HopParamsLine.tsx         always-stated four, present-only rest, unrecognised count
HopRequestPanel.tsx       role chips (pinned) + message list
HopMessageRow.tsx         role, position, size, large-message marker, text or calls, reveal
HopToolCalls.tsx          the calls a message made, with clamped arguments
HopResponsePanel.tsx      Assembled | Raw, with the reasoning summary stated separately
HopRawView.tsx            clamped raw body + truncation statement
HopMcpPanel.tsx           method, tool, toolset, arguments, result
HopEmbeddingPanel.tsx     model, inputs, dimensions, tokens, probe text
HopStateNote.tsx          withheld / failed / empty / unstructured, stated distinctly
HopClampNote.tsx          one clamp statement, wherever something was clamped
use-hop-envelope.ts       tier 1, both sides, keyed like use-hop-bodies
use-hop-message.ts        tier 2
use-hop-raw.ts            tier 3
use-hop-facts.ts          the MCP and embedding reads
```

Renamed and dropped against the first sketch above: `HopWithheldNote` became `HopStateNote` once it carried
four states rather than one; `HopMessageProperties` and `use-hop-property.ts` are gone with the properties
(§1, task 10.5); `HopToolCalls` and `HopClampNote` were extracted when a message's calls and a clamp
statement each turned out to have more than one caller.

`ConversationHopTexts.tsx` and `conversation-hop-texts.ts` are deleted. The parsers land in
`utils/analytics/hop-inspector/`: `dialect.ts`, one module per dialect (`chat-completions.ts`, `messages.ts`,
`responses.ts`), the shared `envelope.ts`, `params.ts`, the response decoder `response.ts`, and the fact
builders `mcp.ts` and `embedding.ts`. `conversation-bodies.ts` stays the transcript's, and the Responses
decoder reuses its SSE frame splitter (`sseFrames`, exported for it) rather than splitting frames a second
way.

**ui-kit**: the tabs are `Tabs` (2.0), which implements the ARIA tabs pattern including arrow-key selection —
not `DialSegmentedControl`, which is a mode switch. Two parts of this paragraph were revised while building:

- **The Request tab carries no `count`.** `TabItem`'s count renders in accent styling that reads as a link on
  this theme, so the message count moved to the params line, where it is read from the plain
  `number_request_messages` column and stays right when a body read is clamped or withheld.
- **The response mode switch is `DialSegmentedControl` (1.0), deliberately.** The 2.0 `SegmentedControl` was
  adopted first and then reverted: its selected segment is styled with ui-kit's own `bg-control-*` utilities,
  which resolve to CSS properties the DIAL themes service never defines, so the label renders unreadable on
  a light fallback. The 1.0 control uses the `--controls-bg-*` family the service does define. The cost is
  `role="tab"` on a control inside a tab panel rather than the 2.0 `radiogroup`; a legible control wins
  (tasks 14.2, 14.6).

The per-message reveal is `OutlinedButton` (2.0) rather than a ghost button, so it reads as an action rather
than a link, and rather than `Accordion`, whose header layout (caret + title + description) is wrong for a row
that must fit a role, a position and a size across 360px.

### 8. Constants, not magic numbers

`MESSAGE_TEXT_CLAMP` (280 chars), `LARGE_MESSAGE_BYTES` (1024), `ENVELOPE_BYTE_BUDGET` and
`RAW_BODY_BYTE_BUDGET` live in `constants/analytics/conversations-trace.ts` beside the existing
`STREAM_MODEL_BODY_BYTE_BUDGET`, so the budgets are tunable in one place once the tail is observed in use.

### 9. Accessibility

- Role chips are toggle buttons carrying `aria-pressed`, matching the tree's filter controls; the active
  role's match count is announced through a `role="status"` region, as the tree's is. That region is
  `sr-only`: every count it could print is already on the pressed chip, and at 360px a visible copy wrapped
  to a row of its own to restate the chip above it (§10).
- The per-message reveal carries `aria-expanded` and `aria-controls` against a real `useId()` id.
- `Tabs` supplies the tab-list ARIA; the panels are the consumer's and each is labelled by its tab.
- The withheld / failed / empty / unstructured note is a `role="status"` region, as `ConversationHopTexts`
  already does.
- Every scroll container carries a tab stop, and there is **one per tab** rather than one per block: a
  scroller inside a scroller made a keyboard reader hunt for which of the two they were in (§10).
- The params line is a `role="group"`, not a `<p>` — ARIA prohibits a name on a paragraph, so the
  `aria-label` that made the line addressable was being discarded by the readers it was for (task 11.14).

### 10. The rail's height is as contested as its width

Not in the original design, and the omission showed. The inspector was placed between the metrics grid and
the facts list, with the facts list at natural height and `shrink-0`; the inspector, `flex-1` with a zero
basis, took what was left. Nine fact rows are ~280px of a ~530px rail, so the message history — the surface
this change exists for — rendered in ~130px: the role filter and a sliver.

The resolution, and the reasoning behind each part:

- **The inspector goes last and takes the remaining height.** A long message list was pushing the hop's
  endpoint, upstream and status off the rail entirely.
- **The reference facts are capped at 35% of the rail and scroll within the cap.** Endpoint, upstream, parent
  and status are read once per hop; the inspector is worked in. Where the two compete, the reference data
  yields.
- **`ConversationRailShell` no longer decides overflow for both its consumers.** The conversation rail scrolls
  as a whole; the hop rail scrolls inside the inspector.
- **The filter and the response-mode control are `sticky`, and the panel carries no row gap.** Both choose
  what the pane below shows, and on a 52-message hop both scrolled out of reach of the list they govern. The
  row gap had to go with the change: a gap below a sticky bar is a transparent band inside the scroll port,
  and rows crossing it read as text sliding under the control. Each block carries its own bottom padding
  instead.

Recorded here because it is a layout *decision*, not a styling fix: the rail now has an explicit priority
order — identity, metrics, capped reference facts, then everything left to the inspector.

## Risks / Trade-offs

- **Re-reading the row per reveal** → Each read is one partition, measured at 71–337 ms, and reveals are
  deliberate. Tier 2 already returns the whole message (§1), so the widening this risk offered as a remedy is
  spent; a further step would be batching the visible messages into one read.
- **The category split touches the span tree, its badge and its filter** → All three are covered by existing
  specs and tests, which move in the same change; the delta spec carries the full modified requirement so
  archive cannot silently drop a scenario.
- **`/v1/responses` traffic would render as raw** → **This landed during the change.** The endpoint appeared
  on the instance, and the fallback turned out not to be the complete answer this risk assumed: the response
  decoder looked for `choices[].message` in a column the Responses shape fills with `output[]`, so all 472
  sampled hops reported "this hop recorded nothing" over a populated response (task 13.9). A dialect the
  frontend has not met is safe on the fallback only where the fallback is dialect-*unaware* — this one was
  not. Parser built; the remaining fallback (`/v1/completions`) has zero hops.
- **A 4 MB body still exists** → Tier 3 clamps it and states the clamp. The reader who needs all 4 MB is
  outside what a 360px rail can serve, and the honest statement is better than a silent truncation.
- **Deleting `SpanCategory.Error` changes a badge readers have seen** → A failed call now shows its kind and
  a failure marker instead of the word "error" alone. This is the intended gain and is stated in the spec.

## Migration Plan

No data migration and no backend change. The panel replaces the current one in place; the schema gate that
already governs body reads governs the inspector unchanged, so revoking a body column withdraws the tab with
no frontend release. Rollback is reverting the change.

## Open Questions

- The clamp budgets (280 chars, 1024 B, and the two byte budgets) are first estimates from the measured
  distribution. They are single constants and can be tuned once the 2.7% tail is exercised in practice
  without touching the specs, the contract or the task breakdown.
