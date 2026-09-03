## 1. The bodies panel opens with its own control

- [x] 1.1 In `apps/ai-dial-admin/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopInspector.tsx`,
      render `Tabs` before `HopMcpFactsLine` inside the non-scrolling header block, leaving both outside the
      scroll container. The facts line stays a sibling of the strip, not a child of a tab: it is stated on
      every tab, and moving it inside the scroll container would let it scroll away under the longest content
      the section renders. Rewrite the block's comment, which currently explains the slot as being *above*
      the strip.
- [x] 1.2 Update the doc comment on `Detail/Inspector/HopMcpFactsLine.tsx` — it states the placement as a
      design decision ("They render above the tab strip, in the slot the request's parameters occupy") and
      that slot no longer describes where either line sits. The component itself needs no change.

## 2. Both halves of an MCP hop read as formatted JSON

- [x] 2.1 Add `apps/ai-dial-admin/src/utils/analytics/hop-inspector/json-text.ts` with the two pure functions
      the formatting rule needs: one taking a parsed value and serialising it indented, one taking recorded
      text and answering the formatted form where it parses and the original text where it does not. Neither
      throws — a tool result that is not JSON, or a document already cut by a clamp, is content the inspector
      still has to render. Per `utils.md`, no DOM and no i18n here.
- [x] 2.2 Give `clampToBudget` in `hop-inspector/envelope.ts` an optional recorded byte count, defaulting to
      the byte length of the text it is handed. `recordedBytes` in the clamp it returns is what the reader is
      told the log holds, so once a caller hands it reformatted text that number has to come from the caller
      instead of from the text. Existing callers (the embedding probe text, the raw body read) pass nothing
      and keep their current numbers.
- [x] 2.3 In `apps/ai-dial-admin/src/utils/analytics/hop-inspector/mcp.ts`, format the decoded response text
      **before** clamping it and pass the recorded text's byte length into `clampToBudget`. Formatting after
      the clamp would leave every result large enough to be cut — the ones a reader cannot scan by eye —
      unformatted, and re-deriving the recorded size from the formatted text would report a size the log
      never held.
- [x] 2.4 Route the arguments through the same serialiser: `jsonRpcArgumentsOf` in
      `apps/ai-dial-admin/src/utils/analytics/conversation-bodies.ts` already re-serialises the parsed
      arguments indented, so replace its inline `JSON.stringify(args, null, 2)` with the helper from 2.1.
      One rule, one place — the two halves of one hop must not drift into two indentation styles.

## 3. A hop's bodies are located the way its row was

- [x] 3.1 Drop `sessionScopePredicate(scope)` from `buildConversationHopBodyQuery` in
      `apps/ai-dial-admin/src/utils/analytics/conversations-queries.ts`, keeping the trace id, the span id and
      the recorded-time equality. Record against it the reason `buildConversationSpansQuery` already carries:
      a span recorded with an empty conversation header — a Core-internal call under the trace — matches no
      row under that predicate, so the tree offers a row whose every tab reports that the hop recorded
      nothing. Leave the `scope` parameter on the builder's signature and on the server actions: the callers
      pass it and the hold key in `use-hop-envelope.ts` is scoped by it.
- [x] 3.2 Confirm nothing else in the hop-body path re-applies the predicate — `readHopBody` in
      `src/app/[lang]/conversations-trace/actions.ts` builds the query and resolves the column grants from
      the cached entity schema, and those grants stay the only gate on body content.

## 4. Tests

- [x] 4.1 Unit-test the formatter from 2.1 in `src/utils/analytics/hop-inspector/tests/`: a JSON document
      comes back indented, a non-JSON string comes back byte-identical, and a truncated document comes back
      unchanged rather than throwing.
- [x] 4.2 Extend `src/utils/analytics/tests/` coverage of `mcpFactsOf`: a JSON result is formatted, its clamp
      states the recorded size rather than the formatted one, and a non-JSON result is untouched.
- [x] 4.3 Extend `src/utils/analytics/tests/conversations-queries.spec.ts`: the hop body query filters on the
      trace id, the span id and the recorded time, and carries no session or conversation predicate.
- [x] 4.4 Extend
      `src/components/Analytics/ConversationsTrace/Detail/Inspector/tests/HopInspector.spec.tsx`: the tab
      strip precedes the hop-row facts in document order, the facts stay present after switching tabs, and an
      MCP hop renders its formatted result on the Response tab. Follow `testing.md` — query by role and
      accessible name, and assert i18n keys rather than translated text.

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill against this change's browser-observable scenarios (the strip
      heading the section, the hop-row facts below it and stable across tabs, a formatted MCP result, and a
      hop recorded with an empty conversation header stating its body). Requires the local stack running with
      auth disabled. Resolve every `fail` verdict before the change is complete.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, and the test suite from `apps/ai-dial-admin/`, and fix what
      they report.

