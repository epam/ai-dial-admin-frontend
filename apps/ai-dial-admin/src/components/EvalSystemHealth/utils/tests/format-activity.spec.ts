import { describe, expect, test } from 'vitest';

import { formatActivityDelta, formatCount } from '@/src/components/EvalSystemHealth/utils/format-activity';

describe('formatCount', () => {
  test.each([
    [0, '0'],
    [47, '47'],
    [1284, '1,284'],
    [1234567, '1,234,567'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatCount(value)).toBe(expected);
  });
});

describe('formatActivityDelta', () => {
  test('prefixes a rise with a plus', () => {
    expect(formatActivityDelta(83)).toBe('+83');
  });

  test('prefixes a fall with a minus', () => {
    expect(formatActivityDelta(-12)).toBe('-12');
  });

  test('groups the thousands of the magnitude', () => {
    expect(formatActivityDelta(-1500)).toBe('-1,500');
  });

  test('returns null for no change', () => {
    expect(formatActivityDelta(0)).toBeNull();
  });

  test('returns null when there is no delta', () => {
    expect(formatActivityDelta(null)).toBeNull();
  });
});
