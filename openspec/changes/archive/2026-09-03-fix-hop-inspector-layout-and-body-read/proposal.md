## Why

Three defects surfaced while reading a real trace in the conversations-trace hop inspector:

- **The bodies panel opens with metadata rather than with its own control.** An MCP hop's method, tool
  and toolset render above the tab strip, so the first thing under the tree is a row of facts and the
  strip that selects what the panel shows sits second.
- **An MCP tool call's result is unreadable when it is JSON.** The text recorded by a tool is stated
  exactly as it was recorded — a single line with escaped newlines — and a `tools/call` result is
  routinely a JSON document, which is the case the inspector exists to read.
- **Nine MCP protocol methods are blank on both tabs.** `initialize`, `notifications/initialized`,
  `tools/list` and six more are settled as having no content without reading anything — but the log records
  their status, their two sizes and their duration, and for `initialize` and `tools/list` a real body as
  well. What that rule protected was the tool catalogue, which is a policy about what to render, stated as
  if it were a fact about the log.
- **The raw switch sits at the wrong end of the panel, and the response's facts vanish behind it.** The
  switch heads the panel it governs instead of closing it, and turning it on withdraws the line stating what
  answered — which describes the same response whichever form of it is on screen.
- **A hop that recorded an empty session header states that it recorded nothing.** The bodies read is
  still located with the session-scope predicate; a Core-internal call recorded under the trace carries
  no session header, so the read matches no row and Request, Response and Chat all report an absent
  body for a hop whose body the log holds. The span-tree read already dropped that predicate, for this
  exact reason — the two reads disagree about which hops of one trace exist.

## What Changes

- The **tab strip becomes the first element of the bodies panel**. The hop-row facts line moves
  directly below it and stays outside the scrolling body, so it is still visible on every tab.
- **An MCP hop's request and response render as pretty-printed JSON** where the recorded text is JSON,
  and unchanged where it is not. The recorded-size and clamp statements keep describing the bytes the
  log recorded, not the reformatted text.
- **The hop body read is located by trace, span and recorded time alone.** The session-scope predicate
  is dropped, matching the span-tree read.
- **Every hop states how its call went before any body is read** — the recorded status with its reason
  phrase, the size of each side, the duration — from hop-row columns the tree already carries, so the
  statement holds for a hop whose bodies are withheld or absent. The status moves here from the span's facts
  rail, so one fact keeps one home.
- **A protocol hop states its two bodies**, as the JSON they were recorded as, formatted and clamped — the
  parameters sent on Request, the result answered with on Response. Every method is stated the same way,
  including one this console has never met, so no method can be blank for want of a decoder.
- **The request's parameter line is curated**: the model heads it, the named settings follow, and every other
  member of the body is counted with its names carried rather than listed.
- **The raw switch moves to the end of both panels**, staying reachable without scrolling the body to its
  end, and **the facts stated about a hop stay stated over the recorded bytes** — only the control that
  narrows the structured view is withdrawn there.
- **The strip, the hop-row facts and the body share one opaque surface**, with no transparent band at the
  seam of the pinned control.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the bodies section's layout rule (hop-row facts below the strip rather than above it),
  the MCP hop's presentation of its two bodies (pretty-printed JSON), and the entitlement/location rule
  for the hop body read (no session predicate).

## Non-goals

- The LLM request and response panels, the raw view and the Chat tab keep their current rendering; only
  the MCP hop's two bodies gain reformatting.
- The transport line states what the hop row already carries. Body-derived transport facts — the count of
  streamed frames among them — are not part of it: they would cost a read on every hop, which is the
  opposite of what makes this line free.
- The tool-catalogue rule still governs a model call's own request line, where the catalogue is one member of
  a body opened for other reasons. A `tools/list` hop is not that case — it *is* the catalogue, and it is what
  the reader selected the span to see.
- No change to the clamp budgets, nor to which body columns a caller is entitled to read — the column
  grants resolved from the entity schema stay the sole entitlement boundary.
- No change to the tab set, the tab order or which tabs a span offers.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopInspector.tsx` —
  the facts slot moves below the strip.
- `.../Inspector/HopMcpFactsLine.tsx` — its placement note.
- `apps/ai-dial-admin/src/utils/analytics/hop-inspector/mcp.ts` — reformatting of both sides, with the
  recorded size preserved for the clamp statement.
- `apps/ai-dial-admin/src/utils/analytics/conversations-queries.ts` —
  `buildConversationHopBodyQuery` drops `sessionScopePredicate`.
- `.../Inspector/HopRequestPanel.tsx`, `.../Inspector/HopResponsePanel.tsx` — the raw switch moves to the
  end of the panel; the response's facts line renders in both modes.
- `.../Detail/ConversationSpanDetail.tsx` — the HTTP status row leaves the rail for the transport line.
- `apps/ai-dial-admin/src/utils/analytics/hop-inspector/` — a protocol-facts decoder per method;
  `src/utils/analytics/conversation-spans.ts` — the suppression rule for protocol methods.
- Specs: `openspec/specs/analytics/spec.md` (the master Analytics spec).
- Tests: `.../Inspector/tests/HopInspector.spec.tsx`, the `conversations-queries` and
  `hop-inspector/mcp` unit specs.
