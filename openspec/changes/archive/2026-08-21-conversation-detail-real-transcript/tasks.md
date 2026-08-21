Groups 1–8 are each intended to be one PR. Group 1 is a prerequisite for 2–4; group 5 depends on 2–4;
groups 6 and 7 are independent of 1–5 and of each other. Group 8 is the final gate.

**No browser-verification task.** Most scenarios in this change are browser-observable, so the question was
put to the user, who declined a `spec-browser-verify` task. Coverage is unit and component tests only.

## 1. Models, constants and query primitives

- [x] 1.1 Extend `UsageLogField` in `models/analytics/conversations-trace.ts` with `RequestBody`,
      `ResponseBody`, `AssembledResponse`, `NumberRequestMessages`, `RequestBodyBytes`, `ResponseBodyBytes`,
      `McpMethod`, `McpToolCallName` and `ExecutionPath`, matching the `dial_usage_log` column names. There is
      **no** streaming column — do not add one.
- [x] 1.2 Add the transcript models to the same file: `ConversationTranscript`, `TranscriptState` (enum:
      `Available`, `ColumnsUnavailable`, `NotReconstructable`, `Expired`, `NoMessages`, `LoadFailed`),
      `ConversationEntryHopRow`, `ConversationEntryBodyRow`, and extend `ConversationMessage` with the turn's
      `trace_id`. Keep types in `models/`, const values in `constants/` per
      `.claude/rules/code-standards.md`.
- [x] 1.3 Add `isNull(fieldName)` to `utils/analytics/query-build.ts` beside the existing `isNotNull`, with
      its unit test in `utils/analytics/tests/query-build.spec.ts`. The spec requires a null test rather than
      an empty-string comparison, and the column has zero empty values — the wrong predicate silently returns
      no rows.
- [x] 1.4 Add to `constants/analytics/conversations-trace.ts`: `MCP_SESSION_SETUP_METHODS`, the hop-log
      retention constant (naming in a comment the backend TTL it mirrors), and the entry-hop bound as an
      alias of `CONVERSATION_TURN_LIMIT` so the transcript and the turn list cannot disclose different
      lengths.
- [x] 1.5 Schema-gate `assembled_response`: add `OPTIONAL_USAGE_LOG_FIELDS` to the same constants file and
      project the column through the existing `availableSelectFields` mechanism, exactly as
      `OPTIONAL_DETAIL_SELECT_FIELDS` does for the insight columns. The column is a later addition that older
      instances do not persist at all, and the service rejects the whole query for one unknown field — so
      naming it unconditionally breaks the Chat view for a full administrator, with no permission that would
      fix it.
- [x] 1.6 Unit-test the gate in `utils/analytics/tests/conversation-column-catalog.spec.ts` (or beside the
      query tests, wherever `availableSelectFields` is already covered): a schema reporting the column names
      it, a schema without it omits it while still naming every required field, and an absent schema names
      the required fields only.

## 2. Body decoding

- [x] 2.1 Create `utils/analytics/conversation-bodies.ts` with `decodeStreamedChunks`,
      `decodeSingleCompletion` and `decodeJsonRpcStream`, plus a `decodeResponseBody(row)` dispatcher that
      determines the format **from the body's own shape** — there is no streaming column to key on. A body
      that cannot be parsed returns `null` — never a fragment, never the raw body.
- [x] 2.2 Add `assistantTextOf(row)` to the same module: read `assembled_response` at
      `choices[0].message.content` when it is present and parseable, otherwise fall back to
      `decodeResponseBody`. Absent, null and not-JSON are one case, not three.
- [x] 2.3 Add `messageTextOf(message)` and `transcriptMessagesOf(requestBody)`: the first reduces a `content`
      that is a string or a list of content parts (text-bearing parts, in order) and distinguishes an absent
      `content` key from `''`; the second filters to user and assistant roles and ignores a top-level
      `system` field.