## 7. The transport line: how the call went, from the hop row

- [x] 7.1 Add the transport facts to `src/utils/analytics/conversation-spans.ts` as a pure derivation from the
      hop row — the recorded status, its reason phrase, the two recorded sizes and the duration — reusing
      `isFailedHop` for whether it reads as failed rather than re-deriving that test. Put the status-to-reason
      mapping in `src/constants/analytics/conversations-trace.ts`; a status the map does not name states its
      number alone, which is still the truth.
- [x] 7.2 Add `Detail/Inspector/HopTransportLine.tsx` stating those facts, with the status as its own marked
      element carrying an accessible name — colour is not the statement. It renders from the row alone, so it
      renders for every hop, including one whose bodies are withheld, absent or suppressed. It takes the side
      it is stating: the verb and the size sent on the request, the status, the size received and the duration
      on the response, both together only where a hop offers no tab at all.
- [x] 7.3 Render it in `HopInspector` on each side, in one wrapping row with that side's own facts — beside
      `HopParamsLine` on the request, beside `HopResponseFactsLine` on the response, and on neither for Chat.
      `HopResponseFactsLine` moves out of `HopResponsePanel` for this, which also keeps it stated over the
      recorded bytes. Remove the `HTTP status` row from `Detail/ConversationSpanDetail.tsx` — the status moves,
      it is not stated twice. Leave the rail's upstream URI, duration and timestamps alone.
- [x] 7.4 Give the header block and the scroll port one continuous ground in `HopInspector`: the gap between
      the strip and the body becomes padding inside that ground rather than a transparent band between two
      boxes.

## 8. Protocol hops state what their method carries

- [x] 8.1 Change `hopSideSuppressionsOf` in `src/utils/analytics/conversation-spans.ts` so a protocol-envelope
      method is no longer suppressed on both sides. Keep a suppression only where the log holds nothing —
      a notification, whose protocol defines no response body — and give it its own reason so the panel can
      say "the protocol defines no body here" rather than "this hop recorded nothing". Add the i18n key.
- [x] 8.2 Add `src/utils/analytics/hop-inspector/protocol.ts` stating a protocol hop's two halves as the JSON
      they were recorded as, formatted: the parameters the client sent and the result the server answered
      with, the result clamped through `clampToBudget` with the recorded size measured before formatting.
      Every method is stated the same way — a first pass decoded each into named facts, which described a
      response instead of showing one and left a method with no decoder blank.
- [x] 8.3 Teach the response decode path that a JSON-RPC frame's `result` is not always
      `result.content[].text`. `decodeJsonRpcStream` in `src/utils/analytics/conversation-bodies.ts` reads
      only the `tools/call` shape today, which is why lifting the suppression alone would leave the panels
      empty; return the frame's `result` and let the caller pick from it.
- [x] 8.4 Add a server action reading a protocol hop's bodies, alongside `getConversationHopMcp` in
      `src/app/[lang]/conversations-trace/actions.ts`, and the two panels stating them —
      `HopProtocolRequestPanel` on the Request tab, `HopProtocolResultPanel` on the Response tab, per the
      column each comes from. Wire them in `HopInspector` beside the MCP and embedding branches, routed by an
      MCP hop having called no tool rather than by a list of known methods: a method outside such a list fell
      through to the tool-call reader and rendered an empty block.

## 9. The raw switch closes the panel

- [x] 9.1 Move the switch out of the pinned header in `Detail/Inspector/HopRequestPanel.tsx` and
      `Detail/Inspector/HopResponsePanel.tsx` to the end of the panel, pinned to its bottom edge so it stays
      reachable without scrolling a half-megabyte body to its end. The role filter stays where it is — it is
      the control *for* the list and belongs above it.
- [x] 9.2 In `HopResponsePanel`, lift `HopResponseFactsLine` out of the non-raw branch so what answered is
      stated in both modes. The role filter stays withdrawn over the recorded bytes: a control that narrows a
      list has nothing to narrow there.

## 10. Tests and verification for the follow-up

- [x] 10.1 Unit-test the transport derivation and the protocol read in `src/utils/analytics/tests/` and
      `src/utils/analytics/hop-inspector/tests/`: a 202 reads as successful, a 400 as failed, an unnamed
      status states its number, a protocol result is stated as formatted JSON whatever its method, the size
      stated is the recorded one rather than the formatted one, and a withheld column is stated as withheld.
- [x] 10.2 Extend the inspector component tests: a hop with withheld body columns still states its status and
      sizes; a protocol hop states its facts instead of reporting that nothing was recorded; a notification
      states that the protocol defines no body; the raw switch is the last element of both panels; the
      response's facts line is present with the raw switch on.
- [x] 10.3 Run the `spec-browser-verify` skill against the follow-up's browser-observable scenarios (the
      transport line on a protocol hop, `initialize` and `tools/list` stating their facts, the switch at the
      end of both panels, the facts line surviving raw mode). Resolve every `fail` verdict before the change
      is complete.
