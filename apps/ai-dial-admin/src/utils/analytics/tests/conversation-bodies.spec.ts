import { describe, expect, test } from 'vitest';

import { ConversationEntryBodyRow, MessageRole } from '@/src/models/analytics/conversations-trace';
import {
  assistantTextOf,
  decodeJsonRpcStream,
  decodeResponseBody,
  decodeSingleCompletion,
  decodeStreamedChunks,
  messageTextOf,
  toolCallNamesOf,
  toolCallRequestsOf,
} from '@/src/utils/analytics/conversation-bodies';

const row = (overrides: Partial<ConversationEntryBodyRow> = {}): ConversationEntryBodyRow => ({
  trace_id: 't1',
  event_kind: 'llm_call',
  request_body: null,
  response_body: null,
  ...overrides,
});

// The shapes below are the ones a live instance writes, kept verbatim in structure so a change in the
// producer shows up here rather than in the view.
const completion = (message: Record<string, unknown>): string =>
  JSON.stringify({ id: 'c1', object: 'chat.completion', choices: [{ index: 0, finish_reason: 'stop', message }] });

const sse = (...frames: unknown[]): string =>
  [...frames.map((frame) => `data: ${JSON.stringify(frame)}`), 'data: [DONE]', ''].join('\n\n');

const deltaFrame = (content: string) => ({ choices: [{ index: 0, delta: { content } }] });

describe('messageTextOf', () => {
  test('reads a string content', () => {
    expect(messageTextOf({ role: 'user', content: 'hello' })).toBe('hello');
  });

  test('reduces a content-part list to its text, in order', () => {
    const content = [
      { type: 'text', text: 'first ' },
      { type: 'text', text: 'second' },
    ];

    expect(messageTextOf({ role: 'user', content })).toBe('first second');
  });

  test('ignores a part that carries no text', () => {
    const content = [
      { type: 'image', source: {} },
      { type: 'text', text: 'caption' },
    ];

    expect(messageTextOf({ role: 'user', content })).toBe('caption');
  });

  // The distinction the view depends on: an absent key is output that went elsewhere, an empty string is a
  // message that genuinely said nothing.
  test('distinguishes an absent content key from an empty string', () => {
    expect(messageTextOf({ role: 'assistant', tool_calls: [] })).toBeUndefined();
    expect(messageTextOf({ role: 'assistant', content: '' })).toBe('');
  });

  test('reports no text for a part list with nothing text-bearing', () => {
    expect(messageTextOf({ role: 'user', content: [{ type: 'image' }] })).toBeUndefined();
  });
});

describe('decodeSingleCompletion', () => {
  test('reads the first choice message content', () => {
    expect(decodeSingleCompletion(completion({ role: 'assistant', content: 'the answer' }))).toBe('the answer');
  });

  test('reports empty text for a message whose output was in tool calls', () => {
    const raw = completion({ role: 'assistant', tool_calls: [{ function: { name: 'Bash' } }] });

    expect(decodeSingleCompletion(raw)).toBe('');
  });

  test('reports nothing for a body with no choices', () => {
    expect(decodeSingleCompletion('{"id":"c1"}')).toBeNull();
    expect(decodeSingleCompletion('not json')).toBeNull();
  });
});

describe('decodeStreamedChunks', () => {
  test('concatenates the content deltas in arrival order', () => {
    const raw = sse(
      { choices: [{ index: 0, delta: { role: 'assistant' } }] },
      deltaFrame('Alright, '),
      deltaFrame('lets go.'),
      { choices: [{ index: 0, finish_reason: 'stop', delta: {} }] },
    );

    expect(decodeStreamedChunks(raw)).toBe('Alright, lets go.');
  });

  test('reports empty text for a stream that carried only a role and a finish reason', () => {
    const raw = sse({ choices: [{ index: 0, delta: { role: 'assistant' } }] });

    expect(decodeStreamedChunks(raw)).toBe('');
  });

  test('reports nothing for a body with no frames', () => {
    expect(decodeStreamedChunks('')).toBeNull();
    expect(decodeStreamedChunks('data: [DONE]\n\n')).toBeNull();
  });
});

describe('decodeJsonRpcStream', () => {
  test('concatenates the result content parts', () => {
    const raw = sse({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: 'page one' }] } });

    expect(decodeJsonRpcStream(raw)).toBe('page one');
  });

  test('joins parts across frames', () => {
    const raw = sse(
      { result: { content: [{ type: 'text', text: 'a' }] } },
      { result: { content: [{ type: 'text', text: 'b' }] } },
    );

    expect(decodeJsonRpcStream(raw)).toBe('ab');
  });

  test('reports nothing for a body with no frames', () => {
    expect(decodeJsonRpcStream('{}')).toBeNull();
  });
});

