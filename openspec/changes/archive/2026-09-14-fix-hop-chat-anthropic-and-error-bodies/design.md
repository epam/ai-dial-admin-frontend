## Context

See proposal.md — Why. What shapes the approach is what already exists: `dialectOf` maps `request_uri` to a
dialect, `messagesForDialect` routes the **request** through a per-dialect parser, and `messages.ts` already
reads that dialect's typed content blocks — `text`, `tool_use`, `tool_result` — for the request side. The
response side has no such routing: `responseEnvelopeOf` tests one dialect (`Responses`) and sends everything
else down the chat-completions path.

Two constraints come from the log rather than from the code. Roughly one recorded response in twelve stores a
frame transcript in the assembled column instead of a merged message, so "read the assembled column, it is
merged" is false on current rows. And a failed hop's body is usually present and structured — a JSON-RPC error
object or a bare string — so the failure case has something to state rather than only an absence to report.

## Goals / Non-Goals

**Goals:**

- One dialect mapping that governs both halves of a hop, so a dialect cannot be parsed on one side and
  fall through on the other.
- Format detection that is the same for the assembled column and the recorded body, since either can hold
  either form.
- A failure statement that a reader cannot mistake for a reply.

**Non-Goals:**

- Separating thinking from the answer. Deliberately out: it changes what the conversation looks like, it
  applies to the request history as much as the response, and it deserves its own decision.
- A dialect-shaped abstraction for the raw fallback in `conversation-bodies.ts`. Its three decoders are
  reached by body shape, not by endpoint, and rewriting that seam is a refactor this change does not need.
- Any new column, query or grant. Both sources are already read and already gated.

## Decisions

**The response decoder lives beside the request decoder, per dialect, not behind a shape sniff.**
`response.ts` gains a third branch keyed on the same `HopDialect` the request side uses, and `messages.ts`
gains the response reader — reusing its own block readers rather than growing a second copy of them.
*Alternative rejected:* detecting Anthropic shape by probing for `content_block_delta` or a top-level
`content[]` inside the existing chat path. It reads as the "told apart by body inspection" the dialect
requirement exists to forbid, and it would make the request and the response disagree about what a hop is on
any body that looks like both.

**Streamed frames are accumulated, not read from a terminal frame.** Unlike the Responses dialect, whose
`response.completed` frame carries the whole object, this dialect never restates the assembled message: the
text exists only as the concatenation of `content_block_delta` fragments, and tool arguments only as
`input_json_delta` fragments per block index. The block index is the slot key, exactly as `tool_calls[].index`
is in the streamed chat-completions decoder.

**Finish reason and usage are read under both spellings in one place.** `finishReasonOf` and `factsIn` already
read two spellings of the token counts; they gain `stop_reason` and `cache_read_input_tokens` beside them
rather than acquiring a per-dialect branch. Reading both spellings costs one lookup and keeps a fact from
vanishing for whichever dialect the code was not written against — the rule the existing comment in `factsIn`
already states.

**The failure statement is a note, not a bubble.** The Chat tab renders it through the same state-note
treatment every other "nothing to show here" uses, marked as an error and announced — not through
`HopChatBubble`, whose whole job is to say who spoke. *Alternative rejected:* an assistant bubble styled red.
It puts a refusal in the shape reserved for what the model said, and the bubble's role label would be a lie.

**The error message is extracted, the envelope is not shown.** A JSON-RPC error states `error.message`, a
dialect error its own `message`; both are one readable sentence wrapped in codes the reader did not ask for.
Where neither shape matches, nothing is rendered from the bytes and the reader is sent to the raw view, which
is one switch away on the facts line.

## Risks / Trade-offs

- **A messages-dialect body that carries only `thinking` blocks decodes to no text** → It already does today,
  and the response still reports its tool calls and its facts, so the hop does not read as empty. The thinking
  case is named as a non-goal rather than half-handled.
- **Accumulating fragments is O(frames) on a half-megabyte body** → The same budget clamp the other decoders
  use applies, and the frames are parsed once through the existing memoised `framesOf`.
- **Extracting `error.message` hides the error code** → The code is in the recorded bytes, reachable through
  the raw switch that stays on the facts line; the hop's status and reason are already on that line.
- **Two spellings read in one place can collide if a body carries both** → Ordered lookup, first match wins,
  and no body in the sampled traffic carries both. A collision would mean a body mixing two dialects, which
  the endpoint mapping already treats as one dialect.

## Open Questions

None.
