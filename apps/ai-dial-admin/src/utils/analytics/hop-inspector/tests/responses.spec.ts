import { describe, expect, test } from 'vitest';

import {
  ConversationEntryBodyRow,
  HopDialect,
  HopReadState,
  MessageRole,
} from '@/src/models/analytics/conversations-trace';
import { dialectOf, messagesForDialect } from '@/src/utils/analytics/hop-inspector/dialect';
import { responseEnvelopeOf } from '@/src/utils/analytics/hop-inspector/response';
import { responsesMessagesOf } from '@/src/utils/analytics/hop-inspector/responses';

const row = (overrides: Partial<ConversationEntryBodyRow> = {}): ConversationEntryBodyRow => ({
  trace_id: 't1',
  event_kind: '',
  request_uri: '/openai/deployments/x/v1/responses',
  request_body: '{}',
  response_body: null,
  ...overrides,
});

describe('dialectOf :: the Responses endpoint', () => {
  test('resolves /v1/responses to its own dialect rather than to chat completions', () => {
    expect(dialectOf('/openai/deployments/ali.qwen3.7-plus/v1/responses')).toBe(HopDialect.Responses);
  });

  // Zero hops in two weeks, so it stays on the raw fallback rather than being fitted to a guess.
  test('leaves /v1/completions unknown', () => {
    expect(dialectOf('/openai/deployments/x/v1/completions')).toBe(HopDialect.Unknown);
  });
});

describe('responsesMessagesOf', () => {
  // The writing set: `ali.qwen3.7-plus`, span 4f05f9247c298f88, recorded verbatim.
  const WRITING_REQUEST = { model: 'qwen3.7-plus', input: '2+3=?', max_output_tokens: 64, stream: false };

  test('reads a string input as one user message', () => {
    const messages = responsesMessagesOf(WRITING_REQUEST);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: MessageRole.User, text: '2+3=?' });
  });

  // The third dialect in a row carrying its system prompt outside the message list.
  test('reads top-level instructions as a system message ahead of the input', () => {
    const messages = responsesMessagesOf({ instructions: 'be terse', input: 'hi' });

    expect(messages.map(({ role }) => role)).toEqual([MessageRole.System, MessageRole.User]);
    expect(messages[0].text).toBe('be terse');
  });

  // 13 of 199 hops, with 9 carrying typed parts — not rare enough to defer.
  test('reads an array input as one message per item, reducing input_text parts', () => {
    const messages = responsesMessagesOf({
      input: [
        { role: 'user', content: [{ type: 'input_text', text: 'first' }] },
        { role: 'assistant', content: [{ type: 'input_text', text: 'second' }] },
      ],
    });

    expect(messages.map(({ role, text }) => [role, text])).toEqual([
      [MessageRole.User, 'first'],
      [MessageRole.Assistant, 'second'],
    ]);
  });

  // Tool use is unexercised on this endpoint, so an unfamiliar item type is rendered rather than invented
  // handling for or silently hidden — the deny-list rule.
  test('keeps an item type this frontend does not recognise', () => {
    const messages = responsesMessagesOf({ input: [{ type: 'function_call_output', call_id: 'c1', output: 'x' }] });

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe(MessageRole.Other);
    expect(messages[0].bytes).toBeGreaterThan(0);
  });

  test('never reaches for `messages`, which this dialect does not record', () => {
    expect(responsesMessagesOf({ messages: [{ role: 'user', content: 'ignored' }] })).toEqual([]);
  });

  test('is reached through the dialect mapping', () => {
    expect(messagesForDialect(HopDialect.Responses, WRITING_REQUEST)).toHaveLength(1);
  });
});

