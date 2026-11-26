import { describe, expect, test } from 'vitest';

import { createSseParser } from '@/src/components/TryOut/utils/sse-parser';

describe('createSseParser', () => {
  test('parses JSON data events', () => {
    const parser = createSseParser();

    expect(parser.push('data: {"a":1}\n\ndata: {"a":2}\n\n')).toEqual([{ data: { a: 1 } }, { data: { a: 2 } }]);
  });

  test('keeps the event name', () => {
    expect(createSseParser().push('event: message_start\ndata: {"x":1}\n\n')).toEqual([
      { event: 'message_start', data: { x: 1 } },
    ]);
  });

  test('joins an event that arrives in several chunks', () => {
    const parser = createSseParser();

    expect(parser.push('data: {"a"')).toEqual([]);
    expect(parser.push(':1}\n')).toEqual([]);
    expect(parser.push('\n')).toEqual([{ data: { a: 1 } }]);
  });

  test('handles CRLF line endings', () => {
    expect(createSseParser().push('data: {"a":1}\r\n\r\n')).toEqual([{ data: { a: 1 } }]);
  });

  test('keeps non-JSON data as text and joins multi-line data', () => {
    expect(createSseParser().push('data: hello\ndata: world\n\n')).toEqual([{ data: 'hello\nworld' }]);
  });

  test('skips the [DONE] marker, comments and blocks without data', () => {
    expect(createSseParser().push('data: [DONE]\n\n: keep-alive\n\nevent: ping\n\n')).toEqual([]);
  });

  test('flush returns an event the stream ended in the middle of', () => {
    const parser = createSseParser();
    parser.push('data: {"a":1}');

    expect(parser.flush()).toEqual([{ data: { a: 1 } }]);
    expect(parser.flush()).toEqual([]);
  });
});