- [x] 2.4 Add `toolCallNamesOf(body)` for the Trace view, reading the names from the response's tool calls
      where content is empty or absent. The hop log carries no column for them, so a body is the only source.
- [x] 2.5 Unit-test the module in `utils/analytics/tests/conversation-bodies.spec.ts`. The fallback gets the
      same depth as the preferred path, because a recently upgraded instance carries up to a year of rows
      where it is the only source: assembled present and valid; assembled null; assembled present but not
      JSON; each of the three raw formats; a multi-chunk stream reassembled in arrival order; both unusable;
      content as a part list; a message with no `content` key; a system message and a top-level `system`
      field both excluded; a response whose output is in tool calls.

## 3. Transcript assembly

- [x] 3.1 Create `utils/analytics/conversation-transcript.ts` with `assembleTranscript(entryHops, bodies)`
      implementing the tail-overlap rule: per entry hop in time order, append its request messages after
      dropping the longest leading run already matching the tail of the assembled transcript, then append the
      decoded response as that turn's assistant message tagged with the hop's `trace_id`.
- [x] 3.2 Add `carriesWholeConversation(entryHops)` to the same module — the `2n − 1` message-count test that
      decides whether only the newest entry hop's bodies need fetching — returning false when the message
      count is absent.
- [x] 3.3 Add `transcriptStateOf(...)` resolving the state discriminant: `NotReconstructable` when the
      conversation has hops but no entry hop, `Expired` / `NoMessages` split by the conversation's
      `last_request_time` against the retention constant when it has no hops at all, plus `Available`,
      `ColumnsUnavailable` and `LoadFailed`.
- [x] 3.4 Unit-test in `utils/analytics/tests/conversation-transcript.spec.ts`: the measured application
      deployment shape (`1, 3, 1, 1, 1, 1, 1, 1, 3, 5, 5`), a monotonic full-history client, a mixed
      conversation, the assertion that the `2n − 1` shortcut and the full read produce the **same**
      transcript, an assistant message bound by trace id where the turn list is shorter or differently
      ordered, and each state — including `NotReconstructable` for a conversation with hops but no entry hop,
      asserting no message text is taken from those hops.

## 4. Queries and the server action

- [x] 4.1 Add `buildConversationEntryHopsQuery(chatId, limit)` to `utils/analytics/conversations-queries.ts`
      — `trace_id`, `request_time`, `deployment`, `number_request_messages` and the two byte-size columns,
      filtered on `chat_id` plus a null parent span, sorted by `request_time` ascending. It names no body
      column.
- [x] 4.2 Add `buildConversationHopCountQuery(chatId)` — a count over the conversation's hops with no
      entry-hop predicate. It is the only signal separating `NotReconstructable` from `NoMessages`, and names
      only non-heavy columns so it can run concurrently with 4.1.
- [x] 4.3 Add `buildConversationEntryBodiesQuery(chatId, hops, hasAssembled)` naming `trace_id`,
      `request_body`, `response_body` and — only when the schema reported it — `assembled_response`, under the
      chat filter narrowed by `trace_id IN (…)` **and** bounded in time by the hops 4.1 returned.
- [x] 4.4 Add `getConversationTranscript(chatId, lastRequestTime)` to
      `app/[lang]/conversations-trace/actions.ts`: read the `dial_usage_log` schema through
      `withEntitySchemaCache`, return `ColumnsUnavailable` unless the schema reports `request_body` plus at
      least one response column, otherwise run the reads, decode and assemble, and return only decoded
      messages. No role, scope or session permission is consulted.
- [x] 4.5 Extend the query tests in `utils/analytics/tests/conversations-queries.spec.ts`: the null-parent
      predicate, the absence of body columns from the cheap query, a `chat_id` predicate on every query this
      change adds, the trace-id narrowing, the time bound built from the fetched rows' own timestamps (and not
      widened to the conversation's span), the timestamps carried through unchanged, and `assembled_response`
      named only when the schema reports it.

## 5. Detail route, view switch and the transcript region

