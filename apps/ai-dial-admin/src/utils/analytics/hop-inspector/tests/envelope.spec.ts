import { describe, expect, test } from 'vitest';

import { ENVELOPE_BYTE_BUDGET, MESSAGE_TEXT_CLAMP } from '@/src/constants/analytics/conversations-trace';
import { HopDialect, MessageRole } from '@/src/models/analytics/conversations-trace';
import { messagesForDialect } from '@/src/utils/analytics/hop-inspector/dialect';
import { buildRequestEnvelope, withoutBlankEdges } from '@/src/utils/analytics/hop-inspector/envelope';

describe('withoutBlankEdges', () => {
  test('drops a leading newline, which is what a templated prompt records', () => {
    expect(withoutBlankEdges('\nwhere is odesa?')).toBe('where is odesa?');
  });

  test('drops several blank lines at either end', () => {
    expect(withoutBlankEdges('\n\n  \nthe question\n \n\n')).toBe('the question');
  });

  test('keeps the blank lines inside the text, which are the author’s own paragraphs', () => {
    expect(withoutBlankEdges('first\n\nsecond')).toBe('first\n\nsecond');
  });

  // `trim()` would take this indentation with the blank line above it, and a message opening with a code
  // block would lose the shape that makes it readable.
  test('keeps the indentation of the first line that has content', () => {
    expect(withoutBlankEdges('\n    def answer():\n        return 42\n')).toBe('    def answer():\n        return 42');
  });

  test('treats a carriage-return line as blank', () => {
    expect(withoutBlankEdges('\r\nthe question')).toBe('the question');
  });

  test('answers an empty string for text that is blank throughout', () => {
    expect(withoutBlankEdges('\n \n')).toBe('');
    expect(withoutBlankEdges('')).toBe('');
  });

  // Null is a message with no `content` key at all, which is not the same fact as empty content.
  test('leaves a missing text missing', () => {
    expect(withoutBlankEdges(null)).toBeNull();
  });

  test('leaves text with no blank edge untouched', () => {
    expect(withoutBlankEdges('the question')).toBe('the question');
  });
});

describe('messagesForDialect', () => {
  const body = {
    messages: [
      { role: 'system', content: '\n\nYe be a helpful assistant.\n' },
      { role: 'user', content: 'where is odesa?' },
    ],
  };

  test('strips the blank edges of every message it returns', () => {
    const messages = messagesForDialect(HopDialect.ChatCompletions, body);

    expect(messages.map(({ text }) => text)).toEqual(['Ye be a helpful assistant.', 'where is odesa?']);
  });

  // The size is the recorded JSON's, not the rendered text's, so stripping cannot understate what made a
  // request heavy.
  test('leaves the recorded size of a stripped message alone', () => {
    const [system] = messagesForDialect(HopDialect.ChatCompletions, body);
    const [raw] = messagesForDialect(HopDialect.ChatCompletions, {
      messages: [{ role: 'system', content: 'Ye be a helpful assistant.' }],
    });

    expect(system.bytes).toBeGreaterThan(raw.bytes);
  });
});

