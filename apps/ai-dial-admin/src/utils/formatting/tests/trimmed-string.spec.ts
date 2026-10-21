import { describe, expect, test } from 'vitest';

import { trimmedString } from '@/src/utils/formatting/trimmed-string';

describe('trimmedString', () => {
  test.each([
    ['  spaced  ', 'spaced'],
    ['', ''],
    ['already', 'already'],
  ])('trims the string %s', (input, expected) => {
    expect(trimmedString(input)).toBe(expected);
  });

  test.each([[5], [true], [{}], [[]], [null], [undefined]])('reads %s as absent rather than throwing', (input) => {
    expect(trimmedString(input)).toBe('');
  });
});