- [x] 5.1 Join the hop-log schema read and `getConversationTranscript` to the existing wave in
      `app/[lang]/conversations-trace/[id]/page.tsx`, following the same `.catch()` discipline the
      conversations schema read already uses so a failed schema read costs the Chat view rather than the
      page. Remove the `mockConversationTranscript` import and call; leave the feedback and turn reads
      unwaiting.
- [x] 5.2 Delete `mocks/analytics/conversation-transcript.ts`.
- [x] 5.3 Add the Chat/Trace switch to `ConversationDetailView.tsx` using `DialSegmentedControl`, extending
      `use-conversation-trace.ts` to own the current view alongside the selected turn. Switching to Trace
      with no turn chosen selects the first turn; the per-turn control still opens its own turn. Render the
      Chat option disabled with its reason as visible text beside the switch when the transcript state is
      `ColumnsUnavailable`, and enabled for every other state — an empty transcript is a Chat view with
      something to say.
- [x] 5.4 Update `ConversationTimeline.tsx` to render the recorded messages: drop the sample-content notice,
      bind each assistant message to its turn by `trace_id` instead of by position, and render the explicit
      unavailable placeholder for a message with no decoded text. Keep the bubbles, the assistant footer's
      figures, the rating counts and the trace control exactly as they are.
- [x] 5.5 Render each non-`Available` state through `DialNoDataContent`, matching the existing empty states,
      so `ColumnsUnavailable`, `NotReconstructable`, `Expired`, `NoMessages` and `LoadFailed` each say what
      they mean rather than sharing one message. `NotReconstructable` must not read as an error — nothing
      failed — and must not say no messages were recorded.
- [x] 5.6 Retire `DetailSampleMessages` and add the new keys to `constants/i18n.ts` and `locales/en.ts`.
- [x] 5.7 Component-test in `components/Analytics/ConversationsTrace/tests/ConversationTimeline.spec.tsx` and
      a new `ConversationDetailView.spec.tsx`: recorded text renders with no sample notice; the switch
      indicates the current view, disables Chat with a stated reason on `ColumnsUnavailable`, and keeps it
      enabled for the three empty states; each state renders its own message; an assistant message carries
      its own turn's figures. Assert i18n keys, not translated text.

## 6. Span tree ordering and the removal of duration claims

- [x] 6.1 Sort each sibling group by `request_time` inside `childrenOf` in
      `utils/analytics/conversation-spans.ts`, using a stable sort so tied siblings keep arrival order.
- [x] 6.2 Remove `offsetMs` and `durationMs` from `ConversationSpanNode` and `latencyMs` from
      `traceTotalsOf`; add the hop's absolute recorded time to the node.
- [x] 6.3 Update `ConversationSpanList.tsx`, `ConversationSpanDetail.tsx` and `ConversationTraceView.tsx`:
      the duration column becomes the hop's absolute time, the offset row goes, the Latency stat is replaced
      by the elapsed time between the first and last recorded hop, and no figure is derived from a hop
      duration.
- [x] 6.4 Update `utils/analytics/tests/conversation-spans.spec.ts` and
      `components/Analytics/ConversationsTrace/tests/ConversationTraceView.spec.tsx` for the new node shape,
      the sibling ordering, and the absence of any duration-derived figure.

## 7. Trace view enrichment

- [x] 7.1 Extend `buildConversationSpansQuery` with `mcp_method`, `mcp_tool_call_name` and `execution_path`,
      and add them to `ConversationSpanRow`. All three are ordinary non-heavy columns present on the entity, so
      they need no schema gate — unlike `assembled_response` in 1.5.
- [x] 7.2 Extend `spanLabelOf` so an MCP hop is named by its tool call, falling back to its method and only
      then to the deployment or request URI.
- [x] 7.3 Add `collapseHandshakeRuns(nodes)` to `utils/analytics/conversation-spans.ts`, folding a maximal
      run of consecutive siblings at one depth whose MCP method is session setup into one group node carrying
      the collapsed hops. A tool call, or any non-MCP hop, terminates a run.