describe('responseEnvelopeOf :: the Responses shape', () => {
  // The writing set's own assembled response, trimmed to the two output items it recorded.
  const ASSEMBLED = JSON.stringify({
    object: 'response',
    status: 'completed',
    output: [
      { id: 'msg_a', type: 'reasoning', summary: [{ type: 'summary_text', text: 'Thinking: 2+3=5.' }], content: null },
      { id: 'msg_b', type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '5' }] },
    ],
    usage: { input_tokens: 50, output_tokens: 160 },
  });

  // The defect this decode exists for: the column is populated on 199/199 hops, but it holds `output[]` and
  // not `choices[].message`, so the chat-completions decoder found nothing and the tab claimed the hop
  // recorded nothing.
  test('decodes the answer from output items rather than reporting nothing', () => {
    const envelope = responseEnvelopeOf(row({ assembled_response: ASSEMBLED }), HopDialect.Responses);

    expect(envelope.state).toBe(HopReadState.Available);
    expect(envelope.text).toBe('5');
  });

  test('states a reasoning summary separately from the answer', () => {
    const envelope = responseEnvelopeOf(row({ assembled_response: ASSEMBLED }), HopDialect.Responses);

    expect(envelope.reasoningText).toBe('Thinking: 2+3=5.');
    expect(envelope.text).not.toContain('Thinking');
  });

  // This shape states `status`; it has no `finish_reason`.
  test('takes the status where a finish reason does not exist', () => {
    expect(responseEnvelopeOf(row({ assembled_response: ASSEMBLED }), HopDialect.Responses).finishReason).toBe(
      'completed',
    );
  });

  test('a hop whose output carried only reasoning is still available, not empty', () => {
    const reasoningOnly = JSON.stringify({
      status: 'incomplete',
      output: [{ type: 'reasoning', summary: [{ type: 'summary_text', text: 'ran out of budget' }] }],
    });

    const envelope = responseEnvelopeOf(row({ assembled_response: reasoningOnly }), HopDialect.Responses);

    expect(envelope.state).toBe(HopReadState.Available);
    expect(envelope.text).toBeNull();
    expect(envelope.reasoningText).toBe('ran out of budget');
  });

  // The verification set: `anthropic.claude-sonnet-5-ak`, span f1b20c93a065c40b, 18 Aug — a different family,
  // a different day, and the only shape in the sample that streams. Its events are framed by name, and the
  // terminal frame carries the whole response, so no delta accumulation is needed.
  test('decodes a stream from its terminal response.completed frame', () => {
    const streamed = [
      'event: response.created',
      'data: {"type":"response.created","response":{"status":"in_progress","output":[]}}',
      '',
      'event: response.output_text.delta',
      'data: {"type":"response.output_text.delta","delta":"Hi there! How"}',
      '',
      'event: response.completed',
      'data: {"type":"response.completed","response":{"status":"completed","output":[{"type":"message","role":"assistant","content":[{"type":"output_text","text":"Hi there! How can I help you today?"}]}]}}',
      '',
    ].join('\n');

    const envelope = responseEnvelopeOf(row({ response_body: streamed }), HopDialect.Responses);

    expect(envelope.text).toBe('Hi there! How can I help you today?');
    expect(envelope.finishReason).toBe('completed');
  });

  // Span 47ed5589e0cd5d86, `ali.qwen3.7-plus`, 21 Aug — the one hop in 472 that called a tool. Only a
  // `message` item carries text, so without this the reader saw the reasoning and the call was invisible.
  test('names a function_call output item so the call is not invisible', () => {
    const called = JSON.stringify({
      status: 'completed',
      output: [
        { type: 'reasoning', summary: [{ type: 'summary_text', text: 'Call get_current_weather with Paris.' }] },
        {
          type: 'function_call',
          id: 'msg_2052c831',
          call_id: 'call_5782d835',
          name: 'get_current_weather',
          arguments: '{"city": "Paris"}',
        },
      ],
    });

    const envelope = responseEnvelopeOf(row({ assembled_response: called }), HopDialect.Responses);

    expect(envelope.toolCalls).toEqual(['get_current_weather']);
    expect(envelope.state).toBe(HopReadState.Available);
    expect(envelope.text).toBeNull();
  });

  // A chat-completions hop must keep decoding exactly as before.
  test('leaves the chat-completions shape to its own decoder', () => {
    const assembled = JSON.stringify({
      choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'answered' } }],
    });

    const envelope = responseEnvelopeOf(row({ assembled_response: assembled }), HopDialect.ChatCompletions);

    expect(envelope.text).toBe('answered');
    expect(envelope.finishReason).toBe('stop');
    expect(envelope.reasoningText).toBeNull();
  });
});
