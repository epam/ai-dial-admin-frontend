import { describe, expect, test } from 'vitest';

import { extractStreamText } from '@/src/components/TryOut/Deployment/utils/extract-stream-text';

describe('extractStreamText', () => {
  test('joins chat completions deltas', () => {
    expect(
      extractStreamText([
        { data: { choices: [{ delta: { content: 'Hel' } }] } },
        { data: { choices: [{ delta: { role: 'assistant' } }] } },
        { data: { choices: [{ delta: { content: 'lo' } }] } },
      ]),
    ).toBe('Hello');
  });

  test('joins Responses text deltas and ignores other events', () => {
    expect(
      extractStreamText([
        { event: 'response.created', data: { response: {} } },
        { event: 'response.output_text.delta', data: { delta: 'Hi ' } },
        { event: 'response.output_text.delta', data: { delta: 'there' } },
        { event: 'response.completed', data: {} },
      ]),
    ).toBe('Hi there');
  });

  test('joins Messages text deltas and ignores other block deltas', () => {
    expect(
      extractStreamText([
        { event: 'message_start', data: { message: {} } },
        { event: 'content_block_delta', data: { delta: { type: 'text_delta', text: 'Hey' } } },
        { event: 'content_block_delta', data: { delta: { type: 'input_json_delta', partial_json: '{' } } },
      ]),
    ).toBe('Hey');
  });

  test('ignores events with text or malformed data', () => {
    expect(
      extractStreamText([
        { data: 'plain text' },
        { data: null },
        { data: { choices: [] } },
        { data: { choices: [null] } },
        { event: 'response.output_text.delta', data: { delta: 5 } },
      ]),
    ).toBe('');
  });

  test('is empty for no events', () => {
    expect(extractStreamText([])).toBe('');
  });
});