- [x] 7.4 Render the collapsed run in `ConversationSpanList.tsx` as a `<button>` with `aria-expanded`,
      `aria-controls` and a real `useId()`, collapsed by default, its label stating how many hops it stands
      for. Render `execution_path` as the routing chain, and the MCP method and tool in
      `ConversationSpanDetail.tsx`.
- [x] 7.5 Unit- and component-test the label fallback chain, the collapse grouping (including a tool call
      breaking a run), the expand control's ARIA state, and the routing chain's rendering.

## 9. Trace view landing surface and localized re-render

Added after review of the running UI: switching to Trace dropped straight into one turn's hop chain, and the
switch re-rendered the whole page.

- [x] 9.1 Add `ConversationTraceList.tsx` — one row per recorded turn stating its trace id, start time, hops,
      tokens, cost, duration and ratings, each a real `<button>` opening that turn's hop chain. Follows
      `ConversationSpanList`'s shape, and carries its own empty and failed states.
- [x] 9.2 Add `ConversationDetailBody.tsx` owning the view state alongside the switch, so choosing a view
      re-renders the body and nothing above it. Revert `use-conversation-trace.ts` to owning only the open hop
      chain, and `memo` `ConversationDetailRail`.
- [x] 9.3 Render the hop chain beside the body with the body hidden (`hidden` + `inert`) rather than
      unmounted, so closing a hop chain returns to the view it was opened from.
- [x] 9.4 Component-test the list (rows, figures, keyboard activation, clipping disclosure, both empty
      states) and the composition (Trace lands on the list and issues no hop read, a row opens its chain, the
      return path per origin, and a header render count proving the switch does not re-render the page).

## 8. Quality gate

- [x] 8.1 Run `npm run lint`, `npm run format`, and the full `npm run test` from `apps/ai-dial-admin/`, and
      resolve everything they report.

## 10. Correct the body query's time bound

- [x] 10.1 Convert each hop's `request_time` with `toMillis` before it reaches the query, and bound
      `request_time` with a `ge`/`le` pair over the minimum and maximum instead of `inValues`. A returned
      ISO-8601 value is rejected as an invalid timestamp literal, and an `in` list over a timestamp compiles
      to `has([…], request_time)`, which prunes no partition. Rewrite the doc comment, which prescribed the
      pass-through that caused the first failure.
- [x] 10.2 Replace the two `in`-list tests in `conversations-queries.spec.ts` with ones pinning the range
      ops, the millis conversion from an ISO-8601 input, and a single hop bounded to its own instant.
- [x] 10.3 Update the spec's bounding requirement and the design's step-2 rationale to prescribe the range
      and the millis conversion, with scenarios for both.

## 11. Make the figures agree with the turn they describe

- [x] 11.1 Narrow `carriesWholeConversation` to require exactly `2k − 1` at every entry hop, and attribute the
      single body's messages to their own turns by index. Under the old lower-bound test every message was
      tagged with the newest hop, so every answer in the conversation showed the last turn's tokens, cost,
      hops and duration.
- [x] 11.2 Fall back to the per-turn read when the decoded history is not the length the counts promised,
      rather than attributing by position.
- [x] 11.3 Strengthen the shortcut-equivalence test to compare whole messages, not only content — comparing
      content alone is what let 11.1's bug pass.
- [x] 11.4 Pass the turn row into `ConversationTraceView` and state its tokens, cost, hop count, duration and
      failed-hop count instead of summing the hops that were read. A 384-hop turn reads 300 hops, so the sum
      reported 700 K tokens and $1.01 against the list's 3.67 M and $3.68.
- [x] 11.5 Add `failed_hop_count` to the turns query as `failed_hops`, and drop `traceTotalsOf` and
      `ConversationTraceTotals` with their tests, now that nothing re-derives a turn's figures.
