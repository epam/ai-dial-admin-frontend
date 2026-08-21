import { describe, expect, test } from 'vitest';

import { ConversationEntryBodyRow } from '@/src/models/analytics/conversations-trace';
import { jsonRpcArgumentsOf, lastRequestMessageOf } from '@/src/utils/analytics/conversation-bodies';
import { hopTextsOf } from '@/src/utils/analytics/conversation-hop-texts';

const row = (overrides: Partial<ConversationEntryBodyRow> = {}): ConversationEntryBodyRow => ({
  trace_id: 't1',
  event_kind: 'llm_call',
  request_body: null,
  response_body: null,
  assembled_response: null,
  ...overrides,
});

const requestOf = (messages: { role: string; content?: unknown }[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ model: 'gpt', messages, ...extra });

describe('lastRequestMessageOf', () => {
  // The last message is the prompt that produced this hop's response. The rest of an inner agent-loop request
  // is accumulated history that a reader opening one hop is not asking about.
  test('returns the last message a hop sent, not the whole list', () => {
    const body = requestOf([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'answer' },
      { role: 'user', content: 'the actual prompt' },
    ]);

    expect(lastRequestMessageOf(body)).toBe('the actual prompt');
  });

  // The role filter is inherited from the transcript decoder, so this cannot become a second route by which a
  // system prompt or a tool catalogue reaches the screen.
  test('never returns a system message, even when it is the last one', () => {
    const body = requestOf([
      { role: 'user', content: 'what the user asked' },
      { role: 'system', content: 'You are an internal planner. Tools: [...]' },
    ]);

    expect(lastRequestMessageOf(body)).toBe('what the user asked');
  });

  test('ignores a dialect that carries its system prompt outside the message list', () => {
    const body = requestOf([{ role: 'user', content: 'ask' }], { system: 'proprietary prompt' });

    expect(lastRequestMessageOf(body)).toBe('ask');
  });

  // A message whose output went to tool calls carries no content, so the last one with text is the prompt.
  test('skips back over a message that carries no text', () => {
    const body = requestOf([{ role: 'user', content: 'the prompt' }, { role: 'assistant' }]);

    expect(lastRequestMessageOf(body)).toBe('the prompt');
  });

  test('reduces a content-part list to its text', () => {
    const body = requestOf([
      {
        role: 'user',
        content: [{ type: 'text', text: 'part one ' }, { type: 'image' }, { type: 'text', text: 'part two' }],
      },
    ]);

    expect(lastRequestMessageOf(body)).toBe('part one part two');
  });

  test('an unreadable or empty body has no message rather than an empty one', () => {
    expect(lastRequestMessageOf(null)).toBeNull();
    expect(lastRequestMessageOf('not json')).toBeNull();
    expect(lastRequestMessageOf(requestOf([]))).toBeNull();
  });
});

describe('jsonRpcArgumentsOf', () => {
  test('returns a tool call arguments as formatted JSON', () => {
    const body = JSON.stringify({
      method: 'tools/call',
      params: { name: 'rag_search', arguments: { query: 'cyber', top_k: 5 } },
    });

    expect(jsonRpcArgumentsOf(body)).toBe('{\n  "query": "cyber",\n  "top_k": 5\n}');
  });

  // A handshake method has no `arguments`, but its params are still what it sent.
  test('falls back to the params of a call that takes no arguments', () => {
    const body = JSON.stringify({ method: 'initialize', params: { protocolVersion: '2026-01-01' } });

    expect(jsonRpcArgumentsOf(body)).toContain('protocolVersion');
  });

  test('a request with no params, or empty ones, has nothing to show', () => {
    expect(jsonRpcArgumentsOf(JSON.stringify({ method: 'tools/list' }))).toBeNull();
    expect(jsonRpcArgumentsOf(JSON.stringify({ method: 'tools/list', params: {} }))).toBeNull();
    expect(jsonRpcArgumentsOf(null)).toBeNull();
  });
});

describe('hopTextsOf', () => {
  test('reads an llm_call as its last prompt and its assistant text', () => {
    const texts = hopTextsOf(
      row({
        request_body: requestOf([{ role: 'user', content: 'summarise' }]),
        response_body: JSON.stringify({ choices: [{ message: { content: 'a summary' } }] }),
      }),
    );

    expect(texts).toEqual({ sent: 'summarise', received: 'a summary', toolCalls: [] });
  });

  // The producer's assembled response is preferred for an llm_call, exactly as a turn's assistant text is.
  test('prefers the assembled response for an llm_call where the instance persists it', () => {
    const texts = hopTextsOf(
      row({
        request_body: requestOf([{ role: 'user', content: 'ask' }]),
        response_body: 'data: {"choices":[{"delta":{"content":"raw"}}]}\n',
        assembled_response: JSON.stringify({ choices: [{ message: { content: 'assembled' } }] }),
      }),
    );

    expect(texts.received).toBe('assembled');
  });

  // Split on the request side only: the two kinds record structurally different requests, while a response
  // states its own format and is decoded by sniffing it.
  test('reads an mcp hop as its JSON-RPC arguments and its tool result', () => {
    const texts = hopTextsOf(
      row({
        event_kind: 'mcp',
        request_body: JSON.stringify({ method: 'tools/call', params: { arguments: { query: 'sigma' } } }),
        response_body: 'event: message\ndata: {"result":{"content":[{"type":"text","text":"found 3 documents"}]}}\n',
      }),
    );

    expect(texts.sent).toContain('sigma');
    expect(texts.received).toBe('found 3 documents');
  });

  test('decodes a streamed llm_call response by concatenating its deltas', () => {
    const texts = hopTextsOf(
      row({
        request_body: requestOf([{ role: 'user', content: 'ask' }]),
        response_body:
          'data: {"choices":[{"delta":{"content":"one "}}]}\ndata: {"choices":[{"delta":{"content":"two"}}]}\ndata: [DONE]\n',
      }),
    );

    expect(texts.received).toBe('one two');
  });

  // A response with no text put its output in tool_calls, and those names exist only in a body.
  test('names the tools a response requested when it returned no text', () => {
    const texts = hopTextsOf(
      row({
        request_body: requestOf([{ role: 'user', content: 'plan' }]),
        response_body: JSON.stringify({
          choices: [
            {
              message: {
                content: '',
                tool_calls: [{ function: { name: 'get_page' } }, { function: { name: 'finish_iteration' } }],
              },
            },
          ],
        }),
      }),
    );

    expect(texts.received).toBe('');
    expect(texts.toolCalls).toEqual(['get_page', 'finish_iteration']);
  });

  test('a hop that recorded neither body has nothing to show', () => {
    expect(hopTextsOf(row())).toEqual({ sent: null, received: null, toolCalls: [] });
  });
});
