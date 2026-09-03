## 1. A reusable vertical split

- [x] 1.1 Add `src/components/Common/SplitPane/utils.ts` with the split's pure arithmetic: a clamp taking a
      requested percentage and the floor and answering the legal percentage, and a step function for the
      keyboard path. Both take numbers and return numbers — no DOM, no measurement — so the floor is unit
      testable in jsdom where every element measures zero. Put the floor and the keyboard step in
      `src/components/Common/SplitPane/constants.ts` (20 and 5), and any type in an adjacent `models.ts` per
      `code-standards.md`.
- [x] 1.2 Add `src/components/Common/SplitPane/SplitPane.tsx` — a domain-free two-section horizontal split on
      `re-resizable` (already a dependency; `components.md` §5 names it for this). Props: `top`, `bottom`,
      `ariaLabel`, optional `minPercent`. Size the top section with a **percentage** — `size={{ height:
      `${percent}%` }}`, `minHeight`/`maxHeight` as percentage strings — never with pixels: a pixel height
      that clears the floor at one viewport height falls below it at a shorter one, which is the state the
      floor exists to prevent. Assert `min-h-0` on the component's own boxes so a percentage resolves against
      a bounded parent rather than a collapsing one.
- [x] 1.3 Add `src/components/Common/SplitPane/SplitHandle.tsx` as the drag handle and the accessible
      splitter: `role="separator"`, `tabIndex={0}`, `aria-orientation="horizontal"`, `aria-valuenow` /
      `aria-valuemin` / `aria-valuemax` carrying the same numbers the drag enforces, and Arrow keys moving the
      split by the keyboard step with Home/End going to the two floors. Take the accessible name as a prop —
      `Common/` holds no domain i18n key. Reuse the grip's visual treatment from
      `Runs/Details/BottomDrawer/ResizeHandle.tsx` without importing it; that one was pointer-only and is
      labelled from `RunsI18nKey`. Sharing one component between the two is still not this change — see 10.1,
      which gives that handle the same pattern in place.

## 2. The bodies section: move the inspector out of the rail

- [x] 2.1 Add `SpanBodyTab { Request, Response, Chat }` to `src/models/analytics/conversations-trace.ts` and
      leave `HopInspectorSide` alone. The side enum is the server's column selector —
      `bodyFieldsFor` / `isSideReadable` in `src/app/[lang]/conversations-trace/actions.ts` turn a member into
      a body column list — so a `Chat` member there would be a value the read layer has to reject to stay
      correct. Map tab to side explicitly where a read is issued.
- [x] 2.2 Add `Detail/Inspector/use-span-body-tabs.ts` resolving, from the hop row and `bodyGrants` alone, the
      ordered tab set a span offers — Request, Response, Chat, in that order — plus the resolved active tab.
      Request and Response keep their current per-column gating and apply to **every** kind of hop, MCP and
      embedding included; Chat is offered when the request column is readable and the hop is neither MCP nor
      an embedding probe. Resolve the active tab against the offered set the way `HopInspector` resolves
      `activeSide` today: the tab actually on screen is the only value anything may decide from, because
      gating a read on the reader's last *choice* instead has already produced two values deciding one thing
      here.
- [x] 2.3 Rewrite `Detail/Inspector/HopInspector.tsx` to read the tab set from that hook, render the panels,
      and widen `useHopResponse`'s `isEnabled` to `activeTab === Response || activeTab === Chat` so the
      trailing answer is fetched for Chat and still not fetched for Request. Remove the early MCP branch that
      returns a tab-less panel: every kind now renders through the tab strip, and what differs is which tabs
      it offers and what each renders. Stop returning `null` for a fully withheld hop — the caller decides
      what a span with no offered tab looks like. Keep the hop-row facts slot above the strip, where
      `HopParamsLine` already sits, and render an MCP hop's method, tool name and toolset there so they stay
      visible on every tab.
- [x] 2.4 Split `Detail/Inspector/HopMcpPanel.tsx` into the two halves its columns already separate:
      `argumentsText` on the Request tab, `resultText` with its clamp note and its `resultState` on the
      Response tab, and the method/tool/toolset row lifted into the slot above the strip from task 2.3.
      `getConversationHopMcp` keeps its single `readHopBody` naming both sides — the split is about where a
      fact is stated, not about when it is fetched, so neither tab waits on the other and no read changes.