- [x] 11.6 Update the spec's shortcut and trace-figure requirements, and reverse design decision 10's
      rejection of the rollup's `duration_ms` with the evidence that overturned it.

## 12. Title turns by their question, and read a hop's texts on demand

- [x] 12.1 Add `questionsByTurn` to `conversation-transcript.ts`, reducing the assembled messages to each
      turn's last user message keyed by trace id — the question that turn answered, from data already loaded.
- [x] 12.2 Title each `ConversationTraceList` row with its question, demote the turn number and trace id to
      the subtitle, truncate with `DialEllipsisTooltip`, and fall back per turn to `Turn N`.
- [x] 12.3 Add `lastRequestMessageOf` and `jsonRpcArgumentsOf` to `conversation-bodies.ts`. The former reads
      through `transcriptMessagesOf`, so the transcript's role filter also guards the hop detail.
- [x] 12.4 Add `conversation-hop-texts.ts` — `hopTextsOf`, splitting the request side by event kind and
      leaving the response side to the sniffing decoder.
- [x] 12.5 Add `buildConversationHopBodyQuery`, filtered by conversation, trace and hop and bounded by that
      hop's own instant as a `ge`/`le` pair in epoch millis.
- [x] 12.6 Add `getConversationHopBodies`, gated on the same schema fields as the transcript, returning only
      decoded text and distinguishing a hop with nothing readable from a failed read.
- [x] 12.7 Add `use-hop-bodies.ts`, reading one hop when it is opened, holding that one answer, and dropping a
      late answer whose hop is no longer open.
- [x] 12.8 Add `ConversationHopTexts` to the hop detail, absent entirely when the schema withheld the columns.
- [x] 12.9 Specs for all of the above, including that a system prompt in the last position is still not shown,
      and that re-opening a hop issues no second read.

## 13. Decide up front which hops have text worth opening

- [x] 13.1 Project `response_body_bytes` in `buildConversationSpansQuery` — a `long`, so it costs nothing, and
      it is what decides the verdict without a body fetch.
- [x] 13.2 Add `hopTextSuppressionOf` as a deny-list over the hop row: zero response size, a session-setup
      MCP method, or an embedding. An unrecognised method or kind defaults to shown, and an absent size is
      unknown rather than empty.
- [x] 13.3 Skip the read in `use-hop-bodies.ts` for a suppressed hop and return the reason, so 284 of the
      sampled turn's 384 hops cost no request.
- [x] 13.4 State the reason in `ConversationHopTexts` in place of the section, outranking the loading state —
      the verdict is known before a request exists. The hop keeps its row, timing, status and nesting.
- [x] 13.5 Title an open hop chain with the turn's question, as the list row is titled, deriving the questions
      once in `ConversationDetailView` for both consumers.
- [x] 13.6 Specs for the deny-list including both default-to-shown cases, for the skipped read, for the stated
      reasons, and for the chain heading.
- [x] 13.7 Fix the span query's "never asks for a body column" assertion, which matched `response_body` as a
      substring of `response_body_bytes`; assert on the projected names instead.

## 14. Group the hop chain

- [x] 14.1 Widen `MCP_SESSION_SETUP_METHODS` to the nine `MCP_PROTOCOL_METHODS`, and add `MCP_BURST_GAP_MS`
      and `MODEL_CALL_URI_MARKERS`.
- [x] 14.2 Classify a hop with no `event_kind` by its endpoint via `isModelCall`, so 53 179 unlabelled model
      calls stop rendering as unclassified. An unrecognised endpoint stays unclassified.
- [x] 14.3 Project `response_body_bytes` and add `embeddingCount` to `ConversationSpanNode`.
- [x] 14.4 Add `conversation-hop-groups.ts`: `foldEmbeddings`, `groupMcpBursts`,
      `collapseRepeatedModelCalls`, and `groupHopEntries` composing them in that order.
- [x] 14.5 Keep a failed envelope hop as a row rather than folding it into a count, while still counting it as
      a session attempt.
