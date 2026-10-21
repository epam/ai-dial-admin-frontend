import { describe, expect, test } from 'vitest';

import { formatJsonText, formatJsonValue } from '@/src/utils/analytics/hop-inspector/json-text';

describe('formatJsonValue', () => {
  test('serialises a value indented, so both halves of a hop read alike', () => {
    expect(formatJsonValue({ page: 'home' })).toBe('{\n  "page": "home"\n}');
  });
});

describe('formatJsonText', () => {
  // The shape a tool actually returns: one line, with the newlines of its own output escaped inside a string.
  test('formats a document recorded on one line', () => {
    expect(formatJsonText('{"stdout":"one\\ntwo","exit_code":0}')).toBe(
      '{\n  "stdout": "one\\ntwo",\n  "exit_code": 0\n}',
    );
  });

  test('answers text that is not JSON byte for byte', () => {
    const recorded = 'the page could not be read';

    expect(formatJsonText(recorded)).toBe(recorded);
  });

  // A body the clamp cut mid-structure is where reformatting could have swallowed content.
  test('answers a document cut mid-structure unchanged rather than throwing', () => {
    const cut = '{"stdout":"one';

    expect(formatJsonText(cut)).toBe(cut);
  });

  test('answers an empty recording unchanged', () => {
    expect(formatJsonText('')).toBe('');
  });
});
