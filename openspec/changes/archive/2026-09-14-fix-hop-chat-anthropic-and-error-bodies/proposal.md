## Why

A hop recorded in the messages dialect renders an empty answer. The inspector already chooses a parser per
endpoint and already parses that dialect's **request**, but `responseEnvelopeOf` branches on one dialect only:
`Responses` gets its own decoder and everything else falls through to the chat-completions path, which reads
`choices[].message` and `choices[].delta.content`. A messages-dialect response carries neither — its assembled
form is a top-level message whose `content[]` holds typed blocks, and its streamed form is `content_block_delta`
frames. The Chat tab therefore states nothing for the heaviest agentic traffic in the log, while the whole
answer sits one tab away in Raw.

The same fall-through costs two facts on every hop of that dialect: the finish reason, which it spells
`stop_reason` rather than `choices[0].finish_reason`, and the cached-prompt count, which it reports as
`cache_read_input_tokens` at the top of `usage` rather than under a `*_tokens_details` member.

A failed hop is the second gap. Its recorded body is the error payload the caller actually received — a
JSON-RPC error object, or a bare string — and the Chat tab renders no trailing turn at all, so the one
question a reader opens a failed hop to ask is answered by an empty panel.

## What Changes

- The messages dialect gets its own response decoder, reached from the same endpoint mapping the request side
  already uses: text from `content[]` text blocks, tool calls from `tool_use` blocks, finish reason from
  `stop_reason`, usage from the keys that dialect spells. Its streamed form reassembles from
  `content_block_delta` frames, with tool arguments accumulated from `input_json_delta` fragments.
- The recorded fallback learns that dialect as a fourth format, alongside the three it decodes today. The
  preferred source is unchanged: the assembled column first, the recorded body when it is absent or is not
  parseable JSON — which for this dialect includes the case where the column stores a frame transcript rather
  than a merged object.
- A failed hop states its recorded error in the Chat tab, marked as a failure rather than dressed as an
  assistant turn. Where the body carries a structured error, its message is stated; where it carries an
  unstructured value, the tab says the hop failed and sends the reader to the recorded bytes.
- **Non-goal:** separating the model's thinking from its answer. The dialect marks it (`thinking` blocks,
  `thinking_delta` frames) and doing so would settle an open question about agent traces, but it changes what
  the history looks like and is scoped on its own.
- **Non-goal:** the Responses dialect, the chat-completions dialect and the MCP path. Their decoders are
  untouched.

## Found while implementing

The inspector's body columns had moved into the `dial_usage_log_payload` enrichment, and the frontend still
named them bare — `request_body` rather than `dial_usage_log_payload.request_body`. Nothing matched in the
fetched schema, so the grant read as "bodies are not readable for this account" **on every account** and the
Request, Response and Chat tabs were withdrawn altogether. Fixed here rather than deferred, because no
scenario of this change is observable while it holds: the three names are qualified, and the namespace is
stripped once where the row is read, since a projection alias is not honoured on a row read. No requirement
changes — a column's address is not behaviour — but the PR carries the fix.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/conversation-trace-detail`: the assistant-text requirement admits a fourth recorded format and
  stops describing the answer as a first choice's message; the dialect requirement states that the messages
  dialect's **response** is parsed by its own decoder, with the finish reason and the usage keys that dialect
  spells; the failed-hop case gains a stated error in the Chat tab where today the requirement forbids any
  trailing turn.

## Impact

- `src/utils/analytics/hop-inspector/messages.ts` — response decoding beside the request decoding already
  there; the block readers it exports are reused rather than duplicated.
- `src/utils/analytics/hop-inspector/response.ts` — a third branch in `responseEnvelopeOf`, and usage-key
  coverage in `factsIn`/`cachedTokensIn`.
- `src/utils/analytics/hop-inspector/failure.ts` — the recorded error's message, from the three shapes the log
  stores it in.
- `src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatPanel.tsx` — the failed-hop statement,
  and `HopStateNote.tsx` for the treatment it is stated in.
- `src/utils/analytics/conversation-bodies.ts` is **not** touched: the dialect mapping routes a messages-dialect
  hop before that fallback is reached, so teaching it a fourth format would add a branch nothing reaches.
- The column move above does reach further: `conversation-column-catalog.ts` resolves the grant by column name,
  `actions.ts` strips the namespace off the read row, `conversations-queries.ts` takes the resolved names, and
  `conversation-enrichment.ts` gains the helper both sides share. No new column, query shape or schema gate —
  the same two columns, addressed by whichever name the instance publishes them under.