- [x] 14.6 Replace `collapseHandshakeRuns` and its entry model with the burst and repeated-call entries;
      rewrite `ConversationSpanList` around one shared row shell.
- [x] 14.7 Render the embedding count on its parent's row, the burst header with server, tools, hops, span and
      start time, and the expanded burst with envelope counts followed by each unit of work.
- [x] 14.8 Mark and de-emphasise a discovery-only burst.
- [x] 14.9 Specs for each stage, including that a descendant does not break a burst, that a burst breaks on
      server and on gap, that tool calls are never collapsed in the main sequence, and that every hop stays
      accounted for.

## 15. Replace the grouping with a typed event stream

- [x] 15.1 Delete `conversation-hop-groups.ts`, the burst and repeated-call entry models, and
      `ConversationSpanList`. Nesting bought little on a tree that is one root and hundreds of children.
- [x] 15.2 Project `reasoning_tokens`; add `HopEventType`, `HopEvent`, `ModelCallOutput` and
      `ModelToolRequest`.
- [x] 15.3 Add `conversation-hop-stream.ts`: `buildHopEventStream`, `filterEvents`, `countEventsByType`,
      `isConversationHop`, `isFailedHop`, and the default type selection.
- [x] 15.4 Add `buildConversationModelBodiesQuery` and read the model calls' outputs in
      `getConversationSpans`, capped at `STREAM_MODEL_BODY_LIMIT` and returning only decoded text and names.
- [x] 15.5 Assemble tool requests from streamed `delta.tool_calls` as well as `message.tool_calls` — 2 of the
      measured turn's 85 requests existed only in deltas, and were invisible.
- [x] 15.6 Mark a tool request with no recorded result, resolved by count per name rather than by identity.
- [x] 15.7 Add `ConversationEventStream` with the conversation/raw tabs, unfiltered line numbers, an always-shown
      frame, and a stated shown-of-total.
- [x] 15.8 Exclude `route` hops and type `count_tokens` endpoints as utility rather than conversation.
- [x] 15.9 Specs for the derivation, the filtering, the streamed tool-call assembly, and the stream component.

## 16. Filter by category rather than by preset

- [x] 16.1 Replace the conversation/raw preset pair with one `GhostButton` toggle per category, naming the
      category and nothing more, plus an all control. Default selection is every category, and how much is
      showing is stated once beside the filters.
- [x] 16.2 Keep a zero-count category visible and disabled, so `error 0` still reports itself.
- [x] 16.3 Expose each toggle's state with `aria-pressed`, and put both the filters and the row list in
      labelled `role="group"`s — a filter's label is the same word its rows carry, so neither region was
      addressable without them.
- [x] 16.4 Replace `DEFAULT_EVENT_TYPES` with the ordered `FILTERABLE_EVENT_TYPES`, frame excluded.
- [x] 16.5 Update the specs: every category shown by default, narrowing one category, a zero-count control,
      and the frame surviving every selection.

## 17. Never strand the reader under a loader

- [x] 17.1 Wrap `onOpenTrace` so the loading state always clears: a rejected read opens the trace stating it
      could not be read, rather than leaving the overlay up with no way back. The same defect class as the hop
      body read, in the one place it had not been fixed — and widened by the model-body read added in group 15.
- [x] 17.2 Render the overlay only while no trace is open. As the last child of a positioned container it
      otherwise paints over the trace it was loading, which reads as a chain that never loaded.
- [x] 17.3 Tests for both, plus the already-failing read.

## 18. Isolate on click, and reach the empty state

- [x] 18.1 Replace the independent category switches with isolate-on-click: activating a category shows it
      alone, activating it again restores every category, and the all control does the same.
- [x] 18.2 Add `hasFilteredRows` and guard the empty state on the turn's own rows. The frame is never
      filtered, so `events.length` is never zero — the "recorded no hops" message could not fire, and such a
      turn rendered as a question above a totals line with nothing between them.