- [x] 2.5 Move the embedding hop's dimension count from `HopEmbeddingPanel`'s fact grid onto the Response tab,
      leaving the model, the input count, the token count and the probe text with its clamp note on Request.
      Keep the `Vector` suppression — the vector is still never rendered — but let it surround the count
      rather than replace the tab's content: today the one response-column field renders on the request side
      while the response side says there is nothing to read.
- [x] 2.6 Strip `HopInspector` out of `Detail/ConversationSpanDetail.tsx`, leaving the span's facts. Remove the
      `max-h-[35%]` cap on the facts block and its comment: the block was capped because it was squeezing the
      message history out of the rail, and the history has left the rail.
- [x] 2.7 Compose the split in `Detail/ConversationTraceView.tsx`: inside the existing bordered box, the left
      region becomes `SplitPane` with the tree above and the bodies below, and `ConversationSpanDetail` stays
      as the rail. Where the selected span offers no tab, render the tree alone with no bodies section and no
      separator — the trace header already states a withheld body once for the whole session, and half the
      region held open to restate it costs the tree the screen. State the bodies section's own
      "no span selected" message with the same key the rail uses.

## 3. The Chat tab

- [x] 3.1 Add `Detail/Inspector/HopChatTurn.tsx` — one turn of the conversation. User and assistant keep the
      bubble treatment from the `ConversationTimeline` being deleted (alternating alignment, one squared
      corner on the speaker's side, `whitespace-pre-wrap`); system, tool and unrecognised roles get a third,
      full-width treatment so machinery never reads as either party's speech. Label every turn with its role
      from `HopMessageRow`'s exported `ROLE_LABEL_KEY`, give each turn root `role="group"` with an
      `aria-label` naming its role, and render a tool call as that turn's content — an assistant turn that
      only called a tool said exactly that.
- [x] 3.2 Add `Detail/Inspector/HopChatPanel.tsx` rendering the request envelope's messages in recorded order
      followed by the response's assembled text as the trailing turn. Fetch nothing: take both envelopes from
      `HopInspector`. Reuse `useHopMessage` for a clamped turn's full-text read so opening a turn here and
      opening the same message in the Request tab share one path. Omit the trailing turn where the response
      yields no text; state the answer as withheld where the response column is not granted; state the
      unstructured and no-message cases rather than rendering an empty conversation. Render no tool catalogue
      and merge no reasoning summary into the answer.
- [x] 3.3 Add the new keys to `ConversationsTraceI18nKey` in `src/constants/i18n.ts` and their entries in
      `src/locales/en.ts`: the Chat tab label, the tab strip's accessible name, the separator's accessible
      name, the no-conversation and unstructured statements, and the withheld-answer statement. Check
      `BasicI18nKey` / `ButtonsI18nKey` first per `components.md` §10.

## 4. The conversation detail view loses its switch

- [x] 4.1 Rewrite `Detail/ConversationDetailBody.tsx` to render the trace listing and the supporting rail
      only: drop the view state, the switch, the `ChatView` wrapper, the transcript hook and
      `questionsByTurn`. Keep `useConversationTraces`, the listing's own rating attribution and `onOpenCard`
      exactly as they are.
- [x] 4.2 Drop the `isTranscriptReadable` prop from `Detail/ConversationDetailView.tsx` and from
      `src/app/[lang]/conversations-trace/[id]/page.tsx`, and stop deriving it there. `bodyGrants` stays — it
      gates the inspector's sides and now the Chat tab.
- [x] 4.3 Delete `Detail/ConversationViewSwitch.tsx` and `Detail/ConversationTimeline.tsx`, and remove the
      `ConversationDetailView` view enum from `src/models/analytics/conversations-trace.ts`.

## 5. Remove the conversation-level transcript pipeline

- [x] 5.1 Delete `getConversationTranscript` and `resolveTranscriptFigures` from
      `src/app/[lang]/conversations-trace/actions.ts`, and delete `Detail/use-conversation-transcript.ts`.
      Keep the body-column probe and keep `buildConversationTraceFiguresQuery` — the listing's own figures
      pass still calls it. (The probe survives under a name that describes it: see 9.12.)
- [x] 5.2 Delete the transcript-only query builders from `src/utils/analytics/conversations-queries.ts` —
      `buildConversationEntryHopsQuery`, `buildConversationHopCountQuery`,
      `buildConversationEntryBodiesQuery` — with the constants only they used
      (`CONVERSATION_ENTRY_HOP_LIMIT`, the hop-count alias) from
      `src/constants/analytics/conversations-trace.ts`.
- [x] 5.3 Delete `src/utils/analytics/conversation-transcript.ts` and, from
      `src/utils/analytics/conversation-bodies.ts`, the two exports only it read: `transcriptMessagesOf` and
      `RecordedMessage`. Everything else in that file keeps a reader in `utils/analytics/hop-inspector/`.
- [x] 5.4 Remove the transcript models from `src/models/analytics/conversations-trace.ts` —
      `ConversationTranscript`, `TranscriptState`, `TranscriptStatePresentation`, `ConversationMessage`,
      `ConversationEntryHopRow`, `ConversationEntryBodyRow` — checking each for a remaining reader in the
      inspector's own row types before deleting it.
- [x] 5.5 Drop `isReadable` from the body-fields shape in
      `src/utils/analytics/conversation-column-catalog.ts` and from the grant shape it feeds, and
      rewrite the comment that explains the conjunction: the per-side grants are what callers read now, and a
      combined flag would withhold a readable request history over an unreadable answer.
- [x] 5.6 Sweep the removed surface's i18n keys out of `src/constants/i18n.ts` and `src/locales/en.ts` — the
      view-switch labels and its unavailable reason, the four transcript state statements and their hints, the
      transcript turn-truncation notice, the back-to-transcript label, and the transcript role labels — by
      grepping each key for a remaining reader first. An unused enum member is not a lint error, so this is a
      deliberate pass rather than a build failure.

## 6. Tests

- [x] 6.1 Add `src/components/Common/SplitPane/tests/utils.spec.ts` for the clamp and the step: a request
      below the floor, above the complement of the floor, exactly at each floor, and a step that would cross
      one.
- [x] 6.2 Add `src/components/Common/SplitPane/tests/SplitPane.spec.tsx`: both sections render, the separator
      is found by role with its accessible name, `aria-valuenow` starts at 50 and reports the floors, an arrow
      key moves it by the step, Home and End reach the floors and go no further, and the value never leaves
      the legal range. Query by role only — `re-resizable` renders its own wrapper element and a structural
      query would break on a library upgrade.
- [x] 6.3 Rewrite `Detail/Inspector/tests/HopInspector.spec.tsx` for the three-tab set: the fixed order, a
      span offering Request and Chat but not Response keeping their relative order, the active tab surviving a
      change of span, a fallback when the newly selected span does not offer it, no Chat tab for an MCP or
      embedding span, an MCP span rendering a tab strip with its arguments on Request and its result on
      Response while its method/tool/toolset stay visible on both, an embedding span stating its dimension
      count on Response, and the response read staying unissued on Request but issued on Chat.
- [x] 6.4 Add a spec for `use-span-body-tabs` covering each grant combination — both sides, request only,
      response only, neither — against an LLM hop, an MCP hop, an embedding hop and a hop whose event kind is
      unrecognised.
- [x] 6.5 Add `tests/HopChatPanel.spec.tsx`: the history renders in recorded order with a role on every turn,
      a system turn is distinguishable from a user turn, the trailing answer renders from the response, no
      trailing turn appears when the response yields no text, the withheld-answer statement appears when the
      response column is absent, a clamped turn offers its full-text affordance, and an empty envelope states
      so rather than rendering an empty conversation.
- [x] 6.6 Rewrite `tests/ConversationTraceView.spec.tsx` for the split: the tree and the bodies section both
      render with the rail beside them, the rail states the span's facts and no request or response, and a
      span with no granted body column renders the tree with no separator.
- [x] 6.7 Update `tests/ConversationDetailView.spec.tsx` and delete the transcript-only specs — the
      `ConversationTimeline` spec, `utils/analytics/tests/conversation-transcript.spec.ts`, and the
      `getConversationTranscript` cases in
      `src/app/[lang]/conversations-trace/tests/detail-actions.spec.ts`. Assert in
      `tests/detail-page.spec.tsx` that the page passes no transcript-readable prop, and drop the `isReadable`
      expectations from the availability cases there and in
      `utils/analytics/tests/conversation-column-catalog.spec.ts`.
- [x] 6.8 Cover the MCP and embedding halves through `HopInspector.spec.tsx` rather than in standalone panel
      specs — the tab gating is what decides which half renders, so that is where the behaviour is: arguments
      on Request and result on Response, the row facts visible on both, no Chat tab for either kind, a
      withheld result stated on the Response tab, and an embedding dimension count stated as withheld there
      rather than as absent.
- [x] 6.9 Put any new mock in `apps/ai-dial-admin/test-setup.tsx` rather than inline in a spec, and assert the
      i18n keys the mocked `t()` returns rather than translated text.

No `spec-browser-verify` task: the change's browser-observable scenarios are covered by the component specs
in this group instead, by the user's decision on this change.

## 7. Blank edges in recorded message text

- [x] 7.1 Add `withoutBlankEdges` to `src/utils/analytics/hop-inspector/envelope.ts`: drop the entirely-blank
      lines at the two ends of a recorded text, keeping the indentation of the first line that has content —
      `trim()` would take that indentation with them, which is wrong for a message opening with a code block.
      Answer `null` for a missing text, since that is a message with no `content` key rather than one with
      empty content.
- [x] 7.2 Apply it in `messagesForDialect` (`hop-inspector/dialect.ts`), which is the one path every message
      text takes — all three dialects, the envelope builder and the tier-2 read of one message in full — and
      in `responseEnvelopeOf` (`hop-inspector/response.ts`) for the answer and the reasoning summary. Leave
      every byte size and clamp measured against the recorded body.
- [x] 7.3 Treat a blank answer as no answer in `HopChatPanel`: with the edges gone an all-whitespace response
      resolves to an empty string, and an empty trailing bubble would read as something the model said.
- [x] 7.4 Tighten the bodies section's top padding in `ConversationTraceView`: the tree's own bottom padding
      and the separator's grip strip already sit between the sections, and a full pad above the tab strip
      stacked into a visible void.
- [x] 7.5 Specs: `hop-inspector/tests/envelope.spec.ts` for the util (a leading newline, several blank lines
      at both ends, interior blank lines kept, first-line indentation kept, a carriage-return line, blank
      throughout, `null`) and for the dispatcher stripping every message while leaving recorded sizes alone;
      a `HopChatPanel` case for a blank answer adding no turn.

## 8. The call a result answers

- [x] 8.1 Add `id` to `HopToolCall`, `answeredCallIds` / `isError` to `HopDialectMessage`, and the resolved
      `answers: HopToolAnswer[]` / `isError` to `HopMessageEntry` in
      `src/models/analytics/conversations-trace.ts`. `HopToolAnswer` pairs a call id with its tool name —
      two parallel lists would differ in length whenever an id resolves to no call and would then pair the
      wrong result with the wrong tool.
- [x] 8.2 Read the ids in the parsers: `chat-completions.ts` takes the call's `id` from the call itself
      (it sits beside `function`) and the answered id from the message's `tool_call_id`; `messages.ts` takes
      `id` from a `tool_use` block, and every `tool_use_id` plus `is_error` from the `tool_result` blocks —
      that dialect feeds several results back in one message, so the pairing is a list. Leave
      `responses.ts` stating no pairing: it spells a call as a `function_call` item, but tool use is
      unexercised on that endpoint and no recorded hop carries one, so no handling is invented for a shape
      that has never been measured.
- [x] 8.3 Resolve the pairing in `buildRequestEnvelope`: build the id → tool-name map across the whole
      message list, since a result carries only an id and one message cannot answer the question alone. Never
      withhold it past the envelope's budget — it is a handful of characters and it is what makes a result
      legible.
- [x] 8.4 Add `shortCallId` to `src/utils/analytics/conversation-formatting.ts` (the id's tail; provider ids
      run to 33 characters and share their first half) and `HopToolAnswerLine` under `Detail/Inspector/`,
      stating what a message answers and marking a failed result in words as well as by colour. Render it in
      both `HopMessageRow` and the chat turn, and state the call's own id tail in `HopToolCalls`.
- [x] 8.5 Move `HopParamsLine` out of the slot above the tab strip and into the Request tab: it describes the
      request body, and above the strip it sat over the Response tab describing something else. Only hop-row
      facts stay above it.
- [x] 8.6 Specs: the parsers for ids, multiple answered ids and `is_error`; `buildRequestEnvelope` for the
      resolved pairing, an id matching no call, a call with no id of its own, and the failure flag; a
      `HopChatPanel` case for the answer line and the failed marker.

## 9. One presentation for a message, and no verdict on its size

- [x] 9.1 Extract `HopMessageCard` from `HopMessageRow` — role label, optional position, optional size, an
      aside for what the message answers, a body and a footer — and render the assembled response through it
      in `HopResponsePanel`. A response is one assistant message; stating it as bare text made the two tabs
      read as two different tools. Move `ROLE_LABEL_KEY` to `constants/analytics/conversations-trace.ts` as
      `MESSAGE_ROLE_LABEL_KEY`: three components read it, and leaving it on `HopMessageRow` made the card
      and the row import each other.
- [x] 9.2 Carry the response's calls as `HopToolCall[]` rather than names: `toolCallRequestsOf` and
      `responsesToolCallsOf` take the arguments and the id the body already records, and `HopToolCall`
      replaces the duplicate `ToolCallRequest` shape. `unansweredToolNamesOf` still compares by name, so the
      caller maps.
- [x] 9.3 Remove the large-message marker and the warning border it drove: drop `isLarge` from
      `HopMessageEntry`, `isLargeMessage` and `LARGE_MESSAGE_BYTES`, and the `InspectorMessageLarge` key.
      Every message states its own size, which is the honest form of the same fact — a threshold turns a
      continuum into a verdict, and the border made a routine 1 KB system prompt look like a fault.
- [x] 9.4 Replace the Response tab's two-mode control with one ui-kit `Switch` labelled Raw, and offer the
      same switch on the Request tab so the recorded bytes are one control in one place. Delete
      `HopResponseMode` and the three mode labels — "assembled" was never a mode a reader chose. Hide the
      role filter while the bytes are shown: it narrows a list, and the bytes are not a list.
- [x] 9.4a Mark a chosen filter with `SELECTED_CHIP_CLASS` (`border-accent-primary`,
      `bg-accent-primary-alpha`, `text-accent-primary`) rather than `bg-layer-4`, in both the tree's filter
      bar and the request's role filter, and lift `FILTER_CHIP_CLASS` into the constants file now that two
      surfaces read it. A chip filled with the next background layer read as a slab of background rather than
      as a selection. ui-kit's 2.0 `Tag` is the design system's own chip and its `selected` state is
      accent-tinted, but it documents no `aria-pressed`, and `a11y.md` requires the pressed state to be
      programmatic — so the `aria-pressed` buttons stay and only the selected styling changes.
- [x] 9.5 Swap the full-message control from `OutlinedButton` to ui-kit's 2.0 `LinkButton` in both the row
      and the chat turn: inside a bordered card a second border reads as a nested panel, and a link button
      carries no fill, so the `--bg-control-*` hover override the filled buttons need drops out with it.
- [x] 9.6 Show the recorded body through `Common/CodeViewer` instead of a `<pre>`: Monaco with json
      highlighting, folding, a copy control and a fullscreen view, pretty-printed where it parses and shown
      as recorded where it does not. Give the viewer a `defaultOpen` — it is collapsed by default for callers
      that stack several, and a reader who turned the raw switch on has already asked for this one. Mock
      `@monaco-editor/react` in `test-setup.tsx` beside the ECharts stub, per `testing.md` §5.
- [x] 9.7 State the response's facts above the message card rather than after it: the tab holds one answer,
      so what answered and at what cost heads the reply instead of trailing a card the reader scrolls past.
- [x] 9.7a Visual pass on the bodies section: the pinned control rows move from `bg-layer-2` (the rail's
      ground, which this panel left) to `bg-layer-1`, the raw switch is right-aligned on both tabs and its
      label takes the weight of the controls beside it, and the full-text control moves inside the chat
      bubble — below it, it read as a control for the conversation rather than for the turn.
- [x] 9.8 Name every parameter the request body carried instead of counting the unrecognised ones: in
      `hop-inspector/params.ts` the recognised list becomes an ordering rather than an allow-list, and
      `unrecognisedCount` goes from `HopParams`, the line, the two empty-params fixtures and the i18n key.
      The count existed to keep an unbounded list out of a 360px rail, and the line no longer lives there —
      it said something existed while refusing to name it. Structural members and blob-valued parameters keep
      their existing treatment.
- [x] 9.8a Narrow the excluded set to the members the history renders in full — the message list, its
      per-dialect spellings and the system prompt. The requested `model` is stated (the row's deployment is a
      different string), and the DIAL state envelopes are stated by their key count, which is how a reader
      sees why a message's recorded size runs past its visible text.
- [x] 9.9 Open a trace on its entry hop (null `core_parent_span_id`) rather than on its earliest span, in
      `use-conversation-trace.ts`. That hop's history *is* the conversation, so it is what a reader who has
      not picked a hop should land on — and the earliest span is not reliably it: a Core-internal root can
      fire long after the hop it belongs to.
- [x] 9.10 Make Chat state the exchange rather than the whole history: keep the user and assistant turns that
      carry text and leave the machinery — system prompts, tool results, tool-call-only turns — to the
      Request tab. Exclude a message that answers a recorded call whatever role it wears, because the messages
      dialect feeds results back under the user role. Rendering everything made the tab the Request tab in
      different clothes on a nested model call, which is the whole reason it exists. A history with no
      exchange in it states that instead.
- [x] 9.11 Rename the symbols still named after the deleted transcript, since they now describe per-span hop
      bodies only: `ConversationTranscriptAvailability` → `HopBodyGrants`,
      `TranscriptBodyFields` → `HopBodyFields`, `transcriptBodyFields` → `hopBodyFields`,
      `getConversationTranscriptAvailability` → `getHopBodyGrants`, `TRANSCRIPT_REQUIRED_FIELD` →
      `HOP_REQUEST_BODY_FIELD`, `TRANSCRIPT_RESPONSE_FIELDS` → `HOP_RESPONSE_BODY_FIELDS`. Behaviour
      unchanged; no spec names any of these types, so this is a rename only. Supersedes the "keep" wording in
      5.1 and 5.5, which predated it.
- [x] 9.12 Specs: the streamed decoder keeping the id its first chunk carried; both dialects' response calls
      stating arguments and id; the inspector's mode control queried as a button rather than a tab.

- [x] 9.13 Bound a stated parameter value with `DialEllipsisTooltip`: with the allow-list gone any body
      member reaches the line, and one long passthrough value inside `whitespace-nowrap` gave the bodies
      section a horizontal scrollbar. The tooltip keeps the whole value reachable, which a bare truncation
      would not.

## 10. The Runs drawer's own handle

- [x] 10.1 Two adjacent fixes to `Runs/Details/BottomDrawer/ResizeHandle.tsx`, kept in place rather than
      merged with `SplitPane`: the grip's `bg-tertiary` is a background token the palette does not define
      (`tertiary` exists only in `borderColors`), so it rendered invisibly — the same silent failure
      `a11y.md` warns about — and the same class was doing nothing in five other places, which are fixed
      too. And the separator gains the keyboard operation
      `openspec/specs/analytics-bottom-drawer/spec.md` has required all along and never had: Arrow Up/Down
      at 20px, Shift+Arrow at 100px, with `aria-value*` reporting the live bounds and a `clampDrawerHeight`
      util under test. No spec text changes — this satisfies an existing requirement rather than adding one.

## 11. Quality checks

- [x] 11.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; run
      `npx vitest run <file>` from `apps/ai-dial-admin/` while iterating. Resolve every failure before the
      change is complete.
