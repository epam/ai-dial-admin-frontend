## Why

The Chat view answers a conversation-level question — what the user asked and what came back — but a
reader inside a trace is asking a per-hop one: **what did this span actually see**. A deep hop's history
carries sub-agent system prompts, tool results and intermediate assistant turns that the conversation
transcript never shows, and that history is precisely what makes a failed hop legible.

The current layout also cannot hold what it is being asked to hold. Inside a trace the reader gets one
360px rail that must carry the span's facts, its request and its response at once; the facts block is
already capped at `max-h-[35%]` with a comment explaining that at natural height it left the message
history about 130px — one chip row and a sliver. Request, response and a conversation history do not fit
in a rail.

Nothing is lost by the conversation-level transcript going away: the transcript is assembled from entry
hops, and an entry hop's own request body is what the assembly reads. Selecting a trace's entry span in
the tree shows the same history, in the same place as everything else about that trace.

## What Changes

- **The trace view's left column splits vertically.** The span tree keeps the top; a new bottom panel
  takes the bodies. The split is draggable, each section floored at **20%** of the available height,
  starting **50/50**. The separator is keyboard-adjustable, not pointer-only.
- **The bottom panel presents three tabs in fixed order: Request, Response, Chat.** Request and Response
  are the existing `HopInspector` sides, moved out of the rail unchanged in behavior.
- **Chat is new and span-scoped**: the selected span's request-envelope messages rendered as a
  conversation, with the span's assembled response text as the trailing assistant turn. Every turn states
  its role, so a system prompt can never read as something a person typed. No new server read — the
  request envelope is the same one the Request tab already fetches.
- **The span rail keeps the span's facts only** — kind, outcome, recorded time, tokens, duration,
  endpoint, upstream, caller, HTTP status, cost, MCP method/tool, routing chain — and gives up the
  inspector it was competing with.
- **BREAKING (UI):** the conversation detail view loses its Chat/Trace switch and renders the trace
  listing alone. The per-turn "open trace" control on an assistant message goes with the Chat view; a
  trace is opened from the listing.
- **Removal:** the conversation-level transcript pipeline becomes unreachable and is deleted — the
  `getConversationTranscript` server action and its transcript-only helpers, `useConversationTranscript`,
  `ConversationTimeline`, `ConversationViewSwitch`, `questionsByTurn`, `transcriptStateOf`,
  `assembleTranscript`, the transcript entry-hop/body/count queries, and the `TranscriptState` /
  `ConversationTranscript` / `ConversationDetailView` models.

## Non-goals

- **No change to how bodies are read.** The tiered read (envelope → one message in full → raw), its
  clamps, its server-side decoding and its per-side schema gating all stay exactly as they are.
- **No change to the trace listing, the conversation header, the insights/feedback rail, or the grid.**
- **No conversation-level chat in another guise.** The transcript is not relocated to a modal, a route or
  a fourth tab; the trace's entry span is where a whole-conversation reading now comes from.
- **No new backend query and no analytics-service contract change.**
- **No timeline, offset or duration bar** in the new panel — the existing prohibition stands.
- **The 20% floor is not a collapse.** Neither section gets a collapse-to-zero control.

## Capabilities

### New Capabilities

None. This restructures behavior the analytics master spec already covers.

### Modified Capabilities

- `analytics`: the conversation detail view no longer switches between Chat and Trace; a span's request
  and response move from the rail into a resizable bottom panel that adds a span-scoped Chat tab; the
  conversation-level transcript assembly is removed.

## Impact

**Restructured**

- `Analytics/ConversationsTrace/Detail/ConversationTraceView.tsx` — composes the vertical split
- `Analytics/ConversationsTrace/Detail/ConversationSpanDetail.tsx` — facts only, drops `HopInspector`
- `Analytics/ConversationsTrace/Detail/Inspector/HopInspector.tsx` — third tab, own tab enum, response
  read enabled for Chat as well as Response
- `Analytics/ConversationsTrace/Detail/ConversationDetailBody.tsx` — trace listing only
- `Analytics/ConversationsTrace/Detail/ConversationDetailView.tsx`,
  `app/[lang]/conversations-trace/[id]/page.tsx` — `isTranscriptReadable` prop drops out

**New**

- `Common/SplitPane/` — domain-free vertical split on `re-resizable` (already a dependency, per
  `components.md` §5) with a fractional floor and an accessible separator
- `Analytics/ConversationsTrace/Detail/Inspector/HopChatPanel.tsx` + a message component

**Deleted**

- `Detail/ConversationTimeline.tsx`, `Detail/ConversationViewSwitch.tsx`,
  `Detail/use-conversation-transcript.ts`
- `getConversationTranscript` and `resolveTranscriptFigures` in
  `app/[lang]/conversations-trace/actions.ts`, plus the transcript-only query builders and
  `utils/analytics/conversation-transcript.ts` helpers no other reader uses
- transcript models in `models/analytics/conversations-trace.ts`

**Shared code touched** — the body-column grant stays (it gates the inspector's two sides), but its
`isReadable` member loses its last reader, and the symbols named after the transcript are renamed for what
they now describe: `ConversationTranscriptAvailability` → `HopBodyGrants`, `TranscriptBodyFields` →
`HopBodyFields`, `transcriptBodyFields` → `hopBodyFields`, `getConversationTranscriptAvailability` →
`getHopBodyGrants`, and the two `TRANSCRIPT_*` field constants to `HOP_*`. `RatingCounts`,
`attributeRatingsToTraces`, `traceGroupsOf` and `paddedUtcDayRange` all keep readers in the trace
listing and are untouched.

**Tests** — `ConversationTraceView`, `HopInspector`, `ConversationDetailView`, `ConversationTimeline`,
`detail-page` and `detail-actions` specs all move or shrink; new specs for the split pane and the chat
panel.

**Docs/specs** — the analytics master spec's transcript and view-switch requirements are removed or
rewritten in this change's delta.