- [x] 18.3 Drop the selection-empty message, unreachable now that a category with no events cannot be
      isolated to, rather than leaving dead code that claims to handle a case.
- [x] 18.4 Update the specs for isolate semantics, the inert empty category, and the no-hops turn.

## 19. A narrowed view answers with its category alone

- [x] 19.1 Keep every category selectable, and state plainly when an isolated one recorded nothing. Disabling
      an empty category refused a real question — "were there any errors" — whose answer is *none*.
- [x] 19.2 Drop the frame's filtering exemption: it frames the whole turn, so it shows while the whole turn
      shows and steps aside once the reader has narrowed to one category.
- [x] 19.3 Bound the model-body read by bytes as well as by hop count. A single response reaches 4.00 MiB, so
      the 80-hop cap alone permitted a read of hundreds of megabytes — which is what makes opening a trace look
      like a hang. Calls past the budget are typed generically and say so.

## 20. Review-pass corrections

Each verified before it was acted on; the reasoning is in design §12, the withdrawn tree and handshake clauses
in the spec delta.

- [x] 20.1 Treat an unrecorded message text as a match when overlapping a resent history. A tool-call-only
      answer decodes to no text while its resent copy carries no `content` key, and comparing the two strictly
      found no overlap and re-appended the whole conversation under the later turn — with that turn's figures
      beneath the duplicated answer. Test pinning the shape.
- [x] 20.2 Schema-gate `response_body` as well as `assembled_response`. The read gate accepts either response
      column, so an instance persisting only the assembled one is supported — and naming the other regardless
      rejected the whole query, breaking the Chat view outright. Tests at the builder and the field list.
- [x] 20.3 Type a model call the log records as returning no bytes as empty rather than generic, so it stays
      distinguishable from one past the byte budget. Tests for both, including the reasoning-only case.
- [x] 20.4 Make the model-output enrichment non-throwing, so a transient schema failure cannot discard a span
      read that succeeded. Test asserting the spans still arrive.
- [x] 20.5 Report entry hops whose bodies yield no message as not reconstructable, not as an available
      transcript of nothing. Tests for that and for the previously uncovered body-read failure.
- [x] 20.6 Replace four Tailwind classes naming tokens the palette does not define, and move the event rail
      and label maps into the constants module beside their siblings. Five of eleven event types rendered no
      rail at all.
- [x] 20.7 Remove the legend: it coloured `SpanCategory` while the rows are coloured by `HopEventType`, with
      the two taxonomies contradicting each other on the same tokens. Its test goes with it.
- [x] 20.8 Use one failure predicate in the row and its detail, so a red error row cannot open a detail that
      reports OK.
- [x] 20.9 Open the detail on a view that can be selected, rather than on a Chat segment that is current and
      disabled at once for every caller below FULL_ADMIN.
- [x] 20.10 Delete `buildSpanTree`, `childrenOf`, the duplicated `byStartTime`, `countEventsByType` and the
      write-only `HopEvent.suppression`, with the specs that were their only callers. The tree builder also
      constructed fields `ConversationSpanNode` no longer declares.
- [x] 20.11 Collapse the three `MCP_EVENT_KIND` declarations and the duplicated protocol predicate to one
      each. The copies had diverged on trimming, so a stored `'mcp '` would be typed as an MCP call and decoded
      as a model call.
- [x] 20.12 Remove the duplicated `getConversationSpans` tests misfiled under `getConversationFeedback`, and
      strengthen the two page tests that asserted a failed transcript only by the rendered component's name.
- [x] 20.13 Render a frame row as a row rather than a permanently disabled button; keep every filter operable
      including the active one; count the turn's own rows on both sides of the showing-of-total line and
      announce it; give the scrollable hop-text panels a tab stop; report a failed hop read as a failure rather
      than in the same grey as a hop that recorded nothing.
- [x] 20.14 Remove the three orphaned i18n keys and the sample-content notice whose text asserted the claim
      this change falsifies.
