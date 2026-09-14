import { describe, expect, test } from 'vitest';

import { MessageRole } from '@/src/models/analytics/conversations-trace';
import { chatCompletionsMessagesOf } from '@/src/utils/analytics/hop-inspector/chat-completions';
import {
  NO_MESSAGES_RESPONSE,
  messagesDialectMessagesOf,
  messagesMergedResponseOf,
  messagesStreamedResponseOf,
} from '@/src/utils/analytics/hop-inspector/messages';

describe('chatCompletionsMessagesOf', () => {
  const body = {
    messages: [
      { role: 'system', content: 'You are a quartermaster.' },
      { role: 'user', content: 'who are you?' },
      { role: 'assistant', content: null, tool_calls: [{ id: 'c1', function: { name: 'add', arguments: '{}' } }] },
      { role: 'tool', tool_call_id: 'c1', content: '4' },
    ],
  };

  test('states every message with its own role', () => {
    expect(chatCompletionsMessagesOf(body).map(({ role }) => role)).toEqual([
      MessageRole.System,
      MessageRole.User,
      MessageRole.Assistant,
      MessageRole.Tool,
    ]);
  });

  test('states the system message rather than dropping it', () => {
    expect(chatCompletionsMessagesOf(body)[0].text).toBe('You are a quartermaster.');
  });

  // The message that said nothing: `content` is null and the call is the whole of what it said, so the call
  // travels as content rather than as a size beside an empty card.
  test('carries an assistant call as content, with its arguments', () => {
    const [, , assistant] = chatCompletionsMessagesOf(body);

    expect(assistant.text).toBeNull();
    expect(assistant.toolCalls).toEqual([{ name: 'add', args: '{}', id: 'c1' }]);
    expect(assistant.bytes).toBeGreaterThan(0);
  });

  test('states a tool result as the message text', () => {
    const [, , , tool] = chatCompletionsMessagesOf(body);

    expect(tool.role).toBe(MessageRole.Tool);
    expect(tool.text).toBe('4');
  });

  // The id is the only thing pairing a result with the call it answers: a turn that called one tool three
  // times is answered by three messages that are otherwise identical.
  test('carries the id a result quotes back', () => {
    const [, , , tool] = chatCompletionsMessagesOf(body);

    expect(tool.answeredCallIds).toEqual(['c1']);
  });

  test('answers nothing for a message that quotes no call', () => {
    const [, user] = chatCompletionsMessagesOf(body);

    expect(user.answeredCallIds).toEqual([]);
  });

  // The dialect records no failure flag on a result, so none is claimed.
  test('reports no failure for this dialect’s results', () => {
    expect(chatCompletionsMessagesOf(body).every(({ isError }) => isError === false)).toBe(true);
  });

  test('keeps a call whose id was not recorded', () => {
    const [call] = chatCompletionsMessagesOf({
      messages: [{ role: 'assistant', tool_calls: [{ function: { name: 'add', arguments: '{}' } }] }],
    })[0].toolCalls;

    expect(call).toEqual({ name: 'add', args: '{}', id: null });
  });

  test('a message that called nothing carries no calls', () => {
    expect(chatCompletionsMessagesOf(body)[1].toolCalls).toEqual([]);
  });

  test('reduces a content-part list to its text', () => {
    const parts = {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'a' },
            { type: 'text', text: 'b' },
          ],
        },
      ],
    };

    expect(chatCompletionsMessagesOf(parts)[0].text).toBe('ab');
  });

  test('a body that is not an object yields no messages rather than throwing', () => {
    expect(chatCompletionsMessagesOf(null)).toEqual([]);
    expect(chatCompletionsMessagesOf('text')).toEqual([]);
  });
});