// A result message carries only the id of the call it answers, so the pairing has to be resolved while the
// whole list is in hand — a reader looking at one message, or a tier-2 read of one, cannot recover it.
describe('buildRequestEnvelope :: the calls a message makes and answers', () => {
  const envelopeOf = (messages: Parameters<typeof buildRequestEnvelope>[0]['messages']) =>
    buildRequestEnvelope({
      dialect: HopDialect.ChatCompletions,
      params: { stated: [] },
      messages,
      recordedBytes: 100,
    });

  const call = (name: string, id: string | null) => ({ name, args: '{}', id });

  const message = (
    role: MessageRole,
    overrides: Partial<Parameters<typeof envelopeOf>[0][number]> = {},
  ): Parameters<typeof envelopeOf>[0][number] => ({
    role,
    text: null,
    toolCalls: [],
    bytes: 50,
    answeredCallIds: [],
    isError: false,
    ...overrides,
  });

  // The clamp rebuilds a call from its parts, so the id has to be among the parts it keeps: without it the
  // request side cannot state which call is which, while the response side still can.
  test('carries the id of each call a message made', () => {
    const { messages } = envelopeOf([
      message(MessageRole.Assistant, { toolCalls: [call('ls', 'c1'), call('cat', 'c2')] }),
    ]);

    expect(messages[0].toolCalls).toEqual([
      { id: 'c1', name: 'ls', args: '{}' },
      { id: 'c2', name: 'cat', args: '{}' },
    ]);
  });

  // A message that does not fit gives up its arguments and keeps the rest. The id costs a handful of
  // characters and is what makes the call legible at all, so it is not among what gets given up.
  test('keeps a call id past the byte budget, having given up only its arguments', () => {
    const filler = 'x'.repeat(MESSAGE_TEXT_CLAMP);
    const spenders = Math.ceil(ENVELOPE_BYTE_BUDGET / MESSAGE_TEXT_CLAMP);
    const { messages, isClamped } = envelopeOf([
      ...Array.from({ length: spenders }, () => message(MessageRole.User, { text: filler })),
      // Its own arguments clamp to the per-message limit, so this one costs as much as a spender and cannot
      // fit in what is left.
      message(MessageRole.Assistant, {
        toolCalls: [{ name: 'ls', args: 'y'.repeat(MESSAGE_TEXT_CLAMP), id: 'c9' }],
      }),
    ]);

    expect(isClamped).toBe(true);
    expect(messages[messages.length - 1].toolCalls).toEqual([{ id: 'c9', name: 'ls', args: null }]);
  });

  // The budget is spent per message, not as a cut-off point: a cheap message after an expensive one still
  // fits, and pretending otherwise would have the envelope withhold what it can afford to send.
  test('still carries a cheap call after the budget has been spent', () => {
    const filler = 'x'.repeat(MESSAGE_TEXT_CLAMP);
    const spenders = Math.ceil(ENVELOPE_BYTE_BUDGET / MESSAGE_TEXT_CLAMP) + 1;
    const { messages, isClamped } = envelopeOf([
      ...Array.from({ length: spenders }, () => message(MessageRole.User, { text: filler })),
      message(MessageRole.Assistant, { toolCalls: [call('ls', 'c9')] }),
    ]);

    expect(isClamped).toBe(true);
    expect(messages[messages.length - 1].toolCalls).toEqual([{ id: 'c9', name: 'ls', args: '{}' }]);
  });

  test('names the tool a result answers', () => {
    const { messages } = envelopeOf([
      message(MessageRole.Assistant, { toolCalls: [call('ls', 'c1')] }),
      message(MessageRole.Tool, { text: 'app/', answeredCallIds: ['c1'] }),
    ]);

    expect(messages[1].answers).toEqual([{ callId: 'c1', toolName: 'ls' }]);
  });

  // Two calls of one tool are answered by two messages that are otherwise identical, so the id has to travel
  // with the name rather than being collapsed into it.
  test('keeps the id of each answer alongside its tool', () => {
    const { messages } = envelopeOf([
      message(MessageRole.Assistant, { toolCalls: [call('ls', 'c1'), call('ls', 'c2')] }),
      message(MessageRole.Tool, { text: 'app/', answeredCallIds: ['c1'] }),
      message(MessageRole.Tool, { text: 'appdata/', answeredCallIds: ['c2'] }),
    ]);

    expect(messages[1].answers).toEqual([{ callId: 'c1', toolName: 'ls' }]);
    expect(messages[2].answers).toEqual([{ callId: 'c2', toolName: 'ls' }]);
  });

  test('pairs every call a single message answers', () => {
    const { messages } = envelopeOf([
      message(MessageRole.Assistant, { toolCalls: [call('ls', 'c1'), call('cat', 'c2')] }),
      message(MessageRole.User, { text: 'both', answeredCallIds: ['c1', 'c2'] }),
    ]);

    expect(messages[1].answers).toEqual([
      { callId: 'c1', toolName: 'ls' },
      { callId: 'c2', toolName: 'cat' },
    ]);
  });

  // The history a client feeds back can reach further than the request itself: an id with no call in this
  // request keeps its place and states no tool, rather than shifting the pairing onto the wrong one.
  test('states no tool for an id no call in this request carries', () => {
    const { messages } = envelopeOf([
      message(MessageRole.Assistant, { toolCalls: [call('ls', 'c1')] }),
      message(MessageRole.Tool, { text: 'x', answeredCallIds: ['gone', 'c1'] }),
    ]);

    expect(messages[1].answers).toEqual([
      { callId: 'gone', toolName: null },
      { callId: 'c1', toolName: 'ls' },
    ]);
  });

  test('ignores a call whose own id was never recorded', () => {
    const { messages } = envelopeOf([
      message(MessageRole.Assistant, { toolCalls: [call('ls', null)] }),
      message(MessageRole.Tool, { text: 'x', answeredCallIds: ['c1'] }),
    ]);

    expect(messages[1].answers).toEqual([{ callId: 'c1', toolName: null }]);
  });

  test('carries the failure flag a message arrived with', () => {
    const { messages } = envelopeOf([message(MessageRole.Tool, { text: 'no such file', isError: true })]);

    expect(messages[0].isError).toBe(true);
  });

  test('answers nothing for a message that quotes no call', () => {
    const { messages } = envelopeOf([message(MessageRole.User, { text: 'where is odesa?' })]);

    expect(messages[0].answers).toEqual([]);
    expect(messages[0].isError).toBe(false);
  });
});