- [x] 10.4 Re-run `npm run lint`, `npm run format` and the test suite from `apps/ai-dial-admin/`.

## 11. The facts line, to the design

- [x] 11.1 Curate the request line: the model heads it, the four named settings follow, and every other member
      of the body is counted rather than listed — `paramsOf` answers with `rest`, the names travelling in the
      count's accessible name. The recorded bytes hold the values, one control away.
- [x] 11.2 Drop the message count where the role filter states it: `HopParamsLine` takes it only when the
      envelope carried no message list, which is the case the hop row's own column exists for.
- [x] 11.3 State an object-valued parameter by the names of its members rather than by how many it had:
      `stream_options 1` said something was set while refusing to say what.
- [x] 11.4 Render each side as one bar on the section's raised ground — direction arrow, the verb as a chip on
      the request and the status as a chip on the response, the named facts, and the raw control at its end.
      The response arrow takes the outcome's colour and a failed line takes an error border, with the status
      still saying it in words.
- [x] 11.5 Replace the raw toggle with the chip the role filter is made of, carrying `aria-pressed`: a switch
      widget on a line of facts read as a setting for the screen, and its accessible node was not the thing a
      pointer could reach.
- [x] 11.6 Answer an unreadable response body with the recorded bytes, as the request side already does. On a
      failed hop those bytes are the error payload, and `NoBody` reported them as nothing recorded.
- [x] 11.7 State a protocol hop's two halves as the recorded JSON, formatted, and drop the per-method fact
      extraction with it: `HopProtocolFacts` carries `requestText` and `resultText` like the MCP tool call
      beside it, and the panels render them through `HopFactBlock`.
- [x] 11.8 Give every "nothing to show" statement one treatment — `HopStateNote` takes a message key for the
      cases its state map does not cover, so a request with no parameters reads like every other absence.
- [x] 11.9 Colour the control that opens a turn in the roles' own accent and pin it to the start of the
      bubble: stretched by the column it sat in, its label centred itself.
- [x] 11.10 Make the split handle read as something to take hold of: a grip on the section's own ground with
      two rules inside it, so the divider stops at its edges instead of running through a bar that looked like
      one more line on a screen full of them. Keyboard behaviour and the separator's value state are untouched.
- [x] 11.11 Keep tool traffic out of the Chat turns. A turn rendered the call it made — the tool, its
      arguments and its id — inside the bubble, which is machinery the tab exists to leave out; the rule was
      already written and the code did not hold to it. The Request and Response tabs state that traffic in
      full, which is where a reader goes for it.
- [x] 11.12 State the failed read in the same note every other absence uses, marked by its border and its
      words rather than by a filled banner, and give Chat's own "no exchange here" the same shape.

## 12. Review findings

- [x] 12.1 Record the two reversed rules in the delta rather than leaving the master spec asserting the
      opposite: unrecognised parameters are counted with their names carried, and the response line drops the
      completion id and states the answering model only where it differs from the one asked for.
- [x] 12.2 Correct `proposal.md`, `design.md` and tasks 8.2 / 8.4 / 10.1, which still described the per-method
      protocol decoder that was deleted — the archived rationale is the "why" this repo keeps.
- [x] 12.3 Unwind the two nested ternaries `code-standards.md` forbids, in `hop-inspector/response.ts` and
      `HopStateNote.tsx`; the note goes back to an early return and states a failure with `role="alert"`.
- [x] 12.4 Stop offering the raw control where the panel is already showing the recorded bytes: on an
      unstructured response it flipped its own state and changed nothing.
- [x] 12.5 Route the protocol panels by "an MCP hop that called no tool" instead of the nine-method list, so
      `resources/read` and an unfamiliar notification stop rendering an empty result block.
- [x] 12.6 Carry the counted parameters' names as text rather than as an `aria-label` on a generic element,
      which ARIA drops.
- [x] 12.7 Give the request panel's "no messages" and Chat's "answer withheld" the same note treatment as
      every other absence.
- [x] 12.8 Clear the leavings: the dead `MCP_PROTOCOL_METHODS`, `MCP_INITIALIZE_METHOD`, `MCP_TOOLS_LIST_METHOD`,
      `RAW_LABEL_CLASS`, `InspectorCompletionId` and `SpanHttpStatus`; a comment in `actions.ts` that had
      become untrue; a constant sitting between two imports; an accent keyed off a translated label; the split
      handle reaching 4px onto the tab strip; and the eight copies of the loader block, now one component.
- [x] 12.9 Choose the facts line's border colour once instead of appending `border-error` to a class string
      already carrying `border-primary`: Tailwind settles two colour utilities by stylesheet order, not by the
      order of the class attribute, so the failed line painted the primary border and the failure was left to
      the chip alone. Caught by the browser gate, which measured the computed colour rather than the classes.