// The format is read off the body, never off the hop: there is no streaming column on the hop log, and the
// request body's `stream` flag is a different column that may be absent or withheld.
describe('decodeResponseBody', () => {
  test('decodes a streamed completion without consulting the event kind', () => {
    const streamed = row({ event_kind: null, response_body: sse(deltaFrame('streamed')) });

    expect(decodeResponseBody(streamed)).toBe('streamed');
  });

  test('decodes a single object', () => {
    expect(decodeResponseBody(row({ response_body: completion({ content: 'single' }) }))).toBe('single');
  });

  test('decodes a JSON-RPC stream for an MCP hop', () => {
    const mcp = row({
      event_kind: 'mcp',
      response_body: sse({ result: { content: [{ type: 'text', text: 'tool result' }] } }),
    });

    expect(decodeResponseBody(mcp)).toBe('tool result');
  });

  // An MCP hop that answered with a completion, or a completion hop that answered with JSON-RPC, decodes on
  // its own shape rather than being mislabelled by its event kind.
  test('decodes a JSON-RPC stream even where the event kind says otherwise', () => {
    const mislabelled = row({
      event_kind: 'llm_call',
      response_body: sse({ result: { content: [{ type: 'text', text: 'rpc' }] } }),
    });

    expect(decodeResponseBody(mislabelled)).toBe('rpc');
  });

  test('reports nothing for a null, empty or unparseable body', () => {
    expect(decodeResponseBody(row())).toBeNull();
    expect(decodeResponseBody(row({ response_body: '   ' }))).toBeNull();
    expect(decodeResponseBody(row({ response_body: 'garbage' }))).toBeNull();
  });
});

describe('assistantTextOf', () => {
  test('prefers the assembled response where it is present and usable', () => {
    const both = row({
      assembled_response: completion({ role: 'assistant', content: 'assembled' }),
      response_body: sse(deltaFrame('raw')),
    });

    expect(assistantTextOf(both)).toBe('assembled');
  });

  // The fallback is an ordinary operating mode: the column is null for every row ingested before the producer
  // began writing it, and hop rows live a year.
  test('falls back to the raw body when the assembled response is null', () => {
    const nulled = row({ assembled_response: null, response_body: sse(deltaFrame('raw')) });

    expect(assistantTextOf(nulled)).toBe('raw');
  });

  test('falls back to the raw body when the assembled column is absent entirely', () => {
    const absent = row({ response_body: completion({ content: 'raw' }) });

    expect('assembled_response' in absent).toBe(false);
    expect(assistantTextOf(absent)).toBe('raw');
  });

  // Measured on a live row: the column stores a value that is not JSON, which the producer's own contract
  // allows.
  test('falls back to the raw body when the assembled response is not JSON', () => {
    const notJson = row({
      assembled_response: 'data: {"choices":[{"delta":{"content":"x"}}]}',
      response_body: completion({ content: 'raw' }),
    });

    expect(assistantTextOf(notJson)).toBe('raw');
  });

  test('falls back when the assembled response parses but carries no text', () => {
    const toolCalls = row({
      assembled_response: completion({ role: 'assistant', tool_calls: [{ function: { name: 'Bash' } }] }),
      response_body: completion({ content: 'raw' }),
    });

    expect(assistantTextOf(toolCalls)).toBe('raw');
  });

  test('reports nothing when neither source yields text', () => {
    expect(assistantTextOf(row({ assembled_response: 'not json', response_body: 'not json' }))).toBeNull();
    expect(assistantTextOf(row())).toBeNull();
  });
});

describe('toolCallNamesOf', () => {
  test('names the tools a response requested', () => {
    const raw = completion({
      role: 'assistant',
      tool_calls: [{ function: { name: 'Bash' } }, { function: { name: 'get_page' } }],
    });

    expect(toolCallNamesOf(raw)).toEqual(['Bash', 'get_page']);
  });

  test('names nothing for a response with no tool calls', () => {
    expect(toolCallNamesOf(completion({ content: 'text' }))).toEqual([]);
    expect(toolCallNamesOf(null)).toEqual([]);
    expect(toolCallNamesOf('not json')).toEqual([]);
  });
});

// A streamed response carries no `message.tool_calls` at all: each chunk contributes a fragment under
// `delta.tool_calls`, keyed by the slot it belongs to. 9 of one turn's 43 model responses were streamed and 2
// of its 85 tool requests lived only here — read from `message` alone, a streamed call that asked for a tool
// looked like a call that asked for nothing.
describe('toolCallRequestsOf — streamed responses', () => {
  const frames = (...payloads: unknown[]) =>
    payloads.map((payload) => `data: ${JSON.stringify(payload)}`).join('\n') + '\ndata: [DONE]\n';

  test('assembles a streamed tool request from its deltas', () => {
    const body = frames(
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'rag_search', arguments: '{"q":' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"cyber"}' } }] } }] },
    );

    expect(toolCallRequestsOf(body)).toEqual([{ name: 'rag_search', args: '{"q":"cyber"}', id: null }]);
  });

  test('keeps the id the first chunk of a slot carried', () => {
    const body = frames(
      { choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'rag_search' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{}' } }] } }] },
    );

    expect(toolCallRequestsOf(body)).toEqual([{ name: 'rag_search', args: '{}', id: 'call_1' }]);
  });

  // The index identifies the slot, so two concurrent requests do not merge into one.
  test('keeps separate slots separate, in the order the model asked', () => {
    const body = frames(
      { choices: [{ delta: { tool_calls: [{ index: 1, function: { name: 'second' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'first' } }] } }] },
    );

    expect(toolCallRequestsOf(body).map(({ name }) => name)).toEqual(['first', 'second']);
  });

  test('a non-streamed response is still read from its message', () => {
    const body = JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name: 'get_page' } }] } }] });

    expect(toolCallRequestsOf(body).map(({ name }) => name)).toEqual(['get_page']);
  });

  test('a stream that requested nothing yields nothing', () => {
    expect(toolCallRequestsOf(frames({ choices: [{ delta: { content: 'words' } }] }))).toEqual([]);
  });

  test('a slot that never carried a name is dropped rather than named empty', () => {
    const body = frames({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{}' } }] } }] });

    expect(toolCallRequestsOf(body)).toEqual([]);
  });
});