describe('messagesDialectMessagesOf', () => {
  const body = {
    system: 'Ye be Blackbeard.',
    messages: [
      { role: 'user', content: [{ type: 'text', text: 'who are you?' }] },
      {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'considering' },
          { type: 'text', text: 'A pirate.' },
          { type: 'tool_use', id: 't1', name: 'calc', input: {} },
        ],
      },
    ],
  };

  // 99.5% of a 399-hop sample carries the system prompt as a top-level field, not as a message.
  test('presents the top-level system field as a system message', () => {
    const messages = messagesDialectMessagesOf(body);

    expect(messages[0].role).toBe(MessageRole.System);
    expect(messages[0].text).toBe('Ye be Blackbeard.');
  });

  // `tool_use` is this dialect's spelling of a call, and its arguments live under `input` as an object rather
  // than as a JSON string.
  test('reads a tool_use block as a call with serialized arguments', () => {
    const [, , assistant] = messagesDialectMessagesOf(body);

    expect(assistant.text).toBe('A pirate.');
    expect(assistant.toolCalls).toEqual([{ name: 'calc', args: '{}', id: 't1' }]);
  });

  test('reads every call a message answers, not only the first', () => {
    const [message] = messagesDialectMessagesOf({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 't1', content: 'app/' },
            { type: 'tool_result', tool_use_id: 't2', content: 'appdata/' },
          ],
        },
      ],
    });

    expect(message.answeredCallIds).toEqual(['t1', 't2']);
    expect(message.isError).toBe(false);
  });

  // A failed result matters more to a reader debugging an agent loop than its text does, and this is the one
  // dialect that records the flag.
  test('marks a message carrying a failed result', () => {
    const [message] = messagesDialectMessagesOf({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 't1', content: 'ok' },
            { type: 'tool_result', tool_use_id: 't2', content: 'no such file', is_error: true },
          ],
        },
      ],
    });

    expect(message.isError).toBe(true);
  });

  test('claims no failure for a message whose results all succeeded', () => {
    expect(messagesDialectMessagesOf(body).every(({ isError }) => isError === false)).toBe(true);
  });

  // A tool result is content being fed back, not metadata: without it the user turn carrying one reads blank.
  test('reads a tool_result block as the message text', () => {
    const withResult = {
      messages: [
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'the tool said this' }] },
      ],
    };

    expect(messagesDialectMessagesOf(withResult)[0].text).toBe('the tool said this');
  });

  test('a body with no system field states only its messages', () => {
    expect(messagesDialectMessagesOf({ messages: [{ role: 'user', content: 'hi' }] })).toHaveLength(1);
  });

  // The literal `"role":"system"` occurs inside tool results and quoted transcripts in 43% of sampled bodies
  // that carry no system role at all. Matching text would invent a system prompt out of a user's paste.
  test('a quoted role string inside content does not become a message', () => {
    const quoted = {
      messages: [{ role: 'user', content: [{ type: 'text', text: 'the log said {"role":"system"} yesterday' }] }],
    };

    expect(messagesDialectMessagesOf(quoted).map(({ role }) => role)).toEqual([MessageRole.User]);
  });
});

describe('messagesMergedResponseOf', () => {
  const merged = {
    type: 'message',
    role: 'assistant',
    content: [
      { type: 'text', text: 'Security review complete.' },
      { type: 'tool_use', id: 'tu1', name: 'grep', input: { pattern: 'role' } },
    ],
    stop_reason: 'end_turn',
  };

  test('reads the answer from the content blocks', () => {
    expect(messagesMergedResponseOf(merged).text).toBe('Security review complete.');
  });

  test('states a tool-use block as a call, with its arguments and id', () => {
    expect(messagesMergedResponseOf(merged).toolCalls).toEqual([
      { name: 'grep', args: JSON.stringify({ pattern: 'role' }, null, 2), id: 'tu1' },
    ]);
  });

  test('reads the finish reason under this dialect spelling', () => {
    expect(messagesMergedResponseOf(merged).stopReason).toBe('end_turn');
  });

  // The output was the call; a response read as empty here would report the hop as having recorded nothing.
  test('states a response whose only output was a call', () => {
    const response = messagesMergedResponseOf({ content: [{ type: 'tool_use', id: 't', name: 'ls', input: {} }] });

    expect(response.text).toBeNull();
    expect(response.toolCalls).toHaveLength(1);
  });

  // Thinking is not the answer, and this change does not state it separately — so it yields no text rather
  // than being merged into the reply.
  test('yields no text for a response of thinking blocks alone', () => {
    expect(messagesMergedResponseOf({ content: [{ type: 'thinking', thinking: 'weighing it' }] }).text).toBeNull();
  });

  test('yields nothing for a value that is not a message', () => {
    expect(messagesMergedResponseOf('not a message')).toEqual(NO_MESSAGES_RESPONSE);
  });
});

describe('messagesStreamedResponseOf', () => {
  const frames = [
    { type: 'message_start', message: { role: 'assistant', content: [] } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'We' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: "'re exploring" } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 47 } },
    { type: 'message_stop' },
  ];

  test('concatenates the text fragments in arrival order', () => {
    expect(messagesStreamedResponseOf(frames).text).toBe("We're exploring");
  });

  test('reads the finish reason from the message-delta frame', () => {
    expect(messagesStreamedResponseOf(frames).stopReason).toBe('end_turn');
  });

  // Two calls streaming interleaved: keyed by block index, their argument fragments cannot splice together.
  test('accumulates each call arguments under its own block index', () => {
    const calls = messagesStreamedResponseOf([
      { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'a', name: 'read' } },
      { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'b', name: 'write' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"path":' } },
      { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"path":"b"}' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '"a"}' } },
    ]).toolCalls;

    expect(calls).toEqual([
      { name: 'read', args: JSON.stringify({ path: 'a' }, null, 2), id: 'a' },
      { name: 'write', args: JSON.stringify({ path: 'b' }, null, 2), id: 'b' },
    ]);
  });

  // A body cut mid-call: the fragment is what the model was asking for, so it is stated as recorded.
  test('states a truncated argument fragment as recorded', () => {
    const [call] = messagesStreamedResponseOf([
      { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'a', name: 'read' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"path":' } },
    ]).toolCalls;

    expect(call.args).toBe('{"path":');
  });

  test('yields nothing for frames carrying no content', () => {
    expect(messagesStreamedResponseOf([{ type: 'ping' }, 'not a frame'])).toEqual(NO_MESSAGES_RESPONSE);
  });
});
